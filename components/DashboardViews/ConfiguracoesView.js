"use client";

import { useState } from "react";
import SettingsLayout from "@/components/Settings/SettingsLayout";
import ShortcutsSettingsPanel from "@/components/Settings/ShortcutsSettingsPanel";
import { useDashboardTab } from "@/context/DashboardTabContext";

export default function ConfiguracoesView() {
  const { setActiveTab } = useDashboardTab();
  const [activeSettingsTab, setActiveSettingsTab] = useState("shortcuts");

  function handleBack() {
    setActiveTab("central");
  }

  return (
    <SettingsLayout
      activeTab={activeSettingsTab}
      onTabChange={setActiveSettingsTab}
      onBack={handleBack}
    >
      {activeSettingsTab === "shortcuts" && <ShortcutsSettingsPanel />}
    </SettingsLayout>
  );
}
