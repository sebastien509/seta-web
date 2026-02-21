// src/hooks/useGas.js
import { useState, useCallback } from 'react';
import { getGasClient } from "../services/GasClientWeb";
import toast from 'react-hot-toast';

export const useGas = () => {
  const [fee, setFee] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const gasClient = getGasClient();

  const getCurrentFee = useCallback(async () => {
    setLoading(true);
    try {
      const feeData = await gasClient.getCurrentFee();
      setFee(feeData.fee);
      return feeData;
    } catch (error) {
      console.error('Failed to get fee:', error);
      toast.error('Failed to load current fee');
      return { fee: '0.5', feeUSD: '0.50', isFallback: true };
    } finally {
      setLoading(false);
    }
  }, [gasClient]);

  const submitTransaction = useCallback(async (signedTx, isKiosk = false) => {
    setLoading(true);
    try {
      const result = await gasClient.submitTransaction(signedTx, isKiosk);
      return result;
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [gasClient]);

  const getTransactionStatus = useCallback(async (transactionId) => {
    try {
      const result = await gasClient.getTransactionStatus(transactionId);
      return result;
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }, [gasClient]);

  const estimateTotalCost = useCallback(async (amountSETA) => {
    try {
      const cost = await gasClient.estimateTotalCost(amountSETA);
      return cost;
    } catch (error) {
      console.error('Cost estimation failed:', error);
      throw error;
    }
  }, [gasClient]);

  return {
    // State
    fee,
    loading,
    
    // Actions
    getCurrentFee,
    submitTransaction,
    getTransactionStatus,
    estimateTotalCost,
    
    // Client
    gasClient,
  };
};