import type { StoredEntry } from "@deepseek-ai/dsh-client-ui-slots";

/** 目录镜像只依赖公开条目，不要求各版本声明相同的业务插槽名。 */
export interface DirectoryMirrorContext {
  slots: {
    inject(target: string, effect: () => () => void): () => void;
    entries(source: string): readonly StoredEntry[];
    register(options: StoredEntry["options"] & { name: string; registrant: string | undefined; inject: StoredEntry["inject"]; store: StoredEntry["store"]; locale: StoredEntry["locale"] }, component: StoredEntry["component"]): () => void;
  };
  effect(effect: () => () => void, label: string): () => void;
  on(event: "slots/changed", listener: (key: string) => void): () => void;
}
/**
 * 将官方目录叶组件接入归档侧栏独有的子插槽，不抢占官方声明。
 * 组件、store、locale 和 inject 均来自公开插槽条目；原条目卸载时同步释放副本。
 * 当前支持的宿主目录组件均为叶节点；新增子插槽的组件不能借用其声明权限。
 */
export function mirrorDirectoryFlow(ctx: DirectoryMirrorContext, target: string) {
	const source = "sidebar.workspaces.directoryFlow";
	return ctx.slots.inject(target, () => ctx.effect(() => {
		const mounted = new Map<StoredEntry, () => void>();
		let registrant: string | undefined;
		const release = (entry: StoredEntry, dispose: () => void) => {
			mounted.delete(entry);
			try {
				dispose();
			} catch (error) {
				console.error(`archive-manager: 清理目录镜像失败 ${source} -> ${target}（${entry.registrant ?? "未知来源"}）`, error);
			}
		};
		const clearMounted = () => {
			for (const [entry, dispose] of mounted) release(entry, dispose);
		};
		const reconcile = () => {
			registrant = undefined;
			const entries = ctx.slots.entries(source);
			for (const [entry, dispose] of mounted) {
				if (!entries.includes(entry)) {
					release(entry, dispose);
				}
			}
			for (const entry of entries) {
				if (mounted.has(entry)) continue;
				if (Object.keys(entry.children ?? {}).length > 0) {
					console.warn("archive-manager: 不支持带子插槽的目录组件，请使用官方首页入口");
					continue;
				}
				registrant = entry.registrant;
				mounted.set(entry, ctx.slots.register({
					...entry.options,
					name: target,
					registrant: entry.registrant,
					inject: entry.inject,
					store: entry.store,
					locale: entry.locale
				}, entry.component));
			}
		};
		const unsubscribe = ctx.on("slots/changed", (key) => {
			if (key !== source) return;
			// slots/changed 同步发生在其他插件的注册调用内，镜像失败不能向调用方传播。
			try {
				reconcile();
			} catch (error) {
				clearMounted();
				console.error(`archive-manager: 同步目录镜像失败 ${source} -> ${target}（${registrant ?? "未知来源"}）；请使用官方首页入口，后续源插槽变化时重试`, error);
			}
		});
		try {
			reconcile();
		} catch (error) {
			unsubscribe();
			clearMounted();
			throw error;
		}
		return () => {
			unsubscribe();
			clearMounted();
		};
	}, "dsh-archive-manager: official directory flow"));
}
