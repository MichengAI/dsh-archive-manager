// 使用真实新版 JSONL 和查询服务验证删除持久结果；所有工件仅写入临时目录。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, access, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { registerHooks } from "node:module";
import { assertIsolatedHost } from "../helpers/isolated-host.mjs";

assertIsolatedHost();
// 先核对版本和实际解析路径，再加载宿主，避免旧版模块先抛出误导性接口错误。
const { Context, Service } = await import("@deepseek-ai/cordis");
const { SessionStore } = await import("@deepseek-ai/dsh-session");
const { SessionPersistence } = await import(
	"@deepseek-ai/dsh-session-persistence"
);
const { SessionQueryEngine } = await import("@deepseek-ai/dsh-session-query");
const { SessionProjectionCache } = await import(
	"@deepseek-ai/dsh-session-projection-cache"
);
const { ArchiveWorkspaceRegistry } = await import("../../lib/workspace.js");

assert.equal(
	typeof SessionPersistence.prototype.prepare,
	"undefined",
	"新版夹具必须运行在已移除 prepare 的宿主上",
);
// 上游静态导入仅 POSIX 使用的 fs-ext；Windows 实际锁仍使用原生 Koffi。
// 此测试入口只隔离不可加载的 POSIX 导入，若误入该分支必须失败，绝不模拟锁成功。
const hooks =
	process.platform === "win32"
		? registerHooks({
				resolve(specifier, context, nextResolve) {
					if (specifier === "fs-ext")
						return {
							url: "data:text/javascript,export function flock() { throw new Error('Windows must not use POSIX flock'); }",
							shortCircuit: true,
						};
					return nextResolve(specifier, context);
				},
			})
		: void 0;
let mountJsonlPersistence;
try {
	const jsonl = await import("@deepseek-ai/dsh-session-persistence-jsonl");
	/** alpha.3+：JSONL 改为 Cordis apply 插件，不再导出可直接 new 的类。 */
	mountJsonlPersistence = async (ctx, config) => {
		// alpha.3+：Cordis apply 插件；更早版本仍导出可 new 的 default 类。
		if (typeof jsonl.apply === "function") {
			await jsonl.apply(ctx, config);
			const persistence = ctx.get("sessionPersistence");
			if (persistence === undefined) {
				throw new Error("session-persistence-jsonl apply did not provide sessionPersistence");
			}
			return persistence;
		}
		const Ctor = jsonl.default;
		if (typeof Ctor !== "function") {
			throw new Error("session-persistence-jsonl exports neither apply nor a default constructor");
		}
		return new Ctor(ctx, config);
	};
} finally {
	hooks?.deregister();
}

