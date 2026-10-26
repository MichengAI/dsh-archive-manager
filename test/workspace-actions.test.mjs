import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizeExplorerPath } from "../src/explorer-path-policy.js";
import { revealPathInSystem } from "../src/native-explorer.js";

process.env.DSH_ARCHIVE_MANAGER_MOCK_EXPLORER = "1";

test("工作区在资源管理器中打开：路径白名单安全校验", () => {
	const registeredPaths = [
		"D:\\Repository\\project-a",
		"D:\\Repository\\project-b",
		"C:\\Users\	est\\work",
		"/home/user/workspace-linux",
	];

	// Linux / POSIX 路径测试
	assert.equal(
		authorizeExplorerPath("/home/user/workspace-linux", registeredPaths),
		"/home/user/workspace-linux"
	);
	assert.equal(
		authorizeExplorerPath("/home/user/workspace-linux/", registeredPaths),
		"/home/user/workspace-linux"
	);

	// 命中已注册工作区路径（含尾斜杠归一化与大小写不敏感匹配）
	assert.equal(
		authorizeExplorerPath("D:\\Repository\\project-a", registeredPaths),
		"D:\\Repository\\project-a"
	);
	assert.equal(
		authorizeExplorerPath("D:\\Repository\\project-a\\", registeredPaths),
		"D:\\Repository\\project-a"
	);
	assert.equal(
		authorizeExplorerPath("d:\\repository\\project-a", registeredPaths),
		"D:\\Repository\\project-a"
	);

	// 未在已注册工作区列表中的路径必须严格拒绝 (返回 undefined)
	assert.equal(authorizeExplorerPath("C:\\Windows\\System32", registeredPaths), undefined);
	assert.equal(authorizeExplorerPath("D:\\Repository\\project-c", registeredPaths), undefined);
	assert.equal(authorizeExplorerPath("..\\..\\etc\\passwd", registeredPaths), undefined);
	assert.equal(authorizeExplorerPath("", registeredPaths), undefined);
	assert.equal(authorizeExplorerPath(null, registeredPaths), undefined);
});

test("工作区在资源管理器中打开：优先调用原生模块，否则降级到系统 spawn", async () => {
	let nativeCalledWith = null;
	const mockNative = {
		revealNativePath: async (p) => {
			nativeCalledWith = p;
		},
	};

	const res1 = await revealPathInSystem("D:\\Repository\\project-a", mockNative);
	assert.equal(res1.ok, true);
	assert.equal(res1.via, "native-command");
	assert.equal(nativeCalledWith, "D:\\Repository\\project-a");

	// 模拟无原生模块时平滑降级（使用 mockSpawner 避免真机弹出资源管理器）
	let spawnedCommand = null;
	const mockSpawner = (cmd, args) => {
		spawnedCommand = { cmd, args };
		return { unref() {} };
	};
	const res2 = await revealPathInSystem("D:\\Repository\\project-a", {}, mockSpawner);
	assert.equal(res2.ok, true);
	assert.equal(res2.via, "spawn");
	assert.ok(spawnedCommand);
	assert.deepEqual(spawnedCommand.args, ["D:\\Repository\\project-a"]);
});

test("open-in-explorer HTTP 端点：拒绝未信任请求、拒绝非法路径、放行合法工作区路径", async () => {
	const { registerSettingsRoutes, OPEN_IN_EXPLORER_ENDPOINT } = await import("../src/index.js");
	assert.equal(OPEN_IN_EXPLORER_ENDPOINT, "/api/michengai/dsh-archive-manager/open-in-explorer");

	let registeredRoute = null;
	const mockWebServer = {
		register(route) {
			registeredRoute = route;
			return () => { registeredRoute = null; };
		},
		router: { unregister() {} },
	};
	const mockRegistry = {
		list: () => [
			{ id: "ws-1", path: "D:\\Repository\\project-a" },
		],
	};
	const ctx = {
		webServer: mockWebServer,
		get: (name) => name === "workspaceRegistry" ? mockRegistry : undefined,
		logger: { warn() {} },
	};

	const dispose = registerSettingsRoutes(ctx, false);
	assert.ok(registeredRoute);
	assert.equal(registeredRoute.path, "/api/michengai/dsh-archive-manager/open-in-explorer");

	// 1. 模拟非同源请求 -> 403
	let status = 0;
	let json = null;
	const fakeRes = {
		writeHead(code) { status = code; },
		end(data) { if (data) json = JSON.parse(data); },
	};
	await registeredRoute.handler({
		method: "POST",
		headers: { host: "evil.com" },
	}, fakeRes);
	assert.equal(status, 403);
	assert.equal(json?.ok, false);

	// 2. 模拟同源但越界路径 -> 403
	const { Readable } = await import("node:stream");
	const createReq = (body) => {
		const stream = Readable.from([JSON.stringify(body)]);
		stream.method = "POST";
		stream.headers = {
			host: "localhost",
			"x-michengai-plugin-update": "1",
			"sec-fetch-site": "same-origin",
		};
		stream.socket = { remoteAddress: "127.0.0.1" };
		return stream;
	};

	await registeredRoute.handler(createReq({ path: "C:\\Windows\\System32" }), fakeRes);
	assert.equal(status, 403);
	assert.match(json?.error, /仅允许打开已注册的工作区目录/);

	// 3. 模拟合法路径 -> 200
	await registeredRoute.handler(createReq({ path: "D:\\Repository\\project-a" }), fakeRes);
	assert.equal(status, 200);
	assert.equal(json?.ok, true);
	assert.equal(json?.opened, true);

	dispose();
});






