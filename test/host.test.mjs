// dsh-archive-manager host self-tests (node:test).
//
// Tests exercise the generated publish artifacts in lib with installed dependencies.
// Run `pnpm test` for the full suite (build included). For this file alone, run
// `pnpm build && node --test test/host.test.mjs` so source changes are rebuilt first.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	mkdtempSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	realpathSync,
	existsSync,
	renameSync,
	symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { Context, Service } from "@deepseek-ai/cordis";
import { TypertRegistry } from "@deepseek-ai/dsh-typert-registry";
import { TypertGatewayService } from "@deepseek-ai/dsh-api-gateway";
import { gatewayCall } from "./helpers/gateway-peer.mjs";
import { remoteMethods } from "@deepseek-ai/dsh-typert-protocol";
import { DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { ArchiveWorkspaceRegistry } from "../lib/workspace.js";
import { projectionCacheStorageKey } from "../lib/projcache.js";

const SID = (n) =>
	`session-${String(n).padStart(5, "0")}-0000-0000-0000-000000000000`;
const require = createRequire(import.meta.url);

test("剩余宿主不再走早于 0.2.0 的投影、只读和列表回退", () => {
	const source = readFileSync(new URL("../src/workspace.ts", import.meta.url), "utf8");
	assert.equal(source.includes("cache.cachedSnapshot(header, inheritedEventCount)"), false);
	assert.equal(source.includes("persistence.readFrom"), false);
	assert.equal(source.includes("item as Header"), false);
});

/** Map-backed domain table facade matching the storage-domain table contract. */
class FakeTable {
	constructor(initial = {}) {
		this.map = new Map(Object.entries(initial));
	}
	get size() {
		return this.map.size;
	}
	get(key) {
		return this.map.get(key);
	}
	has(key) {
		return this.map.has(key);
	}
	keys() {
		return this.map.keys();
	}
	values() {
		return this.map.values();
	}
	entries() {
		return this.map.entries();
	}
	async put(key, value) {
		this.map.set(key, value);
	}
	async delete(key) {
		this.map.delete(key);
	}
	async update(key, fn) {
		const next = fn(this.map.get(key));
		this.map.set(key, next);
		return next;
	}
}

/** One fake storage domain: table registry + global state (set mutates in place). */
class FakeDomain {
	constructor(tables, global) {
		this.tables = tables;
		this.globalState = global;
		this.globalSetError = null;
	}
	table(name) {
		return this.tables[name];
	}
	get global() {
		return {
			get: () => this.globalState,
			set: async (next) => {
				if (this.globalSetError !== null) throw this.globalSetError;
				Object.assign(this.globalState, next);
			},
		};
	}
	close() {}
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Build a test root context with the fakes the workspace registry needs.
 * Header cwds and workspace paths are translated to REAL canonical
 * directories under a temp root (the registry's header index realpaths cwds
 * and the entity getter filters membership by canonical-cwd equality).
 * Returns the context plus handles used by the assertions.
 */
function buildRoot({
	headers = [],
	workspaces = {},
	archived = [],
	live = [],
} = {}) {
	const ctx = new Context();
	const root = mkdtempSync(join(tmpdir(), "dsh-am-test-"));
	const canonicalOf = new Map();
	for (const header of headers) {
		if (header.cwd === void 0 || canonicalOf.has(header.cwd)) continue;
		const dir = join(root, `proj-${canonicalOf.size}`);
		mkdirSync(dir, { recursive: true });
		// 宿主以 fs.promises.realpath 建立会话路径索引；Windows 上普通同步
		// realpath 的字符串表示可能不同，需用 native 实现保持同一规范形式。
		canonicalOf.set(header.cwd, realpathSync.native(dir));
	}
	const canonicalHeaders = headers.map((h) =>
		h.cwd === void 0 ? h : { ...h, cwd: canonicalOf.get(h.cwd) },
	);
	const located = new Map();
	for (const header of canonicalHeaders) {
		const dir = join(root, `sessions-${header.id}`);
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "session.jsonl.zstd"), "stub");
		located.set(header.id, join(dir, "session.jsonl.zstd"));
	}
	const workspacesCanonical = Object.fromEntries(
		Object.entries(workspaces).map(([id, record]) => [
			id,
			{ ...record, path: canonicalOf.get(record.path) ?? record.path },
		]),
	);
	const table = new FakeTable(
		Object.fromEntries(
			Object.entries(workspacesCanonical).map(([id, record]) => [
				id,
				{
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
					...record,
				},
			]),
		),
	);
	const global = {
		initialized: true,
		workspaceIds: Object.keys(workspacesCanonical),
		archivedSessionIds: [...archived],
		pinnedSessionIds: [],
	};
	const domain = new FakeDomain({ workspaces: table }, global);
	const persistence = {
		headers: [...canonicalHeaders],
		list: async () => persistence.headers.map((header) => ({ header })),
		prepared: [],
		released: [],
		prepare: async (id) => {
			persistence.prepared.push(id);
			return {
				session: {
					id,
					header: persistence.headers.find((item) => item.id === id),
					events: [],
				},
				[Symbol.dispose]() {
					persistence.released.push(id);
				},
			};
		},
		locate: (meta) => {
			const path = located.get(meta.id);
			if (path === void 0) throw new Error(`no transcript for ${meta.id}`);
			return { kind: "jsonl", path };
		},
	};
	const cacheCalls = { deleted: [], cleared: [], idleAwaited: 0 };
	const projCache = {
		async whenIdle() {
			cacheCalls.idleAwaited += 1;
		},
		async delete(id) {
			cacheCalls.deleted.push(id);
		},
		clearTombstone(id) {
			cacheCalls.cleared.push(id);
		},
	};
	const sessions = {
		live,
		get: (id) => sessions.live.find((s) => s.id === id),
		list: () => [...sessions.live],
		enter(session) {
			sessions.live.push(session);
			return () => sessions.detachEntered({ session, id: session.id });
		},
		announce(session) {
			sessions.announced.push(session.id);
		},
		async flush(session) {
			sessions.flushed.push(session.id);
		},
		liveEntryFor(session) {
			return { session, id: session.id };
		},
		detachEntered(entry) {
			sessions.live = sessions.live.filter((s) => s.id !== entry.id);
			sessions.detached.push(entry.id);
			ctx.emit("session/disposed", entry.session);
		},
		flushed: [],
		detached: [],
		announced: [],
	};
	const favoriteDomain = new FakeDomain({}, { favoriteSessionIds: [] });
	ctx.provide("storageDomain", { open: async (spec) => spec.name === "archive_manager_favorites" ? favoriteDomain : domain });
	ctx.provide("sessionPersistence", persistence);
	ctx.provide("sessionProjectionCache", projCache);
	ctx.provide("sessions", sessions);
	ctx.provide("spillStore", { root: join(root, "spill") });
	return {
		ctx,
		root,
		table,
		domain,
		global,
		persistence,
		projCache,
		cacheCalls,
		sessions,
		located,
		favoriteDomain,
	};
}

async function mountWorkspaceRegistry(env) {
	const registry = new ArchiveWorkspaceRegistry(env.ctx);
	await registry[Service.init]();
	return registry;
}

function header(id, cwd, extra = {}) {
	return {
		version: 0,
		id,
		cwd,
		createdAt: 1700000000000,
		isSeeded: false,
		...extra,
	};
}

function workspace(path, sessionIds) {
	return { path, title: path, sessionIds };
}

const A = "ws-a",
	B = "ws-b";
const s1 = SID(1),
	s2 = SID(2),
	s3 = SID(3),
	s4 = SID(4),
	s5 = SID(5),
	sLive = SID(6),
	sUnknown = SID(99);
const cwdA = "D:\\proj-a",
	cwdB = "D:\\proj-b";

test("收藏独立持久化，归档恢复保留收藏，重复设置幂等", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA), header(s2, cwdA)] });
	const registry = await mountWorkspaceRegistry(env);
	await Promise.all([registry.setSessionFavorite({ sessionId: s1, favorite: true }), registry.setSessionFavorite({ sessionId: s2, favorite: true })]);
	await registry.setSessionFavorite({ sessionId: s1, favorite: true });
	await registry.archiveSession(s1);
	await registry.unarchiveSession(s1);
	assert.deepEqual((await registry.favoriteSessions()).favoriteSessionIds, [s1, s2]);
	assert.deepEqual(env.favoriteDomain.global.get().favoriteSessionIds, [s1, s2]);
	await registry.setSessionFavorite({ sessionId: s1, favorite: false });
	assert.deepEqual((await registry.favoriteSessions()).favoriteSessionIds, [s2]);
});

test("收藏拒绝未知会话和非法请求，写入失败不返回假成功", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)] });
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(registry.setSessionFavorite({ sessionId: sUnknown, favorite: true }));
	await assert.rejects(registry.setSessionFavorite({ sessionId: s1, favorite: "true" }));
	env.favoriteDomain.globalSetError = new Error("磁盘写入失败");
	await assert.rejects(registry.setSessionFavorite({ sessionId: s1, favorite: true }), /磁盘写入失败/);
	assert.deepEqual(env.favoriteDomain.global.get().favoriteSessionIds, []);
});

test("收藏读取只清理确证缺失工件，未知索引和权限错误不丢收藏", async () => {
	const env = buildRoot({ headers: [] });
	const registry = await mountWorkspaceRegistry(env);
	await env.favoriteDomain.global.set({ favoriteSessionIds: [s1, s2, s3] });
	env.persistence.stat = async id => {
		if (id === s1) return { size: 1 };
		if (id === s2) throw Object.assign(new Error("权限不足"), { code: "EACCES" });
		return undefined;
	};
	assert.deepEqual((await registry.favoriteSessions()).favoriteSessionIds, [s1, s2]);
	assert.deepEqual(env.favoriteDomain.global.get().favoriteSessionIds, [s1, s2]);
	env.sessions.live.push({ id: s3 });
	await env.favoriteDomain.global.set({ favoriteSessionIds: [s1, s2, s3] });
	assert.deepEqual((await registry.favoriteSessions()).favoriteSessionIds, [s1, s2, s3], "尚未落盘的实时会话也要保留收藏");
	env.sessions.live = [];
	await env.favoriteDomain.global.set({ favoriteSessionIds: [s1, s2] });
	delete env.persistence.stat;
	assert.deepEqual((await registry.favoriteSessions()).favoriteSessionIds, [s1, s2]);
});

