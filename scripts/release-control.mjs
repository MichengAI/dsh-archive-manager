// 发布控制：只读确认 npm 的精确版本，再同步对应 GitHub Release。
import { appendFile, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { setTimeout as pause } from "node:timers/promises";

const exec = promisify(execFile);
const registry = "https://registry.npmjs.org";

/** 仅 404 表示未发布；其他异常及提交不一致均阻断发布。 */
export async function readPublishedVersion(
  expected,
  fetcher = fetch,
  signal = AbortSignal.timeout(15000),
) {
  const response = await fetcher(
    `${registry}/${encodeURIComponent(expected.name)}/${encodeURIComponent(expected.version)}`,
    { signal },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`npm registry 查询失败：HTTP ${response.status}`);
  const value = await response.json();
  if (
    value?.name !== expected.name ||
    value?.version !== expected.version ||
    value?.gitHead !== expected.gitHead
  ) {
    throw new Error("npm 包名、版本或 gitHead 与发布标签不一致");
  }
  return value;
}

// 使用截止时间限制请求与休眠；传播延迟可重试，权限和内容错误直接传播。
async function waitFor(
  check,
  message,
  { timeoutMs = 120000, now = Date.now, pause: sleep = pause } = {},
) {
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const remaining = deadline - now();
    if (remaining <= 0) break;
    const signal = AbortSignal.timeout(Math.min(15000, remaining));
    let value;
    try {
      value = await check(signal);
    } catch (error) {
      // 仅转换总窗口限定的中止，保留单请求超时和其他异常的原始语义。
      if (remaining <= 15000 && signal.aborted && error === signal.reason) {
        throw new Error(message, { cause: error });
      }
      throw error;
    }
    if (value !== null) return value;
    const rest = deadline - now();
    if (rest > 0) await sleep(Math.min(5000, rest));
  }
  throw new Error(message);
}

/** 最多等待两分钟让精确版本可见，内容冲突立即失败。 */
export async function waitForPublication(
  expected,
  { fetcher = fetch, ...timing } = {},
) {
  return waitFor(
    (signal) => readPublishedVersion(expected, fetcher, signal),
    "npm 发布版本尚不可查询，暂不公开 GitHub Release",
    timing,
  );
}

// 工作流仅发布正式版本；无依赖比较三段数字，确保安装前和旧标签恢复也可使用。
function stableVersion(value) {
  if (
    typeof value !== "string" ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)
  )
    throw new Error("npm latest 版本不是有效的正式版本");
  return value.split(".").map(BigInt);
}

/** latest 落后则等待，相等才标最新；更高版本表示旧标签重试。 */
export async function waitForLatest(
  expected,
  { fetcher = fetch, ...timing } = {},
) {
  const target = stableVersion(expected.version);
  return waitFor(
    async (signal) => {
      const response = await fetcher(
        `${registry}/${encodeURIComponent(expected.name)}/latest`,
        { signal },
      );
      if (response.status === 404) return null;
      if (!response.ok)
        throw new Error(`npm latest 查询失败：HTTP ${response.status}`);
      const latest = await response.json();
      if (latest?.name !== expected.name)
        throw new Error("npm latest 包名不一致");
      const current = stableVersion(latest.version);
      for (let i = 0; i < 3; i++) {
        if (current[i] > target[i]) return false;
        if (current[i] < target[i]) return null;
      }
      return true;
    },
    "npm latest 尚未传播到目标版本，暂不公开 GitHub Release",
    timing,
  );
}

/** 分页精确查找标签；查询失败直接退出，旧标签重试不更新 Latest。 */
export async function syncGithubRelease(
  repo,
  tag,
  notes,
  latest,
  run = async (args) => (await exec("gh", args)).stdout,
) {
  const pages = JSON.parse(
    await run([
      "api",
      `repos/${repo}/releases?per_page=100`,
      "--paginate",
      "--slurp",
    ]),
  );
  if (!Array.isArray(pages) || !pages.every(Array.isArray))
    throw new Error("GitHub Release 列表格式异常");
  const exists = pages.flat().some((release) => release.tag_name === tag);
  const args = [
    "release",
    exists ? "edit" : "create",
    tag,
    "--repo",
    repo,
    "--title",
    tag,
    "--notes-file",
    notes,
  ];
  if (!exists) args.push("--verify-tag", `--latest=${latest}`);
  else if (latest) args.push("--latest");
  await run(args);
}

async function main() {
  const [mode, tag, notes] = process.argv.slice(2);
  if (!["validate", "check", "release"].includes(mode))
    throw new Error(
      "用法：release-control.mjs <validate|check|release> <tag> [notes]",
    );
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  if (!/^v\d+\.\d+\.\d+$/.test(tag ?? "") || tag !== `v${manifest.version}`)
    throw new Error("标签与包版本不一致");
  const gitHead = (await exec("git", ["rev-parse", "HEAD"])).stdout.trim();
  const taggedHead = (
    await exec("git", ["rev-parse", `refs/tags/${tag}^{commit}`])
  ).stdout.trim();
  if (gitHead !== taggedHead) throw new Error("当前检出提交与标签不一致");
  if (mode === "validate") return;
  const expected = { name: manifest.name, version: manifest.version, gitHead };
  if (mode === "check") {
    const published = (await readPublishedVersion(expected)) !== null;
    if (process.env.GITHUB_OUTPUT)
      await appendFile(process.env.GITHUB_OUTPUT, `published=${published}\n`);
    console.log(`published=${published}`);
    return;
  }
  if (!notes || !process.env.GITHUB_REPOSITORY)
    throw new Error("缺少版本说明或 GitHub 仓库");
  await waitForPublication(expected);
  const latest = await waitForLatest(expected);
  await syncGithubRelease(process.env.GITHUB_REPOSITORY, tag, notes, latest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
