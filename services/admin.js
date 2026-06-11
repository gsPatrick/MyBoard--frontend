import { ENDPOINTS } from "./api";
import { apiGet, apiPatch } from "./client";

export function listTenants() {
  return apiGet(ENDPOINTS.admin.tenants);
}

export function getTenant(id) {
  return apiGet(`${ENDPOINTS.admin.tenants}/${id}`);
}

export function updateTenant(id, payload) {
  return apiPatch(`${ENDPOINTS.admin.tenants}/${id}`, payload);
}
