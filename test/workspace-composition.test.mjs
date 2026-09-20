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
import { allowArchivedNavigation, currentSessionId } from "../src/archive-experience.js";
import { createSessionOrganizer } from "../src/archive-organizer.js";

const require = createRequire(import.meta.url);
const statics = {};
for (const id of ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis", "@deepseek-ai/dsh-client-ui-slots"]) statics[id] = await import(id);
const store = await loadClientStore();
statics[store.id] = store.exports;
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, { get: () => () => null });
globalThis.window = globalThis;
if (globalThis.localStorage === undefined) {
	const memory = new Map();
	globalThis.localStorage = {
		getItem: (key) => memory.has(key) ? memory.get(key) : null,
		setItem: (key, value) => { memory.set(String(key), String(value)); },
		removeItem: (key) => { memory.delete(String(key)); },
		clear: () => memory.clear()
	};
}
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

test("归档诊断读取没有列表摘要的 ID", async () => {
  const effects = [], calls = [];
  const hooks = { ...statics.react,
    useSyncExternalStore: (_subscribe, get) => get(),
    useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
    useRef: initial => ({ current: initial }), useMemo: fn => fn(),
    useEffect: fn => effects.push(fn)
  };
  const client = factories.get("@michengai/dsh-archive-manager")(name => name === "react" ? hooks : statics[name]);
  client.__test.ArchivedSessionsSection({
    sessionStore: source({ byId: {} }),
    workspaceStore: source({ items: [], archivedSessionIds: ["missing-header"] }),
    archivedSessionMetadata: async () => ({ items: [] }),
    sessionDetails: async input => { calls.push(input); return { items: [] }; }, t: key => key
  });
  const cleanups = effects.map(fn => fn());
  await tick();
  assert.deepEqual(calls, [{ sessionIds: ["missing-header"] }]);
  cleanups.forEach(fn => fn?.());
});

test("真实官方导航监听器：显式查看归档不再被清空，切换和卸载恢复默认策略", async (t) => {
  const observable = (state) => {
    const listeners = new Set();
    return { getSnapshot: () => state, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, update(next) { state = next; for (const fn of listeners) fn(); } };
  };
  const retainOn = (list, id, source) => {
    const snapshot = list.getSnapshot();
    const previous = snapshot.byId[id] ?? { id };
    list.update({
      ...snapshot,
      current: id,
      byId: { ...snapshot.byId, [id]: { ...previous, id, retainedBy: { ...(previous.retainedBy ?? {}), [source]: 1 } } }
    });
    return {
      sessionId: id,
      release() {
        const next = list.getSnapshot();
        const row = next.byId[id];
        const retainedBy = { ...(row?.retainedBy ?? {}) };
        delete retainedBy[source];
        list.update({
          ...next,
          current: next.current === id ? undefined : next.current,
          byId: { ...next.byId, [id]: { ...row, id, retainedBy } }
        });
      }
    };
  };
  const root = new Context();
  const slots = new SlotRegistry(root);
  root.provide("locale", { register: () => () => {}, bind: () => key => key });
  const list = observable({
    phase: "ready",
    ids: ["old", "normal"],
    byId: { old: { id: "old", retainedBy: {} }, normal: { id: "normal", retainedBy: {} } },
    current: "normal"
  });
  const sessions = {
    list,
    open(id) { list.update({ ...list.getSnapshot(), current: id }); },
    clear() { list.update({ ...list.getSnapshot(), current: undefined }); },
    retain(id, options) { return retainOn(list, typeof id === "string" ? id : id.sessionId, options.source); },
    subagentAddress() {},
    refreshSubagents() {}
  };
  const workspaces = { list: observable({ phase: "ready", items: [], archivedSessionIds: ["old"] }) };
  root.provide("sessions", sessions); root.provide("workspaces", workspaces);
  root.provide("remote", {});
  root.provide("remote.directoryPicker", {}); root.provide("connection", {}); root.provide("typert", {});
  root.provide("layout", { beginNavigation: () => new AbortController().signal, selectPanel() {} });
  const stock = root.plugin(official);
  await stock;
  const navigation = root.get("uiWorkspace");
  if (typeof navigation?.clearArchivedCurrent !== "function") { await stock.dispose(); t.skip("此旧宿主无新版导航监听器"); return; }
  const selected = () => currentSessionId(list.getSnapshot());
  const selectWithoutGuard = (id) => {
    if (typeof navigation.openSession === "function") navigation.openSession(id);
    else sessions.open(id);
    // alpha.2 在 retain 之后才写入 mainReference；官方清理看随后的列表刷新。
    list.update({ ...list.getSnapshot() });
  };
  let guard;
  try {
    selectWithoutGuard("old");
    assert.equal(selected(), undefined, "复现：官方监听器清空归档选择");
    guard = allowArchivedNavigation(navigation, sessions, workspaces);
    guard.open("old");
    assert.equal(selected(), "old");
    list.update({ ...list.getSnapshot() });
    assert.equal(selected(), "old", "后续列表刷新不清空");
    selectWithoutGuard("normal"); selectWithoutGuard("old");
    assert.equal(selected(), undefined, "离开后取消本次放行");
    guard.open("old"); guard.dispose(); guard = undefined;
    if (typeof navigation.openSession === "function") selectWithoutGuard("old");
    else list.update({ ...list.getSnapshot() });
    assert.equal(selected(), undefined, "卸载恢复官方策略");
  } finally { guard?.dispose(); await stock.dispose(); }
});

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

