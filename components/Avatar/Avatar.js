import styles from "./Avatar.module.css";

const SIZES = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
};

export default function Avatar({
  src,
  alt = "",
  name,
  size = "md",
  className = "",
}) {
  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <span
      className={`${styles.avatar} ${SIZES[size] || SIZES.md} ${className}`}
      title={name || alt}
    >
      {src ? (
        <img src={src} alt={alt || name || "Avatar"} className={styles.image} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </span>
  );
}
