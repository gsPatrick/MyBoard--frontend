"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DemandsKanban from "@/components/DemandsKanban/DemandsKanban";
import { listDemands } from "@/api/demands";
import { listProjects } from "@/api/projects";
import { updateProjectDemand } from "@/api/projectDemands";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showSuccessToast } from "@/lib/toast";
import { useDashboardNav } from "@/context/DashboardNavContext";
import styles from "./DemandasView.module.css";

export default function DemandasView() {
  const { selectProject } = useDashboardNav();
  const [demands, setDemands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        await ensureActiveTenant();
        const params = projectFilter ? { project_id: projectFilter } : {};
        const [demandsData, projectsData] = await Promise.all([
          listDemands(params),
          listProjects({ limit: 100 }),
        ]);
        setDemands(normalizeListResponse(demandsData));
        setProjects(normalizeListResponse(projectsData));
      } catch {
        if (!silent) {
          setDemands([]);
          setProjects([]);
        }
      } finally {
        if (!silent) setLoading(false);
        initialLoadDone.current = true;
      }
    },
    [projectFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleRefresh() {
      if (initialLoadDone.current) {
        load({ silent: true });
      }
    }

    window.addEventListener("myboard:workspace-refresh", handleRefresh);
    window.addEventListener("myboard:tenant-changed", handleRefresh);
    return () => {
      window.removeEventListener("myboard:workspace-refresh", handleRefresh);
      window.removeEventListener("myboard:tenant-changed", handleRefresh);
    };
  }, [load]);

  const openCount = useMemo(
    () => demands.filter((d) => d.status !== "done" && d.status !== "cancelled").length,
    [demands]
  );

  async function handleStatusChange(demand, nextStatus) {
    if (!demand?.id || demand.status === nextStatus) return;

    const previousStatus = demand.status;
    setDemands((current) =>
      current.map((item) =>
        item.id === demand.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await updateProjectDemand(demand.project_id, demand.id, { status: nextStatus });
      showSuccessToast("Demanda atualizada");
    } catch {
      setDemands((current) =>
        current.map((item) =>
          item.id === demand.id ? { ...item, status: previousStatus } : item
        )
      );
    }
  }

  function handleOpenProject(project) {
    if (!project?.id) return;
    selectProject(project);
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h2 className={styles.title}>Demandas</h2>
          <p className={styles.subtitle}>
            Arraste os cards entre as colunas para atualizar o status
          </p>
          {!loading && (
            <div className={styles.stats}>
              <span className={styles.stat}>
                <strong>{demands.length}</strong> demanda(s)
              </span>
              <span className={styles.statDot} aria-hidden="true">
                ·
              </span>
              <span className={styles.stat}>
                <strong>{openCount}</strong> em aberto
              </span>
            </div>
          )}
        </div>

        <div className={styles.filters}>
          <label className={styles.filterLabel} htmlFor="demandas-project-filter">
            Projeto
          </label>
          <select
            id="demandas-project-filter"
            className={styles.select}
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className={styles.loading}>Carregando demandas...</p>}

      {!loading && (
        <div className={styles.boardWrap}>
          <DemandsKanban
            demands={demands}
            onStatusChange={handleStatusChange}
            onOpenProject={handleOpenProject}
          />
        </div>
      )}
    </section>
  );
}
