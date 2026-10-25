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
import { getOnlineUpdate, getSidebarEntry, setOnlineUpdate, setSidebarEntry } from "./plugin-settings.js";
import { isTrustedUpdateRequest, rawService, registerPluginUpdater, releaseUpdateRoute } from "./plugin-updater.js";
import { apply as installHost, inject as hostInject } from "./host-install.js";

export interface PluginConfig {
	updater?: boolean;
	onlineUpdate?: boolean;
}

const inject = ["webServer", ...hostInject];

const SIDEBAR_ENTRY_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-entry";
const ONLINE_UPDATE_ENDPOINT = "/api/michengai/dsh-archive-manager/online-update";

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

function registerSettingsRoutes(ctx: Context, hostUpdateDisabled: boolean): () => void {
	const server = rawService(ctx.webServer as object);
	releaseUpdateRoute(server, SIDEBAR_ENTRY_ENDPOINT);
	releaseUpdateRoute(server, ONLINE_UPDATE_ENDPOINT);

	const disposeSidebar = ctx.webServer.register({
		kind: "exact",
		path: SIDEBAR_ENTRY_ENDPOINT,
		handler: async (request: IncomingMessage, response: ServerResponse) => {
			if (request.method === "GET" || request.method === "HEAD") {
				const enabled = await getSidebarEntry();
				sendJson(response, 200, { ok: true, enabled });
				return;
			}
			if (request.method === "POST") {
				if (!isTrustedUpdateRequest(request)) {
					sendJson(response, 403, { ok: false, error: "已拒绝非本机同源请求。" });
					return;
				}
				const body = await readJsonBody(request);
				if (!body || typeof body.enabled !== "boolean") {
					sendJson(response, 400, { ok: false, error: "enabled 必须是布尔值" });
					return;
				}
				const enabled = await setSidebarEntry(body.enabled);
				sendJson(response, 200, { ok: true, enabled });
				return;
			}
			response.writeHead(405, { allow: "GET, HEAD, POST" });
			response.end();
		},
	});

	const disposeUpdate = ctx.webServer.register({
		kind: "exact",
		path: ONLINE_UPDATE_ENDPOINT,
		handler: async (request: IncomingMessage, response: ServerResponse) => {
			if (request.method === "GET" || request.method === "HEAD") {
				const enabled = !hostUpdateDisabled && (await getOnlineUpdate());
				sendJson(response, 200, { ok: true, enabled, locked: hostUpdateDisabled });
				return;
			}
			if (request.method === "POST") {
				if (!isTrustedUpdateRequest(request)) {
					sendJson(response, 403, { ok: false, error: "已拒绝非本机同源请求。" });
					return;
				}
				if (hostUpdateDisabled) {
					sendJson(response, 403, { ok: false, error: "在线更新已被宿主配置锁定禁用" });
					return;
				}
				const body = await readJsonBody(request);
				if (!body || typeof body.enabled !== "boolean") {
					sendJson(response, 400, { ok: false, error: "enabled 必须是布尔值" });
					return;
				}
				const enabled = await setOnlineUpdate(body.enabled);
				sendJson(response, 200, { ok: true, enabled });
				return;
			}
			response.writeHead(405, { allow: "GET, HEAD, POST" });
			response.end();
		},
	});

	return () => {
		try { disposeSidebar(); } catch {}
		try { disposeUpdate(); } catch {}
	};
}

async function apply(ctx: Context, config?: PluginConfig) {
	const hostUpdateDisabled = config?.updater === false || config?.onlineUpdate === false;
	let disposeUpdater = () => {};
	let disposeSettingsRoutes = () => {};

	try {
		disposeSettingsRoutes = registerSettingsRoutes(ctx, hostUpdateDisabled);
	} catch (error) {
		ctx.logger?.warn?.(`archive-manager: settings routes skipped: ${String(error)}`);
	}

	try {
		disposeUpdater = registerPluginUpdater(ctx, {
			endpoint: "/api/michengai/dsh-archive-manager/update",
			packageName: "@michengai/dsh-archive-manager",
			manifestUrl: new URL("../package.json", import.meta.url),
			isEnabled: async () => !hostUpdateDisabled && (await getOnlineUpdate()),
		});
	} catch (error) {
		ctx.logger?.warn?.(`archive-manager: update route skipped: ${String(error)}`);
	}
	let disposeHost: () => void | Promise<void>;
	try {
		disposeHost = await installHost(ctx);
	} catch (error) {
		disposeUpdater();
		disposeSettingsRoutes();
		throw error;
	}
	return async () => {
		try {
			disposeUpdater();
			disposeSettingsRoutes();
		} finally {
			await disposeHost();
		}
	};
}
//#endregion
export { apply, inject };
