"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { getWorkspaceSettings, updatePrivacySettings } from "@/services/settings";
import { getStoredUser } from "@/services/client";
import { BORDIE_POLICY_OPTIONS } from "@/lib/settingsTabs";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./PrivacySettingsPanel.module.css";

const POLICY_BLOCKS = [
  {
    title: "Dados do workspace",
    text: "Projetos, clientes, arquivos e lançamentos financeiros ficam vinculados à organização em que você está logado. Apenas membros autorizados da mesma organização têm acesso.",
  },
  {
    title: "WhatsApp e IA",
    text: "Mensagens ingeridas via WhatsApp são indexadas para o Bordie responder com contexto. Áudios podem ser armazenados apenas como transcrição. Payloads brutos são compactados após processamento.",
  },
  {
    title: "Sessão e segurança",
    text: 'Sua sessão é armazenada neste navegador. Use "Sair" no menu lateral quando estiver em um computador compartilhado.',
  },
];

export default function PrivacySettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyMode, setPolicyMode] = useState("confirm_sensitive");
  const [privacy, setPrivacy] = useState({
    retain_whatsapp_raw_days: 30,
    store_audio_transcripts_only: true,
    allow_ai_on_whatsapp: true,
  });

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceSettings();
      setPolicyMode(data?.bordie_policy?.mode || "confirm_sensitive");
      setPrivacy({
        retain_whatsapp_raw_days: data?.privacy?.retain_whatsapp_raw_days ?? 30,
        store_audio_transcripts_only: data?.privacy?.store_audio_transcripts_only ?? true,
        allow_ai_on_whatsapp: data?.privacy?.allow_ai_on_whatsapp ?? true,
      });
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar política de privacidade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      await updatePrivacySettings({
        bordie_policy: { mode: policyMode },
        ...privacy,
      });
      showSuccessToast("Política de privacidade atualizada.");
      window.dispatchEvent(new CustomEvent("myboard:bordie-policy-updated"));
    } catch (error) {
      showErrorToast(error.message || "Falha ao salvar política.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPanelShell
      title="Política de privacidade"
      hint="Como seus dados são usados e quando o Bordie pede confirmação."
    >
      {loading ? (
        <p className={settingsPanelStyles.muted}>Carregando…</p>
      ) : (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.list}>
            {POLICY_BLOCKS.map((block) => (
              <article key={block.title} className={settingsPanelStyles.card}>
                <h3 className={settingsPanelStyles.cardTitle}>{block.title}</h3>
                <p className={settingsPanelStyles.cardText}>{block.text}</p>
              </article>
            ))}
          </div>

          <article className={settingsPanelStyles.card}>
            <h3 className={settingsPanelStyles.cardTitle}>Política do Bordie</h3>
            <p className={settingsPanelStyles.cardText}>
              Define quando o assistente executa ações automaticamente ou pede confirmação.
            </p>
            <div className={styles.policyOptions} role="radiogroup" aria-label="Política do Bordie">
              {BORDIE_POLICY_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`${styles.policyOption} ${
                    policyMode === option.id ? styles.policyOptionActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="bordie_policy"
                    value={option.id}
                    checked={policyMode === option.id}
                    onChange={() => setPolicyMode(option.id)}
                    disabled={!canEdit}
                  />
                  <span className={styles.policyCopy}>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </article>

          <article className={settingsPanelStyles.card}>
            <h3 className={settingsPanelStyles.cardTitle}>Retenção WhatsApp</h3>
            <div className={styles.toggles}>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={privacy.store_audio_transcripts_only}
                  onChange={(event) =>
                    setPrivacy((current) => ({
                      ...current,
                      store_audio_transcripts_only: event.target.checked,
                    }))
                  }
                  disabled={!canEdit}
                />
                <span>Guardar áudios apenas como transcrição (economiza espaço)</span>
              </label>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={privacy.allow_ai_on_whatsapp}
                  onChange={(event) =>
                    setPrivacy((current) => ({
                      ...current,
                      allow_ai_on_whatsapp: event.target.checked,
                    }))
                  }
                  disabled={!canEdit}
                />
                <span>Permitir que a IA indexe conversas do WhatsApp</span>
              </label>
              <Input
                label="Dias para compactar payload bruto"
                type="number"
                min="0"
                value={String(privacy.retain_whatsapp_raw_days)}
                onChange={(event) =>
                  setPrivacy((current) => ({
                    ...current,
                    retain_whatsapp_raw_days: Number(event.target.value) || 0,
                  }))
                }
                disabled={!canEdit}
                hint="Após indexar, payloads grandes são reduzidos automaticamente."
              />
            </div>
          </article>

          {canEdit ? (
            <div className={styles.footer}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Salvando…" : "Salvar política"}
              </Button>
            </div>
          ) : (
            <p className={settingsPanelStyles.muted}>
              Apenas administradores podem alterar a política de privacidade.
            </p>
          )}
        </form>
      )}
    </SettingsPanelShell>
  );
}
