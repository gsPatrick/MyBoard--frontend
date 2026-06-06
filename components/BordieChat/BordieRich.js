"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import ProjectStatusMenu from "@/components/ProjectStatusMenu/ProjectStatusMenu";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatCurrencyBRL } from "@/lib/projectStats";
import { parseAmount } from "@/lib/financialStats";
import styles from "./BordieRich.module.css";

/* ---------- ícones por tipo de entidade ---------- */

function ClientGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 13c0-2.2 2-3.6 4.5-3.6S12.5 10.8 12.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AgendaGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ProjectGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5A1.5 1.5 0 0 1 4 3h2.3l1.2 1.4H12A1.5 1.5 0 0 1 13.5 6v5A1.5 1.5 0 0 1 12 12.5H4A1.5 1.5 0 0 1 2.5 11V4.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8h8M8 4.5 11.5 8 8 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GLYPH({ type }) {
  if (type === "client") return <ClientGlyph />;
  if (type === "agenda") return <AgendaGlyph />;
  return <ProjectGlyph />;
}

/* ---------- formatação de texto leve (negrito + quebras) ---------- */

export function renderRichText(text) {
  const raw = String(text || "");
  if (!raw.trim()) return null;
  return raw.split(/\n{2,}/).map((para, pi) => (
    <p key={pi} className={styles.textPara}>
      {para.split(/\n/).map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {renderInline(line)}
        </span>
      ))}
    </p>
  ));
}

