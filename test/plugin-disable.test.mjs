import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Context, Service } from "@deepseek-ai/cordis";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { apply, inject } from "../lib/host-install.js";

function domain() {
	const records = new Map();
	const state = {
		initialized: true,
		workspaceIds: [],
		archivedSessionIds: [],
		pinnedSessionIds: [],
	};
	const table = {
		get size() { return records.size; },
		get: (id) => records.get(id),
		has: (id) => records.has(id),
		entries: () => records.entries(),
		keys: () => records.keys(),
		values: () => records.values(),
		put: async (id, value) => { records.set(id, value); },
		delete: async (id) => records.delete(id),
		update: async (id, change) => {
			const next = change(records.get(id));
			records.set(id, next);
			return next;
		},
	};
	return {
		table: () => table,
		global: { get: () => state, set: async (next) => Object.assign(state, next) },
		close() {},
	};
}

test("停用安装入口后，官方工作区实例仍能创建目录", async () => {
	const root = await mkdtemp(join(tmpdir(), "dsh-am-disable-"));
	const project = join(root, "project");
	await mkdir(project);
	const ctx = new Context();
	const opened = [];
	ctx.provide("storageDomain", {
		open: async (spec) => {
			opened.push(spec.name);
			return domain();
		},
	});
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessionProjections", {});
	ctx.provide("sessions", { list: () => [], get: () => undefined });
	ctx.provide("typert", { register() { return () => {}; } });
	try {
		const registry = new WorkspaceRegistry(ctx);
		await registry[Service.init]();
		const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
		await cache[Service.init]();
		const officialTable = cache.table;
		const created = await registry.create(project);
		assert.equal(typeof created.id, "string");
		assert.equal(registry.deleteSession, undefined);

		assert.deepEqual(inject, ["workspaceRegistry", "sessionProjectionCache", "typert"]);
		const uninstall = await apply(ctx);
		assert.equal(typeof registry.deleteSession, "function");
		assert.notEqual(cache.table, officialTable);
		assert.equal((await registry.create(project)).id, created.id);

		await uninstall();
		assert.equal(registry.deleteSession, undefined);
		assert.equal(cache.table, officialTable);
		assert.equal((await registry.create(project)).id, created.id);
		assert.equal(opened.includes("session_projcache_archive_manager_v2"), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
