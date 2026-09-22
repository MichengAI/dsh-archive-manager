import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { hostControl } from "../src/host-controls.ts";
import { createDiscoveryTools } from "../src/archive-discovery-ui.ts";
import { createOrganizerPanel, organizerZh } from "../src/archive-organizer-ui.ts";
import { createSessionHealthPanel } from "../src/session-health-ui.ts";
import { createSegmentedControls } from "../src/segmented.ts";

test("只接受真实宿主控件，忽略缺失导出和零参数替身", () => {
  function Input(props) { return props; }
  const memo = { $$typeof: Symbol.for("react.memo") };
  assert.equal(hostControl(Input), Input);
  assert.equal(hostControl(memo), memo);
  assert.equal(hostControl(undefined), undefined);
  assert.equal(hostControl(() => null), undefined);
});

test("缺少官方分段控件时，本地副本保持相同的轨道和滑块", () => {
  const { SegmentedTabs, SegmentedControl } = createSegmentedControls(React);
  const tabs = renderToStaticMarkup(React.createElement(SegmentedTabs, {
    label: "归档", value: "archived", onChange() {},
    items: [{ value: "archived", label: "已归档", id: "dsham-tab-archived", panelId: "panel" }, { value: "unarchived", label: "未归档", id: "dsham-tab-unarchived", panelId: "panel" }]
  }));
  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /class="dsham_segTabsIndicator"/);
  assert.match(tabs, /id="dsham-tab-archived"[^>]*aria-selected="true"/);
  const control = renderToStaticMarkup(React.createElement(SegmentedControl, {
    id: "scope", value: "title", label: "查找范围", onChange() {},
    options: [{ value: "title", label: "仅标题" }, { value: "content", label: "标题与正文" }]
  }));
  assert.match(control, /class="dsham_segControl"/);
  assert.match(control, /--dsh-segment-count:2/);
  assert.match(control, /id="scope-title"/);
});

test("传入官方控件后，日期、整理和诊断使用这些控件", () => {
  function Input(props) { return React.createElement("span", { "data-official": "input" }, React.createElement("input", props)); }
  function Button(props) { return React.createElement("button", { "data-official": "button", type: "button", disabled: props.disabled, onClick: props.onClick }, props.children); }
  function DisclosureRow(props) { return React.createElement("div", { "data-official": "disclosure", "data-open": String(props.open) }, props.title, props.open ? props.children : null); }
  function SegmentedControl(props) { return React.createElement("div", { "data-official": "segments", "aria-label": props.label }, props.options.map(option => option.label).join("/")); }
  const controls = { Input, Button, DisclosureRow, SegmentedControl };
  const { DiscoveryFilters, PreviewContent } = createDiscoveryTools(React, controls);
  const filters = renderToStaticMarkup(React.createElement(DiscoveryFilters, { t: key => key, from: "", to: "", onFrom() {}, onTo() {}, invalid: false, onClear() {} }));
  assert.match(filters, /data-official="input"/);
  assert.match(filters, /data-official="button"/);
  const preview = renderToStaticMarkup(React.createElement(PreviewContent, {
    t: key => key,
    MarkdownText: () => null,
    preview: { status: "ready", target: { query: "" }, value: { messages: [{ seq: 1, role: "assistant", text: "正文", truncated: false }], hasEarlier: false, hasLater: false }, retry() {} }
  }));
  assert.match(preview, /data-official="segments"/);
  const Panel = createOrganizerPanel(React, controls);
  const organizer = renderToStaticMarkup(React.createElement(Panel, {
    t: key => organizerZh[key] ?? key, archived: false, busy: false, ready: true, days: 30, count: 1, undoCount: 0,
    onDays() {}, onPreview() {}, onRetry() {}, onUndo() {}, onReload() {},
    result: { kind: "archive", succeeded: [], skipped: [], failures: [{ sessionId: "a", message: "失败" }], unprocessed: [], remaining: [] }
  }));
  assert.match(organizer, /data-official="input"/);
  assert.match(organizer, /data-official="disclosure"/);
  assert.match(organizer, /data-open="false"/);
  const Health = createSessionHealthPanel(React, {}, controls);
  const health = renderToStaticMarkup(React.createElement(Health, {
    items: [{ sessionId: "a", error: "broken" }], sessions: [{ id: "a", title: "旧会话" }],
    diagnoseSession: async () => ({ repairable: false }), retry() {}, pending: false
  }));
  assert.match(health, /data-official="button"/);
  assert.match(health, /诊断会话/);
  assert.match(health, /data-official="disclosure"/);
  assert.doesNotMatch(health, /data-open="true"/);
});
