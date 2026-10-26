import type { ClientContext, Workspaces, Registry, RegistryCalls, DiscoveryMethod } from "./client-compat.js";
import type { ArchiveDeleteTarget } from "./client-types.js";
import { record, errorMessage, errorCode } from "./contracts.js";
import type { Schema } from "./contracts.js";
import type { ClientSession, ClientList, ClientWorkspace, WorkspaceSnapshot, Observable, WorkspaceView, UiFacts, PendingHook, StatusHook, StatusMap, BatchTarget, DeletedBatch, ArchivedGroup, ArchiveProps, ArchiveBatchResult, ArchiveRetry, Translate, BatchProgress, OrganizeKind } from "./client-types.js";
import type { NavigationSource } from "./archive-experience.js";
import type { RemoteResult } from "./client-compat.js";
import type { ReactNode, RefObject, AriaAttributes, HTMLAttributes, DragEvent as ReactDragEvent } from "react";
import { createDiscoveryTools, discoveryCss, discoveryZh, discoveryEn, discoveryRu } from "./archive-discovery-ui.js";
import { copySessionText, discoveryInvocations, matchesUpdatedRange, validUpdatedRange } from "./archive-discovery.js";
import { cacheRebuildInvocations } from "./cache-rebuild-contract.js";
import type { CacheDiagnosis } from "./cache-rebuild-contract.js";
import { createCacheRebuildController } from "./cache-rebuild-client.js";
import type { CacheRepairState } from "./cache-rebuild-client.js";
import { allowArchivedNavigation, openArchivedConversation, formatArchiveNavigationError, ArchiveNavigationError, currentSessionId } from "./archive-experience.js";
import { observePluginUpdate } from "./plugin-update-ui.js";
import { setupSidebarEntry } from "./sidebar-entry.js";
import { resolveApiUrl } from "./api-base.js";
import { favoriteInvocations, idleArchiveCandidate, createSessionOrganizer, runSessionBatch } from "./archive-organizer.js";
import { createOrganizerPanel, organizerZh, organizerEn, organizerRu } from "./archive-organizer-ui.js";
import { createPortal } from "react-dom";
import { SelectionCheckbox } from "./plugin-ui.js";
type HostRequire = Parameters<Window["__ModuleLoader__"]["load"]>[0]["factory"] extends (require: infer Require) => unknown ? Require : never;
export function startArchiveClient(require: HostRequire) {
		var module: { exports: Record<string, unknown> } = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		function SettingsModal({ open, onClose, title, description, footer, children, className, width }: { open: boolean; onClose(): void; title: ReactNode; description?: ReactNode; footer?: ReactNode; children?: ReactNode; className?: string; width?: number }) {
			const anchor = react.useRef<HTMLSpanElement>(null);
			// 设置壳会把 body 下的外部分支标成 inert。宿主 Modal 固定挂到 body，
			// 所以这里自己门户到所属归档页；没有归档页时才回退 body。
			const getContainer = react.useCallback(() => anchor.current?.closest<HTMLElement>(".dsham_settings") ?? document.body, []);
			const [container, setContainer] = react.useState<HTMLElement | null>(null);
			react.useEffect(() => {
				if (!open) { setContainer(null); return; }
				setContainer(getContainer());
			}, [open, getContainer]);
			react.useEffect(() => {
				if (!open) return;
				const onKey = (event: KeyboardEvent) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					event.stopPropagation();
					if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
					onClose();
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [open, onClose]);
			const dialog = (0, react_jsx_runtime.jsxs)("div", { className: "dsham_modalRoot", role: "presentation", children: [
				(0, react_jsx_runtime.jsx)("div", { className: "dsham_modalMask", onClick: onClose }),
				(0, react_jsx_runtime.jsxs)("div", { role: "dialog", "aria-modal": true, "aria-label": typeof title === "string" ? title : undefined, className: clsx("dsham_modalDialog", className), style: { width: width ?? 560 }, children: [
					(0, react_jsx_runtime.jsx)("h2", { children: title }),
					description != null && (0, react_jsx_runtime.jsx)("p", { children: description }),
					children != null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_modalBody", children }),
					footer != null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_modalFooter", children: footer })
				] })
			] });
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)(SettingsModalAnchor, { refObject: anchor, getContainer }),
				open && container ? createPortal(dialog, container) : null
			] });
		}
		function SettingsModalAnchor({ refObject, getContainer }: { refObject: RefObject<HTMLSpanElement>; getContainer(): HTMLElement }) {
			return (0, react_jsx_runtime.jsx)("span", { hidden: true, ref: refObject, "data-get-container": getContainer });
		}
		function settingsButton({ variant = "outline", icon, children, className, disabled, title, onClick, "aria-label": ariaLabel, "aria-pressed": ariaPressed, "aria-expanded": ariaExpanded, "aria-haspopup": ariaHaspopup }: { variant?: "primary" | "ghost" | "outline" | "toolbar"; icon?: ReactNode; className?: string; disabled?: boolean; title?: string; onClick?: () => void; "aria-label"?: string; "aria-pressed"?: boolean; "aria-expanded"?: boolean; "aria-haspopup"?: AriaAttributes["aria-haspopup"]; children?: ReactNode }) {
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant,
				size: "sm",
				className,
				disabled,
				title,
				onClick,
				"aria-label": ariaLabel,
				"aria-pressed": ariaPressed,
				"aria-expanded": ariaExpanded,
				"aria-haspopup": ariaHaspopup,
				icon,
				children
			});
		}
		function modalFooterButton({ variant = "outline", danger = false, disabled, onClick, children }: { variant?: "primary" | "outline"; danger?: boolean; disabled?: boolean; onClick?: () => void; children?: ReactNode }) {
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: danger ? "outline" : variant,
				className: danger ? "dsham_btnDanger" : undefined,
				disabled,
				onClick,
				children
			});
		}
		function tabsShell(locked: boolean, children: ReactNode) {
			const props: { className?: string; inert?: ""; children: ReactNode } = { className: locked ? "dsham_archiveTabsLocked" : undefined, children };
			if (locked) props.inert = "";
			return props as HTMLAttributes<HTMLDivElement> & { children: ReactNode };
		}
		const OrganizerPanel = createOrganizerPanel(react, _deepseek_ai_dsh_client_ui_primitives.Button);
        const { HighlightedText, useArchiveSearch, useArchivePreview, DiscoveryFilters, SearchStatus, PreviewContent } = createDiscoveryTools(react, { Button: _deepseek_ai_dsh_client_ui_primitives.Button, SegmentedControl: _deepseek_ai_dsh_client_ui_primitives.SegmentedControl });
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
				return value;
			}
		};
		const sessionMoveInputSchema = {
			parse(value: unknown) {
				const val = record(value);
				if (!val || typeof val.sessionId !== "string" || !val.sessionId || typeof val.targetWorkspaceId !== "string" || !val.targetWorkspaceId) {
					throw new TypeError("sessionId and targetWorkspaceId must be non-empty strings");
				}
				return { sessionId: val.sessionId, targetWorkspaceId: val.targetWorkspaceId };
			}
		};
		const sessionMoveResultSchema = {
			parse(value: unknown) {
				const val = record(value);
				if (!val || val.ok !== true) throw new TypeError("session move result must be ok: true");
				return val;
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
				...cacheRebuildInvocations(),
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
				{
					id: "@michengai/dsh-archive-manager#workspaceRegistry/diagnoseOrphanSubagents",
					service: "workspaceRegistry",
					namespace: "workspaceRegistry",
					method: "diagnoseOrphanSubagents",
					invocation: { kind: "direct" },
					parameters: [],
					result: strictCodec("@michengai/dsh-archive-manager/types#OrphanSubagentDiagnosis", {
						parse(value: unknown) {
							const val = record(value);
							if (!val || typeof val.count !== "number" || !Array.isArray(val.items) || typeof val.totalSizeBytes !== "number") {
								throw new TypeError("invalid orphan subagent diagnosis");
							}
							return val;
						}
					}),
					sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
				},
				{
					id: "@michengai/dsh-archive-manager#workspaceRegistry/cleanOrphanSubagents",
					service: "workspaceRegistry",
					namespace: "workspaceRegistry",
					method: "cleanOrphanSubagents",
					invocation: { kind: "direct" },
					parameters: [{
						name: "target",
						wire: "target",
						source: "json",
						acceptsUndefined: true,
						codec: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanTarget", {
							parse(v: unknown) {
								if (v === undefined || v === null) return {};
								const val = record(v);
								if (!val) throw new TypeError("target must be an object");
								if (val.sessionIds !== undefined && (!Array.isArray(val.sessionIds) || val.sessionIds.some(id => typeof id !== "string"))) {
									throw new TypeError("sessionIds must be an array of strings");
								}
								return val;
							}
						})
					}],
					result: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanResult", {
						parse(value: unknown) {
							const val = record(value);
							if (!val || !Array.isArray(val.cleanedSessionIds) || !Array.isArray(val.skippedSessionIds) || !Array.isArray(val.failures)) {
								throw new TypeError("invalid orphan subagent clean result");
							}
							return val;
						}
					}),
					sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
				},
				{
					id: "@michengai/dsh-archive-manager#workspaceRegistry/moveSessionToWorkspace",
					service: "workspaceRegistry",
					namespace: "workspaceRegistry",
					method: "moveSessionToWorkspace",
					invocation: { kind: "direct" },
					parameters: [{
						name: "input",
						wire: "input",
						source: "json",
						codec: strictCodec("@michengai/dsh-archive-manager/types#SessionMoveInput", sessionMoveInputSchema)
					}],
					result: strictCodec("@michengai/dsh-archive-manager/types#SessionMoveResult", sessionMoveResultSchema),
					sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
				},
			]
		};
		/**
		 * 注入插件自己的样式表；同标识已存在就跳过（重复注册、热重载都安全）。
		 * @param name - `data-plugin-css` 标识，同时作为 style 归属标记。
		 * @param css - 样式文本。
		 */
		function ensurePluginStyle(name: string, css: string) {
			if (typeof document === "undefined" || document.querySelector("style[data-plugin-css=" + JSON.stringify(name) + "]") !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "@michengai/dsh-archive-manager";
			tag.dataset.pluginCss = name;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		/** 危险操作确认按钮统一红色描边。宿主哈希类名随版本变，不再引用。 */
		const DANGER_BUTTON_CSS = ".dsham_btnDanger:not(:disabled){color:var(--dsw-alias-state-error-primary,#ef7272);border-color:var(--dsw-alias-state-error-primary,#ef7272)}";
		ensurePluginStyle("dsh-archive-manager/DangerButton.css", DANGER_BUTTON_CSS);
		/** 图标按钮类同时用于设置页宿主按钮和侧栏原生按钮，必须全局注入，否则侧栏先于设置页渲染时没有样式。 */
		const ICON_ACTION_CSS = ".dsham_iconAction{display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:22px!important;min-width:22px!important;height:22px!important;padding:0!important;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px)!important;background:transparent;color:var(--dsw-alias-label-secondary)}.dsham_iconAction:not(:disabled):hover{color:var(--dsw-alias-link,#4176e6)!important;border-color:var(--dsw-alias-link,#4176e6)!important}.dsham_iconAction.dsham_iconDanger{color:var(--dsw-alias-state-error-primary,#ef7272)!important;border-color:var(--dsw-alias-state-error-primary,#ef7272)!important}.dsham_iconAction.dsham_iconDanger:not(:disabled):hover{color:var(--dsw-alias-state-error-primary,#ef7272)!important;border-color:var(--dsw-alias-state-error-primary,#ef7272)!important}.dsham_iconAction svg{width:16px!important;height:16px!important;flex:none!important}";
		ensurePluginStyle("dsh-archive-manager/IconAction.css", ICON_ACTION_CSS);
		/** 模态与确认卡片基础样式全局注入，防止侧栏触发删除时因未进过设置页而无样式。 */
		const ARCHIVE_MODAL_CSS = ".dsham_modalRoot{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px}.dsham_modalMask{position:absolute;inset:0;background:var(--dsw-alias-bg-mask-1,rgb(0 0 0 / 45%))}.dsham_modalDialog{position:relative;display:flex;flex-direction:column;gap:12px;max-width:calc(100vw - 48px);max-height:min(80vh,720px);padding:22px 24px 20px;overflow:hidden;border:0;border-radius:var(--dsw-radius-panel,28px);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent,0 16px 40px rgb(0 0 0 / 24%))}.dsham_modalDialog h2{margin:0;font-size:16px;line-height:24px}.dsham_modalDialog>p{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.dsham_modalBody{display:flex;flex-direction:column;gap:12px;flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain}.dsham_modalFooter{display:flex;flex:none;align-items:center;justify-content:flex-end;gap:8px}";
		ensurePluginStyle("dsh-archive-manager/Modal.css", ARCHIVE_MODAL_CSS);
		/** 侧边栏行内就地确认卡片样式：完全对齐官方原生 MenuSurface 材质与无箭头悬浮设计 */
		const SIDEBAR_POPOVER_CSS = ".dsham_sidebarCardRoot{position:fixed;inset:0;z-index:1200;pointer-events:none}.dsham_sidebarCardBackdrop{position:fixed;inset:0;pointer-events:auto;background:transparent}.dsham_sidebarCard{position:fixed;pointer-events:auto;box-sizing:border-box;width:290px;max-height:calc(100vh - 32px);overflow-y:auto;padding:16px 18px 14px;border-radius:var(--dsw-radius-lg,14px);background:var(--dsw-menu-surface-fill);backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));border:none;box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:8px}.dsham_sidebarCardTitle{margin:0;font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary)}.dsham_sidebarCardDesc{margin:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}.dsham_sidebarCardError{margin-top:2px;font-size:12px;line-height:16px;color:var(--dsw-alias-state-error-primary,#ef7272);white-space:pre-line}.dsham_sidebarCardFooter{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px}.dsham_sidebarCardBtn{border:none;background:transparent;padding:5px 12px;border-radius:var(--dsw-radius-sm,6px);font:inherit;font-size:13px;font-weight:500;line-height:18px;cursor:pointer;transition:background-color .15s ease,opacity .15s ease}.dsham_sidebarCardBtnCancel{color:var(--dsw-alias-label-primary)}.dsham_sidebarCardBtnCancel:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dsham_sidebarCardBtnDanger{color:var(--dsw-alias-state-error-primary,#ef7272)}.dsham_sidebarCardBtnDanger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,#f25a5a26)}.dsham_sidebarCardBtn:disabled{opacity:.4;cursor:default}";
		ensurePluginStyle("dsh-archive-manager/SidebarPopover.css", SIDEBAR_POPOVER_CSS);
		/** 移动会话二级悬浮菜单样式 */
		const MOVE_SUBMENU_CSS = ".dsham_moveSessionWrap{position:relative}.dsham_moveSubmenu{position:fixed;z-index:99999;min-width:160px;max-width:260px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.25) transparent;background:var(--dsw-menu-surface-fill,var(--dsw-alias-surface-overlay,#1e1e22));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.12));border-radius:var(--dsw-radius-md,8px);box-shadow:var(--dsw-elevation-prominent,0 6px 20px rgba(0,0,0,0.45));padding:4px;display:flex;flex-direction:column;gap:2px}.dsham_moveSubmenu::-webkit-scrollbar{width:6px}.dsham_moveSubmenu::-webkit-scrollbar-track{background:transparent}.dsham_moveSubmenu::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:3px}.dsham_moveSubmenu::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.35)}.dsham_moveSubmenuBtn{display:flex;align-items:center;width:100%;padding:6px 10px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-primary,#ededed);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background-color .12s ease}.dsham_moveSubmenuBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,0.08))}.dsham_moveSubmenuBtn:focus-visible:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,0.08));outline:none}";
		ensurePluginStyle("dsh-archive-manager/MoveSubmenu.css", MOVE_SUBMENU_CSS);
		/**
		 * 收藏星住在一个**独立容器**里，容器紧跟在宿主的前导格（`_slot`，状态点/定时标记）之后：
		 * 前导格永远是 16px，所以容器的起点恒定，不管格子里是空的还是转圈图标，星的位置都不变。
		 * 未收藏且未悬停时容器 `display:none`（不占任何宽度）；已收藏或悬停本行时容器出现，
		 * 星在里面 16×16 命中区 / 14px 图标，两种状态同一个元素。
		 */
		/** 星形路径：DOM 注入、菜单行克隆和 React 菜单项共用一份，避免三处漂移。 */
		const STAR_PATH = "M8 1.75l1.934 3.918 4.324.628-3.129 3.05.738 4.306L8 11.618l-3.867 2.034.738-4.306-3.129-3.05 4.324-.628L8 1.75z";
		/**
		 * 星标 SVG 字符串。
		 * @param filled - 已收藏为实心，否则描边。
		 * @returns 14×14 的 svg 标记。
		 */
		function starSvg(filled: boolean): string {
			return filled
				? '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>'
				: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
		}
		const ROW_FAVORITE_CSS = "[data-row-key^='session:']{position:relative}"
			+ ".dsham_starSlot{display:none;position:absolute;left:calc(8px + var(--dsh-workspace-indent,0px));inset-inline-start:calc(8px + var(--dsh-workspace-indent,0px));top:50%;transform:translateY(-50%);align-items:center;justify-content:center;box-sizing:border-box;width:16px;height:20px;z-index:1;pointer-events:none}"
			+ "[data-row-key^='session:']:hover .dsham_starSlot,.dsham_starSlot[data-favorited='true']{display:inline-flex;pointer-events:auto}"
			+ "[data-row-key^='session:']:hover>span:first-child,[data-row-key^='session:'][data-dsham-favorited='true']>span:first-child{opacity:0}"
			+ ".dsham_rowStar{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:16px;height:16px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;flex:none;border-radius:var(--dsw-radius-xs,4px)}"
			+ ".dsham_starSlot[data-favorited='true'] .dsham_rowStar{color:#e8b931}"
			+ ".dsham_rowStar svg{display:block;width:16px;height:16px;flex:none}";
		ensurePluginStyle("dsh-archive-manager/RowFavorite.css", ROW_FAVORITE_CSS);
		/**
		 * 主界面「只看收藏」筛选：官方视图选项菜单是一份普通数组、没有插槽，
		 * 所以沿用本插件既有的 DOM 做法——按文案找到「仅显示已归档」那一行后克隆它，
		 * 插入一行自己的开关；列表侧只给非收藏行打隐藏属性，不改任何数据。
		 */
		const WORKSPACE_FAVORITES_ONLY_KEY = "dsh-archive-manager:workspace-favorites-only";
		const FAVORITES_HIDDEN_ATTR = "data-dsham-favorites-hidden";
		const FAVORITES_ONLY_MARKER = "data-dsham-favorites-only";
		const ROW_STAR_CLASS = "dsham_rowStar";
		const ROW_STAR_SLOT_CLASS = "dsham_starSlot";
		/** 官方 onlyArchived 行的三种语言文案，用来在视图选项菜单里定位筛选分组。 */
		const ONLY_ARCHIVED_TEXTS = ["仅显示已归档", "Archived only", "Только архивные"];
		const FAVORITES_FILTER_CSS = "[data-dsham-favorites-hidden='true']{display:none!important}" + "button[data-dsham-favorites-only='true'][data-active='true']::after{content:\"\\2713\";margin-left:auto;padding-left:12px;font-size:12px;line-height:1;color:var(--dsw-alias-state-business-primary,#3b82f6)}";
		ensurePluginStyle("dsh-archive-manager/FavoritesFilter.css", FAVORITES_FILTER_CSS);
		function readWorkspaceFavoritesOnly(): boolean {
			try { return window.localStorage.getItem(WORKSPACE_FAVORITES_ONLY_KEY) === "1"; }
			catch { return false; }
		}
		function writeWorkspaceFavoritesOnly(value: boolean) {
			try { window.localStorage.setItem(WORKSPACE_FAVORITES_ONLY_KEY, value ? "1" : "0"); }
			catch { /* 隐私模式下 localStorage 不可写：筛选只在本次会话生效。 */ }
		}
		/**
		 * 计算侧栏行在「只看收藏」下的可见性。空白占位会话（新会话行）不参与收藏，
		 * 但保留可见，否则打开筛选后连新建入口都没了。
		 * @param rows - 按 DOM 顺序排列的 `data-row-key` 值。
		 * @param options - 收藏集合与当前会话摘要。
		 * @returns 与 rows 等长的可见性数组。
		 */
		function favoritesOnlyVisibility(rows: readonly string[], options: { favorites: ReadonlySet<string>; sessions?: Record<string, { blank?: boolean } | undefined>; groupHasFavorite?: (groupKey: string) => boolean }): boolean[] {
			const visibleSession = (sessionId: string) => options.favorites.has(sessionId) || options.sessions?.[sessionId]?.blank === true;
			const groupHasVisible = new Map<string, boolean>();
			let currentGroup: string | null = null;
			for (const key of rows) {
				if (key.startsWith("workspace:")) {
					currentGroup = key;
					groupHasVisible.set(key, false);
					continue;
				}
				if (key.startsWith("session:") && currentGroup !== null && visibleSession(key.slice("session:".length))) groupHasVisible.set(currentGroup, true);
			}
			return rows.map((key) => {
				if (key.startsWith("session:")) return visibleSession(key.slice("session:".length));
				if (key.startsWith("workspace:")) return groupHasVisible.get(key) === true || options.groupHasFavorite?.(key.slice("workspace:".length)) === true;
				// 溢出项（展开其余 N 个）会重新露出被筛掉的会话，筛选期间一律收起。
				if (key.startsWith("overflow:")) return false;
				return true;
			});
		}
		/**
		 * 折叠组里的收藏可能还没渲染成行，用工作区快照判断「这一组里有没有收藏」。
		 * @param favorites - 当前收藏集合。
		 * @param items - 工作区快照（含各自的 sessionIds）。
		 * @returns 判断分组键（workspaceId 或 `ungrouped`）是否含收藏。
		 */
		function favoriteGroupPredicate(favorites: ReadonlySet<string>, items: readonly ClientWorkspace[]): (groupKey: string) => boolean {
			const withFavorite = new Map<string, boolean>();
			const grouped = new Set<string>();
			for (const workspace of items) {
				let found = false;
				for (const sessionId of workspace.sessionIds) {
					grouped.add(sessionId);
					if (favorites.has(sessionId)) found = true;
				}
				withFavorite.set(workspace.workspaceId, found);
			}
			let ungrouped = false;
			for (const sessionId of favorites) if (!grouped.has(sessionId)) { ungrouped = true; break; }
			return (groupKey) => (groupKey === "" || groupKey === "ungrouped") ? ungrouped : withFavorite.get(groupKey) === true;
		}
		/**
		 * 主界面「只看收藏」：在官方「视图选项 → 筛选会话」里插入一行开关，打开后
		 * 侧栏只保留收藏的会话（空白的新会话占位仍然可见）。筛选只改 DOM 可见性，
		 * 不动会话、不动归档集合，关掉开关立刻还原。
		 * @param ctx - 客户端根上下文（读会话摘要、订阅列表变更）。
		 * @param favoriteRow - 共享收藏存储。
		 * @param t - 本插件命名空间的文案。
		 * @returns 开关状态、订阅与销毁句柄。
		 */
		function setupWorkspaceFavoritesOnly(ctx: ClientContext, favoriteRow: FavoriteRowStore, translate: () => Translate) {
			const noop = { dispose: () => {} };
			if (typeof document === "undefined" || typeof document.addEventListener !== "function" || typeof MutationObserver === "undefined") return noop;
			let enabled = readWorkspaceFavoritesOnly();
			let disposed = false;
			let passQueued = false;
			/** 每次筛选最多点开多少组折叠：点一次宿主只展开 5 条，超大组需要多轮，这里兜住失控。 */
			let expansionClicks = 0;
			const MAX_EXPANSION_CLICKS = 200;
			/** 上一次展开尝试；下一次渲染没多出行就说明宿主没展开，别再点同一组。 */
			let lastExpansion: { key: string; rows: number } | null = null;
			const stalledGroups = /* @__PURE__ */ new Set<string>();
			/**
			 * 星标放在宿主前导格之后的独立容器里：前导格恒为 16px，所以容器起点固定，
			 * 格子里有转圈图标/状态点也不会让星标左右移动。未收藏且未悬停时容器不渲染（零占位），
			 * 已收藏或悬停本行时容器出现，星在里面常驻，尺寸始终一致。
			 */
			const ensureRowStars = (rows: readonly HTMLElement[]) => {
				const snapshot = favoriteRow.getSnapshot();
				for (const row of rows) {
					const key = row.getAttribute("data-row-key") ?? "";
					if (!key.startsWith("session:")) continue;
					const sessionId = key.slice("session:".length);
					const cell = Array.from(row.children).find((child) => child.tagName === "SPAN" && Array.from(child.classList).some((name) => name === "slot" || name.endsWith("_slot"))) ?? null;
					if (cell === null) continue;
					let holder = Array.from(row.children).find((child): child is HTMLElement => child.classList.contains(ROW_STAR_SLOT_CLASS)) ?? null;
					if (!snapshot.ready) {
						holder?.remove();
						row.removeAttribute("data-dsham-favorited");
						continue;
					}
					if (holder !== null && (holder.parentElement !== row || holder.nextElementSibling !== null)) {
						row.appendChild(holder);
					}
					if (holder === null) {
						holder = document.createElement("span");
						holder.className = ROW_STAR_SLOT_CLASS;
						row.appendChild(holder);
					}
					holder.dataset.sessionId = sessionId;
					let star = holder.querySelector<HTMLButtonElement>("." + ROW_STAR_CLASS);
					if (star === null) {
						star = document.createElement("button");
						star.type = "button";
						star.className = ROW_STAR_CLASS;
						star.addEventListener("click", (event) => {
							event.preventDefault();
							event.stopPropagation();
							void favoriteRow.toggle(holder?.dataset.sessionId ?? "");
						});
						holder.appendChild(star);
					}
					const favorited = snapshot.ids.has(sessionId);
					if (favorited) row.setAttribute("data-dsham-favorited", "true");
					else row.removeAttribute("data-dsham-favorited");
					if (holder.dataset.favorited === String(favorited)) continue;
					const label = translate()(favorited ? "organizer.unfavorite" : "organizer.favorite");
					holder.dataset.favorited = String(favorited);
					star.setAttribute("aria-pressed", String(favorited));
					star.setAttribute("aria-label", label);
					star.title = label;
					star.innerHTML = starSvg(favorited);
				}
			};
			const applyVisibility = (rows: readonly HTMLElement[]) => {
				const snapshot = favoriteRow.getSnapshot();
				if (!enabled || !snapshot.ready) {
					for (const row of rows) if (row.hasAttribute(FAVORITES_HIDDEN_ATTR)) row.removeAttribute(FAVORITES_HIDDEN_ATTR);
					expansionClicks = 0;
					lastExpansion = null;
					stalledGroups.clear();
					return;
				}
				const keys = rows.map((row) => row.getAttribute("data-row-key") ?? "");
				// 折叠组里的收藏可能还没渲染成行：用快照补一次分组判定，避免误判整组为空。
				const groupHasFavorite = favoriteGroupPredicate(snapshot.ids, ctx.workspaces.list?.getSnapshot?.()?.items ?? []);
				const visible = favoritesOnlyVisibility(keys, {
					favorites: snapshot.ids,
					sessions: ctx.sessions.list?.getSnapshot?.()?.byId,
					groupHasFavorite
				});
				// 折叠会吞掉「第 6 条以后」的收藏：先点开这一组的溢出按钮，再隐藏非收藏行。
				if (lastExpansion !== null) {
					if (rows.length <= lastExpansion.rows) stalledGroups.add(lastExpansion.key);
					lastExpansion = null;
				}
				let expanding = false;
				if (expansionClicks < MAX_EXPANSION_CLICKS) {
					for (let index = 0; index < rows.length; index += 1) {
						const row = rows[index];
						const key = keys[index];
						if (!key.startsWith("overflow:") || row.getAttribute("aria-expanded") !== "false") continue;
						const groupKey = key.slice("overflow:".length);
						if (stalledGroups.has(groupKey) || !groupHasFavorite(groupKey)) continue;
						try {
							(row as HTMLButtonElement).click();
							expansionClicks += 1;
							lastExpansion = { key: groupKey, rows: rows.length };
							expanding = true;
						}
						catch (reason) { console.warn("archive-manager: favorites-only expand failed", reason); }
						break;
					}
				}
				for (let index = 0; index < rows.length; index += 1) {
					const row = rows[index];
					if (visible[index]) {
						if (row.hasAttribute(FAVORITES_HIDDEN_ATTR)) row.removeAttribute(FAVORITES_HIDDEN_ATTR);
					}
					else row.setAttribute(FAVORITES_HIDDEN_ATTR, "true");
				}
				if (expanding) schedulePass();
			};
			const buildMenuRow = (anchor: HTMLButtonElement): HTMLDivElement | null => {
				const wrap = anchor.parentElement;
				if (wrap === null) return null;
				const clone = wrap.cloneNode(true) as HTMLDivElement;
				const button = clone.querySelector<HTMLButtonElement>('button[role="menuitem"]');
				if (button === null) return null;
				const spans = Array.from(button.querySelectorAll<HTMLElement>("span"));
				const icon = spans[0] ?? null;
				const label = spans[spans.length - 1] ?? null;
				if (icon !== null) icon.innerHTML = starSvg(false);
				if (label !== null) label.textContent = translate()("organizer.favoritesOnly");
				// 宿主的勾选图标是 CSS Module 类名，克隆不到就用自己的 ::after 勾号。
				for (const svg of Array.from(button.querySelectorAll("svg"))) if (svg.closest("span") === null) svg.remove();
				button.setAttribute(FAVORITES_ONLY_MARKER, "true");
				button.setAttribute("role", "menuitemcheckbox");
				button.dataset.active = String(enabled);
				button.setAttribute("aria-checked", String(enabled));
				button.setAttribute("aria-label", translate()("organizer.favoritesOnly"));
				button.onclick = (event: MouseEvent) => {
					event.preventDefault();
					event.stopPropagation();
					toggle();
					document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
				};
				return clone;
			};
			const injectMenuRows = () => {
				if (disposed) return;
				for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("button[" + FAVORITES_ONLY_MARKER + "]"))) {
					// 菜单没关就走完一轮时，桌面上的勾选也要跟上当前状态。
					button.dataset.active = String(enabled);
					button.setAttribute("aria-checked", String(enabled));
				}
				for (const menu of Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'))) {
					const anchor = Array.from(menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')).find((item) => ONLY_ARCHIVED_TEXTS.some((text) => (item.textContent ?? "").includes(text)));
					if (anchor === undefined) continue;
					if (menu.querySelector("[" + FAVORITES_ONLY_MARKER + "]") !== null) continue;
					const wrap = anchor.parentElement;
					if (wrap === null) continue;
					const row = buildMenuRow(anchor);
					if (row !== null) wrap.parentElement?.insertBefore(row, wrap.nextSibling);
				}
			};
			const schedulePass = () => {
				if (passQueued || disposed) return;
				passQueued = true;
				const run = () => {
					passQueued = false;
					if (disposed) return;
					const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-row-key]"));
					injectMenuRows();
					ensureRowStars(rows);
					applyVisibility(rows);
					if (!favoriteRow.getSnapshot().ready) scheduleRetry();
				};
				if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
				else setTimeout(run, 16);
			};
			const toggle = () => {
				enabled = !enabled;
				retriesLeft = 20;
				expansionClicks = 0;
				lastExpansion = null;
				stalledGroups.clear();
				writeWorkspaceFavoritesOnly(enabled);
				schedulePass();
			};
			/** 客户端启动时 remote 还没挂上，第一次读收藏会失败：稍后重试，别把空集合当成结果。 */
			let retryTimer: ReturnType<typeof setTimeout> | null = null;
			let retriesLeft = 20;
			const scheduleRetry = () => {
				if (retryTimer !== null || disposed || retriesLeft <= 0) return;
				retriesLeft -= 1;
				retryTimer = setTimeout(() => {
					retryTimer = null;
					void favoriteRow.ensure();
					schedulePass();
				}, 600);
			};
			const observer = new MutationObserver((records) => {
				if (mutationTouches(records, '[data-row-key], [role="menu"]')) schedulePass();
			});
			observer.observe(document.body, { childList: true, subtree: true });
			// 行组件挂载前就把收藏读进来，避免开关先出现、列表还是空状态。
			favoriteRow.ensure().catch(() => {});
			const unsubscribers = [
				favoriteRow.subscribe(() => schedulePass()),
				typeof ctx.sessions.list?.subscribe === "function" ? ctx.sessions.list.subscribe(() => schedulePass()) : null,
				typeof ctx.workspaces.list?.subscribe === "function" ? ctx.workspaces.list.subscribe(() => schedulePass()) : null
			].filter((unsubscribe): unsubscribe is () => void => typeof unsubscribe === "function");
			schedulePass();
			return {
				dispose() {
					disposed = true;
					observer.disconnect();
					for (const unsubscribe of unsubscribers) unsubscribe();
					for (const row of Array.from(document.querySelectorAll<HTMLElement>("[" + FAVORITES_HIDDEN_ATTR + "]"))) row.removeAttribute(FAVORITES_HIDDEN_ATTR);
					for (const button of Array.from(document.querySelectorAll<HTMLElement>("[" + FAVORITES_ONLY_MARKER + "]"))) button.parentElement?.remove();
					for (const star of Array.from(document.querySelectorAll<HTMLElement>("." + ROW_STAR_SLOT_CLASS))) star.remove();
					for (const row of Array.from(document.querySelectorAll<HTMLElement>("[data-dsham-favorited]"))) row.removeAttribute("data-dsham-favorited");
					if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
				},
			};
		}
		/** 收藏集合在客户端只保留一份：主界面星标、归档面板和批量操作读的是同一份状态。 */
		interface FavoriteRowState {
			ready: boolean;
			ids: ReadonlySet<string>;
			pending: ReadonlySet<string>;
		}
		interface FavoriteRowApi {
			favoriteSessions(): Promise<{ favoriteSessionIds: string[] }>;
			setSessionFavorite(input: { sessionId: string; favorite: boolean }): Promise<{ favoriteSessionIds: string[] }>;
		}
		interface FavoriteRowStore {
			bind(api: FavoriteRowApi): void;
			subscribe(listener: () => void): () => void;
			getSnapshot(): FavoriteRowState;
			ensure(): Promise<void>;
			adopt(favoriteSessionIds: readonly string[]): void;
			toggle(sessionId: string): Promise<void>;
		}
		/**
		 * 主界面星标与归档面板共用的收藏存储：一次读取、乐观写入、失败回滚。
		 * 写入永远走归档管理器自己的 favoriteSessions / setSessionFavorite 接口，
		 * 不新开收藏来源，也不改宿主的 workspaceRegistry。
		 * @returns 可绑定接口、可订阅的收藏存储。
		 */
		function createFavoriteRowStore(): FavoriteRowStore {
			let api: FavoriteRowApi | undefined;
			let state: FavoriteRowState = { ready: false, ids: /* @__PURE__ */ new Set<string>(), pending: /* @__PURE__ */ new Set<string>() };
			let loading: Promise<void> | undefined;
			/** 读取失败后的退避时间点：remote 挂载前的一次失败不能永久锁死收藏状态。 */
			let retryAt = 0;
			const listeners = /* @__PURE__ */ new Set<() => void>();
			const publish = (next: FavoriteRowState) => {
				state = next;
				for (const listener of listeners) {
					try { listener(); }
					catch (reason) { console.warn("archive-manager: favorite listener failed", reason); }
				}
			};
			const adopt = (favoriteSessionIds: readonly string[], settledSessionId?: string) => {
				const nextIds = new Set(favoriteSessionIds);
				// 如果当前还有正在飞行中的其他 pending 操作，保持其乐观状态叠加在服务端结果上
				for (const pendingId of state.pending) {
					if (pendingId === settledSessionId) continue;
					if (state.ids.has(pendingId)) nextIds.add(pendingId);
					else nextIds.delete(pendingId);
				}
				const nextPending = new Set(state.pending);
				if (settledSessionId !== undefined) {
					nextPending.delete(settledSessionId);
				} else if (state.pending.size === 0) {
					nextPending.clear();
				}
				const sameIds = state.ids.size === nextIds.size && [...nextIds].every((id) => state.ids.has(id));
				const samePending = state.pending.size === nextPending.size && [...nextPending].every((id) => state.pending.has(id));
				if (sameIds && samePending && state.ready) return;
				publish({ ready: true, ids: nextIds, pending: nextPending });
			};
			return {
				bind(next) { api = next; },
				subscribe(listener) {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				getSnapshot: () => state,
				adopt: (favoriteSessionIds) => adopt(favoriteSessionIds),
				ensure() {
					if (api === undefined || state.ready) return Promise.resolve();
					if (loading !== undefined) return loading;
					if (Date.now() < retryAt) return Promise.resolve();
					loading = api.favoriteSessions().then((value) => { adopt(value.favoriteSessionIds); }).catch((reason) => {
						// 客户端启动时 remote 往往还没挂上：这次失败不能当成「没有收藏」，保持未就绪等待重试。
						console.warn("archive-manager: load favorites failed, will retry", reason);
						retryAt = Date.now() + 600;
					}).finally(() => { loading = undefined; });
					return loading;
				},
				async toggle(sessionId) {
					if (api === undefined || !state.ready || state.pending.has(sessionId)) return;
					const wasFavorite = state.ids.has(sessionId);
					const favorite = !wasFavorite;
					const optimistic = new Set(state.ids);
					if (favorite) optimistic.add(sessionId);
					else optimistic.delete(sessionId);
					const pending = new Set(state.pending);
					pending.add(sessionId);
					publish({ ready: true, ids: optimistic, pending });
					try {
						const value = await api.setSessionFavorite({ sessionId, favorite });
						if (!Array.isArray(value?.favoriteSessionIds)) throw new TypeError("favorite response is missing favoriteSessionIds");
						adopt(value.favoriteSessionIds, sessionId);
					} catch (reason) {
						console.warn("archive-manager: sidebar favorite toggle failed", reason);
						// 差量反向回滚：只针对当前失败的 sessionId 回滚为 wasFavorite，不冲掉并发的其他成功项
						const nextIds = new Set(state.ids);
						if (wasFavorite) nextIds.add(sessionId);
						else nextIds.delete(sessionId);
						const settled = new Set(state.pending);
						settled.delete(sessionId);
						publish({ ready: true, ids: nextIds, pending: settled });
					}
				}
			};
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
		function FeedbackIcon() {
			const IconEditOutlineRegular = (_deepseek_ai_dsh_client_ui_primitives as Record<string, unknown>).IconEditOutlineRegular as React.ComponentType<{ size?: number }>;
			return (0, react_jsx_runtime.jsx)(IconEditOutlineRegular, { size: 16 });
		}
		/**
		* 归档管理设置页：集中处理筛选、多选、恢复、删除和原生会话导航。
		*/
		function ArchivedSessionsSection({ archiveSessions, archiveSession, sessionStore, workspaceStore, unarchiveSession, deleteSession, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, openConversation, focusSessionWorkspace, viewState, close, t, diagnoseOrphanSubagents, cleanOrphanSubagents, diagnoseSessionCaches, rebuildSessionCaches, refreshCacheLists, searchSessionContent, searchArchivedContent, previewArchivedSession, favoriteSessions, setSessionFavorite, favoriteSync, organizeBatch, useSessionPendingInteraction, useSessionStatus }: ArchiveProps) {
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
			const deleteLock = (0, react.useRef)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)<string | null>(null);
			const [notice, setNotice] = (0, react.useState)<string | null>(null);
			const requestDelete = (target: ArchiveDeleteTarget) => { setError(null); setNotice(null); setDeleteTarget(target); };
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
			const [searchScope, setSearchScope] = react.useState("content");
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
			const favoriteSet = (0, react.useMemo)(() => new Set(favoriteIds), [favoriteIds]);
			const loadFavorites = async () => {
				if (!favoriteSessions) return;
				try { const result = await favoriteSessions(); setFavoriteIds(result.favoriteSessionIds); setFavoritesReady(true); favoriteSync?.adopt(result.favoriteSessionIds); }
				catch (reason) { setFavoritesReady(false); setError(errorMessage(reason)); }
			};
			(0, react.useEffect)(() => { let active = true; if (favoriteSessions) favoriteSessions().then((value) => { if (active) { setFavoriteIds(value.favoriteSessionIds); setFavoritesReady(true); favoriteSync?.adopt(value.favoriteSessionIds); } }).catch((reason) => { if (active) setError(errorMessage(reason)); }); return () => { active = false; }; }, [favoriteSessions]);
			// 主界面星标与面板共用一份收藏：行内点星后面板立刻跟上，反之亦然。
			(0, react.useEffect)(() => {
				if (!favoriteSync) return;
				return favoriteSync.subscribe(() => {
					const snapshot = favoriteSync.getSnapshot();
					if (!snapshot.ready) return;
					setFavoriteIds([...snapshot.ids]);
					setFavoritesReady(true);
				});
			}, [favoriteSync]);
			const toggleFavorite = async (sessionId: string) => {
				if (favoriteLock.current || busy || !favoritesReady) return;
				favoriteLock.current = true; setFavoriteBusy(true); setError(null);
				try { const value = await setSessionFavorite({ sessionId, favorite: !favoriteSet.has(sessionId) }); setFavoriteIds(value.favoriteSessionIds); favoriteSync?.adopt(value.favoriteSessionIds); }
				catch (reason) { setError(errorMessage(reason)); }
				finally { favoriteLock.current = false; setFavoriteBusy(false); }
			};
			const executeBatch = async (kind: OrganizeKind, ids: string[], { idle = false, retry = false } = {}) => {
				if (batchLock.current || favoriteLock.current || unarchivingSessionIdsRef.current.size > 0 || !organizeBatch) return;
				batchLock.current = true; setBusy(true); setError(null); setNotice(null); setBatchResult(null);
				if (kind === "archive" && !retry) setLastArchive([]);
				try {
					const result = await organizeBatch(kind, ids, { idleDays: idle ? Number(idleDays) : undefined, getPending: () => pendingRef.current, onProgress: (progress) => {
						setBatchProgress(progress);
						// 列表刷新可能很慢。条目已经处理完就关掉确认框，不要把窗口留在 15/15。
						if (kind === "archive" && progress.total > 0 && progress.done >= progress.total) {
							setArchiveTarget(null);
							setArchiveGroup(null);
							setIdleRequest(false);
						}
					} });
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
			const [orphanInfo, setOrphanInfo] = (0, react.useState)<{ count: number; items: { sessionId: string; parentSessionId: string; createdAt: number; sizeBytes: number }[]; totalSizeBytes: number } | null>(null);
			const [cacheRepair, setCacheRepair] = (0, react.useState)<CacheRepairState>({ diagnosis: { count: 0, items: [] }, busy: false, progress: null, result: null, error: null, refreshError: null });
			const cacheController = (0, react.useRef)<ReturnType<typeof createCacheRebuildController> | null>(null);
			(0, react.useEffect)(() => {
				if (!diagnoseSessionCaches || !rebuildSessionCaches || !refreshCacheLists) return;
				const controller = createCacheRebuildController({ diagnose: diagnoseSessionCaches, rebuild: rebuildSessionCaches, refresh: refreshCacheLists });
				cacheController.current = controller;
				const off = controller.subscribe(() => {
					setCacheRepair(controller.snapshot());
				});
				void controller.load();
				return () => { off(); controller.dispose(); cacheController.current = null; };
			}, [diagnoseSessionCaches, rebuildSessionCaches, refreshCacheLists]);
			(0, react.useEffect)(() => {
				if (!cacheController.current?.snapshot().busy) void cacheController.current?.load();
			}, [workspaceState.archivedSessionIds]);
			const runCacheRebuild = async (retry = false) => {
				if (busy || batchLock.current || !cacheController.current || cacheController.current.snapshot().busy) return;
				batchLock.current = true; setBusy(true);
				try { await cacheController.current.run(retry); }
				finally { batchLock.current = false; if (navigationActive.current) setBusy(false); }
			};
			const [orphanCleaning, setOrphanCleaning] = (0, react.useState)(false);
			const loadOrphans = () => {
				if (typeof diagnoseOrphanSubagents === "function") {
					diagnoseOrphanSubagents().then(setOrphanInfo).catch((err) => {
						console.warn("archive-manager: diagnose orphan subagents failed", err);
					});
				}
			};
			(0, react.useEffect)(() => {
				loadOrphans();
			}, [workspaceState.archivedSessionIds]);

			const cleanOrphans = async () => {
				if (orphanCleaning || typeof cleanOrphanSubagents !== "function") return;
				setOrphanCleaning(true); setError(null); setNotice(null);
				try {
					const res = await cleanOrphanSubagents({});
					if (res.cleanedSessionIds.length > 0 || res.skippedSessionIds.length > 0) {
						loadOrphans();
					}
					if (res.failures.length > 0) {
						setNotice(null);
						setError(formatBatchFailures(res.failures, t));
					} else if (res.cleanedSessionIds.length > 0) {
						setError(null);
						setNotice(t("organizer.orphanCleanSuccess", { n: res.cleanedSessionIds.length }));
					}
				} catch (error) {
					setError(errorMessage(error));
				} finally {
					setOrphanCleaning(false);
				}
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
				if (tab !== "archived" && sortBy === "archived") setSortBy("updated");
			};
			const performArchive = async (ids: string[] | null, idle = false) => {
				if (archiveBusy.current || busy || !ids?.length) return;
				if (organizeBatch) {
					archiveBusy.current = true;
					try {
						const result = await executeBatch("archive", ids, { idle });
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
					const result = await archiveSessions(ids);
					setArchiveTarget(null); setArchiveGroup(null);
					if (result.archivedSessionIdsAdded.length > 0) setNotice(t("archives.archiveSuccess", { n: result.archivedSessionIdsAdded.length }));
					if (result.failures && result.failures.length > 0) setError(formatBatchFailures(result.failures, t));
					else {
						setSelectedSessionIds([]);
						setArchiveTab("archived");
						setProject("all");
						setQuery("");
					}
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
			const confirmArchive = () => performArchive(archiveTarget, idleRequest);
			const copyId = async (session: ClientSession) => {
				setError(null); setNotice(null);
				try {
					await copySessionText(session.id);
					if (navigationActive.current) setNotice(t("details.copied"));
				} catch (reason) { if (navigationActive.current) setError(typeof errorCode(reason) === "string" && String(errorCode(reason)).startsWith("copy.") ? t(String(errorCode(reason))) : errorMessage(reason)); }
			};
			const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t, isArchived ? workspaceState.archivedSessionIds : undefined), [groups, sortBy, createdAtById, t, isArchived, workspaceState.archivedSessionIds]);
			(0, react.useEffect)(() => {
				// 归档名单在批量删除中会逐条变化。忙碌时不重读，结束后再补一次。
				if (busy) return;
				let cancelled = false;
				archivedSessionMetadata().then((result) => {
					if (!cancelled) setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
				}).catch(() => {
					if (!cancelled) setCreatedAtById({});
				});
				return () => {
					cancelled = true;
				};
			}, [archivedSessionMetadata, workspaceState.archivedSessionIds, busy]);
			(0, react.useEffect)(() => {
				if (project !== "all" && !groups.some((group) => group.key === project)) setProject("all");
			}, [groups, project]);
			const invalidDate = !validUpdatedRange(dateFrom, dateTo);
            const candidateGroups = sortedGroups.filter(group => project === "all" || project === group.key).map(group => ({ ...group, sessions: group.sessions.filter(session => (!favoritesOnly || favoriteSet.has(session.id)) && matchesUpdatedRange(session.updatedAt, dateFrom, dateTo)) })).filter(group => group.sessions.length);
            const contentEnabled = searchScope === "content" && !invalidDate;
            const contentSearch = useArchiveSearch(candidateGroups.flatMap(group => group.sessions.map(session => session.id)), query, contentEnabled, searchSessionContent ?? searchArchivedContent);
            const contentMatches = new Map(contentSearch.items.map(item => [item.sessionId, item]));
            const preview = useArchivePreview(previewArchivedSession, isArchived ? workspaceState.archivedSessionIds : []);
            const normalizedQuery = query.trim().toLocaleLowerCase();
            const filteredGroups = candidateGroups.map(group => ({ ...group, sessions: group.sessions.filter(session => !normalizedQuery || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery) || contentMatches.has(session.id)) })).filter(group => group.sessions.length);
            const idleCandidates = favoritesReady ? filteredGroups.flatMap((group) => group.sessions).filter((session) => idleArchiveCandidate(session, { days: Number(idleDays), favorites: favoriteSet, currentId: currentSessionId(sessions), pending: uiFacts.pending })).map((session) => session.id) : [];
			const visibleSessionIds = (0, react.useMemo)(() => archivedSessionIdsInGroups(filteredGroups), [filteredGroups]);
			const selectedSessionIdSet = (0, react.useMemo)(() => new Set(selectedSessionIds), [selectedSessionIds]);
			const undoableArchiveCount = (0, react.useMemo)(() => {
				const archived = new Set(workspaceState.archivedSessionIds);
				return lastArchive.reduce((count, id) => count + (archived.has(id) ? 1 : 0), 0);
			}, [lastArchive, workspaceState.archivedSessionIds]);
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
					if (result.unarchivedSessionIds.length > 0) setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
					if (result.failures && result.failures.length > 0) setError(formatBatchFailures(result.failures, t, formatUnarchiveError));
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
				if (busy || deleteLock.current || deleteTarget === null) return;
				// 批量删除恒定走宿主的一次作用域调用。organizeBatch 恒为真，旧守卫因此永远走逐条 deleteSession。
				if (deleteTarget.kind !== "batch") {
					deleteLock.current = true;
					setBusy(true);
					setError(null);
					setNotice(null);
					try {
						await deleteSession(deleteTarget.session.id);
						setDeleteTarget(null);
					} catch (reason) {
						setError(formatDeleteError(reason, t));
					} finally {
						deleteLock.current = false;
						setBusy(false);
					}
					return;
				}
				if (batchLock.current || favoriteLock.current || unarchivingSessionIdsRef.current.size > 0) return;
				const { target } = deleteTarget;
				if (target.scope === "sessions" && deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length === 0) {
					setDeleteTarget(null);
					return;
				}
				batchLock.current = true;
				setBusy(true);
				setError(null);
				setNotice(null);
				setBatchResult(null);
				setBatchProgress(null);
				try {
					const result = await deleteArchivedSessions(target);
					const feedback = archivedDeleteFeedback(result, t);
					if (feedback.kind === "error") setError(feedback.message);
					else setNotice(feedback.message);
					const completed = new Set([...result.deletedSessionIds, ...result.skippedSessionIds]);
					setLastArchive((previous) => previous.filter((id) => !completed.has(id)));
					setSelectedSessionIds((current) => current.filter((sessionId) => !completed.has(sessionId)));
					setFavoriteIds((previous) => previous.filter((id) => !completed.has(id)));
					const remaining = result.failures.map((failure) => failure.sessionId);
					retryBatch.current = remaining.length > 0 ? { kind: "delete", ids: remaining, idle: false } : null;
					setBatchResult({
						requested: result.requestedSessionIds,
						succeeded: result.deletedSessionIds,
						skipped: result.skippedSessionIds,
						failures: result.failures,
						remaining,
						refreshError: "refreshError" in result && typeof result.refreshError === "string" ? result.refreshError : null,
						kind: "delete",
						tab: archiveTab,
					});
					setDeleteTarget(null);
				} catch (reason) {
					setError(formatDeleteError(reason, t));
				} finally {
					batchLock.current = false;
					setBusy(false);
				}
			};
			const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
			const deleteDialogTitle = batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget?.kind === "batch" ? deleteTarget.title : "" }) : batchScope === "sessions" ? t("archives.deleteSelectedTitle") : t("deleteSession.title");
			const deleteDialogDescription = deleteTarget === null ? void 0 : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget?.kind === "batch" ? deleteTarget.title : "", n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : batchScope === "sessions" ? t("archives.deleteSelectedDesc", { n: deleteTarget.kind === "batch" ? deleteTarget.count : 0 }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.kind === "session" ? deleteTarget.session : {}, t) });
			const deleteConfirmLabel = batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : batchScope === "sessions" ? t("archives.deleteSelectedConfirm") : t("deleteSession.title");
			return (0, react_jsx_runtime.jsxs)("section", {
				className: "dsham_settings",
				"aria-label": t("archives.title"),
				children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_TABS_CSS + ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS + ARCHIVE_SETTINGS_SELECTION_CSS }), (0, react_jsx_runtime.jsxs)("div", {
					// 设置页使用独立布局容器，避免被 Codex UI 的会话 header 页签适配器识别。
					className: "dsham_settingsHeader",
					children: [(0, react_jsx_runtime.jsxs)("div", {
					children: [(0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsTitleRow", children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsLinks", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", size: "sm", "aria-label": t("archives.viewProject"), icon: (0, react_jsx_runtime.jsx)(GithubMark16, {}), onClick: () => window.open("https://github.com/MichengAI/dsh-archive-manager", "_blank", "noreferrer"), children: t("archives.viewProject") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", size: "sm", "aria-label": t("archives.feedback"), icon: (0, react_jsx_runtime.jsx)(FeedbackIcon, {}), onClick: () => window.open("https://github.com/MichengAI/dsh-archive-manager/issues", "_blank", "noreferrer"), children: t("archives.feedback") })] })] }), (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsIntro", children: t("archives.description") })]
					}), react.createElement("div", tabsShell(busy || unarchivingSessionIds.size > 0, (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SegmentedTabs, {
						className: "dsham_archiveTabs", label: t("archives.title"), value: archiveTab === "unarchived" ? "unarchived" : "archived", onChange: (value: string) => switchTab(value === "unarchived" ? "unarchived" : "archived"),
					items: [
						{
							value: "archived",
							label: (0, react_jsx_runtime.jsxs)("span", {
								className: "dsham_tabLabel",
								children: [
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineMedium, { size: 14 }),
									(0, react_jsx_runtime.jsx)("span", { children: t("archives.tab.archived") })
								]
							}),
							id: "dsham-tab-archived",
							panelId: "dsham-archive-panel"
						},
						{
							value: "unarchived",
							label: (0, react_jsx_runtime.jsxs)("span", {
								className: "dsham_tabLabel",
								children: [
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseMedium, { size: 14 }),
									(0, react_jsx_runtime.jsx)("span", { children: t("archives.tab.unarchived") })
								]
							}),
							id: "dsham-tab-unarchived",
							panelId: "dsham-archive-panel"
						}
					]
					})))]
				}), (0, react_jsx_runtime.jsxs)("div", { id: "dsham-archive-panel", role: "region", "aria-label": t(archiveTab === "unarchived" ? "archives.tab.unarchived" : "archives.tab.archived"), children: [(0, react_jsx_runtime.jsx)("div", {
					className: "dsham_settingsToolbar",
					children: (0, react_jsx_runtime.jsxs)("div", {
						className: "dsham_settingsSearch",
						children: [
							(0, react_jsx_runtime.jsx)(ArchiveProjectSelect, {
								id: "dsham-favorite-filter",
								className: "dsham_srOnly",
								tabIndex: -1,
								"aria-hidden": true,
								value: favoritesOnly ? "favorites" : "all",
								options: [{ value: "all", label: t("organizer.allSessions") }, { value: "favorites", label: t("organizer.favoritesOnly") }],
								onChange: (value) => typeof setFavoritesOnly === "function" && setFavoritesOnly(value === "favorites"),
								"aria-label": t("organizer.favoriteFilter")
							}),
							(0, react_jsx_runtime.jsx)(ArchiveProjectSelect, {
								id: "dsham-search-scope",
								className: "dsham_srOnly",
								tabIndex: -1,
								"aria-hidden": true,
								value: searchScope,
								options: [{ value: "title", label: t("discovery.titleOnly") }, { value: "content", label: t("discovery.titleAndContent") }],
								onChange: (value) => typeof setSearchScope === "function" && setSearchScope(value),
								"aria-label": t("discovery.scope")
							}),
							(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								id: "dsham-search-input",
								className: "dsham_searchField",
								type: "search",
								icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineMedium, { size: 16, "aria-hidden": true }),
								autoComplete: "off",
								spellCheck: false,
								maxLength: 200,
								value: query,
								onChange: (event: { target: { value: string } }) => setQuery(event.target.value),
								placeholder: t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived"),
								"aria-label": t(contentEnabled ? "discovery.searchPlaceholder" : isArchived ? "archives.searchPlaceholder" : "archives.searchUnarchived")
							}),
							(0, react_jsx_runtime.jsx)(ArchiveViewSortMenu, {
								id: "dsham-sort-filter",
								t,
								disabled: busy,
								favoritesOnly,
								setFavoritesOnly,
								favoriteBusy: busy || favoriteBusy || !favoritesReady,
								sortBy: (!isArchived && sortBy === "archived") ? "updated" : sortBy,
								setSortBy,
								options: [...(isArchived ? [{ value: "archived", label: t("archives.sortArchived") }] : []), { value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }]
							}),
							(0, react_jsx_runtime.jsx)(ArchiveProjectSelect, {
								id: "dsham-project-filter",
								className: "dsham_projectFilter",
								value: project,
								title: project === "all" ? t("archives.allProjects") : (sortedGroups.find((g) => g.key === project)?.title ?? project),
								options: [{ value: "all", label: t("archives.allProjects") || "所有项目", title: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title, title: group.title }))],
								onChange: setProject,
								"aria-label": t("archives.projectFilter")
							}),
							react.createElement(DiscoveryFilters, {
								t,
								from: dateFrom,
								to: dateTo,
								onFrom: setDateFrom,
								onTo: setDateTo,
								invalid: invalidDate,
								onClear: () => { setDateFrom(""); setDateTo(""); }
							})
						]
					})
				}), react.createElement("style", null, discoveryCss), react.createElement(SearchStatus, { state: contentSearch, t }), organizeBatch && (0, react_jsx_runtime.jsx)(OrganizerPanel, {
					t, archived: isArchived, busy: busy || favoriteBusy || unarchivingSessionIds.size > 0, ready: favoritesReady,
					days: idleDays, onDays: setIdleDays, count: idleCandidates.length,
					onPreview: () => { requestArchive(idleCandidates); setIdleRequest(true); },
					progress: batchProgress, result: batchResult?.tab === archiveTab ? batchResult : null,
					onRetry: () => { const retry = retryBatch.current; if (retry) { if (retry.kind === "delete") requestDelete({ kind: "batch", target: { scope: "sessions", sessionIds: retry.ids }, count: retry.ids.length }); else executeBatch(retry.kind, retry.ids, { idle: retry.idle, retry: true }); } },
					undoCount: undoableArchiveCount,
					onUndo: () => executeBatch("undo", lastArchive, { retry: true }), onReload: loadFavorites,
					orphanCount: orphanInfo?.count ?? 0,
					cacheCount: cacheRepair.diagnosis.count, cacheRepair,
					onRebuildCaches: () => runCacheRebuild(), onRetryCaches: () => runCacheRebuild(true),
					onReloadCaches: async () => {
						try {
							await refreshCacheLists?.();
							await cacheController.current?.load();
							if ((cacheController.current?.snapshot().diagnosis.count ?? 0) === 0) cacheController.current?.dismiss();
						} catch (reason) { if (navigationActive.current) setError(errorMessage(reason)); }
					},
					onDismissCaches: () => cacheController.current?.dismiss(),
					orphanSizeBytes: orphanInfo?.totalSizeBytes ?? 0,
					orphanCleaning,
					onCleanOrphans: cleanOrphans
				}), groups.length > 0 && (0, react_jsx_runtime.jsx)(ArchiveSelectionToolbar, {
					selectedCount: selectedSessionIds.length,
					hiddenCount: selectedSessionIds.length - selectedVisibleCount,
					allVisibleSelected, selectedVisibleCount, visibleCount: visibleSessionIds.length, busy, t,
					onToggle: toggleVisibleSelection,
					onClear: () => setSelectedSessionIds([]),
					onArchive: isArchived ? undefined : () => requestArchive([...selectedSessionIds]),
					onRestore: onSelectedUnarchive,
					onDelete: () => requestDelete({ kind: "batch", target: { scope: "sessions", sessionIds: selectedSessionIds }, count: selectedSessionIds.length })
				}), groups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: t(isArchived ? "archives.empty" : "archives.emptyUnarchived") }) : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsEmpty", children: contentSearch.status === "loading" || contentSearch.status === "error" || contentSearch.failures.length ? null : t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
					const target = archivedBatchTargetForGroup(group.key);
					const groupSessionIds = groups.find((item) => item.key === group.key)?.sessions.map((session) => session.id) ?? [];
					const count = isArchived ? deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length : groupSessionIds.length;
					return (0, react_jsx_runtime.jsxs)("section", {
						className: "dsham_settingsGroup",
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: "dsham_settingsGroupHeading",
							children: [(0, react_jsx_runtime.jsx)("h3", { className: "dsham_settingsGroupTitle", children: (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dsham_groupToggle", "aria-expanded": !collapsedGroups.has(group.key), "aria-controls": "dsham-group-" + encodeURIComponent(group.key), onClick: () => setCollapsedGroups((previous) => { const next = new Set(previous); if (next.has(group.key)) next.delete(group.key); else next.add(group.key); return next; }), children: [(0, react_jsx_runtime.jsx)(collapsedGroups.has(group.key) ? _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineMedium : _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineMedium, {}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutlineMedium, {}), (0, react_jsx_runtime.jsx)("span", { children: group.title })] }) }), (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsham_settingsCount", children: t("archives.sessionCount", { n: group.sessions.length }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, onArchive: isArchived ? undefined : () => requestArchive(groupSessionIds, group), onRestore: () => onBatchUnarchive(target), onDelete: () => requestDelete({ kind: "batch", target, title: group.title, count }), t })] })]
						}), (0, react_jsx_runtime.jsx)("div", {
							className: "dsham_settingsList", id: "dsham-group-" + encodeURIComponent(group.key),
							hidden: collapsedGroups.has(group.key) || undefined,
							children: !collapsedGroups.has(group.key) && group.sessions.map((session) => (0, react_jsx_runtime.jsxs)("div", {
                  className: "dsham_settingsRow",
                  "data-selected": selectedSessionIdSet.has(session.id),
                  children: [
                    (0, react_jsx_runtime.jsx)(ArchiveSelectionCheckbox, { checked: selectedSessionIdSet.has(session.id), disabled: busy, label: t("archives.selectSession", { name: displayTitle(session, t) }), onChange: (event) => toggleSessionSelection(session.id, event.target.checked) }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsContent", children: [
                      (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsham_settingsTitleLink", title: displayTitle(session, t), "aria-label": t("archives.openSession") + t("common.separator") + displayTitle(session, t), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => viewConversation(session), children: displayTitle(session, t) }),
                      (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsMeta", children: [archiveTimeLabel(session.updatedAt, t)] }), contentMatches.has(session.id) && react.createElement("button", { type: "button", className: "dsham_settingsSnippet", disabled: busy, title: t(isArchived ? "discovery.preview" : "archives.openSession"), onClick: () => isArchived ? preview.open(session, query) : viewConversation(session) }, react.createElement(HighlightedText, { text: contentMatches.get(session.id)?.snippet ?? "", query }))
                    ] }),
                    (0, react_jsx_runtime.jsxs)("div", { className: "dsham_settingsActions", children: [
                      typeof setSessionFavorite === "function" && settingsButton({ variant: "outline", className: "dsham_iconAction" + (favoriteSet.has(session.id) ? " dsham_favoriteOn" : ""), title: t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite"), "aria-pressed": favoriteSet.has(session.id), "aria-label": t(favoriteSet.has(session.id) ? "organizer.unfavorite" : "organizer.favorite") + t("common.separator") + displayTitle(session, t), disabled: busy || favoriteBusy || !favoritesReady, onClick: () => toggleFavorite(session.id), children: (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: favoriteSet.has(session.id) ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", "aria-hidden": true, style: { display: "block" }, children: (0, react_jsx_runtime.jsx)("path", { d: STAR_PATH }) }) }),
                      settingsButton({ variant: "outline", className: "dsham_iconAction", title: t(isArchived ? "archives.restore" : "archives.archiveSelected"), "aria-label": t(isArchived ? "archives.restore" : "archives.archiveSelected"), disabled: busy || unarchivingSessionIds.has(session.id), onClick: () => isArchived ? onUnarchive(session.id) : performArchive([session.id]), icon: (0, react_jsx_runtime.jsx)(isArchived ? _deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineMedium : _deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineMedium, { size: 16 }) }),
                      isArchived && (0, react_jsx_runtime.jsx)(ArchivedSessionMenu, { busy: busy || unarchivingSessionIds.has(session.id), t, title: displayTitle(session, t), onCopyId: () => copyId(session), onPreview: typeof previewArchivedSession === "function" ? () => preview.open(session, query) : undefined, onRestoreOpen: () => viewConversation(session, true), onDelete: () => requestDelete({ kind: "session", session }) })
                    ] })
                  ]
                }, session.id))
						})]
					}, group.key);
				}), react.createElement(SettingsModal, {
                    width: 900, open: preview.target !== null, onClose: preview.close, title: preview.target ? displayTitle(preview.target.session, t) : t("discovery.preview"),
                    footer: modalFooterButton({ variant: "primary", disabled: busy, onClick: () => { if (preview.target) { const session = preview.target.session; preview.close(); return viewConversation(session); } }, children: t("discovery.openFull") }),
                    children: react.createElement(PreviewContent, { preview, t, MarkdownText: _deepseek_ai_dsh_client_ui_primitives.MarkdownText })
                }), archiveTarget === null && error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: archiveTarget !== null,
					onClose: closeArchive,
					title: t("archives.archiveTitle", { n: archiveTarget?.length ?? 0 }), description: archiveGroup === null ? t("archives.archiveSelectedDesc") : t(archiveGroup.key === ARCHIVE_UNGROUPED_KEY ? "archives.archiveUngroupedDesc" : "archives.archiveProjectDesc", { name: archiveGroup.title, n: archiveTarget?.length ?? 0 }),
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						modalFooterButton({ disabled: busy, onClick: closeArchive, children: t("cancel") }),
						modalFooterButton({ variant: "primary", disabled: busy || !archiveTarget?.length, onClick: confirmArchive, children: t("archives.archiveSelected") })
					] }), children: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						organizeBatch && (0, react_jsx_runtime.jsx)("p", { children: t(idleRequest ? "organizer.idleConfirm" : "organizer.manualConfirm") }),
						organizeBatch && (0, react_jsx_runtime.jsx)("div", { className: "dsham_archivePreview", children: (archiveTarget ?? []).map((id) => (0, react_jsx_runtime.jsxs)("label", { children: [(0, react_jsx_runtime.jsx)(SelectionCheckbox, { checked: true, disabled: busy, label: displayTitle(sessions.byId[id] ?? { id }, t), onChange: () => setArchiveTarget((current) => (current ?? []).filter((value) => value !== id)) }), displayTitle(sessions.byId[id] ?? { id }, t)] }, id)) }),
						batchProgress && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [(0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total) }), t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] }),
						error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error })
					] })
					}), (0, react_jsx_runtime.jsx)(SettingsModal, {
					open: stopArchive !== null,
					onClose: () => { if (!busy) { setStopArchive(null); setError(null); } },
					title: t("archiveActive.title"),
					...stopArchive === null ? {} : { description: t("archiveActive.desc", { name: stopArchive.title, kinds: stopArchive.kinds }) },
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						modalFooterButton({ disabled: busy, onClick: () => { if (!busy) { setStopArchive(null); setError(null); } }, children: t("cancel") }),
						modalFooterButton({ danger: true, disabled: busy, onClick: async () => {
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
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [modalFooterButton({ disabled: busy, onClick: closeDelete, children: t("cancel") }), modalFooterButton({ danger: true, disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
					children: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						busy && (0, react_jsx_runtime.jsxs)("div", { role: "status", children: [deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending"), batchProgress && (0, react_jsx_runtime.jsx)("progress", { value: batchProgress.done, max: Math.max(1, batchProgress.total), "aria-label": t("organizer.progress") }), batchProgress && t("organizer.progressCount", { done: batchProgress.done, total: batchProgress.total })] }),
						error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsham_settingsError", role: "alert", children: error })
					] })
				})] })]
			});
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
		function formatBatchFailures(failures: { sessionId: string; message: string }[], t: Translate, format = formatArchiveError) {
			return failures.map((failure) => failure.sessionId + t("common.separator") + format(new Error(failure.message), t)).join("\n");
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
		/**
		 * 判断会话是否属于当前工作区主任务侧栏的候选。
		 * 与官方 `sessionVisible` 对齐：排除已归档、子代理、未开始的空白占位和缺失摘要。
		 * IM 渠道与定时任务不再排除，这两类会话会随对应插件放开进入主侧栏。
		 */
		function isWorkspaceTaskCandidate(id: string, sessionMap: Record<string, { origin?: string; blank?: boolean }> | undefined, archived: Set<string>): boolean {
			if (!id || archived.has(id)) return false;
			// 侧栏只渲染有摘要的会话；缺失摘要的 ID 不属于“所见”，不能参与批量归档。
			const summary = sessionMap?.[id];
			if (summary === undefined) return false;
			// 子代理不是主任务会话，官方侧栏也不渲染。
			if (summary.origin === "subagent") return false;
			// 排除未发生对话的空白占位会话（原生侧栏默认隐藏）。
			if (summary.blank) return false;
			return true;
		}
		/**
		 * 从点击目标定位侧栏工作区行，供工作区菜单注入使用。
		 * 只认最近的 `data-row-key` 行：会话行、溢出项或空白区域一律返回 null，
		 * 避免上一次点击工作区留下的上下文串到单条会话的 `...` 菜单。
		 */
		function workspaceMenuTriggerFrom(target: Element | null): { workspaceId: string; title: string } | null {
			const row = target?.closest<HTMLElement>("[data-row-key]") ?? null;
			if (row === null) return null;
			const key = row.getAttribute("data-row-key") ?? "";
			if (!key.startsWith("workspace:")) return null;
			const workspaceId = key.slice("workspace:".length);
			if (!workspaceId) return null;
			const titleEl = row.querySelector<HTMLElement>(".title") ?? row.querySelector<HTMLElement>("[class*='title']");
			return { workspaceId, title: titleEl?.textContent?.trim() || workspaceId };
		}
		/**
		 * 从侧栏工作区行或会话行中定位其操作菜单（"..."）触发按钮。
		 * 优先按 rowActions 下的 actions 语义匹配，避免误取新建会话、折叠或收藏等非菜单按钮。
		 */
		function findRowMenuButton(row: HTMLElement): HTMLButtonElement | null {
			const actionsContainer = row.querySelector('[class*="rowActions"]') ?? row;
			const buttons = Array.from(actionsContainer.querySelectorAll<HTMLButtonElement>("button"));
			if (buttons.length === 0) return null;

			const actionBtn = buttons.find((btn) => {
				const label = (btn.getAttribute("aria-label") ?? btn.getAttribute("title") ?? "").toLowerCase();
				return /action|操作|действи|more|更多/.test(label);
			});
			if (actionBtn) return actionBtn;

			const nonAddBtn = buttons.find((btn) => {
				const label = (btn.getAttribute("aria-label") ?? btn.getAttribute("title") ?? "").toLowerCase();
				return !/new|create|新建|add|\+|созда/.test(label);
			});
			if (nonAddBtn) return nonAddBtn;

			return buttons[0] ?? null;
		}
		/** 判断一个被点击的按钮是否为行操作菜单触发按钮。 */
		function isRowMenuButton(button: HTMLButtonElement, row: HTMLElement): boolean {
			const menuBtn = findRowMenuButton(row);
			if (menuBtn === button) return true;
			const label = (button.getAttribute("aria-label") ?? button.getAttribute("title") ?? "").toLowerCase();
			return /action|操作|действи|more|更多/.test(label);
		}
		/**
		 * 监听侧栏工作区行与会话行的整行右键点击，阻止系统默认右键菜单并唤起对应的 "..." 操作菜单。
		 * 若右键在输入框（重命名中）或特定功能按钮（如新建、星标），则放行或避让。
		 */
		function setupSidebarRowContextMenu(): () => void {
			if (typeof document === "undefined" || typeof document.addEventListener !== "function") return () => {};

			const onContextMenu = (event: MouseEvent) => {
				const target = event.target as Element | null;
				if (!target) return;

				if (target.closest("input, textarea, [contenteditable='true']")) return;

				const row = target.closest<HTMLElement>('[data-row-key^="workspace:"], [data-row-key^="session:"]');
				if (!row) return;

				const clickedButton = target.closest<HTMLButtonElement>("button");
				if (clickedButton && !isRowMenuButton(clickedButton, row)) {
					return;
				}

				const menuBtn = findRowMenuButton(row);
				if (!menuBtn) return;

				event.preventDefault();
				event.stopPropagation();

				menuBtn.click();
			};

			document.addEventListener("contextmenu", onContextMenu, true);
			return () => {
				document.removeEventListener("contextmenu", onContextMenu, true);
			};
		}
		/** 识别工作区操作菜单里的“删除工作区”项；文案缺失时用 danger 类名兜底。 */
		function isWorkspaceDeleteMenuItem(item: { textContent: string | null; className: string }, allowDangerFallback = true): boolean {
			const text = (item.textContent ?? "").toLowerCase();
			if (text.includes("删除工作区") || text.includes("delete workspace") || text.includes("удалить рабочее")) return true;
			return allowDangerFallback && /(?:^|[_\s-])danger(?:$|[_\s-])/i.test(item.className);
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
		/** Row display title: blank rows show the localized New Session label. */
		function displayTitle(node: { blank?: boolean; title?: string; displayTitle?: string }, t: Translate) {
			return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
		}
		/** 归档页使用绝对时间，方便在历史记录中准确辨识会话。 */
		function archiveTimeLabel(updatedAt: number, t: Translate) {
			const date = new Date(updatedAt);
			const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
			return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
		}
		//#region dsh-archive-manager: settings section
		const ARCHIVE_TABS_CSS = [
			".dsham_archiveTabsLocked{opacity:.5}",
			".dsham_archiveTabs{display:grid!important;box-sizing:border-box!important;height:32px!important;min-height:32px!important;max-height:32px!important;padding:2px!important;border:0!important;border-radius:var(--dsw-radius-sm,8px)!important;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l2)!important;background:var(--dsw-alias-bg-layer-1)!important}",
			".dsham_archiveTabs>span[aria-hidden=\"true\"],.dsham_archiveTabs>[class*=\"indicator\"]{inset:2px auto 2px 2px!important;width:calc((100% - 4px)/2)!important;border-radius:6px!important;border:0.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.12))!important;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.08))!important;box-shadow:none!important}",
			".dsham_archiveTabs [role=tab]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:28px!important;padding:0 12px!important;border-radius:6px!important;font-size:13px!important;line-height:20px!important;color:var(--dsw-alias-label-secondary)!important;text-align:center!important;box-sizing:border-box!important;transition:color 150ms ease!important}",
			".dsham_archiveTabs [role=tab]:hover{color:var(--dsw-alias-label-primary)!important}",
			".dsham_archiveTabs [role=tab][aria-selected=\"true\"]{color:var(--dsw-alias-label-primary)!important;font-weight:600!important}",
			".dsham_tabLabel{display:inline-flex;align-items:center;justify-content:center;gap:6px}",
			".dsham_tabLabel svg{flex:none;display:block}"
		].join("");
		// 设置导航图标：100% 对齐 dshmarket 规范，采用纯属性标记 + CSS ::before 伪元素，禁止 DOM prepend 注入避免移动端文字重叠
		const SETTINGS_NAV_ICON_MARKER = "data-dsham-nav-icon";
		const SETTINGS_NAV_ROW_SELECTOR = '[role="dialog"] nav button';
		const ARCHIVE_NAV_ICON_CSS = [
			`[${SETTINGS_NAV_ICON_MARKER}] > svg { display: none !important; }`,
			`[${SETTINGS_NAV_ICON_MARKER}]::before {`,
			`  content: '';`,
			`  flex: none;`,
			`  width: 16px;`,
			`  height: 16px;`,
			`  background-color: currentColor;`,
			`  -webkit-mask: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.3%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M13.5%202.5H2.5C1.94772%202.5%201.5%202.94772%201.5%203.5V4.5C1.5%205.05228%201.94772%205.5%202.5%205.5H13.5C14.0523%205.5%2014.5%205.05228%2014.5%204.5V3.5C14.5%202.94772%2014.0523%202.5%2013.5%202.5Z%22%2F%3E%3Cpath%20d%3D%22M2.5%205.5V13.5C2.5%2013.7652%202.60536%2014.0196%202.79289%2014.2071C2.98043%2014.3946%203.23478%2014.5%203.5%2014.5H12.5C12.7652%2014.5%2013.0196%2014.3946%2013.2071%2014.2071C13.3946%2014.0196%2013.5%2013.7652%2013.5%2013.5V5.5%22%2F%3E%3Cpath%20d%3D%22M6.5%209.5H9.5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") center / contain no-repeat;`,
			`  mask: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.3%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M13.5%202.5H2.5C1.94772%202.5%201.5%202.94772%201.5%203.5V4.5C1.5%205.05228%201.94772%205.5%202.5%205.5H13.5C14.0523%205.5%2014.5%205.05228%2014.5%204.5V3.5C14.5%202.94772%2014.0523%202.5%2013.5%202.5Z%22%2F%3E%3Cpath%20d%3D%22M2.5%205.5V13.5C2.5%2013.7652%202.60536%2014.0196%202.79289%2014.2071C2.98043%2014.3946%203.23478%2014.5%203.5%2014.5H12.5C12.7652%2014.5%2013.0196%2014.3946%2013.2071%2014.2071C13.3946%2014.0196%2013.5%2013.7652%2013.5%2013.5V5.5%22%2F%3E%3Cpath%20d%3D%22M6.5%209.5H9.5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") center / contain no-repeat;`,
			`  -webkit-mask-repeat: no-repeat;`,
			`  mask-repeat: no-repeat;`,
			`  -webkit-mask-position: center;`,
			`  mask-position: center;`,
			`  -webkit-mask-size: 16px 16px;`,
			`  mask-size: 16px 16px;`,
			`}`
		].join("\n");
		/** 设置导航行是否就是本插件的“归档会话”入口。 */
		function isOwnSettingsNavRow(rowText: string | null | undefined, label: string): boolean {
			const wanted = String(label ?? "").trim();
			return wanted.length > 0 && String(rowText ?? "").trim() === wanted;
		}
		/** 判断变更批次是否触及指定选择器（含其后代），避免流式输出时每帧全量扫描。 */
		function mutationTouches(records: readonly MutationRecord[], selector: string): boolean {
			for (const record of records) {
				if (record.type === "characterData") {
					const parent = record.target.parentElement;
					if (parent !== null && parent.closest(selector) !== null) return true;
					continue;
				}
				for (const node of record.addedNodes) {
					if (node.nodeType !== 1) continue;
					const element = node as Element;
					if (element.matches(selector) || element.querySelector(selector) !== null || element.closest(selector) !== null) return true;
				}
			}
			return false;
		}
		/**
		* 100% 对齐 dshmarket：用纯属性标记控制 ::before 伪元素渲染图标。
		* 不修改任何 DOM 节点，避免移动端列表项排版下与文字重叠冲突。
		*/
		function applySettingsNavIcon(button: HTMLElement, label: string): boolean {
			const isOwn = isOwnSettingsNavRow(button.textContent, label);
			if (isOwn) {
				if (button.getAttribute(SETTINGS_NAV_ICON_MARKER) === "") return false;
				button.setAttribute(SETTINGS_NAV_ICON_MARKER, "");
				return true;
			}
			if (button.hasAttribute(SETTINGS_NAV_ICON_MARKER)) {
				button.removeAttribute(SETTINGS_NAV_ICON_MARKER);
				return true;
			}
			return false;
		}
		/** 卸载时移除标记属性，恢复宿主原始导航图标。 */
		function restoreSettingsNavIcon(button: HTMLElement): boolean {
			if (!button.hasAttribute(SETTINGS_NAV_ICON_MARKER)) return false;
			button.removeAttribute(SETTINGS_NAV_ICON_MARKER);
			return true;
		}
		/** 监听设置弹层导航，语言或 DOM 变化后重新匹配本插件入口。 */
		function installSettingsNavIcon(ctx: ClientContext) {
			if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
			ctx.effect(() => {
				// 导航图标在设置弹层打开时就要可见，不能依赖归档页自身是否已渲染。
				const styleId = "dsham-nav-icon-style";
				let style = document.getElementById(styleId) as HTMLStyleElement | null;
				if (style === null) {
					style = document.createElement("style");
					style.id = styleId;
					style.textContent = ARCHIVE_NAV_ICON_CSS;
					(document.head ?? document.documentElement).append(style);
				} else if (style.textContent !== ARCHIVE_NAV_ICON_CSS) {
					style.textContent = ARCHIVE_NAV_ICON_CSS;
				}
				let disposed = false;
				let scheduled = false;
				const sync = () => {
					scheduled = false;
					if (disposed) return;
					const label = ctx.locale.bind(NS)("archived.badge");
					for (const row of document.querySelectorAll<HTMLElement>(SETTINGS_NAV_ROW_SELECTOR)) applySettingsNavIcon(row, label);
				};
				const schedule = () => {
					if (scheduled || disposed) return;
					scheduled = true;
					if (typeof requestAnimationFrame === "function") requestAnimationFrame(sync);
					else setTimeout(sync, 16);
				};
				sync();
				const observer = new MutationObserver((records) => {
					if (mutationTouches(records, '[role="dialog"] nav')) schedule();
				});
				observer.observe(document.body, { childList: true, subtree: true, characterData: true });
				return () => {
					disposed = true;
					observer.disconnect();
					for (const row of document.querySelectorAll<HTMLElement>(`[${SETTINGS_NAV_ICON_MARKER}]`)) restoreSettingsNavIcon(row);
					style?.remove();
				};
			}, "archive-manager: settings nav icon");
		}
		const ARCHIVE_SETTINGS_CSS = [
			".dsham_settings{container-type:inline-size;min-width:0;box-sizing:border-box;width:100%;padding:0 0 32px;color:var(--dsw-alias-label-primary)}",
			".dsham_settingsHeader{display:flex;flex-direction:column;align-items:stretch;gap:16px;margin-bottom:16px}",
			".dsham_settings h2{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;white-space:nowrap}",
			".dsham_settingsIntro{margin:12px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}",
			".dsham_settingsToolbar{display:flex;align-items:center;gap:8px;margin-bottom:16px;width:100%;min-width:0}",
			".dsham_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0;width:100%;flex-wrap:nowrap}",
			"@container(max-width:520px){.dsham_settingsSearch{flex-wrap:wrap}}",
			".dsham_settingsSearch .dsham_searchField{flex:1 1 0;min-width:120px;width:auto;box-sizing:border-box}",
			".dsham_viewSortContainer{flex:0 0 auto;position:relative;box-sizing:border-box}",
			".dsham_viewSortBtn{height:32px!important;padding:0 8px!important;font-size:13px!important;box-sizing:border-box}",
			".dsham_viewSortBtn.has-filter{border-color:var(--dsw-alias-state-business-primary)!important;color:var(--dsw-alias-state-business-primary)!important}",
			".dsham_settingsFilter{display:inline-flex;position:relative}",
			".dsham_settingsSearch .dsham_projectFilter{flex:0 0 auto;max-width:120px;min-width:0;box-sizing:border-box}",
			".dsham_settingsSearch .dsham_projectFilter > span{display:inline-block;max-width:100%;box-sizing:border-box}",
			".dsham_settingsSearch .dsham_projectFilter .dsham_menuSelectBtn{display:inline-flex!important;width:100%;max-width:120px;padding:0 8px;box-sizing:border-box;overflow:hidden}",
			".dsham_settingsSearch .dsham_projectFilter .dsham_selectLabel{flex:1 1 auto;min-width:0;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}",
			".dsham_settingsSearch .dsham_dateFilter{flex:0 0 125px;width:125px;min-width:125px;position:relative;box-sizing:border-box}",
			".dsham_dateRange{width:100%;box-sizing:border-box}",
			".dsham_dateTrigger{height:32px!important;padding:0 8px!important;gap:5px!important;border:0.5px solid var(--dsw-alias-border-l2)!important;border-radius:var(--dsw-radius-sm,8px)!important;background:var(--dsw-alias-bg-layer-1)!important;box-sizing:border-box}",
			".dsham_dateTrigger .dsham_dateText{font-size:12px!important;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dsham_srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;opacity:0;pointer-events:none}",
			".dsham_menuSelectBtn{display:inline-flex!important;align-items:center;justify-content:space-between;gap:6px;width:auto!important;max-width:100%;min-width:0!important;height:32px!important;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-sizing:border-box;font:inherit;font-size:13px;cursor:pointer}",
			".dsham_selectLabel{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:normal;text-align:left}",
			".dsham_settingsGroup{margin:0 0 20px}",
			".dsham_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}",
			".dsham_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}",
			".dsham_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}",
			".dsham_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}",
			".dsham_settingsList{display:grid;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}",
			".dsham_settingsRow{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:48px;padding:7px 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
			".dsham_settingsRow:last-child{border-bottom:0}",
			".dsham_settingsContent{min-width:0;flex:1}",
			".dsham_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}",
			".dsham_settingsMeta{margin-top:1px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px}",
			".dsham_settingsActions{display:flex;align-items:center;gap:4px;flex:none}",
			".dsham_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}",
			".dsham_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px;white-space:pre-line}",
			"@container(max-width:520px){.dsham_settingsHeader{margin-bottom:16px}.dsham_settingsGroup{margin-bottom:32px}.dsham_settingsRow{padding:7px 12px}.dsham_settingsActions{gap:4px}}"
		].join("");
		const ARCHIVE_SETTINGS_BATCH_CSS = ".dsham_settingsTitleLink{display:block;max-width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:600;line-height:18px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.dsham_settingsTitleLink:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px}.dsham_settingsTitleLink:disabled{cursor:default;opacity:.6}.dsham_groupToggle{display:flex;align-items:center;gap:8px;min-width:0;max-width:100%;padding:4px 0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.dsham_groupToggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsham_settingsRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsRow[data-selected=true]{background:var(--dsw-alias-interactive-bg-hover)}.dsham_settingsTitleLink:focus-visible,.dsham_groupToggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3b82f6);outline-offset:2px}@container(max-width:400px){.dsham_settingsRow{gap:8px;padding:6px 8px}.dsham_settingsActions{gap:0}.dsham_settingsMeta{font-size:11px}}.dsham_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:wrap}.dsham_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}.dsham_checkbox{width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);flex:none}button.dsham_favoriteOn{color:#e8b931}button.dsham_favoriteOn:not(:disabled):hover{color:#e8b931!important;border-color:#e8b931!important}";
		const ARCHIVE_SETTINGS_EXTERNAL_LINK_CSS = ".dsham_settingsTitleRow{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}.dsham_settingsLinks{display:flex;align-items:center;gap:8px;flex-wrap:wrap}@media(max-width:720px){.dsham_settingsTitleRow{flex-wrap:wrap}}";
		const ARCHIVE_SETTINGS_SELECTION_CSS = ".dsham_settingsSelection{margin:-8px 0 16px;padding:4px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dsham_settingsSelectionMain{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;min-height:36px}.dsham_settingsSelectionSummary{display:flex;flex-wrap:wrap;align-items:center;gap:12px;min-width:0;max-width:100%}.dsham_settingsSelectionToggle{display:inline-flex;flex:none;white-space:nowrap;align-items:center;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;cursor:pointer}.dsham_settingsSelectionActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;max-width:100%;margin-left:auto}.dsham_settingsSelectionScope{margin:8px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow-wrap:anywhere}";
		/** 设置页筛选使用宿主官方原语 Menu 规范封装，彻底摆脱 Ant Design 下拉的虚拟列表和样式限制。 */
		function ArchiveProjectSelect({ id, className, value, options, onChange, disabled = false, "aria-label": ariaLabel, title, tabIndex, "aria-hidden": ariaHidden }: { id?: string; className?: string; value: string; options: {value: string; label: string; title?: string}[]; onChange(value: string): void; disabled?: boolean; "aria-label": string; title?: string; tabIndex?: number; "aria-hidden"?: boolean }) {
			const [open, setOpen] = react.useState(false);

			const items = react.useMemo(() => {
				return options.map((opt) => ({
					id: opt.value,
					label: opt.label
				}));
			}, [options]);

			const current = options.find((opt) => opt.value === value);
			const currentText = current?.label ?? ariaLabel;

			return (0, react_jsx_runtime.jsx)("div", {
				id,
				tabIndex,
				"aria-hidden": ariaHidden,
				className: className === undefined ? "dsham_settingsFilter" : `dsham_settingsFilter ${className}`,
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open,
					onClose: () => setOpen(false),
					onSelect: (selectedId: string) => {
						if (!disabled) onChange(selectedId);
						setOpen(false);
					},
					selectedId: value,
					align: "start",
					portal: true,
					dense: true,
					listClassName: "dsham_selectDropdown",
					anchor: (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						size: "sm",
						role: "combobox",
						"aria-label": ariaLabel,
						"aria-expanded": open,
						disabled,
						tabIndex,
						"aria-hidden": ariaHidden,
						title: title ?? current?.title ?? current?.label ?? ariaLabel,
						className: "dsham_menuSelectBtn" + (open ? " is-open" : ""),
						onClick: () => {
							if (!disabled) setOpen((prev) => !prev);
						},
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsham_selectLabel", children: currentText }),
							(0, react_jsx_runtime.jsx)("svg", {
								viewBox: "0 0 16 16",
								width: 12,
								height: 12,
								fill: "none",
								stroke: "currentColor",
								strokeWidth: 1.8,
								strokeLinecap: "round",
								strokeLinejoin: "round",
								style: { marginLeft: 4, transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none", flex: "none" },
								children: (0, react_jsx_runtime.jsx)("path", { d: "m4 6 4 4 4-4" })
							})
						]
					}),
					items: items as unknown as { id: string; label: ReactNode }[]
				})
			});
		}
		/** Codex 风格的视图与排序复合菜单：两段式分组（筛选会话 + 排序方式），并在内部透传隐形代理节点保障单测兼容。 */
		function ArchiveViewSortMenu({
			id,
			t,
			disabled = false,
			favoritesOnly,
			setFavoritesOnly,
			favoriteBusy = false,
			sortBy,
			setSortBy,
			options
		}: {
			id?: string;
			t: Translate;
			disabled?: boolean;
			favoritesOnly: boolean;
			setFavoritesOnly?(val: boolean): void;
			favoriteBusy?: boolean;
			sortBy: string;
			setSortBy(val: string): void;
			options: { value: string; label: string }[];
		}) {
			const [open, setOpen] = react.useState(false);

			type ViewSortMenuEntry =
				| { id: string; label: ReactNode; disabled?: boolean; danger?: boolean }
				| { type: "separator"; id: string }
				| { type: "label"; id: string; text: string };

			const items = react.useMemo(() => {
				const result: ViewSortMenuEntry[] = [];
				if (typeof setFavoritesOnly === "function") {
					result.push({
						type: "label",
						id: "lbl_view_filter",
						text: t("organizer.favoriteFilter") || "筛选会话"
					});
					result.push({
						id: "filter:all",
						label: t("organizer.allSessions") || "全部会话"
					});
					result.push({
						id: "filter:favorites",
						label: t("organizer.favoritesOnly") || "只看收藏"
					});
					result.push({
						type: "separator",
						id: "sep_view_filter"
					});
				}
				result.push({
					type: "label",
					id: "lbl_view_sort",
					text: t("archives.sortLabel") || "排序方式"
				});
				for (const opt of options) {
					result.push({
						id: `sort:${opt.value}`,
						label: opt.label
					});
				}
				return result;
			}, [t, setFavoritesOnly, options]);

			const onSelect = (id: string) => {
				if (id.startsWith("filter:")) {
					if (typeof setFavoritesOnly === "function" && !favoriteBusy) {
						setFavoritesOnly(id === "filter:favorites");
					}
				} else if (id.startsWith("sort:")) {
					setSortBy(id.slice(5));
				}
				setOpen(false);
			};

			const currentSort = options.find((o: { value: string; label: string }) => o.value === sortBy);
			const buttonLabel = favoritesOnly
				? (t("organizer.favoritesOnly") || "只看收藏")
				: (t("organizer.allChats") || "全部聊天");
			const buttonTitle = `${buttonLabel} · ${currentSort?.label ?? sortBy}`;

			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsham_viewSortContainer",
				children: [
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open,
						onClose: () => setOpen(false),
						onSelect,
						selectedIds: [favoritesOnly ? "filter:favorites" : "filter:all", `sort:${sortBy}`],
						align: "end",
						portal: true,
						dense: true,
						listClassName: "dsham_viewSortDropdown",
						anchor: (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							role: "combobox",
							"aria-label": t("archives.viewOptions") || "视图选项",
							"aria-expanded": open,
							disabled,
							title: buttonTitle,
							className: "dsham_menuSelectBtn dsham_viewSortBtn" + (open ? " is-open" : "") + (favoritesOnly ? " has-filter" : ""),
							onClick: () => { if (!disabled) setOpen(prev => !prev); },
							children: [
								(0, react_jsx_runtime.jsxs)("svg", {
									viewBox: "0 0 16 16",
									width: 13,
									height: 13,
									fill: "none",
									stroke: "currentColor",
									strokeWidth: 1.3,
									strokeLinecap: "round",
									strokeLinejoin: "round",
									style: { flex: "none", marginRight: 4 },
									children: [
										(0, react_jsx_runtime.jsx)("line", { x1: 2.5, y1: 4.5, x2: 13.5, y2: 4.5 }),
										(0, react_jsx_runtime.jsx)("circle", { cx: 5, cy: 4.5, r: 1.5, fill: "var(--dsw-alias-bg-layer-1)" }),
										(0, react_jsx_runtime.jsx)("line", { x1: 2.5, y1: 11.5, x2: 13.5, y2: 11.5 }),
										(0, react_jsx_runtime.jsx)("circle", { cx: 11, cy: 11.5, r: 1.5, fill: "var(--dsw-alias-bg-layer-1)" })
									]
								}),
								(0, react_jsx_runtime.jsx)("span", { className: "dsham_selectLabel", children: buttonLabel }),
								(0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: 11,
									height: 11,
									fill: "none",
									stroke: "currentColor",
									strokeWidth: 1.8,
									strokeLinecap: "round",
									strokeLinejoin: "round",
									style: { marginLeft: 3, transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none", flex: "none" },
									children: (0, react_jsx_runtime.jsx)("path", { d: "m4 6 4 4 4-4" })
								})
							]
						}),
						items: items as unknown as { id: string; label: ReactNode }[]
					})
				]
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
						children: onArchive ? [settingsButton({ disabled: busy, onClick: onArchive, children: t("archives.archiveSelected") })] : [settingsButton({ disabled: busy, "aria-label": t("archives.restoreSelected"), onClick: onRestore, children: t("archives.restore") }), settingsButton({ disabled: busy, className: "dsham_btnDanger", "aria-label": t("archives.deleteSelected"), onClick: onDelete, children: t("archives.deleteSelectionShort") })]
					})]
				}), hiddenCount > 0 && (0, react_jsx_runtime.jsx)("p", { className: "dsham_settingsSelectionScope", role: "status", children: t("archives.selectionHiddenHint", { hidden: hiddenCount }) })]
			});
		}
		function ArchiveSelectionCheckbox({ checked, indeterminate = false, disabled = false, label, onChange }: { checked: boolean; indeterminate?: boolean; disabled?: boolean; label: string; onChange: (event: { target: { checked: boolean } }) => void }) {
			return (0, react_jsx_runtime.jsx)(SelectionCheckbox, { checked, indeterminate, disabled, label, onChange });
		}
		function moreIcon() {
			return (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				"aria-hidden": true,
				focusable: "false",
				children: [3.5, 8, 12.5].map((cx) => (0, react_jsx_runtime.jsx)("circle", { cx, cy: 8, r: 1.15, fill: "none", stroke: "currentColor", strokeWidth: 1.5 }, cx))
			});
		}
		/** 会话行上的更多操作，弹出层用宿主 Menu。 */
		function ArchivedSessionMenu({ busy, title, t, onPreview, onRestoreOpen, onDelete, onCopyId }: { busy: boolean; title: string; t: Translate; onPreview?: () => void; onRestoreOpen?: () => void; onDelete?: () => void; onCopyId?: () => void }) {
			const [open, setOpen] = (0, react.useState)(false);
			const choose = (id: string) => { if (busy) return; setOpen(false); if (id === "copyId") return onCopyId?.(); if (id === "preview") return onPreview?.(); if (id === "restoreOpen") return onRestoreOpen?.(); if (id === "delete") onDelete?.(); };
			const items = [
				...onPreview ? [{ id: "preview", label: t("discovery.preview"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutlineMedium, { size: 16 }), danger: false }] : [],
				...onRestoreOpen ? [{ id: "restoreOpen", label: t("archives.restoreOpen"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUnarchiveOutlineMedium, { size: 16 }), danger: false }] : [],
				...onCopyId ? [{ id: "copyId", label: t("details.copyId"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutlineMedium, { size: 16 }), danger: false }] : [],
				...onDelete ? [{ id: "delete", label: t("menu.deleteSession"), icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineMedium, { size: 16 }), danger: true }] : []
			];
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open: !busy && open, align: "end", portal: true, dense: true, items, onSelect: choose, onClose: () => setOpen(false),
				anchor: settingsButton({ variant: "outline", className: "dsham_iconAction", disabled: busy, title: t("archives.moreActions"), "aria-label": t("archives.moreActions") + t("common.separator") + title, "aria-haspopup": "menu", "aria-expanded": open && !busy, icon: moreIcon(), onClick: () => { if (!busy) setOpen((value) => !value); } })
			});
		}
		/** 项目标题右侧的批量菜单，向左展开，归档项保持危险色。 */
		function ArchivedGroupActions({ group, busy, onArchive, onRestore, onDelete, t }: { group: ArchivedGroup; busy: boolean; onArchive?: () => void; onRestore?: () => void; onDelete?: () => void; t: Translate }) {
			const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
			const items = onArchive ? [{
				id: "archive",
				label: t(ungrouped ? "archives.archiveUngrouped" : "archives.archiveProject"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineMedium, { size: 16 }),
				danger: true
			}] : [{
				id: "restore",
				label: t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUnarchiveOutlineMedium, { size: 16 }),
				danger: false
			}, {
				id: "delete",
				label: t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineMedium, { size: 16 }),
				danger: true
			}];
			const [open, setOpen] = (0, react.useState)(false);
			const menuLabel = t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title });
			const choose = (id: string) => {
				if (busy) return;
				if (id === "archive") onArchive?.();
				else if (id === "restore") onRestore?.();
				else if (id === "delete") onDelete?.();
			};
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open: !busy && open, align: "end", portal: true, dense: true, items, onSelect: (id: string) => { setOpen(false); choose(id); }, onClose: () => setOpen(false),
				anchor: settingsButton({
					variant: "outline", className: "dsham_iconAction", disabled: busy, "aria-label": menuLabel, "aria-haspopup": "menu", "aria-expanded": open && !busy,
					icon: moreIcon(), onClick: () => { if (!busy) setOpen((value) => !value); }
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
		function sortArchivedGroups(groups: readonly ArchivedGroup[], sortBy: string, createdAtById: Record<string, number>, t: Translate, archivedSessionIds: readonly string[] = []) {
			const compareText = (left: unknown, right: unknown) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
			const archiveIndexMap = new Map<string, number>();
			if (Array.isArray(archivedSessionIds)) {
				for (let i = 0; i < archivedSessionIds.length; i++) {
					archiveIndexMap.set(archivedSessionIds[i], i);
				}
			}
			const timestampOf = (session: ClientSession) => {
				const value = sortBy === "created" ? createdAtById[session.id] : session.updatedAt;
				return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
			};
			const compareSessions = (left: ClientSession, right: ClientSession) => {
				if (sortBy === "archived") {
					const leftOrder = archiveIndexMap.get(left.id) ?? -1;
					const rightOrder = archiveIndexMap.get(right.id) ?? -1;
					const difference = rightOrder - leftOrder;
					if (difference !== 0) return difference;
				}
				if (sortBy !== "alphabetical") {
					const byTime = timestampOf(right) - timestampOf(left);
					if (Number.isFinite(byTime) && byTime !== 0) return byTime;
				}
				return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
			};
			const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
			return result.sort((left, right) => {
				if (sortBy === "archived") {
					const leftTop = left.sessions[0]?.id;
					const rightTop = right.sessions[0]?.id;
					const leftOrder = leftTop !== undefined ? (archiveIndexMap.get(leftTop) ?? -1) : -1;
					const rightOrder = rightTop !== undefined ? (archiveIndexMap.get(rightTop) ?? -1) : -1;
					const difference = rightOrder - leftOrder;
					if (difference !== 0) return difference;
				}
				if (sortBy !== "alphabetical") {
					const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
					if (Number.isFinite(byTime) && byTime !== 0) return byTime;
				}
				return compareText(left.title, right.title) || compareText(left.key, right.key);
			});
		}

		const zh = {
			...organizerZh, ...discoveryZh,
            "locale.language": "zh", "service.unavailable": "服务尚未就绪，请重试",
			"sidebar.entry.title": "侧边栏入口",
			"sidebar.entry.desc": "在左侧主导航栏显示归档管理器。设置里的入口不变。",
			"sidebar.entry.toggle": "切换侧边栏入口",
			"update.entry.title": "在线更新",
			"update.entry.desc": "允许检查并在线安装归档管理器的新版本。关闭后隐藏更新入口。",
			"update.entry.toggle": "切换在线更新",
			"update.entry.locked": "在线更新已被宿主配置锁定禁用",
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
			"archives.sortLabel": "排序方式",
			"archives.viewOptions": "视图选项",
			"archives.sortArchived": "最近归档",
			"archives.sortUpdated": "更新时间",
			"archives.sortCreated": "创建时间",
			"archives.sortAlphabetical": "按字母顺序",
			"archives.projectFilter": "按项目筛选",
			"archives.allProjects": "所有项目",
			"discovery.timeRange": "时间范围",
			"organizer.allChats": "全部聊天",
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
			"deleteSession.confirmTitle": "删除会话？",
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
			"menu.archiveWorkspace": "归档会话",
			"menu.copyWorkspacePath": "复制目录",
			"menu.openInExplorer": "打开目录",
			"menu.moveSession": "移动到工作区",
			"moveSession.title": "移动会话到工作区",
			"moveSession.desc": "将“{name}”移动到目标工作区，后续对话将在目标工作区环境中执行。",
			"moveSession.warning": "提示：移动后该会话的工作目录将变更为目标项目目录。",
			"moveSession.currentWorkspace": "当前工作区：{name}",
			"moveSession.selectLabel": "选择目标工作区",
			"moveSession.noOtherWorkspaces": "暂无可移动的其他工作区",
			"moveSession.confirm": "移动",
			"moveSession.pending": "正在移动会话…",
			"moveSession.success": "会话已成功移动到“{name}”",
			"archiveWorkspace.title": "归档 {n} 个会话？",
			"archiveWorkspace.desc": "这会将“{name}”中的会话归档。之后可以在“设置 → 归档会话”中找到它们。",
			"archiveWorkspace.confirm": "全部归档",
			"archiveWorkspace.pending": "正在归档会话…",
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
			...organizerEn, ...discoveryEn,
            "locale.language": "en", "service.unavailable": "The service is not ready. Please retry.",
			"sidebar.entry.title": "Sidebar entry",
			"sidebar.entry.desc": "Show Archived Sessions in the left sidebar. The Settings entry stays either way.",
			"sidebar.entry.toggle": "Toggle sidebar entry",
			"update.entry.title": "Online updates",
			"update.entry.desc": "Allow checking and installing new versions online. Hides the update entry when disabled.",
			"update.entry.toggle": "Toggle online updates",
			"update.entry.locked": "Online updates are disabled by the host configuration.",
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
			"archives.sortLabel": "Sort order",
			"archives.viewOptions": "View options",
			"archives.sortArchived": "Recently archived",
			"archives.sortUpdated": "Last updated",
			"archives.sortCreated": "Created",
			"archives.sortAlphabetical": "Alphabetical",
			"archives.projectFilter": "Filter by project",
			"archives.allProjects": "All projects",
			"discovery.timeRange": "Date range",
			"organizer.allChats": "All chats",
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
			"deleteSession.confirmTitle": "Delete session?",
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
			"menu.archiveWorkspace": "Archive sessions",
			"menu.copyWorkspacePath": "Copy folder path",
			"menu.openInExplorer": "Open folder",
			"menu.moveSession": "Move to workspace",
			"moveSession.title": "Move session to workspace",
			"moveSession.desc": "Move “{name}” to target workspace. Subsequent turns will execute within the destination context.",
			"moveSession.warning": "Note: The session working directory will change to the destination project path.",
			"moveSession.currentWorkspace": "Current workspace: {name}",
			"moveSession.selectLabel": "Select destination workspace",
			"moveSession.noOtherWorkspaces": "No other workspaces available",
			"moveSession.confirm": "Move",
			"moveSession.pending": "Moving session…",
			"moveSession.success": "Session successfully moved to “{name}”",
			"archiveWorkspace.title": "Archive {n} conversations?",
			"archiveWorkspace.desc": "This archives all conversations in “{name}”. You can find them later in Archived sessions.",
			"archiveWorkspace.confirm": "Archive all",
			"archiveWorkspace.pending": "Archiving conversations…",
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
		const ru = {
			...organizerRu, ...discoveryRu,
            "locale.language": "ru", "service.unavailable": "Сервис ещё не готов. Повторите.",
			"sidebar.entry.title": "Пункт боковой панели",
			"sidebar.entry.desc": "Показывать архив сессий на левой панели. Пункт в настройках сохраняется.",
			"sidebar.entry.toggle": "Переключить пункт боковой панели",
			"update.entry.title": "Онлайн-обновление",
			"update.entry.desc": "Разрешить проверку и установку обновлений онлайн. Скрывает пункт обновления при отключении.",
			"update.entry.toggle": "Переключить онлайн-обновление",
			"update.entry.locked": "Онлайн-обновление отключено конфигурацией хоста.",
			"archives.moreActions": "Дополнительно",
			"archives.archiveProject": "Заархивировать все чаты этого проекта",
			"archives.archiveUngrouped": "Заархивировать все несгруппированные чаты",
			"archives.archiveProjectDesc": "Заархивировать все {n} незаархивированных сессий в «{name}», независимо от текущего фильтра поиска. Их можно восстановить в разделе «Архив».",
			"archives.archiveUngroupedDesc": "Заархивировать все {n} несгруппированных незаархивированных сессий, независимо от текущего фильтра поиска. Их можно восстановить в разделе «Архив».",

			"archives.tab.archived": "Архив",
			"archives.tab.unarchived": "Незаархивированные",
			"archives.searchUnarchived": "Поиск по незаархивированным чатам",
			"archives.emptyUnarchived": "Нет незаархивированных сессий.",
			"archives.archiveSelected": "Архивировать",
			"archives.openSession": "Открыть сессию",
			"archives.archiveSelectedDesc": "Архивировать выбранные сессии, включая скрытые текущим фильтром. Их можно просмотреть и восстановить в разделе «Архив».",
			"archives.archiveSuccess": "Заархивировано сессий: {n}.",
			"archives.archiveBatchFailed": "Пакетная архивация не удалась: {detail}",

			"archives.navigationUnavailable": "Этот хост не может держать разговор в архиве при открытии. Вместо этого используйте «Восстановить и открыть».",
			"archives.sessionNotRetained": "Хост не сохранил запрошенный разговор открытым. Повторите или восстановите его перед открытием.",
			"archives.restoreOpen": "Восстановить и открыть",
			"archives.selectedCount": "Выбрано: {n}",
			"archives.selectionHiddenHint": "Включает {hidden}, скрытых текущим фильтром; действия применяются и к ним.",
			"archives.clearSelectionShort": "Сбросить",
			"archives.restore": "Восстановить",
			"archives.archiveTitle": "Архивировать {n} чатов?",
			"archives.deleteSelectionShort": "Удалить",
			"archives.clearSelection": "Сбросить выбор",

			"group.ungrouped": "Без группы",
			"session.new": "Новая сессия",
			"section.workspaces": "Рабочие пространства",
			"section.sessions": "Сессии",
			"viewOptions.label": "Параметры просмотра",
			"groupBy.label": "Группировать по",
			"groupBy.workspace": "Рабочее пространство",
			"groupBy.flat": "В одном списке",
			"orderBy.label": "Порядок",
			"orderBy.manual": "Вручную",
			"orderBy.updated": "Последнее обновление",
			"sessions.expand": "Показать ещё {n} сессий",
			"sessions.collapse": "Показать меньше",
			"empty.none": "Пока нет сессий",
			"workspace.add": "Добавить рабочее пространство",
			"search.sessions.aria": "Поиск сессий",
			"search.placeholder": "Поиск сессий...",
			"search.clear": "Сбросить поиск",
			"search.results.aria": "Результаты поиска",
			"search.pending": "Поиск по истории сессий…",
			"search.unavailable": "Поиск по содержимому временно недоступен. Показываются совпадения по названиям.",
			"search.noMatches": "Нет подходящих сессий",
			"search.hasMore": "Показаны первые {n} результатов. Сузьте поиск.",
			"menu.addWorkspace": "Добавить рабочее пространство…",
			"menu.unarchive": "Вернуть из архива",
			"menu.deleteSession": "Удалить сессию",
			"archived.badge": "Архив сессий",
			"archived.notOpenable": "Эта сессия в архиве. Верните её из архива, чтобы продолжить разговор.",
			"archives.title": "Архив сессий",
			"archives.description": "Управление заархивированными сессиями или выбор незаархивированных для пакетной архивации.",
			"archives.viewProject": "GitHub",
			"archives.feedback": "Проблемы",
			"archives.empty": "Нет заархивированных сессий.",
			"archives.emptyFiltered": "Ни один чат не соответствует вашим фильтрам.",
			"archives.searchPlaceholder": "Поиск по заархивированным чатам",
			"archives.sortBy": "Сортировка заархивированных чатов",
			"archives.sortLabel": "Сортировка",
			"archives.viewOptions": "Параметры вида",
			"archives.sortArchived": "Недавно архивированные",
			"archives.sortUpdated": "Последнее обновление",
			"archives.sortCreated": "Дата создания",
			"archives.sortAlphabetical": "По алфавиту",
			"archives.projectFilter": "Фильтр по проекту",
			"archives.allProjects": "Все проекты",
			"discovery.timeRange": "Период",
			"organizer.allChats": "Все чаты",
			"archives.sessionCount": "{n} чатов",
			"archives.selectAllFiltered": "Выбрать все результаты",
			"archives.selectSession": "Выбрать чат {name}",
			"archives.restoreSelected": "Восстановить выбранные",
			"archives.deleteSelected": "Удалить выбранные",
			"archives.timestamp": "{date}, {time}",
			"archives.restoreProject": "Восстановить все чаты этого проекта",
			"archives.restoreUngrouped": "Восстановить все",
			"archives.deleteProject": "Удалить все чаты этого проекта",
			"archives.deleteUngrouped": "Удалить все",
			"archives.projectActions": "Действия архивации для проекта {name}",
			"archives.ungroupedActions": "Действия архивации для несгруппированных чатов",
			"archives.restoreSuccess": "Восстановлено заархивированных чатов: {n}.",
			"archives.restoreBatchFailed": "Не удалось восстановить заархивированные чаты: {detail}",
			"archives.deleteSelectedTitle": "Удалить выбранные заархивированные чаты",
			"archives.deleteSelectedDesc": "Это окончательно удалит выбранные {n} заархивированных чатов, их дочерние агенты (включая ещё работающие) и их записи. Другие чаты не затрагиваются. Это действие необратимо.",
			"archives.deleteSelectedConfirm": "Удалить выбранные чаты",
			"archives.deleteProjectTitle": "Удалить заархивированные чаты в {name}",
			"archives.deleteProjectDesc": "Это окончательно удалит {n} заархивированных чатов в {name}, их дочерние агенты и записи. Каталог проекта и незаархивированные чаты не затрагиваются. Это действие необратимо.",
			"archives.deleteProjectConfirm": "Удалить все чаты проекта",
			"archives.deleteUngroupedTitle": "Удалить несгруппированные заархивированные чаты",
			"archives.deleteUngroupedDesc": "Это окончательно удалит {n} несгруппированных заархивированных чатов, их дочерние агенты и записи. Другие проекты и незаархивированные чаты не затрагиваются. Это действие необратимо.",
			"archives.deleteUngroupedConfirm": "Удалить все несгруппированные чаты",
			"archives.deleteBatchPending": "Удаление заархивированных чатов…",
			"archives.deleteSuccess": "Удалено заархивированных чатов: {n}.",
			"archives.deleteSuccessWithSkipped": "Удалено {deleted} заархивированных чатов и очищено {skipped} устаревших записей архива для несуществующих сессий.",
			"archives.deleteSkipped": "Очищено {n} устаревших записей архива для несуществующих сессий.",
			"archives.deletePartial": "Удалено {deleted} чатов и очищено {skipped} устаревших записей архива; {failed} не удалось удалить: {detail}",
			"archives.unarchiveUnknown": "Эта сессия больше не существует, поэтому её нельзя вернуть из архива.",
			"archives.unarchiveFailed": "Не удалось вернуть сессию из архива: {detail}",
			"archives.archiveUnknown": "Эта сессия больше не существует, поэтому её нельзя заархивировать.",
			"archives.archiveFailed": "Не удалось заархивировать сессию: {detail}",
			"archives.archiveActive": "Этот разговор всё ещё выполняется ({kinds}).",
			"archiveActive.title": "Остановить и заархивировать",
			"archiveActive.desc": "В «{name}» ещё идёт работа: {kinds}. Архивация сначала остановит её.",
			"archiveActive.confirm": "Остановить и заархивировать",
			"archiveActive.pending": "Остановка и архивация…",
			"archives.forkFailed": "Не удалось создать ветку сессии: {detail}",
			"deleteSession.title": "Удалить сессию",
			"deleteSession.confirmTitle": "Удалить сессию?",
			"deleteSession.desc": "Это окончательно удалит сессию «{name}», её дочерние агенты (включая ещё работающие) и все её записи (разговор, статистику, кэш). Это действие необратимо.",
			"deleteSession.pending": "Удаление сессии…",
			"deleteSession.unknown": "Эта сессия больше не существует или уже удалена.",
			"deleteSession.failed": "Не удалось удалить сессию: {detail}",
			"picker.loading": "Загрузка рабочих пространств…",
			"conflict.named": "Рабочее пространство с именем «{name}» уже существует.",
			"folderError.title": "Не удалось открыть папку",
			"folderError.retry": "Выбрать снова",
			"rename": "Переименовать",
			"rename.workspace.title": "Переименовать рабочее пространство",
			"rename.session.title": "Переименовать сессию",
			"field.workspaceName": "Имя рабочего пространства",
			"field.sessionName": "Имя сессии",
			"delete.workspace": "Удалить рабочее пространство",
			"delete.desc": "Это удалит «{name}» из списка рабочих пространств. Папка и журналы сессий останутся. Его сессии появятся в разделе «Без группы».",
			"delete.pending": "Удаление рабочего пространства…",
			"menu.fork": "Создать ветку сессии",
			"menu.archiveSession": "Заархивировать сессию",
			"menu.archiveWorkspace": "Архивировать сессии",
			"menu.copyWorkspacePath": "Копировать путь к папке",
			"menu.openInExplorer": "Открыть папку",
			"menu.moveSession": "Переместить в проект",
			"moveSession.title": "Перемещение сессии",
			"moveSession.desc": "Переместить «{name}» в целевое рабочее пространство. Дальнейшие реплики будут выполняться в контексте целевого проекта.",
			"moveSession.warning": "Примечание: рабочий каталог сессии будет изменен на путь целевого проекта.",
			"moveSession.currentWorkspace": "Текущий проект: {name}",
			"moveSession.selectLabel": "Выберите проект",
			"moveSession.noOtherWorkspaces": "Нет других доступных проектов",
			"moveSession.confirm": "Переместить",
			"moveSession.pending": "Перемещение сессии…",
			"moveSession.success": "Сессия успешно перемещена в «{name}»",
			"archiveWorkspace.title": "Архивировать {n} сессий?",
			"archiveWorkspace.desc": "Это заархивирует сессии в «{name}». Их можно найти позже в разделе «Архив».",
			"archiveWorkspace.confirm": "Архивировать все",
			"archiveWorkspace.pending": "Архивация сессий…",
			"actions.workspace.aria": "Действия рабочего пространства для {name}",
			"actions.session.aria": "Действия сессии для {name}",
			"actions.newSession.aria": "Новая сессия в {name}",
			"status.running": "Выполняется",
			"status.subagentsRunning.one": "{n} подагент работает",
			"status.subagentsRunning.other": "{n} подагентов работают",
			"status.idle": "Ожидание",
			"status.waitingApproval": "Ожидание подтверждения",
			"status.planReview": "План ожидает проверки",
			"status.waitingAnswer": "Ожидание ответа",
			"status.completed": "Завершено",
			"hover.created": "Создано {time}",
			"hover.copied": "Скопировано",
			"date.ymd": "{y}-{m}-{d}",
			"time.now": "сейчас",
			"time.minutes": "{n}мин",
			"time.hours": "{n}ч",
			"time.days": "{n}д",
			"time.months": "{n}мес",
			"time.years": "{n}г",
			"time.ago": "{t} назад"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin. */
		const NS = "archive-manager-workspace";
		/**
		* 不 wait uiWorkspace：等它会让官方先占侧栏，删除菜单出不来。
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
		/** 单条恢复走官方 `workspaces.unarchiveSession`，由宿主回写客户端归档快照。 */
		function createUnarchiveSession(workspaces: Workspaces) {
			return async (sessionId: string) => {
				if (typeof workspaces?.unarchiveSession !== "function") throw new Error("archive-manager: host unarchiveSession is unavailable");
				await workspaces.unarchiveSession(sessionId);
			};
		}
		/** 设置页/侧栏批量归档：走统一串行循环，单条官方错误留下并继续。 */
		async function archiveSessionsViaOfficial(workspaces: Workspaces, sessionIds: readonly string[], refresh?: () => Promise<unknown>) {
			const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
			const batch = await runSessionBatch(sessionIds, async (sessionId) => {
				try {
					await workspaces.archiveSession(sessionId);
				} catch (reason) {
					if (reason !== null && typeof reason === "object" && activeSessionActivity(reason) !== undefined && typeof record(reason).sessionId !== "string") Object.assign(reason, { sessionId });
					throw reason;
				}
				return true;
			}, { refresh });
			const archivedSessionIds = [...(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? [])];
			return {
				archivedSessionIds,
				archivedSessionIdsAdded: archivedSessionIds.filter((id) => !before.has(id)),
				failures: batch.failures,
			};
		}
		/** 设置页批量恢复：走同一串行循环，单条失败留下并继续。 */
		async function unarchiveSessionsViaOfficial(workspaces: Workspaces, sessionIds: readonly string[], refresh?: () => Promise<unknown>, unarchive?: (id: string) => Promise<unknown>) {
			const before = new Set(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
			const run = typeof unarchive === "function" ? unarchive : (id: string) => workspaces.unarchiveSession?.(id);
			const batch = await runSessionBatch(sessionIds, async (sessionId) => {
				await run(sessionId);
				return true;
			}, { refresh });
			const archivedSessionIds = [...(workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? [])];
			return {
				archivedSessionIds,
				unarchivedSessionIds: [...before].filter((id) => !archivedSessionIds.includes(id)),
				failures: batch.failures,
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
				en,
				ru
			}), "dsh-archive-manager: dictionaries");
			// 侧栏先注册；导航适配在客户端 effect 中绑定。客户端门面没有 inject。
			const uiWorkspaceAt = () => ctx.get("uiWorkspace");
			const archiveViewState = {};
			let archiveNavigation: ReturnType<typeof allowArchivedNavigation> | undefined;
			const attachArchiveNavigation = (navigation: NavigationSource | undefined) => {
				archiveNavigation = allowArchivedNavigation(navigation, ctx.sessions, ctx.workspaces, {
					onOpened: () => ctx.get("layout")?.selectPanel(null),
					beginNavigation: () => ctx.get("layout")?.beginNavigation?.()
				});
				return () => archiveNavigation?.dispose();
			};
			ctx.effect(() => attachArchiveNavigation(uiWorkspaceAt()), "archive-manager: explicit archived navigation");
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
			const refreshSessionList = async () => {
				if (typeof ctx.sessions.refresh !== "function") return null;
				try {
					await refreshCacheLists();
					return null;
				} catch (error) {
					console.warn("archive-manager: restored archived sessions but session list refresh failed:", error);
					return error instanceof Error ? error.message : String(error);
				}
			};
			const unarchiveOne = createUnarchiveSession(ctx.workspaces);
			const registryCall = async <K extends keyof RegistryCalls>(method: K, ...args: Parameters<RegistryCalls[K]>): Promise<Awaited<ReturnType<RegistryCalls[K]>>> => {
                const registry = ctx.get("remote.workspaceRegistry");
                if (!registry || typeof registry[method] !== "function") throw new Error(ctx.locale.bind(NS)("service.unavailable"));
                // 映射类型索引后的联合无法保留参数与返回值关联；断言只放在这一个分发边界。
                const call = registry[method] as (...input: Parameters<RegistryCalls[K]>) => Promise<RemoteResult<Awaited<ReturnType<RegistryCalls[K]>>>>;
                const result = await call.apply(registry, args);
                if (!result.ok) throw new Error(result.error.message);
                return result.value;
            };
            const diagnoseOrphanSubagents: RegistryCalls["diagnoseOrphanSubagents"] = () => registryCall("diagnoseOrphanSubagents");
            const diagnoseSessionCaches: RegistryCalls["diagnoseSessionCaches"] = () => registryCall("diagnoseSessionCaches");
            const rebuildSessionCaches: RegistryCalls["rebuildSessionCaches"] = input => registryCall("rebuildSessionCaches", input);
            const refreshCacheLists = async () => {
                if (typeof ctx.sessions.refresh !== "function") throw new Error("Official session list refresh is unavailable");
                const outcome = await ctx.sessions.refresh();
                const sessions = ctx.sessions as unknown as {
                    manager?: { listState?: string; listError?: unknown };
                    listState?: string;
                    listError?: unknown;
                    list?: { getSnapshot?: () => { state?: string; error?: unknown; phase?: string } };
                };
                const manager = sessions.manager;
                if (manager?.listState === "error" && manager.listError) {
                    throw new Error(errorMessage(manager.listError));
                }
                if (sessions.listState === "error" && sessions.listError) {
                    throw new Error(errorMessage(sessions.listError));
                }
                const snapshot = sessions.list?.getSnapshot?.();
                if (snapshot?.state === "error" && snapshot.error) {
                    throw new Error(errorMessage(snapshot.error));
                }
                if (outcome && typeof outcome === "object" && "ok" in outcome && (outcome as { ok: boolean }).ok === false) {
                    throw new Error(errorMessage((outcome as { error?: unknown }).error ?? "Session list refresh failed"));
                }
            };
            const cleanOrphanSubagents: RegistryCalls["cleanOrphanSubagents"] = (input = {}) => registryCall("cleanOrphanSubagents", input ?? {});
            const searchArchivedContent: RegistryCalls["searchArchivedContent"] = input => registryCall("searchArchivedContent", input);
            const searchSessionContent: RegistryCalls["searchSessionContent"] = input => registryCall("searchSessionContent", input);
            const previewArchivedSession: RegistryCalls["previewArchivedSession"] = input => registryCall("previewArchivedSession", input);
            const favoriteSessions = () => registryCall("favoriteSessions");
            const setSessionFavorite: RegistryCalls["setSessionFavorite"] = input => registryCall("setSessionFavorite", input);
            /** 主界面星标与归档面板共用的收藏存储；读写仍然回到上面两个注册表方法。 */
            const favoriteRowStore = createFavoriteRowStore();
            favoriteRowStore.bind({ favoriteSessions, setSessionFavorite });
            /** 视图选项里的「只看收藏」开关：状态存本地，可见性每次重算。 */
            const favoritesOnly = setupWorkspaceFavoritesOnly(ctx, favoriteRowStore, () => ctx.locale.bind(NS));
            ctx.effect(() => () => favoritesOnly.dispose(), "archive-manager: favorites only filter");
            const organizeBatch = createSessionOrganizer({
				workspaces: ctx.workspaces.list, sessions: ctx.sessions.list,
				archive: (id) => ctx.workspaces.archiveSession(id), restore: async (id) => { await unarchiveOne(id); return undefined; },
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
			const deleteSession = async (sessionId: string) => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.deleteSession(sessionId);
				if (!result.ok) throw new Error(result.error.message);
				await refreshSessionList();
			};
			const moveSession = async (sessionId: string, targetWorkspaceId: string) => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.moveSessionToWorkspace({ sessionId, targetWorkspaceId });
				if (!result.ok) throw new Error(result.error?.message || "move failed");
				await refreshSessionList();
				return result.value;
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
				const refreshError = await refreshSessionList();
				return { ...result.value, refreshError };
			};
			const archivedSessionMetadata = async () => {
				const registry = ctx.get("remote.workspaceRegistry");
				if (registry === void 0) throw new Error("archive-manager remote service is unavailable");
				const result = await registry.archivedSessionMetadata();
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
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
				const icon = (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, { size: 14 });
				const onSelect = () => {
					setMenuOpen(false);
					publishDeleteTarget({ sessionId, title });
				};
				if (typeof Item === "function") return (0, react_jsx_runtime.jsx)(Item, { danger: true, icon, onSelect, children: t("menu.deleteSession") });
				return (0, react_jsx_runtime.jsx)("button", { type: "button", role: "menuitem", onClick: onSelect, children: t("menu.deleteSession") });
			}
			/**
			 * 会话「…」菜单里的收藏行：星标本身只在悬停时出现，键盘用户靠这一行收藏。
			 * 读写走同一份 favoriteRow 存储，和标题左侧的星完全同步。
			 */
			function FavoriteMenuItem({ sessionId, favoriteRow, useMenuOpenState, t }: { sessionId: string; favoriteRow: FavoriteRowStore; useMenuOpenState: () => readonly [boolean, (open: boolean) => void]; t: Translate }) {
				const [, setMenuOpen] = useMenuOpenState();
				const state = (0, react.useSyncExternalStore)(favoriteRow.subscribe, favoriteRow.getSnapshot);
				const favorited = state.ready && state.ids.has(sessionId);
				const onSelect = () => {
					setMenuOpen(false);
					void favoriteRow.toggle(sessionId);
				};
				const Item = _deepseek_ai_dsh_client_ui_primitives.MenuItemButton;
				const icon = (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: favorited ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round", "aria-hidden": true, children: (0, react_jsx_runtime.jsx)("path", { d: STAR_PATH }) });
				const label = t(favorited ? "organizer.unfavorite" : "organizer.favorite");
				if (typeof Item === "function") return (0, react_jsx_runtime.jsx)(Item, { icon, onSelect, children: label });
				return (0, react_jsx_runtime.jsx)("button", { type: "button", role: "menuitem", onClick: onSelect, children: label });
			}
			let globalToast: { text: string; tone?: "success" | "danger"; seq: number } | null = null;
			const toastListeners = new Set<() => void>();
			function showToast(text: string, tone: "success" | "danger" = "success") {
				globalToast = { text, tone, seq: Date.now() };
				for (const listener of toastListeners) listener();
			}
			function GlobalToastOverlay() {
				const toast = react.useSyncExternalStore(
					(listener: () => void) => {
						toastListeners.add(listener);
						return () => { toastListeners.delete(listener); };
					},
					() => globalToast,
					() => globalToast
				);
				if (!toast) return null;
				const ToastComp = (_deepseek_ai_dsh_client_ui_primitives as Record<string, unknown>).Toast as React.ComponentType<{
					text: React.ReactNode;
					tone?: "success" | "danger";
					holdMs?: number;
					onDone?: () => void;
				}> | undefined;
				if (typeof ToastComp === "function") {
					return (0, react_jsx_runtime.jsx)(ToastComp, {
						key: toast.seq,
						text: toast.text,
						tone: toast.tone,
						holdMs: 3000,
						onDone: () => {
							if (globalToast?.seq === toast.seq) {
								globalToast = null;
								for (const listener of toastListeners) listener();
							}
						}
					});
				}
				return (0, react_jsx_runtime.jsx)("div", {
					key: toast.seq,
					style: {
						position: "fixed",
						top: 16,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 99999,
						padding: "8px 16px",
						borderRadius: 8,
						background: toast.tone === "danger" ? "#7f1d1d" : "#14532d",
						color: "#fff",
						fontSize: 13,
						boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
					},
					children: toast.text
				});
			}
			function MoveSessionMenuItem({ sessionId, displayTitle: title, useMenuOpenState, t }: { sessionId: string; displayTitle: string; useMenuOpenState: () => readonly [boolean, (open: boolean) => void]; t: Translate }) {
				const [, setMenuOpen] = useMenuOpenState();
				const [subOpen, setSubOpen] = react.useState(false);
				const [subPos, setSubPos] = react.useState<{ top: number; left: number; maxHeight: number } | null>(null);
				const [moving, setMoving] = react.useState(false);
				const rowRef = react.useRef<HTMLDivElement>(null);
				const leaveTimerRef = react.useRef<ReturnType<typeof setTimeout> | null>(null);

				const workspaces = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
				const Item = _deepseek_ai_dsh_client_ui_primitives.MenuItemButton;

				const handleMouseEnter = () => {
					if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
					if (rowRef.current) {
						const rect = rowRef.current.getBoundingClientRect();
						const winWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
						const winHeight = typeof window !== "undefined" ? window.innerHeight : 768;

						// 二级菜单宽度约 180~240px，最大高度自适应屏幕并留出上下安全边距
						const menuWidth = 220;
						const maxAvailableHeight = Math.max(140, winHeight - 20);
						const targetMaxHeight = Math.min(360, maxAvailableHeight);

						// 水平位置：优先右侧，右侧空间不足时翻转到左侧
						let left = rect.right + 2;
						if (left + menuWidth > winWidth - 10) {
							left = Math.max(10, rect.left - menuWidth - 4);
						}

						// 垂直位置：优先与菜单项顶部平齐，若底部超出屏幕，则向上平移，确保整个菜单都在可视区域内
						let top = rect.top - 4;
						if (top + targetMaxHeight > winHeight - 10) {
							top = Math.max(10, winHeight - targetMaxHeight - 10);
						}
						if (top < 10) top = 10;

						setSubPos({ top, left, maxHeight: targetMaxHeight });
					}
					setSubOpen(true);
				};

				const handleMouseLeave = () => {
					leaveTimerRef.current = setTimeout(() => {
						setSubOpen(false);
					}, 180);
				};

				const handleSelectWorkspace = async (targetWsId: string, targetTitle: string) => {
					if (moving) return;
					setMoving(true);
					setSubOpen(false);
					setMenuOpen(false);
					try {
						await moveSession(sessionId, targetWsId);
						showToast(t("moveSession.success", { name: targetTitle }) || `会话已成功移动到“${targetTitle}”`, "success");
					} catch (error: unknown) {
						const msg = error instanceof Error ? error.message : String(error);
						console.warn("archive-manager: move session failed", error);
						showToast(msg, "danger");
					} finally {
						setMoving(false);
					}
				};

				const icon = (0, react_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [(0, react_jsx_runtime.jsx)("path", { d: "M2 3.5C2 2.67157 2.67157 2 3.5 2H6.5L8 4H12.5C13.3284 4 14 4.67157 14 5.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5Z" }), (0, react_jsx_runtime.jsx)("path", { d: "M8 7.5L10.5 10L8 12.5" }), (0, react_jsx_runtime.jsx)("path", { d: "M5.5 10H10.5" })] });

				const chevron = (0, react_jsx_runtime.jsx)("svg", {
					viewBox: "0 0 16 16",
					width: 12,
					height: 12,
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.5,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": true,
					style: { marginLeft: "auto", opacity: 0.65 },
					children: (0, react_jsx_runtime.jsx)("path", { d: "M6 3.5L10.5 8L6 12.5" })
				});

				const rowContent = (0, react_jsx_runtime.jsxs)("div", {
					style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 },
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("menu.moveSession") }),
						chevron
					]
				});

				const itemButton = typeof Item === "function"
					? (0, react_jsx_runtime.jsx)(Item, {
						icon,
						onSelect: () => handleMouseEnter(),
						children: rowContent
					})
					: (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitem",
						onClick: () => handleMouseEnter(),
						style: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px 8px", background: "transparent", border: "none", cursor: "pointer", color: "inherit", textAlign: "left" },
						children: [icon, rowContent]
					});

				return (0, react_jsx_runtime.jsxs)("div", {
					ref: rowRef,
					className: "dsham_moveSessionWrap",
					onMouseEnter: handleMouseEnter,
					onMouseLeave: handleMouseLeave,
					children: [
						itemButton,
						subOpen && subPos && typeof document !== "undefined" && typeof react_dom?.createPortal === "function" && (0, react_dom.createPortal)(
							(0, react_jsx_runtime.jsxs)("div", {
								className: "dsham_moveSubmenu",
								role: "menu",
								onPointerDown: (e) => {
									e.stopPropagation();
								},
								onMouseDown: (e) => {
									e.stopPropagation();
								},
								onMouseEnter: handleMouseEnter,
								onMouseLeave: handleMouseLeave,
								style: {
									top: subPos.top,
									left: subPos.left,
									maxHeight: subPos.maxHeight
								},
								children: [
									(0, react_jsx_runtime.jsx)("div", {
										style: { position: "absolute", top: 0, bottom: 0, left: -6, width: 8 },
										"aria-hidden": true
									}),
									workspaces.length === 0
										? (0, react_jsx_runtime.jsx)("div", {
											style: { padding: "8px 10px", fontSize: "12px", color: "var(--dsw-alias-label-tertiary, #888)" },
											children: t("moveSession.noOtherWorkspaces")
										})
										: workspaces.map((ws) => {
											const wsTitle = ws.title || ws.path || ws.workspaceId;
											return (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												role: "menuitem",
												className: "dsham_moveSubmenuBtn",
												disabled: moving,
												onPointerDown: (e) => {
													e.preventDefault();
													e.stopPropagation();
													void handleSelectWorkspace(ws.workspaceId, wsTitle);
												},
												onClick: (e) => {
													e.preventDefault();
													e.stopPropagation();
													void handleSelectWorkspace(ws.workspaceId, wsTitle);
												},
												children: (0, react_jsx_runtime.jsx)("span", {
													style: { overflow: "hidden", textOverflow: "ellipsis", flex: 1 },
													children: wsTitle
												})
											}, ws.workspaceId);
										})
								]
							}),
							document.body
						)
					]
				});
			}
			function focusSessionRow(sessionId: string) {
				try {
					const row = document.querySelector<HTMLElement>(`[data-row-key="session:${CSS.escape(sessionId)}"]`);
					if (!row) return false;
					const hadTabIndex = row.hasAttribute("tabindex");
					if (!hadTabIndex) {
						row.setAttribute("tabindex", "-1");
						row.addEventListener("blur", () => row.removeAttribute("tabindex"), { once: true });
					}
					if (typeof _deepseek_ai_dsh_client_ui_primitives.focusWithoutRing === "function") {
						_deepseek_ai_dsh_client_ui_primitives.focusWithoutRing(row);
					} else {
						row.focus();
					}
					return true;
				} catch {
					return false;
				}
			}
			function DeleteSessionOverlay({ t }: { t: Translate }) {
				const request = useDeleteRequest();
				const [deleting, setDeleting] = (0, react.useState)(false);
				const [error, setError] = (0, react.useState)<string | null>(null);
				const [cardPos, setCardPos] = (0, react.useState)<{ top: number; left: number } | null>(null);
				const cardRef = (0, react.useRef)<HTMLDivElement>(null);
				const cancelBtnRef = (0, react.useRef)<HTMLButtonElement>(null);
				const confirmBtnRef = (0, react.useRef)<HTMLButtonElement>(null);

				(0, react.useLayoutEffect)(() => {
					if (request === null || typeof document === "undefined") {
						setCardPos(null);
						return;
					}

					let cachedRow: HTMLElement | null = null;
					const getTargetRow = () => {
						if (cachedRow && cachedRow.isConnected) return cachedRow;
						try {
							cachedRow = document.querySelector<HTMLElement>(`[data-row-key="session:${CSS.escape(request.sessionId)}"]`);
						} catch {
							cachedRow = null;
						}
						return cachedRow;
					};

					const updatePosition = () => {
						const card = cardRef.current;
						const cardWidth = card?.offsetWidth || 290;
						const cardHeight = card?.offsetHeight || 160;
						const margin = 8;

						const targetRow = getTargetRow();

						if (!targetRow) {
							const w = window.innerWidth;
							const h = window.innerHeight;
							const fallbackTop = Math.max(16, (h - cardHeight) / 2);
							const fallbackLeft = Math.max(16, (w - cardWidth) / 2);
							setCardPos((prev) => prev !== null && prev.top === fallbackTop && prev.left === fallbackLeft ? prev : { top: fallbackTop, left: fallbackLeft });
							return;
						}

						const rect = targetRow.getBoundingClientRect();
						let top = rect.top - 4;
						if (top + cardHeight > window.innerHeight - 16) {
							top = window.innerHeight - 16 - cardHeight;
						}
						if (top < 16) top = 16;

						let left = rect.right + margin;
						if (left + cardWidth > window.innerWidth - 16) {
							left = rect.left - cardWidth - margin;
						}
						if (left < 16) left = 16;

						// 函数式浅对比更新，避免 scroll 事件触发多余重渲染
						setCardPos((prev) => prev !== null && prev.top === top && prev.left === left ? prev : { top, left });
					};

					updatePosition();
					window.addEventListener("scroll", updatePosition, true);
					window.addEventListener("resize", updatePosition);

					let resizeObserver: ResizeObserver | null = null;
					if (typeof ResizeObserver !== "undefined" && cardRef.current) {
						resizeObserver = new ResizeObserver(updatePosition);
						resizeObserver.observe(cardRef.current);
					}

					return () => {
						resizeObserver?.disconnect();
						window.removeEventListener("scroll", updatePosition, true);
						window.removeEventListener("resize", updatePosition);
					};
				}, [request]);

				// 1. 焦点生命周期：仅在弹窗打开/真正关闭时生效，不受 deleting 变化干扰
				(0, react.useEffect)(() => {
					if (request === null) return;
					// 打开时优先聚焦取消按钮，如果聚焦失败则聚焦卡片容器
					if (cancelBtnRef.current && !cancelBtnRef.current.disabled) {
						cancelBtnRef.current.focus();
					} else {
						cardRef.current?.focus();
					}

					const sessionId = request.sessionId;
					return () => {
						// 真正关闭时恢复焦点到会话行本身（临时借用 tabindex="-1"并在失焦后清理），避免掉入 body
						const restored = focusSessionRow(sessionId);
						if (!restored) {
							// 若该行已销毁（如被删除成功），仅在有明确选中的当前会话时安全归位，避免把滚动区强行滚回第一行
							const activeRow = document.querySelector<HTMLElement>("[role=\"treeitem\"][aria-selected=\"true\"]");
							if (activeRow) {
								const hadTabIndex = activeRow.hasAttribute("tabindex");
								if (!hadTabIndex) {
									activeRow.setAttribute("tabindex", "-1");
									activeRow.addEventListener("blur", () => activeRow.removeAttribute("tabindex"), { once: true });
								}
								if (typeof _deepseek_ai_dsh_client_ui_primitives.focusWithoutRing === "function") {
									_deepseek_ai_dsh_client_ui_primitives.focusWithoutRing(activeRow);
								} else {
									activeRow.focus();
								}
							}
						}
					};
				}, [request]);

				// 2. 状态变化时焦点守护：deleting 变 true 时将焦点收拢至卡片容器，防止泄漏到卡片外部
				(0, react.useEffect)(() => {
					if (request === null) return;
					if (deleting) {
						cardRef.current?.focus();
					}
				}, [request, deleting]);

				// 3. 键盘事件监听与完整 Tab 焦点陷阱
				(0, react.useEffect)(() => {
					if (request === null) return;

					const onKey = (event: KeyboardEvent) => {
						if (event.key === "Escape") {
							event.preventDefault();
							event.stopPropagation();
							if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
							if (!deleting) {
								setError(null);
								publishDeleteTarget(null);
							}
							return;
						}
						// 完整 Tab 焦点陷阱：删除中拦截所有 Tab；非删除中在两个按钮与卡片间循环
						if (event.key === "Tab") {
							event.preventDefault();
							if (deleting) {
								cardRef.current?.focus();
								return;
							}
							const cancelBtn = cancelBtnRef.current;
							const confirmBtn = confirmBtnRef.current;
							if (!cancelBtn || !confirmBtn) return;

							if (event.shiftKey) {
								if (document.activeElement === cancelBtn) {
									confirmBtn.focus();
								} else {
									cancelBtn.focus();
								}
							} else {
								if (document.activeElement === confirmBtn) {
									cancelBtn.focus();
								} else {
									confirmBtn.focus();
								}
							}
						}
					};
					window.addEventListener("keydown", onKey, true);
					return () => window.removeEventListener("keydown", onKey, true);
				}, [request, deleting]);

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

				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsham_sidebarCardRoot",
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: "dsham_sidebarCardBackdrop",
							onClick: close
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							ref: cardRef,
							role: "dialog",
							"aria-modal": true,
							"aria-label": t("deleteSession.title"),
							tabIndex: -1,
							className: "dsham_sidebarCard",
							style: cardPos ? { top: cardPos.top, left: cardPos.left, visibility: "visible" } : { visibility: "hidden", top: 0, left: 0 },
							children: [
								(0, react_jsx_runtime.jsx)("h3", {
									className: "dsham_sidebarCardTitle",
									children: t("deleteSession.confirmTitle")
								}),
								(0, react_jsx_runtime.jsx)("p", {
									className: "dsham_sidebarCardDesc",
									children: t("deleteSession.desc", { name: request.title })
								}),
								deleting && (0, react_jsx_runtime.jsx)("div", {
									className: "dsham_sidebarCardDesc",
									role: "status",
									children: t("deleteSession.pending")
								}),
								error !== null && (0, react_jsx_runtime.jsx)("div", {
									className: "dsham_sidebarCardError",
									role: "alert",
									children: error
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: "dsham_sidebarCardFooter",
									children: [
										(0, react_jsx_runtime.jsx)("button", {
											ref: cancelBtnRef,
											type: "button",
											className: "dsham_sidebarCardBtn dsham_sidebarCardBtnCancel",
											disabled: deleting,
											onClick: close,
											children: t("cancel")
										}),
										(0, react_jsx_runtime.jsx)("button", {
											ref: confirmBtnRef,
											type: "button",
											className: "dsham_sidebarCardBtn dsham_sidebarCardBtnDanger",
											disabled: deleting,
											onClick: confirm,
											children: t("deleteSession.title")
										})
									]
								})
							]
						})
					]
				});
			}
			let archiveWsTarget: { workspaceId: string; title: string; count: number } | null = null;
			const archiveWsListeners = new Set<() => void>();
			const publishArchiveWsTarget = (next: { workspaceId: string; title: string; count: number } | null) => {
				archiveWsTarget = next;
				for (const listener of archiveWsListeners) listener();
			};
			function useArchiveWsRequest() {
				return react.useSyncExternalStore(
					(listener: () => void) => {
						archiveWsListeners.add(listener);
						return () => { archiveWsListeners.delete(listener); };
					},
					() => archiveWsTarget,
					() => archiveWsTarget
				);
			}
			function focusWorkspaceRow(workspaceId: string) {
				try {
					const row = document.querySelector<HTMLElement>(`[data-row-key="workspace:${CSS.escape(workspaceId)}"]`);
					if (!row) return false;
					const hadTabIndex = row.hasAttribute("tabindex");
					if (!hadTabIndex) {
						row.setAttribute("tabindex", "-1");
						row.addEventListener("blur", () => row.removeAttribute("tabindex"), { once: true });
					}
					if (typeof _deepseek_ai_dsh_client_ui_primitives.focusWithoutRing === "function") {
						_deepseek_ai_dsh_client_ui_primitives.focusWithoutRing(row);
					} else {
						row.focus();
					}
					return true;
				} catch {
					return false;
				}
			}
			function ArchiveWorkspaceOverlay({ t }: { t: Translate }) {
				const request = useArchiveWsRequest();
				const [archiving, setArchiving] = (0, react.useState)(false);
				const [error, setError] = (0, react.useState)<string | null>(null);
				const [cardPos, setCardPos] = (0, react.useState)<{ top: number; left: number } | null>(null);
				const cardRef = (0, react.useRef)<HTMLDivElement>(null);
				const cancelBtnRef = (0, react.useRef)<HTMLButtonElement>(null);
				const confirmBtnRef = (0, react.useRef)<HTMLButtonElement>(null);

				(0, react.useLayoutEffect)(() => {
					if (request === null || typeof document === "undefined") {
						setCardPos(null);
						return;
					}

					let cachedRow: HTMLElement | null = null;
					const getTargetRow = () => {
						if (cachedRow && cachedRow.isConnected) return cachedRow;
						try {
							cachedRow = document.querySelector<HTMLElement>(`[data-row-key="workspace:${CSS.escape(request.workspaceId)}"]`);
						} catch {
							cachedRow = null;
						}
						return cachedRow;
					};

					const updatePosition = () => {
						const card = cardRef.current;
						const cardWidth = card?.offsetWidth || 290;
						const cardHeight = card?.offsetHeight || 160;
						const margin = 8;

						const targetRow = getTargetRow();
						if (!targetRow) {
							const w = window.innerWidth;
							const h = window.innerHeight;
							const fallbackTop = Math.max(16, (h - cardHeight) / 2);
							const fallbackLeft = Math.max(16, (w - cardWidth) / 2);
							setCardPos((prev) => prev !== null && prev.top === fallbackTop && prev.left === fallbackLeft ? prev : { top: fallbackTop, left: fallbackLeft });
							return;
						}

						const rect = targetRow.getBoundingClientRect();
						let top = rect.top - 4;
						if (top + cardHeight > window.innerHeight - 16) {
							top = window.innerHeight - 16 - cardHeight;
						}
						if (top < 16) top = 16;

						let left = rect.right + margin;
						if (left + cardWidth > window.innerWidth - 16) {
							left = rect.left - cardWidth - margin;
						}
						if (left < 16) left = 16;

						setCardPos((prev) => prev !== null && prev.top === top && prev.left === left ? prev : { top, left });
					};

					updatePosition();
					window.addEventListener("scroll", updatePosition, true);
					window.addEventListener("resize", updatePosition);

					let resizeObserver: ResizeObserver | null = null;
					if (typeof ResizeObserver !== "undefined" && cardRef.current) {
						resizeObserver = new ResizeObserver(updatePosition);
						resizeObserver.observe(cardRef.current);
					}

					return () => {
						resizeObserver?.disconnect();
						window.removeEventListener("scroll", updatePosition, true);
						window.removeEventListener("resize", updatePosition);
					};
				}, [request]);

				(0, react.useEffect)(() => {
					if (request === null) return;
					if (cancelBtnRef.current && !cancelBtnRef.current.disabled) {
						cancelBtnRef.current.focus();
					} else {
						cardRef.current?.focus();
					}
					const wsId = request.workspaceId;
					return () => {
						focusWorkspaceRow(wsId);
					};
				}, [request]);

				(0, react.useEffect)(() => {
					if (request === null) return;
					if (archiving) {
						cardRef.current?.focus();
					}
				}, [request, archiving]);

				(0, react.useEffect)(() => {
					if (request === null) return;
					const onKey = (event: KeyboardEvent) => {
						if (event.key === "Escape") {
							event.preventDefault();
							event.stopPropagation();
							if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
							if (!archiving) {
								setError(null);
								publishArchiveWsTarget(null);
							}
							return;
						}
						if (event.key === "Tab") {
							event.preventDefault();
							if (archiving) {
								cardRef.current?.focus();
								return;
							}
							const cancelBtn = cancelBtnRef.current;
							const confirmBtn = confirmBtnRef.current;
							if (!cancelBtn || !confirmBtn) return;
							if (event.shiftKey) {
								document.activeElement === cancelBtn ? confirmBtn.focus() : cancelBtn.focus();
							} else {
								document.activeElement === confirmBtn ? cancelBtn.focus() : confirmBtn.focus();
							}
						}
					};
					window.addEventListener("keydown", onKey, true);
					return () => window.removeEventListener("keydown", onKey, true);
				}, [request, archiving]);

				if (request === null) return null;

				const close = () => {
					if (!archiving) {
						setError(null);
						publishArchiveWsTarget(null);
					}
				};

				const confirm = () => {
					setArchiving(true);
					setError(null);
					const items = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
					const workspace = items.find((item) => item.workspaceId === request.workspaceId);
					const sessionMap = ctx.sessions.list?.getSnapshot?.()?.byId ?? {};
					const archived = new Set(ctx.workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
					const candidateIds = (workspace?.sessionIds ?? []).filter((id) => isWorkspaceTaskCandidate(id, sessionMap, archived));

					archiveSessionsViaOfficial(ctx.workspaces, candidateIds, refreshSessionList).then((result) => {
						setArchiving(false);
						if (result.failures.length > 0) {
							setError(formatBatchFailures(result.failures, t));
							return;
						}
						publishArchiveWsTarget(null);
					}).catch((err) => {
						setArchiving(false);
						setError(formatArchiveError(err, t));
					});
				};

				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsham_sidebarCardRoot",
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: "dsham_sidebarCardBackdrop",
							onClick: close
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							ref: cardRef,
							role: "dialog",
							"aria-modal": true,
							"aria-label": t("menu.archiveWorkspace"),
							tabIndex: -1,
							className: "dsham_sidebarCard",
							style: cardPos ? { top: cardPos.top, left: cardPos.left, visibility: "visible" } : { visibility: "hidden", top: 0, left: 0 },
							children: [
								(0, react_jsx_runtime.jsx)("h3", {
									className: "dsham_sidebarCardTitle",
									children: t("archiveWorkspace.title", { n: request.count })
								}),
								(0, react_jsx_runtime.jsx)("p", {
									className: "dsham_sidebarCardDesc",
									children: t("archiveWorkspace.desc", { name: request.title })
								}),
								archiving && (0, react_jsx_runtime.jsx)("div", {
									className: "dsham_sidebarCardDesc",
									role: "status",
									children: t("archiveWorkspace.pending")
								}),
								error !== null && (0, react_jsx_runtime.jsx)("div", {
									className: "dsham_sidebarCardError",
									role: "alert",
									children: error
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: "dsham_sidebarCardFooter",
									children: [
										(0, react_jsx_runtime.jsx)("button", {
											ref: cancelBtnRef,
											type: "button",
											className: "dsham_sidebarCardBtn dsham_sidebarCardBtnCancel",
											disabled: archiving,
											onClick: close,
											children: t("cancel")
										}),
										(0, react_jsx_runtime.jsx)("button", {
											ref: confirmBtnRef,
											type: "button",
											className: "dsham_sidebarCardBtn dsham_sidebarCardBtnDanger",
											disabled: archiving,
											onClick: confirm,
											children: t("archiveWorkspace.confirm")
										})
									]
								})
							]
						})
					]
				});
			}
			function setupWorkspaceMenuInjector(t: Translate) {
				if (typeof document === "undefined" || typeof document.addEventListener !== "function" || typeof MutationObserver === "undefined") return () => {};

				let lastClickedWorkspace: { workspaceId: string; title: string } | null = null;
				let injectDisposed = false;
				const injectedItems = new Map<HTMLButtonElement, { workspaceId: string }>();
				let revalidateQueued = false;

				/** 工作区当前可批量归档的会话 ID；菜单注入、点击与后续刷新共用同一判定。 */
				const workspaceCandidateIds = (workspaceId: string): string[] => {
					const items = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
					const workspace = items.find((item) => item.workspaceId === workspaceId);
					if (workspace === undefined) return [];
					const sessionMap = ctx.sessions.list?.getSnapshot?.()?.byId ?? {};
					const archived = new Set(ctx.workspaces.list?.getSnapshot?.()?.archivedSessionIds ?? []);
					return workspace.sessionIds.filter((id) => isWorkspaceTaskCandidate(id, sessionMap, archived));
				};
				/** 会话或归档状态变化时，刷新已注入菜单项的可用状态，避免菜单打开期间计数过期。 */
				const revalidateItems = () => {
					revalidateQueued = false;
					if (injectDisposed) return;
					for (const [button, entry] of injectedItems) {
						if (!button.isConnected) {
							injectedItems.delete(button);
							continue;
						}
						const disabled = workspaceCandidateIds(entry.workspaceId).length === 0;
						button.disabled = disabled;
						button.style.opacity = disabled ? "0.5" : "";
						button.style.cursor = disabled ? "not-allowed" : "";
					}
				};
				const scheduleRevalidate = () => {
					if (injectedItems.size === 0 || revalidateQueued || injectDisposed) return;
					revalidateQueued = true;
					const run = () => revalidateItems();
					if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
					else setTimeout(run, 16);
				};

				/**
				 * 记录触发菜单的工作区；指针与键盘激活共用（Enter/Space 只发 click，不发 pointerdown）。
				 * 点击任何非工作区行（尤其是会话行）或空白区域时立即清空，防止旧上下文把
				 * 「归档全部会话」注入到单条会话的操作菜单。
				 */
				const rememberWorkspace = (event: Event) => {
					lastClickedWorkspace = workspaceMenuTriggerFrom(event.target as Element | null);
				};

				document.addEventListener("pointerdown", rememberWorkspace, true);
				document.addEventListener("click", rememberWorkspace, true);

				const checkAndInject = () => {
					if (injectDisposed) return;
					for (const [button] of injectedItems) {
						if (!button.isConnected) injectedItems.delete(button);
					}
					const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
					for (const menu of menus) {
						if (menu.querySelector('[data-dsham-archive-workspace="true"]')) continue;

						const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'));
						if (items.length === 0) continue;

						// 文案匹配优先；宿主改文案或新增语言时，用最后一级的 danger 项兜底。
						const deleteItem = items.find((btn) => isWorkspaceDeleteMenuItem(btn, false)) ?? items.find((btn) => isWorkspaceDeleteMenuItem(btn, true));

						if (!deleteItem) continue;

						const normalItem = items.find((btn) => btn !== deleteItem) ?? deleteItem;
						const deleteWrap = deleteItem.parentElement;
						if (!deleteWrap) continue;

						const currentWs = lastClickedWorkspace;
						if (!currentWs) continue;

						const wsItems = ctx.workspaces.list?.getSnapshot?.()?.items ?? [];
						const wsItem = wsItems.find((w) => w.workspaceId === currentWs.workspaceId);
						const wsPath = wsItem?.path ?? wsItem?.cwd;

						const candidateIds = workspaceCandidateIds(currentWs.workspaceId);
						const count = candidateIds.length;

						const archiveWrap = document.createElement("div");
						archiveWrap.className = deleteWrap.className;

						const cleanItemClassName = normalItem.className.split(/\s+/).filter((name) => !/(?:^|[_-])danger(?:$|[_-])/i.test(name)).join(" ");
						const archiveBtn = document.createElement("button");
						archiveBtn.type = "button";
						archiveBtn.setAttribute("role", "menuitem");
						archiveBtn.dataset.dshamArchiveWorkspace = "true";
						// 复用普通项的类名；即使兜底项是 danger，也剔除 danger 类，避免归档项显示为危险红。
						archiveBtn.className = cleanItemClassName;

						const iconRef = normalItem.querySelector("span");
						const labelRef = normalItem.querySelectorAll("span")[1];

						const iconSpan = document.createElement("span");
						iconSpan.setAttribute("aria-hidden", "true");
						if (iconRef?.className) iconSpan.className = iconRef.className;
						iconSpan.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z"/><path d="M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5"/><path d="M6.5 9.5H9.5"/></svg>`;

						const textSpan = document.createElement("span");
						if (labelRef?.className) textSpan.className = labelRef.className;
						textSpan.textContent = t("menu.archiveWorkspace");

						archiveBtn.append(iconSpan, textSpan);
						archiveWrap.append(archiveBtn);

						if (count === 0) {
							archiveBtn.disabled = true;
							archiveBtn.style.opacity = "0.5";
							archiveBtn.style.cursor = "not-allowed";
						}

						archiveBtn.addEventListener("click", (e) => {
							e.preventDefault();
							e.stopPropagation();
							// 菜单打开期间会话/归档状态可能变化，点击时重新计算，避免确认框计数过期。
							const freshCount = workspaceCandidateIds(currentWs.workspaceId).length;
							if (freshCount === 0) return;
							document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
							publishArchiveWsTarget({
								workspaceId: currentWs.workspaceId,
								title: currentWs.title,
								count: freshCount
							});
						});

						if (wsPath) {
							const copyWrap = document.createElement("div");
							copyWrap.className = deleteWrap.className;
							const copyBtn = document.createElement("button");
							copyBtn.type = "button";
							copyBtn.setAttribute("role", "menuitem");
							copyBtn.dataset.dshamCopyWorkspacePath = "true";
							copyBtn.className = cleanItemClassName;
							copyBtn.disabled = false;
							copyBtn.style.opacity = "";
							copyBtn.style.cursor = "";
							const copyIcon = document.createElement("span");
							copyIcon.setAttribute("aria-hidden", "true");
							if (iconRef?.className) copyIcon.className = iconRef.className;
							copyIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5V2.5C10.5 1.94772 10.0523 1.5 9.5 1.5H3.5C2.94772 1.5 2.5 1.94772 2.5 2.5V8.5C2.5 9.05228 2.94772 9.5 3.5 9.5H4.5"/></svg>`;
							const copyText = document.createElement("span");
							if (labelRef?.className) copyText.className = labelRef.className;
							copyText.textContent = t("menu.copyWorkspacePath");
							copyBtn.append(copyIcon, copyText);
							copyWrap.append(copyBtn);
							copyBtn.addEventListener("click", (e) => {
								e.preventDefault();
								e.stopPropagation();
								document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
								void copySessionText(wsPath).catch(() => {});
							});

							const explorerWrap = document.createElement("div");
							explorerWrap.className = deleteWrap.className;
							const explorerBtn = document.createElement("button");
							explorerBtn.type = "button";
							explorerBtn.setAttribute("role", "menuitem");
							explorerBtn.dataset.dshamOpenExplorer = "true";
							explorerBtn.className = cleanItemClassName;
							explorerBtn.disabled = false;
							explorerBtn.style.opacity = "";
							explorerBtn.style.cursor = "";
							const expIcon = document.createElement("span");
							expIcon.setAttribute("aria-hidden", "true");
							if (iconRef?.className) expIcon.className = iconRef.className;
							expIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5C1.5 2.94772 1.94772 2.5 2.5 2.5H6.5L8 4.5H13.5C14.0523 4.5 14.5 4.94772 14.5 5.5V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V3.5Z"/><path d="M10 8.5L12 10.5L10 12.5"/><path d="M6.5 10.5H12"/></svg>`;
							const expText = document.createElement("span");
							if (labelRef?.className) expText.className = labelRef.className;
							expText.textContent = t("menu.openInExplorer");
							explorerBtn.append(expIcon, expText);
							explorerWrap.append(explorerBtn);
							explorerBtn.addEventListener("click", (e) => {
								e.preventDefault();
								e.stopPropagation();
								document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
								void (async () => {
									try {
										const res = await fetch(resolveApiUrl("/open-in-app/open"), {
											method: "POST",
											headers: { "content-type": "application/json" },
											body: JSON.stringify({ app: "explorer", path: wsPath })
										}).catch(() => null);
										if (res && res.ok) return;
									} catch {}
									try {
										await callSettingsApi("/open-in-explorer", {
											method: "POST",
											body: JSON.stringify({ path: wsPath, workspaceId: currentWs.workspaceId })
										});
									} catch (err) {
										console.warn("archive-manager: open in explorer failed", err);
									}
								})();
							});

							deleteWrap.parentNode?.insertBefore(copyWrap, deleteWrap);
							deleteWrap.parentNode?.insertBefore(explorerWrap, deleteWrap);
						}

						deleteWrap.parentNode?.insertBefore(archiveWrap, deleteWrap);
						injectedItems.set(archiveBtn, { workspaceId: currentWs.workspaceId });
					}
				};

				let injectQueued = false;
				const scheduleInject = () => {
					if (injectQueued || injectDisposed) return;
					injectQueued = true;
					const run = () => {
						injectQueued = false;
						if (injectDisposed) return;
						checkAndInject();
					};
					// 流式输出会持续触发 DOM 变更，按帧合并，避免每个变更批次全量扫描菜单。
					if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
					else setTimeout(run, 16);
				};
				const observer = new MutationObserver((records) => {
					if (mutationTouches(records, '[role="menu"]')) scheduleInject();
				});
				observer.observe(document.body, { childList: true, subtree: true });
				const unsubscribeSessions = ctx.sessions.list?.subscribe?.(scheduleRevalidate);
				const unsubscribeWorkspaces = ctx.workspaces.list?.subscribe?.(scheduleRevalidate);

				return () => {
					injectDisposed = true;
					document.removeEventListener("pointerdown", rememberWorkspace, true);
					document.removeEventListener("click", rememberWorkspace, true);
					observer.disconnect();
					unsubscribeSessions?.();
					unsubscribeWorkspaces?.();
					injectedItems.clear();
					for (const item of document.querySelectorAll<HTMLElement>('[data-dsham-archive-workspace="true"], [data-dsham-copy-workspace-path="true"], [data-dsham-open-explorer="true"]')) item.parentElement?.remove();
				};
			}
			function hostSidebarDeclaresSessionMenu() {
				if (typeof ctx.slots.entries !== "function") return false;
				return ctx.slots.entries("sidebar.workspaces").some((entry) => entry.children?.[sessionMenuSlot] !== undefined);
			}
			let sidebarMode: "menu" | "waiting" | undefined;
			let disposeMenu: (() => void) | undefined;
			let disposeFavoriteMenu: (() => void) | undefined;
			let disposeMoveMenu: (() => void) | undefined;
			let disposeDialog: (() => void) | undefined;
			let disposeArchiveDialog: (() => void) | undefined;
			let disposeToast: (() => void) | undefined;
			/** 支持的宿主都声明了会话菜单插槽。插槽还没出现时只等待，不再盖掉官方侧栏。 */
			const reconcileSidebar = () => {
				const next = hostSidebarDeclaresSessionMenu() ? "menu" : "waiting";
				if (next === sidebarMode) return;
				sidebarMode = next;
				if (next !== "menu") return;
				disposeMenu ??= ctx.slots.inject(sessionMenuSlot, () => ctx.slots.register({
						name: sessionMenuSlot,
						id: "archive-manager.delete-session",
						order: 500,
						locale: NS,
						inject: () => ({})
					}, DeleteSessionMenuItem));
				disposeFavoriteMenu ??= ctx.slots.inject(sessionMenuSlot, () => ctx.slots.register({
						name: sessionMenuSlot,
						id: "archive-manager.favorite",
						order: 50,
						locale: NS,
						inject: () => ({ favoriteRow: favoriteRowStore })
					}, FavoriteMenuItem));
				disposeMoveMenu ??= ctx.slots.inject(sessionMenuSlot, () => ctx.slots.register({
						name: sessionMenuSlot,
						id: "archive-manager.move-session",
						order: 480,
						locale: NS,
						inject: () => ({})
					}, MoveSessionMenuItem));
				disposeDialog ??= ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "archive-manager.delete-session",
						locale: NS,
						inject: () => ({ t: ctx.locale.bind(NS) })
					}, DeleteSessionOverlay));
				disposeArchiveDialog ??= ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "archive-manager.archive-workspace",
						locale: NS,
						inject: () => ({ t: ctx.locale.bind(NS) })
					}, ArchiveWorkspaceOverlay));
				disposeToast ??= ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "archive-manager.toast",
						locale: NS,
						inject: () => ({})
					}, GlobalToastOverlay));
			};
			reconcileSidebar();
			ctx.effect(() => setupWorkspaceMenuInjector(ctx.locale.bind(NS)), "archive-manager: workspace menu injector");
			ctx.effect(() => setupSidebarRowContextMenu(), "archive-manager: sidebar row contextmenu trigger");
			installSettingsNavIcon(ctx);
			const unsubscribeSidebar = typeof ctx.on === "function" ? ctx.on("slots/changed", (key: string) => {
				if (key !== "sidebar.workspaces") return;
				try { reconcileSidebar(); }
				catch (error) { console.warn("archive-manager: sidebar mode switch failed", error); }
			}) : undefined;
			ctx.effect(() => () => {
				unsubscribeSidebar?.();
				disposeMenu?.();
				disposeFavoriteMenu?.();
				disposeMoveMenu?.();
				disposeDialog?.();
				disposeArchiveDialog?.();
				disposeToast?.();
			}, "archive-manager: sidebar mode");

			const buildArchivedSectionProps = () => ({
				archiveSessions,
				archiveSession: (id: string, options?: { stopActivity?: boolean }) => ctx.workspaces.archiveSession(id, options),
				sessionStore: bindObservable(ctx.sessions.list),
				workspaceStore: bindObservable(ctx.workspaces.list),
				unarchiveSession,
				deleteSession,
				unarchiveSessions,
				deleteArchivedSessions,
				archivedSessionMetadata, openConversation, focusSessionWorkspace, viewState: archiveViewState,
				favoriteSessions, setSessionFavorite, favoriteSync: favoriteRowStore, organizeBatch, diagnoseOrphanSubagents, cleanOrphanSubagents, diagnoseSessionCaches, rebuildSessionCaches, refreshCacheLists, searchSessionContent, searchArchivedContent, previewArchivedSession,
				t: ctx.locale.bind(NS)
			});

			const callSettingsApi = async (path: "/sidebar-entry" | "/online-update" | "/open-in-explorer", options?: RequestInit) => {
				const targetUrl = resolveApiUrl(`/api/michengai/dsh-archive-manager${path}`);
				const reqHeaders = Object.assign({
					"content-type": "application/json",
					"x-michengai-plugin-update": "1",
				}, options?.headers);
				const response = await fetch(targetUrl, Object.assign({}, options, { headers: reqHeaders }));
				const data = await response.json();
				if (!response.ok || !data || data.ok === false) {
					throw new Error((data && typeof data === "object" && typeof data.error === "string" ? data.error : undefined) || `HTTP ${response.status}`);
				}
				return data;
			};

			const sidebarController = setupSidebarEntry(ctx, {
				callApi: callSettingsApi,
				renderPanel: (ownerProps) => (0, react_jsx_runtime.jsx)(ArchivedSessionsSection, Object.assign({}, buildArchivedSectionProps(), ownerProps)),
				injectProps: buildArchivedSectionProps,
				ns: NS,
				onOnlineUpdateChange: () => {
					if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dsham-update-toggle"));
				},
			});
			ctx.effect(() => () => sidebarController.destroy(), "archive-manager: sidebar entry");

			ctx.effect(() => observePluginUpdate({
				endpoint: "/api/michengai/dsh-archive-manager/update",
				packageName: "@michengai/dsh-archive-manager",
				titleRowSelector: ".dsham_settingsTitleRow",
				linksSelector: ".dsham_settingsLinks",
				zhName: "归档会话",
				enName: "Archived sessions",
				ruName: "Архив сессий",
				createIcon: createPluginUpdateIcon,
				isEnabled: () => sidebarController.isOnlineUpdateEnabled(),
			}), "dsh-archive-manager: plugin update ui");

			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "archived-sessions",
				order: 45,
				label: () => ctx.locale.bind(NS)("archived.badge"),
				icon: "archive",
				locale: NS,
				inject: buildArchivedSectionProps
			}, ArchivedSessionsSection));
		}
		//#endregion
		/** Pure derivation surface for dsh-archive-manager self-tests (no-op for the runtime). */
		/** 分叉失败由父组件提示，避免列表引用父组件内部作用域。 */
        async function forkWithFeedback(sessionId: string, fork: (sessionId: string) => Promise<unknown>, notify: (message: string) => void, t: Translate) {
            try { await fork(sessionId); }
            catch (reason) { notify(formatForkError(reason, t)); }
        }
        exports.__test = {
            forkWithFeedback,
			favoritesOnlyVisibility,
			favoriteGroupPredicate,
			createFavoriteRowStore,
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
			isWorkspaceTaskCandidate,
			isWorkspaceDeleteMenuItem,
			workspaceMenuTriggerFrom,
			findRowMenuButton,
			isRowMenuButton,
			setupSidebarRowContextMenu,
			applySettingsNavIcon,
			restoreSettingsNavIcon,
			installSettingsNavIcon,
			mutationTouches,
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
			groupByWorkspace,
			byRecency,
			ARCHIVE_MANAGER_REMOTE,
			currentSessionId,
			setupSidebarEntry,
		};
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
}
