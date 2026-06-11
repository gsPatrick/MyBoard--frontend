import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function detailsPath(projectId, detailId) {
  const base = `${ENDPOINTS.projects}/${projectId}/details`;
  return detailId ? `${base}/${detailId}` : base;
}

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listProjectDetails(projectId, params) {
  return apiGet(`${detailsPath(projectId)}${withQuery(params)}`);
}

export function getProjectDetail(projectId, detailId, params) {
  return apiGet(`${detailsPath(projectId, detailId)}${withQuery(params)}`);
}

export function createProjectDetail(projectId, payload) {
  return apiPost(detailsPath(projectId), payload);
}

export function updateProjectDetail(projectId, detailId, payload) {
  return apiPatch(detailsPath(projectId, detailId), payload);
}

export function deleteProjectDetail(projectId, detailId) {
  return apiDelete(detailsPath(projectId, detailId));
}
