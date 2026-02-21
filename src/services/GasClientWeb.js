// src/services/GasClientWeb.js
import axios from 'axios';
import { ethers } from 'ethers';

export class GasClientWeb {
  constructor() {
    this.baseURL = 'https://api.seta.app/v1/gas';
    this.cache = {
      fee: null,
      expiresAt: 0,
    };
    this.cacheDuration = 30000; // 30 seconds
  }
  
  async getCurrentFee() {
    const now = Date.now();
    
    // Use cache if valid
    if (this.cache.fee && this.cache.expiresAt > now) {
      return { ...this.cache.fee, fromCache: true };
    }
    
    try {
      const response = await axios.get(`${this.baseURL}/fee`, {
        timeout: 5000,
      });
      
      if (response.data.success) {
        const feeData = response.data.data;
        this.cache.fee = feeData;
        this.cache.expiresAt = now + this.cacheDuration;
        return feeData;
      }
      
      throw new Error('Fee fetch failed');
    } catch (error) {
      console.error('Failed to fetch fee:', error);
      
      // Return fallback fee
      return {
        fee: '0.5',
        feeUSD: '0.50',
        type: 'fixed',
        updated: new Date().toISOString(),
        isFallback: true,
      };
    }
  }
  
  async submitTransaction(signedTx, isKiosk = false) {
    const token = this.getAuthToken();
    const endpoint = isKiosk ? '/submit/kiosk' : '/submit';
    
    try {
      const response = await axios.post(
        `${this.baseURL}${endpoint}`,
        { signedTx, isKiosk },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Transaction submission failed:', error);
      
      // Provide user-friendly error
      let errorMessage = 'Transaction failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  async getTransactionStatus(transactionId) {
    const token = this.getAuthToken();
    
    try {
      const response = await axios.get(`${this.baseURL}/status/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 5000,
      });
      
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async estimateTotalCost(amountSETA) {
    const feeData = await this.getCurrentFee();
    const amount = parseFloat(amountSETA);
    const fee = parseFloat(feeData.fee);
    
    return {
      amount: amount.toFixed(6),
      fee: fee.toFixed(6),
      feeUSD: feeData.feeUSD,
      total: (amount + fee).toFixed(6),
      totalUSD: ((amount * 1.00) + parseFloat(feeData.feeUSD)).toFixed(2),
      type: 'fixed',
      isFallback: feeData.isFallback || false,
    };
  }
  
  async getBatchStatus(batchId) {
    // For admin/kiosk view
    try {
      const response = await axios.get(`${this.baseURL}/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Batch status failed:', error);
      throw error;
    }
  }
  
  getAuthToken() {
    // Get from localStorage or cookies
    return localStorage.getItem('seta_auth_token') || '';
  }
  
  setAuthToken(token) {
    localStorage.setItem('seta_auth_token', token);
  }
  
  clearAuthToken() {
    localStorage.removeItem('seta_auth_token');
  }
}

// Singleton
let gasClientInstance = null;

export const getGasClient = () => {
  if (!gasClientInstance) {
    gasClientInstance = new GasClientWeb();
  }
  return gasClientInstance;
};