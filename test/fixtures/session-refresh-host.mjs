// 只用合成 RPC 失败，执行对应已发布宿主的真实刷新与列表投影方法。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { assertIsolatedHost } from '../helpers/isolated-host.mjs';
import { createCacheRebuildController } from '../../lib/cache-rebuild-client.js';
import { errorMessage } from '../../lib/contracts.js';
assertIsolatedHost();

test('真实宿主正常 resolve 的列表业务失败必须保留重建成功并显示刷新错误', async (t) => {
  const require = createRequire(import.meta.url);
  let SessionManager;
  try {
    const entry = require.resolve('@deepseek-ai/dsh-api-session-controller');
    const managerPath = join(dirname(entry), 'types/client/sessions/manager.js');
    const mod = await import(pathToFileURL(managerPath).href);
    SessionManager = mod.SessionManager;
  } catch {
    // 早期宿主内部私有子路径跨包导出可能未对齐，在不支持独立引入该私有模块的宿主上跳过
  }
  if (typeof SessionManager !== 'function') {
    t.skip('当前测试宿主不支持独立载入内部 SessionManager 模块');
    return;
  }
  const manager = new SessionManager({ session: { list: async () => ({ ok: false, error: { message: 'synthetic list failure' } }) } });
  const ctx = { sessions: { manager, refresh: () => manager.refreshList(), list: { getSnapshot: () => manager.buildListSnapshot() } } };
  const source = await readFile(new URL('../../src/client.ts', import.meta.url), 'utf8');
  const from = source.indexOf('const refreshCacheLists = async () =>');
  const to = source.indexOf('const cleanOrphanSubagents', from);
  assert.ok(from >= 0 && to > from);
  const code = ts.transpileModule(source.slice(from, to), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const refresh = new Function('ctx', 'errorMessage', code + ';return refreshCacheLists;')(ctx, errorMessage);
  let pending = true;
  const controller = createCacheRebuildController({
    diagnose: async () => ({ count: pending ? 1 : 0, items: pending ? [{ sessionId: 'a', identity: 'a' }] : [] }),
    rebuild: async () => { pending = false; return { rebuiltSessionIds: ['a'], skippedSessionIds: [], failures: [] }; },
    refresh,
  });
  await controller.load(); await controller.run();
  assert.equal(ctx.sessions.list.getSnapshot().state, 'error');
  const state = controller.snapshot();
  assert.equal(state.refreshError, 'synthetic list failure');
  assert.equal(state.error, null);
  assert.deepEqual(state.result, { rebuiltSessionIds: ['a'], skippedSessionIds: [], failures: [] });
  assert.equal(state.diagnosis.count, 0);
  controller.dispose();
});
