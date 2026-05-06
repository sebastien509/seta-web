import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "../components";

import {
  BanknotesIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  DocumentTextIcon,
  EyeIcon,
  FireIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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

const nowIso = () => new Date().toISOString();

const fmtDate = (value) => {
  if (!value) return "Pending";
  return new Date(value).toLocaleString();
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
    controls: {
      ...DEFAULT_CONTROLS,
      ...(tx.controls || {}),
    },
    routingPath: tx.routingPath || DEFAULT_ROUTE,
    ledger: tx.ledger || [],
    corridor:
      tx.corridor ||
      "Customer Wallet → SETA Settlement Vault → Partner Bank → Beneficiary",
    pricingBand: tx.pricingBand || "GCC Standard Platform Band",
    fxPolicy: tx.fxPolicy || "No FX required — SAR corridor",
    complianceStatus: tx.complianceStatus || "Pre-check passed",
    riskScore: tx.riskScore ?? 18,
    merchant: tx.merchant || "Riyadh Vendor Group",
    payoutRail: tx.payoutRail || "Partner Bank API",
    corridorId: tx.corridorId || "KSA-GCC-WALLET-01",
    platformRef: tx.platformRef || "ORD-MENA-DEMO",
  };
};

const loadTransactions = () => {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return items.map(normalizeTx);
  } catch {
    return [];
  }
};

const saveTransactions = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeTx)));
};

const seedTransaction = () => {
  const id = Date.now();
  const amount = 12500;
  const fee = 42.5;
  const netSettlement = amount - fee;

  return normalizeTx({
    transactionId: `txn_seta_${id}`,
    receiptId: `rcpt_seta_${id}`,
    platformRef: `ORD-MENA-${String(id).slice(-6)}`,
    corridorId: "KSA-GCC-WALLET-01",
    amount,
    currency: "SAR",
    settlementAsset: "SETA",
    setaMinted: 0,
    setaBurned: 0,
    payoutAmount: 0,
    fees: fee,
    netSettlement,
    platform: "MENA Marketplace",
    merchant: "Riyadh Vendor Group",
    beneficiary: "Vendor Wallet / Partner Bank",
    payoutRail: "Partner Bank API",
    corridor: "Customer Wallet → SETA Settlement Vault → Partner Bank → Beneficiary",
    status: "created",
    stage: "collect",
    riskScore: 18,
    complianceStatus: "Pre-check passed",
    pricingBand: "GCC Standard Platform Band",
    fxPolicy: "No FX required — SAR corridor",
    controls: DEFAULT_CONTROLS,
    createdAt: nowIso(),
    collectedAt: null,
    settledAt: null,
    paidOutAt: null,
    proofHash: null,
    routingPath: DEFAULT_ROUTE,
    ledger: [
      {
        label: "Payment request created",
        type: "request",
        value: `${amount.toLocaleString()} SAR`,
        description: "Invoice/payment intent created for platform order.",
        time: nowIso(),
      },
    ],
  });
};

const stepMeta = {
  collect: {
    title: "Collect",
    icon: BanknotesIcon,
    purpose:
      "Capture incoming payment and lock a reliable settlement value before payout operations begin.",
    why:
      "Platforms need certainty that money was received before seller, vendor, or partner obligations are triggered.",
    seta:
      "At collect stage, SETA is not minted yet. The system prepares the mint event once payment collection is confirmed.",
    checks: [
      "Payment intent created",
      "Platform reference attached",
      "Risk score generated",
      "Fee band selected",
      "Receipt shell initialized",
    ],
    value:
      "Reduces failed payout risk and gives finance teams a clear collection object before settlement begins.",
  },
  settle: {
    title: "Settle",
    icon: ArrowsRightLeftIcon,
    purpose:
      "Convert collected value into SETA settlement value and route it through policy-controlled rails.",
    why:
      "Settlement is where platforms need predictability, controls, and reconciliation-ready routing.",
    seta:
      "SETA is minted equal to the net settlement value. SETA represents claimable settlement value inside the controlled rail.",
    checks: [
      "SETA minted",
      "Partner route selected",
      "Velocity and hold rules checked",
      "Fees locked",
      "Settlement timestamp recorded",
    ],
    value:
      "Creates a standardized settlement object across wallets, partners, and payout corridors.",
  },
  payout: {
    title: "Payout",
    icon: ShieldCheckIcon,
    purpose:
      "Release funds to the beneficiary through an approved payout partner while closing the SETA settlement position.",
    why:
      "The platform needs proof that the payout happened, through which partner, under which limits, and at what cost.",
    seta:
      "SETA is burned once payout execution is approved. Burn confirms the SETA settlement claim has been converted into external payout value.",
    checks: [
      "SETA burned",
      "Partner payout triggered",
      "Beneficiary reference attached",
      "Payout amount reconciled",
      "Operational receipt updated",
    ],
    value:
      "Connects on-chain proof to real-world payout operations without exposing users to complexity.",
  },
  proof: {
    title: "Proof",
    icon: ClipboardDocumentCheckIcon,
    purpose:
      "Generate a receipt object that proves the full lifecycle from collection to settlement to payout.",
    why:
      "Finance, compliance, and support teams need a single object for audits, disputes, and reconciliation.",
    seta:
      "The final proof links collect status, SETA minting, settlement route, SETA burning, payout execution, fees, and timestamps.",
    checks: [
      "Receipt finalized",
      "Proof hash generated",
      "Ledger events attached",
      "Reconciliation pack ready",
      "Audit trail completed",
    ],
    value:
      "Turns fragmented payout operations into one verifiable settlement record.",
  },
};

