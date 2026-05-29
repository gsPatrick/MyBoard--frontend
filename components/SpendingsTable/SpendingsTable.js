"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectsTable from "@/components/ProjectsTable/ProjectsTable";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./SpendingsTable.module.css";

export default function SpendingsTable() {
  const { selectProject } = useDashboardNav();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === "in_progress"),
    [projects]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const data = await listProjects({ limit: 100 });
      setProjects(normalizeListResponse(data));
    } catch {
      setProjects([]);
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

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Projetos em andamento</h2>

      {loading && <p className={styles.empty}>Carregando...</p>}

      {!loading && (
        <ProjectsTable
          projects={inProgressProjects}
          onProjectClick={selectProject}
          emptyMessage="Nenhum projeto em andamento"
        />
      )}
    </section>
  );
}
