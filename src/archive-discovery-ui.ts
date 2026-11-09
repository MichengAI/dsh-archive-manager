import { errorMessage } from "./contracts.js";
import type { Translate, SearchInput, SearchHit, Failure, SessionSummary } from "./contracts.js";
import { DateRange, Disclosure } from "./plugin-ui.js";
import type { ArchivePreviewResult } from "./archive-discovery.js";
import type * as ReactTypes from "react";
import type { ComponentType, ReactNode } from "react";
interface SearchState { key?: string; status: string; items: SearchHit[]; failures: Failure[]; done?: number; total?: number; error?: string }
interface PreviewTarget { session: SessionSummary; query: string }
interface PreviewState { key?: PreviewTarget | null; status: string; value?: ArchivePreviewResult; error?: string }
interface MarkdownProps { text: string; streaming: boolean; labels: { code: { copyLabel: string; copiedLabel: string }; footnotes: string } }
import { searchArchiveBatches, findTextRange } from "./archive-discovery.js";

type HostButton = ComponentType<Record<string, unknown>>;
type HostSegmented = (props: { id: string; label: string; value: string; options: readonly { value: string; label: string }[]; onChange(value: string): void }) => ReactNode;
type ReactNamespace = typeof ReactTypes;

/** 搜索异步状态和预览展示独立于页面业务操作，防止旧请求覆盖新筛选。 */
export function createDiscoveryTools(React: ReactNamespace, host: { Button?: HostButton; SegmentedControl?: HostSegmented } = {}) {
  const h = React.createElement;
  function HighlightedText({ text, query = "" }: { text: string; query?: string }) {
    const match = findTextRange(text, query);
    return !match ? text : h(React.Fragment, null, text.slice(0, match.start), h("mark", null, text.slice(match.start, match.end)), text.slice(match.end));
  }
  function useArchiveSearch(ids: readonly string[], query: string, enabled: boolean, call?: (input: SearchInput) => Promise<unknown>) {
    const idsKey = JSON.stringify(ids);
    const key = JSON.stringify([idsKey, query]);
    const [revision, setRevision] = React.useState(0);
    const [state, setState] = React.useState<SearchState>({ key: "", status: "idle", items: [], failures: [] });
    React.useEffect(() => {
      if (!enabled || !query.trim() || !call) return;
      const controller = new AbortController();
      setState({ key, status: "loading", items: [], failures: [], done: 0, total: ids.length });
      const timer = setTimeout(() => {
        searchArchiveBatches(JSON.parse(idsKey), query, call, { signal: controller.signal, onProgress: progress => {
          if (!controller.signal.aborted) setState({ key, status: "loading", ...progress });
        } }).then(result => { if (!controller.signal.aborted) setState({ key, status: "ready", done: ids.length, total: ids.length, ...result }); })
          .catch(error => { if (!controller.signal.aborted) setState(previous => ({ ...previous, key, status: "error", error: errorMessage(error) })); });
      }, 350);
      return () => { controller.abort(); clearTimeout(timer); };
    }, [idsKey, query, enabled, call, revision]);
    const active = enabled && query.trim() && call;
    return { ...(active ? state.key === key ? state : { key, status: "loading", items: [], failures: [], done: 0, total: ids.length } : { status: "idle", items: [], failures: [] }), retry: () => setRevision(value => value + 1) };
  }
  function useArchivePreview(call: ((input: { sessionId: string; query: string }) => Promise<ArchivePreviewResult>) | undefined, eligibleIds: readonly string[]) {
    const [target, setTarget] = React.useState<PreviewTarget | null>(null);
    const [state, setState] = React.useState<PreviewState>({ status: "idle" });
    const [revision, setRevision] = React.useState(0);
    // 每次打开拥有独立身份，避免同一会话再次打开时闪现旧预览。
    const key = target;
    const available = target && eligibleIds.includes(target.session.id);
    React.useEffect(() => {
      if (target && !available) setTarget(null);
    }, [target, available]);
    React.useEffect(() => {
      if (!available || typeof window === "undefined") return;
      // 预览位于设置壳之上，先截获 Escape，防止两层弹窗一起关闭。
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        setTarget(null);
      };
      window.addEventListener("keydown", onKeyDown, true);
      return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [available]);
    React.useEffect(() => {
      if (!target || !available || !call) return;
      let active = true;
      setState({ key, status: "loading" });
      Promise.resolve().then(() => call({ sessionId: target.session.id, query: target.query })).then(value => {
        if (active) setState({ key, status: "ready", value });
      }).catch(error => { if (active) setState({ key, status: "error", error: errorMessage(error) }); });
      return () => { active = false; };
    }, [key, available, call, revision]);
    return { target: available ? target : null, ...(state.key === key ? state : { status: "loading" }), open: (session: SessionSummary, query = "") => setTarget({ session, query }), close: () => setTarget(null), retry: () => setRevision(value => value + 1) };
  }
  function FailureDetails({ title, failures, separator }: { title: string; failures: Failure[]; separator: string }) {
    const [open, setOpen] = React.useState(false);
    const list = h("ul", null, failures.map(row => h("li", { key: row.sessionId }, row.sessionId, separator, row.message)));
    return h(Disclosure, { title, open, onToggle: () => setOpen(value => !value) }, list);
  }
  function textButton(label: string, props: { disabled?: boolean; onClick(): void }) {
    const Button = host.Button ?? ((buttonProps: { disabled?: boolean; onClick?: () => void; children?: ReactNode }) => h("button", { type: "button", disabled: buttonProps.disabled, onClick: buttonProps.onClick }, buttonProps.children));
    return h(Button, { variant: "outline", size: "sm", ...props }, label);
  }
  function DiscoveryFilters({ t, from, to, onFrom, onTo, invalid, onClear }: { t: Translate; from: string; to: string; onFrom(value: string): void; onTo(value: string): void; invalid: boolean; onClear(): void }) {
    return h("div", { className: "dsham_dateFilter" },
      h(DateRange, { React, from, to, invalid, label: t("discovery.date"), fromLabel: t("discovery.from"), toLabel: t("discovery.to"), onFrom, onTo, onClear, t }),
      invalid ? h("p", { className: "dsham_dateAlert", role: "alert" }, t("discovery.invalidDate")) : null);
  }
  function SearchStatus({ state, t }: { state: SearchState & { retry(): void }; t: Translate }) {
    if (state.status === "idle") return null;
    return h("div", { className: "dsham_discoveryStatus", role: "status", "aria-live": "polite" },
      h("p", null, t(state.status === "loading" ? "discovery.searching" : state.status === "error" ? "discovery.searchError" : "discovery.searched", { done: state.done ?? 0, total: state.total ?? 0 })),
      state.status === "error" && h("p", null, state.error),
      state.failures.length > 0 && h(FailureDetails, { title: t("discovery.failed", { n: state.failures.length }), failures: state.failures, separator: t("common.separator") }),
      (state.status === "error" || (state.status === "ready" && state.failures.length > 0)) && textButton(t("discovery.retry"), { onClick: state.retry }));
  }
  function PreviewContent({ preview, t, MarkdownText }: { preview: PreviewState & { target?: PreviewTarget | null; retry(): void }; t: Translate; MarkdownText?: ComponentType<MarkdownProps> }) {
    const [raw, setRaw] = React.useState(false);
    if (preview.status === "loading") return h("p", { role: "status" }, t("discovery.loading"));
    if (preview.status === "error") return h("div", null, h("p", { role: "alert" }, preview.error), textButton(t("discovery.retry"), { onClick: preview.retry }));
    const value = preview.value;
    if (!value) return null;
    return h("div", { className: "dsham_previewMessages" },
      h("div", { className: "dsham_previewToolbar" },
        h("span", { title: t("discovery.previewHint") }, t("discovery.readOnly"), " · ", t("discovery.messageCount", { n: value.messages.length })),
        MarkdownText && h(host.SegmentedControl ?? "div", {
          id: "dsham-preview-mode", label: t("discovery.displayMode"), value: raw ? "raw" : "formatted",
          options: [{ value: "formatted", label: t("discovery.formatted") }, { value: "raw", label: t("discovery.raw") }],
          onChange: (value: string) => setRaw(value === "raw")
        })),
      value.hasEarlier && h("p", null, t("discovery.earlier")),
      !value.messages.length && h("p", null, t("discovery.empty")),
      value.messages.map(row => h("article", { key: row.seq, className: "dsham_previewMessage" }, h("div", { className: "dsham_previewRole", "data-role": row.role }, h("span", { "aria-hidden": true }, t(row.role === "user" ? "discovery.you" : "discovery.ai")), h("strong", null, t("discovery." + row.role))), raw || !MarkdownText ? h("pre", { className: "dsham_previewRaw" }, h(HighlightedText, { text: row.text, query: preview.target?.query })) : h(MarkdownText, { text: row.text, streaming: false, labels: { code: { copyLabel: t("discovery.copyCode"), copiedLabel: t("details.copied") }, footnotes: t("discovery.footnotes") } }), row.truncated && h("small", null, t("discovery.truncated")))),
      value.hasLater && h("p", null, t("discovery.later")));
  }
  return { HighlightedText, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent };
}

