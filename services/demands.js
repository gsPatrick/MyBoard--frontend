import { ENDPOINTS } from "./api";
import { apiGet } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listDemands(params) {
  return apiGet(`${ENDPOINTS.demands}${withQuery(params)}`);
}
