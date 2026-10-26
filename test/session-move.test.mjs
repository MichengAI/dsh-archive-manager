import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import zlib from "node:zlib";
import { moveSessionToWorkspace } from "../src/session-move.js";

const CHECKSUM_OPTS = { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } };

function createZstdLog(header, events = []) {
	const f0 = zlib.zstdCompressSync(Buffer.from(JSON.stringify(header) + "\n", "utf8"), CHECKSUM_OPTS);
	const eventFrames = events.map((e) =>
		zlib.zstdCompressSync(Buffer.from(JSON.stringify(e) + "\n", "utf8"), CHECKSUM_OPTS)
	);
	return Buffer.concat([f0, ...eventFrames]);
}

test("会话跨工作区移动：入参非法与特殊会话类型前置准入校验", async () => {
	await assert.rejects(
		() => moveSessionToWorkspace({}, "", "ws-2"),
		/sessionId/
	);
	await assert.rejects(
		() => moveSessionToWorkspace({}, "s1", ""),
		/targetWorkspaceId/
	);

	// 子代理禁止跨工作区移动
	const mockSubagentRegistry = {
		list: () => [{ id: "ws-2", path: "D:\\ws-2", sessionIds: [] }],
		readSessionHeader: async () => ({ id: "s-sub", origin: "subagent", cwd: "D:\\ws-1" }),
	};
	const subCtx = {
		workspaceRegistry: mockSubagentRegistry,
		sessions: { get: () => undefined },
	};
	await assert.rejects(
		() => moveSessionToWorkspace(subCtx, "s-sub", "ws-2"),
		/子代理.*不支持跨工作区移动/
	);

	// 活跃会话拒绝移动（避免写损坏与破坏运行时执行环境）
	const mockLiveRegistry = {
		list: () => [{ id: "ws-2", path: "D:\\ws-2", sessionIds: [] }],
		readSessionHeader: async () => ({ id: "s-live", cwd: "D:\\ws-1" }),
	};
	const liveCtx = {
		workspaceRegistry: mockLiveRegistry,
		sessions: { get: (id) => (id === "s-live" ? { id: "s-live", running: true } : undefined) },
	};
	await assert.rejects(
		() => moveSessionToWorkspace(liveCtx, "s-live", "ws-2"),
		/正处于打开或运行状态/
	);
});

test("会话跨工作区移动：目标路径与当前 cwd 相同时直接归并，不重写物理文件", async () => {
	let detached = [];
	let attached = [];
	const ws1 = {
		id: "ws-1",
		title: "项目1",
		path: "D:\\shared-path",
		sessionIds: ["s-same"],
		async detachSession(id) { detached.push(id); },
	};
	const ws2 = {
		id: "ws-2",
		title: "项目2",
		path: "D:\\shared-path",
		sessionIds: [],
		async attachSession(id) { attached.push(id); },
	};
	const mockRegistry = {
		list: () => [ws1, ws2],
		readSessionHeader: async () => ({ id: "s-same", cwd: "D:\\shared-path" }),
		sessionPaths: new Map([["s-same", "D:\\shared-path"]]),
		headers: new Map(),
	};
	let coldSnapshotId = null;
	const mockCache = {
		coldSnapshot: async (id) => { coldSnapshotId = id; },
	};
	const ctx = {
		workspaceRegistry: mockRegistry,
		sessionProjectionCache: mockCache,
		sessions: { get: () => undefined },
		sessionPersistence: {
			open: async () => ({ async close() {} }),
		},
	};

	const res = await moveSessionToWorkspace(ctx, "s-same", "ws-2");
	assert.equal(res.ok, true);
	assert.equal(res.moved, true);
	assert.equal(res.alreadyCwd, true);
	assert.equal(res.toWorkspaceId, "ws-2");
	assert.deepEqual(detached, ["s-same"]);
	assert.deepEqual(attached, ["s-same"]);
	assert.equal(coldSnapshotId, "s-same");
});

