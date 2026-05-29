import { getStoredUser, getStoredTenant, setActiveTenant } from "@/api/client";
import { listTenants } from "@/api/admin";

export function isSuperAdmin() {
  return getStoredUser()?.role === "super_admin";
}

export async function ensureActiveTenant() {
  const user = getStoredUser();
  if (!user) return null;

  if (user.role !== "super_admin") {
    return user.tenant_id || getStoredTenant()?.id || null;
  }

  const current = getStoredTenant();
  if (current?.id) return current.id;

  const tenants = await listTenants({ is_active: "true" });
  const list = Array.isArray(tenants) ? tenants : [];

  if (list.length === 0) {
    return null;
  }

  setActiveTenant(list[0]);
  return list[0].id;
}
