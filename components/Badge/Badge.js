import styles from "./Badge.module.css";

const VARIANTS = {
  default: styles.default,
  indigo: styles.indigo,
  purple: styles.purple,
  green: styles.green,
  blue: styles.blue,
  orange: styles.orange,
  red: styles.red,
};

export default function Badge({
  children,
  variant = "default",
  dot = false,
  className = "",
}) {
  return (
    <span className={`${styles.badge} ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
