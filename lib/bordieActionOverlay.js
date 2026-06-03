import { isBoardAction } from "@/api/bordie";

const MIN_VISIBLE_MS = 1400;
const PREPARING_LABEL = "Bordie identificando ação…";

let overlayStartedAt = 0;
let hideTimer = null;
let overlayActive = false;

const ACTION_INTENT_PATTERN =
  /desenha|desenhar|board|quadro|canvas|fluxo|diagrama|wireframe|mapa mental|cria|adicione|nota|sticky|limpar|apagar|envia|manda|contrato|whatsapp|zap|executa|organiza|atualiza/i;

function dispatchOverlay(active, label = "") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("myboard:bordie-action-overlay", {
      detail: { active: Boolean(active), label: label || "" },
    })
  );
}

export function getBordieActionOverlayLabel(action) {
  if (!action?.type) return "Executando ação…";
  return action.payload?.explanation || action.type || "Executando ação…";
}

export function messageMayTriggerBordieAction(message, context = {}) {
  const text = String(message || "").trim();
  if (!text) return false;
  if (ACTION_INTENT_PATTERN.test(text)) return true;
  if (context.activeTab === "board") {
    return /faz|monta|adiciona|coloca|escreve|gera|melhora|ajusta/i.test(text);
  }
  return false;
}

export function setBordieActionOverlay(active, label = "") {
  if (typeof window === "undefined") return;

  if (active) {
    overlayActive = true;
    overlayStartedAt = Date.now();
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    dispatchOverlay(true, label);
    return;
  }

  overlayActive = false;
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

export function updateBordieActionOverlayLabel(label) {
  if (!overlayActive || typeof window === "undefined") return;
  dispatchOverlay(true, label || "");
}

export function forceHideBordieActionOverlay() {
  if (typeof window === "undefined") return;
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  overlayActive = false;
  overlayStartedAt = 0;
  dispatchOverlay(false);
}

export function beginBordieActionPreparing(message, context = {}) {
  if (!messageMayTriggerBordieAction(message, context)) return false;
  setBordieActionOverlay(true, PREPARING_LABEL);
  return true;
}

export async function paintOverlayFrame() {
  if (typeof window === "undefined") return;
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

export function beginBordieActionOverlay(action) {
  if (!action?.type) return;
  setBordieActionOverlay(true, getBordieActionOverlayLabel(action));
}

export function endBordieActionOverlay() {
  setBordieActionOverlay(false);
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

async function executeBoardAction(action) {
  return waitForBordieSceneApply({
    boardId: action.payload?.board_id,
    sceneData: action.payload?.proposed_scene,
    explanation: action.payload?.explanation,
  });
}

export async function executeBordieActionCore(action, { executeRemote, policyMode = null } = {}) {
  if (!action?.type) return { ok: false };

  const needsConfirm =
    action.requires_confirmation === true || policyMode === "always_confirm";

  if (needsConfirm) {
    const label = getBordieActionOverlayLabel(action);
    const confirmed = window.confirm(`Bordie quer executar: ${label}\n\nConfirmar?`);
    if (!confirmed) {
      return { ok: false, cancelled: true };
    }
  }

  if (isBoardAction(action) && action.payload?.proposed_scene) {
    await executeBoardAction(action);
    return { ok: true, local: true };
  }

  if (executeRemote) {
    return executeRemote({ action, confirmed: true });
  }

  return { ok: false };
}

export async function runBordieActionFlow(action, { executeRemote, policyMode = null } = {}) {
  beginBordieActionOverlay(action);
  await paintOverlayFrame();

  try {
    return await executeBordieActionCore(action, { executeRemote, policyMode });
  } finally {
    endBordieActionOverlay();
  }
}
