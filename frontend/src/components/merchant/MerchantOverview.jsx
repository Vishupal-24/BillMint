// import React, { useState, useEffect, useMemo } from 'react';
// import { ArrowUpRight, PlusCircle, ShoppingBag, Clock, X, Receipt, User, TrendingUp, Flame, MapPin, Phone as PhoneIcon } from 'lucide-react';
// import { fetchMerchantReceipts } from '../../services/api';

// const MerchantOverview = ({ onNavigate }) => {

//   // 🟢 STATE
//   const [sales, setSales] = useState([]);
//   const [viewingReceipt, setViewingReceipt] = useState(null); // 👈 Track clicked bill

//   // Load from backend with local fallback
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         // Handle paginated response structure
//         const receiptsData = data.receipts || data || [];
//         if (mounted) {
//           setSales(receiptsData);
//           localStorage.setItem('merchantSales', JSON.stringify(receiptsData));
//         }
//       } catch (error) {
//         const saved = localStorage.getItem('merchantSales');
//         if (mounted && saved) setSales(JSON.parse(saved));
//       }
//     };
//     load();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // 3️⃣ Filter Logic
//   const todayStr = new Date().toISOString().split('T')[0];
//   const todaysBills = sales.filter(bill => bill.date === todayStr);
//   const totalSales = todaysBills.reduce((sum, bill) => sum + (bill.total ?? bill.amount ?? 0), 0);
//   const billCount = todaysBills.length;

//   // 🔥 Calculate REAL Trending Items from sales data
//   const trendingItems = useMemo(() => {
//     // Get items from all sales (not just today - last 7 days for better trends)
//     const allItems = {};
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

//     sales.forEach(bill => {
//       // Only include recent sales
//       if (bill.date >= sevenDaysAgoStr && bill.items) {
//         bill.items.forEach(item => {
//           const name = item.name || item.n || 'Unknown Item';
//           const qty = item.qty || item.quantity || item.q || 1;
//           const price = item.price || item.unitPrice || item.p || 0;

//           if (!allItems[name]) {
//             allItems[name] = { name, count: 0, revenue: 0 };
//           }
//           allItems[name].count += qty;
//           allItems[name].revenue += price * qty;
//         });
//       }
//     });

//     // Convert to array and sort by count
//     const sortedItems = Object.values(allItems)
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 5);

//     // Calculate percentage based on top seller
//     const maxCount = sortedItems[0]?.count || 1;
//     return sortedItems.map((item, index) => ({
//       ...item,
//       percentage: Math.round((item.count / maxCount) * 100),
//       color: ['bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'][index % 5]
//     }));
//   }, [sales]);

//   return (
//     <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-20">
//       {/* Header */}
//       <div className="flex justify-between items-end">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-800">Good Morning!</h2>
//           <p className="text-slate-500 text-sm">Here is what's happening today.</p>
//         </div>
//         <div className="text-right hidden md:block">
//           <p className="text-xs font-bold text-slate-400 uppercase">Current Date</p>
//           <p className="text-slate-800 font-medium">
//             {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//           </p>
//         </div>
//       </div>

//       {/* Metric Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Sales */}
//         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
//             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
//             <div>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">Today's Sales</p>
//               <h3 className="text-4xl font-bold text-slate-800 mt-2 relative z-10">₹{totalSales}</h3>
//             </div>
//             <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold relative z-10">
//               <ArrowUpRight size={16} /> <span>Live Updates</span>
//             </div>
//         </div>

//         {/* Count */}
//         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
//             <div>
//               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bills Generated</p>
//               <h3 className="text-4xl font-bold text-slate-800 mt-2">{billCount}</h3>
//             </div>
//             <p className="text-slate-400 text-xs">Avg bill value: ₹{billCount > 0 ? Math.round(totalSales/billCount) : 0}</p>
//         </div>

//         {/* Action */}
//         <button
//           onClick={() => onNavigate('billing')}
//           className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex flex-col justify-center items-center gap-3 h-40 active:scale-95"
//         >
//           <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
//             <PlusCircle size={24} />
//           </div>
//           <span className="font-bold text-lg">Create New Bill</span>
//         </button>
//       </div>

