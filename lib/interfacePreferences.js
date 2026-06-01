export const CONTENT_WIDTH = {
  CONSTRAINED: "constrained",
  FULL: "full",
};

export const CONTENT_WIDTH_OPTIONS = [
  {
    id: CONTENT_WIDTH.CONSTRAINED,
    label: "Centralizado",
    description: "Conteúdo limitado a 1440px — ideal para leitura.",
  },
  {
    id: CONTENT_WIDTH.FULL,
    label: "Largura total",
    description: "Usa toda a área disponível entre as sidebars.",
  },
];

export const THEME_PREFERENCE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const THEME_OPTIONS = [
  {
    id: THEME_PREFERENCE.LIGHT,
    label: "Claro",
    description: "Fundo claro em todo o workspace.",
  },
  {
    id: THEME_PREFERENCE.DARK,
    label: "Escuro",
    description: "Fundo escuro para ambientes com pouca luz.",
  },
  {
    id: THEME_PREFERENCE.SYSTEM,
    label: "Sistema",
    description: "Segue a preferência do seu dispositivo.",
  },
];

export const RIGHT_PANEL_SECTIONS = {
  notifications: {
    id: "notifications",
    label: "Notificações",
    description: "Alertas e avisos recentes.",
  },
  activities: {
    id: "activities",
    label: "Atividades",
    description: "Linha do tempo do workspace.",
  },
  clients: {
    id: "clients",
    label: "Clientes",
    description: "Acesso rápido aos contatos.",
  },
};

export const DEFAULT_RIGHT_PANEL_SECTIONS = {
  notifications: true,
  activities: true,
  clients: true,
};

export function normalizeContentWidth(value) {
  if (value === CONTENT_WIDTH.FULL) return CONTENT_WIDTH.FULL;
  return CONTENT_WIDTH.CONSTRAINED;
}

export function normalizeThemePreference(value) {
  if (value === THEME_PREFERENCE.DARK || value === THEME_PREFERENCE.SYSTEM) return value;
  return THEME_PREFERENCE.LIGHT;
}

export function normalizeRightPanelSections(value) {
  const base = { ...DEFAULT_RIGHT_PANEL_SECTIONS };
  if (!value || typeof value !== "object") return base;

  return {
    notifications: value.notifications !== false,
    activities: value.activities !== false,
    clients: value.clients !== false,
  };
}

export function resolveThemePreference(preference) {
  if (preference === THEME_PREFERENCE.DARK) return "dark";
  if (preference === THEME_PREFERENCE.LIGHT) return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}
