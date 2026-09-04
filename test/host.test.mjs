// dsh-archive-manager host self-tests (node:test).
//
// Resolution: the test tree contains a `node_modules` junction to the dsh
// flat module fallback (`%USERPROFILE%\.dsh\profiles\node_modules`), so the
// real @deepseek-ai packages resolve to the SAME copies the running harness
// uses. Run: `node --test test/` from the dsh-archive-manager directory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { Context, Service } from "@deepseek-ai/cordis";
import { WorkspaceUnknownSessionError } from "@deepseek-ai/dsh-workspace";
import { TypertRegistry } from "@deepseek-ai/dsh-typert-registry";
import { TypertGatewayService } from "@deepseek-ai/dsh-api-gateway";
import { remoteMethods } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { projectionCacheDomainSpec } from "@deepseek-ai/dsh-session-projection-cache";
import { ArchiveWorkspaceRegistry } from "../lib/workspace.js";
import {
	ArchiveProjectionCache,
	legacySafeProjectionCacheDomainSpec,
	legacySafeV2ProjectionCacheDomainSpec,
	projectionCacheStorageKey,
	safeProjectionCacheDomainSpec
} from "../lib/projcache.js";

const SID = (n) => `session-${String(n).padStart(5, "0")}-0000-0000-0000-000000000000`;
const require = createRequire(import.meta.url);

/** Map-backed domain table facade matching the storage-domain table contract. */
class FakeTable {
	constructor(initial = {}) {
		this.map = new Map(Object.entries(initial));
	}
	get size() { return this.map.size; }
	get(key) { return this.map.get(key); }
	has(key) { return this.map.has(key); }
	keys() { return this.map.keys(); }
	values() { return this.map.values(); }
	entries() { return this.map.entries(); }
	async put(key, value) { this.map.set(key, value); }
	async delete(key) { this.map.delete(key); }
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
	table(name) { return this.tables[name]; }
	get global() {
		return {
			get: () => this.globalState,
			set: async (next) => {
				if (this.globalSetError !== null) throw this.globalSetError;
				Object.assign(this.globalState, next);
			}
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
function buildRoot({ headers = [], workspaces = {}, archived = [], live = [] } = {}) {
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
	const canonicalHeaders = headers.map((h) => h.cwd === void 0 ? h : { ...h, cwd: canonicalOf.get(h.cwd) });
	const located = new Map();
	for (const header of canonicalHeaders) {
		const dir = join(root, `sessions-${header.id}`);
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "session.jsonl.zstd"), "stub");
		located.set(header.id, join(dir, "session.jsonl.zstd"));
	}
	const workspacesCanonical = Object.fromEntries(Object.entries(workspaces).map(([id, record]) => [
		id,
		{ ...record, path: canonicalOf.get(record.path) ?? record.path }
	]));
	const table = new FakeTable(Object.fromEntries(Object.entries(workspacesCanonical).map(([id, record]) => [id, {
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...record
	}])));
	const global = { initialized: true, workspaceIds: Object.keys(workspacesCanonical), archivedSessionIds: [...archived] };
	const domain = new FakeDomain({ workspaces: table }, global);
	const persistence = {
		headers: [...canonicalHeaders],
		list: async () => [...persistence.headers],
		prepared: [],
		released: [],
		prepare: async (id) => {
			persistence.prepared.push(id);
			return {
				session: { id, header: persistence.headers.find((item) => item.id === id), events: [] },
				[Symbol.dispose]() { persistence.released.push(id); }
			};
		},
		locate: (meta) => {
			const path = located.get(meta.id);
			if (path === void 0) throw new Error(`no transcript for ${meta.id}`);
			return { kind: "jsonl", path };
		}
	};
	const cacheCalls = { deleted: [], cleared: [], idleAwaited: 0 };
	const projCache = {
		async whenIdle() { cacheCalls.idleAwaited += 1; },
		async delete(id) { cacheCalls.deleted.push(id); },
		clearTombstone(id) { cacheCalls.cleared.push(id); }
	};
	const sessions = {
		live,
		get: (id) => sessions.live.find((s) => s.id === id),
		list: () => [...sessions.live],
		enter(session) {
			sessions.live.push(session);
			return () => sessions.detachEntered({ session, id: session.id });
		},
		announce(session) { sessions.announced.push(session.id); },
		async flush(session) { sessions.flushed.push(session.id); },
		liveEntryFor(session) { return { session, id: session.id }; },
		detachEntered(entry) {
			sessions.live = sessions.live.filter((s) => s.id !== entry.id);
			sessions.detached.push(entry.id);
			ctx.emit("session/disposed", entry.session);
		},
		flushed: [],
		detached: [],
		announced: []
	};
	ctx.provide("storageDomain", { open: async (spec) => domain });
	ctx.provide("sessionPersistence", persistence);
	ctx.provide("sessionProjectionCache", projCache);
	ctx.provide("sessions", sessions);
	ctx.provide("spillStore", { root: join(root, "spill") });
	return { ctx, root, table, domain, global, persistence, projCache, cacheCalls, sessions, located };
}

async function mountWorkspaceRegistry(env) {
	const registry = new ArchiveWorkspaceRegistry(env.ctx);
	await registry[Service.init]();
	return registry;
}

function header(id, cwd, extra = {}) {
	return { id, cwd, createdAt: 1700000000000, isSeeded: false, ...extra };
}

function workspace(path, sessionIds) {
	return { path, title: path, sessionIds };
}

const A = "ws-a", B = "ws-b";
const s1 = SID(1), s2 = SID(2), s3 = SID(3), s4 = SID(4), s5 = SID(5), sLive = SID(6), sUnknown = SID(99);
const cwdA = "D:\\proj-a", cwdB = "D:\\proj-b";

test("workspace registry init with the fakes", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.ok(env.ctx.get("workspaceRegistry") !== void 0, "registry service is provided");
	assert.deepEqual(registry.list().map((w) => w.id), [A, B]);
	assert.deepEqual(registry.get(A).sessionIds, [s1, s2], "工作区初始会话必须通过路径成员校验");
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("archiveSession + unarchiveSession round trip (idempotent, durable)", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) }
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

test("archiveWorkspaceSessions archives every known workspace session atomically and idempotently", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: {
			[A]: workspace("D:\\proj-a", [s1, s2]),
			[B]: workspace("D:\\proj-b", [s3]),
			["ws-empty"]: workspace("D:\\proj-empty", [])
		},
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	const first = await registry.archiveWorkspaceSessions(A);
	assert.deepEqual(first, {
		archivedSessionIds: [s2, s1],
		archivedSessionIdsAdded: [s1]
	});
	assert.deepEqual(env.global.archivedSessionIds, [s2, s1]);
	const second = await registry.archiveWorkspaceSessions(A);
	assert.deepEqual(second, {
		archivedSessionIds: [s2, s1],
		archivedSessionIdsAdded: []
	});

	const secondWorkspace = await registry.archiveWorkspaceSessions(B);
	assert.deepEqual(secondWorkspace, {
		archivedSessionIds: [s2, s1, s3],
		archivedSessionIdsAdded: [s3]
	});
	const empty = await registry.archiveWorkspaceSessions("ws-empty");
	assert.deepEqual(empty, { archivedSessionIds: [s2, s1, s3], archivedSessionIdsAdded: [] });
	await assert.rejects(() => registry.archiveWorkspaceSessions("missing"), /unknown workspace/);
});

