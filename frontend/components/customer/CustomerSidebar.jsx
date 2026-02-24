import React from 'react';
import { Home, FileText, Calendar, PieChart, User, LogOut, Receipt, Bell } from 'lucide-react';

const CustomerSidebar = ({ activeTab, onNavigate }) => {
  
  // Navigation Items Configuration
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'receipts', icon: FileText, label: 'Receipts' },
    { id: 'calendar', icon: Calendar, label: 'History' },
    { id: 'insights', icon: PieChart, label: 'Insights' },
    // 👇 ADDED ALERTS HERE (Visible on Desktop & Mobile)
    { id: 'notifications', icon: Bell, label: 'Alerts', hasBadge: true }, 
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* 🖥️ DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 h-screen sticky top-0">
        
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8 mt-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Receipt size={18} />
          </div>
          <span className="text-xl font-bold text-slate-900">GreenReceipt</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1 relative ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <div className="relative">
                <item.icon size={20} />
                {/* 🔴 Desktop Badge */}
                {item.hasBadge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout (Desktop Only) */}
        <div className="mt-auto pt-4 border-t border-slate-50">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
            <LogOut size={20} /><span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM BAR (Instagram Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center z-40 pb-safe">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform relative p-2"
            >
              {/* Icon */}
              <div className={`relative ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {/* 🔴 Mobile Badge */}
                {item.hasBadge && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
              </div>
              
              {/* Optional Label */}
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CustomerSidebar;