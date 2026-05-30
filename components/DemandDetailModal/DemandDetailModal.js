"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteProjectDemand,
  updateProjectDemand,
} from "@/api/projectDemands";
import { deleteMedia, fetchMediaBlobUrl, listMedia, uploadMedia } from "@/api/media";
import { DEMAND_KANBAN_COLUMNS } from "@/lib/demandKanban";
import { DEMAND_STATUS_LABELS } from "@/lib/projectDetailConfig";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import styles from "./DemandDetailModal.module.css";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 8.2 6.4 11 12.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getStatusMenuPosition(triggerEl, itemCount) {
  if (!triggerEl) return { top: 0, left: 0, width: 220 };

  const rect = triggerEl.getBoundingClientRect();
  const menuWidth = Math.max(rect.width, 220);
  const menuHeight = itemCount * 36 + 8;
  const gap = 6;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8;
  }
  if (left < 8) left = 8;
  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - menuHeight - gap;
  }

  return { top, left, width: menuWidth };
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

export default function DemandDetailModal({
  demand,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
  onOpenProject,
}) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusMenuStyle, setStatusMenuStyle] = useState({ top: 0, left: 0, width: 220 });

  const statusWrapRef = useRef(null);
  const statusTriggerRef = useRef(null);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!demand) return;
    setTitle(demand.title || "");
    setDescription(demand.description || "");
    setNotes(demand.notes || "");
    setStatus(demand.status || "pending");
  }, [demand]);

  const loadAttachments = useCallback(async (demandId) => {
    if (!demandId) {
      setAttachments([]);
      return;
    }

    try {
      const files = await listMedia("project_demand", demandId, { kind: "attachment" });
      setAttachments(Array.isArray(files) ? files : []);
    } catch {
      setAttachments([]);
    }
  }, []);

  useEffect(() => {
    if (!demand?.id) return;
    loadAttachments(demand.id);
  }, [demand?.id, loadAttachments]);

  useEffect(() => {
    if (!isOpen) return;
    setStatusOpen(false);

    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!statusOpen) return;
    setStatusMenuStyle(
      getStatusMenuPosition(statusTriggerRef.current, DEMAND_KANBAN_COLUMNS.length)
    );
  }, [statusOpen]);

  useEffect(() => {
    if (!statusOpen) return;

    function handleClickOutside(event) {
      if (
        statusWrapRef.current?.contains(event.target) ||
        statusMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      setStatusOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") setStatusOpen(false);
    }

    function handleReposition() {
      setStatusMenuStyle(
        getStatusMenuPosition(statusTriggerRef.current, DEMAND_KANBAN_COLUMNS.length)
      );
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [statusOpen]);

  if (!mounted || !isOpen || !demand) return null;

  const project = demand.project;
  const isDone = status === "done";
  const activeStatusColumn =
    DEMAND_KANBAN_COLUMNS.find((column) => column.id === status) || DEMAND_KANBAN_COLUMNS[0];

  const statusMenu =
    statusOpen &&
    createPortal(
      <div
        ref={statusMenuRef}
        className={styles.statusMenu}
        role="listbox"
        aria-label="Alterar status da demanda"
        style={{
          top: statusMenuStyle.top,
          left: statusMenuStyle.left,
          minWidth: statusMenuStyle.width,
        }}
      >
        {DEMAND_KANBAN_COLUMNS.map((column) => {
          const isActive = column.id === status;

          return (
            <button
              key={column.id}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`${styles.statusMenuItem} ${isActive ? styles.statusMenuItemActive : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setStatusOpen(false);
                handleStatusChange(column.id);
              }}
              disabled={saving}
            >
              <span
                className={styles.statusDot}
                style={{ background: column.accent }}
                aria-hidden="true"
              />
              {DEMAND_STATUS_LABELS[column.id]}
            </button>
          );
        })}
      </div>,
      document.body
    );

  async function persist(payload) {
    setSaving(true);
    try {
      const updated = await updateProjectDemand(demand.project_id, demand.id, payload);
      const merged = {
        ...demand,
        ...updated,
        project: demand.project,
      };
      onUpdated?.(merged);
      return merged;
    } finally {
      setSaving(false);
    }
  }

  async function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === demand.title) return;
    await persist({ title: trimmed });
    showSuccessToast("Título atualizado");
  }

  async function handleDescriptionBlur() {
    const trimmed = description.trim();
    const current = demand.description || "";
    if (trimmed === current) return;
    await persist({ description: trimmed || null });
    showSuccessToast("Descrição atualizada");
  }

  async function handleNotesBlur() {
    const trimmed = notes.trim();
    const current = demand.notes || "";
    if (trimmed === current) return;
    await persist({ notes: trimmed || null });
    showSuccessToast("Notas atualizadas");
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;

    setUploading(true);
    try {
      await uploadMedia({
        file,
        entityType: "project_demand",
        entityId: demand.id,
        kind: "attachment",
      });
      await loadAttachments(demand.id);
      showSuccessToast("Anexo adicionado");
    } catch (err) {
      showErrorToast(err.message || "Não foi possível enviar o arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenAttachment(file) {
    try {
      const blobUrl = await fetchMediaBlobUrl(file.id);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      showErrorToast(err.message || "Não foi possível abrir o arquivo");
    }
  }

  async function handleRemoveAttachment(mediaId) {
    if (uploading) return;
    try {
      await deleteMedia(mediaId);
      await loadAttachments(demand.id);
      showSuccessToast("Anexo removido");
    } catch (err) {
      showErrorToast(err.message || "Não foi possível remover o anexo");
    }
  }

  async function handleStatusChange(nextStatus) {
    if (nextStatus === status || saving) return;
    const previous = status;
    setStatus(nextStatus);
    try {
      await persist({ status: nextStatus });
      showSuccessToast("Status atualizado");
    } catch {
      setStatus(previous);
    }
  }

  async function handleToggleDone() {
    await handleStatusChange(isDone ? "pending" : "done");
  }

  async function handleDelete() {
    if (saving) return;
    setSaving(true);
    try {
      await deleteProjectDemand(demand.project_id, demand.id);
      onDeleted?.(demand.id);
      onClose?.();
      showSuccessToast("Demanda excluída");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demand-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.closeRow}>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.titleRow}>
              <button
                type="button"
                className={`${styles.checkBtn} ${isDone ? styles.checkBtnDone : ""}`}
                onClick={handleToggleDone}
                aria-label={isDone ? "Reabrir demanda" : "Marcar como concluída"}
                disabled={saving}
              >
                {isDone && <CheckIcon />}
              </button>
              <textarea
                id="demand-detail-title"
                className={`${styles.titleInput} ${isDone ? styles.titleDone : ""}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={handleTitleBlur}
                rows={2}
                placeholder="Título da demanda"
                disabled={saving}
              />
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Descrição</p>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Adicione uma descrição mais detalhada..."
                disabled={saving}
              />
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Notas</p>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Anotações rápidas, links, lembretes..."
                disabled={saving}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionLabel}>Anexos</p>
                <label className={styles.uploadBtn}>
                  <input
                    type="file"
                    className={styles.uploadInput}
                    onChange={handleUpload}
                    disabled={uploading || saving}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip"
                  />
                  {uploading ? "Enviando..." : "Adicionar arquivo"}
                </label>
              </div>
              {attachments.length === 0 ? (
                <p className={styles.attachmentsEmpty}>Nenhum anexo ainda.</p>
              ) : (
                <ul className={styles.attachmentsList}>
                  {attachments.map((file) => (
                    <li key={file.id} className={styles.attachmentItem}>
                      <button
                        type="button"
                        className={styles.attachmentLink}
                        onClick={() => handleOpenAttachment(file)}
                      >
                        <span className={styles.attachmentName}>{file.original_name}</span>
                        {file.size_bytes ? (
                          <span className={styles.attachmentSize}>
                            {formatFileSize(file.size_bytes)}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className={styles.attachmentRemove}
                        onClick={() => handleRemoveAttachment(file.id)}
                        disabled={uploading}
                        aria-label={`Remover ${file.original_name}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Status</p>
              <div className={styles.statusSelectWrap} ref={statusWrapRef}>
                <button
                  ref={statusTriggerRef}
                  type="button"
                  className={styles.statusTrigger}
                  onClick={(event) => {
                    event.stopPropagation();
                    setStatusOpen((current) => !current);
                  }}
                  disabled={saving}
                  aria-haspopup="listbox"
                  aria-expanded={statusOpen}
                  aria-label={`Status: ${DEMAND_STATUS_LABELS[status]}. Clique para alterar`}
                >
                  <span
                    className={styles.statusDot}
                    style={{ background: activeStatusColumn.accent }}
                    aria-hidden="true"
                  />
                  <span className={styles.statusTriggerLabel}>
                    {DEMAND_STATUS_LABELS[status]}
                  </span>
                  <ChevronIcon />
                </button>
              </div>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div>
              <p className={styles.sidebarTitle}>Ações</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleToggleDone}
                  disabled={saving}
                >
                  {isDone ? "Reabrir demanda" : "Marcar concluída"}
                </button>
                {project && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onOpenProject?.(project)}
                  >
                    Abrir projeto
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Excluir demanda
                </button>
              </div>
            </div>

            {project && (
              <div>
                <p className={styles.sidebarTitle}>Projeto</p>
                <button
                  type="button"
                  className={styles.projectChip}
                  onClick={() => onOpenProject?.(project)}
                >
                  <span
                    className={styles.projectDot}
                    style={{ background: project.color || "#3b82f6" }}
                    aria-hidden="true"
                  />
                  {project.name}
                </button>
                {project.client?.name && (
                  <p className={styles.meta} style={{ marginTop: 8 }}>
                    Cliente: {project.client.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className={styles.sidebarTitle}>Detalhes</p>
              <p className={styles.meta}>Criada em {formatDate(demand.created_at)}</p>
              {demand.completed_at && (
                <p className={styles.meta}>Concluída em {formatDate(demand.completed_at)}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>,
    document.body
      )}
      {statusMenu}
    </>
  );
}
