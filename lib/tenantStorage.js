const LEGACY_RECENT_KEY = "myboard_recent_projects";
const DAILY_FOCUS_KEY = "myboard:daily-focus:last-shown";
const LAYOUT_KEY = "myboard_dashboard_layout";

const TENANT_SCOPED_PREFIXES = [
  "myboard_recent_projects:",
  "myboard:daily-focus:",
  "myboard_dashboard_layout:",
];

export function clearTenantScopedStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(LEGACY_RECENT_KEY);
  localStorage.removeItem(DAILY_FOCUS_KEY);
  localStorage.removeItem(LAYOUT_KEY);

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    if (TENANT_SCOPED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  }

  window.dispatchEvent(new CustomEvent("myboard:recent-updated"));
}

export function buildTenantScopedKey(baseKey, tenantId) {
  if (!tenantId) return baseKey;
  return `${baseKey}:${tenantId}`;
}
