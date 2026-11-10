import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import test from 'node:test'
import {
  getSidebarFavoriteStar,
  setSidebarFavoriteStar,
  getSidebarFavoriteStarMode,
  setSidebarFavoriteStarMode,
} from '../src/plugin-settings.ts'
import { apply as applyPlugin } from '../src/index.ts'

test('Issue 111: 侧栏收藏星标三档模式（all / favorites / none）配置与持久化', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'dsh-archive-star-mode-test-'))
  const previousDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = temporary

  try {
    // 1. 默认值为 "all"
    assert.equal(await getSidebarFavoriteStarMode(), 'all', 'sidebarFavoriteStar 默认模式为 all')
    assert.equal(await getSidebarFavoriteStar(), true, '默认向后兼容为 true')

    // 2. 设置三档值测试
    assert.equal(await setSidebarFavoriteStarMode('favorites'), 'favorites', '设置 favorites 成功')
    assert.equal(await getSidebarFavoriteStarMode(), 'favorites', '获取已更新为 favorites')
    assert.equal(await getSidebarFavoriteStar(), true, 'favorites 模式向后兼容为 true')

    assert.equal(await setSidebarFavoriteStarMode('none'), 'none', '设置 none 成功')
    assert.equal(await getSidebarFavoriteStarMode(), 'none', '获取已更新为 none')
    assert.equal(await getSidebarFavoriteStar(), false, 'none 模式向后兼容为 false')

    assert.equal(await setSidebarFavoriteStarMode('all'), 'all', '设置 all 成功')
    assert.equal(await getSidebarFavoriteStarMode(), 'all', '获取已更新为 all')
    assert.equal(await getSidebarFavoriteStar(), true, 'all 模式向后兼容为 true')

    // 3. 布尔值向后兼容
    assert.equal(await setSidebarFavoriteStar(false), false, '传入 false 兼容返回 false')
    assert.equal(await getSidebarFavoriteStarMode(), 'none', '模式更新为 none')
    assert.equal(await getSidebarFavoriteStar(), false, '获取已为 false')

    assert.equal(await setSidebarFavoriteStar(true), true, '传入 true 兼容返回 true')
    assert.equal(await getSidebarFavoriteStarMode(), 'all', '模式更新为 all')
    assert.equal(await getSidebarFavoriteStar(), true, '获取已为 true')

    // 4. 非法值拒绝
    await assert.rejects(
      async () => setSidebarFavoriteStarMode('invalid'),
      (err) => err instanceof TypeError,
      '非法模式字符串拒绝写入',
    )
  } finally {
    if (previousDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousDshHome
    await rm(temporary, { recursive: true, force: true }).catch(() => {})
  }
})

test('Issue 111: HTTP API 支持 mode（all / favorites / none）与布尔值兼容', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'dsh-archive-star-http-test-'))
  const previousDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = temporary

  const exactRoutes = new Map()
  const serverCtx = {
    logger: { warn() {}, info() {} },
    get(name) { return this[name] },
    webServer: {
      register(val) {
        if (val.kind === 'exact') exactRoutes.set(val.path, val)
        return () => { exactRoutes.delete(val.path) }
      },
    },
    workspaceRegistry: { list: () => [] },
    sessionProjectionCache: {
      requireTable: () => ({
        get: () => undefined,
        put: async () => {},
        delete: async () => {},
        entries: () => [].entries(),
      }),
    },
    sessionPersistence: {},
    typert: { register() { return () => {} } },
  }

  const dispose = await applyPlugin(serverCtx)
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (exactRoutes.has(url.pathname)) {
      return exactRoutes.get(url.pathname).handler(req, res)
    }
    res.writeHead(404)
    res.end()
  })
  const port = await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      resolve(addr && typeof addr === 'object' ? addr.port : 0)
    })
  })
  const baseUrl = `http://127.0.0.1:${port}/api/michengai/dsh-archive-manager/sidebar-favorite-star`
  const headers = { 'content-type': 'application/json', 'x-michengai-archive-settings': '1' }

  try {
    // 1. GET 初始返回 mode: 'all', enabled: true
    const getRes = await fetch(baseUrl)
    const getData = await getRes.json()
    assert.equal(getData.ok, true)
    assert.equal(getData.mode, 'all')
    assert.equal(getData.enabled, true)

    // 2. POST 切换为 favorites
    const postFav = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode: 'favorites' }),
    })
    const postFavData = await postFav.json()
    assert.equal(postFavData.ok, true)
    assert.equal(postFavData.mode, 'favorites')
    assert.equal(postFavData.enabled, true)

    // 3. POST 切换为 none
    const postNone = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode: 'none' }),
    })
    const postNoneData = await postNone.json()
    assert.equal(postNoneData.ok, true)
    assert.equal(postNoneData.mode, 'none')
    assert.equal(postNoneData.enabled, false)

    // 4. POST 传入旧格式 enabled: false / true 兼容
    const postCompat = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled: true }),
    })
    const postCompatData = await postCompat.json()
    assert.equal(postCompatData.ok, true)
    assert.equal(postCompatData.mode, 'all')
    assert.equal(postCompatData.enabled, true)
  } finally {
    await dispose()
    server.close()
    if (previousDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousDshHome
    await rm(temporary, { recursive: true, force: true }).catch(() => {})
  }
})

