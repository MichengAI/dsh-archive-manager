import { bindArchiveManagerRemote, installArchiveWorkspace, tolerateStaleFileUploadResolver } from "./workspace.js";
import { installArchiveProjectionCache, installArchiveProjectionCacheGuards } from "./projcache.js";
const inject = ["workspaceRegistry", "sessionProjectionCache", "typert"];
async function apply(ctx) {
  tolerateStaleFileUploadResolver(ctx);
  const registry = ctx.workspaceRegistry;
  const cache = ctx.sessionProjectionCache;
  const uninstallWorkspace = installArchiveWorkspace(registry);
  let uninstallCache = async () => {
  };
  try {
    uninstallCache = await installArchiveProjectionCache(cache);
  } catch (error) {
    ctx.logger?.warn?.(`archive-manager: projection cache overlay skipped: ${String(error)}`);
    uninstallCache = installArchiveProjectionCacheGuards(cache);
  }
  const unbindRemote = bindArchiveManagerRemote(ctx);
  return async () => {
    unbindRemote();
    try {
      await uninstallCache();
    } finally {
      uninstallWorkspace();
    }
  };
}
export {
  apply,
  inject
};
