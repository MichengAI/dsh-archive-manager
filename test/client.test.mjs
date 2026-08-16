// dsh-archive-manager client bundle self-tests (node:test).
//
// 使用真实 client-runtime 模块实例化已归档会话管理客户端 bundle。
// bundle and the REAL static module table (react, cordis, ui-slots,
// ui-primitives, ...) resolved from the dsh flat module fallback through the
// test 目录的 `node_modules` junction。覆盖客户端自身的派生
// functions and store through its `__test` export.
import { test } from "node:test";
import assert from "node:assert/strict";
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

function materialize(id) {
	const factory = factories.get(id);
	if (factory === void 0) throw new Error(`no factory registered for ${id}`);
	const module = { exports: {} };
	const require = (spec) => {
		if (Object.hasOwn(statics, spec)) return statics[spec];
		const stripped = spec.endsWith("/client") ? spec.slice(0, -7) : spec;
		if (stripped !== id && factories.has(stripped)) return materialize(stripped);
		throw new Error(`smoke require miss: ${spec}`);
	};
	// The factory owns its own `module`/`exports` closure; its return value is
	// the authoritative exports object (mirrors the real loader).
	return factory(require, module, module.exports) ?? module.exports;
}

const RUNTIME_BUNDLE = fileURLToPath(new URL("../node_modules/@deepseek-ai/dsh-client-runtime/lib/client.js", import.meta.url));
const CLIENT_BUNDLE = fileURLToPath(new URL("../lib/client.js", import.meta.url));

await loadBundle(RUNTIME_BUNDLE);
const runtime = materialize("@deepseek-ai/dsh-client-runtime");
await loadBundle(CLIENT_BUNDLE);
const bundle = materialize("@michengai/dsh-archive-manager");

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