test("安装补丁关闭官方已归档设置页，仍替换宿主 workspace", async () => {
	const patch = await readFile(new URL("../cordis.patch.yml", import.meta.url), "utf8");
	assert.match(patch, /id: ui-settings-unarchive-sessions\s+disabled: true/);
	assert.match(patch, /id: workspace\s+disabled: true/);
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
	root.provide("sessions", {
		list: source({ phase: "ready", ids: [], byId: {}, current: "existing" }),
		open: (id) => opened.push(id),
		create: async () => "new-session",
		retain(id) {
			const sessionId = typeof id === "string" ? id : id.sessionId;
			opened.push(sessionId);
			return { sessionId, release() {} };
		},
		subagentAddress() {},
		refreshSubagents() {}
	});
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
			assert.ok(opened.includes("new-session"));
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

// 加载完整客户端工厂并执行实际设置页按钮；不切片或复制组件实现。
for (const restore of [false, true]) {
  for (const failure of [false, true]) {
    test(`设置页插槽关闭回调：恢复=${restore}，打开失败=${failure}`, async () => {
      const writes = [];
      const hooks = {
        ...statics.react,
        useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
        useState: initial => [typeof initial === "function" ? initial() : initial, value => writes.push(value)],
        useRef: initial => ({ current: initial }),
        useMemo: fn => fn(),
        useEffect: () => {}
      };
      const client = factories.get("@michengai/dsh-archive-manager")(name => name === "react" ? hooks : statics[name]);
      const calls = [];
      let finish;
      const opened = new Promise(resolve => { finish = resolve; });
      const tree = client.__test.ArchivedSessionsSection({
        sessionStore: source({ byId: { old: { id: "old", title: "历史会话", updatedAt: 1 } } }),
        workspaceStore: source({ items: [], archivedSessionIds: ["old"] }),
        archivedSessionMetadata: async () => ({ items: [] }),
        unarchiveSession: async id => calls.push(["restore", id]),
        openConversation: async id => { calls.push(["open", id]); await opened; if (failure) throw new Error("open rejected"); },
        close: () => calls.push(["close"]),
        t: key => key
      });
      function find(node) {
        if (Array.isArray(node)) return node.map(find).find(Boolean);
        if (!node?.props) return;
        if (restore ? node.type?.name === "ArchivedSessionMenu" : node.props.className === "dsham_settingsTitleLink") return node;
        return find(node.props.children);
      }
      const button = find(tree);
      assert.ok(button, "真实组件应提供标题打开或菜单恢复打开入口");
      const pending = restore ? button.props.onRestoreOpen() : button.props.onClick();
      await tick();
      assert.equal(calls.some(([action]) => action === "close"), false, "打开完成前不能关闭设置");
      finish();
      await pending;
      assert.deepEqual(calls, [...(restore ? [["restore", "old"]] : []), ["open", "old"], ...(failure ? [] : [["close"]])]);
      if (failure) assert.ok(writes.includes("open rejected"), "打开失败应显示错误");
      if (restore && failure) assert.ok(writes.includes("unarchived"), "恢复成功但打开失败应切到未归档，避免会话从列表消失");
    });
  }
}

test("归档 TAB 默认与切换、多项目选择、确认提交和状态刷新", async () => {
 const values = []; let cursor = 0;
 const hooks = { ...statics.react,
  useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  useState: initial => { const i=cursor++; if (!(i in values)) values[i]=typeof initial === "function" ? initial() : initial; return [values[i], value => {values[i]=typeof value === "function" ? value(values[i]) : value;}]; },
  useRef: initial => { const i=cursor++; return values[i] ??= {current:initial}; },
  useMemo: fn => fn(), useEffect: () => {}
 };
 const client = factories.get("@michengai/dsh-archive-manager")(name => name === "react" ? hooks : statics[name]);
 const state = {items:[{workspaceId:"a",title:"项目 A",sessionIds:["one"]},{workspaceId:"b",title:"项目 B",sessionIds:["two"]}],archivedSessionIds:["old"]};
 const calls=[]; let failNext=true;
 const props = {sessionStore:source({byId:Object.fromEntries(["one","two","old"].map(id => [id,{id,title:id,updatedAt:1}]))}),workspaceStore:source(state),archivedSessionMetadata:async()=>({items:[]}),archiveSessions:async ids=>{calls.push(ids);if(failNext){failNext=false;throw new Error("写入失败");}state.archivedSessionIds=[...state.archivedSessionIds,...ids];return {archivedSessionIds:state.archivedSessionIds,archivedSessionIdsAdded:ids};},t:key=>key};
 const render=()=>{cursor=0;return client.__test.ArchivedSessionsSection(props);};
 const nodes=(node)=>Array.isArray(node)?node.flatMap(nodes):node?.props?[node,...nodes(node.props.children)]:[];
 let tree=render();
 const tab=(name)=>nodes(tree).find(n=>n.props.role==="tab" && n.props.children===`archives.tab.${name}`);
 assert.equal(tab("archived").props["aria-selected"],true);
 assert.equal(nodes(tree).some(n=>n.type==="header" && nodes(n.props.children).some(child=>child.props.role==="tablist")),false,"归档页签不得被 Codex UI 的 header [role=tablist] 会话顶栏适配器命中");
 assert.equal(nodes(tree).some(n=>n.props.children==="archives.restoreAll"),false);
 tab("unarchived").props.onClick();tree=render();
 assert.equal(tab("unarchived").props["aria-selected"],true);
 assert.equal(nodes(tree).some(n=>n.props.children==="archives.restoreAll"),false);
 for(const row of nodes(tree).filter(n=>n.type==="article")) nodes(row).find(n=>n.props.label && n.props.onChange).props.onChange({target:{checked:true}});
 tree=render();
 let toolbar=nodes(tree).find(n=>n.props.onToggle);
 assert.equal(toolbar.props.selectedCount,2);
 const search=nodes(tree).find(n=>n.type==="input" && n.props.type==="search");
 search.props.onChange({target:{value:"one"}});tree=render();
 toolbar=nodes(tree).find(n=>n.props.onToggle);
 assert.equal(toolbar.props.hiddenCount,1);
 toolbar.props.onArchive();tree=render();
 const dialog=nodes(tree).find(n=>n.props.open===true && n.props.description==="archives.archiveSelectedDesc");
 assert.ok(dialog);
 const confirmButton=nodes(dialog.props.footer).find(n=>n.props.children==="archives.archiveSelected");
 assert.equal(confirmButton.props.variant,"outline","归档确认按钮与取消按钮使用一致的描边样式");
 const submit=confirmButton.props.onClick;
 await Promise.all([submit(),submit()]);
 tree=render(); assert.equal(calls.length,1,"重复提交只发送一次请求");
 toolbar=nodes(tree).find(n=>n.props.onToggle);
 assert.equal(toolbar.props.selectedCount,2,"失败后保留跨筛选选择");
 assert.ok(nodes(tree).some(n=>n.props.role==="alert"));
 const retry=nodes(tree).find(n=>n.props.open===true && n.props.description==="archives.archiveSelectedDesc");
 assert.ok(retry,"失败后保留原确认框，可直接重试");
 assert.ok(nodes(retry.props.children).some(n=>n.props.role==="alert"),"错误在弹窗内显示");
 await nodes(retry.props.footer).find(n=>n.props.children==="archives.archiveSelected").props.onClick();
 tree=render();assert.deepEqual(calls,[["one","two"],["one","two"]]);
 assert.equal(tab("archived").props["aria-selected"],true,"批量归档成功后切到已归档页");
 assert.equal(nodes(tree).filter(n=>n.type==="article").length,3);
 assert.ok(nodes(tree).some(n=>n.props.role==="status" && n.props.children==="archives.archiveSuccess"));
 state.archivedSessionIds=["old"];
 tab("unarchived").props.onClick();tree=render();
 assert.equal(nodes(tree).some(n=>n.props.role==="status" && n.props.children==="archives.archiveSuccess"),false,"切换页签清除上次成功提示");
 nodes(tree).find(n=>n.type==="button" && n.props["aria-label"]==="archives.archiveSelected").props.onClick();tree=render();
 assert.equal(nodes(tree).some(n=>n.props.role==="status" && n.props.children==="archives.archiveSuccess"),false,"新归档清除上次成功提示");
 const freshDialog=nodes(tree).find(n=>n.props.open===true && n.props.description==="archives.archiveSelectedDesc");
 freshDialog.props.onClose();tree=render();
 assert.equal(nodes(tree).some(n=>n.props.open===true),false,"取消关闭确认框");
 state.archivedSessionIds=["old","one","two"];tree=render();
 tab("archived").props.onClick();tree=render();
 assert.equal(nodes(tree).find(n=>n.props.onToggle).props.selectedCount,0);
 assert.equal(nodes(tree).filter(n=>n.type==="article").length,3);
 // 项目菜单作用于整个项目，不被标题搜索缩小；未分组采用相同规则。
 for (const ungrouped of [false,true]) {
  state.archivedSessionIds=["old"];
  state.items=ungrouped?[]:[{workspaceId:"a",title:"项目 A",sessionIds:["one","two"]}];
  tab("unarchived").props.onClick();tree=render();
  nodes(tree).find(n=>n.type==="input" && n.props.type==="search").props.onChange({target:{value:"one"}});tree=render();
  const actions=nodes(tree).find(n=>n.props.group && n.props.onArchive);
  assert.ok(actions,"未归档项目与未分组均提供更多菜单");
  const menu=actions.type(actions.props);
  assert.deepEqual(menu.props.items.map(item=>item.id),["archive"]);
  assert.equal(menu.props.items[0].danger,true);
  menu.props.onSelect("archive");tree=render();
  const groupDialog=nodes(tree).find(n=>n.props.open===true && n.props.description===(ungrouped?"archives.archiveUngroupedDesc":"archives.archiveProjectDesc"));
  assert.ok(groupDialog,"确认框说明整个分组的范围");
  await nodes(groupDialog.props.footer).find(n=>n.props.children==="archives.archiveSelected").props.onClick();
  assert.deepEqual(calls.at(-1),["one","two"],"搜索隐藏的项目会话也应归档");
  tree=render();tab("archived").props.onClick();tree=render();
 }

});

test("整理页收藏、闲置预览、部分失败重试及撤回形成完整闭环", async () => {
  const values = []; let cursor = 0;
  const hooks = { ...statics.react,
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    useState: initial => { const i = cursor++; if (!(i in values)) values[i] = typeof initial === "function" ? initial() : initial; return [values[i], next => { values[i] = typeof next === "function" ? next(values[i]) : next; }]; },
    useRef: initial => { const i = cursor++; return values[i] ??= { current: initial }; },
    useMemo: fn => fn(), useEffect: () => {}
  };
  const client = factories.get("@michengai/dsh-archive-manager")(name => name === "react" ? hooks : statics[name]);
  const state = { items: [], archivedSessionIds: ["previous"] };
  const sessionState = { byId: Object.fromEntries(["a", "b", "c", "protected", "previous"].map(id => [id, { id, title: id, updatedAt: 1 }])) };
  const favorites = new Set(["protected"]), calls = [];
  let failOnce = true;
  const favoriteSessions = async () => ({ favoriteSessionIds: [...favorites] });
  const props = {
    sessionStore: source(sessionState), workspaceStore: source(state), archivedSessionMetadata: async () => ({ items: [] }),
    favoriteSessions, setSessionFavorite: async ({ sessionId, favorite }) => { if (favorite) favorites.add(sessionId); else favorites.delete(sessionId); return favoriteSessions(); },
    organizeBatch: createSessionOrganizer({
      workspaces: source(state), sessions: source(sessionState), getFavorites: favoriteSessions, currentSessionId,
      archive: async id => { calls.push(id); if (id === "b" && failOnce) { failOnce = false; throw new Error("测试写入失败"); } state.archivedSessionIds = [...state.archivedSessionIds, id]; },
      restore: async id => { state.archivedSessionIds = state.archivedSessionIds.filter(value => value !== id); return state; }
    }), t: key => key
  };
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
  let tree;
  const render = () => { cursor = 0; tree = client.__test.ArchivedSessionsSection(props); };
  const panel = () => nodes(tree).find(node => node.type?.name === "OrganizerPanel");
  const tab = name => nodes(tree).find(node => node.props.role === "tab" && node.props.children === `archives.tab.${name}`);
  render();
  await panel().props.onReload(); render();
  assert.equal(panel().props.ready, true);
  const filter = nodes(tree).find(node => node.props.id === "dsham-favorite-filter");
  assert.deepEqual(filter.props.options.map(option => option.value), ["all", "favorites"]);
  const menuNode = nodes(tree).find(node => node.type?.name === "ArchivedSessionMenu");
  assert.ok(menuNode, "已归档行通过更多菜单提供恢复打开和删除");
  const menu = menuNode.type(menuNode.props);
  assert.deepEqual(menu.props.items.map(item => item.id), ["restoreOpen", "copyId", "delete"]);
  assert.equal(menu.props.items.at(-1).danger, true);
  menu.props.onSelect("delete"); render();
  const deleteDialog = nodes(tree).find(node => node.props.open === true);
  assert.ok(deleteDialog, "删除菜单先打开确认框");
  deleteDialog.props.onClose(); render();
  const groupToggle = () => nodes(tree).find(node => node.props.className === "dsham_groupToggle");
  groupToggle().props.onClick(); render();
  assert.equal(nodes(tree).filter(node => node.type === "article").length, 0);
  assert.equal(groupToggle().props["aria-expanded"], false);
  groupToggle().props.onClick(); render();
  assert.equal(nodes(tree).filter(node => node.type === "article").length, 1);
  tab("unarchived").props.onClick(); render();
  assert.equal(panel().props.count, 3, "收藏不参与闲置归档");
  const rowActions = nodes(tree).find(node => node.props.className === "dsham_settingsActions").props.children;
  assert.deepEqual(rowActions.filter(Boolean).map(node => node.props.title), ["organizer.favorite", "archives.archiveSelected"]);
  assert.ok(rowActions.filter(Boolean).every(node => typeof node.props.children !== "string"), "右侧只显示图标");
  const favorite = nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "organizer.favoritecommon.separatora");
  await favorite.props.onClick(); render();
  assert.equal(panel().props.count, 2);
  nodes(tree).find(node => node.props.id === "dsham-favorite-filter").props.onChange("favorites"); render();
  assert.equal(nodes(tree).filter(node => node.type === "article").length, 2);
  nodes(tree).find(node => node.props.id === "dsham-favorite-filter").props.onChange("all"); render();
  await nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "organizer.unfavoritecommon.separatora").props.onClick(); render();
  panel().props.onPreview(); render();
  const dialog = nodes(tree).find(node => node.props.open === true);
  assert.equal(nodes(dialog.props.children).filter(node => node.type === "input" && node.props.type === "checkbox").length, 3);
  const confirm = nodes(dialog.props.footer).find(node => node.props.children === "archives.archiveSelected");
  await Promise.all([confirm.props.onClick(), confirm.props.onClick()]); render();
  assert.deepEqual(calls, ["a", "b"]);
  assert.deepEqual(panel().props.result.succeeded, ["a"]);
  assert.deepEqual(panel().props.result.remaining, ["b", "c"]);
  nodes(tree).find(node => node.props.id === "dsham-tab-archived").props.onClick(); render();
  assert.equal(panel().props.result, null, "归档结果不得出现在另一页签");
  nodes(tree).find(node => node.props.id === "dsham-tab-unarchived").props.onClick(); render();
  assert.deepEqual(panel().props.result.remaining, ["b", "c"], "返回原页签仍可重试失败项");
  assert.equal(panel().props.undoCount, 1);
  await panel().props.onRetry(); await tick(); render();
  assert.deepEqual(calls, ["a", "b", "b", "c"]);
  assert.equal(panel().props.undoCount, 3);
  await panel().props.onUndo(); render();
  assert.deepEqual(state.archivedSessionIds, ["previous"]);
  assert.equal(panel().props.undoCount, 0);
  assert.deepEqual([...favorites], ["protected"]);
});

