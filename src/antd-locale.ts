import type { Locale } from "antd/es/locale/index.js";
import enUSModule from "antd/es/locale/en_US.js";
import zhCNModule from "antd/es/locale/zh_CN.js";

const enUS: Locale = enUSModule.default;
const zhCN: Locale = zhCNModule.default;

export function antdLocale(active: "zh" | "en"): Locale {
	return active === "en" ? enUS : zhCN;
}

export function antdLocaleFromDocument(): Locale {
	if (typeof document === "undefined") return zhCN;
	return antdLocale(document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "zh");
}
