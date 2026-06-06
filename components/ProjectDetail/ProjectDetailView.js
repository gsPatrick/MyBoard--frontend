"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Tab from "@/components/Tab/Tab";
import ProjectStatusMenu from "@/components/ProjectStatusMenu/ProjectStatusMenu";
import { getProject } from "@/api/projects";
import { listProjectDemands } from "@/api/projectDemands";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { ensureActiveTenant } from "@/lib/tenantContext";
import {
  CONTRACT_DETAIL_KEY,
  findDetailByKey,
  MARKETPLACE_CHAT_NOTES_KEY,
  MARKETPLACE_CHAT_URL_KEY,
  MARKETPLACE_PLATFORM_SCOPE_KEY,
  MARKETPLACE_PROJECT_URL_KEY,
  SCOPE_DETAIL_KEY,
} from "@/lib/projectDetailConfig";
import { loadGroupedProjectDetails } from "@/lib/projectDetailsHelpers";
import { formatCurrencyBRL } from "@/lib/projectStats";
import {
  getMarketplaceTabLabel,
  isMarketplaceOrigin,
  PROJECT_ORIGIN_LABELS,
} from "@/lib/projectOrigin";
import ProjectDetailAside from "./ProjectDetailAside";
import OverviewSection from "./sections/OverviewSection";
import FinancialSection from "./sections/FinancialSection";
import ScopeContractSection from "./sections/ScopeContractSection";
import DemandsSection from "./sections/DemandsSection";
import CredentialsSection from "./sections/CredentialsSection";
import GithubSection from "./sections/GithubSection";
import ProjectWhatsappSection from "./sections/ProjectWhatsappSection";
import MarketplaceSection from "./sections/MarketplaceSection";
import AdditionalDetailsSection from "./sections/AdditionalDetailsSection";
import styles from "./ProjectDetailView.module.css";

const HANDLED_DETAIL_KEYS = new Set([
  SCOPE_DETAIL_KEY,
  CONTRACT_DETAIL_KEY,
  MARKETPLACE_PROJECT_URL_KEY,
  MARKETPLACE_CHAT_URL_KEY,
  MARKETPLACE_PLATFORM_SCOPE_KEY,
  MARKETPLACE_CHAT_NOTES_KEY,
]);

const BASE_SECTIONS = [
  { id: "overview", label: "Visão geral" },
  { id: "scope", label: "Escopo" },
  { id: "contract", label: "Contrato" },
  { id: "demands", label: "Demandas" },
  { id: "financial", label: "Financeiro" },
  { id: "credentials", label: "Credenciais" },
  { id: "github", label: "GitHub" },
  { id: "additional", label: "Outros dados" },
  { id: "whatsapp", label: "WhatsApp" },
];

