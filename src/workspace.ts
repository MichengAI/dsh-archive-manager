import type { Context } from "@deepseek-ai/cordis";
import type { Domain, DomainGlobalSpec } from "@deepseek-ai/dsh-storage-domain";
import type { TypertContribution } from "@deepseek-ai/dsh-typert-registry";
import type { Header, HostContext, PersistenceCompat, SessionsCompat, WorkspaceConstructor } from "./host-compat.js";
import { record, errorMessage, errorCode } from "./contracts.js";
import type { Schema, SessionDetail } from "./contracts.js";
import type { TypertGatewayBinding } from "@deepseek-ai/dsh-typert-protocol";
type BatchTarget = { scope: "all" | "ungrouped" } | { scope: "workspace"; workspaceId: string } | { scope: "sessions"; sessionIds: string[] };
import * as SessionRuntime from "@deepseek-ai/dsh-session";
import { childCatalogFact, prepareAutomationRepair, type RepairFormat } from "./session-repair.js";
import { repairInputSchema, classifySessionError, detailsInputSchema, countConversationTurns, discoveryInvocations, searchInputSchema, previewInputSchema, extractConversation, findContentMatch, previewConversation } from "./archive-discovery.js";
import { lstat, rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { trackTombstone } from "./tombstone.js";
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
 * flush 再 detach；等待投影缓存写入完成；移除归档标记和工作区记账；
 * 删除投影缓存，级联删除 SUBAGENT 子会话并清理 spill；最后才删除转录
 * 目录。fork 分支虽有 `parentSession`，但属于独立用户会话，不参与级联。
 *
 * 转录工件删除成功后才提交父会话记账清理；任一步失败均保留归档标记、工作区
 * 记账和头部索引，以便再次调用同一入口完成删除。SUBAGENT 级联跨多个转录
 * 工件，无法组成事务：子会话可能已先删除，重试会跳过它们并继续处理仍保留的
 * 父会话。
 * 物理删除成功后必须遗忘父类内存索引（headers / sessionPaths /
 * invalidSessionPaths）并打上删除墓碑：父类 sessionKnown 以 headers.has
 * 短路，indexHeaders 只增不减，stale list() 否则会把已删 id 救活，
 * 进而被 archiveSession 重新写回 archivedSessionIds。
 * 墓碑同时记录被删生命周期的日志身份（createdAt/cwd）：其他进程以同 id
 * 重建并落盘新会话时（冷复用），sessionKnown 的探针以身份差异区分新旧
 * 生命周期并撤掉墓碑，避免已重建的会话在本进程永久 UNKNOWN_SESSION。
 * 单会话与批量恢复/删除方法均通过 Typert Remote 暴露给浏览器，并注册到
 * typert.local，避免生产环境只靠 SRC 扫描时 404。
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

/** alpha.1 读 schema.parse；alpha.2 只接受 create()。两套字段一起带上。 */
function strictCodec(typeSymbol: string, schema: Schema<unknown>) {
	return {
		mode: "strict" as const,
		typeSymbol,
		create: () => schema,
		schema,
	};
}

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
/** 头部投影到“日志身份”字段（与投影缓存的 identity 语义一致）。cwd 缺失统一归一为 null，避免一侧带键一侧不带键时的比较歧义。 */
function headerIdentity(header: Header) {
	return {
		createdAt: header.createdAt,
		cwd: header.cwd ?? null,
	};
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
		if (
			value.repairedSessionIds !== void 0 &&
			(!Array.isArray(value.repairedSessionIds) ||
				value.repairedSessionIds.some((id) => typeof id !== "string"))
		)
			throw new TypeError("repairedSessionIds must be a string array");
		return value;
	},
};
/**
 * Host 严格描述符。网关优先读 typert.local，避免 SRC 扫描缓存
 * 或协议包双份导致 /api/workspaceRegistry/deleteSession 在生产环境 404。
 */
