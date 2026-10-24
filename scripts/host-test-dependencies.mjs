// 同代宿主的依赖范围允许后续版本；隔离验收固定传递依赖，避免宿主混版。
// 只覆盖仍支持的 0.2.x。0.1.x 已退出 peer。
export function hostTestOverrides(version) {
	const supported = [
		"0.2.0-rc.1",
		"0.2.0-rc.2",
		"0.2.1-rc.1",
		"0.2.1-rc.2",
		"0.2.1-rc.3",
	];
	if (!supported.includes(version)) return {};
	const names = [
		"agent", "api-gateway", "brand", "client-connection", "client-locale", "client-store",
		"client-ui-conversation", "client-ui-primitives", "client-ui-sidebar", "client-ui-slots", "client-ui-workspace",
		"code-runtime", "compaction", "credentials", "deque", "host-webserver",
		...(version.startsWith("0.2.0-") ? ["invariants"] : []),
		"llm",
		"sandbox", "sandbox-policy", "scope", "session",
		"session-format", "session-format-catalog", "session-format-v0-to-v1", "session-format-v1-to-v2", "session-format-v2-to-v3",
		"session-format-v3-to-v4",
		"session-persistence", "session-persistence-jsonl", "session-projection", "session-projection-cache", "session-query", "session-title",
		"spill", "spill-local", "storage", "storage-domain", "system-prompt", "timeout", "tool-todo", "tools",
		"typert-protocol", "typert-registry", "user-approval", "util-crypto", "util-values", "workspace",
		"compaction-image-offload", "ptc-runtime",
		"client-shortcuts", "client-product-analytics"
	];
	return Object.fromEntries(names.map((name) => [`@deepseek-ai/dsh-${name}`, version]));
}
