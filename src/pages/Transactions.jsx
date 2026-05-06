import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Card } from "../components";

const STORAGE_KEY = "seta_demo_transactions";

const LOGO_ICON =
  "https://res.cloudinary.com/dvcmopd4q/image/upload/v1771644531/Logo_SETA_Var_1_hle4ln.png";

const DEFAULT_CONTROLS = {
  velocityLimit: "250,000 SAR / day",
  payoutHold: "Disabled",
  approvalPolicy: "Auto-approve under 50,000 SAR",
  partner: "Regulated partner required before payout",
};

const DEFAULT_ROUTE = [
  "Customer Wallet",
  "SETA Collection Account",
  "SETA Settlement Vault",
  "Partner Bank",
  "Beneficiary Account",
];

const normalizeTx = (tx) => {
  const amount = Number(tx.amount || 0);
  const fees = Number(tx.fees || 0);
  const netSettlement = Number(tx.netSettlement || amount - fees);

  return {
    ...tx,
    settlementAsset: "SETA",
    setaMinted: Number(tx.setaMinted ?? tx.dsuMinted ?? 0),
    setaBurned: Number(tx.setaBurned ?? tx.dsuBurned ?? 0),
    dsuMinted: Number(tx.setaMinted ?? tx.dsuMinted ?? 0),
    dsuBurned: Number(tx.setaBurned ?? tx.dsuBurned ?? 0),
    netSettlement,
    payoutAmount: Number(tx.payoutAmount || 0),
    controls: { ...DEFAULT_CONTROLS, ...(tx.controls || {}) },
    routingPath: tx.routingPath || DEFAULT_ROUTE,
    ledger: tx.ledger || [],
    corridorId: tx.corridorId || "KSA-GCC-WALLET-01",
    platformRef: tx.platformRef || "ORD-MENA-DEMO",
    pricingBand: tx.pricingBand || "GCC Standard Platform Band",
    riskScore: tx.riskScore ?? 18,
    complianceStatus: tx.complianceStatus || "Pre-check passed",
    platform: tx.platform || "MENA Marketplace",
    beneficiary: tx.beneficiary || "Vendor Wallet / Partner Bank",
    currency: tx.currency || "SAR",
  };
};

const loadTransactions = () => {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizeTx);
  } catch {
    return [];
  }
};

const saveTransactions = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeTx)));
};

const createProofHash = (payload) => {
  const raw = JSON.stringify(payload);
  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16)}${Date.now().toString(16)}`;
};

function SetaAmount({ value, suffix = "SETA", dark = false }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{value}</span>
      <img
        src={LOGO_ICON}
        alt="SETA"
        className={`h-4 w-4 rounded-full object-contain ${
          dark ? "ring-1 ring-white/20" : "ring-1 ring-blue-100"
        }`}
      />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}

function FiatAmount({ value, currency = "SAR", dark = false }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{value}</span>
      {/* <img
        src={LOGO_ICON}
        alt="SETA"
        className={`h-4 w-4 rounded-full object-contain ${
          dark ? "ring-1 ring-white/20" : "ring-1 ring-blue-100"
        }`}
      /> */}
      <span>{currency}</span>
    </span>
  );
}

const StatusPill = ({ status }) => {
  const map = {
    created: "bg-slate-100 text-slate-700",
    collected: "bg-blue-100 text-blue-700",
    settled: "bg-amber-100 text-amber-700",
    paid_out: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        map[status] || map.created
      }`}
    >
      {(status || "created").replace("_", " ")}
    </span>
  );
};

