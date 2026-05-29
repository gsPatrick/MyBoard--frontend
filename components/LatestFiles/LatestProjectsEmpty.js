import styles from "./LatestProjectsEmpty.module.css";

export default function LatestProjectsEmpty() {
  return (
    <div className={styles.wrap} aria-live="polite">
      <div className={styles.art} aria-hidden="true">
        <span className={styles.glow} />
        <svg className={styles.svg} viewBox="0 0 100 88" fill="none">
          <rect x="18" y="24" width="44" height="52" rx="8" className={styles.sheetBack} />
          <rect x="30" y="14" width="44" height="52" rx="8" className={styles.sheetMid} />
          <rect x="42" y="6" width="44" height="52" rx="8" className={styles.sheetFront} />
          <path d="M52 18h24" className={styles.sheetLine} />
          <rect x="52" y="26" width="20" height="5" rx="2.5" className={styles.sheetBar} />
          <rect x="52" y="36" width="28" height="5" rx="2.5" className={styles.sheetBarSoft} />
          <circle cx="72" cy="52" r="10" className={styles.plusRing} />
          <path d="M72 47v10M67 52h10" className={styles.plusMark} strokeLinecap="round" />
        </svg>
      </div>
      <p className={styles.text}>Nenhum projeto adicionado ainda</p>
    </div>
  );
}
