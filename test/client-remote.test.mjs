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
import { loadClientStore } from "./helpers/client-store.mjs";

const requireFallback = createRequire(import.meta.url);
const statics = {};
for (const spec of ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis", "@deepseek-ai/dsh-client-ui-slots"]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
// alpha.3 typert-registry browser client requires zod at ModuleLoader materialize time.
{
	const registryRequire = createRequire(requireFallback.resolve("@deepseek-ai/dsh-typert-registry/package.json"));
	statics["zod"] = await import(pathToFileURL(registryRequire.resolve("zod")).href);
}
const clientStore = await loadClientStore();
statics[clientStore.id] = clientStore.exports;
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, { get: (t, p) => (typeof p === "string" ? (t[p] ??= () => null) : t[p]) });

globalThis.window = globalThis;
globalThis.document = { querySelector: () => null, createElement: () => ({ dataset: {}, style: {}, set textContent(v) {} }), head: { appendChild: () => {} }, baseURI: "http://127.0.0.1/" };
const factories = new Map();
window.__ModuleLoader__ = { load: (h) => { factories.set(h.id, h.factory); } };

async function loadBundle(pkg) {
	// packages export "./client"; alpha.3+ splits node/browser entrypoints.
	// This harness drives window.__ModuleLoader__, so prefer the browser bundle.
	const pkgJsonPath = requireFallback.resolve(`${pkg}/package.json`);
	const dir = pkgJsonPath.slice(0, -"/package.json".length);
	const manifest = JSON.parse(await (await import("node:fs/promises")).readFile(pkgJsonPath, "utf8"));
	const clientExport = manifest.exports?.["./client"];
	let rel = "lib/client.js";
	if (typeof clientExport === "string") rel = clientExport.replace(/^\.\//, "");
	else if (clientExport && typeof clientExport === "object") {
		const pick = clientExport.browser || clientExport.default || clientExport.node;
		if (typeof pick === "string") rel = pick.replace(/^\.\//, "");
	}
	await import(pathToFileURL(join(dir, rel)).href);
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
				: /workspaceRegistry\/search(?:Session|Archived)Content$/.test(endpoint) ? { items: [{ sessionId: "s1", seq: 0, snippet: "正文" }], failures: [] }
				: endpoint === "workspaceRegistry/previewArchivedSession" ? { sessionId: "s1", messages: [], hasEarlier: false, hasLater: false }
				: endpoint === "workspaceRegistry/cleanOrphanSubagents" ? { cleanedSessionIds: ["s1"], skippedSessionIds: [], failures: [] }
				: endpoint === "workspaceRegistry/scheduledSessionIds" ? { scheduledSessionIds: ["s2"] }
				: endpoint === "workspaceRegistry/favoriteSessions" || endpoint === "workspaceRegistry/setSessionFavorite" ? { favoriteSessionIds: ["s1"] }
				: endpoint === "workspaceRegistry/deleteArchivedSessions" ? { requestedSessionIds: ["s1"], deletedSessionIds: ["s1"], skippedSessionIds: [], failures: [] }
				: endpoint === "workspaceRegistry/archivedSessionMetadata" ? { items: [{ sessionId: "s1", createdAt: 1700000000000 }] }
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
		const result3 = await registry.deleteArchivedSessions({ scope: "all" });
		assert.deepEqual(result3, { ok: true, value: { requestedSessionIds: ["s1"], deletedSessionIds: ["s1"], skippedSessionIds: [], failures: [] } });
		assert.equal(calls[2].endpoint, "workspaceRegistry/deleteArchivedSessions");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[2].payload)), { args: { target: { scope: "all" } } });
		const result4 = await registry.archivedSessionMetadata();
		assert.deepEqual(result4, { ok: true, value: { items: [{ sessionId: "s1", createdAt: 1700000000000 }] } });
		assert.equal(calls[3].endpoint, "workspaceRegistry/archivedSessionMetadata");
		assert.deepEqual(JSON.parse(JSON.stringify(calls[3].payload)), { args: {} });
		assert.deepEqual(await registry.favoriteSessions(), { ok: true, value: { favoriteSessionIds: ["s1"] } });
		assert.equal(calls[4].endpoint, "workspaceRegistry/favoriteSessions");
		assert.deepEqual(await registry.setSessionFavorite({ sessionId: "s1", favorite: true }), { ok: true, value: { favoriteSessionIds: ["s1"] } });
		assert.deepEqual(JSON.parse(JSON.stringify(calls[5].payload)), { args: { input: { sessionId: "s1", favorite: true } } });
		for (const [method, input, expectedKey, paramName = "input"] of [
			["searchSessionContent", { sessionIds: ["s1"], query: "正文" }, "items"],
			["searchArchivedContent", { sessionIds: ["s1"], query: "正文" }, "items"],
			["previewArchivedSession", { sessionId: "s1", query: "正文" }, "messages"],
			["cleanOrphanSubagents", { sessionIds: ["s1"] }, "cleanedSessionIds", "target"],
		]) {
			const response = await registry[method](input);
			assert.equal(response.ok, true);
			assert.ok(Object.hasOwn(response.value, expectedKey));
			assert.equal(calls.at(-1).endpoint, `workspaceRegistry/${method}`);
			assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1).payload)), { args: { [paramName]: input } });
		}
		const zeroArgClean = await registry.cleanOrphanSubagents({});
		assert.equal(zeroArgClean.ok, true);
		assert.ok(Object.hasOwn(zeroArgClean.value, "cleanedSessionIds"));
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
			assert.equal(typeof ctx.remote.workspaceRegistry.deleteArchivedSessions, "function");
			assert.equal(typeof ctx.remote.workspaceRegistry.archivedSessionMetadata, "function");
		}
	});
	await fiber;
	await fiber.dispose();
});
