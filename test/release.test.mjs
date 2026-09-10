// 发布边界回归：查询失败不能触发发布，GitHub Release 必须对应已确认的 npm 提交。
import test from "node:test";
import assert from "node:assert/strict";
import { readPublishedVersion, waitForPublication, syncGithubRelease } from "../scripts/release-control.mjs";
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
  await assert.rejects(readPublishedVersion(expected, async () => new Response("bad json")), /JSON/);
});
test("发布后等待有上限，内容冲突立即失败", async () => {
  let calls = 0;
  const fetcher = async () => ++calls < 3 ? response(404, {}) : response(200, expected);
  await waitForPublication(expected, { fetcher, pause: async () => {}, attempts: 3 });
  assert.equal(calls, 3);
  await assert.rejects(waitForPublication(expected, { fetcher: async () => response(404, {}), pause: async () => {}, attempts: 2 }), /尚不可查询/);
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
