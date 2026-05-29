export const OPEN_PROJECT_STATUSES = ["draft", "in_progress", "paused"];

export function isOpenProject(project) {
  return OPEN_PROJECT_STATUSES.includes(project?.status);
}

export function computeProjectDashboardStats(projects = []) {
  const active = projects.filter((p) => p.status !== "cancelled" && p.is_active !== false);
  const completed = active.filter((p) => p.status === "completed");
  const open = active.filter(isOpenProject);

  const total = active.length;
  const completedCount = completed.length;
  const openCount = open.length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const totalToReceive = open.reduce((sum, project) => {
    const value = parseFloat(project.budget);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const clientMap = new Map();
  for (const project of open) {
    if (project.client && !clientMap.has(project.client.id)) {
      clientMap.set(project.client.id, project.client);
    }
  }

  return {
    progress,
    completedCount,
    total,
    openCount,
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
