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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="28" height="28">
      <path d="M16.36 12.78c.02 2.5 2.2 3.33 2.22 3.34-.02.06-.35 1.2-1.15 2.37-.69 1.02-1.41 2.03-2.54 2.05-1.11.02-1.47-.66-2.74-.66-1.27 0-1.66.64-2.71.68-1.09.04-1.92-1.1-2.62-2.11-1.43-2.07-2.52-5.85-1.05-8.41.73-1.27 2.03-2.07 3.45-2.09 1.07-.02 2.08.72 2.74.72.65 0 1.88-.89 3.17-.76.54.02 2.06.22 3.03 1.65-.08.05-1.81 1.06-1.8 3.16M14.3 5.39c.58-.7.97-1.68.86-2.65-.84.03-1.85.56-2.45 1.26-.54.62-1.01 1.61-.88 2.56.93.07 1.89-.47 2.47-1.17" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="28" height="28">
      <path d="M3 5.5 10.5 4.4v7.1H3V5.5m0 13 7.5 1.1v-7H3v5.9m8.5 1.2L21 21V12.6h-9.5v7.1m0-15.6L21 3v8.4h-9.5V4.1" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" width="28" height="28">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
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

      <section id="baixar" className={styles.download}>
        <p className={styles.sectionLabel}>Baixar</p>
        <h2 className={styles.downloadTitle}>Use no desktop ou no navegador</h2>
        <div className={styles.downloadGrid}>
          <a
            className={styles.downloadCard}
            href="https://github.com/gsPatrick/MyBoard--mac/releases/latest"
            target="_blank"
            rel="noreferrer"
          >
            <span className={styles.downloadIcon}>
              <AppleIcon />
            </span>
            <span className={styles.downloadName}>Mac</span>
            <span className={styles.downloadHint}>App nativo (.dmg) com Touch ID</span>
            <span className={styles.downloadBtn}>Baixar</span>
          </a>

          <div className={`${styles.downloadCard} ${styles.downloadSoon}`}>
            <span className={styles.downloadIcon}>
              <WindowsIcon />
            </span>
            <span className={styles.downloadName}>Windows</span>
            <span className={styles.downloadHint}>App desktop</span>
            <span className={styles.downloadBadge}>Em breve</span>
          </div>

          <Link className={styles.downloadCard} href="/login">
            <span className={styles.downloadIcon}>
              <GlobeIcon />
            </span>
            <span className={styles.downloadName}>Web</span>
            <span className={styles.downloadHint}>Use direto no navegador</span>
            <span className={styles.downloadBtn}>Abrir</span>
          </Link>
        </div>
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
