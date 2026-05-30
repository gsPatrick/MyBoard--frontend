"use client";

import { useMemo, useRef, useState } from "react";
import {
  buildDemandDragPayload,
  DEMAND_DND_MIME,
  DEMAND_KANBAN_COLUMNS,
  parseDemandDragPayload,
} from "@/lib/demandKanban";
import styles from "./DemandsKanban.module.css";

function DemandCard({ demand, dragging, onDragStart, onDragEnd, onCardClick, onOpenProject }) {
  const project = demand.project;
  const clientName = project?.client?.name || project?.client?.company;
  const suppressClick = useRef(false);

  function handleClick() {
    if (suppressClick.current) return;
    onCardClick?.(demand);
  }

  function handleDragStart(event) {
    suppressClick.current = false;
    onDragStart(event, demand);
  }

  function handleDragEnd() {
    suppressClick.current = true;
    onDragEnd();
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 80);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.card} ${dragging ? styles.cardDragging : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      {project && (
        <button
          type="button"
          className={styles.projectTag}
          onClick={(event) => {
            event.stopPropagation();
            onOpenProject?.(project);
          }}
          title={`Abrir ${project.name}`}
        >
          <span
            className={styles.projectDot}
            style={{ background: project.color || "#3b82f6" }}
            aria-hidden="true"
          />
          <span className={styles.projectName}>{project.name}</span>
        </button>
      )}

      <span className={styles.cardTitle}>{demand.title}</span>

      {demand.description && <span className={styles.cardDesc}>{demand.description}</span>}

      {clientName && <span className={styles.clientName}>{clientName}</span>}
    </div>
  );
}

function QuickAddForm({ columnId, projects, defaultProjectId, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !projectId) return;

    setSaving(true);
    try {
      await onSubmit?.({ title: title.trim(), projectId, status: columnId });
      setTitle("");
      onCancel?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.quickAddForm} onSubmit={handleSubmit}>
      <textarea
        className={styles.quickAddInput}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Título do cartão..."
        rows={2}
        autoFocus
        disabled={saving}
      />
      {!defaultProjectId && projects.length > 1 && (
        <select
          className={styles.quickAddSelect}
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          disabled={saving}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      )}
      <div className={styles.quickAddActions}>
        <button type="submit" className={styles.quickAddSave} disabled={saving || !title.trim()}>
          {saving ? "Salvando..." : "Adicionar cartão"}
        </button>
        <button type="button" className={styles.quickAddCancel} onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function DemandsKanban({
  demands,
  projects = [],
  projectFilter = "",
  onStatusChange,
  onCardClick,
  onOpenProject,
  onQuickCreate,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [addingColumn, setAddingColumn] = useState(null);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(DEMAND_KANBAN_COLUMNS.map((column) => [column.id, []]));
    demands.forEach((demand) => {
      const key = map[demand.status] ? demand.status : "pending";
      map[key].push(demand);
    });
    return map;
  }, [demands]);

  function handleDragStart(event, demand) {
    const payload = buildDemandDragPayload(demand);
    event.dataTransfer.setData(DEMAND_DND_MIME, payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(demand.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function handleDragOver(event, columnId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }

  function handleDrop(event, columnId) {
    event.preventDefault();
    setDragOverColumn(null);
    setDraggingId(null);

    const payload = parseDemandDragPayload(
      event.dataTransfer.getData(DEMAND_DND_MIME) || event.dataTransfer.getData("text/plain")
    );
    if (!payload?.id || payload.status === columnId) return;

    const demand = demands.find((item) => item.id === payload.id);
    if (!demand) return;

    onStatusChange?.(demand, columnId);
  }

  return (
    <div className={styles.board} role="list" aria-label="Quadro de demandas">
      {DEMAND_KANBAN_COLUMNS.map((column) => {
        const items = grouped[column.id] || [];
        const isDragOver = dragOverColumn === column.id;
        const isAdding = addingColumn === column.id;

        return (
          <section
            key={column.id}
            className={`${styles.column} ${isDragOver ? styles.columnDragOver : ""}`}
            aria-label={column.label}
            onDragOver={(event) => handleDragOver(event, column.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(event) => handleDrop(event, column.id)}
          >
            <header className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span
                  className={styles.columnDot}
                  style={{ background: column.accent }}
                  aria-hidden="true"
                />
                {column.label}
              </div>
              <span className={styles.columnCount}>{items.length}</span>
            </header>

            <div className={styles.columnBody}>
              {items.length === 0 && !isAdding ? (
                <p className={styles.emptyColumn}>Arraste demandas para cá</p>
              ) : (
                items.map((demand) => (
                  <DemandCard
                    key={demand.id}
                    demand={demand}
                    dragging={draggingId === demand.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onCardClick={onCardClick}
                    onOpenProject={onOpenProject}
                  />
                ))
              )}

              {isAdding && (
                <QuickAddForm
                  columnId={column.id}
                  projects={projects}
                  defaultProjectId={projectFilter}
                  onSubmit={onQuickCreate}
                  onCancel={() => setAddingColumn(null)}
                />
              )}
            </div>

            {!isAdding && (
              <button
                type="button"
                className={styles.addCardBtn}
                onClick={() => setAddingColumn(column.id)}
                disabled={projects.length === 0}
              >
                + Adicionar cartão
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
