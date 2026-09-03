import { access, cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const legacyDshVersion = "0.1.1-rc.2";
const isolatedRoot = await mkdtemp(join(tmpdir(), "dsh-archive-manager-legacy-"));
const windowsNpmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

function run(command, args, cwd) {
	return new Promise((resolveRun, rejectRun) => {
		const child = spawn(command, args, { cwd, stdio: "inherit" });
		child.once("error", rejectRun);
		child.once("exit", (code, signal) => {
			if (code === 0) return resolveRun();
			rejectRun(new Error(`兼容性验证命令失败：${command} ${args.join(" ")}，退出码 ${code ?? "无"}，信号 ${signal ?? "无"}`));
		});
	});
}

// 此夹具使用真实 rc.2 DomainFacility，并严格模拟其后端的同名域版本拒绝行为。
const fixture = String.raw`
import assert from "node:assert/strict";
import { Context, Service } from "@deepseek-ai/cordis";
import { DomainFacility } from "@deepseek-ai/dsh-storage-domain";
import {
	ArchiveProjectionCache,
	legacySafeProjectionCacheDomainSpec,
	projectionCacheStorageKey,
	safeProjectionCacheDomainSpec
} from "./projcache.js";

const units = new Map();
const backend = {
	kv: {
		async open(descriptor) {
			let state = units.get(descriptor.name);
			if (state === undefined) {
				state = { version: descriptor.version, tables: Object.fromEntries(descriptor.tables.map((table) => [table, {}])), global: null };
				units.set(descriptor.name, state);
			} else if (state.version !== descriptor.version) {
				throw new Error("unit '" + descriptor.name + "': stored version " + state.version + " != expected " + descriptor.version);
			}
			return {
				loadAll: async () => structuredClone(state),
				putRecord: async (table, key, value) => { state.tables[table][key] = structuredClone(value); },
				deleteRecord: async (table, key) => { delete state.tables[table][key]; },
				setGlobal: async (value) => { state.global = structuredClone(value); },
				close: async () => {}
			};
		}
	}
};

const ctx = new Context();
ctx.provide("storage", { backend: { get: (name) => {
	if (name !== "memory") throw new Error("意外的存储后端：" + name);
	return backend;
} } });
const storageDomain = new DomainFacility(ctx, { backend: "memory" });
ctx.provide("storageDomain", storageDomain);
ctx.provide("sessionProjections", {
	checkpoint: () => ({}),
	viewCheckpoint: (rows) => Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.val]))
});
ctx.provide("sessions", { get: () => undefined });

const sessionId = "im:qq:dm:1786974024109:AAFEA88ABD266D02959130D923C09741";
const oldDomain = await storageDomain.open(legacySafeProjectionCacheDomainSpec);
await oldDomain.table("sessions").put(projectionCacheStorageKey(sessionId), {
	sessionId,
	identity: { createdAt: 1700000000000, cwd: "D:\\project" },
	rows: { title: { ver: 1, seq: 9, val: "legacy v1 cache" } }
});
await oldDomain.close();

const cache = new ArchiveProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
await cache[Service.init]();
assert.equal(units.get("session_projcache_archive_manager").version, 1);
assert.equal(units.get("session_projcache_archive_manager_v2").version, 2);
assert.deepEqual(cache.recordFor(sessionId, { createdAt: 1700000000000, cwd: "D:\\project" }).rows, {
	title: { ver: 1, seq: 9, val: "legacy v1 cache" }
});
await storageDomain.closeAll();
console.log("DSH 0.1.1-rc.2 兼容性迁移验证通过");
`;

try {
	await writeFile(join(isolatedRoot, "package.json"), JSON.stringify({
		name: "dsh-archive-manager-legacy-compatibility",
		private: true,
		type: "module",
		dependencies: {
			"@deepseek-ai/cordis": "4.0.1",
			"@deepseek-ai/dsh-session-projection-cache": legacyDshVersion,
			"@deepseek-ai/dsh-storage": legacyDshVersion,
			"@deepseek-ai/dsh-storage-domain": legacyDshVersion
		}
	}, null, 2), "utf8");
	await cp(join(root, "lib", "projcache.js"), join(isolatedRoot, "projcache.js"));
	await cp(join(root, "lib", "tombstone.js"), join(isolatedRoot, "tombstone.js"));
	await writeFile(join(isolatedRoot, "verify.mjs"), fixture, "utf8");
	if (process.platform === "win32") {
		await access(windowsNpmCli);
		await run(process.execPath, [windowsNpmCli, "install", "--ignore-scripts", "--no-audit", "--no-fund"], isolatedRoot);
	} else {
		await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], isolatedRoot);
	}
	await run(process.execPath, ["verify.mjs"], isolatedRoot);
} finally {
	await rm(isolatedRoot, { recursive: true, force: true, maxRetries: 3 });
}
