"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AvatarGroup from "@/components/AvatarGroup/AvatarGroup";
import StatusStrip from "@/components/StatusStrip/StatusStrip";
import { listProjects } from "@/services/projects";
import { listFinancialEntries } from "@/services/finance";
import { getStoredTenant } from "@/services/client";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { computeProjectDashboardStats, formatCurrencyBRL } from "@/lib/projectStats";
import { buildReceivedByProjectId, getCurrentYearMonth, sumEntryAmounts } from "@/lib/financialStats";
import { assets } from "@/lib/dashboardData";
import styles from "./ProjectHero.module.css";

const CELEBRATION_MS = 2400;

export default function ProjectHero() {
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animação de "concluiu tudo": só toca na transição (aberto → tudo concluído),
  // não toda vez que o dashboard abre já com tudo concluído.
  const [celebrating, setCelebrating] = useState(false);
  const [animateCollapse, setAnimateCollapse] = useState(false);
  const [prevAllDone, setPrevAllDone] = useState(null);
  const [prevHideReceivable, setPrevHideReceivable] = useState(null);

  const tenantName = getStoredTenant()?.name || "Meu workspace";

  // Todos os lançamentos: descontam do "a receber" e alimentam o "recebido no mês".
  const receivedByProjectId = useMemo(() => buildReceivedByProjectId(entries), [entries]);
  const receivedThisMonth = useMemo(() => {
    const month = getCurrentYearMonth();
    return sumEntryAmounts(entries.filter((e) => (e.entry_date || "").startsWith(month)));
  }, [entries]);

  const stats = useMemo(
    () => computeProjectDashboardStats(projects, receivedByProjectId),
    [projects, receivedByProjectId]
  );
  const allDone = !loading && stats.total > 0 && stats.completedCount === stats.total;
  // "Total a receber" só some quando tudo foi entregue E pago
  // (projeto concluído com parcela pendente continua aparecendo).
  const hideReceivable = allDone && stats.pendingFromProjects === 0;

  // Detecta a transição durante o render (padrão recomendado pelo React).
  // Primeira carga (prevAllDone === null): aplica o estado final sem animar.
  if (!loading && prevAllDone !== allDone) {
    if (prevAllDone !== null) setCelebrating(allDone);
    setPrevAllDone(allDone);
  }
  if (!loading && prevHideReceivable !== hideReceivable) {
    if (prevHideReceivable !== null) setAnimateCollapse(true);
    setPrevHideReceivable(hideReceivable);
  }

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

  const clientAvatars = useMemo(
    () =>
      stats.clients.map((client) => ({
        src: getClientAvatarUrl(client),
        name: client.name,
      })),
    [stats.clients]
  );

  // `loading` só é true na primeira carga; nos refreshes os valores antigos
  // ficam na tela até chegarem os novos (evita o "Total a receber" piscar).
  const loadData = useCallback(async () => {
    try {
      await ensureActiveTenant();
      const [projectsData, entriesData] = await Promise.all([
        listProjects({ limit: 100 }),
        listFinancialEntries().catch(() => []),
      ]);
      setProjects(normalizeListResponse(projectsData));
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch {
      setProjects([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("myboard:workspace-refresh", loadData);
    window.addEventListener("myboard:tenant-changed", loadData);

    return () => {
      window.removeEventListener("myboard:workspace-refresh", loadData);
      window.removeEventListener("myboard:tenant-changed", loadData);
    };
  }, [loadData]);

  const receivableClass = [
    styles.collapsible,
    animateCollapse ? styles.collapsibleAnimated : "",
    hideReceivable ? styles.collapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={`${styles.hero} ${celebrating ? styles.heroCelebrating : ""}`}
      data-tour="central-hero"
    >
      <div className={styles.content}>
        <h1 className={styles.title}>{tenantName}</h1>
        <div className={styles.metrics}>
          <div className={`${styles.metric} ${styles.metricStatus}`}>
            <span className={styles.metricLabel}>Status</span>
            <StatusStrip
              progress={loading ? 0 : stats.progress}
              statusText="Concluídos"
              color={allDone ? "green" : "indigo"}
            />
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projetos finalizados</span>
            <p className={styles.metricValue}>
              <span className={styles.metricStrong}>
                {loading ? "—" : stats.completedCount}
              </span>
              <span className={styles.metricMuted}> / </span>
              <span className={styles.metricStrong}>{loading ? "—" : stats.total}</span>
              {allDone && (
                <span
                  className={`${styles.doneBadge} ${celebrating ? styles.doneBadgePop : ""}`}
                  role="status"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.doneIcon}>
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={celebrating ? styles.doneCheckDraw : ""}
                    />
                  </svg>
                  Tudo concluído
                </span>
              )}
            </p>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projetos em aberto</span>
            <p className={styles.metricStrong}>{loading ? "—" : stats.openCount}</p>
          </div>
          <div className={receivableClass} aria-hidden={hideReceivable || undefined}>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total a receber</span>
              <p className={styles.metricStrong}>
                {loading ? "—" : formatCurrencyBRL(stats.totalToReceive)}
              </p>
            </div>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Recebido no mês</span>
            <p className={styles.metricStrong}>
              {loading ? "—" : formatCurrencyBRL(receivedThisMonth)}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.side}>
        <img src={assets.snowLogo} alt="" className={styles.snowLogo} aria-hidden="true" />
        {clientAvatars.length > 0 ? (
          <AvatarGroup avatars={clientAvatars} max={4} size="md" />
        ) : (
          <span className={styles.noClients}>Sem clientes em aberto</span>
        )}
      </div>
    </section>
  );
}
