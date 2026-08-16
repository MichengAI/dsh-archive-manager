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
	await assert.rejects(() => registry.unarchiveSession(sUnknown), WorkspaceUnknownSessionError);
});

test("deleteSession rejects unknown sessions", async () => {
	const env = buildRoot({ headers: [header(s1, cwdA)], workspaces: { [A]: workspace("D:\\proj-a", [s1]) } });
	const registry = await mountWorkspaceRegistry(env);
	await assert.rejects(() => registry.deleteSession(sUnknown), WorkspaceUnknownSessionError);
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

test("typert gateway SRC: claims + dispatch unarchiveSession/deleteSession end to end", async () => {
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
	assert.equal(captured.channel, "/api");
	// SRC claims for the new endpoints
	assert.equal(captured.matches("workspaceRegistry/unarchiveSession"), true);
	assert.equal(captured.matches("workspaceRegistry/deleteSession"), true);
	// legacy endpoints stay with the apiproxy (not claimed)
	assert.equal(captured.matches("workspace.archiveSession"), false);
	assert.equal(captured.matches("workspace.list"), false);
	// dispatch: unarchiveSession
	const unarchive = await captured.handler("workspaceRegistry/unarchiveSession", { args: { sessionId: s1 } }, void 0);
	assert.equal(unarchive.ok, true);
	assert.deepEqual(unarchive.value, { archivedSessionIds: [] });
	// dispatch: deleteSession
	const del = await captured.handler("workspaceRegistry/deleteSession", { args: { sessionId: s3 } }, void 0);
	assert.equal(del.ok, true);
	assert.deepEqual(del.value, { deleted: true });
	assert.deepEqual(env.table.get(B).sessionIds, []);
	assert.equal(existsSync(env.located.get(s3)), false, "transcript dir removed via gateway dispatch");
	// dispatch: unknown session surfaces as a failed rpc
	const unknown = await captured.handler("workspaceRegistry/deleteSession", { args: { sessionId: sUnknown } }, void 0);
	assert.equal(unknown.ok, false);
	assert.match(unknown.error.message, /no such session/);
	// dispatch: missing args is rejected
	const bad = await captured.handler("workspaceRegistry/unarchiveSession", { args: {} }, void 0);
	assert.equal(bad.ok, false);
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