test("归档发现入口提供组合日期筛选及只读预览", async () => {
  const values = []; let cursor = 0;
  const hooks = { ...statics.react, useSyncExternalStore: (_s, get) => get(), useState: initial => { const i = cursor++; if (!(i in values)) values[i] = typeof initial === "function" ? initial() : initial; return [values[i], next => { values[i] = typeof next === "function" ? next(values[i]) : next; }]; }, useRef: initial => { const i = cursor++; return values[i] ??= { current: initial }; }, useMemo: fn => fn(), useEffect: () => {} };
  const client = factories.get("@michengai/dsh-archive-manager")(name => name === "react" ? hooks : statics[name]);
  const props = { sessionStore: source({ byId: { a: { id: "a", title: "九月", updatedAt: new Date(2026, 8, 20).getTime() }, b: { id: "b", title: "八月", updatedAt: new Date(2026, 7, 20).getTime() } } }), workspaceStore: source({ items: [], archivedSessionIds: ["a", "b"] }), archivedSessionMetadata: async () => ({ items: [] }), previewArchivedSession: async () => ({}), searchArchivedContent: async () => ({ items: [], failures: [] }), t: (key, args) => key === "archives.sessionCount" ? String(args.n) : key };
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : [];
  const render = () => { cursor = 0; return client.__test.ArchivedSessionsSection(props); };
  let tree = render();
  const filters = nodes(tree).find(n => n.type?.name === "DiscoveryFilters");
  assert.ok(filters, "日期筛选应接入真实设置页");
  const searchRow = nodes(tree).find(n => n.props.className === "dsham_settingsSearch");
  assert.ok(nodes(searchRow).includes(filters), "日期筛选应位于搜索框右侧");
  assert.ok(nodes(searchRow).some(n => n.type?.name === "ArchiveProjectSelect" && n.props["aria-label"] === "discovery.scope"), "搜索框左侧常驻查找范围切换");
  filters.props.onFrom("2026-09-01"); tree = render();
  assert.equal(nodes(tree).filter(n => n.type === "article").length, 1);
  assert.equal(nodes(tree).find(n => n.props.className === "dsham_settingsCount").props.children, "1", "日期筛选后的数量必须与可见会话一致");
  const menuNode = nodes(tree).find(n => n.type?.name === "ArchivedSessionMenu");
  const menu = menuNode.type(menuNode.props);
  assert.deepEqual(menu.props.items.map(i => i.id), ["preview", "restoreOpen", "copyId", "delete"]);
  await menuNode.props.onCopyId(); tree = render();
  assert.equal(nodes(tree).find(n => n.props.role === "alert").props.children, "copy.unavailable");
  menu.props.onSelect("preview"); tree = render();
  assert.ok(nodes(tree).some(n => n.props.open && n.props.title === "九月"), "预览弹窗应打开且仍保持归档列表");
  nodes(tree).find(n => n.props.open).props.onClose(); tree = render();
  assert.equal(nodes(tree).some(n => n.props.open), false);
  nodes(tree).find(n => n.type?.name === "DiscoveryFilters").props.onClear(); tree = render();
  assert.equal(nodes(tree).filter(n => n.type === "article").length, 2);
  nodes(tree).find(n => n.props.id === 'dsham-tab-unarchived').props.onClick(); tree = render();
  assert.ok(nodes(tree).some(n => n.props.id === 'dsham-search-scope'), '未归档同样提供标题与正文范围');
  assert.ok(nodes(tree).find(n => n.props.id === 'dsham-sort-filter').props.options.some(option => option.value === 'created'), '未归档同样支持创建时间排序');
});