//       {/* Recent Activity & Trending */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Activity Feed */}
//         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
//           <h3 className="font-bold text-slate-800 mb-6">Recent Transactions (Today)</h3>
//           <div className="space-y-4">
//             {todaysBills.length === 0 ? <p className="text-slate-400 text-center py-8">No sales yet today.</p> :
//               todaysBills.slice(0, 5).map((bill, index) => (
//                 <div
//                     key={index}
//                     onClick={() => setViewingReceipt(bill)} // 👈 OPEN MODAL ON CLICK
//                     className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0 cursor-pointer active:scale-95 group"
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
//                       {bill.customerName ? <User size={18} /> : <ShoppingBag size={18} />}
//                     </div>
//                     <div>
//                       <p className="font-bold text-slate-700 text-sm group-hover:text-emerald-700 transition-colors">
//                         {bill.customerName || 'Walk-in Customer'}
//                       </p>
//                       <p className="text-xs text-slate-400 flex items-center gap-1">
//                         <Clock size={10} /> {bill.time}
//                         {bill.items?.length > 0 && (
//                           <span className="ml-1">• {bill.items.length} item{bill.items.length > 1 ? 's' : ''}</span>
//                         )}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <span className="font-bold text-slate-800">₹{bill.total ?? bill.amount}</span>
//                     <p className="text-[10px] text-slate-400 capitalize">{bill.paymentMethod || 'cash'}</p>
//                   </div>
//                 </div>
//               ))
//             }
//           </div>
//         </div>

//         {/* Trending Items (Real Data) */}
//         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="font-bold text-slate-800">Trending Items</h3>
//               <div className="flex items-center gap-1 text-orange-500">
//                 <Flame size={16} />
//                 <span className="text-xs font-bold">This Week</span>
//               </div>
//             </div>
//             <div className="space-y-5">
//                {trendingItems.length === 0 ? (
//                  <p className="text-slate-400 text-center py-4 text-sm">No sales data yet</p>
//                ) : (
//                  trendingItems.map((item, i) => (
//                    <div key={i}>
//                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
//                        <span className="flex items-center gap-2">
//                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
//                          {item.name}
//                        </span>
//                        <span className="text-slate-500">{item.count} sold • ₹{item.revenue}</span>
//                      </div>
//                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
//                        <div
//                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
//                          style={{ width: `${item.percentage}%` }}
//                        />
//                      </div>
//                    </div>
//                  ))
//                )}
//             </div>
//         </div>
//       </div>

//       {/* 🧾 RECEIPT DETAIL MODAL */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-[popIn_0.2s_ease-out]">

//             {/* Header with Brand Color */}
//             <div
//               className="text-white p-4 flex justify-between items-center relative overflow-hidden"
//               style={{
//                 background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)`
//               }}
//             >
//               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
//               <div className="flex items-center gap-3 relative z-10">
//                 {viewingReceipt.merchantSnapshot?.logoUrl ? (
//                   <div className="w-10 h-10 bg-white rounded-lg p-1 shadow">
//                     <img
//                       src={viewingReceipt.merchantSnapshot.logoUrl}
//                       alt="Logo"
//                       className="w-full h-full object-contain"
//                       onError={(e) => e.target.parentElement.style.display = 'none'}
//                     />
//                   </div>
//                 ) : (
//                   <div className="p-2 bg-white/20 rounded-lg">
//                     <Receipt size={16}/>
//                   </div>
//                 )}
//                 <span className="text-sm font-bold">Receipt Detail</span>
//               </div>
//               <button onClick={() => setViewingReceipt(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={16}/></button>
//             </div>

//             {/* Content */}
//             <div className="p-6 max-h-[70vh] overflow-y-auto bg-white m-4 rounded-xl shadow-sm border border-slate-200 relative">
//                {/* Brand Color Accent */}
//                <div
//                  className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
//                  style={{ backgroundColor: viewingReceipt.merchantSnapshot?.brandColor || '#10b981' }}
//                />

//                <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
//                   {/* Header Text */}
//                   {viewingReceipt.merchantSnapshot?.receiptHeader && (
//                     <p
//                       className="text-[10px] font-bold uppercase tracking-wide mb-1"
//                       style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#10b981' }}
//                     >
//                       {viewingReceipt.merchantSnapshot.receiptHeader}
//                     </p>
//                   )}
//                   <h2
//                     className="text-xl font-bold"
//                     style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#1e293b' }}
//                   >
//                     {viewingReceipt.merchant}
//                   </h2>

//                   {/* Merchant Info */}
//                   {(viewingReceipt.merchantSnapshot?.address || viewingReceipt.merchantSnapshot?.phone) && (
//                     <div className="mt-2 space-y-1">
//                       {viewingReceipt.merchantSnapshot?.address && (
//                         <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
//                           <MapPin size={10} /> {viewingReceipt.merchantSnapshot.address}
//                         </p>
//                       )}
//                       {viewingReceipt.merchantSnapshot?.phone && (
//                         <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
//                           <PhoneIcon size={10} /> {viewingReceipt.merchantSnapshot.phone}
//                         </p>
//                       )}
//                     </div>
//                   )}

