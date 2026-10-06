import type { Context } from "@deepseek-ai/cordis";
import { bindArchiveManagerRemote, installArchiveWorkspace, tolerateStaleFileUploadResolver } from "./workspace.js";
import { installArchiveProjectionCache, installArchiveProjectionCacheGuards } from "./projcache.js";

/**
 * 根宿主安装入口。官方 workspace 与 sessionProjectionCache 保持运行，
 * 归档能力装在它们的实例上；本服务停用时卸下，workspaceController 仍能创建工作区。
 */
const inject = ["workspaceRegistry", "sessionProjectionCache", "typert"];

async function apply(ctx: Context) {
	// 与子类入口同样在服务上装冲突容忍：热重载后残留的 fileUploads 解析器可被替换。
	// 该包装按符号标记幂等，属于宿主生命周期的兼容修补，停用时不回滚（与子类入口一致）。
	tolerateStaleFileUploadResolver(ctx);
	const registry = ctx.workspaceRegistry;
	const cache = ctx.sessionProjectionCache;
	const uninstallWorkspace = installArchiveWorkspace(registry);
	let uninstallCache: () => Promise<void> = async () => {};
	let unbindRemote = () => {};
	const dispose = async () => {
		try {
			unbindRemote();
		} finally {
			try {
				await uninstallCache();
			} finally {
				uninstallWorkspace();
			}
		}
	};
	try {
		try {
			uninstallCache = await installArchiveProjectionCache(cache);
		} catch (error) {
			ctx.logger?.warn?.(`archive-manager: projection cache overlay skipped: ${String(error)}`);
			uninstallCache = installArchiveProjectionCacheGuards(cache);
		}
		unbindRemote = bindArchiveManagerRemote(ctx);
	} catch (error) {
		await dispose();
		throw error;
	}
	return dispose;
}

export { apply, inject };
