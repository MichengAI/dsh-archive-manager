// dsh-archive-manager client bundle self-tests (node:test).
//
// 使用当前 DSH 的 client-store 实例化已归档会话管理客户端 bundle。其余 static module table
// (react, cordis, ui-slots,
// ui-primitives, ...) resolved from the dsh flat module fallback through the
// test 目录的 `node_modules` junction。覆盖客户端自身的派生
// functions and store through its `__test` export.
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import semver from "semver";

const FALLBACK = fileURLToPath(new URL("../node_modules", import.meta.url));

// --- real static module table (mirror of dsh-client-web getStaticModules) ---
import { createRequire } from "node:module";
const requireFallback = createRequire(import.meta.url);
const statics = {};
for (const spec of [
	"react",
	"react/jsx-runtime",
	"react-dom",
	"react-dom/client",
	"@deepseek-ai/cordis",
	"@deepseek-ai/dsh-client-ui-slots"
]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
const { loadClientStore } = await import("./helpers/client-store.mjs");
const { exports: { defineStore } } = await loadClientStore();
// The primitives package imports CSS through its bundler pipeline, which
// 纯 Node ESM 无法加载；客户端仅在组件
// bodies, so a no-op facade suffices for materialization + derivation tests.
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, {
	get: (target, prop) => {
		if (typeof prop === "string") target[prop] = () => null;
		return target[prop];
	}
});

// --- browser environment stubs for bundle materialization ---
globalThis.window = globalThis;
const styleStub = { dataset: {}, set textContent(v) {} };
globalThis.document = {
	querySelector: () => null,
	createElement: () => styleStub,
	head: { appendChild: () => {} }
};

// --- minimal client module system ---
const factories = new Map();
window.__ModuleLoader__ = { load: (handoff) => { factories.set(handoff.id, handoff.factory); } };

async function loadBundle(absolutePath) {
	await import(pathToFileURL(absolutePath).href);
}

function materialize(id, options = {}) {
	const staticModules = options.staticModules ?? statics;
	const requests = options.requests;
	const factory = factories.get(id);
	if (factory === void 0) throw new Error(`no factory registered for ${id}`);
	const module = { exports: {} };
	const require = (spec) => {
		requests?.push(spec);
		if (Object.hasOwn(staticModules, spec)) return staticModules[spec];
		const stripped = spec.endsWith("/client") ? spec.slice(0, -7) : spec;
		if (stripped !== id && factories.has(stripped)) return materialize(stripped, options);
		throw new Error(`smoke require miss: ${spec}`);
	};
	// The factory owns its own `module`/`exports` closure; its return value is
	// the authoritative exports object (mirrors the real loader).
	return factory(require, module, module.exports) ?? module.exports;
}

