"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import Tab from "@/components/Tab/Tab";
import NewClientModal from "@/components/NewClientModal/NewClientModal";
import NewProjectModal from "@/components/NewProjectModal/NewProjectModal";
import { DASHBOARD_TABS, useDashboardTab } from "@/context/DashboardTabContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./DashboardTabs.module.css";

function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="4" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function getHighlightedTab(activeTab, selectedClient, selectedProject) {
  if (activeTab === "lucro") return "lucro";
  if (selectedClient) return "clientes";
  if (selectedProject) return "projetos";
  return activeTab;
}

export default function DashboardTabs() {
  const {
    selectProject,
    clearProject,
    clearClient,
    clearLucroFilter,
    selectedClient,
    selectedProject,
  } = useDashboardNav();
  const { activeTab, setActiveTab, refreshDashboard } = useDashboardTab();
  const { restart: restartOnboarding } = useOnboarding();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const menuRef = useRef(null);

  const highlightedTab = getHighlightedTab(activeTab, selectedClient, selectedProject);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleTabClick(tabId) {
    if (tabId === "central") {
      clearProject();
      clearClient();
      clearLucroFilter();
    } else if (tabId === "clientes") {
      clearProject();
      clearLucroFilter();
    } else if (tabId === "projetos") {
      clearClient();
      clearLucroFilter();
    } else if (tabId === "lucro") {
      clearProject();
      clearClient();
    }

    setActiveTab(tabId);
  }

  return (
    <>
        <div className={styles.wrap}>
        <div className={styles.tabs} role="tablist" data-tour="dashboard-tabs">
          {DASHBOARD_TABS.map((tab) => (
            <Tab
              key={tab.id}
              label={tab.label}
              active={highlightedTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              data-tour={tab.id === "projetos" ? "tab-projetos" : undefined}
            />
          ))}
        </div>
        <div className={styles.actions} data-tour="new-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon />}
            onClick={() => setClientModalOpen(true)}
          >
            Novo Cliente
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setProjectModalOpen(true)}>
            Novo Projeto
          </Button>
          <div className={styles.menuWrap} ref={menuRef}>
            <Button
              variant="secondary"
              size="sm"
              icon={<DotsIcon />}
              aria-label="Mais opções"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            />
            {menuOpen && (
              <div className={styles.menu} role="menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    restartOnboarding();
                    setMenuOpen(false);
                  }}
                >
                  Refazer tour guiado
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    refreshDashboard();
                    setMenuOpen(false);
                  }}
                >
                  Atualizar dados
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleTabClick("central");
                    setMenuOpen(false);
                  }}
                >
                  Ir para Central
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleTabClick("clientes");
                    setMenuOpen(false);
                  }}
                >
                  Clientes
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleTabClick("lucro");
                    setMenuOpen(false);
                  }}
                >
                  Lucro e financeiro
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={() => {
          refreshDashboard();
          handleTabClick("clientes");
        }}
      />

      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreated={(project) => {
          selectProject(project);
        }}
      />
    </>
  );
}
