import styles from "./AiProviderTabs.module.css";

function GptIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.14" />
      <path
        d="M12 4.5c-3.2 0-5.8 2.1-5.8 5.2 0 2.1 1.2 3.9 3 4.8-.4.9-.9 1.8-1.5 2.6 1.3-.2 2.5-.7 3.5-1.4 1 .3 2 .5 3 .5 3.2 0 5.8-2.1 5.8-5.2S15.2 4.5 12 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.14" />
      <path
        d="M8 16.5 12 6l4 10.5M9.2 13.5h5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function GeminiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="geminiGrad" x1="4" y1="4" x2="20" y2="20">
          <stop stopColor="#4285f4" />
          <stop offset="0.5" stopColor="#9b72cb" />
          <stop offset="1" stopColor="#d96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 3.5 14.8 9l6.2 1.1-4.7 4.6 1.1 6.2L12 18.8 6.6 21l1.1-6.2L3 10.1 9.2 9 12 3.5Z"
        fill="url(#geminiGrad)"
      />
    </svg>
  );
}

function CustomIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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

const ICONS = {
  gpt: GptIcon,
  claude: ClaudeIcon,
  gemini: GeminiIcon,
  custom: CustomIcon,
};

export default function AiProviderTabs({ providers, activeId, meta = {}, onChange, disabled = false }) {
  return (
    <div className={styles.grid} role="tablist" aria-label="Provedores de IA">
      {providers.map((provider) => {
        const Icon = ICONS[provider.id];
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
              <Icon />
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
