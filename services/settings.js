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

export async function fetchAiProxyModels({ base_url, api_key } = {}) {
  return apiClient("/v1/settings/ai/models", {
    method: "POST",
    body: {
      ...(base_url ? { base_url } : {}),
      ...(api_key ? { api_key } : {}),
    },
  });
}

export async function updatePrivacySettings(payload) {
  return apiClient("/v1/settings/privacy", {
    method: "PATCH",
    body: payload,
  });
}
