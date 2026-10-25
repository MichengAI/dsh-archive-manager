// 生产装配路径（cordis.patch.yml 的 archive-manager-host）自测：
// 官方 workspace / sessionProjectionCache 保持运行，归档能力直接装到它们的实例上，
// 并须经真实 typert registry + api-gateway 派发。停用后官方实例必须恢复原样。
import test from "node:test";
import assert from "node:assert/strict";
import { Context, Service } from "@deepseek-ai/cordis";
import { TypertRegistry } from "@deepseek-ai/dsh-typert-registry";
import { TypertGatewayService } from "@deepseek-ai/dsh-api-gateway";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { remoteMethods } from "@deepseek-ai/dsh-typert-protocol";
import { apply, inject } from "../lib/host-install.js";
import { gatewayCall } from "./helpers/gateway-peer.mjs";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** 归档入口对网关暴露的全部方法；内部删除与索引清理方法不得成为 RPC。 */
const ARCHIVE_ENDPOINTS = [
	"archivedSessionMetadata",
	"cleanOrphanSubagents",
	"deleteArchivedSessions",
	"deleteSession",
	"diagnoseOrphanSubagents",
	"favoriteSessions",
	"previewArchivedSession",
	"scheduledSessionIds",
	"searchArchivedContent",
	"searchSessionContent",
	"setSessionFavorite",
	"unarchiveSession",
];

/** Map 支撑的存储域表 + 全局状态，满足 storage-domain 契约。 */
function fakeDomain() {
	const records = new Map();
	const state = { initialized: true, favoriteSessionIds: [], workspaceIds: [], archivedSessionIds: [], pinnedSessionIds: [] };
	const table = {
		get size() { return records.size; },
		get: (id) => records.get(id),
		has: (id) => records.has(id),
		entries: () => records.entries(),
		keys: () => records.keys(),
		values: () => records.values(),
		put: async (id, value) => { records.set(id, value); },
		delete: async (id) => { records.delete(id); },
		update: async (id, change) => { const next = change(records.get(id)); records.set(id, next); return next; },
	};
	return {
		table: () => table,
		global: { get: () => state, set: async (next) => { Object.assign(state, next); } },
		close() {},
	};
}

/**
 * 装配官方 workspace + 投影缓存 + 真实网关，并给出与宿主一致的插件开关。
 * `enable` 走 `ctx.plugin`，因此 `ctx.effect` 都挂在插件 fiber 上，停用即整体撤回。
 */
async function mountOfficialHost({ fileUploads } = {}) {
	const ctx = new Context();
	ctx.provide("storageDomain", { open: async () => fakeDomain() });
	ctx.provide("sessionPersistence", { list: async () => [] });
	ctx.provide("sessionProjections", {});
	ctx.provide("sessions", { list: () => [], get: () => undefined });
	if (fileUploads !== undefined) ctx.provide("fileUploads", fileUploads);
	const registry = new WorkspaceRegistry(ctx);
	await registry[Service.init]();
	const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
	await cache[Service.init]();
	let captured;
	ctx.provide("connection", {
		rpc: {
			intercept(channel, matches, handler, options) {
				captured = { channel, matches, handler, options };
				return () => {};
			},
		},
	});
	new TypertRegistry(ctx);
	new TypertGatewayService(ctx);
	await tick();
	assert.ok(captured, "网关必须在 /api 上注册拦截器");
	/** 经真实网关调用一个端点，返回业务结果或稳定失败码。 */
	const call = async (endpoint, args) => {
		const outcome = await gatewayCall(captured.handler, endpoint, args);
		return outcome.ok ? { ok: true, value: outcome.value } : { ok: false, code: outcome.error?.code };
	};
	const enable = async () => {
		const fiber = ctx.plugin({ name: "archive-manager-host", apply, inject });
		await fiber;
		return fiber;
	};
	return { ctx, registry, cache, captured, call, enable };
}

