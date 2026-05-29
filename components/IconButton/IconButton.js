import styles from "./IconButton.module.css";

const SIZES = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export default function IconButton({
  children,
  size = "md",
  variant = "secondary",
  label,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${SIZES[size]} ${styles[variant]} ${className}`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
