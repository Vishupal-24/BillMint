import React from 'react';
import { TrendingUp, ShoppingBag, Coffee } from 'lucide-react';

const CustomerInsights = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800">Monthly Insights</h2>

      {/* Top Card */}
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
         <div className="p-3 bg-white rounded-full text-emerald-600 shadow-sm">
            <TrendingUp size={24} />
         </div>
         <div>
            <p className="text-xs font-bold text-emerald-600 uppercase">Total Spent</p>
            <h3 className="text-3xl font-bold text-emerald-900">₹4,250</h3>
            <p className="text-xs text-emerald-700 mt-1">You spent 12% less than last month. Good job!</p>
         </div>
      </div>

      {/* Categories */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
         <h3 className="font-bold text-slate-700 mb-4">Top Spending Categories</h3>
         <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
               <div className="flex items-center gap-3">
                  <Coffee className="text-orange-500" size={20} />
                  <span className="font-bold text-slate-700">Food & Drinks</span>
               </div>
               <span className="font-bold text-slate-800">₹2,100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
               <div className="flex items-center gap-3">
                  <ShoppingBag className="text-blue-500" size={20} />
                  <span className="font-bold text-slate-700">Shopping</span>
               </div>
               <span className="font-bold text-slate-800">₹1,450</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CustomerInsights;