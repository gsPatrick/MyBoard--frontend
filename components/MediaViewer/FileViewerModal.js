"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import { fetchMediaBlobUrl } from "@/services/media";
import AudioPlayer from "./AudioPlayer";
import styles from "./FileViewerModal.module.css";

function fileKind(mime = "", name = "") {
  const m = String(mime).toLowerCase();
  const n = String(name).toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (m.startsWith("audio/") || /\.(opus|m4a|mp3|ogg|wav|aac)$/.test(n)) return "audio";
  if (m.startsWith("video/") || /\.(mp4|mov|webm)$/.test(n)) return "video";
  if (m.startsWith("text/") || /\.(txt|csv|md|json|log)$/.test(n)) return "text";
  if (m.includes("zip") || n.endsWith(".zip")) return "zip";
  if (/\.(docx?|xlsx?|pptx?)$/.test(n) || m.includes("word") || m.includes("sheet")) return "doc";
  return "file";
}

const KIND_ICON = {
  image: "🖼️",
  pdf: "📕",
  audio: "🎧",
  video: "🎬",
  text: "📝",
  zip: "🗜️",
  doc: "📄",
  file: "📎",
};

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function originLabel(media) {
  const src = media?.metadata?.source;
  if (src === "whatsapp_rag") return "Importado do WhatsApp";
  if (src === "upload" || !src) return "Enviado manualmente";
  return src;
}

const ENTITY_LABEL = {
  project: "Projeto",
  client: "Cliente",
  user: "Minhas informações",
};

export default function FileViewerModal({ isOpen, onClose, media }) {
  const [src, setSrc] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const kind = media ? fileKind(media.mime_type, media.original_name) : "file";

  useEffect(() => {
    if (!isOpen || !media) {
      setSrc(null);
      setTextContent(null);
      setError(null);
      return undefined;
    }

    let blobUrl = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setTextContent(null);
      try {
        // Sempre via blob autenticado (mesma origem dos thumbnails) — robusto p/ todos os tipos.
        blobUrl = await fetchMediaBlobUrl(media.id);
        if (cancelled) return;
        setSrc(blobUrl);

        if (fileKind(media.mime_type, media.original_name) === "text") {
          const res = await fetch(blobUrl);
          const txt = await res.text();
          if (!cancelled) setTextContent(txt.slice(0, 50000));
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar o arquivo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, media]);

  async function handleDownload() {
    if (!media) return;
    try {
      const url = await fetchMediaBlobUrl(media.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = media.original_name || "arquivo";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      /* ignore */
    }
  }

  if (!isOpen || !media) return null;

  const source = media.source_label || ENTITY_LABEL[media.entity_type] || media.entity_type;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={media.original_name} size="xl">
      <div className={styles.layout}>
        <div className={styles.preview}>
          {loading && <p className={styles.status}>Carregando…</p>}
          {error && <p className={styles.status}>{error}</p>}

          {!loading && !error && src && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={media.original_name} className={styles.image} />
          )}
          {!loading && !error && src && kind === "pdf" && (
            <iframe title={media.original_name} src={src} className={styles.frame} />
          )}
          {!loading && !error && src && kind === "audio" && (
            <div className={styles.audioWrap}>
              <span className={styles.bigIcon}>🎧</span>
              <AudioPlayer src={src} />
              {media.metadata?.transcription ? (
                <div className={styles.transcription}>
                  <h4 className={styles.transcriptionTitle}>Transcrição</h4>
                  <p className={styles.transcriptionText}>{media.metadata.transcription}</p>
                </div>
              ) : (
                <p className={styles.noTranscription}>Sem transcrição disponível para este áudio.</p>
              )}
            </div>
          )}
          {!loading && !error && src && kind === "video" && (
            <video controls src={src} className={styles.video} />
          )}
          {!loading && !error && kind === "text" && (
            <pre className={styles.text}>{textContent ?? ""}</pre>
          )}
          {!loading && !error && !["image", "pdf", "audio", "video", "text"].includes(kind) && (
            <div className={styles.center}>
              <span className={styles.bigIcon}>{KIND_ICON[kind]}</span>
              <p className={styles.status}>Pré-visualização não disponível para este tipo.</p>
              <button type="button" className={styles.downloadBtn} onClick={handleDownload}>
                Baixar arquivo
              </button>
            </div>
          )}
        </div>

        <aside className={styles.meta}>
          <h3 className={styles.metaTitle}>Detalhes</h3>
          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt>Arquivo</dt>
              <dd title={media.original_name}>{media.original_name}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Tipo</dt>
              <dd>{media.mime_type || "—"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Tamanho</dt>
              <dd>{formatBytes(media.size_bytes)}</dd>
            </div>
            {media.metadata?.category && (
              <div className={styles.metaRow}>
                <dt>Categoria</dt>
                <dd className={styles.cap}>{media.metadata.category}</dd>
              </div>
            )}
            <div className={styles.metaRow}>
              <dt>De onde veio</dt>
              <dd>{originLabel(media)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Origem</dt>
              <dd>{source}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Adicionado em</dt>
              <dd>{formatDateTime(media.created_at)}</dd>
            </div>
          </dl>

          <button type="button" className={styles.downloadBtn} onClick={handleDownload}>
            ⬇️ Baixar
          </button>
        </aside>
      </div>
    </Modal>
  );
}