export const discoveryCss = [
  ".dsham_dateFilter{display:flex;align-items:center;gap:8px;min-width:0;position:relative}",
  ".dsham_dateAlert{position:absolute;top:calc(100% + 4px);right:0;margin:0;width:max-content;max-width:240px;padding:4px 8px;background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-state-error-primary);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:1100;font-size:12px;line-height:16px;color:var(--dsw-alias-state-error-primary);pointer-events:none}",
  ".dsham_dateRange{position:relative;display:inline-flex;align-items:center;flex:1 1 auto;min-width:0;box-sizing:border-box}",
  ".dsham_dateTrigger{display:inline-flex;align-items:center;gap:6px;width:100%;height:32px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;cursor:pointer;box-sizing:border-box;transition:all .15s ease}",
  ".dsham_dateTrigger:hover{border-color:var(--dsw-alias-border-l3)}",
  ".dsham_dateTrigger.is-open{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}",
  ".dsham_dateIcon{flex:none;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center}",
  ".dsham_dateText{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;color:var(--dsw-alias-label-primary)}",
  ".dsham_dateText.placeholder{color:var(--dsw-alias-label-primary)}",
  ".dsham_dateClearBtn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);border-radius:50%;cursor:pointer;font-size:13px;line-height:1}",
  ".dsham_dateClearBtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
  ".dsham_dateChevron{flex:none;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center}",
  ".dsham_dateInputSrOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
  ".dsham_datePopover{position:absolute;top:calc(100% + 4px);right:0;left:auto;z-index:1000;display:flex;gap:10px;padding:10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:0 8px 24px rgba(0,0,0,0.12),0 2px 6px rgba(0,0,0,0.06);box-sizing:border-box}",
  ".dsham_datePresets{width:84px;border-right:0.5px solid var(--dsw-alias-border-l2);padding-right:8px;display:flex;flex-direction:column;gap:3px;flex:none}",
  ".dsham_datePresetBtn{border:0;background:transparent;padding:5px 6px;text-align:left;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-sm,6px);cursor:pointer;transition:all .15s ease;white-space:nowrap}",
  ".dsham_datePresetBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
  ".dsham_dateCalendar{width:224px;display:flex;flex-direction:column;gap:6px;flex:none}",
  ".dsham_dateCalHeader{display:flex;justify-content:space-between;align-items:center;padding:0 2px}",
  ".dsham_dateMonthTitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
  ".dsham_dateNavBtn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:14px;line-height:1}",
  ".dsham_dateNavBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
  ".dsham_dateGrid{display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px}",
  ".dsham_dateWeekday{font-size:11px;color:var(--dsw-alias-label-tertiary);text-align:center;padding:3px 0;font-weight:500}",
  ".dsham_dateDay{position:relative;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:0}",
  ".dsham_dateDay.is-outside{color:var(--dsw-alias-label-quaternary)}",
  ".dsham_dateDay:not(.is-outside):hover{background:var(--dsw-alias-interactive-bg-hover);border-radius:4px}",
  ".dsham_dateDay.is-start{background:var(--dsw-alias-state-business-primary)!important;color:#fff!important;border-top-left-radius:6px;border-bottom-left-radius:6px}",
  ".dsham_dateDay.is-end{background:var(--dsw-alias-state-business-primary)!important;color:#fff!important;border-top-right-radius:6px;border-bottom-right-radius:6px}",
  ".dsham_dateDay.is-start.is-end{border-radius:6px!important}",
  ".dsham_dateDay.is-in-range{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-state-business-primary)}",
  ".dsham_dateDay.is-today::after{content:'';position:absolute;bottom:2px;width:3px;height:3px;border-radius:50%;background:var(--dsw-alias-state-business-primary)}",
  ".dsham_dateDay.is-start.is-today::after,.dsham_dateDay.is-end.is-today::after{background:#fff}",
  ".dsham_discoveryStatus{font-size:12px;margin-bottom:12px;overflow-wrap:anywhere}",
  ".dsham_settingsSnippet{display:block;width:100%;padding:0;margin:4px 0 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}",
  ".dsham_previewMessages{max-height:65vh;overflow:auto;overflow-wrap:anywhere;padding-right:8px}",
  ".dsham_previewToolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;color:var(--dsw-alias-label-secondary);font-size:12px}",
  ".dsham_previewRole{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px}",
  ".dsham_previewRole>span{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--dsw-alias-bg-layer-3);font-size:11px}",
  ".dsham_previewRole[data-role=user]>span{color:var(--dsw-alias-state-business-primary)}",
  ".dsham_previewRaw{white-space:pre-wrap;font:13px/1.8 ui-monospace,monospace;overflow-wrap:anywhere}",
  ".dsham_previewMessage pre:not(.dsham_previewRaw){white-space:pre;overflow-x:auto;max-width:100%}",
  ".dsham_previewMessage table{display:block;max-width:100%;overflow-x:auto}",
  ".dsham_previewMessage img{max-width:100%}",
  "@media(max-width:520px){.dsham_previewToolbar{align-items:flex-start;flex-wrap:wrap}}",
  ".dsham_previewMessage{padding:18px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}",
  ".dsham_previewMessage p{font-size:14px;line-height:1.8}",
  ".dsham_previewHint,.dsham_previewMessage small{color:var(--dsw-alias-label-secondary);font-size:12px}",
  ".dsham_settings mark,.dsham_previewMessages mark{background:var(--dsw-alias-state-warn-tertiary);color:inherit;border-radius:2px}",
  ".dsham_settingsSnippet:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}"
].join("");
export const discoveryZh = {
  "common.separator": "：",
  "copy.empty": "没有可复制的内容", "copy.unavailable": "当前环境不支持剪贴板，请在 HTTPS 或本机地址中打开页面", "copy.denied": "复制失败，请允许浏览器访问剪贴板后重试", "discovery.you": "你", "discovery.ai": "AI",
  "discovery.readOnly": "只读预览", "discovery.messageCount": "本次显示 {n} 条消息", "discovery.displayMode": "显示方式", "discovery.formatted": "排版", "discovery.raw": "原文与高亮", "discovery.copyCode": "复制代码", "discovery.footnotes": "注释", "details.copyId": "复制会话 ID", "details.copied": "已复制", "discovery.date": "日期", "discovery.timeRange": "时间范围", "discovery.allTime": "全部时间", "discovery.today": "今天", "discovery.last7Days": "近 7 天", "discovery.last30Days": "近 30 天", "discovery.last90Days": "近 90 天", "discovery.customRange": "自定义…", "discovery.dateActive": "日期·已选", "discovery.clearDate": "清除日期", "discovery.active": "已启用", "discovery.scope": "查找范围", "discovery.titleOnly": "仅标题", "discovery.titleAndContent": "标题与正文", "discovery.from": "更新时间从", "discovery.to": "至", "discovery.clear": "清除条件", "discovery.invalidDate": "开始日期不能晚于结束日期，请检查日期范围。",
  "discovery.searching": "正在检索正文：{done} / {total}", "discovery.searched": "正文检索完成：{done} / {total}", "discovery.searchError": "正文检索未完成，当前结果可能不完整。", "discovery.failed": "{n} 条会话读取失败", "discovery.retry": "重试", "discovery.preview": "快速预览", "discovery.loading": "正在读取会话…", "discovery.previewHint": "只读预览原始对话文本，不恢复会话；不含工具输出、附件、推理和系统内容。", "discovery.earlier": "前面还有消息，可打开完整会话查看。", "discovery.later": "后面还有消息，可打开完整会话查看。", "discovery.empty": "没有可预览的用户或助手文本。", "discovery.truncated": "本条仅显示部分内容。", "discovery.user": "用户", "discovery.assistant": "助手", "discovery.openFull": "打开完整会话", "discovery.searchPlaceholder": "搜索标题或正文"
};
export const discoveryEn = {
  "common.separator": ": ",
  "copy.empty": "Nothing to copy", "copy.unavailable": "Clipboard unavailable. Open the page over HTTPS or localhost.", "copy.denied": "Copy failed. Allow clipboard access and retry.", "discovery.you": "You", "discovery.ai": "AI",
  "discovery.readOnly": "Read-only preview", "discovery.messageCount": "Showing {n} messages", "discovery.displayMode": "Display mode", "discovery.formatted": "Formatted", "discovery.raw": "Source and highlights", "discovery.copyCode": "Copy code", "discovery.footnotes": "Footnotes", "details.copyId": "Copy session ID", "details.copied": "Copied", "discovery.date": "Date", "discovery.timeRange": "Time range", "discovery.allTime": "All time", "discovery.today": "Today", "discovery.last7Days": "Past 7 days", "discovery.last30Days": "Past 30 days", "discovery.last90Days": "Past 90 days", "discovery.customRange": "Custom…", "discovery.dateActive": "Date · Set", "discovery.clearDate": "Clear dates", "discovery.active": "Active", "discovery.scope": "Search in", "discovery.titleOnly": "Titles", "discovery.titleAndContent": "Titles and content", "discovery.from": "Updated from", "discovery.to": "To", "discovery.clear": "Clear filters", "discovery.invalidDate": "Check the date range: the start must not be after the end.",
  "discovery.searching": "Searching content: {done} / {total}", "discovery.searched": "Content search complete: {done} / {total}", "discovery.searchError": "Content search is incomplete; results may be missing.", "discovery.failed": "Could not read {n} conversations", "discovery.retry": "Retry", "discovery.preview": "Quick preview", "discovery.loading": "Reading conversation…", "discovery.previewHint": "Read-only original conversation text; keeps the conversation archived. Excludes tools, attachments, reasoning and system content.", "discovery.earlier": "More messages before this preview. Open the full conversation to read them.", "discovery.later": "More messages after this preview. Open the full conversation to read them.", "discovery.empty": "No user or assistant text to preview.", "discovery.truncated": "Only part of this message is shown.", "discovery.user": "User", "discovery.assistant": "Assistant", "discovery.openFull": "Open full conversation", "discovery.searchPlaceholder": "Search titles or content"
};

