import { ENDPOINTS } from "./api";
import { apiGet, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listTags(params) {
  return apiGet(`${ENDPOINTS.tags}${withQuery(params)}`);
}

export function createTag(payload) {
  return apiPost(ENDPOINTS.tags, payload);
}
