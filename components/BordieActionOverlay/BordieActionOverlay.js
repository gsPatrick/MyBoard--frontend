"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { abortBordieRequest } from "@/api/bordie";
import { forceHideBordieActionOverlay } from "@/lib/bordieActionOverlay";
import styles from "./BordieActionOverlay.module.css";

const SAFETY_MS = 20000;

export default function BordieActionOverlay() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleOverlay(event) {
      const nextActive = Boolean(event.detail?.active);
      const nextLabel = String(event.detail?.label || "");

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setActive(nextActive);
      setLabel(nextLabel);

      if (nextActive) {
        timerRef.current = window.setTimeout(() => {
          setActive(false);
          setLabel("");
        }, SAFETY_MS);
      }
    }

    window.addEventListener("myboard:bordie-action-overlay", handleOverlay);
    return () => {
      window.removeEventListener("myboard:bordie-action-overlay", handleOverlay);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!mounted) return null;

  function handleCancel() {
    abortBordieRequest();
    forceHideBordieActionOverlay();
    setActive(false);
    setLabel("");
  }

  const overlay = (
    <div
      className={`${styles.overlay} ${active ? styles.overlayActive : ""}`}
      aria-hidden={!active}
      aria-live="polite"
    >
      <div className={styles.vignette} />
      <div className={styles.shimmer} />
      <div className={styles.shimmerSecondary} />
      <div className={styles.edgeGlow} />
      {active ? (
        <div className={styles.pill}>
          {label ? <p className={styles.label}>{label}</p> : null}
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            aria-label="Cancelar"
            title="Cancelar"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );

  return createPortal(overlay, document.body);
}
