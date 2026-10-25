import { errorMessage } from "./contracts.js";
import { cacheDiagnosisSchema, cacheRebuildSchema } from "./cache-rebuild-contract.js";
function createCacheRebuildController(api) {
  let state = { diagnosis: { count: 0, items: [] }, busy: false, progress: null, result: null, error: null, refreshError: null };
  let active = true, sequence = 0, retry = [];
  const listeners = /* @__PURE__ */ new Set();
  const update = (value) => {
    if (!active) return;
    state = { ...state, ...value };
    for (const fn of listeners) fn();
  };
  const load = async () => {
    if (!active) return;
    const current = ++sequence;
    try {
      const diagnosis = cacheDiagnosisSchema.parse(await api.diagnose());
      if (active && current === sequence) update({ diagnosis, error: null });
    } catch (error) {
      if (active && current === sequence) update({ error: errorMessage(error) });
    }
  };
  return {
    snapshot: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    load,
    async run(failedOnly = false) {
      if (!active || state.busy) return;
      ++sequence;
      const items = failedOnly ? [...retry] : [...state.diagnosis.items];
      const result = { rebuiltSessionIds: [], skippedSessionIds: [], failures: [] };
      retry = [];
      update({ busy: true, result: null, error: null, refreshError: null, progress: { done: 0, total: items.length } });
      for (const [index, item] of items.entries()) {
        if (!active) return;
        try {
          const value = cacheRebuildSchema.parse(await api.rebuild({ items: [item] }));
          if (!active) return;
          result.rebuiltSessionIds.push(...value.rebuiltSessionIds);
          result.skippedSessionIds.push(...value.skippedSessionIds);
          result.failures.push(...value.failures);
          if (value.failures.length) retry.push(item);
        } catch (error) {
          if (!active) return;
          result.failures.push({ sessionId: item.sessionId, message: errorMessage(error) });
          retry.push(item);
        }
        update({ progress: { done: index + 1, total: items.length } });
      }
      update({ result });
      try {
        await api.refresh();
      } catch (error) {
        update({ refreshError: errorMessage(error) });
      }
      if (!active) return;
      await load();
      update({ busy: false, progress: null });
    },
    dispose() {
      active = false;
      ++sequence;
      listeners.clear();
    }
  };
}
export {
  createCacheRebuildController
};
