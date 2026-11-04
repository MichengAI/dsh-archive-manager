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
import { createElement } from "react";
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
	createElement: () => styleStub,
	addEventListener: () => {},
	removeEventListener: () => {}
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });

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
function loadWithPrimitives({ withMenuItemButton = true } = {}) {
	const surfaceProps = [];
	const itemProps = [];
	const primitives = {
		MenuSurface: (props) => {
			surfaceProps.push(props);
			return createElement("div", {
				"data-testid": "surface",
				className: props.className,
				role: props.role,
				"aria-label": props["aria-label"],
				"data-menu-material": props["data-menu-material"],
				style: props.style
			}, props.children);
		},
		IconFolderCloseMedium: () => createElement("span", { "data-testid": "folder-icon" })
	};
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
	return { MoveSubmenu: bundle.__test.MoveSubmenu, computeSubmenuPosition: bundle.__test.computeSubmenuPosition, surfaceProps, itemProps };
}

const ws = (id, title) => ({ workspaceId: id, title, path: `D:\\repo\\${id}`, sessionIds: [] });
const translate = (key) => key;
const baseProps = (overrides = {}) => ({
	surfaceRef: { current: null },
	pos: { top: 40, left: 120, maxHeight: 320 },
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

test("无 MenuItemButton 的宿主回退为可点击 menuitem，并保留样式钩子", () => {
	const { MoveSubmenu } = loadWithPrimitives({ withMenuItemButton: false });
	const selected = [];
	// 回退分支不得依赖 portal：Node 环境能静态渲染出完整结构即为证明
	const html = renderToStaticMarkup(createElement(MoveSubmenu, baseProps({
		onSelect: (workspaceId, title) => selected.push([workspaceId, title])
	})));

	assert.match(html, /class="dsham_moveSubmenuBtn"/, "回退行必须保留 hover/focus 样式钩子");
	assert.match(html, /role="menuitem"/);
	assert.equal((html.match(/role="menuitem"/g) ?? []).length, 2);
	assert.ok(selected.length === 0, "静态渲染阶段不应触发选择");
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

test("源码防回归：不得重新引入一级菜单 DOM 克隆或自绘材质层", async () => {
	const source = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
	assert.match(source, /MenuSurface/, "二级菜单必须使用宿主 MenuSurface 原语");
	const submenuRegion = source.slice(source.indexOf("function MoveSubmenu("), source.indexOf("async function apply("));
	assert.ok(submenuRegion.length > 0, "必须存在 MoveSubmenu 组件");
	assert.doesNotMatch(submenuRegion, /cloneNode\(/, "二级菜单不得克隆一级菜单 DOM 节点");
	assert.doesNotMatch(source, /closest<HTMLElement>\('\[role="menu"\]'\)/, "不得回到「从父级菜单同步 class」的写法");
	assert.doesNotMatch(source, /dsham_moveSubmenuMaterial/, "不得自绘材质层");
	assert.doesNotMatch(source, /data-menu-material": "translucent"/, "不得硬编码宿主材质标记");
});
