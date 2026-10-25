import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";
const inject = ["workspaceRegistry", "sessionPersistence", "typert"];
async function apply(ctx) {
  const registry = ctx.workspaceRegistry;
  const uninstallWorkspace = installArchiveWorkspace(registry);
  let unbindRemote = () => {
  };
  const dispose = async () => {
    try {
      unbindRemote();
    } finally {
      uninstallWorkspace();
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