function SetaAmount({ value, suffix = "SETA", dark = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
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

function FiatAmount({ value, currency = "SAR", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{value}</span>
      {/* <img src={LOGO_ICON} alt="SETA" className="h-4 w-4 rounded-full object-contain ring-1 ring-blue-100" /> */}
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
      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {(status || "created").replace("_", " ")}
    </span>
  );
};

function WalletReadinessModal({ open, onClose, onStartDemo }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-blue-700" />
                </span>

                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Account and wallet setup is waiting
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    The production wallet and partner onboarding flow are not required for this investor demo.
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <InfoBox
                  icon={ExclamationTriangleIcon}
                  title="What is active now"
                  copy="The dashboard simulates collection, SETA minting, settlement routing, SETA burning, payout execution, and receipt proof."
                />
                <InfoBox
                  icon={RocketLaunchIcon}
                  title="Pilot-ready path"
                  copy="Start with one corridor and one platform workflow, then connect live wallets, partners, and API rails later."
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    onClose();
                    onStartDemo();
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Run demo now
                </Button>

                <Button variant="secondary" onClick={onClose}>
                  Continue to dashboard
                </Button>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            <div className="px-6 sm:px-7 py-4 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-600">
                  Settlement Infrastructure • Collect • Settle • Payout • Proof
                </div>
                <img src={LOGO_ICON} alt="SETA" className="w-7 h-7 object-contain" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StepDetailModal({ step, tx, open, onClose }) {
  if (!step) return null;

  const safeTx = tx ? normalizeTx(tx) : null;
  const meta = stepMeta[step];
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                    <Icon className="h-7 w-7 text-blue-700" />
                  </span>

                  <div>
                    <div className="text-xs font-semibold tracking-wider text-blue-700">
                      STEP DETAIL
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                      {meta.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {meta.purpose}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-7 grid md:grid-cols-2 gap-4">
                <DetailBlock title="Why this stage matters" copy={meta.why} />
                <DetailBlock title="Platform value" copy={meta.value} />
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="h-6 w-6 text-blue-700 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">SETA impact</div>
                    <div className="text-sm text-slate-700 mt-1 leading-relaxed">
                      {meta.seta}
                    </div>
                    <div className="text-xs text-blue-700 mt-2">
                      Token model: SETA uses a deposit-backed settlement unit pattern internally.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-3 gap-4">
                <Metric
                  label="Gross amount"
                  value={
                    <FiatAmount
                      value={(safeTx?.amount || 0).toLocaleString()}
                      currency={safeTx?.currency || "SAR"}
                    />
                  }
                />
                <Metric
                  label="Net settlement"
                  value={
                    <SetaAmount
                      value={(safeTx?.netSettlement || 0).toLocaleString()}
                    />
                  }
                />
                <Metric
                  label="Fees locked"
                  value={`${safeTx?.fees || 0} ${safeTx?.currency || "SAR"}`}
                />
              </div>

              <div className="mt-6">
                <div className="font-bold text-slate-900">Checks performed</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {meta.checks.map((check) => (
                    <div
                      key={check}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                    >
                      ✓ {check}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
                <div className="text-sm text-slate-400">Operational context</div>
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                  <ContextRow label="Corridor" value={safeTx?.corridorId} />
                  <ContextRow label="Pricing band" value={safeTx?.pricingBand} />
                  <ContextRow label="Risk score" value={`${safeTx?.riskScore}/100`} />
                  <ContextRow label="Compliance" value={safeTx?.complianceStatus} />
                  <ContextRow
                    label="Velocity limit"
                    value={safeTx?.controls?.velocityLimit}
                  />
                  <ContextRow
                    label="Approval policy"
                    value={safeTx?.controls?.approvalPolicy}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState(loadTransactions());
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  const activeTx = transactions[0] ? normalizeTx(transactions[0]) : null;

  const stats = useMemo(() => {
    const normalized = transactions.map(normalizeTx);
    const volume = normalized.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const setaMinted = normalized.reduce(
      (sum, tx) => sum + Number(tx.setaMinted || 0),
      0
    );
    const setaBurned = normalized.reduce(
      (sum, tx) => sum + Number(tx.setaBurned || 0),
      0
    );
    const paid = normalized.filter((tx) => tx.status === "paid_out").length;

    return { volume, paid, setaMinted, setaBurned };
  }, [transactions]);

  const updateTx = (nextTx) => {
    const normalizedNextTx = normalizeTx(nextTx);
    const next = [
      normalizedNextTx,
      ...transactions
        .map(normalizeTx)
        .filter((t) => t.transactionId !== normalizedNextTx.transactionId),
    ];

    setTransactions(next);
    saveTransactions(next);
  };

  const startDemo = () => {
    const tx = seedTransaction();
    updateTx(tx);
    toast.success("Payment request created");
  };

  useEffect(() => {
    if (searchParams.get("demo") === "true" && transactions.length === 0) {
      startDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collectPayment = () => {
    if (!activeTx) return;

    updateTx({
      ...activeTx,
      status: "collected",
      stage: "settle",
      collectedAt: nowIso(),
      ledger: [
        ...activeTx.ledger,
        {
          label: "Payment collected",
          type: "collect",
          value: `${activeTx.amount.toLocaleString()} ${activeTx.currency}`,
          description:
            "Funds confirmed from customer wallet. Settlement value is now eligible for SETA minting.",
          time: nowIso(),
        },
      ],
    });

    toast.success("Payment collected");
  };

  const runSettlement = () => {
    if (!activeTx) return;

    updateTx({
      ...activeTx,
      status: "settled",
      stage: "payout",
      settledAt: nowIso(),
      setaMinted: activeTx.netSettlement,
      dsuMinted: activeTx.netSettlement,
      ledger: [
        ...activeTx.ledger,
        {
          label: "SETA minted",
          type: "mint",
          value: `${activeTx.netSettlement.toLocaleString()} SETA`,
          description:
            "Net collected value represented as SETA inside the settlement vault.",
          time: nowIso(),
        },
        {
          label: "Settlement routed",
          type: "settle",
          value: activeTx.corridorId,
          description:
            "Route selected using corridor policy, partner availability, limits, and compliance controls.",
          time: nowIso(),
        },
      ],
    });

    toast.success("SETA minted and settlement routed");
  };

  const executePayout = () => {
    if (!activeTx) return;

    const receiptPayload = {
      receiptId: activeTx.receiptId,
      transactionId: activeTx.transactionId,
      amount: activeTx.amount,
      currency: activeTx.currency,
      fees: activeTx.fees,
      setaMinted: activeTx.setaMinted,
      setaBurned: activeTx.netSettlement,
      route: activeTx.routingPath,
      status: "paid_out",
      timestamp: nowIso(),
    };

    updateTx({
      ...activeTx,
      status: "paid_out",
      stage: "proof",
      paidOutAt: nowIso(),
      setaBurned: activeTx.netSettlement,
      dsuBurned: activeTx.netSettlement,
      payoutAmount: activeTx.netSettlement,
      proofHash: createProofHash(receiptPayload),
      ledger: [
        ...activeTx.ledger,
        {
          label: "SETA burned",
          type: "burn",
          value: `${activeTx.netSettlement.toLocaleString()} SETA`,
          description:
            "SETA settlement claim closed before external payout execution.",
          time: nowIso(),
        },
        {
          label: "Payout executed",
          type: "payout",
          value: `${activeTx.netSettlement.toLocaleString()} ${activeTx.currency}`,
          description:
            "Beneficiary payout submitted through approved partner rail.",
          time: nowIso(),
        },
        {
          label: "Receipt proof generated",
          type: "proof",
          value: "Proof hash created",
          description:
            "Final audit receipt links collection, SETA minting, routing, SETA burning, payout, and fees.",
          time: nowIso(),
        },
      ],
    });

    toast.success("SETA burned, payout executed, receipt generated");
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTransactions([]);
    toast.success("Demo reset");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <WalletReadinessModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onStartDemo={startDemo}
      />

      <StepDetailModal
        open={!!selectedStep}
        step={selectedStep}
        tx={activeTx}
        onClose={() => setSelectedStep(null)}
      />

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-blue-700">
            SETA Network Enterprise Demo
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Settlement Command Center
          </h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            Simulate the full enterprise settlement lifecycle: payment collection,
            SETA minting, policy-based settlement routing, SETA burning, payout
            execution, and audit-grade receipt proof.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={startDemo}>Start Demo Transfer</Button>
          <Button variant="secondary" onClick={() => navigate("/transactions")}>
            View Transactions
          </Button>
          <Button variant="secondary" onClick={() => setShowWalletModal(true)}>
            Account / Wallet Setup
          </Button>
          <Button variant="ghost" onClick={resetDemo}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        <StatCard
          label="Total Volume"
          value={<FiatAmount value={stats.volume.toLocaleString()} currency="SAR" />}
        />
        <StatCard
          label="SETA Minted"
          value={<SetaAmount value={stats.setaMinted.toLocaleString()} />}
        />
        <StatCard
          label="SETA Burned"
          value={<SetaAmount value={stats.setaBurned.toLocaleString()} />}
        />
        <StatCard label="Completed Payouts" value={stats.paid} />
      </div>

      {!activeTx ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <ArrowsRightLeftIcon className="h-7 w-7 text-blue-700" />
          </div>

          <div className="mt-5 text-2xl font-bold text-slate-900">
            No active settlement flow
          </div>

          <p className="text-slate-600 mt-2">
            Start a demo transfer to simulate SETA end-to-end.
          </p>

          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Button onClick={startDemo}>Create Payment Request</Button>
            <Button variant="secondary" onClick={() => setShowWalletModal(true)}>
              Account / Wallet Setup
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <div className="text-sm text-slate-500">Active Transaction</div>
                <div className="mt-1 font-mono text-sm text-slate-700 break-all">
                  {activeTx.transactionId}
                </div>

                <div className="mt-4 text-3xl font-bold text-slate-900">
                  <FiatAmount
                    value={activeTx.amount.toLocaleString()}
                    currency={activeTx.currency}
                  />
                </div>

                <div className="mt-2 text-slate-600">
                  {activeTx.platform} → {activeTx.beneficiary}
                </div>
              </div>

              <StatusPill status={activeTx.status} />
            </div>

            <div className="mt-8 grid md:grid-cols-4 gap-4">
              <FlowStep
                number="1"
                title="Collect"
                icon={BanknotesIcon}
                onClick={() => setSelectedStep("collect")}
                active={["created", "collected", "settled", "paid_out"].includes(
                  activeTx.status
                )}
                done={["collected", "settled", "paid_out"].includes(activeTx.status)}
              />

              <FlowStep
                number="2"
                title="Settle"
                icon={ArrowsRightLeftIcon}
                onClick={() => setSelectedStep("settle")}
                active={["collected", "settled", "paid_out"].includes(
                  activeTx.status
                )}
                done={["settled", "paid_out"].includes(activeTx.status)}
              />

              <FlowStep
                number="3"
                title="Payout"
                icon={ShieldCheckIcon}
                onClick={() => setSelectedStep("payout")}
                active={["settled", "paid_out"].includes(activeTx.status)}
                done={activeTx.status === "paid_out"}
              />

              <FlowStep
                number="4"
                title="Proof"
                icon={ClipboardDocumentCheckIcon}
                onClick={() => setSelectedStep("proof")}
                active={activeTx.status === "paid_out"}
                done={!!activeTx.proofHash}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={collectPayment}
                disabled={activeTx.status !== "created"}
              >
                Collect Payment
              </Button>

              <Button
                variant="secondary"
                onClick={runSettlement}
                disabled={activeTx.status !== "collected"}
              >
                Run Settlement + Mint SETA
              </Button>

              <Button
                variant="secondary"
                onClick={executePayout}
                disabled={activeTx.status !== "settled"}
              >
                Execute Payout + Burn SETA
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate(`/receipts/${activeTx.receiptId}`)}
                disabled={!activeTx.proofHash}
              >
                View Receipt
              </Button>
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center gap-2">
                <BuildingLibraryIcon className="h-5 w-5 text-blue-700" />
                <h2 className="font-bold text-slate-900">
                  Enterprise Settlement Context
                </h2>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <DataRow label="Platform reference" value={activeTx.platformRef} />
                <DataRow label="Corridor" value={activeTx.corridorId} />
                <DataRow label="Merchant" value={activeTx.merchant} />
                <DataRow label="Payout rail" value={activeTx.payoutRail} />
                <DataRow label="Pricing band" value={activeTx.pricingBand} />
                <DataRow label="FX policy" value={activeTx.fxPolicy} />
                <DataRow label="Compliance" value={activeTx.complianceStatus} />
                <DataRow label="Risk score" value={`${activeTx.riskScore}/100`} />
              </div>
            </Card>

            <Card className="p-6 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-blue-300" />
                <h2 className="font-bold">Controls</h2>
              </div>

              <div className="mt-5 space-y-4">
                <DarkDataRow label="Velocity limit" value={activeTx.controls?.velocityLimit} />
                <DarkDataRow label="Payout hold" value={activeTx.controls?.payoutHold} />
                <DarkDataRow label="Approval policy" value={activeTx.controls?.approvalPolicy} />
                <DarkDataRow label="Partner rule" value={activeTx.controls?.partner} />
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <ScaleIcon className="h-5 w-5 text-blue-700" />
                <h2 className="font-bold text-slate-900">
                  SETA Settlement Ledger
                </h2>
              </div>

              <div className="mt-5 grid md:grid-cols-3 gap-4">
                <SetaBox
                  icon={CurrencyDollarIcon}
                  label="Collected"
                  value={<FiatAmount value={activeTx.amount.toLocaleString()} currency="SAR" />}
                />
                <SetaBox
                  icon={SparklesIcon}
                  label="Minted"
                  value={<SetaAmount value={activeTx.setaMinted.toLocaleString()} />}
                />
                <SetaBox
                  icon={FireIcon}
                  label="Burned"
                  value={<SetaAmount value={activeTx.setaBurned.toLocaleString()} />}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-slate-700">
                SETA represents controlled settlement value. It is minted after
                collection, routed during settlement, and burned once payout is
                executed.
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-700" />
                <h2 className="font-bold text-slate-900">Operational Ledger</h2>
              </div>

              <div className="mt-5 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {activeTx.ledger.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{item.label}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {item.description}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 whitespace-nowrap">
                        {String(item.value).replaceAll("SETA-DSU", "SETA")}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {fmtDate(item.time)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-slate-900 text-white">
            <div className="text-sm text-slate-400">Current Route</div>

            <div className="mt-3 grid md:grid-cols-5 gap-3">
              {activeTx.routingPath.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-4"
                >
                  <div className="text-xs text-slate-400">Node {index + 1}</div>
                  <div className="mt-1 font-semibold">
                    {String(item).replaceAll("DSU", "SETA")}
                  </div>
                </div>
              ))}
            </div>

            {activeTx.proofHash && (
              <div className="mt-6">
                <div className="text-sm text-slate-400">Proof Hash</div>
                <div className="mt-2 rounded-xl bg-slate-800 border border-slate-700 p-4 font-mono text-sm break-all">
                  {activeTx.proofHash}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function InfoBox({ icon: Icon, title, copy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-blue-700 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600 leading-relaxed">{copy}</div>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ title, copy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="font-bold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{copy}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-white font-semibold">{value || "N/A"}</div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="p-6">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}

function FlowStep({ number, title, active, done, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
        done
          ? "border-emerald-200 bg-emerald-50"
          : active
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${
            done
              ? "bg-emerald-600 text-white"
              : active
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {done ? "✓" : number}
        </div>

        <Icon
          className={`h-5 w-5 ${
            done ? "text-emerald-700" : active ? "text-blue-700" : "text-slate-400"
          }`}
        />
      </div>

      <div className="mt-3 font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
        <EyeIcon className="h-3.5 w-3.5" />
        View stage detail
      </div>
    </button>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value || "N/A"}</div>
    </div>
  );
}

function DarkDataRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value || "N/A"}</div>
    </div>
  );
}

function SetaBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-blue-700" />
      <div className="mt-3 text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{value}</div>
    </div>
  );
}