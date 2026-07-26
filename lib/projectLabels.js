export const PROJECT_STATUS_LABELS = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  paused: "Pausado",
  recurring: "Recorrente",
  maintenance: "Manutenção",
};

// Status selecionáveis manualmente no menu. "recurring"/"maintenance" ficam
// de fora: são definidos pelo tipo do projeto.
export const PROJECT_STATUS_OPTIONS = [
  "draft",
  "in_progress",
  "completed",
  "cancelled",
  "paused",
];

export const PROJECT_CHIP_STATUS = {
  draft: { chip: "pending", label: "Rascunho" },
  in_progress: { chip: "in-progress", label: "Em andamento" },
  completed: { chip: "complete", label: "Concluído" },
  paused: { chip: "approved", label: "Pausado" },
  cancelled: { chip: "rejected", label: "Cancelado" },
  recurring: { chip: "recurring", label: "Recorrente" },
  maintenance: { chip: "maintenance", label: "Manutenção" },
};

// Tipos de projeto oferecidos no dropdown de criação/edição.
// Recorrente e Manutenção usam o mesmo motor de recorrência (recurring: true).
export const PROJECT_TYPES = [
  { id: "common", label: "Comum", status: "in_progress", recurring: false },
  { id: "recurring", label: "Recorrente", status: "recurring", recurring: true },
  { id: "maintenance", label: "Manutenção", status: "maintenance", recurring: true },
];

export function getProjectType(project) {
  if (project?.status === "maintenance") return "maintenance";
  if (project?.is_recurring || project?.status === "recurring") return "recurring";
  return "common";
}
