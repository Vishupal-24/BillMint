import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

// Import Components
import MerchantSidebar from '../components/merchant/MerchantSidebar'; 
import MerchantOverview from '../components/merchant/MerchantOverview';
import MerchantCalendar from '../components/merchant/MerchantCalendar';
import MerchantBilling from '../components/merchant/MerchantBilling';
import MerchantItems from '../components/merchant/MerchantItems';
import MerchantInsights from '../components/merchant/MerchantInsights';
import MerchantProfile from '../components/merchant/MerchantProfile';

const MerchantDashboard = () => {
  // 🧭 State
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // 📦 Shared Inventory State
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('merchantInventory');
    return saved ? JSON.parse(saved) : [
       { id: 1, name: "Masala Chai", price: 15, category: "Drinks" },
        { id: 2, name: "Veg Sandwich", price: 45, category: "Snacks" },
        { id: 3, name: "Cold Coffee", price: 60, category: "Drinks" },
        { id: 4, name: "Maggi", price: 30, category: "Snacks" },
        { id: 5, name: "Water Bottle", price: 20, category: "Drinks" },
    ];
  });

  useEffect(() => {
    localStorage.setItem('merchantInventory', JSON.stringify(inventory));
  }, [inventory]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 🔹 NEW SIDEBAR COMPONENT */}
      <MerchantSidebar 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* ⚪ MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Mobile Top Header (Hamburger) */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:hidden shrink-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
            >
                <Menu size={24} />
            </button>
            <span className="font-bold text-slate-700 capitalize">{activeTab}</span>
            <div className="w-8" /> {/* Spacer to center the title */}
        </header>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {activeTab === 'overview' && <MerchantOverview onNavigate={setActiveTab} />}
                {activeTab === 'calendar' && <MerchantCalendar />}
                {activeTab === 'billing' && <MerchantBilling inventory={inventory} />}
                {activeTab === 'items' && <MerchantItems inventory={inventory} setInventory={setInventory} />}
                {activeTab === 'insights' && <MerchantInsights />}
                {activeTab === 'profile' && <MerchantProfile />}
            </div>
        </main>
      </div>

    </div>
  );
};

export default MerchantDashboard;