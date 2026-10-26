import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, normalize, resolve } from "node:path";
import zlib from "node:zlib";
const ZSTD_MAGIC = 4247762216;
const CHECKSUM_OPTS = { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } };
function normalizePath(p) {
  if (typeof p !== "string" || p.trim() === "") return void 0;
  const norm = normalize(resolve(p)).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? norm.toLowerCase() : norm;
}
function scanFirstZstdFrame(buf) {
  if (buf.length < 4) throw new Error("\u4F1A\u8BDD\u5DE5\u4EF6\u6570\u636E\u8FC7\u77ED\uFF0C\u65E0\u6CD5\u8BFB\u53D6 zstd \u5934\u90E8");
  if (buf.readUInt32LE(0) !== ZSTD_MAGIC) throw new Error("\u4F1A\u8BDD\u5DE5\u4EF6\u4E0D\u662F\u5408\u6CD5\u7684 zstd \u683C\u5F0F");
  let offset = 4;
  if (offset >= buf.length) throw new Error("\u4F1A\u8BDD\u5DE5\u4EF6 zstd \u5E27\u4E0D\u5B8C\u6574");
  const descriptor = buf.readUInt8(offset++);
  if ((descriptor & 24) !== 0) throw new Error("zstd \u5E27\u5305\u542B\u4FDD\u7559\u4F4D");
  const contentSizeFlag = descriptor >>> 6;
  const singleSegment = (descriptor & 32) !== 0;
  const checksum = (descriptor & 4) !== 0;
  const dictionaryFlag = descriptor & 3;
  const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
  const contentSizeBytes = contentSizeFlag === 0 ? singleSegment ? 1 : 0 : 1 << contentSizeFlag;
  const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
  if (buf.length - offset < remainingHeaderBytes) throw new Error("zstd \u5934\u90E8\u88AB\u622A\u65AD");
  offset += remainingHeaderBytes;
  for (; ; ) {
    if (buf.length - offset < 3) throw new Error("zstd \u5757\u7ED3\u6784\u622A\u65AD");
    const blockHeader = buf.readUIntLE(offset, 3);
    offset += 3;
    const lastBlock = (blockHeader & 1) !== 0;
    const blockType = blockHeader >>> 1 & 3;
    const blockSize = blockHeader >>> 3;
    if (blockType === 3) throw new Error("zstd \u5305\u542B\u672A\u77E5\u4FDD\u7559\u5757\u7C7B\u578B");
    const payloadBytes = blockType === 1 ? 1 : blockSize;
    if (buf.length - offset < payloadBytes) throw new Error("zstd \u5757\u8D1F\u8F7D\u88AB\u622A\u65AD");
    offset += payloadBytes;
    if (lastBlock) break;
  }
  if (checksum) {
    if (buf.length - offset < 4) throw new Error("zstd \u6821\u9A8C\u548C\u88AB\u622A\u65AD");
    offset += 4;
  }
  return { start: 0, end: offset };
}
function rewriteSessionArtifactCwd(sourceBuffer, targetCwd, isZstd) {
  if (isZstd) {
    const frame0Boundary = scanFirstZstdFrame(sourceBuffer);
    const frame0Bytes = sourceBuffer.subarray(0, frame0Boundary.end);
    const decompressedHeader = zlib.zstdDecompressSync(frame0Bytes).toString("utf8");
    const nlIndex = decompressedHeader.indexOf("\n");
    const headerLine = nlIndex >= 0 ? decompressedHeader.slice(0, nlIndex) : decompressedHeader;
    const headerObj = JSON.parse(headerLine);
    headerObj.cwd = targetCwd;
    const newFrame0 = zlib.zstdCompressSync(Buffer.from(JSON.stringify(headerObj) + "\n", "utf8"), CHECKSUM_OPTS);
    const rest = sourceBuffer.subarray(frame0Boundary.end);
    return Buffer.concat([newFrame0, rest]);
  } else {
    const text = sourceBuffer.toString("utf8");
    const nlIndex = text.indexOf("\n");
    const headerLine = nlIndex >= 0 ? text.slice(0, nlIndex) : text;
    const headerObj = JSON.parse(headerLine);
    headerObj.cwd = targetCwd;
    const rest = nlIndex >= 0 ? text.slice(nlIndex + 1) : "";
    return Buffer.from(JSON.stringify(headerObj) + "\n" + rest, "utf8");
  }
}
async function moveSessionToWorkspace(ctx, sessionId, targetWorkspaceId) {
  if (typeof sessionId !== "string" || sessionId.trim() === "") {
    throw new TypeError("sessionId \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32");
  }
  if (typeof targetWorkspaceId !== "string" || targetWorkspaceId.trim() === "") {
    throw new TypeError("targetWorkspaceId \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32");
  }
  const cleanSessionId = sessionId.trim();
  const cleanTargetWsId = targetWorkspaceId.trim();
  const registry = ctx.workspaceRegistry;
  if (!registry || typeof registry.list !== "function") {
    throw new Error("\u5DE5\u4F5C\u533A\u6CE8\u518C\u8868\u670D\u52A1\u4E0D\u53EF\u7528");
  }
  const targetWorkspace = registry.list().find((w) => w.id === cleanTargetWsId);
  if (!targetWorkspace) {
    throw new Error(`\u76EE\u6807\u5DE5\u4F5C\u533A\u4E0D\u5B58\u5728: ${cleanTargetWsId}`);
  }
  const targetPath = targetWorkspace.path;
  const liveSession = ctx.sessions?.get?.(cleanSessionId);
  if (liveSession !== void 0) {
    throw new Error("\u8BE5\u4F1A\u8BDD\u6B63\u5904\u4E8E\u6253\u5F00\u6216\u8FD0\u884C\u72B6\u6001\uFF0C\u8BF7\u5173\u95ED\u4F1A\u8BDD\u540E\u518D\u79FB\u52A8\u3002");
  }
  const persistence = ctx.sessionPersistence;
  if (persistence && typeof persistence.open === "function") {
    let testHandle = null;
    try {
      testHandle = await persistence.open(cleanSessionId, "write");
    } catch (error) {
      const msg = String(error instanceof Error ? error.message : error);
      if (/already owned/i.test(msg) || /SessionAlreadyOwnedError/i.test(msg)) {
        throw new Error("\u4F1A\u8BDD\u6B63\u88AB DSH \u6253\u5F00\uFF0C\u6682\u65F6\u65E0\u6CD5\u79FB\u52A8\uFF1B\u8BF7\u5173\u95ED\u4F1A\u8BDD\u540E\u518D\u8BD5\u3002");
      }
    } finally {
      if (testHandle && typeof testHandle.close === "function") {
        await testHandle.close().catch(() => {
        });
      }
    }
  }
  let header;
  if (typeof registry.readSessionHeader === "function") {
    header = await registry.readSessionHeader(cleanSessionId);
  }
  if (!header && persistence && typeof persistence.stat === "function") {
    header = (await persistence.stat(cleanSessionId))?.header;
  }
  if (!header && persistence && typeof persistence.open === "function") {
    try {
      const readHandle = await persistence.open(cleanSessionId, "read");
      header = readHandle.header;
      await readHandle.close();
    } catch {
    }
  }
  if (!header) {
    throw new Error(`\u65E0\u6CD5\u83B7\u53D6\u4F1A\u8BDD ${cleanSessionId} \u7684\u5143\u6570\u636E\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002`);
  }
  if (header.origin === "subagent") {
    throw new Error("\u5B50\u4EE3\u7406\uFF08subagent\uFF09\u4F1A\u8BDD\u4E0D\u652F\u6301\u8DE8\u5DE5\u4F5C\u533A\u79FB\u52A8\u3002");
  }
  const currentNormalizedCwd = normalizePath(header.cwd);
  const targetNormalizedCwd = normalizePath(targetPath);
  if (currentNormalizedCwd && targetNormalizedCwd && currentNormalizedCwd === targetNormalizedCwd) {
    for (const ws of registry.list()) {
      if (ws.id !== targetWorkspace.id && Array.isArray(ws.sessionIds) && ws.sessionIds.includes(cleanSessionId)) {
        await ws.detachSession(cleanSessionId);
      }
    }
    await targetWorkspace.attachSession(cleanSessionId);
    registry.sessionPaths?.set(cleanSessionId, targetPath);
    if (ctx.sessionProjectionCache && typeof ctx.sessionProjectionCache.coldSnapshot === "function") {
      await ctx.sessionProjectionCache.coldSnapshot(cleanSessionId).catch(() => {
      });
    }
    return {
      ok: true,
      moved: true,
      alreadyCwd: true,
      sessionId: cleanSessionId,
      toWorkspaceId: cleanTargetWsId,
      toWorkspaceTitle: targetWorkspace.title || cleanTargetWsId,
      toWorkspacePath: targetPath
    };
  }
  if (!persistence || typeof persistence.locate !== "function") {
    throw new Error("\u5F53\u524D\u6301\u4E45\u5316\u540E\u7AEF\u4E0D\u652F\u6301\u7269\u7406\u5B9A\u4F4D\uFF0C\u65E0\u6CD5\u8DE8\u5DE5\u4F5C\u533A\u79FB\u52A8\u4F1A\u8BDD\u3002");
  }
  const sourceLoc = persistence.locate({ id: cleanSessionId, cwd: header.cwd });
  const targetLoc = persistence.locate({ id: cleanSessionId, cwd: targetPath });
  if (!sourceLoc || !targetLoc || !sourceLoc.path || !targetLoc.path) {
    throw new Error("\u6301\u4E45\u5316\u540E\u7AEF\u65E0\u6CD5\u5B9A\u4F4D\u4F1A\u8BDD\u5DE5\u4EF6\u8DEF\u5F84\u3002");
  }
  const sourceLogPath = sourceLoc.path;
  const targetLogPath = targetLoc.path;
  const sourceSessionDir = dirname(sourceLogPath);
  const targetSessionDir = dirname(targetLogPath);
  let targetOccupied = false;
  try {
    await stat(targetLogPath);
    targetOccupied = true;
  } catch {
  }
  if (targetOccupied) {
    throw new Error(`\u76EE\u6807\u5DE5\u4F5C\u533A\u5DF2\u5B58\u5728\u540C\u540D\u4F1A\u8BDD\u5DE5\u4EF6\uFF0C\u62D2\u7EDD\u8986\u76D6: ${targetLogPath}`);
  }
  const persistenceRoot = persistence.root ?? persistence.config?.root;
  const backupRoot = persistenceRoot ? join(dirname(resolve(persistenceRoot)), "dsham-move-backup") : join(dirname(sourceSessionDir), ".dsham-move-backup");
  await mkdir(backupRoot, { recursive: true });
  const backupDir = join(backupRoot, `${cleanSessionId}-${process.pid}-${Date.now()}`);
  const isZstd = sourceLogPath.endsWith(".zstd");
  const sourceBytes = await readFile(sourceLogPath);
  const newBytes = rewriteSessionArtifactCwd(sourceBytes, targetPath, isZstd);
  if (isZstd) {
    const f0 = zlib.zstdDecompressSync(newBytes);
    const f0Obj = JSON.parse(f0.toString("utf8").split("\n")[0]);
    if (f0Obj.id !== cleanSessionId || f0Obj.cwd !== targetPath) {
      throw new Error("\u8FC1\u79FB\u524D\u6821\u9A8C\u5931\u8D25\uFF1A\u6570\u636E\u6539\u5199\u9A8C\u8BC1\u672A\u901A\u8FC7\u3002");
    }
  }
  const detachedWorkspaces = [];
  let targetAttached = false;
  let stageFile = null;
  try {
    await rename(sourceSessionDir, backupDir);
    await mkdir(targetSessionDir, { recursive: true });
    stageFile = join(targetSessionDir, `.stage-${process.pid}-${Date.now()}`);
    await writeFile(stageFile, newBytes);
    await rename(stageFile, targetLogPath);
    stageFile = null;
    const readbackBytes = await readFile(targetLogPath);
    if (readbackBytes.length === 0) throw new Error("\u76EE\u6807\u5199\u5165\u5DE5\u4EF6\u4E3A\u7A7A");
    for (const ws of registry.list()) {
      if (ws.id !== targetWorkspace.id && Array.isArray(ws.sessionIds) && ws.sessionIds.includes(cleanSessionId)) {
        await ws.detachSession(cleanSessionId);
        detachedWorkspaces.push(ws);
      }
    }
    await targetWorkspace.attachSession(cleanSessionId);
    targetAttached = true;
    registry.sessionPaths?.set(cleanSessionId, targetPath);
    registry.headers?.set(cleanSessionId, { ...header, cwd: targetPath });
    registry.invalidSessionPaths?.delete(cleanSessionId);
    if (ctx.sessionProjectionCache && typeof ctx.sessionProjectionCache.coldSnapshot === "function") {
      await ctx.sessionProjectionCache.coldSnapshot(cleanSessionId).catch((err) => {
        ctx.logger?.warn?.(`archive-manager: post-move coldSnapshot failed: ${String(err)}`);
      });
    }
  } catch (error) {
    if (stageFile) await rm(stageFile, { force: true }).catch(() => {
    });
    await rm(targetSessionDir, { recursive: true, force: true }).catch(() => {
    });
    try {
      await mkdir(dirname(sourceSessionDir), { recursive: true });
      await rename(backupDir, sourceSessionDir);
    } catch (restoreErr) {
      throw new AggregateError([error, restoreErr], `\u79FB\u52A8\u5931\u8D25\u4E14\u539F\u5DE5\u4EF6\u56DE\u6EDA\u5F02\u5E38\uFF0C\u5907\u4EFD\u6682\u5B58\u4E8E: ${backupDir}`);
    }
    if (targetAttached) {
      await targetWorkspace.detachSession(cleanSessionId).catch(() => {
      });
    }
    for (const ws of detachedWorkspaces) {
      await ws.attachSession(cleanSessionId).catch(() => {
      });
    }
    throw error;
  }
  await rm(backupDir, { recursive: true, force: true }).catch(() => {
  });
  return {
    ok: true,
    moved: true,
    alreadyCwd: false,
    sessionId: cleanSessionId,
    toWorkspaceId: cleanTargetWsId,
    toWorkspaceTitle: targetWorkspace.title || cleanTargetWsId,
    toWorkspacePath: targetPath
  };
}
export {
  moveSessionToWorkspace,
  rewriteSessionArtifactCwd
};
