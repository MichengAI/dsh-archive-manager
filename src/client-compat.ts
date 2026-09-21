import type { ComponentType } from "react";
import type { ArchiveProps, BrowserProps, ClientList, ClientWorkspace, Observable, SearchPage, WorkspaceSnapshot } from "./client-types.js";
import type { ArchiveState } from "./contracts.js";
import type { NavigationSource, SessionNavigationSource } from "./archive-experience.js";
import type { DirectoryMirrorContext } from "./directory-flow-slot.js";

/** 跨版本远程结果保持宿主原有的成功/失败判别字段。 */
export type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { message: string } };
export type DiscoveryMethod = "sessionDetails" | "diagnoseSession" | "repairSession" | "searchArchivedContent" | "searchSessionContent" | "previewArchivedSession";
export type RegistryCalls = { [K in DiscoveryMethod | "favoriteSessions" | "setSessionFavorite"]: NonNullable<ArchiveProps[K]> };
export type Registry = { [K in keyof RegistryCalls]: (...args: Parameters<RegistryCalls[K]>) => Promise<RemoteResult<Awaited<ReturnType<RegistryCalls[K]>>>> } & {
  unarchiveSession(id: string): Promise<RemoteResult<ArchiveState>>;
  deleteSession(id: string): Promise<RemoteResult<unknown>>;
  deleteArchivedSessions(target: Parameters<ArchiveProps["deleteArchivedSessions"]>[0]): Promise<RemoteResult<Awaited<ReturnType<ArchiveProps["deleteArchivedSessions"]>>>>;
  archivedSessionMetadata(): Promise<RemoteResult<{ items: { sessionId: string; createdAt: number }[]; repairedSessionIds: string[] }>>;
};
export interface Workspaces {
  list: Observable<WorkspaceSnapshot>;
  archiveSession(id: string): Promise<unknown>;
  unarchiveSession?(id: string): Promise<ArchiveState | undefined>;
  startSession(id: string): unknown;
  rename(id: string, title: string): Promise<unknown>;
  delete(id: string): Promise<unknown>;
  insertBefore(id: string, before?: string): Promise<unknown>;
  insertSessionBefore(workspaceId: string, sessionId: string, before?: string): Promise<unknown>;
  create(input: { path: string }): Promise<ClientWorkspace>;
}
export interface SessionBinding { rename(title: string): Promise<RemoteResult<unknown>> }
interface Sessions extends SessionNavigationSource {
  list: Observable<ClientList>;
  search(query: string, signal?: AbortSignal): Promise<RemoteResult<SearchPage>>;
  searchResultLimit: number;
  refresh?(): Promise<unknown>;
  open(id: string): unknown;
  binding(id: string): { session: SessionBinding } | undefined;
  using?(id: string, options: { source: string }, action: (reference: { binding: { session: SessionBinding } }) => Promise<void>): Promise<void>;
  fork(input: { sessionId: string; increaseTitle: boolean }): Promise<string>;
}
interface UiWorkspace extends NavigationSource { startSession(id: string): unknown; forkSession?(id: string): Promise<unknown> }
interface Services {
  "remote": { $mount(contribution: { package: string; descriptors: readonly unknown[] }): Promise<() => void | Promise<void>> };
  "remote.workspaceRegistry": Registry;
  "uiWorkspace": UiWorkspace;
  "layout": { selectPanel(panel: null): void; beginNavigation?(): void };
}
export type BrowserInjected = Pick<BrowserProps, "startSession" | "open" | "searchSessions" | "searchResultLimit" | "renameSession" | "forkSession" | "renameWorkspace" | "deleteWorkspace" | "insertWorkspaceBefore" | "archiveSession" | "archiveWorkspaceSessions" | "unarchiveSession" | "deleteSession" | "insertSessionBefore" | "createWorkspace"> & { hooks: { directoryFlow: Observable<boolean> } };
/** 仅描述实际消费的客户端能力，隔离旧宿主缺失的公开声明。 */
export interface ClientContext extends Omit<DirectoryMirrorContext, "slots"> {
  sessions: Sessions;
  workspaces: Workspaces;
  locale: { register(namespace: string, dictionaries: Record<string, Record<string, string>>): () => void; bind(namespace: string): ArchiveProps["t"] };
  get<K extends keyof Services>(name: K): Services[K] | undefined;
  inject?(dependencies: ["uiWorkspace"], effect: (ready: { uiWorkspace?: UiWorkspace }) => () => void): unknown;
  slots: DirectoryMirrorContext["slots"] & {
    subscribe(name: string, listener: () => void): () => void;
    register<P>(options: { name: string; priority?: number; store?: unknown; inject: () => unknown; locale: string; children?: Record<string, { kind: string; scope: string }>; id?: string; order?: number; label?: () => string; icon?: string }, component: ComponentType<P>): () => void;
  };
}
