"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { getWorkspaceSettings, testAiConnection, updateAiSettings } from "@/api/settings";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./AiSettingsPanel.module.css";

const DEFAULT_FORM = {
  openrouter_api_key: "",
  base_url: "https://openrouter.ai/api/v1",
  chat_model: "openai/gpt-4o-mini",
  embedding_model: "openai/text-embedding-3-small",
};

export default function AiSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [meta, setMeta] = useState({ configured: false, api_key_masked: null, has_api_key: false });
  const [form, setForm] = useState(DEFAULT_FORM);

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceSettings();
      const ai = data?.ai || {};
      setMeta({
        configured: Boolean(ai.configured),
        api_key_masked: ai.api_key_masked,
        has_api_key: Boolean(ai.has_api_key),
      });
      setForm({
        openrouter_api_key: "",
        base_url: ai.base_url || DEFAULT_FORM.base_url,
        chat_model: ai.chat_model || DEFAULT_FORM.chat_model,
        embedding_model: ai.embedding_model || DEFAULT_FORM.embedding_model,
      });
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar configurações de IA.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      const payload = {
        base_url: form.base_url,
        chat_model: form.chat_model,
        embedding_model: form.embedding_model,
      };

      if (form.openrouter_api_key.trim()) {
        payload.openrouter_api_key = form.openrouter_api_key.trim();
      }

      const updated = await updateAiSettings(payload);
      setMeta({
        configured: Boolean(updated?.configured),
        api_key_masked: updated?.api_key_masked,
        has_api_key: Boolean(updated?.has_api_key),
      });
      setForm((current) => ({ ...current, openrouter_api_key: "" }));
      showSuccessToast("Configurações de IA salvas.");
    } catch (error) {
      showErrorToast(error.message || "Falha ao salvar configurações de IA.");
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
      if (result?.ok) showSuccessToast("Conexão com a IA OK.");
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
    if (!window.confirm("Remover a chave de API desta organização?")) return;

    setSaving(true);
    try {
      const updated = await updateAiSettings({ clear_api_key: true });
      setMeta({
        configured: Boolean(updated?.configured),
        api_key_masked: updated?.api_key_masked,
        has_api_key: Boolean(updated?.has_api_key),
      });
      showSuccessToast("Chave removida.");
    } catch (error) {
      showErrorToast(error.message || "Falha ao remover chave.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPanelShell
      title="IA"
      hint="Conexão com OpenRouter para Bordie, embeddings e extração de fatos."
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
          <article className={settingsPanelStyles.card}>
            <h3 className={settingsPanelStyles.cardTitle}>Status da conexão</h3>
            <p className={settingsPanelStyles.cardText}>
              {meta.configured
                ? "IA configurada para esta organização."
                : "Nenhuma chave salva — usando fallback do servidor, se existir."}
            </p>
            {meta.api_key_masked && (
              <p className={styles.maskedKey}>Chave atual: {meta.api_key_masked}</p>
            )}
            {status && (
              <p className={status.ok ? styles.statusOk : styles.statusError}>{status.message}</p>
            )}
          </article>

          <article className={settingsPanelStyles.card}>
            <h3 className={settingsPanelStyles.cardTitle}>OpenRouter</h3>
            <div className={styles.fields}>
              <Input
                label="Token / API Key"
                type="password"
                placeholder={meta.has_api_key ? "••••••••••••••••" : "sk-or-v1-..."}
                value={form.openrouter_api_key}
                onChange={(event) => updateField("openrouter_api_key", event.target.value)}
                disabled={!canEdit}
                hint="Obtenha em openrouter.ai/keys. Fica salvo por organização."
                autoComplete="off"
              />
              <Input
                label="Base URL"
                value={form.base_url}
                onChange={(event) => updateField("base_url", event.target.value)}
                disabled={!canEdit}
              />
              <Input
                label="Modelo de chat"
                value={form.chat_model}
                onChange={(event) => updateField("chat_model", event.target.value)}
                disabled={!canEdit}
              />
              <Input
                label="Modelo de embedding"
                value={form.embedding_model}
                onChange={(event) => updateField("embedding_model", event.target.value)}
                disabled={!canEdit}
              />
            </div>
          </article>

          {canEdit ? (
            <div className={styles.footer}>
              {meta.has_api_key && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearKey} disabled={saving}>
                  Remover chave
                </Button>
              )}
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Salvando…" : "Salvar IA"}
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
