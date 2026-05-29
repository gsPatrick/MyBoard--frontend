"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { me, updateOnboarding } from "@/api/auth";
import { getStoredUser } from "@/api/client";
import {
  isOnboardingActive,
  isOnboardingFinished,
  ONBOARDING_STEPS,
} from "@/lib/onboardingSteps";

const OnboardingContext = createContext(null);

function readOnboardingFromUser(user) {
  return user?.onboarding || {
    status: "pending",
    step: 0,
    version: 1,
    completed_at: null,
  };
}

export function OnboardingProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [onboarding, setOnboarding] = useState(null);

  const syncFromUser = useCallback((user) => {
    const state = readOnboardingFromUser(user);
    setOnboarding(state);

    if (isOnboardingActive(state.status)) {
      const savedStep = Math.min(
        Math.max(0, state.step || 0),
        ONBOARDING_STEPS.length - 1
      );
      setStepIndex(savedStep);
      setActive(true);
    } else {
      setActive(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await me();
      syncFromUser(data.user);
    } catch {
      const stored = getStoredUser();
      if (stored) syncFromUser(stored);
      else setActive(false);
    } finally {
      setLoading(false);
    }
  }, [syncFromUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleUpdated() {
      const stored = getStoredUser();
      if (stored) syncFromUser(stored);
    }

    window.addEventListener("myboard:onboarding-updated", handleUpdated);
    return () => window.removeEventListener("myboard:onboarding-updated", handleUpdated);
  }, [syncFromUser]);

  const persistStep = useCallback(async (nextStep) => {
    try {
      const data = await updateOnboarding({ step: nextStep });
      setOnboarding(data.user?.onboarding || null);
    } catch {
      /* mantém tour local */
    }
  }, []);

  const finish = useCallback(async (status) => {
    try {
      const data = await updateOnboarding({
        status,
        step: stepIndex,
      });
      setOnboarding(data.user?.onboarding || null);
    } catch {
      setOnboarding((prev) => ({
        ...(prev || {}),
        status,
        completed_at: new Date().toISOString(),
      }));
    } finally {
      setActive(false);
      window.dispatchEvent(new CustomEvent("myboard:onboarding-finished"));
    }
  }, [stepIndex]);

  const goNext = useCallback(async () => {
    const next = Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1);
    setStepIndex(next);
    await persistStep(next);

    if (next === ONBOARDING_STEPS.length - 1) {
      /* último passo ainda exige confirmação */
    }
  }, [persistStep, stepIndex]);

  const goBack = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const skip = useCallback(() => finish("skipped"), [finish]);
  const complete = useCallback(() => finish("completed"), [finish]);

  const restart = useCallback(async () => {
    try {
      const data = await updateOnboarding({ status: "in_progress", step: 0 });
      setOnboarding(data.user?.onboarding || null);
    } catch {
      setOnboarding({ status: "in_progress", step: 0, version: 1, completed_at: null });
    }
    setStepIndex(0);
    setActive(true);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      active,
      stepIndex,
      step: ONBOARDING_STEPS[stepIndex],
      totalSteps: ONBOARDING_STEPS.length,
      onboarding,
      isFinished: onboarding ? isOnboardingFinished(onboarding.status) : false,
      goNext,
      goBack,
      skip,
      complete,
      restart,
      setStepIndex,
    }),
    [
      loading,
      active,
      stepIndex,
      onboarding,
      goNext,
      goBack,
      skip,
      complete,
      restart,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
