// 在隔离宿主上验证官方缓存按需重建；插件不读取或迁移历史缓存。
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertIsolatedHost } from "../helpers/isolated-host.mjs";

assertIsolatedHost();
const { Context, Service } = await import("@deepseek-ai/cordis");
const { SessionStore } = await import("@deepseek-ai/dsh-session");
const { SessionProjectionRegistry } = await import("@deepseek-ai/dsh-session-projection");
const { titleProjectionDefinition } = await import("@deepseek-ai/dsh-session-title");
const { DomainFacility } = await import("@deepseek-ai/dsh-storage-domain");
const { JsonStorageBackend } = await import("@deepseek-ai/dsh-storage-json");
const { SessionProjectionCache, projectionCacheDomainSpec } = await import("@deepseek-ai/dsh-session-projection-cache");

for (const hasTitle of [true, false]) {
	test(`不迁移历史缓存，官方恢复${hasTitle ? "有标题" : "空白"}会话后重建并持久化缓存`, async (t) => {
		const root = await mkdtemp(join(tmpdir(), "dsh-am-native-cache-"));
		const ctx = new Context();
		const backend = new JsonStorageBackend(root);
		ctx.provide("storage", { backend: { get: () => backend } });
		const domains = new DomainFacility(ctx, { backend: "json" });
		ctx.provide("storageDomain", domains);
		const sessions = new SessionStore(ctx);
		const projections = new SessionProjectionRegistry(ctx);
		projections.register(titleProjectionDefinition);
		t.after(async () => {
			await domains.closeAll();
			await backend.close();
			await rm(root, { recursive: true, force: true });
		});
		// 无效历史文件也不能影响启用；只作为遗留磁盘数据，不重新声明旧域契约。
		const oldFiles = [];
		for (const name of ["session_projcache_archive_manager", "session_projcache_archive_manager_v2"]) {
			const directory = join(root, name, "sessions");
			await mkdir(directory, { recursive: true });
			const file = join(directory, "legacy.json");
			await writeFile(file, "不应被读取的历史缓存", "utf8");
			oldFiles.push(file);
		}
		const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
		await cache[Service.init]();
		const id = "native-rebuild";
		const header = { id, version: 4, createdAt: 42, isSeeded: false };
		assert.equal(cache.cachedSnapshot(header), undefined);
		const events = hasTitle ? [{ type: "session/title", seq: 0, time: 43, data: {
			title: "会话日志中的标题", messageSeqs: [], source: { kind: "user" },
		} }] : [];
		const session = sessions.create(id, { seed: events, meta: header, inheritedEventCount: 0 });
		const expected = hasTitle ? "会话日志中的标题" : null;
		assert.equal(projections.snapshot(session).values.title, expected);
		// session/created 触发官方异步落盘；等待该原生路径，不主动调用 cache.put/write。
		await assert.doesNotReject(async () => {
			for (let attempt = 0; attempt < 100; attempt += 1) {
				if (cache.cachedSnapshot(header)?.values.title === expected) return;
				await new Promise(resolve => setTimeout(resolve, 10));
			}
			assert.fail("官方会话创建事件未重建缓存");
		});
		const officialFile = join(root, projectionCacheDomainSpec.name, "sessions", `${id}.json`);
		let document;
		for (let attempt = 0; attempt < 100; attempt += 1) {
			try {
				document = JSON.parse(await readFile(officialFile, "utf8"));
				if (document.record.rows.title.val === expected) break;
			} catch {}
			await new Promise(resolve => setTimeout(resolve, 10));
		}
		assert.equal(document?.record.rows.title.val, expected, "官方写入应持久化到缓存表");
		await domains.get(projectionCacheDomainSpec.name).close();
		const reopened = await domains.open(projectionCacheDomainSpec);
		assert.equal(reopened.table("sessions").get(id).rows.title.val, expected);
		for (const file of oldFiles) assert.equal(await readFile(file, "utf8"), "不应被读取的历史缓存");
	});
}
