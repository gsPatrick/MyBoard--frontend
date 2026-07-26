export const PROJECT_STATUS_LABELS = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  paused: "Pausado",
  recurring: "Recorrente",
};

// Status selecionáveis manualmente no menu. "recurring" fica de fora:
// ele é definido automaticamente ao ativar a recorrência do projeto.
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
};
