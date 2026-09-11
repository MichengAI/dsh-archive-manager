// 检查 lib 的 Git 状态；本脚本本身不构建，也不直接比较 src。
// pnpm verify 先重建再运行此检查，以发现构建产物与已提交版本的差异。
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const { stdout } = await run("git", ["status", "--porcelain", "--", "lib"]);

if (stdout.trim()) {
	process.stderr.write("lib 构建产物未同步，请先执行 pnpm build 并提交以下文件：\n");
	process.stderr.write(stdout);
	process.exit(1);
}
