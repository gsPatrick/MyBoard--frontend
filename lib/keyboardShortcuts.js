import { getActiveTenantId } from "@/api/client";
import { buildTenantScopedKey } from "@/lib/tenantStorage";

const STORAGE_KEY = "myboard_keyboard_shortcuts";

export const SHORTCUT_ACTIONS = [
  {
    id: "search.open",
    label: "Abrir pesquisa",
    description: "Buscar projetos e clientes no workspace",
    category: "Geral",
    defaultKeys: { key: "k", mod: true },
  },
  {
    id: "bordie.open",
    label: "Abrir Bordie.ia",
    description: "Paleta de comandos e ações com IA",
    category: "Geral",
    defaultKeys: { key: "i", mod: true },
  },
  {
    id: "nav.central",
    label: "Ir para Central",
    category: "Navegação",
    defaultKeys: { key: "1", mod: true },
  },
  {
    id: "nav.agenda",
    label: "Ir para Agenda",
    category: "Navegação",
    defaultKeys: { key: "a", mod: true, shift: true },
  },
  {
    id: "nav.demandas",
    label: "Ir para Demandas",
    category: "Navegação",
    defaultKeys: { key: "2", mod: true },
  },
  {
    id: "nav.board",
    label: "Ir para Board",
    category: "Navegação",
    defaultKeys: { key: "3", mod: true },
  },
  {
    id: "nav.projetos",
    label: "Ir para Projetos",
    category: "Navegação",
    defaultKeys: { key: "4", mod: true },
  },
  {
    id: "nav.clientes",
    label: "Ir para Clientes",
    category: "Navegação",
    defaultKeys: { key: "5", mod: true },
  },
  {
    id: "nav.lucro",
    label: "Ir para Lucro",
    category: "Navegação",
    defaultKeys: { key: "6", mod: true },
  },
  {
    id: "nav.settings",
    label: "Abrir configurações",
    category: "Geral",
    defaultKeys: { key: ",", mod: true },
  },
  {
    id: "modal.newClient",
    label: "Novo cliente",
    description: "Abre o modal de cadastro de cliente",
    category: "Criar",
    defaultKeys: { key: "c", mod: true, shift: true },
  },
  {
    id: "modal.newProject",
    label: "Novo projeto",
    description: "Abre o modal de cadastro de projeto",
    category: "Criar",
    defaultKeys: { key: "p", mod: true, shift: true },
  },
  {
    id: "modal.newDemand",
    label: "Nova demanda",
    description: "Abre o modal de nova demanda",
    category: "Criar",
    defaultKeys: { key: "d", mod: true, shift: true },
  },
  {
    id: "modal.newEvent",
    label: "Novo evento",
    description: "Abre o modal de agendamento na Agenda",
    category: "Agenda",
    defaultKeys: { key: "e", mod: true, shift: true },
  },
  {
    id: "agenda.today",
    label: "Agenda: ir para hoje",
    description: "Volta o calendário para a data de hoje",
    category: "Agenda",
    defaultKeys: { key: "t", mod: true, alt: true },
  },
  {
    id: "agenda.toggleView",
    label: "Agenda: Semana / Mês",
    description: "Alterna entre visão semanal e mensal",
    category: "Agenda",
    defaultKeys: { key: "v", mod: true, alt: true },
  },
  {
    id: "layout.toggleLeft",
    label: "Alternar menu lateral",
    category: "Interface",
    defaultKeys: { key: "b", mod: true, alt: true },
  },
  {
    id: "layout.toggleRight",
    label: "Alternar painel direito",
    category: "Interface",
    defaultKeys: { key: "b", mod: true, shift: true, alt: true },
  },
  {
    id: "layout.refresh",
    label: "Atualizar dados",
    category: "Geral",
    defaultKeys: { key: "r", mod: true, shift: true, alt: true },
  },
];

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function getShortcutsStorageKey() {
  return buildTenantScopedKey(STORAGE_KEY, getActiveTenantId());
}

export function createBindingFromKeys({ key, mod = false, shift = false, alt = false }) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return null;

  if (isMacPlatform()) {
    return {
      key: normalizedKey,
      meta: !!mod,
      ctrl: false,
      shift: !!shift,
      alt: !!alt,
    };
  }

  return {
    key: normalizedKey,
    meta: false,
    ctrl: !!mod,
    shift: !!shift,
    alt: !!alt,
  };
}

export function getDefaultBinding(action) {
  if (!action?.defaultKeys) return null;
  return createBindingFromKeys(action.defaultKeys);
}

