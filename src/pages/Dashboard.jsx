// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useWallet } from "../hooks";
import { Button, Card } from "../components";
import { formatAddress } from "../utils/formatters";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    isReady,
    isUnlocked,
    address,
    createNewWallet,
    unlockWallet,
    lockWallet,
    resetWallet,
    refreshFee,
  } = useWallet();

  const [hasWallet, setHasWallet] = useState(false);
  const [mode, setMode] = useState("unlock"); // "unlock" | "create"
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);

  // exists is a Promise in our current hook; resolve once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // walletExists() returns boolean
        const mod = await import("../storage/keystore.web");
        const exists = await mod.walletExists();
        if (!mounted) return;
        setHasWallet(exists);
        setMode(exists ? "unlock" : "create");
      } catch {
        setHasWallet(false);
        setMode("create");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    refreshFee().catch(() => {});
  }, [refreshFee]);

  const pinValid = useMemo(() => pin && pin.length >= 4, [pin]);
  const canCreate = useMemo(
    () => pinValid && pin2 && pin === pin2,
    [pinValid, pin2, pin]
  );

  const onCreate = async () => {
    if (!canCreate) return;
    setBusy(true);
    try {
      const res = await createNewWallet(pin);
      toast.success(`Wallet created: ${formatAddress(res.address, 10)}`);
      setHasWallet(true);
      setMode("unlock");
      setPin("");
      setPin2("");
    } catch (e) {
      toast.error(e.message || "Failed to create wallet");
    } finally {
      setBusy(false);
    }
  };

  const onUnlock = async () => {
    if (!pinValid) return;
    setBusy(true);
    try {
      const res = await unlockWallet(pin);
      toast.success(`Unlocked: ${formatAddress(res.address, 10)}`);
      setPin("");
    } catch (e) {
      toast.error(e.message || "Unlock failed (wrong PIN?)");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setBusy(true);
    try {
      await resetWallet();
      toast.success("Wallet removed from this device");
      setHasWallet(false);
      setMode("create");
    } catch (e) {
      toast.error(e.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-slate-900 font-semibold">Loading wallet…</div>
          <div className="text-slate-600 text-sm mt-1">Please wait.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">SETA Wallet</h1>
        <p className="text-slate-600 mt-2">
        </p>
      </div>

      {/* Unlocked State */}
      {isUnlocked && address ? (
        <>
          <Card className="p-6">
            <div className="text-slate-600 text-sm">Your Address</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 break-all">
              {address}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/send")}>Send</Button>
              <Button variant="secondary" onClick={() => navigate("/receive")}>
                Receive
              </Button>
              <Button variant="secondary" onClick={() => navigate("/transactions")}>
                Transactions
              </Button>
              <Button variant="ghost" onClick={lockWallet}>
                Lock
              </Button>
            </div>
          </Card>

          <Card className="p-6 border border-amber-200 bg-amber-50">
            <div className="font-semibold text-amber-900">Security note</div>
            <div className="text-amber-800 text-sm mt-1">
              Your private key is encrypted on this device. If you reset your browser
              storage without a recovery setup, you can lose access.
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Locked / Create */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-slate-900">
                  {hasWallet ? "Unlock wallet" : "Create wallet"}
                </div>
                <div className="text-slate-600 text-sm mt-1">
                  {hasWallet
                    ? "Enter your PIN to decrypt your key and sign transactions."
                    : "Set a PIN to encrypt your wallet on this device."}
                </div>
              </div>

              <div className="flex gap-2">
                {hasWallet && (
                  <>
                    <Button
                      variant={mode === "unlock" ? "primary" : "secondary"}
                      onClick={() => setMode("unlock")}
                    >
                      Unlock
                    </Button>
                    <Button
                      variant={mode === "create" ? "primary" : "secondary"}
                      onClick={() => setMode("create")}
                    >
                      New Wallet
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">PIN</span>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="4+ digits"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </label>

              {mode === "create" && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Confirm PIN
                  </span>
                  <input
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    placeholder="Repeat PIN"
                    className="mt-2 w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                  {pin2 && pin !== pin2 && (
                    <div className="text-sm text-red-600 mt-2">
                      PINs do not match
                    </div>
                  )}
                </label>
              )}

              <div className="flex gap-3 pt-2">
                {mode === "create" ? (
                  <Button loading={busy} disabled={!canCreate || busy} onClick={onCreate}>
                    Create Wallet
                  </Button>
                ) : (
                  <Button loading={busy} disabled={!pinValid || busy} onClick={onUnlock}>
                    Unlock
                  </Button>
                )}

                {hasWallet && (
                  <Button variant="ghost" loading={busy} disabled={busy} onClick={onReset}>
                    Remove wallet from device
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
