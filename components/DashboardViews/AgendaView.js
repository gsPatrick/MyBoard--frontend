"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button/Button";
import AgendaCalendar, { getAgendaPeriodLabel } from "@/components/AgendaCalendar/AgendaCalendar";
import AgendaEventModal from "@/components/AgendaEventModal/AgendaEventModal";
import { listEvents, updateEvent } from "@/services/agenda";
import { listClients } from "@/services/clients";
import { listProjects } from "@/services/projects";
import {
  addMonths,
  addDays,
  buildIsoRangeQuery,
  formatDayLabel,
  getEventsForDay,
  getMonthRange,
  getWeekRange,
  getDefaultScheduleSlot,
  isPastDateKey,
  isPastHourSlot,
  getScheduleTimeLabel,
} from "@/lib/agendaDates";
import {
  AGENDA_EVENT_STATUSES,
  getEventAccentColor,
  getEventKindLabel,
} from "@/lib/agendaEventOptions";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";
import styles from "./AgendaView.module.css";

export default function AgendaView() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [view, setView] = useState("week");
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterClientId, setFilterClientId] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const periodLabel = useMemo(
    () => getAgendaPeriodLabel(view, referenceDate),
    [view, referenceDate]
  );

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const range = view === "month" ? getMonthRange(referenceDate) : getWeekRange(referenceDate);
      const query = {
        ...buildIsoRangeQuery(range.start, range.end),
        ...(filterClientId ? { client_id: filterClientId } : {}),
        ...(filterProjectId ? { project_id: filterProjectId } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      };
      const data = await listEvents(query);
      setEvents(normalizeListResponse(data));
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [referenceDate, view, filterClientId, filterProjectId, filterStatus]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        await ensureActiveTenant();
        const [clientsData, projectsData] = await Promise.all([
          listClients({ limit: 200 }),
          listProjects({ limit: 200 }),
        ]);
        setClients(normalizeListResponse(clientsData));
        setProjects(normalizeListResponse(projectsData));
      } catch {
        setClients([]);
        setProjects([]);
      }
    }

    loadFilterOptions();
  }, []);

  useEffect(() => {
    function handleRefresh() {
      loadEvents();
    }

    window.addEventListener("myboard:workspace-refresh", handleRefresh);
    window.addEventListener("myboard:tenant-changed", handleRefresh);
    return () => {
      window.removeEventListener("myboard:workspace-refresh", handleRefresh);
      window.removeEventListener("myboard:tenant-changed", handleRefresh);
    };
  }, [loadEvents]);

  const openCreateModal = useCallback((slot = null) => {
    setEditingEvent(null);

    if (slot?.dateKey && isPastDateKey(slot.dateKey)) {
      showErrorToast("Não é possível agendar em data passada");
      return;
    }

    if (slot?.dateKey && slot?.time) {
      const hour = Number.parseInt(slot.time.split(":")[0], 10);
      if (isPastHourSlot(slot.dateKey, hour)) {
        showErrorToast("Não é possível agendar em horário passado");
        return;
      }
    }

    const defaultSlot = slot || getDefaultScheduleSlot(new Date());
    setInitialSlot(defaultSlot);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      const action = event.detail?.action;
      if (action === "modal.newEvent") {
        openCreateModal();
      } else if (action === "agenda.today") {
        setReferenceDate(new Date());
      } else if (action === "agenda.toggleView") {
        setView((current) => (current === "week" ? "month" : "week"));
      }
    }

    window.addEventListener("myboard:shortcut", handleShortcut);
    return () => window.removeEventListener("myboard:shortcut", handleShortcut);
  }, [openCreateModal]);

  function shiftPeriod(direction) {
    setReferenceDate((current) =>
      view === "month" ? addMonths(current, direction) : addDays(current, direction * 7)
    );
  }

  function openEditModal(event) {
    setEditingEvent(event);
    setInitialSlot(null);
    setModalOpen(true);
  }

  async function handleEventReschedule(event, payload) {
    try {
      await ensureActiveTenant();
      await updateEvent(event.id, payload);
      showSuccessToast("Horário atualizado");
      loadEvents();
      window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
    } catch (err) {
      showErrorToast(err.message || "Não foi possível remarcar");
    }
  }

  const todayKey = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const todayEvents = useMemo(() => getEventsForDay(events, todayKey), [events, todayKey]);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>Reuniões, kickoffs e compromissos do workspace.</p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => openCreateModal()}>
            Novo evento
          </Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button variant="secondary" size="sm" onClick={() => setReferenceDate(new Date())}>
            Hoje
          </Button>
          <div className={styles.navButtons}>
            <button type="button" className={styles.navBtn} onClick={() => shiftPeriod(-1)} aria-label="Período anterior">
              ‹
            </button>
            <button type="button" className={styles.navBtn} onClick={() => shiftPeriod(1)} aria-label="Próximo período">
              ›
            </button>
          </div>
          <h2 className={styles.periodLabel}>{periodLabel}</h2>
          {loading && <span className={styles.loadingHint}>Atualizando...</span>}
        </div>

        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "week" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("week")}
          >
            Semana
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "month" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("month")}
          >
            Mês
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="agenda-filter-client">
            Cliente
          </label>
          <select
            id="agenda-filter-client"
            className={formStyles.select}
            value={filterClientId}
            onChange={(event) => setFilterClientId(event.target.value)}
          >
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="agenda-filter-project">
            Projeto
          </label>
          <select
            id="agenda-filter-project"
            className={formStyles.select}
            value={filterProjectId}
            onChange={(event) => setFilterProjectId(event.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="agenda-filter-status">
            Status
          </label>
          <select
            id="agenda-filter-status"
            className={formStyles.select}
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="">Todos</option>
            {AGENDA_EVENT_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={`${styles.sidebarCard} ${styles.sidebarCardToday}`}>
            <p className={styles.sidebarTitle}>Hoje</p>
            <p className={styles.sidebarDate}>{formatDayLabel(todayKey)}</p>
            <div className={styles.sidebarList}>
              {todayEvents.length === 0 && (
                <p className={styles.sidebarEmpty}>Nenhum evento hoje</p>
              )}
              {todayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={styles.sidebarItem}
                  style={{ borderLeftColor: getEventAccentColor(event) }}
                  onClick={() => openEditModal(event)}
                >
                  <span className={styles.sidebarItemTime}>
                    {getScheduleTimeLabel(event)}
                    {" · "}
                    {getEventKindLabel(event)}
                  </span>
                  <span className={styles.sidebarItemTitle}>{event.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sidebarCard} data-tour="agenda-onboarding-anchor">
            <p className={styles.sidebarTitle}>Dicas</p>
            <ul className={styles.tipsList}>
              <li>Clique em um horário para agendar.</li>
              <li>Arraste eventos na semana para remarcar.</li>
              <li>⌘⇧E novo evento · ⌘⌥T hoje · ⌘⌥V semana/mês.</li>
              <li>Atalhos personalizáveis em Configurações → Atalhos.</li>
            </ul>
          </div>
        </aside>

        <div className={styles.calendarArea}>
          <AgendaCalendar
            view={view}
            referenceDate={referenceDate}
            events={events}
            onSlotSelect={openCreateModal}
            onEventSelect={openEditModal}
            onEventReschedule={handleEventReschedule}
          />
        </div>
      </div>

      <AgendaEventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSlot={initialSlot}
        editingEvent={editingEvent}
        onSaved={() => {
          loadEvents();
          window.dispatchEvent(new CustomEvent("myboard:workspace-refresh"));
        }}
      />
    </div>
  );
}
