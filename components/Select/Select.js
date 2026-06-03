import styles from "./Select.module.css";

export default function Select({
  label,
  value,
  onChange,
  disabled = false,
  error,
  hint,
  className = "",
  id,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${styles.select} ${error ? styles.error : ""}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
