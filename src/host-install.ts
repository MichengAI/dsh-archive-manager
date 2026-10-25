import type { Context } from "@deepseek-ai/cordis";
import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";

/**
 * 根宿主安装入口。官方 workspace 与 sessionProjectionCache 保持原样，
 * 归档能力装在官方 workspace 实例上；本服务停用时卸下，workspaceController 仍能创建工作区。
 */
const inject = ["workspaceRegistry", "sessionPersistence", "typert"];

async function apply(ctx: Context) {
	const registry = ctx.workspaceRegistry;
	const uninstallWorkspace = installArchiveWorkspace(registry);
	let unbindRemote = () => {};
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

export { apply, inject };
