// dsh-archive-manager client Remote integration test (node:test).
//
// Reproduces the reported browser failure "cannot get property
// remote.workspaceRegistry without inject": mounts the REAL client typert
// registry 与 api-gateway bundle，并在插件 fiber 中挂载归档管理
// contribution，验证
// that `ctx.get("remote.workspaceRegistry")` resolves and dispatches through
// `connection.rpc.call` — while the proxy property path indeed requires the
// service name in inject (and cannot be declared by the mounting fiber).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { join } from "node:path";
import { Context } from "@deepseek-ai/cordis";

const requireFallback = createRequire(import.meta.url);
const statics = {};
for (const spec of ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis", "@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-slots"]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, { get: (t, p) => (typeof p === "string" ? (t[p] ??= () => null) : t[p]) });

globalThis.window = globalThis;
globalThis.document = { querySelector: () => null, createElement: () => ({ dataset: {}, set textContent(v) {} }), head: { appendChild: () => {} } };
const factories = new Map();
window.__ModuleLoader__ = { load: (h) => { factories.set(h.id, h.factory); } };

async function loadBundle(pkg) {
	// packages export "./client" (or nothing); resolve the bundle file directly
	const pkgJson = requireFallback.resolve(`${pkg}/package.json`);
	const dir = pkgJson.slice(0, -"/package.json".length);
	await import(pathToFileURL(join(dir, "lib/client.js")).href);
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
	return factory(require, module, module.exports) ?? module.exports;
}

await loadBundle("@deepseek-ai/dsh-typert-registry");
await loadBundle("@deepseek-ai/dsh-api-gateway");
const typertClient = materialize("@deepseek-ai/dsh-typert-registry");
const gatewayClient = materialize("@deepseek-ai/dsh-api-gateway");
await import(pathToFileURL(fileURLToPath(new URL("../lib/client.js", import.meta.url))).href);
const archiveManager = materialize("@michengai/dsh-archive-manager");
const contribution = archiveManager.__test.ARCHIVE_MANAGER_REMOTE;

const calls = [];
const root = new Context();
root.provide("connection", {
	registerGenerationSource() {
		return () => {};
	},
	start() {
		return { stop() {} };
	},
	rpc: {
		async call(channel, endpoint, payload, signal) {
			calls.push({ channel, endpoint, payload, signal });
			const value = endpoint === "workspaceRegistry/deleteSession" ? { deleted: true }
				: endpoint === "workspaceRegistry/unarchiveSessions" ? { archivedSessionIds: ["s2"], unarchivedSessionIds: ["s1"] }
				: endpoint === "workspaceRegistry/deleteArchivedSessions" ? { requestedSessionIds: ["s1"], deletedSessionIds: ["s1"], skippedSessionIds: [], failures: [] }
				: endpoint === "workspaceRegistry/archivedSessionMetadata" ? { items: [{ sessionId: "s1", createdAt: 1700000000000 }], repairedSessionIds: ["s1"] }
				: { archivedSessionIds: ["s2"] };
			return { ok: true, value };
		}
	}
});
typertClient.apply(root);
gatewayClient.apply(root);

test("$mount registers the namespace; ctx.get resolves it and dispatches through connection.rpc.call", async () => {
	const fiber = root.plugin({
		inject: ["remote", "typert"],
		apply: async (ctx) => {
			await ctx.remote.$mount(contribution);
		}
	});
	await fiber;
	try {
		const registry = root.get("remote.workspaceRegistry");
		assert.ok(registry !== void 0, "namespace service resolves via ctx.get");
		const result = await registry.unarchiveSession("s1");
		assert.deepEqual(result, { ok: true, value: { archivedSessionIds: ["s2"] } });
		assert.equal(calls.length, 1);
		assert.equal(calls[0].channel, "/api");
		assert.equal(calls[0].endpoint, "workspaceRegistry/unarchiveSession");
		// the gateway builds args as a null-prototype object; compare JSON-normalized
		assert.deepEqual(JSON.parse(JSON.stringify(calls[0].payload)), { args: { sessionId: "s1" } });
		const result2 = await registry.deleteSession("s1");
		assert.deepEqual(result2, { ok: true, value: { deleted: true } });
		assert.equal(calls[1].endpoint, "workspaceRegistry/deleteSession");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[1].payload)), { args: { sessionId: "s1" } });
		const result3 = await registry.unarchiveSessions({ scope: "workspace", workspaceId: "w1" });
		assert.deepEqual(result3, { ok: true, value: { archivedSessionIds: ["s2"], unarchivedSessionIds: ["s1"] } });
		assert.equal(calls[2].endpoint, "workspaceRegistry/unarchiveSessions");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[2].payload)), { args: { target: { scope: "workspace", workspaceId: "w1" } } });
		const result4 = await registry.deleteArchivedSessions({ scope: "all" });
		assert.deepEqual(result4, { ok: true, value: { requestedSessionIds: ["s1"], deletedSessionIds: ["s1"], skippedSessionIds: [], failures: [] } });
		assert.equal(calls[3].endpoint, "workspaceRegistry/deleteArchivedSessions");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[3].payload)), { args: { target: { scope: "all" } } });
		const result5 = await registry.archivedSessionMetadata();
		assert.deepEqual(result5, { ok: true, value: { items: [{ sessionId: "s1", createdAt: 1700000000000 }], repairedSessionIds: ["s1"] } });
		assert.equal(calls[4].endpoint, "workspaceRegistry/archivedSessionMetadata");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[4].payload)), { args: {} });
	} finally {
		await fiber.dispose();
	}
});

test("proxy property path (ctx.remote.workspaceRegistry) without inject declares the missing-service error", async () => {
	const fiber = root.plugin({
		inject: ["remote", "typert"],
		apply: async (ctx) => {
			await ctx.remote.$mount(contribution);
			assert.throws(() => ctx.remote.workspaceRegistry, /without inject/);
		}
	});
	await fiber;
	await fiber.dispose();
});

test("proxy property path works when the service name is declared in inject (consumer pattern)", async () => {
	const fiber = root.plugin({
		inject: ["remote", "typert", "remote.workspaceRegistry"],
		apply: async (ctx) => {
			// a consumer fiber never mounts the contribution itself; here the
			// root-mounted namespace (previous tests) satisfies the inject
			assert.equal(typeof ctx.remote.workspaceRegistry.unarchiveSession, "function");
			assert.equal(typeof ctx.remote.workspaceRegistry.unarchiveSessions, "function");
			assert.equal(typeof ctx.remote.workspaceRegistry.deleteArchivedSessions, "function");
			assert.equal(typeof ctx.remote.workspaceRegistry.archivedSessionMetadata, "function");
		}
	});
	await fiber;
	await fiber.dispose();
});
