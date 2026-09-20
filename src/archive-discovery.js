/** 归档正文检索和只读预览的共享协议与纯函数。正文只包含用户和助手的文本。 */
const id = value => {
  if (typeof value !== "string" || !value.length || value.length > 1024) throw new TypeError("会话 ID 无效");
  return value;
};
const queryText = (value, required = false) => {
  if (typeof value !== "string" || value.length > 200 || (required && !value.trim())) throw new TypeError("关键词须为 1～200 个字符");
  return value.trim();
};
export const searchInputSchema = { parse(value) {
  if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("每次检索须包含 1～20 个会话");
  return { sessionIds: [...new Set(value.sessionIds.map(id))], query: queryText(value.query, true) };
} };
export const previewInputSchema = { parse(value) {
  if (!value) throw new TypeError("预览参数无效");
  return { sessionId: id(value.sessionId), query: queryText(value.query ?? "") };
} };
const boundedString = (value, max) => {
  if (typeof value !== "string" || value.length > max) throw new TypeError("返回文本无效");
  return value;
};
const sequence = value => {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("消息序号无效");
  return value;
};
export const searchResultSchema = { parse(value) {
  if (!value || !Array.isArray(value.items) || !Array.isArray(value.failures) || value.items.length > 20 || value.failures.length > 20) throw new TypeError("检索结果无效");
  return {
    items: value.items.map(row => ({ sessionId: id(row.sessionId), seq: sequence(row.seq), snippet: boundedString(row.snippet, 400) })),
    failures: value.failures.map(row => ({ sessionId: id(row.sessionId), message: boundedString(row.message, 500) }))
  };
} };
export const previewResultSchema = { parse(value) {
  if (!value || !Array.isArray(value.messages) || value.messages.length > 8 || typeof value.hasEarlier !== "boolean" || typeof value.hasLater !== "boolean") throw new TypeError("预览结果无效");
  return { sessionId: id(value.sessionId), hasEarlier: value.hasEarlier, hasLater: value.hasLater,
    messages: value.messages.map(row => {
      if (!["user", "assistant"].includes(row.role) || typeof row.truncated !== "boolean") throw new TypeError("消息角色或截断状态无效");
      return { seq: sequence(row.seq), role: row.role, text: boundedString(row.text, 2000), truncated: row.truncated };
    }) };
} };
export function discoveryInvocations() {
  const codec = (name, schema) => ({ mode: "strict", typeSymbol: `@michengai/dsh-archive-manager/types#${name}`, create: () => schema, schema });
  return [["searchArchivedContent", searchInputSchema, searchResultSchema], ["previewArchivedSession", previewInputSchema, previewResultSchema]].map(([method, input, output]) => ({
    id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`, service: "workspaceRegistry", namespace: "workspaceRegistry", method,
    invocation: { kind: "direct" }, parameters: [{ name: "input", wire: "input", source: "json", codec: codec(method + "Input", input) }],
    result: codec(method + "Result", output), sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  }));
}
/** 读取持久化事件的原始对话文本，不把工具输出、推理或插件注入当作正文。 */
export function extractConversation(events) {
  if (!Array.isArray(events)) throw new TypeError("会话日志无效");
  const messages = [];
  for (const event of events) {
    if (event.type !== "user/message" && event.type !== "assistant/message") continue;
    const message = event.data?.message ?? event.data;
    const role = event.type === "user/message" ? "user" : "assistant";
    if (role === "user" && message?.source?.kind && message.source.kind !== "user") continue;
    const content = message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter(block => block?.type === "text" && typeof block.text === "string").map(block => block.text).join("\n") : "";
    if (text.trim()) messages.push({ seq: sequence(event.seq), role, text });
  }
  return messages;
}
export function findContentMatch(messages, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return null;
  for (const message of messages) {
    const position = message.text.toLocaleLowerCase().indexOf(needle);
    if (position < 0) continue;
    const start = Math.max(0, position - 70);
    return { seq: message.seq, snippet: (start ? "…" : "") + message.text.slice(start, start + 300) + (message.text.length > start + 300 ? "…" : "") };
  }
  return null;
}
/** 最近八条；有命中时展示其附近上下文，正文超长时从命中附近截取。 */
export function previewConversation(messages, query) {
  const needle = query.trim().toLocaleLowerCase();
  const hit = needle ? messages.findIndex(row => row.text.toLocaleLowerCase().includes(needle)) : -1;
  const start = hit >= 0 ? Math.max(0, hit - 2) : Math.max(0, messages.length - 8);
  return { hasEarlier: start > 0, hasLater: start + 8 < messages.length, messages: messages.slice(start, start + 8).map(row => {
    const match = needle ? row.text.toLocaleLowerCase().indexOf(needle) : -1;
    const offset = match >= 2000 ? Math.max(0, match - 300) : 0;
    return { ...row, text: row.text.slice(offset, offset + 2000), truncated: row.text.length > 2000 };
  }) };
}
/** 用户本地日期边界；结束日期包含当天，避免 UTC 转换导致跨日遗漏。 */
function dayBoundary(value, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
  if (nextDay) date.setDate(date.getDate() + 1);
  return date.getTime();
}
export function validUpdatedRange(from, to) {
  return (!from || Number.isFinite(dayBoundary(from))) && (!to || Number.isFinite(dayBoundary(to))) && (!from || !to || from <= to);
}
export function matchesUpdatedRange(value, from, to) {
  if (!validUpdatedRange(from, to)) return false;
  if (!from && !to) return true;
  const time = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(time) && (!from || time >= dayBoundary(from)) && (!to || time < dayBoundary(to, true));
}
/** 顺序分批限制宿主瞬时负载；取消会阻止后续批次和迟到结果发布。 */
export async function searchArchiveBatches(ids, query, call, { signal, onProgress } = {}) {
  const items = [], failures = [];
  const unique = [...new Set(ids)];
  const check = () => { if (signal?.aborted) throw new Error("搜索已取消"); };
  for (let start = 0; start < unique.length; start += 20) {
    check();
    const result = searchResultSchema.parse(await call({ sessionIds: unique.slice(start, start + 20), query }));
    check(); items.push(...result.items); failures.push(...result.failures);
    onProgress?.({ done: Math.min(start + 20, unique.length), total: unique.length, items: [...items], failures: [...failures] });
  }
  check(); return { items, failures };
}
