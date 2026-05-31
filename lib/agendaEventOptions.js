export const AGENDA_EVENT_KINDS = [
  {
    id: "meeting",
    label: "Reunião",
    description: "Encontro com cliente, time ou parceiro.",
  },
  {
    id: "commitment",
    label: "Compromisso",
    description: "Tarefa, prazo ou lembrete pessoal/profissional.",
  },
];

export const AGENDA_LINK_MODES = [
  {
    id: "standalone",
    label: "Avulso",
    hint: "Sem vínculo com cliente ou projeto.",
  },
  {
    id: "existing_client",
    label: "Cliente existente",
    hint: "Vincula apenas ao cliente.",
  },
  {
    id: "new_client",
    label: "Novo cliente",
    hint: "Cadastra o cliente e vincula o evento.",
  },
  {
    id: "existing_project",
    label: "Projeto existente",
    hint: "Vincula automaticamente ao cliente do projeto.",
  },
  {
    id: "new_with_client",
    label: "Novo projeto + cliente existente",
    hint: "Cria o projeto na hora e agenda o evento.",
  },
  {
    id: "new_avulso",
    label: "Novo cliente e projeto",
    hint: "Cadastra cliente, projeto e evento juntos.",
  },
];

export const AGENDA_LINK_SCOPES = [
  {
    id: "standalone",
    label: "Avulso",
    description: "Sem vínculo com cliente ou projeto.",
  },
  {
    id: "client",
    label: "Cliente",
    description: "Vincule a um cliente existente ou novo.",
  },
  {
    id: "project",
    label: "Projeto",
    description: "Vincule a um projeto existente ou novo.",
  },
];

export const AGENDA_LINK_TARGETS = [
  {
    id: "existing",
    label: "Existente",
    description: "Selecione na lista.",
  },
  {
    id: "new",
    label: "Novo",
    description: "Cadastre agora.",
  },
];

export const AGENDA_CLIENT_PICKER_NEW = "__new_client__";

export const AGENDA_COLOR_TAGS = [
  { id: "neutral", label: "Normal", color: "#8b8b8b" },
  { id: "blue", label: "Trabalho", color: "#3b82f6" },
  { id: "green", label: "Baixa", color: "#22c55e" },
  { id: "yellow", label: "Média", color: "#ca8a04" },
  { id: "orange", label: "Alta", color: "#f97316" },
  { id: "red", label: "Urgente", color: "#ef4444" },
  { id: "purple", label: "Pessoal", color: "#a855f7" },
];

export const AGENDA_EVENT_STATUSES = [
  { id: "scheduled", label: "Agendado" },
  { id: "completed", label: "Concluído" },
  { id: "cancelled", label: "Cancelado" },
];

export const AGENDA_REMINDER_OPTIONS = [
  { value: "", label: "Sem lembrete" },
  { value: "5", label: "5 minutos antes" },
  { value: "15", label: "15 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "1440", label: "1 dia antes" },
];

export function getEventKind(event) {
  const kind = event?.metadata?.event_kind;
  return AGENDA_EVENT_KINDS.some((item) => item.id === kind) ? kind : "meeting";
}

export function getEventKindLabel(event) {
  return AGENDA_EVENT_KINDS.find((item) => item.id === getEventKind(event))?.label || "Reunião";
}

export function getEventColorTagId(event) {
  const tagId = event?.metadata?.color_tag;
  return AGENDA_COLOR_TAGS.some((item) => item.id === tagId) ? tagId : "neutral";
}

export function getEventColorTag(event) {
  return AGENDA_COLOR_TAGS.find((item) => item.id === getEventColorTagId(event)) || AGENDA_COLOR_TAGS[0];
}

export function getEventAccentColor(event) {
  return getEventColorTag(event).color;
}

export function getEventStatus(event) {
  const status = event?.status;
  return AGENDA_EVENT_STATUSES.some((item) => item.id === status) ? status : "scheduled";
}

export function getEventStatusLabel(event) {
  return AGENDA_EVENT_STATUSES.find((item) => item.id === getEventStatus(event))?.label || "Agendado";
}

export function isEventInactive(event) {
  const status = getEventStatus(event);
  return status === "cancelled" || status === "completed";
}

export function canDragEvent(event) {
  if (getEventStatus(event) !== "scheduled") return false;
  if (event?.all_day) return false;
  const scheduleMode = event?.metadata?.schedule_mode;
  return scheduleMode === "timed" || (!scheduleMode && !event?.all_day);
}

export function inferLinkModeFromEvent(event) {
  const stored = event?.metadata?.link_mode;
  if (stored && AGENDA_LINK_MODES.some((item) => item.id === stored)) return stored;
  if (event?.project_id) return "existing_project";
  if (event?.client_id) return "existing_client";
  return "standalone";
}

export function inferLinkScopeFromEvent(event) {
  const mode = inferLinkModeFromEvent(event);
  if (mode === "standalone") return "standalone";
  if (mode === "existing_client" || mode === "new_client") return "client";
  return "project";
}

export function inferLinkTargetFromEvent(event) {
  const mode = inferLinkModeFromEvent(event);
  if (mode === "new_client" || mode === "new_with_client" || mode === "new_avulso") {
    return "new";
  }
  return "existing";
}

export function resolveLinkModeFromForm(form) {
  if (form.linkScope === "standalone") return "standalone";

  if (form.linkScope === "client") {
    return form.linkTarget === "new" ? "new_client" : "existing_client";
  }

  if (form.linkTarget === "existing") return "existing_project";
  if (form.clientPicker === AGENDA_CLIENT_PICKER_NEW) return "new_avulso";
  return "new_with_client";
}

export function getInitialClientPicker(editingEvent) {
  const mode = inferLinkModeFromEvent(editingEvent);
  if (mode === "new_avulso") return AGENDA_CLIENT_PICKER_NEW;
  if (mode === "new_with_client") return editingEvent.client_id || "";
  return editingEvent.client_id || "";
}

export function getInitialProjectPicker(editingEvent) {
  const mode = inferLinkModeFromEvent(editingEvent);
  if (mode === "existing_project") return editingEvent.project_id || "";
  return "";
}
