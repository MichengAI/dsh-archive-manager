import { bindArchiveManagerRemote, installArchiveWorkspace, tolerateStaleFileUploadResolver } from "./workspace.js";
import { installArchiveProjectionCache } from "./projcache.js";
const inject = ["workspaceRegistry", "sessionProjectionCache", "typert"];
async function apply(ctx) {
  tolerateStaleFileUploadResolver(ctx);
  const registry = ctx.workspaceRegistry;
  const cache = ctx.sessionProjectionCache;
  const uninstallWorkspace = installArchiveWorkspace(registry);
  let uninstallCache = () => {
  };
  try {
    uninstallCache = await installArchiveProjectionCache(cache);
  } catch (error) {
    ctx.logger?.warn?.(`archive-manager: projection cache overlay skipped: ${String(error)}`);
  }
  const unbindRemote = bindArchiveManagerRemote(ctx);
  return () => {
    unbindRemote();
    uninstallCache();
    uninstallWorkspace();
  };
}
export {
  apply,
  inject
};
