import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const clientPath = fileURLToPath(new URL("../lib/client.js", import.meta.url));

test("归档会话使用卡片布局，并始终显示恢复与删除操作", async () => {
  const client = await readFile(clientPath, "utf8");

  assert.match(client, /dsham_archiveCardActions/);
  assert.match(client, /dsham_archiveCardMeta/);
  assert.match(client, /onUnarchive\(node\.id\)/);
  assert.match(client, /onDeleteSession\(node\.id, row\.title\)/);
  assert.match(client, /background:var\(--dsw-alias-button-elevated-fill\)/);
});
