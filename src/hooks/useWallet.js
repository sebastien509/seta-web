// src/hooks/useWallet.js
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import config from "../config/config";
import { authorizeTransfer, fetchTxStatus, fetchFee } from "../services/transactions";
import { makeAuthorizationNonceBytes32, signEIP3009Authorization } from "../sdk/eip3009";
import { walletExists, createWalletWithPin, loadWalletPrivateKeyWithPin, deleteWallet } from "../storage/keystore.web";

export function useWallet() {
  const [isReady, setIsReady] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [address, setAddress] = useState(null);
  const [chainId] = useState(config.NETWORK.CHAIN_ID);
  const [fee, setFee] = useState(null);

  const [wallet, setWallet] = useState(null); // ethers.Wallet in-memory only

  const exists = useMemo(() => walletExists(), []);

  const refreshFee = useCallback(async () => {
    const res = await fetchFee();
    setFee(res?.data || res);
    return res?.data || res;
  }, []);

  const createNewWallet = useCallback(async (pin) => {
    setIsReady(false);
    try {
      const w = ethers.Wallet.createRandom();
      await createWalletWithPin(w.privateKey, pin);
      setWallet(w);
      setAddress(w.address);
      setIsUnlocked(true);
      return { address: w.address };
    } finally {
      setIsReady(true);
    }
  }, []);

  const unlockWallet = useCallback(async (pin) => {
    setIsReady(false);
    try {
      const pk = await loadWalletPrivateKeyWithPin(pin);
      if (!pk) throw new Error("No wallet found. Create one first.");
      const w = new ethers.Wallet(pk);
      setWallet(w);
      setAddress(w.address);
      setIsUnlocked(true);
      return { address: w.address };
    } finally {
      setIsReady(true);
    }
  }, []);

  const lockWallet = useCallback(() => {
    setWallet(null);
    setAddress(null);
    setIsUnlocked(false);
  }, []);

  const resetWallet = useCallback(async () => {
    await deleteWallet();
    lockWallet();
  }, [lockWallet]);

  const signAndRelayEIP3009Transfer = useCallback(
    async ({ to, amountHuman, validForSeconds = 600, memo = "", context = {} }) => {
      if (!wallet) throw new Error("Wallet locked. Unlock with PIN first.");
      if (!ethers.isAddress(to)) throw new Error("Invalid recipient address");
      if (!config.TOKEN.ADDRESS) throw new Error("Missing VITE_SETA_TOKEN_ADDRESS in env/config");

      const value = ethers.parseUnits(String(amountHuman), config.TOKEN.DECIMALS).toString();

      const now = Math.floor(Date.now() / 1000);
      const validAfter = 0;
      const validBefore = now + Number(validForSeconds);
      const nonce = makeAuthorizationNonceBytes32();

      // sign typed data
      const signed = await signEIP3009Authorization({
        signer: wallet,
        chainId,
        verifyingContract: config.TOKEN.ADDRESS,
        from: wallet.address,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
      });

      // Relay to backend
      const relayRes = await authorizeTransfer({
        from: wallet.address,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        signature: signed.signature,
        platform: "web",
        memo,
        context,
      });

      return {
        success: true,
        transactionId: relayRes?.data?.transactionId || relayRes?.transactionId,
        status: relayRes?.data?.status || relayRes?.status || "queued",
      };
    },
    [wallet, chainId]
  );

  const pollStatus = useCallback(async (transactionId, { intervalMs = 2500, timeoutMs = 120000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await fetchTxStatus(transactionId);
      const status = res?.data?.status || res?.status || res?.data || "queued";
      if (["confirmed", "completed", "failed", "expired"].includes(status)) return res.data || res;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return { status: "timeout" };
  }, []);

  return {
    // State
    isReady,
    isUnlocked,
    address,
    chainId,
    fee,

    // Wallet lifecycle
    exists, // note: promise (we can make it sync later)
    createNewWallet,
    unlockWallet,
    lockWallet,
    resetWallet,

    // Actions
    refreshFee,
    signAndRelayEIP3009Transfer,
    pollStatus,
  };
}
