import { record } from "./contracts.js";
import type { Schema, SessionSummary, BatchOptions, BatchResult, OrganizerServices, OrganizeKind, OrganizeOptions } from "./contracts.js";
/** 收藏及批量整理共用的校验与业务规则；不依赖浏览器或宿主实例。 */
function checkedId(value: unknown) {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) throw new TypeError("会话 ID 长度须为 1～1024 个字符");
  return value;
}

export const favoriteInputSchema = {
  parse(input: unknown) {
    const value = record(input);
    if (!value || typeof value !== "object" || typeof value.favorite !== "boolean") throw new TypeError("收藏状态必须为布尔值");
    return { sessionId: checkedId(value.sessionId), favorite: value.favorite };
  }
};

export const favoriteStateSchema = {
  parse(input: unknown) {
    const value = record(input);
    if (!value || !Array.isArray(value.favoriteSessionIds) || value.favoriteSessionIds.length > 100000) throw new TypeError("收藏集合无效");
    return { favoriteSessionIds: [...new Set(value.favoriteSessionIds.map(checkedId))] };
  },
  safeParse(value: unknown) {
    try { return { success: true, data: this.parse(value) }; }
    catch (error) { return { success: false, error }; }
  }
};

/** 宿主与客户端使用同一份描述符，防止两端接口漂移。 */
export function favoriteInvocations() {
  const codec = (name: string, schema: Schema<unknown>) => ({ mode: "strict", typeSymbol: `@michengai/dsh-archive-manager/types#${name}`, create: () => schema, schema });
  return ["favoriteSessions", "setSessionFavorite"].map((method) => ({
    id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`,
    service: "workspaceRegistry", namespace: "workspaceRegistry", method,
    invocation: { kind: "direct" },
    parameters: method === "favoriteSessions" ? [] : [{ name: "input", wire: "input", source: "json", codec: codec("FavoriteInput", favoriteInputSchema) }],
    result: codec("FavoriteState", favoriteStateSchema),
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  }));
}

/** 闲置归档只接受有效时间；执行前也复核此规则，避免归档刚恢复活动的会话。 */
export function idleArchiveCandidate(session: SessionSummary | undefined, { days, now = Date.now(), favorites = new Set(), currentId, pending = new Map() }: { days: number; now?: number; favorites?: ReadonlySet<string>; currentId?: string; pending?: ReadonlyMap<string, unknown> }) {
  if (!session || !Number.isInteger(days) || days < 1 || days > 36500) return false;
  if (favorites.has(session.id) || session.id === currentId || (session.retainedBy?.mainView ?? 0) > 0) return false;
  if (session.running || (session.runningSubagentCount ?? 0) > 0 || session.pendingInteraction != null || pending.has(session.id)) return false;
  const updated = typeof session.updatedAt === "number" ? session.updatedAt : Date.parse(session.updatedAt ?? "");
  return Number.isFinite(updated) && updated <= now - days * 86400000;
}

/**
 * 串行批量操作：首个失败后停下，已成功项绝不重新执行；返回重试和撤回所需的精确集合。
 * @param ids 会话 ID 列表。
 * @param operate 单条操作，返回 true 表示本次确实改变状态，false 表示跳过。
 * @param options 进度回调及结束后的列表刷新。
 */
export async function runSessionBatch(ids: readonly string[], operate: (id: string) => Promise<boolean>, { onProgress, refresh }: BatchOptions = {}) {
  const requested = [...new Set(ids.map(checkedId))];
  const result: BatchResult = { requested, succeeded: [], skipped: [], failures: [], unprocessed: [], remaining: [], refreshError: null };
  const report = () => onProgress?.({ total: requested.length, done: result.succeeded.length + result.skipped.length + result.failures.length, succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length });
  report();
  for (const [index, id] of requested.entries()) {
    try {
      (await operate(id) ? result.succeeded : result.skipped).push(id);
    } catch (error) {
      result.failures.push({ sessionId: id, message: error instanceof Error ? error.message : String(error) });
      result.unprocessed = requested.slice(index + 1);
      result.remaining = requested.slice(index);
      report();
      break;
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
        const snapshot = sessions.getSnapshot();
        const session = snapshot.byId[id];
        if (!session) return false;
        if (options.idleDays !== undefined) {
          const favorites = new Set((await getFavorites()).favoriteSessionIds);
          // 收藏查询期间状态也可能变化，因此在真正写入前重新取会话投影。
          const latest = sessions.getSnapshot();
          if (!idleArchiveCandidate(latest.byId[id], { days: options.idleDays, favorites, currentId: currentSessionId(latest), pending: options.getPending?.() ?? options.pending })) return false;
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
