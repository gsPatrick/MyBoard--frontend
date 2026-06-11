"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import { fetchAiProxyModels, getWorkspaceSettings, testAiConnection, updateAiSettings } from "@/services/settings";
import { getStoredUser } from "@/services/client";
import {
  AI_PROVIDER_IDS,
  AI_PROVIDER_PRESETS,
  buildEmptyProviderForms,
  buildSavePayload,
  isCustomizableProvider,
  mapAiSettingsToState,
} from "@/lib/aiProviders";
import { groupProxyModels, pickDefaultProxyModel } from "@/lib/proxyModels";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import AiProviderTabs from "./AiProviderTabs";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./AiSettingsPanel.module.css";

export default function AiSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeProvider, setActiveProvider] = useState("gpt");
  const [forms, setForms] = useState(buildEmptyProviderForms());
  const [meta, setMeta] = useState({});
  const [configured, setConfigured] = useState(false);
  const [proxyModels, setProxyModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);
  const providerList = useMemo(() => AI_PROVIDER_IDS.map((id) => AI_PROVIDER_PRESETS[id]), []);
  const preset = AI_PROVIDER_PRESETS[activeProvider];
  const activeMeta = meta[activeProvider] || {};
  const isCustom = isCustomizableProvider(activeProvider);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceSettings();
      const mapped = mapAiSettingsToState(data?.ai || {});
      setActiveProvider(mapped.activeProvider);
      setForms(mapped.forms);
      setMeta(mapped.meta);
      setConfigured(mapped.configured);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar configurações de IA.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customForm = forms.custom;
  const customMeta = meta.custom || {};
  const groupedProxyModels = useMemo(() => groupProxyModels(proxyModels), [proxyModels]);

  const canFetchProxyModels = Boolean(
    isCustom &&
      customForm.base_url?.trim() &&
      (customForm.api_key?.trim() || customMeta.has_api_key)
  );

  const loadProxyModels = useCallback(async () => {
    if (!canFetchProxyModels) {
      setProxyModels([]);
      setModelsError("");
      return;
    }

    setModelsLoading(true);
    setModelsError("");

    try {
      const data = await fetchAiProxyModels({
        base_url: customForm.base_url.trim(),
        api_key: customForm.api_key?.trim() || undefined,
      });
      const models = data?.models || [];
      setProxyModels(models);

      const ids = new Set(models.map((item) => item.id));
      setForms((currentForms) => {
        const current = currentForms.custom.chat_model;
        if (!models.length || (current && ids.has(current))) {
          return currentForms;
        }
        return {
          ...currentForms,
          custom: {
            ...currentForms.custom,
            chat_model: pickDefaultProxyModel(models),
          },
        };
      });
    } catch (error) {
      setProxyModels([]);
      setModelsError(error.message || "Não foi possível carregar modelos do proxy.");
    } finally {
      setModelsLoading(false);
    }
  }, [canFetchProxyModels, customForm.api_key, customForm.base_url]);

  useEffect(() => {
    if (!isCustom) return undefined;
    const timer = window.setTimeout(() => {
      loadProxyModels();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isCustom, loadProxyModels]);

  function updateField(field, value) {
    setForms((current) => ({
      ...current,
      [activeProvider]: {
        ...current[activeProvider],
        [field]: value,
      },
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit) return;

    const current = forms[activeProvider];
    setSaving(true);

    try {
      const updated = await updateAiSettings(buildSavePayload(activeProvider, current));
      const mapped = mapAiSettingsToState(updated);
      setActiveProvider(mapped.activeProvider);
      setForms((prev) => ({
        ...mapped.forms,
        [activeProvider]: {
          ...mapped.forms[activeProvider],
          api_key: "",
        },
      }));
      setMeta(mapped.meta);
      setConfigured(mapped.configured);
      showSuccessToast(`${preset.label} salvo como provedor ativo.`);
      window.dispatchEvent(new CustomEvent("myboard:ai-settings-updated"));
    } catch (error) {
      showErrorToast(error.message || "Falha ao salvar configurações de IA.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateOnly() {
    if (!canEdit || !activeMeta.has_api_key) return;

    setSaving(true);
    try {
      const updated = await updateAiSettings({ active_provider: activeProvider, provider: activeProvider });
      const mapped = mapAiSettingsToState(updated);
      setActiveProvider(mapped.activeProvider);
      setMeta(mapped.meta);
      setConfigured(mapped.configured);
      showSuccessToast(`${preset.label} agora é o provedor ativo.`);
      window.dispatchEvent(new CustomEvent("myboard:ai-settings-updated"));
    } catch (error) {
      showErrorToast(error.message || "Falha ao ativar provedor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const result = await testAiConnection();
      setStatus(result);
      if (result?.ok) showSuccessToast(result.message || "Conexão OK.");
      else showErrorToast(result?.message || "Falha na conexão.");
    } catch (error) {
      setStatus({ ok: false, message: error.message });
      showErrorToast(error.message || "Falha ao testar conexão.");
    } finally {
      setTesting(false);
    }
  }

  async function handleClearKey() {
    if (!canEdit) return;
    if (!window.confirm(`Remover a chave de ${preset.label}?`)) return;

    setSaving(true);
    try {
      const updated = await updateAiSettings({
        provider: activeProvider,
        clear_api_key: true,
      });
      const mapped = mapAiSettingsToState(updated);
      setForms(mapped.forms);
      setMeta(mapped.meta);
      setConfigured(mapped.configured);
      showSuccessToast("Chave removida.");
      window.dispatchEvent(new CustomEvent("myboard:ai-settings-updated"));
    } catch (error) {
      showErrorToast(error.message || "Falha ao remover chave.");
    } finally {
      setSaving(false);
    }
  }

  const currentForm = forms[activeProvider];

  return (
    <SettingsPanelShell
      title="IA"
      hint="Escolha o provedor, cole o token e o Bordie usa essa IA na organização."
      action={
        canEdit ? (
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" onClick={handleTest} disabled={testing || loading}>
              {testing ? "Testando…" : "Testar conexão"}
            </Button>
          </div>
        ) : null
      }
    >
      {loading ? (
        <p className={settingsPanelStyles.muted}>Carregando…</p>
      ) : (
        <form className={styles.form} onSubmit={handleSave}>
          <AiProviderTabs
            providers={providerList}
            activeId={activeProvider}
            meta={meta}
            disabled={!canEdit || saving}
            onChange={setActiveProvider}
          />

          <article className={settingsPanelStyles.card}>
            <div className={styles.providerHeader}>
              <div>
                <h3 className={settingsPanelStyles.cardTitle}>{preset.label}</h3>
                <p className={settingsPanelStyles.cardText}>{preset.description}</p>
              </div>
              <span
                className={`${styles.statusBadge} ${activeMeta.has_api_key ? styles.statusOn : styles.statusOff}`}
              >
                {activeMeta.has_api_key ? "Conectado" : "Sem chave"}
              </span>
            </div>

            {activeMeta.api_key_masked && (
              <p className={styles.maskedKey}>Token salvo: {activeMeta.api_key_masked}</p>
            )}

            {status && (
              <p className={status.ok ? styles.statusOk : styles.statusError}>{status.message}</p>
            )}

            {!configured && (
              <p className={styles.hintBanner}>
                Nenhum provedor ativo com chave — configure um token em Configurações → IA.
              </p>
            )}
          </article>

          <article className={settingsPanelStyles.card}>
            <h3 className={settingsPanelStyles.cardTitle}>Credenciais</h3>
            <div className={styles.fields}>
              <Input
                label={isCustom ? "Bearer token" : "Token / API Key"}
                type="password"
                placeholder={activeMeta.has_api_key ? "••••••••••••••••" : preset.key_hint}
                value={currentForm.api_key}
                onChange={(event) => updateField("api_key", event.target.value)}
                disabled={!canEdit}
                hint={
                  isCustom
                    ? "Token configurado em api-keys do CLIProxyAPI (Authorization: Bearer …)."
                    : preset.docs_url ? (
                    <>
                      Obtenha em{" "}
                      <a href={preset.docs_url} target="_blank" rel="noreferrer">
                        {preset.docs_url.replace(/^https?:\/\//, "")}
                      </a>
                    </>
                  ) : (
                    "Cole o token da API."
                  )
                }
                autoComplete="off"
              />

              {!isCustom && (
                <div className={styles.presetInfo}>
                  <div className={styles.presetRow}>
                    <span className={styles.presetLabel}>Modelo de chat</span>
                    <span className={styles.presetValue}>{preset.chat_model_label}</span>
                  </div>
                  {preset.embedding_model && (
                    <div className={styles.presetRow}>
                      <span className={styles.presetLabel}>Embedding (RAG)</span>
                      <span className={styles.presetValue}>{preset.embedding_model}</span>
                    </div>
                  )}
                </div>
              )}

              {isCustom && (
                <>
                  <Input
                    label="URL da API"
                    value={currentForm.base_url}
                    onChange={(event) => updateField("base_url", event.target.value)}
                    disabled={!canEdit}
                    placeholder="https://geral-cli-antigravity-patrick.r954jc.easypanel.host"
                    hint="Raiz do CLIProxyAPI — o backend usa POST /v1/chat/completions."
                  />
                  <div className={styles.modelRow}>
                    <Select
                      label="Modelo"
                      value={currentForm.chat_model}
                      onChange={(event) => updateField("chat_model", event.target.value)}
                      disabled={!canEdit || modelsLoading || proxyModels.length === 0}
                      hint={
                        modelsLoading
                          ? "Carregando modelos do proxy…"
                          : canFetchProxyModels
                            ? "Lista viva de GET /v1/models no seu proxy."
                            : "Informe URL e Bearer token para carregar os modelos."
                      }
                      error={modelsError || undefined}
                    >
                      {proxyModels.length === 0 ? (
                        <option value={currentForm.chat_model || ""}>
                          {modelsLoading ? "Carregando…" : "Aguardando credenciais…"}
                        </option>
                      ) : (
                        groupedProxyModels.map((group) => (
                          <optgroup key={group.id} label={group.label}>
                            {group.models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.id}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={loadProxyModels}
                      disabled={!canEdit || !canFetchProxyModels || modelsLoading}
                    >
                      {modelsLoading ? "…" : "Atualizar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </article>

          {canEdit ? (
            <div className={styles.footer}>
              {activeMeta.has_api_key && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearKey} disabled={saving}>
                  Remover token
                </Button>
              )}
              {activeMeta.has_api_key && (
                <Button type="button" variant="secondary" size="sm" onClick={handleActivateOnly} disabled={saving}>
                  Usar este provedor
                </Button>
              )}
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Salvando…" : "Salvar e ativar"}
              </Button>
            </div>
          ) : (
            <p className={settingsPanelStyles.muted}>
              Apenas administradores podem alterar a conexão de IA.
            </p>
          )}
        </form>
      )}
    </SettingsPanelShell>
  );
}
