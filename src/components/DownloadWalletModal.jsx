import React from "react";
import Button from "./Button";

export default function DownloadWalletModal({ onClose, onContinueWeb }) {
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // TODO: replace with real store links when ready
  const playStoreUrl = "#";
  const appStoreUrl = "#";

  const openStore = () => {
    if (isIOS) window.open(appStoreUrl, "_blank", "noopener,noreferrer");
    else window.open(playStoreUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 tracking-wide">
              SETA Wallet
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">
              Get the mobile app
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Mobile app gives stronger security (biometric lock, safer key storage)
              and a smoother experience. You can still continue in your browser.
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={openStore}>
            {isIOS ? "Download on App Store" : "Download on Google Play"}
          </Button>

          <Button variant="secondary" className="w-full" onClick={onContinueWeb}>
            Continue in Browser
          </Button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Tip: You can also “Add to Home Screen” to use SETA like an app (PWA).
        </div>
      </div>
    </div>
  );
}
