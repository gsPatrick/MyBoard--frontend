import styles from "./RoadTimelineEmpty.module.css";

export default function RoadTimelineEmpty() {
  return (
    <div className={styles.wrap} aria-live="polite">
      <div className={styles.art} aria-hidden="true">
        <span className={styles.glow} />
        <span className={styles.glowSecondary} />
        <svg className={styles.svg} viewBox="0 0 120 100" fill="none">
          <rect x="28" y="18" width="64" height="64" rx="10" className={styles.cardShape} />
          <path d="M28 32h64" className={styles.cardLine} />
          <circle cx="40" cy="25" r="2.5" className={styles.cardDot} />
          <circle cx="48" cy="25" r="2.5" className={styles.cardDot} />
          <circle cx="56" cy="25" r="2.5" className={styles.cardDot} />
          <rect x="38" y="44" width="18" height="6" rx="3" className={styles.barMuted} />
          <rect x="38" y="56" width="28" height="6" rx="3" className={styles.barSoft} />
          <rect x="38" y="68" width="22" height="6" rx="3" className={styles.barFaint} />
          <circle cx="78" cy="73" r="11" className={styles.checkRing} />
          <path
            d="M73 73l3.5 3.5 7-7"
            className={styles.checkMark}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className={styles.text}>Nada na timeline deste dia</p>
    </div>
  );
}
