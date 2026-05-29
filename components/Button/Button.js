import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "secondary",
  size = "sm",
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    icon && !children ? styles.iconOnly : "",
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className={styles.icon}>{icon}</span>
      )}
      {children && <span className={styles.label}>{children}</span>}
      {icon && iconPosition === "right" && (
        <span className={styles.icon}>{icon}</span>
      )}
    </button>
  );
}
