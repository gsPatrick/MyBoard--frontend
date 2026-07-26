export const OPEN_PROJECT_STATUSES = ["draft", "in_progress", "paused", "recurring"];

export function isOpenProject(project) {
  return OPEN_PROJECT_STATUSES.includes(project?.status);
}

export function isRecurringProject(project) {
  return Boolean(project?.is_recurring) || project?.status === "recurring";
}

export function computeProjectDashboardStats(projects = []) {
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

  const totalToReceive =
    open.reduce((sum, project) => {
      const value = parseFloat(project.budget);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0) +
    recurring.reduce((sum, project) => {
      const value = parseFloat(project.recurrence_amount);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

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
    clients: Array.from(clientMap.values()),
  };
}

export function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}
