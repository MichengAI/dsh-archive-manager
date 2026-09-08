// 隔离安装官方最新适配基线，避免本机 DSH 的 node_modules 链接掩盖接口差异。
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const isolated = await mkdtemp(join(tmpdir(), "dsh-am-latest-compat-"));
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = manifest.devDependencies["@deepseek-ai/dsh-session"];
const npm = process.platform === "win32" ? process.execPath : "npm";
const npmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")] : [];
function run(command, args, env = process.env) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd: isolated, env, stdio: "inherit" });
		child.once("error", reject);
		child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`新版兼容验证失败：${command}，退出码 ${code}，信号 ${signal ?? "无"}`)));
	});
}
try {
	const dependencies = Object.fromEntries([
		"session", "session-persistence", "session-persistence-jsonl", "session-query", "workspace", "spill-local", "typert-protocol", "typert-registry"
	].map((name) => [`@deepseek-ai/dsh-${name}`, version]));
	dependencies["@deepseek-ai/cordis"] = manifest.devDependencies["@deepseek-ai/cordis"];
	await writeFile(join(isolated, "package.json"), JSON.stringify({ private: true, type: "module", dependencies }), "utf8");
	await cp(join(root, "lib"), join(isolated, "lib"), { recursive: true });
	await mkdir(join(isolated, "test", "fixtures"), { recursive: true });
	await cp(join(root, "test", "fixtures", "latest-host.mjs"), join(isolated, "test", "fixtures", "latest-host.mjs"));
	await mkdir(join(isolated, "test", "helpers"), { recursive: true });
	await cp(join(root, "test", "helpers", "isolated-host.mjs"), join(isolated, "test", "helpers", "isolated-host.mjs"));
	await run(npm, [...npmPrefix, "install", "--ignore-scripts", "--no-audit", "--no-fund"]);
	// POSIX 路径验证真实 flock；Windows 夹具使用真实 Koffi 锁，不加载 POSIX 扩展。
	if (process.platform !== "win32") await run(npm, [...npmPrefix, "rebuild", "fs-ext"]);
	await run(process.execPath, ["--test", "test/fixtures/latest-host.mjs"], { ...process.env, DSH_ARCHIVE_TEST_HOST_VERSION: version });
} finally {
	await rm(isolated, { recursive: true, force: true, maxRetries: 3 });
}
