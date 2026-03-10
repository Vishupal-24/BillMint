// import React from 'react';
// import { 
//   LayoutDashboard, 
//   Calendar, 
//   PlusCircle, 
//   BarChart3, 
//   Package, 
//   User, 
//   ShoppingBag, 
//   LogOut, 
//   X 
// } from 'lucide-react';
// // We don't need useNavigate anymore for the hard reload method

// const MerchantSidebar = ({ activeTab, onNavigate, isOpen, onClose }) => {

//   // Helper for Nav Items
//   const NavItem = ({ id, icon: Icon, label }) => (
//     <button 
//       onClick={() => { onNavigate(id); onClose(); }} 
//       className={`
//         w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1
//         ${activeTab === id 
//           ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
//           : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
//       `}
//     >
//       <Icon size={20} /> 
//       <span>{label}</span>
//     </button>
//   );

//   const handleLogout = () => {
//     // 1. Clear all auth data
//     localStorage.removeItem('token');
//     localStorage.removeItem('role');
    
//     // 2. FORCE RELOAD to the login page
//     // This is better than navigate() because it clears all React state memory
//     window.location.href = '/';
//   };

//   return (
//     <>
//       {/* 📱 Mobile Overlay (Backdrop) */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
//           onClick={onClose}
//         />
//       )}

//       {/* 🔹 SIDEBAR CONTAINER */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 
//         transition-transform duration-300 ease-out
//         flex flex-col h-full  /* 👈 CHANGED: Uses Flexbox for height */
//         md:static md:translate-x-0 
//         ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
//       `}>
        
//         {/* Header / Logo */}
//         <div className="flex items-center justify-between px-2 mb-8 mt-2 shrink-0">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
//               <ShoppingBag size={18} />
//             </div>
//             <span className="text-xl font-bold text-slate-900">GreenReceipt</span>
//           </div>
          
//           {/* Close Button (Mobile Only) */}
//           <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:bg-slate-100 rounded-full">
//             <X size={20} />
//           </button>
//         </div>

//         {/* Navigation Links (Flex-1 takes up available space) */}
//         <nav className="flex-1 space-y-1 overflow-y-auto">
//           <NavItem id="overview" icon={LayoutDashboard} label="Overview" />
//           <NavItem id="calendar" icon={Calendar} label="Calendar" />
//           <NavItem id="billing" icon={PlusCircle} label="Create Bill" />
//           <NavItem id="insights" icon={BarChart3} label="Sales Insights" />
//           <NavItem id="items" icon={Package} label="Items" />
//           <NavItem id="profile" icon={User} label="Profile" />
//         </nav>

//       </aside>
//     </>
//   );
// };

// export default MerchantSidebar;

// import React from 'react';
// import { 
//   LayoutDashboard, 
//   Calendar, 
//   PlusCircle, 
//   BarChart3, 
//   Package, 
//   User, 
//   Store, 
//   LogOut, 
//   X,
//   ChevronRight
// } from 'lucide-react';

// const MerchantSidebar = ({ activeTab, onNavigate, isOpen, onClose }) => {

//   // 🚪 Logout Logic
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('role');
//     window.location.href = '/'; // Hard Refresh to clear state
//   };

//   // 🎨 Helper Component for Menu Items
//   const NavItem = ({ id, icon: Icon, label, subLabel }) => {
//     const isActive = activeTab === id;

//     return (
//       <button 
//         onClick={() => { onNavigate(id); onClose(); }} 
//         className={`
//           w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out group relative
//           ${isActive 
//             ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-[1.02]' 
//             : 'text-slate-700 hover:bg-white hover:text-slate-800 hover:shadow-sm'}
//         `}
//       >
//         {/* Icon Box */}
//         <div className={`
//            p-2 rounded-xl transition-colors duration-300
//            ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-transparent group-hover:bg-slate-50'}
//         `}>
//           <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
//         </div>

//         {/* Text */}
//         <div className="text-left flex-1">
//           <span className={`block text-sm ${isActive ? 'font-black tracking-wide' : 'font-bold'}`}>
//             {label}
//           </span>
//           {subLabel && (
//              <span className="text-[10px] font-medium opacity-65 block mt-0.5">
//                {subLabel}
//              </span>
//           )}
//         </div>

//         {/* Active Indicator Arrow */}
//         {isActive && <ChevronRight size={16} className="text-emerald-400 opacity-50" />}
//       </button>
//     );
//   };

//   return (
//     <>
//       {/* 📱 Mobile Overlay (Backdrop) */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity" 
//           onClick={onClose}
//         />
//       )}

//       {/* 🔹 SIDEBAR CONTAINER */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-40 w-72 bg-slate-50/80 border-r border-slate-200 backdrop-blur-xl
//         transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
//         flex flex-col h-full
//         md:static md:translate-x-0 
//         ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
//       `}>

//       {/* <aside className={`
//         fixed inset-y-0 left-0 z-40 w-72 
//         bg-white/95 border-r border-slate-200 backdrop-blur-xl  
//         transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
//         flex flex-col h-full
//         md:static md:translate-x-0 
//         ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
//       `}> */}
        
//         {/* HEADER / LOGO */}
//         <div className="h-24 flex items-center justify-between px-6 shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
//               <Store size={20} />
//             </div>
//             <div>
//               <h1 className="font-black text-lg text-slate-900 tracking-tight leading-none">GreenReceipt</h1>
//               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Merchant App</p>
//             </div>
//           </div>
          
//           {/* Close Button (Mobile) */}
//           <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-full transition-all">
//             <X size={20} />
//           </button>
//         </div>

