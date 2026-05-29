"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import CurrencyInput from "@/components/CurrencyInput/CurrencyInput";
import {
  createProjectFinancialEntry,
  deleteProjectFinancialEntry,
  listProjectFinancialEntries,
} from "@/api/projectFinancial";
import { FINANCIAL_ENTRY_TYPES, FINANCIAL_ENTRY_LABELS } from "@/lib/financialLabels";
import { formatCurrencyBRL } from "@/lib/projectStats";
import { parseCurrencyInput } from "@/lib/currencyInput";
import { sumEntryAmounts, parseAmount } from "@/lib/financialStats";
import sectionStyles from "../ProjectDetailSection.module.css";
import styles from "./FinancialSection.module.css";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FinancialSection({ project, onChange }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entry_type: "entrada",
    title: "",
    amount: "",
    entry_date: todayIso(),
    description: "",
  });

  const load = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const data = await listProjectFinancialEntries(project.id);
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const received = useMemo(() => sumEntryAmounts(entries), [entries]);
  const budget = parseAmount(project?.budget);
  const pending = Math.max(budget - received, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    const amount = parseCurrencyInput(form.amount);
    if (!form.title.trim() || amount == null || amount <= 0) return;

    setSaving(true);
    try {
      await createProjectFinancialEntry(project.id, {
        entry_type: form.entry_type,
        title: form.title.trim(),
        amount,
        entry_date: form.entry_date,
        description: form.description.trim() || undefined,
      });
      setForm({
        entry_type: "entrada",
        title: "",
        amount: "",
        entry_date: todayIso(),
        description: "",
      });
      await load();
      onChange?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(entryId) {
    await deleteProjectFinancialEntry(project.id, entryId);
    await load();
    onChange?.();
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Financeiro</h2>
          <p className={sectionStyles.cardHint}>
            Entrada, adiantamento, sprint, parcelas e outros recebimentos
          </p>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Orçamento</span>
          <span className={styles.summaryValue}>
            {budget > 0 ? formatCurrencyBRL(budget) : "—"}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Recebido</span>
          <span className={styles.summaryValue}>{formatCurrencyBRL(received)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>A receber</span>
          <span className={styles.summaryValue}>
            {budget > 0 ? formatCurrencyBRL(pending) : "—"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div>
            <label className={sectionStyles.fieldLabel} htmlFor="fin-type">
              Tipo
            </label>
            <select
              id="fin-type"
              className={sectionStyles.select}
              value={form.entry_type}
              onChange={(e) => setForm((f) => ({ ...f, entry_type: e.target.value }))}
            >
              {FINANCIAL_ENTRY_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <CurrencyInput
            label="Valor (R$)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <div className={styles.formFull}>
            <Input
              label="Título"
              placeholder="Ex.: Adiantamento sprint 1"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <Input
            label="Data"
            type="date"
            value={form.entry_date}
            onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
          />
          <div className={styles.formFull}>
            <label className={sectionStyles.fieldLabel} htmlFor="fin-desc">
              Observação
            </label>
            <textarea
              id="fin-desc"
              className={sectionStyles.textarea}
              style={{ minHeight: 64 }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? "Salvando..." : "Registrar lançamento"}
        </Button>
      </form>

      {loading && <p className={sectionStyles.empty}>Carregando...</p>}
      {!loading && entries.length === 0 && (
        <p className={sectionStyles.empty}>Nenhum lançamento financeiro ainda.</p>
      )}
      {!loading && entries.length > 0 && (
        <div className={sectionStyles.list} style={{ marginTop: "var(--space-4)" }}>
          {entries.map((entry) => (
            <div key={entry.id} className={sectionStyles.item}>
              <div className={sectionStyles.itemMain}>
                <p className={sectionStyles.itemTitle}>{entry.title}</p>
                <p className={sectionStyles.itemMeta}>
                  {FINANCIAL_ENTRY_LABELS[entry.entry_type]} · {formatDate(entry.entry_date)}
                </p>
                {entry.description && (
                  <p className={sectionStyles.itemDesc}>{entry.description}</p>
                )}
              </div>
              <div className={styles.entryRight}>
                <span className={styles.entryAmount}>
                  {formatCurrencyBRL(entry.amount)}
                </span>
                <button
                  type="button"
                  className={sectionStyles.iconBtn}
                  title="Excluir"
                  onClick={() => handleRemove(entry.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
