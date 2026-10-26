import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

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
statics["@deepseek-ai/dsh-client-ui-primitives"] = new Proxy({}, {
	get: (target, prop) => {
		if (typeof prop === "string") target[prop] = () => null;
		return target[prop];
	}
});

globalThis.window = globalThis;
const styleStub = { dataset: {}, style: {}, setAttribute() {}, appendChild() {}, set textContent(v) {} };
const headStub = { appendChild() {}, removeChild() {}, insertBefore() {}, contains: () => false, querySelector: () => null, querySelectorAll: () => [] };
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

const bundle = materialize("@michengai/dsh-archive-manager", {
	staticModules: {
		...statics,
		"@deepseek-ai/dsh-client-store": { defineStore }
	}
});
const t = bundle.__test;

class MockElement {
	constructor(tagName = "div", attrs = {}) {
		this.tagName = tagName.toUpperCase();
		this.attributes = new Map(Object.entries(attrs));
		this.children = [];
		this.parentElement = null;
		this.listeners = new Map();
		this.clicked = 0;
	}
	getAttribute(name) { return this.attributes.get(name) ?? null; }
	setAttribute(name, val) { this.attributes.set(name, String(val)); }
	hasAttribute(name) { return this.attributes.has(name); }
	appendChild(child) {
		child.parentElement = this;
		this.children.push(child);
		return child;
	}
	closest(selector) {
		let curr = this;
		while (curr) {
			if (curr.matches(selector)) return curr;
			curr = curr.parentElement;
		}
		return null;
	}
	matches(selector) {
		const parts = selector.split(",").map((s) => s.trim());
		for (const part of parts) {
			if (part === "input" && this.tagName === "INPUT") return true;
			if (part === "textarea" && this.tagName === "TEXTAREA") return true;
			if (part === "button" && this.tagName === "BUTTON") return true;
			if (part === "[contenteditable='true']" && this.getAttribute("contenteditable") === "true") return true;
			if (part === '[data-row-key^="workspace:"]') {
				const key = this.getAttribute("data-row-key") ?? "";
				if (key.startsWith("workspace:")) return true;
			}
			if (part === '[data-row-key^="session:"]') {
				const key = this.getAttribute("data-row-key") ?? "";
				if (key.startsWith("session:")) return true;
			}
			if (part === '[class*="rowActions"]') {
				const cls = this.getAttribute("class") ?? "";
				if (cls.includes("rowActions")) return true;
			}
		}
		return false;
	}
	querySelector(selector) {
		const all = this.querySelectorAll(selector);
		return all[0] ?? null;
	}
	querySelectorAll(selector) {
		const results = [];
		const walk = (node) => {
			for (const child of node.children) {
				if (child.matches(selector)) results.push(child);
				walk(child);
			}
		};
		walk(this);
		return results;
	}
	click() {
		this.clicked++;
	}
}

test("findRowMenuButton 能从工作区和会话行中精确定位到 ... 按钮", () => {
	assert.equal(typeof t.findRowMenuButton, "function", "findRowMenuButton 必须作为纯函数导出供测试与调用");

	// 1. 工作区行：带有 ... 按钮和 + 新建会话按钮
	const wsRow = new MockElement("div", { "data-row-key": "workspace:ws_1" });
	const wsActions = new MockElement("span", { class: "Rows_module_rowActions__abc" });
	const wsMenuBtn = new MockElement("button", { "aria-label": "Actions for workspace ws_1" });
	const wsNewBtn = new MockElement("button", { "aria-label": "New session" });
	wsActions.appendChild(wsMenuBtn);
	wsActions.appendChild(wsNewBtn);
	wsRow.appendChild(wsActions);

	const foundWs = t.findRowMenuButton(wsRow);
	assert.equal(foundWs, wsMenuBtn, "工作区行应定位到 actions 菜单按钮，而不是新建按钮");

	// 2. 会话行：带 actions 按钮
	const sessionRow = new MockElement("div", { "data-row-key": "session:sess_1" });
	const sessionActions = new MockElement("span", { class: "Rows_module_rowActions__abc" });
	const sessionMenuBtn = new MockElement("button", { "aria-label": "会话操作：测试会话" });
	sessionActions.appendChild(sessionMenuBtn);
	sessionRow.appendChild(sessionActions);

	const foundSession = t.findRowMenuButton(sessionRow);
	assert.equal(foundSession, sessionMenuBtn, "会话行应精确定位到会话操作菜单按钮");
});

