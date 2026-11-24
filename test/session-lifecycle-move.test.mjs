import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import zlib from "node:zlib";
import { moveSessionToWorkspace } from "../src/session-move.js";
import { installSessionLifecycle, lifecycleFor } from "../src/session-lifecycle.js";

const CHECKSUM_OPTS = { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } };

function createZstdLog(header, events = []) {
	const f0 = zlib.zstdCompressSync(Buffer.from(JSON.stringify(header) + "\n", "utf8"), CHECKSUM_OPTS);
	const eventFrames = events.map((e) =>
		zlib.zstdCompressSync(Buffer.from(JSON.stringify(e) + "\n", "utf8"), CHECKSUM_OPTS)
	);
	return Buffer.concat([f0, ...eventFrames]);
}

test("生命周期拦截与安全跨工作区迁移：空闲驻留会话释放、物理迁移、恢复与 CWD 对齐", async () => {
	const tempDir = await mkdtemp(join(tmpdir(), "dsham-lifecycle-move-"));
	try {
		const sourceProject = join(tempDir, "proj-source");
		const targetProject = join(tempDir, "proj-target");
		const sessionsRoot = join(tempDir, "sessions");
		await mkdir(sourceProject, { recursive: true });
		await mkdir(targetProject, { recursive: true });

		const sessionId = "session-lifecycle-1";
		const sourceLog = join(sessionsRoot, "--proj-source--", sessionId, "session.v2.jsonl.zstd");
		const targetLog = join(sessionsRoot, "--proj-target--", sessionId, "session.v2.jsonl.zstd");
		await mkdir(dirname(sourceLog), { recursive: true });

		const header = { id: sessionId, cwd: sourceProject, version: 2 };
		await writeFile(sourceLog, createZstdLog(header, [{ type: "workspace-root/change", data: { cwd: sourceProject } }]));

		let disposed = false;
		let reloadedId = null;
		let setDirectory = null;

		const mockAgent = {
			id: sessionId,
			busy: false,
			status: "idle",
			session: {
				id: sessionId,
				running: false,
				status: "idle",
				header: { ...header },
			},
			send: () => {},
		};

		const activeHandles = new Map();
		const agentsStore = new Map([[sessionId, mockAgent]]);

		const agentsService = {
			get: (id) => agentsStore.get(id),
			create: async (opts) => {
				const handle = {
					agent: mockAgent,
					dispose: async () => {
						disposed = true;
						agentsStore.delete(sessionId);
						sessionsStore.delete(sessionId);
					},
				};
				activeHandles.set(sessionId, handle);
				return handle;
			},
			resume: async (opts) => {
				const handle = {
					agent: mockAgent,
					dispose: async () => {
						disposed = true;
						agentsStore.delete(sessionId);
						sessionsStore.delete(sessionId);
					},
				};
				activeHandles.set(sessionId, handle);
				return handle;
			},
		};

		const sessionsStore = new Map([[sessionId, mockAgent.session]]);
		const sessionsService = {
			get: (id) => sessionsStore.get(id),
		};

		const uninstallLifecycle = installSessionLifecycle({ agents: agentsService });

		// 模拟先通过 create/resume 捕获 handle
		await agentsService.resume({ resumeSessionId: sessionId });
		assert.ok(lifecycleFor({ agents: agentsService }, sessionId));

		const wsSource = {
			id: "ws-source",
			title: "Source",
			path: sourceProject,
			sessionIds: [sessionId],
			async attachSession(id) { if (!this.sessionIds.includes(id)) this.sessionIds.push(id); },
			async detachSession(id) { this.sessionIds = this.sessionIds.filter((x) => x !== id); },
		};
		const wsTarget = {
			id: "ws-target",
			title: "Target",
			path: targetProject,
			sessionIds: [],
			async attachSession(id) { if (!this.sessionIds.includes(id)) this.sessionIds.push(id); },
			async detachSession(id) { this.sessionIds = this.sessionIds.filter((x) => x !== id); },
		};

		const mockRegistry = {
			list: () => [wsSource, wsTarget],
			readSessionHeader: async (id) => (id === sessionId ? header : undefined),
			sessionPaths: new Map([[sessionId, sourceProject]]),
			headers: new Map([[sessionId, header]]),
		};

		const mockPersistence = {
			locate: ({ id, cwd }) => {
				if (cwd === sourceProject) return { path: sourceLog, kind: "file" };
				if (cwd === targetProject) return { path: targetLog, kind: "file" };
				return undefined;
			},
			stat: async () => ({ header }),
			open: async () => ({
				header,
				read: async () => ({ events: [] }),
				close: async () => {},
			}),
		};

		const sessionController = {
			resolveAgent: async (id) => {
				reloadedId = id;
				agentsStore.set(id, mockAgent);
				sessionsStore.set(id, mockAgent.session);
				return { agent: mockAgent };
			},
		};

		const workingDirectory = {
			set: async (agent, path) => {
				setDirectory = path;
				return path;
			},
		};

		const ctx = {
			workspaceRegistry: mockRegistry,
			sessionPersistence: mockPersistence,
			sessions: sessionsService,
			agents: agentsService,
			sessionController,
			workingDirectory,
		};

		// 执行移动
		const result = await moveSessionToWorkspace(ctx, sessionId, "ws-target");

		assert.equal(result.ok, true);
		assert.equal(result.moved, true);
		assert.equal(disposed, true, "生命周期句柄应该已被释放");
		assert.equal(reloadedId, sessionId, "迁移完成后应该重新 resolveAgent");
		assert.equal(setDirectory, targetProject, "迁移完成后应该调用 workingDirectory.set 同步有效目录");
		assert.deepEqual(wsSource.sessionIds, []);
		assert.deepEqual(wsTarget.sessionIds, [sessionId]);

		// 检查目标文件第一帧
		const targetBytes = await readFile(targetLog);
		const f0 = zlib.zstdDecompressSync(targetBytes);
		const f0Obj = JSON.parse(f0.toString("utf8").split("\n")[0]);
		assert.equal(f0Obj.cwd, targetProject);

		uninstallLifecycle();
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});

test("生命周期拦截与安全跨工作区迁移：执行中会话拒绝且句柄不被释放", async () => {
	const tempDir = await mkdtemp(join(tmpdir(), "dsham-lifecycle-busy-"));
	try {
		const sourceProject = join(tempDir, "proj-source");
		const targetProject = join(tempDir, "proj-target");
		const sessionsRoot = join(tempDir, "sessions");
		await mkdir(sourceProject, { recursive: true });
		await mkdir(targetProject, { recursive: true });

		const sessionId = "session-lifecycle-busy";
		const sourceLog = join(sessionsRoot, "--proj-source--", sessionId, "session.v2.jsonl.zstd");
		await mkdir(dirname(sourceLog), { recursive: true });

		const header = { id: sessionId, cwd: sourceProject, version: 2 };
		await writeFile(sourceLog, createZstdLog(header));

		let disposed = false;
		const mockAgent = {
			id: sessionId,
			busy: true, // 正在执行任务
			status: "running",
			session: {
				id: sessionId,
				running: true,
				status: "running",
				header: { ...header },
			},
		};

		const agentsStore = new Map([[sessionId, mockAgent]]);
		const agentsService = {
			get: (id) => agentsStore.get(id),
			resume: async () => ({
				agent: mockAgent,
				dispose: async () => { disposed = true; },
			}),
		};

		const sessionsStore = new Map([[sessionId, mockAgent.session]]);
		const sessionsService = {
			get: (id) => sessionsStore.get(id),
		};

		const uninstallLifecycle = installSessionLifecycle({ agents: agentsService });
		await agentsService.resume({ resumeSessionId: sessionId });

		const wsSource = {
			id: "ws-source",
			path: sourceProject,
			sessionIds: [sessionId],
			async attachSession() {},
			async detachSession() {},
		};
		const wsTarget = {
			id: "ws-target",
			path: targetProject,
			sessionIds: [],
			async attachSession() {},
			async detachSession() {},
		};

		const ctx = {
			workspaceRegistry: {
				list: () => [wsSource, wsTarget],
				readSessionHeader: async () => header,
			},
			sessionPersistence: {
				locate: () => ({ path: sourceLog, kind: "file" }),
				stat: async () => ({ header }),
			},
			sessions: sessionsService,
			agents: agentsService,
		};

		await assert.rejects(
			() => moveSessionToWorkspace(ctx, sessionId, "ws-target"),
			/执行或运行状态/
		);
		assert.equal(disposed, false, "正在执行的会话严禁调用 dispose 释放句柄");

		uninstallLifecycle();
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});

test("生命周期拦截与安全跨工作区迁移：挂接失败时完整回滚物理文件并在原位置恢复会话", async () => {
	const tempDir = await mkdtemp(join(tmpdir(), "dsham-lifecycle-rollback-"));
	try {
		const sourceProject = join(tempDir, "proj-source");
		const targetProject = join(tempDir, "proj-target");
		const sessionsRoot = join(tempDir, "sessions");
		await mkdir(sourceProject, { recursive: true });
		await mkdir(targetProject, { recursive: true });

		const sessionId = "session-lifecycle-rollback";
		const sourceLog = join(sessionsRoot, "--proj-source--", sessionId, "session.v2.jsonl.zstd");
		const targetLog = join(sessionsRoot, "--proj-target--", sessionId, "session.v2.jsonl.zstd");
		await mkdir(dirname(sourceLog), { recursive: true });

		const header = { id: sessionId, cwd: sourceProject, version: 2 };
		const sourceLogContent = createZstdLog(header);
		await writeFile(sourceLog, sourceLogContent);

		let disposed = false;
		let restoredId = null;

		const mockAgent = {
			id: sessionId,
			busy: false,
			status: "idle",
			session: {
				id: sessionId,
				running: false,
				status: "idle",
				header: { ...header },
			},
		};

		const agentsStore = new Map([[sessionId, mockAgent]]);
		const agentsService = {
			get: (id) => agentsStore.get(id),
			resume: async () => ({
				agent: mockAgent,
				dispose: async () => {
					disposed = true;
					agentsStore.delete(sessionId);
					sessionsStore.delete(sessionId);
				},
			}),
		};

		const sessionsStore = new Map([[sessionId, mockAgent.session]]);
		const sessionsService = {
			get: (id) => sessionsStore.get(id),
		};

		const uninstallLifecycle = installSessionLifecycle({ agents: agentsService });
		await agentsService.resume({ resumeSessionId: sessionId });

		const wsSource = {
			id: "ws-source",
			path: sourceProject,
			sessionIds: [sessionId],
			async attachSession(id) { if (!this.sessionIds.includes(id)) this.sessionIds.push(id); },
			async detachSession(id) { this.sessionIds = this.sessionIds.filter((x) => x !== id); },
		};
		const wsTarget = {
			id: "ws-target",
			path: targetProject,
			sessionIds: [],
			async attachSession() {
				throw new Error("模拟目标工作区 attachSession 抛错");
			},
			async detachSession() {},
		};

		const mockRegistry = {
			list: () => [wsSource, wsTarget],
			readSessionHeader: async (id) => (id === sessionId ? header : undefined),
			sessionPaths: new Map([[sessionId, sourceProject]]),
			headers: new Map([[sessionId, header]]),
		};

		const mockPersistence = {
			locate: ({ id, cwd }) => {
				if (cwd === sourceProject) return { path: sourceLog, kind: "file" };
				if (cwd === targetProject) return { path: targetLog, kind: "file" };
				return undefined;
			},
			stat: async () => ({ header }),
			open: async () => ({
				header,
				read: async () => ({ events: [] }),
				close: async () => {},
			}),
		};

		const sessionController = {
			resolveAgent: async (id) => {
				restoredId = id;
				agentsStore.set(id, mockAgent);
				sessionsStore.set(id, mockAgent.session);
				return { agent: mockAgent };
			},
		};

		const ctx = {
			workspaceRegistry: mockRegistry,
			sessionPersistence: mockPersistence,
			sessions: sessionsService,
			agents: agentsService,
			sessionController,
		};

		await assert.rejects(
			() => moveSessionToWorkspace(ctx, sessionId, "ws-target"),
			/模拟目标工作区 attachSession 抛错/
		);

		assert.equal(disposed, true, "句柄已被 dispose");
		assert.equal(restoredId, sessionId, "回滚后应该重新恢复原位置会话");
		assert.deepEqual(wsSource.sessionIds, [sessionId], "原工作区归属已恢复");
		assert.deepEqual(wsTarget.sessionIds, [], "目标工作区不应包含会话");
		assert.deepEqual(await readFile(sourceLog), sourceLogContent, "源文件应该完整恢复");
		await assert.rejects(() => stat(targetLog), { code: "ENOENT" });

		uninstallLifecycle();
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});
