import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Plus, X, Calendar, DollarSign, Bell, Pause, Play,
  Trash2, Edit3, Check, AlertTriangle, ChevronRight,
  Zap, CreditCard, Wifi, Shield, Home, Smartphone, FileText,
  MoreHorizontal, CheckCircle, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import {
  fetchBills, createBill, updateBill, deleteBill,
  toggleBillStatus, markBillPaid
} from '../../services/api';
import toast from 'react-hot-toast';

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

const CATEGORY_CONFIG = {
  utilities: { icon: Zap, color: 'amber', label: 'Utilities' },
  subscriptions: { icon: RefreshCw, color: 'purple', label: 'Subscriptions' },
  insurance: { icon: Shield, color: 'blue', label: 'Insurance' },
  rent: { icon: Home, color: 'emerald', label: 'Rent' },
  loan: { icon: FileText, color: 'red', label: 'Loan/EMI' },
  credit_card: { icon: CreditCard, color: 'slate', label: 'Credit Card' },
  phone: { icon: Smartphone, color: 'indigo', label: 'Phone' },
  internet: { icon: Wifi, color: 'cyan', label: 'Internet' },
  other: { icon: FileText, color: 'gray', label: 'Other' },
};

const CYCLE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom (Days)' },
];

const REMINDER_OFFSET_OPTIONS = [
  { value: 0, label: 'On due date' },
  { value: 1, label: '1 day before' },
  { value: 2, label: '2 days before' },
  { value: 3, label: '3 days before' },
  { value: 5, label: '5 days before' },
  { value: 7, label: '1 week before' },
];

const POPULAR_BILLS = {
  utilities: [
    { name: 'Electricity Bill', amount: 1500 },
    { name: 'Water Bill', amount: 500 },
    { name: 'Gas Bill', amount: 800 },
  ],
  subscriptions: [
    { name: 'Netflix', amount: 649 },
    { name: 'Amazon Prime', amount: 1499 },
    { name: 'Spotify', amount: 119 },
    { name: 'YouTube Premium', amount: 129 },
  ],
  insurance: [
    { name: 'Health Insurance', amount: 5000 },
    { name: 'Car Insurance', amount: 3000 },
  ],
};

const AMOUNT_TEMPLATES = [500, 1000, 1500, 2000, 5000];

// ==========================================
// UTILITIES
// ==========================================

