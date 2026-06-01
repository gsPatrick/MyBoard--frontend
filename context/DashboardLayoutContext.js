"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getActiveTenantId } from "@/api/client";
import { buildTenantScopedKey } from "@/lib/tenantStorage";
import {
  SIDEBAR_COLLAPSE_STYLE,
  SIDEBAR_MODE,
  isSidebarExpanded,
  isSidebarVisible,
  normalizeCollapseStyle,
  normalizeSidebarMode,
} from "@/lib/sidebarLayout";
import {
  CONTENT_WIDTH,
  DEFAULT_RIGHT_PANEL_SECTIONS,
  normalizeContentWidth,
  normalizeRightPanelSections,
} from "@/lib/interfacePreferences";

const STORAGE_KEY = "myboard_dashboard_layout";

function getLayoutStorageKey() {
  return buildTenantScopedKey(STORAGE_KEY, getActiveTenantId());
}

function readStoredLayout() {
  const defaults = {
    leftSidebarMode: SIDEBAR_MODE.OPEN,
    rightSidebarMode: SIDEBAR_MODE.OPEN,
    leftCollapseStyle: SIDEBAR_COLLAPSE_STYLE.HIDDEN,
    rightCollapseStyle: SIDEBAR_COLLAPSE_STYLE.HIDDEN,
    contentWidth: CONTENT_WIDTH.CONSTRAINED,
    rightPanelSections: { ...DEFAULT_RIGHT_PANEL_SECTIONS },
  };

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(getLayoutStorageKey());
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);

    if ("leftSidebarMode" in parsed || "rightSidebarMode" in parsed) {
      return {
        leftSidebarMode: normalizeSidebarMode(parsed.leftSidebarMode),
        rightSidebarMode: normalizeSidebarMode(parsed.rightSidebarMode),
        leftCollapseStyle: normalizeCollapseStyle(parsed.leftCollapseStyle),
        rightCollapseStyle: normalizeCollapseStyle(parsed.rightCollapseStyle),
        contentWidth: normalizeContentWidth(parsed.contentWidth),
        rightPanelSections: normalizeRightPanelSections(parsed.rightPanelSections),
      };
    }

    return {
      leftSidebarMode:
        parsed.leftSidebarOpen === false ? SIDEBAR_MODE.HIDDEN : SIDEBAR_MODE.OPEN,
      rightSidebarMode:
        parsed.rightSidebarOpen === false ? SIDEBAR_MODE.HIDDEN : SIDEBAR_MODE.OPEN,
      leftCollapseStyle: SIDEBAR_COLLAPSE_STYLE.HIDDEN,
      rightCollapseStyle: SIDEBAR_COLLAPSE_STYLE.HIDDEN,
      contentWidth: CONTENT_WIDTH.CONSTRAINED,
      rightPanelSections: { ...DEFAULT_RIGHT_PANEL_SECTIONS },
    };
  } catch {
    return defaults;
  }
}

const DashboardLayoutContext = createContext(null);

