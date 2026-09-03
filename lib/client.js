(() => {
  window.__ModuleLoader__.load({
    id: "@michengai/dsh-archive-manager",
    factory: (require2) => {
      var module = { exports: {} };
      var exports = module.exports;
      Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
      let _deepseek_ai_dsh_client_store;
      let hasSplitClientStore = true;
      try {
        _deepseek_ai_dsh_client_store = require2("@deepseek-ai/dsh-client-store");
      } catch {
        hasSplitClientStore = false;
        _deepseek_ai_dsh_client_store = require2("@deepseek-ai/dsh-client-runtime/client");
      }
      let react_jsx_runtime = require2("react/jsx-runtime");
      let react = require2("react");
      let _deepseek_ai_dsh_client_ui_primitives = require2("@deepseek-ai/dsh-client-ui-primitives");
      const sessionIdSchema = {
        parse(value) {
          if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
          return value;
        }
      };
      const workspaceIdSchema = {
        parse(value) {
          if (typeof value !== "string" || value.length === 0) throw new TypeError(`workspaceId must be a non-empty string, got ${String(value)}`);
          return value;
        }
      };
      const archivedSetSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          const ids = value.archivedSessionIds;
          if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
          return value;
        }
      };
      const deletedSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
          return value;
        }
      };
      const archivedBatchTargetSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
          if (value.scope === "all" || value.scope === "ungrouped") return value;
          if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
          if (value.scope === "sessions" && Array.isArray(value.sessionIds) && value.sessionIds.length > 0 && value.sessionIds.every((id) => typeof id === "string" && id.length > 0)) return value;
          throw new TypeError("target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds");
        }
      };
      const unarchivedBatchSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
          if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
          return value;
        }
      };
      const archivedWorkspaceBatchSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
          if (!Array.isArray(value.archivedSessionIdsAdded) || value.archivedSessionIdsAdded.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIdsAdded must be a string array");
          return value;
        }
      };
      const deletedBatchSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
          for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
            if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
          }
          if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
          return value;
        }
      };
      const archivedSessionMetadataSchema = {
        parse(value) {
          if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
          if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
          if (value.repairedSessionIds !== void 0 && (!Array.isArray(value.repairedSessionIds) || value.repairedSessionIds.some((id) => typeof id !== "string"))) throw new TypeError("repairedSessionIds must be a string array");
          return value;
        }
      };
      const ARCHIVE_MANAGER_REMOTE = {
        package: "@michengai/dsh-archive-manager",
        descriptors: [
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "unarchiveSession",
            invocation: { kind: "direct" },
            parameters: [{
              name: "sessionId",
              wire: "sessionId",
              source: "json",
              codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
            }],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionIds",
              schema: archivedSetSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "deleteSession",
            invocation: { kind: "direct" },
            parameters: [{
              name: "sessionId",
              wire: "sessionId",
              source: "json",
              codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
            }],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#Deleted",
              schema: deletedSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSessions",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "unarchiveSessions",
            invocation: { kind: "direct" },
            parameters: [{
              name: "target",
              wire: "target",
              source: "json",
              codec: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
            }],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#UnarchivedBatch",
              schema: unarchivedBatchSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/archiveWorkspaceSessions",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "archiveWorkspaceSessions",
            invocation: { kind: "direct" },
            parameters: [{
              name: "workspaceId",
              wire: "workspaceId",
              source: "json",
              codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-workspace/types#WorkspaceId", schema: workspaceIdSchema }
            }],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedWorkspaceBatch",
              schema: archivedWorkspaceBatchSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteArchivedSessions",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "deleteArchivedSessions",
            invocation: { kind: "direct" },
            parameters: [{
              name: "target",
              wire: "target",
              source: "json",
              codec: { mode: "strict", typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
            }],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#DeletedBatch",
              schema: deletedBatchSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          },
          {
            id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
            service: "workspaceRegistry",
            namespace: "workspaceRegistry",
            method: "archivedSessionMetadata",
            invocation: { kind: "direct" },
            parameters: [],
            result: {
              mode: "strict",
              typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionMetadata",
              schema: archivedSessionMetadataSchema
            },
            sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
          }
        ]
      };
      const ARCHIVED_CLASSES = {
        row: "dsham_archivedRow",
        title: "dsham_archivedTitle",
        badge: "dsham_archivedBadge",
        content: "dsham_archiveCardContent",
        meta: "dsham_archiveCardMeta",
        actions: "dsham_archiveCardActions",
        unarchive: "dsham_archiveCardUnarchive",
        delete: "dsham_archiveCardDelete"
      };
      const ARCHIVED_CSS = ".YDXeBa_sessionRow.dsham_archivedRow{box-sizing:border-box;cursor:default;min-height:64px;height:auto;background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;gap:12px;margin:8px 0;padding:10px 16px}.YDXeBa_sessionRow.dsham_archivedRow:hover{background:var(--dsw-alias-button-elevated-fill);border-color:var(--dsw-alias-border-l3)}.YDXeBa_searchResultRow.dsham_archivedRow{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;margin:8px 0;padding:10px 16px}.dsham_archivedTitle{color:var(--dsw-alias-label-primary);font-weight:600}.dsham_archivedBadge{display:none}.dsham_archiveCardContent{min-width:0;flex:1;flex-direction:column;gap:2px;display:flex}.dsham_archiveCardMeta{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.YDXeBa_sessionRow.dsham_archivedRow>.YDXeBa_time,.YDXeBa_sessionRow.dsham_archivedRow>.YDXeBa_rowActions{display:none}.dsham_archiveCardActions{align-items:center;gap:12px;display:inline-flex}.dsham_archiveCardActions button{cursor:pointer;border:none;flex:none}.dsham_archiveCardDelete{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border-radius:8px;align-items:center;justify-content:center;display:inline-flex}.dsham_archiveCardDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_archiveCardUnarchive{height:32px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2)!important;border-radius:10px;padding:0 12px;font-size:13px;font-weight:600;line-height:20px}.dsham_archiveCardUnarchive:hover{background:var(--dsw-alias-interactive-bg-hover)}";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-archive-manager/Archived.module.css") + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = "dsh-archive-manager/Archived.module.css";
        tag.textContent = ARCHIVED_CSS;
        document.head.appendChild(tag);
      }
      function indexSubagentDescendants(summaries) {
        const indexed = /* @__PURE__ */ new Map();
        for (const descendant of Object.values(summaries)) {
          if (descendant.origin !== "subagent") continue;
          const seen = /* @__PURE__ */ new Set();
          let current = descendant;
          while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
            seen.add(current.id);
            const aggregate = indexed.get(current.parentId);
            if (aggregate === void 0) indexed.set(current.parentId, {
              count: 1,
              runningCount: descendant.running ? 1 : 0
            });
            else {
              aggregate.count += 1;
              if (descendant.running) aggregate.runningCount += 1;
            }
            current = summaries[current.parentId];
          }
        }
        return indexed;
      }
      const FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
      function createWorkspaceViewStore() {
        return (0, _deepseek_ai_dsh_client_store.defineStore)({
          init: () => ({
            groupBy: "workspace",
            orderBy: "updated",
            showArchived: false,
            groupExpansion: {},
            sessionOrderByAccount: {},
            sessionUpdatedAtByAccount: {}
          }),
          persist: "dsh.workspace.view.v5",
          actions: {
            setGroupBy: (d, mode) => {
              d.groupBy = mode;
            },
            setOrderBy: (d, mode) => {
              d.orderBy = mode;
            },
            setShowArchived: (d, value) => {
              d.showArchived = value === true;
            },
            setGroupExpanded: (d, key, expanded) => {
              d.groupExpansion[key] = expanded;
            },
            retainAccountKeys: (d, workspaceKeys) => {
              const retained = new Set(workspaceKeys);
              d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
              d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
              d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
            },
            syncSessionOrderAccount: (d, accountKey, order, updatedAt) => {
              d.sessionOrderByAccount[accountKey] = order;
              d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
            },
            setSessionOrder: (d, accountKey, order) => {
              d.sessionOrderByAccount[accountKey] = order;
            }
          }
        });
      }
      function GithubMark16() {
        return (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: "false", children: (0, react_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" }) });
      }
      function ArchivedSessionsSectionPrototype({ sessionStore, workspaceStore, unarchiveSession, deleteSession, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, t }) {
        const sessions = (0, react.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
        const workspaceState = (0, react.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
        const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
        const [busy, setBusy] = (0, react.useState)(false);
        const [error, setError] = (0, react.useState)(null);
        const [notice, setNotice] = (0, react.useState)(null);
        const [query, setQuery] = (0, react.useState)("");
        const [project, setProject] = (0, react.useState)("all");
        const [sortBy, setSortBy] = (0, react.useState)("updated");
        const [createdAtById, setCreatedAtById] = (0, react.useState)({});
        const [unarchivingSessionIds, setUnarchivingSessionIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
        const unarchivingSessionIdsRef = (0, react.useRef)(/* @__PURE__ */ new Set());
        const [selectedSessionIds, setSelectedSessionIds] = (0, react.useState)([]);
        const groups = (0, react.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, workspaceState.archivedSessionIds, t("group.ungrouped")), [sessions.byId, workspaceState, t]);
        const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t), [groups, sortBy, createdAtById, t]);
        (0, react.useEffect)(() => {
          let cancelled = false;
          archivedSessionMetadata().then((result) => {
            if (!cancelled) setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
          }).catch(() => {
            if (!cancelled) setCreatedAtById({});
          });
          return () => {
            cancelled = true;
          };
        }, [archivedSessionMetadata, workspaceState.archivedSessionIds]);
        (0, react.useEffect)(() => {
          if (project !== "all" && !groups.some((group) => group.key === project)) setProject("all");
        }, [groups, project]);
        const filteredGroups = (0, react.useMemo)(() => {
          const normalizedQuery = query.trim().toLocaleLowerCase();
          return sortedGroups.filter((group) => project === "all" || project === group.key).map((group) => ({
            ...group,
            sessions: group.sessions.filter((session) => normalizedQuery === "" || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery))
          })).filter((group) => group.sessions.length > 0);
        }, [sortedGroups, project, query, t]);
        const visibleSessionIds = (0, react.useMemo)(() => archivedSessionIdsInGroups(filteredGroups), [filteredGroups]);
        const selectedSessionIdSet = (0, react.useMemo)(() => new Set(selectedSessionIds), [selectedSessionIds]);
        const selectedVisibleCount = visibleSessionIds.filter((sessionId) => selectedSessionIdSet.has(sessionId)).length;
        const allVisibleSelected = visibleSessionIds.length > 0 && selectedVisibleCount === visibleSessionIds.length;
        const allBatchTarget = { scope: "all" };
        const allBatchSessionIds = (0, react.useMemo)(() => deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, allBatchTarget), [workspaceState.archivedSessionIds, workspaceState.items]);
        (0, react.useEffect)(() => {
          setSelectedSessionIds((current) => pruneArchivedSelection(current, workspaceState.archivedSessionIds));
        }, [workspaceState.archivedSessionIds]);
        const toggleSessionSelection = (sessionId, checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, [sessionId], checked));
        };
        const toggleVisibleSelection = (checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, visibleSessionIds, checked));
        };
        const onUnarchive = (sessionId) => {
          if (busy || unarchivingSessionIdsRef.current.has(sessionId)) return;
          unarchivingSessionIdsRef.current.add(sessionId);
          setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          setError(null);
          setNotice(null);
          unarchiveSession(sessionId).catch((reason) => {
            setError(formatUnarchiveError(reason, t));
          }).finally(() => {
            unarchivingSessionIdsRef.current.delete(sessionId);
            setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          });
        };
        const onBatchUnarchive = async (target) => {
          if (busy) return;
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            const result = await unarchiveSessions(target);
            setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
            return result;
          } catch (reason) {
            setError(t("archives.restoreBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
          } finally {
            setBusy(false);
          }
        };
        const onSelectedUnarchive = async () => {
          if (selectedSessionIds.length === 0) return;
          const result = await onBatchUnarchive({ scope: "sessions", sessionIds: selectedSessionIds });
          if (result !== void 0) {
            const restored = new Set(result.unarchivedSessionIds);
            setSelectedSessionIds((current) => current.filter((sessionId) => !restored.has(sessionId)));
          }
        };
        const closeDelete = () => {
          if (!busy) setDeleteTarget(null);
        };
        (0, react.useEffect)(() => {
          if (deleteTarget === null) return;
          const onKeyDown = (event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
            if (!busy) setDeleteTarget(null);
          };
          window.addEventListener("keydown", onKeyDown, true);
          return () => window.removeEventListener("keydown", onKeyDown, true);
        }, [deleteTarget, busy]);
        const confirmDelete = async () => {
          if (busy || deleteTarget === null) return;
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            if (deleteTarget.kind === "batch") {
              const result = await deleteArchivedSessions(deleteTarget.target);
              const feedback = archivedDeleteFeedback(result, t);
              if (feedback.kind === "error") setError(feedback.message);
              else setNotice(feedback.message);
              if (deleteTarget.target.scope === "sessions") {
                const completed = /* @__PURE__ */ new Set([...result.deletedSessionIds, ...result.skippedSessionIds]);
                setSelectedSessionIds((current) => current.filter((sessionId) => !completed.has(sessionId)));
              }
            } else {
              await deleteSession(deleteTarget.session.id);
            }
            setDeleteTarget(null);
          } catch (reason) {
            setError(formatDeleteError(reason, t));
          } finally {
            setBusy(false);
          }
        };
        const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
        const deleteDialogTitle = batchScope === "all" ? t("archives.deleteAllTitle") : batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget.title }) : batchScope === "sessions" ? t("archives.deleteSelectedTitle") : t("deleteSession.title");
        const deleteDialogDescription = deleteTarget === null ? void 0 : batchScope === "all" ? t("archives.deleteAllDesc", { n: deleteTarget.count }) : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.count }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget.title, n: deleteTarget.count }) : batchScope === "sessions" ? t("archives.deleteSelectedDesc", { n: deleteTarget.count }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.session, t) });
        const deleteConfirmLabel = batchScope === "all" ? t("archives.deleteAll") : batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : batchScope === "sessions" ? t("archives.deleteSelectedConfirm") : t("deleteSession.title");
        return (0, react_jsx_runtime.jsxs)("section", {
          className: "dsham_settings",
          "aria-label": t("archives.title"),
          children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS + ARCHIVE_SETTINGS_SELECTION_CSS + ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS }), (0, react_jsx_runtime.jsxs)("header", {
            className: "dsham_settingsHeader",
            children: [(0, react_jsx_runtime.jsxs)("div", {
              children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsTitleRow", children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsLinks", children: [(0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager", target: "_blank", rel: "noreferrer", "aria-label": t("archives.viewProject"), children: [(0, react_jsx_runtime.jsx)(GithubMark16, {}), t("archives.viewProject")] }), (0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager/issues", target: "_blank", rel: "noreferrer", "aria-label": t("archives.feedback"), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {}), t("archives.feedback")] })] })] }), (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsIntro", children: t("archives.description") })]
            }), (0, react_jsx_runtime.jsxs)("div", {
              className: "dsham_settingsHeaderActions",
              children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsRestoreAll", disabled: busy || allBatchSessionIds.length === 0, onClick: () => onBatchUnarchive(allBatchTarget), children: t("archives.restoreAll") }), (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dsham_settingsDanger", disabled: busy || allBatchSessionIds.length === 0, onClick: () => setDeleteTarget({ kind: "batch", target: allBatchTarget, title: t("archives.allProjects"), count: allBatchSessionIds.length }), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}), t("archives.deleteAll")] })]
            })]
          }), (0, react_jsx_runtime.jsxs)("div", {
            className: "dsham_settingsToolbar",
            children: [(0, react_jsx_runtime.jsxs)("label", {
              className: "dsham_settingsSearch",
              children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {}), (0, react_jsx_runtime.jsx)("input", { type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("archives.searchPlaceholder"), "aria-label": t("archives.searchPlaceholder") })]
            }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }], onChange: setSortBy, "aria-label": t("archives.sortBy") }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-project-filter", value: project, options: [{ value: "all", label: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") })]
          }), groups.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
            className: "dsham_settingsSelection",
            children: [(0, react_jsx_runtime.jsxs)("label", {
              className: "dsham_settingsSelectionToggle",
              children: [(0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, { checked: allVisibleSelected, indeterminate: selectedVisibleCount > 0 && !allVisibleSelected, disabled: busy || visibleSessionIds.length === 0, label: t("archives.selectAllFiltered"), onChange: (event) => toggleVisibleSelection(event.target.checked) }), t("archives.selectAllFiltered")]
            }), (0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsSelectionCount", children: t("archives.selectedCount", { n: selectedSessionIds.length }) }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionAction", disabled: busy || selectedSessionIds.length === 0, onClick: onSelectedUnarchive, children: t("archives.restoreSelected") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsSelectionAction dsham_settingsSelectionDelete", disabled: busy || selectedSessionIds.length === 0, onClick: () => setDeleteTarget({ kind: "batch", target: { scope: "sessions", sessionIds: selectedSessionIds }, count: selectedSessionIds.length }), children: t("archives.deleteSelected") })]
          }), groups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t("archives.empty") }) : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
            const target = archivedBatchTargetForGroup(group.key);
            const count = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length;
            return (0, react_jsx_runtime.jsxs)("section", {
              className: "dsham_settingsGroup",
              children: [(0, react_jsx_runtime.jsxs)("div", {
                className: "dsham_settingsGroupHeading",
                children: [(0, react_jsx_runtime.jsxs)("h3", { className: "dsham_settingsGroupTitle", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), group.title] }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsCount", children: t("archives.sessionCount", { n: count }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), t })] })]
              }), (0, react_jsx_runtime.jsx)("div", {
                className: "dsham_settingsList",
                children: group.sessions.map((session) => (0, react_jsx_runtime.jsxs)("article", {
                  className: "dsham_settingsRow",
                  children: [(0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, { checked: selectedSessionIdSet.has(session.id), disabled: busy, label: t("archives.selectSession", { name: displayTitle(session, t) }), onChange: (event) => toggleSessionSelection(session.id, event.target.checked) }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsContent", children: [(0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsTitle", children: displayTitle(session, t) }), (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsMeta", children: archiveTimeLabel(session.updatedAt, t) })] }), (0, react_jsx_runtime.jsxs)("div", {
                    className: "dsham_settingsActions",
                    children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsAction", disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => onUnarchive(session.id), children: t("menu.unarchive") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsDelete", disabled: busy || unarchivingSessionIds.has(session.id), "aria-label": t("menu.deleteSession"), onClick: () => setDeleteTarget({ kind: "session", session }), children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}) })]
                  })]
                }, session.id))
              })]
            }, group.key);
          }), error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: deleteTarget !== null,
            onClose: closeDelete,
            closeLabel: t("close"),
            title: deleteDialogTitle,
            ...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: closeDelete, children: t("cancel") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", className: "dsham_settingsDeleteConfirm", disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
            children: busy && (0, react_jsx_runtime.jsx)("div", { role: "status", children: deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending") })
          })]
        });
      }
      function r(e) {
        var t, f, n = "";
        if ("string" == typeof e || "number" == typeof e) n += e;
        else if ("object" == typeof e) if (Array.isArray(e)) {
          var o = e.length;
          for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
        } else for (f in e) e[f] && (n && (n += " "), n += f);
        return n;
      }
      function clsx() {
        for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
        return n;
      }
      const UNGROUPED_LABEL = "Ungrouped";
      function workspaceLabel(cwd, ungroupedLabel = UNGROUPED_LABEL) {
        if (cwd === void 0 || cwd === "") return ungroupedLabel;
        const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
        return base !== void 0 && base !== "" ? base : cwd;
      }
      function byRecency(a, b) {
        if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
        return a.id < b.id ? -1 : 1;
      }
      function sessionVisible(session, current, archived, showArchived) {
        return session.origin !== "subagent" && (!archived.has(session.id) || showArchived === true) && (!session.blank || session.id === current);
      }
      function isUnknownSessionError(reason) {
        const message = reason instanceof Error ? reason.message : String(reason);
        return message.includes("UNKNOWN_SESSION") || message.includes("no such session");
      }
      function formatDeleteError(reason, t) {
        if (isUnknownSessionError(reason)) return t("deleteSession.unknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("deleteSession.failed", { detail });
      }
      function formatUnarchiveError(reason, t) {
        if (isUnknownSessionError(reason)) return t("archives.unarchiveUnknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.unarchiveFailed", { detail });
      }
      function formatArchiveError(reason, t) {
        if (isUnknownSessionError(reason)) return t("archives.archiveUnknown");
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.archiveFailed", { detail });
      }
      function formatForkError(reason, t) {
        const detail = reason instanceof Error ? reason.message : String(reason);
        return t("archives.forkFailed", { detail });
      }
      function sessionTitle(session) {
        return session.blank ? "New Session" : session.displayTitle;
      }
      function buildGroup(key, workspaceId, cwd, createdAt, label, members, order) {
        const sessions = [...members];
        if (order === "recency") sessions.sort(byRecency);
        return {
          key,
          workspaceId,
          cwd,
          createdAt,
          label,
          sessions
        };
      }
      function orderedUngrouped(members, stored) {
        const byId = new Map(members.map((session) => [session.id, session]));
        const included = /* @__PURE__ */ new Set();
        const ordered = [];
        for (const key of stored) {
          const session = byId.get(key);
          if (session === void 0 || included.has(key)) continue;
          ordered.push(session);
          included.add(key);
        }
        for (const session of [...members].sort(byRecency)) {
          if (included.has(session.id)) continue;
          ordered.push(session);
        }
        return ordered;
      }
      function groupByWorkspace(list, workspaces, archived, ungroupedOrder, showArchived) {
        const groups = [];
        const accounted = /* @__PURE__ */ new Set();
        for (const workspace of workspaces) {
          const members = [];
          for (const id of workspace.sessionIds) {
            const summary = list.byId[id];
            if (summary === void 0) continue;
            accounted.add(id);
            if (!sessionVisible(summary, list.current, archived, showArchived)) continue;
            members.push(summary);
          }
          groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
        }
        const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, list.current, archived, showArchived));
        if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
        return groups;
      }
      function archiveableWorkspaceSessionCount(workspace, archivedSessionIds) {
        const archived = archivedSessionIds instanceof Set ? archivedSessionIds : new Set(archivedSessionIds);
        return [...new Set(workspace.sessionIds)].filter((sessionId) => !archived.has(sessionId)).length;
      }
      function archiveWorkspaceDialogTarget(workspaces, workspaceId, title, archivedSessionIds) {
        const workspace = workspaces.find((item) => item.workspaceId === workspaceId);
        if (workspace === void 0) return null;
        const count = archiveableWorkspaceSessionCount(workspace, archivedSessionIds);
        return count === 0 ? null : { workspaceId, title, count };
      }
      function archiveWorkspaceDialogFailureState(target, reason, t) {
        return { target, archiving: false, error: formatArchiveError(reason, t) };
      }
      function visiblePendingKind(kind) {
        switch (kind) {
          case "approval":
          case "plan-review":
          case "question":
            return kind;
          default:
            return;
        }
      }
      function pendingInteractionForSession(session, pendingInteractions) {
        const entry = pendingInteractions.get(session.id);
        const kind = entry === void 0 ? session.pendingInteraction : entry.kind;
        return visiblePendingKind(kind);
      }
      const EMPTY_PENDING_INTERACTIONS = /* @__PURE__ */ new Map();
      function useEmptySessionPendingInteraction(selector) {
        return selector(EMPTY_PENDING_INTERACTIONS);
      }
      function sessionNode(s, descendants, archived, pendingInteractions) {
        const pendingInteraction = pendingInteractionForSession(s, pendingInteractions);
        return {
          id: s.id,
          title: sessionTitle(s),
          blank: s.blank,
          running: s.running,
          runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
          completed: s.completed === true,
          updatedAt: s.updatedAt,
          archived: archived.has(s.id),
          ...pendingInteraction === void 0 ? {} : { pendingInteraction }
        };
      }
      function deriveGroups(list, workspaces, archivedSessionIds, pendingInteractions, view) {
        const archived = new Set(archivedSessionIds);
        const expandedGroups = new Set(view.expandedGroups);
        const descendants = indexSubagentDescendants(list.byId);
        const currentGroup = list.current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(list.current))?.workspaceId ?? "";
        const groups = [];
        for (const g of groupByWorkspace(list, workspaces, archived, view.ungroupedOrder, view.showArchived)) {
          const expanded = expandedGroups.has(g.key);
          groups.push({
            key: g.key,
            workspaceId: g.workspaceId,
            cwd: g.cwd,
            createdAt: g.createdAt,
            label: g.label,
            sessionCount: g.sessions.length,
            expanded,
            containsCurrent: g.key === currentGroup,
            sessions: expanded ? g.sessions.map((session) => sessionNode(session, descendants, archived, pendingInteractions)) : []
          });
        }
        return groups;
      }
      function deriveFlat(list, archivedSessionIds, pendingInteractions, showArchived) {
        const archived = new Set(archivedSessionIds);
        const descendants = indexSubagentDescendants(list.byId);
        const rows = [];
        for (const id of list.ids) {
          const s = list.byId[id];
          if (s === void 0 || !sessionVisible(s, list.current, archived, showArchived)) continue;
          rows.push(s);
        }
        rows.sort(byRecency);
        return rows.map((session) => sessionNode(session, descendants, archived, pendingInteractions));
      }
      function deriveSearchResults(list, workspaces, query, archivedSessionIds, pendingInteractions, content, limit, showArchived, ungroupedLabel = UNGROUPED_LABEL) {
        const q = query.trim().toLowerCase();
        if (q === "") return {
          items: [],
          hasMore: false
        };
        const archived = new Set(archivedSessionIds);
        const descendants = indexSubagentDescendants(list.byId);
        const workspaceBySession = /* @__PURE__ */ new Map();
        for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
        const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd, ungroupedLabel);
        const contentBySession = /* @__PURE__ */ new Map();
        for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
        const local = [];
        for (const id of list.ids) {
          const summary = list.byId[id];
          if (summary === void 0 || summary.blank || !sessionVisible(summary, list.current, archived, showArchived)) continue;
          if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
        }
        local.sort(byRecency);
        const ordered = [];
        const included = /* @__PURE__ */ new Set();
        const include = (summary) => {
          if (included.has(summary.id)) return;
          included.add(summary.id);
          ordered.push(summary);
        };
        for (const summary of local) include(summary);
        for (const item of content.items) {
          const summary = list.byId[item.sessionId];
          if (summary !== void 0 && !summary.blank && sessionVisible(summary, list.current, archived, showArchived)) include(summary);
        }
        return {
          items: ordered.slice(0, limit).map((summary) => {
            const match = contentBySession.get(summary.id);
            const pendingInteraction = pendingInteractionForSession(summary, pendingInteractions);
            return {
              id: summary.id,
              title: sessionTitle(summary),
              workspace: labelOf(summary),
              running: summary.running,
              runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
              archived: archived.has(summary.id),
              ...pendingInteraction === void 0 ? {} : { pendingInteraction },
              completed: summary.completed === true,
              ...match === void 0 ? {} : { snippet: match.snippet }
            };
          }),
          hasMore: content.hasMore || ordered.length > limit
        };
      }
      function relativeTime(updatedAt, now) {
        const MIN = 6e4;
        const HOUR = 36e5;
        const DAY = 864e5;
        const diff = Math.max(0, now - updatedAt);
        if (diff < MIN) return {
          unit: "now",
          n: 0
        };
        if (diff < HOUR) return {
          unit: "minutes",
          n: Math.floor(diff / MIN)
        };
        if (diff < DAY) return {
          unit: "hours",
          n: Math.floor(diff / HOUR)
        };
        if (diff < 30 * DAY) return {
          unit: "days",
          n: Math.floor(diff / DAY)
        };
        if (diff < 365 * DAY) return {
          unit: "months",
          n: Math.floor(diff / (30 * DAY))
        };
        return {
          unit: "years",
          n: Math.floor(diff / (365 * DAY))
        };
      }
      const css$2 = '.YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}';
      const tagId$2 = "@deepseek-ai/dsh-client-ui-workspace/Rows.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId$2;
        tag.textContent = css$2;
        document.head.appendChild(tag);
      }
      var Rows_module_css_default = {
        "hoverTitle": "YDXeBa_hoverTitle",
        "title": "YDXeBa_title",
        "hoverContent": "YDXeBa_hoverContent",
        "dropAfter": "YDXeBa_dropAfter",
        "renameInput": "YDXeBa_renameInput",
        "dot": "YDXeBa_dot",
        "hoverTime": "YDXeBa_hoverTime",
        "iconButton": "YDXeBa_iconButton",
        "flatSessionRowWithoutStatus": "YDXeBa_flatSessionRowWithoutStatus",
        "row-in": "YDXeBa_row-in",
        "folder": "YDXeBa_folder",
        "menuOpen": "YDXeBa_menuOpen",
        "selected": "YDXeBa_selected",
        "searchResultHeading": "YDXeBa_searchResultHeading",
        "searchResultWorkspace": "YDXeBa_searchResultWorkspace",
        "visuallyHidden": "YDXeBa_visuallyHidden",
        "projectRow": "YDXeBa_projectRow",
        "hoverStatus": "YDXeBa_hoverStatus",
        "arrowOpen": "YDXeBa_arrowOpen",
        "rowActions": "YDXeBa_rowActions",
        "chevron": "YDXeBa_chevron",
        "arrow": "YDXeBa_arrow",
        "searchResultTitle": "YDXeBa_searchResultTitle",
        "searchResultMeta": "YDXeBa_searchResultMeta",
        "slot": "YDXeBa_slot",
        "folderActive": "YDXeBa_folderActive",
        "time": "YDXeBa_time",
        "sessionRow": "YDXeBa_sessionRow",
        "meta": "YDXeBa_meta",
        "dropBefore": "YDXeBa_dropBefore",
        "searchResultSnippet": "YDXeBa_searchResultSnippet",
        "projectText": "YDXeBa_projectText",
        "hoverPath": "YDXeBa_hoverPath",
        "searchResultRow": "YDXeBa_searchResultRow"
      };
      function displayTitle(node, t) {
        return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
      }
      function timeLabel(updatedAt, now, t) {
        const { unit, n } = relativeTime(updatedAt, now);
        return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
      }
      function archiveTimeLabel(updatedAt, t) {
        const date = new Date(updatedAt);
        const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
      }
      function hoverTimeLabel(updatedAt, now, t) {
        const { unit, n } = relativeTime(updatedAt, now);
        return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
      }
      function createdLabel(createdAt, t) {
        const d = new Date(createdAt);
        const pad2 = (v) => String(v).padStart(2, "0");
        return t("hover.created", { time: `${t("date.ymd", {
          y: d.getFullYear(),
          m: d.getMonth() + 1,
          d: d.getDate()
        })} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` });
      }
      function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
        return (0, react_jsx_runtime.jsxs)("div", {
          className: Rows_module_css_default.hoverContent,
          children: [
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTitle,
              children: label
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverPath,
              children: cwd
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTime,
              children: createdLabel(createdAt, t)
            })
          ]
        });
      }
      function rowHalf(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
      }
      function ProjectRowItem({ group, onToggle, onCreate, actions, drag, t }) {
        const row = group;
        const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
        const active = group.expanded && group.containsCurrent;
        const [menuOpen, setMenuOpen] = (0, react.useState)(false);
        const workspaceMenuItems = [{
          id: "rename",
          label: t("rename"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
        }, ...actions?.canArchive === true ? [{
          id: "archive-workspace",
          label: t("menu.archiveWorkspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
        }] : [], {
          id: "delete",
          label: t("delete.workspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
          danger: true
        }];
        const ownRow = (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
          role: "treeitem",
          "aria-expanded": row.expanded,
          onClick: onToggle,
          draggable: drag !== void 0,
          onDragStart: drag === void 0 ? void 0 : (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", row.key);
            drag.start();
          },
          onDragEnd: drag?.end,
          children: [
            (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
              children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, {})
            }),
            (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
            }),
            (0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.projectText,
              children: (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.title,
                children: label
              })
            }),
            (0, react_jsx_runtime.jsxs)("span", {
              className: Rows_module_css_default.rowActions,
              children: [actions !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
                open: menuOpen,
                onClose: () => {
                  setMenuOpen(false);
                },
                items: workspaceMenuItems,
                onSelect: (id) => {
                  setMenuOpen(false);
                  if (id !== "rename" && id !== "archive-workspace" && id !== "delete") return;
                  if (id === "rename") actions.rename();
                  else if (id === "archive-workspace") actions.archive();
                  else actions.delete();
                },
                portal: true,
                closeOnPointerLeave: true,
                anchor: (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: Rows_module_css_default.iconButton,
                  "aria-label": t("actions.workspace.aria", { name: label }),
                  onClick: (e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  },
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
                })
              }), (0, react_jsx_runtime.jsx)("button", {
                type: "button",
                className: Rows_module_css_default.iconButton,
                "aria-label": t("actions.newSession.aria", { name: label }),
                onClick: (e) => {
                  e.stopPropagation();
                  onCreate();
                },
                children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
              })]
            })
          ]
        });
        if (row.createdAt === void 0) return ownRow;
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
          anchor: ownRow,
          content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
            label: row.label,
            cwd: row.cwd,
            createdAt: row.createdAt,
            t
          }),
          disabled: menuOpen,
          copyText: row.cwd,
          copyLabel: t("copy"),
          copiedLabel: t("hover.copied")
        });
      }
      function assertNever(value) {
        throw new Error(`unknown pending interaction: ${String(value)}`);
      }
      function sessionStatuses(node, t) {
        const subagents = node.runningSubagentCount === 0 ? void 0 : {
          state: "ongoing",
          label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
        };
        let pending;
        switch (node.pendingInteraction) {
          case "approval":
            pending = {
              state: "warning",
              label: t("status.waitingApproval")
            };
            break;
          case "plan-review":
            pending = {
              state: "warning",
              label: t("status.planReview")
            };
            break;
          case "question":
            pending = {
              state: "warning",
              label: t("status.waitingAnswer")
            };
            break;
          case void 0:
            break;
          /* v8 ignore next -- closed PendingInteractionStatus union */
          default:
            return assertNever(node.pendingInteraction);
        }
        if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
        if (node.running) {
          const primary = {
            state: "ongoing",
            label: t("status.running")
          };
          return subagents === void 0 ? [primary] : [primary, subagents];
        }
        if (subagents !== void 0) return [subagents];
        if (node.completed) return [{
          state: "done",
          label: t("status.completed")
        }];
        return [{
          state: "done",
          label: t("status.idle")
        }];
      }
      function SessionStatusDots({ statuses }) {
        return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
          className: Rows_module_css_default.visuallyHidden,
          children: status.label
        }, status.label))] });
      }
      function SessionHoverContent({ node, now, t }) {
        const statuses = sessionStatuses(node, t);
        return (0, react_jsx_runtime.jsxs)("div", {
          className: Rows_module_css_default.hoverContent,
          children: [
            (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTitle,
              children: displayTitle(node, t)
            }),
            !node.blank && (0, react_jsx_runtime.jsx)("div", {
              className: Rows_module_css_default.hoverTime,
              children: hoverTimeLabel(node.updatedAt, now, t)
            }),
            statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
              className: Rows_module_css_default.hoverStatus,
              children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
            }, status.label))
          ]
        });
      }
      function SearchResultItem({ result, currentId, onOpen, t }) {
        const selected = result.id === currentId;
        const statuses = sessionStatuses(result, t);
        const primaryStatus = statuses[0];
        return (0, react_jsx_runtime.jsxs)("button", {
          type: "button",
          className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected, result.archived === true && ARCHIVED_CLASSES.row),
          role: "treeitem",
          "aria-selected": selected,
          onClick: () => {
            onOpen(result.id);
          },
          children: [(0, react_jsx_runtime.jsxs)("span", {
            className: Rows_module_css_default.searchResultHeading,
            children: [(0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.slot,
              children: (primaryStatus.state !== "done" || result.completed) && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
            }), result.archived === true && (0, react_jsx_runtime.jsx)("span", {
              className: ARCHIVED_CLASSES.badge,
              children: t("archived.badge")
            }), (0, react_jsx_runtime.jsx)("span", {
              className: clsx(Rows_module_css_default.searchResultTitle, result.archived === true && ARCHIVED_CLASSES.title),
              children: result.title
            })]
          }), (0, react_jsx_runtime.jsxs)("span", {
            className: Rows_module_css_default.searchResultMeta,
            children: [(0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.searchResultWorkspace,
              children: result.workspace
            }), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
              className: Rows_module_css_default.searchResultSnippet,
              children: result.snippet
            })]
          })]
        });
      }
      function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, onUnarchive, onDeleteSession, drag, flat = false, t }) {
        const row = node;
        const title = displayTitle(node, t);
        const selected = node.id === currentId;
        const archived = row.archived === true;
        const statuses = sessionStatuses(node, t);
        const showStatus = statuses[0].state !== "done" || row.completed;
        const [menuOpen, setMenuOpen] = (0, react.useState)(false);
        const sessionMenuItems = archived ? [
          {
            id: "unarchive",
            label: t("menu.unarchive"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
          },
          {
            id: "delete-session",
            label: t("menu.deleteSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
            danger: true
          }
        ] : [
          {
            id: "rename",
            label: t("rename"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
          },
          {
            id: "fork",
            label: t("menu.fork"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {})
          },
          {
            id: "archive",
            label: t("menu.archiveSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
          },
          {
            id: "delete-session",
            label: t("menu.deleteSession"),
            icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
            danger: true
          }
        ];
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
          anchor: (0, react_jsx_runtime.jsxs)("div", {
            className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, archived && ARCHIVED_CLASSES.row, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
            role: "treeitem",
            "aria-selected": selected,
            onClick: () => {
              if (archived) return;
              onOpen(node.id);
            },
            draggable: drag !== void 0,
            onDragStart: drag === void 0 ? void 0 : (e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", node.id);
              drag.start();
            },
            onDragEnd: drag?.end,
            onDragOver: drag === void 0 ? void 0 : (e) => {
              if (!drag.active) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              drag.hover(rowHalf(e));
            },
            onDrop: drag === void 0 ? void 0 : (e) => {
              if (!drag.active) return;
              e.preventDefault();
              drag.drop(rowHalf(e));
            },
            children: [
              (!flat || showStatus) && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.slot,
                children: showStatus && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
              }),
              archived && (0, react_jsx_runtime.jsx)("span", {
                className: ARCHIVED_CLASSES.badge,
                children: t("archived.badge")
              }),
              archived ? (0, react_jsx_runtime.jsxs)("span", {
                className: ARCHIVED_CLASSES.content,
                children: [(0, react_jsx_runtime.jsx)("span", {
                  className: clsx(Rows_module_css_default.title, ARCHIVED_CLASSES.title),
                  children: title
                }), !row.blank && (0, react_jsx_runtime.jsx)("span", {
                  className: ARCHIVED_CLASSES.meta,
                  children: timeLabel(row.updatedAt, now, t)
                })]
              }) : (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.title,
                children: title
              }),
              !row.blank && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.time,
                children: timeLabel(row.updatedAt, now, t)
              }),
              archived && !row.blank && (0, react_jsx_runtime.jsxs)("span", {
                className: ARCHIVED_CLASSES.actions,
                onClick: (e) => {
                  e.stopPropagation();
                },
                children: [(0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: ARCHIVED_CLASSES.delete,
                  "aria-label": t("menu.deleteSession"),
                  onClick: () => onDeleteSession(node.id, row.title),
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
                }), (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: ARCHIVED_CLASSES.unarchive,
                  onClick: () => onUnarchive(node.id),
                  children: t("menu.unarchive")
                })]
              }),
              !row.blank && (0, react_jsx_runtime.jsx)("span", {
                className: Rows_module_css_default.rowActions,
                children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
                  open: menuOpen,
                  onClose: () => {
                    setMenuOpen(false);
                  },
                  items: sessionMenuItems,
                  onSelect: (id) => {
                    setMenuOpen(false);
                    if (id === "rename") onRename(node.id, row.title);
                    if (id === "fork") onFork(node.id);
                    if (id === "archive") onArchive(node.id);
                    if (id === "unarchive") onUnarchive(node.id);
                    if (id === "delete-session") onDeleteSession(node.id, row.title);
                  },
                  portal: true,
                  closeOnPointerLeave: true,
                  anchor: (0, react_jsx_runtime.jsx)("button", {
                    type: "button",
                    className: Rows_module_css_default.iconButton,
                    "aria-label": t("actions.session.aria", { name: title }),
                    onClick: (e) => {
                      e.stopPropagation();
                      setMenuOpen((v) => !v);
                    },
                    children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
                  })
                })
              })
            ]
          }),
          content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
            node,
            now,
            t
          }),
          disabled: menuOpen || drag?.active === true,
          copyText: row.blank ? void 0 : row.title,
          copyLabel: t("copy"),
          copiedLabel: t("hover.copied")
        });
      }
      const css$1 = "._G5b-a_modalAction{min-width:72px}._G5b-a_modalError,._G5b-a_menuStatus{margin-top:8px;font-size:12px;line-height:18px}._G5b-a_modalError{color:var(--dsw-alias-state-error-primary)}._G5b-a_menuStatus{color:var(--dsw-alias-label-secondary)}";
      const tagId$1 = "@deepseek-ai/dsh-client-ui-workspace/WorkspacePicker.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId$1;
        tag.textContent = css$1;
        document.head.appendChild(tag);
      }
      var WorkspacePicker_module_css_default = {
        "modalAction": "_G5b-a_modalAction",
        "menuStatus": "_G5b-a_menuStatus",
        "modalError": "_G5b-a_modalError"
      };
      const ADD_WORKSPACE = "::add-workspace";
      function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }) {
        const workspaceSnapshot = useWorkspaces((state) => state);
        const workspaces = workspaceSnapshot.items;
        const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
        const [errorOpen, setErrorOpen] = (0, react.useState)(false);
        const [modalError, setModalError] = (0, react.useState)(null);
        const [flowOpen, setFlowOpen] = (0, react.useState)(false);
        const [pickingFolder, setPickingFolder] = (0, react.useState)(false);
        const flowBusy = flowOpen || pickingFolder;
        const flowAvailable = useDirectoryFlow((occupied) => occupied);
        (0, react.useEffect)(() => {
          if (flowOpen && !flowAvailable) setFlowOpen(false);
        }, [flowOpen, flowAvailable]);
        const addEntries = flowAvailable ? [{
          id: ADD_WORKSPACE,
          label: t("menu.addWorkspace"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 16 }),
          disabled: flowBusy
        }] : [];
        const pinAdd = !addOnly && workspaces.length > 0;
        const items = pinAdd ? workspaces.map((workspace) => ({
          id: workspace.workspaceId,
          label: workspace.title,
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { size: 16 }),
          disabled: flowBusy
        })) : addEntries;
        const menuIsEmpty = items.length === 0;
        const closeModal = () => {
          setErrorOpen(false);
          setModalError(null);
        };
        const adoptDirectory = (path) => createWorkspace({ path }).then((workspace) => {
          setFlowOpen(false);
          onPick(workspace.workspaceId);
        }).catch((reason) => {
          setModalError(reason instanceof Error ? reason.message : String(reason));
          setFlowOpen(false);
          setErrorOpen(true);
        });
        const openDirectoryFlow = (0, react.useCallback)(() => {
          onClose();
          setErrorOpen(false);
          setModalError(null);
          setFlowOpen(true);
        }, [onClose]);
        const listSettled = addOnly || workspaceSnapshot.phase === "ready";
        const addIsTheOnlyEntry = !pinAdd && listSettled && addEntries.length === 1;
        (0, react.useEffect)(() => {
          if (open && addIsTheOnlyEntry && !flowBusy) openDirectoryFlow();
        }, [
          open,
          addIsTheOnlyEntry,
          flowBusy,
          openDirectoryFlow
        ]);
        const flowOwner = {
          open: flowOpen,
          busy: pickingFolder,
          onPicked: (path) => {
            setPickingFolder(true);
            adoptDirectory(path).finally(() => {
              setPickingFolder(false);
            });
          },
          onCancel: () => {
            setFlowOpen(false);
          },
          onError: (message) => {
            setFlowOpen(false);
            setModalError(message);
            setErrorOpen(true);
          }
        };
        const handleSelect = (id) => {
          if (id === ADD_WORKSPACE) {
            openDirectoryFlow();
            return;
          }
          onPick(id);
        };
        return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
          (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
            open: open && !addIsTheOnlyEntry && !menuIsEmpty,
            anchor: null,
            items,
            ...pinAdd ? { footer: addEntries } : {},
            selectedId,
            onSelect: handleSelect,
            onClose,
            side,
            portal: true,
            getAnchorRect
          }),
          open && !addIsTheOnlyEntry && !menuIsEmpty && workspaceSnapshot.phase === "pending" && (0, react_jsx_runtime.jsx)("div", {
            className: WorkspacePicker_module_css_default.menuStatus,
            role: "status",
            children: t("picker.loading")
          }),
          renderDirectoryFlow(flowOwner),
          (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: errorOpen,
            onClose: closeModal,
            closeLabel: t("close"),
            title: t("folderError.title"),
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
              variant: "outline",
              className: WorkspacePicker_module_css_default.modalAction,
              onClick: closeModal,
              children: t("cancel")
            }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
              variant: "primary",
              className: WorkspacePicker_module_css_default.modalAction,
              disabled: !flowAvailable,
              onClick: openDirectoryFlow,
              children: t("folderError.retry")
            })] }),
            children: (0, react_jsx_runtime.jsx)("div", {
              className: WorkspacePicker_module_css_default.modalError,
              role: "alert",
              children: modalError
            })
          })
        ] });
      }
      function WorkspacePicker({ open, anchorRef, useWorkspaces, selectedId, onPick, onClose, createWorkspace, useDirectoryFlow, renderSlot, t }) {
        return (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
          t,
          open,
          anchorRef,
          useWorkspaces,
          createWorkspace,
          useDirectoryFlow,
          renderDirectoryFlow: (owner) => renderSlot("conversation.hero.workspace.directoryFlow", owner),
          selectedId,
          onPick,
          onClose
        });
      }
      const css = '.qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:"";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}';
      const tagId = "@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = tagId;
        tag.textContent = css;
        document.head.appendChild(tag);
      }
      var WorkspaceBrowser_module_css_default = {
        "wide-in": "qDHVXG_wide-in",
        "searchWarning": "qDHVXG_searchWarning",
        "empty": "qDHVXG_empty",
        "deleteStatus": "qDHVXG_deleteStatus",
        "search": "qDHVXG_search",
        "fade": "qDHVXG_fade",
        "workspaceDropAfter": "qDHVXG_workspaceDropAfter",
        "searchSlot": "qDHVXG_searchSlot",
        "rail": "qDHVXG_rail",
        "searchSlotExpanded": "qDHVXG_searchSlotExpanded",
        "searchButton": "qDHVXG_searchButton",
        "workspaceDropBefore": "qDHVXG_workspaceDropBefore",
        "deleteAction": "qDHVXG_deleteAction",
        "root": "qDHVXG_root",
        "clearButton": "qDHVXG_clearButton",
        "listTopDropIndicator": "qDHVXG_listTopDropIndicator",
        "listTopDropActive": "qDHVXG_listTopDropActive",
        "headerActions": "qDHVXG_headerActions",
        "searchStatus": "qDHVXG_searchStatus",
        "sectionLabelHidden": "qDHVXG_sectionLabelHidden",
        "searchInput": "qDHVXG_searchInput",
        "listArea": "qDHVXG_listArea",
        "searchExpanded": "qDHVXG_searchExpanded",
        "list": "qDHVXG_list",
        "iconButton": "qDHVXG_iconButton",
        "sectionLabel": "qDHVXG_sectionLabel",
        "groupSection": "qDHVXG_groupSection",
        "renameInput": "qDHVXG_renameInput",
        "sessionOverflowButton": "qDHVXG_sessionOverflowButton",
        "treeBody": "qDHVXG_treeBody",
        "wide": "qDHVXG_wide",
        "flatList": "qDHVXG_flatList",
        "searchTree": "qDHVXG_searchTree",
        "sectionHeader": "qDHVXG_sectionHeader",
        "headerActionsHidden": "qDHVXG_headerActionsHidden",
        "renameError": "qDHVXG_renameError"
      };
      const EXPAND_SLIDE_MS = 300;
      const SEARCH_DEBOUNCE_MS = 250;
      const SEARCH_QUERY_MAX_CODE_UNITS = 500;
      const COLLAPSED_SESSION_LIMIT = 5;
      function sanitizeSearchQuery(value) {
        const withoutNul = value.replaceAll("\0", "");
        if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
        let end = SEARCH_QUERY_MAX_CODE_UNITS;
        const last = withoutNul.charCodeAt(end - 1);
        const next = withoutNul.charCodeAt(end);
        if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
        return withoutNul.slice(0, end);
      }
      function toggled(list, key) {
        return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
      }
      function useNativeDragAcceptance(active) {
        (0, react.useEffect)(() => {
          if (!active) return;
          const acceptDrag = (event) => {
            event.preventDefault();
            if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
          };
          const acceptDrop = (event) => {
            event.preventDefault();
          };
          document.addEventListener("dragover", acceptDrag);
          document.addEventListener("drop", acceptDrop);
          return () => {
            document.removeEventListener("dragover", acceptDrag);
            document.removeEventListener("drop", acceptDrop);
          };
        }, [active]);
      }
      function reconciledSessionOrder(sessionIds, stored) {
        if (stored === void 0) return [...sessionIds];
        const byId = new Map(sessionIds.map((id) => [id, id]));
        const ordered = [];
        const included = /* @__PURE__ */ new Set();
        for (const key of stored) {
          const id = byId.get(key);
          if (id === void 0 || included.has(key)) continue;
          ordered.push(id);
          included.add(key);
        }
        for (const id of sessionIds) {
          if (included.has(id)) continue;
          ordered.push(id);
        }
        return ordered;
      }
      function compareSessionRecency(a, b, byId) {
        const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
        const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
        if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
        return a < b ? -1 : 1;
      }
      function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
        let order = reconciledSessionOrder(sessionIds, previousOrder);
        if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
        else if (orderBy === "updated") {
          const promoted = sessionIds.filter((id) => {
            const session = list.byId[id];
            return session !== void 0 && (previousUpdatedAt[id] === void 0 || session.updatedAt > previousUpdatedAt[id]);
          }).sort((a, b) => compareSessionRecency(a, b, list.byId));
          if (promoted.length > 0) {
            const promotedIds = new Set(promoted);
            order = [...promoted, ...order.filter((id) => !promotedIds.has(id))];
          }
        }
        const updatedAt = {};
        for (const id of sessionIds) {
          const session = list.byId[id];
          if (session !== void 0) updatedAt[id] = session.updatedAt;
        }
        const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id, index) => id !== previousOrder[index]);
        const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id, timestamp]) => previousUpdatedAt[id] !== timestamp);
        return {
          order,
          updatedAt,
          changed: orderChanged || timestampsChanged
        };
      }
      function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
        const [open, setOpen] = (0, react.useState)(false);
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
          open,
          onClose: () => {
            setOpen(false);
          },
          items: [
            {
              type: "label",
              id: "group-by",
              text: t("groupBy.label")
            },
            {
              id: "workspace",
              label: t("groupBy.workspace")
            },
            {
              id: "flat",
              label: t("groupBy.flat")
            },
            {
              type: "separator",
              id: "order-by-separator"
            },
            {
              type: "label",
              id: "order-by",
              text: t("orderBy.label")
            },
            {
              id: "manual",
              label: t("orderBy.manual")
            },
            {
              id: "updated",
              label: t("orderBy.updated")
            }
          ],
          selectedIds: [groupBy, orderBy],
          onSelect: (id) => {
            if (id === "workspace" || id === "flat") onGroupPick(id);
            else if (id === "manual" || id === "updated") onOrderPick(id);
            setOpen(false);
          },
          align: "end",
          dense: true,
          portal: true,
          anchor: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
            label: t("viewOptions.label"),
            side: "bottom",
            delayMs: 500,
            children: (0, react_jsx_runtime.jsx)("button", {
              type: "button",
              className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
              "aria-label": t("viewOptions.label"),
              onClick: () => {
                setOpen((v) => !v);
              },
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPersonalizationOutline16, {})
            })
          })
        });
      }
      function workspaceGroupHalf(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
      }
      function SessionTree({ useSessions, useSessionPendingInteraction, startSession, open, forkSession, workspaces, archivedSessionIds, showArchived, onRenameRequest, onArchiveRequest, onDeleteRequest, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionPendingInteraction((s) => s);
        const current = list.current;
        const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)([]);
        const [drag, setDrag] = (0, react.useState)(null);
        const sessionDropCommitted = (0, react.useRef)(false);
        const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
        const workspaceDropCommitted = (0, react.useRef)(false);
        const previousOrderBy = (0, react.useRef)(orderBy);
        useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
        const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
        (0, react.useEffect)(() => {
          if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
          setGroupExpanded(currentGroup, true);
        }, [
          current,
          currentGroup,
          setGroupExpanded,
          groupExpansion
        ]);
        const expandedGroups = (0, react.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
        const ungroupedSessionIds = (0, react.useMemo)(() => {
          const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
          return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
        }, [list, workspaces]);
        (0, react.useEffect)(() => {
          if (list.phase !== "ready") return;
          const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
          previousOrderBy.current = orderBy;
          const accounts = [...workspaces.map((workspace) => ({
            key: workspace.workspaceId,
            sessionIds: workspace.sessionIds.filter((id) => list.byId[id] !== void 0)
          })), {
            key: "",
            sessionIds: ungroupedSessionIds
          }];
          for (const { key, sessionIds } of accounts) {
            const previousOrder = sessionOrderByAccount[key];
            const next = nextSessionOrderAccount({
              sessionIds,
              previousOrder,
              previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
              list,
              orderBy,
              sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
            });
            if (next.changed) syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
          }
        }, [
          list,
          orderBy,
          sessionOrderByAccount,
          sessionUpdatedAtByAccount,
          syncSessionOrderAccount,
          ungroupedSessionIds,
          workspaces
        ]);
        const orderedWorkspaces = (0, react.useMemo)(() => {
          return workspaces.map((workspace) => {
            const stored = sessionOrderByAccount[workspace.workspaceId];
            const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
            return {
              ...workspace,
              sessionIds
            };
          });
        }, [sessionOrderByAccount, workspaces]);
        const orderedUngroupedSessionIds = (0, react.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
        const groups = (0, react.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, pendingInteractions, {
          expandedGroups,
          showArchived,
          ...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
        }), [
          list,
          orderedWorkspaces,
          archivedSessionIds,
          pendingInteractions,
          showArchived,
          expandedGroups,
          sessionOrderByAccount
        ]);
        const now = Date.now();
        const commitSessionDrag = (activeDrag, over) => {
          if (sessionDropCommitted.current) return;
          sessionDropCommitted.current = true;
          setDrag(null);
          const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
          if (group === void 0) return;
          const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
          if (targetIndex === -1) return;
          const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
          if (anchor === activeDrag.sessionId) return;
          const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
          const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
          if (accountSessionIds === void 0) return;
          const nextOrder = accountSessionIds.filter((id) => id !== activeDrag.sessionId);
          const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
          nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
          setSessionOrder(activeDrag.accountKey, nextOrder.map((id) => id));
          if (orderBy === "updated" || activeDrag.accountKey === "") return;
          insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
            console.warn("session reorder rejected:", reason);
          });
        };
        const commitWorkspaceDrag = (activeDrag, over) => {
          if (workspaceDropCommitted.current) return;
          workspaceDropCommitted.current = true;
          setWorkspaceDrag(null);
          const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
          if (rowIndex === -1) return;
          const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
          if (anchor === activeDrag.workspaceId) return;
          const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
          const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
            console.warn("workspace reorder rejected:", reason);
          });
        };
        const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [
            workspaceDropAtListStart && (0, react_jsx_runtime.jsx)("span", {
              className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
              "aria-hidden": "true"
            }),
            (0, react_jsx_runtime.jsxs)("div", {
              className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
              role: "tree",
              "aria-label": t("section.sessions"),
              children: [groups.length === 0 && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.empty,
                children: t("empty.none")
              }), groups.map((group) => {
                const workspaceId = group.workspaceId;
                const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
                const workspaceDragProps = workspaceId === void 0 ? void 0 : {
                  start: () => {
                    workspaceDropCommitted.current = false;
                    setWorkspaceDrag({
                      workspaceId,
                      over: null
                    });
                  },
                  end: () => {
                    if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
                    else setWorkspaceDrag(null);
                    workspaceDropCommitted.current = false;
                  }
                };
                const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
                  setWorkspaceDrag((active) => active === null ? active : {
                    ...active,
                    over: {
                      id: workspaceId,
                      half
                    }
                  });
                };
                const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
                  if (workspaceDrag === null) return;
                  commitWorkspaceDrag(workspaceDrag, {
                    id: workspaceId,
                    half
                  });
                };
                return (0, react_jsx_runtime.jsxs)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter),
                  onDragOver: workspaceDrag === null || hoverWorkspace === void 0 ? void 0 : (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    hoverWorkspace(workspaceGroupHalf(e));
                  },
                  onDrop: workspaceDrag === null || dropWorkspace === void 0 ? void 0 : (e) => {
                    e.preventDefault();
                    dropWorkspace(workspaceGroupHalf(e));
                  },
                  children: [
                    (0, react_jsx_runtime.jsx)(ProjectRowItem, {
                      group,
                      t,
                      onToggle: () => {
                        if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
                        setGroupExpanded(group.key, !group.expanded);
                      },
                      onCreate: () => {
                        if (group.workspaceId !== void 0) {
                          setGroupExpanded(group.key, true);
                          startSession(group.workspaceId);
                        }
                      },
                      drag: workspaceDragProps,
                      actions: group.workspaceId === void 0 ? void 0 : {
                        canArchive: (() => {
                          const workspace = workspaces.find((item) => item.workspaceId === group.workspaceId);
                          return workspace !== void 0 && archiveableWorkspaceSessionCount(workspace, archivedSessionIds) > 0;
                        })(),
                        rename: () => {
                          if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
                        },
                        archive: () => {
                          if (group.workspaceId !== void 0) onArchiveRequest(group.workspaceId, group.label);
                        },
                        delete: () => {
                          if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
                        }
                      }
                    }),
                    (expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).map((node) => {
                      const sameGroupDrag = drag !== null && drag.accountKey === group.key;
                      return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
                        node,
                        currentId: current,
                        now,
                        onOpen: open,
                        onRename: onSessionRename,
                        onFork: (sessionId) => {
                          Promise.resolve(forkSession(sessionId)).catch((reason) => {
                            showArchivedToast(formatForkError(reason, t));
                          });
                        },
                        onArchive: onSessionArchive,
                        onUnarchive: onSessionUnarchive,
                        onDeleteSession: onSessionDelete,
                        drag: {
                          start: () => {
                            sessionDropCommitted.current = false;
                            setDrag({
                              accountKey: group.key,
                              sessionId: node.id,
                              over: null
                            });
                          },
                          active: sameGroupDrag,
                          marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
                          hover: (half) => {
                            setDrag((d) => d === null ? d : {
                              ...d,
                              over: {
                                id: node.id,
                                half
                              }
                            });
                          },
                          drop: (half) => {
                            if (drag === null) return;
                            commitSessionDrag(drag, {
                              id: node.id,
                              half
                            });
                          },
                          end: () => {
                            if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
                            else setDrag(null);
                            sessionDropCommitted.current = false;
                          }
                        },
                        t
                      }, node.id);
                    }),
                    group.sessions.length > COLLAPSED_SESSION_LIMIT && (0, react_jsx_runtime.jsx)("button", {
                      type: "button",
                      className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
                      "aria-expanded": expandedSessionGroups.includes(group.key),
                      onClick: () => {
                        setExpandedSessionGroups((keys) => toggled(keys, group.key));
                      },
                      children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
                    })
                  ]
                }, group.key);
              })]
            }),
            (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
          ]
        });
      }
      function FlatList({ useSessions, useSessionPendingInteraction, open, forkSession, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, archivedSessionIds, showArchived, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionPendingInteraction((s) => s);
        const baseRows = (0, react.useMemo)(() => deriveFlat(list, archivedSessionIds, pendingInteractions, showArchived), [
          list,
          archivedSessionIds,
          pendingInteractions,
          showArchived
        ]);
        const sessionIds = (0, react.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
        const previousOrderBy = (0, react.useRef)(orderBy);
        (0, react.useEffect)(() => {
          if (list.phase !== "ready") return;
          const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
          const previousUpdatedAt = sessionUpdatedAtByAccount[FLAT_SESSION_ORDER_KEY] ?? {};
          const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
          previousOrderBy.current = orderBy;
          const next = nextSessionOrderAccount({
            sessionIds,
            previousOrder,
            previousUpdatedAt,
            list,
            orderBy,
            sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
          });
          if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id) => id), next.updatedAt);
        }, [
          list,
          orderBy,
          sessionOrderByAccount,
          sessionUpdatedAtByAccount,
          sessionIds,
          syncSessionOrderAccount
        ]);
        const rows = (0, react.useMemo)(() => {
          const byId = new Map(baseRows.map((row) => [row.id, row]));
          return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id) => {
            const row = byId.get(id);
            return row === void 0 ? [] : [row];
          });
        }, [
          baseRows,
          sessionOrderByAccount,
          sessionIds
        ]);
        const [drag, setDrag] = (0, react.useState)(null);
        const dropCommitted = (0, react.useRef)(false);
        useNativeDragAcceptance(drag !== null);
        const commitDrag = (activeDrag, over) => {
          if (dropCommitted.current) return;
          dropCommitted.current = true;
          setDrag(null);
          const targetIndex = rows.findIndex((row) => row.id === over.id);
          if (targetIndex === -1) return;
          const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
          if (anchor === activeDrag.sessionId) return;
          const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
          const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
          if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
          const nextOrder = rows.map((row) => row.id).filter((id) => id !== activeDrag.sessionId);
          const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
          nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
          setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id) => id));
        };
        const now = Date.now();
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [(0, react_jsx_runtime.jsxs)("div", {
            className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
            role: "tree",
            "aria-label": t("section.sessions"),
            children: [rows.length === 0 && (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.empty,
              children: t("empty.none")
            }), rows.map((node) => {
              const active = drag !== null;
              return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
                node,
                currentId: list.current,
                now,
                onOpen: open,
                onRename: onSessionRename,
                onFork: (sessionId) => {
                  Promise.resolve(forkSession(sessionId)).catch((reason) => {
                    showArchivedToast(formatForkError(reason, t));
                  });
                },
                onArchive: onSessionArchive,
                onUnarchive: onSessionUnarchive,
                onDeleteSession: onSessionDelete,
                flat: true,
                drag: {
                  start: () => {
                    dropCommitted.current = false;
                    setDrag({
                      accountKey: FLAT_SESSION_ORDER_KEY,
                      sessionId: node.id,
                      over: null
                    });
                  },
                  active,
                  marker: active && drag.over?.id === node.id ? drag.over.half : null,
                  hover: (half) => {
                    setDrag((current) => current === null ? current : {
                      ...current,
                      over: {
                        id: node.id,
                        half
                      }
                    });
                  },
                  drop: (half) => {
                    if (drag !== null) commitDrag(drag, {
                      id: node.id,
                      half
                    });
                  },
                  end: () => {
                    if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
                    else setDrag(null);
                    dropCommitted.current = false;
                  }
                },
                t
              }, node.id);
            })]
          }), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
        });
      }
      function SearchResults({ useSessions, useSessionPendingInteraction, open, workspaces, archivedSessionIds, showArchived, query, remote, resultLimit, t }) {
        const list = useSessions((s) => s);
        const pendingInteractions = useSessionPendingInteraction((s) => s);
        const ungroupedLabel = t("group.ungrouped");
        const currentRemote = remote.query === query ? remote : {
          query,
          status: "loading",
          items: [],
          hasMore: false
        };
        const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, pendingInteractions, currentRemote, resultLimit, showArchived, ungroupedLabel), [
          list,
          workspaces,
          query,
          archivedSessionIds,
          pendingInteractions,
          currentRemote,
          resultLimit,
          showArchived,
          ungroupedLabel
        ]);
        const pending = currentRemote.status === "loading";
        const failed = currentRemote.status === "error";
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
          children: [(0, react_jsx_runtime.jsxs)("div", {
            className: WorkspaceBrowser_module_css_default.list,
            children: [
              (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchTree,
                role: "tree",
                "aria-label": t("search.results.aria"),
                children: results.items.map((result) => (0, react_jsx_runtime.jsx)(SearchResultItem, {
                  result,
                  currentId: list.current,
                  onOpen: open,
                  t
                }, result.id))
              }),
              pending && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchStatus,
                role: "status",
                children: t("search.pending")
              }),
              failed && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchWarning,
                role: "status",
                children: t("search.unavailable")
              }),
              !pending && results.items.length === 0 && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.empty,
                children: t("search.noMatches")
              }),
              results.hasMore && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.searchStatus,
                children: t("search.hasMore", { n: resultLimit })
              })
            ]
          }), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
        });
      }
      function WorkspaceBrowser({ wide, expandSidebar, useSessions, useSessionPendingInteraction, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, archiveWorkspaceSessions, unarchiveSession, deleteSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, renderSlot, t }) {
        const useEffectiveSessionPendingInteraction = useSessionPendingInteraction ?? useEmptySessionPendingInteraction;
        const workspaces = useWorkspaces((state) => state.items);
        const workspacePhase = useWorkspaces((state) => state.phase);
        const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
        const sessionSnapshot = useSessions((s) => s);
        const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
        const groupBy = useStore((s) => s.groupBy);
        const orderBy = useStore((s) => s.orderBy);
        const showArchived = useStore((s) => s.showArchived) === true;
        const groupExpansion = useStore((s) => s.groupExpansion);
        const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
        const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
        const archivedSet = (0, react.useMemo)(() => new Set(archivedSessionIds), [archivedSessionIds]);
        const [archivedToast, setArchivedToast] = (0, react.useState)(null);
        const archivedToastSeq = (0, react.useRef)(0);
        const showArchivedToast2 = (text) => {
          archivedToastSeq.current += 1;
          setArchivedToast({
            text,
            seq: archivedToastSeq.current
          });
        };
        const guardedOpen = (sessionId) => {
          if (archivedSet.has(sessionId)) {
            showArchivedToast2(t("archived.notOpenable"));
            return;
          }
          open(sessionId);
        };
        (0, react.useEffect)(() => {
          if (workspacePhase !== "ready") return;
          actions.retainAccountKeys([
            "",
            FLAT_SESSION_ORDER_KEY,
            ...workspaces.map((workspace) => workspace.workspaceId)
          ]);
        }, [
          actions.retainAccountKeys,
          workspacePhase,
          workspaces
        ]);
        const [query, setQuery] = (0, react.useState)("");
        const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
        const normalizedQuery = sanitizeSearchQuery(query).trim();
        const [remoteSearch, setRemoteSearch] = (0, react.useState)({
          query: "",
          status: "idle",
          items: [],
          hasMore: false
        });
        const searchRoot = (0, react.useRef)(null);
        const searchInput = (0, react.useRef)(null);
        const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
        const wsPlusRef = (0, react.useRef)(null);
        const composingRef = (0, react.useRef)(false);
        const [searchOnExpand, setSearchOnExpand] = (0, react.useState)(false);
        (0, react.useEffect)(() => {
          if (wide && searchOnExpand) {
            const timer = window.setTimeout(() => {
              searchInput.current?.focus({ preventScroll: true });
              setSearchOnExpand(false);
            }, EXPAND_SLIDE_MS);
            return () => {
              window.clearTimeout(timer);
            };
          }
        }, [wide, searchOnExpand]);
        (0, react.useEffect)(() => {
          if (!wide || !searchExpanded || searchOnExpand) return;
          searchInput.current?.focus({ preventScroll: true });
        }, [
          wide,
          searchExpanded,
          searchOnExpand
        ]);
        (0, react.useEffect)(() => {
          if (!wide || !searchExpanded) return;
          const onClick = (event) => {
            if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
            searchInput.current?.blur();
            if (normalizedQuery !== "") return;
            setSearchExpanded(false);
          };
          document.addEventListener("click", onClick);
          return () => {
            document.removeEventListener("click", onClick);
          };
        }, [
          normalizedQuery,
          wide,
          searchExpanded
        ]);
        (0, react.useEffect)(() => {
          if (normalizedQuery === "") {
            setRemoteSearch({
              query: "",
              status: "idle",
              items: [],
              hasMore: false
            });
            return;
          }
          const controller = new AbortController();
          setRemoteSearch({
            query: normalizedQuery,
            status: "loading",
            items: [],
            hasMore: false
          });
          const timer = window.setTimeout(() => {
            searchSessions(normalizedQuery, controller.signal).then((result) => {
              if (controller.signal.aborted) return;
              setRemoteSearch({
                query: normalizedQuery,
                status: "ready",
                items: result.items,
                hasMore: result.hasMore
              });
            }).catch(() => {
              if (controller.signal.aborted) return;
              setRemoteSearch({
                query: normalizedQuery,
                status: "error",
                items: [],
                hasMore: false
              });
            });
          }, SEARCH_DEBOUNCE_MS);
          return () => {
            window.clearTimeout(timer);
            controller.abort();
          };
        }, [normalizedQuery, searchSessions]);
        const [renameTarget, setRenameTarget] = (0, react.useState)(null);
        const [renameDraft, setRenameDraft] = (0, react.useState)("");
        const [renaming, setRenaming] = (0, react.useState)(false);
        const [renameError, setRenameError] = (0, react.useState)(null);
        const renameTrimmed = renameDraft.trim();
        const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
        const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
        const closeRename = () => {
          if (renaming) return;
          setRenameTarget(null);
          setRenameError(null);
        };
        const confirmRename = () => {
          if (renameBlocked) return;
          setRenaming(true);
          setRenameError(null);
          renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
            setRenaming(false);
            setRenameTarget(null);
          }).catch((reason) => {
            setRenaming(false);
            setRenameError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)(null);
        const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
        const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
        const [sessionRenameError, setSessionRenameError] = (0, react.useState)(null);
        const sessionRenameTrimmed = sessionRenameDraft.trim();
        const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
        const closeSessionRename = () => {
          if (sessionRenaming) return;
          setSessionRenameTarget(null);
          setSessionRenameError(null);
        };
        const confirmSessionRename = () => {
          if (sessionRenameBlocked) return;
          setSessionRenaming(true);
          setSessionRenameError(null);
          renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
            setSessionRenaming(false);
            setSessionRenameTarget(null);
          }).catch((reason) => {
            setSessionRenaming(false);
            setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const onSessionRename = (sessionId, currentTitle) => {
          setSessionRenameTarget({
            sessionId,
            currentTitle
          });
          setSessionRenameDraft(currentTitle);
          setSessionRenameError(null);
        };
        const onSessionArchive = (sessionId) => {
          archiveSession(sessionId).catch((reason) => {
            showArchivedToast2(formatArchiveError(reason, t));
          });
        };
        const [archiveWorkspaceTarget, setArchiveWorkspaceTarget] = (0, react.useState)(null);
        const [archivingWorkspace, setArchivingWorkspace] = (0, react.useState)(false);
        const [archiveWorkspaceError, setArchiveWorkspaceError] = (0, react.useState)(null);
        const closeArchiveWorkspace = () => {
          if (archivingWorkspace) return;
          setArchiveWorkspaceTarget(null);
          setArchiveWorkspaceError(null);
        };
        const onArchiveWorkspaceRequest = (workspaceId, title) => {
          const target = archiveWorkspaceDialogTarget(workspaces, workspaceId, title, archivedSet);
          if (target === null) return;
          setArchiveWorkspaceTarget(target);
          setArchiveWorkspaceError(null);
        };
        const confirmArchiveWorkspace = () => {
          if (archivingWorkspace || archiveWorkspaceTarget === null) return;
          setArchivingWorkspace(true);
          setArchiveWorkspaceError(null);
          archiveWorkspaceSessions(archiveWorkspaceTarget.workspaceId).then(() => {
            setArchivingWorkspace(false);
            setArchiveWorkspaceTarget(null);
          }).catch((reason) => {
            const state = archiveWorkspaceDialogFailureState(archiveWorkspaceTarget, reason, t);
            setArchivingWorkspace(state.archiving);
            setArchiveWorkspaceError(state.error);
          });
        };
        const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
        const [deleting, setDeleting] = (0, react.useState)(false);
        const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)(null);
        const [deleteError, setDeleteError] = (0, react.useState)(null);
        (0, react.useEffect)(() => {
          if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
          setDeleting(false);
          setDeleteCommittedId(null);
          setDeleteTarget(null);
        }, [deleteCommittedId, workspaces]);
        const closeDelete = () => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        };
        const confirmDelete = () => {
          if (deleting || deleteTarget === null) return;
          setDeleting(true);
          setDeleteCommittedId(null);
          setDeleteError(null);
          deleteWorkspace(deleteTarget.workspaceId).then(() => {
            setDeleteCommittedId(deleteTarget.workspaceId);
          }).catch((reason) => {
            setDeleting(false);
            setDeleteError(reason instanceof Error ? reason.message : String(reason));
          });
        };
        const onSessionUnarchive = (sessionId) => {
          unarchiveSession(sessionId).catch((reason) => {
            showArchivedToast2(formatUnarchiveError(reason, t));
          });
        };
        const [deleteSessionTarget, setDeleteSessionTarget] = (0, react.useState)(null);
        const [deletingSession, setDeletingSession] = (0, react.useState)(false);
        const [deleteSessionCommittedId, setDeleteSessionCommittedId] = (0, react.useState)(null);
        const [deleteSessionError, setDeleteSessionError] = (0, react.useState)(null);
        (0, react.useEffect)(() => {
          if (deleteSessionCommittedId === null || archivedSet.has(deleteSessionCommittedId) || workspaces.some((workspace) => workspace.sessionIds.includes(deleteSessionCommittedId))) return;
          setDeletingSession(false);
          setDeleteSessionCommittedId(null);
          setDeleteSessionTarget(null);
        }, [deleteSessionCommittedId, archivedSet, workspaces]);
        const closeDeleteSession = () => {
          if (deletingSession) return;
          setDeleteSessionTarget(null);
          setDeleteSessionError(null);
        };
        const confirmDeleteSession = () => {
          if (deletingSession || deleteSessionTarget === null) return;
          setDeletingSession(true);
          setDeleteSessionError(null);
          const rootId = deleteSessionTarget.sessionId;
          deleteSession(rootId).then(() => {
            setDeletingSession(false);
            setDeleteSessionTarget(null);
            setDeleteSessionCommittedId(rootId);
          }).catch((reason) => {
            setDeletingSession(false);
            setDeleteSessionError(formatDeleteError(reason, t));
          });
        };
        return (0, react_jsx_runtime.jsxs)("div", {
          className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
          children: [
            (0, react_jsx_runtime.jsxs)("div", {
              className: WorkspaceBrowser_module_css_default.sectionHeader,
              children: [
                wide && (0, react_jsx_runtime.jsx)("span", {
                  className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
                  children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
                }),
                wide && (0, react_jsx_runtime.jsx)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
                  children: (0, react_jsx_runtime.jsxs)("div", {
                    ref: searchRoot,
                    className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
                    onClick: () => {
                      setWsPickerOpen(false);
                      setSearchExpanded(true);
                      searchInput.current?.focus();
                    },
                    children: [
                      (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                        label: t("search"),
                        side: "bottom",
                        delayMs: 500,
                        disabled: searchExpanded,
                        children: (0, react_jsx_runtime.jsx)("button", {
                          type: "button",
                          className: WorkspaceBrowser_module_css_default.searchButton,
                          "aria-label": t("search.sessions.aria"),
                          "aria-expanded": searchExpanded,
                          onClick: () => {
                            setWsPickerOpen(false);
                            setSearchExpanded(true);
                          },
                          children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
                        })
                      }),
                      (0, react_jsx_runtime.jsx)("input", {
                        ref: searchInput,
                        className: WorkspaceBrowser_module_css_default.searchInput,
                        type: "text",
                        placeholder: t("search.placeholder"),
                        maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
                        value: query,
                        tabIndex: searchExpanded ? 0 : -1,
                        onChange: (e) => {
                          setQuery(sanitizeSearchQuery(e.target.value));
                        },
                        onKeyDown: (e) => {
                          if (e.key !== "Escape") return;
                          setQuery("");
                          setSearchExpanded(false);
                        }
                      }),
                      searchExpanded && (0, react_jsx_runtime.jsx)("button", {
                        type: "button",
                        className: WorkspaceBrowser_module_css_default.clearButton,
                        "aria-label": t("search.clear"),
                        onClick: (e) => {
                          e.stopPropagation();
                          setQuery("");
                          setSearchExpanded(false);
                        },
                        children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFill14, {})
                      })
                    ]
                  })
                }),
                (0, react_jsx_runtime.jsxs)("div", {
                  className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
                  children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
                    groupBy,
                    orderBy,
                    onGroupPick: (mode) => {
                      actions.setGroupBy(mode);
                    },
                    onOrderPick: (mode) => {
                      actions.setOrderBy(mode);
                    },
                    t
                  }), directoryFlowAvailable && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                    label: t("workspace.add"),
                    side: "bottom",
                    delayMs: 500,
                    children: (0, react_jsx_runtime.jsx)("button", {
                      ref: wsPlusRef,
                      type: "button",
                      className: WorkspaceBrowser_module_css_default.iconButton,
                      "aria-label": t("workspace.add"),
                      onClick: () => {
                        setWsPickerOpen((v) => !v);
                      },
                      children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutline16, { size: wide ? 16 : 18 })
                    })
                  })]
                }),
                (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
                  t,
                  open: wsPickerOpen,
                  anchorRef: wsPlusRef,
                  useWorkspaces,
                  createWorkspace,
                  useDirectoryFlow,
                  renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
                  addOnly: true,
                  side: "right",
                  onPick: (workspaceId) => {
                    setWsPickerOpen(false);
                    startSession(workspaceId);
                  },
                  onClose: () => {
                    setWsPickerOpen(false);
                  }
                })
              ]
            }),
            !wide && (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.search,
              children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
                label: t("search"),
                children: (0, react_jsx_runtime.jsx)("button", {
                  type: "button",
                  className: WorkspaceBrowser_module_css_default.searchButton,
                  "aria-label": t("search.sessions.aria"),
                  onClick: () => {
                    setSearchExpanded(true);
                    setSearchOnExpand(true);
                    expandSidebar();
                  },
                  children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 18 })
                })
              })
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: WorkspaceBrowser_module_css_default.listArea,
              children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime.jsx)(SearchResults, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                open: guardedOpen,
                workspaces,
                archivedSessionIds,
                showArchived,
                query: normalizedQuery,
                remote: remoteSearch,
                resultLimit: searchResultLimit,
                t
              }) : groupBy === "flat" ? (0, react_jsx_runtime.jsx)(FlatList, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                open: guardedOpen,
                forkSession,
                onSessionRename,
                onSessionArchive,
                onSessionUnarchive,
                onSessionDelete: (sessionId, title) => {
                  setDeleteSessionTarget({ sessionId, title });
                  setDeleteSessionError(null);
                },
                archivedSessionIds,
                showArchived,
                orderBy,
                sessionOrderByAccount,
                sessionUpdatedAtByAccount,
                syncSessionOrderAccount: actions.syncSessionOrderAccount,
                setSessionOrder: actions.setSessionOrder,
                t
              }) : (0, react_jsx_runtime.jsx)(SessionTree, {
                useSessions,
                useSessionPendingInteraction: useEffectiveSessionPendingInteraction,
                onSessionRename,
                onSessionArchive,
                onSessionUnarchive,
                onSessionDelete: (sessionId, title) => {
                  setDeleteSessionTarget({ sessionId, title });
                  setDeleteSessionError(null);
                },
                forkSession,
                workspaces,
                groupExpansion,
                setGroupExpanded: actions.setGroupExpanded,
                sessionOrderByAccount,
                sessionUpdatedAtByAccount,
                syncSessionOrderAccount: actions.syncSessionOrderAccount,
                setSessionOrder: actions.setSessionOrder,
                archivedSessionIds,
                showArchived,
                startSession,
                open: guardedOpen,
                insertWorkspaceBefore,
                insertSessionBefore,
                orderBy,
                t,
                onRenameRequest: (workspaceId, currentTitle) => {
                  setRenameTarget({
                    workspaceId,
                    currentTitle
                  });
                  setRenameDraft(currentTitle);
                  setRenameError(null);
                },
                onArchiveRequest: onArchiveWorkspaceRequest,
                onDeleteRequest: (workspaceId, title) => {
                  setDeleteTarget({
                    workspaceId,
                    title
                  });
                  setDeleteError(null);
                }
              }))
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: renameTarget !== null,
              onClose: closeRename,
              closeLabel: t("close"),
              title: t("rename.workspace.title"),
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: renaming,
                onClick: closeRename,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "primary",
                disabled: renameBlocked,
                onClick: confirmRename,
                children: t("rename")
              })] }),
              children: [
                (0, react_jsx_runtime.jsx)("input", {
                  className: WorkspaceBrowser_module_css_default.renameInput,
                  value: renameDraft,
                  "aria-label": t("field.workspaceName"),
                  autoFocus: true,
                  disabled: renaming,
                  onFocus: (e) => {
                    e.target.select();
                  },
                  onChange: (e) => {
                    setRenameDraft(e.target.value);
                    setRenameError(null);
                  },
                  onCompositionStart: () => {
                    composingRef.current = true;
                  },
                  onCompositionEnd: () => {
                    composingRef.current = false;
                  },
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !composingRef.current) {
                      e.preventDefault();
                      confirmRename();
                    }
                  }
                }),
                renameDuplicate && (0, react_jsx_runtime.jsx)("div", {
                  className: WorkspaceBrowser_module_css_default.renameError,
                  role: "alert",
                  children: t("conflict.named", { name: renameTrimmed })
                }),
                renameError !== null && (0, react_jsx_runtime.jsx)("div", {
                  className: WorkspaceBrowser_module_css_default.renameError,
                  role: "alert",
                  children: renameError
                })
              ]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: sessionRenameTarget !== null,
              onClose: closeSessionRename,
              closeLabel: t("close"),
              title: t("rename.session.title"),
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: sessionRenaming,
                onClick: closeSessionRename,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "primary",
                disabled: sessionRenameBlocked,
                onClick: confirmSessionRename,
                children: t("rename")
              })] }),
              children: [(0, react_jsx_runtime.jsx)("input", {
                className: WorkspaceBrowser_module_css_default.renameInput,
                value: sessionRenameDraft,
                "aria-label": t("field.sessionName"),
                autoFocus: true,
                disabled: sessionRenaming,
                onFocus: (e) => {
                  e.target.select();
                },
                onChange: (e) => {
                  setSessionRenameDraft(e.target.value);
                  setSessionRenameError(null);
                },
                onCompositionStart: () => {
                  composingRef.current = true;
                },
                onCompositionEnd: () => {
                  composingRef.current = false;
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !composingRef.current) {
                    e.preventDefault();
                    confirmSessionRename();
                  }
                }
              }), sessionRenameError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: sessionRenameError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: deleteTarget !== null,
              onClose: closeDelete,
              closeLabel: t("close"),
              title: t("delete.workspace"),
              ...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: deleting,
                onClick: closeDelete,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: WorkspaceBrowser_module_css_default.deleteAction,
                disabled: deleting,
                onClick: confirmDelete,
                children: t("delete.workspace")
              })] }),
              children: [deleting && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("delete.pending")
              }), deleteError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: deleteError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: archiveWorkspaceTarget !== null,
              onClose: closeArchiveWorkspace,
              closeLabel: t("close"),
              title: archiveWorkspaceTarget === null ? "" : t("archiveWorkspace.title", { n: archiveWorkspaceTarget.count }),
              ...archiveWorkspaceTarget === null ? {} : { description: t("archiveWorkspace.desc", { name: archiveWorkspaceTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: archivingWorkspace,
                onClick: closeArchiveWorkspace,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: "dsham_archiveWorkspaceConfirm",
                disabled: archivingWorkspace,
                onClick: confirmArchiveWorkspace,
                children: t("archiveWorkspace.confirm")
              })] }),
              children: [archivingWorkspace && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("archiveWorkspace.pending")
              }), archiveWorkspaceError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: archiveWorkspaceError
              })]
            }),
            (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
              open: deleteSessionTarget !== null,
              onClose: closeDeleteSession,
              closeLabel: t("close"),
              title: t("deleteSession.title"),
              ...deleteSessionTarget === null ? {} : { description: t("deleteSession.desc", { name: deleteSessionTarget.title }) },
              footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                disabled: deletingSession,
                onClick: closeDeleteSession,
                children: t("cancel")
              }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
                variant: "outline",
                className: WorkspaceBrowser_module_css_default.deleteAction,
                disabled: deletingSession,
                onClick: confirmDeleteSession,
                children: t("deleteSession.title")
              })] }),
              children: [deletingSession && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.deleteStatus,
                role: "status",
                children: t("deleteSession.pending")
              }), deleteSessionError !== null && (0, react_jsx_runtime.jsx)("div", {
                className: WorkspaceBrowser_module_css_default.renameError,
                role: "alert",
                children: deleteSessionError
              })]
            }),
            archivedToast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
              key: archivedToast.seq,
              text: archivedToast.text,
              onDone: () => {
                setArchivedToast(null);
              }
            })
          ]
        });
      }
      const ARCHIVE_SETTINGS_CSS = ".dsham_settings{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dsham_settingsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dsham_settings h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.2px;line-height:28px}.dsham_settingsIntro{margin:4px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dsham_settingsDanger{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;color:var(--dsw-alias-state-error-primary);background:transparent;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)}.dsham_settingsToolbar{display:flex;gap:8px;margin-bottom:16px}.dsham_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0;flex:1;height:32px;padding:0 12px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px}.dsham_settingsSearch:focus-within{border-color:var(--dsw-alias-label-tertiary)}.dsham_settingsSearch input{width:100%;min-width:0;padding:0;color:var(--dsw-alias-label-primary);background:transparent;border:0;outline:0;font:inherit;font-size:12px}.dsham_settingsSearch input::placeholder{color:var(--dsw-alias-label-tertiary)}.dsham_settingsFilter{position:relative;min-width:168px;flex:none}.dsham_selectTrigger{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:32px;padding:0 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;line-height:20px;text-align:left}.dsham_selectTrigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_selectTrigger:focus-visible{outline:2px solid var(--dsw-alias-state-success-primary);outline-offset:2px}.dsham_selectTrigger[aria-expanded='true']{border-color:var(--dsw-alias-state-success-primary)}.dsham_selectValue{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_selectCaret{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary)}.dsham_selectMenu{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;box-sizing:border-box;min-width:100%;max-height:280px;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-shadow-lv3)}.dsham_selectOption{box-sizing:border-box;display:flex;align-items:center;width:100%;min-height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}.dsham_selectOption:hover,.dsham_selectOption[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}.dsham_selectOption[aria-selected='true']{color:var(--dsw-alias-state-success-primary)}.dsham_settingsGroup{margin:0 0 20px}.dsham_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.dsham_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.dsham_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}.dsham_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}.dsham_settingsList{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.dsham_settingsRow{display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsRow:last-child{border-bottom:0}.dsham_settingsContent{min-width:0;flex:1}.dsham_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsMeta{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dsham_settingsActions{display:flex;align-items:center;gap:8px}.dsham_settingsAction{min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsAction:hover{filter:brightness(1.12)}.dsham_settingsDelete{display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dsham_settingsDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}.dsham_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}@media(max-width:720px){.dsham_settings{width:100%;margin:28px auto 48px;padding:0 16px}.dsham_settingsHeader{margin-bottom:28px}.dsham_settingsToolbar{flex-wrap:wrap;margin-bottom:28px}.dsham_settingsSearch{flex-basis:100%}.dsham_settingsFilter{flex:1;min-width:0}.dsham_settingsGroup{margin-bottom:32px}.dsham_settingsRow{padding:10px 12px}.dsham_settingsActions{gap:4px}}";
      const ARCHIVE_SETTINGS_BATCH_CSS = ".dsham_settingsHeaderActions,.dsham_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none}.dsham_settingsRestoreAll{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsRestoreAll:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsRestoreAll:disabled,.dsham_settingsDanger:disabled,.dsham_settingsGroupMenu:disabled{cursor:not-allowed;opacity:.5}.dsham_settingsGroupMenu{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dsham_settingsGroupMenu:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}@media(max-width:720px){.dsham_settingsHeader{flex-direction:column}.dsham_settingsHeaderActions{align-self:flex-end}}";
      const ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS = ".dsham_settingsTitleRow{display:flex;align-items:center;gap:8px;min-width:0}.dsham_settingsLinks{display:flex;align-items:center;gap:4px}.dsham_settingsExternalLink{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap}.dsham_settingsExternalLink:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsExternalLink:focus-visible{outline:2px solid var(--dsw-alias-state-success-primary);outline-offset:2px}.dsham_settingsExternalLink svg{flex:none}@media(max-width:720px){.dsham_settingsTitleRow{flex-wrap:wrap}}";
      const ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS = ".dsham_settingsDeleteConfirm{color:var(--dsw-alias-state-error-primary)!important;background:transparent!important;border-color:var(--dsw-alias-state-error-primary)!important}.dsham_settingsDeleteConfirm:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)!important}.dsham_settingsDeleteConfirm:focus-visible{outline:2px solid var(--dsw-alias-state-error-secondary);outline-offset:2px}.dsham_settingsDeleteConfirm:disabled{cursor:not-allowed;opacity:.5}";
      const ARCHIVE_WORKSPACE_CONFIRM_CSS = ".dsham_archiveWorkspaceConfirm{color:var(--dsw-alias-state-error-primary)!important;background:transparent!important;border-color:var(--dsw-alias-state-error-primary)!important}.dsham_archiveWorkspaceConfirm:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)!important}.dsham_archiveWorkspaceConfirm:focus-visible{outline:2px solid var(--dsw-alias-state-error-secondary);outline-offset:2px}.dsham_archiveWorkspaceConfirm:disabled{cursor:not-allowed;opacity:.5}";
      const ARCHIVE_SETTINGS_SELECTION_CSS = ".dsham_settingsSelection{display:flex;align-items:center;gap:10px;min-height:40px;margin:-8px 0 16px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.dsham_settingsSelectionToggle{display:inline-flex;align-items:center;gap:8px;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer}.dsham_settingsCheckbox{width:16px;height:16px;margin:0;accent-color:#3b82f6}.dsham_settingsSelectionCount{margin-right:auto;color:var(--dsw-alias-label-tertiary);font-size:12px}.dsham_settingsSelectionAction{min-height:28px;padding:0 10px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;cursor:pointer;font:inherit;font-size:12px;font-weight:500}.dsham_settingsSelectionAction:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsSelectionDelete{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.dsham_settingsSelectionAction:disabled{cursor:not-allowed;opacity:.5}@media(max-width:720px){.dsham_settingsSelection{flex-wrap:wrap}.dsham_settingsSelectionCount{margin-right:0}.dsham_settingsSelectionAction{margin-left:auto}.dsham_settingsSelectionAction+.dsham_settingsSelectionAction{margin-left:-2px}}";
      const ARCHIVE_SETTINGS_LAYOUT_OVERRIDE = ".dsham_settings{margin:0 auto!important}@media(max-width:720px){.dsham_settings{margin:0 auto!important}}";
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-archive-manager/ArchiveSettings.layout.css") + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "@michengai/dsh-archive-manager";
        tag.dataset.pluginCss = "dsh-archive-manager/ArchiveSettings.layout.css";
        tag.textContent = ARCHIVE_SETTINGS_LAYOUT_OVERRIDE + ARCHIVE_SETTINGS_DELETE_CONFIRM_CSS + ARCHIVE_WORKSPACE_CONFIRM_CSS;
        document.head.appendChild(tag);
      }
      function ArchiveProjectSelect({ id, value, options, onChange, "aria-label": ariaLabel }) {
        const [open, setOpen] = (0, react.useState)(false);
        const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
        const [active, setActive] = (0, react.useState)(selectedIndex);
        const rootRef = (0, react.useRef)(null);
        const triggerRef = (0, react.useRef)(null);
        const listRef = (0, react.useRef)(null);
        const wasOpen = (0, react.useRef)(false);
        const selected = options[selectedIndex];
        (0, react.useEffect)(() => {
          if (!open) return;
          setActive(selectedIndex);
          const onPointerDown = (event) => {
            const target = event.target;
            if (target instanceof Node && rootRef.current?.contains(target) === true) return;
            setOpen(false);
          };
          document.addEventListener("pointerdown", onPointerDown);
          return () => document.removeEventListener("pointerdown", onPointerDown);
        }, [open, selectedIndex]);
        (0, react.useEffect)(() => {
          if (open) {
            listRef.current?.focus();
            wasOpen.current = true;
            return;
          }
          if (wasOpen.current) {
            triggerRef.current?.focus();
            wasOpen.current = false;
          }
        }, [open]);
        (0, react.useEffect)(() => {
          if (!open) return;
          document.getElementById(id + "-opt-" + String(active))?.scrollIntoView({ block: "nearest" });
        }, [active, open, id]);
        const choose = (next) => {
          onChange(next);
          setOpen(false);
        };
        const move = (next) => {
          if (options.length === 0) return;
          setActive(Math.min(options.length - 1, Math.max(0, next)));
        };
        return (0, react_jsx_runtime.jsxs)("div", {
          className: "dsham_settingsFilter",
          ref: rootRef,
          children: [(0, react_jsx_runtime.jsxs)("button", {
            id,
            ref: triggerRef,
            type: "button",
            className: "dsham_selectTrigger",
            "aria-label": ariaLabel,
            "aria-haspopup": "listbox",
            "aria-expanded": open,
            "aria-controls": id + "-list",
            onClick: () => setOpen((current) => !current),
            onKeyDown: (event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
              }
            },
            children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_selectValue", children: selected === void 0 ? "" : selected.label }), (0, react_jsx_runtime.jsx)("svg", {
              className: "dsham_selectCaret",
              viewBox: "0 0 12 12",
              "aria-hidden": true,
              focusable: false,
              children: (0, react_jsx_runtime.jsx)("path", {
                d: "M2.5 4.5L6 8l3.5-3.5",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              })
            })]
          }), open ? (0, react_jsx_runtime.jsx)("div", {
            id: id + "-list",
            ref: listRef,
            className: "dsham_selectMenu",
            role: "listbox",
            tabIndex: 0,
            "aria-activedescendant": id + "-opt-" + String(active),
            onKeyDown: (event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(active + 1);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                move(active - 1);
                return;
              }
              if (event.key === "Home") {
                event.preventDefault();
                move(0);
                return;
              }
              if (event.key === "End") {
                event.preventDefault();
                move(options.length - 1);
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const option = options[active];
                if (option !== void 0) choose(option.value);
                return;
              }
              if (event.key === "Escape" || event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
                setOpen(false);
              }
            },
            children: options.map((option, index) => (0, react_jsx_runtime.jsx)("button", {
              id: id + "-opt-" + String(index),
              type: "button",
              role: "option",
              className: "dsham_selectOption",
              "aria-selected": option.value === value,
              "data-active": index === active,
              onMouseEnter: () => setActive(index),
              onClick: () => choose(option.value),
              children: option.label
            }, option.value === "all" ? "all" : option.value))
          }) : null]
        });
      }
      function ArchiveSelectionCheckbox({ checked, indeterminate = false, disabled = false, label, onChange }) {
        const inputRef = (0, react.useRef)(null);
        (0, react.useEffect)(() => {
          if (inputRef.current !== null) inputRef.current.indeterminate = indeterminate;
        }, [indeterminate]);
        return (0, react_jsx_runtime.jsx)("input", {
          ref: inputRef,
          type: "checkbox",
          className: "dsham_settingsCheckbox",
          checked,
          disabled,
          "aria-label": label,
          onChange
        });
      }
      function ArchivedGroupActions({ group, busy, onRestore, onDelete, t }) {
        const [open, setOpen] = (0, react.useState)(false);
        const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
        const items = [{
          id: "restore",
          label: t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {})
        }, {
          id: "delete",
          label: t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject"),
          icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
          danger: true
        }];
        return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
          open,
          onClose: () => setOpen(false),
          items,
          onSelect: (id) => {
            setOpen(false);
            if (id === "restore") onRestore();
            else if (id === "delete") onDelete();
          },
          portal: true,
          anchor: (0, react_jsx_runtime.jsx)("button", {
            type: "button",
            className: "dsham_settingsGroupMenu",
            disabled: busy,
            "aria-label": t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title }),
            onClick: () => setOpen((current) => !current),
            children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
          })
        });
      }
      const ARCHIVE_UNGROUPED_KEY = "__ungrouped__";
      function archivedBatchTargetForGroup(groupKey) {
        return groupKey === ARCHIVE_UNGROUPED_KEY ? { scope: "ungrouped" } : { scope: "workspace", workspaceId: groupKey };
      }
      function deriveArchivedBatchIds(archivedSessionIds, items, target) {
        const ids = [...new Set(archivedSessionIds ?? [])];
        if (target.scope === "all") return ids;
        if (target.scope === "sessions") {
          const selected = new Set(target.sessionIds ?? []);
          return ids.filter((id) => selected.has(id));
        }
        if (target.scope === "workspace") {
          const accounted2 = new Set(items.find((workspace) => workspace.workspaceId === target.workspaceId)?.sessionIds ?? []);
          return ids.filter((id) => accounted2.has(id));
        }
        const accounted = new Set(items.flatMap((workspace) => workspace.sessionIds));
        return ids.filter((id) => !accounted.has(id));
      }
      function archivedSessionIdsInGroups(groups) {
        return [...new Set(groups.flatMap((group) => group.sessions.map((session) => session.id)))];
      }
      function pruneArchivedSelection(selectedSessionIds, archivedSessionIds) {
        const archived = new Set(archivedSessionIds);
        return [...new Set(selectedSessionIds)].filter((id) => archived.has(id));
      }
      function toggleArchivedSelection(selectedSessionIds, sessionIds, checked) {
        const selected = new Set(selectedSessionIds);
        for (const sessionId of sessionIds) {
          if (checked) selected.add(sessionId);
          else selected.delete(sessionId);
        }
        return [...selected];
      }
      function archivedDeleteFeedback(result, t) {
        const deleted = result.deletedSessionIds.length;
        const skipped = result.skippedSessionIds.length;
        if (result.failures.length > 0) return {
          kind: "error",
          message: t("archives.deletePartial", { deleted, skipped, failed: result.failures.length, detail: result.failures[0].message })
        };
        if (skipped > 0 && deleted > 0) return {
          kind: "notice",
          message: t("archives.deleteSuccessWithSkipped", { deleted, skipped })
        };
        if (skipped > 0) return {
          kind: "notice",
          message: t("archives.deleteSkipped", { n: skipped })
        };
        return { kind: "notice", message: t("archives.deleteSuccess", { n: deleted }) };
      }
      function deriveArchivedGroups(byId, items, archivedSessionIds, ungroupedLabel) {
        const byWorkspace = items.map((workspace) => ({
          key: workspace.workspaceId,
          title: workspace.title,
          ids: new Set(workspace.sessionIds),
          sessions: []
        }));
        const ungrouped = [];
        for (const id of archivedSessionIds) {
          const session = byId[id];
          if (session === void 0 || session.origin === "subagent") continue;
          const group = byWorkspace.find((workspace) => workspace.ids.has(id));
          (group === void 0 ? ungrouped : group.sessions).push(session);
        }
        const result = byWorkspace.filter((group) => group.sessions.length > 0);
        if (ungrouped.length > 0) result.push({ key: ARCHIVE_UNGROUPED_KEY, title: ungroupedLabel, sessions: ungrouped });
        return result;
      }
      function sortArchivedGroups(groups, sortBy, createdAtById, t) {
        const compareText = (left, right) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
        const timestampOf = (session) => {
          const value = sortBy === "created" ? createdAtById[session.id] : session.updatedAt;
          return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
        };
        const compareSessions = (left, right) => {
          if (sortBy !== "alphabetical") {
            const byTime = timestampOf(right) - timestampOf(left);
            if (Number.isFinite(byTime) && byTime !== 0) return byTime;
          }
          return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
        };
        const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
        return result.sort((left, right) => {
          if (sortBy !== "alphabetical") {
            const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
            if (Number.isFinite(byTime) && byTime !== 0) return byTime;
          }
          return compareText(left.title, right.title) || compareText(left.key, right.key);
        });
      }
      function ArchivedSessionsSection({ sessionStore, workspaceStore, unarchiveSession, deleteSession, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, t }) {
        const sessions = (0, react.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
        const workspaceState = (0, react.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
        const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
        const [busy, setBusy] = (0, react.useState)(false);
        const [error, setError] = (0, react.useState)(null);
        const [notice, setNotice] = (0, react.useState)(null);
        const [query, setQuery] = (0, react.useState)("");
        const [project, setProject] = (0, react.useState)("all");
        const [sortBy, setSortBy] = (0, react.useState)("updated");
        const [createdAtById, setCreatedAtById] = (0, react.useState)({});
        const [unarchivingSessionIds, setUnarchivingSessionIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
        const unarchivingSessionIdsRef = (0, react.useRef)(/* @__PURE__ */ new Set());
        const [selectedSessionIds, setSelectedSessionIds] = (0, react.useState)([]);
        const groups = (0, react.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, workspaceState.archivedSessionIds, t("group.ungrouped")), [sessions.byId, workspaceState, t]);
        const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t), [groups, sortBy, createdAtById, t]);
        (0, react.useEffect)(() => {
          let cancelled = false;
          archivedSessionMetadata().then((result) => {
            if (cancelled) return;
            setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
          }).catch(() => {
            if (!cancelled) setCreatedAtById({});
          });
          return () => {
            cancelled = true;
          };
        }, [archivedSessionMetadata, workspaceState.archivedSessionIds]);
        (0, react.useEffect)(() => {
          if (project === "all") return;
          if (groups.some((group) => group.key === project)) return;
          setProject("all");
        }, [groups, project]);
        const filteredGroups = (0, react.useMemo)(() => {
          const normalizedQuery = query.trim().toLocaleLowerCase();
          return sortedGroups.filter((group) => project === "all" || project === group.key).map((group) => ({
            ...group,
            sessions: group.sessions.filter((session) => normalizedQuery === "" || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery))
          })).filter((group) => group.sessions.length > 0);
        }, [sortedGroups, project, query, t]);
        const visibleSessionIds = (0, react.useMemo)(() => archivedSessionIdsInGroups(filteredGroups), [filteredGroups]);
        const selectedSessionIdSet = (0, react.useMemo)(() => new Set(selectedSessionIds), [selectedSessionIds]);
        const selectedVisibleCount = visibleSessionIds.filter((sessionId) => selectedSessionIdSet.has(sessionId)).length;
        const allVisibleSelected = visibleSessionIds.length > 0 && selectedVisibleCount === visibleSessionIds.length;
        const allBatchTarget = { scope: "all" };
        const allBatchSessionIds = (0, react.useMemo)(() => deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, allBatchTarget), [workspaceState.archivedSessionIds, workspaceState.items]);
        (0, react.useEffect)(() => {
          setSelectedSessionIds((current) => pruneArchivedSelection(current, workspaceState.archivedSessionIds));
        }, [workspaceState.archivedSessionIds]);
        const toggleSessionSelection = (sessionId, checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, [sessionId], checked));
        };
        const toggleVisibleSelection = (checked) => {
          setSelectedSessionIds((current) => toggleArchivedSelection(current, visibleSessionIds, checked));
        };
        const onUnarchive = (sessionId) => {
          if (busy || unarchivingSessionIdsRef.current.has(sessionId)) return;
          unarchivingSessionIdsRef.current.add(sessionId);
          setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          setError(null);
          setNotice(null);
          unarchiveSession(sessionId).catch((reason) => {
            setError(formatUnarchiveError(reason, t));
          }).finally(() => {
            unarchivingSessionIdsRef.current.delete(sessionId);
            setUnarchivingSessionIds(new Set(unarchivingSessionIdsRef.current));
          });
        };
        const onBatchUnarchive = async (target) => {
          if (busy) return;
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            const result = await unarchiveSessions(target);
            setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
            return result;
          } catch (reason) {
            setError(t("archives.restoreBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
          } finally {
            setBusy(false);
          }
        };
        const onSelectedUnarchive = async () => {
          if (selectedSessionIds.length === 0) return;
          const result = await onBatchUnarchive({ scope: "sessions", sessionIds: selectedSessionIds });
          if (result !== void 0) {
            const restored = new Set(result.unarchivedSessionIds);
            setSelectedSessionIds((current) => current.filter((sessionId) => !restored.has(sessionId)));
          }
        };
        const closeDelete = () => {
          if (!busy) setDeleteTarget(null);
        };
        (0, react.useEffect)(() => {
          if (deleteTarget === null) return;
          const onKeyDown = (event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
            if (!busy) setDeleteTarget(null);
          };
          window.addEventListener("keydown", onKeyDown, true);
          return () => window.removeEventListener("keydown", onKeyDown, true);
        }, [deleteTarget, busy]);
        const confirmDelete = async () => {
          if (busy || deleteTarget === null) return;
          setBusy(true);
          setError(null);
          setNotice(null);
          try {
            if (deleteTarget.kind === "batch") {
              const result = await deleteArchivedSessions(deleteTarget.target);
              const feedback = archivedDeleteFeedback(result, t);
              if (feedback.kind === "error") setError(feedback.message);
              else setNotice(feedback.message);
              if (deleteTarget.target.scope === "sessions") {
                const completed = /* @__PURE__ */ new Set([...result.deletedSessionIds, ...result.skippedSessionIds]);
                setSelectedSessionIds((current) => current.filter((sessionId) => !completed.has(sessionId)));
              }
            } else {
              await deleteSession(deleteTarget.session.id);
            }
            setDeleteTarget(null);
          } catch (reason) {
            setError(formatDeleteError(reason, t));
          } finally {
            setBusy(false);
          }
        };
        const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
        const deleteDialogTitle = batchScope === "all" ? t("archives.deleteAllTitle") : batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget.title }) : batchScope === "sessions" ? t("archives.deleteSelectedTitle") : t("deleteSession.title");
        const deleteDialogDescription = deleteTarget === null ? void 0 : batchScope === "all" ? t("archives.deleteAllDesc", { n: deleteTarget.count }) : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.count }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget.title, n: deleteTarget.count }) : batchScope === "sessions" ? t("archives.deleteSelectedDesc", { n: deleteTarget.count }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.session, t) });
        const deleteConfirmLabel = batchScope === "all" ? t("archives.deleteAll") : batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : batchScope === "sessions" ? t("archives.deleteSelectedConfirm") : t("deleteSession.title");
        return (0, react_jsx_runtime.jsxs)("section", {
          className: "dsham_settings",
          "aria-label": t("archives.title"),
          children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS }), (0, react_jsx_runtime.jsxs)("header", { className: "dsham_settingsHeader", children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsTitleRow", children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsLinks", children: [(0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager", target: "_blank", rel: "noreferrer", "aria-label": t("archives.viewProject"), children: [(0, react_jsx_runtime.jsx)(GithubMark16, {}), t("archives.viewProject")] }), (0, react_jsx_runtime.jsxs)("a", { className: "dsham_settingsExternalLink", href: "https://github.com/MichengAI/dsh-archive-manager/issues", target: "_blank", rel: "noreferrer", "aria-label": t("archives.feedback"), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {}), t("archives.feedback")] })] })] }), (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsIntro", children: t("archives.description") })] }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsHeaderActions", children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsRestoreAll", disabled: busy || allBatchSessionIds.length === 0, onClick: () => onBatchUnarchive(allBatchTarget), children: t("archives.restoreAll") }), (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dsham_settingsDanger", disabled: busy || allBatchSessionIds.length === 0, onClick: () => setDeleteTarget({ kind: "batch", target: allBatchTarget, title: t("archives.allProjects"), count: allBatchSessionIds.length }), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}), t("archives.deleteAll")] })] })] }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsToolbar", children: [(0, react_jsx_runtime.jsxs)("label", { className: "dsham_settingsSearch", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {}), (0, react_jsx_runtime.jsx)("input", { type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("archives.searchPlaceholder"), "aria-label": t("archives.searchPlaceholder") })] }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }], onChange: setSortBy, "aria-label": t("archives.sortBy") }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-project-filter", value: project, options: [{ value: "all", label: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") })] }), groups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t("archives.empty") }) : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
            const target = archivedBatchTargetForGroup(group.key);
            const count = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length;
            return (0, react_jsx_runtime.jsxs)("section", {
              className: "dsham_settingsGroup",
              children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupHeading", children: [(0, react_jsx_runtime.jsxs)("h3", { className: "dsham_settingsGroupTitle", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), group.title] }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsCount", children: t("archives.sessionCount", { n: count }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), t })] })] }), (0, react_jsx_runtime.jsx)("div", {
                className: "dsham_settingsList",
                children: group.sessions.map((session) => (0, react_jsx_runtime.jsxs)("article", {
                  className: "dsham_settingsRow",
                  children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsContent", children: [(0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsTitle", children: displayTitle(session, t) }), (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsMeta", children: archiveTimeLabel(session.updatedAt, t) })] }), (0, react_jsx_runtime.jsxs)("div", {
                    className: "dsham_settingsActions",
                    children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsAction", disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => onUnarchive(session.id), children: t("menu.unarchive") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsDelete", disabled: busy || unarchivingSessionIds.has(session.id), "aria-label": t("menu.deleteSession"), onClick: () => setDeleteTarget({ kind: "session", session }), children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}) })]
                  })]
                }, session.id))
              })]
            }, group.key);
          }), error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
            open: deleteTarget !== null,
            onClose: closeDelete,
            closeLabel: t("close"),
            title: deleteDialogTitle,
            ...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
            footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: closeDelete, children: t("cancel") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", className: "dsham_settingsDeleteConfirm", disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
            children: busy && (0, react_jsx_runtime.jsx)("div", { role: "status", children: deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending") })
          })]
        });
      }
      const zh = {
        "group.ungrouped": "\u672A\u5206\u7EC4",
        "session.new": "\u65B0\u4F1A\u8BDD",
        "section.workspaces": "\u5DE5\u4F5C\u533A",
        "section.sessions": "\u4F1A\u8BDD",
        "viewOptions.label": "\u89C6\u56FE\u9009\u9879",
        "groupBy.label": "\u5206\u7EC4\u65B9\u5F0F",
        "groupBy.workspace": "\u6309\u5DE5\u4F5C\u533A",
        "groupBy.flat": "\u5355\u5217\u8868",
        "orderBy.label": "\u6392\u5E8F\u65B9\u5F0F",
        "orderBy.manual": "\u624B\u52A8\u6392\u5E8F",
        "orderBy.updated": "\u6700\u8FD1\u66F4\u65B0",
        "sessions.expand": "\u5C55\u5F00\u5176\u4F59 {n} \u4E2A\u4F1A\u8BDD",
        "sessions.collapse": "\u6536\u8D77",
        "empty.none": "\u6682\u65E0\u4F1A\u8BDD",
        "empty.noMatches": "\u65E0\u5339\u914D\u7ED3\u679C",
        "workspace.add": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
        "search.sessions.aria": "\u641C\u7D22\u4F1A\u8BDD",
        "search.placeholder": "\u641C\u7D22\u4F1A\u8BDD\u2026",
        "search.clear": "\u6E05\u9664\u641C\u7D22",
        "search.results.aria": "\u641C\u7D22\u7ED3\u679C",
        "search.pending": "\u6B63\u5728\u641C\u7D22\u4F1A\u8BDD\u5386\u53F2\u2026",
        "search.unavailable": "\u5185\u5BB9\u641C\u7D22\u6682\u4E0D\u53EF\u7528\uFF0C\u4EC5\u663E\u793A\u540D\u79F0\u5339\u914D\u3002",
        "search.noMatches": "\u65E0\u5339\u914D\u4F1A\u8BDD",
        "search.hasMore": "\u4EC5\u663E\u793A\u524D {n} \u6761\u7ED3\u679C\uFF0C\u8BF7\u7F29\u5C0F\u641C\u7D22\u8303\u56F4\u3002",
        "menu.addWorkspace": "\u6DFB\u52A0\u5DE5\u4F5C\u533A\u2026",
        "menu.unarchive": "\u53D6\u6D88\u5F52\u6863",
        "menu.deleteSession": "\u5220\u9664\u4F1A\u8BDD",
        "archived.badge": "\u5DF2\u5F52\u6863",
        "archived.notOpenable": "\u5DF2\u5F52\u6863\uFF0C\u53D6\u6D88\u5F52\u6863\u540E\u53EF\u7EE7\u7EED\u5BF9\u8BDD",
        "archives.title": "\u5DF2\u5F52\u6863\u7684\u804A\u5929",
        "archives.description": "\u7BA1\u7406\u5DF2\u5F52\u6863\u7684\u4F1A\u8BDD\u3002",
        "archives.viewProject": "GitHub",
        "archives.feedback": "\u95EE\u9898\u53CD\u9988",
        "archives.empty": "\u6682\u65E0\u5DF2\u5F52\u6863\u4F1A\u8BDD",
        "archives.emptyFiltered": "\u6CA1\u6709\u5339\u914D\u7684\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.searchPlaceholder": "\u641C\u7D22\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.sortBy": "\u6392\u5E8F\u65B9\u5F0F",
        "archives.sortUpdated": "\u66F4\u65B0\u65F6\u95F4",
        "archives.sortCreated": "\u521B\u5EFA\u65F6\u95F4",
        "archives.sortAlphabetical": "\u6309\u5B57\u6BCD\u987A\u5E8F",
        "archives.projectFilter": "\u6309\u9879\u76EE\u7B5B\u9009",
        "archives.allProjects": "\u6240\u6709\u9879\u76EE",
        "archives.sessionCount": "{n} \u4E2A\u804A\u5929",
        "archives.selectAllFiltered": "\u5168\u9009\u5F53\u524D\u7B5B\u9009\u7ED3\u679C",
        "archives.selectSession": "\u9009\u62E9\u4F1A\u8BDD\u201C{name}\u201D",
        "archives.selectedCount": "\u5DF2\u9009 {n} \u4E2A",
        "archives.restoreSelected": "\u6062\u590D\u6240\u9009",
        "archives.deleteSelected": "\u5220\u9664\u6240\u9009",
        "archives.timestamp": "{date}\uFF0C{time}",
        "archives.restoreAll": "\u5168\u90E8\u6062\u590D",
        "archives.restoreProject": "\u6062\u590D\u8BE5\u9879\u76EE\u7684\u5168\u90E8\u804A\u5929",
        "archives.restoreUngrouped": "\u5168\u90E8\u6062\u590D",
        "archives.deleteProject": "\u5220\u9664\u8BE5\u9879\u76EE\u7684\u5168\u90E8\u804A\u5929",
        "archives.deleteUngrouped": "\u5168\u90E8\u5220\u9664",
        "archives.projectActions": "\u9879\u76EE\u201C{name}\u201D\u7684\u5F52\u6863\u64CD\u4F5C",
        "archives.ungroupedActions": "\u672A\u5206\u7EC4\u804A\u5929\u7684\u5F52\u6863\u64CD\u4F5C",
        "archives.restoreSuccess": "\u5DF2\u6062\u590D {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
        "archives.restoreBatchFailed": "\u6279\u91CF\u6062\u590D\u5931\u8D25\uFF1A{detail}",
        "archives.deleteAll": "\u5168\u90E8\u5220\u9664",
        "archives.deleteAllTitle": "\u5220\u9664\u5168\u90E8\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteAllDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u5168\u90E8 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u8BB0\u5F55\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteSelectedTitle": "\u5220\u9664\u6240\u9009\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteSelectedDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u6240\u9009\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u8BB0\u5F55\u3002\u5176\u4ED6\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteSelectedConfirm": "\u5220\u9664\u6240\u9009\u804A\u5929",
        "archives.deleteAllPending": "\u6B63\u5728\u5220\u9664\u5DF2\u5F52\u6863\u804A\u5929\u2026",
        "archives.deleteProjectTitle": "\u5220\u9664\u201C{name}\u201D\u4E2D\u7684\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteProjectDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u201C{name}\u201D\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u9879\u76EE\u76EE\u5F55\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteProjectConfirm": "\u5220\u9664\u8BE5\u9879\u76EE\u7684\u5168\u90E8\u804A\u5929",
        "archives.deleteUngroupedTitle": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5DF2\u5F52\u6863\u804A\u5929",
        "archives.deleteUngroupedDesc": "\u5C06\u6C38\u4E45\u5220\u9664\u672A\u5206\u7EC4\u4E2D\u7684 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u53CA\u5176\u5B50\u4EE3\u7406\u548C\u8BB0\u5F55\u3002\u5176\u4ED6\u9879\u76EE\u548C\u672A\u5F52\u6863\u804A\u5929\u4E0D\u4F1A\u53D7\u5F71\u54CD\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "archives.deleteUngroupedConfirm": "\u5220\u9664\u672A\u5206\u7EC4\u7684\u5168\u90E8\u804A\u5929",
        "archives.deleteBatchPending": "\u6B63\u5728\u5220\u9664\u5DF2\u5F52\u6863\u804A\u5929\u2026",
        "archives.deleteSuccess": "\u5DF2\u5220\u9664 {n} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\u3002",
        "archives.deleteSuccessWithSkipped": "\u5DF2\u5220\u9664 {deleted} \u4E2A\u5DF2\u5F52\u6863\u804A\u5929\uFF1B\u53E6\u6E05\u7406 {skipped} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\u3002",
        "archives.deleteSkipped": "\u5DF2\u6E05\u7406 {n} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\u3002",
        "archives.deletePartial": "\u5DF2\u5220\u9664 {deleted} \u4E2A\u804A\u5929\uFF0C\u6E05\u7406 {skipped} \u4E2A\u5DF2\u4E0D\u5B58\u5728\u4F1A\u8BDD\u7684\u5F52\u6863\u8BB0\u5F55\uFF1B{failed} \u4E2A\u5220\u9664\u5931\u8D25\uFF1A{detail}",
        "archives.unarchiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u53D6\u6D88\u5F52\u6863\u3002",
        "archives.unarchiveFailed": "\u53D6\u6D88\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
        "archives.archiveUnknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5F52\u6863\u3002",
        "archives.archiveFailed": "\u5F52\u6863\u5931\u8D25\uFF1A{detail}",
        "archives.forkFailed": "\u5206\u53C9\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
        "deleteSession.title": "\u5220\u9664\u4F1A\u8BDD",
        "deleteSession.desc": "\u5C06\u6C38\u4E45\u5220\u9664\u4F1A\u8BDD\u201C{name}\u201D\u53CA\u5176\u5B50\u4EE3\u7406\uFF08\u542B\u6B63\u5728\u8FD0\u884C\u7684\uFF09\u548C\u5168\u90E8\u8BB0\u5F55\uFF08\u5BF9\u8BDD\u5185\u5BB9\u3001\u7EDF\u8BA1\u3001\u7F13\u5B58\uFF09\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
        "deleteSession.pending": "\u6B63\u5728\u5220\u9664\u4F1A\u8BDD\u2026",
        "deleteSession.unknown": "\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664\u3002",
        "deleteSession.failed": "\u5220\u9664\u4F1A\u8BDD\u5931\u8D25\uFF1A{detail}",
        "picker.loading": "\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u533A\u2026",
        "conflict.named": "\u5DF2\u5B58\u5728\u540D\u4E3A\u201C{name}\u201D\u7684\u5DE5\u4F5C\u533A\u3002",
        "folderError.title": "\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6\u5939",
        "folderError.retry": "\u91CD\u65B0\u9009\u62E9",
        "rename": "\u91CD\u547D\u540D",
        "rename.workspace.title": "\u91CD\u547D\u540D\u5DE5\u4F5C\u533A",
        "rename.session.title": "\u91CD\u547D\u540D\u4F1A\u8BDD",
        "field.workspaceName": "\u5DE5\u4F5C\u533A\u540D\u79F0",
        "field.sessionName": "\u4F1A\u8BDD\u540D\u79F0",
        "delete.workspace": "\u5220\u9664\u5DE5\u4F5C\u533A",
        "delete.desc": "\u5C06\u628A\u201C{name}\u201D\u4ECE\u5DE5\u4F5C\u533A\u5217\u8868\u4E2D\u79FB\u9664\u3002\u6587\u4EF6\u5939\u4E0E\u4F1A\u8BDD\u8BB0\u5F55\u4F1A\u4FDD\u7559\uFF0C\u5176\u4F1A\u8BDD\u5C06\u663E\u793A\u5728\u201C\u672A\u5206\u7EC4\u201D\u4E0B\u3002",
        "delete.pending": "\u6B63\u5728\u5220\u9664\u5DE5\u4F5C\u533A\u2026",
        "menu.fork": "\u5206\u53C9\u4F1A\u8BDD",
        "menu.archiveSession": "\u5F52\u6863\u4F1A\u8BDD",
        "menu.archiveWorkspace": "\u5F52\u6863\u5168\u90E8\u804A\u5929",
        "archiveWorkspace.title": "\u5F52\u6863 {n} \u4E2A\u804A\u5929\uFF1F",
        "archiveWorkspace.desc": "\u8FD9\u4F1A\u5C06\u201C{name}\u201D\u4E2D\u7684\u804A\u5929\u5F52\u6863\u3002\u4E4B\u540E\u4F60\u53EF\u4EE5\u5728\u5DF2\u5F52\u6863\u7684\u804A\u5929\u4E2D\u627E\u5230\u5B83\u4EEC\u3002",
        "archiveWorkspace.confirm": "\u5168\u90E8\u5F52\u6863",
        "archiveWorkspace.pending": "\u6B63\u5728\u5F52\u6863\u804A\u5929\u2026",
        "sessions.count.one": "{n} \u4E2A\u4F1A\u8BDD",
        "sessions.count.other": "{n} \u4E2A\u4F1A\u8BDD",
        "actions.workspace.aria": "\u5DE5\u4F5C\u533A\u201C{name}\u201D\u7684\u64CD\u4F5C",
        "actions.session.aria": "\u4F1A\u8BDD\u201C{name}\u201D\u7684\u64CD\u4F5C",
        "actions.newSession.aria": "\u5728\u201C{name}\u201D\u4E2D\u65B0\u5EFA\u4F1A\u8BDD",
        "status.running": "\u8FDB\u884C\u4E2D",
        "status.subagentsRunning.one": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
        "status.subagentsRunning.other": "{n} \u4E2A\u5B50\u4EE3\u7406\u8FD0\u884C\u4E2D",
        "status.idle": "\u7A7A\u95F2",
        "status.waitingApproval": "\u7B49\u5F85\u5BA1\u6279",
        "status.planReview": "\u8BA1\u5212\u5F85\u5BA1",
        "status.waitingAnswer": "\u7B49\u5F85\u56DE\u7B54",
        "status.completed": "\u5DF2\u5B8C\u6210",
        "hover.created": "\u521B\u5EFA\u4E8E {time}",
        "hover.copied": "\u5DF2\u590D\u5236",
        "date.ymd": "{y}\u5E74{m}\u6708{d}\u65E5",
        "time.now": "\u521A\u521A",
        "time.minutes": "{n}\u5206\u949F",
        "time.hours": "{n}\u5C0F\u65F6",
        "time.days": "{n}\u5929",
        "time.months": "{n}\u4E2A\u6708",
        "time.years": "{n}\u5E74",
        "time.ago": "{t}\u524D"
      };
      const en = {
        "group.ungrouped": "Ungrouped",
        "session.new": "New Session",
        "section.workspaces": "Workspaces",
        "section.sessions": "Sessions",
        "viewOptions.label": "View options",
        "groupBy.label": "Group by",
        "groupBy.workspace": "Workspace",
        "groupBy.flat": "In one list",
        "orderBy.label": "Order by",
        "orderBy.manual": "Manual",
        "orderBy.updated": "Last updated",
        "sessions.expand": "Show {n} more sessions",
        "sessions.collapse": "Show less",
        "empty.none": "No sessions yet",
        "empty.noMatches": "No matches",
        "workspace.add": "Add workspace",
        "search.sessions.aria": "Search sessions",
        "search.placeholder": "Search sessions...",
        "search.clear": "Clear search",
        "search.results.aria": "Search results",
        "search.pending": "Searching session history\u2026",
        "search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
        "search.noMatches": "No matching sessions",
        "search.hasMore": "Showing the first {n} results. Narrow your search.",
        "menu.addWorkspace": "Add workspace\u2026",
        "menu.unarchive": "Unarchive",
        "menu.deleteSession": "Delete session",
        "archived.badge": "Archived",
        "archived.notOpenable": "This session is archived. Unarchive it to continue the conversation.",
        "archives.title": "Archived chats",
        "archives.description": "Manage archived sessions.",
        "archives.viewProject": "GitHub",
        "archives.feedback": "Issues",
        "archives.empty": "No archived sessions.",
        "archives.emptyFiltered": "No archived chats match your filters.",
        "archives.searchPlaceholder": "Search archived chats",
        "archives.sortBy": "Sort archived chats",
        "archives.sortUpdated": "Last updated",
        "archives.sortCreated": "Created",
        "archives.sortAlphabetical": "Alphabetical",
        "archives.projectFilter": "Filter by project",
        "archives.allProjects": "All projects",
        "archives.sessionCount": "{n} chats",
        "archives.selectAllFiltered": "Select all results",
        "archives.selectSession": "Select chat {name}",
        "archives.selectedCount": "{n} selected",
        "archives.restoreSelected": "Restore selected",
        "archives.deleteSelected": "Delete selected",
        "archives.timestamp": "{date}, {time}",
        "archives.restoreAll": "Restore all",
        "archives.restoreProject": "Restore all chats in this project",
        "archives.restoreUngrouped": "Restore all",
        "archives.deleteProject": "Delete all chats in this project",
        "archives.deleteUngrouped": "Delete all",
        "archives.projectActions": "Archive actions for project {name}",
        "archives.ungroupedActions": "Archive actions for ungrouped chats",
        "archives.restoreSuccess": "Restored {n} archived chats.",
        "archives.restoreBatchFailed": "Could not restore the archived chats: {detail}",
        "archives.deleteAll": "Delete all",
        "archives.deleteAllTitle": "Delete all archived chats",
        "archives.deleteAllDesc": "This permanently deletes all {n} archived chats, their child agents (including any that are still running), and their records. This cannot be undone.",
        "archives.deleteSelectedTitle": "Delete selected archived chats",
        "archives.deleteSelectedDesc": "This permanently deletes the selected {n} archived chats, their child agents (including any that are still running), and their records. Other chats are not affected. This cannot be undone.",
        "archives.deleteSelectedConfirm": "Delete selected chats",
        "archives.deleteAllPending": "Deleting archived chats\u2026",
        "archives.deleteProjectTitle": "Delete archived chats in {name}",
        "archives.deleteProjectDesc": "This permanently deletes the {n} archived chats in {name}, their child agents, and their records. The project directory and unarchived chats are not affected. This cannot be undone.",
        "archives.deleteProjectConfirm": "Delete all project chats",
        "archives.deleteUngroupedTitle": "Delete ungrouped archived chats",
        "archives.deleteUngroupedDesc": "This permanently deletes the {n} ungrouped archived chats, their child agents, and their records. Other projects and unarchived chats are not affected. This cannot be undone.",
        "archives.deleteUngroupedConfirm": "Delete all ungrouped chats",
        "archives.deleteBatchPending": "Deleting archived chats\u2026",
        "archives.deleteSuccess": "Deleted {n} archived chats.",
        "archives.deleteSuccessWithSkipped": "Deleted {deleted} archived chats and cleared {skipped} stale archive entries for sessions that no longer exist.",
        "archives.deleteSkipped": "Cleared {n} stale archive entries for sessions that no longer exist.",
        "archives.deletePartial": "Deleted {deleted} chats and cleared {skipped} stale archive entries; {failed} could not be deleted: {detail}",
        "archives.unarchiveUnknown": "This session no longer exists, so it cannot be unarchived.",
        "archives.unarchiveFailed": "Could not unarchive the session: {detail}",
        "archives.archiveUnknown": "This session no longer exists, so it cannot be archived.",
        "archives.archiveFailed": "Could not archive the session: {detail}",
        "archives.forkFailed": "Could not fork the session: {detail}",
        "deleteSession.title": "Delete session",
        "deleteSession.desc": "This permanently deletes session \u201C{name}\u201D, its child agents (including any that are still running), and all of its records (conversation, stats, cache). This cannot be undone.",
        "deleteSession.pending": "Deleting session\u2026",
        "deleteSession.unknown": "This session no longer exists or was already deleted.",
        "deleteSession.failed": "Could not delete the session: {detail}",
        "picker.loading": "Loading workspaces\u2026",
        "conflict.named": "A workspace named \u201C{name}\u201D already exists.",
        "folderError.title": "Couldn\u2019t open folder",
        "folderError.retry": "Choose again",
        "rename": "Rename",
        "rename.workspace.title": "Rename workspace",
        "rename.session.title": "Rename session",
        "field.workspaceName": "Workspace name",
        "field.sessionName": "Session name",
        "delete.workspace": "Delete workspace",
        "delete.desc": "This removes \u201C{name}\u201D from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
        "delete.pending": "Deleting workspace\u2026",
        "menu.fork": "Fork session",
        "menu.archiveSession": "Archive session",
        "menu.archiveWorkspace": "Archive all chats",
        "archiveWorkspace.title": "Archive {n} chats?",
        "archiveWorkspace.desc": "This archives the chats in \u201C{name}\u201D. You can find them later in Archived chats.",
        "archiveWorkspace.confirm": "Archive all",
        "archiveWorkspace.pending": "Archiving chats\u2026",
        "sessions.count.one": "{n} session",
        "sessions.count.other": "{n} sessions",
        "actions.workspace.aria": "Workspace actions for {name}",
        "actions.session.aria": "Session actions for {name}",
        "actions.newSession.aria": "New session in {name}",
        "status.running": "Running",
        "status.subagentsRunning.one": "{n} subagent running",
        "status.subagentsRunning.other": "{n} subagents running",
        "status.idle": "Idle",
        "status.waitingApproval": "Waiting for approval",
        "status.planReview": "Plan awaiting review",
        "status.waitingAnswer": "Waiting for answer",
        "status.completed": "Completed",
        "hover.created": "Created {time}",
        "hover.copied": "Copied",
        "date.ymd": "{y}-{m}-{d}",
        "time.now": "now",
        "time.minutes": "{n}min",
        "time.hours": "{n}h",
        "time.days": "{n}d",
        "time.months": "{n}mo",
        "time.years": "{n}y",
        "time.ago": "{t} ago"
      };
      const NS = "workspace";
      const inject = [
        "slots",
        "sessions",
        "workspaces",
        "locale",
        "remote",
        "typert"
      ];
      function bindObservable(source) {
        return {
          getSnapshot: source.getSnapshot.bind(source),
          subscribe: source.subscribe.bind(source)
        };
      }
      class DirectoryBrowseError extends Error {
        constructor(rpcError) {
          super(`directory browse failed: ${rpcError.code}: ${rpcError.message}`);
          this.name = "DirectoryBrowseError";
          this.rpcError = rpcError;
        }
      }
      function provideUiWorkspace(ctx) {
        if (ctx.get("uiWorkspace") !== void 0) return () => {
        };
        const sessions = ctx.sessions;
        const workspaces = ctx.workspaces;
        const connecting = /* @__PURE__ */ new Map();
        const recentWorkspace = () => {
          const workspaceState = workspaces.list.getSnapshot();
          const sessionState = sessions.list.getSnapshot();
          let selected;
          let selectedTime = Number.NEGATIVE_INFINITY;
          for (const workspace of workspaceState.items ?? []) {
            let latest = Number.NEGATIVE_INFINITY;
            for (const sessionId of workspace.sessionIds) {
              const session = sessionState.byId[sessionId];
              if (session !== void 0) latest = Math.max(latest, session.updatedAt);
            }
            if (latest === Number.NEGATIVE_INFINITY) latest = Date.parse(workspace.createdAt);
            if (selected === void 0 || latest > selectedTime) {
              selected = workspace.workspaceId;
              selectedTime = latest;
            }
          }
          return selected;
        };
        const directoryPicker = () => ctx.get("remote.directoryPicker") ?? ctx.get("remote")?.directoryPicker;
        const service = {
          connectWorkspace(workspaceId) {
            const workspaceState = workspaces.list.getSnapshot();
            const workspace = (workspaceState.items ?? []).find((item) => item.workspaceId === workspaceId);
            if (workspace === void 0) return Promise.reject(new Error(`uiWorkspace.connectWorkspace: unknown workspace ${workspaceId}`));
            const inflight = connecting.get(workspaceId);
            if (inflight !== void 0) return inflight;
            const sessionState = sessions.list.getSnapshot();
            const archived = new Set(workspaceState.archivedSessionIds ?? []);
            for (const id of sessionState.ids) {
              const summary = sessionState.byId[id];
              if (summary !== void 0 && summary.blank && summary.cwd === workspace.path && workspace.sessionIds.includes(summary.id) && !archived.has(summary.id)) return Promise.resolve(summary.id);
            }
            const attempt = sessions.create({ workspaceId }).finally(() => {
              connecting.delete(workspaceId);
            });
            connecting.set(workspaceId, attempt);
            return attempt;
          },
          startSession(workspaceId) {
            const workspaceState = workspaces.list.getSnapshot();
            const sessionState = sessions.list.getSnapshot();
            const currentWorkspaceId = sessionState.current === void 0 ? void 0 : (workspaceState.items ?? []).find((item) => item.sessionIds.includes(sessionState.current))?.workspaceId;
            const recent = workspaceState.phase === "ready" && sessionState.phase === "ready" ? recentWorkspace() : void 0;
            const target = workspaceId ?? currentWorkspaceId ?? recent;
            if (target === void 0) {
              sessions.clear();
              return;
            }
            void service.connectWorkspace(target).then((sessionId) => {
              sessions.open(sessionId);
            }, (reason) => {
              console.warn("new session failed:", reason);
            });
          },
          archiveSession(sessionId) {
            return workspaces.archiveSession(sessionId);
          },
          async pickDirectory() {
            const picker = directoryPicker();
            if (picker === void 0) throw new Error("directory picker is unavailable");
            const result = await picker.pick();
            if (!result.ok) throw new Error(`directory picker failed: ${result.error.message}`);
            return result.value;
          },
          async listDirectory(path, signal) {
            const picker = directoryPicker();
            if (picker === void 0) throw new Error("directory picker is unavailable");
            const result = await picker.list(path, signal);
            if (!result.ok) throw new DirectoryBrowseError(result.error);
            return result.value;
          },
          async createDirectory(path, name) {
            const picker = directoryPicker();
            if (picker === void 0) throw new Error("directory picker is unavailable");
            const result = await picker.createDirectory(path, name);
            if (!result.ok) throw new DirectoryBrowseError(result.error);
            return result.value;
          }
        };
        const dispose = ctx.provide("uiWorkspace", service);
        ctx.slots.provideRoot?.({ hooks: { workspaces: workspaces.list } });
        ctx.effect(() => {
          let initial = "waiting";
          let disposed = false;
          const reconcile = () => {
            if (disposed) return;
            const workspaceState = workspaces.list.getSnapshot();
            const sessionState = sessions.list.getSnapshot();
            if (sessionState.current !== void 0 && (workspaceState.archivedSessionIds ?? []).includes(sessionState.current)) {
              sessions.clear();
              return;
            }
            if (initial !== "waiting" || workspaceState.phase !== "ready" || sessionState.phase !== "ready") return;
            if (sessionState.current !== void 0) {
              initial = "done";
              return;
            }
            const target = recentWorkspace();
            if (target === void 0) {
              initial = "done";
              return;
            }
            initial = "connecting";
            void service.connectWorkspace(target).then((sessionId) => {
              if (disposed) return;
              if (sessions.list.getSnapshot().current === void 0) sessions.open(sessionId);
              initial = "done";
            }, (reason) => {
              if (disposed) return;
              initial = "waiting";
              console.warn("initial workspace selection failed:", reason);
            });
          };
          const disposeWorkspaces = workspaces.list.subscribe(reconcile);
          const disposeSessions = sessions.list.subscribe(reconcile);
          reconcile();
          return () => {
            disposed = true;
            disposeSessions();
            disposeWorkspaces();
          };
        }, "dsh-archive-manager: uiWorkspace navigation policy");
        return dispose;
      }
      async function archiveWorkspaceSessionsAndRefresh(registry, workspaceId, refresh) {
        const result = await registry.archiveWorkspaceSessions(workspaceId);
        if (!result.ok) throw new Error(result.error.message);
        await refresh();
        return result.value;
      }
      async function apply(ctx) {
        const remote = ctx.get("remote");
        let disposeRemote = () => {
        };
        if (remote !== void 0) disposeRemote = await remote.$mount(ARCHIVE_MANAGER_REMOTE);
        const disposeUiWorkspace = hasSplitClientStore ? provideUiWorkspace(ctx) : () => {
        };
        applyWorkspaceBrowser(ctx);
        return async () => {
          disposeUiWorkspace();
          await disposeRemote();
        };
      }
      function applyWorkspaceBrowser(ctx) {
        ctx.effect(() => ctx.locale.register(NS, {
          zh,
          en
        }), "dsh-archive-manager: dictionaries");
        const uiWorkspaceAt = () => ctx.get("uiWorkspace");
        const searchSessions = async (query, signal) => {
          const result = await ctx.sessions.search(query, signal);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
        const flowSource = (hole) => ({
          getSnapshot: () => ctx.slots.entries(hole).length > 0,
          subscribe: (listener) => ctx.slots.subscribe(hole, listener)
        });
        const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
        const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
        const refreshSessionList = async () => {
          if (typeof ctx.sessions.refresh !== "function") return;
          try {
            await ctx.sessions.refresh();
          } catch (error) {
            console.warn("archive-manager: restored archived sessions but session list refresh failed:", error);
          }
        };
        const unarchiveSession = async (sessionId) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.unarchiveSession(sessionId);
          if (!result.ok) throw new Error(result.error.message);
          await refreshSessionList();
        };
        const archiveWorkspaceSessions = async (workspaceId) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          return archiveWorkspaceSessionsAndRefresh(registry, workspaceId, refreshSessionList);
        };
        const deleteSession = async (sessionId) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.deleteSession(sessionId);
          if (!result.ok) throw new Error(result.error.message);
        };
        const unarchiveSessions = async (target) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.unarchiveSessions(target);
          if (!result.ok) throw new Error(result.error.message);
          await refreshSessionList();
          return result.value;
        };
        const deleteArchivedSessions = async (target) => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.deleteArchivedSessions(target);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        };
        const archivedSessionMetadata = async () => {
          const registry = ctx.get("remote.workspaceRegistry");
          if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
          const result = await registry.archivedSessionMetadata();
          if (!result.ok) throw new Error(result.error.message);
          if (result.value.repairedSessionIds?.length > 0 && typeof ctx.sessions.refresh === "function") {
            try {
              await ctx.sessions.refresh();
            } catch (error) {
              console.warn("archive-manager: repaired archived projections but session list refresh failed:", error);
            }
          }
          return result.value;
        };
        const browserInjected = () => ({
          startSession: (workspaceId) => {
            const uiWorkspace = uiWorkspaceAt();
            if (uiWorkspace !== void 0) uiWorkspace.startSession(workspaceId);
            else ctx.workspaces.startSession(workspaceId);
          },
          open: (sessionId) => {
            ctx.sessions.open(sessionId);
          },
          searchSessions,
          searchResultLimit: ctx.sessions.searchResultLimit,
          renameSession: async (sessionId, title) => {
            const session = ctx.sessions.binding(sessionId)?.session;
            if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
            const result = await session.rename(title);
            if (!result.ok) throw new Error(result.error.message);
          },
          forkSession: (sessionId) => ctx.sessions.fork({
            sessionId,
            increaseTitle: true
          }).then((childId) => {
            ctx.sessions.open(childId);
          }),
          renameWorkspace: async (workspaceId, title) => {
            await ctx.workspaces.rename(workspaceId, title);
          },
          deleteWorkspace: async (workspaceId) => {
            await ctx.workspaces.delete(workspaceId);
          },
          insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
            await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
          },
          archiveSession: async (sessionId) => {
            await ctx.workspaces.archiveSession(sessionId);
          },
          archiveWorkspaceSessions,
          unarchiveSession,
          deleteSession,
          insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
            await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
          },
          createWorkspace: (input) => ctx.workspaces.create(input),
          hooks: { directoryFlow: browserFlowSource }
        });
        const pickerInjected = () => ({
          createWorkspace: (input) => ctx.workspaces.create(input),
          hooks: { directoryFlow: pickerFlowSource }
        });
        ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
          name: "sidebar.workspaces",
          children: { "sidebar.workspaces.directoryFlow": {
            kind: "single",
            scope: "root"
          } },
          store: createWorkspaceViewStore(),
          inject: browserInjected,
          locale: NS
        }, WorkspaceBrowser));
        ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
          name: "conversation.hero.workspace",
          children: { "conversation.hero.workspace.directoryFlow": {
            kind: "single",
            scope: "root"
          } },
          inject: pickerInjected,
          locale: NS
        }, WorkspacePicker));
        ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: "archived-sessions",
          order: 18,
          label: () => ctx.locale.bind(NS)("archived.badge"),
          icon: "archive",
          locale: NS,
          inject: () => ({
            sessionStore: bindObservable(ctx.sessions.list),
            workspaceStore: bindObservable(ctx.workspaces.list),
            unarchiveSession,
            deleteSession,
            unarchiveSessions,
            deleteArchivedSessions,
            archivedSessionMetadata,
            t: ctx.locale.bind(NS)
          })
        }, ArchivedSessionsSectionPrototype));
      }
      exports.__test = {
        displayTitle,
        sessionVisible,
        indexSubagentDescendants,
        isUnknownSessionError,
        deriveGroups,
        deriveFlat,
        deriveSearchResults,
        deriveArchivedGroups,
        sortArchivedGroups,
        deriveArchivedBatchIds,
        archivedSessionIdsInGroups,
        pruneArchivedSelection,
        toggleArchivedSelection,
        archivedDeleteFeedback,
        archiveableWorkspaceSessionCount,
        archiveWorkspaceDialogTarget,
        archiveWorkspaceDialogFailureState,
        archiveWorkspaceSessionsAndRefresh,
        createWorkspaceViewStore,
        bindObservable,
        hasSplitClientStore,
        provideUiWorkspace,
        groupByWorkspace,
        byRecency,
        ARCHIVE_MANAGER_REMOTE
      };
      exports.apply = apply;
      exports.inject = inject;
      return module.exports;
    }
  });
})();
