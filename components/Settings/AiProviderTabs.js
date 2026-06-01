import Image from "next/image";
import styles from "./AiProviderTabs.module.css";

function CustomIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.customSvg}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor" opacity="0.14" />
      <path
        d="M8 9h8M8 12.5h5M8 16h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

export default function AiProviderTabs({ providers, activeId, meta = {}, onChange, disabled = false }) {
  return (
    <div className={styles.grid} role="tablist" aria-label="Provedores de IA">
      {providers.map((provider) => {
        const isActive = activeId === provider.id;
        const isConfigured = Boolean(meta[provider.id]?.has_api_key);

        return (
          <button
            key={provider.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            style={{ "--provider-accent": provider.accent }}
            disabled={disabled}
            onClick={() => onChange(provider.id)}
          >
            <span className={styles.iconWrap}>
              {provider.logo ? (
                <Image
                  src={provider.logo}
                  alt=""
                  width={28}
                  height={28}
                  className={styles.logoImg}
                />
              ) : (
                <CustomIcon />
              )}
            </span>
            <span className={styles.tabText}>
              <strong>{provider.shortLabel || provider.label}</strong>
              <small>{isConfigured ? "Conectado" : "Não configurado"}</small>
            </span>
            {isActive && <span className={styles.activeDot} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
