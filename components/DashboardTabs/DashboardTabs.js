"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import Tab from "@/components/Tab/Tab";
import NewClientModal from "@/components/NewClientModal/NewClientModal";
import NewProjectModal from "@/components/NewProjectModal/NewProjectModal";
import NewDemandModal from "@/components/NewDemandModal/NewDemandModal";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
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
  const [demandModalOpen, setDemandModalOpen] = useState(false);
  const [demandProjects, setDemandProjects] = useState([]);
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
    if (tabId === "central" || tabId === "agenda" || tabId === "demandas" || tabId === "board" || tabId === "configuracoes") {
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

  async function openDemandModal() {
    try {
      await ensureActiveTenant();
      const data = await listProjects({ limit: 100 });
      setDemandProjects(normalizeListResponse(data));
    } catch {
      setDemandProjects([]);
    }
    setDemandModalOpen(true);
  }

  useEffect(() => {
    function handleShortcut(event) {
      const action = event.detail?.action;
      if (action === "modal.newClient") {
        setClientModalOpen(true);
      } else if (action === "modal.newProject") {
        setProjectModalOpen(true);
      } else if (action === "modal.newDemand") {
        openDemandModal();
      }
    }

    window.addEventListener("myboard:shortcut", handleShortcut);
    return () => window.removeEventListener("myboard:shortcut", handleShortcut);
  }, []);

  if (activeTab === "configuracoes") {
    return null;
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
              data-tour={
                tab.id === "projetos"
                  ? "tab-projetos"
                  : tab.id === "lucro"
                    ? "tab-lucro"
                    : undefined
              }
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
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon />}
            onClick={() => setProjectModalOpen(true)}
          >
            Novo Projeto
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon />}
            onClick={openDemandModal}
          >
            Nova Demanda
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
                    handleTabClick("configuracoes");
                    setMenuOpen(false);
                  }}
                >
                  Configurações
                </button>
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
                    handleTabClick("agenda");
                    setMenuOpen(false);
                  }}
                >
                  Agenda
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    handleTabClick("demandas");
                    setMenuOpen(false);
                  }}
                >
                  Demandas
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

      <NewDemandModal
        isOpen={demandModalOpen}
        onClose={() => setDemandModalOpen(false)}
        projects={demandProjects}
        onCreated={() => {
          refreshDashboard();
          handleTabClick("demandas");
        }}
      />
    </>
  );
}