const ARCHIVE_MANAGER_INVOCATIONS = [
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
/** 0.1.6 及更早的 generationFormat 自带 createRestore；0.1.7 起用本次修复收集到的直属子会话证据建目录。没有子会话时才传空数组。 */
async function hostRepairFormat(format: RepairFormat | undefined, children: readonly Record<string, unknown>[] = []): Promise<RepairFormat> {
	if (!format || !Number.isInteger(format.currentVersion) || format.currentVersion < 3) throw new Error("当前宿主不支持此修复，请升级 DSH 后重试");
	if (typeof format.createRestore === "function") return format;
	if (typeof format.encodeHeader !== "function" || typeof format.encodeEvent !== "function") throw new Error("当前宿主不支持此修复，请升级 DSH 后重试");
	const catalog = await import("@deepseek-ai/dsh-session-format-catalog");
	if (typeof catalog.createSessionFormatCatalogWithChildren !== "function") throw new Error("当前宿主不支持此修复，请升级 DSH 后重试");
	const bound = catalog.createSessionFormatCatalogWithChildren(children as never);
	return { ...format, createRestore(header: unknown) {
		return bound.createRestore(header, { recovery: "recoverable", validation: "transformed" });
	} } as unknown as RepairFormat;
}
let activeSessionError: (new (sessionId: string, activity: readonly unknown[]) => Error) | null | undefined;
async function activeSessionErrorType() {
	if (activeSessionError !== undefined) return activeSessionError ?? undefined;
	const workspace = await import("@deepseek-ai/dsh-workspace");
	activeSessionError = typeof workspace.WorkspaceActiveSessionError === "function"
		? workspace.WorkspaceActiveSessionError as unknown as new (sessionId: string, activity: readonly unknown[]) => Error
		: null;
	return activeSessionError ?? undefined;
}
function snapshotUsesProjectionKeys(cache: { cachedSnapshot: (...args: never[]) => unknown }) {
	// 只能按形参个数判定：cordis 经 ctx.get 取服务方法时会包成只有 apply 陷阱的
	// shadow method，Function.prototype.toString 只剩 [native code]，正文探测在真实宿主
	// 恒为 false（已实测）。宿主历史形状：0.1.0/0.1.1 为 (meta)=1；0.1.2～0.1.6 为
	// (meta, inheritedEventCount, keys)=3；0.1.7 起为 (meta, keys)=2。形参个数穿过
	// 包装层且不受压缩影响；非 2 的一侧传继承切点即可——1 参宿主会忽略多余实参。
	return cache.cachedSnapshot.length === 2;
}
function projectionSnapshot(cache: { cachedSnapshot(header: Header, inheritedOrKeys?: number | readonly string[]): unknown }, header: Header, inheritedEventCount: number) {
	// 0.1.7 用生命周期身份匹配，第二参数是要查看的投影键；更早宿主用继承切点。
	if (snapshotUsesProjectionKeys(cache)) return cache.cachedSnapshot(header);
	return cache.cachedSnapshot(header, inheritedEventCount);
}
function hostEvent(ctx: HostContext, name: "waterfall" | "parallel") {
	const caller = (ctx as HostContext & { waterfall?: unknown; parallel?: unknown })[name];
	return typeof caller === "function" ? caller as (this: HostContext, ...args: unknown[]) => Promise<unknown> : undefined;
}
var ArchiveWorkspaceRegistry = class extends (WorkspaceRegistry as unknown as WorkspaceConstructor) {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache",
		"typert",
	];
	/** 本进程内已物理删除的会话；阻止父类把 stale list() 重新编入索引。 */
	deletedSessionIds = /* @__PURE__ */ new Set<string>();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder: string[] = [];
	/** 墓碑上限：足够挡住 stale list()，又避免长驻进程无限增长。 */
	deletedSessionTombstoneLimit = 4096;
	/** 被删生命周期的日志身份（createdAt/cwd）：冷复用探针区分“同 id 新会话”与 stale list() 的依据。 */
	deletedIdentities = new Map<string, ReturnType<typeof headerIdentity>>();
	archivedSessionPathIndex = new Map<string, string>();
	archivedSessionPathIndexKey: string[] | undefined;
	declare typertRemote: TypertGatewayBinding<this>;
	declare favoriteDomainPromise: Promise<Domain<typeof favoriteDomainSpec>> | undefined;
	constructor(ctx: Context) {
		super(ctx);
		const indexedPath = this.host.sessionPath;
		this.host.sessionPath = (id) => {
			const path = indexedPath(id);
			if (path !== undefined) return path;
			// 只保护仍在归档集合里、但路径索引还没编上的记账，避免官方 mutate 把归档会话写丢。
			// 未归档会话仍走官方过滤，不改工作区成员语义。
			if (this.invalidSessionPaths.has(id)) return undefined;
			try {
				return this.archivedWorkspacePath(id);
			} catch {
				return undefined;
			}
		};
		this.typertRemote = bindTypertRemote(this, this.name);
		markRemoteMethod(this, "unarchiveSession");
		markRemoteMethod(this, "deleteSession");
		markRemoteMethod(this, "deleteArchivedSessions");
		markRemoteMethod(this, "archivedSessionMetadata");
		markRemoteMethod(this, "favoriteSessions");
		markRemoteMethod(this, "setSessionFavorite");
		markRemoteMethod(this, "searchArchivedContent");
        markRemoteMethod(this, "searchSessionContent");
		markRemoteMethod(this, "previewArchivedSession");
        markRemoteMethod(this, "sessionDetails");
        markRemoteMethod(this, "diagnoseSession");
        markRemoteMethod(this, "repairSession");
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
        if (!persistence || (typeof persistence.readFrom !== "function" && typeof persistence.open !== "function")) throw new Error("当前宿主不支持只读会话，请打开完整会话查看");
        return (await this.readStoredProjectionSource(persistence, sessionId)).events;
    }
    /** 只读取当前宿主已知会话；路径由宿主定位，不根据错误文本或 ID 拼接。 */
    async sessionDetails(input: unknown) {
        const { sessionIds } = detailsInputSchema.parse(input);
        const items = [];
        for (const sessionId of sessionIds) {
            const item: SessionDetail = { sessionId, turnCount: null, path: null, error: "" };
            try {
                if (!(await this.sessionKnown(sessionId))) throw new Error("会话不存在，请刷新列表");
                const header = await this.readSessionHeader(sessionId);
                if (Number.isSafeInteger(header.createdAt) && header.createdAt >= 0) item.createdAt = header.createdAt;
                const persistence = this.ctx.get("sessionPersistence");
                try {
                    const location = typeof persistence?.locate === "function" ? await persistence.locate(header) : undefined;
                    if (typeof location?.path === "string") {
                        // 新版 locate 指向当前代际目标，旧日志可能尚未生成该文件；官方布局复制会话目录。
                        const path = jsonlSessionDirectory(persistence, header, location) ?? location.path;
                        await lstat(path);
                        item.path = path;
                    }
                } catch (error) { item.error = "路径不可用：" + errorMessage(error).slice(0, 350); }
                item.turnCount = countConversationTurns(await this.readConversationEvents(sessionId));
            } catch (error) { item.error = errorMessage(error).slice(0, 500); }
            items.push(item);
        }
        return { items };
    }
    /** 诊断与执行共用同一工件校验；客户端不能提供文件路径。 */
    async sessionRepairPlan(sessionId: string) {
        if (!(await this.sessionKnown(sessionId))) throw new Error("会话不存在，请刷新列表");
        await this.ensureSessionRepairIdle(sessionId);
        const persistence = this.ctx.get("sessionPersistence");
        const header = await this.readSessionHeader(sessionId);
        const location = await persistence?.locate?.(header);
        const directory = location && jsonlSessionDirectory(persistence, header, location);
        const version = persistence.generationFormat?.currentVersion;
        const currentGeneration = Number.isInteger(version) && version >= 3 ? new RegExp(`^session\\.v${version}\\.jsonl(?:\\.zstd)?$`) : undefined;
        if (!directory || currentGeneration === undefined || !currentGeneration.test(basename(location.path))) throw new Error("当前存储后端或格式不支持自动修复");
        const format = await hostRepairFormat(persistence.generationFormat, await this.childCatalogFacts(sessionId));
        return prepareAutomationRepair({ directory, target: location.path, sessionId, format: { ...format, validateBytes: async bytes => {
            if (location.path.endsWith(".zstd")) {
                if (typeof persistence.readZstdPrefix !== "function") throw new Error("当前宿主缺少压缩日志校验能力");
                const parsed = await persistence.readZstdPrefix(bytes);
                if (parsed.meta.id !== sessionId || parsed.tornTruncateTo !== undefined) throw new Error("生成的压缩日志未通过宿主校验");
            }
        }, validate: artifact => {
            if (typeof SessionRuntime.Session?.fromRestore !== "function") throw new Error("当前宿主缺少完整会话校验能力");
            SessionRuntime.Session.fromRestore(artifact.header.id, artifact.events, artifact.header, artifact.inheritedEventCount, "detached");
        } } });
    }
    async ensureSessionRepairIdle(sessionId: string) {
        if (!this.requireState().archivedSessionIds.includes(sessionId)) throw new Error("请先归档会话，再进行修复");
        if (this.ctx.get("sessions")?.get(sessionId)) throw new Error("会话仍在宿主内打开，请关闭会话并重启 DSH 后修复");
    }
    async diagnoseSession(input: unknown) {
        const { sessionId } = repairInputSchema.parse(input);
        const result = { code: "unknown", sessionId, repairable: false, repaired: false, token: "", count: 0, reason: "", advice: "" };
        try {
            if (!(await this.sessionKnown(sessionId))) throw new Error("会话不存在，请刷新列表");
            await this.readConversationEvents(sessionId);
            return { ...result, code: "healthy", reason: "会话已可正常读取", advice: "刷新会话详情即可，无需修复。" };
        } catch (error) {
            const diagnostic = classifySessionError(error);
            result.code = diagnostic.code; result.reason = diagnostic.reason; result.advice = diagnostic.advice;
            // 文案仅用于说明；工件结构和宿主验证才决定是否可修复。
        }
        try {
            const plan = await this.sessionRepairPlan(sessionId);
            return { ...result, code: plan.correctingFrame ? "ready-frame" : "ready", repairable: true, token: plan.token, count: plan.count,
                reason: plan.correctingFrame ? "发现旧版修复的压缩帧问题，已通过宿主读取校验" : `发现 ${plan.count} 处旧自动化来源，已通过宿主格式转换校验`,
                advice: "将来源转换为 dsh-automation 插件归属，保留任务信息与正文，生成新版日志；旧日志原样保留。请确保其他 DSH 进程未打开该会话。" };
        } catch (error) {
            // 不能修复不等于原因未知：保留已识别分类，限制详情追加在建议中。
            return { ...result, code: result.code === "unknown" ? "blocked" : result.code,
                advice: (result.advice + " 暂不能自动修复：" + errorMessage(error)).slice(0, 1000) };
        }
    }
    async repairSession(input: unknown) {
        const { sessionId, token } = repairInputSchema.parse(input);
        if (!token) throw new Error("请先诊断，再确认修复");
        return this.enqueueOperation(async () => {
            const plan = await this.sessionRepairPlan(sessionId);
            const persistence = this.ctx.get("sessionPersistence");
            if (typeof persistence.acquireLease !== "function") throw new Error("当前宿主缺少会话写锁，无法安全修复");
            const lease = await persistence.acquireLease(sessionId, undefined, dirname(plan.source));
            try { await plan.publish(token, () => this.ensureSessionRepairIdle(sessionId)); }
            finally { await lease.release(); }
            try { await this.readConversationEvents(sessionId); }
            catch { return { sessionId, repairable: false, repaired: false, token: "", count: plan.count, code: "published-unreadable", reason: "新版日志已生成，但宿主复读未通过", advice: "旧日志仍保留，请重启 DSH 后重新诊断；不要反复修复或删除日志。" }; }
            return { sessionId, repairable: false, repaired: true, token: "", count: plan.count, code: "repaired", reason: "修复完成，宿主已能正常读取", advice: "旧日志保留，归档状态不变；可以重新预览或打开会话。" };
        });
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
	/** 归档集合未变时复用反查表，避免每次 sessionPath 都扫全部工作区记账。 */
	archivedWorkspacePath(sessionId: string) {
		const state = this.requireState();
		if (!state.archivedSessionIds.includes(sessionId)) return undefined;
		if (this.archivedSessionPathIndexKey !== state.archivedSessionIds) {
			const index = new Map();
			const archived = new Set(state.archivedSessionIds);
			const table = this.requireTable();
			for (const workspaceId of state.workspaceIds) {
				const record = table.get(workspaceId);
				if (record === undefined) continue;
				for (const id of record.sessionIds) {
					if (archived.has(id)) index.set(id, record.path);
				}
			}
			this.archivedSessionPathIndex = index;
			this.archivedSessionPathIndexKey = state.archivedSessionIds;
		}
		return this.archivedSessionPathIndex.get(sessionId);
	}
	/**
	 * 只有 persistence.stat 明确说文件不在时才从持久集合摘掉。
	 * list/header 读不出不等于文件没了；没有 stat 时宁可不落盘删除。
	 */
	async sessionArtifactMissing(sessionId: string) {
		const persistence = this.ctx.get("sessionPersistence");
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
				if (this.deletedSessionIds.has(sessionId)) {
					if (await this.coldReuseKnown(sessionId)) kept.push(sessionId);
					continue;
				}
				if (this.headers.has(sessionId) || listed.has(sessionId)) {
					kept.push(sessionId);
					continue;
				}
				if (!(await this.sessionArtifactMissing(sessionId))) kept.push(sessionId);
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
	/**
	 * 归档设置页创建时间排序所需的最小元数据。老用户可能仍有会话原文和
	 * 归档标记、却没有投影缓存；这里按需从完整日志重建一次，再通知客户端
	 * 刷新会话列表。已有缓存不读原文，新老 DSH 的缓存布局都走同一 put。
	 * 读取前只清掉文件已确认不存在的归档标记。
	 */
	async archivedSessionMetadata() {
		await this.pruneUnknownArchivedSessionIds();
		const items = [];
		const repairedSessionIds = [];
		for (const sessionId of this.requireState().archivedSessionIds) {
			try {
				const header = await this.readSessionHeader(sessionId);
				if (await this.repairArchivedProjection(header))
					repairedSessionIds.push(sessionId);
				if (
					typeof header.createdAt === "number" &&
					Number.isFinite(header.createdAt)
				)
					items.push({ sessionId, createdAt: header.createdAt });
			} catch (error) {
				this.ctx.logger.warn(
					`archive-manager: could not read creation time for archived session "${sessionId}": ${String(error)}`,
				);
			}
		}
		return {
			items,
			...(repairedSessionIds.length === 0 ? {} : { repairedSessionIds }),
		};
	}
	/** 从会话原文补齐缺失的派生缓存；任何失败都只降级为原有无摘要列表。 */
	async repairArchivedProjection(header: Header) {
		const cache = this.ctx.get("sessionProjectionCache");
		const persistence = this.ctx.get("sessionPersistence");
		const projections = this.ctx.get("sessionProjections");
		if (
			cache === void 0 ||
			typeof cache.cachedSnapshot !== "function" ||
			typeof cache.put !== "function"
		)
			return false;
		if (
			persistence === void 0 ||
			(typeof persistence.readFrom !== "function" &&
				typeof persistence.open !== "function") ||
			projections === void 0 ||
			typeof projections.restore !== "function"
		)
			return false;
		try {
			// 未播种会话的继承事件数恒为零，先查缓存可避免读取完整会话原文。
			// 0.1.7 起第二参数是投影键，不再是继承切点。
			if (!header.isSeeded && projectionSnapshot(cache, header, 0) !== void 0)
				return false;
			const stored = await this.readStoredProjectionSource(persistence, header.id);
			const meta = stored.meta ?? header;
			if (meta.isSeeded === true && stored.inheritedEventCount === void 0) {
				this.ctx.logger.warn(
					`archive-manager: projection repair for seeded archived session "${header.id}" skipped because its inherited event count is unavailable`,
				);
				return false;
			}
			const inheritedEventCount = stored.inheritedEventCount ?? 0;
			if (meta.isSeeded !== true && inheritedEventCount !== 0) {
				this.ctx.logger.warn(
					`archive-manager: projection repair for unseeded archived session "${header.id}" skipped because its inherited event count is not zero`,
				);
				return false;
			}
			if (projectionSnapshot(cache, meta, inheritedEventCount) !== void 0) return false;
			const restored = projections.restore(
				{},
				stored.events,
				0,
				meta,
				inheritedEventCount,
			);
			if (
				restored === void 0 ||
				typeof restored !== "object" ||
				restored.checkpoint === void 0
			)
				return false;
			await cache.put(
				header.id,
				{
					// 支持的宿主头部均有 version；新版缓存校验格式代际，旧版逐字段比较忽略此键。
					formatVersion: meta.version,
					createdAt: meta.createdAt,
					...(meta.cwd === void 0 ? {} : { cwd: meta.cwd }),
					isSeeded: meta.isSeeded ?? false,
					inheritedEventCount,
				},
				restored.checkpoint,
			);
			return true;
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: projection repair for archived session "${header.id}" failed: ${String(error)}`,
			);
			return false;
		}
	}
	/** 新版读句柄必须关闭；旧版仍沿用 readFrom，避免激活 Agent 或写入会话日志。 */
	async readStoredProjectionSource(persistence: PersistenceCompat, sessionId: string) {
		if (typeof persistence.readFrom === "function")
			return persistence.readFrom(sessionId, 0);
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
	/**
	 * 把一个已知会话加入注册表全局归档集合。已归档的 id 不写入；
	 * 未知 id 直接跳过，不抛 `UNKNOWN_SESSION`，避免把幽灵 id 写进集合。
	 * @param sessionId - 要归档的会话。
	 */
	async archiveSession(sessionId: string, options?: { stopActivity?: boolean }) {
		return this.enqueueOperation(async () => {
			if (this.requireState().archivedSessionIds.includes(sessionId)) return;
			if (!(await this.sessionKnown(sessionId))) return;
			const stopActivity = options?.stopActivity === true;
			const ActiveSession = await activeSessionErrorType();
			if (!stopActivity && ActiveSession !== undefined) {
				const activity = await this.sessionActivity(sessionId);
				if (activity.length > 0) throw new ActiveSession(sessionId, activity);
			}
			const state = this.requireState();
			const pinnedSessionIds = Array.isArray(state.pinnedSessionIds)
				? state.pinnedSessionIds.filter((id) => id !== sessionId)
				: undefined;
			await this.setState({
				...state,
				archivedSessionIds: [...state.archivedSessionIds, sessionId],
				...(pinnedSessionIds === undefined ? {} : { pinnedSessionIds }),
			});
			if (stopActivity && ActiveSession !== undefined) await this.stopSessionActivity(sessionId);
		});
	}
	/** 0.1.7 起宿主用 waterfall 报告仍在运行的回合、子代理、任务和提醒。旧宿主没有该事件。 */
	async sessionActivity(sessionId: string) {
		const waterfall = hostEvent(this.ctx, "waterfall");
		if (waterfall === undefined) return [];
		const activity = await waterfall.call(this.ctx, "workspace/session-activity", { sessionId }, () => Promise.resolve([]));
		return Array.isArray(activity) ? activity : [];
	}
	/** 归档已经写入后再请求停止；提供方失败只记日志，不撤回归档。 */
	async stopSessionActivity(sessionId: string) {
		const parallel = hostEvent(this.ctx, "parallel");
		if (parallel === undefined) return;
		try {
			await parallel.call(this.ctx, "workspace/session-stop", { sessionId });
		} catch (error) {
			const failures = error instanceof AggregateError ? error.errors : [error];
			for (const failure of failures) {
				this.ctx.logger.warn(`archive-manager: stopping session "${sessionId}" for archive failed: ${String(failure)}`);
			}
		}
	}
	/**
	 * 把一个会话移出注册表全局归档集合，恢复其正常可见性（其记账位从未
	 * 移动，会话在原工作区位置重新出现）。与官方一致：不做会话存在性检查，
	 * 因为从集合摘掉 id 不会引入未知引用。孤儿归档标记也会被清掉；
	 * 未归档的 id（含不存在的 id）不写入即返回。
	 * @param sessionId - 要取消归档的会话。
	 * @returns 更新后的完整归档集合。
	 */
	async unarchiveSession(sessionId: string) {
		return this.enqueueOperation(async () => {
			const state = this.requireState();
			if (!state.archivedSessionIds.includes(sessionId))
				return { archivedSessionIds: [...state.archivedSessionIds] };
			const next = {
				...state,
				archivedSessionIds: state.archivedSessionIds.filter(
					(id) => id !== sessionId,
				),
			};
			await this.setState(next);
			await this.restoreWorkspaceMembership(sessionId);
			return { archivedSessionIds: [...next.archivedSessionIds] };
		});
	}
	/**
	 * 恢复后重新编入路径索引；若会话已不在任何工作区记账但 cwd 仍对应某工作区，
	 * 则挂回去，避免「恢复并打开」时官方成员过滤把会话从原工作区抹掉。
	 */
	async restoreWorkspaceMembership(sessionId: string) {
		let header;
		try {
			header = await this.readSessionHeader(sessionId);
			await this.indexHeader(header);
		} catch {
			return;
		}
		const path = this.sessionPaths.get(sessionId);
		if (path === undefined) return;
		const table = this.requireTable();
		for (const workspaceId of this.requireState().workspaceIds) {
			const record = table.get(workspaceId);
			if (record === undefined || record.path !== path) continue;
			if (record.sessionIds.includes(sessionId)) return;
			const entity = this.entities.get(workspaceId);
			if (entity !== undefined) await entity.attachSession(sessionId);
			return;
		}
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
			for (const sessionId of requestedSessionIds) {
				try {
					const result = await this.deleteSessionCore(sessionId);
					if (result?.skipped) skippedSessionIds.push(sessionId);
					else deletedSessionIds.push(sessionId);
				} catch (error) {
					failures.push({ sessionId, message: String(error) });
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
	/**
	 * 清理已无转录的陈旧归档项。缓存墓碑只在清除在途写入期间短暂持有：
	 * workspace 没有可记录的旧 header 身份，永久保留它会挡住未来的冷复用。
	 * 归档标记最后清除，前序可失败步骤出错时批量入口仍能再次命中。
	 */
	async cleanupUnknownArchivedSession(sessionId: string) {
		const projCache = this.ctx.get("sessionProjectionCache");
		await projCache?.whenIdle?.();
		if (projCache !== void 0) {
			await projCache.delete(sessionId);
			// 等待删除期间可能已进入的写回观察到墓碑并完成补删，再允许
			// 同 id 的未来新生命周期写入缓存。
			await projCache.whenIdle?.();
			projCache.clearTombstone?.(sessionId);
		}
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
	async deleteSessionCore(sessionId: string) {
		if (!(await this.sessionKnown(sessionId))) {
			await this.cleanupUnknownArchivedSession(sessionId);
			return { deleted: true, skipped: true };
		}
		const sessions = this.ctx.get("sessions");
		const live = sessions?.get(sessionId);
		// 先记录被删生命周期的日志身份：目录删除后头部不可再读，
		// 冷复用探针（sessionKnown 墓碑分支）靠它区分同 id 的新生命周期。
		const deletedHeader = this.headers.get(sessionId) ?? live?.header;
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
		// dispose 的写后落盘必须先于缓存行删除完成，
		// 否则该行会在删除之后被写回（复活）。
		await projCache?.whenIdle?.();
		if (projCache !== void 0) await projCache.delete(sessionId);
		await this.deleteDescendants(sessionId);
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
		if (deletedHeader !== void 0)
			this.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
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
	/**
	 * 从父类内存索引中遗忘已删除会话，并阻止后续 indexHeaders 把它加回。
	 * 实时会话以同 id 重新出现时（自定义 id 复用）会撤掉墓碑。
	 */
	clearTombstone(sessionId: string) {
		this.deletedSessionIds.delete(sessionId);
		this.deletedIdentities.delete(sessionId);
		const idx = this.deletedSessionOrder.indexOf(sessionId);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
		// workspace 与 projection-cache 共同描述同一删除生命周期；新生命周期
		// 被接纳时必须同步撤销两处墓碑，否则缓存写入仍会永久被拦截。
		this.ctx.get("sessionProjectionCache")?.clearTombstone?.(sessionId);
	}
	forgetIndexedSession(sessionId: string) {
		for (const evicted of trackTombstone(
			this.deletedSessionIds,
			this.deletedSessionOrder,
			sessionId,
			this.deletedSessionTombstoneLimit,
		))
			this.deletedIdentities.delete(evicted);
		this.headers.delete(sessionId);
		this.sessionPaths.delete(sessionId);
		this.invalidSessionPaths.delete(sessionId);
	}
	/**
	 * 已删除会话对归档/删除入口都视为未知。实时复用同一 id 时撤墓碑，
	 * 避免挡住新会话。
	 */
	async sessionKnown(id: string) {
		if (this.ctx.get("sessions")?.get(id) !== void 0) {
			this.clearTombstone(id);
			return true;
		}
		if (this.deletedSessionIds.has(id)) return this.coldReuseKnown(id);
		return super.sessionKnown(id);
	}
	/**
	 * 墓碑分支的冷复用探针：其他进程以同 id 重建并落盘的新会话（日志身份
	 * 不同）撤墓碑放行并重新编入索引；stale list() 里同生命周期的旧头部
	 * 仍视为未知。身份不可考（删除时未取到头部）时保守维持未知。
	 */
	async coldReuseKnown(id: string) {
		const deletedIdentity = this.deletedIdentities.get(id);
		if (deletedIdentity === void 0) return false;
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.list !== "function")
			return false;
		let header;
		try {
			header = (await this.listStoredHeaders()).find((item) => item.id === id);
		} catch (error) {
			this.ctx.logger.warn(
				`archive-manager: cold-reuse probe for "${id}" failed: ${String(error)}`,
			);
			return false;
		}
		if (header === void 0) return false;
		const listed = headerIdentity(header);
		if (
			listed.createdAt === deletedIdentity.createdAt &&
			listed.cwd === deletedIdentity.cwd
		)
			return false;
		this.clearTombstone(id);
		await this.indexHeader(header);
		return true;
	}
	/**
	 * 父类 indexHeaders 只增不减；跳过墓碑 id，避免 stale persistence.list()
	 * 把已删除会话重新编入 headers。
	 */
	async indexHeader(header: Header) {
		if (this.deletedSessionIds.has(header.id)) return;
		return super.indexHeader(header);
	}
	/** 统一旧版头部数组与 0.1.3 的持久化快照，供父类索引和本插件枚举共用。 */
	async listStoredHeaders() {
		return (await this.ctx.sessionPersistence.list()).map(
			(item) => "header" in item && item.header ? item.header : item as Header,
		);
	}
	async indexHeaders(items: (Header | { header: Header })[]) {
		for (const item of items) await this.indexHeader("header" in item && item.header ? item.header : item as Header);
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
		const header = await this.readSessionHeader(sessionId);
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
			await rm(target.path, { recursive: true, force: true });
			// 新版 locate() 只是当前代际的诊断路径；以存储观察确认删除已生效，
			// 避免不存在的目标被 force 忽略后，仍把可读会话记为已删除。
			if (
				typeof persistence.stat === "function" &&
				(await persistence.stat(sessionId)) !== void 0
			) {
				throw new Error(
					`session "${sessionId}" is still present in persistence after artifact removal`,
				);
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
	/** 修复父日志前收集直属 subagent 的目录证据。读不出来的子日志跳过，不把其他子会话一起丢掉。 */
	async childCatalogFacts(sessionId: string) {
		const ids = new Set<string>();
		const sessions = this.ctx.get("sessions");
		if (typeof sessions?.list === "function") {
			for (const session of sessions.list()) {
				const header = session?.header;
				if (header?.parentSession === sessionId && header.origin === "subagent" && typeof session.id === "string") ids.add(session.id);
			}
		}
		try {
			for (const header of await this.listStoredHeaders()) {
				if (header.parentSession === sessionId && header.origin === "subagent") ids.add(header.id);
			}
		} catch (error) {
			this.ctx.logger.warn(`archive-manager: child header list for "${sessionId}" failed: ${String(error)}`);
		}
		const persistence = this.ctx.get("sessionPersistence");
		const facts = [];
		for (const childId of ids) {
			try {
				if (persistence === undefined) continue;
				const stored = await this.readStoredProjectionSource(persistence, childId);
				const fact = childCatalogFact(stored.meta, stored.events, stored.inheritedEventCount ?? 0);
				if (fact !== undefined) facts.push(fact);
			} catch (error) {
				this.ctx.logger.warn(`archive-manager: child catalog fact for "${childId}" skipped: ${String(error)}`);
			}
		}
		return facts;
	}
	/** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话。
	 * 仅头部标记 `origin: "subagent"` 的会话参与：单凭 `parentSession` 有歧义
	 *（fork 分支也携带它），而 fork 分支是独立的用户会话，绝不能被级联删除。 */
	async deleteDescendants(sessionId: string) {
		try {
			const descendants = [];
			const sessions = this.ctx.get("sessions");
			if (sessions !== void 0)
				for (const session of sessions.list()) {
					if (
						session.header.parentSession === sessionId &&
						session.header.origin === "subagent"
					)
						descendants.push(session.id);
				}
			for (const header of await this.listStoredHeaders()) {
				if (
					header.parentSession === sessionId &&
					header.origin === "subagent" &&
					!descendants.includes(header.id)
				)
					descendants.push(header.id);
			}
			for (const childId of descendants) {
				try {
					if (!(await this.sessionKnown(childId))) continue;
					await this.deleteSessionCore(childId);
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
};
//#endregion
export { ArchiveWorkspaceRegistry, ArchiveWorkspaceRegistry as default };
