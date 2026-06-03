import { apiClient } from "./client";

const BORDIE_COMMAND_PATH = "/v1/bordie/command";
const BORDIE_CHAT_PATH = "/v1/bordie/chat";
const BORDIE_EXECUTE_PATH = "/v1/bordie/execute";
const BORDIE_POLICY_PATH = "/v1/bordie/policy";

function normalizeResponse(data) {
  return {
    message: data.message || data.reply || data.result || "",
    reply: data.reply || data.message || data.result || "",
    action: data.action || null,
    actions: data.actions || (data.action ? [data.action] : []),
    policy_mode: data.policy_mode || null,
    offline: Boolean(data.offline),
    intent: data.intent || null,
    rag_stats: data.rag_stats || null,
  };
}

export async function sendBordieCommand({ prompt, context, history = [] }) {
  const data = await apiClient(BORDIE_COMMAND_PATH, {
    method: "POST",
    body: { prompt, context, history },
  });

  return normalizeResponse(data);
}

export async function sendBordieMessage({ message, context, history = [] }) {
  const data = await apiClient(BORDIE_CHAT_PATH, {
    method: "POST",
    body: { message, context, history },
  });

  return normalizeResponse(data);
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
