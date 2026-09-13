async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
  if (restore) await actions.restore(sessionId);
  if (isActive()) await actions.open(sessionId);
}
function allowArchivedNavigation(navigation, sessions, workspaces, { onOpened = () => {
}, warn = (...args) => console.warn(...args) } = {}) {
  let allowed;
  const original = navigation?.clearArchivedCurrent;
  const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
  const wrapped = function(...args) {
    const current = sessions.list.getSnapshot().current;
    if (current === allowed && current !== void 0 && workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
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
  } else {
    warn("archive-manager: \u5BBF\u4E3B\u65E0 clearArchivedCurrent\uFF0C\u4F7F\u7528\u4F1A\u8BDD\u63A5\u53E3\u5E76\u68C0\u67E5\u6253\u5F00\u7ED3\u679C\u3002");
  }
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof original === "function" && !ownsWrapper() && workspaces.list.getSnapshot().archivedSessionIds.includes(id)) {
          warn("archive-manager: \u5F52\u6863\u5BFC\u822A\u9002\u914D\u4E0D\u53EF\u7528\u6216\u5DF2\u88AB\u66FF\u6362\u3002");
          throw new Error("\u5F53\u524D\u5BBF\u4E3B\u65E0\u6CD5\u4FDD\u6301\u5F52\u6863\u5BF9\u8BDD\uFF0C\u8BF7\u4F7F\u7528\u201C\u6062\u590D\u5E76\u6253\u5F00\u201D\u3002");
        }
        sessions.open(id);
        if (sessions.list.getSnapshot().current !== id) throw new Error("\u5BBF\u4E3B\u672A\u4FDD\u7559\u76EE\u6807\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u6216\u6062\u590D\u540E\u518D\u8BD5\u3002");
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
export {
  allowArchivedNavigation,
  openArchivedConversation
};
