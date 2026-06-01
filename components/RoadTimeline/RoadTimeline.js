"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import { listEvents } from "@/api/agenda";
import { listDemands } from "@/api/demands";
import { listProjects } from "@/api/projects";
import { normalizeListResponse } from "@/lib/apiList";
import { buildIsoRangeQuery, getWeekRange } from "@/lib/agendaDates";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { isPastDateKey } from "@/lib/agendaDates";
import { getWeekDays, isProjectOverdue, toDateKey } from "@/lib/roadTimelineDates";
import { buildTimelineItems, TIMELINE_ITEM_TYPES } from "@/lib/timelineFeed";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import RoadTimelineEmpty from "./RoadTimelineEmpty";
import styles from "./RoadTimeline.module.css";

const VISIBLE_COUNT = 5;
const CAROUSEL_INTERVAL_MS = 3500;

function TimelineTypeBadge({ type, item }) {
  if (type === TIMELINE_ITEM_TYPES.EVENT) {
    const color = item?.colorTag?.color || "var(--primary)";
    return (
      <span
        className={`${styles.badge} ${styles.badgeEvent}`}
        style={{
          background: `color-mix(in srgb, ${color} 18%, transparent)`,
          color,
        }}
      >
        {item?.eventKind || "Reunião"}
      </span>
    );
  }
  if (type === TIMELINE_ITEM_TYPES.DEMAND) {
    return <span className={`${styles.badge} ${styles.badgeDemand}`}>Demanda</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeProject}`}>Projeto</span>;
}

function TimelineItem({ item, selectedDateKey, isLast, onClick }) {
  const overdue =
    item.type === TIMELINE_ITEM_TYPES.PROJECT && isProjectOverdue(item.data, selectedDateKey);

  const client =
    item.type === TIMELINE_ITEM_TYPES.PROJECT
      ? item.data.client
      : item.type === TIMELINE_ITEM_TYPES.DEMAND
        ? item.data.project?.client
        : item.data.client;

  return (
    <article
      data-timeline-item
      className={`${styles.item} ${!isLast ? styles.itemWithConnector : ""} ${overdue ? styles.itemOverdue : ""} ${item.type === TIMELINE_ITEM_TYPES.EVENT ? styles.itemEvent : ""} ${item.type === TIMELINE_ITEM_TYPES.DEMAND ? styles.itemDemand : ""}`}
    >
      <button type="button" className={styles.itemButton} onClick={() => onClick(item)}>
        <Avatar
          src={getClientAvatarUrl(client)}
          name={client?.name || item.title}
          alt={client?.name || ""}
          size="sm"
        />
        <div className={styles.itemText}>
          <div className={styles.itemTitleRow}>
            <p className={styles.itemTitle}>{item.title}</p>
                      <TimelineTypeBadge type={item.type} item={item} />
          </div>
          <p className={styles.itemMeta}>
            {[item.meta, item.timeLabel].filter(Boolean).join(" · ")}
          </p>
          {overdue && <p className={styles.overdueLabel}>Prazo vencido</p>}
        </div>
      </button>
    </article>
  );
}

export default function RoadTimeline() {
  const { selectProject } = useDashboardNav();
  const { setActiveTab } = useDashboardTab();
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [projects, setProjects] = useState([]);
  const [demands, setDemands] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const listRef = useRef(null);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const { start, end } = getWeekRange(new Date());
      const rangeQuery = buildIsoRangeQuery(start, end);

      const [projectsData, demandsData, eventsData] = await Promise.all([
        listProjects({ limit: 100 }),
        listDemands(),
        listEvents(rangeQuery),
      ]);

      setProjects(normalizeListResponse(projectsData));
      setDemands(normalizeListResponse(demandsData));
      setEvents(normalizeListResponse(eventsData));
    } catch {
      setProjects([]);
      setDemands([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimeline();
    window.addEventListener("myboard:workspace-refresh", loadTimeline);
    window.addEventListener("myboard:tenant-changed", loadTimeline);

    return () => {
      window.removeEventListener("myboard:workspace-refresh", loadTimeline);
      window.removeEventListener("myboard:tenant-changed", loadTimeline);
    };
  }, [loadTimeline]);

  const timelineItems = useMemo(
    () =>
      buildTimelineItems({
        events,
        projects,
        demands,
        dateKey: selectedDateKey,
        weekDays,
      }),
    [events, projects, demands, selectedDateKey, weekDays]
  );

  const hasCarousel = timelineItems.length > VISIBLE_COUNT;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedDateKey, timelineItems.length]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !hasCarousel || carouselPaused) return;

    const interval = window.setInterval(() => {
      const firstItem = listEl.querySelector("[data-timeline-item]");
      const step = firstItem?.getBoundingClientRect().height || 68;
      const maxScroll = listEl.scrollHeight - listEl.clientHeight;

      if (listEl.scrollTop >= maxScroll - 4) {
        listEl.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      listEl.scrollBy({ top: step, behavior: "smooth" });
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [hasCarousel, carouselPaused, timelineItems, selectedDateKey]);

  function handleItemClick(item) {
    if (item.type === TIMELINE_ITEM_TYPES.PROJECT) {
      selectProject(item.data);
      return;
    }

    if (item.type === TIMELINE_ITEM_TYPES.DEMAND) {
      if (item.data.project) selectProject(item.data.project);
      setActiveTab("demandas");
      return;
    }

    setActiveTab("agenda");
  }

  return (
    <section className={styles.card} data-tour="central-timeline">
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <h2 className={styles.title}>Timeline da semana</h2>
          <p className={styles.subtitle}>Reuniões, projetos e demandas do dia.</p>
        </div>
        {!loading && timelineItems.length > 0 && (
          <span className={styles.countBadge}>
            {Math.min(VISIBLE_COUNT, timelineItems.length)} de {timelineItems.length}
          </span>
        )}
      </div>

      <div className={styles.calendar}>
        {weekDays.map((day) => {
          const isPastDay = isPastDateKey(day.dateKey);
          return (
          <button
            key={day.dateKey}
            type="button"
            className={`${styles.day} ${selectedDateKey === day.dateKey ? styles.dayActive : ""} ${isPastDay && selectedDateKey !== day.dateKey ? styles.dayPast : ""}`}
            onClick={() => setSelectedDateKey(day.dateKey)}
            aria-pressed={selectedDateKey === day.dateKey}
            aria-label={`${day.label} ${day.day}`}
          >
            <span className={styles.dayLabel}>{day.label}</span>
            <span className={styles.dayNumber}>{day.day}</span>
          </button>
          );
        })}
      </div>

      <div
        className={`${styles.listViewport} ${!loading && timelineItems.length === 0 ? styles.listEmpty : ""} ${hasCarousel ? styles.listViewportCarousel : ""}`}
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        onFocus={() => setCarouselPaused(true)}
        onBlur={() => setCarouselPaused(false)}
      >
        {loading && (
          <div className={styles.loadingWrap}>
            <span className={styles.loadingBar} />
            <span className={styles.loadingBar} />
            <span className={styles.loadingBarShort} />
          </div>
        )}

        {!loading && timelineItems.length === 0 && <RoadTimelineEmpty />}

        {!loading && timelineItems.length > 0 && (
          <div ref={listRef} className={styles.listScroll}>
            {timelineItems.map((item, index) => (
              <TimelineItem
                key={item.id}
                item={item}
                selectedDateKey={selectedDateKey}
                isLast={index === timelineItems.length - 1}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
