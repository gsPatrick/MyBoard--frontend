import { getEventsForDay, getScheduleTimeLabel } from "./agendaDates";
import { getEventColorTag, getEventKindLabel } from "./agendaEventOptions";
import { getProjectsForDay } from "./roadTimelineDates";

export const TIMELINE_ITEM_TYPES = {
  EVENT: "event",
  PROJECT: "project",
  DEMAND: "demand",
};

const DEMAND_STATUS_LABELS = {
  pending: "Pendente",
  in_progress: "Em andamento",
};

export function getOpenDemandsForDay(demands, dayProjects) {
  const projectIds = new Set(dayProjects.map((project) => project.id));

  return demands.filter(
    (demand) =>
      projectIds.has(demand.project_id) &&
      demand.status !== "done" &&
      demand.status !== "cancelled"
  );
}

export function buildTimelineItems({ events, projects, demands, dateKey, weekDays }) {
  const dayProjects = getProjectsForDay(projects, dateKey, weekDays);
  const dayEvents = getEventsForDay(events, dateKey);
  const dayDemands = getOpenDemandsForDay(demands, dayProjects);

  const items = [
    ...dayEvents.map((event) => ({
      id: `event-${event.id}`,
      type: TIMELINE_ITEM_TYPES.EVENT,
      sortKey: event.starts_at_display?.timestamp || new Date(event.starts_at).getTime() || 0,
      title: event.title,
      meta: event.project?.name || event.client?.name || getEventKindLabel(event),
      timeLabel: getScheduleTimeLabel(event),
      eventKind: getEventKindLabel(event),
      colorTag: getEventColorTag(event),
      data: event,
    })),
    ...dayProjects.map((project) => ({
      id: `project-${project.id}`,
      type: TIMELINE_ITEM_TYPES.PROJECT,
      sortKey: 100000 + dayProjects.indexOf(project),
      title: project.name,
      meta: project.client?.name || "Projeto",
      timeLabel: "",
      data: project,
    })),
    ...dayDemands.map((demand, index) => ({
      id: `demand-${demand.id}`,
      type: TIMELINE_ITEM_TYPES.DEMAND,
      sortKey: 200000 + index,
      title: demand.title,
      meta: demand.project?.name || "Demanda",
      timeLabel: DEMAND_STATUS_LABELS[demand.status] || demand.status,
      data: demand,
    })),
  ];

  return items.sort((a, b) => a.sortKey - b.sortKey);
}
