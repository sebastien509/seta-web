// src/components/Button.jsx

import React from "react";

/**
 * Minimal, compile-safe Button component.
 * Props:
 * - variant: "primary" | "secondary" | "ghost"
 * - loading: boolean
 * - disabled: boolean
 * - icon: ReactNode
 * - className: string
 */
export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  loading = false,
  disabled = false,
  icon = null,
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed";

  const styles = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-100",
    ghost:
      "bg-transparent text-slate-900 hover:bg-slate-100 active:bg-transparent",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles[variant] || styles.primary} ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Loading…</span>
        </span>
      ) : (
        <>
          {icon ? <span className="inline-flex">{icon}</span> : null}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