//                   <p className="text-xs text-slate-400 mt-2">{viewingReceipt.date} at {viewingReceipt.time}</p>
//                   {viewingReceipt.customerName && (
//                     <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
//                       <User size={14} />
//                       <span className="text-sm font-semibold">{viewingReceipt.customerName}</span>
//                     </div>
//                   )}
//                   {!viewingReceipt.customerName && (
//                     <p className="text-xs text-slate-400 mt-2">Walk-in Customer</p>
//                   )}
//                </div>

//                {/* Items List */}
//                <div className="space-y-3 mb-4">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm">
//                      {/* Handle short keys (n, q, p) or full keys (name, qty, price) */}
//                      <span className="text-slate-600">
//                         {(item.q || item.qty || item.quantity || 1)} x {item.n || item.name}
//                      </span>
//                      <span className="font-bold text-slate-800">
//                         ₹{(item.p || item.price || item.unitPrice) * (item.q || item.qty || item.quantity || 1)}
//                      </span>
//                    </div>
//                  ))}
//                </div>

//                <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center mb-4">
//                  <span className="font-bold text-slate-500">TOTAL RECEIVED</span>
//                  <span
//                    className="text-2xl font-bold"
//                    style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#1e293b' }}
//                  >
//                    ₹{viewingReceipt.total ?? viewingReceipt.amount}
//                  </span>
//                </div>

//                {/* Footer Message */}
//                {viewingReceipt.merchantSnapshot?.receiptFooter && (
//                  <div
//                    className="text-center py-2 px-3 rounded-lg border border-dashed mb-4"
//                    style={{
//                      borderColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}40`,
//                      backgroundColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}08`
//                    }}
//                  >
//                    <p className="text-xs italic text-slate-500">
//                      "{viewingReceipt.merchantSnapshot.receiptFooter}"
//                    </p>
//                  </div>
//                )}

//                <div className="text-center">
//                  <p
//                    className="text-[10px] font-bold uppercase inline-block px-3 py-1 rounded-full"
//                    style={{
//                      backgroundColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}15`,
//                      color: viewingReceipt.merchantSnapshot?.brandColor || '#10b981'
//                    }}
//                  >
//                    Paid via {viewingReceipt.paymentMethod === 'upi' ? 'UPI' : viewingReceipt.paymentMethod === 'cash' ? 'Cash' : viewingReceipt.paymentMethod || 'Cash'}
//                  </p>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantOverview;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag,
  Clock,
  X,
  User,
  Flame,
  Smartphone,
  Banknote,
  Wallet,
  Trash2,
  CheckCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  Loader2,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchMerchantReceipts, deleteReceipt as deleteReceiptApi, fetchMerchantPendingSummary, fetchMerchantPendingReceipts, sendPaymentReminder, markPendingAsPaid } from "../../services/api";
import { getNowIST, formatISTDate, formatISTDateDisplay } from "../../utils/timezone";
import { useTheme } from "../../contexts/ThemeContext";
import { createPortal } from 'react-dom';

