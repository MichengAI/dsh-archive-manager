import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";
import { installSessionLifecycle } from "./session-lifecycle.js";
const inject = ["workspaceRegistry", "sessionPersistence", "typert"];
async function apply(ctx) {
  const registry = ctx.workspaceRegistry;
  const uninstallWorkspace = installArchiveWorkspace(registry);
  let unbindRemote = () => {
  };
  let uninstallLifecycle = () => {
  };
  if (typeof ctx.inject === "function") {
    ctx.inject(["agents"], (agentCtx) => {
      uninstallLifecycle = installSessionLifecycle(agentCtx);
      return () => {
        uninstallLifecycle();
      };
    });
  } else if (ctx.get?.("agents") || ctx.agents) {
    uninstallLifecycle = installSessionLifecycle(ctx);
  }
  const dispose = async () => {
    try {
      unbindRemote();
    } finally {
      try {
        uninstallLifecycle();
      } finally {
        uninstallWorkspace();
      }
    }
  };
  try {
    unbindRemote = bindArchiveManagerRemote(ctx);
  } catch (error) {
    await dispose();
    throw error;
  }
  return dispose;
}
export {
  apply,
  inject
};
