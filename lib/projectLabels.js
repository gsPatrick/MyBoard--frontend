export const PROJECT_STATUS_LABELS = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  paused: "Pausado",
};

export const PROJECT_CHIP_STATUS = {
  draft: { chip: "pending", label: "Rascunho" },
  in_progress: { chip: "in-progress", label: "Em andamento" },
  completed: { chip: "complete", label: "Concluído" },
  paused: { chip: "approved", label: "Pausado" },
  cancelled: { chip: "rejected", label: "Cancelado" },
};
