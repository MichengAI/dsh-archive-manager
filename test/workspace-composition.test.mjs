// 使用真实 Cordis、官方工作区插件和插槽服务验证组合与卸载。
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import { loadClientStore } from "./helpers/client-store.mjs";
import { mirrorDirectoryFlow } from "../src/directory-flow-slot.js";

const require = createRequire(import.meta.url);
const statics = {};
for (const id of ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis", "@deepseek-ai/dsh-client-ui-slots"]) statics[id] = await import(id);
const store = await loadClientStore();
statics[store.id] = store.exports;
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, { get: () => () => null });
globalThis.window = globalThis;
globalThis.document = { body: null, querySelector: () => ({}), createElement: () => ({ dataset: {} }), head: { appendChild() {} } };
const factories = new Map();
window.__ModuleLoader__ = { load: ({ id, factory }) => factories.set(id, factory) };
async function load(id, path = join(dirname(require.resolve(`${id}/package.json`)), "lib", "client.js")) {
	await import(pathToFileURL(path).href);
	return factories.get(id)((name) => {
		if (statics[name]) return statics[name];
		throw new Error(`缺少静态模块 ${name}`);
	});
}
const renderer = await load("@deepseek-ai/dsh-client-ui-renderer");
const SlotRegistry = renderer.SlotRegistry ?? store.exports.SlotRegistry;
const official = await load("@deepseek-ai/dsh-client-ui-workspace");
const archive = await load("@michengai/dsh-archive-manager", fileURLToPath(new URL("../lib/client.js", import.meta.url)));
const tick = () => new Promise((resolve) => setImmediate(resolve));
const source = (state) => ({ getSnapshot: () => state, subscribe: () => () => {} });

test("目录镜像失败不影响源组件注册，清理部分镜像并在后续变化时恢复", () => {
	const root = new Context();
	const slots = new SlotRegistry(root);
	const sourceName = "sidebar.workspaces.directoryFlow";
	const target = "archiveManager.sidebar.directoryFlow";
	const disposeRoot = slots.register({ name: "root", children: {
		[sourceName]: { kind: "single", scope: "root" },
		[target]: { kind: "single", scope: "root" }
	} }, () => null);
	const errors = [];
	const originalError = console.error;
	console.error = (...args) => errors.push(args);
	const disposers = [];
	let stop;
	try {
		const blocker = slots.register({ name: target, priority: 1 }, () => null);
		disposers.push(blocker);
		stop = mirrorDirectoryFlow(root, target);
		disposers.push(slots.register({ name: sourceName, priority: 0, registrant: "official-a" }, () => null));
		assert.equal(slots.entries(target).length, 2);
		assert.doesNotThrow(() => {
			disposers.push(slots.register({ name: sourceName, priority: 1, registrant: "official-b" }, () => null));
		}, "目标冲突不能传播到官方源组件的注册调用");
		assert.equal(slots.entries(sourceName).length, 2);
		assert.equal(slots.entries(target).length, 1, "失败后仅保留外部阻塞条目");
		assert.ok(errors.some((args) => args[0].includes(sourceName) && args[0].includes(target) && args[0].includes("official-b") && args[1] instanceof Error));
		blocker();
		disposers.push(slots.register({ name: sourceName, priority: 2, registrant: "official-c" }, () => null));
		assert.equal(slots.entries(target).length, 3);
		assert.deepEqual(slots.entries(target).map((entry) => entry.registrant), ["official-a", "official-b", "official-c"]);
		stop();
		assert.equal(slots.entries(target).length, 0);
		assert.equal(slots.entries(sourceName).length, 3);
	} finally {
		stop?.();
		for (const dispose of disposers.reverse()) dispose();
		disposeRoot();
		console.error = originalError;
	}
});

