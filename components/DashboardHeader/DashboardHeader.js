"use client";

import Kbd from "@/components/Kbd/Kbd";
import IconButton from "@/components/IconButton/IconButton";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import NotificationsDropdown from "@/components/NotificationsDropdown/NotificationsDropdown";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useBordieChat } from "@/context/BordieChatContext";
import { SIDEBAR_MODE } from "@/lib/sidebarLayout";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { DASHBOARD_TABS, useDashboardTab } from "@/context/DashboardTabContext";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import { formatBinding } from "@/lib/keyboardShortcuts";
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M12.7 9.5a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 1 1-1.7 1.7l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V13a1.2 1.2 0 0 1-2.4 0v-.1a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 1 1-1.7-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3a1.2 1.2 0 0 1 0-2.4h.1a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 1 1 1.7-1.7l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V3a1.2 1.2 0 0 1 2.4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 1 1 1.7 1.7l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H13a1.2 1.2 0 0 1 0 2.4h-.1a1 1 0 0 0-.9.6Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
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
    leftSidebarMode,
    rightSidebarMode,
    leftSidebarExpanded,
    rightSidebarExpanded,
    toggleLeftSidebar,
    toggleRightSidebar,
    isRefreshing,
    refreshAll,
    openSearch,
  } = useDashboardLayout();
  const { bordieOpen, toggleBordie } = useBordieChat();
  const { activeTab, setActiveTab } = useDashboardTab();
  const { selectedProject, selectedClient } = useDashboardNav();
  const { bindings } = useKeyboardShortcuts();

  const highlightedTab =
    activeTab === "configuracoes"
      ? "configuracoes"
      : activeTab === "lucro"
        ? "lucro"
        : selectedClient
          ? "clientes"
          : selectedProject
            ? "projetos"
            : activeTab;

  const activeTabLabel =
    activeTab === "configuracoes"
      ? "Configurações"
      : DASHBOARD_TABS.find((tab) => tab.id === highlightedTab)?.label || "Central";

  const searchShortcutLabel = formatBinding(bindings["search.open"]);

  function openSettings() {
    setActiveTab("configuracoes");
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.iconGroup}>
          <IconButton
            label={
              leftSidebarExpanded
                ? "Recolher menu lateral"
                : leftSidebarMode === SIDEBAR_MODE.COMPACT
                  ? "Expandir menu lateral"
                  : "Mostrar menu lateral"
            }
            size="sm"
            variant="ghost"
            onClick={toggleLeftSidebar}
            aria-pressed={leftSidebarExpanded}
          >
            <SidebarIcon />
          </IconButton>
          <IconButton
            label={bordieOpen ? "Fechar Bordie.ia" : "Abrir Bordie.ia"}
            size="sm"
            variant="ghost"
            className={bordieOpen ? styles.bordieActive : ""}
            onClick={toggleBordie}
            aria-pressed={bordieOpen}
            data-tour="header-bordie"
          >
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
          <Kbd>{searchShortcutLabel}</Kbd>
        </button>

        <span data-tour="header-settings">
          <IconButton
            label="Configurações"
            size="md"
            variant="ghost"
            onClick={openSettings}
            aria-pressed={activeTab === "configuracoes"}
          >
            <SettingsIcon />
          </IconButton>
        </span>

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
          label={
            rightSidebarExpanded
              ? "Recolher painel direito"
              : rightSidebarMode === SIDEBAR_MODE.COMPACT
                ? "Expandir painel direito"
                : "Mostrar painel direito"
          }
          size="md"
          variant="ghost"
          onClick={toggleRightSidebar}
          aria-pressed={rightSidebarExpanded}
        >
          <PanelIcon />
        </IconButton>
      </div>
    </header>
  );
}
