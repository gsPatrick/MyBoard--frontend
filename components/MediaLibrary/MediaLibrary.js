"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listMedia,
  listClientLibrary,
  uploadMedia,
  deleteMedia,
  fetchMediaBlobUrl,
} from "@/api/media";
import { getStoredUser } from "@/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import FileViewerModal from "@/components/MediaViewer/FileViewerModal";
import styles from "./MediaLibrary.module.css";

const CATEGORIES = [
  { id: "logo", label: "Logo" },
  { id: "contrato", label: "Contrato" },
  { id: "design", label: "Design" },
  { id: "documento", label: "Documento" },
  { id: "conversa", label: "Conversa" },
  { id: "outro", label: "Outro" },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

function fileKind(mime = "", name = "") {
  const m = mime.toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (m.startsWith("audio/") || /\.(opus|m4a|mp3|ogg|wav)$/.test(n)) return "audio";
  if (m.startsWith("video/") || /\.(mp4|mov)$/.test(n)) return "video";
  if (m.includes("zip") || n.endsWith(".zip")) return "zip";
  if (/\.(docx?|txt|csv|xlsx?|pptx?|md|json)$/.test(n) || m.includes("word") || m.includes("sheet"))
    return "doc";
  return "file";
}
const KIND_ICON = {
  image: "🖼️",
  pdf: "📕",
  audio: "🎧",
  video: "🎬",
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

function Thumb({ id, mime, name }) {
  const kind = fileKind(mime, name);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let revoked = null;
    let active = true;
    if (kind === "image") {
      fetchMediaBlobUrl(id)
        .then((u) => {
          if (active) {
            setUrl(u);
            revoked = u;
          } else {
            URL.revokeObjectURL(u);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id, kind]);

  if (kind === "image" && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={styles.thumbImg} />;
  }
  return <span className={styles.thumbIcon}>{KIND_ICON[kind]}</span>;
}

export default function MediaLibrary({ entityType, entityId }) {
  const isClient = entityType === "client";
  const canEdit = ["admin", "developer"].includes(getStoredUser()?.role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("documento");
  const [viewing, setViewing] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const data = isClient
        ? await listClientLibrary(entityId)
        : await listMedia("project", entityId);
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível carregar a biblioteca.");
    } finally {
      setLoading(false);
    }
  }, [entityId, isClient]);

  useEffect(() => {
    load();
  }, [load]);

  const projectOptions = useMemo(() => {
    if (!isClient) return [];
    const map = new Map();
    for (const it of items) {
      if (it.project_id) map.set(it.project_id, it.source_label || "Projeto");
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [items, isClient]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== "all" && (it.metadata?.category || "outro") !== category) return false;
      if (isClient && projectFilter !== "all") {
        if (projectFilter === "client" ? it.source_type !== "client" : it.project_id !== projectFilter)
          return false;
      }
      if (q && !String(it.original_name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, category, projectFilter, search, isClient]);

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChosen(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    setPendingFile(file);
    // tenta adivinhar a categoria
    const n = file.name.toLowerCase();
    if (/logo/.test(n)) setUploadCategory("logo");
    else if (/contrato|contract|proposta/.test(n)) setUploadCategory("contrato");
    else if (/design|figma|layout/.test(n)) setUploadCategory("design");
    else setUploadCategory("documento");
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setBusy(true);
    try {
      await uploadMedia({
        file: pendingFile,
        entityType,
        entityId,
        category: uploadCategory,
      });
      showSuccessToast("Arquivo enviado à biblioteca.");
      setPendingFile(null);
      await load();
    } catch (error) {
      showErrorToast(error.message || "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(item) {
    try {
      const url = await fetchMediaBlobUrl(item.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.original_name || "arquivo";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (error) {
      showErrorToast(error.message || "Não foi possível baixar.");
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remover "${item.original_name}" da biblioteca?`)) return;
    setBusy(true);
    try {
      await deleteMedia(item.id);
      showSuccessToast("Arquivo removido.");
      await load();
    } catch (error) {
      showErrorToast(error.message || "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Buscar arquivo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isClient && projectOptions.length > 0 && (
          <select
            className={styles.select}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">Todos os projetos</option>
            <option value="client">Só do cliente</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        {canEdit && (
          <button type="button" className={styles.uploadBtn} onClick={pickFile} disabled={busy}>
            + Enviar arquivo
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => onFileChosen(e.target.files)}
        />
      </div>

      <div className={styles.chips}>
        <button
          type="button"
          className={`${styles.chip} ${category === "all" ? styles.chipActive : ""}`}
          onClick={() => setCategory("all")}
        >
          Todos
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.chip} ${category === c.id ? styles.chipActive : ""}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {pendingFile && (
        <div className={styles.uploadBar}>
          <span className={styles.uploadName}>{KIND_ICON[fileKind(pendingFile.type, pendingFile.name)]} {pendingFile.name}</span>
          <select
            className={styles.select}
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="button" className={styles.uploadBtn} onClick={confirmUpload} disabled={busy}>
            {busy ? "Enviando…" : "Enviar"}
          </button>
          <button type="button" className={styles.ghost} onClick={() => setPendingFile(null)} disabled={busy}>
            Cancelar
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.muted}>
          {items.length === 0
            ? "Nenhum arquivo ainda. Envie um arquivo ou importe uma conversa do WhatsApp."
            : "Nenhum arquivo com esses filtros."}
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item) => {
            const cat = item.metadata?.category;
            return (
              <div key={item.id} className={styles.card}>
                <div
                  className={styles.thumb}
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewing(item)}
                  title="Visualizar"
                >
                  <Thumb id={item.id} mime={item.mime_type} name={item.original_name} />
                </div>
                <div className={styles.cardBody}>
                  <button
                    type="button"
                    className={styles.cardName}
                    title={item.original_name}
                    onClick={() => setViewing(item)}
                  >
                    {item.original_name}
                  </button>
                  <div className={styles.cardMeta}>
                    <span>{formatBytes(item.size_bytes)}</span>
                    {cat && <span className={styles.cat}>{CATEGORY_LABEL[cat] || cat}</span>}
                    {isClient && item.source_label && (
                      <span className={styles.source}>{item.source_label}</span>
                    )}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" className={styles.actionBtn} onClick={() => setViewing(item)}>
                    Ver
                  </button>
                  <button type="button" className={styles.actionBtn} onClick={() => handleDownload(item)}>
                    Baixar
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(item)}
                      disabled={busy}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FileViewerModal isOpen={!!viewing} onClose={() => setViewing(null)} media={viewing} />
    </div>
  );
}
