import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createDiscoveryTools } from "../src/archive-discovery-ui.ts";
import { DateRange, buildMonthGrid, getPresetRange, shiftMonthClamped } from "../src/plugin-ui.ts";

// 最小钩子驱动器保留依赖和清理，用可控请求验证异步竞争。
function harness() {
  const slots = []; let cursor = 0; let effects = [];
  const React = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === "function" ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === "function" ? next(slots[i].value) : next; }]; },
    useEffect(fn, deps) { const i = cursor++; const previous = slots[i]; if (!previous || deps.some((v, j) => !Object.is(v, previous.deps[j]))) { effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); } },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.length === 1 ? children[0] : children.length > 1 ? children : props?.children }, children })
  };
  return { tools: createDiscoveryTools(React), render(fn) { cursor = 0; const result = fn(); const pending = effects; effects = []; pending.forEach(fn => fn()); return result; }, dispose() { slots.forEach(slot => slot.cleanup?.()); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test("离开预览页签后清除目标，返回时不复开且丢弃迟到响应", async () => {
  const env = harness();
  let ids = ["a"], resolve;
  const call = () => new Promise(done => { resolve = done; });
  const render = () => env.render(() => env.tools.useArchivePreview(call, ids));
  try {
    render().open({ id: "a" }); render(); await tick();
    ids = []; assert.equal(render().target, null);
    resolve({ sessionId: "a" }); await tick();
    ids = ["a"]; assert.equal(render().target, null);
  } finally { env.dispose(); }
});

test("高亮使用原文区间，不因大小写展开吞字或错位", () => {
  const { tools } = harness();
  const tree = tools.HighlightedText({ text: "İ订单退款尾", query: "订单退款" });
  assert.equal(tree.children[0], "İ");
  assert.deepEqual(tree.children[1].children, ["订单退款"]);
  assert.equal(tree.children[2], "尾");
});

test("预览切换与关闭会忽略迟到响应，错误可重试", async () => {
  const env = harness(), requests = [];
  const call = input => new Promise((resolve, reject) => requests.push({ input, resolve, reject }));
  const render = () => env.render(() => env.tools.useArchivePreview(call, ["a", "b"]));
  let state = render(); state.open({ id: "a" }); state = render(); await tick();
  state.open({ id: "b" }); state = render(); await tick();
  requests[0].resolve({ sessionId: "a" }); await tick(); state = render();
  assert.equal(state.status, "loading");
  requests[1].reject(new Error("读取失败")); await tick(); state = render();
  assert.equal(state.error, "读取失败"); state.retry(); render(); await tick();
  requests[2].resolve({ sessionId: "b" }); await tick(); state = render();
  assert.equal(state.value.sessionId, "b"); state.close(); state = render(); assert.equal(state.target, null);
  state.open({ id: "b" }); state = render(); assert.equal(state.status, "loading", "再次打开相同会话必须重新读取，不能闪现上次内容");
  env.dispose();
});

test("正文搜索切换后不发布旧命中，禁用后不继续请求", async () => {
  const env = harness(), requests = [];
  let query = "旧", enabled = true;
  const call = input => new Promise(resolve => requests.push({ input, resolve }));
  const render = () => env.render(() => env.tools.useArchiveSearch(["a"], query, enabled, call));
  render(); await new Promise(resolve => setTimeout(resolve, 380));
  query = "新"; let state = render(); assert.deepEqual(state.items, []);
  requests[0].resolve({ items: [{ sessionId: "a", seq: 1, snippet: "旧" }], failures: [] }); await tick();
  state = render(); assert.deepEqual(state.items, []);
  enabled = false; state = render(); assert.equal(state.status, "idle");
  await new Promise(resolve => setTimeout(resolve, 380)); assert.equal(requests.length, 1);
  env.dispose();
});

test("日期范围写入开始和结束，清空时清除条件", () => {
  const env = harness();
  const { DiscoveryFilters } = env.tools;
  const calls = [];
  const nodes = node => {
    const seen = new Set();
    const walk = n => {
      if (!n || typeof n !== "object" || seen.has(n)) return [];
      seen.add(n);
      if (Array.isArray(n)) return n.flatMap(walk);
      return n.props ? [n, ...walk(n.props.children), ...walk(n.children)] : [];
    };
    return walk(node);
  };
  const tree = env.render(() => DiscoveryFilters({
    t: key => key, from: "2026-01-02", to: "2026-01-09", invalid: false,
    onFrom: value => calls.push(["from", value]), onTo: value => calls.push(["to", value]), onClear: () => calls.push(["clear"])
  }));
  const range = tree.children.find(node => typeof node?.type === "function" && node.props?.onFrom);
  const rendered = env.render(() => range.type(range.props));
  const dates = nodes(rendered).filter(node => node.props?.type === "date");
  dates[0].props.onChange({ target: { value: "2026-02-01" } });
  dates[1].props.onChange({ target: { value: "2026-02-03" } });
  const cleared = env.render(() => DiscoveryFilters({
    t: key => key, from: "", to: "", invalid: false,
    onFrom: value => calls.push(["from", value]), onTo: value => calls.push(["to", value]), onClear: () => calls.push(["clear"])
  }));
  const clearedRange = cleared.children.find(node => typeof node?.type === "function" && node.props?.onFrom);
  nodes(env.render(() => clearedRange.type(clearedRange.props))).find(node => node.props?.type === "date").props.onChange({ target: { value: "" } });
  assert.deepEqual(calls, [["from", "2026-02-01"], ["to", "2026-02-03"], ["clear"]]);

  // 验证单字段胶囊触发器在有值与无值时的文本展示及清空按钮渲染（直接验证生产真实 hooks 标记）
  const textNode = nodes(rendered).find(node => typeof node.props?.className === "string" && node.props.className.includes("dsham_dateText"));
  assert.equal(textNode?.props?.children, "2026-01-02 – 2026-01-09", "已选日期合并展示为单行区间");
  const clearButton = nodes(rendered).find(node => node.props?.className === "dsham_dateClearBtn");
  assert.ok(clearButton, "有值时渲染独立清除小按钮");
  clearButton.props.onClick({ stopPropagation() {} });
  assert.equal(calls[calls.length - 1][0], "clear", "点击清除按钮触发 onClear");
});

test("快速预览默认使用宿主排版并允许切换原文高亮", () => {
  const env = harness(); const MarkdownText = () => null;
  const props = { t: key => key, MarkdownText, preview: { status: "ready", target: { query: "标题" }, value: { messages: [{ seq: 1, role: "assistant", text: "# 标题", truncated: false }], hasEarlier: false, hasLater: false } } };
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === "object" ? [node, ...nodes(node.children)] : [];
  let tree = env.render(() => env.tools.PreviewContent(props));
  assert.ok(nodes(tree).some(node => node.type === MarkdownText && node.props.text === "# 标题"));
  const modes = nodes(tree).find(node => node.props?.options?.some(option => option.value === "raw"));
  assert.ok(modes); modes.props.onChange("raw");
  tree = env.render(() => env.tools.PreviewContent(props));
  assert.equal(nodes(tree).some(node => node.type === MarkdownText), false);
  assert.ok(nodes(tree).some(node => node.type?.name === "HighlightedText"));
});

test('预览按 Escape 只关闭自身，拦截外层设置关闭并在退出后清理监听', () => {
  const previous=globalThis.window;
  const target=new EventTarget();globalThis.window=target;
  const env=harness();
  try {
    const render=()=>env.render(()=>env.tools.useArchivePreview(undefined,['a']));
    let state=render();state.open({id:'a'});render();
    let outer=0;target.addEventListener('keydown',()=>outer++);
    const event=new Event('keydown',{cancelable:true});Object.defineProperty(event,'key',{value:'Escape'});
    target.dispatchEvent(event);state=render();
    assert.equal(state.target,null);assert.equal(outer,0);assert.equal(event.defaultPrevented,true);
    target.dispatchEvent(new Event('keydown'));assert.equal(outer,1);
  } finally {env.dispose();if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});

test("DateRange 轻量日历组件支持三语本地化与无障碍焦点属性", () => {
  const dicts = {
    zh: { "discovery.timeRange": "时间范围", "discovery.today": "今天", "discovery.allTime": "全部时间", "locale.language": "zh" },
    en: { "discovery.timeRange": "Date range", "discovery.today": "Today", "discovery.allTime": "All time", "locale.language": "en" },
    ru: { "discovery.timeRange": "Период", "discovery.today": "Сегодня", "discovery.allTime": "Все время", "locale.language": "ru" }
  };
  const makeT = dict => key => dict[key] ?? key;
  const base = { label: "Date", fromLabel: "Updated from", toLabel: "To", onFrom() {}, onTo() {}, onClear() {} };

  // 1. 三语占位与国际化输出
  const htmlZh = renderToStaticMarkup(React.createElement(DateRange, { ...base, from: "", to: "", t: makeT(dicts.zh) }));
  assert.ok(htmlZh.includes("时间范围"), "中文渲染时间范围");
  assert.ok(htmlZh.includes("tabindex=\"-1\""), "隐藏 input 具备 tabindex=-1 避免键盘卡焦");
  assert.ok(htmlZh.includes("aria-hidden=\"true\""), "隐藏 input 具备 aria-hidden 避免读屏器报出");

  const htmlEn = renderToStaticMarkup(React.createElement(DateRange, { ...base, from: "", to: "", t: makeT(dicts.en) }));
  assert.ok(htmlEn.includes("Date range"), "英文正确渲染 Date range 占位");

  const htmlRu = renderToStaticMarkup(React.createElement(DateRange, { ...base, from: "", to: "", t: makeT(dicts.ru) }));
  assert.ok(htmlRu.includes("Период"), "俄文正确渲染 Период 占位");
});

test("buildMonthGrid 与 getPresetRange 纯函数核心行为与边界验证", () => {
  // 1. 验证 2026 年 10 月网格结构（共 42 格，31 个当月日）
  const oct2026 = buildMonthGrid(2026, 9);
  assert.equal(oct2026.length, 42, "完整输出 42 格保证 6 行对齐");
  const octDays = oct2026.filter(c => !c.isOutside);
  assert.equal(octDays.length, 31, "10 月共 31 天");
  assert.equal(octDays[0].dateStr, "2026-10-01", "当月首日为 10-01");
  assert.equal(octDays[30].dateStr, "2026-10-31", "当月末日为 10-31");
  assert.equal(oct2026[0].dateStr, "2026-09-28", "前导格补齐 9 月 28 日");
  assert.equal(oct2026[0].isOutside, true);

  // 2. 验证闰年 2024 年 2 月（29 天）与平年 2026 年 2 月（28 天）
  const feb2024 = buildMonthGrid(2024, 1);
  assert.equal(feb2024.filter(c => !c.isOutside).length, 29, "2024 闰年 2 月 29 天");
  const feb2026 = buildMonthGrid(2026, 1);
  assert.equal(feb2026.filter(c => !c.isOutside).length, 28, "2026 平年 2 月 28 天");

  // 3. 跨年边界：1 月的前导月为上一年 12 月
  const jan2026 = buildMonthGrid(2026, 0);
  assert.equal(jan2026[0].year, 2025, "1 月前导属于 2025 年");
  assert.equal(jan2026[0].monthIndex, 11, "1 月前导月份索引为 11（12月）");

  // 4. 预设范围计算
  const mockNow = new Date(2026, 9, 24); // 2026-10-24
  assert.deepEqual(getPresetRange("all", mockNow), { from: "", to: "" }, "全部时间清空区间");
  assert.deepEqual(getPresetRange("today", mockNow), { from: "2026-10-24", to: "2026-10-24" }, "今天为当天闭区间");
  assert.deepEqual(getPresetRange("7d", mockNow), { from: "2026-10-18", to: "2026-10-24" }, "近 7 天包含当天共 7 日");
  assert.deepEqual(getPresetRange("30d", mockNow), { from: "2026-09-25", to: "2026-10-24" }, "近 30 天包含当天共 30 日");
});

test("PageUp/PageDown 翻月把日号夹到目标月最后一天，不溢出到下下个月", () => {
  const ymd = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  // 月末翻到短月：日号必须夹紧，否则 new Date 会滚到下下个月（10-31 退一月曾落到 10-01）
  assert.equal(ymd(shiftMonthClamped(2026, 9, 31, -1)), "2026-09-30", "10-31 退一月应为 09-30");
  assert.equal(ymd(shiftMonthClamped(2026, 9, 31, 1)), "2026-11-30", "10-31 进一月应为 11-30，不得跳过 11 月");
  assert.equal(ymd(shiftMonthClamped(2026, 0, 31, 1)), "2026-02-28", "01-31 进一月应为 02-28，不得跳过 2 月");
  assert.equal(ymd(shiftMonthClamped(2024, 0, 31, 1)), "2024-02-29", "闰年 2 月夹到 29 日");
  // 常规日号不受夹紧影响，跨年方向也要正确
  assert.equal(ymd(shiftMonthClamped(2026, 0, 15, 1)), "2026-02-15", "常规日号原样保留");
  assert.equal(ymd(shiftMonthClamped(2026, 0, 31, -1)), "2025-12-31", "1 月退一月跨到上一年 12 月");
  assert.equal(ymd(shiftMonthClamped(2026, 11, 15, 1)), "2027-01-15", "12 月进一月跨到下一年 1 月");
});
