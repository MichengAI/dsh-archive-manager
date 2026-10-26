import { spawn } from "node:child_process";
async function revealPathInSystem(targetPath, injectedModule, spawner) {
  try {
    const spec = "@deepseek-ai/dsh-native-command";
    const mod = injectedModule ?? await import(spec).catch(() => ({}));
    if (typeof mod.revealNativePath === "function") {
      await mod.revealNativePath(targetPath);
      return { ok: true, via: "native-command" };
    }
  } catch {
  }
  const spawnFn = spawner ?? ((file, args) => {
    if (process.env.DSH_ARCHIVE_MANAGER_MOCK_EXPLORER === "1") {
      return { unref() {
      } };
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
export {
  revealPathInSystem
};
