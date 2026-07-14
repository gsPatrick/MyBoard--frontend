"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { getWorkspaceSettings, updateIngestionSettings } from "@/services/settings";
import { getStoredUser } from "@/services/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./IngestionSettingsPanel.module.css";

export default function IngestionSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingestion, setIngestion] = useState({
    create_client: true,
    create_project: true,
    create_details: true,
    create_demands: true,
    create_meetings: true,
  });

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceSettings();
      setIngestion({
        create_client: data?.ingestion?.create_client ?? true,
        create_project: data?.ingestion?.create_project ?? true,
        create_details: data?.ingestion?.create_details ?? true,
        create_demands: data?.ingestion?.create_demands ?? true,
        create_meetings: data?.ingestion?.create_meetings ?? true,
      });
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar as configurações de importação.");
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
      await updateIngestionSettings(ingestion);
      showSuccessToast("Configurações de importação atualizadas.");
    } catch (error) {
      showErrorToast(error.message || "Falha ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  const toggleOption = (key) => {
    if (!canEdit) return;
    setIngestion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SettingsPanelShell
      title="Importação por IA"
      hint="Escolha quais registros e informações a IA do Bordie pode criar ao analisar seus arquivos."
    >
      {loading ? (
        <p className={settingsPanelStyles.muted}>Carregando…</p>
      ) : (
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.list}>
            <article className={settingsPanelStyles.card}>
              <h3 className={settingsPanelStyles.cardTitle}>Preferências de Ingestão</h3>
              <p className={settingsPanelStyles.cardText}>
                Tente desmarcar as opções que você não deseja que sejam criadas automaticamente ao enviar arquivos na plataforma (como no chat do Bordie ou no arrastar e soltar do dashboard).
              </p>
              
              <div className={styles.toggles}>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={ingestion.create_client}
                    onChange={() => toggleOption("create_client")}
                    disabled={!canEdit}
                  />
                  <div className={styles.toggleText}>
                    <strong>Criar Clientes</strong>
                    <span>Cadastrar ou atualizar dados do cliente extraídos (nome, e-mail, telefone, documentos).</span>
                  </div>
                </label>

                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={ingestion.create_project}
                    onChange={() => toggleOption("create_project")}
                    disabled={!canEdit}
                  />
                  <div className={styles.toggleText}>
                    <strong>Criar Projetos</strong>
                    <span>Criar novos projetos para o cliente com informações de descrição, orçamento e prazos.</span>
                  </div>
                </label>

                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={ingestion.create_details}
                    onChange={() => toggleOption("create_details")}
                    disabled={!canEdit}
                  />
                  <div className={styles.toggleText}>
                    <strong>Extrair Credenciais e Detalhes</strong>
                    <span>Identificar e salvar logins, senhas, chaves de API, links de repositórios e instruções de deploy.</span>
                  </div>
                </label>

                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={ingestion.create_demands}
                    onChange={() => toggleOption("create_demands")}
                    disabled={!canEdit}
                  />
                  <div className={styles.toggleText}>
                    <strong>Criar Demandas / Tarefas</strong>
                    <span>Criar pendências e tarefas a fazer listadas nos escopos ou briefings analisados.</span>
                  </div>
                </label>

                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={ingestion.create_meetings}
                    onChange={() => toggleOption("create_meetings")}
                    disabled={!canEdit}
                  />
                  <div className={styles.toggleText}>
                    <strong>Criar Reuniões na Agenda</strong>
                    <span>Agendar reuniões e calls com data e hora encontradas nos arquivos direto na sua agenda.</span>
                  </div>
                </label>
              </div>
            </article>
          </div>

          {canEdit ? (
            <div className={styles.footer}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Salvando…" : "Salvar configurações"}
              </Button>
            </div>
          ) : (
            <p className={settingsPanelStyles.muted}>
              Apenas administradores podem alterar as configurações de importação.
            </p>
          )}
        </form>
      )}
    </SettingsPanelShell>
  );
}
