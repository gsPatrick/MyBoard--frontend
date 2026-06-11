"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button/Button";
import Modal, { ModalActions } from "@/components/Modal/Modal";
import Input from "@/components/Input/Input";
import { createClient } from "@/services/clients";
import { createEvent, deleteEvent, updateEvent } from "@/services/agenda";
import { createProject } from "@/services/projects";
import { listClients } from "@/services/clients";
import { listProjects } from "@/services/projects";
import { normalizeListResponse } from "@/lib/apiList";
import {
  AGENDA_CLIENT_PICKER_NEW,
  AGENDA_COLOR_TAGS,
  AGENDA_EVENT_KINDS,
  AGENDA_EVENT_STATUSES,
  AGENDA_LINK_SCOPES,
  AGENDA_LINK_TARGETS,
  AGENDA_REMINDER_OPTIONS,
  getInitialClientPicker,
  getInitialProjectPicker,
  inferLinkScopeFromEvent,
  inferLinkTargetFromEvent,
  resolveLinkModeFromForm,
} from "@/lib/agendaEventOptions";
import {
  AGENDA_SCHEDULE_MODES,
  APP_TIMEZONE,
  combineDateAndTime,
  getDefaultScheduleSlot,
  getMinScheduleDateInput,
  getMinTimeInputForDate,
  hasScheduleDateTimeChanged,
  inferScheduleModeFromEvent,
  isPastHourSlot,
  isScheduleInPast,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/agendaDates";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import formStyles from "../shared/ModalForm.module.css";
import styles from "./AgendaEventModal.module.css";

const DEFAULT_DURATION_MINUTES = 60;

function addMinutesToTime(timeValue, minutes) {
  const [hours, mins] = timeValue.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function getInitialFormState(initialSlot, editingEvent) {
  if (editingEvent) {
    const startSource = editingEvent.starts_at_display?.local || editingEvent.starts_at;
    const endSource = editingEvent.ends_at_display?.local || editingEvent.ends_at;
    const startDate = startSource ? new Date(startSource) : new Date();
    const endDate = endSource ? new Date(endSource) : null;

    return {
      title: editingEvent.title || "",
      description: editingEvent.description || "",
      date: toDateInputValue(startDate),
      startTime: inferScheduleModeFromEvent(editingEvent) === "timed" ? toTimeInputValue(startDate) : "09:00",
      endTime:
        endDate && inferScheduleModeFromEvent(editingEvent) === "timed"
          ? toTimeInputValue(endDate)
          : addMinutesToTime(toTimeInputValue(startDate), DEFAULT_DURATION_MINUTES),
      scheduleMode: inferScheduleModeFromEvent(editingEvent),
      eventKind: editingEvent.metadata?.event_kind === "commitment" ? "commitment" : "meeting",
      linkScope: inferLinkScopeFromEvent(editingEvent),
      linkTarget: inferLinkTargetFromEvent(editingEvent),
      projectPicker: getInitialProjectPicker(editingEvent),
      clientPicker: getInitialClientPicker(editingEvent),
      colorTag: editingEvent.metadata?.color_tag || "neutral",
      projectId: editingEvent.project_id || "",
      clientId: editingEvent.client_id || "",
      newProjectName: editingEvent.metadata?.new_project_name || "",
      newClientName: editingEvent.metadata?.new_client_name || "",
      status: editingEvent.status || "scheduled",
      reminderMinutes:
        editingEvent.reminder_minutes_before != null
          ? String(editingEvent.reminder_minutes_before)
          : "",
    };
  }

  const safeSlot = getDefaultScheduleSlot(initialSlot?.date || new Date());
  let startTime = initialSlot?.time || safeSlot.time;

  if (
    initialSlot?.dateKey &&
    initialSlot?.time &&
    isPastHourSlot(initialSlot.dateKey, Number.parseInt(initialSlot.time.split(":")[0], 10))
  ) {
    startTime = safeSlot.time;
  }

  return {
    title: "",
    description: "",
    date: toDateInputValue(safeSlot.date),
    startTime,
    endTime: addMinutesToTime(startTime, DEFAULT_DURATION_MINUTES),
    scheduleMode: "timed",
    eventKind: "meeting",
    linkScope: "standalone",
    linkTarget: "existing",
    projectPicker: "",
    clientPicker: "",
    colorTag: "blue",
    projectId: "",
    clientId: "",
    newProjectName: "",
    newClientName: "",
    status: "scheduled",
    reminderMinutes: "",
  };
}

export default function AgendaEventModal({
  isOpen,
  onClose,
  onSaved,
  initialSlot = null,
  editingEvent = null,
}) {
  const [form, setForm] = useState(() => getInitialFormState(initialSlot, editingEvent));
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectPicker),
    [projects, form.projectPicker]
  );

  const linkMode = useMemo(() => resolveLinkModeFromForm(form), [form]);
  const selectedColorTag = AGENDA_COLOR_TAGS.find((tag) => tag.id === form.colorTag);
  const isCreatingClient = form.linkScope === "client" && form.linkTarget === "new";
  const isCreatingProject = form.linkScope === "project" && form.linkTarget === "new";
  const showLinkTarget = form.linkScope === "client" || form.linkScope === "project";

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialFormState(initialSlot, editingEvent));
    setError("");
  }, [isOpen, initialSlot, editingEvent]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        await ensureActiveTenant();
        const [projectsData, clientsData] = await Promise.all([
          listProjects({ limit: 200 }),
          listClients({ limit: 200 }),
        ]);
        setProjects(normalizeListResponse(projectsData));
        setClients(normalizeListResponse(clientsData));
      } catch {
        setProjects([]);
        setClients([]);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [isOpen]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLinkScope(nextScope) {
    setForm((current) => ({
      ...current,
      linkScope: nextScope,
      linkTarget: "existing",
      projectPicker: "",
      clientPicker: "",
      projectId: "",
      clientId: "",
      newProjectName: "",
      newClientName: "",
    }));
  }

  function updateLinkTarget(nextTarget) {
    setForm((current) => ({
      ...current,
      linkTarget: nextTarget,
      projectPicker: "",
      clientPicker: "",
      projectId: "",
      clientId: "",
      newProjectName: "",
      newClientName: "",
    }));
  }

  function handleProjectPickerChange(value) {
    const project = projects.find((item) => item.id === value);

    setForm((current) => ({
      ...current,
      projectPicker: value,
      projectId: value,
      clientId: project?.client_id || project?.client?.id || "",
    }));
  }

  function handleClientPickerChange(value) {
    setForm((current) => ({
      ...current,
      clientPicker: value,
      clientId: value === AGENDA_CLIENT_PICKER_NEW ? "" : value,
      newClientName: value === AGENDA_CLIENT_PICKER_NEW ? current.newClientName : "",
    }));
  }

  function validateForm() {
    if (!form.title.trim()) return "Informe um título";
    if (!form.date) return "Informe a data";

    if (form.scheduleMode === "timed" && (!form.startTime || !form.endTime)) {
      return "Informe horário de início e fim";
    }

    if (form.linkScope === "client") {
      if (form.linkTarget === "existing" && !form.clientPicker) {
        return "Selecione um cliente";
      }
      if (form.linkTarget === "new" && !form.newClientName.trim()) {
        return "Informe o nome do cliente";
      }
    }

    if (form.linkScope === "project") {
      if (form.linkTarget === "existing" && !form.projectPicker) {
        return "Selecione um projeto";
      }
      if (form.linkTarget === "new" && !editingEvent) {
        if (form.clientPicker === AGENDA_CLIENT_PICKER_NEW && !form.newClientName.trim()) {
          return "Informe o nome do cliente";
        }
        if (form.clientPicker !== AGENDA_CLIENT_PICKER_NEW && !form.clientPicker) {
          return "Selecione um cliente";
        }
        if (!form.newProjectName.trim()) return "Informe o nome do projeto";
      }
    }

    const usesWholeDay = form.scheduleMode === "all_day" || form.scheduleMode === "no_deadline";

    if (
      isScheduleInPast(form.date, form.startTime, usesWholeDay) &&
      (!editingEvent || hasScheduleDateTimeChanged(form, editingEvent))
    ) {
      return "Não é possível agendar em data ou horário passado";
    }

    if (form.scheduleMode === "timed" && form.endTime <= form.startTime) {
      return "Horário de fim deve ser depois do início";
    }

    if (
      form.scheduleMode === "timed" &&
      isScheduleInPast(form.date, form.endTime, false) &&
      (!editingEvent || hasScheduleDateTimeChanged(form, editingEvent))
    ) {
      return "Horário de fim não pode estar no passado";
    }

    return "";
  }

  function buildSchedulePayload() {
    const startsAt = `${form.date}T00:00:00`;

    if (form.scheduleMode === "all_day") {
      return {
        starts_at: startsAt,
        ends_at: `${form.date}T23:59:59`,
        all_day: true,
      };
    }

    if (form.scheduleMode === "no_deadline") {
      return {
        starts_at: startsAt,
        ends_at: null,
        all_day: true,
      };
    }

    return {
      starts_at: combineDateAndTime(form.date, form.startTime),
      ends_at: combineDateAndTime(form.date, form.endTime),
      all_day: false,
    };
  }

  async function resolveLinks() {
    let projectId = null;
    let clientId = null;

    if (linkMode === "new_client" && !editingEvent) {
      const client = await createClient({
        name: form.newClientName.trim(),
        status: "active",
      });
      clientId = client.id;
    }

    if (linkMode === "existing_client") {
      clientId = form.clientPicker || null;
    }

    if (linkMode === "new_with_client" && !editingEvent) {
      const project = await createProject({
        name: form.newProjectName.trim(),
        client_id: form.clientPicker,
        status: "in_progress",
        start_date: form.date,
      });
      projectId = project.id;
      clientId = form.clientPicker;
    }

    if (linkMode === "new_avulso" && !editingEvent) {
      const client = await createClient({
        name: form.newClientName.trim(),
        status: "active",
      });
      clientId = client.id;

      const project = await createProject({
        name: form.newProjectName.trim(),
        client_id: client.id,
        status: "in_progress",
        start_date: form.date,
      });
      projectId = project.id;
    }

    if (linkMode === "existing_project" && selectedProject) {
      projectId = selectedProject.id;
      clientId = selectedProject.client_id || selectedProject.client?.id || null;
    }

    return { projectId, clientId };
  }

  function buildMetadata() {
    return {
      event_kind: form.eventKind,
      link_mode: linkMode,
      color_tag: form.colorTag,
      schedule_mode: form.scheduleMode,
      new_project_name: isCreatingProject ? form.newProjectName.trim() || null : null,
      new_client_name:
        isCreatingClient || (isCreatingProject && form.clientPicker === AGENDA_CLIENT_PICKER_NEW)
          ? form.newClientName.trim() || null
          : null,
    };
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await ensureActiveTenant();

      const schedule = buildSchedulePayload();

      if (editingEvent) {
        let projectId = null;
        let clientId = null;

        if (linkMode === "existing_project" && selectedProject) {
          projectId = selectedProject.id;
          clientId = selectedProject.client_id || selectedProject.client?.id || null;
        } else if (linkMode === "existing_client") {
          clientId = form.clientPicker || null;
        } else if (linkMode === "standalone") {
          projectId = null;
          clientId = null;
        } else {
          projectId = form.projectId || null;
          clientId = form.clientId || null;
        }

        await updateEvent(editingEvent.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          starts_at: schedule.starts_at,
          ends_at: schedule.ends_at,
          all_day: schedule.all_day,
          timezone: APP_TIMEZONE,
          project_id: projectId,
          client_id: clientId,
          status: form.status,
          reminder_minutes_before: form.reminderMinutes
            ? Number(form.reminderMinutes)
            : null,
          metadata: buildMetadata(),
        });

        showSuccessToast("Evento atualizado");
      } else {
        const links = await resolveLinks();
        await createEvent({
          title: form.title.trim(),
          description: form.description.trim() || null,
          starts_at: schedule.starts_at,
          ends_at: schedule.ends_at,
          all_day: schedule.all_day,
          timezone: APP_TIMEZONE,
          project_id: links.projectId,
          client_id: links.clientId,
          status: form.status,
          reminder_minutes_before: form.reminderMinutes
            ? Number(form.reminderMinutes)
            : null,
          metadata: buildMetadata(),
        });

        showSuccessToast(
          isCreatingProject || isCreatingClient
            ? "Evento e cadastro criados"
            : "Evento agendado"
        );
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Não foi possível salvar");
      showErrorToast(err.message || "Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!editingEvent?.id) return;
    if (!window.confirm(`Excluir "${editingEvent.title}"?`)) return;

    setLoading(true);
    try {
      await deleteEvent(editingEvent.id);
      showSuccessToast("Evento excluído");
      onSaved?.();
      onClose();
    } catch (err) {
      showErrorToast(err.message || "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  const modalTitle = editingEvent ? "Editar evento" : "Novo evento";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={
        <>
          {editingEvent && (
            <Button variant="ghost" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
          )}
          <ModalActions
            onCancel={onClose}
            onConfirm={handleSubmit}
            confirmLabel={loading ? "Salvando..." : editingEvent ? "Salvar" : "Agendar"}
          />
        </>
      }
    >
      <div className={formStyles.form}>
        <div className={styles.formBody}>
          <div className={styles.kindToggle}>
            {AGENDA_EVENT_KINDS.map((kind) => (
              <label
                key={kind.id}
                className={`${styles.kindOption} ${
                  form.eventKind === kind.id ? styles.kindOptionActive : ""
                }`}
              >
                <input
                  type="radio"
                  name="event-kind"
                  checked={form.eventKind === kind.id}
                  onChange={() => updateField("eventKind", kind.id)}
                />
                <span className={styles.kindLabel}>{kind.label}</span>
                <span className={styles.kindDescription}>{kind.description}</span>
              </label>
            ))}
          </div>

          <Input
            label="Título"
            placeholder={
              form.eventKind === "commitment"
                ? "Ex.: Enviar proposta comercial"
                : "Ex.: Kickoff com cliente"
            }
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="agenda-description">
              Notas <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="agenda-description"
              className={styles.textarea}
              rows={2}
              placeholder="Pauta ou observações..."
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="agenda-color-tag">
              Cor / prioridade
            </label>
            <div className={styles.colorSelectWrap}>
              <span
                className={styles.colorDot}
                style={{ backgroundColor: selectedColorTag?.color || "#8b8b8b" }}
                aria-hidden="true"
              />
              <select
                id="agenda-color-tag"
                className={`${formStyles.select} ${styles.colorSelect}`}
                value={form.colorTag}
                onChange={(event) => updateField("colorTag", event.target.value)}
              >
                {AGENDA_COLOR_TAGS.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={formStyles.row}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="agenda-status">
                Status
              </label>
              <select
                id="agenda-status"
                className={formStyles.select}
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                {AGENDA_EVENT_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="agenda-reminder">
                Lembrete
              </label>
              <select
                id="agenda-reminder"
                className={formStyles.select}
                value={form.reminderMinutes}
                onChange={(event) => updateField("reminderMinutes", event.target.value)}
              >
                {AGENDA_REMINDER_OPTIONS.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <Input
              label="Data"
              type="date"
              value={form.date}
              min={getMinScheduleDateInput()}
              onChange={(event) => updateField("date", event.target.value)}
            />

            <div className={formStyles.field}>
              <span className={formStyles.label}>Tipo de agenda</span>
              <div className={`${styles.kindToggle} ${styles.kindToggleThree}`} role="radiogroup" aria-label="Tipo de agenda">
                {AGENDA_SCHEDULE_MODES.map((mode) => (
                  <label
                    key={mode.id}
                    className={`${styles.kindOption} ${
                      form.scheduleMode === mode.id ? styles.kindOptionActive : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="schedule-mode"
                      checked={form.scheduleMode === mode.id}
                      onChange={() => updateField("scheduleMode", mode.id)}
                    />
                    <span className={styles.kindLabel}>{mode.label}</span>
                    <span className={styles.kindDescription}>{mode.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.scheduleMode === "timed" && (
              <div className={styles.timeRow}>
                <Input
                  label="Início"
                  type="time"
                  value={form.startTime}
                  min={getMinTimeInputForDate(form.date)}
                  onChange={(event) => updateField("startTime", event.target.value)}
                />
                <Input
                  label="Fim"
                  type="time"
                  value={form.endTime}
                  min={getMinTimeInputForDate(form.date) || form.startTime}
                  onChange={(event) => updateField("endTime", event.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={formStyles.field}>
              <span className={formStyles.label}>Vínculo</span>
              <div
                className={`${styles.kindToggle} ${styles.kindToggleThree}`}
                role="radiogroup"
                aria-label="Vínculo do evento"
              >
                {AGENDA_LINK_SCOPES.map((scope) => (
                  <label
                    key={scope.id}
                    className={`${styles.kindOption} ${
                      form.linkScope === scope.id ? styles.kindOptionActive : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="link-scope"
                      checked={form.linkScope === scope.id}
                      onChange={() => updateLinkScope(scope.id)}
                    />
                    <span className={styles.kindLabel}>{scope.label}</span>
                    <span className={styles.kindDescription}>{scope.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {showLinkTarget && (
              <div className={formStyles.field}>
                <span className={formStyles.label}>
                  {form.linkScope === "client" ? "Cliente" : "Projeto"}
                </span>
                <div className={styles.kindToggle} role="radiogroup">
                  {AGENDA_LINK_TARGETS.map((target) => {
                    const disabled = !!editingEvent && target.id === "new";

                    return (
                      <label
                        key={target.id}
                        className={`${styles.kindOption} ${
                          form.linkTarget === target.id ? styles.kindOptionActive : ""
                        } ${disabled ? styles.kindOptionDisabled : ""}`}
                      >
                        <input
                          type="radio"
                          name="link-target"
                          checked={form.linkTarget === target.id}
                          disabled={disabled}
                          onChange={() => updateLinkTarget(target.id)}
                        />
                        <span className={styles.kindLabel}>{target.label}</span>
                        <span className={styles.kindDescription}>{target.description}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {form.linkScope === "client" && form.linkTarget === "existing" && (
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="agenda-client-existing">
                  Selecionar cliente
                </label>
                <select
                  id="agenda-client-existing"
                  className={formStyles.select}
                  value={form.clientPicker}
                  onChange={(event) => handleClientPickerChange(event.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Carregando clientes..." : "Selecione um cliente"}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.linkScope === "client" && form.linkTarget === "new" && !editingEvent && (
              <Input
                label="Nome do cliente"
                placeholder="Ex.: Empresa Nova Ltda"
                value={form.newClientName}
                onChange={(event) => updateField("newClientName", event.target.value)}
              />
            )}

            {form.linkScope === "project" && form.linkTarget === "existing" && (
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="agenda-project-existing">
                  Selecionar projeto
                </label>
                <select
                  id="agenda-project-existing"
                  className={formStyles.select}
                  value={form.projectPicker}
                  onChange={(event) => handleProjectPickerChange(event.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">
                    {loadingOptions ? "Carregando projetos..." : "Selecione um projeto"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.client?.name ? ` · ${project.client.name}` : ""}
                    </option>
                  ))}
                </select>
                {selectedProject && (
                  <span className={formStyles.hint}>
                    Cliente vinculado: {selectedProject.client?.name || "Sem cliente"}
                  </span>
                )}
              </div>
            )}

            {form.linkScope === "project" && form.linkTarget === "new" && !editingEvent && (
              <div className={styles.conditionalBlock}>
                <div className={formStyles.field}>
                  <label className={formStyles.label} htmlFor="agenda-project-client">
                    Cliente do projeto
                  </label>
                  <select
                    id="agenda-project-client"
                    className={formStyles.select}
                    value={form.clientPicker}
                    onChange={(event) => handleClientPickerChange(event.target.value)}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? "Carregando clientes..." : "Selecione um cliente"}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                    <option value={AGENDA_CLIENT_PICKER_NEW}>+ Novo cliente</option>
                  </select>
                </div>

                {form.clientPicker === AGENDA_CLIENT_PICKER_NEW && (
                  <Input
                    label="Nome do cliente"
                    placeholder="Ex.: Empresa Nova Ltda"
                    value={form.newClientName}
                    onChange={(event) => updateField("newClientName", event.target.value)}
                  />
                )}

                <Input
                  label="Nome do projeto"
                  placeholder="Ex.: Website institucional"
                  value={form.newProjectName}
                  onChange={(event) => updateField("newProjectName", event.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {error && <p className={formStyles.error}>{error}</p>}
      </div>
    </Modal>
  );
}
