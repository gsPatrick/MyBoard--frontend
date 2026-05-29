"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

const AUTO_DISMISS_MS = 4000;

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
      <path
        d="M3.5 8.2 6.4 11 12.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
      <path
        d="M8 5.2v3.6M8 11.6h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);
  const isSuccess = toast.type === "success";

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onDismiss(toast.id), 220);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      className={`${styles.toast} ${isSuccess ? styles.success : styles.error} ${
        leaving ? styles.toastLeaving : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.iconWrap}>{isSuccess ? <CheckIcon /> : <ErrorIcon />}</span>
      <div className={styles.content}>
        <p className={styles.message}>{toast.message}</p>
      </div>
      <button type="button" className={styles.closeBtn} onClick={dismiss} aria-label="Fechar">
        ×
      </button>
    </div>
  );
}

export default function Toaster() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleToast(event) {
      const { type = "success", message = "Concluído com sucesso" } = event.detail || {};
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((current) => [...current, { id, type, message }].slice(-4));
    }

    window.addEventListener("myboard:toast", handleToast);
    return () => window.removeEventListener("myboard:toast", handleToast);
  }, []);

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  );
}
