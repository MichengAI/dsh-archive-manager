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
	assert.equal(menuItem.order, 50);
	assert.equal(typeof menuItem.inject, "function");

	const moveMenuItem = registrations.find((item) => item.name === "sidebar.workspaces.session.menu.item" && item.id === "archive-manager.move-session");
	assert.ok(moveMenuItem, "缺少移动到工作区菜单行");
	assert.equal(moveMenuItem.order, 480);

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

test("P1: 未分组组（key 为空字符串）在收藏位于折叠区时，分组标题必须可见且 predicate 必须返回 true", async () => {
	const favoritesOnlyVisibility = bundle.__test.favoritesOnlyVisibility;
	const favoriteGroupPredicate = bundle.__test.favoriteGroupPredicate;
	assert.equal(typeof favoritesOnlyVisibility, "function");
	assert.equal(typeof favoriteGroupPredicate, "function");

	// 收藏的会话 stray_cold 不在任何已知工作区中（即未分组会话）
	const favorites = new Set(["stray_cold"]);
	const workspaces = [{ workspaceId: "w1", sessionIds: ["w1_s1"] }];
	const predicate = favoriteGroupPredicate(favorites, workspaces);

	// 宿主 DOM 中未分组组的 groupKey 是空字符串 ""
	assert.equal(predicate(""), true, "未分组组裸 key 空字符串必须识别为含收藏");
	assert.equal(predicate("ungrouped"), true, "兼容字面量 ungrouped 也必须返回 true");
	assert.equal(predicate("w1"), false, "w1 不含收藏应返回 false");

	// 模拟未分组组未展开时的 DOM 行：
	// workspace: 为未分组标题；stray1、stray2 为前台渲染的未收藏项；stray_cold 在折叠区尚未渲染；overflow: 为展开按钮
	const rows = ["workspace:", "session:stray1", "session:stray2", "overflow:"];
	const visibility = favoritesOnlyVisibility(rows, {
		favorites,
		groupHasFavorite: (key) => predicate(key)
	});

	// 未分组组标题必须保留可见（true），否则整组被隐藏；
	// overflow 按钮在筛选开启期间收起（false）；未收藏普通会话隐藏（false）
	assert.deepEqual(visibility, [true, false, false, false]);
});

test("P2: 并发收藏请求交错且其中一个失败时，失败回滚不得抹除已成功的其他收藏", async () => {
	let serverFavorites = new Set(["s1"]);
	const store = createFavoriteRowStore();
	store.bind({
		async favoriteSessions() { return { favoriteSessionIds: [...serverFavorites] }; },
		async setSessionFavorite({ sessionId, favorite }) {
			if (sessionId === "sA") {
				// 慢请求，延迟 40ms 后失败
				await sleep(40);
				throw new Error("sA 模拟网络失败");
			}
			if (sessionId === "sB") {
				// 快请求，延迟 10ms 后成功
				await sleep(10);
				if (favorite) serverFavorites.add("sB");
				else serverFavorites.delete("sB");
				return { favoriteSessionIds: [...serverFavorites] };
			}
			throw new Error("unexpected sessionId");
		}
	});

	await store.ensure();
	assert.deepEqual([...store.getSnapshot().ids], ["s1"]);

	// 同时触发 sA（慢且失败）和 sB（快且成功）
	const pA = store.toggle("sA");
	const pB = store.toggle("sB");

	await Promise.allSettled([pA, pB]);

	const finalSnap = store.getSnapshot();
	// sB 应该成功保留在收藏集合中，sA 失败被回滚，s1 原始项保留
	assert.equal(finalSnap.ids.has("sB"), true, "快请求 sB 成功后必须保留在客户端状态中");
	assert.equal(finalSnap.ids.has("sA"), false, "慢请求 sA 失败后必须被移除");
	assert.equal(finalSnap.ids.has("s1"), true, "原始项 s1 必须保留");
	assert.equal(finalSnap.pending.size, 0, "所有请求结束后 pending 集合必须清空");
});

test("侧栏收藏星标与菜单图标标准尺寸对齐为 16×16 并复用前导插槽", async () => {
	const { readFileSync } = await import("node:fs");
	const src = readFileSync(fileURLToPath(new URL("../src/client.ts", import.meta.url)), "utf8");
	const starFn = src.slice(src.indexOf("function starSvg"), src.indexOf("const ROW_FAVORITE_CSS"));
	assert.match(starFn, /<svg width="16" height="16" viewBox="0 0 16 16"/, "starSvg 必须输出标准 16×16 尺寸 SVG");
	assert.doesNotMatch(starFn, /width="14" height="14"/, "starSvg 不应再出现缩小的 14×14 星标尺寸");
	assert.match(src, /\.dsham_rowStar svg\{[^}]*width:16px;height:16px/, "CSS 中星标 SVG 必须设为 16px×16px");
	assert.match(src, /\.dsham_starSlot\{[^}]*position:absolute/, "星标容器必须采用绝对定位覆盖前导插槽");
});
