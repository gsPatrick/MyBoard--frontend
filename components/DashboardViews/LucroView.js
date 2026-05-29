"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listFinancialEntries } from "@/api/finance";
import { listClients } from "@/api/clients";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { formatCurrencyBRL } from "@/lib/projectStats";
import {
  aggregateByProject,
  buildTypeChartSegments,
  conicGradientFromSegments,
  groupByEntryType,
  groupByMonth,
  parseAmount,
  sumEntryAmounts,
} from "@/lib/financialStats";
import { FINANCIAL_ENTRY_LABELS } from "@/lib/financialLabels";
import styles from "./LucroView.module.css";

function formatMonthLabel(ym) {
  if (!ym) return "";
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function LucroView() {
  const {
    lucroFilter,
    clearLucroFilter,
    selectProject,
    setLucroFilter,
  } = useDashboardNav();
  const { setActiveTab } = useDashboardTab();

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clientFilter, setClientFilter] = useState(lucroFilter.clientId || "");
  const [projectFilter, setProjectFilter] = useState(lucroFilter.projectId || "");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setClientFilter(lucroFilter.clientId || "");
    setProjectFilter(lucroFilter.projectId || "");
  }, [lucroFilter.clientId, lucroFilter.projectId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const params = {};
      if (clientFilter) params.client_id = clientFilter;
      if (projectFilter) params.project_id = projectFilter;
      if (typeFilter) params.entry_type = typeFilter;

      const [entriesData, clientsData, projectsData] = await Promise.all([
        listFinancialEntries(params),
        listClients({ limit: 200, include_inactive: "true" }),
        listProjects({ limit: 200 }),
      ]);

      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setClients(normalizeListResponse(clientsData));
      setProjects(normalizeListResponse(projectsData));
    } catch {
      setEntries([]);
      setClients([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [clientFilter, projectFilter, typeFilter]);

  useEffect(() => {
    load();
    window.addEventListener("myboard:workspace-refresh", load);
    return () => window.removeEventListener("myboard:workspace-refresh", load);
  }, [load]);

  const filteredClient = clients.find((c) => c.id === clientFilter);
  const projectsForClient = useMemo(() => {
    if (!clientFilter) return projects;
    return projects.filter((p) => p.client_id === clientFilter);
  }, [projects, clientFilter]);

  const projectRows = useMemo(
    () => aggregateByProject(entries, projectsForClient),
    [entries, projectsForClient]
  );

  const receivedTotal = useMemo(() => sumEntryAmounts(entries), [entries]);
  const budgetTotal = useMemo(() => {
    if (projectFilter) {
      const project = projects.find((p) => p.id === projectFilter);
      return parseAmount(project?.budget);
    }
    const list = clientFilter ? projectsForClient : projects;
    return list.reduce((sum, p) => sum + parseAmount(p.budget), 0);
  }, [projectFilter, clientFilter, projects, projectsForClient]);

  const pendingTotal = Math.max(budgetTotal - receivedTotal, 0);
  const byMonth = useMemo(() => groupByMonth(entries), [entries]);
  const maxMonth = Math.max(...byMonth.map((m) => m.total), 1);
  const byType = useMemo(() => groupByEntryType(entries), [entries]);
  const typeSegments = useMemo(() => buildTypeChartSegments(byType), [byType]);

  function handleClientChange(value) {
    setClientFilter(value);
    setProjectFilter("");
    setLucroFilter({ clientId: value || null, projectId: null });
  }

  function handleProjectChange(value) {
    setProjectFilter(value);
    setLucroFilter({
      clientId: clientFilter || null,
      projectId: value || null,
    });
  }

  function handleClearFilters() {
    setClientFilter("");
    setProjectFilter("");
    setTypeFilter("");
    clearLucroFilter();
  }

  const hasActiveFilter = Boolean(clientFilter || projectFilter || typeFilter);

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="lucro-client">
            Cliente
          </label>
          <select
            id="lucro-client"
            className={styles.select}
            value={clientFilter}
            onChange={(e) => handleClientChange(e.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="lucro-project">
            Projeto
          </label>
          <select
            id="lucro-project"
            className={styles.select}
            value={projectFilter}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={!clientFilter && projects.length > 50}
          >
            <option value="">Todos os projetos</option>
            {(clientFilter ? projectsForClient : projects).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="lucro-type">
            Tipo
          </label>
          <select
            id="lucro-type"
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(FINANCIAL_ENTRY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilter && (
        <div className={styles.filterBanner}>
          <span>
            {filteredClient
              ? `Filtrando por cliente: ${filteredClient.name}`
              : "Filtros ativos"}
            {projectFilter &&
              ` · projeto: ${projects.find((p) => p.id === projectFilter)?.name || ""}`}
          </span>
          <button type="button" className={styles.clearBtn} onClick={handleClearFilters}>
            Limpar filtros
          </button>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Recebido no período</p>
          <p className={styles.statValue}>
            {loading ? "—" : formatCurrencyBRL(receivedTotal)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Orçamento (filtro)</p>
          <p className={styles.statValue}>
            {loading ? "—" : formatCurrencyBRL(budgetTotal)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>A receber</p>
          <p className={styles.statValue}>
            {loading ? "—" : formatCurrencyBRL(pendingTotal)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Lançamentos</p>
          <p className={styles.statValue}>{loading ? "—" : entries.length}</p>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Recebimentos por mês</h3>
          {byMonth.length === 0 ? (
            <p className={styles.empty}>Sem lançamentos para exibir</p>
          ) : (
            <div className={styles.barChart}>
              {byMonth.map((item) => (
                <div key={item.month} className={styles.barCol}>
                  <span className={styles.barValue}>
                    {formatCurrencyBRL(item.total)}
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.bar}
                      style={{ height: `${(item.total / maxMonth) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{formatMonthLabel(item.month)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Por tipo de recebimento</h3>
          {typeSegments.length === 0 ? (
            <p className={styles.empty}>Sem dados</p>
          ) : (
            <div className={styles.donutWrap}>
              <div
                className={styles.donut}
                style={{ background: conicGradientFromSegments(typeSegments) }}
              >
                <div className={styles.donutHole} />
              </div>
              <div className={styles.legend}>
                {typeSegments.map((seg) => (
                  <div key={seg.type} className={styles.legendItem}>
                    <span className={styles.legendLeft}>
                      <span
                        className={styles.legendDot}
                        style={{ background: seg.color }}
                      />
                      <span className={styles.legendLabel}>
                        {FINANCIAL_ENTRY_LABELS[seg.type]}
                      </span>
                    </span>
                    <span className={styles.legendValue}>
                      {formatCurrencyBRL(seg.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {clientFilter && (
        <section className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            Projetos de {filteredClient?.name || "cliente"}
          </h3>
          {projectsForClient.length === 0 ? (
            <p className={styles.empty}>Este cliente não tem projetos.</p>
          ) : (
            <div className={styles.table}>
              {projectsForClient.map((project) => {
                const row = projectRows.find((r) => r.projectId === project.id);
                const received = row?.received || 0;
                const entryCount = row?.entryCount || 0;
                const budget = parseAmount(project.budget);
                const pending = Math.max(budget - received, 0);
                return (
                  <button
                    key={project.id}
                    type="button"
                    className={styles.tableRowButton}
                    onClick={() => {
                      selectProject(project);
                      setActiveTab("central");
                    }}
                  >
                    <div className={styles.cellMain}>
                      <p className={styles.cellTitle}>{project.name}</p>
                      <p className={styles.cellMeta}>
                        {entryCount} lançamento(s)
                      </p>
                    </div>
                    <span className={styles.cellAmount}>
                      {formatCurrencyBRL(received)}
                    </span>
                    <span className={styles.cellMeta}>
                      Orç.: {budget > 0 ? formatCurrencyBRL(budget) : "—"}
                    </span>
                    <span className={styles.cellMeta}>
                      Falta: {budget > 0 ? formatCurrencyBRL(pending) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Últimos lançamentos</h3>
        {loading && <p className={styles.empty}>Carregando...</p>}
        {!loading && entries.length === 0 && (
          <p className={styles.empty}>
            Registre entradas na aba Financeiro de cada projeto.
          </p>
        )}
        {!loading &&
          entries.slice(0, 20).map((entry) => (
            <div key={entry.id} className={styles.tableRow}>
              <div className={styles.cellMain}>
                <p className={styles.cellTitle}>{entry.title}</p>
                <p className={styles.cellMeta}>
                  {entry.project?.name} · {entry.project?.client?.name} ·{" "}
                  {FINANCIAL_ENTRY_LABELS[entry.entry_type]} · {formatDate(entry.entry_date)}
                </p>
              </div>
              <span className={styles.cellAmount}>
                {formatCurrencyBRL(entry.amount)}
              </span>
            </div>
          ))}
      </section>
    </div>
  );
}
