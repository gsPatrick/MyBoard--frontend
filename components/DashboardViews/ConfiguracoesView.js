"use client";

import { useState } from "react";
import AccountSettingsPanel from "@/components/Settings/AccountSettingsPanel";
import InterfaceSettingsPanel from "@/components/Settings/InterfaceSettingsPanel";
import MyWalletSettingsPanel from "@/components/Settings/MyWalletSettingsPanel";
import PrivacySettingsPanel from "@/components/Settings/PrivacySettingsPanel";
import SettingsLayout from "@/components/Settings/SettingsLayout";
import ShortcutsSettingsPanel from "@/components/Settings/ShortcutsSettingsPanel";
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
        {activeSettingsTab === "account" && <AccountSettingsPanel />}
        {activeSettingsTab === "interface" && <InterfaceSettingsPanel />}
        {activeSettingsTab === "mywallet" && <MyWalletSettingsPanel />}
        {activeSettingsTab === "shortcuts" && <ShortcutsSettingsPanel />}
        {activeSettingsTab === "privacy" && <PrivacySettingsPanel />}
      </SettingsLayout>
    </div>
  );
}
