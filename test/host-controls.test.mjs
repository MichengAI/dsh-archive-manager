import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("设置页控件改为 Ant Design，并去掉自绘控件样式", async () => {
  const discovery = await readFile(new URL("../src/archive-discovery-ui.ts", import.meta.url), "utf8");
  const organizer = await readFile(new URL("../src/archive-organizer-ui.ts", import.meta.url), "utf8");
  const health = await readFile(new URL("../src/session-health-ui.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
  for (const source of [discovery, organizer, health, client]) {
    assert.match(source, /antd-ui\.js/);
    assert.doesNotMatch(source, /dsham_selectTrigger|dsham_selectMenu|dsham_selectOption|dsham_idleDays|dsham_healthButton|createSegmentedControls/);
  }
});
