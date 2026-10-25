import test from 'node:test';
import assert from 'node:assert/strict';
import { ArchiveWorkspaceRegistry } from '../src/workspace.ts';

const header = (id, extra = {}) => ({ id, version: 4, createdAt: 42, isSeeded: false, ...extra });
function fixture() {
  const rows = [header('archived'), header('workspace'), header('stray'), header('child', { origin: 'subagent', parentSession: 'archived' }), header('live')];
  let tail = Promise.resolve();
  const writes = [], reads = [], snapshots = new Map();
  const state = { workspaceIds: ['w'], archivedSessionIds: ['archived', 'child', 'live'] };
  const ctx = { get: name => name === 'sessions' ? { get: id => id === 'live' ? {} : undefined } : cache,
    sessionPersistence: { stat: async id => { const found = rows.find(h => h.id === id); return found ? { header: found } : undefined; }, open: async (id, mode) => { reads.push([id, mode]); return { header: rows.find(h => h.id === id), inheritedEventCount: 0, read: async () => ({ events: [] }), close: async () => reads.push('closed') }; } },
    waterfall: async (_event, _input, next) => next(), logger: { warn() {} } };
  const cache = { cachedSnapshot: meta => snapshots.get(meta.id), coldSnapshot: meta => { writes.push(meta.id); const value = { asOfSeq: -1, values: { title: null } }; snapshots.set(meta.id, value); return value; } };
  const registry = Object.create(ArchiveWorkspaceRegistry.prototype);
  Object.assign(registry, { ctx, requireState: () => state, requireTable: () => ({ get: () => ({ sessionIds: ['workspace'] }) }),
    listStoredHeaders: async () => [...rows], enqueueOperation: operation => { const result = tail.then(operation); tail = result.catch(() => {}); return result; } });
  return { registry, rows, reads, writes, cache, state, ctx };
}

test('Issue88 diagnosis uses only headers/cache and restricts scope, live sessions and subagents', async () => {
  const f = fixture();
  const value = await f.registry.diagnoseSessionCaches();
  assert.deepEqual(value.items.map(v => v.sessionId), ['archived', 'workspace']);
  assert.equal(value.count, 2);
  assert.deepEqual(f.reads, []); assert.deepEqual(f.writes, []);
  const result = await f.registry.rebuildSessionCaches({ items: value.items });
  assert.deepEqual(result.rebuiltSessionIds, ['archived', 'workspace']);
  assert.equal(f.reads.filter(v => v === 'closed').length, 2);
  assert.deepEqual(f.reads.filter(Array.isArray), [['archived', 'read'], ['workspace', 'read']]);
  assert.deepEqual(f.state.archivedSessionIds, ['archived', 'child', 'live']);
  assert.equal((await f.registry.diagnoseSessionCaches()).count, 0);
});

test('Issue88 rebuilding queries authoritative targets without full-library listing', async () => {
  const f = fixture();
  const diagnosis = await f.registry.diagnoseSessionCaches();
  let listings = 0, stats = 0;
  const list = f.registry.listStoredHeaders, stat = f.ctx.sessionPersistence.stat;
  f.registry.listStoredHeaders = async () => { listings++; return list(); };
  f.ctx.sessionPersistence.stat = async id => { stats++; return stat(id); };
  const result = await f.registry.rebuildSessionCaches({ items: diagnosis.items });
  assert.deepEqual(result.rebuiltSessionIds, ['archived', 'workspace']);
  assert.equal(listings, 0, 'rebuilding must not scan all stored headers');
  assert.equal(stats, 4, 'check each target before and after reading');
});

test('Issue88 partial cache without compatible title is a repair candidate', async () => {
  const f = fixture();
  f.cache.cachedSnapshot = () => ({ asOfSeq: -1, values: { unrelated: true } });
  assert.equal((await f.registry.diagnoseSessionCaches()).count, 2);
});

test('Issue88 stale diagnostic token cannot rebuild deleted/recreated ID', async () => {
  const f = fixture(); const value = await f.registry.diagnoseSessionCaches();
  f.rows[0] = header('archived', { createdAt: 99 });
  const result = await f.registry.rebuildSessionCaches({ items: [value.items[0]] });
  assert.deepEqual(result.skippedSessionIds, ['archived']); assert.deepEqual(f.reads, []);
});

test('Issue88 activity appearing during read skips cold write and closes handle', async () => {
  const f = fixture(); const value = await f.registry.diagnoseSessionCaches();
  const open = f.ctx.sessionPersistence.open;
  f.ctx.sessionPersistence.open = async (...args) => { const handle = await open(...args); handle.read = async () => { f.ctx.waterfall = async () => [{ kind: 'running' }]; return { events: [] }; }; return handle; };
  const result = await f.registry.rebuildSessionCaches({ items: [value.items[0]] });
  assert.deepEqual(result.skippedSessionIds, ['archived']); assert.deepEqual(f.writes, []); assert.ok(f.reads.includes('closed'));
});

for (const change of ['deleted', 'recreated', 'source-mismatch', 'stat-failure']) {
  test(`Issue88 target ${change} during read cannot write from a stale index`, async () => {
    const f = fixture(); const value = await f.registry.diagnoseSessionCaches();
    const oldHeader = { ...f.rows[0] };
    f.registry.headers = new Map([['archived', oldHeader]]);
    const open = f.ctx.sessionPersistence.open;
    f.ctx.sessionPersistence.open = async (...args) => {
      const handle = await open(...args);
      if (change === 'source-mismatch') handle.header = header('archived', { createdAt: 99 });
      handle.read = async () => {
        if (change === 'deleted') f.rows.splice(0, 1);
        if (change === 'recreated') f.rows[0] = header('archived', { createdAt: 99 });
        if (change === 'stat-failure') f.ctx.sessionPersistence.stat = async () => { throw new Error('target stat failed'); };
        return { events: [] };
      };
      return handle;
    };
    const result = await f.registry.rebuildSessionCaches({ items: [value.items[0]] });
    if (change === 'stat-failure') assert.match(result.failures[0].message, /target stat failed/);
    else assert.deepEqual(result.skippedSessionIds, ['archived']);
    assert.deepEqual(f.writes, []); assert.ok(f.reads.includes('closed'));
  });
}

test('Issue88 malformed and oversized batches are rejected before reading', async () => {
  const f = fixture();
  for (const input of [{}, { items: 'x' }, { items: Array(21).fill({ sessionId: 'x', identity: 'x' }) }, { items: [{ sessionId: '', identity: 'x' }] }]) {
    await assert.rejects(f.registry.rebuildSessionCaches(input), /invalid cache rebuild/);
  }
  assert.deepEqual(f.reads, []);
});
