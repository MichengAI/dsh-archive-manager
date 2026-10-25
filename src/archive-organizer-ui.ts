import type { Translate, BatchProgress, BatchResult, OrganizeKind } from "./contracts.js";
import { Disclosure, NumberField } from "./plugin-ui.js";
interface OrganizerPanelProps {
 t: Translate; archived: boolean; busy: boolean; ready: boolean; days: string | number; onDays(value: string): void;
 count: number; onPreview(): void; progress?: BatchProgress | null; result?: (BatchResult & { kind?: OrganizeKind }) | null;
 onRetry(): void; undoCount: number; onUndo(): void; onReload(): void;
 /** 归档时跳过绑定活动定时任务的会话；默认开启。 */
 skipScheduled: boolean; onSkipScheduled(value: boolean): void;
 /** 本批因定时任务被跳过的会话数；为零时不显示。 */
 scheduledSkipped?: number;
 orphanCount?: number; orphanSizeBytes?: number; orphanCleaning?: boolean; onCleanOrphans?(): void;
}
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
/** 整理控件沿用归档页按钮与颜色，避免复制完整设置页。 */
export function createOrganizerPanel(React: typeof import("react"), Button?: import("react").ComponentType<Record<string, unknown>>) {
  const h = React.createElement;
  function textButton(label: string, props: { disabled?: boolean; onClick(): void }) {
    const Control = Button ?? ((buttonProps: { disabled?: boolean; onClick?: () => void; children?: import("react").ReactNode }) => h("button", { type: "button", disabled: buttonProps.disabled, onClick: buttonProps.onClick }, buttonProps.children));
    return h(Control, { variant: "outline", size: "sm", ...props }, label);
  }
  function FailureDetails({ title, failures, separator }: { title: string; failures: { sessionId: string; message: string }[]; separator: string }) {
    const [open, setOpen] = React.useState(false);
    const list = h("ul", null, failures.map(failure => h("li", { key: failure.sessionId }, failure.sessionId, separator, failure.message)));
    return h(Disclosure, { title, open, onToggle: () => setOpen(value => !value) }, list);
  }
  return function OrganizerPanel({ t, archived, busy, ready, days, onDays, count, onPreview, progress, result, onRetry, undoCount, onUndo, onReload, skipScheduled, onSkipScheduled, scheduledSkipped = 0, orphanCount = 0, orphanSizeBytes = 0, orphanCleaning = false, onCleanOrphans }: OrganizerPanelProps) {
    return h(React.Fragment, null,
      h("style", null, ".dsham_organizer,.dsham_batchFeedback{display:grid;gap:12px;margin:0 0 16px;padding:14px 16px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2)}.dsham_organizerControls{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.dsham_organizer label{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary)}.dsham_number{width:88px;height:32px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}.dsham_number:hover{border-color:var(--dsw-alias-border-l3)}.dsham_number:focus{outline:none;border-color:var(--dsw-alias-state-business-primary)}.dsham_disclosure{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}.dsham_foldChevron{transition:transform 150ms ease}.dsham_foldChevron.is-open{transform:rotate(180deg)}.dsham_organizer p,.dsham_batchFeedback p{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsham_batchFeedback progress{width:100%}.dsham_batchFeedback details{font-size:12px;overflow-wrap:anywhere}.dsham_archivePreview{max-height:260px;overflow:auto;display:grid;gap:8px;padding:8px 0}.dsham_archivePreview label{display:flex;gap:8px;align-items:center;overflow-wrap:anywhere}.dsham_switchRow{cursor:pointer}.dsham_switchRow:has(input:disabled){cursor:not-allowed;opacity:.6}.dsham_skippedNote{color:var(--dsw-alias-state-warning-primary,#d99a2b)!important}"),
      (!archived || !ready) && h("div", { className: "dsham_organizer" }, h("div", { className: "dsham_organizerControls" },
        !ready && textButton(t("organizer.reloadFavorites"), { disabled: busy, onClick: onReload }),
        !archived && h(React.Fragment, null,
          h("label", null, t("organizer.idleDays"), h(NumberField, { min: 1, max: 36500, value: days === "" ? null : Number(days), disabled: busy, "aria-label": t("organizer.idleDays"), onChange: value => onDays(value == null ? "" : String(value)) })),
          textButton(t("organizer.preview", { n: count }), { disabled: busy || !ready || count === 0, onClick: onPreview })),
        !archived && h("label", { className: "dsham_switchRow" },
          h("input", {
            type: "checkbox",
            className: "dsham_checkbox",
            checked: skipScheduled,
            disabled: busy,
            "aria-label": t("organizer.skipScheduled"),
            onChange: (event: { target: { checked: boolean } }) => onSkipScheduled(event.target.checked)
          }),
          h("span", null, t("organizer.skipScheduled")))),
      !archived && h("p", null, t("organizer.rules")),
      !archived && h("p", null, t("organizer.skipScheduledHint")),
      scheduledSkipped > 0 && h("p", { className: "dsham_skippedNote", role: "status" }, t("organizer.skippedScheduled", { n: scheduledSkipped }))),
      orphanCount > 0 && h("div", { className: "dsham_organizer" },
        h("div", { className: "dsham_organizerControls" },
          h("strong", null, t("organizer.orphanTitle", { n: orphanCount })),
          onCleanOrphans && textButton(t(orphanCleaning ? "organizer.cleaning" : "organizer.cleanOrphans"), { disabled: busy || orphanCleaning, onClick: onCleanOrphans })),
        h("p", null, t("organizer.orphanDesc", { size: formatBytes(orphanSizeBytes) }))),
      (progress || result || undoCount > 0) && h("section", { className: "dsham_batchFeedback", "aria-label": t("organizer.feedback") },
      progress && h("div", { role: "status", "aria-live": "polite" },
        h("progress", { value: progress.done, max: Math.max(1, progress.total), "aria-label": t("organizer.progress") }),
        t("organizer.progressCount", { done: progress.done, total: progress.total })),
      result && h("div", { role: "status" },
        h("strong", null, t(`organizer.${result.kind ?? "archive"}Result`)),
        h("p", null, t("organizer.result", { succeeded: result.succeeded.length, skipped: result.skipped.length, failed: result.failures.length })),
        result.failures.length > 0 && h(FailureDetails, { title: t("organizer.failureDetails"), failures: result.failures, separator: t("common.separator") }),
        result.refreshError && h("p", { role: "alert" }, t("organizer.refreshError", { detail: result.refreshError })),
        result.remaining.length > 0 && textButton(t("organizer.retry", { n: result.remaining.length }), { disabled: busy, onClick: onRetry })),
      undoCount > 0 && h("div", { className: "dsham_organizerControls" },
        textButton(t("organizer.undo", { n: undoCount }), { disabled: busy, onClick: onUndo }),
        h("p", null, t("organizer.undoHint")))));
  };
}

