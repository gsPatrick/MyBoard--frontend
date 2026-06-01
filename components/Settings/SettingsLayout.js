"use client";

import { SETTINGS_TAB_GROUPS } from "@/lib/settingsTabs";
import styles from "./SettingsLayout.module.css";

export default function SettingsLayout({
  activeTab = "account",
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
            IA, WhatsApp, privacidade e preferências do workspace.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sideNav} aria-label="Seções de configurações" data-tour="settings-nav">
          {SETTINGS_TAB_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className={styles.sideNavSection}>
              {groupIndex > 0 && <div className={styles.sideNavSectionDivider} role="separator" />}
              <p className={styles.sideNavLabel}>{group.label}</p>
              {group.tabs.map((tab) => (
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
            </div>
          ))}
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
