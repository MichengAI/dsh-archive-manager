// Synthetic logs only. Real official JSONL, projection cache, domain chain and JSON backend.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { assertIsolatedHost } from '../helpers/isolated-host.mjs';
assertIsolatedHost();
const { Context, Service } = await import('@deepseek-ai/cordis');
const { SessionStore } = await import('@deepseek-ai/dsh-session');
const { DomainFacility } = await import('@deepseek-ai/dsh-storage-domain');
const { JsonStorageBackend } = await import('@deepseek-ai/dsh-storage-json');
const { SessionProjectionRegistry } = await import('@deepseek-ai/dsh-session-projection');
const { titleProjectionDefinition } = await import('@deepseek-ai/dsh-session-title');
const { SessionProjectionCache, projectionCacheDomainSpec } = await import('@deepseek-ai/dsh-session-projection-cache');
const { ArchiveWorkspaceRegistry } = await import('../../lib/workspace.js');
const hooks = process.platform === 'win32' ? registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'fs-ext') return { url: "data:text/javascript,export function flock(){throw Error('Windows must not use POSIX flock')}", shortCircuit: true };
  return next(specifier, context);
} }) : undefined;
let jsonl;
try { jsonl = await import('@deepseek-ai/dsh-session-persistence-jsonl'); } finally { hooks?.deregister(); }
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'issue88-native-'));
  const ctx = new Context();
  const backend = new JsonStorageBackend(join(root, 'storage'));
  ctx.provide('storage', { backend: { get: () => backend } });
  const domains = new DomainFacility(ctx, { backend: 'json' }); ctx.provide('storageDomain', domains);
  const sessions = new SessionStore(ctx);
  const projections = new SessionProjectionRegistry(ctx); projections.register(titleProjectionDefinition);
  const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 }); await cache[Service.init]();
  let persistence;
  const config = { root: join(root, 'logs'), compression: 'none' };
  if (typeof jsonl.apply === 'function') { await jsonl.apply(ctx, config); persistence = ctx.get('sessionPersistence'); }
  else persistence = new jsonl.default(ctx, config);
  const registry = new ArchiveWorkspaceRegistry(ctx); await registry[Service.init]();
  t.after(async () => { await domains.closeAll(); await backend.close(); await rm(root, { recursive: true, force: true }); });
  async function create(createdAt = 42, title) {
    const prepared = sessions.prepare('issue88-cold', { meta: { createdAt } });
    const writer = await persistence.create(prepared.header);
    if (title) await writer.append([{ type: 'session/title', seq: 0, time: 43, data: { title, messageSeqs: [], source: { kind: 'user' } } }]);
    await writer.flush(); await writer.close();
    await registry.setState({ ...registry.requireState(), archivedSessionIds: ['issue88-cold'] });
    return prepared.header;
  }
  return { root, ctx, backend, domains, sessions, projections, cache, persistence, registry, create };
}

test('Issue88: real cold service path persists official JSON and survives close/reopen without live sessions', async t => {
  const f = await setup(t); const header = await f.create(42, 'Issue88 synthetic title');
  assert.equal(f.sessions.get(header.id), undefined);
  const diagnosis = await f.registry.diagnoseSessionCaches(); assert.equal(diagnosis.count, 1);
  const before = JSON.stringify(f.registry.requireState());
  let listings = 0, stats = 0;
  const list = f.persistence.list.bind(f.persistence), stat = f.persistence.stat.bind(f.persistence);
  f.persistence.list = async (...args) => { listings++; return list(...args); };
  f.persistence.stat = async (...args) => { stats++; return stat(...args); };
  assert.equal((await f.persistence.stat(header.id)).header.createdAt, header.createdAt);
  assert.equal(await f.persistence.stat('missing-target'), undefined);
  stats = 0;
  const result = await f.registry.rebuildSessionCaches({ items: diagnosis.items });
  assert.equal(listings, 0, '真实宿主重建不得全库枚举');
  assert.equal(stats, 2, '真实宿主必须在读前后定向确认生命周期');
  assert.deepEqual(result, { rebuiltSessionIds: [header.id], skippedSessionIds: [], failures: [] });
  assert.equal(f.cache.cachedSnapshot(header).values.title, 'Issue88 synthetic title');
  assert.equal(JSON.stringify(f.registry.requireState()), before);
  assert.equal(f.sessions.get(header.id), undefined);
  await access(join(f.root, 'storage', 'session_projcache', 'sessions', header.id + '.json'));
  await f.domains.get(projectionCacheDomainSpec.name).close();
  const reopened = await f.domains.open(projectionCacheDomainSpec);
  assert.equal(reopened.table('sessions').get(header.id).rows.title.val, 'Issue88 synthetic title');
});

