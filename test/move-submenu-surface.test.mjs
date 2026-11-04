// 移动会话二级子菜单（MoveSubmenu）行为级测试。
//
// 目标：证明二级菜单的容器与行都走宿主原语（MenuSurface / MenuItemButton），
// 而不是自绘材质层或克隆一级菜单 DOM；同时覆盖「无 MenuItemButton 宿主」的兜底
// 分支与水平定位使用实测宽度的能力。
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createElement, forwardRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const requireFallback = createRequire(import.meta.url);
const statics = {};
for (const spec of [
	"react",
	"react/jsx-runtime",
	"react-dom",
	"react-dom/client",
	"@deepseek-ai/cordis",
	"@deepseek-ai/dsh-client-ui-slots"
]) {
	statics[spec] = await import(pathToFileURL(requireFallback.resolve(spec)).href);
}

const { loadClientStore } = await import("./helpers/client-store.mjs");
const { exports: { defineStore } } = await loadClientStore();

// 浏览器环境最小桩：二级菜单不得依赖 portal，也不需要真实布局
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
const styleStub = { dataset: {}, style: {}, setAttribute() {}, appendChild() {}, set textContent(_v) {} };
const headStub = { append() {}, appendChild() {}, removeChild() {}, insertBefore() {}, contains: () => false, querySelector: () => null, querySelectorAll: () => [] };
globalThis.document = {
	head: headStub,
	body: headStub,
	querySelector: () => null,
	querySelectorAll: () => [],
	getElementById: () => null,
	createElement: () => styleStub,
	addEventListener: () => {},
	removeEventListener: () => {}
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };

const factories = new Map();
window.__ModuleLoader__ = { load: (handoff) => { factories.set(handoff.id, handoff.factory); } };

const CLIENT_BUNDLE = fileURLToPath(new URL("../lib/client.js", import.meta.url));
await import(pathToFileURL(CLIENT_BUNDLE).href);

function materialize(id, options = {}) {
	const staticModules = options.staticModules ?? statics;
	const factory = factories.get(id);
	if (!factory) throw new Error(`no factory for ${id}`);
	const module = { exports: {} };
	const require = (spec) => {
		if (Object.hasOwn(staticModules, spec)) return staticModules[spec];
		const stripped = spec.endsWith("/client") ? spec.slice(0, -7) : spec;
		if (stripped !== id && factories.has(stripped)) return materialize(stripped, options);
		throw new Error(`miss: ${spec}`);
	};
	return factory(require, module, module.exports) ?? module.exports;
}

/** 用可观测的宿主原语替身物化 bundle，用来断言组件到底调用了哪个原语 */
function loadWithPrimitives({ withMenuItemButton = true, withSurface = true } = {}) {
	const surfaceProps = [];
	const itemProps = [];
	const primitives = {
		IconFolderCloseMedium: () => createElement("span", { "data-testid": "folder-icon" })
	};
	if (withSurface) {
		// 与宿主保持一致：MenuSurface 是 forwardRef 组件，运行时是对象而不是函数，
		// 用对象形态才能证明实现没有误用 typeof === "function" 判断而降级。
		primitives.MenuSurface = forwardRef((props, ref) => {
			surfaceProps.push(props);
			return createElement("div", {
				ref,
				id: props.id,
				"data-testid": "surface",
				className: props.className,
				role: props.role,
				"aria-label": props["aria-label"],
				"data-menu-material": props["data-menu-material"],
				"data-dsham-side": props["data-dsham-side"],
				style: props.style
			}, props.children);
		});
	}
	if (withMenuItemButton) {
		primitives.MenuItemButton = (props) => {
			itemProps.push(props);
			return createElement("button", {
				role: "menuitem",
				disabled: props.disabled,
				onClick: props.onSelect
			}, props.children);
		};
	}
	const bundle = materialize("@michengai/dsh-archive-manager", {
		staticModules: {
			...statics,
			"@deepseek-ai/dsh-client-store": { defineStore },
			"@deepseek-ai/dsh-client-ui-primitives": primitives
		}
	});
	return {
		bundle,
		MoveSubmenu: bundle.__test.MoveSubmenu,
		computeSubmenuPosition: bundle.__test.computeSubmenuPosition,
		mergeSubmenuMeasurement: bundle.__test.mergeSubmenuMeasurement,
		movableWorkspaces: bundle.__test.movableWorkspaces,
		surfaceProps,
		itemProps
	};
}

