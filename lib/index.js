import { getOnlineUpdate, getSidebarEntry, setOnlineUpdate, setSidebarEntry } from "./plugin-settings.js";
import { isTrustedUpdateRequest, rawService, registerPluginUpdater, releaseUpdateRoute } from "./plugin-updater.js";
import { apply as installHost, inject as hostInject } from "./host-install.js";
import { authorizeExplorerPath } from "./explorer-path-policy.js";
import { revealPathInSystem } from "./native-explorer.js";
const inject = ["webServer", ...hostInject];
const SIDEBAR_ENTRY_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-entry";
const ONLINE_UPDATE_ENDPOINT = "/api/michengai/dsh-archive-manager/online-update";
const OPEN_IN_EXPLORER_ENDPOINT = "/api/michengai/dsh-archive-manager/open-in-explorer";
function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}
function readJsonBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    let bytes = 0;
    request.on("data", (chunk) => {
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
function registerSettingsRoutes(ctx, hostUpdateDisabled) {
  const server = rawService(ctx.webServer);
  releaseUpdateRoute(server, SIDEBAR_ENTRY_ENDPOINT);
  releaseUpdateRoute(server, ONLINE_UPDATE_ENDPOINT);
  releaseUpdateRoute(server, OPEN_IN_EXPLORER_ENDPOINT);
  const disposeSidebar = ctx.webServer.register({
    kind: "exact",
    path: SIDEBAR_ENTRY_ENDPOINT,
    handler: async (request, response) => {
      if (request.method === "GET" || request.method === "HEAD") {
        const enabled = await getSidebarEntry();
        sendJson(response, 200, { ok: true, enabled });
        return;
      }
      if (request.method === "POST") {
        if (!isTrustedUpdateRequest(request)) {
          sendJson(response, 403, { ok: false, error: "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u8BF7\u6C42\u3002" });
          return;
        }
        const body = await readJsonBody(request);
        if (!body || typeof body.enabled !== "boolean") {
          sendJson(response, 400, { ok: false, error: "enabled \u5FC5\u987B\u662F\u5E03\u5C14\u503C" });
          return;
        }
        const enabled = await setSidebarEntry(body.enabled);
        sendJson(response, 200, { ok: true, enabled });
        return;
      }
      response.writeHead(405, { allow: "GET, HEAD, POST" });
      response.end();
    }
  });
  const disposeUpdate = ctx.webServer.register({
    kind: "exact",
    path: ONLINE_UPDATE_ENDPOINT,
    handler: async (request, response) => {
      if (request.method === "GET" || request.method === "HEAD") {
        const enabled = !hostUpdateDisabled && await getOnlineUpdate();
        sendJson(response, 200, { ok: true, enabled, locked: hostUpdateDisabled });
        return;
      }
      if (request.method === "POST") {
        if (!isTrustedUpdateRequest(request)) {
          sendJson(response, 403, { ok: false, error: "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u8BF7\u6C42\u3002" });
          return;
        }
        if (hostUpdateDisabled) {
          sendJson(response, 403, { ok: false, error: "\u5728\u7EBF\u66F4\u65B0\u5DF2\u88AB\u5BBF\u4E3B\u914D\u7F6E\u9501\u5B9A\u7981\u7528" });
          return;
        }
        const body = await readJsonBody(request);
        if (!body || typeof body.enabled !== "boolean") {
          sendJson(response, 400, { ok: false, error: "enabled \u5FC5\u987B\u662F\u5E03\u5C14\u503C" });
          return;
        }
        const enabled = await setOnlineUpdate(body.enabled);
        sendJson(response, 200, { ok: true, enabled });
        return;
      }
      response.writeHead(405, { allow: "GET, HEAD, POST" });
      response.end();
    }
  });
  const disposeOpenExplorer = ctx.webServer.register({
    kind: "exact",
    path: OPEN_IN_EXPLORER_ENDPOINT,
    handler: async (request, response) => {
      if (request.method !== "POST") {
        response.writeHead(405, { allow: "POST" });
        response.end();
        return;
      }
      if (!isTrustedUpdateRequest(request)) {
        sendJson(response, 403, { ok: false, error: "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u8BF7\u6C42\u3002" });
        return;
      }
      const body = await readJsonBody(request);
      const path = typeof body?.path === "string" ? body.path : "";
      const registry = ctx.get("workspaceRegistry");
      const registeredPaths = typeof registry?.list === "function" ? registry.list().map((w) => w.path) : [];
      const authorizedPath = authorizeExplorerPath(path, registeredPaths);
      if (authorizedPath === void 0) {
        sendJson(response, 403, { ok: false, error: "\u4EC5\u5141\u8BB8\u6253\u5F00\u5DF2\u6CE8\u518C\u7684\u5DE5\u4F5C\u533A\u76EE\u5F55\u3002" });
        return;
      }
      try {
        const result = await revealPathInSystem(authorizedPath);
        sendJson(response, 200, { ok: true, opened: true, via: result.via });
      } catch (error) {
        ctx.logger?.warn?.(`open in explorer failed: ${String(error)}`);
        sendJson(response, 500, { ok: false, error: "\u6253\u5F00\u7CFB\u7EDF\u8D44\u6E90\u7BA1\u7406\u5668\u5931\u8D25\u3002" });
      }
    }
  });
  return () => {
    try {
      disposeSidebar();
    } catch {
    }
    try {
      disposeUpdate();
    } catch {
    }
    try {
      disposeOpenExplorer();
    } catch {
    }
  };
}
async function apply(ctx, config) {
  const hostUpdateDisabled = config?.updater === false || config?.onlineUpdate === false;
  let disposeUpdater = () => {
  };
  let disposeSettingsRoutes = () => {
  };
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
      isEnabled: async () => !hostUpdateDisabled && await getOnlineUpdate()
    });
  } catch (error) {
    ctx.logger?.warn?.(`archive-manager: update route skipped: ${String(error)}`);
  }
  let disposeHost;
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
export {
  OPEN_IN_EXPLORER_ENDPOINT,
  apply,
  inject,
  registerSettingsRoutes
};
