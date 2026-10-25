import { archiveCodec, remoteInvocation, record, errorMessage, errorCode } from "./contracts.js";
const id = (value) => {
  if (typeof value !== "string" || !value.length || value.length > 1024) throw new TypeError("\u4F1A\u8BDD ID \u65E0\u6548");
  return value;
};
const queryText = (value, required = false) => {
  if (typeof value !== "string" || value.length > 200 || required && !value.trim()) throw new TypeError("\u5173\u952E\u8BCD\u987B\u4E3A 1\uFF5E200 \u4E2A\u5B57\u7B26");
  return value.trim();
};
const searchInputSchema = { parse(input) {
  const value = record(input);
  if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("\u6BCF\u6B21\u68C0\u7D22\u987B\u5305\u542B 1\uFF5E20 \u4E2A\u4F1A\u8BDD");
  return { sessionIds: [...new Set(value.sessionIds.map(id))], query: queryText(value.query, true) };
} };
const previewInputSchema = { parse(input) {
  const value = record(input);
  if (!value) throw new TypeError("\u9884\u89C8\u53C2\u6570\u65E0\u6548");
  return { sessionId: id(value.sessionId), query: queryText(value.query ?? "") };
} };
const boundedString = (value, max) => {
  if (typeof value !== "string" || value.length > max) throw new TypeError("\u8FD4\u56DE\u6587\u672C\u65E0\u6548");
  return value;
};
const sequence = (value) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new TypeError("\u6D88\u606F\u5E8F\u53F7\u65E0\u6548");
  return value;
};
const searchResultSchema = { parse(input) {
  const value = record(input);
  if (!value || !Array.isArray(value.items) || !Array.isArray(value.failures) || value.items.length > 20 || value.failures.length > 20) throw new TypeError("\u68C0\u7D22\u7ED3\u679C\u65E0\u6548");
  return {
    items: value.items.map(record).map((row) => ({ sessionId: id(row.sessionId), seq: sequence(row.seq), snippet: boundedString(row.snippet, 400) })),
    failures: value.failures.map(record).map((row) => ({ sessionId: id(row.sessionId), message: boundedString(row.message, 500) }))
  };
} };
const previewResultSchema = { parse(input) {
  const value = record(input);
  if (!value || !Array.isArray(value.messages) || value.messages.length > 8 || typeof value.hasEarlier !== "boolean" || typeof value.hasLater !== "boolean") throw new TypeError("\u9884\u89C8\u7ED3\u679C\u65E0\u6548");
  return {
    sessionId: id(value.sessionId),
    hasEarlier: value.hasEarlier,
    hasLater: value.hasLater,
    messages: value.messages.map(record).map((row) => {
      if (typeof row.role !== "string" || !["user", "assistant"].includes(row.role) || typeof row.truncated !== "boolean") throw new TypeError("\u6D88\u606F\u89D2\u8272\u6216\u622A\u65AD\u72B6\u6001\u65E0\u6548");
      return { seq: sequence(row.seq), role: row.role, text: boundedString(row.text, 2e3), truncated: row.truncated };
    })
  };
} };
async function copySessionText(text, clipboard = globalThis.navigator?.clipboard) {
  if (typeof text !== "string" || !text) throw Object.assign(new Error("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9"), { code: "copy.empty" });
  if (!clipboard?.writeText) throw Object.assign(new Error("\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u526A\u8D34\u677F\uFF0C\u8BF7\u5728 HTTPS \u6216\u672C\u673A\u5730\u5740\u4E2D\u6253\u5F00\u9875\u9762"), { code: "copy.unavailable" });
  try {
    await clipboard.writeText(text);
  } catch {
    throw Object.assign(new Error("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u5141\u8BB8\u6D4F\u89C8\u5668\u8BBF\u95EE\u526A\u8D34\u677F\u540E\u91CD\u8BD5"), { code: "copy.denied" });
  }
}
function discoveryInvocations() {
  const methods = [
    ["searchSessionContent", searchInputSchema, searchResultSchema],
    ["searchArchivedContent", searchInputSchema, searchResultSchema],
    ["previewArchivedSession", previewInputSchema, previewResultSchema]
  ];
  return methods.map(([method, input, output]) => remoteInvocation(method, {
    parameters: [{ name: "input", wire: "input", source: "json", codec: archiveCodec(method + "Input", input) }],
    result: archiveCodec(method + "Result", output)
  }));
}
function extractConversation(events) {
  if (!Array.isArray(events)) throw new TypeError("\u4F1A\u8BDD\u65E5\u5FD7\u65E0\u6548");
  const messages = [];
  for (const event of events.map(record)) {
    if (event.type !== "user/message" && event.type !== "assistant/message") continue;
    const data = event.data && typeof event.data === "object" ? record(event.data) : {};
    const message = data.message && typeof data.message === "object" ? record(data.message) : data;
    const role = event.type === "user/message" ? "user" : "assistant";
    const source = message.source && typeof message.source === "object" ? record(message.source) : {};
    if (role === "user" && source.kind && source.kind !== "user") continue;
    const content = message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n") : "";
    if (text.trim()) messages.push({ seq: sequence(event.seq), role, text });
  }
  return messages;
}
function findContentMatch(messages, query) {
  const needle = query.trim();
  if (!needle) return null;
  for (const message of messages) {
    const match = findTextRange(message.text, needle);
    if (!match) continue;
    const start = Math.max(0, match.start - 70);
    return { seq: message.seq, snippet: (start ? "\u2026" : "") + sliceWholeCharacters(message.text, start, start + 300) + (message.text.length > start + 300 ? "\u2026" : "") };
  }
  return null;
}
function previewConversation(messages, query) {
  const needle = query.trim();
  const hit = needle ? messages.findIndex((row) => findTextRange(row.text, needle)) : -1;
  const start = hit >= 0 ? Math.max(0, hit - 2) : Math.max(0, messages.length - 8);
  return { hasEarlier: start > 0, hasLater: start + 8 < messages.length, messages: messages.slice(start, start + 8).map((row) => {
    const match = findTextRange(row.text, needle)?.start ?? -1;
    const offset = match >= 2e3 ? Math.max(0, match - 300) : 0;
    return { ...row, text: sliceWholeCharacters(row.text, offset, offset + 2e3), truncated: row.text.length > 2e3 };
  }) };
}
function findTextRange(text, query) {
  const needle = query?.trim().toLowerCase();
  if (!needle) return null;
  const position = text.toLowerCase().indexOf(needle);
  if (position < 0) return null;
  let original = 0, folded = 0, start;
  for (const character of text) {
    const next = folded + character.toLowerCase().length;
    if (start === void 0 && next > position) start = original;
    original += character.length;
    if (next >= position + needle.length) return { start: start ?? original, end: original };
    folded = next;
  }
  return null;
}
function sliceWholeCharacters(text, start, end) {
  const splitsPair = (index) => index > 0 && /[\uD800-\uDBFF]/.test(text[index - 1]) && /[\uDC00-\uDFFF]/.test(text[index] ?? "");
  if (splitsPair(start)) start++;
  if (splitsPair(end)) end--;
  return text.slice(start, end);
}
function dayBoundary(value, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
  if (nextDay) date.setDate(date.getDate() + 1);
  return date.getTime();
}
function validUpdatedRange(from, to) {
  return (!from || Number.isFinite(dayBoundary(from))) && (!to || Number.isFinite(dayBoundary(to))) && (!from || !to || from <= to);
}
function matchesUpdatedRange(value, from, to) {
  if (!validUpdatedRange(from, to)) return false;
  if (!from && !to) return true;
  const time = typeof value === "number" ? value : Date.parse(value ?? "");
  return Number.isFinite(time) && (!from || time >= dayBoundary(from)) && (!to || time < dayBoundary(to, true));
}
async function searchArchiveBatches(ids, query, call, { signal, onProgress } = {}) {
  const items = [], failures = [];
  const unique = [...new Set(ids)];
  const check = () => {
    if (signal?.aborted) throw new Error("\u641C\u7D22\u5DF2\u53D6\u6D88");
  };
  for (let start = 0; start < unique.length; start += 20) {
    check();
    const result = searchResultSchema.parse(await call({ sessionIds: unique.slice(start, start + 20), query }));
    check();
    items.push(...result.items);
    failures.push(...result.failures);
    onProgress?.({ done: Math.min(start + 20, unique.length), total: unique.length, items: [...items], failures: [...failures] });
  }
  check();
  return { items, failures };
}
export {
  copySessionText,
  discoveryInvocations,
  extractConversation,
  findContentMatch,
  findTextRange,
  matchesUpdatedRange,
  previewConversation,
  previewInputSchema,
  previewResultSchema,
  searchArchiveBatches,
  searchInputSchema,
  searchResultSchema,
  validUpdatedRange
};
