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
import { ArchiveWorkspaceRegistry } from "../lib/workspace.js";
import { ArchiveProjectionCache } from "../lib/projcache.js";

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
		canonicalOf.set(header.cwd, realpathSync(dir));
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
	const cacheCalls = { deleted: [], idleAwaited: 0 };
	const projCache = {
		async whenIdle() { cacheCalls.idleAwaited += 1; },
		async delete(id) { cacheCalls.deleted.push(id); }
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
	return { id, cwd, createdAt: 1700000000000, ...extra };
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
	assert.deepEqual(env.global.archivedSessionIds, [s3], "both attempted workspace markers are removed while the other workspace remains archived");
	assert.equal(existsSync(env.located.get(s1)), true, "failed target keeps its transcript for diagnosis");
	assert.equal(existsSync(env.located.get(s2)), false, "later targets still complete");
});

test("deleteSession keeps the transcript when archive bookkeeping fails", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const registry = await mountWorkspaceRegistry(env);
	env.domain.globalSetError = new Error("state write failed");
	await assert.rejects(() => registry.deleteSession(s2), /state write failed/);
	assert.equal(existsSync(env.located.get(s2)), true, "failed bookkeeping must not orphan the transcript");
	assert.deepEqual(env.global.archivedSessionIds, [s2]);
	assert.deepEqual(env.table.get(A).sessionIds, [s1, s2]);
});

test("deleteSession reports a retained transcript when physical deletion fails", async () => {
	const env = buildRoot({
		headers: [header(s1, cwdA), header(s2, cwdA)],
		workspaces: { [A]: workspace("D:\\proj-a", [s1, s2]) },
		archived: [s2]
	});
	const fsPromises = require("node:fs/promises");
	const originalRm = fsPromises.rm;
	// 进程级补丁：本文件测试按顺序执行，且 finally 会在退出前恢复内置绑定。
	fsPromises.rm = async () => { throw new Error("rm failed"); };
	syncBuiltinESMExports();
	try {
		const registry = await mountWorkspaceRegistry(env);
		await assert.rejects(() => registry.deleteSession(s2), /transcript directory .* remains after bookkeeping cleanup/);
		assert.deepEqual(env.global.archivedSessionIds, []);
		assert.deepEqual(env.table.get(A).sessionIds, [s1]);
		assert.equal(existsSync(env.located.get(s2)), true, "physical deletion failure leaves the transcript for recovery");
		assert.equal(await registry.sessionKnown(s2), true, "failed physical delete must keep the header index for retry");
	} finally {
		fsPromises.rm = originalRm;
		syncBuiltinESMExports();
	}
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
	const session = { id: s3, header: header(s3, cwdB), events: [] };
	await cache.put(s3, { createdAt: 1700000000000, cwd: cwdB }, { title: { ver: 1, seq: 9, val: "t" } });
	assert.ok(table.has(s3));
	// disposal triggers the write-behind; whenIdle must observe it
	ctx.emit("session/disposed", session);
	await cache.whenIdle();
	assert.ok(table.has(s3), "dispose write-behind must land before whenIdle resolves");
	await cache.delete(s3);
	assert.ok(!table.has(s3));
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
	const session = { id: s3, header: header(s3, cwdB), events: [] };
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
	assert.ok(!table.has(s3), "a deleted session must not be recreated by a stale write");
});

// 冷读写回经 putSoft 落盘：墓碑必须同样挡住它，且 whenIdle 必须覆盖它。
test("ArchiveProjectionCache tombstone guards the cold-read write-back (putSoft) and whenIdle covers it", async () => {
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
	await cache.putSoft(s3, identity, { title: { ver: 1, seq: 9, val: "t" } }, "cold-read write-back");
	assert.ok(!table.has(s3), "putSoft after delete must not recreate the row");
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
	assert.ok(!table.has(s3), "an in-flight putSoft must not resurrect the deleted row");
	await cache.whenIdle();
	assert.ok(!table.has(s3));
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
	await registry.archiveSession(s2);
	const deleteBatch = await captured.handler("workspaceRegistry/deleteArchivedSessions", { args: { target: { scope: "workspace", workspaceId: A } } }, void 0);
	assert.equal(deleteBatch.ok, true);
	assert.deepEqual(deleteBatch.value.requestedSessionIds, [s2]);
	assert.deepEqual(deleteBatch.value.deletedSessionIds, [s2]);
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
