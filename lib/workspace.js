import { lstat, rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { trackTombstone } from "./tombstone.js";
import { defineDomain } from "@deepseek-ai/dsh-storage-domain";
import { favoriteInputSchema, favoriteStateSchema, favoriteInvocations } from "./archive-organizer.js";
const favoriteDomainSpec = defineDomain({
  name: "archive_manager_favorites",
  version: 1,
  tables: {},
  global: { schema: favoriteStateSchema, initial: { favoriteSessionIds: [] } }
});
function jsonlSessionDirectory(persistence, header, location) {
  if (persistence.name !== "session-persistence-jsonl" || location.kind !== "jsonl")
    return;
  const root = persistence.root ?? persistence.config?.root;
  if (typeof root !== "string" || !isAbsolute(root) || !isAbsolute(location.path))
    return;
  if (!/^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/.test(
    basename(location.path)
  ))
    return;
  if (typeof header.id !== "string" || header.id.length === 0) return;
  const encode = (text) => text.replace(
    /[^A-Za-z0-9._-]/g,
    (ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`
  );
  const segment = header.id === "." ? "~002E" : header.id === ".." ? "~002E~002E" : encode(header.id);
  let project = "_no-cwd";
  if (header.cwd !== void 0) {
    if (typeof header.cwd !== "string" || header.cwd.length === 0) return;
    const readable = encode(header.cwd.replace(/[\\/:]+/g, "-")).replace(/^-+/, "") || "root";
    project = `--${readable.slice(0, 251)}--`;
  }
  const directory = join(resolve(root), project, segment);
  if (location.path !== join(directory, basename(location.path))) return;
  return directory;
}
function strictCodec(typeSymbol, schema) {
  return {
    mode: "strict",
    typeSymbol,
    create: () => schema,
    schema
  };
}
function markRemoteMethod(instance, method) {
  const context = {
    private: false,
    static: false,
    name: method,
    addInitializer(fn) {
      fn.call(instance);
    }
  };
  Remote(method)(void 0, context);
}
function headerIdentity(header) {
  return {
    createdAt: header.createdAt,
    cwd: header.cwd ?? null
  };
}
const sessionIdSchema = {
  parse(value) {
    if (typeof value !== "string" || value.length === 0)
      throw new TypeError(
        `sessionId must be a non-empty string, got ${String(value)}`
      );
    return value;
  }
};
const archivedSetSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new TypeError("result must be an object");
    const ids = value.archivedSessionIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
      throw new TypeError("archivedSessionIds must be a string array");
    return value;
  }
};
const deletedSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true)
      throw new TypeError("deleted must be true");
    return value;
  }
};
const archivedBatchTargetSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new TypeError("target must be an object");
    if (value.scope === "all" || value.scope === "ungrouped") return value;
    if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0)
      return value;
    if (value.scope === "sessions" && Array.isArray(value.sessionIds) && value.sessionIds.length > 0 && value.sessionIds.every((id) => typeof id === "string" && id.length > 0))
      return value;
    throw new TypeError(
      "target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds"
    );
  }
};
const deletedBatchSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new TypeError("result must be an object");
    for (const key of [
      "requestedSessionIds",
      "deletedSessionIds",
      "skippedSessionIds"
    ]) {
      if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string"))
        throw new TypeError(`${key} must be a string array`);
    }
    if (!Array.isArray(value.failures) || value.failures.some(
      (failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string"
    ))
      throw new TypeError("failures must contain sessionId/message objects");
    return value;
  }
};
const archivedSessionMetadataSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items))
      throw new TypeError("result.items must be an array");
    if (value.items.some(
      (item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt)
    ))
      throw new TypeError("items must contain sessionId/createdAt objects");
    if (value.repairedSessionIds !== void 0 && (!Array.isArray(value.repairedSessionIds) || value.repairedSessionIds.some((id) => typeof id !== "string")))
      throw new TypeError("repairedSessionIds must be a string array");
    return value;
  }
};
const ARCHIVE_MANAGER_INVOCATIONS = [
  ...favoriteInvocations(),
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "unarchiveSession",
    invocation: { kind: "direct" },
    parameters: [
      {
        name: "sessionId",
        wire: "sessionId",
        source: "json",
        codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
      }
    ],
    result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionIds", archivedSetSchema),
    sourceLocation: {
      file: "@michengai/dsh-archive-manager/lib/workspace.js",
      line: 1,
      column: 1
    }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "deleteSession",
    invocation: { kind: "direct" },
    parameters: [
      {
        name: "sessionId",
        wire: "sessionId",
        source: "json",
        codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
      }
    ],
    result: strictCodec("@michengai/dsh-archive-manager/types#Deleted", deletedSchema),
    sourceLocation: {
      file: "@michengai/dsh-archive-manager/lib/workspace.js",
      line: 1,
      column: 1
    }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteArchivedSessions",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "deleteArchivedSessions",
    invocation: { kind: "direct" },
    parameters: [
      {
        name: "target",
        wire: "target",
        source: "json",
        codec: strictCodec("@michengai/dsh-archive-manager/types#ArchivedBatchTarget", archivedBatchTargetSchema)
      }
    ],
    result: strictCodec("@michengai/dsh-archive-manager/types#DeletedBatch", deletedBatchSchema),
    sourceLocation: {
      file: "@michengai/dsh-archive-manager/lib/workspace.js",
      line: 1,
      column: 1
    }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "archivedSessionMetadata",
    invocation: { kind: "direct" },
    parameters: [],
    result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionMetadata", archivedSessionMetadataSchema),
    sourceLocation: {
      file: "@michengai/dsh-archive-manager/lib/workspace.js",
      line: 1,
      column: 1
    }
  }
];
const ARCHIVE_MANAGER_TYPERT = {
  package: "@michengai/dsh-archive-manager",
  face: "host",
  schemas: [],
  model: { services: [], events: [], objects: [] },
  invocations: ARCHIVE_MANAGER_INVOCATIONS
};
function registerHostRemote(ctx) {
  const existing = ctx.get("typert");
  if (existing !== void 0) {
    existing.register(ARCHIVE_MANAGER_TYPERT);
    return;
  }
  ctx.inject(["typert"], (typertCtx) => {
    typertCtx.typert.register(ARCHIVE_MANAGER_TYPERT);
  });
}
var ArchiveWorkspaceRegistry = class extends WorkspaceRegistry {
  static inject = [
    "storageDomain",
    "sessionPersistence",
    "sessionProjectionCache",
    "typert"
  ];
  /** 本进程内已物理删除的会话；阻止父类把 stale list() 重新编入索引。 */
  deletedSessionIds = /* @__PURE__ */ new Set();
  /** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
  deletedSessionOrder = [];
  /** 墓碑上限：足够挡住 stale list()，又避免长驻进程无限增长。 */
  deletedSessionTombstoneLimit = 4096;
  /** 被删生命周期的日志身份（createdAt/cwd）：冷复用探针区分“同 id 新会话”与 stale list() 的依据。 */
  deletedIdentities = /* @__PURE__ */ new Map();
  archivedSessionPathIndex = /* @__PURE__ */ new Map();
  archivedSessionPathIndexKey;
  constructor(ctx) {
    super(ctx);
    const indexedPath = this.host.sessionPath;
    this.host.sessionPath = (id) => {
      const path = indexedPath(id);
      if (path !== void 0) return path;
      if (this.invalidSessionPaths.has(id)) return void 0;
      try {
        return this.archivedWorkspacePath(id);
      } catch {
        return void 0;
      }
    };
    this.typertRemote = bindTypertRemote(this, this.name);
    markRemoteMethod(this, "unarchiveSession");
    markRemoteMethod(this, "deleteSession");
    markRemoteMethod(this, "deleteArchivedSessions");
    markRemoteMethod(this, "archivedSessionMetadata");
    markRemoteMethod(this, "favoriteSessions");
    markRemoteMethod(this, "setSessionFavorite");
    registerHostRemote(this.ctx);
  }
  /** 独立收藏域不改变官方工作区数据结构；旧版本回退时可保留收藏。 */
  async favoriteDomain() {
    if (!this.favoriteDomainPromise) {
      this.favoriteDomainPromise = this.ctx.storageDomain.open(favoriteDomainSpec).then((domain) => {
        this.ctx.effect(() => () => domain.close(), "archive-manager: \u6536\u85CF\u5B58\u50A8\u5173\u95ED");
        return domain;
      }).catch((error) => {
        this.favoriteDomainPromise = void 0;
        throw error;
      });
    }
    return this.favoriteDomainPromise;
  }
  /** 返回宿主保存的收藏；读取时清理已确认不存在的会话。 */
  async favoriteSessions() {
    return this.enqueueOperation(async () => {
      const domain = await this.favoriteDomain();
      const state = favoriteStateSchema.parse(domain.global.get());
      const kept = [];
      for (const id of state.favoriteSessionIds) if (await this.sessionKnown(id)) kept.push(id);
      if (kept.length !== state.favoriteSessionIds.length) await domain.global.set({ favoriteSessionIds: kept });
      return { favoriteSessionIds: kept };
    });
  }
  /** 设置单条收藏，串行写入避免不同浏览器相互覆盖。 */
  async setSessionFavorite(input) {
    const { sessionId, favorite } = favoriteInputSchema.parse(input);
    return this.enqueueOperation(async () => {
      if (favorite && !await this.sessionKnown(sessionId)) throw new Error("\u4F1A\u8BDD\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6536\u85CF");
      const domain = await this.favoriteDomain();
      const state = favoriteStateSchema.parse(domain.global.get());
      const ids = new Set(state.favoriteSessionIds);
      if (favorite) ids.add(sessionId);
      else ids.delete(sessionId);
      const next = favoriteStateSchema.parse({ favoriteSessionIds: [...ids] });
      await domain.global.set(next);
      return next;
    });
  }
  /** 归档集合未变时复用反查表，避免每次 sessionPath 都扫全部工作区记账。 */
  archivedWorkspacePath(sessionId) {
    const state = this.requireState();
    if (!state.archivedSessionIds.includes(sessionId)) return void 0;
    if (this.archivedSessionPathIndexKey !== state.archivedSessionIds) {
      const index = /* @__PURE__ */ new Map();
      const archived = new Set(state.archivedSessionIds);
      const table = this.requireTable();
      for (const workspaceId of state.workspaceIds) {
        const record = table.get(workspaceId);
        if (record === void 0) continue;
        for (const id of record.sessionIds) {
          if (archived.has(id)) index.set(id, record.path);
        }
      }
      this.archivedSessionPathIndex = index;
      this.archivedSessionPathIndexKey = state.archivedSessionIds;
    }
    return this.archivedSessionPathIndex.get(sessionId);
  }
  /**
   * 只有 persistence.stat 明确说文件不在时才从持久集合摘掉。
   * list/header 读不出不等于文件没了；没有 stat 时宁可不落盘删除。
   */
  async sessionArtifactMissing(sessionId) {
    const persistence = this.ctx.get("sessionPersistence");
    if (typeof persistence?.stat !== "function") return false;
    try {
      return await persistence.stat(sessionId) === void 0;
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: could not stat archived session "${sessionId}": ${String(error)}`
      );
      return false;
    }
  }
  /**
   * 从归档集合摘掉已经确认不存在的会话。打开归档列表时调用。
   * 读不出头部的标记留在持久集合里，只从本次元数据结果里隐藏。
   */
  async pruneUnknownArchivedSessionIds() {
    return this.enqueueOperation(async () => {
      const state = this.requireState();
      const listed = /* @__PURE__ */ new Set();
      for (const item of await this.listStoredHeaders()) {
        const header = item.header ?? item;
        if (typeof header?.id === "string") listed.add(header.id);
      }
      const sessions = this.ctx.get("sessions");
      const kept = [];
      const seen = /* @__PURE__ */ new Set();
      for (const sessionId of state.archivedSessionIds) {
        if (seen.has(sessionId)) continue;
        seen.add(sessionId);
        if (sessions?.get(sessionId) !== void 0) {
          kept.push(sessionId);
          continue;
        }
        if (this.deletedSessionIds.has(sessionId)) {
          if (await this.coldReuseKnown(sessionId)) kept.push(sessionId);
          continue;
        }
        if (this.headers.has(sessionId) || listed.has(sessionId)) {
          kept.push(sessionId);
          continue;
        }
        if (!await this.sessionArtifactMissing(sessionId)) kept.push(sessionId);
      }
      if (kept.length === state.archivedSessionIds.length && kept.every((id, index) => id === state.archivedSessionIds[index]))
        return kept;
      await this.setState({ ...state, archivedSessionIds: kept });
      return kept;
    });
  }
  /**
   * 归档设置页创建时间排序所需的最小元数据。老用户可能仍有会话原文和
   * 归档标记、却没有投影缓存；这里按需从完整日志重建一次，再通知客户端
   * 刷新会话列表。已有缓存不读原文，新老 DSH 的缓存布局都走同一 put。
   * 读取前只清掉文件已确认不存在的归档标记。
   */
  async archivedSessionMetadata() {
    await this.pruneUnknownArchivedSessionIds();
    const items = [];
    const repairedSessionIds = [];
    for (const sessionId of this.requireState().archivedSessionIds) {
      try {
        const header = await this.readSessionHeader(sessionId);
        if (await this.repairArchivedProjection(header))
          repairedSessionIds.push(sessionId);
        if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt))
          items.push({ sessionId, createdAt: header.createdAt });
      } catch (error) {
        this.ctx.logger.warn(
          `archive-manager: could not read creation time for archived session "${sessionId}": ${String(error)}`
        );
      }
    }
    return {
      items,
      ...repairedSessionIds.length === 0 ? {} : { repairedSessionIds }
    };
  }
  /** 从会话原文补齐缺失的派生缓存；任何失败都只降级为原有无摘要列表。 */
  async repairArchivedProjection(header) {
    const cache = this.ctx.get("sessionProjectionCache");
    const persistence = this.ctx.get("sessionPersistence");
    const projections = this.ctx.get("sessionProjections");
    if (cache === void 0 || typeof cache.cachedSnapshot !== "function" || typeof cache.put !== "function")
      return false;
    if (persistence === void 0 || typeof persistence.readFrom !== "function" && typeof persistence.open !== "function" || projections === void 0 || typeof projections.restore !== "function")
      return false;
    try {
      if (!header.isSeeded && cache.cachedSnapshot(header, 0) !== void 0)
        return false;
      const stored = await this.readStoredProjectionSource(persistence, header.id);
      const meta = stored.meta ?? header;
      if (meta.isSeeded === true && stored.inheritedEventCount === void 0) {
        this.ctx.logger.warn(
          `archive-manager: projection repair for seeded archived session "${header.id}" skipped because its inherited event count is unavailable`
        );
        return false;
      }
      const inheritedEventCount = stored.inheritedEventCount ?? 0;
      if (meta.isSeeded !== true && inheritedEventCount !== 0) {
        this.ctx.logger.warn(
          `archive-manager: projection repair for unseeded archived session "${header.id}" skipped because its inherited event count is not zero`
        );
        return false;
      }
      if (cache.cachedSnapshot(meta, inheritedEventCount) !== void 0) return false;
      const restored = projections.restore(
        {},
        stored.events,
        0,
        meta,
        inheritedEventCount
      );
      if (restored === void 0 || typeof restored !== "object" || restored.checkpoint === void 0)
        return false;
      await cache.put(
        header.id,
        {
          // 支持的宿主头部均有 version；新版缓存校验格式代际，旧版逐字段比较忽略此键。
          formatVersion: meta.version,
          createdAt: meta.createdAt,
          ...meta.cwd === void 0 ? {} : { cwd: meta.cwd },
          isSeeded: meta.isSeeded ?? false,
          inheritedEventCount
        },
        restored.checkpoint
      );
      return true;
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: projection repair for archived session "${header.id}" failed: ${String(error)}`
      );
      return false;
    }
  }
  /** 新版读句柄必须关闭；旧版仍沿用 readFrom，避免激活 Agent 或写入会话日志。 */
  async readStoredProjectionSource(persistence, sessionId) {
    if (typeof persistence.readFrom === "function")
      return persistence.readFrom(sessionId, 0);
    const handle = await persistence.open(sessionId, "read");
    try {
      const { events } = await handle.read(0);
      return {
        meta: handle.header,
        inheritedEventCount: handle.inheritedEventCount,
        events
      };
    } finally {
      await handle.close();
    }
  }
  /**
   * 把一个已知会话加入注册表全局归档集合。已归档的 id 不写入；
   * 未知 id 直接跳过，不抛 `UNKNOWN_SESSION`，避免把幽灵 id 写进集合。
   * @param sessionId - 要归档的会话。
   */
  async archiveSession(sessionId) {
    return this.enqueueOperation(async () => {
      if (this.requireState().archivedSessionIds.includes(sessionId)) return;
      if (!await this.sessionKnown(sessionId)) return;
      const state = this.requireState();
      await this.setState({
        ...state,
        archivedSessionIds: [...state.archivedSessionIds, sessionId]
      });
    });
  }
  /**
   * 把一个会话移出注册表全局归档集合，恢复其正常可见性（其记账位从未
   * 移动，会话在原工作区位置重新出现）。与官方一致：不做会话存在性检查，
   * 因为从集合摘掉 id 不会引入未知引用。孤儿归档标记也会被清掉；
   * 未归档的 id（含不存在的 id）不写入即返回。
   * @param sessionId - 要取消归档的会话。
   * @returns 更新后的完整归档集合。
   */
  async unarchiveSession(sessionId) {
    return this.enqueueOperation(async () => {
      const state = this.requireState();
      if (!state.archivedSessionIds.includes(sessionId))
        return { archivedSessionIds: [...state.archivedSessionIds] };
      const next = {
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter(
          (id) => id !== sessionId
        )
      };
      await this.setState(next);
      await this.restoreWorkspaceMembership(sessionId);
      return { archivedSessionIds: [...next.archivedSessionIds] };
    });
  }
  /**
   * 恢复后重新编入路径索引；若会话已不在任何工作区记账但 cwd 仍对应某工作区，
   * 则挂回去，避免「恢复并打开」时官方成员过滤把会话从原工作区抹掉。
   */
  async restoreWorkspaceMembership(sessionId) {
    let header;
    try {
      header = await this.readSessionHeader(sessionId);
      await this.indexHeader(header);
    } catch {
      return;
    }
    const path = this.sessionPaths.get(sessionId);
    if (path === void 0) return;
    const table = this.requireTable();
    for (const workspaceId of this.requireState().workspaceIds) {
      const record = table.get(workspaceId);
      if (record === void 0 || record.path !== path) continue;
      if (record.sessionIds.includes(sessionId)) return;
      const entity = this.entities.get(workspaceId);
      if (entity !== void 0) await entity.attachSession(sessionId);
      return;
    }
  }
  /**
   * 按作用域永久删除归档会话。跨会话文件删除无法组成事务，因此继续处理
   * 后续目标并把成功、并发消失和失败分别返回给客户端。
   */
  async deleteArchivedSessions(target) {
    return this.enqueueOperation(async () => {
      const requestedSessionIds = this.archivedSessionIdsForTarget(target);
      const deletedSessionIds = [];
      const skippedSessionIds = [];
      const failures = [];
      for (const sessionId of requestedSessionIds) {
        try {
          const result = await this.deleteSessionCore(sessionId);
          if (result?.skipped) skippedSessionIds.push(sessionId);
          else deletedSessionIds.push(sessionId);
        } catch (error) {
          failures.push({ sessionId, message: String(error) });
        }
      }
      return {
        requestedSessionIds,
        deletedSessionIds,
        skippedSessionIds,
        failures
      };
    });
  }
  /**
   * 清理已无转录的陈旧归档项。缓存墓碑只在清除在途写入期间短暂持有：
   * workspace 没有可记录的旧 header 身份，永久保留它会挡住未来的冷复用。
   * 归档标记最后清除，前序可失败步骤出错时批量入口仍能再次命中。
   */
  async cleanupUnknownArchivedSession(sessionId) {
    const projCache = this.ctx.get("sessionProjectionCache");
    await projCache?.whenIdle?.();
    if (projCache !== void 0) {
      await projCache.delete(sessionId);
      await projCache.whenIdle?.();
      projCache.clearTombstone?.(sessionId);
    }
    await this.cleanSpill(sessionId);
    await this.removeFromWorkspaceAccounts(sessionId);
    const state = this.requireState();
    if (state.archivedSessionIds.includes(sessionId)) {
      await this.setState({
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter(
          (id) => id !== sessionId
        )
      });
    }
  }
  /** 以归档集合顺序解析批量目标，避免依赖浏览器尚未加载完整的摘要投影。 */
  archivedSessionIdsForTarget(target) {
    target = archivedBatchTargetSchema.parse(target);
    const state = this.requireState();
    const archivedSessionIds = [...new Set(state.archivedSessionIds)];
    if (target.scope === "all") return archivedSessionIds;
    if (target.scope === "sessions") {
      const selected = new Set(target.sessionIds);
      return archivedSessionIds.filter((id) => selected.has(id));
    }
    if (target.scope === "workspace") {
      const workspace = this.requireTable().get(target.workspaceId);
      if (workspace === void 0)
        throw new Error(`unknown workspace "${target.workspaceId}"`);
      const accounted2 = new Set(workspace.sessionIds);
      return archivedSessionIds.filter((id) => accounted2.has(id));
    }
    const accounted = /* @__PURE__ */ new Set();
    const table = this.requireTable();
    for (const workspaceId of state.workspaceIds) {
      for (const sessionId of table.get(workspaceId)?.sessionIds ?? [])
        accounted.add(sessionId);
    }
    return archivedSessionIds.filter((id) => !accounted.has(id));
  }
  /**
   * 永久删除一个会话及其全部痕迹（转录目录、工作区记账、归档标记、
   * 投影缓存行）。
   * @param sessionId - 要删除的会话。
   * @returns 持久化完成后的 `{ deleted: true }`。未知会话清掉残留痕迹后同样返回成功，不抛错。
   */
  async deleteSession(sessionId) {
    return this.enqueueOperation(async () => {
      await this.deleteSessionCore(sessionId);
      return { deleted: true };
    });
  }
  /** 串行化后的删除主体（级联路径复用：它已持有操作链，绝不能再入队）。 */
  async deleteSessionCore(sessionId) {
    if (!await this.sessionKnown(sessionId)) {
      await this.cleanupUnknownArchivedSession(sessionId);
      return { deleted: true, skipped: true };
    }
    const sessions = this.ctx.get("sessions");
    const live = sessions?.get(sessionId);
    const deletedHeader = this.headers.get(sessionId) ?? live?.header;
    if (live !== void 0) {
      await sessions.flush(live);
      const entry = sessions.liveEntryFor(live);
      sessions.detachEntered(entry);
    } else if (sessions !== void 0)
      await this.publishColdSessionRemoval(sessionId, sessions);
    const projCache = this.ctx.get("sessionProjectionCache");
    await projCache?.whenIdle?.();
    if (projCache !== void 0) await projCache.delete(sessionId);
    await this.deleteDescendants(sessionId);
    await this.cleanSpill(sessionId);
    await this.removeTranscriptDirectory(sessionId);
    const state = this.requireState();
    if (state.archivedSessionIds.includes(sessionId)) {
      await this.setState({
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter(
          (id) => id !== sessionId
        )
      });
    }
    await this.removeFromWorkspaceAccounts(sessionId);
    this.forgetIndexedSession(sessionId);
    if (deletedHeader !== void 0)
      this.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
    this.publishDeletedSession(sessionId);
    return { deleted: true };
  }
  /** 删除完成后通知全部客户端；新版不再通过伪造冷会话生命周期触发通知。 */
  publishDeletedSession(sessionId) {
    try {
      this.ctx.emit("api-session/removed", sessionId);
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: session "${sessionId}" deleted but removal notification failed: ${String(error)}`
      );
    }
  }
  /**
   * 从父类内存索引中遗忘已删除会话，并阻止后续 indexHeaders 把它加回。
   * 实时会话以同 id 重新出现时（自定义 id 复用）会撤掉墓碑。
   */
  clearTombstone(sessionId) {
    this.deletedSessionIds.delete(sessionId);
    this.deletedIdentities.delete(sessionId);
    const idx = this.deletedSessionOrder.indexOf(sessionId);
    if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
    this.ctx.get("sessionProjectionCache")?.clearTombstone?.(sessionId);
  }
  forgetIndexedSession(sessionId) {
    for (const evicted of trackTombstone(
      this.deletedSessionIds,
      this.deletedSessionOrder,
      sessionId,
      this.deletedSessionTombstoneLimit
    ))
      this.deletedIdentities.delete(evicted);
    this.headers.delete(sessionId);
    this.sessionPaths.delete(sessionId);
    this.invalidSessionPaths.delete(sessionId);
  }
  /**
   * 已删除会话对归档/删除入口都视为未知。实时复用同一 id 时撤墓碑，
   * 避免挡住新会话。
   */
  async sessionKnown(id) {
    if (this.ctx.get("sessions")?.get(id) !== void 0) {
      this.clearTombstone(id);
      return true;
    }
    if (this.deletedSessionIds.has(id)) return this.coldReuseKnown(id);
    return super.sessionKnown(id);
  }
  /**
   * 墓碑分支的冷复用探针：其他进程以同 id 重建并落盘的新会话（日志身份
   * 不同）撤墓碑放行并重新编入索引；stale list() 里同生命周期的旧头部
   * 仍视为未知。身份不可考（删除时未取到头部）时保守维持未知。
   */
  async coldReuseKnown(id) {
    const deletedIdentity = this.deletedIdentities.get(id);
    if (deletedIdentity === void 0) return false;
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.list !== "function")
      return false;
    let header;
    try {
      header = (await this.listStoredHeaders()).find((item) => item.id === id);
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: cold-reuse probe for "${id}" failed: ${String(error)}`
      );
      return false;
    }
    if (header === void 0) return false;
    const listed = headerIdentity(header);
    if (listed.createdAt === deletedIdentity.createdAt && listed.cwd === deletedIdentity.cwd)
      return false;
    this.clearTombstone(id);
    await this.indexHeader(header);
    return true;
  }
  /**
   * 父类 indexHeaders 只增不减；跳过墓碑 id，避免 stale persistence.list()
   * 把已删除会话重新编入 headers。
   */
  async indexHeader(header) {
    if (this.deletedSessionIds.has(header.id)) return;
    return super.indexHeader(header);
  }
  /** 统一旧版头部数组与 0.1.3 的持久化快照，供父类索引和本插件枚举共用。 */
  async listStoredHeaders() {
    return (await this.ctx.sessionPersistence.list()).map(
      (item) => item.header ?? item
    );
  }
  async indexHeaders(items) {
    for (const item of items) await this.indexHeader(item.header ?? item);
  }
  /** 为未处于实时状态的持久化会话发布相同的移除事件。 */
  async publishColdSessionRemoval(sessionId, sessions) {
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.prepare !== "function")
      return;
    try {
      const preparation = await persistence.prepare(sessionId);
      const detach = sessions.enter(preparation.session);
      try {
        sessions.announce(preparation.session);
      } finally {
        detach();
        preparation[Symbol.dispose]();
      }
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: could not publish removal for stored session "${sessionId}": ${String(error)}`
      );
    }
  }
  /** 官方 JSONL 已知布局清理会话专属目录；其他后端只删除定位到的工件。 */
  async removeTranscriptDirectory(sessionId) {
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.locate !== "function") {
      throw new Error(
        `cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript artifact`
      );
    }
    const header = await this.readSessionHeader(sessionId);
    const location = persistence.locate(header);
    if (location === void 0 || typeof location.path !== "string") {
      throw new Error(
        `cannot delete session "${sessionId}": the session persistence backend could not resolve its transcript artifact`
      );
    }
    let target = { path: location.path, kind: "transcript artifact" };
    try {
      const directory = jsonlSessionDirectory(persistence, header, location);
      if (directory !== void 0) {
        target = { path: directory, kind: "session directory" };
        for (const path of [dirname(directory), directory]) {
          let stat;
          try {
            stat = await lstat(path);
          } catch (error) {
            if (error?.code === "ENOENT") continue;
            throw error;
          }
          if (stat.isSymbolicLink())
            throw new Error(`refusing to delete through symbolic link "${path}"`);
          if (!stat.isDirectory())
            throw new Error(`expected session storage directory "${path}"`);
        }
      } else if (persistence.name === "session-persistence-jsonl") {
        this.ctx.logger.warn(
          `archive-manager: session "${sessionId}": JSONL directory ownership could not be verified; falling back to artifact-only deletion at "${location.path}" (parent directory retained)`
        );
      }
      await rm(target.path, { recursive: true, force: true });
      if (typeof persistence.stat === "function" && await persistence.stat(sessionId) !== void 0) {
        throw new Error(
          `session "${sessionId}" is still present in persistence after artifact removal`
        );
      }
    } catch (error) {
      const message = `cannot delete session "${sessionId}": cleanup of ${target.kind} "${target.path}" failed; bookkeeping retained for retry`;
      const detail = `${message}: ${String(error)}`;
      this.ctx.logger.warn(`archive-manager: ${detail}`);
      throw new Error(detail, { cause: error });
    }
  }
  /** 把 id 从每个工作区记录中移除，并刷新实体快照。 */
  async removeFromWorkspaceAccounts(sessionId) {
    const table = this.requireTable();
    const state = this.requireState();
    for (const workspaceId of state.workspaceIds) {
      const record = table.get(workspaceId);
      if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
      const next = await table.update(workspaceId, (current) => ({
        ...current,
        sessionIds: current.sessionIds.filter((id) => id !== sessionId),
        updatedAt: /* @__PURE__ */ (/* @__PURE__ */ new Date()).toISOString()
      }));
      const entity = this.entities.get(workspaceId);
      if (entity !== void 0) entity.record = next;
    }
  }
  /** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话。
   * 仅头部标记 `origin: "subagent"` 的会话参与：单凭 `parentSession` 有歧义
   *（fork 分支也携带它），而 fork 分支是独立的用户会话，绝不能被级联删除。 */
  async deleteDescendants(sessionId) {
    try {
      const descendants = [];
      const sessions = this.ctx.get("sessions");
      if (sessions !== void 0)
        for (const session of sessions.list()) {
          if (session.header.parentSession === sessionId && session.header.origin === "subagent")
            descendants.push(session.id);
        }
      for (const header of await this.listStoredHeaders()) {
        if (header.parentSession === sessionId && header.origin === "subagent" && !descendants.includes(header.id))
          descendants.push(header.id);
      }
      for (const childId of descendants) {
        try {
          if (!await this.sessionKnown(childId)) continue;
          await this.deleteSessionCore(childId);
        } catch (error) {
          this.ctx.logger.warn(
            `archive-manager: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`
          );
        }
      }
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`
      );
    }
  }
  /** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
  async cleanSpill(sessionId) {
    try {
      const spill = this.ctx.get("spillStore");
      if (spill === void 0 || typeof spill.root !== "string") return;
      await rm(sessionDir(spill.root, sessionId), {
        recursive: true,
        force: true
      });
    } catch (error) {
      this.ctx.logger.warn(
        `archive-manager: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`
      );
    }
  }
};
export {
  ArchiveWorkspaceRegistry,
  ArchiveWorkspaceRegistry as default
};
