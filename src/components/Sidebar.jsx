import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg ${
      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col bg-white border-r border-slate-200">
      <div className="p-6">
        <div className="text-2xl font-black text-slate-900">SETA</div>
        <div className="text-sm text-slate-600 mt-1">Wallet • Payments</div>
      </div>

      <nav className="px-4 space-y-1">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/send" className={linkClass}>Send</NavLink>
        <NavLink to="/receive" className={linkClass}>Receive</NavLink>
        <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
        <NavLink to="/settings" className={linkClass}>Settings</NavLink>
      </nav>
    </aside>
  );
}