test("诊断不依赖宿主错误措辞，由工件验证决定可修复性", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const registry = await mountWorkspaceRegistry(env);
	registry.readConversationEvents = async () => { throw new Error("新版宿主更换了错误文案"); };
	let checked = 0;
	registry.sessionRepairPlan = async () => { checked++; return { token: "a".repeat(64), count: 1 }; };
	assert.equal((await registry.diagnoseSession({ sessionId: s1 })).repairable, true);
	assert.equal(checked, 1);
});

test("收藏经真实宿主存储域落盘并关闭重开，含特殊字符 ID", async () => {
	const id = "im:sample:会话";
	const env = buildRoot({ headers: [header(s1, cwdA)] });
	// 会话 ID 保持原值；测试转录目录沿用安全的夹具路径。
	env.persistence.headers[0].id = id;
	const file = join(env.root, "favorites.json");
	const storageContext = new Context();
	storageContext.provide("storage", { backend: { get: () => ({ kv: { open: async descriptor => ({
		loadAll: async () => existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { version: descriptor.version, tables: {}, global: null },
		setGlobal: async value => writeFileSync(file, JSON.stringify({ version: descriptor.version, tables: {}, global: value }), "utf8"),
		close: async () => {},
	}) } }) } });
	const facility = new DomainFacility(storageContext, { backend: "test" });
	const originalOpen = env.ctx.storageDomain.open;
	env.ctx.storageDomain.open = spec => spec.name === "archive_manager_favorites" ? facility.open(spec) : originalOpen(spec);
	const registry = await mountWorkspaceRegistry(env);
	try {
		await registry.setSessionFavorite({ sessionId: id, favorite: true });
		await facility.closeAll();
		registry.favoriteDomainPromise = undefined;
		assert.deepEqual(await registry.favoriteSessions(), { favoriteSessionIds: [id] });
	} finally { await facility.closeAll(); }
});

test("热重载时过期的文件上传解析器可以被替换，旧解除函数不清掉新的", async () => {
	const env = buildRoot();
	const uploads = {
		agentResolver: undefined,
		registerAgentResolver(resolve) {
			if (this.agentResolver !== undefined) throw new Error("file-upload: Agent resolver is already registered");
			this.agentResolver = resolve;
			return () => {
				if (this.agentResolver === resolve) this.agentResolver = undefined;
			};
		},
	};
	env.ctx.provide("fileUploads", uploads);
	await mountWorkspaceRegistry(env);
	const previous = () => "old";
	const disposePrevious = uploads.registerAgentResolver(previous);
	const next = () => "new";
	const disposeNext = uploads.registerAgentResolver(next);
	assert.equal(uploads.agentResolver, next);
	disposePrevious();
	assert.equal(uploads.agentResolver, next);
	disposeNext();
	assert.equal(uploads.agentResolver, undefined);
});

test("文件上传解析器的其他错误和无法清理的形状仍然抛出", async () => {
	const env = buildRoot();
	const other = {
		registerAgentResolver() {
			throw new Error("file-upload: something else");
		},
	};
	env.ctx.provide("fileUploads", other);
	await mountWorkspaceRegistry(env);
	assert.throws(() => other.registerAgentResolver(() => "x"), /something else/);

	const stuckEnv = buildRoot();
	const stuck = {
		registerAgentResolver() {
			throw new Error("file-upload: Agent resolver is already registered");
		},
	};
	stuckEnv.ctx.provide("fileUploads", stuck);
	await mountWorkspaceRegistry(stuckEnv);
	assert.throws(() => stuck.registerAgentResolver(() => "x"), /already registered/);
});

test("workspace registry init with the fakes", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.ok(
		env.ctx.get("workspaceRegistry") !== void 0,
		"registry service is provided",
	);
	assert.deepEqual(
		registry.list().map((w) => w.id),
		[A, B],
	);
	assert.deepEqual(
		registry.get(A).sessionIds,
		[s1, s2],
		"工作区初始会话必须通过路径成员校验",
	);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("archiveSession + unarchiveSession round trip (idempotent, durable)", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.archiveSession(s1);
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
	await registry.archiveSession(s1); // idempotent
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
	const first = await registry.unarchiveSession(s1);
	assert.deepEqual(first.archivedSessionIds, []);
	assert.deepEqual(env.global.archivedSessionIds, []);
	const second = await registry.unarchiveSession(s1); // idempotent no-op
	assert.deepEqual(second.archivedSessionIds, []);
});

test("官方改工作区时丢掉没有路径索引的归档成员", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.archiveSession(s1);
	registry.sessionPaths.delete(s1);
	await registry.get(A).setTitle("proj-a-renamed");
	assert.deepEqual(env.table.get(A).sessionIds, [s2]);
});

test("恢复只移出归档集合，不把已丢失的工作区记账挂回", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", []) },
		archived: [s1],
	});
	const registry = await mountWorkspaceRegistry(env);
	const restored = await registry.unarchiveSession(s1);
	assert.deepEqual(restored.archivedSessionIds, []);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.equal(env.table.get(A).sessionIds.includes(s1), false);
});

test("archive drops a recorded pin and does not invent a missing pin list", async () => {
	const pinned = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
	});
	pinned.global.pinnedSessionIds = [s1, s2];
	const pinnedRegistry = await mountWorkspaceRegistry(pinned);
	await pinnedRegistry.archiveSession(s1);
	assert.deepEqual(pinned.global.archivedSessionIds, [s1]);
	assert.deepEqual(pinned.global.pinnedSessionIds, [s2]);
	const legacy = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	delete legacy.global.pinnedSessionIds;
	const legacyRegistry = await mountWorkspaceRegistry(legacy);
	await assert.rejects(legacyRegistry.archiveSession(s1), TypeError);
});

test("archive asks the host activity dispatcher instead of skipping when it is missing", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	env.ctx.waterfall = undefined;
	await assert.rejects(registry.archiveSession(s1), TypeError);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("running sessions use the host activity gate", async () => {
	const workspacePackage = await import("@deepseek-ai/dsh-workspace");
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	let asked = 0;
	const stopped = [];
	env.ctx.waterfall = async () => {
		asked += 1;
		return [{ kind: "turn" }];
	};
	env.ctx.parallel = async (name, request) => {
		stopped.push([name, request.sessionId]);
	};
	await assert.rejects(
		registry.archiveSession(s1),
		(error) =>
			error instanceof workspacePackage.WorkspaceActiveSessionError ||
			error.name === "WorkspaceActiveSessionError" ||
			error.constructor.name === "WorkspaceActiveSessionError",
	);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.equal(asked, 1);
	await registry.archiveSession(s1, { stopActivity: true });
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
	assert.equal(asked, 1);
	assert.deepEqual(stopped, [["workspace/session-stop", s1]]);
	asked = 0;
	await registry.archiveSession(s1);
	assert.equal(asked, 0);
});

test("archiveSession 未知会话交给官方抛错", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(registry.archiveSession(sUnknown), (error) =>
		error?.name === "WorkspaceUnknownSessionError" || error?.constructor?.name === "WorkspaceUnknownSessionError");
	assert.deepEqual(env.global.archivedSessionIds, []);
	await registry.archiveSession(s1);
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
});

test("unarchiveSession drops orphan archive markers and ignores unknown ids", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
		archived: [sUnknown],
	});
	const registry = await mountWorkspaceRegistry(env);
	const orphan = await registry.unarchiveSession(sUnknown);
	assert.deepEqual(orphan.archivedSessionIds, []);
	assert.deepEqual(env.global.archivedSessionIds, []);
	const missing = await registry.unarchiveSession(SID(99));
	assert.deepEqual(missing.archivedSessionIds, []);
});

test("archivedSessionMetadata returns host header creation times and skips stale archive markers", async () => {
	const env = buildRoot({
		headers: [
			header(s1, cwdA, { createdAt: 100 }),
			header(s2, cwdA, { createdAt: 200 }),
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2, sUnknown, s1, s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.stat = async (id) => {
		const path = env.located.get(id);
		return path === void 0 ? undefined : { path };
	};
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [
			{ sessionId: s2, createdAt: 200 },
			{ sessionId: s1, createdAt: 100 },
		],
	});
	assert.deepEqual(
		env.global.archivedSessionIds,
		[s2, s1],
		"opening the archive list drops only sessions whose artifacts are confirmed missing",
	);
});

test("archivedSessionMetadata keeps unreadable archives when the transcript still exists", async () => {
	const env = buildRoot({
		headers: [
			header(s1, cwdA, { createdAt: 100 }),
			header(s2, cwdA, { createdAt: 200 }),
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s1, s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.stat = async (id) => {
		const path = env.located.get(id);
		return path === void 0 ? undefined : { path };
	};
	registry.headers.delete(s2);
	env.persistence.headers = env.persistence.headers.filter((item) => item.id !== s2);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s1, createdAt: 100 }],
	});
	assert.deepEqual(
		env.global.archivedSessionIds,
		[s1, s2],
		"a list/header miss must not persist-drop an archive whose file still exists",
	);
});

test("archivedSessionMetadata lists stored headers once while pruning unknowns", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100 })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
		archived: [s1, sUnknown, SID(98), SID(97)],
	});
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.stat = async (id) => {
		const path = env.located.get(id);
		return path === void 0 ? undefined : { path };
	};
	let lists = 0;
	env.persistence.list = async () => {
		lists += 1;
		return env.persistence.headers.map((header) => ({ header }));
	};
	await registry.archivedSessionMetadata();
	assert.equal(lists, 1, "prune must not rebuild the full header listing once per unknown id");
});

