export const CLIENT_STATUS_LABELS = {
  active: "Ativo",
  inactive: "Inativo",
};

export const CLIENT_CHIP_STATUS = {
  active: { chip: "complete", label: "Ativo" },
  inactive: { chip: "rejected", label: "Inativo" },
};

export const IMPORTANCE_LEVELS = [
  { id: "normal", label: "Normal" },
  { id: "important", label: "Importante" },
  { id: "high", label: "Alta" },
  { id: "critical", label: "Crítica" },
  { id: "vip", label: "VIP" },
];

export const IMPORTANCE_LABELS = Object.fromEntries(
  IMPORTANCE_LEVELS.map((item) => [item.id, item.label])
);
