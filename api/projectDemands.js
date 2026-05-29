import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function demandsPath(projectId, demandId) {
  const base = `${ENDPOINTS.projects}/${projectId}/demands`;
  return demandId ? `${base}/${demandId}` : base;
}

export function listProjectDemands(projectId) {
  return apiGet(demandsPath(projectId));
}

export function createProjectDemand(projectId, payload) {
  return apiPost(demandsPath(projectId), payload);
}

export function updateProjectDemand(projectId, demandId, payload) {
  return apiPatch(demandsPath(projectId, demandId), payload);
}

export function deleteProjectDemand(projectId, demandId) {
  return apiDelete(demandsPath(projectId, demandId));
}
