import { ENDPOINTS } from "./api";
import { apiGet, apiPatch } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listNotifications(params) {
  return apiGet(`${ENDPOINTS.notifications}${withQuery(params)}`);
}

export function getUnreadCount() {
  return apiGet(`${ENDPOINTS.notifications}/unread-count`);
}

export function markAsRead(id) {
  return apiPatch(`${ENDPOINTS.notifications}/${id}/read`);
}

export function markAllAsRead() {
  return apiPatch(`${ENDPOINTS.notifications}/read-all`);
}