for (const point of ['before-read', 'during-read', 'during-save', 'after-timeout']) {
  test(`Issue88: real deletion ${point} cannot resurrect cache; same-ID new lifecycle remains repairable`, async t => {
    const f = await setup(t); const header = await f.create();
    const diagnosis = await f.registry.diagnoseSessionCaches();
    const entered = deferred(), release = deferred();
    let repairing, deleting;
    if (point === 'before-read') {
      await f.registry.deleteSession(header.id);
      repairing = f.registry.rebuildSessionCaches({ items: diagnosis.items });
    } else if (point === 'during-read') {
      const open = f.persistence.open.bind(f.persistence);
      f.persistence.open = async (...args) => { const reader = await open(...args); const read = reader.read.bind(reader); reader.read = async (...values) => { entered.resolve(); await release.promise; return read(...values); }; return reader; };
      repairing = f.registry.rebuildSessionCaches({ items: diagnosis.items });
      await entered.promise; deleting = f.registry.deleteSession(header.id); release.resolve();
    } else {
      // Gate the real backend operation, NOT KvTable: the official DomainImpl must serialize deletion behind it.
      const domain = f.domains.get(projectionCacheDomainSpec.name);
      const unit = domain.unit;
      const putRecord = unit.putRecord.bind(unit);
      unit.putRecord = async (...args) => { entered.resolve(); await release.promise; return putRecord(...args); };
      repairing = f.registry.rebuildSessionCaches({ items: diagnosis.items });
      await entered.promise;
      if (point === 'after-timeout') {
        const result = await repairing; assert.equal(result.failures.length, 1); assert.equal(result.rebuiltSessionIds.length, 0);
      }
      let deleted = false; deleting = f.registry.deleteSession(header.id).then(value => { deleted = true; return value; });
      await new Promise(r => setTimeout(r, 5)); assert.equal(deleted, false);
      release.resolve();
    }
    await repairing; await deleting;
    assert.equal(f.cache.requireTable().get(header.id), undefined);
    assert.equal((await f.persistence.list()).some(row => row.header.id === header.id), false);
    const fresh = await f.create(99);
    const stale = await f.registry.rebuildSessionCaches({ items: diagnosis.items });
    assert.deepEqual(stale.skippedSessionIds, [header.id]);
    const next = await f.registry.diagnoseSessionCaches(); assert.equal(next.count, 1);
    assert.equal((await f.registry.rebuildSessionCaches({ items: next.items })).rebuiltSessionIds.length, 1);
    assert.equal(f.cache.cachedSnapshot(fresh).values.title, null);
    assert.equal(f.cache.cachedSnapshot(header), undefined, 'old lifecycle never accepted');
  });
}

test('Issue88: activity appearing during real read closes reader, never writes or activates sessions', async t => {
  const f = await setup(t); const header = await f.create();
  const diagnosis = await f.registry.diagnoseSessionCaches();
  let active = false, closed = false;
  f.ctx.on('workspace/session-activity', async (_input, next) => active ? [{ kind: 'synthetic-running' }] : next());
  const open = f.persistence.open.bind(f.persistence);
  f.persistence.open = async (...args) => { const reader = await open(...args); const read = reader.read.bind(reader), close = reader.close.bind(reader);
    reader.read = async (...values) => { const result = await read(...values); active = true; return result; };
    reader.close = async () => { await close(); closed = true; }; return reader; };
  const result = await f.registry.rebuildSessionCaches({ items: diagnosis.items });
  assert.deepEqual(result.skippedSessionIds, [header.id]); assert.equal(closed, true);
  assert.equal(f.cache.cachedSnapshot(header), undefined); assert.equal(f.sessions.get(header.id), undefined);
});
