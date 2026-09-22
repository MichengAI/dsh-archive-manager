/** Controls the settings page can take from the host. Missing exports stay unset. */
export interface HostControls {
	Button?: typeof import("@deepseek-ai/dsh-client-ui-primitives").Button;
	Input?: typeof import("@deepseek-ai/dsh-client-ui-primitives").Input;
	SegmentedControl?: typeof import("@deepseek-ai/dsh-client-ui-primitives").SegmentedControl;
	SegmentedTabs?: typeof import("@deepseek-ai/dsh-client-ui-primitives").SegmentedTabs;
	DisclosureRow?: typeof import("@deepseek-ai/dsh-client-ui-primitives").DisclosureRow;
}

/**
 * Keep a host control only when it is a real component.
 * Older hosts omit SegmentedTabs and SegmentedControl; the page then uses a local copy of those controls. Tests stand in with zero-argument functions.
 */
export function hostControl<T>(value: T): T | undefined {
	if (typeof value === "function" && value.length >= 1) return value;
	if (typeof value === "object" && value !== null && "$$typeof" in value) return value;
	return undefined;
}
