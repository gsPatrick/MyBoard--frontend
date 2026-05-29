import styles from "./StatusStrip.module.css";

export default function StatusStrip({
  label,
  progress = 51,
  statusText = "Em andamento",
  color = "indigo",
  className = "",
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${styles[color]}`}
          style={{ width: `${clampedProgress}%` }}
        />
        <span className={styles.text}>
          <span className={styles.statusText}>{statusText}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.percent}>{clampedProgress}%</span>
        </span>
      </div>
    </div>
  );
}
