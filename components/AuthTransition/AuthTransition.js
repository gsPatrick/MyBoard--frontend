"use client";

import styles from "./AuthTransition.module.css";

export function LogoutOverlay({ visible }) {
  if (!visible) return null;

  return (
    <div className={styles.logoutOverlay} role="status" aria-live="polite" aria-label="Saindo">
      <div className={styles.logoutGlow} aria-hidden="true" />
      <div className={styles.logoutCard}>
        <span className={styles.logoutLogo}>M</span>
        <p className={styles.logoutTitle}>Até logo!</p>
        <p className={styles.logoutSub}>Encerrando sua sessão...</p>
        <div className={styles.logoutBar}>
          <span className={styles.logoutBarFill} />
        </div>
      </div>
    </div>
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
