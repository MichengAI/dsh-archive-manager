import { record } from "./contracts.js";
import type { Header } from "./host-compat.js";
export interface CacheCandidate { sessionId: string; identity: string }
export interface CacheDiagnosis { count: number; items: CacheCandidate[] }
export interface CacheRebuildResult { rebuiltSessionIds: string[]; skippedSessionIds: string[]; failures: { sessionId: string; message: string }[] }
/** 仅由不可变头部生成生命周期见证，客户端传值不能代替服务端权威校验。 */
export function cacheIdentity(header: Header): string {
  return JSON.stringify([header.version, header.createdAt, header.cwd ?? null, header.isSeeded]);
}
const candidate = (input: unknown): CacheCandidate => {
  const value = record(input);
  if (!value || typeof value.sessionId !== "string" || !value.sessionId.length || value.sessionId.length > 1024 || typeof value.identity !== "string" || !value.identity.length || value.identity.length > 4096) throw new TypeError("invalid cache rebuild candidate");
  return { sessionId: value.sessionId, identity: value.identity };
};
export const cacheRebuildInput = { parse(input: unknown) {
  const value = record(input);
  if (!value || !Array.isArray(value.items) || !value.items.length || value.items.length > 20) throw new TypeError("invalid cache rebuild batch (1–20 items required)");
  return { items: value.items.map(candidate) };
} };
export const cacheDiagnosisSchema = { parse(input: unknown): CacheDiagnosis {
  const value = record(input);
  if (!value || !Array.isArray(value.items) || value.count !== value.items.length) throw new TypeError("invalid cache diagnosis");
  return { count: value.items.length, items: value.items.map(candidate) };
} };
export const cacheRebuildSchema = { parse(input: unknown): CacheRebuildResult {
  const value = record(input);
  for (const key of ["rebuiltSessionIds", "skippedSessionIds"]) if (!Array.isArray(value?.[key]) || (value[key] as unknown[]).some(id => typeof id !== "string")) throw new TypeError("invalid cache rebuild result");
  if (!Array.isArray(value.failures) || value.failures.some(f => !f || typeof f.sessionId !== "string" || typeof f.message !== "string")) throw new TypeError("invalid cache rebuild failures");
  return value as unknown as CacheRebuildResult;
} };
export function cacheRebuildInvocations() {
  const codec = (name: string, schema: object) => ({ mode: "strict", typeSymbol: `@michengai/dsh-archive-manager/types#${name}`, create: () => schema, schema });
  return [
    { method: "diagnoseSessionCaches", parameters: [], result: codec("CacheDiagnosis", cacheDiagnosisSchema) },
    { method: "rebuildSessionCaches", parameters: [{ name: "input", wire: "input", source: "json", codec: codec("CacheRebuildInput", cacheRebuildInput) }], result: codec("CacheRebuildResult", cacheRebuildSchema) },
  ].map(({ method, ...rest }) => ({ id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`, service: "workspaceRegistry", namespace: "workspaceRegistry", method, invocation: { kind: "direct" }, ...rest, sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 } }));
}
