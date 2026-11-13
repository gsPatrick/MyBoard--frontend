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
import styles from "./NewProjectModal.module.css";

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.choiceIcon}>
      <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LaptopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.choiceIcon}>
      <rect x="5" y="5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 19h18M10 9.5 8.5 11 10 12.5M14 9.5l1.5 1.5-1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NewProjectModal({ isOpen, onClose, onCreated }) {
  // "choose" = escolha Trabalho/Freela · "job" = emprego (salário mensal) · "freela" = projeto
  const [mode, setMode] = useState("choose");
  const [jobRole, setJobRole] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobPayDay, setJobPayDay] = useState("");
  const [jobStartDate, setJobStartDate] = useState("");
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [origin, setOrigin] = useState("own");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [alreadyReceived, setAlreadyReceived] = useState("");
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
    setMode("choose");
    setJobRole("");
    setJobSalary("");
    setJobPayDay("");
    setJobStartDate("");
    setName("");
    setClientId("");
    setDueDate("");
    setBudget("");
    setAlreadyReceived("");
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

  function backToChoice() {
    if (loading) return;
    setError("");
    setMode("choose");
  }

  /** Trabalho: projeto recorrente (salário cai todo mês no dia escolhido),
   *  vinculado a um cliente existente (a empresa, com foto e dados próprios). */
  async function handleSubmitJob() {
    const client = clients.find((c) => c.id === clientId);
    const role = jobRole.trim();
    const salary = parseCurrencyInput(jobSalary);
    const day = Number(jobPayDay);

    if (!client) {
      setError("Selecione a empresa");
      return;
    }
    if (salary == null || salary <= 0) {
      setError("Informe o salário");
      return;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError("Dia do pagamento deve ser entre 1 e 31");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tenantId = await ensureActiveTenant();
      if (!tenantId) {
        setError("Nenhuma organização ativa.");
        return;
      }

      const company = client.name.trim();
      const payload = {
        name: role ? `${role} · ${company}` : company,
        client_id: client.id,
        origin: "own",
        status: "job",
        is_recurring: true,
        recurrence_amount: salary,
        recurrence_day: day,
      };
      if (jobStartDate) {
        payload.start_date = jobStartDate;
        payload.recurrence_start_date = jobStartDate;
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
      showSuccessToast("Trabalho cadastrado com sucesso");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível cadastrar o trabalho");
    } finally {
      setLoading(false);
    }
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

      if (!isRecurring && alreadyReceived.trim()) {
        const received = parseCurrencyInput(alreadyReceived);
        if (received == null || received < 0) {
          setError("Valor já recebido inválido");
          setLoading(false);
          return;
        }
        if (payload.budget != null && received > payload.budget) {
          setError("O valor já recebido não pode ser maior que o valor do projeto");
          setLoading(false);
          return;
        }
        if (received > 0) payload.already_received = received;
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
      title={mode === "job" ? "Novo trabalho" : mode === "freela" ? "Novo freela" : "Novo projeto"}
      size="md"
      footer={
        mode === "choose" ? null : (
          <ModalActions
            onCancel={handleClose}
            onConfirm={mode === "job" ? handleSubmitJob : handleSubmit}
            confirmLabel={
              loading ? "Salvando..." : mode === "job" ? "Cadastrar trabalho" : "Criar projeto"
            }
          />
        )
      }
    >
      {mode === "choose" && (
        <div className={styles.choices}>
          <button type="button" className={styles.choice} onClick={() => setMode("job")}>
            <BriefcaseIcon />
            <span className={styles.choiceTitle}>Trabalho</span>
            <span className={styles.choiceText}>
              Emprego fixo. O salário entra todo mês no dia do pagamento.
            </span>
          </button>
          <button type="button" className={styles.choice} onClick={() => setMode("freela")}>
            <LaptopIcon />
            <span className={styles.choiceTitle}>Freela</span>
            <span className={styles.choiceText}>
              Projeto para um cliente, com valor, prazo, demandas e parcelas.
            </span>
          </button>
        </div>
      )}

      {mode === "job" && (
        <div className={formStyles.form}>
          <button type="button" className={styles.back} onClick={backToChoice}>
            ← Trabalho ou freela
          </button>

          <AvatarDropzone
            label="Logo (opcional)"
            file={logoFile}
            onFileChange={setLogoFile}
            disabled={loading}
            previewName={clients.find((c) => c.id === clientId)?.name || jobRole}
          />

          <div className={formStyles.field}>
            <label htmlFor="job-client" className={formStyles.label}>
              Empresa
            </label>
            <select
              id="job-client"
              className={formStyles.select}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loading || loadingClients}
              required
            >
              <option value="">
                {loadingClients ? "Carregando clientes..." : "Selecione a empresa"}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <span className={formStyles.hint}>
              {!loadingClients && clients.length === 0
                ? "Nenhum cliente ainda. Cadastre a empresa em \u201cNovo Cliente\u201d (com foto) e volte aqui."
                : "A empresa é um cliente seu — foto e dados vêm do cadastro dele."}
            </span>
          </div>

          <Input
            label="Cargo (opcional)"
            placeholder="Ex: Desenvolvedor Front-end"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            disabled={loading}
          />

          <div className={formStyles.row}>
            <CurrencyInput
              label="Salário"
              placeholder="0,00"
              value={jobSalary}
              onChange={(e) => setJobSalary(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Dia do pagamento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 5"
              value={jobPayDay}
              onChange={(e) => setJobPayDay(e.target.value)}
              disabled={loading}
            />
          </div>

          <Input
            label="Início (opcional)"
            type="date"
            value={jobStartDate}
            onChange={(e) => setJobStartDate(e.target.value)}
            disabled={loading}
            hint="O salário passa a cair a partir do próximo dia de pagamento."
          />

          {error && <p className={formStyles.error}>{error}</p>}
        </div>
      )}

      {mode === "freela" && (
      <div className={formStyles.form}>
        <button type="button" className={styles.back} onClick={backToChoice}>
          ← Trabalho ou freela
        </button>

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
            {PROJECT_TYPES.filter((item) => item.id !== "job").map((item) => (
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

        {projectType === "common" && (
          <div className={formStyles.field}>
            <CurrencyInput
              label="Já recebido (opcional)"
              placeholder="0,00"
              value={alreadyReceived}
              onChange={(e) => setAlreadyReceived(e.target.value)}
              disabled={loading}
            />
            <span className={formStyles.hint}>
              Quanto você já recebeu antes de cadastrar. Abate do &quot;a receber&quot; e não
              conta no recebido deste mês.
            </span>
          </div>
        )}

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
      )}
    </Modal>
  );
}
