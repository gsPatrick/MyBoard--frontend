"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IngestionUpload from "@/components/IngestionUpload/IngestionUpload";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { formatRelativeTime } from "@/lib/relativeTime";
import { useDashboardNav } from "@/context/DashboardNavContext";
import LatestProjectsEmpty from "./LatestProjectsEmpty";
import styles from "./LatestFiles.module.css";

const RECENT_LIMIT = 5;

function ProjectBadge({ project }) {
  const label = project.name?.slice(0, 2).toUpperCase() || "PR";
  const color = project.color || "#3b82f6";

  return (
    <span
      className={styles.projectBadge}
      style={{ background: `${color}22`, color }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function buildProjectMeta(project) {
  const parts = [formatRelativeTime(project.created_at)];

  if (project.client?.name) {
    parts.push(project.client.name);
  }

  return parts.join(" / ");
}

export default function LatestFiles() {
  const { selectProject } = useDashboardNav();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, RECENT_LIMIT);
  }, [projects]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const data = await listProjects({ limit: 50 });
      setProjects(normalizeListResponse(data));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    window.addEventListener("myboard:workspace-refresh", loadProjects);
    window.addEventListener("myboard:tenant-changed", loadProjects);

    return () => {
      window.removeEventListener("myboard:workspace-refresh", loadProjects);
      window.removeEventListener("myboard:tenant-changed", loadProjects);
    };
  }, [loadProjects]);

  return (
    <section className={styles.card} data-tour="central-recent">
      <div className={styles.header}>
        <h2 className={styles.title}>Projetos adicionados recentemente</h2>
      </div>

      <div className={`${styles.list} ${!loading && recentProjects.length === 0 ? styles.listEmpty : ""}`}>
        {loading && (
          <div className={styles.loadingWrap}>
            <span className={styles.loadingRow} />
            <span className={styles.loadingRow} />
            <span className={styles.loadingRowShort} />
          </div>
        )}

        {!loading && recentProjects.length === 0 && <LatestProjectsEmpty />}

        {!loading &&
          recentProjects.map((project) => (
            <article key={project.id} className={styles.row}>
              <button
                type="button"
                className={styles.rowButton}
                onClick={() => selectProject(project)}
              >
                <div className={styles.fileInfo}>
                  <ProjectBadge project={project} />
                  <div className={styles.fileText}>
                    <p className={styles.fileName}>{project.name}</p>
                    <p className={styles.fileMeta}>{buildProjectMeta(project)}</p>
                  </div>
                </div>
              </button>
            </article>
          ))}
      </div>

      <div className={styles.uploadZone}>
        <IngestionUpload variant="panel" onApplied={loadProjects} />
      </div>
    </section>
  );
}
