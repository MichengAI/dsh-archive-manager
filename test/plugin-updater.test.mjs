import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolve } from 'node:path'
import test from 'node:test'
import { describePluginUpdate, handlePluginUpdateEscape, manualPluginUpdateCommand } from '../src/plugin-update-model.ts'
import { isDshCliEntry, isNewerVersion, isTrustedUpdateRequest, mergeMinimumReleaseAgeExclude, recordReleaseAgeExclude, PLUGIN_UPDATE_HEADER, registerPluginUpdater, resolveUpdateRuntime, shouldNotifyParent } from '../src/plugin-updater.ts'

test('归档会话独立更新只接受同源专用请求', () => {
  assert.equal(isNewerVersion('0.1.30', '0.1.31'), true)
  assert.equal(isNewerVersion('0.1.30', '0.1.30'), false)
  assert.equal(isNewerVersion('0.1.0-rc.2', '0.1.0-rc.10'), true)
  assert.equal(isNewerVersion('0.1.0-rc.10', '0.1.0-rc.2'), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' }, socket: { remoteAddress: '::ffff:127.0.0.1' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', host: '127.0.0.1:19387' }, socket: { remoteAddress: '127.0.0.1' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', host: 'example.com' }, socket: { remoteAddress: '127.0.0.1' } }), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' }, socket: { remoteAddress: '10.0.0.9' } }), false)
  assert.equal(manualPluginUpdateCommand('web', '@michengai/dsh-archive-manager', '0.1.31'), 'dsh plugin --profile web add @michengai/dsh-archive-manager@0.1.31 --registry=https://registry.npmjs.org/')
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), true)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: '@deepseek-ai/dsh', bin: { dsh: 'lib/other.js' } }, 'C:/tools/dsh'), false)
  assert.equal(isDshCliEntry('C:/tools/dsh/lib/bin.js', { name: 'other-cli', bin: { dsh: 'lib/bin.js' } }, 'C:/tools/dsh'), false)
})

test('再次启用会替换残留的更新路由，而不是因为重复路由失败', () => {
  const exact = new Map()
  const webServer = {
    exact,
    register(route) {
      if (exact.has(route.path)) throw new Error(`webserver: duplicate exact route "${route.path}"`)
      exact.set(route.path, route)
      return () => { exact.delete(route.path) }
    },
  }
  const ctx = { webServer, logger: { warn() {} } }
  const options = { endpoint: '/api/michengai/dsh-archive-manager/update', packageName: '@michengai/dsh-archive-manager', manifestUrl: new URL('../package.json', import.meta.url) }
  exact.set(options.endpoint, { leaked: true })
  const dispose = registerPluginUpdater(ctx, options)
  assert.equal(exact.get(options.endpoint).leaked, undefined)
  dispose()
  assert.equal(exact.has(options.endpoint), false)
  const again = registerPluginUpdater(ctx, options)
  assert.equal(exact.has(options.endpoint), true)
  again()
  const hidden = new Map([[options.endpoint, { leaked: true }]])
  const proxied = {
    [Symbol.for('cordis.original')]: { exact: hidden, register(route) { if (hidden.has(route.path)) throw new Error('duplicate'); hidden.set(route.path, route); return () => hidden.delete(route.path) } },
    register(route) { return this[Symbol.for('cordis.original')].register(route) },
  }
  const recovered = registerPluginUpdater({ webServer: proxied, logger: { warn() {} } }, options)
  assert.equal(hidden.get(options.endpoint).leaked, undefined)
  recovered()
})

test('迟到的旧卸载函数不会删掉新装的更新路由', () => {
  const exact = new Map()
  const webServer = {
    exact,
    register(route) {
      if (exact.has(route.path)) throw new Error(`webserver: duplicate exact route "${route.path}"`)
      exact.set(route.path, route)
      return () => { exact.delete(route.path) }
    },
  }
  const ctx = { webServer, logger: { warn() {} } }
  const options = { endpoint: '/api/michengai/dsh-archive-manager/update', packageName: '@michengai/dsh-archive-manager', manifestUrl: new URL('../package.json', import.meta.url) }
  const first = registerPluginUpdater(ctx, options)
  const second = registerPluginUpdater(ctx, options)
  assert.equal(exact.has(options.endpoint), true)
  first()
  assert.equal(exact.has(options.endpoint), true, '旧 fiber 的卸载不得删掉新路由')
  second()
  assert.equal(exact.has(options.endpoint), false)
})

