import React, { useMemo } from 'react';
import { Home, FileText, Calendar, PieChart, User, Receipt, Bell, Leaf, Sparkles, TreePine, Droplets, CreditCard, Wallet } from 'lucide-react';
import { formatISTDate, getTodayIST } from '../../utils/timezone';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CustomerSidebar = ({ activeTab, onNavigate, receipts = [] }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  // Calculate Eco Impact based on receipts
  const ecoImpact = useMemo(() => {
    // Average paper receipt = 3.5g (including thermal paper coating)
    // Each digital receipt saves approximately 3.5g of paper
    const paperPerReceipt = 0.0035; // kg
    const treeSavingRate = 0.06; // kg paper per small tree saved (simplified)
    const waterPerKgPaper = 10; // liters of water per kg paper
    
    const totalReceipts = receipts.length;
    const paperSaved = totalReceipts * paperPerReceipt;
    const treeContribution = paperSaved / treeSavingRate;
    const waterSaved = paperSaved * waterPerKgPaper;
    
    // Get this month's receipts using IST
    const monthPrefix = getTodayIST().slice(0, 7); // YYYY-MM
    const thisMonthReceipts = receipts.filter(r => {
      const dateStr = (r.date && String(r.date).slice(0, 10)) || formatISTDate(r.createdAt);
      return dateStr ? dateStr.startsWith(monthPrefix) : false;
    });
    const monthlyPaperSaved = thisMonthReceipts.length * paperPerReceipt;
    
    return {
      totalReceipts,
      monthlyReceipts: thisMonthReceipts.length,
      paperSaved: paperSaved.toFixed(2),
      monthlyPaperSaved: monthlyPaperSaved.toFixed(2),
      treeContribution: treeContribution.toFixed(1),
      waterSaved: waterSaved.toFixed(0),
    };
  }, [receipts]);

  // Navigation Items
  const navItems = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'receipts', icon: FileText, label: t('nav.receipts') },
    { id: 'bills', icon: CreditCard, label: t('nav.bills', 'Bills') },
    { id: 'pending', icon: Wallet, label: t('nav.pending', 'Pending') },
    { id: 'calendar', icon: Calendar, label: t('nav.history') },
    { id: 'insights', icon: PieChart, label: t('nav.insights') },
    { id: 'notifications', icon: Bell, label: t('nav.alerts'), hasBadge: true },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];
  
  // Mobile nav items (show main ones only for space)
  const mobileNavItems = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'receipts', icon: FileText, label: t('nav.receipts') },
    // { id: 'pending', icon: Wallet, label: t('nav.pending', 'Pending') },
        { id: 'bills', icon: CreditCard, label: t('nav.bills', 'Bills') },
    { id: 'insights', icon: PieChart, label: t('nav.insights') },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <>
      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 lg:w-72 border-r h-screen sticky top-0 transition-colors duration-300 ${
        isDark 
          ? 'bg-[#18181b] border-slate-800' 
          : 'bg-white border-slate-200'
      }`}>
        
        {/* Logo Header */}
        <div className={`p-6 border-b transition-colors duration-300 ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg ${
                isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-500/25'
              }`}>
                <Leaf size={20} />
              </div>
              <div>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('common.appName')}</span>
                <p className={`text-[10px] font-medium -mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.tagline')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative group ${
                  isActive 
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5' 
                      : 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                    isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                  }`} />
                )}
                
                <div className="relative">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {item.hasBadge && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${
                      isDark ? 'border-[#18181b]' : 'border-white'
                    }`}></span>
                  )}
                </div>
                <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                
                {/* Hover glow */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl pointer-events-none ${
                    isDark ? 'bg-emerald-400/5' : 'bg-emerald-500/5'
                  }`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - Eco Impact */}
        <div className={`p-4 border-t transition-colors duration-300 ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className={`p-4 rounded-xl border transition-colors duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' 
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
          }`}>
            <div className={`flex items-center gap-2 mb-3 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase">{t('ecoImpact.title')}</span>
            </div>
            
            {/* Main stat */}
            <p className={`text-sm font-medium mb-3 ${
              isDark ? 'text-emerald-300' : 'text-emerald-800'
            }`}>
              {t('ecoImpact.paperSaved', { amount: ecoImpact.monthlyPaperSaved })}
            </p>
            
            {/* Detailed stats */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`rounded-lg p-2 text-center ${
                isDark ? 'bg-slate-800/50' : 'bg-white/60'
              }`}>
                <div className={`flex items-center justify-center gap-1 mb-0.5 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <Receipt size={12} />
                </div>
                <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{ecoImpact.monthlyReceipts}</p>
                <p className={`text-[9px] font-medium ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>{t('ecoImpact.thisMonth')}</p>
              </div>
              <div className={`rounded-lg p-2 text-center ${
                isDark ? 'bg-slate-800/50' : 'bg-white/60'
              }`}>
                <div className={`flex items-center justify-center gap-1 mb-0.5 ${
                  isDark ? 'text-teal-400' : 'text-teal-600'
                }`}>
                  <Droplets size={12} />
                </div>
                <p className={`text-lg font-bold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>{ecoImpact.waterSaved}L</p>
                <p className={`text-[9px] font-medium ${isDark ? 'text-teal-500' : 'text-teal-600'}`}>{t('ecoImpact.waterSaved')}</p>
              </div>
            </div>
            
            {/* Total all-time */}
            <div className={`mt-3 pt-3 border-t text-center ${
              isDark ? 'border-emerald-500/20' : 'border-emerald-200/50'
            }`}>
              <p className={`text-[10px] ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                {t('ecoImpact.allTime', { receipts: ecoImpact.totalReceipts, paper: ecoImpact.paperSaved })}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 📱 MOBILE BOTTOM BAR */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-40 safe-area-bottom transition-colors duration-300 ${
        isDark 
          ? 'bg-[#18181b]/95 border-slate-800' 
          : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex justify-around items-center px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all active:scale-95 relative flex-1 ${
                  isActive 
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {/* Active background */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl ${
                    isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                  }`} />
                )}
                
                <div className="relative z-10">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] relative z-10 ${
                  isActive 
                    ? isDark ? 'font-bold text-emerald-400' : 'font-bold text-emerald-700'
                    : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Safe area spacer for iOS */}
        <div className={`h-safe-area-inset-bottom ${isDark ? 'bg-[#18181b]' : 'bg-white'}`} />
      </div>

      {/* Styles for safe area */}
      <style>{`
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0); }
        .h-safe-area-inset-bottom { height: env(safe-area-inset-bottom, 0); }
      `}</style>
    </>
  );
};

export default CustomerSidebar;