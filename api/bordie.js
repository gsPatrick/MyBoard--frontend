import { apiClient } from "./client";

const BORDIE_COMMAND_PATH = "/v1/bordie/command";
const BORDIE_CHAT_PATH = "/v1/bordie/chat";

export async function sendBordieCommand({ prompt, context, history = [] }) {
  try {
    const data = await apiClient(BORDIE_COMMAND_PATH, {
      method: "POST",
      body: { prompt, context, history },
    });

    return {
      message: data.message || data.reply || data.result || "",
      action: data.action || null,
      offline: false,
    };
  } catch (error) {
    if (error.status === 404 || error.status >= 500) {
      return {
        message: getOfflineCommandMessage(prompt, context),
        action: null,
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

    return {
      reply: data.reply || data.message || data.content || "",
      offline: false,
    };
  } catch (error) {
    if (error.status === 404 || error.status >= 500) {
      return {
        reply: getOfflineChatMessage(message, context),
        offline: true,
      };
    }
    throw error;
  }
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
