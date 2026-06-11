import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

const BASE = "/v1/chats";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listChats(params) {
  return apiGet(`${BASE}${withQuery(params)}`);
}

export function createChat(payload) {
  return apiPost(BASE, payload || {});
}

export function getChat(id) {
  return apiGet(`${BASE}/${id}`);
}

export function updateChat(id, payload) {
  return apiPatch(`${BASE}/${id}`, payload || {});
}

export function deleteChat(id) {
  return apiDelete(`${BASE}/${id}`);
}

export function listChatMessages(id, params) {
  return apiGet(`${BASE}/${id}/messages${withQuery(params)}`);
}

export function sendChatMessage(id, { content, attachments = [] }) {
  return apiPost(`${BASE}/${id}/messages`, { content, attachments });
}
