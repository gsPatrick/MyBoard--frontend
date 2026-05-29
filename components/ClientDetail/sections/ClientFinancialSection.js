"use client";

import Button from "@/components/Button/Button";
import { formatCurrencyBRL } from "@/lib/projectStats";
import { FINANCIAL_ENTRY_LABELS } from "@/lib/financialLabels";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";

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

export default function ClientFinancialSection({ client, entries, totalReceived }) {
  const { openLucroForClient } = useDashboardNav();
  const { setActiveTab } = useDashboardTab();

  function handleOpenLucro() {
    openLucroForClient(client);
    setActiveTab("lucro");
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Financeiro</h2>
          <p className={sectionStyles.cardHint}>
            Entradas registradas nos projetos deste cliente
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleOpenLucro}>
          Abrir em Lucro
        </Button>
      </div>

      <div className={sectionStyles.credGrid} style={{ marginBottom: 16 }}>
        <div>
          <span className={sectionStyles.credLabel}>Total recebido</span>
          <p className={sectionStyles.credValue}>{formatCurrencyBRL(totalReceived)}</p>
        </div>
        <div>
          <span className={sectionStyles.credLabel}>Lançamentos</span>
          <p className={sectionStyles.credValue}>{entries.length}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className={sectionStyles.empty}>
          Nenhuma entrada financeira para os projetos deste cliente.
        </p>
      ) : (
        <div className={sectionStyles.list}>
          {entries.slice(0, 12).map((entry) => (
            <article key={entry.id} className={sectionStyles.item}>
              <div className={sectionStyles.itemMain}>
                <p className={sectionStyles.itemTitle}>
                  {formatCurrencyBRL(entry.amount)} ·{" "}
                  {FINANCIAL_ENTRY_LABELS[entry.entry_type] || entry.entry_type}
                </p>
                <p className={sectionStyles.itemMeta}>
                  {entry.project?.name || "Projeto"} · {formatDate(entry.entry_date)}
                </p>
                {entry.description && (
                  <p className={sectionStyles.itemDesc}>{entry.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
