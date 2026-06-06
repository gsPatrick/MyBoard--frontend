"use client";

import { resolveMediaUrl } from "@/lib/mediaUrl";
import styles from "./BordieRich.module.css";

/* ---------- ícones por tipo de entidade ---------- */

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
  // **negrito**
  const parts = String(line).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ---------- card de entidade ---------- */

export function BordieEntityCard({ entity, onOpen }) {
  if (!entity) return null;
  const color = entity.color || "#3b82f6";
  const ownAvatar = entity.type === "client" ? resolveMediaUrl(entity.avatar) : null;
  const clientAvatar = entity.type === "project" ? resolveMediaUrl(entity.client_avatar) : null;

  return (
    <div className={styles.entityCard}>
      <span
        className={styles.entityIcon}
        style={{ background: `${color}1f`, color }}
        aria-hidden="true"
      >
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
            {clientAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clientAvatar} alt="" className={styles.subAvatar} />
            )}
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
            onClick={() => onOpen(entity)}
            title={`Abrir ${entity.title}`}
          >
            Abrir <ArrowGlyph />
          </button>
        )}
      </div>
    </div>
  );
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

export function BordieActionConfirm({ pending, onConfirm, onCancel, onOpen }) {
  const { action, state = "pending", resultMessage, resultEntity } = pending || {};
  if (!action) return null;
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
        <BordieEntityCard entity={action.preview_entity} onOpen={null} />
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
          {resultEntity && <BordieEntityCard entity={resultEntity} onOpen={onOpen} />}
        </div>
      )}

      {state === "error" && resultMessage && (
        <p className={styles.confirmErrorMsg}>{resultMessage}</p>
      )}
    </div>
  );
}
