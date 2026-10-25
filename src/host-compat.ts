import type { Context } from "@deepseek-ai/cordis";
import type { Session, SessionHeader, SessionEvent } from "@deepseek-ai/dsh-session";
import type { WorkspaceRegistry, WorkspaceRecord, WorkspaceDomainState } from "@deepseek-ai/dsh-workspace";
import type { CheckpointRecord } from "@deepseek-ai/dsh-session-projection-cache";
import type { KvTable } from "@deepseek-ai/dsh-storage-domain";
import type { TypertContribution } from "@deepseek-ai/dsh-typert-registry";

/** 旧宿主使用普通字符串 ID；只在经现有 schema 校验的兼容边界消除新版本品牌。 */
export type Header = Omit<SessionHeader, "id"> & { id: string; header?: Header };
export type WorkspaceRow = Omit<WorkspaceRecord, "sessionIds"> & { sessionIds: string[] };
export type WorkspaceState = Omit<WorkspaceDomainState, "workspaceIds" | "archivedSessionIds" | "pinnedSessionIds"> & { workspaceIds: string[]; archivedSessionIds: string[]; pinnedSessionIds: string[] };
export interface StoredSource { meta: Header; events: SessionEvent[]; inheritedEventCount?: number }
export interface PersistenceCompat {
  name: string; root?: string; config?: { root?: string }; generationFormat?: unknown;
  locate(header: Header): { kind: string; path: string } | undefined;
  list(): Promise<{ header: Header }[]>;
  stat(id: string): Promise<unknown>;
  findLog?(id: string): Promise<unknown>;
  open(id: string, mode: "read"): Promise<{ header: Header; inheritedEventCount: number; read(offset: number): Promise<{ events: SessionEvent[] }>; close(): Promise<void> }>;
  prepare?(id: string): Promise<{ session: Session; [Symbol.dispose](): void }>;
  readZstdPrefix?(bytes: Buffer): Promise<{ meta: Header; tornTruncateTo?: number }>;
  acquireLease(id: string, owner: undefined, directory: string): Promise<{ release(): Promise<void> }>;
}
export interface SessionsCompat {
  get(id: string): Session | undefined;
  list(): Session[];
  flush(session: Session): Promise<void>;
  liveEntryFor(session: Session): unknown;
  detachEntered(entry: unknown): void;
  enter(session: Session): () => void;
  announce(session: Session): void;
}
interface CacheCompat {
  requireTable(): Pick<KvTable<string, CheckpointRecord>, "delete">;
}
interface HostServices {
  sessions: SessionsCompat;
  sessionPersistence: PersistenceCompat;
  sessionProjectionCache: CacheCompat;
  spillStore: { root?: string };
  typert: { register(value: TypertContribution): unknown };
  /** 宿主定时任务服务；旧宿主不提供，取不到时按「没有定时任务」处理。 */
  schedule?: { catalog?(): Promise<unknown> };
}
export interface HostContext extends Omit<Context, "get" | "sessionPersistence" | "emit"> {
  get<K extends keyof HostServices>(name: K): HostServices[K];
  sessionPersistence: PersistenceCompat;
  emit(event: "api-session/removed", sessionId: string): void;
}
/** 已有插件使用的上游内部扩展点；集中声明并由宿主版本矩阵保护。 */
export interface WorkspaceCompat extends Omit<WorkspaceRegistry, "archiveSession" | "unarchiveSession"> {
  ctx: HostContext;
  host: { sessionPath?(id: string): string | undefined; candidateMatches?(id: string, path: string): boolean };
  headers: Map<string, Header>; sessionPaths: Map<string, string>; missingSessionPaths?: Set<string>; invalidSessionPaths: Set<string> | Map<string, string>;
  entities: Map<string, { record: WorkspaceRow; attachSession(id: string): Promise<unknown> }>;
  requireTable(): KvTable<string, WorkspaceRow>;
  requireState(): WorkspaceState;
  setState(state: WorkspaceState): Promise<void>;
  enqueueOperation<T>(operation: () => Promise<T>): Promise<T>;
  readSessionHeader(id: string): Promise<Header>;
  sessionKnown(id: string): Promise<boolean>;
  indexHeader(header: Header): Promise<void>;
  indexHeaders(items: Header[]): Promise<void>;
  listStoredHeaders(): Promise<Header[]>;
}
export type WorkspaceConstructor = { new(ctx: Context): WorkspaceCompat };
