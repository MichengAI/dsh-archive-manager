import { isAbsolute, normalize, resolve } from "node:path";
function normalizeComparable(path) {
  const normalized = normalize(resolve(path)).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
function authorizeExplorerPath(targetPath, registeredPaths) {
  if (typeof targetPath !== "string" || targetPath.trim() === "") return void 0;
  const trimmed = targetPath.trim();
  if (!isAbsolute(trimmed)) return void 0;
  const targetComparable = normalizeComparable(trimmed);
  for (const candidate of registeredPaths) {
    if (typeof candidate !== "string" || candidate.trim() === "") continue;
    if (normalizeComparable(candidate) === targetComparable) {
      return candidate;
    }
  }
  return void 0;
}
export {
  authorizeExplorerPath
};
