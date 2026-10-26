import path from "node:path";
function isWindowsPath(p) {
  return /^[a-zA-Z]:[\\/]/.test(p) || /^\\\\/.test(p) || process.platform === "win32";
}
function isPathAbsolute(p) {
  return path.win32.isAbsolute(p) || path.posix.isAbsolute(p);
}
function normalizeComparable(target) {
  const win = isWindowsPath(target);
  const p = win ? path.win32 : path.posix;
  const normalized = p.normalize(target).replace(/[\\/]+$/, "");
  return win ? normalized.toLowerCase() : normalized;
}
function authorizeExplorerPath(targetPath, registeredPaths) {
  if (typeof targetPath !== "string" || targetPath.trim() === "") return void 0;
  const trimmed = targetPath.trim();
  if (!isPathAbsolute(trimmed)) return void 0;
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
