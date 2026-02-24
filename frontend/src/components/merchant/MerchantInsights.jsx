import React from 'react';
import { TrendingUp, Clock, CalendarX, ArrowUpRight } from 'lucide-react';

const MerchantInsights = () => {
  // Mock Data for Visuals
  const topItems = [
    { name: "Masala Chai", count: 142, percentage: 85, color: "bg-emerald-500" },
    { name: "Veg Puff", count: 98, percentage: 65, color: "bg-blue-500" },
    { name: "Cold Coffee", count: 54, percentage: 40, color: "bg-orange-500" },
    { name: "Maggi", count: 32, percentage: 25, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Sales Insights</h2>
        <p className="text-slate-500 text-sm">Understand what is selling and when.</p>
      </div>

      {/* Top Section: Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Time Card */}
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                    <Clock size={18} /> Peak Sales Time
                </div>
                <p className="text-4xl font-bold text-emerald-600 mt-2">1:00 PM</p>
                <p className="text-xs text-emerald-700 mt-2 font-medium">Lunch rush is your busiest hour.</p>
            </div>
            {/* Decorative Background Icon */}
            <Clock className="absolute -right-4 -bottom-4 text-emerald-200 opacity-50" size={120} />
        </div>

        {/* Lowest Day Card */}
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-orange-800 font-bold mb-1">
                    <CalendarX size={18} /> Slowest Day
                </div>
                <p className="text-4xl font-bold text-orange-600 mt-2">Tuesday</p>
                <p className="text-xs text-orange-700 mt-2 font-medium">Consider running a "Tasty Tuesday" offer.</p>
            </div>
            <CalendarX className="absolute -right-4 -bottom-4 text-orange-200 opacity-50" size={120} />
        </div>
      </div>

      {/* Bottom Section: Top Items List */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600"/> Top Selling Items (This Week)
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Weekly Report</span>
          </div>

          <div className="space-y-6">
              {topItems.map((item, idx) => (
                  <div key={idx}>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                          <span>{item.name}</span>
                          <span className="text-slate-400">{item.count} sold</span>
                      </div>
                      <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative group">
                          {/* Animated Progress Bar */}
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`} 
                            style={{width: `${item.percentage}%`}}
                          ></div>
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <ArrowUpRight size={20} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">Suggestion</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    <strong>Masala Chai</strong> is your clear winner. Try creating a <em>"Chai + Puff Combo"</em> to increase sales of Veg Puff alongside it!
                </p>
            </div>
          </div>
      </div>

    </div>
  );
};

export default MerchantInsights;