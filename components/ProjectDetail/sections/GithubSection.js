"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Modal from "@/components/Modal/Modal";
import {
  createProjectDetail,
  deleteProjectDetail,
  updateProjectDetail,
} from "@/services/projectDetails";
import { GITHUB_ROLES, parseGithubDetail } from "@/lib/projectDetailConfig";
import { showSuccessToast } from "@/lib/toast";
import sectionStyles from "../ProjectDetailSection.module.css";

function repoKey(role, label) {
  return `github_${role}_${label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 24)}_${Date.now()}`;
}

function roleBadgeClass(role) {
  if (role === "backend") return sectionStyles.badgeBackend;
  if (role === "frontend") return sectionStyles.badgeFrontend;
  return "";
}

export default function GithubSection({ projectId, repos, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    label: "",
    role: "backend",
    url: "",
    branch: "main",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const byRole = GITHUB_ROLES.map((role) => ({
    ...role,
    items: repos.filter((detail) => {
      const parsed = parseGithubDetail(detail);
      return parsed.role === role.id;
    }),
  }));

  function openCreate(role = "backend") {
    setEditing(null);
    setForm({
      label: "",
      role,
      url: "",
      branch: "main",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(detail) {
    const parsed = parseGithubDetail(detail);
    setEditing(detail);
    setForm({
      label: parsed.label,
      role: parsed.role,
      url: parsed.url,
      branch: parsed.branch,
      notes: parsed.notes,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.label.trim() || !form.url.trim()) return;

    setSaving(true);
    const payload = {
      category: "github",
      key: editing?.key || repoKey(form.role, form.label),
      label: form.label.trim(),
      value_type: "json",
      value: {
        role: form.role,
        url: form.url.trim(),
        branch: form.branch.trim() || "main",
        notes: form.notes.trim(),
      },
      metadata: { role: form.role },
    };

    try {
      if (editing?.id) {
        await updateProjectDetail(projectId, editing.id, payload);
      } else {
        await createProjectDetail(projectId, payload);
      }
      setModalOpen(false);
      onChange?.();
      showSuccessToast(editing?.id ? "Repositório atualizado" : "Repositório adicionado");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    await deleteProjectDetail(projectId, id);
    onChange?.();
    showSuccessToast("Repositório removido");
  }

  return (
    <>
      <section className={sectionStyles.card}>
        <div className={sectionStyles.cardHeader}>
          <div>
            <h2 className={sectionStyles.cardTitle}>GitHub</h2>
            <p className={sectionStyles.cardHint}>
              Repositórios por área — backend, frontend e outros
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => openCreate("backend")}>
            Adicionar repositório
          </Button>
        </div>

        {repos.length === 0 ? (
          <p className={sectionStyles.empty}>Nenhum repositório vinculado.</p>
        ) : (
          byRole.map((group) =>
            group.items.length > 0 ? (
              <div key={group.id} style={{ marginBottom: "var(--space-4)" }}>
                <p className={sectionStyles.fieldLabel} style={{ marginBottom: 8 }}>
                  {group.label}
                </p>
                <div className={sectionStyles.list}>
                  {group.items.map((detail) => {
                    const parsed = parseGithubDetail(detail);
                    const roleLabel =
                      GITHUB_ROLES.find((r) => r.id === parsed.role)?.label || parsed.role;
                    return (
                      <div key={detail.id} className={sectionStyles.item}>
                        <div className={sectionStyles.itemMain}>
                          <p className={sectionStyles.itemTitle}>{parsed.label}</p>
                          <span
                            className={`${sectionStyles.badge} ${roleBadgeClass(parsed.role)}`}
                          >
                            {roleLabel}
                          </span>
                          {parsed.url && (
                            <a
                              href={parsed.url}
                              className={sectionStyles.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "block", marginTop: 8 }}
                            >
                              {parsed.url}
                            </a>
                          )}
                          <p className={sectionStyles.itemMeta} style={{ marginTop: 4 }}>
                            Branch: {parsed.branch}
                          </p>
                        </div>
                        <div className={sectionStyles.itemActions}>
                          <button
                            type="button"
                            className={sectionStyles.iconBtn}
                            onClick={() => openEdit(detail)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className={sectionStyles.iconBtn}
                            onClick={() => handleRemove(detail.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar repositório" : "Novo repositório"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <div className={sectionStyles.formGrid}>
          <div className={sectionStyles.formFull}>
            <Input
              label="Nome"
              placeholder="Ex.: API principal"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div>
            <label className={sectionStyles.fieldLabel} htmlFor="gh-role">
              Área
            </label>
            <select
              id="gh-role"
              className={sectionStyles.select}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {GITHUB_ROLES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className={sectionStyles.formFull}>
            <Input
              label="URL do repositório"
              placeholder="https://github.com/org/repo"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <Input
            label="Branch principal"
            value={form.branch}
            onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          />
          <div className={sectionStyles.formFull}>
            <label className={sectionStyles.fieldLabel} htmlFor="gh-notes">
              Notas
            </label>
            <textarea
              id="gh-notes"
              className={sectionStyles.textarea}
              style={{ minHeight: 72 }}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
