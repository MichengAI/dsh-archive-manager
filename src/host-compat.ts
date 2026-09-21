import type { Context } from "@deepseek-ai/cordis";
import type { Session, SessionHeader, SessionEvent } from "@deepseek-ai/dsh-session";
import type { WorkspaceRegistry, WorkspaceRecord, WorkspaceDomainState } from "@deepseek-ai/dsh-workspace";
import type { CheckpointRecord } from "@deepseek-ai/dsh-session-projection-cache";
import type { KvTable } from "@deepseek-ai/dsh-storage-domain";
import type { TypertContribution } from "@deepseek-ai/dsh-typert-registry";
import type { RepairFormat } from "./session-repair.js";

/** 旧宿主使用普通字符串 ID；只在经现有 schema 校验的兼容边界消除新版本品牌。 */
export type Header = Omit<SessionHeader, "id"> & { id: string; header?: Header };
export type WorkspaceRow = Omit<WorkspaceRecord, "sessionIds"> & { sessionIds: string[] };
export type WorkspaceState = Omit<WorkspaceDomainState, "workspaceIds" | "archivedSessionIds"> & { workspaceIds: string[]; archivedSessionIds: string[] };
export interface StoredSource { meta: Header; events: SessionEvent[]; inheritedEventCount?: number }
export interface PersistenceCompat {
  name: string; root?: string; config?: { root?: string }; generationFormat: RepairFormat;
  locate(header: Header): { kind: string; path: string } | undefined;
  list(): Promise<(Header | { header: Header })[]>;
  stat(id: string): Promise<unknown>;
  readFrom?(id: string, offset: number): Promise<StoredSource>;
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
  whenIdle?(): Promise<void>; delete(id: string): Promise<void>; clearTombstone?(id: string): void;
  cachedSnapshot(header: Header, inheritedEventCount: number): unknown;
  put(id: string, identity: Omit<CheckpointRecord["identity"], "inheritedEventCount"> & { inheritedEventCount: number }, rows: CheckpointRecord["rows"]): Promise<void>;
}
interface HostServices {
  sessions: SessionsCompat;
  sessionPersistence: PersistenceCompat;
  sessionProjectionCache: CacheCompat;
  sessionProjections: { restore(initial: object, events: SessionEvent[], offset: number, header: Header, inheritedEventCount: number): { checkpoint: CheckpointRecord["rows"] } | undefined };
  spillStore: { root?: string };
  typert: { register(value: TypertContribution): unknown };
}
export interface HostContext extends Omit<Context, "get" | "sessionPersistence" | "emit"> {
  get<K extends keyof HostServices>(name: K): HostServices[K];
  sessionPersistence: PersistenceCompat;
  emit(event: "api-session/removed", sessionId: string): void;
}
/** 已有插件使用的上游内部扩展点；集中声明并由宿主版本矩阵保护。 */
export interface WorkspaceCompat extends Omit<WorkspaceRegistry, "archiveSession" | "unarchiveSession"> {
  ctx: HostContext;
  host: { sessionPath(id: string): string | undefined };
  headers: Map<string, Header>; sessionPaths: Map<string, string>; invalidSessionPaths: Set<string>;
  entities: Map<string, { record: WorkspaceRow; attachSession(id: string): Promise<unknown> }>;
  requireTable(): KvTable<string, WorkspaceRow>;
  requireState(): WorkspaceState;
  setState(state: WorkspaceState): Promise<void>;
  enqueueOperation<T>(operation: () => Promise<T>): Promise<T>;
  readSessionHeader(id: string): Promise<Header>;
  sessionKnown(id: string): Promise<boolean>;
  indexHeader(header: Header): Promise<void>;
  indexHeaders(items: (Header | { header: Header })[]): Promise<void>;
}
export type WorkspaceConstructor = { new(ctx: Context): WorkspaceCompat };