for (const version of [0, 3])
	test(`归档摘要保留格式版本 ${version} 和播种身份，普通已缓存会话不读取原文`, async () => {
		const env = buildRoot({
			headers: [
				header(s1, cwdA, { version, createdAt: 100 }),
				header(s2, cwdA, { version, createdAt: 200, isSeeded: true }),
			],
			workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
			archived: [s1, s2],
		});
		const identityOf = (meta, inheritedEventCount) => ({
			formatVersion: meta.version,
			createdAt: meta.createdAt,
			...(meta.cwd === void 0 ? {} : { cwd: meta.cwd }),
			isSeeded: meta.isSeeded,
			inheritedEventCount,
		});
		const records = new Map([
			[
				s1,
				{
					identity: identityOf(
						env.persistence.headers.find((item) => item.id === s1),
						0,
					),
					snapshot: { asOfSeq: 8, values: { title: "already cached" } },
				},
			],
		]);
		const cacheReads = [];
		const reads = [];
		const puts = [];
		// 剩余宿主只按头部查缓存，第二参数是可选投影键，不再传继承切点。
		env.projCache.cachedSnapshot = (meta) => {
			cacheReads.push({ id: meta.id });
			return records.get(meta.id)?.snapshot;
		};
		env.projCache.put = async (id, identity, rows) => {
			puts.push({ id, identity, rows });
			records.set(id, {
				identity,
				snapshot: { asOfSeq: 9, values: { title: rows.title.val } },
			});
		};
		env.persistence.open = async (id) => {
			reads.push({ id, fromSeq: 0 });
			return {
				header: env.persistence.headers.find((item) => item.id === id),
				inheritedEventCount: 3,
				read: async () => ({ events: [{ seq: 0, type: "session/start", data: {} }] }),
				close: async () => {},
			};
		};
		env.ctx.provide("sessionProjections", {
			restore: (cached, events, floor, meta, inheritedEventCount) => {
				assert.deepEqual(cached, {});
				assert.equal(events.length, 1);
				assert.equal(floor, 0);
				assert.equal(meta.id, s2);
				assert.equal(inheritedEventCount, 3);
				return {
					checkpoint: { title: { ver: 1, seq: 9, val: "rebuilt" } },
					snapshot: { asOfSeq: 9, values: { title: "rebuilt" } },
				};
			},
		});
		const registry = await mountWorkspaceRegistry(env);
		assert.deepEqual(await registry.archivedSessionMetadata(), {
			items: [
				{ sessionId: s1, createdAt: 100 },
				{ sessionId: s2, createdAt: 200 },
			],
			repairedSessionIds: [s2],
		});
		assert.deepEqual(
			reads,
			[{ id: s2, fromSeq: 0 }],
			"only the missing archive reads its transcript",
		);
		assert.deepEqual(cacheReads, [
			{ id: s1 },
			{ id: s2 },
		]);
		assert.deepEqual(puts, [
			{
				id: s2,
				identity: {
					formatVersion: version,
					createdAt: 200,
					cwd: env.persistence.headers.find((item) => item.id === s2).cwd,
					isSeeded: true,
					inheritedEventCount: 3,
				},
				rows: { title: { ver: 1, seq: 9, val: "rebuilt" } },
			},
		]);
		assert.deepEqual(
			await registry.archivedSessionMetadata(),
			{
				items: [
					{ sessionId: s1, createdAt: 100 },
					{ sessionId: s2, createdAt: 200 },
				],
			},
			"缓存命中后普通会话无需读取原文；播种会话仍需读取继承事件数",
		);
		assert.deepEqual(
			reads,
			[
				{ id: s2, fromSeq: 0 },
				{ id: s2, fromSeq: 0 },
			],
			"播种会话必须读取继承事件数，普通已缓存会话无需读取原文",
		);
		assert.deepEqual(cacheReads, [
			{ id: s1 },
			{ id: s2 },
			{ id: s1 },
			{ id: s2 },
		]);
	});

test("archivedSessionMetadata skips seeded projection repair when the inherited count is missing", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100, isSeeded: true })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
		archived: [s1],
	});
	const reads = [];
	let restored = false;
	let put = false;
	env.persistence.open = async (id) => {
		reads.push({ id, fromSeq: 0 });
		return {
			header: env.persistence.headers[0],
			read: async () => ({ events: [] }),
			close: async () => {},
		};
	};
	env.projCache.cachedSnapshot = () => void 0;
	env.projCache.put = async () => {
		put = true;
	};
	env.ctx.provide("sessionProjections", {
		restore: () => {
			restored = true;
			return { checkpoint: {} };
		},
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s1, createdAt: 100 }],
	});
	assert.deepEqual(reads, [{ id: s1, fromSeq: 0 }]);
	assert.equal(restored, false);
	assert.equal(put, false);
});

test("explicit archived-session batches span projects, deduplicate input, and preserve archive order", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
		archived: [s2, sUnknown, s1, s3],
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.unarchiveSession(s3);
	await registry.unarchiveSession(s1);
	assert.deepEqual(env.global.archivedSessionIds, [s2, sUnknown]);

	const deleted = await registry.deleteArchivedSessions({
		scope: "sessions",
		sessionIds: [sUnknown, s2, s2],
	});
	assert.deepEqual(deleted.requestedSessionIds, [s2, sUnknown]);
	assert.deepEqual(deleted.deletedSessionIds, [s2]);
	assert.deepEqual(
		deleted.skippedSessionIds,
		[sUnknown],
		"stale selected markers still use batch cleanup",
	);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("deleteSession cleans unknown sessions without throwing", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.deleteSession(sUnknown), { deleted: true });
});

test("deleteSession removes transcript, archive marker, accounts, and cache row (stray + accounted)", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s4, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	// stray session s4: not accounted anywhere
	await registry.deleteSession(s4);
	assert.equal(
		existsSync(env.located.get(s4)),
		false,
		"stray transcript artifact removed",
	);
	assert.deepEqual(env.cacheCalls.deleted, [s4]);
	assert.deepEqual(env.global.archivedSessionIds, [s2]);
	assert.deepEqual(
		env.persistence.prepared,
		[s4],
		"cold deletion publishes a session removal",
	);
	assert.deepEqual(env.sessions.announced, [s4]);
	assert.deepEqual(env.sessions.detached, [s4]);
	assert.deepEqual(env.persistence.released, [s4]);
	// accounted + archived session s2
	await registry.deleteSession(s2);
	assert.deepEqual(env.cacheCalls.deleted, [s4, s2]);
	assert.deepEqual(env.global.archivedSessionIds, []);
	const wsA = registry.get(A);
	assert.deepEqual(wsA.sessionIds, [s1]);
	// entity snapshot was refreshed (not just the table)
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
	assert.equal(
		existsSync(env.located.get(s2)),
		false,
		"archived session transcript artifact removed",
	);
	assert.deepEqual(env.persistence.prepared, [s4, s2]);
	assert.deepEqual(env.sessions.detached, [s4, s2]);
});

// Official JSONL layout: root/project/encoded-session-id/session.jsonl[.zstd].
function installJsonlLayout(
	env,
	id,
	{ project = "_no-cwd", segment = id, filename = "session.jsonl.zstd" } = {},
) {
	const root = join(env.root, "transcripts");
	const directory = join(root, project, segment);
	mkdirSync(directory, { recursive: true });
	const artifact = join(directory, filename);
	writeFileSync(artifact, "stub");
	env.persistence.name = "session-persistence-jsonl";
	env.persistence.config = { root };
	env.located.set(id, artifact);
	return directory;
}

for (const filename of [
	"session.jsonl.zstd",
	"session.jsonl",
	"session.v1.jsonl",
	"session.v2.jsonl.zstd",
]) {
	test(`deleteSession removes the official JSONL session directory (${filename})`, async () => {
		const env = buildRoot({ headers: [header(s1), header(s2)], archived: [s1] });
		const directory = installJsonlLayout(env, s1, { filename });
		const sibling = installJsonlLayout(env, s2, { filename });
		mkdirSync(join(directory, "attachments"));
		writeFileSync(
			join(directory, "attachments", "output.txt"),
			"session-owned output",
		);
		// 新宿主仍能读取旧代际；不能只移除 locate() 指向的当前代际。
		writeFileSync(join(directory, "session.v3.jsonl"), "older generation");
		const registry = await mountWorkspaceRegistry(env);

		await registry.deleteSession(s1);

		assert.equal(
			existsSync(directory),
			false,
			"remove the directory, not just the log",
		);
		assert.equal(existsSync(sibling), true, "keep other sessions");
		assert.equal(
			existsSync(dirname(directory)),
			true,
			"keep the project container",
		);
		assert.deepEqual(env.global.archivedSessionIds, []);
	});
}

test("deleteSession removes the directory when header read throws the synthetic tool result error", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	registry.readSessionHeader = async () => {
		throw new Error("SessionFormatError: format v4 tool/result at seq 1313 requires toolCallId matching its tool source");
	};

	assert.deepEqual(await registry.deleteSession(s1), { deleted: true });
	assert.equal(existsSync(directory), false, "已缓存头部必须足够定位并删除");
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("deleteSession reports transcript corruption without telling the user to delete again", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	registry.headers.delete(s1);
	registry.sessionKnown = async () => true;
	registry.readSessionHeader = async () => {
		throw new Error("SessionFormatError: format v4 tool/result at seq 1313 requires toolCallId matching its tool source");
	};

	await assert.rejects(() => registry.deleteSession(s1), /requires toolCallId matching its tool source/);
	await assert.rejects(() => registry.deleteSession(s1), (error) => {
		assert.doesNotMatch(error.message, /可以永久删除|删除未完成|没有权限/);
		return true;
	});
	const batch = await registry.deleteArchivedSessions({ scope: "sessions", sessionIds: [s1] });
	assert.match(batch.failures[0].message, /requires toolCallId matching its tool source/);
	assert.doesNotMatch(batch.failures[0].message, /可以永久删除|删除未完成|没有权限/);
	assert.equal(existsSync(directory), true, "没有头部时不能猜路径删除");
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
});

