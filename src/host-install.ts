import type { Context } from "@deepseek-ai/cordis";
import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";
import { installArchiveProjectionCache } from "./projcache.js";

/**
 * 根宿主安装入口。官方 workspace 与 sessionProjectionCache 保持运行，
 * 归档能力装在它们的实例上；本服务停用时卸下，workspaceController 仍能创建工作区。
 */
const inject = ["workspaceRegistry", "sessionProjectionCache", "typert"];

async function apply(ctx: Context) {
	const registry = ctx.workspaceRegistry;
	const cache = ctx.sessionProjectionCache;
	const uninstallWorkspace = installArchiveWorkspace(registry);
	let uninstallCache: () => void = () => {};
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

export { apply, inject };
