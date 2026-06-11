import { buildApiUrl } from "./api";
import { apiClient, getActiveTenantId, getToken } from "./client";

const WA = "/v1/whatsapp";

/* ---------- Importação de conversa exportada (.zip/.txt) ---------- */
export function getClientImportMode(clientId) {
  return apiClient(`${WA}/clients/${clientId}/import`);
}
export function getProjectImportMode(projectId) {
  return apiClient(`${WA}/projects/${projectId}/import`);
}
export function removeClientImport(clientId, conversationId) {
  return apiClient(`${WA}/clients/${clientId}/import/${conversationId}`, { method: "DELETE" });
}
export function removeProjectImport(projectId, conversationId) {
  return apiClient(`${WA}/projects/${projectId}/import/${conversationId}`, { method: "DELETE" });
}
export function switchClientToLive(clientId) {
  return apiClient(`${WA}/clients/${clientId}/import/switch-live`, { method: "POST" });
}
export function switchProjectToLive(projectId) {
  return apiClient(`${WA}/projects/${projectId}/import/switch-live`, { method: "POST" });
}

async function uploadImport(path, file, confirm, name) {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = getActiveTenantId();
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const response = await fetch(buildApiUrl(`${path}${confirm ? "?confirm=1" : ""}`), {
    method: "POST",
    headers,
    body: formData,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* sem corpo */
  }

  if (!response.ok) {
    const err = new Error(payload?.error?.message || "Falha na importação");
    err.code = payload?.error?.code;
    err.status = response.status;
    throw err;
  }
  return payload?.data ?? payload;
}

export function importClientChat(clientId, file, { confirm = false, name } = {}) {
  return uploadImport(`${WA}/clients/${clientId}/import`, file, confirm, name);
}
export function importProjectChat(projectId, file, { confirm = false, name } = {}) {
  return uploadImport(`${WA}/projects/${projectId}/import`, file, confirm, name);
}

export async function listWhatsappInstances() {
  return apiClient("/v1/whatsapp/instances");
}

export async function getWhatsappSetup({ statusOnly = false, refreshQr = false, phone = "" } = {}) {
  const params = new URLSearchParams();
  if (statusOnly) params.set("status_only", "1");
  if (refreshQr) params.set("refresh_qr", "1");
  if (phone) params.set("phone", phone.replace(/\D/g, ""));
  const query = params.toString();
  return apiClient(`/v1/whatsapp/setup${query ? `?${query}` : ""}`);
}

export async function disconnectWhatsapp() {
  return apiClient("/v1/whatsapp/disconnect", { method: "POST" });
}

export async function searchWhatsappChats({ q = "", type = "all", limit = 30 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  return apiClient(`/v1/whatsapp/chats/search${query ? `?${query}` : ""}`);
}

export async function createWhatsappInstance(payload) {
  return apiClient("/v1/whatsapp/instances", {
    method: "POST",
    body: payload,
  });
}

export async function syncWhatsappInstance(id) {
  return apiClient(`/v1/whatsapp/instances/${id}/sync`, {
    method: "POST",
  });
}

export async function getWhatsappConnectQr(id) {
  return apiClient(`/v1/whatsapp/instances/${id}/connect`);
}

export async function listProjectWhatsappLinks(projectId) {
  return apiClient(`/v1/whatsapp/projects/${projectId}/links`);
}

export async function addProjectWhatsappLink(projectId, payload) {
  return apiClient(`/v1/whatsapp/projects/${projectId}/links`, {
    method: "POST",
    body: payload,
  });
}

export async function removeProjectWhatsappLink(projectId, linkId) {
  return apiClient(`/v1/whatsapp/projects/${projectId}/links/${linkId}`, {
    method: "DELETE",
  });
}

export async function listClientWhatsappLinks(clientId) {
  return apiClient(`/v1/whatsapp/clients/${clientId}/links`);
}

export async function addClientWhatsappLink(clientId, payload) {
  return apiClient(`/v1/whatsapp/clients/${clientId}/links`, {
    method: "POST",
    body: payload,
  });
}

export async function removeClientWhatsappLink(clientId, linkId) {
  return apiClient(`/v1/whatsapp/clients/${clientId}/links/${linkId}`, {
    method: "DELETE",
  });
}

export async function listClientWhatsappThreads(clientId) {
  return apiClient(`/v1/whatsapp/clients/${clientId}/threads`);
}

export async function listProjectWhatsappThreads(projectId) {
  return apiClient(`/v1/whatsapp/projects/${projectId}/threads`);
}

export async function listWhatsappConversationMessages(
  conversationId,
  { clientId, projectId, before, limit = 50 } = {}
) {
  const params = new URLSearchParams();
  if (clientId) params.set("client_id", clientId);
  if (projectId) params.set("project_id", projectId);
  if (before) params.set("before", before);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  return apiClient(
    `/v1/whatsapp/conversations/${conversationId}/messages${query ? `?${query}` : ""}`
  );
}

export function formatWhatsappPhone(digits) {
  if (!digits) return "";
  const raw = String(digits).replace(/^55/, "");
  if (raw.length === 11) {
    return `+55 (${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }
  if (raw.length === 10) {
    return `+55 (${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  }
  return `+${digits}`;
}
