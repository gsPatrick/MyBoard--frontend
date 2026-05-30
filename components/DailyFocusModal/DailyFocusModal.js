"use client";

import { useCallback, useEffect, useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import Avatar from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import { listDemands } from "@/api/demands";
import { listProjects } from "@/api/projects";
import { getStoredUser } from "@/api/client";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { normalizeListResponse } from "@/lib/apiList";
import {
  formatFocusDueDate,
  getDailyFocusCopy,
  isDueToday,
  isFocusProject,
  isOpenDemand,
  markDailyFocusShown,
  shouldShowDailyFocus,
  sortFocusDemands,
  sortFocusProjects,
} from "@/lib/dailyFocus";
import { DEMAND_STATUS_LABELS } from "@/lib/projectDetailConfig";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { isProjectOverdue, toDateKey } from "@/lib/roadTimelineDates";
import { ensureActiveTenant } from "@/lib/tenantContext";
import styles from "./DailyFocusModal.module.css";

const DEMAND_CHIP_STATUS = {
  pending: "pending",
  in_progress: "in-progress",
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildSubtitle(projectsCount, demandsCount, overdueCount) {
  const parts = [];

  if (projectsCount === 0) {
    parts.push("Nenhum projeto em andamento no momento.");
  } else {
    parts.push(
      `${projectsCount} projeto${projectsCount === 1 ? "" : "s"} em andamento`
    );
  }

  if (demandsCount > 0) {
    parts.push(
      `${demandsCount} demanda${demandsCount === 1 ? "" : "s"} em aberto`
    );
  }

  let text = parts.join(" · ");

  if (overdueCount > 0) {
    text += `. ${overdueCount} com prazo vencido.`;
  } else {
    text += ".";
  }

  return text;
}

export default function DailyFocusModal() {
  const { selectProject, clearProject, clearClient, clearLucroFilter } = useDashboardNav();
  const { setActiveTab } = useDashboardTab();
  const { active: onboardingActive, loading: onboardingLoading } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [demands, setDemands] = useState([]);
  const [copy, setCopy] = useState({ greeting: "", phrase: "" });

  const load = useCallback(async () => {
    if (!shouldShowDailyFocus()) return;
    if (onboardingActive || onboardingLoading) return;

    setLoading(true);

    try {
      await ensureActiveTenant();
      const [projectsData, demandsData] = await Promise.all([
        listProjects({ status: "in_progress", limit: 100 }),
        listDemands(),
      ]);
      const projectItems = normalizeListResponse(projectsData).filter(isFocusProject);
      const demandItems = sortFocusDemands(
        normalizeListResponse(demandsData).filter(isOpenDemand)
      ).slice(0, 8);
      const user = getStoredUser();

      setCopy(getDailyFocusCopy(user?.name));
      setProjects(sortFocusProjects(projectItems));
      setDemands(demandItems);
      setOpen(true);
    } catch {
      /* não bloqueia o dashboard */
    } finally {
      setLoading(false);
    }
  }, [onboardingActive, onboardingLoading]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleOnboardingFinished() {
      load();
    }

    window.addEventListener("myboard:onboarding-finished", handleOnboardingFinished);
    return () =>
      window.removeEventListener("myboard:onboarding-finished", handleOnboardingFinished);
  }, [load]);

  function dismiss() {
    markDailyFocusShown();
    setOpen(false);
  }

  function handleProjectClick(project) {
    markDailyFocusShown();
    setOpen(false);
    selectProject(project);
  }

  function handleDemandClick() {
    markDailyFocusShown();
    setOpen(false);
    clearProject();
    clearClient();
    clearLucroFilter();
    setActiveTab("demandas");
  }

  if (!open || loading) return null;

  const todayKey = toDateKey(new Date());
  const overdueCount = projects.filter((p) => isProjectOverdue(p, todayKey)).length;
  const hasProjects = projects.length > 0;
  const hasDemands = demands.length > 0;
  const isEmpty = !hasProjects && !hasDemands;

  return (
    <div className={styles.overlay} role="presentation" onClick={dismiss}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-focus-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.glow} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>{copy.greeting}</p>
            <h2 id="daily-focus-title" className={styles.title}>
              {copy.phrase}
            </h2>
            <p className={styles.subtitle}>
              {buildSubtitle(projects.length, demands.length, overdueCount)}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={dismiss} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          {isEmpty ? (
            <div className={styles.empty}>
              <p>Use este momento para planejar a próxima entrega ou revisar a Central.</p>
            </div>
          ) : (
            <>
              {hasProjects && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Projetos em andamento</h3>
                  <ul className={styles.list}>
                    {projects.map((project) => {
                      const overdue = isProjectOverdue(project, todayKey);
                      const dueToday = isDueToday(project);

                      return (
                        <li key={project.id}>
                          <button
                            type="button"
                            className={`${styles.projectCard} ${overdue ? styles.projectOverdue : ""}`}
                            onClick={() => handleProjectClick(project)}
                          >
                            <span
                              className={styles.colorDot}
                              style={{ background: project.color || "#3b82f6" }}
                              aria-hidden="true"
                            />
                            <Avatar
                              src={getClientAvatarUrl(project.client)}
                              name={project.client?.name || project.name}
                              size="sm"
                            />
                            <span className={styles.projectMain}>
                              <span className={styles.projectName}>{project.name}</span>
                              <span className={styles.clientName}>
                                {project.client?.name || "Sem cliente"}
                              </span>
                            </span>
                            <span className={styles.projectMeta}>
                              <span className={styles.due}>{formatFocusDueDate(project)}</span>
                              {overdue && (
                                <Chip status="rejected" className={styles.badge}>
                                  Prazo vencido
                                </Chip>
                              )}
                              {!overdue && dueToday && (
                                <Chip status="in-progress" className={styles.badge}>
                                  Prazo hoje
                                </Chip>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {hasProjects && hasDemands && <div className={styles.sectionDivider} aria-hidden="true" />}

              {hasDemands && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Demandas em aberto</h3>
                  <ul className={styles.list}>
                    {demands.map((demand) => {
                      const project = demand.project;

                      return (
                        <li key={demand.id}>
                          <button
                            type="button"
                            className={styles.demandCard}
                            onClick={handleDemandClick}
                          >
                            <span className={styles.demandMain}>
                              <span className={styles.demandTitle}>{demand.title}</span>
                              {demand.description && (
                                <span className={styles.demandDesc}>{demand.description}</span>
                              )}
                            </span>
                            <span className={styles.demandMeta}>
                              {project && (
                                <span className={styles.demandProject}>
                                  <span
                                    className={styles.colorDot}
                                    style={{ background: project.color || "#3b82f6" }}
                                    aria-hidden="true"
                                  />
                                  {project.name}
                                </span>
                              )}
                              <Chip
                                status={DEMAND_CHIP_STATUS[demand.status] || "pending"}
                                className={styles.badge}
                              >
                                {DEMAND_STATUS_LABELS[demand.status] || demand.status}
                              </Chip>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <p className={styles.footerHint}>Aparece uma vez por dia ao entrar no workspace.</p>
          <Button variant="primary" size="lg" onClick={dismiss}>
            Vamos lá
          </Button>
        </footer>
      </div>
    </div>
  );
}
