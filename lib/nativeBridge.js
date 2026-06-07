// Ponte com a casca nativa (app Mac / Tauri). Tudo no-op seguro na web pura.
function api() {
  if (typeof window === "undefined") return null;
  return window.MyBoardNative || null;
}

export function isNative() {
  return typeof window !== "undefined" && window.__MYBOARD_NATIVE__ === true;
}

export function nativePlatform() {
  return api()?.platform || null; // "macos" | "windows" | null
}

export function isMac() {
  return nativePlatform() === "macos";
}

/** Touch ID / biometria. Resolve true se autenticou, false se cancelou/falhou. */
export async function biometricUnlock(reason = "Confirme sua identidade") {
  const n = api();
  if (!n?.biometricUnlock) return false;
  try {
    return (await n.biometricUnlock(reason)) === true;
  } catch {
    return false;
  }
}

export async function keychainSet(key, value) {
  const n = api();
  if (!n?.keychainSet) return false;
  try {
    await n.keychainSet(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function keychainGet(key) {
  const n = api();
  if (!n?.keychainGet) return null;
  try {
    return await n.keychainGet(key);
  } catch {
    return null;
  }
}

export async function keychainDelete(key) {
  const n = api();
  if (!n?.keychainDelete) return false;
  try {
    await n.keychainDelete(key);
    return true;
  } catch {
    return false;
  }
}
