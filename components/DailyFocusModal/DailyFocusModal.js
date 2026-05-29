"use client";

import { useCallback, useEffect, useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import Avatar from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import { listProjects } from "@/api/projects";
import { getStoredUser } from "@/api/client";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { normalizeListResponse } from "@/lib/apiList";
import {
  formatFocusDueDate,
  getDailyFocusCopy,
  isDueToday,
  isFocusProject,
  markDailyFocusShown,
  shouldShowDailyFocus,
  sortFocusProjects,
} from "@/lib/dailyFocus";
import { getClientAvatarUrl } from "@/lib/mediaUrl";
import { isProjectOverdue, toDateKey } from "@/lib/roadTimelineDates";
import { ensureActiveTenant } from "@/lib/tenantContext";
import styles from "./DailyFocusModal.module.css";

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

export default function DailyFocusModal() {
  const { selectProject } = useDashboardNav();
  const { active: onboardingActive, loading: onboardingLoading } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [copy, setCopy] = useState({ greeting: "", phrase: "" });

  const load = useCallback(async () => {
    if (!shouldShowDailyFocus()) return;
    if (onboardingActive || onboardingLoading) return;

    setLoading(true);

    try {
      await ensureActiveTenant();
      const data = await listProjects({ status: "in_progress", limit: 100 });
      const items = normalizeListResponse(data).filter(isFocusProject);
      const user = getStoredUser();

      setCopy(getDailyFocusCopy(user?.name));
      setProjects(sortFocusProjects(items));
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

  if (!open || loading) return null;

  const todayKey = toDateKey(new Date());
  const overdueCount = projects.filter((p) => isProjectOverdue(p, todayKey)).length;

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
              {projects.length === 0
                ? "Nenhum projeto em andamento no momento."
                : `${projects.length} projeto${projects.length === 1 ? "" : "s"} em andamento para você executar hoje.`}
              {overdueCount > 0 && (
                <span className={styles.overdueNote}>
                  {" "}
                  {overdueCount} com prazo vencido.
                </span>
              )}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={dismiss} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          {projects.length === 0 ? (
            <div className={styles.empty}>
              <p>Use este momento para planejar a próxima entrega ou revisar a Central.</p>
            </div>
          ) : (
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
