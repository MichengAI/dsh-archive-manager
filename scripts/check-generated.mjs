// lib 只作为本地和发布包的构建产物，不纳入 Git。
// verify 已执行构建和包结构检查，这里防止误提交生成物。
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const { stdout } = await run("git", ["ls-files", "--", "lib"]);

if (stdout.trim()) {
	process.stderr.write("lib 构建产物不应纳入 Git，请取消跟踪以下文件并保留本地副本：\n");
	process.stderr.write(stdout);
	process.exit(1);
}
console.log("生成物 Git 边界检查通过");
