function archiveTextPreview(events) {
  const messages = [];
  let truncated = false;
  for (const event of events) {
    const role = event.type === "user/message" ? "user" : event.type === "assistant/message" ? "assistant" : null;
    if (role === null) continue;
    if (role === "user" && event.data?.source && event.data.source.kind !== "user") continue;
    const content = (role === "user" ? event.data : event.data?.message)?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n") : "";
    if (!text) continue;
    if (text.length > 12e3) truncated = true;
    messages.push({ role, text: text.slice(0, 12e3) });
    if (messages.length > 100) {
      messages.shift();
      truncated = true;
    }
  }
  if (messages.length > 100) truncated = true;
  const window = messages.slice(-100);
  let budget = 12e4;
  for (let index = window.length - 1; index >= 0; index--) {
    const message = window[index];
    if (message.text.length > budget) {
      message.text = message.text.slice(-budget);
      truncated = true;
    }
    budget -= message.text.length;
    if (budget === 0 && index > 0) {
      window.splice(0, index);
      truncated = true;
      break;
    }
  }
  return { messages: window, truncated };
}
const archivePreviewInvocation = {
  id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionPreview",
  service: "workspaceRegistry",
  namespace: "workspaceRegistry",
  method: "archivedSessionPreview",
  invocation: { kind: "direct" },
  parameters: [{ name: "sessionId", wire: "sessionId", source: "json", codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: { parse(value) {
    if (typeof value !== "string" || !value) throw new TypeError("sessionId must be a non-empty string");
    return value;
  } } } }],
  result: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionPreview", schema: { parse(value) {
    if (!value || typeof value.truncated !== "boolean" || !Array.isArray(value.messages) || value.messages.length > 100 || value.messages.some((item) => !item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string" || item.text.length > 12e3)) throw new TypeError("invalid archive preview");
    return value;
  } } },
  sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
};
async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
  if (restore) await actions.restore(sessionId);
  if (isActive()) await actions.open(sessionId);
}
function allowArchivedNavigation(navigation, sessions, workspaces) {
  let allowed;
  const original = navigation?.clearArchivedCurrent;
  const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
  const wrapped = function(...args) {
    const current = sessions.list.getSnapshot().current;
    if (current === allowed && current !== void 0 && workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
    allowed = void 0;
    return original.apply(this, args);
  };
  if (typeof original === "function") navigation.clearArchivedCurrent = wrapped;
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof navigation?.openSession === "function") navigation.openSession(id);
        else sessions.open(id);
        if (sessions.list.getSnapshot().current !== id) throw new Error("\u5BBF\u4E3B\u672A\u4FDD\u7559\u76EE\u6807\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u6216\u6062\u590D\u540E\u518D\u8BD5\u3002");
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
export {
  allowArchivedNavigation,
  archivePreviewInvocation,
  archiveTextPreview,
  openArchivedConversation
};
