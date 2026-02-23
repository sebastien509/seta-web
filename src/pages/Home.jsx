// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, ThemeToggle } from "../components";
import DownloadWalletModal from "../components/DownloadWalletModal";

// HEROICONS (payments/banking oriented) — no emojis
import {
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  ReceiptPercentIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
  BriefcaseIcon,
  TruckIcon,
  TicketIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Background (top hero only)
const BG_VIDEO =
  "https://res.cloudinary.com/dyeomcmin/video/upload/v1769920336/113367-697718066_small_u2chbh.mp4";

// Logos (blue square PNGs)
const LOGO_BIG =
  "https://res.cloudinary.com/dvcmopd4q/image/upload/v1771644530/Logo_SETA_Var_2_y8qptu.png";
const LOGO_ICON =
  "https://res.cloudinary.com/dvcmopd4q/image/upload/v1771644531/Logo_SETA_Var_1_hle4ln.png";

/* ----------------------------- Helpers ----------------------------- */

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isStandalonePWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ----------------------------- UI ----------------------------- */

const SoftGlow = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-48 -left-56 h-[680px] w-[680px] rounded-full bg-blue-500/18 blur-3xl" />
    <div className="absolute -top-44 -right-60 h-[740px] w-[740px] rounded-full bg-cyan-400/16 blur-3xl" />
    <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 h-[540px] w-[1100px] rounded-full bg-sky-300/12 blur-3xl" />
  </div>
);

const FloatingLogos = () => (
  <div className="absolute inset-0 pointer-events-none z-[1]">
    <img
      src={LOGO_BIG}
      alt="SETA watermark"
      className="hidden md:block absolute right-[-140px] top-[90px] w-[620px] opacity-[0.10] rotate-[-6deg]
                 drop-shadow-[0_28px_90px_rgba(37,99,235,0.16)] select-none"
      draggable={false}
      loading="lazy"
    />
    <img
      src={LOGO_ICON}
      alt="SETA icon accent"
      className="absolute left-7 bottom-[140px] w-12 opacity-[0.16]
                 drop-shadow-[0_18px_65px_rgba(37,99,235,0.14)] select-none"
      draggable={false}
      loading="lazy"
    />
  </div>
);

const NavLink = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
  >
    {children}
  </button>
);

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
    {Icon ? <Icon className="h-4 w-4 text-blue-600" /> : null}
    {children}
  </span>
);

const SectionTitle = ({ kicker, title, subtitle }) => (
  <motion.div variants={fadeUp} className="max-w-3xl">
    {kicker ? (
      <div className="text-xs font-semibold tracking-wider text-blue-700/80">
        {kicker}
      </div>
    ) : null}
    <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
      {title}
    </h2>
    {subtitle ? (
      <p className="mt-3 text-lg text-slate-600">{subtitle}</p>
    ) : null}
  </motion.div>
);

const GlassCard = ({ className = "", children }) => (
  <Card
    className={[
      "border border-slate-200/80 bg-white/78 backdrop-blur",
      "shadow-[0_14px_44px_rgba(15,23,42,0.08)]",
      "rounded-2xl",
      className,
    ].join(" ")}
  >
    {children}
  </Card>
);

const FeatureCard = ({ icon: Icon, title, copy }) => (
  <motion.div variants={fadeUp}>
    <GlassCard className="p-7 h-full">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Icon className="h-6 w-6 text-blue-600" />
        </span>
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{copy}</p>
    </GlassCard>
  </motion.div>
);

const StepCard = ({ step, title, copy, icon: Icon }) => (
  <motion.div variants={fadeUp}>
    <GlassCard className="p-8 h-full">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500">Step {step}</div>
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="mt-3 text-xl font-extrabold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{copy}</p>
      <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-slate-700">
        Receipts by default: status, routing path, fees, timestamps, and reference IDs.
      </div>
    </GlassCard>
  </motion.div>
);

const CTAButton = ({ onClick, label = "Open Wallet" }) => (
  <Button
    onClick={onClick}
    className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-600"
  >
    {label}
  </Button>
);

const Divider = () => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
  </div>
);

const ProofBadge = ({ icon: Icon, title, copy }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
    <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600 leading-relaxed">{copy}</div>
    </div>
  </div>
);

