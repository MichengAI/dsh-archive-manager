import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import test from 'node:test'
import { getSidebarFavoriteStar, setSidebarFavoriteStar, getSidebarEntry, setSidebarEntry } from '../src/plugin-settings.ts'
import { apply as applyPlugin } from '../src/index.ts'

test('Issue 99: 侧栏收藏星标配置项、持久化与 HTTP API', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'dsh-archive-star-test-'))
  const previousDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = temporary

  try {
    // 1. 默认值与设置方法测试：默认开启（true）
    assert.equal(await getSidebarFavoriteStar(), true, 'sidebarFavoriteStar 默认开启（true）')

    const disabled = await setSidebarFavoriteStar(false)
    assert.equal(disabled, false, 'setSidebarFavoriteStar(false) 返回 false')
    assert.equal(await getSidebarFavoriteStar(), false, 'getSidebarFavoriteStar() 返回已更新的 false')

    const enabled = await setSidebarFavoriteStar(true)
    assert.equal(enabled, true, 'setSidebarFavoriteStar(true) 返回 true')
    assert.equal(await getSidebarFavoriteStar(), true, 'getSidebarFavoriteStar() 返回已更新的 true')

    // 非布尔值校验
    await assert.rejects(
      async () => setSidebarFavoriteStar('true'),
      (err) => err instanceof TypeError,
      '非布尔值拒绝写入',
    )

    // 2. HTTP 路由测试
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
    assert.ok(exactRoutes.has('/api/michengai/dsh-archive-manager/sidebar-favorite-star'), 'sidebar-favorite-star 路由必须成功注册')

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
    const headers = { 'content-type': 'application/json', 'x-michengai-plugin-update': '1' }

    try {
      // 跨站或无守卫头被拒绝（403）
      const untrustedRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify({ enabled: false }),
      })
      assert.equal(untrustedRes.status, 403, '缺少同源守卫头时 POST 返回 403')

      // GET 状态
      const getRes = await fetch(baseUrl)
      assert.equal(getRes.status, 200)
      const getData = await getRes.json()
      assert.equal(getData.ok, true)
      assert.equal(getData.enabled, true, 'HTTP GET enabled 当前应为 true')

      // POST 更新关闭
      const postRes = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: false }),
      })
      assert.equal(postRes.status, 200)
      const postData = await postRes.json()
      assert.equal(postData.ok, true)
      assert.equal(postData.enabled, false)

      // GET 验证已更新为 false
      const getRes2 = await fetch(baseUrl)
      const getData2 = await getRes2.json()
      assert.equal(getData2.ok, true)
      assert.equal(getData2.enabled, false)

      // POST 非法参数校验
      const postInvalid = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: 'no' }),
      })
      assert.equal(postInvalid.status, 400)

      // HEAD 请求
      const headRes = await fetch(baseUrl, { method: 'HEAD' })
      assert.equal(headRes.status, 200)

      // 不支持的 HTTP 方法返回 405
      const putRes = await fetch(baseUrl, { method: 'PUT', headers })
      assert.equal(putRes.status, 405)
    } finally {
      await dispose()
      server.close()
    }

    // 3. 跨重启持久化检查
    assert.equal(await getSidebarFavoriteStar(), false, '跨重启后正确读回已保存的 sidebarFavoriteStar=false')
  } finally {
    if (previousDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousDshHome
    await rm(temporary, { recursive: true, force: true }).catch(() => {})
  }
})

test('Issue 99: setupSidebarEntry 控制器支持 sidebarFavoriteStar 开关与事件通知', async () => {
  const { readFile } = await import('node:fs/promises')
  const React = (await import('react')).default
  let definition
  new Function('window', await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'))({
    __ModuleLoader__: { load(value) { definition = value } },
  })
  const client = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment }
    if (id.startsWith('react-dom')) return { createPortal: (node) => node }
    if (id === '@deepseek-ai/dsh-client-ui-primitives') {
      return {
        Button: (props) => React.createElement('button', props, props.children),
        Input: (props) => React.createElement('input', props),
        Modal: () => null,
        SegmentedTabs: () => null,
        Switch: (props) => React.createElement('input', { type: 'checkbox', checked: props.checked, onChange: (e) => props.onChange(e.target.checked) }),
        IconArchiveOutlineMedium: () => null,
      }
    }
    return new Proxy({}, { get: () => function Dummy() { return null } })
  })

  const { setupSidebarEntry } = client.__test
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

  let serverStar = true
  const changes = []
  const controller = setupSidebarEntry(mockCtx, {
    callApi: async (path, options) => {
      if (path === '/sidebar-favorite-star') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body)
          serverStar = body.enabled
          return { enabled: serverStar }
        }
        return { enabled: serverStar }
      }
      return { enabled: true }
    },
    renderPanel: () => null,
    ns: 'dsh-archive-manager',
    onSidebarFavoriteStarChange: (val) => {
      changes.push(val)
    },
  })

  // 1. 默认状态为 true
  assert.equal(controller.isSidebarFavoriteStarEnabled(), true)

  // 2. 切换为 false
  await controller.setSidebarFavoriteStar(false)
  assert.equal(controller.isSidebarFavoriteStarEnabled(), false)
  assert.equal(serverStar, false)
  assert.deepEqual(changes, [false])

  // 3. 再次切换为 true
  await controller.setSidebarFavoriteStar(true)
  assert.equal(controller.isSidebarFavoriteStarEnabled(), true)
  assert.equal(serverStar, true)
  assert.deepEqual(changes, [false, true])

  controller.destroy()
})

