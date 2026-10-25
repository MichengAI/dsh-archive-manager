import assert from "node:assert/strict";
import test from "node:test";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import ArchiveProjectionCache, { ArchiveProjectionCache as NamedArchiveProjectionCache } from "../lib/projcache.js";

test("历史投影缓存子路径直接导出官方服务，不安装删除守护", () => {
	assert.equal(ArchiveProjectionCache.name, SessionProjectionCache.name);
	assert.equal(NamedArchiveProjectionCache, ArchiveProjectionCache);
});
