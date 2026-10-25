// 主界面收藏星标：共享存储的读取/写入/回滚，以及它注册在哪些宿主插槽上。
//
// 星标本身是 DOM 注入（容器紧跟前导格，CSS 控制只在已收藏或悬停时出现），这里只测
// 能脱离浏览器验证的部分：注册面、读取失败可重试、乐观写入与失败回滚。
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const requireFallback = createRequire(import.meta.url);
const CLIENT_BUNDLE = fileURLToPath(new URL("../lib/client.js", import.meta.url));

// --- 宿主静态模块表（与 dsh-client-web 的 getStaticModules 对齐） ---
const statics = {};
for (const spec of ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis", "@deepseek-ai/dsh-client-ui-slots"]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
// primitives 会 import CSS，纯 Node 的 ESM 加载不了；这些用例不做渲染，空壳足够。
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, {
	get: (target, prop) => {
		if (typeof prop === "string") target[prop] = () => null;
		return target[prop];
	}
});
const { loadClientStore } = await import("./helpers/client-store.mjs");
const { exports: { defineStore } } = await loadClientStore();
statics["@deepseek-ai/dsh-client-store"] = { defineStore };

// --- 最小浏览器环境（bundle 装载与样式注入要用） ---
globalThis.window = globalThis;
const styleStub = { dataset: {}, style: {}, setAttribute() {}, appendChild() {}, append() {}, remove() {}, removeChild() {}, addEventListener() {}, set textContent(_value) {} };
const headStub = { appendChild() {}, append() {}, removeChild() {}, insertBefore() {}, contains: () => false, querySelector: () => null, querySelectorAll: () => [] };
globalThis.document = {
	head: headStub,
	body: headStub,
	documentElement: headStub,
	querySelector: (selector) => selector === "head" || selector === "body" ? headStub : null,
	querySelectorAll: () => [],
	getElementById: () => null,
	createElement: () => styleStub,
	addEventListener() {},
	removeEventListener() {}
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
globalThis.MutationObserver = class {
	observe() {}
	disconnect() {}
};
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.dispatchEvent = () => true;

// --- 装载 bundle ---
const factories = new Map();
window.__ModuleLoader__ = { load: (handoff) => { factories.set(handoff.id, handoff.factory); } };
await import(pathToFileURL(CLIENT_BUNDLE).href);
const bundle = factories.get("@michengai/dsh-archive-manager")((spec) => {
	if (Object.hasOwn(statics, spec)) return statics[spec];
	throw new Error(`smoke require miss: ${spec}`);
}, { exports: {} }, {});
const createFavoriteRowStore = bundle.__test.createFavoriteRowStore;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeApi({ failTimes = 0, initial = ["s1"] } = {}) {
	let attempts = 0;
	const calls = [];
	const stored = new Set(initial);
	return {
		calls,
		attempts: () => attempts,
		async favoriteSessions() {
			attempts += 1;
			if (attempts <= failTimes) throw new Error("remote 尚未就绪");
			return { favoriteSessionIds: [...stored] };
		},
		async setSessionFavorite(input) {
			calls.push(input);
			if (input.favorite) stored.add(input.sessionId);
			else stored.delete(input.sessionId);
			return { favoriteSessionIds: [...stored] };
		}
	};
}

/** 最小客户端上下文：只提供客户端门面真正会读到的面。 */
function makeContext(registry, { declaresSessionMenu = false } = {}) {
	const registrations = [];
	const effects = [];
	const ctx = {
		get: (name) => name === "remote.workspaceRegistry" ? registry : undefined,
		on: () => () => {},
		sessions: {},
		workspaces: {},
		locale: { register: () => () => {}, bind: () => (key) => key },
		slots: {
			entries: () => declaresSessionMenu ? [{ children: { "sidebar.workspaces.session.menu.item": {} } }] : [],
			inject: (name, callback) => { const dispose = callback(); return () => { if (typeof dispose === "function") dispose(); }; },
			register: (options) => { registrations.push(options); return () => {}; }
		},
		effect: (fn) => { const disposer = fn(); if (typeof disposer === "function") effects.push(disposer); }
	};
	return { ctx, registrations, effects, dispose: async () => { for (const disposer of effects) disposer(); } };
}

test("星标不再占官方 row action 插槽", async () => {
	const { ctx, registrations, dispose } = makeContext(undefined);
	const applyDispose = await bundle.apply(ctx);
	assert.equal(registrations.some((item) => item.name === "sidebar.workspaces.session.row.action"), false);
	await dispose();
	await applyDispose();
});

test("宿主声明会话菜单时，注册「收藏/取消收藏」菜单行（键盘可达）", async () => {
	const { ctx, registrations, dispose } = makeContext(undefined, { declaresSessionMenu: true });
	const applyDispose = await bundle.apply(ctx);
	const menuItem = registrations.find((item) => item.name === "sidebar.workspaces.session.menu.item" && item.id === "archive-manager.favorite");
	assert.ok(menuItem, "缺少收藏菜单行");
	assert.equal(menuItem.order, 350);
	assert.equal(typeof menuItem.inject, "function");
	await dispose();
	await applyDispose();
});

test("刷新后首次读取失败不算「没有收藏」，重试成功后星标状态才生效", async () => {
	// 客户端启动时 remote 还没挂上，第一次 favoriteSessions 必然失败。
	const api = makeApi({ failTimes: 1, initial: ["s1", "s3"] });
	const store = createFavoriteRowStore();
	store.bind(api);
	await store.ensure();
	assert.equal(store.getSnapshot().ready, false, "失败时保持未就绪，不能把空集合当成结果");
	assert.equal(store.getSnapshot().ids.size, 0);

	await sleep(700); // 退避窗口内不重试，过了才允许再读
	await store.ensure();
	assert.equal(api.attempts(), 2);
	assert.equal(store.getSnapshot().ready, true);
	assert.deepEqual([...store.getSnapshot().ids].sort(), ["s1", "s3"]);
});

test("星标读写走归档管理器自己的收藏接口，并同步共享集合", async () => {
	const api = makeApi({ initial: ["s1"] });
	const store = createFavoriteRowStore();
	store.bind(api);
	await store.ensure();
	assert.deepEqual([...store.getSnapshot().ids], ["s1"]);

	await store.toggle("s2");
	assert.deepEqual(api.calls.at(-1), { sessionId: "s2", favorite: true });
	assert.deepEqual([...store.getSnapshot().ids].sort(), ["s1", "s2"]);
	assert.equal(store.getSnapshot().pending.size, 0);

	await store.toggle("s1");
	assert.deepEqual(api.calls.at(-1), { sessionId: "s1", favorite: false });
	assert.deepEqual([...store.getSnapshot().ids], ["s2"]);

	// 同一会话并发点击只写一次。
	await Promise.all([store.toggle("s3"), store.toggle("s3")]);
	assert.equal(api.calls.filter((call) => call.sessionId === "s3").length, 1);
});

test("写入失败回滚到点击前的收藏集合", async () => {
	const store = createFavoriteRowStore();
	store.bind({
		async favoriteSessions() { return { favoriteSessionIds: ["s1"] }; },
		async setSessionFavorite() { return { ok: false, error: { message: "拒绝写入" } }; }
	});
	await store.ensure();
	await store.toggle("s9");
	const snapshot = store.getSnapshot();
	assert.deepEqual([...snapshot.ids], ["s1"]);
	assert.equal(snapshot.pending.size, 0);
	assert.equal(snapshot.ready, true);
});
