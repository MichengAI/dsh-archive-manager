import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, normalize, resolve } from "node:path";
import zlib from "node:zlib";

const ZSTD_MAGIC = 0xfd2fb528;
const CHECKSUM_OPTS = { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } };

export interface SessionMoveResult {
	ok: boolean;
	moved: boolean;
	alreadyCwd?: boolean;
	sessionId: string;
	toWorkspaceId: string;
	toWorkspaceTitle?: string;
	toWorkspacePath?: string;
	message?: string;
}

export interface WorkspaceEntityLike {
	id: string;
	title?: string;
	path: string;
	sessionIds: string[];
	attachSession(sessionId: string): Promise<void>;
	detachSession(sessionId: string): Promise<void>;
}

export interface SessionMoveContext {
	workspaceRegistry?: {
		list(): WorkspaceEntityLike[];
		readSessionHeader?(id: string): Promise<{ id?: string; cwd?: string; origin?: string; version?: number } | undefined>;
		sessionPaths?: Map<string, string>;
		headers?: Map<string, unknown>;
		invalidSessionPaths?: Map<string, unknown>;
	};
	sessionPersistence?: {
		name?: string;
		root?: string;
		config?: { root?: string };
		prepare?(sessionId: string): Promise<{ session?: unknown } | undefined>;
		stat?(id: string): Promise<{ header?: { id?: string; cwd?: string; origin?: string; version?: number } } | undefined>;
		open?(id: string, access: "read" | "write"): Promise<{
			header?: { id?: string; cwd?: string; origin?: string; version?: number };
			read?(offset: number): Promise<{ events: unknown[] }>;
			close(): Promise<void>;
		}>;
		locate?(header: { id: string; cwd?: string }): { kind: string; path: string } | undefined;
	};
	sessionProjectionCache?: {
		coldSnapshot?(sessionId: string): Promise<unknown>;
	};
	sessions?: {
		get?(sessionId: string): unknown;
		flush?(session: unknown): Promise<void>;
		enter?(session: unknown): () => void;
		announce?(session: unknown): void;
		prepare?(sessionId: string, options: unknown): { session?: unknown } | unknown;
		store?: Map<string, { detach?(): void; session?: unknown }>;
	};
	agents?: {
		get?(sessionId: string): {
			status?: string;
			busy?: boolean;
			scope?: { dispose?(): Promise<void> | void };
			cancel?(options?: { kind?: string }): void;
			whenIdle?(): Promise<void>;
		};
		store?: Map<string, unknown>;
	};
	logger?: {
		info?(msg: string): void;
		warn?(msg: string, ...args: unknown[]): void;
		error?(msg: string, ...args: unknown[]): void;
	};
}

function normalizePath(p: string | undefined): string | undefined {
	if (typeof p !== "string" || p.trim() === "") return undefined;
	const norm = normalize(resolve(p)).replace(/[\\/]+$/, "");
	return process.platform === "win32" ? norm.toLowerCase() : norm;
}

/**
 * 解析并定位多帧 zstd 压缩的第一个 frame（Header 帧）边界。
 */
function scanFirstZstdFrame(buf: Buffer): { start: number; end: number } {
	if (buf.length < 4) throw new Error("会话工件数据过短，无法读取 zstd 头部");
	if (buf.readUInt32LE(0) !== ZSTD_MAGIC) throw new Error("会话工件不是合法的 zstd 格式");
	let offset = 4;
	if (offset >= buf.length) throw new Error("会话工件 zstd 帧不完整");
	const descriptor = buf.readUInt8(offset++);
	if ((descriptor & 0x18) !== 0) throw new Error("zstd 帧包含保留位");
	const contentSizeFlag = descriptor >>> 6;
	const singleSegment = (descriptor & 0x20) !== 0;
	const checksum = (descriptor & 0x04) !== 0;
	const dictionaryFlag = descriptor & 0x03;
	const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
	const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag;
	const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
	if (buf.length - offset < remainingHeaderBytes) throw new Error("zstd 头部被截断");
	offset += remainingHeaderBytes;

	for (;;) {
		if (buf.length - offset < 3) throw new Error("zstd 块结构截断");
		const blockHeader = buf.readUIntLE(offset, 3);
		offset += 3;
		const lastBlock = (blockHeader & 1) !== 0;
		const blockType = (blockHeader >>> 1) & 0x03;
		const blockSize = blockHeader >>> 3;
		if (blockType === 0x03) throw new Error("zstd 包含未知保留块类型");
		const payloadBytes = blockType === 0x01 ? 1 : blockSize;
		if (buf.length - offset < payloadBytes) throw new Error("zstd 块负载被截断");
		offset += payloadBytes;
		if (lastBlock) break;
	}
	if (checksum) {
		if (buf.length - offset < 4) throw new Error("zstd 校验和被截断");
		offset += 4;
	}
	return { start: 0, end: offset };
}

