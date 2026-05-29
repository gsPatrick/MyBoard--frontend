const STORAGE_KEY = "myboard_recent_projects";
const MAX_ITEMS = 8;

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
    openedAt: new Date().toISOString(),
  };

  const filtered = getRecentProjects().filter((item) => item.id !== entry.id);
  const next = [entry, ...filtered].slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("myboard:recent-updated"));
}

export function clearRecentProjects() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("myboard:recent-updated"));
}
