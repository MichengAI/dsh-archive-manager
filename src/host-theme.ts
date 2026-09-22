import React from "react";

/** DSH 夜间主题写在 html 或 body 的 data-ds-dark-theme 上。 */
export function hostIsDark(): boolean {
	if (typeof document === "undefined") return false;
	return document.documentElement.hasAttribute("data-ds-dark-theme")
		|| document.body?.hasAttribute("data-ds-dark-theme") === true;
}

export function useHostDark(): boolean {
	const [dark, setDark] = React.useState(hostIsDark);
	React.useEffect(() => {
		const update = (): void => setDark(hostIsDark());
		update();
		const observer = new MutationObserver(update);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
		if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
		return () => observer.disconnect();
	}, []);
	return dark;
}
