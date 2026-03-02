import React, { useState, useEffect, useCallback } from "react";
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  Store, 
  IndianRupee,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertCircle,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { 
  fetchCustomerPendingReceipts, 
  fetchCustomerPendingSummary,
  payPendingBill 
} from "../../services/api";
import { formatISTDisplay } from "../../utils/timezone";

const CustomerPending = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // State
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [summary, setSummary] = useState({ totalPendingAmount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [receiptsRes, summaryRes] = await Promise.all([
        fetchCustomerPendingReceipts(),
        fetchCustomerPendingSummary()
      ]);
      setPendingReceipts(receiptsRes.data.receipts || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load pending data:", error);
      toast.error("Failed to load pending bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pay pending bill
  const handlePayBill = async (receiptId, method = "upi") => {
    try {
      setActionLoading(prev => ({ ...prev, [receiptId]: true }));
      await payPendingBill(receiptId, method);
      toast.success("Payment recorded! Thank you.");
      loadData(); // Refresh list
      setSelectedReceipt(null);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to record payment";
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [receiptId]: false }));
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          💳 Pending Payments
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
          Your outstanding bills from merchants
        </p>
      </div>

      {/* Summary Card */}
      {summary.totalPendingAmount > 0 && (
        <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Total Outstanding
              </p>
              <p className={`text-3xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                ₹{summary.totalPendingAmount?.toLocaleString() || 0}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-red-400/70' : 'text-red-500'}`}>
                {summary.pendingCount} pending bill{summary.pendingCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <AlertCircle className="text-red-500" size={28} />
            </div>
          </div>
        </div>
      )}

      {/* Pending List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} size={32} />
        </div>
      ) : pendingReceipts.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" />
          <p className="font-medium">No pending payments</p>
          <p className="text-sm opacity-75 mt-1">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className={`p-4 rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-dark-card border-dark-border hover:border-slate-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Top Row: Merchant & Amount */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <Store size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {receipt.merchant || receipt.merchantSnapshot?.shopName || "Merchant"}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Calendar size={12} />
                      {formatTimeAgo(receipt.transactionDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    ₹{receipt.pendingAmount?.toLocaleString() || receipt.amount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Items Summary */}
              <div className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {receipt.items?.slice(0, 2).map((item, idx) => (
                  <span key={idx}>
                    {item.name} x{item.qty}{idx < Math.min(receipt.items.length, 2) - 1 ? ', ' : ''}
                  </span>
                ))}
                {receipt.items?.length > 2 && (
                  <span className="opacity-75"> +{receipt.items.length - 2} more</span>
                )}
              </div>

              {/* Pay Now Button */}
              <button
                onClick={() => setSelectedReceipt(receipt)}
                disabled={actionLoading[receipt.id]}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  isDark 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {actionLoading[receipt.id] ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <IndianRupee size={16} />
                    Pay Now
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pay Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <IndianRupee className="text-emerald-500" size={32} />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Pay ₹{selectedReceipt.pendingAmount || selectedReceipt.amount}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                to {selectedReceipt.merchant || selectedReceipt.merchantSnapshot?.shopName || "Merchant"}
              </p>
            </div>

            <p className={`text-xs text-center mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              How are you paying?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handlePayBill(selectedReceipt.id, "upi")}
                disabled={actionLoading[selectedReceipt.id]}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isDark 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {actionLoading[selectedReceipt.id] ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "📱 UPI / Online"
                )}
              </button>
              <button
                onClick={() => handlePayBill(selectedReceipt.id, "cash")}
                disabled={actionLoading[selectedReceipt.id]}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isDark 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`w-full py-3 rounded-xl font-semibold ${isDark ? 'text-slate-400 hover:bg-dark-surface' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
            </div>

            <p className={`text-[10px] text-center mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              💡 After paying, the merchant will confirm and update your bill
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadData}
        disabled={loading}
        className={`fixed bottom-20 right-4 md:bottom-6 p-3 rounded-full shadow-lg transition-all ${
          isDark 
            ? 'bg-dark-card border border-dark-border text-slate-300 hover:bg-dark-surface' 
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default CustomerPending;
