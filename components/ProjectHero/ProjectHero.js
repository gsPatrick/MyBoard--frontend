"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AvatarGroup from "@/components/AvatarGroup/AvatarGroup";
import StatusStrip from "@/components/StatusStrip/StatusStrip";
import { listProjects } from "@/api/projects";
import { getStoredTenant } from "@/api/client";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { computeProjectDashboardStats, formatCurrencyBRL } from "@/lib/projectStats";
import { assets } from "@/lib/dashboardData";
import styles from "./ProjectHero.module.css";

export default function ProjectHero() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const tenantName = getStoredTenant()?.name || "Meu workspace";

  const stats = useMemo(() => computeProjectDashboardStats(projects), [projects]);

  const clientAvatars = useMemo(
    () =>
      stats.clients.map((client) => ({
        src: getClientAvatarUrl(client),
        name: client.name,
      })),
    [stats.clients]
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const data = await listProjects({ limit: 100 });
      setProjects(normalizeListResponse(data));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    window.addEventListener("myboard:workspace-refresh", loadProjects);
    window.addEventListener("myboard:tenant-changed", loadProjects);

    return () => {
      window.removeEventListener("myboard:workspace-refresh", loadProjects);
      window.removeEventListener("myboard:tenant-changed", loadProjects);
    };
  }, [loadProjects]);

  return (
    <section className={styles.hero} data-tour="central-hero">
      <div className={styles.content}>
        <h1 className={styles.title}>{tenantName}</h1>
        <div className={styles.metrics}>
          <div className={`${styles.metric} ${styles.metricStatus}`}>
            <span className={styles.metricLabel}>Status</span>
            <StatusStrip
              progress={loading ? 0 : stats.progress}
              statusText="Concluídos"
              color="indigo"
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
            </p>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projetos em aberto</span>
            <p className={styles.metricStrong}>{loading ? "—" : stats.openCount}</p>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total a receber</span>
            <p className={styles.metricStrong}>
              {loading ? "—" : formatCurrencyBRL(stats.totalToReceive)}
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
