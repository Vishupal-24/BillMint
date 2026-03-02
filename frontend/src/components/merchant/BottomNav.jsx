// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import { Home, History, Plus, Package, Menu } from 'lucide-react';

// const BottomNav = () => {
//   const navigate = useNavigate();

//   // Helper to make classes cleaner
//   const navClass = ({ isActive }) => 
//     `flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[70px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME */}
//       <NavLink to="/dashboard" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

//       {/* 2. HISTORY */}
//       <NavLink to="/bills" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 3. HERO BUTTON (Floating Center) */}
//       <div className="relative -top-5">
//         <button 
//           onClick={() => navigate('/create-bill')}
//           className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white transform active:scale-90 transition-transform duration-200 border-4 border-slate-50"
//         >
//           <Plus className="w-8 h-8" />
//         </button>
//       </div>

//       {/* 4. INVENTORY */}
//       <NavLink to="/inventory" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. MENU (Profile/Settings) */}
//       <NavLink to="/settings" className={navClass}>
//         <Menu className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Menu</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

// src/components/merchant/BottomNav.jsx
// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import { Home, History, Plus, Package, Menu } from 'lucide-react';

// const BottomNav = () => {
//   const navigate = useNavigate();

//   // Helper for styling active/inactive links
//   const navClass = ({ isActive }) => 
//     `flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[70px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME (Overview) */}
//       <NavLink to="/merchant/overview" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

//       {/* 2. HISTORY (Calendar/Bills) */}
//       <NavLink to="/merchant/calendar" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 3. HERO BUTTON (Billing) */}
//       <div className="relative -top-5">
//         <button 
//           onClick={() => navigate('/merchant/billing')}
//           className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white transform active:scale-90 transition-transform duration-200 border-4 border-slate-50"
//         >
//           <Plus className="w-8 h-8" />
//         </button>
//       </div>

//       {/* 4. ITEMS */}
//       <NavLink to="/merchant/items" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. MENU (Profile) */}
//       <NavLink to="/merchant/profile" className={navClass}>
//         <Menu className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Menu</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import { Home, History, BarChart3, Package, User } from 'lucide-react';

// const BottomNav = () => {
//   // Helper for styling active/inactive links
//   const navClass = ({ isActive }) => 
//     `flex flex-1 flex-col items-center justify-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[65px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME */}
//       <NavLink to="/merchant/overview" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

      
//       {/* 3. INSIGHTS (Replaced the + Button) */}
//       <NavLink to="/merchant/insights" className={navClass}>
//         <BarChart3 className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Insights</span>
//       </NavLink>

      
//       {/* 2. HISTORY */}

//       <NavLink to="/merchant/calendar" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 4. ITEMS */}
//       <NavLink to="/merchant/items" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. PROFILE (Renamed from Menu) */}
//       <NavLink to="/merchant/profile" className={navClass}>
//         <User className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Profile</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import { Home, History, Plus, Package, Menu } from 'lucide-react';

// const BottomNav = () => {
//   const navigate = useNavigate();

//   // Helper to make classes cleaner
//   const navClass = ({ isActive }) => 
//     `flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[70px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME */}
//       <NavLink to="/dashboard" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

//       {/* 2. HISTORY */}
//       <NavLink to="/bills" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 3. HERO BUTTON (Floating Center) */}
//       <div className="relative -top-5">
//         <button 
//           onClick={() => navigate('/create-bill')}
//           className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white transform active:scale-90 transition-transform duration-200 border-4 border-slate-50"
//         >
//           <Plus className="w-8 h-8" />
//         </button>
//       </div>

//       {/* 4. INVENTORY */}
//       <NavLink to="/inventory" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. MENU (Profile/Settings) */}
//       <NavLink to="/settings" className={navClass}>
//         <Menu className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Menu</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

// src/components/merchant/BottomNav.jsx
// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import { Home, History, Plus, Package, Menu } from 'lucide-react';

// const BottomNav = () => {
//   const navigate = useNavigate();

//   // Helper for styling active/inactive links
//   const navClass = ({ isActive }) => 
//     `flex flex-col items-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[70px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME (Overview) */}
//       <NavLink to="/merchant/overview" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

//       {/* 2. HISTORY (Calendar/Bills) */}
//       <NavLink to="/merchant/calendar" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 3. HERO BUTTON (Billing) */}
//       <div className="relative -top-5">
//         <button 
//           onClick={() => navigate('/merchant/billing')}
//           className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white transform active:scale-90 transition-transform duration-200 border-4 border-slate-50"
//         >
//           <Plus className="w-8 h-8" />
//         </button>
//       </div>

