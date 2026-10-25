import { confirmColdCacheWrite } from "./cache-rebuild.js";
import { cacheIdentity, cacheRebuildInput, cacheRebuildInvocations } from "./cache-rebuild-contract.js";
import { symbols } from "@deepseek-ai/cordis";
import { record, errorMessage, errorCode } from "./contracts.js";
import { discoveryInvocations, searchInputSchema, previewInputSchema, extractConversation, findContentMatch, previewConversation } from "./archive-discovery.js";
import { lstat, readdir, rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { defineDomain } from "@deepseek-ai/dsh-storage-domain";
import { favoriteInputSchema, favoriteStateSchema, favoriteInvocations } from "./archive-organizer.js";
const favoriteDomainSpec = defineDomain({
  name: "archive_manager_favorites",
  version: 1,
  tables: {},
  // 宿主运行时仅调用 parse/safeParse；兼容早期同构 schema，不新增 Zod 运行依赖。
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
async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}
async function estimatePathSize(path) {
  try {
    const s = await lstat(path);
    if (s.isFile()) return s.size;
    if (s.isDirectory()) {
      const entries = await readdir(path, { withFileTypes: true });
      let total = 0;
      for (const entry of entries) {
        if (entry.isFile()) {
          try {
            const fileStat = await lstat(join(path, entry.name));
            total += fileStat.size;
          } catch {
          }
        }
      }
      return total;
    }
  } catch {
    return 0;
  }
  return 0;
}
class PersistenceStillPresentError extends Error {
  constructor(sessionId) {
    super(`session "${sessionId}" is still present in persistence after artifact removal`);
    this.name = "PersistenceStillPresentError";
  }
}
function deletionFailureMessage(error) {
  return errorMessage(error).slice(0, 400);
}
function strictCodec(typeSymbol, schema) {
  return {
    mode: "strict",
    typeSymbol,
    create: () => schema,
    schema
  };
}
const ARCHIVE_REMOTE_METHODS = [
  "unarchiveSession",
  "deleteSession",
  "deleteArchivedSessions",
  "archivedSessionMetadata",
  "favoriteSessions",
  "setSessionFavorite",
  "searchArchivedContent",
  "searchSessionContent",
  "previewArchivedSession",
  "diagnoseOrphanSubagents",
  "diagnoseSessionCaches",
  "rebuildSessionCaches",
  "cleanOrphanSubagents"
];
function markRemoteMethod(instance, method) {
  const context = {
    private: false,
    static: false,
    name: method,
    addInitializer(fn) {
      fn.call(instance);
    }
  };
  Remote(method)(function() {
  }, { ...context, kind: "method", access: { has: (value) => method in value, get: (value) => Reflect.get(value, method) }, metadata: void 0 });
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
  parse(input) {
    const value = record(input);
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new TypeError("result must be an object");
    const ids = value.archivedSessionIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
      throw new TypeError("archivedSessionIds must be a string array");
    return value;
  }
};
const deletedSchema = {
  parse(input) {
    const value = record(input);
    if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true)
      throw new TypeError("deleted must be true");
    return value;
  }
};
const archivedBatchTargetSchema = {
  parse(input) {
    const value = record(input);
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
  parse(input) {
    const value = record(input);
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
  parse(input) {
    const value = record(input);
    if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items))
      throw new TypeError("result.items must be an array");
    if (value.items.some(
      (item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt)
    ))
      throw new TypeError("items must contain sessionId/createdAt objects");
    return value;
  }
};
const orphanDiagnosisSchema = {
  parse(value) {
    const val = record(value);
    if (!val || typeof val.count !== "number" || !Array.isArray(val.items) || typeof val.totalSizeBytes !== "number") {
      throw new TypeError("invalid orphan subagent diagnosis");
    }
    return val;
  }
};
const orphanCleanResultSchema = {
  parse(value) {
    const val = record(value);
    if (!val || !Array.isArray(val.cleanedSessionIds) || !Array.isArray(val.skippedSessionIds) || !Array.isArray(val.failures)) {
      throw new TypeError("invalid orphan subagent clean result");
    }
    return val;
  }
};
const ARCHIVE_MANAGER_INVOCATIONS = [
  ...cacheRebuildInvocations(),
  ...favoriteInvocations(),
  ...discoveryInvocations(),
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
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/diagnoseOrphanSubagents",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "diagnoseOrphanSubagents",
    invocation: { kind: "direct" },
    parameters: [],
    result: strictCodec("@michengai/dsh-archive-manager/types#OrphanSubagentDiagnosis", orphanDiagnosisSchema),
    sourceLocation: {
      file: "@michengai/dsh-archive-manager/lib/workspace.js",
      line: 1,
      column: 1
    }
  },
  {
    id: "@michengai/dsh-archive-manager#workspaceRegistry/cleanOrphanSubagents",
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method: "cleanOrphanSubagents",
    invocation: { kind: "direct" },
    parameters: [
      {
        name: "target",
        wire: "target",
        source: "json",
        acceptsUndefined: true,
        codec: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanTarget", {
          parse(v) {
            if (v === void 0 || v === null) return {};
            const val = record(v);
            if (!val) throw new TypeError("target must be an object");
            if (val.sessionIds !== void 0 && (!Array.isArray(val.sessionIds) || val.sessionIds.some((id) => typeof id !== "string"))) {
              throw new TypeError("sessionIds must be an array of strings");
            }
            return val;
          }
        })
      }
    ],
    result: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanResult", orphanCleanResultSchema),
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
function bindArchiveManagerRemote(ctx) {
  const typert = ctx.get("typert");
  if (typert === void 0 || typeof typert.register !== "function") {
    throw new Error("archive-manager: typert is unavailable");
  }
  try {
    const dispose = typert.register(ARCHIVE_MANAGER_TYPERT);
    return typeof dispose === "function" ? () => {
      dispose();
    } : () => {
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("already registered")) throw error;
    return () => {
    };
  }
}
var ArchiveWorkspaceRegistry = class extends WorkspaceRegistry {
  static inject = [
    "storageDomain",
    "sessionPersistence",
    "sessionProjectionCache",
    "typert"
  ];
  constructor(ctx) {
    super(ctx);
    this.typertRemote = bindTypertRemote(this, this.name);
    for (const method of ARCHIVE_REMOTE_METHODS) markRemoteMethod(this, method);
    registerHostRemote(this.ctx);
  }
  /** 只读取归档日志；已有实时实例读取快照，不调用 prepare、enter 或恢复接口。 */
  async readArchivedConversation(sessionId) {
    const ensureArchived = () => {
      if (!this.requireState().archivedSessionIds.includes(sessionId)) throw new Error("\u4F1A\u8BDD\u5DF2\u4E0D\u5728\u5F52\u6863\u4E2D\uFF0C\u8BF7\u5237\u65B0\u5217\u8868");
    };
    ensureArchived();
    const events = await this.readConversationEvents(sessionId);
    ensureArchived();
    return extractConversation(events);
  }
  /** 复用宿主只读接口读取事件，不激活会话。 */
  async readConversationEvents(sessionId) {
    const live = this.ctx.get("sessions")?.get(sessionId);
    if (typeof live?.snapshotEvents === "function") return live.snapshotEvents();
    const persistence = this.ctx.get("sessionPersistence");
    if (!persistence || typeof persistence.open !== "function") throw new Error("\u5F53\u524D\u5BBF\u4E3B\u4E0D\u652F\u6301\u53EA\u8BFB\u4F1A\u8BDD\uFF0C\u8BF7\u6253\u5F00\u5B8C\u6574\u4F1A\u8BDD\u67E5\u770B");
    return (await this.readStoredProjectionSource(persistence, sessionId)).events;
  }
  /** 已归档与未归档共用正文检索；只读已知会话，不激活或改变归档状态。 */
  async searchSessionContent(input) {
    const { sessionIds, query } = searchInputSchema.parse(input);
    const items = [], failures = [];
    for (const sessionId of sessionIds) {
      try {
        if (!await this.sessionKnown(sessionId)) throw new Error("\u4F1A\u8BDD\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5237\u65B0\u5217\u8868");
        const messages = extractConversation(await this.readConversationEvents(sessionId));
        if (!await this.sessionKnown(sessionId)) throw new Error("\u4F1A\u8BDD\u5DF2\u79FB\u9664\uFF0C\u8BF7\u5237\u65B0\u5217\u8868");
        const match = findContentMatch(messages, query);
        if (match) items.push({ sessionId, ...match });
      } catch (error) {
        failures.push({ sessionId, message: errorMessage(error).slice(0, 500) });
      }
    }
    return { items, failures };
  }
  /** 输入为限定批次的归档 ID 和关键词，逐条返回命中或失败。 */
  async searchArchivedContent(input) {
    const { sessionIds, query } = searchInputSchema.parse(input);
    const items = [], failures = [];
    for (const sessionId of sessionIds) {
      try {
        const match = findContentMatch(await this.readArchivedConversation(sessionId), query);
        if (match) items.push({ sessionId, ...match });
      } catch (error) {
        failures.push({ sessionId, message: errorMessage(error).slice(0, 500) });
      }
    }
    return { items, failures };
  }
  /** 返回最近八条对话或关键词附近的八条，单条最多 2000 字，不写入宿主数据。 */
  async previewArchivedSession(input) {
    const { sessionId, query } = previewInputSchema.parse(input);
    return { sessionId, ...previewConversation(await this.readArchivedConversation(sessionId), query) };
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
      for (const id of state.favoriteSessionIds) {
        if (this.ctx.get("sessions")?.get(id) !== void 0 || !await this.sessionArtifactMissing(id)) kept.push(id);
      }
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
  /**
   * 确证会话工件在物理上是否已经彻底缺失。
   * 注意：官方 jsonl 的 stat() 在日志第一行 JSON 损坏、为空或格式异常时也会返回 undefined，
   * 不能单凭 stat() === undefined 断定文件不存在；
   * 必须结合 findLog(sessionId) 以及物理存储根目录扫描，确证磁盘上没有任何工件或目录残留。
   */
  async sessionArtifactMissing(sessionId) {
    const persistence = this.ctx.get("sessionPersistence");
    if (!persistence) return false;
    if (typeof persistence.findLog === "function") {
      try {
        const found = await persistence.findLog(sessionId);
        if (found !== void 0) return false;
      } catch {
        return false;
      }
    }
    const root = persistence.root ?? persistence.config?.root;
    if (typeof root === "string" && isAbsolute(root)) {
      try {
        const encode = (text) => text.replace(/[^A-Za-z0-9._-]/g, (ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
        const segment = sessionId === "." ? "~002E" : sessionId === ".." ? "~002E~002E" : encode(sessionId);
        const projects = await readdir(root);
        for (const proj of projects) {
          if (await pathExists(join(root, proj, segment))) {
            return false;
          }
        }
      } catch {
      }
    }
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
        if (listed.has(sessionId)) {
          kept.push(sessionId);
          continue;
        }
        if (await this.sessionArtifactMissing(sessionId)) {
          this.forgetIndexedSession(sessionId);
          const projCache = this.ctx.get("sessionProjectionCache");
          if (projCache !== void 0) {
            try {
              await projCache.requireTable().delete(sessionId);
            } catch (e) {
              this.ctx.logger.warn(`archive-manager: cleanup projection cache for missing session "${sessionId}" failed: ${String(e)}`);
            }
          }
          continue;
        }
        kept.push(sessionId);
      }
      if (kept.length === state.archivedSessionIds.length && kept.every((id, index) => id === state.archivedSessionIds[index]))
        return kept;
      await this.setState({ ...state, archivedSessionIds: kept });
      return kept;
    });
  }
  /** 仅返回归档头部元数据；不读取正文、不重建或补写投影缓存。 */
  async archivedSessionMetadata() {
    await this.pruneUnknownArchivedSessionIds();
    const items = [];
    for (const sessionId of this.requireState().archivedSessionIds) {
      try {
        const header = await this.readSessionHeader(sessionId);
        if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt))
          items.push({ sessionId, createdAt: header.createdAt });
      } catch (error) {
        this.ctx.logger.warn(
          `archive-manager: could not read creation time for archived session "${sessionId}": ${String(error)}`
        );
      }
    }
    return { items };
  }
  /** 只读句柄必须关闭，避免激活 Agent 或写入会话日志。 */
  /** 普通冷会话（登记工作区、未分组及已归档）均支持重建，排除子代理、活跃及活动中会话。 */
  async cacheRebuildEligible(header) {
    if (header.origin !== void 0 || header.id.startsWith("im:") || this.ctx.get("sessions")?.get(header.id) !== void 0) return false;
    const activity = await this.ctx.waterfall("workspace/session-activity", { sessionId: header.id }, () => Promise.resolve([]));
    return activity.length === 0 && this.ctx.get("sessions")?.get(header.id) === void 0;
  }
  /** 检测仅读取头部与官方缓存，不读取会话正文。 */
  usableSessionListCache(header) {
    const snapshot = this.ctx.get("sessionProjectionCache")?.cachedSnapshot(header);
    return snapshot !== void 0 && Object.hasOwn(snapshot.values, "title");
  }
  async diagnoseSessionCaches() {
    const cache = this.ctx.get("sessionProjectionCache");
    if (!cache) throw new Error("Official session projection cache is unavailable");
    const items = [];
    const headers = this.headers?.size ? Array.from(this.headers.values()) : await this.listStoredHeaders();
    for (const header of headers) {
      if (await this.cacheRebuildEligible(header) && !this.usableSessionListCache(header)) {
        items.push({ sessionId: header.id, identity: cacheIdentity(header) });
      }
    }
    return { count: items.length, items };
  }
  /** 定向读取持久化头部，优先单会话 stat 避免全量枚举，无 stat 时安全回退。 */
  async readSessionHeaderDirect(sessionId) {
    const persistence = this.ctx.sessionPersistence;
    if (typeof persistence?.stat === "function") {
      const snapshot = await persistence.stat(sessionId);
      return snapshot?.header;
    }
    return (await this.listStoredHeaders()).find((h) => h.id === sessionId);
  }
  /** 与删除共用官方工作区队列；冷写入会同步加入官方域写入链，
   * 回读超时也不会取消已入队的写入，因此后续删除会排在该写入之后。 */
  async rebuildSessionCaches(input) {
    const { items } = cacheRebuildInput.parse(input);
    const result = { rebuiltSessionIds: [], skippedSessionIds: [], failures: [] };
    for (const item of [...new Map(items.map((row) => [row.sessionId, row])).values()]) {
      await this.enqueueOperation(async () => {
        try {
          const cache = this.ctx.get("sessionProjectionCache");
          if (!cache) throw new Error("Official session projection cache is unavailable");
          const header = await this.readSessionHeaderDirect(item.sessionId);
          if (!header || cacheIdentity(header) !== item.identity || !await this.cacheRebuildEligible(header) || this.usableSessionListCache(header)) {
            result.skippedSessionIds.push(item.sessionId);
            return;
          }
          const source = await this.readStoredProjectionSource(this.ctx.sessionPersistence, item.sessionId);
          const current = await this.readSessionHeaderDirect(item.sessionId);
          if (!current || cacheIdentity(current) !== item.identity || cacheIdentity(source.meta) !== item.identity || !await this.cacheRebuildEligible(current)) {
            result.skippedSessionIds.push(item.sessionId);
            return;
          }
          await confirmColdCacheWrite(cache, source);
          result.rebuiltSessionIds.push(item.sessionId);
        } catch (error) {
          result.failures.push({ sessionId: item.sessionId, message: (error instanceof Error ? error.message : String(error)).slice(0, 500) });
        }
      });
    }
    return result;
  }
  async readStoredProjectionSource(persistence, sessionId) {
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
  /** 官方负责移出归档集合。这里只补远程接口需要的当前集合，不补工作区记账。 */
  async unarchiveSession(sessionId) {
    await super.unarchiveSession(sessionId);
    return { archivedSessionIds: [...this.requireState().archivedSessionIds] };
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
      let descendantHeaders;
      try {
        descendantHeaders = await this.listStoredHeaders();
      } catch (error) {
        this.ctx.logger.warn(
          `archive-manager: batch descendant listing failed; each cascade will retry: ${String(error)}`
        );
      }
      for (const sessionId of requestedSessionIds) {
        try {
          const result = await this.deleteSessionCore(sessionId, descendantHeaders);
          if (result?.skipped) skippedSessionIds.push(sessionId);
          else deletedSessionIds.push(sessionId);
        } catch (error) {
          failures.push({ sessionId, message: deletionFailureMessage(error) });
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
  /** 删除未知会话遗留的投影行、spill、工作区记账和归档标记。 */
  async cleanupUnknownArchivedSession(sessionId) {
    const projCache = this.ctx.get("sessionProjectionCache");
    if (projCache !== void 0) await projCache.requireTable().delete(sessionId);
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
  archivedSessionIdsForTarget(input) {
    const target = archivedBatchTargetSchema.parse(input);
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
  async deleteSessionCore(sessionId, descendantHeaders) {
    if (!await this.sessionKnown(sessionId)) {
      await this.cleanupUnknownArchivedSession(sessionId);
      return { deleted: true, skipped: true };
    }
    const sessions = this.ctx.get("sessions");
    const live = sessions?.get(sessionId);
    if (live !== void 0) {
      await sessions.flush(live);
      const entry = sessions.liveEntryFor(live);
      sessions.detachEntered(entry);
    } else if (sessions !== void 0)
      await this.publishColdSessionRemoval(sessionId, sessions);
    const projCache = this.ctx.get("sessionProjectionCache");
    if (projCache !== void 0) await projCache.requireTable().delete(sessionId);
    await this.deleteDescendants(sessionId, descendantHeaders);
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
  /** 物理删除成功后移除父类的会话头部和路径索引。 */
  forgetIndexedSession(sessionId) {
    this.headers.delete(sessionId);
    this.sessionPaths.delete(sessionId);
    this.invalidSessionPaths.delete(sessionId);
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
    const header = this.headers?.get(sessionId) ?? await this.readSessionHeader(sessionId);
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
            if (errorCode(error) === "ENOENT") continue;
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
      const existed = await pathExists(target.path);
      await rm(target.path, { recursive: true, force: true });
      if (typeof persistence.stat === "function") {
        try {
          const postStat = await persistence.stat(sessionId);
          if (postStat !== void 0) {
            throw new PersistenceStillPresentError(sessionId);
          }
        } catch (error) {
          if (error instanceof PersistenceStillPresentError) throw error;
          const gone = !await pathExists(target.path);
          if (!existed || !gone) {
            throw new Error(
              `cannot verify removal of session "${sessionId}": stat failed and "${target.path}" was not a present artifact removed by this deletion`
            );
          }
          this.ctx.logger.warn(
            `archive-manager: session "${sessionId}" stat check after artifact removal failed; removal confirmed because "${target.path}" existed before rm and is gone now: ${String(error)}`
          );
        }
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
      const record2 = table.get(workspaceId);
      if (record2 === void 0 || !record2.sessionIds.includes(sessionId)) continue;
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
  async deleteDescendants(sessionId, storedHeaders) {
    try {
      const descendants = [];
      const collected = /* @__PURE__ */ new Set();
      const sessions = this.ctx.get("sessions");
      if (sessions !== void 0)
        for (const session of sessions.list()) {
          if (session.header.parentSession === sessionId && session.header.origin === "subagent") {
            descendants.push(session.id);
            collected.add(session.id);
          }
        }
      for (const header of storedHeaders ?? await this.listStoredHeaders()) {
        if (header.parentSession === sessionId && header.origin === "subagent" && !collected.has(header.id)) {
          descendants.push(header.id);
          collected.add(header.id);
        }
      }
      for (const childId of descendants) {
        try {
          if (!await this.sessionKnown(childId)) continue;
          await this.deleteSessionCore(childId, storedHeaders);
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
  /**
   * 判断一个会话是否是真正的母会话已缺失的孤儿子代理：
   * 1. 必须是子代理：origin === "subagent"（天然排除了普通会话和用户 fork 分支）
   * 2. 拥有合法的 parentSession 标识
   * 3. 子代理自身不是正在内存中运行的活跃会话
   * 4. 母会话在当前列表和内存会话中均不存在，且在磁盘上确证工件已缺失（防止母会话因读取故障被误判为已删）
   */
  async isOrphanSubagent(header, knownIds) {
    if (header.origin !== "subagent") return false;
    const parentId = header.parentSession;
    if (typeof parentId !== "string" || parentId.length === 0) return false;
    if (this.ctx.get("sessions")?.get?.(header.id) !== void 0) return false;
    if (knownIds.has(parentId) || this.ctx.get("sessions")?.get?.(parentId) !== void 0) return false;
    if (!await this.sessionArtifactMissing(parentId)) return false;
    if (await this.sessionArtifactMissing(header.id)) return false;
    return true;
  }
  /**
   * 扫描存储中所有母会话已被外部删除的孤儿子代理会话。
   * 必须满足 origin === "subagent"（包含普通与播种型子代理，排除用户 fork），
   * 拥有 parentSession，且该母会话在内存与磁盘工件中均确证已不存在。
   */
  async diagnoseOrphanSubagents() {
    const persistence = this.ctx.get("sessionPersistence");
    if (persistence === void 0 || typeof persistence.list !== "function") {
      return { count: 0, items: [], totalSizeBytes: 0 };
    }
    const storedHeaders = await this.listStoredHeaders();
    const liveSessions = this.ctx.get("sessions")?.list?.() ?? [];
    const knownIds = /* @__PURE__ */ new Set();
    for (const s of liveSessions) knownIds.add(s.id);
    for (const h of storedHeaders) knownIds.add(h.id);
    const orphans = [];
    let totalSizeBytes = 0;
    for (const header of storedHeaders) {
      if (await this.isOrphanSubagent(header, knownIds)) {
        let sizeBytes = 0;
        try {
          if (typeof persistence.locate === "function") {
            const location = persistence.locate(header);
            if (location !== void 0 && typeof location.path === "string") {
              const directory = jsonlSessionDirectory(persistence, header, location);
              const targetPath = directory ?? location.path;
              sizeBytes = await estimatePathSize(targetPath);
            }
          }
        } catch {
          sizeBytes = 0;
        }
        totalSizeBytes += sizeBytes;
        orphans.push({
          sessionId: header.id,
          parentSessionId: header.parentSession,
          createdAt: typeof header.createdAt === "number" ? header.createdAt : 0,
          sizeBytes
        });
      }
    }
    return {
      count: orphans.length,
      items: orphans,
      totalSizeBytes
    };
  }
  /**
   * 物理清理孤儿子代理会话。
   * 支持传入指定的 sessionIds，若未传则清理当前诊断出的全部孤儿子代理。
   * 显式传入 ID 也会严格校验是否符合孤儿特征，母会话尚存的子代理将被安全跳过。
   */
  async cleanOrphanSubagents(target) {
    return this.enqueueOperation(async () => {
      const candidateIds = target?.sessionIds ?? (await this.diagnoseOrphanSubagents()).items.map((item) => item.sessionId);
      const cleanedSessionIds = [];
      const skippedSessionIds = [];
      const failures = [];
      const storedHeaders = await this.listStoredHeaders();
      const liveSessions = this.ctx.get("sessions")?.list?.() ?? [];
      const knownIds = /* @__PURE__ */ new Set();
      for (const s of liveSessions) knownIds.add(s.id);
      for (const h of storedHeaders) knownIds.add(h.id);
      for (const sessionId of candidateIds) {
        try {
          const header = this.headers?.get(sessionId) ?? storedHeaders.find((h) => h.id === sessionId);
          if (!header || !await this.isOrphanSubagent(header, knownIds)) {
            skippedSessionIds.push(sessionId);
            continue;
          }
          await this.deleteSessionCore(sessionId, storedHeaders);
          cleanedSessionIds.push(sessionId);
        } catch (error) {
          failures.push({ sessionId, message: errorMessage(error) });
        }
      }
      return { cleanedSessionIds, skippedSessionIds, failures };
    });
  }
};
const workspaceOverlay = Symbol.for("dsh-archive-manager.workspace-overlay");
const remoteMethodDescriptor = "@deepseek-ai/dsh-typert-protocol/remote-methods";
function markOverlayMethods(registry, methods) {
  const raw = Reflect.get(registry, symbols.original) ?? registry;
  const prototype = Object.getPrototypeOf(raw);
  if (prototype === null) return () => {
  };
  const before = Object.getOwnPropertyDescriptor(prototype, remoteMethodDescriptor);
  const marked = /* @__PURE__ */ new Set();
  for (const marker of Reflect.get(before?.value ?? {}, "methods") ?? []) {
    if (typeof marker.method === "string") marked.add(marker.method);
  }
  for (const method of methods) {
    if (marked.has(method)) continue;
    markRemoteMethod(raw, method);
  }
  return () => {
    if (before === void 0) delete prototype[remoteMethodDescriptor];
    else Object.defineProperty(prototype, remoteMethodDescriptor, before);
  };
}
function bindOverlayRemote(registry) {
  const raw = Reflect.get(registry, symbols.original) ?? registry;
  if (Reflect.get(raw, "typertRemote") !== void 0) return () => {
  };
  const name = Reflect.get(raw, "name");
  const serviceKey = typeof name === "string" ? name : "workspaceRegistry";
  Reflect.set(raw, "typertRemote", bindTypertRemote(raw, serviceKey));
  return () => {
    Reflect.deleteProperty(raw, "typertRemote");
  };
}
function installArchiveWorkspace(registry) {
  const overlay = registry;
  if (overlay[workspaceOverlay] === true) return () => {
  };
  if (registry instanceof ArchiveWorkspaceRegistry) return () => {
  };
  const target = overlay;
  const restoreRemote = bindOverlayRemote(registry);
  const originalUnarchive = target.unarchiveSession;
  const unarchiveDescriptor = Object.getOwnPropertyDescriptor(target, "unarchiveSession");
  const restoredMethods = [];
  const copiedMethods = [];
  for (const name of Object.getOwnPropertyNames(ArchiveWorkspaceRegistry.prototype)) {
    if (name === "constructor") continue;
    const method = Reflect.get(ArchiveWorkspaceRegistry.prototype, name);
    if (typeof method !== "function") continue;
    restoredMethods.push({ name, hadOwn: Object.hasOwn(target, name), previous: target[name] });
    if (name === "unarchiveSession") {
      Object.defineProperty(target, name, {
        configurable: unarchiveDescriptor?.configurable ?? true,
        enumerable: unarchiveDescriptor?.enumerable ?? true,
        writable: true,
        value: async function(sessionId) {
          await originalUnarchive.call(this, sessionId);
          return { archivedSessionIds: [...this.requireState().archivedSessionIds] };
        }
      });
    } else target[name] = method;
    copiedMethods.push(name);
  }
  const restoreMarkers = markOverlayMethods(registry, ARCHIVE_REMOTE_METHODS.filter((method) => copiedMethods.includes(method)));
  target[workspaceOverlay] = true;
  return () => {
    if (target[workspaceOverlay] !== true) return;
    restoreMarkers();
    restoreRemote();
    for (const item of restoredMethods.reverse()) {
      if (item.name === "unarchiveSession" && unarchiveDescriptor !== void 0) Object.defineProperty(target, item.name, unarchiveDescriptor);
      else if (item.hadOwn) target[item.name] = item.previous;
      else delete target[item.name];
    }
    delete target[workspaceOverlay];
  };
}
export {
  ArchiveWorkspaceRegistry,
  bindArchiveManagerRemote,
  ArchiveWorkspaceRegistry as default,
  installArchiveWorkspace
};