export const discoveryRu = {
  "common.separator": ": ",
  "copy.empty": "Нечего копировать", "copy.unavailable": "Буфер обмена недоступен. Откройте страницу по HTTPS или localhost.", "copy.denied": "Не удалось скопировать. Разрешите доступ к буферу обмена и повторите.", "discovery.you": "Вы", "discovery.ai": "ИИ",
  "discovery.readOnly": "Предпросмотр только для чтения", "discovery.messageCount": "Показано сообщений: {n}", "discovery.displayMode": "Режим отображения", "discovery.formatted": "Форматировано", "discovery.raw": "Исходник и подсветка", "discovery.copyCode": "Копировать код", "discovery.footnotes": "Сноски", "details.copyId": "Копировать ID сессии", "details.copied": "Скопировано", "discovery.date": "Дата", "discovery.timeRange": "Период", "discovery.allTime": "Все время", "discovery.today": "Сегодня", "discovery.last7Days": "Последние 7 дней", "discovery.last30Days": "Последние 30 дней", "discovery.last90Days": "Последние 90 дней", "discovery.customRange": "Свой период…", "discovery.dateActive": "Дата · Выбрана", "discovery.clearDate": "Сбросить даты", "discovery.active": "Включено", "discovery.scope": "Искать в", "discovery.titleOnly": "Названия", "discovery.titleAndContent": "Названия и содержимое", "discovery.from": "Обновлено с", "discovery.to": "По", "discovery.clear": "Сбросить фильтры", "discovery.invalidDate": "Проверьте диапазон дат: начало не должно быть позже конца.",
  "discovery.searching": "Поиск по содержимому: {done} / {total}", "discovery.searched": "Поиск по содержимому завершён: {done} / {total}", "discovery.searchError": "Поиск по содержимому неполный; результаты могут быть неполными.", "discovery.failed": "Не удалось прочитать {n} разговоров", "discovery.retry": "Повторить", "discovery.preview": "Быстрый предпросмотр", "discovery.loading": "Чтение разговора…", "discovery.previewHint": "Только чтение исходного текста разговора; сессия остаётся в архиве. Без вывода инструментов, вложений, рассуждений и системного содержимого.", "discovery.earlier": "Перед предпросмотром есть ещё сообщения. Откройте полный разговор, чтобы их прочитать.", "discovery.later": "После предпросмотра есть ещё сообщения. Откройте полный разговор, чтобы их прочитать.", "discovery.empty": "Нет текста пользователя или ассистента для предпросмотра.", "discovery.truncated": "Показана только часть этого сообщения.", "discovery.user": "Пользователь", "discovery.assistant": "Ассистент", "discovery.openFull": "Открыть полный разговор", "discovery.searchPlaceholder": "Поиск по названиям или содержимому"
};
export const discoveryJa = {
  "common.separator": "：",
  "copy.empty": "コピーできる内容がありません",
  "copy.unavailable": "現在の環境ではクリップボードを利用できません。HTTPS またはローカル環境で開いてください",
  "copy.denied": "コピーに失敗しました。ブラウザのクリップボードへのアクセスを許可して再試行してください",
  "discovery.you": "あなた",
  "discovery.ai": "AI",
  "discovery.readOnly": "読み取り専用プレビュー",
  "discovery.messageCount": "今回は {n} 件のメッセージを表示",
  "discovery.displayMode": "表示形式",
  "discovery.formatted": "整形表示",
  "discovery.raw": "原文と強調表示",
  "discovery.copyCode": "コードをコピー",
  "discovery.footnotes": "脚注",
  "details.copyId": "セッション ID をコピー",
  "details.copied": "コピーしました",
  "discovery.date": "日付",
  "discovery.timeRange": "期間",
  "discovery.allTime": "すべての期間",
  "discovery.today": "今日",
  "discovery.last7Days": "過去 7 日間",
  "discovery.last30Days": "過去 30 日間",
  "discovery.last90Days": "過去 90 日間",
  "discovery.customRange": "カスタム期間…",
  "discovery.dateActive": "日付・指定あり",
  "discovery.clearDate": "日付をクリア",
  "discovery.active": "有効",
  "discovery.scope": "検索対象",
  "discovery.titleOnly": "タイトルのみ",
  "discovery.titleAndContent": "タイトルと本文",
  "discovery.from": "更新日（開始）",
  "discovery.to": "更新日（終了）",
  "discovery.clear": "条件をクリア",
  "discovery.invalidDate": "開始日は終了日より前の日付を指定してください。",
  "discovery.searching": "本文を検索中：{done} / {total}",
  "discovery.searched": "本文の検索完了：{done} / {total}",
  "discovery.searchError": "本文の検索が未完了です。結果の一部が表示されていない可能性があります。",
  "discovery.failed": "{n} 件のセッションの読み込みに失敗しました",
  "discovery.retry": "再試行",
  "discovery.preview": "クイックプレビュー",
  "discovery.loading": "セッションを読み込み中…",
  "discovery.previewHint": "元の会話テキストを読み取り専用でプレビューします（復元は行われません）。ツール出力、添付ファイル、推論、システム内容は含まれません。",
  "discovery.earlier": "これ以前のメッセージがあります。全内容を確認するにはセッションを開いてください。",
  "discovery.later": "これ以降のメッセージがあります。全内容を確認するにはセッションを開いてください。",
  "discovery.empty": "プレビューできるユーザーまたはアシスタントのメッセージがありません。",
  "discovery.truncated": "一部のみ表示されています。",
  "discovery.user": "ユーザー",
  "discovery.assistant": "アシスタント",
  "discovery.openFull": "セッション全体を開く",
  "discovery.searchPlaceholder": "タイトルまたは本文を検索"
};

