export const EMPTY_SCENE = {
  elements: [],
  appState: {},
  files: {},
};

export function getDefaultViewBackground(theme) {
  return theme === "dark" ? "#121212" : "#ffffff";
}

export function normalizeScene(scene, theme = "light") {
  if (!scene || typeof scene !== "object") {
    return {
      elements: [],
      appState: sanitizeAppState({}, theme),
      files: {},
    };
  }

  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState: sanitizeAppState(scene.appState, theme),
    files: scene.files && typeof scene.files === "object" ? scene.files : {},
  };
}

export function sanitizeAppState(appState, theme = "light") {
  if (!appState || typeof appState !== "object") {
    return { viewBackgroundColor: getDefaultViewBackground(theme) };
  }

  const background =
    appState.viewBackgroundColor && appState.viewBackgroundColor !== "transparent"
      ? appState.viewBackgroundColor
      : getDefaultViewBackground(theme);

  return {
    viewBackgroundColor: background,
    gridSize: appState.gridSize ?? null,
    theme: appState.theme || theme,
    zoom: appState.zoom,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
  };
}

export function serializeScene(elements, appState, files, theme = "light") {
  return {
    elements: elements || [],
    appState: sanitizeAppState(appState, theme),
    files: files || {},
  };
}

export function sceneToInitialData(scene, theme = "light") {
  const normalized = normalizeScene(scene, theme);
  return {
    elements: normalized.elements,
    appState: normalized.appState,
    files: normalized.files,
  };
}

export const LAST_BOARD_STORAGE_KEY = "myboard:last-board-id";

export function getStoredBoardId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_BOARD_STORAGE_KEY);
}

export function setStoredBoardId(boardId) {
  if (typeof window === "undefined") return;
  if (boardId) {
    window.localStorage.setItem(LAST_BOARD_STORAGE_KEY, boardId);
  } else {
    window.localStorage.removeItem(LAST_BOARD_STORAGE_KEY);
  }
}
