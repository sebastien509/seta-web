// src/pages/Send.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { useWallet, useGas } from "../hooks";
import { Button, Card } from "../components";
import { formatCurrency, formatAddress } from "../utils/formatters";
import { validateAmount } from "../utils/validators";

const Send = () => {
  const navigate = useNavigate();
  const { isUnlocked, address, signAndRelayEIP3009Transfer, pollStatus } = useWallet();
  const { estimateTotalCost } = useGas();

  const [to, setTo] = useState("");
  const [amountHuman, setAmountHuman] = useState("");
  const [memo, setMemo] = useState("");

  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(null);
  const [status, setStatus] = useState(null);

  const [cost, setCost] = useState(null);

  const canSend = useMemo(() => {
    return (
      isUnlocked &&
      ethers.isAddress(to) &&
      validateAmount(amountHuman) &&
      Number(amountHuman) > 0 &&
      (!address || to.toLowerCase() !== address.toLowerCase())
    );
  }, [isUnlocked, to, amountHuman, address]);

  const computeCost = async (amt) => {
    if (!amt || Number(amt) <= 0) {
      setCost(null);
      return;
    }
    try {
      const c = await estimateTotalCost(amt);
      setCost(c);
    } catch {
      setCost(null);
    }
  };

  const onSubmit = async () => {
    if (!isUnlocked) {
      toast.error("Unlock your wallet first");
      navigate("/");
      return;
    }
    if (!ethers.isAddress(to)) return toast.error("Invalid recipient address");
    if (!validateAmount(amountHuman) || Number(amountHuman) <= 0) return toast.error("Invalid amount");
    if (address && to.toLowerCase() === address.toLowerCase()) return toast.error("You cannot send to yourself");

    setLoading(true);
    setTxId(null);
    setStatus(null);

    try {
      const res = await signAndRelayEIP3009Transfer({
        to,
        amountHuman,
        memo,
      });

      const id = res.transactionId;
      setTxId(id);
      setStatus({ status: res.status || "queued" });

      toast.success("Transfer submitted. Tracking status…");

      // Poll final status
      const finalRes = await pollStatus(id);
      setStatus(finalRes);

      const finalStatus = finalRes?.status || finalRes?.data?.status;
      if (finalStatus === "failed") {
        toast.error("Transaction failed");
      } else if (finalStatus === "confirmed" || finalStatus === "completed") {
        toast.success("Transaction confirmed");
      } else {
        toast.success(`Status: ${finalStatus}`);
      }
    } catch (e) {
      toast.error(e.message || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <div className="text-2xl font-bold text-slate-900">Wallet locked</div>
          <div className="text-slate-600 mt-2">
            Unlock your embedded wallet to send SETA.
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-900"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Send SETA</h1>
        <div className="text-slate-600 mt-1">
          From: {formatAddress(address || "", 10)}
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <label className="block">
          <div className="text-sm font-medium text-slate-700">Recipient</div>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
            placeholder="0x..."
            className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
          {to && !ethers.isAddress(to) && (
            <div className="text-sm text-red-600 mt-2">Invalid address</div>
          )}
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">Amount</div>
          <input
            value={amountHuman}
            onChange={(e) => {
              setAmountHuman(e.target.value);
              computeCost(e.target.value);
            }}
            type="number"
            step="0.000001"
            min="0"
            placeholder="0.00"
            className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-slate-700">
            Memo <span className="text-slate-500 font-normal">(optional)</span>
          </div>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="What is this for?"
            maxLength={120}
            className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
          <div className="text-right text-xs text-slate-500 mt-1">
            {memo.length}/120
          </div>
        </label>

        {cost && (
          <div className="rounded-lg bg-slate-900 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Estimated Total</div>
              <div className="text-slate-300 text-sm">1–2 minutes</div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-200">
              <div className="flex justify-between">
                <span>Amount</span>
                <span>{formatCurrency(cost.amount)} SETA</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee</span>
                <span>{formatCurrency(cost.fee)} SETA</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 text-white font-semibold">
                <span>Total</span>
                <span>{formatCurrency(cost.total)} SETA</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            loading={loading}
            disabled={!canSend || loading}
            className="flex-1"
          >
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </Card>

      {(txId || status) && (
        <Card className="p-6">
          <div className="font-semibold text-slate-900">Status</div>
          {txId && (
            <div className="text-slate-600 text-sm mt-1 break-all">
              Transaction ID: <span className="font-mono">{txId}</span>
            </div>
          )}
          <div className="mt-3">
            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-800">
              <span className="text-sm font-medium">
                {status?.status || status?.data?.status || "queued"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate("/transactions")}>
              View Transactions
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Send;
