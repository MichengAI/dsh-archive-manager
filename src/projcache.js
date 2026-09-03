import { createHash } from "node:crypto";
import { Service } from "@deepseek-ai/cordis";
import {
	SessionProjectionCache,
	checkpointIdentity,
	checkpointRecord,
	projectionCacheDomainSpec
} from "@deepseek-ai/dsh-session-projection-cache";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import { trackTombstone } from "./tombstone.js";

/**
 * 当前投影缓存写入独立的 v2 域，避免 DSH alpha.2 将包含冒号的逻辑会话 ID
 * 直接映射为 Windows 文件名。旧名 v1 与旧名 v2 域只在启动时读取并补缺迁入，
 * 迁移不删除原始缓存，任意中断都可在后续启动继续。
 */
const storedCheckpointRecord = checkpointRecord.extend({
	sessionId: checkpointIdentity.shape.cwd.unwrap()
});
const safeDomainInput = {
	// 旧版 DSH 不支持同名域的版本迁移。v2 改用新域名，确保升级时不会在
	// 打开目标域之前因旧 v1 元数据而终止启动。
	name: "session_projcache_archive_manager_v2",
	version: 2,
	tables: { sessions: domainTable(storedCheckpointRecord) },
	...(projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {})
};
const safeProjectionCacheDomainSpec = defineDomain(safeDomainInput);

/** The last official whole-file cache format used by DSH rc.2. */
const legacyOptionalIdentityFields = {};
for (const field of ["isSeeded", "inheritedEventCount"]) {
	// rc.2 的身份 schema 尚未定义这些字段；向 Zod 传入不存在的字段会在
	// 首次解析历史记录时抛错，因此只能按当前运行时实际的 schema 构造掩码。
	if (Object.hasOwn(checkpointIdentity.shape, field)) legacyOptionalIdentityFields[field] = true;
}
const legacyCheckpointRecord = checkpointRecord.extend({
	identity: checkpointIdentity.partial(legacyOptionalIdentityFields)
});
const legacyStoredCheckpointRecord = legacyCheckpointRecord.extend({
	sessionId: checkpointIdentity.shape.cwd.unwrap()
});
/** v0.1.24 短暂使用过的旧名 v2 安全缓存域。 */
const legacySafeV2ProjectionCacheDomainSpec = defineDomain({
	name: "session_projcache_archive_manager",
	version: 2,
	tables: { sessions: domainTable(storedCheckpointRecord) },
	...(projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {})
});
/** v0.1.23 及以前归档管理器自身使用的安全缓存域。 */
const legacySafeProjectionCacheDomainSpec = defineDomain({
	name: "session_projcache_archive_manager",
	version: 1,
	tables: { sessions: domainTable(legacyStoredCheckpointRecord) },
	...(projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {})
});
const legacyProjectionCacheDomainSpec = defineDomain({
	name: "session_projcache",
	version: 3,
	tables: { sessions: domainTable(legacyCheckpointRecord) }
});

function projectionCacheStorageKey(sessionId) {
	return `session_${createHash("sha256").update(sessionId, "utf8").digest("base64url")}`;
}

function unwrapStoredCheckpoint(stored) {
	return { identity: stored.identity, rows: stored.rows };
}

/** Map the Session-id table contract onto path-safe physical keys. */
class SafeSessionTable {
	constructor(table) {
		this.table = table;
	}
	get size() {
		return [...this.keys()].length;
	}
	get(sessionId) {
		const stored = this.table.get(projectionCacheStorageKey(sessionId));
		if (stored === void 0 || stored.sessionId !== sessionId) return void 0;
		return unwrapStoredCheckpoint(stored);
	}
	has(sessionId) {
		return this.get(sessionId) !== void 0;
	}
	*entries() {
		for (const [key, stored] of this.table.entries()) {
			if (projectionCacheStorageKey(stored.sessionId) !== key) continue;
			yield [stored.sessionId, unwrapStoredCheckpoint(stored)];
		}
	}
	*keys() {
		for (const [sessionId] of this.entries()) yield sessionId;
	}
	*values() {
		for (const [, value] of this.entries()) yield value;
	}
	async put(sessionId, record) {
		const key = projectionCacheStorageKey(sessionId);
		const existing = this.table.get(key);
		if (existing !== void 0 && existing.sessionId !== sessionId) {
			throw new Error(`projection-cache storage-key collision for "${sessionId}"`);
		}
		await this.table.put(key, { sessionId, identity: record.identity, rows: record.rows });
	}
	async delete(sessionId) {
		const key = projectionCacheStorageKey(sessionId);
		const existing = this.table.get(key);
		if (existing === void 0 || existing.sessionId !== sessionId) return false;
		return this.table.delete(key);
	}
}

