"use client";

import { useEffect, useState } from "react";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import CurrencyInput from "@/components/CurrencyInput/CurrencyInput";
import AvatarDropzone from "@/components/AvatarDropzone/AvatarDropzone";
import { listClients } from "@/services/clients";
import { createProject, getProject } from "@/services/projects";
import { uploadMedia } from "@/services/media";
import { normalizeListResponse } from "@/lib/apiList";
import { parseCurrencyInput } from "@/lib/currencyInput";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showSuccessToast } from "@/lib/toast";
import { PROJECT_ORIGINS } from "@/lib/projectOrigin";
import { PROJECT_TYPES } from "@/lib/projectLabels";
import formStyles from "../shared/ModalForm.module.css";

export default function NewProjectModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [origin, setOrigin] = useState("own");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [projectType, setProjectType] = useState("common");
  const [recurrenceAmount, setRecurrenceAmount] = useState("");
  const [recurrenceDay, setRecurrenceDay] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
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
    setLogoFile(null);
    setProjectType("common");
    setRecurrenceAmount("");
    setRecurrenceDay("");
    setRecurrenceEndDate("");
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

      const typeConfig =
        PROJECT_TYPES.find((t) => t.id === projectType) || PROJECT_TYPES[0];
      const isRecurring = typeConfig.recurring;

      const payload = {
        name: trimmedName,
        client_id: clientId,
        origin,
        status: typeConfig.status,
      };

      if (dueDate) {
        payload.has_deadline = true;
        payload.due_date = dueDate;
      }

      if (budget.trim()) {
        const value = parseCurrencyInput(budget);
        if (value == null || value < 0) {
          setError("Valor inválido");
          setLoading(false);
          return;
        }
        payload.budget = value;
      }

      if (isRecurring) {
        const amount = parseCurrencyInput(recurrenceAmount);
        const day = Number(recurrenceDay);
        if (amount == null || amount <= 0) {
          setError("Informe o valor recebido a cada mês");
          setLoading(false);
          return;
        }
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          setError("Dia do recebimento deve ser entre 1 e 31");
          setLoading(false);
          return;
        }
        payload.is_recurring = true;
        payload.recurrence_amount = amount;
        payload.recurrence_day = day;
        if (recurrenceEndDate) {
          payload.recurrence_end_date = recurrenceEndDate;
        }
      }

      let project = await createProject(payload);

      if (logoFile && project?.id) {
        await uploadMedia({
          file: logoFile,
          entityType: "project",
          entityId: project.id,
          kind: "cover",
        });
        project = await getProject(project.id);
      }

      resetForm();
      onCreated?.(project);
      onClose();
      showSuccessToast("Projeto criado com sucesso");
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
        <AvatarDropzone
          label="Logo do projeto (opcional)"
          file={logoFile}
          onFileChange={setLogoFile}
          disabled={loading}
          previewName={name}
        />

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
          <label htmlFor="project-origin" className={formStyles.label}>
            Origem do projeto
          </label>
          <select
            id="project-origin"
            className={formStyles.select}
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            disabled={loading}
          >
            {PROJECT_ORIGINS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
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
          <CurrencyInput
            label="Valor (opcional)"
            placeholder="0,00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={formStyles.field}>
          <label htmlFor="project-type" className={formStyles.label}>
            Tipo de projeto
          </label>
          <select
            id="project-type"
            className={formStyles.select}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            disabled={loading}
          >
            {PROJECT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className={formStyles.hint}>
            {projectType === "common"
              ? "Projeto comum, sem recebimento automático."
              : "Todo mês, no dia escolhido, o valor entra automaticamente no financeiro. Você pode alterar o valor depois — vale só para os próximos."}
          </span>
        </div>

        {projectType !== "common" && (
          <>
            <div className={formStyles.row}>
              <CurrencyInput
                label="Valor por mês"
                placeholder="0,00"
                value={recurrenceAmount}
                onChange={(e) => setRecurrenceAmount(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Dia do recebimento"
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 30"
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(e.target.value)}
                disabled={loading}
              />
            </div>

            <Input
              label="Encerrar em (opcional)"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              disabled={loading}
            />
          </>
        )}

        <p className={formStyles.hint}>
          Detalhes, credenciais e arquivos você adiciona depois na página do projeto.
        </p>

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