test("deleteSession still removes a present directory when stat cannot certify a corrupt body", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	const corrupt = new Error("SessionFormatError: format v4 tool/result at seq 1313 requires toolCallId matching its tool source");
	env.persistence.stat = async () => {
		throw corrupt;
	};
	env.persistence.prepare = async () => {
		throw corrupt;
	};

	assert.deepEqual(await registry.deleteSession(s1), { deleted: true });
	assert.equal(existsSync(directory), false);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("deleteSession keeps bookkeeping when post-removal stat throws and the targeted path was never present", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	const missing = join(env.root, "not-the-session", "session.v4.jsonl");
	env.persistence.locate = () => ({ kind: "jsonl", path: missing });
	env.persistence.stat = async () => {
		throw new Error("SessionFormatError: format v4 tool/result at seq 1313 requires toolCallId matching its tool source");
	};

	await assert.rejects(() => registry.deleteSession(s1), /cannot verify|cannot delete/);
	const batch = await registry.deleteArchivedSessions({ scope: "sessions", sessionIds: [s1] });
	assert.equal(batch.failures.length, 1);
	assert.doesNotMatch(batch.failures[0].message, /可以永久删除/);
	assert.equal(existsSync(directory), true, "定位错了不能把真实目录记成已删除");
	assert.deepEqual(env.global.archivedSessionIds, [s1], "无法确认删除时必须保留归档标记");
});

test("pruneUnknownArchivedSessionIds removes ghost entries even if headers cache still contains the id", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100 }), header(s2, cwdA, { createdAt: 200 })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s1, s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	// 磁盘上 s2 文件被手工移除，persistence.stat 返回 undefined
	env.persistence.stat = async (id) => {
		if (id === s2) return undefined;
		const path = env.located.get(id);
		return path === void 0 ? undefined : { path };
	};
	// persistence.list 也已经没有 s2 了
	env.persistence.headers = env.persistence.headers.filter((item) => item.id !== s2);
	// 但是宿主内存里的 registry.headers 仍保留 s2（模拟宿主 headers 内存只增不减）
	assert.equal(registry.headers.has(s2), true);

	// 执行剪枝
	const pruned = await registry.pruneUnknownArchivedSessionIds();
	assert.deepEqual(pruned, [s1], "已不存在于磁盘的幽灵会话必须被剪掉");
	assert.deepEqual(env.global.archivedSessionIds, [s1], "持久化归档标记必须已清除幽灵会话");
	assert.equal(registry.headers.has(s2), false, "剪枝必须清掉宿主内存索引");
	await registry.indexHeaders([header(s2, cwdA, { createdAt: 200 })]);
	assert.equal(registry.headers.has(s2), false, "墓碑必须挡住 stale list() 把幽灵加回");
	env.persistence.headers.push(header(s2, cwdA, { createdAt: 999 }));
	assert.equal(await registry.sessionKnown(s2), true, "同 id 的新生命周期必须能冷复用");
});

test("新版快照列表中的冷子会话仍被级联删除，fork 保留", async () => {
	const env = buildRoot({
		headers: [
			header(s1),
			header(s2, void 0, { parentSession: s1, origin: "subagent" }),
			header(s3, void 0, { parentSession: s1, origin: "fork" }),
		],
		archived: [s1],
	});
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.list = async () =>
		env.persistence.headers.map((header) => ({ header, revision: "r1" }));
	delete env.persistence.prepare;
	const removed = [];
	env.ctx.on("api-session/removed", (id) => {
		assert.equal(
			existsSync(env.located.get(id)),
			false,
			"只在物理删除后发送完成通知",
		);
		removed.push(id);
	});
	await registry.deleteSession(s1);
	assert.equal(existsSync(env.located.get(s2)), false);
	assert.equal(existsSync(env.located.get(s3)), true);
	assert.deepEqual(removed, [s2, s1]);
});

test("新版快照列表允许已删除 id 的新冷生命周期复用", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s1);
	env.persistence.headers[0] = {
		...env.persistence.headers[0],
		createdAt: 1800000000000,
	};
	env.persistence.list = async () =>
		env.persistence.headers.map((header) => ({ header, revision: "r2" }));
	assert.equal(await registry.sessionKnown(s1), true);
});

test("持久化仍能观察到会话时不得提交删除记账或完成通知", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.stat = async () => ({
		header: env.persistence.headers[0],
		revision: "still-readable",
	});
	const removed = [];
	env.ctx.on("api-session/removed", (id) => removed.push(id));
	await assert.rejects(
		registry.deleteSession(s1),
		/still present in persistence/,
	);
	assert.deepEqual(env.global.archivedSessionIds, [s1]);
	assert.equal(registry.deletedSessionIds.has(s1), false);
	assert.deepEqual(removed, []);
});

test("batch delete failure keeps the host detail instead of a Chinese diagnosis", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	const denied = Object.assign(new Error("EPERM: operation not permitted"), { code: "EPERM" });
	env.persistence.locate = () => {
		throw denied;
	};
	const batch = await registry.deleteArchivedSessions({ scope: "sessions", sessionIds: [s1] });
	assert.match(batch.failures[0].message, /EPERM: operation not permitted/);
	assert.doesNotMatch(batch.failures[0].message, /没有权限|检查目录访问权限/);
	await assert.rejects(() => registry.deleteSession(s1), /EPERM: operation not permitted/);
	await assert.rejects(() => registry.deleteSession(s1), (error) => {
		assert.doesNotMatch(error.message, /没有权限|检查目录访问权限/);
		return true;
	});
});

test("stat text that mentions still present does not override a confirmed removal", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	env.persistence.stat = async () => {
		throw new Error("session is still present in persistence after artifact removal");
	};
	assert.deepEqual(await registry.deleteSession(s1), { deleted: true });
	assert.equal(existsSync(directory), false);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("新版投影读取失败仍关闭只读句柄", async () => {
	let closed = false;
	await assert.rejects(
		ArchiveWorkspaceRegistry.prototype.readStoredProjectionSource.call(
			{},
			{
				open: async (_id, access) => {
					assert.equal(access, "read");
					return {
						read: async () => {
							throw new Error("read failed");
						},
						close: async () => {
							closed = true;
						},
					};
				},
			},
			s1,
		),
		/read failed/,
	);
	assert.equal(closed, true);
});

test("deleteSession uses the initialized JSONL root after cwd changes", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const initialCwd = process.cwd();
	try {
		process.chdir(env.root);
		env.persistence.config.root = "transcripts";
		// The official backend resolves and stores root once in its constructor.
		env.persistence.root = resolve(env.persistence.config.root);
		const registry = await mountWorkspaceRegistry(env);
		process.chdir(initialCwd);
		await registry.deleteSession(s1);
		assert.equal(
			existsSync(directory),
			false,
			"cwd changes must not leave a session directory",
		);
		assert.equal(existsSync(dirname(directory)), true);
		assert.deepEqual(env.global.archivedSessionIds, []);
	} finally {
		process.chdir(initialCwd);
	}
});

for (const [id, segment] of [
	[".", "~002E"],
	["..", "~002E~002E"],
	["a/b:中~😀", "a~002Fb~003A~4E2D~007E~D83D~DE00"],
]) {
	test(`deleteSession handles official JSONL encoded id ${segment}`, async () => {
		const env = buildRoot({ headers: [header(s1)] });
		// Change metadata only after the generic fixture has created its safe path.
		env.persistence.headers[0].id = id;
		const directory = installJsonlLayout(env, id, { segment });
		const registry = await mountWorkspaceRegistry(env);
		await registry.deleteSession(id);
		assert.equal(existsSync(directory), false);
		assert.equal(existsSync(dirname(directory)), true);
	});
}

for (const [cwd, project] of [
	["/work/项目", "--work-~9879~76EE--"],
	["C:\\work\\project", "--C-work-project--"],
	["/", "--root--"],
	["/" + "a".repeat(260), `--${"a".repeat(251)}--`],
]) {
	test(`deleteSession handles official JSONL project key ${project}`, async () => {
		const env = buildRoot({ headers: [header(s1)] });
		env.persistence.headers[0].cwd = cwd;
		const directory = installJsonlLayout(env, s1, { project });
		const registry = await mountWorkspaceRegistry(env);
		await registry.deleteSession(s1);
		assert.equal(existsSync(directory), false);
		assert.equal(existsSync(dirname(directory)), true);
	});
}

for (const scenario of [
	"unknown backend",
	"missing root",
	"wrong root",
	"wrong initialized root",
	"relative initialized root",
	"wrong kind",
	"wrong filename",
	"wrong session",
	"wrong project",
	"storage root",
]) {
	test(`deleteSession preserves the parent for ${scenario}`, async () => {
		const env = buildRoot({ headers: [header(s1)] });
		let directory = installJsonlLayout(env, s1, {
			...(scenario === "wrong filename" ? { filename: "custom.jsonl" } : {}),
			...(scenario === "wrong session" ? { segment: s2 } : {}),
			...(scenario === "wrong project" ? { project: "shared" } : {}),
		});
		if (scenario === "unknown backend")
			env.persistence.name = "custom-persistence";
		if (scenario === "missing root") delete env.persistence.config.root;
		if (scenario === "wrong root") env.persistence.config.root = env.root;
		if (scenario === "wrong initialized root") env.persistence.root = env.root;
		if (scenario === "relative initialized root")
			env.persistence.root = "transcripts";
		if (scenario === "wrong kind")
			env.persistence.locate = () => ({
				kind: "custom",
				path: env.located.get(s1),
			});
		if (scenario === "storage root") {
			directory = env.persistence.config.root;
			env.located.set(s1, join(directory, "session.jsonl.zstd"));
			writeFileSync(env.located.get(s1), "stub");
		}
		const retained = join(directory, "keep.txt");
		writeFileSync(retained, "not proven to belong to this session");
		const registry = await mountWorkspaceRegistry(env);
		await registry.deleteSession(s1);
		assert.equal(existsSync(env.located.get(s1)), false);
		assert.equal(existsSync(retained), true);
		assert.equal(existsSync(directory), true);
	});
}

