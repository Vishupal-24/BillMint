import React from 'react';
import { Bell, Clock, AlertTriangle, Leaf, Tag, CheckCircle } from 'lucide-react';

const CustomerNotifications = () => {
  
  // 🧠 SMART NOTIFICATIONS DATA
  const notifications = [
    {
      id: 1,
      type: 'warranty', // urgent
      title: 'Warranty Expiring Soon',
      message: 'The warranty for "Sony WH-1000XM5" expires in 3 days. Need to claim repairs?',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'budget', // warning
      title: 'Monthly Budget Alert',
      message: 'You have used 85% of your "Eating Out" budget for December.',
      time: '5 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'eco', // success
      title: 'Green Milestone Reached! 🌱',
      message: 'Congratulations! You have saved 1kg of paper receipts this year.',
      time: 'Yesterday',
      read: true
    },
    {
      id: 4,
      type: 'return', // info
      title: 'Return Window Closing',
      message: 'Last chance to return items from your "Zara" purchase on Dec 10.',
      time: '2 days ago',
      read: true
    }
  ];

  // Helper to get icon and color based on type
  const getStyle = (type) => {
    switch(type) {
        case 'warranty': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        case 'budget': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        case 'eco': return { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        default: return { icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Smart Alerts</h2>
        <button className="text-xs font-bold text-emerald-600 hover:underline">Mark all read</button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.map((notif) => {
            const style = getStyle(notif.type);
            const Icon = style.icon;

            return (
                <div 
                    key={notif.id} 
                    className={`p-4 rounded-2xl border flex gap-4 transition-all hover:bg-slate-50 relative overflow-hidden ${notif.read ? 'bg-white border-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                    {/* Unread Dot */}
                    {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500"></div>}

                    {/* Icon Box */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                        <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start pr-4">
                            <h3 className={`font-bold text-sm ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{notif.time}</p>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-400">
            <CheckCircle size={14} /> You're all caught up!
        </div>
      </div>
    </div>
  );
};

export default CustomerNotifications;