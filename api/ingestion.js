import { ENDPOINTS, buildApiUrl } from "./api";
import { getActiveTenantId, getToken } from "./client";

function authHeaders() {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = getActiveTenantId();
  if (tenantId) headers["X-Tenant-Id"] = tenantId;
  return headers;
}

async function postForm(path, formData) {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (response.status !== 204 && contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Falha na importação");
  }

  return payload?.data ?? payload;
}

function appendTarget(formData, target = {}) {
  if (target.projectId) formData.append("target_project_id", target.projectId);
  if (target.clientId) formData.append("target_client_id", target.clientId);
}

/** Envia arquivos para a IA analisar (não grava nada). Retorna { proposal, stats }. */
export async function analyzeUpload(files = [], target = {}) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  appendTarget(formData, target);
  return postForm(ENDPOINTS.ingestion.analyze, formData);
}

/** Confirma a proposta (possivelmente editada) e grava cliente/projeto/credenciais. */
export async function applyIngestion({ proposal, files = [], target = {} }) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  formData.append("proposal", JSON.stringify(proposal || {}));
  appendTarget(formData, target);
  return postForm(ENDPOINTS.ingestion.apply, formData);
}
