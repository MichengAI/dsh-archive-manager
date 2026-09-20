import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createOrganizerPanel, organizerZh } from "../src/archive-organizer-ui.js";
const Panel = createOrganizerPanel(React);
const props = { t: key => organizerZh[key] ?? key, ready: true, busy: false, days: 30, count: 0, undoCount: 0 };
test("已归档页没有空闲置整理框或重复的收藏筛选", () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: true }));
  assert.doesNotMatch(html, /class="dsham_organizer"|只看收藏/);
});
test("删除结果独立于闲置整理区域并保留失败重试", () => {
  const tree = Panel({ ...props, archived: false, result: { kind: "delete", succeeded: [], skipped: [], failures: [{ sessionId: "a", message: "失败" }], unprocessed: [], remaining: ["a"] } });
  const children = React.Children.toArray(tree.props.children);
  const feedback = children.find(child => child.props?.className === "dsham_batchFeedback");
  assert.ok(feedback, "操作结果应为独立区域");
  const html = renderToStaticMarkup(feedback);
  assert.match(html, /删除结果/);
  assert.match(html, /重试剩余/);
  assert.doesNotMatch(html, /闲置天数|预览闲置归档/);
});
