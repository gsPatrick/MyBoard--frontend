"use client";

import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import ProjectDetailView from "@/components/ProjectDetail/ProjectDetailView";
import ClientDetailView from "@/components/ClientDetail/ClientDetailView";
import CentralView from "./CentralView";
import ProjetosView from "./ProjetosView";
import ClientesView from "./ClientesView";
import LucroView from "./LucroView";

const VIEWS = {
  central: CentralView,
  projetos: ProjetosView,
  clientes: ClientesView,
  lucro: LucroView,
};

export default function DashboardCenter() {
  const { selectedProject, selectedClient } = useDashboardNav();
  const { activeTab } = useDashboardTab();

  if (selectedClient && activeTab !== "lucro") {
    return <ClientDetailView />;
  }

  if (selectedProject && activeTab !== "lucro") {
    return <ProjectDetailView />;
  }

  const View = VIEWS[activeTab] || CentralView;
  return <View />;
}
