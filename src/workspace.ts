import type { Context } from "@deepseek-ai/cordis";
import { confirmColdCacheWrite } from "./cache-rebuild.js";
import { cacheIdentity, cacheRebuildInput, cacheRebuildInvocations } from "./cache-rebuild-contract.js";
import type { CacheDiagnosis, CacheRebuildResult } from "./cache-rebuild-contract.js";
import { symbols } from "@deepseek-ai/cordis";
import type { Domain, DomainGlobalSpec } from "@deepseek-ai/dsh-storage-domain";
import type { TypertContribution } from "@deepseek-ai/dsh-typert-registry";
import type { Header, HostContext, PersistenceCompat, SessionsCompat, WorkspaceConstructor } from "./host-compat.js";
import { record, errorMessage, errorCode } from "./contracts.js";
import type { Schema } from "./contracts.js";
import type { TypertGatewayBinding } from "@deepseek-ai/dsh-typert-protocol";
type BatchTarget = { scope: "all" | "ungrouped" } | { scope: "workspace"; workspaceId: string } | { scope: "sessions"; sessionIds: string[] };
import { discoveryInvocations, searchInputSchema, previewInputSchema, extractConversation, findContentMatch, previewConversation } from "./archive-discovery.js";
import { lstat, readdir, rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { defineDomain } from "@deepseek-ai/dsh-storage-domain";
import { favoriteInputSchema, favoriteStateSchema, favoriteInvocations } from "./archive-organizer.js";

const favoriteDomainSpec = defineDomain({
	name: "archive_manager_favorites", version: 1, tables: {},
	// 宿主运行时仅调用 parse/safeParse；兼容早期同构 schema，不新增 Zod 运行依赖。
	global: { schema: favoriteStateSchema as unknown as DomainGlobalSpec<{ favoriteSessionIds: string[] }>["schema"], initial: { favoriteSessionIds: [] as string[] } },
});
//#region lib/types/index.js
/**
 * dsh-archive-manager 宿主侧归档会话管理。
 *
 * `deleteSession(sessionId)` 的顺序即语义：校验已知会话；实时会话先
 * flush 再 detach；清理投影缓存、归档标记和工作区记账；级联删除 SUBAGENT
 * 子会话并清理 spill；最后删除转录目录。fork 分支虽有 `parentSession`，
 * 但属于独立用户会话，不参与级联。
 *
 * 转录工件删除成功后才提交父会话记账清理；任一步失败均保留归档标记、工作区
 * 记账和头部索引，以便再次调用同一入口完成删除。SUBAGENT 级联跨多个转录
 * 工件，无法组成事务：子会话可能已先删除，重试会跳过它们并继续处理仍保留的
 * 父会话。
 * 单会话与批量恢复/删除方法均通过 Typert Remote 暴露给浏览器，并注册到
 * typert.local，避免生产环境只靠 SRC 扫描时 404.
 */
/**
 * Compatibility adapter for the official JSONL backend's session-owned layout.
 * A generic locate() path does NOT grant ownership of its parent directory.
 * Unknown backends/layouts keep artifact-only deletion. Do not prune ancestors.
 */
function jsonlSessionDirectory(persistence: PersistenceCompat, header: Header, location: { kind: string; path: string }) {
	if (
		persistence.name !== "session-persistence-jsonl" ||
		location.kind !== "jsonl"
	)
		return;
	// Official JSONL stores its resolved root at construction. Re-resolving a
	// relative config.root after process.chdir() would point to a different store.
	// This backend-specific field is optional; only absolute config is a safe fallback.
	const root = persistence.root ?? persistence.config?.root;
	if (
		typeof root !== "string" ||
		!isAbsolute(root) ||
		!isAbsolute(location.path)
	)
		return;
	// 新版使用不可变代际文件；删除整个已验证的会话目录，避免旧代际被重新发现。
	if (
		!/^session(?:\.v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/.test(
			basename(location.path),
		)
	)
		return;
	if (typeof header.id !== "string" || header.id.length === 0) return;
	// Upstream encodes UTF-16 code units as ~XXXX (including lone surrogates).
	const encode = (text: string) =>
		text.replace(
			/[^A-Za-z0-9._-]/g,
			(ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
		);
	const segment =
		header.id === "."
			? "~002E"
			: header.id === ".."
				? "~002E~002E"
				: encode(header.id);
	let project = "_no-cwd";
	if (header.cwd !== void 0) {
		if (typeof header.cwd !== "string" || header.cwd.length === 0) return;
		const readable =
			encode(header.cwd.replace(/[\\/:]+/g, "-")).replace(/^-+/, "") || "root";
		project = `--${readable.slice(0, 251)}--`;
	}
	const directory = join(resolve(root), project, segment);
	if (location.path !== join(directory, basename(location.path))) return;
	return directory;
}

async function pathExists(path: string) {
	try {
		await lstat(path);
		return true;
	} catch (error) {
		if (errorCode(error) === "ENOENT") return false;
		throw error;
	}
}

async function estimatePathSize(path: string): Promise<number> {
	try {
		const s = await lstat(path);
		if (s.isFile()) return s.size;
		if (s.isDirectory()) {
			const entries = await readdir(path, { withFileTypes: true });
			let total = 0;
			for (const entry of entries) {
				if (entry.isFile()) {
					try {
						const fileStat = await lstat(join(path, entry.name));
						total += fileStat.size;
					} catch {}
				}
			}
			return total;
		}
	} catch {
		return 0;
	}
	return 0;
}

class PersistenceStillPresentError extends Error {
	constructor(sessionId: string) {
		super(`session "${sessionId}" is still present in persistence after artifact removal`);
		this.name = "PersistenceStillPresentError";
	}
}

function deletionFailureMessage(error: unknown) {
	// 失败详情会进各语言模板的 {detail}。这里只留宿主原文，不拼中文诊断。
	return errorMessage(error).slice(0, 400);
}

/** alpha.1 读 schema.parse；alpha.2 只接受 create()。两套字段一起带上。 */
function strictCodec(typeSymbol: string, schema: Schema<unknown>) {
	return {
		mode: "strict" as const,
		typeSymbol,
		create: () => schema,
		schema,
	};
}

/** 经 typert Gateway 暴露的方法。子类与 overlay 共用一份，避免把内部方法（如目录删除和索引清理）也变成 RPC 端点。 */
const ARCHIVE_REMOTE_METHODS = [
	"unarchiveSession",
	"deleteSession",
	"deleteArchivedSessions",
	"archivedSessionMetadata",
	"favoriteSessions",
	"setSessionFavorite",
	"searchArchivedContent",
	"searchSessionContent",
	"previewArchivedSession",
	"diagnoseOrphanSubagents",
	"diagnoseSessionCaches",
	"rebuildSessionCaches",
	"cleanOrphanSubagents",
] as const;
function markRemoteMethod(instance: object, method: string) {
	// 模拟 TS 装饰器管线 `@Remote(method)`：`Remote` 返回标准方法装饰器，
	// 这里构造一个 addInitializer 立即以 `this` = instance 执行的装饰器上下文。
	const context = {
		private: false,
		static: false,
		name: method,
		addInitializer(fn: (this: object) => void) {
			fn.call(instance);
		},
	};
	// 装饰器只消费初始化上下文；保持原有注册语义并补齐标准上下文。
	Remote(method)(function () {}, { ...context, kind: "method", access: { has: (value: object) => method in value, get: (value: object) => Reflect.get(value, method) }, metadata: undefined });
}
const sessionIdSchema = {
	parse(value: unknown) {
		if (typeof value !== "string" || value.length === 0)
			throw new TypeError(
				`sessionId must be a non-empty string, got ${String(value)}`,
			);
		return value;
	},
};
const archivedSetSchema = {
	parse(input: unknown) {
		const value = record(input);
		if (typeof value !== "object" || value === null || Array.isArray(value))
			throw new TypeError("result must be an object");
		const ids = value.archivedSessionIds;
		if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
			throw new TypeError("archivedSessionIds must be a string array");
		return value;
	},
};
const deletedSchema = {
	parse(input: unknown) {
		const value = record(input);
		if (
			typeof value !== "object" ||
			value === null ||
			Array.isArray(value) ||
			value.deleted !== true
		)
			throw new TypeError("deleted must be true");
		return value;
	},
};
const archivedBatchTargetSchema: Schema<BatchTarget> = {
	parse(input: unknown) {
		const value = record(input);
		if (typeof value !== "object" || value === null || Array.isArray(value))
			throw new TypeError("target must be an object");
		if (value.scope === "all" || value.scope === "ungrouped") return value as BatchTarget;
		if (
			value.scope === "workspace" &&
			typeof value.workspaceId === "string" &&
			value.workspaceId.length > 0
		)
			return value as BatchTarget;
		if (
			value.scope === "sessions" &&
			Array.isArray(value.sessionIds) &&
			value.sessionIds.length > 0 &&
			value.sessionIds.every((id) => typeof id === "string" && id.length > 0)
		)
			return value as BatchTarget;
		throw new TypeError(
			"target.scope must be all, ungrouped, workspace with a non-empty workspaceId, or sessions with non-empty sessionIds",
		);
	},
};
const deletedBatchSchema = {
	parse(input: unknown) {
		const value = record(input);
		if (typeof value !== "object" || value === null || Array.isArray(value))
			throw new TypeError("result must be an object");
		for (const key of [
			"requestedSessionIds",
			"deletedSessionIds",
			"skippedSessionIds",
		]) {
			if (
				!Array.isArray(value[key]) ||
				(value[key] as unknown[]).some((id) => typeof id !== "string")
			)
				throw new TypeError(`${key} must be a string array`);
		}
		if (
			!Array.isArray(value.failures) ||
			value.failures.some(
				(failure) =>
					typeof failure !== "object" ||
					failure === null ||
					typeof failure.sessionId !== "string" ||
					typeof failure.message !== "string",
			)
		)
			throw new TypeError("failures must contain sessionId/message objects");
		return value;
	},
};
const archivedSessionMetadataSchema = {
	parse(input: unknown) {
		const value = record(input);
		if (
			typeof value !== "object" ||
			value === null ||
			Array.isArray(value) ||
			!Array.isArray(value.items)
		)
			throw new TypeError("result.items must be an array");
		if (
			value.items.some(
				(item) =>
					typeof item !== "object" ||
					item === null ||
					typeof item.sessionId !== "string" ||
					typeof item.createdAt !== "number" ||
					!Number.isFinite(item.createdAt),
			)
		)
			throw new TypeError("items must contain sessionId/createdAt objects");
		return value;
	},
};
const orphanDiagnosisSchema = {
	parse(value: unknown) {
		const val = record(value);
		if (!val || typeof val.count !== "number" || !Array.isArray(val.items) || typeof val.totalSizeBytes !== "number") {
			throw new TypeError("invalid orphan subagent diagnosis");
		}
		return val;
	},
};
const orphanCleanResultSchema = {
	parse(value: unknown) {
		const val = record(value);
		if (!val || !Array.isArray(val.cleanedSessionIds) || !Array.isArray(val.skippedSessionIds) || !Array.isArray(val.failures)) {
			throw new TypeError("invalid orphan subagent clean result");
		}
		return val;
	},
};
/**
 * Host 严格描述符。网关优先读 typert.local，避免 SRC 扫描缓存
 * 或协议包双份导致 /api/workspaceRegistry/deleteSession 在生产环境 404。
 */
const ARCHIVE_MANAGER_INVOCATIONS = [
	...cacheRebuildInvocations(),
	...favoriteInvocations(),
	...discoveryInvocations(),
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "unarchiveSession",
		invocation: { kind: "direct" },
		parameters: [
			{
				name: "sessionId",
				wire: "sessionId",
				source: "json",
				codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema),
			},
		],
		result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionIds", archivedSetSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteSession",
		invocation: { kind: "direct" },
		parameters: [
			{
				name: "sessionId",
				wire: "sessionId",
				source: "json",
				codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId", sessionIdSchema),
			},
		],
		result: strictCodec("@michengai/dsh-archive-manager/types#Deleted", deletedSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteArchivedSessions",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteArchivedSessions",
		invocation: { kind: "direct" },
		parameters: [
			{
				name: "target",
				wire: "target",
				source: "json",
				codec: strictCodec("@michengai/dsh-archive-manager/types#ArchivedBatchTarget", archivedBatchTargetSchema),
			},
		],
		result: strictCodec("@michengai/dsh-archive-manager/types#DeletedBatch", deletedBatchSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/archivedSessionMetadata",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "archivedSessionMetadata",
		invocation: { kind: "direct" },
		parameters: [],
		result: strictCodec("@michengai/dsh-archive-manager/types#ArchivedSessionMetadata", archivedSessionMetadataSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/diagnoseOrphanSubagents",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "diagnoseOrphanSubagents",
		invocation: { kind: "direct" },
		parameters: [],
		result: strictCodec("@michengai/dsh-archive-manager/types#OrphanSubagentDiagnosis", orphanDiagnosisSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/cleanOrphanSubagents",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "cleanOrphanSubagents",
		invocation: { kind: "direct" },
		parameters: [
			{
				name: "target",
				wire: "target",
				source: "json",
				acceptsUndefined: true,
				codec: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanTarget", {
					parse(v: unknown) {
						if (v === undefined || v === null) return {};
						const val = record(v);
						if (!val) throw new TypeError("target must be an object");
						if (val.sessionIds !== undefined && (!Array.isArray(val.sessionIds) || val.sessionIds.some((id) => typeof id !== "string"))) {
							throw new TypeError("sessionIds must be an array of strings");
						}
						return val;
					},
				}),
			},
		],
		result: strictCodec("@michengai/dsh-archive-manager/types#CleanOrphanResult", orphanCleanResultSchema),
		sourceLocation: {
			file: "@michengai/dsh-archive-manager/lib/workspace.js",
			line: 1,
			column: 1,
		},
	},
];
const ARCHIVE_MANAGER_TYPERT = {
	package: "@michengai/dsh-archive-manager",
	face: "host",
	schemas: [],
	model: { services: [], events: [], objects: [] },
	invocations: ARCHIVE_MANAGER_INVOCATIONS,
};
function registerHostRemote(ctx: HostContext) {
	const existing = ctx.get("typert");
	if (existing !== undefined) {
		existing.register(ARCHIVE_MANAGER_TYPERT as TypertContribution);
		return;
	}
	ctx.inject(["typert"], (typertCtx) => {
		typertCtx.typert.register(ARCHIVE_MANAGER_TYPERT as TypertContribution);
	});
}
/** 把归档远程方法挂到调用方自己的 fiber 上，服务停用时由该 fiber 卸下。 */
export function bindArchiveManagerRemote(ctx: Context): () => void {
	const typert = ctx.get("typert") as { register?(value: TypertContribution): unknown } | undefined;
	if (typert === undefined || typeof typert.register !== "function") {
		throw new Error("archive-manager: typert is unavailable");
	}
	try {
		const dispose = typert.register(ARCHIVE_MANAGER_TYPERT as TypertContribution);
		return typeof dispose === "function" ? () => { dispose(); } : () => {};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// 热重载若没撤掉上一次注册，再次启用不能因此起不来。
		if (!message.includes("already registered")) throw error;
		return () => {};
	}
}
type RestorableWorkspaceConstructor = new (ctx: Context) => InstanceType<WorkspaceConstructor> & {
	unarchiveSession(sessionId: string): Promise<unknown>;
};
var ArchiveWorkspaceRegistry = class extends (WorkspaceRegistry as unknown as RestorableWorkspaceConstructor) {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache",
		"typert",
	];
	declare typertRemote: TypertGatewayBinding<this>;
	declare favoriteDomainPromise: Promise<Domain<typeof favoriteDomainSpec>> | undefined;
	constructor(ctx: Context) {
		super(ctx);
		this.typertRemote = bindTypertRemote(this, this.name);
		for (const method of ARCHIVE_REMOTE_METHODS) markRemoteMethod(this, method);
		registerHostRemote(this.ctx);
	}
	/** 只读取归档日志；已有实时实例读取快照，不调用 prepare、enter 或恢复接口。 */
	async readArchivedConversation(sessionId: string) {
		const ensureArchived = () => {
			if (!this.requireState().archivedSessionIds.includes(sessionId)) throw new Error("会话已不在归档中，请刷新列表");
		};
		ensureArchived();
		const events = await this.readConversationEvents(sessionId);
		ensureArchived();
		return extractConversation(events);
	}
	/** 复用宿主只读接口读取事件，不激活会话。 */
	async readConversationEvents(sessionId: string) {
        const live = this.ctx.get("sessions")?.get(sessionId);
        if (typeof live?.snapshotEvents === "function") return live.snapshotEvents();
        const persistence = this.ctx.get("sessionPersistence");
        if (!persistence || typeof persistence.open !== "function") throw new Error("当前宿主不支持只读会话，请打开完整会话查看");
        return (await this.readStoredProjectionSource(persistence, sessionId)).events;
    }
    /** 已归档与未归档共用正文检索；只读已知会话，不激活或改变归档状态。 */
    async searchSessionContent(input: unknown) {
        const { sessionIds, query } = searchInputSchema.parse(input);
        const items = [], failures = [];
        for (const sessionId of sessionIds) {
            try {
                if (!(await this.sessionKnown(sessionId))) throw new Error("会话不存在，请刷新列表");
                const messages = extractConversation(await this.readConversationEvents(sessionId));
                if (!(await this.sessionKnown(sessionId))) throw new Error("会话已移除，请刷新列表");
                const match = findContentMatch(messages, query);
                if (match) items.push({ sessionId, ...match });
            } catch (error) { failures.push({ sessionId, message: errorMessage(error).slice(0, 500) }); }
        }
        return { items, failures };
    }
    /** 输入为限定批次的归档 ID 和关键词，逐条返回命中或失败。 */
    async searchArchivedContent(input: unknown) {
		const { sessionIds, query } = searchInputSchema.parse(input);
		const items = [], failures = [];
		for (const sessionId of sessionIds) {
			try {
				const match = findContentMatch(await this.readArchivedConversation(sessionId), query);
				if (match) items.push({ sessionId, ...match });
			} catch (error) { failures.push({ sessionId, message: errorMessage(error).slice(0, 500) }); }
		}
		return { items, failures };
	}
	/** 返回最近八条对话或关键词附近的八条，单条最多 2000 字，不写入宿主数据。 */
	async previewArchivedSession(input: unknown) {
		const { sessionId, query } = previewInputSchema.parse(input);
		return { sessionId, ...previewConversation(await this.readArchivedConversation(sessionId), query) };
	}
	/** 独立收藏域不改变官方工作区数据结构；旧版本回退时可保留收藏。 */
	async favoriteDomain() {
		if (!this.favoriteDomainPromise) {
			this.favoriteDomainPromise = this.ctx.storageDomain.open(favoriteDomainSpec).then((domain) => {
				this.ctx.effect(() => () => domain.close(), "archive-manager: 收藏存储关闭");
				return domain;
			}).catch((error) => { this.favoriteDomainPromise = undefined; throw error; });
		}
		return this.favoriteDomainPromise;
	}
	/** 返回宿主保存的收藏；读取时清理已确认不存在的会话。 */
	async favoriteSessions() {
		return this.enqueueOperation(async () => {
			const domain = await this.favoriteDomain();
			const state = favoriteStateSchema.parse(domain.global.get());
			const kept = [];
			for (const id of state.favoriteSessionIds) {
				// 实时会话可能尚未落盘；索引未知或读取失败都不能作为永久删除依据。
				if (this.ctx.get("sessions")?.get(id) !== undefined || !(await this.sessionArtifactMissing(id))) kept.push(id);
			}
			if (kept.length !== state.favoriteSessionIds.length) await domain.global.set({ favoriteSessionIds: kept });
			return { favoriteSessionIds: kept };
		});
	}
	/** 设置单条收藏，串行写入避免不同浏览器相互覆盖。 */
	async setSessionFavorite(input: unknown) {
		const { sessionId, favorite } = favoriteInputSchema.parse(input);
		return this.enqueueOperation(async () => {
			if (favorite && !(await this.sessionKnown(sessionId))) throw new Error("会话不存在，无法收藏");
			const domain = await this.favoriteDomain();
			const state = favoriteStateSchema.parse(domain.global.get());
			const ids = new Set(state.favoriteSessionIds);
			if (favorite) ids.add(sessionId); else ids.delete(sessionId);
			const next = favoriteStateSchema.parse({ favoriteSessionIds: [...ids] });
			await domain.global.set(next);
			return next;
		});
	}
	/**
	 * 确证会话工件在物理上是否已经彻底缺失。
	 * 注意：官方 jsonl 的 stat() 在日志第一行 JSON 损坏、为空或格式异常时也会返回 undefined，
	 * 不能单凭 stat() === undefined 断定文件不存在；
	 * 必须结合 findLog(sessionId) 以及物理存储根目录扫描，确证磁盘上没有任何工件或目录残留。
	 */
	async sessionArtifactMissing(sessionId: string) {
		const persistence = this.ctx.get("sessionPersistence");
		if (!persistence) return false;

		// 1. 若宿主持久化提供了 findLog，它纯物理探测日志文件是否存在，不受第一行 JSON 损坏或空文件干扰
		if (typeof persistence.findLog === "function") {
			try {
				const found = await persistence.findLog(sessionId);
				if (found !== undefined) return false;
			} catch {
				return false;
			}
		}

		// 2. 检查官方 JSONL 根目录：物理扫描各 project 目录下是否存在该 session 的目录
		const root = persistence.root ?? persistence.config?.root;
		if (typeof root === "string" && isAbsolute(root)) {
			try {
				const encode = (text: string) => text.replace(/[^A-Za-z0-9._-]/g, (ch) => `~${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
				const segment = sessionId === "." ? "~002E" : sessionId === ".." ? "~002E~002E" : encode(sessionId);
				const projects = await readdir(root);
				for (const proj of projects) {
					if (await pathExists(join(root, proj, segment))) {
						return false;
					}
				}
			} catch {}
		}

		// 3. 通用兜底：stat
		if (typeof persistence?.stat !== "function") return false;
		try {
			return (await persistence.stat(sessionId)) === undefined;
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: could not stat archived session "${sessionId}": ${String(error)}`,
			);
			return false;
		}
	}
	/**
	 * 从归档集合摘掉已经确认不存在的会话。打开归档列表时调用。
	 * 读不出头部的标记留在持久集合里，只从本次元数据结果里隐藏。
	 */
	async pruneUnknownArchivedSessionIds() {
		return this.enqueueOperation(async () => {
			const state = this.requireState();
			const listed = new Set();
			for (const item of await this.listStoredHeaders()) {
				const header = item.header ?? item;
				if (typeof header?.id === "string") listed.add(header.id);
			}
			const sessions = this.ctx.get("sessions");
			const kept = [];
			const seen = new Set();
			for (const sessionId of state.archivedSessionIds) {
				if (seen.has(sessionId)) continue;
				seen.add(sessionId);
				if (sessions?.get(sessionId) !== undefined) {
					kept.push(sessionId);
					continue;
				}
				if (listed.has(sessionId)) {
					kept.push(sessionId);
					continue;
				}
				if (await this.sessionArtifactMissing(sessionId)) {
					this.forgetIndexedSession(sessionId);
					const projCache = this.ctx.get("sessionProjectionCache");
					if (projCache !== undefined) {
						try { await projCache.requireTable().delete(sessionId); }
						catch (e) { this.ctx.logger.warn(`archive-manager: cleanup projection cache for missing session "${sessionId}" failed: ${String(e)}`); }
					}
					continue;
				}
				kept.push(sessionId);
			}
			if (
				kept.length === state.archivedSessionIds.length &&
				kept.every((id, index) => id === state.archivedSessionIds[index])
			)
				return kept;
			await this.setState({ ...state, archivedSessionIds: kept });
			return kept;
		});
	}
	/** 仅返回归档头部元数据；不读取正文、不重建或补写投影缓存。 */
	async archivedSessionMetadata() {
		await this.pruneUnknownArchivedSessionIds();
		const items = [];
		for (const sessionId of this.requireState().archivedSessionIds) {
			try {
				const header = await this.readSessionHeader(sessionId);
				if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt))
					items.push({ sessionId, createdAt: header.createdAt });
			} catch (error) {
				this.ctx.logger.warn(
					`archive-manager: could not read creation time for archived session "${sessionId}": ${String(error)}`,
				);
			}
		}
		return { items };
	}
	/** 只读句柄必须关闭，避免激活 Agent 或写入会话日志。 */
	async cacheRebuildEligible(header: Header) {
		if (header.origin !== undefined || this.ctx.get("sessions")?.get(header.id) !== undefined) return false;
		const state = this.requireState();
		if (!state.archivedSessionIds.includes(header.id) && !state.workspaceIds.some(id => this.requireTable().get(id)?.sessionIds.includes(header.id))) return false;
		const activity = await this.ctx.waterfall("workspace/session-activity", { sessionId: header.id as never }, () => Promise.resolve([]));
		return activity.length === 0 && this.ctx.get("sessions")?.get(header.id) === undefined;
	}
	/** 检测仅读取头部与官方缓存，不读取会话正文。 */
	usableSessionListCache(header: Header) {
		const snapshot = this.ctx.get("sessionProjectionCache")?.cachedSnapshot(header);
		return snapshot !== undefined && Object.hasOwn(snapshot.values, "title");
	}
	async diagnoseSessionCaches(): Promise<CacheDiagnosis> {
		const cache = this.ctx.get("sessionProjectionCache");
		if (!cache) throw new Error("Official session projection cache is unavailable");
		const items = [];
		for (const header of await this.listStoredHeaders()) {
			if (await this.cacheRebuildEligible(header) && !this.usableSessionListCache(header)) items.push({ sessionId: header.id, identity: cacheIdentity(header) });
		}
		return { count: items.length, items };
	}
	/** 与删除共用官方工作区队列；冷写入会同步加入官方域写入链，
	 * 回读超时也不会取消已入队的写入，因此后续删除会排在该写入之后。 */
	async rebuildSessionCaches(input: unknown): Promise<CacheRebuildResult> {
		const { items } = cacheRebuildInput.parse(input);
		const result: CacheRebuildResult = { rebuiltSessionIds: [], skippedSessionIds: [], failures: [] };
		for (const item of [...new Map(items.map(row => [row.sessionId, row])).values()]) {
			await this.enqueueOperation(async () => {
				try {
					const cache = this.ctx.get("sessionProjectionCache");
					if (!cache) throw new Error("Official session projection cache is unavailable");
					const header = (await this.listStoredHeaders()).find(h => h.id === item.sessionId);
					if (!header || cacheIdentity(header) !== item.identity || !(await this.cacheRebuildEligible(header)) || this.usableSessionListCache(header)) {
						result.skippedSessionIds.push(item.sessionId); return;
					}
					const source = await this.readStoredProjectionSource(this.ctx.sessionPersistence, item.sessionId);
					const current = (await this.listStoredHeaders()).find(h => h.id === item.sessionId);
					if (!current || cacheIdentity(current) !== item.identity || cacheIdentity(source.meta) !== item.identity || !(await this.cacheRebuildEligible(current))) {
						result.skippedSessionIds.push(item.sessionId); return;
					}
					await confirmColdCacheWrite(cache, source);
					result.rebuiltSessionIds.push(item.sessionId);
				} catch (error) { result.failures.push({ sessionId: item.sessionId, message: (error instanceof Error ? error.message : String(error)).slice(0, 500) }); }
			});
		}
		return result;
	}
	async readStoredProjectionSource(persistence: PersistenceCompat, sessionId: string) {
		const handle = await persistence.open(sessionId, "read");
		try {
			const { events } = await handle.read(0);
			return {
				meta: handle.header,
				inheritedEventCount: handle.inheritedEventCount,
				events,
			};
		} finally {
			await handle.close();
		}
	}
	/** 官方负责移出归档集合。这里只补远程接口需要的当前集合，不补工作区记账。 */
	async unarchiveSession(sessionId: string) {
		await super.unarchiveSession(sessionId);
		return { archivedSessionIds: [...this.requireState().archivedSessionIds] };
	}
	/**
	 * 按作用域永久删除归档会话。跨会话文件删除无法组成事务，因此继续处理
	 * 后续目标并把成功、并发消失和失败分别返回给客户端。
	 */
	async deleteArchivedSessions(target: unknown) {
		return this.enqueueOperation(async () => {
			const requestedSessionIds = this.archivedSessionIdsForTarget(target);
			const deletedSessionIds = [];
			const skippedSessionIds = [];
			const failures = [];
			// 只给本批级联枚举复用，避免每个目标重复读取存储列表。
			let descendantHeaders: Header[] | undefined;
			try {
				descendantHeaders = await this.listStoredHeaders();
			} catch (error) {
				this.ctx.logger.warn(
					`archive-manager: batch descendant listing failed; each cascade will retry: ${String(error)}`,
				);
			}
			for (const sessionId of requestedSessionIds) {
				try {
					const result = await this.deleteSessionCore(sessionId, descendantHeaders);
					if (result?.skipped) skippedSessionIds.push(sessionId);
					else deletedSessionIds.push(sessionId);
				} catch (error) {
					failures.push({ sessionId, message: deletionFailureMessage(error) });
				}
			}
			return {
				requestedSessionIds,
				deletedSessionIds,
				skippedSessionIds,
				failures,
			};
		});
	}
	/** 删除未知会话遗留的投影行、spill、工作区记账和归档标记。 */
	async cleanupUnknownArchivedSession(sessionId: string) {
		const projCache = this.ctx.get("sessionProjectionCache");
		if (projCache !== void 0) await projCache.requireTable().delete(sessionId);
		await this.cleanSpill(sessionId);
		await this.removeFromWorkspaceAccounts(sessionId);
		const state = this.requireState();
		if (state.archivedSessionIds.includes(sessionId)) {
			await this.setState({
				...state,
				archivedSessionIds: state.archivedSessionIds.filter(
					(id) => id !== sessionId,
				),
			});
		}
	}
	/** 以归档集合顺序解析批量目标，避免依赖浏览器尚未加载完整的摘要投影。 */
	archivedSessionIdsForTarget(input: unknown) {
		const target = archivedBatchTargetSchema.parse(input);
		const state = this.requireState();
		const archivedSessionIds = [...new Set(state.archivedSessionIds)];
		if (target.scope === "all") return archivedSessionIds;
		if (target.scope === "sessions") {
			const selected = new Set(target.sessionIds);
			return archivedSessionIds.filter((id) => selected.has(id));
		}
		if (target.scope === "workspace") {
			const workspace = this.requireTable().get(target.workspaceId);
			if (workspace === void 0)
				throw new Error(`unknown workspace "${target.workspaceId}"`);
			const accounted = new Set(workspace.sessionIds);
			return archivedSessionIds.filter((id) => accounted.has(id));
		}
		const accounted = /* @__PURE__ */ new Set();
		const table = this.requireTable();
		for (const workspaceId of state.workspaceIds) {
			for (const sessionId of table.get(workspaceId)?.sessionIds ?? [])
				accounted.add(sessionId);
		}
		return archivedSessionIds.filter((id) => !accounted.has(id));
	}
	/**
	 * 永久删除一个会话及其全部痕迹（转录目录、工作区记账、归档标记、
	 * 投影缓存行）。
	 * @param sessionId - 要删除的会话。
	 * @returns 持久化完成后的 `{ deleted: true }`。未知会话清掉残留痕迹后同样返回成功，不抛错。
	 */
	async deleteSession(sessionId: string) {
		return this.enqueueOperation(async () => {
			await this.deleteSessionCore(sessionId);
			return { deleted: true };
		});
	}
	/** 串行化后的删除主体（级联路径复用：它已持有操作链，绝不能再入队）。 */
	async deleteSessionCore(sessionId: string, descendantHeaders?: Header[]) {
		if (!(await this.sessionKnown(sessionId))) {
			await this.cleanupUnknownArchivedSession(sessionId);
			return { deleted: true, skipped: true };
		}
		const sessions = this.ctx.get("sessions");
		const live = sessions?.get(sessionId);
		if (live !== void 0) {
			// 持久化屏障先行：不能有未落盘的转录写入与目录删除竞争
			//（持久化后端按批关闭句柄，flush 过的会话不再持有打开的文件）。
			await sessions.flush(live);
			// 从存储分离；`session/disposed` 同步触发，驱动浏览器端的
			// `host/session-removed` 帧并启动投影缓存的最终写后落盘。
			const entry = sessions.liveEntryFor(live);
			sessions.detachEntered(entry);
		} else if (sessions !== void 0)
			await this.publishColdSessionRemoval(sessionId, sessions);
		const projCache = this.ctx.get("sessionProjectionCache");
		if (projCache !== void 0) await projCache.requireTable().delete(sessionId);
		await this.deleteDescendants(sessionId, descendantHeaders);
		await this.cleanSpill(sessionId);
		await this.removeTranscriptDirectory(sessionId);
		// 只有物理工件删除成功后才能提交记账清理；否则批量目标会因归档标记
		// 或工作区记账提前消失而无法重试。
		const state = this.requireState();
		if (state.archivedSessionIds.includes(sessionId)) {
			await this.setState({
				...state,
				archivedSessionIds: state.archivedSessionIds.filter(
					(id) => id !== sessionId,
				),
			});
		}
		await this.removeFromWorkspaceAccounts(sessionId);
		// 物理删除已成功：此时再清父类索引。后续记账失败时保留索引，便于重试。
		this.forgetIndexedSession(sessionId);
		this.publishDeletedSession(sessionId);
		return { deleted: true };
	}
	/** 删除完成后通知全部客户端；新版不再通过伪造冷会话生命周期触发通知。 */
	publishDeletedSession(sessionId: string) {
		try {
			this.ctx.emit("api-session/removed", sessionId);
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: session "${sessionId}" deleted but removal notification failed: ${String(error)}`,
			);
		}
	}
	/** 物理删除成功后移除父类的会话头部和路径索引。 */
	forgetIndexedSession(sessionId: string) {
		this.headers.delete(sessionId);
		this.sessionPaths.delete(sessionId);
		this.invalidSessionPaths.delete(sessionId);
	}
	/** 为未处于实时状态的持久化会话发布相同的移除事件。 */
	async publishColdSessionRemoval(sessionId: string, sessions: SessionsCompat) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.prepare !== "function")
			return;
		try {
			const preparation = await persistence.prepare(sessionId);
			const detach = sessions.enter(preparation.session);
			try {
				sessions.announce(preparation.session);
			} finally {
				detach();
				preparation[Symbol.dispose]();
			}
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: could not publish removal for stored session "${sessionId}": ${String(error)}`,
			);
		}
	}
	/** 官方 JSONL 已知布局清理会话专属目录；其他后端只删除定位到的工件。 */
	async removeTranscriptDirectory(sessionId: string) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.locate !== "function") {
			throw new Error(
				`cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript artifact`,
			);
		}
		// 列表里已有头部时不再读转录。宿主恢复校验抛出的合成 tool/result
		// 发生在读取阶段，不能挡在 rm 之前。
		const header = this.headers?.get(sessionId) ?? await this.readSessionHeader(sessionId);
		const location = persistence.locate(header);
		if (location === void 0 || typeof location.path !== "string") {
			throw new Error(
				`cannot delete session "${sessionId}": the session persistence backend could not resolve its transcript artifact`,
			);
		}
		let target = { path: location.path, kind: "transcript artifact" };
		try {
			const directory = jsonlSessionDirectory(persistence, header, location);
			if (directory !== void 0) {
				target = { path: directory, kind: "session directory" };
				// The configured storage root may itself be an intentional alias, but
				// project/session links must not redirect recursive deletion elsewhere.
				// These checks assume trusted, stable storage ancestors; lstat + rm
				// is not an atomic defense against another process swapping directories.
				for (const path of [dirname(directory), directory]) {
					let stat;
					try {
						stat = await lstat(path);
					} catch (error) {
						if (errorCode(error) === "ENOENT") continue; // Already removed on an earlier attempt.
						throw error;
					}
					if (stat.isSymbolicLink())
						throw new Error(`refusing to delete through symbolic link "${path}"`);
					if (!stat.isDirectory())
						throw new Error(`expected session storage directory "${path}"`);
				}
			} else if (persistence.name === "session-persistence-jsonl") {
				this.ctx.logger.warn(
					`archive-manager: session "${sessionId}": JSONL directory ownership could not be verified; falling back to artifact-only deletion at "${location.path}" (parent directory retained)`,
				);
			}
			const existed = await pathExists(target.path);
			await rm(target.path, { recursive: true, force: true });
			// stat 不读日志。它抛错只说明无法自证，不能当成已经删掉。
			// 只有删除前目标确实存在、删除后该路径已消失，才接受这次校验失败。
			if (typeof persistence.stat === "function") {
				try {
					const postStat = await persistence.stat(sessionId);
					if (postStat !== void 0) {
						throw new PersistenceStillPresentError(sessionId);
					}
				} catch (error) {
					if (error instanceof PersistenceStillPresentError) throw error;
					const gone = !(await pathExists(target.path));
					if (!existed || !gone) {
						throw new Error(
							`cannot verify removal of session "${sessionId}": stat failed and "${target.path}" was not a present artifact removed by this deletion`,
						);
					}
					this.ctx.logger.warn(
						`archive-manager: session "${sessionId}" stat check after artifact removal failed; removal confirmed because "${target.path}" existed before rm and is gone now: ${String(error)}`,
					);
				}
			}
		} catch (error) {
			const message = `cannot delete session "${sessionId}": cleanup of ${target.kind} "${target.path}" failed; bookkeeping retained for retry`;
			const detail = `${message}: ${String(error)}`;
			this.ctx.logger.warn(`archive-manager: ${detail}`);
			throw new Error(detail, { cause: error });
		}
	}
	/** 把 id 从每个工作区记录中移除，并刷新实体快照。 */
	async removeFromWorkspaceAccounts(sessionId: string) {
		const table = this.requireTable();
		const state = this.requireState();
		for (const workspaceId of state.workspaceIds) {
			const record = table.get(workspaceId);
			if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
			const next = await table.update(workspaceId, (current) => ({
				...current,
				sessionIds: current.sessionIds.filter((id) => id !== sessionId),
				updatedAt: /* @__PURE__ */ new Date().toISOString(),
			}));
			const entity = this.entities.get(workspaceId);
			if (entity !== void 0) entity.record = next;
		}
	}
	/** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话。
	 * 仅头部标记 `origin: "subagent"` 的会话参与：单凭 `parentSession` 有歧义
	 *（fork 分支也携带它），而 fork 分支是独立的用户会话，绝不能被级联删除。 */
	async deleteDescendants(sessionId: string, storedHeaders?: Header[]) {
		try {
			const descendants = [];
			const collected = new Set<string>();
			const sessions = this.ctx.get("sessions");
			if (sessions !== void 0)
				for (const session of sessions.list()) {
					if (
						session.header.parentSession === sessionId &&
						session.header.origin === "subagent"
					) {
						descendants.push(session.id);
						collected.add(session.id);
					}
				}
			// 批次快照只用于找子会话。缺省时逐次列举，便于单会话删除，也让失败的批次预取能按会话重试。
			for (const header of storedHeaders ?? await this.listStoredHeaders()) {
				if (
					header.parentSession === sessionId &&
					header.origin === "subagent" &&
					!collected.has(header.id)
				) {
					descendants.push(header.id);
					collected.add(header.id);
				}
			}
			for (const childId of descendants) {
				try {
					if (!(await this.sessionKnown(childId))) continue;
					await this.deleteSessionCore(childId, storedHeaders);
				} catch (error) {
					this.ctx.logger.warn(
						`archive-manager: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`,
					);
				}
			}
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`,
			);
		}
	}
	/** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
	async cleanSpill(sessionId: string) {
		try {
			const spill = this.ctx.get("spillStore");
			if (spill === void 0 || typeof spill.root !== "string") return;
			await rm(sessionDir(spill.root, sessionId), {
				recursive: true,
				force: true,
			});
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`,
			);
		}
	}

	/**
	 * 判断一个会话是否是真正的母会话已缺失的孤儿子代理：
	 * 1. 必须是子代理：origin === "subagent"（天然排除了普通会话和用户 fork 分支）
	 * 2. 拥有合法的 parentSession 标识
	 * 3. 子代理自身不是正在内存中运行的活跃会话
	 * 4. 母会话在当前列表和内存会话中均不存在，且在磁盘上确证工件已缺失（防止母会话因读取故障被误判为已删）
	 */
	async isOrphanSubagent(header: Header, knownIds: Set<string>): Promise<boolean> {
		if (header.origin !== "subagent") return false;
		const parentId = header.parentSession;
		if (typeof parentId !== "string" || parentId.length === 0) return false;
		if (this.ctx.get("sessions")?.get?.(header.id) !== undefined) return false;
		if (knownIds.has(parentId) || this.ctx.get("sessions")?.get?.(parentId) !== undefined) return false;
		if (!(await this.sessionArtifactMissing(parentId))) return false;
		if (await this.sessionArtifactMissing(header.id)) return false;
		return true;
	}

	/**
	 * 扫描存储中所有母会话已被外部删除的孤儿子代理会话。
	 * 必须满足 origin === "subagent"（包含普通与播种型子代理，排除用户 fork），
	 * 拥有 parentSession，且该母会话在内存与磁盘工件中均确证已不存在。
	 */
	async diagnoseOrphanSubagents(): Promise<{
		count: number;
		items: { sessionId: string; parentSessionId: string; createdAt: number; sizeBytes: number }[];
		totalSizeBytes: number;
	}> {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.list !== "function") {
			return { count: 0, items: [], totalSizeBytes: 0 };
		}
		const storedHeaders = await this.listStoredHeaders();
		const liveSessions = this.ctx.get("sessions")?.list?.() ?? [];
		const knownIds = new Set<string>();
		for (const s of liveSessions) knownIds.add(s.id);
		for (const h of storedHeaders) knownIds.add(h.id);

		const orphans: { sessionId: string; parentSessionId: string; createdAt: number; sizeBytes: number }[] = [];
		let totalSizeBytes = 0;

		for (const header of storedHeaders) {
			if (await this.isOrphanSubagent(header, knownIds)) {
				let sizeBytes = 0;
				try {
					if (typeof persistence.locate === "function") {
						const location = persistence.locate(header);
						if (location !== undefined && typeof location.path === "string") {
							const directory = jsonlSessionDirectory(persistence, header, location);
							const targetPath = directory ?? location.path;
							sizeBytes = await estimatePathSize(targetPath);
						}
					}
				} catch {
					sizeBytes = 0;
				}
				totalSizeBytes += sizeBytes;
				orphans.push({
					sessionId: header.id,
					parentSessionId: header.parentSession as string,
					createdAt: typeof header.createdAt === "number" ? header.createdAt : 0,
					sizeBytes,
				});
			}
		}

		return {
			count: orphans.length,
			items: orphans,
			totalSizeBytes,
		};
	}

	/**
	 * 物理清理孤儿子代理会话。
	 * 支持传入指定的 sessionIds，若未传则清理当前诊断出的全部孤儿子代理。
	 * 显式传入 ID 也会严格校验是否符合孤儿特征，母会话尚存的子代理将被安全跳过。
	 */
	async cleanOrphanSubagents(target?: { sessionIds?: string[] }): Promise<{
		cleanedSessionIds: string[];
		skippedSessionIds: string[];
		failures: { sessionId: string; message: string }[];
	}> {
		return this.enqueueOperation(async () => {
			const candidateIds = target?.sessionIds ?? (await this.diagnoseOrphanSubagents()).items.map((item) => item.sessionId);
			const cleanedSessionIds: string[] = [];
			const skippedSessionIds: string[] = [];
			const failures: { sessionId: string; message: string }[] = [];

			const storedHeaders = await this.listStoredHeaders();
			const liveSessions = this.ctx.get("sessions")?.list?.() ?? [];
			const knownIds = new Set<string>();
			for (const s of liveSessions) knownIds.add(s.id);
			for (const h of storedHeaders) knownIds.add(h.id);

			for (const sessionId of candidateIds) {
				try {
					const header = this.headers?.get(sessionId) ?? storedHeaders.find((h) => h.id === sessionId);
					if (!header || !(await this.isOrphanSubagent(header, knownIds))) {
						skippedSessionIds.push(sessionId);
						continue;
					}

					await this.deleteSessionCore(sessionId, storedHeaders);
					cleanedSessionIds.push(sessionId);
				} catch (error) {
					failures.push({ sessionId, message: errorMessage(error) });
				}
			}

			return { cleanedSessionIds, skippedSessionIds, failures };
		});
	}
};
//#endregion
const workspaceOverlay = Symbol.for("dsh-archive-manager.workspace-overlay");
interface WorkspaceOverlayHost {
	[workspaceOverlay]?: boolean;
}
/**
 * 官方实例自己没有 typertRemote 绑定时补一个：api-gateway 派发 `workspaceRegistry/*`
 * 前会校验实例绑定，缺失时按 `gateway/binding-invalid` 拒绝。绑定同时把
 * `ctx.invocation` 访问器装到根上下文（幂等，跨服务共用）。卸下时删除。
 * `ctx.workspaceRegistry` 是 cordis 的 traceable 代理，而网关拿 `symbols.original`
 * 指向的宿主实例做比较，所以绑定必须落在原始实例上。
 */
