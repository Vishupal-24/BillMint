import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check } from 'lucide-react';
import { getMonthData, MONTH_NAMES } from '../../utils/mockData';

const MerchantCalendar = () => {
  // 🟢 STATE
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [monthData, setMonthData] = useState({});

  // 🔽 DROPDOWN STATE
  const [openDropdown, setOpenDropdown] = useState(null); // 'month', 'year', or null
  const dropdownRef = useRef(null); // To detect clicks outside

  // 🗓️ CONSTANTS
  const YEARS = [2024, 2025, 2026, 2027]; 

  // 🔄 EFFECT: Load data
  useEffect(() => {
    const data = getMonthData(selectedYear, selectedMonth);
    setMonthData(data);
    setSelectedDateKey(null);
  }, [selectedYear, selectedMonth]);

  // 🔄 EFFECT: Close dropdowns if clicking outside
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

  // 📝 DERIVED DATA
  const selectedDayBills = selectedDateKey ? (monthData[selectedDateKey] || []) : [];
  const selectedDayTotal = selectedDayBills.reduce((a, b) => a + b.amount, 0);

  // 🎨 RENDER GRID
  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-28 bg-slate-50/50 rounded-lg"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = monthData[dateKey] || [];
      const dayTotal = dayData.reduce((a, b) => a + b.amount, 0);
      let bgClass = "bg-white border-slate-100";
      if (dayTotal > 3000) bgClass = "bg-emerald-100 border-emerald-200";
      else if (dayTotal > 1000) bgClass = "bg-green-50 border-green-100";
      else if (dayData.length === 0) bgClass = "bg-white opacity-50";

      const isSelected = selectedDateKey === dateKey;
      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDateKey(dateKey)}
          className={`
            h-16 md:h-28 border rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative flex flex-col justify-between transition-all active:scale-95
            ${isSelected ? 'ring-2 ring-slate-900 z-10' : ''}
            ${bgClass}
          `}
        >
          <span className={`text-xs md:text-sm font-bold ${dayTotal > 0 ? 'text-slate-700' : 'text-slate-400'}`}>{day}</span>
          {dayTotal > 0 ? (
            <>
              <div className="hidden md:block text-right">
                <span className="block text-[10px] text-slate-500">{dayData.length} bills</span>
                <span className="block text-sm font-bold text-emerald-700">₹{dayTotal}</span>
              </div>
              <div className="md:hidden flex justify-center items-center h-full"><span className="text-[10px] font-bold text-emerald-700">₹{Math.round(dayTotal/100)/10}k</span></div>
            </>
          ) : null}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative" onClick={() => setOpenDropdown(null)}> {/* Click bg to close */}
      
      {/* 🔹 LEFT: MAIN CALENDAR */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden relative">
        
        {/* 1. Header with CUSTOM DROPDOWNS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 z-20"> {/* High Z-Index for dropdowns */}
          <div className="flex items-center gap-2">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarIcon size={20} /></div>
             <h2 className="text-lg font-bold text-slate-800">Sales History</h2>
          </div>

          <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}> {/* Stop prop so bg click doesn't close immediately */}
            
            {/* MONTH DROPDOWN */}
            <div className="relative flex-1 sm:flex-none w-full sm:w-40">
                <button 
                    onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors"
                >
                    {MONTH_NAMES[selectedMonth]}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === 'month' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                        {MONTH_NAMES.map((m, i) => (
                            <button 
                                key={i}
                                onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between
                                    ${selectedMonth === i ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}
                                `}
                            >
                                {m}
                                {selectedMonth === i && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* YEAR DROPDOWN */}
            <div className="relative flex-1 sm:flex-none w-full sm:w-28">
                <button 
                    onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors"
                >
                    {selectedYear}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'year' && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                        {YEARS.map(y => (
                            <button 
                                key={y}
                                onClick={() => { setSelectedYear(y); setOpenDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between
                                    ${selectedYear === y ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}
                                `}
                            >
                                {y}
                                {selectedYear === y && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
        
        {/* 2. Grid (Z-index 0 to stay behind dropdowns) */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider relative z-0">
          <div className="text-red-300">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-red-300">Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative z-0">
          {renderCalendarGrid()}
        </div>
      </div>
      
      {/* 🔹 RIGHT: DETAILS PANEL */}
      {selectedDateKey && (
        <div className="fixed inset-0 z-50 md:static md:inset-auto md:z-0 flex items-end md:items-stretch justify-center md:justify-start bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
            <div className="w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl border md:border-slate-100 shadow-2xl md:shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out] h-[80vh] md:h-auto overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Selected Date</p><h3 className="text-lg md:text-xl font-bold text-slate-800">{new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3></div>
                <button onClick={() => setSelectedDateKey(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 shrink-0"><p className="text-emerald-800 text-xs font-bold uppercase">Total Revenue</p><p className="text-3xl font-bold text-emerald-700 mt-1">₹{selectedDayTotal}</p><p className="text-xs text-emerald-600 mt-2">{selectedDayBills.length} Transactions found</p></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {selectedDayBills.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Filter size={32} className="mb-2"/><p>No sales recorded.</p></div> : 
                selectedDayBills.map((bill, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">#{i+1}</div><div><p className="text-xs text-slate-400 font-medium">{bill.time}</p><p className="text-sm font-bold text-slate-700">{bill.items[0]} + {bill.items.length-1} more</p></div></div><span className="font-bold text-slate-800">₹{bill.amount}</span>
                    </div>
                ))}
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MerchantCalendar;