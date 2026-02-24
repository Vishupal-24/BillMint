import React from 'react';
import { ArrowUpRight, PlusCircle, ShoppingBag, Clock } from 'lucide-react';
import { MOCK_DB, TODAY_KEY } from '../../utils/mockData'; // Adjust path if needed

const MerchantOverview = ({ onNavigate }) => {
  const todaysBills = MOCK_DB[TODAY_KEY] || [];
  const totalSales = todaysBills.reduce((sum, bill) => sum + bill.amount, 0);
  const billCount = todaysBills.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Good Morning!</h2>
          <p className="text-slate-500 text-sm">Here is what's happening today.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase">Current Date</p>
          <p className="text-slate-800 font-medium">Dec 20, 2025</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider relative z-10">Today's Sales</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2 relative z-10">₹{totalSales}</h3>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold relative z-10">
              <ArrowUpRight size={16} /> <span>12% vs Yesterday</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bills Generated</p>
              <h3 className="text-4xl font-bold text-slate-800 mt-2">{billCount}</h3>
            </div>
            <p className="text-slate-400 text-xs">Avg bill value: ₹{billCount > 0 ? Math.round(totalSales/billCount) : 0}</p>
        </div>

        <button 
          onClick={() => onNavigate('billing')}
          className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex flex-col justify-center items-center gap-3 h-40"
        >
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <PlusCircle size={24} />
          </div>
          <span className="font-bold text-lg">Create New Bill</span>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {todaysBills.length === 0 ? <p className="text-slate-400 text-center py-8">No sales yet.</p> : 
              todaysBills.slice(0, 5).map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Bill #{bill.id.split('-')[2]}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> {bill.time}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">₹{bill.amount}</span>
                </div>
              ))
            }
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-6">Trending Items</h3>
            <div className="space-y-6">
               {[{ name: "Masala Chai", count: 42, color: "bg-orange-500" }, { name: "Veg Puff", count: 28, color: "bg-emerald-500" }].map((item, i) => (
                 <div key={i}>
                   <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{item.name}</span><span>{item.count} sold</span></div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${item.count}%` }}></div></div>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOverview;