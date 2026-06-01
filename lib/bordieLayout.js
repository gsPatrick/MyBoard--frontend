export const BORDIE_DISPLAY = {
  FLOATING: "floating",
  DOCKED: "docked",
};

export const BORDIE_DOCK_PANEL = {
  CHAT: "chat",
  ACTIONS: "actions",
};

export const BORDIE_DOCK_WIDTH = "20vw";
export const BORDIE_DOCK_MIN_WIDTH = 280;
export const BORDIE_DOCK_WIDTH_CSS = `max(${BORDIE_DOCK_MIN_WIDTH}px, ${BORDIE_DOCK_WIDTH})`;

const PREFS_KEY = "myboard_bordie_prefs";

export const BORDIE_DEFAULT_SIZE = { width: 920, height: 560 };
export const BORDIE_MIN_SIZE = { width: 480, height: 360 };

export function readBordiePrefs() {
  const defaults = {
    displayMode: BORDIE_DISPLAY.FLOATING,
    dockPanel: BORDIE_DOCK_PANEL.CHAT,
    size: { ...BORDIE_DEFAULT_SIZE },
    position: null,
  };

  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    return {
      displayMode:
        parsed.displayMode === BORDIE_DISPLAY.DOCKED
          ? BORDIE_DISPLAY.DOCKED
          : BORDIE_DISPLAY.FLOATING,
      dockPanel:
        parsed.dockPanel === BORDIE_DOCK_PANEL.ACTIONS
          ? BORDIE_DOCK_PANEL.ACTIONS
          : BORDIE_DOCK_PANEL.CHAT,
      size: {
        width: Number(parsed.size?.width) || BORDIE_DEFAULT_SIZE.width,
        height: Number(parsed.size?.height) || BORDIE_DEFAULT_SIZE.height,
      },
      position:
        parsed.position &&
        typeof parsed.position.x === "number" &&
        typeof parsed.position.y === "number"
          ? parsed.position
          : null,
    };
  } catch {
    return defaults;
  }
}

export function writeBordiePrefs(prefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function clampBordieSize(size) {
  const maxWidth = typeof window !== "undefined" ? window.innerWidth * 0.94 : 1400;
  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.88 : 900;

  return {
    width: Math.min(Math.max(size.width, BORDIE_MIN_SIZE.width), maxWidth),
    height: Math.min(Math.max(size.height, BORDIE_MIN_SIZE.height), maxHeight),
  };
}

export function getCenteredPosition(size) {
  if (typeof window === "undefined") {
    return { x: 40, y: 40 };
  }

  return {
    x: Math.max(12, (window.innerWidth - size.width) / 2),
    y: Math.max(12, (window.innerHeight - size.height) / 2),
  };
}

export function clampBordiePosition(position, size) {
  const margin = 8;
  const maxX = window.innerWidth - size.width - margin;
  const maxY = window.innerHeight - size.height - margin;

  return {
    x: Math.min(Math.max(position.x, margin), Math.max(margin, maxX)),
    y: Math.min(Math.max(position.y, margin), Math.max(margin, maxY)),
  };
}

export function computeBordieResize(corner, startRect, clientX, clientY) {
  const minW = BORDIE_MIN_SIZE.width;
  const minH = BORDIE_MIN_SIZE.height;
  const maxW = window.innerWidth * 0.94;
  const maxH = window.innerHeight * 0.88;
  const margin = 8;

  let x = startRect.x;
  let y = startRect.y;
  let width = startRect.width;
  let height = startRect.height;

  if (corner.includes("e")) {
    width = clientX - startRect.x;
  }
  if (corner.includes("w")) {
    width = startRect.x + startRect.width - clientX;
    x = clientX;
  }
  if (corner.includes("s")) {
    height = clientY - startRect.y;
  }
  if (corner.includes("n")) {
    height = startRect.y + startRect.height - clientY;
    y = clientY;
  }

  if (width < minW) {
    if (corner.includes("w")) x -= minW - width;
    width = minW;
  }
  if (height < minH) {
    if (corner.includes("n")) y -= minH - height;
    height = minH;
  }

  if (width > maxW) {
    if (corner.includes("w")) x += width - maxW;
    width = maxW;
  }
  if (height > maxH) {
    if (corner.includes("n")) y += height - maxH;
    height = maxH;
  }

  x = Math.max(margin, Math.min(x, window.innerWidth - width - margin));
  y = Math.max(margin, Math.min(y, window.innerHeight - height - margin));

  return { x, y, width, height };
}

export function shouldSnapBordieToDock(rect) {
  const edgeThreshold = 48;
  const centerThreshold = window.innerWidth * 0.72;

  return (
    rect.right >= window.innerWidth - edgeThreshold ||
    rect.left + rect.width / 2 >= centerThreshold
  );
}

export function isNearBordieDockSnap(rect) {
  return rect.right >= window.innerWidth - 120;
}