test("安装入口不包装官方投影缓存写入方法，也不安装删除墓碑 API", async () => {
	assert.equal(inject.includes("sessionProjectionCache"), false);
	const host = await mountOfficialHost();
	const originalWrite = host.cache.write;
	const originalPut = host.cache.put;
	const originalTable = host.cache.requireTable();
	const fiber = await host.enable();
	try {
		assert.equal(host.cache.write, originalWrite);
		assert.equal(host.cache.put, originalPut);
		assert.equal(host.cache.requireTable(), originalTable);
		assert.equal(host.cache.delete, undefined);
		assert.equal(host.cache.whenIdle, undefined);
		assert.equal(host.cache.clearTombstone, undefined);
	} finally {
		await fiber.dispose();
	}
});


test("启用和重新启用不打开历史缓存域，也不核验会话日志", async () => {
	const host = await mountOfficialHost();
	const officialTable = host.cache.table;
	const originalWrite = host.cache.write;
	const originalPut = host.cache.put;
	const opened = [];
	let reads = 0;
	host.ctx.storageDomain.open = async (spec) => {
		opened.push(spec.name);
		return fakeDomain();
	};
	host.ctx.sessionPersistence.stat = async () => { reads += 1; throw new Error("启用时不应读取会话"); };
	host.ctx.sessionPersistence.open = async () => { reads += 1; throw new Error("启用时不应打开日志"); };
	for (let activation = 0; activation < 2; activation += 1) {
		const fiber = await host.enable();
		try {
			assert.equal(host.cache.table, officialTable);
			assert.equal(host.cache.write, originalWrite);
			assert.equal(host.cache.put, originalPut);
			assert.equal(host.cache.delete, undefined);
			assert.deepEqual(opened, [], "启用不扫描任何历史缓存域");
			assert.equal(reads, 0);
		} finally { await fiber.dispose(); }
		assert.equal(host.cache.write, originalWrite);
		assert.equal(host.cache.put, originalPut);
	}
});

test("归档能力经真实网关从官方 workspace 实例派发", async () => {
	const host = await mountOfficialHost();
	const { registry, cache, captured, call } = host;
	const created = await registry.create(process.cwd());
	const officialTable = cache.table;
	assert.equal(captured.matches("workspaceRegistry/archivedSessionMetadata"), false, "未安装时不得认领归档端点");

	const fiber = await host.enable();
	// 绑定必须落在网关比较的原始实例上，否则派发一律 gateway/binding-invalid。
	const binding = Reflect.get(registry, "typertRemote");
	assert.equal(Reflect.get(binding, "service"), registry);
	assert.equal(Reflect.get(binding, "serviceKey"), "workspaceRegistry");
	assert.equal(Reflect.get(binding, "namespace"), "workspaceRegistry");
	assert.equal(captured.matches("workspaceRegistry/archivedSessionMetadata"), true);
	assert.equal(captured.matches("workspaceRegistry/diagnoseOrphanSubagents"), true);
	// 暴露面必须与子类入口一致：只有归档方法，内部方法不得成为远程端点。
	assert.deepEqual(remoteMethods(registry).map((marker) => marker.method).sort(), ARCHIVE_ENDPOINTS);
	for (const internal of ["removeTranscriptDirectory", "cleanSpill", "deleteDescendants", "indexHeader", "deleteSessionCore"]) {
		assert.equal(captured.matches(`workspaceRegistry/${internal}`), false, `内部方法 ${internal} 不得成为远程端点`);
	}
	assert.deepEqual(await call("workspaceRegistry/archivedSessionMetadata", {}), { ok: true, value: { items: [] } });
	assert.deepEqual(await call("workspaceRegistry/favoriteSessions", {}), { ok: true, value: { favoriteSessionIds: [] } });
	assert.equal((await call("workspaceRegistry/diagnoseOrphanSubagents", {})).ok, true);
	assert.deepEqual(await call("workspaceRegistry/cleanOrphanSubagents", {}), { ok: true, value: { cleanedSessionIds: [], skippedSessionIds: [], failures: [] } });
	assert.equal((await call("workspaceRegistry/cleanOrphanSubagents", { target: { sessionIds: 123 } })).ok, false, "非法参数必须被网关干净拒绝");
	assert.equal(cache.table, officialTable);

	await fiber.dispose();
	assert.equal(Reflect.get(registry, "typertRemote"), undefined, "卸下后不得留下绑定");
	assert.equal(cache.table, officialTable, "卸下后恢复官方投影表");
	assert.equal((await registry.create(process.cwd())).id, created.id, "卸下后官方实例仍能创建工作区");
});

