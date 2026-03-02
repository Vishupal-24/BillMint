import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MOCK_RECEIPTS } from './customerData';
import ReceiptCard from './ReceiptCard';
import { 
  TrendingUp, TrendingDown, Wallet, QrCode, UploadCloud, X, Save,
  Image as ImageIcon, Calendar, PieChart, Store, CheckCircle, Loader2,
  Receipt, Sparkles, ArrowUpRight, ArrowDownRight, Smartphone, Banknote,
  ChevronRight, Clock, Zap, Target, CreditCard, AlertCircle, ChevronDown, ChevronUp, IndianRupee
} from 'lucide-react';
import { fetchCustomerReceipts, createReceipt, fetchCustomerAnalytics, fetchUpcomingBills, fetchCustomerPendingSummary, fetchCustomerPendingReceipts, payPendingBill } from '../../services/api';
import toast from 'react-hot-toast';
import { getTodayIST, formatISTDateDisplay } from '../../utils/timezone';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

// ============== SKELETON LOADER ==============
const HomeSkeleton = ({ isDark }) => (
  <div className="space-y-6 animate-pulse">
    <div className={`h-8 rounded-lg w-48 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    <div className={`h-44 rounded-3xl ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-slate-200 to-slate-300'}`} />
    <div className="grid grid-cols-2 gap-3">
      <div className={`h-24 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-24 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => <div key={i} className={`h-28 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />)}
    </div>
    <div className={`h-6 rounded w-32 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    {[1, 2, 3].map(i => <div key={i} className={`h-20 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />)}
  </div>
);

