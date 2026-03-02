import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Clock, AlertTriangle, Leaf, Tag, CheckCircle, Sparkles, 
  Shield, RotateCcw, X, Check, Filter, CreditCard, Calendar,
  Loader2, RefreshCw
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  fetchNotifications, fetchNotificationCount, 
  markNotificationRead, markAllNotificationsRead, dismissNotification 
} from '../../services/api';
import toast from 'react-hot-toast';

const CustomerNotifications = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Load notifications from API
  const loadNotifications = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const { data } = await fetchNotifications({
        page: currentPage,
        limit: 20,
        type: filter !== 'all' && filter !== 'unread' ? filter : null,
        unreadOnly: filter === 'unread',
      });
      
      const newNotifications = data.notifications || [];
      
      if (reset) {
        setNotifications(newNotifications);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setUnreadCount(data.unreadCount || 0);
      setHasMore(data.pagination?.page < data.pagination?.pages);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to mock data for demo
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true);
    loadNotifications(true);
  }, [filter]);

  // Mark all as read
  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Fallback for demo
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    }
  };

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => 
        n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Fallback for demo
      setNotifications(prev => prev.map(n => 
        n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n
      ));
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await dismissNotification(id);
      const wasUnread = notifications.find(n => (n._id === id || n.id === id) && !(n.isRead || n.read));
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Fallback for demo
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
    }
  };

  // Get style based on type
  const getStyle = (type) => {
    switch(type) {
      case 'bill_reminder':
      case 'bill_due_today':
        return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-500' };
      case 'bill_overdue':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', gradient: 'from-red-500 to-rose-500' };
      case 'warranty': 
        return { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' };
      case 'budget': 
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', gradient: 'from-red-500 to-rose-500' };
      case 'eco': 
        return { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' };
      case 'return': 
        return { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-500' };
      default: 
        return { icon: Tag, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', gradient: 'from-slate-500 to-slate-600' };
    }
  };

  // Get display type label
  const getTypeLabel = (type) => {
    const labels = {
      bill_reminder: 'Bill',
      bill_due_today: 'Bill Due',
      bill_overdue: 'Overdue',
      warranty: 'Warranty',
      budget: 'Budget',
      eco: 'Eco',
      return: 'Return',
      system: 'System',
    };
    return labels[type] || type?.charAt(0).toUpperCase() + type?.slice(1).replace('_', ' ');
  };

  // Format time
  const formatTime = (notif) => {
    if (notif.timeAgo) return notif.timeAgo;
    if (notif.time) return notif.time;
    if (notif.createdAt) {
      const date = new Date(notif.createdAt);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) return days === 1 ? 'Yesterday' : `${days} days ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      return 'Just now';
    }
    return '';
  };

  // Filtered notifications
  const filteredNotifications = notifications;
  const displayUnreadCount = unreadCount || notifications.filter(n => !(n.isRead || n.read)).length;

  // Mock data fallback
  const getMockNotifications = () => [
    {
      id: 1,
      type: 'bill_reminder',
      title: 'Netflix Subscription Due Soon',
      message: 'Your Netflix subscription of ₹649 is due in 3 days (Jan 12).',
      time: '2 hours ago',
      read: false,
      metadata: { billName: 'Netflix', amount: 649, daysUntilDue: 3 }
    },
    {
      id: 2,
      type: 'bill_due_today',
      title: 'Electricity Bill Due Today!',
      message: 'Your Electricity Bill of ₹2,340 is due today. Don\'t forget to pay!',
      time: '5 hours ago',
      read: false,
      metadata: { billName: 'Electricity Bill', amount: 2340, daysUntilDue: 0 }
    },
    {
      id: 3,
      type: 'eco',
      title: 'Green Milestone Reached! 🌱',
      message: 'Congratulations! You have saved 1kg of paper receipts this year.',
      time: 'Yesterday',
      read: true
    },
    {
      id: 4,
      type: 'warranty',
      title: 'Warranty Expiring Soon',
      message: 'The warranty for "Sony WH-1000XM5" expires in 3 days. Need to claim repairs?',
      time: '2 days ago',
      read: true
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-6 pb-24 md:pb-10">
      
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {t('notifications.title', 'Notifications')}
            {displayUnreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{displayUnreadCount}</span>
            )}
          </h1>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('notifications.subtitle', 'Stay updated with alerts and reminders')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); loadNotifications(true); }}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {displayUnreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className={`text-xs md:text-sm font-bold flex items-center gap-1.5 transition-colors px-3 py-2 rounded-lg ${isDark ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
            >
              <Check size={14} /> {t('notifications.markAllRead', 'Mark all read')}
            </button>
          )}
        </div>
      </div>

      {/* ========== FILTER TABS ========== */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {[
          { id: 'all', label: t('notifications.filters.all', 'All') },
          { id: 'unread', label: t('notifications.filters.unread', 'Unread'), count: displayUnreadCount },
          { id: 'bill_reminder', label: 'Bills' },
          { id: 'warranty', label: t('notifications.filters.warranty', 'Warranty') },
          { id: 'eco', label: t('notifications.filters.eco', 'Eco') },
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
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-24 rounded-2xl animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className={`w-16 md:w-20 h-16 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Bell size={28} className={`md:w-8 md:h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
              <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('notifications.noNotifications', 'No notifications')}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('notifications.allCaughtUp', "You're all caught up!")}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const style = getStyle(notif.type);
              const Icon = style.icon;
              const isRead = notif.isRead || notif.read;
              const notifId = notif._id || notif.id;

              return (
                <div 
                  key={notifId} 
                  onClick={() => !isRead && markAsRead(notifId)}
                  className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all relative overflow-hidden group cursor-pointer
                    ${isRead 
                      ? isDark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200' 
                      : isDark ? `bg-slate-800 ${style.border} shadow-sm hover:shadow-md` : `bg-white ${style.border} shadow-sm hover:shadow-md`
                    }
                  `}
                >
                  {/* Unread indicator bar */}
                  {!isRead && (
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
                        <h3 className={`font-bold text-sm md:text-base ${isRead ? (isDark ? 'text-slate-400' : 'text-slate-600') : (isDark ? 'text-white' : 'text-slate-800')}`}>
                          {notif.title}
                        </h3>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isRead && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notifId); }}
                            className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          >
                            <X size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                          </button>
                        </div>
                      </div>
                      
                      <p className={`text-xs md:text-sm mt-1 leading-relaxed ${isRead ? (isDark ? 'text-slate-500' : 'text-slate-400') : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
                        {notif.message}
                      </p>
                      
                      {/* Bill metadata */}
                      {notif.metadata?.amount && (
                        <div className={`flex items-center gap-2 mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            ₹{notif.metadata.amount.toLocaleString('en-IN')}
                          </span>
                          {notif.metadata.dueDate && (
                            <span className="text-xs flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(notif.metadata.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 md:mt-3">
                        <p className={`text-[10px] md:text-xs font-medium flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Clock size={10} className="md:w-3 md:h-3" /> {formatTime(notif)}
                        </p>
                        <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 ' + style.color : style.bg + ' ' + style.color}`}>
                          {getTypeLabel(notif.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========== ALL CAUGHT UP ========== */}
      {filteredNotifications.length > 0 && displayUnreadCount === 0 && (
        <div className="text-center py-6 md:py-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <Sparkles size={16} className="text-emerald-500" />
            <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {t('notifications.allCaughtUp', "You're all caught up!")}
            </span>
          </div>
        </div>
      )}

      {/* Scrollbar hide style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CustomerNotifications;
