// src/components/Header.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Button from "./Button";

function titleFromPath(pathname) {
  if (pathname === "/" || pathname === "/home") return "Home";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/send")) return "Send";
  if (pathname.startsWith("/receive")) return "Receive";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/settings")) return "Settings";
  return "SETA Wallet";
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const title = useMemo(() => titleFromPath(location.pathname), [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-300/70">
              Stable rail payments • Gasless UX
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Optional: quick wallet entry */}
          <Button
            variant="secondary"
            onClick={() => navigate("/dashboard")}
            className="hidden sm:inline-flex dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}
