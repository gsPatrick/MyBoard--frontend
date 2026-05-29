"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { addRecentProject } from "@/lib/recentProjects";
import { useDashboardTab } from "./DashboardTabContext";

const DashboardNavContext = createContext(null);

export function DashboardNavProvider({ children }) {
  const { setActiveTab } = useDashboardTab();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [lucroFilter, setLucroFilter] = useState({ clientId: null, projectId: null });

  const clearClient = useCallback(() => {
    setSelectedClientId(null);
    setSelectedClient(null);
  }, []);

  const clearProject = useCallback(() => {
    setSelectedProjectId(null);
    setSelectedProject(null);
  }, []);

  const selectProject = useCallback(
    (project) => {
      if (!project) return;
      clearClient();
      setSelectedProjectId(project.id);
      setSelectedProject(project);
      addRecentProject(project);
      setActiveTab("projetos");
    },
    [clearClient, setActiveTab]
  );

  const selectClient = useCallback(
    (client) => {
      if (!client) return;
      clearProject();
      setSelectedClientId(client.id);
      setSelectedClient(client);
      setActiveTab("clientes");
    },
    [clearProject, setActiveTab]
  );

  const openLucroForClient = useCallback(
    (client) => {
      if (!client?.id) return;
      clearProject();
      setSelectedClient(null);
      setSelectedClientId(client.id);
      setLucroFilter({ clientId: client.id, projectId: null });
      setActiveTab("lucro");
    },
    [clearProject, setActiveTab]
  );

  const openLucroForProject = useCallback(
    (project) => {
      if (!project?.id) return;
      clearClient();
      setSelectedProject(null);
      setLucroFilter({
        clientId: project.client_id || project.client?.id || null,
        projectId: project.id,
      });
      setActiveTab("lucro");
    },
    [clearClient, setActiveTab]
  );

  const clearLucroFilter = useCallback(() => {
    setLucroFilter({ clientId: null, projectId: null });
  }, []);

  const value = useMemo(
    () => ({
      selectedProjectId,
      selectedProject,
      selectProject,
      clearProject,
      setSelectedProjectId,
      selectedClientId,
      selectedClient,
      selectClient,
      clearClient,
      setSelectedClientId,
      lucroFilter,
      setLucroFilter,
      openLucroForClient,
      openLucroForProject,
      clearLucroFilter,
    }),
    [
      selectedProjectId,
      selectedProject,
      selectProject,
      clearProject,
      selectedClientId,
      selectedClient,
      selectClient,
      clearClient,
      lucroFilter,
      openLucroForClient,
      openLucroForProject,
      clearLucroFilter,
    ]
  );

  return (
    <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  const ctx = useContext(DashboardNavContext);
  if (!ctx) {
    throw new Error("useDashboardNav must be used within DashboardNavProvider");
  }
  return ctx;
}