test('Issue 111: setupSidebarEntry 控制器支持 FavoriteStarMode 三档及设置卡片 SegmentedControl', async () => {
  const { readFile } = await import('node:fs/promises')
  const React = (await import('react')).default
  let definition
  new Function('window', await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'))({
    __ModuleLoader__: { load(value) { definition = value } },
  })
  let renderedComponent = null
  const client = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment }
    if (id.startsWith('react-dom')) return { createPortal: (node) => node }
    if (id === '@deepseek-ai/dsh-client-ui-primitives') {
      return {
        Button: (props) => React.createElement('button', props, props.children),
        Input: (props) => React.createElement('input', props),
        Modal: () => null,
        SegmentedControl: (props) => {
          renderedComponent = props
          return React.createElement('div', { id: props.id }, props.label)
        },
        IconArchiveOutlineMedium: () => null,
      }
    }
    return new Proxy({}, { get: () => function Dummy() { return null } })
  })

  const { setupSidebarEntry, ArchiveBundleConfigCard } = client.__test
  assert.equal(typeof setupSidebarEntry, 'function')

  const slotRegistrations = new Map()
  const mockCtx = {
    locale: { bind: () => (key) => key },
    slots: {
      inject() { return () => {} },
      register(meta, component) {
        slotRegistrations.set(meta.name, { meta, component })
        return () => slotRegistrations.delete(meta.name)
      },
    },
  }

  let serverStarMode = 'all'
  const modeChanges = []
  const boolChanges = []
  const controller = setupSidebarEntry(mockCtx, {
    callApi: async (path, options) => {
      if (path === '/sidebar-favorite-star') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body)
          if (body.mode) serverStarMode = body.mode
          else if (typeof body.enabled === 'boolean') serverStarMode = body.enabled ? 'all' : 'none'
          return { mode: serverStarMode, enabled: serverStarMode !== 'none' }
        }
        return { mode: serverStarMode, enabled: serverStarMode !== 'none' }
      }
      return { enabled: true }
    },
    renderPanel: () => null,
    ns: 'dsh-archive-manager',
    onSidebarFavoriteStarModeChange: (val) => {
      modeChanges.push(val)
    },
    onSidebarFavoriteStarChange: (val) => {
      boolChanges.push(val)
    },
  })

  // 1. 默认状态为 "all"
  assert.equal(controller.getSidebarFavoriteStarMode(), 'all')
  assert.equal(controller.isSidebarFavoriteStarEnabled(), true)

  // 2. 切换为 "favorites"（优先触发 mode 回调，不得被布尔回调冲掉）
  await controller.setSidebarFavoriteStarMode('favorites')
  assert.equal(controller.getSidebarFavoriteStarMode(), 'favorites')
  assert.equal(controller.isSidebarFavoriteStarEnabled(), true)
  assert.equal(serverStarMode, 'favorites')
  assert.deepEqual(modeChanges, ['favorites'])
  assert.equal(boolChanges.length, 0, '提供 mode 回调时不应调用布尔回调')

  // 3. 切换为 "none"
  await controller.setSidebarFavoriteStarMode('none')
  assert.equal(controller.getSidebarFavoriteStarMode(), 'none')
  assert.equal(controller.isSidebarFavoriteStarEnabled(), false)
  assert.equal(serverStarMode, 'none')
  assert.deepEqual(modeChanges, ['favorites', 'none'])

  // 4. 验证 ArchiveBundleConfigCard 渲染 SegmentedControl 且包含 3 个选项
  const cardElement = ArchiveBundleConfigCard({
    t: (k) => k,
    sidebarFavoriteStarMode: 'favorites',
    onSidebarFavoriteStarModeChange: () => {},
  })
  assert.ok(cardElement)
  const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []
  const starControl = nodes(cardElement).find((n) => n.props?.id === 'dsham-bundle-favorite-star-mode')
  assert.ok(starControl, '必须渲染 dsham-bundle-favorite-star-mode 分段控件')
  assert.equal(starControl.props.value, 'favorites')
  assert.deepEqual(starControl.props.options.map((opt) => opt.value), ['all', 'favorites', 'none'])

  controller.destroy()
})

