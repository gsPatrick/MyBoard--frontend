"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectsTable from "@/components/ProjectsTable/ProjectsTable";
import { listFinancialEntries } from "@/api/finance";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { buildReceivedByProjectId } from "@/lib/financialStats";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./SpendingsTable.module.css";

export default function SpendingsTable() {
  const { selectProject } = useDashboardNav();
  const [projects, setProjects] = useState([]);
  const [financialEntries, setFinancialEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const receivedByProjectId = useMemo(
    () => buildReceivedByProjectId(financialEntries),
    [financialEntries]
  );

  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === "in_progress"),
    [projects]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const [projectsData, entriesData] = await Promise.all([
        listProjects({ limit: 100 }),
        listFinancialEntries(),
      ]);
      setProjects(normalizeListResponse(projectsData));
      setFinancialEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch {
      setProjects([]);
      setFinancialEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("myboard:workspace-refresh", load);
    window.addEventListener("myboard:tenant-changed", load);
    return () => {
      window.removeEventListener("myboard:workspace-refresh", load);
      window.removeEventListener("myboard:tenant-changed", load);
    };
  }, [load]);

  function handleProjectUpdated(updated) {
    setProjects((current) =>
      current.map((project) => (project.id === updated.id ? { ...project, ...updated } : project))
    );
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Projetos em andamento</h2>

      {loading && <p className={styles.empty}>Carregando...</p>}

      {!loading && (
        <ProjectsTable
          projects={inProgressProjects}
          receivedByProjectId={receivedByProjectId}
          onProjectClick={selectProject}
          onProjectUpdated={handleProjectUpdated}
          emptyMessage="Nenhum projeto em andamento"
        />
      )}
    </section>
  );
}
