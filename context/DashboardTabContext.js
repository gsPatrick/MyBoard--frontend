"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export const DASHBOARD_TABS = [
  { id: "central", label: "Central" },
  { id: "chats", label: "Chats" },
  { id: "agenda", label: "Agenda" },
  { id: "demandas", label: "Demandas" },
  { id: "board", label: "Board" },
  { id: "projetos", label: "Projetos" },
  { id: "clientes", label: "Clientes" },
  { id: "lucro", label: "Lucro" },
];

const DashboardTabContext = createContext(null);

export function DashboardTabProvider({ children }) {
  const [activeTab, setActiveTab] = useState("central");

  const refreshDashboard = useCallback(() => {
    window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      refreshDashboard,
    }),
    [activeTab, refreshDashboard]
  );

  return <DashboardTabContext.Provider value={value}>{children}</DashboardTabContext.Provider>;
}

export function useDashboardTab() {
  const ctx = useContext(DashboardTabContext);
  if (!ctx) {
    throw new Error("useDashboardTab must be used within DashboardTabProvider");
  }
  return ctx;
}
