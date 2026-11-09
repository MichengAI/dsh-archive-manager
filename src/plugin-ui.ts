import React from "react";

type Create = typeof React.createElement;

/** 宿主没有数字框。令牌对齐单行 Input，不桥接成 Ant InputNumber。 */
export function NumberField(props: {
	min?: number;
	max?: number;
	value: number | null;
	disabled?: boolean;
	"aria-label"?: string;
	onChange(value: number | null): void;
}) {
	return React.createElement("input", {
		className: "dsham_number",
		type: "number",
		min: props.min,
		max: props.max,
		value: props.value ?? "",
		disabled: props.disabled,
		"aria-label": props["aria-label"],
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
			const raw = event.target.value;
			if (raw === "") { props.onChange(null); return; }
			const next = Number(raw);
			props.onChange(Number.isNaN(next) ? null : next);
		},
	});
}

/** 宿主没有日期组件。内置 SVG 日历图标。 */
export function CalendarIcon(h: Create = React.createElement) {
	return h("svg", {
		className: "dsham_dateIcon",
		width: 14,
		height: 14,
		viewBox: "0 0 16 16",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.25,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": true,
	},
		h("rect", { x: 2, y: 3, width: 12, height: 11, rx: 2 }),
		h("line", { x1: 2, y1: 6.5, x2: 14, y2: 6.5 }),
		h("line", { x1: 5.5, y1: 1.5, x2: 5.5, y2: 3.5 }),
		h("line", { x1: 10.5, y1: 1.5, x2: 10.5, y2: 3.5 })
	);
}

function formatYmd(year: number, monthIndex: number, day: number) {
	const m = String(monthIndex + 1).padStart(2, "0");
	const d = String(day).padStart(2, "0");
	return `${year}-${m}-${d}`;
}

function parseYmd(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;
	return { year: Number(match[1]), monthIndex: Number(match[2]) - 1, day: Number(match[3]) };
}

export interface MonthGridCell {
	year: number;
	monthIndex: number;
	day: number;
	dateStr: string;
	isOutside: boolean;
}

export function buildMonthGrid(viewYear: number, viewMonth: number): MonthGridCell[] {
	const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
	const startOffset = (firstDayIndex === 0 ? 7 : firstDayIndex) - 1;
	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
	const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

	const cells: MonthGridCell[] = [];
	for (let i = 0; i < 42; i++) {
		let cellYear = viewYear;
		let cellMonth = viewMonth;
		let cellDay = 0;
		let isOutside = false;

		if (i < startOffset) {
			cellDay = prevMonthDays - startOffset + i + 1;
			cellMonth = viewMonth - 1;
			if (cellMonth < 0) { cellMonth = 11; cellYear--; }
			isOutside = true;
		} else if (i < startOffset + daysInMonth) {
			cellDay = i - startOffset + 1;
		} else {
			cellDay = i - startOffset - daysInMonth + 1;
			cellMonth = viewMonth + 1;
			if (cellMonth > 11) { cellMonth = 0; cellYear++; }
			isOutside = true;
		}
		cells.push({
			year: cellYear,
			monthIndex: cellMonth,
			day: cellDay,
			dateStr: formatYmd(cellYear, cellMonth, cellDay),
			isOutside
		});
	}
	return cells;
}

export function getPresetRange(type: "all" | "today" | "7d" | "30d" | "90d", now: Date = new Date()): { from: string; to: string } {
	if (type === "all") return { from: "", to: "" };
	const todayStr = formatYmd(now.getFullYear(), now.getMonth(), now.getDate());
	if (type === "today") return { from: todayStr, to: todayStr };
	const daysAgo = type === "7d" ? 6 : type === "30d" ? 29 : 89;
	const past = new Date(now.getTime() - daysAgo * 86400000);
	return {
		from: formatYmd(past.getFullYear(), past.getMonth(), past.getDate()),
		to: todayStr,
	};
}

/**
 * 按页翻月：把日号夹到目标月最后一天。
 * 直接用 new Date(year, month ± 1, day) 时，目标月天数不足会让 JS 继续向后滚动
 * （10-31 退一月落到 10-01、01-31 进一月落到 03-03），PageUp/PageDown 就会跳过整月。
 */
