// src/components/ThemeToggle.jsx
import React from "react";
import { useTheme } from "../hooks";
import Button from "./Button";

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props}>
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.6 3.6M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props}>
      <path
        d="M21 13.2A7.5 7.5 0 0 1 10.8 3a8.5 8.5 0 1 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      className={`px-3 py-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 ${className}`}
      icon={theme === "dark" ? <SunIcon /> : <MoonIcon />}
    >
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}
