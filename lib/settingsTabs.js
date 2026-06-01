export const SETTINGS_TABS = [
  { id: "account", label: "Conta" },
  { id: "interface", label: "Interface" },
  { id: "mywallet", label: "MyWallet" },
  { id: "shortcuts", label: "Atalhos" },
  { id: "privacy", label: "Privacidade" },
];

export function getSettingsTabLabel(tabId) {
  return SETTINGS_TABS.find((tab) => tab.id === tabId)?.label || tabId;
}
