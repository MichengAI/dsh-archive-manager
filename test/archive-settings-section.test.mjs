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

test("删除只提交根会话或归档集合，子代理交给服务端级联", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /deleteTarget\.all \? deleteAllSessionIds : \[deleteTarget\.id\]/);
  assert.match(client, /await deleteSession\(rootId\)/);
  // 客户端级联收集（collect*）已按 clean cutover 移除，不得回归。
  assert.doesNotMatch(client, /collectSessionAndDescendantIds|collectArchivedDeleteAllIds/);
});

test("删除文案中英键齐全，并统一使用子代理用语", async () => {
  const client = await readFile(clientPath, "utf8");
  assert.match(client, /"deleteSession.unknown": "会话已不存在或已被删除。"/);
  assert.match(client, /"deleteSession.unknown": "This session no longer exists or was already deleted."/);
  assert.match(client, /"deleteSession.failed": "删除会话失败：{detail}"/);
  assert.match(client, /"deleteSession.failed": "Could not delete the session: {detail}"/);
  assert.match(client, /及其子代理（含正在运行的）/);
  assert.match(client, /their child agents \(including any that are still running\)/);
  assert.doesNotMatch(client, /及其子会话和记录/);
  assert.match(client, /isUnknownSessionError\(reason\)/);
  assert.match(client, /"archives.archiveFailed": "归档失败：{detail}"/);
  assert.match(client, /"archives.archiveFailed": "Could not archive the session: {detail}"/);
  assert.match(client, /showArchivedToast\(formatArchiveError/);
  assert.match(client, /showArchivedToast\(formatUnarchiveError/);
});

test("归档设置页使用自定义项目筛选菜单，而不是原生 select", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /function ArchiveProjectSelect/);
  assert.match(client, /className: "dsham_selectMenu"/);
  assert.match(client, /role: "listbox"/);
  assert.match(client, /dsham_selectOption\[aria-selected='true'\]/);
  assert.doesNotMatch(client, /jsx\)\("select", \{ className: "dsham_settingsFilter"/);
});

test("删除全集直接取归档集合，不依赖摘要是否已加载", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /deriveArchivedDeleteAllIds\(workspaceState\.archivedSessionIds, sessions\.byId\)/);
  assert.match(client, /if \(byId\?\.\[id\]\?\.origin === "subagent"\) continue;/);
  assert.doesNotMatch(client, /deleteAllSessionIds = \(0, react\.useMemo\)\(\(\) => groups\.flatMap/);
});

test("项目筛选与分组使用 workspaceId 作为 key，选中项消失时回退所有项目", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /key: workspace\.workspaceId/);
  assert.match(client, /value: group\.key, label: group\.title/);
  assert.match(client, /project === "all" \|\| project === group\.key/);
  assert.match(client, /setProject\("all"\)/);
  // 分组渲染 key 与筛选 value 不再使用允许重名的 title。
  assert.doesNotMatch(client, /\}, group\.title\)\)/);
});

test("确认框按 Escape 只关闭最上层，不关掉设置页", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /window\.addEventListener\("keydown", onKeyDown, true\)/);
  assert.match(client, /event\.stopImmediatePropagation/);
  assert.match(client, /if \(event\.key !== "Escape"\) return;/);
});