test("archiveWorkspaceSessions rejects an unknown accounted session without a partial archive", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, sUnknown]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(() => registry.archiveWorkspaceSessions(A), /UNKNOWN_SESSION/);
	assert.deepEqual(env.global.archivedSessionIds, []);
});

test("unarchiveSession rejects unknown sessions", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)], workspaces: { [A]: workspace("D:\\proj-a", [s1]) } });
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(() => registry.unarchiveSession(sUnknown), /UNKNOWN_SESSION/);
});

test("archivedSessionMetadata returns host header creation times and skips stale archive markers", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100 }), header(s2, cwdA, { createdAt: 200 })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2, sUnknown, s1, s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s2, createdAt: 200 }, { sessionId: s1, createdAt: 100 }]
	});
});

test("archivedSessionMetadata rebuilds a seeded legacy projection and keeps non-seeded cached archives zero-I/O", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100 }), header(s2, cwdA, { createdAt: 200, isSeeded: true })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s1, s2]
	});
	const identityOf = (meta, inheritedEventCount) => ({
		createdAt: meta.createdAt,
		...(meta.cwd === void 0 ? {} : { cwd: meta.cwd }),
		isSeeded: meta.isSeeded,
		inheritedEventCount
	});
	const records = new Map([[s1, {
		identity: identityOf(env.persistence.headers.find((item) => item.id === s1), 0),
		snapshot: { asOfSeq: 8, values: { title: "already cached" } }
	}]]);
	const cacheReads = [];
	const reads = [];
	const puts = [];
	env.projCache.cachedSnapshot = (meta, inheritedEventCount) => {
		cacheReads.push({ id: meta.id, inheritedEventCount });
		const record = records.get(meta.id);
		return record !== void 0 && JSON.stringify(record.identity) === JSON.stringify(identityOf(meta, inheritedEventCount))
			? record.snapshot
			: void 0;
	};
	env.projCache.put = async (id, identity, rows) => {
		puts.push({ id, identity, rows });
		records.set(id, { identity, snapshot: { asOfSeq: 9, values: { title: rows.title.val } } });
	};
	env.persistence.readFrom = async (id, fromSeq) => {
		reads.push({ id, fromSeq });
		return {
			meta: env.persistence.headers.find((item) => item.id === id),
			inheritedEventCount: 3,
			events: [{ seq: 0, type: "session/start", data: {} }]
		};
	};
	env.ctx.provide("sessionProjections", {
		restore: (cached, events, floor, meta, inheritedEventCount) => {
			assert.deepEqual(cached, {});
			assert.equal(events.length, 1);
			assert.equal(floor, 0);
			assert.equal(meta.id, s2);
			assert.equal(inheritedEventCount, 3);
			return { checkpoint: { title: { ver: 1, seq: 9, val: "rebuilt" } }, snapshot: { asOfSeq: 9, values: { title: "rebuilt" } } };
		}
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s1, createdAt: 100 }, { sessionId: s2, createdAt: 200 }],
		repairedSessionIds: [s2]
	});
	assert.deepEqual(reads, [{ id: s2, fromSeq: 0 }], "only the missing archive reads its transcript");
	assert.deepEqual(cacheReads, [
		{ id: s1, inheritedEventCount: 0 },
		{ id: s2, inheritedEventCount: 3 }
	]);
	assert.deepEqual(puts, [{
		id: s2,
		identity: {
			createdAt: 200,
			cwd: env.persistence.headers.find((item) => item.id === s2).cwd,
			isSeeded: true,
			inheritedEventCount: 3
		},
		rows: { title: { ver: 1, seq: 9, val: "rebuilt" } }
	}]);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s1, createdAt: 100 }, { sessionId: s2, createdAt: 200 }]
	}, "缓存命中后普通会话无需读取原文；播种会话仍需读取继承事件数");
	assert.deepEqual(reads, [
		{ id: s2, fromSeq: 0 },
		{ id: s2, fromSeq: 0 }
	], "播种会话必须读取继承事件数，普通已缓存会话无需读取原文");
	assert.deepEqual(cacheReads, [
		{ id: s1, inheritedEventCount: 0 },
		{ id: s2, inheritedEventCount: 3 },
		{ id: s1, inheritedEventCount: 0 },
		{ id: s2, inheritedEventCount: 3 }
	]);
});

test("archivedSessionMetadata skips seeded projection repair when the inherited count is missing", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA, { createdAt: 100, isSeeded: true })],
		workspaces: { [A]: workspace("D:\\proj-a", [s1]) },
		archived: [s1]
	});
	const reads = [];
	let restored = false;
	let put = false;
	env.persistence.readFrom = async (id, fromSeq) => {
		reads.push({ id, fromSeq });
		return { meta: env.persistence.headers[0], events: [] };
	};
	env.projCache.cachedSnapshot = () => void 0;
	env.projCache.put = async () => { put = true; };
	env.ctx.provide("sessionProjections", {
		restore: () => {
			restored = true;
			return { checkpoint: {} };
		}
	});
	const registry = await mountWorkspaceRegistry(env);
	assert.deepEqual(await registry.archivedSessionMetadata(), {
		items: [{ sessionId: s1, createdAt: 100 }]
	});
	assert.deepEqual(reads, [{ id: s1, fromSeq: 0 }]);
	assert.equal(restored, false);
	assert.equal(put, false);
});

