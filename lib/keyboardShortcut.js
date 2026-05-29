export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function getSearchShortcutLabel() {
  return isMacPlatform() ? "⌘K" : "Ctrl+K";
}

export function isSearchShortcut(event) {
  const key = event.key?.toLowerCase();
  if (key !== "k") return false;
  return isMacPlatform() ? event.metaKey : event.ctrlKey;
}
