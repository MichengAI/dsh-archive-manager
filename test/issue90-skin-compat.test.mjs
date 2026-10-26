import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const clientSource = readFileSync(fileURLToPath(new URL('../src/client.ts', import.meta.url)), 'utf8');

test('Issue 90: CSS order 规则必须将星标设为 order:-1 并将前导格设为 order:-2', () => {
  // 必须包含星标自身的 order:-1
  assert.match(clientSource, /\.dsham_starSlot\{[^}]*order:-1/, '星标容器 .dsham_starSlot 必须声明 order:-1');
  // 必须包含前导格的 order:-2
  assert.match(clientSource, /\[data-row-key\^=['"]session:['"]\]>span:first-child\{[^}]*order:-2/, '前导格必须声明 order:-2 以保证其视觉顺序始终在星标之前');
});

test('Issue 90: 星标 DOM 必须追加到行尾 (row.appendChild)，绝不能插入在前导格后 (cell.after)', () => {
  // 源码中 ensureRowStars 内不得存在 cell.after(holder)
  assert.doesNotMatch(clientSource, /cell\.after\(holder\)/, '不得将星标通过 cell.after 插入在前导格后，避免打乱原生子元素索引');
  // 源码中必须通过 row.appendChild(holder) 挂载在行尾
  assert.match(clientSource, /row\.appendChild\(holder\)/, '必须将星标通过 row.appendChild 挂载在行尾');
});

test('Issue 90: DOM 模拟验证 orca-link 位置选择器 (nth-child(2)=title, nth-child(3)=time) 不被篡改', () => {
  // 创建最小 Fake DOM 节点类
  class FakeNode {
    constructor(tagName, className = '') {
      this.tagName = tagName.toUpperCase();
      this.className = className;
      const classArray = className.split(/\s+/).filter(Boolean);
      this.classList = {
        contains: (cls) => classArray.includes(cls),
        some: (fn) => classArray.some(fn),
        [Symbol.iterator]: () => classArray[Symbol.iterator](),
      };
      this.children = [];
      this.parentElement = null;
      this.attributes = new Map();
      this.dataset = {};
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) ?? null; }
    hasAttribute(k) { return this.attributes.has(k); }
    removeAttribute(k) { this.attributes.delete(k); }
    after(newSibling) {
      if (!this.parentElement) return;
      const idx = this.parentElement.children.indexOf(this);
      if (idx >= 0) {
        if (newSibling.parentElement) newSibling.remove();
        newSibling.parentElement = this.parentElement;
        this.parentElement.children.splice(idx + 1, 0, newSibling);
      }
    }
    appendChild(child) {
      if (child.parentElement) {
        const idx = child.parentElement.children.indexOf(child);
        if (idx >= 0) child.parentElement.children.splice(idx, 1);
      }
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    remove() {
      if (this.parentElement) {
        const idx = this.parentElement.children.indexOf(this);
        if (idx >= 0) this.parentElement.children.splice(idx, 1);
        this.parentElement = null;
      }
    }
    querySelector(selector) {
      for (const child of this.children) {
        if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
      }
      return null;
    }
    get nextElementSibling() {
      if (!this.parentElement) return null;
      const idx = this.parentElement.children.indexOf(this);
      return idx >= 0 && idx < this.parentElement.children.length - 1 ? this.parentElement.children[idx + 1] : null;
    }
    get previousElementSibling() {
      if (!this.parentElement) return null;
      const idx = this.parentElement.children.indexOf(this);
      return idx > 0 ? this.parentElement.children[idx - 1] : null;
    }
    get lastElementChild() {
      return this.children.length > 0 ? this.children[this.children.length - 1] : null;
    }
  }

  // 模拟宿主生成的原生会话行：[slot, title, time, rowActions]
  const row = new FakeNode('div', 'YDXeBa_sessionRow');
  row.setAttribute('data-row-key', 'session:sess_123');

  const slot = new FakeNode('span', 'YDXeBa_slot');
  const title = new FakeNode('span', 'YDXeBa_title');
  title.textContent = '测试会话标题';
  const time = new FakeNode('span', 'YDXeBa_time');
  time.textContent = '12m';
  const rowActions = new FakeNode('span', 'YDXeBa_rowActions');
  const btn = new FakeNode('button');
  rowActions.appendChild(btn);

  row.appendChild(slot);
  row.appendChild(title);
  row.appendChild(time);
  row.appendChild(rowActions);

  // 从 src/client.ts 解析出 ensureRowStars 内部的挂载动作
  const insertMatches = clientSource.includes('cell.after(holder)');
  const appendMatches = clientSource.includes('row.appendChild(holder)');

  // 模拟执行当前源码对应的真实行为
  const document = { createElement: (tag) => new FakeNode(tag) };
  const ROW_STAR_SLOT_CLASS = 'dsham_starSlot';

  const cell = Array.from(row.children).find((child) => child.tagName === 'SPAN' && Array.from(child.classList).some((name) => name === 'slot' || name.endsWith('_slot'))) ?? null;
  let holder = Array.from(row.children).find((child) => child.classList.contains(ROW_STAR_SLOT_CLASS)) ?? null;

  if (appendMatches && !insertMatches) {
    if (holder !== null && holder.nextElementSibling !== null) {
      row.appendChild(holder);
    }
    if (holder === null) {
      holder = document.createElement('span');
      holder.className = ROW_STAR_SLOT_CLASS;
      row.appendChild(holder);
    }
  } else {
    // 旧行为：cell.after(holder)
    if (holder === null) {
      holder = document.createElement('span');
      holder.className = ROW_STAR_SLOT_CLASS;
      cell.after(holder);
    }
  }

  // 断言：原生 4 个子元素的结构索引必须保持一致
  assert.equal(row.children[0], slot, '索引 0 (nth-child(1)) 必须保持为 slot 前导格');
  assert.equal(row.children[1], title, '索引 1 (nth-child(2)) 必须保持为 title 会话标题（针对 orca-link）');
  assert.equal(row.children[2], time, '索引 2 (nth-child(3)) 必须保持为 time 会话时间（针对 orca-link）');
  assert.equal(row.children[3], rowActions, '索引 3 (nth-child(4)) 必须保持为 rowActions');

  // 断言：星标插在行尾
  assert.equal(row.children.length, 5, '会话行子元素总数应为 5');
  assert.equal(row.lastElementChild.className, 'dsham_starSlot', '行尾子元素必须为星标容器');

  // 模拟 orca-link 的 nth-child(2) 与 nth-child(3) 选择器规则
  const orcaTitleElement = row.children[1]; // :nth-child(2)
  const orcaTimeElement = row.children[2];  // :nth-child(3)
  assert.equal(orcaTitleElement.textContent, '测试会话标题', 'orca-link nth-child(2) 获取到的必须是会话标题');
  assert.equal(orcaTimeElement.textContent, '12m', 'orca-link nth-child(3) 获取到的必须是时间');
});
