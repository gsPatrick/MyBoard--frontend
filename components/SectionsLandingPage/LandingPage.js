"use client";

import Link from "next/link";
import Button from "@/components/Button/Button";
import styles from "./LandingPage.module.css";

const FEATURES = [
  {
    icon: "◎",
    title: "Central em um clique",
    description: "Visão do dia, projetos em andamento e arquivos recentes sem abrir dez abas.",
  },
  {
    icon: "◈",
    title: "Clientes com profundidade",
    description: "Contato, notas, projetos vinculados e financeiro no mesmo perfil.",
  },
  {
    icon: "◷",
    title: "Prazos que não somem",
    description: "Timeline semanal, alertas visuais e projetos atrasados em destaque.",
  },
  {
    icon: "↗",
    title: "Lucro no contexto",
    description: "Entradas por cliente e projeto, filtros e gráficos integrados.",
  },
];

const WORKSPACE_ITEMS = [
  {
    type: "folder",
    label: "Pastas",
    title: "Organize por contexto",
    description:
      "Agrupe projetos em pastas, arraste entre elas e mantenha a raiz limpa para o que importa agora.",
    visual: "folders",
  },
  {
    type: "client",
    label: "Clientes",
    title: "Cada cliente, uma história",
    description:
      "Avatar, contato, observações e todos os projetos do cliente acessíveis em segundos.",
    visual: "clients",
  },
  {
    type: "project",
    label: "Projetos",
    title: "Detalhe sem perder o fio",
    description:
      "Escopo, contrato, demandas, credenciais e GitHub — tudo na página do projeto.",
    visual: "projects",
  },
];

function FolderVisual() {
  return (
    <div className={styles.miniUi}>
      <div className={`${styles.treeRow} ${styles.treeRoot}`}>
        <span className={styles.treeIcon}>▾</span>
        <span className={styles.treeLabel}>Projetos 2025</span>
      </div>
      <div className={styles.treeRow}>
        <span className={styles.treeIndent} />
        <span className={styles.treeIcon}>📁</span>
        <span className={styles.treeLabel}>Clientes ativos</span>
      </div>
      <div className={styles.treeRow}>
        <span className={styles.treeIndent} />
        <span className={styles.treeIcon}>📄</span>
        <span className={styles.treeLabel}>Site redesign</span>
      </div>
      <div className={styles.treeRow}>
        <span className={styles.treeIndentWide} />
        <span className={styles.treeIcon}>📄</span>
        <span className={styles.treeLabel}>App mobile</span>
      </div>
    </div>
  );
}

function ClientVisual() {
  return (
    <div className={styles.miniUi}>
      {["Nice", "Acme Corp", "Studio X"].map((name, i) => (
        <div key={name} className={styles.clientRow} style={{ animationDelay: `${i * 0.1}s` }}>
          <span className={styles.clientAvatar}>{name[0]}</span>
          <div>
            <p className={styles.clientName}>{name}</p>
            <p className={styles.clientMeta}>{i === 0 ? "3 projetos" : "1 projeto"}</p>
          </div>
          <span className={styles.clientBadge}>Ativo</span>
        </div>
      ))}
    </div>
  );
}

function ProjectVisual() {
  return (
    <div className={styles.miniUi}>
      <div className={styles.projectHeader}>
        <span />
        <span />
        <span />
      </div>
      {["Escopo", "Demandas", "Financeiro"].map((tab, i) => (
        <span
          key={tab}
          className={`${styles.projectTab} ${i === 0 ? styles.projectTabOn : ""}`}
        >
          {tab}
        </span>
      ))}
      <div className={styles.projectBlock}>
        <div className={styles.projectLine} />
        <div className={styles.projectLine} />
        <div className={styles.projectLineShort} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.page} data-theme="light">
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <img src="/myboardlogo.png" alt="MyBoard" className={styles.brandLogo} />
        </Link>
        <nav className={styles.navLinks}>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#workspace">Workspace</a>
          <Link href="/login">Entrar</Link>
        </nav>
        <Link href="/login" className={styles.navCta}>
          Começar grátis
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Gestão de projetos</p>
          <h1 className={styles.heroTitle}>
            O workspace que mantém sua operação{" "}
            <em>no mesmo lugar</em>
          </h1>
          <p className={styles.heroText}>
            Clientes, pastas, projetos e prazos em um painel pensado para quem
            gerencia múltiplas entregas — sem planilha paralela, sem caos.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login">
              <Button variant="primary" size="lg">
                Criar conta
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <img src="/myboardlogo.png" alt="MyBoard" className={styles.heroLogo} />
        </div>
      </section>

      <section className={styles.impactCenter}>
        <h2 className={styles.impactQuote}>
          Pare de caçar informação.
          <br />
          Comece a executar com clareza.
        </h2>
      </section>

      <section id="funcionalidades" className={styles.features}>
        <p className={styles.sectionLabel}>Funcionalidades</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workspace" className={styles.workspace}>
        <p className={styles.sectionLabel}>Como funciona</p>
        <h2 className={styles.workspaceTitle}>
          Pastas, clientes e projetos — conectados
        </h2>
        <div className={styles.workspaceGrid}>
          {WORKSPACE_ITEMS.map((item) => (
            <article key={item.type} className={styles.workspaceCard}>
              <span className={styles.workspaceTag}>{item.label}</span>
              <div className={styles.workspaceVisual}>
                {item.visual === "folders" && <FolderVisual />}
                {item.visual === "clients" && <ClientVisual />}
                {item.visual === "projects" && <ProjectVisual />}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.impactCenter}>
        <h2 className={styles.impactQuote}>
          Seu trabalho merece um sistema
          <br />
          à altura da entrega.
        </h2>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Pronto para organizar de verdade?</h2>
          <p>Crie sua conta em menos de um minuto e monte seu workspace hoje.</p>
          <Link href="/login">
            <Button variant="primary" size="lg">
              Começar no MyBoard
            </Button>
          </Link>
        </div>
      </section>

      <div className={styles.footerShell}>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <img src="/myboardlogo.png" alt="MyBoard" className={styles.footerLogo} />
            <p className={styles.footerTagline}>
              MyBoard — o painel para quem vive de projetos, prazos e clientes.
            </p>
          </div>
          <div className={styles.footerCols}>
            <div>
              <p className={styles.footerColTitle}>Produto</p>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#workspace">Workspace</a>
              <Link href="/dashboard">Dashboard</Link>
            </div>
            <div>
              <p className={styles.footerColTitle}>Conta</p>
              <Link href="/login">Entrar</Link>
              <Link href="/login">Criar conta</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} MyBoard. Todos os direitos reservados.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}
