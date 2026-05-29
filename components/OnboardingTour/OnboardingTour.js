"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button/Button";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingTour.module.css";

const PADDING = 10;
const TOOLTIP_GAP = 16;
const HIGHLIGHT_CLASS = "onboarding-highlight-target";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeTooltipPosition(placement, rect, tooltipSize) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = vw - tooltipSize.width - 16;
  const maxTop = vh - tooltipSize.height - 16;

  if (!rect || placement === "center") {
    return {
      top: clamp(vh / 2 - tooltipSize.height / 2, 16, maxTop),
      left: clamp(vw / 2 - tooltipSize.width / 2, 16, maxLeft),
    };
  }

  let top = rect.top;
  let left = rect.left;

  switch (placement) {
    case "right":
      top = rect.top + rect.height / 2 - tooltipSize.height / 2;
      left = rect.right + TOOLTIP_GAP;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipSize.height / 2;
      left = rect.left - tooltipSize.width - TOOLTIP_GAP;
      break;
    case "bottom":
      top = rect.bottom + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - tooltipSize.width / 2;
      break;
    case "top":
      top = rect.top - tooltipSize.height - TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - tooltipSize.width / 2;
      break;
    default:
      break;
  }

  return {
    top: clamp(top, 16, maxTop),
    left: clamp(left, 16, maxLeft),
  };
}

export default function OnboardingTour() {
  const {
    active,
    loading,
    stepIndex,
    step,
    totalSteps,
    goNext,
    goBack,
    skip,
    complete,
  } = useOnboarding();

  const { setActiveTab } = useDashboardTab();
  const { clearProject, clearClient, clearLucroFilter } = useDashboardNav();
  const { setSidebarsOpen } = useDashboardLayout();

  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 220 });

  const isLast = stepIndex === totalSteps - 1;
  const isFirst = stepIndex === 0;

  const applyPrepare = useCallback(
    (prepare) => {
      if (!prepare) return;

      if (prepare.clearSelection) {
        clearProject();
        clearClient();
        clearLucroFilter();
      }

      if (prepare.tab) {
        setActiveTab(prepare.tab);
      }

      if (prepare.leftOpen !== undefined || prepare.rightOpen !== undefined) {
        setSidebarsOpen({
          left: prepare.leftOpen,
          right: prepare.rightOpen,
        });
      }
    },
    [clearClient, clearLucroFilter, clearProject, setActiveTab, setSidebarsOpen]
  );

  const measureTarget = useCallback(() => {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });

    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      setTargetRect(null);
      return;
    }

    element.classList.add(HIGHLIGHT_CLASS);
    element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      });
    }, 180);
  }, [step]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!active || loading || !step) return;

    applyPrepare(step.prepare);
    const timer = window.setTimeout(measureTarget, 120);

    function handleResize() {
      measureTarget();
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(HIGHLIGHT_CLASS);
      });
    };
  }, [active, loading, step, stepIndex, applyPrepare, measureTarget]);

  useEffect(() => {
    if (!active) {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(HIGHLIGHT_CLASS);
      });
    }
  }, [active]);

  if (!mounted || !active || loading || !step) {
    return null;
  }

  const placement = step.placement || "bottom";
  const tooltipPos = computeTooltipPosition(placement, targetRect, tooltipSize);
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  function handlePrimary() {
    if (isLast) {
      complete();
      return;
    }
    goNext();
  }

  return createPortal(
    <div className={styles.root} role="presentation">
      {!targetRect && <div className={styles.overlayFull} aria-hidden="true" />}

      {targetRect && (
        <div
          className={styles.spotlight}
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className={`${styles.card} ${placement === "center" ? styles.cardCenter : ""}`}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        ref={(node) => {
          if (!node) return;
          const rect = node.getBoundingClientRect();
          if (
            Math.abs(rect.width - tooltipSize.width) > 2 ||
            Math.abs(rect.height - tooltipSize.height) > 2
          ) {
            setTooltipSize({ width: rect.width, height: rect.height });
          }
        }}
      >
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.stepLabel}>
          Passo {stepIndex + 1} de {totalSteps}
        </p>
        <h2 id="onboarding-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.footer}>
          <button type="button" className={styles.skipBtn} onClick={skip}>
            Pular tour
          </button>
          <div className={styles.actions}>
            {!isFirst && (
              <Button variant="ghost" onClick={goBack}>
                Voltar
              </Button>
            )}
            <Button variant="primary" onClick={handlePrimary}>
              {isLast ? "Começar a usar" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
