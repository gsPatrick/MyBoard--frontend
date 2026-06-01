"use client";

import Chip from "@/components/Chip/Chip";
import { FINANCIAL_ENTRY_COLORS, FINANCIAL_ENTRY_LABELS } from "@/lib/financialLabels";
import { formatCurrencyBRL } from "@/lib/projectStats";
import styles from "./FinancialEntriesTable.module.css";

const CHIP_BY_TYPE = {
  entrada: "complete",
  adiantamento: "pending",
  sprint: "in-progress",
  parcela: "approved",
  final: "complete",
  outro: "rejected",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FinancialEntriesTable({
  entries = [],
  onEntryClick,
  emptyMessage = "Nenhum lançamento encontrado",
}) {
  if (!entries.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.table}>
      <div className={styles.col}>
        <div className={styles.th}>Lançamento</div>
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`${styles.cellTitleCol} ${styles.rowButton}`}
            onClick={() => onEntryClick?.(entry)}
            disabled={!onEntryClick}
          >
            <span className={styles.entryTitle}>{entry.title || "Sem título"}</span>
            <span className={styles.entrySub}>
              {entry.project?.client?.name || "—"}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Projeto</div>
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`${styles.cell} ${styles.rowButton}`}
            onClick={() => onEntryClick?.(entry)}
            disabled={!onEntryClick}
          >
            {entry.project?.name || "—"}
          </button>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Tipo</div>
        {entries.map((entry) => {
          const type = entry.entry_type || "outro";
          const chipStatus = CHIP_BY_TYPE[type] || "neutral";

          return (
            <div key={entry.id} className={styles.cellChip}>
              <Chip status={chipStatus}>
                {FINANCIAL_ENTRY_LABELS[type] || type}
              </Chip>
            </div>
          );
        })}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Data</div>
        {entries.map((entry) => (
          <div key={entry.id} className={styles.cell}>
            {formatDate(entry.entry_date)}
          </div>
        ))}
      </div>

      <div className={styles.col}>
        <div className={styles.th}>Valor</div>
        {entries.map((entry) => (
          <div key={entry.id} className={styles.cellAmount}>
            <span
              className={styles.amountDot}
              style={{
                background: FINANCIAL_ENTRY_COLORS[entry.entry_type] || FINANCIAL_ENTRY_COLORS.outro,
              }}
              aria-hidden="true"
            />
            {formatCurrencyBRL(entry.amount)}
          </div>
        ))}
      </div>
    </div>
  );
}
