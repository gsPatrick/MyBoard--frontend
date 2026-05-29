import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listProjects(params) {
  return apiGet(`${ENDPOINTS.projects}${withQuery(params)}`);
}

export function getProject(id, params) {
  return apiGet(`${ENDPOINTS.projects}/${id}${withQuery(params)}`);
}

export function createProject(payload) {
  return apiPost(ENDPOINTS.projects, payload);
}

export function updateProject(id, payload) {
  return apiPatch(`${ENDPOINTS.projects}/${id}`, payload);
}

export function deleteProject(id) {
  return apiDelete(`${ENDPOINTS.projects}/${id}`);
}

export function listProjectDetails(projectId, params) {
  return apiGet(`${ENDPOINTS.projects}/${projectId}/details${withQuery(params)}`);
}

export function createProjectDetail(projectId, payload) {
  return apiPost(`${ENDPOINTS.projects}/${projectId}/details`, payload);
}
