import type { ClientContext, Workspaces, Registry, RegistryCalls, DiscoveryMethod, SessionBinding, BrowserInjected } from "./client-compat.js";
import type { BrowserProps, TreeProps, FlatProps, SearchProps, WorkspacePickProps, DirectoryFlowOwner, DropOver, SessionDrag, WorkspaceDrag, RowDrag, RemoteSearch, ArchiveDeleteTarget } from "./client-types.js";
import { record, errorMessage, errorCode } from "./contracts.js";
import type { Schema } from "./contracts.js";
import type { ClientSession, ClientList, ClientWorkspace, WorkspaceSnapshot, Observable, WorkspaceView, UiFacts, PendingHook, StatusHook, StatusMap, BatchTarget, DeletedBatch, ArchivedGroup, ArchiveProps, ArchiveBatchResult, ArchiveRetry, Translate, BatchProgress, OrganizeKind, SessionDetail } from "./client-types.js";
import { createSessionHealthPanel, healthZh, healthEn } from "./session-health-ui.js";
import { createDiscoveryTools, discoveryCss, discoveryZh, discoveryEn } from "./archive-discovery-ui.js";
import { compareTurnCounts, copySessionText, discoveryInvocations, matchesUpdatedRange, validUpdatedRange, sessionDetailCandidates } from "./archive-discovery.js";
import { allowArchivedNavigation, openArchivedConversation, formatArchiveNavigationError, ArchiveNavigationError, currentSessionId } from "./archive-experience.js";
import { mirrorDirectoryFlow } from "./directory-flow-slot.js";
import { observePluginUpdate } from "./plugin-update-ui.js";
import { favoriteInvocations, idleArchiveCandidate, createSessionOrganizer } from "./archive-organizer.js";
import { createOrganizerPanel, organizerZh, organizerEn } from "./archive-organizer-ui.js";
import { AntdProvider, Button as AntdButton, Checkbox as AntdCheckbox, Dropdown as AntdDropdown, Input as AntdInput, List as AntdList, Modal as AntdModal, Segmented as AntdSegmented, Select as AntdSelect } from "./antd-ui.js";
type HostRequire = Parameters<Window["__ModuleLoader__"]["load"]>[0]["factory"] extends (require: infer Require) => unknown ? Require : never;
export function startArchiveClient(require: HostRequire) {
		var module: { exports: Record<string, unknown> } = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store: typeof import("@deepseek-ai/dsh-client-store");
		let hasSplitClientStore = true;
		try {
			_deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		} catch {
			// DSH <= 0.1.1 owns the store engine in client-runtime; 0.1.2+
			// seeds the split client-store package directly into the module table.
			hasSplitClientStore = false;
			_deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-runtime/client");
		}
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		type LegacyIcon = (props: { size?: number; className?: string }) => import("react").ReactNode;
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives") as typeof import("@deepseek-ai/dsh-client-ui-primitives") & Record<string, LegacyIcon>;
		// 0.1.7 把带尺寸后缀的图标改成 Medium；旧宿主仍导出原来的名字。
		_deepseek_ai_dsh_client_ui_primitives = new Proxy(_deepseek_ai_dsh_client_ui_primitives, {
			get(target, prop, receiver) {
				const value = Reflect.get(target, prop, receiver);
				if (value !== undefined || typeof prop !== "string") return value;
				const medium = prop.replace(/(\D)\d+$/, "$1Medium");
				return medium === prop ? value : Reflect.get(target, medium, receiver);
			},
		});
		function SettingsModal({ open, onClose, title, description, footer, children, className, width }: { open: boolean; onClose(): void; title: import("react").ReactNode; description?: import("react").ReactNode; footer?: import("react").ReactNode; children?: import("react").ReactNode; className?: string; width?: number }) {
			return (0, react_jsx_runtime.jsx)(AntdModal, { open, onCancel: onClose, title, footer, className, width, children: description == null ? children : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("p", { children: description }), children] }) });
		}
		function settingsButton({ variant = "outline", icon, children, danger = false, className, disabled, title, onClick, "aria-label": ariaLabel, "aria-pressed": ariaPressed, "aria-haspopup": ariaHaspopup }: { variant?: "primary" | "ghost" | "outline" | "toolbar"; icon?: import("react").ReactNode; danger?: boolean; className?: string; disabled?: boolean; title?: string; onClick?: () => void; "aria-label"?: string; "aria-pressed"?: boolean; "aria-haspopup"?: import("react").AriaAttributes["aria-haspopup"]; children?: import("react").ReactNode }) {
			const type = variant === "primary" ? "primary" : variant === "ghost" || variant === "toolbar" ? "text" : "default";
			return (0, react_jsx_runtime.jsx)(AntdButton, { type, danger, shape: "round", icon, className, disabled, title, onClick, "aria-label": ariaLabel, "aria-pressed": ariaPressed, "aria-haspopup": ariaHaspopup, children });
		}
		function tabsShell(locked: boolean, children: import("react").ReactNode) {
			const props: { className?: string; inert?: ""; children: import("react").ReactNode } = { className: locked ? "dsham_archiveTabsLocked" : undefined, children };
			if (locked) props.inert = "";
			return props as import("react").HTMLAttributes<HTMLDivElement> & { children: import("react").ReactNode };
		}
		const OrganizerPanel = createOrganizerPanel(react);
        const { HighlightedText, useSessionDetails, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent } = createDiscoveryTools(react);
        const SessionHealthPanel = createSessionHealthPanel(react, { warning: _deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, info: _deepseek_ai_dsh_client_ui_primitives.IconInfoOutline14, check: _deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, refresh: _deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, search: _deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, chevron: _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14 });
		const UPDATE_ICON_PATHS: Record<string, string[]> = {
			refresh: ["M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1A5.5 5.5 0 1 0 13.2 12"],
			download: ["M8 2v8m0 0 3-3m-3 3-3-3M3 13v2h10v-2"],
			copy: ["M5 5h8v8H5z", "M3 3h8"],
			close: ["m4 4 8 8M12 4 4 12"]
		};
		function createPluginUpdateIcon(name: string) {
			const element = document.createElement("span");
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("viewBox", "0 0 16 16");
			svg.setAttribute("width", "16");
			svg.setAttribute("height", "16");
			svg.setAttribute("fill", "none");
			svg.setAttribute("stroke", "currentColor");
			svg.setAttribute("stroke-width", "1.5");
			svg.setAttribute("stroke-linecap", "round");
			svg.setAttribute("stroke-linejoin", "round");
			svg.setAttribute("aria-hidden", "true");
			for (const d of UPDATE_ICON_PATHS[name]) {
				const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
				path.setAttribute("d", d);
				svg.append(path);
			}
			element.append(svg);
			return element;
		}
		//#region dsh-archive-manager: typert remote contribution + archived styling
		/**
		* Strict codec shims for the archive-manager Remote descriptors. The
		* client typert gateway requires `mode: "strict"` codecs whose schema
		* exposes a `parse()` function; plain functions satisfy the contract
		* without shipping a second zod copy into this bundle.
		*/
		const sessionIdSchema = {
			parse(value: unknown) {
				if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
				return value;
			}
		};
		const archivedSetSchema = {
			parse(input: unknown) {
				const value = record(input);
				if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
				const ids = value.archivedSessionIds;
				if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
				return value;
			}
		};
		const deletedSchema = {
			parse(input: unknown) {
				const value = record(input);
				if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
				return value;
			}
		};
		const archivedBatchTargetSchema = {
			parse(input: unknown) {
				const value = record(input);
				if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
				if (value.scope === "all" || value.scope === "ungrouped") return value;
				if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
				if (value.scope === "sessions" && Array.isArray(value.sessionIds) && value.sessionIds.length > 0 && value.sessionIds.every((id) => typeof id === "string" && id.length > 0)) return value;
				throw new TypeError("target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds");
			}
		};
		const deletedBatchSchema = {
			parse(input: unknown) {
				const value = record(input);
				if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
				for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
					if (!Array.isArray(value[key]) || (value[key] as unknown[]).some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
				}
				if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
				return value;
			}
		};
		const archivedSessionMetadataSchema = {
			parse(input: unknown) {
				const value = record(input);
				if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
				if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
				if (value.repairedSessionIds !== void 0 && (!Array.isArray(value.repairedSessionIds) || value.repairedSessionIds.some((id) => typeof id !== "string"))) throw new TypeError("repairedSessionIds must be a string array");
				return value;
			}
		};
		/** alpha.1 读 schema.parse；alpha.2 只接受 create()。 */
		function strictCodec(typeSymbol: string, schema: Schema<unknown>) {
			return { mode: "strict", typeSymbol, create: () => schema, schema };
		}
		/**
		* 客户端通过 `ctx.remote.$mount` 注册 workspaceRegistry 的远程方法。
		* 调用走 typert gateway SRC 路径，不影响既有 `/api/workspace.*` 网关。
		*/
		const ARCHIVE_MANAGER_REMOTE = {
			package: "@michengai/dsh-archive-manager",
			descriptors: [
				...favoriteInvocations(),
				...discoveryInvocations(),
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
						codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
					}],
					result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionIds", archivedSetSchema),
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
						codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema)
					}],
					result: strictCodec("@michengai/dsh-archive-manager/types#Deleted", deletedSchema),
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
						codec: strictCodec("@michengai/dsh-archive-manager/types#ArchivedBatchTarget", archivedBatchTargetSchema)
					}],
					result: strictCodec("@michengai/dsh-archive-manager/types#DeletedBatch", deletedBatchSchema),
					sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
				},
				{
					id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
					service: "workspaceRegistry",
					namespace: "workspaceRegistry",
					method: "archivedSessionMetadata",
					invocation: { kind: "direct" },
					parameters: [],
					result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionMetadata", archivedSessionMetadataSchema),
					sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
				},
			]
		};
		/** Archived-session row presentation classes (theme-token driven). */
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
		//#endregion
		//#region lib/types/client/subagent-lineage.js
		/**
		* Index uninterrupted subagent descendants under each ancestor.
		* DSH 0.1.2 made this a UI-package-private projection, so the archive
		* manager keeps the small pure helper locally instead of importing the
		* removed client-runtime package.
		* @param summaries - Session summaries keyed by id.
		* @returns descendant totals keyed by possible parent id.
		*/
		function indexSubagentDescendants(summaries: Record<string, ClientSession>) {
			const indexed = new Map<string, { count: number; runningCount: number }>();
			for (const descendant of Object.values(summaries)) {
				if (descendant.origin !== "subagent") continue;
				const seen = /* @__PURE__ */ new Set<string>();
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
		//#endregion
		//#region lib/types/client/stores.js
		/**
		* The workspace browser's viewing store: the session-list grouping mode,
		* persisted across reloads. Module level exports the factory only (a
		* module-level handle would pin the store identity across plugin reloads);
		* register() receives the factory and the browser derives its PropsStore
		* share from the return type.
		*/
		/** Browser-local order account for the hierarchy-free flat Session list. */
		const FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
		/**
		* Create the workspace browser viewing store handle.
		* @returns the store handle (spec + type + identity + factory in one).
		*/
		const WORKSPACE_VIEW_PERSIST_KEY = "dsh.archive-manager.workspace.view.v1";
		const LEGACY_WORKSPACE_VIEW_PERSIST_KEY = "dsh.workspace.view.v5";
		/** 换键后把官方同构的分组/展开/排序偏好拷到新键；新键已有值时不覆盖。 */
		function migrateWorkspaceViewPersist(storage?: Pick<Storage, "getItem" | "setItem">) {
			const target = storage ?? globalThis.localStorage;
			if (target == null || typeof target.getItem !== "function" || typeof target.setItem !== "function") return false;
			try {
				if (target.getItem(WORKSPACE_VIEW_PERSIST_KEY) != null) return false;
				const legacy = target.getItem(LEGACY_WORKSPACE_VIEW_PERSIST_KEY);
				if (legacy == null) return false;
				target.setItem(WORKSPACE_VIEW_PERSIST_KEY, legacy);
				return true;
			} catch {
				return false;
			}
		}
		function createWorkspaceViewStore() {
			migrateWorkspaceViewPersist();
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: (): WorkspaceView => ({
					groupBy: "workspace",
					orderBy: "updated",
					showArchived: false,
					groupExpansion: {},
					sessionOrderByAccount: {},
					sessionUpdatedAtByAccount: {}
				}),
				persist: WORKSPACE_VIEW_PERSIST_KEY,
				actions: {
					setGroupBy: (d, mode: string) => {
						d.groupBy = mode;
					},
					setOrderBy: (d, mode: string) => {
						d.orderBy = mode;
					},
					setShowArchived: (d, value: boolean) => {
						d.showArchived = value === true;
					},
					setGroupExpanded: (d, key: string, expanded: boolean) => {
						d.groupExpansion[key] = expanded;
					},
					retainAccountKeys: (d, workspaceKeys: string[]) => {
						const retained = new Set(workspaceKeys);
						d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
						d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
						d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
					},
					syncSessionOrderAccount: (d, accountKey: string, order: string[], updatedAt: Record<string, number>) => {
						d.sessionOrderByAccount[accountKey] = order;
						d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
					},
					setSessionOrder: (d, accountKey: string, order: string[]) => {
						d.sessionOrderByAccount[accountKey] = order;
					}
				}
			});
		}
		/** GitHub 品牌标识未由宿主图标库提供，内联以保持离线可用和主题适配。 */
		function GithubMark16() {
			return (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: "false", children: (0, react_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" }) });
		}
		/**
		* 归档管理设置页：集中处理筛选、多选、恢复、删除和原生会话导航。
		*/
		function ArchivedSessionsSection({ archiveSessions, archiveSession, sessionStore, workspaceStore, unarchiveSession, deleteSession, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, openConversation, focusSessionWorkspace, viewState, close, t, diagnoseSession, repairSession, sessionDetails, searchSessionContent, searchArchivedContent, previewArchivedSession, favoriteSessions, setSessionFavorite, organizeBatch, useSessionPendingInteraction, useSessionStatus }: ArchiveProps) {
			const sessions = (0, react.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
			const workspaceState = (0, react.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
			const [archiveTab, setArchiveTab] = (0, react.useState)("archived");
			const isArchived = archiveTab === "archived";
			const [archiveTarget, setArchiveTarget] = (0, react.useState)<string[] | null>(null);
			const [archiveGroup, setArchiveGroup] = (0, react.useState)<ArchivedGroup | null>(null);
			const [stopArchive, setStopArchive] = (0, react.useState)<{ sessionId: string; title: string; kinds: string } | null>(null);
			const requestArchive = (ids: string[], group: ArchivedGroup | null = null) => { setError(null); setNotice(null); setIdleRequest(false); setArchiveGroup(group); setArchiveTarget(ids); };
			const closeArchive = () => { if (!busy) { setArchiveTarget(null); setArchiveGroup(null); setError(null); } };
			const archiveBusy = (0, react.useRef)(false);
			const [deleteTarget, setDeleteTarget] = (0, react.useState)<ArchiveDeleteTarget | null>(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)<string | null>(null);
			const [notice, setNotice] = (0, react.useState)<string | null>(null);
			const [query, setQuery] = (0, react.useState)(viewState?.query ?? "");
			const [project, setProject] = (0, react.useState)(viewState?.project ?? "all");
			const [sortBy, setSortBy] = (0, react.useState)(viewState?.sortBy ?? "updated");
			const [createdAtById, setCreatedAtById] = (0, react.useState)<Record<string, number>>({});
			const [unarchivingSessionIds, setUnarchivingSessionIds] = (0, react.useState)(() => /* @__PURE__ */ new Set<string>());
			const unarchivingSessionIdsRef = (0, react.useRef)(/* @__PURE__ */ new Set<string>());
			const [selectedSessionIds, setSelectedSessionIds] = (0, react.useState)<string[]>([]);
			const [favoriteIds, setFavoriteIds] = (0, react.useState)<string[]>([]);
			const [favoritesReady, setFavoritesReady] = (0, react.useState)(false);
			const [favoriteBusy, setFavoriteBusy] = (0, react.useState)(false);
			const favoriteLock = (0, react.useRef)(false);
			const [favoritesOnly, setFavoritesOnly] = (0, react.useState)(false);
			const [searchScope, setSearchScope] = react.useState("title");
            const [dateFrom, setDateFrom] = react.useState("");
            const [dateTo, setDateTo] = react.useState("");
            const [collapsedGroups, setCollapsedGroups] = (0, react.useState)(() => new Set<string>());
			const [idleDays, setIdleDays] = (0, react.useState)("30");
			const [idleRequest, setIdleRequest] = (0, react.useState)(false);
			const [batchProgress, setBatchProgress] = (0, react.useState)<BatchProgress | null>(null);
			const [batchResult, setBatchResult] = (0, react.useState)<ArchiveBatchResult | null>(null);
			const [lastArchive, setLastArchive] = (0, react.useState)<string[]>([]);
			const batchLock = (0, react.useRef)(false);
			const retryBatch = (0, react.useRef)<ArchiveRetry | null>(null);
			const uiFacts = useSessionUiFacts(useSessionPendingInteraction ?? useEmptySessionPendingInteraction, useSessionStatus ?? useEmptySessionStatus, typeof useSessionStatus === "function");
			const pendingRef = (0, react.useRef)(uiFacts.pending);
			pendingRef.current = uiFacts.pending;
			const favoriteSet = new Set(favoriteIds);
			const loadFavorites = async () => {
				if (!favoriteSessions) return;
				try { const result = await favoriteSessions(); setFavoriteIds(result.favoriteSessionIds); setFavoritesReady(true); }
				catch (reason) { setFavoritesReady(false); setError(errorMessage(reason)); }
			};
			(0, react.useEffect)(() => { let active = true; if (favoriteSessions) favoriteSessions().then((value) => { if (active) { setFavoriteIds(value.favoriteSessionIds); setFavoritesReady(true); } }).catch((reason) => { if (active) setError(errorMessage(reason)); }); return () => { active = false; }; }, [favoriteSessions]);
			const toggleFavorite = async (sessionId: string) => {
				if (favoriteLock.current || busy || !favoritesReady) return;
				favoriteLock.current = true; setFavoriteBusy(true); setError(null);
				try { const value = await setSessionFavorite({ sessionId, favorite: !favoriteSet.has(sessionId) }); setFavoriteIds(value.favoriteSessionIds); }
				catch (reason) { setError(errorMessage(reason)); }
				finally { favoriteLock.current = false; setFavoriteBusy(false); }
			};
			const executeBatch = async (kind: OrganizeKind, ids: string[], { idle = false, retry = false } = {}) => {
				if (batchLock.current || favoriteLock.current || unarchivingSessionIdsRef.current.size > 0 || !organizeBatch) return;
				batchLock.current = true; setBusy(true); setError(null); setNotice(null); setBatchResult(null);
				if (kind === "archive" && !retry) setLastArchive([]);
				try {
					const result = await organizeBatch(kind, ids, { idleDays: idle ? Number(idleDays) : undefined, getPending: () => pendingRef.current, onProgress: setBatchProgress });
					setBatchResult({ ...result, kind, tab: archiveTab });
					retryBatch.current = result.remaining.length ? { kind, ids: result.remaining, idle } : null;
					if (kind === "archive") setLastArchive((previous) => [...new Set([...previous, ...result.succeeded])]);
					if (kind === "undo" || kind === "restore" || kind === "delete") setLastArchive((previous) => previous.filter((id) => !result.succeeded.includes(id) && !result.skipped.includes(id)));
					setSelectedSessionIds((previous) => previous.filter((id) => !result.succeeded.includes(id) && !result.skipped.includes(id)));
					if (kind === "delete") setFavoriteIds((previous) => previous.filter((id) => !result.succeeded.includes(id)));
					return result;
				} catch (reason) { setError(errorMessage(reason)); }
				finally { batchLock.current = false; setBusy(false); setBatchProgress(null); }
			};
			const navigationActive = (0, react.useRef)(true);
			const navigationPending = (0, react.useRef)(false);
			(0, react.useEffect)(() => { navigationActive.current = true; return () => { navigationActive.current = false; }; }, []);
			const viewConversation = async (session: { id: string }, restore = false) => {
				if (busy || navigationPending.current) return;
				navigationPending.current = true; setBusy(true); setError(null);
				let restored = false;
				try {
					// close 由 settings.section 的壳通过 renderSlot 传入，不属于 inject；主面板切换不会关闭设置遮罩。
					await openArchivedConversation({
						prepare: restore ? async (id) => { await focusSessionWorkspace?.(id); } : undefined,
						restore: async (id) => {
							await unarchiveSession(id);
							restored = true;
						},
						open: async (id) => {
							await openConversation(id);
							if (navigationActive.current) close?.();
						}
					}, session.id, restore, () => navigationActive.current);
				} catch (reason) {
					if (!navigationActive.current) return;
					// 恢复已成功但没打开时，会话已离开「已归档」；切到未归档并定位到原工作区，避免看起来像丢失。
					if (restored) {
						setArchiveTab("unarchived");
						const group = groups.find((item) => item.sessions.some((row) => row.id === session.id));
						if (group !== undefined) setProject(group.key);
					}
					setError(formatArchiveNavigationError(reason, t));
				}
				finally { navigationPending.current = false; if (navigationActive.current) setBusy(false); }
			};
			(0, react.useEffect)(() => { if (viewState) Object.assign(viewState, { query, project, sortBy }); }, [query, project, sortBy, viewState]);
			const eligibleIds = (0, react.useMemo)(() => isArchived ? workspaceState.archivedSessionIds : unarchivedSessionIds(sessions.byId, workspaceState.archivedSessionIds), [isArchived, sessions.byId, workspaceState.archivedSessionIds]);
			const groups = (0, react.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, eligibleIds, t("group.ungrouped")), [sessions.byId, workspaceState, eligibleIds, t]);
			const switchTab = (tab: string) => {
				if (busy || unarchivingSessionIdsRef.current.size > 0) return;
				preview.close();
				setArchiveTab(tab); setSelectedSessionIds([]); setArchiveTarget(null); setArchiveGroup(null); setError(null); setNotice(null); setProject("all"); setQuery("");

			};
			const confirmArchive = async () => {
				if (archiveBusy.current || busy || !archiveTarget?.length) return;
				if (organizeBatch) {
					archiveBusy.current = true;
					try {
						const result = await executeBatch("archive", archiveTarget, { idle: idleRequest });
						const active = result?.failures.map((failure) => activeArchiveFromMessage(failure.sessionId, failure.message)).find((item) => item !== undefined);
						if (active !== undefined && typeof archiveSession === "function") {
							const session = sessions.byId[active.sessionId];
							setStopArchive({ sessionId: active.sessionId, title: session === undefined ? active.sessionId : displayTitle(session, t), kinds: active.kinds.join(", ") });
							setArchiveTarget(null); setArchiveGroup(null); setError(null);
							return;
						}
						if (result) { setArchiveTarget(null); setArchiveGroup(null); setIdleRequest(false); }
					} finally { archiveBusy.current = false; }
					return;
				}
				archiveBusy.current = true; setBusy(true); setError(null); setNotice(null);
				try {
					const result = await archiveSessions(archiveTarget);
					setSelectedSessionIds([]);
					setArchiveTab("archived");
					setProject("all");
					setQuery("");
					setNotice(t("archives.archiveSuccess", { n: result.archivedSessionIdsAdded.length }));
					setArchiveTarget(null); setArchiveGroup(null);
				} catch (reason) {
					const active = activeSessionRefusal(reason);
					if (active !== undefined && typeof archiveSession === "function") {
						const session = sessions.byId[active.sessionId];
						setStopArchive({ sessionId: active.sessionId, title: session === undefined ? active.sessionId : displayTitle(session, t), kinds: active.kinds.join(", ") });
						setArchiveTarget(null); setArchiveGroup(null); setError(null);
					} else {
						const kinds = activeSessionActivity(reason);
						setError(kinds === undefined ? t("archives.archiveBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }) : t("archives.archiveActive", { kinds: kinds.join(", ") }));
					}
				}
				finally { archiveBusy.current = false; setBusy(false); }
			};
			const details = useSessionDetails(sessionDetailCandidates(eligibleIds, sessions.byId), sessionDetails, t);
            const copyDetail = async (session: ClientSession, kind: string) => {
                setError(null); setNotice(null);
                try {
                    let text = session.id;
                    if (kind === "path") {
                        let row = details.byId[session.id];
                        if (!row) row = (await sessionDetails({ sessionIds: [session.id] })).items[0];
                        if (!row?.path) throw new Error(t("details.noPath"));
                        text = row.path;
                    }
                    await copySessionText(text);
                    if (navigationActive.current) setNotice(t("details.copied"));
                } catch (reason) { if (navigationActive.current) setError(typeof errorCode(reason) === "string" && String(errorCode(reason)).startsWith("copy.") ? t(String(errorCode(reason))) : errorMessage(reason)); }
            };
            const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t, details.byId), [groups, sortBy, createdAtById, t, details.byId]);
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
			const invalidDate = !validUpdatedRange(dateFrom, dateTo);
            const candidateGroups = sortedGroups.filter(group => project === "all" || project === group.key).map(group => ({ ...group, sessions: group.sessions.filter(session => (!favoritesOnly || favoriteIds.includes(session.id)) && matchesUpdatedRange(session.updatedAt, dateFrom, dateTo)) })).filter(group => group.sessions.length);
            const contentEnabled = searchScope === "content" && !invalidDate;
            const contentSearch = useArchiveSearch(candidateGroups.flatMap(group => group.sessions.map(session => session.id)), query, contentEnabled, searchSessionContent ?? searchArchivedContent);
            const contentMatches = new Map(contentSearch.items.map(item => [item.sessionId, item]));
            const preview = useArchivePreview(previewArchivedSession, isArchived ? workspaceState.archivedSessionIds : []);
            const normalizedQuery = query.trim().toLocaleLowerCase();
            const filteredGroups = candidateGroups.map(group => ({ ...group, sessions: group.sessions.filter(session => !normalizedQuery || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery) || contentMatches.has(session.id)) })).filter(group => group.sessions.length);
            const idleCandidates = favoritesReady ? filteredGroups.flatMap((group) => group.sessions).filter((session) => idleArchiveCandidate(session, { days: Number(idleDays), favorites: favoriteSet, currentId: currentSessionId(sessions), pending: uiFacts.pending })).map((session) => session.id) : [];
			const visibleSessionIds = (0, react.useMemo)(() => archivedSessionIdsInGroups(filteredGroups), [filteredGroups]);
			const selectedSessionIdSet = (0, react.useMemo)(() => new Set(selectedSessionIds), [selectedSessionIds]);
			const selectedVisibleCount = visibleSessionIds.filter((sessionId) => selectedSessionIdSet.has(sessionId)).length;
			const allVisibleSelected = visibleSessionIds.length > 0 && selectedVisibleCount === visibleSessionIds.length;
			(0, react.useEffect)(() => {
				setSelectedSessionIds((current) => pruneArchivedSelection(current, eligibleIds));
			}, [eligibleIds]);
			const toggleSessionSelection = (sessionId: string, checked: boolean) => {
				setSelectedSessionIds((current) => toggleArchivedSelection(current, [sessionId], checked));
			};
			const toggleVisibleSelection = (checked: boolean) => {
				setSelectedSessionIds((current) => toggleArchivedSelection(current, visibleSessionIds, checked));
			};
			const onUnarchive = (sessionId: string) => {
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
			const onBatchUnarchive = async (target: BatchTarget) => {
				if (busy) return;
				if (organizeBatch) {
					const ids = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target);
					const result = await executeBatch("restore", ids);
					return result && { unarchivedSessionIds: result.succeeded };
				}
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
				const onKeyDown = (event: KeyboardEvent) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					event.stopPropagation();
					if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
					if (!busy) setDeleteTarget(null);
				};
				window.addEventListener("keydown", onKeyDown, true);
				return () => window.removeEventListener("keydown", onKeyDown, true);
			}, [deleteTarget, busy]);
			const confirmDelete = async () => {
				if (busy || deleteTarget === null) return;
				if (organizeBatch && deleteTarget.kind === "batch") {
					const ids = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, deleteTarget.target);
					const result = await executeBatch("delete", ids);
					if (result) setDeleteTarget(null);
					return;
				}
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
							const completed = new Set([...result.deletedSessionIds, ...result.skippedSessionIds]);
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
			const deleteDialogTitle = batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget?.kind === "batch" ? deleteTarget.title : "" }) : batchScope === "sessions" ? t("archives.deleteSelectedTitle") : t("deleteSession.title");
			const deleteDialogDescription = deleteTarget === null ? void 0 : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget?.kind === "batch" ? deleteTarget.title : "", n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : batchScope === "sessions" ? t("archives.deleteSelectedDesc", { n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.kind === "session" ? deleteTarget.session : {}, t) });
			const deleteConfirmLabel = batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : batchScope === "sessions" ? t("archives.deleteSelectedConfirm") : t("deleteSession.title");
			return (0, react_jsx_runtime.jsx)(AntdProvider, { children: (0, react_jsx_runtime.jsxs)("section", {
				className: "dsham_settings",
				"aria-label": t("archives.title"),
				children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_TABS_CSS + ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS + ARCHIVE_SETTINGS_SELECTION_CSS + ARCHIVE_WORKSPACE_CONFIRM_CSS }), (0, react_jsx_runtime.jsxs)("div", {
					// 设置页使用独立布局容器，避免被 Codex UI 的会话 header 页签适配器识别。
					className: "dsham_settingsHeader",
					children: [(0, react_jsx_runtime.jsxs)("div", {
					children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsTitleRow", children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsLinks", children: [(0, react_jsx_runtime.jsx)(AntdButton, { size: "small", shape: "default", href: "https://github.com/MichengAI/dsh-archive-manager", target: "_blank", rel: "noreferrer", "aria-label": t("archives.viewProject"), icon: (0, react_jsx_runtime.jsx)(GithubMark16, {}), children: t("archives.viewProject") }), (0, react_jsx_runtime.jsx)(AntdButton, { size: "small", shape: "default", href: "https://github.com/MichengAI/dsh-archive-manager/issues", target: "_blank", rel: "noreferrer", "aria-label": t("archives.feedback"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16, {}), children: t("archives.feedback") })] })] }), (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsIntro", children: t("archives.description") })]
					}), react.createElement("div", tabsShell(busy || unarchivingSessionIds.size > 0, (0, react_jsx_runtime.jsx)(AntdSegmented, {
					block: true, "aria-label": t("archives.title"), value: archiveTab === "unarchived" ? "unarchived" : "archived", onChange: (value) => switchTab(String(value) === "unarchived" ? "unarchived" : "archived"),
					options: [{ value: "archived", label: t("archives.tab.archived") }, { value: "unarchived", label: t("archives.tab.unarchived") }]
					})))]
				}), (0, react_jsx_runtime.jsxs)("div", { id: "dsham-archive-panel", role: "tabpanel", "aria-labelledby": "dsham-tab-" + archiveTab, children: [(0, react_jsx_runtime.jsxs)("div", {
					className: "dsham_settingsToolbar",
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: "dsham_settingsSearch",
						children: [typeof setSessionFavorite === "function" && (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-favorite-filter", value: favoritesOnly ? "favorites" : "all", disabled: busy || favoriteBusy || !favoritesReady, options: [{ value: "all", label: t("organizer.allSessions") }, { value: "favorites", label: t("organizer.favoritesOnly") }], onChange: (value) => setFavoritesOnly(value === "favorites"), "aria-label": t("organizer.favoriteFilter") }), react.createElement(ArchiveProjectSelect, { id: "dsham-search-scope", value: searchScope, "aria-label": t("discovery.scope"), disabled: busy || unarchivingSessionIds.size > 0, onChange: setSearchScope, options: [{ value: "title", label: t("discovery.titleOnly") }, { value: "content", label: t("discovery.titleAndContent") }] }), (0, react_jsx_runtime.jsx)(AntdInput, { className: "dsham_searchField", type: "search", maxLength: 200, allowClear: true, value: query, onChange: (event) => setQuery(event.target.value), placeholder: t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived"), "aria-label": t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived") })]
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: "dsham_settingsFilters",
						children: [(0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-project-filter", className: "dsham_projectFilter", value: project, options: [{ value: "all", label: t("archives.allProjects"), title: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title, title: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") }), react.createElement(DiscoveryFilters, { t, from: dateFrom, to: dateTo, onFrom: setDateFrom, onTo: setDateTo, invalid: invalidDate, onClear: () => { setDateFrom(""); setDateTo(""); } }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsSort", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsSortLabel", "aria-hidden": true, children: t("archives.sortLabel") }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dsham-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }, ...typeof sessionDetails === "function" ? [{ value: "turnsDesc", label: t("details.more") }, { value: "turnsAsc", label: t("details.less") }] : []], onChange: setSortBy, "aria-label": t("archives.sortBy") })] })] })]
				}), react.createElement("style", null, discoveryCss), react.createElement(SearchStatus, { state: contentSearch, t }), react.createElement(SessionHealthPanel, { key: archiveTab, t, isArchived, items: details.items, sessions: groups.flatMap(group => group.sessions), diagnoseSession, repairSession, retry: details.retry, pending: details.pending }), organizeBatch && (0, react_jsx_runtime.jsx)(OrganizerPanel, {
					t, archived: isArchived, busy: busy || favoriteBusy || unarchivingSessionIds.size > 0, ready: favoritesReady,
					days: idleDays, onDays: setIdleDays, count: idleCandidates.length,
					onPreview: () => { requestArchive(idleCandidates); setIdleRequest(true); },
					progress: batchProgress, result: batchResult?.tab === archiveTab ? batchResult : null,
					onRetry: () => { const retry = retryBatch.current; if (retry) { if (retry.kind === "delete") setDeleteTarget({ kind: "batch", target: { scope: "sessions", sessionIds: retry.ids }, count: retry.ids.length }); else executeBatch(retry.kind, retry.ids, { idle: retry.idle, retry: true }); } },
					undoCount: lastArchive.filter((id) => workspaceState.archivedSessionIds.includes(id)).length,
					onUndo: () => executeBatch("undo", lastArchive, { retry: true }), onReload: loadFavorites
				}), groups.length > 0 && (0, react_jsx_runtime.jsx)(ArchiveSelectionToolbar, {
					selectedCount: selectedSessionIds.length,
					hiddenCount: selectedSessionIds.length - selectedVisibleCount,
					allVisibleSelected, selectedVisibleCount, visibleCount: visibleSessionIds.length, busy, t,
					onToggle: toggleVisibleSelection,
					onClear: () => setSelectedSessionIds([]),
					onArchive: isArchived ? undefined : () => requestArchive([...selectedSessionIds]),
					onRestore: onSelectedUnarchive,
					onDelete: () => setDeleteTarget({ kind: "batch", target: { scope: "sessions", sessionIds: selectedSessionIds }, count: selectedSessionIds.length })
				}), groups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t(isArchived ? "archives.empty" : "archives.emptyUnarchived") }) : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: contentSearch.status === "loading" || contentSearch.status === "error" || contentSearch.failures.length ? null : t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
					const target = archivedBatchTargetForGroup(group.key);
					const groupSessionIds = groups.find((item) => item.key === group.key)?.sessions.map((session) => session.id) ?? [];
					const count = isArchived ? deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length : groupSessionIds.length;
					return (0, react_jsx_runtime.jsxs)("section", {
						className: "dsham_settingsGroup",
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: "dsham_settingsGroupHeading",
							children: [(0, react_jsx_runtime.jsx)("h3", { className: "dsham_settingsGroupTitle", children: (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dsham_groupToggle", "aria-expanded": !collapsedGroups.has(group.key), "aria-controls": "dsham-group-" + encodeURIComponent(group.key), onClick: () => setCollapsedGroups((previous) => { const next = new Set(previous); if (next.has(group.key)) next.delete(group.key); else next.add(group.key); return next; }), children: [(0, react_jsx_runtime.jsx)(collapsedGroups.has(group.key) ? _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), (0, react_jsx_runtime.jsx)("span", { children: group.title })] }) }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsCount", children: t("archives.sessionCount", { n: group.sessions.length }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, onArchive: isArchived ? undefined : () => requestArchive(groupSessionIds, group), onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), t })] })]
						}), (0, react_jsx_runtime.jsx)(AntdList, {
							className: "dsham_settingsList", id: "dsham-group-" + encodeURIComponent(group.key), size: "small", split: false,
							style: collapsedGroups.has(group.key) ? { display: "none" } : undefined,
							children: !collapsedGroups.has(group.key) && group.sessions.map((session) => (0, react_jsx_runtime.jsxs)(AntdList.Item, {
                  className: "dsham_settingsRow",
                  "data-selected": selectedSessionIdSet.has(session.id),
                  children: [
                    (0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, { checked: selectedSessionIdSet.has(session.id), disabled: busy, label: t("archives.selectSession", { name: displayTitle(session, t) }), onChange: (event) => toggleSessionSelection(session.id, event.target.checked) }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsContent", children: [
                      (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsTitleLink", title: displayTitle(session, t), "aria-label": t("archives.openSession") + t("common.separator") + displayTitle(session, t), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => viewConversation(session), children: displayTitle(session, t) }),
                      (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsMeta", children: [archiveTimeLabel(session.updatedAt, t), typeof sessionDetails === "function" && react.createElement("span", { key: "turns", title: details.byId[session.id]?.error || t("details.hint") }, " · ", t(typeof details.byId[session.id]?.turnCount === "number" ? "details.turns" : details.byId[session.id] ? "details.unknown" : "details.pending", { n: details.byId[session.id]?.turnCount }))] }), contentMatches.has(session.id) && react.createElement("button", { type: "button", className: "dsham_settingsSnippet", disabled: busy, title: t(isArchived ? "discovery.preview" : "archives.openSession"), onClick: () => isArchived ? preview.open(session, query) : viewConversation(session) }, react.createElement(HighlightedText, { text: contentMatches.get(session.id)?.snippet ?? "", query }))
                    ] }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsActions", children: [
                      typeof setSessionFavorite === "function" && settingsButton({ variant: "ghost", className: favoriteSet.has(session.id) ? "dsham_favoriteOn" : undefined, title: t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite"), "aria-pressed": favoriteSet.has(session.id), "aria-label": t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite") + t("common.separator") + displayTitle(session, t), disabled: busy || favoriteBusy || !favoritesReady, onClick: () => toggleFavorite(session.id), children: (0, react_jsx_runtime.jsx)("span", { "aria-hidden": true, children: favoriteSet.has(session.id) ? "★" : "☆" }) }),
                      settingsButton({ variant: "ghost", title: t(isArchived ? "archives.restore" : "archives.archiveSelected"), "aria-label": t(isArchived ? "archives.restore" : "archives.archiveSelected"), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => isArchived ? onUnarchive(session.id) : requestArchive([session.id]), icon: (0, react_jsx_runtime.jsx)(isArchived ? _deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16 : _deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 }) }),
                      (isArchived || typeof sessionDetails === "function") && (0, react_jsx_runtime.jsx)(ArchivedSessionMenu, { busy: busy || unarchivingSessionIds.has(session.id), t, title: displayTitle(session, t), onCopyId: () => copyDetail(session, "id"), onCopyPath: typeof sessionDetails === "function" ? () => copyDetail(session, "path") : undefined, onPreview: isArchived && typeof previewArchivedSession === "function" ? () => preview.open(session, query) : undefined, onRestoreOpen: isArchived ? () => viewConversation(session, true) : undefined, onDelete: isArchived ? () => setDeleteTarget({ kind: "session", session }) : undefined })
                    ] })
                  ]
                }, session.id))
						})]
					}, group.key);
				}), react.createElement(SettingsModal, {
                    width: 900, open: preview.target !== null, onClose: preview.close, title: preview.target ? displayTitle(preview.target.session, t) : t("discovery.preview"),
                    footer: settingsButton({ disabled: busy, onClick: () => { if (preview.target) { const session = preview.target.session; preview.close(); return viewConversation(session); } }, children: t("discovery.openFull") }),
                    children: react.createElement(PreviewContent, { preview, t, MarkdownText: _deepseek_ai_dsh_client_ui_primitives.MarkdownText })
                }), archiveTarget === null && error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: archiveTarget !== null,
					onClose: closeArchive,
					title: t("archives.archiveTitle", { n: archiveTarget?.length ?? 0 }), description: archiveGroup === null ? t("archives.archiveSelectedDesc") : t(archiveGroup.key === ARCHIVE_UNGROUPED_KEY ? "archives.archiveUngroupedDesc" : "archives.archiveProjectDesc", { name: archiveGroup.title, n: archiveTarget?.length ?? 0 }),
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						settingsButton({ disabled: busy, onClick: closeArchive, children: t("cancel") }),
						settingsButton({ disabled: busy || !archiveTarget?.length, onClick: confirmArchive, children: t("archives.archiveSelected") })
					] }), children: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						organizeBatch && (0, react_jsx_runtime.jsx)("p", { children: t(idleRequest ? "organizer.idleConfirm" : "organizer.manualConfirm") }),
						organizeBatch && (0, react_jsx_runtime.jsx)("div", { className: "dsham_archivePreview", children: (archiveTarget ?? []).map((id) => (0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)(AntdCheckbox, { checked: true, disabled: busy, onChange: () => setArchiveTarget((current) => (current ?? []).filter((value) => value !== id)) }), displayTitle(sessions.byId[id] ?? { id }, t)] }, id)) }),
						batchProgress && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [(0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total) }), t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] }),
						error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error })
					] })
					}), (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: stopArchive !== null,
					onClose: () => { if (!busy) { setStopArchive(null); setError(null); } },
					title: t("archiveActive.title"),
					...stopArchive === null ? {} : { description: t("archiveActive.desc", { name: stopArchive.title, kinds: stopArchive.kinds }) },
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						settingsButton({ disabled: busy, onClick: () => { if (!busy) { setStopArchive(null); setError(null); } }, children: t("cancel") }),
						settingsButton({ disabled: busy, onClick: async () => {
							if (archiveBusy.current || busy || stopArchive === null || typeof archiveSession !== "function") return;
							archiveBusy.current = true; setBusy(true); setError(null);
							try {
								await archiveSession(stopArchive.sessionId, { stopActivity: true });
								setSelectedSessionIds((previous) => previous.filter((id) => stopArchive === null || id !== stopArchive.sessionId));
								setArchiveTab("archived");
								setNotice(t("archives.archiveSuccess", { n: 1 }));
								setStopArchive(null);
							} catch (reason) {
								setError(reason instanceof Error ? reason.message : String(reason));
							} finally { archiveBusy.current = false; setBusy(false); }
						}, children: t("archiveActive.confirm") })
					] }),
					children: error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error })
				}), (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: deleteTarget !== null,
					onClose: closeDelete,
					title: deleteDialogTitle,
					...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [settingsButton({ disabled: busy, onClick: closeDelete, children: t("cancel") }), settingsButton({ danger: true, disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
					children: busy && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending"), batchProgress && (0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total), "aria-label": t("organizer.progress") }), batchProgress && t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] })
				})] })]
			}) });
		}
		//#endregion
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e: unknown): string {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) (e as Record<string, unknown>)[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx(..._values: unknown[]) {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		/** Display label for the ungrouped bucket row. */
		const UNGROUPED_LABEL = "Ungrouped";
		/**
		* Directory display label: basename of the path (both separators accepted).
		* Ungrouped-bucket fallback for surfaces without a workspace title.
		* @param cwd - directory path, or undefined for the ungrouped bucket.
		* @returns basename, the raw cwd when it has no basename, or the ungrouped label.
		*/
		function workspaceLabel(cwd: string | undefined, ungroupedLabel = UNGROUPED_LABEL) {
			if (cwd === void 0 || cwd === "") return ungroupedLabel;
			const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
			return base !== void 0 && base !== "" ? base : cwd;
		}
		/** Recency comparator: newest first, id as the deterministic tiebreak (ids are unique per group). */
		function byRecency(a: { updatedAt: number; id: string }, b: { updatedAt: number; id: string }) {
			if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
			return a.id < b.id ? -1 : 1;
		}
		/**
		* Ordinary sessions are visible; among blank sessions, only the current one
		* is visible. Subagent children use their parent header catalog. Archived
		* sessions are hidden unless the "show archived" view toggle is on
		* (`showArchived`); their accounting slots remain either way, so
		* unarchiving restores position.
		*/
		function sessionVisible(session: ClientSession, current: string | undefined, archived: ReadonlySet<string>, showArchived: boolean) {
			return session.origin !== "subagent" && (!archived.has(session.id) || showArchived === true) && (!session.blank || session.id === current);
		}
		/** 识别删除路径上“会话已不存在”的稳定标记；保留旧文案作兜底。 */
		function isUnknownSessionError(reason: unknown) {
			const message = reason instanceof Error ? reason.message : String(reason);
			return message.includes("UNKNOWN_SESSION") || message.includes("no such session");
		}
		/** 把删除失败转成当前语言的用户文案。 */
		function formatDeleteError(reason: unknown, t: Translate) {
			if (isUnknownSessionError(reason)) return t("deleteSession.unknown");
			const detail = reason instanceof Error ? reason.message : String(reason);
			return t("deleteSession.failed", { detail });
		}
		function formatUnarchiveError(reason: unknown, t: Translate) {
			if (isUnknownSessionError(reason)) return t("archives.unarchiveUnknown");
			const detail = reason instanceof Error ? reason.message : String(reason);
			return t("archives.unarchiveFailed", { detail });
		}
		function formatArchiveError(reason: unknown, t: Translate) {
			if (isUnknownSessionError(reason)) return t("archives.archiveUnknown");
			const detail = reason instanceof Error ? reason.message : String(reason);
			return t("archives.archiveFailed", { detail });
		}
		/** 0.1.7 宿主拒绝运行中会话时，客户端错误不共享类身份，只认错误名和活动列表。 */
		function activeSessionActivity(reason: unknown) {
			if (reason === null || typeof reason !== "object") return;
			const error = record(reason);
			const rpc = error.rpcError !== null && typeof error.rpcError === "object" ? record(error.rpcError) : undefined;
			const direct = error.name === "WorkspaceActiveSessionError" ? error.activity : undefined;
			const details = rpc?.details;
			const wrapped = error.name === "WorkspaceArchiveError" && rpc?.code === "workspace/session-active" && details !== null && typeof details === "object"
				? record(details).activity
				: undefined;
			const activity = Array.isArray(direct) ? direct : Array.isArray(wrapped) ? wrapped : undefined;
			if (activity === undefined) return;
			const kinds = activity.flatMap((item) => {
				if (item === null || typeof item !== "object") return [];
				const kind = record(item).kind;
				return typeof kind === "string" && kind.length > 0 ? [kind] : [];
			});
			return kinds.length > 0 ? kinds : undefined;
		}
		function activeSessionRefusal(reason: unknown) {
			const kinds = activeSessionActivity(reason);
			if (kinds === undefined || reason === null || typeof reason !== "object") return;
			const error = record(reason);
			const details = error.rpcError !== null && typeof error.rpcError === "object" ? record(error.rpcError).details : undefined;
			const wrappedId = details !== null && typeof details === "object" ? record(details).sessionId : undefined;
			const sessionId = typeof error.sessionId === "string" ? error.sessionId : typeof wrappedId === "string" ? wrappedId : undefined;
			return sessionId === undefined ? undefined : { sessionId, kinds };
		}
		function activeArchiveFromMessage(sessionId: string, message: string) {
			const match = /^cannot archive session '(?:[^'\\]|\\')*': the session is active \((.*)\)$/.exec(message);
			if (match === null) return;
			const kinds = match[1].split(", ").filter((kind) => kind.length > 0);
			return kinds.length > 0 ? { sessionId, kinds } : undefined;
		}
		function formatForkError(reason: unknown, t: Translate) {
			const detail = reason instanceof Error ? reason.message : String(reason);
			return t("archives.forkFailed", { detail });
		}
		/**
		* A blank session is the selected Workspace's provisional New Session row;
		* its canonical title never enters search (blank rows are query-excluded)
		* and the renderer localizes its display label.
		*/
		function sessionTitle(session: ClientSession) {
			return session.blank ? "New Session" : session.displayTitle;
		}
		/** Build one group without projecting session lineage into presentation. */
		function buildGroup(key: string, workspaceId: string | undefined, cwd: string | undefined, createdAt: number | undefined, label: string, members: readonly ClientSession[], order: string) {
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
		/** Apply a stored Ungrouped order and append newly loose Sessions by recency. */
		function orderedUngrouped(members: readonly ClientSession[], stored: readonly string[]) {
			const byId = new Map(members.map((session) => [session.id, session]));
			const included = /* @__PURE__ */ new Set<string>();
			const ordered: ClientSession[] = [];
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
		/**
		* Group Sessions by Host Workspace: one group per entity in stable Host
		* order, with members resolved from sessionIds in their stored order. Sessions
		* outside every Workspace trail in the browser-local Ungrouped order, which
		* falls back to recency before that order is initialized.
		*/
		function groupByWorkspace(list: ClientList, workspaces: readonly ClientWorkspace[], archived: ReadonlySet<string>, ungroupedOrder: readonly string[] | undefined, showArchived: boolean) {
			const groups = [];
			const accounted = /* @__PURE__ */ new Set<string>();
			for (const workspace of workspaces) {
				const members = [];
				for (const id of workspace.sessionIds) {
					const summary = list.byId[id];
					if (summary === void 0) continue;
					accounted.add(id);
					if (!sessionVisible(summary, currentSessionId(list), archived, showArchived)) continue;
					members.push(summary);
				}
				groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
			}
			const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, currentSessionId(list), archived, showArchived));
			if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
			return groups;
		}
		/** 返回工作区中尚未归档的唯一会话数量。 */
		function archiveableWorkspaceSessionCount(workspace: ClientWorkspace, archivedSessionIds: readonly string[] | Set<string>) {
			const archived = archivedSessionIds instanceof Set ? archivedSessionIds : new Set(archivedSessionIds);
			return [...new Set(workspace.sessionIds)].filter((sessionId) => !archived.has(sessionId)).length;
		}
		/** 仅在工作区仍有活跃会话时创建批量归档确认目标。 */
		function archiveWorkspaceDialogTarget(workspaces: readonly ClientWorkspace[], workspaceId: string, title: string, archivedSessionIds: readonly string[] | Set<string>) {
			const workspace = workspaces.find((item) => item.workspaceId === workspaceId);
			if (workspace === void 0) return null;
			const count = archiveableWorkspaceSessionCount(workspace, archivedSessionIds);
			return count === 0 ? null : { workspaceId, title, count };
		}
		/** 请求失败时保留确认目标，方便用户查看错误后重试。 */
		function archiveWorkspaceDialogFailureState(target: { workspaceId: string; title: string; count: number }, reason: unknown, t: Translate) {
			return { target, archiving: false, error: formatArchiveError(reason, t) };
		}
		/** 只把侧栏已支持的待处理交互类型交给行渲染，避免未知类型触发断言。 */
		function visiblePendingKind(kind: string | undefined) {
			switch (kind) {
				case "approval":
				case "plan-review":
				case "question": return kind;
				default: return;
			}
		}
		function pendingInteractionForSession(session: ClientSession, pendingInteractions: Map<string, { kind: string }>) {
			const entry = pendingInteractions.get(session.id);
			const kind = entry === void 0 ? session.pendingInteraction : entry.kind;
			return visiblePendingKind(kind);
		}
		const EMPTY_PENDING_INTERACTIONS = new Map<string, { kind: string }>();
		const EMPTY_COMPLETED_SESSIONS = /* @__PURE__ */ new Set<string>();
		const EMPTY_SESSION_STATUS: StatusMap = new Map();
		function useEmptySessionPendingInteraction<T>(selector: (value: Map<string, { kind: string }>) => T) {
			return selector(EMPTY_PENDING_INTERACTIONS);
		}
		function useEmptySessionStatus<T>(selector: (value: StatusMap) => T) {
			return selector(EMPTY_SESSION_STATUS);
		}
		function pendingFacts(pendingInteractions: UiFacts | Map<string, { kind: string }> | undefined) {
			if (pendingInteractions instanceof Map || pendingInteractions == null) {
				return { pending: pendingInteractions ?? EMPTY_PENDING_INTERACTIONS, completed: EMPTY_COMPLETED_SESSIONS };
			}
			return {
				pending: pendingInteractions.pending ?? EMPTY_PENDING_INTERACTIONS,
				completed: pendingInteractions.completed ?? EMPTY_COMPLETED_SESSIONS
			};
		}
		function factsFromSessionStatus(status: StatusMap) {
			const pending = new Map<string, { kind: string }>();
			const completed = new Set<string>();
			if (status instanceof Map) {
				for (const [id, entry] of status) {
					if (entry?.pendingInteraction !== undefined) pending.set(id, entry.pendingInteraction);
					if (entry?.completionUnread === true) completed.add(id);
				}
			}
			return { pending, completed };
		}
		function useSessionUiFacts(usePending: PendingHook, useStatus: StatusHook, preferStatus: boolean) {
			const pending = usePending((s) => s);
			const status = useStatus((s) => s);
			return preferStatus ? factsFromSessionStatus(status) : { pending, completed: EMPTY_COMPLETED_SESSIONS };
		}
		function sessionNode(s: ClientSession, descendants: Map<string, { count: number; runningCount: number }>, archived: ReadonlySet<string>, pendingInteractions: UiFacts | Map<string, { kind: string }>) {
			const facts = pendingFacts(pendingInteractions);
			const pendingInteraction = pendingInteractionForSession(s, facts.pending);
			return {
				id: s.id,
				title: sessionTitle(s),
				blank: s.blank,
				running: s.running,
				runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
				completed: s.completed === true || facts.completed.has(s.id),
				updatedAt: s.updatedAt,
				archived: archived.has(s.id),
				...pendingInteraction === void 0 ? {} : { pendingInteraction }
			};
		}
		/**
		* Derive the workspace browser groups with every session as a top-level row.
		*
		* Every group shows; sessions populate under expanded groups in the selected
		* local order. Blank sessions are excluded except for the selected
		* provisional New Session row; archived sessions are excluded unless the
		* "show archived" view toggle is on.
		* Content search lives outside this derivation
		* (see {@link deriveSearchResults}).
		* @param list - sessions list snapshot (`current` or `retainedBy.mainView` feeds containsCurrent).
		* @param workspaces - real workspaces in stable Host order.
		* @param archivedSessionIds - registry-global archive set.
		* @param pendingInteractions - pending UI interactions by Session.
		* @param view - local expansion arrays and the show-archived toggle.
		* @returns group sections in render order.
		*/
		function deriveGroups(list: ClientList, workspaces: readonly ClientWorkspace[], archivedSessionIds: readonly string[], pendingInteractions: UiFacts | Map<string, { kind: string }>, view: { expandedGroups: string[]; ungroupedOrder?: string[]; showArchived: boolean }) {
			const archived = new Set(archivedSessionIds);
			const expandedGroups = new Set(view.expandedGroups);
			const descendants = indexSubagentDescendants(list.byId);
			const current = currentSessionId(list);
			const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
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
		/**
		* Derive the flat session list ("In one list" mode): every session — fork
		* children included — as a top-level row, strictly newest-first. No grouping,
		* no parent/child adjacency. Archived sessions are excluded unless the
		* "show archived" view toggle is on.
		* Content search lives outside this derivation
		* (see {@link deriveSearchResults}).
		* @param list - sessions list snapshot.
		* @param archivedSessionIds - registry-global archive set.
		* @param pendingInteractions - pending UI interactions by Session.
		* @param showArchived - "show archived" view toggle.
		* @returns flat rows in render order.
		*/
		function deriveFlat(list: ClientList, archivedSessionIds: readonly string[], pendingInteractions: UiFacts | Map<string, { kind: string }>, showArchived: boolean) {
			const archived = new Set(archivedSessionIds);
			const descendants = indexSubagentDescendants(list.byId);
			const rows = [];
			for (const id of list.ids) {
				const s = list.byId[id];
				if (s === void 0 || !sessionVisible(s, currentSessionId(list), archived, showArchived)) continue;
				rows.push(s);
			}
			rows.sort(byRecency);
			return rows.map((session) => sessionNode(session, descendants, archived, pendingInteractions));
		}
		/**
		* Merge immediate title/Workspace substring matches with ranked Host content
		* matches. Local rows lead newest-first, content-only rows retain backend
		* order, and duplicate sessions receive the backend snippet in place.
		* Archived sessions are excluded unless the "show archived" view toggle is on.
		* @param list - session metadata authority.
		* @param workspaces - Workspace membership and display labels.
		* @param query - caller text; surrounding whitespace is ignored.
		* @param archivedSessionIds - registry-global archive set.
		* @param pendingInteractions - pending UI interactions by Session.
		* @param content - ranked Host content-search page.
		* @param limit - protocol-owned maximum merged row count.
		* @param showArchived - "show archived" view toggle.
		* @param ungroupedLabel - 未归属工作区会话的本地化回退标签。
		* @returns bounded deduplicated flat rows and a refine-query hint bit.
		*/
		function deriveSearchResults(list: ClientList, workspaces: readonly ClientWorkspace[], query: string, archivedSessionIds: readonly string[], pendingInteractions: UiFacts | Map<string, { kind: string }>, content: { items: { sessionId: string; snippet: string }[]; hasMore: boolean }, limit: number, showArchived: boolean, ungroupedLabel = UNGROUPED_LABEL) {
			const q = query.trim().toLowerCase();
			if (q === "") return {
				items: [],
				hasMore: false
			};
			const archived = new Set(archivedSessionIds);
			const descendants = indexSubagentDescendants(list.byId);
			const workspaceBySession = new Map<string, string>();
			for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
			const labelOf = (summary: ClientSession) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd, ungroupedLabel);
			const contentBySession = new Map<string, { snippet: string }>();
			for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
			const local = [];
			for (const id of list.ids) {
				const summary = list.byId[id];
				if (summary === void 0 || summary.blank || !sessionVisible(summary, currentSessionId(list), archived, showArchived)) continue;
				if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
			}
			local.sort(byRecency);
			const ordered: ClientSession[] = [];
			const included = /* @__PURE__ */ new Set<string>();
			const include = (summary: ClientSession) => {
				if (included.has(summary.id)) return;
				included.add(summary.id);
				ordered.push(summary);
			};
			for (const summary of local) include(summary);
			for (const item of content.items) {
				const summary = list.byId[item.sessionId];
				if (summary !== void 0 && !summary.blank && sessionVisible(summary, currentSessionId(list), archived, showArchived)) include(summary);
			}
			const facts = pendingFacts(pendingInteractions);
			return {
				items: ordered.slice(0, limit).map((summary) => {
					const match = contentBySession.get(summary.id);
					const pendingInteraction = pendingInteractionForSession(summary, facts.pending);
					return {
						id: summary.id,
						title: sessionTitle(summary),
						workspace: labelOf(summary),
						running: summary.running,
						runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
						archived: archived.has(summary.id),
						...pendingInteraction === void 0 ? {} : { pendingInteraction },
						completed: summary.completed === true || facts.completed.has(summary.id),
						...match === void 0 ? {} : { snippet: match.snippet }
					};
				}),
				hasMore: content.hasMore || ordered.length > limit
			};
		}
		/**
		* Compact relative time for session rows, as a structured bucket the
		* renderer localizes ("now"/"5min"/"3h"/"2d"/"4mo"/"1y" in en).
		* @param updatedAt - epoch ms of the session's last activity.
		* @param now - current epoch ms (injected for pure rendering).
		* @returns the row's trailing time bucket and magnitude.
		*/
		function relativeTime(updatedAt: number, now: number) {
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
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/rows/Rows.module.css.mjs
		const css$2 = ".YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}";
		const tagId$2 = "@michengai/dsh-archive-manager/Rows.module.css";
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
		//#endregion
		//#region lib/types/client/rows/Rows.js
		/**
		* Workspace browser tree row components (figma Cell set 14:3080): pure presentational —
		* all data and callbacks arrive via props. Hover swaps (folder->chevron,
		* time->ellipsis, action buttons) are CSS-only. Row ... menus are visual-only
		* except workspace Rename/Delete and session Rename/Fork/Archive; the session
		* and workspace hover cards are suppressed while a menu is open.
		*/
		/** Row display title: blank rows show the localized New Session label. */
		function displayTitle(node: { blank?: boolean; title?: string; displayTitle?: string }, t: Translate) {
			return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
		}
		/** Localized compact relative time ("刚刚"/"5分钟" in zh, "now"/"5min" in en). */
		function timeLabel(updatedAt: number, now: number, t: Translate) {
			const { unit, n } = relativeTime(updatedAt, now);
			return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
		}
		/** 归档页使用绝对时间，方便在历史记录中准确辨识会话。 */
		function archiveTimeLabel(updatedAt: number, t: Translate) {
			const date = new Date(updatedAt);
			const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
			return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
		}
		/** Hover-card variant: distances wrap in the ago template; the now bucket stays bare (no "now ago"). */
		function hoverTimeLabel(updatedAt: number, now: number, t: Translate) {
			const { unit, n } = relativeTime(updatedAt, now);
			return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
		}
		/**
		* Absolute creation time through the dictionary's date template (the message
		* clock pattern): `toLocaleString` would follow the browser language, not the
		* app locale, and produce mixed-language text after a switch.
		*/
		function createdLabel(createdAt: number | undefined, t: Translate) {
			const d = new Date(createdAt ?? NaN);
			const pad2 = (v: number) => String(v).padStart(2, "0");
			return t("hover.created", { time: `${t("date.ymd", {
				y: d.getFullYear(),
				m: d.getMonth() + 1,
				d: d.getDate()
			})} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` });
		}
		/** Hover-card body: workspace title, full directory path, absolute creation time. */
		function WorkspaceHoverContent({ label, cwd, createdAt, t }: { label: string; cwd?: string; createdAt?: number; t: Translate }) {
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
		/** Pointer-position half of a row (insert line above or below). */
		function rowHalf(e: import("react").DragEvent<HTMLElement>) {
			const rect = e.currentTarget.getBoundingClientRect();
			return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		/**
		* Project (workspace) header row: folder + title;
		* hover reveals the chevron and create button, and dwelling on a real
		* Workspace shows its hover card (the ungrouped bucket has none).
		* `containsCurrent` arrives on the node (derivation fact, no renderer scan).
		* @param props.group - derived group node.
		* @param props.onToggle - expand/collapse the group.
		* @param props.onCreate - start a frontend Session inside this Workspace.
		* @param props.drag - optional workspace-row drag wiring.
		* @param props.t - the browser root's locale seat.
		* @returns the row element.
		*/
		function ProjectRowItem({ group, onToggle, onCreate, actions, drag, t }: { group: ReturnType<typeof deriveGroups>[number]; onToggle(): void; onCreate(): void; actions?: {canArchive: boolean; rename(): void; archive(): void; delete(): void }; drag?: Pick<RowDrag, "start" | "end">; t: Translate }) {
			const row = group;
			const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
			const active = group.expanded && group.containsCurrent;
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const workspaceMenuItems = [{
				id: "rename",
				label: t("rename"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
			}, ...(actions?.canArchive === true ? [{
				id: "archive-workspace",
				label: t("menu.archiveWorkspace"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
			}] : []), {
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
								/* v8 ignore next -- workspaceMenuItems carries exactly these three rows today. */
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
		/* v8 ignore next 3 -- closed-union backstop; only reached if the status is forged */
		function assertNever(value: never): never {
			throw new Error(`unknown pending interaction: ${String(value)}`);
		}
		/**
		* Session status presentation; pending interaction is primary and live activity
		* outranks completion reminders.
		*/
		function sessionStatuses(node: { running: boolean; runningSubagentCount: number; pendingInteraction?: "approval" | "plan-review" | "question"; completed?: boolean }, t: Translate): { state: "ongoing" | "warning" | "done"; label: string }[] {
			const subagents = node.runningSubagentCount === 0 ? void 0 : {
				state: "ongoing" as const,
				label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
			};
			let pending: {state: "warning"; label: string} | undefined;
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
				case void 0: break;
				/* v8 ignore next -- closed PendingInteractionStatus union */
				default: return assertNever(node.pendingInteraction);
			}
			if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
			if (node.running) {
				const primary = {
					state: "ongoing" as const,
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
		/** Primary status dot plus every status's screen-reader label, shared by the search and session rows. */
		function SessionStatusDots({ statuses }: { statuses: ReturnType<typeof sessionStatuses> }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.visuallyHidden,
				children: status.label
			}, status.label))] });
		}
		/** Hover-card body: full title, relative time, and every relevant live status. */
		function SessionHoverContent({ node, now, t }: { node: ReturnType<typeof sessionNode>; now: number; t: Translate }) {
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
		/**
		* One flat search result: title, Workspace context, and optional content
		* excerpt. Search navigation opens the session only; it does not address an
		* event inside the conversation. Archived results render with the archived
		* treatment; the browser-level open guard keeps them from opening.
		* @param props.result - merged local/content search row.
		* @param props.currentId - selected session id.
		* @param props.onOpen - open the selected session.
		* @param props.t - Workspace-browser translation seat.
		* @returns the result button.
		*/
		function SearchResultItem({ result, currentId, onOpen, t }: { result: ReturnType<typeof deriveSearchResults>["items"][number]; currentId?: string; onOpen(id: string): void; t: Translate }) {
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
		/**
		* One top-level 34px session row: status dot (pending user interaction outranks
		* own or descendant activity), title, relative time, and the row actions menu.
		* Archived rows get the archived treatment (red title + tinted background +
		* "Archived" badge), never open on click, and their menu is only
		* [Unarchive, Delete session].
		* @param props.node - derived session node.
		* @param props.currentId - selected session id (row highlight).
		* @param props.now - epoch ms for relative-time formatting.
		* @param props.onOpen - open a session by id.
		* @param props.onRename - open the session rename dialog (id + current title).
		* @param props.onFork - fork a session at its last completed turn.
		* @param props.onArchive - archive a session by id.
		* @param props.onUnarchive - unarchive a session by id.
		* @param props.onDeleteSession - request the delete-session confirmation.
		* @param props.onReveal - scroll this row into view after cross-workspace open, then acknowledge it.
		* @param props.drag - optional draggable-row wiring.
		* @param props.flat - omit the empty status slot in the hierarchy-free flat list.
		* @param props.t - the browser root's locale seat.
		* @returns the session row.
		*/
		function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, onUnarchive, onDeleteSession, onReveal, drag, flat = false, t }: { node: ReturnType<typeof sessionNode>; currentId?: string; now: number; onOpen(id: string): void; onRename(id: string, title: string): void; onFork(id: string): void; onArchive(id: string): void; onUnarchive(id: string): void; onDeleteSession(id: string, title: string): void; onReveal?: () => void; drag?: RowDrag; flat?: boolean; t: Translate }) {
			const row = node;
			const title = displayTitle(node, t);
			const selected = node.id === currentId;
			const archived = row.archived === true;
			const statuses = sessionStatuses(node, t);
			const showStatus = statuses[0].state !== "done" || row.completed;
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const rowRef = (0, react.useRef)<HTMLDivElement>(null);
			(0, react.useEffect)(() => {
				if (onReveal === void 0) return;
				rowRef.current?.scrollIntoView({ block: "nearest" });
				onReveal();
			}, [onReveal]);
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
					ref: rowRef,
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
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/WorkspacePicker.module.css.mjs
		const css$1 = "._G5b-a_modalAction{min-width:72px}._G5b-a_modalError,._G5b-a_menuStatus{margin-top:8px;font-size:12px;line-height:18px}._G5b-a_modalError{color:var(--dsw-alias-state-error-primary)}._G5b-a_menuStatus{color:var(--dsw-alias-label-secondary)}";
		const tagId$1 = "@michengai/dsh-archive-manager/WorkspacePicker.module.css";
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
		//#endregion
		//#region lib/types/client/WorkspacePicker.js
		const ADD_WORKSPACE = "::add-workspace";
		/**
		* Render the pick menu plus the adoption error dialog.
		* @param props - owner-controlled flow props.
		* @returns menu + dialog elements.
		*/
		function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }: WorkspacePickProps) {
			const workspaceSnapshot = useWorkspaces((state) => state);
			const workspaces = workspaceSnapshot.items;
			const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
			const [errorOpen, setErrorOpen] = (0, react.useState)(false);
			const [modalError, setModalError] = (0, react.useState)<string | null>(null);
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
			/** Adopt a picked directory; failures land in the folder-error dialog (Choose again reopens the flow). */
			const adoptDirectory = (path: string) => createWorkspace({ path }).then((workspace) => {
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
			/** Owner side of the flow conversation: adopt keeps the flow open (busy) until the Host answers. */
			const flowOwner: DirectoryFlowOwner = {
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
			const handleSelect = (id: string) => {
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
		/**
		* The conversation empty-state registration: adapts the owner share to the
		* core flow (all state and semantics live in the flow / the owner).
		* @param props - empty-state slot props (owner share + injected creation callback).
		* @returns the flow element.
		*/
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/WorkspaceBrowser.module.css.mjs
		const css = ".qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}";
		const tagId = "@michengai/dsh-archive-manager/WorkspaceBrowser.module.css";
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
		//#endregion
		//#region lib/types/client/WorkspaceBrowser.js
		/**
		* The workspace/session browsing region filling the sidebar shell's
		* `sidebar.workspaces` hole: section header (title + view options + add
		* workspace), search, the grouped tree or flat list, and the workspace
		* dialogs. Wide state renders the full browser; rail state renders the two
		* region icons (search / add workspace) as 36px controls on the shell's shared
		* rail entry path, each requesting expansion through the owner share. Adding
		* is the header button's one action, so it raises the directory flow with no
		* menu in between; the flow and its error dialog live in WorkspacePicker
		* (same package — direct composition, no slot between them).
		*/
		/**
		* Column slide length (--ds-transition-duration-slow): rail-search focus waits it out —
		* focus() forces a synchronous layout and would jank the slide.
		*/
		const EXPAND_SLIDE_MS = 300;
		/** Pause between the latest keystroke and a Host content-search request. */
		const SEARCH_DEBOUNCE_MS = 250;
		/** `session.search` wire bound, measured in JavaScript UTF-16 code units. */
		const SEARCH_QUERY_MAX_CODE_UNITS = 500;
		/** Session rows visible per Workspace before the local overflow control. */
		const COLLAPSED_SESSION_LIMIT = 5;
		/** Keep controlled input and RPC payload inside the session.search wire contract. */
		function sanitizeSearchQuery(value: string) {
			const withoutNul = value.replaceAll("\0", "");
			if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
			let end = SEARCH_QUERY_MAX_CODE_UNITS;
			const last = withoutNul.charCodeAt(end - 1);
			const next = withoutNul.charCodeAt(end);
			if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
			return withoutNul.slice(0, end);
		}
		/** Immutable membership toggle for the local expand-all array. */
		function toggled(list: string[], key: string) {
			return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
		}
		/**
		* Accept the native drag at document level while a row drag is active: row
		* hover still owns the insertion marker, and releasing outside the list must
		* not be rendered as a rejected drop before dragend commits that last marker.
		*/
		function useNativeDragAcceptance(active: boolean) {
			(0, react.useEffect)(() => {
				if (!active) return;
				const acceptDrag = (event: DragEvent) => {
					event.preventDefault();
					if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
				};
				const acceptDrop = (event: DragEvent) => {
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
		/** Reconcile a stored view order with the Workspace's current session account. */
		function reconciledSessionOrder(sessionIds: string[], stored: string[] | undefined) {
			if (stored === void 0) return [...sessionIds];
			const byId = new Map(sessionIds.map((id) => [id, id]));
			const ordered: string[] = [];
			const included = /* @__PURE__ */ new Set<string>();
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
		/** Newest update first with stable Session identity as the tie-break. */
		function compareSessionRecency(a: string, b: string, byId: Record<string, ClientSession>) {
			const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
			const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
			if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
			return a < b ? -1 : 1;
		}
		/** Reconcile one editable order account and apply its activity-promotion policy. */
		function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }: { sessionIds: string[]; previousOrder?: string[]; previousUpdatedAt: Record<string, number>; list: ClientList; orderBy: string; sortByRecency: boolean }) {
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
			const updatedAt: Record<string, number> = {};
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
		/** Grouping and ordering controls for the workspace browser. */
		function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }: { groupBy: string; orderBy: string; onGroupPick(value: string): void; onOrderPick(value: string): void; t: Translate }) {
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
					},
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
		/** Resolve an insertion side from the full rendered workspace group. */
		function workspaceGroupHalf(e: import("react").DragEvent<HTMLElement>) {
			const rect = e.currentTarget.getBoundingClientRect();
			return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		/** The scrolling session tree; unmounting drops the sessions subscription and expand-all state. */
		function SessionTree({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, startSession, open, forkSession, workspaces, archivedSessionIds, showArchived, onRenameRequest, onArchiveRequest, onDeleteRequest, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t, revealSessionId, onSessionRevealed, showArchivedToast }: TreeProps) {
			const list = useSessions((s) => s);
			const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
			const current = currentSessionId(list);
			const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)<string[]>([]);
			const [drag, setDrag] = (0, react.useState)<SessionDrag | null>(null);
			const sessionDropCommitted = (0, react.useRef)(false);
			const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)<WorkspaceDrag | null>(null);
			const workspaceDropCommitted = (0, react.useRef)(false);
			const previousOrderBy = (0, react.useRef)(orderBy);
			useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
			const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
			const revealGroup = revealSessionId === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(revealSessionId))?.workspaceId ?? "";
			(0, react.useEffect)(() => {
				// 与官方一致：只在从未记过展开状态时自动展开当前组。选中后仍允许用户折叠。
				if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
				setGroupExpanded(currentGroup, true);
			}, [
				current,
				currentGroup,
				setGroupExpanded,
				groupExpansion
			]);
			(0, react.useEffect)(() => {
				if (revealGroup === void 0 || groupExpansion[revealGroup] === true) return;
				setGroupExpanded(revealGroup, true);
			}, [
				groupExpansion,
				revealGroup,
				setGroupExpanded
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
					if (next.changed && typeof syncSessionOrderAccount === "function") syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
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
			(0, react.useEffect)(() => {
				if (revealSessionId === void 0 || revealGroup === void 0) return;
				const group = groups.find((candidate) => candidate.key === revealGroup);
				if (group === void 0 || !group.expanded || !group.sessions.some((row) => row.id === revealSessionId)) return;
				if (group.sessions.slice(0, COLLAPSED_SESSION_LIMIT).some((row) => row.id === revealSessionId)) return;
				setExpandedSessionGroups((keys) => keys.includes(revealGroup) ? keys : [...keys, revealGroup]);
			}, [
				groups,
				revealGroup,
				revealSessionId
			]);
			const now = Date.now();
			const commitSessionDrag = (activeDrag: SessionDrag, over: DropOver) => {
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
			const commitWorkspaceDrag = (activeDrag: WorkspaceDrag, over: DropOver) => {
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
							const hoverWorkspace = workspaceId === void 0 ? void 0 : (half: "before" | "after") => {
								setWorkspaceDrag((active) => active === null ? active : {
									...active,
									over: {
										id: workspaceId,
										half
									}
								});
							};
							const dropWorkspace = workspaceId === void 0 ? void 0 : (half: "before" | "after") => {
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
													/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
													if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
												},
												archive: () => {
													/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
													if (group.workspaceId !== void 0) onArchiveRequest(group.workspaceId, group.label);
												},
												delete: () => {
													/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
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
								void forkWithFeedback(sessionId, forkSession, showArchivedToast, t);
							},
											onArchive: onSessionArchive,
											onUnarchive: onSessionUnarchive,
											onDeleteSession: onSessionDelete,
											onReveal: node.id === revealSessionId && group.key === revealGroup ? () => {
												onSessionRevealed?.(node.id);
											} : void 0,
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
												hover: (half: "before" | "after") => {
													/* v8 ignore next -- narrowing guard: Rows gates hover on `active`, which is false while the drag state is null. */
													setDrag((d) => d === null ? d : {
														...d,
														over: {
															id: node.id,
															half
														}
													});
												},
												drop: (half: "before" | "after") => {
													/* v8 ignore next -- narrowing guard: Rows gates drop on `active`, which is false while the drag state is null. */
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
		/** The flat "In one list" body: every session is one draggable top-level row. */
		function FlatList({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, open, forkSession, onSessionRename, onSessionArchive, onSessionUnarchive, onSessionDelete, archivedSessionIds, showArchived, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t, revealSessionId, onSessionRevealed, showArchivedToast }: FlatProps) {
			const list = useSessions((s) => s);
			const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
			const current = currentSessionId(list);
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
			const [drag, setDrag] = (0, react.useState)<SessionDrag | null>(null);
			const dropCommitted = (0, react.useRef)(false);
			useNativeDragAcceptance(drag !== null);
			const commitDrag = (activeDrag: SessionDrag, over: DropOver) => {
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
							currentId: current,
							now,
							onOpen: open,
							onRename: onSessionRename,
							onFork: (sessionId) => {
								void forkWithFeedback(sessionId, forkSession, showArchivedToast, t);
							},
							onArchive: onSessionArchive,
							onUnarchive: onSessionUnarchive,
							onDeleteSession: onSessionDelete,
							onReveal: node.id === revealSessionId ? () => {
								onSessionRevealed?.(node.id);
							} : void 0,
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
								hover: (half: "before" | "after") => {
									setDrag((current) => current === null ? current : {
										...current,
										over: {
											id: node.id,
											half
										}
									});
								},
								drop: (half: "before" | "after") => {
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
		/** Flat search body: local metadata matches plus the current Host result page. */
		function SearchResults({ useSessions, useSessionPendingInteraction, useSessionStatus, preferSessionStatus, open, workspaces, archivedSessionIds, showArchived, query, remote, resultLimit, t }: SearchProps) {
			const list = useSessions((s) => s);
			const pendingInteractions = useSessionUiFacts(useSessionPendingInteraction, useSessionStatus, preferSessionStatus);
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
								currentId: currentSessionId(list),
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
		/**
		* Render the browsing region.
		* @param props - composed slot props (shell owner share + store + injected actions).
		* @returns the region element tree.
		*/
		const sidebarReveal = {
			listeners: new Set<(sessionId: string) => void>(),
			request(sessionId: string) {
				for (const listener of this.listeners) listener(sessionId);
			},
			subscribe(listener: (sessionId: string) => void) {
				this.listeners.add(listener);
				return () => { this.listeners.delete(listener); };
			}
		};
		function WorkspaceBrowser({ wide, expandSidebar, useSessions, useSessionPendingInteraction, useSessionStatus, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, archiveWorkspaceSessions, unarchiveSession, deleteSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, renderSlot, t }: BrowserProps) {
			const preferSessionStatus = typeof useSessionStatus === "function";
			const useEffectiveSessionPendingInteraction = useSessionPendingInteraction ?? useEmptySessionPendingInteraction;
			const useEffectiveSessionStatus = useSessionStatus ?? useEmptySessionStatus;
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
			const [revealSessionId, setRevealSessionId] = (0, react.useState)<string | undefined>(void 0);
			(0, react.useEffect)(() => sidebarReveal.subscribe((sessionId) => setRevealSessionId(sessionId)), []);
			const acknowledgeSessionReveal = (sessionId: string) => {
				setRevealSessionId((current) => current === sessionId ? void 0 : current);
			};
			const [archivedToast, setArchivedToast] = (0, react.useState)<{text: string; seq: number} | null>(null);
			const archivedToastSeq = (0, react.useRef)(0);
			const showArchivedToast = (text: string) => {
				archivedToastSeq.current += 1;
				setArchivedToast({
					text,
					seq: archivedToastSeq.current
				});
			};
			/** Open a session, unless it is archived (show the archived hint instead). */
			const guardedOpen = (sessionId: string) => {
				if (archivedSet.has(sessionId)) {
					showArchivedToast(t("archived.notOpenable"));
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
			const [remoteSearch, setRemoteSearch] = (0, react.useState)<RemoteSearch>({
				query: "",
				status: "idle",
				items: [],
				hasMore: false
			});
			const searchRoot = (0, react.useRef)<HTMLDivElement>(null);
			const searchInput = (0, react.useRef)<HTMLInputElement>(null);
			const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
			const wsPlusRef = (0, react.useRef)<HTMLButtonElement>(null);
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
				const onClick = (event: MouseEvent) => {
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
			const [renameTarget, setRenameTarget] = (0, react.useState)<{ workspaceId: string; currentTitle: string } | null>(null);
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const [renaming, setRenaming] = (0, react.useState)(false);
			const [renameError, setRenameError] = (0, react.useState)<string | null>(null);
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
			const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)<{ sessionId: string; currentTitle: string } | null>(null);
			const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
			const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
			const [sessionRenameError, setSessionRenameError] = (0, react.useState)<string | null>(null);
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
			const onSessionRename = (sessionId: string, currentTitle: string) => {
				setSessionRenameTarget({
					sessionId,
					currentTitle
				});
				setSessionRenameDraft(currentTitle);
				setSessionRenameError(null);
			};
			const [stopArchiveTarget, setStopArchiveTarget] = (0, react.useState)<{ sessionId: string; title: string; kinds: string } | null>(null);
			const [stoppingArchive, setStoppingArchive] = (0, react.useState)(false);
			const [stopArchiveError, setStopArchiveError] = (0, react.useState)<string | null>(null);
			const closeStopArchive = () => {
				if (stoppingArchive) return;
				setStopArchiveTarget(null);
				setStopArchiveError(null);
			};
			const onSessionArchive = (sessionId: string) => {
				archiveSession(sessionId).catch((reason) => {
					const kinds = activeSessionActivity(reason);
					if (kinds !== undefined) {
						const session = sessionSnapshot.byId[sessionId];
						setStopArchiveTarget({ sessionId, title: session === undefined ? sessionId : displayTitle(session, t), kinds: kinds.join(", ") });
						setStopArchiveError(null);
						return;
					}
					showArchivedToast(formatArchiveError(reason, t));
				});
			};
			const confirmStopArchive = () => {
				if (stoppingArchive || stopArchiveTarget === null) return;
				setStoppingArchive(true);
				setStopArchiveError(null);
				archiveSession(stopArchiveTarget.sessionId, { stopActivity: true }).then(() => {
					setStoppingArchive(false);
					setStopArchiveTarget(null);
				}).catch((reason) => {
					setStoppingArchive(false);
					setStopArchiveError(formatArchiveError(reason, t));
				});
			};
			const [archiveWorkspaceTarget, setArchiveWorkspaceTarget] = (0, react.useState)<{workspaceId: string; title: string; count: number} | null>(null);
			const [archivingWorkspace, setArchivingWorkspace] = (0, react.useState)(false);
			const [archiveWorkspaceError, setArchiveWorkspaceError] = (0, react.useState)<string | null>(null);
			const closeArchiveWorkspace = () => {
				if (archivingWorkspace) return;
				setArchiveWorkspaceTarget(null);
				setArchiveWorkspaceError(null);
			};
			const onArchiveWorkspaceRequest = (workspaceId: string, title: string) => {
				const target = archiveWorkspaceDialogTarget(workspaces, workspaceId, title, archivedSet);
				if (target === null) return;
				setArchiveWorkspaceTarget(target);
				setArchiveWorkspaceError(null);
			};
			const confirmArchiveWorkspace = () => {
				/* v8 ignore next -- the Modal is absent without a target and its button is disabled while archiving. */
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
			const [deleteTarget, setDeleteTarget] = (0, react.useState)<{workspaceId: string; title: string} | null>(null);
			const [deleting, setDeleting] = (0, react.useState)(false);
			const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)<string | null>(null);
			const [deleteError, setDeleteError] = (0, react.useState)<string | null>(null);
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
				/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
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
			const onSessionUnarchive = (sessionId: string) => {
				unarchiveSession(sessionId).catch((reason) => {
					showArchivedToast(formatUnarchiveError(reason, t));
				});
			};
			const [deleteSessionTarget, setDeleteSessionTarget] = (0, react.useState)<{sessionId: string; title: string} | null>(null);
			const [deletingSession, setDeletingSession] = (0, react.useState)(false);
			const [deleteSessionCommittedId, setDeleteSessionCommittedId] = (0, react.useState)<string | null>(null);
			const [deleteSessionError, setDeleteSessionError] = (0, react.useState)<string | null>(null);
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
				/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
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
								renderDirectoryFlow: (owner) => renderSlot(DIRECTORY_FLOW_SLOT, owner),
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
							useSessionStatus: useEffectiveSessionStatus,
							preferSessionStatus,
							open: (sessionId) => {
								setRevealSessionId(sessionId);
								setQuery("");
								setSearchExpanded(false);
								guardedOpen(sessionId);
							},
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
							useSessionStatus: useEffectiveSessionStatus,
							preferSessionStatus,
							open: guardedOpen,
							revealSessionId,
							onSessionRevealed: acknowledgeSessionReveal, showArchivedToast,
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
							useSessionStatus: useEffectiveSessionStatus,
							preferSessionStatus,
							revealSessionId,
							onSessionRevealed: acknowledgeSessionReveal, showArchivedToast,
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
					(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: stopArchiveTarget !== null,
						onClose: closeStopArchive,
						closeLabel: t("close"),
						title: t("archiveActive.title"),
						...stopArchiveTarget === null ? {} : { description: t("archiveActive.desc", { name: stopArchiveTarget.title, kinds: stopArchiveTarget.kinds }) },
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: stoppingArchive,
							onClick: closeStopArchive,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: "dsham_archiveWorkspaceConfirm",
							disabled: stoppingArchive,
							onClick: confirmStopArchive,
							children: t("archiveActive.confirm")
						})] }),
						children: [stoppingArchive && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.deleteStatus,
							role: "status",
							children: t("archiveActive.pending")
						}), stopArchiveError !== null && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.renameError,
							role: "alert",
							children: stopArchiveError
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
		//#endregion
		//#region dsh-archive-manager: settings section
		const ARCHIVE_TABS_CSS = ".dsham_archiveTabs{display:flex;gap:24px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_archiveTab{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:12px 2px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-weight:600;cursor:pointer}.dsham_archiveTab[aria-selected=true]{border-bottom-color:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary)}.dsham_archiveTab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dsham_archiveTab:disabled{opacity:.5;cursor:not-allowed}.dsham_archiveTabsLocked{opacity:.5}@container(max-width:520px){.dsham_archiveTabs{gap:16px}}";
		const ARCHIVE_SETTINGS_CSS = ".dsham_settings{container-type:inline-size;min-width:0;box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dsham_settingsHeader{display:flex;flex-direction:column;align-items:stretch;gap:16px;margin-bottom:16px}.dsham_settings h2{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;white-space:nowrap}.dsham_settingsIntro{margin:12px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}.dsham_settingsToolbar{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}.dsham_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0}.dsham_settingsFilters{display:flex;align-items:center;flex-wrap:nowrap;gap:8px;min-width:0}.dsham_settingsSort{display:flex;align-items:center;gap:8px;margin-left:auto;flex:none}.dsham_settingsSortLabel{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;white-space:nowrap}.dsham_settingsFilter{width:100%;min-width:0}.dsham_settingsSearch .dsham_settingsFilter{flex:none;width:128px}.dsham_settingsFilters>.dsham_settingsFilter{flex:1 1 112px;width:auto;min-width:96px;max-width:148px}.dsham_settingsFilters>.dsham_projectFilter{flex:none;width:128px;min-width:128px;max-width:128px}.dsham_projectFilter .ant-select-selection-item{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsSort .dsham_settingsFilter{flex:none;width:128px}@container(max-width:560px){.dsham_settingsFilters{flex-wrap:wrap}}.dsham_settingsSearch .ant-input-affix-wrapper,.dsham_settingsSearch .dsham_searchField{flex:1;min-width:0;width:auto}.dsham_menuLabel{display:inline-flex;align-items:center;gap:8px;line-height:22px}.dsham_menuLabel svg{position:static;display:block;width:16px;height:16px;flex:none}.dsham_settingsGroup{margin:0 0 20px}.dsham_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.dsham_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.dsham_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}.dsham_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}.dsham_settingsList{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.ant-list-item.dsham_settingsRow{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:64px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.ant-list-item.dsham_settingsRow:last-child{border-bottom:0}.dsham_settingsRow{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:64px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsRow:last-child{border-bottom:0}.dsham_settingsContent{min-width:0;flex:1}.dsham_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsMeta{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dsham_settingsActions{display:flex;align-items:center;gap:4px;flex:none}.dsham_settingsAction{min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsAction:hover{filter:brightness(1.12)}.dsham_settingsDelete{display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dsham_settingsDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}.dsham_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}@container(max-width:520px){.dsham_settingsHeader{margin-bottom:16px}.dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:16px}.dsham_settingsSearch{grid-column:1/-1}.dsham_settingsFilter{flex:1;min-width:0}.dsham_settingsGroup{margin-bottom:32px}.dsham_settingsRow{padding:10px 12px}.dsham_settingsActions{gap:4px}}";
		const ARCHIVE_SETTINGS_BATCH_CSS = ".dsham_settingsTitleLink{display:block;max-width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:600;line-height:20px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.dsham_settingsTitleLink:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px}.dsham_settingsTitleLink:disabled{cursor:default;opacity:.6}.dsham_groupToggle{display:flex;align-items:center;gap:8px;min-width:0;max-width:100%;padding:4px 0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.dsham_groupToggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsRow[data-selected=true]{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsTitleLink:focus-visible,.dsham_groupToggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:2px}@container(max-width:620px){.dsham_settingsToolbar{grid-template-columns:repeat(3,minmax(0,1fr))}.dsham_settingsSearch{grid-column:1/-1}}@container(max-width:400px){.dsham_settingsRow{gap:8px;padding:10px 8px}.dsham_settingsActions{gap:0}.dsham_settingsMeta{font-size:11px}}.dsham_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:wrap}.dsham_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}.ant-btn.dsham_favoriteOn{--ant-btn-text-color:#e8b931;--ant-btn-text-color-hover:#e8b931;--ant-btn-text-color-active:#e8b931;color:#e8b931}";
		const ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS = ".dsham_settingsTitleRow{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}.dsham_settingsLinks{display:flex;align-items:center;gap:8px;flex-wrap:wrap}@media(max-width:720px){.dsham_settingsTitleRow{flex-wrap:wrap}}";
		const ARCHIVE_WORKSPACE_CONFIRM_CSS = ".dsham_archiveWorkspaceConfirm{color:var(--dsw-alias-state-error-primary)!important;background:transparent!important;border-color:var(--dsw-alias-state-error-primary)!important}.dsham_archiveWorkspaceConfirm:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)!important}.dsham_archiveWorkspaceConfirm:focus-visible{outline:2px solid var(--dsw-alias-state-error-secondary);outline-offset:2px}.dsham_archiveWorkspaceConfirm:disabled{cursor:not-allowed;opacity:.5}";
		const ARCHIVE_SETTINGS_SELECTION_CSS = ".dsham_settingsSelection{margin:-8px 0 16px;padding:4px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsSelectionMain{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;min-height:36px}.dsham_settingsSelectionSummary{display:flex;flex-wrap:wrap;align-items:center;gap:12px;min-width:0;max-width:100%}.dsham_settingsSelectionToggle{display:inline-flex;flex:none;white-space:nowrap;align-items:center;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;cursor:pointer}.dsham_settingsSelectionClear{flex:none;min-height:28px;padding:0 0 0 12px;border:0;border-left:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-state-business-primary,#3b82f6);font:inherit;font-size:13px;white-space:nowrap;cursor:pointer}.dsham_settingsSelectionClear:hover:not(:disabled){text-decoration:underline}.dsham_settingsSelectionActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;max-width:100%;margin-left:auto}.dsham_settingsSelectionAction{flex:none;white-space:nowrap;min-height:32px;padding:0 14px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dsham_settingsSelectionAction:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsSelectionArchive,.dsham_settingsSelectionScope{margin:8px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow-wrap:anywhere}.dsham_settingsSelectionAction:disabled,.dsham_settingsSelectionClear:disabled{cursor:not-allowed;opacity:.5}.dsham_settingsSelectionAction:focus-visible,.dsham_settingsSelectionClear:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:3px}";
		const ARCHIVE_SETTINGS_LAYOUT_OVERRIDE = ".dsham_settings{margin:0 auto!important}@media(max-width:720px){.dsham_settings{margin:0 auto!important}}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-archive-manager/ArchiveSettings.layout.css") + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@michengai/dsh-archive-manager";
			tag.dataset.pluginCss = "dsh-archive-manager/ArchiveSettings.layout.css";
			tag.textContent = ARCHIVE_SETTINGS_LAYOUT_OVERRIDE + ARCHIVE_WORKSPACE_CONFIRM_CSS;
			document.head.appendChild(tag);
		}
		/** 设置页筛选使用 Ant Design 下拉，收起时显示当前选项。 */
		function ArchiveProjectSelect({ id, className, value, options, onChange, disabled = false, "aria-label": ariaLabel }: { id?: string; className?: string; value: string; options: {value: string; label: string; title?: string}[]; onChange(value: string): void; disabled?: boolean; "aria-label": string }) {
			const current = options.find((option) => option.value === value);
			return (0, react_jsx_runtime.jsx)(AntdSelect, {
				id, className: className === undefined ? "dsham_settingsFilter" : `dsham_settingsFilter ${className}`, "aria-label": ariaLabel, disabled, value, options,
				title: current?.title ?? current?.label, popupMatchSelectWidth: false,
				onChange: (next) => { if (!disabled) onChange(String(next)); }
			});
		}
		/** 选择摘要与动作分组显示；跨筛选范围单独提示，避免被紧凑布局隐藏。 */
		function ArchiveSelectionToolbar({ selectedCount, hiddenCount, allVisibleSelected, selectedVisibleCount, visibleCount, busy, t, onToggle, onClear, onRestore, onDelete, onArchive }: { selectedCount: number; hiddenCount: number; allVisibleSelected: boolean; selectedVisibleCount: number; visibleCount: number; busy: boolean; t: Translate; onToggle(value: boolean): void; onClear(): void; onRestore?: () => void; onDelete?: () => void; onArchive?: () => void }) {
			const hasSelection = selectedCount > 0;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsham_settingsSelection",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: "dsham_settingsSelectionMain",
					children: [(0, react_jsx_runtime.jsxs)("div", {
						className: "dsham_settingsSelectionSummary",
						children: [(0, react_jsx_runtime.jsxs)("label", {
							className: "dsham_settingsSelectionToggle",
							title: t("archives.selectAllFiltered"),
							children: [(0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, {
								checked: allVisibleSelected, indeterminate: selectedVisibleCount > 0 && !allVisibleSelected,
								disabled: busy || visibleCount === 0, label: t("archives.selectAllFiltered"),
								onChange: (event) => onToggle(event.target.checked)
							}), (0, react_jsx_runtime.jsx)("span", { "aria-live": "polite", children: hasSelection ? t("archives.selectedCount", { n: selectedCount }) : t("archives.selectAllFiltered") })]
						}), hasSelection && settingsButton({ disabled: busy, "aria-label": t("archives.clearSelection"), onClick: onClear, children: t("archives.clearSelectionShort") })]
					}), hasSelection && (0, react_jsx_runtime.jsxs)("div", {
						className: "dsham_settingsSelectionActions",
						children: onArchive ? [settingsButton({ disabled: busy, onClick: onArchive, children: t("archives.archiveSelected") })] : [settingsButton({ disabled: busy, "aria-label": t("archives.restoreSelected"), onClick: onRestore, children: t("archives.restore") }), settingsButton({ danger: true, disabled: busy, "aria-label": t("archives.deleteSelected"), onClick: onDelete, children: t("archives.deleteSelectionShort") })]
					})]
				}), hiddenCount > 0 && (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsSelectionScope", role: "status", children: t("archives.selectionHiddenHint", { hidden: hiddenCount }) })]
			});
		}
		function ArchiveSelectionCheckbox({ checked, indeterminate = false, disabled = false, label, onChange }: { checked: boolean; indeterminate?: boolean; disabled?: boolean; label: string; onChange: (event: { target: { checked: boolean } }) => void }) {
			return (0, react_jsx_runtime.jsx)(AntdCheckbox, { checked, indeterminate, disabled, "aria-label": label, onChange });
		}
		/** 会话行上的更多操作，弹出层用 Ant Design 菜单。 */
		function ArchivedSessionMenu({ busy, title, t, onPreview, onRestoreOpen, onDelete, onCopyId, onCopyPath }: { busy: boolean; title: string; t: Translate; onPreview?: () => void; onRestoreOpen?: () => void; onDelete?: () => void; onCopyId?: () => void; onCopyPath?: () => void }) {
			const choose = (id: string) => { if (busy) return; if (id === "copyId") return onCopyId?.(); if (id === "copyPath") return onCopyPath?.(); if (id === "preview") return onPreview?.(); if (id === "restoreOpen") return onRestoreOpen?.(); if (id === "delete") onDelete?.(); };
			const items = [
				...onPreview ? [{ id: "preview", label: t("discovery.preview"), danger: false }] : [],
				...onRestoreOpen ? [{ id: "restoreOpen", label: t("archives.restoreOpen"), danger: false }] : [],
				...onCopyId ? [{ id: "copyId", label: t("details.copyId"), danger: false }] : [],
				...onCopyPath ? [{ id: "copyPath", label: t("details.copyPath"), danger: false }] : [],
				...onDelete ? [{ id: "delete", label: t("menu.deleteSession"), danger: true }] : []
			];
			return (0, react_jsx_runtime.jsx)(AntdDropdown, {
				trigger: ["click"], placement: "bottomRight",
				menu: { items: items.map((item) => ({ key: item.id, label: item.label, danger: item.danger, disabled: busy, onClick: () => choose(item.id) })) },
				children: settingsButton({ variant: "ghost", disabled: busy, title: t("archives.moreActions"), "aria-label": t("archives.moreActions") + t("common.separator") + title, "aria-haspopup": "menu", icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {}) })
			});
		}
		/** 项目标题右侧的批量菜单，向左展开，归档项保持危险色。 */
		function ArchivedGroupActions({ group, busy, onArchive, onRestore, onDelete, t }: { group: ArchivedGroup; busy: boolean; onArchive?: () => void; onRestore?: () => void; onDelete?: () => void; t: Translate }) {
			const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
			const menuLabelNode = (icon: import("react").ReactNode, text: string) => (0, react_jsx_runtime.jsxs)("span", { className: "dsham_menuLabel", children: [icon, text] });
			const items = onArchive ? [{
				id: "archive",
				label: menuLabelNode((0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 }), t(ungrouped ? "archives.archiveUngrouped" : "archives.archiveProject")),
				danger: true
			}] : [{
				id: "restore",
				label: menuLabelNode((0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, { size: 16 }), t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject")),
				danger: false
			}, {
				id: "delete",
				label: menuLabelNode((0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 16 }), t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject")),
				danger: true
			}];
			const menuLabel = t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title });
			const choose = (id: string) => {
				if (busy) return;
				if (id === "archive") onArchive?.();
				else if (id === "restore") onRestore?.();
				else if (id === "delete") onDelete?.();
			};
			return (0, react_jsx_runtime.jsx)(AntdDropdown, {
				trigger: ["click"], placement: "bottomRight",
				menu: { items: items.map((item) => ({ key: item.id, label: item.label, danger: item.danger, disabled: busy, onClick: () => choose(item.id) })) },
				children: settingsButton({
					variant: "ghost", disabled: busy, "aria-label": menuLabel, "aria-haspopup": "menu",
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
				})
			});
		}
		/** 设置页“未分组”桶的稳定 key（workspaceId 均为非空 uuid，不会冲突）。 */
		const ARCHIVE_UNGROUPED_KEY = "__ungrouped__";
		function archivedBatchTargetForGroup(groupKey: string): BatchTarget {
			return groupKey === ARCHIVE_UNGROUPED_KEY ? { scope: "ungrouped" } : { scope: "workspace", workspaceId: groupKey };
		}
		/** 客户端按当前快照派生批量目标。删除仍由宿主按持久集合解析；恢复已在客户端串行执行。 */
		function deriveArchivedBatchIds(archivedSessionIds: readonly string[], items: readonly ClientWorkspace[], target: BatchTarget) {
			const ids = [...new Set(archivedSessionIds ?? [])];
			if (target.scope === "all") return ids;
			if (target.scope === "sessions") {
				const selected = new Set(target.sessionIds ?? []);
				return ids.filter((id) => selected.has(id));
			}
			if (target.scope === "workspace") {
				const accounted = new Set(items.find((workspace) => workspace.workspaceId === target.workspaceId)?.sessionIds ?? []);
				return ids.filter((id) => accounted.has(id));
			}
			const accounted = new Set(items.flatMap((workspace) => workspace.sessionIds));
			return ids.filter((id) => !accounted.has(id));
		}
		/** 当前筛选结果中的可选会话；按列表显示顺序去重。 */
		function archivedSessionIdsInGroups(groups: readonly ArchivedGroup[]) {
			return [...new Set(groups.flatMap((group) => group.sessions.map((session) => session.id)))];
		}
		/** 只保留仍属于权威归档集合的选中项，避免对已变化的列表执行旧操作。 */
		function pruneArchivedSelection(selectedSessionIds: readonly string[], archivedSessionIds: readonly string[]) {
			const archived = new Set(archivedSessionIds);
			return [...new Set(selectedSessionIds)].filter((id) => archived.has(id));
		}
		/** 向当前选择中加入或移除一组可见会话，供“全选筛选结果”复用。 */
		function toggleArchivedSelection(selectedSessionIds: readonly string[], sessionIds: readonly string[], checked: boolean) {
			const selected = new Set(selectedSessionIds);
			for (const sessionId of sessionIds) {
				if (checked) selected.add(sessionId);
				else selected.delete(sessionId);
			}
			return [...selected];
		}
		/** 把批量删除结果转换为准确区分“已删除”与“陈旧标记已清理”的反馈。 */
		function archivedDeleteFeedback(result: DeletedBatch, t: Translate) {
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
		/** 普通非空用户会话可归档；子代理与空占位会话不进入整理列表。 */
		function unarchivedSessionIds(byId: Record<string, ClientSession>, archivedSessionIds: readonly string[]) {
			const archived = new Set(archivedSessionIds);
			return Object.values(byId).filter((session) => session.origin !== "subagent" && !session.blank && !archived.has(session.id)).map((session) => session.id);
		}
		/**
		* 设置页归档分组派生：按工作区分组，组 key 用 workspaceId（上游允许
		* 不同路径的工作区同名，title 不能作 React key / 筛选 value），未归入
		* 任何工作区的归档会话进“未分组”桶；隐藏 subagent（其删除由服务端级联）。
		* @param byId - 会话摘要表（缺失摘要的归档会话不进列表）。
		* @param items - 工作区列表（Host 顺序，含唯一 workspaceId）。
		* @param archivedSessionIds - 注册表全局归档集合。
		* @param ungroupedLabel - “未分组”显示文案。
		* @returns 分组数组（仅含有会话的组），每项含 key / title / sessions。
		*/
		function deriveArchivedGroups(byId: Record<string, ClientSession>, items: readonly ClientWorkspace[], archivedSessionIds: readonly string[], ungroupedLabel: string) {
			const byWorkspace: ArchivedGroup[] = items.map((workspace) => ({
				key: workspace.workspaceId,
				title: workspace.title,
				ids: new Set(workspace.sessionIds),
				sessions: []
			}));
			const ungrouped: ClientSession[] = [];
			for (const id of archivedSessionIds) {
				const session = byId[id];
				if (session === void 0 || session.origin === "subagent") continue;
				const group = byWorkspace.find((workspace) => workspace.ids?.has(id));
				(group === void 0 ? ungrouped : group.sessions).push(session);
			}
			const result = byWorkspace.filter((group) => group.sessions.length > 0);
			if (ungrouped.length > 0) result.push({ key: ARCHIVE_UNGROUPED_KEY, title: ungroupedLabel, sessions: ungrouped });
			return result;
		}
		/**
		* 归档设置页排序：时间排序同时按每组首条会话排列项目，字母排序则
		* 同时排列项目名和组内标题；所有输入均复制后排序，不改写 store 快照。
		*/
		function sortArchivedGroups(groups: readonly ArchivedGroup[], sortBy: string, createdAtById: Record<string, number>, t: Translate, details: Record<string, SessionDetail> = {}) {
			const compareText = (left: unknown, right: unknown) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
			const timestampOf = (session: ClientSession) => {
				const value = sortBy === "created" ? (details[session.id]?.createdAt ?? createdAtById[session.id]) : session.updatedAt;
				return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
			};
			const compareSessions = (left: ClientSession, right: ClientSession) => {
                if (sortBy === "turnsAsc" || sortBy === "turnsDesc") {
                    const difference = compareTurnCounts(details[left.id]?.turnCount, details[right.id]?.turnCount, sortBy);
                    if (difference) return difference;
                }
				if (sortBy !== "alphabetical") {
					const byTime = timestampOf(right) - timestampOf(left);
					if (Number.isFinite(byTime) && byTime !== 0) return byTime;
				}
				return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
			};
			const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
			return result.sort((left, right) => {
                if (sortBy === "turnsAsc" || sortBy === "turnsDesc") {
                    const difference = compareTurnCounts(details[left.sessions[0]?.id]?.turnCount, details[right.sessions[0]?.id]?.turnCount, sortBy);
                    if (difference) return difference;
                }
				if (sortBy !== "alphabetical") {
					const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
					if (Number.isFinite(byTime) && byTime !== 0) return byTime;
				}
				return compareText(left.title, right.title) || compareText(left.key, right.key);
			});
		}

		const zh = {
			...organizerZh, ...discoveryZh, ...healthZh,
            "locale.language": "zh", "service.unavailable": "服务尚未就绪，请重试",
			"archives.archiveProject": "归档该项目的全部聊天",
			"archives.archiveUngrouped": "归档全部未分组聊天",
			"archives.archiveProjectDesc": "将“{name}”中全部 {n} 条未归档会话归档，不受当前搜索筛选影响。之后可在“已归档”中恢复。",
			"archives.archiveUngroupedDesc": "将全部 {n} 条未分组的未归档会话归档，不受当前搜索筛选影响。之后可在“已归档”中恢复。",

			"archives.tab.archived": "已归档",
			"archives.tab.unarchived": "未归档",
			"archives.searchUnarchived": "搜索未归档聊天",
			"archives.emptyUnarchived": "暂无未归档会话。",
			"archives.archiveSelected": "归档",
			"archives.openSession": "打开",
			"archives.moreActions": "更多操作",
			"archives.archiveSelectedDesc": "将选中的会话归档，包含当前筛选隐藏的已选项。之后可在“已归档”中查看和恢复。",
			"archives.archiveSuccess": "已归档 {n} 条会话。",
			"archives.archiveBatchFailed": "批量归档失败：{detail}",

			"archives.navigationUnavailable": "当前宿主无法保持归档对话，请使用“恢复并打开”。",
			"archives.sessionNotRetained": "宿主未保留目标会话，请重新打开或恢复后再试。",
			"archives.restoreOpen": "恢复打开",
			"archives.selectedCount": "已选 {n} 条",
			"archives.selectionHiddenHint": "含当前未显示的 {hidden} 条，也将参与操作",
			"archives.clearSelectionShort": "清空",
			"archives.restore": "恢复",
			"archives.archiveTitle": "归档 {n} 个聊天？",
			"archives.deleteSelectionShort": "删除",
			"archives.clearSelection": "清空选择",

			"group.ungrouped": "未分组",
			"session.new": "新会话",
			"section.workspaces": "工作区",
			"section.sessions": "会话",
			"viewOptions.label": "视图选项",
			"groupBy.label": "分组方式",
			"groupBy.workspace": "按工作区",
			"groupBy.flat": "单列表",
			"orderBy.label": "排序方式",
			"orderBy.manual": "手动排序",
			"orderBy.updated": "最近更新",
			"sessions.expand": "展开其余 {n} 个会话",
			"sessions.collapse": "收起",
			"empty.none": "暂无会话",
			"workspace.add": "添加工作区",
			"search.sessions.aria": "搜索会话",
			"search.placeholder": "搜索会话…",
			"search.clear": "清除搜索",
			"search.results.aria": "搜索结果",
			"search.pending": "正在搜索会话历史…",
			"search.unavailable": "内容搜索暂不可用，仅显示名称匹配。",
			"search.noMatches": "无匹配会话",
			"search.hasMore": "仅显示前 {n} 条结果，请缩小搜索范围。",
			"menu.addWorkspace": "添加工作区…",
			"menu.unarchive": "取消归档",
			"menu.deleteSession": "删除会话",
			"archived.badge": "归档会话",
			"archived.notOpenable": "已归档，取消归档后可继续对话",
			"archives.title": "归档会话",
			"archives.description": "管理已归档会话，或选择未归档会话进行批量归档。",
			"archives.viewProject": "GitHub",
			"archives.feedback": "问题反馈",
			"archives.empty": "暂无已归档会话",
			"archives.emptyFiltered": "没有符合筛选条件的聊天",
			"archives.searchPlaceholder": "搜索已归档聊天",
			"archives.sortBy": "排序方式",
			"archives.sortLabel": "排序",
			"archives.sortUpdated": "更新时间",
			"archives.sortCreated": "创建时间",
			"archives.sortAlphabetical": "按字母顺序",
			"archives.projectFilter": "按项目筛选",
			"archives.allProjects": "所有项目",
			"archives.sessionCount": "{n} 个聊天",
			"archives.selectAllFiltered": "全选当前筛选结果",
			"archives.selectSession": "选择会话“{name}”",
			"archives.restoreSelected": "恢复所选",
			"archives.deleteSelected": "删除所选",
			"archives.timestamp": "{date}，{time}",
			"archives.restoreProject": "恢复项目全部聊天",
			"archives.restoreUngrouped": "全部恢复",
			"archives.deleteProject": "删除项目全部聊天",
			"archives.deleteUngrouped": "全部删除",
			"archives.projectActions": "项目“{name}”的归档操作",
			"archives.ungroupedActions": "未分组聊天的归档操作",
			"archives.restoreSuccess": "已恢复 {n} 个已归档聊天。",
			"archives.restoreBatchFailed": "批量恢复失败：{detail}",
			"archives.deleteSelectedTitle": "删除所选已归档聊天",
			"archives.deleteSelectedDesc": "将永久删除所选的 {n} 个已归档聊天及其子代理（含正在运行的）和记录。其他聊天不会受影响，此操作不可恢复。",
			"archives.deleteSelectedConfirm": "删除所选聊天",
			"archives.deleteProjectTitle": "删除“{name}”中的已归档聊天",
			"archives.deleteProjectDesc": "将永久删除“{name}”中的 {n} 个已归档聊天及其子代理和记录。项目目录和未归档聊天不会受影响，此操作不可恢复。",
			"archives.deleteProjectConfirm": "删除项目全部聊天",
			"archives.deleteUngroupedTitle": "删除未分组的已归档聊天",
			"archives.deleteUngroupedDesc": "将永久删除未分组中的 {n} 个已归档聊天及其子代理和记录。其他项目和未归档聊天不会受影响，此操作不可恢复。",
			"archives.deleteUngroupedConfirm": "删除未分组的全部聊天",
			"archives.deleteBatchPending": "正在删除已归档聊天…",
			"archives.deleteSuccess": "已删除 {n} 个已归档聊天。",
			"archives.deleteSuccessWithSkipped": "已删除 {deleted} 个已归档聊天；另清理 {skipped} 个已不存在会话的归档记录。",
			"archives.deleteSkipped": "已清理 {n} 个已不存在会话的归档记录。",
			"archives.deletePartial": "已删除 {deleted} 个聊天，清理 {skipped} 个已不存在会话的归档记录；{failed} 个删除失败：{detail}",
			"archives.unarchiveUnknown": "会话已不存在，无法取消归档。",
			"archives.unarchiveFailed": "取消归档失败：{detail}",
			"archives.archiveUnknown": "会话已不存在，无法归档。",
			"archives.archiveFailed": "归档失败：{detail}",
			"archives.archiveActive": "会话仍在运行（{kinds}）。",
			"archiveActive.title": "停止并归档",
			"archiveActive.desc": "“{name}”仍有正在进行的工作：{kinds}。归档前会停止这些工作。",
			"archiveActive.confirm": "停止并归档",
			"archiveActive.pending": "正在停止并归档…",
			"archives.forkFailed": "分叉会话失败：{detail}",
			"deleteSession.title": "删除会话",
			"deleteSession.desc": "将永久删除会话“{name}”及其子代理（含正在运行的）和全部记录（对话内容、统计、缓存），此操作不可恢复。",
			"deleteSession.pending": "正在删除会话…",
			"deleteSession.unknown": "会话已不存在或已被删除。",
			"deleteSession.failed": "删除会话失败：{detail}",
			"picker.loading": "正在加载工作区…",
			"conflict.named": "已存在名为“{name}”的工作区。",
			"folderError.title": "无法打开文件夹",
			"folderError.retry": "重新选择",
			"rename": "重命名",
			"rename.workspace.title": "重命名工作区",
			"rename.session.title": "重命名会话",
			"field.workspaceName": "工作区名称",
			"field.sessionName": "会话名称",
			"delete.workspace": "删除工作区",
			"delete.desc": "将把“{name}”从工作区列表中移除。文件夹与会话记录会保留，其会话将显示在“未分组”下。",
			"delete.pending": "正在删除工作区…",
			"menu.fork": "分叉会话",
			"menu.archiveSession": "归档会话",
			"menu.archiveWorkspace": "归档全部聊天",
			"archiveWorkspace.title": "归档 {n} 个聊天？",
			"archiveWorkspace.desc": "这会将“{name}”中的聊天归档。之后你可以在已归档的聊天中找到它们。",
			"archiveWorkspace.confirm": "全部归档",
			"archiveWorkspace.pending": "正在归档聊天…",
			"actions.workspace.aria": "工作区“{name}”的操作",
			"actions.session.aria": "会话“{name}”的操作",
			"actions.newSession.aria": "在“{name}”中新建会话",
			"status.running": "进行中",
			"status.subagentsRunning.one": "{n} 个子代理运行中",
			"status.subagentsRunning.other": "{n} 个子代理运行中",
			"status.idle": "空闲",
			"status.waitingApproval": "等待审批",
			"status.planReview": "计划待审",
			"status.waitingAnswer": "等待回答",
			"status.completed": "已完成",
			"hover.created": "创建于 {time}",
			"hover.copied": "已复制",
			"date.ymd": "{y}年{m}月{d}日",
			"time.now": "刚刚",
			"time.minutes": "{n}分钟",
			"time.hours": "{n}小时",
			"time.days": "{n}天",
			"time.months": "{n}个月",
			"time.years": "{n}年",
			"time.ago": "{t}前"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			...organizerEn, ...discoveryEn, ...healthEn,
            "locale.language": "en", "service.unavailable": "The service is not ready. Please retry.",
			"archives.moreActions": "More actions",
			"archives.archiveProject": "Archive all chats in this project",
			"archives.archiveUngrouped": "Archive all ungrouped chats",
			"archives.archiveProjectDesc": "Archive all {n} unarchived sessions in “{name}”, regardless of the current search filter. You can restore them in Archived.",
			"archives.archiveUngroupedDesc": "Archive all {n} ungrouped, unarchived sessions, regardless of the current search filter. You can restore them in Archived.",

			"archives.tab.archived": "Archived",
			"archives.tab.unarchived": "Unarchived",
			"archives.searchUnarchived": "Search unarchived chats",
			"archives.emptyUnarchived": "No unarchived sessions.",
			"archives.archiveSelected": "Archive",
			"archives.openSession": "Open session",
			"archives.archiveSelectedDesc": "Archive the selected sessions, including selections hidden by the current filter. You can view and restore them in Archived.",
			"archives.archiveSuccess": "Archived {n} sessions.",
			"archives.archiveBatchFailed": "Batch archive failed: {detail}",

			"archives.navigationUnavailable": "This host cannot keep the conversation archived while opening it. Use “Restore and open” instead.",
			"archives.sessionNotRetained": "The host did not keep the requested conversation open. Try again, or restore it before opening.",
			"archives.restoreOpen": "Restore and open",
			"archives.selectedCount": "{n} selected",
			"archives.selectionHiddenHint": "Includes {hidden} hidden by the current filter; actions apply to them too.",
			"archives.clearSelectionShort": "Clear",
			"archives.restore": "Restore",
			"archives.archiveTitle": "Archive {n} chats?",
			"archives.deleteSelectionShort": "Delete",
			"archives.clearSelection": "Clear selection",

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
			"workspace.add": "Add workspace",
			"search.sessions.aria": "Search sessions",
			"search.placeholder": "Search sessions...",
			"search.clear": "Clear search",
			"search.results.aria": "Search results",
			"search.pending": "Searching session history…",
			"search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
			"search.noMatches": "No matching sessions",
			"search.hasMore": "Showing the first {n} results. Narrow your search.",
			"menu.addWorkspace": "Add workspace…",
			"menu.unarchive": "Unarchive",
			"menu.deleteSession": "Delete session",
			"archived.badge": "Archived sessions",
			"archived.notOpenable": "This session is archived. Unarchive it to continue the conversation.",
			"archives.title": "Archived sessions",
			"archives.description": "Manage archived sessions or select unarchived sessions to archive in bulk.",
			"archives.viewProject": "GitHub",
			"archives.feedback": "Issues",
			"archives.empty": "No archived sessions.",
			"archives.emptyFiltered": "No chats match your filters.",
			"archives.searchPlaceholder": "Search archived chats",
			"archives.sortBy": "Sort archived chats",
			"archives.sortLabel": "Sort",
			"archives.sortUpdated": "Last updated",
			"archives.sortCreated": "Created",
			"archives.sortAlphabetical": "Alphabetical",
			"archives.projectFilter": "Filter by project",
			"archives.allProjects": "All projects",
			"archives.sessionCount": "{n} chats",
			"archives.selectAllFiltered": "Select all results",
			"archives.selectSession": "Select chat {name}",
			"archives.restoreSelected": "Restore selected",
			"archives.deleteSelected": "Delete selected",
			"archives.timestamp": "{date}, {time}",
			"archives.restoreProject": "Restore all chats in this project",
			"archives.restoreUngrouped": "Restore all",
			"archives.deleteProject": "Delete all chats in this project",
			"archives.deleteUngrouped": "Delete all",
			"archives.projectActions": "Archive actions for project {name}",
			"archives.ungroupedActions": "Archive actions for ungrouped chats",
			"archives.restoreSuccess": "Restored {n} archived chats.",
			"archives.restoreBatchFailed": "Could not restore the archived chats: {detail}",
			"archives.deleteSelectedTitle": "Delete selected archived chats",
			"archives.deleteSelectedDesc": "This permanently deletes the selected {n} archived chats, their child agents (including any that are still running), and their records. Other chats are not affected. This cannot be undone.",
			"archives.deleteSelectedConfirm": "Delete selected chats",
			"archives.deleteProjectTitle": "Delete archived chats in {name}",
			"archives.deleteProjectDesc": "This permanently deletes the {n} archived chats in {name}, their child agents, and their records. The project directory and unarchived chats are not affected. This cannot be undone.",
			"archives.deleteProjectConfirm": "Delete all project chats",
			"archives.deleteUngroupedTitle": "Delete ungrouped archived chats",
			"archives.deleteUngroupedDesc": "This permanently deletes the {n} ungrouped archived chats, their child agents, and their records. Other projects and unarchived chats are not affected. This cannot be undone.",
			"archives.deleteUngroupedConfirm": "Delete all ungrouped chats",
			"archives.deleteBatchPending": "Deleting archived chats…",
			"archives.deleteSuccess": "Deleted {n} archived chats.",
			"archives.deleteSuccessWithSkipped": "Deleted {deleted} archived chats and cleared {skipped} stale archive entries for sessions that no longer exist.",
			"archives.deleteSkipped": "Cleared {n} stale archive entries for sessions that no longer exist.",
			"archives.deletePartial": "Deleted {deleted} chats and cleared {skipped} stale archive entries; {failed} could not be deleted: {detail}",
			"archives.unarchiveUnknown": "This session no longer exists, so it cannot be unarchived.",
			"archives.unarchiveFailed": "Could not unarchive the session: {detail}",
			"archives.archiveUnknown": "This session no longer exists, so it cannot be archived.",
			"archives.archiveFailed": "Could not archive the session: {detail}",
			"archives.archiveActive": "This conversation is still running ({kinds}).",
			"archiveActive.title": "Stop and archive",
			"archiveActive.desc": "“{name}” still has work in progress: {kinds}. Archiving stops that work first.",
			"archiveActive.confirm": "Stop and archive",
			"archiveActive.pending": "Stopping and archiving…",
			"archives.forkFailed": "Could not fork the session: {detail}",
			"deleteSession.title": "Delete session",
			"deleteSession.desc": "This permanently deletes session “{name}”, its child agents (including any that are still running), and all of its records (conversation, stats, cache). This cannot be undone.",
			"deleteSession.pending": "Deleting session…",
			"deleteSession.unknown": "This session no longer exists or was already deleted.",
			"deleteSession.failed": "Could not delete the session: {detail}",
			"picker.loading": "Loading workspaces…",
			"conflict.named": "A workspace named “{name}” already exists.",
			"folderError.title": "Couldn’t open folder",
			"folderError.retry": "Choose again",
			"rename": "Rename",
			"rename.workspace.title": "Rename workspace",
			"rename.session.title": "Rename session",
			"field.workspaceName": "Workspace name",
			"field.sessionName": "Session name",
			"delete.workspace": "Delete workspace",
			"delete.desc": "This removes “{name}” from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
			"delete.pending": "Deleting workspace…",
			"menu.fork": "Fork session",
			"menu.archiveSession": "Archive session",
			"menu.archiveWorkspace": "Archive all chats",
			"archiveWorkspace.title": "Archive {n} chats?",
			"archiveWorkspace.desc": "This archives the chats in “{name}”. You can find them later in Archived chats.",
			"archiveWorkspace.confirm": "Archive all",
			"archiveWorkspace.pending": "Archiving chats…",
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
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin. */
		const NS = "archive-manager-workspace";
		const DIRECTORY_FLOW_SLOT = "archiveManager.sidebar.directoryFlow";
		/**
		* 不 wait uiWorkspace：等它会让官方先占侧栏，0.1.6 上删除菜单出不来。
		* 导航仍在运行时 get("uiWorkspace")。插槽生命周期用 slots.inject。
		*/
		const inject = [
			"slots",
			"sessions",
			"workspaces",
			"locale",
			"remote",
			"typert"
		];
		/** Preserve the receiver required by alpha-era observable stores. */
		function bindObservable<T>(source: Observable<T>) {
			return {
				getSnapshot: source.getSnapshot.bind(source),
				subscribe: source.subscribe.bind(source)
			};
		}
		/**
		* Plugin body: mount the archive-manager Remote contribution, then
		* register the workspace browser. `$mount` must complete before the
		* injected actions can reach `ctx.remote.workspaceRegistry`, so the
		* plugin applies asynchronously and returns a disposer that unmounts the
		* contribution (the slot registrations and dictionaries are
		* effect-scoped inside `applyWorkspaceBrowser`).
		* @param ctx - client root context.
		*/
		/**
		* 单条恢复：0.1.6+ 走官方 `workspaces.unarchiveSession`（会回写客户端归档快照）。
		* 更早宿主没有该方法，回退到本插件一直注册的 `workspaceRegistry.unarchiveSession`。
		*/
		function createUnarchiveSession(workspaces: Workspaces, getRegistry: Registry | undefined | (() => Registry | undefined)) {
			return async (sessionId: string) => {
				if (typeof workspaces?.unarchiveSession === "function") {
					await workspaces.unarchiveSession(sessionId);
					return;
				}
				const registry = typeof getRegistry === "function" ? getRegistry() : getRegistry;
				if (registry === undefined) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.unarchiveSession(sessionId);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
		}
		/** 设置页/侧栏批量归档：串行调官方单笔 archiveSession。已归档与未知会话交给官方处理。 */
		async function archiveSessionsViaOfficial(workspaces: Workspaces, sessionIds: readonly string[], refresh?: () => Promise<unknown>) {
			const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
			const seen = new Set<string>();
			for (const sessionId of sessionIds) {
				if (typeof sessionId !== "string" || sessionId.length === 0 || seen.has(sessionId)) continue;
				seen.add(sessionId);
				try {
					await workspaces.archiveSession(sessionId);
				} catch (reason) {
					if (reason !== null && typeof reason === "object" && activeSessionActivity(reason) !== undefined && typeof record(reason).sessionId !== "string") Object.assign(reason, { sessionId });
					throw reason;
				}
			}
			if (typeof refresh === "function") await refresh();
			const archivedSessionIds = [...(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? [])];
			return {
				archivedSessionIds,
				archivedSessionIdsAdded: archivedSessionIds.filter((id) => !before.has(id))
			};
		}
		/** 设置页批量恢复：串行调单笔恢复。官方方法会回写快照；插件 remote 则用返回集合计数。 */
		async function unarchiveSessionsViaOfficial(workspaces: Workspaces, sessionIds: readonly string[], refresh?: () => Promise<unknown>, unarchive?: (id: string) => Promise<import("./contracts.js").ArchiveState | undefined>) {
			const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
			const seen = new Set<string>();
			const run = typeof unarchive === "function" ? unarchive : (id: string) => workspaces.unarchiveSession?.(id);
			let archivedSessionIds;
			for (const sessionId of sessionIds) {
				if (typeof sessionId !== "string" || sessionId.length === 0 || seen.has(sessionId)) continue;
				seen.add(sessionId);
				const value = await run(sessionId);
				if (Array.isArray(value?.archivedSessionIds)) archivedSessionIds = [...value.archivedSessionIds];
			}
			if (typeof refresh === "function") await refresh();
			archivedSessionIds ??= [...(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? [])];
			return {
				archivedSessionIds,
				unarchivedSessionIds: [...before].filter((id) => !archivedSessionIds.includes(id))
			};
		}
		async function apply(ctx: ClientContext) {
			// 先挂侧栏和设置页，再等 Remote；否则官方侧栏会一直占着，菜单里没有删除。
			applyWorkspaceBrowser(ctx);
			const remote = ctx.get("remote");
			let disposeRemote: () => void | Promise<void> = () => {};
			if (remote !== void 0) disposeRemote = await remote.$mount(ARCHIVE_MANAGER_REMOTE);
			return async () => {
				await disposeRemote();
			};
		}
		/**
		* 等待声明后覆盖侧栏，并注册归档设置页；首页选择器保持官方注册。
		* @param ctx - 客户端根上下文。
		*/
		function applyWorkspaceBrowser(ctx: ClientContext) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-archive-manager: dictionaries");
			ctx.effect(() => observePluginUpdate({
				endpoint: "/api/michengai/dsh-archive-manager/update",
				packageName: "@michengai/dsh-archive-manager",
				titleRowSelector: ".dsham_settingsTitleRow",
				linksSelector: ".dsham_settingsLinks",
				zhName: "归档会话",
				enName: "Archived sessions",
				getLanguage: () => ctx.locale.bind(NS)("locale.language"),
                createIcon: createPluginUpdateIcon
			}), "dsh-archive-manager: plugin update ui");
			// 侧栏先注册；导航适配等官方 uiWorkspace 出现再绑，否则打开归档会被官方清掉。
			const uiWorkspaceAt = () => ctx.get("uiWorkspace");
			const archiveViewState = {};
			let archiveNavigation: ReturnType<typeof allowArchivedNavigation> | undefined;
			const attachArchiveNavigation = (navigation: import("./archive-experience.js").NavigationSource | undefined) => {
				archiveNavigation = allowArchivedNavigation(navigation, ctx.sessions, ctx.workspaces, {
					onOpened: () => ctx.get("layout")?.selectPanel(null),
					beginNavigation: () => ctx.get("layout")?.beginNavigation?.()
				});
				return () => archiveNavigation?.dispose();
			};
			if (typeof ctx.inject === "function") ctx.inject(["uiWorkspace"], (ready) => attachArchiveNavigation(ready.uiWorkspace ?? uiWorkspaceAt()));
			else ctx.effect(() => attachArchiveNavigation(uiWorkspaceAt()), "archive-manager: explicit archived navigation");
			const openConversation = (sessionId: string) => {
				if (archiveNavigation === undefined) throw new ArchiveNavigationError("navigationUnavailable");
				sidebarReveal.request(sessionId);
				return archiveNavigation.open(sessionId);
			};
			const focusSessionWorkspace = async (sessionId: string) => {
				ctx.get("layout")?.beginNavigation?.();
				sidebarReveal.request(sessionId);
			};
			const searchSessions = async (query: string, signal?: AbortSignal) => {
				const result = await ctx.sessions.search(query, signal);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
			const flowSource = (hole: string) => ({
				getSnapshot: () => ctx.slots.entries(hole).length > 0,
				subscribe: (listener: () => void) => ctx.slots.subscribe(hole, listener)
			});
			const browserFlowSource = flowSource(DIRECTORY_FLOW_SLOT);
			const refreshSessionList = async () => {
				if (typeof ctx.sessions.refresh !== "function") return;
				try {
					await ctx.sessions.refresh();
				} catch (error) {
					console.warn("archive-manager: restored archived sessions but session list refresh failed:", error);
				}
			};
			const unarchiveOne = createUnarchiveSession(ctx.workspaces, () => ctx.get("remote.workspaceRegistry"));
			const registryCall = async <K extends keyof RegistryCalls>(method: K, ...args: Parameters<RegistryCalls[K]>): Promise<Awaited<ReturnType<RegistryCalls[K]>>> => {
                const registry = ctx.get("remote.workspaceRegistry");
                if (!registry || typeof registry[method] !== "function") throw new Error(ctx.locale.bind(NS)("service.unavailable"));
                // 映射类型索引后的联合无法保留参数与返回值关联；断言只放在这一个分发边界。
                const call = registry[method] as (...input: Parameters<RegistryCalls[K]>) => Promise<import("./client-compat.js").RemoteResult<Awaited<ReturnType<RegistryCalls[K]>>>>;
                const result = await call.apply(registry, args);
                if (!result.ok) throw new Error(result.error.message);
                return result.value;
            };
            const sessionDetails: RegistryCalls["sessionDetails"] = input => registryCall("sessionDetails", input);
            const diagnoseSession: RegistryCalls["diagnoseSession"] = input => registryCall("diagnoseSession", input);
            const repairSession: RegistryCalls["repairSession"] = input => registryCall("repairSession", input);
            const searchArchivedContent: RegistryCalls["searchArchivedContent"] = input => registryCall("searchArchivedContent", input);
            const searchSessionContent: RegistryCalls["searchSessionContent"] = input => registryCall("searchSessionContent", input);
            const previewArchivedSession: RegistryCalls["previewArchivedSession"] = input => registryCall("previewArchivedSession", input);
            const favoriteSessions = () => registryCall("favoriteSessions");
            const setSessionFavorite: RegistryCalls["setSessionFavorite"] = input => registryCall("setSessionFavorite", input);
            const organizeBatch = createSessionOrganizer({
				workspaces: ctx.workspaces.list, sessions: ctx.sessions.list,
				archive: (id) => ctx.workspaces.archiveSession(id), restore: unarchiveOne,
				deleteOne: async (id) => {
					const registry = ctx.get("remote.workspaceRegistry");
					if (!registry) throw new Error(ctx.locale.bind(NS)("service.unavailable"));
					const result = await registry.deleteSession(id);
					if (!result.ok) throw new Error(result.error.message);
				},
				getFavorites: favoriteSessions, refresh: () => ctx.sessions.refresh?.(), currentSessionId
			});
			const unarchiveSession = async (sessionId: string) => {
				await unarchiveOne(sessionId);
				await refreshSessionList();
			};
			const archiveWorkspaceSessions = async (workspaceId: string) => {
				const items = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
				const workspace = items.find((item) => item.workspaceId === workspaceId);
				if (workspace === undefined) throw new Error(`unknown workspace "${workspaceId}"`);
				return archiveSessionsViaOfficial(ctx.workspaces, workspace.sessionIds, refreshSessionList);
			};
			const deleteSession = async (sessionId: string) => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.deleteSession(sessionId);
				if (!result.ok) throw new Error(result.error.message);
				await refreshSessionList();
			};
			const archiveSessions = async (sessionIds: string[]) => archiveSessionsViaOfficial(ctx.workspaces, sessionIds, refreshSessionList);
			const unarchiveSessions = async (target: BatchTarget) => {
				const snapshot = ctx.workspaces.list?.getSnapshot?.() ?? { archivedSessionIds: [], items: [] };
				const sessionIds = deriveArchivedBatchIds(snapshot.archivedSessionIds, snapshot.items, target);
				return unarchiveSessionsViaOfficial(ctx.workspaces, sessionIds, refreshSessionList, unarchiveOne);
			};
			const deleteArchivedSessions = async (target: BatchTarget) => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.deleteArchivedSessions(target);
				if (!result.ok) throw new Error(result.error.message);
				await refreshSessionList();
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
			const browserInjected = (): BrowserInjected => ({
				startSession: (workspaceId) => {
					const uiWorkspace = uiWorkspaceAt();
					if (uiWorkspace !== void 0) uiWorkspace.startSession(workspaceId);
					else ctx.workspaces.startSession(workspaceId);
				},
				open: (sessionId) => {
					const uiWorkspace = uiWorkspaceAt();
					if (typeof uiWorkspace?.openSession === "function") uiWorkspace.openSession(sessionId);
					else ctx.sessions.open(sessionId);
				},
				searchSessions,
				searchResultLimit: ctx.sessions.searchResultLimit,
				renameSession: async (sessionId, title) => {
					const rename = async (session: SessionBinding) => {
						const result = await session.rename(title);
						if (!result.ok) throw new Error(result.error.message);
					};
					if (typeof ctx.sessions.using === "function") {
						await ctx.sessions.using(sessionId, { source: "workspaceOperation" }, (reference) => rename(reference.binding.session));
						return;
					}
					const session = ctx.sessions.binding(sessionId)?.session;
					if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
					await rename(session);
				},
				forkSession: (sessionId) => {
					const uiWorkspace = uiWorkspaceAt();
					if (typeof uiWorkspace?.forkSession === "function") return uiWorkspace.forkSession(sessionId);
					return ctx.sessions.fork({ sessionId, increaseTitle: true }).then((childId) => {
						if (typeof uiWorkspace?.openSession === "function") uiWorkspace.openSession(childId);
						else ctx.sessions.open(childId);
					});
				},
				renameWorkspace: async (workspaceId, title) => {
					await ctx.workspaces.rename(workspaceId, title);
				},
				deleteWorkspace: async (workspaceId) => {
					await ctx.workspaces.delete(workspaceId);
				},
				insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
					await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
				},
				archiveSession: async (sessionId, options) => {
					await ctx.workspaces.archiveSession(sessionId, options);
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
			const sessionMenuSlot = "sidebar.workspaces.session.menu.item";
			let deleteTarget: { sessionId: string; title: string } | null = null;
			const deleteListeners = new Set<() => void>();
			const publishDeleteTarget = (next: { sessionId: string; title: string } | null) => {
				deleteTarget = next;
				for (const listener of deleteListeners) listener();
			};
			function useDeleteRequest() {
				return react.useSyncExternalStore(
					(listener: () => void) => {
						deleteListeners.add(listener);
						return () => { deleteListeners.delete(listener); };
					},
					() => deleteTarget,
					() => deleteTarget
				);
			}
			function DeleteSessionMenuItem({ sessionId, displayTitle: title, useMenuOpenState, t }: { sessionId: string; displayTitle: string; useMenuOpenState: () => readonly [boolean, (open: boolean) => void]; t: Translate }) {
				const [, setMenuOpen] = useMenuOpenState();
				const Item = _deepseek_ai_dsh_client_ui_primitives.MenuItemButton;
				const icon = (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular ?? _deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 });
				const onSelect = () => {
					setMenuOpen(false);
					publishDeleteTarget({ sessionId, title });
				};
				if (typeof Item === "function") return (0, react_jsx_runtime.jsx)(Item, { danger: true, icon, onSelect, children: t("menu.deleteSession") });
				return (0, react_jsx_runtime.jsx)("button", { type: "button", role: "menuitem", onClick: onSelect, children: t("menu.deleteSession") });
			}
			function DeleteSessionOverlay({ t }: { t: Translate }) {
				const request = useDeleteRequest();
				const [deleting, setDeleting] = (0, react.useState)(false);
				const [error, setError] = (0, react.useState)<string | null>(null);
				if (request === null) return null;
				const close = () => {
					if (deleting) return;
					setError(null);
					publishDeleteTarget(null);
				};
				const confirm = () => {
					setDeleting(true);
					setError(null);
					deleteSession(request.sessionId).then(() => {
						setDeleting(false);
						publishDeleteTarget(null);
					}).catch((reason) => {
						setDeleting(false);
						setError(formatDeleteError(reason, t));
					});
				};
				return (0, react_jsx_runtime.jsx)(AntdProvider, { children: (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: true,
					onClose: close,
					title: t("deleteSession.title"),
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						settingsButton({ disabled: deleting, onClick: close, children: t("cancel") }),
						settingsButton({ danger: true, disabled: deleting, onClick: confirm, children: t("deleteSession.title") })
					] }),
					children: [
						deleting && (0, react_jsx_runtime.jsx)("div", { role: "status", children: t("deleteSession.pending") }),
						error !== null && (0, react_jsx_runtime.jsx)("div", { role: "alert", children: error })
					]
				}) });
			}
			/** 官方列表声明了会话菜单插槽时只追加删除；否则仍换成自有列表，旧宿主菜单没有扩展位。 */
			function hostSidebarDeclaresSessionMenu() {
				if (typeof ctx.slots.entries !== "function") return false;
				return ctx.slots.entries("sidebar.workspaces").some((entry) => entry.children?.[sessionMenuSlot] !== undefined);
			}
			let sidebarMode: "menu" | "legacy" | undefined;
			let disposeLegacy: (() => void) | undefined;
			let disposeMirror: (() => void) | undefined;
			let disposeMenu: (() => void) | undefined;
			let disposeDialog: (() => void) | undefined;
			const registerLegacySidebar = () => {
				const common = {
					name: "sidebar.workspaces",
					// 低于官方 0，高于 Codex -1：旧宿主必须盖住官方三项菜单才能露出删除。
					priority: -0.5,
					store: createWorkspaceViewStore(),
					inject: browserInjected,
					locale: NS
				};
				return ctx.slots.inject("sidebar.workspaces", () => {
					try {
						return ctx.slots.register({
							...common,
							children: { [DIRECTORY_FLOW_SLOT]: { kind: "single", scope: "root" } }
						}, WorkspaceBrowser);
					} catch (error) {
						console.warn("archive-manager: sidebar registration with directory child failed, retrying without children", error);
						return ctx.slots.register(common, WorkspaceBrowser);
					}
				});
			};
			const reconcileSidebar = () => {
				const next = hostSidebarDeclaresSessionMenu() ? "menu" : "legacy";
				if (next === sidebarMode) return;
				sidebarMode = next;
				if (next === "menu") {
					disposeLegacy?.();
					disposeLegacy = undefined;
					disposeMirror?.();
					disposeMirror = undefined;
					disposeMenu ??= ctx.slots.inject(sessionMenuSlot, () => ctx.slots.register({
						name: sessionMenuSlot,
						id: "archive-manager.delete-session",
						order: 500,
						locale: NS,
						inject: () => ({})
					}, DeleteSessionMenuItem));
					disposeDialog ??= ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "archive-manager.delete-session",
						locale: NS,
						inject: () => ({ t: ctx.locale.bind(NS) })
					}, DeleteSessionOverlay));
					return;
				}
				disposeMenu?.();
				disposeMenu = undefined;
				disposeDialog?.();
				disposeDialog = undefined;
				disposeLegacy ??= registerLegacySidebar();
				disposeMirror ??= mirrorDirectoryFlow(ctx, DIRECTORY_FLOW_SLOT);
			};
			reconcileSidebar();
			const unsubscribeSidebar = typeof ctx.on === "function" ? ctx.on("slots/changed", (key: string) => {
				if (key !== "sidebar.workspaces") return;
				try { reconcileSidebar(); }
				catch (error) { console.warn("archive-manager: sidebar mode switch failed", error); }
			}) : undefined;
			ctx.effect(() => () => {
				unsubscribeSidebar?.();
				disposeLegacy?.();
				disposeMirror?.();
				disposeMenu?.();
				disposeDialog?.();
			}, "archive-manager: sidebar mode");

			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "archived-sessions",
				order: 18,
				label: () => ctx.locale.bind(NS)("archived.badge"),
				icon: "archive",
				locale: NS,
				inject: () => ({
					archiveSessions,
					archiveSession: (id: string, options?: { stopActivity?: boolean }) => ctx.workspaces.archiveSession(id, options),
					sessionStore: bindObservable(ctx.sessions.list),
					workspaceStore: bindObservable(ctx.workspaces.list),
					unarchiveSession,
					deleteSession,
					unarchiveSessions,
					deleteArchivedSessions,
					archivedSessionMetadata, openConversation, focusSessionWorkspace, viewState: archiveViewState,
					favoriteSessions, setSessionFavorite, organizeBatch, diagnoseSession, repairSession, sessionDetails, searchSessionContent, searchArchivedContent, previewArchivedSession,
					t: ctx.locale.bind(NS)
				})
			}, ArchivedSessionsSection));
		}
		//#endregion
		/** Pure derivation surface for dsh-archive-manager self-tests (no-op for the runtime). */
		/** 分叉失败由父组件提示，避免列表引用父组件内部作用域。 */
        async function forkWithFeedback(sessionId: string, fork: BrowserProps["forkSession"], notify: (message: string) => void, t: Translate) {
            try { await fork(sessionId); }
            catch (reason) { notify(formatForkError(reason, t)); }
        }
        exports.__test = {
            forkWithFeedback,
			unarchivedSessionIds,
			ArchiveSelectionToolbar,
			ArchivedSessionsSection,
			zh, en,
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
			activeSessionActivity,
			activeSessionRefusal,
			activeArchiveFromMessage,
			archiveSessionsViaOfficial,
			unarchiveSessionsViaOfficial,
			createUnarchiveSession,
			createWorkspaceViewStore,
			migrateWorkspaceViewPersist,
			WORKSPACE_VIEW_PERSIST_KEY,
			LEGACY_WORKSPACE_VIEW_PERSIST_KEY,
			bindObservable,
			hasSplitClientStore,
			groupByWorkspace,
			byRecency,
			ARCHIVE_MANAGER_REMOTE,
			currentSessionId
		};
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
}
