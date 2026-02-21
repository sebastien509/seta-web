// src/utils/validators.js

import { ethers } from "ethers";

/**
 * Basic validators used by Send.jsx
 */

export function validateAddress(addr) {
  try {
    return ethers.utils.isAddress(addr);
  } catch {
    return false;
  }
}

export function validateAmount(amount, { maxDecimals = 6 } = {}) {
  if (amount === null || amount === undefined) return false;
  const s = String(amount).trim();
  if (!s) return false;

  // must be a positive number (allow "0.000001")
  const n = Number(s);
  if (!Number.isFinite(n)) return false;
  if (n < 0) return false;

  // prevent scientific notation in UI inputs
  if (/[eE]/.test(s)) return false;

  // decimals constraint
  if (s.includes(".")) {
    const decimals = s.split(".")[1]?.length || 0;
    if (decimals > maxDecimals) return false;
  }

  return true;
}

export function validateMemo(memo, maxLength = 100) {
  if (memo === null || memo === undefined) return true;
  const s = String(memo);
  return s.length <= maxLength;
}