//       {/* 4. ITEMS */}
//       <NavLink to="/merchant/items" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. MENU (Profile) */}
//       <NavLink to="/merchant/profile" className={navClass}>
//         <Menu className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Menu</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import { Home, History, BarChart3, Package, User } from 'lucide-react';

// const BottomNav = () => {
//   // Helper for styling active/inactive links
//   const navClass = ({ isActive }) => 
//     `flex flex-1 flex-col items-center justify-center gap-1 p-2 transition-colors duration-200 ${
//       isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
//     }`;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[65px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center md:hidden pb-safe">
      
//       {/* 1. HOME */}
//       <NavLink to="/merchant/overview" className={navClass}>
//         <Home className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Home</span>
//       </NavLink>

      
//       {/* 3. INSIGHTS (Replaced the + Button) */}
//       <NavLink to="/merchant/insights" className={navClass}>
//         <BarChart3 className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Insights</span>
//       </NavLink>

      
//       {/* 2. HISTORY */}

//       <NavLink to="/merchant/calendar" className={navClass}>
//         <History className="w-6 h-6" />
//         <span className="text-[10px] font-medium">History</span>
//       </NavLink>

//       {/* 4. ITEMS */}
//       <NavLink to="/merchant/items" className={navClass}>
//         <Package className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Items</span>
//       </NavLink>

//       {/* 5. PROFILE (Renamed from Menu) */}
//       <NavLink to="/merchant/profile" className={navClass}>
//         <User className="w-6 h-6" />
//         <span className="text-[10px] font-medium">Profile</span>
//       </NavLink>

//     </div>
//   );
// };

// export default BottomNav;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BarChart3, Plus, Package, FileClock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BottomNav = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  // Standard Nav Item Style (Gray)
  const navClass = ({ isActive }) => 
    `flex flex-1 flex-col items-center justify-center gap-1 h-full transition-colors duration-200 ${
      isActive 
        ? 'text-emerald-500' 
        : isDark 
          ? 'text-slate-500 hover:text-slate-300' 
          : 'text-slate-400 hover:text-slate-600'
    }`;

  // Center Button Style (Highlighted but Contained)
  const centerBtnClass = "flex flex-col items-center justify-center h-full w-full";

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t h-[65px] px-2 z-50 flex justify-between items-center md:hidden pb-safe transition-colors duration-300 ${
      isDark 
        ? 'bg-[#18181b]/95 backdrop-blur-xl border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]' 
        : 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
    }`}>
      
      {/* 1. HOME */}
      <NavLink to="/merchant/overview" className={navClass}>
        <Home strokeWidth={2.5} className="w-6 h-6" />
        <span className="text-[10px] font-bold">{t('nav.home')}</span>
      </NavLink>

      {/* 2. INSIGHTS */}
      <NavLink to="/merchant/insights" className={navClass}>
        <BarChart3 strokeWidth={2.5} className="w-6 h-6" />
        <span className="text-[10px] font-bold">{t('nav.insights')}</span>
      </NavLink>

      {/* 3. CENTER ACTION (Create Bill) - Highlighted & Contained */}
      <div className="flex flex-1 items-center justify-center h-full relative">
        <NavLink to="/merchant/billing" className={centerBtnClass}>
            {/* The Green Highlight Circle */}
            <div className={`w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center active:scale-95 transition-all ${
              isDark 
                ? 'shadow-lg shadow-emerald-500/30' 
                : 'shadow-md shadow-emerald-200'
            }`}>
                <Plus strokeWidth={3} className="w-6 h-6 text-white" />
            </div>
            {/* Optional: Label below */}
            <span className={`text-[10px] font-bold mt-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>{t('nav.bill') || 'Bill'}</span>
        </NavLink>
      </div>

      {/* 4. ITEMS (Inventory) */}
      <NavLink to="/merchant/items" className={navClass}>
        <Package strokeWidth={2.5} className="w-6 h-6" />
        <span className="text-[10px] font-bold">{t('nav.items')}</span>
      </NavLink>

      {/* 5. HISTORY (or Profile) */}
      <NavLink to="/merchant/calendar" className={navClass}>
        <FileClock strokeWidth={2.5} className="w-6 h-6" />
        <span className="text-[10px] font-bold">{t('nav.history')}</span>
      </NavLink>

    </div>
  );
};

export default BottomNav;