test("setupSidebarRowContextMenu 在整行右键时阻止默认右键菜单并触发 ... 按钮点击", () => {
	assert.equal(typeof t.setupSidebarRowContextMenu, "function", "setupSidebarRowContextMenu 必须导出");

	const listeners = new Map();
	const prevAdd = document.addEventListener;
	const prevRemove = document.removeEventListener;

	document.addEventListener = (type, fn, capture) => {
		if (!listeners.has(type)) listeners.set(type, []);
		listeners.get(type).push({ fn, capture });
	};
	document.removeEventListener = (type, fn, capture) => {
		const list = listeners.get(type) ?? [];
		listeners.set(type, list.filter((item) => item.fn !== fn));
	};

	try {
		const dispose = t.setupSidebarRowContextMenu();
		assert.equal(typeof dispose, "function");
		const contextmenuHandlers = listeners.get("contextmenu") ?? [];
		assert.ok(contextmenuHandlers.length > 0, "必须监听 contextmenu 事件");

		const handler = contextmenuHandlers[0].fn;

		// 1. 工作区行整行空白处右键
		const wsRow = new MockElement("div", { "data-row-key": "workspace:ws_1" });
		const wsTitle = new MockElement("span", { class: "title" });
		const wsActions = new MockElement("span", { class: "rowActions" });
		const wsMenuBtn = new MockElement("button", { "aria-label": "Actions for workspace ws_1" });
		wsActions.appendChild(wsMenuBtn);
		wsRow.appendChild(wsTitle);
		wsRow.appendChild(wsActions);

		let prevented = false;
		let stopped = false;
		const event1 = {
			target: wsTitle,
			preventDefault() { prevented = true; },
			stopPropagation() { stopped = true; }
		};

		handler(event1);
		assert.equal(prevented, true, "在工作区行上右键必须 preventDefault");
		assert.equal(stopped, true, "在工作区行上右键必须 stopPropagation");
		assert.equal(wsMenuBtn.clicked, 1, "必须触发工作区 ... 按钮的 click");

		// 2. 会话行整行标题处右键
		const sessionRow = new MockElement("div", { "data-row-key": "session:sess_1" });
		const sessionTitle = new MockElement("span", { class: "sessionTitle" });
		const sessionActions = new MockElement("span", { class: "rowActions" });
		const sessionMenuBtn = new MockElement("button", { "aria-label": "Actions for session" });
		sessionActions.appendChild(sessionMenuBtn);
		sessionRow.appendChild(sessionTitle);
		sessionRow.appendChild(sessionActions);

		let sessionPrevented = false;
		const event2 = {
			target: sessionTitle,
			preventDefault() { sessionPrevented = true; },
			stopPropagation() {}
		};

		handler(event2);
		assert.equal(sessionPrevented, true, "在会话行上右键必须 preventDefault");
		assert.equal(sessionMenuBtn.clicked, 1, "必须触发会话 ... 按钮的 click");

		// 3. 用户在输入框中重命名时右键：必须放行，不拦截，不触发菜单
		const inputEl = new MockElement("input");
		sessionRow.appendChild(inputEl);
		let inputPrevented = false;
		const event3 = {
			target: inputEl,
			preventDefault() { inputPrevented = true; },
			stopPropagation() {}
		};
		handler(event3);
		assert.equal(inputPrevented, false, "输入框内右键不得被 preventDefault");
		assert.equal(sessionMenuBtn.clicked, 1, "输入框内右键不得误触发菜单按钮");

		// 4. 用户右键新建按钮或星标等非菜单按钮时：不得触发 ... 菜单
		const newBtn = new MockElement("button", { "aria-label": "New session" });
		wsActions.appendChild(newBtn);
		let newBtnPrevented = false;
		const event4 = {
			target: newBtn,
			preventDefault() { newBtnPrevented = true; },
			stopPropagation() {}
		};
		handler(event4);
		assert.equal(newBtnPrevented, false, "点击新建等功能按钮时不得拦截右键");
		assert.equal(wsMenuBtn.clicked, 1, "点击新建按钮时不得触发操作菜单");

		// 5. 未分组工作区行（只有新建按钮，无菜单）：右键不得触发任何点击，不得 preventDefault
		const ungroupedRow = new MockElement("div", { "data-row-key": "workspace:" });
		const ungroupedActions = new MockElement("div", { class: "rowActions" });
		ungroupedRow.appendChild(ungroupedActions);
		const createOnlyBtn = new MockElement("button", { "aria-label": "在未分组中新建会话" });
		ungroupedActions.appendChild(createOnlyBtn);
		let ungroupedPrevented = false;
		handler({
			target: ungroupedRow,
			preventDefault() { ungroupedPrevented = true; },
			stopPropagation() {}
		});
		assert.equal(ungroupedPrevented, false, "未分组行无菜单时右键不得被 preventDefault");
		assert.equal(createOnlyBtn.clicked, 0, "未分组行右键绝不得误触新建按钮");

		// 6. 空白会话行（没有 rowActions，行内只有星标）：右键不得触发星标，不得 preventDefault
		const blankSessionRow = new MockElement("div", { "data-row-key": "session:blank-temp-id" });
		const starSlot = new MockElement("span", { class: "dsham_starSlot" });
		const starBtn = new MockElement("button", { class: "dsham_rowStar", "aria-label": "Favorite" });
		starSlot.appendChild(starBtn);
		blankSessionRow.appendChild(starSlot);
		let blankPrevented = false;
		handler({
			target: blankSessionRow,
			preventDefault() { blankPrevented = true; },
			stopPropagation() {}
		});
		assert.equal(blankPrevented, false, "空白会话行无菜单时右键不得被 preventDefault");
		assert.equal(starBtn.clicked, 0, "空白会话行右键绝不得误触星标按钮");

		// 7. 卸载清理验证
		dispose();
		const afterHandlers = listeners.get("contextmenu") ?? [];
		assert.equal(afterHandlers.length, 0, "dispose 必须注销事件监听器");
	} finally {
		document.addEventListener = prevAdd;
		document.removeEventListener = prevRemove;
	}
});
