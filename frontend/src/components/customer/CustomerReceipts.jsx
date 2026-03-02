import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_RECEIPTS } from './customerData';
import ReceiptCard from './ReceiptCard';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, Filter, Inbox, Receipt, QrCode, Upload, X, ChevronDown, Check, Smartphone, Banknote, CreditCard, SlidersHorizontal, ArrowUpDown, Calendar, Wallet } from 'lucide-react';
import { fetchCustomerReceipts } from '../../services/api';

// ============== SKELETON LOADER ==============
const ReceiptsSkeleton = ({ isDark }) => (
  <div className="space-y-4 animate-pulse">
    <div className={`h-14 rounded-2xl ${isDark ? 'bg-dark-card' : 'bg-slate-200'}`} />
    <div className="flex gap-2">
      {[1, 2, 3].map(i => <div key={i} className={`h-9 rounded-lg flex-1 ${isDark ? 'bg-dark-card' : 'bg-slate-200'}`} />)}
    </div>
    {[1, 2, 3, 4].map(i => <div key={i} className={`h-20 rounded-2xl ${isDark ? 'bg-dark-card' : 'bg-slate-200'}`} />)}
  </div>
);

const CustomerReceipts = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from backend, fall back to cached/mocks if it fails.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await fetchCustomerReceipts();
        const receiptsData = data.receipts || data || [];
        if (mounted) {
          setReceipts(receiptsData);
          localStorage.setItem('customerReceipts', JSON.stringify(receiptsData));
          setLoading(false);
        }
      } catch (error) {
        const saved = localStorage.getItem('customerReceipts');
        const fallback = saved ? JSON.parse(saved) : MOCK_RECEIPTS;
        if (mounted) {
          setReceipts(fallback);
          setLoading(false);
        }
      }
    };
    load();

    const handleUpdate = () => {
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
      // Then also fetch from backend to ensure sync
      load();
    };
    window.addEventListener('customer-receipts-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('customer-receipts-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-save changes
  useEffect(() => {
    if (receipts?.length) {
      localStorage.setItem('customerReceipts', JSON.stringify(receipts));
    }
  }, [receipts]);

  // UI State
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);

  // CRUD ACTIONS
  const handleDelete = (id) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdate = (updatedReceipt) => {
    setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    let result = receipts.filter(r => {
      const matchesType = filter === 'all' || r.type === filter;
      const matchesSearch = r.merchant?.toLowerCase().includes(search.toLowerCase());
      const matchesPayment = paymentFilter === 'all' 
        || r.paymentMethod === paymentFilter 
        || (paymentFilter === 'khata' && (r.paymentMethod === 'khata' || r.paymentMethod === 'pending'));
      return matchesType && matchesSearch && matchesPayment;
    });

    // Sort
    if (sortBy === 'date') {
      result = result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'amount') {
      result = result.sort((a, b) => b.amount - a.amount);
    }

    return result;
  }, [receipts, filter, search, paymentFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);
    const digital = filtered.filter(r => r.type === 'qr').length;
    const uploaded = filtered.filter(r => r.type === 'upload').length;
    return { total, digital, uploaded, count: filtered.length };
  }, [filtered]);

  if (loading) return <ReceiptsSkeleton isDark={isDark} />;

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-5 pb-24 md:pb-10">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className={`text-xl md:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('receipts.title')}</h1>
          <p className={`text-xs md:text-sm mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stats.count} {t('common.receipts')} • ₹{stats.total.toLocaleString('en-IN')} {t('common.total')}</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 md:p-2.5 rounded-xl border transition-all shrink-0 ${showFilters  
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
            : isDark 
              ? 'bg-dark-card border-dark-border text-slate-400 hover:bg-dark-surface' 
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* ========== SEARCH & FILTERS ========== */}
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm space-y-3 ${isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'}`}>
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18}/>
          <input 
            type="text" 
            placeholder={t('receipts.searchPlaceholder')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 md:py-3 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${isDark ? 'bg-dark-surface border-dark-border text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          />
          {search && (
            <button onClick={() => setSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-200'}`}>
              <X size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          )}
        </div>
        
        {/* Type Filter Tabs */}
        <div className={`flex gap-1.5 md:gap-2 p-1 md:p-1.5 rounded-lg md:rounded-xl ${isDark ? 'bg-dark-surface' : 'bg-slate-100'}`}>
          {[
            { id: 'all', label: t('common.all'), icon: Receipt, count: receipts.length },
            { id: 'qr', label: t('receipts.digital'), icon: QrCode, count: receipts.filter(r => r.type === 'qr').length },
            { id: 'upload', label: t('receipts.uploaded'), icon: Upload, count: receipts.filter(r => r.type === 'upload').length },
          ].map(type => (
            <button 
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`flex-1 py-2 md:py-2.5 px-2 md:px-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                filter === type.id 
                  ? isDark 
                    ? 'bg-dark-card text-emerald-400 shadow-sm' 
                    : 'bg-white text-emerald-600 shadow-sm' 
                  : isDark 
                    ? 'text-slate-400 hover:text-slate-300 hover:bg-dark-card/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <type.icon size={14} className="hidden sm:block" />
              <span>{type.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === type.id 
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700' 
                  : isDark ? 'bg-dark-border text-slate-400' : 'bg-slate-200 text-slate-500'
              }`}>{type.count}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <div className={`pt-3 border-t space-y-3 animate-fade-in ${isDark ? 'border-dark-border' : 'border-slate-100'}`}>
            {/* Payment Method */}
            <div>
              <label className={`text-[10px] md:text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('receipts.paymentMethod')}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: t('common.all'), icon: null },
                  { id: 'upi', label: t('dashboard.upi'), icon: Smartphone },
                  { id: 'cash', label: t('dashboard.cash'), icon: Banknote },
                  { id: 'card', label: t('receipts.card'), icon: CreditCard },
                  { id: 'khata', label: 'Khata', icon: Wallet },
                ].map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentFilter(pm.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      paymentFilter === pm.id
                        ? 'bg-emerald-500 text-white'
                        : isDark 
                          ? 'bg-dark-surface text-slate-300 hover:bg-dark-border' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pm.icon && <pm.icon size={12} />}
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className={`text-[10px] md:text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('receipts.sortBy')}</label>
              <div className="flex gap-2">
                {[
                  { id: 'date', label: t('receipts.latestFirst'), icon: Calendar },
                  { id: 'amount', label: t('receipts.highestAmount'), icon: ArrowUpDown },
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      sortBy === sort.id
                        ? isDark ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'
                        : isDark 
                          ? 'bg-dark-surface text-slate-300 hover:bg-dark-border' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <sort.icon size={12} />
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== QUICK STATS ========== */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className={`p-3 md:p-4 rounded-xl border text-center ${isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-slate-100'}`}>
          <p className={`text-[10px] md:text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.total')}</p>
          <p className={`text-base md:text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{stats.total.toLocaleString('en-IN')}</p>
        </div>
        <div className={`p-3 md:p-4 rounded-xl border text-center ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
          <p className={`text-[10px] md:text-xs font-semibold uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('receipts.digital')}</p>
          <p className={`text-base md:text-xl font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.digital}</p>
        </div>
        <div className={`p-3 md:p-4 rounded-xl border text-center ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
          <p className={`text-[10px] md:text-xs font-semibold uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('receipts.uploaded')}</p>
          <p className={`text-base md:text-xl font-bold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{stats.uploaded}</p>
        </div>
      </div>

      {/* ========== RECEIPTS LIST ========== */}
      <div className="space-y-2 md:space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className={`w-16 md:w-20 h-16 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-dark-card' : 'bg-slate-100'}`}>
              <Inbox size={28} className={`md:w-8 md:h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('receipts.noReceiptsFound')}</p>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('receipts.adjustFilters')}</p>
            {(search || filter !== 'all' || paymentFilter !== 'all') && (
              <button 
                onClick={() => { setSearch(''); setFilter('all'); setPaymentFilter('all'); }}
                className={`mt-4 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {t('receipts.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          filtered.map(r => (
            <ReceiptCard 
              key={r.id}
              data={r} 
              onDelete={() => handleDelete(r.id)} 
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CustomerReceipts;