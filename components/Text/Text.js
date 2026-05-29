import styles from "./Text.module.css";

const VARIANTS = {
  h1: styles.h1,
  h2: styles.h2,
  h3: styles.h3,
  body: styles.body,
  bodySm: styles.bodySm,
  caption: styles.caption,
  label: styles.label,
};

const TAGS = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  bodySm: "p",
  caption: "span",
  label: "span",
};

export default function Text({
  children,
  variant = "body",
  as,
  muted = false,
  semibold = false,
  className = "",
  ...props
}) {
  const Tag = as || TAGS[variant] || "p";
  const classes = [
    styles.text,
    VARIANTS[variant],
    muted ? styles.muted : "",
    semibold ? styles.semibold : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
