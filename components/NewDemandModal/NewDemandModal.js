"use client";

import { useEffect, useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import { createProjectDemand } from "@/api/projectDemands";
import { DEMAND_KANBAN_COLUMNS } from "@/lib/demandKanban";
import { showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";

export default function NewDemandModal({
  isOpen,
  onClose,
  projects = [],
  defaultProjectId = "",
  onCreated,
}) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || "");
    }
  }, [isOpen, defaultProjectId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("pending");
    setError("");
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!projectId) {
      setError("Selecione um projeto");
      return;
    }
    if (!trimmedTitle) {
      setError("Título é obrigatório");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const created = await createProjectDemand(projectId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        status,
      });
      const project = projects.find((item) => item.id === projectId);
      onCreated?.({
        ...created,
        project: project
          ? {
              id: project.id,
              name: project.name,
              color: project.color,
              client: project.client,
            }
          : { id: projectId, name: "Projeto" },
      });
      resetForm();
      onClose();
      showSuccessToast("Demanda criada");
    } catch (err) {
      setError(err.message || "Não foi possível criar a demanda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nova demanda"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "Criando..." : "Criar demanda"}
        />
      }
    >
      <div className={formStyles.form}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="demand-project">
            Projeto
          </label>
          <select
            id="demand-project"
            className={formStyles.select}
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={loading || projects.length === 0}
          >
            <option value="">Selecione um projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Título"
          placeholder="Ex.: Implementar login social"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={loading}
        />

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="demand-description">
            Descrição (opcional)
          </label>
          <textarea
            id="demand-description"
            className={formStyles.select}
            style={{ minHeight: 88, resize: "vertical" }}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalhes, critérios de aceite..."
            disabled={loading}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="demand-status">
            Status inicial
          </label>
          <select
            id="demand-status"
            className={formStyles.select}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={loading}
          >
            {DEMAND_KANBAN_COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