export const discoveryEs = {
  "common.separator": ": ",
  "copy.empty": "No hay nada para copiar",
  "copy.unavailable": "Portapapeles no disponible. Abra la página a través de HTTPS o localhost.",
  "copy.denied": "Error al copiar. Permita el acceso al portapapeles y reintente.",
  "discovery.you": "Tú",
  "discovery.ai": "IA",
  "discovery.readOnly": "Vista previa de solo lectura",
  "discovery.messageCount": "Mostrando {n} mensajes",
  "discovery.displayMode": "Modo de visualización",
  "discovery.formatted": "Con formato",
  "discovery.raw": "Texto original y resaltados",
  "discovery.copyCode": "Copiar código",
  "discovery.footnotes": "Notas al pie",
  "details.copyId": "Copiar ID de sesión",
  "details.copied": "Copiado",
  "discovery.date": "Fecha",
  "discovery.timeRange": "Rango de fechas",
  "discovery.allTime": "Todo el tiempo",
  "discovery.today": "Hoy",
  "discovery.last7Days": "Últimos 7 días",
  "discovery.last30Days": "Últimos 30 días",
  "discovery.last90Days": "Últimos 90 días",
  "discovery.customRange": "Personalizado…",
  "discovery.dateActive": "Fecha · Establecida",
  "discovery.clearDate": "Borrar fechas",
  "discovery.active": "Activo",
  "discovery.scope": "Buscar en",
  "discovery.titleOnly": "Solo títulos",
  "discovery.titleAndContent": "Títulos y contenido",
  "discovery.from": "Actualizado desde",
  "discovery.to": "Hasta",
  "discovery.clear": "Borrar filtros",
  "discovery.invalidDate": "Verifique el rango de fechas: el inicio no puede ser posterior al final.",
  "discovery.searching": "Buscando contenido: {done} / {total}",
  "discovery.searched": "Búsqueda de contenido completada: {done} / {total}",
  "discovery.searchError": "La búsqueda de contenido está incompleta; pueden faltar resultados.",
  "discovery.failed": "No se pudieron leer {n} conversaciones",
  "discovery.retry": "Reintentar",
  "discovery.preview": "Vista previa rápida",
  "discovery.loading": "Leyendo conversación…",
  "discovery.previewHint": "Texto original en modo solo lectura; mantiene la conversación archivada. Excluye herramientas, adjuntos, razonamiento y mensajes de sistema.",
  "discovery.earlier": "Hay más mensajes antes de esta vista previa. Abra la conversación completa para verlos.",
  "discovery.later": "Hay más mensajes después de esta vista previa. Abra la conversación completa para verlos.",
  "discovery.empty": "No hay texto de usuario o asistente para previsualizar.",
  "discovery.truncated": "Solo se muestra parte de este mensaje.",
  "discovery.user": "Usuario",
  "discovery.assistant": "Asistente",
  "discovery.openFull": "Abrir conversación completa",
  "discovery.searchPlaceholder": "Buscar títulos o contenido"
};