export const organizerZh = {
  "organizer.feedback": "操作反馈",
  "organizer.allSessions": "全部会话", "organizer.favoriteFilter": "收藏筛选",
  "organizer.archiveResult": "归档结果", "organizer.restoreResult": "恢复结果", "organizer.deleteResult": "删除结果", "organizer.undoResult": "撤回结果",
  "organizer.favorite": "收藏", "organizer.unfavorite": "取消收藏", "organizer.favoritesOnly": "只看收藏",
  "organizer.reloadFavorites": "重新加载收藏", "organizer.idleDays": "闲置天数", "organizer.preview": "预览闲置归档（{n}）",
  "organizer.rules": "按最后活动时间筛选，遵循当前列表筛选条件；排除收藏、当前打开、正在执行及等待交互的会话。",
  "organizer.progress": "批量操作进度", "organizer.progressCount": "已处理 {done} / {total}",
  "organizer.result": "成功 {succeeded} · 跳过 {skipped} · 失败 {failed}",
  "organizer.failureDetails": "查看失败详情", "organizer.refreshError": "操作结果已保留，但列表刷新失败：{detail}",
  "organizer.retry": "重试剩余 {n} 条", "organizer.undo": "撤回本次归档（{n}）",
  "organizer.undoHint": "仅保留本次打开管理页期间最近一批归档；关闭页面或刷新后清除。撤回不会恢复已删除的会话。",
  "organizer.idleConfirm": "请检查以下候选，可取消勾选；执行前再次排除收藏及活跃会话。",
  "organizer.manualConfirm": "仅归档以下勾选会话；可逐条取消。归档后可撤回本批操作。",
  "organizer.skipScheduled": "归档时跳过含定时任务的会话",
  "organizer.skipScheduledHint": "绑定了活动定时任务的会话不会被归档，任务继续按点运行。归档会让宿主停止并删除这些任务，因此默认排除。",
  "organizer.skippedScheduled": "已跳过 {n} 个含定时任务的会话",
  "organizer.orphanTitle": "发现 {n} 个无主孤儿子代理",
  "organizer.orphanDesc": "母会话已被外部删除，这些子代理在日常聊天列表中不可见，共占用约 {size} 磁盘空间。清理不可撤销。",
  "organizer.cleanOrphans": "清理全部孤儿",
  "organizer.cleaning": "清理中…",
  "organizer.orphanCleanSuccess": "已成功清理 {n} 个无主子代理会话。"
};

