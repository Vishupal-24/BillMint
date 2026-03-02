import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, X, ChevronDown, Check, Receipt, Store, Wallet, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'; 
import { fetchCustomerReceipts } from '../../services/api'; // Ensure path is correct
import { MONTH_NAMES } from '../../utils/mockData'; // Ensure path is correct
import { getISTYear, getISTMonth } from '../../utils/timezone'; // Ensure path is correct
import { useTheme } from '../../contexts/ThemeContext';

const CustomerCalendar = () => {
  const { isDark } = useTheme();
  
  // 🟢 STATE - Initialize with IST year/month
  const [selectedYear, setSelectedYear] = useState(getISTYear());
  const [selectedMonth, setSelectedMonth] = useState(getISTMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [receipts, setReceipts] = useState([]);
  
  // MODAL STATE
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // DROPDOWN STATE
  const [openDropdown, setOpenDropdown] = useState(null); 
  const dropdownRef = useRef(null);

  const YEARS = [2024, 2025, 2026, 2027]; 

  // 🔄 EFFECT: Load Receipts
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await fetchCustomerReceipts();
        const receiptsData = data.receipts || data || [];
        if (mounted) {
          setReceipts(receiptsData);
        }
      } catch (error) {
        console.error("Failed to load receipts", error);
      }
    };
    load();
    window.addEventListener('customer-receipts-updated', load);
    return () => {
      mounted = false;
      window.removeEventListener('customer-receipts-updated', load);
    };
  }, []);

  // 🔄 EFFECT: Process Data
  useEffect(() => {
    const data = {};
    receipts.forEach((r) => {
      const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
      if (!dateKey) return;
      const [y, m] = dateKey.split('-');
      if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
      if (!data[dateKey]) data[dateKey] = [];
      data[dateKey].push(r);
    });
    setMonthData(data);
    setSelectedDateKey(null);
  }, [receipts, selectedYear, selectedMonth]);

  // 🔄 EFFECT: Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper: Month Navigation
  const changeMonth = (direction) => {
    if (direction === 'prev') {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
        else setSelectedMonth(selectedMonth - 1);
    } else {
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
        else setSelectedMonth(selectedMonth + 1);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

  const selectedDayBills = useMemo(
    () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
    [selectedDateKey, monthData]
  );
  const selectedDayTotal = selectedDayBills.reduce(
    (a, b) => a + (b.total ?? b.amount ?? 0),
    0
  );

  // 🎨 RENDER GRID
  const renderCalendarGrid = () => {
    const days = [];
    
    // Empty slots
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = monthData[dateKey] || [];
      const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
      const isSelected = selectedDateKey === dateKey;
      const hasSales = dayTotal > 0;

      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDateKey(dateKey)}
          className="relative h-14 md:h-24 flex flex-col items-center justify-start pt-1 md:pt-2 cursor-pointer group"
        >
          {/* Day Circle */}
          <div className={`
             w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-200 active:scale-90
             ${isSelected 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-110 z-10' 
                : hasSales 
                    ? isDark 
                        ? 'bg-dark-surface text-emerald-400 border-2 border-emerald-500/30' 
                        : 'bg-white text-emerald-800 border-2 border-emerald-100' 
                    : isDark
                        ? 'text-slate-500 hover:bg-dark-surface' 
                        : 'text-slate-500 hover:bg-slate-50' 
             }
          `}>
             {day}
          </div>

          {/* Indicators */}
          {hasSales && (
            <div className="mt-1 flex flex-col items-center">
                <div className={`md:hidden h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'} `}></div>
                <span className={`hidden md:block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${
                    isDark ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-700 bg-emerald-50'
                }`}>
                    ₹{dayTotal >= 1000 ? (dayTotal/1000).toFixed(1) + 'k' : dayTotal}
                </span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative pb-20 md:pb-0" onClick={() => setOpenDropdown(null)}> 
      
      {/* 🔹 MAIN CALENDAR CARD */}
      <div className={`flex-1 rounded-[2rem] border shadow-xl p-4 md:p-6 flex flex-col overflow-hidden relative ${
        isDark 
          ? 'bg-dark-card border-dark-border shadow-black/20' 
          : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 z-20"> 
          <div className="w-full md:w-auto flex items-center gap-3">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                 <Wallet size={20} className="md:w-6 md:h-6" />
             </div>
             <div>
                 <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Spending</h2>
                 <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Expense History</p>
             </div>
          </div>

          <div className="w-full md:w-auto flex gap-2">
             {/* MONTH SELECTOR */}
             <div className={`flex-1 flex items-center p-1 rounded-xl border relative ${
               isDark ? 'bg-dark-surface border-dark-border' : 'bg-slate-50 border-slate-100'
             }`}>
                <button onClick={() => changeMonth('prev')} className={`p-2 rounded-lg transition-all active:scale-90 ${
                  isDark ? 'text-slate-400 hover:bg-dark-card hover:shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'
                }`}><ChevronLeft size={18} /></button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'month' ? null : 'month'); }} 
                  className={`flex-1 px-2 text-center font-bold text-sm flex items-center justify-center gap-1 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                   {MONTH_NAMES[selectedMonth]}
                   <ChevronDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                </button>
                {openDropdown === 'month' && (
                  <div className={`absolute top-full mt-2 left-0 w-full rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1 grid grid-cols-1 ${
                    isDark ? 'bg-dark-card border border-dark-border' : 'bg-white border border-slate-200'
                  }`}>
                      {MONTH_NAMES.map((m, i) => (
                          <button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`px-3 py-2 text-xs font-bold text-left rounded-lg ${
                            selectedMonth === i 
                              ? 'bg-emerald-600 text-white' 
                              : isDark ? 'hover:bg-dark-surface text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                          }`}>
                              {m}
                          </button>
                      ))}
                  </div>
                )}
                <button onClick={() => changeMonth('next')} className={`p-2 rounded-lg transition-all active:scale-90 ${
                  isDark ? 'text-slate-400 hover:bg-dark-card hover:shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'
                }`}><ChevronRight size={18} /></button>
             </div>

             {/* YEAR SELECTOR */}
             <div className="relative w-24">
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'year' ? null : 'year'); }}
                  className={`w-full h-full rounded-xl flex items-center justify-between px-3 text-sm font-bold ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white' 
                      : 'bg-slate-50 border border-slate-100 text-slate-800'
                  }`}
                >
                    {selectedYear}
                    <ChevronDown size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                </button>
                {openDropdown === 'year' && (
                  <div className={`absolute top-full mt-2 right-0 w-full rounded-xl shadow-xl z-50 p-1 ${
                    isDark ? 'bg-dark-card border border-dark-border' : 'bg-white border border-slate-200'
                  }`}>
                      {YEARS.map(y => (
                          <button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full py-2 text-xs font-bold rounded-lg mb-1 last:mb-0 ${
                            selectedYear === y 
                              ? 'bg-emerald-600 text-white' 
                              : isDark ? 'hover:bg-dark-surface text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                          }`}>
                              {y}
                          </button>
                      ))}
                  </div>
                )}
             </div>
          </div>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
             <div key={i} className={`text-[10px] md:text-xs font-black uppercase ${
               i === 0 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-700'
             }`}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-y-auto no-scrollbar pb-24 md:pb-0">
          {renderCalendarGrid()}
        </div>
      </div>
      
      {/* 🔹 CLICKABLE BACKDROP (Closes Drawer) */}
      {selectedDateKey && (
        <div 
          onClick={() => setSelectedDateKey(null)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden animate-fade-in"
        />
      )}

      {/* 🔹 BOTTOM SHEET DRAWER - (Exact match to MerchantCalendar) */}
      {/* <div 
        className={`
            fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t transition-transform duration-300 ease-out
            md:static md:inset-auto md:w-96 md:rounded-[2rem] md:border md:shadow-xl md:h-auto md:translate-y-0
            ${selectedDateKey ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:hidden'}
            ${isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white border-slate-100'
            }
        `}
        style={{ height: selectedDateKey ? 'auto' : '0' }}
      > */}

      <div 
        className={`
            fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t transition-transform duration-300 ease-out overflow-hidden
            md:static md:inset-auto md:w-96 md:rounded-[2rem] md:border md:shadow-xl md:h-auto md:translate-y-0
            ${selectedDateKey ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:hidden'}
            ${isDark 
              ? 'bg-dark-card border-dark-border' 
              : 'bg-white border-slate-100'
            }
        `}
        style={{ height: selectedDateKey ? 'auto' : '0' }}
      >
        <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer active:opacity-50" onClick={() => setSelectedDateKey(null)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-dark-surface text-slate-500' : 'bg-slate-100 text-slate-400'
            }`}>
               <ChevronDown size={20} className="animate-bounce" />
            </div>
        </div>

        <div className="p-6 md:h-full flex flex-col max-h-[70vh] md:max-h-none">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
                    </p>
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedDateKey ? new Date(selectedDateKey).getDate() : ''} <span className={`text-lg font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'long' }) : ''}</span>
                    </h3>
                </div>
                <button onClick={() => setSelectedDateKey(null)} className={`hidden md:block p-2 rounded-full ${
                  isDark ? 'bg-dark-surface hover:bg-dark-border text-slate-400' : 'bg-slate-100 hover:bg-slate-200'
                }`}><X size={18} /></button>
            </div>

            {/* Total Spent Card - Emerald Theme */}
            <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30 mb-6 flex justify-between items-center shrink-0">
                <div>
                    <p className="text-xs font-bold text-emerald-100 uppercase">Total Spent</p>
                    <p className="text-3xl font-black mt-1">₹{selectedDayTotal}</p>
                </div>
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Wallet className="text-white" size={20} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-24 md:pb-0 no-scrollbar">
                {selectedDayBills.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><p className="text-sm font-bold">No spending activity</p></div>
                ) : (
                    selectedDayBills.map((bill, i) => {
                        const total = bill.total ?? bill.amount ?? 0;
                        const storeName = bill.merchant || bill.shopName || "Unknown Store";

                        return (
                            <div key={i} onClick={() => setViewingReceipt(bill)} className={`flex items-center justify-between p-4 rounded-2xl active:scale-95 transition-transform cursor-pointer ${
                              isDark 
                                ? 'bg-dark-surface border border-dark-border hover:border-emerald-500/50' 
                                : 'bg-slate-50 border border-slate-100 hover:border-emerald-300'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${
                                      isDark ? 'bg-dark-card border border-dark-border text-slate-500' : 'bg-white border border-slate-200 text-slate-500'
                                    }`}>
                                       <Store size={18} />
                                    </div>
                                    <div><p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{storeName}</p></div>
                                </div>
                                <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{total}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      </div>

      {/* 🧾 RECEIPT MODAL - (Exact match to MerchantCalendar) */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          
          {/* BACKDROP CLICK CLOSE */}
          <div className="absolute inset-0" onClick={() => setViewingReceipt(null)}></div>

          {/* MODAL CARD */}
          <div className={`w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative animate-[slideUp_0.3s_ease-out] md:animate-[popIn_0.2s_ease-out] max-h-[90vh] flex flex-col z-10 ${
            isDark ? 'bg-dark-card' : 'bg-slate-50'
          }`}>
             
             {/* HEADER */}
             <div className="text-white p-5 flex justify-between items-center shrink-0" style={{ background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)` }}>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl"><Receipt size={18}/></div>
                <div className="flex flex-col">
                    <span className="text-base font-bold leading-none">Receipt Detail</span>
                    <span className="text-[10px] opacity-80 font-medium mt-1">#{viewingReceipt.id?.slice(-6).toUpperCase() || 'ID'}</span>
                </div>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={18}/></button>
            </div>

            {/* BILL BODY 
                🔴 FIX: Added 'pb-24' to ensure content clears mobile nav bar 
            */}
            <div className={`flex-1 overflow-y-auto p-5 pb-24 md:pb-5 m-3 rounded-[1.5rem] shadow-sm border relative flex flex-col ${
              isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-100'
            }`}>
               
               {/* Merchant Header */}
               <div className={`text-center border-b border-dashed pb-4 mb-4 ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
                  <h2 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewingReceipt.merchant || "Unknown Store"}</h2>
                  <div className={`flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                     <span>{viewingReceipt.date}</span><span>•</span><span>{viewingReceipt.time}</span>
                  </div>
               </div>

               {/* Items List */}
               <div className="space-y-3 mb-4 min-h-[100px]">
                 {viewingReceipt.items && viewingReceipt.items.map((item, i) => {
                   const qty = item.qty || item.quantity || item.q || 1;
                   const price = item.price || item.unitPrice || item.p || 0;
                   return (
                     <div key={i} className="flex justify-between text-sm items-start">
                       <div className="flex items-start gap-3">
                          <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mt-0.5 ${
                            isDark ? 'bg-dark-card text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                             {qty}
                          </span>
                          <span className={`font-medium leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.n || item.name}</span>
                       </div>
                       <span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{price * qty}</span>
                     </div>
                   );
                 })}
               </div>

               {/* Calculation Section */}
               <div className="mt-auto">
                   <div className={`border-t border-dashed pt-4 space-y-2 ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
                     
                     {/* Show Subtotal/Discount ONLY if discount exists */}
                     {(Number(viewingReceipt.discount || 0) > 0) && (
                        <>
                            <div className="flex justify-between text-xs">
                                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Subtotal</span>
                                <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    ₹{viewingReceipt.subtotal || ((viewingReceipt.total ?? viewingReceipt.amount ?? 0) + Number(viewingReceipt.discount))}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Discount</span>
                                <span className="font-bold text-red-500">
                                    - ₹{viewingReceipt.discount}
                                </span>
                            </div>
                            <div className={`border-t my-2 opacity-50 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
                        </>
                     )}

                     {/* Grand Total */}
                     {(() => {
                       const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                       const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                       const isPendingReceipt = viewingReceipt.status === 'pending'
                         || pendingAmount > 0
                         || ((method === 'pending' || method === 'khata') && viewingReceipt.status !== 'completed');
                       const amount = isPendingReceipt
                         ? (viewingReceipt.pendingAmount ?? viewingReceipt.total ?? viewingReceipt.amount)
                         : (viewingReceipt.total ?? viewingReceipt.amount);

                       return (
                         <div className="flex justify-between items-end">
                           <span className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                             {isPendingReceipt ? 'Total Due' : 'Total Paid'}
                           </span>
                           <span className={`text-3xl font-black ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>
                             ₹{amount}
                           </span>
                         </div>
                       );
                     })()}
                   </div>

                   {/* Footer Status Badge */}
                   {(() => {
                     const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                     const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                     const isPendingReceipt = viewingReceipt.status === 'pending'
                       || pendingAmount > 0
                       || ((method === 'pending' || method === 'khata') && viewingReceipt.status !== 'completed');

                     const badgeClass = isPendingReceipt
                       ? (isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100')
                       : (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100');

                     const textClass = isPendingReceipt
                       ? (isDark ? 'text-amber-400' : 'text-amber-700')
                       : (isDark ? 'text-emerald-400' : 'text-emerald-700');

                     return (
                       <div className={`mt-5 text-center p-3 rounded-xl border ${badgeClass}`}>
                         <div className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide ${textClass}`}>
                           {isPendingReceipt ? (
                             <><Clock size={14} strokeWidth={2.5} /> Payment Pending</>
                           ) : (
                             <><CheckCircle size={14} strokeWidth={2.5} /> Payment Successful via {viewingReceipt.paymentMethod || 'Cash'}</>
                           )}
                         </div>
                       </div>
                     );
                   })()}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCalendar;