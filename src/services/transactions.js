import { apiFetch } from "./api";

export async function fetchFee() {
  return apiFetch("/gas/fee", { method: "GET" });
}

export async function authorizeTransfer(payload) {
  return apiFetch("/transactions/authorize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTxStatus(transactionId) {
  return apiFetch(`/gas/status/${transactionId}`, { method: "GET" });
}

export async function fetchMyTransactions({ limit = 50, offset = 0 } = {}) {
  return apiFetch(`/transactions?limit=${limit}&offset=${offset}`, { method: "GET" });
}
