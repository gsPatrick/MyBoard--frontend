import { isBoardAction } from "@/api/bordie";

// Piso para a animação nunca "piscar" em ações instantâneas.
const MIN_VISIBLE_MS = 1200;
// Tempo que a pílula da ação fica legível depois que a ação é identificada/executada.
// Combinado com o piso, mantém a animação visível por ~1–3 segundos.
const ACTION_DWELL_MS = 1800;
const PREPARING_LABEL = "Bordie identificando ação…";

// Rótulos amigáveis quando a IA não enviou uma explicação própria.
const ACTION_FALLBACK_LABELS = {
  board_patch_scene: "Atualizando o board…",
  board_replace_all: "Recriando o board…",
  board_clear: "Limpando o board…",
  board_delete_elements: "Removendo elementos do board…",
  send_whatsapp_media: "Enviando no WhatsApp…",
};

let overlayStartedAt = 0;
let actionLabelAt = 0;
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
  return (
    action.payload?.explanation ||
    ACTION_FALLBACK_LABELS[action.type] ||
    "Executando ação…"
  );
}

export function messageMayTriggerBordieAction(message, context = {}) {
  const text = String(message || "").trim();
  if (!text) return false;
  if (ACTION_INTENT_PATTERN.test(text)) return true;
  if (context.activeTab === "board") {
    return /faz|faça|monta|adiciona|coloca|escreve|gera|melhora|ajusta|move|mova|renomeia|edita|altera|remove|remova|deleta|liga|ligar|conecta|tabela|entidade|coluna|campo|relação|relacao/i.test(
      text
    );
  }
  return false;
}

export function setBordieActionOverlay(active, label = "") {
  if (typeof window === "undefined") return;

  if (active) {
    overlayActive = true;
    if (!overlayStartedAt) overlayStartedAt = Date.now();
    // Conta o dwell a partir do momento em que a pílula passa a mostrar a AÇÃO
    // (não a fase de "identificando…").
    if (label && label !== PREPARING_LABEL) actionLabelAt = Date.now();
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    dispatchOverlay(true, label);
    return;
  }

  overlayActive = false;
  const now = Date.now();
  const sinceStart = now - (overlayStartedAt || now);
  const waitMin = Math.max(0, MIN_VISIBLE_MS - sinceStart);
  const waitDwell = actionLabelAt ? Math.max(0, ACTION_DWELL_MS - (now - actionLabelAt)) : 0;
  const remaining = Math.max(waitMin, waitDwell);

  const finalize = () => {
    dispatchOverlay(false);
    hideTimer = null;
    overlayStartedAt = 0;
    actionLabelAt = 0;
  };

  if (remaining === 0) {
    finalize();
    return;
  }

  hideTimer = window.setTimeout(finalize, remaining);
}

export function updateBordieActionOverlayLabel(label) {
  if (!overlayActive || typeof window === "undefined") return;
  if (label && label !== PREPARING_LABEL) actionLabelAt = Date.now();
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
  actionLabelAt = 0;
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
