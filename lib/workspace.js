import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import {
	WorkspaceRegistry,
	WorkspaceUnknownSessionError
} from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
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
* `unarchiveSession` 与 `deleteSession` 通过 Typert Remote 暴露给浏览器。
*/
function markRemoteMethod(instance, method) {
	// Simulate the TS decorator pipeline `@Remote(method)` for one method:
	// `Remote` returns a standard method decorator; we hand it a decorator
	// context whose addInitializer runs immediately with `this` = instance.
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
var ArchiveWorkspaceRegistry = class extends WorkspaceRegistry {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache"
	];
	constructor(ctx) {
		super(ctx);
		this.typertRemote = bindTypertRemote(this, this.name);
		markRemoteMethod(this, "unarchiveSession");
		markRemoteMethod(this, "deleteSession");
	}
	/**
	* Move one session out of the registry-global archive set, restoring its
	* normal visibility (its accounting seat was never moved, so the session
	* reappears at its original workspace position). Idempotent: an
	* already-unarchived session resolves without writing; an unknown session
	* rejects like `archiveSession` does.
	* @param sessionId - the session to unarchive.
	* @returns the full updated archive set.
	*/
	async unarchiveSession(sessionId) {
		return this.enqueueOperation(async () => {
			if (!await this.sessionKnown(sessionId)) throw new WorkspaceUnknownSessionError(sessionId);
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
	* Permanently delete one session and every trace of it (transcript
	* directory, workspace accounting, archive marker, projection cache row).
	* @param sessionId - the session to delete.
	* @returns `{ deleted: true }` after durability.
	* @throws {@link WorkspaceUnknownSessionError} when the session is unknown.
	*/
	async deleteSession(sessionId) {
		return this.enqueueOperation(() => this.deleteSessionCore(sessionId));
	}
	/** The serialized core deletion body (also used by the cascade path, which
	* already holds the operation chain — it must never re-enqueue). */
	async deleteSessionCore(sessionId) {
		if (!await this.sessionKnown(sessionId)) throw new WorkspaceUnknownSessionError(sessionId);
		const sessions = this.ctx.get("sessions");
		const live = sessions?.get(sessionId);
		if (live !== void 0) {
			// Durability barrier first: no pending transcript writes may race
			// the directory removal (the persistence backend closes handles per
			// batch, so a flushed session leaves no open file).
			await sessions.flush(live);
			// Detach from the store; `session/disposed` fires synchronously,
			// which drives the browser `host/session-removed` frame and starts
			// the projection cache's final write-behind.
			const entry = sessions.liveEntryFor(live);
			sessions.detachEntered(entry);
		} else if (sessions !== void 0) await this.publishColdSessionRemoval(sessionId, sessions);
		const projCache = this.ctx.get("sessionProjectionCache");
		// The dispose write-behind must land BEFORE the cache row is deleted,
		// otherwise the row is written back after deletion (resurrected).
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
		return { deleted: true };
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
			this.ctx.logger.warn(`archive-manager: ${message}: ${String(error)}`);
			throw new Error(`${message}: ${String(error)}`, { cause: error });
		}
	}
	/** Drop the id from every workspace record and refresh entity snapshots. */
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
	/** Best-effort cascade: delete SUBAGENT child sessions of `sessionId`.
	* Only sessions whose header marks `origin: "subagent"` qualify: `parentSession`
	* alone is ambiguous (fork branches also carry it), and a fork branch is an
	* independent user session that must never be cascade-deleted. */
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
					await this.deleteSessionCore(childId);
				} catch (error) {
					this.ctx.logger.warn(`archive-manager: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`);
				}
			}
		} catch (error) {
			this.ctx.logger.warn(`archive-manager: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`);
		}
	}
	/** Best-effort spill cleanup: remove the session-scoped spill directory. */
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
