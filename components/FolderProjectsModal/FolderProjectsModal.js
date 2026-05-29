"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button/Button";
import ProjectPicker from "@/components/ProjectPicker/ProjectPicker";
import { listProjects } from "@/api/projects";
import { moveProjectToFolder } from "@/api/folders";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showSuccessToast } from "@/lib/toast";
import styles from "./FolderProjectsModal.module.css";

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

export default function FolderProjectsModal({ isOpen, folder, onClose }) {
  const [projects, setProjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [initialIds, setInitialIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadProjects = useCallback(async () => {
    if (!folder?.id) return;

    setLoading(true);
    setError("");

    try {
      await ensureActiveTenant();
      const data = await listProjects({ limit: 200 });
      const items = normalizeListResponse(data);
      setProjects(items);

      const inFolder = new Set(
        items.filter((project) => project.folder_id === folder.id).map((project) => project.id)
      );
      setSelectedIds(new Set(inFolder));
      setInitialIds(new Set(inFolder));
    } catch (err) {
      setProjects([]);
      setSelectedIds(new Set());
      setInitialIds(new Set());
      setError(err.message || "Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  }, [folder?.id]);

  useEffect(() => {
    if (!isOpen || !folder?.id) return;

    loadProjects();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, folder?.id, loadProjects, onClose, saving]);

  function handleToggle(projectId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(projects.map((project) => project.id)));
  }

  function handleClearAll() {
    setSelectedIds(new Set());
  }

  async function handleSave() {
    if (!folder?.id) return;

    setSaving(true);
    setError("");

    try {
      const toAdd = [...selectedIds].filter((id) => !initialIds.has(id));
      const toRemove = [...initialIds].filter((id) => !selectedIds.has(id));

      await Promise.all([
        ...toAdd.map((projectId) => moveProjectToFolder(projectId, folder.id)),
        ...toRemove.map((projectId) => moveProjectToFolder(projectId, null)),
      ]);

      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
      showSuccessToast("Projetos da pasta atualizados");
      onClose();
    } catch (err) {
      setError(err.message || "Não foi possível atualizar os projetos da pasta");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !folder || !mounted) return null;

  const hasChanges =
    [...selectedIds].some((id) => !initialIds.has(id)) ||
    [...initialIds].some((id) => !selectedIds.has(id));

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Projetos da pasta"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{folder.name}</h2>
            <p className={styles.subtitle}>
              Marque os projetos desta pasta. Desmarque para remover da pasta.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Fechar"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.body}>
          {error && <p className={styles.error}>{error}</p>}
          <ProjectPicker
            projects={projects}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            loading={loading}
            currentFolderId={folder.id}
          />
          <p className={styles.hint}>Projetos de outras pastas serão movidos para cá ao salvar.</p>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