test("unarchiveSessions restores an authoritative workspace or ungrouped scope in one state update", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB), header(s4, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) },
		archived: [s1, s2, s3, s4, sUnknown]
	});
	const registry = await mountWorkspaceRegistry(env);
	const workspaceResult = await registry.unarchiveSessions({ scope: "workspace", workspaceId: A });
	assert.deepEqual(workspaceResult.unarchivedSessionIds, [s1, s2]);
	assert.deepEqual(workspaceResult.archivedSessionIds, [s3, s4, sUnknown]);
	assert.deepEqual(env.global.archivedSessionIds, [s3, s4, sUnknown]);
	const ungroupedResult = await registry.unarchiveSessions({ scope: "ungrouped" });
	assert.deepEqual(ungroupedResult.unarchivedSessionIds, [s4, sUnknown], "stale ungrouped markers are cleared without requiring a summary or transcript");
	assert.deepEqual(env.global.archivedSessionIds, [s3]);
	const allResult = await registry.unarchiveSessions({ scope: "all" });
	assert.deepEqual(allResult.unarchivedSessionIds, [s3]);
	assert.deepEqual(env.global.archivedSessionIds, []);
	await assert.rejects(() => registry.unarchiveSessions({ scope: "workspace", workspaceId: "missing" }), /unknown workspace/);
	await assert.rejects(() => registry.unarchiveSessions({ scope: "invalid" }), /target\.scope must be/);
});

test("explicit archived-session batches span projects, deduplicate input, and preserve archive order", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) },
		archived: [s2, sUnknown, s1, s3]
	});
	const registry = await mountWorkspaceRegistry(env);
	const restored = await registry.unarchiveSessions({ scope: "sessions", sessionIds: [s3, s1, s3, SID(98)] });
	assert.deepEqual(restored.unarchivedSessionIds, [s1, s3], "host order, not client selection order, is authoritative");
	assert.deepEqual(env.global.archivedSessionIds, [s2, sUnknown]);

	const deleted = await registry.deleteArchivedSessions({ scope: "sessions", sessionIds: [sUnknown, s2, s2] });
	assert.deepEqual(deleted.requestedSessionIds, [s2, sUnknown]);
	assert.deepEqual(deleted.deletedSessionIds, [s2]);
	assert.deepEqual(deleted.skippedSessionIds, [sUnknown], "stale selected markers still use batch cleanup");
	assert.deepEqual(env.global.archivedSessionIds, []);
	await assert.rejects(() => registry.unarchiveSessions({ scope: "sessions", sessionIds: [] }), /sessions with non-empty sessionIds/);
});

test("deleteSession rejects unknown sessions", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)], workspaces: { [A]: workspace("D:\\proj-a", [s1]) } });
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(() => registry.deleteSession(sUnknown), /UNKNOWN_SESSION/);
});

test("deleteSession removes transcript, archive marker, accounts, and cache row (stray + accounted)", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s4, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	// stray session s4: not accounted anywhere
	await registry.deleteSession(s4);
	assert.equal(existsSync(env.located.get(s4)), false, "stray transcript dir removed");
	assert.deepEqual(env.cacheCalls.deleted, [s4]);
	assert.deepEqual(env.global.archivedSessionIds, [s2]);
	assert.deepEqual(env.persistence.prepared, [s4], "cold deletion publishes a session removal");
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
	assert.equal(existsSync(env.located.get(s2)), false, "archived session transcript dir removed");
	assert.deepEqual(env.persistence.prepared, [s4, s2]);
	assert.deepEqual(env.sessions.detached, [s4, s2]);
});

test("deleteSession deletes only the backend-owned transcript artifact", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) }
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
	assert.equal(existsSync(secondArtifact), true, "同目录的其他会话工件不得被删除");
});

test("deleteArchivedSessions snapshots a workspace scope, continues after failures, and reports partial success", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) },
		archived: [s1, s2, s3]
	});
	const registry = await mountWorkspaceRegistry(env);
	const originalDelete = env.projCache.delete;
	env.projCache.delete = async (id) => {
		if (id === s1) throw new Error("cache write failed");
		return originalDelete.call(env.projCache, id);
	};
	const result = await registry.deleteArchivedSessions({ scope: "workspace", workspaceId: A });
	assert.deepEqual(result.requestedSessionIds, [s1, s2]);
	assert.deepEqual(result.deletedSessionIds, [s2]);
	assert.deepEqual(result.skippedSessionIds, []);
	assert.equal(result.failures.length, 1);
	assert.equal(result.failures[0].sessionId, s1);
	assert.match(result.failures[0].message, /cache write failed/);
	assert.deepEqual(env.global.archivedSessionIds, [s1, s3], "失败会话保留归档标记，后续批量删除可重试");
	assert.equal(existsSync(env.located.get(s1)), true, "failed target keeps its transcript for diagnosis");
	assert.equal(existsSync(env.located.get(s2)), false, "later targets still complete");
});

