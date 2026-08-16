import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const clientPath = fileURLToPath(new URL("../lib/client.js", import.meta.url));

test("归档入口注册在设置的连接器之后，并移除旧的视图选项入口", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /name: "settings\.section",[\s\S]*id: "archived-sessions",[\s\S]*order: 18/);
  assert.match(client, /id: "archived-sessions",[\s\S]*icon: "archive"/);
  assert.match(client, /ArchivedSessionsSection/);
  assert.doesNotMatch(client, /id: "show-archived"/);
  assert.doesNotMatch(client, /viewOptions\.showArchived/);
});

test("归档设置页提供参考界面的搜索、筛选和全部删除入口", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /dsham_settingsToolbar/);
  assert.match(client, /placeholder: t\("archives\.searchPlaceholder"\)/);
  assert.match(client, /className: "dsham_settingsFilter"/);
  assert.match(client, /onClick: \(\) => setDeleteTarget\(\{ all: true \}\)/);
  assert.doesNotMatch(client, /value: chatType, onChange: \(event\) => setChatType\(event\.target\.value\)/);
  assert.doesNotMatch(client, /chatType === "all"/);
});

test("归档设置页收紧顶部留白，侧栏入口使用简短归档标签", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /margin:0 auto/);
  assert.match(client, /label: \(\) => ctx\.locale\.bind\(NS\)\("archived\.badge"\)/);
});

test("归档设置页下拉菜单不强制宿主主题", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.doesNotMatch(client, /\.dsham_settingsFilter\{color-scheme:/);
});

test("归档设置页删除全部会收集父会话和 subagent 子会话", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /collectArchivedDeleteAllIds\(workspaceState\.archivedSessionIds, sessions\.byId\)/);
  assert.match(client, /deleteTarget\.all \? deleteAllSessionIds : collectSessionAndDescendantIds\(deleteTarget\.id, sessions\.byId\)/);
  assert.match(client, /collectSessionAndDescendantIds\(rootId, sessionSnapshot\.byId\)/);
});

test("删除文案中英键齐全，并统一使用子代理用语", async () => {
  const client = await readFile(clientPath, "utf8");
  assert.match(client, /"deleteSession.unknown": "会话已不存在或已被删除。"/);
  assert.match(client, /"deleteSession.unknown": "This session no longer exists or was already deleted."/);
  assert.match(client, /"deleteSession.failed": "删除会话失败：{detail}"/);
  assert.match(client, /"deleteSession.failed": "Could not delete the session: {detail}"/);
  assert.match(client, /及其子代理和记录/);
  assert.match(client, /their child agents/);
  assert.doesNotMatch(client, /及其子会话和记录/);
  assert.match(client, /isUnknownSessionError\(reason\)/);
});
