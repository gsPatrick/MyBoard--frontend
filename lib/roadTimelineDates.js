const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const FINALIZED_PROJECT_STATUSES = ["completed", "cancelled"];

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function getWeekDays(referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  start.setDate(ref.getDate() - ref.getDay());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return WEEK_LABELS.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      label,
      day: date.getDate(),
      dateKey: toDateKey(date),
      date,
      isToday: isSameDay(date, today),
    };
  });
}

/** Converte ISO ou DATEONLY para YYYY-MM-DD no fuso local do usuário. */
export function toDateKeyFromValue(value) {
  if (value == null || value === "") return null;

  if (typeof value === "string") {
    const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch && value.length <= 10) {
      return dateOnlyMatch[1];
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return toDateKey(date);
}

export function isProjectFinalized(project) {
  return FINALIZED_PROJECT_STATUSES.includes(project?.status);
}

/** Primeiro dia em que o projeto existe na timeline (data de início). */
export function getProjectStartDateKey(project) {
  const fromStart = toDateKeyFromValue(project?.start_date);
  if (fromStart) return fromStart;

  const fromCreated = toDateKeyFromValue(
    project?.created_at ?? project?.createdAt ?? project?.created_at_display
  );
  if (fromCreated) return fromCreated;

  return toDateKey(new Date());
}

export function getProjectDueDateKey(project) {
  if (!project?.has_deadline || !project?.due_date) return null;
  return toDateKeyFromValue(project.due_date);
}

export function isProjectActiveInTimeline(project) {
  if (isProjectFinalized(project)) return false;
  if (project?.is_active === false || project?.is_hidden === true) return false;
  return true;
}

/** Projeto passou do prazo e ainda não foi finalizado. */
export function isProjectOverdue(project, dateKey) {
  if (!isProjectActiveInTimeline(project)) return false;

  const dueKey = getProjectDueDateKey(project);
  if (!dueKey || !dateKey) return false;

  return dateKey > dueKey;
}

/** Projetos que podem aparecer em algum dia da semana atual. */
export function getTimelineProjectsForWeek(projects, weekDays) {
  if (!weekDays?.length) return [];

  const firstDay = weekDays[0].dateKey;
  const lastDay = weekDays[weekDays.length - 1].dateKey;

  return projects.filter((project) => {
    if (!isProjectActiveInTimeline(project)) return false;

    const startKey = getProjectStartDateKey(project);
    if (startKey > lastDay) return false;

    const dueKey = getProjectDueDateKey(project);

    // Sem prazo: visível em qualquer dia da semana a partir do início
    if (!dueKey) return true;

    // Com prazo: do início até o prazo; se atrasado, segue na semana após o prazo
    if (dueKey >= firstDay) return true;
    return dueKey < lastDay;
  });
}

/**
 * Projetos visíveis no dia selecionado:
 * - A partir da data de início
 * - Sem prazo: todos os dias até finalizar
 * - Com prazo: do início até o prazo; após o prazo continua se não finalizou (borda vermelha)
 */
export function getProjectsForDay(projects, dateKey, weekDays = []) {
  const pool = weekDays.length
    ? getTimelineProjectsForWeek(projects, weekDays)
    : projects.filter(isProjectActiveInTimeline);

  return pool.filter((project) => {
    const startKey = getProjectStartDateKey(project);
    if (dateKey < startKey) return false;

    const dueKey = getProjectDueDateKey(project);

    if (!dueKey) {
      return true;
    }

    if (dateKey <= dueKey) {
      return true;
    }

    return isProjectOverdue(project, dateKey);
  });
}
