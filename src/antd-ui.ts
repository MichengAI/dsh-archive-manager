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

/** 按钮不插汉字空格，亮暗跟随宿主的 data-ds-dark-theme。 */
export function AntdProvider(props: { locale?: Locale; children?: React.ReactNode }): React.ReactElement {
	const dark = useHostDark();
	const lang = typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "zh";
	return React.createElement(ConfigProvider, {
		locale: props.locale ?? antdLocale(lang),
		button: { autoInsertSpace: false },
		theme: { algorithm: dark ? darkAlgorithm : defaultAlgorithm },
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
