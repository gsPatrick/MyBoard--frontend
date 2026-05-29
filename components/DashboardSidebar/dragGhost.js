const FOLDER_SVG = `<svg viewBox="0 0 20 20" fill="none" width="40" height="40" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H8l1.5 2h6A1.5 1.5 0 0 1 17 8.5v6A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-8Z" stroke="currentColor" stroke-width="1.3"/></svg>`;

const FILE_SVG = `<svg viewBox="0 0 20 20" fill="none" width="40" height="40" aria-hidden="true"><path d="M6 3.5h5l3.5 3.5V16.5A1.5 1.5 0 0 1 13 18H7A1.5 1.5 0 0 1 5.5 16.5v-12A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M11 3.5V7H14.5" stroke="currentColor" stroke-width="1.3"/></svg>`;

export function attachWorkspaceDragGhost(event, type, label, ghostClasses) {
  const ghost = document.createElement("div");
  ghost.className = ghostClasses.root;

  const icon = document.createElement("span");
  icon.className = ghostClasses.icon;
  icon.innerHTML = type === "folder" ? FOLDER_SVG : FILE_SVG;

  const text = document.createElement("span");
  text.className = ghostClasses.label;
  text.textContent = label || "";

  ghost.append(icon, text);
  ghost.style.position = "fixed";
  ghost.style.top = "-999px";
  ghost.style.left = "-999px";
  ghost.style.pointerEvents = "none";
  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 56, 36);
  window.requestAnimationFrame(() => {
    window.setTimeout(() => ghost.remove(), 0);
  });
}

