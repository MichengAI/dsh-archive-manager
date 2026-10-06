import assert from "node:assert/strict";
import test from "node:test";
import { Context, Service } from "@deepseek-ai/cordis";
import { DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { apply, inject } from "../lib/index.js";
import { installArchiveProjectionCache, SafeSessionTable, safeProjectionCacheDomainSpec } from "../lib/projcache.js";

function deferred() {
	let resolve;
	const promise = new Promise((done) => { resolve = done; });
	return { promise, resolve };
}

// 保留真实域的重复打开限制、写入队列和关闭行为，仅替换最底层存储介质。
async function mountCache() {
	const ctx = new Context();
	const units = new Map();
	const opened = [];
	const closed = [];
	let beforePut = async () => {};
	ctx.provide("storage", { backend: { get: () => ({ kv: {
		async open(spec) {
			opened.push(spec.name);
			let state = units.get(spec.name);
			if (state === undefined) {
				state = { version: spec.version, tables: Object.fromEntries(spec.tables.map((name) => [name, {}])), global: null };
				units.set(spec.name, state);
			}
			return {
				loadAll: async () => structuredClone(state),
				putRecord: async (table, key, value) => {
					await beforePut(spec.name, key);
					state.tables[table][key] = structuredClone(value);
				},
				deleteRecord: async (table, key) => { delete state.tables[table][key]; },
				setGlobal: async (value) => { state.global = structuredClone(value); },
				close: async () => { closed.push(spec.name); },
			};
		},
	} }) } });
	const domains = new DomainFacility(ctx, { backend: "memory" });
	ctx.provide("storageDomain", domains);
	ctx.provide("sessionProjections", {});
	ctx.provide("sessions", { get: () => undefined });
	const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	return { ctx, cache, domains, opened, closed, delayPut: (callback) => { beforePut = callback; } };
}

const identity = { formatVersion: 4, createdAt: 1, isSeeded: false, inheritedEventCount: 0 };
const rows = (title) => ({ title: { ver: 1, seq: 1, val: title } });

test("overlay 从官方已打开的缓存表补缺迁入，不覆盖安全域记录或关闭官方域", async () => {
	const host = await mountCache();
	const { cache, domains } = host;
	const officialTable = cache.table;
	await cache.put("existing", identity, rows("official title"));
	await cache.put("shared", identity, rows("older official title"));
	const safeDomain = await domains.open(safeProjectionCacheDomainSpec);
	await new SafeSessionTable(safeDomain.table("sessions")).put("shared", { identity, rows: rows("safe title") });
	await safeDomain.close();
	let uninstall;
	try {
		uninstall = await installArchiveProjectionCache(cache);
		assert.equal(cache.table.get("existing").rows.title.val, "official title");
		assert.equal(cache.table.get("shared").rows.title.val, "safe title");
		assert.equal(host.opened.filter((name) => name === "session_projcache").length, 1);
		assert.equal(host.closed.includes("session_projcache"), false);
		await uninstall();
		assert.equal(cache.table, officialTable);
		await cache.put("after-disable", identity, rows("still writable"));
		assert.equal(officialTable.get("after-disable").rows.title.val, "still writable");
	} finally {
		await uninstall?.();
		await domains.get("session_projcache")?.close();
	}
});

test("overlay 卸载等待在途及等待期间新增的写入，重复卸载共享同一任务", async () => {
	const host = await mountCache();
	const officialTable = host.cache.table;
	const uninstall = await installArchiveProjectionCache(host.cache);
	const safeTable = host.cache.table;
	const first = deferred();
	const second = deferred();
	const firstStarted = deferred();
	const secondStarted = deferred();
	let writes = 0;
	host.delayPut(async (name) => {
		if (name !== safeProjectionCacheDomainSpec.name) return;
		if (writes++ === 0) {
			firstStarted.resolve();
			await first.promise;
		} else {
			secondStarted.resolve();
			await second.promise;
		}
	});
	const pending = host.cache.put("first", identity, rows("first title"));
	await firstStarted.promise;
	const stopping = uninstall();
	assert.equal(uninstall(), stopping);
	let stopped = false;
	stopping.then(() => { stopped = true; });
	const added = host.cache.put("second", identity, rows("second title"));
	try {
		first.resolve();
		await pending;
		await secondStarted.promise;
		assert.equal(stopped, false);
		assert.equal(host.cache.table, safeTable);
		second.resolve();
		await added;
		await stopping;
		assert.equal(host.cache.table, officialTable);
		assert.equal(host.closed.filter((name) => name === safeProjectionCacheDomainSpec.name).length, 1);
		assert.equal(Object.hasOwn(host.cache, "deletedSessionIds"), false);
		const persisted = await host.domains.open(safeProjectionCacheDomainSpec);
		assert.equal(new SafeSessionTable(persisted.table("sessions")).get("second").rows.title.val, "second title");
		await persisted.close();
	} finally {
		first.resolve();
		second.resolve();
		await Promise.allSettled([pending, added, stopping]);
		await host.domains.get("session_projcache")?.close();
	}
});

test("根插件 fiber 停用等待缓存写入和域关闭后才完成", async () => {
	const host = await mountCache();
	// 此测试只隔离 workspace 装配；缓存、根入口及 Cordis fiber 生命周期保持真实。
	host.ctx.provide("workspaceRegistry", { host: { sessionPath: () => undefined }, invalidSessionPaths: new Set() });
	host.ctx.provide("typert", { register: () => () => {} });
	let routeRemoved = false;
	host.ctx.provide("webServer", { register: () => () => { routeRemoved = true; } });
	const fiber = host.ctx.plugin({ name: "archive-overlay-test", apply, inject });
	await fiber;
	const started = deferred();
	const finish = deferred();
	host.delayPut(async (name) => {
		if (name !== safeProjectionCacheDomainSpec.name) return;
		started.resolve();
		await finish.promise;
	});
	const pending = host.cache.put("during-stop", identity, {});
	await started.promise;
	const stopping = fiber.dispose();
	let stopped = false;
	stopping.then(() => { stopped = true; });
	try {
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(routeRemoved, true);
		assert.equal(stopped, false);
		finish.resolve();
		await pending;
		await stopping;
		assert.equal(host.closed.includes(safeProjectionCacheDomainSpec.name), true);
	} finally {
		finish.resolve();
		await Promise.allSettled([pending, stopping]);
		await host.domains.get("session_projcache")?.close();
	}
});

for (const failure of ["install", "dispose"]) {
	test(`根入口${failure === "install" ? "安装失败移除更新路由" : "更新路由卸载失败仍清理宿主扩展"}`, async () => {
		const host = await mountCache();
		const table = host.cache.table;
		host.ctx.provide("workspaceRegistry", { host: { sessionPath: () => undefined }, invalidSessionPaths: new Set() });
		host.ctx.provide("typert", { register: () => {
			if (failure === "install") throw new Error("register failed");
			return () => {};
		} });
		let removed = false;
		host.ctx.provide("webServer", { register: () => () => {
			removed = true;
			if (failure === "dispose") throw new Error("route cleanup failed");
		} });
		try {
			if (failure === "install") await assert.rejects(apply(host.ctx), /register failed/);
			else {
				const dispose = await apply(host.ctx);
				await assert.rejects(dispose(), /route cleanup failed/);
			}
			assert.equal(removed, true);
			assert.equal(host.cache.table, table);
			assert.equal(host.cache.delete, undefined);
			assert.equal(host.ctx.workspaceRegistry.deleteSession, undefined);
			assert.equal(host.closed.includes(safeProjectionCacheDomainSpec.name), true);
		} finally {
			await host.domains.get("session_projcache")?.close();
		}
	});
}
