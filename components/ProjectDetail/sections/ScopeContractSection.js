"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import { deleteMedia, fetchMediaBlobUrl, listMedia, uploadMedia } from "@/api/media";
import { upsertMarkdownDetail } from "@/lib/projectDetailsHelpers";
import PdfViewerModal from "../PdfViewerModal";
import sectionStyles from "../ProjectDetailSection.module.css";
import styles from "./ScopeContractSection.module.css";

function isPdf(media) {
  return (
    media?.mime_type === "application/pdf" ||
    media?.original_name?.toLowerCase().endsWith(".pdf")
  );
}

export default function ScopeContractSection({
  projectId,
  title,
  hint,
  category,
  detailKey,
  label,
  existingDetail,
  onSaved,
}) {
  const [content, setContent] = useState("");
  const [detailId, setDetailId] = useState(existingDetail?.id || null);
  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);

  useEffect(() => {
    const value = existingDetail?.value ?? existingDetail?.value_text ?? "";
    setContent(typeof value === "string" ? value : "");
    setDetailId(existingDetail?.id || null);
  }, [existingDetail]);

  const loadAttachments = useCallback(async (id) => {
    if (!id) {
      setAttachments([]);
      return;
    }

    const files = await listMedia("project_detail", id, { kind: "attachment" });
    const pdfs = (Array.isArray(files) ? files : []).filter(isPdf);
    setAttachments(pdfs);
  }, []);

  useEffect(() => {
    loadAttachments(detailId);
  }, [detailId, loadAttachments]);

  useEffect(() => {
    let cancelled = false;
    const blobUrls = [];

    async function loadPreviews() {
      const next = {};
      for (const file of attachments) {
        try {
          const blobUrl = await fetchMediaBlobUrl(file.id);
          blobUrls.push(blobUrl);
          if (!cancelled) next[file.id] = blobUrl;
        } catch {
          /* preview opcional */
        }
      }
      if (!cancelled) setPreviewUrls(next);
    }

    if (attachments.length > 0) {
      loadPreviews();
    } else {
      setPreviewUrls({});
    }

    return () => {
      cancelled = true;
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  async function ensureDetail() {
    if (detailId) return detailId;

    const detail = await upsertMarkdownDetail(
      projectId,
      { key: detailKey, category, label },
      content,
      existingDetail
    );
    setDetailId(detail.id);
    onSaved?.();
    return detail.id;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const detail = await upsertMarkdownDetail(
        projectId,
        { key: detailKey, category, label },
        content,
        existingDetail?.id ? { ...existingDetail, id: detailId } : existingDetail
      );
      setDetailId(detail.id);
      setSavedAt(Date.now());
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }

    setUploading(true);
    try {
      const id = await ensureDetail();
      await uploadMedia({
        file,
        entityType: "project_detail",
        entityId: id,
        kind: "attachment",
      });
      await loadAttachments(id);
      onSaved?.();
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(mediaId) {
    await deleteMedia(mediaId);
    await loadAttachments(detailId);
    onSaved?.();
  }

  return (
    <>
      <section className={sectionStyles.card}>
        <div className={sectionStyles.cardHeader}>
          <div>
            <h2 className={sectionStyles.cardTitle}>{title}</h2>
            {hint && <p className={sectionStyles.cardHint}>{hint}</p>}
          </div>
          <label className={styles.uploadBtn}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className={styles.uploadInput}
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? "Enviando..." : "Anexar PDF"}
          </label>
        </div>

        <textarea
          className={sectionStyles.textarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={hint}
        />

        <div className={sectionStyles.actions}>
          {savedAt && <span className={sectionStyles.saved}>Salvo</span>}
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar texto"}
          </Button>
        </div>

        <div className={styles.attachmentsBlock}>
          <h3 className={styles.attachmentsTitle}>Anexos PDF</h3>
          {attachments.length === 0 ? (
            <p className={sectionStyles.empty}>
              Nenhum PDF anexado. Use &quot;Anexar PDF&quot; para adicionar contrato ou documentos.
            </p>
          ) : (
            <div className={styles.pdfGrid}>
              {attachments.map((file) => (
                <article key={file.id} className={styles.pdfCard}>
                  <button
                    type="button"
                    className={styles.pdfPreviewBtn}
                    onClick={() => setViewerMedia(file)}
                    aria-label={`Visualizar ${file.original_name}`}
                  >
                    {previewUrls[file.id] ? (
                      <iframe
                        title={file.original_name}
                        src={`${previewUrls[file.id]}#toolbar=0&navpanes=0`}
                        className={styles.pdfThumb}
                      />
                    ) : (
                      <div className={styles.pdfPlaceholder}>
                        <span className={styles.pdfIcon}>PDF</span>
                      </div>
                    )}
                    <span className={styles.pdfOverlay}>Visualizar</span>
                  </button>
                  <div className={styles.pdfMeta}>
                    <p className={styles.pdfName}>{file.original_name}</p>
                    <button
                      type="button"
                      className={sectionStyles.iconBtn}
                      title="Remover"
                      onClick={() => handleRemove(file.id)}
                    >
                      ×
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <PdfViewerModal
        isOpen={Boolean(viewerMedia)}
        onClose={() => setViewerMedia(null)}
        media={viewerMedia}
      />
    </>
  );
}
