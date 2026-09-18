/** 导航业务错误使用稳定标识，由界面按当前语言展示。 */
export class ArchiveNavigationError extends Error {
  constructor(code) {
    super(code);
    this.name = "ArchiveNavigationError";
    this.code = code;
  }
}

/** 仅翻译插件自身的导航错误，保留宿主异常的原始消息。 */
export function formatArchiveNavigationError(error, t) {
  return error instanceof ArchiveNavigationError
    ? t(`archives.${error.code}`)
    : String(error?.message ?? error);
}

function retainInfoSnapshot(sessions, id) {
  if (typeof sessions?.retainInfo !== "function") return;
  const source = sessions.retainInfo(id);
  return typeof source?.getSnapshot === "function" ? source.getSnapshot() : source;
}

function mainViewSessionId(list) {
  const byId = list?.byId;
  if (byId === undefined) return;
  for (const session of Object.values(byId)) {
    if ((session?.retainedBy?.mainView ?? 0) > 0) return session.id;
  }
}

/**
 * 当前主视图会话：0.1.6-alpha.2 读 `retainedBy.mainView`，旧宿主回退 `list.current`。
 * 两套字段同时存在时以 mainView 为准，避免打开归档后仍读到过期的 current。
 * @param list - 会话列表快照。
 * @returns 当前会话 id；没有选中时为 undefined。
 */
export function currentSessionId(list) {
  return mainViewSessionId(list) ?? list?.current;
}

/**
 * 指定会话是否就是当前主视图。按 id 看 mainView / retainInfo，避免列表里另有 current 时误判。
 * @param list - 会话列表快照。
 * @param id - 要核对的会话。
 * @param sessions - 可选；alpha.2 用 retainInfo 补列表尚未投影的归档行。
 */
export function sessionIsCurrent(list, id, sessions) {
  if (id === undefined || id === "") return false;
  if ((list?.byId?.[id]?.retainedBy?.mainView ?? 0) > 0) return true;
  if ((retainInfoSnapshot(sessions, id)?.retainedBy?.mainView ?? 0) > 0) return true;
  return list?.current === id;
}

/** 恢复失败不导航；页面卸载后不让迟到响应抢占当前会话。 */
export async function openArchivedConversation(actions, sessionId, restore, isActive = () => true) {
  if (restore) {
    // 先离开当前选中的其他工作区导航，再官方恢复，避免恢复后仍停在别人的文件夹里。
    if (typeof actions.prepare === "function") await actions.prepare(sessionId);
    if (!isActive()) return;
    await actions.restore(sessionId);
  }
  if (isActive()) await actions.open(sessionId);
}

/** 仅放行显式打开的归档；保留官方导航实例和其他归档清理行为。 */
export function allowArchivedNavigation(navigation, sessions, workspaces, { onOpened = () => {}, beginNavigation, warn = (...args) => console.warn(...args) } = {}) {
  let allowed;
  const original = navigation?.clearArchivedCurrent;
  const descriptor = navigation && Object.getOwnPropertyDescriptor(navigation, "clearArchivedCurrent");
  const viewing = (id) => sessionIsCurrent(sessions.list.getSnapshot(), id, sessions);
  const wrapped = function (...args) {
    if (allowed !== undefined && viewing(allowed) && workspaces.list.getSnapshot().archivedSessionIds.includes(allowed)) return false;
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
  }
  return {
    open(id) {
      allowed = id;
      try {
        if (typeof original === "function" && !ownsWrapper() && workspaces.list.getSnapshot().archivedSessionIds.includes(id)) {
          warn("archive-manager: 归档导航适配不可用或已被替换。");
          throw new ArchiveNavigationError("navigationUnavailable");
        }
        // 中止进行中的 openWorkspace，避免当前选中的其他工作区在创建空白会话后抢走目标。
        beginNavigation?.();
        // alpha.2 有 retain：必须走 openSession，旧的 sessions.open 即使还在也不会写入 mainView。
        // 更早宿主没有 retain，继续用 sessions.open，避免未验证成功就关掉设置。
        if (typeof sessions.retain === "function" && typeof navigation?.openSession === "function") navigation.openSession(id);
        else if (typeof sessions.open === "function") sessions.open(id);
        else if (typeof navigation?.openSession === "function") navigation.openSession(id);
        else {
          warn("archive-manager: 宿主未提供会话打开接口。");
          throw new ArchiveNavigationError("navigationUnavailable");
        }
        if (!viewing(id)) {
          warn("archive-manager: 宿主未保留目标会话。", { cleanupAvailable: typeof original === "function" });
          throw new ArchiveNavigationError("sessionNotRetained");
        }
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