export const discoveryFr = {
  "common.separator": " : ",
  "copy.empty": "Rien à copier",
  "copy.unavailable": "Presse-papiers non disponible. Ouvrez la page via HTTPS ou localhost.",
  "copy.denied": "Échec de la copie. Autorisez l'accès au presse-papiers et réessayez.",
  "discovery.you": "Vous",
  "discovery.ai": "IA",
  "discovery.readOnly": "Aperçu en lecture seule",
  "discovery.messageCount": "Affichage de {n} messages",
  "discovery.displayMode": "Mode d'affichage",
  "discovery.formatted": "Mis en forme",
  "discovery.raw": "Source et surlignages",
  "discovery.copyCode": "Copier le code",
  "discovery.footnotes": "Notes de bas de page",
  "details.copyId": "Copier l'ID de session",
  "details.copied": "Copié",
  "discovery.date": "Date",
  "discovery.timeRange": "Plage de dates",
  "discovery.allTime": "Tout l'historique",
  "discovery.today": "Aujourd'hui",
  "discovery.last7Days": "7 derniers jours",
  "discovery.last30Days": "30 derniers jours",
  "discovery.last90Days": "90 derniers jours",
  "discovery.customRange": "Personnalisé…",
  "discovery.dateActive": "Date · Définie",
  "discovery.clearDate": "Effacer les dates",
  "discovery.active": "Actif",
  "discovery.scope": "Rechercher dans",
  "discovery.titleOnly": "Titres uniquement",
  "discovery.titleAndContent": "Titres et contenu",
  "discovery.from": "Mis à jour du",
  "discovery.to": "Au",
  "discovery.clear": "Effacer les filtres",
  "discovery.invalidDate": "Vérifiez la plage de dates : le début ne peut pas être postérieur à la fin.",
  "discovery.searching": "Recherche dans le contenu : {done} / {total}",
  "discovery.searched": "Recherche terminée : {done} / {total}",
  "discovery.searchError": "La recherche est incomplète ; des résultats peuvent manquer.",
  "discovery.failed": "Impossible de lire {n} conversations",
  "discovery.retry": "Réessayer",
  "discovery.preview": "Aperçu rapide",
  "discovery.loading": "Lecture de la conversation…",
  "discovery.previewHint": "Aperçu en lecture seule du texte original ; garde la conversation archivée. Exclut outils, pièces jointes, raisonnement et système.",
  "discovery.earlier": "D'autres messages précèdent cet aperçu. Ouvrez la conversation complète pour les lire.",
  "discovery.later": "D'autres messages suivent cet aperçu. Ouvrez la conversation complète pour les lire.",
  "discovery.empty": "Aucun message d'utilisateur ou d'assistant à prévisualiser.",
  "discovery.truncated": "Seule une partie de ce message est affichée.",
  "discovery.user": "Utilisateur",
  "discovery.assistant": "Assistant",
  "discovery.openFull": "Ouvrir la conversation complète",
  "discovery.searchPlaceholder": "Rechercher des titres ou du contenu"
};

