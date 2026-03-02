import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Store,
  Receipt,
  LogIn,
  UserPlus,
  AlertCircle,
  RefreshCw,
  Leaf,
  Clock
} from 'lucide-react';
import { getPaymentStatus, claimPOSReceipt, getStoredRole, hasSession } from '../services/api';
import toast from 'react-hot-toast';

/**
 * PaymentResult Page
 * 
 * This page handles the result after Razorpay checkout.
 * After a customer completes (or abandons) payment, we verify
 * the payment status with our backend.
 * 
 * IMPORTANT: We do NOT trust the URL params for payment status.
 * The authoritative status comes from our backend, which is updated
 * via Razorpay webhook. We poll the backend to get the true status.
 * 
 * Flow:
 * 1. Customer completes payment in Razorpay checkout
 * 2. Razorpay handler verifies payment with backend
 * 3. We poll backend for payment status (backend gets truth from webhook)
 * 4. Display appropriate UI based on status
 * 5. Offer receipt claiming for logged-in users
 */
const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract params from URL
  const billId = searchParams.get('billId');
  const orderId = searchParams.get('order_id');
  
  // State
  const [status, setStatus] = useState('loading'); // loading | success | failed | pending
  const [bill, setBill] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [claimingReceipt, setClaimingReceipt] = useState(false);
  const [receiptClaimed, setReceiptClaimed] = useState(false);
  
  // Check if customer is logged in
  const isLoggedIn = hasSession() && getStoredRole() === 'customer';
  
  // Max poll attempts (30 seconds / 2 second interval = 15 attempts)
  const MAX_POLLS = 15;
  
  /**
   * Check payment status from backend
   * The backend is the source of truth (via Cashfree webhook)
   */
  const checkStatus = useCallback(async () => {
    if (!billId) {
      setStatus('failed');
      return;
    }
    
    try {
      // Call backend to get payment status
      // Pass verify=true to also check with Razorpay API
      const { data } = await getPaymentStatus(billId, true);
      
      console.log('[PaymentResult] Status check:', {
        status: data.status,
        razorpayStatus: data.razorpayOrderStatus,
        pollCount,
      });
      
      setBill(data);
      
      // Check if payment is confirmed
      if (data.status === 'PAID' || data.status === 'PENDING_KHATA') {
        setStatus('success');
        return true; // Stop polling
      }
      
      // Check if bill expired
      if (data.status === 'EXPIRED') {
        setStatus('failed');
        return true; // Stop polling
      }
      
      // Check if cancelled
      if (data.status === 'CANCELLED') {
        setStatus('failed');
        return true; // Stop polling
      }
      
      // Still pending - continue polling
      setStatus('pending');
      return false; // Continue polling
      
    } catch (err) {
      console.error('[PaymentResult] Status check error:', err);
      // Don't fail immediately - might be a temporary error
      if (pollCount >= MAX_POLLS) {
        setStatus('pending');
        return true; // Stop polling
      }
      return false; // Continue polling
    }
  }, [billId, pollCount]);
  
  // Initial status check and polling
  useEffect(() => {
    if (!billId) {
      setStatus('failed');
      return;
    }
    
    // Initial check
    checkStatus();
    
    // Set up polling
    const pollInterval = setInterval(async () => {
      setPollCount(prev => {
        if (prev >= MAX_POLLS) {
          clearInterval(pollInterval);
          return prev;
        }
        return prev + 1;
      });
      
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [billId]); // Only run on mount
  
  // Handle claiming receipt
  const handleClaimReceipt = async () => {
    if (!billId || !isLoggedIn) return;
    
    setClaimingReceipt(true);
    
    try {
      await claimPOSReceipt(billId);
      setReceiptClaimed(true);
      toast.success('Receipt saved to your account! 📱');
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 1500);
    } catch (err) {
      console.error('[PaymentResult] Claim receipt error:', err);
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setClaimingReceipt(false);
    }
  };
  
  // Handle login redirect
  const handleLoginRedirect = () => {
    sessionStorage.setItem('pendingBillClaim', billId);
    navigate('/customer-login', { state: { returnTo: `/pay/result?billId=${billId}` } });
  };
  
  // Handle signup redirect
  const handleSignupRedirect = () => {
    sessionStorage.setItem('pendingBillClaim', billId);
    navigate('/customer-signup', { state: { returnTo: `/pay/result?billId=${billId}` } });
  };
  
  // Handle retry payment
  const handleRetry = () => {
    navigate(`/pay/${billId}`);
  };
  
  // Handle manual refresh
  const handleManualRefresh = async () => {
    setStatus('loading');
    setPollCount(0);
    await checkStatus();
  };
  
  // No billId - error state
  if (!billId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700/50">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Payment</h1>
          <p className="text-slate-400 text-sm mb-6">
            No payment information found.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700/50">
          <Loader2 size={40} className="animate-spin text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Verifying Payment</h1>
          <p className="text-slate-400 text-sm">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }
  
  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-emerald-500/30">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[popIn_0.3s_ease-out]">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-emerald-400 text-sm mb-6">
            Your payment has been confirmed.
          </p>
          
          {/* Receipt Summary */}
          <div className="bg-slate-900/50 rounded-2xl p-4 mb-6">
            <div className="text-3xl font-black text-emerald-400 mb-2">₹{bill?.amount}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill?.merchant?.name || 'Merchant'}
            </div>
            {bill?.razorpayOrderId && (
              <div className="text-[10px] text-slate-600 mt-2 font-mono">
                Ref: {bill.razorpayOrderId}
              </div>
            )}
          </div>
          
          {/* Save Receipt Options */}
          {!receiptClaimed && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs mb-3">
                Save this receipt to your GreenReceipt account
              </p>
              
              {isLoggedIn ? (
                <button
                  onClick={handleClaimReceipt}
                  disabled={claimingReceipt}
                  className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {claimingReceipt ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <>
                      <Receipt size={20} className="text-white" />
                      <span className="font-bold text-white">Save to My Receipts</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                    <LogIn size={20} className="text-white" />
                    <span className="font-bold text-white">Login to Save Receipt</span>
                  </button>
                  
                  <button
                    onClick={handleSignupRedirect}
                    className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus size={18} className="text-slate-300" />
                    <span className="text-slate-300 text-sm">Create Account</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="w-full p-3 text-slate-500 text-sm hover:text-slate-400 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
          
          {/* Receipt Saved Confirmation */}
          {receiptClaimed && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
                <CheckCircle size={20} />
                <span className="font-medium">Receipt saved!</span>
              </div>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Pending state (still waiting for confirmation)
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/30">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-400" />
          </div>
          
          <h1 className="text-xl font-bold text-white mb-2">Payment Processing</h1>
          <p className="text-slate-400 text-sm mb-6">
            We're waiting for your payment to be confirmed. This usually takes a few seconds.
          </p>
          
          {bill && (
            <div className="bg-slate-900/50 rounded-2xl p-4 mb-6">
              <div className="text-2xl font-bold text-white mb-1">₹{bill.amount}</div>
              <div className="text-xs text-slate-500">{bill.merchant?.name || 'Merchant'}</div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-6">
            <Loader2 size={14} className="animate-spin" />
            <span>Checking payment status...</span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2 text-white transition-colors"
            >
              <RefreshCw size={16} />
              <span>Check Again</span>
            </button>
            
            <button
              onClick={handleRetry}
              className="w-full p-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium transition-colors"
            >
              Retry Payment
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full p-3 text-slate-500 text-sm hover:text-slate-400 transition-colors"
            >
              Go Home
            </button>
          </div>
          
          <p className="text-[10px] text-slate-600 mt-4">
            If you completed the payment, please wait a moment. If the issue persists, contact the merchant.
          </p>
        </div>
      </div>
    );
  }
  
  // Failed state
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-red-500/30">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-400" />
        </div>
        
        <h1 className="text-xl font-bold text-white mb-2">Payment Failed</h1>
        <p className="text-slate-400 text-sm mb-6">
          {bill?.status === 'EXPIRED' 
            ? 'This bill has expired. Please ask the merchant to create a new one.'
            : 'Your payment could not be completed. Please try again.'}
        </p>
        
        {bill && bill.status !== 'EXPIRED' && (
          <div className="bg-slate-900/50 rounded-2xl p-4 mb-6">
            <div className="text-2xl font-bold text-white mb-1">₹{bill.amount}</div>
            <div className="text-xs text-slate-500">{bill.merchant?.name || 'Merchant'}</div>
          </div>
        )}
        
        <div className="space-y-3">
          {bill?.status !== 'EXPIRED' && (
            <button
              onClick={handleRetry}
              className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl text-white font-bold transition-all active:scale-[0.98] shadow-lg"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