//         {/* NAVIGATION LIST (Scrollable) */}
//         <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 no-scrollbar">
//           <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 mt-2">Main Menu</p>
          
//           <NavItem id="overview" icon={LayoutDashboard} label="Overview" subLabel="Dashboard" />
//           <NavItem id="billing" icon={PlusCircle} label="Create Bill" subLabel="New Transaction" />
//           <NavItem id="calendar" icon={Calendar} label="Calendar" subLabel="Sales History" />
//           <NavItem id="insights" icon={BarChart3} label="Sales Insights" subLabel="Analytics" />
//           <NavItem id="items" icon={Package} label="Items" subLabel="Inventory" />
//           <NavItem id="profile" icon={User} label="Profile" subLabel="Shop Settings" />
//         </div>

//       </aside>
//     </>
//   );
// };

// export default MerchantSidebar;

import React from 'react';
import { NavLink } from 'react-router-dom'; // 👈 1. Import NavLink
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  BarChart3, 
  Package, 
  User, 
  Store, 
  X,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { logoutUser, clearSession } from '../../services/api';

const MerchantSidebar = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // 🚪 Logout Logic
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      await logoutUser();
    } catch (e) {
      // Ignore network/server errors; we still clear local session.
    } finally {
      clearSession();
      window.location.href = '/';
    }
  };

  // 🎨 Helper Component for Menu Items
  // Note: We changed props from 'id' to 'to'
  const NavItem = ({ to, icon: Icon, label, subLabel }) => {
    return (
      <NavLink 
        to={to}
        onClick={onClose} // Close sidebar on mobile click
        className={({ isActive }) => `
          w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out group relative
          ${isActive 
            ? isDark
              ? 'bg-slate-800 text-emerald-400 shadow-lg shadow-black/20' 
              : 'bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-[1.02]'
            : isDark
              ? 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              : 'text-slate-700 hover:bg-white hover:text-slate-800 hover:shadow-sm'}
        `}
      >
        {({ isActive }) => (
          <>
            {/* Icon Box */}
            <div className={`
               p-2 rounded-xl transition-colors duration-300
               ${isActive 
                 ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                 : isDark ? 'bg-transparent group-hover:bg-slate-700' : 'bg-transparent group-hover:bg-slate-50'}
            `}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            {/* Text */}
            <div className="text-left flex-1">
              <span className={`block text-sm ${isActive ? 'font-black tracking-wide' : 'font-bold'}`}>
                {label}
              </span>
              {subLabel && (
                 <span className={`text-[10px] font-medium block mt-0.5 ${
                   isDark ? 'opacity-50' : 'opacity-65'
                 }`}>
                   {subLabel}
                 </span>
              )}
            </div>

            {/* Active Indicator Arrow */}
            {isActive && <ChevronRight size={16} className={`opacity-50 ${isDark ? 'text-emerald-400' : 'text-emerald-400'}`} />}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* 📱 Mobile Overlay (Backdrop) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* 🔹 SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 
        border-r backdrop-blur-xl  
        transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
        flex flex-col h-full
        md:static md:translate-x-0 
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        ${isDark 
          ? 'bg-[#18181b]/95 border-slate-800' 
          : 'bg-white/95 border-slate-200'}
      `}>
        
        {/* HEADER / LOGO */}
        <div className="h-24 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                : 'bg-slate-900 shadow-slate-900/20'
            }`}>
              <Store size={20} />
            </div>
            <div>
              <h1 className={`font-black text-lg tracking-tight leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>{t('common.appName')}</h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                isDark ? 'text-slate-500' : 'text-slate-500'
              }`}>Merchant App</p>
            </div>
          </div>
          
          {/* Theme Toggle & Close Button */}
          <div className="flex items-center gap-2">
            {/* Close Button (Mobile) */}
            <button onClick={onClose} className={`md:hidden p-2 rounded-full transition-all ${
              isDark 
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                : 'text-slate-500 hover:bg-white hover:shadow-sm'
            }`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 no-scrollbar">
          <p className={`px-4 text-[10px] font-black uppercase tracking-widest mb-3 mt-2 ${
            isDark ? 'text-slate-500' : 'text-slate-600'
          }`}>{t('nav.mainMenu') || 'Main Menu'}</p>
          
          {/* 👇 UPDATED LINKS: Pointing to real routes now */}
          <NavItem to="/merchant/overview" icon={LayoutDashboard} label={t('nav.overview')} subLabel={t('dashboard.title')} />
          <NavItem to="/merchant/billing" icon={PlusCircle} label={t('nav.billing')} subLabel={t('nav.newTransaction') || 'New Transaction'} />
          {/* <NavItem to="/merchant/verify" icon={CheckCircle} label="Verify Payments" subLabel="Awaiting Confirmation" /> */}
          <NavItem to="/merchant/calendar" icon={Calendar} label={t('nav.calendar')} subLabel={t('nav.salesHistory') || 'Sales History'} />
          <NavItem to="/merchant/insights" icon={BarChart3} label={t('nav.salesInsights')} subLabel={t('nav.analytics') || 'Analytics'} />
          <NavItem to="/merchant/items" icon={Package} label={t('nav.items')} subLabel={t('nav.inventory') || 'Inventory'} />
          <NavItem to="/merchant/profile" icon={User} label={t('nav.profile')} subLabel={t('nav.shopSettings') || 'Shop Settings'} />
        </div>

        {/* LOGOUT BUTTON */}
        {/* <div className="p-4 border-t border-slate-100">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-bold text-sm group"
           >
             <LogOut size={20} />
             <span>Sign Out</span>
           </button>
        </div> */}

      </aside>
    </>
  );
};

export default MerchantSidebar;