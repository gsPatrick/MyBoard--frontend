"use client";

import Avatar from "@/components/Avatar/Avatar";
import ProjectStatusMenu from "@/components/ProjectStatusMenu/ProjectStatusMenu";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { formatCurrencyBRL } from "@/lib/projectStats";
import styles from "./ProjectsTable.module.css";

function formatDueDate(project) {
  if (!project.has_deadline || !project.due_date) {
    return "Sem prazo";
  }

  const date = new Date(`${String(project.due_date).slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFolderName(project) {
  return project.folder?.name || "Raiz";
}

export default function ProjectsTable({
  projects,
  onProjectClick,
  onProjectUpdated,
  emptyMessage = "Nenhum projeto encontrado",
}) {
  if (!projects.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.table}>
      <div className={styles.col}>
        <div className={styles.th}>Projeto</div>
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={`${styles.cellManager} ${styles.rowButton}`}
            onClick={() => onProjectClick?.(project)}
          >
            <Avatar
              src={getClientAvatarUrl(project.client)}
              name={project.client?.name || project.name}
              size="sm"
            />
            <span className={styles.nameBlock}>
              <span className={styles.projectName}>{project.name}</span>
              <span className={styles.clientName}>
                {project.client?.name || "—"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Pasta</div>
        {projects.map((project) => (
          <div key={project.id} className={styles.cell} title={formatFolderName(project)}>
            {formatFolderName(project)}
          </div>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Prazo</div>
        {projects.map((project) => (
          <div key={project.id} className={styles.cell}>
            {formatDueDate(project)}
          </div>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Valor</div>
        {projects.map((project) => (
          <div key={project.id} className={styles.cell}>
            {project.budget != null && project.budget !== ""
              ? formatCurrencyBRL(parseFloat(project.budget))
              : "—"}
          </div>
        ))}
      </div>

      <div className={`${styles.col} ${styles.statusCol}`}>
        <div className={styles.th}>Status</div>
        {projects.map((project) => (
          <div key={project.id} className={styles.cellStatus}>
            <ProjectStatusMenu project={project} onUpdated={onProjectUpdated} />
          </div>
        ))}
      </div>
    </div>
  );
}
