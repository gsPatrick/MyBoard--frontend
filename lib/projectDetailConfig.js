export const SCOPE_DETAIL_KEY = "project_scope";
export const CONTRACT_DETAIL_KEY = "project_contract";

export const CREDENTIAL_KINDS = [
  { id: "vps", label: "VPS / Servidor" },
  { id: "ftp", label: "FTP / SFTP" },
  { id: "email", label: "E-mail / Conta" },
  { id: "database", label: "Banco de dados" },
  { id: "api", label: "API / Token" },
  { id: "hosting", label: "Hospedagem / Painel" },
  { id: "other", label: "Outro" },
];

export const GITHUB_ROLES = [
  { id: "backend", label: "Backend" },
  { id: "frontend", label: "Frontend" },
  { id: "mobile", label: "Mobile" },
  { id: "docs", label: "Documentação" },
  { id: "infra", label: "Infra / DevOps" },
  { id: "other", label: "Outro" },
];

export const DEMAND_STATUS_LABELS = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
  cancelled: "Cancelada",
};

export const PROJECT_PRIORITIES = [
  { id: "low", label: "Baixa" },
  { id: "medium", label: "Média" },
  { id: "high", label: "Alta" },
  { id: "critical", label: "Crítica" },
];

export function parseCredentialDetail(detail) {
  const json = detail?.value_json || detail?.value || {};
  const meta = detail?.metadata || {};
  return {
    id: detail.id,
    label: detail.label,
    kind: meta.kind || json.kind || "other",
    host: json.host || json.url || "",
    username: json.username || json.email || "",
    port: json.port || "",
    notes: json.notes || "",
    hasSecret: Boolean(detail.is_secret),
    passwordMasked: detail.is_secret ? detail.value || "********" : "",
  };
}

export function parseGithubDetail(detail) {
  const json = detail?.value_json || detail?.value || {};
  const meta = detail?.metadata || {};
  return {
    id: detail.id,
    label: detail.label,
    role: meta.role || json.role || "other",
    url: json.url || json.repo_url || "",
    branch: json.branch || json.defaultBranch || "main",
    notes: json.notes || "",
  };
}

export function groupDetailsByCategory(details = []) {
  return details.reduce((acc, detail) => {
    const category = detail.category || "custom";
    if (!acc[category]) acc[category] = [];
    acc[category].push(detail);
    return acc;
  }, {});
}

export function findDetailByKey(details, key) {
  return (details || []).find((item) => item.key === key) || null;
}
