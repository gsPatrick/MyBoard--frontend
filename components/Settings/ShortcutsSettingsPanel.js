"use client";

import { useMemo } from "react";
import Button from "@/components/Button/Button";
import { useKeyboardShortcuts } from "@/context/KeyboardShortcutsContext";
import {
  SHORTCUT_ACTIONS,
  bindingsEqual,
  formatBinding,
  getDefaultBinding,
} from "@/lib/keyboardShortcuts";
import SettingsPanelShell from "./SettingsPanelShell";
import styles from "./ShortcutsSettingsPanel.module.css";

export default function ShortcutsSettingsPanel() {
  const {
    bindings,
    resetBinding,
    resetAllBindings,
    recordingActionId,
    startRecording,
    stopRecording,
  } = useKeyboardShortcuts();

  const groupedActions = useMemo(() => {
    const groups = new Map();

    SHORTCUT_ACTIONS.forEach((action) => {
      const category = action.category || "Outros";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(action);
    });

    return Array.from(groups.entries());
  }, []);

  const recordingAction = SHORTCUT_ACTIONS.find((action) => action.id === recordingActionId);

  return (
    <SettingsPanelShell
      title="Atalhos de teclado"
      hint="Use combinações com Ctrl/Cmd, Shift ou Alt. Pressione Esc para cancelar a gravação."
      action={
        <Button variant="secondary" size="sm" onClick={resetAllBindings}>
          Restaurar padrões
        </Button>
      }
    >
      {recordingAction && (
        <div className={styles.recordingBanner}>
          Gravando atalho para <strong>{recordingAction.label}</strong> — pressione a combinação
          desejada.
        </div>
      )}

      {groupedActions.map(([category, actions]) => (
        <div key={category} className={styles.group}>
          <p className={styles.groupLabel}>{category}</p>
          {actions.map((action) => {
            const binding = bindings[action.id];
            const defaultBinding = getDefaultBinding(action);
            const isCustom = binding && defaultBinding && !bindingsEqual(binding, defaultBinding);
            const isRecording = recordingActionId === action.id;

            return (
              <div key={action.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>{action.label}</p>
                  {action.description && (
                    <p className={styles.rowDescription}>{action.description}</p>
                  )}
                </div>

                <div className={styles.rowActions}>
                  <span
                    className={`${styles.shortcutBadge} ${
                      isRecording ? styles.shortcutBadgeRecording : ""
                    }`}
                  >
                    {isRecording ? "Pressione..." : formatBinding(binding)}
                  </span>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() =>
                      isRecording ? stopRecording() : startRecording(action.id)
                    }
                  >
                    {isRecording ? "Cancelar" : "Alterar"}
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => resetBinding(action.id)}
                    >
                      Padrão
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </SettingsPanelShell>
  );
}
