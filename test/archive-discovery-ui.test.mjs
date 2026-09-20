import test from "node:test";
import assert from "node:assert/strict";
import { createDiscoveryTools } from "../src/archive-discovery-ui.js";

// 最小钩子驱动器保留依赖和清理，用可控请求验证异步竞争。
function harness() {
  const slots = []; let cursor = 0; let effects = [];
  const React = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === "function" ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === "function" ? next(slots[i].value) : next; }]; },
    useEffect(fn, deps) { const i = cursor++; const previous = slots[i]; if (!previous || deps.some((v, j) => !Object.is(v, previous.deps[j]))) { effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); } },
    createElement: (type, props, ...children) => ({ type, props, children })
  };
  return { tools: createDiscoveryTools(React), render(fn) { cursor = 0; const result = fn(); const pending = effects; effects = []; pending.forEach(fn => fn()); return result; }, dispose() { slots.forEach(slot => slot.cleanup?.()); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test("详情读取不依赖翻译函数身份，切换语言只重译本地提示", async () => {
  const env = harness();
  let calls = 0;
  const call = async () => { calls++; return { items: [] }; };
  const render = label => env.render(() => env.tools.useSessionDetails([{ id: "a", updatedAt: 1 }], call, () => label));
  try {
    render("缺少详情"); await tick();
    for (let i = 0; i < 5; i++) {
      assert.equal(render("缺少详情").byId.a.error, "缺少详情");
      await tick();
    }
    assert.equal(calls, 1);
    const translated = render("Details unavailable");
    assert.equal(translated.byId.a.error, "Details unavailable");
    assert.equal(translated.items[0].error, "Details unavailable");
    assert.equal(calls, 1, "切换语言不能触发磁盘读取");
    translated.retry(); render("Details unavailable"); await tick();
    assert.equal(calls, 2, "手动重试仍能重新读取");
  } finally { env.dispose(); }
});

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

test("日期浮层点击内部保持展开，点击外部关闭，卸载移除监听", () => {
  const listeners = new Map(); let cleanup;
  const inside = {}, outside = {};
  const root = { open: true, contains: target => target === inside, ownerDocument: {
    addEventListener: (name, fn, capture) => listeners.set(name, { fn, capture }),
    removeEventListener: (name, fn, capture) => { assert.equal(listeners.get(name).fn, fn); assert.equal(listeners.get(name).capture, capture); listeners.delete(name); }
  } };
  const React = { useRef: () => ({ current: root }), useEffect: fn => { cleanup = fn(); }, createElement: (type, props, ...children) => ({ type, props, children }) };
  const { DiscoveryFilters } = createDiscoveryTools(React);
  DiscoveryFilters({ t: key => key, from: "", to: "" });
  assert.ok(listeners.has("pointerdown"), "日期浮层应监听外部指针操作");
  listeners.get("pointerdown").fn({ target: inside }); assert.equal(root.open, true);
  listeners.get("pointerdown").fn({ target: outside }); assert.equal(root.open, false);
  cleanup(); assert.equal(listeners.size, 0);
});

test("详情分批读取取消后不发布旧结果，单批失败可重试", async () => {
  const env = harness(); const calls = [];
  let sessions = Array.from({ length: 21 }, (_, i) => ({ id: String(i), updatedAt: 1 }));
  const call = input => new Promise((resolve, reject) => calls.push({ input, resolve, reject }));
  const render = () => env.render(() => env.tools.useSessionDetails(sessions, call));
  render(); assert.equal(calls[0].input.sessionIds.length, 20);
  sessions = [{ id: "new", updatedAt: 2 }]; render();
  calls[0].resolve({ items: [] }); await tick();
  assert.equal(calls.length, 2, "取消旧查询后不再读取旧列表的下一批");
  calls[1].reject(new Error("读取失败")); await tick();
  let state = render(); assert.equal(state.byId.new.turnCount, null); assert.match(state.byId.new.error, /读取失败/);
  state.retry(); render(); calls[2].resolve({ items: [{ sessionId: "new", turnCount: 5, path: "路径", error: "" }] }); await tick();
  state = render(); assert.equal(state.byId.new.turnCount, 5); assert.equal(state.pending, false);
  env.dispose();
});

test("快速预览默认使用宿主排版并允许切换原文高亮", () => {
  const env = harness(); const MarkdownText = () => null;
  const props = { t: key => key, MarkdownText, preview: { status: "ready", target: { query: "标题" }, value: { messages: [{ seq: 1, role: "assistant", text: "# 标题", truncated: false }], hasEarlier: false, hasLater: false } } };
  const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === "object" ? [node, ...nodes(node.children)] : [];
  let tree = env.render(() => env.tools.PreviewContent(props));
  assert.ok(nodes(tree).some(node => node.type === MarkdownText && node.props.text === "# 标题"));
  const raw = nodes(tree).find(node => node.type === "button" && node.children.includes("discovery.raw"));
  assert.ok(raw); raw.props.onClick();
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
