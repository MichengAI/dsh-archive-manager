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
const storedCheckpointRecord = checkpointRecord.extend({
  sessionId: checkpointIdentity.shape.cwd.unwrap()
});
const safeDomainInput = {
  // 旧版 DSH 不支持同名域的版本迁移。v2 改用新域名，确保升级时不会在
  // 打开目标域之前因旧 v1 元数据而终止启动。
  name: "session_projcache_archive_manager_v2",
  version: 2,
  tables: { sessions: domainTable(storedCheckpointRecord) },
  ...projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {}
};
const safeProjectionCacheDomainSpec = defineDomain(safeDomainInput);
const legacyOptionalIdentityFields = {};
for (const field of ["isSeeded", "inheritedEventCount"]) {
  if (Object.hasOwn(checkpointIdentity.shape, field)) legacyOptionalIdentityFields[field] = true;
}
const legacyCheckpointRecord = checkpointRecord.extend({
  identity: checkpointIdentity.partial(legacyOptionalIdentityFields)
});
const legacyStoredCheckpointRecord = legacyCheckpointRecord.extend({
  sessionId: checkpointIdentity.shape.cwd.unwrap()
});
const legacySafeV2ProjectionCacheDomainSpec = defineDomain({
  name: "session_projcache_archive_manager",
  version: 2,
  tables: { sessions: domainTable(storedCheckpointRecord) },
  ...projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {}
});
const legacySafeProjectionCacheDomainSpec = defineDomain({
  name: "session_projcache_archive_manager",
  version: 1,
  tables: { sessions: domainTable(legacyStoredCheckpointRecord) },
  ...projectionCacheDomainSpec.layout === "per-record" ? { layout: "per-record" } : {}
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
async function importPreviousProjectionCache(ctx, target) {
  const legacySafeV2 = await readLegacySafeRecords(ctx, legacySafeV2ProjectionCacheDomainSpec, "archive-manager v2");
  const legacySafe = await readLegacySafeRecords(ctx, legacySafeProjectionCacheDomainSpec, "archive-manager v1");
  const legacy = await readSourceRecords(ctx, legacyProjectionCacheDomainSpec, "legacy v3");
  const sameSpec = projectionCacheDomainSpec.version === legacyProjectionCacheDomainSpec.version && projectionCacheDomainSpec.layout === legacyProjectionCacheDomainSpec.layout;
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
export {
  ArchiveProjectionCache,
  SafeSessionTable,
  ArchiveProjectionCache as default,
  importPreviousProjectionCache,
  legacyProjectionCacheDomainSpec,
  legacySafeProjectionCacheDomainSpec,
  legacySafeV2ProjectionCacheDomainSpec,
  projectionCacheStorageKey,
  safeProjectionCacheDomainSpec
};
