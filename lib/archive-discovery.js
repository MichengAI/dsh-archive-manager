const id = (value) => {
  if (typeof value !== "string" || !value.length || value.length > 1024) throw new TypeError("\u4F1A\u8BDD ID \u65E0\u6548");
  return value;
};
const queryText = (value, required = false) => {
  if (typeof value !== "string" || value.length > 200 || required && !value.trim()) throw new TypeError("\u5173\u952E\u8BCD\u987B\u4E3A 1\uFF5E200 \u4E2A\u5B57\u7B26");
  return value.trim();
};
const searchInputSchema = { parse(value) {
  if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("\u6BCF\u6B21\u68C0\u7D22\u987B\u5305\u542B 1\uFF5E20 \u4E2A\u4F1A\u8BDD");
  return { sessionIds: [...new Set(value.sessionIds.map(id))], query: queryText(value.query, true) };
} };
const previewInputSchema = { parse(value) {
  if (!value) throw new TypeError("\u9884\u89C8\u53C2\u6570\u65E0\u6548");
  return { sessionId: id(value.sessionId), query: queryText(value.query ?? "") };
} };
const boundedString = (value, max) => {
  if (typeof value !== "string" || value.length > max) throw new TypeError("\u8FD4\u56DE\u6587\u672C\u65E0\u6548");
  return value;
};
const sequence = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("\u6D88\u606F\u5E8F\u53F7\u65E0\u6548");
  return value;
};
const searchResultSchema = { parse(value) {
  if (!value || !Array.isArray(value.items) || !Array.isArray(value.failures) || value.items.length > 20 || value.failures.length > 20) throw new TypeError("\u68C0\u7D22\u7ED3\u679C\u65E0\u6548");
  return {
    items: value.items.map((row) => ({ sessionId: id(row.sessionId), seq: sequence(row.seq), snippet: boundedString(row.snippet, 400) })),
    failures: value.failures.map((row) => ({ sessionId: id(row.sessionId), message: boundedString(row.message, 500) }))
  };
} };
const previewResultSchema = { parse(value) {
  if (!value || !Array.isArray(value.messages) || value.messages.length > 8 || typeof value.hasEarlier !== "boolean" || typeof value.hasLater !== "boolean") throw new TypeError("\u9884\u89C8\u7ED3\u679C\u65E0\u6548");
  return {
    sessionId: id(value.sessionId),
    hasEarlier: value.hasEarlier,
    hasLater: value.hasLater,
    messages: value.messages.map((row) => {
      if (!["user", "assistant"].includes(row.role) || typeof row.truncated !== "boolean") throw new TypeError("\u6D88\u606F\u89D2\u8272\u6216\u622A\u65AD\u72B6\u6001\u65E0\u6548");
      return { seq: sequence(row.seq), role: row.role, text: boundedString(row.text, 2e3), truncated: row.truncated };
    })
  };
} };
const detailsInputSchema = { parse(value) {
  if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("\u6BCF\u6B21\u987B\u5305\u542B 1\uFF5E20 \u4E2A\u4F1A\u8BDD");
  return { sessionIds: [...new Set(value.sessionIds.map(id))] };
} };
const detailsResultSchema = { parse(value) {
  if (!value || !Array.isArray(value.items) || value.items.length > 20) throw new TypeError("\u4F1A\u8BDD\u8BE6\u60C5\u65E0\u6548");
  return { items: value.items.map((row) => ({ sessionId: id(row.sessionId), ...row.createdAt !== void 0 ? { createdAt: sequence(row.createdAt) } : {}, turnCount: row.turnCount === null ? null : sequence(row.turnCount), path: row.path === null ? null : boundedString(row.path, 32768), error: boundedString(row.error, 500) })) };
} };
function countConversationTurns(events) {
  if (!Array.isArray(events)) throw new TypeError("\u4F1A\u8BDD\u65E5\u5FD7\u65E0\u6548");
  return events.filter((event) => {
    if (event.type !== "user/message") return false;
    const message = event.data?.message ?? event.data;
    return message && (!message.source?.kind || message.source.kind === "user");
  }).length;
}
function compareTurnCounts(left, right, order) {
  const a = Number.isSafeInteger(left) && left >= 0;
  const b = Number.isSafeInteger(right) && right >= 0;
  if (a !== b) return a ? -1 : 1;
  return a ? order === "turnsAsc" ? left - right : right - left : 0;
}
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
  const codec = (name, schema) => ({ mode: "strict", typeSymbol: `@michengai/dsh-archive-manager/types#${name}`, create: () => schema, schema });
  return [["searchSessionContent", searchInputSchema, searchResultSchema], ["diagnoseSession", repairInputSchema, repairResultSchema], ["repairSession", repairInputSchema, repairResultSchema], ["sessionDetails", detailsInputSchema, detailsResultSchema], ["searchArchivedContent", searchInputSchema, searchResultSchema], ["previewArchivedSession", previewInputSchema, previewResultSchema]].map(([method, input, output]) => ({
    id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`,
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method,
    invocation: { kind: "direct" },
    parameters: [{ name: "input", wire: "input", source: "json", codec: codec(method + "Input", input) }],
    result: codec(method + "Result", output),
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  }));
}
function extractConversation(events) {
  if (!Array.isArray(events)) throw new TypeError("\u4F1A\u8BDD\u65E5\u5FD7\u65E0\u6548");
  const messages = [];
  for (const event of events) {
    if (event.type !== "user/message" && event.type !== "assistant/message") continue;
    const message = event.data?.message ?? event.data;
    const role = event.type === "user/message" ? "user" : "assistant";
    if (role === "user" && message?.source?.kind && message.source.kind !== "user") continue;
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
    if (next >= position + needle.length) return { start, end: original };
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
function sessionDetailCandidates(ids, byId) {
  return [...new Set(ids)].map((id2) => byId[id2] ?? { id: id2 });
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
  const time = typeof value === "number" ? value : Date.parse(value);
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
function classifySessionError(error) {
  const message = String(error?.message ?? error);
  const descriptions = {
    "repair-frame": ["\u65E7\u7248\u4FEE\u590D\u751F\u6210\u7684\u538B\u7F29\u683C\u5F0F\u4E0D\u7B26\u5408\u5BBF\u4E3B\u8981\u6C42", "\u91CD\u65B0\u8BCA\u65AD\u53EF\u7EA0\u6B63\u538B\u7F29\u5E27\u683C\u5F0F\uFF0C\u539F\u59CB\u65E5\u5FD7\u4FDD\u6301\u4E0D\u53D8\u3002"],
    "legacy-source": ["\u65E7\u7248\u6D88\u606F\u6765\u6E90\u4E0D\u53D7\u65B0\u7248 DSH \u652F\u6301", "\u8FD0\u884C\u8BCA\u65AD\uFF0C\u68C0\u67E5\u662F\u5426\u4E3A\u53EF\u8F6C\u6362\u7684\u65E7\u81EA\u52A8\u5316\u6765\u6E90\u3002"],
    missing: ["\u4F1A\u8BDD\u65E5\u5FD7\u6216\u9644\u4EF6\u8DEF\u5F84\u4E0D\u5B58\u5728", "\u68C0\u67E5\u539F\u76EE\u5F55\u6216\u78C1\u76D8\u662F\u5426\u53EF\u7528\uFF1B\u7F3A\u5931\u6B63\u6587\u4E0D\u80FD\u901A\u8FC7\u91CD\u5EFA\u7F13\u5B58\u6062\u590D\u3002"],
    permission: ["\u6CA1\u6709\u6743\u9650\u8BFB\u53D6\u4F1A\u8BDD\u6587\u4EF6", "\u68C0\u67E5\u76EE\u5F55\u8BBF\u95EE\u6743\u9650\u3001\u6587\u4EF6\u5360\u7528\u4E0E\u5B89\u5168\u8F6F\u4EF6\u9650\u5236\uFF0C\u518D\u91CD\u8BD5\u3002"],
    corrupt: ["\u4F1A\u8BDD\u65E5\u5FD7\u53EF\u80FD\u635F\u574F\u6216\u672A\u5B8C\u6574\u5199\u5165", "\u4FDD\u7559\u73B0\u6709\u65E5\u5FD7\uFF0C\u68C0\u67E5\u78C1\u76D8\u548C\u539F\u59CB\u6587\u4EF6\uFF1B\u4E0D\u81EA\u52A8\u622A\u65AD\u6216\u5220\u9664\u6D88\u606F\u3002"],
    unknown: ["\u4F1A\u8BDD\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6", "\u5148\u91CD\u8BD5\uFF1B\u4ECD\u5931\u8D25\u65F6\u5C55\u5F00\u6280\u672F\u8BE6\u60C5\uFF0C\u6309\u5177\u4F53\u9519\u8BEF\u68C0\u67E5\u5BBF\u4E3B\u517C\u5BB9\u6027\u3002"]
  };
  const codes = { ENOENT: "missing", EACCES: "permission", EPERM: "permission" };
  const patterns = [
    ["repair-frame", /first frame is not exactly one header line/],
    ["legacy-source", /unclassified message source/],
    ["missing", /ENOENT|不存在|not found/i],
    ["permission", /EACCES|EPERM|permission/i],
    ["corrupt", /corrupt|JSON|incomplete|truncat|损坏/i]
  ];
  const explicit = Object.hasOwn(codes, error?.code) ? codes[error.code] : error?.code;
  const code = Object.hasOwn(descriptions, explicit) ? explicit : patterns.find(([, pattern]) => pattern.test(message))?.[0] ?? "unknown";
  const [reason, advice] = descriptions[code];
  return { code, reason, advice };
}
const repairInputSchema = { parse(value) {
  const sessionId = id(value?.sessionId);
  if (value?.token !== void 0 && !/^[a-f0-9]{64}$/.test(value.token)) throw new TypeError("\u4FEE\u590D\u51ED\u636E\u65E0\u6548");
  return { sessionId, ...value.token !== void 0 ? { token: value.token } : {} };
} };
const repairResultSchema = { parse(value) {
  if (!value || typeof value.repairable !== "boolean" || typeof value.repaired !== "boolean") throw new TypeError("\u8BCA\u65AD\u7ED3\u679C\u65E0\u6548");
  return { ...value.code !== void 0 ? { code: boundedString(value.code, 64) } : {}, sessionId: id(value.sessionId), repairable: value.repairable, repaired: value.repaired, reason: boundedString(value.reason, 1e3), advice: boundedString(value.advice, 1e3), token: boundedString(value.token ?? "", 64), count: sequence(value.count ?? 0) };
} };
export {
  classifySessionError,
  compareTurnCounts,
  copySessionText,
  countConversationTurns,
  detailsInputSchema,
  detailsResultSchema,
  discoveryInvocations,
  extractConversation,
  findContentMatch,
  findTextRange,
  matchesUpdatedRange,
  previewConversation,
  previewInputSchema,
  previewResultSchema,
  repairInputSchema,
  repairResultSchema,
  searchArchiveBatches,
  searchInputSchema,
  searchResultSchema,
  sessionDetailCandidates,
  validUpdatedRange
};
