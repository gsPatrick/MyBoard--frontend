"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AuthTransition.module.css";

export function LogoutOverlay({ visible }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!visible || !mounted) return null;

  return createPortal(
    <div className={styles.logoutOverlay} role="status" aria-live="polite" aria-label="Saindo">
      <div className={styles.logoutGlow} aria-hidden="true" />
      <div className={styles.logoutCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/myboardlogo.png" alt="MyBoard" className={styles.logoutLogo} />
        <p className={styles.logoutTitle}>Até logo!</p>
        <p className={styles.logoutSub}>Encerrando sua sessão...</p>
        <div className={styles.logoutBar}>
          <span className={styles.logoutBarFill} />
        </div>
      </div>
    </div>,
    document.body
  );
}

export function LoginWelcomeBanner({ visible, onDismiss }) {
  if (!visible) return null;

  return (
    <div className={styles.welcomeBanner}>
      <span className={styles.welcomeIcon} aria-hidden="true">
        ✓
      </span>
      <p>Você saiu com sucesso. Até a próxima!</p>
      <button type="button" className={styles.welcomeDismiss} onClick={onDismiss} aria-label="Fechar">
        ×
      </button>
    </div>
  );
}