export const discoveryDe = {
  "common.separator": ": ",
  "copy.empty": "Nichts zu kopieren",
  "copy.unavailable": "Zwischenablage nicht verfügbar. Öffnen Sie die Seite über HTTPS oder localhost.",
  "copy.denied": "Kopieren fehlgeschlagen. Zugriff auf die Zwischenablage erlauben und wiederholen.",
  "discovery.you": "Du",
  "discovery.ai": "KI",
  "discovery.readOnly": "Schreibgeschützte Vorschau",
  "discovery.messageCount": "{n} Nachrichten angezeigt",
  "discovery.displayMode": "Anzeigemodus",
  "discovery.formatted": "Formatiert",
  "discovery.raw": "Quelltext und Hervorhebungen",
  "discovery.copyCode": "Code kopieren",
  "discovery.footnotes": "Fußnoten",
  "details.copyId": "Sitzungs-ID kopieren",
  "details.copied": "Kopiert",
  "discovery.date": "Datum",
  "discovery.timeRange": "Zeitbereich",
  "discovery.allTime": "Gesamter Zeitraum",
  "discovery.today": "Heute",
  "discovery.last7Days": "Letzte 7 Tage",
  "discovery.last30Days": "Letzte 30 Tage",
  "discovery.last90Days": "Letzte 90 Tage",
  "discovery.customRange": "Benutzerdefiniert…",
  "discovery.dateActive": "Datum · Festgelegt",
  "discovery.clearDate": "Datumsangaben löschen",
  "discovery.active": "Aktiv",
  "discovery.scope": "Suchen in",
  "discovery.titleOnly": "Nur Titel",
  "discovery.titleAndContent": "Titel und Inhalt",
  "discovery.from": "Aktualisiert von",
  "discovery.to": "Bis",
  "discovery.clear": "Filter löschen",
  "discovery.invalidDate": "Datumsbereich prüfen: Das Startdatum darf nicht nach dem Enddatum liegen.",
  "discovery.searching": "Inhalt wird durchsucht: {done} / {total}",
  "discovery.searched": "Inhaltssuche abgeschlossen: {done} / {total}",
  "discovery.searchError": "Inhaltssuche unvollständig; möglicherweise fehlen Ergebnisse.",
  "discovery.failed": "{n} Unterhaltungen konnten nicht gelesen werden",
  "discovery.retry": "Wiederholen",
  "discovery.preview": "Schnellvorschau",
  "discovery.loading": "Unterhaltung wird gelesen…",
  "discovery.previewHint": "Schreibgeschützte Vorschau des Originaltextes; belässt die Unterhaltung im Archiv. Werkzeuge, Anhänge, Denkprozesse und Systeminhalte sind ausgeschlossen.",
  "discovery.earlier": "Vor dieser Vorschau gibt es weitere Nachrichten. Öffnen Sie die vollständige Unterhaltung, um sie zu lesen.",
  "discovery.later": "Nach dieser Vorschau gibt es weitere Nachrichten. Öffnen Sie die vollständige Unterhaltung, um sie zu lesen.",
  "discovery.empty": "Kein Text von Benutzer oder Assistent für eine Vorschau vorhanden.",
  "discovery.truncated": "Nur ein Teil dieser Nachricht wird angezeigt.",
  "discovery.user": "Benutzer",
  "discovery.assistant": "Assistent",
  "discovery.openFull": "Vollständige Unterhaltung öffnen",
  "discovery.searchPlaceholder": "Titel oder Inhalt suchen"
};

