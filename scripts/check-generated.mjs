// 发布前确认受版本控制的 lib 与当前 src 构建结果完全一致。
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const { stdout } = await run("git", ["status", "--porcelain", "--", "lib"]);

if (stdout.trim()) {
	process.stderr.write("lib 构建产物未同步，请先执行 pnpm build 并提交以下文件：\n");
	process.stderr.write(stdout);
	process.exit(1);
}
