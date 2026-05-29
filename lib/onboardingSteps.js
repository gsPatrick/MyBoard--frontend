export const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo ao MyBoard",
    body: "Vamos fazer um tour rápido pelo workspace. Em poucos passos você vai saber onde organizar clientes, projetos, prazos e financeiro.",
    placement: "center",
  },
  {
    id: "sidebar-left",
    target: '[data-tour="sidebar-left"]',
    title: "Menu lateral esquerdo",
    body: "Aqui ficam seus projetos recentes, prioridades altas e a árvore de pastas. É o mapa da sua operação.",
    placement: "right",
    prepare: { tab: "central", clearSelection: true, leftOpen: true, rightOpen: true },
  },
  {
    id: "sidebar-recent",
    target: '[data-tour="sidebar-recent"]',
    title: "Recentes",
    body: "Os últimos projetos abertos aparecem aqui com o avatar do cliente. Ideal para retomar de onde parou.",
    placement: "right",
    prepare: { tab: "central", clearSelection: true, leftOpen: true },
  },
  {
    id: "sidebar-projects",
    target: '[data-tour="sidebar-projects"]',
    title: "Pastas e projetos",
    body: "Organize entregas em pastas, arraste projetos entre elas e use o botão Nova pasta para estruturar o workspace.",
    placement: "right",
    prepare: { tab: "central", clearSelection: true, leftOpen: true },
  },
  {
    id: "dashboard-tabs",
    target: '[data-tour="dashboard-tabs"]',
    title: "Abas principais",
    body: "Central reúne visão do dia; Projetos e Clientes abrem listagens; Lucro concentra entradas e valores.",
    placement: "bottom",
    prepare: { tab: "central", clearSelection: true },
  },
  {
    id: "tab-projetos",
    target: '[data-tour="tab-projetos"]',
    title: "Aba Projetos",
    body: "Veja todos os projetos com prazo, pasta, valor e status. Clique em um para abrir escopo, demandas, credenciais e mais.",
    placement: "bottom",
    prepare: { tab: "projetos", clearSelection: true },
  },
  {
    id: "tab-lucro",
    target: '[data-tour="tab-lucro"]',
    title: "Aba Lucro",
    body: "Acompanhe recebimentos, orçamentos pendentes e gráficos financeiros por cliente, projeto e tipo de entrada.",
    placement: "bottom",
    prepare: { tab: "lucro", clearSelection: true },
  },
  {
    id: "new-actions",
    target: '[data-tour="new-actions"]',
    title: "Criar cliente e projeto",
    body: "Comece por um cliente e depois crie o projeto — inclusive marcando se veio do 99Freelas, Workana ou é próprio.",
    placement: "bottom",
    prepare: { tab: "central", clearSelection: true },
  },
  {
    id: "header-search",
    target: '[data-tour="header-search"]',
    title: "Busca rápida",
    body: "Encontre clientes e projetos na hora. Atalho: Cmd+K no Mac ou Ctrl+K no Windows.",
    placement: "bottom",
    prepare: { tab: "central", clearSelection: true },
  },
  {
    id: "theme-toggle",
    target: '[data-tour="theme-toggle"]',
    title: "Tema claro ou escuro",
    body: "Clique no botão destacado para alternar entre tema claro e escuro. O MyBoard lembra sua preferência.",
    placement: "bottom",
    interactive: true,
    prepare: { tab: "central", clearSelection: true },
  },
  {
    id: "central-hero",
    target: '[data-tour="central-hero"]',
    title: "Visão da Central",
    body: "Resumo de progresso, projetos abertos e valores a receber — tudo que importa para o dia.",
    tooltipDock: "bottom",
    prepare: { tab: "central", clearSelection: true, scrollBlock: "start" },
  },
  {
    id: "central-timeline",
    target: '[data-tour="central-timeline"]',
    title: "Timeline semanal",
    body: "Projetos em andamento por dia da semana. Prazos vencidos aparecem em destaque para você priorizar.",
    tooltipDock: "bottom",
    prepare: { tab: "central", clearSelection: true, scrollBlock: "center" },
  },
  {
    id: "central-recent",
    target: '[data-tour="central-recent"]',
    title: "Projetos recentes",
    body: "Os últimos projetos criados aparecem aqui. Clique para abrir ou use a zona de upload para anexar arquivos.",
    tooltipDock: "bottom",
    prepare: { tab: "central", clearSelection: true, scrollBlock: "center" },
  },
  {
    id: "sidebar-right",
    target: '[data-tour="sidebar-right"]',
    title: "Painel direito",
    body: "Notificações, atividades recentes e lista de clientes com acesso rápido ao perfil de cada um.",
    placement: "left",
    prepare: { tab: "central", clearSelection: true, rightOpen: true },
  },
  {
    id: "finish",
    title: "Tudo pronto!",
    body: "Seu workspace está configurado. Crie seu primeiro cliente, monte uma pasta e comece a executar com clareza.",
    placement: "center",
    prepare: { tab: "central", clearSelection: true, leftOpen: true, rightOpen: true },
  },
];

export function isOnboardingActive(status) {
  return status === "pending" || status === "in_progress";
}

export function isOnboardingFinished(status) {
  return status === "completed" || status === "skipped";
}