const remoteMethodDescriptor = "@deepseek-ai/dsh-typert-protocol/remote-methods";
/**
 * 网关的源码扫描只认原型上的 Remote 标记；缺标记时新加的方法不会被认领。
 * 标记落在官方类原型上（全进程共用），所以只标本插件自己的归档方法，
 * 且跳过宿主已经标过的同名方法，避免标记冲突抛错或覆盖宿主语义。
 */
function markOverlayMethods(registry: object, methods: readonly string[]): () => void {
	const raw = (Reflect.get(registry, symbols.original) as object | undefined) ?? registry;
	const prototype = Object.getPrototypeOf(raw) as object | null;
	if (prototype === null) return () => {};
	const before = Object.getOwnPropertyDescriptor(prototype, remoteMethodDescriptor);
	const marked = new Set<string>();
	for (const marker of (Reflect.get(before?.value ?? {}, "methods") as { method?: unknown }[] | undefined) ?? []) {
		if (typeof marker.method === "string") marked.add(marker.method);
	}
	for (const method of methods) {
		if (marked.has(method)) continue;
		markRemoteMethod(raw, method);
	}
	return () => {
		if (before === undefined) delete (prototype as Record<string, unknown>)[remoteMethodDescriptor];
		else Object.defineProperty(prototype, remoteMethodDescriptor, before);
	};
}
function bindOverlayRemote(registry: object): () => void {
	const raw = (Reflect.get(registry, symbols.original) as object | undefined) ?? registry;
	if (Reflect.get(raw, "typertRemote") !== undefined) return () => {};
	const name = Reflect.get(raw, "name");
	const serviceKey = typeof name === "string" ? name : "workspaceRegistry";
	Reflect.set(raw, "typertRemote", bindTypertRemote(raw, serviceKey));
	return () => {
		Reflect.deleteProperty(raw, "typertRemote");
	};
}
/**
 * 把归档能力装到官方 `workspaceRegistry` 实例上。
 * 不替换服务对象，因此停用时卸下后，已持有该实例的 workspaceController 仍能创建工作区。
 */