function buildSections(origin) {
  if (!isMarketplaceOrigin(origin)) return BASE_SECTIONS;

  const platformLabel = getMarketplaceTabLabel(origin);
  const sections = [...BASE_SECTIONS];
  sections.splice(1, 0, { id: "marketplace", label: platformLabel });
  return sections;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectDetailView() {
  const { selectedProject, clearProject } = useDashboardNav();
  const [project, setProject] = useState(null);
  const [groupedDetails, setGroupedDetails] = useState({});
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const flatDetails = useMemo(
    () => Object.values(groupedDetails).flat(),
    [groupedDetails]
  );

  const scopeDetail = findDetailByKey(flatDetails, SCOPE_DETAIL_KEY);
  const contractDetail = findDetailByKey(flatDetails, CONTRACT_DETAIL_KEY);
  const credentials = groupedDetails.credentials || [];
  const repos = groupedDetails.github || [];
  const additionalDetails = useMemo(
    () =>
      flatDetails.filter(
        (d) =>
          d.category !== "credentials" &&
          d.category !== "github" &&
          !HANDLED_DETAIL_KEYS.has(d.key)
      ),
    [flatDetails]
  );

  const openDemandsCount = demands.filter(
    (d) => d.status !== "done" && d.status !== "cancelled"
  ).length;

  const sections = useMemo(
    () => buildSections(project?.origin),
    [project?.origin]
  );

  const reload = useCallback(async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    setError(null);

    try {
      await ensureActiveTenant();
      const [projectData, grouped, demandsData] = await Promise.all([
        getProject(selectedProject.id, { includeDetails: false }),
        loadGroupedProjectDetails(selectedProject.id),
        listProjectDemands(selectedProject.id),
      ]);
      setProject(projectData);
      setGroupedDetails(grouped || {});
      setDemands(Array.isArray(demandsData) ? demandsData : []);
    } catch {
      setProject(null);
      setError("Não foi possível carregar o projeto.");
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    reload();
    window.addEventListener("myboard:workspace-refresh", reload);
    return () => window.removeEventListener("myboard:workspace-refresh", reload);
  }, [reload]);

  useEffect(() => {
    if (activeSection === "marketplace" && project && !isMarketplaceOrigin(project.origin)) {
      setActiveSection("overview");
    }
  }, [activeSection, project?.origin]);

  async function reloadDetails() {
    if (!selectedProject?.id) return;
    const grouped = await loadGroupedProjectDetails(selectedProject.id);
    setGroupedDetails(grouped || {});
  }

  async function reloadDemands() {
    if (!selectedProject?.id) return;
    const demandsData = await listProjectDemands(selectedProject.id);
    setDemands(Array.isArray(demandsData) ? demandsData : []);
  }

  if (!selectedProject) return null;

  if (loading) {
    return <p className={styles.loading}>Carregando projeto...</p>;
  }

  if (error || !project) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={clearProject}>
          ← Voltar ao workspace
        </button>
        <p className={styles.error}>{error || "Projeto não encontrado."}</p>
      </div>
    );
  }

  const displayName = project.name || selectedProject.name;

  function handleProjectUpdated(updated) {
    setProject((current) => ({ ...current, ...updated }));
  }

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={clearProject}>
        ← Voltar ao workspace
      </button>

      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroTop}>
            <span
              className={styles.iconDot}
              style={{ background: project.color || "#3b82f6" }}
              aria-hidden="true"
            />
            <h1 className={styles.title}>{displayName}</h1>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Status</span>
              <ProjectStatusMenu project={project} onUpdated={handleProjectUpdated} />
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Prazo</span>
              <p className={styles.metricValue}>{formatDate(project.due_date)}</p>
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Orçamento</span>
              <p className={styles.metricValue}>
                {project.budget != null ? formatCurrencyBRL(project.budget) : "—"}
              </p>
            </div>
            <span className={styles.divider} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Origem</span>
              <p className={styles.metricValue}>
                {PROJECT_ORIGIN_LABELS[project.origin] || "Próprio"}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.heroSide}>
          <ProjectStatusMenu project={project} onUpdated={handleProjectUpdated} />
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <nav className={styles.tabs} role="tablist" aria-label="Seções do projeto">
            {sections.map((section) => (
              <Tab
                key={section.id}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </nav>

          <div className={styles.body}>
            {activeSection === "overview" && (
              <OverviewSection
                project={project}
                openDemandsCount={openDemandsCount}
                credentialsCount={credentials.length}
                reposCount={repos.length}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === "marketplace" && isMarketplaceOrigin(project.origin) && (
              <MarketplaceSection
                projectId={project.id}
                origin={project.origin}
                flatDetails={flatDetails}
                onSaved={reloadDetails}
              />
            )}

            {activeSection === "scope" && (
              <ScopeContractSection
                projectId={project.id}
                title="Escopo do projeto"
                hint="Descreva objetivos, entregas, requisitos e o que está incluído no trabalho."
                category="scope"
                detailKey={SCOPE_DETAIL_KEY}
                label="Escopo do projeto"
                existingDetail={scopeDetail}
                onSaved={reloadDetails}
              />
            )}

            {activeSection === "contract" && (
              <ScopeContractSection
                projectId={project.id}
                title="Contrato"
                hint="Valores, prazos contratuais, escopo fechado, pagamentos e observações legais."
                category="documentation"
                detailKey={CONTRACT_DETAIL_KEY}
                label="Contrato"
                existingDetail={contractDetail}
                onSaved={reloadDetails}
              />
            )}

            {activeSection === "demands" && (
              <DemandsSection
                projectId={project.id}
                demands={demands}
                onChange={reloadDemands}
              />
            )}

            {activeSection === "financial" && (
              <FinancialSection project={project} onChange={reload} />
            )}

            {activeSection === "credentials" && (
              <CredentialsSection
                projectId={project.id}
                credentials={credentials}
                onChange={reloadDetails}
              />
            )}

            {activeSection === "github" && (
              <GithubSection
                projectId={project.id}
                repos={repos}
                onChange={reloadDetails}
              />
            )}

            {activeSection === "additional" && (
              <AdditionalDetailsSection
                projectId={project.id}
                details={additionalDetails}
                onChange={reloadDetails}
              />
            )}

            {activeSection === "whatsapp" && (
              <ProjectWhatsappSection projectId={project.id} />
            )}
          </div>
        </div>

        <ProjectDetailAside project={project} onProjectChange={setProject} />
      </div>
    </div>
  );
}
