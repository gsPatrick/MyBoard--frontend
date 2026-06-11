"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FinancialEntriesTable from "@/components/FinancialEntriesTable/FinancialEntriesTable";
import Tab from "@/components/Tab/Tab";
import { listFinancialEntries } from "@/services/finance";
import { listClients } from "@/services/clients";
import { listProjects } from "@/services/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { formatCurrencyBRL } from "@/lib/projectStats";
import {
  aggregateByClient,
  aggregateByProject,
  buildPanoramaTimeline,
  groupByMonthAndType,
  parseAmount,
  sumEntryAmounts,
} from "@/lib/financialStats";
import { FINANCIAL_ENTRY_COLORS, FINANCIAL_ENTRY_LABELS } from "@/lib/financialLabels";
import styles from "./LucroView.module.css";

function formatMonthLabel(ym) {
  if (!ym) return "";
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
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
  const [topRankTab, setTopRankTab] = useState("projects");

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

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        (b.entry_date || "").localeCompare(a.entry_date || "")
      ),
    [entries]
  );

  const projectRows = useMemo(
    () => aggregateByProject(entries, projectsForClient),
    [entries, projectsForClient]
  );

  const clientRows = useMemo(() => aggregateByClient(entries), [entries]);

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
  const monthType = useMemo(() => groupByMonthAndType(entries), [entries]);
  const panoramaTimeline = useMemo(
    () => buildPanoramaTimeline(monthType),
    [monthType]
  );

  const maxStackMonth = useMemo(() => {
    const dataTotals = panoramaTimeline
      .filter((item) => item.slot === "data")
      .map((item) => item.total);
    return Math.max(...dataTotals, 1);
  }, [panoramaTimeline]);

  const topProjects = projectRows.slice(0, 6);
  const topClients = clientRows.slice(0, 6);
  const maxProjectBar = Math.max(...topProjects.map((r) => r.received), 1);
  const maxClientBar = Math.max(...topClients.map((r) => r.received), 1);

  const receivedPercent =
    budgetTotal > 0 ? Math.min((receivedTotal / budgetTotal) * 100, 100) : 0;
  const pendingPercent =
    budgetTotal > 0 ? Math.min((pendingTotal / budgetTotal) * 100, 100) : 0;

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

  function handleEntryClick(entry) {
    const project = entry.project || projects.find((p) => p.id === entry.project_id);
    if (!project) return;
    selectProject(project);
    setActiveTab("projetos");
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

      <div className={styles.statsGrid} data-tour="lucro-onboarding-anchor">
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

      <div className={styles.chartsGrid}>
        <section className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Recebido vs orçamento</h3>
          {budgetTotal <= 0 ? (
            <p className={styles.empty}>Defina orçamento nos projetos para comparar</p>
          ) : (
            <div className={styles.compareBlock}>
              <div className={styles.compareRow}>
                <div className={styles.compareHead}>
                  <span>Recebido</span>
                  <span>{formatCurrencyBRL(receivedTotal)}</span>
                </div>
                <div className={styles.compareTrack}>
                  <div
                    className={styles.compareFillReceived}
                    style={{ width: `${receivedPercent}%` }}
                  />
                </div>
              </div>
              <div className={styles.compareRow}>
                <div className={styles.compareHead}>
                  <span>A receber</span>
                  <span>{formatCurrencyBRL(pendingTotal)}</span>
                </div>
                <div className={styles.compareTrack}>
                  <div
                    className={styles.compareFillPending}
                    style={{ width: `${pendingPercent}%` }}
                  />
                </div>
              </div>
              <div className={styles.compareMeta}>
                <span>Orçamento total</span>
                <strong>{formatCurrencyBRL(budgetTotal)}</strong>
              </div>
            </div>
          )}
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartCardHead}>
            <h3 className={styles.chartTitle}>Top ranking</h3>
            <div className={styles.chartTabs} role="tablist" aria-label="Top ranking">
              <Tab
                label="Projetos"
                active={topRankTab === "projects"}
                onClick={() => setTopRankTab("projects")}
              />
              <Tab
                label="Clientes"
                active={topRankTab === "clients"}
                onClick={() => setTopRankTab("clients")}
              />
            </div>
          </div>

          {topRankTab === "projects" && topProjects.length === 0 && (
            <p className={styles.empty}>Sem dados de projetos</p>
          )}
          {topRankTab === "clients" && topClients.length === 0 && (
            <p className={styles.empty}>Sem dados de clientes</p>
          )}

          {topRankTab === "projects" && topProjects.length > 0 && (
            <div className={styles.hBarList}>
              {topProjects.map((row) => (
                <div key={row.projectId} className={styles.hBarRow}>
                  <span className={styles.hBarLabel} title={row.project?.name}>
                    {row.project?.name || "Projeto"}
                  </span>
                  <div className={styles.hBarTrack}>
                    <div
                      className={styles.hBarFill}
                      style={{
                        width: `${(row.received / maxProjectBar) * 100}%`,
                      }}
                    />
                  </div>
                  <span className={styles.hBarValue}>
                    {formatCurrencyBRL(row.received)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {topRankTab === "clients" && topClients.length > 0 && (
            <div className={styles.hBarList}>
              {topClients.map((row) => (
                <div key={row.client.id} className={styles.hBarRow}>
                  <span className={styles.hBarLabel} title={row.client.name}>
                    {row.client.name}
                  </span>
                  <div className={styles.hBarTrack}>
                    <div
                      className={`${styles.hBarFill} ${styles.hBarFillClient}`}
                      style={{
                        width: `${(row.received / maxClientBar) * 100}%`,
                      }}
                    />
                  </div>
                  <span className={styles.hBarValue}>
                    {formatCurrencyBRL(row.received)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${styles.chartCard} ${styles.chartCardWide}`}>
          <h3 className={styles.chartTitle}>Panorama mensal</h3>
          <p className={styles.chartSubtitle}>
            Recebimentos por tipo · meses sem lançamento ficam vazios · tracejado =
            previsto
          </p>
          <div className={styles.stackedChart}>
            {panoramaTimeline.map(({ month, monthData, total, slot }) => (
              <div
                key={month}
                className={`${styles.stackedCol} ${
                  slot === "past-empty"
                    ? styles.stackedColPastEmpty
                    : slot === "future"
                      ? styles.stackedColFuture
                      : ""
                }`}
              >
                {slot === "data" ? (
                  <div
                    className={styles.stackedTrack}
                    style={{ height: `${(total / maxStackMonth) * 100}%` }}
                  >
                    {monthType.types.map((type) => {
                      const value = monthData[type] || 0;
                      if (value <= 0) return null;
                      return (
                        <div
                          key={type}
                          className={styles.stackedSegment}
                          style={{
                            flexGrow: value,
                            background:
                              FINANCIAL_ENTRY_COLORS[type] ||
                              FINANCIAL_ENTRY_COLORS.outro,
                          }}
                          title={`${FINANCIAL_ENTRY_LABELS[type]}: ${formatCurrencyBRL(value)}`}
                        />
                      );
                    })}
                  </div>
                ) : slot === "future" ? (
                  <div
                    className={styles.stackedTrackFuture}
                    title="Mês futuro — previsto"
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className={styles.stackedTrackEmpty}
                    title="Sem lançamentos neste mês"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`${styles.stackedLabel} ${
                    slot === "future" ? styles.stackedLabelFuture : ""
                  }`}
                >
                  {formatMonthLabel(month)}
                </span>
              </div>
            ))}
          </div>
          {monthType.types.length > 0 && (
            <div className={styles.typeLegend}>
              {monthType.types.map((type) => (
                <span key={type} className={styles.typeLegendItem}>
                  <span
                    className={styles.typeLegendDot}
                    style={{
                      background:
                        FINANCIAL_ENTRY_COLORS[type] || FINANCIAL_ENTRY_COLORS.outro,
                    }}
                  />
                  {FINANCIAL_ENTRY_LABELS[type]}
                </span>
              ))}
              <span className={styles.typeLegendItem}>
                <span className={styles.typeLegendDashFuture} aria-hidden="true" />
                Futuro (previsto)
              </span>
            </div>
          )}
        </section>
      </div>

      {clientFilter && (
        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>
              Projetos de {filteredClient?.name || "cliente"}
            </h2>
            <span className={styles.listCount}>
              {projectsForClient.length} projeto(s)
            </span>
          </div>
          {projectsForClient.length === 0 ? (
            <p className={styles.empty}>Este cliente não tem projetos.</p>
          ) : (
            <div className={styles.projectMiniTable}>
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
                    className={styles.projectMiniRow}
                    onClick={() => {
                      selectProject(project);
                      setActiveTab("projetos");
                    }}
                  >
                    <div className={styles.projectMiniMain}>
                      <p className={styles.projectMiniName}>{project.name}</p>
                      <p className={styles.projectMiniMeta}>
                        {entryCount} lançamento(s)
                      </p>
                    </div>
                    <span className={styles.projectMiniAmount}>
                      {formatCurrencyBRL(received)}
                    </span>
                    <span className={styles.projectMiniMeta}>
                      Orç.: {budget > 0 ? formatCurrencyBRL(budget) : "—"}
                    </span>
                    <span className={styles.projectMiniMeta}>
                      Falta: {budget > 0 ? formatCurrencyBRL(pending) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className={styles.listCard}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Últimos lançamentos</h2>
          <span className={styles.listCount}>
            {loading ? "—" : `${sortedEntries.length} lançamento(s)`}
          </span>
        </div>

        {loading && <p className={styles.empty}>Carregando...</p>}

        {!loading && (
          <FinancialEntriesTable
            entries={sortedEntries}
            onEntryClick={handleEntryClick}
            emptyMessage="Registre entradas na aba Financeiro de cada projeto."
          />
        )}
      </section>
    </div>
  );
}