test("deleteArchivedSessions clears every remaining trace for unknown sessions", async () => {
	const env = buildRoot({
		workspaces: { [A]: workspace("D:\\proj-a", [sUnknown]) },
		archived: [sUnknown, sUnknown]
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
	assert.deepEqual(env.global.archivedSessionIds, [], "unknown targets must not leave permanent archive markers");
	assert.deepEqual(env.table.get(A).sessionIds, [], "unknown targets must be removed from workspace accounting");
	assert.deepEqual(env.cacheCalls.deleted, [sUnknown], "unknown targets must purge stale projection rows");
	assert.deepEqual(env.cacheCalls.cleared, [sUnknown], "a transient cache tombstone must be released after the purge");
	assert.equal(existsSync(spillPath), false, "unknown targets must remove stale spill data");
});

test("deleteArchivedSessions keeps the marker retryable when unknown-session cleanup fails", async () => {
	const env = buildRoot({
		workspaces: { [A]: workspace("D:\\proj-a", [sUnknown]) },
		archived: [sUnknown]
	});
	env.projCache.delete = async () => { throw new Error("cache cleanup failed"); };
	const registry = await mountWorkspaceRegistry(env);
	const result = await registry.deleteArchivedSessions({ scope: "all" });
	assert.deepEqual(result.skippedSessionIds, []);
	assert.equal(result.failures.length, 1);
	assert.match(result.failures[0].message, /cache cleanup failed/);
	assert.deepEqual(env.global.archivedSessionIds, [sUnknown], "failed cleanup must preserve the archive marker for retry");
	assert.deepEqual(env.table.get(A).sessionIds, [sUnknown], "cache cleanup runs before workspace bookkeeping changes");
});

test("deleteSession keeps retryable state when archive bookkeeping fails after physical deletion", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	env.domain.globalSetError = new Error("state write failed");
	await assert.rejects(() => registry.deleteSession(s2), /state write failed/);
	assert.equal(existsSync(env.located.get(s2)), false, "物理删除成功后不得回滚已删除工件");
	assert.deepEqual(env.global.archivedSessionIds, [s2], "失败记账必须保留归档标记供重试");
	assert.deepEqual(env.table.get(A).sessionIds, [s1, s2], "失败记账必须保留工作区引用供重试");
	env.domain.globalSetError = null;
	await registry.deleteSession(s2);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
});

test("deleteSession retains the transcript after a physical failure and succeeds on retry", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	const registry = await mountWorkspaceRegistry(env);
	// 进程级补丁：本文件测试按顺序执行，且 finally 会在退出前恢复内置绑定。
	fsPromises.rm = async () => { throw new Error("rm failed"); };
	syncBuiltinESMExports();
	try {
		await assert.rejects(() => registry.deleteSession(s2), /transcript artifact .* remains before bookkeeping cleanup/);
		assert.deepEqual(env.global.archivedSessionIds, [s2], "物理删除失败时必须保留归档标记");
		assert.deepEqual(env.table.get(A).sessionIds, [s1, s2], "物理删除失败时必须保留工作区记账");
		assert.equal(existsSync(env.located.get(s2)), true, "physical deletion failure leaves the transcript for recovery");
		assert.equal(await registry.sessionKnown(s2), true, "failed physical delete must keep the header index for retry");
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
	await registry.deleteSession(s2);
	assert.equal(existsSync(env.located.get(s2)), false, "retry removes the retained transcript");
	assert.equal(await registry.sessionKnown(s2), false, "successful retry forgets the header and records the tombstone");
});

test("deleteArchivedSessions keeps a physical failure in its retryable target", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	const registry = await mountWorkspaceRegistry(env);
	fsPromises.rm = async () => { throw new Error("rm failed"); };
	syncBuiltinESMExports();
	try {
		const failed = await registry.deleteArchivedSessions({ scope: "workspace", workspaceId: A });
		assert.deepEqual(failed.requestedSessionIds, [s2]);
		assert.equal(failed.failures.length, 1);
		assert.deepEqual(env.global.archivedSessionIds, [s2]);
		assert.deepEqual(env.table.get(A).sessionIds, [s1, s2]);
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
	const retried = await registry.deleteArchivedSessions({ scope: "workspace", workspaceId: A });
	assert.deepEqual(retried.requestedSessionIds, [s2], "同一批量目标必须仍能选中失败会话");
	assert.deepEqual(retried.deletedSessionIds, [s2]);
	assert.deepEqual(env.global.archivedSessionIds, []);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
});

test("deleteSession on a live session flushes, detaches, emits session/disposed, and waits for the cache write-behind before deleting the row", async () => {
	const liveSession = { id: sLive, header: header(sLive, cwdA), events: [] };
	const env = buildRoot({
		headers: [header(s1, cwdA), header(sLive, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, sLive]) },
		live: [liveSession]
	});
	// Make the fake cache order-sensitive: whenIdle must be awaited before delete.
	const order = [];
	env.projCache.whenIdle = async () => { order.push("whenIdle"); };
	env.projCache.delete = async (id) => { order.push(`delete:${id}`); };
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(sLive);
	assert.deepEqual(env.sessions.flushed, [sLive]);
	assert.deepEqual(env.sessions.detached, [sLive]);
	assert.deepEqual(order, ["whenIdle", `delete:${sLive}`]);
	assert.deepEqual(env.table.get(A).sessionIds, [s1]);
	assert.equal(registry.get(A).sessionIds.length, 1);
	assert.equal(existsSync(env.located.get(sLive)), false, "live session transcript dir removed");
});

test("deleteSession cascades to SUBAGENT children (origin = subagent) but never to fork branches", async () => {
	// s5: subagent child of s4 (cascade-deleted); s2: fork branch of s4
	// (parentSession set, no subagent origin — an independent user session)
	const env = buildRoot({
		headers: [
			header(s4, cwdA),
			header(s5, cwdA, { parentSession: s4, origin: "subagent" }),
			header(s2, cwdA, { parentSession: s4 })
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s4, s5, s2]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s4);
	assert.deepEqual(env.cacheCalls.deleted.sort(), [s4, s5].sort(), "only the subagent child is cascade-deleted");
	assert.deepEqual(env.table.get(A).sessionIds, [s2], "the fork branch survives");
	assert.equal(existsSync(env.located.get(s5)), false, "cascade child transcript dir removed");
	assert.equal(existsSync(env.located.get(s2)), true, "fork branch transcript dir kept");
	assert.equal(await registry.sessionKnown(s4), false);
	assert.equal(await registry.sessionKnown(s5), false, "cascade child must also leave the header index");
	assert.equal(await registry.sessionKnown(s2), true);
});

test("deleteSession forgets the in-memory header index so the id cannot be re-archived", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	assert.equal(await registry.sessionKnown(s2), false, "deleted session must leave the parent header index");
	await assert.rejects(() => registry.archiveSession(s2), WorkspaceUnknownSessionError);
	await assert.rejects(() => registry.deleteSession(s2), /UNKNOWN_SESSION/);
	// persistence.list() still returns the deleted header; probing another id
	// re-indexes and must not resurrect the forgotten session.
	assert.equal(await registry.sessionKnown(sUnknown), false);
	assert.equal(await registry.sessionKnown(s2), false, "stale persistence.list() must not resurrect a deleted session");
	assert.equal(await registry.sessionKnown(s1), true);
});

test("live reuse removes the tombstone from both the set and the order queue", async () => {
	const liveSession = { id: sLive, header: header(sLive, cwdA), events: [] };
	const env = buildRoot({
		headers: [header(s1, cwdA), header(sLive, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, sLive]) },
		live: [liveSession]
	});
	const registry = await mountWorkspaceRegistry(env);
	registry.forgetIndexedSession(sLive);
	assert.equal(registry.deletedSessionIds.has(sLive), true);
	assert.equal(registry.deletedSessionOrder.includes(sLive), true);
	assert.equal(await registry.sessionKnown(sLive), true);
	assert.equal(registry.deletedSessionIds.has(sLive), false);
	assert.equal(registry.deletedSessionOrder.includes(sLive), false);
	assert.deepEqual(env.cacheCalls.cleared, [sLive], "live reuse must also clear the projection-cache tombstone");
	registry.forgetIndexedSession(sLive);
	assert.equal(registry.deletedSessionOrder.filter((id) => id === sLive).length, 1);
});

test("deletedSessionIds evicts the oldest tombstone after the cap", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)], workspaces: { [A]: workspace("D:\\proj-a", [s1]) } });
	const registry = await mountWorkspaceRegistry(env);
	const limit = registry.deletedSessionTombstoneLimit;
	assert.ok(limit > 0);
	for (let i = 0; i < limit + 3; i++) registry.forgetIndexedSession(`gone-${i}`);
	assert.equal(registry.deletedSessionIds.has("gone-0"), false);
	assert.equal(registry.deletedSessionIds.has(`gone-${limit + 2}`), true);
	assert.ok(registry.deletedSessionIds.size <= limit);
});

