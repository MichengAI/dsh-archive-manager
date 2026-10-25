import { archiveCodec, record, remoteInvocation } from "./contracts.js";
const isSessionId = (value) => typeof value === "string" && value.length > 0 && value.length <= 1024;
function checkedId(value) {
  if (!isSessionId(value)) throw new TypeError("\u4F1A\u8BDD ID \u957F\u5EA6\u987B\u4E3A 1\uFF5E1024 \u4E2A\u5B57\u7B26");
  return value;
}
function sessionIdSet(values) {
  return [...new Set(values.filter(isSessionId))];
}
function idSetSchema(field, label) {
  return {
    parse(input) {
      const value = record(input);
      const list = value[field];
      if (!Array.isArray(list) || list.length > 1e5) throw new TypeError(label);
      return { [field]: [...new Set(list.map(checkedId))] };
    },
    safeParse(value) {
      try {
        return { success: true, data: this.parse(value) };
      } catch (error) {
        return { success: false, error };
      }
    }
  };
}
const favoriteInputSchema = {
  parse(input) {
    const value = record(input);
    if (!value || typeof value !== "object" || typeof value.favorite !== "boolean") throw new TypeError("\u6536\u85CF\u72B6\u6001\u5FC5\u987B\u4E3A\u5E03\u5C14\u503C");
    return { sessionId: checkedId(value.sessionId), favorite: value.favorite };
  }
};
const favoriteStateSchema = idSetSchema("favoriteSessionIds", "\u6536\u85CF\u96C6\u5408\u65E0\u6548");
function favoriteInvocations() {
  return ["favoriteSessions", "setSessionFavorite"].map((method) => remoteInvocation(method, {
    parameters: method === "favoriteSessions" ? [] : [{ name: "input", wire: "input", source: "json", codec: archiveCodec("FavoriteInput", favoriteInputSchema) }],
    result: archiveCodec("FavoriteState", favoriteStateSchema)
  }));
}
const scheduledSetSchema = idSetSchema("scheduledSessionIds", "\u5B9A\u65F6\u4EFB\u52A1\u4F1A\u8BDD\u96C6\u5408\u65E0\u6548");
function scheduledInvocations() {
  return [remoteInvocation("scheduledSessionIds", { result: archiveCodec("ScheduledSessionIds", scheduledSetSchema) })];
}
function idleArchiveCandidate(session, { days, now = Date.now(), favorites = /* @__PURE__ */ new Set(), currentId, pending = /* @__PURE__ */ new Map(), scheduled }) {
  if (!session || !Number.isInteger(days) || days < 1 || days > 36500) return false;
  if (favorites.has(session.id) || session.id === currentId || (session.retainedBy?.mainView ?? 0) > 0) return false;
  if (scheduled?.has(session.id)) return false;
  if (session.running || (session.runningSubagentCount ?? 0) > 0 || session.pendingInteraction != null || pending.has(session.id)) return false;
  const updated = typeof session.updatedAt === "number" ? session.updatedAt : Date.parse(session.updatedAt ?? "");
  return Number.isFinite(updated) && updated <= now - days * 864e5;
}
async function runSessionBatch(ids, operate, { onProgress, refresh } = {}) {
  const requested = [...new Set(ids.map(checkedId))];
  const result = { requested, succeeded: [], skipped: [], failures: [], remaining: [], refreshError: null };
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
  try {
    await refresh?.();
  } catch (error) {
    result.refreshError = error instanceof Error ? error.message : String(error);
  }
  return result;
}
function createSessionOrganizer({ workspaces, sessions, archive, restore, deleteOne, getFavorites, refresh, currentSessionId }) {
  return async (kind, ids, options = {}) => {
    if (!["archive", "restore", "undo", "delete"].includes(kind)) throw new TypeError("\u672A\u77E5\u6279\u91CF\u64CD\u4F5C");
    return runSessionBatch(ids, async (id) => {
      const before = workspaces.getSnapshot();
      const archived = before.archivedSessionIds.includes(id);
      if (kind === "archive") {
        if (archived) return false;
        if (options.skipScheduled?.has(id)) return false;
        const snapshot = sessions.getSnapshot();
        const session = snapshot.byId[id];
        if (!session) return false;
        if (options.idleDays !== void 0) {
          const favorites = new Set((await getFavorites()).favoriteSessionIds);
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
export {
  createSessionOrganizer,
  favoriteInputSchema,
  favoriteInvocations,
  favoriteStateSchema,
  idleArchiveCandidate,
  runSessionBatch,
  scheduledInvocations,
  scheduledSetSchema,
  sessionIdSet
};
