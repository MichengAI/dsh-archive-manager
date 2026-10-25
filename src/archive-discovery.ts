import { archiveCodec, remoteInvocation, record, errorMessage, errorCode } from "./contracts.js";
import type { Schema, ConversationEvent, TextMessage, SearchHit, Failure, SearchInput, SearchProgress, SessionSummary } from "./contracts.js";
/** 归档正文检索和只读预览的共享协议与纯函数。正文只包含用户和助手的文本。 */
const id = (value: unknown) => {
  if (typeof value !== "string" || !value.length || value.length > 1024) throw new TypeError("会话 ID 无效");
  return value;
};
const queryText = (value: unknown, required = false) => {
  if (typeof value !== "string" || value.length > 200 || (required && !value.trim())) throw new TypeError("关键词须为 1～200 个字符");
  return value.trim();
};
export const searchInputSchema = { parse(input: unknown) {
  const value = record(input);
  if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("每次检索须包含 1～20 个会话");
  return { sessionIds: [...new Set(value.sessionIds.map(id))], query: queryText(value.query, true) };
} };
export const previewInputSchema = { parse(input: unknown) {
  const value = record(input);
  if (!value) throw new TypeError("预览参数无效");
  return { sessionId: id(value.sessionId), query: queryText(value.query ?? "") };
} };
const boundedString = (value: unknown, max: number) => {
  if (typeof value !== "string" || value.length > max) throw new TypeError("返回文本无效");
  return value;
};
const sequence = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new TypeError("消息序号无效");
  return value;
};
export const searchResultSchema = { parse(input: unknown) {
  const value = record(input);
  if (!value || !Array.isArray(value.items) || !Array.isArray(value.failures) || value.items.length > 20 || value.failures.length > 20) throw new TypeError("检索结果无效");
  return {
    items: value.items.map(record).map(row => ({ sessionId: id(row.sessionId), seq: sequence(row.seq), snippet: boundedString(row.snippet, 400) })),
    failures: value.failures.map(record).map(row => ({ sessionId: id(row.sessionId), message: boundedString(row.message, 500) }))
  };
} };
/** 只读预览中的单条消息；正文只保留用户和助手的文本。 */
export interface ArchivePreviewMessage {
  seq: number;
  role: string;
  text: string;
  truncated: boolean;
}
/** 只读预览的返回结构，供客户端消费方直接引用，避免从实现推导。 */
export interface ArchivePreviewResult {
  sessionId: string;
  hasEarlier: boolean;
  hasLater: boolean;
  messages: ArchivePreviewMessage[];
}
export const previewResultSchema = { parse(input: unknown): ArchivePreviewResult {
  const value = record(input);
  if (!value || !Array.isArray(value.messages) || value.messages.length > 8 || typeof value.hasEarlier !== "boolean" || typeof value.hasLater !== "boolean") throw new TypeError("预览结果无效");
  return { sessionId: id(value.sessionId), hasEarlier: value.hasEarlier, hasLater: value.hasLater,
    messages: value.messages.map(record).map(row => {
      if (typeof row.role !== "string" || !["user", "assistant"].includes(row.role) || typeof row.truncated !== "boolean") throw new TypeError("消息角色或截断状态无效");
      return { seq: sequence(row.seq), role: row.role, text: boundedString(row.text, 2000), truncated: row.truncated };
    }) };
} };
export async function copySessionText(text: string, clipboard = globalThis.navigator?.clipboard) {
  if (typeof text !== "string" || !text) throw Object.assign(new Error("没有可复制的内容"), { code: "copy.empty" });
  if (!clipboard?.writeText) throw Object.assign(new Error("当前环境不支持剪贴板，请在 HTTPS 或本机地址中打开页面"), { code: "copy.unavailable" });
  try { await clipboard.writeText(text); }
  catch { throw Object.assign(new Error("复制失败，请允许浏览器访问剪贴板后重试"), { code: "copy.denied" }); }
}
export function discoveryInvocations() {
  const methods: [string, Schema<unknown>, Schema<unknown>][] = [
    ["searchSessionContent", searchInputSchema, searchResultSchema],
    ["searchArchivedContent", searchInputSchema, searchResultSchema],
    ["previewArchivedSession", previewInputSchema, previewResultSchema]
  ];
  return methods.map(([method, input, output]) => remoteInvocation(method, {
    parameters: [{ name: "input", wire: "input", source: "json", codec: archiveCodec(method + "Input", input) }],
    result: archiveCodec(method + "Result", output)
  }));
}
/** 读取持久化事件的原始对话文本，不把工具输出、推理或插件注入当作正文。 */
export function extractConversation(events: readonly unknown[]) {
  if (!Array.isArray(events)) throw new TypeError("会话日志无效");
  const messages: TextMessage[] = [];
  for (const event of events.map(record)) {
    if (event.type !== "user/message" && event.type !== "assistant/message") continue;
    const data = event.data && typeof event.data === "object" ? record(event.data) : {};
    const message = data.message && typeof data.message === "object" ? record(data.message) : data;
    const role = event.type === "user/message" ? "user" : "assistant";
    const source = message.source && typeof message.source === "object" ? record(message.source) : {};
    if (role === "user" && source.kind && source.kind !== "user") continue;
    const content = message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter(block => block?.type === "text" && typeof block.text === "string").map(block => block.text).join("\n") : "";
    if (text.trim()) messages.push({ seq: sequence(event.seq), role, text });
  }
  return messages;
}
export function findContentMatch(messages: readonly TextMessage[], query: string) {
  const needle = query.trim();
  if (!needle) return null;
  for (const message of messages) {
    const match = findTextRange(message.text, needle);
    if (!match) continue;
    const start = Math.max(0, match.start - 70);
    return { seq: message.seq, snippet: (start ? "…" : "") + sliceWholeCharacters(message.text, start, start + 300) + (message.text.length > start + 300 ? "…" : "") };
  }
  return null;
}
/** 最近八条；有命中时展示其附近上下文，正文超长时从命中附近截取。 */
export function previewConversation(messages: readonly TextMessage[], query: string) {
  const needle = query.trim();
  const hit = needle ? messages.findIndex(row => findTextRange(row.text, needle)) : -1;
  const start = hit >= 0 ? Math.max(0, hit - 2) : Math.max(0, messages.length - 8);
  return { hasEarlier: start > 0, hasLater: start + 8 < messages.length, messages: messages.slice(start, start + 8).map(row => {
    const match = findTextRange(row.text, needle)?.start ?? -1;
    const offset = match >= 2000 ? Math.max(0, match - 300) : 0;
    return { ...row, text: sliceWholeCharacters(row.text, offset, offset + 2000), truncated: row.text.length > 2000 };
  }) };
}
/** 不受系统语言影响；大小写展开的码元区间映射回原文，供片段和高亮共用。 */
export function findTextRange(text: string, query: string) {
  const needle = query?.trim().toLowerCase();
  if (!needle) return null;
  const position = text.toLowerCase().indexOf(needle);
  if (position < 0) return null;
  let original = 0, folded = 0, start;
  for (const character of text) {
    const next = folded + character.toLowerCase().length;
    if (start === undefined && next > position) start = original;
    original += character.length;
    if (next >= position + needle.length) return { start: start ?? original, end: original };
    folded = next;
  }
  return null;
}
/** 收缩截取边界以保留完整 Unicode 字符，并保持协议的码元长度上限。 */
function sliceWholeCharacters(text: string, start: number, end: number) {
  const splitsPair = (index: number) => index > 0 && /[\uD800-\uDBFF]/.test(text[index - 1]) && /[\uDC00-\uDFFF]/.test(text[index] ?? "");
  if (splitsPair(start)) start++;
  if (splitsPair(end)) end--;
  return text.slice(start, end);
}
/** 用户本地日期边界；结束日期包含当天，避免 UTC 转换导致跨日遗漏。 */
function dayBoundary(value: string, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
  if (nextDay) date.setDate(date.getDate() + 1);
  return date.getTime();
}
export function validUpdatedRange(from: string, to: string) {
  return (!from || Number.isFinite(dayBoundary(from))) && (!to || Number.isFinite(dayBoundary(to))) && (!from || !to || from <= to);
}
export function matchesUpdatedRange(value: string | number | undefined, from: string, to: string) {
  if (!validUpdatedRange(from, to)) return false;
  if (!from && !to) return true;
  const time = typeof value === "number" ? value : Date.parse(value ?? "");
  return Number.isFinite(time) && (!from || time >= dayBoundary(from)) && (!to || time < dayBoundary(to, true));
}
/** 顺序分批限制宿主瞬时负载；取消会阻止后续批次和迟到结果发布。 */
export async function searchArchiveBatches(ids: readonly string[], query: string, call: (input: SearchInput) => Promise<unknown>, { signal, onProgress }: { signal?: AbortSignal; onProgress?: (progress: SearchProgress) => void } = {}) {
  const items: SearchHit[] = [], failures: Failure[] = [];
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
