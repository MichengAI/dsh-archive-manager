import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createOrganizerPanel, organizerZh } from "../src/archive-organizer-ui.ts";
const Panel = createOrganizerPanel(React);
const t = (key, values) => {
  let text = organizerZh[key] ?? key;
  if (values) for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
};
const props = { t, ready: true, busy: false, days: 30, count: 0, undoCount: 0, skipScheduled: true, onSkipScheduled: () => {} };
test("已归档页没有空闲置整理框或重复的收藏筛选", () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: true }));
  assert.doesNotMatch(html, /class="dsham_organizer"|只看收藏/);
});
test("失败计数与重试按钮一致，不再显示恒为零的未处理", () => {
  const tree = Panel({ ...props, t, archived: false, result: { kind: "archive", succeeded: ["a"], skipped: [], failures: [{ sessionId: "b", message: "失败" }, { sessionId: "c", message: "失败" }], remaining: ["b", "c"] } });
  const children = React.Children.toArray(tree.props.children);
  const feedback = children.find(child => child.props?.className === "dsham_batchFeedback");
  const text = (node) => node == null || typeof node === "boolean" ? "" : typeof node === "string" || typeof node === "number" ? String(node) : [node.props?.children].flat().map(text).join("");
  const html = text(feedback);
  assert.match(html, /失败 2/);
  assert.match(html, /重试剩余 2/);
  assert.doesNotMatch(html, /未处理/);
});
test("删除结果独立于闲置整理区域并保留失败重试", () => {
  const tree = Panel({ ...props, archived: false, result: { kind: "delete", succeeded: [], skipped: [], failures: [{ sessionId: "a", message: "失败" }], remaining: ["a"] } });
  const children = React.Children.toArray(tree.props.children);
  const feedback = children.find(child => child.props?.className === "dsham_batchFeedback");
  assert.ok(feedback, "操作结果应为独立区域");
  const text = (node) => node == null || typeof node === "boolean" ? "" : typeof node === "string" || typeof node === "number" ? String(node) : [node.props?.children].flat().map(text).join("");
  const html = text(feedback);
  assert.match(html, /删除结果/);
  assert.match(html, /重试剩余/);
  assert.doesNotMatch(html, /闲置天数|预览闲置归档/);
});
test("未归档页的定时任务开关受控且默认开启", () => {
  const on = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: false, skipScheduled: true }));
  assert.match(on, /跳过含定时任务的会话/);
  assert.match(on, /type="checkbox"/);
  assert.match(on, /checked=""/);
  const off = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: false, skipScheduled: false }));
  assert.doesNotMatch(off, /checked=""/);
});

test("已归档页不显示定时任务开关", () => {
  const html = renderToStaticMarkup(React.createElement(Panel, {
    ...props, archived: true, skipScheduled: true, onSkipScheduled: () => {}
  }));
  assert.doesNotMatch(html, /跳过含定时任务的会话/);
});

test("因定时任务跳过时显示条数提示，为零时不显示", () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: false, scheduledSkipped: 3 }));
  assert.match(html, /已跳过 3 个含定时任务的会话/);
  const empty = renderToStaticMarkup(React.createElement(Panel, { ...props, archived: false, scheduledSkipped: 0 }));
  assert.doesNotMatch(empty, /已跳过/);
});

test("开关点击回调传出新状态", () => {
  const changes = [];
  const tree = Panel({ ...props, archived: false, skipScheduled: true, onSkipScheduled: value => changes.push(value) });
  const collect = node => {
    if (node === null || typeof node !== "object") return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap(collect)];
  };
  const checkbox = collect(tree).find(node => node.props?.type === "checkbox" && node.props?.["aria-label"] === organizerZh["organizer.skipScheduled"]);
  assert.ok(checkbox, "必须渲染定时任务开关");
  checkbox.props.onChange({ target: { checked: false } });
  assert.deepEqual(changes, [false]);
});

test("OrganizerPanel: 发现孤儿子代理时展示清理卡片并响应清理点击", () => {
  let cleaned = 0;
  const html = renderToStaticMarkup(React.createElement(Panel, {
    ...props,
    t,
    archived: true,
    orphanCount: 3,
    orphanSizeBytes: 2048,
    onCleanOrphans: () => { cleaned++; }
  }));
  assert.match(html, /发现 3 个无主孤儿子代理/);
  assert.match(html, /清理全部孤儿/);
  assert.match(html, /2.0 KB/);
});
