"use client";

import { useState } from "react";
import Chip from "@/components/Chip/Chip";
import { updateProject } from "@/api/projects";
import { showSuccessToast } from "@/lib/toast";
import { PROJECT_CHIP_STATUS } from "@/lib/projectLabels";
import { PROJECT_PRIORITIES } from "@/lib/projectDetailConfig";
import { PROJECT_ORIGINS } from "@/lib/projectOrigin";
import { formatCurrencyBRL } from "@/lib/projectStats";
import asideStyles from "./ProjectDetailAside.module.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectDetailAside({ project, onProjectChange }) {
  const [savingPriority, setSavingPriority] = useState(false);
  const statusConfig =
    PROJECT_CHIP_STATUS[project?.status] || PROJECT_CHIP_STATUS.in_progress;

  async function handlePriorityChange(event) {
    const priority = event.target.value;
    if (!project?.id || priority === project.priority) return;

    setSavingPriority(true);
    try {
      const updated = await updateProject(project.id, { priority });
      onProjectChange(updated);
      showSuccessToast("Prioridade atualizada");
    } catch {
      /* mantém anterior */
    } finally {
      setSavingPriority(false);
    }
  }

  return (
    <aside className={asideStyles.aside}>
      <section className={asideStyles.card}>
        <h2 className={asideStyles.title}>Resumo</h2>
        <dl className={asideStyles.dl}>
          <div className={asideStyles.rowStack}>
            <dt>Origem</dt>
            <dd>
              <select
                className={asideStyles.select}
                value={project.origin || "own"}
                onChange={handleOriginChange}
                disabled={savingOrigin}
                aria-label="Origem do projeto"
              >
                {PROJECT_ORIGINS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Tipo</dt>
            <dd>{PROJECT_ORIGIN_LABELS[project.origin] || "Próprio"}</dd>
          </div>
          <div className={asideStyles.rowStack}>
            <dt>Prioridade</dt>
            <dd>
              <select
                className={asideStyles.select}
                value={project.priority || "medium"}
                onChange={handlePriorityChange}
                disabled={savingPriority}
                aria-label="Prioridade do projeto"
              >
                {PROJECT_PRIORITIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Status</dt>
            <dd>
              <Chip status={statusConfig.chip}>{statusConfig.label}</Chip>
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Prazo</dt>
            <dd>{formatDate(project.due_date)}</dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Início</dt>
            <dd>{formatDate(project.start_date)}</dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Orçamento</dt>
            <dd>
              {project.budget != null ? formatCurrencyBRL(project.budget) : "—"}
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Importância</dt>
            <dd>{project.importance_level || "—"}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
