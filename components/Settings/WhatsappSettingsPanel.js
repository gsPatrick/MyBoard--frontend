"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import Modal from "@/components/Modal/Modal";
import { disconnectWhatsapp, getWhatsappSetup } from "@/api/whatsapp";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./WhatsappSettingsPanel.module.css";

const STATUS_POLL_MS = 4000;

function stateLabel(state) {
  const map = {
    open: "Conectado",
    close: "Desconectado",
    connecting: "Conectando…",
    unknown: "Desconhecido",
  };
  return map[state] || state || "Desconhecido";
}

function qrImageSrc(base64) {
  if (!base64) return "";
  const raw = String(base64);
  return raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
}

function stateClass(state) {
  if (state === "open") return styles.stateOpen;
  if (state === "connecting") return styles.stateConnecting;
  return styles.stateClosed;
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return null;
  const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  return seconds;
}

export default function WhatsappSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [setup, setSetup] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pairingPhone, setPairingPhone] = useState("");
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const qrRefreshLock = useRef(false);

  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const applySetup = useCallback((data, { preserveQr = false } = {}) => {
    setSetup((current) => {
      if (data?.connected || !preserveQr) return data;

      const nextQr = data?.qr?.base64 ? data.qr : current?.qr;
      return {
        ...data,
        qr: nextQr,
        qr_expires_at: data?.qr_expires_at || nextQr?.expires_at || current?.qr_expires_at || null,
      };
    });
  }, []);

  const loadSetup = useCallback(
    async ({ silent = false, statusOnly = false, refreshQr = false, preserveQr = false, phone = "" } = {}) => {
      if (!silent) setLoading(true);
      else if (refreshQr || phone) setRefreshingQr(true);
      else setRefreshing(true);

      try {
        const data = await getWhatsappSetup({ statusOnly, refreshQr, phone });
        applySetup(data, { preserveQr: preserveQr || statusOnly });
      } catch (error) {
        showErrorToast(error.message || "Não foi possível carregar o WhatsApp.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setRefreshingQr(false);
      }
    },
    [applySetup]
  );

  const refreshQrCode = useCallback(async () => {
    if (qrRefreshLock.current) return;
    qrRefreshLock.current = true;
    try {
      await loadSetup({ silent: true, refreshQr: true });
    } finally {
      qrRefreshLock.current = false;
    }
  }, [loadSetup]);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (setup?.connected) return undefined;

    const timer = window.setInterval(() => {
      loadSetup({ silent: true, statusOnly: true, preserveQr: true });
    }, STATUS_POLL_MS);

    return () => window.clearInterval(timer);
  }, [setup?.connected, loadSetup]);

  useEffect(() => {
    const expiresAt = setup?.qr_expires_at || setup?.qr?.expires_at;
    if (setup?.connected || !expiresAt) {
      setCountdown(null);
      return undefined;
    }

    const tick = () => setCountdown(formatCountdown(expiresAt));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [setup?.connected, setup?.qr_expires_at, setup?.qr?.expires_at]);

  useEffect(() => {
    if (setup?.connected) return;
    if (countdown !== 0) return;
    if (!setup?.qr_expired && setup?.qr?.base64) {
      refreshQrCode();
    }
  }, [countdown, setup?.connected, setup?.qr_expired, setup?.qr?.base64, refreshQrCode]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const result = await disconnectWhatsapp();
      setDisconnectOpen(false);
      setSetup({
        connected: false,
        instance: result?.instance || {
          ...setup?.instance,
          connection_state: "close",
        },
        qr: null,
      });
      showSuccessToast("WhatsApp desconectado e vínculos removidos.");
      await loadSetup({ silent: true, refreshQr: true });
    } catch (error) {
      showErrorToast(error.message || "Não foi possível desconectar o WhatsApp.");
    } finally {
      setDisconnecting(false);
    }
  }

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
          <article className={`${settingsPanelStyles.card} ${setup?.connected ? "" : styles.setupCard}`}>
            <div className={styles.statusRow}>
              <div>
                <h3 className={settingsPanelStyles.cardTitle}>Conexão</h3>
                <p className={settingsPanelStyles.cardText}>
                  {setup?.connected
                    ? "WhatsApp conectado. Você já pode vincular números nos clientes e projetos."
                    : "Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo e escaneie o QR ao lado."}
                </p>
              </div>
              {instance && (
                <span className={`${styles.stateBadge} ${stateClass(instance.connection_state)}`}>
                  {stateLabel(instance.connection_state)}
                </span>
              )}
            </div>

            {canEdit && (
              <div className={styles.actionsRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={refreshing}
                  onClick={() => loadSetup({ silent: true, statusOnly: true, preserveQr: true })}
                >
                  {refreshing ? "Verificando…" : "Verificar conexão"}
                </Button>
                {!setup?.connected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={refreshingQr}
                    onClick={refreshQrCode}
                  >
                    {refreshingQr ? "Gerando QR…" : "Gerar novo QR"}
                  </Button>
                )}
              </div>
            )}

            {!setup?.connected && (
              <div className={styles.qrSection}>
                <div className={styles.qrHelp}>
                  <h4 className={styles.qrHelpTitle}>Como conectar</h4>
                  <ol className={styles.qrSteps}>
                    <li>Abra o WhatsApp no celular</li>
                    <li>Toque em <strong>Dispositivos conectados</strong></li>
                    <li>Escolha <strong>Conectar dispositivo</strong></li>
                    <li>Aponte a câmera para o QR Code</li>
                  </ol>
                  {countdown != null && countdown > 0 && (
                    <p className={styles.qrTimer}>QR válido por mais {countdown}s</p>
                  )}
                  {countdown === 0 && (
                    <p className={styles.qrTimer}>QR expirado — gerando um novo…</p>
                  )}
                  {qrPayload?.error && (
                    <p className={styles.qrError}>{qrPayload.error}</p>
                  )}
                  {qrPayload?.pairingCode && (
                    <div className={styles.pairingBox}>
                      <span className={styles.pairingLabel}>Código de pareamento</span>
                      <strong className={styles.pairingCode}>{qrPayload.pairingCode}</strong>
                      <p className={styles.pairingHint}>
                        No WhatsApp Business: Dispositivos conectados → Conectar com número de telefone → digite este código.
                      </p>
                    </div>
                  )}
                  {!qrPayload?.base64 && !qrPayload?.error && !qrPayload?.pairingCode && (
                    <p className={settingsPanelStyles.cardText}>
                      Aguardando QR Code… use &quot;Gerar novo QR&quot; se não aparecer.
                    </p>
                  )}
                </div>

                <div className={styles.qrFrame} aria-label="QR Code WhatsApp">
                  {qrPayload?.base64 ? (
                    <img
                      className={styles.qrImage}
                      src={qrImageSrc(qrPayload.base64)}
                      alt="QR Code WhatsApp"
                    />
                  ) : (
                    <div className={styles.qrPlaceholder}>
                      <span>{refreshingQr ? "Gerando QR…" : "Sem QR no momento"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!setup?.connected && canEdit && (
              <div className={styles.pairingSection}>
                <h4 className={styles.qrHelpTitle}>WhatsApp Business (código)</h4>
                <p className={settingsPanelStyles.cardText}>
                  Se o QR não funcionar no Business, informe o número com DDI e gere o código de pareamento.
                </p>
                <div className={styles.pairingForm}>
                  <Input
                    label="Número do WhatsApp Business"
                    placeholder="5511999999999"
                    value={pairingPhone}
                    onChange={(event) => setPairingPhone(event.target.value)}
                    disabled={refreshingQr}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={refreshingQr || pairingPhone.replace(/\D/g, "").length < 10}
                    onClick={() =>
                      loadSetup({
                        silent: true,
                        refreshQr: true,
                        phone: pairingPhone.replace(/\D/g, ""),
                      })
                    }
                  >
                    {refreshingQr ? "Gerando código…" : "Gerar código de pareamento"}
                  </Button>
                </div>
              </div>
            )}
          </article>

          {setup?.connected && (
            <article className={`${settingsPanelStyles.card} ${styles.cardSuccess}`}>
              <h3 className={settingsPanelStyles.cardTitle}>Pronto para usar</h3>
              <p className={settingsPanelStyles.cardText}>
                Vá em um cliente (aba Contato) para vincular o número, ou em um projeto (aba WhatsApp)
                para vincular números e grupos da conversa.
              </p>
            </article>
          )}

          {canEdit && instance && (
            <article className={`${settingsPanelStyles.card} ${styles.dangerCard}`}>
              <h3 className={settingsPanelStyles.cardTitle}>Desconectar WhatsApp</h3>
              <p className={settingsPanelStyles.cardText}>
                Encerra a sessão do número conectado e remove todos os vínculos de clientes e projetos
                desta organização.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className={styles.dangerBtn}
                disabled={disconnecting}
                onClick={() => setDisconnectOpen(true)}
              >
                Desconectar WhatsApp
              </Button>
            </article>
          )}
        </div>
      )}

      <Modal
        isOpen={disconnectOpen}
        onClose={() => !disconnecting && setDisconnectOpen(false)}
        title="Desconectar WhatsApp?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" disabled={disconnecting} onClick={() => setDisconnectOpen(false)}>
              Cancelar
            </Button>
            <Button className={styles.dangerBtnSolid} disabled={disconnecting} onClick={handleDisconnect}>
              {disconnecting ? "Desconectando…" : "Desconectar mesmo assim"}
            </Button>
          </>
        }
      >
        <div className={styles.disconnectModal}>
          <p className={styles.disconnectLead}>
            Esta ação não pode ser desfeita automaticamente. Ao confirmar:
          </p>
          <ul className={styles.disconnectList}>
            <li>O número será desconectado do MyBoard e da Evolution API</li>
            <li>Todos os vínculos de WhatsApp em clientes serão removidos</li>
            <li>Todos os vínculos de números e grupos em projetos serão removidos</li>
            <li>O Bordie deixa de usar essas conversas como contexto até você reconectar</li>
          </ul>
          <p className={styles.disconnectNote}>
            As mensagens já ingeridas no histórico permanecem no sistema, mas você precisará
            vincular clientes e projetos novamente após conectar outro número.
          </p>
        </div>
      </Modal>
    </SettingsPanelShell>
  );
}
