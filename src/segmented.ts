import type { ReactNode } from "react";

/** 与 0.1.7 SegmentedTabs / SegmentedControl 相同的轨道、滑块和键盘行为。更早的宿主没有这两个导出。 */
const CSS = ".dsham_segTabs{position:relative;display:grid;padding:4px;border-radius:12px;background:var(--dsw-alias-bg-module-platform)}.dsham_segTabsIndicator{position:absolute;inset:4px auto 4px 4px;box-sizing:border-box;border:0.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-3);transition:transform 180ms ease;pointer-events:none}.dsham_segTab{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:34px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:14px;line-height:20px;cursor:pointer;transition:color 180ms ease}.dsham_segTab:hover,.dsham_segTab[aria-selected=true]{background:transparent;color:var(--dsw-alias-label-primary)}.dsham_segTab[aria-selected=true]{font-weight:600}.dsham_segTab:focus-visible{outline:none;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}.dsham_segControl{position:relative;display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:2px;padding:3px;border-radius:9px;background:var(--dsw-alias-interactive-bg-hover)}.dsham_segControlIndicator{position:absolute;top:3px;left:3px;width:calc((100% - 6px - 2px * (var(--dsh-segment-count) - 1)) / var(--dsh-segment-count));height:calc(100% - 6px);border:0;border-radius:7px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-soft);transform:translateX(calc(var(--dsh-segment-index) * (100% + 2px)));transition:transform 160ms ease;pointer-events:none}.dsham_segControlTab{box-sizing:border-box;position:relative;z-index:1;height:28px;padding:0 16px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap;cursor:pointer;transition:color 120ms ease}.dsham_segControlTab:hover:not(:disabled),.dsham_segControlTab[aria-selected=true]{color:var(--dsw-alias-label-primary)}.dsham_segControlTab:disabled{cursor:default;opacity:.4}.dsham_segControlTab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}@media(prefers-reduced-motion:reduce){.dsham_segTabsIndicator,.dsham_segTab,.dsham_segControlIndicator,.dsham_segControlTab{transition:none}}";

interface TabItem<Value extends string> {
	value: Value;
	label: ReactNode;
	id: string;
	panelId: string;
}
interface SegmentOption<Value extends string> {
	value: Value;
	label: string;
	disabled?: boolean;
	title?: string;
}

function walkKey(key: string) {
	return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown" || key === "Home" || key === "End";
}

function walk<Value extends string>(options: readonly SegmentOption<Value>[], from: number, key: string) {
	const enabled = options.filter(option => option.disabled !== true);
	if (key === "Home") return enabled[0];
	if (key === "End") return enabled[enabled.length - 1];
	const step = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
	const count = options.length;
	for (let offset = 1; offset < count; offset += 1) {
		const candidate = options[((from + step * offset) % count + count) % count];
		if (candidate !== undefined && candidate.disabled !== true) return candidate;
	}
}

/** 老宿主使用的分段页签和分段选择，外观与 0.1.7 官方控件一致。 */
export function createSegmentedControls(React: typeof import("react")) {
	const h = React.createElement;
	function SegmentedTabs<Value extends string>({ items, value, onChange, label, className }: { items: readonly [TabItem<Value>, ...TabItem<Value>[]]; value: Value; onChange(value: Value): void; label: string; className?: string }) {
		const selectedIndex = items.findIndex(item => item.value === value);
		const onKeyDown = (event: import("react").KeyboardEvent<HTMLButtonElement>, index: number) => {
			let next: number;
			switch (event.key) {
				case "ArrowLeft": next = (index + items.length - 1) % items.length; break;
				case "ArrowRight": next = (index + 1) % items.length; break;
				case "Home": next = 0; break;
				case "End": next = items.length - 1; break;
				default: return;
			}
			event.preventDefault();
			event.stopPropagation();
			const tablist = event.currentTarget.parentElement;
			const nextItem = items[next];
			if (tablist === null || nextItem === undefined) return;
			tablist.querySelectorAll<HTMLElement>("[role=\"tab\"]").item(next)?.focus();
			onChange(nextItem.value);
		};
		return h(React.Fragment, null, h("style", null, CSS), h("div", {
			role: "tablist", "aria-label": label, className: className ? "dsham_segTabs " + className : "dsham_segTabs",
			style: { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }
		}, h("span", { className: "dsham_segTabsIndicator", "aria-hidden": true, style: { width: `calc((100% - 8px) / ${items.length})`, transform: `translateX(${selectedIndex * 100}%)` } }), items.map((item, index) => h("button", {
			key: item.value, id: item.id, type: "button", role: "tab", className: "dsham_segTab", "aria-selected": value === item.value, "aria-controls": item.panelId,
			tabIndex: value === item.value ? 0 : -1, onClick: () => onChange(item.value), onKeyDown: (event: import("react").KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index)
		}, item.label))));
	}
	function SegmentedControl<Value extends string>({ id, value, options, onChange, label, disabled = false, className }: { id: string; value: Value; options: readonly SegmentOption<Value>[]; onChange(next: Value): void; label: string; disabled?: boolean; className?: string }) {
		const list = React.useRef<HTMLDivElement>(null);
		const selected = options.findIndex(option => option.value === value);
		React.useEffect(() => {
			const root = list.current;
			if (root === null || !root.contains(document.activeElement)) return;
			root.querySelector<HTMLElement>("[role=\"tab\"][aria-selected=\"true\"]")?.focus();
		}, [value]);
		const onKeyDown = (event: import("react").KeyboardEvent<HTMLButtonElement>) => {
			if (!walkKey(event.key)) return;
			event.preventDefault();
			const target = walk(options, selected, event.key);
			if (target !== undefined && target.value !== value) onChange(target.value);
		};
		return h(React.Fragment, null, h("style", null, CSS), h("div", {
			ref: list, role: "tablist", "aria-label": label, className: className ? "dsham_segControl " + className : "dsham_segControl",
			style: { "--dsh-segment-count": String(options.length), "--dsh-segment-index": String(selected) }
		}, h("span", { "aria-hidden": true, className: "dsham_segControlIndicator" }), options.map(option => {
			const active = option.value === value;
			return h("button", {
				key: option.value, id: `${id}-${option.value}`, type: "button", role: "tab", "aria-selected": active, "aria-controls": `${id}-${option.value}-panel`,
				tabIndex: active ? 0 : -1, disabled: disabled || option.disabled === true, title: option.title, className: "dsham_segControlTab",
				onClick: () => { if (!active) onChange(option.value); }, onKeyDown
			}, option.label);
		})));
	}
	return { SegmentedTabs, SegmentedControl };
}
