"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
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
  const [dragOver, setDragOver] = useState(false);
  const [staged, setStaged] = useState(null); // { file, name } — passo de nomear
  const [pendingSwitch, setPendingSwitch] = useState(null); // { file, name } — troca live→import
  const [confirmLive, setConfirmLive] = useState(false); // troca import→live
  const inputRef = useRef(null);

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

  async function doUpload(file, name, confirm) {
    setBusy(true);
    try {
      await api.importChat(entityId, file, { confirm, name });
      showSuccessToast("Importando em segundo plano… avisamos quando terminar.");
      setStaged(null);
      setPendingSwitch(null);
      setView("import");
      await load({ silent: true });
    } catch (error) {
      if (error.code === "SWITCH_TO_IMPORT_REQUIRED") {
        setStaged(null);
        setPendingSwitch({ file, name }); // aguarda confirmação do usuário
      } else {
        showErrorToast(error.message || "Falha ao importar a conversa.");
      }
    } finally {
      setBusy(false);
    }
  }

  function defaultName(fileName) {
    return String(fileName || "")
      .replace(/\.(zip|txt)$/i, "")
      .replace(/^WhatsApp Chat (with|-)\s*/i, "")
      .replace(/^Conversa do WhatsApp (com|-)\s*/i, "")
      .trim();
  }

  function handleFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    if (!/\.(zip|txt)$/i.test(file.name)) {
      showErrorToast("Envie o arquivo exportado do WhatsApp (.zip ou .txt).");
      return;
    }
    setStaged({ file, name: defaultName(file.name) });
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
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => !busy && inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".zip,.txt"
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <span className={styles.dropIcon}>⬆️</span>
              <span className={styles.dropTitle}>
                {busy ? "Processando…" : "Arraste o .zip aqui ou clique para escolher"}
              </span>
              <span className={styles.dropHint}>WhatsApp · .zip ou .txt</span>
            </div>
          )}

          {staged && (
            <div className={styles.stageBar}>
              <span className={styles.stageFile}>📄 {staged.file.name}</span>
              <input
                type="text"
                className={styles.nameInput}
                placeholder={isProject ? "Nome (ex.: Grupo X, Contato Y)" : "Nome (opcional)"}
                value={staged.name}
                onChange={(e) => setStaged((s) => ({ ...s, name: e.target.value }))}
                autoFocus
              />
              <button
                type="button"
                className={styles.danger}
                style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
                disabled={busy}
                onClick={() => doUpload(staged.file, staged.name, false)}
              >
                {busy ? "Enviando…" : "Importar"}
              </button>
              <button type="button" className={styles.ghost} disabled={busy} onClick={() => setStaged(null)}>
                Cancelar
              </button>
            </div>
          )}

          {pendingSwitch && (
            <div className={styles.confirm}>
              <p>
                Este {isProject ? "projeto" : "cliente"} está conectado em <strong>tempo real</strong>. Importar vai{" "}
                <strong>apagar a conexão atual</strong> e usar só a conversa importada. Continuar?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy}
                  onClick={() => doUpload(pendingSwitch.file, pendingSwitch.name, true)}
                >
                  {busy ? "Importando…" : "Apagar e importar"}
                </button>
                <button type="button" className={styles.ghost} disabled={busy} onClick={() => setPendingSwitch(null)}>
                  Cancelar
                </button>
              </div>
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
                    {imp.participants?.length > 1 && (
                      <span className={styles.itemMetaSub}>{imp.participants.slice(0, 4).join(", ")}</span>
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
        </div>
      )}
    </div>
  );
}
