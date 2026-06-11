"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import { fetchMediaBlobUrl } from "@/services/media";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import styles from "./PdfViewerModal.module.css";

export default function PdfViewerModal({ isOpen, onClose, media, title }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !media) {
      setSrc(null);
      setError(null);
      return undefined;
    }

    let blobUrl = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const direct = resolveMediaUrl(media);
        if (direct) {
          if (!cancelled) setSrc(direct);
          return;
        }

        blobUrl = await fetchMediaBlobUrl(media.id);
        if (!cancelled) setSrc(blobUrl);
      } catch {
        if (!cancelled) setError("Não foi possível abrir o PDF.");
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

  if (!isOpen) return null;

  const displayTitle = title || media?.original_name || "Documento PDF";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} size="xl">
      <div className={styles.viewer}>
        {loading && <p className={styles.status}>Carregando PDF...</p>}
        {error && <p className={styles.status}>{error}</p>}
        {!loading && !error && src && (
          <iframe
            title={displayTitle}
            src={src}
            className={styles.frame}
          />
        )}
      </div>
    </Modal>
  );
}
