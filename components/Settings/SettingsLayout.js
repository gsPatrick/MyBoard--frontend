"use client";

import { SETTINGS_TABS } from "@/lib/keyboardShortcuts";
import styles from "./SettingsLayout.module.css";

export default function SettingsLayout({
  activeTab = "shortcuts",
  onTabChange,
  onBack,
  children,
}) {
  return (
    <div className={styles.settingsLayout} data-tour="settings-view">
      <header className={styles.header}>
        <div className={styles.headerMain}>
          {onBack && (
            <button type="button" className={styles.backBtn} onClick={onBack}>
              ← Voltar
            </button>
          )}
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>
            Personalize atalhos e preferências do workspace.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sideNav} aria-label="Seções de configurações">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.sideNavItem} ${
                activeTab === tab.id ? styles.sideNavItemActive : ""
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
