"use client";

import { useEffect } from "react";
import Kbd from "@/components/Kbd/Kbd";
import IconButton from "@/components/IconButton/IconButton";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import NotificationsDropdown from "@/components/NotificationsDropdown/NotificationsDropdown";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { DASHBOARD_TABS, useDashboardTab } from "@/context/DashboardTabContext";
import { getSearchShortcutLabel, isSearchShortcut } from "@/lib/keyboardShortcut";
import styles from "./DashboardHeader.module.css";

function SidebarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5l1.4 3.4 3.6.3-2.7 2.3.8 3.5L8 10.4 4.9 12l.8-3.5-2.7-2.3 3.6-.3L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={spinning ? styles.spin : undefined}
    >
      <path
        d="M3 8a5 5 0 1 0 1.5-3.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M3 4.5V8h3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 3v10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardHeader() {
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    isRefreshing,
    refreshAll,
    openSearch,
  } = useDashboardLayout();
  const { activeTab } = useDashboardTab();
  const { selectedProject, selectedClient } = useDashboardNav();

  const highlightedTab =
    activeTab === "lucro"
      ? "lucro"
      : selectedClient
        ? "clientes"
        : selectedProject
          ? "projetos"
          : activeTab;

  const activeTabLabel =
    DASHBOARD_TABS.find((tab) => tab.id === highlightedTab)?.label || "Central";

  useEffect(() => {
    function handleKeyDown(event) {
      if (isSearchShortcut(event)) {
        event.preventDefault();
        openSearch();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.iconGroup}>
          <IconButton
            label={leftSidebarOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
            size="sm"
            variant="ghost"
            onClick={toggleLeftSidebar}
            aria-pressed={leftSidebarOpen}
          >
            <SidebarIcon />
          </IconButton>
          <IconButton label="Favoritar" size="sm" variant="ghost">
            <StarIcon />
          </IconButton>
        </div>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.crumbMuted}>Dashboards</span>
          <span className={styles.crumbSep}>/</span>
          {selectedClient ? (
            <>
              <span className={styles.crumbMuted}>{activeTabLabel}</span>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbActive}>{selectedClient.name}</span>
            </>
          ) : selectedProject ? (
            <>
              <span className={styles.crumbMuted}>{activeTabLabel}</span>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbActive}>{selectedProject.name}</span>
            </>
          ) : (
            <span className={styles.crumbActive}>{activeTabLabel}</span>
          )}
        </nav>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.searchTrigger}
          onClick={openSearch}
          aria-label="Pesquisar (atalho Ctrl+K ou Cmd+K)"
          data-tour="header-search"
        >
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <span className={styles.searchPlaceholder}>Pesquisar</span>
          <Kbd>{getSearchShortcutLabel()}</Kbd>
        </button>

        <span data-tour="theme-toggle">
          <ThemeToggle />
        </span>

        <IconButton
          label="Atualizar dados"
          size="md"
          variant="ghost"
          onClick={refreshAll}
          disabled={isRefreshing}
        >
          <HistoryIcon spinning={isRefreshing} />
        </IconButton>

        <NotificationsDropdown />

        <IconButton
          label={rightSidebarOpen ? "Ocultar painel direito" : "Mostrar painel direito"}
          size="md"
          variant="ghost"
          onClick={toggleRightSidebar}
          aria-pressed={rightSidebarOpen}
        >
          <PanelIcon />
        </IconButton>
      </div>
    </header>
  );
}
