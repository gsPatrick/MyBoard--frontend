import styles from "./Tab.module.css";

export default function Tab({
  label,
  active = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      className={`${styles.tab} ${active ? styles.active : ""} ${className}`}
      onClick={onClick}
      aria-selected={active}
      role="tab"
    >
      <span className={styles.label}>{label}</span>
      {active && <span className={styles.indicator} aria-hidden="true" />}
    </button>
  );
}
