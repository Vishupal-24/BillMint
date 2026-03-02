import React, { useState, useEffect, useCallback } from "react";
import { 
  Wallet, 
  Clock, 
  Bell, 
  CheckCircle, 
  User, 
  Phone, 
  IndianRupee,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Send,
  Loader2,
  XCircle,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { 
  fetchMerchantPendingReceipts, 
  fetchMerchantPendingSummary,
  sendPaymentReminder,
  markPendingAsPaid 
} from "../../services/api";
import { formatISTDisplay } from "../../utils/timezone";

const MerchantKhata = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // State
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [summary, setSummary] = useState({ totalPendingAmount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [receiptsRes, summaryRes] = await Promise.all([
        fetchMerchantPendingReceipts(),
        fetchMerchantPendingSummary()
      ]);
      setPendingReceipts(receiptsRes.data.receipts || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load khata data:", error);
      toast.error("Failed to load pending bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Send reminder
  const handleSendReminder = async (receiptId) => {
    try {
      setActionLoading(prev => ({ ...prev, [receiptId]: "reminder" }));
      await sendPaymentReminder(receiptId);
      toast.success("Reminder sent successfully!");
      loadData(); // Refresh to update lastReminderSentAt
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reminder";
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [receiptId]: null }));
    }
  };

  // Mark as paid
  const handleMarkPaid = async (receiptId, method = "cash") => {
    try {
      setActionLoading(prev => ({ ...prev, [receiptId]: "paid" }));
      await markPendingAsPaid(receiptId, method);
      toast.success("Marked as paid!");
      loadData(); // Refresh list
      setSelectedReceipt(null);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to mark as paid";
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [receiptId]: null }));
    }
  };

  // Filter receipts
  const filteredReceipts = pendingReceipts.filter(receipt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.customerName?.toLowerCase().includes(query) ||
      receipt.customerPhone?.includes(query) ||
      receipt.id?.toLowerCase().includes(query)
    );
  });

  // Check if reminder can be sent (24h cooldown)
  const canSendReminder = (lastReminderSentAt) => {
    if (!lastReminderSentAt) return true;
    const hoursSinceLastReminder = (Date.now() - new Date(lastReminderSentAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastReminder >= 24;
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
          📒 Khata (Pending Dues)
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
          Track and collect pending payments from customers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Pending */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <IndianRupee className="text-red-500" size={18} />
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Total Pending
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            ₹{summary.totalPendingAmount?.toLocaleString() || 0}
          </p>
        </div>

        {/* Pending Count */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Clock className="text-amber-500" size={18} />
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Pending Bills
            </span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {summary.pendingCount || 0}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className={`relative rounded-xl ${isDark ? 'bg-dark-card' : 'bg-white'} border ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
          />
        </div>
      </div>

      {/* Pending List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} size={32} />
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Wallet size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No pending dues</p>
          <p className="text-sm opacity-75 mt-1">All bills are cleared! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className={`p-4 rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-dark-card border-dark-border hover:border-slate-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Top Row: Customer Info & Amount */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <User size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {receipt.customerName || "Unknown Customer"}
                    </p>
                    {receipt.customerPhone && (
                      <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Phone size={12} />
                        {receipt.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    ₹{receipt.pendingAmount?.toLocaleString() || receipt.amount?.toLocaleString()}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {formatTimeAgo(receipt.transactionDate)}
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

              {/* Last Reminder Info */}
              {receipt.lastReminderSentAt && (
                <div className={`text-[10px] mb-3 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Bell size={10} />
                  Last reminder: {formatISTDisplay(new Date(receipt.lastReminderSentAt), { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Send Reminder Button */}
                <button
                  onClick={() => handleSendReminder(receipt.id)}
                  disabled={!canSendReminder(receipt.lastReminderSentAt) || actionLoading[receipt.id]}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    canSendReminder(receipt.lastReminderSentAt)
                      ? isDark 
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : isDark
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading[receipt.id] === "reminder" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Bell size={14} />
                      {canSendReminder(receipt.lastReminderSentAt) ? "Send Reminder" : "Wait 24h"}
                    </>
                  )}
                </button>

                {/* Mark Paid Button */}
                <button
                  onClick={() => setSelectedReceipt(receipt)}
                  disabled={actionLoading[receipt.id]}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isDark 
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {actionLoading[receipt.id] === "paid" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Mark Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mark Paid Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <CheckCircle className="text-emerald-500" size={32} />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Mark as Paid
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedReceipt.customerName} - ₹{selectedReceipt.pendingAmount || selectedReceipt.amount}
              </p>
            </div>

            <p className={`text-xs text-center mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              How was the payment received?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleMarkPaid(selectedReceipt.id, "cash")}
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
                onClick={() => handleMarkPaid(selectedReceipt.id, "upi")}
                disabled={actionLoading[selectedReceipt.id]}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isDark 
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                📱 UPI
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`w-full py-3 rounded-xl font-semibold ${isDark ? 'text-slate-400 hover:bg-dark-surface' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
            </div>
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

export default MerchantKhata;
