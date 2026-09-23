import type { Locale } from "antd/es/locale/index.js";
import darkAlgorithmImport from "antd/es/theme/themes/dark/index.js";
import defaultAlgorithmImport from "antd/es/theme/themes/default/index.js";
import type { ButtonProps } from "antd/es/button/Button.js";
import ButtonImport from "antd/es/button/index.js";
import type { CheckboxProps } from "antd/es/checkbox/Checkbox.js";
import CheckboxImport from "antd/es/checkbox/index.js";
import type { CollapseProps } from "antd/es/collapse/index.js";
import CollapseImport from "antd/es/collapse/index.js";
import type { ConfigProviderProps } from "antd/es/config-provider/index.js";
import ConfigProviderImport from "antd/es/config-provider/index.js";
import type { DropdownProps } from "antd/es/dropdown/dropdown.js";
import DropdownImport from "antd/es/dropdown/index.js";
import type { InputProps } from "antd/es/input/Input.js";
import InputImport from "antd/es/input/index.js";
import type { InputNumberProps } from "antd/es/input-number/index.js";
import InputNumberImport from "antd/es/input-number/index.js";
import type { ModalProps } from "antd/es/modal/interface.js";
import ModalImport from "antd/es/modal/index.js";
import type { ProgressProps } from "antd/es/progress/progress.js";
import ProgressImport from "antd/es/progress/index.js";
import type { SegmentedProps } from "antd/es/segmented/index.js";
import SegmentedImport from "antd/es/segmented/index.js";
import type { ListProps } from "antd/es/list/index.js";
import ListImport from "antd/es/list/index.js";
import type { ListItemProps } from "antd/es/list/Item.js";
import ListItemImport from "antd/es/list/Item.js";
import type { SelectProps } from "antd/es/select/index.js";
import SelectImport from "antd/es/select/index.js";
import type { RangePickerProps } from "antd/es/date-picker/index.js";
import DatePickerImport from "antd/es/date-picker/index.js";
import { antdLocale } from "./antd-locale.js";
import { useHostDark } from "./host-theme.js";
import React from "react";

function unwrap<T>(mod: unknown): T {
	let value = mod as { default?: unknown; $$typeof?: unknown };
	for (let i = 0; i < 4 && value && typeof value === "object" && value.$$typeof == null && value.default; i += 1) value = value.default as { default?: unknown; $$typeof?: unknown };
	return value as T;
}

export const Input = unwrap<React.ComponentType<InputProps>>(InputImport);
export const InputNumber = unwrap<React.ComponentType<InputNumberProps>>(InputNumberImport);
export const Button = unwrap<React.ComponentType<ButtonProps>>(ButtonImport);
export const Checkbox = unwrap<React.ComponentType<CheckboxProps>>(CheckboxImport);
export const Collapse = unwrap<React.ComponentType<CollapseProps>>(CollapseImport);
export const ConfigProvider = unwrap<React.ComponentType<ConfigProviderProps>>(ConfigProviderImport);
export const Dropdown = unwrap<React.ComponentType<DropdownProps>>(DropdownImport);
export const Modal = unwrap<React.ComponentType<ModalProps>>(ModalImport);
export const Progress = unwrap<React.ComponentType<ProgressProps>>(ProgressImport);
export const Segmented = unwrap<React.ComponentType<SegmentedProps>>(SegmentedImport);
export const Select = unwrap<React.ComponentType<SelectProps>>(SelectImport);
const DatePicker = unwrap<React.ComponentType<unknown> & { RangePicker: React.ComponentType<RangePickerProps> }>(DatePickerImport);
export const RangePicker = DatePicker.RangePicker;
const ListItem = unwrap<React.ComponentType<ListItemProps>>(ListItemImport);
export const List = Object.assign(unwrap<React.ComponentType<ListProps<unknown>>>(ListImport), { Item: ListItem });
const darkAlgorithm = unwrap<NonNullable<ConfigProviderProps["theme"]> extends { algorithm?: infer Algorithm } ? Algorithm : never>(darkAlgorithmImport);
const defaultAlgorithm = unwrap<NonNullable<ConfigProviderProps["theme"]> extends { algorithm?: infer Algorithm } ? Algorithm : never>(defaultAlgorithmImport);

/**
 * antd 的层阶方向与宿主相反：antd 暗色越往上越黑（容器 #000、浮层 #1f1f1f），
 * 宿主 DSH 越往上越亮（base #151517 → layer-1 #232324 → layer-3 #353638）。
 * 沿用 antd 自带深色调色板，输入框与分段控件就会在面板上塌成黑块。
 *
 * 因此把 antd 的面色、边框、文字别名逐项映射到宿主 --dsw-alias-* 令牌，
 * 让面板跟随宿主主题，宿主换肤时无需同步改这里。
 *
 * 只覆盖“叶子”令牌（面色 / 边框 / 文字 / 悬浮底色）：这些值 antd 原样输出。
 * 参与颜色推导的种子（colorPrimary 等）不能给 CSS 变量——antd 会把它当颜色
 * 去算 hover/active，结果退化成近黑色。
 */
