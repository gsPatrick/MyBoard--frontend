import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function path(projectId, entryId) {
  const base = `${ENDPOINTS.projects}/${projectId}/financial-entries`;
  return entryId ? `${base}/${entryId}` : base;
}

export function listProjectFinancialEntries(projectId) {
  return apiGet(path(projectId));
}

export function createProjectFinancialEntry(projectId, payload) {
  return apiPost(path(projectId), payload);
}

export function updateProjectFinancialEntry(projectId, entryId, payload) {
  return apiPatch(path(projectId, entryId), payload);
}

export function deleteProjectFinancialEntry(projectId, entryId) {
  return apiDelete(path(projectId, entryId));
}