test("官方样式已加载时，归档侧栏仍加载自己的样式", () => {
	const previous = globalThis.document;
	const tags = ["Rows", "WorkspacePicker", "WorkspaceBrowser"].map((name) => ({
		dataset: { pluginCss: `@deepseek-ai/dsh-client-ui-workspace/${name}.module.css` }, textContent: "official"
	}));
	globalThis.document = {
		querySelector(selector) { return tags.find((tag) => selector.includes(JSON.stringify(tag.dataset.pluginCss))) ?? null; },
		createElement: () => ({ dataset: {} }), head: { appendChild: (tag) => tags.push(tag) }
	};
	try {
		factories.get("@michengai/dsh-archive-manager")((id) => {
			if (statics[id]) return statics[id];
			throw new Error(`缺少静态模块 ${id}`);
		});
		assert.ok(tags.some((tag) => tag.textContent.includes(".qDHVXG_sectionHeader")), "不能因官方同名 CSS 标签而跳过归档侧栏样式");
		assert.equal(tags.filter((tag) => tag.textContent === "official").length, 3);
	} finally {
		globalThis.document = previous;
	}
});

test("安装补丁保持官方 ui-workspace 启用", async () => {
	const patch = await readFile(new URL("../cordis.patch.yml", import.meta.url), "utf8");
	assert.doesNotMatch(patch, /id: ui-workspace\s+disabled: true/);
});

for (const archiveFirst of [false, true]) test(`官方选择器和导航保持唯一，侧栏覆盖可恢复（归档先加载=${archiveFirst}）`, async () => {
	const root = new Context();
	const slots = new SlotRegistry(root);
	const dictionaries = new Set();
	root.provide("locale", {
		register(ns) { assert.ok(!dictionaries.has(ns), `字典重复 ${ns}`); dictionaries.add(ns); return () => dictionaries.delete(ns); },
		bind: () => (key) => key
	});
	const opened = [];
	root.provide("sessions", { list: source({ phase: "ready", ids: [], byId: {}, current: "existing" }), open: (id) => opened.push(id), create: async () => "new-session" });
	root.provide("workspaces", { list: source({ phase: "ready", items: [{ workspaceId: "w1", path: "C:\\project", sessionIds: [] }], archivedSessionIds: [] }) });
	root.provide("remote", { $mount: async () => () => {} });
	root.provide("remote.directoryPicker", {});
	root.provide("connection", {});
	root.provide("typert", {});
	root.provide("layout", { beginNavigation: () => new AbortController().signal, selectPanel() {} });
	const declare = () => slots.register({ name: "root", children: {
		"sidebar.workspaces": { kind: "single", scope: "root" },
		"conversation.hero.workspace": { kind: "single", scope: "root" },
		"settings.section": { kind: "list", scope: "root" }
	} }, () => null);
	let disposeRoot = declare();
	let stock, custom;
	try {
		if (archiveFirst) custom = root.plugin(archive);
		stock = root.plugin(official);
		await stock;
		const navigation = root.get("uiWorkspace");
		if (navigation) navigation.archiveCompositionMarker = "official-instance";
		const picker = slots.entries("conversation.hero.workspace")[0];
		const stockSidebar = slots.entries("sidebar.workspaces").find((entry) => (entry.options.priority ?? 0) === 0);
		if (!custom) custom = root.plugin(archive);
		await custom;
		await tick();
		assert.equal(slots.entries("sidebar.workspaces").length, 2);
		assert.equal(slots.entries("sidebar.workspaces")[0].component !== stockSidebar.component, true);
		assert.deepEqual(slots.entries("conversation.hero.workspace"), [picker]);
		assert.equal(root.get("uiWorkspace")?.archiveCompositionMarker, navigation ? "official-instance" : undefined);
		if (typeof navigation?.openWorkspace === "function") {
			const draft = [];
			await navigation.openWorkspace("w1", (id) => draft.push(id));
			assert.deepEqual(draft, ["new-session"]);
			assert.deepEqual(opened, ["new-session"]);
		}
		const flow = () => null;
		const injected = () => ({ pick: "official" });
		const disposeFlow = slots.register({ name: "sidebar.workspaces.directoryFlow", inject: injected }, flow);
		await tick();
		const mirror = slots.entries("archiveManager.sidebar.directoryFlow")[0];
		assert.equal(mirror.component, flow);
		assert.equal(mirror.inject, injected);
		disposeFlow();
		await tick();
		assert.equal(slots.entries("archiveManager.sidebar.directoryFlow").length, 0);
		// 父插槽消失后重建，两个插件必须重新注册，且目录声明不能残留。
		disposeRoot();
		disposeRoot = declare();
		await tick();
		assert.equal(slots.entries("sidebar.workspaces").length, 2);
		assert.equal(slots.entries("conversation.hero.workspace").length, 1);
		await custom.dispose();
		assert.equal(slots.entries("sidebar.workspaces").length, 1);
		assert.equal(slots.entries("sidebar.workspaces")[0].component, stockSidebar.component);
		assert.equal(root.get("uiWorkspace")?.archiveCompositionMarker, navigation ? "official-instance" : undefined);
		assert.ok(dictionaries.has("workspace"));
		await stock.dispose();
		assert.equal(root.get("uiWorkspace"), undefined);
	} finally {
		await custom?.dispose();
		await stock?.dispose();
		disposeRoot();
	}
});

