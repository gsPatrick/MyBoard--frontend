"use client";

import { useState } from "react";
import AccountSettingsPanel from "@/components/Settings/AccountSettingsPanel";
import AiSettingsPanel from "@/components/Settings/AiSettingsPanel";
import InterfaceSettingsPanel from "@/components/Settings/InterfaceSettingsPanel";
import MinhasInformacoesPanel from "@/components/Settings/MinhasInformacoesPanel";
import MyWalletSettingsPanel from "@/components/Settings/MyWalletSettingsPanel";
import PrivacySettingsPanel from "@/components/Settings/PrivacySettingsPanel";
import SessionsSettingsPanel from "@/components/Settings/SessionsSettingsPanel";
import SettingsLayout from "@/components/Settings/SettingsLayout";
import ShortcutsSettingsPanel from "@/components/Settings/ShortcutsSettingsPanel";
import WhatsappSettingsPanel from "@/components/Settings/WhatsappSettingsPanel";
import { useDashboardTab } from "@/context/DashboardTabContext";
import styles from "./ConfiguracoesView.module.css";

export default function ConfiguracoesView() {
  const { setActiveTab } = useDashboardTab();
  const [activeSettingsTab, setActiveSettingsTab] = useState("account");

  function handleBack() {
    setActiveTab("central");
  }

  return (
    <div className={styles.wrap}>
      <SettingsLayout
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
        onBack={handleBack}
      >
        {activeSettingsTab === "ai" && <AiSettingsPanel />}
        {activeSettingsTab === "whatsapp" && <WhatsappSettingsPanel />}
        {activeSettingsTab === "privacy" && <PrivacySettingsPanel />}
        {activeSettingsTab === "account" && <AccountSettingsPanel />}
        {activeSettingsTab === "sessions" && <SessionsSettingsPanel />}
        {activeSettingsTab === "documents" && <MinhasInformacoesPanel />}
        {activeSettingsTab === "interface" && <InterfaceSettingsPanel />}
        {activeSettingsTab === "mywallet" && <MyWalletSettingsPanel />}
        {activeSettingsTab === "shortcuts" && <ShortcutsSettingsPanel />}
      </SettingsLayout>
    </div>
  );
}
