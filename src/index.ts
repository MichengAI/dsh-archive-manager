import type { IncomingMessage, ServerResponse } from "node:http";
import type { Context } from "@deepseek-ai/cordis";
//#region lib/types/index.js
/**
 * @michengai/dsh-archive-manager 根宿主入口。
 *
 * 发布包是单个 DSH 插件。诊断与物理删除都由这一条服务行安装，
 * 不再另插一条可以单独停用的 host 行。浏览器端由 package.json 的
 * `dsh.client` 声明发现，对应同一个插件入口。
 */
import { getEntryLocation, getSidebarFavoriteStarMode, setEntryLocation, setSidebarFavoriteStarMode } from "./plugin-settings.js";
import type { FavoriteStarMode } from "./plugin-settings.js";
import { symbols } from "@deepseek-ai/cordis";
import { apply as installHost, inject as hostInject } from "./host-install.js";
import { authorizeExplorerPath } from "./explorer-path-policy.js";
import { revealPathInSystem } from "./native-explorer.js";

export interface PluginConfig {}

const inject = ["webServer", ...hostInject];

const SIDEBAR_ENTRY_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-entry";
const SIDEBAR_FAVORITE_STAR_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-favorite-star";
const OPEN_IN_EXPLORER_ENDPOINT = "/api/michengai/dsh-archive-manager/open-in-explorer";

const TRUSTED_MUTATION_HEADER = "x-michengai-archive-settings";

function header(request: IncomingMessage, name: string): string | undefined {
	const value = request.headers?.[name];
	return Array.isArray(value) ? value[0] : value;
}

function isLoopbackAddress(value: string | undefined): boolean {
	const address = value?.toLowerCase().replace(/^\[|\]$/g, "");
	return address === "localhost" || address === "localhost." || address === "::1" || address?.startsWith("127.") === true || address?.startsWith("::ffff:127.") === true;
}

export function isTrustedLocalRequest(request: IncomingMessage): boolean {
	if (header(request, TRUSTED_MUTATION_HEADER) !== "1") return false;
	if (!isLoopbackAddress(request.socket?.remoteAddress)) return false;
	const site = header(request, "sec-fetch-site");
	if (site !== undefined && site !== "same-origin") return false;
	const host = header(request, "host");
	if (host === undefined || host === "") return false;
	const origin = header(request, "origin");
	if (origin === undefined || origin === "") {
		try {
			return isLoopbackAddress(new URL(`http://${host}`).hostname);
		} catch {
			return false;
		}
	}
	try {
		const url = new URL(origin);
		return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackAddress(url.hostname) && url.host === host;
	} catch {
		return false;
	}
}

const managedRoutes = Symbol.for("dsh-archive-manager.managed-routes");
function managedRouteBag(server: object): Map<string, () => void> {
	const owner = server as Record<symbol, Map<string, () => void>>;
	return owner[managedRoutes] ?? (owner[managedRoutes] = new Map());
}

function rawService(service: object): object {
	const original = Reflect.get(service, symbols.original);
	return original !== null && typeof original === "object" ? original : service;
}

function releaseManagedRoute(server: object, path: string) {
	const raw = rawService(server);
	const bag = managedRouteBag(raw);
	const owned = bag.get(path);
	if (owned !== undefined) {
		bag.delete(path);
		owned();
	}
	for (const key of ["exact", "prefixes"]) {
		const table = Reflect.get(raw, key);
		if (table instanceof Map && table.has(path)) table.delete(path);
	}
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown) {
	response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
	response.end(JSON.stringify(value));
}

function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown> | null> {
	return new Promise((resolve) => {
		const chunks: Buffer[] = [];
		let bytes = 0;
		request.on("data", (chunk: Buffer | string) => {
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			bytes += buffer.length;
			if (bytes > 64 * 1024) return;
			chunks.push(buffer);
		});
		request.on("end", () => {
			try {
				const raw = Buffer.concat(chunks).toString("utf8");
				const parsed = JSON.parse(raw);
				resolve(parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null);
			} catch {
				resolve(null);
			}
		});
		request.on("error", () => resolve(null));
	});
}

interface WebServerRoute {
	kind: "exact" | "prefix";
	path: string;
	handler: (request: IncomingMessage, response: ServerResponse) => Promise<void> | void;
}
interface WebServer {
	register(route: WebServerRoute): () => void;
}
type HostContext = Context & {
	webServer: WebServer;
};

