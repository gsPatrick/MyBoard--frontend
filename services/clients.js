import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listClients(params) {
  return apiGet(`${ENDPOINTS.clients}${withQuery(params)}`);
}

export function getClient(id) {
  return apiGet(`${ENDPOINTS.clients}/${id}`);
}

export function createClient(payload) {
  return apiPost(ENDPOINTS.clients, payload);
}

export function updateClient(id, payload) {
  return apiPatch(`${ENDPOINTS.clients}/${id}`, payload);
}

export function deleteClient(id) {
  return apiDelete(`${ENDPOINTS.clients}/${id}`);
}
