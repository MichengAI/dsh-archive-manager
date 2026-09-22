import type * as React from "react";
import type { SessionSummary, SessionDetail, BatchResult, BatchProgress, OrganizeKind, OrganizeOptions, Translate } from "./contracts.js";

/** 给预编译 JSX 调用补回属性与事件上下文，运行时仍使用宿主的 jsx-runtime。 */
interface TypedJsx {
  <K extends keyof React.JSX.IntrinsicElements>(type: K, props: React.JSX.IntrinsicElements[K] & { [key: `data-${string}`]: unknown }, key?: React.Key): React.ReactElement;
  <P>(type: React.JSXElementConstructor<P>, props: P, key?: React.Key): React.ReactElement;
}
interface ClientModules {
  "react": typeof React;
  "react/jsx-runtime": { jsx: TypedJsx; jsxs: TypedJsx; Fragment: typeof React.Fragment };
  "@deepseek-ai/dsh-client-store": typeof import("@deepseek-ai/dsh-client-store");
  "@deepseek-ai/dsh-client-runtime/client": typeof import("@deepseek-ai/dsh-client-store");
  "@deepseek-ai/dsh-client-ui-primitives": typeof import("@deepseek-ai/dsh-client-ui-primitives");
}
declare global {
  interface Window {
    __ModuleLoader__: { load(module: { id: string; factory(require: <K extends keyof ClientModules>(name: K) => ClientModules[K]): unknown }): void };
  }
}
export interface ClientSession extends SessionSummary {
  updatedAt: number;
  title: string;
  displayTitle: string;
  origin?: string; parentId?: string; blank?: boolean; completed?: boolean;
  archived?: boolean; running: boolean; runningSubagentCount?: number;
  pendingInteraction?: string; failed?: boolean;
}
export interface ClientList { ids: string[]; byId: Record<string, ClientSession>; current?: string; phase: string }
export interface ClientWorkspace { workspaceId: string; title: string; path: string; cwd?: string; sessionIds: string[]; createdAt: string; updatedAt?: string }
export interface WorkspaceSnapshot { items: ClientWorkspace[]; archivedSessionIds: string[]; phase: string }
export interface Observable<T> { getSnapshot(): T; subscribe(listener: () => void): () => void }
export interface WorkspaceView {
  groupBy: string; orderBy: string; showArchived: boolean;
  groupExpansion: Record<string, boolean>; sessionOrderByAccount: Record<string, string[]>;
  sessionUpdatedAtByAccount: Record<string, Record<string, number>>;
}
export interface UiFacts { pending: Map<string, { kind: string }>; completed: Set<string> }
export type PendingHook = <T>(selector: (value: Map<string, { kind: string }>) => T) => T;
export type StatusMap = Map<string, { completionUnread?: boolean; pendingInteraction?: { kind: string } }>;
export type StatusHook = <T>(selector: (value: StatusMap) => T) => T;
export type BatchTarget = { scope: "all" | "ungrouped" } | { scope: "workspace"; workspaceId: string } | { scope: "sessions"; sessionIds: string[] };
export interface DeletedBatch { requestedSessionIds: string[]; deletedSessionIds: string[]; skippedSessionIds: string[]; failures: { sessionId: string; message: string }[] }
export interface ArchivedGroup { key: string; title: string; ids?: Set<string>; sessions: ClientSession[]; cwd?: string; workspaceId?: string; createdAt?: string }
export interface ArchiveProps {
  sessionStore: Observable<ClientList>; workspaceStore: Observable<WorkspaceSnapshot>;
  archiveSessions(ids: string[]): Promise<{ archivedSessionIdsAdded: string[] }>;
  archiveSession?(id: string, options?: { stopActivity?: boolean }): Promise<unknown>;
  unarchiveSession(id: string): Promise<unknown>; deleteSession(id: string): Promise<unknown>;
  unarchiveSessions(target: BatchTarget): Promise<{ unarchivedSessionIds: string[] }>;
  deleteArchivedSessions(target: BatchTarget): Promise<DeletedBatch>;
  archivedSessionMetadata(): Promise<{ items: { sessionId: string; createdAt: number }[] }>;
  openConversation(id: string): unknown; focusSessionWorkspace?(id: string): Promise<unknown>;
  viewState?: { query?: string; project?: string; sortBy?: string }; close?(): void; t: Translate;
  diagnoseSession: (input: {sessionId: string}) => Promise<ReturnType<typeof import("./archive-discovery.js").repairResultSchema.parse>>;
  repairSession: (input: {sessionId: string; token?: string}) => Promise<ReturnType<typeof import("./archive-discovery.js").repairResultSchema.parse>>;
  sessionDetails(input: {sessionIds: string[]}): Promise<{ items: SessionDetail[] }>;
  searchSessionContent?: (input: {sessionIds: string[]; query: string}) => Promise<unknown>;
  searchArchivedContent?: (input: {sessionIds: string[]; query: string}) => Promise<unknown>;
  previewArchivedSession: (input: {sessionId: string; query: string}) => Promise<ReturnType<typeof import("./archive-discovery.js").previewResultSchema.parse>>;
  favoriteSessions(): Promise<{ favoriteSessionIds: string[] }>;
  setSessionFavorite(input: {sessionId: string; favorite: boolean}): Promise<{favoriteSessionIds: string[]}>;
  organizeBatch?: (kind: OrganizeKind, ids: readonly string[], options?: OrganizeOptions) => Promise<BatchResult>;
  useSessionPendingInteraction?: PendingHook; useSessionStatus?: StatusHook;
}
export type ArchiveBatchResult = BatchResult & { kind: OrganizeKind; tab: string };
export type ArchiveRetry = { kind: OrganizeKind; ids: string[]; idle: boolean };
export type ArchiveDeleteTarget = { kind: "session"; session: ClientSession } | { kind: "batch"; target: BatchTarget; title?: string; count: number };
export type SelectorHook<S> = <T>(selector: (state: S) => T) => T;
export interface ViewActions {
  setGroupBy(mode: string): void; setOrderBy(mode: string): void; setShowArchived(value: boolean): void;
  setGroupExpanded(key: string, expanded: boolean): void; retainAccountKeys(keys: string[]): void;
  syncSessionOrderAccount(key: string, order: string[], timestamps: Record<string, number>): void;
  setSessionOrder(key: string, order: string[]): void;
}
export interface SearchPage { items: { sessionId: string; snippet: string }[]; hasMore: boolean }
export interface RemoteSearch extends SearchPage { query: string; status: string }
export interface DirectoryFlowOwner { open: boolean; busy: boolean; onPicked(path: string): void; onCancel(): void; onError(message: string): void }
export interface BrowserProps {
  wide: boolean; expandSidebar(): void;
  useSessions: SelectorHook<ClientList>; useWorkspaces: SelectorHook<WorkspaceSnapshot>;
  useSessionPendingInteraction?: PendingHook; useSessionStatus?: StatusHook;
  useStore: SelectorHook<WorkspaceView>; actions: ViewActions;
  startSession(workspaceId: string): unknown; open(sessionId: string): unknown;
  renameSession(id: string, title: string): Promise<unknown>; forkSession(id: string): Promise<unknown>;
  renameWorkspace(id: string, title: string): Promise<unknown>; deleteWorkspace(id: string): Promise<unknown>;
  insertWorkspaceBefore(id: string, before?: string): Promise<unknown>;
  insertSessionBefore(workspaceId: string, sessionId: string, before?: string): Promise<unknown>;
  archiveSession(id: string, options?: { readonly stopActivity?: boolean }): Promise<unknown>; archiveWorkspaceSessions(id: string): Promise<unknown>;
  unarchiveSession(id: string): Promise<unknown>; deleteSession(id: string): Promise<unknown>;
  createWorkspace(input: { path: string }): Promise<ClientWorkspace>;
  searchSessions(query: string, signal?: AbortSignal): Promise<SearchPage>; searchResultLimit: number;
  useDirectoryFlow: SelectorHook<boolean>; renderSlot(name: string, props: DirectoryFlowOwner): React.ReactNode; t: Translate;
}
export interface TreeProps extends Pick<BrowserProps, "useSessions" | "startSession" | "open" | "forkSession" | "insertWorkspaceBefore" | "insertSessionBefore" | "t">, Pick<ViewActions, "setGroupExpanded" | "syncSessionOrderAccount" | "setSessionOrder"> {
  useSessionPendingInteraction: PendingHook; useSessionStatus: StatusHook; preferSessionStatus: boolean;
  workspaces: ClientWorkspace[]; archivedSessionIds: string[]; showArchived: boolean; orderBy: string;
  groupExpansion: Record<string, boolean>; sessionOrderByAccount: Record<string, string[]>;
  sessionUpdatedAtByAccount: Record<string, Record<string, number>>;
  onRenameRequest(id: string, title: string): void; onArchiveRequest(id: string, title: string): void; onDeleteRequest(id: string, title: string): void;
  onSessionRename(id: string, title: string): void; onSessionArchive(id: string): void; onSessionUnarchive(id: string): void; onSessionDelete(id: string, title: string): void;
  revealSessionId?: string; onSessionRevealed(id: string): void; showArchivedToast(message: string): void;
}
export type FlatProps = Omit<TreeProps, "startSession" | "insertWorkspaceBefore" | "insertSessionBefore" | "workspaces" | "onRenameRequest" | "onArchiveRequest" | "onDeleteRequest" | "groupExpansion" | "setGroupExpanded">;
export interface SearchProps extends Pick<TreeProps, "useSessions" | "useSessionPendingInteraction" | "useSessionStatus" | "preferSessionStatus" | "open" | "workspaces" | "archivedSessionIds" | "showArchived" | "t"> { query: string; remote: RemoteSearch; resultLimit: number }
export interface WorkspacePickProps extends Pick<BrowserProps, "t" | "useWorkspaces" | "createWorkspace" | "useDirectoryFlow"> {
  open: boolean; anchorRef?: React.RefObject<HTMLElement>; renderDirectoryFlow(props: DirectoryFlowOwner): React.ReactNode;
  onPick(id: string): void; onClose(): void; addOnly?: boolean; side?: "top" | "bottom" | "right"; selectedId?: string;
}
export interface DropOver { id: string; half: "before" | "after" }
export interface SessionDrag { sessionId: string; accountKey: string; over: DropOver | null }
export interface WorkspaceDrag { workspaceId: string; over: DropOver | null }
export interface RowDrag { marker?: "before" | "after" | null; active: boolean; start(): void; end(): void; hover(half: "before" | "after"): void; drop(half: "before" | "after"): void }
export type { Translate, BatchResult, BatchProgress, OrganizeKind, OrganizeOptions, SessionDetail };
