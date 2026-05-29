import styles from "./SidebarEmptyState.module.css";

export default function SidebarEmptyState({ children }) {
  return <p className={styles.empty}>{children}</p>;
}
