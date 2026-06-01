export const SETTINGS_TAB_GROUPS = [
  {
    id: "workspace",
    label: "Workspace",
    tabs: [
      { id: "account", label: "Conta" },
      { id: "interface", label: "Interface" },
      { id: "shortcuts", label: "Atalhos" },
    ],
  },
  {
    id: "integrations",
    label: "Integrações",
    tabs: [
      { id: "ai", label: "IA" },
      { id: "whatsapp", label: "WhatsApp" },
      { id: "mywallet", label: "MyWallet" },
      { id: "privacy", label: "Política de privacidade" },
    ],
  },
];

export const SETTINGS_TABS = SETTINGS_TAB_GROUPS.flatMap((group) => group.tabs);

export function getSettingsTabLabel(tabId) {
  return SETTINGS_TABS.find((tab) => tab.id === tabId)?.label || tabId;
}

export const BORDIE_POLICY_OPTIONS = [
  {
    id: "confirm_sensitive",
    label: "Confirmar ações sensíveis",
    description: "Board e leitura automáticas; confirma envio WhatsApp e limpeza do canvas.",
  },
  {
    id: "always_confirm",
    label: "Sempre confirmar",
    description: "Bordie pede confirmação antes de qualquer ação.",
  },
  {
    id: "auto_execute",
    label: "Executar automaticamente",
    description: "Ações seguras rodam direto; sensíveis ainda pedem confirmação para não-admins.",
  },
];
