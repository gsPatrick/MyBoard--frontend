import styles from "./Divider.module.css";

export default function Divider({
  orientation = "horizontal",
  className = "",
}) {
  return (
    <hr
      className={`${styles.divider} ${styles[orientation]} ${className}`}
      aria-orientation={orientation}
    />
  );
}
