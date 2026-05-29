"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import {
  createProjectDemand,
  deleteProjectDemand,
  updateProjectDemand,
} from "@/api/projectDemands";
import { DEMAND_STATUS_LABELS } from "@/lib/projectDetailConfig";
import sectionStyles from "../ProjectDetailSection.module.css";

export default function DemandsSection({ projectId, demands, onChange }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await createProjectDemand(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      onChange?.();
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(demand) {
    const nextStatus = demand.status === "done" ? "pending" : "done";
    await updateProjectDemand(projectId, demand.id, { status: nextStatus });
    onChange?.();
  }

  async function setStatus(demand, status) {
    await updateProjectDemand(projectId, demand.id, { status });
    onChange?.();
  }

  async function handleRemove(demandId) {
    await deleteProjectDemand(projectId, demandId);
    onChange?.();
  }

  const openCount = demands.filter((d) => d.status !== "done" && d.status !== "cancelled").length;

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Demandas</h2>
          <p className={sectionStyles.cardHint}>
            {openCount} em aberto · crie, acompanhe e finalize tarefas do projeto
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className={sectionStyles.formGrid}>
        <div className={sectionStyles.formFull}>
          <Input
            label="Nova demanda"
            placeholder="Ex.: Implementar login social"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className={sectionStyles.formFull}>
          <label className={sectionStyles.fieldLabel} htmlFor="demand-desc">
            Descrição (opcional)
          </label>
          <textarea
            id="demand-desc"
            className={sectionStyles.textarea}
            style={{ minHeight: 80 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes, critérios de aceite..."
          />
        </div>
        <div className={sectionStyles.formFull}>
          <Button type="submit" variant="primary" size="sm" disabled={saving || !title.trim()}>
            Adicionar demanda
          </Button>
        </div>
      </form>

      {demands.length === 0 ? (
        <p className={sectionStyles.empty}>Nenhuma demanda cadastrada.</p>
      ) : (
        <div className={sectionStyles.list} style={{ marginTop: "var(--space-4)" }}>
          {demands.map((demand) => {
            const isDone = demand.status === "done";
            return (
              <div
                key={demand.id}
                className={`${sectionStyles.item} ${isDone ? sectionStyles.itemDone : ""}`}
              >
                <input
                  type="checkbox"
                  className={sectionStyles.check}
                  checked={isDone}
                  onChange={() => toggleDone(demand)}
                  aria-label={isDone ? "Reabrir demanda" : "Concluir demanda"}
                />
                <div className={sectionStyles.itemMain}>
                  <p
                    className={`${sectionStyles.itemTitle} ${isDone ? sectionStyles.itemTitleDone : ""}`}
                  >
                    {demand.title}
                  </p>
                  <p className={sectionStyles.itemMeta}>
                    {DEMAND_STATUS_LABELS[demand.status] || demand.status}
                  </p>
                  {demand.description && (
                    <p className={sectionStyles.itemDesc}>{demand.description}</p>
                  )}
                </div>
                <div className={sectionStyles.itemActions}>
                  {demand.status === "pending" && (
                    <button
                      type="button"
                      className={sectionStyles.iconBtn}
                      title="Iniciar"
                      onClick={() => setStatus(demand, "in_progress")}
                    >
                      ▶
                    </button>
                  )}
                  <button
                    type="button"
                    className={sectionStyles.iconBtn}
                    title="Excluir"
                    onClick={() => handleRemove(demand.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
