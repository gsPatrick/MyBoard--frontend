import { ENDPOINTS, buildApiUrl } from "./api";
import { apiDelete, apiGet, getActiveTenantId, getToken } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listMedia(entityType, entityId, params) {
  return apiGet(`${ENDPOINTS.media}/entity/${entityType}/${entityId}${withQuery(params)}`);
}

export function listClientLibrary(clientId, params) {
  return apiGet(`${ENDPOINTS.media}/client/${clientId}/library${withQuery(params)}`);
}

export function getMedia(id) {
  return apiGet(`${ENDPOINTS.media}/${id}`);
}

export function deleteMedia(id) {
  return apiDelete(`${ENDPOINTS.media}/${id}`);
}

export function getMediaDownloadUrl(id) {
  return buildApiUrl(`${ENDPOINTS.media}/${id}/download`);
}

export async function uploadMedia({ file, entityType, entityId, kind = "attachment", category }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entity_type", entityType);
  formData.append("entity_id", entityId);
  formData.append("kind", kind);
  if (category) formData.append("category", category);

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const tenantId = getActiveTenantId();
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const response = await fetch(buildApiUrl(`${ENDPOINTS.media}/upload`), {
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

/** URL autenticada para iframe/embed (revogar com URL.revokeObjectURL). */
export async function fetchMediaBlobUrl(mediaId) {
  const token = getToken();
  const headers = { Accept: "application/pdf,*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const tenantId = getActiveTenantId();
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const response = await fetch(getMediaDownloadUrl(mediaId), { headers });
  if (!response.ok) {
    throw new Error("Não foi possível carregar o arquivo");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
