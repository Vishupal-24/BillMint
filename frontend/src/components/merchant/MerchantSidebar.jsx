import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  BarChart3, 
  Package, 
  User, 
  ShoppingBag, 
  LogOut, 
  X 
} from 'lucide-react';
// We don't need useNavigate anymore for the hard reload method

const MerchantSidebar = ({ activeTab, onNavigate, isOpen, onClose }) => {

  // Helper for Nav Items
  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { onNavigate(id); onClose(); }} 
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1
        ${activeTab === id 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <Icon size={20} /> 
      <span>{label}</span>
    </button>
  );

  const handleLogout = () => {
    // 1. Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // 2. FORCE RELOAD to the login page
    // This is better than navigate() because it clears all React state memory
    window.location.href = '/';
  };

  return (
    <>
      {/* 📱 Mobile Overlay (Backdrop) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={onClose}
        />
      )}

      {/* 🔹 SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 
        transition-transform duration-300 ease-out
        flex flex-col h-full  /* 👈 CHANGED: Uses Flexbox for height */
        md:static md:translate-x-0 
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-2 mb-8 mt-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShoppingBag size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900">GreenReceipt</span>
          </div>
          
          {/* Close Button (Mobile Only) */}
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links (Flex-1 takes up available space) */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <NavItem id="overview" icon={LayoutDashboard} label="Overview" />
          <NavItem id="calendar" icon={Calendar} label="Calendar" />
          <NavItem id="billing" icon={PlusCircle} label="Create Bill" />
          <NavItem id="insights" icon={BarChart3} label="Sales Insights" />
          <NavItem id="items" icon={Package} label="Items" />
          <NavItem id="profile" icon={User} label="Profile" />
        </nav>

        {/* Footer / Logout (mt-auto pushes it to bottom) */}
        <div className="mt-auto pt-4 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default MerchantSidebar;