import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Context, Service } from "@deepseek-ai/cordis";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { apply, inject } from "../lib/host-install.js";
import { ArchiveWorkspaceRegistry, installArchiveWorkspace } from "../src/workspace.ts";

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

test("恢复保留安装前的实例包装及 this，卸载后还原原方法", async () => {
	const ctx = new Context();
	ctx.provide("storageDomain", { open: async () => domain() });
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { list: () => [], get: () => undefined });
	const registry = new WorkspaceRegistry(ctx);
	await registry[Service.init]();
	await registry.setState({ ...registry.requireState(), archivedSessionIds: ["restore", "keep"] });
	const original = registry.unarchiveSession;
	const calls = [];
	const wrapped = async function (id) {
		calls.push({ receiver: this, id });
		return original.call(this, id);
	};
	Object.defineProperty(registry, "unarchiveSession", {
		value: wrapped, writable: true, enumerable: false, configurable: true,
	});
	const before = Object.getOwnPropertyDescriptor(registry, "unarchiveSession");
	const uninstall = installArchiveWorkspace(registry);
	try {
		assert.deepEqual(await registry.unarchiveSession("restore"), { archivedSessionIds: ["keep"] });
		assert.deepEqual(calls, [{ receiver: registry, id: "restore" }]);
	} finally {
		uninstall();
	}
	assert.deepEqual(Object.getOwnPropertyDescriptor(registry, "unarchiveSession"), before);
	assert.equal(await registry.unarchiveSession("keep"), undefined);
	assert.deepEqual(calls, [{ receiver: registry, id: "restore" }, { receiver: registry, id: "keep" }]);
	assert.deepEqual(registry.requireState().archivedSessionIds, []);
});

test("安装前访问器包装拒绝恢复时保留归档状态，卸载后还原描述符", async () => {
	const ctx = new Context();
	ctx.provide("storageDomain", { open: async () => domain() });
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { list: () => [], get: () => undefined });
	const registry = new WorkspaceRegistry(ctx);
	await registry[Service.init]();
	await registry.setState({ ...registry.requireState(), archivedSessionIds: ["blocked"] });
	const denied = new Error("restore denied by existing wrapper");
	let calls = 0;
	const wrapped = async function (id) {
		assert.equal(this, registry);
		assert.equal(id, "blocked");
		calls++;
		throw denied;
	};
	Object.defineProperty(registry, "unarchiveSession", {
		get: () => wrapped, enumerable: false, configurable: true,
	});
	const before = Object.getOwnPropertyDescriptor(registry, "unarchiveSession");
	const uninstall = installArchiveWorkspace(registry);
	try {
		await assert.rejects(registry.unarchiveSession("blocked"), (error) => error === denied);
		assert.equal(calls, 1);
		assert.deepEqual(registry.requireState().archivedSessionIds, ["blocked"]);
	} finally {
		uninstall();
	}
	assert.deepEqual(Object.getOwnPropertyDescriptor(registry, "unarchiveSession"), before);
	assert.equal(registry.unarchiveSession, wrapped);
	await assert.rejects(registry.unarchiveSession("blocked"), (error) => error === denied);
	assert.equal(calls, 2);
});

test("子类恢复入口委托实际 super 链的实现", async () => {
	const ctx = new Context();
	ctx.provide("storageDomain", { open: async () => domain() });
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessions", { list: () => [], get: () => undefined });
	ctx.provide("typert", { register() { return () => {}; } });
	const registry = new ArchiveWorkspaceRegistry(ctx);
	await registry[Service.init]();
	await registry.setState({ ...registry.requireState(), archivedSessionIds: ["restore", "keep"] });
	const prototype = ArchiveWorkspaceRegistry.prototype;
	const parent = Object.getPrototypeOf(prototype);
	let calls = 0;
	const delegatedParent = Object.create(parent, {
		unarchiveSession: { value: async function (id) {
			assert.equal(this, registry);
			calls++;
			await parent.unarchiveSession.call(this, id);
		} },
	});
	Object.setPrototypeOf(prototype, delegatedParent);
	try {
		assert.deepEqual(await registry.unarchiveSession("restore"), { archivedSessionIds: ["keep"] });
		assert.equal(calls, 1);
	} finally {
		Object.setPrototypeOf(prototype, parent);
	}
});

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

		assert.deepEqual(inject, ["workspaceRegistry", "sessionPersistence", "typert"]);
		const uninstall = await apply(ctx);
		assert.equal(typeof registry.deleteSession, "function");
		assert.equal(cache.table, officialTable);
		assert.equal((await registry.create(project)).id, created.id);

		await uninstall();
		assert.equal(registry.deleteSession, undefined);
		assert.equal(cache.table, officialTable);
		assert.equal((await registry.create(project)).id, created.id);
		assert.equal(opened.some(name => name.startsWith("session_projcache_archive_manager")), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
