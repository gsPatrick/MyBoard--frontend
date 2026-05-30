export const DEMAND_KANBAN_COLUMNS = [
  { id: "pending", label: "Pendente", accent: "var(--secondary-blue)" },
  { id: "in_progress", label: "Em andamento", accent: "var(--secondary-purple)" },
  { id: "done", label: "Concluída", accent: "var(--secondary-green)" },
  { id: "cancelled", label: "Cancelada", accent: "var(--secondary-red)" },
];

export const DEMAND_DND_MIME = "application/x-myboard-demand";

export function buildDemandDragPayload(demand) {
  return JSON.stringify({
    id: demand.id,
    projectId: demand.project_id,
    status: demand.status,
  });
}

export function parseDemandDragPayload(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
