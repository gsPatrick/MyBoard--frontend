"use client";

import { getMarketplaceTabLabel, isMarketplaceOrigin } from "@/lib/projectOrigin";
import sectionStyles from "../ProjectDetailSection.module.css";
import styles from "../ProjectDetailView.module.css";

export default function OverviewSection({
  project,
  openDemandsCount,
  credentialsCount,
  reposCount,
  onNavigate,
}) {
  const marketplaceLabel = getMarketplaceTabLabel(project?.origin);

  const cards = [
    ...(isMarketplaceOrigin(project?.origin)
      ? [
          {
            id: "marketplace",
            title: marketplaceLabel,
            desc: "Chat, escopo da plataforma e links da vaga",
          },
        ]
      : []),
    {
      id: "scope",
      title: "Escopo",
      desc: "Objetivos, entregas e requisitos do projeto",
    },
    {
      id: "contract",
      title: "Contrato",
      desc: "Termos, valores e condições acordadas",
    },
    {
      id: "demands",
      title: "Demandas",
      desc: `${openDemandsCount} em aberto`,
    },
    {
      id: "financial",
      title: "Financeiro",
      desc: "Entradas, adiantamentos e sprints",
    },
    {
      id: "credentials",
      title: "Credenciais",
      desc: `${credentialsCount} acesso(s) salvos`,
    },
    {
      id: "github",
      title: "GitHub",
      desc: `${reposCount} repositório(s)`,
    },
  ];

  return (
    <div className={styles.overview}>
      <section className={sectionStyles.card}>
        <h2 className={sectionStyles.cardTitle}>Sobre o projeto</h2>
        {project.description ? (
          <p className={styles.description}>{project.description}</p>
        ) : (
          <p className={sectionStyles.empty}>
            Adicione uma descrição nas configurações do projeto ou use o escopo
            para detalhar o trabalho.
          </p>
        )}
      </section>

      <div className={styles.quickGrid}>
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={styles.quickCard}
            onClick={() => onNavigate(card.id)}
          >
            <span className={styles.quickTitle}>{card.title}</span>
            <span className={styles.quickDesc}>{card.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
