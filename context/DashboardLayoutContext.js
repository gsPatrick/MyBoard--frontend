"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "myboard_dashboard_layout";

function readStoredLayout() {
  if (typeof window === "undefined") {
    return { leftSidebarOpen: true, rightSidebarOpen: true };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { leftSidebarOpen: true, rightSidebarOpen: true };
    const parsed = JSON.parse(raw);
    return {
      leftSidebarOpen: parsed.leftSidebarOpen !== false,
      rightSidebarOpen: parsed.rightSidebarOpen !== false,
    };
  } catch {
    return { leftSidebarOpen: true, rightSidebarOpen: true };
  }
}

const DashboardLayoutContext = createContext(null);

export function DashboardLayoutProvider({ children }) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLayout();
    setLeftSidebarOpen(stored.leftSidebarOpen);
    setRightSidebarOpen(stored.rightSidebarOpen);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ leftSidebarOpen, rightSidebarOpen })
    );
  }, [leftSidebarOpen, rightSidebarOpen, hydrated]);

  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarOpen((open) => !open);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen((open) => !open);
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

  const value = useMemo(
    () => ({
      leftSidebarOpen,
      rightSidebarOpen,
      toggleLeftSidebar,
      toggleRightSidebar,
      isRefreshing,
      refreshAll,
      searchOpen,
      openSearch,
      closeSearch,
    }),
    [
      leftSidebarOpen,
      rightSidebarOpen,
      toggleLeftSidebar,
      toggleRightSidebar,
      isRefreshing,
      refreshAll,
      searchOpen,
      openSearch,
      closeSearch,
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
