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
