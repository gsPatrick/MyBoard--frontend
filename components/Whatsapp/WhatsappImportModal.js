"use client";

import { useRef, useState } from "react";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import styles from "./WhatsappImportModal.module.css";

function defaultName(fileName) {
  return String(fileName || "")
    .replace(/\.(zip|txt)$/i, "")
    .replace(/^WhatsApp Chat (with|-)\s*/i, "")
    .replace(/^Conversa do WhatsApp (com|-)\s*/i, "")
    .trim();
}

export default function WhatsappImportModal({
  isOpen,
  onClose,
  isProject,
  importChat, // (file, { confirm, name }) => Promise
  onImported,
}) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);
  const inputRef = useRef(null);

  function reset() {
    setFile(null);
    setName("");
    setBusy(false);
    setDragOver(false);
    setNeedConfirm(false);
  }

  function close() {
    if (busy) return;
    reset();
    onClose?.();
  }

  function pick(fileList) {
    const f = fileList?.[0];
    if (!f) return;
    if (!/\.(zip|txt)$/i.test(f.name)) {
      showErrorToast("Envie o arquivo exportado do WhatsApp (.zip ou .txt).");
      return;
    }
    setFile(f);
    setName(defaultName(f.name));
    setNeedConfirm(false);
  }

  async function submit(confirm) {
    if (!file) return;
    setBusy(true);
    try {
      await importChat(file, { confirm, name });
      showSuccessToast("Importando em segundo plano… avisamos quando terminar.");
      reset();
      onImported?.();
      onClose?.();
    } catch (error) {
      if (error.code === "SWITCH_TO_IMPORT_REQUIRED") {
        setNeedConfirm(true);
      } else {
        showErrorToast(error.message || "Falha ao importar a conversa.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Importar conversa do WhatsApp" size="md">
      <div className={styles.body}>
        <p className={styles.help}>
          No WhatsApp: abra a conversa → <strong>⋮ / Mais → Exportar conversa → Incluir mídia</strong> → salve o{" "}
          <strong>.zip</strong> e selecione aqui. A IA lê a conversa, os áudios e os documentos, salva os arquivos e
          organiza tudo nos lugares certos.
        </p>

        {!file ? (
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pick(e.dataTransfer.files);
            }}
          >
            <span className={styles.dropIcon}>⬆️</span>
            <span className={styles.dropTitle}>Arraste o .zip aqui ou clique para escolher</span>
            <span className={styles.dropHint}>WhatsApp · .zip ou .txt</span>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.txt"
              hidden
              onChange={(e) => pick(e.target.files)}
            />
          </div>
        ) : (
          <div className={styles.form}>
            <div className={styles.fileRow}>
              <span className={styles.fileName}>📄 {file.name}</span>
              <button type="button" className={styles.changeBtn} onClick={() => setFile(null)} disabled={busy}>
                Trocar
              </button>
            </div>

            <label className={styles.label}>
              Nome desta conversa {isProject ? "(ex.: Grupo X, Contato Y)" : "(opcional)"}
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isProject ? "Grupo X" : "Conversa do cliente"}
                autoFocus
              />
            </label>

            {needConfirm && (
              <div className={styles.warn}>
                Este {isProject ? "projeto" : "cliente"} está conectado em <strong>tempo real</strong>. Importar vai{" "}
                <strong>apagar a conexão atual</strong> e usar só a conversa importada.
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
          Cancelar
        </Button>
        {file &&
          (needConfirm ? (
            <Button variant="primary" size="sm" onClick={() => submit(true)} disabled={busy}>
              {busy ? "Importando…" : "Apagar e importar"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => submit(false)} disabled={busy}>
              {busy ? "Enviando…" : "Importar"}
            </Button>
          ))}
      </div>
    </Modal>
  );
}
