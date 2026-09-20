/** 整理控件沿用归档页按钮与颜色，避免复制完整设置页。 */
export function createOrganizerPanel(React) {
  const h = React.createElement;
  return function OrganizerPanel({ t, archived, busy, ready, days, onDays, count, onPreview, progress, result, onRetry, undoCount, onUndo, onReload }) {
    return h(React.Fragment, null,
      h("style", null, ".dsham_organizer,.dsham_batchFeedback{display:grid;gap:12px;margin:0 0 16px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px}.dsham_organizerControls{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.dsham_organizer label{display:inline-flex;align-items:center;gap:6px}.dsham_organizer input[type=number]{width:76px;padding:5px;color:inherit;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:5px}.dsham_organizer p,.dsham_batchFeedback p{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsham_batchFeedback progress{width:100%}.dsham_batchFeedback details{font-size:12px;overflow-wrap:anywhere}.dsham_archivePreview{max-height:260px;overflow:auto;display:grid;gap:8px;padding:8px 0}.dsham_archivePreview label{display:flex;gap:8px;align-items:center;overflow-wrap:anywhere}"),
      (!archived || !ready) && h("div", { className: "dsham_organizer" }, h("div", { className: "dsham_organizerControls" },
        !ready && h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onReload }, t("organizer.reloadFavorites")),
        !archived && h(React.Fragment, null,
          h("label", null, t("organizer.idleDays"), h("input", { type: "number", min: 1, max: 36500, step: 1, value: days, disabled: busy, onChange: (event) => onDays(event.target.value), "aria-label": t("organizer.idleDays") })),
          h("button", { type: "button", className: "dsham_settingsAction", disabled: busy || !ready || count === 0, onClick: onPreview }, t("organizer.preview", { n: count })))),
      !archived && h("p", null, t("organizer.rules"))),
      (progress || result || undoCount > 0) && h("section", { className: "dsham_batchFeedback", "aria-label": t("organizer.feedback") },
      progress && h("div", { role: "status", "aria-live": "polite" },
        h("progress", { value: progress.done, max: Math.max(1, progress.total), "aria-label": t("organizer.progress") }),
        t("organizer.progressCount", { done: progress.done, total: progress.total })),
      result && h("div", { role: "status" },
        h("strong", null, t(`organizer.${result.kind ?? "archive"}Result`)),
        h("p", null, t("organizer.result", { succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length, remaining: result.unprocessed.length })),
        result.failures.length > 0 && h("details", null, h("summary", null, t("organizer.failureDetails")), h("ul", null, result.failures.map((failure) => h("li", { key: failure.sessionId }, failure.sessionId, "：", failure.message)))),
        result.refreshError && h("p", { role: "alert" }, t("organizer.refreshError", { detail: result.refreshError })),
        result.remaining.length > 0 && h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onRetry }, t("organizer.retry", { n: result.remaining.length }))),
      undoCount > 0 && h("div", { className: "dsham_organizerControls" },
        h("button", { type: "button", className: "dsham_settingsAction", disabled: busy, onClick: onUndo }, t("organizer.undo", { n: undoCount })),
        h("p", null, t("organizer.undoHint")))));
  };
}

export const organizerZh = {
  "organizer.feedback": "操作反馈",
  "organizer.allSessions": "全部会话", "organizer.favoriteFilter": "收藏筛选",
  "organizer.archiveResult": "归档结果", "organizer.restoreResult": "恢复结果", "organizer.deleteResult": "删除结果", "organizer.undoResult": "撤回结果",
  "organizer.favorite": "收藏", "organizer.unfavorite": "取消收藏", "organizer.favoritesOnly": "只看收藏",
  "organizer.reloadFavorites": "重新加载收藏", "organizer.idleDays": "闲置天数", "organizer.preview": "预览闲置归档（{n}）",
  "organizer.rules": "按最后活动时间筛选，遵循当前项目和标题搜索；排除收藏、当前打开、正在执行及等待交互的会话。",
  "organizer.progress": "批量操作进度", "organizer.progressCount": "已处理 {done} / {total}",
  "organizer.result": "成功 {succeeded} · 跳过 {skipped} · 失败 {failed} · 未处理 {remaining}",
  "organizer.failureDetails": "查看失败详情", "organizer.refreshError": "操作结果已保留，但列表刷新失败：{detail}",
  "organizer.retry": "重试剩余 {n} 条", "organizer.undo": "撤回本次归档（{n}）",
  "organizer.undoHint": "仅保留本次打开管理页期间最近一批归档；关闭页面或刷新后清除。撤回不会恢复已删除的会话。",
  "organizer.idleConfirm": "请检查以下候选，可取消勾选；执行前再次排除收藏及活跃会话。",
  "organizer.manualConfirm": "仅归档以下勾选会话；可逐条取消。归档后可撤回本批操作。"
};

export const organizerEn = {
  "organizer.feedback": "Operation feedback",
  "organizer.allSessions": "All sessions", "organizer.favoriteFilter": "Favorites filter",
  "organizer.archiveResult": "Archive results", "organizer.restoreResult": "Restore results", "organizer.deleteResult": "Delete results", "organizer.undoResult": "Undo results",
  "organizer.favorite": "Favorite", "organizer.unfavorite": "Unfavorite", "organizer.favoritesOnly": "Favorites only",
  "organizer.reloadFavorites": "Reload favorites", "organizer.idleDays": "Idle days", "organizer.preview": "Preview idle archives ({n})",
  "organizer.rules": "Uses last activity, the current project and title filter. Excludes favorites, open, running and waiting sessions.",
  "organizer.progress": "Batch progress", "organizer.progressCount": "Processed {done} / {total}",
  "organizer.result": "Succeeded {succeeded} · Skipped {skipped} · Failed {failed} · Unprocessed {remaining}",
  "organizer.failureDetails": "Failure details", "organizer.refreshError": "Results retained, but refresh failed: {detail}",
  "organizer.retry": "Retry remaining {n}", "organizer.undo": "Undo this archive batch ({n})",
  "organizer.undoHint": "Only the latest archive batch while this page is open is retained. Closing or refreshing clears undo. Deleted sessions cannot be restored.",
  "organizer.idleConfirm": "Review and deselect candidates. Favorites and active sessions are checked again before archiving.",
  "organizer.manualConfirm": "Only checked sessions below will be archived. You can undo this batch afterward."
};
