import { spawn } from "node:child_process";

export type NativeCommandModule = {
	revealNativePath?: (path: string) => Promise<unknown>;
};

export type NativeSpawner = (file: string, args: string[]) => { unref(): void };

/**
 * 跨平台前台唤起系统文件管理器并选中目标路径。
 * 优先调用 DSH 官方导出的 @deepseek-ai/dsh-native-command，
 * 若环境未挂载则平滑退化为系统原生 spawn。
 */
export async function revealPathInSystem(
	targetPath: string,
	injectedModule?: NativeCommandModule,
	spawner?: NativeSpawner
): Promise<{ ok: boolean; via: "native-command" | "spawn" }> {
	try {
		const spec = "@deepseek-ai/dsh-native-command";
		const mod: NativeCommandModule = injectedModule ?? (await (import(spec) as Promise<NativeCommandModule>).catch(() => ({})));
		if (typeof mod.revealNativePath === "function") {
			await mod.revealNativePath(targetPath);
			return { ok: true, via: "native-command" };
		}
	} catch {
		// 继续回退到系统 spawn
	}

	const spawnFn = spawner ?? ((file, args) => {
		if (process.env.DSH_ARCHIVE_MANAGER_MOCK_EXPLORER === "1") {
			return { unref() {} };
		}
		return spawn(file, args, { detached: true, stdio: "ignore" });
	});

	const platform = process.platform;
	if (platform === "win32") {
		const cp = spawnFn("explorer.exe", [targetPath]);
		cp.unref();
	} else if (platform === "darwin") {
		const cp = spawnFn("open", [targetPath]);
		cp.unref();
	} else {
		const cp = spawnFn("xdg-open", [targetPath]);
		cp.unref();
	}
	return { ok: true, via: "spawn" };
}
