"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BORDIE_DISPLAY,
  readBordiePrefs,
  writeBordiePrefs,
} from "@/lib/bordieLayout";

const BordieChatContext = createContext(null);

export function BordieChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayModeState] = useState(BORDIE_DISPLAY.FLOATING);
  const [hydrated, setHydrated] = useState(false);
  const [boardContext, setBoardContextState] = useState(null);

  useEffect(() => {
    const prefs = readBordiePrefs();
    setDisplayModeState(prefs.displayMode);
    setHydrated(true);
  }, []);

  const setBoardContext = useCallback((next) => {
    setBoardContextState(next);
  }, []);

  const persistDisplayMode = useCallback((mode) => {
    const prefs = readBordiePrefs();
    writeBordiePrefs({ ...prefs, displayMode: mode });
  }, []);

  const openBordie = useCallback(() => setIsOpen(true), []);
  const closeBordie = useCallback(() => setIsOpen(false), []);
  const toggleBordie = useCallback(() => setIsOpen((open) => !open), []);

  const setDisplayMode = useCallback(
    (mode) => {
      const normalized =
        mode === BORDIE_DISPLAY.DOCKED ? BORDIE_DISPLAY.DOCKED : BORDIE_DISPLAY.FLOATING;
      setDisplayModeState(normalized);
      if (hydrated) persistDisplayMode(normalized);
    },
    [hydrated, persistDisplayMode]
  );

  const dockBordie = useCallback(() => {
    setDisplayMode(BORDIE_DISPLAY.DOCKED);
    setIsOpen(true);
  }, [setDisplayMode]);

  const floatBordie = useCallback(() => {
    setDisplayMode(BORDIE_DISPLAY.FLOATING);
    setIsOpen(true);
  }, [setDisplayMode]);

  const toggleDock = useCallback(() => {
    setDisplayModeState((current) => {
      const next =
        current === BORDIE_DISPLAY.DOCKED ? BORDIE_DISPLAY.FLOATING : BORDIE_DISPLAY.DOCKED;
      if (hydrated) persistDisplayMode(next);
      return next;
    });
    setIsOpen(true);
  }, [hydrated, persistDisplayMode]);

  const bordieDocked = isOpen && displayMode === BORDIE_DISPLAY.DOCKED;

  const value = useMemo(
    () => ({
      bordieOpen: isOpen,
      bordieDocked,
      displayMode,
      boardContext,
      setBoardContext,
      openBordie,
      closeBordie,
      toggleBordie,
      setDisplayMode,
      dockBordie,
      floatBordie,
      toggleDock,
    }),
    [
      isOpen,
      bordieDocked,
      displayMode,
      boardContext,
      setBoardContext,
      openBordie,
      closeBordie,
      toggleBordie,
      setDisplayMode,
      dockBordie,
      floatBordie,
      toggleDock,
    ]
  );

  return <BordieChatContext.Provider value={value}>{children}</BordieChatContext.Provider>;
}

export function useBordieChat() {
  const ctx = useContext(BordieChatContext);
  if (!ctx) {
    throw new Error("useBordieChat must be used within BordieChatProvider");
  }
  return ctx;
}
