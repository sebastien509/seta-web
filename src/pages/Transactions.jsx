// src/pages/Transactions.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useWallet, useTransactions } from "../hooks";
import { Button, Card } from "../components";
import { formatAddress, formatCurrency, formatTimeAgo } from "../utils/formatters";

const StatusPill = ({ status }) => {
  const s = (status || "queued").toLowerCase();
  const map = {
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    expired: "bg-amber-100 text-amber-800",
    queued: "bg-slate-100 text-slate-800",
    pending: "bg-slate-100 text-slate-800",
  };
  const cls = map[s] || "bg-slate-100 text-slate-800";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${cls}`}>
      {status || "queued"}
    </span>
  );
};

const Transactions = () => {
  const { pollStatus } = useWallet();
  const { loading, items, refresh, setLocalStatus } = useTransactions();

  const [trackingId, setTrackingId] = useState(null);

  const track = async (transactionId) => {
    setTrackingId(transactionId);
    try {
      const res = await pollStatus(transactionId);
      const st = res?.status || res?.data?.status || "queued";
      setLocalStatus(transactionId, st);
      toast.success(`Updated: ${st}`);
    } catch (e) {
      toast.error(e.message || "Track failed");
    } finally {
      setTrackingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600 mt-2">
            Your recent relayed transfers (EIP-3009 → backend → chain).
          </p>
        </div>
        <Button variant="secondary" onClick={refresh} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-700">
            {loading ? "Loading…" : `${items.length} transaction(s)`}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {items.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-600">
              No transactions yet.
            </div>
          )}

          {items.map((tx) => (
            <div key={tx.transactionId} className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-900">
                  {formatCurrency(tx.amount)} SETA
                </div>
                <StatusPill status={tx.status} />
              </div>

              <div className="text-sm text-slate-600">
                <div>
                  <span className="text-slate-500">To:</span>{" "}
                  <span className="font-mono">{formatAddress(tx.to, 10)}</span>
                </div>
                <div>
                  <span className="text-slate-500">From:</span>{" "}
                  <span className="font-mono">{formatAddress(tx.from, 10)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-2">
                <div className="text-xs text-slate-500">
                  {tx.createdAt ? formatTimeAgo(tx.createdAt) : ""}
                  {" • "}
                  <span className="font-mono">{tx.transactionId}</span>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => track(tx.transactionId)}
                  loading={trackingId === tx.transactionId}
                >
                  Track
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