export default function Transactions() {
  const navigate = useNavigate();
  const [items, setItems] = useState(loadTransactions());

  const stats = useMemo(() => {
    const normalized = items.map(normalizeTx);

    return {
      total: normalized.length,
      volume: normalized.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      setaMinted: normalized.reduce((sum, tx) => sum + Number(tx.setaMinted || 0), 0),
      setaBurned: normalized.reduce((sum, tx) => sum + Number(tx.setaBurned || 0), 0),
      completed: normalized.filter((tx) => tx.status === "paid_out").length,
    };
  }, [items]);

  const updateTx = (nextTx) => {
    const normalizedTx = normalizeTx(nextTx);

    const next = items.map((tx) =>
      tx.transactionId === normalizedTx.transactionId ? normalizedTx : normalizeTx(tx)
    );

    setItems(next);
    saveTransactions(next);
  };

  const refresh = () => {
    setItems(loadTransactions());
    toast.success("Transactions refreshed");
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
    toast.success("Demo transactions cleared");
  };

  const advanceTransaction = (rawTx) => {
    const tx = normalizeTx(rawTx);
    const now = new Date().toISOString();

    if (tx.status === "created") {
      updateTx({
        ...tx,
        status: "collected",
        stage: "settle",
        collectedAt: now,
        ledger: [
          ...tx.ledger,
          {
            label: "Payment collected",
            type: "collect",
            value: `${tx.amount.toLocaleString()} ${tx.currency}`,
            description:
              "Customer payment confirmed and settlement value is ready for SETA minting.",
            time: now,
          },
        ],
      });

      toast.success("Payment collected");
      return;
    }

    if (tx.status === "collected") {
      updateTx({
        ...tx,
        status: "settled",
        stage: "payout",
        settledAt: now,
        setaMinted: tx.netSettlement,
        dsuMinted: tx.netSettlement,
        ledger: [
          ...tx.ledger,
          {
            label: "SETA minted",
            type: "mint",
            value: `${tx.netSettlement.toLocaleString()} SETA`,
            description:
              "Net collected value represented as SETA inside the settlement vault.",
            time: now,
          },
          {
            label: "Settlement routed",
            type: "settle",
            value: tx.corridorId,
            description:
              "Route selected using corridor policy, partner availability, limits, and compliance controls.",
            time: now,
          },
        ],
      });

      toast.success("SETA minted and settlement routed");
      return;
    }

    if (tx.status === "settled") {
      const receiptPayload = {
        receiptId: tx.receiptId,
        transactionId: tx.transactionId,
        amount: tx.amount,
        currency: tx.currency,
        fees: tx.fees,
        setaMinted: tx.setaMinted,
        setaBurned: tx.netSettlement,
        route: tx.routingPath,
        status: "paid_out",
        timestamp: now,
      };

      updateTx({
        ...tx,
        status: "paid_out",
        stage: "proof",
        paidOutAt: now,
        setaBurned: tx.netSettlement,
        dsuBurned: tx.netSettlement,
        payoutAmount: tx.netSettlement,
        proofHash: createProofHash(receiptPayload),
        ledger: [
          ...tx.ledger,
          {
            label: "SETA burned",
            type: "burn",
            value: `${tx.netSettlement.toLocaleString()} SETA`,
            description:
              "SETA settlement claim closed before external payout execution.",
            time: now,
          },
          {
            label: "Payout executed",
            type: "payout",
            value: `${tx.netSettlement.toLocaleString()} ${tx.currency}`,
            description: "Beneficiary payout submitted through approved partner rail.",
            time: now,
          },
          {
            label: "Receipt proof generated",
            type: "proof",
            value: "Proof hash created",
            description:
              "Final receipt links collection, SETA minting, settlement route, SETA burning, payout, and fees.",
            time: now,
          },
        ],
      });

      toast.success("SETA burned and payout executed");
      return;
    }

    toast.success("Transaction already completed");
  };

  const getActionLabel = (tx) => {
    if (tx.status === "created") return "Collect";
    if (tx.status === "collected") return "Mint SETA + Settle";
    if (tx.status === "settled") return "Burn SETA + Payout";
    return "Completed";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-blue-700">SETA Network</div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Settlement Transactions
          </h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            View enterprise settlement flows across collection, SETA minting,
            partner routing, SETA burning, payout execution, and receipt proof.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button variant="secondary" onClick={refresh}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Stat label="Transactions" value={stats.total} />
        <Stat
          label="Volume"
          value={<FiatAmount value={stats.volume.toLocaleString()} currency="SAR" />}
        />
        <Stat
          label="SETA Minted"
          value={<SetaAmount value={stats.setaMinted.toLocaleString()} />}
        />
        <Stat
          label="SETA Burned"
          value={<SetaAmount value={stats.setaBurned.toLocaleString()} />}
        />
        <Stat label="Completed" value={stats.completed} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="font-semibold text-slate-900">Settlement Operations</div>
          <div className="text-sm text-slate-600 mt-1">
            Advance each transaction manually to demonstrate SETA settlement behavior.
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {items.length === 0 && (
            <div className="p-10 text-center">
              <div className="text-xl font-bold text-slate-900">
                No transactions yet
              </div>
              <p className="text-slate-600 mt-2">
                Start a demo transfer from the dashboard.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate("/dashboard?demo=true")}>
                  Start Demo
                </Button>
              </div>
            </div>
          )}

          {items.map((rawTx) => {
            const tx = normalizeTx(rawTx);

            return (
              <div key={tx.transactionId} className="p-5 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-xl font-bold text-slate-900">
                        <FiatAmount
                          value={Number(tx.amount).toLocaleString()}
                          currency={tx.currency}
                        />
                      </div>
                      <StatusPill status={tx.status} />
                    </div>

                    <div className="text-sm text-slate-600 mt-2">
                      {tx.platform} → {tx.beneficiary}
                    </div>

                    <div className="font-mono text-xs text-slate-500 mt-2 break-all">
                      {tx.transactionId}
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="secondary"
                      onClick={() => advanceTransaction(tx)}
                      disabled={tx.status === "paid_out"}
                    >
                      {getActionLabel(tx)}
                    </Button>

                    <Button
                      variant="ghost"
                      disabled={!tx.proofHash}
                      onClick={() => navigate(`/receipts/${tx.receiptId}`)}
                    >
                      View Receipt
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                  <Info label="Platform Ref" value={tx.platformRef} />
                  <Info label="Corridor" value={tx.corridorId} />
                  <Info label="Pricing Band" value={tx.pricingBand} />
                  <Info label="Risk Score" value={`${tx.riskScore}/100`} />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <Info
                    label="SETA Minted"
                    value={<SetaAmount value={tx.setaMinted.toLocaleString()} />}
                  />
                  <Info
                    label="SETA Burned"
                    value={<SetaAmount value={tx.setaBurned.toLocaleString()} />}
                  />
                  <Info
                    label="Net Payout"
                    value={
                      <FiatAmount
                        value={tx.netSettlement.toLocaleString()}
                        currency={tx.currency}
                      />
                    }
                  />
                </div>

                <div className="grid md:grid-cols-5 gap-3">
                  {tx.routingPath.map((node, index) => (
                    <div
                      key={`${tx.transactionId}-${node}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-xs text-slate-500">
                        Route Node {index + 1}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {String(node).replaceAll("DSU", "SETA")}
                      </div>
                    </div>
                  ))}
                </div>

                {tx.proofHash && (
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                    <div className="text-xs text-slate-400">Proof Hash</div>
                    <div className="mt-2 font-mono text-sm text-white break-all">
                      {tx.proofHash}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value || "N/A"}</div>
    </div>
  );
}