const getCategoryTheme = (color, isDark) => {
  const themes = {
    amber: { bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50', text: isDark ? 'text-amber-400' : 'text-amber-600', border: isDark ? 'border-amber-800' : 'border-amber-200' },
    purple: { bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50', text: isDark ? 'text-purple-400' : 'text-purple-600', border: isDark ? 'border-purple-800' : 'border-purple-200' },
    blue: { bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50', text: isDark ? 'text-blue-400' : 'text-blue-600', border: isDark ? 'border-blue-800' : 'border-blue-200' },
    emerald: { bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-800' : 'border-emerald-200' },
    red: { bg: isDark ? 'bg-red-900/30' : 'bg-red-50', text: isDark ? 'text-red-400' : 'text-red-600', border: isDark ? 'border-red-800' : 'border-red-200' },
    slate: { bg: isDark ? 'bg-slate-700' : 'bg-slate-100', text: isDark ? 'text-slate-400' : 'text-slate-600', border: isDark ? 'border-slate-600' : 'border-slate-200' },
    indigo: { bg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50', text: isDark ? 'text-indigo-400' : 'text-indigo-600', border: isDark ? 'border-indigo-800' : 'border-indigo-200' },
    cyan: { bg: isDark ? 'bg-cyan-900/30' : 'bg-cyan-50', text: isDark ? 'text-cyan-400' : 'text-cyan-600', border: isDark ? 'border-cyan-800' : 'border-cyan-200' },
    gray: { bg: isDark ? 'bg-gray-700' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-600', border: isDark ? 'border-gray-600' : 'border-gray-200' },
  };
  return themes[color] || themes.gray;
};

const formatCurrency = (amount) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString) => 
  dateString ? new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A';

// ==========================================
// SUB-COMPONENTS
// ==========================================

const BillsSkeleton = ({ isDark }) => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className={`h-24 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    ))}
  </div>
);

// Wrapped in memo to prevent unnecessary re-renders of the list
const BillCard = React.memo(({ bill, onEdit, onDelete, onToggleStatus, onMarkPaid }) => {
  const { isDark } = useTheme();
  const [showActions, setShowActions] = useState(false);
  
  const config = CATEGORY_CONFIG[bill.category] || CATEGORY_CONFIG.other;
  const Icon = config.icon;
  const style = getCategoryTheme(config.color, isDark);
  
  const isPaused = bill.status === 'paused';
  const isPaid = bill.isPaidThisCycle;
  
  // Status Logic
  const getStatusDisplay = () => {
    if (bill.isOverdue && !isPaid) return { label: 'Overdue', color: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600', icon: AlertTriangle };
    if (bill.isDueSoon && !isPaid) return { label: `Due ${formatDate(bill.nextDueDate)}`, color: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600', icon: Calendar };
    return { label: `Due ${formatDate(bill.nextDueDate)}`, color: isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600', icon: Calendar };
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;
  
  return (
    <div className={`p-4 rounded-2xl border transition-all relative ${isPaused ? 'opacity-60' : ''} ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
      
      {/* Floating Indicators */}
      {!isPaid && (
        <>
          {bill.isOverdue && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg z-10">
              <AlertTriangle size={12} className="text-white" />
            </div>
          )}
          {bill.isDueSoon && !bill.isOverdue && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg z-10">
              <Bell size={12} className="text-white" />
            </div>
          )}
        </>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${style.bg} ${style.border}`}>
          <Icon size={20} className={style.text} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-bold text-sm ${isPaused ? 'line-through' : ''} ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {bill.name}
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {config.label} • {CYCLE_OPTIONS.find(c => c.value === bill.billCycle)?.label || bill.billCycle}
              </p>
            </div>
            
            {bill.amount && (
              <div className="text-right shrink-0">
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {formatCurrency(bill.amount)}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${status.color}`}>
              <StatusIcon size={10} /> {status.label}
            </span>
            
            {isPaid && (
              <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <CheckCircle size={10} /> Paid
              </span>
            )}
            
            {isPaused && (
              <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <Pause size={10} /> Paused
              </span>
            )}
            
            {bill.reminderOffsets?.length > 0 && (
              <span className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Bell size={10} /> {bill.reminderOffsets.length}
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowActions(!showActions)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <MoreHorizontal size={18} />
          </button>
          
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-lg z-20 py-1 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                {!isPaid && (
                  <button onClick={() => { onMarkPaid(bill._id); setShowActions(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${isDark ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-slate-50 text-emerald-600'}`}>
                    <Check size={14} /> Mark as Paid
                  </button>
                )}
                <button onClick={() => { onEdit(bill); setShowActions(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <Edit3 size={14} /> Edit Bill
                </button>
                <button onClick={() => { onToggleStatus(bill._id, isPaused ? 'active' : 'paused'); setShowActions(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                  {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'Resume' : 'Pause'} Reminders
                </button>
                <button onClick={() => { onDelete(bill._id); setShowActions(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${isDark ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-slate-50 text-red-600'}`}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const BillModal = ({ isOpen, onClose, bill, onSave }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [customIntervalUnit, setCustomIntervalUnit] = useState('days');
  
  const [formData, setFormData] = useState({
    name: '', amount: '', category: '', billCycle: 'monthly',
    dueDay: 1, customIntervalDays: 30, reminderOffsets: [3, 1],
    notes: '', isAutoPay: false, paymentMethod: '',
  });
  
  // Initialization Effect
  useEffect(() => {
    if (bill) {
      const intervalDays = bill.customIntervalDays || 30;
      const isWeekly = intervalDays % 7 === 0;
      setCustomIntervalUnit(isWeekly ? 'weeks' : 'days');
      setFormData({
        name: bill.name || '',
        amount: bill.amount || '',
        category: bill.category || 'other',
        billCycle: bill.billCycle || 'monthly',
        dueDay: bill.dueDay || 1,
        customIntervalDays: intervalDays,
        reminderOffsets: bill.reminderOffsets || [3, 1],
        notes: bill.notes || '',
        isAutoPay: bill.isAutoPay || false,
        paymentMethod: bill.paymentMethod || '',
      });
      setStep(1);
    } else {
      setCustomIntervalUnit('days');
      setFormData({
        name: '', amount: '', category: '', billCycle: 'monthly',
        dueDay: new Date().getDate(), customIntervalDays: 30,
        reminderOffsets: [3, 1], notes: '', isAutoPay: false, paymentMethod: '',
      });
      setStep(1);
    }
    setErrors({});
  }, [bill, isOpen]);
  
  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = 'Bill name is required';
      if (!formData.category) newErrors.category = 'Please select a category';
    }
    if (stepNum === 2) {
      if (!formData.billCycle) newErrors.billCycle = 'Please select billing cycle';
      if (formData.billCycle === 'custom' && (!formData.customIntervalDays || formData.customIntervalDays < 1)) {
        newErrors.customIntervalDays = 'Please enter valid interval';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      setStep(prev => (!validateStep(1) ? 1 : 2));
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        dueDay: parseInt(formData.dueDay),
        customIntervalDays: formData.billCycle === 'custom' ? parseInt(formData.customIntervalDays) : null,
        startDate: new Date().toISOString(),
      };
      
      await onSave(payload, bill?._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderOffset = (offset) => {
    setFormData(prev => {
      const offsets = prev.reminderOffsets.includes(offset)
        ? prev.reminderOffsets.filter(o => o !== offset)
        : [...prev.reminderOffsets, offset].sort((a, b) => b - a);
      return { ...prev, reminderOffsets: offsets.length > 0 ? offsets : [1] };
    });
  };

  const customIntervalValue = customIntervalUnit === 'weeks'
    ? Math.max(1, Math.round(Number(formData.customIntervalDays || 0) / 7))
    : Math.max(1, Number(formData.customIntervalDays || 0) || 1);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-4xl max-h-[90vh] mx-auto overflow-hidden rounded-3xl shadow-2xl flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-5 border-b shrink-0 ${isDark ? 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500'}`}>
                  {step === 1 && <FileText size={16} className={isDark ? 'text-emerald-400' : 'text-white'} />}
                  {step === 2 && <Calendar size={16} className={isDark ? 'text-emerald-400' : 'text-white'} />}
                  {step === 3 && <Bell size={16} className={isDark ? 'text-emerald-400' : 'text-white'} />}
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Step {step} of 3</p>
              </div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {step === 1 ? (bill ? 'Edit Details' : 'New Bill') : step === 2 ? 'Schedule' : 'Preferences'}
              </h2>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X size={20} />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-all duration-500 ${s <= step ? (isDark ? 'bg-emerald-500' : 'bg-emerald-600') : (isDark ? 'bg-slate-700' : 'bg-slate-200')}`} />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Category *</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(CATEGORY_CONFIG).map(([key, { icon: CatIcon, label }]) => {
                    const isSelected = formData.category === key;
                    return (
                      <button
                        key={key} type="button"
                        onClick={() => { setFormData({ ...formData, category: key }); setErrors({ ...errors, category: '' }); }}
                        className={`relative p-4 rounded-2xl border-2 text-sm font-bold flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? isDark ? 'bg-emerald-500/20 border-emerald-500' : 'bg-emerald-50 border-emerald-500'
                            : isDark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />}
                        <CatIcon size={24} className={isSelected ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-slate-400' : 'text-slate-600')} />
                        <span className={isSelected ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-2">{errors.category}</p>}
              </div>

              {/* Popular Presets */}
              {formData.category && POPULAR_BILLS[formData.category] && (
                <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                  <p className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Zap size={14} /> Quick Fill
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_BILLS[formData.category].map((preset, idx) => (
                      <button
                        key={idx} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, name: preset.name, amount: preset.amount }))}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {preset.name} • ₹{preset.amount}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name & Amount */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Bill Name *</label>
                  <input
                    type="text" value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                    placeholder="e.g., Netflix Premium"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 text-base transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${errors.name ? 'border-red-500' : isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-2">{errors.name}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Amount (Optional)</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₹</span>
                    <input
                      type="number" value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Variable amount" min="0" step="0.01"
                      className={`w-full pl-10 pr-4 py-3.5 rounded-xl border-2 text-base transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'}`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AMOUNT_TEMPLATES.map(amt => (
                      <button
                        key={amt} type="button" onClick={() => setFormData({ ...formData, amount: amt })}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${Number(formData.amount) === amt ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Billing Cycle *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CYCLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => { setFormData({ ...formData, billCycle: opt.value }); setErrors({ ...errors, billCycle: '' }); }}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${formData.billCycle === opt.value ? (isDark ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700') : (isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.billCycle && <p className="text-red-500 text-xs mt-2">{errors.billCycle}</p>}
              </div>

              {formData.billCycle === 'custom' && (
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <input
                      type="number" min="1" value={customIntervalValue}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value || 1));
                        setFormData({ ...formData, customIntervalDays: customIntervalUnit === 'weeks' ? val * 7 : val });
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-base ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                  <select
                    value={customIntervalUnit}
                    onChange={(e) => {
                      const unit = e.target.value;
                      setCustomIntervalUnit(unit);
                      setFormData({ ...formData, customIntervalDays: unit === 'weeks' ? customIntervalValue * 7 : customIntervalValue });
                    }}
                    className={`px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
              )}

              {(formData.billCycle === 'monthly' || formData.billCycle === 'quarterly') && (
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Due Day (1-31)</label>
                  <input
                    type="number" min="1" max="31" value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: Math.min(31, Math.max(1, Number(e.target.value))) })}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                  />
                  <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Use 31 for the last day of the month.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Reminders</label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OFFSET_OPTIONS.map(opt => (
                    <button
                      key={opt.value} type="button" onClick={() => toggleReminderOffset(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                        formData.reminderOffsets.includes(opt.value)
                          ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' : 'bg-emerald-50 text-emerald-700 border-emerald-500'
                          : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {formData.reminderOffsets.includes(opt.value) && <Check size={12} className="inline mr-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Notes</label>
                <textarea
                  value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Payment links, account info..." rows={4}
                  className={`w-full px-4 py-3 rounded-xl border-2 resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
              </div>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={formData.isAutoPay} onChange={(e) => setFormData({ ...formData, isAutoPay: e.target.checked })} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" />
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Auto-pay enabled</p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mark as paid automatically on due date.</p>
                </div>
              </label>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className={`p-6 border-t shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button" onClick={() => setStep(s => s - 1)}
                className={`px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <ChevronRight size={18} className="rotate-180" /> Back
              </button>
            )}
            <button
              onClick={step < 3 ? () => validateStep(step) && setStep(s => s + 1) : handleSubmit}
              disabled={loading}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : step < 3 ? <>Continue <ChevronRight size={18} /></> : <><Check size={20} /> {bill ? 'Update Bill' : 'Create Bill'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const CustomerRecurringBills = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await fetchBills({ status: filter === 'all' ? undefined : filter });
      setBills(data.bills || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [filter]);
  
  useEffect(() => { loadBills(); }, [loadBills]);
  
  const handleSave = async (payload, billId) => {
    try {
      if (billId) {
        await updateBill(billId, payload);
        toast.success('Bill updated');
      } else {
        await createBill(payload);
        toast.success('Bill added');
      }
      loadBills();
    } catch (e) { console.error(e); }
  };
  
  // Memoized handlers to prevent child re-renders
  const handleDelete = useCallback(async (billId) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteBill(billId);
      toast.success('Bill deleted');
      loadBills();
    } catch (error) { toast.error('Failed to delete'); }
  }, [loadBills]);
  
  const handleToggleStatus = useCallback(async (billId, status) => {
    try {
      await toggleBillStatus(billId, status);
      toast.success(status === 'active' ? 'Resumed' : 'Paused');
      loadBills();
    } catch (error) { toast.error('Update failed'); }
  }, [loadBills]);
  
  const handleMarkPaid = useCallback(async (billId) => {
    try {
      await markBillPaid(billId);
      toast.success('Marked as paid');
      loadBills();
    } catch (error) { toast.error('Update failed'); }
  }, [loadBills]);
  
  const stats = useMemo(() => {
    const active = bills.filter(b => b.status === 'active');
    return {
      active: active.length,
      overdue: active.filter(b => b.isOverdue && !b.isPaidThisCycle).length,
      dueSoon: active.filter(b => b.isDueSoon && !b.isOverdue && !b.isPaidThisCycle).length,
      totalMonthly: active.reduce((sum, b) => sum + (b.amount || 0), 0)
    };
  }, [bills]);
  
  const StatCard = ({ label, value, icon: Icon, colorClass, textClass }) => (
    <div className={`p-4 rounded-xl border ${colorClass}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <Icon size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
      </div>
      <p className={`text-2xl font-bold mt-1 ${textClass}`}>{value}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t('bills.title', 'Recurring Bills')}
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('bills.subtitle', 'Track and get reminded about your bills')}
          </p>
        </div>
        <button 
          onClick={() => { setEditingBill(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus size={18} /> {t('bills.addBill', 'Add Bill')}
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active" value={stats.active} icon={FileText} colorClass={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} textClass={isDark ? 'text-white' : 'text-slate-800'} />
        <StatCard label="Monthly" value={formatCurrency(stats.totalMonthly)} icon={DollarSign} colorClass={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} textClass={isDark ? 'text-white' : 'text-slate-800'} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} colorClass={stats.overdue > 0 ? (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200') : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100')} textClass={stats.overdue > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-white' : 'text-slate-800')} />
        <StatCard label="Due Soon" value={stats.dueSoon} icon={Bell} colorClass={stats.dueSoon > 0 ? (isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200') : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100')} textClass={stats.dueSoon > 0 ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-white' : 'text-slate-800')} />
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: 'all', label: 'All Bills' }, { id: 'active', label: 'Active' }, { id: 'paused', label: 'Paused' }].map(f => (
          <button
            key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === f.id ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white') : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {/* List */}
      {loading ? (
        <BillsSkeleton isDark={isDark} />
      ) : bills.length === 0 ? (
        <div className="text-center py-16">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <FileText size={32} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
          </div>
          <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No bills found</p>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add your recurring bills to get reminders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <BillCard
              key={bill._id}
              bill={bill}
              onEdit={() => { setEditingBill(bill); setShowModal(true); }}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      )}
      
      <BillModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBill(null); }}
        bill={editingBill}
        onSave={handleSave}
      />
    </div>
  );
};

export default CustomerRecurringBills;