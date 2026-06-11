import { buildApiUrl } from "./api";
import { clearTenantScopedStorage } from "@/lib/tenantStorage";

// Plataforma do cliente (web | macos | windows) para rastrear sessões.
// Lê o bridge nativo sem quebrar SSR/web pura.
function clientPlatform() {
  if (typeof window === "undefined") return null;
  if (window.__MYBOARD_NATIVE__ === true) {
    return window.MyBoardNative?.platform || "macos";
  }
  return null;
}

const TOKEN_KEY = "myboard_token";
const USER_KEY = "myboard_user";
const TENANT_KEY = "myboard_tenant";

export class ApiError extends Error {
  constructor(message, code, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStoredTenant() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TENANT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getActiveTenantId() {
  const user = getStoredUser();
  if (!user) return null;

  if (user.role === "super_admin") {
    return getStoredTenant()?.id || null;
  }

  return user.tenant_id || null;
}

export function setActiveTenant(tenant) {
  if (typeof window === "undefined" || !tenant?.id) return;
  localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
  window.dispatchEvent(new CustomEvent("myboard:tenant-changed"));
}

export function saveSession({ token, user, tenant }) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TENANT_KEY);
  clearTenantScopedStorage();
}

export async function apiClient(path, options = {}) {
  const { method = "GET", body, headers = {}, auth = true, ...rest } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const platform = clientPlatform();
  if (platform) {
    requestHeaders["X-Client-Platform"] = platform;
  }

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const tenantId = getActiveTenantId();
    if (tenantId) {
      requestHeaders["X-Tenant-Id"] = tenantId;
    }
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 204 && contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || "Erro na requisição",
      payload?.error?.code || "REQUEST_ERROR",
      response.status,
      payload?.error?.details || null
    );
  }

  return payload?.data ?? payload;
}

export function apiGet(path, options) {
  return apiClient(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiClient(path, { ...options, method: "POST", body });
}

export function apiPatch(path, body, options) {
  return apiClient(path, { ...options, method: "PATCH", body });
}

export function apiPut(path, body, options) {
  return apiClient(path, { ...options, method: "PUT", body });
}

export function apiDelete(path, options) {
  return apiClient(path, { ...options, method: "DELETE" });
}
