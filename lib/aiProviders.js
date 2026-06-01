export const AI_PROVIDER_IDS = ["gpt", "claude", "gemini", "custom"];

export const AI_PROVIDER_PRESETS = {
  gpt: {
    id: "gpt",
    label: "ChatGPT",
    shortLabel: "GPT",
    base_url: "https://api.openai.com/v1",
    chat_model: "gpt-4o-mini",
    embedding_model: "text-embedding-3-small",
    key_hint: "sk-...",
    docs_url: "https://platform.openai.com/api-keys",
    description: "API oficial da OpenAI (GPT-4o, GPT-4o mini, etc.).",
    accent: "#10a37f",
  },
  claude: {
    id: "claude",
    label: "Claude",
    shortLabel: "Claude",
    base_url: "https://api.anthropic.com/v1",
    chat_model: "claude-sonnet-4-20250514",
    embedding_model: "",
    key_hint: "sk-ant-...",
    docs_url: "https://console.anthropic.com/settings/keys",
    description: "API oficial da Anthropic (Claude Sonnet, Opus, etc.).",
    accent: "#d97757",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    shortLabel: "Gemini",
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/",
    chat_model: "gemini-2.0-flash",
    embedding_model: "text-embedding-004",
    key_hint: "AIza...",
    docs_url: "https://aistudio.google.com/apikey",
    description: "Google AI Studio / Gemini via endpoint compatível OpenAI.",
    accent: "#4285f4",
  },
  custom: {
    id: "custom",
    label: "Agente / CLI",
    shortLabel: "Custom",
    base_url: "https://openrouter.ai/api/v1",
    chat_model: "openai/gpt-4o-mini",
    embedding_model: "openai/text-embedding-3-small",
    key_hint: "Token do agente ou API",
    docs_url: null,
    description:
      "OpenRouter, proxy local ou token exportado de um agente CLI compatível com OpenAI.",
    accent: "#8b5cf6",
  },
};

export function buildEmptyProviderForms() {
  return AI_PROVIDER_IDS.reduce((acc, id) => {
    const preset = AI_PROVIDER_PRESETS[id];
    acc[id] = {
      api_key: "",
      base_url: preset.base_url,
      chat_model: preset.chat_model,
      embedding_model: preset.embedding_model || "",
    };
    return acc;
  }, {});
}

export function mapAiSettingsToState(ai = {}) {
  const active = ai.active_provider || "gpt";
  const forms = buildEmptyProviderForms();
  const meta = {};

  for (const id of AI_PROVIDER_IDS) {
    const remote = ai.providers?.[id] || {};
    const preset = AI_PROVIDER_PRESETS[id];
    forms[id] = {
      api_key: "",
      base_url: remote.base_url || preset.base_url,
      chat_model: remote.chat_model || preset.chat_model,
      embedding_model: remote.embedding_model || preset.embedding_model || "",
    };
    meta[id] = {
      has_api_key: Boolean(remote.has_api_key),
      api_key_masked: remote.api_key_masked,
      configured: Boolean(remote.configured),
    };
  }

  return {
    activeProvider: active,
    forms,
    meta,
    configured: Boolean(ai.configured),
  };
}
