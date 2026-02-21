// src/pages/Receive.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useWallet } from "../hooks";
import { Button, Card } from "../components";

const Receive = () => {
  const navigate = useNavigate();
  const { isUnlocked, address } = useWallet();

  const receiveLink = useMemo(() => {
    if (!address) return "";
    // simple URI format (you can extend with ?amount= & memo= later)
    return `seta:${address}`;
  }, [address]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  if (!isUnlocked || !address) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <div className="text-2xl font-bold text-slate-900">Wallet locked</div>
          <div className="text-slate-600 mt-2">
            Unlock your wallet to show your receive address.
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
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Receive SETA</h1>
        <p className="text-slate-600 mt-2">
          Share your SETA address or receive link.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-700">Your Address</div>
          <div className="mt-2 font-mono text-slate-900 break-all">{address}</div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => copy(address)}>Copy Address</Button>
          <Button variant="secondary" onClick={() => copy(receiveLink)}>
            Copy Receive Link
          </Button>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900 mb-1">Tip</div>
          <div>
            You can later display this as a QR code. For now, copying the address is enough.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Receive;
