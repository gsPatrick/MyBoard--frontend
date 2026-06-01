import { apiClient } from "./client";

export async function listWhatsappInstances() {
  return apiClient("/v1/whatsapp/instances");
}

export async function getWhatsappSetup({ statusOnly = false, refreshQr = false } = {}) {
  const params = new URLSearchParams();
  if (statusOnly) params.set("status_only", "1");
  if (refreshQr) params.set("refresh_qr", "1");
  const query = params.toString();
  return apiClient(`/v1/whatsapp/setup${query ? `?${query}` : ""}`);
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
