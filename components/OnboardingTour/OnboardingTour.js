"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button/Button";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import { useOnboarding } from "@/context/OnboardingContext";
import styles from "./OnboardingTour.module.css";

const PADDING = 10;
const TOOLTIP_GAP = 20;
const VIEWPORT_MARGIN = 16;
const DOCK_GAP = 20;
const HIGHLIGHT_CLASS = "onboarding-highlight-target";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipBox(top, left, width, height) {
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

function boxesOverlap(a, b, gap = 0) {
  return !(
    a.right + gap <= b.left ||
    a.left >= b.right + gap ||
    a.bottom + gap <= b.top ||
    a.top >= b.bottom + gap
  );
}

function fitsViewport(box, vw, vh) {
  return (
    box.top >= VIEWPORT_MARGIN &&
    box.left >= VIEWPORT_MARGIN &&
    box.bottom <= vh - VIEWPORT_MARGIN &&
    box.right <= vw - VIEWPORT_MARGIN
  );
}

function computeDockedPosition(dock, tooltipSize) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = clamp(
    vw / 2 - tooltipSize.width / 2,
    VIEWPORT_MARGIN,
    vw - tooltipSize.width - VIEWPORT_MARGIN
  );

  if (dock === "top") {
    return {
      top: VIEWPORT_MARGIN + DOCK_GAP,
      left,
      placement: "dock-top",
    };
  }

  return {
    top: vh - tooltipSize.height - VIEWPORT_MARGIN - DOCK_GAP,
    left,
    placement: "dock-bottom",
  };
}

function positionForPlacement(placement, rect, tooltipSize) {
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

  return { top, left };
}

function getPlacementOrder(preferred) {
  const order = [preferred, "bottom", "top", "right", "left"];
  return [...new Set(order)];
}

function shouldAutoDock(rect) {
  if (!rect) return false;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  return rect.height > vh * 0.32 || rect.width > vw * 0.72;
}

