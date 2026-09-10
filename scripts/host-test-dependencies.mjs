// rc.1 的官方依赖闭包允许同代 rc.2；隔离验收必须固定传递依赖，避免被后续发布改变。
// 此清单来自 0.1.5-rc.1 包的 dependencies/peerDependencies，不套用到旧版独立发布的包。
export function hostTestOverrides(version) {
	if (version !== "0.1.5-rc.1") return {};
	const names = [
		"agent", "api-gateway", "brand", "client-connection", "client-locale", "client-store",
		"client-ui-conversation", "client-ui-primitives", "client-ui-sidebar", "client-ui-slots", "client-ui-workspace",
		"code-runtime", "credentials", "deque", "host-webserver", "invariants", "llm", "scope", "session",
		"session-format", "session-format-catalog", "session-format-v0-to-v1", "session-format-v1-to-v2", "session-format-v2-to-v3",
		"session-persistence", "session-persistence-jsonl", "session-projection", "session-projection-cache", "session-query", "session-title",
		"spill", "spill-local", "storage", "storage-domain", "system-prompt", "timeout", "tool-todo", "tools",
		"typert-protocol", "typert-registry", "user-approval", "util-crypto", "util-values", "workspace"
	];
	return Object.fromEntries(names.map((name) => [`@deepseek-ai/dsh-${name}`, version]));
}
