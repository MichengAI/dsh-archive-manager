import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const clientPath = fileURLToPath(new URL("../lib/client.js", import.meta.url));

test("归档入口注册在设置的连接器之后，并移除旧的视图选项入口", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /name: "settings\.section",[\s\S]*id: "archived-sessions",[\s\S]*order: 18/);
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
});

test("归档设置页收紧顶部留白，侧栏入口使用简短归档标签", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /margin:24px auto 80px/);
  assert.match(client, /label: \(\) => ctx\.locale\.bind\(NS\)\("archived\.badge"\)/);
});

test("归档设置页下拉菜单继承深色系统控件主题", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /\.dsham_settingsFilter\{color-scheme:dark/);
});
