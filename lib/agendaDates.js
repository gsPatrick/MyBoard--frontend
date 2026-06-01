import { toDateKey, toDateKeyFromValue } from "./roadTimelineDates";

export const APP_TIMEZONE = "America/Sao_Paulo";

export const AGENDA_SCHEDULE_MODES = [
  {
    id: "all_day",
    label: "Dia inteiro",
    description: "Ocupa o dia todo no calendário.",
  },
  {
    id: "no_deadline",
    label: "Sem prazo",
    description: "Só a data, sem horário fixo.",
  },
  {
    id: "timed",
    label: "Horário",
    description: "Com início e fim definidos.",
  },
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function startOfWeek(date = new Date()) {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getWeekRange(referenceDate = new Date()) {
  const start = startOfWeek(referenceDate);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getTimelineRange(referenceDate = new Date(), totalDays = 14) {
  const start = startOfWeek(referenceDate);
  const end = addDays(start, Math.max(0, totalDays - 1));
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getMonthRange(referenceDate = new Date()) {
  return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
}

export function formatMonthYear(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekRange(referenceDate = new Date()) {
  const { start, end } = getWeekRange(referenceDate);
  const startLabel = `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)}`;
  const endLabel = `${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)}`;
  return `${startLabel} – ${endLabel}`;
}

export function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatTimeLabel(value) {
  if (!value) return "";

  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getEventDateKey(event) {
  return (
    toDateKeyFromValue(event?.starts_at_display?.local) ||
    toDateKeyFromValue(event?.starts_at) ||
    null
  );
}

export function getEventMinutes(event) {
  const source = event?.starts_at_display?.local || event?.starts_at;
  if (!source) return 0;

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return 0;

  return date.getHours() * 60 + date.getMinutes();
}

export function getEventDurationMinutes(event) {
  const startSource = event?.starts_at_display?.local || event?.starts_at;
  const endSource = event?.ends_at_display?.local || event?.ends_at;

  if (!startSource || !endSource) return 60;

  const start = new Date(startSource);
  const end = new Date(endSource);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 60;

  return Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function getEventsForDay(events, dateKey) {
  return events.filter((event) => getEventDateKey(event) === dateKey);
}

export function buildMonthGrid(referenceDate = new Date()) {
  const monthStart = startOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart);
  const todayKey = toDateKey(new Date());
  const currentMonth = referenceDate.getMonth();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      dateKey: toDateKey(date),
      day: date.getDate(),
      isToday: toDateKey(date) === todayKey,
      isCurrentMonth: date.getMonth() === currentMonth,
    };
  });
}

export function buildWeekDays(referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate);
  const todayKey = toDateKey(new Date());
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return labels.map((label, index) => {
    const date = addDays(weekStart, index);
    return {
      label,
      day: date.getDate(),
      dateKey: toDateKey(date),
      date,
      isToday: toDateKey(date) === todayKey,
    };
  });
}

export function toDateTimeLocalValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toTimeInputValue(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return `${dateValue}T${timeValue}:00`;
}

export function buildIsoRangeQuery(startDate, endDate) {
  const from = `${toDateKey(startDate)}T00:00:00`;
  const to = `${toDateKey(endDate)}T23:59:59`;
  return { from, to, timezone: APP_TIMEZONE };
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function isPastDateKey(dateKey) {
  if (!dateKey) return false;
  return dateKey < getTodayDateKey();
}

export function isTodayDateKey(dateKey) {
  if (!dateKey) return false;
  return dateKey === getTodayDateKey();
}

export function getMinScheduleDateInput() {
  return getTodayDateKey();
}

export function parseScheduleDateTime(dateValue, timeValue, allDay = false) {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  if (allDay) {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  if (!timeValue) return null;

  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isScheduleInPast(dateValue, timeValue, allDay = false) {
  const scheduled = parseScheduleDateTime(dateValue, timeValue, allDay);
  if (!scheduled) return false;

  if (allDay) {
    return isPastDateKey(dateValue);
  }

  return scheduled.getTime() < Date.now();
}

export function isPastHourSlot(dateKey, hour) {
  if (isPastDateKey(dateKey)) return true;
  if (!isTodayDateKey(dateKey)) return false;

  const now = new Date();
  const slotMinutes = hour * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes <= nowMinutes;
}

export function getMinTimeInputForDate(dateValue) {
  if (!isTodayDateKey(dateValue)) return undefined;
  return toTimeInputValue(new Date());
}

export function roundUpScheduleTime(date = new Date()) {
  const next = new Date(date);
  next.setSeconds(0, 0);

  if (next.getMinutes() > 0) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  }

  return toTimeInputValue(next);
}

export function getDefaultScheduleSlot(referenceDate = new Date()) {
  const now = new Date();
  const todayKey = getTodayDateKey();
  const referenceKey = toDateKey(referenceDate);

  if (referenceKey <= todayKey) {
    return {
      date: now,
      dateKey: todayKey,
      time: roundUpScheduleTime(now),
    };
  }

  return {
    date: referenceDate,
    dateKey: referenceKey,
    time: "09:00",
  };
}

export function inferScheduleModeFromEvent(event) {
  const stored = event?.metadata?.schedule_mode;
  if (stored && AGENDA_SCHEDULE_MODES.some((item) => item.id === stored)) return stored;
  if (event?.all_day && !event?.ends_at) return "no_deadline";
  if (event?.all_day) return "all_day";
  return "timed";
}

export function getScheduleTimeLabel(event) {
  const mode = inferScheduleModeFromEvent(event);
  if (mode === "all_day") return "Dia inteiro";
  if (mode === "no_deadline") return "Sem prazo";
  return formatTimeLabel(event?.starts_at_display?.local || event?.starts_at);
}

export function isAllDaySlotEvent(event) {
  const mode = inferScheduleModeFromEvent(event);
  return mode === "all_day" || mode === "no_deadline";
}

export function hasScheduleDateTimeChanged(form, editingEvent) {
  if (!editingEvent) return true;

  const startSource = editingEvent.starts_at_display?.local || editingEvent.starts_at;
  const endSource = editingEvent.ends_at_display?.local || editingEvent.ends_at;
  const startDate = startSource ? new Date(startSource) : new Date();
  const endDate = endSource ? new Date(endSource) : null;
  const originalMode = inferScheduleModeFromEvent(editingEvent);

  if (form.scheduleMode !== originalMode) return true;
  if (form.date !== toDateInputValue(startDate)) return true;

  if (form.scheduleMode === "timed") {
    return (
      form.startTime !== toTimeInputValue(startDate) ||
      form.endTime !== (endDate ? toTimeInputValue(endDate) : "")
    );
  }

  return false;
}
