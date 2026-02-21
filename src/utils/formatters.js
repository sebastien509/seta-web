// src/utils/formatters.js

export function formatCurrency(value, decimals = 6) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
  
  export function formatAddress(address, chars = 10) {
    if (!address || typeof address !== "string") return "";
    if (address.length <= chars) return address;
    const left = Math.max(4, Math.floor(chars / 2));
    const right = Math.max(4, chars - left);
    return `${address.slice(0, left)}…${address.slice(-right)}`;
  }
  
  /**
   * Accepts:
   * - ISO string (recommended)
   * - unix seconds (number)
   * - unix ms (number)
   * - Date object
   */
  export function formatTimeAgo(input) {
    if (!input) return "";
  
    let date;
  
    if (input instanceof Date) {
      date = input;
    } else if (typeof input === "number") {
      // Heuristic: seconds vs ms
      date = new Date(input < 1e12 ? input * 1000 : input);
    } else if (typeof input === "string") {
      const d = new Date(input);
      if (Number.isNaN(d.getTime())) return "";
      date = d;
    } else {
      return "";
    }
  
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
  
    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
  
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
  
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
  
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
  
    // Fallback to a readable date
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  