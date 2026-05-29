export const FINANCIAL_ENTRY_TYPES = [
  { id: "entrada", label: "Entrada" },
  { id: "adiantamento", label: "Adiantamento" },
  { id: "sprint", label: "Sprint" },
  { id: "parcela", label: "Parcela" },
  { id: "final", label: "Pagamento final" },
  { id: "outro", label: "Outro" },
];

export const FINANCIAL_ENTRY_LABELS = Object.fromEntries(
  FINANCIAL_ENTRY_TYPES.map((item) => [item.id, item.label])
);

export const FINANCIAL_ENTRY_COLORS = {
  entrada: "#22c55e",
  adiantamento: "#3b82f6",
  sprint: "#8b5cf6",
  parcela: "#f59e0b",
  final: "#10b981",
  outro: "#94a3b8",
};
