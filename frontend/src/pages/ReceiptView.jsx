import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Store, 
  CheckCircle, 
  XCircle,
  Loader2,
  Receipt,
  Clock,
  LogIn,
  UserPlus,
  Leaf,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { getPublicReceipt, acknowledgeReceipt, getStoredRole, hasSession } from '../services/api';
import toast from 'react-hot-toast';

/**
 * ReceiptView - Customer scans QR and views receipt
 * This is the clean receipt-only flow:
 * 1. Customer scans QR → Views receipt details
 * 2. Taps "I received the bill" → Receipt saved to their account
 * 3. Status = "Waiting for merchant verification"
 * 4. Merchant verifies later from their dashboard
 */
const ReceiptView = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  
  // Check if customer is logged in
  const isLoggedIn = hasSession() && getStoredRole() === 'customer';

  // Fetch receipt data
  const loadReceipt = useCallback(async () => {
    try {
      const { data } = await getPublicReceipt(receiptId);
      setReceipt(data);
      return data;
    } catch (err) {
      console.error('Failed to load receipt:', err);
      const message = err.response?.data?.message || 'Receipt not found';
      setError(message);
      return null;
    }
  }, [receiptId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadReceipt();
      setLoading(false);
    };
    
    if (receiptId) {
      init();
    }
  }, [receiptId, loadReceipt]);

  // Handle acknowledging receipt
  const handleAcknowledge = async () => {
    if (!receipt || !isLoggedIn) return;
    
    setAcknowledging(true);
    
    try {
      await acknowledgeReceipt(receiptId);
      
      setAcknowledged(true);
      toast.success('Receipt saved to your account! 🧾');
      
      // Dispatch event to update customer dashboard
      window.dispatchEvent(new Event('customer-receipts-updated'));
      
      // Navigate to customer dashboard after short delay
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to acknowledge receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setAcknowledging(false);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    sessionStorage.setItem('pendingReceiptAcknowledge', receiptId);
    navigate('/customer-login', { state: { returnTo: `/r/${receiptId}` } });
  };

  // Handle signup redirect
  const handleSignupRedirect = () => {
    sessionStorage.setItem('pendingReceiptAcknowledge', receiptId);
    navigate('/customer-signup', { state: { returnTo: `/r/${receiptId}` } });
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display info
  const getStatusInfo = (status, paymentMethod) => {
    // Check if it's a khata/pending payment
    const isKhata = paymentMethod === 'khata' || paymentMethod === 'pending';
    
    switch (status) {
      case 'completed':
        if (isKhata) {
          return { 
            icon: CheckCircle, 
            text: 'Khata Paid', 
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30'
          };
        }
        return { 
          icon: CheckCircle, 
          text: 'Payment Verified', 
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30'
        };
      case 'waiting_for_merchant':
        return { 
          icon: Clock, 
          text: 'Waiting for merchant verification', 
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30'
        };
      case 'pending':
        if (isKhata) {
          return { 
            icon: AlertCircle, 
            text: 'Pending Payment (Khata)', 
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30'
          };
        }
        return { 
          icon: AlertCircle, 
          text: 'Payment Pending', 
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30'
        };
      default:
        return { 
          icon: Receipt, 
          text: 'New Receipt', 
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30'
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading receipt...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700/50">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Oops!</h1>
          <p className="text-slate-400 text-sm mb-6">{error || 'Receipt not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(receipt.status, receipt.paymentMethod);
  const StatusIcon = statusInfo.icon;

  // Receipt already claimed and acknowledged
  if (acknowledged || receipt.isClaimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-emerald-500/30">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[popIn_0.3s_ease-out]">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Receipt Saved!</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your receipt has been saved to your account.
          </p>
          
          {/* Receipt Summary */}
          <div className="bg-slate-900/50 rounded-2xl p-4 mb-6">
            <div className="text-3xl font-black text-emerald-400 mb-2">₹{receipt.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {receipt.merchant}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border mb-6`}>
            <StatusIcon size={16} className={statusInfo.color} />
            <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
          </div>
          
          <p className="text-slate-500 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Main receipt view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header with GreenReceipt branding */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Leaf size={24} className="text-emerald-400" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-white">GreenReceipt</h1>
          <p className="text-slate-500 text-xs">Paperless receipts for a greener planet 🌱</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-700/50 shadow-xl">
          {/* Merchant Header */}
          <div 
            className="p-6 text-center border-b border-slate-700/50"
            style={{ 
              background: `linear-gradient(135deg, ${receipt.brandColor}20, ${receipt.brandColor}05)` 
            }}
          >
            {receipt.merchantLogo ? (
              <img 
                src={receipt.merchantLogo} 
                alt={receipt.merchant} 
                className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover border-2 border-white/10"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: receipt.brandColor + '30' }}
              >
                <Store size={28} style={{ color: receipt.brandColor }} />
              </div>
            )}
            <h2 className="text-xl font-bold text-white mb-1">{receipt.merchant}</h2>
            <p className="text-slate-400 text-xs">{formatDate(receipt.transactionDate)}</p>
          </div>

          {/* Items List */}
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Items</h3>
            <div className="space-y-2">
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <ShoppingBag size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        <p className="text-slate-500 text-xs">x{item.qty}</p>
                      </div>
                    </div>
                    <p className="text-white font-semibold">₹{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No items listed</p>
              )}
            </div>
          </div>

          {/* Total Section */}
          <div className="p-4 bg-slate-900/30">
            {receipt.discount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Subtotal</span>
                <span className="text-slate-400">₹{receipt.subtotal}</span>
              </div>
            )}
            {receipt.discount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-400 text-sm">Discount</span>
                <span className="text-emerald-400">-₹{receipt.discount}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="text-3xl font-black text-emerald-400">₹{receipt.total}</span>
            </div>
          </div>

          {/* Footer */}
          {receipt.footer && (
            <div className="px-4 py-3 bg-slate-900/50 text-center">
              <p className="text-slate-500 text-xs italic">{receipt.footer}</p>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="mt-6 space-y-3">
          <p className="text-slate-400 text-center text-sm mb-4">
            Save this receipt to your GreenReceipt account
          </p>
          
          {isLoggedIn ? (
            // Logged in - Show acknowledge button
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {acknowledging ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <>
                  <Receipt size={20} className="text-white" />
                  <span className="font-bold text-white">I received the bill</span>
                </>
              )}
            </button>
          ) : (
            // Not logged in - Show login/signup options
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

        {/* Info Note */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <AlertCircle size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium mb-1">How it works</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                After you save this receipt, the merchant will verify your payment from their records. 
                You'll see the status update in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;