export function shiftMonthClamped(year: number, monthIndex: number, day: number, delta: number): Date {
	const targetMonth = monthIndex + delta;
	const lastDay = new Date(year, targetMonth + 1, 0).getDate();
	return new Date(year, targetMonth, Math.min(day, lastDay));
}

/** 宿主没有日期范围。单字段胶囊触发器 + 轻量级 DSH 风格日历范围浮层。 */
export function DateRange(props: {
	React?: typeof React;
	from: string;
	to: string;
	label: string;
	fromLabel: string;
	toLabel: string;
	invalid?: boolean;
	/** 初始展开状态；默认收起，测试与需要默认展开的嵌入场景可传 true。 */
	defaultOpen?: boolean;
	t?: (key: string, params?: Record<string, unknown>) => string;
	onFrom(value: string): void;
	onTo(value: string): void;
	onClear(): void;
}) {
	const R = props.React || React;

	function change(which: "from" | "to", value: string) {
		const nextFrom = which === "from" ? value : props.from;
		const nextTo = which === "to" ? value : props.to;
		if (nextFrom === "" && nextTo === "") { props.onClear(); return; }
		if (which === "from") props.onFrom(value);
		else props.onTo(value);
	}

	const hasValue = Boolean(props.from || props.to);
	let displayText = "";
	if (props.from && props.to) {
		displayText = `${props.from} – ${props.to}`;
	} else if (props.from) {
		displayText = `${props.from} –`;
	} else if (props.to) {
		displayText = `– ${props.to}`;
	} else {
		displayText = props.t ? (props.t("discovery.timeRange") || `${props.fromLabel} – ${props.toLabel}`) : `${props.fromLabel} – ${props.toLabel}`;
	}

	const useRef = R.useRef ?? ((initial: unknown) => {
		const [ref] = R.useState({ current: initial });
		return ref;
	});
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = R.useState(Boolean(props.defaultOpen));
	const initial = parseYmd(props.from || props.to) ?? { year: new Date().getFullYear(), monthIndex: new Date().getMonth(), day: new Date().getDate() };
	const [viewYear, setViewYear] = R.useState(initial.year);
	const [viewMonth, setViewMonth] = R.useState(initial.monthIndex);
	const [tempStart, setTempStart] = R.useState<string | null>(null);
	const [hoverDate, setHoverDate] = R.useState<string | null>(null);
	const [focusedDate, setFocusedDate] = R.useState<string | null>(null);

	R.useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: MouseEvent | TouchEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false);
				setTempStart(null);
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				setOpen(false);
				setTempStart(null);
			}
		};
		if (typeof document !== "undefined") document.addEventListener("mousedown", onPointerDown, true);
		if (typeof window !== "undefined") window.addEventListener("keydown", onKeyDown, true);
		return () => {
			if (typeof document !== "undefined") document.removeEventListener("mousedown", onPointerDown, true);
			if (typeof window !== "undefined") window.removeEventListener("keydown", onKeyDown, true);
		};
	}, [open]);

	R.useEffect(() => {
		if (!open || !focusedDate || !containerRef.current) return;
		const el = containerRef.current.querySelector<HTMLElement>(`[data-date="${focusedDate}"]`);
		el?.focus();
	}, [open, focusedDate]);

	const langTag = props.t ? (props.t("locale.language") || "").toLowerCase() : "";
	const lang = langTag.startsWith("en") ? "en"
		: langTag.startsWith("ja") ? "ja"
		: langTag.startsWith("es") ? "es"
		: langTag.startsWith("fr") ? "fr"
		: langTag.startsWith("de") ? "de"
		: langTag.startsWith("ru") ? "ru"
		: langTag.startsWith("pt") ? "pt"
		: (props.t?.("discovery.today") === "Today" ? "en"
			: props.t?.("discovery.today") === "Сегодня" ? "ru"
			: props.t?.("discovery.today") === "今日" ? "ja"
			: "zh");

	const localeMap: Record<string, string> = {
		zh: "zh-CN",
		en: "en-US",
		ja: "ja-JP",
		es: "es-ES",
		fr: "fr-FR",
		de: "de-DE",
		ru: "ru-RU",
		pt: "pt-BR",
	};
	const locale = localeMap[lang] || "zh-CN";

	const weekdayMap: Record<string, string[]> = {
		zh: ["一", "二", "三", "四", "五", "六", "日"],
		en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
		ja: ["月", "火", "水", "木", "金", "土", "日"],
		es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
		fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
		de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
		ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
		pt: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
	};
	const weekdays = weekdayMap[lang] || weekdayMap.zh;

	function prevMonth(event: React.MouseEvent) {
		event.stopPropagation();
		if (viewMonth <= 0) {
			setViewMonth(11);
			setViewYear((y: number) => y - 1);
		} else {
			setViewMonth((m: number) => m - 1);
		}
	}

	function nextMonth(event: React.MouseEvent) {
		event.stopPropagation();
		if (viewMonth >= 11) {
			setViewMonth(0);
			setViewYear((y: number) => y + 1);
		} else {
			setViewMonth((m: number) => m + 1);
		}
	}

	function handleDayClick(dateStr: string) {
		if (!tempStart) {
			setTempStart(dateStr);
			setHoverDate(dateStr);
		} else {
			if (dateStr >= tempStart) {
				props.onFrom(tempStart);
				props.onTo(dateStr);
			} else {
				props.onFrom(dateStr);
				props.onTo(tempStart);
			}
			setTempStart(null);
			setOpen(false);
		}
	}

	function applyPreset(type: "all" | "today" | "7d" | "30d" | "90d") {
		const range = getPresetRange(type);
		if (type === "all") {
			props.onClear();
		} else {
			props.onFrom(range.from);
			props.onTo(range.to);
		}
		setTempStart(null);
		setOpen(false);
	}

	function moveFocusToDate(d: Date) {
		const nextDateStr = formatYmd(d.getFullYear(), d.getMonth(), d.getDate());
		setFocusedDate(nextDateStr);
		if (tempStart) setHoverDate(nextDateStr);
		if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) {
			setViewYear(d.getFullYear());
			setViewMonth(d.getMonth());
		}
	}

	function moveFocus(currentDateStr: string, offsetDays: number) {
		const parts = parseYmd(currentDateStr);
		if (!parts) return;
		moveFocusToDate(new Date(parts.year, parts.monthIndex, parts.day + offsetDays));
	}

	let curFrom = props.from;
	let curTo = props.to;
	if (tempStart && hoverDate) {
		curFrom = tempStart <= hoverDate ? tempStart : hoverDate;
		curTo = tempStart <= hoverDate ? hoverDate : tempStart;
	}

	const gridCells = buildMonthGrid(viewYear, viewMonth);
	const today = new Date();
	const activeAnchorDate = focusedDate || curFrom || formatYmd(today.getFullYear(), today.getMonth(), today.getDate());

	const cells: React.ReactNode[] = gridCells.map((cell, i) => {
		const isStart = curFrom === cell.dateStr;
		const isEnd = curTo === cell.dateStr;
		const inRange = Boolean(curFrom && curTo && cell.dateStr > curFrom && cell.dateStr < curTo);
		const isToday = cell.year === today.getFullYear() && cell.monthIndex === today.getMonth() && cell.day === today.getDate();

		let cls = "dsham_dateDay";
		if (cell.isOutside) cls += " is-outside";
		if (isToday) cls += " is-today";
		if (isStart) cls += " is-start";
		if (isEnd) cls += " is-end";
		if (inRange) cls += " is-in-range";

		const isTabTarget = !cell.isOutside && (cell.dateStr === activeAnchorDate || (cell.day === 1 && !gridCells.some(c => !c.isOutside && c.dateStr === activeAnchorDate)));

		return R.createElement("div", {
			key: i,
			className: cls,
			role: "button",
			tabIndex: isTabTarget ? 0 : -1,
			"data-date": cell.dateStr,
			"aria-label": cell.dateStr,
			"aria-pressed": Boolean(isStart || isEnd || inRange),
			onClick: (e: React.MouseEvent) => { e.stopPropagation(); handleDayClick(cell.dateStr); },
			onKeyDown: (e: React.KeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					handleDayClick(cell.dateStr);
				} else if (e.key === "ArrowLeft") {
					e.preventDefault();
					e.stopPropagation();
					moveFocus(cell.dateStr, -1);
				} else if (e.key === "ArrowRight") {
					e.preventDefault();
					e.stopPropagation();
					moveFocus(cell.dateStr, 1);
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					e.stopPropagation();
					moveFocus(cell.dateStr, -7);
				} else if (e.key === "ArrowDown") {
					e.preventDefault();
					e.stopPropagation();
					moveFocus(cell.dateStr, 7);
				} else if (e.key === "Home") {
					e.preventDefault();
					e.stopPropagation();
					const parts = parseYmd(cell.dateStr);
					if (parts) {
						const cur = new Date(parts.year, parts.monthIndex, parts.day);
						const dayOfWeek = (cur.getDay() === 0 ? 7 : cur.getDay()) - 1;
						cur.setDate(cur.getDate() - dayOfWeek);
						moveFocusToDate(cur);
					}
				} else if (e.key === "End") {
					e.preventDefault();
					e.stopPropagation();
					const parts = parseYmd(cell.dateStr);
					if (parts) {
						const cur = new Date(parts.year, parts.monthIndex, parts.day);
						const dayOfWeek = (cur.getDay() === 0 ? 7 : cur.getDay()) - 1;
						cur.setDate(cur.getDate() + (6 - dayOfWeek));
						moveFocusToDate(cur);
					}
				} else if (e.key === "PageUp") {
					e.preventDefault();
					e.stopPropagation();
					const parts = parseYmd(cell.dateStr);
					if (parts) {
						moveFocusToDate(shiftMonthClamped(parts.year, parts.monthIndex, parts.day, -1));
					}
				} else if (e.key === "PageDown") {
					e.preventDefault();
					e.stopPropagation();
					const parts = parseYmd(cell.dateStr);
					if (parts) {
						moveFocusToDate(shiftMonthClamped(parts.year, parts.monthIndex, parts.day, 1));
					}
				}
			},
			onMouseEnter: () => { if (tempStart) setHoverDate(cell.dateStr); },
		}, cell.day);
	});

	let monthTitle = `${viewYear}年 ${viewMonth + 1}月`;
	try {
		monthTitle = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(new Date(viewYear, viewMonth, 1));
	} catch {
		monthTitle = (lang === "zh" || lang === "ja") ? `${viewYear}年 ${viewMonth + 1}月` : `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
	}

	return R.createElement("div", { ref: containerRef, className: "dsham_dateRange", role: "group", "aria-label": props.label },
		R.createElement("input", { className: "dsham_dateInputSrOnly", type: "date", tabIndex: -1, "aria-hidden": true, value: props.from, "aria-label": props.fromLabel, "aria-invalid": props.invalid || undefined, onChange: (event: React.ChangeEvent<HTMLInputElement>) => change("from", event.target.value) }),
		R.createElement("input", { className: "dsham_dateInputSrOnly", type: "date", tabIndex: -1, "aria-hidden": true, value: props.to, "aria-label": props.toLabel, "aria-invalid": props.invalid || undefined, onChange: (event: React.ChangeEvent<HTMLInputElement>) => change("to", event.target.value) }),
		R.createElement("div", {
			className: "dsham_dateTrigger" + (open ? " is-open" : ""),
			role: "button",
			tabIndex: 0,
			"aria-expanded": open,
			"aria-controls": open ? "dsham-date-popover" : undefined,
			onClick: () => {
				if (open) setTempStart(null);
				setOpen(!open);
			},
			onKeyDown: (e: React.KeyboardEvent) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					if (open) setTempStart(null);
					setOpen(!open);
				}
			},
		},
			CalendarIcon(R.createElement),
			R.createElement("span", { className: "dsham_dateText" + (hasValue ? "" : " placeholder") }, displayText),
			hasValue ? R.createElement("button", {
				type: "button",
				className: "dsham_dateClearBtn",
				"aria-label": "clear",
				title: "clear",
				onClick: (e: React.MouseEvent) => {
					e.stopPropagation();
					props.onClear();
					setTempStart(null);
				},
				children: "×",
			}) : null,
			R.createElement("span", { className: "dsham_dateChevron" }, foldChevron(R.createElement, open))
		),
		open && R.createElement("div", { id: "dsham-date-popover", className: "dsham_datePopover", role: "region", "aria-label": props.label, onClick: (e: React.MouseEvent) => e.stopPropagation() },
			R.createElement("div", { className: "dsham_datePresets" },
				R.createElement("button", { type: "button", className: "dsham_datePresetBtn", onClick: () => applyPreset("all") }, props.t ? props.t("discovery.allTime") : "全部时间"),
				R.createElement("button", { type: "button", className: "dsham_datePresetBtn", onClick: () => applyPreset("today") }, props.t ? props.t("discovery.today") : "今天"),
				R.createElement("button", { type: "button", className: "dsham_datePresetBtn", onClick: () => applyPreset("7d") }, props.t ? props.t("discovery.last7Days") : "近 7 天"),
				R.createElement("button", { type: "button", className: "dsham_datePresetBtn", onClick: () => applyPreset("30d") }, props.t ? props.t("discovery.last30Days") : "近 30 天"),
				R.createElement("button", { type: "button", className: "dsham_datePresetBtn", onClick: () => applyPreset("90d") }, props.t ? props.t("discovery.last90Days") : "近 90 天")
			),
			R.createElement("div", { className: "dsham_dateCalendar" },
				R.createElement("div", { className: "dsham_dateCalHeader" },
					R.createElement("button", { type: "button", className: "dsham_dateNavBtn", onClick: prevMonth, "aria-label": "prev month" }, "‹"),
					R.createElement("span", { className: "dsham_dateMonthTitle" }, monthTitle),
					R.createElement("button", { type: "button", className: "dsham_dateNavBtn", onClick: nextMonth, "aria-label": "next month" }, "›")
				),
				R.createElement("div", { className: "dsham_dateGrid" },
					weekdays.map((w, idx) => R.createElement("div", { key: idx, className: "dsham_dateWeekday" }, w))
				),
				R.createElement("div", { className: "dsham_dateGrid" }, cells)
			)
		)
	);
}

/** 失败详情用受控按钮加区域，不使用 Ant Collapse。 */
export function Disclosure(props: { title: React.ReactNode; open: boolean; onToggle(): void; className?: string; children?: React.ReactNode }) {
	return React.createElement("div", { className: props.className },
		React.createElement("button", { type: "button", className: "dsham_disclosure", "aria-expanded": props.open, onClick: props.onToggle },
			foldChevron(React.createElement, props.open),
			props.title),
		props.open ? React.createElement("div", null, props.children) : null);
}

/** 折叠箭头。方向由 aria-expanded 决定，不靠动画结束才算展开。 */
export function foldChevron(h: Create, open: boolean) {
	return h("svg", {
		className: "dsham_foldChevron" + (open ? " is-open" : ""),
		viewBox: "0 0 16 16",
		width: 12,
		height: 12,
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.5,
		"aria-hidden": true,
	}, h("path", { d: "M4 6l4 4 4-4", strokeLinecap: "round", strokeLinejoin: "round" }));
}

/**
 * 行内选择框需要半选。宿主 Checkbox 会画出可见标签，也不接收 indeterminate。
 * 标签由调用方放在旁边，这里只画 16px 原生框。
 */
export function SelectionCheckbox(props: {
	checked: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	label: string;
	onChange: (event: { target: { checked: boolean } }) => void;
}) {
	const ref = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		if (ref.current) ref.current.indeterminate = Boolean(props.indeterminate) && !props.checked;
	}, [props.indeterminate, props.checked]);
	return React.createElement("input", {
		ref,
		className: "dsham_checkbox",
		type: "checkbox",
		checked: props.checked,
		disabled: props.disabled,
		"aria-label": props.label,
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => props.onChange({ target: { checked: event.target.checked } }),
	});
}
