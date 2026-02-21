// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";

// Components
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import NetworkStatus from "./components/NetworkStatus";

// Optional warmup hooks (safe even if they no-op)
import { useGas } from "./hooks/useGas";
import { useTransactions } from "./hooks/useTransactions";

function AppShell({ children }) {
  // This shell is for the wallet app pages (dashboard/send/receive/transactions/settings)
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <NetworkStatus />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  // Warm caches / sessions (no UI impact)
  useGas();
  useTransactions();

  const isHome = location.pathname === "/";

  return (
    <div className={isHome ? "min-h-screen bg-white" : ""}>
      <Routes>
        {/* Marketing Home */}
        <Route path="/" element={<Home />} />

        {/* Wallet App */}
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        <Route
          path="/send"
          element={
            <AppShell>
              <Send />
            </AppShell>
          }
        />
        <Route
          path="/receive"
          element={
            <AppShell>
              <Receive />
            </AppShell>
          }
        />
        <Route
          path="/transactions"
          element={
            <AppShell>
              <Transactions />
            </AppShell>
          }
        />
        <Route
          path="/settings"
          element={
            <AppShell>
              <Settings />
            </AppShell>
          }
        />

        {/* Legacy/removed */}
        <Route path="/kiosk" element={<Navigate to="/" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: "#1E293B", color: "#FFFFFF" },
          }}
        />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
