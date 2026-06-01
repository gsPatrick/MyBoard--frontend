"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  THEME_PREFERENCE,
  normalizeThemePreference,
  resolveThemePreference,
} from "@/lib/interfacePreferences";

const STORAGE_KEY = "snowui-theme";

const ThemeContext = createContext({
  theme: "light",
  themePreference: THEME_PREFERENCE.LIGHT,
  toggleTheme: () => {},
  setTheme: () => {},
  setThemePreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(THEME_PREFERENCE.LIGHT);
  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  const applyResolvedTheme = useCallback((preference) => {
    const resolved = resolveThemePreference(preference);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const preference = stored
      ? normalizeThemePreference(stored)
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEME_PREFERENCE.DARK
        : THEME_PREFERENCE.LIGHT;

    setThemePreferenceState(preference);
    applyResolvedTheme(preference);
    setMounted(true);
  }, [applyResolvedTheme]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, themePreference);
    applyResolvedTheme(themePreference);
  }, [themePreference, mounted, applyResolvedTheme]);

  useEffect(() => {
    if (!mounted || themePreference !== THEME_PREFERENCE.SYSTEM) return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      applyResolvedTheme(THEME_PREFERENCE.SYSTEM);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themePreference, mounted, applyResolvedTheme]);

  const setThemePreference = useCallback((next) => {
    setThemePreferenceState(normalizeThemePreference(next));
  }, []);

  const setTheme = setThemePreference;

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((current) => {
      const resolved = resolveThemePreference(current);
      return resolved === "light" ? THEME_PREFERENCE.DARK : THEME_PREFERENCE.LIGHT;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      themePreference,
      toggleTheme,
      setTheme,
      setThemePreference,
    }),
    [resolvedTheme, themePreference, toggleTheme, setTheme, setThemePreference]
  );

  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
