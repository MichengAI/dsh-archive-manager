import { archiveCodec, record } from "./contracts.js";
import type { SessionSummary, BatchOptions, BatchResult, OrganizerServices, OrganizeKind, OrganizeOptions } from "./contracts.js";
/** 收藏及批量整理共用的校验与业务规则；不依赖浏览器或宿主实例。 */
function checkedId(value: unknown) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) throw new TypeError("会话 ID 长度须为 1～1024 个字符");
  return value;
}

/** 会话 ID 集合的宽松收口：逐项按 checkedId 规则校验（非法项只影响自身），并去重。 */
export function sessionIdSet(values: readonly unknown[]) {
  const kept: string[] = [];
  for (const value of values) {
    try { kept.push(checkedId(value)); } catch { /* 非法 ID 跳过，不影响其它会话 */ }
  }
  return [...new Set(kept)];
}

/** 会话 ID 集合 schema 工厂：字段名与错误文案不同，校验规则完全一致。 */
function idSetSchema<F extends "favoriteSessionIds" | "scheduledSessionIds">(field: F, label: string) {
  return {
    parse(input: unknown): { [K in F]: string[] } {
      const value = record(input);
      const list = value[field];
      if (!Array.isArray(list) || list.length > 100000) throw new TypeError(label);
      return { [field]: [...new Set(list.map(checkedId))] } as { [K in F]: string[] };
    },
    safeParse(value: unknown) {
      try { return { success: true, data: this.parse(value) }; }
      catch (error) { return { success: false, error }; }
    }
  };
}

export const favoriteInputSchema = {
  parse(input: unknown) {
    const value = record(input);
    if (!value || typeof value !== "object" || typeof value.favorite !== "boolean") throw new TypeError("收藏状态必须为布尔值");
    return { sessionId: checkedId(value.sessionId), favorite: value.favorite };
  }
};

export const favoriteStateSchema = idSetSchema("favoriteSessionIds", "收藏集合无效");