test('Issue 111: DOM 行为：favorites 模式下仅已收藏行保留星标且无 hover 规则', async () => {
  const { readFile } = await import('node:fs/promises')
  const React = (await import('react')).default
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
    requestAnimationFrame(fn) {
      fn()
      return 1
    },
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

  const styles = new Map()
  const headElements = []

  const fakeDocument = {
    head: {
      appendChild(child) {
        headElements.push(child)
        if (child.dataset?.pluginCss) styles.set(child.dataset.pluginCss, child)
      },
    },
    body: {},
    documentElement: { dataset: {} },
    querySelector(selector) {
      if (selector.startsWith('style[data-plugin-css=')) {
        const match = selector.match(/data-plugin-css=\"([^\"]+)\"/)
        if (match) return styles.get(match[1]) ?? null
      }
      return null
    },
    querySelectorAll() { return [] },
    createElement(tag) {
      let _className = ''
      const classes = new Set()
      const el = {
        tagName: tag.toUpperCase(),
        dataset: {},
        classList: {
          contains(cls) { return classes.has(cls) },
          add(cls) { classes.add(cls); _className = [...classes].join(' ') },
          remove(cls) { classes.delete(cls); _className = [...classes].join(' ') },
          [Symbol.iterator]() { return classes[Symbol.iterator]() },
        },
        children: [],
        parentElement: null,
        nextElementSibling: null,
        attributes: new Map(),
        setAttribute(k, v) { this.attributes.set(k, String(v)) },
        getAttribute(k) { return this.attributes.get(k) ?? null },
        removeAttribute(k) { this.attributes.delete(k) },
        hasAttribute(k) { return this.attributes.has(k) },
        addEventListener() {},
        removeEventListener() {},
        appendChild(child) {
          child.parentElement = this
          this.children.push(child)
          return child
        },
        remove() {
          if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter(c => c !== this)
            this.parentElement = null
          }
          if (this.dataset?.pluginCss) {
            styles.delete(this.dataset.pluginCss)
          }
        },
        querySelector(sel) {
          if (sel.startsWith('.')) {
            const cls = sel.slice(1)
            return this.children.find(c => c.classList?.contains(cls) || c.className === cls) ?? null
          }
          return null
        },
        querySelectorAll() { return [] },
      }
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
    },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
    },
    removeEventListener(name, fn) {
      if (listeners.has(name)) {
        listeners.set(name, listeners.get(name).filter(f => f !== fn))
      }
    },
  }

  const origDocument = globalThis.document
  const origWindow = globalThis.window
  const origMutationObserver = globalThis.MutationObserver
  const origRaf = globalThis.requestAnimationFrame
  const origCaf = globalThis.cancelAnimationFrame

  globalThis.document = fakeDocument
  globalThis.window = fakeWindow
  globalThis.requestAnimationFrame = (fn) => { fn(); return 1; }
  globalThis.cancelAnimationFrame = () => {}
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  }

  try {
    const favoriteStore = createFavoriteRowStore()
    favoriteStore.bind({
      favoriteSessions: async () => ({ favoriteSessionIds: ['fav-1'] }),
      setSessionFavorite: async () => ({ favoriteSessionIds: ['fav-1'] }),
    })
    await favoriteStore.ensure()

    const mockCtx = {
      workspaces: { list: { getSnapshot: () => ({ items: [] }) } },
      sessions: { list: { getSnapshot: () => ({ byId: {} }) } },
    }

    const favRow = fakeDocument.createElement('div')
    favRow.setAttribute('data-row-key', 'session:fav-1')
    const favSlot = fakeDocument.createElement('span')
    favSlot.className = 'dsh_slot'
    favRow.appendChild(favSlot)

    const unfavRow = fakeDocument.createElement('div')
    unfavRow.setAttribute('data-row-key', 'session:unfav-2')
    const unfavSlot = fakeDocument.createElement('span')
    unfavSlot.className = 'dsh_slot'
    unfavRow.appendChild(unfavSlot)

    fakeDocument.querySelectorAll = (sel) => {
      if (sel === '[data-row-key]') return [favRow, unfavRow]
      return []
    }

    const favoritesOnly = setupWorkspaceFavoritesOnly(mockCtx, favoriteStore, () => (k) => k)

    // 1. 默认模式为 all：RowFavorite.css 包含 :hover 规则，两行均真实挂载了 starSlot
    const allStyle = styles.get('dsh-archive-manager/RowFavorite.css')
    assert.ok(allStyle)
    assert.ok(allStyle.textContent.includes(':hover .dsham_starSlot'), 'all 模式必须包含 hover 样式')
    assert.ok(favRow.querySelector('.dsham_starSlot'), 'all 模式下已收藏行必须挂载 starSlot')
    assert.ok(unfavRow.querySelector('.dsham_starSlot'), 'all 模式下未收藏行也必须挂载 starSlot（以支持 hover 触发）')

    // 2. 切换至 favorites 模式：未收藏行 starSlot 必须被摘除，已收藏行保留，且去除 :hover 规则
    favoritesOnly.setFavoriteStarMode('favorites')
    const favStyle = styles.get('dsh-archive-manager/RowFavorite.css')
    assert.ok(favStyle)
    assert.equal(favStyle.textContent.includes(':hover .dsham_starSlot'), false, 'favorites 模式下绝不能包含 hover 样式')
    assert.ok(favStyle.textContent.includes(".dsham_starSlot[data-favorited='true']"), 'favorites 模式保留已收藏样式')
    assert.ok(favRow.querySelector('.dsham_starSlot'), 'favorites 模式下已收藏行依然保留 starSlot')
    assert.equal(unfavRow.querySelector('.dsham_starSlot'), null, 'favorites 模式下未收藏行 starSlot 必须已被摘除')

    // 3. 切换至 none 模式：样式彻底卸载，两行星标均被摘除
    favoritesOnly.setFavoriteStarMode('none')
    assert.equal(styles.has('dsh-archive-manager/RowFavorite.css'), false, 'none 模式彻底移除样式')
    assert.equal(favRow.querySelector('.dsham_starSlot'), null, 'none 模式下已收藏行 starSlot 也被摘除')
    assert.equal(unfavRow.querySelector('.dsham_starSlot'), null, 'none 模式下未收藏行 starSlot 保持为 null')

    // 4. 回切为 all 模式：两行星标重新挂载恢复，样式重新注入 hover 规则
    favoritesOnly.setFavoriteStarMode('all')
    assert.ok(styles.get('dsh-archive-manager/RowFavorite.css')?.textContent.includes(':hover .dsham_starSlot'), '回切 all 模式后 hover 样式重新注入')
    assert.ok(favRow.querySelector('.dsham_starSlot'), '回切 all 模式后已收藏行星标恢复')
    assert.ok(unfavRow.querySelector('.dsham_starSlot'), '回切 all 模式后未收藏行星标恢复')

    favoritesOnly.dispose()
  } finally {
    globalThis.document = origDocument
    globalThis.window = origWindow
    globalThis.MutationObserver = origMutationObserver
    globalThis.requestAnimationFrame = origRaf
    globalThis.cancelAnimationFrame = origCaf
  }
})