export const organizerEn = {
  "organizer.feedback": "Operation feedback",
  "organizer.allSessions": "All sessions", "organizer.favoriteFilter": "Favorites filter",
  "organizer.archiveResult": "Archive results", "organizer.restoreResult": "Restore results", "organizer.deleteResult": "Delete results", "organizer.undoResult": "Undo results",
  "organizer.favorite": "Favorite", "organizer.unfavorite": "Unfavorite", "organizer.favoritesOnly": "Favorites only",
  "organizer.reloadFavorites": "Reload favorites", "organizer.idleDays": "Idle days", "organizer.preview": "Preview idle archives ({n})",
  "organizer.rules": "Uses last activity, the current list filters. Excludes favorites, open, running and waiting sessions.",
  "organizer.progress": "Batch progress", "organizer.progressCount": "Processed {done} / {total}",
  "organizer.result": "Succeeded {succeeded} · Skipped {skipped} · Failed {failed}",
  "organizer.failureDetails": "Failure details", "organizer.refreshError": "Results retained, but refresh failed: {detail}",
  "organizer.retry": "Retry remaining {n}", "organizer.undo": "Undo this archive batch ({n})",
  "organizer.undoHint": "Only the latest archive batch while this page is open is retained. Closing or refreshing clears undo. Deleted sessions cannot be restored.",
  "organizer.idleConfirm": "Review and deselect candidates. Favorites and active sessions are checked again before archiving.",
  "organizer.manualConfirm": "Only checked sessions below will be archived. You can undo this batch afterward.",
  "organizer.skipScheduled": "Skip sessions with scheduled tasks when archiving",
  "organizer.skipScheduledHint": "Sessions bound to active scheduled tasks are not archived, so their tasks keep running. Archiving would make the host stop and delete those tasks, so they are excluded by default.",
  "organizer.skippedScheduled": "Skipped {n} session(s) with scheduled tasks",
  "organizer.orphanTitle": "Found {n} orphan subagents",
  "organizer.orphanDesc": "Parent sessions were deleted externally. These subagents are hidden from normal chat lists and occupy ~{size} disk space. Removal cannot be undone.",
  "organizer.cleanOrphans": "Clean up all orphans",
  "organizer.cleaning": "Cleaning up…",
  "organizer.orphanCleanSuccess": "Successfully cleaned up {n} orphan subagent sessions."
};

export const organizerRu = {
  "organizer.feedback": "Отзыв об операции",
  "organizer.allSessions": "Все сессии", "organizer.favoriteFilter": "Фильтр избранного",
  "organizer.archiveResult": "Результаты архивации", "organizer.restoreResult": "Результаты восстановления", "organizer.deleteResult": "Результаты удаления", "organizer.undoResult": "Результаты отмены",
  "organizer.favorite": "В избранное", "organizer.unfavorite": "Убрать из избранного", "organizer.favoritesOnly": "Только избранное",
  "organizer.reloadFavorites": "Перезагрузить избранное", "organizer.idleDays": "Дни простоя", "organizer.preview": "Предпросмотр архива простоя ({n})",
  "organizer.rules": "Использует последнюю активность и текущие фильтры списка. Исключает избранное, открытые, запущенные и ожидающие сессии.",
  "organizer.progress": "Ход пакетной операции", "organizer.progressCount": "Обработано {done} / {total}",
  "organizer.result": "Успешно {succeeded} · Пропущено {skipped} · Ошибок {failed}",
  "organizer.failureDetails": "Подробности ошибок", "organizer.refreshError": "Результаты сохранены, но обновление списка не удалось: {detail}",
  "organizer.retry": "Повторить оставшиеся {n}", "organizer.undo": "Отменить эту архивацию ({n})",
  "organizer.undoHint": "Сохраняется только последняя пакетная архивация, пока открыта эта страница. Закрытие или обновление сбрасывает отмену. Удалённые сессии восстановить нельзя.",
  "organizer.idleConfirm": "Проверьте кандидатов, можно снять отметку. Перед архивацией избранное и активные сессии проверяются повторно.",
  "organizer.manualConfirm": "Будут заархивированы только отмеченные ниже сессии. Эту пакетную операцию можно отменить позже.",
  "organizer.skipScheduled": "Пропускать сессии с задачами по расписанию",
  "organizer.skipScheduledHint": "Сессии со активными задачами по расписанию не архивируются, чтобы задачи продолжали выполняться. При архивации хост останавливает и удаляет эти задачи, поэтому они исключены по умолчанию.",
  "organizer.skippedScheduled": "Пропущено сессий с задачами по расписанию: {n}",
  "organizer.orphanTitle": "Найдено {n} осиротевших подагентов",
  "organizer.orphanDesc": "Родительские сессии были удалены извне. Подагенты скрыты из обычных списков чатов и занимают ~{size} дискового пространства. Удаление необратимо.",
  "organizer.cleanOrphans": "Очистить всех сирот",
  "organizer.cleaning": "Очистка…",
  "organizer.orphanCleanSuccess": "Успешно очищено {n} осиротевших подагентов."
};
