import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const clientSource = readFileSync(fileURLToPath(new URL('../src/client.ts', import.meta.url)), 'utf8');
const requireFallback = createRequire(import.meta.url);
const CLIENT_BUNDLE = fileURLToPath(new URL('../lib/client.js', import.meta.url));

// --- 宿主静态模块桩 ---
const statics = {};
for (const spec of ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis', '@deepseek-ai/dsh-client-ui-slots']) {
  statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}
statics['@deepseek-ai/dsh-client-ui-primitives'] = new Proxy({}, {
  get: (target, prop) => {
    if (typeof prop === 'string') target[prop] = () => null;
    return target[prop];
  }
});
const { loadClientStore } = await import('./helpers/client-store.mjs');
const { exports: { defineStore } } = await loadClientStore();
statics['@deepseek-ai/dsh-client-store'] = { defineStore };

// --- 最小浏览器环境桩 ---
globalThis.window = globalThis;
const styleStub = { dataset: {}, style: {}, setAttribute() {}, appendChild() {}, append() {}, remove() {}, removeChild() {}, addEventListener() {}, set textContent(_v) {} };
const headStub = { appendChild() {}, append() {}, removeChild() {}, insertBefore() {}, contains: () => false, querySelector: () => null, querySelectorAll: () => [] };
globalThis.document = {
  head: headStub,
  body: headStub,
  documentElement: headStub,
  querySelector: (s) => s === 'head' || s === 'body' ? headStub : null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => styleStub,
  addEventListener() {},
  removeEventListener() {}
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
globalThis.MutationObserver = class { observe() {} disconnect() {} };

// --- 装载 bundle ---
const factories = new Map();
window.__ModuleLoader__ = { load: (handoff) => { factories.set(handoff.id, handoff.factory); } };
await import(pathToFileURL(CLIENT_BUNDLE).href);
const bundle = factories.get('@michengai/dsh-archive-manager')((spec) => {
  if (Object.hasOwn(statics, spec)) return statics[spec];
  throw new Error(`smoke require miss: ${spec}`);
}, { exports: {} }, {});

const { resolveRowHasStatus, mutationTouches } = bundle.__test ?? {};

test('Issue 92: resolveRowHasStatus 状态点检测与生命周期（支持变异验证）', () => {
  assert.equal(typeof resolveRowHasStatus, 'function', 'resolveRowHasStatus 必须作为纯函数导出并可测试');

  // 1. cell 为空或无子节点
  assert.equal(resolveRowHasStatus(null), false, 'cell 为 null 时返回 false');

  class MinimalElement {
    constructor(tagName, attrs = {}) {
      this.tagName = tagName.toUpperCase();
      this.attributes = new Map(Object.entries(attrs));
      this.children = [];
    }
    hasAttribute(name) { return this.attributes.has(name); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      return child;
    }
    querySelector(selector) {
      for (const child of this.children) {
        if (selector === '[data-state]' && child.hasAttribute('data-state')) return child;
        const sub = child.querySelector?.(selector);
        if (sub) return sub;
      }
      return null;
    }
  }

  const slot = new MinimalElement('span');
  assert.equal(resolveRowHasStatus(slot), false, '空 slot 必须返回 false');

  // 2. 加入 ongoing 旋转 spinner
  const spinner = new MinimalElement('svg', { 'data-state': 'ongoing' });
  slot.appendChild(spinner);
  assert.equal(resolveRowHasStatus(slot), true, '包含 [data-state="ongoing"] 时必须返回 true');

  // 3. 状态移除（running -> idle）
  slot.removeChild(spinner);
  assert.equal(resolveRowHasStatus(slot), false, '状态点移除后必须恢复返回 false');

  // 4. 加入 warning 等待审批点
  const warningDot = new MinimalElement('span', { 'data-state': 'warning' });
  slot.appendChild(warningDot);
  assert.equal(resolveRowHasStatus(slot), true, '包含 [data-state="warning"] 时必须返回 true');
});

test('Issue 92: mutationTouches 必须双向感知状态点的挂载与卸载 (解决 running->idle 不刷新缺陷)', () => {
  assert.equal(typeof mutationTouches, 'function', 'mutationTouches 必须可测');

  class FakeDomElement {
    constructor(tagName, className = '', attrs = {}) {
      this.tagName = tagName.toUpperCase();
      this.className = className;
      this.nodeType = 1;
      this.attributes = new Map(Object.entries(attrs));
      this.parentElement = null;
    }
    matches(sel) {
      if (sel.includes('[data-row-key]')) return this.attributes.has('data-row-key');
      if (sel.includes('.YDXeBa_slot')) return this.className.includes('YDXeBa_slot');
      return false;
    }
    closest(sel) {
      if (this.matches(sel)) return this;
      return this.parentElement?.closest(sel) ?? null;
    }
    querySelector(sel) { return null; }
  }

  const row = new FakeDomElement('div', 'YDXeBa_sessionRow', { 'data-row-key': 'session:s1' });
  const slot = new FakeDomElement('span', 'YDXeBa_slot');
  slot.parentElement = row;
  const statusSvg = new FakeDomElement('svg', 'spinner', { 'data-state': 'ongoing' });
  statusSvg.parentElement = slot;

  const selector = '[data-row-key], [role="menu"]';

  // 场景 A: 状态点被移除 (removedNodes 包含状态点或其父级)，但 addedNodes 为空
  const removeRecord = {
    type: 'childList',
    target: slot,
    addedNodes: [],
    removedNodes: [statusSvg],
  };
  assert.equal(
    mutationTouches([removeRecord], selector),
    true,
    '当状态点被移除且发生于 sessionRow 内部时，mutationTouches 必须返回 true 触发重新检查'
  );

  // 场景 B: 目标 target 处于 sessionRow 内部
  const targetTouchedRecord = {
    type: 'childList',
    target: slot,
    addedNodes: [],
    removedNodes: [],
  };
  assert.equal(
    mutationTouches([targetTouchedRecord], selector),
    true,
    '当 target 本身位于 sessionRow 内部时，mutationTouches 必须判定为命中'
  );

  // 场景 C: 完全无关的 DOM 变动
  const unrelatedDiv = new FakeDomElement('div', 'unrelated-container');
  const unrelatedRecord = {
    type: 'childList',
    target: unrelatedDiv,
    addedNodes: [],
    removedNodes: [],
  };
  assert.equal(
    mutationTouches([unrelatedRecord], selector),
    false,
    '无关 DOM 节点的变动绝不能误判为 touched'
  );

  // 场景 D: 整行被移除（target 是行外容器，完全依赖 removedNodes 分支独立命中）
  const listContainer = new FakeDomElement('div', 'session-list-wrapper');
  const detachedRow = new FakeDomElement('div', 'YDXeBa_sessionRow', { 'data-row-key': 'session:s2' });
  detachedRow.parentElement = null; // 真实 DOM 移除后断链
  const rowRemoveRecord = {
    type: 'childList',
    target: listContainer,
    addedNodes: [],
    removedNodes: [detachedRow],
  };
  assert.equal(
    mutationTouches([rowRemoveRecord], selector),
    true,
    '当整行从外部列表容器中被移除时，仅靠 removedNodes 也能独立判定为 touched'
  );
});

test('Issue 92: CSS 必须保证状态点完全可见、且星标在有状态时转为右下角角标模式', () => {
  // 1. 无状态时 hover 隐藏底层
  assert.match(
    clientSource,
    /:hover>span:first-child:not\(:has\(\[data-state\]\)\)/,
    '前导格在无状态 hover 时允许淡出底层'
  );

  // 2. 有状态点时保持完全可见 (opacity: 1)
  assert.match(
    clientSource,
    /\[data-row-key\^=['"]session:['"]\]\[data-dsham-has-status=['"]true['"]\]>span:first-child|:has\(\[data-state\]\)\{opacity:1\}/,
    '有状态点时前导格必须设置 opacity:1'
  );

  // 3. 核心角标：有状态点时星标转为右下角 10px 角标，与状态点共存
  assert.match(
    clientSource,
    /\[data-dsham-has-status=['"]true['"]\] \.dsham_starSlot[^}]*width:10px;height:10px;top:auto;bottom:3px/,
    '有状态时星标容器必须转为 10px 停靠在右下角角标位'
  );
  assert.match(
    clientSource,
    /\.dsham_rowStar svg\{width:10px;height:10px;filter:drop-shadow/,
    '角标星标必须带有微小阴影保证辨识度'
  );
});
