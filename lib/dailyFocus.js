import { toDateKey, isProjectOverdue, getProjectDueDateKey } from "@/lib/roadTimelineDates";

export const DAILY_FOCUS_STORAGE_KEY = "myboard:daily-focus:last-shown";

const MOTIVATIONAL_PHRASES = [
  "Menos abas abertas. Mais entregas fechadas.",
  "Clareza hoje evita retrabalho amanhã.",
  "Um projeto de cada vez — com foco total.",
  "Execute o essencial antes do urgente barulhento.",
  "Seu dia começa sabendo exatamente o que mover.",
  "Progresso real é feito de pequenas entregas consistentes.",
  "Organização é o que transforma intenção em resultado.",
  "Feche o que está aberto. Avance o que importa.",
  "Disciplina hoje, tranquilidade amanhã.",
  "O workspace está pronto. Agora é mão na massa.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getDailyFocusCopy(userName) {
  const dayIndex = Math.floor(Date.now() / 86400000);
  const phrase = MOTIVATIONAL_PHRASES[dayIndex % MOTIVATIONAL_PHRASES.length];
  const firstName = userName?.trim()?.split(/\s+/)[0];
  const greeting = firstName ? `${getGreeting()}, ${firstName}` : getGreeting();

  return { greeting, phrase };
}

export function shouldShowDailyFocus() {
  if (typeof window === "undefined") return false;
  const lastShown = localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
  return lastShown !== toDateKey(new Date());
}

export function markDailyFocusShown() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, toDateKey(new Date()));
}

export function isFocusProject(project) {
  return (
    project?.status === "in_progress" &&
    project?.is_active !== false &&
    project?.is_hidden !== true
  );
}

function dueSortKey(project, todayKey) {
  const dueKey = getProjectDueDateKey(project);
  if (!dueKey) return "9999-99-99";
  if (isProjectOverdue(project, todayKey)) return `0000-${dueKey}`;
  return dueKey;
}

export function sortFocusProjects(projects) {
  const todayKey = toDateKey(new Date());

  return [...projects].sort((a, b) => {
    const aOverdue = isProjectOverdue(a, todayKey);
    const bOverdue = isProjectOverdue(b, todayKey);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    const aDue = dueSortKey(a, todayKey);
    const bDue = dueSortKey(b, todayKey);
    if (aDue !== bDue) return aDue.localeCompare(bDue);

    return (a.name || "").localeCompare(b.name || "", "pt-BR");
  });
}

export function formatFocusDueDate(project) {
  if (!project?.has_deadline || !project?.due_date) return "Sem prazo";

  const date = new Date(`${String(project.due_date).slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function isDueToday(project) {
  const dueKey = getProjectDueDateKey(project);
  if (!dueKey) return false;
  return dueKey === toDateKey(new Date());
}
