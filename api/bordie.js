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
    offline: false,
  };
}

export async function sendBordieCommand({ prompt, context, history = [] }) {
  try {
    const data = await apiClient(BORDIE_COMMAND_PATH, {
      method: "POST",
      body: { prompt, context, history },
    });

    return normalizeResponse(data);
  } catch (error) {
    if (error.status === 404 || error.status >= 500) {
      return {
        message: getOfflineCommandMessage(prompt, context),
        reply: getOfflineCommandMessage(prompt, context),
        action: null,
        actions: [],
        offline: true,
      };
    }
    throw error;
  }
}

export async function sendBordieMessage({ message, context, history = [] }) {
  try {
    const data = await apiClient(BORDIE_CHAT_PATH, {
      method: "POST",
      body: { message, context, history },
    });

    return normalizeResponse(data);
  } catch (error) {
    if (error.status === 404 || error.status >= 500) {
      const offline = getOfflineChatMessage(message, context);
      return { reply: offline, message: offline, action: null, actions: [], offline: true };
    }
    throw error;
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

function getOfflineCommandMessage(prompt, context) {
  const tab = context?.activeTabLabel || "workspace";
  const text = (prompt || "").toLowerCase();

  if (/organiz|alinhar|board|quadro/.test(text) && context?.activeTab === "board") {
    return "Entendi — vou organizar o board quando a API do Bordie estiver conectada. Por enquanto, use as ações rápidas da lista.";
  }

  if (/resum|priorid|atrasad|hoje/.test(text)) {
    return `Analisaria “${prompt}” com dados reais do ${tab}. A integração com a API está sendo preparada.`;
  }

  return `Recebi: “${prompt}”. Contexto: ${tab}. A execução automática chega com a API do Bordie.`;
}

function getOfflineChatMessage(message, context) {
  const tab = context?.activeTabLabel || "workspace";
  const text = (message || "").toLowerCase();

  if (/ol[aá]|oi|hey|bom dia|boa tarde|boa noite/.test(text)) {
    return `Oi! Estou acompanhando você na aba ${tab}. A API completa do Bordie.ia está chegando — já posso ajudar com orientações gerais.`;
  }

  if (/projeto|cliente|demanda|agenda|lucro|board/.test(text)) {
    return "Posso orientar sobre projetos, clientes, demandas, agenda e board. Em breve vou responder com dados reais do seu workspace.";
  }

  return `Entendi. Você está em ${tab}. Quando a API estiver ativa, responderei com contexto do MyBoard.`;
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
