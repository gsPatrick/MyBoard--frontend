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

  // Animação de "concluiu tudo": toca quando o último projeto em aberto é
  // concluído (o lote fecha). Mostra "N / N · 100%" por um instante e depois
  // o card limpa para 0 / 0, pronto para o próximo ciclo.
  const [celebration, setCelebration] = useState(null); // { total } durante a animação
  const [prevCycle, setPrevCycle] = useState(null);
  const [animateCollapse, setAnimateCollapse] = useState(false);
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
  // "Total a receber" some quando não há projeto em aberto nem saldo pendente
  // (projeto concluído com parcela pendente continua aparecendo).
  const hideReceivable = !loading && stats.openCount === 0 && stats.pendingFromProjects === 0;

  // Detecta as transições durante o render (padrão recomendado pelo React).
  // Primeira carga (prev === null): aplica o estado final sem animar.
  if (!loading) {
    const cycleKey = `${stats.openCount}|${stats.total}|${stats.completedAllCount}`;
    if (prevCycle !== cycleKey) {
      if (prevCycle !== null) {
        const [prevOpen, prevTotal, prevDone] = prevCycle.split("|").map(Number);
        const justClosed =
          prevOpen > 0 &&
          stats.openCount === 0 &&
          stats.total === 0 &&
          stats.completedAllCount > prevDone;
        if (justClosed) setCelebration({ total: prevTotal });
        else if (stats.openCount > 0) setCelebration(null);
      }
      setPrevCycle(cycleKey);
    }
  }
  if (!loading && prevHideReceivable !== hideReceivable) {
    if (prevHideReceivable !== null) setAnimateCollapse(true);
    setPrevHideReceivable(hideReceivable);
  }

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(null), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebration]);

  const celebrating = Boolean(celebration);
  // Durante a animação mostra o lote que acabou de fechar; depois, o lote atual (zerado).
  const shown = celebration
    ? { completed: celebration.total, total: celebration.total, progress: 100 }
    : { completed: stats.completedCount, total: stats.total, progress: stats.progress };

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
    styles.metric,
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
        <div className={styles.head}>
          <div className={styles.headTitle}>
            <h1 className={styles.title}>{tenantName}</h1>
          {celebrating && (
            <span className={`${styles.doneBadge} ${styles.doneBadgePop}`} role="status">
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.doneIcon}>
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.doneCheckDraw}
                />
              </svg>
              Tudo concluído
            </span>
          )}
          </div>
          <div className={styles.side}>
            {clientAvatars.length > 0 ? (
              <AvatarGroup avatars={clientAvatars} max={4} size="md" />
            ) : (
              <span className={styles.noClients}>Sem clientes em aberto</span>
            )}
            <img src={assets.snowLogo} alt="" className={styles.snowLogo} aria-hidden="true" />
          </div>
        </div>
        {/* Uma linha só; se a tela for estreita quebra, e o divisor do 1º item
            de cada linha fica escondido (ver .metricsClip no CSS). */}
        <div className={styles.metricsClip}>
        <div className={styles.metrics}>
          <div className={`${styles.metric} ${styles.metricStatus}`}>
            <span className={styles.metricLabel}>Status</span>
            <StatusStrip
              progress={loading ? 0 : shown.progress}
              statusText="Concluídos"
              color={celebrating ? "green" : "indigo"}
            />
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projetos finalizados</span>
            <p className={styles.metricValue}>
              <span
                key={celebrating ? "fechado" : `lote-${shown.completed}-${shown.total}`}
                className={styles.valueSwap}
              >
                <span className={styles.metricStrong}>{loading ? "—" : shown.completed}</span>
                <span className={styles.metricMuted}> / </span>
                <span className={styles.metricStrong}>{loading ? "—" : shown.total}</span>
              </span>
            </p>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projetos em aberto</span>
            <p className={styles.metricStrong}>{loading ? "—" : stats.openCount}</p>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Concluídos no mês</span>
            <p
              key={`mes-${stats.completedThisMonth}`}
              className={`${styles.metricStrong} ${styles.valueSwap}`}
            >
              {loading ? "—" : stats.completedThisMonth}
            </p>
          </div>
          <div className={receivableClass} aria-hidden={hideReceivable || undefined}>
            <span className={styles.metricLabel}>Total a receber</span>
            <p className={styles.metricStrong}>
              {loading ? "—" : formatCurrencyBRL(stats.totalToReceive)}
            </p>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Recebido no mês</span>
            <p className={styles.metricStrong}>
              {loading ? "—" : formatCurrencyBRL(receivedThisMonth)}
            </p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
