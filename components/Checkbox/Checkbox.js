import styles from "./Checkbox.module.css";

export default function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  id,
  name,
}) {
  const checkboxId = id || name || "checkbox";

  return (
    <label
      htmlFor={checkboxId}
      className={`${styles.label} ${disabled ? styles.disabled : ""} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.control} aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none" className={styles.check}>
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className={styles.text}>{label}</span>}
    </label>
  );
}
