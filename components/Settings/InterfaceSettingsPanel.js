"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { getIngestionAuto, setIngestionAuto } from "@/lib/ingestionPrefs";
import {
  CONTENT_WIDTH,
  CONTENT_WIDTH_OPTIONS,
  RIGHT_PANEL_SECTIONS,
  THEME_OPTIONS,
  THEME_PREFERENCE,
} from "@/lib/interfacePreferences";
import { SIDEBAR_COLLAPSE_OPTIONS, SIDEBAR_COLLAPSE_STYLE } from "@/lib/sidebarLayout";
import SettingsPanelShell from "./SettingsPanelShell";
import styles from "./InterfaceSettingsPanel.module.css";

function LayoutPreview({ variant, side }) {
  const isCompact = variant === SIDEBAR_COLLAPSE_STYLE.COMPACT;
  const railClass =
    side === "left"
      ? isCompact
        ? styles.previewLeftCompact
        : styles.previewLeftHidden
      : isCompact
        ? styles.previewRightCompact
        : styles.previewRightHidden;

  return (
    <div className={styles.previewFrame} aria-hidden="true">
      <div className={`${styles.previewRail} ${railClass}`} />
      <div className={styles.previewMain}>
        <div className={styles.previewHeader} />
        <div className={styles.previewGrid}>
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ variant }) {
  return (
    <div
      className={`${styles.themePreview} ${
        variant === THEME_PREFERENCE.DARK
          ? styles.themePreviewDark
          : variant === THEME_PREFERENCE.SYSTEM
            ? styles.themePreviewSystem
            : styles.themePreviewLight
      }`}
      aria-hidden="true"
    >
      <span className={styles.themePreviewBar} />
      <span className={styles.themePreviewCard} />
      <span className={styles.themePreviewCard} />
    </div>
  );
}

function WidthPreview({ variant }) {
  const isFull = variant === CONTENT_WIDTH.FULL;

  return (
    <div className={styles.widthPreview} aria-hidden="true">
      <div className={styles.widthPreviewSide} />
      <div className={`${styles.widthPreviewMain} ${isFull ? styles.widthPreviewMainFull : ""}`}>
        <span />
        <span />
      </div>
      <div className={styles.widthPreviewSide} />
    </div>
  );
}

function OptionCard({ selected, onClick, preview, label, description }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`${styles.optionCard} ${selected ? styles.optionCardActive : ""}`}
      onClick={onClick}
    >
      {preview}
      <span className={styles.optionLabel}>{label}</span>
      <span className={styles.optionDescription}>{description}</span>
    </button>
  );
}