async function readSourceRecords(ctx, spec, label) {
	let domain;
	try {
		domain = await ctx.storageDomain.open(spec);
		return { opened: true, records: [...domain.table("sessions").entries()] };
	} catch (error) {
		ctx.logger.warn(`archive-manager projcache: ${label} cache import skipped: ${String(error)}`);
		return { opened: false, records: [] };
	} finally {
		try {
			await domain?.close();
		} catch (error) {
			ctx.logger.warn(`archive-manager projcache: ${label} cache close failed: ${String(error)}`);
		}
	}
}

async function readLegacySafeRecords(ctx, spec, label) {
	const source = await readSourceRecords(ctx, spec, label);
	const records = [];
	for (const [physicalKey, stored] of source.records) {
		if (stored === null || typeof stored !== "object" || typeof stored.sessionId !== "string") {
			ctx.logger.warn(`archive-manager projcache: ${label} row "${physicalKey}" import skipped because its session id is invalid`);
			continue;
		}
		if (projectionCacheStorageKey(stored.sessionId) !== physicalKey) {
			ctx.logger.warn(`archive-manager projcache: ${label} row "${physicalKey}" import skipped because its storage key does not match the session id`);
			continue;
		}
		records.push([stored.sessionId, unwrapStoredCheckpoint(stored)]);
	}
	return { ...source, records };
}

/**
 * 旧版记录没有完整身份时，只能安全补齐未播种会话的零继承切点。
 * 播种会话无法从头部反推出精确切点，宁可跳过并按需重建。
 */
function normalizeLegacyRecord(record) {
	if (record === null || typeof record !== "object" || record.identity === null || typeof record.identity !== "object") return void 0;
	const identity = record.identity;
	const inheritedEventCount = identity.inheritedEventCount;
	const validOffset = Number.isSafeInteger(inheritedEventCount) && inheritedEventCount >= 0;
	if (identity.isSeeded === true) {
		if (!validOffset) return void 0;
		return record;
	}
	if (identity.isSeeded !== void 0 && identity.isSeeded !== false) return void 0;
	if (inheritedEventCount !== void 0 && inheritedEventCount !== 0) return void 0;
	return {
		...record,
		identity: {
			...identity,
			isSeeded: false,
			inheritedEventCount: 0
		}
	};
}

async function importMissingRecords(ctx, target, records, label) {
	let imported = 0;
	for (const [sessionId, record] of records) {
		if (target.has(sessionId)) continue;
		try {
			const normalized = normalizeLegacyRecord(record);
			if (normalized === void 0) {
				ctx.logger.warn(`archive-manager projcache: ${label} row "${sessionId}" import skipped because its lifecycle identity is incomplete`);
				continue;
			}
			await target.put(sessionId, normalized);
			imported += 1;
		} catch (error) {
			ctx.logger.warn(`archive-manager projcache: ${label} row "${sessionId}" import failed: ${String(error)}`);
		}
	}
	return imported;
}

/**
 * 合并归档管理器旧名 v2、旧名 v1、官方新版逐会话与旧版整文件缓存。目标域记录
 * 最高优先，随后按新旧顺序只补缺失记录；任一来源失败时仍继续尝试另一个来源。
 */
async function importPreviousProjectionCache(ctx, target) {
	const legacySafeV2 = await readLegacySafeRecords(ctx, legacySafeV2ProjectionCacheDomainSpec, "archive-manager v2");
	const legacySafe = await readLegacySafeRecords(ctx, legacySafeProjectionCacheDomainSpec, "archive-manager v1");
	const legacy = await readSourceRecords(ctx, legacyProjectionCacheDomainSpec, "legacy v3");
	const sameSpec = projectionCacheDomainSpec.version === legacyProjectionCacheDomainSpec.version
		&& projectionCacheDomainSpec.layout === legacyProjectionCacheDomainSpec.layout;
	let imported = 0;
	if (legacySafeV2.opened) imported += await importMissingRecords(ctx, target, legacySafeV2.records, "archive-manager v2");
	if (legacySafe.opened) imported += await importMissingRecords(ctx, target, legacySafe.records, "archive-manager v1");
	if (!sameSpec) {
		const current = await readSourceRecords(ctx, projectionCacheDomainSpec, "current");
		if (current.opened) imported += await importMissingRecords(ctx, target, current.records, "current");
	}
	if (legacy.opened) imported += await importMissingRecords(ctx, target, legacy.records, "legacy v3");
	return imported;
}
//#region lib/types/index.js
/**
 * dsh-archive-manager projcache 半边。
 *
 * `ArchiveProjectionCache` 继承上游 `SessionProjectionCache`，保留服务名
 * `sessionProjectionCache` 与 fail-soft 写路径，但写入独立、路径安全的
 * `session_projcache_archive_manager_v2` 域。旧名 v1 与 v2 域只在启动时
 * 读取并补缺迁入；归档管理的
 * `deleteSession` 增加三处守护：
 *
 * - `delete(id)` - 永久移除兼容域中该会话经 SHA-256 映射的缓存投影行，
 *   写入前先登记墓碑。
 * - `whenIdle()` - 全部在途公开写入落定后 resolve。
 * - 墓碑挡住已删除会话的写入：迟到的写入要么被直接拦截，要么在
 *   落定后补删自己的残留行，不会复活已删除的缓存条目。守护覆盖
 *   `write()`（dispose 写后路径）与 `put()`（rc.2 的 `putSoft` 最终调用
 *   它，alpha.2 的 `coldSnapshot` 则直接调用它），两代落盘路径都纳入
 *   `whenIdle` 跟踪。
 *
 * 默认导出是 Service 子类（与上游 `@deepseek-ai/dsh-session-projection-cache`
 * 包同形），profile 补丁可直接替换 `session-projection-cache` 服务行，
 * 无需其他接线改动。
 */
