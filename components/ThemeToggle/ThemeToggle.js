"use client";

import IconButton from "../IconButton/IconButton";
import { useTheme } from "../ThemeProvider/ThemeProvider";

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.7 3.3L11.6 4.4M4.4 11.6L3.3 12.7M12.7 12.7L11.6 11.6M4.4 4.4L3.3 3.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12.5 9.5C11.2 11.5 8.8 12.5 6.5 11.5C4.2 10.5 3 8 3.5 5.5C6 6 8.5 4.5 9.5 2C11 4 12 6.5 12.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
      onClick={toggleTheme}
      className={className}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