test("JSONL relative config without an initialized root warns and retains the parent", async () => {
	const env = buildRoot({ headers: [header(s1)] });
	const directory = installJsonlLayout(env, s1);
	env.persistence.config.root = "transcripts";
	const warnings = [];
	const initialCwd = process.cwd();
	try {
		// Even when current cwd happens to match, there is no captured root identity.
		process.chdir(env.root);
		await ArchiveWorkspaceRegistry.prototype.removeTranscriptDirectory.call(
			{
				ctx: {
					get: () => env.persistence,
					logger: { warn: (message) => warnings.push(message) },
				},
				readSessionHeader: async () => env.persistence.headers[0],
			},
			s1,
		);
		assert.equal(existsSync(env.located.get(s1)), false);
		assert.equal(existsSync(directory), true);
		assert.equal(warnings.length, 1, "official-backend fallback must be visible");
		assert.match(
			warnings[0],
			/directory ownership could not be verified.*artifact-only deletion/,
		);
		assert.ok(warnings[0].includes(s1));
		assert.ok(warnings[0].includes(env.located.get(s1)));
	} finally {
		process.chdir(initialCwd);
	}
});

test("deleteSession does not follow links inside an owned JSONL directory", async () => {
	const env = buildRoot({ headers: [header(s1)] });
	const directory = installJsonlLayout(env, s1);
	const external = join(env.root, "external");
	mkdirSync(external);
	const retained = join(external, "keep.txt");
	writeFileSync(retained, "external data");
	symlinkSync(
		external,
		join(directory, "attachment-link"),
		process.platform === "win32" ? "junction" : "dir",
	);
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s1);
	assert.equal(existsSync(directory), false);
	assert.equal(existsSync(retained), true);
});

test("deleteArchivedSessions retries a partially removed official JSONL directory", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const retained = join(directory, "attachment.txt");
	writeFileSync(retained, "retry me");
	const registry = await mountWorkspaceRegistry(env);
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	fsPromises.rm = async (path, options) => {
		if (path === directory) {
			await originalRm(env.located.get(s1), { force: true });
			throw new Error("directory cleanup failed");
		}
		return originalRm(path, options);
	};
	syncBuiltinESMExports();
	try {
		const failed = await registry.deleteArchivedSessions({ scope: "all" });
		assert.equal(failed.failures.length, 1);
		assert.match(
			failed.failures[0].message,
			/cleanup of session directory .* failed; bookkeeping retained for retry/,
		);
		assert.ok(
			failed.failures[0].message.includes(`"${directory}"`),
			"report the actual directory target",
		);
		assert.doesNotMatch(
			failed.failures[0].message,
			/remains before bookkeeping cleanup/,
		);
		assert.equal(existsSync(env.located.get(s1)), false);
		assert.equal(existsSync(retained), true);
		assert.deepEqual(env.global.archivedSessionIds, [s1]);
		assert.equal(await registry.sessionKnown(s1), true);
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
	const retried = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(retried.deletedSessionIds, [s1]);
	assert.equal(existsSync(directory), false);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("deleteSession retries bookkeeping after the official JSONL directory is gone", async () => {
	const env = buildRoot({ headers: [header(s1)], archived: [s1] });
	const directory = installJsonlLayout(env, s1);
	const registry = await mountWorkspaceRegistry(env);
	env.domain.globalSetError = new Error("state write failed");
	await assert.rejects(() => registry.deleteSession(s1), /state write failed/);
	assert.equal(existsSync(directory), false);
	env.domain.globalSetError = null;
	await registry.deleteSession(s1);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

for (const level of ["project", "session"]) {
	test(`deleteSession refuses a symlinked JSONL ${level} directory`, async () => {
		const env = buildRoot({ headers: [header(s1)], archived: [s1] });
		const directory = installJsonlLayout(env, s1);
		const target = level === "project" ? dirname(directory) : directory;
		const external = join(env.root, "external");
		renameSync(target, external);
		symlinkSync(
			external,
			target,
			process.platform === "win32" ? "junction" : "dir",
		);
		const retainedLog = join(
			external,
			...(level === "project" ? [s1] : []),
			"session.jsonl.zstd",
		);
		const registry = await mountWorkspaceRegistry(env);

		await assert.rejects(() => registry.deleteSession(s1), /symbolic link/);

		assert.equal(
			existsSync(retainedLog),
			true,
			"never follow directory links during deletion",
		);
		assert.deepEqual(
			env.global.archivedSessionIds,
			[s1],
			"leave the operation retryable",
		);
		assert.equal(await registry.sessionKnown(s1), true);
	});
}

test("deleteSession deletes only the backend-owned transcript artifact", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
	});
	const sharedDirectory = join(env.root, "shared-transcripts");
	const firstArtifact = join(sharedDirectory, "first.jsonl");
	const secondArtifact = join(sharedDirectory, "second.jsonl");
	mkdirSync(sharedDirectory, { recursive: true });
	writeFileSync(firstArtifact, "first");
	writeFileSync(secondArtifact, "second");
	env.located.set(s1, firstArtifact);
	env.located.set(s2, secondArtifact);
	const registry = await mountWorkspaceRegistry(env);

	await registry.deleteSession(s1);

	assert.equal(existsSync(firstArtifact), false, "目标会话工件必须被删除");
	assert.equal(
		existsSync(secondArtifact),
		true,
		"同目录的其他会话工件不得被删除",
	);
});

test("deleteArchivedSessions snapshots a workspace scope, continues after failures, and reports partial success", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
		archived: [s1, s2, s3],
	});
	const registry = await mountWorkspaceRegistry(env);
	const originalDelete = env.projCache.delete;
	env.projCache.delete = async (id) => {
		if (id === s1) throw new Error("cache write failed");
		return originalDelete.call(env.projCache, id);
	};
	const result = await registry.deleteArchivedSessions({
		scope: "workspace",
		workspaceId: A,
	});
	assert.deepEqual(result.requestedSessionIds, [s1, s2]);
	assert.deepEqual(result.deletedSessionIds, [s2]);
	assert.deepEqual(result.skippedSessionIds, []);
	assert.equal(result.failures.length, 1);
	assert.equal(result.failures[0].sessionId, s1);
	assert.match(result.failures[0].message, /cache write failed/);
	assert.deepEqual(
		env.global.archivedSessionIds,
		[s1, s3],
		"失败会话保留归档标记，后续批量删除可重试",
	);
	assert.equal(
		existsSync(env.located.get(s1)),
		true,
		"failed target keeps its transcript for diagnosis",
	);
	assert.equal(
		existsSync(env.located.get(s2)),
		false,
		"later targets still complete",
	);
});

test("批量删除只为级联预取一次存储列举，墓碑淘汰后也不重建已删索引", async () => {
	const env = buildRoot({
		headers: [
			header(s1, cwdA),
			header(s2, cwdA),
			header(s3, cwdB),
			header(s4, cwdB, { parentSession: s1, origin: "subagent" }),
		],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
		archived: [s1, s2, s3],
	});
	const registry = await mountWorkspaceRegistry(env);
	registry.deletedSessionTombstoneLimit = 1;
	let lists = 0;
	const indexedDuring = [];
	env.persistence.list = async () => {
		lists += 1;
		return env.persistence.headers
			.filter((item) => existsSync(env.located.get(item.id)))
			.map((header) => ({ header }));
	};
	const originalIndex = registry.indexHeader.bind(registry);
	registry.indexHeader = async (header) => {
		indexedDuring.push(header.id);
		return originalIndex(header);
	};

	const result = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(result.deletedSessionIds, [s1, s2, s3]);
	assert.deepEqual(result.failures, []);
	assert.equal(lists, 1, "整批只允许一次级联预取；索引重建不得再读这份列表");
	assert.deepEqual(indexedDuring, [], "批次期间不得把存储列表送进 indexHeader");
	assert.equal(registry.headers.has(s1), false);
	assert.equal(registry.headers.has(s4), false, "子会话仍要级联删除");
	assert.equal(existsSync(env.located.get(s4)), false);
	assert.equal(registry.archivedBatchHeaders, undefined);

	const before = lists;
	await registry.listStoredHeaders();
	assert.equal(lists, before + 1, "批后列举必须重新读存储，不能留下批次快照");
});

test("批量级联预取失败后按会话重试列举，不缓存失败结果", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s1, s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	let lists = 0;
	env.persistence.list = async () => {
		lists += 1;
		if (lists === 1) throw new Error("list failed");
		return env.persistence.headers
			.filter((item) => existsSync(env.located.get(item.id)))
			.map((header) => ({ header }));
	};

	const result = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(result.deletedSessionIds, [s1, s2]);
	assert.deepEqual(result.failures, []);
	assert.equal(lists, 3, "预取失败一次后，每个会话的级联枚举必须各自重试");
});