test("markRemoteMethod registers single and batch archive methods on the service prototype", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)], workspaces: { [A]: workspace("D:\\proj-a", [s1]) } });
	const registry = await mountWorkspaceRegistry(env);
	const methods = remoteMethods(registry).map((item) => item.method);
	assert.ok(methods.includes("unarchiveSession"), "unarchiveSession must be marked Remote");
	assert.ok(methods.includes("deleteSession"), "deleteSession must be marked Remote");
	assert.ok(methods.includes("unarchiveSessions"), "unarchiveSessions must be marked Remote");
	assert.ok(methods.includes("archiveWorkspaceSessions"), "archiveWorkspaceSessions must be marked Remote");
	assert.ok(methods.includes("deleteArchivedSessions"), "deleteArchivedSessions must be marked Remote");
	assert.ok(methods.includes("archivedSessionMetadata"), "archivedSessionMetadata must be marked Remote");
});

test("deleteSession cascade skips already-deleted subagent children", async () => {
	const env = buildRoot({
		headers: [
			header(s4, cwdA),
			header(s5, cwdA, { parentSession: s4, origin: "subagent" })
		],
		workspaces: { [A]: workspace("D:\\proj-a", [s4, s5]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s5);
	await registry.deleteSession(s4);
	assert.equal(await registry.sessionKnown(s4), false);
	assert.equal(await registry.sessionKnown(s5), false);
});

test("ArchiveProjectionCache deletedSessionIds evicts the oldest tombstone after the cap", async () => {
	const ctx = new Context();
	const table = new FakeTable({});
	const domain = new FakeDomain({ sessions: table }, null);
	ctx.provide("storageDomain", { open: async () => domain });
	ctx.provide("sessionProjections", {
		checkpoint: () => ({ title: { ver: 1, seq: 9, val: "t" } }),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	const limit = cache.deletedSessionTombstoneLimit;
	assert.ok(limit > 0);
	for (let i = 0; i < limit + 3; i++) await cache.delete(`gone-${i}`);
	assert.equal(cache.deletedSessionIds.has("gone-0"), false);
	assert.equal(cache.deletedSessionIds.has(`gone-${limit + 2}`), true);
	assert.ok(cache.deletedSessionIds.size <= limit);
});

test("ArchiveProjectionCache maps IM ids to fixed-length path-safe storage keys", () => {
	const qq = "im:qq:dm:1786974024109:AAFEA88ABD266D02959130D923C09741";
	const weixin = "im:weixin:dm:1787047812741:o9cq809LPcI9ZPFNlpik3oDWfGI@im.wechat";
	const qqKey = projectionCacheStorageKey(qq);
	assert.match(qqKey, /^session_[A-Za-z0-9_-]{43}$/);
	assert.equal(qqKey.includes(":"), false);
	assert.equal(projectionCacheStorageKey(qq), qqKey, "the mapping must be stable across restarts");
	assert.notEqual(projectionCacheStorageKey(weixin), qqKey);
	assert.ok(
		safeProjectionCacheDomainSpec.layout === void 0 || safeProjectionCacheDomainSpec.layout === "per-record",
		"the compatibility domain must follow the active DSH storage layout"
	);
});

test("ArchiveProjectionCache migrates the v1 compatibility domain without reopening it as v2", async () => {
	const sessionId = "im:qq:dm:1786974024109:AAFEA88ABD266D02959130D923C09741";
	const legacyRecord = {
		identity: { createdAt: 1700000000000, cwd: cwdB },
		rows: { title: { ver: 1, seq: 9, val: "v1 compatibility cache" } }
	};
	const target = new FakeTable({});
	const legacySafe = new FakeTable({
		[projectionCacheStorageKey(sessionId)]: { sessionId, ...legacyRecord }
	});
	const legacy = new FakeTable({});
	const current = new FakeTable({});
	const opened = [];
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => {
			opened.push([spec.name, spec.version, spec.layout]);
			if (spec.name === safeProjectionCacheDomainSpec.name) return new FakeDomain({ sessions: target }, null);
			if (spec.name === legacySafeProjectionCacheDomainSpec.name && spec.version === 1) return new FakeDomain({ sessions: legacySafe }, null);
			if (spec.name === "session_projcache" && spec.version === 3) return new FakeDomain({ sessions: legacy }, null);
			if (spec.name === projectionCacheDomainSpec.name && spec.version === projectionCacheDomainSpec.version) return new FakeDomain({ sessions: current }, null);
			throw new Error(`unexpected cache domain ${spec.name} v${spec.version}`);
		}
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => ({}),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();

	assert.deepEqual(opened.slice(0, 3), [
		[safeProjectionCacheDomainSpec.name, 2, safeProjectionCacheDomainSpec.layout],
		[legacySafeV2ProjectionCacheDomainSpec.name, 2, legacySafeV2ProjectionCacheDomainSpec.layout],
		["session_projcache_archive_manager", 1, legacySafeProjectionCacheDomainSpec.layout]
	]);
	assert.deepEqual(target.get(projectionCacheStorageKey(sessionId)), {
		sessionId,
		identity: { ...legacyRecord.identity, isSeeded: false, inheritedEventCount: 0 },
		rows: legacyRecord.rows
	});
});

test("ArchiveProjectionCache migrates the old-name v2 compatibility domain", async () => {
	const sessionId = "im:weixin:dm:1787047812741:o9cq809LPcI9ZPFNlpik3oDWfGI@im.wechat";
	const legacyRecord = {
		identity: { createdAt: 1700000000001, cwd: cwdA, isSeeded: false, inheritedEventCount: 0 },
		rows: { title: { ver: 1, seq: 10, val: "v2 compatibility cache" } }
	};
	const target = new FakeTable({});
	const legacySafeV2 = new FakeTable({
		[projectionCacheStorageKey(sessionId)]: { sessionId, ...legacyRecord }
	});
	const legacySafeV1 = new FakeTable({});
	const legacy = new FakeTable({});
	const current = new FakeTable({});
	const opened = [];
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => {
			opened.push([spec.name, spec.version, spec.layout]);
			if (spec.name === safeProjectionCacheDomainSpec.name) return new FakeDomain({ sessions: target }, null);
			if (spec.name === legacySafeV2ProjectionCacheDomainSpec.name && spec.version === 2) return new FakeDomain({ sessions: legacySafeV2 }, null);
			if (spec.name === legacySafeProjectionCacheDomainSpec.name && spec.version === 1) return new FakeDomain({ sessions: legacySafeV1 }, null);
			if (spec.name === "session_projcache" && spec.version === 3) return new FakeDomain({ sessions: legacy }, null);
			if (spec.name === projectionCacheDomainSpec.name && spec.version === projectionCacheDomainSpec.version) return new FakeDomain({ sessions: current }, null);
			throw new Error(`unexpected cache domain ${spec.name} v${spec.version}`);
		}
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => ({}),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();

	assert.deepEqual(opened.slice(0, 3), [
		[safeProjectionCacheDomainSpec.name, 2, safeProjectionCacheDomainSpec.layout],
		["session_projcache_archive_manager", 2, legacySafeV2ProjectionCacheDomainSpec.layout],
		["session_projcache_archive_manager", 1, legacySafeProjectionCacheDomainSpec.layout]
	]);
	assert.deepEqual(target.get(projectionCacheStorageKey(sessionId)), { sessionId, ...legacyRecord });
});

test("ArchiveProjectionCache imports legacy IM rows while also reading the current cache domain", async () => {
	const imId = "im:qq:dm:1786974024109:AAFEA88ABD266D02959130D923C09741";
	const record = {
		identity: { createdAt: 1700000000000, cwd: cwdB },
		rows: { title: { ver: 1, seq: 9, val: "legacy IM" } }
	};
	const safe = new FakeTable({});
	const legacy = new FakeTable({ [imId]: record });
	const current = new FakeTable({});
	const opened = [];
	let legacySpec;
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => {
			opened.push([spec.name, spec.version, spec.layout]);
			if (spec.name === safeProjectionCacheDomainSpec.name) return new FakeDomain({ sessions: safe }, null);
			if (spec.name === "session_projcache" && spec.version === 3) {
				legacySpec = spec;
				return new FakeDomain({ sessions: legacy }, null);
			}
			if (spec.name === projectionCacheDomainSpec.name && spec.version === projectionCacheDomainSpec.version) return new FakeDomain({ sessions: current }, null);
			throw new Error("unexpected projection-cache source");
		}
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => record.rows,
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	const physicalKey = projectionCacheStorageKey(imId);
	assert.deepEqual(opened, [
		[safeProjectionCacheDomainSpec.name, 2, safeProjectionCacheDomainSpec.layout],
		[legacySafeV2ProjectionCacheDomainSpec.name, 2, legacySafeV2ProjectionCacheDomainSpec.layout],
		[legacySafeProjectionCacheDomainSpec.name, 1, legacySafeProjectionCacheDomainSpec.layout],
		["session_projcache", 3, void 0],
		[projectionCacheDomainSpec.name, projectionCacheDomainSpec.version, projectionCacheDomainSpec.layout]
	]);
	assert.equal(legacySpec.tables.sessions.valueSchema.safeParse(record).success, true, "旧域读取 schema 必须接受缺少新增身份字段的历史行");
	const normalized = {
		identity: { createdAt: 1700000000000, cwd: cwdB, isSeeded: false, inheritedEventCount: 0 },
		rows: record.rows
	};
	assert.deepEqual(safe.get(physicalKey), { sessionId: imId, ...normalized });
	assert.deepEqual(cache.recordFor(imId, normalized.identity), normalized);
	await cache.delete(imId);
	assert.equal(safe.has(physicalKey), false, "logical deletion must remove the encoded row");
});

test("ArchiveProjectionCache merges current records before legacy records", async () => {
	const shared = SID(701);
	const currentOnly = SID(702);
	const legacyOnly = SID(703);
	const identity = (createdAt) => ({ createdAt, isSeeded: false, inheritedEventCount: 0 });
	const row = (title) => ({ title: { ver: 1, seq: 9, val: title } });
	const currentShared = { identity: identity(701), rows: row("current title") };
	const legacyShared = { identity: identity(701), rows: row("legacy title") };
	const currentRecord = { identity: identity(702), rows: row("current only") };
	const legacyRecord = { identity: identity(703), rows: row("legacy only") };
	const safe = new FakeTable({});
	const legacy = new FakeTable({ [shared]: legacyShared, [legacyOnly]: legacyRecord });
	const current = new FakeTable({ [shared]: currentShared, [currentOnly]: currentRecord });
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => {
			if (spec.name === safeProjectionCacheDomainSpec.name) return new FakeDomain({ sessions: safe }, null);
			if (spec.name === "session_projcache" && spec.version === 3) return new FakeDomain({ sessions: legacy }, null);
			if (spec.name === projectionCacheDomainSpec.name && spec.version === projectionCacheDomainSpec.version) return new FakeDomain({ sessions: current }, null);
			throw new Error("unexpected projection-cache source");
		}
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => ({}),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	assert.deepEqual(cache.recordFor(shared, currentShared.identity), currentShared, "新版逐会话记录优先");
	assert.deepEqual(cache.recordFor(currentOnly, currentRecord.identity), currentRecord, "仅存在于新版缓存的记录必须迁入");
	assert.deepEqual(cache.recordFor(legacyOnly, legacyRecord.identity), legacyRecord, "旧缓存只补新版缺失记录");
});

test("ArchiveProjectionCache skips a seeded legacy row without an inherited count", async () => {
	const imId = "im:weixin:dm:1787047812741:o9cq809LPcI9ZPFNlpik3oDWfGI@im.wechat";
	const safe = new FakeTable({});
	const legacy = new FakeTable({
		[imId]: {
			identity: { createdAt: 1700000000000, cwd: cwdB, isSeeded: true },
			rows: { title: { ver: 1, seq: 9, val: "unsafe legacy seed" } }
		}
	});
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => spec.name === safeProjectionCacheDomainSpec.name
			? new FakeDomain({ sessions: safe }, null)
			: new FakeDomain({ sessions: legacy }, null)
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => ({}),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	assert.equal(safe.has(imId), false);
	assert.equal(safe.has(projectionCacheStorageKey(imId)), false);
});

test("ArchiveProjectionCache resumes a partial import without overwriting newer safe rows", async () => {
	const first = "im:qq:dm:1:user";
	const second = "im:weixin:dm:2:user@im.wechat";
	const oldFirst = { identity: { createdAt: 1 }, rows: { title: { ver: 1, seq: 1, val: "old" } } };
	const newFirst = { identity: { createdAt: 1, isSeeded: false, inheritedEventCount: 0 }, rows: { title: { ver: 1, seq: 8, val: "new" } } };
	const secondRecord = { identity: { createdAt: 2 }, rows: { title: { ver: 1, seq: 2, val: "second" } } };
	const normalizedSecond = { identity: { createdAt: 2, isSeeded: false, inheritedEventCount: 0 }, rows: secondRecord.rows };
	const safe = new FakeTable({
		[projectionCacheStorageKey(first)]: { sessionId: first, ...newFirst }
	});
	const legacy = new FakeTable({ [first]: oldFirst, [second]: secondRecord });
	const ctx = new Context();
	ctx.provide("storageDomain", {
		open: async (spec) => spec.name === safeProjectionCacheDomainSpec.name
			? new FakeDomain({ sessions: safe }, null)
			: new FakeDomain({ sessions: legacy }, null)
	});
	ctx.provide("sessionProjections", {
		checkpoint: () => ({}),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	assert.deepEqual(cache.recordFor(first, newFirst.identity), newFirst, "newer compatibility-domain data wins");
	assert.deepEqual(cache.recordFor(second, normalizedSecond.identity), normalizedSecond, "missing rows resume importing with a complete unseeded identity");
});

test("ArchiveProjectionCache whenIdle waits for disposal write before delete", async () => {
	const ctx = new Context();
	const table = new FakeTable({});
	const domain = new FakeDomain({ sessions: table }, null);
	ctx.provide("storageDomain", { open: async () => domain });
	ctx.provide("sessionProjections", {
		checkpoint: () => ({ title: { ver: 1, seq: 9, val: "t" } }),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	const session = { id: s3, header: header(s3, cwdB, { isSeeded: false }), inheritedEventCount: 0, events: [] };
	await cache.put(s3, { createdAt: 1700000000000, cwd: cwdB }, { title: { ver: 1, seq: 9, val: "t" } });
	assert.ok(table.has(projectionCacheStorageKey(s3)));
	// disposal triggers the write-behind; whenIdle must observe it
	ctx.emit("session/disposed", session);
	await cache.whenIdle();
	assert.ok(table.has(projectionCacheStorageKey(s3)), "dispose write-behind must land before whenIdle resolves");
	await cache.delete(s3);
	assert.ok(!table.has(projectionCacheStorageKey(s3)));
});

test("ArchiveProjectionCache delete prevents an in-flight write from recreating its row", async () => {
	const ctx = new Context();
	const table = new FakeTable({});
	const domain = new FakeDomain({ sessions: table }, null);
	ctx.provide("storageDomain", { open: async () => domain });
	ctx.provide("sessionProjections", {
		checkpoint: () => ({ title: { ver: 1, seq: 9, val: "t" } }),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	const session = { id: s3, header: header(s3, cwdB, { isSeeded: false }), inheritedEventCount: 0, events: [] };
	const put = table.put.bind(table);
	let started;
	const writing = new Promise((resolve) => { started = resolve; });
	let release;
	const released = new Promise((resolve) => { release = resolve; });
	table.put = async (...args) => {
		started();
		await released;
		return put(...args);
	};
	const pendingWrite = cache.write(session);
	await writing;
	await cache.delete(s3);
	release();
	await pendingWrite;
	assert.ok(!table.has(projectionCacheStorageKey(s3)), "a deleted session must not be recreated by a stale write");
});

// rc.2 冷读经 putSoft -> put，alpha.2 直接调用 put(...).catch(...)。
test("ArchiveProjectionCache tombstone guards both cold-read write-back paths and whenIdle covers them", async () => {
	const ctx = new Context();
	const table = new FakeTable({});
	const domain = new FakeDomain({ sessions: table }, null);
	ctx.provide("storageDomain", { open: async () => domain });
	ctx.provide("sessionProjections", {
		checkpoint: () => ({ title: { ver: 1, seq: 9, val: "t" } }),
		viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.val]))
	});
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { get: () => void 0 });
	const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	const identity = { createdAt: 1700000000000, cwd: cwdB };
	// 已删除：冷读写回直接被墓碑拦截，不落盘。
	await cache.delete(s3);
	const blockedPut = cache.put(s3, identity, { title: { ver: 1, seq: 9, val: "t" } });
	assert.equal(typeof blockedPut?.catch, "function", "alpha.2 coldSnapshot must be able to chain .catch() onto put()");
	await blockedPut;
	await cache.putSoft(s3, identity, { title: { ver: 1, seq: 9, val: "t" } }, "cold-read write-back");
	assert.ok(!table.has(projectionCacheStorageKey(s3)), "put/putSoft after delete must not recreate the row");
	// 删除落在写回进行中：写回完成后补删自己的残留行。
	cache.clearTombstone(s3);
	const put = table.put.bind(table);
	let started;
	const writing = new Promise((resolve) => { started = resolve; });
	let release;
	const released = new Promise((resolve) => { release = resolve; });
	table.put = async (...args) => {
		started();
		await released;
		return put(...args);
	};
	const pendingWrite = cache.putSoft(s3, identity, { title: { ver: 1, seq: 9, val: "t" } }, "cold-read write-back");
	await writing;
	await cache.delete(s3);
	release();
	await pendingWrite;
	assert.ok(!table.has(projectionCacheStorageKey(s3)), "an in-flight putSoft must not resurrect the deleted row");
	await cache.whenIdle();
	assert.ok(!table.has(projectionCacheStorageKey(s3)));
});

test("cold reuse of a deleted id (new lifecycle) clears the tombstone; a stale same-lifecycle header stays unknown", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	// stale list()：同一生命周期（同 createdAt）的旧头部仍视为未知。
	assert.equal(await registry.sessionKnown(s2), false);
	// 另一进程以同 id 重建并落盘新生命周期（createdAt 不同）：撤墓碑放行。
	env.persistence.headers = env.persistence.headers.map((item) => item.id === s2 ? { ...item, createdAt: 1800000000000 } : item);
	assert.equal(await registry.sessionKnown(s2), true);
	assert.equal(registry.deletedSessionIds.has(s2), false, "cold reuse must clear the tombstone");
	assert.deepEqual(env.cacheCalls.cleared, [s2], "cold reuse must also clear the projection-cache tombstone");
	// 撤墓碑后可重新归档（headers 已重新编入索引）。
	await registry.archiveSession(s2);
	assert.deepEqual(env.global.archivedSessionIds, [s2]);
});

test("cold-reuse probe normalizes a missing cwd on both sides of the identity comparison", async () => {
	// 删除时身份带 cwd，list 返回同 createdAt 但无 cwd 的头部：形状不同即身份不同，按新生命周期放行。
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	await registry.deleteSession(s2);
	env.persistence.headers = env.persistence.headers.map((item) => item.id === s2 ? { id: s2, createdAt: 1700000000000 } : item);
	assert.equal(await registry.sessionKnown(s2), true, "a header whose cwd shape differs from the deleted identity is a new lifecycle");
	// 双侧均无 cwd 的同生命周期头部：归一为 null 后相等，仍拦截。
	const env2 = buildRoot({
		headers: [{ id: s3, createdAt: 1700000000000 }],
		workspaces: {},
		archived: [s3]
	});
	const registry2 = await mountWorkspaceRegistry(env2);
	await registry2.deleteSession(s3);
	assert.equal(await registry2.sessionKnown(s3), false, "both-missing cwd normalizes to null and keeps the stale header unknown");
});

test("typert gateway SRC: claims + dispatch single and batch archive methods end to end", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	new TypertRegistry(env.ctx);
	let captured;
	env.ctx.provide("connection", {
		rpc: {
			intercept(channel, matches, handler, options) {
				captured = { channel, matches, handler, options };
				return () => {};
			}
		}
	});
	new TypertGatewayService(env.ctx);
	await tick(); // ctx.inject registers the interceptor asynchronously
	assert.ok(captured, "gateway must register a /api interceptor");
	assert.ok(env.ctx.get("typert").local.get("workspaceRegistry/deleteSession") !== undefined, "late typert still receives the host contribution");
	assert.equal(captured.channel, "/api");
	// SRC claims for the new endpoints
	assert.equal(captured.matches("workspaceRegistry/unarchiveSession"), true);
	assert.equal(captured.matches("workspaceRegistry/deleteSession"), true);
	assert.equal(captured.matches("workspaceRegistry/unarchiveSessions"), true);
	assert.equal(captured.matches("workspaceRegistry/archiveWorkspaceSessions"), true);
	assert.equal(captured.matches("workspaceRegistry/deleteArchivedSessions"), true);
	assert.equal(captured.matches("workspaceRegistry/archivedSessionMetadata"), true);
	// legacy endpoints stay with the apiproxy (not claimed)
	assert.equal(captured.matches("workspace.archiveSession"), false);
	assert.equal(captured.matches("workspace.list"), false);
	// dispatch: unarchiveSession
	const unarchive = await captured.handler("workspaceRegistry/unarchiveSession", { args: { sessionId: s1 } }, void 0);
	assert.equal(unarchive.ok, true);
	assert.deepEqual(unarchive.value, { archivedSessionIds: [] });
	await registry.archiveSession(s1);
	const metadata = await captured.handler("workspaceRegistry/archivedSessionMetadata", { args: {} }, void 0);
	assert.equal(metadata.ok, true);
	assert.deepEqual(metadata.value, { items: [{ sessionId: s1, createdAt: 1700000000000 }] });
	const unarchiveBatch = await captured.handler("workspaceRegistry/unarchiveSessions", { args: { target: { scope: "workspace", workspaceId: A } } }, void 0);
	assert.equal(unarchiveBatch.ok, true);
	assert.deepEqual(unarchiveBatch.value, { archivedSessionIds: [], unarchivedSessionIds: [s1] });
	const archiveWorkspace = await captured.handler("workspaceRegistry/archiveWorkspaceSessions", { args: { workspaceId: A } }, void 0);
	assert.equal(archiveWorkspace.ok, true);
	assert.deepEqual(archiveWorkspace.value, { archivedSessionIds: [s1, s2], archivedSessionIdsAdded: [s1, s2] });
	await registry.archiveSession(s2);
	const deleteBatch = await captured.handler("workspaceRegistry/deleteArchivedSessions", { args: { target: { scope: "workspace", workspaceId: A } } }, void 0);
	assert.equal(deleteBatch.ok, true);
	assert.deepEqual(deleteBatch.value.requestedSessionIds, [s1, s2]);
	assert.deepEqual(deleteBatch.value.deletedSessionIds, [s1, s2]);
	assert.deepEqual(deleteBatch.value.failures, []);
	// dispatch: deleteSession
	const del = await captured.handler("workspaceRegistry/deleteSession", { args: { sessionId: s3 } }, void 0);
	assert.equal(del.ok, true);
	assert.deepEqual(del.value, { deleted: true });
	assert.deepEqual(env.table.get(B).sessionIds, []);
	assert.equal(existsSync(env.located.get(s3)), false, "transcript dir removed via gateway dispatch");
	// dispatch: unknown session surfaces as a failed rpc
	const unknown = await captured.handler("workspaceRegistry/deleteSession", { args: { sessionId: sUnknown } }, void 0);
	assert.equal(unknown.ok, false);
	assert.match(unknown.error.message, /UNKNOWN_SESSION/);
	// dispatch: missing args is rejected
	const bad = await captured.handler("workspaceRegistry/unarchiveSession", { args: {} }, void 0);
	assert.equal(bad.ok, false);
});

// 生产环境 404：网关优先认 typert.local。Host 必须在 typert 就绪后写入严格描述符。
test("typert local contribution registers deleteSession before SRC discovery", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) }
	});
	new TypertRegistry(env.ctx);
	await mountWorkspaceRegistry(env);
	const local = env.ctx.get("typert").local;
	assert.ok(local.get("workspaceRegistry/deleteSession") !== undefined, "host must register workspaceRegistry/deleteSession on typert.local");
	assert.ok(local.get("workspaceRegistry/unarchiveSession") !== undefined, "host must register workspaceRegistry/unarchiveSession on typert.local");
	assert.ok(local.get("workspaceRegistry/unarchiveSessions") !== undefined, "host must register workspaceRegistry/unarchiveSessions on typert.local");
	assert.ok(local.get("workspaceRegistry/archiveWorkspaceSessions") !== undefined, "host must register workspaceRegistry/archiveWorkspaceSessions on typert.local");
	assert.ok(local.get("workspaceRegistry/deleteArchivedSessions") !== undefined, "host must register workspaceRegistry/deleteArchivedSessions on typert.local");
	assert.ok(local.get("workspaceRegistry/archivedSessionMetadata") !== undefined, "host must register workspaceRegistry/archivedSessionMetadata on typert.local");
	assert.equal(local.get("workspaceRegistry/deleteSession").service, "workspaceRegistry");
	assert.equal(local.get("workspaceRegistry/deleteSession").method, "deleteSession");
});
test("legacy workspaceRegistry API surface is intact", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA), header(s3, cwdB)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]), [B]: workspace("D:\\proj-b", [s3]) }
	});
	const registry = await mountWorkspaceRegistry(env);
	const wsA = registry.get(A);
	await wsA.insertSessionBefore(s2, s1);
	assert.deepEqual(registry.get(A).sessionIds, [s2, s1]);
	assert.equal(await registry.delete(A), true);
	assert.deepEqual(registry.list().map((w) => w.id), [B]);
	await registry.archiveSession(s3);
	assert.deepEqual(env.global.archivedSessionIds, [s3]);
});