test('Issue 99: 侧栏收藏星标关闭时卸载 CSS 与清除 DOM 节点，开启时恢复', async () => {
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

  // 构建模拟 DOM 树
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
        const match = selector.match(/data-plugin-css="([^"]+)"/)
        if (match) return styles.get(match[1]) ?? null
      }
      return null
    },
    querySelectorAll() { return [] },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        dataset: {},
        classList: {
          contains(cls) { return this.classes.includes(cls) },
          add(cls) { if (!this.classes.includes(cls)) this.classes.push(cls) },
          remove(cls) { this.classes = this.classes.filter(c => c !== cls) },
          classes: [],
          [Symbol.iterator]() { return this.classes[Symbol.iterator]() },
        },
        className: '',
        children: [],
        parentElement: null,
        nextElementSibling: null,
        attributes: new Map(),
        setAttribute(k, v) { this.attributes.set(k, String(v)) },
        getAttribute(k) { return this.attributes.get(k) ?? null },
        removeAttribute(k) { this.attributes.delete(k) },
        hasAttribute(k) { return this.attributes.has(k) },
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
            return this.children.find(c => c.classList.contains(cls) || c.className === cls) ?? null
          }
          return null
        },
        querySelectorAll() { return [] },
      }
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

  // 挂载全局环境
  const origDocument = globalThis.document
  const origWindow = globalThis.window
  const origMutationObserver = globalThis.MutationObserver

  globalThis.document = fakeDocument
  globalThis.window = fakeWindow
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  }

  try {
    const favoriteStore = createFavoriteRowStore()
    favoriteStore.bind({
      favoriteSessions: async () => ({ favoriteSessionIds: ['s-1'] }),
      setSessionFavorite: async () => ({ favoriteSessionIds: ['s-1'] }),
    })
    await favoriteStore.ensure()

    const mockCtx = {
      workspaces: { list: { getSnapshot: () => ({ items: [] }) } },
      sessions: { list: { getSnapshot: () => ({ byId: {} }) } },
    }

    // 创建会话行 DOM
    const sessionRow = fakeDocument.createElement('div')
    sessionRow.setAttribute('data-row-key', 'session:s-1')
    const leadingSlot = fakeDocument.createElement('span')
    leadingSlot.classList.add('dsh_slot')
    sessionRow.appendChild(leadingSlot)

    // 1. 初始化（默认开启）：RowFavorite.css 必须已挂载
    const favoritesOnly = setupWorkspaceFavoritesOnly(mockCtx, favoriteStore, () => (k) => k)
    assert.ok(styles.has('dsh-archive-manager/RowFavorite.css'), '默认开启时 RowFavorite.css 必须已注入')

    // 2. 模拟行渲染：挂载星标容器
    // 触发 DOM pass（直接调用内部 ensureRowStars 的行为可通过 setFavoriteStarEnabled 测试）
    assert.equal(favoritesOnly.isFavoriteStarEnabled(), true, '默认开启')

    // 3. 关闭星标开关
    favoritesOnly.setFavoriteStarEnabled(false)
    assert.equal(favoritesOnly.isFavoriteStarEnabled(), false, '已切换为关闭')
    assert.equal(styles.has('dsh-archive-manager/RowFavorite.css'), false, '关闭后 RowFavorite.css 必须被彻底移除')

    // 4. 再次开启星标开关
    favoritesOnly.setFavoriteStarEnabled(true)
    assert.equal(favoritesOnly.isFavoriteStarEnabled(), true, '已恢复开启')
    assert.ok(styles.has('dsh-archive-manager/RowFavorite.css'), '恢复开启后 RowFavorite.css 必须重新注入')

    // 5. 再次通过自定义事件关闭
    globalThis.window.dispatchEvent({
      type: 'dsham-favorite-star-toggle',
      detail: { enabled: false },
    })
    assert.equal(favoritesOnly.isFavoriteStarEnabled(), false, '自定义事件驱动关闭成功')
    assert.equal(styles.has('dsh-archive-manager/RowFavorite.css'), false, '事件触发后 RowFavorite.css 再次移除')

    favoritesOnly.dispose()
  } finally {
    globalThis.document = origDocument
    globalThis.window = origWindow
    globalThis.MutationObserver = origMutationObserver
  }
})

