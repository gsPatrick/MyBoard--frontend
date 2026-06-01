"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { getWhatsappSetup } from "@/api/whatsapp";
import { getStoredUser } from "@/api/client";
import { showErrorToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./WhatsappSettingsPanel.module.css";

function stateLabel(state) {
  const map = {
    open: "Conectado",
    close: "Desconectado",
    connecting: "Conectando…",
    unknown: "Desconhecido",
  };
  return map[state] || state || "Desconhecido";
}

function stateClass(state) {
  if (state === "open") return styles.stateOpen;
  if (state === "connecting") return styles.stateConnecting;
  return styles.stateClosed;
}

export default function WhatsappSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setup, setSetup] = useState(null);

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getWhatsappSetup();
      setSetup(data);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar o WhatsApp.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (setup?.connected) return undefined;

    const timer = window.setInterval(() => {
      load(true);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [setup?.connected, load]);

  const instance = setup?.instance;
  const qrPayload = setup?.qr;

  return (
    <SettingsPanelShell
      title="WhatsApp"
      hint="Escaneie o QR Code abaixo no celular. Depois disso, vincule números e grupos nos detalhes de cada cliente ou projeto."
    >
      {loading ? (
        <p className={settingsPanelStyles.muted}>Carregando…</p>
      ) : (
        <div className={styles.wrap}>
          <article className={settingsPanelStyles.card}>
            <div className={styles.statusRow}>
              <div>
                <h3 className={settingsPanelStyles.cardTitle}>Conexão</h3>
                <p className={settingsPanelStyles.cardText}>
                  {setup?.connected
                    ? "WhatsApp conectado. Você já pode vincular números nos clientes e projetos."
                    : "Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo e escaneie o QR abaixo."}
                </p>
              </div>
              {instance && (
                <span className={`${styles.stateBadge} ${stateClass(instance.connection_state)}`}>
                  {stateLabel(instance.connection_state)}
                </span>
              )}
            </div>

            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                disabled={refreshing}
                onClick={() => load(true)}
              >
                {refreshing ? "Atualizando…" : "Atualizar status"}
              </Button>
            )}
          </article>

          {!setup?.connected && (
            <article className={settingsPanelStyles.card}>
              <h3 className={settingsPanelStyles.cardTitle}>QR Code</h3>
              {qrPayload?.error ? (
                <p className={settingsPanelStyles.cardText}>{qrPayload.error}</p>
              ) : qrPayload?.base64 ? (
                <img
                  className={styles.qrImage}
                  src={`data:image/png;base64,${qrPayload.base64}`}
                  alt="QR Code WhatsApp"
                />
              ) : qrPayload?.pairingCode ? (
                <p className={settingsPanelStyles.cardText}>
                  Código de pareamento: <strong>{qrPayload.pairingCode}</strong>
                </p>
              ) : (
                <p className={settingsPanelStyles.cardText}>
                  Aguardando QR Code… clique em &quot;Atualizar status&quot; se não aparecer.
                </p>
              )}
            </article>
          )}

          {setup?.connected && (
            <article className={`${settingsPanelStyles.card} ${styles.cardSuccess}`}>
              <h3 className={settingsPanelStyles.cardTitle}>Pronto para usar</h3>
              <p className={settingsPanelStyles.cardText}>
                Vá em um cliente (aba Contato) para vincular o número, ou em um projeto (aba WhatsApp)
                para vincular números e grupos da conversa.
              </p>
            </article>
          )}
        </div>
      )}
    </SettingsPanelShell>
  );
}
