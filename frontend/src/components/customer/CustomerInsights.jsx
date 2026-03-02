import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, TrendingDown, ShoppingBag, Coffee, Target, Wallet, Sparkles, Leaf, 
  AlertTriangle, RefreshCw, CreditCard, Banknote, Smartphone, PieChart, BarChart3,
  Calendar, Receipt, Store, ArrowUpRight, ArrowDownRight, Clock, Zap, Award,
  ChevronRight, IndianRupee, Activity, Package, Flame, Star
} from 'lucide-react';
import { fetchCustomerAnalytics } from '../../services/api';
import { formatISTDisplay, toIST } from '../../utils/timezone';
import { useTheme } from '../../contexts/ThemeContext';

// ============== SKELETON LOADER ==============
const InsightsSkeleton = () => {
  const { isDark } = useTheme();
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-pulse">
      <div className={`h-8 rounded w-48 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className="grid grid-cols-2 gap-4">
        <div className={`h-32 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-32 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>
      <div className={`h-48 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className={`h-64 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className={`h-48 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
    </div>
  );
};

// ============== MINI CHART COMPONENT ==============
const MiniBarChart = ({ data, height = 60, color = 'emerald' }) => {
  const { isDark } = useTheme();
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const colorClass = {
    emerald: isDark ? 'bg-emerald-500' : 'bg-emerald-500',
    blue: isDark ? 'bg-blue-500' : 'bg-blue-500',
    purple: isDark ? 'bg-purple-500' : 'bg-purple-500',
  }[color] || 'bg-emerald-500';

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 ${colorClass} rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group`}
          style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
          title={`${d.label}: ₹${d.value}`}
        >
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 ${
            isDark ? 'bg-slate-700' : 'bg-slate-800'
          }`}>
            {d.label}: ₹{d.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============== DONUT CHART COMPONENT ==============
const DonutChart = ({ segments, size = 120, strokeWidth = 16 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const segmentLength = (seg.percentage / 100) * circumference;
        const element = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        );
        offset += segmentLength;
        return element;
      })}
    </svg>
  );
};

// ============== STAT CARD ==============
const StatCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = 'emerald', className = '' }) => {
  const { isDark } = useTheme();
  const colorClasses = {
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100',
    purple: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-100',
    orange: isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-100',
    slate: isDark ? 'bg-slate-700/50 text-slate-400 border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-100',
  };
  const iconBg = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white border-slate-100'
    } ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon size={18} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        {subValue && <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>}
      </div>
    </div>
  );
};

// ============== CATEGORY ITEM ==============
const getCategoryConfig = (category) => {
  const name = (category || '').toLowerCase();
  
  // Food & Beverages
  if (name.includes('food') || name.includes('restaurant') || name.includes('snack') || name.includes('cafe') || name.includes('bakery')) {
    return { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-500', light: 'bg-orange-50' };
  }
  if (name.includes('drink') || name.includes('beverage') || name.includes('juice') || name.includes('bar')) {
    return { icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50' };
  }
  
  // Retail & Shopping
  if (name.includes('shop') || name.includes('retail') || name.includes('cloth') || name.includes('fashion') || name.includes('apparel')) {
    return { icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500', light: 'bg-blue-50' };
  }
  if (name.includes('grocery') || name.includes('mart') || name.includes('supermarket') || name.includes('store') || name.includes('general')) {
    return { icon: Package, color: 'text-green-500', bg: 'bg-green-500', light: 'bg-green-50' };
  }
  
  // Services & Transportation
  if (name.includes('travel') || name.includes('transport') || name.includes('fuel') || name.includes('petrol') || name.includes('gas')) {
    return { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500', light: 'bg-purple-50' };
  }
  if (name.includes('health') || name.includes('pharmacy') || name.includes('medical') || name.includes('hospital')) {
    return { icon: Activity, color: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-50' };
  }
  if (name.includes('salon') || name.includes('spa') || name.includes('beauty') || name.includes('parlor')) {
    return { icon: Star, color: 'text-pink-500', bg: 'bg-pink-500', light: 'bg-pink-50' };
  }
  
  // Entertainment & Services
  if (name.includes('entertainment') || name.includes('movie') || name.includes('gaming') || name.includes('cinema')) {
    return { icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500', light: 'bg-rose-50' };
  }
  if (name.includes('electronics') || name.includes('tech') || name.includes('mobile') || name.includes('computer')) {
    return { icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-500', light: 'bg-indigo-50' };
  }
  
  // Default
  return { icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50' };
};

const getPaymentIcon = (method) => {
  const m = (method || '').toLowerCase();
  if (m.includes('upi')) return Smartphone;
  if (m.includes('card')) return CreditCard;
  if (m.includes('cash')) return Banknote;
  return Wallet;
};

// ============== MAIN COMPONENT ==============
const CustomerInsights = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, categories, trends

  // ============== LOAD DATA ==============
  const loadAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data } = await fetchCustomerAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (e) {
      setError(t('insights.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ============== DERIVED DATA ==============
  const chartData = useMemo(() => {
    if (!analytics?.trends?.daily) return [];
    return analytics.trends.daily.slice(-14).map(d => ({
      label: formatISTDisplay(toIST(d.date), { day: 'numeric', month: 'short' }),
      value: d.total,
    }));
  }, [analytics]);

  const monthlyChartData = useMemo(() => {
    if (!analytics?.trends?.monthly) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return analytics.trends.monthly.map(m => ({
      label: monthNames[m.month - 1],
      value: m.total,
    }));
  }, [analytics]);

  const donutSegments = useMemo(() => {
    if (!analytics?.categories?.length) return [];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];
    return analytics.categories.slice(0, 5).map((c, i) => ({
      percentage: c.percentage,
      color: colors[i % colors.length],
      label: c.category,
    }));
  }, [analytics]);

  const suggestions = useMemo(() => {
    if (!analytics) return [];
    const list = [];
    const { summary, categories } = analytics;

    // Spending trend suggestion
    if (summary?.changes?.monthOverMonth > 20) {
      list.push({
        icon: AlertTriangle,
        title: 'Spending Alert',
        desc: `Your spending is ${summary.changes.monthOverMonth}% higher than last month. Consider reviewing your expenses.`,
        type: 'warning',
      });
    } else if (summary?.changes?.monthOverMonth < -10) {
      list.push({
        icon: Award,
        title: 'Great Savings!',
        desc: `You've reduced spending by ${Math.abs(summary.changes.monthOverMonth)}% compared to last month. Keep it up!`,
        type: 'success',
      });
    }

    // Top category suggestion
    if (categories?.length > 0) {
      const top = categories[0];
      if (top.percentage > 50) {
        list.push({
          icon: PieChart,
          title: `${top.category} Dominates`,
          desc: `${top.percentage}% of your spending is on ${top.category}. Consider diversifying or setting a budget cap.`,
          type: 'info',
        });
      }
    }

    // Budget projection
    if (summary?.thisMonth?.projectedTotal > summary?.lastMonth?.total * 1.3) {
      list.push({
        icon: TrendingUp,
        title: 'Projected Overspend',
        desc: `At this rate, you might spend ₹${summary.thisMonth.projectedTotal.toLocaleString('en-IN')} this month.`,
        type: 'warning',
      });
    }

    // Default suggestions
    list.push(
      { icon: Target, title: 'Set Budget Goals', desc: 'Create monthly spending limits for each category to stay on track.', type: 'tip' },
      { icon: Sparkles, title: 'Enable Smart Alerts', desc: 'Get notified when you exceed your daily spending average.', type: 'tip' },
    );

    return list.slice(0, 4);
  }, [analytics]);

  // ============== RENDER ==============
  if (loading) return <InsightsSkeleton />;

  const { summary, categories, paymentMethods, topMerchants, topItems, recentActivity } = analytics || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('insights.title')}</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('insights.subtitle')}</p>
        </div>
        <button 
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className={`p-2.5 border rounded-xl transition-colors disabled:opacity-50 ${
            isDark 
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
          }`}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm ${
          isDark 
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className={`flex gap-2 p-1 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
        {[
          { id: 'overview', label: t('insights.overview'), icon: BarChart3 },
          { id: 'categories', label: t('insights.categories'), icon: PieChart },
          { id: 'trends', label: t('insights.trends'), icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? isDark
                  ? 'bg-slate-700 text-emerald-400 shadow-sm' 
                  : 'bg-white text-emerald-600 shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Hero Stats Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
            
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">{t('dashboard.thisMonth')}</p>
                  <h3 className="text-4xl font-bold mt-2">₹{(summary?.thisMonth?.total || 0).toLocaleString('en-IN')}</h3>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      {summary?.changes?.monthOverMonth >= 0 ? (
                        <ArrowUpRight size={16} className="text-emerald-200" />
                      ) : (
                        <ArrowDownRight size={16} className="text-emerald-200" />
                      )}
                      <span className="text-sm font-medium text-emerald-100">
                        {Math.abs(summary?.changes?.monthOverMonth || 0)}% {t('insights.vsLastMonth')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-sm font-bold">{summary?.thisMonth?.count || 0} {t('common.receipts')}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                <div>
                  <p className="text-emerald-200 text-xs">{t('dashboard.avgPerDay')}</p>
                  <p className="text-lg font-bold">₹{summary?.thisMonth?.avgPerDay || 0}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">{t('dashboard.thisWeek')}</p>
                  <p className="text-lg font-bold">₹{(summary?.thisWeek?.total || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-emerald-200 text-xs">{t('dashboard.projected')}</p>
                  <p className="text-lg font-bold">₹{(summary?.thisMonth?.projectedTotal || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Calendar}
              label={t('dashboard.lastMonth')}
              value={`₹${(summary?.lastMonth?.total || 0).toLocaleString('en-IN')}`}
              subValue={`${summary?.lastMonth?.count || 0} ${t('common.receipts')}`}
              color="slate"
            />
            <StatCard
              icon={TrendingUp}
              label={t('dashboard.thisYear')}
              value={`₹${(summary?.thisYear?.total || 0).toLocaleString('en-IN')}`}
              subValue={`${summary?.thisYear?.count || 0} ${t('common.receipts')}`}
              color="blue"
            />
          </div>

          {/* Mini Spending Chart */}
          {chartData.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.dailySpending')}</h3>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('insights.last14Days')}</span>
              </div>
              <MiniBarChart data={chartData} height={80} color="emerald" isDark={isDark} />
            </div>
          )}

          {/* Top Merchants */}
          {topMerchants?.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.favoriteMerchants')}</h3>
                <Store size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              </div>
              <div className="space-y-3">
                {topMerchants.slice(0, 3).map((merchant, i) => {
                  const config = getCategoryConfig(merchant.businessCategory);
                  const Icon = config.icon;
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-600' : config.light}`}>
                          <Icon className={config.color} size={18} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>{merchant.name}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{merchant.visits} visits • {merchant.businessCategory || 'General'}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{merchant.totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fade-in">
          {/* Donut Chart */}
          {donutSegments.length > 0 && (
            <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.spendingBreakdown')}</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <DonutChart segments={donutSegments} size={140} strokeWidth={20} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{t('common.total')}</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{(summary?.thisMonth?.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {donutSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{seg.label}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{seg.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category List */}
          <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.categoryDetails')}</h3>
            <div className="space-y-3">
              {(categories || []).length === 0 && (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('insights.noData')}</p>
              )}
              {(categories || []).map((cat, i) => {
                const config = getCategoryConfig(cat.category);
                const Icon = config.icon;
                return (
                  <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-600' : config.light}`}>
                          <Icon className={config.color} size={20} />
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{cat.category}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{cat.count} transactions • Avg ₹{cat.avgTransaction}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{cat.totalSpent.toLocaleString('en-IN')}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{cat.percentage}%</p>
                      </div>
                    </div>
                    <div className={`mt-3 h-2 rounded-full overflow-hidden border ${isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'}`}>
                      <div 
                        className={`h-full ${config.bg} transition-all duration-500`} 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          {paymentMethods?.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('receipts.paymentMethod')}</h3>
              
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[ 
                  {
                    id: 'upi',
                    title: t('insights.upiPayments'),
                    icon: Smartphone,
                    container: isDark ? 'bg-emerald-900/30 border-emerald-800' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100',
                    iconBg: 'bg-emerald-500',
                    titleColor: isDark ? 'text-emerald-400' : 'text-emerald-800',
                    valueColor: isDark ? 'text-emerald-300' : 'text-emerald-700',
                    metaColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
                  },
                  {
                    id: 'cash',
                    title: t('insights.cashPayments'),
                    icon: Banknote,
                    container: isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100',
                    iconBg: 'bg-amber-500',
                    titleColor: isDark ? 'text-amber-400' : 'text-amber-800',
                    valueColor: isDark ? 'text-amber-300' : 'text-amber-700',
                    metaColor: isDark ? 'text-amber-400' : 'text-amber-600',
                  },
                  {
                    id: 'card',
                    title: t('receipts.card'),
                    icon: CreditCard,
                    container: isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100',
                    iconBg: 'bg-blue-500',
                    titleColor: isDark ? 'text-blue-400' : 'text-blue-800',
                    valueColor: isDark ? 'text-blue-300' : 'text-blue-700',
                    metaColor: isDark ? 'text-blue-400' : 'text-blue-600',
                  },
                  {
                    id: 'other',
                    title: 'Other',
                    icon: Wallet,
                    container: isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-100',
                    iconBg: isDark ? 'bg-slate-600' : 'bg-slate-500',
                    titleColor: isDark ? 'text-slate-300' : 'text-slate-700',
                    valueColor: isDark ? 'text-slate-200' : 'text-slate-800',
                    metaColor: isDark ? 'text-slate-400' : 'text-slate-500',
                  },
                ].map((pm) => {
                  const found = paymentMethods.find(x => x.method?.toLowerCase() === pm.id);
                  const total = found?.total || 0;
                  const count = found?.count || 0;
                  const Icon = pm.icon;

                  return (
                    <div key={pm.id} className={`p-4 rounded-xl border ${pm.container}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 ${pm.iconBg} rounded-lg`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <span className={`font-bold ${pm.titleColor}`}>{pm.title}</span>
                      </div>
                      <p className={`text-2xl font-bold ${pm.valueColor}`}>₹{total.toLocaleString('en-IN')}</p>
                      <p className={`text-xs mt-1 ${pm.metaColor}`}>{count} {t('insights.transactions')}</p>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-fade-in">
          {/* Monthly Trend */}
          {monthlyChartData.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.monthlyTrend')}</h3>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('insights.last6Months')}</span>
              </div>
              <MiniBarChart data={monthlyChartData} height={100} color="blue" isDark={isDark} />
              <div className={`flex justify-between mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {monthlyChartData.map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Week Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Calendar}
              label={t('dashboard.thisWeek')}
              value={`₹${(summary?.thisWeek?.total || 0).toLocaleString('en-IN')}`}
              subValue={`${summary?.thisWeek?.count || 0} ${t('common.receipts')}`}
              trend={summary?.changes?.weekOverWeek >= 0 ? 'up' : 'down'}
              trendValue={Math.abs(summary?.changes?.weekOverWeek || 0)}
              color="emerald"
            />
            <StatCard
              icon={Clock}
              label={t('dashboard.lastWeekLabel')}
              value={`₹${(summary?.lastWeek?.total || 0).toLocaleString('en-IN')}`}
              subValue={`${summary?.lastWeek?.count || 0} ${t('common.receipts')}`}
              color="slate"
            />
          </div>

          {/* Top Items */}
          {topItems?.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.topPurchases')}</h3>
                <Flame size={18} className="text-orange-500" />
              </div>
              <div className="space-y-2">
                {topItems.slice(0, 5).map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-emerald-100' : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700'}`}>
                        #{i + 1}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>{item.name}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{item.quantity} qty • Avg ₹{item.avgPrice}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>₹{item.totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity?.length > 0 && (
            <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('dashboard.recentActivity')}</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-slate-600' : 'bg-white'}`}>
                      <Receipt size={18} className={isDark ? 'text-slate-300' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-700'}`}>{activity.merchant}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                        {formatISTDisplay(toIST(activity.date), { day: 'numeric', month: 'short' })}
                        {' • '}{activity.category} • {activity.paymentMethod}
                      </p>
                    </div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>₹{activity.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-500" size={20} />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('insights.smartSuggestions')}</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map((tip, i) => {
              const Icon = tip.icon;
              const bgColor = tip.type === 'warning' 
                ? isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-100'
                : tip.type === 'success' 
                  ? isDark ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-100'
                  : isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-100';
              const iconColor = tip.type === 'warning' ? 'text-amber-500' 
                             : tip.type === 'success' ? 'text-emerald-500'
                             : 'text-blue-500';
              return (
                <div key={i} className={`p-4 rounded-xl border ${bgColor} flex gap-3 items-start`}>
                  <div className={`p-2 rounded-lg shadow-sm ${iconColor} ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{tip.title}</p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tip.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <p className={`text-center text-xs pt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Data refreshed {analytics?.meta?.generatedAt ? formatISTDisplay(toIST(analytics.meta.generatedAt), { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'recently'}
      </p>

      {/* CSS */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default CustomerInsights;