export const discoveryPt = {
  "common.separator": ": ",
  "copy.empty": "Nada para copiar",
  "copy.unavailable": "Área de transferência indisponível. Abra a página via HTTPS ou localhost.",
  "copy.denied": "Falha ao copiar. Permita o acesso à área de transferência e tente novamente.",
  "discovery.you": "Você",
  "discovery.ai": "IA",
  "discovery.readOnly": "Prévia somente leitura",
  "discovery.messageCount": "Exibindo {n} mensagens",
  "discovery.displayMode": "Modo de exibição",
  "discovery.formatted": "Formatado",
  "discovery.raw": "Texto original e destaques",
  "discovery.copyCode": "Copiar código",
  "discovery.footnotes": "Notas de rodapé",
  "details.copyId": "Copiar ID da sessão",
  "details.copied": "Copiado",
  "discovery.date": "Data",
  "discovery.timeRange": "Intervalo de datas",
  "discovery.allTime": "Todo o período",
  "discovery.today": "Hoje",
  "discovery.last7Days": "Últimos 7 dias",
  "discovery.last30Days": "Últimos 30 dias",
  "discovery.last90Days": "Últimos 90 dias",
  "discovery.customRange": "Personalizado…",
  "discovery.dateActive": "Data · Definida",
  "discovery.clearDate": "Limpar datas",
  "discovery.active": "Ativo",
  "discovery.scope": "Pesquisar em",
  "discovery.titleOnly": "Apenas títulos",
  "discovery.titleAndContent": "Títulos e conteúdo",
  "discovery.from": "Atualizado de",
  "discovery.to": "Até",
  "discovery.clear": "Limpar filtros",
  "discovery.invalidDate": "Verifique o intervalo de datas: o início não pode ser posterior ao fim.",
  "discovery.searching": "Pesquisando conteúdo: {done} / {total}",
  "discovery.searched": "Pesquisa de conteúdo concluída: {done} / {total}",
  "discovery.searchError": "A pesquisa de conteúdo está incompleta; alguns resultados podem estar ausentes.",
  "discovery.failed": "Não foi possível ler {n} conversas",
  "discovery.retry": "Tentar novamente",
  "discovery.preview": "Prévia rápida",
  "discovery.loading": "Lendo conversa…",
  "discovery.previewHint": "Texto original em modo somente leitura; mantém a conversa arquivada. Exclui ferramentas, anexos, raciocínio e sistema.",
  "discovery.earlier": "Há mais mensagens antes desta prévia. Abra a conversa completa para lê-las.",
  "discovery.later": "Há mais mensagens depois desta prévia. Abra a conversa completa para lê-las.",
  "discovery.empty": "Nenhum texto de usuário ou assistente para prévia.",
  "discovery.truncated": "Apenas parte desta mensagem é exibida.",
  "discovery.user": "Usuário",
  "discovery.assistant": "Assistente",
  "discovery.openFull": "Abrir conversa completa",
  "discovery.searchPlaceholder": "Pesquisar títulos ou conteúdo"
};
