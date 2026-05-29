"use client";

import { useCallback, useEffect, useState } from "react";
import ProjectsTable from "@/components/ProjectsTable/ProjectsTable";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./ProjetosView.module.css";

export default function ProjetosView() {
  const { selectProject } = useDashboardNav();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function handleProjectClick(project) {
    selectProject(project);
  }

  function handleProjectUpdated(updated) {
    setProjects((current) =>
      current.map((project) => (project.id === updated.id ? { ...project, ...updated } : project))
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Todos os projetos</h2>
        <span className={styles.count}>
          {loading ? "—" : `${projects.length} projeto(s)`}
        </span>
      </div>

      {loading && <p className={styles.empty}>Carregando...</p>}

      {!loading && (
        <ProjectsTable
          projects={projects}
          onProjectClick={handleProjectClick}
          onProjectUpdated={handleProjectUpdated}
          emptyMessage="Nenhum projeto cadastrado"
        />
      )}
    </section>
  );
}
