import test from "node:test";
import assert from "node:assert/strict";
import { extractConversation, findContentMatch, previewConversation, matchesUpdatedRange, searchArchiveBatches, searchInputSchema, sessionDetailCandidates } from "../src/archive-discovery.ts";
const user = (seq, text) => ({ type: "user/message", seq, data: { role: "user", content: [{ type: "text", text }] } });
const assistant = (seq, text) => ({ type: "assistant/message", seq, data: { message: { role: "assistant", content: [{ type: "text", text }] } } });

test("轮次统计保留旧载荷选择语义并跳过非对象事件", async () => {
  const { countConversationTurns } = await import("../src/archive-discovery.ts");
  for (const [data, expected] of [
    [{ message: "", source: { kind: "user" } }, 0],
    [{ message: 0 }, 0],
    [{ message: "s", source: { kind: "automation" } }, 1],
    [{ message: null, source: { kind: "automation" } }, 0],
    [{ message: { source: { kind: "user" } } }, 1],
    [{ message: { source: { kind: "automation" } } }, 0],
    [[], 1],
    [{ message: [], source: { kind: "automation" } }, 1],
    [{ source: [] }, 1],
  ]) assert.equal(countConversationTurns([{ type: "user/message", data }]), expected);
  assert.equal(countConversationTurns([null, undefined, 42, "raw", false, [], user(0, "正常消息")]), 1);
});

test("诊断候选保留缺摘要会话且去重，不改变现有摘要", () => {
  const a = { id: "a", updatedAt: 1 };
  assert.deepEqual(sessionDetailCandidates(["a", "missing", "a"], { a }), [a, { id: "missing" }]);
});

test("大小写展开后的命中映射回原文，截断不拆开代理对", () => {
  for (const count of [100, 2500]) {
    const messages = [{ seq: 0, role: "user", text: "İ".repeat(count) + "订单退款" }];
    assert.ok(findContentMatch(messages, "订单退款").snippet.includes("订单退款"));
    assert.ok(previewConversation(messages, "订单退款").messages[0].text.includes("订单退款"));
  }
  const messages = [{ seq: 0, role: "user", text: "a".repeat(1999) + "😀尾部" }];
  assert.ok(previewConversation(messages, "").messages[0].text.isWellFormed());
  assert.ok(findContentMatch([{ seq: 0, text: "a".repeat(299) + "😀" }], "a").snippet.isWellFormed());
});

test("跨批次会话 ID 去重且命中片段保留正文", async () => {
  const calls = [];
  const result = await searchArchiveBatches(["a", "a", "b"], "订单", async input => {
    calls.push(input.sessionIds);
    return { items: input.sessionIds.map(sessionId => ({ sessionId, seq: 0, snippet: "订单正文" })), failures: [] };
  });
  assert.deepEqual(calls, [["a", "b"]]);
  assert.deepEqual(result.items.map(row => row.snippet), ["订单正文", "订单正文"]);
});
test("正文只收录用户和助手的文本，不混入工具、系统、推理或图片数据", () => {
  const events = [user(0, "查找订单"), { type: "system/message", data: { content: "内部系统" } }, assistant(2, "结果 <script>alert(1)</script>"), { type: "tool/result", data: { message: { content: "工具" } } }, assistant(4, "")];
  const messages = extractConversation(events);
  assert.deepEqual(messages.map(row => row.role), ["user", "assistant"]);
  assert.equal(findContentMatch(messages, "订单").seq, 0);
  assert.equal(findContentMatch(messages, "系统"), null);
  assert.equal(findContentMatch(messages, ".*"), null);
  assert.equal(messages[1].text, "结果 <script>alert(1)</script>");
});
test("预览默认展示最近消息，有关键词时定位命中附近并标记截断", () => {
  const messages = extractConversation(Array.from({ length: 20 }, (_, i) => user(i, i === 2 ? "关键字" : "x".repeat(2500))));
  const recent = previewConversation(messages, "");
  assert.equal(recent.messages.at(-1).seq, 19);
  assert.ok(recent.hasEarlier);
  assert.ok(recent.messages.every(row => row.text.length <= 2000));
  const matched = previewConversation(messages, "关键字");
  assert.ok(matched.messages.some(row => row.seq === 2));
  assert.ok(matched.hasLater);
});
test("日期按用户本地自然日包含结束日期，无效范围拒绝匹配", () => {
  const day = new Date(2026, 8, 20, 23, 59, 59).getTime();
  assert.equal(matchesUpdatedRange(day, "2026-09-20", "2026-09-20"), true);
  assert.equal(matchesUpdatedRange(day + 1000, "2026-09-20", "2026-09-20"), false);
  assert.equal(matchesUpdatedRange(day, "2026-09-21", "2026-09-20"), false);
  assert.equal(matchesUpdatedRange(day, "2026-02-30", ""), false);
});
test("分批搜索不截断末页，取消后不继续下一批，读取失败不吞掉", async () => {
  const ids = Array.from({ length: 23 }, (_, i) => String(i));
  const calls = [], progress = [];
  const result = await searchArchiveBatches(ids, "订单", async input => {
    calls.push(input.sessionIds);
    return { items: input.sessionIds.includes("22") ? [{ sessionId: "22", seq: 1, snippet: "订单" }] : [], failures: [] };
  }, { onProgress: value => progress.push(value) });
  assert.equal(result.items[0].sessionId, "22");
  assert.equal(calls.flat().length, 23);
  assert.equal(progress.at(-1).done, 23);
  const controller = new AbortController(); let count = 0;
  await assert.rejects(searchArchiveBatches(ids, "订单", async () => { count++; controller.abort(); return { items: [], failures: [] }; }, { signal: controller.signal }), /取消/);
  assert.equal(count, 1);
  await assert.rejects(searchArchiveBatches(ids, "订单", async () => { throw new Error("读取失败"); }), /读取失败/);
});
test("搜索参数限制批量大小、关键词和会话 ID，防止无限请求", () => {
  assert.throws(() => searchInputSchema.parse({ sessionIds: Array(21).fill("a"), query: "x" }));
  assert.throws(() => searchInputSchema.parse({ sessionIds: ["a"], query: " " }));
  assert.throws(() => searchInputSchema.parse({ sessionIds: [""], query: "x" }));
  assert.throws(() => searchInputSchema.parse({ sessionIds: ["a"], query: "x".repeat(201) }));
});

test("轮次排序的未知值始终置后，复制成功与拒绝均有明确结果", async () => {
  const { countConversationTurns, compareTurnCounts, copySessionText, detailsResultSchema } = await import("../src/archive-discovery.ts");
  assert.equal(countConversationTurns([user(0, ""), assistant(1, "回答"), { type: "user/message", data: { source: { kind: "agent-message" } } }]), 1);
  for (const order of ["turnsAsc", "turnsDesc"]) {
    assert.ok(compareTurnCounts(0, null, order) < 0);
    assert.ok(compareTurnCounts(undefined, 2, order) > 0);
  }
  assert.ok(compareTurnCounts(2, 5, "turnsAsc") < 0);
  assert.ok(compareTurnCounts(2, 5, "turnsDesc") > 0);
  let copied;
  await copySessionText("会话-ID", { writeText: async text => { copied = text; } });
  assert.equal(copied, "会话-ID");
  await assert.rejects(copySessionText("ID", { writeText: async () => { throw new Error("denied"); } }), /复制失败/);
  await assert.rejects(copySessionText("ID", null), /不支持剪贴板/);
  assert.throws(() => detailsResultSchema.parse({ items: [{ sessionId: "a", turnCount: -1, path: null, error: "" }] }));
});