function registerSettingsRoutes(ctx: HostContext): () => void {
	const server = rawService(ctx.webServer as object);
	releaseManagedRoute(server, SIDEBAR_ENTRY_ENDPOINT);
	releaseManagedRoute(server, SIDEBAR_FAVORITE_STAR_ENDPOINT);
	releaseManagedRoute(server, OPEN_IN_EXPLORER_ENDPOINT);

	const disposeSidebar = ctx.webServer.register({
		kind: "exact",
		path: SIDEBAR_ENTRY_ENDPOINT,
		handler: async (request: IncomingMessage, response: ServerResponse) => {
			if (request.method === "GET" || request.method === "HEAD") {
				const location = await getEntryLocation();
				sendJson(response, 200, { ok: true, location, enabled: location !== "settings" });
				return;
			}
			if (request.method === "POST") {
				if (!isTrustedLocalRequest(request)) {
					sendJson(response, 403, { ok: false, error: "已拒绝非本机同源请求。" });
					return;
				}
				const body = await readJsonBody(request);
				if (!body) {
					sendJson(response, 400, { ok: false, error: "请求体不能为空" });
					return;
				}
				if (typeof body.location === "string") {
					if (body.location !== "both" && body.location !== "sidebar" && body.location !== "settings") {
						sendJson(response, 400, { ok: false, error: "location 必须是 both、sidebar 或 settings" });
						return;
					}
					const location = await setEntryLocation(body.location);
					sendJson(response, 200, { ok: true, location, enabled: location !== "settings" });
					return;
				}
				if (typeof body.enabled === "boolean") {
					const location = await setEntryLocation(body.enabled ? "both" : "settings");
					sendJson(response, 200, { ok: true, location, enabled: location !== "settings" });
					return;
				}
				sendJson(response, 400, { ok: false, error: "缺少合法的 location 或 enabled 参数" });
				return;
			}
			response.writeHead(405, { allow: "GET, HEAD, POST" });
			response.end();
		},
	});

	const disposeFavoriteStar = ctx.webServer.register({
		kind: "exact",
		path: SIDEBAR_FAVORITE_STAR_ENDPOINT,
		handler: async (request: IncomingMessage, response: ServerResponse) => {
			if (request.method === "GET" || request.method === "HEAD") {
				const mode = await getSidebarFavoriteStarMode();
				sendJson(response, 200, { ok: true, mode, enabled: mode !== "none" });
				return;
			}
			if (request.method === "POST") {
				if (!isTrustedLocalRequest(request)) {
					sendJson(response, 403, { ok: false, error: "已拒绝非本机同源请求。" });
					return;
				}
				const body = await readJsonBody(request);
				if (!body) {
					sendJson(response, 400, { ok: false, error: "请求体不能为空" });
					return;
				}
				let targetMode: FavoriteStarMode | undefined;
				if (typeof body.mode === "string") {
					if (body.mode !== "all" && body.mode !== "favorites" && body.mode !== "none") {
						sendJson(response, 400, { ok: false, error: "mode 必须是 all、favorites 或 none" });
						return;
					}
					targetMode = body.mode;
				} else if (typeof body.enabled === "boolean") {
					targetMode = body.enabled ? "all" : "none";
				} else {
					sendJson(response, 400, { ok: false, error: "缺少合法的 mode 或 enabled 参数" });
					return;
				}
				const mode = await setSidebarFavoriteStarMode(targetMode);
				sendJson(response, 200, { ok: true, mode, enabled: mode !== "none" });
				return;
			}
			response.writeHead(405, { allow: "GET, HEAD, POST" });
			response.end();
		},
	});

	const disposeOpenExplorer = ctx.webServer.register({
		kind: "exact",
		path: OPEN_IN_EXPLORER_ENDPOINT,
		handler: async (request: IncomingMessage, response: ServerResponse) => {
			if (request.method !== "POST") {
				response.writeHead(405, { allow: "POST" });
				response.end();
				return;
			}
			if (!isTrustedLocalRequest(request)) {
				sendJson(response, 403, { ok: false, error: "已拒绝非本机同源请求。" });
				return;
			}
			const body = await readJsonBody(request);
			const path = typeof body?.path === "string" ? body.path : "";
			const registry = ctx.get("workspaceRegistry") as { list?: () => { path: string }[] } | undefined;
			const registeredPaths: string[] = typeof registry?.list === "function" ? registry.list().map((w) => w.path) : [];
			const authorizedPath = authorizeExplorerPath(path, registeredPaths);
			if (authorizedPath === undefined) {
				sendJson(response, 403, { ok: false, error: "仅允许打开已注册的工作区目录。" });
				return;
			}
			try {
				const result = await revealPathInSystem(authorizedPath);
				sendJson(response, 200, { ok: true, opened: true, via: result.via });
			} catch (error) {
				ctx.logger?.warn?.(`open in explorer failed: ${String(error)}`);
				sendJson(response, 500, { ok: false, error: "打开系统资源管理器失败。" });
			}
		},
	});

	return () => {
		try { disposeSidebar(); } catch {}
		try { disposeFavoriteStar(); } catch {}
		try { disposeOpenExplorer(); } catch {}
	};
}

async function apply(ctx: Context, _config?: PluginConfig) {
	let disposeSettingsRoutes = () => {};

	try {
		disposeSettingsRoutes = registerSettingsRoutes(ctx as HostContext);
	} catch (error) {
		ctx.logger?.warn?.(`archive-manager: settings routes skipped: ${String(error)}`);
	}

	let disposeHost: () => void | Promise<void>;
	try {
		disposeHost = await installHost(ctx);
	} catch (error) {
		disposeSettingsRoutes();
		throw error;
	}
	return async () => {
		try {
			disposeSettingsRoutes();
		} finally {
			await disposeHost();
		}
	};
}
//#endregion
export { apply, inject, registerSettingsRoutes, OPEN_IN_EXPLORER_ENDPOINT, SIDEBAR_FAVORITE_STAR_ENDPOINT };
