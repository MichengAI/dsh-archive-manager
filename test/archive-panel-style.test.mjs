import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const clientPath = fileURLToPath(new URL("../src/client.ts", import.meta.url));

test("归档会话使用卡片布局，并始终显示恢复与删除操作", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /dsham_archiveCardActions/);
  assert.match(client, /dsham_archiveCardMeta/);
  assert.match(client, /onUnarchive\(node\.id\)/);
  assert.match(client, /onDeleteSession\(node\.id, row\.title\)/);
  assert.match(client, /background:var\(--dsw-alias-button-elevated-fill\)/);
});

test("设置页 antd 别名令牌映射到宿主 --dsw-alias-*，不沿用 antd 自带深色面色", async () => {
  const antdUi = await readFile(new URL("../src/antd-ui.ts", import.meta.url), "utf8");

  // 面色、边框、文字必须走宿主令牌：antd 暗色层阶方向与宿主相反。
  assert.match(antdUi, /colorBgContainer:\s*"var\(--dsw-alias-bg-layer-3\)"/);
  assert.match(antdUi, /colorBgElevated:\s*"var\(--dsw-alias-bg-layer-3\)"/);
  assert.match(antdUi, /colorText:\s*"var\(--dsw-alias-label-primary\)"/);
  assert.match(antdUi, /colorBorder:\s*"var\(--dsw-alias-border-l3\)"/);
  // 主色是颜色推导种子，必须是具体色值：给 CSS 变量会让 hover/active 退化成近黑。
  assert.match(antdUi, /hostPrimary = \{ light: "#4176e6", dark: "#7aaaff" \}/);
  assert.doesNotMatch(antdUi, /colorPrimary:\s*"var\(/);
});

test("分段控件轨道与选中块分属不同层级，选中态在亮暗下都可见", async () => {
  const antdUi = await readFile(new URL("../src/antd-ui.ts", import.meta.url), "utf8");

  // antd 默认 trackBg 取 colorBgLayout（暗色下纯黑），是面板里最扎眼的黑带。
  assert.match(antdUi, /trackBg:\s*"var\(--dsw-alias-bg-module-platform/);
  // 暗色下 bg-module-platform 与 bg-layer-3 同为 #353638；选中块必须再上一级，
  // 否则轨道与选中块同色，用户看不出选中项。
  assert.match(antdUi, /itemSelectedBg:\s*"var\(--dsw-alias-button-elevated-fill\)"/);
  assert.doesNotMatch(antdUi, /itemSelectedBg:\s*"var\(--dsw-alias-bg-layer-3\)"/);
});

test("归档设置页删除确认使用红色危险样式", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /danger: true, disabled: busy, onClick: confirmDelete/);
  assert.doesNotMatch(client, /dsham_settingsDeleteConfirm/);
});

test("全部归档确认使用红色提示样式", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /className: "dsham_archiveWorkspaceConfirm"/);
  assert.match(client, /\.dsham_archiveWorkspaceConfirm\{color:var\(--dsw-alias-state-error-primary\)!important;background:transparent!important;border-color:var\(--dsw-alias-state-error-primary\)!important/);
  assert.match(client, /\.dsham_archiveWorkspaceConfirm:hover:not\(:disabled\)\{background:color-mix\(in srgb,var\(--dsw-alias-state-error-primary\) 20%,transparent\)!important\}/);
  assert.match(client, /\.dsham_archiveWorkspaceConfirm:focus-visible\{outline:2px solid var\(--dsw-alias-state-error-secondary\);outline-offset:2px\}/);
});