const ws = (id, title) => ({ workspaceId: id, title, path: `D:\\repo\\${id}`, sessionIds: [] });
const translate = (key) => key;
const baseProps = (overrides = {}) => ({
	surfaceRef: { current: null },
	submenuId: "dsham-move-submenu-test",
	pos: { top: 40, left: 120, maxHeight: 320, side: "right" },
	workspaces: [ws("w1", "proj-a"), ws("w2", "proj-b")],
	moving: false,
	t: translate,
	onSelect: () => {},
	onEnter: () => {},
	onLeave: () => {},
	...overrides
});

test("二级子菜单容器使用宿主 MenuSurface，不再自绘材质层", () => {
	const { MoveSubmenu, surfaceProps } = loadWithPrimitives();
	const html = renderToStaticMarkup(createElement(MoveSubmenu, baseProps()));

	assert.equal(surfaceProps.length, 1, "二级菜单容器必须渲染一次宿主 MenuSurface");
	const props = surfaceProps[0];
	assert.equal(props.className, "dsham_moveSubmenu", "定位样式挂在自己的类名上");
	assert.equal(props.role, "menu");
	assert.equal(props["aria-label"], "menu.moveSession", "二级菜单要有可读名称");
	assert.equal(props.id, "dsham-move-submenu-test", "二级菜单要有稳定 id 供 aria-controls 引用");
	assert.equal(props["data-dsham-side"], "right", "翻转方向写进 data 属性，供悬停桥接条镜像定位");
	assert.deepEqual(props.style, { top: 40, left: 120, maxHeight: 320 }, "定位仍由插件计算并传入");
	assert.equal(
		props["data-menu-material"],
		undefined,
		"材质标记由宿主 MenuSurface 自己声明，插件不得硬编码 data-menu-material"
	);
	assert.doesNotMatch(html, /dsham_moveSubmenuMaterial/, "插件不再自绘 material 层");
});

test("每个工作区渲染为宿主 MenuItemButton 行，并回传 workspaceId 与标题", () => {
	const { MoveSubmenu, itemProps } = loadWithPrimitives();
	const selected = [];
	const html = renderToStaticMarkup(createElement(MoveSubmenu, baseProps({
		onSelect: (workspaceId, title) => selected.push([workspaceId, title])
	})));

	assert.equal(itemProps.length, 2, "每个工作区一行宿主 MenuItemButton");
	assert.match(html, /proj-a/);
	assert.match(html, /proj-b/);

	itemProps[1].onSelect();
	assert.deepEqual(selected, [["w2", "proj-b"]], "选中时必须带原始 workspaceId 与展示标题");
});

test("移动进行中时所有行禁用，空工作区给出空提示", () => {
	const { MoveSubmenu, itemProps } = loadWithPrimitives();
	renderToStaticMarkup(createElement(MoveSubmenu, baseProps({ moving: true })));
	assert.deepEqual(itemProps.map((p) => p.disabled), [true, true], "提交中必须禁用全部行防重复点击");

	const empty = loadWithPrimitives();
	const html = renderToStaticMarkup(createElement(empty.MoveSubmenu, baseProps({ workspaces: [] })));
	assert.equal(empty.itemProps.length, 0, "没有其它工作区时不渲染任何行");
	assert.match(html, /moveSession\.noOtherWorkspaces/, "空状态要有提示文案");
});

