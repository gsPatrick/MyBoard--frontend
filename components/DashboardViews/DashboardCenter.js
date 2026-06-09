"use client";

import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import ProjectDetailView from "@/components/ProjectDetail/ProjectDetailView";
import ClientDetailView from "@/components/ClientDetail/ClientDetailView";
import CentralView from "./CentralView";
import ProjetosView from "./ProjetosView";
import ClientesView from "./ClientesView";
import LucroView from "./LucroView";
import DemandasView from "./DemandasView";
import BoardView from "./BoardView";
import AgendaView from "./AgendaView";
import ChatsView from "./ChatsView";
import ConfiguracoesView from "./ConfiguracoesView";

const VIEWS = {
  central: CentralView,
  agenda: AgendaView,
  demandas: DemandasView,
  board: BoardView,
  projetos: ProjetosView,
  clientes: ClientesView,
  lucro: LucroView,
  configuracoes: ConfiguracoesView,
};

export default function DashboardCenter() {
  const { selectedProject, selectedClient } = useDashboardNav();
  const { activeTab } = useDashboardTab();

  if (activeTab === "configuracoes") {
    return <ConfiguracoesView />;
  }

  // Chats tem seu próprio seletor de projeto — não cai no detalhe de projeto/cliente.
  if (activeTab === "chats") {
    return <ChatsView />;
  }

  if (selectedClient && activeTab !== "lucro" && activeTab !== "board" && activeTab !== "agenda") {
    return <ClientDetailView />;
  }

  if (selectedProject && activeTab !== "lucro" && activeTab !== "board" && activeTab !== "agenda") {
    return <ProjectDetailView />;
  }

  const showBoard = activeTab === "board";
  const View = VIEWS[activeTab] || CentralView;

  return (
    <>
      <div style={{ display: showBoard ? "block" : "none" }} aria-hidden={!showBoard}>
        <BoardView />
      </div>
      {!showBoard && <View />}
    </>
  );
}
