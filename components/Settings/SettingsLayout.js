"use client";

import { SETTINGS_TABS } from "@/lib/settingsTabs";
import styles from "./SettingsLayout.module.css";

export default function SettingsLayout({
  activeTab = "shortcuts",
  onTabChange,
  onBack,
  children,
}) {
  return (
    <div className={styles.settingsLayout}>
      <header className={styles.header} data-tour="settings-onboarding-anchor">
        <div className={styles.headerMain}>
          {onBack && (
            <button type="button" className={styles.backBtn} onClick={onBack}>
              ← Voltar
            </button>
          )}
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>
            Conta, MyWallet, atalhos e preferências do workspace.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sideNav} aria-label="Seções de configurações" data-tour="settings-nav">
          <p className={styles.sideNavLabel}>Seções</p>
          {SETTINGS_TABS.map((tab, index) => (
            <div key={tab.id} className={styles.sideNavGroup}>
              {index > 0 && <div className={styles.sideNavDivider} role="separator" />}
              <button
                type="button"
                className={`${styles.sideNavItem} ${
                  activeTab === tab.id ? styles.sideNavItemActive : ""
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => onTabChange?.(tab.id)}
              >
                {tab.label}
              </button>
            </div>
          ))}
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
