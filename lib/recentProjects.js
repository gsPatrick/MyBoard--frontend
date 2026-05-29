import { getActiveTenantId } from "@/api/client";
import { buildTenantScopedKey } from "@/lib/tenantStorage";

const STORAGE_KEY = "myboard_recent_projects";
const MAX_ITEMS = 8;

function getStorageKey() {
  return buildTenantScopedKey(STORAGE_KEY, getActiveTenantId());
}

function pickClientSnapshot(project) {
  const client = project?.client;
  if (!client) return null;

  return {
    id: client.id,
    name: client.name,
    avatar: client.avatar
      ? {
          public_url: client.avatar.public_url || null,
          storage_path: client.avatar.storage_path || null,
        }
      : null,
  };
}

export function enrichRecentProjects(recent, projects = []) {
  const byId = new Map(projects.map((project) => [project.id, project]));

  return recent.map((item) => {
    const full = byId.get(item.id);
    const client = full?.client || item.client || null;

    return {
      ...item,
      name: full?.name || item.name,
      slug: full?.slug || item.slug,
      folder_id: full?.folder_id ?? item.folder_id ?? null,
      client,
    };
  });
}

export function getRecentProjects() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function addRecentProject(project) {
  if (typeof window === "undefined" || !project?.id) return;

  const entry = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    folder_id: project.folder_id || null,
    folder_name: project.folder?.name || null,
    priority: project.priority,
    client: pickClientSnapshot(project),
    openedAt: new Date().toISOString(),
  };

  const filtered = getRecentProjects().filter((item) => item.id !== entry.id);
  const next = [entry, ...filtered].slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("myboard:recent-updated"));
}

export function clearRecentProjects() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey());
  window.dispatchEvent(new CustomEvent("myboard:recent-updated"));
}
