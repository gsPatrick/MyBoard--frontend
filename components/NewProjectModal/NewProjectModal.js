"use client";

import { useEffect, useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import { listClients } from "@/api/clients";
import { createProject } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { PROJECT_ORIGINS } from "@/lib/projectOrigin";
import formStyles from "../shared/ModalForm.module.css";

export default function NewProjectModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [origin, setOrigin] = useState("own");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadClients() {
      setLoadingClients(true);
      try {
        await ensureActiveTenant();
        const data = await listClients({ limit: 100 });
        const items = normalizeListResponse(data);
        setClients(items);
        if (items.length === 1) {
          setClientId(items[0].id);
        }
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    }

    loadClients();
  }, [isOpen]);

  function resetForm() {
    setName("");
    setClientId("");
    setDueDate("");
    setBudget("");
    setOrigin("own");
    setError("");
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome do projeto é obrigatório");
      return;
    }
    if (!clientId) {
      setError("Selecione um cliente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tenantId = await ensureActiveTenant();
      if (!tenantId) {
        setError("Nenhuma organização ativa.");
        setLoading(false);
        return;
      }

      const payload = {
        name: trimmedName,
        client_id: clientId,
        status: "in_progress",
        origin,
      };

      if (dueDate) {
        payload.has_deadline = true;
        payload.due_date = dueDate;
      }

      if (budget.trim()) {
        const value = parseFloat(budget.replace(",", "."));
        if (!Number.isFinite(value) || value < 0) {
          setError("Valor inválido");
          setLoading(false);
          return;
        }
        payload.budget = value;
      }

      const project = await createProject(payload);

      resetForm();
      onCreated?.(project);
      onClose();
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível criar o projeto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo projeto"
      size="md"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "Salvando..." : "Criar projeto"}
        />
      }
    >
      <div className={formStyles.form}>
        <Input
          label="Nome do projeto"
          placeholder="Ex: Site institucional"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
          required
        />

        <div className={formStyles.field}>
          <label htmlFor="project-client" className={formStyles.label}>
            Cliente
          </label>
          <select
            id="project-client"
            className={formStyles.select}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loading || loadingClients}
            required
          >
            <option value="">
              {loadingClients ? "Carregando clientes..." : "Selecione um cliente"}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {!loadingClients && clients.length === 0 && (
            <span className={formStyles.hint}>Cadastre um cliente antes de criar o projeto</span>
          )}
        </div>

        <div className={formStyles.field}>
          <span className={formStyles.label}>Origem do projeto</span>
          <div className={formStyles.originGroup} role="radiogroup" aria-label="Origem do projeto">
            {PROJECT_ORIGINS.map((item) => (
              <label
                key={item.id}
                className={`${formStyles.originOption} ${
                  origin === item.id ? formStyles.originOptionActive : ""
                }`}
              >
                <input
                  type="radio"
                  name="project-origin"
                  value={item.id}
                  checked={origin === item.id}
                  onChange={() => setOrigin(item.id)}
                  disabled={loading}
                />
                {item.label}
              </label>
            ))}
          </div>
          <span className={formStyles.hint}>
            Projetos do 99Freelas ou Workana ganham uma aba com chat, escopo da plataforma e links.
          </span>
        </div>

        <div className={formStyles.row}>
          <Input
            label="Prazo (opcional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Valor (opcional)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={loading}
          />
        </div>

        <p className={formStyles.hint}>
          Detalhes, credenciais e arquivos você adiciona depois na página do projeto.
        </p>

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
