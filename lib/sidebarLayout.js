export const SIDEBAR_MODE = {
  OPEN: "open",
  COMPACT: "compact",
  HIDDEN: "hidden",
};

export const SIDEBAR_COLLAPSE_STYLE = {
  COMPACT: "compact",
  HIDDEN: "hidden",
};

export const SIDEBAR_COLLAPSE_OPTIONS = [
  {
    id: SIDEBAR_COLLAPSE_STYLE.COMPACT,
    label: "Minimalista",
    description: "Mantém uma faixa fina com avatares e ícones.",
  },
  {
    id: SIDEBAR_COLLAPSE_STYLE.HIDDEN,
    label: "Oculta",
    description: "Fecha completamente e libera espaço no centro.",
  },
];

export function isSidebarVisible(mode) {
  return mode === SIDEBAR_MODE.OPEN || mode === SIDEBAR_MODE.COMPACT;
}

export function isSidebarExpanded(mode) {
  return mode === SIDEBAR_MODE.OPEN;
}

export function normalizeSidebarMode(value) {
  if (value === SIDEBAR_MODE.COMPACT || value === SIDEBAR_MODE.HIDDEN) return value;
  return SIDEBAR_MODE.OPEN;
}

export function normalizeCollapseStyle(value) {
  if (value === SIDEBAR_COLLAPSE_STYLE.COMPACT) return SIDEBAR_COLLAPSE_STYLE.COMPACT;
  return SIDEBAR_COLLAPSE_STYLE.HIDDEN;
}