for (const codexFirst of [false, true]) test(`Codex 侧栏保留组件与交互，卸载后恢复归档侧栏（Codex 先加载=${codexFirst}）`, async () => {
	const root = new Context();
	const slots = new SlotRegistry(root);
	root.provide("locale", { register: () => () => {}, bind: () => (key) => key });
	root.provide("sessions", { list: source({ phase: "ready", ids: [], byId: {} }) });
	root.provide("workspaces", { list: source({ phase: "ready", items: [], archivedSessionIds: [] }) });
	root.provide("remote", { $mount: async () => () => {} });
	root.provide("remote.directoryPicker", {});
	root.provide("connection", {});
	root.provide("typert", {});
	root.provide("layout", {});
	const disposeRoot = slots.register({ name: "root", children: {
		"sidebar.workspaces": { kind: "single", scope: "root" },
		"conversation.hero.workspace": { kind: "single", scope: "root" },
		"settings.section": { kind: "list", scope: "root" }
	} }, () => null);
	const CodexSidebar = () => null;
	const opened = [];
	// Codex UI 1.1.2 的公开插槽契约；验证渲染获胜者保留原有注入回调。
	const inject = () => ({ openSession: (id) => opened.push(id) });
	const mountCodex = () => slots.register({ name: "sidebar.workspaces", priority: -1, inject }, CodexSidebar);
	let disposeCodex, stock, custom;
	try {
		stock = root.plugin(official);
		await stock;
		if (codexFirst) disposeCodex = mountCodex();
		custom = root.plugin(archive);
		await custom;
		await tick();
		if (!disposeCodex) disposeCodex = mountCodex();
		const winner = slots.entries("sidebar.workspaces")[0];
		assert.equal(winner.component, CodexSidebar, "归档插件不能抢占 Codex 工作区列表");
		assert.equal(winner.inject, inject);
		winner.inject().openSession("existing-session");
		assert.deepEqual(opened, ["existing-session"]);
		assert.ok(slots.entries("settings.section").some((entry) => entry.options.id === "archived-sessions"));
		disposeCodex();
		disposeCodex = undefined;
		assert.equal(slots.entries("sidebar.workspaces")[0].component.name, "WorkspaceBrowser");
		disposeCodex = mountCodex();
		await custom.dispose();
		assert.equal(slots.entries("sidebar.workspaces")[0].component, CodexSidebar);
	} finally {
		disposeCodex?.();
		await custom?.dispose();
		await stock?.dispose();
		disposeRoot();
	}
});
