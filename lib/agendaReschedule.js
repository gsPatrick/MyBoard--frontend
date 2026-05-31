import { APP_TIMEZONE, combineDateAndTime, getEventDurationMinutes, pad2 } from "./agendaDates";

export const AGENDA_FIRST_HOUR = 6;
export const AGENDA_LAST_HOUR = 22;
export const AGENDA_HOUR_HEIGHT = 56;
export const AGENDA_SNAP_MINUTES = 15;

export function minutesToTimeValue(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function snapScheduleMinutes(totalMinutes) {
  const minMinutes = AGENDA_FIRST_HOUR * 60;
  const maxMinutes = AGENDA_LAST_HOUR * 60;
  const snapped = Math.round(totalMinutes / AGENDA_SNAP_MINUTES) * AGENDA_SNAP_MINUTES;
  return Math.max(minMinutes, Math.min(maxMinutes - AGENDA_SNAP_MINUTES, snapped));
}

export function getMinutesFromColumnPointer(columnTop, clientY) {
  const offsetY = clientY - columnTop;
  const rawMinutes = (offsetY / AGENDA_HOUR_HEIGHT) * 60 + AGENDA_FIRST_HOUR * 60;
  return snapScheduleMinutes(rawMinutes);
}

export function buildReschedulePayload(event, dateKey, startMinutes) {
  const duration = getEventDurationMinutes(event);
  const startTime = minutesToTimeValue(startMinutes);
  const endMinutes = Math.min(startMinutes + duration, AGENDA_LAST_HOUR * 60);
  const endTime = minutesToTimeValue(endMinutes);

  return {
    starts_at: combineDateAndTime(dateKey, startTime),
    ends_at: combineDateAndTime(dateKey, endTime),
    timezone: event.timezone || APP_TIMEZONE,
    all_day: false,
  };
}