test("停用后重新启用仍能派发归档端点", async () => {
	const host = await mountOfficialHost();
	const first = await host.enable();
	assert.deepEqual(await host.call("workspaceRegistry/archivedSessionMetadata", {}), { ok: true, value: { items: [] } });
	await first.dispose();
	assert.equal((await host.call("workspaceRegistry/archivedSessionMetadata", {})).ok, false);
	const second = await host.enable();
	assert.deepEqual(await host.call("workspaceRegistry/archivedSessionMetadata", {}), { ok: true, value: { items: [] } });
	await second.dispose();
	assert.equal(Reflect.get(host.registry, "typertRemote"), undefined);
});

test("物理删除直接清理官方缓存表，不安装墓碑写入守护", async () => {
	const host = await mountOfficialHost();
	const officialTable = host.cache.table;
	const officialPut = host.cache.put;
	const open = host.ctx.storageDomain.open;
	host.ctx.storageDomain.open = async () => { throw new Error("safe cache domain unavailable"); };
	await officialTable.put("stale", { rows: {} });
	const fiber = await host.enable();
	try {
		assert.equal(host.cache.table, officialTable, "安装不替换官方缓存表");
		assert.equal(typeof host.cache.delete, "undefined", "不添加缓存删除或墓碑 API");
		assert.deepEqual(await host.call("workspaceRegistry/deleteSession", { sessionId: "stale" }), { ok: true, value: { deleted: true } });
		assert.equal(officialTable.has("stale"), false);
		await host.cache.put("deleted", { formatVersion: 4, createdAt: 1 }, {});
		assert.equal(officialTable.has("deleted"), true, "官方缓存写入不再被删除墓碑拦截");
	} finally {
		await fiber.dispose();
		host.ctx.storageDomain.open = open;
	}
	assert.equal(host.cache.put, officialPut);
	assert.equal(host.cache.table, officialTable);
	const reenabled = await host.enable();
	assert.equal(host.cache.table, officialTable, "重新启用仍使用官方域");
	await reenabled.dispose();
});

test("安装入口不改写文件上传服务，普通解析器仍可注册和注销", async () => {
	const uploads = {
		agentResolver: undefined,
		registerAgentResolver(resolve) {
			if (this.agentResolver !== undefined) throw new Error("file-upload: Agent resolver is already registered");
			this.agentResolver = resolve;
			return () => { if (this.agentResolver === resolve) this.agentResolver = undefined; };
		},
	};
	const register = uploads.registerAgentResolver;
	const host = await mountOfficialHost({ fileUploads: uploads });
	const fiber = await host.enable();
	try {
		assert.equal(uploads.registerAgentResolver, register, "归档安装不得包装宿主上传注册器");
		const next = () => "new";
		const dispose = uploads.registerAgentResolver(next);
		assert.equal(uploads.agentResolver, next);
		dispose();
		assert.equal(uploads.agentResolver, undefined);
	} finally {
		await fiber.dispose();
	}
});

test("远程注册失败回滚已安装的工作区与缓存扩展", async () => {
	const host = await mountOfficialHost();
	const table = host.cache.table;
	const path = host.registry.host.sessionPath;
	host.ctx.typert.register = () => { throw new Error("register failed"); };
	await assert.rejects(apply(host.ctx), /register failed/);
	assert.equal(host.cache.table, table);
	assert.equal(host.cache.delete, undefined);
	assert.equal(host.registry.deleteSession, undefined);
	assert.equal(host.registry.host.sessionPath, path);
	assert.equal(Reflect.get(host.registry, "typertRemote"), undefined);
});

test("远程解绑失败也必须恢复工作区和缓存扩展", async () => {
	const host = await mountOfficialHost();
	const table = host.cache.table;
	host.ctx.typert.register = () => () => { throw new Error("unbind failed"); };
	const dispose = await apply(host.ctx);
	await assert.rejects(dispose(), /unbind failed/);
	assert.equal(host.cache.table, table);
	assert.equal(host.cache.delete, undefined);
	assert.equal(host.registry.deleteSession, undefined);
	assert.equal(Reflect.get(host.registry, "typertRemote"), undefined);
});
