import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { trackTombstone } from "./tombstone.js";
//#region lib/types/index.js
/**
 * dsh-archive-manager projcache 半边。
 *
 * `ArchiveProjectionCache` 继承上游 `SessionProjectionCache`
 * （服务名 `sessionProjectionCache`，同域、同 fail-soft 写路径），
 * 为归档管理的 `deleteSession` 增加三处守护：
 *
 * - `delete(id)` - 永久移除一个会话的缓存投影行
 *   （`session_projcache` 域上的 `table.delete`），写入前先登记墓碑。
 * - `whenIdle()` - 全部在途公开写入落定后 resolve。
 * - 墓碑挡住已删除会话的写入：迟到的写入要么被直接拦截，要么在
 *   落定后补删自己的残留行，不会复活已删除的缓存条目。守护覆盖
 *   `write()`（dispose 写后路径）与 `putSoft()`（`coldSnapshot` 的
 *   冷读写回路径），两条落盘路径都纳入 `whenIdle` 跟踪。
 *
 * 默认导出是 Service 子类（与上游 `@deepseek-ai/dsh-session-projection-cache`
 * 包同形），profile 补丁可直接替换 `session-projection-cache` 服务行，
 * 无需其他接线改动。
 */
var ArchiveProjectionCache = class extends SessionProjectionCache {
	/** 已永久删除的会话：其投影缓存行不再允许写入。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	deletedSessionTombstoneLimit = 4096;
	/** 在途写入的队尾（只含已落定的 promise）。 */
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
	 * 冷读写回路径（上游 `coldSnapshot` 经 `putSoft` 落盘）与 `write` 同守：
	 * 已删除直接放弃；删除落在写回进行中则在其落定后补删残留行。
	 * 同样纳入 `whenIdle` 跟踪。
	 */
	async putSoft(id, identity, rows, what) {
		if (this.deletedSessionIds.has(id)) return;
		const task = this.putSoftCore(id, identity, rows, what);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	async putSoftCore(id, identity, rows, what) {
		await super.putSoft(id, identity, rows, what);
		try {
			if (this.deletedSessionIds.has(id)) await this.requireTable().delete(id);
		} catch (error) {
			this.ctx.logger.warn(`archive-manager projcache: cold-read write-back cleanup for "${id}" failed: ${String(error)}`);
		}
	}
	/**
	 * 全部被跟踪的在途写入落定后 resolve（含失败）。空闲缓存上调用立即返回。
	 * @returns 跟踪写入落定后的 resolution。
	 */
	whenIdle() {
		return this.writeTail;
	}
	/**
	 * 永久移除一个会话的缓存投影行。
	 * @param id - 要删除缓存行的会话。
	 * @returns 行删除完成后的 resolution。
	 */
	async delete(id) {
		trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, id, this.deletedSessionTombstoneLimit);
		await this.requireTable().delete(id);
	}
	/** 撤销墓碑（供测试与同 id 新生命周期复用路径使用）。 */
	clearTombstone(id) {
		this.deletedSessionIds.delete(id);
		const idx = this.deletedSessionOrder.indexOf(id);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
	}
};
//#endregion
export { ArchiveProjectionCache, ArchiveProjectionCache as default };
