// 发布边界回归：查询失败不能触发发布，GitHub Release 必须对应已确认的 npm 提交。
import test from "node:test";
import assert from "node:assert/strict";
import { readPublishedVersion, waitForPublication, waitForLatest, syncGithubRelease } from "../scripts/release-control.mjs";
const expected = { name: "@michengai/dsh-archive-manager", version: "0.1.35", gitHead: "a".repeat(40) };
const response = (status, body) => new Response(JSON.stringify(body), { status });

test("只有明确 404 才表示版本未发布", async () => {
  assert.equal(await readPublishedVersion(expected, async () => response(404, {})), null);
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(readPublishedVersion(expected, async () => response(status, {})), /registry/);
  }
  await assert.rejects(readPublishedVersion(expected, async () => { throw new Error("offline"); }), /offline/);
});
test("已发布版本必须匹配包名、版本和原标签提交", async () => {
  assert.deepEqual(await readPublishedVersion(expected, async () => response(200, expected)), expected);
  for (const patch of [{ name: "other" }, { version: "0.1.34" }, { gitHead: "b".repeat(40) }, { gitHead: undefined }]) {
    await assert.rejects(readPublishedVersion(expected, async () => response(200, { ...expected, ...patch })), /不一致/);
  }
  await assert.rejects(readPublishedVersion(expected, async () => new Response("bad json")), SyntaxError);
});
const clock = () => {
  let time = 0;
  return { timeoutMs: 120000, now: () => time, pause: async (ms) => { time += ms; } };
};
test("发布可见性允许超过一分钟传播，截止后失败", async () => {
  const timing = clock();
  await waitForPublication(expected, { ...timing, fetcher: async () => timing.now() < 70000 ? response(404, {}) : response(200, expected) });
  assert.equal(timing.now(), 70000);
  const expired = clock();
  await assert.rejects(waitForPublication(expected, { ...expired, fetcher: async () => response(404, {}) }), /尚不可查询/);
  assert.equal(expired.now(), 120000);
});
test("latest 落后时等待传播，相等标最新，更高版本保留最新归属", async () => {
  const timing = clock();
  assert.equal(await waitForLatest(expected, { ...timing, fetcher: async () => response(200, { ...expected, version: timing.now() < 15000 ? "0.1.9" : expected.version }) }), true);
  assert.equal(timing.now(), 15000);
  assert.equal(await waitForLatest(expected, { ...clock(), fetcher: async () => response(200, { ...expected, version: "0.1.100" }) }), false);
});
test("latest 未传播或响应异常不得创建非 Latest Release", async () => {
  await assert.rejects(waitForLatest(expected, { ...clock(), fetcher: async () => response(200, { ...expected, version: "0.1.34" }) }), /latest/);
  for (const version of ["invalid", "0.1.36-rc.1"]) {
    await assert.rejects(waitForLatest(expected, { ...clock(), fetcher: async () => response(200, { ...expected, version }) }), /版本/);
  }
  await assert.rejects(waitForLatest(expected, { ...clock(), fetcher: async () => response(403, {}) }), /403/);
});
test("GitHub 列表查询失败后不得创建或更新 Release", async () => {
  const calls = [];
  await assert.rejects(syncGithubRelease("owner/repo", "v0.1.35", "notes.md", true, async (args) => {
    calls.push(args); throw new Error("API unavailable");
  }), /API unavailable/);
  assert.equal(calls.length, 1);
});
test("精确匹配分页标签，旧版本重试不抢占 Latest", async () => {
  const calls = [];
  const run = async (args) => {
    calls.push(args);
    return calls.length === 1 ? JSON.stringify([[{ tag_name: "v0.1.350" }], [{ tag_name: "v0.1.35" }]]) : "";
  };
  await syncGithubRelease("owner/repo", "v0.1.35", "notes.md", false, run);
  assert.equal(calls[1][1], "edit");
  assert.equal(calls[1].includes("--latest"), false);
  calls.length = 0;
  await syncGithubRelease("owner/repo", "v0.1.34", "notes.md", false, run);
  assert.equal(calls[1][1], "create");
  assert.ok(calls[1].includes("--verify-tag"));
  assert.ok(calls[1].includes("--latest=false"));
});

// CLI 使用独立 Git 仓库和进程级 fetch 替身，不访问网络或写入外部应用。
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const control = fileURLToPath(new URL("../scripts/release-control.mjs", import.meta.url));
const extract = fileURLToPath(new URL("../scripts/extract-release-notes.mjs", import.meta.url));

test("CLI 校验真实标签提交，已发布写 true，权限错误不得输出 false", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "dsh-release-cli-"));
  try {
    const git = (...args) => exec("git", args, { cwd });
    await git("init");
    await writeFile(join(cwd, "package.json"), JSON.stringify({ name: expected.name, version: expected.version }));
    await git("add", "package.json");
    await git("-c", "user.name=Release Test", "-c", "user.email=release@example.invalid", "commit", "-m", "fixture");
    const gitHead = (await git("rev-parse", "HEAD")).stdout.trim();
    await git("tag", "v0.1.35");
    await exec(process.execPath, [control, "validate", "v0.1.35"], { cwd });
    await assert.rejects(exec(process.execPath, [control, "validate", "v0.1.34"], { cwd }), /标签与包版本不一致/);
    const loader = join(cwd, "fetch.mjs");
    const output = join(cwd, "output.txt");
    await writeFile(loader, `globalThis.fetch = async () => new Response(JSON.stringify(${JSON.stringify({ ...expected, gitHead })}), {status: Number(process.env.TEST_STATUS)});`);
    const run = (status) => exec(process.execPath, ["--import", pathToFileURL(loader).href, control, "check", "v0.1.35"], { cwd, env: { ...process.env, TEST_STATUS: String(status), GITHUB_OUTPUT: output } });
    await run(200);
    assert.equal(await readFile(output, "utf8"), "published=true\n");
    await writeFile(output, "");
    await assert.rejects(run(403), /403/);
    assert.equal(await readFile(output, "utf8"), "");
    await run(404);
    assert.equal(await readFile(output, "utf8"), "published=false\n");
    await git("-c", "user.name=Release Test", "-c", "user.email=release@example.invalid", "commit", "--allow-empty", "-m", "other");
    await assert.rejects(exec(process.execPath, [control, "validate", "v0.1.35"], { cwd }), /当前检出提交与标签不一致/);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("双语说明 CLI 缺失任一语言拒绝生成，完整时中文在前", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "dsh-release-notes-"));
  try {
    const run = () => exec(process.execPath, [extract, "v0.1.35", "notes.md"], { cwd });
    await writeFile(join(cwd, "CHANGELOG.zh-CN.md"), "## 0.1.35\n\n中文内容\n");
    await assert.rejects(run(), /Both Chinese and English/);
    await writeFile(join(cwd, "CHANGELOG.md"), "## 0.1.35\n\nEnglish content\n");
    await run();
    const notes = await readFile(join(cwd, "notes.md"), "utf8");
    assert.ok(notes.indexOf("中文内容") < notes.indexOf("English content"));
    await rm(join(cwd, "CHANGELOG.zh-CN.md"));
    await assert.rejects(run(), /Both Chinese and English/);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
