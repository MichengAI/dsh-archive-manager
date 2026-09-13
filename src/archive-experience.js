/** 恢复失败不导航；页面卸载后不让迟到响应抢占当前会话。 */
export async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
  if (restore) await actions.restore(sessionId);
  if (isActive()) await actions.open(sessionId);
}

/** 仅放行显式打开的归档；保留官方导航实例和其他归档清理行为。 */
export function allowArchivedNavigation(navigation, sessions, workspaces, { onOpened = () => {}, warn = (...args) => console.warn(...args) } = {}) {
  let allowed;
  const original = navigation?.clearArchivedCurrent;
  const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
  const wrapped = function (...args) {
    const current = sessions.list.getSnapshot().current;
    if (current === allowed && current !== undefined && workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
    allowed = undefined;
    return original.apply(this, args);
  };
  const ownsWrapper = () => navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent")?.value === wrapped;
  if (typeof original === "function") {
    try {
      navigation.clearArchivedCurrent = wrapped;
      if (!ownsWrapper()) throw new Error("导航方法未接纳归档适配");
    } catch (error) {
      warn("archive-manager: 无法适配归档导航，请恢复会话后打开。", error);
    }
  } else {
    warn("archive-manager: 宿主无 clearArchivedCurrent，使用会话接口并检查打开结果。");
  }
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof original === "function" && !ownsWrapper() && workspaces.list.getSnapshot().archivedSessionIds.includes(id)) {
          warn("archive-manager: 归档导航适配不可用或已被替换。");
          throw new Error("当前宿主无法保持归档对话，请使用“恢复并打开”。");
        }
        // 官方 openSession 会立即关闭全局面板；先验证会话选择，再退出设置。
        sessions.open(id);
        if (sessions.list.getSnapshot().current !== id) throw new Error("宿主未保留目标会话，请重新打开或恢复后再试。");
        onOpened();
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
