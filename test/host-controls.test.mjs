import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hostControl } from "../src/host-controls.ts";

test("只接受真实宿主控件，忽略缺失导出和零参数替身", () => {
  function Input(props) { return props; }
  const memo = { $$typeof: Symbol.for("react.memo") };
  assert.equal(hostControl(Input), Input);
  assert.equal(hostControl(memo), memo);
  assert.equal(hostControl(undefined), undefined);
  assert.equal(hostControl(() => null), undefined);
});

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
