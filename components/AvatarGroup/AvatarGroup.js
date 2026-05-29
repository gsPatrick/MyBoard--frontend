import Avatar from "../Avatar/Avatar";
import styles from "./AvatarGroup.module.css";

export default function AvatarGroup({
  avatars = [],
  max = 4,
  size = "md",
  className = "",
}) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`${styles.group} ${className}`}>
      {visible.map((avatar, index) => (
        <span
          key={avatar.name || avatar.src || index}
          className={styles.item}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </span>
      ))}
      {remaining > 0 && (
        <span className={styles.more}>
          <Avatar name={`+${remaining}`} size={size} />
        </span>
      )}
    </div>
  );
}
