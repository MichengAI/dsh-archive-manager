import { record } from "./contracts.js";
import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, readdir, open, link, unlink, rename } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import * as zlib from "node:zlib";
import { classifySessionError } from "./archive-discovery.js";
const LIMIT = 32 * 1024 * 1024;
function decompressFrame(bytes, maxOutputLength) {
  const result = record(zlib.zstdDecompressSync(bytes, { info: true, maxOutputLength }));
  const engine = record(result.engine);
  if (!Buffer.isBuffer(result.buffer) || typeof engine.bytesWritten !== "number") throw new Error("\u538B\u7F29\u5E27\u8FD4\u56DE\u683C\u5F0F\u65E0\u6548");
  return { buffer: result.buffer, engine: { bytesWritten: engine.bytesWritten } };
}
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function decodeRepairLog(bytes, compressed) {
  if (bytes.length > LIMIT) throw new Error("\u65E5\u5FD7\u8D85\u8FC7 32 MB\uFF0C\u9700\u79BB\u7EBF\u5904\u7406");
  const chunks = [];
  let offset = 0, size = 0;
  if (compressed && typeof zlib.zstdDecompressSync !== "function") throw new Error("\u5F53\u524D Node.js \u4E0D\u652F\u6301\u538B\u7F29\u65E5\u5FD7\u8BCA\u65AD");
  while (compressed && offset < bytes.length) {
    const result = decompressFrame(bytes.subarray(offset), LIMIT - size);
    if (!result.engine.bytesWritten) throw new Error("\u538B\u7F29\u65E5\u5FD7\u6CA1\u6709\u5B8C\u6574\u5E27");
    offset += result.engine.bytesWritten;
    size += result.buffer.length;
    chunks.push(result.buffer);
    if (size > LIMIT) throw new Error("\u89E3\u538B\u65E5\u5FD7\u8D85\u8FC7 32 MB\uFF0C\u9700\u79BB\u7EBF\u5904\u7406");
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(compressed ? Buffer.concat(chunks) : bytes);
  if (!text.endsWith("\n")) throw new Error("\u65E5\u5FD7\u672B\u5C3E\u4E0D\u5B8C\u6574\uFF0C\u4E0D\u80FD\u81EA\u52A8\u4FEE\u590D");
  return text.trimEnd().split("\n").map((line) => record(JSON.parse(line)));
}
function pluginSource(plugin, extra = {}) {
  return { kind: "plugin", plugin, ...extra };
}
function assertKnownHintShape(source, kind) {
  if (Object.keys(source).some((key) => !["kind", "form"].includes(key)) || source.form !== "hint") throw new Error("\u65E7\u7248\u63D0\u793A\u6765\u6E90 " + kind + " \u5F62\u72B6\u672A\u77E5\uFF0C\u9700\u4EBA\u5DE5\u68C0\u67E5");
}
const LEGACY_SOURCE_RULES = [
  { kind: "automation", convert: (source) => pluginSource("dsh-automation", { form: "notice", summary: JSON.stringify(source) }) },
  // 早期工作区参考文档提示，现由 dsh-agent-instructions 承担。不保留 form:hint，v0 插件来源不接受该值。
  { kind: "instruction-hint", convert: (source) => {
    assertKnownHintShape(source, "instruction-hint");
    return pluginSource("agent-instructions");
  } },
  // 早期会话工作约定已被宿主移除，只保留归属，正文不动。
  { kind: "delivery-contract", convert: (source) => {
    assertKnownHintShape(source, "delivery-contract");
    return pluginSource("delivery-contract");
  } }
];
const LEGACY_SOURCE_RULES_BY_KIND = new Map(LEGACY_SOURCE_RULES.map((rule) => [rule.kind, rule]));
function normalizeAutomationSources(input) {
  const rows = structuredClone(input);
  let count = 0;
  const fix = (value) => {
    if (!value || typeof value !== "object") return;
    const message = record(value);
    const candidate = message.source;
    if (!candidate || typeof candidate !== "object") return;
    const source = record(candidate);
    const rule = typeof source.kind === "string" ? LEGACY_SOURCE_RULES_BY_KIND.get(source.kind) : void 0;
    if (!rule) return;
    if (rule.kind === "automation" && (Object.keys(source).some((key) => !["kind", "automationId", "runId", "scheduledFor"].includes(key)) || !["automationId", "runId", "scheduledFor"].every((key) => typeof source[key] === "string" && source[key].length > 0 && source[key].length < 512) || !Number.isFinite(Date.parse(String(source.scheduledFor))))) {
      throw new Error("\u81EA\u52A8\u5316\u5F52\u5C5E\u4FE1\u606F\u4E0D\u5B8C\u6574\u6216\u5B58\u5728\u672A\u77E5\u5B57\u6BB5\uFF0C\u9700\u4EBA\u5DE5\u68C0\u67E5");
    }
    message.source = rule.convert(source);
    count++;
  };
  for (const row of rows.slice(1)) {
    const data = row.data && typeof row.data === "object" ? record(row.data) : {};
    if (row.type === "user/message") fix(data);
    if (typeof row.type === "string" && ["assistant/message", "tool/result"].includes(row.type)) fix(data.message);
    if (row.type === "agent/inbox/spliced") Array.isArray(data.inserted) && data.inserted.forEach(fix);
    if (row.type === "session/title-llm-request") Array.isArray(data.messages) && data.messages.forEach(fix);
  }
  return { rows, count };
}
async function regularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMIT) throw new Error("\u5DE5\u4EF6\u4E0D\u662F\u53EF\u5B89\u5168\u5904\u7406\u7684\u5E38\u89C4\u65E5\u5FD7\u6587\u4EF6");
}
async function regularDirectory(directory) {
  let current = resolve(directory);
  while (true) {
    const parent = dirname(current);
    if (parent === current) return;
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error("\u4F1A\u8BDD\u76EE\u5F55\u5B58\u5728\u94FE\u63A5\u91CD\u5B9A\u5411\uFF0C\u9700\u4EBA\u5DE5\u5904\u7406");
    if (!stat.isDirectory()) throw new Error("\u4F1A\u8BDD\u8DEF\u5F84\u4E0D\u662F\u5E38\u89C4\u76EE\u5F55\uFF0C\u9700\u4EBA\u5DE5\u5904\u7406");
    current = parent;
  }
}
function childCatalogFact(header, events, inheritedEventCount) {
  if (typeof header.id !== "string" || header.id.length === 0) return;
  if (typeof header.createdAt !== "number" || !Number.isSafeInteger(header.createdAt) || header.createdAt < 0) return;
  if (!Number.isSafeInteger(inheritedEventCount) || inheritedEventCount < 0) return;
  const descriptors = events.filter((event) => event.type === "subagent/descriptor" && typeof event.seq === "number" && event.seq >= inheritedEventCount);
  return { childId: header.id, childCreatedAt: header.createdAt, descriptorCount: descriptors.length, descriptor: descriptors[0]?.data ?? null };
}
async function prepareAutomationRepair({ directory, target, sessionId, format }) {
  if (!format || !Number.isInteger(format.currentVersion) || format.currentVersion < 3 || typeof format.createRestore !== "function") throw new Error("\u5F53\u524D\u5BBF\u4E3B\u4E0D\u652F\u6301\u6B64\u4FEE\u590D\uFF0C\u8BF7\u5347\u7EA7 DSH \u540E\u91CD\u8BD5");
  await regularDirectory(directory);
  const names = (await readdir(directory)).filter((name) => /^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/.test(name));
  const sources = names.filter((name) => /^session\.jsonl(?:\.zstd)?$/.test(name));
  if (sources.length !== 1 || names.some((name) => name !== sources[0] && name !== basename(target))) throw new Error("\u53D1\u73B0\u591A\u4E2A\u6216\u975E\u65E7\u7248\u65E5\u5FD7\u5DE5\u4EF6\uFF0C\u8BF7\u5148\u68C0\u67E5\u4EE3\u9645\u72B6\u6001");
  const source = join(directory, sources[0]);
  await regularFile(source);
  const bytes = await readFile(source);
  const rows = decodeRepairLog(bytes, source.endsWith(".zstd"));
  if (rows[0]?.type !== "session" || rows[0]?.version !== 0 || rows[0]?.id !== sessionId) throw new Error("\u65E5\u5FD7\u8EAB\u4EFD\u6216\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u4E0D\u80FD\u81EA\u52A8\u4FEE\u590D");
  const normalized = normalizeAutomationSources(rows);
  if (!normalized.count) throw new Error("\u672A\u627E\u5230\u7B26\u5408\u4FEE\u590D\u89C4\u5219\u7684\u65E7\u7248\u6765\u6E90");
  const restore = format.createRestore(normalized.rows[0]);
  normalized.rows.slice(1).forEach((row) => restore.decodeRow(row));
  const artifact = restore.finish();
  const lines = [format.encodeHeader(artifact.header, artifact.inheritedEventCount), ...artifact.events.map((event) => format.encodeEvent(event))];
  const verify = format.createRestore(lines[0]);
  lines.slice(1).forEach((row) => verify.decodeRow(row));
  const checked = verify.finish();
  await format.validate?.(checked);
  if (checked.header.id !== sessionId || checked.events.length !== artifact.events.length || checked.inheritedEventCount !== artifact.inheritedEventCount) throw new Error("\u751F\u6210\u7269\u6821\u9A8C\u5931\u8D25");
  const plain = Buffer.from(lines.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  if (plain.length > LIMIT) throw new Error("\u4FEE\u590D\u7ED3\u679C\u8D85\u8FC7\u5904\u7406\u4E0A\u9650");
  const compress = (value) => zlib.zstdCompressSync(value, { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } });
  const headerBytes = Buffer.from(JSON.stringify(lines[0]) + "\n", "utf8");
  const output = target.endsWith(".zstd") ? Buffer.concat([compress(headerBytes), ...lines.length > 1 ? [compress(plain.subarray(headerBytes.length))] : []]) : plain;
  await format.validateBytes?.(output);
  let previousTarget;
  if (names.includes(basename(target))) {
    await regularFile(target);
    previousTarget = await readFile(target);
    if (!target.endsWith(".zstd")) throw new Error("\u5DF2\u6709\u65B0\u7248\u65E5\u5FD7\uFF0C\u4E0D\u80FD\u8986\u76D6");
    const first = decompressFrame(previousTarget, LIMIT);
    if (first.engine.bytesWritten !== previousTarget.length || !first.buffer.equals(plain) || first.buffer.indexOf(10) === first.buffer.length - 1) throw new Error("\u5DF2\u6709\u65E5\u5FD7\u4E0E\u65E7\u7248\u4FEE\u590D\u4EA7\u7269\u4E0D\u5339\u914D\uFF0C\u4E0D\u80FD\u8986\u76D6");
  }
  const token = digest(previousTarget ? Buffer.concat([bytes, previousTarget]) : bytes);
  const unchanged = async () => {
    if (digest(await readFile(source)) !== digest(bytes)) throw new Error("\u65E5\u5FD7\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u8BCA\u65AD");
    if (previousTarget) {
      await regularFile(target);
      if (digest(await readFile(target)) !== digest(previousTarget)) throw new Error("\u4FEE\u590D\u4EA7\u7269\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u8BCA\u65AD");
    }
  };
  return { token, correctingFrame: Boolean(previousTarget), count: normalized.count, source, async publish(expectedToken, ensureIdle) {
    if (expectedToken !== token) throw new Error("\u65E5\u5FD7\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u8BCA\u65AD");
    await ensureIdle();
    await regularFile(source);
    await unchanged();
    const temp = join(directory, ".archive-repair-" + randomUUID());
    let handle;
    try {
      handle = await open(temp, "wx", 384);
      await handle.writeFile(output);
      await handle.sync();
      await handle.close();
      handle = void 0;
      await ensureIdle();
      await unchanged();
      if (previousTarget) await rename(temp, target);
      else await link(temp, target);
    } finally {
      if (handle) await handle.close();
      await unlink(temp).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  } };
}
export {
  childCatalogFact,
  classifySessionError,
  decodeRepairLog,
  normalizeAutomationSources,
  prepareAutomationRepair
};
