/** 归档预览协议与导航语义；不启动 Agent，不修改归档状态。 */
export function archiveTextPreview(events) {
  const messages = [];
  let truncated = false;
  for (const event of events) {
    const role = event.type === "user/message" ? "user" : event.type === "assistant/message" ? "assistant" : null;
    if (role === null) continue;
    if (role === "user" && event.data?.source && event.data.source.kind !== "user") continue;
    const content = (role === "user" ? event.data : event.data?.message)?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter(part => part?.type === "text" && typeof part.text === "string").map(part => part.text).join("\n") : "";
    if (!text) continue;
    if (text.length > 12000) truncated = true;
    messages.push({ role, text: text.slice(0, 12000) });
    if (messages.length > 100) { messages.shift(); truncated = true; }
  }
  // 仅返回最近文本窗口，避免将大段工具输出和附件载荷传入浏览器。
  if (messages.length > 100) truncated = true;
  const window = messages.slice(-100);
  let budget = 120000;
  for (let index = window.length - 1; index >= 0; index--) {
    const message = window[index];
    if (message.text.length > budget) { message.text = message.text.slice(-budget); truncated = true; }
    budget -= message.text.length;
    if (budget === 0 && index > 0) { window.splice(0, index); truncated = true; break; }
  }
  return { messages: window, truncated };
}

export const archivePreviewInvocation = {
  id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionPreview",
  service: "workspaceRegistry", namespace: "workspaceRegistry", method: "archivedSessionPreview",
  invocation: { kind: "direct" },
  parameters: [{ name: "sessionId", wire: "sessionId", source: "json", codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: { parse(value) { if (typeof value !== "string" || !value) throw new TypeError("sessionId must be a non-empty string"); return value; } } } }],
  result: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionPreview", schema: { parse(value) {
    if (!value || typeof value.truncated !== "boolean" || !Array.isArray(value.messages) || value.messages.length > 100 || value.messages.some(item => !item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string" || item.text.length > 12000)) throw new TypeError("invalid archive preview");
    return value;
  } } },
  sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
};

/** 恢复失败不导航；页面卸载后不让迟到响应抢占当前会话。 */
export async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
  if (restore) await actions.restore(sessionId);
  if (isActive()) await actions.open(sessionId);
}

/** 仅放行显式打开的归档；保留官方导航实例和其他归档清理行为。 */
export function allowArchivedNavigation(navigation, sessions, workspaces) {
  let allowed;
  const original = navigation?.clearArchivedCurrent;
  const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
  const wrapped = function (...args) {
    const current = sessions.list.getSnapshot().current;
    if (current === allowed && current !== undefined && workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
    allowed = undefined;
    return original.apply(this, args);
  };
  if (typeof original === "function") navigation.clearArchivedCurrent = wrapped;
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof navigation?.openSession === "function") navigation.openSession(id);
        else sessions.open(id);
        if (sessions.list.getSnapshot().current !== id) throw new Error("宿主未保留目标会话，请重新打开或恢复后再试。");
      } catch (error) { allowed = undefined; throw error; }
    },
    dispose() {
      allowed = undefined;
      // Cordis 读取方法时会绑定代理；用自有描述符核对，避免误判为其他插件覆盖。
      if (!navigation || Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent")?.value !== wrapped) return;
      if (descriptor) Object.defineProperty(navigation, "clearArchivedCurrent", descriptor);
      else delete navigation.clearArchivedCurrent;
      original.call(navigation);
    }
  };
}
