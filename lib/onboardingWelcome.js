import { getActiveTenantId } from "@/api/client";
import { buildTenantScopedKey } from "@/lib/tenantStorage";

const BASE_KEY = "myboard:onboarding-welcome:shown";

function getStorageKey() {
  return buildTenantScopedKey(BASE_KEY, getActiveTenantId());
}

export function shouldShowOnboardingWelcome() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getStorageKey()) !== "1";
}

export function markOnboardingWelcomeShown() {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(), "1");
}
