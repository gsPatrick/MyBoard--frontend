import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listEvents(params) {
  return apiGet(`${ENDPOINTS.agenda}${withQuery(params)}`);
}

export function getEvent(id) {
  return apiGet(`${ENDPOINTS.agenda}/${id}`);
}

export function createEvent(payload) {
  return apiPost(ENDPOINTS.agenda, payload);
}

export function updateEvent(id, payload) {
  return apiPatch(`${ENDPOINTS.agenda}/${id}`, payload);
}

export function deleteEvent(id) {
  return apiDelete(`${ENDPOINTS.agenda}/${id}`);
}