var ArchiveProjectionCache = class extends SessionProjectionCache {
	/** 已永久删除的会话：其投影缓存行不再允许写入。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	deletedSessionTombstoneLimit = 4096;
	/** 在途写入的队尾（只含已落定的 promise）。 */
	writeTail = Promise.resolve();
	constructor(ctx, config) {
		super(ctx, config);
	}
	/**
	 * Replace the official cache domain with the path-safe compatibility
	 * domain, then preserve the upstream listener/write implementation.
	 */
	async [Service.init]() {
		const domain = await this.ctx.storageDomain.open(safeProjectionCacheDomainSpec);
		this.ctx.effect(() => () => domain.close(), "sessionProjectionCache.domainClose");
		const table = new SafeSessionTable(domain.table("sessions"));
		this.table = table;
		await importPreviousProjectionCache(this.ctx, table);
		this.installWritePath();
	}
	/** 跟踪公开写入路径，避免依赖上游私有 `flushSoft` 的实现细节。 */
	write(session) {
		const task = this.writeCore(session);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	/**
	 * 墓碑正确性依赖：super.write(session) 一次整体写入，返回后不再有后续异步落盘。
	 * 若上游改成多阶段异步，(C) 补删会漏掉后续写入，deletedSessionIds 挡不住复活。
	 */
	async writeCore(session) {
		if (this.deletedSessionIds.has(session.id)) return;
		await super.write(session);
		if (this.deletedSessionIds.has(session.id)) await this.requireTable().delete(session.id);
	}
	/**
	 * 守住所有底层写入。rc.2 的冷读经 `putSoft -> put`，alpha.2 则
	 * 直接经 `put`；把墓碑与 whenIdle 跟踪放在这里可同时兼容两代实现。
	 */
	put(id, identity, rows) {
		// alpha.2 coldSnapshot unconditionally chains `.catch()` onto put().
		// A blocked write must therefore preserve the upstream Promise contract.
		if (this.deletedSessionIds.has(id)) return Promise.resolve();
		const task = this.putCore(id, identity, rows);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	async putCore(id, identity, rows) {
		await super.put(id, identity, rows);
		if (this.deletedSessionIds.has(id)) await this.requireTable().delete(id);
	}
	/** rc.2 公开的 fail-soft 辅助在 alpha.2 已移除；保留同形兼容入口。 */
	async putSoft(id, identity, rows, what) {
		const upstream = SessionProjectionCache.prototype.putSoft;
		if (typeof upstream === "function") return upstream.call(this, id, identity, rows, what);
		try {
			await this.put(id, identity, rows);
		} catch (error) {
			this.ctx.logger.warn(`session projection cache: ${what} for "${id}" failed (cache stays stale): ${String(error)}`);
		}
	}
	/**
	 * 全部被跟踪的在途写入落定后 resolve（含失败）。空闲缓存上调用立即返回。
	 * @returns 跟踪写入落定后的 resolution。
	 */
	whenIdle() {
		return this.writeTail;
	}
	/**
	 * 永久移除一个会话的缓存投影行。
	 * @param id - 要删除缓存行的会话。
	 * @returns 行删除完成后的 resolution。
	 */
	async delete(id) {
		trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, id, this.deletedSessionTombstoneLimit);
		await this.requireTable().delete(id);
	}
	/** 撤销墓碑（供测试与同 id 新生命周期复用路径使用）。 */
	clearTombstone(id) {
		this.deletedSessionIds.delete(id);
		const idx = this.deletedSessionOrder.indexOf(id);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
	}
};
//#endregion
export {
	ArchiveProjectionCache,
	ArchiveProjectionCache as default,
	SafeSessionTable,
	importPreviousProjectionCache,
	legacyProjectionCacheDomainSpec,
	legacySafeProjectionCacheDomainSpec,
	legacySafeV2ProjectionCacheDomainSpec,
	projectionCacheStorageKey,
	safeProjectionCacheDomainSpec
};