test("deleteArchivedSessions clears every remaining trace for unknown sessions", async () => {
	const env = buildRoot({
		workspaces: { [A]: workspace("D:\\proj-a", [sUnknown]) },
		archived: [sUnknown, sUnknown],
	});
	const spillPath = sessionDir(join(env.root, "spill"), sUnknown);
	mkdirSync(spillPath, { recursive: true });
	writeFileSync(join(spillPath, "stale.txt"), "stale");
	const registry = await mountWorkspaceRegistry(env);
	const result = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(result.requestedSessionIds, [sUnknown]);
	assert.deepEqual(result.deletedSessionIds, []);
	assert.deepEqual(result.skippedSessionIds, [sUnknown]);
	assert.deepEqual(result.failures, []);
	assert.deepEqual(
		env.global.archivedSessionIds,
		[],
		"unknown targets must not leave permanent archive markers",
	);
	assert.deepEqual(
		env.table.get(A).sessionIds,
		[],
		"unknown targets must be removed from workspace accounting",
	);
	assert.deepEqual(
		env.cacheCalls.deleted,
		[sUnknown],
		"unknown targets must purge stale projection rows",
	);
	assert.deepEqual(
		env.cacheCalls.cleared,
		[sUnknown],
		"a transient cache tombstone must be released after the purge",
	);
	assert.equal(
		existsSync(spillPath),
		false,
		"unknown targets must remove stale spill data",
	);
});

test("deleteArchivedSessions keeps the marker retryable when unknown-session cleanup fails", async () => {
	const env = buildRoot({
		workspaces: { [A]: workspace("D:\\proj-a", [sUnknown]) },
		archived: [sUnknown],
	});
	env.projCache.delete = async () => {
		throw new Error("cache cleanup failed");
	};
	const registry = await mountWorkspaceRegistry(env);
	const result = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(result.skippedSessionIds, []);
	assert.equal(result.failures.length, 1);
	assert.match(result.failures[0].message, /cache cleanup failed/);
	assert.deepEqual(
		env.global.archivedSessionIds,
		[sUnknown],
		"failed cleanup must preserve the archive marker for retry",
	);
	assert.deepEqual(
		env.table.get(A).sessionIds,
		[sUnknown],
		"cache cleanup runs before workspace bookkeeping changes",
	);
});

test("deleteSession keeps retryable state when archive bookkeeping fails after physical deletion", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	env.domain.globalSetError = new Error("state write failed");
	await assert.rejects(() => registry.deleteSession(s2), /state write failed/);
	assert.equal(
		existsSync(env.located.get(s2)),
		false,
		"物理删除成功后不得回滚已删除工件",
	);
	assert.deepEqual(
		env.global.archivedSessionIds,
		[s2],
		"失败记账必须保留归档标记供重试",
	);
	assert.deepEqual(
		env.table.get(A).sessionIds,
		[s1, s2],
		"失败记账必须保留工作区引用供重试",
	);
	env.domain.globalSetError = null;
	await registry.deleteSession(s2);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
});

test("deleteSession retains the transcript after a physical failure and succeeds on retry", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	const registry = await mountWorkspaceRegistry(env);
	// 进程级补丁：本文件测试按顺序执行，且 finally 会在退出前恢复内置绑定。
	fsPromises.rm = async () => {
		throw new Error("rm failed");
	};
	syncBuiltinESMExports();
	try {
		await assert.rejects(
			() => registry.deleteSession(s2),
			(error) => {
				assert.match(
					error.message,
					/cleanup of transcript artifact .* failed; bookkeeping retained for retry/,
				);
				assert.ok(
					error.message.includes(`"${env.located.get(s2)}"`),
					"report the actual artifact target",
				);
				assert.equal(error.cause.message, "rm failed");
				return true;
			},
		);
		assert.deepEqual(
			env.global.archivedSessionIds,
			[s2],
			"物理删除失败时必须保留归档标记",
		);
		assert.deepEqual(
			env.table.get(A).sessionIds,
			[s1, s2],
			"物理删除失败时必须保留工作区记账",
		);
		assert.equal(
			existsSync(env.located.get(s2)),
			true,
			"physical deletion failure leaves the transcript for recovery",
		);
		assert.equal(
			await registry.sessionKnown(s2),
			true,
			"failed physical delete must keep the header index for retry",
		);
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
	await registry.deleteSession(s2);
	assert.equal(
		existsSync(env.located.get(s2)),
		false,
		"retry removes the retained transcript",
	);
	assert.equal(
		await registry.sessionKnown(s2),
		false,
		"successful retry forgets the header and records the tombstone",
	);
});

test("deleteArchivedSessions keeps a physical failure in its retryable target", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	const registry = await mountWorkspaceRegistry(env);
	fsPromises.rm = async () => {
		throw new Error("rm failed");
	};
	syncBuiltinESMExports();
	try {
		const failed = await registry.deleteArchivedSessions({
			scope: "workspace",
			workspaceId: A,
		});
		assert.deepEqual(failed.requestedSessionIds, [s2]);
		assert.equal(failed.failures.length, 1);
		assert.deepEqual(env.global.archivedSessionIds, [s2]);
		assert.deepEqual(env.table.get(A).sessionIds, [s1, s2]);
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
	const retried = await registry.deleteArchivedSessions({
		scope: "workspace",
		workspaceId: A,
	});
	assert.deepEqual(
		retried.requestedSessionIds,
		[s2],
		"同一批量目标必须仍能选中失败会话",
	);
	assert.deepEqual(retried.deletedSessionIds, [s2]);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
});

test("deleteSession on a live session flushes, detaches, emits session/disposed, and waits for the cache write-behind before deleting the row", async () => {
	const liveSession = { id: sLive, header: header(sLive, cwdA), events: [] };
	const env = buildRoot({
		headers: [header(s1, cwdA), header(sLive, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, sLive]) },
		live: [liveSession],
	});
	// Make the fake cache order-sensitive: whenIdle must be awaited before delete.
	const order = [];
	env.projCache.whenIdle = async () => {
		order.push("whenIdle");
	};
	env.projCache.delete = async (id) => {
		order.push(`delete:${id}`);
	};
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(sLive);
	assert.deepEqual(env.sessions.flushed, [sLive]);
	assert.deepEqual(env.sessions.detached, [sLive]);
	assert.deepEqual(order, ["whenIdle", `delete:${sLive}`]);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
	assert.equal(registry.get(A).sessionIds.length, 1);
	assert.equal(
		existsSync(env.located.get(sLive)),
		false,
		"live session transcript artifact removed",
	);
});

test("deleteSession cascades to SUBAGENT children (origin = subagent) but never to fork branches", async () => {
	// s5: subagent child of s4 (cascade-deleted); s2: fork branch of s4
	// (parentSession set, no subagent origin — an independent user session)
	const env = buildRoot({
		headers: [
			header(s4, cwdA),
			header(s5, cwdA, { parentSession: s4, origin: "subagent" }),
			header(s2, cwdA, { parentSession: s4 }),
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s4, s5, s2]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s4);
	assert.deepEqual(
		env.cacheCalls.deleted.sort(),
		[s4, s5].sort(),
		"only the subagent child is cascade-deleted",
	);
	assert.deepEqual(
		env.table.get(A).sessionIds,
		[s2],
		"the fork branch survives",
	);
	assert.equal(
		existsSync(env.located.get(s5)),
		false,
		"cascade child transcript artifact removed",
	);
	assert.equal(
		existsSync(env.located.get(s2)),
		true,
		"fork branch transcript dir kept",
	);
	assert.equal(await registry.sessionKnown(s4), false);
	assert.equal(
		await registry.sessionKnown(s5),
		false,
		"cascade child must also leave the header index",
	);
	assert.equal(await registry.sessionKnown(s2), true);
});

test("deleteSession forgets the in-memory header index so the id cannot be re-archived", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	assert.equal(
		await registry.sessionKnown(s2),
		false,
		"deleted session must leave the parent header index",
	);
	await assert.rejects(registry.archiveSession(s2), (error) =>
		error?.name === "WorkspaceUnknownSessionError" || error?.constructor?.name === "WorkspaceUnknownSessionError");
	assert.equal(
		env.global.archivedSessionIds.includes(s2),
		false,
		"deleted session must not re-enter the archive set",
	);
	assert.deepEqual(await registry.deleteSession(s2), { deleted: true });
	// persistence.list() still returns the deleted header; probing another id
	// re-indexes and must not resurrect the forgotten session.
	assert.equal(await registry.sessionKnown(sUnknown), false);
	assert.equal(
		await registry.sessionKnown(s2),
		false,
		"stale persistence.list() must not resurrect a deleted session",
	);
	assert.equal(await registry.sessionKnown(s1), true);
});

test("live reuse removes the tombstone from both the set and the order queue", async () => {
	const liveSession = { id: sLive, header: header(sLive, cwdA), events: [] };
	const env = buildRoot({
		headers: [header(s1, cwdA), header(sLive, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, sLive]) },
		live: [liveSession],
	});
	const registry = await mountWorkspaceRegistry(env);
	registry.forgetIndexedSession(sLive);
	assert.equal(registry.deletedSessionIds.has(sLive), true);
	assert.equal(registry.deletedSessionOrder.includes(sLive), true);
	assert.equal(await registry.sessionKnown(sLive), true);
	assert.equal(registry.deletedSessionIds.has(sLive), false);
	assert.equal(registry.deletedSessionOrder.includes(sLive), false);
	assert.deepEqual(
		env.cacheCalls.cleared,
		[sLive],
		"live reuse must also clear the projection-cache tombstone",
	);
	registry.forgetIndexedSession(sLive);
	assert.equal(
		registry.deletedSessionOrder.filter((id) => id === sLive).length,
		1,
	);
});

test("deletedSessionIds evicts the oldest tombstone after the cap", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	const limit = registry.deletedSessionTombstoneLimit;
	assert.ok(limit > 0);
	for (let i = 0; i < limit + 3; i++) registry.forgetIndexedSession(`gone-${i}`);
	assert.equal(registry.deletedSessionIds.has("gone-0"), false);
	assert.equal(registry.deletedSessionIds.has(`gone-${limit + 2}`), true);
	assert.ok(registry.deletedSessionIds.size <= limit);
});