function computeTooltipPosition({ preferredPlacement, rect, tooltipSize, dock }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = vw - tooltipSize.width - VIEWPORT_MARGIN;
  const maxTop = vh - tooltipSize.height - VIEWPORT_MARGIN;

  if (!rect || preferredPlacement === "center") {
    return {
      top: clamp(vh / 2 - tooltipSize.height / 2, VIEWPORT_MARGIN, maxTop),
      left: clamp(vw / 2 - tooltipSize.width / 2, VIEWPORT_MARGIN, maxLeft),
      placement: "center",
      docked: false,
    };
  }

  if (dock === "bottom" || dock === "top") {
    return { ...computeDockedPosition(dock, tooltipSize), docked: true };
  }

  if (shouldAutoDock(rect)) {
    return { ...computeDockedPosition("bottom", tooltipSize), docked: true };
  }

  const targetBox = {
    top: rect.top,
    left: rect.left,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  };

  const placements = getPlacementOrder(preferredPlacement || "bottom");
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const placement of placements) {
    const raw = positionForPlacement(placement, rect, tooltipSize);
    const top = clamp(raw.top, VIEWPORT_MARGIN, maxTop);
    const left = clamp(raw.left, VIEWPORT_MARGIN, maxLeft);
    const box = getTooltipBox(top, left, tooltipSize.width, tooltipSize.height);
    const overlaps = boxesOverlap(box, targetBox, 12);
    const score =
      (overlaps ? 10000 : 0) +
      Math.abs(top - raw.top) +
      Math.abs(left - raw.left) +
      (placement === preferredPlacement ? 0 : 10);

    if (!overlaps && fitsViewport(box, vw, vh)) {
      return { top, left, placement, docked: false };
    }

    if (score < bestScore) {
      bestScore = score;
      best = { top, left, placement, docked: false };
    }
  }

  if (best && bestScore >= 10000) {
    return { ...computeDockedPosition("bottom", tooltipSize), docked: true };
  }

  return (
    best || {
      top: clamp(rect.bottom + TOOLTIP_GAP, VIEWPORT_MARGIN, maxTop),
      left: clamp(rect.left, VIEWPORT_MARGIN, maxLeft),
      placement: "bottom",
      docked: false,
    }
  );
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

  const { theme } = useTheme();
  const { setActiveTab } = useDashboardTab();
  const { clearProject, clearClient, clearLucroFilter } = useDashboardNav();
  const { setSidebarsOpen } = useDashboardLayout();

  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 240 });
  const [interactiveDone, setInteractiveDone] = useState(false);
  const [animDirection, setAnimDirection] = useState(1);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const themeAtStepRef = useRef(null);
  const cardRef = useRef(null);

  const isLast = stepIndex === totalSteps - 1;
  const isFirst = stepIndex === 0;
  const isInteractive = Boolean(step?.interactive);

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
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(HIGHLIGHT_CLASS);
      });
      window.setTimeout(() => setTargetRect(null), 320);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      setTargetRect(null);
      return;
    }

    element.classList.add(HIGHLIGHT_CLASS);

    const scrollBlock = step.prepare?.scrollBlock || "nearest";
    element.scrollIntoView({ block: scrollBlock, inline: "nearest", behavior: "smooth" });

    window.setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      });
    }, 260);
  }, [step]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInteractiveDone(false);
    themeAtStepRef.current = theme;
  }, [stepIndex, step?.id]);

  useEffect(() => {
    if (!isInteractive || interactiveDone) return;
    if (themeAtStepRef.current !== null && theme !== themeAtStepRef.current) {
      setInteractiveDone(true);
    }
  }, [theme, isInteractive, interactiveDone]);

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
    };
  }, [active, loading, step, stepIndex, applyPrepare, measureTarget]);

  useEffect(() => {
    if (!isFirstRender) return;
    const timer = window.setTimeout(() => setIsFirstRender(false), 400);
    return () => window.clearTimeout(timer);
  }, [isFirstRender]);

  useEffect(() => {
    if (!active) {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
        el.classList.remove(HIGHLIGHT_CLASS);
      });
    }
  }, [active]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setTooltipSize((prev) => {
      if (
        Math.abs(rect.width - prev.width) > 2 ||
        Math.abs(rect.height - prev.height) > 2
      ) {
        return { width: rect.width, height: rect.height };
      }
      return prev;
    });
  }, [stepIndex, step?.body, interactiveDone, targetRect]);

  const tooltipPos = useMemo(
    () =>
      computeTooltipPosition({
        preferredPlacement: step?.placement || "bottom",
        rect: targetRect,
        tooltipSize,
        dock: step?.tooltipDock || null,
      }),
    [step?.placement, step?.tooltipDock, targetRect, tooltipSize]
  );

  if (!mounted || !active || loading || !step) {
    return null;
  }

  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const waitingInteraction = isInteractive && !interactiveDone;
  const isDocked = tooltipPos.docked;

  function handlePrimary() {
    if (isLast) {
      complete();
      return;
    }
    setAnimDirection(1);
    goNext();
  }

  function handleBack() {
    setAnimDirection(-1);
    goBack();
  }

  return createPortal(
    <div
      className={`${styles.root} ${isInteractive ? styles.rootInteractive : ""}`}
      role="presentation"
    >
      {!targetRect && step?.target == null && (
        <div className={styles.overlayFull} aria-hidden="true" />
      )}

      {!targetRect && step?.target != null && (
        <div className={`${styles.overlayFull} ${styles.overlayTransition}`} aria-hidden="true" />
      )}

      {targetRect && (
        <div
          className={`${styles.spotlight} ${isInteractive ? styles.spotlightInteractive : ""}`}
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
        ref={cardRef}
        className={`${styles.card} ${tooltipPos.placement === "center" ? styles.cardCenter : ""} ${
          isDocked ? styles.cardDocked : ""
        } ${isFirstRender ? styles.cardEnter : ""}`}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div
          key={step.id}
          className={animDirection >= 0 ? styles.stepContent : styles.stepContentBack}
        >
          <p className={styles.stepLabel}>
            Passo {stepIndex + 1} de {totalSteps}
          </p>
          <h2 id="onboarding-title" className={styles.title}>
            {step.title}
          </h2>
          <p className={styles.body}>{step.body}</p>

          {waitingInteraction && (
            <p className={styles.interactiveHint}>Clique no botão destacado para continuar</p>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.skipBtn} onClick={skip}>
            Pular tour
          </button>
          <div className={styles.actions}>
            {!isFirst && (
              <Button variant="ghost" onClick={handleBack}>
                Voltar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handlePrimary}
              disabled={waitingInteraction}
            >
              {isLast ? "Começar a usar" : waitingInteraction ? "Aguardando clique…" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