test("会话跨工作区物理迁移：影子改写、回读自检、原子切换与冷缓存自愈", async () => {
	const tempDir = await mkdtemp(join(tmpdir(), "dsham-move-test-"));
	try {
		const sourceProject = join(tempDir, "proj-a");
		const targetProject = join(tempDir, "proj-b");
		const sessionsRoot = join(tempDir, "sessions");
		await mkdir(sourceProject, { recursive: true });
		await mkdir(targetProject, { recursive: true });
		await mkdir(sessionsRoot, { recursive: true });

		const sessionId = "session-move-1";
		// 创建源会话工件
		const sourceSessionDir = join(sessionsRoot, "--proj-a--", sessionId);
		await mkdir(sourceSessionDir, { recursive: true });
		const sourceLog = join(sourceSessionDir, "session.v2.jsonl.zstd");

		const header = { type: "session", id: sessionId, cwd: sourceProject, version: 2 };
		const events = [
			{ type: "user/message", seq: 0, text: "你好" },
			{ type: "assistant/message", seq: 1, text: "世界" },
		];
		await writeFile(sourceLog, createZstdLog(header, events));

		const wsA = {
			id: "ws-a",
			title: "项目A",
			path: sourceProject,
			sessionIds: [sessionId],
			async detachSession(id) { this.sessionIds = this.sessionIds.filter((x) => x !== id); },
		};
		const wsB = {
			id: "ws-b",
			title: "项目B",
			path: targetProject,
			sessionIds: [],
			async attachSession(id) { this.sessionIds.push(id); },
		};

		const mockRegistry = {
			list: () => [wsA, wsB],
			readSessionHeader: async (id) => (id === sessionId ? header : undefined),
			sessionPaths: new Map([[sessionId, sourceProject]]),
			headers: new Map([[sessionId, header]]),
			invalidSessionPaths: new Map(),
		};

		let coldSnapshotId = null;
		const mockCache = {
			coldSnapshot: async (id) => { coldSnapshotId = id; },
		};

		const mockPersistence = {
			name: "session-persistence-jsonl",
			root: sessionsRoot,
			async open(id, access) {
				if (access === "write") return { async close() {} };
				return {
					header,
					inheritedEventCount: 0,
					async read() { return { events }; },
					async close() {},
				};
			},
			locate(h) {
				const projKey = h.cwd === targetProject ? "--proj-b--" : "--proj-a--";
				return { kind: "jsonl", path: join(sessionsRoot, projKey, sessionId, "session.v2.jsonl.zstd") };
			},
		};

		const ctx = {
			workspaceRegistry: mockRegistry,
			sessionProjectionCache: mockCache,
			sessionPersistence: mockPersistence,
			sessions: { get: () => undefined },
		};

		const result = await moveSessionToWorkspace(ctx, sessionId, "ws-b");
		assert.equal(result.ok, true);
		assert.equal(result.moved, true);
		assert.equal(result.toWorkspaceId, "ws-b");
		assert.equal(wsA.sessionIds.includes(sessionId), false);
		assert.equal(wsB.sessionIds.includes(sessionId), true);
		assert.equal(coldSnapshotId, sessionId);

		// 检查物理文件：源会话目录应已移除
		let sourceExists = true;
		try { await stat(sourceLog); } catch { sourceExists = false; }
		assert.equal(sourceExists, false, "源日志应该已经移出");

		// 目标会话文件应已生成并拥有改写后的 Header
		const targetLog = join(sessionsRoot, "--proj-b--", sessionId, "session.v2.jsonl.zstd");
		const targetContent = await readFile(targetLog);
		// 解压第一帧
		const f0 = zlib.zstdDecompressSync(targetContent);
		const f0Json = JSON.parse(f0.toString("utf8").split("\n")[0]);
		assert.equal(f0Json.id, sessionId);
		assert.equal(f0Json.cwd, targetProject, "Header cwd 必须更新为目标路径");
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});

test("会话跨工作区物理迁移：目标冲突拒绝且中途失败自动原子回滚", async () => {
	const tempDir = await mkdtemp(join(tmpdir(), "dsham-move-conflict-"));
	try {
		const sourceProject = join(tempDir, "proj-a");
		const targetProject = join(tempDir, "proj-b");
		const sessionsRoot = join(tempDir, "sessions");
		await mkdir(sourceProject, { recursive: true });
		await mkdir(targetProject, { recursive: true });
		await mkdir(sessionsRoot, { recursive: true });

		const sessionId = "session-conflict-1";
		const sourceSessionDir = join(sessionsRoot, "--proj-a--", sessionId);
		await mkdir(sourceSessionDir, { recursive: true });
		const sourceLog = join(sourceSessionDir, "session.v2.jsonl.zstd");
		const header = { type: "session", id: sessionId, cwd: sourceProject, version: 2 };
		await writeFile(sourceLog, createZstdLog(header, []));

		// 预先在目标位置放置一个同名冲突文件
		const targetSessionDir = join(sessionsRoot, "--proj-b--", sessionId);
		await mkdir(targetSessionDir, { recursive: true });
		const targetLog = join(targetSessionDir, "session.v2.jsonl.zstd");
		await writeFile(targetLog, "conflict");

		const wsA = { id: "ws-a", path: sourceProject, sessionIds: [sessionId], async detachSession() {} };
		const wsB = { id: "ws-b", path: targetProject, sessionIds: [], async attachSession() {} };

		const ctx = {
			workspaceRegistry: {
				list: () => [wsA, wsB],
				readSessionHeader: async () => header,
			},
			sessionPersistence: {
				name: "session-persistence-jsonl",
				root: sessionsRoot,
				async open() { return { async close() {} }; },
				locate(h) {
					const projKey = h.cwd === targetProject ? "--proj-b--" : "--proj-a--";
					return { kind: "jsonl", path: join(sessionsRoot, projKey, sessionId, "session.v2.jsonl.zstd") };
				},
			},
			sessions: { get: () => undefined },
		};

		await assert.rejects(
			() => moveSessionToWorkspace(ctx, sessionId, "ws-b"),
			/目标工作区已存在同名会话工件/
		);

		// 原文件应完好无损
		const stillSource = await readFile(sourceLog);
		assert.ok(stillSource.length > 0);
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});
