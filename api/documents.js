import { buildApiUrl } from "./api";
import { apiDelete, apiGet, getActiveTenantId, getToken } from "./client";

const BASE = "/v1/documents";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listDocuments(params) {
  return apiGet(`${BASE}${withQuery(params)}`);
}

export function deleteDocument(id) {
  return apiDelete(`${BASE}/${id}`);
}

export async function uploadDocument({ file, title, category, purpose, language }) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  if (category) formData.append("category", category);
  if (purpose) formData.append("purpose", purpose);
  if (language) formData.append("language", language);

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = getActiveTenantId();
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const response = await fetch(buildApiUrl(BASE), {
    method: "POST",
    headers,
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Falha no upload");
  }
  return payload.data;
}
