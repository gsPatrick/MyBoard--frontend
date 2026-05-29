import styles from "./Card.module.css";

const PADDING = {
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}) {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${PADDING[padding] || PADDING.md} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerText}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}
