import { ENDPOINTS } from "./api";
import { apiGet, apiPatch, apiPost, getToken, saveSession, clearSession } from "./client";
import { ensureActiveTenant } from "@/lib/tenantContext";

export async function register(payload) {
  const data = await apiPost(ENDPOINTS.auth.register, payload, { auth: false });
  saveSession(data);
  await ensureActiveTenant();
  return data;
}

export async function login(payload) {
  const data = await apiPost(ENDPOINTS.auth.login, payload, { auth: false });
  saveSession(data);
  await ensureActiveTenant();
  return data;
}

export async function me() {
  return apiGet(ENDPOINTS.auth.me);
}

export async function updateOnboarding(payload) {
  const data = await apiPatch(ENDPOINTS.auth.onboarding, payload);
  saveSession({
    token: getToken(),
    user: data.user,
    tenant: data.tenant,
  });
  window.dispatchEvent(new CustomEvent("myboard:onboarding-updated"));
  return data;
}

export async function updateProfile(payload) {
  const data = await apiPatch(ENDPOINTS.auth.updateProfile, payload);
  saveSession({
    token: getToken(),
    user: data.user,
    tenant: data.tenant,
  });
  window.dispatchEvent(new CustomEvent("myboard:user-updated"));
  return data;
}

export async function forgotPassword(payload) {
  return apiPost(ENDPOINTS.auth.forgotPassword, payload, { auth: false });
}

export async function resetPassword(payload) {
  return apiPost(ENDPOINTS.auth.resetPassword, payload, { auth: false });
}

export async function changePassword(payload) {
  return apiPost(ENDPOINTS.auth.changePassword, payload);
}

export function logout() {
  clearSession();
}
