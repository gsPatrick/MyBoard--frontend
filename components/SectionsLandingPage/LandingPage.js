"use client";

import Link from "next/link";
import Button from "@/components/Button/Button";
import styles from "./LandingPage.module.css";

const IMPACT_LINES = [
  {
    id: "focus",
    line: "Menos planilha.",
    accent: "Mais entrega.",
    sub: "Centralize clientes, projetos e prazos onde o trabalho realmente acontece.",
  },
  {
    id: "clarity",
    line: "Visão clara.",
    accent: "Decisão rápida.",
    sub: "Saiba o que está em andamento, o que venceu e o que precisa da sua atenção hoje.",
  },
  {
    id: "profit",
    line: "Projetos organizados.",
    accent: "Lucro no radar.",
    sub: "Financeiro por cliente e por projeto, sem perder o fio da operação.",
  },
];

const FEATURES = [
  {
    title: "Workspace unificado",
    description: "Pastas, projetos recentes e prioridade alta na mesma visão.",
  },
  {
    title: "Clientes com contexto",
    description: "Contato, projetos vinculados, notas e histórico financeiro em um só lugar.",
  },
  {
    title: "Semana sob controle",
    description: "Timeline por dia, prazos vencidos em destaque e projetos que não somem do mapa.",
  },
  {
    title: "Feito para quem executa",
    description: "Interface limpa, rápida e pensada para o dia a dia de quem gerencia múltiplos jobs.",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.glowTop} aria-hidden="true" />
      <div className={styles.glowMid} aria-hidden="true" />

      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandName}>MyBoard</span>
        </Link>
        <nav className={styles.navLinks} aria-label="Principal">
          <a href="#recursos">Recursos</a>
          <a href="#visao">Visão</a>
          <Link href="/login">Entrar</Link>
        </nav>
        <Link href="/login" className={styles.navCta}>
          Começar agora
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBadge}>Workspace para gestão de projetos</div>
        <h1 className={styles.heroTitle}>
          Organize sua operação
          <span className={styles.heroGradient}> com clareza absoluta</span>
        </h1>
        <p className={styles.heroLead}>
          MyBoard reúne clientes, projetos, prazos e financeiro em um painel profissional —
          para você parar de apagar incêndio e voltar a construir.
        </p>
        <div className={styles.heroActions}>
          <Link href="/login">
            <Button variant="primary" size="lg">
              Criar conta grátis
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Já tenho acesso
            </Button>
          </Link>
        </div>

        <div className={styles.heroMockup} aria-hidden="true">
          <div className={styles.mockupChrome}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.mockupBody}>
            <div className={styles.mockupSidebar} />
            <div className={styles.mockupMain}>
              <div className={styles.mockupBar} />
              <div className={styles.mockupGrid}>
                <div className={styles.mockupCard} />
                <div className={styles.mockupCard} />
              </div>
              <div className={styles.mockupTable} />
            </div>
          </div>
        </div>
      </section>

      {IMPACT_LINES.map((block, index) => (
        <section
          key={block.id}
          id={index === 0 ? "visao" : undefined}
          className={`${styles.impact} ${index % 2 === 1 ? styles.impactAlt : ""}`}
        >
          <div className={styles.impactInner}>
            <p className={styles.impactLine}>{block.line}</p>
            <p className={styles.impactAccent}>{block.accent}</p>
            <p className={styles.impactSub}>{block.sub}</p>
          </div>
        </section>
      ))}

      <section id="recursos" className={styles.features}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Recursos</p>
          <h2 className={styles.sectionTitle}>Tudo o que importa, sem ruído</h2>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalImpact}>
        <p className={styles.finalLine}>Seu próximo projeto</p>
        <p className={styles.finalAccent}>merece um sistema à altura.</p>
        <Link href="/login" className={styles.finalCta}>
          <Button variant="primary" size="lg">
            Entrar no MyBoard
          </Button>
        </Link>
      </section>

      <footer className={styles.footer}>
        <span className={styles.brandMark}>M</span>
        <p>MyBoard — gestão de projetos para times que entregam de verdade.</p>
        <div className={styles.footerLinks}>
          <Link href="/login">Login</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}
