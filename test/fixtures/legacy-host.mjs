// 在 rc.2 / rc.1 的真实 SessionStore、JSONL 后端与查询服务上回归旧接口。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { assertIsolatedHost } from "../helpers/isolated-host.mjs";

assertIsolatedHost();
const { Context, Service } = await import("@deepseek-ai/cordis");
const { SessionStore } = await import("@deepseek-ai/dsh-session");
const { default: JsonlSessionPersistence } = await import("@deepseek-ai/dsh-session-persistence-jsonl");
const { SessionQueryEngine } = await import("@deepseek-ai/dsh-session-query");
const { ArchiveWorkspaceRegistry } = await import("../../lib/workspace.js");

async function setup(t, compression) {
	const root = await mkdtemp(join(tmpdir(), "dsh-am-old-storage-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const cwd = join(root, "project");
	await mkdir(cwd);
	const ctx = new Context();
	const sessions = new SessionStore(ctx);
	const persistence = new JsonlSessionPersistence(ctx, { root: join(root, "sessions"), compression });
	assert.equal(typeof persistence.prepare, "function", "旧版夹具必须实际走 prepare 接口");
	const records = new Map();
	const state = { initialized: true, workspaceIds: [], archivedSessionIds: [] };
	const table = {
		get size() { return records.size; },
		get: (id) => records.get(id), has: (id) => records.has(id),
		entries: () => records.entries(), keys: () => records.keys(), values: () => records.values(),
		put: async (id, value) => { records.set(id, value); },
		delete: async (id) => records.delete(id),
		update: async (id, change) => { const next = change(records.get(id)); records.set(id, next); return next; }
	};
	ctx.provide("storageDomain", { open: async () => ({ table: () => table, global: { get: () => state, set: async (next) => Object.assign(state, next) }, close() {} }) });
	const registry = new ArchiveWorkspaceRegistry(ctx);
	await registry[Service.init]();
	const query = new SessionQueryEngine(ctx);
	async function create(id, extra = {}) {
		const session = sessions.prepare(id, { meta: { cwd, createdAt: 1700000000000, ...extra } });
		session.append("session/title", { title: `回归 ${id}` });
		await persistence.create(session.header);
		await persistence.append(id, typeof session.snapshotEvents === "function" ? session.snapshotEvents() : session.events);
		return session.header;
	}
	return { root, ctx, sessions, persistence, registry, query, state, create };
}

for (const compression of ["none", "zstd"]) {
	test(`旧宿主真实存储归档、恢复、冷删除和子会话级联 (${compression})`, async (t) => {
		const env = await setup(t, compression);
		const parent = await env.create("parent");
		await env.create("child", { parentSession: "parent", origin: "subagent" });
		await env.create("fork", { parentSession: "parent" });
		await env.registry.archiveSession("parent");
		assert.deepEqual(env.state.archivedSessionIds, ["parent"]);
		assert.equal((await env.registry.archivedSessionMetadata()).items[0].createdAt, parent.createdAt);
		await env.registry.unarchiveSession("parent");
		assert.deepEqual(env.state.archivedSessionIds, []);
		assert.equal((await env.persistence.list()).length, 3, "恢复不会删除转录");
		const source = await env.registry.readStoredProjectionSource(env.persistence, "parent");
		assert.equal(source.events[0].type, "session/title");
		await env.registry.archiveSession("parent");
		const removed = [];
		env.ctx.on("api-session/removed", (id) => removed.push(id));
		const result = await env.registry.deleteArchivedSessions({ scope: "all" });
		assert.deepEqual(result.failures, []);
		assert.deepEqual(result.deletedSessionIds, ["parent"]);
		assert.deepEqual(removed, ["child", "parent"]);
		assert.deepEqual(env.state.archivedSessionIds, []);
		await assert.rejects(access(dirname(env.persistence.locate(parent).path)), { code: "ENOENT" });
		assert.deepEqual((await env.persistence.list()).map((header) => header.id), ["fork"]);
		assert.deepEqual((await env.query.listSessions()).map((entry) => entry.header.id), ["fork"]);
		const freshContext = new Context();
		new SessionStore(freshContext);
		const reopened = new JsonlSessionPersistence(freshContext, { root: join(env.root, "sessions"), compression });
		assert.deepEqual((await reopened.list()).map((header) => header.id), ["fork"]);
	});
}

test("旧宿主实时会话删除先落盘再分离，后续查询不复活", async (t) => {
	const env = await setup(t, "none");
	const header = await env.create("live");
	const preparation = await env.persistence.prepare("live");
	env.sessions.enter(preparation.session);
	env.sessions.announce(preparation.session);
	preparation[Symbol.dispose]();
	const removed = [];
	env.ctx.on("api-session/removed", (id) => removed.push(id));
	await env.registry.deleteSession("live");
	assert.deepEqual(removed, ["live"], "实时删除只发送一次完成事件");
	assert.equal(env.sessions.get("live"), void 0);
	await assert.rejects(access(dirname(env.persistence.locate(header).path)), { code: "ENOENT" });
	assert.deepEqual(await env.query.listSessions(), []);
});
