"use client";

import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./PrivacySettingsPanel.module.css";

const BLOCKS = [
  {
    title: "Dados do workspace",
    text: "Projetos, clientes, arquivos e lançamentos financeiros ficam vinculados à organização em que você está logado. Apenas membros autorizados da mesma organização têm acesso.",
  },
  {
    title: "Sessão e segurança",
    text: 'Sua sessão é armazenada neste navegador. Use "Sair" no menu lateral quando estiver em um computador compartilhado.',
  },
  {
    title: "Em breve",
    text: "Exportação de dados, exclusão de conta e preferências de notificação serão adicionadas nesta seção.",
    muted: true,
  },
];

export default function PrivacySettingsPanel() {
  return (
    <SettingsPanelShell
      title="Privacidade"
      hint="Controle como seus dados são usados no workspace."
    >
      <div className={styles.list}>
        {BLOCKS.map((block) => (
          <article
            key={block.title}
            className={`${settingsPanelStyles.card} ${block.muted ? styles.cardMuted : ""}`}
          >
            <h3 className={settingsPanelStyles.cardTitle}>{block.title}</h3>
            <p className={settingsPanelStyles.cardText}>{block.text}</p>
          </article>
        ))}
      </div>
    </SettingsPanelShell>
  );
}
