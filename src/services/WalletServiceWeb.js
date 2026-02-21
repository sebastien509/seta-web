// src/services/WalletServiceWeb.js
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { getGasClient } from './GasClientWeb';

export class WalletServiceWeb {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.balance = '0';
    this.network = null;
    this.isConnected = false;
    this.web3Modal = null;
    
    this.gasClient = getGasClient();
    
    this.initializeWeb3Modal();
  }
  
  initializeWeb3Modal() {
    this.web3Modal = new Web3Modal({
      network: 'base',
      cacheProvider: true,
      theme: 'dark',
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            rpc: {
              8453: 'https://mainnet.base.org',
            },
          },
        },
      },
    });
  }
  
  async connect() {
    try {
      const instance = await this.web3Modal.connect();
      this.provider = new ethers.providers.Web3Provider(instance);
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();
      this.network = await this.provider.getNetwork();
      this.isConnected = true;
      
      // Get initial balance
      await this.updateBalance();
      
      // Setup event listeners
      this.setupEventListeners(instance);
      
      console.log('Connected:', this.address);
      return this.address;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }
  
  async disconnect() {
    if (this.web3Modal && this.web3Modal.cachedProvider) {
      await this.web3Modal.clearCachedProvider();
    }
    
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.balance = '0';
    this.isConnected = false;
    
    console.log('Disconnected');
  }
  
  async updateBalance() {
    if (!this.address) return;
    
    try {
      const balance = await this.provider.getBalance(this.address);
      this.balance = ethers.utils.formatEther(balance);
      return this.balance;
    } catch (error) {
      console.error('Balance update failed:', error);
      return this.balance;
    }
  }
  
  async signTransaction(transaction) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    // Remove gas fields - backend handles them
    const { gasPrice, gasLimit, maxFeePerGas, maxPriorityFeePerGas, ...txWithoutGas } = transaction;
    
    // Sign transaction locally
    const signedTx = await this.signer.signTransaction({
      ...txWithoutGas,
      chainId: 8453,
      nonce: await this.provider.getTransactionCount(this.address),
    });
    
    return signedTx;
  }
  
  async sendTransaction(to, amount, options = {}) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get current fee
      const feeData = await this.gasClient.getCurrentFee();
      const fee = parseFloat(feeData.fee);
      
      // Check balance
      const totalNeeded = parseFloat(amount) + fee;
      if (parseFloat(this.balance) < totalNeeded) {
        throw new Error(`Insufficient balance. Need ${totalNeeded} SETA (${amount} + ${fee} fee)`);
      }
      
      // Sign transaction
      const signedTx = await this.signTransaction({
        to,
        value: ethers.utils.parseEther(amount),
        data: '0x',
      });
      
      // Submit to gas service
      const result = await this.gasClient.submitTransaction(signedTx, options.isKiosk);
      
      if (!result.success) {
        throw new Error(result.error || 'Transaction submission failed');
      }
      
      // Update local balance
      const newBalance = Math.max(0, parseFloat(this.balance) - totalNeeded);
      this.balance = newBalance.toFixed(6);
      
      return {
        success: true,
        transactionId: result.data.transactionId,
        txHash: result.data.txHash,
        fee,
        estimatedTime: result.data.estimatedTime,
      };
    } catch (error) {
      console.error('Send transaction failed:', error);
      throw error;
    }
  }
  
  async signAndRelay(transaction, options = {}) {
    // For more complex transactions
    const signedTx = await this.signTransaction(transaction);
    const result = await this.gasClient.submitTransaction(signedTx, options.isKiosk);
    return result;
  }
  
  setupEventListeners(provider) {
    // Handle account changes
    provider.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
        window.location.reload();
      } else {
        this.address = accounts[0];
        this.updateBalance();
      }
    });
    
    // Handle chain changes
    provider.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      window.location.reload();
    });
    
    // Handle disconnect
    provider.on('disconnect', (error) => {
      console.log('Provider disconnected:', error);
      this.disconnect();
      window.location.reload();
    });
  }
  
  async switchNetwork(chainId = 8453) {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }
  
  async getTransactionReceipt(txHash) {
    if (!this.provider) return null;
    
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Receipt fetch failed:', error);
      return null;
    }
  }
}

// Singleton instance
let walletInstance = null;

export const getWalletService = () => {
  if (!walletInstance) {
    walletInstance = new WalletServiceWeb();
  }
  return walletInstance;
};