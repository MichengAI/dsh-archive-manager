// 存储夹具只接受隔离脚本安装的同版本宿主，避免本机 junction 制造混版误报。
import { createRequire } from "node:module";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function assertIsolatedHost() {
	const version = process.env.DSH_ARCHIVE_TEST_HOST_VERSION;
	const hint = "请运行 pnpm test:matrix，或 pnpm test:latest；不要直接执行存储夹具。";
	if (!version) throw new Error(`存储夹具需要隔离宿主环境。${hint}`);
	const root = fileURLToPath(new URL("../../", import.meta.url));
	const modulesRoot = realpathSync(resolve(root, "node_modules"));
	const require = createRequire(import.meta.url);
	for (const name of ["session", "session-persistence", "session-persistence-jsonl", "session-query", "session-projection", "session-projection-cache", "workspace"]) {
		const specifier = `@deepseek-ai/dsh-${name}/package.json`;
		let path;
		let actual;
		try {
			path = realpathSync(require.resolve(specifier));
			actual = JSON.parse(readFileSync(path, "utf8")).version;
		} catch (error) {
			throw new Error(`无法核对隔离宿主 ${specifier}。${hint}`, { cause: error });
		}
		const local = relative(modulesRoot, path);
		if (actual !== version || local === ".." || local.startsWith("../") || local.startsWith("..\\") || isAbsolute(local)) {
			throw new Error(`宿主依赖混用：${specifier} 期望隔离版本 ${version}，实际 ${actual}（${path}）。${hint}`);
		}
	}
}
