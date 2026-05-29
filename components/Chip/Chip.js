import styles from "./Chip.module.css";

const STATUS_MAP = {
  "in-progress": { variant: styles.purple, dot: styles.purpleDot },
  complete: { variant: styles.green, dot: styles.greenDot },
  pending: { variant: styles.blue, dot: styles.blueDot },
  approved: { variant: styles.orange, dot: styles.orangeDot },
  rejected: { variant: styles.rejected, dot: styles.rejectedDot },
};

export default function Chip({ children, status = "in-progress", className = "" }) {
  const config = STATUS_MAP[status] || STATUS_MAP["in-progress"];

  return (
    <span className={`${styles.chip} ${config.variant} ${className}`}>
      <span className={`${styles.dot} ${config.dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}
