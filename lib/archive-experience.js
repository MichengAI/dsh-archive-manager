class ArchiveNavigationError extends Error {
  constructor(code) {
    super(code);
    this.name = "ArchiveNavigationError";
    this.code = code;
  }
}
function formatArchiveNavigationError(error, t) {
  return error instanceof ArchiveNavigationError ? t(`archives.${error.code}`) : String(error?.message ?? error);
}
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
  }
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof original === "function" && !ownsWrapper() && workspaces.list.getSnapshot().archivedSessionIds.includes(id)) {
          warn("archive-manager: \u5F52\u6863\u5BFC\u822A\u9002\u914D\u4E0D\u53EF\u7528\u6216\u5DF2\u88AB\u66FF\u6362\u3002");
          throw new ArchiveNavigationError("navigationUnavailable");
        }
        sessions.open(id);
        if (sessions.list.getSnapshot().current !== id) {
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
export {
  ArchiveNavigationError,
  allowArchivedNavigation,
  formatArchiveNavigationError,
  openArchivedConversation
};
