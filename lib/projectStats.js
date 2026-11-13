export const OPEN_PROJECT_STATUSES = [
  "draft",
  "in_progress",
  "paused",
  "recurring",
  "maintenance",
  "job",
];

// Status em que a recorrência gera recebimento (igual à API).
export const RECURRING_BILLING_STATUSES = ["recurring", "maintenance", "job"];

export function isOpenProject(project) {
  return OPEN_PROJECT_STATUSES.includes(project?.status);
}

export function isRecurringProject(project) {
  return (
    Boolean(project?.is_recurring) ||
    project?.status === "recurring" ||
    project?.status === "maintenance" ||
    project?.status === "job"
  );
}

function toAmount(value) {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

const toTime = (value) => (value ? new Date(value).getTime() : null);

/**
 * Ciclo de projetos do card do dashboard.
 *
 * O lote atual = projetos em aberto + os concluídos desde o último "fechamento".
 * Um fechamento acontece no instante em que todos os projetos existentes ficam
 * concluídos; aí o lote zera (0 / 0) e recomeça com os próximos projetos.
 * Calculado só com created_at/completed_at — igual em qualquer dispositivo.
 */
export function computeProjectCycle(regular = []) {
  const completedTimes = regular
    .filter((p) => p.status === "completed" && p.completed_at)
    .map((p) => toTime(p.completed_at));

  let lastClose = null;
  for (const moment of completedTimes) {
    if (lastClose !== null && moment <= lastClose) continue;
    const everythingDone = regular.every((r) => {
      const created = toTime(r.created_at);
      if (created !== null && created > moment) return true; // ainda não existia
      return r.status === "completed" && r.completed_at && toTime(r.completed_at) <= moment;
    });
    if (everythingDone) lastClose = moment;
  }

  // Concluídos sem data (legado) contam como já fechados.
  return regular.filter((p) => {
    if (p.status !== "completed") return true;
    if (!p.completed_at) return false;
    return lastClose === null || toTime(p.completed_at) > lastClose;
  });
}

function isCompletedThisMonth(project, now = new Date()) {
  if (project.status !== "completed" || !project.completed_at) return false;
  const done = new Date(project.completed_at);
  return done.getFullYear() === now.getFullYear() && done.getMonth() === now.getMonth();
}

/**
 * @param projects lista de projetos do tenant
 * @param receivedByProjectId { [projectId]: total já recebido } — desconta do orçamento
 */
export function computeProjectDashboardStats(projects = [], receivedByProjectId = {}) {
  const active = projects.filter((p) => p.status !== "cancelled" && p.is_active !== false);

  // Projetos recorrentes ficam fora das contas de finalização/progresso
  // (são trabalho contínuo, nunca "finalizam"), mas contam no "a receber".
  const recurring = active.filter(isRecurringProject);
  const regular = active.filter((p) => !isRecurringProject(p));

  const completed = regular.filter((p) => p.status === "completed");
  const open = regular.filter(isOpenProject);

  // "Status" e "Projetos finalizados" olham só o lote atual (zera ao fechar).
  const batch = computeProjectCycle(regular);
  const total = batch.length;
  const completedCount = batch.filter((p) => p.status === "completed").length;
  const openCount = open.length;
  const recurringCount = recurring.length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const completedThisMonth = completed.filter((p) => isCompletedThisMonth(p)).length;
  const completedAllCount = completed.length;

  // A receber = saldo (orçamento − já recebido) dos projetos em aberto E dos
  // concluídos que ainda não foram totalmente pagos (entregou, falta receber).
  // Rascunhos ficam de fora: ainda são proposta, não dinheiro garantido.
  const remainingOf = (project) =>
    Math.max(0, toAmount(project.budget) - toAmount(receivedByProjectId[project.id]));

  const pendingFromProjects = [...open, ...completed]
    .filter((project) => project.status !== "draft")
    .reduce((sum, project) => sum + remainingOf(project), 0);

  // Recorrentes (inclui Trabalho) entram com o valor do próximo ciclo — só se
  // ainda geram recebimento (não pausado/concluído, nem com recorrência encerrada).
  const pendingRecurring = recurring
    .filter(
      (project) =>
        RECURRING_BILLING_STATUSES.includes(project.status) && project.recurrence_next_run
    )
    .reduce((sum, project) => sum + toAmount(project.recurrence_amount), 0);

  const totalToReceive = pendingFromProjects + pendingRecurring;

  const clientMap = new Map();
  for (const project of [...open, ...recurring]) {
    if (project.client && !clientMap.has(project.client.id)) {
      clientMap.set(project.client.id, project.client);
    }
  }

  return {
    progress,
    completedCount,
    total,
    openCount,
    recurringCount,
    completedThisMonth,
    completedAllCount,
    totalToReceive,
    pendingFromProjects,
    clients: Array.from(clientMap.values()),
  };
}

export function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}