const FAQItem = ({ icon: Icon, q, a }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
      <div>
        <div className="text-sm font-extrabold text-slate-900">{q}</div>
        <div className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</div>
      </div>
    </div>
  </div>
);

/* ----------------------------- Availability Modal ----------------------------- */

const modalBackdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

const modalPanel = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: 8, scale: 0.985, transition: { duration: 0.18, ease: "easeIn" } },
};

function WalletUnavailableModal({ open, onClose, onRequestPilot }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={[
            "fixed inset-0 z-[100] flex justify-center",
            "items-start sm:items-center",
            "px-4 sm:px-6",
            "pt-[calc(env(safe-area-inset-top)+16px)]",
            "pb-[calc(env(safe-area-inset-bottom)+16px)]",
          ].join(" ")}
          initial="hidden"
          animate="show"
          exit="exit"
          variants={modalBackdrop}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
          />

          <motion.div
            variants={modalPanel}
            className={[
              "relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white",
              "shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden",
              "max-h-[calc(100dvh-32px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
              "overflow-y-auto",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet not available"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-blue-700" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      Wallet experience is not wired yet
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      You’re seeing the live brand site. Wallet connections and routes are currently disabled while we finalize integration.
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-700 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        What you can do right now
                      </div>
                      <div className="mt-1 text-sm text-slate-600 leading-relaxed">
                        Review the settlement model on this page and request a pilot. We can enable sandbox access for platform integrations.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="flex items-start gap-3">
                    <RocketLaunchIcon className="h-5 w-5 text-blue-700 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Pilot-ready path
                      </div>
                      <div className="mt-1 text-sm text-slate-600 leading-relaxed">
                        Start with one corridor and one platform workflow. We validate payout reliability, receipts, and reconciliation packs.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onRequestPilot}
                  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-600"
                >
                  Request a pilot
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                >
                  Continue browsing
                </Button>
              </div>

              <div className="mt-5 text-xs text-slate-500">
                Note: Wallet and API routes will be enabled after wiring is complete.
              </div>
            </div>

            <div className="h-px bg-slate-200" />
            <div className="px-6 sm:px-7 py-4 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-600">
                  Settlement Infrastructure • Collect • Settle • Payout • Proof
                </div>
                <img
                  src={LOGO_ICON}
                  alt="SETA"
                  className="w-7 h-7 object-contain opacity-90"
                  draggable={false}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ----------------------------- Main Page ----------------------------- */

export default function Home() {
  const navigate = useNavigate();

  const [showDownload, setShowDownload] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [showWalletUnavailable, setShowWalletUnavailable] = useState(false);

  const videoRef = useRef(null);

  const mobile = useMemo(() => isMobileUA(), []);
  const standalone = useMemo(() => isStandalonePWA(), []);

  // Reduced motion: avoid autoplay background video (desktop) — but allow on mobile
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(!!mq?.matches);
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  // Ensure mobile video attempts to play
  useEffect(() => {
    if (!mobile) return;
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        // ignore — Safari may block; we'll retry on visibility change
      }
    };

    tryPlay();

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };

    window.addEventListener("visibilitychange", onVis);
    return () => window.removeEventListener("visibilitychange", onVis);
  }, [mobile]);

  // Show app prompt only once on mobile (never in PWA)
  useEffect(() => {
    if (!mobile) return;
    if (standalone) return;

    const seen = localStorage.getItem("seta_seen_app_prompt");
    if (!seen) {
      localStorage.setItem("seta_seen_app_prompt", "1");
      setShowDownload(true);
    }
  }, [mobile, standalone]);

  // Intercept all routes/actions that would leave Home.
  const interceptOutbound = () => setShowWalletUnavailable(true);

  // Keep pilot request internal
  const handleRequestPilot = () => {
    setShowWalletUnavailable(false);
    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleTalkToUs = () => interceptOutbound();

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      <WalletUnavailableModal
        open={showWalletUnavailable}
        onClose={() => setShowWalletUnavailable(false)}
        onRequestPilot={handleRequestPilot}
      />

      {/* NAVBAR */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3"
          >
            <img
              src={LOGO_ICON}
              alt="SETA"
              className="w-9 h-9 object-contain drop-shadow-[0_10px_30px_rgba(37,99,235,0.18)]"
              draggable={false}
            />
            <div className="leading-tight text-left">
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                SETA Network
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  <GlobeAltIcon className="h-3.5 w-3.5" />
                  Settlement Infrastructure
                </span>
              </div>
              <div className="text-xs text-slate-600">
              Collect • Settle • Payout • On-chain
              </div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <NavLink onClick={() => scrollTo("capabilities")}>Capabilities</NavLink>
            <NavLink onClick={() => scrollTo("how")}>How it works</NavLink>
            <NavLink onClick={() => scrollTo("usecases")}>Use cases</NavLink>
            <NavLink onClick={() => scrollTo("trust")}>Trust</NavLink>
            <NavLink onClick={() => scrollTo("faq")}>FAQ</NavLink>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <CTAButton onClick={interceptOutbound} label="Get started" />
            <Button
              variant="secondary"
              onClick={handleTalkToUs}
              className="hidden sm:inline-flex bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
            >
              Talk to us
            </Button>

            {showDownload && (
              <DownloadWalletModal
                onClose={() => setShowDownload(false)}
                onContinueWeb={() => {
                  setShowDownload(false);
                  interceptOutbound();
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* HERO WRAPPER (video should only live here) */}
      <div className="relative z-[1]">
        {/* TOP HERO BACKGROUND ONLY */}
        <div className="absolute inset-x-0 top-0 h-[760px] sm:h-[820px] pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />

          {videoOk && (!reduceMotion || mobile) ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-[0.10]"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              onError={() => setVideoOk(false)}
              onCanPlay={() => {
                if (!mobile) return;
                const v = videoRef.current;
                if (v) v.play().catch(() => {});
              }}
            >
              <source src={BG_VIDEO} type="video/mp4" />
            </video>
          ) : null}

          <div className="absolute inset-0 bg-white/72" />
          <SoftGlow />
          <FloatingLogos />

          {/* Fade out to normal white page */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
        </div>

        {/* HERO CONTENT */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={stagger}
          className="relative z-[2]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-10 sm:pb-14">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <motion.div variants={fadeUp} className="flex items-center gap-4">
                  <img
                    src={LOGO_BIG}
                    alt="SETA Network"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_18px_50px_rgba(37,99,235,0.18)]"
                    draggable={false}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-wider text-blue-700/80">
                    ON-CHAIN DSU SETTLEMENT FOR PLATFORMS
                    </div>
                    <div className="text-sm text-slate-600">
                    Built on-chain as a DSU for settlement, with partner controls and audit-grade proof.
                    </div>
                  </div>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="mt-20 sm:mt-12 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
                >
                  The settlement layer that makes MENA payouts reliable —
                  <span className="block bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
                    across Enterprises, wallets, and countries.
                  </span>
                </motion.h1>

                <motion.div
                  variants={fadeUp}
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                >
                  <CTAButton onClick={interceptOutbound} label="Start in the wallet" />
                  <Button
                    variant="secondary"
                    onClick={() => scrollTo("capabilities")}
                    className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                  >
                    Explore capabilities
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={interceptOutbound}
                    className="text-slate-700 hover:bg-slate-100"
                  >
                    Request a pilot
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
                  <Pill icon={CreditCardIcon}>Payment collection</Pill>
                  <Pill icon={ArrowsRightLeftIcon}>Settlement routing</Pill>
                  <Pill icon={BanknotesIcon}>Programmable payouts</Pill>
                  <Pill icon={ReceiptPercentIcon}>Predictable fee bands</Pill>
                  <Pill icon={ClipboardDocumentCheckIcon}>Receipts and proof</Pill>
                  <Pill icon={ShieldCheckIcon}>Controls and limits</Pill>
                </motion.div>
              </div>
            </div>

            <motion.div variants={fadeUp} className="mt-20">
              <div className="grid sm:grid-cols-3 gap-4">
                <ProofBadge
                  icon={BuildingLibraryIcon}
                  title="Partner-led deployment"
                  copy="An on-chain DSU designed to work with regulated partners and operational controls."
                />
                <ProofBadge
                  icon={ReceiptPercentIcon}
                  title="Predictable pricing"
                  copy="Fee bands and policies that enable planning, reporting, and CFO confidence."
                />
                <ProofBadge
                  icon={LockClosedIcon}
                  title="Security posture"
                  copy="Control points for limits, holds, and audit exports across the payout lifecycle."
                />
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>

      <Divider />

      {/* CAPABILITIES */}
      <motion.section
        id="capabilities"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
        variants={stagger}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative z-[2]"
      >
        <SectionTitle
          kicker="CAPABILITIES"
          title="Everything a platform needs to settle, pay out, and prove."
          subtitle="A clean API surface on top of an on-chain DSU, with controls and visibility for finance and compliance."
        />

        <motion.div variants={stagger} className="mt-10 grid lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={CreditCardIcon}
            title="Payment collection"
            copy="Links, invoices, QR, and API flows aligned with platform checkout and billing."
          />
          <FeatureCard
            icon={ArrowsRightLeftIcon}
            title="Settlement routing"
            copy="Domestic and cross-border routing with statuses, queues, and operational observability."
          />
          <FeatureCard
            icon={BanknotesIcon}
            title="Programmable payouts"
            copy="Pay sellers, workers, vendors, and partners with rules, limits, and payout workflows."
          />
          <FeatureCard
            icon={ReceiptPercentIcon}
            title="Pricing policy"
            copy="Published fee bands and transparent FX policy where conversion is required."
          />
          <FeatureCard
            icon={ClipboardDocumentCheckIcon}
            title="Receipts and proof"
            copy="Immutable receipt objects for audits, disputes, and reconciliation—consistent across flows."
          />
          <FeatureCard
            icon={DevicePhoneMobileIcon}
            title="User experience"
            copy="Simple wallet interactions; platforms keep the experience clean and friction-free."
          />
        </motion.div>
      </motion.section>

      {/* HOW */}
      <motion.section
        id="how"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
        variants={stagger}
        className="border-y border-slate-200 bg-white/70 backdrop-blur relative z-[2]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <SectionTitle
            kicker="HOW IT WORKS"
            title="A standard settlement flow, designed for operations."
            subtitle="A simple experience for users, and a controlled system for teams responsible for payouts and compliance."
          />

          <motion.div variants={stagger} className="mt-10 grid lg:grid-cols-3 gap-6">
            <StepCard
              step="1"
              icon={CreditCardIcon}
              title="Collect"
              copy="Create invoices or payment requests and confirm via clear statuses and webhooks."
            />
            <StepCard
              step="2"
              icon={ArrowsRightLeftIcon}
              title="Settle"
              copy="Route settlement using policies, corridors, and partner controls—tracked end-to-end."
            />
            <StepCard
              step="3"
              icon={BanknotesIcon}
              title="Payout"
              copy="Execute payouts with limits, queues, and reconciliation packs to keep operations clean."
            />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
            <CTAButton onClick={interceptOutbound} label="Start now" />
            <Button
              variant="secondary"
              onClick={interceptOutbound}
              className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
            >
              Run a test transfer
            </Button>
            <Button
              variant="ghost"
              onClick={interceptOutbound}
              className="text-slate-700 hover:bg-slate-100"
            >
              See transaction receipts
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* USE CASES */}
      <motion.section
        id="usecases"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
        variants={stagger}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative z-[2]"
      >
        <SectionTitle
          kicker="USE CASES"
          title="Built for platforms where payouts are the product."
          subtitle="If your business depends on paying people or businesses reliably, settlement becomes infrastructure—not a feature."
        />

        <motion.div variants={stagger} className="mt-10 grid lg:grid-cols-5 gap-6">
          <FeatureCard
            icon={BuildingStorefrontIcon}
            title="Marketplaces"
            copy="Multi-vendor settlement, seller payouts, and consistent receipts for every order."
          />
          <FeatureCard
            icon={TruckIcon}
            title="Gig and logistics"
            copy="Reliable earnings payout flows to reduce churn and support growth."
          />
          <FeatureCard
            icon={BriefcaseIcon}
            title="Cross-border B2B"
            copy="Procurement and distributors that need predictable settlement and proof."
          />
          <FeatureCard
            icon={TicketIcon}
            title="Travel and events"
            copy="Refunds, chargebacks, and partner payouts with traceability and reporting."
          />
          <FeatureCard
            icon={UsersIcon}
            title="Creator networks"
            copy="Multi-party payouts with fee policy and audit-ready records."
          />
        </motion.div>
      </motion.section>

      {/* TRUST */}
      <motion.section
        id="trust"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
        variants={stagger}
        className="bg-slate-50 border-t border-slate-200 relative z-[2]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <motion.div variants={fadeUp} className="max-w-3xl">
            <div className="text-xs font-semibold tracking-wider text-blue-700/80">
              TRUST
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Proof is built into the rail.
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Receipts, controls, and exports help finance and compliance teams reconcile quickly and operate with confidence.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="mt-10 grid lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={ClipboardDocumentCheckIcon}
              title="Receipt objects"
              copy="Consistent transaction receipts across payment, settlement, and payout stages."
            />
            <FeatureCard
              icon={ChartBarIcon}
              title="Reconciliation packs"
              copy="Exports to reduce manual matching, disputes, and operational overhead."
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Controls and limits"
              copy="Tiered limits, velocity rules, and operational holds where needed."
            />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
            <CTAButton onClick={interceptOutbound} label="Get started" />
            <Button
              variant="secondary"
              onClick={interceptOutbound}
              className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
            >
              Review receipts
            </Button>
            <Button
              variant="ghost"
              onClick={interceptOutbound}
              className="text-slate-700 hover:bg-slate-100"
            >
              View controls
            </Button>
          </motion.div>
        </div>
      </motion.section>

      <Divider />

      {/* FAQ */}
      <motion.section
        id="faq"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
        variants={stagger}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative z-[2]"
      >
        <SectionTitle
          kicker="FAQ"
          title="Questions teams ask before they integrate."
          subtitle="Clear answers for product, finance, and compliance teams evaluating settlement infrastructure."
        />

        <motion.div variants={stagger} className="mt-10 grid lg:grid-cols-2 gap-6">
          <FAQItem
            icon={ArrowsRightLeftIcon}
            q="What problem does SETA solve in one sentence?"
            a="SETA standardizes settlement and payouts across banks, wallets, and countries, with audit-grade receipts and predictable policy."
          />
          <FAQItem
            icon={ClipboardDocumentCheckIcon}
            q="What does proof mean here?"
            a="Every flow produces a receipt that includes status, references, routing path, fees, and timestamps—useful for reconciliation and audits."
          />
          <FAQItem
            icon={ShieldCheckIcon}
            q="How do controls work for platforms and partners?"
            a="Limits, velocity rules, and operational holds can be applied to flows. Teams get visibility through receipts and exports."
          />
          <FAQItem
            icon={ReceiptPercentIcon}
            q="How is pricing structured?"
            a="Pricing is policy-driven with published bands. Teams can forecast costs and reconcile fees in reports and exports."
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10">
          <GlassCard className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold text-slate-500">Ready to pilot</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  Start with one corridor and one platform workflow.
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Validate payout reliability, receipts, and reconciliation packs in a real integration—then expand.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <CTAButton onClick={interceptOutbound} label="Start in the wallet" />
                <Button
                  variant="secondary"
                  onClick={interceptOutbound}
                  className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                >
                  Request a pilot
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur relative z-[2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={LOGO_ICON}
                alt="SETA"
                className="w-10 h-10 object-contain drop-shadow-[0_14px_40px_rgba(37,99,235,0.16)]"
                draggable={false}
              />
              <div>
                <div className="text-sm font-extrabold text-slate-900">SETA Network</div>
                <div className="text-sm text-slate-600 mt-1 max-w-xl">
                On-chain DSU settlement infrastructure for platforms — programmable payouts with audit-grade receipts.                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <CTAButton onClick={interceptOutbound} label="Get started" />
              <Button
                variant="secondary"
                onClick={interceptOutbound}
                className="bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                icon={<ArrowTopRightOnSquareIcon className="h-5 w-5" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <img
              src={LOGO_BIG}
              alt="SETA Network"
              className="w-[240px] h-auto object-contain opacity-95 drop-shadow-[0_22px_70px_rgba(37,99,235,0.16)]"
              draggable={false}
              loading="lazy"
            />
            <div className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Predictable settlement enables predictable growth. SETA standardizes payouts and proof across the region.
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-500">
            © {new Date().getFullYear()} SETA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}