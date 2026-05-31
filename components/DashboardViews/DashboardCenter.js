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

const VIEWS = {
  central: CentralView,
  demandas: DemandasView,
  board: BoardView,
  projetos: ProjetosView,
  clientes: ClientesView,
  lucro: LucroView,
};

export default function DashboardCenter() {
  const { selectedProject, selectedClient } = useDashboardNav();
  const { activeTab } = useDashboardTab();

  if (selectedClient && activeTab !== "lucro" && activeTab !== "board") {
    return <ClientDetailView />;
  }

  if (selectedProject && activeTab !== "lucro" && activeTab !== "board") {
    return <ProjectDetailView />;
  }

  const View = VIEWS[activeTab] || CentralView;
  return <View />;
}
