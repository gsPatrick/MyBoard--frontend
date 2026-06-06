"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import {
  createProjectDetail,
  deleteProjectDetail,
  updateProjectDetail,
} from "@/api/projectDetails";
import { showSuccessToast } from "@/lib/toast";
import sectionStyles from "../ProjectDetailSection.module.css";
import styles from "./AdditionalDetailsSection.module.css";

const CATEGORY_LABELS = {
  scope: "Escopo",
  deployment: "Deploy",
  environment: "Ambiente / Stack",
  documentation: "Documentação",
  links: "Links",
  notes: "Notas",
  custom: "Outros",
};

const ADD_CATEGORIES = ["custom", "links", "environment", "deployment", "documentation", "notes"];

function slugifyKey(label) {
  return (
    String(label || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || `item_${Math.random().toString(36).slice(2, 8)}`
  );
}

function valueToString(value) {
  if (value == null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default function AdditionalDetailsSection({ projectId, details = [], onChange }) {
  const [savingId, setSavingId] = useState(null);
  const [newCat, setNewCat] = useState("custom");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleUpdate(detail, patch) {
    setSavingId(detail.id);
    try {
      await updateProjectDetail(projectId, detail.id, patch);
      onChange?.();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(detail) {
    if (!window.confirm(`Excluir "${detail.label}"?`)) return;
    await deleteProjectDetail(projectId, detail.id);
    showSuccessToast("Removido");
    onChange?.();
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!newLabel.trim() || !newValue.trim()) return;
    setAdding(true);
    try {
      await createProjectDetail(projectId, {
        category: newCat,
        key: slugifyKey(newLabel),
        label: newLabel.trim(),
        value: newValue.trim(),
        value_type: "text",
      });
      showSuccessToast("Adicionado");
      setNewLabel("");
      setNewValue("");
      onChange?.();
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Outros dados</h2>
          <p className={sectionStyles.cardHint}>
            Stack, links, ambiente, deploy e qualquer informação do projeto que não é credencial
            nem GitHub. A IA também guarda aqui o que extrai.
          </p>
        </div>
      </div>

      {details.length === 0 && (
        <p className={styles.empty}>Nada por aqui ainda — adicione abaixo ou deixe a IA preencher.</p>
      )}

      {details.length > 0 && (
        <div className={styles.list}>
          {details.map((detail) => (
            <div key={detail.id} className={styles.row}>
              <span className={styles.badge}>
                {CATEGORY_LABELS[detail.category] || detail.category}
              </span>
              <input
                className={styles.label}
                defaultValue={detail.label}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== detail.label) handleUpdate(detail, { label: v });
                }}
              />
              <input
                className={styles.value}
                defaultValue={valueToString(detail.value)}
                onBlur={(e) => {
                  if (e.target.value !== valueToString(detail.value)) {
                    handleUpdate(detail, { value: e.target.value });
                  }
                }}
              />
              <button
                type="button"
                className={styles.del}
                onClick={() => handleDelete(detail)}
                disabled={savingId === detail.id}
                aria-label="Excluir"
                title="Excluir"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form className={styles.addRow} onSubmit={handleAdd}>
        <select
          className={styles.addSelect}
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        >
          {ADD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          className={styles.addLabel}
          placeholder="Rótulo (ex.: Stack)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <input
          className={styles.addValue}
          placeholder="Valor"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={adding || !newLabel.trim() || !newValue.trim()}>
          {adding ? "..." : "Adicionar"}
        </Button>
      </form>
    </section>
  );
}
