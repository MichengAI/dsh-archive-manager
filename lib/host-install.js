import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";
import { installArchiveProjectionCache } from "./projcache.js";
const inject = ["workspaceRegistry", "sessionProjectionCache", "typert"];
async function apply(ctx) {
  const registry = ctx.workspaceRegistry;
  const cache = ctx.sessionProjectionCache;
  const uninstallWorkspace = installArchiveWorkspace(registry);
  let uninstallCache = () => {
  };
  try {
    uninstallCache = await installArchiveProjectionCache(cache);
    bindArchiveManagerRemote(ctx);
    return () => {
      uninstallCache();
      uninstallWorkspace();
    };
  } catch (error) {
    uninstallCache();
    uninstallWorkspace();
    throw error;
  }
}
export {
  apply,
  inject
};