/** 宿主与客户端使用同一份描述符，防止两端接口漂移。 */
export function favoriteInvocations() {
  return ["favoriteSessions", "setSessionFavorite"].map((method) => ({
    id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`,
    service: "workspaceRegistry", namespace: "workspaceRegistry", method,
    invocation: { kind: "direct" },
    parameters: method === "favoriteSessions" ? [] : [{ name: "input", wire: "input", source: "json", codec: archiveCodec("FavoriteInput", favoriteInputSchema) }],
    result: archiveCodec("FavoriteState", favoriteStateSchema),
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  }));
}

/** 只读查询：当前绑定了活动定时任务的会话 ID 集合。宿主 schedule 服务缺失时返回空集合。 */
export const scheduledSetSchema = idSetSchema("scheduledSessionIds", "定时任务会话集合无效");

/** 宿主与客户端共用同一份描述符，避免两端接口漂移。 */
export function scheduledInvocations() {
  return [{
    id: "@michengai/dsh-archive-manager#workspaceRegistry/scheduledSessionIds",
    service: "workspaceRegistry", namespace: "workspaceRegistry", method: "scheduledSessionIds",
    invocation: { kind: "direct" },
    parameters: [],
    result: archiveCodec("ScheduledSessionIds", scheduledSetSchema),
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  }];
}

/** 热路径上的空集合常量：每次调用都新建空 Set 会放大渲染开销。 */
const NO_SCHEDULED: ReadonlySet<string> = new Set();

/** 闲置归档只接受有效时间；执行前也复核此规则，避免归档刚恢复活动的会话。 */
export function idleArchiveCandidate(session: SessionSummary | undefined, { days, now = Date.now(), favorites = new Set(), currentId, pending = new Map(), scheduled = NO_SCHEDULED }: { days: number; now?: number; favorites?: ReadonlySet<string>; currentId?: string; pending?: ReadonlyMap<string, unknown>; scheduled?: ReadonlySet<string> }) {
  if (!session || !Number.isInteger(days) || days < 1 || days > 36500) return false;
  if (favorites.has(session.id) || session.id === currentId || (session.retainedBy?.mainView ?? 0) > 0) return false;
  // 绑定了活动定时任务的会话不进候选：归档会连带删除任务，属于不可逆的数据损失。
  if (scheduled.has(session.id)) return false;
  if (session.running || (session.runningSubagentCount ?? 0) > 0 || session.pendingInteraction != null || pending.has(session.id)) return false;
  const updated = typeof session.updatedAt === "number" ? session.updatedAt : Date.parse(session.updatedAt ?? "");
  return Number.isFinite(updated) && updated <= now - days * 86400000;
}

/**
 * 串行批量操作：单条失败记下原因并继续后续，已成功项绝不重新执行。
 * remaining 只含失败项，供重试。
 * @param ids 会话 ID 列表。
 * @param operate 单条操作，返回 true 表示本次确实改变状态，false 表示跳过。
 * @param options 进度回调及结束后的列表刷新。
 */
export async function runSessionBatch(ids: readonly string[], operate: (id: string) => Promise<boolean>, { onProgress, refresh }: BatchOptions = {}) {
  const requested = [...new Set(ids.map(checkedId))];
  const result: BatchResult = { requested, succeeded: [], skipped: [], failures: [], remaining: [], refreshError: null };
  const report = () => onProgress?.({ total: requested.length, done: result.succeeded.length + result.skipped.length + result.failures.length, succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length });
  report();
  for (const id of requested) {
    try {
      (await operate(id) ? result.succeeded : result.skipped).push(id);
    } catch (error) {
      result.failures.push({ sessionId: id, message: error instanceof Error ? error.message : String(error) });
      result.remaining.push(id);
    }
    report();
  }
  try { await refresh?.(); }
  catch (error) { result.refreshError = error instanceof Error ? error.message : String(error); }
  return result;
}

/** 把官方单条操作组合为可报告结果的批量任务，不并发改写宿主状态。 */
export function createSessionOrganizer({ workspaces, sessions, archive, restore, deleteOne, getFavorites, refresh, currentSessionId }: OrganizerServices) {
  return async (kind: OrganizeKind, ids: readonly string[], options: OrganizeOptions = {}) => {
    if (!["archive", "restore", "undo", "delete"].includes(kind)) throw new TypeError("未知批量操作");
    return runSessionBatch(ids, async (id) => {
      const before = workspaces.getSnapshot();
      const archived = before.archivedSessionIds.includes(id);
      if (kind === "archive") {
        if (archived) return false;
        // 安全底线：即使界面没预筛，绑定了定时任务的会话也绝不进入归档路径，
        // 否则宿主的 stopActivity 会连带删除任务。
        if (options.skipScheduled?.has(id)) return false;
        const snapshot = sessions.getSnapshot();
        const session = snapshot.byId[id];
        if (!session) return false;
        if (options.idleDays !== undefined) {
          const favorites = new Set((await getFavorites()).favoriteSessionIds);
          // 收藏查询期间状态也可能变化，因此在真正写入前重新取会话投影。
          const latest = sessions.getSnapshot();
          if (!idleArchiveCandidate(latest.byId[id], { days: options.idleDays, favorites, currentId: currentSessionId(latest), pending: options.getPending?.() ?? options.pending, scheduled: options.skipScheduled })) return false;
        }
        await archive(id);
        return workspaces.getSnapshot().archivedSessionIds.includes(id);
      }
      if (!archived) return false;
      if (kind === "delete") {
        await deleteOne(id);
        return true;
      }
      const value = await restore(id);
      const remaining = value?.archivedSessionIds ?? workspaces.getSnapshot().archivedSessionIds;
      return !remaining.includes(id);
    }, { onProgress: options.onProgress, refresh });
  };
}
