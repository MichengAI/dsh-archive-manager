import test from "node:test";
import assert from "node:assert/strict";
import { idleArchiveCandidate, runSessionBatch, favoriteInputSchema, favoriteStateSchema, createSessionOrganizer } from "../src/archive-organizer.ts";

const now = Date.parse("2026-09-20T00:00:00Z");
const old = { id: "a", updatedAt: now - 31 * 86400000 };

test("闲置候选按最后活动时间判断，排除收藏、当前会话及执行和审批中的会话", () => {
  const options = { days: 30, now, favorites: new Set(), currentId: "current", pending: new Map() };
  assert.equal(idleArchiveCandidate(old, options), true);
  for (const extra of [{ running: true }, { runningSubagentCount: 1 }, { pendingInteraction: "approval" }, { id: "current" }, { updatedAt: "无效时间" }, { updatedAt: now }, { retainedBy: { mainView: 1 } }]) {
    assert.equal(idleArchiveCandidate({ ...old, ...extra }, options), false);
  }
  assert.equal(idleArchiveCandidate(old, { ...options, favorites: new Set(["a"]) }), false);
  assert.equal(idleArchiveCandidate(old, { ...options, pending: new Map([["a", { kind: "question" }]]) }), false);
  assert.equal(idleArchiveCandidate(old, { ...options, days: -1 }), false);
  assert.equal(idleArchiveCandidate(old, { ...options, days: 1.5 }), false);
  assert.equal(idleArchiveCandidate({ ...old, updatedAt: new Date(old.updatedAt).toISOString() }, options), true);
});

test("收藏接口严格校验类型、长度及状态集合", () => {
  assert.deepEqual(favoriteInputSchema.parse({ sessionId: "a", favorite: true }), { sessionId: "a", favorite: true });
  for (const value of [null, {}, { sessionId: "a", favorite: "true" }, { sessionId: "x".repeat(1025), favorite: true }]) assert.throws(() => favoriteInputSchema.parse(value));
  assert.throws(() => favoriteStateSchema.parse({ favoriteSessionIds: [1] }));
  assert.equal(favoriteStateSchema.safeParse(null).success, false);
});

test("批量失败保留成功、失败和未处理清单，刷新仍执行，重试不重复成功项", async () => {
  const calls = [], progress = [];
  let refreshed = 0;
  const result = await runSessionBatch(["a", "a", "b", "c"], async (id) => {
    calls.push(id);
    if (id === "b") throw new Error("写入失败");
    return true;
  }, { onProgress: (value) => progress.push(value), refresh: async () => { refreshed++; } });
  assert.deepEqual(calls, ["a", "b"]);
  assert.deepEqual(result.succeeded, ["a"]);
  assert.deepEqual(result.remaining, ["b", "c"]);
  assert.deepEqual(result.unprocessed, ["c"]);
  assert.equal(result.failures[0].sessionId, "b");
  assert.equal(refreshed, 1);
  assert.equal(progress.at(-1).done, 2);
  const retried = await runSessionBatch(result.remaining, async (id) => { calls.push(id); return true; });
  assert.deepEqual(retried.succeeded, ["b", "c"]);
  assert.deepEqual(calls, ["a", "b", "b", "c"]);
});

test("已归档、消失及新近活跃项可跳过，撤回仅使用真实成功集合", async () => {
  const result = await runSessionBatch(["already", "missing", "new"], async (id) => id === "new");
  assert.deepEqual(result.succeeded, ["new"]);
  assert.deepEqual(result.skipped, ["already", "missing"]);
  const undone = [];
  await runSessionBatch(result.succeeded, async (id) => { undone.push(id); return true; });
  assert.deepEqual(undone, ["new"]);
});

test("刷新失败不会把成功操作误报为未完成", async () => {
  const result = await runSessionBatch(["a"], async () => true, { refresh: async () => { throw new Error("刷新失败"); } });
  assert.deepEqual(result.succeeded, ["a"]);
  assert.deepEqual(result.remaining, []);
  assert.equal(result.refreshError, "刷新失败");
});

test("真实批量适配重查收藏与活动状态，并只撤回本批新增归档", async () => {
  const state = { archivedSessionIds: ["existing"] };
  const sessionState = { current: "active", byId: Object.fromEntries(["a", "b", "active", "existing"].map(id => [id, { ...old, id }])) };
  const favorites = new Set(["b"]), calls = [];
  const organize = createSessionOrganizer({
    workspaces: { getSnapshot: () => state }, sessions: { getSnapshot: () => sessionState },
    archive: async id => { calls.push(id); state.archivedSessionIds.push(id); },
    restore: async id => { state.archivedSessionIds = state.archivedSessionIds.filter(value => value !== id); return state; },
    getFavorites: async () => ({ favoriteSessionIds: [...favorites] }), currentSessionId: snapshot => snapshot.current
  });
  const result = await organize("archive", ["a", "b", "active", "existing", "missing"], { idleDays: 30 });
  assert.deepEqual(result.succeeded, ["a"]);
  assert.deepEqual(result.skipped, ["b", "active", "existing", "missing"]);
  await organize("undo", result.succeeded);
  assert.deepEqual(state.archivedSessionIds, ["existing"]);
  assert.deepEqual(calls, ["a"]);
});
