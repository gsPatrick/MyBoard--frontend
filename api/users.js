import { ENDPOINTS } from "./api";
import { apiGet, apiPatch, apiPost } from "./client";

export function listUsers() {
  return apiGet(ENDPOINTS.users);
}

export function getUser(id) {
  return apiGet(`${ENDPOINTS.users}/${id}`);
}

export function createUser(payload) {
  return apiPost(ENDPOINTS.users, payload);
}

export function updateUser(id, payload) {
  return apiPatch(`${ENDPOINTS.users}/${id}`, payload);
}
