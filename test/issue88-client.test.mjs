import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createOrganizerPanel, organizerZh, organizerEn, organizerRu } from '../src/archive-organizer-ui.ts';
const translate = (key, values = {}) => Object.entries(values).reduce((s, [k,v]) => s.replaceAll(`{${k}}`, String(v)), organizerZh[key] ?? key);

test('Issue88 cache card is conditional and uses the existing organizer style/action', () => {
  const Panel = createOrganizerPanel(React);
  const props = { t: translate, archived: true, ready: true, busy: false, undoCount: 0, count: 0 };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Panel, props)), /重建列表缓存/);
  const html = renderToStaticMarkup(React.createElement(Panel, { ...props, cacheCount: 2, onRebuildCaches() {} }));
  assert.match(html, /发现 2 个会话缺少可用列表缓存/); assert.match(html, /重建列表缓存/); assert.match(html, /dsham_organizer/);
  for (const dictionary of [organizerZh, organizerEn, organizerRu]) assert.ok(dictionary['organizer.cacheDesc']);
});

test('Issue88 controller rebuilds one at a time, retains failures and retries only failures even if refresh fails', async () => {
  const { createCacheRebuildController } = await import('../src/cache-rebuild-client.ts');
  const items = ['a','b'].map(sessionId => ({ sessionId, identity: sessionId })); let calls = [], fail = true, refreshFail = true;
  const controller = createCacheRebuildController({ diagnose: async () => ({ count: items.length, items }), rebuild: async input => {
    calls.push(input.items.map(v => v.sessionId)); const id = input.items[0].sessionId;
    return { rebuiltSessionIds: id === 'b' && fail ? [] : [id], skippedSessionIds: [], failures: id === 'b' && fail ? [{ sessionId: id, message: 'write failed' }] : [] };
  }, refresh: async () => { if (refreshFail) throw Error('refresh failed'); } });
  await controller.load(); await controller.run();
  assert.deepEqual(calls, [['a'],['b']]);
  assert.equal(controller.snapshot().result.failures.length, 1); assert.match(controller.snapshot().refreshError, /refresh failed/);
  fail = false; refreshFail = false; await controller.run(true);
  assert.deepEqual(calls, [['a'],['b'],['b']]); assert.equal(controller.snapshot().result.failures.length, 0);
  controller.dispose();
});

test('Issue88 disposed controller never starts another diagnostic request', async () => {
  const { createCacheRebuildController } = await import('../src/cache-rebuild-client.ts');
  let calls = 0;
  const controller = createCacheRebuildController({ diagnose: async () => { calls++; return { count: 0, items: [] }; }, rebuild: async () => {}, refresh: async () => {} });
  controller.dispose(); await controller.load(); assert.equal(calls, 0);
});

test('Issue88 controller ignores stale loads/unmount and stops sending subsequent rebuilds', async () => {
  const { createCacheRebuildController } = await import('../src/cache-rebuild-client.ts');
  let resolve, notify = 0, count = 0;
  const controller = createCacheRebuildController({ diagnose: async () => ({ count: 2, items: ['a','b'].map(sessionId => ({ sessionId, identity: sessionId })) }),
    rebuild: async () => { count++; await new Promise(r => resolve = r); return { rebuiltSessionIds: ['a'], skippedSessionIds: [], failures: [] }; }, refresh: async () => {} });
  controller.subscribe(() => notify++); await controller.load(); const running = controller.run(); await Promise.resolve();
  controller.dispose(); const prior = notify; resolve(); await running;
  assert.equal(count, 1); assert.equal(notify, prior);
});

test('Issue88 controller retries diagnostic load if remote service is temporarily unavailable', async () => {
  const { createCacheRebuildController } = await import('../src/cache-rebuild-client.ts');
  let attempts = 0;
  const controller = createCacheRebuildController({
    diagnose: async () => {
      attempts++;
      if (attempts < 3) throw new Error('service.unavailable');
      return { count: 1, items: [{ sessionId: 'recovered', identity: 'id' }] };
    },
    rebuild: async () => ({ rebuiltSessionIds: [], skippedSessionIds: [], failures: [] }),
    refresh: async () => {}
  }, { maxLoadRetries: 3, retryDelayMs: 20 });
  await controller.load();
  await new Promise(r => setTimeout(r, 100));
  assert.equal(controller.snapshot().diagnosis.count, 1);
  assert.equal(controller.snapshot().error, null);
  controller.dispose();
});
