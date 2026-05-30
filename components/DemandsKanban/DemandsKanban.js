"use client";

import { useMemo, useState } from "react";
import {
  buildDemandDragPayload,
  DEMAND_DND_MIME,
  DEMAND_KANBAN_COLUMNS,
  parseDemandDragPayload,
} from "@/lib/demandKanban";
import styles from "./DemandsKanban.module.css";

function DemandCard({ demand, dragging, onDragStart, onDragEnd, onOpenProject }) {
  const project = demand.project;
  const clientName = project?.client?.name || project?.client?.company;

  return (
    <article
      className={`${styles.card} ${dragging ? styles.cardDragging : ""}`}
      draggable
      onDragStart={(event) => onDragStart(event, demand)}
      onDragEnd={onDragEnd}
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

      <h3 className={styles.cardTitle}>{demand.title}</h3>

      {demand.description && <p className={styles.cardDesc}>{demand.description}</p>}

      {clientName && <p className={styles.clientName}>{clientName}</p>}
    </article>
  );
}

export default function DemandsKanban({ demands, onStatusChange, onOpenProject }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

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
              {items.length === 0 ? (
                <p className={styles.emptyColumn}>Arraste demandas para cá</p>
              ) : (
                items.map((demand) => (
                  <DemandCard
                    key={demand.id}
                    demand={demand}
                    dragging={draggingId === demand.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onOpenProject={onOpenProject}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
