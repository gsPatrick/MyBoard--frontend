"use client";

import { useEffect, useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import ProjectPicker from "@/components/ProjectPicker/ProjectPicker";
import { createFolder, moveProjectToFolder } from "@/services/folders";
import { listProjects } from "@/services/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";

export default function NewFolderModal({ isOpen, onClose, parentId = null, onCreated }) {
  const [name, setName] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadProjects() {
      setLoadingProjects(true);
      try {
        await ensureActiveTenant();
        const data = await listProjects({ limit: 200 });
        setProjects(normalizeListResponse(data));
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, [isOpen]);

  function resetForm() {
    setName("");
    setSelectedIds(new Set());
    setError("");
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  function handleToggle(projectId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nome da pasta é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tenantId = await ensureActiveTenant();
      if (!tenantId) {
        setError("Nenhuma organização ativa. Faça login com uma conta ou cadastre uma empresa.");
        setLoading(false);
        return;
      }

      const folder = await createFolder({
        name: trimmed,
        parent_id: parentId || null,
      });

      const projectIds = [...selectedIds];
      if (projectIds.length > 0) {
        await Promise.all(
          projectIds.map((projectId) => moveProjectToFolder(projectId, folder.id))
        );
      }

      resetForm();
      onCreated?.(folder);
      onClose();
      showSuccessToast("Pasta criada com sucesso");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível criar a pasta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={parentId ? "Nova subpasta" : "Nova pasta"}
      size="lg"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "Criando..." : "Criar pasta"}
        />
      }
    >
      <div className={formStyles.form}>
        <Input
          label="Nome da pasta"
          placeholder="Ex: Clientes, Backend..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) handleSubmit();
          }}
        />

        <div className={formStyles.field}>
          <span className={formStyles.label}>Projetos na pasta (opcional)</span>
          <ProjectPicker
            projects={projects}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onSelectAll={() => setSelectedIds(new Set(projects.map((p) => p.id)))}
            onClearAll={() => setSelectedIds(new Set())}
            loading={loadingProjects}
            emptyMessage="Nenhum projeto cadastrado"
          />
          <p className={formStyles.hint}>
            Selecione os projetos que devem entrar nesta pasta ao criar.
          </p>
        </div>

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
