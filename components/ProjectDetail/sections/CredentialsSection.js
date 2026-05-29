"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Modal from "@/components/Modal/Modal";
import {
  createProjectDetail,
  deleteProjectDetail,
  getProjectDetail,
  updateProjectDetail,
} from "@/api/projectDetails";
import { CREDENTIAL_KINDS, parseCredentialDetail } from "@/lib/projectDetailConfig";
import sectionStyles from "../ProjectDetailSection.module.css";

function slugKey(label) {
  return `cred_${label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}_${Date.now()}`;
}

function parseSecretPayload(detail, revealed) {
  if (!revealed) return null;
  try {
    const raw = detail.value_text || detail.value;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export default function CredentialsSection({ projectId, credentials, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [revealedIds, setRevealedIds] = useState({});
  const [revealedData, setRevealedData] = useState({});
  const [form, setForm] = useState({
    label: "",
    kind: "vps",
    host: "",
    username: "",
    password: "",
    port: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({
      label: "",
      kind: "vps",
      host: "",
      username: "",
      password: "",
      port: "",
      notes: "",
    });
    setModalOpen(true);
  }

  async function openEdit(detail) {
    let data = revealedData[detail.id];
    if (!data) {
      const full = await getProjectDetail(projectId, detail.id, { revealSecrets: true });
      data = parseSecretPayload(full, true) || parseCredentialDetail(full);
      setRevealedData((prev) => ({ ...prev, [detail.id]: data }));
      setRevealedIds((prev) => ({ ...prev, [detail.id]: true }));
    }

    setEditing(detail);
    setForm({
      label: detail.label,
      kind: data?.kind || "other",
      host: data?.host || "",
      username: data?.username || "",
      password: data?.password || "",
      port: data?.port || "",
      notes: data?.notes || "",
    });
    setModalOpen(true);
  }

  async function reveal(detailId) {
    const full = await getProjectDetail(projectId, detailId, { revealSecrets: true });
    const data = parseSecretPayload(full, true);
    setRevealedIds((prev) => ({ ...prev, [detailId]: true }));
    setRevealedData((prev) => ({ ...prev, [detailId]: data }));
  }

  async function handleSave() {
    if (!form.label.trim()) return;

    setSaving(true);
    const payload = {
      category: "credentials",
      key: editing?.key || slugKey(form.label),
      label: form.label.trim(),
      value_type: "secret",
      is_secret: true,
      value: JSON.stringify({
        kind: form.kind,
        host: form.host.trim(),
        username: form.username.trim(),
        password: form.password,
        port: form.port.trim(),
        notes: form.notes.trim(),
      }),
      metadata: { kind: form.kind },
    };

    try {
      if (editing?.id) {
        await updateProjectDetail(projectId, editing.id, payload);
      } else {
        await createProjectDetail(projectId, payload);
      }
      setModalOpen(false);
      onChange?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    await deleteProjectDetail(projectId, id);
    onChange?.();
  }

  return (
    <>
      <section className={sectionStyles.card}>
        <div className={sectionStyles.cardHeader}>
          <div>
            <h2 className={sectionStyles.cardTitle}>Credenciais</h2>
            <p className={sectionStyles.cardHint}>
              VPS, FTP, e-mail, painéis — nomeie e guarde acesso com segurança
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            Nova credencial
          </Button>
        </div>

        {credentials.length === 0 ? (
          <p className={sectionStyles.empty}>Nenhuma credencial cadastrada.</p>
        ) : (
          <div className={sectionStyles.list}>
            {credentials.map((detail) => {
              const meta = parseCredentialDetail(detail);
              const kindLabel =
                CREDENTIAL_KINDS.find((k) => k.id === meta.kind)?.label || meta.kind;
              const revealed = revealedData[detail.id];

              return (
                <div key={detail.id} className={sectionStyles.item}>
                  <div className={sectionStyles.itemMain}>
                    <p className={sectionStyles.itemTitle}>{meta.label}</p>
                    <p className={sectionStyles.itemMeta}>{kindLabel}</p>
                    {revealed ? (
                      <div className={sectionStyles.credGrid} style={{ marginTop: 8 }}>
                        {revealed.host && (
                          <>
                            <span className={sectionStyles.credLabel}>Host / URL</span>
                            <span className={sectionStyles.credValue}>{revealed.host}</span>
                          </>
                        )}
                        {revealed.username && (
                          <>
                            <span className={sectionStyles.credLabel}>Usuário</span>
                            <span className={sectionStyles.credValue}>{revealed.username}</span>
                          </>
                        )}
                        {revealed.port && (
                          <>
                            <span className={sectionStyles.credLabel}>Porta</span>
                            <span className={sectionStyles.credValue}>{revealed.port}</span>
                          </>
                        )}
                        {revealed.password && (
                          <>
                            <span className={sectionStyles.credLabel}>Senha</span>
                            <span className={sectionStyles.credValue}>{revealed.password}</span>
                          </>
                        )}
                        {revealed.notes && (
                          <>
                            <span className={sectionStyles.credLabel}>Notas</span>
                            <span className={sectionStyles.credValue}>{revealed.notes}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className={sectionStyles.itemMeta} style={{ marginTop: 8 }}>
                        Senha e dados sensíveis ocultos
                      </p>
                    )}
                  </div>
                  <div className={sectionStyles.itemActions}>
                    {!revealedIds[detail.id] && (
                      <Button variant="ghost" size="sm" onClick={() => reveal(detail.id)}>
                        Revelar
                      </Button>
                    )}
                    <button
                      type="button"
                      className={sectionStyles.iconBtn}
                      title="Editar"
                      onClick={() => openEdit(detail)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={sectionStyles.iconBtn}
                      title="Excluir"
                      onClick={() => handleRemove(detail.id)}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar credencial" : "Nova credencial"}
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
              placeholder="Ex.: VPS produção"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div>
            <label className={sectionStyles.fieldLabel} htmlFor="cred-kind">
              Tipo
            </label>
            <select
              id="cred-kind"
              className={sectionStyles.select}
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            >
              {CREDENTIAL_KINDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Host / URL"
            value={form.host}
            onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
          />
          <Input
            label="Usuário / E-mail"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <Input
            label="Porta"
            value={form.port}
            onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
          />
          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div className={sectionStyles.formFull}>
            <label className={sectionStyles.fieldLabel} htmlFor="cred-notes">
              Notas
            </label>
            <textarea
              id="cred-notes"
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
