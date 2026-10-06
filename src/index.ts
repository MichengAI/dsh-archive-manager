import type { Context } from "@deepseek-ai/cordis";
//#region lib/types/index.js
/**
 * @michengai/dsh-archive-manager 根宿主入口。
 *
 * 发布包是单个 DSH 插件。三个运行时模块通过根包子路径导出：
 *
 * - `./workspace`：归档能力，装到官方 workspaceRegistry 上。
 * - `./projcache`：安全投影缓存，装到官方 sessionProjectionCache 上。
 * - `./host`：启用时安装上述能力，停用时卸下。
 * - `./client`：已归档会话管理浏览器客户端 bundle。
 *
 * 根入口对应 `ui-workspace-archive-manager` 服务行。浏览器端由 package.json
 * 的 `dsh.client` 声明发现，因此该宿主入口无需额外行为。
 */
import { registerPluginUpdater } from "./plugin-updater.js";

const inject = ["webServer"];

function apply(ctx: Context) {
	return registerPluginUpdater(ctx, {
		endpoint: "/api/michengai/dsh-archive-manager/update",
		packageName: "@michengai/dsh-archive-manager",
		manifestUrl: new URL("../package.json", import.meta.url),
	});
}
//#endregion
export { apply, inject };