test("markRemoteMethod registers single and batch archive methods on the service prototype", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	const methods = remoteMethods(registry).map((item) => item.method);
	assert.ok(
		methods.includes("unarchiveSession"),
		"unarchiveSession must be marked Remote",
	);
	assert.ok(
		methods.includes("deleteSession"),
		"deleteSession must be marked Remote",
	);
	assert.ok(
		methods.includes("deleteArchivedSessions"),
		"deleteArchivedSessions must be marked Remote",
	);
	assert.ok(
		methods.includes("archivedSessionMetadata"),
		"archivedSessionMetadata must be marked Remote",
	);
	assert.ok(
		methods.includes("scheduledSessionIds"),
		"scheduledSessionIds must be marked Remote",
	);
});

test("scheduledSessionIds 只返回绑定活动定时任务的会话，去重且忽略已结束任务", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\proj-a", [s1, s2]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	const catalog = [
		{ id: "t1", sessionId: s1, status: "active" },
		{ id: "t2", sessionId: s1, status: "active" },
		{ id: "t3", sessionId: s2, status: "inactive" },
		{ id: "t4", sessionId: "session-unknown", status: "active" },
	];
	env.ctx.provide("schedule", { catalog: async () => catalog });
	assert.deepEqual(await registry.scheduledSessionIds(), {
		scheduledSessionIds: [s1, "session-unknown"],
	});
});

test("scheduledSessionIds 在宿主没有 schedule 服务或读取失败时降级为空集合", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\proj-a", [s1]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.scheduledSessionIds(), { scheduledSessionIds: [] });

	// 独立环境：同一 Cordis 上下文不允许对同名服务重复 provide。
	const throwingEnv = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\proj-a", [s1]) },
	});
	throwingEnv.ctx.provide("schedule", { catalog: async () => { throw new Error("catalog down"); } });
	const throwingRegistry = await mountWorkspaceRegistry(throwingEnv);
	assert.deepEqual(await throwingRegistry.scheduledSessionIds(), { scheduledSessionIds: [] });

	const malformedEnv = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\proj-a", [s1]) },
	});
	malformedEnv.ctx.provide("schedule", { catalog: async () => "not-an-array" });
	const malformedRegistry = await mountWorkspaceRegistry(malformedEnv);
	assert.deepEqual(await malformedRegistry.scheduledSessionIds(), { scheduledSessionIds: [] });
});

test("deleteSession cascade skips already-deleted subagent children", async () => {
	const env = buildRoot({
		headers: [
			header(s4, cwdA),
			header(s5, cwdA, { parentSession: s4, origin: "subagent" }),
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s4, s5]) },
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s5);
	await registry.deleteSession(s4);
	assert.equal(await registry.sessionKnown(s4), false);
	assert.equal(await registry.sessionKnown(s5), false);
});

test("历史缓存键映射保持稳定，仅用于读取旧数据", () => {
	const id = "im:historical:dm:user";
	const key = projectionCacheStorageKey(id);
	assert.match(key, /^session_[A-Za-z0-9_-]{43}$/);
	assert.equal(projectionCacheStorageKey(id), key);
	assert.notEqual(projectionCacheStorageKey("another"), key);
});

test("cold reuse of a deleted id (new lifecycle) clears the tombstone; a stale same-lifecycle header stays unknown", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	// stale list()：同一生命周期（同 createdAt）的旧头部仍视为未知。
	assert.equal(await registry.sessionKnown(s2), false);
	// 另一进程以同 id 重建并落盘新生命周期（createdAt 不同）：撤墓碑放行。
	env.persistence.headers = env.persistence.headers.map((item) =>
		item.id === s2 ? { ...item, createdAt: 1800000000000 } : item,
	);
	assert.equal(await registry.sessionKnown(s2), true);
	assert.equal(
		registry.deletedSessionIds.has(s2),
		false,
		"cold reuse must clear the tombstone",
	);
	assert.deepEqual(
		env.cacheCalls.cleared,
		[s2],
		"cold reuse must also clear the projection-cache tombstone",
	);
	// 撤墓碑后可重新归档（headers 已重新编入索引）。
	await registry.archiveSession(s2);
	assert.deepEqual(env.global.archivedSessionIds, [s2]);
});

test("cold-reuse probe normalizes a missing cwd on both sides of the identity comparison", async () => {
	// 删除时身份带 cwd，list 返回同 createdAt 但无 cwd 的头部：形状不同即身份不同，按新生命周期放行。
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2],
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	env.persistence.headers = env.persistence.headers.map((item) =>
		item.id === s2 ? { id: s2, createdAt: 1700000000000 } : item,
	);
	assert.equal(
		await registry.sessionKnown(s2),
		true,
		"a header whose cwd shape differs from the deleted identity is a new lifecycle",
	);
	// 双侧均无 cwd 的同生命周期头部：归一为 null 后相等，仍拦截。
	const env2 = buildRoot({
		headers: [{ id: s3, createdAt: 1700000000000 }],
		workspaces: {},
		archived: [s3],
	});
	const registry2 = await mountWorkspaceRegistry(env2);
	await registry2.deleteSession(s3);
	assert.equal(
		await registry2.sessionKnown(s3),
		false,
		"both-missing cwd normalizes to null and keeps the stale header unknown",
	);
});

test("typert gateway SRC: claims + dispatch single and batch archive methods end to end", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
	});
	const registry = await mountWorkspaceRegistry(env);
	new TypertRegistry(env.ctx);
	let captured;
	env.ctx.provide("connection", {
		rpc: {
			intercept(channel, matches, handler, options) {
				captured = { channel, matches, handler, options };
				return () => {};
			},
		},
	});
	new TypertGatewayService(env.ctx);
	await tick(); // ctx.inject registers the interceptor asynchronously
	assert.ok(captured, "gateway must register a /api interceptor");
	assert.ok(
		env.ctx.get("typert").local.get("workspaceRegistry/deleteSession") !==
			undefined,
		"late typert still receives the host contribution",
	);
	assert.equal(captured.channel, "/api");
	assert.equal(captured.matches("workspaceRegistry/setSessionFavorite"), true);
	const favorite = await gatewayCall(captured.handler, "workspaceRegistry/setSessionFavorite", { input: { sessionId: s1, favorite: true } });
	assert.equal(favorite.ok, true);
	assert.deepEqual(favorite.value.favoriteSessionIds, [s1]);
	const favorites = await gatewayCall(captured.handler, "workspaceRegistry/favoriteSessions", {});
	assert.deepEqual(favorites.value.favoriteSessionIds, [s1]);
	const malformedFavorite = await gatewayCall(captured.handler, "workspaceRegistry/setSessionFavorite", { input: { sessionId: s1, favorite: "true" } });
	assert.equal(malformedFavorite.ok, false);
	// 通过真实网关验证新描述符的参数解析、只读调用及返回编解码。
    await registry.archiveSession(s1);
    env.persistence.open = async () => ({
      header: env.persistence.headers.find((item) => item.id === s1),
      inheritedEventCount: 0,
      read: async () => ({ events: [{ seq: 1, type: "user/message", data: { content: "检索测试正文" } }] }),
      close: async () => {},
    });
    const searched = await gatewayCall(captured.handler, "workspaceRegistry/searchArchivedContent", { input: { sessionIds: [s1], query: "正文" } });
    assert.equal(searched.ok, true);
    assert.equal(searched.value.items[0].sessionId, s1);
    const previewed = await gatewayCall(captured.handler, "workspaceRegistry/previewArchivedSession", { input: { sessionId: s1 } });
    assert.equal(previewed.ok, true);
    assert.equal(previewed.value.messages[0].text, "检索测试正文");
    const details = await gatewayCall(captured.handler, "workspaceRegistry/sessionDetails", { input: { sessionIds: [s1] } });
    assert.equal(details.ok, true);
    assert.equal(details.value.items[0].turnCount, 1);
    assert.equal(details.value.items[0].path, env.located.get(s1));
    const invalidDetails = await gatewayCall(captured.handler, "workspaceRegistry/sessionDetails", { input: { sessionIds: [] } });
    assert.equal(invalidDetails.ok, false);
    const invalidSearch = await gatewayCall(captured.handler, "workspaceRegistry/searchArchivedContent", { input: { sessionIds: [s1], query: "" } });
    assert.equal(invalidSearch.ok, false);
    // SRC claims for the new endpoints
	assert.equal(captured.matches("workspaceRegistry/unarchiveSession"), true);
	assert.equal(captured.matches("workspaceRegistry/deleteSession"), true);
	assert.equal(
		captured.matches("workspaceRegistry/deleteArchivedSessions"),
		true,
	);
	assert.equal(
		captured.matches("workspaceRegistry/archivedSessionMetadata"),
		true,
	);
	// legacy endpoints stay with the apiproxy (not claimed)
	assert.equal(captured.matches("workspace.archiveSession"), false);
	assert.equal(captured.matches("workspace.list"), false);
	// dispatch: unarchiveSession
	const unarchive = await gatewayCall(captured.handler, "workspaceRegistry/unarchiveSession", { sessionId: s1 });
	assert.equal(unarchive.ok, true);
	assert.deepEqual(unarchive.value, { archivedSessionIds: [] });
	await registry.archiveSession(s1);
	const metadata = await gatewayCall(captured.handler, "workspaceRegistry/archivedSessionMetadata", {});
	assert.equal(metadata.ok, true);
	assert.deepEqual(metadata.value, {
		items: [{ sessionId: s1, createdAt: 1700000000000 }],
	});
	await registry.unarchiveSession(s1);
	await registry.archiveSession(s1);
	await registry.archiveSession(s2);
	const deleteBatch = await gatewayCall(captured.handler, "workspaceRegistry/deleteArchivedSessions", { target: { scope: "workspace", workspaceId: A } });
	assert.equal(deleteBatch.ok, true);
	assert.deepEqual(deleteBatch.value.requestedSessionIds, [s1, s2]);
	assert.deepEqual(deleteBatch.value.deletedSessionIds, [s1, s2]);
	assert.deepEqual(deleteBatch.value.failures, []);
	// dispatch: deleteSession
	const del = await gatewayCall(captured.handler, "workspaceRegistry/deleteSession", { sessionId: s3 });
	assert.equal(del.ok, true);
	assert.deepEqual(del.value, { deleted: true });
	assert.deepEqual(env.table.get(B).sessionIds, []);
	assert.equal(
		existsSync(env.located.get(s3)),
		false,
		"transcript dir removed via gateway dispatch",
	);
	// dispatch: unknown session is cleaned without failing the rpc
	const unknown = await gatewayCall(captured.handler, "workspaceRegistry/deleteSession", { sessionId: sUnknown });
	assert.equal(unknown.ok, true);
	assert.deepEqual(unknown.value, { deleted: true });
	// dispatch: missing args is rejected
	const bad = await gatewayCall(captured.handler, "workspaceRegistry/unarchiveSession", {});
	assert.equal(bad.ok, false);
});