const CLIENT_BUNDLE = fileURLToPath(new URL("../lib/client.js", import.meta.url));
const PACKAGE_MANIFEST = JSON.parse(await readFile(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

await loadBundle(CLIENT_BUNDLE);
const alphaRequests = [];
const bundle = materialize("@michengai/dsh-archive-manager", {
	requests: alphaRequests,
	staticModules: {
		...statics,
		"@deepseek-ai/dsh-client-store": { defineStore }
	}
});
const legacyRequests = [];
const legacyBundle = materialize("@michengai/dsh-archive-manager", {
	requests: legacyRequests,
	staticModules: {
		...statics,
		"@deepseek-ai/dsh-client-runtime/client": { defineStore }
	}
});

const t = bundle.__test;

function summary(id, extra = {}) {
	return { id, displayTitle: `Title-${id}`, origin: "root", blank: false, running: false, updatedAt: 1, ...extra };
}

const list = {
	current: void 0,
	ids: ["s1", "s2", "s3"],
	byId: { s1: summary("s1"), s2: summary("s2"), s3: summary("s3") }
};
const workspaces = [
	{ workspaceId: "w1", path: "D:\\proj-a", title: "proj-a", createdAt: "2026-01-01T00:00:00.000Z", sessionIds: ["s1", "s2"] },
	{ workspaceId: "w2", path: "D:\\proj-b", title: "proj-b", createdAt: "2026-01-01T00:00:00.000Z", sessionIds: ["s3"] }
];
const noPendingInteractions = new Map();

test("bundle materializes with apply/inject and the __test surface", () => {
	assert.equal(typeof bundle.apply, "function");
	assert.deepEqual(bundle.inject, ["slots", "sessions", "workspaces", "locale", "remote", "typert"]);
	assert.equal(typeof t.sessionVisible, "function");
	assert.equal(typeof t.deriveGroups, "function");
	assert.equal(typeof t.deriveFlat, "function");
	assert.equal(typeof t.deriveSearchResults, "function");
	assert.equal(typeof t.displayTitle, "function");
	assert.equal(typeof t.isUnknownSessionError, "function");
	assert.equal(typeof t.archiveableWorkspaceSessionCount, "function");
	assert.equal(typeof t.archiveWorkspaceDialogTarget, "function");
	assert.equal(typeof t.archiveWorkspaceDialogFailureState, "function");
});

test("设置页批量恢复串行调用官方 unarchiveSession", async () => {
	const archived = ["s1", "s2", "s3"];
	const calls = [];
	const workspaces = {
		list: { getSnapshot: () => ({ archivedSessionIds: [...archived] }) },
		async unarchiveSession(id) {
			calls.push(id);
			const i = archived.indexOf(id);
			if (i !== -1) archived.splice(i, 1);
		}
	};
	const result = await t.unarchiveSessionsViaOfficial(workspaces, ["s1", "s1", "s3"], async () => {});
	assert.deepEqual(calls, ["s1", "s3"]);
	assert.deepEqual(result.unarchivedSessionIds, ["s1", "s3"]);
	assert.deepEqual(result.archivedSessionIds, ["s2"]);
});

test("restore prefers official unarchiveSession when the host provides it", async () => {
	const official = [];
	const remote = [];
	const unarchive = t.createUnarchiveSession({
		async unarchiveSession(id) {
			official.push(id);
		}
	}, () => ({
		async unarchiveSession(id) {
			remote.push(id);
			return { ok: true, value: { archivedSessionIds: [] } };
		}
	}));
	await unarchive("s1");
	assert.deepEqual(official, ["s1"]);
	assert.deepEqual(remote, []);
});

test("restore falls back to plugin remote unarchiveSession on older hosts", async () => {
	const archived = ["s1", "s2"];
	const remote = [];
	const unarchive = t.createUnarchiveSession({
		list: { getSnapshot: () => ({ archivedSessionIds: ["s1", "s2"] }) }
	}, () => ({
		async unarchiveSession(id) {
			remote.push(id);
			const i = archived.indexOf(id);
			if (i !== -1) archived.splice(i, 1);
			return { ok: true, value: { archivedSessionIds: [...archived] } };
		}
	}));
	await unarchive("s1");
	assert.deepEqual(remote, ["s1"]);
	assert.deepEqual(archived, ["s2"]);
});

test("legacy batch restore counts from the plugin remote set when the official snapshot lags", async () => {
	const archived = ["s1", "s2", "s3"];
	const remote = [];
	const workspaces = {
		list: { getSnapshot: () => ({ archivedSessionIds: ["s1", "s2", "s3"] }) }
	};
	const unarchive = t.createUnarchiveSession(workspaces, () => ({
		async unarchiveSession(id) {
			remote.push(id);
			const i = archived.indexOf(id);
			if (i !== -1) archived.splice(i, 1);
			return { ok: true, value: { archivedSessionIds: [...archived] } };
		}
	}));
	const result = await t.unarchiveSessionsViaOfficial(workspaces, ["s1", "s1", "s3"], async () => {}, unarchive);
	assert.deepEqual(remote, ["s1", "s3"]);
	assert.deepEqual(result.unarchivedSessionIds, ["s1", "s3"]);
	assert.deepEqual(result.archivedSessionIds, ["s2"]);
});

test("plugin remote restore surfaces host errors and missing registry", async () => {
	const missing = t.createUnarchiveSession({}, () => undefined);
	await assert.rejects(() => missing("s1"), /archive-manager remote service is unavailable/);
	const failed = t.createUnarchiveSession({}, () => ({
		async unarchiveSession() {
			return { ok: false, error: { message: "workspace locked" } };
		}
	}));
	await assert.rejects(() => failed("s1"), /workspace locked/);
});

test("设置页与侧栏批量归档串行调用官方 archiveSession", async () => {
	const archived = [];
	const calls = [];
	const workspaces = {
		list: { getSnapshot: () => ({ archivedSessionIds: [...archived] }) },
		async archiveSession(id) {
			calls.push(id);
			if (!archived.includes(id)) archived.push(id);
		}
	};
	const result = await t.archiveSessionsViaOfficial(workspaces, ["s1", "s1", "s2"], async () => {});
	assert.deepEqual(calls, ["s1", "s2"]);
	assert.deepEqual(result.archivedSessionIdsAdded, ["s1", "s2"]);
	assert.deepEqual(result.archivedSessionIds, ["s1", "s2"]);
});

test("batch archive stops on failure and leaves earlier sessions archived", async () => {
	const archived = [];
	const calls = [];
	const workspaces = {
		list: { getSnapshot: () => ({ archivedSessionIds: [...archived] }) },
		async archiveSession(id) {
			calls.push(id);
			if (id === "s2") throw new Error("host rejected s2");
			if (!archived.includes(id)) archived.push(id);
		}
	};
	await assert.rejects(
		() => t.archiveSessionsViaOfficial(workspaces, ["s1", "s2", "s3"], async () => {}),
		/host rejected s2/,
	);
	assert.deepEqual(calls, ["s1", "s2"]);
	assert.deepEqual(archived, ["s1"]);
});

test("legacy workspace view prefs migrate onto the archive-manager persist key", () => {
	const storage = new Map([
		["dsh.workspace.view.v5", JSON.stringify({ groupBy: "flat", orderBy: "title", groupExpansion: { w1: false } })],
	]);
	const migrated = t.migrateWorkspaceViewPersist({
		getItem: (key) => storage.get(key) ?? null,
		setItem: (key, value) => storage.set(key, value),
	});
	assert.equal(migrated, true);
	assert.equal(
		storage.get("dsh.archive-manager.workspace.view.v1"),
		JSON.stringify({ groupBy: "flat", orderBy: "title", groupExpansion: { w1: false } }),
	);
	assert.equal(
		t.migrateWorkspaceViewPersist({
			getItem: (key) => storage.get(key) ?? null,
			setItem: (key, value) => storage.set(key, value),
		}),
		false,
		"already-migrated prefs must not be overwritten",
	);
});

test("工作区没有可归档会话时不提供批量归档入口或确认框", () => {
	const workspace = { workspaceId: "w1", sessionIds: ["s1", "s1", "s2"] };
	assert.equal(t.archiveableWorkspaceSessionCount(workspace, []), 2);
	assert.equal(t.archiveableWorkspaceSessionCount(workspace, ["s1"]), 1);
	assert.equal(t.archiveableWorkspaceSessionCount(workspace, ["s1", "s2"]), 0);
	assert.equal(t.archiveWorkspaceDialogTarget([workspace], "w1", "项目", ["s1", "s2"]), null);
	assert.deepEqual(t.archiveWorkspaceDialogTarget([workspace], "w1", "项目", ["s1"]), {
		workspaceId: "w1",
		title: "项目",
		count: 1
	});
});

test("批量归档失败时保持确认框打开并显示错误", () => {
	const target = { workspaceId: "w1", title: "项目", count: 2 };
	const state = t.archiveWorkspaceDialogFailureState(target, new Error("host rejected"), (key, values) => `${key}: ${values.detail}`);
	assert.equal(state.target, target);
	assert.equal(state.archiving, false);
	assert.equal(state.error, "archives.archiveFailed: host rejected");
});

test("bundle resolves the current client-store and keeps the legacy fallback", () => {
	assert.equal(alphaRequests[0], "@deepseek-ai/dsh-client-store");
	assert.equal(alphaRequests.includes("@deepseek-ai/dsh-client-runtime/client"), false);
	assert.deepEqual(legacyRequests.slice(0, 2), [
		"@deepseek-ai/dsh-client-store",
		"@deepseek-ai/dsh-client-runtime/client"
	]);
	assert.equal(typeof bundle.__test.createWorkspaceViewStore().create, "function");
	assert.equal(typeof legacyBundle.__test.createWorkspaceViewStore().create, "function");
	assert.equal(bundle.__test.hasSplitClientStore, true);
	assert.equal(legacyBundle.__test.hasSplitClientStore, false);
});

test("manifest keeps one DSH peer range and both client contracts optional", () => {
	assert.equal(PACKAGE_MANIFEST.engines?.node, "^22.19.0 || >=24.0.0");
	assert.equal(PACKAGE_MANIFEST.packageManager, "pnpm@11.22.0");
	const dshPeerRanges = Object.entries(PACKAGE_MANIFEST.peerDependencies ?? {})
		.filter(([name]) => name.startsWith("@deepseek-ai/dsh-"))
		.map(([, range]) => range);
	const dshDevelopmentVersions = Object.entries(PACKAGE_MANIFEST.devDependencies ?? {})
		.filter(([name]) => name.startsWith("@deepseek-ai/dsh-"))
		.map(([, version]) => version);
	assert.ok(dshPeerRanges.length > 0);
	assert.equal(new Set(dshPeerRanges).size, 1);
	assert.equal(dshPeerRanges[0], "0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2 || 0.1.6-alpha.1");
	for (const version of ["0.1.0-rc.8", "0.1.1-rc.2", "0.1.2-rc.1", "0.1.5-rc.1", "0.1.5-rc.2", "0.1.6-alpha.1"]) {
		assert.ok(semver.satisfies(version, dshPeerRanges[0]), `peer 范围必须接纳已验证宿主 ${version}`);
	}
	for (const version of ["0.1.0-rc.5", "0.1.0-rc.9", "0.1.3-alpha.2", "0.1.5-rc.3", "0.1.5", "0.1.6-alpha.2", "0.1.6", "0.2.0"]) {
		assert.equal(semver.satisfies(version, dshPeerRanges[0]), false, `不接纳未声明版本 ${version}`);
	}
	assert.ok(dshDevelopmentVersions.length > 0);
	assert.deepEqual([...new Set(dshDevelopmentVersions)], ["0.1.6-alpha.1"]);
	assert.equal(PACKAGE_MANIFEST.peerDependenciesMeta?.["@deepseek-ai/dsh-client-store"]?.optional, true);
	assert.equal(PACKAGE_MANIFEST.peerDependenciesMeta?.["@deepseek-ai/dsh-client-runtime"]?.optional, true);
	assert.equal(PACKAGE_MANIFEST.dsh.client.inject.includes("@deepseek-ai/dsh-client-runtime"), false);
});

test("bindObservable preserves receiver-sensitive alpha store methods", () => {
	const source = {
		value: 42,
		getSnapshot() {
			return this.value;
		},
		subscribe(listener) {
			assert.equal(this, source);
			listener(this.value);
			return () => {};
		}
	};
	const bound = t.bindObservable(source);
	assert.equal(bound.getSnapshot(), 42);
	let observed;
	bound.subscribe((value) => { observed = value; });
	assert.equal(observed, 42);
});

test("侧栏注册的打开和分叉操作委托新版导航服务，并保留旧宿主回退", async () => {
	for (const modern of [true, false]) {
		const opened = [];
		const forked = [];
		const registrations = new Map();
		const navigation = modern ? {
			openSession: (id) => opened.push(id),
			forkSession: async (id) => { forked.push(id); }
		} : {};
		const ctx = {
			get: (name) => name === "uiWorkspace" ? navigation : void 0,
			sessions: {
				open: (id) => { assert.equal(modern, false); opened.push(id); },
				fork: async ({ sessionId }) => { assert.equal(modern, false); forked.push(sessionId); return "fork"; }
			},
			workspaces: {},
			slots: { inject: (name, callback) => name === "archiveManager.sidebar.directoryFlow" ? () => {} : callback(), register: (options) => registrations.set(options.name, options) },
			// 本测试只执行槽位接线；字典、观察器和自动选中由各自测试覆盖。
			effect() {}
		};
		const dispose = await bundle.apply(ctx);
		const actions = registrations.get("sidebar.workspaces").inject();
		actions.open("s1");
		await actions.forkSession("s1");
		assert.deepEqual(opened, modern ? ["s1"] : ["s1", "fork"]);
		assert.deepEqual(forked, ["s1"]);
		await dispose();
	}
});

test("displayTitle: SessionSummary 使用 displayTitle，包括未命名会话", () => {
	assert.equal(t.displayTitle(summary("s1"), (key) => key), "Title-s1");
	assert.equal(t.displayTitle(summary("s2", { displayTitle: "" }), (key) => key), "");
	assert.equal(t.displayTitle({ id: "s3", blank: false }, (key) => key), "");
});

test("sessionVisible: archived hidden by default, visible with showArchived", () => {
	const archived = new Set(["s2"]);
	assert.equal(t.sessionVisible(summary("s1"), void 0, archived, false), true);
	assert.equal(t.sessionVisible(summary("s2"), void 0, archived, false), false);
	assert.equal(t.sessionVisible(summary("s2"), void 0, archived, true), true);
	assert.equal(t.sessionVisible(summary("s2"), void 0, archived), false); // default undefined
	assert.equal(t.sessionVisible(summary("s9", { origin: "subagent" }), void 0, archived, true), false);
});

test("deriveGroups: archived rows appear in their workspace group with the archived flag when shown", () => {
	const archived = ["s2"];
	const view = { expandedGroups: ["w1", "w2"], showArchived: false };
	const hidden = t.deriveGroups(list, workspaces, archived, noPendingInteractions, view);
	const w1 = hidden.find((g) => g.workspaceId === "w1");
	assert.deepEqual(w1.sessions.map((s) => s.id), ["s1"]);
	const shown = t.deriveGroups(list, workspaces, archived, noPendingInteractions, { ...view, showArchived: true });
	const w1b = shown.find((g) => g.workspaceId === "w1");
	assert.deepEqual(w1b.sessions.map((s) => s.id), ["s1", "s2"]);
	assert.equal(w1b.sessions.find((s) => s.id === "s2").archived, true);
	assert.equal(w1b.sessions.find((s) => s.id === "s1").archived, false);
});

test("deriveFlat: showArchived toggles archived rows with the flag", () => {
	const archived = ["s2"];
	assert.deepEqual(t.deriveFlat(list, archived, noPendingInteractions, false).map((r) => r.id).sort(), ["s1", "s3"]);
	const rows = t.deriveFlat(list, archived, noPendingInteractions, true);
	assert.deepEqual(rows.map((r) => r.id).sort(), ["s1", "s2", "s3"]);
	assert.equal(rows.find((r) => r.id === "s2").archived, true);
});

test("derive* 从 ui-session 的 pendingInteractions Map 读取待处理交互", () => {
	const pending = new Map([
		["s1", { kind: "question" }],
		["s2", { kind: "approval" }],
		["s3", { kind: "unknown-kind" }]
	]);
	const view = { expandedGroups: ["w1", "w2"], showArchived: true };

	const groups = t.deriveGroups(list, workspaces, [], pending, view);
	assert.equal(groups.find((g) => g.workspaceId === "w1").sessions.find((s) => s.id === "s1").pendingInteraction, "question");

	const flat = t.deriveFlat(list, [], pending, true);
	assert.equal(flat.find((s) => s.id === "s2").pendingInteraction, "approval");
	assert.equal(flat.find((s) => s.id === "s3").pendingInteraction, void 0);

	const search = t.deriveSearchResults(list, workspaces, "Title", [], pending, { items: [], hasMore: false }, 50, true);
	assert.equal(search.items.find((s) => s.id === "s1").pendingInteraction, "question");
	assert.equal(search.items.find((s) => s.id === "s3").pendingInteraction, void 0);
});

test("deriveSearchResults: showArchived toggles archived matches with the flag", () => {
	const archived = ["s2"];
	const content = { items: [], hasMore: false };
	const base = { list, workspaces, query: "Title", archivedSessionIds: archived, content, limit: 50 };
	const hidden = t.deriveSearchResults(base.list, base.workspaces, base.query, base.archivedSessionIds, noPendingInteractions, base.content, base.limit, false);
	assert.deepEqual(hidden.items.map((r) => r.id).sort(), ["s1", "s3"]);
	const shown = t.deriveSearchResults(base.list, base.workspaces, base.query, base.archivedSessionIds, noPendingInteractions, base.content, base.limit, true);
	assert.deepEqual(shown.items.map((r) => r.id).sort(), ["s1", "s2", "s3"]);
	assert.equal(shown.items.find((r) => r.id === "s2").archived, true);
});

test("deriveSearchResults: 未分组会话按当前语言展示并可检索", () => {
	const ungrouped = summary("ungrouped", { title: "独立会话", cwd: void 0 });
	const listWithUngrouped = {
		current: void 0,
		ids: [ungrouped.id],
		byId: { [ungrouped.id]: ungrouped }
	};
	const result = t.deriveSearchResults(
		listWithUngrouped,
		[],
		"未分组",
		[],
		noPendingInteractions,
		{ items: [], hasMore: false },
		50,
		false,
		"未分组"
	);

	assert.deepEqual(result.items.map((item) => item.id), ["ungrouped"]);
	assert.equal(result.items[0].workspace, "未分组");
});

test("view store: showArchived default false, persists toggles, same store family as groupBy/orderBy", () => {
	const handle = t.createWorkspaceViewStore();
	const store = handle.create(void 0);
	assert.equal(store.getSnapshot().showArchived, false);
	store.actions.setShowArchived(true);
	assert.equal(store.getSnapshot().showArchived, true);
	store.actions.setShowArchived("yes");
	assert.equal(store.getSnapshot().showArchived, false); // coerced to boolean
	store.actions.setShowArchived(false);
	assert.equal(store.getSnapshot().showArchived, false);
	// same persistence family as the existing view prefs
	const spec = handle.spec;
	assert.equal(spec.persist, "dsh.archive-manager.workspace.view.v1");
	assert.equal(typeof spec.actions.setGroupBy, "function");
	assert.equal(typeof spec.actions.setShowArchived, "function");
});

test("isUnknownSessionError recognizes the stable delete token", () => {
	assert.equal(t.isUnknownSessionError(new Error("UNKNOWN_SESSION:session-1")), true);
	assert.equal(t.isUnknownSessionError(new Error("cannot archive session 'x': live sessions and session persistence hold no such session")), true);
	assert.equal(t.isUnknownSessionError(new Error("transcript directory remains")), false);
});

test("deriveArchivedGroups: 按工作区分组，重名工作区使用不同 key，未归入者进未分组", () => {
	const byId = {
		s1: summary("s1"),
		s2: summary("s2"),
		s3: summary("s3"),
		sub: summary("sub", { origin: "subagent", parentId: "s1" })
	};
	// 两个工作区同名 proj-a：title 相同但 workspaceId 不同。
	const items = [
		{ workspaceId: "w1", title: "proj-a", sessionIds: ["s1"] },
		{ workspaceId: "w2", title: "proj-a", sessionIds: ["s2"] }
	];
	const groups = t.deriveArchivedGroups(byId, items, ["s1", "s2", "s3", "sub"], "未分组");
	assert.deepEqual(groups.map((g) => g.key), ["w1", "w2", "__ungrouped__"]);
	assert.deepEqual(groups.map((g) => g.title), ["proj-a", "proj-a", "未分组"]);
	assert.deepEqual(groups[0].sessions.map((s) => s.id), ["s1"]);
	assert.deepEqual(groups[2].sessions.map((s) => s.id), ["s3"], "subagent 不进设置页列表");
	const keys = new Set(groups.map((g) => g.key));
	assert.equal(keys.size, groups.length, "分组 key 不得重复");
});

test("deriveArchivedGroups: 无归档会话的工作区不产出空分组", () => {
	const items = [
		{ workspaceId: "w1", title: "proj-a", sessionIds: ["s1"] },
		{ workspaceId: "w2", title: "proj-b", sessionIds: [] }
	];
	const groups = t.deriveArchivedGroups({ s1: summary("s1") }, items, ["s1"], "未分组");
	assert.deepEqual(groups.map((g) => g.key), ["w1"]);
});

test("indexSubagentDescendants stays local and counts uninterrupted lineage", () => {
	const descendants = t.indexSubagentDescendants({
		root: summary("root"),
		child: summary("child", { origin: "subagent", parentId: "root" }),
		grandchild: summary("grandchild", { origin: "subagent", parentId: "child", running: true }),
		fork: summary("fork", { origin: "fork", parentId: "root", running: true })
	});
	assert.deepEqual(descendants.get("root"), { count: 2, runningCount: 1 });
	assert.deepEqual(descendants.get("child"), { count: 1, runningCount: 1 });
	assert.equal(descendants.has("fork"), false);
});

test("sortArchivedGroups: 按更新、创建或字母顺序排列项目与组内会话且不改写输入", () => {
	const groups = [
		{ key: "w1", title: "zeta", sessions: [summary("a", { displayTitle: "Alpha", updatedAt: 10 }), summary("b", { displayTitle: "Beta", updatedAt: 30 })] },
		{ key: "w2", title: "alpha", sessions: [summary("c", { displayTitle: "Charlie", updatedAt: 20 })] }
	];
	const createdAtById = { a: 40, b: 10, c: 50 };
	const translate = (key) => key;

	const updated = t.sortArchivedGroups(groups, "updated", createdAtById, translate);
	assert.deepEqual(updated.map((group) => group.key), ["w1", "w2"]);
	assert.deepEqual(updated[0].sessions.map((session) => session.id), ["b", "a"]);

	const created = t.sortArchivedGroups(groups, "created", createdAtById, translate);
	assert.deepEqual(created.map((group) => group.key), ["w2", "w1"]);
	assert.deepEqual(created[1].sessions.map((session) => session.id), ["a", "b"]);

	const alphabetical = t.sortArchivedGroups(groups, "alphabetical", createdAtById, translate);
	assert.deepEqual(alphabetical.map((group) => group.key), ["w2", "w1"]);
	assert.deepEqual(alphabetical[1].sessions.map((session) => session.id), ["a", "b"]);
	assert.deepEqual(groups[0].sessions.map((session) => session.id), ["a", "b"], "原分组顺序保持不变");
});

test("deriveArchivedBatchIds: 按完整归档集合派生全部、项目和未分组批次", () => {
	const items = [
		{ workspaceId: "w1", title: "proj-a", sessionIds: ["s1", "s-missing"] },
		{ workspaceId: "w2", title: "proj-b", sessionIds: ["s2"] }
	];
	const archived = ["s1", "s-missing", "s2", "s3", "s1", ""];
	assert.deepEqual(t.deriveArchivedBatchIds(archived, items, { scope: "all" }), ["s1", "s-missing", "s2", "s3", ""], "客户端计数与宿主权威归档集合保持一致");
	assert.deepEqual(t.deriveArchivedBatchIds(archived, items, { scope: "workspace", workspaceId: "w1" }), ["s1", "s-missing"], "摘要未加载的项目会话仍计入批次");
	assert.deepEqual(t.deriveArchivedBatchIds(archived, items, { scope: "ungrouped" }), ["s3", ""], "异常空 ID 也由宿主批量清理路径处理");
	assert.deepEqual(t.deriveArchivedBatchIds(archived, items, { scope: "sessions", sessionIds: ["s3", "s1", "s1", "missing"] }), ["s1", "s3"], "显式多选仍按权威归档顺序派生");
});

test("archived selection helpers preserve cross-filter choices and prune stale sessions", () => {
	const groups = [
		{ sessions: [{ id: "s1" }, { id: "s2" }] },
		{ sessions: [{ id: "s2" }, { id: "s3" }] }
	];
	assert.deepEqual(t.archivedSessionIdsInGroups(groups), ["s1", "s2", "s3"]);
	assert.deepEqual(t.toggleArchivedSelection(["s1"], ["s2", "s3"], true), ["s1", "s2", "s3"]);
	assert.deepEqual(t.toggleArchivedSelection(["s1", "s2", "s3"], ["s2"], false), ["s1", "s3"]);
	assert.deepEqual(t.pruneArchivedSelection(["s3", "s1", "stale", "s1"], ["s1", "s2", "s3"]), ["s3", "s1"]);
});

test("archivedDeleteFeedback: skipped 会话不会计入删除成功数", () => {
	const translate = (key, params) => ({ key, params });
	const skippedOnly = t.archivedDeleteFeedback({
		deletedSessionIds: [],
		skippedSessionIds: ["stale"],
		failures: []
	}, translate);
	assert.deepEqual(skippedOnly, {
		kind: "notice",
		message: { key: "archives.deleteSkipped", params: { n: 1 } }
	});
	const mixed = t.archivedDeleteFeedback({
		deletedSessionIds: ["deleted"],
		skippedSessionIds: ["stale"],
		failures: [{ sessionId: "failed", message: "boom" }]
	}, translate);
	assert.deepEqual(mixed, {
		kind: "error",
		message: {
			key: "archives.deletePartial",
			params: { deleted: 1, skipped: 1, failed: 1, detail: "boom" }
		}
	});
});

function selectionToolbarProps(overrides = {}) {
	return { selectedCount: 5, hiddenCount: 3, allVisibleSelected: false, selectedVisibleCount: 2, visibleCount: 3, busy: false,
		t: (key, params = {}) => Object.entries(params).reduce((text, [name, value]) => text.replaceAll("{" + name + "}", String(value)), t.zh[key]),
		onToggle() {}, onClear() {}, onRestore() {}, onDelete() {}, ...overrides };
}

function toolbarElements(element) {
	if (!element || typeof element !== "object") return [];
	return [element, ...[element.props?.children].flat().flatMap(toolbarElements)];
}

test("选择栏仅在有选择时显示操作，跨筛选范围始终完整提示", () => {
	const empty = renderToStaticMarkup(t.ArchiveSelectionToolbar(selectionToolbarProps({ selectedCount: 0, hiddenCount: 0, selectedVisibleCount: 0 })));
	assert.match(empty, /全选当前筛选结果/);
	assert.doesNotMatch(empty, /<button|也将参与操作/);
	const selected = renderToStaticMarkup(t.ArchiveSelectionToolbar(selectionToolbarProps()));
	assert.match(selected, /已选 5 条/);
	assert.match(selected, /含当前未显示的 3 条，也将参与操作/);
	assert.doesNotMatch(selected, /恢复所选<|删除所选</);
	const visibleOnly = renderToStaticMarkup(t.ArchiveSelectionToolbar(selectionToolbarProps({ hiddenCount: 0 })));
	assert.doesNotMatch(visibleOnly, /也将参与操作/);
});

test("选择栏保留全选语义和操作回调，忙碌时禁用所有操作", () => {
	const calls = [];
	const props = selectionToolbarProps({ onToggle: value => calls.push(value), onClear: () => calls.push("clear"), onRestore: () => calls.push("restore"), onDelete: () => calls.push("delete") });
	const elements = toolbarElements(t.ArchiveSelectionToolbar(props));
	const checkbox = elements.find(el => typeof el.type === "function");
	assert.equal(checkbox.props.label, "全选当前筛选结果");
	assert.equal(checkbox.props.indeterminate, true);
	checkbox.props.onChange({ target: { checked: true } });
	for (const button of elements.filter(el => el.type === "button")) button.props.onClick();
	assert.deepEqual(calls, [true, "clear", "restore", "delete"]);
	const busy = toolbarElements(t.ArchiveSelectionToolbar({ ...props, busy: true }));
	assert.ok(busy.filter(el => el.type === "button" || typeof el.type === "function").every(el => el.props.disabled));
});

test("未归档列表排除已归档、子代理和空白占位，保留跨项目与未分组会话", () => {
	const byId = Object.fromEntries([
		summary("a"), summary("b"), summary("loose"), summary("old"), summary("child", {origin:"subagent"}), summary("blank", {blank:true})
	].map(item => [item.id, item]));
	assert.deepEqual(t.unarchivedSessionIds(byId, ["old"]), ["a", "b", "loose"]);
});
