import React, { useState, useEffect, useCallback } from "react";
import { 
  CheckCircle, 
  XCircle,
  Clock, 
  User, 
  IndianRupee,
  RefreshCw,
  Search,
  Loader2,
  ChevronRight,
  Smartphone,
  Banknote,
  CreditCard,
  ShoppingBag,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { 
  fetchAwaitingVerification, 
  fetchVerificationSummary,
  verifyReceiptPayment 
} from "../../services/api";
import { formatISTDisplay } from "../../utils/timezone";

/**
 * MerchantVerify - Dashboard for merchants to verify customer payments
 * 
 * Flow:
 * 1. Customer scans QR → Acknowledges receipt
 * 2. Receipt status = "WAITING_FOR_MERCHANT"
 * 3. Merchant sees it here → Checks their UPI app/cash box
 * 4. Marks as "Paid" or "Unpaid"
 * 5. Customer sees updated status
 */
const MerchantVerify = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // State
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({ totalAwaitingAmount: 0, awaitingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [pendingVerifyId, setPendingVerifyId] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [receiptsRes, summaryRes] = await Promise.all([
        fetchAwaitingVerification(),
        fetchVerificationSummary()
      ]);
      setReceipts(receiptsRes.data.receipts || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load verification data:", error);
      toast.error("Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Listen for receipt updates
    const handleUpdate = () => loadData();
    window.addEventListener('merchant-receipts-updated', handleUpdate);
    return () => window.removeEventListener('merchant-receipts-updated', handleUpdate);
  }, [loadData]);

  // Mark as Paid with payment method selection
  const handleMarkPaid = (receiptId) => {
    setPendingVerifyId(receiptId);
    setShowPaymentMethodModal(true);
  };

  // Confirm payment with selected method
  const confirmPayment = async (paymentMethod) => {
    if (!pendingVerifyId) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [pendingVerifyId]: "paid" }));
      setShowPaymentMethodModal(false);
      
      await verifyReceiptPayment(pendingVerifyId, "paid", paymentMethod);
      
      toast.success("Payment verified! ✅", { duration: 3000 });
      loadData();
      setSelectedReceipt(null);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to verify payment";
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [pendingVerifyId]: null }));
      setPendingVerifyId(null);
    }
  };

  // Mark as Unpaid
  const handleMarkUnpaid = async (receiptId) => {
    try {
      setActionLoading(prev => ({ ...prev, [receiptId]: "unpaid" }));
      
      await verifyReceiptPayment(receiptId, "unpaid");
      
      toast.success("Marked as unpaid", { 
        icon: "⚠️",
        duration: 3000 
      });
      loadData();
      setSelectedReceipt(null);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update receipt";
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [receiptId]: null }));
    }
  };

  // Filter receipts
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.customerName?.toLowerCase().includes(query) ||
      receipt.customerEmail?.toLowerCase().includes(query) ||
      receipt.id?.toLowerCase().includes(query)
    );
  });

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffMins = Math.floor((now - then) / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
            <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={24} />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Verify Payments
          </h1>
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Customers have acknowledged these receipts. Verify payment from your UPI app or cash box.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Awaiting */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <IndianRupee className="text-amber-500" size={18} />
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Awaiting Verification
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            ₹{summary.totalAwaitingAmount?.toLocaleString() || 0}
          </p>
        </div>

        {/* Awaiting Count */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Clock className="text-blue-500" size={18} />
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Receipts to Verify
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {summary.awaitingCount || 0}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={loadData}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isDark 
              ? 'bg-dark-surface text-slate-300 hover:bg-dark-hover border border-dark-border' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className={`relative rounded-xl ${isDark ? 'bg-dark-card' : 'bg-white'} border ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
          />
        </div>
      </div>

      {/* Receipts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} size={32} />
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-emerald-500" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm opacity-75 mt-1">No receipts awaiting verification 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className={`rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-dark-card border-dark-border hover:border-emerald-500/30' 
                  : 'bg-white border-slate-200 hover:border-emerald-500/50'
              } ${selectedReceipt?.id === receipt.id ? (isDark ? 'ring-2 ring-emerald-500/30' : 'ring-2 ring-emerald-500/50') : ''}`}
            >
              {/* Receipt Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setSelectedReceipt(selectedReceipt?.id === receipt.id ? null : receipt)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Customer Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <User className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={20} />
                    </div>
                    
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {receipt.customerName || 'Customer'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatTimeAgo(receipt.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ₹{receipt.amount?.toLocaleString()}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {receipt.items?.length || 0} items
                      </p>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className={`transition-transform ${isDark ? 'text-slate-500' : 'text-slate-400'} ${selectedReceipt?.id === receipt.id ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedReceipt?.id === receipt.id && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-dark-border' : 'border-slate-100'}`}>
                  {/* Items Preview */}
                  <div className="pt-3 mb-4">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Items
                    </p>
                    <div className="space-y-1">
                      {receipt.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                            {item.name} × {item.qty}
                          </span>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            ₹{(item.price * item.qty).toFixed(0)}
                          </span>
                        </div>
                      ))}
                      {receipt.items?.length > 3 && (
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          +{receipt.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMarkPaid(receipt.id)}
                      disabled={actionLoading[receipt.id]}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {actionLoading[receipt.id] === "paid" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          <span>Mark Paid</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleMarkUnpaid(receipt.id)}
                      disabled={actionLoading[receipt.id]}
                      className={`py-3 px-4 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 ${
                        isDark 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      {actionLoading[receipt.id] === "unpaid" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <XCircle size={18} />
                          <span>Unpaid</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Help Text */}
                  <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    💡 Check your UPI app or cash box before verifying
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl ${isDark ? 'bg-dark-card' : 'bg-white'} p-6 animate-[slideUp_0.3s_ease-out]`}>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Payment Method
            </h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              How did the customer pay?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => confirmPayment('upi')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                  isDark 
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30' 
                    : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/30' : 'bg-purple-100'}`}>
                  <Smartphone className="text-purple-500" size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>UPI</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    GPay, PhonePe, Paytm, etc.
                  </p>
                </div>
              </button>

              <button
                onClick={() => confirmPayment('cash')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                  isDark 
                    ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30' 
                    : 'bg-green-50 hover:bg-green-100 border border-green-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/30' : 'bg-green-100'}`}>
                  <Banknote className="text-green-500" size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Cash</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Physical currency
                  </p>
                </div>
              </button>

              <button
                onClick={() => confirmPayment('card')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30' 
                    : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/30' : 'bg-blue-100'}`}>
                  <CreditCard className="text-blue-500" size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Card</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Debit/Credit card
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowPaymentMethodModal(false);
                setPendingVerifyId(null);
              }}
              className={`w-full mt-4 py-3 rounded-xl font-medium ${
                isDark 
                  ? 'bg-dark-surface text-slate-400 hover:bg-dark-hover' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantVerify;
