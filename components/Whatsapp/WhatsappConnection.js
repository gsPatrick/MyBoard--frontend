"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import Button from "@/components/Button/Button";
import {
  getClientImportMode,
  getProjectImportMode,
  importClientChat,
  importProjectChat,
  removeClientImport,
  removeProjectImport,
  switchClientToLive,
  switchProjectToLive,
} from "@/api/whatsapp";
import WhatsappImportModal from "./WhatsappImportModal";
import styles from "./WhatsappConnection.module.css";

const API = {
  client: {
    getMode: getClientImportMode,
    importChat: importClientChat,
    removeImport: removeClientImport,
    switchLive: switchClientToLive,
  },
  project: {
    getMode: getProjectImportMode,
    importChat: importProjectChat,
    removeImport: removeProjectImport,
    switchLive: switchProjectToLive,
  },
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function WhatsappConnection({ entityType, entityId, children }) {
  const api = API[entityType];
  const isProject = entityType === "project";
  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const [imports, setImports] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [mode, setMode] = useState(null); // 'live' | 'import' | null
  const [view, setView] = useState("live");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false); // modal de importação
  const [confirmLive, setConfirmLive] = useState(false); // troca import→live

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!entityId) return;
      if (!silent) setLoading(true);
      try {
        const data = await api.getMode(entityId);
        const list = data?.imports || [];
        setImports(list);
        setLiveCount(data?.live_count || 0);
        setMode(data?.mode || null);
        if (!silent) setView(data?.mode === "import" ? "import" : "live");
      } catch (error) {
        if (!silent) showErrorToast(error.message || "Não foi possível carregar a conexão.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [api, entityId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Enquanto houver importação processando, atualiza sozinho (a notificação avisa ao fim).
  const anyProcessing = imports.some((i) => i.status === "processing");
  useEffect(() => {
    if (!anyProcessing) return undefined;
    const t = setInterval(() => load({ silent: true }), 5000);
    return () => clearInterval(t);
  }, [anyProcessing, load]);

  const importChat = (file, opts) => api.importChat(entityId, file, opts);

  function onImported() {
    setView("import");
    load({ silent: true });
  }

  async function handleRemove(conversationId) {
    setBusy(true);
    try {
      await api.removeImport(entityId, conversationId);
      showSuccessToast("Conversa importada removida.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  }

  function requestLiveView() {
    if (imports.length > 0) {
      setConfirmLive(true);
    } else {
      setView("live");
    }
  }

  async function confirmSwitchLive() {
    setBusy(true);
    try {
      await api.switchLive(entityId);
      showSuccessToast("Importações apagadas. Pronto para conectar em tempo real.");
      setConfirmLive(false);
      await load();
      setView("live");
    } catch (error) {
      showErrorToast(error.message || "Não foi possível trocar de modo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.modeBar}>
        <button
          type="button"
          className={`${styles.modeTab} ${view === "live" ? styles.modeTabActive : ""}`}
          onClick={requestLiveView}
        >
          <span className={styles.modeDot} data-on={view === "live"} />
          Tempo real
          {mode === "live" && <span className={styles.modeBadge}>ativo</span>}
        </button>
        <button
          type="button"
          className={`${styles.modeTab} ${view === "import" ? styles.modeTabActive : ""}`}
          onClick={() => setView("import")}
        >
          <span className={styles.modeIcon}>📄</span>
          Importar conversa
          {mode === "import" && <span className={styles.modeBadge}>ativo</span>}
        </button>
      </div>

      {confirmLive && (
        <div className={styles.confirm}>
          <p>
            Voltar para tempo real vai <strong>apagar {imports.length} conversa(s) importada(s)</strong> deste{" "}
            {isProject ? "projeto" : "cliente"} para sincronizar do zero. Continuar?
          </p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.danger} disabled={busy} onClick={confirmSwitchLive}>
              {busy ? "Apagando…" : "Apagar e conectar"}
            </button>
            <button type="button" className={styles.ghost} disabled={busy} onClick={() => setConfirmLive(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {view === "live" && !confirmLive && <div className={styles.liveSlot}>{children}</div>}

      {view === "import" && (
        <div className={styles.importSlot}>
          <p className={styles.help}>
            No WhatsApp: abra a conversa → <strong>⋮ / Mais → Exportar conversa → Incluir mídia</strong> → salve o{" "}
            <strong>.zip</strong> e solte aqui. A IA lê a conversa, os documentos e os áudios, salva os arquivos
            para você baixar e organiza tudo nos lugares certos (descrição, credenciais, GitHub, servidor, demandas
            e reuniões).{" "}
            {isProject
              ? "Importe quantos grupos e contatos quiser. Reimportar o mesmo chat substitui (sem duplicar)."
              : "Reimportar substitui a conversa anterior deste cliente (sem duplicar)."}
          </p>

          {canEdit && (
            <div>
              <Button variant="primary" size="sm" icon="+" onClick={() => setImportOpen(true)}>
                Importar conversa
              </Button>
            </div>
          )}

          {loading ? (
            <p className={styles.muted}>Carregando…</p>
          ) : imports.length === 0 ? (
            <p className={styles.muted}>Nenhuma conversa importada ainda.</p>
          ) : (
            <ul className={styles.list}>
              {imports.map((imp) => (
                <li key={imp.id} className={styles.item}>
                  <div className={styles.itemIcon}>
                    {imp.status === "processing" ? "⏳" : imp.is_group ? "👥" : "💬"}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>
                      {imp.title || "Conversa"}
                      {imp.status === "processing" && <span className={styles.processing}>processando…</span>}
                      {imp.status === "error" && <span className={styles.failed}>falhou</span>}
                    </span>
                    <span className={styles.itemMeta}>
                      {imp.status === "processing"
                        ? "Lendo, transcrevendo e organizando com a IA…"
                        : `${imp.message_count} mensagens · importado em ${formatDate(imp.imported_at)}`}
                    </span>
                    {imp.participants?.length > 1 && imp.status !== "processing" && (
                      <span className={styles.itemMetaSub}>{imp.participants.slice(0, 4).join(", ")}</span>
                    )}
                    {imp.status === "processing" && (
                      <div className={styles.progress}>
                        <div className={styles.progressBar} />
                      </div>
                    )}
                  </div>
                  {canEdit && imp.status !== "processing" && (
                    <button
                      type="button"
                      className={styles.remove}
                      disabled={busy}
                      onClick={() => handleRemove(imp.id)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <WhatsappImportModal
            isOpen={importOpen}
            onClose={() => setImportOpen(false)}
            isProject={isProject}
            importChat={importChat}
            onImported={onImported}
          />
        </div>
      )}
    </div>
  );
}
