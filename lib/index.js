import { registerPluginUpdater } from "./plugin-updater.js";
import { apply as installHost, inject as hostInject } from "./host-install.js";
const inject = ["webServer", ...hostInject];
async function apply(ctx) {
  let disposeUpdater = () => {
  };
  try {
    disposeUpdater = registerPluginUpdater(ctx, {
      endpoint: "/api/michengai/dsh-archive-manager/update",
      packageName: "@michengai/dsh-archive-manager",
      manifestUrl: new URL("../package.json", import.meta.url)
    });
  } catch (error) {
    ctx.logger?.warn?.(`archive-manager: update route skipped: ${String(error)}`);
  }
  const disposeHost = await installHost(ctx);
  return async () => {
    disposeUpdater();
    await disposeHost();
  };
}
export {
  apply,
  inject
};
