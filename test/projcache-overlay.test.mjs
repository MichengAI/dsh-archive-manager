import assert from "node:assert/strict";
import test from "node:test";
import { Context, Service } from "@deepseek-ai/cordis";
import { DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { apply, inject } from "../lib/index.js";
import { installArchiveProjectionCache, installArchiveProjectionCacheGuards, SafeSessionTable, safeProjectionCacheDomainSpec } from "../lib/projcache.js";

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

for (const overlay of [true, false]) {
 test(overlay ? "overlay 卸载只等旧写入，新写入立即回到官方表" : "兜底 guards 卸载不追逐后续官方写入", async () => {
  const host = await mountCache(); const table = host.cache.table;
  const uninstall = overlay ? await installArchiveProjectionCache(host.cache) : installArchiveProjectionCacheGuards(host.cache);
  const first = deferred(), second = deferred(), started = deferred(), secondStarted = deferred();
  let writes = 0;
  host.delayPut(async () => { if (writes++ === 0) { started.resolve(); await first.promise; } else { secondStarted.resolve(); await second.promise; } });
  const pending = host.cache.put("first", identity, rows("first")); await started.promise;
  const stalePut = host.cache.put;
  const stopping = uninstall(); assert.equal(uninstall(), stopping);
  assert.equal(host.cache.table, table, "卸载同步恢复官方表");
  const added = stalePut("second", identity, rows("second"));
  try {
   first.resolve(); await pending; await secondStarted.promise;
   await stopping; // second 未完成也不阻止插件卸载。
   assert.equal(host.cache.delete, undefined);
   if (overlay) {
    assert.equal(host.closed.filter(name => name === safeProjectionCacheDomainSpec.name).length, 1);
    const persisted = await host.domains.open(safeProjectionCacheDomainSpec);
    assert.equal(new SafeSessionTable(persisted.table("sessions")).get("first").rows.title.val, "first");
    assert.equal(new SafeSessionTable(persisted.table("sessions")).has("second"), false);
    await persisted.close();
   }
  } finally {
   first.resolve(); second.resolve(); await Promise.allSettled([pending, added, stopping]);
   await host.domains.get("session_projcache")?.close();
  }
 });
}

test("卸载前的 write 在异步 flush 后仍向原安全表 put", async () => {
 const host = await mountCache(); const official = host.cache.table;
 const uninstall = await installArchiveProjectionCache(host.cache);
 const started = deferred(), finish = deferred();
 const session = { id: "late-put", header: { id: "late-put", version: 4, createdAt: 1 }, inheritedEventCount: 0 };
 host.ctx.sessionProjections.checkpoint = () => rows("old write");
 host.ctx.sessions.get = () => session;
 host.ctx.sessions.flush = async () => { started.resolve(); await finish.promise; };
 const pending = host.cache.write(session); await started.promise;
 const stopping = uninstall();
 assert.equal(host.cache.table, official);
 try {
  await host.cache.put("fresh", identity, rows("official"));
  finish.resolve(); await pending; await stopping;
  assert.equal(official.get("late-put"), undefined);
  assert.equal(official.get("fresh").rows.title.val, "official");
  const persisted = await host.domains.open(safeProjectionCacheDomainSpec);
  assert.equal(new SafeSessionTable(persisted.table("sessions")).get("late-put").rows.title.val, "old write");
  await persisted.close();
 } finally { finish.resolve(); await Promise.allSettled([pending, stopping]); await host.domains.get("session_projcache")?.close(); }
});

test("卸载中的旧写入保留墓碑，补删不影响官方表的新写入", async () => {
 const host = await mountCache(); const official = host.cache.table;
 const uninstall = await installArchiveProjectionCache(host.cache);
 const started = deferred(), finish = deferred();
 host.delayPut(async name => { if (name === safeProjectionCacheDomainSpec.name) { started.resolve(); await finish.promise; } });
 const pending = host.cache.put("same", identity, rows("old")); await started.promise;
 const deleting = host.cache.delete("same"); const stopping = uninstall();
 try {
  await host.cache.put("same", identity, rows("new lifecycle"));
  finish.resolve(); await Promise.all([pending, deleting, stopping]);
  assert.equal(official.get("same").rows.title.val, "new lifecycle");
  const persisted = await host.domains.open(safeProjectionCacheDomainSpec);
  assert.equal(new SafeSessionTable(persisted.table("sessions")).has("same"), false);
  await persisted.close();
 } finally { finish.resolve(); await Promise.allSettled([pending, deleting, stopping]); await host.domains.get("session_projcache")?.close(); }
});

test("guards 幂等，部分 overlay 安装失败回滚后兜底可以完整卸载", async () => {
 const host = await mountCache(); const official = host.cache.table; const originalPut = host.cache.put;
 let fail = true;
 const cache = new Proxy(host.cache, { set(target, key, value) {
  if (key === Symbol.for("dsh-archive-manager.projcache-overlay") && fail) { fail = false; throw new Error("marker assignment failed"); }
  return Reflect.set(target, key, value);
 } });
 try {
  await assert.rejects(installArchiveProjectionCache(cache), /marker assignment failed/);
  assert.equal(host.cache.table, official); assert.equal(host.cache.put, originalPut); assert.equal(host.cache.delete, undefined);
  assert.equal(host.closed.includes(safeProjectionCacheDomainSpec.name), true);
  const uninstall = installArchiveProjectionCacheGuards(host.cache);
  assert.equal(installArchiveProjectionCacheGuards(host.cache), uninstall);
  await uninstall(); assert.equal(host.cache.put, originalPut); assert.equal(host.cache.delete, undefined);
 } finally { await host.domains.get("session_projcache")?.close(); }
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
