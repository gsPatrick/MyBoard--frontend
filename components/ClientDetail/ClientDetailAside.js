"use client";

import { useState } from "react";
import Chip from "@/components/Chip/Chip";
import IngestionUpload from "@/components/IngestionUpload/IngestionUpload";
import { updateClient } from "@/services/clients";
import { showSuccessToast } from "@/lib/toast";
import {
  CLIENT_CHIP_STATUS,
  IMPORTANCE_LEVELS,
} from "@/lib/clientLabels";
import asideStyles from "../ProjectDetail/ProjectDetailAside.module.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientDetailAside({ client, onClientChange }) {
  const [saving, setSaving] = useState(false);
  const statusConfig =
    CLIENT_CHIP_STATUS[client?.status] || CLIENT_CHIP_STATUS.active;

  async function patchField(payload) {
    if (!client?.id) return;
    setSaving(true);
    try {
      const updated = await updateClient(client.id, payload);
      onClientChange(updated);
      showSuccessToast("Cliente atualizado");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch {
      /* mantém anterior */
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className={asideStyles.aside}>
      <section className={asideStyles.card}>
        <h2 className={asideStyles.title}>Resumo</h2>
        <dl className={asideStyles.dl}>
          <div className={asideStyles.rowStack}>
            <dt>Status</dt>
            <dd>
              <select
                className={asideStyles.select}
                value={client.status || "active"}
                onChange={(event) => patchField({ status: event.target.value })}
                disabled={saving}
                aria-label="Status do cliente"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </dd>
          </div>
          <div className={asideStyles.rowStack}>
            <dt>Importância</dt>
            <dd>
              <select
                className={asideStyles.select}
                value={client.importance_level || "normal"}
                onChange={(event) =>
                  patchField({ importance_level: event.target.value })
                }
                disabled={saving}
                aria-label="Importância do cliente"
              >
                {IMPORTANCE_LEVELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Situação</dt>
            <dd>
              <Chip status={statusConfig.chip}>{statusConfig.label}</Chip>
            </dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Projetos</dt>
            <dd>{client.projects?.length ?? 0}</dd>
          </div>
          <div className={asideStyles.row}>
            <dt>Cadastro</dt>
            <dd>{formatDate(client.created_at)}</dd>
          </div>
        </dl>
      </section>

      {client.tags?.length > 0 && (
        <section className={asideStyles.card}>
          <h2 className={asideStyles.title}>Tags</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {client.tags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--surface-muted)",
                  color: "var(--text-secondary)",
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {client?.id && (
        <section className={asideStyles.card}>
          <h2 className={asideStyles.title}>Importar com IA</h2>
          <IngestionUpload
            variant="compact"
            target={{ clientId: client.id }}
            label="Enviar arquivo para atualizar este cliente"
          />
        </section>
      )}
    </aside>
  );
}
