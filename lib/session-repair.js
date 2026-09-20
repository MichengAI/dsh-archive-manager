import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, readdir, open, link, unlink, realpath, rename } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import * as zlib from "node:zlib";
import { classifySessionError } from "./archive-discovery.js";
const LIMIT = 32 * 1024 * 1024;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function decodeRepairLog(bytes, compressed) {
  if (bytes.length > LIMIT) throw new Error("\u65E5\u5FD7\u8D85\u8FC7 32 MB\uFF0C\u9700\u79BB\u7EBF\u5904\u7406");
  const chunks = [];
  let offset = 0, size = 0;
  if (compressed && typeof zlib.zstdDecompressSync !== "function") throw new Error("\u5F53\u524D Node.js \u4E0D\u652F\u6301\u538B\u7F29\u65E5\u5FD7\u8BCA\u65AD");
  while (compressed && offset < bytes.length) {
    const result = zlib.zstdDecompressSync(bytes.subarray(offset), { info: true, maxOutputLength: LIMIT - size });
    if (!result.engine.bytesWritten) throw new Error("\u538B\u7F29\u65E5\u5FD7\u6CA1\u6709\u5B8C\u6574\u5E27");
    offset += result.engine.bytesWritten;
    size += result.buffer.length;
    chunks.push(result.buffer);
    if (size > LIMIT) throw new Error("\u89E3\u538B\u65E5\u5FD7\u8D85\u8FC7 32 MB\uFF0C\u9700\u79BB\u7EBF\u5904\u7406");
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(compressed ? Buffer.concat(chunks) : bytes);
  if (!text.endsWith("\n")) throw new Error("\u65E5\u5FD7\u672B\u5C3E\u4E0D\u5B8C\u6574\uFF0C\u4E0D\u80FD\u81EA\u52A8\u4FEE\u590D");
  return text.trimEnd().split("\n").map((line) => JSON.parse(line));
}
function normalizeAutomationSources(input) {
  const rows = structuredClone(input);
  let count = 0;
  const fix = (message) => {
    const source = message?.source;
    if (source?.kind !== "automation") return;
    if (Object.keys(source).some((key) => !["kind", "automationId", "runId", "scheduledFor"].includes(key)) || !["automationId", "runId", "scheduledFor"].every((key) => typeof source[key] === "string" && source[key].length > 0 && source[key].length < 512) || !Number.isFinite(Date.parse(source.scheduledFor))) {
      throw new Error("\u81EA\u52A8\u5316\u5F52\u5C5E\u4FE1\u606F\u4E0D\u5B8C\u6574\u6216\u5B58\u5728\u672A\u77E5\u5B57\u6BB5\uFF0C\u9700\u4EBA\u5DE5\u68C0\u67E5");
    }
    message.source = { kind: "plugin", plugin: "dsh-automation", form: "notice", summary: JSON.stringify(source) };
    count++;
  };
  for (const row of rows.slice(1)) {
    if (row.type === "user/message") fix(row.data);
    if (["assistant/message", "tool/result"].includes(row.type)) fix(row.data?.message);
    if (row.type === "agent/inbox/spliced") row.data?.inserted?.forEach(fix);
    if (row.type === "session/title-llm-request") row.data?.messages?.forEach(fix);
  }
  return { rows, count };
}
async function regularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMIT) throw new Error("\u5DE5\u4EF6\u4E0D\u662F\u53EF\u5B89\u5168\u5904\u7406\u7684\u5E38\u89C4\u65E5\u5FD7\u6587\u4EF6");
}
async function prepareAutomationRepair({ directory, target, sessionId, format }) {
  if (!format || format.currentVersion !== 3 || typeof format.createRestore !== "function") throw new Error("\u5F53\u524D\u5BBF\u4E3B\u4E0D\u652F\u6301\u6B64\u4FEE\u590D\uFF0C\u8BF7\u5347\u7EA7 DSH \u540E\u91CD\u8BD5");
  if (resolve(await realpath(directory)).toLowerCase() !== resolve(directory).toLowerCase()) throw new Error("\u4F1A\u8BDD\u76EE\u5F55\u5B58\u5728\u94FE\u63A5\u91CD\u5B9A\u5411\uFF0C\u9700\u4EBA\u5DE5\u5904\u7406");
  const names = (await readdir(directory)).filter((name) => /^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/.test(name));
  const sources = names.filter((name) => /^session\.jsonl(?:\.zstd)?$/.test(name));
  if (sources.length !== 1 || names.some((name) => name !== sources[0] && name !== basename(target))) throw new Error("\u53D1\u73B0\u591A\u4E2A\u6216\u975E\u65E7\u7248\u65E5\u5FD7\u5DE5\u4EF6\uFF0C\u8BF7\u5148\u68C0\u67E5\u4EE3\u9645\u72B6\u6001");
  const source = join(directory, sources[0]);
  await regularFile(source);
  const bytes = await readFile(source);
  const rows = decodeRepairLog(bytes, source.endsWith(".zstd"));
  if (rows[0]?.type !== "session" || rows[0]?.version !== 0 || rows[0]?.id !== sessionId) throw new Error("\u65E5\u5FD7\u8EAB\u4EFD\u6216\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u4E0D\u80FD\u81EA\u52A8\u4FEE\u590D");
  const normalized = normalizeAutomationSources(rows);
  if (!normalized.count) throw new Error("\u672A\u627E\u5230\u7B26\u5408\u4FEE\u590D\u89C4\u5219\u7684\u81EA\u52A8\u5316\u6765\u6E90");
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
    const first = zlib.zstdDecompressSync(previousTarget, { info: true, maxOutputLength: LIMIT });
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
      handle = await open(temp, "wx");
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
  classifySessionError,
  decodeRepairLog,
  normalizeAutomationSources,
  prepareAutomationRepair
};
