export const EMPTY_SCENE = {
  elements: [],
  appState: {
    viewBackgroundColor: "transparent",
  },
  files: {},
};

export function normalizeScene(scene) {
  if (!scene || typeof scene !== "object") {
    return { ...EMPTY_SCENE, appState: { ...EMPTY_SCENE.appState } };
  }

  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState: sanitizeAppState(scene.appState),
    files: scene.files && typeof scene.files === "object" ? scene.files : {},
  };
}

export function sanitizeAppState(appState) {
  if (!appState || typeof appState !== "object") {
    return { viewBackgroundColor: "transparent" };
  }

  const { collaborators, ...rest } = appState;
  return rest;
}

export function serializeScene(elements, appState, files) {
  return {
    elements: elements || [],
    appState: sanitizeAppState(appState),
    files: files || {},
  };
}

export function sceneToInitialData(scene) {
  const normalized = normalizeScene(scene);
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
