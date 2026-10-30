import type * as React from "react";
import type { CacheDiagnosis, CacheRebuildResult, CacheCandidate } from "./cache-rebuild-contract.js";
import type { SessionSummary, BatchResult, BatchProgress, OrganizeKind, OrganizeOptions, Translate } from "./contracts.js";
import type { ArchivePreviewResult } from "./archive-discovery.js";

/** 给预编译 JSX 调用补回属性与事件上下文，运行时仍使用宿主的 jsx-runtime。 */
interface TypedJsx {
  <K extends keyof React.JSX.IntrinsicElements>(type: K, props: React.JSX.IntrinsicElements[K] & { [key: `data-${string}`]: unknown }, key?: React.Key): React.ReactElement;
  <P>(type: React.JSXElementConstructor<P>, props: P, key?: React.Key): React.ReactElement;
}
interface ClientModules {
  "react": typeof React;
  "react-dom": typeof import("react-dom");
  "react/jsx-runtime": { jsx: TypedJsx; jsxs: TypedJsx; Fragment: typeof React.Fragment };
  "@deepseek-ai/dsh-client-store": typeof import("@deepseek-ai/dsh-client-store");
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
export interface ClientList { ids: string[]; byId: Record<string, ClientSession>; current?: string; phase: string; state?: "idle" | "loading" | "error"; error?: unknown }
export interface ClientWorkspace { workspaceId: string; title: string; path: string; cwd?: string; sessionIds: string[]; createdAt: string; updatedAt?: string }
export interface WorkspaceSnapshot { items: ClientWorkspace[]; archivedSessionIds: string[]; phase: string }
export interface Observable<T> { getSnapshot(): T; subscribe(listener: () => void): () => void }
export interface UiFacts { pending: Map<string, { kind: string }>; completed: Set<string> }
export type PendingHook = <T>(selector: (value: Map<string, { kind: string }>) => T) => T;
export type StatusMap = Map<string, { completionUnread?: boolean; pendingInteraction?: { kind: string } }>;
export type StatusHook = <T>(selector: (value: StatusMap) => T) => T;
export type BatchTarget = { scope: "all" | "ungrouped" } | { scope: "workspace"; workspaceId: string } | { scope: "sessions"; sessionIds: string[] };
export interface DeletedBatch { requestedSessionIds: string[]; deletedSessionIds: string[]; skippedSessionIds: string[]; failures: { sessionId: string; message: string }[] }
export interface ArchivedGroup { key: string; title: string; ids?: Set<string>; sessions: ClientSession[]; cwd?: string; workspaceId?: string; createdAt?: string }
/** Client-side view of the shared favourites store (main-sidebar star ↔ archive panel). */
export interface FavoriteSync {
  subscribe(listener: () => void): () => void;
  getSnapshot(): { ready: boolean; ids: ReadonlySet<string>; pending: ReadonlySet<string> };
  adopt(favoriteSessionIds: readonly string[]): void;
}
export interface ArchiveProps {
  diagnoseSessionCaches?(): Promise<CacheDiagnosis>;
  rebuildSessionCaches?(input: { items: CacheCandidate[] }): Promise<CacheRebuildResult>;
  refreshCacheLists?(): Promise<unknown>;
  sessionStore: Observable<ClientList>; workspaceStore: Observable<WorkspaceSnapshot>;
  archiveSessions(ids: string[]): Promise<{ archivedSessionIdsAdded: string[]; failures?: { sessionId: string; message: string }[] }>;
  archiveSession?(id: string, options?: { stopActivity?: boolean }): Promise<unknown>;
  unarchiveSession(id: string): Promise<unknown>; deleteSession(id: string): Promise<unknown>;
  unarchiveSessions(target: BatchTarget): Promise<{ unarchivedSessionIds: string[]; failures?: { sessionId: string; message: string }[] }>;
  deleteArchivedSessions(target: BatchTarget): Promise<DeletedBatch>;
  archivedSessionMetadata(): Promise<{ items: { sessionId: string; createdAt: number }[] }>;
  openConversation(id: string): unknown; focusSessionWorkspace?(id: string): Promise<unknown>;
  viewState?: { query?: string; project?: string; sortBy?: string }; close?(): void; t: Translate;
  searchSessionContent?: (input: {sessionIds: string[]; query: string}) => Promise<unknown>;
  searchArchivedContent?: (input: {sessionIds: string[]; query: string}) => Promise<unknown>;
  previewArchivedSession: (input: {sessionId: string; query: string}) => Promise<ArchivePreviewResult>;
  favoriteSessions(): Promise<{ favoriteSessionIds: string[] }>;
  setSessionFavorite(input: {sessionId: string; favorite: boolean}): Promise<{favoriteSessionIds: string[]}>;
  /** Optional shared store: when present the panel mirrors main-sidebar star toggles. */
  favoriteSync?: FavoriteSync;
  diagnoseOrphanSubagents?(): Promise<{ count: number; items: { sessionId: string; parentSessionId: string; createdAt: number; sizeBytes: number }[]; totalSizeBytes: number }>;
  cleanOrphanSubagents?(target?: { sessionIds?: string[] }): Promise<{ cleanedSessionIds: string[]; skippedSessionIds: string[]; failures: { sessionId: string; message: string }[] }>;
  organizeBatch?: (kind: OrganizeKind, ids: readonly string[], options?: OrganizeOptions) => Promise<BatchResult>;
  useSessionPendingInteraction?: PendingHook; useSessionStatus?: StatusHook;
}
export type ArchiveBatchResult = BatchResult & { kind: OrganizeKind; tab: string };
export type ArchiveRetry = { kind: OrganizeKind; ids: string[]; idle: boolean };
export type ArchiveDeleteTarget = { kind: "session"; session: ClientSession } | { kind: "batch"; target: BatchTarget; title?: string; count: number };
export interface SearchPage { items: { sessionId: string; snippet: string }[]; hasMore: boolean }
export interface RowDrag { marker?: "before" | "after" | null; active: boolean; start(): void; end(): void; hover(half: "before" | "after"): void; drop(half: "before" | "after"): void }
export type { Translate, BatchResult, BatchProgress, OrganizeKind, OrganizeOptions };
