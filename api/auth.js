import { ENDPOINTS } from "./api";
import { apiGet, apiPatch, apiPost, getToken, saveSession, clearSession } from "./client";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { clearTenantScopedStorage } from "@/lib/tenantStorage";
import {
  isNative,
  biometricUnlock,
  keychainSet,
  keychainGet,
  keychainDelete,
} from "@/lib/nativeBridge";

const BIOMETRIC_TOKEN_KEY = "myboard_auth_token";

export async function register(payload) {
  clearTenantScopedStorage();
  const data = await apiPost(ENDPOINTS.auth.register, payload, { auth: false });
  saveSession(data);
  await ensureActiveTenant();
  if (isNative() && data?.token) await keychainSet(BIOMETRIC_TOKEN_KEY, data.token);
  return data;
}

export async function login(payload) {
  clearTenantScopedStorage();
  const data = await apiPost(ENDPOINTS.auth.login, payload, { auth: false });
  saveSession(data);
  await ensureActiveTenant();
  // No app nativo, guarda o token no Keychain para login por Touch ID depois.
  if (isNative() && data?.token) await keychainSet(BIOMETRIC_TOKEN_KEY, data.token);
  return data;
}

/** Renova o token (rola os 7 dias) e valida a sessão. */
export async function refreshSession() {
  const data = await apiPost(ENDPOINTS.auth.refresh, {});
  saveSession(data);
  await ensureActiveTenant();
  return data;
}

/** Há credencial salva para login por Touch ID? (só no app Mac) */
export async function hasBiometricLogin() {
  if (!isNative()) return false;
  const token = await keychainGet(BIOMETRIC_TOKEN_KEY);
  return Boolean(token);
}

/** Login por Touch ID: biometria local → token do Keychain → valida no servidor. */
export async function loginWithBiometrics() {
  const ok = await biometricUnlock("Entrar no MyBoard");
  if (!ok) throw new Error("Autenticação cancelada.");

  const token = await keychainGet(BIOMETRIC_TOKEN_KEY);
  if (!token) throw new Error("Nenhuma credencial salva neste Mac.");

  saveSession({ token }); // deixa o token ativo para o refresh ir autenticado
  try {
    const data = await refreshSession(); // valida + renova; retorna user/tenant
    if (data?.token) await keychainSet(BIOMETRIC_TOKEN_KEY, data.token);
    return data;
  } catch {
    await keychainDelete(BIOMETRIC_TOKEN_KEY);
    clearSession();
    throw new Error("Sessão expirada — entre com a senha.");
  }
}

/** Remove a credencial salva (desativar Touch ID). */
export async function disableBiometricLogin() {
  await keychainDelete(BIOMETRIC_TOKEN_KEY);
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
