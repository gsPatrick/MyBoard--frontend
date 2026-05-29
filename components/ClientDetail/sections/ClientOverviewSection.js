"use client";

import sectionStyles from "../../ProjectDetail/ProjectDetailSection.module.css";
import styles from "../../ProjectDetail/ProjectDetailView.module.css";

export default function ClientOverviewSection({
  client,
  projectsCount,
  totalReceived,
  onNavigate,
  onOpenLucro,
}) {
  const cards = [
    {
      id: "contact",
      title: "Contato",
      desc: [client.email, client.phone].filter(Boolean).join(" · ") || "Dados de contato",
    },
    {
      id: "projects",
      title: "Projetos",
      desc: `${projectsCount} projeto(s) vinculado(s)`,
    },
    {
      id: "notes",
      title: "Observações",
      desc: client.notes?.trim() ? "Notas cadastradas" : "Sem observações",
    },
    {
      id: "financial",
      title: "Financeiro",
      desc: totalReceived > 0 ? "Ver entradas e lucro" : "Nenhuma entrada registrada",
    },
  ];

  return (
    <div className={styles.overview}>
      <section className={sectionStyles.card}>
        <h2 className={sectionStyles.cardTitle}>Sobre o cliente</h2>
        {client.notes?.trim() ? (
          <p className={styles.description}>{client.notes}</p>
        ) : (
          <p className={sectionStyles.empty}>
            Adicione observações na aba Observações ou preencha os dados de contato
            para centralizar as informações do cliente.
          </p>
        )}
      </section>

      <div className={styles.quickGrid}>
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={styles.quickCard}
            onClick={() => {
              if (card.id === "financial") {
                onOpenLucro?.();
              } else {
                onNavigate(card.id);
              }
            }}
          >
            <span className={styles.quickTitle}>{card.title}</span>
            <span className={styles.quickDesc}>{card.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
