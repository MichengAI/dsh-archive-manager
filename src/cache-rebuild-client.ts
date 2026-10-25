import { errorMessage } from "./contracts.js";
import { cacheDiagnosisSchema, cacheRebuildSchema } from "./cache-rebuild-contract.js";
import type { CacheCandidate, CacheDiagnosis, CacheRebuildResult } from "./cache-rebuild-contract.js";
export interface CacheRepairState {
  diagnosis: CacheDiagnosis; busy: boolean; progress: { done: number; total: number } | null;
  result: CacheRebuildResult | null; error: string | null; refreshError: string | null;
}
/** 页面局部状态：每条会话单独调用 RPC，仅重试失败项，卸载后不再开始后续处理。 */
export function createCacheRebuildController(api: {
  diagnose(): Promise<CacheDiagnosis>; rebuild(input: { items: CacheCandidate[] }): Promise<CacheRebuildResult>; refresh(): Promise<unknown>;
}) {
  let state: CacheRepairState = { diagnosis: { count: 0, items: [] }, busy: false, progress: null, result: null, error: null, refreshError: null };
  let active = true, sequence = 0, retry: CacheCandidate[] = [];
  const listeners = new Set<() => void>();
  const update = (value: Partial<CacheRepairState>) => { if (!active) return; state = { ...state, ...value }; for (const fn of listeners) fn(); };
  const load = async () => {
    if (!active) return;
    const current = ++sequence;
    try { const diagnosis = cacheDiagnosisSchema.parse(await api.diagnose()); if (active && current === sequence) update({ diagnosis, error: null }); }
    catch (error) { if (active && current === sequence) update({ error: errorMessage(error) }); }
  };
  return {
    snapshot: () => state,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    load,
    async run(failedOnly = false) {
      if (!active || state.busy) return;
      ++sequence;
      const items = failedOnly ? [...retry] : [...state.diagnosis.items];
      const result: CacheRebuildResult = { rebuiltSessionIds: [], skippedSessionIds: [], failures: [] };
      retry = [];
      update({ busy: true, result: null, error: null, refreshError: null, progress: { done: 0, total: items.length } });
      for (const [index, item] of items.entries()) {
        if (!active) return;
        try {
          const value = cacheRebuildSchema.parse(await api.rebuild({ items: [item] }));
          if (!active) return;
          result.rebuiltSessionIds.push(...value.rebuiltSessionIds); result.skippedSessionIds.push(...value.skippedSessionIds); result.failures.push(...value.failures);
          if (value.failures.length) retry.push(item);
        } catch (error) { if (!active) return; result.failures.push({ sessionId: item.sessionId, message: errorMessage(error) }); retry.push(item); }
        update({ progress: { done: index + 1, total: items.length } });
      }
      update({ result });
      try { await api.refresh(); } catch (error) { update({ refreshError: errorMessage(error) }); }
      if (!active) return;
      await load();
      update({ busy: false, progress: null });
    },
    dispose() { active = false; ++sequence; listeners.clear(); },
  };
}
