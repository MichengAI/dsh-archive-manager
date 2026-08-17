import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import {
	WorkspaceRegistry
} from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { trackTombstone } from "./tombstone.js";
//#region lib/types/index.js
/**
* dsh-archive-manager 宿主侧归档会话管理。
*
* `deleteSession(sessionId)` 的顺序即语义：校验已知会话；实时会话先
* flush 再 detach；等待投影缓存写入完成；移除归档标记和工作区记账；
* 删除投影缓存，级联删除 SUBAGENT 子会话并清理 spill；最后才删除转录
* 目录。fork 分支虽有 `parentSession`，但属于独立用户会话，不参与级联。
*
* 所有可失败的持久化清理都先于不可逆的物理删除。此前任一步失败时，
* 转录仍保留，可重试删除；物理删除失败时记录残留路径供人工排查。
* 物理删除成功后必须遗忘父类内存索引（headers / sessionPaths /
* invalidSessionPaths）并打上删除墓碑：父类 sessionKnown 以 headers.has
* 短路，indexHeaders 只增不减，stale list() 否则会把已删 id 救活，
* 进而被 archiveSession 重新写回 archivedSessionIds。
* 墓碑同时记录被删生命周期的日志身份（createdAt/cwd）：其他进程以同 id
* 重建并落盘新会话时（冷复用），sessionKnown 的探针以身份差异区分新旧
* 生命周期并撤掉墓碑，避免已重建的会话在本进程永久 UNKNOWN_SESSION。
* `unarchiveSession` 与 `deleteSession` 通过 Typert Remote 暴露给浏览器，并注册到 typert.local，避免生产环境只靠 SRC 扫描时 404。
*/
function markRemoteMethod(instance, method) {
	// 模拟 TS 装饰器管线 `@Remote(method)`：`Remote` 返回标准方法装饰器，
	// 这里构造一个 addInitializer 立即以 `this` = instance 执行的装饰器上下文。
	const context = {
		private: false,
		static: false,
		name: method,
		addInitializer(fn) {
			fn.call(instance);
		}
	};
	Remote(method)(void 0, context);
}
function unknownSessionMessage(sessionId) {
	return `unknown session "${sessionId}" (UNKNOWN_SESSION)`;
}
var ArchiveUnknownSessionError = class extends Error {
	sessionId;
	constructor(sessionId) {
		super(unknownSessionMessage(sessionId));
		this.sessionId = sessionId;
		this.name = "ArchiveUnknownSessionError";
	}
}
/** 头部投影到“日志身份”字段（与投影缓存的 identity 语义一致）。cwd 缺失统一归一为 null，避免一侧带键一侧不带键时的比较歧义。 */
function headerIdentity(header) {
	return {
		createdAt: header.createdAt,
		cwd: header.cwd ?? null
	};
}
const sessionIdSchema = {
	parse(value) {
		if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
		return value;
	}
};
const archivedSetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		const ids = value.archivedSessionIds;
		if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		return value;
	}
};
const deletedSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
		return value;
	}
};
/**
* Host 严格描述符。网关优先读 typert.local，避免 SRC 扫描缓存
* 或协议包双份导致 /api/workspaceRegistry/deleteSession 在生产环境 404。
*/
const ARCHIVE_MANAGER_INVOCATIONS = [
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/unarchiveSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "unarchiveSession",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "@michengai/dsh-archive-manager/types#ArchivedSessionIds",
			schema: archivedSetSchema
		},
		sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "@michengai/dsh-archive-manager#workspaceRegistry/deleteSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteSession",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "@michengai/dsh-archive-manager/types#Deleted",
			schema: deletedSchema
		},
		sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
	}
];
const ARCHIVE_MANAGER_TYPERT = {
	package: "@michengai/dsh-archive-manager",
	face: "host",
	schemas: [],
	model: { services: [], events: [], objects: [] },
	invocations: ARCHIVE_MANAGER_INVOCATIONS
};
function registerHostRemote(ctx) {
	const existing = ctx.get("typert");
	if (existing !== undefined) {
		existing.register(ARCHIVE_MANAGER_TYPERT);
		return;
	}
	ctx.inject(["typert"], (typertCtx) => {
		typertCtx.typert.register(ARCHIVE_MANAGER_TYPERT);
	});
}
var ArchiveWorkspaceRegistry = class extends WorkspaceRegistry {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache",
		"typert"
	];
	/** 本进程内已物理删除的会话；阻止父类把 stale list() 重新编入索引。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	/** 墓碑上限：足够挡住 stale list()，又避免长驻进程无限增长。 */
	deletedSessionTombstoneLimit = 4096;
	/** 被删生命周期的日志身份（createdAt/cwd）：冷复用探针区分“同 id 新会话”与 stale list() 的依据。 */
	deletedIdentities = /* @__PURE__ */ new Map();
	constructor(ctx) {
		super(ctx);
		this.typertRemote = bindTypertRemote(this, this.name);
		markRemoteMethod(this, "unarchiveSession");
		markRemoteMethod(this, "deleteSession");
		registerHostRemote(this.ctx);
	}
	/**
	* 把一个会话移出注册表全局归档集合，恢复其正常可见性（其记账位从未
	* 移动，会话在原工作区位置重新出现）。幂等：未归档的已知会话直接返回
	* 当前集合不写入；未知会话与 `archiveSession` 一样抛错。
	* @param sessionId - 要取消归档的会话。
	* @returns 更新后的完整归档集合。
	*/
	async unarchiveSession(sessionId) {
		return this.enqueueOperation(async () => {
			if (!await this.sessionKnown(sessionId)) throw new ArchiveUnknownSessionError(sessionId);
			const state = this.requireState();
			if (!state.archivedSessionIds.includes(sessionId)) return { archivedSessionIds: [...state.archivedSessionIds] };
			const next = {
				...state,
				archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
			};
			await this.setState(next);
			return { archivedSessionIds: [...next.archivedSessionIds] };
		});
	}
	/**
	* 永久删除一个会话及其全部痕迹（转录目录、工作区记账、归档标记、
	* 投影缓存行）。
	* @param sessionId - 要删除的会话。
	* @returns 持久化完成后的 `{ deleted: true }`。
	* @throws {@link ArchiveUnknownSessionError} 会话未知时抛出。
	*/
	async deleteSession(sessionId) {
		return this.enqueueOperation(() => this.deleteSessionCore(sessionId));
	}
	/** 串行化后的删除主体（级联路径复用：它已持有操作链，绝不能再入队）。 */
	async deleteSessionCore(sessionId) {
		if (!await this.sessionKnown(sessionId)) throw new ArchiveUnknownSessionError(sessionId);
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
		} else if (sessions !== void 0) await this.publishColdSessionRemoval(sessionId, sessions);
		const projCache = this.ctx.get("sessionProjectionCache");
		// dispose 的写后落盘必须先于缓存行删除完成，
		// 否则该行会在删除之后被写回（复活）。
		await projCache?.whenIdle?.();
		// 物理删除不可逆：先完成所有可失败的持久化清理，失败时仍可重试。
		const state = this.requireState();
		if (state.archivedSessionIds.includes(sessionId)) {
			await this.setState({
				...state,
				archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
			});
		}
		await this.removeFromWorkspaceAccounts(sessionId);
		if (projCache !== void 0) await projCache.delete(sessionId);
		await this.deleteDescendants(sessionId);
		await this.cleanSpill(sessionId);
		await this.removeTranscriptDirectory(sessionId);
		// 物理删除已成功：此时再清父类索引。失败时保留索引，便于重试。
		this.forgetIndexedSession(sessionId);
		if (deletedHeader !== void 0) this.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
		return { deleted: true };
	}
	/**
	* 从父类内存索引中遗忘已删除会话，并阻止后续 indexHeaders 把它加回。
	* 实时会话以同 id 重新出现时（自定义 id 复用）会撤掉墓碑。
	*/
	clearTombstone(sessionId) {
		this.deletedSessionIds.delete(sessionId);
		this.deletedIdentities.delete(sessionId);
		const idx = this.deletedSessionOrder.indexOf(sessionId);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
	}
	forgetIndexedSession(sessionId) {
		for (const evicted of trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, sessionId, this.deletedSessionTombstoneLimit)) this.deletedIdentities.delete(evicted);
		this.headers.delete(sessionId);
		this.sessionPaths.delete(sessionId);
		this.invalidSessionPaths.delete(sessionId);
	}
	/**
	* 已删除会话对归档/删除入口都视为未知。实时复用同一 id 时撤墓碑，
	* 避免挡住新会话。
	*/
	async sessionKnown(id) {
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
	async coldReuseKnown(id) {
		const deletedIdentity = this.deletedIdentities.get(id);
		if (deletedIdentity === void 0) return false;
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.list !== "function") return false;
		let header;
		try {
			header = (await persistence.list()).find((item) => item.id === id);
		} catch (error) {
			this.ctx.logger.warn(`archive-manager: cold-reuse probe for "${id}" failed: ${String(error)}`);
			return false;
		}
		if (header === void 0) return false;
		const listed = headerIdentity(header);
		if (listed.createdAt === deletedIdentity.createdAt && listed.cwd === deletedIdentity.cwd) return false;
		this.clearTombstone(id);
		await this.indexHeader(header);
		return true;
	}
	/**
	* 父类 indexHeaders 只增不减；跳过墓碑 id，避免 stale persistence.list()
	* 把已删除会话重新编入 headers。
	*/
	async indexHeader(header) {
		if (this.deletedSessionIds.has(header.id)) return;
		return super.indexHeader(header);
	}
	/** 为未处于实时状态的持久化会话发布相同的移除事件。 */
	async publishColdSessionRemoval(sessionId, sessions) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.prepare !== "function") return;
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
			this.ctx.logger.warn(`archive-manager: could not publish removal for stored session "${sessionId}": ${String(error)}`);
		}
	}
	/** 删除会话的转录目录；仅在所有记账清理完成后调用。 */
	async removeTranscriptDirectory(sessionId) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.locate !== "function") {
			throw new Error(`cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript directory`);
		}
		const header = await this.readSessionHeader(sessionId);
		const location = persistence.locate(header);
		if (location === void 0 || typeof location.path !== "string") {
			throw new Error(`cannot delete session "${sessionId}": the session persistence backend could not resolve its transcript directory`);
		}
		const transcriptDir = dirname(location.path);
		try {
			await rm(transcriptDir, { recursive: true, force: true });
		} catch (error) {
			const message = `cannot delete session "${sessionId}": transcript directory "${transcriptDir}" remains after bookkeeping cleanup`;
			const detail = `${message}: ${String(error)}`;
			this.ctx.logger.warn(`archive-manager: ${detail}`);
			throw new Error(detail, { cause: error });
		}
	}
	/** 把 id 从每个工作区记录中移除，并刷新实体快照。 */
	async removeFromWorkspaceAccounts(sessionId) {
		const table = this.requireTable();
		const state = this.requireState();
		for (const workspaceId of state.workspaceIds) {
			const record = table.get(workspaceId);
			if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
			const next = await table.update(workspaceId, (current) => ({
				...current,
				sessionIds: current.sessionIds.filter((id) => id !== sessionId),
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}));
			const entity = this.entities.get(workspaceId);
			if (entity !== void 0) entity.record = next;
		}
	}
	/** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话。
	* 仅头部标记 `origin: "subagent"` 的会话参与：单凭 `parentSession` 有歧义
	*（fork 分支也携带它），而 fork 分支是独立的用户会话，绝不能被级联删除。 */
	async deleteDescendants(sessionId) {
		try {
			const descendants = [];
			const sessions = this.ctx.get("sessions");
			if (sessions !== void 0) for (const session of sessions.list()) {
				if (session.header.parentSession === sessionId && session.header.origin === "subagent") descendants.push(session.id);
			}
			for (const header of await this.ctx.sessionPersistence.list()) {
				if (header.parentSession === sessionId && header.origin === "subagent" && !descendants.includes(header.id)) descendants.push(header.id);
			}
			for (const childId of descendants) {
				try {
					if (!await this.sessionKnown(childId)) continue;
					await this.deleteSessionCore(childId);
				} catch (error) {
					if (error instanceof ArchiveUnknownSessionError) continue;
					this.ctx.logger.warn(`archive-manager: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`);
				}
			}
		} catch (error) {
			this.ctx.logger.warn(`archive-manager: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`);
		}
	}
	/** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
	async cleanSpill(sessionId) {
		try {
			const spill = this.ctx.get("spillStore");
			if (spill === void 0 || typeof spill.root !== "string") return;
			await rm(sessionDir(spill.root, sessionId), { recursive: true, force: true });
		} catch (error) {
			this.ctx.logger.warn(`archive-manager: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`);
		}
	}
};
//#endregion
export { ArchiveWorkspaceRegistry, ArchiveWorkspaceRegistry as default };
