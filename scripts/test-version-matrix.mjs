// 每个宿主版本独立安装依赖并运行同一份插件产物，禁止借用本机 DSH 链接。
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { hostTestOverrides } from "./host-test-dependencies.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const profiles = [
	{ version: "0.1.0-rc.8", cordis: "4.0.1", runtime: true },
	{ version: "0.1.1-rc.2", cordis: "4.0.1", runtime: true },
	{ version: "0.1.2-rc.1", cordis: "4.0.2" },
	{ version: manifest.devDependencies["@deepseek-ai/dsh-session"], cordis: "4.0.2", latest: true }
];
const npm = process.platform === "win32" ? process.execPath : "npm";
const npmPrefix = process.platform === "win32" ? [join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")] : [];
const testNames = (await readdir(join(root, "test"))).filter((name) => name.endsWith(".test.mjs"));

function run(command, args, cwd, env = process.env) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
		let output = "";
		child.stdout.setEncoding("utf8").on("data", (data) => { output += data; });
		child.stderr.setEncoding("utf8").on("data", (data) => { output += data; });
		child.once("error", reject);
		child.once("exit", (code, signal) => code === 0 ? resolve(output) : reject(new Error(`命令失败（${code ?? signal}）：${command}\n${output}`)));
	});
}

const failures = [];
for (const profile of profiles) {
	const isolated = await mkdtemp(join(tmpdir(), "dsh-am-matrix-"));
	console.log(`\nDSH ${profile.version} / Cordis ${profile.cordis}：安装隔离依赖并执行全量回归`);
	try {
		const dependencies = {};
		for (const [name, pinned] of Object.entries(manifest.devDependencies)) {
			const target = profile.runtime && name === "@deepseek-ai/dsh-client-store" ? "@deepseek-ai/dsh-client-runtime" : name;
			dependencies[target] = name.startsWith("@deepseek-ai/dsh-") ? profile.version : pinned;
		}
		dependencies["@deepseek-ai/cordis"] = profile.cordis;
		// 固定旧 Cordis 的配套插件，避免 npm 自动选入要求 4.0.2 的新版。
		if (profile.runtime) {
			dependencies["@deepseek-ai/cordis-plugin-include"] = "1.0.6";
			dependencies["@deepseek-ai/cordis-plugin-loader"] = "1.0.2";
		}
		for (const name of ["session-persistence-jsonl", "session-query"]) dependencies[`@deepseek-ai/dsh-${name}`] = profile.version;
		await writeFile(join(isolated, "package.json"), JSON.stringify({ private: true, type: "module", dependencies, overrides: hostTestOverrides(profile.version) }), "utf8");
		await run(npm, [...npmPrefix, "install", "--ignore-scripts", "--no-audit", "--no-fund"], isolated);
		if (profile.latest && process.platform !== "win32") await run(npm, [...npmPrefix, "rebuild", "fs-ext"], isolated);
		for (const [name, version] of Object.entries(dependencies)) {
			if (!name.startsWith("@deepseek-ai/")) continue;
			const installed = JSON.parse(await readFile(join(isolated, "node_modules", name, "package.json"), "utf8"));
			if (installed.version !== version) throw new Error(`${name} 版本混用：期望 ${version}，实际 ${installed.version}`);
		}
		for (const directory of ["src", "lib", "scripts", "test"]) {
			await cp(join(root, directory), join(isolated, directory), { recursive: true, filter: (source) => basename(source) !== "node_modules" });
		}
		// 安装清单只用于装载宿主；测试仍审查真实插件清单，不伪造发布依赖。
		for (const file of ["package.json", ".gitattributes", "README.md", "README.zh-CN.md", "CHANGELOG.md", "CHANGELOG.zh-CN.md", "LICENSE", "cordis.patch.yml"]) {
			await cp(join(root, file), join(isolated, file));
		}
		const fixture = profile.latest ? "latest-host.mjs" : "legacy-host.mjs";
		const output = await run(process.execPath, ["--test", "--test-reporter=spec", ...testNames.map((name) => join("test", name)), join("test", "fixtures", fixture)], isolated, { ...process.env, DSH_ARCHIVE_TEST_HOST_VERSION: profile.version });
		console.log(output.trim().split(/\r?\n/).slice(-8).join("\n"));
	} catch (error) {
		console.error(`DSH ${profile.version} 回归失败：${String(error)}`);
		failures.push(profile.version);
	} finally {
		await rm(isolated, { recursive: true, force: true, maxRetries: 3 });
	}
}
if (failures.length > 0) throw new Error(`版本矩阵未通过：${failures.join(", ")}`);
console.log("全部新旧宿主版本矩阵通过。");
