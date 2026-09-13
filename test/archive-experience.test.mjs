import test from "node:test";
import assert from "node:assert/strict";
import { archiveTextPreview, openArchivedConversation } from "../src/archive-experience.js";

test("预览只返回用户与助手文本，限制响应大小并标记截断", () => {
  const events = [
    { type: "user/message", data: { content: [{ type: "text", text: "问题" }] } },
    { type: "tool/result", data: { message: { content: "秘密工具结果" } } },
    { type: "user/message", data: { source: { kind: "inject" }, content: [{ type: "text", text: "内部上下文" }] } },
    { type: "assistant/message", data: { message: { content: [{ type: "text", text: "答复" }] } } },
  ];
  assert.deepEqual(archiveTextPreview(events), { messages: [{ role: "user", text: "问题" }, { role: "assistant", text: "答复" }], truncated: false });
  const result = archiveTextPreview(Array.from({ length: 102 }, () => events[0]));
  assert.equal(result.messages.length, 100);
  assert.equal(result.truncated, true);
  const large = archiveTextPreview(Array.from({ length: 15 }, () => ({ type: "user/message", data: { content: "字".repeat(20000) } })));
  assert.equal(large.truncated, true);
  assert.ok(large.messages.every(message => message.text.length <= 12000));
  assert.ok(large.messages.reduce((total, message) => total + message.text.length, 0) <= 120000);
});

test("继续对话不恢复；恢复并打开必须等持久化成功，失败不导航", async () => {
  const calls = [];
  const actions = { open: id => calls.push(["open", id]), restore: async id => calls.push(["restore", id]) };
  await openArchivedConversation(actions, "a", false);
  assert.deepEqual(calls, [["open", "a"]]);
  calls.length = 0;
  await openArchivedConversation(actions, "a", true);
  assert.deepEqual(calls, [["restore", "a"], ["open", "a"]]);
  calls.length = 0;
  await assert.rejects(openArchivedConversation({ ...actions, restore: async () => { throw new Error("磁盘失败"); } }, "a", true), /磁盘失败/);
  assert.deepEqual(calls, []);
});

test("离开页面后恢复完成不产生迟到导航", async () => {
  let active = true;
  let opened = false;
  await openArchivedConversation({ restore: async () => { active = false; }, open: () => { opened = true; } }, "a", true, () => active);
  assert.equal(opened, false);
});