function CollapseStylePicker({ label, hint, value, onChange }) {
  return (
    <div className={styles.pickerBlock}>
      <div className={styles.pickerHeader}>
        <h3 className={styles.pickerTitle}>{label}</h3>
        {hint && <p className={styles.pickerHint}>{hint}</p>}
      </div>

      <div className={styles.optionGrid} role="radiogroup" aria-label={label}>
        {SIDEBAR_COLLAPSE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            selected={value === option.id}
            onClick={() => onChange(option.id)}
            preview={
              <LayoutPreview
                variant={option.id}
                side={label.includes("direito") ? "right" : "left"}
              />
            }
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
}

export default function InterfaceSettingsPanel() {
  const { themePreference, setThemePreference } = useTheme();
  const {
    leftCollapseStyle,
    rightCollapseStyle,
    setLeftCollapseStyle,
    setRightCollapseStyle,
    setBothCollapseStyles,
    contentWidth,
    setContentWidth,
    rightPanelSections,
    setRightPanelSection,
  } = useDashboardLayout();

  const bothMatch = leftCollapseStyle === rightCollapseStyle;
  const enabledSectionCount = Object.values(rightPanelSections).filter(Boolean).length;

  const [ingestAuto, setIngestAuto] = useState(false);
  useEffect(() => {
    setIngestAuto(getIngestionAuto());
  }, []);
  function chooseIngest(auto) {
    setIngestAuto(auto);
    setIngestionAuto(auto);
  }

  function applyBoth(style) {
    setBothCollapseStyles(style);
  }

  function toggleSection(sectionId) {
    const isEnabled = rightPanelSections[sectionId];
    if (isEnabled && enabledSectionCount <= 1) return;
    setRightPanelSection(sectionId, !isEnabled);
  }

  return (
    <SettingsPanelShell
      title="Interface"
      hint="Tema, largura do conteúdo, sidebars e seções do painel direito."
    >
      <div className={styles.section}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Tema</h3>
          <p className={styles.pickerHint}>Aparência geral do workspace.</p>
        </div>
        <div className={`${styles.optionGrid} ${styles.optionGridThree}`} role="radiogroup" aria-label="Tema">
          {THEME_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              selected={themePreference === option.id}
              onClick={() => setThemePreference(option.id)}
              preview={<ThemePreview variant={option.id} />}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Largura do conteúdo</h3>
          <p className={styles.pickerHint}>Como o centro da tela ocupa o espaço disponível.</p>
        </div>
        <div className={styles.optionGrid} role="radiogroup" aria-label="Largura do conteúdo">
          {CONTENT_WIDTH_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              selected={contentWidth === option.id}
              onClick={() => setContentWidth(option.id)}
              preview={<WidthPreview variant={option.id} />}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Layout das sidebars</h3>
          <p className={styles.pickerHint}>
            O que acontece ao recolher pelo header.
          </p>
        </div>

        <div className={styles.syncRow}>
          <span className={styles.syncLabel}>Aplicar nas duas sidebars</span>
          <div className={styles.syncActions}>
            {SIDEBAR_COLLAPSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.syncChip} ${
                  bothMatch && leftCollapseStyle === option.id ? styles.syncChipActive : ""
                }`}
                onClick={() => applyBoth(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <CollapseStylePicker
          label="Menu lateral esquerdo"
          hint="Projetos, pastas e recentes."
          value={leftCollapseStyle}
          onChange={setLeftCollapseStyle}
        />

        <CollapseStylePicker
          label="Painel direito"
          hint="Notificações, atividades e clientes."
          value={rightCollapseStyle}
          onChange={setRightCollapseStyle}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Painel direito</h3>
          <p className={styles.pickerHint}>
            Escolha quais blocos aparecem quando o painel está aberto.
          </p>
        </div>

        <div className={styles.sectionToggles}>
          {Object.values(RIGHT_PANEL_SECTIONS).map((section) => {
            const enabled = rightPanelSections[section.id];
            const isLastEnabled = enabled && enabledSectionCount <= 1;

            return (
              <button
                key={section.id}
                type="button"
                className={`${styles.sectionToggle} ${enabled ? styles.sectionToggleActive : ""}`}
                aria-pressed={enabled}
                disabled={isLastEnabled}
                title={isLastEnabled ? "Mantenha ao menos uma seção visível" : undefined}
                onClick={() => toggleSection(section.id)}
              >
                <span className={styles.sectionToggleLabel}>{section.label}</span>
                <span className={styles.sectionToggleHint}>{section.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Importação por IA</h3>
          <p className={styles.pickerHint}>
            Ao enviar arquivos para a IA importar, escolha se quer revisar antes ou aplicar direto.
          </p>
        </div>
        <div className={styles.optionGrid} role="radiogroup" aria-label="Importação por IA">
          <OptionCard
            selected={!ingestAuto}
            onClick={() => chooseIngest(false)}
            preview={null}
            label="Confirmar no modal"
            description="Revisar cliente, projeto e dados passo a passo antes de criar."
          />
          <OptionCard
            selected={ingestAuto}
            onClick={() => chooseIngest(true)}
            preview={null}
            label="Automático"
            description="A IA cria tudo direto, sem abrir o modal de confirmação."
          />
        </div>
      </div>
    </SettingsPanelShell>
  );
}
