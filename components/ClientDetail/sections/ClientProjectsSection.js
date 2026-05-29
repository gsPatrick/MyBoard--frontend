"use client";

import ProjectsTable from "@/components/ProjectsTable/ProjectsTable";
import { useDashboardNav } from "@/context/DashboardNavContext";
import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";

export default function ClientProjectsSection({ client, projects }) {
  const { selectProject } = useDashboardNav();

  const enrichedProjects = projects.map((project) => ({
    ...project,
    client: {
      id: client.id,
      name: client.name,
      avatar: client.avatar,
    },
  }));

  function handleProjectClick(project) {
    selectProject(project);
  }

  return (
    <section className={sectionStyles.card}>
      <div className={sectionStyles.cardHeader}>
        <div>
          <h2 className={sectionStyles.cardTitle}>Projetos do cliente</h2>
          <p className={sectionStyles.cardHint}>
            {projects.length} projeto(s) vinculado(s) a {client.name}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className={sectionStyles.empty}>
          Nenhum projeto vinculado. Crie um projeto pelo menu superior e associe a este
          cliente.
        </p>
      ) : (
        <ProjectsTable
          projects={enrichedProjects}
          onProjectClick={handleProjectClick}
          emptyMessage="Nenhum projeto"
        />
      )}
    </section>
  );
}
