// src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks";
import { Button, Card } from "../components";
import { formatAddress } from "../utils/formatters";

const Settings = () => {
  const navigate = useNavigate();

  const {
    isReady,
    isUnlocked,
    address,
    unlockWallet,
    lockWallet,
    resetWallet,
  } = useWallet();

  const [hasWallet, setHasWallet] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Keep it simple: detect wallet file existence from web keystore helper
        const mod = await import("../storage/keystore.web");
        const exists = await mod.walletExists();
        if (!mounted) return;
        setHasWallet(exists);
      } catch {
        setHasWallet(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onUnlock = async () => {
    if (!pin || pin.length < 4) return toast.error("Enter your PIN (4+ digits)");
    setBusy(true);
    try {
      const res = await unlockWallet(pin);
      toast.success(`Unlocked: ${formatAddress(res.address, 10)}`);
      setPin("");
    } catch (e) {
      toast.error(e.message || "Unlock failed");
    } finally {
      setBusy(false);
    }
  };

  const onLock = async () => {
    setBusy(true);
    try {
      await lockWallet();
      toast.success("Wallet locked");
    } catch (e) {
      toast.error(e.message || "Lock failed");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      await resetWallet();
      toast.success("Wallet removed from this device");
      setHasWallet(false);
      navigate("/");
    } catch (e) {
      toast.error(e.message || "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-slate-900 font-semibold">Loading settings…</div>
          <div className="text-slate-600 text-sm mt-1">Please wait.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">
          Security controls for your embedded SETA wallet.
        </p>
      </div>

      {/* Wallet Status */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-600">Wallet status</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {hasWallet ? (isUnlocked ? "Unlocked" : "Locked") : "No wallet on this device"}
            </div>
            {hasWallet && address && (
              <div className="mt-2 text-slate-600 text-sm break-all">
                Address: <span className="font-mono">{address}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {hasWallet && isUnlocked && (
              <Button variant="secondary" onClick={onLock} loading={busy} disabled={busy}>
                Lock
              </Button>
            )}
          </div>
        </div>

        {/* Unlock */}
        {hasWallet && !isUnlocked && (
          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN to unlock"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              />
            </label>

            <div className="flex gap-3">
              <Button onClick={onUnlock} loading={busy} disabled={busy}>
                Unlock
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      {hasWallet && (
        <Card className="p-6 border border-red-200 bg-red-50">
          <div className="text-lg font-semibold text-red-900">Danger zone</div>
          <p className="text-sm text-red-800 mt-2">
            Removing the wallet deletes the encrypted key from this browser/device.
            If you don’t have recovery configured later, you may permanently lose access.
          </p>

          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={onRemove}
              loading={busy}
              disabled={busy}
            >
              Remove wallet from device
            </Button>
          </div>
        </Card>
      )}

      {/* Future: Recovery */}
      <Card className="p-6">
        <div className="text-lg font-semibold text-slate-900">Recovery (coming soon)</div>
        <p className="text-slate-600 text-sm mt-2">
          We’ll add recovery options for B2:
          <br />• Encrypted cloud backup (optional)
          <br />• Sharded recovery / MPC (optional)
          <br />• Recovery codes / trusted devices
        </p>

        <div className="mt-4">
          <Button variant="secondary" disabled>
            Configure Recovery
          </Button>
        </div>
      </Card>

      {/* Future: Tiered Limits */}
      <Card className="p-6">
        <div className="text-lg font-semibold text-slate-900">Tiered limits (coming soon)</div>
        <p className="text-slate-600 text-sm mt-2">
          We’ll add KYC tiers with daily/monthly limits and risk rules:
          <br />• Tier 0 (no KYC): small daily limits
          <br />• Tier 1 (basic KYC): higher limits
          <br />• Tier 2 (full KYC): highest limits + business tools
        </p>

        <div className="mt-4">
          <Button variant="secondary" disabled>
            View Limits
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
