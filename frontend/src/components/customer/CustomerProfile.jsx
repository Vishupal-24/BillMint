import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  User, Mail, Phone, MapPin, Shield, LogOut, ChevronRight, AlertTriangle, 
  Save, CheckCircle, Lock, Eye, EyeOff, X, Loader2, Receipt, Calendar,
  TrendingUp, RefreshCw, Trash2, Camera, Edit3, Palette, Globe
} from 'lucide-react';
import { fetchProfile, updateProfile, changePassword, deleteAccount, fetchCustomerAnalytics } from '../../services/api';
import { formatISTDisplay } from '../../utils/timezone';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import { useTranslation } from 'react-i18next';

// ============== TOAST NOTIFICATION COMPONENT ==============
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-500' : 'bg-amber-500';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? X : AlertTriangle;

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right max-w-sm`}>
      <Icon size={18} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto p-1 hover:bg-white/20 rounded-full">
        <X size={14} />
      </button>
    </div>
  );
};

// ============== SKELETON LOADER ==============
const ProfileSkeleton = () => {
  const { isDark } = useTheme();
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 animate-pulse">
      <div className={`h-8 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded w-40`} />
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-2xl border`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className={`h-5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded w-32`} />
            <div className={`h-4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded w-48`} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className={`h-24 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-2xl`} />)}
      </div>
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border p-4 space-y-4`}>
        {[1, 2, 3, 4].map(i => <div key={i} className={`h-12 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg`} />)}
      </div>
    </div>
  );
};

// ============== MODAL COMPONENT ==============
const Modal = ({ isOpen, onClose, title, children }) => {
  const { isDark } = useTheme();
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          <button onClick={onClose} className={`p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-full transition-colors`}>
            <X size={18} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
const CustomerProfile = () => {
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  
  // Core state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [originalForm, setOriginalForm] = useState({});
  
  // UI state
  const [toast, setToast] = useState(null);
  const [activeSection, setActiveSection] = useState('personal'); // personal, address, security
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ totalSpent: 0, receiptCount: 0 });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ============== LOAD PROFILE ==============
  const loadProfile = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    
    try {
      const [profileRes, analyticsRes] = await Promise.allSettled([
        fetchProfile(),
        fetchCustomerAnalytics(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value.data;
        setProfile(data);
        const formData = {
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || '',
          line1: data?.address?.line1 || '',
          line2: data?.address?.line2 || '',
          city: data?.address?.city || '',
          state: data?.address?.state || '',
          postalCode: data?.address?.postalCode || '',
          country: data?.address?.country || '',
        };
        setForm(formData);
        setOriginalForm(formData);
      }

      if (analyticsRes.status === 'fulfilled') {
        const analytics = analyticsRes.value.data;
        // Handle both old and new analytics API structure
        const totalSpent = analytics.summary?.thisYear?.total || analytics.summary?.thisMonth?.total || analytics.totalSpent || 0;
        const receiptCount = analytics.summary?.thisYear?.count || analytics.summary?.thisMonth?.count || analytics.categories?.reduce((sum, c) => sum + c.count, 0) || 0;
        setStats({
          totalSpent,
          receiptCount,
        });
      }
    } catch (e) {
      setToast({ message: t('profile.messages.loadFailed'), type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ============== DERIVED STATE ==============
  const initials = useMemo(() => 
    (profile?.name || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'GR',
    [profile?.name]
  );

  const hasChanges = useMemo(() => {
    return Object.keys(form).some(key => form[key] !== originalForm[key]);
  }, [form, originalForm]);

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null;
    return formatISTDisplay(profile.createdAt, {
      month: 'long',
      year: 'numeric'
    });
  }, [profile?.createdAt]);

  // ============== VALIDATION ==============
  const validateForm = () => {
    if (form.name.trim().length < 2) {
      setToast({ message: t('profile.messages.nameTooShort'), type: 'error' });
      return false;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setToast({ message: t('profile.messages.invalidEmail'), type: 'error' });
      return false;
    }
    if (form.phone && form.phone.length < 7) {
      setToast({ message: t('profile.messages.phoneTooShort'), type: 'error' });
      return false;
    }
    return true;
  };

  // ============== HANDLERS ==============
  const handleSave = async () => {
    if (!hasChanges) {
      setToast({ message: t('profile.messages.noChanges'), type: 'warning' });
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    const previousForm = { ...form };
    
    try {
      const payload = {
        name: form.name?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: {
          line1: form.line1?.trim() || undefined,
          line2: form.line2?.trim() || undefined,
          city: form.city?.trim() || undefined,
          state: form.state?.trim() || undefined,
          postalCode: form.postalCode?.trim() || undefined,
          country: form.country?.trim() || undefined,
        },
      };

      // Clean empty values
      payload.address = Object.fromEntries(
        Object.entries(payload.address).filter(([, v]) => v)
      );
      if (!Object.keys(payload.address).length) delete payload.address;
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      const { data } = await updateProfile(payload);
      setProfile(data);
      setOriginalForm({ ...form });
      setToast({ message: t('profile.messages.profileUpdated'), type: 'success' });
    } catch (e) {
      // Rollback on error
      setForm(previousForm);
      setToast({ message: e?.response?.data?.message || t('profile.messages.updateFailed'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 6) {
      setToast({ message: t('profile.messages.passwordTooShort'), type: 'error' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: t('profile.messages.passwordMismatch'), type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setToast({ message: t('profile.messages.passwordChanged'), type: 'success' });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setToast({ message: e?.response?.data?.message || t('profile.messages.passwordChangeFailed'), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setToast({ message: t('profile.messages.deleteConfirm'), type: 'error' });
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      window.location.href = '/';
    } catch (e) {
      setToast({ message: e?.response?.data?.message || t('profile.messages.deleteFailed'), type: 'error' });
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm(t('profile.messages.logoutConfirm'))) return;
    await logout();
    window.location.href = '/customer-login';
  };

  // Language change handler
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('greenreceipt-lang', lang);
  };

  const handleRefresh = () => loadProfile(true);

  // ============== RENDER ==============
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('profile.title')}</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-full transition-colors disabled:opacity-50`}
        >
          <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''} ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-white/30">
              {initials}
            </div>
            {profile?.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle size={14} className="text-emerald-600" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold truncate">{profile?.name || t('profile.yourName')}</h3>
            <p className="text-emerald-100 text-sm truncate">{profile?.email}</p>
            {memberSince && (
              <p className="text-emerald-200/70 text-xs mt-1">{t('profile.memberSince', { date: memberSince })}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm text-center`}>
          <Receipt className="mx-auto mb-2 text-emerald-500" size={24} />
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.receiptCount}</p>
          <p className="text-xs text-slate-500">{t('profile.stats.receipts')}</p>
        </div>
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm text-center`}>
          <TrendingUp className="mx-auto mb-2 text-blue-500" size={24} />
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{stats.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{t('profile.stats.totalSpent')}</p>
        </div>
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm text-center`}>
          <Calendar className="mx-auto mb-2 text-purple-500" size={24} />
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.receiptCount > 0 ? Math.ceil(stats.totalSpent / stats.receiptCount) : 0}</p>
          <p className="text-xs text-slate-500">{t('profile.stats.avgPerReceipt')}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className={`flex gap-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} p-1 rounded-xl`}>
        {[
          { id: 'personal', label: t('profile.tabs.personal'), icon: User },
          { id: 'address', label: t('profile.tabs.address'), icon: MapPin },
          { id: 'security', label: t('profile.tabs.security'), icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === tab.id 
                ? `${isDark ? 'bg-slate-700 text-emerald-400' : 'bg-white text-emerald-600'} shadow-sm` 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Personal Info Section */}
      {activeSection === 'personal' && (
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm overflow-hidden animate-fade-in`}>
          <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-700'} flex items-center gap-2`}>
              <User size={18} className="text-emerald-500" />
              {t('profile.personal.title')}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('profile.personal.fullName')} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                placeholder={t('profile.personal.fullNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('profile.personal.email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                placeholder={t('profile.personal.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('profile.personal.phone')}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                placeholder={t('profile.personal.phonePlaceholder')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Address Section */}
      {activeSection === 'address' && (
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm overflow-hidden animate-fade-in`}>
          <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-700'} flex items-center gap-2`}>
              <MapPin size={18} className="text-emerald-500" />
              {t('profile.address.title')}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('profile.address.line1')}
              </label>
              <input
                type="text"
                value={form.line1}
                onChange={(e) => setForm(f => ({ ...f, line1: e.target.value }))}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                placeholder={t('profile.address.line1Placeholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('profile.address.line2')}
              </label>
              <input
                type="text"
                value={form.line2}
                onChange={(e) => setForm(f => ({ ...f, line2: e.target.value }))}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                placeholder={t('profile.address.line2Placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('profile.address.city')}
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                  placeholder={t('profile.address.cityPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('profile.address.state')}
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                  placeholder={t('profile.address.statePlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('profile.address.postalCode')}
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value }))}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                  placeholder={t('profile.address.postalCodePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('profile.address.country')}
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                  placeholder={t('profile.address.countryPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="space-y-4 animate-fade-in">
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm overflow-hidden`}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-700'} flex items-center gap-2`}>
                <Shield size={18} className="text-emerald-500" />
                {t('profile.security.title')}
              </h3>
            </div>
            <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
              <button
                onClick={() => setShowPasswordModal(true)}
                className={`w-full p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-lg`}>
                    <Lock size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('profile.security.changePassword')}</p>
                    <p className="text-xs text-slate-400">{t('profile.security.changePasswordDesc')}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-lg`}>
                    <CheckCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('profile.security.emailVerified')}</p>
                    <p className="text-xs text-slate-400">{profile?.email}</p>
                  </div>
                </div>
                {profile?.isVerified ? (
                  <span className={`text-xs font-bold ${isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-50'} px-3 py-1 rounded-full`}>
                    {t('profile.verified')}
                  </span>
                ) : (
                  <span className={`text-xs font-bold ${isDark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-600 bg-amber-50'} px-3 py-1 rounded-full`}>
                    {t('profile.pending')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className={`${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'} rounded-2xl border overflow-hidden`}>
            <div className={`p-4 border-b ${isDark ? 'border-red-900/30' : 'border-red-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-700'} flex items-center gap-2`}>
                <AlertTriangle size={18} />
                {t('profile.dangerZone.title')}
              </h3>
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowDeleteModal(true)}
                className={`w-full p-3 flex items-center justify-between ${isDark ? 'bg-slate-800 border-red-900/30 hover:bg-red-900/20' : 'bg-white border-red-200 hover:bg-red-50'} border rounded-xl transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={18} className="text-red-500" />
                  <div className="text-left">
                    <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>{t('profile.dangerZone.deleteAccount')}</p>
                    <p className="text-xs text-red-400">{t('profile.dangerZone.deleteAccountDesc')}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {(activeSection === 'personal' || activeSection === 'address') && (
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            hasChanges 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700' 
              : `${isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'} cursor-not-allowed`
          } disabled:opacity-60`}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('profile.saveButton.saving')}
            </>
          ) : (
            <>
              <Save size={18} />
              {hasChanges ? t('profile.saveButton.saveChanges') : t('profile.saveButton.noChanges')}
            </>
          )}
        </button>
      )}

      {/* Language Settings */}
      <div className={`w-full mb-4 p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Globe size={18} />
          </div>
          <div className="text-left">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('profile.language.title')}</p>
            <p className="text-xs text-slate-400">{t('profile.language.selectLanguage')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              i18n.language === 'en'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('profile.language.english')}
          </button>
          <button
            onClick={() => handleLanguageChange('hi')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              i18n.language === 'hi'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('profile.language.hindi')}
          </button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className={`w-full mb-4 p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
            <Palette size={18} />
          </div>
          <div className="text-left">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('profile.appearance.darkMode')}</p>
            <p className="text-xs text-slate-400">{t('profile.appearance.switchTheme')}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-red-600 hover:bg-slate-700 hover:border-red-900/30 hover:text-red-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-red-200 hover:text-red-600'} border p-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all`}
      >
        <LogOut size={18} /> {t('common.logout')}
      </button>
      
      <p className="text-center text-xs text-slate-400">{t('common.version')} 1.0.0 • {t('common.appName')}</p>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title={t('profile.security.changePassword')}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.security.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                className={`w-full px-4 py-3 pr-12 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm outline-none focus:border-emerald-500`}
                placeholder={t('profile.security.currentPasswordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.security.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                className={`w-full px-4 py-3 pr-12 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm outline-none focus:border-emerald-500`}
                placeholder={t('profile.security.newPasswordPlaceholder')}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.security.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className={`w-full px-4 py-3 pr-12 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm outline-none focus:border-emerald-500`}
                placeholder={t('profile.security.confirmPasswordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {changingPassword ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('profile.security.changing')}
              </>
            ) : (
              t('profile.security.updatePassword')
            )}
          </button>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title={t('profile.dangerZone.deleteAccount')}
      >
        <div className="space-y-4">
          <div className={`p-4 ${isDark ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'} border rounded-xl`}>
            <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              {t('profile.dangerZone.deleteWarning')}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('profile.dangerZone.typeDelete')}
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} border rounded-xl text-sm outline-none focus:border-red-500`}
              placeholder="DELETE"
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmation !== 'DELETE'}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('profile.dangerZone.deleting')}
              </>
            ) : (
              <>
                <Trash2 size={18} />
                {t('profile.dangerZone.deleteMyAccount')}
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CustomerProfile;