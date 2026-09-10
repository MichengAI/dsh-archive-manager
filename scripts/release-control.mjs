// 发布控制：只读确认 npm 的精确版本，再同步对应 GitHub Release。
import { appendFile, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";

const exec = promisify(execFile);
const registry = "https://registry.npmjs.org";

/** 仅 404 表示未发布；其他异常及提交不一致均阻断发布。 */
export async function readPublishedVersion(expected, fetcher = fetch) {
  const response = await fetcher(`${registry}/${encodeURIComponent(expected.name)}/${encodeURIComponent(expected.version)}`, { signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry 查询失败：HTTP ${response.status}`);
  const value = await response.json();
  if (value?.name !== expected.name || value?.version !== expected.version || value?.gitHead !== expected.gitHead) {
    throw new Error("npm 包名、版本或 gitHead 与发布标签不一致");
  }
  return value;
}

/** 只重试尚未可见的版本，不掩盖网络、权限及内容错误。 */
export async function waitForPublication(expected, { fetcher = fetch, pause: sleep = pause, attempts = 6 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const value = await readPublishedVersion(expected, fetcher);
    if (value !== null) return value;
    if (i + 1 < attempts) await sleep(5000);
  }
  throw new Error("npm 发布版本尚不可查询，暂不公开 GitHub Release");
}

/** 分页精确查找标签；查询失败直接退出，旧标签重试不更新 Latest。 */
export async function syncGithubRelease(repo, tag, notes, latest, run = async (args) => (await exec("gh", args)).stdout) {
  const pages = JSON.parse(await run(["api", `repos/${repo}/releases?per_page=100`, "--paginate", "--slurp"]));
  if (!Array.isArray(pages) || !pages.every(Array.isArray)) throw new Error("GitHub Release 列表格式异常");
  const exists = pages.flat().some((release) => release.tag_name === tag);
  const args = ["release", exists ? "edit" : "create", tag, "--repo", repo, "--title", tag, "--notes-file", notes];
  if (!exists) args.push("--verify-tag", `--latest=${latest}`);
  else if (latest) args.push("--latest");
  await run(args);
}

async function main() {
  const [mode, tag, notes] = process.argv.slice(2);
  if (!["validate", "check", "release"].includes(mode)) throw new Error("用法：release-control.mjs <validate|check|release> <tag> [notes]");
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  if (!/^v\d+\.\d+\.\d+$/.test(tag ?? "") || tag !== `v${manifest.version}`) throw new Error("标签与包版本不一致");
  const gitHead = (await exec("git", ["rev-parse", "HEAD"])).stdout.trim();
  const taggedHead = (await exec("git", ["rev-parse", `refs/tags/${tag}^{commit}`])).stdout.trim();
  if (gitHead !== taggedHead) throw new Error("当前检出提交与标签不一致");
  if (mode === "validate") return;
  const expected = { name: manifest.name, version: manifest.version, gitHead };
  if (mode === "check") {
    const published = await readPublishedVersion(expected) !== null;
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `published=${published}\n`);
    console.log(`published=${published}`);
    return;
  }
  if (!notes || !process.env.GITHUB_REPOSITORY) throw new Error("缺少版本说明或 GitHub 仓库");
  await waitForPublication(expected);
  const response = await fetch(`${registry}/${encodeURIComponent(manifest.name)}/latest`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`npm latest 查询失败：HTTP ${response.status}`);
  const latest = await response.json();
  if (latest?.name !== manifest.name || typeof latest.version !== "string") throw new Error("npm latest 响应异常");
  await syncGithubRelease(process.env.GITHUB_REPOSITORY, tag, notes, latest.version === manifest.version);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
