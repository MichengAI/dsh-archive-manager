import { searchArchiveBatches } from "./archive-discovery.js";

/** 搜索异步状态和预览展示独立于页面业务操作，防止旧请求覆盖新筛选。 */
export function createDiscoveryTools(React) {
  const h = React.createElement;
  function HighlightedText({ text, query }) {
    const needle = query?.trim().toLocaleLowerCase();
    if (!needle) return text;
    const index = text.toLocaleLowerCase().indexOf(needle);
    return index < 0 ? text : h(React.Fragment, null, text.slice(0, index), h("mark", null, text.slice(index, index + needle.length)), text.slice(index + needle.length));
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
        searchArchiveBatches(JSON.parse(idsKey), query, call, { signal: controller.signal, onProgress: progress => {
          if (!controller.signal.aborted) setState({ key, status: "loading", ...progress });
        } }).then(result => { if (!controller.signal.aborted) setState({ key, status: "ready", done: ids.length, total: ids.length, ...result }); })
          .catch(error => { if (!controller.signal.aborted) setState(previous => ({ ...previous, key, status: "error", error: String(error?.message ?? error) })); });
      }, 350);
      return () => { controller.abort(); clearTimeout(timer); };
    }, [idsKey, query, enabled, call, revision]);
    const active = enabled && query.trim() && call;
    return { ...(active ? state.key === key ? state : { key, status: "loading", items: [], failures: [], done: 0, total: ids.length } : { status: "idle", items: [], failures: [] }), retry: () => setRevision(value => value + 1) };
  }
  function useArchivePreview(call, eligibleIds) {
    const [target, setTarget] = React.useState(null);
    const [state, setState] = React.useState({ status: "idle" });
    const [revision, setRevision] = React.useState(0);
    // 每次打开拥有独立身份，避免同一会话再次打开时闪现旧预览。
    const key = target;
    const available = target && eligibleIds.includes(target.session.id);
    React.useEffect(() => {
      if (!target || !available || !call) return;
      let active = true;
      setState({ key, status: "loading" });
      Promise.resolve().then(() => call({ sessionId: target.session.id, query: target.query })).then(value => {
        if (active) setState({ key, status: "ready", value });
      }).catch(error => { if (active) setState({ key, status: "error", error: String(error?.message ?? error) }); });
      return () => { active = false; };
    }, [key, available, call, revision]);
    return { target: available ? target : null, ...(state.key === key ? state : { status: "loading" }), open: (session, query = "") => setTarget({ session, query }), close: () => setTarget(null), retry: () => setRevision(value => value + 1) };
  }
  function DiscoveryFilters({ t, from, to, onFrom, onTo, invalid, onClear }) {
    const rootRef = React.useRef(null);
    React.useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      // 捕获阶段处理外部点击，避免其他控件阻止冒泡后浮层仍停留。
      const onPointerDown = event => {
        if (root.open && !root.contains(event.target)) root.open = false;
      };
      root.ownerDocument.addEventListener("pointerdown", onPointerDown, true);
      return () => root.ownerDocument.removeEventListener("pointerdown", onPointerDown, true);
    }, []);
    const active = Boolean(from || to);
    const range = active ? `${from || "…"} ～ ${to || "…"}` : t("discovery.date");
    return h("details", { className: "dsham_dateFilter", ref: rootRef, onKeyDown: event => {
      if (event.key === "Escape" && event.currentTarget.open) {
        event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    } },
      h("summary", { title: range, "aria-label": t("discovery.date") + (active ? "：" + range : ""), "data-active": active },
        h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", "aria-hidden": true },
          h("rect", { x: 2, y: 3.5, width: 12, height: 10.5, rx: 2 }), h("path", { d: "M5 1.5v4M11 1.5v4M2 7h12" })),
        h("span", null, active ? t("discovery.dateActive") : t("discovery.date"))),
      h("div", { className: "dsham_datePanel" },
        h("label", null, t("discovery.from"), h("input", { type: "date", value: from, max: to || undefined, onChange: event => onFrom(event.target.value) })),
        h("label", null, t("discovery.to"), h("input", { type: "date", value: to, min: from || undefined, onChange: event => onTo(event.target.value) })),
        invalid && h("p", { role: "alert" }, t("discovery.invalidDate")),
        h("button", { type: "button", className: "dsham_settingsAction", disabled: !active, onClick: onClear }, t("discovery.clearDate"))));
  }
  function SearchStatus({ state, t }) {
    if (state.status === "idle") return null;
    return h("div", { className: "dsham_discoveryStatus", role: "status", "aria-live": "polite" },
      h("p", null, t(state.status === "loading" ? "discovery.searching" : state.status === "error" ? "discovery.searchError" : "discovery.searched", { done: state.done ?? 0, total: state.total ?? 0 })),
      state.status === "error" && h("p", null, state.error),
      state.failures.length > 0 && h("details", null, h("summary", null, t("discovery.failed", { n: state.failures.length })), h("ul", null, state.failures.map(row => h("li", { key: row.sessionId }, row.sessionId, "：", row.message)))),
      (state.status === "error" || (state.status === "ready" && state.failures.length > 0)) && h("button", { type: "button", className: "dsham_settingsAction", onClick: state.retry }, t("discovery.retry")));
  }
  function PreviewContent({ preview, t }) {
    if (preview.status === "loading") return h("p", { role: "status" }, t("discovery.loading"));
    if (preview.status === "error") return h("div", null, h("p", { role: "alert" }, preview.error), h("button", { type: "button", className: "dsham_settingsAction", onClick: preview.retry }, t("discovery.retry")));
    const value = preview.value;
    if (!value) return null;
    return h("div", { className: "dsham_previewMessages" },
      h("p", { className: "dsham_previewHint" }, t("discovery.previewHint")),
      value.hasEarlier && h("p", null, t("discovery.earlier")),
      !value.messages.length && h("p", null, t("discovery.empty")),
      value.messages.map(row => h("article", { key: row.seq, className: "dsham_previewMessage" }, h("strong", null, t("discovery." + row.role)), h("p", null, h(HighlightedText, { text: row.text, query: preview.target?.query })), row.truncated && h("small", null, t("discovery.truncated")))),
      value.hasLater && h("p", null, t("discovery.later")));
  }
  return { HighlightedText, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent };
}

