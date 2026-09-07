import { registerPluginUpdater } from "./plugin-updater.js";
const inject = ["webServer"];
function apply(ctx) {
  return registerPluginUpdater(ctx, {
    endpoint: "/api/michengai/dsh-archive-manager/update",
    packageName: "@michengai/dsh-archive-manager",
    manifestUrl: new URL("../package.json", import.meta.url)
  });
}
export {
  apply,
  inject
};
