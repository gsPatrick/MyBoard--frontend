import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listBoards(params) {
  return apiGet(`${ENDPOINTS.boards}${withQuery(params)}`);
}

export function getDefaultBoard() {
  return apiGet(`${ENDPOINTS.boards}/default`);
}

export function getBoard(id) {
  return apiGet(`${ENDPOINTS.boards}/${id}`);
}

export function createBoard(payload) {
  return apiPost(ENDPOINTS.boards, payload);
}

export function updateBoard(id, payload) {
  return apiPatch(`${ENDPOINTS.boards}/${id}`, payload);
}

export function deleteBoard(id) {
  return apiDelete(`${ENDPOINTS.boards}/${id}`);
}
