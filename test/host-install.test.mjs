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
import { apply, inject } from "../lib/host-install.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

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
		const outcome = await captured.handler(endpoint, { args }, void 0);
		return outcome.ok ? { ok: true, value: outcome.value } : { ok: false, code: outcome.error?.code };
	};
	const enable = async () => {
		const fiber = ctx.plugin({ name: "archive-manager-host", apply, inject });
		await fiber;
		return fiber;
	};
	return { ctx, registry, cache, captured, call, enable };
}

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
	assert.equal(captured.matches("workspaceRegistry/sessionDetails"), true);
	assert.equal(captured.matches("workspaceRegistry/diagnoseSession"), true);
	assert.deepEqual(await call("workspaceRegistry/archivedSessionMetadata", {}), { ok: true, value: { items: [] } });
	assert.deepEqual(await call("workspaceRegistry/favoriteSessions", {}), { ok: true, value: { favoriteSessionIds: [] } });
	assert.notEqual(cache.table, officialTable);

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

test("安装入口容忍热重载遗留的文件上传解析器", async () => {
	const uploads = {
		agentResolver: undefined,
		registerAgentResolver(resolve) {
			if (this.agentResolver !== undefined) throw new Error("file-upload: Agent resolver is already registered");
			this.agentResolver = resolve;
			return () => { if (this.agentResolver === resolve) this.agentResolver = undefined; };
		},
	};
	// 残留解析器：插件与官方实例同处一个宿主，热重载后注册会撞上它。
	uploads.registerAgentResolver(() => "stale");
	const host = await mountOfficialHost({ fileUploads: uploads });
	const fiber = await host.enable();
	try {
		const next = () => "new";
		const dispose = uploads.registerAgentResolver(next);
		assert.equal(uploads.agentResolver, next);
		dispose();
		assert.equal(uploads.agentResolver, undefined);
	} finally {
		await fiber.dispose();
	}
});
