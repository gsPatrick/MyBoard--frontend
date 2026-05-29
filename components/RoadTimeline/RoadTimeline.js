"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import {
  getProjectsForDay,
  getWeekDays,
  isProjectOverdue,
  toDateKey,
} from "@/lib/roadTimelineDates";
import { useDashboardNav } from "@/context/DashboardNavContext";
import RoadTimelineEmpty from "./RoadTimelineEmpty";
import styles from "./RoadTimeline.module.css";

export default function RoadTimeline() {
  const { selectProject } = useDashboardNav();
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const dayProjects = useMemo(
    () => getProjectsForDay(projects, selectedDateKey, weekDays),
    [projects, selectedDateKey, weekDays]
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
    <section className={styles.card}>
      <h2 className={styles.title}>Projetos da semana</h2>

      <div className={styles.calendar}>
        {weekDays.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            className={`${styles.day} ${selectedDateKey === day.dateKey ? styles.dayActive : ""}`}
            onClick={() => setSelectedDateKey(day.dateKey)}
            aria-pressed={selectedDateKey === day.dateKey}
            aria-label={`${day.label} ${day.day}`}
          >
            <span className={styles.dayLabel}>{day.label}</span>
            <span className={styles.dayNumber}>{day.day}</span>
          </button>
        ))}
      </div>

      <div className={`${styles.list} ${!loading && dayProjects.length === 0 ? styles.listEmpty : ""}`}>
        {loading && (
          <div className={styles.loadingWrap}>
            <span className={styles.loadingBar} />
            <span className={styles.loadingBar} />
            <span className={styles.loadingBarShort} />
          </div>
        )}

        {!loading && dayProjects.length === 0 && <RoadTimelineEmpty />}

        {!loading &&
          dayProjects.map((project, index) => {
            const client = project.client;
            const avatarUrl = getClientAvatarUrl(client);
            const isLast = index === dayProjects.length - 1;
            const overdue = isProjectOverdue(project, selectedDateKey);

            return (
              <article
                key={project.id}
                className={`${styles.item} ${!isLast ? styles.itemWithConnector : ""} ${overdue ? styles.itemOverdue : ""}`}
              >
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => selectProject(project)}
                >
                  <Avatar
                    src={avatarUrl}
                    name={client?.name || "Cliente"}
                    alt={client?.name || ""}
                    size="sm"
                  />
                  <div className={styles.itemText}>
                    <p className={styles.itemTitle}>{project.name}</p>
                    {client?.name && <p className={styles.itemMeta}>{client.name}</p>}
                    {overdue && <p className={styles.overdueLabel}>Prazo vencido</p>}
                  </div>
                </button>
              </article>
            );
          })}
      </div>
    </section>
  );
}
