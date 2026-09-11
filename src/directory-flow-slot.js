/**
 * 将官方目录叶组件接入归档侧栏独有的子插槽，不抢占官方声明。
 * 组件、store、locale 和 inject 均来自公开插槽条目；原条目卸载时同步释放副本。
 * 当前支持的宿主目录组件均为叶节点；新增子插槽的组件不能借用其声明权限。
 */
export function mirrorDirectoryFlow(ctx, target) {
  const source = "sidebar.workspaces.directoryFlow";
  return ctx.slots.inject(target, () => ctx.effect(() => {
    const mounted = new Map();
    const reconcile = () => {
      const entries = ctx.slots.entries(source);
      for (const [entry, dispose] of mounted) {
        if (!entries.includes(entry)) {
          dispose();
          mounted.delete(entry);
        }
      }
      for (const entry of entries) {
        if (mounted.has(entry)) continue;
        if (Object.keys(entry.children ?? {}).length > 0) {
          console.warn("archive-manager: directory flow with child slots is unsupported; use the official workspace picker");
          continue;
        }
        mounted.set(entry, ctx.slots.register({
          ...entry.options,
          name: target,
          inject: entry.inject,
          store: entry.store,
          locale: entry.locale
        }, entry.component));
      }
    };
    const unsubscribe = ctx.on("slots/changed", (key) => {
      if (key === source) reconcile();
    });
    try {
      reconcile();
    } catch (error) {
      unsubscribe();
      for (const dispose of mounted.values()) dispose();
      throw error;
    }
    return () => {
      unsubscribe();
      for (const dispose of mounted.values()) dispose();
      mounted.clear();
    };
  }, "dsh-archive-manager: official directory flow"));
}