const MerchantOverview = () => {
  // 👈 Removed unused 'onNavigate' prop
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // 👇 2. Initialize Hook
  const navigate = useNavigate();

  // 🟢 STATE
  const [sales, setSales] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingSummary, setPendingSummary] = useState({ totalPendingAmount: 0, pendingCount: 0 });
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [pendingActionLoading, setPendingActionLoading] = useState({});
  const [showPendingSection, setShowPendingSection] = useState(false);

  const hasPendingDues = (pendingSummary?.pendingCount ?? 0) > 0 || pendingReceipts.length > 0 || (Number(pendingSummary?.totalPendingAmount ?? 0) > 0);

  const pendingCountDisplay = useMemo(() => {
    const summaryCount = Number(pendingSummary?.pendingCount ?? 0);
    return summaryCount > 0 ? summaryCount : pendingReceipts.length;
  }, [pendingSummary?.pendingCount, pendingReceipts.length]);

  const pendingTotalDisplay = useMemo(() => {
    const summaryTotal = Number(pendingSummary?.totalPendingAmount ?? 0);
    if (summaryTotal > 0) return summaryTotal;
    return pendingReceipts.reduce(
      (sum, r) => sum + Number(r.pendingAmount ?? r.amount ?? 0),
      0
    );
  }, [pendingSummary?.totalPendingAmount, pendingReceipts]);

  // Centralized loader with retry + fallback
  const loadReceipts = useCallback(async () => {
    try {
      const [receiptsRes, pendingRes, pendingListRes] = await Promise.allSettled([
        fetchMerchantReceipts(),
        fetchMerchantPendingSummary(),
        fetchMerchantPendingReceipts()
      ]);
      
      if (receiptsRes.status === 'fulfilled') {
        const receiptsData = receiptsRes.value.data.receipts || receiptsRes.value.data || [];
        setSales(receiptsData);
        localStorage.setItem("merchantSales", JSON.stringify(receiptsData));
      } else {
        const saved = localStorage.getItem("merchantSales");
        if (saved) {
          try {
            setSales(JSON.parse(saved));
          } catch (e) {
            // Ignore corrupt cache
          }
        }
      }
      
      if (pendingRes.status === 'fulfilled') {
        setPendingSummary(pendingRes.value.data || { totalPendingAmount: 0, pendingCount: 0 });
      }
      
      if (pendingListRes.status === 'fulfilled') {
        setPendingReceipts(pendingListRes.value.data.receipts || []);
      }
    } catch (error) {
      const saved = localStorage.getItem("merchantSales");
      if (saved) {
        try {
          setSales(JSON.parse(saved));
        } catch (e) {
          // Ignore corrupt cache
        }
      }
    }
  }, []);

  // Handle send reminder
  const handleSendReminder = async (receiptId) => {
    try {
      setPendingActionLoading(prev => ({ ...prev, [receiptId]: "reminder" }));
      await sendPaymentReminder(receiptId);
      toast.success("Reminder sent!");
      loadReceipts();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send reminder";
      toast.error(message);
    } finally {
      setPendingActionLoading(prev => ({ ...prev, [receiptId]: null }));
    }
  };

  // Handle mark as paid
  const handleMarkPendingPaid = async (receiptId, method = "cash") => {
    try {
      setPendingActionLoading(prev => ({ ...prev, [receiptId]: "paid" }));
      await markPendingAsPaid(receiptId, method);
      toast.success("Marked as paid!");
      loadReceipts();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to mark as paid";
      toast.error(message);
    } finally {
      setPendingActionLoading(prev => ({ ...prev, [receiptId]: null }));
    }
  };

  // Check reminder cooldown
  const canSendReminder = (lastReminderSentAt) => {
    if (!lastReminderSentAt) return true;
    const hoursSinceLastReminder = (Date.now() - new Date(lastReminderSentAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastReminder >= 24;
  };

  // Initial load + live refresh (visibility + custom events + interval)
  useEffect(() => {
    let mounted = true;
    const tick = async () => mounted && loadReceipts();
    tick();

    const handleVisibility = () => {
      if (!document.hidden) tick();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("merchant-receipts-updated", tick);

    const intervalId = setInterval(tick, 30000); // 30s soft refresh for production readiness

    return () => {
      mounted = false;
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("merchant-receipts-updated", tick);
      clearInterval(intervalId);
    };
  }, [loadReceipts]);

  const handleDeleteReceipt = async () => {
    if (!viewingReceipt) return;
    const confirmed = window.confirm("Delete this bill? This cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteReceiptApi(viewingReceipt.id || viewingReceipt._id);
      const updated = sales.filter(
        (r) => (r.id || r._id) !== (viewingReceipt.id || viewingReceipt._id)
      );
      setSales(updated);
      localStorage.setItem("merchantSales", JSON.stringify(updated));
      setViewingReceipt(null);
    } catch (error) {
      console.error("Delete receipt failed", error);
      alert("Failed to delete bill. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers to avoid crashes on bad data
  const toValidDate = (input) => {
    if (!input) return null;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const toDateString = (input) => {
    const d = toValidDate(input);
    return d ? d.toISOString().split("T")[0] : null;
  };

  // Filter Logic
  // Use IST date for "Today" comparison to match backend
  const todayStr = formatISTDate(getNowIST());
  
  const todaysBills = sales.filter(
    (bill) => bill.date === todayStr
  );
  
  const totalSales = todaysBills.reduce(
    (sum, bill) => sum + (bill.total ?? bill.amount ?? 0),
    0
  );
  const billCount = todaysBills.length;

  // --- 📊 NEW LOGIC FOR DASHBOARD CARD ---

  // 1. Current Month Logic (IST)
  const [currentYearStr, currentMonthStr] = todayStr.split("-");
  const monthPrefix = `${currentYearStr}-${currentMonthStr}`;
  const yearPrefix = `${currentYearStr}-`;

  const monthBills = sales.filter((bill) => {
    const d = typeof bill.date === "string" ? bill.date : toDateString(bill.date);
    return d ? d.startsWith(monthPrefix) : false;
  });

  const monthSales = monthBills.reduce(
    (sum, bill) => sum + (bill.total ?? bill.amount ?? 0),
    0
  );

  // 2. Split UPI vs Cash
  const upiSales = monthBills
    .filter(
      (b) =>
        (b.paymentMethod || "").toLowerCase().includes("upi") ||
        (b.paymentMethod || "").toLowerCase().includes("online")
    )
    .reduce((sum, b) => sum + (b.total ?? b.amount ?? 0), 0);

  const cashSales = monthBills
    .filter((b) => (b.paymentMethod || "").toLowerCase().includes("cash"))
    .reduce((sum, b) => sum + (b.total ?? b.amount ?? 0), 0);

  // 3. Yearly Logic (IST)
  const yearSales = sales
    .filter((b) => {
      const d = typeof b.date === "string" ? b.date : toDateString(b.date);
      return d ? d.startsWith(yearPrefix) : false;
    })
    .reduce((sum, b) => sum + (b.total ?? b.amount ?? 0), 0);

  // ----------------------------------------

  // ... existing month logic ...

  // 📊 NEW: Weekly Logic (Current Week, Monday start, IST)
  const istWeekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date());
  const istDayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[istWeekdayShort] ?? 0;
  const daysSinceMonday = istDayIndex === 0 ? 6 : istDayIndex - 1;
  const weekStartInstant = new Date(Date.now() - daysSinceMonday * 86400000);
  const weekStartStr = formatISTDate(weekStartInstant);

  const weekBills = sales.filter((bill) => {
    const billDateStr = typeof bill.date === "string" ? bill.date : toDateString(bill.date);
    if (!billDateStr) return false;
    return billDateStr >= weekStartStr && billDateStr <= todayStr;
  });

  const weekSales = weekBills.reduce(
    (sum, bill) => sum + (bill.total ?? bill.amount ?? 0),
    0
  );

  // Trending Items Logic - Using IST for 7-day window
  const trendingItems = useMemo(() => {
    const allItems = {};
    const sevenDaysAgoStr = formatISTDate(new Date(Date.now() - 7 * 86400000));

    sales.forEach((bill) => {
      if (bill.date >= sevenDaysAgoStr && bill.items) {
        bill.items.forEach((item) => {
          const name = item.name || item.n || "Unknown Item";
          const qty = item.qty || item.quantity || item.q || 1;
          const price = item.price || item.unitPrice || item.p || 0;

          if (!allItems[name]) {
            allItems[name] = { name, count: 0, revenue: 0 };
          }
          allItems[name].count += qty;
          allItems[name].revenue += price * qty;
        });
      }
    });

    const sortedItems = Object.values(allItems)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxCount = sortedItems[0]?.count || 1;
    return sortedItems.map((item, index) => ({
      ...item,
      percentage: Math.round((item.count / maxCount) * 100),
      color: [
        "bg-emerald-500",
        "bg-blue-500",
        "bg-orange-500",
        "bg-purple-500",
        "bg-pink-500",
      ][index % 5],
    }));
  }, [sales]);

  const getGreeting = () => {
    // Get the current hour in India (0-23)
    const hour = parseInt(
      new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      })
    );

    if (hour < 12) return t('merchant.goodMorning');
    if (hour < 17) return t('merchant.goodAfternoon') || 'Good Afternoon'; // Until 5 PM
    return t('merchant.goodEvening') || 'Good Evening';
  };

  const currentDateIST = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-20">
      {/* NEW TOP BAR */}
      {/* NEW TOP BAR */}
      <div className={`flex md:hidden items-center justify-between py-2 mb-4 border-b ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
        {/* 1. Invisible Spacer (Adjusted width to match new button size) */}
        <div className="w-9"></div>

        {/* 2. Center Title (Reduced text size slightly for proportion) */}
        <h1 className="text-lg font-extrabold tracking-tight">
          <span className="text-emerald-600">Green</span>
          <span className={isDark ? 'text-white' : 'text-slate-800'}>Receipt</span>
        </h1>

        {/* 3. Right Profile Button (Smaller: w-9 h-9) */}
        <button
          onClick={() => navigate("/merchant/profile")}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 ${isDark ? 'bg-dark-card hover:bg-dark-surface text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          aria-label="Profile"
        >
          {/* Increased strokeWidth makes the icon look sharper and less 'wireframe-like' */}
          <User size={18} strokeWidth={2.5} />
        </button>
      </div>
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {getGreeting()}!
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('merchant.todayUpdate')}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('time.today')}</p>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {formatISTDateDisplay(getNowIST())}
          </p>
        </div>
      </div>

      {/* Metric Cards */}

      {/* MERCHANT DASHBOARD CARD (Customer Style) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-emerald-500/10 rounded-full -ml-16 md:-ml-24 -mb-16 md:-mb-24 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            {/* Left Side: Main Stat (TODAY) */}
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="px-2 md:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  {t('time.today')}
                </span>
                {/* Optional: You can add percentage change here if you calculate yesterday's sales */}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                ₹{totalSales.toLocaleString("en-IN")}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1.5 md:mt-2">
                {t('dashboard.receiptsCount', { count: todaysBills.length })} {t('time.today').toLowerCase()}
              </p>
            </div>

            {/* Right Side: Quick Stats - UPI & Cash */}
            <div className="flex flex-row md:flex-col gap-2 md:gap-3">
              {/* UPI */}
              <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-xl">
                <div className="flex items-center gap-1.5 md:gap-2 text-emerald-400 mb-0.5 md:mb-1">
                  <Smartphone size={12} className="md:w-[14px] md:h-[14px]" />
                  <span className="text-[10px] md:text-xs font-medium">
                    {t('dashboard.upi')}
                  </span>
                </div>
                <p className="text-base md:text-xl font-bold">
                  ₹{upiSales.toLocaleString("en-IN")}
                </p>
              </div>
              {/* Cash */}
              <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-xl">
                <div className="flex items-center gap-1.5 md:gap-2 text-amber-400 mb-0.5 md:mb-1">
                  <Banknote size={12} className="md:w-[14px] md:h-[14px]" />
                  <span className="text-[10px] md:text-xs font-medium">
                    {t('dashboard.cash')}
                  </span>
                </div>
                <p className="text-base md:text-xl font-bold">
                  ₹{cashSales.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Period Summary */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
            <div>
              <p className="text-slate-400 text-[10px] md:text-xs font-medium">
                {t('dashboard.thisMonth')}
              </p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1">
                ₹{monthSales.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] md:text-xs font-medium">
                {t('merchant.billsGenerated')}
              </p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1">
                {monthBills.length}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] md:text-xs font-medium">
                {t('dashboard.thisWeek')}
              </p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1">
                ₹{weekSales.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <Wallet
          className="absolute -right-4 md:-right-6 -bottom-4 md:-bottom-6 text-white/5"
          size={80}
        />
      </div>

      {/* Pending Dues (Khata) Section */}
      {hasPendingDues && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'
        }`}>
          {/* Header - Clickable to expand */}
          <div 
            onClick={() => setShowPendingSection(!showPendingSection)}
            className={`p-4 cursor-pointer transition-all ${
              isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 md:p-2.5 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <Wallet size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    📒 Pending Dues (Khata)
                  </h3>
                  <p className={`text-[10px] md:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {pendingCountDisplay} bill{pendingCountDisplay !== 1 ? 's' : ''} to collect
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-lg md:text-xl font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    ₹{pendingTotalDisplay?.toLocaleString('en-IN')}
                  </p>
                </div>
                {showPendingSection ? (
                  <ChevronUp size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                ) : (
                  <ChevronDown size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                )}
              </div>
            </div>
          </div>

          {/* Expandable Pending List */}
          {showPendingSection && (
            <div className={`border-t ${isDark ? 'border-dark-border' : 'border-slate-100'}`}>
              {pendingReceipts.length === 0 ? (
                <p className={`text-center py-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No pending dues
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-[300px] overflow-y-auto">
                  {pendingReceipts.map((receipt) => (
                    <div key={receipt.id} className={`p-3 md:p-4 ${isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-50'}`}>
                      {/* Customer Info & Amount */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <User size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {receipt.customerName || "Customer"}
                            </p>
                            {receipt.customerPhone && (
                              <p className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Phone size={10} /> {receipt.customerPhone}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          ₹{receipt.pendingAmount?.toLocaleString() || receipt.amount?.toLocaleString()}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSendReminder(receipt.id)}
                          disabled={!canSendReminder(receipt.lastReminderSentAt) || pendingActionLoading[receipt.id]}
                          className={`flex-1 py-2 px-2 rounded-lg text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            canSendReminder(receipt.lastReminderSentAt)
                              ? isDark 
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : isDark
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {pendingActionLoading[receipt.id] === "reminder" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <Bell size={12} />
                              {canSendReminder(receipt.lastReminderSentAt) ? "Remind" : "24h"}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleMarkPendingPaid(receipt.id, "cash")}
                          disabled={pendingActionLoading[receipt.id]}
                          className={`flex-1 py-2 px-2 rounded-lg text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            isDark 
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {pendingActionLoading[receipt.id] === "paid" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              Paid
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className={`lg:col-span-2 rounded-2xl border shadow-sm p-6 ${isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'}`}>
          <h3 className={`font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t('merchant.recentTransactions')}
          </h3>
          <div className="space-y-4">
            {todaysBills.length === 0 ? (
              <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('merchant.noSalesYet')}
              </p>
            ) : (
              todaysBills.slice(0, 5).map((bill, index) => {
                const method = (bill.paymentMethod || '').toLowerCase();
                const pendingAmount = Number(bill.pendingAmount ?? 0);
                const isPendingBill = bill.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;
                const methodLabel = isPendingBill ? 'pending' : (bill.paymentMethod || 'cash');

                return (
                  <div
                    key={index}
                    onClick={() => setViewingReceipt(bill)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors border-b last:border-0 cursor-pointer active:scale-95 group ${isDark ? 'hover:bg-dark-surface border-dark-border' : 'hover:bg-slate-50 border-slate-50'}`}
                  >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-dark-surface text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                      {bill.customerName ? (
                        <User size={18} />
                      ) : (
                        <ShoppingBag size={18} />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-sm transition-colors ${isDark ? 'text-slate-200 group-hover:text-emerald-400' : 'text-slate-700 group-hover:text-emerald-700'}`}>
                        {bill.customerName || t('merchant.walkInCustomer')}
                      </p>
                      <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Clock size={10} /> {bill.time}
                        {bill.items?.length > 0 && (
                          <span className="ml-1">
                            • {bill.items.length} {bill.items.length > 1 ? t('merchant.items') : t('merchant.item')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      ₹{bill.total ?? bill.amount}
                    </span>
                    <p className={`text-[10px] capitalize ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {methodLabel}
                    </p>
                    {/* {Number(bill.discount || 0) > 0 && (
                      <p className={`text-[10px] font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        Saved ₹{bill.discount}
                      </p>
                    )} */}
                  </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Trending Items */}
        <div className={`rounded-2xl border shadow-sm p-6 ${isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('merchant.trendingItems')}</h3>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={16} />
              <span className="text-xs font-bold">{t('merchant.thisWeek')}</span>
            </div>
          </div>
          <div className="space-y-5">
            {trendingItems.length === 0 ? (
              <p className={`text-center py-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('merchant.noSalesData')}
              </p>
            ) : (
              trendingItems.map((item, i) => (
                <div key={i}>
                  <div className={`flex justify-between text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-dark-surface' : 'bg-slate-100'}`}>
                        {i + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      {item.count} {t('merchant.sold')} • ₹{item.revenue}
                    </span>
                  </div>
                  <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-dark-surface' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========== MERCHANT RECEIPT DETAIL MODAL ========== */}
      {viewingReceipt && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          {/* BACKDROP CLICK TO CLOSE */}
          <div className="absolute inset-0" onClick={() => setViewingReceipt(null)}></div>

          {/* MODAL CARD */}
          <div 
            className={`w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] mb-20 md:mb-0 overflow-hidden animate-scale-up transition-all ${isDark ? 'bg-dark-card ring-1 ring-white/10' : 'bg-white'}`}
          >
            
            {/* 1. BRANDED HEADER */}
            <div 
              className="p-5 flex justify-between items-center shrink-0 relative overflow-hidden text-white"
              style={{
                background: `linear-gradient(135deg, ${
                  viewingReceipt.merchantSnapshot?.brandColor || "#10b981"
                } 0%, ${
                  viewingReceipt.merchantSnapshot?.brandColor || "#10b981"
                }dd 100%)`,
              }}
            >
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

              <div className="relative z-10">
                <h3 className="font-bold text-lg leading-tight">Receipt Details</h3>
                <p className="text-xs opacity-90 font-medium mt-0.5">
                  #{viewingReceipt.id?.slice(-6).toUpperCase() || 'UNKNOWN'} • {new Date(viewingReceipt.date || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setViewingReceipt(null)}
                className="relative z-10 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. SCROLLABLE BILL CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 dark:bg-black/20">
              
              {/* THE "PAPER" RECEIPT */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'}`}>
                
                {/* Merchant Name */}
                <div className="p-4 border-b border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {viewingReceipt.merchant}
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Official Receipt
                    </p>
                </div>

                {/* Items Header */}
                <div className={`px-4 py-2 border-b flex justify-between text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-white/5 border-dark-border text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <span>Item</span>
                    <span>Total</span>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                    {viewingReceipt.items && viewingReceipt.items.map((item, i) => {
                        // Normalize Data Keys (handle qty/q/quantity and price/p/unitPrice)
                        const qty = item.qty || item.quantity || item.q || 1;
                        const price = item.price || item.unitPrice || item.p || 0;
                        const name = item.name || item.n || "Item";
                        
                        return (
                            <div key={i} className="flex justify-between items-start text-sm group">
                                <div className="flex gap-3">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mt-0.5 ${isDark ? 'bg-dark-card text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                        {qty}
                                    </div>
                                    <span className={`font-medium leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {name}
                                    </span>
                                </div>
                                <span className={`font-bold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    ₹{price * qty}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Totals Section (Dashed Separator) */}
                <div className={`border-t border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'}`}></div>

                <div className={`p-4 ${isDark ? 'bg-black/10' : 'bg-slate-50/50'}`}>
                    {/* Subtotal & Discount Logic */}
                    {(Number(viewingReceipt.discount || 0) > 0 || viewingReceipt.subtotal) && (
                        <div className="space-y-2 mb-3 text-xs">
                            <div className="flex justify-between">
                                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Subtotal</span>
                                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    ₹{viewingReceipt.subtotal || ((viewingReceipt.total ?? viewingReceipt.amount ?? 0) + (Number(viewingReceipt.discount) || 0))}
                                </span>
                            </div>
                            {Number(viewingReceipt.discount) > 0 && (
                                <div className="flex justify-between">
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Discount</span>
                                    <span className="font-bold text-red-500">- ₹{viewingReceipt.discount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between items-end pt-2 border-t border-gray-200 dark:border-gray-700">
                        {(() => {
                          const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                          const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                          const isPendingReceipt = viewingReceipt.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;
                          return (
                            <span className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {isPendingReceipt ? 'Total Due' : 'Total Paid'}
                            </span>
                          );
                        })()}
                        <span className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {(() => {
                                  const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                                  const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                                  const isPendingReceipt = viewingReceipt.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;
                                  return isPendingReceipt
                                    ? (viewingReceipt.pendingAmount ?? viewingReceipt.total ?? viewingReceipt.amount)
                                    : (viewingReceipt.total ?? viewingReceipt.amount);
                                })()}
                        </span>
                    </div>
                </div>

              </div>

              {/* Status Badge */}
              {(() => {
                const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                const isPendingReceipt = viewingReceipt.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;
                const isCompletedReceipt = viewingReceipt.status === 'completed';

                const badgeClass = isPendingReceipt
                  ? (isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600')
                  : (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600');

                const methodLabel = method || 'confirmed';

                return (
                  <div className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border ${badgeClass}`}>
                    {isPendingReceipt ? (
                      <><Clock size={14}/> Payment Pending</>
                    ) : isCompletedReceipt ? (
                      <><CheckCircle size={14}/> Payment Received ({methodLabel})</>
                    ) : (
                      <><CheckCircle size={14}/> Payment Received ({methodLabel})</>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* 3. FOOTER ACTIONS */}
            <div className={`p-4 border-t flex gap-3 shrink-0 ${isDark ? 'border-slate-800 bg-dark-card' : 'border-slate-100 bg-white'}`}>
               <button
                  onClick={handleDeleteReceipt}
                  disabled={isDeleting}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                    isDark 
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                    : 'border-red-100 text-red-600 hover:bg-red-50'
                  } disabled:opacity-50`}
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  {isDeleting ? "Deleting..." : "Delete Record"}
                </button>
                
                <button
                  onClick={() => setViewingReceipt(null)} // Or add a Print/Share function here
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-center transition-all ${
                    isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
            </div>

          </div>

          {/* Animation Styles */}
          <style>{`
            @keyframes scale-up {
              0% { opacity: 0; transform: scale(0.95) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MerchantOverview;