export function installArchiveWorkspace(registry: object): () => void {
	const overlay = registry as WorkspaceOverlayHost;
	if (overlay[workspaceOverlay] === true) return () => {};
	// 本插件子类入口（`./workspace`）已在构造函数里装好，不重复叠加。
	if (registry instanceof ArchiveWorkspaceRegistry) return () => {};
	const target = overlay as WorkspaceOverlayHost & Record<string, unknown>;
	const restoreRemote = bindOverlayRemote(registry);
	const originalUnarchive = target.unarchiveSession as (this: object, id: string) => Promise<unknown>;
	const unarchiveDescriptor = Object.getOwnPropertyDescriptor(target, "unarchiveSession");
	const restoredMethods: { name: string; hadOwn: boolean; previous: unknown }[] = [];
	const copiedMethods: string[] = [];
	for (const name of Object.getOwnPropertyNames(ArchiveWorkspaceRegistry.prototype)) {
		if (name === "constructor") continue;
		const method = Reflect.get(ArchiveWorkspaceRegistry.prototype, name);
		if (typeof method !== "function") continue;
		restoredMethods.push({ name, hadOwn: Object.hasOwn(target, name), previous: target[name] });
		if (name === "unarchiveSession") {
			// 保留安装前的有效入口（可能由别的插件包装），只追加远程返回契约。
			Object.defineProperty(target, name, {
				configurable: unarchiveDescriptor?.configurable ?? true,
				enumerable: unarchiveDescriptor?.enumerable ?? true,
				writable: true,
				value: async function (this: InstanceType<WorkspaceConstructor>, sessionId: string) {
					await originalUnarchive.call(this, sessionId);
					return { archivedSessionIds: [...this.requireState().archivedSessionIds] };
				},
			});
		} else target[name] = method;
		copiedMethods.push(name);
	}
	const restoreMarkers = markOverlayMethods(registry, ARCHIVE_REMOTE_METHODS.filter((method) => copiedMethods.includes(method)));
	target[workspaceOverlay] = true;
	return () => {
		if (target[workspaceOverlay] !== true) return;
		restoreMarkers();
		restoreRemote();
		for (const item of restoredMethods.reverse()) {
			if (item.name === "unarchiveSession" && unarchiveDescriptor !== undefined) Object.defineProperty(target, item.name, unarchiveDescriptor);
			else if (item.hadOwn) target[item.name] = item.previous;
			else delete target[item.name];
		}
		delete target[workspaceOverlay];
	};
}
export { ArchiveWorkspaceRegistry, ArchiveWorkspaceRegistry as default };
