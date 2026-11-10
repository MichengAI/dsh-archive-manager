import { getEntryLocation, getSidebarFavoriteStarMode, setEntryLocation, setSidebarFavoriteStarMode } from "./plugin-settings.js";
import { symbols } from "@deepseek-ai/cordis";
import { apply as installHost, inject as hostInject } from "./host-install.js";
import { authorizeExplorerPath } from "./explorer-path-policy.js";
import { revealPathInSystem } from "./native-explorer.js";
const inject = ["webServer", ...hostInject];
const SIDEBAR_ENTRY_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-entry";
const SIDEBAR_FAVORITE_STAR_ENDPOINT = "/api/michengai/dsh-archive-manager/sidebar-favorite-star";
const OPEN_IN_EXPLORER_ENDPOINT = "/api/michengai/dsh-archive-manager/open-in-explorer";
const TRUSTED_MUTATION_HEADER = "x-michengai-archive-settings";
function header(request, name) {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}
function isLoopbackAddress(value) {
  const address = value?.toLowerCase().replace(/^\[|\]$/g, "");
  return address === "localhost" || address === "localhost." || address === "::1" || address?.startsWith("127.") === true || address?.startsWith("::ffff:127.") === true;
}
function isTrustedLocalRequest(request) {
  if (header(request, TRUSTED_MUTATION_HEADER) !== "1") return false;
  if (!isLoopbackAddress(request.socket?.remoteAddress)) return false;
  const site = header(request, "sec-fetch-site");
  if (site !== void 0 && site !== "same-origin") return false;
  const host = header(request, "host");
  if (host === void 0 || host === "") return false;
  const origin = header(request, "origin");
  if (origin === void 0 || origin === "") {
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
function managedRouteBag(server) {
  const owner = server;
  return owner[managedRoutes] ?? (owner[managedRoutes] = /* @__PURE__ */ new Map());
}
function rawService(service) {
  const original = Reflect.get(service, symbols.original);
  return original !== null && typeof original === "object" ? original : service;
}
function releaseManagedRoute(server, path) {
  const raw = rawService(server);
  const bag = managedRouteBag(raw);
  const owned = bag.get(path);
  if (owned !== void 0) {
    bag.delete(path);
    owned();
  }
  for (const key of ["exact", "prefixes"]) {
    const table = Reflect.get(raw, key);
    if (table instanceof Map && table.has(path)) table.delete(path);
  }
}
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
function registerSettingsRoutes(ctx) {
  const server = rawService(ctx.webServer);
  releaseManagedRoute(server, SIDEBAR_ENTRY_ENDPOINT);
  releaseManagedRoute(server, SIDEBAR_FAVORITE_STAR_ENDPOINT);
  releaseManagedRoute(server, OPEN_IN_EXPLORER_ENDPOINT);
  const disposeSidebar = ctx.webServer.register({
    kind: "exact",
    path: SIDEBAR_ENTRY_ENDPOINT,
    handler: async (request, response) => {
      if (request.method === "GET" || request.method === "HEAD") {
        const location = await getEntryLocation();
        sendJson(response, 200, { ok: true, location, enabled: location !== "settings" });
        return;
      }
      if (request.method === "POST") {
        if (!isTrustedLocalRequest(request)) {
          sendJson(response, 403, { ok: false, error: "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u8BF7\u6C42\u3002" });
          return;
        }
        const body = await readJsonBody(request);
        if (!body) {
          sendJson(response, 400, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u80FD\u4E3A\u7A7A" });
          return;
        }
        if (typeof body.location === "string") {
          if (body.location !== "both" && body.location !== "sidebar" && body.location !== "settings") {
            sendJson(response, 400, { ok: false, error: "location \u5FC5\u987B\u662F both\u3001sidebar \u6216 settings" });
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
        sendJson(response, 400, { ok: false, error: "\u7F3A\u5C11\u5408\u6CD5\u7684 location \u6216 enabled \u53C2\u6570" });
        return;
      }
      response.writeHead(405, { allow: "GET, HEAD, POST" });
      response.end();
    }
  });
  const disposeFavoriteStar = ctx.webServer.register({
    kind: "exact",
    path: SIDEBAR_FAVORITE_STAR_ENDPOINT,
    handler: async (request, response) => {
      if (request.method === "GET" || request.method === "HEAD") {
        const mode = await getSidebarFavoriteStarMode();
        sendJson(response, 200, { ok: true, mode, enabled: mode !== "none" });
        return;
      }
      if (request.method === "POST") {
        if (!isTrustedLocalRequest(request)) {
          sendJson(response, 403, { ok: false, error: "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u8BF7\u6C42\u3002" });
          return;
        }
        const body = await readJsonBody(request);
        if (!body) {
          sendJson(response, 400, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u80FD\u4E3A\u7A7A" });
          return;
        }
        let targetMode;
        if (typeof body.mode === "string") {
          if (body.mode !== "all" && body.mode !== "favorites" && body.mode !== "none") {
            sendJson(response, 400, { ok: false, error: "mode \u5FC5\u987B\u662F all\u3001favorites \u6216 none" });
            return;
          }
          targetMode = body.mode;
        } else if (typeof body.enabled === "boolean") {
          targetMode = body.enabled ? "all" : "none";
        } else {
          sendJson(response, 400, { ok: false, error: "\u7F3A\u5C11\u5408\u6CD5\u7684 mode \u6216 enabled \u53C2\u6570" });
          return;
        }
        const mode = await setSidebarFavoriteStarMode(targetMode);
        sendJson(response, 200, { ok: true, mode, enabled: mode !== "none" });
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
      if (!isTrustedLocalRequest(request)) {
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
      disposeFavoriteStar();
    } catch {
    }
    try {
      disposeOpenExplorer();
    } catch {
    }
  };
}
async function apply(ctx, _config) {
  let disposeSettingsRoutes = () => {
  };
  try {
    disposeSettingsRoutes = registerSettingsRoutes(ctx);
  } catch (error) {
    ctx.logger?.warn?.(`archive-manager: settings routes skipped: ${String(error)}`);
  }
  let disposeHost;
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
export {
  OPEN_IN_EXPLORER_ENDPOINT,
  SIDEBAR_FAVORITE_STAR_ENDPOINT,
  apply,
  inject,
  isTrustedLocalRequest,
  registerSettingsRoutes
};
