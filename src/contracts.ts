/** 插件拥有的数据契约；宿主版本差异在适配层处理。 */
export type Translate = (key: string, values?: Record<string, unknown>) => string;
export interface Schema<T> { parse(value: unknown): T }
export interface Failure { sessionId: string; message: string }
export interface ConversationMessage {
  source?: { kind?: string };
  content?: string | { type: string; text?: string }[];
}
export interface ConversationEvent {
  type: string;
  seq: number;
  data?: ConversationMessage & { message?: ConversationMessage };
}
export interface TextMessage { seq: number; role: string; text: string }
export interface SearchHit { sessionId: string; seq: number; snippet: string }
export interface SearchResult { items: SearchHit[]; failures: Failure[] }
export interface SearchInput { sessionIds: string[]; query: string }
export interface SearchProgress extends SearchResult { done: number; total: number }
export interface SessionDetail { sessionId: string; createdAt?: number; turnCount: number | null; path: string | null; error: string; errorKey?: string }
export interface SessionSummary {
  id: string;
  title?: string;
  cwd?: string;
  updatedAt?: string | number;
  createdAt?: string | number;
  retainedBy?: { mainView?: number };
  running?: boolean;
  runningSubagentCount?: number;
  pendingInteraction?: unknown;
}
export interface SessionList { byId: Record<string, SessionSummary | undefined>; current?: string }
export interface Snapshot<T> { getSnapshot(): T }
export interface ArchiveState { archivedSessionIds: string[] }
export interface BatchProgress { total: number; done: number; succeeded: number; skipped: number; failed: number }
export interface BatchResult {
  requested: string[]; succeeded: string[]; skipped: string[];
  failures: Failure[]; unprocessed: string[]; remaining: string[]; refreshError: string | null;
}
export interface BatchOptions { onProgress?: (progress: BatchProgress) => void; refresh?: () => void | Promise<unknown> }
export interface OrganizeOptions extends BatchOptions {
  idleDays?: number; pending?: ReadonlyMap<string, unknown>; getPending?: () => ReadonlyMap<string, unknown>;
}
export type OrganizeKind = "archive" | "restore" | "undo" | "delete";
export interface OrganizerServices {
  workspaces: Snapshot<ArchiveState>; sessions: Snapshot<SessionList>;
  archive(id: string): Promise<unknown>; restore(id: string): Promise<ArchiveState | undefined>;
  deleteOne(id: string): Promise<unknown>; getFavorites(): Promise<{ favoriteSessionIds: string[] }>;
  refresh(): void | Promise<unknown>; currentSessionId(list: SessionList): string | undefined;
}

/** 所有外部对象先缩窄，避免 JSON.parse 或网络结果向业务层传播 any。 */
export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("参数必须为对象");
  return value as Record<string, unknown>;
}
export function errorMessage(error: unknown): string {
  return String(error && typeof error === "object" && "message" in error ? error.message ?? error : error);
}
export function errorCode(error: unknown): unknown {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}