async function setup(t, compression = "none") {
	const root = await mkdtemp(join(tmpdir(), "dsh-am-latest-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const cwd = join(root, "project");
	await mkdir(cwd);
	const ctx = new Context();
	const sessions = new SessionStore(ctx);
	const persistence = await mountJsonlPersistence(ctx, {
		root: join(root, "sessions"),
		compression,
	});
	const records = new Map();
	const state = { initialized: true, workspaceIds: [], archivedSessionIds: [], pinnedSessionIds: [] };
	const table = {
		get size() {
			return records.size;
		},
		get: (id) => records.get(id),
		has: (id) => records.has(id),
		entries: () => records.entries(),
		keys: () => records.keys(),
		values: () => records.values(),
		put: async (id, value) => {
			records.set(id, value);
		},
		delete: async (id) => records.delete(id),
		update: async (id, change) => {
			const next = change(records.get(id));
			records.set(id, next);
			return next;
		},
	};
	ctx.provide("storageDomain", {
		open: async () => ({
			table: () => table,
			global: {
				get: () => state,
				set: async (next) => Object.assign(state, next),
			},
			close() {},
		}),
	});
	const registry = new ArchiveWorkspaceRegistry(ctx);
	await registry[Service.init]();
	const query = new SessionQueryEngine(ctx);
	async function create(id, extra = {}) {
		const header = sessions.prepare(id, {
			meta: { cwd, createdAt: 1700000000000, ...extra },
		}).header;
		const handle = await persistence.create(header);
		await handle.flush();
		await handle.close();
		return header;
	}
	return {
		root,
		cwd,
		ctx,
		sessions,
		persistence,
		registry,
		query,
		state,
		create,
	};
}

for (const compression of ["none", "zstd"]) {
	test(`最新宿主实时会话落盘并释放写句柄后删除，重开存储不复活 (${compression})`, async (t) => {
		const env = await setup(t, compression);
		const session = env.sessions.prepare("live", {
			meta: { cwd: env.cwd, createdAt: 1700000000000 },
		});
		const writer = await env.persistence.create(session.header);
		// 只观察真实 close 的完成，不提前关闭，也不替换其锁释放和文件操作。
		const close = writer.close.bind(writer);
		let closePromise;
		let closed = false;
		writer.close = () =>
			(closePromise ??= close().then(() => {
				closed = true;
			}));
		t.after(() => writer.close());
		env.sessions.enter(session);
		env.sessions.announce(session);
		await env.registry.archiveSession(session.id);
		const directory = dirname(env.persistence.locate(session.header).path);
		let flushedEvents;
		const flush = env.sessions.flush.bind(env.sessions);
		env.sessions.flush = async (live) => {
			const result = await flush(live);
			// 使用另一个真实只读句柄确认落盘，不以 live buffer 的内容冒充持久结果。
			const reader = await env.persistence.open(live.id, "read");
			try {
				flushedEvents = (await reader.read(0)).events;
			} finally {
				await reader.close();
			}
			return result;
		};
		let closedBeforeRemoval;
		const remove = env.registry.removeTranscriptDirectory.bind(env.registry);
		env.registry.removeTranscriptDirectory = async (id) => {
			closedBeforeRemoval = closed;
			return remove(id);
		};
		const removed = [];
		env.ctx.on("api-session/removed", (id) => removed.push(id));
		// 紧接写入执行删除，不在两者之间主动 flush 或等待后台批量定时器。
		const event = session.append("session/title", { title: "实时删除回归", messageSeqs: [], source: { kind: "user" } });
		await env.registry.deleteSession(session.id);
		assert.deepEqual(
			flushedEvents,
			[event],
			"删除屏障必须落盘尚未手动 flush 的实时事件",
		);
		assert.equal(
			closedBeforeRemoval,
			true,
			"开始目录删除前真实写句柄必须释放完成",
		);
		assert.deepEqual(removed, [session.id]);
		assert.equal(env.sessions.get(session.id), void 0);
		assert.deepEqual(env.state.archivedSessionIds, []);
		await assert.rejects(access(directory), { code: "ENOENT" });
		assert.equal(await env.persistence.stat(session.id), void 0);
		assert.deepEqual(await env.query.listSessions(), []);
		const fresh = new Context();
		new SessionStore(fresh);
		const reopened = await mountJsonlPersistence(fresh, {
			root: join(env.root, "sessions"),
			compression,
		});
		assert.deepEqual(await reopened.list(), []);
		assert.deepEqual(await new SessionQueryEngine(fresh).listSessions(), []);
		await env.persistence.flush();
		await assert.rejects(access(directory), { code: "ENOENT" });
	});

	test(`最新宿主批量删除冷归档会话及子会话，刷新和重启后不复活 (${compression})`, async (t) => {
		const env = await setup(t, compression);
		const parent = await env.create("parent");
		await env.create("child", { parentSession: "parent", origin: "subagent" });
		await env.create("fork", { parentSession: "parent" });
		const directory = dirname(env.persistence.locate(parent).path);
		// 当前代际未被迁移前也可能不存在；不能让 force 删除不存在路径假报成功。
		await writeFile(
			join(
				directory,
				compression === "zstd" ? "session.jsonl.zstd" : "session.jsonl",
			),
			"历史代际占位，当前代际存在时不应读取",
		);
		await env.registry.archiveSession("parent");
		const removed = [];
		env.ctx.on("api-session/removed", (id) => removed.push(id));
		let lists = 0;
		const originalList = env.persistence.list.bind(env.persistence);
		env.persistence.list = async (...args) => {
			lists += 1;
			return originalList(...args);
		};
		const result = await env.registry.deleteArchivedSessions({ scope: "all" });
		assert.equal(lists, 1, "真实 JSONL 批量删除只能预取一次存储列举");
		assert.deepEqual(result.failures, []);
		assert.deepEqual(result.deletedSessionIds, ["parent"]);
		assert.deepEqual(removed, ["child", "parent"]);
		await assert.rejects(access(directory), { code: "ENOENT" });
		assert.deepEqual(
			(await env.persistence.list()).map((item) => item.header.id),
			["fork"],
		);
		assert.deepEqual(
			(await env.query.listSessions()).map((item) => item.header.id),
			["fork"],
		);
		const restarted = await mountJsonlPersistence(new Context(), {
			root: join(env.root, "sessions"),
			compression,
		});
		assert.deepEqual(
			(await restarted.list()).map((item) => item.header.id),
			["fork"],
		);
		assert.deepEqual(env.state.archivedSessionIds, []);
	});
}

test("正文读取共用只读句柄并在完成后释放", async (t) => {
	const env = await setup(t);
	const header = await env.create("archive");
	const source = await env.registry.readStoredProjectionSource(
		env.persistence,
		header.id,
	);
	assert.equal(source.meta.id, header.id);
	assert.equal(source.inheritedEventCount, 0);
	assert.deepEqual(source.events, []);
	const writer = await env.persistence.open(header.id, "write");
	await writer.close();
});

for (const { previousCache, seeded } of ["缺失", "无版本", "旧代际"].flatMap(
	(previousCache) => [false, true].map((seeded) => ({ previousCache, seeded })),
)) {
	test(`归档元数据不读取真实正文或补写缓存（缓存：${previousCache}，播种：${seeded}）`, async (t) => {
		const env = await setup(t);
		const parent = env.sessions.prepare("projection-parent", {
			meta: { cwd: env.cwd },
		});
		const seed = [parent.append("session/title", { title: "父会话继承标题", messageSeqs: [], source: { kind: "user" } })];
		const session = env.sessions.prepare(
			"projection-repair",
			seeded
				? {
						seed,
						inheritedEventCount: seed.length,
						meta: { cwd: env.cwd, isSeeded: true, parentSession: parent.id },
					}
				: { meta: { cwd: env.cwd } },
		);
		const inheritedEventCount = seeded ? seed.length : 0;
		assert.equal(session.inheritedEventCount, inheritedEventCount);
		const event = session.append("session/title", { title: "从原文恢复的标题", messageSeqs: [], source: { kind: "user" } });
		const writer = await env.persistence.create(session.header, {
			inheritedEventCount,
		});
		try {
			await writer.append(session.snapshotEvents());
		} finally {
			await writer.close();
		}
		await env.registry.archiveSession(session.id);
		const cache = new SessionProjectionCache(env.ctx, { writeEveryEvents: 100, writeIntervalMs: 60000 });
		const records = new Map();
		const calls = [];
		cache.table = {
			get: id => records.get(id),
			put: async (id, value) => { calls.push("put"); records.set(id, value); },
		};
		if (previousCache !== "缺失") records.set(session.id, {
			identity: {
				...(previousCache === "无版本" ? {} : { formatVersion: session.header.version - 1 }),
				createdAt: session.header.createdAt, cwd: session.header.cwd,
				isSeeded: seeded, inheritedEventCount,
			},
			rows: { title: { ver: 1, seq: event.seq, val: "旧代际标题" } },
		});
		const before = structuredClone([...records]);
		const read = env.registry.readStoredProjectionSource;
		env.registry.readStoredProjectionSource = async function (...args) {
			calls.push("read");
			return read.apply(this, args);
		};
		cache.cachedSnapshot = () => { calls.push("cachedSnapshot"); return undefined; };
		for (let attempt = 0; attempt < 2; attempt += 1) {
			assert.deepEqual(await env.registry.archivedSessionMetadata(), {
				items: [{ sessionId: session.id, createdAt: session.header.createdAt }],
			});
		}
		assert.deepEqual(calls, [], "读取归档元数据不得触发正文读取、缓存查询或写回");
		assert.deepEqual([...records], before, "已有官方缓存保持原样，不由归档列表修复");
		assert.equal(env.sessions.get(session.id), undefined, "读取元数据不能激活冷会话");
	});
}

test("诊断路径指向尚不存在的新代际时仍清除宿主可读的旧文件", async (t) => {
	const env = await setup(t);
	const header = await env.create("historical");
	const directory = dirname(env.persistence.locate(header).path);
	// 模拟存量日志尚未迁移，而新版 locate 已返回新代际写入目标。
	env.persistence.locate = () => ({
		kind: "jsonl",
		path: join(directory, "session.v999.jsonl"),
	});
	await env.registry.archiveSession(header.id);
	assert.equal((await env.persistence.list()).length, 1);
	await env.registry.deleteSession(header.id);
	assert.deepEqual(await env.persistence.list(), []);
	await assert.rejects(access(directory), { code: "ENOENT" });
});