// ============== STAT CARD ==============
const StatCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = 'emerald', isDark }) => {
  const colorConfig = {
    emerald: { bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50', icon: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-800' : 'border-emerald-100' },
    blue: { bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50', icon: isDark ? 'text-blue-400' : 'text-blue-600', border: isDark ? 'border-blue-800' : 'border-blue-100' },
    purple: { bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50', icon: isDark ? 'text-purple-400' : 'text-purple-600', border: isDark ? 'border-purple-800' : 'border-purple-100' },
    orange: { bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50', icon: isDark ? 'text-orange-400' : 'text-orange-600', border: isDark ? 'border-orange-800' : 'border-orange-100' },
    amber: { bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50', icon: isDark ? 'text-amber-400' : 'text-amber-600', border: isDark ? 'border-amber-800' : 'border-amber-100' },
    slate: { bg: isDark ? 'bg-slate-700' : 'bg-slate-50', icon: isDark ? 'text-slate-300' : 'text-slate-600', border: isDark ? 'border-slate-600' : 'border-slate-100' },
  };
  const config = colorConfig[color] || colorConfig.emerald;

  return (
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${config.bg} ${config.border} border group-hover:scale-105 transition-transform`}>
          <Icon size={16} className={`${config.icon} md:w-[18px] md:h-[18px]`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
            trend === 'up' ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600' : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
      <div className="mt-2 md:mt-3">
        <p className={`text-[9px] md:text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-lg md:text-2xl font-bold mt-0.5 md:mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        {subValue && <p className={`text-[10px] md:text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>}
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
const CustomerHome = ({ onNavigate, onScanTrigger }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  // 🟢 STATE
  const [receipts, setReceipts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [pendingSummary, setPendingSummary] = useState({ totalPendingAmount: 0, pendingCount: 0 });
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [showPendingSection, setShowPendingSection] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState({});
  const [selectedPendingReceipt, setSelectedPendingReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [receiptsRes, analyticsRes, billsRes, pendingRes, pendingListRes] = await Promise.allSettled([
          fetchCustomerReceipts(),
          fetchCustomerAnalytics(),
          fetchUpcomingBills(7), // Next 7 days
          fetchCustomerPendingSummary(),
          fetchCustomerPendingReceipts()
        ]);
        
        if (receiptsRes.status === 'fulfilled') {
          const receiptsData = receiptsRes.value.data.receipts || receiptsRes.value.data || [];
          if (mounted) {
            setReceipts(receiptsData);
            localStorage.setItem('customerReceipts', JSON.stringify(receiptsData));
          }
        } else {
          const cached = localStorage.getItem('customerReceipts');
          const fallback = cached ? JSON.parse(cached) : MOCK_RECEIPTS;
          if (mounted) setReceipts(fallback);
        }
        
        if (analyticsRes.status === 'fulfilled' && mounted) {
          setAnalytics(analyticsRes.value.data);
        }
        
        if (billsRes.status === 'fulfilled' && mounted) {
          setUpcomingBills(billsRes.value.data?.bills || []);
        }
        
        if (pendingRes.status === 'fulfilled' && mounted) {
          setPendingSummary(pendingRes.value.data || { totalPendingAmount: 0, pendingCount: 0 });
        }
        
        if (pendingListRes.status === 'fulfilled' && mounted) {
          setPendingReceipts(pendingListRes.value.data.receipts || []);
        }
      } catch (error) {
        const cached = localStorage.getItem('customerReceipts');
        const fallback = cached ? JSON.parse(cached) : MOCK_RECEIPTS;
        if (mounted) setReceipts(fallback);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    // Listen for receipt updates from scanner or other sources
    const handleReceiptUpdate = () => {
      // Immediately update from localStorage for instant UI feedback
      const saved = localStorage.getItem('customerReceipts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (mounted && Array.isArray(parsed)) {
            setReceipts(parsed);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      // Then also fetch fresh data from backend
      load();
    };
    
    window.addEventListener('customer-receipts-updated', handleReceiptUpdate);
    window.addEventListener('storage', handleReceiptUpdate);

    return () => { 
      mounted = false; 
      window.removeEventListener('customer-receipts-updated', handleReceiptUpdate);
      window.removeEventListener('storage', handleReceiptUpdate);
    };
  }, []);

  useEffect(() => {
    if (receipts?.length) {
      localStorage.setItem('customerReceipts', JSON.stringify(receipts));
    }
  }, [receipts]);
  
  // Computed values
  const totalSpent = useMemo(() => 
    receipts.filter(r => !r.excludeFromStats).reduce((sum, r) => sum + (r.amount || 0), 0),
    [receipts]
  );

  const todaySpent = useMemo(() => {
    const todayStr = getTodayIST();
    return receipts
      .filter(r => !r.excludeFromStats && (r.date || r.transactionDate || '').startsWith(todayStr))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [receipts]);

  const { upiTotal, cashTotal } = useMemo(() => {
    const payments = analytics?.paymentMethods || [];
    const upi = payments.find(p => p.method?.toLowerCase() === 'upi');
    const cash = payments.find(p => p.method?.toLowerCase() === 'cash');
    return { upiTotal: upi?.total || 0, cashTotal: cash?.total || 0 };
  }, [analytics]);
  
  // 📂 UPLOAD STATES
  const [pendingFile, setPendingFile] = useState(null); 
  const [manualAmount, setManualAmount] = useState(""); 
  const [manualMerchant, setManualMerchant] = useState(""); 
  const [manualDate, setManualDate] = useState(getTodayIST()); // IST date
  const [manualPaymentMethod, setManualPaymentMethod] = useState('upi');
  const [includeInStats, setIncludeInStats] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  
  // Loading state
  if (loading) return <HomeSkeleton isDark={isDark} />;

  // Computed values for display
  const summary = analytics?.summary;
  const monthChange = summary?.changes?.monthOverMonth || 0;

  // ——— CRUD ACTIONS ———
  const handleDelete = (id) => {
    if (window.confirm("Delete this receipt?")) {
      setReceipts(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleUpdate = (updatedReceipt) => {
    setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };

  // 📂 FILE PICKER
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Keep uploads reasonably small since we store them as base64 data URLs.
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_BYTES) {
        toast.error(t('upload.imageTooLarge'));
        // Allow re-selecting the same file after an error
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingFile({ url: reader.result, name: file.name, size: file.size, type: file.type });
        setManualAmount(""); 
        setManualMerchant(""); 
        setManualDate(getTodayIST()); // Reset to today IST
        setManualPaymentMethod('upi');
        setIncludeInStats(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 💾 SAVE UPLOAD
  const saveUploadedReceipt = async (e) => {
    e.preventDefault();
    if (!pendingFile || isUploading) return;

    setIsUploading(true);
    try {
      const payload = {
        source: "upload",
        merchantName: manualMerchant || "Unknown Merchant",
        transactionDate: manualDate,
        total: parseFloat(manualAmount) || 0,
        imageUrl: pendingFile.url,
        note: pendingFile.name,
        excludeFromStats: !includeInStats,
        paymentMethod: manualPaymentMethod,
      };

      const { data: newReceipt } = await createReceipt(payload);
      setReceipts([newReceipt, ...receipts]);
      setPendingFile(null);
      setManualAmount("");
      setManualMerchant("");
      setManualDate(getTodayIST()); // Reset to today IST
      setManualPaymentMethod('upi');
      setIncludeInStats(true);
      window.dispatchEvent(new Event("customer-receipts-updated"));
      toast.success(t('receipts.uploadSuccess'));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || error.userMessage || t('receipts.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6 max-w-3xl mx-auto pb-24 md:pb-10">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('dashboard.title')}</h1>
          <p className={`text-xs md:text-sm mt-0.5 md:mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full ${isDark ? 'text-slate-300 bg-slate-700' : 'text-slate-400 bg-slate-100'}`}>
            <Sparkles size={10} className="text-emerald-500 md:w-3 md:h-3" />
            <span>{receipts.length} {t('common.receipts')}</span>
          </div>
        </div>
      </div>

      {/* ========== HERO SPENDING CARD ========== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-emerald-500/10 rounded-full -ml-16 md:-ml-24 -mb-16 md:-mb-24 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="px-2 md:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  {t('dashboard.thisMonth')}
                </span>
                {monthChange !== 0 && (
                  <span className={`flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                    monthChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-400/20 text-emerald-300'
                  }`}>
                    {monthChange >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(monthChange)}%
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                ₹{(summary?.thisMonth?.total || totalSpent).toLocaleString('en-IN')}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1.5 md:mt-2">
                {t('dashboard.receiptsThisMonth', { count: summary?.thisMonth?.count || receipts.length })}
              </p>
            </div>
            
            {/* Quick Stats - UPI & Cash */}
            <div className="flex flex-row md:flex-col gap-2 md:gap-3">
              <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-xl min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 text-emerald-400 mb-0.5 md:mb-1">
                  <Smartphone size={12} className="md:w-[14px] md:h-[14px] shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium truncate">{t('dashboard.upi')}</span>
                </div>
                <p className="text-base md:text-xl font-bold truncate">₹{upiTotal.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-xl min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 text-amber-400 mb-0.5 md:mb-1">
                  <Banknote size={12} className="md:w-[14px] md:h-[14px] shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium truncate">{t('dashboard.cash')}</span>
                </div>
                <p className="text-base md:text-xl font-bold truncate">₹{cashTotal.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Period Summary */}
          <div className="grid grid-cols-3 gap-1 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
            <div className="px-1 overflow-hidden">
              <p className="text-slate-400 text-[10px] md:text-xs font-medium truncate">{t('dashboard.thisWeek')}</p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1 truncate" title={`₹${(summary?.thisWeek?.total || 0).toLocaleString('en-IN')}`}>₹{(summary?.thisWeek?.total || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="px-1 overflow-hidden border-l border-white/5 md:border-none pl-2 md:pl-0">
              <p className="text-slate-400 text-[10px] md:text-xs font-medium truncate">{t('dashboard.lastMonth')}</p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1 truncate" title={`₹${(summary?.lastMonth?.total || 0).toLocaleString('en-IN')}`}>₹{(summary?.lastMonth?.total || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="px-1 overflow-hidden border-l border-white/5 md:border-none pl-2 md:pl-0">
              <p className="text-slate-400 text-[10px] md:text-xs font-medium truncate">{t('dashboard.thisYear')}</p>
              <p className="text-sm md:text-xl font-bold mt-0.5 md:mt-1 truncate" title={`₹${(summary?.thisYear?.total || 0).toLocaleString('en-IN')}`}>₹{(summary?.thisYear?.total || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        
        <Wallet className="absolute -right-4 md:-right-6 -bottom-4 md:-bottom-6 text-white/5" size={80} />
      </div>

      {/* ========== QUICK ACTIONS ========== */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onScanTrigger} 
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 md:p-5 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/25 group"
        >
          <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform">
            <QrCode size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="text-center">
            <span className="font-bold text-xs md:text-sm block">{t('upload.scanQr')}</span>
            <span className="text-[10px] md:text-xs text-emerald-100">{t('upload.addDigitalReceipt')}</span>
          </div>
        </button>
        
        <button 
          onClick={() => fileInputRef.current.click()} 
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-5 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-2 md:gap-3 text-white hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 group"
        >
          <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform">
            <UploadCloud size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="text-center">
            <span className="font-bold text-xs md:text-sm block">{t('upload.upload')}</span>
            <span className="text-[10px] md:text-xs text-blue-100">{t('upload.photoOrPdf')}</span>
          </div>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFilePick} className="hidden" accept="image/*,.pdf"/>
      </div>

      {/* ========== STATS GRID ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard 
          icon={Receipt} 
          label={t('dashboard.receipts')} 
          value={summary?.thisMonth?.count || receipts.length}
          subValue={t('dashboard.thisMonthLabel')}
          color="emerald" 
          isDark={isDark}
        />
        <StatCard 
          icon={Target} 
          label={t('dashboard.avgPerDay')} 
          value={`₹${summary?.thisMonth?.avgPerDay || Math.round(totalSpent / 30)}`}
          subValue={t('dashboard.dailyAverage')}
          color="blue" 
          isDark={isDark}
        />
        <StatCard 
          icon={Clock} 
          label={t('dashboard.lastWeekLabel')} 
          value={`₹${(summary?.lastWeek?.total || 0).toLocaleString('en-IN')}`}
          subValue={t('dashboard.receiptsCount', { count: summary?.lastWeek?.count || 0 })}
          color="purple" 
          isDark={isDark}
        />
        <StatCard 
          icon={Zap} 
          label={t('dashboard.projected')} 
          value={`₹${(summary?.thisMonth?.projectedTotal || 0).toLocaleString('en-IN')}`}
          subValue={t('dashboard.endOfMonth')}
          color="orange" 
          isDark={isDark}
        />
      </div>

      {/* ========== UPCOMING BILLS WIDGET ========== */}
      {upcomingBills.length > 0 && (
        <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'} shadow-sm`}>
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                <CreditCard size={16} className={`${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <h3 className={`font-bold text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t('bills.upcomingBills', 'Upcoming Bills')}
              </h3>
            </div>
            <button 
              onClick={() => onNavigate('bills')} 
              className="text-[10px] md:text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 md:gap-1 transition-colors"
            >
              {t('common.viewAll')} <ChevronRight size={12} className="md:w-[14px] md:h-[14px]" />
            </button>
          </div>
          
          <div className="space-y-2">
            {upcomingBills.slice(0, 3).map((bill) => {
              const dueDate = new Date(bill.nextDue);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntilDue < 0;
              const isDueToday = daysUntilDue === 0;
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue > 0;
              
              return (
                <div 
                  key={bill._id}
                  onClick={() => onNavigate('bills')}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                    isDark 
                      ? isOverdue ? 'bg-red-900/20 border border-red-800/50' 
                        : isDueToday ? 'bg-amber-900/20 border border-amber-800/50'
                        : isDueSoon ? 'bg-orange-900/20 border border-orange-800/50'
                        : 'bg-slate-700/50' 
                      : isOverdue ? 'bg-red-50 border border-red-100' 
                        : isDueToday ? 'bg-amber-50 border border-amber-100'
                        : isDueSoon ? 'bg-orange-50 border border-orange-100'
                        : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                      isDark ? 'bg-slate-600' : 'bg-white border border-slate-200'
                    }`}>
                      {bill.category === 'utilities' ? '💡' : 
                       bill.category === 'internet' ? '📶' :
                       bill.category === 'phone' ? '📱' :
                       bill.category === 'subscriptions' ? '📺' :
                       bill.category === 'insurance' ? '🛡️' :
                       bill.category === 'rent' ? '🏠' :
                       bill.category === 'loan' ? '🏦' :
                       bill.category === 'credit_card' ? '💳' : '📄'}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {bill.name}
                      </p>
                      <p className={`text-[10px] ${
                        isOverdue ? 'text-red-500 font-bold' :
                        isDueToday ? 'text-amber-500 font-bold' :
                        isDueSoon ? 'text-orange-500' :
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {isOverdue ? t('bills.overdue', 'Overdue!') :
                         isDueToday ? t('bills.dueToday', 'Due today') :
                         daysUntilDue === 1 ? t('bills.dueTomorrow', 'Due tomorrow') :
                         t('bills.dueInDays', { days: daysUntilDue })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {upcomingBills.length > 3 && (
            <button 
              onClick={() => onNavigate('bills')}
              className={`w-full mt-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              +{upcomingBills.length - 3} {t('bills.moreBills', 'more bills')}
            </button>
          )}
        </div>
      )}

      {/* ========== PENDING DUES SECTION ========== */}
      {pendingSummary.totalPendingAmount > 0 && (
        <div className={`rounded-xl md:rounded-2xl border overflow-hidden ${
          isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'
        }`}>
          {/* Header - Clickable to expand */}
          <div 
            onClick={() => setShowPendingSection(!showPendingSection)}
            className={`p-3 md:p-4 cursor-pointer transition-all ${
              isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 rounded-lg md:rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                  <AlertCircle size={16} className="text-red-500 md:w-[18px] md:h-[18px]" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    Pending Payments
                  </h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {pendingSummary.pendingCount} bill{pendingSummary.pendingCount !== 1 ? 's' : ''} to clear
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('pending'); }}
                  className="text-[10px] md:text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
                >
                  View All <ChevronRight size={12} />
                </button>
                <p className={`text-base md:text-xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  ₹{pendingSummary.totalPendingAmount?.toLocaleString('en-IN')}
                </p>
                {showPendingSection ? (
                  <ChevronUp size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                ) : (
                  <ChevronDown size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                )}
              </div>
            </div>
          </div>

          {/* Expandable Pending List */}
          {showPendingSection && (
            <div className={`border-t ${isDark ? 'border-dark-border' : 'border-slate-100'}`}>
              {pendingReceipts.length === 0 ? (
                <p className={`text-center py-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No pending payments
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-[250px] overflow-y-auto">
                  {pendingReceipts.map((receipt) => (
                    <div key={receipt.id} className={`p-3 ${isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-50'}`}>
                      {/* Merchant & Amount */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <Store size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {receipt.merchant || receipt.merchantName || receipt.merchantSnapshot?.shopName || "Merchant"}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(receipt.transactionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <p className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          ₹{receipt.pendingAmount?.toLocaleString() || receipt.amount?.toLocaleString()}
                        </p>
                      </div>

                      {/* Pay Button */}
                      <button
                        onClick={() => setSelectedPendingReceipt(receipt)}
                        disabled={pendingActionLoading[receipt.id]}
                        className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          isDark 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {pendingActionLoading[receipt.id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <IndianRupee size={14} />
                            Pay Now
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pay Modal */}
      {selectedPendingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xs rounded-2xl p-5 ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
            <div className="text-center mb-4">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <IndianRupee className="text-emerald-500" size={24} />
              </div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Pay ₹{selectedPendingReceipt.pendingAmount || selectedPendingReceipt.amount}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                to {selectedPendingReceipt.merchant || selectedPendingReceipt.merchantName || selectedPendingReceipt.merchantSnapshot?.shopName || "Merchant"}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setPendingActionLoading(prev => ({ ...prev, [selectedPendingReceipt.id]: true }));
                  try {
                    await payPendingBill(selectedPendingReceipt.id, "upi");
                    toast.success("Payment recorded!");
                    setSelectedPendingReceipt(null);
                    // Reload pending data
                    const [summaryRes, listRes] = await Promise.all([
                      fetchCustomerPendingSummary(),
                      fetchCustomerPendingReceipts()
                    ]);
                    setPendingSummary(summaryRes.data || { totalPendingAmount: 0, pendingCount: 0 });
                    setPendingReceipts(listRes.data.receipts || []);
                    window.dispatchEvent(new Event("customer-receipts-updated"));
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed");
                  } finally {
                    setPendingActionLoading(prev => ({ ...prev, [selectedPendingReceipt.id]: false }));
                  }
                }}
                disabled={pendingActionLoading[selectedPendingReceipt.id]}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                📱 UPI / Online
              </button>
              <button
                onClick={async () => {
                  setPendingActionLoading(prev => ({ ...prev, [selectedPendingReceipt.id]: true }));
                  try {
                    await payPendingBill(selectedPendingReceipt.id, "cash");
                    toast.success("Payment recorded!");
                    setSelectedPendingReceipt(null);
                    // Reload pending data
                    const [summaryRes, listRes] = await Promise.all([
                      fetchCustomerPendingSummary(),
                      fetchCustomerPendingReceipts()
                    ]);
                    setPendingSummary(summaryRes.data || { totalPendingAmount: 0, pendingCount: 0 });
                    setPendingReceipts(listRes.data.receipts || []);
                    window.dispatchEvent(new Event("customer-receipts-updated"));
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed");
                  } finally {
                    setPendingActionLoading(prev => ({ ...prev, [selectedPendingReceipt.id]: false }));
                  }
                }}
                disabled={pendingActionLoading[selectedPendingReceipt.id]}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                  isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                }`}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setSelectedPendingReceipt(null)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== RECENT ACTIVITY ========== */}
      <div>
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('dashboard.recentActivity')}</h3>
          <button 
            onClick={() => onNavigate('receipts')} 
            className="text-[10px] md:text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 md:gap-1 transition-colors"
          >
            {t('common.viewAll')} <ChevronRight size={12} className="md:w-[14px] md:h-[14px]" />
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className={`p-6 md:p-8 rounded-xl md:rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className={`w-12 md:w-16 h-12 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <Receipt size={20} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} md:w-6 md:h-6`} />
            </div>
            <p className={`font-semibold mb-1 text-sm md:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('receipts.noReceiptsYet')}</p>
            <p className={`text-xs md:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('receipts.scanOrUpload')}</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {receipts.slice(0, 5).map((receipt) => (
              <ReceiptCard 
                key={receipt.id}
                data={receipt} 
                onDelete={() => handleDelete(receipt.id)} 
                onUpdate={handleUpdate}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========== PROFESSIONAL UPLOAD MODAL ========== */}
      {pendingFile && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          {/* MODAL CARD 
              - mb-24: Crucial for Mobile to clear Bottom Nav
              - max-h-[85vh]: Prevents it from being too tall
          */}
          <div className={`w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] mb-24 md:mb-0 overflow-hidden animate-scale-up transition-all ${isDark ? 'bg-slate-900 ring-1 ring-white/10' : 'bg-white'}`}>
            
            {/* HEADER - Sticky & Glassy */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 z-10 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <div>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t('upload.addReceipt')}
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Verify details before saving
                </p>
              </div>
              <button 
                onClick={() => setPendingFile(null)} 
                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Image Preview - Card Style */}
              <div className="flex justify-center">
                <div className={`relative group w-full aspect-[16/9] rounded-2xl overflow-hidden border shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                    <img 
                        src={pendingFile.url} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/90">
                        <ImageIcon size={14} />
                        <span className="text-xs font-medium">Receipt Preview</span>
                    </div>
                </div>
              </div>

              <form id="uploadForm" onSubmit={saveUploadedReceipt} className="space-y-4">
                
                {/* Merchant Name */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('upload.merchantShop')}
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Store size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Starbucks, Local Market" 
                      value={manualMerchant}
                      onChange={(e) => setManualMerchant(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-800/50 border border-slate-700 text-white focus:border-blue-500 focus:bg-slate-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Amount & Date Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('upload.totalAmount')}
                        </label>
                        <div className="relative">
                            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>₹</span>
                            <input 
                            type="number" 
                            inputMode="decimal"
                            placeholder="0" 
                            value={manualAmount}
                            onChange={(e) => setManualAmount(e.target.value)}
                            className={`w-full pl-9 pr-3 py-3.5 rounded-xl text-lg font-bold outline-none transition-all ${
                                isDark 
                                ? 'bg-slate-800/50 border border-slate-700 text-white focus:border-blue-500 focus:bg-slate-800' 
                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                            }`}
                            required
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('upload.transactionDate')}
                        </label>
                        <div className="relative">
                            <input 
                            type="date" 
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all ${
                                isDark 
                                ? 'bg-slate-800/50 border border-slate-700 text-white focus:border-blue-500 focus:bg-slate-800' 
                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                            }`}
                            required
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Method - Pills */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('receipts.paymentMethod')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'upi', label: t('dashboard.upi'), icon: Smartphone },
                      { id: 'cash', label: t('dashboard.cash'), icon: Banknote },
                      { id: 'card', label: t('receipts.card'), icon: CreditCard },
                      { id: 'other', label: 'Other', icon: Clock },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setManualPaymentMethod(pm.id)}
                        className={`px-3 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                          manualPaymentMethod === pm.id
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : isDark
                              ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <pm.icon size={16} />
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include in Stats Toggle */}
                <div 
                  onClick={() => setIncludeInStats(!includeInStats)}
                  className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                    includeInStats 
                      ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                      : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    includeInStats 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : isDark ? 'bg-slate-700 text-slate-400' : 'bg-white border text-slate-300'
                  }`}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      includeInStats 
                        ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                        : isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {t('upload.includeInAnalytics')}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {t('upload.trackInCharts')}
                    </p>
                  </div>
                </div>

              </form>
            </div>

            {/* FOOTER - Sticky Bottom */}
            <div className={`p-4 border-t flex shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              <button 
                onClick={saveUploadedReceipt} // Manually triggering because button is outside form
                disabled={isUploading || !manualAmount || !manualMerchant}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isUploading ? (
                  <><Loader2 size={18} className="animate-spin" /> {t('upload.uploading')}</>
                ) : (
                  <><Save size={18} /> {t('upload.saveReceipt')}</>
                )}
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

      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CustomerHome;