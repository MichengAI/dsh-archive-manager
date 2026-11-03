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
const styleStub = { dataset: {}, style: {}, setAttribute() {}, appendChild() {}, set textContent(_v) {} };
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

test("Issue #102: computeSubmenuPosition 在矮视口+靠下触发项时不向上过度漂移", () => {
	assert.equal(typeof t.computeSubmenuPosition, "function", "必须导出 computeSubmenuPosition 纯函数");
	const fn = t.computeSubmenuPosition;

	// 场景 1（报告者图 1 复现）：视口高 427px，3 个工作区（内容高约 110px），触发项在底部 (350~382)
	// 原逻辑：350 - 4 + 360 = 706 > 417，误判触底强行拉到 427 - 360 - 10 = 57px，产生 200px+ 悬空
	// 修复后：向下放不下（346 + 110 = 456 > 417），但向上翻转底边对齐 (382 + 4 - 110 = 276)
	const pos1 = fn({
		triggerRect: { top: 350, bottom: 382, left: 10, right: 190 },
		viewport: { width: 564, height: 427 },
		itemCount: 3
	});
	assert.ok(pos1.top >= 260 && pos1.top <= 290, `底边对齐向上展开时 top 应在 276 附近，实际为 ${pos1.top}`);
	assert.ok(pos1.top + 110 <= 427 - 10, "子菜单底部不超出视口安全下边距");

	// 场景 2（报告者图 2 复现）：视口高 512px，3 个工作区，触发项在倒数第二项 (320~352)
	// 原逻辑：误判 316 + 360 > 502 导致拉升到 142px
	// 修复后：向下空间充裕 (316 + 110 = 426 <= 502)，正常向下展开，top 贴齐触发项顶部 (316)
	const pos2 = fn({
		triggerRect: { top: 320, bottom: 352, left: 10, right: 190 },
		viewport: { width: 661, height: 512 },
		itemCount: 3
	});
	assert.equal(pos2.top, 316, `向下空间充足时应与触发项顶部平齐 (316)，实际为 ${pos2.top}`);

	// 场景 3：大视口正常展开
	const pos3 = fn({
		triggerRect: { top: 200, bottom: 232, left: 10, right: 190 },
		viewport: { width: 1440, height: 900 },
		itemCount: 5
	});
	assert.equal(pos3.top, 196, `大视口下应保持 top - 4 平齐 (196)，实际为 ${pos3.top}`);

	// 场景 4：水平空间不足自动翻转到左侧
	const pos4 = fn({
		triggerRect: { top: 100, bottom: 132, left: 200, right: 280 },
		viewport: { width: 320, height: 600 },
		itemCount: 2
	});
	assert.ok(pos4.left < 200, `水平空间不足时应翻转到左侧，实际为 ${pos4.left}`);
	assert.ok(pos4.left >= 10, "翻转到左侧后保持至少 10px 边距");

	// 场景 5：传入 DOM 实际测量高度时优先使用测量高度
	const pos5 = fn({
		triggerRect: { top: 320, bottom: 352, left: 10, right: 190 },
		viewport: { width: 661, height: 512 },
		itemCount: 3,
		measuredHeight: 140
	});
	// 316 + 140 = 456 <= 502，仍放得下
	assert.equal(pos5.top, 316);
});

test("Issue #102: 源码防回归断言，不再使用固定 360 常量误判越界", async () => {
	const source = await readFile(new URL("../src/client.ts", import.meta.url), "utf8");
	assert.ok(source.includes("computeSubmenuPosition"), "src/client.ts 必须定义并使用 computeSubmenuPosition");
	assert.ok(
		!source.includes("top + targetMaxHeight > winHeight"),
		"源码中不得直接使用 top + targetMaxHeight > winHeight 判定越界"
	);
});
