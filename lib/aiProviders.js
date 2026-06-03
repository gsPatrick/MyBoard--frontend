import { DEFAULT_CLIPROXY_URL } from "./proxyModels";

export const AI_PROVIDER_IDS = ["gpt", "claude", "gemini", "custom"];

export { DEFAULT_CLIPROXY_URL };

export const AI_PROVIDER_PRESETS = {
  gpt: {
    id: "gpt",
    label: "ChatGPT",
    shortLabel: "GPT",
    logo: "/ai-providers/openai.svg",
    customizable: false,
    base_url: "https://api.openai.com/v1",
    chat_model: "gpt-4o-mini",
    chat_model_label: "GPT-4o mini",
    embedding_model: "text-embedding-3-small",
    key_hint: "sk-...",
    docs_url: "https://platform.openai.com/api-keys",
    description: "Cole sua chave da OpenAI. Modelos já configurados automaticamente.",
    accent: "#0084FF",
  },
  claude: {
    id: "claude",
    label: "Claude",
    shortLabel: "Claude",
    logo: "/ai-providers/anthropic.svg",
    customizable: false,
    base_url: "https://api.anthropic.com/v1",
    chat_model: "claude-sonnet-4-20250514",
    chat_model_label: "Claude Sonnet 4",
    embedding_model: "",
    key_hint: "sk-ant-...",
    docs_url: "https://console.anthropic.com/settings/keys",
    description: "Cole sua chave da Anthropic. Modelos já configurados automaticamente.",
    accent: "#D97757",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    shortLabel: "Gemini",
    logo: "/ai-providers/gemini.svg",
    customizable: false,
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/",
    chat_model: "gemini-2.0-flash",
    chat_model_label: "Gemini 2.0 Flash",
    embedding_model: "text-embedding-004",
    key_hint: "AIza...",
    docs_url: "https://aistudio.google.com/apikey",
    description: "Cole sua chave do Google AI Studio. Modelos já configurados automaticamente.",
    accent: "#4285F4",
  },
  custom: {
    id: "custom",
    label: "Proxy / CLI",
    shortLabel: "Proxy",
    logo: null,
    customizable: true,
    base_url: DEFAULT_CLIPROXY_URL,
    chat_model: "gemini-2.5-flash",
    chat_model_label: "Gemini 2.5 Flash",
    key_hint: "batata",
    docs_url: null,
    description:
      "CLIProxyAPI: URL da API, Bearer token (api-keys) e model id listado em GET /v1/models.",
    accent: "#8b5cf6",
  },
};

export function isCustomizableProvider(id) {
  return Boolean(AI_PROVIDER_PRESETS[id]?.customizable);
}

export function buildEmptyProviderForms() {
  return AI_PROVIDER_IDS.reduce((acc, id) => {
    const preset = AI_PROVIDER_PRESETS[id];
    acc[id] = {
      api_key: "",
      base_url: preset.base_url,
      chat_model: preset.chat_model,
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
      base_url: preset.customizable ? remote.base_url || preset.base_url : preset.base_url,
      chat_model: preset.customizable ? remote.chat_model || preset.chat_model : preset.chat_model,
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

export function buildSavePayload(activeProvider, form) {
  const preset = AI_PROVIDER_PRESETS[activeProvider];
  const payload = {
    active_provider: activeProvider,
    provider: activeProvider,
  };

  if (form.api_key?.trim()) {
    payload.api_key = form.api_key.trim();
  }

  if (preset.customizable) {
    payload.base_url = form.base_url;
    payload.chat_model = form.chat_model;
  } else {
    payload.base_url = preset.base_url;
    payload.chat_model = preset.chat_model;
    payload.embedding_model = preset.embedding_model || null;
  }

  return payload;
}
