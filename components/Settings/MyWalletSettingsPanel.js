"use client";

import SettingsPanelShell, { settingsPanelStyles } from "./SettingsPanelShell";
import styles from "./MyWalletSettingsPanel.module.css";

export default function MyWalletSettingsPanel() {
  return (
    <SettingsPanelShell
      title="MyWallet"
      hint="Em breve: conecte o MyBoard ao seu sistema de controle financeiro favorito."
    >
      <div className={styles.content}>
        <article className={`${settingsPanelStyles.card} ${styles.comingSoon}`}>
          <span className={styles.badge}>Em breve</span>
          <h3 className={settingsPanelStyles.cardTitle}>Integração financeira</h3>
          <p className={settingsPanelStyles.cardText}>
            O MyWallet vai permitir sincronizar receitas, despesas e categorias com o
            sistema de controle financeiro que você já usa — sem trocar de ferramenta.
          </p>
          <p className={settingsPanelStyles.cardText}>
            Esta seção será liberada em uma atualização futura. Por enquanto, continue
            usando o Lucro no MyBoard para acompanhar valores do workspace.
          </p>
        </article>
      </div>
    </SettingsPanelShell>
  );
}
