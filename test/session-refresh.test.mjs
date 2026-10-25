import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { errorMessage } from '../src/contracts.ts';
import { createCacheRebuildController } from '../src/cache-rebuild-client.ts';

async function refreshers(ctx, artifact = 'src/client.ts') {
  const source = await readFile(new URL('../' + artifact, import.meta.url), 'utf8');
  if (artifact === 'lib/client.js') {
    const tree = ts.createSourceFile(artifact, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    let arrow;
    const visit = node => {
      if (ts.isCallExpression(node) && node.arguments.length === 2 && ts.isStringLiteral(node.arguments[1]) && node.arguments[1].text === 'refreshCacheLists') arrow = node.arguments[0];
      ts.forEachChild(node, visit);
    };
    visit(tree); assert.ok(arrow, '打包产物必须保留刷新函数');
    const code = arrow.getText(tree);
    const contextName = code.match(/([\w$]+)\.sessions\.refresh/)[1];
    const helperName = code.match(/new Error\(([\w$]+)\([\w$]+\.error\)\)/)?.[1] ?? 'errorMessage';
    return { refreshCacheLists: new Function(contextName, helperName, 'return ' + code)(ctx, errorMessage) };
  }
  const take = (start, end) => {
    const from = source.indexOf(start), to = source.indexOf(end, from);
    assert.ok(from >= 0 && to > from, '生产刷新闭包提取标记必须存在');
    return source.slice(from, to);
  };
  const code = take('const refreshCacheLists = async () =>', 'const cleanOrphanSubagents') +
    take('const refreshSessionList = async () =>', 'const unarchiveOne');
  const output = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function('ctx', 'errorMessage', output + ';return { refreshCacheLists, refreshSessionList };')(ctx, errorMessage);
}

for (const artifact of ['src/client.ts', 'lib/client.js']) {
  test(`${artifact}: resolved host list failure stays a refresh error, not a save failure`, async () => {
    const ctx = { sessions: { list: { getSnapshot: () => ({ state: 'error', error: { message: 'synthetic list failure' } }) }, async refresh() { assert.equal(this, ctx.sessions); } } };
    const api = await refreshers(ctx, artifact);
    let pending = true;
    const controller = createCacheRebuildController({
      diagnose: async () => ({ count: pending ? 1 : 0, items: pending ? [{ sessionId: 'a', identity: 'a' }] : [] }),
      rebuild: async () => { pending = false; return { rebuiltSessionIds: ['a'], skippedSessionIds: [], failures: [] }; },
      refresh: api.refreshCacheLists,
    });
    await controller.load(); await controller.run();
    const state = controller.snapshot();
    assert.equal(state.refreshError, 'synthetic list failure');
    assert.equal(state.error, null);
    assert.deepEqual(state.result, { rebuiltSessionIds: ['a'], skippedSessionIds: [], failures: [] });
    assert.equal(state.diagnosis.count, 0);
    assert.equal(state.busy, false);
    if (artifact === 'src/client.ts') assert.equal(await api.refreshSessionList(), 'synthetic list failure');
    controller.dispose();
  });
}

test('refresh checks final state and ignores old errors after successful retry', async () => {
  let state = { state: 'error', error: { message: 'old failure' } };
  const ctx = { sessions: { list: { getSnapshot: () => state }, async refresh() { state = { state: 'idle', error: null }; } } };
  const api = await refreshers(ctx);
  assert.equal(await api.refreshCacheLists(), undefined);
  assert.equal(await api.refreshSessionList(), null);
  ctx.sessions.refresh = async () => { throw new Error('transport rejected'); };
  await assert.rejects(api.refreshCacheLists(), /transport rejected/);
  assert.equal(await api.refreshSessionList(), 'transport rejected');
});