export function DashboardLayoutProvider({ children }) {
  const [leftSidebarMode, setLeftSidebarMode] = useState(SIDEBAR_MODE.OPEN);
  const [rightSidebarMode, setRightSidebarMode] = useState(SIDEBAR_MODE.OPEN);
  const [leftCollapseStyle, setLeftCollapseStyleState] = useState(SIDEBAR_COLLAPSE_STYLE.HIDDEN);
  const [rightCollapseStyle, setRightCollapseStyleState] = useState(SIDEBAR_COLLAPSE_STYLE.HIDDEN);
  const [contentWidth, setContentWidthState] = useState(CONTENT_WIDTH.CONSTRAINED);
  const [rightPanelSections, setRightPanelSectionsState] = useState({
    ...DEFAULT_RIGHT_PANEL_SECTIONS,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLayout();
    setLeftSidebarMode(stored.leftSidebarMode);
    setRightSidebarMode(stored.rightSidebarMode);
    setLeftCollapseStyleState(stored.leftCollapseStyle);
    setRightCollapseStyleState(stored.rightCollapseStyle);
    setContentWidthState(stored.contentWidth);
    setRightPanelSectionsState(stored.rightPanelSections);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      getLayoutStorageKey(),
      JSON.stringify({
        leftSidebarMode,
        rightSidebarMode,
        leftCollapseStyle,
        rightCollapseStyle,
        contentWidth,
        rightPanelSections,
      })
    );
  }, [
    leftSidebarMode,
    rightSidebarMode,
    leftCollapseStyle,
    rightCollapseStyle,
    contentWidth,
    rightPanelSections,
    hydrated,
  ]);

  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarMode((current) => {
      if (current === SIDEBAR_MODE.OPEN) {
        return leftCollapseStyle;
      }
      return SIDEBAR_MODE.OPEN;
    });
  }, [leftCollapseStyle]);

  const toggleRightSidebar = useCallback(() => {
    setRightSidebarMode((current) => {
      if (current === SIDEBAR_MODE.OPEN) {
        return rightCollapseStyle;
      }
      return SIDEBAR_MODE.OPEN;
    });
  }, [rightCollapseStyle]);

  const setSidebarsOpen = useCallback(({ left, right } = {}) => {
    if (left !== undefined) {
      setLeftSidebarMode(left ? SIDEBAR_MODE.OPEN : leftCollapseStyle);
    }
    if (right !== undefined) {
      setRightSidebarMode(right ? SIDEBAR_MODE.OPEN : rightCollapseStyle);
    }
  }, [leftCollapseStyle, rightCollapseStyle]);

  const setLeftCollapseStyle = useCallback((style) => {
    const normalized = normalizeCollapseStyle(style);
    setLeftCollapseStyleState(normalized);
    setLeftSidebarMode((current) => {
      if (current === SIDEBAR_MODE.COMPACT || current === SIDEBAR_MODE.HIDDEN) {
        return normalized;
      }
      return current;
    });
  }, []);

  const setRightCollapseStyle = useCallback((style) => {
    const normalized = normalizeCollapseStyle(style);
    setRightCollapseStyleState(normalized);
    setRightSidebarMode((current) => {
      if (current === SIDEBAR_MODE.COMPACT || current === SIDEBAR_MODE.HIDDEN) {
        return normalized;
      }
      return current;
    });
  }, []);

  const setBothCollapseStyles = useCallback((style) => {
    const normalized = normalizeCollapseStyle(style);
    setLeftCollapseStyleState(normalized);
    setRightCollapseStyleState(normalized);
    setLeftSidebarMode((current) =>
      current === SIDEBAR_MODE.COMPACT || current === SIDEBAR_MODE.HIDDEN ? normalized : current
    );
    setRightSidebarMode((current) =>
      current === SIDEBAR_MODE.COMPACT || current === SIDEBAR_MODE.HIDDEN ? normalized : current
    );
  }, []);

  const setContentWidth = useCallback((width) => {
    setContentWidthState(normalizeContentWidth(width));
  }, []);

  const setRightPanelSection = useCallback((sectionId, enabled) => {
    setRightPanelSectionsState((current) => ({
      ...current,
      [sectionId]: enabled,
    }));
  }, []);

  const setAllRightPanelSections = useCallback((enabled) => {
    setRightPanelSectionsState({
      notifications: enabled,
      activities: enabled,
      clients: enabled,
    });
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    window.setTimeout(() => setIsRefreshing(false), 700);
  }, []);

  const leftSidebarOpen = isSidebarVisible(leftSidebarMode);
  const rightSidebarOpen = isSidebarVisible(rightSidebarMode);
  const leftSidebarExpanded = isSidebarExpanded(leftSidebarMode);
  const rightSidebarExpanded = isSidebarExpanded(rightSidebarMode);

  const value = useMemo(
    () => ({
      leftSidebarMode,
      rightSidebarMode,
      leftSidebarOpen,
      rightSidebarOpen,
      leftSidebarExpanded,
      rightSidebarExpanded,
      leftCollapseStyle,
      rightCollapseStyle,
      toggleLeftSidebar,
      toggleRightSidebar,
      setSidebarsOpen,
      setLeftCollapseStyle,
      setRightCollapseStyle,
      setBothCollapseStyles,
      contentWidth,
      setContentWidth,
      rightPanelSections,
      setRightPanelSection,
      setAllRightPanelSections,
      isRefreshing,
      refreshAll,
      searchOpen,
      openSearch,
      closeSearch,
      boardFullscreen,
      setBoardFullscreen,
    }),
    [
      leftSidebarMode,
      rightSidebarMode,
      leftSidebarOpen,
      rightSidebarOpen,
      leftSidebarExpanded,
      rightSidebarExpanded,
      leftCollapseStyle,
      rightCollapseStyle,
      toggleLeftSidebar,
      toggleRightSidebar,
      setSidebarsOpen,
      setLeftCollapseStyle,
      setRightCollapseStyle,
      setBothCollapseStyles,
      contentWidth,
      setContentWidth,
      rightPanelSections,
      setRightPanelSection,
      setAllRightPanelSections,
      isRefreshing,
      refreshAll,
      searchOpen,
      openSearch,
      closeSearch,
      boardFullscreen,
      setBoardFullscreen,
    ]
  );

  return (
    <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const ctx = useContext(DashboardLayoutContext);
  if (!ctx) {
    throw new Error("useDashboardLayout must be used within DashboardLayoutProvider");
  }
  return ctx;
}
