// dsh-archive-manager client bundle self-tests (node:test).
//
// 使用真实 legacy client-runtime，并模拟 0.1.2 拆分后的静态 client-store，
// 分别实例化已归档会话管理客户端 bundle。其余 static module table
// (react, cordis, ui-slots,
// ui-primitives, ...) resolved from the dsh flat module fallback through the
// test 目录的 `node_modules` junction。覆盖客户端自身的派生
// functions and store through its `__test` export.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
	"@deepseek-ai/dsh-client-ui-slots",
	"@deepseek-ai/dsh-client-web-react"
]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
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

const RUNTIME_BUNDLE = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh-client-runtime/lib/client.js", import.meta.url));
const CLIENT_BUNDLE = fileURLToPath(new URL("../lib/client.js", import.meta.url));
const PACKAGE_MANIFEST = JSON.parse(await readFile(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

await loadBundle(RUNTIME_BUNDLE);
const runtime = materialize("@deepseek-ai/dsh-client-runtime");
await loadBundle(CLIENT_BUNDLE);
const legacyRequests = [];
const legacyBundle = materialize("@michengai/dsh-archive-manager", { requests: legacyRequests });
const alphaRequests = [];
const bundle = materialize("@michengai/dsh-archive-manager", {
	requests: alphaRequests,
	staticModules: {
		...statics,
		"@deepseek-ai/dsh-client-store": { defineStore: runtime.defineStore }
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

test("bundle materializes with apply/inject and the __test surface", () => {
	assert.equal(typeof bundle.apply, "function");
	assert.deepEqual(bundle.inject, ["slots", "sessions", "workspaces", "locale", "remote", "typert"]);
	assert.equal(typeof t.sessionVisible, "function");
	assert.equal(typeof t.deriveGroups, "function");
	assert.equal(typeof t.deriveFlat, "function");
	assert.equal(typeof t.deriveSearchResults, "function");
	assert.equal(typeof t.displayTitle, "function");
	assert.equal(typeof t.isUnknownSessionError, "function");
});

test("bundle resolves the split alpha store first and falls back to the legacy runtime", () => {
	assert.equal(alphaRequests[0], "@deepseek-ai/dsh-client-store");
	assert.equal(alphaRequests.includes("@deepseek-ai/dsh-client-runtime/client"), false);
	assert.deepEqual(legacyRequests.slice(0, 2), [
		"@deepseek-ai/dsh-client-store",
		"@deepseek-ai/dsh-client-runtime/client"
	]);
	assert.equal(typeof legacyBundle.__test.createWorkspaceViewStore().create, "function");
	assert.equal(typeof bundle.__test.createWorkspaceViewStore().create, "function");
	assert.equal(legacyBundle.__test.hasSplitClientStore, false);
	assert.equal(bundle.__test.hasSplitClientStore, true);
});

test("manifest treats the removed legacy runtime as an optional fallback", () => {
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

test("provideUiWorkspace restores alpha navigation, archive, and directory capabilities", async () => {
	function observable(state) {
		const listeners = new Set();
		return {
			state,
			getSnapshot() { return this.state; },
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			set(next) {
				this.state = next;
				for (const listener of listeners) listener();
			}
		};
	}

	const workspaceList = observable({
		phase: "ready",
		items: [{ workspaceId: "w1", path: "D:\\proj-a", title: "proj-a", createdAt: "2026-01-01T00:00:00.000Z", sessionIds: [] }],
		archivedSessionIds: []
	});
	const sessionList = observable({ phase: "ready", current: "existing-session", ids: ["existing-session"], byId: { "existing-session": summary("existing-session") } });
	const opened = [];
	const archived = [];
	let cleared = 0;
	let created = 0;
	const roots = [];
	const effectDisposers = [];
	const services = new Map([
		["remote.directoryPicker", {
			pick: async () => ({ ok: true, value: "D:\\picked" }),
			list: async (path) => ({ ok: true, value: [{ path }] }),
			createDirectory: async (path, name) => ({ ok: true, value: `${path}\\${name}` })
		}]
	]);
	const ctx = {
		get: (name) => services.get(name),
		provide(name, value) {
			services.set(name, value);
			return () => services.delete(name);
		},
		sessions: {
			list: sessionList,
			async create({ workspaceId }) {
				created += 1;
				assert.equal(workspaceId, "w1");
				return "new-session";
			},
			open: (sessionId) => opened.push(sessionId),
			clear: () => { cleared += 1; }
		},
		workspaces: {
			list: workspaceList,
			archiveSession: async (sessionId) => {
				archived.push(sessionId);
				return sessionId;
			}
		},
		slots: { provideRoot: (root) => { roots.push(root); } },
		effect(factory) { effectDisposers.push(factory()); }
	};

	const dispose = t.provideUiWorkspace(ctx);
	const service = services.get("uiWorkspace");
	assert.ok(service);
	assert.equal(roots[0].hooks.workspaces, workspaceList);
	assert.deepEqual(await Promise.all([service.connectWorkspace("w1"), service.connectWorkspace("w1")]), ["new-session", "new-session"]);
	assert.equal(created, 1, "concurrent workspace connections share one session creation");
	service.startSession("w1");
	await new Promise((resolve) => setImmediate(resolve));
	assert.deepEqual(opened, ["new-session"]);
	assert.equal(await service.archiveSession("new-session"), "new-session");
	assert.deepEqual(archived, ["new-session"]);
	assert.equal(await service.pickDirectory(), "D:\\picked");
	assert.deepEqual(await service.listDirectory("D:\\proj-a"), [{ path: "D:\\proj-a" }]);
	assert.equal(await service.createDirectory("D:\\proj-a", "child"), "D:\\proj-a\\child");

	sessionList.set({ phase: "ready", current: "new-session", ids: ["new-session"], byId: { "new-session": summary("new-session") } });
	workspaceList.set({ ...workspaceList.getSnapshot(), archivedSessionIds: ["new-session"] });
	assert.equal(cleared, 1, "archiving the current session clears alpha navigation state");
	for (const stop of effectDisposers) stop();
	dispose();
	assert.equal(services.has("uiWorkspace"), false);
});

test("provideUiWorkspace leaves an existing host service untouched", () => {
	const existing = {};
	const ctx = { get: (name) => name === "uiWorkspace" ? existing : void 0 };
	const dispose = t.provideUiWorkspace(ctx);
	assert.equal(ctx.get("uiWorkspace"), existing);
	dispose();
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
	const hidden = t.deriveGroups(list, workspaces, archived, view);
	const w1 = hidden.find((g) => g.workspaceId === "w1");
	assert.deepEqual(w1.sessions.map((s) => s.id), ["s1"]);
	const shown = t.deriveGroups(list, workspaces, archived, { ...view, showArchived: true });
	const w1b = shown.find((g) => g.workspaceId === "w1");
	assert.deepEqual(w1b.sessions.map((s) => s.id), ["s1", "s2"]);
	assert.equal(w1b.sessions.find((s) => s.id === "s2").archived, true);
	assert.equal(w1b.sessions.find((s) => s.id === "s1").archived, false);
});

test("deriveFlat: showArchived toggles archived rows with the flag", () => {
	const archived = ["s2"];
	assert.deepEqual(t.deriveFlat(list, archived, false).map((r) => r.id).sort(), ["s1", "s3"]);
	const rows = t.deriveFlat(list, archived, true);
	assert.deepEqual(rows.map((r) => r.id).sort(), ["s1", "s2", "s3"]);
	assert.equal(rows.find((r) => r.id === "s2").archived, true);
});

test("deriveSearchResults: showArchived toggles archived matches with the flag", () => {
	const archived = ["s2"];
	const content = { items: [], hasMore: false };
	const base = { list, workspaces, query: "Title", archivedSessionIds: archived, content, limit: 50 };
	const hidden = t.deriveSearchResults(base.list, base.workspaces, base.query, base.archivedSessionIds, base.content, base.limit, false);
	assert.deepEqual(hidden.items.map((r) => r.id).sort(), ["s1", "s3"]);
	const shown = t.deriveSearchResults(base.list, base.workspaces, base.query, base.archivedSessionIds, base.content, base.limit, true);
	assert.deepEqual(shown.items.map((r) => r.id).sort(), ["s1", "s2", "s3"]);
	assert.equal(shown.items.find((r) => r.id === "s2").archived, true);
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
	assert.equal(spec.persist, "dsh.workspace.view.v5");
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