test('归档更新弹窗消费 ESC，避免继续关闭底层设置页', () => {
  const calls = []
  assert.equal(handlePluginUpdateEscape({
    key: 'Escape',
    preventDefault: () => calls.push('prevent'),
    stopPropagation: () => calls.push('stop'),
    stopImmediatePropagation: () => calls.push('stopImmediate'),
  }, () => calls.push('close')), true)
  assert.deepEqual(calls, ['prevent', 'stop', 'stopImmediate', 'close'])
})

test('归档客户端已移除设置页更新入口且 Host 维持更新能力', async () => {
  const client = await readFile(new URL('../src/client.ts', import.meta.url), 'utf8')
  const updateUi = await readFile(new URL('../src/plugin-update-ui.ts', import.meta.url), 'utf8')
  const host = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /createIcon: createPluginUpdateIcon/)
  assert.doesNotMatch(client, /UPDATE_ICON_PATHS/)
  assert.doesNotMatch(client, /react-dom\/client/)
  assert.match(updateUi, /data-mpi-label/)
  assert.match(updateUi, /document\.addEventListener\("keydown"/)
  assert.match(updateUi, /variant: "outline", size: "sm"/)
  assert.doesNotMatch(updateUi, /width:\s*680/)
  assert.match(updateUi, /if \(version\.textContent !== versionLabel\)/)
  assert.match(updateUi, /color: \"#e8b15a\"/)
  assert.match(await readFile(new URL('../src/plugin-update-model.ts', import.meta.url), 'utf8'), /else if \(payload\.latestCheckFailed\)/)
  assert.match(host, /endpoint: "\/api\/michengai\/dsh-archive-manager\/update"/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /const notifyParent = shouldNotifyParent\(target\)/)
  assert.match(await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8'), /isDshCliEntry/)
})

test('官方 Desktop 在线更新指向 desktop profile，且不通知父进程', () => {
  const profileDir = resolve('/dsh-profile/desktop')
  const runtime = resolveUpdateRuntime({
    get(name) {
      if (name === 'profileContext') return {
        name: 'desktop',
        dir: profileDir,
        packageManager: {
          command: resolve('/dsh-tools/DeepSeek Harness.exe'),
          args: ['--expose-internals', resolve('/dsh-runtime/pnpm.mjs')],
          env: { ELECTRON_RUN_AS_NODE: '1' },
        },
      }
      return undefined
    },
  }, {
    argv: ['node', resolve('/dsh-app/node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js'), resolve('/dsh-runtime'), profileDir],
    env: {},
    cwd: profileDir,
    homeDir: resolve('/dsh-home'),
  })
  assert.equal(runtime.profileName, 'desktop')
  assert.equal(runtime.profileDir, profileDir)
  assert.equal(runtime.officialDesktop, true)
  assert.equal(runtime.canAutoUpdate, true)
  assert.equal(runtime.cliEntry, undefined)
  assert.equal(shouldNotifyParent(runtime, () => {}), false)
})

test('官方 Desktop 没有 profileContext 时仍用宿主参数定位 desktop，不回退 web', () => {
  const profileDir = resolve('/dsh-profile/desktop')
  const pnpm = resolve('/dsh-runtime/pnpm.mjs')
  const exe = resolve('/dsh-tools/DeepSeek Harness.exe')
  const runtime = resolveUpdateRuntime({ get() { return undefined } }, {
    argv: ['node', resolve('/dsh-app/node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js'), resolve('/dsh-runtime'), profileDir, resolve('/dsh-runtime/primary'), pnpm, resolve('/dsh-runtime/bin')],
    env: {},
    cwd: resolve('/dsh-elsewhere'),
    homeDir: resolve('/dsh-home'),
    exists: (path) => path === pnpm,
    execPath: exe,
  })
  assert.equal(runtime.profileName, 'desktop')
  assert.equal(runtime.profileDir, profileDir)
  assert.equal(runtime.canAutoUpdate, true)
  assert.equal(runtime.packageManager?.command, exe)
  assert.equal(shouldNotifyParent(runtime, () => {}), false)
})

test('普通 Web 没有 CLI 时仍回退 web，不把官方 Desktop 逻辑套上去', () => {
  const runtime = resolveUpdateRuntime({ get() { return undefined } }, {
    argv: ['node', 'D:\\tools\\dsh\\lib\\bin.js', 'web'],
    env: {},
    cwd: 'D:\\work',
    homeDir: 'C:\\Users\\YUJIYU',
    exists: () => false,
  })
  assert.equal(runtime.profileName, 'web')
  assert.equal(runtime.officialDesktop, false)
  assert.equal(runtime.canAutoUpdate, false)
})

test('发现新版本时提示使用提醒色，已是最新仍用成功色', () => {
  const found = describePluginUpdate('zh', {
    packageName: '@michengai/dsh-archive-manager',
    currentVersion: '1.0.12',
    latestVersion: '1.0.13',
    updateAvailable: true,
    profileName: 'desktop',
    canAutoUpdate: true,
    latestCheckFailed: false,
  }, 'idle', { type: 'status' })
  assert.equal(found.kind, 'update')
  assert.match(found.message, /发现新版本/)
  const latest = describePluginUpdate('zh', {
    packageName: '@michengai/dsh-archive-manager',
    currentVersion: '1.0.13',
    latestVersion: '1.0.13',
    updateAvailable: false,
    profileName: 'web',
    canAutoUpdate: true,
    latestCheckFailed: false,
  }, 'idle', { type: 'status' })
  assert.equal(latest.kind, 'success')
})

test('自更新把刚安装的版本并进已有发布年龄白名单，不另起一行', () => {
  const created = mergeMinimumReleaseAgeExclude('packages:\n  - .\n', '@michengai/dsh-archive-manager@1.1.0')
  assert.match(created, /minimumReleaseAgeExclude:\n  - '@michengai\/dsh-archive-manager@1\.1\.0'\n/)
  assert.doesNotMatch(created, /minimumReleaseAgeExclude:\n  - '@michengai\/dsh-archive-manager'\n/)
  const merged = mergeMinimumReleaseAgeExclude(
    "minimumReleaseAgeExclude:\n  - '@michengai/dsh-archive-manager@1.0.19 || 1.0.20'\n  - keep@1.0.0\n",
    '@michengai/dsh-archive-manager@1.1.0',
  )
  assert.match(merged, /'@michengai\/dsh-archive-manager@1\.0\.19 \|\| 1\.0\.20 \|\| 1\.1\.0'/)
  assert.match(merged, /keep@1\.0\.0/)
  assert.equal(merged.split('@michengai/dsh-archive-manager').length - 1, 1)
})

test('同名白名单多行先并进第一条，读不懂的块则停止更新', () => {
  const merged = mergeMinimumReleaseAgeExclude(
    "minimumReleaseAgeExclude:\n  - '@michengai/dsh-archive-manager@1.0.19'\n  - keep@1.0.0\n  - '@michengai/dsh-archive-manager@1.0.20'\n",
    '@michengai/dsh-archive-manager@1.1.0',
  )
  assert.match(merged, /'@michengai\/dsh-archive-manager@1\.0\.19 \|\| 1\.0\.20 \|\| 1\.1\.0'/)
  assert.equal(merged.split('@michengai/dsh-archive-manager').length - 1, 1)
  assert.throws(() => mergeMinimumReleaseAgeExclude('minimumReleaseAgeExclude: [keep@1.0.0]\n', '@michengai/dsh-archive-manager@1.1.0'), /无法安全合并/)
})

test('合并白名单保留行内注释、CRLF 和文件结尾换行', () => {
  const merged = mergeMinimumReleaseAgeExclude(
    "minimumReleaseAgeExclude:\r\n  - '@michengai/dsh-archive-manager@1.0.20' # 保留\r\n  - keep@1.0.0\r\n",
    '@michengai/dsh-archive-manager@1.1.0',
  )
  assert.match(merged, /'@michengai\/dsh-archive-manager@1\.0\.20 \|\| 1\.1\.0' # 保留/)
  assert.ok(merged.includes('\r\n'))
  assert.equal(merged.at(-1), '\n')
})

test('安装成功后才写入白名单，安装前先检查能否合并', async () => {
  const source = await readFile(new URL('../src/plugin-updater.ts', import.meta.url), 'utf8')
  const install = source.slice(source.indexOf('async function install'), source.indexOf('function json'))
  assert.match(install, /await guardReleaseAgeExclude[\s\S]*runPlugin[\s\S]*await recordReleaseAgeExclude/)
  assert.match(install, /await runCliInstall[\s\S]*await recordReleaseAgeExclude/)
})

test('白名单先写临时文件再替换，不留下临时文件', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-archive-age-'))
  try {
    await writeFile(join(dir, 'pnpm-workspace.yaml'), "packages:\n  - .\nminimumReleaseAgeExclude:\n  - '@michengai/dsh-archive-manager@1.0.20' # 保留\n", 'utf8')
    await recordReleaseAgeExclude(dir, '@michengai/dsh-archive-manager@1.1.0')
    const text = await readFile(join(dir, 'pnpm-workspace.yaml'), 'utf8')
    assert.match(text, /1\.0\.20 \|\| 1\.1\.0' # 保留/)
    assert.deepEqual(await readdir(dir), ['pnpm-workspace.yaml'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
