import * as React from "react";
import { IconArchiveOutlineMedium, SegmentedControl, Switch as PrimitiveSwitch } from "@deepseek-ai/dsh-client-ui-primitives";
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
.dsham_bundle_error{font-size:12px;line-height:16px;color:var(--dsw-alias-state-error-primary,#ef4444);margin-top:2px}
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
    location: propLocation,
    onLocationChange,
    errorMessage,
    enabled = false,
    onToggle,
    disabled,
    sidebarFavoriteStarEnabled = true,
    onToggleSidebarFavoriteStar,
    sidebarFavoriteStarDisabled,
    sidebarFavoriteStarMode: propStarMode,
    onSidebarFavoriteStarModeChange
  } = props;
  const effectiveLocation = propLocation ?? (enabled ? "both" : "settings");
  const effectiveStarMode = propStarMode ?? (sidebarFavoriteStarEnabled === false ? "none" : "all");
  const handleLocationChange = (next) => {
    if (next === "both" || next === "sidebar" || next === "settings") {
      if (typeof onLocationChange === "function") {
        onLocationChange(next);
      } else if (typeof onToggle === "function") {
        onToggle(next !== "settings");
      }
    }
  };
  const handleStarModeChange = (next) => {
    if (next === "all" || next === "favorites" || next === "none") {
      if (typeof onSidebarFavoriteStarModeChange === "function") {
        onSidebarFavoriteStarModeChange(next);
      } else if (typeof onToggleSidebarFavoriteStar === "function") {
        onToggleSidebarFavoriteStar(next !== "none");
      }
    }
  };
  const rows = [
    h(
      "div",
      { key: "entry-location", className: "dsham_bundle_row" },
      h(
        "div",
        { className: "dsham_bundle_label_box" },
        h("span", { className: "dsham_bundle_title" }, t("entry.location.title")),
        h("span", { className: "dsham_bundle_desc" }, t("entry.location.desc")),
        errorMessage ? h("span", { className: "dsham_bundle_error", role: "alert" }, errorMessage) : null
      ),
      h(SegmentedControl, {
        id: "dsham-bundle-entry-location",
        value: effectiveLocation,
        onChange: handleLocationChange,
        label: t("entry.location.title"),
        disabled,
        options: [
          { value: "both", label: t("entry.location.both") },
          { value: "sidebar", label: t("entry.location.sidebar") },
          { value: "settings", label: t("entry.location.settings") }
        ]
      })
    )
  ];
  if (typeof onSidebarFavoriteStarModeChange === "function" || typeof onToggleSidebarFavoriteStar === "function") {
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
        h(SegmentedControl, {
          id: "dsham-bundle-favorite-star-mode",
          value: effectiveStarMode,
          onChange: handleStarModeChange,
          label: t("sidebar.favoriteStar.title"),
          disabled: sidebarFavoriteStarDisabled ?? disabled,
          options: [
            { value: "all", label: t("sidebar.favoriteStar.all") },
            { value: "favorites", label: t("sidebar.favoriteStar.favorites") },
            { value: "none", label: t("sidebar.favoriteStar.none") }
          ]
        })
      )
    );
  }
  return h(React.Fragment, null, rows);
}
function ArchiveBundleConfigCardWrapper(props) {
  const [location, setLocation] = React.useState(props.getLocation);
  const resolveInitialStarMode = () => {
    if (props.getSidebarFavoriteStarMode) return props.getSidebarFavoriteStarMode();
    if (props.getSidebarFavoriteStarEnabled) return props.getSidebarFavoriteStarEnabled() ? "all" : "none";
    return "all";
  };
  const [sidebarFavoriteStarMode, setSidebarFavoriteStarMode] = React.useState(resolveInitialStarMode);
  const [saveError, setSaveError] = React.useState(null);
  const [savingLocation, setSavingLocation] = React.useState(false);
  const [savingFavoriteStar, setSavingFavoriteStar] = React.useState(false);
  React.useEffect(() => {
    const syncState = () => {
      setLocation(props.getLocation());
      setSaveError(null);
      if (props.getSidebarFavoriteStarMode) {
        setSidebarFavoriteStarMode(props.getSidebarFavoriteStarMode());
      } else if (props.getSidebarFavoriteStarEnabled) {
        setSidebarFavoriteStarMode(props.getSidebarFavoriteStarEnabled() ? "all" : "none");
      }
    };
    syncState();
    return props.subscribe(syncState);
  }, [props]);
  const onLocationChange = (next) => {
    setSavingLocation(true);
    setSaveError(null);
    setLocation(next);
    props.setLocation(next).catch((err) => {
      console.error("archive-manager: setLocation failed:", err);
      setLocation(props.getLocation());
      setSaveError(props.t("entry.location.saveFailed") || "\u4FDD\u5B58\u5165\u53E3\u8BBE\u7F6E\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u91CD\u542F\u5BBF\u4E3B\u8FDB\u7A0B");
    }).finally(() => {
      setSavingLocation(false);
    });
  };
  const onSidebarFavoriteStarModeChange = props.setSidebarFavoriteStarMode || props.setSidebarFavoriteStar ? (next) => {
    setSavingFavoriteStar(true);
    setSidebarFavoriteStarMode(next);
    const savePromise = props.setSidebarFavoriteStarMode ? props.setSidebarFavoriteStarMode(next) : props.setSidebarFavoriteStar(next !== "none");
    savePromise.catch(() => {
      setSidebarFavoriteStarMode(resolveInitialStarMode());
    }).finally(() => {
      setSavingFavoriteStar(false);
    });
  } : void 0;
  return h(ArchiveBundleConfigCard, {
    t: props.t,
    location,
    errorMessage: saveError,
    disabled: savingLocation,
    onLocationChange,
    sidebarFavoriteStarMode,
    sidebarFavoriteStarEnabled: sidebarFavoriteStarMode !== "none",
    sidebarFavoriteStarDisabled: savingFavoriteStar,
    onSidebarFavoriteStarModeChange,
    onToggleSidebarFavoriteStar: onSidebarFavoriteStarModeChange ? (enabled) => onSidebarFavoriteStarModeChange(enabled ? "all" : "none") : void 0
  });
}
function setupSidebarEntry(ctx, options) {
  ensureSidebarEntryStyle();
  if (!ctx.locale) {
    return {
      getLocation: () => "settings",
      setLocation: async () => "settings",
      isSettingsSectionEnabled: () => true,
      isEnabled: () => false,
      isSupported: () => false,
      setEnabled: async () => false,
      isSidebarFavoriteStarEnabled: () => true,
      setSidebarFavoriteStar: async () => false,
      getSidebarFavoriteStarMode: () => "all",
      setSidebarFavoriteStarMode: async () => "all",
      destroy: () => {
      }
    };
  }
  const { callApi, renderPanel, ns } = options;
  let entryLocation = "settings";
  let sidebarSupported = false;
  let mainSupported = false;
  let offPanel = null;
  let offRow = null;
  let epoch = 0;
  let destroyed = false;
  let layoutService;
  const listeners = /* @__PURE__ */ new Set();
  const isSidebarEnabled = () => entryLocation === "both" || entryLocation === "sidebar";
  const isSettingsSectionEnabled = () => entryLocation === "both" || entryLocation === "settings";
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
    if (destroyed || !mainSupported || !isSidebarEnabled() || offPanel) return;
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
    if (destroyed || !sidebarSupported || !isSidebarEnabled() || offRow) return;
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
    if (isSidebarEnabled()) {
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
  const setLocation = async (next) => {
    if (destroyed) return entryLocation;
    const currentEpoch = ++epoch;
    const previous = entryLocation;
    entryLocation = next;
    sync();
    notify();
    if (typeof options.onLocationChange === "function") {
      try {
        options.onLocationChange(next);
      } catch {
      }
    }
    try {
      await callApi("/sidebar-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ location: next })
      });
      return next;
    } catch (err) {
      if (currentEpoch === epoch) {
        entryLocation = previous;
        sync();
        notify();
        if (typeof options.onLocationChange === "function") {
          try {
            options.onLocationChange(previous);
          } catch {
          }
        }
      }
      throw err;
    }
  };
  const setEnabled = async (next) => {
    await setLocation(next ? "both" : "settings");
    return isSidebarEnabled();
  };
  let sidebarFavoriteStarMode = "all";
  let favoriteStarEpoch = 0;
  const setSidebarFavoriteStarMode = async (next) => {
    if (destroyed) return sidebarFavoriteStarMode;
    const currentEpoch = ++favoriteStarEpoch;
    const previous = sidebarFavoriteStarMode;
    sidebarFavoriteStarMode = next;
    notify();
    if (typeof options.onSidebarFavoriteStarModeChange === "function") {
      try {
        options.onSidebarFavoriteStarModeChange(next);
      } catch {
      }
    }
    if (typeof options.onSidebarFavoriteStarChange === "function") {
      try {
        options.onSidebarFavoriteStarChange(next !== "none");
      } catch {
      }
    }
    try {
      await callApi("/sidebar-favorite-star", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: next, enabled: next !== "none" })
      });
      return next;
    } catch (err) {
      if (currentEpoch === favoriteStarEpoch) {
        sidebarFavoriteStarMode = previous;
        notify();
        if (typeof options.onSidebarFavoriteStarModeChange === "function") {
          try {
            options.onSidebarFavoriteStarModeChange(previous);
          } catch {
          }
        }
        if (typeof options.onSidebarFavoriteStarChange === "function") {
          try {
            options.onSidebarFavoriteStarChange(previous !== "none");
          } catch {
          }
        }
      }
      throw err;
    }
  };
  const setSidebarFavoriteStar = async (next) => {
    const res = await setSidebarFavoriteStarMode(next ? "all" : "none");
    return res !== "none";
  };
  const loadEpoch = epoch;
  callApi("/sidebar-entry").then((res) => {
    if (!destroyed && epoch === loadEpoch && res) {
      if (res.location === "both" || res.location === "sidebar" || res.location === "settings") {
        entryLocation = res.location;
      } else if (typeof res.enabled === "boolean") {
        entryLocation = res.enabled ? "both" : "settings";
      }
      sync();
      notify();
      if (typeof options.onLocationChange === "function") {
        try {
          options.onLocationChange(entryLocation);
        } catch {
        }
      }
    }
  }).catch(() => {
  });
  const loadFavoriteStarEpoch = favoriteStarEpoch;
  callApi("/sidebar-favorite-star").then((res) => {
    if (!destroyed && favoriteStarEpoch === loadFavoriteStarEpoch && res) {
      if (res.mode === "all" || res.mode === "favorites" || res.mode === "none") {
        sidebarFavoriteStarMode = res.mode;
      } else if (typeof res.enabled === "boolean") {
        sidebarFavoriteStarMode = res.enabled ? "all" : "none";
      }
      notify();
      if (typeof options.onSidebarFavoriteStarModeChange === "function") {
        try {
          options.onSidebarFavoriteStarModeChange(sidebarFavoriteStarMode);
        } catch {
        }
      }
      if (typeof options.onSidebarFavoriteStarChange === "function") {
        try {
          options.onSidebarFavoriteStarChange(sidebarFavoriteStarMode !== "none");
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
        getLocation: () => entryLocation,
        setLocation,
        getEnabled: () => isSidebarEnabled(),
        setSidebar: setEnabled,
        getSidebarFavoriteStarEnabled: () => sidebarFavoriteStarMode !== "none",
        setSidebarFavoriteStar,
        getSidebarFavoriteStarMode: () => sidebarFavoriteStarMode,
        setSidebarFavoriteStarMode,
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
    getLocation: () => entryLocation,
    setLocation,
    isSettingsSectionEnabled,
    isEnabled: () => isSidebarEnabled(),
    isSupported: () => sidebarSupported,
    setEnabled,
    isSidebarFavoriteStarEnabled: () => sidebarFavoriteStarMode !== "none",
    setSidebarFavoriteStar,
    getSidebarFavoriteStarMode: () => sidebarFavoriteStarMode,
    setSidebarFavoriteStarMode,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      epoch++;
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
  ArchiveBundleConfigCardWrapper,
  ArchiveSidebarIcon,
  BUNDLE_KEY,
  SIDEBAR_ENTRY_STYLE_ID,
  SIDEBAR_PANEL_ID,
  SIDEBAR_PANEL_ORDER,
  ensureSidebarEntryStyle,
  setupSidebarEntry,
  sidebarEntryCss
};
