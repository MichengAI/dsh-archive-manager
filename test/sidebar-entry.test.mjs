import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import test from 'node:test'
import React from 'react'
import { getEntryLocation, getSidebarEntry, setEntryLocation, setSidebarEntry } from '../src/plugin-settings.ts'
import { apply as applyPlugin } from '../src/index.ts'

test('入口位置配置（三合一）：设置方法、持久化与 HTTP API', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'dsh-archive-sidebar-test-'))
  const previousDshHome = process.env.DSH_HOME
  process.env.DSH_HOME = temporary

  try {
    // 1. 默认值与设置方法测试
    assert.equal(await getEntryLocation(), 'settings', '默认 entryLocation 为 settings')
    assert.equal(await getSidebarEntry(), false, '默认 sidebarEntry 为 false')

    // 切换到 both
    assert.equal(await setEntryLocation('both'), 'both')
    assert.equal(await getEntryLocation(), 'both')
    assert.equal(await getSidebarEntry(), true, 'both 时 sidebarEntry 为 true')

    // 切换到 sidebar
    assert.equal(await setEntryLocation('sidebar'), 'sidebar')
    assert.equal(await getEntryLocation(), 'sidebar')
    assert.equal(await getSidebarEntry(), true, 'sidebar 时 sidebarEntry 为 true')

    // 切换到 settings
    assert.equal(await setEntryLocation('settings'), 'settings')
    assert.equal(await getEntryLocation(), 'settings')
    assert.equal(await getSidebarEntry(), false, 'settings 时 sidebarEntry 为 false')

    // 兼容旧接口 setSidebarEntry
    const enabled = await setSidebarEntry(true)
    assert.equal(enabled, true, 'setSidebarEntry(true) 返回 true')
    assert.equal(await getEntryLocation(), 'both', 'setSidebarEntry(true) 映射为 both')
    assert.equal(await getSidebarEntry(), true)

    const disabled = await setSidebarEntry(false)
    assert.equal(disabled, false, 'setSidebarEntry(false) 返回 false')
    assert.equal(await getEntryLocation(), 'settings', 'setSidebarEntry(false) 映射为 settings')
    assert.equal(await getSidebarEntry(), false)

    // 非法值校验
    await assert.rejects(
      async () => setEntryLocation('none'),
      (err) => err instanceof TypeError,
      '非法 location 拒绝写入',
    )
    await assert.rejects(
      async () => setSidebarEntry('true'),
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
    assert.ok(exactRoutes.has('/api/michengai/dsh-archive-manager/sidebar-entry'), 'sidebar-entry 路由必须成功注册')

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
    const baseUrl = `http://127.0.0.1:${port}/api/michengai/dsh-archive-manager/sidebar-entry`
    const headers = { 'content-type': 'application/json', 'x-michengai-plugin-update': '1' }

    try {
      // 跨站或无守卫头被拒绝（403）
      const untrustedRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify({ enabled: true }),
      })
      assert.equal(untrustedRes.status, 403, '缺少同源守卫头时 POST 返回 403')
      // GET 初始状态（false）
      const getRes = await fetch(baseUrl)
      assert.equal(getRes.status, 200)
      const getData = await getRes.json()
      assert.equal(getData.ok, true)
      assert.equal(getData.enabled, false, 'HTTP GET 默认 enabled 为 false')
      assert.equal(getData.location, 'settings', 'HTTP GET 默认 location 为 settings')

      // POST location 更新为 both
      const postLocRes = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ location: 'both' }),
      })
      assert.equal(postLocRes.status, 200)
      const postLocData = await postLocRes.json()
      assert.equal(postLocData.ok, true)
      assert.equal(postLocData.location, 'both')
      assert.equal(postLocData.enabled, true)

      // POST 更新开启（兼容旧版 enabled 字段）
      const postRes = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: true }),
      })
      assert.equal(postRes.status, 200)
      const postData = await postRes.json()
      assert.equal(postData.ok, true)
      assert.equal(postData.enabled, true)

      // GET 验证更新已生效
      const getRes2 = await fetch(baseUrl)
      const getData2 = await getRes2.json()
      assert.equal(getData2.ok, true)
      assert.equal(getData2.enabled, true)

      // POST 非法参数校验
      const postInvalid = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabled: 'yes' }),
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
    assert.equal(await getSidebarEntry(), true, '跨重启后正确读回已保存的 sidebarEntry=true')
  } finally {
    if (previousDshHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousDshHome
    await rm(temporary, { recursive: true, force: true }).catch(() => {})
  }
})

