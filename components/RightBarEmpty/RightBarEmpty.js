import styles from "./RightBarEmpty.module.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 6.5c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2 1 3 1.5 3.5H3.5C4 9.5 5 8.5 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M7 11.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M4 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M2.5 13c0-1.9 1.6-3.5 3.5-3.5M10 13c0-1.2.8-2.2 2-2.6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

const VARIANTS = {
  notifications: {
    icon: BellIcon,
    iconBg: "color1",
    title: "Nenhuma notificação",
    hint: "Alertas de projetos, clientes e uploads aparecem aqui.",
  },
  activities: {
    icon: ActivityIcon,
    iconBg: "color2",
    title: "Sem atividades recentes",
    hint: "Criar clientes, projetos ou pastas gera entradas nesta linha do tempo.",
  },
  contacts: {
    icon: ContactsIcon,
    iconBg: "color1",
    title: "Nenhum cliente",
    hint: "Cadastre clientes para vê-los nesta lista rápida.",
  },
};

export function RightBarLoading({ rows = 3, variant = "feed" }) {
  return (
    <div className={styles.skeletonWrap} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`${styles.skeletonRow} ${variant === "contact" ? styles.skeletonContact : ""}`}
        >
          <span className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <span className={styles.skeletonLine} />
            <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RightBarEmpty({
  variant = "notifications",
  title,
  hint,
  action,
}) {
  const config = VARIANTS[variant] || VARIANTS.notifications;
  const Icon = config.icon;
  const displayTitle = title ?? config.title;
  const displayHint = hint ?? config.hint;

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <span className={`${styles.iconWrap} ${styles[config.iconBg]}`}>
          <Icon />
        </span>
        <div className={styles.copy}>
          <p className={styles.title}>{displayTitle}</p>
          {displayHint && <p className={styles.hint}>{displayHint}</p>}
        </div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
