import Kbd from "../Kbd/Kbd";
import styles from "./SearchInput.module.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SearchInput({
  placeholder = "Search",
  value,
  onChange,
  shortcut = "/",
  className = "",
  ...props
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <span className={styles.icon}>
        <SearchIcon />
      </span>
      <input
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </div>
  );
}