test('客户端侧边栏入口与 bundle.config 开关槽位生命周期', async () => {
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
  assert.equal(typeof setupSidebarEntry, 'function', 'client 导出 setupSidebarEntry')

  const slotRegistrations = new Map()
  const slotInjections = new Map()
  let selectedPanel = 'archived-sessions'

  let sidebarPanellistDisposer = () => {}
  let mainDisposer = () => {}
  const mockCtx = {
    locale: {
      bind: () => (key) => key,
    },
    slots: {
      inject(name, fn) {
        slotInjections.set(name, () => {
          const res = fn()
          if (name === 'sidebar.panellist') sidebarPanellistDisposer = typeof res === 'function' ? res : () => {}
          if (name === 'main') mainDisposer = typeof res === 'function' ? res : () => {}
          return res
        })
      },
      register(meta, component) {
        slotRegistrations.set(meta.name, { meta, component })
        return () => {
          slotRegistrations.delete(meta.name)
        }
      },
    },
    inject(deps, fn) {
      if (deps.includes('layout')) {
        fn({
          layout: {
            panelInfo: { getSnapshot: () => ({ activePanelId: selectedPanel }) },
            selectPanel: (id) => { selectedPanel = id },
          },
        })
      }
    },
  }

  let clientSidebar = false
  let clientLocation = 'settings'
  let clientUpdate = true
  const controller = setupSidebarEntry(mockCtx, {
    callApi: async (path, options) => {
      if (path === '/sidebar-entry') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body)
          assert.equal(typeof body.location, 'string', '客户端 POST 必须显式携带 location 字段（拒绝旧协议回退）')
          assert.ok(['both', 'sidebar', 'settings'].includes(body.location), 'POST location 必须是合法枚举')
          clientLocation = body.location
          clientSidebar = body.location !== 'settings'
          return { ok: true, location: clientLocation, enabled: clientSidebar }
        }
        return { ok: true, location: clientLocation, enabled: clientSidebar }
      }
      if (path === '/online-update') {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body)
          clientUpdate = body.enabled
          return { enabled: clientUpdate }
        }
        return { enabled: clientUpdate, locked: false }
      }
      throw new Error('unexpected path: ' + path)
    },
    renderPanel: () => 'panel-element',
    injectProps: () => ({
      archiveSessions: () => {},
      unarchiveSession: () => {},
      deleteSession: () => {},
    }),
    ns: 'dsh-archive-manager',
  })

  // 默认关闭且尚未 inject 槽位时
  assert.equal(controller.isEnabled(), false)
  assert.equal(controller.isSupported(), false)

  // 触发 sidebar.panellist 与 main 槽位可用
  assert.ok(slotInjections.has('sidebar.panellist'), '必须监听 sidebar.panellist 槽位')
  assert.ok(slotInjections.has('main'), '必须监听 main 槽位')
  slotInjections.get('sidebar.panellist')()
  slotInjections.get('main')()
  assert.equal(controller.isSupported(), true, '支持侧边栏')
  assert.equal(slotRegistrations.has('sidebar.panellist'), false, '默认关闭时不注册侧栏图标')
  assert.equal(slotRegistrations.has('main'), false, '默认关闭时不注册主工作区面板')

  // 触发 plugins.bundle.config 槽位
  assert.ok(slotInjections.has('plugins.bundle.config'), '必须监听 plugins.bundle.config 槽位')
  slotInjections.get('plugins.bundle.config')()
  assert.ok(slotRegistrations.has('plugins.bundle.config'), '注册 plugins.bundle.config 槽位')
  assert.equal(slotRegistrations.get('plugins.bundle.config').meta.key, '@michengai/dsh-archive-manager')

  // 1. 开启侧边栏入口
  await controller.setEnabled(true)
  assert.equal(controller.isEnabled(), true)
  assert.equal(controller.getLocation(), 'both')
  assert.equal(controller.isSettingsSectionEnabled(), true)
  assert.equal(clientLocation, 'both', '服务端实际落盘为 both')
  assert.equal(clientSidebar, true, '服务端状态 enabled=true')
  assert.ok(slotRegistrations.has('main'), '开启后注册 main 槽位')
  assert.equal(slotRegistrations.get('main').meta.key, 'archived-sessions')
  
  // 验证 main 槽位 inject 注入了完整 props
  const mainMeta = slotRegistrations.get('main').meta
  assert.equal(typeof mainMeta.inject, 'function', 'main 必须包含 inject 函数')
  const injected = mainMeta.inject()
  assert.equal(typeof injected.archiveSessions, 'function', 'main 注入 archiveSessions')
  assert.equal(typeof injected.unarchiveSession, 'function', 'main 注入 unarchiveSession')
  assert.equal(typeof injected.deleteSession, 'function', 'main 注入 deleteSession')

  assert.ok(slotRegistrations.has('sidebar.panellist'), '开启后注册 sidebar.panellist 槽位')
  assert.equal(slotRegistrations.get('sidebar.panellist').meta.id, 'archived-sessions')
  assert.equal(slotRegistrations.get('sidebar.panellist').meta.order, 4)

  // 1.1 切换为仅侧边栏 (sidebar)
  await controller.setLocation('sidebar')
  assert.equal(controller.getLocation(), 'sidebar')
  assert.equal(controller.isEnabled(), true, '仅侧边栏模式下侧栏处于开启状态')
  assert.equal(controller.isSettingsSectionEnabled(), false, '仅侧边栏模式下设置菜单不显示')
  assert.equal(clientLocation, 'sidebar', '服务端实际落盘为 sidebar')
  assert.equal(clientSidebar, true, '服务端状态 enabled=true')
  assert.ok(slotRegistrations.has('sidebar.panellist'), '保留侧边栏图标')

  // 1.2 切换为仅设置 (settings)
  await controller.setLocation('settings')
  assert.equal(controller.getLocation(), 'settings')
  assert.equal(controller.isEnabled(), false, '仅设置模式下侧栏关闭')
  assert.equal(controller.isSettingsSectionEnabled(), true, '仅设置模式下设置菜单显示')
  assert.equal(clientLocation, 'settings', '服务端实际落盘为 settings')
  assert.equal(clientSidebar, false, '服务端状态 enabled=false')
  assert.equal(slotRegistrations.has('sidebar.panellist'), false, '仅设置模式下注销侧栏图标')

  // 2. 关闭侧边栏入口，验证槽位清理以及安全切回 layout.selectPanel(null)
  selectedPanel = 'archived-sessions'
  await controller.setEnabled(false)
  assert.equal(controller.isEnabled(), false)
  assert.equal(clientLocation, 'settings', '服务端实际落盘为 settings')
  assert.equal(clientSidebar, false, '服务端状态 enabled=false')
  assert.equal(slotRegistrations.has('main'), false, '关闭后注销 main 槽位')
  assert.equal(slotRegistrations.has('sidebar.panellist'), false, '关闭后注销 sidebar.panellist 槽位')
  assert.equal(selectedPanel, null, '关闭正在查看的面板时安全切回 null（杜绝悬空白屏）')

  // 3. 测试 onlineUpdate 控制
  assert.equal(controller.isOnlineUpdateEnabled(), true)
  assert.equal(controller.isOnlineUpdateLocked(), false)
  await controller.setOnlineUpdate(false)
  assert.equal(controller.isOnlineUpdateEnabled(), false)
  assert.equal(clientUpdate, false)
  await controller.setOnlineUpdate(true)
  assert.equal(controller.isOnlineUpdateEnabled(), true)
  assert.equal(clientUpdate, true)

  // 4. 测试槽位撤销与重建生命周期（针对 P2-3 防回归）
  await controller.setEnabled(true)
  assert.equal(slotRegistrations.has('sidebar.panellist'), true)
  assert.equal(slotRegistrations.has('main'), true)

  // 模拟宿主声明撤销（如插件热重载或切环境）：执行 inject 返回的 cleanup 函数
  sidebarPanellistDisposer()
  mainDisposer()
  assert.equal(slotRegistrations.has('sidebar.panellist'), false, '宿主声明撤销后图标注销')
  assert.equal(slotRegistrations.has('main'), false, '宿主声明撤销后面板注销')

  // 模拟宿主重新声明槽位：重新触发 inject
  slotInjections.get('sidebar.panellist')()
  slotInjections.get('main')()
  assert.equal(slotRegistrations.has('sidebar.panellist'), true, '宿主重新声明后图标必须自动恢复（杜绝入口永久消失）')
  assert.equal(slotRegistrations.has('main'), true, '宿主重新声明后面板必须自动恢复')

  controller.destroy()

  // 4. 测试宿主锁定场景（locked: true）
  const lockedController = setupSidebarEntry(mockCtx, {
    callApi: async (path) => {
      if (path === '/sidebar-entry') return { enabled: true }
      if (path === '/online-update') return { enabled: false, locked: true }
      return {}
    },
    renderPanel: () => null,
    ns: 'dsh-archive-manager',
  })
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(lockedController.isOnlineUpdateLocked(), true, '感知宿主锁定状态')
  await lockedController.setOnlineUpdate(true)
  assert.equal(lockedController.isOnlineUpdateEnabled(), false, '宿主锁定状态下拒绝开启在线更新')
  lockedController.destroy()
})

test('客户端 setLocation 保存失败时的乐观回退', async () => {
  let definition
  new Function('window', await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'))({
    __ModuleLoader__: { load(value) { definition = value } },
  })
  const client = definition.factory((id) => {
    if (id === 'react') return React
    if (id === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment }
    return new Proxy({}, { get: () => function Dummy() { return null } })
  })
  const { setupSidebarEntry } = client.__test

  const isolatedCtx = {
    locale: { bind: () => (key) => key },
    slots: { inject() {}, register() { return () => {} } },
  }

  const failingController = setupSidebarEntry(isolatedCtx, {
    callApi: async () => { throw new Error('Network error') },
    renderPanel: () => null,
    ns: 'dsh-archive-manager',
  })
  assert.equal(failingController.getLocation(), 'settings')
  await assert.rejects(async () => {
    await failingController.setLocation('sidebar')
  }, /Network error/, '保存失败抛出异常')
  assert.equal(failingController.getLocation(), 'settings', '网络失败后回滚原状态')
  failingController.destroy()
})
