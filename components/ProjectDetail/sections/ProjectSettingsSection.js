"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import CurrencyInput from "@/components/CurrencyInput/CurrencyInput";
import { updateProject } from "@/services/projects";
import { listClients } from "@/services/clients";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import {
  parseCurrencyInput,
  formatCurrencyInputFromNumber,
} from "@/lib/currencyInput";
import { PROJECT_TYPES, getProjectType } from "@/lib/projectLabels";
import { showSuccessToast } from "@/lib/toast";
import sectionStyles from "../ProjectDetailSection.module.css";

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

export default function ProjectSettingsSection({ project, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] = useState("common");
  const [recurrenceAmount, setRecurrenceAmount] = useState("");
  const [recurrenceDay, setRecurrenceDay] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(project.name || "");
    setDescription(project.description || "");
    setClientId(project.client_id || project.client?.id || "");
    setDueDate(project.has_deadline ? toDateInput(project.due_date) : "");
    setBudget(formatCurrencyInputFromNumber(project.budget));
    setProjectType(getProjectType(project));
    setRecurrenceAmount(formatCurrencyInputFromNumber(project.recurrence_amount));
    setRecurrenceDay(project.recurrence_day ? String(project.recurrence_day) : "");
    setRecurrenceEndDate(toDateInput(project.recurrence_end_date));
  }, [project]);

  useEffect(() => {
    let active = true;
    async function loadClients() {
      try {
        await ensureActiveTenant();
        const data = await listClients({ limit: 100 });
        if (active) setClients(normalizeListResponse(data));
      } catch {
        if (active) setClients([]);
      }
    }
    loadClients();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome do projeto é obrigatório");
      return;
    }
    if (!clientId) {
      setError("Selecione um cliente");
      return;
    }

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      client_id: clientId,
    };

    if (dueDate) {
      payload.has_deadline = true;
      payload.due_date = dueDate;
    } else {
      payload.has_deadline = false;
      payload.due_date = null;
    }

    payload.budget = budget.trim() ? parseCurrencyInput(budget) : null;

    const typeConfig =
      PROJECT_TYPES.find((t) => t.id === projectType) || PROJECT_TYPES[0];
    const isRecurring = typeConfig.recurring;

    payload.is_recurring = isRecurring;
    if (isRecurring) {
      const amount = parseCurrencyInput(recurrenceAmount);
      const day = Number(recurrenceDay);
      if (amount == null || amount <= 0) {
        setError("Informe o valor recebido a cada mês");
        return;
      }
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        setError("Dia do recebimento deve ser entre 1 e 31");
        return;
      }
      payload.recurrence_amount = amount;
      payload.recurrence_day = day;
      payload.recurrence_end_date = recurrenceEndDate || null;
      // Envia o status explícito (recurring vs maintenance).
      payload.status = typeConfig.status;
    }
    // Para "comum" não enviamos status: o backend volta para "em andamento"
    // apenas se o projeto era recorrente/manutenção, sem sobrescrever
    // estados como concluído/pausado.

    setSaving(true);
    setError("");
    try {
      const updated = await updateProject(project.id, payload);
      onSaved?.(updated);
      showSuccessToast("Projeto atualizado");
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      setError(err.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Dados do projeto</h2>
          <p className={sectionStyles.cardHint}>
            Nome, cliente, prazo, valor e recorrência do projeto
          </p>
        </div>
      </div>

      <div className={sectionStyles.formGrid}>
        <div className={sectionStyles.formFull}>
          <Input
            label="Nome do projeto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className={sectionStyles.formFull}>
          <label className={sectionStyles.fieldLabel}>Cliente</label>
          <select
            className={sectionStyles.select}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={saving}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Prazo"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={saving}
        />
        <CurrencyInput
          label="Valor"
          placeholder="0,00"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          disabled={saving}
        />

        <div className={sectionStyles.formFull}>
          <label className={sectionStyles.fieldLabel}>Descrição</label>
          <textarea
            className={sectionStyles.textarea}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            placeholder="Sobre o projeto..."
          />
        </div>
      </div>

      <div className={sectionStyles.cardHeader} style={{ marginTop: "var(--space-4, 16px)" }}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Tipo e recorrência</h2>
          <p className={sectionStyles.cardHint}>
            Recorrente ou Manutenção geram um recebimento todo mês no dia escolhido
          </p>
        </div>
      </div>

      <div className={sectionStyles.formGrid}>
        <div className={sectionStyles.formFull}>
          <label className={sectionStyles.fieldLabel}>Tipo de projeto</label>
          <select
            className={sectionStyles.select}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            disabled={saving}
          >
            {PROJECT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {project.is_recurring && (
            <p className={sectionStyles.cardHint}>
              Já recebido {project.recurrence_received_count || 0} vez(es) até agora. Alterar o
              valor vale só para os próximos meses.
            </p>
          )}
        </div>

        {projectType !== "common" && (
          <>
            <CurrencyInput
              label="Valor por mês"
              placeholder="0,00"
              value={recurrenceAmount}
              onChange={(e) => setRecurrenceAmount(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Dia do recebimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 30"
              value={recurrenceDay}
              onChange={(e) => setRecurrenceDay(e.target.value)}
              disabled={saving}
            />
            <div className={sectionStyles.formFull}>
              <Input
                label="Encerrar em (opcional)"
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                disabled={saving}
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <p className={sectionStyles.empty} style={{ color: "var(--color-danger, #e5484d)" }}>
          {error}
        </p>
      )}

      <div className={sectionStyles.actions}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </section>
  );
}
