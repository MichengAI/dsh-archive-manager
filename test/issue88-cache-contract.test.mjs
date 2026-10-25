// Issue #88: synthetic data only; exercise the real host cache, not user logs.
import test from "node:test";
import assert from "node:assert/strict";
import { Context, Service } from "@deepseek-ai/cordis";
import { SessionProjectionRegistry } from "@deepseek-ai/dsh-session-projection";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { SESSION_FORMAT_VERSION } from "@deepseek-ai/dsh-session";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function fixture() {
  const ctx = new Context();
  const records = new Map();
  const pending = [];
  const table = {
    get: id => records.get(id),
    put(id, record) {
      const gate = deferred();
      const completion = gate.promise.then(() => { records.set(id, record); });
      pending.push({ ...gate, completion });
      return completion;
    },
    async delete(id) { return records.delete(id); },
  };
  ctx.provide("storageDomain", { open: async () => ({ table: () => table, close: async () => {} }) });
  ctx.provide("sessions", { get: () => undefined });
  const projections = new SessionProjectionRegistry(ctx);
  const schema = { parse: data => data, safeParse: data => ({ success: true, data }) };
  projections.register({
    key: "issue88", stateSchema: schema, stateVersion: 1,
    init: () => "synthetic", apply: state => state,
    wire: { viewSchema: schema, view: state => state },
  });
  const cache = new SessionProjectionCache(ctx, { writeEveryEvents: 200, writeIntervalMs: 5000 });
  await cache[Service.init]();
  const header = { id: "issue88-synthetic", version: SESSION_FORMAT_VERSION, createdAt: 42, isSeeded: false };
  return { cache, header, records, pending };
}

test("只有官方 durable 读回可见后才确认冷缓存保存成功", async () => {
  const { confirmColdCacheWrite } = await import("../src/cache-rebuild.ts");
  const { cache, header, pending } = await fixture();
  const polled = deferred();
  const resume = deferred();
  let completed = false;
  const writing = confirmColdCacheWrite(cache, { meta: header, inheritedEventCount: 0, events: [] }, {
    wait: async () => { polled.resolve(); await resume.promise; },
  }).then(value => { completed = true; return value; });
  await polled.promise;
  assert.equal(completed, false, "投影已经折叠，但后端保存尚未完成");
  assert.equal(cache.cachedSnapshot(header), undefined);
  pending[0].resolve();
  await pending[0].completion;
  resume.resolve();
  const snapshot = await writing;
  assert.equal(completed, true);
  assert.deepEqual(cache.cachedSnapshot(header), snapshot);
});

test("官方吞掉写入拒绝时确认路径仍失败，重试后才可成功", async () => {
  const { confirmColdCacheWrite } = await import("../src/cache-rebuild.ts");
  const { cache, header, pending } = await fixture();
  const source = { meta: header, inheritedEventCount: 0, events: [] };
  await assert.rejects(confirmColdCacheWrite(cache, source, {
    attempts: 1,
    wait: async () => {
      pending[0].reject(new Error("synthetic backend failure"));
      await assert.rejects(pending[0].completion);
    },
  }), /persistence could not be confirmed/);
  assert.equal(cache.cachedSnapshot(header), undefined);
  const snapshot = await confirmColdCacheWrite(cache, source, {
    wait: async () => { pending[1].resolve(); await pending[1].completion; },
  });
  assert.deepEqual(cache.cachedSnapshot(header), snapshot);
});

test("超时不伪报保存成功，也不能声称取消尚在途的原生写入", async () => {
  const { confirmColdCacheWrite } = await import("../src/cache-rebuild.ts");
  const { cache, header, pending } = await fixture();
  await assert.rejects(confirmColdCacheWrite(cache, { meta: header, inheritedEventCount: 0, events: [] }, {
    attempts: 1, wait: async () => {},
  }), /persistence could not be confirmed/);
  assert.equal(cache.cachedSnapshot(header), undefined);
  pending[0].resolve();
  await pending[0].completion;
  assert.equal(cache.cachedSnapshot(header).values.issue88, "synthetic", "超时之后原生写入仍可落盘，调用方必须持有删除/生命周期屏障");
});
