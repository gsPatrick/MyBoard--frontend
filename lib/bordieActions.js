import { DASHBOARD_TABS } from "@/context/DashboardTabContext";

const TAB_LABELS = Object.fromEntries(DASHBOARD_TABS.map((tab) => [tab.id, tab.label]));

function dispatchBordieAction(actionId, payload = {}) {
  window.dispatchEvent(
    new CustomEvent("myboard:bordie-action", {
      detail: { action: actionId, ...payload },
    })
  );
}

function dispatchShortcut(actionId) {
  window.dispatchEvent(
    new CustomEvent("myboard:shortcut", { detail: { action: actionId } })
  );
}

export function buildBordieContext({ activeTab, selectedProject, selectedClient, boardContext, policyMode }) {
  return {
    activeTab,
    active_tab: activeTab,
    activeTabLabel: TAB_LABELS[activeTab] || activeTab,
    project: selectedProject
      ? { id: selectedProject.id, name: selectedProject.name }
      : null,
    client: selectedClient ? { id: selectedClient.id, name: selectedClient.name } : null,
    board: boardContext
      ? {
          id: boardContext.id,
          name: boardContext.name,
          scene_data: boardContext.scene_data,
          summary: boardContext.summary,
        }
      : null,
    board_id: boardContext?.id || null,
    policy_mode: policyMode || null,
  };
}

export function getBordieActions(context, handlers = {}) {
  const { activeTab, activeTabLabel, project, client } = context;
  const actions = [];

  actions.push({
    id: "bordie.help",
    label: "O que você pode fazer?",
    description: "Ver sugestões com base na tela atual",
    category: "Bordie",
    keywords: ["ajuda", "help", "comandos"],
    run: () => handlers.onHelp?.(),
  });

  actions.push({
    id: "layout.refresh",
    label: "Atualizar dados do workspace",
    description: "Recarrega projetos, clientes e painéis",
    category: "Geral",
    keywords: ["atualizar", "refresh", "sync"],
    run: () => handlers.refreshAll?.(),
  });

  actions.push({
    id: "search.open",
    label: "Abrir pesquisa",
    description: "Buscar projetos e clientes",
    category: "Geral",
    keywords: ["buscar", "pesquisar", "search"],
    run: () => handlers.openSearch?.(),
  });

  if (activeTab !== "central") {
    actions.push({
      id: "nav.central",
      label: "Ir para Central",
      description: "Visão geral do dia",
      category: "Navegação",
      keywords: ["central", "dashboard", "início"],
      run: () => handlers.navigateToTab?.("central"),
    });
  }

  if (activeTab !== "board") {
    actions.push({
      id: "nav.board",
      label: "Ir para Board",
      description: "Quadro visual Excalidraw",
      category: "Navegação",
      keywords: ["board", "quadro", "canvas"],
      run: () => handlers.navigateToTab?.("board"),
    });
  }

  if (activeTab === "board") {
    actions.push(
      {
        id: "board.organize",
        label: "Organizar elementos do quadro",
        description: "Alinha e distribui shapes no canvas (em breve via IA)",
        category: "Board",
        keywords: ["organizar", "alinhar", "arrumar", "layout"],
        run: () => dispatchBordieAction("board.organize", { context }),
      },
      {
        id: "board.add-note",
        label: "Adicionar nota no quadro",
        description: "Cria um sticky note no centro do canvas",
        category: "Board",
        keywords: ["nota", "sticky", "post-it", "texto"],
        run: () => dispatchBordieAction("board.add-note", { context }),
      },
      {
        id: "board.summarize",
        label: "Resumir conteúdo do board",
        description: "Bordie analisa o que está desenhado",
        category: "Board",
        keywords: ["resumir", "resumo", "analisar"],
        run: () => handlers.runPrompt?.("Resuma o conteúdo atual deste board"),
      },
      {
        id: "board.clear-selection",
        label: "Limpar seleção do canvas",
        description: "Desmarca todos os elementos selecionados",
        category: "Board",
        keywords: ["limpar", "seleção", "deselect"],
        run: () => dispatchBordieAction("board.clear-selection", { context }),
      }
    );
  }

  if (activeTab === "central") {
    actions.push(
      {
        id: "central.focus-day",
        label: "Resumir foco do dia",
        description: "Prioridades e prazos de hoje",
        category: "Central",
        keywords: ["foco", "hoje", "prioridade", "dia"],
        run: () => handlers.runPrompt?.("Quais são minhas prioridades para hoje?"),
      },
      {
        id: "central.overdue",
        label: "Listar projetos atrasados",
        description: "Projetos com prazo vencido",
        category: "Central",
        keywords: ["atrasado", "atraso", "prazo"],
        run: () => handlers.runPrompt?.("Liste projetos atrasados ou com prazo crítico"),
      }
    );
  }

  if (activeTab === "demandas") {
    actions.push({
      id: "demands.new",
      label: "Nova demanda",
      description: "Abre o formulário de criação",
      category: "Demandas",
      keywords: ["demanda", "tarefa", "criar", "nova"],
      run: () => dispatchShortcut("modal.newDemand"),
    });
  }

  if (activeTab === "agenda") {
    actions.push(
      {
        id: "agenda.new-event",
        label: "Novo evento na agenda",
        category: "Agenda",
        keywords: ["evento", "agendar", "reunião"],
        run: () => dispatchShortcut("modal.newEvent"),
      },
      {
        id: "agenda.today",
        label: "Ir para hoje na agenda",
        category: "Agenda",
        keywords: ["hoje", "today"],
        run: () => dispatchShortcut("agenda.today"),
      }
    );
  }

  if (activeTab === "projetos" || project) {
    actions.push({
      id: "modal.newProject",
      label: "Novo projeto",
      category: "Criar",
      keywords: ["projeto", "criar"],
      run: () => dispatchShortcut("modal.newProject"),
    });
  }

  if (activeTab === "clientes" || client) {
    actions.push({
      id: "modal.newClient",
      label: "Novo cliente",
      category: "Criar",
      keywords: ["cliente", "criar"],
      run: () => dispatchShortcut("modal.newClient"),
    });
  }

  if (project) {
    actions.push({
      id: "context.project-summary",
      label: `Resumir projeto “${project.name}”`,
      description: "Contexto do projeto selecionado",
      category: "Contexto",
      keywords: ["projeto", project.name.toLowerCase()],
      run: () =>
        handlers.runPrompt?.(`Resuma o status e próximos passos do projeto ${project.name}`),
    });
  }

  if (client) {
    actions.push({
      id: "context.client-summary",
      label: `Resumir cliente “${client.name}”`,
      description: "Contexto do cliente selecionado",
      category: "Contexto",
      keywords: ["cliente", client.name.toLowerCase()],
      run: () =>
        handlers.runPrompt?.(`Resuma a relação e projetos do cliente ${client.name}`),
    });
  }

  actions.push({
    id: "nav.settings",
    label: "Abrir configurações",
    category: "Geral",
    keywords: ["configurações", "settings", "preferências"],
    run: () => handlers.navigateToTab?.("configuracoes"),
  });

  return actions.map((action) => ({
    ...action,
    contextLabel: activeTabLabel,
  }));
}

export function filterBordieActions(actions, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return actions;

  return actions.filter((action) => {
    const haystack = [
      action.label,
      action.description,
      action.category,
      ...(action.keywords || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return trimmed.split(/\s+/).every((term) => haystack.includes(term));
  });
}

export function groupBordieActions(actions) {
  const groups = new Map();

  actions.forEach((action) => {
    const category = action.category || "Outros";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(action);
  });

  return Array.from(groups.entries());
}
