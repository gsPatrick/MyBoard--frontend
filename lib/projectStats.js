export const OPEN_PROJECT_STATUSES = [
  "draft",
  "in_progress",
  "paused",
  "recurring",
  "maintenance",
];

export function isOpenProject(project) {
  return OPEN_PROJECT_STATUSES.includes(project?.status);
}

export function isRecurringProject(project) {
  return (
    Boolean(project?.is_recurring) ||
    project?.status === "recurring" ||
    project?.status === "maintenance"
  );
}

function toAmount(value) {
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
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

  const total = regular.length;
  const completedCount = completed.length;
  const openCount = open.length;
  const recurringCount = recurring.length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // A receber = saldo (orçamento − já recebido) dos projetos em aberto E dos
  // concluídos que ainda não foram totalmente pagos (entregou, falta receber).
  // Rascunhos ficam de fora: ainda são proposta, não dinheiro garantido.
  const remainingOf = (project) =>
    Math.max(0, toAmount(project.budget) - toAmount(receivedByProjectId[project.id]));

  const pendingFromProjects = [...open, ...completed]
    .filter((project) => project.status !== "draft")
    .reduce((sum, project) => sum + remainingOf(project), 0);

  // Recorrentes entram com o valor da próxima mensalidade.
  const pendingRecurring = recurring.reduce(
    (sum, project) => sum + toAmount(project.recurrence_amount),
    0
  );

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
