import shell from "./settingsPanel.module.css";

export default function SettingsPanelShell({ title, hint, action, children }) {
  return (
    <section className={shell.shell}>
      <div className={shell.shellHeader}>
        <div className={shell.shellHeaderText}>
          {title && <h2 className={shell.shellTitle}>{title}</h2>}
          {hint && <p className={shell.shellHint}>{hint}</p>}
        </div>
        {action}
      </div>
      <div className={shell.shellBody}>{children}</div>
    </section>
  );
}

export { shell as settingsPanelStyles };
