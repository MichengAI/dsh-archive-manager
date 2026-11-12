import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import React from 'react'

test('Issue 115: 「只看收藏」注入防御：拒绝误命中上下文菜单或二级子菜单，防止面板克隆叠加与入口错位', async () => {
  let definition
  const listeners = new Map()
  const fakeWindow = {
    __ModuleLoader__: { load(value) { definition = value } },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
    },
    removeEventListener(name, fn) {
      if (listeners.has(name)) {
        listeners.set(name, listeners.get(name).filter(f => f !== fn))
      }
    },
    dispatchEvent(ev) {
      const list = listeners.get(ev.type) ?? []
      for (const fn of list) fn(ev)
      return true
    },
    requestAnimationFrame(fn) { fn(); return 1 },
    cancelAnimationFrame() {},
    localStorage: { getItem: () => null, setItem: () => {} },
  }

  new Function('window', await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'))(fakeWindow)
  const client = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment }
    if (id.startsWith('react-dom')) return { createPortal: (node) => node }
    return new Proxy({}, { get: () => function Dummy() { return null } })
  })

  const { setupWorkspaceFavoritesOnly, createFavoriteRowStore } = client.__test
  assert.equal(typeof setupWorkspaceFavoritesOnly, 'function')

  const createMockElement = (tag) => {
    let _className = ''
    const classes = new Set()
    const el = {
      tagName: tag.toUpperCase(),
      dataset: {},
      style: {
        getPropertyValue(prop) { return this[prop] ?? '' },
        setProperty(prop, val) { this[prop] = String(val) },
      },
      classList: {
        contains(cls) { return classes.has(cls) },
        add(cls) { classes.add(cls); _className = [...classes].join(' ') },
        remove(cls) { classes.delete(cls); _className = [...classes].join(' ') },
        [Symbol.iterator]() { return classes[Symbol.iterator]() },
      },
      children: [],
      parentElement: null,
      nextSibling: null,
      attributes: new Map(),
      setAttribute(k, v) { this.attributes.set(k, String(v)) },
      getAttribute(k) { return this.attributes.get(k) ?? null },
      removeAttribute(k) { this.attributes.delete(k) },
      hasAttribute(k) { return this.attributes.has(k) },
      contains(other) {
        let curr = other
        while (curr) {
          if (curr === this) return true
          curr = curr.parentElement
        }
        return false
      },
      matches(selector) {
        if (selector === '[data-context-menu], [data-contextual]') {
          return this.hasAttribute('data-context-menu') || this.hasAttribute('data-contextual')
        }
        return false
      },
      closest(selector) {
        let curr = this
        while (curr) {
          if (selector === '[role="menu"]' && curr.getAttribute('role') === 'menu') return curr
          if (selector === '[data-context-menu], [data-contextual]' && (curr.hasAttribute('data-context-menu') || curr.hasAttribute('data-contextual'))) return curr
          if (selector === '[data-context-menu]' && curr.hasAttribute('data-context-menu')) return curr
          curr = curr.parentElement
        }
        return null
      },
      appendChild(child) {
        child.parentElement = this
        const last = this.children[this.children.length - 1]
        if (last) last.nextSibling = child
        child.nextSibling = null
        this.children.push(child)
        return child
      },
      insertBefore(newNode, refNode) {
        newNode.parentElement = this
        const idx = this.children.indexOf(refNode)
        if (idx === -1) {
          return this.appendChild(newNode)
        }
        const prev = this.children[idx - 1]
        if (prev) prev.nextSibling = newNode
        newNode.nextSibling = refNode
        this.children.splice(idx, 0, newNode)
        return newNode
      },
      remove() {
        if (this.parentElement) {
          const idx = this.parentElement.children.indexOf(this)
          if (idx !== -1) {
            const prev = this.parentElement.children[idx - 1]
            const next = this.parentElement.children[idx + 1] ?? null
            if (prev) prev.nextSibling = next
            this.parentElement.children.splice(idx, 1)
          }
          this.parentElement = null
        }
      },
      querySelector(sel) {
        const all = this.querySelectorAll(sel)
        return all[0] ?? null
      },
      querySelectorAll(sel) {
        const results = []
        const traverse = (node) => {
          for (const child of node.children) {
            let match = false
            const attrMatch = sel.match(/^([a-z0-9_-]+)?\[([a-z0-9_-]+)(?:=["']?([^"']*)["']?)?\]$/i)
            if (attrMatch) {
              const [, tag, attrName, attrVal] = attrMatch
              if (!tag || child.tagName.toLowerCase() === tag.toLowerCase()) {
                if (child.hasAttribute(attrName)) {
                  if (attrVal === undefined || child.getAttribute(attrName) === attrVal) {
                    match = true
                  }
                }
              }
            } else if (sel === 'button[role="menuitem"]') {
              if (child.tagName === 'BUTTON' && child.getAttribute('role') === 'menuitem') match = true
            } else if (sel === 'span' && child.tagName === 'SPAN') match = true
            else if (sel === 'svg' && child.tagName === 'SVG') match = true
            if (match) results.push(child)
            traverse(child)
          }
        }
        traverse(this)
        return results
      },
      cloneNode(deep = true) {
        const copy = createMockElement(this.tagName.toLowerCase())
        copy.className = this.className
        copy.textContent = this.textContent
        for (const [k, v] of this.attributes) copy.setAttribute(k, v)
        for (const [k, v] of Object.entries(this.dataset)) copy.dataset[k] = v
        if (deep) {
          for (const child of this.children) {
            copy.appendChild(child.cloneNode(true))
          }
        }
        return copy
      },
    }
    let _textContent = ''
    Object.defineProperty(el, 'textContent', {
      get() {
        if (this.children.length === 0) return _textContent
        return this.children.map(c => c.textContent).join('')
      },
      set(val) {
        _textContent = String(val ?? '')
        this.children = []
      },
      configurable: true,
    })
    Object.defineProperty(el, 'className', {
      get() { return _className },
      set(val) {
        _className = String(val ?? '')
        classes.clear()
        for (const c of _className.split(/\s+/).filter(Boolean)) classes.add(c)
      },
      configurable: true,
    })
    return el
  }

  const allMenus = []
  const fakeDocument = {
    head: { appendChild() {} },
    body: createMockElement('body'),
    documentElement: { dataset: {} },
    querySelector() { return null },
    querySelectorAll(sel) {
      if (sel === '[role="menu"]') return allMenus
      if (sel === '[data-row-key]') return []
      if (sel.startsWith('button[')) {
        const results = []
        for (const menu of allMenus) results.push(...menu.querySelectorAll(sel))
        return results
      }
      return []
    },
    createElement(tag) { return createMockElement(tag) },
    addEventListener() {},
    removeEventListener() {},
  }

  const origDocument = globalThis.document
  const origWindow = globalThis.window
  const origMutationObserver = globalThis.MutationObserver
  const origRaf = globalThis.requestAnimationFrame
  const origCaf = globalThis.cancelAnimationFrame

  globalThis.document = fakeDocument
  globalThis.window = fakeWindow
  globalThis.requestAnimationFrame = (fn) => { fn(); return 1 }
  globalThis.cancelAnimationFrame = () => {}
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  }

  try {
    const favoriteStore = createFavoriteRowStore()
    favoriteStore.bind({
      favoriteSessions: async () => ({ favoriteSessionIds: [] }),
      setSessionFavorite: async () => ({ favoriteSessionIds: [] }),
    })
    await favoriteStore.ensure()

    const mockCtx = {
      workspaces: { list: { getSnapshot: () => ({ items: [] }) } },
      sessions: { list: { getSnapshot: () => ({ byId: {} }) } },
    }

    // =========================================================================
    // 场景 1: DSH 0.2.2-rc.1 结构的上下文二级子菜单（如 better-workspace 筛选会话）
    // 结构：子菜单直接挂在父级菜单内，且子菜单按钮是 MenuSurface[role="menu"] 的直接子元素
    // =========================================================================
    const rc1ContextMenu = createMockElement('div')
    rc1ContextMenu.setAttribute('role', 'menu')
    rc1ContextMenu.setAttribute('data-context-menu', '')

    const rc1TriggerWrap = createMockElement('div')
    rc1TriggerWrap.className = 'itemWrap'
    const rc1TriggerBtn = createMockElement('button')
    rc1TriggerBtn.setAttribute('role', 'menuitem')
    rc1TriggerBtn.textContent = '筛选会话'
    rc1TriggerWrap.appendChild(rc1TriggerBtn)

    const rc1Submenu = createMockElement('div')
    rc1Submenu.setAttribute('role', 'menu')
    rc1Submenu.className = 'dsh_submenu'

    const rc1SubBtn1 = createMockElement('button')
    rc1SubBtn1.setAttribute('role', 'menuitem')
    rc1SubBtn1.textContent = '跟随全局'

    const rc1SubBtn2 = createMockElement('button')
    rc1SubBtn2.setAttribute('role', 'menuitem')
    rc1SubBtn2.textContent = '仅显示已归档'

    rc1Submenu.appendChild(rc1SubBtn1)
    rc1Submenu.appendChild(rc1SubBtn2)
    rc1TriggerWrap.appendChild(rc1Submenu)
    rc1ContextMenu.appendChild(rc1TriggerWrap)

    allMenus.push(rc1ContextMenu, rc1Submenu)

    // =========================================================================
    // 场景 2: DSH 0.2.2-rc.2 结构的 Portal 子菜单
    // 结构：SubmenuPanel portaled 到 document.body，有 itemWrap 包装，但属于 submenu
    // =========================================================================
    const rc2PortaledSubmenu = createMockElement('div')
    rc2PortaledSubmenu.setAttribute('role', 'menu')
    rc2PortaledSubmenu.className = 'dsh_submenu dsh_scrollable'
    rc2PortaledSubmenu.setAttribute('data-submenu-layout', 'side')
    rc2PortaledSubmenu.setAttribute('data-contextual', '')

    const rc2Viewport = createMockElement('div')
    rc2Viewport.className = 'viewport'

    const rc2Wrap1 = createMockElement('div')
    rc2Wrap1.className = 'itemWrap'
    const rc2Btn1 = createMockElement('button')
    rc2Btn1.setAttribute('role', 'menuitem')
    rc2Btn1.textContent = '跟随全局'
    rc2Wrap1.appendChild(rc2Btn1)

    const rc2Wrap2 = createMockElement('div')
    rc2Wrap2.className = 'itemWrap'
    const rc2Btn2 = createMockElement('button')
    rc2Btn2.setAttribute('role', 'menuitem')
    rc2Btn2.textContent = '仅显示已归档'
    rc2Wrap2.appendChild(rc2Btn2)

    rc2Viewport.appendChild(rc2Wrap1)
    rc2Viewport.appendChild(rc2Wrap2)
    rc2PortaledSubmenu.appendChild(rc2Viewport)

    allMenus.push(rc2PortaledSubmenu)

    // =========================================================================
    // 场景 3: 真实正规「视图选项」菜单（包含排序、分组与归档过滤）
    // =========================================================================
    const viewOptionsMenu = createMockElement('div')
    viewOptionsMenu.setAttribute('role', 'menu')
    viewOptionsMenu.className = 'dsh_viewOptionsMenu dsh_scrollable'

    const voViewport = createMockElement('div')
    voViewport.className = 'viewport'

    const createMenuItem = (text) => {
      const wrap = createMockElement('div')
      wrap.className = 'itemWrap'
      const btn = createMockElement('button')
      btn.setAttribute('role', 'menuitem')
      const spanIcon = createMockElement('span')
      const spanLabel = createMockElement('span')
      spanLabel.textContent = text
      btn.appendChild(spanIcon)
      btn.appendChild(spanLabel)
      wrap.appendChild(btn)
      return { wrap, btn }
    }

    voViewport.appendChild(createMenuItem('按工作区').wrap)
    voViewport.appendChild(createMenuItem('单列表').wrap)
    voViewport.appendChild(createMenuItem('手动排序').wrap)
    voViewport.appendChild(createMenuItem('最近更新').wrap)
    voViewport.appendChild(createMenuItem('隐藏已归档').wrap)
    voViewport.appendChild(createMenuItem('全部对话（显示已归档）').wrap)
    const { wrap: targetWrap } = createMenuItem('仅显示已归档')
    voViewport.appendChild(targetWrap)
    viewOptionsMenu.appendChild(voViewport)

    allMenus.push(viewOptionsMenu)

    // 执行 setupWorkspaceFavoritesOnly
    const favoritesOnly = setupWorkspaceFavoritesOnly(mockCtx, favoriteStore, () => (k) => k === 'organizer.favoritesOnly' ? '只看收藏' : k)

    // -------------------------------------------------------------------------
    // 断言 1 (针对场景 1): rc1Submenu 绝对不能被克隆叠加，父级容器下子元素数量保持为 2
    // （如果发生 bug，rc1TriggerWrap 会被插入一个克隆出来的整块 rc1Submenu）
    // -------------------------------------------------------------------------
    assert.equal(rc1TriggerWrap.children.length, 2, 'rc1 上下文菜单子菜单项数量不能增加（禁止克隆整个子菜单面板）')
    assert.equal(rc1Submenu.querySelectorAll('[data-dsham-favorites-only]').length, 0, 'rc1 子菜单内不能含有只看收藏')
    assert.equal(rc1ContextMenu.querySelectorAll('[data-dsham-favorites-only]').length, 0, 'rc1 整个上下文菜单内不能含有只看收藏')

    // -------------------------------------------------------------------------
    // 断言 2 (针对场景 2): rc2PortaledSubmenu 也不能被注入只看收藏（不可错位进右键子菜单）
    // -------------------------------------------------------------------------
    assert.equal(rc2PortaledSubmenu.querySelectorAll('[data-dsham-favorites-only]').length, 0, 'rc2 浮层子菜单内绝不能注入只看收藏')
    assert.equal(rc2Viewport.children.length, 2, 'rc2 子菜单项数量必须保持为原始的 2 项')

    // -------------------------------------------------------------------------
    // 断言 3 (针对场景 3): 正规视图选项菜单必须成功且精准注入「只看收藏」
    // -------------------------------------------------------------------------
    const injectedBtn = viewOptionsMenu.querySelector('button[data-dsham-favorites-only="true"]')
    assert.ok(injectedBtn, '视图选项菜单中必须成功注入只看收藏按钮')
    assert.equal(injectedBtn.getAttribute('role'), 'menuitemcheckbox')
    assert.equal(injectedBtn.getAttribute('aria-label'), '只看收藏')
    assert.equal(targetWrap.nextSibling?.children?.[0], injectedBtn, '注入项必须紧跟在「仅显示已归档」之后')

    favoritesOnly.dispose()
  } finally {
    globalThis.document = origDocument
    globalThis.window = origWindow
    globalThis.MutationObserver = origMutationObserver
    globalThis.requestAnimationFrame = origRaf
    globalThis.cancelAnimationFrame = origCaf
  }
})