export function getDefaultBindingsMap() {
  return SHORTCUT_ACTIONS.reduce((acc, action) => {
    acc[action.id] = getDefaultBinding(action);
    return acc;
  }, {});
}

export function readStoredBindings() {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(getShortcutsStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeStoredBindings(bindings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getShortcutsStorageKey(), JSON.stringify(bindings));
}

export function mergeBindings(stored = {}) {
  const defaults = getDefaultBindingsMap();
  const merged = { ...defaults };

  Object.entries(stored).forEach(([actionId, binding]) => {
    if (!SHORTCUT_ACTIONS.some((action) => action.id === actionId)) return;
    if (binding === null) {
      delete merged[actionId];
      return;
    }
    const normalized = normalizeBinding(binding);
    if (normalized) merged[actionId] = normalized;
  });

  return merged;
}

export function normalizeKey(key) {
  if (!key || typeof key !== "string") return "";
  const lower = key.toLowerCase();
  if (lower === " ") return " ";
  if (lower === "escape") return "escape";
  if (lower.length === 1) return lower;
  return lower;
}

export function normalizeBinding(binding) {
  if (!binding || typeof binding !== "object") return null;

  const key = normalizeKey(binding.key);
  if (!key) return null;

  return {
    key,
    meta: !!binding.meta,
    ctrl: !!binding.ctrl,
    shift: !!binding.shift,
    alt: !!binding.alt,
  };
}

export function bindingFromEvent(event) {
  const key = normalizeKey(event.key);
  if (!key || key === "control" || key === "meta" || key === "shift" || key === "alt") {
    return null;
  }

  return {
    key,
    meta: !!event.metaKey,
    ctrl: !!event.ctrlKey,
    shift: !!event.shiftKey,
    alt: !!event.altKey,
  };
}

export function isModifierOnlyEvent(event) {
  const key = normalizeKey(event.key);
  return ["control", "meta", "shift", "alt"].includes(key);
}

export function hasPrimaryModifier(binding) {
  if (!binding) return false;
  return isMacPlatform() ? binding.meta : binding.ctrl || binding.meta;
}

export function isValidBinding(binding) {
  if (!binding?.key) return false;
  if (!hasPrimaryModifier(binding) && !binding.alt) return false;
  return true;
}

export function bindingsEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.key === b.key &&
    !!a.meta === !!b.meta &&
    !!a.ctrl === !!b.ctrl &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

export function matchesBinding(event, binding) {
  if (!binding?.key) return false;

  const eventKey = normalizeKey(event.key);
  if (eventKey !== binding.key) return false;

  return (
    !!event.metaKey === !!binding.meta &&
    !!event.ctrlKey === !!binding.ctrl &&
    !!event.shiftKey === !!binding.shift &&
    !!event.altKey === !!binding.alt
  );
}

export function formatBinding(binding) {
  if (!binding?.key) return "Sem atalho";

  const parts = [];
  if (isMacPlatform()) {
    if (binding.ctrl) parts.push("⌃");
    if (binding.alt) parts.push("⌥");
    if (binding.shift) parts.push("⇧");
    if (binding.meta) parts.push("⌘");
  } else {
    if (binding.ctrl) parts.push("Ctrl");
    if (binding.alt) parts.push("Alt");
    if (binding.shift) parts.push("Shift");
    if (binding.meta) parts.push("Win");
  }

  parts.push(formatKeyLabel(binding.key));
  return isMacPlatform() ? parts.join("") : parts.join("+");
}

function formatKeyLabel(key) {
  if (key === " ") return "Space";
  if (key === "escape") return "Esc";
  if (key === ",") return ",";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function findBindingConflict(bindings, actionId, candidate) {
  if (!candidate) return null;

  return Object.entries(bindings).find(([id, binding]) => {
    if (id === actionId) return false;
    return bindingsEqual(binding, candidate);
  });
}

export function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function getActionById(actionId) {
  return SHORTCUT_ACTIONS.find((action) => action.id === actionId) || null;
}

// Backward-compatible helpers used elsewhere
export function getSearchShortcutLabel(bindings) {
  const binding = bindings?.["search.open"] || getDefaultBinding(getActionById("search.open"));
  return formatBinding(binding);
}

export function isSearchShortcut(event, bindings) {
  const binding = bindings?.["search.open"] || getDefaultBinding(getActionById("search.open"));
  return matchesBinding(event, binding);
}