test("宿主缺少 MenuSurface 或 MenuItemButton 时不渲染任何菜单内容（无降级 UI）", () => {
	const noSurface = loadWithPrimitives({ withSurface: false });
	assert.equal(noSurface.MoveSubmenu(baseProps()), null, "没有 MenuSurface 时不得自绘材质层，直接不显示");

	const noItem = loadWithPrimitives({ withMenuItemButton: false });
	assert.equal(noItem.MoveSubmenu(baseProps()), null, "没有 MenuItemButton 时不得回退成自绘按钮，直接不显示");
});

test("宿主缺少原语时移动会话入口根本不注册，其余会话菜单项不受影响", async () => {
	const { bundle } = loadWithPrimitives({ withSurface: false });
	const registered = [];
	const disposers = [];
	const fakeContext = {
		workspaces: {
			list: { getSnapshot: () => ({ items: [{ workspaceId: "ws-1", title: "WS1", path: "/p", sessionIds: [] }], archivedSessionIds: [] }) }
		},
		sessions: { list: { getSnapshot: () => ({ byId: {} }) } },
		locale: { register: () => {}, bind: () => (k) => k },
		slots: {
			inject: (_, eff) => { eff?.(); return () => {}; },
			register: (spec) => { registered.push(spec.id); return () => {}; },
			entries: () => [{ children: { "sidebar.workspaces.session.menu.item": {} } }]
		},
		// 收集并执行清理：apply 里挂了收藏重试定时器，不清理会拖住测试进程
		effect: (fn) => {
			const dispose = fn();
			if (typeof dispose === "function") disposers.push(dispose);
			return dispose;
		},
		get: () => undefined
	};

	try {
		await bundle.apply(fakeContext);

		assert.ok(registered.includes("archive-manager.delete-session"), "删除会话菜单项仍要注册");
		assert.ok(registered.includes("archive-manager.favorite"), "收藏菜单项仍要注册");
		assert.ok(
			!registered.includes("archive-manager.move-session"),
			"拿不到宿主原语时移动会话入口不得注册，避免自绘菜单项"
		);
	} finally {
		for (const dispose of disposers) {
			try { dispose(); } catch {}
		}
	}
});

test("水平定位使用实测宽度：仅当实测宽度放不下时才翻转", () => {
	const { computeSubmenuPosition } = loadWithPrimitives();
	const triggerRect = { top: 100, bottom: 132, left: 10, right: 190 };
	const viewport = { width: 480, height: 600 };

	const unmeasured = computeSubmenuPosition({ triggerRect, viewport, itemCount: 2 });
	assert.equal(unmeasured.left, 192, "未测量时按 220 兜底宽度判断，右侧放得下");

	const wide = computeSubmenuPosition({ triggerRect, viewport, itemCount: 2, measuredWidth: 280 });
	assert.equal(wide.left, 10, "实测 280px 放不下时必须翻转到左侧");

	const clamped = computeSubmenuPosition({ triggerRect, viewport, itemCount: 2, measuredWidth: 999 });
	assert.equal(clamped.left, 10, "超过 CSS max-width 的测量值先夹到 280 再判断");
});

test("实测尺寸跨重算保留：拿不到新测量值时不退回估算宽度", () => {
	const { mergeSubmenuMeasurement } = loadWithPrimitives();

	const measured = mergeSubmenuMeasurement({}, 110, 280);
	assert.deepEqual(measured, { height: 110, width: 280 }, "首次测量要写入两个维度");

	// 悬停进入子菜单、父菜单滚动、窗口 resize 都会重算，此时没有新测量值，必须沿用真实尺寸
	assert.deepEqual(mergeSubmenuMeasurement(measured), { height: 110, width: 280 }, "缺少新值时不得丢掉已测量尺寸");
	assert.deepEqual(mergeSubmenuMeasurement(measured, 0, -1), { height: 110, width: 280 }, "非法测量值不得覆盖真实尺寸");
});

