import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  Filter, 
  ChevronDown, 
  Check, 
  ShoppingBag, 
  Receipt, 
  QrCode, 
  Image,
  EyeOff
} from 'lucide-react';
import { MOCK_RECEIPTS } from './customerData'; // Fallback only

// Helper for Dropdowns
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026];

const CustomerCalendar = () => {
  // 🟢 STATE: Load from LocalStorage to see NEW uploads
  const [receipts, setReceipts] = useState(() => {
    const saved = localStorage.getItem('customerReceipts');
    return saved ? JSON.parse(saved) : MOCK_RECEIPTS;
  });

  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(11); // Default to Dec (current month in mock)
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null); 
  
  // 🔽 DROPDOWN STATE
  const [openDropdown, setOpenDropdown] = useState(null); 
  const dropdownRef = useRef(null);

  // 🔄 Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 📅 CALENDAR ENGINE
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  // 🔍 DATA LOOKUP
  const getDailyStats = (dateKey) => {
    // Filter receipts for this specific date
    const dailyReceipts = receipts.filter(r => r.date === dateKey);
    
    // Sum only non-excluded receipts for the calendar color logic
    const total = dailyReceipts
        .filter(r => !r.excludeFromStats)
        .reduce((sum, r) => sum + r.amount, 0);
        
    return { receipts: dailyReceipts, total, count: dailyReceipts.length };
  };

  const selectedDayStats = selectedDateKey ? getDailyStats(selectedDateKey) : { receipts: [], total: 0, count: 0 };

  // 🎨 RENDER GRID
  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-28 bg-slate-50/50 rounded-lg"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const { total, count, receipts: dayReceipts } = getDailyStats(dateKey);

      // Color Logic based on spending
      let bgClass = "bg-white border-slate-100";
      
      // If there are receipts but they are all excluded (archived), show gray
      const allExcluded = count > 0 && dayReceipts.every(r => r.excludeFromStats);

      if (allExcluded) {
          bgClass = "bg-slate-50 border-slate-200"; // Gray for archived only
      } else if (total > 1000) {
          bgClass = "bg-emerald-100 border-emerald-200";
      } else if (total > 100) {
          bgClass = "bg-green-50 border-green-100";
      } else if (count === 0) {
          bgClass = "bg-white opacity-60";
      }

      const isSelected = selectedDateKey === dateKey;

      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDateKey(dateKey)}
          className={`
            h-16 md:h-28 border rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative flex flex-col justify-between transition-all active:scale-95
            ${isSelected ? 'ring-2 ring-slate-900 z-10 shadow-lg' : ''}
            ${bgClass}
          `}
        >
          <span className={`text-xs md:text-sm font-bold ${count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{day}</span>
          {count > 0 && (
            <>
              <div className="hidden md:block text-right">
                <span className="block text-[10px] text-slate-500">{count} receipts</span>
                {!allExcluded && <span className="block text-sm font-bold text-emerald-700">₹{total}</span>}
                {allExcluded && <span className="block text-[10px] font-bold text-slate-400 uppercase">Archived</span>}
              </div>
              <div className={`md:hidden flex justify-center items-center h-full`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${allExcluded ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
              </div>
            </>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-fade-in relative" onClick={() => setOpenDropdown(null)}>
      
      {/* 🔹 LEFT: CALENDAR GRID */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden relative">
        {/* Header & Dropdowns */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 z-20">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarIcon size={20} /></div>
             <h2 className="text-lg font-bold text-slate-800">Spending History</h2>
          </div>
          <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1 sm:flex-none w-full sm:w-40">
                <button onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">
                    {MONTH_NAMES[selectedMonth]} <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'month' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                        {MONTH_NAMES.map((m, i) => <button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedMonth === i ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{m} {selectedMonth === i && <Check size={14} />}</button>)}
                    </div>
                )}
            </div>
            <div className="relative flex-1 sm:flex-none w-full sm:w-28">
                <button onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">
                    {selectedYear} <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'year' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                        {YEARS.map(y => <button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedYear === y ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{y} {selectedYear === y && <Check size={14} />}</button>)}
                    </div>
                )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider relative z-0">
          <div className="text-red-300">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-red-300">Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative z-0">
          {renderCalendarGrid()}
        </div>
      </div>
      
      {/* 🔹 RIGHT: DETAILS PANEL */}
      {selectedDateKey && (
        <div className="fixed inset-0 z-40 md:static md:inset-auto md:z-0 flex items-end md:items-stretch justify-center md:justify-start bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
            <div className="w-full md:w-80 bg-white rounded-t-3xl md:rounded-2xl border md:border-slate-100 shadow-2xl md:shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out] h-[70vh] md:h-auto overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Selected Date</p><h3 className="text-lg md:text-xl font-bold text-slate-800">{new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3></div>
                    <button onClick={() => setSelectedDateKey(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100"><X size={18} /></button>
                </div>
                <div className="p-6 bg-emerald-50 border-b border-emerald-100 shrink-0"><p className="text-emerald-800 text-xs font-bold uppercase">Total Spent</p><p className="text-3xl font-bold text-emerald-700 mt-1">₹{selectedDayStats.total}</p><p className="text-xs text-emerald-600 mt-2">{selectedDayStats.count} Receipts found</p></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                    {selectedDayStats.count === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Filter size={32} className="mb-2"/><p className="text-sm">No spending recorded.</p></div>
                    ) : (
                        selectedDayStats.receipts.map((receipt) => (
                            <div 
                                key={receipt.id} 
                                onClick={() => setViewingReceipt(receipt)}
                                className={`flex justify-between items-center p-3 border rounded-xl transition-all cursor-pointer active:scale-95
                                    ${receipt.excludeFromStats ? 'border-slate-200 bg-slate-50 opacity-70 grayscale' : 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${receipt.type === 'qr' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}><ShoppingBag size={14} /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-slate-400 font-medium">{receipt.time}</p>
                                        <p className="text-sm font-bold text-slate-700 truncate w-32">{receipt.merchant}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-800">₹{receipt.amount}</span>
                                    {receipt.excludeFromStats && <EyeOff size={10} className="text-slate-400 block ml-auto mt-1" />}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 🔹 RECEIPT DETAIL MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-50 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-[popIn_0.2s_ease-out]">
            
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="text-sm font-bold flex items-center gap-2"><Receipt size={16}/> Receipt Detail</span>
              <button onClick={() => setViewingReceipt(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20"><X size={16}/></button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-white m-4 rounded-xl shadow-sm border border-slate-200">
               
               <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-slate-800">{viewingReceipt.merchant}</h2>
                  <p className="text-xs text-slate-400 mt-1">{viewingReceipt.date} at {viewingReceipt.time}</p>
                  {viewingReceipt.type === 'qr' && <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Verified GreenReceipt</p>}
                  {viewingReceipt.excludeFromStats && <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 bg-slate-100 inline-block px-2 py-1 rounded">Excluded from Stats</p>}
               </div>

               {viewingReceipt.type === 'qr' ? (
                 <div className="space-y-3 mb-4">
                   {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
                     <div key={i} className="flex justify-between text-sm">
                       <span className="text-slate-600">{item.qty} x {item.name}</span>
                       <span className="font-bold text-slate-800">₹{item.price}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="mb-4">
                    <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                        {viewingReceipt.image ? <img src={viewingReceipt.image} alt="Receipt" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-slate-300"><Image size={32}/><span className="text-xs">No image preview</span></div>}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">Uploaded</div>
                    </div>
                 </div>
               )}

               <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center mb-6">
                 <span className="font-bold text-slate-500">TOTAL PAID</span>
                 <span className="text-2xl font-bold text-slate-800">₹{viewingReceipt.amount}</span>
               </div>

               <div className="text-center space-y-2">
                 {viewingReceipt.footer && <p className="text-xs text-slate-500 italic">"{viewingReceipt.footer}"</p>}
                 <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Stored in GreenReceipt Vault</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCalendar;