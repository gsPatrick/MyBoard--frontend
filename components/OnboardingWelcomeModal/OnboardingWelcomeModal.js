"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button/Button";
import { getStoredUser } from "@/services/client";
import {
  markOnboardingWelcomeShown,
  shouldShowOnboardingWelcome,
} from "@/lib/onboardingWelcome";
import styles from "./OnboardingWelcomeModal.module.css";

function getGreeting(name) {
  const trimmed = (name || "").trim().split(" ")[0];
  if (!trimmed) return "Bem-vindo ao MyBoard";
  return `Bem-vindo, ${trimmed}`;
}

export default function OnboardingWelcomeModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleTourFinished(event) {
      if (event.detail?.status !== "completed") return;
      if (!shouldShowOnboardingWelcome()) return;
      setOpen(true);
    }

    window.addEventListener("myboard:onboarding-finished", handleTourFinished);
    return () =>
      window.removeEventListener("myboard:onboarding-finished", handleTourFinished);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    function handleKey(event) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function dismiss() {
    markOnboardingWelcomeShown();
    setOpen(false);
    window.dispatchEvent(new CustomEvent("myboard:onboarding-welcome-closed"));
  }

  if (!mounted || !open) return null;

  const user = getStoredUser();

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={dismiss}>
      <div
        className={styles.modal}
        data-theme="light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.glow} aria-hidden="true" />
        <img
          src="/myboardlogo.png"
          alt="MyBoard"
          className={styles.logo}
          width={200}
          height={72}
        />
        <p className={styles.eyebrow}>Tour concluído</p>
        <h2 id="welcome-title" className={styles.title}>
          {getGreeting(user?.name)}
        </h2>
        <p className={styles.body}>
          Seu workspace está pronto. Organize clientes, projetos, agenda e financeiro em um só
          lugar.
        </p>
        <ul className={styles.list}>
          <li>Use a Central para ver o dia de forma rápida.</li>
          <li>Cadastre clientes e projetos pela barra superior.</li>
          <li>Acompanhe recebimentos na aba Lucro.</li>
        </ul>
        <div className={styles.actions}>
          <Button variant="primary" size="md" onClick={dismiss}>
            Começar a usar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
