"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AGENDA_FIRST_HOUR,
  AGENDA_HOUR_HEIGHT,
  AGENDA_SNAP_MINUTES,
  buildReschedulePayload,
  getMinutesFromColumnPointer,
} from "@/lib/agendaReschedule";
import {
  buildMonthGrid,
  buildWeekDays,
  formatMonthYear,
  formatWeekRange,
  getEventDurationMinutes,
  getEventMinutes,
  getEventsForDay,
  getScheduleTimeLabel,
  isAllDaySlotEvent,
  isPastDateKey,
  isPastHourSlot,
} from "@/lib/agendaDates";
import {
  canDragEvent,
  getEventAccentColor,
  getEventKindLabel,
  getEventStatusLabel,
  isEventInactive,
} from "@/lib/agendaEventOptions";
import styles from "./AgendaCalendar.module.css";

const HOURS = Array.from({ length: 17 }, (_, index) => index + AGENDA_FIRST_HOUR);
const DRAG_THRESHOLD_PX = 6;

function EventChip({ event, onSelect, compact = false, draggable = false }) {
  const timeLabel = getScheduleTimeLabel(event);
  const accentColor = getEventAccentColor(event);
  const kindLabel = getEventKindLabel(event);
  const statusLabel = getEventStatusLabel(event);
  const inactive = isEventInactive(event);

  return (
    <div
      className={`${styles.eventChip} ${compact ? styles.eventChipCompact : ""} ${
        inactive ? styles.eventChipInactive : ""
      } ${draggable ? styles.eventChipDraggable : ""}`}
      style={{
        borderLeftColor: accentColor,
        background: `color-mix(in srgb, ${accentColor} 14%, var(--background-1))`,
      }}
      title={event.title}
    >
      {!compact && (
        <span className={styles.eventTime}>
          {timeLabel}
          {inactive ? ` · ${statusLabel}` : ""}
        </span>
      )}
      <span className={styles.eventTitle}>{event.title}</span>
      <span className={styles.eventMeta}>
        {[kindLabel, event.project?.name || event.client?.name].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}

function TimedEventBlock({ event, day, onSelect, onReschedule }) {
  const blockRef = useRef(null);
  const dragState = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);

  const baseTop = ((getEventMinutes(event) - AGENDA_FIRST_HOUR * 60) / 60) * AGENDA_HOUR_HEIGHT;
  const height = Math.max(28, (getEventDurationMinutes(event) / 60) * AGENDA_HOUR_HEIGHT);
  const draggable = canDragEvent(event);

  const finishDrag = useCallback(
    async (state, clientX, clientY) => {
      const column = document.elementFromPoint(clientX, clientY)?.closest("[data-day-key]");
      const dateKey = column?.getAttribute("data-day-key") || state.dateKey;

      if (isPastDateKey(dateKey)) return;

      const columnRect = column?.getBoundingClientRect();
      if (!columnRect) return;

      const startMinutes = getMinutesFromColumnPointer(columnRect.top, clientY);
      const hour = Math.floor(startMinutes / 60);

      if (isPastHourSlot(dateKey, hour)) return;

      if (
        dateKey === state.dateKey &&
        Math.abs(startMinutes - state.startMinutes) < AGENDA_SNAP_MINUTES
      ) {
        return;
      }

      const payload = buildReschedulePayload(event, dateKey, startMinutes);
      await onReschedule?.(event, payload);
    },
    [event, onReschedule]
  );

  function handlePointerDown(pointerEvent) {
    if (!draggable || pointerEvent.button !== 0) return;

    pointerEvent.stopPropagation();
    pointerEvent.preventDefault();

    dragState.current = {
      pointerId: pointerEvent.pointerId,
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      dateKey: day.dateKey,
      startMinutes: getEventMinutes(event),
      moved: false,
    };

    blockRef.current?.setPointerCapture(pointerEvent.pointerId);
  }

  function handlePointerMove(pointerEvent) {
    const state = dragState.current;
    if (!state || state.pointerId !== pointerEvent.pointerId) return;

    const deltaY = pointerEvent.clientY - state.startY;
    const deltaX = pointerEvent.clientX - state.startX;

    if (!state.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;

    state.moved = true;

    const column = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest("[data-day-key]");
    const columnRect = column?.getBoundingClientRect();

    if (!columnRect) return;

    const previewMinutes = getMinutesFromColumnPointer(columnRect.top, pointerEvent.clientY);
    const previewTop = ((previewMinutes - AGENDA_FIRST_HOUR * 60) / 60) * AGENDA_HOUR_HEIGHT;

    setDragPreview({
      top: previewTop,
      dateKey: column?.getAttribute("data-day-key") || state.dateKey,
    });
  }

  async function handlePointerUp(pointerEvent) {
    const state = dragState.current;
    if (!state || state.pointerId !== pointerEvent.pointerId) return;

    blockRef.current?.releasePointerCapture(pointerEvent.pointerId);

    if (state.moved) {
      await finishDrag(state, pointerEvent.clientX, pointerEvent.clientY);
    } else {
      onSelect?.(event);
    }

    dragState.current = null;
    setDragPreview(null);
  }

  function handlePointerCancel(pointerEvent) {
    if (dragState.current?.pointerId !== pointerEvent.pointerId) return;
    dragState.current = null;
    setDragPreview(null);
  }

  const displayTop = dragPreview?.top ?? baseTop;
  const isDragging = dragPreview != null;

  return (
    <div
      ref={blockRef}
      className={`${styles.timedEventWrap} ${isDragging ? styles.timedEventDragging : ""}`}
      style={{ top: displayTop, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <EventChip event={event} compact={height < 40} draggable={draggable} />
    </div>
  );
}

export default function AgendaCalendar({
  view = "week",
  referenceDate,
  events = [],
  onSlotSelect,
  onEventSelect,
  onEventReschedule,
}) {
  const weekDays = useMemo(() => buildWeekDays(referenceDate), [referenceDate]);
  const monthGrid = useMemo(() => buildMonthGrid(referenceDate), [referenceDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map();

    weekDays.forEach((day) => {
      const dayEvents = getEventsForDay(events, day.dateKey);
      map.set(day.dateKey, {
        allDay: dayEvents.filter((event) => isAllDaySlotEvent(event)),
        timed: dayEvents.filter((event) => !isAllDaySlotEvent(event)),
      });
    });

    return map;
  }, [events, weekDays]);

  if (view === "month") {
    return (
      <div className={styles.monthView}>
        <div className={styles.monthWeekdays}>
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
            <span key={label} className={styles.monthWeekday}>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.monthGrid}>
          {monthGrid.map((cell) => {
            const dayEvents = getEventsForDay(events, cell.dateKey);
            const isPastDay = isPastDateKey(cell.dateKey);

            return (
              <button
                key={cell.dateKey}
                type="button"
                disabled={isPastDay}
                className={`${styles.monthCell} ${cell.isCurrentMonth ? "" : styles.monthCellMuted} ${cell.isToday ? styles.monthCellToday : ""} ${isPastDay ? styles.monthCellPast : ""}`}
                onClick={() => {
                  if (isPastDay) return;
                  onSlotSelect?.({
                    date: cell.date,
                    dateKey: cell.dateKey,
                    time: "09:00",
                  });
                }}
              >
                <span className={styles.monthDayNumber}>{cell.day}</span>
                <div className={styles.monthEvents}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={styles.monthEventBtn}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onEventSelect?.(event);
                      }}
                    >
                      <EventChip event={event} compact />
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={styles.monthMore}>+{dayEvents.length - 3} mais</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.weekView}>
      <div className={styles.weekHeader}>
        <div className={styles.timeGutter} />
        {weekDays.map((day) => (
          <div
            key={day.dateKey}
            className={`${styles.weekDayHeader} ${day.isToday ? styles.weekDayHeaderToday : ""}`}
          >
            <span className={styles.weekDayLabel}>{day.label}</span>
            <span className={styles.weekDayNumber}>{day.day}</span>
          </div>
        ))}
      </div>

      <div className={styles.allDayRow}>
        <div className={styles.allDayLabel}>Dia inteiro</div>
        {weekDays.map((day) => (
          <div
            key={`all-${day.dateKey}`}
            data-day-key={day.dateKey}
            className={`${styles.allDayCell} ${day.isToday ? styles.allDayCellToday : ""}`}
          >
            {eventsByDay.get(day.dateKey)?.allDay.map((event) => (
              <button
                key={event.id}
                type="button"
                className={styles.allDayEventBtn}
                onClick={() => onEventSelect?.(event)}
              >
                <EventChip event={event} compact />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.weekBody}>
        <div className={styles.timeColumn}>
          {HOURS.map((hour) => (
            <div key={hour} className={styles.timeLabel} style={{ height: AGENDA_HOUR_HEIGHT }}>
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className={styles.weekGrid}>
          {weekDays.map((day) => (
            <div key={day.dateKey} data-day-key={day.dateKey} className={styles.dayColumn}>
              {HOURS.map((hour) => {
                const isPastSlot = isPastHourSlot(day.dateKey, hour);

                return (
                  <button
                    key={`${day.dateKey}-${hour}`}
                    type="button"
                    disabled={isPastSlot}
                    className={`${styles.hourSlot} ${isPastSlot ? styles.hourSlotPast : ""}`}
                    style={{ height: AGENDA_HOUR_HEIGHT }}
                    aria-label={`Agendar ${day.label} ${hour}:00`}
                    onClick={() => {
                      if (isPastSlot) return;
                      onSlotSelect?.({
                        date: day.date,
                        dateKey: day.dateKey,
                        time: `${String(hour).padStart(2, "0")}:00`,
                      });
                    }}
                  />
                );
              })}

              {eventsByDay.get(day.dateKey)?.timed.map((event) => (
                <TimedEventBlock
                  key={event.id}
                  event={event}
                  day={day}
                  onSelect={onEventSelect}
                  onReschedule={onEventReschedule}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getAgendaPeriodLabel(view, referenceDate) {
  return view === "month" ? formatMonthYear(referenceDate) : formatWeekRange(referenceDate);
}
