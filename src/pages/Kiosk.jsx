// src/pages/Kiosk.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  QrCodeIcon,
  ClockIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useWallet, useGas } from '../hooks';
import { Button, Card, QRScanner } from '../components';
import { formatCurrency } from '../utils/formatters';

const Kiosk = () => {
  const navigate = useNavigate();
  const { address, balance, isConnected, sendTransaction } = useWallet();
  const { getCurrentFee } = useGas();
  
  const [mode, setMode] = useState('cashOut'); // cashOut or cashIn
  const [amount, setAmount] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [fee, setFee] = useState('0.5');
  const [kioskMode, setKioskMode] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }
    
    loadFee();
    loadKioskTransactions();
  }, [isConnected, navigate]);
  
  const loadFee = async () => {
    try {
      const feeData = await getCurrentFee();
      setFee(feeData.fee);
    } catch (error) {
      console.error('Failed to load fee:', error);
    }
  };
  
  const loadKioskTransactions = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('kiosk_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  };
  
  const handleCashOut = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      // Calculate USD amount (assuming 1 SETA = $1)
      const usdAmount = (parseFloat(amount) * 1.00).toFixed(2);
      
      const result = await sendTransaction(customerAddress, amount, { isKiosk: true });
      
      if (result.success) {
        toast.success(
          <div>
            <div className="font-semibold">Cash Out Complete!</div>
            <div className="text-sm">
              Paid: ${usdAmount} USD
              <br />
              Fee: {fee} SETA
              <br />
              Transaction: {result.transactionId.slice(0, 12)}...
            </div>
          </div>
        );
        
        // Record transaction
        const tx = {
          id: result.transactionId,
          type: 'cashOut',
          amount: amount,
          amountUSD: usdAmount,
          fee,
          customerAddress,
          timestamp: Date.now(),
          status: 'completed',
        };
        
        const updated = [tx, ...transactions.slice(0, 49)];
        setTransactions(updated);
        localStorage.setItem('kiosk_transactions', JSON.stringify(updated));
        
        // Reset form
        setAmount('');
        setCustomerAddress('');
      }
    } catch (error) {
      toast.error(`Cash out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCashIn = async () => {
    // For cash in, generate payment request
    if (!validateInputs()) return;
    
    const paymentRequest = {
      amount,
      fee,
      total: (parseFloat(amount) + parseFloat(fee)).toFixed(6),
      qrData: `seta:${address}?amount=${amount}&type=cashIn&fee=${fee}`,
      timestamp: Date.now(),
    };
    
    // Save to pending transactions
    const pending = JSON.parse(localStorage.getItem('pending_cashin') || '[]');
    pending.push(paymentRequest);
    localStorage.setItem('pending_cashin', JSON.stringify(pending));
    
    toast.success(
      <div>
        <div className="font-semibold">Payment Request Created</div>
        <div className="text-sm">
          Amount: {amount} SETA
          <br />
          Have customer scan QR code
        </div>
      </div>
    );
  };
  
  const validateInputs = () => {
    if (!customerAddress || customerAddress.length !== 42) {
      toast.error('Please enter a valid customer address');
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (mode === 'cashOut' && parseFloat(balance) < (parseFloat(amount) + parseFloat(fee))) {
      toast.error('Insufficient balance in kiosk wallet');
      return false;
    }
    
    return true;
  };
  
  const handleQRScan = (data) => {
    setShowQRScanner(false);
    
    if (data.startsWith('0x') && data.length === 42) {
      setCustomerAddress(data);
    }
  };
  
  const toggleKioskMode = () => {
    if (kioskMode) {
      // Exit kiosk mode
      setKioskMode(false);
      toast.success('Exited kiosk mode');
    } else {
      // Enter kiosk mode
      if (window.confirm('Enter kiosk mode? This will lock the interface for customer use.')) {
        setKioskMode(true);
        toast.success('Entered kiosk mode');
      }
    }
  };
  
  const quickAmounts = ['10', '20', '50', '100', '200', '500'];
  
  if (kioskMode) {
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Kiosk Interface */}
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white">
              <h1 className="text-3xl font-bold">SETA Kiosk</h1>
              <div className="text-slate-300">Operator Mode</div>
            </div>
            <button
              onClick={toggleKioskMode}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
            >
              Exit Kiosk
            </button>
          </div>
          
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode('cashOut')}
              className={`p-6 rounded-xl text-center transition-all ${
                mode === 'cashOut'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ArrowUpIcon className="w-12 h-12 mx-auto mb-3" />
              <div className="text-2xl font-bold">Cash Out</div>
              <div className="text-sm">Customer receives cash</div>
            </button>
            
            <button
              onClick={() => setMode('cashIn')}
              className={`p-6 rounded-xl text-center transition-all ${
                mode === 'cashIn'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ArrowDownIcon className="w-12 h-12 mx-auto mb-3" />
              <div className="text-2xl font-bold">Cash In</div>
              <div className="text-sm">Customer buys SETA</div>
            </button>
          </div>
          
          {/* Amount Input */}
          <div className="mb-8">
            <div className="text-white text-lg font-medium mb-4">
              Enter {mode === 'cashOut' ? 'USD' : 'SETA'} Amount
            </div>
            <div className="bg-slate-800 rounded-xl p-8">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-6xl font-bold text-white bg-transparent text-center outline-none"
              />
              <div className="text-center text-slate-400 mt-4">
                {mode === 'cashOut' 
                  ? `≈ ${amount ? (parseFloat(amount) / 1.00).toFixed(2) : '0.00'} SETA`
                  : `≈ ${amount ? (parseFloat(amount) * 1.00).toFixed(2) : '0.00'} USD`}
              </div>
            </div>
            
            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className="py-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium text-lg transition-colors"
                >
                  {mode === 'cashOut' ? `$${amt}` : `${amt} SETA`}
                </button>
              ))}
            </div>
          </div>
          
          {/* Customer Address */}
          <div className="mb-8">
            <div className="text-white text-lg font-medium mb-4">
              Customer Wallet Address
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg outline-none"
              />
              <button
                onClick={() => setShowQRScanner(true)}
                className="px-6 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                <QrCodeIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-slate-800 rounded-xl p-6 mb-8">
            <div className="text-white text-xl font-bold mb-4">Transaction Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Amount</span>
                <span className="text-white font-medium">
                  {mode === 'cashOut' ? `$${amount || '0.00'}` : `${amount || '0.00'} SETA`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Network Fee</span>
                <span className="text-white font-medium">{fee} SETA</span>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-white font-bold text-lg">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {mode === 'cashOut' 
                        ? `${(parseFloat(amount || 0) / 1.00 + parseFloat(fee)).toFixed(2)} SETA`
                        : `$${(parseFloat(amount || 0) * 1.00).toFixed(2)}`}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {mode === 'cashOut' ? 'You send SETA' : 'Customer pays cash'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={mode === 'cashOut' ? handleCashOut : handleCashIn}
            loading={loading}
            disabled={!amount || !customerAddress || loading}
            className="w-full py-6 text-xl"
            icon={mode === 'cashOut' ? <QrCodeIcon className="w-6 h-6" /> : <BuildingStorefrontIcon className="w-6 h-6" />}
          >
            {loading 
              ? 'Processing...' 
              : mode === 'cashOut' 
                ? `Cash Out $${amount || '0'}`
                : `Accept ${amount || '0'} SETA`}
          </Button>
          
          {/* Info */}
          <div className="mt-8 text-center text-slate-400 text-sm">
            <div className="flex items-center justify-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              Kiosk transactions complete in 30-60 seconds
            </div>
            <div className="mt-2">
              Fixed {fee} SETA fee • Same fee for all transactions
            </div>
          </div>
        </div>
        
        {/* QR Scanner */}
        {showQRScanner && (
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            onScan={handleQRScan}
            title="Scan Customer Address"
            darkMode={true}
          />
        )}
      </div>
    );
  }
  
  // Normal kiosk management view
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Kiosk Management</h1>
        <p className="text-slate-600 mt-2">
          Manage physical SETA kiosk operations
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="text-slate-600 text-sm mb-2">Kiosk Balance</div>
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(balance)} SETA
            </div>
            <div className="text-slate-500 mt-1">
              ≈ ${(parseFloat(balance) * 1.00).toFixed(2)} USD
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="text-slate-600 text-sm mb-2">Today's Transactions</div>
            <div className="text-3xl font-bold text-slate-900">
              {transactions.filter(tx => 
                new Date(tx.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <div className="text-slate-500 mt-1">
              Last 24 hours
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <div className="text-slate-600 text-sm mb-2">Network Fee</div>
            <div className="text-3xl font-bold text-slate-900">
              {fee} SETA
            </div>
            <div className="text-slate-500 mt-1">
              Fixed per transaction
            </div>
          </div>
        </Card>
      </div>
      
      {/* Main Action */}
      <Card className="mb-8">
        <div className="p-8 text-center">
          <BuildingStorefrontIcon className="w-20 h-20 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to operate kiosk?
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Enter kiosk mode to start processing cash in/out transactions with customers.
            All transactions have fixed {fee} SETA fee and complete in 30-60 seconds.
          </p>
          <Button
            onClick={toggleKioskMode}
            className="px-8 py-4 text-lg"
            icon={<QrCodeIcon className="w-6 h-6" />}
          >
            Enter Kiosk Mode
          </Button>
        </div>
      </Card>
      
      {/* Recent Transactions */}
      {/* <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Transactions</h3>
        <TransactionHistory
          transactions={transactions.slice(0, 10)}
          showKioskInfo={true}
        />
      </div> */}
      
      {/* Kiosk Instructions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Kiosk Operation Guide
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="font-bold text-slate-700">1</span>
              </div>
              <div>
                <div className="font-medium text-slate-800">Enter Kiosk Mode</div>
                <div className="text-slate-600 text-sm">
                  Lock the interface for customer-facing operation
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="font-bold text-slate-700">2</span>
              </div>
              <div>
                <div className="font-medium text-slate-800">Select Transaction Type</div>
                <div className="text-slate-600 text-sm">
                  Cash Out: Customer receives cash for SETA
                  <br />
                  Cash In: Customer buys SETA with cash
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="font-bold text-slate-700">3</span>
              </div>
              <div>
                <div className="font-medium text-slate-800">Enter Amount</div>
                <div className="text-slate-600 text-sm">
                  Use quick buttons or type custom amount
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="font-bold text-slate-700">4</span>
              </div>
              <div>
                <div className="font-medium text-slate-800">Scan Customer Address</div>
                <div className="text-slate-600 text-sm">
                  Use QR scanner or manually enter wallet address
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="font-bold text-slate-700">5</span>
              </div>
              <div>
                <div className="font-medium text-slate-800">Confirm & Process</div>
                <div className="text-slate-600 text-sm">
                  Transaction completes in 30-60 seconds with fixed {fee} SETA fee
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Kiosk;