import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, AlertTriangle, Leaf, Tag, CheckCircle, Sparkles, Shield, RotateCcw, X, Check, Filter, ChevronDown, Wallet } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api'; // Assuming you have these API functions
import toast from 'react-hot-toast';

const CustomerNotifications = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  // Notification data
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  // Load notifications from API
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await fetchNotifications();
      // data should be { notifications: [...], unreadCount: 5 }
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    //   toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  // Mark single as read
  const markAsRead = async (id) => {
    try {
        // Optimistic update
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        await markNotificationRead(id);
    } catch (error) {
        console.error("Failed to mark as read", error);
    }
  };

  // Delete notification (Not implemented in backend yet, so just local remove for now or skipping)
  const deleteNotification = (id) => {
    // setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Get style based on type
  const getStyle = (type) => {
    switch(type) {
      case 'bill_due_today': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' };
      case 'bill_overdue': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', gradient: 'from-red-500 to-rose-500' };
      case 'bill_reminder': return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-500' };
      case 'pending_created': return { icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' };
      case 'pending_paid': return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' };
      case 'warranty': return { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' };
      case 'budget': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', gradient: 'from-red-500 to-rose-500' };
      case 'eco': return { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' };
      case 'return': return { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-500' };
      case 'payment_reminder': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', gradient: 'from-orange-500 to-red-500' };
      default: return { icon: Tag, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', gradient: 'from-slate-500 to-slate-600' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const billTypes = ['bill_reminder', 'bill_due_today', 'bill_overdue'];
  const khataTypes = ['pending_created', 'payment_reminder', 'pending_paid'];
  const billCount = notifications.filter(n => billTypes.includes(n.type)).length;
  const khataCount = notifications.filter(n => khataTypes.includes(n.type)).length;
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.isRead)
      : filter === 'bills'
        ? notifications.filter(n => billTypes.includes(n.type))
        : filter === 'khata'
          ? notifications.filter(n => khataTypes.includes(n.type))
          : notifications.filter(n => n.type === filter);

  if (isLoading) {
    return (
        <div className="max-w-3xl mx-auto py-12 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading notifications...</p>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-6 pb-24 md:pb-10">
      
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t('notifications.title')}
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('notifications.subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className={`text-xs md:text-sm font-bold flex items-center gap-1.5 transition-colors px-3 py-2 rounded-lg self-start sm:self-auto ${isDark ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
          >
            <Check size={14} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* ========== FILTER TABS ========== */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {[
          { id: 'all', label: t('notifications.filters.all') },
          { id: 'unread', label: t('notifications.filters.unread'), count: unreadCount },
          { id: 'bills', label: 'Bills', count: billCount },
          { id: 'khata', label: 'Khata', count: khataCount },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === f.id 
                ? isDark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
                : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
            {f.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-red-500 text-white'}`}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* ========== NOTIFICATIONS LIST ========== */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className={`w-16 md:w-20 h-16 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Bell size={28} className={`md:w-8 md:h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('notifications.noNotifications')}</p>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('notifications.allCaughtUp')}</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const style = getStyle(notif.type);
            const Icon = style.icon;

            return (
              <div 
                key={notif._id} 
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all relative overflow-hidden group cursor-pointer
                  ${notif.isRead 
                    ? isDark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200' 
                    : isDark ? `bg-slate-800 ${style.border} shadow-sm hover:shadow-md` : `bg-white ${style.border} shadow-sm hover:shadow-md`
                  }
                `}
              >
                {/* Unread indicator bar */}
                {!notif.isRead && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.gradient}`} />
                )}

                <div className="flex gap-3 md:gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                    <Icon size={18} className="md:w-5 md:h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-sm md:text-base ${notif.isRead ? (isDark ? 'text-slate-400' : 'text-slate-600') : (isDark ? 'text-white' : 'text-slate-800')}`}>
                        {notif.title}
                      </h3>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                        {/* 
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                          className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                          <X size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        </button>
                        */}
                      </div>
                    </div>
                    
                    <p className={`text-xs md:text-sm mt-1 leading-relaxed ${notif.isRead ? (isDark ? 'text-slate-500' : 'text-slate-400') : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
                      {notif.message}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 md:mt-3">
                      <p className={`text-[10px] md:text-xs font-medium flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Clock size={10} className="md:w-3 md:h-3" /> {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;