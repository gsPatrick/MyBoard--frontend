import { ENDPOINTS } from "./api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

function withQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  ).toString();
  return qs ? `?${qs}` : "";
}

export function listFolders(params) {
  return apiGet(`${ENDPOINTS.folders}${withQuery(params)}`);
}

export function getWorkspaceTree(params) {
  return apiGet(`${ENDPOINTS.folders}/tree${withQuery(params)}`);
}

export function getFolderContents(id, params) {
  return apiGet(`${ENDPOINTS.folders}/${id}/contents${withQuery(params)}`);
}

export function createFolder(payload) {
  return apiPost(ENDPOINTS.folders, payload);
}

export function updateFolder(id, payload) {
  return apiPatch(`${ENDPOINTS.folders}/${id}`, payload);
}

export function deleteFolder(id) {
  return apiDelete(`${ENDPOINTS.folders}/${id}`);
}

export function moveProjectToFolder(projectId, folderId) {
  return apiPost(`${ENDPOINTS.folders}/move-project/${projectId}`, { folder_id: folderId });
}

export function reorderWorkspace(payload) {
  return apiPost(`${ENDPOINTS.folders}/workspace/reorder`, payload);
}
