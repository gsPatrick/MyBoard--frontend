import { API_BASE_URL } from "@/services/api";

export function resolveMediaUrl(media) {
  if (!media) return null;
  if (media.public_url) return media.public_url;

  if (media.storage_path) {
    const base = API_BASE_URL.replace(/\/$/, "");
    return `${base}/uploads/${media.storage_path.replace(/^\//, "")}`;
  }

  return null;
}

export function getClientAvatarUrl(client) {
  return resolveMediaUrl(client?.avatar) || null;
}

export function getUserAvatarUrl(user) {
  return resolveMediaUrl(user?.avatar) || null;
}