function renderInline(line) {
  const parts = String(line).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ---------- formatadores ---------- */

function formatDue(meta = {}) {
  if (!meta.has_deadline || !meta.due_date) return "Sem prazo";
  const date = new Date(`${String(meta.due_date).slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatValue(meta = {}) {
  const budget = parseAmount(meta.budget);
  return budget > 0 ? formatCurrencyBRL(budget) : "—";
}

/* ---------- card detalhado de projeto (espelha a aba Projetos) ---------- */

function ProjectEntityCard({ entity, onOpen }) {
  const meta = entity.meta || {};
  const clientName = meta.client_name || entity.subtitle || null;
  const clientId = meta.client_id || null;
  const avatarUrl = resolveMediaUrl(entity.client_avatar);

  const openProject = () => onOpen?.({ kind: "project", id: entity.id, name: entity.title });
  const openClient = clientId
    ? () => onOpen?.({ kind: "client", id: clientId, name: clientName })
    : null;

  return (
    <div className={styles.projCard}>
      <div className={styles.projTop}>
        <button
          type="button"
          className={styles.projAvatarBtn}
          onClick={openClient || openProject}
          title={clientName ? `Abrir cliente ${clientName}` : `Abrir ${entity.title}`}
        >
          <Avatar src={avatarUrl} name={clientName || entity.title} size="md" />
        </button>

        <div className={styles.projNames}>
          <button type="button" className={styles.projNameBtn} onClick={openProject} title={`Abrir ${entity.title}`}>
            <span className={styles.projLabel}>Projeto:</span>
            <span className={styles.projName}>{entity.title}</span>
          </button>

          {clientName && (
            <button
              type="button"
              className={styles.projClientBtn}
              onClick={openClient || undefined}
              disabled={!openClient}
              title={openClient ? `Abrir cliente ${clientName}` : undefined}
            >
              <span className={styles.projLabel}>Cliente:</span>
              <span className={styles.projClientName}>{clientName}</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.projInfo}>
        <span className={styles.projInfoItem}>
          <span className={styles.projInfoLabel}>Pasta</span>
          {meta.folder || "Raiz"}
        </span>
        <span className={styles.projInfoItem}>
          <span className={styles.projInfoLabel}>Prazo</span>
          {formatDue(meta)}
        </span>
        <span className={styles.projInfoItem}>
          <span className={styles.projInfoLabel}>Valor</span>
          {formatValue(meta)}
        </span>
      </div>

      <div className={styles.projStatusRow}>
        <ProjectStatusMenu project={{ id: entity.id, status: entity.status }} />
        <button type="button" className={styles.projOpenBtn} onClick={openProject}>
          Abrir projeto <ArrowGlyph />
        </button>
      </div>
    </div>
  );
}

/* ---------- card compacto (cliente / agenda / previews) ---------- */

function CompactEntityCard({ entity, onOpen }) {
  const color = entity.color || "#3b82f6";
  const ownAvatar = entity.type === "client" ? resolveMediaUrl(entity.avatar) : null;

  return (
    <div className={styles.entityCard}>
      <span className={styles.entityIcon} style={{ background: `${color}1f`, color }} aria-hidden="true">
        {ownAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ownAvatar} alt="" className={styles.entityAvatar} />
        ) : (
          <GLYPH type={entity.type} />
        )}
      </span>

      <div className={styles.entityBody}>
        <p className={styles.entityTitle} title={entity.title}>
          {entity.title}
        </p>
        {entity.subtitle && (
          <p className={styles.entitySub} title={entity.subtitle}>
            <span className={styles.subText}>{entity.subtitle}</span>
          </p>
        )}
      </div>

      <div className={styles.entityMeta}>
        {entity.status_label && (
          <span className={styles.entityStatus} style={{ "--dot": color }}>
            {entity.status_label}
          </span>
        )}
        {entity.open && onOpen && (
          <button
            type="button"
            className={styles.entityOpen}
            onClick={() => onOpen(entity.open)}
            title={`Abrir ${entity.title}`}
          >
            Abrir <ArrowGlyph />
          </button>
        )}
      </div>
    </div>
  );
}

export function BordieEntityCard({ entity, onOpen, compact = false }) {
  if (!entity) return null;
  if (entity.type === "project" && !compact) {
    return <ProjectEntityCard entity={entity} onOpen={onOpen} />;
  }
  return <CompactEntityCard entity={entity} onOpen={onOpen} />;
}

export function BordieEntityList({ entities, onOpen }) {
  const list = Array.isArray(entities) ? entities.filter(Boolean) : [];
  if (!list.length) return null;
  const shown = list.slice(0, 8);
  const extra = list.length - shown.length;
  return (
    <div className={styles.entityList}>
      {shown.map((entity) => (
        <BordieEntityCard key={`${entity.type}-${entity.id}`} entity={entity} onOpen={onOpen} />
      ))}
      {extra > 0 && <p className={styles.entityMore}>+{extra} {extra === 1 ? "outro" : "outros"}…</p>}
    </div>
  );
}

/* ---------- card de confirmação de ação ---------- */

const STATE_LABEL = {
  running: "Executando…",
  done: "Feito",
  cancelled: "Cancelado",
  error: "Falhou",
};

/* ---------- seletor visual de cliente (criar projeto sem cliente único) ---------- */

function BordieClientPicker({ action, onPick, onCreate, onCancel }) {
  const [name, setName] = useState(action.suggested_new_name || "");
  const candidates = Array.isArray(action.candidates) ? action.candidates : [];

  return (
    <div className={styles.confirmCard}>
      <div className={styles.confirmHead}>
        <span className={styles.confirmBadge} aria-hidden="true">
          ?
        </span>
        <p className={styles.confirmLabel}>{action.label || "Criar projeto"}</p>
      </div>

      {action.summary && <p className={styles.confirmSummary}>{action.summary}</p>}

      {candidates.length > 0 && (
        <div className={styles.pickerList}>
          {candidates.map((client) => (
            <button
              key={client.id}
              type="button"
              className={styles.pickerClient}
              onClick={() => onPick(client)}
              title={`Vincular a ${client.title}`}
            >
              <Avatar src={resolveMediaUrl(client.avatar)} name={client.title} size="sm" />
              <span className={styles.pickerClientBody}>
                <span className={styles.pickerClientName}>{client.title}</span>
                {client.subtitle && (
                  <span className={styles.pickerClientSub}>{client.subtitle}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.pickerNewRow}>
        <input
          className={styles.pickerInput}
          placeholder="Nome do novo cliente"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim()) onCreate(name.trim());
          }}
        />
        <button
          type="button"
          className={styles.pickerCreate}
          disabled={!name.trim()}
          onClick={() => onCreate(name.trim())}
        >
          Criar e vincular
        </button>
      </div>

      <div className={styles.confirmActions}>
        <button type="button" className={styles.confirmCancel} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function BordieActionConfirm({
  pending,
  onConfirm,
  onCancel,
  onOpen,
  onPickClient,
  onCreateClient,
}) {
  const { action, state = "pending", resultMessage, resultEntity } = pending || {};
  if (!action) return null;

  if (state === "choosing_client") {
    return (
      <BordieClientPicker
        action={action}
        onPick={onPickClient}
        onCreate={onCreateClient}
        onCancel={onCancel}
      />
    );
  }

  const destructive = Boolean(action.destructive) || /_delete$/.test(action.type || "");

  return (
    <div className={`${styles.confirmCard} ${destructive ? styles.confirmDanger : ""}`}>
      <div className={styles.confirmHead}>
        <span className={styles.confirmBadge} aria-hidden="true">
          {destructive ? "!" : "✓"}
        </span>
        <p className={styles.confirmLabel}>{action.label || "Ação do Bordie"}</p>
        {state !== "pending" && (
          <span className={`${styles.confirmState} ${styles[`state_${state}`] || ""}`}>
            {STATE_LABEL[state] || ""}
          </span>
        )}
      </div>

      {action.summary && <p className={styles.confirmSummary}>{action.summary}</p>}

      {action.preview_entity && state === "pending" && (
        <BordieEntityCard entity={action.preview_entity} onOpen={null} compact />
      )}

      {state === "pending" && (
        <div className={styles.confirmActions}>
          <button type="button" className={styles.confirmCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.confirmOk} ${destructive ? styles.confirmOkDanger : ""}`}
            onClick={onConfirm}
          >
            {destructive ? "Excluir" : "Confirmar"}
          </button>
        </div>
      )}

      {state === "done" && (
        <div className={styles.confirmResult}>
          {resultMessage && <p className={styles.confirmResultMsg}>{resultMessage}</p>}
          {resultEntity && <BordieEntityCard entity={resultEntity} onOpen={onOpen} compact />}
        </div>
      )}

      {state === "error" && resultMessage && (
        <p className={styles.confirmErrorMsg}>{resultMessage}</p>
      )}
    </div>
  );
}
