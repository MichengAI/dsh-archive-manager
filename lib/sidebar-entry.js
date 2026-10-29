import * as React from "react";
import { IconArchiveOutlineMedium, Switch as PrimitiveSwitch } from "@deepseek-ai/dsh-client-ui-primitives";
const h = React.createElement;
const BUNDLE_KEY = "@michengai/dsh-archive-manager";
const SIDEBAR_PANEL_ID = "archived-sessions";
const SIDEBAR_PANEL_ORDER = 4;
const SIDEBAR_ENTRY_STYLE_ID = "dsham-sidebar-entry-style";
const sidebarEntryCss = `
.dsham_mainPanel{box-sizing:border-box;height:100%;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;padding:28px clamp(24px,4vw,48px) 48px}
.dsham_mainPanel>*{width:100%;max-width:960px}
.dsham_bundle_row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:0.5px solid var(--dsw-alias-border-l2)}
.dsham_bundle_label_box{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;text-align:left}
.dsham_bundle_title{font-size:13px;font-weight:500;line-height:20px;color:var(--dsw-alias-label-primary)}
.dsham_bundle_desc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
`;
function ensureSidebarEntryStyle() {
  if (typeof document === "undefined" || typeof document.getElementById !== "function") return;
  if (document.getElementById(SIDEBAR_ENTRY_STYLE_ID) !== null) return;
  if (typeof document.createElement !== "function") return;
  const style = document.createElement("style");
  style.id = SIDEBAR_ENTRY_STYLE_ID;
  style.textContent = sidebarEntryCss;
  (document.head ?? document.documentElement)?.appendChild?.(style);
}
function ArchiveSidebarIcon(props) {
  const size = props && typeof props.size === "number" ? props.size : 16;
  return h(IconArchiveOutlineMedium, { size });
}
function ArchiveBundleConfigCard(props) {
  ensureSidebarEntryStyle();
  const {
    t,
    enabled,
    onToggle,
    disabled,
    onlineUpdateEnabled = true,
    onToggleOnlineUpdate,
    onlineUpdateDisabled,
    onlineUpdateLocked = false,
    sidebarFavoriteStarEnabled = true,
    onToggleSidebarFavoriteStar,
    sidebarFavoriteStarDisabled
  } = props;
  const rows = [
    h(
      "div",
      { key: "sidebar-entry", className: "dsham_bundle_row" },
      h(
        "div",
        { className: "dsham_bundle_label_box" },
        h("span", { className: "dsham_bundle_title" }, t("sidebar.entry.title")),
        h("span", { className: "dsham_bundle_desc" }, t("sidebar.entry.desc"))
      ),
      h(PrimitiveSwitch, {
        checked: enabled,
        onChange: onToggle,
        label: t("sidebar.entry.toggle"),
        disabled
      })
    )
  ];
  if (typeof onToggleOnlineUpdate === "function") {
    const updateDesc = onlineUpdateLocked ? `${t("update.entry.desc")} (${t("update.entry.locked")})` : t("update.entry.desc");
    rows.push(
      h(
        "div",
        { key: "online-update", className: "dsham_bundle_row" },
        h(
          "div",
          { className: "dsham_bundle_label_box" },
          h("span", { className: "dsham_bundle_title" }, t("update.entry.title")),
          h("span", { className: "dsham_bundle_desc" }, updateDesc)
        ),
        h(PrimitiveSwitch, {
          checked: onlineUpdateEnabled,
          onChange: onToggleOnlineUpdate,
          label: t("update.entry.toggle"),
          disabled: onlineUpdateDisabled || onlineUpdateLocked,
          title: onlineUpdateLocked ? t("update.entry.locked") : void 0
        })
      )
    );
  }
  if (typeof onToggleSidebarFavoriteStar === "function") {
    rows.push(
      h(
        "div",
        { key: "sidebar-favorite-star", className: "dsham_bundle_row" },
        h(
          "div",
          { className: "dsham_bundle_label_box" },
          h("span", { className: "dsham_bundle_title" }, t("sidebar.favoriteStar.title")),
          h("span", { className: "dsham_bundle_desc" }, t("sidebar.favoriteStar.desc"))
        ),
        h(PrimitiveSwitch, {
          checked: sidebarFavoriteStarEnabled,
          onChange: onToggleSidebarFavoriteStar,
          label: t("sidebar.favoriteStar.toggle"),
          disabled: sidebarFavoriteStarDisabled
        })
      )
    );
  }
  return h(React.Fragment, null, rows);
}
function ArchiveBundleConfigCardWrapper(props) {
  const [enabled, setEnabled] = React.useState(props.getEnabled);
  const [onlineUpdateEnabled, setOnlineUpdateEnabled] = React.useState(props.getOnlineUpdateEnabled ? props.getOnlineUpdateEnabled : () => true);
  const [onlineUpdateLocked, setOnlineUpdateLocked] = React.useState(props.getOnlineUpdateLocked ? props.getOnlineUpdateLocked : () => false);
  const [sidebarFavoriteStarEnabled, setSidebarFavoriteStarEnabled] = React.useState(props.getSidebarFavoriteStarEnabled ? props.getSidebarFavoriteStarEnabled : () => true);
  const [savingSidebar, setSavingSidebar] = React.useState(false);
  const [savingUpdate, setSavingUpdate] = React.useState(false);
  const [savingFavoriteStar, setSavingFavoriteStar] = React.useState(false);
  React.useEffect(() => {
    const syncState = () => {
      setEnabled(props.getEnabled());
      if (props.getOnlineUpdateEnabled) {
        setOnlineUpdateEnabled(props.getOnlineUpdateEnabled());
      }
      if (props.getOnlineUpdateLocked) {
        setOnlineUpdateLocked(props.getOnlineUpdateLocked());
      }
      if (props.getSidebarFavoriteStarEnabled) {
        setSidebarFavoriteStarEnabled(props.getSidebarFavoriteStarEnabled());
      }
    };
    syncState();
    return props.subscribe(syncState);
  }, [props]);
  const onToggleSidebar = (next) => {
    setSavingSidebar(true);
    setEnabled(next);
    props.setSidebar(next).catch(() => {
      setEnabled(props.getEnabled());
    }).finally(() => {
      setSavingSidebar(false);
    });
  };
  const onToggleOnlineUpdate = props.setOnlineUpdate ? (next) => {
    if (props.getOnlineUpdateLocked?.()) return;
    setSavingUpdate(true);
    setOnlineUpdateEnabled(next);
    props.setOnlineUpdate(next).catch(() => {
      if (props.getOnlineUpdateEnabled) {
        setOnlineUpdateEnabled(props.getOnlineUpdateEnabled());
      }
    }).finally(() => {
      setSavingUpdate(false);
    });
  } : void 0;
  const onToggleSidebarFavoriteStar = props.setSidebarFavoriteStar ? (next) => {
    setSavingFavoriteStar(true);
    setSidebarFavoriteStarEnabled(next);
    props.setSidebarFavoriteStar(next).catch(() => {
      if (props.getSidebarFavoriteStarEnabled) {
        setSidebarFavoriteStarEnabled(props.getSidebarFavoriteStarEnabled());
      }
    }).finally(() => {
      setSavingFavoriteStar(false);
    });
  } : void 0;
  return h(ArchiveBundleConfigCard, {
    t: props.t,
    enabled,
    disabled: savingSidebar,
    onToggle: onToggleSidebar,
    onlineUpdateEnabled,
    onlineUpdateDisabled: savingUpdate || onlineUpdateLocked,
    onlineUpdateLocked,
    onToggleOnlineUpdate,
    sidebarFavoriteStarEnabled,
    sidebarFavoriteStarDisabled: savingFavoriteStar,
    onToggleSidebarFavoriteStar
  });
}
function setupSidebarEntry(ctx, options) {
  ensureSidebarEntryStyle();
  if (!ctx.locale) {
    return {
      isEnabled: () => false,
      isSupported: () => false,
      setEnabled: async () => false,
      isOnlineUpdateEnabled: () => true,
      isOnlineUpdateLocked: () => false,
      setOnlineUpdate: async () => false,
      isSidebarFavoriteStarEnabled: () => true,
      setSidebarFavoriteStar: async () => false,
      destroy: () => {
      }
    };
  }
  const { callApi, renderPanel, ns } = options;
  let sidebarEntryEnabled = false;
  let sidebarSupported = false;
  let mainSupported = false;
  let offPanel = null;
  let offRow = null;
  let epoch = 0;
  let destroyed = false;
  let layoutService;
  const listeners = /* @__PURE__ */ new Set();
  const notify = () => {
    if (destroyed) return;
    for (const listener of listeners) {
      try {
        listener();
      } catch {
      }
    }
  };
  const mountMain = () => {
    if (destroyed || !mainSupported || !sidebarEntryEnabled || offPanel) return;
    const res = ctx.slots.register({
      name: "main",
      key: SIDEBAR_PANEL_ID,
      locale: ns,
      inject: () => {
        const extra = typeof options.injectProps === "function" ? options.injectProps() : {};
        return Object.assign({ t: ctx.locale?.bind ? ctx.locale.bind(ns) : void 0 }, extra);
      }
    }, (ownerProps) => h("div", { className: "dsham_mainPanel" }, renderPanel(ownerProps)));
    offPanel = typeof res === "function" ? res : () => {
    };
  };
  const unmountMain = () => {
    if (offPanel) {
      try {
        offPanel();
      } catch {
      }
      offPanel = null;
    }
  };
  const mountRow = () => {
    if (destroyed || !sidebarSupported || !sidebarEntryEnabled || offRow) return;
    const res = ctx.slots.register({
      name: "sidebar.panellist",
      id: SIDEBAR_PANEL_ID,
      order: SIDEBAR_PANEL_ORDER,
      label: () => ctx.locale.bind(ns)("archives.title"),
      locale: ns
    }, (ownerProps) => ArchiveSidebarIcon(ownerProps && typeof ownerProps === "object" && "size" in ownerProps ? ownerProps : void 0));
    offRow = typeof res === "function" ? res : () => {
    };
  };
  const unmountRow = () => {
    if (offRow) {
      try {
        offRow();
      } catch {
      }
      offRow = null;
    }
  };
  const sync = () => {
    if (destroyed) return;
    if (sidebarEntryEnabled) {
      mountMain();
      mountRow();
    } else {
      if (layoutService?.panelInfo && typeof layoutService.selectPanel === "function") {
        try {
          if (layoutService.panelInfo.getSnapshot().activePanelId === SIDEBAR_PANEL_ID) {
            layoutService.selectPanel(null);
          }
        } catch {
        }
      }
      unmountRow();
      unmountMain();
    }
  };
  const setEnabled = async (next) => {
    if (destroyed) return sidebarEntryEnabled;
    const currentEpoch = ++epoch;
    sidebarEntryEnabled = next;
    sync();
    notify();
    try {
      await callApi("/sidebar-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      return next;
    } catch (err) {
      if (currentEpoch === epoch) {
        sidebarEntryEnabled = !next;
        sync();
        notify();
      }
      throw err;
    }
  };
  let onlineUpdateEnabled = true;
  let onlineUpdateLocked = false;
  let updateEpoch = 0;
  const setOnlineUpdate = async (next) => {
    if (destroyed || onlineUpdateLocked) return onlineUpdateEnabled;
    const currentEpoch = ++updateEpoch;
    onlineUpdateEnabled = next;
    notify();
    if (typeof options.onOnlineUpdateChange === "function") {
      try {
        options.onOnlineUpdateChange(next);
      } catch {
      }
    }
    try {
      await callApi("/online-update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      if (currentEpoch === updateEpoch && typeof options.onOnlineUpdateChange === "function") {
        try {
          options.onOnlineUpdateChange(next);
        } catch {
        }
      }
      return next;
    } catch (err) {
      if (currentEpoch === updateEpoch) {
        onlineUpdateEnabled = !next;
        notify();
        if (typeof options.onOnlineUpdateChange === "function") {
          try {
            options.onOnlineUpdateChange(!next);
          } catch {
          }
        }
      }
      throw err;
    }
  };
  let sidebarFavoriteStarEnabled = true;
  let favoriteStarEpoch = 0;
  const setSidebarFavoriteStar = async (next) => {
    if (destroyed) return sidebarFavoriteStarEnabled;
    const currentEpoch = ++favoriteStarEpoch;
    sidebarFavoriteStarEnabled = next;
    notify();
    if (typeof options.onSidebarFavoriteStarChange === "function") {
      try {
        options.onSidebarFavoriteStarChange(next);
      } catch {
      }
    }
    try {
      await callApi("/sidebar-favorite-star", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      return next;
    } catch (err) {
      if (currentEpoch === favoriteStarEpoch) {
        sidebarFavoriteStarEnabled = !next;
        notify();
        if (typeof options.onSidebarFavoriteStarChange === "function") {
          try {
            options.onSidebarFavoriteStarChange(!next);
          } catch {
          }
        }
      }
      throw err;
    }
  };
  const loadEpoch = epoch;
  callApi("/sidebar-entry").then((res) => {
    if (!destroyed && epoch === loadEpoch && res && typeof res.enabled === "boolean") {
      sidebarEntryEnabled = res.enabled;
      sync();
      notify();
    }
  }).catch(() => {
  });
  const loadUpdateEpoch = updateEpoch;
  callApi("/online-update").then((res) => {
    if (!destroyed && updateEpoch === loadUpdateEpoch && res && typeof res.enabled === "boolean") {
      onlineUpdateEnabled = res.enabled;
      if (res.locked === true) onlineUpdateLocked = true;
      notify();
      if (typeof options.onOnlineUpdateChange === "function") {
        try {
          options.onOnlineUpdateChange(onlineUpdateEnabled);
        } catch {
        }
      }
    }
  }).catch(() => {
  });
  const loadFavoriteStarEpoch = favoriteStarEpoch;
  callApi("/sidebar-favorite-star").then((res) => {
    if (!destroyed && favoriteStarEpoch === loadFavoriteStarEpoch && res && typeof res.enabled === "boolean") {
      sidebarFavoriteStarEnabled = res.enabled;
      notify();
      if (typeof options.onSidebarFavoriteStarChange === "function") {
        try {
          options.onSidebarFavoriteStarChange(sidebarFavoriteStarEnabled);
        } catch {
        }
      }
    }
  }).catch(() => {
  });
  const hostCtx = ctx;
  if (typeof hostCtx.inject === "function") {
    hostCtx.inject(["layout"], (scoped) => {
      if (!destroyed && scoped.layout) layoutService = scoped.layout;
    });
  }
  ctx.slots.inject("main", () => {
    if (destroyed) return;
    mainSupported = true;
    mountMain();
    return () => {
      mainSupported = false;
      unmountMain();
    };
  });
  ctx.slots.inject("sidebar.panellist", () => {
    if (destroyed) return;
    sidebarSupported = true;
    mountRow();
    return () => {
      sidebarSupported = false;
      unmountRow();
    };
  });
  ctx.slots.inject("plugins.bundle.config", () => {
    if (destroyed) return;
    return ctx.slots.register({
      name: "plugins.bundle.config",
      key: BUNDLE_KEY,
      locale: ns
    }, (ownerProps) => {
      if (ownerProps && ownerProps.view === "summary") return null;
      return h(ArchiveBundleConfigCardWrapper, {
        t: ctx.locale.bind(ns),
        getEnabled: () => sidebarEntryEnabled,
        setSidebar: setEnabled,
        getOnlineUpdateEnabled: () => onlineUpdateEnabled,
        setOnlineUpdate,
        getOnlineUpdateLocked: () => onlineUpdateLocked,
        getSidebarFavoriteStarEnabled: () => sidebarFavoriteStarEnabled,
        setSidebarFavoriteStar,
        subscribe: (fn) => {
          listeners.add(fn);
          return () => {
            listeners.delete(fn);
          };
        }
      });
    });
  });
  return {
    isEnabled: () => sidebarEntryEnabled,
    isSupported: () => sidebarSupported,
    setEnabled,
    isOnlineUpdateEnabled: () => onlineUpdateEnabled,
    isOnlineUpdateLocked: () => onlineUpdateLocked,
    setOnlineUpdate,
    isSidebarFavoriteStarEnabled: () => sidebarFavoriteStarEnabled,
    setSidebarFavoriteStar,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      epoch++;
      updateEpoch++;
      favoriteStarEpoch++;
      layoutService = void 0;
      listeners.clear();
      unmountRow();
      unmountMain();
    }
  };
}
export {
  ArchiveBundleConfigCard,
  ArchiveSidebarIcon,
  BUNDLE_KEY,
  SIDEBAR_ENTRY_STYLE_ID,
  SIDEBAR_PANEL_ID,
  SIDEBAR_PANEL_ORDER,
  ensureSidebarEntryStyle,
  setupSidebarEntry,
  sidebarEntryCss
};
