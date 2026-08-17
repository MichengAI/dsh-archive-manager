import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
//#region lib/types/index.js
/**
 * dsh-archive-manager projcache half.
 *
 * `ArchiveProjectionCache` extends the shipped `SessionProjectionCache`
 * (service name `sessionProjectionCache`, same domain, same fail-soft write
 * path) and adds two public methods used by the archive manager's
 * `deleteSession`:
 *
 * - `delete(id)` — permanently remove one session's cached projection row
 *   (`table.delete` on the `session_projcache` domain).
 * - `whenIdle()` — resolve once every in-flight public `write()` has settled.
 * - `delete(id)` installs a tombstone before removing the row, so an earlier
 *   write that settles late removes its own stale row instead of resurrecting
 *   the deleted cache entry.
 *
 * The default export is a Service subclass (same shape as the shipped
 * `@deepseek-ai/dsh-session-projection-cache` package), so the profile patch
 * can substitute this package for the `session-projection-cache` row with no
 * other wiring change.
 */
var ArchiveProjectionCache = class extends SessionProjectionCache {
	/** 已永久删除的会话不会再允许投影缓存写入。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	deletedSessionOrder = [];
	deletedSessionTombstoneLimit = 4096;
	/** Tail of in-flight checkpoint writes (settled promises only). */
	writeTail = Promise.resolve();
	constructor(ctx, config) {
		super(ctx, config);
	}
	/** 跟踪公开写入路径，避免依赖上游私有 `flushSoft` 的实现细节。 */
	write(session) {
		const task = this.writeCore(session);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	/**
	* 墓碑正确性依赖：super.write(session) 一次整体写入，返回后不再有后续异步落盘。
	* 若上游改成多阶段异步，(C) 补删会漏掉后续写入，deletedSessionIds 挡不住复活。
	*/
	async writeCore(session) {
		if (this.deletedSessionIds.has(session.id)) return;
		await super.write(session);
		if (this.deletedSessionIds.has(session.id)) await this.requireTable().delete(session.id);
	}
	/**
	* Resolve once every tracked in-flight write has settled (failures
	* included). Fresh calls during an idle cache resolve immediately.
	* @returns resolution after the tracked writes settle.
	*/
	whenIdle() {
		return this.writeTail;
	}
	/**
	* Permanently remove one session's cached projection row.
	* @param id - the session whose cache row to delete.
	* @returns resolution after the row is gone.
	*/
	async delete(id) {
		if (!this.deletedSessionIds.has(id)) {
			this.deletedSessionIds.add(id);
			this.deletedSessionOrder.push(id);
		}
		while (this.deletedSessionOrder.length > this.deletedSessionTombstoneLimit) {
			const oldest = this.deletedSessionOrder.shift();
			if (oldest !== void 0 && oldest !== id) this.deletedSessionIds.delete(oldest);
		}
		await this.requireTable().delete(id);
	}
};
//#endregion
export { ArchiveProjectionCache, ArchiveProjectionCache as default };
