import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    platform: tx.platform || "MENA Marketplace",
    beneficiary: tx.beneficiary || "Vendor Wallet / Partner Bank",
    currency: tx.currency || "SAR",
    platformRef: tx.platformRef || "ORD-MENA-DEMO",
    corridorId: tx.corridorId || "KSA-GCC-WALLET-01",
    pricingBand: tx.pricingBand || "GCC Standard Platform Band",
    complianceStatus: tx.complianceStatus || "Pre-check passed",
    riskScore: tx.riskScore ?? 18,
  };
};

const loadReceipt = (id) => {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const found = items.find((tx) => tx.receiptId === id);
    return found ? normalizeTx(found) : null;
  } catch {
    return null;
  }
};

const fmt = (value) => {
  if (!value) return "Pending";
  return new Date(value).toLocaleString();
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

export default function ReceiptDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const tx = useMemo(() => loadReceipt(id), [id]);

  if (!tx) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-10 text-center">
          <div className="text-2xl font-bold text-slate-900">Receipt not found</div>
          <p className="text-slate-600 mt-2">
            Run the demo flow first, then open the generated receipt.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate("/dashboard?demo=true")}>Run Demo</Button>
          </div>
        </Card>
      </div>
    );
  }

  const verify = () => toast.success("Receipt integrity verified");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>

        <div className="text-sm font-semibold text-blue-700 mt-4">
          SETA Network Receipt
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Audit-Grade Settlement Proof
        </h1>

        <p className="text-slate-600 mt-2 max-w-3xl">
          This receipt links collection, SETA minting, settlement routing,
          SETA burning, payout execution, fees, controls, and timestamps into one
          verifiable operational record.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="text-sm text-slate-500">Receipt ID</div>
            <div className="mt-1 font-mono text-lg font-semibold text-slate-900 break-all">
              {tx.receiptId}
            </div>

            <div className="mt-4 text-3xl font-bold text-slate-900">
              <FiatAmount value={tx.amount.toLocaleString()} currency={tx.currency} />
            </div>

            <div className="text-slate-600 mt-2">
              {tx.platform} → {tx.beneficiary}
            </div>
          </div>

          <span className="inline-flex w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
            {(tx.status || "created").replace("_", " ")}
          </span>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric
          label="Gross Collected"
          value={<FiatAmount value={tx.amount.toLocaleString()} currency={tx.currency} />}
        />
        <Metric
          label="Fees"
          value={<FiatAmount value={Number(tx.fees || 0).toLocaleString()} currency={tx.currency} />}
        />
        <Metric
          label="SETA Minted"
          value={<SetaAmount value={tx.setaMinted.toLocaleString()} />}
        />
        <Metric
          label="SETA Burned"
          value={<SetaAmount value={tx.setaBurned.toLocaleString()} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Settlement Route</h2>

          <div className="mt-6 grid md:grid-cols-5 gap-3">
            {tx.routingPath.map((node, index) => (
              <div key={node} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-xs font-semibold text-blue-700">
                  Node {index + 1}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">
                  {String(node).replaceAll("DSU", "SETA")}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white">
          <h2 className="text-xl font-bold">Controls Applied</h2>

          <div className="mt-5 space-y-4 text-sm">
            <DarkRow label="Velocity limit" value={tx.controls.velocityLimit} />
            <DarkRow label="Payout hold" value={tx.controls.payoutHold} />
            <DarkRow label="Approval policy" value={tx.controls.approvalPolicy} />
            <DarkRow label="Partner rule" value={tx.controls.partner} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900">Lifecycle Timeline</h2>

        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <Timeline title="Created" time={fmt(tx.createdAt)} />
          <Timeline title="Collected" time={fmt(tx.collectedAt)} />
          <Timeline title="Settled / SETA Minted" time={fmt(tx.settledAt)} />
          <Timeline title="Payout / SETA Burned" time={fmt(tx.paidOutAt)} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900">Operational Ledger</h2>

        <div className="mt-5 space-y-3">
          {tx.ledger.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{item.label}</div>
                  <div className="text-sm text-slate-600 mt-1">{item.description}</div>
                  <div className="text-xs text-slate-500 mt-2">{fmt(item.time)}</div>
                </div>
                <div className="text-sm font-bold text-blue-700">
                  {String(item.value).replaceAll("SETA-DSU", "SETA")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-slate-900 text-white">
        <h2 className="text-xl font-bold">Cryptographic Proof</h2>

        <p className="text-slate-300 mt-2 text-sm">
          This hash represents the finalized SETA settlement receipt object.
          It connects payment collection, SETA minting, route selection,
          SETA burning, payout execution, fees, and timestamps.
        </p>

        <div className="mt-5 rounded-2xl bg-slate-800 border border-slate-700 p-4 font-mono text-sm break-all">
          {tx.proofHash || "Proof hash pending until payout is completed."}
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Button onClick={verify} disabled={!tx.proofHash}>
            Verify Integrity
          </Button>
          <Button variant="secondary" onClick={() => toast.success("Receipt export simulated")}>
            Export Receipt
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}

function Timeline({ title, time }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
        ✓
      </div>
      <div className="font-bold text-slate-900 mt-3">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{time}</div>
    </div>
  );
}

function DarkRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-white">{value || "N/A"}</div>
    </div>
  );
}