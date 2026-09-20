(() => {
  // src/session-health-locales.js
  var healthZh = {
    "health.archived": "\u5DF2\u5F52\u6863\u4F1A\u8BDD\u9700\u8981\u68C0\u67E5",
    "health.unarchived": "\u672A\u5F52\u6863\u4F1A\u8BDD\u9700\u8981\u68C0\u67E5",
    "health.heading": "\u8BCA\u65AD\u4E0E\u4FEE\u590D",
    "health.scopeArchived": "\u68C0\u67E5\u8303\u56F4\uFF1A\u5168\u90E8\u5DF2\u5F52\u6863\u4F1A\u8BDD\uFF0C\u4E0D\u53D7\u5217\u8868\u7B5B\u9009\u5F71\u54CD\u3002",
    "health.scopeUnarchived": "\u68C0\u67E5\u8303\u56F4\uFF1A\u5168\u90E8\u672A\u5F52\u6863\u4F1A\u8BDD\uFF0C\u4E0D\u53D7\u5217\u8868\u7B5B\u9009\u5F71\u54CD\u3002\u4FEE\u590D\u524D\u9700\u5148\u5F52\u6863\u5E76\u5173\u95ED\u4F1A\u8BDD\u3002",
    "health.retry": "\u91CD\u65B0\u68C0\u6D4B",
    "health.busy": "\u5904\u7406\u4E2D\u2026",
    "health.confirm": "\u786E\u8BA4\u4FEE\u590D",
    "health.diagnose": "\u8BCA\u65AD\u4F1A\u8BDD",
    "health.technical": "\u6280\u672F\u8BE6\u60C5",
    "health.notice": "\u4F1A\u8BDD\u4FEE\u590D\u5B8C\u6210\uFF0C\u5DF2\u91CD\u65B0\u8BFB\u53D6\u8BE6\u60C5\u3002",
    "health.legacy-source.reason": "\u65E7\u7248\u6D88\u606F\u6765\u6E90\u4E0D\u53D7\u65B0\u7248 DSH \u652F\u6301",
    "health.legacy-source.advice": "\u8FD0\u884C\u8BCA\u65AD\uFF0C\u68C0\u67E5\u662F\u5426\u4E3A\u53EF\u8F6C\u6362\u7684\u65E7\u81EA\u52A8\u5316\u6765\u6E90\u3002",
    "health.repair-frame.reason": "\u65E7\u7248\u4FEE\u590D\u751F\u6210\u7684\u538B\u7F29\u683C\u5F0F\u4E0D\u7B26\u5408\u5BBF\u4E3B\u8981\u6C42",
    "health.repair-frame.advice": "\u91CD\u65B0\u8BCA\u65AD\u53EF\u7EA0\u6B63\u538B\u7F29\u5E27\u683C\u5F0F\uFF0C\u539F\u59CB\u65E5\u5FD7\u4FDD\u6301\u4E0D\u53D8\u3002",
    "health.missing.reason": "\u4F1A\u8BDD\u65E5\u5FD7\u6216\u9644\u4EF6\u8DEF\u5F84\u4E0D\u5B58\u5728",
    "health.missing.advice": "\u68C0\u67E5\u539F\u76EE\u5F55\u6216\u78C1\u76D8\u662F\u5426\u53EF\u7528\uFF1B\u7F3A\u5931\u6B63\u6587\u4E0D\u80FD\u901A\u8FC7\u91CD\u5EFA\u7F13\u5B58\u6062\u590D\u3002",
    "health.permission.reason": "\u6CA1\u6709\u6743\u9650\u8BFB\u53D6\u4F1A\u8BDD\u6587\u4EF6",
    "health.permission.advice": "\u68C0\u67E5\u76EE\u5F55\u8BBF\u95EE\u6743\u9650\u3001\u6587\u4EF6\u5360\u7528\u4E0E\u5B89\u5168\u8F6F\u4EF6\u9650\u5236\uFF0C\u518D\u91CD\u8BD5\u3002",
    "health.corrupt.reason": "\u4F1A\u8BDD\u65E5\u5FD7\u53EF\u80FD\u635F\u574F\u6216\u672A\u5B8C\u6574\u5199\u5165",
    "health.corrupt.advice": "\u4FDD\u7559\u73B0\u6709\u65E5\u5FD7\uFF0C\u68C0\u67E5\u78C1\u76D8\u548C\u539F\u59CB\u6587\u4EF6\uFF1B\u4E0D\u81EA\u52A8\u622A\u65AD\u6216\u5220\u9664\u6D88\u606F\u3002",
    "health.unknown.reason": "\u4F1A\u8BDD\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6",
    "health.unknown.advice": "\u5148\u91CD\u8BD5\uFF1B\u4ECD\u5931\u8D25\u65F6\u5C55\u5F00\u6280\u672F\u8BE6\u60C5\uFF0C\u6309\u5177\u4F53\u9519\u8BEF\u68C0\u67E5\u5BBF\u4E3B\u517C\u5BB9\u6027\u3002",
    "health.healthy.reason": "\u4F1A\u8BDD\u5DF2\u53EF\u6B63\u5E38\u8BFB\u53D6",
    "health.healthy.advice": "\u5237\u65B0\u4F1A\u8BDD\u8BE6\u60C5\u5373\u53EF\uFF0C\u65E0\u9700\u4FEE\u590D\u3002",
    "health.ready.reason": "\u53D1\u73B0 {n} \u5904\u65E7\u81EA\u52A8\u5316\u6765\u6E90\uFF0C\u5DF2\u901A\u8FC7\u5BBF\u4E3B\u683C\u5F0F\u8F6C\u6362\u6821\u9A8C",
    "health.ready.advice": "\u5C06\u6765\u6E90\u8F6C\u6362\u4E3A dsh-automation \u63D2\u4EF6\u5F52\u5C5E\uFF0C\u4FDD\u7559\u4EFB\u52A1\u4FE1\u606F\u4E0E\u6B63\u6587\uFF0C\u751F\u6210\u65B0\u7248\u65E5\u5FD7\uFF1B\u65E7\u65E5\u5FD7\u539F\u6837\u4FDD\u7559\u3002\u8BF7\u786E\u4FDD\u5176\u4ED6 DSH \u8FDB\u7A0B\u672A\u6253\u5F00\u8BE5\u4F1A\u8BDD\u3002",
    "health.ready-frame.reason": "\u53D1\u73B0\u65E7\u7248\u4FEE\u590D\u7684\u538B\u7F29\u5E27\u95EE\u9898\uFF0C\u5DF2\u901A\u8FC7\u5BBF\u4E3B\u8BFB\u53D6\u6821\u9A8C",
    "health.ready-frame.advice": "\u7EA0\u6B63\u538B\u7F29\u5E27\u683C\u5F0F\uFF0C\u4FDD\u7559\u6B63\u6587\u53CA\u539F\u59CB\u65E5\u5FD7\u3002\u8BF7\u786E\u4FDD\u5176\u4ED6 DSH \u8FDB\u7A0B\u672A\u6253\u5F00\u8BE5\u4F1A\u8BDD\u3002",
    "health.blocked.reason": "\u6682\u4E0D\u80FD\u81EA\u52A8\u4FEE\u590D",
    "health.blocked.advice": "\u8BF7\u5C55\u5F00\u6280\u672F\u8BE6\u60C5\u67E5\u770B\u5177\u4F53\u9650\u5236\uFF0C\u5904\u7406\u540E\u91CD\u65B0\u8BCA\u65AD\u3002",
    "health.repaired.reason": "\u4FEE\u590D\u5B8C\u6210\uFF0C\u5BBF\u4E3B\u5DF2\u80FD\u6B63\u5E38\u8BFB\u53D6",
    "health.repaired.advice": "\u65E7\u65E5\u5FD7\u4FDD\u7559\uFF0C\u5F52\u6863\u72B6\u6001\u4E0D\u53D8\uFF1B\u53EF\u4EE5\u91CD\u65B0\u9884\u89C8\u6216\u6253\u5F00\u4F1A\u8BDD\u3002",
    "health.published-unreadable.reason": "\u65B0\u7248\u65E5\u5FD7\u5DF2\u751F\u6210\uFF0C\u4F46\u5BBF\u4E3B\u590D\u8BFB\u672A\u901A\u8FC7",
    "health.published-unreadable.advice": "\u65E7\u65E5\u5FD7\u4ECD\u4FDD\u7559\uFF0C\u8BF7\u91CD\u542F DSH \u540E\u91CD\u65B0\u8BCA\u65AD\uFF1B\u4E0D\u8981\u53CD\u590D\u4FEE\u590D\u6216\u5220\u9664\u65E5\u5FD7\u3002",
    "health.failed.reason": "\u64CD\u4F5C\u672A\u5B8C\u6210",
    "health.failed.advice": "\u8BF7\u5C55\u5F00\u6280\u672F\u8BE6\u60C5\u67E5\u770B\u9519\u8BEF\uFF0C\u5904\u7406\u540E\u91CD\u65B0\u8BCA\u65AD\u3002"
  };
  var healthEn = {
    "health.archived": "Archived sessions need attention",
    "health.unarchived": "Unarchived sessions need attention",
    "health.heading": "Diagnosis and repair",
    "health.scopeArchived": "Checks all archived sessions, regardless of list filters.",
    "health.scopeUnarchived": "Checks all unarchived sessions, regardless of list filters. Archive and close a session before repairing it.",
    "health.retry": "Check again",
    "health.busy": "Processing\u2026",
    "health.confirm": "Confirm repair",
    "health.diagnose": "Diagnose session",
    "health.technical": "Technical details",
    "health.notice": "Session repaired. Details have been refreshed.",
    "health.legacy-source.reason": "The new DSH version does not support this legacy message source",
    "health.legacy-source.advice": "Run a diagnosis to check whether the legacy automation source can be converted.",
    "health.repair-frame.reason": "A previous repair used an unsupported compression format",
    "health.repair-frame.advice": "Run a diagnosis to correct the compression frames while preserving the original log.",
    "health.missing.reason": "The session log or attachment path does not exist",
    "health.missing.advice": "Check the original directory and disk. Rebuilding the cache cannot recover missing messages.",
    "health.permission.reason": "Permission to read the session files was denied",
    "health.permission.advice": "Check directory permissions, file locks and security software, then retry.",
    "health.corrupt.reason": "The session log may be corrupt or incomplete",
    "health.corrupt.advice": "Keep the existing log and check the disk and original files. Messages will not be truncated or deleted automatically.",
    "health.unknown.reason": "The session cannot currently be read",
    "health.unknown.advice": "Retry first. If it still fails, expand technical details to check host compatibility.",
    "health.healthy.reason": "The session can be read normally",
    "health.healthy.advice": "Refresh the session details. No repair is needed.",
    "health.ready.reason": "Found {n} legacy automation sources; host format validation passed",
    "health.ready.advice": "Convert the sources to the dsh-automation plugin and generate a new log, preserving task information, messages and the original log. Ensure no other DSH process has the session open.",
    "health.ready-frame.reason": "Found compression frame issues from a previous repair; host validation passed",
    "health.ready-frame.advice": "Correct the compression frames, preserving messages and the original log. Ensure no other DSH process has the session open.",
    "health.blocked.reason": "Automatic repair is currently unavailable",
    "health.blocked.advice": "Expand technical details to see the restriction. Resolve it before diagnosing again.",
    "health.repaired.reason": "Repair complete; the host can read the session",
    "health.repaired.advice": "The original log and archive status are preserved. You can preview or open the session again.",
    "health.published-unreadable.reason": "A new log was generated, but the host could not read it back",
    "health.published-unreadable.advice": "The original log is preserved. Restart DSH and diagnose again. Do not repeatedly repair or delete logs.",
    "health.failed.reason": "The operation did not complete",
    "health.failed.advice": "Expand technical details to inspect the error. Resolve it before diagnosing again."
  };

  // src/archive-discovery.js
  var id = (value) => {
    if (typeof value !== "string" || !value.length || value.length > 1024) throw new TypeError("\u4F1A\u8BDD ID \u65E0\u6548");
    return value;
  };
  var queryText = (value, required = false) => {
    if (typeof value !== "string" || value.length > 200 || required && !value.trim()) throw new TypeError("\u5173\u952E\u8BCD\u987B\u4E3A 1\uFF5E200 \u4E2A\u5B57\u7B26");
    return value.trim();
  };
  var searchInputSchema = { parse(value) {
    if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("\u6BCF\u6B21\u68C0\u7D22\u987B\u5305\u542B 1\uFF5E20 \u4E2A\u4F1A\u8BDD");
    return { sessionIds: [...new Set(value.sessionIds.map(id))], query: queryText(value.query, true) };
  } };
  var previewInputSchema = { parse(value) {
    if (!value) throw new TypeError("\u9884\u89C8\u53C2\u6570\u65E0\u6548");
    return { sessionId: id(value.sessionId), query: queryText(value.query ?? "") };
  } };
  var boundedString = (value, max) => {
    if (typeof value !== "string" || value.length > max) throw new TypeError("\u8FD4\u56DE\u6587\u672C\u65E0\u6548");
    return value;
  };
  var sequence = (value) => {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("\u6D88\u606F\u5E8F\u53F7\u65E0\u6548");
    return value;
  };
  var searchResultSchema = { parse(value) {
    if (!value || !Array.isArray(value.items) || !Array.isArray(value.failures) || value.items.length > 20 || value.failures.length > 20) throw new TypeError("\u68C0\u7D22\u7ED3\u679C\u65E0\u6548");
    return {
      items: value.items.map((row) => ({ sessionId: id(row.sessionId), seq: sequence(row.seq), snippet: boundedString(row.snippet, 400) })),
      failures: value.failures.map((row) => ({ sessionId: id(row.sessionId), message: boundedString(row.message, 500) }))
    };
  } };
  var previewResultSchema = { parse(value) {
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
  var detailsInputSchema = { parse(value) {
    if (!value || !Array.isArray(value.sessionIds) || !value.sessionIds.length || value.sessionIds.length > 20) throw new TypeError("\u6BCF\u6B21\u987B\u5305\u542B 1\uFF5E20 \u4E2A\u4F1A\u8BDD");
    return { sessionIds: [...new Set(value.sessionIds.map(id))] };
  } };
  var detailsResultSchema = { parse(value) {
    if (!value || !Array.isArray(value.items) || value.items.length > 20) throw new TypeError("\u4F1A\u8BDD\u8BE6\u60C5\u65E0\u6548");
    return { items: value.items.map((row) => ({ sessionId: id(row.sessionId), ...row.createdAt !== void 0 ? { createdAt: sequence(row.createdAt) } : {}, turnCount: row.turnCount === null ? null : sequence(row.turnCount), path: row.path === null ? null : boundedString(row.path, 32768), error: boundedString(row.error, 500) })) };
  } };
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
  var repairInputSchema = { parse(value) {
    const sessionId = id(value?.sessionId);
    if (value?.token !== void 0 && !/^[a-f0-9]{64}$/.test(value.token)) throw new TypeError("\u4FEE\u590D\u51ED\u636E\u65E0\u6548");
    return { sessionId, ...value.token !== void 0 ? { token: value.token } : {} };
  } };
  var repairResultSchema = { parse(value) {
    if (!value || typeof value.repairable !== "boolean" || typeof value.repaired !== "boolean") throw new TypeError("\u8BCA\u65AD\u7ED3\u679C\u65E0\u6548");
    return { ...value.code !== void 0 ? { code: boundedString(value.code, 64) } : {}, sessionId: id(value.sessionId), repairable: value.repairable, repaired: value.repaired, reason: boundedString(value.reason, 1e3), advice: boundedString(value.advice, 1e3), token: boundedString(value.token ?? "", 64), count: sequence(value.count ?? 0) };
  } };

  // src/session-health-ui.js
  var defaultT = (key, args = {}) => Object.entries(args).reduce((text, [name, value]) => text.replaceAll("{" + name + "}", String(value)), healthZh[key] ?? key);
  var sessionHealthCss = `
.dsham_health{margin:0 0 16px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary);--health-accent:var(--dsw-alias-state-business-primary,#507fe5);--health-warning:var(--dsw-alias-state-warn-label)}
.dsham_health p{margin:0}.dsham_healthPanel{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.dsham_healthSummary{display:flex;align-items:center;gap:10px;min-height:52px;padding:12px 16px;list-style:none;cursor:pointer;box-sizing:border-box}
.dsham_health summary::-webkit-details-marker{display:none}.dsham_health summary::marker{content:''}
.dsham_healthSummary:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsham_healthIcon{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--health-warning) 12%,transparent);color:var(--health-warning)}
.dsham_healthSummaryText{flex:1;min-width:0;font-weight:600}.dsham_healthCount{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;margin-left:8px;padding:0 6px;box-sizing:border-box;border-radius:6px;background:var(--dsw-alias-bg-layer-3);font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsham_healthSummaryHint{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}.dsham_healthChevron{display:flex;transition:transform .15s ease}.dsham_healthPanel[open]>.dsham_healthSummary .dsham_healthChevron{transform:rotate(180deg)}
.dsham_healthBody{border-top:1px solid var(--dsw-alias-border-l2);padding:14px;display:grid;gap:10px}.dsham_healthIntro{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 2px 4px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsham_healthItem{padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-3)}
.dsham_healthRow{display:flex;align-items:center;justify-content:space-between;gap:16px}.dsham_healthCopy{flex:1;min-width:0}.dsham_healthTitle{display:block;font-size:13px;font-weight:600;overflow-wrap:anywhere}.dsham_healthState{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsham_healthState[data-state=ready]{color:var(--dsw-alias-label-primary)}.dsham_healthState[data-state=ready]>span{color:var(--health-accent)}.dsham_healthState[data-state=success]{color:var(--dsw-alias-state-success-primary,#60b58a)}
.dsham_healthButton{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;min-height:32px;padding:5px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s}
.dsham_healthButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-label-secondary)}.dsham_healthButton[data-primary=true]{background:var(--dsw-alias-button-primary-fill,#3169c6);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}.dsham_healthButton[data-primary=true]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill,#3169c6));border-color:transparent}.dsham_healthButton:disabled{opacity:.5;cursor:wait}.dsham_healthButton[data-subtle=true]{border-color:transparent;padding:3px 6px;min-height:28px;color:var(--dsw-alias-label-secondary)}
.dsham_healthAdvice{margin-top:10px!important;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:12px;overflow-wrap:anywhere}.dsham_healthTech{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsham_healthTech>summary{display:inline-flex;gap:4px;align-items:center;min-height:24px;cursor:pointer}.dsham_healthTech[open]>summary .dsham_healthChevron{transform:rotate(180deg)}.dsham_healthLog{margin-top:8px;padding:10px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);overflow-wrap:anywhere;font:11px/1.7 ui-monospace,monospace}.dsham_healthLog p+p{margin-top:6px}
.dsham_healthNotice{display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:10px!important;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;color:var(--dsw-alias-label-primary)}
.dsham_health button:focus-visible,.dsham_health summary:focus-visible{outline:2px solid var(--health-accent);outline-offset:3px}.dsham_health svg{flex:none}
@media(max-width:520px){.dsham_healthSummary{padding:12px}.dsham_healthSummaryHint{display:none}.dsham_healthBody{padding:10px}.dsham_healthItem{padding:12px}.dsham_healthRow{align-items:flex-start;flex-wrap:wrap;gap:12px}.dsham_healthCopy{flex-basis:65%}.dsham_healthButton{min-height:36px}.dsham_healthIntro{align-items:flex-start}.dsham_healthIntro>span{flex:1}}
@media(prefers-reduced-motion:reduce){.dsham_health *{transition:none!important}}
`;
  function createSessionHealthPanel(React, icons = {}) {
    const h = React.createElement;
    const icon = (name, className) => icons[name] ? h("span", { className, "aria-hidden": true }, h(icons[name], { width: 16, height: 16 })) : null;
    return function SessionHealthPanel({ items, sessions, t = defaultT, isArchived = true, diagnoseSession, repairSession, retry, pending }) {
      const [results, setResults] = React.useState({});
      const [busyId, setBusyId] = React.useState("");
      const [notice, setNotice] = React.useState("");
      const errors = items.filter((row) => row.error);
      const run = async (row, repair) => {
        if (busyId) return;
        setBusyId(row.sessionId);
        setNotice("");
        try {
          const result = await (repair ? repairSession({ sessionId: row.sessionId, token: results[row.sessionId].token }) : diagnoseSession({ sessionId: row.sessionId }));
          setResults((previous) => ({ ...previous, [row.sessionId]: result }));
          if (result.repaired) {
            setNotice(true);
            retry();
          }
        } catch (error) {
          setResults((previous) => ({ ...previous, [row.sessionId]: { repairable: false, code: "failed", reason: "", advice: String(error?.message ?? error).slice(0, 1e3) } }));
        } finally {
          setBusyId("");
        }
      };
      return h(
        "div",
        { className: "dsham_health" },
        h("style", null, sessionHealthCss),
        notice && h("p", { role: "status", className: "dsham_healthNotice" }, icon("check"), t("health.notice")),
        errors.length > 0 && h(
          "details",
          { className: "dsham_healthPanel" },
          h(
            "summary",
            { className: "dsham_healthSummary" },
            icon("warning", "dsham_healthIcon"),
            h("span", { className: "dsham_healthSummaryText" }, t(isArchived ? "health.archived" : "health.unarchived"), h("span", { className: "dsham_healthCount" }, errors.length)),
            h("span", { className: "dsham_healthSummaryHint" }, t("health.heading")),
            icon("chevron", "dsham_healthChevron")
          ),
          h(
            "div",
            { className: "dsham_healthBody" },
            h(
              "div",
              { className: "dsham_healthIntro" },
              h("span", null, t(isArchived ? "health.scopeArchived" : "health.scopeUnarchived")),
              h("button", { type: "button", className: "dsham_healthButton", "data-subtle": true, disabled: pending || Boolean(busyId), onClick: retry }, icon("refresh"), t("health.retry"))
            ),
            errors.map((row) => {
              const diagnostic = classifySessionError(row.error);
              const result = results[row.sessionId];
              const code = result ? Object.hasOwn(healthZh, "health." + result.code + ".reason") ? result.code : result.repaired ? "repaired" : result.repairable ? "ready" : "blocked" : diagnostic.code;
              const title = sessions.find((session) => session.id === row.sessionId);
              const repairing = result?.repairable && repairSession;
              return h(
                "section",
                { key: row.sessionId, className: "dsham_healthItem", "aria-busy": busyId === row.sessionId },
                h(
                  "div",
                  { className: "dsham_healthRow" },
                  h(
                    "div",
                    { className: "dsham_healthCopy" },
                    h("strong", { className: "dsham_healthTitle" }, title?.displayTitle || title?.title || row.sessionId),
                    h(
                      "div",
                      { className: "dsham_healthState", "data-state": result?.repaired ? "success" : repairing ? "ready" : "pending", role: result ? "status" : void 0 },
                      icon(result?.repaired ? "check" : "info"),
                      t("health." + code + ".reason", { n: result?.count ?? 0 })
                    )
                  ),
                  diagnoseSession && h(
                    "button",
                    { type: "button", className: "dsham_healthButton", "data-primary": Boolean(repairing), disabled: Boolean(busyId), onClick: () => run(row, Boolean(repairing)) },
                    icon(busyId === row.sessionId ? "refresh" : repairing ? "check" : "search"),
                    t(busyId === row.sessionId ? "health.busy" : repairing ? "health.confirm" : "health.diagnose")
                  )
                ),
                result && h("p", { className: "dsham_healthAdvice" }, t("health." + code + ".advice")),
                !result && diagnostic.code !== "legacy-source" && h("p", { className: "dsham_healthAdvice" }, t("health." + code + ".advice")),
                h(
                  "details",
                  { className: "dsham_healthTech" },
                  h("summary", null, icon("chevron", "dsham_healthChevron"), t("health.technical")),
                  h("div", { className: "dsham_healthLog" }, h("p", null, row.sessionId), h("p", null, row.error), result?.reason && h("p", null, result.reason), result?.advice && h("p", null, result.advice))
                )
              );
            })
          )
        )
      );
    };
  }

  // src/archive-discovery-ui.js
  function createDiscoveryTools(React) {
    const h = React.createElement;
    function HighlightedText({ text, query }) {
      const match = findTextRange(text, query);
      return !match ? text : h(React.Fragment, null, text.slice(0, match.start), h("mark", null, text.slice(match.start, match.end)), text.slice(match.end));
    }
    function useArchiveSearch(ids, query, enabled, call) {
      const idsKey = JSON.stringify(ids);
      const key = JSON.stringify([idsKey, query]);
      const [revision, setRevision] = React.useState(0);
      const [state, setState] = React.useState({ key: "", status: "idle", items: [], failures: [] });
      React.useEffect(() => {
        if (!enabled || !query.trim() || !call) return;
        const controller = new AbortController();
        setState({ key, status: "loading", items: [], failures: [], done: 0, total: ids.length });
        const timer = setTimeout(() => {
          searchArchiveBatches(JSON.parse(idsKey), query, call, { signal: controller.signal, onProgress: (progress) => {
            if (!controller.signal.aborted) setState({ key, status: "loading", ...progress });
          } }).then((result) => {
            if (!controller.signal.aborted) setState({ key, status: "ready", done: ids.length, total: ids.length, ...result });
          }).catch((error) => {
            if (!controller.signal.aborted) setState((previous) => ({ ...previous, key, status: "error", error: String(error?.message ?? error) }));
          });
        }, 350);
        return () => {
          controller.abort();
          clearTimeout(timer);
        };
      }, [idsKey, query, enabled, call, revision]);
      const active = enabled && query.trim() && call;
      return { ...active ? state.key === key ? state : { key, status: "loading", items: [], failures: [], done: 0, total: ids.length } : { status: "idle", items: [], failures: [] }, retry: () => setRevision((value) => value + 1) };
    }
    function useSessionDetails(sessions, call, t) {
      const key = JSON.stringify(sessions.map((session) => [session.id, session.updatedAt]));
      const [revision, setRevision] = React.useState(0);
      const [state, setState] = React.useState({ key: "", items: [], pending: false });
      React.useEffect(() => {
        if (!call) return;
        let active = true;
        const ids = [...new Set(JSON.parse(key).map((row) => row[0]))];
        setState({ key, items: [], pending: ids.length > 0 });
        const load = async () => {
          const items = [];
          for (let start = 0; start < ids.length && active; start += 20) {
            const batch = ids.slice(start, start + 20);
            try {
              const result = detailsResultSchema.parse(await call({ sessionIds: batch }));
              const found = new Map(result.items.map((row) => [row.sessionId, row]));
              items.push(...batch.map((sessionId) => found.get(sessionId) ?? { sessionId, turnCount: null, path: null, error: t ? t("details.notReturned") : "details.notReturned" }));
            } catch (error) {
              items.push(...batch.map((sessionId) => ({ sessionId, turnCount: null, path: null, error: String(error?.message ?? error) })));
            }
            if (active) setState({ key, items: [...items], pending: start + 20 < ids.length });
          }
        };
        load();
        return () => {
          active = false;
        };
      }, [key, call, revision, t]);
      const current = call && state.key === key ? state : { items: [], pending: Boolean(call && sessions.length) };
      return { ...current, byId: Object.fromEntries(current.items.map((row) => [row.sessionId, row])), retry: () => setRevision((value) => value + 1) };
    }
    function useArchivePreview(call, eligibleIds) {
      const [target, setTarget] = React.useState(null);
      const [state, setState] = React.useState({ status: "idle" });
      const [revision, setRevision] = React.useState(0);
      const key = target;
      const available = target && eligibleIds.includes(target.session.id);
      React.useEffect(() => {
        if (target && !available) setTarget(null);
      }, [target, available]);
      React.useEffect(() => {
        if (!available || typeof window === "undefined") return;
        const onKeyDown = (event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          setTarget(null);
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
      }, [available]);
      React.useEffect(() => {
        if (!target || !available || !call) return;
        let active = true;
        setState({ key, status: "loading" });
        Promise.resolve().then(() => call({ sessionId: target.session.id, query: target.query })).then((value) => {
          if (active) setState({ key, status: "ready", value });
        }).catch((error) => {
          if (active) setState({ key, status: "error", error: String(error?.message ?? error) });
        });
        return () => {
          active = false;
        };
      }, [key, available, call, revision]);
      return { target: available ? target : null, ...state.key === key ? state : { status: "loading" }, open: (session, query = "") => setTarget({ session, query }), close: () => setTarget(null), retry: () => setRevision((value) => value + 1) };
    }
    function DiscoveryFilters({ t, from, to, onFrom, onTo, invalid, onClear }) {
      const rootRef = React.useRef(null);
      React.useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const onPointerDown = (event) => {
          if (root.open && !root.contains(event.target)) root.open = false;
        };
        root.ownerDocument.addEventListener("pointerdown", onPointerDown, true);
        return () => root.ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
      }, []);
      const active = Boolean(from || to);
      const range = active ? `${from || "\u2026"} \uFF5E ${to || "\u2026"}` : t("discovery.date");
      return h(
        "details",
        { className: "dsham_dateFilter", ref: rootRef, onKeyDown: (event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        } },
        h(
          "summary",
          { title: range, "aria-label": t("discovery.date") + (active ? t("common.separator") + range : ""), "data-active": active },
          h(
            "svg",
            { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", "aria-hidden": true },
            h("rect", { x: 2, y: 3.5, width: 12, height: 10.5, rx: 2 }),
            h("path", { d: "M5 1.5v4M11 1.5v4M2 7h12" })
          ),
          h("span", null, active ? t("discovery.dateActive") : t("discovery.date"))
        ),
        h(
          "div",
          { className: "dsham_datePanel" },
          h("label", null, t("discovery.from"), h("input", { type: "date", value: from, max: to || void 0, onChange: (event) => onFrom(event.target.value) })),
          h("label", null, t("discovery.to"), h("input", { type: "date", value: to, min: from || void 0, onChange: (event) => onTo(event.target.value) })),
          invalid && h("p", { role: "alert" }, t("discovery.invalidDate")),
          h("button", { type: "button", className: "dsham_settingsAction", disabled: !active, onClick: onClear }, t("discovery.clearDate"))
        )
      );
    }
    function SearchStatus({ state, t }) {
      if (state.status === "idle") return null;
      return h(
        "div",
        { className: "dsham_discoveryStatus", role: "status", "aria-live": "polite" },
        h("p", null, t(state.status === "loading" ? "discovery.searching" : state.status === "error" ? "discovery.searchError" : "discovery.searched", { done: state.done ?? 0, total: state.total ?? 0 })),
        state.status === "error" && h("p", null, state.error),
        state.failures.length > 0 && h("details", null, h("summary", null, t("discovery.failed", { n: state.failures.length })), h("ul", null, state.failures.map((row) => h("li", { key: row.sessionId }, row.sessionId, t("common.separator"), row.message)))),
        (state.status === "error" || state.status === "ready" && state.failures.length > 0) && h("button", { type: "button", className: "dsham_settingsAction", onClick: state.retry }, t("discovery.retry"))
      );
    }
    function PreviewContent({ preview, t, MarkdownText }) {
      const [raw, setRaw] = React.useState(false);
      if (preview.status === "loading") return h("p", { role: "status" }, t("discovery.loading"));
      if (preview.status === "error") return h("div", null, h("p", { role: "alert" }, preview.error), h("button", { type: "button", className: "dsham_settingsAction", onClick: preview.retry }, t("discovery.retry")));
      const value = preview.value;
      if (!value) return null;
      return h(
        "div",
        { className: "dsham_previewMessages" },
        h(
          "div",
          { className: "dsham_previewToolbar" },
          h("span", { title: t("discovery.previewHint") }, t("discovery.readOnly"), " \xB7 ", t("discovery.messageCount", { n: value.messages.length })),
          MarkdownText && h(
            "div",
            { className: "dsham_previewModes", role: "group", "aria-label": t("discovery.displayMode") },
            h("button", { type: "button", "aria-pressed": !raw, onClick: () => setRaw(false) }, t("discovery.formatted")),
            h("button", { type: "button", "aria-pressed": raw, onClick: () => setRaw(true) }, t("discovery.raw"))
          )
        ),
        value.hasEarlier && h("p", null, t("discovery.earlier")),
        !value.messages.length && h("p", null, t("discovery.empty")),
        value.messages.map((row) => h("article", { key: row.seq, className: "dsham_previewMessage" }, h("div", { className: "dsham_previewRole", "data-role": row.role }, h("span", { "aria-hidden": true }, t(row.role === "user" ? "discovery.you" : "discovery.ai")), h("strong", null, t("discovery." + row.role))), raw || !MarkdownText ? h("pre", { className: "dsham_previewRaw" }, h(HighlightedText, { text: row.text, query: preview.target?.query })) : h(MarkdownText, { text: row.text, streaming: false, labels: { code: { copyLabel: t("discovery.copyCode"), copiedLabel: t("details.copied") }, footnotes: t("discovery.footnotes") } }), row.truncated && h("small", null, t("discovery.truncated")))),
        value.hasLater && h("p", null, t("discovery.later"))
      );
    }
    return { HighlightedText, useSessionDetails, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent };
  }
  var discoveryCss = ".dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr))}.dsham_settingsSearch{grid-column:1/-1;gap:8px;padding:0 8px;height:36px}.dsham_searchScope{flex:none;width:112px;border-right:1px solid var(--dsw-alias-border-l2);padding-right:4px}.dsham_searchScope .dsham_selectTrigger{min-height:26px;padding:0 4px;border:0;border-radius:4px;background:transparent;font-size:12px}.dsham_searchScope .dsham_selectMenu{width:144px;right:auto;top:calc(100% + 8px)}.dsham_dateFilter{position:relative;flex:none;color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_dateFilter summary{display:flex;align-items:center;gap:5px;list-style:none;cursor:pointer;padding:5px 2px 5px 8px;border-left:1px solid var(--dsw-alias-border-l2);white-space:nowrap}.dsham_dateFilter summary::-webkit-details-marker{display:none}.dsham_dateFilter summary[data-active=true]{color:var(--dsw-alias-state-business-primary)}.dsham_datePanel{position:absolute;right:0;top:calc(100% + 8px);z-index:35;display:grid;gap:12px;width:240px;box-sizing:border-box;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-shadow-lv3)}.dsham_datePanel label{display:grid;gap:6px}.dsham_settingsSearch .dsham_datePanel input{box-sizing:border-box;max-width:100%;min-width:0;height:32px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit}.dsham_datePanel p{margin:0}.dsham_searchScope:focus-visible,.dsham_dateFilter summary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsham_discoveryStatus{font-size:12px;margin-bottom:12px;overflow-wrap:anywhere}.dsham_settingsSnippet{display:block;width:100%;padding:0;margin:4px 0 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.dsham_previewDialog[role=dialog]{width:min(900px,calc(100vw - 48px));max-height:calc(100dvh - 48px);gap:12px}.dsham_previewDialogContent{min-height:0;overflow:auto}.dsham_previewMessages{max-height:65vh;overflow:auto;overflow-wrap:anywhere;padding-right:8px}.dsham_previewToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_previewModes{display:flex;gap:4px}.dsham_previewModes button{padding:5px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer;white-space:nowrap}.dsham_previewModes button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}.dsham_previewRole{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px}.dsham_previewRole>span{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--dsw-alias-bg-layer-3);font-size:11px}.dsham_previewRole[data-role=user]>span{color:var(--dsw-alias-state-business-primary)}.dsham_previewRaw{white-space:pre-wrap;font:13px/1.8 ui-monospace,monospace;overflow-wrap:anywhere}.dsham_previewMessage pre:not(.dsham_previewRaw){white-space:pre;overflow-x:auto;max-width:100%}.dsham_previewMessage table{display:block;max-width:100%;overflow-x:auto}.dsham_previewMessage img{max-width:100%}@media(max-width:520px){.dsham_previewDialog[role=dialog]{width:calc(100vw - 32px)}.dsham_previewToolbar{align-items:flex-start;flex-wrap:wrap}}.dsham_previewMessage{padding:18px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_previewMessage p{font-size:14px;line-height:1.8}.dsham_previewHint,.dsham_previewMessage small{color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_settings mark,.dsham_previewMessages mark{background:var(--dsw-alias-state-warn-tertiary);color:inherit;border-radius:2px}.dsham_settingsSnippet:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}";
  var discoveryZh = {
    "common.separator": "\uFF1A",
    "details.notReturned": "\u5BBF\u4E3B\u672A\u8FD4\u56DE\u4F1A\u8BDD\u8BE6\u60C5",
    "copy.empty": "\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9",
    "copy.unavailable": "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u526A\u8D34\u677F\uFF0C\u8BF7\u5728 HTTPS \u6216\u672C\u673A\u5730\u5740\u4E2D\u6253\u5F00\u9875\u9762",
    "copy.denied": "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u5141\u8BB8\u6D4F\u89C8\u5668\u8BBF\u95EE\u526A\u8D34\u677F\u540E\u91CD\u8BD5",
    "discovery.you": "\u4F60",
    "discovery.ai": "AI",
    "discovery.readOnly": "\u53EA\u8BFB\u9884\u89C8",
    "discovery.messageCount": "\u672C\u6B21\u663E\u793A {n} \u6761\u6D88\u606F",
    "discovery.displayMode": "\u663E\u793A\u65B9\u5F0F",
    "discovery.formatted": "\u6392\u7248",
    "discovery.raw": "\u539F\u6587\u4E0E\u9AD8\u4EAE",
    "discovery.copyCode": "\u590D\u5236\u4EE3\u7801",
    "discovery.footnotes": "\u6CE8\u91CA",
    "details.turns": "{n} \u8F6E",
    "details.unknown": "\u8F6E\u6B21\u672A\u77E5",
    "details.pending": "\u8F6E\u6B21\u8BFB\u53D6\u4E2D",
    "details.hint": "\u6309\u7528\u6237\u63D0\u4EA4\u6D88\u606F\u6570\u7EDF\u8BA1\uFF0C\u4E0D\u542B\u5DE5\u5177\u8C03\u7528\u548C\u63D2\u4EF6\u6CE8\u5165",
    "details.more": "\u8F6E\u6B21\u6700\u591A",
    "details.less": "\u8F6E\u6B21\u6700\u5C11",
    "details.failed": "{n} \u6761\u4F1A\u8BDD\u8BE6\u60C5\u8BFB\u53D6\u5931\u8D25",
    "details.copyId": "\u590D\u5236\u4F1A\u8BDD ID",
    "details.copyPath": "\u590D\u5236\u4F1A\u8BDD\u8DEF\u5F84",
    "details.copied": "\u5DF2\u590D\u5236",
    "details.noPath": "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u53EF\u590D\u5236\u7684\u4F1A\u8BDD\u8DEF\u5F84",
    "discovery.date": "\u65E5\u671F",
    "discovery.dateActive": "\u65E5\u671F\xB7\u5DF2\u9009",
    "discovery.clearDate": "\u6E05\u9664\u65E5\u671F",
    "discovery.active": "\u5DF2\u542F\u7528",
    "discovery.scope": "\u67E5\u627E\u8303\u56F4",
    "discovery.titleOnly": "\u4EC5\u6807\u9898",
    "discovery.titleAndContent": "\u6807\u9898\u4E0E\u6B63\u6587",
    "discovery.from": "\u66F4\u65B0\u65F6\u95F4\u4ECE",
    "discovery.to": "\u81F3",
    "discovery.clear": "\u6E05\u9664\u6761\u4EF6",
    "discovery.invalidDate": "\u5F00\u59CB\u65E5\u671F\u4E0D\u80FD\u665A\u4E8E\u7ED3\u675F\u65E5\u671F\uFF0C\u8BF7\u68C0\u67E5\u65E5\u671F\u8303\u56F4\u3002",
    "discovery.searching": "\u6B63\u5728\u68C0\u7D22\u6B63\u6587\uFF1A{done} / {total}",
    "discovery.searched": "\u6B63\u6587\u68C0\u7D22\u5B8C\u6210\uFF1A{done} / {total}",
    "discovery.searchError": "\u6B63\u6587\u68C0\u7D22\u672A\u5B8C\u6210\uFF0C\u5F53\u524D\u7ED3\u679C\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002",
    "discovery.failed": "{n} \u6761\u4F1A\u8BDD\u8BFB\u53D6\u5931\u8D25",
    "discovery.retry": "\u91CD\u8BD5",
    "discovery.preview": "\u5FEB\u901F\u9884\u89C8",
    "discovery.loading": "\u6B63\u5728\u8BFB\u53D6\u4F1A\u8BDD\u2026",
    "discovery.previewHint": "\u53EA\u8BFB\u9884\u89C8\u539F\u59CB\u5BF9\u8BDD\u6587\u672C\uFF0C\u4E0D\u6062\u590D\u4F1A\u8BDD\uFF1B\u4E0D\u542B\u5DE5\u5177\u8F93\u51FA\u3001\u9644\u4EF6\u3001\u63A8\u7406\u548C\u7CFB\u7EDF\u5185\u5BB9\u3002",
    "discovery.earlier": "\u524D\u9762\u8FD8\u6709\u6D88\u606F\uFF0C\u53EF\u6253\u5F00\u5B8C\u6574\u4F1A\u8BDD\u67E5\u770B\u3002",
    "discovery.later": "\u540E\u9762\u8FD8\u6709\u6D88\u606F\uFF0C\u53EF\u6253\u5F00\u5B8C\u6574\u4F1A\u8BDD\u67E5\u770B\u3002",
    "discovery.empty": "\u6CA1\u6709\u53EF\u9884\u89C8\u7684\u7528\u6237\u6216\u52A9\u624B\u6587\u672C\u3002",
    "discovery.truncated": "\u672C\u6761\u4EC5\u663E\u793A\u90E8\u5206\u5185\u5BB9\u3002",
    "discovery.user": "\u7528\u6237",
    "discovery.assistant": "\u52A9\u624B",
    "discovery.openFull": "\u6253\u5F00\u5B8C\u6574\u4F1A\u8BDD",
    "discovery.searchPlaceholder": "\u641C\u7D22\u6807\u9898\u6216\u6B63\u6587"
  };
  var discoveryEn = {
    "common.separator": ": ",
    "details.notReturned": "The host did not return session details",
    "copy.empty": "Nothing to copy",
    "copy.unavailable": "Clipboard unavailable. Open the page over HTTPS or localhost.",
    "copy.denied": "Copy failed. Allow clipboard access and retry.",
    "discovery.you": "You",
    "discovery.ai": "AI",
    "discovery.readOnly": "Read-only preview",
    "discovery.messageCount": "Showing {n} messages",
    "discovery.displayMode": "Display mode",
    "discovery.formatted": "Formatted",
    "discovery.raw": "Source and highlights",
    "discovery.copyCode": "Copy code",
    "discovery.footnotes": "Footnotes",
    "details.turns": "{n} turns",
    "details.unknown": "Unknown turns",
    "details.pending": "Loading turns",
    "details.hint": "User submissions; excludes tool calls and injected messages",
    "details.more": "Most turns",
    "details.less": "Fewest turns",
    "details.failed": "Could not read turns for {n} sessions",
    "details.copyId": "Copy session ID",
    "details.copyPath": "Copy session path",
    "details.copied": "Copied",
    "details.noPath": "The host did not provide a session path",
    "discovery.date": "Date",
    "discovery.dateActive": "Date \xB7 Set",
    "discovery.clearDate": "Clear dates",
    "discovery.active": "Active",
    "discovery.scope": "Search in",
    "discovery.titleOnly": "Titles",
    "discovery.titleAndContent": "Titles and content",
    "discovery.from": "Updated from",
    "discovery.to": "To",
    "discovery.clear": "Clear filters",
    "discovery.invalidDate": "Check the date range: the start must not be after the end.",
    "discovery.searching": "Searching content: {done} / {total}",
    "discovery.searched": "Content search complete: {done} / {total}",
    "discovery.searchError": "Content search is incomplete; results may be missing.",
    "discovery.failed": "Could not read {n} conversations",
    "discovery.retry": "Retry",
    "discovery.preview": "Quick preview",
    "discovery.loading": "Reading conversation\u2026",
    "discovery.previewHint": "Read-only original conversation text; keeps the conversation archived. Excludes tools, attachments, reasoning and system content.",
    "discovery.earlier": "More messages before this preview. Open the full conversation to read them.",
    "discovery.later": "More messages after this preview. Open the full conversation to read them.",
    "discovery.empty": "No user or assistant text to preview.",
    "discovery.truncated": "Only part of this message is shown.",
    "discovery.user": "User",
    "discovery.assistant": "Assistant",
    "discovery.openFull": "Open full conversation",
    "discovery.searchPlaceholder": "Search titles or content"
  };

  // src/archive-experience.js
  var ArchiveNavigationError = class extends Error {
    constructor(code) {
      super(code);
      this.name = "ArchiveNavigationError";
      this.code = code;
    }
  };
  function formatArchiveNavigationError(error, t) {
    return error instanceof ArchiveNavigationError ? t(`archives.${error.code}`) : String(error?.message ?? error);
  }
  function retainInfoSnapshot(sessions, id2) {
    if (typeof sessions?.retainInfo !== "function") return;
    const source = sessions.retainInfo(id2);
    return typeof source?.getSnapshot === "function" ? source.getSnapshot() : source;
  }
  function mainViewSessionId(list) {
    const byId = list?.byId;
    if (byId === void 0) return;
    for (const session of Object.values(byId)) {
      if ((session?.retainedBy?.mainView ?? 0) > 0) return session.id;
    }
  }
  function currentSessionId(list) {
    return mainViewSessionId(list) ?? list?.current;
  }
  function sessionIsCurrent(list, id2, sessions) {
    if (id2 === void 0 || id2 === "") return false;
    if ((list?.byId?.[id2]?.retainedBy?.mainView ?? 0) > 0) return true;
    if ((retainInfoSnapshot(sessions, id2)?.retainedBy?.mainView ?? 0) > 0) return true;
    return list?.current === id2;
  }
  async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
    if (restore) {
      if (typeof actions.prepare === "function") await actions.prepare(sessionId);
      if (!isActive()) return;
      await actions.restore(sessionId);
    }
    if (isActive()) await actions.open(sessionId);
  }
  function allowArchivedNavigation(navigation, sessions, workspaces, { onOpened = () => {
  }, beginNavigation, warn = (...args) => console.warn(...args) } = {}) {
    let allowed;
    const original = navigation?.clearArchivedCurrent;
    const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
    const viewing = (id2) => sessionIsCurrent(sessions.list.getSnapshot(), id2, sessions);
    const wrapped = function(...args) {
      if (allowed !== void 0 && viewing(allowed) && workspaces.list.getSnapshot().archivedSessionIds.includes(allowed)) return false;
      allowed = void 0;
      return original.apply(this, args);
    };
    const ownsWrapper = () => navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent")?.value === wrapped;
    if (typeof original === "function") {
      try {
        navigation.clearArchivedCurrent = wrapped;
        if (!ownsWrapper()) throw new Error("\u5BFC\u822A\u65B9\u6CD5\u672A\u63A5\u7EB3\u5F52\u6863\u9002\u914D");
      } catch (error) {
        warn("archive-manager: \u65E0\u6CD5\u9002\u914D\u5F52\u6863\u5BFC\u822A\uFF0C\u8BF7\u6062\u590D\u4F1A\u8BDD\u540E\u6253\u5F00\u3002", error);
      }
    }
    return {
      open(id2) {
        allowed = id2;
        try {
          if (typeof original === "function" && !ownsWrapper() && workspaces.list.getSnapshot().archivedSessionIds.includes(id2)) {
            warn("archive-manager: \u5F52\u6863\u5BFC\u822A\u9002\u914D\u4E0D\u53EF\u7528\u6216\u5DF2\u88AB\u66FF\u6362\u3002");
            throw new ArchiveNavigationError("navigationUnavailable");
          }
          beginNavigation?.();
          if (typeof sessions.retain === "function" && typeof navigation?.openSession === "function") navigation.openSession(id2);
          else if (typeof sessions.open === "function") sessions.open(id2);
          else if (typeof navigation?.openSession === "function") navigation.openSession(id2);
          else {
            warn("archive-manager: \u5BBF\u4E3B\u672A\u63D0\u4F9B\u4F1A\u8BDD\u6253\u5F00\u63A5\u53E3\u3002");
            throw new ArchiveNavigationError("navigationUnavailable");
          }
          if (!viewing(id2)) {
            warn("archive-manager: \u5BBF\u4E3B\u672A\u4FDD\u7559\u76EE\u6807\u4F1A\u8BDD\u3002", { cleanupAvailable: typeof original === "function" });
            throw new ArchiveNavigationError("sessionNotRetained");
          }
          onOpened();
        } catch (error) {
          allowed = void 0;
          throw error;
        }
      },
      dispose() {
        allowed = void 0;
        if (!navigation || Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent")?.value !== wrapped) return;
        if (descriptor) Object.defineProperty(navigation, "clearArchivedCurrent", descriptor);
        else delete navigation.clearArchivedCurrent;
        original.call(navigation);
      }
    };
  }

  // src/directory-flow-slot.js
  function mirrorDirectoryFlow(ctx, target) {
    const source = "sidebar.workspaces.directoryFlow";
    return ctx.slots.inject(target, () => ctx.effect(() => {
      const mounted = /* @__PURE__ */ new Map();
      let registrant;
      const release = (entry, dispose) => {
        mounted.delete(entry);
        try {
          dispose();
        } catch (error) {
          console.error(`archive-manager: \u6E05\u7406\u76EE\u5F55\u955C\u50CF\u5931\u8D25 ${source} -> ${target}\uFF08${entry.registrant ?? "\u672A\u77E5\u6765\u6E90"}\uFF09`, error);
        }
      };
      const clearMounted = () => {
        for (const [entry, dispose] of mounted) release(entry, dispose);
      };
      const reconcile = () => {
        registrant = void 0;
        const entries = ctx.slots.entries(source);
        for (const [entry, dispose] of mounted) {
          if (!entries.includes(entry)) {
            release(entry, dispose);
          }
        }
        for (const entry of entries) {
          if (mounted.has(entry)) continue;
          if (Object.keys(entry.children ?? {}).length > 0) {
            console.warn("archive-manager: \u4E0D\u652F\u6301\u5E26\u5B50\u63D2\u69FD\u7684\u76EE\u5F55\u7EC4\u4EF6\uFF0C\u8BF7\u4F7F\u7528\u5B98\u65B9\u9996\u9875\u5165\u53E3");
            continue;
          }
          registrant = entry.registrant;
          mounted.set(entry, ctx.slots.register({
            ...entry.options,
            name: target,
            registrant: entry.registrant,
            inject: entry.inject,
            store: entry.store,
            locale: entry.locale
          }, entry.component));
        }
      };
      const unsubscribe = ctx.on("slots/changed", (key) => {
        if (key !== source) return;
        try {
          reconcile();
        } catch (error) {
          clearMounted();
          console.error(`archive-manager: \u540C\u6B65\u76EE\u5F55\u955C\u50CF\u5931\u8D25 ${source} -> ${target}\uFF08${registrant ?? "\u672A\u77E5\u6765\u6E90"}\uFF09\uFF1B\u8BF7\u4F7F\u7528\u5B98\u65B9\u9996\u9875\u5165\u53E3\uFF0C\u540E\u7EED\u6E90\u63D2\u69FD\u53D8\u5316\u65F6\u91CD\u8BD5`, error);
        }
      });
      try {
        reconcile();
      } catch (error) {
        unsubscribe();
        clearMounted();
        throw error;
      }
      return () => {
        unsubscribe();
        clearMounted();
      };
    }, "dsh-archive-manager: official directory flow"));
  }

  // src/plugin-update-ui.js
  var UPDATE_HEADER = "x-michengai-plugin-update";
  var STYLE_ID = "michengai-plugin-update-ui";
  var CSS = `
.mpi-version{margin-left:8px;color:var(--dsw-alias-label-tertiary,#9da1aa);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;letter-spacing:0;white-space:nowrap;vertical-align:baseline}.mpi-check{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);font:inherit;font-size:12px;font-weight:500;line-height:18px;white-space:nowrap;cursor:pointer}.mpi-check:hover{background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}.mpi-check:focus-visible,.mpi-action:focus-visible,.mpi-dialog-close:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f8cff);outline-offset:2px}.mpi-icon{display:inline-flex;flex:0 0 auto;width:16px;height:16px;align-items:center;justify-content:center;pointer-events:none}.mpi-icon svg{display:block;width:16px;height:16px}
.mpi-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.62)}.mpi-dialog{position:relative;box-sizing:border-box;width:min(680px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:14px;padding:22px;background:var(--dsw-alias-bg-layer-2,var(--dsw-specific-menu,#202124));color:var(--dsw-alias-label-primary,#fff);box-shadow:var(--dsw-shadow-lv3,0 16px 48px rgba(0,0,0,.24));font-family:inherit}.mpi-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.mpi-dialog h2{margin:0;font-size:18px;line-height:26px}.mpi-dialog-close{display:inline-flex;flex:0 0 28px;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);cursor:pointer}.mpi-dialog-close:hover{background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}.mpi-intro{margin:8px 0 18px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:13px;line-height:20px}.mpi-meta{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 18px;margin:0 0 16px;font-size:12px;line-height:18px}.mpi-meta dt{color:var(--dsw-alias-label-secondary,#c2c4ca)}.mpi-meta dd{margin:0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.mpi-status{margin:0 0 18px;border-radius:7px;padding:12px 14px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-interactive-bg-hover,#252527));font-size:13px;font-weight:600;line-height:20px}.mpi-status[data-kind=error]{color:var(--dsw-alias-state-error-primary,#ff6464)}.mpi-status[data-kind=success]{color:var(--dsw-alias-state-success-primary,#36d67a)}.mpi-manual{border-top:1px solid var(--dsw-alias-border-l2,#4b4d52);padding-top:16px}.mpi-manual h3{margin:0 0 6px;font-size:14px;line-height:20px}.mpi-manual p{margin:0 0 10px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:12px;line-height:18px}.mpi-command{display:flex;align-items:center;gap:8px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;padding:10px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-interactive-bg-hover,#252527))}.mpi-command code{min-width:0;flex:1;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:18px;white-space:nowrap}.mpi-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:18px}.mpi-actions-group{display:flex;gap:8px}.mpi-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;padding:6px 10px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}.mpi-action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#414247)}.mpi-action:disabled{cursor:not-allowed;opacity:.55}.mpi-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.mpi-action.mpi-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.mpi-progress{height:4px;margin-top:10px;overflow:hidden;border-radius:99px;background:var(--dsw-alias-border-l2,#4b4d52)}.mpi-progress::after{display:block;width:32%;height:100%;background:var(--dsw-alias-state-business-primary,#4f8cff);content:'';animation:mpi-wave 1.15s ease-in-out infinite}@keyframes mpi-wave{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@media(max-width:560px){.mpi-overlay{padding:10px}.mpi-dialog{max-height:calc(100vh - 20px);padding:16px}.mpi-actions{align-items:stretch}.mpi-actions-group{justify-content:flex-end;flex-wrap:wrap}.mpi-meta{grid-template-columns:1fr;gap:2px}.mpi-meta dd{margin-bottom:6px}}
`;
  var ZH = {
    check: "\u68C0\u67E5\u66F4\u65B0",
    update: "\u66F4\u65B0",
    close: "\u5173\u95ED",
    recheck: "\u91CD\u65B0\u68C0\u67E5",
    auto: "\u81EA\u52A8\u66F4\u65B0",
    updating: "\u6B63\u5728\u66F4\u65B0\u2026",
    copy: "\u590D\u5236\u547D\u4EE4",
    copied: "\u5DF2\u590D\u5236",
    copyFailed: "\u590D\u5236\u5931\u8D25",
    checking: "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026",
    latest: "\u5DF2\u662F\u6700\u65B0\u7248\u672C",
    found: "\u53D1\u73B0\u65B0\u7248\u672C",
    failed: "\u68C0\u67E5\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
    current: "\u8FD0\u884C\u7248\u672C",
    latestLabel: "\u6700\u65B0\u7248\u672C",
    profile: "\u76EE\u6807 profile",
    unknown: "\u672A\u77E5",
    manual: "\u624B\u5DE5\u66F4\u65B0",
    manualHint: "\u81EA\u52A8\u66F4\u65B0\u5931\u8D25\u65F6\uFF0C\u53EF\u5728\u5F53\u524D DSH \u7EC8\u7AEF\u6267\u884C\u4EE5\u4E0B\u547D\u4EE4\uFF0C\u5B8C\u6210\u540E\u91CD\u542F DSH Web\u3002",
    intro: "\u4EC5\u68C0\u67E5\u5E76\u66F4\u65B0\u5F53\u524D\u63D2\u4EF6\uFF0C\u4E0D\u4F1A\u8054\u52A8\u5B89\u88C5\u5176\u4ED6\u63D2\u4EF6\u3002",
    restart: "\u66F4\u65B0\u5B8C\u6210\uFF0C\u8BF7\u91CD\u542F DSH Web\u3002",
    restarting: "\u66F4\u65B0\u5B8C\u6210\uFF0C\u6B63\u5728\u91CD\u542F DSH Desktop\u2026",
    unavailable: "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u624B\u5DE5\u66F4\u65B0\u547D\u4EE4\u3002"
  };
  var EN = {
    check: "Check for updates",
    update: "Update",
    close: "Close",
    recheck: "Check again",
    auto: "Update automatically",
    updating: "Updating\u2026",
    copy: "Copy command",
    copied: "Copied",
    copyFailed: "Copy failed",
    checking: "Checking for updates\u2026",
    latest: "You are up to date",
    found: "New version available",
    failed: "Could not check for updates. Try again later.",
    current: "Running version",
    latestLabel: "Latest version",
    profile: "Target profile",
    unknown: "Unknown",
    manual: "Manual update",
    manualHint: "If automatic update fails, run this command in the current DSH terminal, then restart DSH Web.",
    intro: "Only this plugin is checked and updated. Other plugins are not changed.",
    restart: "Update complete. Restart DSH Web.",
    restarting: "Update complete. Restarting DSH Desktop\u2026",
    unavailable: "Automatic update is unavailable. Use the manual command."
  };
  function strings(language) {
    if (language === "en") return EN;
    if (language === "zh") return ZH;
    const lang = document.documentElement.lang.toLowerCase();
    const settings = document.querySelector('[role="dialog"]')?.textContent ?? "";
    return lang.startsWith("en") || settings.includes("Settings") && !settings.includes("\u8BBE\u7F6E") ? EN : ZH;
  }
  function ensureStyle() {
    if (document.getElementById(STYLE_ID) !== null) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head ?? document.documentElement).append(style);
  }
  function validPayload(value) {
    if (value === null || typeof value !== "object") return false;
    const item = value;
    return typeof item.packageName === "string" && typeof item.currentVersion === "string" && typeof item.updateAvailable === "boolean" && typeof item.profileName === "string" && typeof item.canAutoUpdate === "boolean" && typeof item.latestCheckFailed === "boolean" && (item.latestVersion === void 0 || typeof item.latestVersion === "string");
  }
  async function requestStatus(endpoint, method, signal) {
    const signalOption = signal === void 0 ? {} : { signal };
    const response = await fetch(endpoint, method === "GET" ? { cache: "no-store", ...signalOption } : {
      method: "POST",
      headers: { "content-type": "application/json", [UPDATE_HEADER]: "1" },
      body: "{}",
      ...signalOption
    });
    const value = await response.json();
    if (!response.ok || !validPayload(value)) throw new Error(typeof value.error === "string" ? value.error : strings().failed);
    return value;
  }
  function manualPluginUpdateCommand(profileName, packageName, version) {
    const profile = profileName.trim() === "" ? "" : ` --profile ${profileName.trim()}`;
    return `dsh plugin${profile} add ${packageName}@${version} --registry=https://registry.npmjs.org/`;
  }
  function handlePluginUpdateEscape(event, close) {
    if (event.key !== "Escape") return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    close();
    return true;
  }
  function observePluginUpdate(options) {
    if (typeof document === "undefined" || document.body === null) return () => {
    };
    ensureStyle();
    const getStrings = () => strings(options.getLanguage?.());
    const controller = new AbortController();
    let payload;
    let overlay;
    let frame;
    const setButtonContent = (button, label, iconName) => {
      const icon = options.createIcon(iconName);
      icon.classList.add("mpi-icon");
      icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.dataset.mpiLabel = "";
      text.textContent = label;
      button.replaceChildren(icon, text);
    };
    const setButtonLabel = (button, label) => {
      const text = button.querySelector("[data-mpi-label]");
      if (text === null) button.textContent = label;
      else text.textContent = label;
    };
    const applyControls = () => {
      const row = document.querySelector(options.titleRowSelector);
      if (row === null) return;
      const heading = row.querySelector("h1,h2");
      if (heading !== null && payload !== void 0) {
        let version = heading.querySelector(`.mpi-version[data-package="${options.packageName}"]`);
        if (version === null) {
          version = document.createElement("span");
          version.className = "mpi-version";
          version.dataset.package = options.packageName;
          heading.append(version);
        }
        const versionLabel = `v${payload.currentVersion}`;
        if (version.textContent !== versionLabel) version.textContent = versionLabel;
      }
      const links = row.querySelector(options.linksSelector);
      if (links === null) return;
      const existing = links.querySelector(`[data-mpi-check="${options.packageName}"]`);
      if (existing !== null) {
        const label = getStrings().check;
        if (existing.querySelector("[data-mpi-label]")?.textContent !== label) setButtonLabel(existing, label);
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mpi-check";
      button.dataset.mpiCheck = options.packageName;
      setButtonContent(button, getStrings().check, "refresh");
      button.addEventListener("click", openDialog);
      links.append(button);
    };
    const load = async () => {
      payload = await requestStatus(options.endpoint, "GET", controller.signal);
      applyControls();
      return payload;
    };
    const closeDialog = () => {
      overlay?.remove();
      overlay = void 0;
    };
    function openDialog() {
      closeDialog();
      const text = getStrings();
      overlay = document.createElement("div");
      overlay.className = "mpi-overlay";
      const dialog = document.createElement("section");
      dialog.className = "mpi-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.innerHTML = `<header class="mpi-head"><h2></h2><button type="button" class="mpi-dialog-close" data-action="close"></button></header><p class="mpi-intro"></p><dl class="mpi-meta"><dt></dt><dd data-role="current"></dd><dt></dt><dd data-role="latest"></dd><dt></dt><dd data-role="profile"></dd></dl><div class="mpi-status" role="status"></div><div class="mpi-progress" hidden></div><section class="mpi-manual"><h3></h3><p></p><div class="mpi-command"><code></code><button type="button" class="mpi-action" data-action="copy"></button></div></section><footer class="mpi-actions"><div class="mpi-actions-group"><button type="button" class="mpi-action" data-action="check"></button><button type="button" class="mpi-action mpi-primary" data-action="update"></button></div></footer>`;
      const name = text === EN ? options.enName : options.zhName;
      dialog.querySelector("h2").textContent = `${name} ${text.update}`;
      dialog.querySelector(".mpi-intro").textContent = text.intro;
      const terms = dialog.querySelectorAll("dt");
      terms[0].textContent = text.current;
      terms[1].textContent = text.latestLabel;
      terms[2].textContent = text.profile;
      dialog.querySelector(".mpi-manual h3").textContent = text.manual;
      dialog.querySelector(".mpi-manual p").textContent = text.manualHint;
      const status = dialog.querySelector(".mpi-status");
      const progress = dialog.querySelector(".mpi-progress");
      const command = dialog.querySelector(".mpi-command code");
      const close = dialog.querySelector("[data-action=close]");
      const check = dialog.querySelector("[data-action=check]");
      const update = dialog.querySelector("[data-action=update]");
      const copy = dialog.querySelector("[data-action=copy]");
      setButtonContent(close, text.close, "close");
      close.querySelector("[data-mpi-label]")?.remove();
      close.setAttribute("aria-label", text.close);
      close.title = text.close;
      setButtonContent(check, text.recheck, "refresh");
      setButtonContent(update, text.auto, "download");
      setButtonContent(copy, text.copy, "copy");
      let busy = false;
      const setMessage = (message, kind = "") => {
        status.textContent = message;
        status.dataset.kind = kind;
      };
      const setBusy = (value) => {
        busy = value;
        check.disabled = value;
        copy.disabled = value;
        update.disabled = value || payload?.canAutoUpdate !== true || payload.updateAvailable !== true;
        progress.hidden = !value;
      };
      const render = () => {
        dialog.querySelector("[data-role=current]").textContent = payload === void 0 ? text.unknown : `v${payload.currentVersion}`;
        dialog.querySelector("[data-role=latest]").textContent = payload?.latestVersion === void 0 ? text.unknown : `v${payload.latestVersion}`;
        dialog.querySelector("[data-role=profile]").textContent = payload?.profileName ?? text.unknown;
        command.textContent = manualPluginUpdateCommand(payload?.profileName ?? "", options.packageName, payload?.latestVersion ?? "latest");
        update.disabled = busy || payload?.canAutoUpdate !== true || payload.updateAvailable !== true;
        if (payload === void 0) setMessage(text.checking);
        else if (payload.latestCheckFailed) setMessage(text.failed, "error");
        else if (payload.updateAvailable) setMessage(`${text.found}: v${payload.latestVersion ?? text.unknown}`);
        else setMessage(text.latest, "success");
        if (payload !== void 0 && !payload.canAutoUpdate && payload.updateAvailable) setMessage(text.unavailable);
      };
      const checkNow = async () => {
        if (busy) return;
        setBusy(true);
        setMessage(text.checking);
        try {
          await load();
          setBusy(false);
          render();
        } catch (error) {
          setBusy(false);
          setMessage(error instanceof Error ? error.message : text.failed, "error");
        }
      };
      const updateNow = async () => {
        if (busy) return;
        setBusy(true);
        setButtonLabel(update, text.updating);
        setMessage(text.updating);
        try {
          payload = await requestStatus(options.endpoint, "POST", controller.signal);
          applyControls();
          render();
          setMessage(payload.autoReload === true ? text.restarting : text.restart, "success");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : text.failed, "error");
        } finally {
          setButtonLabel(update, text.auto);
          setBusy(false);
        }
      };
      close.addEventListener("click", closeDialog);
      check.addEventListener("click", () => {
        void checkNow();
      });
      update.addEventListener("click", () => {
        void updateNow();
      });
      copy.addEventListener("click", () => {
        void navigator.clipboard?.writeText(command.textContent ?? "").then(() => {
          setButtonLabel(copy, text.copied);
          setTimeout(() => {
            setButtonLabel(copy, text.copy);
          }, 1400);
        }).catch(() => {
          setButtonLabel(copy, text.copyFailed);
        });
      });
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeDialog();
      });
      overlay.addEventListener("keydown", (event) => {
        handlePluginUpdateEscape(event, closeDialog);
      }, true);
      overlay.append(dialog);
      document.body.append(overlay);
      render();
      close.focus();
      void checkNow();
    }
    const observer = new MutationObserver(() => {
      if (frame !== void 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = void 0;
        applyControls();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    applyControls();
    void load().catch(() => {
    });
    return () => {
      controller.abort();
      observer.disconnect();
      closeDialog();
      if (frame !== void 0) window.cancelAnimationFrame(frame);
      document.querySelectorAll(`[data-mpi-check="${options.packageName}"],.mpi-version[data-package="${options.packageName}"]`).forEach((node) => node.remove());
    };
  }

  // src/archive-organizer.js
  function checkedId(value) {
    if (typeof value !== "string" || value.length === 0 || value.length > 1024) throw new TypeError("\u4F1A\u8BDD ID \u957F\u5EA6\u987B\u4E3A 1\uFF5E1024 \u4E2A\u5B57\u7B26");
    return value;
  }
  var favoriteInputSchema = {
    parse(value) {
      if (!value || typeof value !== "object" || typeof value.favorite !== "boolean") throw new TypeError("\u6536\u85CF\u72B6\u6001\u5FC5\u987B\u4E3A\u5E03\u5C14\u503C");
      return { sessionId: checkedId(value.sessionId), favorite: value.favorite };
    }
  };
  var favoriteStateSchema = {
    parse(value) {
      if (!value || !Array.isArray(value.favoriteSessionIds) || value.favoriteSessionIds.length > 1e5) throw new TypeError("\u6536\u85CF\u96C6\u5408\u65E0\u6548");
      return { favoriteSessionIds: [...new Set(value.favoriteSessionIds.map(checkedId))] };
    },
    safeParse(value) {
      try {
        return { success: true, data: this.parse(value) };
      } catch (error) {
        return { success: false, error };
      }
    }
  };
  function favoriteInvocations() {
    const codec = (name, schema) => ({ mode: "strict", typeSymbol: `@michengai/dsh-archive-manager/types#${name}`, create: () => schema, schema });
    return ["favoriteSessions", "setSessionFavorite"].map((method) => ({
      id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`,
      service: "workspaceRegistry",
      namespace: "workspaceRegistry",
      method,
      invocation: { kind: "direct" },
      parameters: method === "favoriteSessions" ? [] : [{ name: "input", wire: "input", source: "json", codec: codec("FavoriteInput", favoriteInputSchema) }],
      result: codec("FavoriteState", favoriteStateSchema),
      sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
    }));
  }
  function idleArchiveCandidate(session, { days, now = Date.now(), favorites = /* @__PURE__ */ new Set(), currentId, pending = /* @__PURE__ */ new Map() }) {
    if (!session || !Number.isInteger(days) || days < 1 || days > 36500) return false;
    if (favorites.has(session.id) || session.id === currentId || session.retainedBy?.mainView > 0) return false;
    if (session.running || session.runningSubagentCount > 0 || session.pendingInteraction != null || pending.has(session.id)) return false;
    const updated = typeof session.updatedAt === "number" ? session.updatedAt : Date.parse(session.updatedAt);
    return Number.isFinite(updated) && updated <= now - days * 864e5;
  }
  async function runSessionBatch(ids, operate, { onProgress, refresh } = {}) {
    const requested = [...new Set(ids.map(checkedId))];
    const result = { requested, succeeded: [], skipped: [], failures: [], unprocessed: [], remaining: [], refreshError: null };
    const report = () => onProgress?.({ total: requested.length, done: result.succeeded.length + result.skipped.length + result.failures.length, succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length });
    report();
    for (const [index, id2] of requested.entries()) {
      try {
        (await operate(id2) ? result.succeeded : result.skipped).push(id2);
      } catch (error) {
        result.failures.push({ sessionId: id2, message: error instanceof Error ? error.message : String(error) });
        result.unprocessed = requested.slice(index + 1);
        result.remaining = requested.slice(index);
        report();
        break;
      }
      report();
    }
    try {
      await refresh?.();
    } catch (error) {
      result.refreshError = error instanceof Error ? error.message : String(error);
    }
    return result;
  }
  function createSessionOrganizer({ workspaces, sessions, archive, restore, deleteOne, getFavorites, refresh, currentSessionId: currentSessionId2 }) {
    return async (kind, ids, options = {}) => {
      if (!["archive", "restore", "undo", "delete"].includes(kind)) throw new TypeError("\u672A\u77E5\u6279\u91CF\u64CD\u4F5C");
      return runSessionBatch(ids, async (id2) => {
        const before = workspaces.getSnapshot();
        const archived = before.archivedSessionIds.includes(id2);
        if (kind === "archive") {
          if (archived) return false;
          const snapshot = sessions.getSnapshot();
          const session = snapshot.byId[id2];
          if (!session) return false;
          if (options.idleDays !== void 0) {
            const favorites = new Set((await getFavorites()).favoriteSessionIds);
            const latest = sessions.getSnapshot();
            if (!idleArchiveCandidate(latest.byId[id2], { days: options.idleDays, favorites, currentId: currentSessionId2(latest), pending: options.getPending?.() ?? options.pending })) return false;
          }
          await archive(id2);
          return workspaces.getSnapshot().archivedSessionIds.includes(id2);
        }
        if (!archived) return false;
        if (kind === "delete") {
          await deleteOne(id2);
          return true;
        }
        const value = await restore(id2);
        const remaining = value?.archivedSessionIds ?? workspaces.getSnapshot().archivedSessionIds;
        return !remaining.includes(id2);
      }, { onProgress: options.onProgress, refresh });
    };
  }

  // src/archive-organizer-ui.js
  function createOrganizerPanel(React) {
    const h = React.createElement;
    return function OrganizerPanel({ t, archived, busy, ready, days, onDays, count, onPreview, progress, result, onRetry, undoCount, onUndo, onReload }) {
      return h(
        React.Fragment,
        null,
        h("style", null, ".dsham_organizer,.dsham_batchFeedback{display:grid;gap:12px;margin:0 0 16px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px}.dsham_organizerControls{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.dsham_organizer label{display:inline-flex;align-items:center;gap:6px}.dsham_organizer input[type=number]{width:76px;padding:5px;color:inherit;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:5px}.dsham_organizer p,.dsham_batchFeedback p{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsham_batchFeedback progress{width:100%}.dsham_batchFeedback details{font-size:12px;overflow-wrap:anywhere}.dsham_archivePreview{max-height:260px;overflow:auto;display:grid;gap:8px;padding:8px 0}.dsham_archivePreview label{display:flex;gap:8px;align-items:center;overflow-wrap:anywhere}"),
        (!archived || !ready) && h(
          "div",
          { className: "dsham_organizer" },
          h(
            "div",
            { className: "dsham_organizerControls" },
            !ready && h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onReload }, t("organizer.reloadFavorites")),
            !archived && h(
              React.Fragment,
              null,
              h("label", null, t("organizer.idleDays"), h("input", { type: "number", min: 1, max: 36500, step: 1, value: days, disabled: busy, onChange: (event) => onDays(event.target.value), "aria-label": t("organizer.idleDays") })),
              h("button", { type: "button", className: "dsham_settingsAction", disabled: busy || !ready || count === 0, onClick: onPreview }, t("organizer.preview", { n: count }))
            )
          ),
          !archived && h("p", null, t("organizer.rules"))
        ),
        (progress || result || undoCount > 0) && h(
          "section",
          { className: "dsham_batchFeedback", "aria-label": t("organizer.feedback") },
          progress && h(
            "div",
            { role: "status", "aria-live": "polite" },
            h("progress", { value: progress.done, max: Math.max(1, progress.total), "aria-label": t("organizer.progress") }),
            t("organizer.progressCount", { done: progress.done, total: progress.total })
          ),
          result && h(
            "div",
            { role: "status" },
            h("strong", null, t(`organizer.${result.kind ?? "archive"}Result`)),
            h("p", null, t("organizer.result", { succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length, remaining: result.unprocessed.length })),
            result.failures.length > 0 && h("details", null, h("summary", null, t("organizer.failureDetails")), h("ul", null, result.failures.map((failure) => h("li", { key: failure.sessionId }, failure.sessionId, t("common.separator"), failure.message)))),
            result.refreshError && h("p", { role: "alert" }, t("organizer.refreshError", { detail: result.refreshError })),
            result.remaining.length > 0 && h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onRetry }, t("organizer.retry", { n: result.remaining.length }))
          ),
          undoCount > 0 && h(
            "div",
            { className: "dsham_organizerControls" },
            h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onUndo }, t("organizer.undo", { n: undoCount })),
            h("p", null, t("organizer.undoHint"))
          )
        )
      );
    };
  }
  var organizerZh = {
    "organizer.feedback": "\u64CD\u4F5C\u53CD\u9988",
    "organizer.allSessions": "\u5168\u90E8\u4F1A\u8BDD",
    "organizer.favoriteFilter": "\u6536\u85CF\u7B5B\u9009",
    "organizer.archiveResult": "\u5F52\u6863\u7ED3\u679C",
    "organizer.restoreResult": "\u6062\u590D\u7ED3\u679C",
    "organizer.deleteResult": "\u5220\u9664\u7ED3\u679C",
    "organizer.undoResult": "\u64A4\u56DE\u7ED3\u679C",
    "organizer.favorite": "\u6536\u85CF",
    "organizer.unfavorite": "\u53D6\u6D88\u6536\u85CF",
    "organizer.favoritesOnly": "\u53EA\u770B\u6536\u85CF",
    "organizer.reloadFavorites": "\u91CD\u65B0\u52A0\u8F7D\u6536\u85CF",
    "organizer.idleDays": "\u95F2\u7F6E\u5929\u6570",
    "organizer.preview": "\u9884\u89C8\u95F2\u7F6E\u5F52\u6863\uFF08{n}\uFF09",
    "organizer.rules": "\u6309\u6700\u540E\u6D3B\u52A8\u65F6\u95F4\u7B5B\u9009\uFF0C\u9075\u5FAA\u5F53\u524D\u5217\u8868\u7B5B\u9009\u6761\u4EF6\uFF1B\u6392\u9664\u6536\u85CF\u3001\u5F53\u524D\u6253\u5F00\u3001\u6B63\u5728\u6267\u884C\u53CA\u7B49\u5F85\u4EA4\u4E92\u7684\u4F1A\u8BDD\u3002",
    "organizer.progress": "\u6279\u91CF\u64CD\u4F5C\u8FDB\u5EA6",
    "organizer.progressCount": "\u5DF2\u5904\u7406 {done} / {total}",
    "organizer.result": "\u6210\u529F {succeeded} \xB7 \u8DF3\u8FC7 {skipped} \xB7 \u5931\u8D25 {failed} \xB7 \u672A\u5904\u7406 {remaining}",
    "organizer.failureDetails": "\u67E5\u770B\u5931\u8D25\u8BE6\u60C5",
    "organizer.refreshError": "\u64CD\u4F5C\u7ED3\u679C\u5DF2\u4FDD\u7559\uFF0C\u4F46\u5217\u8868\u5237\u65B0\u5931\u8D25\uFF1A{detail}",
    "organizer.retry": "\u91CD\u8BD5\u5269\u4F59 {n} \u6761",
    "organizer.undo": "\u64A4\u56DE\u672C\u6B21\u5F52\u6863\uFF08{n}\uFF09",
    "organizer.undoHint": "\u4EC5\u4FDD\u7559\u672C\u6B21\u6253\u5F00\u7BA1\u7406\u9875\u671F\u95F4\u6700\u8FD1\u4E00\u6279\u5F52\u6863\uFF1B\u5173\u95ED\u9875\u9762\u6216\u5237\u65B0\u540E\u6E05\u9664\u3002\u64A4\u56DE\u4E0D\u4F1A\u6062\u590D\u5DF2\u5220\u9664\u7684\u4F1A\u8BDD\u3002",
    "organizer.idleConfirm": "\u8BF7\u68C0\u67E5\u4EE5\u4E0B\u5019\u9009\uFF0C\u53EF\u53D6\u6D88\u52FE\u9009\uFF1B\u6267\u884C\u524D\u518D\u6B21\u6392\u9664\u6536\u85CF\u53CA\u6D3B\u8DC3\u4F1A\u8BDD\u3002",
    "organizer.manualConfirm": "\u4EC5\u5F52\u6863\u4EE5\u4E0B\u52FE\u9009\u4F1A\u8BDD\uFF1B\u53EF\u9010\u6761\u53D6\u6D88\u3002\u5F52\u6863\u540E\u53EF\u64A4\u56DE\u672C\u6279\u64CD\u4F5C\u3002"
  };
  var organizerEn = {
    "organizer.feedback": "Operation feedback",
    "organizer.allSessions": "All sessions",
    "organizer.favoriteFilter": "Favorites filter",
    "organizer.archiveResult": "Archive results",
    "organizer.restoreResult": "Restore results",
    "organizer.deleteResult": "Delete results",
    "organizer.undoResult": "Undo results",
    "organizer.favorite": "Favorite",
    "organizer.unfavorite": "Unfavorite",
    "organizer.favoritesOnly": "Favorites only",
    "organizer.reloadFavorites": "Reload favorites",
    "organizer.idleDays": "Idle days",
    "organizer.preview": "Preview idle archives ({n})",
    "organizer.rules": "Uses last activity, the current list filters. Excludes favorites, open, running and waiting sessions.",
    "organizer.progress": "Batch progress",
    "organizer.progressCount": "Processed {done} / {total}",
    "organizer.result": "Succeeded {succeeded} \xB7 Skipped {skipped} \xB7 Failed {failed} \xB7 Unprocessed {remaining}",
    "organizer.failureDetails": "Failure details",
    "organizer.refreshError": "Results retained, but refresh failed: {detail}",
    "organizer.retry": "Retry remaining {n}",
    "organizer.undo": "Undo this archive batch ({n})",
    "organizer.undoHint": "Only the latest archive batch while this page is open is retained. Closing or refreshing clears undo. Deleted sessions cannot be restored.",
    "organizer.idleConfirm": "Review and deselect candidates. Favorites and active sessions are checked again before archiving.",
    "organizer.manualConfirm": "Only checked sessions below will be archived. You can undo this batch afterward."
  };

  // src/client.js
  window.__ModuleLoader__.load({
    id: "@michengai/dsh-archive-manager",
    factory: (require2) => {
      var module = { exports: {} };
      var exports = module.exports;
      Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
      let _deepseek_ai_dsh_client_store;
      let hasSplitClientStore = true;
      try {
        _deepseek_ai_dsh_client_store = require2("@deepseek-ai/dsh-client-store");
      } catch {
        hasSplitClientStore = false;
        _deepseek_ai_dsh_client_store = require2("@deepseek-ai/dsh-client-runtime/client");
      }
      let react_jsx_runtime = require2("react/jsx-runtime");
      let react = require2("react");
      const OrganizerPanel = createOrganizerPanel(react);
      const { HighlightedText, useSessionDetails, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent } = createDiscoveryTools(react);
      let _deepseek_ai_dsh_client_ui_primitives = require2("@deepseek-ai/dsh-client-ui-primitives");
      const SessionHealthPanel = createSessionHealthPanel(react, { warning: _deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, info: _deepseek_ai_dsh_client_ui_primitives.IconInfoOutline14, check: _deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, refresh: _deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, search: _deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, chevron: _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14 });
      const UPDATE_ICON_PATHS = {
        refresh: ["M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1A5.5 5.5 0 1 0 13.2 12"],
        download: ["M8 2v8m0 0 3-3m-3 3-3-3M3 13v2h10v-2"],
        copy: ["M5 5h8v8H5z", "M3 3h8"],
        close: ["m4 4 8 8M12 4 4 12"]
      };
      function createPluginUpdateIcon(name) {
        const element = document.createElement("span");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "1.5");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");
        for (const d of UPDATE_ICON_PATHS[name]) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", d);
          svg.append(path);
        }
        element.append(svg);
        return element;
      }
      const sessionIdSchema = {
        parse(value) {
          if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
          return value;
        }
      };
      const archivedSetSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          const ids = value.archivedSessionIds;
          if (!Array.isArray(ids) || ids.some((id2) => typeof id2 !== "string")) throw new TypeError("archivedSessionIds must be a string array");
          return value;
        }
      };
      const deletedSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
          return value;
        }
      };
      const archivedBatchTargetSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
          if (value.scope === "all" || value.scope === "ungrouped") return value;
          if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
          if (value.scope === "sessions" && Array.isArray(value.sessionIds) && value.sessionIds.length > 0 && value.sessionIds.every((id2) => typeof id2 === "string" && id2.length > 0)) return value;
          throw new TypeError("target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds");
        }
      };
      const deletedBatchSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
            if (!Array.isArray(value[key]) || value[key].some((id2) => typeof id2 !== "string")) throw new TypeError(`${key} must be a string array`);
          }
          if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
          return value;
        }
      };
      const archivedSessionMetadataSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
          if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
          if (value.repairedSessionIds !== void 0 && (!Array.isArray(value.repairedSessionIds) || value.repairedSessionIds.some((id2) => typeof id2 !== "string"))) throw new TypeError("repairedSessionIds must be a string array");
          return value;
        }
      };
      function strictCodec(typeSymbol, schema) {
        return { mode: "strict", typeSymbol, create: () => schema, schema };
      }
      const ARCHIVE_MANAGER_REMOTE = {
        package: "@michengai/dsh-archive-manager",
        descriptors: [
          ...favoriteInvocations(),
          ...discoveryInvocations(),
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "unarchiveSession",
            invocation: { kind: "direct" },
            parameters: [{
              name: "sessionId",
              wire: "sessionId",
              source: "json",
              codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
            }],
            result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionIds", archivedSetSchema),
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "deleteSession",
            invocation: { kind: "direct" },
            parameters: [{
              name: "sessionId",
              wire: "sessionId",
              source: "json",
              codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
            }],
            result: strictCodec("@michengai/dsh-archive-manager/types#Deleted", deletedSchema),
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteArchivedSessions",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "deleteArchivedSessions",
            invocation: { kind: "direct" },
            parameters: [{
              name: "target",
              wire: "target",
              source: "json",
              codec: strictCodec("@michengai/dsh-archive-manager/types#ArchivedBatchTarget", archivedBatchTargetSchema)
            }],
            result: strictCodec("@michengai/dsh-archive-manager/types#DeletedBatch", deletedBatchSchema),
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "archivedSessionMetadata",
            invocation: { kind: "direct" },
            parameters: [],
            result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionMetadata", archivedSessionMetadataSchema),
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          }
        ]
      };
      const ARCHIVED_CLASSES = {
        row: "dsham_archivedRow",
        title: "dsham_archivedTitle",
        badge: "dsham_archivedBadge",
        content: "dsham_archiveCardContent",
        meta: "dsham_archiveCardMeta",
        actions: "dsham_archiveCardActions",
        unarchive: "dsham_archiveCardUnarchive",
        delete: "dsham_archiveCardDelete"
      };
      const ARCHIVED_CSS = ".YDXeBa_sessionRow.dsham_archivedRow{box-sizing:border-box;cursor:default;min-height:64px;height:auto;background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;gap:12px;margin:8px 0;padding:10px 16px}.YDXeBa_sessionRow.dsham_archivedRow:hover{background:var(--dsw-alias-button-elevated-fill);border-color:var(--dsw-alias-border-l3)}.YDXeBa_searchResultRow.dsham_archivedRow{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;margin:8px 0;padding:10px 16px}.dsham_archivedTitle{color:var(--dsw-alias-label-primary);font-weight:600}.dsham_archivedBadge{display:none}.dsham_archiveCardContent{min-width:0;flex:1;flex-direction:column;gap:2px;display:flex}.dsham_archiveCardMeta{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.YDXeBa_sessionRow.dsham_archivedRow>.YDXeBa_time,.YDXeBa_sessionRow.dsham_archivedRow>.YDXeBa_rowActions{display:none}.dsham_archiveCardActions{align-items:center;gap:12px;display:inline-flex}.dsham_archiveCardActions button{cursor:pointer;border:none;flex:none}.dsham_archiveCardDelete{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border-radius:8px;align-items:center;justify-content:center;display:inline-flex}.dsham_archiveCardDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_archiveCardUnarchive{height:32px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2)!important;border-radius:10px;padding:0 12px;font-size:13px;font-weight:600;line-height:20px}.dsham_archiveCardUnarchive:hover{background:var(--dsw-alias-interactive-bg-hover)}";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-archive-manager/Archived.module.css") + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = "dsh-archive-manager/Archived.module.css";
        tag.textContent = ARCHIVED_CSS;
        document.head.appendChild(tag);
      }
      function indexSubagentDescendants(summaries) {
        const indexed = /* @__PURE__ */ new Map();
        for (const descendant of Object.values(summaries)) {
          if (descendant.origin !== "subagent") continue;
          const seen = /* @__PURE__ */ new Set();
          let current = descendant;
          while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
            seen.add(current.id);
            const aggregate = indexed.get(current.parentId);
            if (aggregate === void 0) indexed.set(current.parentId, {
              count: 1,
              runningCount: descendant.running ? 1 : 0
            });
            else {
              aggregate.count += 1;
              if (descendant.running) aggregate.runningCount += 1;
            }
            current = summaries[current.parentId];
          }
        }
        return indexed;
      }
      const FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
      const WORKSPACE_VIEW_PERSIST_KEY = "dsh.archive-manager.workspace.view.v1";
      const LEGACY_WORKSPACE_VIEW_PERSIST_KEY = "dsh.workspace.view.v5";
      function migrateWorkspaceViewPersist(storage) {
        const target = storage ?? globalThis.localStorage;
        if (target == null || typeof target.getItem !== "function" || typeof target.setItem !== "function") return false;
        try {
          if (target.getItem(WORKSPACE_VIEW_PERSIST_KEY) != null) return false;
          const legacy = target.getItem(LEGACY_WORKSPACE_VIEW_PERSIST_KEY);
          if (legacy == null) return false;
          target.setItem(WORKSPACE_VIEW_PERSIST_KEY, legacy);
          return true;
        } catch {
          return false;
        }
      }
      function createWorkspaceViewStore() {
        migrateWorkspaceViewPersist();
        return (0, _deepseek_ai_dsh_client_store.defineStore)({
          init: () => ({
            groupBy: "workspace",
            orderBy: "updated",
            showArchived: false,
            groupExpansion: {},
            sessionOrderByAccount: {},
            sessionUpdatedAtByAccount: {}
          }),
          persist: WORKSPACE_VIEW_PERSIST_KEY,
          actions: {
            setGroupBy: (d, mode) => {
              d.groupBy = mode;
            },
            setOrderBy: (d, mode) => {
              d.orderBy = mode;
            },
            setShowArchived: (d, value) => {
              d.showArchived = value === true;
            },
            setGroupExpanded: (d, key, expanded) => {
              d.groupExpansion[key] = expanded;
            },
            retainAccountKeys: (d, workspaceKeys) => {
              const retained = new Set(workspaceKeys);
              d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
              d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
              d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
            },
            syncSessionOrderAccount: (d, accountKey, order, updatedAt) => {
              d.sessionOrderByAccount[accountKey] = order;
              d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
            },
            setSessionOrder: (d, accountKey, order) => {
              d.sessionOrderByAccount[accountKey] = order;
            }
          }
        });
      }
      function GithubMark16() {
        return (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: "false", children: (0, react_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" }) });
      }
      function ArchivedSessionsSection({ archiveSessions, sessionStore, workspaceStore, unarchiveSession, deleteSession, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, openConversation, focusSessionWorkspace, viewState, close, t, diagnoseSession, repairSession, sessionDetails, searchSessionContent, searchArchivedContent, previewArchivedSession, favoriteSessions, setSessionFavorite, organizeBatch, useSessionPendingInteraction, useSessionStatus }) {
        const sessions = (0, react.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
        const workspaceState = (0, react.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
        const [archiveTab, setArchiveTab] = (0, react.useState)("archived");
        const isArchived = archiveTab === "archived";
        const [archiveTarget, setArchiveTarget] = (0, react.useState)(null);
        const [archiveGroup, setArchiveGroup] = (0, react.useState)(null);
        const requestArchive = (ids, group = null) => {
          setError(null);
          setNotice(null);
          setIdleRequest(false);
          setArchiveGroup(group);
          setArchiveTarget(ids);
        };
        const closeArchive = () => {
          if (!busy) {
            setArchiveTarget(null);
            setArchiveGroup(null);
            setError(null);
          }
        };
        const archiveBusy = (0, react.useRef)(false);
        const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
        const [busy, setBusy] = (0, react.useState)(false);
        const [error, setError] = (0, react.useState)(null);
        const [notice, setNotice] = (0, react.useState)(null);
        const [query, setQuery] = (0, react.useState)(viewState?.query ?? "");
        const [project, setProject] = (0, react.useState)(viewState?.project ?? "all");
        const [sortBy, setSortBy] = (0, react.useState)(viewState?.sortBy ?? "updated");
        const [createdAtById, setCreatedAtById] = (0, react.useState)({});
        const [unarchivingSessionIds, setUnarchivingSessionIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
        const unarchivingSessionIdsRef = (0, react.useRef)(/* @__PURE__ */ new Set());
        const [selectedSessionIds, setSelectedSessionIds] = (0, react.useState)([]);
        const [favoriteIds, setFavoriteIds] = (0, react.useState)([]);
        const [favoritesReady, setFavoritesReady] = (0, react.useState)(false);
        const [favoriteBusy, setFavoriteBusy] = (0, react.useState)(false);
        const favoriteLock = (0, react.useRef)(false);
        const [favoritesOnly, setFavoritesOnly] = (0, react.useState)(false);
        const [searchScope, setSearchScope] = react.useState("title");
        const [dateFrom, setDateFrom] = react.useState("");
        const [dateTo, setDateTo] = react.useState("");
        const [collapsedGroups, setCollapsedGroups] = (0, react.useState)(() => /* @__PURE__ */ new Set());
        const [idleDays, setIdleDays] = (0, react.useState)("30");
        const [idleRequest, setIdleRequest] = (0, react.useState)(false);
        const [batchProgress, setBatchProgress] = (0, react.useState)(null);
        const [batchResult, setBatchResult] = (0, react.useState)(null);
        const [lastArchive, setLastArchive] = (0, react.useState)([]);
        const batchLock = (0, react.useRef)(false);
        const retryBatch = (0, react.useRef)(null);
        const uiFacts = useSessionUiFacts(useSessionPendingInteraction ?? useEmptySessionPendingInteraction, useSessionStatus ?? useEmptySessionStatus, typeof useSessionStatus === "function");
        const pendingRef = (0, react.useRef)(uiFacts.pending);
        pendingRef.current = uiFacts.pending;
        const favoriteSet = new Set(favoriteIds);
        const loadFavorites = async () => {
          if (!favoriteSessions) return;
          try {
            const result = await favoriteSessions();
            setFavoriteIds(result.favoriteSessionIds);
            setFavoritesReady(true);
          } catch (reason) {
            setFavoritesReady(false);
            setError(String(reason?.message ?? reason));
          }
        };
        (0, react.useEffect)(() => {
          let active = true;
          if (favoriteSessions) favoriteSessions().then((value) => {
            if (active) {
              setFavoriteIds(value.favoriteSessionIds);
              setFavoritesReady(true);
            }
          }).catch((reason) => {
            if (active) setError(String(reason?.message ?? reason));
          });
          return () => {
            active = false;
          };
        }, [favoriteSessions]);
        const toggleFavorite = async (sessionId) => {
          if (favoriteLock.current || busy || !favoritesReady) return;
          favoriteLock.current = true;
          setFavoriteBusy(true);
          setError(null);
          try {
            const value = await setSessionFavorite({ sessionId, favorite: !favoriteSet.has(sessionId) });
            setFavoriteIds(value.favoriteSessionIds);
          } catch (reason) {
            setError(String(reason?.message ?? reason));
          } finally {
            favoriteLock.current = false;
            setFavoriteBusy(false);
          }
        };
        const executeBatch = async (kind, ids, { idle = false, retry = false } = {}) => {
          if (batchLock.current || favoriteLock.current || unarchivingSessionIdsRef.current.size > 0 || !organizeBatch) return;
          batchLock.current = true;
          setBusy(true);
          setError(null);
          setNotice(null);
          setBatchResult(null);
          if (kind === "archive" && !retry) setLastArchive([]);
          try {
            const result = await organizeBatch(kind, ids, { idleDays: idle ? Number(idleDays) : void 0, getPending: () => pendingRef.current, onProgress: setBatchProgress });
            setBatchResult({ ...result, kind, tab: archiveTab });
            retryBatch.current = result.remaining.length ? { kind, ids: result.remaining, idle } : null;
            if (kind === "archive") setLastArchive((previous) => [.../* @__PURE__ */ new Set([...previous, ...result.succeeded])]);
            if (kind === "undo" || kind === "restore" || kind === "delete") setLastArchive((previous) => previous.filter((id2) => !result.succeeded.includes(id2) && !result.skipped.includes(id2)));
            setSelectedSessionIds((previous) => previous.filter((id2) => !result.succeeded.includes(id2) && !result.skipped.includes(id2)));
            if (kind === "delete") setFavoriteIds((previous) => previous.filter((id2) => !result.succeeded.includes(id2)));
            return result;
          } catch (reason) {
            setError(String(reason?.message ?? reason));
          } finally {
            batchLock.current = false;
            setBusy(false);
            setBatchProgress(null);
          }
        };
        const navigationActive = (0, react.useRef)(true);
        const navigationPending = (0, react.useRef)(false);
        (0, react.useEffect)(() => {
          navigationActive.current = true;
          return () => {
            navigationActive.current = false;
          };
        }, []);
        const viewConversation = async (session, restore = false) => {
          if (busy || navigationPending.current) return;
          navigationPending.current = true;
          setBusy(true);
          setError(null);
          let restored = false;
          try {
            await openArchivedConversation({
              prepare: restore ? async (id2) => {
                await focusSessionWorkspace?.(id2);
              } : void 0,
              restore: async (id2) => {
                await unarchiveSession(id2);
                restored = true;
              },
              open: async (id2) => {
                await openConversation(id2);
                if (navigationActive.current) close?.();
              }
            }, session.id, restore, () => navigationActive.current);
          } catch (reason) {
            if (!navigationActive.current) return;
            if (restored) {
              setArchiveTab("unarchived");
              const group = groups.find((item) => item.sessions.some((row) => row.id === session.id));
              if (group !== void 0) setProject(group.key);
            }
            setError(formatArchiveNavigationError(reason, t));
          } finally {
            navigationPending.current = false;
            if (navigationActive.current) setBusy(false);
          }
        };
        (0, react.useEffect)(() => {
          if (viewState) Object.assign(viewState, { query, project, sortBy });
        }, [query, project, sortBy, viewState]);
        const eligibleIds = (0, react.useMemo)(() => isArchived ? workspaceState.archivedSessionIds : unarchivedSessionIds(sessions.byId, workspaceState.archivedSessionIds), [isArchived, sessions.byId, workspaceState.archivedSessionIds]);
        const groups = (0, react.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, eligibleIds, t("group.ungrouped")), [sessions.byId, workspaceState, eligibleIds, t]);
        const switchTab = (tab) => {
          if (busy || unarchivingSessionIdsRef.current.size > 0) return;
          preview.close();
          setArchiveTab(tab);
          setSelectedSessionIds([]);
          setArchiveTarget(null);
          setArchiveGroup(null);
          setError(null);
          setNotice(null);
          setProject("all");
          setQuery("");
        };
        const confirmArchive = async () => {
          if (archiveBusy.current || busy || !archiveTarget?.length) return;
          if (organizeBatch) {
            archiveBusy.current = true;
            try {
              const result = await executeBatch("archive", archiveTarget, { idle: idleRequest });
              if (result) {
                setArchiveTarget(null);
                setArchiveGroup(null);
                setIdleRequest(false);
              }
            } finally {
              archiveBusy.current = false;
            }
            return;
          }
          archiveBusy.current = true;
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            const result = await archiveSessions(archiveTarget);
            setSelectedSessionIds([]);
            setArchiveTab("archived");
            setProject("all");
            setQuery("");
            setNotice(t("archives.archiveSuccess", { n: result.archivedSessionIdsAdded.length }));
            setArchiveTarget(null);
            setArchiveGroup(null);
          } catch (reason) {
            setError(t("archives.archiveBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
          } finally {
            archiveBusy.current = false;
            setBusy(false);
          }
        };
        const details = useSessionDetails(sessionDetailCandidates(eligibleIds, sessions.byId), sessionDetails, t);
        const copyDetail = async (session, kind) => {
          setError(null);
          setNotice(null);
          try {
            let text = session.id;
            if (kind === "path") {
              let row = details.byId[session.id];
              if (!row) row = (await sessionDetails({ sessionIds: [session.id] })).items[0];
              if (!row?.path) throw new Error(t("details.noPath"));
              text = row.path;
            }
            await copySessionText(text);
            if (navigationActive.current) setNotice(t("details.copied"));
          } catch (reason) {
            if (navigationActive.current) setError(reason?.code?.startsWith("copy.") ? t(reason.code) : String(reason?.message ?? reason));
          }
        };
        const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t, details.byId), [groups, sortBy, createdAtById, t, details.byId]);
        (0, react.useEffect)(() => {
          let cancelled = false;
          archivedSessionMetadata().then((result) => {
            if (!cancelled) setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
          }).catch(() => {
            if (!cancelled) setCreatedAtById({});
          });
          return () => {
            cancelled = true;
          };
        }, [archivedSessionMetadata, workspaceState.archivedSessionIds]);
        (0, react.useEffect)(() => {
          if (project !== "all" && !groups.some((group) => group.key === project)) setProject("all");
        }, [groups, project]);
        const invalidDate = !validUpdatedRange(dateFrom, dateTo);
        const candidateGroups = sortedGroups.filter((group) => project === "all" || project === group.key).map((group) => ({ ...group, sessions: group.sessions.filter((session) => (!favoritesOnly || favoriteIds.includes(session.id)) && matchesUpdatedRange(session.updatedAt, dateFrom, dateTo)) })).filter((group) => group.sessions.length);
        const contentEnabled = searchScope === "content" && !invalidDate;
        const contentSearch = useArchiveSearch(candidateGroups.flatMap((group) => group.sessions.map((session) => session.id)), query, contentEnabled, searchSessionContent ?? searchArchivedContent);
        const contentMatches = new Map(contentSearch.items.map((item) => [item.sessionId, item]));
        const preview = useArchivePreview(previewArchivedSession, isArchived ? workspaceState.archivedSessionIds : []);
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const filteredGroups = candidateGroups.map((group) => ({ ...group, sessions: group.sessions.filter((session) => !normalizedQuery || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery) || contentMatches.has(session.id)) })).filter((group) => group.sessions.length);
        const idleCandidates = favoritesReady ? filteredGroups.flatMap((group) => group.sessions).filter((session) => idleArchiveCandidate(session, { days: Number(idleDays), favorites: favoriteSet, currentId: currentSessionId(sessions), pending: uiFacts.pending })).map((session) => session.id) : [];
        const visibleSessionIds = (0, react.useMemo)(() => archivedSessionIdsInGroups(filteredGroups), [filteredGroups]);
        const selectedSessionIdSet = (0, react.useMemo)(() => new Set(selectedSessionIds), [selectedSessionIds]);
        const selectedVisibleCount = visibleSessionIds.filter((sessionId) => selectedSessionIdSet.has(sessionId)).length;
        const allVisibleSelected = visibleSessionIds.length > 0 && selectedVisibleCount === visibleSessionIds.length;
        (0, react.useEffect)(() => {
          setSelectedSessionIds((current) => pruneArchivedSelection(current, eligibleIds));
        }, [eligibleIds]);
        const toggleSessionSelection = (sessionId, checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, [sessionId], checked));
        };
        const toggleVisibleSelection = (checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, visibleSessionIds, checked));
        };
        const onUnarchive = (sessionId) => {
          if (busy || unarchivingSessionIdsRef.current.has(sessionId)) return;
          unarchivingSessionIdsRef.current.add(sessionId);
          setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          setError(null);
          setNotice(null);
          unarchiveSession(sessionId).catch((reason) => {
            setError(formatUnarchiveError(reason, t));
          }).finally(() => {
            unarchivingSessionIdsRef.current.delete(sessionId);
            setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          });
        };
        const onBatchUnarchive = async (target) => {
          if (busy) return;
          if (organizeBatch) {
            const ids = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target);
            const result = await executeBatch("restore", ids);
            return result && { unarchivedSessionIds: result.succeeded };
          }
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            const result = await unarchiveSessions(target);
            setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
            return result;
          } catch (reason) {
            setError(t("archives.restoreBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
          } finally {
            setBusy(false);
          }
        };
        const onSelectedUnarchive = async () => {
          if (selectedSessionIds.length === 0) return;
          const result = await onBatchUnarchive({ scope: "sessions", sessionIds: selectedSessionIds });
          if (result !== void 0) {
            const restored = new Set(result.unarchivedSessionIds);
            setSelectedSessionIds((current) => current.filter((sessionId) => !restored.has(sessionId)));
          }
        };
        const closeDelete = () => {
          if (!busy) setDeleteTarget(null);
        };
        (0, react.useEffect)(() => {
          if (deleteTarget === null) return;
          const onKeyDown = (event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
            if (!busy) setDeleteTarget(null);
          };
          window.addEventListener("keydown", onKeyDown, true);
          return () => window.removeEventListener("keydown", onKeyDown, true);
        }, [deleteTarget, busy]);
        const confirmDelete = async () => {
          if (busy || deleteTarget === null) return;
          if (organizeBatch && deleteTarget.kind === "batch") {
            const ids = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, deleteTarget.target);
            const result = await executeBatch("delete", ids);
            if (result) setDeleteTarget(null);
            return;
          }
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            if (deleteTarget.kind === "batch") {
              const result = await deleteArchivedSessions(deleteTarget.target);
              const feedback = archivedDeleteFeedback(result, t);
              if (feedback.kind === "error") setError(feedback.message);
              else setNotice(feedback.message);
              if (deleteTarget.target.scope === "sessions") {
                const completed = /* @__PURE__ */ new Set([...result.deletedSessionIds, ...result.skippedSessionIds]);
                setSelectedSessionIds((current) => current.filter((sessionId) => !completed.has(sessionId)));
              }
            } else {
              await deleteSession(deleteTarget.session.id);
            }
            setDeleteTarget(null);
          } catch (reason) {
            setError(formatDeleteError(reason, t));
          } finally {
            setBusy(false);
          }
        };
        const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
        const deleteDialogTitle = batchScope === "all" ? t("archives.deleteAllTitle") : batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget.title }) : batchScope === "sessions" ? t("archives.deleteSelectedTitle") : t("deleteSession.title");
        const deleteDialogDescription = deleteTarget === null ? void 0 : batchScope === "all" ? t("archives.deleteAllDesc", { n: deleteTarget.count }) : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.count }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget.title, n: deleteTarget.count }) : batchScope === "sessions" ? t("archives.deleteSelectedDesc", { n: deleteTarget.count }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.session, t) });
        const deleteConfirmLabel = batchScope === "all" ? t("archives.deleteAll") : batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : batchScope === "sessions" ? t("archives.deleteSelectedConfirm") : t("deleteSession.title");
        return (0, react_jsx_runtime.jsxs)("section", {
          className: "dsham_settings",
          "aria-label": t("archives.title"),
          children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_TABS_CSS + ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS + ARCHIVE_SETTINGS_SELECTION_CSS + ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS + ARCHIVE_WORKSPACE_CONFIRM_CSS }), (0, react_jsx_runtime.jsxs)("div", {
            // 设置页使用独立布局容器，避免被 Codex UI 的会话 header 页签适配器识别。
            className: "dsham_settingsHeader",
            children: [(0, react_jsx_runtime.jsxs)("div", {
              children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsTitleRow", children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsLinks", children: [(0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager", target: "_blank", rel: "noreferrer", "aria-label": t("archives.viewProject"), children: [(0, react_jsx_runtime.jsx)(GithubMark16, {}), t("archives.viewProject")] }), (0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager/issues", target: "_blank", rel: "noreferrer", "aria-label": t("archives.feedback"), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {}), t("archives.feedback")] })] })] }), (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsIntro", children: t("archives.description") })]
            }), (0, react_jsx_runtime.jsx)("div", {
              className: "dsham_archiveTabs",
              role: "tablist",
              "aria-label": t("archives.title"),
              children: ["archived", "unarchived"].map((tab) => (0, react_jsx_runtime.jsx)("button", {
                type: "button",
                role: "tab",
                className: "dsham_archiveTab",
                id: "dsham-tab-" + tab,
                "aria-controls": "dsham-archive-panel",
                "aria-selected": archiveTab === tab,
                tabIndex: archiveTab === tab ? 0 : -1,
                disabled: busy || unarchivingSessionIds.size > 0,
                onClick: () => switchTab(tab),
                onKeyDown: (event) => {
                  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                    event.preventDefault();
                    const next = event.key === "Home" ? "archived" : event.key === "End" ? "unarchived" : isArchived ? "unarchived" : "archived";
                    switchTab(next);
                    event.currentTarget.parentElement.querySelector("#dsham-tab-" + next)?.focus();
                  }
                },
                children: t("archives.tab." + tab)
              }, tab))
            })]
          }), (0, react_jsx_runtime.jsxs)("div", { id: "dsham-archive-panel", role: "tabpanel", "aria-labelledby": "dsham-tab-" + archiveTab, children: [(0, react_jsx_runtime.jsxs)("div", {
            className: "dsham_settingsToolbar",
            children: [(0, react_jsx_runtime.jsxs)("div", {
              className: "dsham_settingsSearch",
              children: [react.createElement("div", { className: "dsham_searchScope" }, react.createElement(ArchiveProjectSelect, { id: "dsham-search-scope", value: searchScope, "aria-label": t("discovery.scope"), onChange: setSearchScope, options: [{ value: "title", label: t("discovery.titleOnly") }, { value: "content", label: t("discovery.titleAndContent") }] })), (0, react_jsx_runtime.jsx)("input", { type: "search", maxLength: 200, value: query, onChange: (event) => setQuery(event.target.value), placeholder: t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived"), "aria-label": t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived") }), react.createElement(DiscoveryFilters, { t, from: dateFrom, to: dateTo, onFrom: setDateFrom, onTo: setDateTo, invalid: invalidDate, onClear: () => {
                setDateFrom("");
                setDateTo("");
              } })]
            }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }, ...sessionDetails ? [{ value: "turnsDesc", label: t("details.more") }, { value: "turnsAsc", label: t("details.less") }] : []], onChange: setSortBy, "aria-label": t("archives.sortBy") }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-project-filter", value: project, options: [{ value: "all", label: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") }), setSessionFavorite && (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-favorite-filter", value: favoritesOnly ? "favorites" : "all", disabled: busy || favoriteBusy || !favoritesReady, options: [{ value: "all", label: t("organizer.allSessions") }, { value: "favorites", label: t("organizer.favoritesOnly") }], onChange: (value) => setFavoritesOnly(value === "favorites"), "aria-label": t("organizer.favoriteFilter") })]
          }), react.createElement("style", null, discoveryCss), react.createElement(SearchStatus, { state: contentSearch, t }), react.createElement(SessionHealthPanel, { key: archiveTab, t, isArchived, items: details.items, sessions: groups.flatMap((group) => group.sessions), diagnoseSession, repairSession, retry: details.retry, pending: details.pending }), organizeBatch && (0, react_jsx_runtime.jsx)(OrganizerPanel, {
            t,
            archived: isArchived,
            busy: busy || favoriteBusy || unarchivingSessionIds.size > 0,
            ready: favoritesReady,
            days: idleDays,
            onDays: setIdleDays,
            count: idleCandidates.length,
            onPreview: () => {
              requestArchive(idleCandidates);
              setIdleRequest(true);
            },
            progress: batchProgress,
            result: batchResult?.tab === archiveTab ? batchResult : null,
            onRetry: () => {
              const retry = retryBatch.current;
              if (retry) {
                if (retry.kind === "delete") setDeleteTarget({ kind: "batch", target: { scope: "sessions", sessionIds: retry.ids }, count: retry.ids.length });
                else executeBatch(retry.kind, retry.ids, { idle: retry.idle, retry: true });
              }
            },
            undoCount: lastArchive.filter((id2) => workspaceState.archivedSessionIds.includes(id2)).length,
            onUndo: () => executeBatch("undo", lastArchive, { retry: true }),
            onReload: loadFavorites
          }), groups.length > 0 && (0, react_jsx_runtime.jsx)(ArchiveSelectionToolbar, {
            selectedCount: selectedSessionIds.length,
            hiddenCount: selectedSessionIds.length - selectedVisibleCount,
            allVisibleSelected,
            selectedVisibleCount,
            visibleCount: visibleSessionIds.length,
            busy,
            t,
            onToggle: toggleVisibleSelection,
            onClear: () => setSelectedSessionIds([]),
            onArchive: isArchived ? void 0 : () => requestArchive([...selectedSessionIds]),
            onRestore: onSelectedUnarchive,
            onDelete: () => setDeleteTarget({ kind: "batch", target: { scope: "sessions", sessionIds: selectedSessionIds }, count: selectedSessionIds.length })
          }), groups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t(isArchived ? "archives.empty" : "archives.emptyUnarchived") }) : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: contentSearch.status === "loading" || contentSearch.status === "error" || contentSearch.failures.length ? null : t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
            const target = archivedBatchTargetForGroup(group.key);
            const groupSessionIds = groups.find((item) => item.key === group.key)?.sessions.map((session) => session.id) ?? [];
            const count = isArchived ? deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length : groupSessionIds.length;
            return (0, react_jsx_runtime.jsxs)("section", {
              className: "dsham_settingsGroup",
              children: [(0, react_jsx_runtime.jsxs)("div", {
                className: "dsham_settingsGroupHeading",
                children: [(0, react_jsx_runtime.jsx)("h3", { className: "dsham_settingsGroupTitle", children: (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dsham_groupToggle", "aria-expanded": !collapsedGroups.has(group.key), "aria-controls": "dsham-group-" + encodeURIComponent(group.key), onClick: () => setCollapsedGroups((previous) => {
                  const next = new Set(previous);
                  if (next.has(group.key)) next.delete(group.key);
                  else next.add(group.key);
                  return next;
                }), children: [(0, react_jsx_runtime.jsx)(collapsedGroups.has(group.key) ? _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), (0, react_jsx_runtime.jsx)("span", { children: group.title })] }) }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsCount", children: t("archives.sessionCount", { n: group.sessions.length }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, onArchive: isArchived ? void 0 : () => requestArchive(groupSessionIds, group), onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), t })] })]
              }), (0, react_jsx_runtime.jsx)("div", {
                className: "dsham_settingsList",
                id: "dsham-group-" + encodeURIComponent(group.key),
                hidden: collapsedGroups.has(group.key),
                children: !collapsedGroups.has(group.key) && group.sessions.map((session) => (0, react_jsx_runtime.jsxs)("article", {
                  className: "dsham_settingsRow",
                  "data-selected": selectedSessionIdSet.has(session.id),
                  children: [
                    (0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, { checked: selectedSessionIdSet.has(session.id), disabled: busy, label: t("archives.selectSession", { name: displayTitle(session, t) }), onChange: (event) => toggleSessionSelection(session.id, event.target.checked) }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsContent", children: [
                      (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsTitleLink", title: displayTitle(session, t), "aria-label": t("archives.openSession") + t("common.separator") + displayTitle(session, t), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => viewConversation(session), children: displayTitle(session, t) }),
                      (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsMeta", children: [archiveTimeLabel(session.updatedAt, t), sessionDetails && react.createElement("span", { key: "turns", title: details.byId[session.id]?.error || t("details.hint") }, " \xB7 ", t(typeof details.byId[session.id]?.turnCount === "number" ? "details.turns" : details.byId[session.id] ? "details.unknown" : "details.pending", { n: details.byId[session.id]?.turnCount }))] }),
                      contentMatches.has(session.id) && react.createElement("button", { type: "button", className: "dsham_settingsSnippet", disabled: busy, title: t(isArchived ? "discovery.preview" : "archives.openSession"), onClick: () => isArchived ? preview.open(session, query) : viewConversation(session) }, react.createElement(HighlightedText, { text: contentMatches.get(session.id).snippet, query }))
                    ] }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsActions", children: [
                      setSessionFavorite && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_favorite", title: t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite"), "aria-pressed": favoriteSet.has(session.id), "aria-label": t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite") + t("common.separator") + displayTitle(session, t), disabled: busy || favoriteBusy || !favoritesReady, onClick: () => toggleFavorite(session.id), children: (0, react_jsx_runtime.jsx)("span", { "aria-hidden": true, children: favoriteSet.has(session.id) ? "\u2605" : "\u2606" }) }),
                      (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_restoreIcon", title: t(isArchived ? "archives.restore" : "archives.archiveSelected"), "aria-label": t(isArchived ? "archives.restore" : "archives.archiveSelected"), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => isArchived ? onUnarchive(session.id) : requestArchive([session.id]), children: (0, react_jsx_runtime.jsx)(isArchived ? _deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16 : _deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 }) }),
                      (isArchived || sessionDetails) && (0, react_jsx_runtime.jsx)(ArchivedSessionMenu, { busy: busy || unarchivingSessionIds.has(session.id), t, title: displayTitle(session, t), onCopyId: () => copyDetail(session, "id"), onCopyPath: sessionDetails ? () => copyDetail(session, "path") : void 0, onPreview: isArchived && previewArchivedSession ? () => preview.open(session, query) : void 0, onRestoreOpen: isArchived ? () => viewConversation(session, true) : void 0, onDelete: isArchived ? () => setDeleteTarget({ kind: "session", session }) : void 0 })
                    ] })
                  ]
                }, session.id))
              })]
            }, group.key);
          }), react.createElement(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            className: "dsham_previewDialog",
            contentClassName: "dsham_previewDialogContent",
            open: preview.target !== null,
            onClose: preview.close,
            closeLabel: t("close"),
            title: preview.target ? displayTitle(preview.target.session, t) : t("discovery.preview"),
            footer: react.createElement(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: () => {
              if (preview.target) {
                const session = preview.target.session;
                preview.close();
                return viewConversation(session);
              }
            } }, t("discovery.openFull")),
            children: react.createElement(PreviewContent, { preview, t, MarkdownText: _deepseek_ai_dsh_client_ui_primitives.MarkdownText })
          }), archiveTarget === null && error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: archiveTarget !== null,
            onClose: closeArchive,
            closeLabel: t("close"),
            title: t("archives.archiveTitle", { n: archiveTarget?.length ?? 0 }),
            description: archiveGroup === null ? t("archives.archiveSelectedDesc") : t(archiveGroup.key === ARCHIVE_UNGROUPED_KEY ? "archives.archiveUngroupedDesc" : "archives.archiveProjectDesc", { name: archiveGroup.title, n: archiveTarget?.length ?? 0 }),
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
              (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: closeArchive, children: t("cancel") }),
              (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", className: "dsham_archiveWorkspaceConfirm", disabled: busy || !archiveTarget?.length, onClick: confirmArchive, children: t("archives.archiveSelected") })
            ] }),
            children: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
              organizeBatch && (0, react_jsx_runtime.jsx)("p", { children: t(idleRequest ? "organizer.idleConfirm" : "organizer.manualConfirm") }),
              organizeBatch && (0, react_jsx_runtime.jsx)("div", { className: "dsham_archivePreview", children: (archiveTarget ?? []).map((id2) => (0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)("input", { type: "checkbox", checked: true, disabled: busy, onChange: () => setArchiveTarget((current) => current.filter((value) => value !== id2)) }), displayTitle(sessions.byId[id2] ?? { id: id2 }, t)] }, id2)) }),
              batchProgress && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [(0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total) }), t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] }),
              error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error })
            ] })
          }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: deleteTarget !== null,
            onClose: closeDelete,
            closeLabel: t("close"),
            title: deleteDialogTitle,
            ...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: closeDelete, children: t("cancel") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", className: "dsham_settingsDeleteConfirm", disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
            children: busy && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending"), batchProgress && (0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total), "aria-label": t("organizer.progress") }), batchProgress && t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] })
          })] })]
        });
      }
      function r(e) {
        var t, f, n = "";
        if ("string" == typeof e || "number" == typeof e) n += e;
        else if ("object" == typeof e) if (Array.isArray(e)) {
          var o = e.length;
          for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
        } else for (f in e) e[f] && (n && (n += " "), n += f);
        return n;
      }
      function clsx() {
        for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
        return n;
      }
      const UNGROUPED_LABEL = "Ungrouped";
      function workspaceLabel(cwd, ungroupedLabel = UNGROUPED_LABEL) {
        if (cwd === void 0 || cwd === "") return ungroupedLabel;
        const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
        return base !== void 0 && base !== "" ? base : cwd;
      }
      function byRecency(a, b) {
        if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
        return a.id < b.id ? -1 : 1;
      }
      function sessionVisible(session, current, archived, showArchived) {
        return session.origin !== "subagent" && (!archived.has(session.id) || showArchived === true) && (!session.blank || session.id === current);
      }
      function isUnknownSessionError(reason) {
        const message = reason instanceof Error ? reason.message : String(reason);
        return message.includes("UNKNOWN_SESSION") || message.includes("no such session");
      }
      function formatDeleteError(reason, t) {
        if (isUnknownSessionError(reason)) return t("deleteSession.unknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("deleteSession.failed", { detail });
      }
      function formatUnarchiveError(reason, t) {
        if (isUnknownSessionError(reason)) return t("archives.unarchiveUnknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.unarchiveFailed", { detail });
      }
      function formatArchiveError(reason, t) {
        if (isUnknownSessionError(reason)) return t("archives.archiveUnknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.archiveFailed", { detail });
      }
      function formatForkError(reason, t) {
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.forkFailed", { detail });
      }
      function sessionTitle(session) {
        return session.blank ? "New Session" : session.displayTitle;
      }
      function buildGroup(key, workspaceId, cwd, createdAt, label, members, order) {
        const sessions = [...members];
        if (order === "recency") sessions.sort(byRecency);
        return {
          key,
          workspaceId,
          cwd,
          createdAt,
          label,
          sessions
        };
      }
      function orderedUngrouped(members, stored) {
        const byId = new Map(members.map((session) => [session.id, session]));
        const included = /* @__PURE__ */ new Set();
        const ordered = [];
        for (const key of stored) {
          const session = byId.get(key);
          if (session === void 0 || included.has(key)) continue;
          ordered.push(session);
          included.add(key);
        }
        for (const session of [...members].sort(byRecency)) {
          if (included.has(session.id)) continue;
          ordered.push(session);
        }
        return ordered;
      }
      function groupByWorkspace(list, workspaces, archived, ungroupedOrder, showArchived) {
        const groups = [];
        const accounted = /* @__PURE__ */ new Set();
        for (const workspace of workspaces) {
          const members = [];
          for (const id2 of workspace.sessionIds) {
            const summary = list.byId[id2];
            if (summary === void 0) continue;
            accounted.add(id2);
            if (!sessionVisible(summary, currentSessionId(list), archived, showArchived)) continue;
            members.push(summary);
          }
          groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
        }
        const stray = list.ids.map((id2) => list.byId[id2]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, currentSessionId(list), archived, showArchived));
        if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
        return groups;
      }
      function archiveableWorkspaceSessionCount(workspace, archivedSessionIds) {
        const archived = archivedSessionIds instanceof Set ? archivedSessionIds : new Set(archivedSessionIds);
        return [...new Set(workspace.sessionIds)].filter((sessionId) => !archived.has(sessionId)).length;
      }
      function archiveWorkspaceDialogTarget(workspaces, workspaceId, title, archivedSessionIds) {
        const workspace = workspaces.find((item) => item.workspaceId === workspaceId);
        if (workspace === void 0) return null;
        const count = archiveableWorkspaceSessionCount(workspace, archivedSessionIds);
        return count === 0 ? null : { workspaceId, title, count };
      }
      function archiveWorkspaceDialogFailureState(target, reason, t) {
        return { target, archiving: false, error: formatArchiveError(reason, t) };
      }
      function visiblePendingKind(kind) {
        switch (kind) {
          case "approval":
          case "plan-review":
          case "question":
            return kind;
          default:
            return;
        }
      }
      function pendingInteractionForSession(session, pendingInteractions) {
        const entry = pendingInteractions.get(session.id);
        const kind = entry === void 0 ? session.pendingInteraction : entry.kind;
        return visiblePendingKind(kind);
      }
      const EMPTY_PENDING_INTERACTIONS = /* @__PURE__ */ new Map();
      const EMPTY_COMPLETED_SESSIONS = /* @__PURE__ */ new Set();
      const EMPTY_SESSION_STATUS = /* @__PURE__ */ new Map();
      function useEmptySessionPendingInteraction(selector) {
        return selector(EMPTY_PENDING_INTERACTIONS);
      }
      function useEmptySessionStatus(selector) {
        return selector(EMPTY_SESSION_STATUS);
      }
      function pendingFacts(pendingInteractions) {
        if (pendingInteractions instanceof Map || pendingInteractions == null) {
          return { pending: pendingInteractions ?? EMPTY_PENDING_INTERACTIONS, completed: EMPTY_COMPLETED_SESSIONS };
        }
        return {
          pending: pendingInteractions.pending ?? EMPTY_PENDING_INTERACTIONS,
          completed: pendingInteractions.completed ?? EMPTY_COMPLETED_SESSIONS
        };
      }
      function factsFromSessionStatus(status) {
        const pending = /* @__PURE__ */ new Map();
        const completed = /* @__PURE__ */ new Set();
        if (status instanceof Map) {
          for (const [id2, entry] of status) {
            if (entry?.pendingInteraction !== void 0) pending.set(id2, entry.pendingInteraction);
            if (entry?.completionUnread === true) completed.add(id2);
          }
        }
        return { pending, completed };
      }
      function useSessionUiFacts(usePending, useStatus, preferStatus) {
        const pending = usePending((s) => s);
        const status = useStatus((s) => s);
        return preferStatus ? factsFromSessionStatus(status) : { pending, completed: EMPTY_COMPLETED_SESSIONS };
      }
      function sessionNode(s, descendants, archived, pendingInteractions) {
        const facts = pendingFacts(pendingInteractions);
        const pendingInteraction = pendingInteractionForSession(s, facts.pending);
        return {
          id: s.id,
          title: sessionTitle(s),
          blank: s.blank,
          running: s.running,
          runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
          completed: s.completed === true || facts.completed.has(s.id),
          updatedAt: s.updatedAt,
          archived: archived.has(s.id),
          ...pendingInteraction === void 0 ? {} : { pendingInteraction }
        };
      }
      function deriveGroups(list, workspaces, archivedSessionIds, pendingInteractions, view) {
        const archived = new Set(archivedSessionIds);
        const expandedGroups = new Set(view.expandedGroups);
        const descendants = indexSubagentDescendants(list.byId);
        const current = currentSessionId(list);
        const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
        const groups = [];
        for (const g of groupByWorkspace(list, workspaces, archived, view.ungroupedOrder, view.showArchived)) {
          const expanded = expandedGroups.has(g.key);
          groups.push({
            key: g.key,
            workspaceId: g.workspaceId,
            cwd: g.cwd,
            createdAt: g.createdAt,
            label: g.label,
            sessionCount: g.sessions.length,
            expanded,
            containsCurrent: g.key === currentGroup,
            sessions: expanded ? g.sessions.map((session) => sessionNode(session, descendants, archived, pendingInteractions)) : []
          });
        }
        return groups;
      }
      function deriveFlat(list, archivedSessionIds, pendingInteractions, showArchived) {
        const archived = new Set(archivedSessionIds);
        const descendants = indexSubagentDescendants(list.byId);
        const rows = [];
        for (const id2 of list.ids) {
          const s = list.byId[id2];
          if (s === void 0 || !sessionVisible(s, currentSessionId(list), archived, showArchived)) continue;
          rows.push(s);
        }
        rows.sort(byRecency);
        return rows.map((session) => sessionNode(session, descendants, archived, pendingInteractions));
      }
      function deriveSearchResults(list, workspaces, query, archivedSessionIds, pendingInteractions, content, limit, showArchived, ungroupedLabel = UNGROUPED_LABEL) {
        const q = query.trim().toLowerCase();
        if (q === "") return {
          items: [],
          hasMore: false
        };
        const archived = new Set(archivedSessionIds);
        const descendants = indexSubagentDescendants(list.byId);
        const workspaceBySession = /* @__PURE__ */ new Map();
        for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
        const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd, ungroupedLabel);
        const contentBySession = /* @__PURE__ */ new Map();
        for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
        const local = [];
        for (const id2 of list.ids) {
          const summary = list.byId[id2];
          if (summary === void 0 || summary.blank || !sessionVisible(summary, currentSessionId(list), archived, showArchived)) continue;
          if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
        }
        local.sort(byRecency);
        const ordered = [];
        const included = /* @__PURE__ */ new Set();
        const include = (summary) => {
          if (included.has(summary.id)) return;
          included.add(summary.id);
          ordered.push(summary);
        };
        for (const summary of local) include(summary);
        for (const item of content.items) {
          const summary = list.byId[item.sessionId];
          if (summary !== void 0 && !summary.blank && sessionVisible(summary, currentSessionId(list), archived, showArchived)) include(summary);
        }
        const facts = pendingFacts(pendingInteractions);
        return {
          items: ordered.slice(0, limit).map((summary) => {
            const match = contentBySession.get(summary.id);
            const pendingInteraction = pendingInteractionForSession(summary, facts.pending);
            return {
              id: summary.id,
              title: sessionTitle(summary),
              workspace: labelOf(summary),
              running: summary.running,
              runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
              archived: archived.has(summary.id),
              ...pendingInteraction === void 0 ? {} : { pendingInteraction },
              completed: summary.completed === true || facts.completed.has(summary.id),
              ...match === void 0 ? {} : { snippet: match.snippet }
            };
          }),
          hasMore: content.hasMore || ordered.length > limit
        };
      }
      function relativeTime(updatedAt, now) {
        const MIN = 6e4;
        const HOUR = 36e5;
        const DAY = 864e5;
        const diff = Math.max(0, now - updatedAt);
        if (diff < MIN) return {
          unit: "now",
          n: 0
        };
        if (diff < HOUR) return {
          unit: "minutes",
          n: Math.floor(diff / MIN)
        };
        if (diff < DAY) return {
          unit: "hours",
          n: Math.floor(diff / HOUR)
        };
        if (diff < 30 * DAY) return {
          unit: "days",
          n: Math.floor(diff / DAY)
        };
        if (diff < 365 * DAY) return {
          unit: "months",
          n: Math.floor(diff / (30 * DAY))
        };
        return {
          unit: "years",
          n: Math.floor(diff / (365 * DAY))
        };
      }
      const css$2 = '.YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}';
      const tagId$2 = "@michengai/dsh-archive-manager/Rows.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId$2;
        tag.textContent = css$2;
        document.head.appendChild(tag);
      }
      var Rows_module_css_default = {
        "hoverTitle": "YDXeBa_hoverTitle",
        "title": "YDXeBa_title",
        "hoverContent": "YDXeBa_hoverContent",
        "dropAfter": "YDXeBa_dropAfter",
        "renameInput": "YDXeBa_renameInput",
        "dot": "YDXeBa_dot",
        "hoverTime": "YDXeBa_hoverTime",
        "iconButton": "YDXeBa_iconButton",
        "flatSessionRowWithoutStatus": "YDXeBa_flatSessionRowWithoutStatus",
        "row-in": "YDXeBa_row-in",
        "folder": "YDXeBa_folder",
        "menuOpen": "YDXeBa_menuOpen",
        "selected": "YDXeBa_selected",
        "searchResultHeading": "YDXeBa_searchResultHeading",
        "searchResultWorkspace": "YDXeBa_searchResultWorkspace",
        "visuallyHidden": "YDXeBa_visuallyHidden",
        "projectRow": "YDXeBa_projectRow",
        "hoverStatus": "YDXeBa_hoverStatus",
        "arrowOpen": "YDXeBa_arrowOpen",
        "rowActions": "YDXeBa_rowActions",
        "chevron": "YDXeBa_chevron",
        "arrow": "YDXeBa_arrow",
        "searchResultTitle": "YDXeBa_searchResultTitle",
        "searchResultMeta": "YDXeBa_searchResultMeta",
        "slot": "YDXeBa_slot",
        "folderActive": "YDXeBa_folderActive",
        "time": "YDXeBa_time",
        "sessionRow": "YDXeBa_sessionRow",
        "meta": "YDXeBa_meta",
        "dropBefore": "YDXeBa_dropBefore",
        "searchResultSnippet": "YDXeBa_searchResultSnippet",
        "projectText": "YDXeBa_projectText",
        "hoverPath": "YDXeBa_hoverPath",
        "searchResultRow": "YDXeBa_searchResultRow"
      };
      function displayTitle(node, t) {
        return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
      }
      function timeLabel(updatedAt, now, t) {
        const { unit, n } = relativeTime(updatedAt, now);
        return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
      }
      function archiveTimeLabel(updatedAt, t) {
        const date = new Date(updatedAt);
        const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
      }
      function hoverTimeLabel(updatedAt, now, t) {
        const { unit, n } = relativeTime(updatedAt, now);
        return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
      }
      function createdLabel(createdAt, t) {
        const d = new Date(createdAt);
        const pad2 = (v) => String(v).padStart(2, "0");
        return t("hover.created", { time: `${t("date.ymd", {
          y: d.getFullYear(),
          m: d.getMonth() + 1,
          d: d.getDate()
        })} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` });
      }
      function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
        return (0, react_jsx_runtime.jsxs)("div", {
          className: Rows_module_css_default.hoverContent,
          children: [
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTitle,
              children: label
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverPath,
              children: cwd
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTime,
              children: createdLabel(createdAt, t)
            })
          ]
        });
      }
      function rowHalf(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
      }
      function ProjectRowItem({ group, onToggle, onCreate, actions, drag, t }) {
        const row = group;
        const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
        const active = group.expanded && group.containsCurrent;
        const [menuOpen, setMenuOpen] = (0, react.useState)(false);
        const workspaceMenuItems = [{
          id: "rename",
          label: t("rename"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
        }, ...actions?.canArchive === true ? [{
          id: "archive-workspace",
          label: t("menu.archiveWorkspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
        }] : [], {
          id: "delete",
          label: t("delete.workspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
          danger: true
        }];
        const ownRow = (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
          role: "treeitem",
          "aria-expanded": row.expanded,
          onClick: onToggle,
          draggable: drag !== void 0,
          onDragStart: drag === void 0 ? void 0 : (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", row.key);
            drag.start();
          },
          onDragEnd: drag?.end,
          children: [
            (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
              children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, {})
            }),
            (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
            }),
            (0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.projectText,
              children: (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.title,
                children: label
              })
            }),
            (0, react_jsx_runtime.jsxs)("span", {
              className: Rows_module_css_default.rowActions,
              children: [actions !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
                open: menuOpen,
                onClose: () => {
                  setMenuOpen(false);
                },
                items: workspaceMenuItems,
                onSelect: (id2) => {
                  setMenuOpen(false);
                  if (id2 !== "rename" && id2 !== "archive-workspace" && id2 !== "delete") return;
                  if (id2 === "rename") actions.rename();
                  else if (id2 === "archive-workspace") actions.archive();
                  else actions.delete();
                },
                portal: true,
                closeOnPointerLeave: true,
                anchor: (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: Rows_module_css_default.iconButton,
                  "aria-label": t("actions.workspace.aria", { name: label }),
                  onClick: (e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  },
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
                })
              }), (0, react_jsx_runtime.jsx)("button", {
                type: "button",
                className: Rows_module_css_default.iconButton,
                "aria-label": t("actions.newSession.aria", { name: label }),
                onClick: (e) => {
                  e.stopPropagation();
                  onCreate();
                },
                children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
              })]
            })
          ]
        });
        if (row.createdAt === void 0) return ownRow;
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
          anchor: ownRow,
          content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
            label: row.label,
            cwd: row.cwd,
            createdAt: row.createdAt,
            t
          }),
          disabled: menuOpen,
          copyText: row.cwd,
          copyLabel: t("copy"),
          copiedLabel: t("hover.copied")
        });
      }
      function assertNever(value) {
        throw new Error(`unknown pending interaction: ${String(value)}`);
      }
      function sessionStatuses(node, t) {
        const subagents = node.runningSubagentCount === 0 ? void 0 : {
          state: "ongoing",
          label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
        };
        let pending;
        switch (node.pendingInteraction) {
          case "approval":
            pending = {
              state: "warning",
              label: t("status.waitingApproval")
            };
            break;
          case "plan-review":
            pending = {
              state: "warning",
              label: t("status.planReview")
            };
            break;
          case "question":
            pending = {
              state: "warning",
              label: t("status.waitingAnswer")
            };
            break;
          case void 0:
            break;
          /* v8 ignore next -- closed PendingInteractionStatus union */
          default:
            return assertNever(node.pendingInteraction);
        }
        if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
        if (node.running) {
          const primary = {
            state: "ongoing",
            label: t("status.running")
          };
          return subagents === void 0 ? [primary] : [primary, subagents];
        }
        if (subagents !== void 0) return [subagents];
        if (node.completed) return [{
          state: "done",
          label: t("status.completed")
        }];
        return [{
          state: "done",
          label: t("status.idle")
        }];
      }
      function SessionStatusDots({ statuses }) {
        return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
          className: Rows_module_css_default.visuallyHidden,
          children: status.label
        }, status.label))] });
      }
      function SessionHoverContent({ node, now, t }) {
        const statuses = sessionStatuses(node, t);
        return (0, react_jsx_runtime.jsxs)("div", {
          className: Rows_module_css_default.hoverContent,
          children: [
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTitle,
              children: displayTitle(node, t)
            }),
            !node.blank && (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTime,
              children: hoverTimeLabel(node.updatedAt, now, t)
            }),
            statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
              className: Rows_module_css_default.hoverStatus,
              children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
            }, status.label))
          ]
        });
      }
      function SearchResultItem({ result, currentId, onOpen, t }) {
        const selected = result.id === currentId;
        const statuses = sessionStatuses(result, t);
        const primaryStatus = statuses[0];
        return (0, react_jsx_runtime.jsxs)("button", {
          type: "button",
          className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected, result.archived === true && ARCHIVED_CLASSES.row),
          role: "treeitem",
          "aria-selected": selected,
          onClick: () => {
            onOpen(result.id);
          },
          children: [(0, react_jsx_runtime.jsxs)("span", {
            className: Rows_module_css_default.searchResultHeading,
            children: [(0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.slot,
              children: (primaryStatus.state !== "done" || result.completed) && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
            }), result.archived === true && (0, react_jsx_runtime.jsx)("span", {
              className: ARCHIVED_CLASSES.badge,
              children: t("archived.badge")
            }), (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.searchResultTitle, result.archived === true && ARCHIVED_CLASSES.title),
              children: result.title
            })]
          }), (0, react_jsx_runtime.jsxs)("span", {
            className: Rows_module_css_default.searchResultMeta,
            children: [(0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.searchResultWorkspace,
              children: result.workspace
            }), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.searchResultSnippet,
              children: result.snippet
            })]
          })]
        });
      }
      function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, onUnarchive, onDeleteSession, onReveal, drag, flat = false, t }) {
        const row = node;
        const title = displayTitle(node, t);
        const selected = node.id === currentId;
        const archived = row.archived === true;
        const statuses = sessionStatuses(node, t);
        const showStatus = statuses[0].state !== "done" || row.completed;
        const [menuOpen, setMenuOpen] = (0, react.useState)(false);
        const rowRef = (0, react.useRef)(null);
        (0, react.useEffect)(() => {
          if (onReveal === void 0) return;
          rowRef.current?.scrollIntoView({ block: "nearest" });
          onReveal();
        }, [onReveal]);
        const sessionMenuItems = archived ? [
          {
            id: "unarchive",
            label: t("menu.unarchive"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
          },
          {
            id: "delete-session",
            label: t("menu.deleteSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
            danger: true
          }
        ] : [
          {
            id: "rename",
            label: t("rename"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
          },
          {
            id: "fork",
            label: t("menu.fork"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {})
          },
          {
            id: "archive",
            label: t("menu.archiveSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
          },
          {
            id: "delete-session",
            label: t("menu.deleteSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
            danger: true
          }
        ];
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
          anchor: (0, react_jsx_runtime.jsxs)("div", {
            ref: rowRef,
            className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, archived && ARCHIVED_CLASSES.row, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
            role: "treeitem",
            "aria-selected": selected,
            onClick: () => {
              if (archived) return;
              onOpen(node.id);
            },
            draggable: drag !== void 0,
            onDragStart: drag === void 0 ? void 0 : (e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", node.id);
              drag.start();
            },
            onDragEnd: drag?.end,
            onDragOver: drag === void 0 ? void 0 : (e) => {
              if (!drag.active) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              drag.hover(rowHalf(e));
            },
            onDrop: drag === void 0 ? void 0 : (e) => {
              if (!drag.active) return;
              e.preventDefault();
              drag.drop(rowHalf(e));
            },
            children: [
              (!flat || showStatus) && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.slot,
                children: showStatus && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
              }),
              archived && (0, react_jsx_runtime.jsx)("span", {
                className: ARCHIVED_CLASSES.badge,
                children: t("archived.badge")
              }),
              archived ? (0, react_jsx_runtime.jsxs)("span", {
                className: ARCHIVED_CLASSES.content,
                children: [(0, react_jsx_runtime.jsx)("span", {
                  className: clsx(Rows_module_css_default.title, ARCHIVED_CLASSES.title),
                  children: title
                }), !row.blank && (0, react_jsx_runtime.jsx)("span", {
                  className: ARCHIVED_CLASSES.meta,
                  children: timeLabel(row.updatedAt, now, t)
                })]
              }) : (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.title,
                children: title
              }),
              !row.blank && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.time,
                children: timeLabel(row.updatedAt, now, t)
              }),
              archived && !row.blank && (0, react_jsx_runtime.jsxs)("span", {
                className: ARCHIVED_CLASSES.actions,
                onClick: (e) => {
                  e.stopPropagation();
                },
                children: [(0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: ARCHIVED_CLASSES.delete,
                  "aria-label": t("menu.deleteSession"),
                  onClick: () => onDeleteSession(node.id, row.title),
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
                }), (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: ARCHIVED_CLASSES.unarchive,
                  onClick: () => onUnarchive(node.id),
                  children: t("menu.unarchive")
                })]
              }),
              !row.blank && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.rowActions,
                children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
                  open: menuOpen,
                  onClose: () => {
                    setMenuOpen(false);
                  },
                  items: sessionMenuItems,
                  onSelect: (id2) => {
                    setMenuOpen(false);
                    if (id2 === "rename") onRename(node.id, row.title);
                    if (id2 === "fork") onFork(node.id);
                    if (id2 === "archive") onArchive(node.id);
                    if (id2 === "unarchive") onUnarchive(node.id);
                    if (id2 === "delete-session") onDeleteSession(node.id, row.title);
                  },
                  portal: true,
                  closeOnPointerLeave: true,
                  anchor: (0, react_jsx_runtime.jsx)("button", {
                    type: "button",
                    className: Rows_module_css_default.iconButton,
                    "aria-label": t("actions.session.aria", { name: title }),
                    onClick: (e) => {
                      e.stopPropagation();
                      setMenuOpen((v) => !v);
                    },
                    children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
                  })
                })
              })
            ]
          }),
          content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
            node,
            now,
            t
          }),
          disabled: menuOpen || drag?.active === true,
          copyText: row.blank ? void 0 : row.title,
          copyLabel: t("copy"),
          copiedLabel: t("hover.copied")
        });
      }
      const css$1 = "._G5b-a_modalAction{min-width:72px}._G5b-a_modalError,._G5b-a_menuStatus{margin-top:8px;font-size:12px;line-height:18px}._G5b-a_modalError{color:var(--dsw-alias-state-error-primary)}._G5b-a_menuStatus{color:var(--dsw-alias-label-secondary)}";
      const tagId$1 = "@michengai/dsh-archive-manager/WorkspacePicker.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId$1;
        tag.textContent = css$1;
        document.head.appendChild(tag);
      }
      var WorkspacePicker_module_css_default = {
        "modalAction": "_G5b-a_modalAction",
        "menuStatus": "_G5b-a_menuStatus",
        "modalError": "_G5b-a_modalError"
      };
      const ADD_WORKSPACE = "::add-workspace";
      function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }) {
        const workspaceSnapshot = useWorkspaces((state) => state);
        const workspaces = workspaceSnapshot.items;
        const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
        const [errorOpen, setErrorOpen] = (0, react.useState)(false);
        const [modalError, setModalError] = (0, react.useState)(null);
        const [flowOpen, setFlowOpen] = (0, react.useState)(false);
        const [pickingFolder, setPickingFolder] = (0, react.useState)(false);
        const flowBusy = flowOpen || pickingFolder;
        const flowAvailable = useDirectoryFlow((occupied) => occupied);
        (0, react.useEffect)(() => {
          if (flowOpen && !flowAvailable) setFlowOpen(false);
        }, [flowOpen, flowAvailable]);
        const addEntries = flowAvailable ? [{
          id: ADD_WORKSPACE,
          label: t("menu.addWorkspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 16 }),
          disabled: flowBusy
        }] : [];
        const pinAdd = !addOnly && workspaces.length > 0;
        const items = pinAdd ? workspaces.map((workspace) => ({
          id: workspace.workspaceId,
          label: workspace.title,
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { size: 16 }),
          disabled: flowBusy
        })) : addEntries;
        const menuIsEmpty = items.length === 0;
        const closeModal = () => {
          setErrorOpen(false);
          setModalError(null);
        };
        const adoptDirectory = (path) => createWorkspace({ path }).then((workspace) => {
          setFlowOpen(false);
          onPick(workspace.workspaceId);
        }).catch((reason) => {
          setModalError(reason instanceof Error ? reason.message : String(reason));
          setFlowOpen(false);
          setErrorOpen(true);
        });
        const openDirectoryFlow = (0, react.useCallback)(() => {
          onClose();
          setErrorOpen(false);
          setModalError(null);
          setFlowOpen(true);
        }, [onClose]);
        const listSettled = addOnly || workspaceSnapshot.phase === "ready";
        const addIsTheOnlyEntry = !pinAdd && listSettled && addEntries.length === 1;
        (0, react.useEffect)(() => {
          if (open && addIsTheOnlyEntry && !flowBusy) openDirectoryFlow();
        }, [
          open,
          addIsTheOnlyEntry,
          flowBusy,
          openDirectoryFlow
        ]);
        const flowOwner = {
          open: flowOpen,
          busy: pickingFolder,
          onPicked: (path) => {
            setPickingFolder(true);
            adoptDirectory(path).finally(() => {
              setPickingFolder(false);
            });
          },
          onCancel: () => {
            setFlowOpen(false);
          },
          onError: (message) => {
            setFlowOpen(false);
            setModalError(message);
            setErrorOpen(true);
          }
        };
        const handleSelect = (id2) => {
          if (id2 === ADD_WORKSPACE) {
            openDirectoryFlow();
            return;
          }
          onPick(id2);
        };
        return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
          (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
            open: open && !addIsTheOnlyEntry && !menuIsEmpty,
            anchor: null,
            items,
            ...pinAdd ? { footer: addEntries } : {},
            selectedId,
            onSelect: handleSelect,
            onClose,
            side,
            portal: true,
            getAnchorRect
          }),
          open && !addIsTheOnlyEntry && !menuIsEmpty && workspaceSnapshot.phase === "pending" && (0, react_jsx_runtime.jsx)("div", {
            className: WorkspacePicker_module_css_default.menuStatus,
            role: "status",
            children: t("picker.loading")
          }),
          renderDirectoryFlow(flowOwner),
          (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: errorOpen,
            onClose: closeModal,
            closeLabel: t("close"),
            title: t("folderError.title"),
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
              variant: "outline",
              className: WorkspacePicker_module_css_default.modalAction,
              onClick: closeModal,
              children: t("cancel")
            }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
              variant: "primary",
              className: WorkspacePicker_module_css_default.modalAction,
              disabled: !flowAvailable,
              onClick: openDirectoryFlow,
              children: t("folderError.retry")
            })] }),
            children: (0, react_jsx_runtime.jsx)("div", {
              className: WorkspacePicker_module_css_default.modalError,
              role: "alert",
              children: modalError
            })
          })
        ] });
      }
      const css = '.qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}';
      const tagId = "@michengai/dsh-archive-manager/WorkspaceBrowser.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId;
        tag.textContent = css;
        document.head.appendChild(tag);
      }
      var WorkspaceBrowser_module_css_default = {
        "wide-in": "qDHVXG_wide-in",
        "searchWarning": "qDHVXG_searchWarning",
        "empty": "qDHVXG_empty",
        "deleteStatus": "qDHVXG_deleteStatus",
        "search": "qDHVXG_search",
        "fade": "qDHVXG_fade",
        "workspaceDropAfter": "qDHVXG_workspaceDropAfter",
        "searchSlot": "qDHVXG_searchSlot",
        "rail": "qDHVXG_rail",
        "searchSlotExpanded": "qDHVXG_searchSlotExpanded",
        "searchButton": "qDHVXG_searchButton",
        "workspaceDropBefore": "qDHVXG_workspaceDropBefore",
        "deleteAction": "qDHVXG_deleteAction",
        "root": "qDHVXG_root",
        "clearButton": "qDHVXG_clearButton",
        "listTopDropIndicator": "qDHVXG_listTopDropIndicator",
        "listTopDropActive": "qDHVXG_listTopDropActive",
        "headerActions": "qDHVXG_headerActions",
        "searchStatus": "qDHVXG_searchStatus",
        "sectionLabelHidden": "qDHVXG_sectionLabelHidden",
        "searchInput": "qDHVXG_searchInput",
        "listArea": "qDHVXG_listArea",
        "searchExpanded": "qDHVXG_searchExpanded",
        "list": "qDHVXG_list",
        "iconButton": "qDHVXG_iconButton",
        "sectionLabel": "qDHVXG_sectionLabel",
        "groupSection": "qDHVXG_groupSection",
        "renameInput": "qDHVXG_renameInput",
        "sessionOverflowButton": "qDHVXG_sessionOverflowButton",
        "treeBody": "qDHVXG_treeBody",
        "wide": "qDHVXG_wide",
        "flatList": "qDHVXG_flatList",
        "searchTree": "qDHVXG_searchTree",
        "sectionHeader": "qDHVXG_sectionHeader",
        "headerActionsHidden": "qDHVXG_headerActionsHidden",
        "renameError": "qDHVXG_renameError"
      };
      const EXPAND_SLIDE_MS = 300;
      const SEARCH_DEBOUNCE_MS = 250;
      const SEARCH_QUERY_MAX_CODE_UNITS = 500;
      const COLLAPSED_SESSION_LIMIT = 5;
      function sanitizeSearchQuery(value) {
        const withoutNul = value.replaceAll("\0", "");
        if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
        let end = SEARCH_QUERY_MAX_CODE_UNITS;
        const last = withoutNul.charCodeAt(end - 1);
        const next = withoutNul.charCodeAt(end);
        if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
        return withoutNul.slice(0, end);
      }
      function toggled(list, key) {
        return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
      }
      function useNativeDragAcceptance(active) {
        (0, react.useEffect)(() => {
          if (!active) return;
          const acceptDrag = (event) => {
            event.preventDefault();
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
          };
          const acceptDrop = (event) => {
            event.preventDefault();
          };
          document.addEventListener("dragover", acceptDrag);
          document.addEventListener("drop", acceptDrop);
          return () => {
            document.removeEventListener("dragover", acceptDrag);
            document.removeEventListener("drop", acceptDrop);
          };
        }, [active]);
      }
      function reconciledSessionOrder(sessionIds, stored) {
        if (stored === void 0) return [...sessionIds];
        const byId = new Map(sessionIds.map((id2) => [id2, id2]));
        const ordered = [];
        const included = /* @__PURE__ */ new Set();
        for (const key of stored) {
          const id2 = byId.get(key);
          if (id2 === void 0 || included.has(key)) continue;
          ordered.push(id2);
          included.add(key);
        }
        for (const id2 of sessionIds) {
          if (included.has(id2)) continue;
          ordered.push(id2);
        }
        return ordered;
      }
      function compareSessionRecency(a, b, byId) {
        const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
        const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
        if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
        return a < b ? -1 : 1;
      }
      function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
        let order = reconciledSessionOrder(sessionIds, previousOrder);
        if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
        else if (orderBy === "updated") {
          const promoted = sessionIds.filter((id2) => {
            const session = list.byId[id2];
            return session !== void 0 && (previousUpdatedAt[id2] === void 0 || session.updatedAt > previousUpdatedAt[id2]);
          }).sort((a, b) => compareSessionRecency(a, b, list.byId));
          if (promoted.length > 0) {
            const promotedIds = new Set(promoted);
            order = [...promoted, ...order.filter((id2) => !promotedIds.has(id2))];
          }
        }
        const updatedAt = {};
        for (const id2 of sessionIds) {
          const session = list.byId[id2];
          if (session !== void 0) updatedAt[id2] = session.updatedAt;
        }
        const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id2, index) => id2 !== previousOrder[index]);
        const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id2, timestamp]) => previousUpdatedAt[id2] !== timestamp);
        return {
          order,
          updatedAt,
          changed: orderChanged || timestampsChanged
        };
      }
      function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
        const [open, setOpen] = (0, react.useState)(false);
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
          open,
          onClose: () => {
            setOpen(false);
          },
          items: [
            {
              type: "label",
              id: "group-by",
              text: t("groupBy.label")
            },
            {
              id: "workspace",
              label: t("groupBy.workspace")
            },
            {
              id: "flat",
              label: t("groupBy.flat")
            },
            {
              type: "separator",
              id: "order-by-separator"
            },
            {
              type: "label",
              id: "order-by",
              text: t("orderBy.label")
            },
            {
              id: "manual",
              label: t("orderBy.manual")
            },
            {
              id: "updated",
              label: t("orderBy.updated")
            }
          ],
          selectedIds: [groupBy, orderBy],
          onSelect: (id2) => {
            if (id2 === "workspace" || id2 === "flat") onGroupPick(id2);
            else if (id2 === "manual" || id2 === "updated") onOrderPick(id2);
            setOpen(false);
          },
          align: "end",
          dense: true,
          portal: true,
          anchor: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
            label: t("viewOptions.label"),
            side: "bottom",
            delayMs: 500,
            children: (0, react_jsx_runtime.jsx)("button", {
              type: "button",
              className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
              "aria-label": t("viewOptions.label"),
              onClick: () => {
                setOpen((v) => !v);
              },
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPersonalizationOutline16, {})
            })
          })
        });
      }
      function workspaceGroupHalf(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
      }
      function SessionTree({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, startSession, open, forkSession, workspaces, archivedSessionIds, showArchived, onRenameRequest, onArchiveRequest, onDeleteRequest, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t, revealSessionId, onSessionRevealed }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
        const current = currentSessionId(list);
        const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)([]);
        const [drag, setDrag] = (0, react.useState)(null);
        const sessionDropCommitted = (0, react.useRef)(false);
        const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
        const workspaceDropCommitted = (0, react.useRef)(false);
        const previousOrderBy = (0, react.useRef)(orderBy);
        useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
        const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
        const revealGroup = revealSessionId === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(revealSessionId))?.workspaceId ?? "";
        (0, react.useEffect)(() => {
          if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
          setGroupExpanded(currentGroup, true);
        }, [
          current,
          currentGroup,
          setGroupExpanded,
          groupExpansion
        ]);
        (0, react.useEffect)(() => {
          if (revealGroup === void 0 || groupExpansion[revealGroup] === true) return;
          setGroupExpanded(revealGroup, true);
        }, [
          groupExpansion,
          revealGroup,
          setGroupExpanded
        ]);
        const expandedGroups = (0, react.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
        const ungroupedSessionIds = (0, react.useMemo)(() => {
          const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
          return list.ids.filter((id2) => list.byId[id2] !== void 0 && !accounted.has(id2));
        }, [list, workspaces]);
        (0, react.useEffect)(() => {
          if (list.phase !== "ready") return;
          const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
          previousOrderBy.current = orderBy;
          const accounts = [...workspaces.map((workspace) => ({
            key: workspace.workspaceId,
            sessionIds: workspace.sessionIds.filter((id2) => list.byId[id2] !== void 0)
          })), {
            key: "",
            sessionIds: ungroupedSessionIds
          }];
          for (const { key, sessionIds } of accounts) {
            const previousOrder = sessionOrderByAccount[key];
            const next = nextSessionOrderAccount({
              sessionIds,
              previousOrder,
              previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
              list,
              orderBy,
              sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
            });
            if (next.changed && typeof syncSessionOrderAccount === "function") syncSessionOrderAccount(key, next.order.map((id2) => id2), next.updatedAt);
          }
        }, [
          list,
          orderBy,
          sessionOrderByAccount,
          sessionUpdatedAtByAccount,
          syncSessionOrderAccount,
          ungroupedSessionIds,
          workspaces
        ]);
        const orderedWorkspaces = (0, react.useMemo)(() => {
          return workspaces.map((workspace) => {
            const stored = sessionOrderByAccount[workspace.workspaceId];
            const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
            return {
              ...workspace,
              sessionIds
            };
          });
        }, [sessionOrderByAccount, workspaces]);
        const orderedUngroupedSessionIds = (0, react.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
        const groups = (0, react.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, pendingInteractions, {
          expandedGroups,
          showArchived,
          ...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
        }), [
          list,
          orderedWorkspaces,
          archivedSessionIds,
          pendingInteractions,
          showArchived,
          expandedGroups,
          sessionOrderByAccount
        ]);
        (0, react.useEffect)(() => {
          if (revealSessionId === void 0 || revealGroup === void 0) return;
          const group = groups.find((candidate) => candidate.key === revealGroup);
          if (group === void 0 || !group.expanded || !group.sessions.some((row) => row.id === revealSessionId)) return;
          if (group.sessions.slice(0, COLLAPSED_SESSION_LIMIT).some((row) => row.id === revealSessionId)) return;
          setExpandedSessionGroups((keys) => keys.includes(revealGroup) ? keys : [...keys, revealGroup]);
        }, [
          groups,
          revealGroup,
          revealSessionId
        ]);
        const now = Date.now();
        const commitSessionDrag = (activeDrag, over) => {
          if (sessionDropCommitted.current) return;
          sessionDropCommitted.current = true;
          setDrag(null);
          const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
          if (group === void 0) return;
          const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
          if (targetIndex === -1) return;
          const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
          if (anchor === activeDrag.sessionId) return;
          const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
          const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
          if (accountSessionIds === void 0) return;
          const nextOrder = accountSessionIds.filter((id2) => id2 !== activeDrag.sessionId);
          const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
          nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
          setSessionOrder(activeDrag.accountKey, nextOrder.map((id2) => id2));
          if (orderBy === "updated" || activeDrag.accountKey === "") return;
          insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
            console.warn("session reorder rejected:", reason);
          });
        };
        const commitWorkspaceDrag = (activeDrag, over) => {
          if (workspaceDropCommitted.current) return;
          workspaceDropCommitted.current = true;
          setWorkspaceDrag(null);
          const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
          if (rowIndex === -1) return;
          const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
          if (anchor === activeDrag.workspaceId) return;
          const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
          const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
            console.warn("workspace reorder rejected:", reason);
          });
        };
        const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [
            workspaceDropAtListStart && (0, react_jsx_runtime.jsx)("span", {
              className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
              "aria-hidden": "true"
            }),
            (0, react_jsx_runtime.jsxs)("div", {
              className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
              role: "tree",
              "aria-label": t("section.sessions"),
              children: [groups.length === 0 && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.empty,
                children: t("empty.none")
              }), groups.map((group) => {
                const workspaceId = group.workspaceId;
                const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
                const workspaceDragProps = workspaceId === void 0 ? void 0 : {
                  start: () => {
                    workspaceDropCommitted.current = false;
                    setWorkspaceDrag({
                      workspaceId,
                      over: null
                    });
                  },
                  end: () => {
                    if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
                    else setWorkspaceDrag(null);
                    workspaceDropCommitted.current = false;
                  }
                };
                const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
                  setWorkspaceDrag((active) => active === null ? active : {
                    ...active,
                    over: {
                      id: workspaceId,
                      half
                    }
                  });
                };
                const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
                  if (workspaceDrag === null) return;
                  commitWorkspaceDrag(workspaceDrag, {
                    id: workspaceId,
                    half
                  });
                };
                return (0, react_jsx_runtime.jsxs)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter),
                  onDragOver: workspaceDrag === null || hoverWorkspace === void 0 ? void 0 : (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    hoverWorkspace(workspaceGroupHalf(e));
                  },
                  onDrop: workspaceDrag === null || dropWorkspace === void 0 ? void 0 : (e) => {
                    e.preventDefault();
                    dropWorkspace(workspaceGroupHalf(e));
                  },
                  children: [
                    (0, react_jsx_runtime.jsx)(ProjectRowItem, {
                      group,
                      t,
                      onToggle: () => {
                        if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
                        setGroupExpanded(group.key, !group.expanded);
                      },
                      onCreate: () => {
                        if (group.workspaceId !== void 0) {
                          setGroupExpanded(group.key, true);
                          startSession(group.workspaceId);
                        }
                      },
                      drag: workspaceDragProps,
                      actions: group.workspaceId === void 0 ? void 0 : {
                        canArchive: (() => {
                          const workspace = workspaces.find((item) => item.workspaceId === group.workspaceId);
                          return workspace !== void 0 && archiveableWorkspaceSessionCount(workspace, archivedSessionIds) > 0;
                        })(),
                        rename: () => {
                          if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
                        },
                        archive: () => {
                          if (group.workspaceId !== void 0) onArchiveRequest(group.workspaceId, group.label);
                        },
                        delete: () => {
                          if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
                        }
                      }
                    }),
                    (expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).map((node) => {
                      const sameGroupDrag = drag !== null && drag.accountKey === group.key;
                      return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
                        node,
                        currentId: current,
                        now,
                        onOpen: open,
                        onRename: onSessionRename,
                        onFork: (sessionId) => {
                          Promise.resolve(forkSession(sessionId)).catch((reason) => {
                            showArchivedToast(formatForkError(reason, t));
                          });
                        },
                        onArchive: onSessionArchive,
                        onUnarchive: onSessionUnarchive,
                        onDeleteSession: onSessionDelete,
                        onReveal: node.id === revealSessionId && group.key === revealGroup ? () => {
                          onSessionRevealed?.(node.id);
                        } : void 0,
                        drag: {
                          start: () => {
                            sessionDropCommitted.current = false;
                            setDrag({
                              accountKey: group.key,
                              sessionId: node.id,
                              over: null
                            });
                          },
                          active: sameGroupDrag,
                          marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
                          hover: (half) => {
                            setDrag((d) => d === null ? d : {
                              ...d,
                              over: {
                                id: node.id,
                                half
                              }
                            });
                          },
                          drop: (half) => {
                            if (drag === null) return;
                            commitSessionDrag(drag, {
                              id: node.id,
                              half
                            });
                          },
                          end: () => {
                            if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
                            else setDrag(null);
                            sessionDropCommitted.current = false;
                          }
                        },
                        t
                      }, node.id);
                    }),
                    group.sessions.length > COLLAPSED_SESSION_LIMIT && (0, react_jsx_runtime.jsx)("button", {
                      type: "button",
                      className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
                      "aria-expanded": expandedSessionGroups.includes(group.key),
                      onClick: () => {
                        setExpandedSessionGroups((keys) => toggled(keys, group.key));
                      },
                      children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
                    })
                  ]
                }, group.key);
              })]
            }),
            (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
          ]
        });
      }
      function FlatList({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, open, forkSession, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, archivedSessionIds, showArchived, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t, revealSessionId, onSessionRevealed }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
        const current = currentSessionId(list);
        const baseRows = (0, react.useMemo)(() => deriveFlat(list, archivedSessionIds, pendingInteractions, showArchived), [
          list,
          archivedSessionIds,
          pendingInteractions,
          showArchived
        ]);
        const sessionIds = (0, react.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
        const previousOrderBy = (0, react.useRef)(orderBy);
        (0, react.useEffect)(() => {
          if (list.phase !== "ready") return;
          const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
          const previousUpdatedAt = sessionUpdatedAtByAccount[FLAT_SESSION_ORDER_KEY] ?? {};
          const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
          previousOrderBy.current = orderBy;
          const next = nextSessionOrderAccount({
            sessionIds,
            previousOrder,
            previousUpdatedAt,
            list,
            orderBy,
            sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
          });
          if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id2) => id2), next.updatedAt);
        }, [
          list,
          orderBy,
          sessionOrderByAccount,
          sessionUpdatedAtByAccount,
          sessionIds,
          syncSessionOrderAccount
        ]);
        const rows = (0, react.useMemo)(() => {
          const byId = new Map(baseRows.map((row) => [row.id, row]));
          return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id2) => {
            const row = byId.get(id2);
            return row === void 0 ? [] : [row];
          });
        }, [
          baseRows,
          sessionOrderByAccount,
          sessionIds
        ]);
        const [drag, setDrag] = (0, react.useState)(null);
        const dropCommitted = (0, react.useRef)(false);
        useNativeDragAcceptance(drag !== null);
        const commitDrag = (activeDrag, over) => {
          if (dropCommitted.current) return;
          dropCommitted.current = true;
          setDrag(null);
          const targetIndex = rows.findIndex((row) => row.id === over.id);
          if (targetIndex === -1) return;
          const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
          if (anchor === activeDrag.sessionId) return;
          const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
          const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          const nextOrder = rows.map((row) => row.id).filter((id2) => id2 !== activeDrag.sessionId);
          const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
          nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
          setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id2) => id2));
        };
        const now = Date.now();
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [(0, react_jsx_runtime.jsxs)("div", {
            className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
            role: "tree",
            "aria-label": t("section.sessions"),
            children: [rows.length === 0 && (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.empty,
              children: t("empty.none")
            }), rows.map((node) => {
              const active = drag !== null;
              return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
                node,
                currentId: current,
                now,
                onOpen: open,
                onRename: onSessionRename,
                onFork: (sessionId) => {
                  Promise.resolve(forkSession(sessionId)).catch((reason) => {
                    showArchivedToast(formatForkError(reason, t));
                  });
                },
                onArchive: onSessionArchive,
                onUnarchive: onSessionUnarchive,
                onDeleteSession: onSessionDelete,
                onReveal: node.id === revealSessionId ? () => {
                  onSessionRevealed?.(node.id);
                } : void 0,
                flat: true,
                drag: {
                  start: () => {
                    dropCommitted.current = false;
                    setDrag({
                      accountKey: FLAT_SESSION_ORDER_KEY,
                      sessionId: node.id,
                      over: null
                    });
                  },
                  active,
                  marker: active && drag.over?.id === node.id ? drag.over.half : null,
                  hover: (half) => {
                    setDrag((current2) => current2 === null ? current2 : {
                      ...current2,
                      over: {
                        id: node.id,
                        half
                      }
                    });
                  },
                  drop: (half) => {
                    if (drag !== null) commitDrag(drag, {
                      id: node.id,
                      half
                    });
                  },
                  end: () => {
                    if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
                    else setDrag(null);
                    dropCommitted.current = false;
                  }
                },
                t
              }, node.id);
            })]
          }), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
        });
      }
      function SearchResults({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, open, workspaces, archivedSessionIds, showArchived, query, remote, resultLimit, t }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
        const ungroupedLabel = t("group.ungrouped");
        const currentRemote = remote.query === query ? remote : {
          query,
          status: "loading",
          items: [],
          hasMore: false
        };
        const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, pendingInteractions, currentRemote, resultLimit, showArchived, ungroupedLabel), [
          list,
          workspaces,
          query,
          archivedSessionIds,
          pendingInteractions,
          currentRemote,
          resultLimit,
          showArchived,
          ungroupedLabel
        ]);
        const pending = currentRemote.status === "loading";
        const failed = currentRemote.status === "error";
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [(0, react_jsx_runtime.jsxs)("div", {
            className: WorkspaceBrowser_module_css_default.list,
            children: [
              (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchTree,
                role: "tree",
                "aria-label": t("search.results.aria"),
                children: results.items.map((result) => (0, react_jsx_runtime.jsx)(SearchResultItem, {
                  result,
                  currentId: currentSessionId(list),
                  onOpen: open,
                  t
                }, result.id))
              }),
              pending && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchStatus,
                role: "status",
                children: t("search.pending")
              }),
              failed && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchWarning,
                role: "status",
                children: t("search.unavailable")
              }),
              !pending && results.items.length === 0 && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.empty,
                children: t("search.noMatches")
              }),
              results.hasMore && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchStatus,
                children: t("search.hasMore", { n: resultLimit })
              })
            ]
          }), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
        });
      }
      const sidebarReveal = {
        listeners: /* @__PURE__ */ new Set(),
        request(sessionId) {
          for (const listener of this.listeners) listener(sessionId);
        },
        subscribe(listener) {
          this.listeners.add(listener);
          return () => {
            this.listeners.delete(listener);
          };
        }
      };
      function WorkspaceBrowser({ wide, expandSidebar, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, archiveWorkspaceSessions, unarchiveSession, deleteSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, renderSlot, t }) {
        const preferSessionStatus = typeof useSessionStatus === "function";
        const useEffectiveSessionPendingInteraction = useSessionPendingInteraction ?? useEmptySessionPendingInteraction;
        const useEffectiveSessionStatus = useSessionStatus ?? useEmptySessionStatus;
        const workspaces = useWorkspaces((state) => state.items);
        const workspacePhase = useWorkspaces((state) => state.phase);
        const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
        const sessionSnapshot = useSessions((s) => s);
        const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
        const groupBy = useStore((s) => s.groupBy);
        const orderBy = useStore((s) => s.orderBy);
        const showArchived = useStore((s) => s.showArchived) === true;
        const groupExpansion = useStore((s) => s.groupExpansion);
        const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
        const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
        const archivedSet = (0, react.useMemo)(() => new Set(archivedSessionIds), [archivedSessionIds]);
        const [revealSessionId, setRevealSessionId] = (0, react.useState)(void 0);
        (0, react.useEffect)(() => sidebarReveal.subscribe((sessionId) => setRevealSessionId(sessionId)), []);
        const acknowledgeSessionReveal = (sessionId) => {
          setRevealSessionId((current) => current === sessionId ? void 0 : current);
        };
        const [archivedToast, setArchivedToast] = (0, react.useState)(null);
        const archivedToastSeq = (0, react.useRef)(0);
        const showArchivedToast2 = (text) => {
          archivedToastSeq.current += 1;
          setArchivedToast({
            text,
            seq: archivedToastSeq.current
          });
        };
        const guardedOpen = (sessionId) => {
          if (archivedSet.has(sessionId)) {
            showArchivedToast2(t("archived.notOpenable"));
            return;
          }
          open(sessionId);
        };
        (0, react.useEffect)(() => {
          if (workspacePhase !== "ready") return;
          actions.retainAccountKeys([
            "",
            FLAT_SESSION_ORDER_KEY,
            ...workspaces.map((workspace) => workspace.workspaceId)
          ]);
        }, [
          actions.retainAccountKeys,
          workspacePhase,
          workspaces
        ]);
        const [query, setQuery] = (0, react.useState)("");
        const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
        const normalizedQuery = sanitizeSearchQuery(query).trim();
        const [remoteSearch, setRemoteSearch] = (0, react.useState)({
          query: "",
          status: "idle",
          items: [],
          hasMore: false
        });
        const searchRoot = (0, react.useRef)(null);
        const searchInput = (0, react.useRef)(null);
        const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
        const wsPlusRef = (0, react.useRef)(null);
        const composingRef = (0, react.useRef)(false);
        const [searchOnExpand, setSearchOnExpand] = (0, react.useState)(false);
        (0, react.useEffect)(() => {
          if (wide && searchOnExpand) {
            const timer = window.setTimeout(() => {
              searchInput.current?.focus({ preventScroll: true });
              setSearchOnExpand(false);
            }, EXPAND_SLIDE_MS);
            return () => {
              window.clearTimeout(timer);
            };
          }
        }, [wide, searchOnExpand]);
        (0, react.useEffect)(() => {
          if (!wide || !searchExpanded || searchOnExpand) return;
          searchInput.current?.focus({ preventScroll: true });
        }, [
          wide,
          searchExpanded,
          searchOnExpand
        ]);
        (0, react.useEffect)(() => {
          if (!wide || !searchExpanded) return;
          const onClick = (event) => {
            if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
            searchInput.current?.blur();
            if (normalizedQuery !== "") return;
            setSearchExpanded(false);
          };
          document.addEventListener("click", onClick);
          return () => {
            document.removeEventListener("click", onClick);
          };
        }, [
          normalizedQuery,
          wide,
          searchExpanded
        ]);
        (0, react.useEffect)(() => {
          if (normalizedQuery === "") {
            setRemoteSearch({
              query: "",
              status: "idle",
              items: [],
              hasMore: false
            });
            return;
          }
          const controller = new AbortController();
          setRemoteSearch({
            query: normalizedQuery,
            status: "loading",
            items: [],
            hasMore: false
          });
          const timer = window.setTimeout(() => {
            searchSessions(normalizedQuery, controller.signal).then((result) => {
              if (controller.signal.aborted) return;
              setRemoteSearch({
                query: normalizedQuery,
                status: "ready",
                items: result.items,
                hasMore: result.hasMore
              });
            }).catch(() => {
              if (controller.signal.aborted) return;
              setRemoteSearch({
                query: normalizedQuery,
                status: "error",
                items: [],
                hasMore: false
              });
            });
          }, SEARCH_DEBOUNCE_MS);
          return () => {
            window.clearTimeout(timer);
            controller.abort();
          };
        }, [normalizedQuery, searchSessions]);
        const [renameTarget, setRenameTarget] = (0, react.useState)(null);
        const [renameDraft, setRenameDraft] = (0, react.useState)("");
        const [renaming, setRenaming] = (0, react.useState)(false);
        const [renameError, setRenameError] = (0, react.useState)(null);
        const renameTrimmed = renameDraft.trim();
        const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
        const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
        const closeRename = () => {
          if (renaming) return;
          setRenameTarget(null);
          setRenameError(null);
        };
        const confirmRename = () => {
          if (renameBlocked) return;
          setRenaming(true);
          setRenameError(null);
          renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
            setRenaming(false);
            setRenameTarget(null);
          }).catch((reason) => {
            setRenaming(false);
            setRenameError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)(null);
        const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
        const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
        const [sessionRenameError, setSessionRenameError] = (0, react.useState)(null);
        const sessionRenameTrimmed = sessionRenameDraft.trim();
        const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
        const closeSessionRename = () => {
          if (sessionRenaming) return;
          setSessionRenameTarget(null);
          setSessionRenameError(null);
        };
        const confirmSessionRename = () => {
          if (sessionRenameBlocked) return;
          setSessionRenaming(true);
          setSessionRenameError(null);
          renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
            setSessionRenaming(false);
            setSessionRenameTarget(null);
          }).catch((reason) => {
            setSessionRenaming(false);
            setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const onSessionRename = (sessionId, currentTitle) => {
          setSessionRenameTarget({
            sessionId,
            currentTitle
          });
          setSessionRenameDraft(currentTitle);
          setSessionRenameError(null);
        };
        const onSessionArchive = (sessionId) => {
          archiveSession(sessionId).catch((reason) => {
            showArchivedToast2(formatArchiveError(reason, t));
          });
        };
        const [archiveWorkspaceTarget, setArchiveWorkspaceTarget] = (0, react.useState)(null);
        const [archivingWorkspace, setArchivingWorkspace] = (0, react.useState)(false);
        const [archiveWorkspaceError, setArchiveWorkspaceError] = (0, react.useState)(null);
        const closeArchiveWorkspace = () => {
          if (archivingWorkspace) return;
          setArchiveWorkspaceTarget(null);
          setArchiveWorkspaceError(null);
        };
        const onArchiveWorkspaceRequest = (workspaceId, title) => {
          const target = archiveWorkspaceDialogTarget(workspaces, workspaceId, title, archivedSet);
          if (target === null) return;
          setArchiveWorkspaceTarget(target);
          setArchiveWorkspaceError(null);
        };
        const confirmArchiveWorkspace = () => {
          if (archivingWorkspace || archiveWorkspaceTarget === null) return;
          setArchivingWorkspace(true);
          setArchiveWorkspaceError(null);
          archiveWorkspaceSessions(archiveWorkspaceTarget.workspaceId).then(() => {
            setArchivingWorkspace(false);
            setArchiveWorkspaceTarget(null);
          }).catch((reason) => {
            const state = archiveWorkspaceDialogFailureState(archiveWorkspaceTarget, reason, t);
            setArchivingWorkspace(state.archiving);
            setArchiveWorkspaceError(state.error);
          });
        };
        const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
        const [deleting, setDeleting] = (0, react.useState)(false);
        const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)(null);
        const [deleteError, setDeleteError] = (0, react.useState)(null);
        (0, react.useEffect)(() => {
          if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
          setDeleting(false);
          setDeleteCommittedId(null);
          setDeleteTarget(null);
        }, [deleteCommittedId, workspaces]);
        const closeDelete = () => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        };
        const confirmDelete = () => {
          if (deleting || deleteTarget === null) return;
          setDeleting(true);
          setDeleteCommittedId(null);
          setDeleteError(null);
          deleteWorkspace(deleteTarget.workspaceId).then(() => {
            setDeleteCommittedId(deleteTarget.workspaceId);
          }).catch((reason) => {
            setDeleting(false);
            setDeleteError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const onSessionUnarchive = (sessionId) => {
          unarchiveSession(sessionId).catch((reason) => {
            showArchivedToast2(formatUnarchiveError(reason, t));
          });
        };
        const [deleteSessionTarget, setDeleteSessionTarget] = (0, react.useState)(null);
        const [deletingSession, setDeletingSession] = (0, react.useState)(false);
        const [deleteSessionCommittedId, setDeleteSessionCommittedId] = (0, react.useState)(null);
        const [deleteSessionError, setDeleteSessionError] = (0, react.useState)(null);
        (0, react.useEffect)(() => {
          if (deleteSessionCommittedId === null || archivedSet.has(deleteSessionCommittedId) || workspaces.some((workspace) => workspace.sessionIds.includes(deleteSessionCommittedId))) return;
          setDeletingSession(false);
          setDeleteSessionCommittedId(null);
          setDeleteSessionTarget(null);
        }, [deleteSessionCommittedId, archivedSet, workspaces]);
        const closeDeleteSession = () => {
          if (deletingSession) return;
          setDeleteSessionTarget(null);
          setDeleteSessionError(null);
        };
        const confirmDeleteSession = () => {
          if (deletingSession || deleteSessionTarget === null) return;
          setDeletingSession(true);
          setDeleteSessionError(null);
          const rootId = deleteSessionTarget.sessionId;
          deleteSession(rootId).then(() => {
            setDeletingSession(false);
            setDeleteSessionTarget(null);
            setDeleteSessionCommittedId(rootId);
          }).catch((reason) => {
            setDeletingSession(false);
            setDeleteSessionError(formatDeleteError(reason, t));
          });
        };
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
          children: [
            (0, react_jsx_runtime.jsxs)("div", {
              className: WorkspaceBrowser_module_css_default.sectionHeader,
              children: [
                wide && (0, react_jsx_runtime.jsx)("span", {
                  className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
                  children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
                }),
                wide && (0, react_jsx_runtime.jsx)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
                  children: (0, react_jsx_runtime.jsxs)("div", {
                    ref: searchRoot,
                    className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
                    onClick: () => {
                      setWsPickerOpen(false);
                      setSearchExpanded(true);
                      searchInput.current?.focus();
                    },
                    children: [
                      (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                        label: t("search"),
                        side: "bottom",
                        delayMs: 500,
                        disabled: searchExpanded,
                        children: (0, react_jsx_runtime.jsx)("button", {
                          type: "button",
                          className: WorkspaceBrowser_module_css_default.searchButton,
                          "aria-label": t("search.sessions.aria"),
                          "aria-expanded": searchExpanded,
                          onClick: () => {
                            setWsPickerOpen(false);
                            setSearchExpanded(true);
                          },
                          children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
                        })
                      }),
                      (0, react_jsx_runtime.jsx)("input", {
                        ref: searchInput,
                        className: WorkspaceBrowser_module_css_default.searchInput,
                        type: "text",
                        placeholder: t("search.placeholder"),
                        maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
                        value: query,
                        tabIndex: searchExpanded ? 0 : -1,
                        onChange: (e) => {
                          setQuery(sanitizeSearchQuery(e.target.value));
                        },
                        onKeyDown: (e) => {
                          if (e.key !== "Escape") return;
                          setQuery("");
                          setSearchExpanded(false);
                        }
                      }),
                      searchExpanded && (0, react_jsx_runtime.jsx)("button", {
                        type: "button",
                        className: WorkspaceBrowser_module_css_default.clearButton,
                        "aria-label": t("search.clear"),
                        onClick: (e) => {
                          e.stopPropagation();
                          setQuery("");
                          setSearchExpanded(false);
                        },
                        children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFill14, {})
                      })
                    ]
                  })
                }),
                (0, react_jsx_runtime.jsxs)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
                  children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
                    groupBy,
                    orderBy,
                    onGroupPick: (mode) => {
                      actions.setGroupBy(mode);
                    },
                    onOrderPick: (mode) => {
                      actions.setOrderBy(mode);
                    },
                    t
                  }), directoryFlowAvailable && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                    label: t("workspace.add"),
                    side: "bottom",
                    delayMs: 500,
                    children: (0, react_jsx_runtime.jsx)("button", {
                      ref: wsPlusRef,
                      type: "button",
                      className: WorkspaceBrowser_module_css_default.iconButton,
                      "aria-label": t("workspace.add"),
                      onClick: () => {
                        setWsPickerOpen((v) => !v);
                      },
                      children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutline16, { size: wide ? 16 : 18 })
                    })
                  })]
                }),
                (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
                  t,
                  open: wsPickerOpen,
                  anchorRef: wsPlusRef,
                  useWorkspaces,
                  createWorkspace,
                  useDirectoryFlow,
                  renderDirectoryFlow: (owner) => renderSlot(DIRECTORY_FLOW_SLOT, owner),
                  addOnly: true,
                  side: "right",
                  onPick: (workspaceId) => {
                    setWsPickerOpen(false);
                    startSession(workspaceId);
                  },
                  onClose: () => {
                    setWsPickerOpen(false);
                  }
                })
              ]
            }),
            !wide && (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.search,
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                label: t("search"),
                children: (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: WorkspaceBrowser_module_css_default.searchButton,
                  "aria-label": t("search.sessions.aria"),
                  onClick: () => {
                    setSearchExpanded(true);
                    setSearchOnExpand(true);
                    expandSidebar();
                  },
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 18 })
                })
              })
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.listArea,
              children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime.jsx)(SearchResults, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                useSessionStatus: useEffectiveSessionStatus,
                preferSessionStatus,
                open: (sessionId) => {
                  setRevealSessionId(sessionId);
                  setQuery("");
                  setSearchExpanded(false);
                  guardedOpen(sessionId);
                },
                workspaces,
                archivedSessionIds,
                showArchived,
                query: normalizedQuery,
                remote: remoteSearch,
                resultLimit: searchResultLimit,
                t
              }) : groupBy === "flat" ? (0, react_jsx_runtime.jsx)(FlatList, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                useSessionStatus: useEffectiveSessionStatus,
                preferSessionStatus,
                open: guardedOpen,
                revealSessionId,
                onSessionRevealed: acknowledgeSessionReveal,
                forkSession,
                onSessionRename,
                onSessionArchive,
                onSessionUnarchive,
                onSessionDelete: (sessionId, title) => {
                  setDeleteSessionTarget({ sessionId, title });
                  setDeleteSessionError(null);
                },
                archivedSessionIds,
                showArchived,
                orderBy,
                sessionOrderByAccount,
                sessionUpdatedAtByAccount,
                syncSessionOrderAccount: actions.syncSessionOrderAccount,
                setSessionOrder: actions.setSessionOrder,
                t
              }) : (0, react_jsx_runtime.jsx)(SessionTree, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                useSessionStatus: useEffectiveSessionStatus,
                preferSessionStatus,
                revealSessionId,
                onSessionRevealed: acknowledgeSessionReveal,
                onSessionRename,
                onSessionArchive,
                onSessionUnarchive,
                onSessionDelete: (sessionId, title) => {
                  setDeleteSessionTarget({ sessionId, title });
                  setDeleteSessionError(null);
                },
                forkSession,
                workspaces,
                groupExpansion,
                setGroupExpanded: actions.setGroupExpanded,
                sessionOrderByAccount,
                sessionUpdatedAtByAccount,
                syncSessionOrderAccount: actions.syncSessionOrderAccount,
                setSessionOrder: actions.setSessionOrder,
                archivedSessionIds,
                showArchived,
                startSession,
                open: guardedOpen,
                insertWorkspaceBefore,
                insertSessionBefore,
                orderBy,
                t,
                onRenameRequest: (workspaceId, currentTitle) => {
                  setRenameTarget({
                    workspaceId,
                    currentTitle
                  });
                  setRenameDraft(currentTitle);
                  setRenameError(null);
                },
                onArchiveRequest: onArchiveWorkspaceRequest,
                onDeleteRequest: (workspaceId, title) => {
                  setDeleteTarget({
                    workspaceId,
                    title
                  });
                  setDeleteError(null);
                }
              }))
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: renameTarget !== null,
              onClose: closeRename,
              closeLabel: t("close"),
              title: t("rename.workspace.title"),
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: renaming,
                onClick: closeRename,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "primary",
                disabled: renameBlocked,
                onClick: confirmRename,
                children: t("rename")
              })] }),
              children: [
                (0, react_jsx_runtime.jsx)("input", {
                  className: WorkspaceBrowser_module_css_default.renameInput,
                  value: renameDraft,
                  "aria-label": t("field.workspaceName"),
                  autoFocus: true,
                  disabled: renaming,
                  onFocus: (e) => {
                    e.target.select();
                  },
                  onChange: (e) => {
                    setRenameDraft(e.target.value);
                    setRenameError(null);
                  },
                  onCompositionStart: () => {
                    composingRef.current = true;
                  },
                  onCompositionEnd: () => {
                    composingRef.current = false;
                  },
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !composingRef.current) {
                      e.preventDefault();
                      confirmRename();
                    }
                  }
                }),
                renameDuplicate && (0, react_jsx_runtime.jsx)("div", {
                  className: WorkspaceBrowser_module_css_default.renameError,
                  role: "alert",
                  children: t("conflict.named", { name: renameTrimmed })
                }),
                renameError !== null && (0, react_jsx_runtime.jsx)("div", {
                  className: WorkspaceBrowser_module_css_default.renameError,
                  role: "alert",
                  children: renameError
                })
              ]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: sessionRenameTarget !== null,
              onClose: closeSessionRename,
              closeLabel: t("close"),
              title: t("rename.session.title"),
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: sessionRenaming,
                onClick: closeSessionRename,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "primary",
                disabled: sessionRenameBlocked,
                onClick: confirmSessionRename,
                children: t("rename")
              })] }),
              children: [(0, react_jsx_runtime.jsx)("input", {
                className: WorkspaceBrowser_module_css_default.renameInput,
                value: sessionRenameDraft,
                "aria-label": t("field.sessionName"),
                autoFocus: true,
                disabled: sessionRenaming,
                onFocus: (e) => {
                  e.target.select();
                },
                onChange: (e) => {
                  setSessionRenameDraft(e.target.value);
                  setSessionRenameError(null);
                },
                onCompositionStart: () => {
                  composingRef.current = true;
                },
                onCompositionEnd: () => {
                  composingRef.current = false;
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !composingRef.current) {
                    e.preventDefault();
                    confirmSessionRename();
                  }
                }
              }), sessionRenameError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: sessionRenameError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: deleteTarget !== null,
              onClose: closeDelete,
              closeLabel: t("close"),
              title: t("delete.workspace"),
              ...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: deleting,
                onClick: closeDelete,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: WorkspaceBrowser_module_css_default.deleteAction,
                disabled: deleting,
                onClick: confirmDelete,
                children: t("delete.workspace")
              })] }),
              children: [deleting && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("delete.pending")
              }), deleteError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: deleteError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: archiveWorkspaceTarget !== null,
              onClose: closeArchiveWorkspace,
              closeLabel: t("close"),
              title: archiveWorkspaceTarget === null ? "" : t("archiveWorkspace.title", { n: archiveWorkspaceTarget.count }),
              ...archiveWorkspaceTarget === null ? {} : { description: t("archiveWorkspace.desc", { name: archiveWorkspaceTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: archivingWorkspace,
                onClick: closeArchiveWorkspace,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: "dsham_archiveWorkspaceConfirm",
                disabled: archivingWorkspace,
                onClick: confirmArchiveWorkspace,
                children: t("archiveWorkspace.confirm")
              })] }),
              children: [archivingWorkspace && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("archiveWorkspace.pending")
              }), archiveWorkspaceError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: archiveWorkspaceError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: deleteSessionTarget !== null,
              onClose: closeDeleteSession,
              closeLabel: t("close"),
              title: t("deleteSession.title"),
              ...deleteSessionTarget === null ? {} : { description: t("deleteSession.desc", { name: deleteSessionTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: deletingSession,
                onClick: closeDeleteSession,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: WorkspaceBrowser_module_css_default.deleteAction,
                disabled: deletingSession,
                onClick: confirmDeleteSession,
                children: t("deleteSession.title")
              })] }),
              children: [deletingSession && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("deleteSession.pending")
              }), deleteSessionError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: deleteSessionError
              })]
            }),
            archivedToast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
              key: archivedToast.seq,
              text: archivedToast.text,
              onDone: () => {
                setArchivedToast(null);
              }
            })
          ]
        });
      }
      const ARCHIVE_TABS_CSS = ".dsham_archiveTabs{display:flex;gap:24px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_archiveTab{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:12px 2px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-weight:600;cursor:pointer}.dsham_archiveTab[aria-selected=true]{border-bottom-color:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary)}.dsham_archiveTab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsham_archiveTab:disabled{opacity:.5;cursor:not-allowed}@container(max-width:520px){.dsham_archiveTabs{gap:16px}}";
      const ARCHIVE_SETTINGS_CSS = ".dsham_settings{container-type:inline-size;min-width:0;box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dsham_settingsHeader{display:flex;flex-direction:column;align-items:stretch;gap:16px;margin-bottom:16px}.dsham_settings h2{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;white-space:nowrap}.dsham_settingsIntro{margin:12px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}.dsham_settingsDanger{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;color:var(--dsw-alias-state-error-primary);background:transparent;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)}.dsham_settingsToolbar{display:grid;grid-template-columns:minmax(150px,1fr) repeat(3,minmax(0,126px));align-items:center;gap:8px;margin-bottom:16px}.dsham_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0;flex:1;height:32px;padding:0 12px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px}.dsham_settingsSearch:focus-within{border-color:var(--dsw-alias-label-tertiary)}.dsham_settingsSearch input{width:100%;min-width:0;padding:0;color:var(--dsw-alias-label-primary);background:transparent;border:0;outline:0;font:inherit;font-size:12px}.dsham_settingsSearch input::placeholder{color:var(--dsw-alias-label-tertiary)}.dsham_settingsFilter{position:relative;min-width:0;flex:none}.dsham_selectTrigger{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:32px;padding:0 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;line-height:20px;text-align:left}.dsham_selectTrigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_selectTrigger:focus-visible{outline:2px solid var(--dsw-alias-label-secondary);outline-offset:2px}.dsham_selectTrigger[aria-expanded='true']{border-color:var(--dsw-alias-label-tertiary)}.dsham_selectValue{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_selectCaret{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary)}.dsham_selectMenu{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;box-sizing:border-box;min-width:100%;max-height:280px;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-shadow-lv3)}.dsham_selectOption{box-sizing:border-box;display:flex;align-items:center;width:100%;min-height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}.dsham_selectOption:hover,.dsham_selectOption[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}.dsham_selectOption[aria-selected='true']{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsGroup{margin:0 0 20px}.dsham_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.dsham_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.dsham_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}.dsham_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}.dsham_settingsList{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.dsham_settingsRow{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:64px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsRow:last-child{border-bottom:0}.dsham_settingsContent{min-width:0;flex:1}.dsham_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsMeta{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dsham_settingsActions{display:flex;align-items:center;gap:4px;flex:none}.dsham_settingsAction{min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsAction:hover{filter:brightness(1.12)}.dsham_settingsDelete{display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dsham_settingsDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}.dsham_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}@container(max-width:520px){.dsham_settingsHeader{margin-bottom:16px}.dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:16px}.dsham_settingsSearch{grid-column:1/-1}.dsham_settingsFilter{flex:1;min-width:0}.dsham_settingsGroup{margin-bottom:32px}.dsham_settingsRow{padding:10px 12px}.dsham_settingsActions{gap:4px}}";
      const ARCHIVE_SETTINGS_BATCH_CSS = ".dsham_favorite,.dsham_restoreIcon{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;background:transparent;border-radius:6px;color:var(--dsw-alias-label-secondary);cursor:pointer}.dsham_favorite{font-size:22px}.dsham_favorite[aria-pressed=true]{color:var(--dsw-alias-state-warn-primary)}.dsham_favorite:hover,.dsham_restoreIcon:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_favorite:disabled,.dsham_restoreIcon:disabled{opacity:.5;cursor:not-allowed}.dsham_settingsTitleLink{display:block;max-width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:600;line-height:20px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.dsham_settingsTitleLink:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px}.dsham_settingsTitleLink:disabled{cursor:default;opacity:.6}.dsham_groupToggle{display:flex;align-items:center;gap:8px;min-width:0;max-width:100%;padding:4px 0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.dsham_groupToggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsRow[data-selected=true]{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsTitleLink:focus-visible,.dsham_groupToggle:focus-visible,.dsham_favorite:focus-visible,.dsham_restoreIcon:focus-visible,.dsham_settingsGroupMenu:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:2px}.dsham_selectTrigger:disabled{opacity:.5;cursor:not-allowed}@container(max-width:620px){.dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr))}.dsham_settingsSearch{grid-column:1/-1}}@container(max-width:400px){.dsham_settingsRow{gap:8px;padding:10px 8px}.dsham_settingsActions{gap:0}.dsham_settingsMeta{font-size:11px}.dsham_selectTrigger{font-size:12px;padding:0 8px}}.dsham_settingsHeaderActions,.dsham_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:wrap}.dsham_settingsRestoreAll{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsRestoreAll:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsRestoreAll:disabled,.dsham_settingsDanger:disabled,.dsham_settingsGroupMenu:disabled{cursor:not-allowed;opacity:.5}.dsham_settingsGroupMenu{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dsham_settingsGroupMenu:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}@media(max-width:720px){.dsham_settingsHeader{flex-direction:column}.dsham_settingsHeaderActions{align-self:flex-start}}";
      const ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS = ".dsham_settingsTitleRow{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}.dsham_settingsLinks{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.dsham_settingsExternalLink{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap}.dsham_settingsExternalLink:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsExternalLink:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsham_settingsExternalLink svg{flex:none}@media(max-width:720px){.dsham_settingsTitleRow{flex-wrap:wrap}}";
      const ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS = ".dsham_settingsDeleteConfirm{color:var(--dsw-alias-state-error-primary)!important;background:transparent!important;border-color:var(--dsw-alias-state-error-primary)!important}.dsham_settingsDeleteConfirm:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)!important}.dsham_settingsDeleteConfirm:focus-visible{outline:2px solid var(--dsw-alias-state-error-secondary);outline-offset:2px}.dsham_settingsDeleteConfirm:disabled{cursor:not-allowed;opacity:.5}";
      const ARCHIVE_WORKSPACE_CONFIRM_CSS = ".dsham_archiveWorkspaceConfirm{color:var(--dsw-alias-state-error-primary)!important;background:transparent!important;border-color:var(--dsw-alias-state-error-primary)!important}.dsham_archiveWorkspaceConfirm:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)!important}.dsham_archiveWorkspaceConfirm:focus-visible{outline:2px solid var(--dsw-alias-state-error-secondary);outline-offset:2px}.dsham_archiveWorkspaceConfirm:disabled{cursor:not-allowed;opacity:.5}";
      const ARCHIVE_SETTINGS_SELECTION_CSS = ".dsham_settingsSelection{margin:-8px 0 16px;padding:4px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsSelectionMain{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;min-height:36px}.dsham_settingsSelectionSummary{display:flex;flex-wrap:wrap;align-items:center;gap:12px;min-width:0;max-width:100%}.dsham_settingsSelectionToggle{display:inline-flex;flex:none;white-space:nowrap;align-items:center;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;cursor:pointer}.dsham_settingsCheckbox{flex:none;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary)}.dsham_settingsSelectionClear{flex:none;min-height:28px;padding:0 0 0 12px;border:0;border-left:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-state-business-primary,#3b82f6);font:inherit;font-size:13px;white-space:nowrap;cursor:pointer}.dsham_settingsSelectionClear:hover:not(:disabled){text-decoration:underline}.dsham_settingsSelectionActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;max-width:100%;margin-left:auto}.dsham_settingsSelectionAction{flex:none;white-space:nowrap;min-height:32px;padding:0 14px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsSelectionAction:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsSelectionArchive,.dsham_settingsSelectionDelete{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.dsham_settingsSelectionScope{margin:8px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow-wrap:anywhere}.dsham_settingsSelectionAction:disabled,.dsham_settingsSelectionClear:disabled{cursor:not-allowed;opacity:.5}.dsham_settingsSelectionAction:focus-visible,.dsham_settingsSelectionClear:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:3px}";
      const ARCHIVE_SETTINGS_LAYOUT_OVERRIDE = ".dsham_settings{margin:0 auto!important}@media(max-width:720px){.dsham_settings{margin:0 auto!important}}";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-archive-manager/ArchiveSettings.layout.css") + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = "dsh-archive-manager/ArchiveSettings.layout.css";
        tag.textContent = ARCHIVE_SETTINGS_LAYOUT_OVERRIDE + ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS + ARCHIVE_WORKSPACE_CONFIRM_CSS;
        document.head.appendChild(tag);
      }
      function ArchiveProjectSelect({ id: id2, value, options, onChange, disabled = false, "aria-label": ariaLabel }) {
        const [open, setOpen] = (0, react.useState)(false);
        const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
        const [active, setActive] = (0, react.useState)(selectedIndex);
        const rootRef = (0, react.useRef)(null);
        const triggerRef = (0, react.useRef)(null);
        const listRef = (0, react.useRef)(null);
        const wasOpen = (0, react.useRef)(false);
        const selected = options[selectedIndex];
        (0, react.useEffect)(() => {
          if (!open) return;
          setActive(selectedIndex);
          const onPointerDown = (event) => {
            const target = event.target;
            if (target instanceof Node && rootRef.current?.contains(target) === true) return;
            setOpen(false);
          };
          document.addEventListener("pointerdown", onPointerDown);
          return () => document.removeEventListener("pointerdown", onPointerDown);
        }, [open, selectedIndex]);
        (0, react.useEffect)(() => {
          if (open) {
            listRef.current?.focus();
            wasOpen.current = true;
            return;
          }
          if (wasOpen.current) {
            triggerRef.current?.focus();
            wasOpen.current = false;
          }
        }, [open]);
        (0, react.useEffect)(() => {
          if (!open) return;
          document.getElementById(id2 + "-opt-" + String(active))?.scrollIntoView({ block: "nearest" });
        }, [active, open, id2]);
        const choose = (next) => {
          if (disabled) return;
          onChange(next);
          setOpen(false);
        };
        const move = (next) => {
          if (options.length === 0) return;
          setActive(Math.min(options.length - 1, Math.max(0, next)));
        };
        return (0, react_jsx_runtime.jsxs)("div", {
          className: "dsham_settingsFilter",
          ref: rootRef,
          children: [(0, react_jsx_runtime.jsxs)("button", {
            id: id2,
            ref: triggerRef,
            type: "button",
            className: "dsham_selectTrigger",
            disabled,
            "aria-label": ariaLabel,
            "aria-haspopup": "listbox",
            "aria-expanded": open,
            "aria-controls": id2 + "-list",
            onClick: () => setOpen((current) => !current),
            onKeyDown: (event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
              }
            },
            children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_selectValue", children: selected === void 0 ? "" : selected.label }), (0, react_jsx_runtime.jsx)("svg", {
              className: "dsham_selectCaret",
              viewBox: "0 0 12 12",
              "aria-hidden": true,
              focusable: false,
              children: (0, react_jsx_runtime.jsx)("path", {
                d: "M2.5 4.5L6 8l3.5-3.5",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              })
            })]
          }), open ? (0, react_jsx_runtime.jsx)("div", {
            id: id2 + "-list",
            ref: listRef,
            className: "dsham_selectMenu",
            role: "listbox",
            tabIndex: 0,
            "aria-activedescendant": id2 + "-opt-" + String(active),
            onKeyDown: (event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(active + 1);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                move(active - 1);
                return;
              }
              if (event.key === "Home") {
                event.preventDefault();
                move(0);
                return;
              }
              if (event.key === "End") {
                event.preventDefault();
                move(options.length - 1);
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const option = options[active];
                if (option !== void 0) choose(option.value);
                return;
              }
              if (event.key === "Escape" || event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
                setOpen(false);
              }
            },
            children: options.map((option, index) => (0, react_jsx_runtime.jsx)("button", {
              id: id2 + "-opt-" + String(index),
              type: "button",
              role: "option",
              className: "dsham_selectOption",
              "aria-selected": option.value === value,
              "data-active": index === active,
              onMouseEnter: () => setActive(index),
              onClick: () => choose(option.value),
              children: option.label
            }, option.value === "all" ? "all" : option.value))
          }) : null]
        });
      }
      function ArchiveSelectionToolbar({ selectedCount, hiddenCount, allVisibleSelected, selectedVisibleCount, visibleCount, busy, t, onToggle, onClear, onRestore, onDelete, onArchive }) {
        const hasSelection = selectedCount > 0;
        return (0, react_jsx_runtime.jsxs)("div", {
          className: "dsham_settingsSelection",
          children: [(0, react_jsx_runtime.jsxs)("div", {
            className: "dsham_settingsSelectionMain",
            children: [(0, react_jsx_runtime.jsxs)("div", {
              className: "dsham_settingsSelectionSummary",
              children: [(0, react_jsx_runtime.jsxs)("label", {
                className: "dsham_settingsSelectionToggle",
                title: t("archives.selectAllFiltered"),
                children: [(0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, {
                  checked: allVisibleSelected,
                  indeterminate: selectedVisibleCount > 0 && !allVisibleSelected,
                  disabled: busy || visibleCount === 0,
                  label: t("archives.selectAllFiltered"),
                  onChange: (event) => onToggle(event.target.checked)
                }), (0, react_jsx_runtime.jsx)("span", { "aria-live": "polite", children: hasSelection ? t("archives.selectedCount", { n: selectedCount }) : t("archives.selectAllFiltered") })]
              }), hasSelection && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionClear", disabled: busy, "aria-label": t("archives.clearSelection"), onClick: onClear, children: t("archives.clearSelectionShort") })]
            }), hasSelection && (0, react_jsx_runtime.jsxs)("div", {
              className: "dsham_settingsSelectionActions",
              children: onArchive ? [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionAction dsham_settingsSelectionArchive", disabled: busy, onClick: onArchive, children: t("archives.archiveSelected") })] : [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionAction", disabled: busy, "aria-label": t("archives.restoreSelected"), onClick: onRestore, children: t("archives.restore") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionAction dsham_settingsSelectionDelete", disabled: busy, "aria-label": t("archives.deleteSelected"), onClick: onDelete, children: t("archives.deleteSelectionShort") })]
            })]
          }), hiddenCount > 0 && (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsSelectionScope", role: "status", children: t("archives.selectionHiddenHint", { hidden: hiddenCount }) })]
        });
      }
      function ArchiveSelectionCheckbox({ checked, indeterminate = false, disabled = false, label, onChange }) {
        const inputRef = (0, react.useRef)(null);
        (0, react.useEffect)(() => {
          if (inputRef.current !== null) inputRef.current.indeterminate = indeterminate;
        }, [indeterminate]);
        return (0, react_jsx_runtime.jsx)("input", {
          ref: inputRef,
          type: "checkbox",
          className: "dsham_settingsCheckbox",
          checked,
          disabled,
          "aria-label": label,
          onChange
        });
      }
      function ArchivedSessionMenu({ busy, title, t, onPreview, onRestoreOpen, onDelete, onCopyId, onCopyPath }) {
        const [open, setOpen] = (0, react.useState)(false);
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
          open,
          onClose: () => setOpen(false),
          portal: true,
          align: "end",
          autoFocus: true,
          items: [
            ...onPreview ? [{ id: "preview", label: t("discovery.preview"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {}) }] : [],
            ...onRestoreOpen ? [{ id: "restoreOpen", label: t("archives.restoreOpen"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {}) }] : [],
            ...onCopyId ? [{ id: "copyId", label: t("details.copyId"), icon: react.createElement(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {}) }] : [],
            ...onCopyPath ? [{ id: "copyPath", label: t("details.copyPath"), icon: react.createElement(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}) }] : [],
            ...onDelete ? [{ id: "delete", label: t("menu.deleteSession"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}), danger: true }] : []
          ],
          onSelect: (id2) => {
            setOpen(false);
            if (busy) return;
            if (id2 === "copyId") return onCopyId?.();
            if (id2 === "copyPath") return onCopyPath?.();
            if (id2 === "preview") return onPreview?.();
            if (id2 === "restoreOpen") return onRestoreOpen();
            if (id2 === "delete") onDelete();
          },
          anchor: (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsGroupMenu", disabled: busy, title: t("archives.moreActions"), "aria-label": t("archives.moreActions") + t("common.separator") + title, "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((value) => !value), children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {}) })
        });
      }
      function ArchivedGroupActions({ group, busy, onArchive, onRestore, onDelete, t }) {
        const [open, setOpen] = (0, react.useState)(false);
        const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
        const items = onArchive ? [{
          id: "archive",
          label: t(ungrouped ? "archives.archiveUngrouped" : "archives.archiveProject"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 }),
          danger: true
        }] : [{
          id: "restore",
          label: t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {})
        }, {
          id: "delete",
          label: t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
          danger: true
        }];
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
          open,
          onClose: () => setOpen(false),
          items,
          onSelect: (id2) => {
            setOpen(false);
            if (busy) return;
            if (id2 === "archive") onArchive?.();
            else if (id2 === "restore") onRestore();
            else if (id2 === "delete") onDelete();
          },
          portal: true,
          anchor: (0, react_jsx_runtime.jsx)("button", {
            type: "button",
            className: "dsham_settingsGroupMenu",
            disabled: busy,
            "aria-label": t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title }),
            onClick: () => setOpen((current) => !current),
            children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
          })
        });
      }
      const ARCHIVE_UNGROUPED_KEY = "__ungrouped__";
      function archivedBatchTargetForGroup(groupKey) {
        return groupKey === ARCHIVE_UNGROUPED_KEY ? { scope: "ungrouped" } : { scope: "workspace", workspaceId: groupKey };
      }
      function deriveArchivedBatchIds(archivedSessionIds, items, target) {
        const ids = [...new Set(archivedSessionIds ?? [])];
        if (target.scope === "all") return ids;
        if (target.scope === "sessions") {
          const selected = new Set(target.sessionIds ?? []);
          return ids.filter((id2) => selected.has(id2));
        }
        if (target.scope === "workspace") {
          const accounted2 = new Set(items.find((workspace) => workspace.workspaceId === target.workspaceId)?.sessionIds ?? []);
          return ids.filter((id2) => accounted2.has(id2));
        }
        const accounted = new Set(items.flatMap((workspace) => workspace.sessionIds));
        return ids.filter((id2) => !accounted.has(id2));
      }
      function archivedSessionIdsInGroups(groups) {
        return [...new Set(groups.flatMap((group) => group.sessions.map((session) => session.id)))];
      }
      function pruneArchivedSelection(selectedSessionIds, archivedSessionIds) {
        const archived = new Set(archivedSessionIds);
        return [...new Set(selectedSessionIds)].filter((id2) => archived.has(id2));
      }
      function toggleArchivedSelection(selectedSessionIds, sessionIds, checked) {
        const selected = new Set(selectedSessionIds);
        for (const sessionId of sessionIds) {
          if (checked) selected.add(sessionId);
          else selected.delete(sessionId);
        }
        return [...selected];
      }
      function archivedDeleteFeedback(result, t) {
        const deleted = result.deletedSessionIds.length;
        const skipped = result.skippedSessionIds.length;
        if (result.failures.length > 0) return {
          kind: "error",
          message: t("archives.deletePartial", { deleted, skipped, failed: result.failures.length, detail: result.failures[0].message })
        };
        if (skipped > 0 && deleted > 0) return {
          kind: "notice",
          message: t("archives.deleteSuccessWithSkipped", { deleted, skipped })
        };
        if (skipped > 0) return {
          kind: "notice",
          message: t("archives.deleteSkipped", { n: skipped })
        };
        return { kind: "notice", message: t("archives.deleteSuccess", { n: deleted }) };
      }
      function unarchivedSessionIds(byId, archivedSessionIds) {
        const archived = new Set(archivedSessionIds);
        return Object.values(byId).filter((session) => session.origin !== "subagent" && !session.blank && !archived.has(session.id)).map((session) => session.id);
      }
      function deriveArchivedGroups(byId, items, archivedSessionIds, ungroupedLabel) {
        const byWorkspace = items.map((workspace) => ({
          key: workspace.workspaceId,
          title: workspace.title,
          ids: new Set(workspace.sessionIds),
          sessions: []
        }));
        const ungrouped = [];
        for (const id2 of archivedSessionIds) {
          const session = byId[id2];
          if (session === void 0 || session.origin === "subagent") continue;
          const group = byWorkspace.find((workspace) => workspace.ids.has(id2));
          (group === void 0 ? ungrouped : group.sessions).push(session);
        }
        const result = byWorkspace.filter((group) => group.sessions.length > 0);
        if (ungrouped.length > 0) result.push({ key: ARCHIVE_UNGROUPED_KEY, title: ungroupedLabel, sessions: ungrouped });
        return result;
      }
      function sortArchivedGroups(groups, sortBy, createdAtById, t, details = {}) {
        const compareText = (left, right) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
        const timestampOf = (session) => {
          const value = sortBy === "created" ? details[session.id]?.createdAt ?? createdAtById[session.id] : session.updatedAt;
          return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
        };
        const compareSessions = (left, right) => {
          if (sortBy === "turnsAsc" || sortBy === "turnsDesc") {
            const difference = compareTurnCounts(details[left.id]?.turnCount, details[right.id]?.turnCount, sortBy);
            if (difference) return difference;
          }
          if (sortBy !== "alphabetical") {
            const byTime = timestampOf(right) - timestampOf(left);
            if (Number.isFinite(byTime) && byTime !== 0) return byTime;
          }
          return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
        };
        const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
        return result.sort((left, right) => {
          if (sortBy === "turnsAsc" || sortBy === "turnsDesc") {
            const difference = compareTurnCounts(details[left.sessions[0]?.id]?.turnCount, details[right.sessions[0]?.id]?.turnCount, sortBy);
            if (difference) return difference;
          }
          if (sortBy !== "alphabetical") {
            const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
            if (Number.isFinite(byTime) && byTime !== 0) return byTime;
          }
          return compareText(left.title, right.title) || compareText(left.key, right.key);
        });
      }
      const zh = {
        ...organizerZh,
        ...discoveryZh,
        ...healthZh,
        "locale.language": "zh",
        "service.unavailable": "\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u8BD5",
        "archives.archiveProject": "\u5F52\u6863\u8BE5\u9879\u76EE\u7684\u5168\u90E8\u804A\u5929",
        "archives.archiveUngrouped": "\u5F52\u6863\u5168\u90E8\u672A\u5206\u7EC4\u804A\u5929",
        "archives.archiveProjectDesc": "\u5C06\u201C{name}\u201D\u4E2D\u5168\u90E8 {n} \u6761\u672A\u5F52\u6863\u4F1A\u8BDD\u5F52\u6863\uFF0C\u4E0D\u53D7\u5F53\u524D\u641C\u7D22\u7B5B\u9009\u5F71\u54CD\u3002\u4E4B\u540E\u53EF\u5728\u201C\u5DF2\u5F52\u6863\u201D\u4E2D\u6062\u590D\u3002",
        "archives.archiveUngroupedDesc": "\u5C06\u5168\u90E8 {n} \u6761\u672A\u5206\u7EC4\u7684\u672A\u5F52\u6863\u4F1A\u8BDD\u5F52\u6863\uFF0C\u4E0D\u53D7\u5F53\u524D\u641C\u7D22\u7B5B\u9009\u5F71\u54CD\u3002\u4E4B\u540E\u53EF\u5728\u201C\u5DF2\u5F52\u6863\u201D\u4E2D\u6062\u590D\u3002",
        "archives.tab.archived": "\u5DF2\u5F52\u6863",
        "archives.tab.unarchived": "\u672A\u5F52\u6863",
        "archives.searchUnarchived": "\u641C\u7D22\u672A\u5F52\u6863\u804A\u5929",
        "archives.emptyUnarchived": "\u6682\u65E0\u672A\u5F52\u6863\u4F1A\u8BDD\u3002",
        "archives.archiveSelected": "\u5F52\u6863",
        "archives.openSession": "\u6253\u5F00",
        "archives.moreActions": "\u66F4\u591A\u64CD\u4F5C",
        "archives.archiveSelectedDesc": "\u5C06\u9009\u4E2D\u7684\u4F1A\u8BDD\u5F52\u6863\uFF0C\u5305\u542B\u5F53\u524D\u7B5B\u9009\u9690\u85CF\u7684\u5DF2\u9009\u9879\u3002\u4E4B\u540E\u53EF\u5728\u201C\u5DF2\u5F52\u6863\u201D\u4E2D\u67E5\u770B\u548C\u6062\u590D\u3002",
        "archives.archiveSuccess": "\u5DF2\u5F52\u6863 {n} \u6761\u4F1A\u8BDD\u3002",
        "archives.archiveBatchFailed": "\u6279\u91CF\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
        "archives.navigationUnavailable": "\u5F53\u524D\u5BBF\u4E3B\u65E0\u6CD5\u4FDD\u6301\u5F52\u6863\u5BF9\u8BDD\uFF0C\u8BF7\u4F7F\u7528\u201C\u6062\u590D\u5E76\u6253\u5F00\u201D\u3002",
        "archives.sessionNotRetained": "\u5BBF\u4E3B\u672A\u4FDD\u7559\u76EE\u6807\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u6216\u6062\u590D\u540E\u518D\u8BD5\u3002",
        "archives.restoreOpen": "\u6062\u590D\u6253\u5F00",
        "archives.selectedCount": "\u5DF2\u9009 {n} \u6761",
        "archives.selectionHiddenHint": "\u542B\u5F53\u524D\u672A\u663E\u793A\u7684 {hidden} \u6761\uFF0C\u4E5F\u5C06\u53C2\u4E0E\u64CD\u4F5C",
        "archives.clearSelectionShort": "\u6E05\u7A7A",
        "archives.restore": "\u6062\u590D",
        "archives.archiveTitle": "\u5F52\u6863 {n} \u4E2A\u804A\u5929\uFF1F",
        "archives.deleteSelectionShort": "\u5220\u9664",
        "archives.clearSelection": "\u6E05\u7A7A\u9009\u62E9",
        "group.ungrouped": "\u672A\u5206\u7EC4",
        "session.new": "\u65B0\u4F1A\u8BDD",
        "section.workspaces": "\u5DE5\u4F5C\u533A",
        "section.sessions": "\u4F1A\u8BDD",
        "viewOptions.label": "\u89C6\u56FE\u9009\u9879",
        "groupBy.label": "\u5206\u7EC4\u65B9\u5F0F",
        "groupBy.workspace": "\u6309\u5DE5\u4F5C\u533A",
        "groupBy.flat": "\u5355\u5217\u8868",
        "orderBy.label": "\u6392\u5E8F\u65B9\u5F0F",
        "orderBy.manual": "\u624B\u52A8\u6392\u5E8F",
        "orderBy.updated": "\u6700\u8FD1\u66F4\u65B0",
        "sessions.expand": "\u5C55\u5F00\u5176\u4F59 {n} \u4E2A\u4F1A\u8BDD",
        "sessions.collapse": "\u6536\u8D77",
        "empty.none": "\u6682\u65E0\u4F1A\u8BDD",
        "workspace.add": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
        "search.sessions.aria": "\u641C\u7D22\u4F1A\u8BDD",
        "search.placeholder": "\u641C\u7D22\u4F1A\u8BDD\u2026",
        "search.clear": "\u6E05\u9664\u641C\u7D22",
        "search.results.aria": "\u641C\u7D22\u7ED3\u679C",
        "search.pending": "\u6B63\u5728\u641C\u7D22\u4F1A\u8BDD\u5386\u53F2\u2026",
        "search.unavailable": "\u5185\u5BB9\u641C\u7D22\u6682\u4E0D\u53EF\u7528\uFF0C\u4EC5\u663E\u793A\u540D\u79F0\u5339\u914D\u3002",
        "search.noMatches": "\u65E0\u5339\u914D\u4F1A\u8BDD",
        "search.hasMore": "\u4EC5\u663E\u793A\u524D {n} \u6761\u7ED3\u679C\uFF0C\u8BF7\u7F29\u5C0F\u641C\u7D22\u8303\u56F4\u3002",
        "menu.addWorkspace": "\u6DFB\u52A0\u5DE5\u4F5C\u533A\u2026",
        "menu.unarchive": "\u53D6\u6D88\u5F52\u6863",
        "menu.deleteSession": "\u5220\u9664\u4F1A\u8BDD",
        "archived.badge": "\u5F52\u6863\u4F1A\u8BDD",
        "archived.notOpenable": "\u5DF2\u5F52\u6863\uFF0C\u53D6\u6D88\u5F52\u6863\u540E\u53EF\u7EE7\u7EED\u5BF9\u8BDD",
        "archives.title": "\u5F52\u6863\u4F1A\u8BDD",
        "archives.description": "\u7BA1\u7406\u5DF2\u5F52\u6863\u4F1A\u8BDD\uFF0C\u6216\u9009\u62E9\u672A\u5F52\u6863\u4F1A\u8BDD\u8FDB\u884C\u6279\u91CF\u5F52\u6863\u3002",
        "archives.viewProject": "GitHub",
        "archives.feedback": "\u95EE\u9898\u53CD\u9988",
        "archives.empty": "\u6682\u65E0\u5DF2\u5F52\u6863\u4F1A\u8BDD",
        "archives.emptyFiltered": "\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u804A\u5929",
        "archives.searchPlaceholder": "\u641C\u7D22\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.sortBy": "\u6392\u5E8F\u65B9\u5F0F",
        "archives.sortUpdated": "\u66F4\u65B0\u65F6\u95F4",
        "archives.sortCreated": "\u521B\u5EFA\u65F6\u95F4",
        "archives.sortAlphabetical": "\u6309\u5B57\u6BCD\u987A\u5E8F",
        "archives.projectFilter": "\u6309\u9879\u76EE\u7B5B\u9009",
        "archives.allProjects": "\u6240\u6709\u9879\u76EE",
        "archives.sessionCount": "{n} \u4E2A\u804A\u5929",
        "archives.selectAllFiltered": "\u5168\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C",
        "archives.selectSession": "\u9009\u62E9\u4F1A\u8BDD\u201C{name}\u201D",
        "archives.restoreSelected": "\u6062\u590D\u6240\u9009",
        "archives.deleteSelected": "\u5220\u9664\u6240\u9009",
        "archives.timestamp": "{date}\uFF0C{time}",
        "archives.restoreAll": "\u5168\u90E8\u6062\u590D",
        "archives.restoreProject": "\u6062\u590D\u9879\u76EE\u5168\u90E8\u804A\u5929",
        "archives.restoreUngrouped": "\u5168\u90E8\u6062\u590D",
        "archives.deleteProject": "\u5220\u9664\u9879\u76EE\u5168\u90E8\u804A\u5929",
        "archives.deleteUngrouped": "\u5168\u90E8\u5220\u9664",
        "archives.projectActions": "\u9879\u76EE\u201C{name}\u201D\u7684\u5F52\u6863\u64CD\u4F5C",
        "archives.ungroupedActions": "\u672A\u5206\u7EC4\u804A\u5929\u7684\u5F52\u6863\u64CD\u4F5C",
        "archives.restoreSuccess": "\u5DF2\u6062\u590D {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
        "archives.restoreBatchFailed": "\u6279\u91CF\u6062\u590D\u5931\u8D25\uFF1A{detail}",
        "archives.deleteAll": "\u5168\u90E8\u5220\u9664",
        "archives.deleteAllTitle": "\u5220\u9664\u5168\u90E8\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteAllDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u5168\u90E8 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u8BB0\u5F55\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteSelectedTitle": "\u5220\u9664\u6240\u9009\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteSelectedDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u6240\u9009\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u8BB0\u5F55\u3002\u5176\u4ED6\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteSelectedConfirm": "\u5220\u9664\u6240\u9009\u804A\u5929",
        "archives.deleteProjectTitle": "\u5220\u9664\u201C{name}\u201D\u4E2D\u7684\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteProjectDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u201C{name}\u201D\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u9879\u76EE\u76EE\u5F55\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteProjectConfirm": "\u5220\u9664\u9879\u76EE\u5168\u90E8\u804A\u5929",
        "archives.deleteUngroupedTitle": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteUngroupedDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u672A\u5206\u7EC4\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u5176\u4ED6\u9879\u76EE\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteUngroupedConfirm": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5168\u90E8\u804A\u5929",
        "archives.deleteBatchPending": "\u6B63\u5728\u5220\u9664\u5DF2\u5F52\u6863\u804A\u5929\u2026",
        "archives.deleteSuccess": "\u5DF2\u5220\u9664 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
        "archives.deleteSuccessWithSkipped": "\u5DF2\u5220\u9664 {deleted} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\uFF1B\u53E6\u6E05\u7406 {skipped} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\u3002",
        "archives.deleteSkipped": "\u5DF2\u6E05\u7406 {n} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\u3002",
        "archives.deletePartial": "\u5DF2\u5220\u9664 {deleted} \u4E2A\u804A\u5929\uFF0C\u6E05\u7406 {skipped} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\uFF1B{failed} \u4E2A\u5220\u9664\u5931\u8D25\uFF1A{detail}",
        "archives.unarchiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u53D6\u6D88\u5F52\u6863\u3002",
        "archives.unarchiveFailed": "\u53D6\u6D88\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
        "archives.archiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5F52\u6863\u3002",
        "archives.archiveFailed": "\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
        "archives.forkFailed": "\u5206\u53C9\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
        "deleteSession.title": "\u5220\u9664\u4F1A\u8BDD",
        "deleteSession.desc": "\u5C06\u6C38\u4E45\u5220\u9664\u4F1A\u8BDD\u201C{name}\u201D\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u5168\u90E8\u8BB0\u5F55\uFF08\u5BF9\u8BDD\u5185\u5BB9\u3001\u7EDF\u8BA1\u3001\u7F13\u5B58\uFF09\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "deleteSession.pending": "\u6B63\u5728\u5220\u9664\u4F1A\u8BDD\u2026",
        "deleteSession.unknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664\u3002",
        "deleteSession.failed": "\u5220\u9664\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
        "picker.loading": "\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u533A\u2026",
        "conflict.named": "\u5DF2\u5B58\u5728\u540D\u4E3A\u201C{name}\u201D\u7684\u5DE5\u4F5C\u533A\u3002",
        "folderError.title": "\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6\u5939",
        "folderError.retry": "\u91CD\u65B0\u9009\u62E9",
        "rename": "\u91CD\u547D\u540D",
        "rename.workspace.title": "\u91CD\u547D\u540D\u5DE5\u4F5C\u533A",
        "rename.session.title": "\u91CD\u547D\u540D\u4F1A\u8BDD",
        "field.workspaceName": "\u5DE5\u4F5C\u533A\u540D\u79F0",
        "field.sessionName": "\u4F1A\u8BDD\u540D\u79F0",
        "delete.workspace": "\u5220\u9664\u5DE5\u4F5C\u533A",
        "delete.desc": "\u5C06\u628A\u201C{name}\u201D\u4ECE\u5DE5\u4F5C\u533A\u5217\u8868\u4E2D\u79FB\u9664\u3002\u6587\u4EF6\u5939\u4E0E\u4F1A\u8BDD\u8BB0\u5F55\u4F1A\u4FDD\u7559\uFF0C\u5176\u4F1A\u8BDD\u5C06\u663E\u793A\u5728\u201C\u672A\u5206\u7EC4\u201D\u4E0B\u3002",
        "delete.pending": "\u6B63\u5728\u5220\u9664\u5DE5\u4F5C\u533A\u2026",
        "menu.fork": "\u5206\u53C9\u4F1A\u8BDD",
        "menu.archiveSession": "\u5F52\u6863\u4F1A\u8BDD",
        "menu.archiveWorkspace": "\u5F52\u6863\u5168\u90E8\u804A\u5929",
        "archiveWorkspace.title": "\u5F52\u6863 {n} \u4E2A\u804A\u5929\uFF1F",
        "archiveWorkspace.desc": "\u8FD9\u4F1A\u5C06\u201C{name}\u201D\u4E2D\u7684\u804A\u5929\u5F52\u6863\u3002\u4E4B\u540E\u4F60\u53EF\u4EE5\u5728\u5DF2\u5F52\u6863\u7684\u804A\u5929\u4E2D\u627E\u5230\u5B83\u4EEC\u3002",
        "archiveWorkspace.confirm": "\u5168\u90E8\u5F52\u6863",
        "archiveWorkspace.pending": "\u6B63\u5728\u5F52\u6863\u804A\u5929\u2026",
        "actions.workspace.aria": "\u5DE5\u4F5C\u533A\u201C{name}\u201D\u7684\u64CD\u4F5C",
        "actions.session.aria": "\u4F1A\u8BDD\u201C{name}\u201D\u7684\u64CD\u4F5C",
        "actions.newSession.aria": "\u5728\u201C{name}\u201D\u4E2D\u65B0\u5EFA\u4F1A\u8BDD",
        "status.running": "\u8FDB\u884C\u4E2D",
        "status.subagentsRunning.one": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
        "status.subagentsRunning.other": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
        "status.idle": "\u7A7A\u95F2",
        "status.waitingApproval": "\u7B49\u5F85\u5BA1\u6279",
        "status.planReview": "\u8BA1\u5212\u5F85\u5BA1",
        "status.waitingAnswer": "\u7B49\u5F85\u56DE\u7B54",
        "status.completed": "\u5DF2\u5B8C\u6210",
        "hover.created": "\u521B\u5EFA\u4E8E {time}",
        "hover.copied": "\u5DF2\u590D\u5236",
        "date.ymd": "{y}\u5E74{m}\u6708{d}\u65E5",
        "time.now": "\u521A\u521A",
        "time.minutes": "{n}\u5206\u949F",
        "time.hours": "{n}\u5C0F\u65F6",
        "time.days": "{n}\u5929",
        "time.months": "{n}\u4E2A\u6708",
        "time.years": "{n}\u5E74",
        "time.ago": "{t}\u524D"
      };
      const en = {
        ...organizerEn,
        ...discoveryEn,
        ...healthEn,
        "locale.language": "en",
        "service.unavailable": "The service is not ready. Please retry.",
        "archives.moreActions": "More actions",
        "archives.archiveProject": "Archive all chats in this project",
        "archives.archiveUngrouped": "Archive all ungrouped chats",
        "archives.archiveProjectDesc": "Archive all {n} unarchived sessions in \u201C{name}\u201D, regardless of the current search filter. You can restore them in Archived.",
        "archives.archiveUngroupedDesc": "Archive all {n} ungrouped, unarchived sessions, regardless of the current search filter. You can restore them in Archived.",
        "archives.tab.archived": "Archived",
        "archives.tab.unarchived": "Unarchived",
        "archives.searchUnarchived": "Search unarchived chats",
        "archives.emptyUnarchived": "No unarchived sessions.",
        "archives.archiveSelected": "Archive",
        "archives.openSession": "Open session",
        "archives.archiveSelectedDesc": "Archive the selected sessions, including selections hidden by the current filter. You can view and restore them in Archived.",
        "archives.archiveSuccess": "Archived {n} sessions.",
        "archives.archiveBatchFailed": "Batch archive failed: {detail}",
        "archives.navigationUnavailable": "This host cannot keep the conversation archived while opening it. Use \u201CRestore and open\u201D instead.",
        "archives.sessionNotRetained": "The host did not keep the requested conversation open. Try again, or restore it before opening.",
        "archives.restoreOpen": "Restore and open",
        "archives.selectedCount": "{n} selected",
        "archives.selectionHiddenHint": "Includes {hidden} hidden by the current filter; actions apply to them too.",
        "archives.clearSelectionShort": "Clear",
        "archives.restore": "Restore",
        "archives.archiveTitle": "Archive {n} chats?",
        "archives.deleteSelectionShort": "Delete",
        "archives.clearSelection": "Clear selection",
        "group.ungrouped": "Ungrouped",
        "session.new": "New Session",
        "section.workspaces": "Workspaces",
        "section.sessions": "Sessions",
        "viewOptions.label": "View options",
        "groupBy.label": "Group by",
        "groupBy.workspace": "Workspace",
        "groupBy.flat": "In one list",
        "orderBy.label": "Order by",
        "orderBy.manual": "Manual",
        "orderBy.updated": "Last updated",
        "sessions.expand": "Show {n} more sessions",
        "sessions.collapse": "Show less",
        "empty.none": "No sessions yet",
        "workspace.add": "Add workspace",
        "search.sessions.aria": "Search sessions",
        "search.placeholder": "Search sessions...",
        "search.clear": "Clear search",
        "search.results.aria": "Search results",
        "search.pending": "Searching session history\u2026",
        "search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
        "search.noMatches": "No matching sessions",
        "search.hasMore": "Showing the first {n} results. Narrow your search.",
        "menu.addWorkspace": "Add workspace\u2026",
        "menu.unarchive": "Unarchive",
        "menu.deleteSession": "Delete session",
        "archived.badge": "Archived sessions",
        "archived.notOpenable": "This session is archived. Unarchive it to continue the conversation.",
        "archives.title": "Archived sessions",
        "archives.description": "Manage archived sessions or select unarchived sessions to archive in bulk.",
        "archives.viewProject": "GitHub",
        "archives.feedback": "Issues",
        "archives.empty": "No archived sessions.",
        "archives.emptyFiltered": "No chats match your filters.",
        "archives.searchPlaceholder": "Search archived chats",
        "archives.sortBy": "Sort archived chats",
        "archives.sortUpdated": "Last updated",
        "archives.sortCreated": "Created",
        "archives.sortAlphabetical": "Alphabetical",
        "archives.projectFilter": "Filter by project",
        "archives.allProjects": "All projects",
        "archives.sessionCount": "{n} chats",
        "archives.selectAllFiltered": "Select all results",
        "archives.selectSession": "Select chat {name}",
        "archives.restoreSelected": "Restore selected",
        "archives.deleteSelected": "Delete selected",
        "archives.timestamp": "{date}, {time}",
        "archives.restoreAll": "Restore all",
        "archives.restoreProject": "Restore all chats in this project",
        "archives.restoreUngrouped": "Restore all",
        "archives.deleteProject": "Delete all chats in this project",
        "archives.deleteUngrouped": "Delete all",
        "archives.projectActions": "Archive actions for project {name}",
        "archives.ungroupedActions": "Archive actions for ungrouped chats",
        "archives.restoreSuccess": "Restored {n} archived chats.",
        "archives.restoreBatchFailed": "Could not restore the archived chats: {detail}",
        "archives.deleteAll": "Delete all",
        "archives.deleteAllTitle": "Delete all archived chats",
        "archives.deleteAllDesc": "This permanently deletes all {n} archived chats, their child agents (including any that are still running), and their records. This cannot be undone.",
        "archives.deleteSelectedTitle": "Delete selected archived chats",
        "archives.deleteSelectedDesc": "This permanently deletes the selected {n} archived chats, their child agents (including any that are still running), and their records. Other chats are not affected. This cannot be undone.",
        "archives.deleteSelectedConfirm": "Delete selected chats",
        "archives.deleteProjectTitle": "Delete archived chats in {name}",
        "archives.deleteProjectDesc": "This permanently deletes the {n} archived chats in {name}, their child agents, and their records. The project directory and unarchived chats are not affected. This cannot be undone.",
        "archives.deleteProjectConfirm": "Delete all project chats",
        "archives.deleteUngroupedTitle": "Delete ungrouped archived chats",
        "archives.deleteUngroupedDesc": "This permanently deletes the {n} ungrouped archived chats, their child agents, and their records. Other projects and unarchived chats are not affected. This cannot be undone.",
        "archives.deleteUngroupedConfirm": "Delete all ungrouped chats",
        "archives.deleteBatchPending": "Deleting archived chats\u2026",
        "archives.deleteSuccess": "Deleted {n} archived chats.",
        "archives.deleteSuccessWithSkipped": "Deleted {deleted} archived chats and cleared {skipped} stale archive entries for sessions that no longer exist.",
        "archives.deleteSkipped": "Cleared {n} stale archive entries for sessions that no longer exist.",
        "archives.deletePartial": "Deleted {deleted} chats and cleared {skipped} stale archive entries; {failed} could not be deleted: {detail}",
        "archives.unarchiveUnknown": "This session no longer exists, so it cannot be unarchived.",
        "archives.unarchiveFailed": "Could not unarchive the session: {detail}",
        "archives.archiveUnknown": "This session no longer exists, so it cannot be archived.",
        "archives.archiveFailed": "Could not archive the session: {detail}",
        "archives.forkFailed": "Could not fork the session: {detail}",
        "deleteSession.title": "Delete session",
        "deleteSession.desc": "This permanently deletes session \u201C{name}\u201D, its child agents (including any that are still running), and all of its records (conversation, stats, cache). This cannot be undone.",
        "deleteSession.pending": "Deleting session\u2026",
        "deleteSession.unknown": "This session no longer exists or was already deleted.",
        "deleteSession.failed": "Could not delete the session: {detail}",
        "picker.loading": "Loading workspaces\u2026",
        "conflict.named": "A workspace named \u201C{name}\u201D already exists.",
        "folderError.title": "Couldn\u2019t open folder",
        "folderError.retry": "Choose again",
        "rename": "Rename",
        "rename.workspace.title": "Rename workspace",
        "rename.session.title": "Rename session",
        "field.workspaceName": "Workspace name",
        "field.sessionName": "Session name",
        "delete.workspace": "Delete workspace",
        "delete.desc": "This removes \u201C{name}\u201D from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
        "delete.pending": "Deleting workspace\u2026",
        "menu.fork": "Fork session",
        "menu.archiveSession": "Archive session",
        "menu.archiveWorkspace": "Archive all chats",
        "archiveWorkspace.title": "Archive {n} chats?",
        "archiveWorkspace.desc": "This archives the chats in \u201C{name}\u201D. You can find them later in Archived chats.",
        "archiveWorkspace.confirm": "Archive all",
        "archiveWorkspace.pending": "Archiving chats\u2026",
        "actions.workspace.aria": "Workspace actions for {name}",
        "actions.session.aria": "Session actions for {name}",
        "actions.newSession.aria": "New session in {name}",
        "status.running": "Running",
        "status.subagentsRunning.one": "{n} subagent running",
        "status.subagentsRunning.other": "{n} subagents running",
        "status.idle": "Idle",
        "status.waitingApproval": "Waiting for approval",
        "status.planReview": "Plan awaiting review",
        "status.waitingAnswer": "Waiting for answer",
        "status.completed": "Completed",
        "hover.created": "Created {time}",
        "hover.copied": "Copied",
        "date.ymd": "{y}-{m}-{d}",
        "time.now": "now",
        "time.minutes": "{n}min",
        "time.hours": "{n}h",
        "time.days": "{n}d",
        "time.months": "{n}mo",
        "time.years": "{n}y",
        "time.ago": "{t} ago"
      };
      const NS = "archive-manager-workspace";
      const DIRECTORY_FLOW_SLOT = "archiveManager.sidebar.directoryFlow";
      const inject = [
        "slots",
        "sessions",
        "workspaces",
        "locale",
        "remote",
        "typert"
      ];
      function bindObservable(source) {
        return {
          getSnapshot: source.getSnapshot.bind(source),
          subscribe: source.subscribe.bind(source)
        };
      }
      function createUnarchiveSession(workspaces, getRegistry) {
        return async (sessionId) => {
          if (typeof workspaces?.unarchiveSession === "function") {
            await workspaces.unarchiveSession(sessionId);
            return;
          }
          const registry = typeof getRegistry === "function" ? getRegistry() : getRegistry;
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.unarchiveSession(sessionId);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
      }
      async function archiveSessionsViaOfficial(workspaces, sessionIds, refresh) {
        const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
        const seen = /* @__PURE__ */ new Set();
        for (const sessionId of sessionIds) {
          if (typeof sessionId !== "string" || sessionId.length === 0 || seen.has(sessionId)) continue;
          seen.add(sessionId);
          await workspaces.archiveSession(sessionId);
        }
        if (typeof refresh === "function") await refresh();
        const archivedSessionIds = [...workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []];
        return {
          archivedSessionIds,
          archivedSessionIdsAdded: archivedSessionIds.filter((id2) => !before.has(id2))
        };
      }
      async function unarchiveSessionsViaOfficial(workspaces, sessionIds, refresh, unarchive) {
        const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
        const seen = /* @__PURE__ */ new Set();
        const run = typeof unarchive === "function" ? unarchive : (id2) => workspaces.unarchiveSession(id2);
        let archivedSessionIds;
        for (const sessionId of sessionIds) {
          if (typeof sessionId !== "string" || sessionId.length === 0 || seen.has(sessionId)) continue;
          seen.add(sessionId);
          const value = await run(sessionId);
          if (Array.isArray(value?.archivedSessionIds)) archivedSessionIds = [...value.archivedSessionIds];
        }
        if (typeof refresh === "function") await refresh();
        archivedSessionIds ??= [...workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []];
        return {
          archivedSessionIds,
          unarchivedSessionIds: [...before].filter((id2) => !archivedSessionIds.includes(id2))
        };
      }
      async function apply(ctx) {
        applyWorkspaceBrowser(ctx);
        const remote = ctx.get("remote");
        let disposeRemote = () => {
        };
        if (remote !== void 0) disposeRemote = await remote.$mount(ARCHIVE_MANAGER_REMOTE);
        return async () => {
          await disposeRemote();
        };
      }
      function applyWorkspaceBrowser(ctx) {
        ctx.effect(() => ctx.locale.register(NS, {
          zh,
          en
        }), "dsh-archive-manager: dictionaries");
        ctx.effect(() => observePluginUpdate({
          endpoint: "/api/michengai/dsh-archive-manager/update",
          packageName: "@michengai/dsh-archive-manager",
          titleRowSelector: ".dsham_settingsTitleRow",
          linksSelector: ".dsham_settingsLinks",
          zhName: "\u5F52\u6863\u4F1A\u8BDD",
          enName: "Archived sessions",
          getLanguage: () => ctx.locale.bind(NS)("locale.language"),
          createIcon: createPluginUpdateIcon
        }), "dsh-archive-manager: plugin update ui");
        const uiWorkspaceAt = () => ctx.get("uiWorkspace");
        const archiveViewState = {};
        let archiveNavigation;
        const attachArchiveNavigation = (navigation) => {
          archiveNavigation = allowArchivedNavigation(navigation, ctx.sessions, ctx.workspaces, {
            onOpened: () => ctx.get("layout")?.selectPanel(null),
            beginNavigation: () => ctx.get("layout")?.beginNavigation?.()
          });
          return () => archiveNavigation.dispose();
        };
        if (typeof ctx.inject === "function") ctx.inject(["uiWorkspace"], (ready) => attachArchiveNavigation(ready.uiWorkspace ?? uiWorkspaceAt()));
        else ctx.effect(() => attachArchiveNavigation(uiWorkspaceAt()), "archive-manager: explicit archived navigation");
        const openConversation = (sessionId) => {
          if (archiveNavigation === void 0) throw new ArchiveNavigationError("navigationUnavailable");
          sidebarReveal.request(sessionId);
          return archiveNavigation.open(sessionId);
        };
        const focusSessionWorkspace = async (sessionId) => {
          ctx.get("layout")?.beginNavigation?.();
          sidebarReveal.request(sessionId);
        };
        const searchSessions = async (query, signal) => {
          const result = await ctx.sessions.search(query, signal);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
        const flowSource = (hole) => ({
          getSnapshot: () => ctx.slots.entries(hole).length > 0,
          subscribe: (listener) => ctx.slots.subscribe(hole, listener)
        });
        const browserFlowSource = flowSource(DIRECTORY_FLOW_SLOT);
        const refreshSessionList = async () => {
          if (typeof ctx.sessions.refresh !== "function") return;
          try {
            await ctx.sessions.refresh();
          } catch (error) {
            console.warn("archive-manager: restored archived sessions but session list refresh failed:", error);
          }
        };
        const unarchiveOne = createUnarchiveSession(ctx.workspaces, () => ctx.get("remote.workspaceRegistry"));
        const favoriteCall = async (method, input) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (!registry || typeof registry[method] !== "function") throw new Error(ctx.locale.bind(NS)("service.unavailable"));
          const result = input === void 0 ? await registry[method]() : await registry[method](input);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
        const discoveryCall = async (method, input) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (!registry || typeof registry[method] !== "function") throw new Error(ctx.locale.bind(NS)("service.unavailable"));
          const result = await registry[method](input);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
        const sessionDetails = (input) => discoveryCall("sessionDetails", input);
        const diagnoseSession = (input) => discoveryCall("diagnoseSession", input);
        const repairSession = (input) => discoveryCall("repairSession", input);
        const searchArchivedContent = (input) => discoveryCall("searchArchivedContent", input);
        const searchSessionContent = (input) => discoveryCall("searchSessionContent", input);
        const previewArchivedSession = (input) => discoveryCall("previewArchivedSession", input);
        const favoriteSessions = () => favoriteCall("favoriteSessions");
        const setSessionFavorite = (input) => favoriteCall("setSessionFavorite", input);
        const organizeBatch = createSessionOrganizer({
          workspaces: ctx.workspaces.list,
          sessions: ctx.sessions.list,
          archive: (id2) => ctx.workspaces.archiveSession(id2),
          restore: unarchiveOne,
          deleteOne: async (id2) => {
            const registry = ctx.get("remote.workspaceRegistry");
            if (!registry) throw new Error(ctx.locale.bind(NS)("service.unavailable"));
            const result = await registry.deleteSession(id2);
            if (!result.ok) throw new Error(result.error.message);
          },
          getFavorites: favoriteSessions,
          refresh: () => ctx.sessions.refresh?.(),
          currentSessionId
        });
        const unarchiveSession = async (sessionId) => {
          await unarchiveOne(sessionId);
          await refreshSessionList();
        };
        const archiveWorkspaceSessions = async (workspaceId) => {
          const items = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
          const workspace = items.find((item) => item.workspaceId === workspaceId);
          if (workspace === void 0) throw new Error(`unknown workspace "${workspaceId}"`);
          return archiveSessionsViaOfficial(ctx.workspaces, workspace.sessionIds, refreshSessionList);
        };
        const deleteSession = async (sessionId) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.deleteSession(sessionId);
          if (!result.ok) throw new Error(result.error.message);
          await refreshSessionList();
        };
        const archiveSessions = async (sessionIds) => archiveSessionsViaOfficial(ctx.workspaces, sessionIds, refreshSessionList);
        const unarchiveSessions = async (target) => {
          const snapshot = ctx.workspaces.list?.getSnapshot?.() ?? { archivedSessionIds: [], items: [] };
          const sessionIds = deriveArchivedBatchIds(snapshot.archivedSessionIds, snapshot.items, target);
          return unarchiveSessionsViaOfficial(ctx.workspaces, sessionIds, refreshSessionList, unarchiveOne);
        };
        const deleteArchivedSessions = async (target) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.deleteArchivedSessions(target);
          if (!result.ok) throw new Error(result.error.message);
          await refreshSessionList();
          return result.value;
        };
        const archivedSessionMetadata = async () => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.archivedSessionMetadata();
          if (!result.ok) throw new Error(result.error.message);
          if (result.value.repairedSessionIds?.length > 0 && typeof ctx.sessions.refresh === "function") {
            try {
              await ctx.sessions.refresh();
            } catch (error) {
              console.warn("archive-manager: repaired archived projections but session list refresh failed:", error);
            }
          }
          return result.value;
        };
        const browserInjected = () => ({
          startSession: (workspaceId) => {
            const uiWorkspace = uiWorkspaceAt();
            if (uiWorkspace !== void 0) uiWorkspace.startSession(workspaceId);
            else ctx.workspaces.startSession(workspaceId);
          },
          open: (sessionId) => {
            const uiWorkspace = uiWorkspaceAt();
            if (typeof uiWorkspace?.openSession === "function") uiWorkspace.openSession(sessionId);
            else ctx.sessions.open(sessionId);
          },
          searchSessions,
          searchResultLimit: ctx.sessions.searchResultLimit,
          renameSession: async (sessionId, title) => {
            const rename = async (session2) => {
              const result = await session2.rename(title);
              if (!result.ok) throw new Error(result.error.message);
            };
            if (typeof ctx.sessions.using === "function") {
              await ctx.sessions.using(sessionId, { source: "workspaceOperation" }, (reference) => rename(reference.binding.session));
              return;
            }
            const session = ctx.sessions.binding(sessionId)?.session;
            if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
            await rename(session);
          },
          forkSession: (sessionId) => {
            const uiWorkspace = uiWorkspaceAt();
            if (typeof uiWorkspace?.forkSession === "function") return uiWorkspace.forkSession(sessionId);
            return ctx.sessions.fork({ sessionId, increaseTitle: true }).then((childId) => {
              if (typeof uiWorkspace?.openSession === "function") uiWorkspace.openSession(childId);
              else ctx.sessions.open(childId);
            });
          },
          renameWorkspace: async (workspaceId, title) => {
            await ctx.workspaces.rename(workspaceId, title);
          },
          deleteWorkspace: async (workspaceId) => {
            await ctx.workspaces.delete(workspaceId);
          },
          insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
            await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
          },
          archiveSession: async (sessionId) => {
            await ctx.workspaces.archiveSession(sessionId);
          },
          archiveWorkspaceSessions,
          unarchiveSession,
          deleteSession,
          insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
            await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
          },
          createWorkspace: (input) => ctx.workspaces.create(input),
          hooks: { directoryFlow: browserFlowSource }
        });
        ctx.slots.inject("sidebar.workspaces", () => {
          const common = {
            name: "sidebar.workspaces",
            // 低于官方 0，高于 Codex -1：必须盖住官方三项菜单才能露出删除。
            priority: -0.5,
            store: createWorkspaceViewStore(),
            inject: browserInjected,
            locale: NS
          };
          try {
            return ctx.slots.register({
              ...common,
              children: { [DIRECTORY_FLOW_SLOT]: {
                kind: "single",
                scope: "root"
              } }
            }, WorkspaceBrowser);
          } catch (error) {
            console.warn("archive-manager: sidebar registration with directory child failed, retrying without children", error);
            return ctx.slots.register(common, WorkspaceBrowser);
          }
        });
        mirrorDirectoryFlow(ctx, DIRECTORY_FLOW_SLOT);
        ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: "archived-sessions",
          order: 18,
          label: () => ctx.locale.bind(NS)("archived.badge"),
          icon: "archive",
          locale: NS,
          inject: () => ({
            archiveSessions,
            sessionStore: bindObservable(ctx.sessions.list),
            workspaceStore: bindObservable(ctx.workspaces.list),
            unarchiveSession,
            deleteSession,
            unarchiveSessions,
            deleteArchivedSessions,
            archivedSessionMetadata,
            openConversation,
            focusSessionWorkspace,
            viewState: archiveViewState,
            favoriteSessions,
            setSessionFavorite,
            organizeBatch,
            diagnoseSession,
            repairSession,
            sessionDetails,
            searchSessionContent,
            searchArchivedContent,
            previewArchivedSession,
            t: ctx.locale.bind(NS)
          })
        }, ArchivedSessionsSection));
      }
      exports.__test = {
        unarchivedSessionIds,
        ArchiveSelectionToolbar,
        ArchivedSessionsSection,
        zh,
        en,
        displayTitle,
        sessionVisible,
        indexSubagentDescendants,
        isUnknownSessionError,
        deriveGroups,
        deriveFlat,
        deriveSearchResults,
        deriveArchivedGroups,
        sortArchivedGroups,
        deriveArchivedBatchIds,
        archivedSessionIdsInGroups,
        pruneArchivedSelection,
        toggleArchivedSelection,
        archivedDeleteFeedback,
        archiveableWorkspaceSessionCount,
        archiveWorkspaceDialogTarget,
        archiveWorkspaceDialogFailureState,
        archiveSessionsViaOfficial,
        unarchiveSessionsViaOfficial,
        createUnarchiveSession,
        createWorkspaceViewStore,
        migrateWorkspaceViewPersist,
        WORKSPACE_VIEW_PERSIST_KEY,
        LEGACY_WORKSPACE_VIEW_PERSIST_KEY,
        bindObservable,
        hasSplitClientStore,
        groupByWorkspace,
        byRecency,
        ARCHIVE_MANAGER_REMOTE,
        currentSessionId
      };
      exports.apply = apply;
      exports.inject = inject;
      return module.exports;
    }
  });
})();
