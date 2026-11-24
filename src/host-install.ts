import type { Context } from "@deepseek-ai/cordis";
import { bindArchiveManagerRemote, installArchiveWorkspace } from "./workspace.js";
import { installSessionLifecycle } from "./session-lifecycle.js";

/**
 * 根宿主安装入口。官方 workspace 与 sessionProjectionCache 保持原样，
 * 归档能力装在官方 workspace 实例上；本服务停用时卸下，workspaceController 仍能创建工作区。
 */
const inject = ["workspaceRegistry", "sessionPersistence", "typert"];

async function apply(ctx: Context) {
	const registry = ctx.workspaceRegistry;
	const uninstallWorkspace = installArchiveWorkspace(registry);
	let unbindRemote = () => {};
	let uninstallLifecycle = () => {};

	if (typeof ctx.inject === "function") {
		ctx.inject(["agents"], (agentCtx) => {
			uninstallLifecycle = installSessionLifecycle(agentCtx as unknown as { agents?: unknown });
			return () => {
				uninstallLifecycle();
			};
		});
	} else if (ctx.get?.("agents") || (ctx as unknown as { agents?: unknown }).agents) {
		uninstallLifecycle = installSessionLifecycle(ctx as unknown as { agents?: unknown });
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

export { apply, inject };
