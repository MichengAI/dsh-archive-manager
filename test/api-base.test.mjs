// dsh-archive-manager API 基址解析测试（零第三方依赖）
// 背景：页面可能挂在带路径前缀的反向代理下（如 https://host/app/dsh/）。
// 根绝对路径 "/api/..." 会被浏览器解析到站点根、丢掉代理前缀，网关返回 HTML 404，
// 面板因此报「服务端返回非 JSON 响应」。本测试锁定 resolveApiUrl 的解析约定。
// 运行：node --import tsx --test test/api-base.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveApiUrl } from '../src/api-base.ts'

/** 在指定页面基址下解析一次，用完恢复，避免污染其它断言。 */
function withBase(baseURI, run) {
  const previous = Object.prototype.hasOwnProperty.call(globalThis, 'document') ? globalThis.document : undefined
  globalThis.document = baseURI === undefined ? undefined : { baseURI }
  try {
    return run()
  } finally {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
  }
}

test('直连部署保持根路径原始绝对 URL', () => {
  withBase('http://127.0.0.1:28000/', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      'http://127.0.0.1:28000/api/michengai/dsh-archive-manager/sidebar-entry',
      'root deployment keeps the original absolute URL',
    )
  })
})

test('带前缀的反向代理保留完整路径前缀', () => {
  withBase('https://nas.example.com/app/dsh/', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      'https://nas.example.com/app/dsh/api/michengai/dsh-archive-manager/sidebar-entry',
      'prefix proxy keeps the path prefix',
    )
  })
})

test('页面地址不带结尾斜杠时也能保留完整前缀', () => {
  withBase('https://nas.example.com/app/dsh', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      'https://nas.example.com/app/dsh/api/michengai/dsh-archive-manager/sidebar-entry',
      'prefix without trailing slash keeps the full prefix',
    )
  })
})

test('页面地址以 index.html 结尾时截断保留目录前缀', () => {
  withBase('https://nas.example.com/app/dsh/index.html', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      'https://nas.example.com/app/dsh/api/michengai/dsh-archive-manager/sidebar-entry',
      'baseURI with index.html strips filename and keeps directory prefix',
    )
  })
})

test('页面地址目录名包含点且无尾斜杠时完整保留目录前缀', () => {
  withBase('https://host/dsh-0.2.1', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      'https://host/dsh-0.2.1/api/michengai/dsh-archive-manager/sidebar-entry',
      'directory name containing dots is not mistaken for a file',
    )
  })
})

test('非根绝对路径原样返回', () => {
  withBase('https://nas.example.com/app/dsh/', () => {
    assert.equal(resolveApiUrl('update'), 'update', 'relative path is untouched')
    assert.equal(
      resolveApiUrl('https://registry.npmjs.org/x'),
      'https://registry.npmjs.org/x',
      'absolute URL is untouched',
    )
    assert.equal(resolveApiUrl('//cdn.example.com/x'), '//cdn.example.com/x', 'protocol-relative URL is untouched')
  })
})

test('无 document 或非法 base 时安全回退', () => {
  withBase(undefined, () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      '/api/michengai/dsh-archive-manager/sidebar-entry',
      'no document falls back to the literal path',
    )
  })
  withBase('not a url', () => {
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-archive-manager/sidebar-entry'),
      '/api/michengai/dsh-archive-manager/sidebar-entry',
      'invalid base falls back to the literal path',
    )
  })
})

test('源码出口级防回归断言', async () => {
  const { readFile } = await import('node:fs/promises')
  const clientSource = await readFile(new URL('../src/client.ts', import.meta.url), 'utf8')
  assert.ok(clientSource.includes('resolveApiUrl('), 'client.ts 统一通过 resolveApiUrl 解析端点')
})
