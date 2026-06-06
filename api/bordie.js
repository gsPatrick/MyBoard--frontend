import { apiClient } from "./client";

const BORDIE_COMMAND_PATH = "/v1/bordie/command";
const BORDIE_CHAT_PATH = "/v1/bordie/chat";
const BORDIE_EXECUTE_PATH = "/v1/bordie/execute";
const BORDIE_POLICY_PATH = "/v1/bordie/policy";

function normalizeResponse(data) {
  return {
    message: data.message || data.reply || data.result || "",
    reply: data.reply || data.message || data.result || "",
    entities: Array.isArray(data.entities) ? data.entities : [],
    action: data.action || null,
    actions: data.actions || (data.action ? [data.action] : []),
    policy_mode: data.policy_mode || null,
    offline: Boolean(data.offline),
    intent: data.intent || null,
    rag_stats: data.rag_stats || null,
  };
}

// Controla a requisição de chat/comando em andamento para permitir cancelar
// (o "x" da animação aborta a chamada que estiver rodando).
let currentController = null;

function startAbortable() {
  if (currentController) currentController.abort();
  currentController = new AbortController();
  return currentController.signal;
}

export function abortBordieRequest() {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

export async function sendBordieCommand({ prompt, context, history = [] }) {
  const signal = startAbortable();
  try {
    const data = await apiClient(BORDIE_COMMAND_PATH, {
      method: "POST",
      body: { prompt, context, history },
      signal,
    });
    return normalizeResponse(data);
  } finally {
    currentController = null;
  }
}

export async function sendBordieMessage({ message, context, history = [] }) {
  const signal = startAbortable();
  try {
    const data = await apiClient(BORDIE_CHAT_PATH, {
      method: "POST",
      body: { message, context, history },
      signal,
    });
    return normalizeResponse(data);
  } finally {
    currentController = null;
  }
}

export async function executeBordieAction({ action, confirmed = true }) {
  const data = await apiClient(BORDIE_EXECUTE_PATH, {
    method: "POST",
    body: { action, confirmed },
  });
  return data;
}

export async function getBordiePolicy() {
  return apiClient(BORDIE_POLICY_PATH);
}

export function dispatchBordieSceneApply(detail) {
  window.dispatchEvent(
    new CustomEvent("myboard:bordie-apply-scene", {
      detail,
    })
  );
}

export function isBoardAction(action) {
  return Boolean(action?.type?.startsWith("board_"));
}

export function canAutoApplyBoardAction(action) {
  return isBoardAction(action) && action?.requires_confirmation !== true;
}
