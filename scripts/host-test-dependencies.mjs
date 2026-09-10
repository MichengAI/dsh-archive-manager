// 同代 RC 的依赖范围允许后续版本；隔离验收固定传递依赖，避免宿主混版。
// 此清单覆盖 0.1.5 两个 RC 的依赖闭包，不套用到旧版独立发布的包。
export function hostTestOverrides(version) {
	if (!["0.1.5-rc.1", "0.1.5-rc.2"].includes(version)) return {};
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
