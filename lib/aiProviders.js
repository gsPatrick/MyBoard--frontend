export const AI_PROVIDER_IDS = ["gpt", "claude", "gemini", "custom"];

export const CUSTOM_API_SURFACES = [
  { id: "openai", label: "OpenAI (GPT)", defaultModel: "gpt-4o-mini" },
  { id: "anthropic", label: "Claude", defaultModel: "claude-sonnet-4-5-20250929" },
  { id: "gemini", label: "Gemini", defaultModel: "gemini-2.5-pro" },
];

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
    api_surface: "openai",
    base_url: "http://localhost:8317",
    chat_model: "gpt-4o-mini",
    chat_model_label: "Personalizado",
    embedding_model: "text-embedding-004",
    key_hint: "your-api-key-1",
    gemini_key_hint: "AIza...",
    docs_url: null,
    description:
      "CLIProxyAPI: escolha superfície (GPT / Claude / Gemini), endpoint, token do proxy e model id.",
    accent: "#8b5cf6",
  },
};

export function getCustomSurfaceMeta(surfaceId) {
  return CUSTOM_API_SURFACES.find((item) => item.id === surfaceId) || CUSTOM_API_SURFACES[0];
}

export function isCustomizableProvider(id) {
  return Boolean(AI_PROVIDER_PRESETS[id]?.customizable);
}

export function buildEmptyProviderForms() {
  return AI_PROVIDER_IDS.reduce((acc, id) => {
    const preset = AI_PROVIDER_PRESETS[id];
    acc[id] = {
      api_key: "",
      gemini_api_key: "",
      api_surface: preset.api_surface || "openai",
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
      gemini_api_key: "",
      api_surface: preset.customizable
        ? remote.api_surface || preset.api_surface || "openai"
        : preset.api_surface || "openai",
      base_url: preset.customizable ? remote.base_url || preset.base_url : preset.base_url,
      chat_model: preset.customizable ? remote.chat_model || preset.chat_model : preset.chat_model,
      embedding_model: preset.embedding_model || "",
    };
    meta[id] = {
      has_api_key: Boolean(remote.has_api_key),
      api_key_masked: remote.api_key_masked,
      has_gemini_api_key: Boolean(remote.has_gemini_api_key),
      gemini_api_key_masked: remote.gemini_api_key_masked || null,
      api_surface: remote.api_surface || preset.api_surface || null,
      api_surface_label: remote.api_surface_label || null,
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
    payload.api_surface = form.api_surface || "openai";
    payload.chat_model = form.chat_model;
    if (form.gemini_api_key?.trim()) {
      payload.gemini_api_key = form.gemini_api_key.trim();
    }
  } else {
    payload.base_url = preset.base_url;
    payload.chat_model = preset.chat_model;
    payload.embedding_model = preset.embedding_model || null;
  }

  return payload;
}
