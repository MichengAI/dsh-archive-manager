import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";

// 保留历史子路径导出名，不再包装官方服务或拦截缓存写入。
export {
	SessionProjectionCache as ArchiveProjectionCache,
	SessionProjectionCache as default,
};
