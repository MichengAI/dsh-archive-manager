import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, readdir, open, link, unlink, realpath, rename } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import * as zlib from 'node:zlib';
export { classifySessionError } from './archive-discovery.js';
const LIMIT = 32 * 1024 * 1024;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
/** 严格读取所有独立压缩帧；拒绝残缺末尾，避免把截断误当修复。 */
export function decodeRepairLog(bytes, compressed) {
  if (bytes.length > LIMIT) throw new Error('日志超过 32 MB，需离线处理');
  const chunks = []; let offset = 0, size = 0;
  if (compressed && typeof zlib.zstdDecompressSync !== 'function') throw new Error('当前 Node.js 不支持压缩日志诊断');
  while (compressed && offset < bytes.length) {
    const result = zlib.zstdDecompressSync(bytes.subarray(offset), { info: true, maxOutputLength: LIMIT - size });
    if (!result.engine.bytesWritten) throw new Error('压缩日志没有完整帧');
    offset += result.engine.bytesWritten; size += result.buffer.length; chunks.push(result.buffer);
    if (size > LIMIT) throw new Error('解压日志超过 32 MB，需离线处理');
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(compressed ? Buffer.concat(chunks) : bytes);
  if (!text.endsWith('\n')) throw new Error('日志末尾不完整，不能自动修复');
  return text.trimEnd().split('\n').map(line => JSON.parse(line));
}
/** 仅访问宿主定义的消息槽位，不递归改写正文或工具参数中的同名字段。 */
export function normalizeAutomationSources(input) {
  const rows = structuredClone(input); let count = 0;
  const fix = message => {
    const source = message?.source;
    if (source?.kind !== 'automation') return;
    if (Object.keys(source).some(key => !['kind','automationId','runId','scheduledFor'].includes(key)) ||
        !['automationId','runId','scheduledFor'].every(key => typeof source[key] === 'string' && source[key].length > 0 && source[key].length < 512) || !Number.isFinite(Date.parse(source.scheduledFor))) {
      throw new Error('自动化归属信息不完整或存在未知字段，需人工检查');
    }
    message.source = { kind: 'plugin', plugin: 'dsh-automation', form: 'notice', summary: JSON.stringify(source) }; count++;
  };
  for (const row of rows.slice(1)) {
    if (row.type === 'user/message') fix(row.data);
    if (['assistant/message','tool/result'].includes(row.type)) fix(row.data?.message);
    if (row.type === 'agent/inbox/spliced') row.data?.inserted?.forEach(fix);
    if (row.type === 'session/title-llm-request') row.data?.messages?.forEach(fix);
  }
  return { rows, count };
}
async function regularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMIT) throw new Error('工件不是可安全处理的常规日志文件');
}
/** 保留旧代际，只生成经宿主转换器校验的新代际；仅允许纠正内容完全匹配的旧版单帧错误产物。 */
export async function prepareAutomationRepair({ directory, target, sessionId, format }) {
  if (!format || format.currentVersion !== 3 || typeof format.createRestore !== 'function') throw new Error('当前宿主不支持此修复，请升级 DSH 后重试');
  if (resolve(await realpath(directory)).toLowerCase() !== resolve(directory).toLowerCase()) throw new Error('会话目录存在链接重定向，需人工处理');
  const names = (await readdir(directory)).filter(name => /^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/.test(name));
  const sources = names.filter(name => /^session\.jsonl(?:\.zstd)?$/.test(name));
  if (sources.length !== 1 || names.some(name => name !== sources[0] && name !== basename(target))) throw new Error('发现多个或非旧版日志工件，请先检查代际状态');
  const source = join(directory, sources[0]); await regularFile(source);
  const bytes = await readFile(source);
  const rows = decodeRepairLog(bytes, source.endsWith('.zstd'));
  if (rows[0]?.type !== 'session' || rows[0]?.version !== 0 || rows[0]?.id !== sessionId) throw new Error('日志身份或版本不匹配，不能自动修复');
  const normalized = normalizeAutomationSources(rows);
  if (!normalized.count) throw new Error('未找到符合修复规则的自动化来源');
  const restore = format.createRestore(normalized.rows[0]);
  normalized.rows.slice(1).forEach(row => restore.decodeRow(row));
  const artifact = restore.finish();
  const lines = [format.encodeHeader(artifact.header, artifact.inheritedEventCount), ...artifact.events.map(event => format.encodeEvent(event))];
  // 对生成物再次解码，防止编码后事件丢失或继承边界变化。
  const verify = format.createRestore(lines[0]); lines.slice(1).forEach(row => verify.decodeRow(row));
  const checked = verify.finish();
  await format.validate?.(checked);
  if (checked.header.id !== sessionId || checked.events.length !== artifact.events.length || checked.inheritedEventCount !== artifact.inheritedEventCount) throw new Error('生成物校验失败');
  const plain = Buffer.from(lines.map(row => JSON.stringify(row)).join('\n') + '\n', 'utf8');
  if (plain.length > LIMIT) throw new Error('修复结果超过处理上限');
  // 宿主要求第一帧恰好一行头部，后续帧才允许包含事件。
  const compress = value => zlib.zstdCompressSync(value, { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } });
  const headerBytes = Buffer.from(JSON.stringify(lines[0]) + '\n', 'utf8');
  const output = target.endsWith('.zstd') ? Buffer.concat([compress(headerBytes), ...(lines.length > 1 ? [compress(plain.subarray(headerBytes.length))] : [])]) : plain;
  await format.validateBytes?.(output);
  let previousTarget;
  if (names.includes(basename(target))) {
    await regularFile(target); previousTarget = await readFile(target);
    if (!target.endsWith('.zstd')) throw new Error('已有新版日志，不能覆盖');
    const first = zlib.zstdDecompressSync(previousTarget, { info: true, maxOutputLength: LIMIT });
    // 只纠正本插件旧实现产生的整文件单帧，且内容必须逐字匹配从原日志重新生成的结果。
    if (first.engine.bytesWritten !== previousTarget.length || !first.buffer.equals(plain) || first.buffer.indexOf(10) === first.buffer.length - 1) throw new Error('已有日志与旧版修复产物不匹配，不能覆盖');
  }
  const token = digest(previousTarget ? Buffer.concat([bytes, previousTarget]) : bytes);
  const unchanged = async () => {
    if (digest(await readFile(source)) !== digest(bytes)) throw new Error('日志已变化，请重新诊断');
    if (previousTarget) {
      await regularFile(target);
      if (digest(await readFile(target)) !== digest(previousTarget)) throw new Error('修复产物已变化，请重新诊断');
    }
  };
  return { token, correctingFrame: Boolean(previousTarget), count: normalized.count, source, async publish(expectedToken, ensureIdle) {
    if (expectedToken !== token) throw new Error('日志已变化，请重新诊断');
    await ensureIdle(); await regularFile(source);
    await unchanged();
    const temp = join(directory, '.archive-repair-' + randomUUID());
    let handle;
    try {
      handle = await open(temp, 'wx', 0o600); await handle.writeFile(output); await handle.sync(); await handle.close(); handle = undefined;
      await ensureIdle();
      await unchanged();
      // 调用方持有宿主跨进程写锁；仅已确认的错误产物可原子替换，正常代际仍禁止覆盖。
      if (previousTarget) await rename(temp, target); else await link(temp, target);
    } finally {
      if (handle) await handle.close();
      await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  }};
}
