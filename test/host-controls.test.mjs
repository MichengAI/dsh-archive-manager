import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("设置页控件改为宿主原语，并去掉 Ant 桥接", async () => {
  const discovery = await readFile(new URL("../src/archive-discovery-ui.ts", import.meta.url), "utf8");
  const organizer = await readFile(new URL("../src/archive-organizer-ui.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
  for (const source of [discovery, organizer, client]) {
    assert.doesNotMatch(source, /antd-ui\.js/);
    assert.doesNotMatch(source, /dsham_selectTrigger|dsham_selectMenu|dsham_selectOption|dsham_idleDays|dsham_healthButton|createSegmentedControls/);
  }
  assert.match(client, /@deepseek-ai\/dsh-client-ui-primitives/);
});
