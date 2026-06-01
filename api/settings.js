import { apiClient } from "./client";

export async function getWorkspaceSettings() {
  return apiClient("/v1/settings");
}

export async function updateAiSettings(payload) {
  return apiClient("/v1/settings/ai", {
    method: "PATCH",
    body: payload,
  });
}

export async function testAiConnection() {
  return apiClient("/v1/settings/ai/test", {
    method: "POST",
  });
}

export async function updatePrivacySettings(payload) {
  return apiClient("/v1/settings/privacy", {
    method: "PATCH",
    body: payload,
  });
}
