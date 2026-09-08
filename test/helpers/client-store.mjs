// 加载当前测试环境的真实 Store；rc.2 的实现仍位于浏览器 Runtime bundle。
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
export async function loadClientStore() {
	let current;
	try {
		current = require.resolve("@deepseek-ai/dsh-client-store");
	} catch (error) {
		if (error.code !== "MODULE_NOT_FOUND") throw error;
	}
	if (current !== void 0) return { id: "@deepseek-ai/dsh-client-store", exports: await import(pathToFileURL(current).href) };
	const modules = {
		"@deepseek-ai/cordis": await import("@deepseek-ai/cordis"),
		"@deepseek-ai/dsh-client-ui-slots": await import("@deepseek-ai/dsh-client-ui-slots")
	};
	const previousWindow = globalThis.window;
	globalThis.window ??= {};
	const previousLoader = window.__ModuleLoader__;
	let factory;
	window.__ModuleLoader__ = { load: (handoff) => { factory = handoff.factory; } };
	try {
		await import(pathToFileURL(require.resolve("@deepseek-ai/dsh-client-runtime/client")).href);
		if (factory === void 0) throw new Error("旧版 Runtime 未注册模块工厂");
		const exports = factory((id) => {
			if (!(id in modules)) throw new Error(`旧版 Runtime 未提供依赖：${id}`);
			return modules[id];
		});
		return { id: "@deepseek-ai/dsh-client-runtime/client", exports };
	} finally {
		window.__ModuleLoader__ = previousLoader;
		if (previousWindow === void 0) delete globalThis.window;
	}
}
