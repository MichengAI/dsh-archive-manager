import { isAbsolute, normalize, resolve } from "node:path";

function normalizeComparable(path: string): string {
	const normalized = normalize(resolve(path)).replace(/[\\/]+$/, "");
	return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

/**
 * 校验传入路径必须属于已注册工作区路径白名单。
 * 命中返回已注册的规范路径，否则返回 undefined，杜绝命令注入与越界访问。
 */
export function authorizeExplorerPath(targetPath: unknown, registeredPaths: readonly string[]): string | undefined {
	if (typeof targetPath !== "string" || targetPath.trim() === "") return undefined;
	const trimmed = targetPath.trim();
	if (!isAbsolute(trimmed)) return undefined;

	const targetComparable = normalizeComparable(trimmed);
	for (const candidate of registeredPaths) {
		if (typeof candidate !== "string" || candidate.trim() === "") continue;
		if (normalizeComparable(candidate) === targetComparable) {
			return candidate;
		}
	}
	return undefined;
}
