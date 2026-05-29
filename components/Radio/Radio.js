import styles from "./Radio.module.css";

export default function Radio({
  label,
  name,
  value,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  id,
}) {
  const radioId = id || `${name}-${value}`;

  return (
    <label
      htmlFor={radioId}
      className={`${styles.label} ${disabled ? styles.disabled : ""} ${className}`}
    >
      <input
        id={radioId}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.control} aria-hidden="true">
        <span className={styles.dot} />
      </span>
      {label && <span className={styles.text}>{label}</span>}
    </label>
  );
}
