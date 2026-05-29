"use client";

import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import { getStoredTenant, getStoredUser } from "@/api/client";
import { logout } from "@/api/auth";
import { useRouter } from "next/navigation";
import styles from "./PanelView.module.css";

export default function ConfiguracoesView() {
  const router = useRouter();
  const user = getStoredUser();
  const tenant = getStoredTenant();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className={styles.panel}>
      <section className={styles.card}>
        <h2 className={styles.title}>Configurações</h2>
        <div className={styles.settingsGroup}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Organização</span>
            <span className={styles.settingValue}>{tenant?.name || "—"}</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Usuário</span>
            <span className={styles.settingValue}>{user?.name || "—"}</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>E-mail</span>
            <span className={styles.settingValue}>{user?.email || "—"}</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Perfil</span>
            <span className={styles.settingValue}>{user?.role || "—"}</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.title}>Conta</h2>
        <button type="button" className={styles.row} onClick={handleLogout}>
          <span className={styles.rowTitle}>Sair da conta</span>
        </button>
      </section>
    </div>
  );
}