export const hostAliasTokens = {
	colorBgContainer: "var(--dsw-alias-bg-layer-3)",
	colorBgElevated: "var(--dsw-alias-bg-layer-3)",
	colorBgLayout: "var(--dsw-alias-bg-layer-2)",
	colorBgSpotlight: "var(--dsw-alias-button-elevated-fill)",
	colorBorder: "var(--dsw-alias-border-l3)",
	colorBorderSecondary: "var(--dsw-alias-border-l2)",
	colorSplit: "var(--dsw-alias-border-l2)",
	colorText: "var(--dsw-alias-label-primary)",
	colorTextSecondary: "var(--dsw-alias-label-secondary)",
	colorTextTertiary: "var(--dsw-alias-label-tertiary)",
	colorTextQuaternary: "var(--dsw-alias-label-tertiary)",
	colorTextPlaceholder: "var(--dsw-alias-label-tertiary)",
	colorTextDisabled: "var(--dsw-alias-label-tertiary)",
	colorFill: "var(--dsw-alias-interactive-bg-hover)",
	colorFillSecondary: "var(--dsw-alias-interactive-bg-hover)",
	colorFillTertiary: "var(--dsw-alias-interactive-bg-hover)",
	colorFillQuaternary: "transparent",
	controlItemBgHover: "var(--dsw-alias-interactive-bg-hover)",
	controlItemBgActive: "var(--dsw-alias-button-ghost-active-fill)",
};

/** 主色是颜色推导种子，必须给具体色值；取值对齐宿主 --dsw-alias-state-business-primary。 */
export const hostPrimary = { light: "#4176e6", dark: "#7aaaff" } as const;

/**
 * 分段控件的轨道与选中块必须落在相邻两级上，否则选中态会消失。
 *
 * 注意暗色下 bg-module-platform 与 bg-layer-3 同为 #353638：若轨道取前者、
 * 选中块取后者，两者同色，用户就看不出当前选中的是哪一个。因此轨道用
 * bg-module-platform（亮色 #f5f6f7 / 暗色 #353638），选中块用
 * button-elevated-fill（亮色 #fff / 暗色 #43454a），两级在两个主题下都拉开差异。
 */
export const hostAliasComponents = {
	Segmented: {
		trackBg: "var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2))",
		itemColor: "var(--dsw-alias-label-secondary)",
		itemHoverBg: "var(--dsw-alias-interactive-bg-hover)",
		itemSelectedBg: "var(--dsw-alias-button-elevated-fill)",
		itemSelectedColor: "var(--dsw-alias-label-primary)",
	},
	Input: {
		activeBorderColor: "var(--dsw-alias-state-business-primary)",
		hoverBorderColor: "var(--dsw-alias-border-l3)",
		activeShadow: "none",
	},
	Select: {
		optionSelectedBg: "var(--dsw-alias-interactive-bg-hover)",
		optionSelectedColor: "var(--dsw-alias-label-primary)",
	},
	Button: {
		defaultBorderColor: "var(--dsw-alias-border-l3)",
		defaultBg: "var(--dsw-alias-bg-layer-3)",
		defaultColor: "var(--dsw-alias-label-primary)",
		defaultHoverBg: "var(--dsw-alias-interactive-bg-hover)",
		defaultHoverBorderColor: "var(--dsw-alias-border-l3)",
		defaultHoverColor: "var(--dsw-alias-label-primary)",
	},
};

/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export function AntdProvider(props: { locale?: Locale; children?: React.ReactNode }): React.ReactElement {
	const dark = useHostDark();
	const lang = typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "zh";
	return React.createElement(ConfigProvider, {
		locale: props.locale ?? antdLocale(lang),
		button: { autoInsertSpace: false },
		theme: {
			algorithm: dark ? darkAlgorithm : defaultAlgorithm,
			token: { ...hostAliasTokens, colorPrimary: dark ? hostPrimary.dark : hostPrimary.light },
			components: hostAliasComponents,
		},
	}, props.children);
}

/** 失败详情和诊断技术信息共用的折叠行。 */
export function Disclosure(props: { title: React.ReactNode; open: boolean; onToggle(): void; className?: string; children?: React.ReactNode }): React.ReactElement {
	return React.createElement(Collapse, {
		className: props.className,
		ghost: true,
		activeKey: props.open ? ["open"] : [],
		onChange: () => props.onToggle(),
		items: [{ key: "open", label: props.title, children: props.children }],
	});
}
