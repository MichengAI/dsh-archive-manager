import { rm } from "node:fs/promises";
import {
  WorkspaceRegistry
} from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { trackTombstone } from "./tombstone.js";
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
function unknownSessionMessage(sessionId) {
  return `unknown session "${sessionId}" (UNKNOWN_SESSION)`;
}
var ArchiveUnknownSessionError = class extends Error {
  sessionId;
  constructor(sessionId) {
    super(unknownSessionMessage(sessionId));
    this.sessionId = sessionId;
    this.name = "ArchiveUnknownSessionError";
  }
};
function headerIdentity(header) {
  return {
    createdAt: header.createdAt,
    cwd: header.cwd ?? null
  };
}
const sessionIdSchema = {
  parse(value) {
    if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
    return value;
  }
};
const workspaceIdSchema = {
  parse(value) {
    if (typeof value !== "string" || value.length === 0) throw new TypeError(`workspaceId must be a non-empty string, got ${String(value)}`);
    return value;
  }
};
const archivedSetSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
    const ids = value.archivedSessionIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
    return value;
  }
};
const deletedSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
    return value;
  }
};
const archivedBatchTargetSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
    if (value.scope === "all" || value.scope === "ungrouped") return value;
    if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
    if (value.scope === "sessions" && Array.isArray(value.sessionIds) && value.sessionIds.length > 0 && value.sessionIds.every((id) => typeof id === "string" && id.length > 0)) return value;
    throw new TypeError("target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds");
  }
};
const unarchivedBatchSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
    if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
    if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
    return value;
  }
};
const archivedWorkspaceBatchSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
    if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
    if (!Array.isArray(value.archivedSessionIdsAdded) || value.archivedSessionIdsAdded.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIdsAdded must be a string array");
    return value;
  }
};
const deletedBatchSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
    for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
      if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
    }
    if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
    return value;
  }
};
const archivedSessionMetadataSchema = {
  parse(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
    if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
    if (value.repairedSessionIds !== void 0 && (!Array.isArray(value.repairedSessionIds) || value.repairedSessionIds.some((id) => typeof id !== "string"))) throw new TypeError("repairedSessionIds must be a string array");
    return value;
  }
};
const ARCHIVE_MANAGER_INVOCATIONS = [
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "unarchiveSession",
    invocation: { kind: "direct" },
    parameters: [{
      name: "sessionId",
      wire: "sessionId",
      source: "json",
      codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
    }],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionIds",
      schema: archivedSetSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "deleteSession",
    invocation: { kind: "direct" },
    parameters: [{
      name: "sessionId",
      wire: "sessionId",
      source: "json",
      codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
    }],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#Deleted",
      schema: deletedSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSessions",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "unarchiveSessions",
    invocation: { kind: "direct" },
    parameters: [{
      name: "target",
      wire: "target",
      source: "json",
      codec: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
    }],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#UnarchivedBatch",
      schema: unarchivedBatchSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/archiveWorkspaceSessions",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "archiveWorkspaceSessions",
    invocation: { kind: "direct" },
    parameters: [{
      name: "workspaceId",
      wire: "workspaceId",
      source: "json",
      codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-workspace/types#WorkspaceId", schema: workspaceIdSchema }
    }],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedWorkspaceBatch",
      schema: archivedWorkspaceBatchSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteArchivedSessions",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "deleteArchivedSessions",
    invocation: { kind: "direct" },
    parameters: [{
      name: "target",
      wire: "target",
      source: "json",
      codec: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
    }],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#DeletedBatch",
      schema: deletedBatchSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "archivedSessionMetadata",
    invocation: { kind: "direct" },
    parameters: [],
    result: {
      mode: "strict",
      typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionMetadata",
      schema: archivedSessionMetadataSchema
    },
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
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
  constructor(ctx) {
    super(ctx);
    this.typertRemote = bindTypertRemote(this, this.name);
    markRemoteMethod(this, "unarchiveSession");
    markRemoteMethod(this, "deleteSession");
    markRemoteMethod(this, "unarchiveSessions");
    markRemoteMethod(this, "archiveWorkspaceSessions");
    markRemoteMethod(this, "deleteArchivedSessions");
    markRemoteMethod(this, "archivedSessionMetadata");
    registerHostRemote(this.ctx);
  }
  /**
  * 归档设置页创建时间排序所需的最小元数据。老用户可能仍有会话原文和
  * 归档标记、却没有投影缓存；这里按需从完整日志重建一次，再通知客户端
  * 刷新会话列表。已有缓存不读原文，新老 DSH 的缓存布局都走同一 put。
  */
  async archivedSessionMetadata() {
    const items = [];
    const repairedSessionIds = [];
    for (const sessionId of [...new Set(this.requireState().archivedSessionIds)]) {
      try {
        const header = await this.readSessionHeader(sessionId);
        if (await this.repairArchivedProjection(header)) repairedSessionIds.push(sessionId);
        if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt)) items.push({ sessionId, createdAt: header.createdAt });
      } catch (error) {
        this.ctx.logger.warn(`archive-manager: could not read creation time for archived session "${sessionId}": ${String(error)}`);
      }
    }
    return { items, ...repairedSessionIds.length === 0 ? {} : { repairedSessionIds } };
  }
  /** 从会话原文补齐缺失的派生缓存；任何失败都只降级为原有无摘要列表。 */
  async repairArchivedProjection(header) {
    const cache = this.ctx.get("sessionProjectionCache");
    const persistence = this.ctx.get("sessionPersistence");
    const projections = this.ctx.get("sessionProjections");
    if (cache === void 0 || typeof cache.cachedSnapshot !== "function" || typeof cache.put !== "function") return false;
    if (persistence === void 0 || typeof persistence.readFrom !== "function" || projections === void 0 || typeof projections.restore !== "function") return false;
    try {
      if (!header.isSeeded && cache.cachedSnapshot(header, 0) !== void 0) return false;
      const stored = await persistence.readFrom(header.id, 0);
      const meta = stored.meta ?? header;
      if (meta.isSeeded === true && stored.inheritedEventCount === void 0) {
        this.ctx.logger.warn(`archive-manager: projection repair for seeded archived session "${header.id}" skipped because its inherited event count is unavailable`);
        return false;
      }
      const inheritedEventCount = stored.inheritedEventCount ?? 0;
      if (meta.isSeeded !== true && inheritedEventCount !== 0) {
        this.ctx.logger.warn(`archive-manager: projection repair for unseeded archived session "${header.id}" skipped because its inherited event count is not zero`);
        return false;
      }
      if (cache.cachedSnapshot(meta, inheritedEventCount) !== void 0) return false;
      const restored = projections.restore({}, stored.events, 0, meta, inheritedEventCount);
      if (restored === void 0 || typeof restored !== "object" || restored.checkpoint === void 0) return false;
      await cache.put(header.id, {
        createdAt: meta.createdAt,
        ...meta.cwd === void 0 ? {} : { cwd: meta.cwd },
        isSeeded: meta.isSeeded ?? false,
        inheritedEventCount
      }, restored.checkpoint);
      return true;
    } catch (error) {
      this.ctx.logger.warn(`archive-manager: projection repair for archived session "${header.id}" failed: ${String(error)}`);
      return false;
    }
  }
  /**
  * 把一个会话移出注册表全局归档集合，恢复其正常可见性（其记账位从未
  * 移动，会话在原工作区位置重新出现）。幂等：未归档的已知会话直接返回
  * 当前集合不写入；未知会话与 `archiveSession` 一样抛错。
  * @param sessionId - 要取消归档的会话。
  * @returns 更新后的完整归档集合。
  */
  async unarchiveSession(sessionId) {
    return this.enqueueOperation(async () => {
      if (!await this.sessionKnown(sessionId)) throw new ArchiveUnknownSessionError(sessionId);
      const state = this.requireState();
      if (!state.archivedSessionIds.includes(sessionId)) return { archivedSessionIds: [...state.archivedSessionIds] };
      const next = {
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
      };
      await this.setState(next);
      return { archivedSessionIds: [...next.archivedSessionIds] };
    });
  }
  /**
  * 将一个工作区内所有会话加入归档集合。先确认所有待归档会话仍存在，
  * 再执行单次状态写入，因此未知会话不会导致项目只归档一部分。
  */
  async archiveWorkspaceSessions(workspaceId) {
    return this.enqueueOperation(async () => {
      workspaceId = workspaceIdSchema.parse(workspaceId);
      const workspace = this.requireTable().get(workspaceId);
      if (workspace === void 0) throw new Error(`unknown workspace "${workspaceId}"`);
      const state = this.requireState();
      const archived = new Set(state.archivedSessionIds);
      const archivedSessionIdsAdded = [...new Set(workspace.sessionIds)].filter((sessionId) => !archived.has(sessionId));
      for (const sessionId of archivedSessionIdsAdded) {
        if (!await this.sessionKnown(sessionId)) throw new ArchiveUnknownSessionError(sessionId);
      }
      if (archivedSessionIdsAdded.length === 0) return {
        archivedSessionIds: [...state.archivedSessionIds],
        archivedSessionIdsAdded
      };
      const next = {
        ...state,
        archivedSessionIds: [...state.archivedSessionIds, ...archivedSessionIdsAdded]
      };
      await this.setState(next);
      return {
        archivedSessionIds: [...next.archivedSessionIds],
        archivedSessionIdsAdded
      };
    });
  }
  /**
  * 按宿主权威归档集合一次恢复全部、一个工作区或未分组的归档会话。
  * 目标全部来自已归档集合，因此即使日志已被外部移除，也会清掉陈旧归档标记。
  */
  async unarchiveSessions(target) {
    return this.enqueueOperation(async () => {
      const unarchivedSessionIds = this.archivedSessionIdsForTarget(target);
      if (unarchivedSessionIds.length === 0) return {
        archivedSessionIds: [...this.requireState().archivedSessionIds],
        unarchivedSessionIds: []
      };
      const restored = new Set(unarchivedSessionIds);
      const state = this.requireState();
      const next = {
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter((id) => !restored.has(id))
      };
      await this.setState(next);
      return {
        archivedSessionIds: [...next.archivedSessionIds],
        unarchivedSessionIds
      };
    });
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
          await this.deleteSessionCore(sessionId);
          deletedSessionIds.push(sessionId);
        } catch (error) {
          if (error instanceof ArchiveUnknownSessionError) {
            try {
              await this.cleanupUnknownArchivedSession(sessionId);
              skippedSessionIds.push(sessionId);
            } catch (cleanupError) {
              failures.push({ sessionId, message: String(cleanupError) });
            }
            continue;
          }
          failures.push({ sessionId, message: String(error) });
        }
      }
      return { requestedSessionIds, deletedSessionIds, skippedSessionIds, failures };
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
        archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
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
      if (workspace === void 0) throw new Error(`unknown workspace "${target.workspaceId}"`);
      const accounted2 = new Set(workspace.sessionIds);
      return archivedSessionIds.filter((id) => accounted2.has(id));
    }
    const accounted = /* @__PURE__ */ new Set();
    const table = this.requireTable();
    for (const workspaceId of state.workspaceIds) {
      for (const sessionId of table.get(workspaceId)?.sessionIds ?? []) accounted.add(sessionId);
    }
    return archivedSessionIds.filter((id) => !accounted.has(id));
  }
  /**
  * 永久删除一个会话及其全部痕迹（转录目录、工作区记账、归档标记、
  * 投影缓存行）。
  * @param sessionId - 要删除的会话。
  * @returns 持久化完成后的 `{ deleted: true }`。
  * @throws {@link ArchiveUnknownSessionError} 会话未知时抛出。
  */
  async deleteSession(sessionId) {
    return this.enqueueOperation(() => this.deleteSessionCore(sessionId));
  }
  /** 串行化后的删除主体（级联路径复用：它已持有操作链，绝不能再入队）。 */
  async deleteSessionCore(sessionId) {
    if (!await this.sessionKnown(sessionId)) throw new ArchiveUnknownSessionError(sessionId);
    const sessions = this.ctx.get("sessions");
    const live = sessions?.get(sessionId);
    const deletedHeader = this.headers.get(sessionId) ?? live?.header;
    if (live !== void 0) {
      await sessions.flush(live);
      const entry = sessions.liveEntryFor(live);
      sessions.detachEntered(entry);
    } else if (sessions !== void 0) await this.publishColdSessionRemoval(sessionId, sessions);
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
        archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
      });
    }
    await this.removeFromWorkspaceAccounts(sessionId);
    this.forgetIndexedSession(sessionId);
    if (deletedHeader !== void 0) this.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
    return { deleted: true };
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
    for (const evicted of trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, sessionId, this.deletedSessionTombstoneLimit)) this.deletedIdentities.delete(evicted);
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
    if (persistence === void 0 || typeof persistence.list !== "function") return false;
    let header;
    try {
      header = (await persistence.list()).find((item) => item.id === id);
    } catch (error) {
      this.ctx.logger.warn(`archive-manager: cold-reuse probe for "${id}" failed: ${String(error)}`);
      return false;
    }
    if (header === void 0) return false;
    const listed = headerIdentity(header);
    if (listed.createdAt === deletedIdentity.createdAt && listed.cwd === deletedIdentity.cwd) return false;
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
  /** 为未处于实时状态的持久化会话发布相同的移除事件。 */
  async publishColdSessionRemoval(sessionId, sessions) {
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.prepare !== "function") return;
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
      this.ctx.logger.warn(`archive-manager: could not publish removal for stored session "${sessionId}": ${String(error)}`);
    }
  }
  /** 删除后端定位到的会话转录工件，绝不推导或删除其父目录。 */
  async removeTranscriptDirectory(sessionId) {
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.locate !== "function") {
      throw new Error(`cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript artifact`);
    }
    const header = await this.readSessionHeader(sessionId);
    const location = persistence.locate(header);
    if (location === void 0 || typeof location.path !== "string") {
      throw new Error(`cannot delete session "${sessionId}": the session persistence backend could not resolve its transcript artifact`);
    }
    try {
      await rm(location.path, { recursive: true, force: true });
    } catch (error) {
      const message = `cannot delete session "${sessionId}": transcript artifact "${location.path}" remains before bookkeeping cleanup`;
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
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
      if (sessions !== void 0) for (const session of sessions.list()) {
        if (session.header.parentSession === sessionId && session.header.origin === "subagent") descendants.push(session.id);
      }
      for (const header of await this.ctx.sessionPersistence.list()) {
        if (header.parentSession === sessionId && header.origin === "subagent" && !descendants.includes(header.id)) descendants.push(header.id);
      }
      for (const childId of descendants) {
        try {
          if (!await this.sessionKnown(childId)) continue;
          await this.deleteSessionCore(childId);
        } catch (error) {
          if (error instanceof ArchiveUnknownSessionError) continue;
          this.ctx.logger.warn(`archive-manager: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`);
        }
      }
    } catch (error) {
      this.ctx.logger.warn(`archive-manager: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`);
    }
  }
  /** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
  async cleanSpill(sessionId) {
    try {
      const spill = this.ctx.get("spillStore");
      if (spill === void 0 || typeof spill.root !== "string") return;
      await rm(sessionDir(spill.root, sessionId), { recursive: true, force: true });
    } catch (error) {
      this.ctx.logger.warn(`archive-manager: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`);
    }
  }
};
export {
  ArchiveWorkspaceRegistry,
  ArchiveWorkspaceRegistry as default
};