export const discoveryCss = ".dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr))}.dsham_settingsSearch{grid-column:1/-1;gap:8px;padding:0 8px;height:36px}.dsham_searchScope{flex:none;width:112px;border-right:1px solid var(--dsw-alias-border-l2);padding-right:4px}.dsham_searchScope .dsham_selectTrigger{min-height:26px;padding:0 4px;border:0;border-radius:4px;background:transparent;font-size:12px}.dsham_searchScope .dsham_selectMenu{width:144px;right:auto;top:calc(100% + 8px)}.dsham_dateFilter{position:relative;flex:none;color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_dateFilter summary{display:flex;align-items:center;gap:5px;list-style:none;cursor:pointer;padding:5px 2px 5px 8px;border-left:1px solid var(--dsw-alias-border-l2);white-space:nowrap}.dsham_dateFilter summary::-webkit-details-marker{display:none}.dsham_dateFilter summary[data-active=true]{color:var(--dsw-alias-state-business-primary)}.dsham_datePanel{position:absolute;right:0;top:calc(100% + 8px);z-index:35;display:grid;gap:12px;width:240px;box-sizing:border-box;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:0 8px 24px #0003}.dsham_datePanel label{display:grid;gap:6px}.dsham_settingsSearch .dsham_datePanel input{box-sizing:border-box;max-width:100%;min-width:0;height:32px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit}.dsham_datePanel p{margin:0}.dsham_searchScope:focus-visible,.dsham_dateFilter summary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsham_discoveryStatus{font-size:12px;margin-bottom:12px;overflow-wrap:anywhere}.dsham_settingsSnippet{display:block;width:100%;padding:0;margin:4px 0 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.dsham_previewMessages{max-height:55vh;overflow:auto;overflow-wrap:anywhere}.dsham_previewMessage{padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_previewMessage p{white-space:pre-wrap;font-size:13px;line-height:1.7}.dsham_previewHint,.dsham_previewMessage small{color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_settings mark,.dsham_previewMessages mark{background:#f2cc6050;color:inherit;border-radius:2px}.dsham_settingsSnippet:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}";
export const discoveryZh = {
  "discovery.date": "日期", "discovery.dateActive": "日期·已选", "discovery.clearDate": "清除日期", "discovery.active": "已启用", "discovery.scope": "查找范围", "discovery.titleOnly": "仅标题", "discovery.titleAndContent": "标题与正文", "discovery.from": "更新时间从", "discovery.to": "至", "discovery.clear": "清除条件", "discovery.invalidDate": "开始日期不能晚于结束日期，请检查日期范围。",
  "discovery.searching": "正在检索正文：{done} / {total}", "discovery.searched": "正文检索完成：{done} / {total}", "discovery.searchError": "正文检索未完成，当前结果可能不完整。", "discovery.failed": "{n} 条会话读取失败", "discovery.retry": "重试", "discovery.preview": "快速预览", "discovery.loading": "正在读取会话…", "discovery.previewHint": "只读预览原始对话文本，不恢复会话；不含工具输出、附件、推理和系统内容。", "discovery.earlier": "前面还有消息，可打开完整会话查看。", "discovery.later": "后面还有消息，可打开完整会话查看。", "discovery.empty": "没有可预览的用户或助手文本。", "discovery.truncated": "本条仅显示部分内容。", "discovery.user": "用户", "discovery.assistant": "助手", "discovery.openFull": "打开完整会话", "discovery.searchPlaceholder": "搜索标题或正文"
};
export const discoveryEn = {
  "discovery.date": "Date", "discovery.dateActive": "Date · Set", "discovery.clearDate": "Clear dates", "discovery.active": "Active", "discovery.scope": "Search in", "discovery.titleOnly": "Titles", "discovery.titleAndContent": "Titles and content", "discovery.from": "Updated from", "discovery.to": "To", "discovery.clear": "Clear filters", "discovery.invalidDate": "Check the date range: the start must not be after the end.",
  "discovery.searching": "Searching content: {done} / {total}", "discovery.searched": "Content search complete: {done} / {total}", "discovery.searchError": "Content search is incomplete; results may be missing.", "discovery.failed": "Could not read {n} conversations", "discovery.retry": "Retry", "discovery.preview": "Quick preview", "discovery.loading": "Reading conversation…", "discovery.previewHint": "Read-only original conversation text; keeps the conversation archived. Excludes tools, attachments, reasoning and system content.", "discovery.earlier": "More messages before this preview. Open the full conversation to read them.", "discovery.later": "More messages after this preview. Open the full conversation to read them.", "discovery.empty": "No user or assistant text to preview.", "discovery.truncated": "Only part of this message is shown.", "discovery.user": "User", "discovery.assistant": "Assistant", "discovery.openFull": "Open full conversation", "discovery.searchPlaceholder": "Search titles or content"
};