test("水平翻转返回 side，极矮视口按剩余空间收敛 maxHeight", () => {
	const { computeSubmenuPosition } = loadWithPrimitives();

	const flipped = computeSubmenuPosition({
		triggerRect: { top: 100, bottom: 132, left: 100, right: 280 },
		viewport: { width: 520, height: 600 },
		itemCount: 2,
		measuredWidth: 280
	});
	assert.equal(flipped.side, "left", "翻到左侧时必须标记 side，桥接条才挂得对");

	const normal = computeSubmenuPosition({
		triggerRect: { top: 100, bottom: 132, left: 10, right: 190 },
		viewport: { width: 900, height: 600 },
		itemCount: 2
	});
	assert.equal(normal.side, "right", "右侧放得下时保持 right");

	const shortViewport = computeSubmenuPosition({
		triggerRect: { top: 150, bottom: 182, left: 10, right: 190 },
		viewport: { width: 420, height: 180 },
		itemCount: 3
	});
	assert.ok(
		shortViewport.top + shortViewport.maxHeight <= 180 - 10,
		`极矮视口下元素底部不得越界：top=${shortViewport.top} maxHeight=${shortViewport.maxHeight}`
	);
});

test("可移动目标排除会话当前所在的工作区", () => {
	const { movableWorkspaces } = loadWithPrimitives();
	const items = [
		{ workspaceId: "w1", sessionIds: ["s1", "s2"] },
		{ workspaceId: "w2", sessionIds: ["s3"] },
		{ workspaceId: "w3" }
	];

	assert.deepEqual(movableWorkspaces(items, "s1").map((item) => item.workspaceId), ["w2", "w3"], "当前工作区不能作为移动目标");
	assert.deepEqual(movableWorkspaces(items, "unknown").map((item) => item.workspaceId), ["w1", "w2", "w3"], "找不到归属时不误删");
});

test("源码防回归：不得重新引入一级菜单 DOM 克隆、自绘材质层或降级按钮", async () => {
	const source = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
	assert.match(source, /MenuSurface/, "二级菜单必须使用宿主 MenuSurface 原语");
	assert.match(source, /hasMoveMenuPrimitives/, "必须集中判断宿主原语是否可用");
	const submenuRegion = source.slice(source.indexOf("function MoveSubmenu("), source.indexOf("async function apply("));
	assert.ok(submenuRegion.length > 0, "必须存在 MoveSubmenu 组件");
	assert.doesNotMatch(submenuRegion, /cloneNode\(/, "二级菜单不得克隆一级菜单 DOM 节点");
	assert.doesNotMatch(submenuRegion, /typeof Item === "function"/, "不得保留自绘行按钮的降级分支");
	assert.doesNotMatch(source, /closest<HTMLElement>\('\[role="menu"\]'\)/, "不得回到「从父级菜单同步 class」的写法");
	assert.doesNotMatch(source, /dsham_moveSubmenuMaterial/, "不得自绘材质层");
	assert.doesNotMatch(source, /dsham_moveSubmenuBtn/, "不得保留自绘行按钮样式");
	assert.doesNotMatch(source, /data-menu-material": "translucent"/, "不得硬编码宿主材质标记");

	// 接线守卫：这些行为没法在无 DOM 环境里驱动，用源码断言防止被静默删掉
	const rowRegion = source.slice(source.indexOf("function MoveSessionMenuItem("), source.indexOf("function focusSessionRow("));
	assert.ok(rowRegion.length > 0, "必须存在 MoveSessionMenuItem 组件");
	assert.match(rowRegion, /measuredSizeRef\.current\.width/, "位置重算必须沿用实测宽度，否则会退回估算值回跳");
	assert.match(rowRegion, /addEventListener\("scroll"/, "父菜单滚动时必须有重定位监听");
	assert.match(rowRegion, /setAttribute\("aria-controls"/, "展开时必须把 aria-controls 指到二级菜单 id");
});
