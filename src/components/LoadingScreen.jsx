import React from "react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-3xl font-bold text-slate-900">SETA</div>
        <div className="mt-2 text-slate-600">Loading…</div>
      </div>
    </div>
  );
}