/**
 * 内存中非破坏性改写会话工件的首行 cwd。
 * 针对 zstd 文件仅重压缩第一帧，后续所有历史事件块保持 100% 逐字节不变；
 * 针对纯文本 jsonl 文件仅重写首行。
 */
export function rewriteSessionArtifactCwd(sourceBuffer: Buffer, targetCwd: string, isZstd: boolean): Buffer {
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

/**
 * 安全跨工作区会话迁移核心流程。
 * 包含生命周期准入检查、影子写入、回读校验、原子切换、工作区记账同步与冷缓存自愈。
 */
export async function moveSessionToWorkspace(
	ctx: SessionMoveContext,
	sessionId: string,
	targetWorkspaceId: string
): Promise<SessionMoveResult> {
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		throw new TypeError("sessionId 必须是非空字符串");
	}
	if (typeof targetWorkspaceId !== "string" || targetWorkspaceId.trim() === "") {
		throw new TypeError("targetWorkspaceId 必须是非空字符串");
	}
	const cleanSessionId = sessionId.trim();
	const cleanTargetWsId = targetWorkspaceId.trim();

	const registry = ctx.workspaceRegistry;
	if (!registry || typeof registry.list !== "function") {
		throw new Error("工作区注册表服务不可用");
	}
	const targetWorkspace = registry.list().find((w) => w.id === cleanTargetWsId || (w as { workspaceId?: string }).workspaceId === cleanTargetWsId || w.path === cleanTargetWsId);
	if (!targetWorkspace) {
		throw new Error(`目标工作区不存在: ${cleanTargetWsId}`);
	}
	const targetPath = targetWorkspace.path;

	// 1. 活跃状态检查与静默停靠（Quiesce）
	const liveSession = ctx.sessions?.get?.(cleanSessionId) as {
		running?: boolean;
		status?: string;
	} | undefined;

	const agent = ctx.agents?.get?.(cleanSessionId);

	const isExecuting = liveSession?.running === true ||
		liveSession?.status === "running" ||
		liveSession?.status === "ongoing" ||
		agent?.busy === true ||
		agent?.status === "running";

	if (isExecuting) {
		throw new Error("该会话正处于执行或运行状态，请等待完成后再移动。");
	}

	// 若处于打开空闲态，先刷新缓冲并安全释放原有 entry，释放写所有权
	let originalEntry: { detach?(): void } | undefined;
	if (liveSession !== undefined) {
		if (typeof agent?.cancel === "function") {
			try {
				agent.cancel({ kind: "disposed" });
				await agent.whenIdle?.();
			} catch {}
		}
		if (typeof ctx.sessions?.flush === "function") {
			try {
				await ctx.sessions.flush(liveSession);
			} catch {}
		}
		try {
			await agent?.scope?.dispose?.();
			ctx.agents?.store?.delete(cleanSessionId);
		} catch {}

		originalEntry = ctx.sessions?.store?.get?.(cleanSessionId)
			?? (typeof (ctx.sessions as unknown as { liveEntryFor?: (s: unknown) => unknown })?.liveEntryFor === "function" ? (() => {
				try { return (ctx.sessions as unknown as { liveEntryFor: (s: unknown) => unknown }).liveEntryFor(liveSession) as { detach?(): void }; } catch { return undefined; }
			})() : undefined);
		if (typeof originalEntry?.detach === "function") {
			try {
				originalEntry.detach();
			} catch {}
		}
	}

	// 2. 读取会话 Header 并校验
	const persistence = ctx.sessionPersistence;
	let header: { id?: string; cwd?: string; origin?: string; version?: number } | undefined;
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
		} catch {}
	}
	if (!header) {
		throw new Error(`无法获取会话 ${cleanSessionId} 的元数据，请刷新后重试。`);
	}

	// 子代理禁止单独跨工作区移动
	if (header.origin === "subagent") {
		throw new Error("子代理（subagent）会话不支持跨工作区移动。");
	}

	const currentNormalizedCwd = normalizePath(header.cwd);
	const targetNormalizedCwd = normalizePath(targetPath);

	// 4. 路径比对：若 cwd 相同，仅需调整工作区记账，无需改动物理文件
	if (currentNormalizedCwd && targetNormalizedCwd && currentNormalizedCwd === targetNormalizedCwd) {
		for (const ws of registry.list()) {
			if (ws.id !== targetWorkspace.id && Array.isArray(ws.sessionIds) && ws.sessionIds.includes(cleanSessionId)) {
				await ws.detachSession(cleanSessionId);
			}
		}
		await targetWorkspace.attachSession(cleanSessionId);
		registry.sessionPaths?.set(cleanSessionId, targetPath);
		if (ctx.sessionProjectionCache && typeof ctx.sessionProjectionCache.coldSnapshot === "function") {
			await ctx.sessionProjectionCache.coldSnapshot(cleanSessionId).catch(() => {});
		}
		return {
			ok: true,
			moved: true,
			alreadyCwd: true,
			sessionId: cleanSessionId,
			toWorkspaceId: cleanTargetWsId,
			toWorkspaceTitle: targetWorkspace.title || cleanTargetWsId,
			toWorkspacePath: targetPath,
		};
	}

	// 5. 跨工作区物理迁移
	if (!persistence || typeof persistence.locate !== "function") {
		throw new Error("当前持久化后端不支持物理定位，无法跨工作区移动会话。");
	}

	const sourceLoc = persistence.locate({ id: cleanSessionId, cwd: header.cwd });
	const targetLoc = persistence.locate({ id: cleanSessionId, cwd: targetPath });
	if (!sourceLoc || !targetLoc || !sourceLoc.path || !targetLoc.path) {
		throw new Error("持久化后端无法定位会话工件路径。");
	}
	const sourceLogPath = sourceLoc.path;
	const targetLogPath = targetLoc.path;
	const sourceSessionDir = dirname(sourceLogPath);
	const targetSessionDir = dirname(targetLogPath);

	// 检查目标位置是否已存在同名冲突工件
	let targetOccupied = false;
	try {
		await stat(targetLogPath);
		targetOccupied = true;
	} catch {}
	if (targetOccupied) {
		throw new Error(`目标工作区已存在同名会话工件，拒绝覆盖: ${targetLogPath}`);
	}

	const persistenceRoot = persistence.root ?? persistence.config?.root;
	const backupRoot = persistenceRoot
		? join(dirname(resolve(persistenceRoot)), "dsham-move-backup")
		: join(dirname(sourceSessionDir), ".dsham-move-backup");
	await mkdir(backupRoot, { recursive: true });
	const backupDir = join(backupRoot, `${cleanSessionId}-${process.pid}-${Date.now()}`);

	const isZstd = sourceLogPath.endsWith(".zstd");
	const sourceBytes = await readFile(sourceLogPath);
	const newBytes = rewriteSessionArtifactCwd(sourceBytes, targetPath, isZstd);

	// 验证改写后的新数据第一行是否正确
	if (isZstd) {
		const f0 = zlib.zstdDecompressSync(newBytes);
		const f0Obj = JSON.parse(f0.toString("utf8").split("\n")[0]);
		if (f0Obj.id !== cleanSessionId || f0Obj.cwd !== targetPath) {
			throw new Error("迁移前校验失败：数据改写验证未通过。");
		}
	}

	// 事务执行：移开源目录到备份区 -> 写入目标 -> 校验 -> 切换记账
	const detachedWorkspaces: WorkspaceEntityLike[] = [];
	let targetAttached = false;
	let stageFile: string | null = null;

	try {
		// a. 移开源目录
		await rename(sourceSessionDir, backupDir);

		// b. 创建目标目录并原子落盘
		await mkdir(targetSessionDir, { recursive: true });
		stageFile = join(targetSessionDir, `.stage-${process.pid}-${Date.now()}`);
		await writeFile(stageFile, newBytes);
		await rename(stageFile, targetLogPath);
		stageFile = null;

		// c. 读回校验
		const readbackBytes = await readFile(targetLogPath);
		if (readbackBytes.length === 0) throw new Error("目标写入工件为空");

		// d. 内存映射与会话状态预热更新（必须在 attachSession 之前完成，供宿主 readSessionHeader 校验新 cwd）
		const targetHeader = { ...header, cwd: targetPath };
		registry.sessionPaths?.set(cleanSessionId, targetPath);
		registry.headers?.set(cleanSessionId, targetHeader);
		registry.invalidSessionPaths?.delete(cleanSessionId);

		if (liveSession !== undefined) {
			try {
				if ("header" in liveSession && (liveSession as unknown as { header?: { cwd?: string } }).header) {
					(liveSession as unknown as { header: { cwd?: string } }).header.cwd = targetPath;
				}
				if ("cwd" in liveSession) {
					(liveSession as unknown as { cwd?: string }).cwd = targetPath;
				}
			} catch {}
		}

		// e. 宿主记账同步
		for (const ws of registry.list()) {
			if (ws.id !== targetWorkspace.id && Array.isArray(ws.sessionIds) && ws.sessionIds.includes(cleanSessionId)) {
				await ws.detachSession(cleanSessionId);
				detachedWorkspaces.push(ws);
			}
		}
		await targetWorkspace.attachSession(cleanSessionId);
		targetAttached = true;

		if (ctx.sessionProjectionCache && typeof ctx.sessionProjectionCache.coldSnapshot === "function") {
			await ctx.sessionProjectionCache.coldSnapshot(cleanSessionId).catch((err) => {
				ctx.logger?.warn?.(`archive-manager: post-move coldSnapshot failed: ${String(err)}`);
			});
		}
	} catch (error) {
		// 回滚内存映射
		if (header) {
			registry.headers?.set(cleanSessionId, header);
			if (header.cwd) registry.sessionPaths?.set(cleanSessionId, header.cwd);
		}
		if (liveSession !== undefined && header) {
			try {
				if ("header" in liveSession && (liveSession as unknown as { header?: { cwd?: string } }).header) {
					(liveSession as unknown as { header: { cwd?: string } }).header.cwd = header.cwd;
				}
				if ("cwd" in liveSession && header.cwd) {
					(liveSession as unknown as { cwd?: string }).cwd = header.cwd;
				}
			} catch {}
		}

		// 回滚链路
		if (stageFile) await rm(stageFile, { force: true }).catch(() => {});
		await rm(targetSessionDir, { recursive: true, force: true }).catch(() => {});
		try {
			await mkdir(dirname(sourceSessionDir), { recursive: true });
			await rename(backupDir, sourceSessionDir);
		} catch (restoreErr) {
			throw new AggregateError([error, restoreErr], `移动失败且原工件回滚异常，备份暂存于: ${backupDir}`);
		}
		if (targetAttached) {
			await targetWorkspace.detachSession(cleanSessionId).catch(() => {});
		}
		for (const ws of detachedWorkspaces) {
			await ws.attachSession(cleanSessionId).catch(() => {});
		}
		throw error;
	}

	// 成功后清理备份目录
	await rm(backupDir, { recursive: true, force: true }).catch(() => {});

	return {
		ok: true,
		moved: true,
		alreadyCwd: false,
		sessionId: cleanSessionId,
		toWorkspaceId: cleanTargetWsId,
		toWorkspaceTitle: targetWorkspace.title || cleanTargetWsId,
		toWorkspacePath: targetPath,
	};
}
