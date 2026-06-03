const MIN_VISIBLE_MS = 1400;

let overlayStartedAt = 0;
let hideTimer = null;

function dispatchOverlay(active, label = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("myboard:bordie-action-overlay", {
      detail: { active: Boolean(active), label: label || "" },
    })
  );
}

export function setBordieActionOverlay(active, label = "") {
  if (typeof window === "undefined") return;

  if (active) {
    overlayStartedAt = Date.now();
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    dispatchOverlay(true, label);
    return;
  }

  const elapsed = Date.now() - overlayStartedAt;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  if (remaining === 0) {
    dispatchOverlay(false);
    return;
  }

  hideTimer = window.setTimeout(() => {
    dispatchOverlay(false);
    hideTimer = null;
  }, remaining);
}

export function forceHideBordieActionOverlay() {
  if (typeof window === "undefined") return;
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  overlayStartedAt = 0;
  dispatchOverlay(false);
}

export async function withBordieActionOverlay(fn, label = "") {
  setBordieActionOverlay(true, label);
  try {
    return await fn();
  } finally {
    setBordieActionOverlay(false);
  }
}

export function waitForBordieSceneApply({ boardId, sceneData, explanation }, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve({ ok: false });
      return;
    }

    const timer = window.setTimeout(() => {
      window.removeEventListener("myboard:bordie-scene-applied", onApplied);
      window.removeEventListener("myboard:bordie-scene-failed", onFailed);
      reject(new Error("Tempo esgotado ao aplicar alterações no board."));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("myboard:bordie-scene-applied", onApplied);
      window.removeEventListener("myboard:bordie-scene-failed", onFailed);
    }

    function onApplied(event) {
      const detail = event.detail || {};
      if (boardId && detail.boardId && detail.boardId !== boardId) return;
      cleanup();
      resolve(detail);
    }

    function onFailed(event) {
      const detail = event.detail || {};
      if (boardId && detail.boardId && detail.boardId !== boardId) return;
      cleanup();
      reject(new Error(detail.message || "Falha ao aplicar board."));
    }

    window.addEventListener("myboard:bordie-scene-applied", onApplied);
    window.addEventListener("myboard:bordie-scene-failed", onFailed);

    window.dispatchEvent(
      new CustomEvent("myboard:bordie-apply-scene", {
        detail: { boardId, sceneData, explanation },
      })
    );
  });
}

export async function runBoardActionWithOverlay(action) {
  const label = action.payload?.explanation || action.type || "Atualizando board…";
  return withBordieActionOverlay(
    () =>
      waitForBordieSceneApply({
        boardId: action.payload?.board_id,
        sceneData: action.payload?.proposed_scene,
        explanation: action.payload?.explanation,
      }),
    label
  );
}