// 生产环境 404：网关优先认 typert.local。Host 必须在 typert 就绪后写入严格描述符。
test("typert local contribution registers deleteSession before SRC discovery", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
	});
	new TypertRegistry(env.ctx);
	await mountWorkspaceRegistry(env);
	const local = env.ctx.get("typert").local;
	assert.ok(
		local.get("workspaceRegistry/deleteSession") !== undefined,
		"host must register workspaceRegistry/deleteSession on typert.local",
	);
	assert.ok(
		local.get("workspaceRegistry/unarchiveSession") !== undefined,
		"host must register workspaceRegistry/unarchiveSession on typert.local",
	);
	assert.ok(
		local.get("workspaceRegistry/deleteArchivedSessions") !== undefined,
		"host must register workspaceRegistry/deleteArchivedSessions on typert.local",
	);
	assert.ok(
		local.get("workspaceRegistry/archivedSessionMetadata") !== undefined,
		"host must register workspaceRegistry/archivedSessionMetadata on typert.local",
	);
	assert.equal(
		local.get("workspaceRegistry/deleteSession").service,
		"workspaceRegistry",
	);
	assert.equal(
		local.get("workspaceRegistry/deleteSession").method,
		"deleteSession",
	);
	const deleteSession = local.get("workspaceRegistry/deleteSession");
	assert.equal(typeof deleteSession.parameters[0].codec.create, "function");
	assert.equal(typeof deleteSession.result.create, "function");
	assert.equal(deleteSession.parameters[0].codec.create(), deleteSession.parameters[0].codec.schema);
});
test("legacy workspaceRegistry API surface is intact", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
		},
	});
	const registry = await mountWorkspaceRegistry(env);
	const wsA = registry.get(A);
	await wsA.insertSessionBefore(s2, s1);
	assert.deepEqual(registry.get(A).sessionIds, [s2, s1]);
	assert.equal(await registry.delete(A), true);
	assert.deepEqual(
		registry.list().map((w) => w.id),
		[B],
	);
	await registry.archiveSession(s3);
	assert.deepEqual(env.global.archivedSessionIds, [s3]);
});

test("归档检索与预览只读日志，不激活会话、不修改归档或工作区", async () => {
  const env = buildRoot({ headers: [header(s1), header(s2)], archived: [s1, s2] });
  const registry = await mountWorkspaceRegistry(env);
  const events = [{ type: "user/message", seq: 0, data: { content: [{ type: "text", text: "订单退款" }] } }];
  env.persistence.open = async id => {
    if (id === s2) throw new Error("读取失败");
    return { header: env.persistence.headers.find((item) => item.id === id), inheritedEventCount: 0, read: async () => ({ events }), close: async () => {} };
  };
  const found = await registry.searchArchivedContent({ sessionIds: [s1, s2], query: "退款" });
  assert.equal(found.items[0].sessionId, s1);
  assert.equal(found.failures[0].sessionId, s2);
  const preview = await registry.previewArchivedSession({ sessionId: s1 });
  assert.equal(preview.messages[0].text, "订单退款");
  assert.deepEqual(env.global.archivedSessionIds, [s1, s2]);
  assert.deepEqual(env.persistence.prepared, []);
  await assert.rejects(registry.previewArchivedSession({ sessionId: s3 }), /归档/);
});

test("新版预览关闭只读句柄，失败也关闭，期间恢复的会话不返回旧内容", async () => {
  const env = buildRoot({ headers: [header(s1)], archived: [s1] });
  const registry = await mountWorkspaceRegistry(env);
  let closed = 0;
  env.persistence.open = async (_id, mode) => {
    assert.equal(mode, "read");
    return { header: header(s1), read: async () => { throw new Error("损坏日志"); }, close: async () => { closed++; } };
  };
  await assert.rejects(registry.previewArchivedSession({ sessionId: s1 }), /损坏日志/);
  assert.equal(closed, 1);
  env.persistence.open = async () => ({ header: header(s1), read: async () => { env.global.archivedSessionIds = []; return { events: [] }; }, close: async () => { closed++; } });
  await assert.rejects(registry.previewArchivedSession({ sessionId: s1 }), /归档/);
  assert.equal(closed, 2);
});

test("会话详情统计用户轮次，读取失败保留定位路径且不激活会话", async () => {
  const env = buildRoot({ headers: [header(s1), header(s2)], archived: [s1] });
  const registry = await mountWorkspaceRegistry(env);
  env.persistence.open = async id => {
    if (id === s2) throw new Error("旧日志无法转换");
    return {
      header: env.persistence.headers.find((item) => item.id === id),
      inheritedEventCount: 0,
      read: async () => ({ events: [
        { seq: 0, type: "user/message", data: { source: { kind: "user" }, content: [{ type: "image" }] } },
        { seq: 1, type: "user/message", data: { source: { kind: "plugin" }, content: "注入" } },
        { seq: 2, type: "assistant/message", data: { message: { content: "回复" } } }
      ] }),
      close: async () => {},
    };
  };
  const result = await registry.sessionDetails({ sessionIds: [s1, s2] });
  assert.equal(result.items[0].turnCount, 1);
  assert.equal(result.items[0].path, env.located.get(s1));
  assert.equal(result.items[1].turnCount, null);
  assert.equal(result.items[1].path, env.located.get(s2));
  assert.match(result.items[1].error, /旧日志/);
  assert.deepEqual(env.persistence.prepared, []);
  assert.deepEqual(env.global.archivedSessionIds, [s1]);
  await assert.rejects(registry.sessionDetails({ sessionIds: [] }));
});

test("会话路径定位旧代际目录，当前代际未生成时不复制虚假文件", async () => {
  const env = buildRoot({ headers: [header(s1)], archived: [s1] });
  const directory = installJsonlLayout(env, s1);
  env.located.set(s1, join(directory, "session.v3.jsonl.zstd"));
  const registry = await mountWorkspaceRegistry(env);
  env.persistence.open = async () => { throw new Error("来源无法识别"); };
  const result = await registry.sessionDetails({ sessionIds: [s1] });
  assert.equal(result.items[0].path, directory);
  assert.equal(result.items[0].turnCount, null);
  assert.equal(existsSync(join(directory, "session.v3.jsonl.zstd")), false);
  assert.equal(readFileSync(join(directory, "session.jsonl.zstd"), "utf8"), "stub");
});

for (const [code, message] of [["missing", "ENOENT"], ["permission", "EACCES"], ["corrupt", "corrupt JSON"]]) {
  test(`诊断计划不可用时保留原始分类：${code}`, async () => {
    const env = buildRoot({ headers: [header(s1)], archived: [s1] });
    const registry = await mountWorkspaceRegistry(env);
    registry.readConversationEvents = async () => { throw new Error(message); };
    registry.sessionRepairPlan = async () => { throw new Error("测试修复限制"); };
    const result = await registry.diagnoseSession({ sessionId: s1 });
    assert.equal(result.code, code);
    assert.equal(result.repairable, false);
    assert.equal(result.repaired, false);
    assert.match(result.advice, /测试修复限制/);
    assert.deepEqual(env.persistence.prepared, []);
  });
}

test('诊断未知会话及修复令牌校验，不对未知错误写文件', async () => {
  const env = buildRoot({ headers: [header(s1)], archived: [s1] });
  const registry = await mountWorkspaceRegistry(env);
  env.persistence.open = async () => { throw new Error('ENOENT'); };
  const report = await registry.diagnoseSession({ sessionId: s1 });
  assert.equal(report.repairable, false);
  assert.equal(report.code, "missing");
  assert.match(report.reason, /不存在/);
  await assert.rejects(registry.repairSession({ sessionId: s1 }), /先诊断/);
  await assert.rejects(registry.repairSession({ sessionId: s1, token: '错误' }), /凭据/);
  assert.deepEqual(env.persistence.prepared, []);
});
test('修复需要已归档且未打开，诊断正常会话不生成新日志', async () => {
  const env = buildRoot({ headers: [header(s1)], archived: [] });
  const registry = await mountWorkspaceRegistry(env);
  env.persistence.open = async () => ({ header: header(s1), inheritedEventCount: 0, read: async () => ({ events: [] }), close: async () => {} });
  assert.match((await registry.diagnoseSession({ sessionId: s1 })).reason, /正常/);
  await assert.rejects(registry.sessionRepairPlan(s1), /先归档/);
});

test('未归档正文搜索读取已知会话且不改变归档状态', async()=>{
 const env=buildRoot({headers:[header(s1)],archived:[]});
 const registry=await mountWorkspaceRegistry(env);
 env.persistence.open=async()=>({header:header(s1),inheritedEventCount:0,read:async()=>({events:[{seq:0,type:'user/message',data:{source:{kind:'user'},content:'审查订单'}}]}),close:async()=>{}});
 const result=await registry.searchSessionContent({sessionIds:[s1],query:'审查'});
 assert.equal(result.items[0].sessionId,s1);
 assert.deepEqual(env.global.archivedSessionIds,[]);
 assert.deepEqual(env.persistence.prepared,[]);
});
