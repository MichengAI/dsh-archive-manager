import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { handlePluginUpdateEscape, manualPluginUpdateCommand } from '../src/plugin-update-ui.js'
import { isNewerVersion, isTrustedUpdateRequest, PLUGIN_UPDATE_HEADER } from '../src/plugin-updater.js'

test('归档会话独立更新只接受同源专用请求', () => {
  assert.equal(isNewerVersion('0.1.30', '0.1.31'), true)
  assert.equal(isNewerVersion('0.1.30', '0.1.30'), false)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', origin: 'http://localhost:3000', host: 'localhost:3000' } }), true)
  assert.equal(isTrustedUpdateRequest({ headers: { [PLUGIN_UPDATE_HEADER]: '1', 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(manualPluginUpdateCommand('web', '@michengai/dsh-archive-manager', '0.1.31'), 'dsh plugin --profile web add @michengai/dsh-archive-manager@0.1.31 --registry=https://registry.npmjs.org/')
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

test('归档客户端与 Host 绑定自身更新入口', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const updateUi = await readFile(new URL('../src/plugin-update-ui.js', import.meta.url), 'utf8')
  const host = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(client, /packageName: "@michengai\/dsh-archive-manager"/)
  assert.match(client, /titleRowSelector: "\.dsham_settingsTitleRow"/)
  assert.match(client, /createIcon: createPluginUpdateIcon/)
  assert.match(client, /IconRefreshOutline16/)
  assert.match(client, /IconDownloadOutline16/)
  assert.match(client, /IconCopyOutline16/)
  assert.match(client, /IconCloseOutline16/)
  assert.match(updateUi, /data-mpi-label/)
  assert.match(updateUi, /overlay\.addEventListener\("keydown"/)
  assert.match(updateUi, /<header class="mpi-head"><h2><\/h2><button type="button" class="mpi-dialog-close" data-action="close"><\/button><\/header>/)
  assert.match(updateUi, /<footer class="mpi-actions"><div class="mpi-actions-group">/)
  assert.match(updateUi, /background:var\(--dsw-alias-bg-layer-2/)
  assert.match(updateUi, /box-shadow:var\(--dsw-shadow-lv3/)
  assert.match(updateUi, /border-radius:14px/)
  assert.match(host, /endpoint: "\/api\/michengai\/dsh-archive-manager\/update"/)
})
