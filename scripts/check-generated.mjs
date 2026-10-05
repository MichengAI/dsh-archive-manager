// GitHub 安装包含已提交的 lib，不依赖会被包管理器拦截的 prepare 脚本。
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const gitignore = (await readFile(".gitignore", "utf8")).split(/\r?\n/u);
const ignoresLib = gitignore.some((line) => line === "lib" || line === "lib/" || line === "/lib/");

if (packageJson.scripts?.prepare !== undefined || ignoresLib) {
	process.stderr.write("GitHub 安装不能依赖被拦截的构建脚本，且不得忽略编译目录 lib。\n");
	process.exit(1);
}

const { stdout } = await run("git", ["ls-files", "--", "lib"]);
if (!stdout.trim()) {
	process.stderr.write("lib 运行文件必须纳入 Git，否则从 GitHub 安装缺少可运行产物。\n");
	process.exit(1);
}

console.log("生成物 Git 边界检查通过");
