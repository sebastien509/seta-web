// src/hooks/useTransactions.js
import { useCallback, useEffect, useState } from "react";
import { fetchMyTransactions } from "../services/transactions";

// Expected backend response shape can vary.
// We normalize to: [{ transactionId, from, to, amount, status, createdAt }]
function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list.map((x) => ({
    transactionId: x.transactionId || x.id || x.txId || "",
    from: x.from || "",
    to: x.to || "",
    amount: x.amountHuman || x.amount || x.valueHuman || x.value || "0",
    status: x.status || "queued",
    createdAt: x.createdAt || x.created_at || x.timestamp || null,
  })).filter((x) => x.transactionId);
}

export function useTransactions() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyTransactions({ limit: 50, offset: 0 });
      const data = res?.data || res?.items || res;
      setItems(normalize(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const setLocalStatus = useCallback((transactionId, status) => {
    setItems((prev) =>
      prev.map((t) =>
        t.transactionId === transactionId ? { ...t, status } : t
      )
    );
  }, []);

  return { loading, items, refresh, setLocalStatus };
}
