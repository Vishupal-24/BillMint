// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt } from 'lucide-react'; // 👈 Added Receipt Icon
// import { fetchMerchantReceipts } from '../../services/api';
// import { MONTH_NAMES } from '../../utils/mockData';

// const MerchantCalendar = () => {
//   // 🟢 STATE
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan
//   const [selectedDateKey, setSelectedDateKey] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const [receipts, setReceipts] = useState([]);
  
//   // 🆕 NEW STATE FOR MODAL
//   const [viewingReceipt, setViewingReceipt] = useState(null);

//   // 🔽 DROPDOWN STATE
//   const [openDropdown, setOpenDropdown] = useState(null); 
//   const dropdownRef = useRef(null);

//   // 🗓️ CONSTANTS
//   const YEARS = [2024, 2025, 2026, 2027]; 

//   // 🔄 EFFECT: Load receipts
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         const receiptsData = data.receipts || data || [];
//         if (mounted) {
//           setReceipts(receiptsData);
//           localStorage.setItem('merchantSales', JSON.stringify(receiptsData));
//         }
//       } catch (error) {
//         const saved = localStorage.getItem('merchantSales');
//         if (mounted && saved) setReceipts(JSON.parse(saved));
//       }
//     };
//     load();
//     const handleRefresh = () => load();
//     window.addEventListener('customer-receipts-updated', handleRefresh);
//     window.addEventListener('storage', handleRefresh);
//     return () => {
//       mounted = false;
//       window.removeEventListener('customer-receipts-updated', handleRefresh);
//       window.removeEventListener('storage', handleRefresh);
//     };
//   }, []);

//   // 🔄 EFFECT: Rebuild month data
//   useEffect(() => {
//     const data = {};
//     receipts.forEach((r) => {
//       const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
//       if (!dateKey) return;
//       const [y, m] = dateKey.split('-');
//       if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
//       if (!data[dateKey]) data[dateKey] = [];
//       data[dateKey].push(r);
//     });
//     setMonthData(data);
//     setSelectedDateKey(null);
//   }, [receipts, selectedYear, selectedMonth]);

//   // 🔄 EFFECT: Close dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // 📅 CALENDAR ENGINE
//   const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

//   // 📝 DERIVED DATA
//   const selectedDayBills = useMemo(
//     () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
//     [selectedDateKey, monthData]
//   );
//   const selectedDayTotal = selectedDayBills.reduce(
//     (a, b) => a + (b.total ?? b.amount ?? 0),
//     0
//   );

//   // 🎨 RENDER GRID
//   const renderCalendarGrid = () => {
//     const days = [];
//     for (let i = 0; i < firstDayOfMonth; i++) {
//       days.push(<div key={`empty-${i}`} className="h-16 md:h-28 bg-slate-50/50 rounded-lg"></div>);
//     }
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       const dayData = monthData[dateKey] || [];
//       const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
//       let bgClass = "bg-white border-slate-100";
//       if (dayTotal > 3000) bgClass = "bg-emerald-100 border-emerald-200";
//       else if (dayTotal > 1000) bgClass = "bg-green-50 border-green-100";
//       else if (dayData.length === 0) bgClass = "bg-white opacity-50";

//       const isSelected = selectedDateKey === dateKey;
//       days.push(
//         <div 
//           key={day}
//           onClick={() => setSelectedDateKey(dateKey)}
//           className={`
//             h-16 md:h-28 border rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative flex flex-col justify-between transition-all active:scale-95
//             ${isSelected ? 'ring-2 ring-slate-900 z-10' : ''}
//             ${bgClass}
//           `}
//         >
//           <span className={`text-xs md:text-sm font-bold ${dayTotal > 0 ? 'text-slate-700' : 'text-slate-400'}`}>{day}</span>
//           {dayTotal > 0 ? (
//             <>
//               <div className="hidden md:block text-right">
//                 <span className="block text-[10px] text-slate-500">{dayData.length} bills</span>
//                 <span className="block text-sm font-bold text-emerald-700">₹{dayTotal}</span>
//               </div>
//               <div className="md:hidden flex justify-center items-center h-full"><span className="text-[10px] font-bold text-emerald-700">₹{Math.round(dayTotal/100)/10}k</span></div>
//             </>
//           ) : null}
//         </div>
//       );
//     }
//     return days;
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative" onClick={() => setOpenDropdown(null)}> 
      
//       {/* 🔹 LEFT: MAIN CALENDAR */}
//       <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden relative">
        
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 z-20"> 
//           <div className="flex items-center gap-2">
//              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarIcon size={20} /></div>
//              <h2 className="text-lg font-bold text-slate-800">Sales History</h2>
//           </div>

//           <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}> 
//             {/* MONTH */}
//             <div className="relative flex-1 sm:flex-none w-full sm:w-40">
//                 <button onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">{MONTH_NAMES[selectedMonth]}<ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} /></button>
//                 {openDropdown === 'month' && (
//                     <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
//                         {MONTH_NAMES.map((m, i) => (<button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedMonth === i ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{m}{selectedMonth === i && <Check size={14} />}</button>))}
//                     </div>
//                 )}
//             </div>
//             {/* YEAR */}
//             <div className="relative flex-1 sm:flex-none w-full sm:w-28">
//                 <button onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">{selectedYear}<ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} /></button>
//                 {openDropdown === 'year' && (
//                     <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
//                         {YEARS.map(y => (<button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedYear === y ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{y}{selectedYear === y && <Check size={14} />}</button>))}
//                     </div>
//                 )}
//             </div>
//           </div>
//         </div>
        
//         {/* Grid */}
//         <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider relative z-0">
//           <div className="text-red-300">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-red-300">Sat</div>
//         </div>
//         <div className="grid grid-cols-7 gap-1 md:gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative z-0">
//           {renderCalendarGrid()}
//         </div>
//       </div>
      
//       {/* 🔹 RIGHT: DETAILS PANEL */}
//       {selectedDateKey && (
//         <div className="fixed inset-0 z-40 md:static md:inset-auto md:z-0 flex items-end md:items-stretch justify-center md:justify-start bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
//             <div className="w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl border md:border-slate-100 shadow-2xl md:shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out] h-[80vh] md:h-auto overflow-hidden">
//             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
//                 <div><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Selected Date</p><h3 className="text-lg md:text-xl font-bold text-slate-800">{new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3></div>
//                 <button onClick={() => setSelectedDateKey(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100"><X size={18} /></button>
//             </div>
//             <div className="p-6 bg-emerald-50 border-b border-emerald-100 shrink-0"><p className="text-emerald-800 text-xs font-bold uppercase">Total Revenue</p><p className="text-3xl font-bold text-emerald-700 mt-1">₹{selectedDayTotal}</p><p className="text-xs text-emerald-600 mt-2">{selectedDayBills.length} Transactions found</p></div>
//             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
//                 {selectedDayBills.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Filter size={32} className="mb-2"/><p>No sales recorded.</p></div> : 
//                 selectedDayBills.map((bill, i) => {
//                   const itemName = bill.items?.[0]?.name || bill.items?.[0]?.n || 'Item';
//                   const remaining = Math.max((bill.items?.length || 1) - 1, 0);
//                   const timeLabel = bill.time || (bill.transactionDate ? bill.transactionDate.slice(11, 16) : '');
//                   const total = bill.total ?? bill.amount ?? 0;
//                   return (
//                     <div 
//                       key={i} 
//                       onClick={() => setViewingReceipt(bill)} // 👈 OPEN MODAL
//                       className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer active:scale-95 transition-all group"
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors flex items-center justify-center text-slate-500 text-xs font-bold">#{i+1}</div>
//                         <div>
//                           <p className="text-xs text-slate-400 font-medium">{timeLabel}</p>
//                           <p className="text-sm font-bold text-slate-700">
//                             {itemName}{remaining > 0 ? ` + ${remaining} more` : ''}
//                           </p>
//                         </div>
//                       </div>
//                       <span className="font-bold text-slate-800">₹{total}</span>
//                     </div>
//                   );
//                 })}
//             </div>
//             </div>
//         </div>
//       )}

//       {/* 🧾 RECEIPT DETAIL MODAL (NEW ADDITION) */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-[popIn_0.2s_ease-out]">
            
//             {/* Modal Header */}
//             <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
//               <span className="text-sm font-bold flex items-center gap-2"><Receipt size={16}/> Receipt Detail</span>
//               <button onClick={() => setViewingReceipt(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20"><X size={16}/></button>
//             </div>

//             {/* Modal Content */}
//             <div className="p-6 max-h-[70vh] overflow-y-auto bg-white m-4 rounded-xl shadow-sm border border-slate-200">
//                <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
//                   <h2 className="text-xl font-bold text-slate-800">{viewingReceipt.merchant || "GreenReceipt Store"}</h2>
//                   <p className="text-xs text-slate-400 mt-1">
//                     {viewingReceipt.date || viewingReceipt.transactionDate?.split('T')[0]} • {viewingReceipt.time || viewingReceipt.transactionDate?.slice(11, 16)}
//                   </p>
//                   <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {viewingReceipt.id || viewingReceipt._id}</p>
//                </div>

//                {/* Items List */}
//                <div className="space-y-3 mb-4">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm">
//                      <span className="text-slate-600">
//                         {item.q || item.quantity || 1} x {item.n || item.name}
//                      </span>
//                      <span className="font-bold text-slate-800">
//                         ₹{(item.p || item.price || item.unitPrice) * (item.q || item.quantity || 1)}
//                      </span>
//                    </div>
//                  ))}
//                </div>

//                <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center mb-6">
//                  <span className="font-bold text-slate-500">TOTAL</span>
//                  <span className="text-2xl font-bold text-slate-800">₹{viewingReceipt.total ?? viewingReceipt.amount}</span>
//                </div>

//                <div className="text-center space-y-2">
//                  <p className="text-[10px] text-emerald-600 font-bold uppercase bg-emerald-50 inline-block px-3 py-1 rounded-full">Payment Completed</p>
//                  {viewingReceipt.paymentMethod && (
//                     <p className="text-[10px] text-slate-400 uppercase font-bold block">
//                         Method: {viewingReceipt.paymentMethod}
//                     </p>
//                  )}
//                </div>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default MerchantCalendar;



// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt, User, ShoppingBag, MapPin, Phone as PhoneIcon } from 'lucide-react'; // 👈 Added User & ShoppingBag icons
// import { fetchMerchantReceipts } from '../../services/api';
// import { MONTH_NAMES } from '../../utils/mockData';

// const MerchantCalendar = () => {
//   // 🟢 STATE
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan
//   const [selectedDateKey, setSelectedDateKey] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const [receipts, setReceipts] = useState([]);
  
//   // MODAL STATE
//   const [viewingReceipt, setViewingReceipt] = useState(null);

//   // DROPDOWN STATE
//   const [openDropdown, setOpenDropdown] = useState(null); 
//   const dropdownRef = useRef(null);

//   // CONSTANTS
//   const YEARS = [2024, 2025, 2026, 2027]; 

//   // 🔄 EFFECT: Load receipts
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         const receiptsData = data.receipts || data || [];
//         if (mounted) {
//           setReceipts(receiptsData);
//           localStorage.setItem('merchantSales', JSON.stringify(receiptsData));
//         }
//       } catch (error) {
//         const saved = localStorage.getItem('merchantSales');
//         if (mounted && saved) setReceipts(JSON.parse(saved));
//       }
//     };
//     load();
//     const handleRefresh = () => load();
//     window.addEventListener('customer-receipts-updated', handleRefresh);
//     window.addEventListener('storage', handleRefresh);
//     return () => {
//       mounted = false;
//       window.removeEventListener('customer-receipts-updated', handleRefresh);
//       window.removeEventListener('storage', handleRefresh);
//     };
//   }, []);

//   // 🔄 EFFECT: Rebuild month data
//   useEffect(() => {
//     const data = {};
//     receipts.forEach((r) => {
//       const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
//       if (!dateKey) return;
//       const [y, m] = dateKey.split('-');
//       if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
//       if (!data[dateKey]) data[dateKey] = [];
//       data[dateKey].push(r);
//     });
//     setMonthData(data);
//     setSelectedDateKey(null);
//   }, [receipts, selectedYear, selectedMonth]);

//   // 🔄 EFFECT: Close dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // 📅 CALENDAR ENGINE
//   const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

//   // 📝 DERIVED DATA
//   const selectedDayBills = useMemo(
//     () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
//     [selectedDateKey, monthData]
//   );
//   const selectedDayTotal = selectedDayBills.reduce(
//     (a, b) => a + (b.total ?? b.amount ?? 0),
//     0
//   );

//   // 🎨 RENDER GRID
//   const renderCalendarGrid = () => {
//     const days = [];
//     for (let i = 0; i < firstDayOfMonth; i++) {
//       days.push(<div key={`empty-${i}`} className="h-16 md:h-28 bg-slate-50/50 rounded-lg"></div>);
//     }
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       const dayData = monthData[dateKey] || [];
//       const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
//       let bgClass = "bg-white border-slate-100";
//       if (dayTotal > 3000) bgClass = "bg-emerald-100 border-emerald-200";
//       else if (dayTotal > 1000) bgClass = "bg-green-50 border-green-100";
//       else if (dayData.length === 0) bgClass = "bg-white opacity-50";

//       const isSelected = selectedDateKey === dateKey;
//       days.push(
//         <div 
//           key={day}
//           onClick={() => setSelectedDateKey(dateKey)}
//           className={`
//             h-16 md:h-28 border rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative flex flex-col justify-between transition-all active:scale-95
//             ${isSelected ? 'ring-2 ring-slate-900 z-10' : ''}
//             ${bgClass}
//           `}
//         >
//           <span className={`text-xs md:text-sm font-bold ${dayTotal > 0 ? 'text-slate-700' : 'text-slate-400'}`}>{day}</span>
//           {dayTotal > 0 ? (
//             <>
//               <div className="hidden md:block text-right">
//                 <span className="block text-[10px] text-slate-500">{dayData.length} bills</span>
//                 <span className="block text-sm font-bold text-emerald-700">₹{dayTotal}</span>
//               </div>
//               <div className="md:hidden flex justify-center items-center h-full"><span className="text-[10px] font-bold text-emerald-700">₹{Math.round(dayTotal/100)/10}k</span></div>
//             </>
//           ) : null}
//         </div>
//       );
//     }
//     return days;
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative" onClick={() => setOpenDropdown(null)}> 
      
//       {/* 🔹 LEFT: MAIN CALENDAR */}
//       <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden relative">
        
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 z-20"> 
//           <div className="flex items-center gap-2">
//              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarIcon size={20} /></div>
//              <h2 className="text-lg font-bold text-slate-800">Sales History</h2>
//           </div>

//           <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}> 
//             {/* MONTH */}
//             <div className="relative flex-1 sm:flex-none w-full sm:w-40">
//                 <button onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">{MONTH_NAMES[selectedMonth]}<ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} /></button>
//                 {openDropdown === 'month' && (
//                     <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
//                         {MONTH_NAMES.map((m, i) => (<button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedMonth === i ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{m}{selectedMonth === i && <Check size={14} />}</button>))}
//                     </div>
//                 )}
//             </div>
//             {/* YEAR */}
//             <div className="relative flex-1 sm:flex-none w-full sm:w-28">
//                 <button onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors">{selectedYear}<ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} /></button>
//                 {openDropdown === 'year' && (
//                     <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
//                         {YEARS.map(y => (<button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center justify-between ${selectedYear === y ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600'}`}>{y}{selectedYear === y && <Check size={14} />}</button>))}
//                     </div>
//                 )}
//             </div>
//           </div>
//         </div>
        
//         {/* Grid */}
//         <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider relative z-0">
//           <div className="text-red-300">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-red-300">Sat</div>
//         </div>
//         <div className="grid grid-cols-7 gap-1 md:gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative z-0">
//           {renderCalendarGrid()}
//         </div>
//       </div>
      
//       {/* 🔹 RIGHT: DETAILS PANEL */}
//       {selectedDateKey && (
//         <div className="fixed inset-0 z-40 md:static md:inset-auto md:z-0 flex items-end md:items-stretch justify-center md:justify-start bg-black/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
//             <div className="w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl border md:border-slate-100 shadow-2xl md:shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out] h-[80vh] md:h-auto overflow-hidden">
//             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
//                 <div><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Selected Date</p><h3 className="text-lg md:text-xl font-bold text-slate-800">{new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3></div>
//                 <button onClick={() => setSelectedDateKey(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100"><X size={18} /></button>
//             </div>
//             <div className="p-6 bg-emerald-50 border-b border-emerald-100 shrink-0"><p className="text-emerald-800 text-xs font-bold uppercase">Total Revenue</p><p className="text-3xl font-bold text-emerald-700 mt-1">₹{selectedDayTotal}</p><p className="text-xs text-emerald-600 mt-2">{selectedDayBills.length} Transactions found</p></div>
//             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
//                 {selectedDayBills.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Filter size={32} className="mb-2"/><p>No sales recorded.</p></div> : 
//                 selectedDayBills.map((bill, i) => {
//                   const itemName = bill.items?.[0]?.name || bill.items?.[0]?.n || 'Item';
//                   const remaining = Math.max((bill.items?.length || 1) - 1, 0);
//                   const timeLabel = bill.time || (bill.transactionDate ? bill.transactionDate.slice(11, 16) : '');
//                   const total = bill.total ?? bill.amount ?? 0;
                  
//                   // 👇 UPDATED LOGIC: Name vs Walk-in
//                   const displayName = bill.customerName || 'Walk-in Customer';
//                   const isRegistered = !!bill.customerName;

//                   return (
//                     <div 
//                       key={i} 
//                       onClick={() => setViewingReceipt(bill)} 
//                       className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer active:scale-95 transition-all group"
//                     >
//                       <div className="flex items-center gap-3">
//                         {/* Icon changes based on customer type */}
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
//                            {isRegistered ? <User size={18} /> : <ShoppingBag size={18} />}
//                         </div>
                        
//                         <div>
//                           {/* Shows Customer Name if exists */}
//                           <p className={`text-sm font-bold group-hover:text-emerald-700 transition-colors ${isRegistered ? 'text-slate-800' : 'text-slate-600'}`}>
//                             {displayName}
//                           </p>
//                           <p className="text-xs text-slate-400 font-medium">
//                             {timeLabel} • {itemName}{remaining > 0 ? ` +${remaining}` : ''}
//                           </p>
//                         </div>
//                       </div>
//                       <span className="font-bold text-slate-800">₹{total}</span>
//                     </div>
//                   );
//                 })}
//             </div>
//             </div>
//         </div>
//       )}

//       {/* 🧾 RECEIPT DETAIL MODAL */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-[popIn_0.2s_ease-out]">
            
//             {/* Header with Brand Color */}
//             <div 
//               className="text-white p-4 flex justify-between items-center relative overflow-hidden"
//               style={{ 
//                 background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)`
//               }}
//             >
//               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
//               <div className="flex items-center gap-3 relative z-10">
//                 {viewingReceipt.merchantSnapshot?.logoUrl ? (
//                   <div className="w-10 h-10 bg-white rounded-lg p-1 shadow">
//                     <img 
//                       src={viewingReceipt.merchantSnapshot.logoUrl} 
//                       alt="Logo" 
//                       className="w-full h-full object-contain"
//                       onError={(e) => e.target.parentElement.style.display = 'none'}
//                     />
//                   </div>
//                 ) : (
//                   <div className="p-2 bg-white/20 rounded-lg">
//                     <Receipt size={16}/>
//                   </div>
//                 )}
//                 <span className="text-sm font-bold">Receipt Detail</span>
//               </div>
//               <button onClick={() => setViewingReceipt(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={16}/></button>
//             </div>

//             {/* Content */}
//             <div className="p-6 max-h-[70vh] overflow-y-auto bg-white m-4 rounded-xl shadow-sm border border-slate-200 relative">
//                {/* Brand Color Accent */}
//                <div 
//                  className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
//                  style={{ backgroundColor: viewingReceipt.merchantSnapshot?.brandColor || '#10b981' }}
//                />
               
//                <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
//                   {/* Header Text */}
//                   {viewingReceipt.merchantSnapshot?.receiptHeader && (
//                     <p 
//                       className="text-[10px] font-bold uppercase tracking-wide mb-1"
//                       style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#10b981' }}
//                     >
//                       {viewingReceipt.merchantSnapshot.receiptHeader}
//                     </p>
//                   )}
//                   <h2 
//                     className="text-xl font-bold"
//                     style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#1e293b' }}
//                   >
//                     {viewingReceipt.merchant}
//                   </h2>
                  
//                   {/* Merchant Info */}
//                   {(viewingReceipt.merchantSnapshot?.address || viewingReceipt.merchantSnapshot?.phone) && (
//                     <div className="mt-2 space-y-1">
//                       {viewingReceipt.merchantSnapshot?.address && (
//                         <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
//                           <MapPin size={10} /> {viewingReceipt.merchantSnapshot.address}
//                         </p>
//                       )}
//                       {viewingReceipt.merchantSnapshot?.phone && (
//                         <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
//                           <PhoneIcon size={10} /> {viewingReceipt.merchantSnapshot.phone}
//                         </p>
//                       )}
//                     </div>
//                   )}
                  
//                   <p className="text-xs text-slate-400 mt-2">{viewingReceipt.date} at {viewingReceipt.time}</p>
                  
//                   {/* Customer Info Logic in Modal */}
//                   {viewingReceipt.customerName ? (
//                     <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600">
//                       <User size={14} />
//                       <span className="text-sm font-semibold">{viewingReceipt.customerName}</span>
//                     </div>
//                   ) : (
//                     <p className="text-xs text-slate-400 mt-2 italic">Walk-in Customer</p>
//                   )}
//                </div>

//                {/* Items List */}
//                <div className="space-y-3 mb-4">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm">
//                      <span className="text-slate-600">
//                         {(item.q || item.qty || item.quantity || 1)} x {item.n || item.name}
//                      </span>
//                      <span className="font-bold text-slate-800">
//                         ₹{(item.p || item.price || item.unitPrice) * (item.q || item.qty || item.quantity || 1)}
//                      </span>
//                    </div>
//                  ))}
//                </div>

//                <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center mb-4">
//                  <span className="font-bold text-slate-500">TOTAL RECEIVED</span>
//                  <span 
//                    className="text-2xl font-bold"
//                    style={{ color: viewingReceipt.merchantSnapshot?.brandColor || '#1e293b' }}
//                  >
//                    ₹{viewingReceipt.total ?? viewingReceipt.amount}
//                  </span>
//                </div>

//                {/* Footer Message */}
//                {viewingReceipt.merchantSnapshot?.receiptFooter && (
//                  <div 
//                    className="text-center py-2 px-3 rounded-lg border border-dashed mb-4"
//                    style={{ 
//                      borderColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}40`,
//                      backgroundColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}08`
//                    }}
//                  >
//                    <p className="text-xs italic text-slate-500">
//                      "{viewingReceipt.merchantSnapshot.receiptFooter}"
//                    </p>
//                  </div>
//                )}

//                <div className="text-center">
//                  <p 
//                    className="text-[10px] font-bold uppercase inline-block px-3 py-1 rounded-full"
//                    style={{ 
//                      backgroundColor: `${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}15`,
//                      color: viewingReceipt.merchantSnapshot?.brandColor || '#10b981'
//                    }}
//                  >
//                    Paid via {viewingReceipt.paymentMethod === 'upi' ? 'UPI' : viewingReceipt.paymentMethod === 'cash' ? 'Cash' : viewingReceipt.paymentMethod || 'Cash'}
//                  </p>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantCalendar;


// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt, User, ShoppingBag, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'; 
// import { fetchMerchantReceipts } from '../../services/api';
// import { MONTH_NAMES } from '../../utils/mockData';

// const MerchantCalendar = () => {
//   // 🟢 STATE
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [selectedDateKey, setSelectedDateKey] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const [receipts, setReceipts] = useState([]);
  
//   // MODAL STATE
//   const [viewingReceipt, setViewingReceipt] = useState(null);

//   // DROPDOWN STATE
//   const [openDropdown, setOpenDropdown] = useState(null); 
//   const dropdownRef = useRef(null);

//   const YEARS = [2024, 2025, 2026, 2027]; 

//   // 🔄 EFFECT: Load Merchant Receipts
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         const receiptsData = data.receipts || data || [];
//         if (mounted) {
//           setReceipts(receiptsData);
//         }
//       } catch (error) {
//         // Silent fail
//       }
//     };
//     load();
//     window.addEventListener('customer-receipts-updated', load); // Keep event name consistent if shared
//     return () => {
//       mounted = false;
//       window.removeEventListener('customer-receipts-updated', load);
//     };
//   }, []);

//   // 🔄 EFFECT: Process Data
//   useEffect(() => {
//     const data = {};
//     receipts.forEach((r) => {
//       const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
//       if (!dateKey) return;
//       const [y, m] = dateKey.split('-');
//       if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
//       if (!data[dateKey]) data[dateKey] = [];
//       data[dateKey].push(r);
//     });
//     setMonthData(data);
//     setSelectedDateKey(null);
//   }, [receipts, selectedYear, selectedMonth]);

//   // 🔄 EFFECT: Close dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Helper: Month Navigation
//   const changeMonth = (direction) => {
//     if (direction === 'prev') {
//         if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
//         else setSelectedMonth(selectedMonth - 1);
//     } else {
//         if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
//         else setSelectedMonth(selectedMonth + 1);
//     }
//   };

//   const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

//   const selectedDayBills = useMemo(
//     () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
//     [selectedDateKey, monthData]
//   );
//   const selectedDayTotal = selectedDayBills.reduce(
//     (a, b) => a + (b.total ?? b.amount ?? 0),
//     0
//   );

//   // 🎨 RENDER GRID (Consistent Green Theme)
//   const renderCalendarGrid = () => {
//     const days = [];
    
//     for (let i = 0; i < firstDayOfMonth; i++) {
//       days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
//     }
    
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       const dayData = monthData[dateKey] || [];
//       const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
//       const isSelected = selectedDateKey === dateKey;
//       const hasSales = dayTotal > 0;

//       days.push(
//         <div 
//           key={day}
//           onClick={() => setSelectedDateKey(dateKey)}
//           className="relative h-14 md:h-24 flex flex-col items-center justify-start pt-1 md:pt-2 cursor-pointer group"
//         >
//           {/* Day Circle */}
//           <div className={`
//              w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-200 active:scale-90
//              ${isSelected 
//                 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-110 z-10' 
//                 : hasSales 
//                     ? 'bg-white text-emerald-800 border-2 border-emerald-100' 
//                     : 'text-slate-700 hover:bg-slate-50' // Darker text for readability
//              }
//           `}>
//              {day}
//           </div>

//           {/* Indicators */}
//           {hasSales && (
//             <div className="mt-1 flex flex-col items-center">
//                 <div className={`
//                     md:hidden h-1.5 w-1.5 rounded-full 
//                     ${isSelected ? 'bg-white' : 'bg-emerald-500'} 
//                 `}></div>
//                 <span className="hidden md:block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
//                     ₹{dayTotal >= 1000 ? (dayTotal/1000).toFixed(1) + 'k' : dayTotal}
//                 </span>
//             </div>
//           )}
//         </div>
//       );
//     }
//     return days;
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative pb-20 md:pb-0" onClick={() => setOpenDropdown(null)}> 
      
//       {/* 🔹 MAIN CALENDAR CARD */}
//       <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 md:p-6 flex flex-col overflow-hidden relative">
        
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 z-20"> 
          
//           <div className="flex items-center justify-between w-full md:w-auto">
//              <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
//                     <CalendarIcon size={20} className="md:w-6 md:h-6" />
//                 </div>
//                 <div>
//                     <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Sales</h2>
//                     <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">Revenue History</p>
//                 </div>
//              </div>
             
//              {/* Mobile Year Dropdown */}
//              <div className="md:hidden relative">
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'mobile-year' ? null : 'mobile-year'); }}
//                   className="flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 active:scale-95 transition-transform"
//                 >
//                     {selectedYear}
//                     <ChevronDown size={14} className={`transition-transform ${openDropdown === 'mobile-year' ? 'rotate-180' : ''}`} />
//                 </button>
                
//                 {openDropdown === 'mobile-year' && (
//                     <div className="absolute top-full mt-2 right-0 w-24 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
//                         {YEARS.map(y => (
//                             <button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full text-center py-2.5 text-xs font-bold ${selectedYear === y ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
//                                 {y}
//                             </button>
//                         ))}
//                     </div>
//                 )}
//              </div>
//           </div>

//           {/* Month Navigation */}
//           <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 w-full md:w-auto justify-between">
//              <button onClick={() => changeMonth('prev')} className="p-2 md:p-3 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronLeft size={18} /></button>
//              <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'month' ? null : 'month'); }} className="flex-1 px-4 text-center font-bold text-slate-800 text-sm md:text-base flex items-center justify-center gap-2">
//                 {MONTH_NAMES[selectedMonth]}
//                 <ChevronDown size={14} className="text-slate-400" />
//              </button>
//              <button onClick={() => changeMonth('next')} className="p-2 md:p-3 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronRight size={18} /></button>
//           </div>
          
//           {/* Desktop Month Dropdown */}
//           {openDropdown === 'month' && (
//              <div className="absolute top-28 md:top-20 left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 p-2 grid grid-cols-2 gap-1">
//                 {MONTH_NAMES.map((m, i) => (
//                     <button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`px-2 py-3 text-xs font-bold rounded-lg transition-colors ${selectedMonth === i ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
//                         {m}
//                     </button>
//                 ))}
//              </div>
//           )}
//         </div>
        
//         {/* Grid Header */}
//         <div className="grid grid-cols-7 mb-2 text-center">
//           {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
//              <div key={i} className={`text-[10px] md:text-xs font-black uppercase ${i === 0 || i === 6 ? 'text-red-400 opacity-60' : 'text-slate-300'}`}>{day}</div>
//           ))}
//         </div>

//         <div className="grid grid-cols-7 overflow-y-auto no-scrollbar pb-24 md:pb-0">
//           {renderCalendarGrid()}
//         </div>
//       </div>
      
//       {/* 🔹 BOTTOM SHEET DRAWER */}
//       <div 
//         className={`
//             fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-transform duration-300 ease-out
//             md:static md:inset-auto md:w-96 md:rounded-[2rem] md:border md:shadow-xl md:h-auto md:translate-y-0
//             ${selectedDateKey ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:hidden'}
//         `}
//         style={{ height: selectedDateKey ? 'auto' : '0' }}
//       >
//         <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={() => setSelectedDateKey(null)}>
//             <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
//         </div>

//         <div className="p-6 md:h-full flex flex-col max-h-[70vh] md:max-h-none">
            
//             <div className="flex justify-between items-start mb-6">
//                 <div>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                         {selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
//                     </p>
//                     <h3 className="text-2xl font-black text-slate-900">
//                         {selectedDateKey ? new Date(selectedDateKey).getDate() : ''} <span className="text-lg font-bold text-slate-400">{selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'long' }) : ''}</span>
//                     </h3>
//                 </div>
//                 <button onClick={() => setSelectedDateKey(null)} className="hidden md:block p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18} /></button>
//             </div>

//             {/* Total Revenue Card */}
//             <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30 mb-6 flex justify-between items-center shrink-0">
//                 <div>
//                     <p className="text-xs font-bold text-emerald-100 uppercase">Total Revenue</p>
//                     <p className="text-3xl font-black mt-1">₹{selectedDayTotal}</p>
//                 </div>
//                 <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
//                     <Wallet className="text-white" size={20} />
//                 </div>
//             </div>

//             {/* List */}
//             <div className="flex-1 overflow-y-auto space-y-3 pb-safe no-scrollbar">
//                 {selectedDayBills.length === 0 ? (
//                     <div className="text-center py-8 text-slate-400">
//                         <p className="text-sm font-bold">No sales activity</p>
//                     </div>
//                 ) : (
//                     selectedDayBills.map((bill, i) => {
//                         const total = bill.total ?? bill.amount ?? 0;
//                         const customerName = bill.customerName || 'Walk-in Customer';
//                         const isRegistered = !!bill.customerName;

//                         return (
//                             <div 
//                                 key={i} 
//                                 onClick={() => setViewingReceipt(bill)}
//                                 className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl active:scale-95 transition-transform cursor-pointer hover:border-emerald-300"
//                             >
//                                 <div className="flex items-center gap-4">
//                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${isRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-500'}`}>
//                                        {isRegistered ? <User size={18} /> : <ShoppingBag size={18} />}
//                                     </div>
//                                     <div>
//                                         <p className="text-sm font-bold text-slate-900 leading-tight">{customerName}</p>
//                                         {/* Item Name Removed per request */}
//                                     </div>
//                                 </div>
//                                 <span className="font-black text-slate-900">₹{total}</span>
//                             </div>
//                         );
//                     })
//                 )}
//             </div>
//         </div>
//       </div>

//       {/* 🧾 RECEIPT MODAL */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative animate-[slideUp_0.3s_ease-out] md:animate-[popIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
             
//              {/* Header */}
//              <div className="text-white p-5 flex justify-between items-center shrink-0"
//               style={{ background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)` }}>
//               <div className="flex items-center gap-3 relative z-10">
//                 <div className="p-2 bg-white/20 rounded-xl"><Receipt size={18}/></div>
//                 <span className="text-base font-bold">Receipt Detail</span>
//               </div>
//               <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={18}/></button>
//             </div>
            
//             <div className="p-6 overflow-y-auto bg-white m-2 rounded-[1.5rem] shadow-sm border border-slate-100 relative mb-safe">
//                <div className="text-center border-b border-dashed border-slate-200 pb-5 mb-5">
//                   <h2 className="text-2xl font-black text-slate-900 mb-1">{viewingReceipt.customerName || "Walk-in Customer"}</h2>
//                   <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wide">
//                      <span>{viewingReceipt.date}</span>
//                      <span>•</span>
//                      <span>{viewingReceipt.time}</span>
//                   </div>
//                </div>
               
//                <div className="space-y-3 mb-6">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm items-center">
//                      <div className="flex items-center gap-2">
//                         <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-600">{item.q || item.quantity || 1}</span>
//                         <span className="font-bold text-slate-700">{item.n || item.name}</span>
//                      </div>
//                      <span className="font-bold text-slate-900">₹{(item.p || item.price || item.unitPrice) * (item.q || item.quantity || 1)}</span>
//                    </div>
//                  ))}
//                </div>

//                <div className="border-t-2 border-dashed border-slate-100 pt-4 flex justify-between items-center mb-6">
//                  <span className="font-black text-slate-400 text-xs uppercase tracking-wider">Total Received</span>
//                  <span className="text-3xl font-black text-slate-900">₹{viewingReceipt.total ?? viewingReceipt.amount}</span>
//                </div>
               
//                <div className="text-center">
//                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wide">
//                     <Check size={12} strokeWidth={4} /> Paid via {viewingReceipt.paymentMethod || 'Cash'}
//                   </span>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantCalendar;


// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt, User, ShoppingBag, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'; 
// import { fetchMerchantReceipts } from '../../services/api';
// import { MONTH_NAMES } from '../../utils/mockData';

// const MerchantCalendar = () => {
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [selectedDateKey, setSelectedDateKey] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const [receipts, setReceipts] = useState([]);
  
//   const [viewingReceipt, setViewingReceipt] = useState(null);
//   const [openDropdown, setOpenDropdown] = useState(null); 
//   const dropdownRef = useRef(null);

//   const YEARS = [2024, 2025, 2026, 2027]; 

//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         if (mounted) setReceipts(data.receipts || data || []);
//       } catch (error) {}
//     };
//     load();
//     window.addEventListener('customer-receipts-updated', load);
//     return () => {
//       mounted = false;
//       window.removeEventListener('customer-receipts-updated', load);
//     };
//   }, []);

//   useEffect(() => {
//     const data = {};
//     receipts.forEach((r) => {
//       const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
//       if (!dateKey) return;
//       const [y, m] = dateKey.split('-');
//       if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
//       if (!data[dateKey]) data[dateKey] = [];
//       data[dateKey].push(r);
//     });
//     setMonthData(data);
//     setSelectedDateKey(null);
//   }, [receipts, selectedYear, selectedMonth]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const changeMonth = (direction) => {
//     if (direction === 'prev') {
//         if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
//         else setSelectedMonth(selectedMonth - 1);
//     } else {
//         if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
//         else setSelectedMonth(selectedMonth + 1);
//     }
//   };

//   const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

//   const selectedDayBills = useMemo(
//     () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
//     [selectedDateKey, monthData]
//   );
//   const selectedDayTotal = selectedDayBills.reduce(
//     (a, b) => a + (b.total ?? b.amount ?? 0),
//     0
//   );

//   const renderCalendarGrid = () => {
//     const days = [];
//     for (let i = 0; i < firstDayOfMonth; i++) {
//       days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
//     }
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       const dayData = monthData[dateKey] || [];
//       const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
//       const isSelected = selectedDateKey === dateKey;
//       const hasSales = dayTotal > 0;

//       days.push(
//         <div 
//           key={day}
//           onClick={() => setSelectedDateKey(dateKey)}
//           className="relative h-14 md:h-24 flex flex-col items-center justify-start pt-1 md:pt-2 cursor-pointer group"
//         >
//           <div className={`
//              w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-200 active:scale-90
//              ${isSelected 
//                 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-110 z-10' 
//                 : hasSales 
//                     ? 'bg-white text-emerald-800 border-2 border-emerald-100' 
//                     : 'text-slate-400 hover:bg-slate-50' 
//              }
//           `}>
//              {day}
//           </div>
//           {hasSales && (
//             <div className="mt-1 flex flex-col items-center">
//                 <div className={`md:hidden h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'} `}></div>
//                 <span className="hidden md:block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
//                     ₹{dayTotal >= 1000 ? (dayTotal/1000).toFixed(1) + 'k' : dayTotal}
//                 </span>
//             </div>
//           )}
//         </div>
//       );
//     }
//     return days;
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative pb-20 md:pb-0" onClick={() => setOpenDropdown(null)}> 
      
//       {/* 🔹 MAIN CALENDAR CARD */}
//       <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 md:p-6 flex flex-col overflow-hidden relative">
        
//         {/* HEADER SECTION */}
//         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 z-20"> 
          
//           {/* 1. Title */}
//           <div className="w-full md:w-auto flex items-center gap-3">
//              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
//                  <CalendarIcon size={20} className="md:w-6 md:h-6" />
//              </div>
//              <div>
//                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Sales</h2>
//                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">Revenue History</p>
//              </div>
//           </div>

//           {/* 2. Controls (Month & Year) */}
//           <div className="w-full md:w-auto flex gap-2">
             
//              {/* MONTH SELECTOR */}
//              <div className="flex-1 flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 relative">
//                 <button onClick={() => changeMonth('prev')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronLeft size={18} /></button>
                
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'month' ? null : 'month'); }} 
//                   className="flex-1 px-2 text-center font-bold text-slate-800 text-sm flex items-center justify-center gap-1"
//                 >
//                    {MONTH_NAMES[selectedMonth]}
//                    <ChevronDown size={14} className="text-slate-400" />
//                 </button>
                
//                 {/* Month Dropdown Menu */}
//                 {openDropdown === 'month' && (
//                   <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1 grid grid-cols-1">
//                       {MONTH_NAMES.map((m, i) => (
//                           <button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`px-3 py-2 text-xs font-bold text-left rounded-lg ${selectedMonth === i ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
//                               {m}
//                           </button>
//                       ))}
//                   </div>
//                 )}

//                 <button onClick={() => changeMonth('next')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronRight size={18} /></button>
//              </div>

//              {/* YEAR SELECTOR */}
//              <div className="relative w-24">
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'year' ? null : 'year'); }}
//                   className="w-full h-full bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-3 text-sm font-bold text-slate-800"
//                 >
//                     {selectedYear}
//                     <ChevronDown size={14} className="text-slate-400" />
//                 </button>
                
//                 {/* Year Dropdown Menu */}
//                 {openDropdown === 'year' && (
//                   <div className="absolute top-full mt-2 right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
//                       {YEARS.map(y => (
//                           <button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full py-2 text-xs font-bold rounded-lg mb-1 last:mb-0 ${selectedYear === y ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
//                               {y}
//                           </button>
//                       ))}
//                   </div>
//                 )}
//              </div>

//           </div>
//         </div>
        
//         {/* Days Header */}
//         <div className="grid grid-cols-7 mb-2 text-center">
//           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
//              <div key={i} className={`text-[10px] md:text-xs font-black uppercase ${i === 0 ? 'text-red-500' : 'text-slate-600'}`}>{day}</div>
//           ))}
//         </div>

//         {/* Calendar Grid */}
//         <div className="grid grid-cols-7 overflow-y-auto no-scrollbar pb-24 md:pb-0">
//           {renderCalendarGrid()}
//         </div>
//       </div>
      
//       {/* 🔹 BOTTOM SHEET DRAWER */}
//       <div 
//         className={`
//             fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-transform duration-300 ease-out
//             md:static md:inset-auto md:w-96 md:rounded-[2rem] md:border md:shadow-xl md:h-auto md:translate-y-0
//             ${selectedDateKey ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:hidden'}
//         `}
//         style={{ height: selectedDateKey ? 'auto' : '0' }}
//       >
//         <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={() => setSelectedDateKey(null)}>
//             <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
//         </div>

//         <div className="p-6 md:h-full flex flex-col max-h-[70vh] md:max-h-none">
//             <div className="flex justify-between items-start mb-6">
//                 <div>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                         {selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
//                     </p>
//                     <h3 className="text-2xl font-black text-slate-900">
//                         {selectedDateKey ? new Date(selectedDateKey).getDate() : ''} <span className="text-lg font-bold text-slate-400">{selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'long' }) : ''}</span>
//                     </h3>
//                 </div>
//                 <button onClick={() => setSelectedDateKey(null)} className="hidden md:block p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18} /></button>
//             </div>

//             <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30 mb-6 flex justify-between items-center shrink-0">
//                 <div>
//                     <p className="text-xs font-bold text-emerald-100 uppercase">Total Revenue</p>
//                     <p className="text-3xl font-black mt-1">₹{selectedDayTotal}</p>
//                 </div>
//                 <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
//                     <Wallet className="text-white" size={20} />
//                 </div>
//             </div>

//             <div className="flex-1 overflow-y-auto space-y-3 pb-safe no-scrollbar">
//                 {selectedDayBills.length === 0 ? (
//                     <div className="text-center py-8 text-slate-400"><p className="text-sm font-bold">No sales activity</p></div>
//                 ) : (
//                     selectedDayBills.map((bill, i) => {
//                         const total = bill.total ?? bill.amount ?? 0;
//                         const customerName = bill.customerName || 'Walk-in Customer';
//                         const isRegistered = !!bill.customerName;

//                         return (
//                             <div key={i} onClick={() => setViewingReceipt(bill)} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl active:scale-95 transition-transform cursor-pointer hover:border-emerald-300">
//                                 <div className="flex items-center gap-4">
//                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${isRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-500'}`}>
//                                        {isRegistered ? <User size={18} /> : <ShoppingBag size={18} />}
//                                     </div>
//                                     <div><p className="text-sm font-bold text-slate-900 leading-tight">{customerName}</p></div>
//                                 </div>
//                                 <span className="font-black text-slate-900">₹{total}</span>
//                             </div>
//                         );
//                     })
//                 )}
//             </div>
//         </div>
//       </div>

//       {/* 🧾 RECEIPT MODAL */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative animate-[slideUp_0.3s_ease-out] md:animate-[popIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
//              <div className="text-white p-5 flex justify-between items-center shrink-0" style={{ background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)` }}>
//               <div className="flex items-center gap-3 relative z-10">
//                 <div className="p-2 bg-white/20 rounded-xl"><Receipt size={18}/></div>
//                 <span className="text-base font-bold">Receipt Detail</span>
//               </div>
//               <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={18}/></button>
//             </div>
//             <div className="p-6 overflow-y-auto bg-white m-2 rounded-[1.5rem] shadow-sm border border-slate-100 relative mb-safe">
//                <div className="text-center border-b border-dashed border-slate-200 pb-5 mb-5">
//                   <h2 className="text-2xl font-black text-slate-900 mb-1">{viewingReceipt.customerName || "Walk-in Customer"}</h2>
//                   <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wide">
//                      <span>{viewingReceipt.date}</span><span>•</span><span>{viewingReceipt.time}</span>
//                   </div>
//                </div>
//                <div className="space-y-3 mb-6">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm items-center">
//                      <div className="flex items-center gap-2">
//                         <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-600">{item.q || item.quantity || 1}</span>
//                         <span className="font-bold text-slate-700">{item.n || item.name}</span>
//                      </div>
//                      <span className="font-bold text-slate-900">₹{(item.p || item.price || item.unitPrice) * (item.q || item.quantity || 1)}</span>
//                    </div>
//                  ))}
//                </div>
//                <div className="border-t-2 border-dashed border-slate-100 pt-4 flex justify-between items-center mb-6">
//                  <span className="font-black text-slate-400 text-xs uppercase tracking-wider">Total Received</span>
//                  <span className="text-3xl font-black text-slate-900">₹{viewingReceipt.total ?? viewingReceipt.amount}</span>
//                </div>
//                <div className="text-center">
//                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wide">
//                     <Check size={12} strokeWidth={4} /> Paid via {viewingReceipt.paymentMethod || 'Cash'}
//                   </span>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantCalendar;

// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt, User, ShoppingBag, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'; 
// import { fetchMerchantReceipts } from '../../services/api';
// import { MONTH_NAMES } from '../../utils/mockData';

// const MerchantCalendar = () => {
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [selectedDateKey, setSelectedDateKey] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const [receipts, setReceipts] = useState([]);
  
//   const [viewingReceipt, setViewingReceipt] = useState(null);
//   const [openDropdown, setOpenDropdown] = useState(null); 
//   const dropdownRef = useRef(null);

//   const YEARS = [2024, 2025, 2026, 2027]; 

//   // ... (Keep existing useEffects for loading data) ...
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const { data } = await fetchMerchantReceipts();
//         if (mounted) setReceipts(data.receipts || data || []);
//       } catch (error) {}
//     };
//     load();
//     window.addEventListener('customer-receipts-updated', load);
//     return () => {
//       mounted = false;
//       window.removeEventListener('customer-receipts-updated', load);
//     };
//   }, []);

//   useEffect(() => {
//     const data = {};
//     receipts.forEach((r) => {
//       const dateKey = r.date || (r.transactionDate ? r.transactionDate.split('T')[0] : null);
//       if (!dateKey) return;
//       const [y, m] = dateKey.split('-');
//       if (Number(y) !== selectedYear || Number(m) !== selectedMonth + 1) return;
//       if (!data[dateKey]) data[dateKey] = [];
//       data[dateKey].push(r);
//     });
//     setMonthData(data);
//     setSelectedDateKey(null);
//   }, [receipts, selectedYear, selectedMonth]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ... (Keep existing helpers changeMonth, daysInMonth, selectedDayBills, selectedDayTotal) ...
//   const changeMonth = (direction) => {
//     if (direction === 'prev') {
//         if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
//         else setSelectedMonth(selectedMonth - 1);
//     } else {
//         if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
//         else setSelectedMonth(selectedMonth + 1);
//     }
//   };

//   const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//   const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); 

//   const selectedDayBills = useMemo(
//     () => (selectedDateKey ? monthData[selectedDateKey] || [] : []),
//     [selectedDateKey, monthData]
//   );
//   const selectedDayTotal = selectedDayBills.reduce(
//     (a, b) => a + (b.total ?? b.amount ?? 0),
//     0
//   );

//   const renderCalendarGrid = () => {
//     const days = [];
//     for (let i = 0; i < firstDayOfMonth; i++) {
//       days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
//     }
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//       const dayData = monthData[dateKey] || [];
//       const dayTotal = dayData.reduce((a, b) => a + (b.total ?? b.amount ?? 0), 0);
//       const isSelected = selectedDateKey === dateKey;
//       const hasSales = dayTotal > 0;

//       days.push(
//         <div 
//           key={day}
//           onClick={() => setSelectedDateKey(dateKey)}
//           className="relative h-14 md:h-24 flex flex-col items-center justify-start pt-1 md:pt-2 cursor-pointer group"
//         >
//           <div className={`
//              w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all duration-200 active:scale-90
//              ${isSelected 
//                 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-110 z-10' 
//                 : hasSales 
//                     ? 'bg-white text-emerald-800 border-2 border-emerald-100' 
//                     : 'text-slate-500 hover:bg-slate-50' 
//              }
//           `}>
//              {day}
//           </div>
//           {hasSales && (
//             <div className="mt-1 flex flex-col items-center">
//                 <div className={`md:hidden h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'} `}></div>
//                 <span className="hidden md:block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
//                     ₹{dayTotal >= 1000 ? (dayTotal/1000).toFixed(1) + 'k' : dayTotal}
//                 </span>
//             </div>
//           )}
//         </div>
//       );
//     }
//     return days;
//   };

//   return (
//     <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in relative pb-20 md:pb-0" onClick={() => setOpenDropdown(null)}> 
      
//       {/* 🔹 MAIN CALENDAR CARD */}
//       <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 md:p-6 flex flex-col overflow-hidden relative">
        
//         {/* HEADER SECTION */}
//         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 z-20"> 
//           <div className="w-full md:w-auto flex items-center gap-3">
//              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
//                  <CalendarIcon size={20} className="md:w-6 md:h-6" />
//              </div>
//              <div>
//                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Sales</h2>
//                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide">Revenue History</p>
//              </div>
//           </div>

//           <div className="w-full md:w-auto flex gap-2">
//              {/* MONTH SELECTOR */}
//              <div className="flex-1 flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 relative">
//                 <button onClick={() => changeMonth('prev')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronLeft size={18} /></button>
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'month' ? null : 'month'); }} 
//                   className="flex-1 px-2 text-center font-bold text-slate-800 text-sm flex items-center justify-center gap-1"
//                 >
//                    {MONTH_NAMES[selectedMonth]}
//                    <ChevronDown size={14} className="text-slate-400" />
//                 </button>
//                 {/* Month Dropdown */}
//                 {openDropdown === 'month' && (
//                   <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1 grid grid-cols-1">
//                       {MONTH_NAMES.map((m, i) => (
//                           <button key={i} onClick={() => { setSelectedMonth(i); setOpenDropdown(null); }} className={`px-3 py-2 text-xs font-bold text-left rounded-lg ${selectedMonth === i ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
//                               {m}
//                           </button>
//                       ))}
//                   </div>
//                 )}
//                 <button onClick={() => changeMonth('next')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all active:scale-90"><ChevronRight size={18} /></button>
//              </div>

//              {/* YEAR SELECTOR */}
//              <div className="relative w-24">
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'year' ? null : 'year'); }}
//                   className="w-full h-full bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between px-3 text-sm font-bold text-slate-800"
//                 >
//                     {selectedYear}
//                     <ChevronDown size={14} className="text-slate-400" />
//                 </button>
//                 {openDropdown === 'year' && (
//                   <div className="absolute top-full mt-2 right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1">
//                       {YEARS.map(y => (
//                           <button key={y} onClick={() => { setSelectedYear(y); setOpenDropdown(null); }} className={`w-full py-2 text-xs font-bold rounded-lg mb-1 last:mb-0 ${selectedYear === y ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
//                               {y}
//                           </button>
//                       ))}
//                   </div>
//                 )}
//              </div>
//           </div>
//         </div>
        
//         {/* Grid */}
//         <div className="grid grid-cols-7 mb-2 text-center">
//           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
//              <div key={i} className={`text-[10px] md:text-xs font-black uppercase ${i === 0 ? 'text-red-500' : 'text-slate-700'}`}>{day}</div>
//           ))}
//         </div>
//         <div className="grid grid-cols-7 overflow-y-auto no-scrollbar pb-24 md:pb-0">
//           {renderCalendarGrid()}
//         </div>
//       </div>
      
//       {/* 🔹 CLICKABLE BACKDROP (Closes Drawer) */}
//       {selectedDateKey && (
//         <div 
//           onClick={() => setSelectedDateKey(null)}
//           className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden animate-fade-in"
//         />
//       )}

//       {/* 🔹 BOTTOM SHEET DRAWER */}
//       <div 
//         className={`
//             fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-transform duration-300 ease-out
//             md:static md:inset-auto md:w-96 md:rounded-[2rem] md:border md:shadow-xl md:h-auto md:translate-y-0
//             ${selectedDateKey ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:hidden'}
//         `}
//         style={{ height: selectedDateKey ? 'auto' : '0' }}
//       >
//         {/* 👇 UPDATED HANDLE: Arrow pointing down */}
//         <div className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer active:opacity-50" onClick={() => setSelectedDateKey(null)}>
//             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
//                <ChevronDown size={20} className="animate-bounce" />
//             </div>
//         </div>

//         <div className="p-6 md:h-full flex flex-col max-h-[70vh] md:max-h-none">
//             <div className="flex justify-between items-start mb-6">
//                 <div>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                         {selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
//                     </p>
//                     <h3 className="text-2xl font-black text-slate-900">
//                         {selectedDateKey ? new Date(selectedDateKey).getDate() : ''} <span className="text-lg font-bold text-slate-400">{selectedDateKey ? new Date(selectedDateKey).toLocaleDateString('en-US', { month: 'long' }) : ''}</span>
//                     </h3>
//                 </div>
//                 <button onClick={() => setSelectedDateKey(null)} className="hidden md:block p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18} /></button>
//             </div>

//             <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30 mb-6 flex justify-between items-center shrink-0">
//                 <div>
//                     <p className="text-xs font-bold text-emerald-100 uppercase">Total Revenue</p>
//                     <p className="text-3xl font-black mt-1">₹{selectedDayTotal}</p>
//                 </div>
//                 <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
//                     <Wallet className="text-white" size={20} />
//                 </div>
//             </div>

//             <div className="flex-1 overflow-y-auto space-y-3 pb-safe no-scrollbar">
//                 {selectedDayBills.length === 0 ? (
//                     <div className="text-center py-8 text-slate-400"><p className="text-sm font-bold">No sales activity</p></div>
//                 ) : (
//                     selectedDayBills.map((bill, i) => {
//                         const total = bill.total ?? bill.amount ?? 0;
//                         const customerName = bill.customerName || 'Walk-in Customer';
//                         const isRegistered = !!bill.customerName;

//                         return (
//                             <div key={i} onClick={() => setViewingReceipt(bill)} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl active:scale-95 transition-transform cursor-pointer hover:border-emerald-300">
//                                 <div className="flex items-center gap-4">
//                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${isRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-500'}`}>
//                                        {isRegistered ? <User size={18} /> : <ShoppingBag size={18} />}
//                                     </div>
//                                     <div><p className="text-sm font-bold text-slate-900 leading-tight">{customerName}</p></div>
//                                 </div>
//                                 <span className="font-black text-slate-900">₹{total}</span>
//                             </div>
//                         );
//                     })
//                 )}
//             </div>
//         </div>
//       </div>

//       {/* 🧾 RECEIPT MODAL */}
//       {viewingReceipt && (
//         <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
//           <div className="bg-slate-50 w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative animate-[slideUp_0.3s_ease-out] md:animate-[popIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
//              <div className="text-white p-5 flex justify-between items-center shrink-0" style={{ background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)` }}>
//               <div className="flex items-center gap-3 relative z-10">
//                 <div className="p-2 bg-white/20 rounded-xl"><Receipt size={18}/></div>
//                 <span className="text-base font-bold">Receipt Detail</span>
//               </div>
//               <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10"><X size={18}/></button>
//             </div>
//             <div className="p-6 overflow-y-auto bg-white m-2 rounded-[1.5rem] shadow-sm border border-slate-100 relative mb-safe">
//                <div className="text-center border-b border-dashed border-slate-200 pb-5 mb-5">
//                   <h2 className="text-2xl font-black text-slate-900 mb-1">{viewingReceipt.customerName || "Walk-in Customer"}</h2>
//                   <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wide">
//                      <span>{viewingReceipt.date}</span><span>•</span><span>{viewingReceipt.time}</span>
//                   </div>
//                </div>
//                <div className="space-y-3 mb-6">
//                  {viewingReceipt.items && viewingReceipt.items.map((item, i) => (
//                    <div key={i} className="flex justify-between text-sm items-center">
//                      <div className="flex items-center gap-2">
//                         <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-600">{item.q || item.quantity || 1}</span>
//                         <span className="font-bold text-slate-700">{item.n || item.name}</span>
//                      </div>
//                      <span className="font-bold text-slate-900">₹{(item.p || item.price || item.unitPrice) * (item.q || item.quantity || 1)}</span>
//                    </div>
//                  ))}
//                </div>
//                <div className="border-t-2 border-dashed border-slate-100 pt-4 flex justify-between items-center mb-6">
//                  <span className="font-black text-slate-400 text-xs uppercase tracking-wider">Total Received</span>
//                  <span className="text-3xl font-black text-slate-900">₹{viewingReceipt.total ?? viewingReceipt.amount}</span>
//                </div>
//                <div className="text-center">
//                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wide">
//                     <Check size={12} strokeWidth={4} /> Paid via {viewingReceipt.paymentMethod || 'Cash'}
//                   </span>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantCalendar;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, X, Filter, ChevronDown, Check, Receipt, User, ShoppingBag, Wallet, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { fetchMerchantReceipts } from '../../services/api';
import { MONTH_NAMES } from '../../utils/mockData';
import { getISTYear, getISTMonth } from '../../utils/timezone';
import { useTheme } from '../../contexts/ThemeContext';

const MerchantCalendar = () => {
  const { isDark } = useTheme();
  const [selectedYear, setSelectedYear] = useState(getISTYear());
  const [selectedMonth, setSelectedMonth] = useState(getISTMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [receipts, setReceipts] = useState([]);
  
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); 
  const dropdownRef = useRef(null);

  const YEARS = [2024, 2025, 2026, 2027]; 

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await fetchMerchantReceipts();
        if (mounted) setReceipts(data.receipts || data || []);
      } catch (error) {}
    };
    load();
    window.addEventListener('customer-receipts-updated', load);
    return () => {
      mounted = false;
      window.removeEventListener('customer-receipts-updated', load);
    };
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 md:h-24"></div>);
    }
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
                 <CalendarIcon size={20} className="md:w-6 md:h-6" />
             </div>
             <div>
                 <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Sales</h2>
                 <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Revenue History</p>
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
                {/* Month Dropdown */}
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

      {/* 🔹 BOTTOM SHEET DRAWER */}
      <div 
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
      >
        <div className={`md:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer active:opacity-50`} onClick={() => setSelectedDateKey(null)}>
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

            <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30 mb-6 flex justify-between items-center shrink-0">
                <div>
                    <p className="text-xs font-bold text-emerald-100 uppercase">Total Revenue</p>
                    <p className="text-3xl font-black mt-1">₹{selectedDayTotal}</p>
                </div>
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Wallet className="text-white" size={20} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-24 md:pb-0 no-scrollbar">
                {selectedDayBills.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><p className="text-sm font-bold">No sales activity</p></div>
                ) : (
                    selectedDayBills.map((bill, i) => {
                        const total = bill.total ?? bill.amount ?? 0;
                        const customerName = bill.customerName || 'Walk-in Customer';
                        const isRegistered = !!bill.customerName;

                        return (
                            <div key={i} onClick={() => setViewingReceipt(bill)} className={`flex items-center justify-between p-4 rounded-2xl active:scale-95 transition-transform cursor-pointer ${
                              isDark 
                                ? 'bg-dark-surface border border-dark-border hover:border-emerald-500/50' 
                                : 'bg-slate-50 border border-slate-100 hover:border-emerald-300'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${
                                      isRegistered 
                                        ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600' 
                                        : isDark ? 'bg-dark-card border border-dark-border text-slate-500' : 'bg-white border border-slate-200 text-slate-500'
                                    }`}>
                                       {isRegistered ? <User size={18} /> : <ShoppingBag size={18} />}
                                    </div>
                                    <div><p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{customerName}</p></div>
                                </div>
                                <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{total}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      </div>

      {/* 🧾 RECEIPT MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0" onClick={() => setViewingReceipt(null)}></div>

          <div className={`w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative animate-[slideUp_0.3s_ease-out] md:animate-[popIn_0.2s_ease-out] max-h-[90vh] flex flex-col z-10 ${
            isDark ? 'bg-dark-card' : 'bg-slate-50'
          }`}>
             
             {/* HEADER */}
             <div className="text-white p-5 flex justify-between items-center shrink-0" style={{ background: `linear-gradient(135deg, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'} 0%, ${viewingReceipt.merchantSnapshot?.brandColor || '#10b981'}dd 100%)` }}>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl shadow-sm"><Receipt size={18}/></div>
                <div>
                    <h3 className="text-base font-bold leading-none">Receipt Detail</h3>
                    <p className="text-[10px] font-medium opacity-80 mt-1">#{viewingReceipt.id?.slice(-6).toUpperCase() || 'ID'}</p>
                </div>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10 active:scale-90 transition-transform"><X size={18}/></button>
            </div>

            {/* SCROLLABLE BODY 
                🔴 FIX: Added 'pb-24' to create space at the bottom for scrolling past nav bar 
            */}
            <div className={`flex-1 overflow-y-auto p-6 pb-24 md:pb-6 m-3 rounded-[1.5rem] shadow-sm border relative flex flex-col ${
              isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-100'
            }`}>
               
               {/* Customer/Date Header */}
               <div className={`text-center border-b border-dashed pb-5 mb-5 ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
                  <h2 className={`text-2xl font-black mb-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {viewingReceipt.customerName || "Walk-in Customer"}
                  </h2>
                  <div className={`flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                     <span>{viewingReceipt.date}</span>
                     <span>•</span>
                     <span>{viewingReceipt.time}</span>
                  </div>
               </div>

               {/* Items List */}
               <div className="space-y-4 mb-6 min-h-[50px]">
                 {viewingReceipt.items && viewingReceipt.items.map((item, i) => {
                   const qty = item.qty || item.quantity || item.q || 1;
                   const price = item.price || item.unitPrice || item.p || 0;
                   return (
                     <div key={i} className="flex justify-between text-sm items-start">
                       <div className="flex items-start gap-3">
                          <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mt-0.5 ${
                            isDark ? 'bg-dark-card text-slate-400' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                             {qty}
                          </span>
                          <span className={`font-medium leading-tight max-w-[180px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.n || item.name}
                          </span>
                       </div>
                       <span className={`font-bold tabular-nums text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
                         ₹{price * qty}
                       </span>
                     </div>
                   );
                 })}
               </div>
               
               {/* Calculation Section (Subtotal & Discount) */}
               {viewingReceipt.discount > 0 && (
                 <div className={`space-y-2 mb-4 pb-4 border-b border-dashed ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
                   <div className="flex justify-between text-xs font-medium">
                     <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Subtotal</span>
                     <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        ₹{viewingReceipt.subtotal || (viewingReceipt.total ?? viewingReceipt.amount) + viewingReceipt.discount}
                     </span>
                   </div>
                   <div className="flex justify-between text-xs font-medium">
                     <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Discount</span>
                     <span className="font-bold text-red-500">
                        - ₹{viewingReceipt.discount}
                     </span>
                   </div>
                 </div>
               )}
               
               {/* Grand Total */}
               <div className="mt-auto">
                   {(() => {
                     const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                     const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                    const isPendingReceipt = viewingReceipt.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;
                     const amount = isPendingReceipt
                       ? (viewingReceipt.pendingAmount ?? viewingReceipt.total ?? viewingReceipt.amount)
                       : (viewingReceipt.total ?? viewingReceipt.amount);

                     return (
                       <div className={`border-t-2 border-dashed pt-4 flex justify-between items-center mb-6 ${isDark ? 'border-dark-border' : 'border-slate-100'}`}>
                         <span className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                           {isPendingReceipt ? 'Total Due' : 'Total Received'}
                         </span>
                         <span className={`text-3xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                           ₹{amount}
                         </span>
                       </div>
                     );
                   })()}

                   {/* Payment Badge */}
                   {(() => {
                     const method = (viewingReceipt.paymentMethod || '').toLowerCase();
                     const pendingAmount = Number(viewingReceipt.pendingAmount ?? 0);
                    const isPendingReceipt = viewingReceipt.status === 'pending' || method === 'pending' || method === 'khata' || pendingAmount > 0;

                     const badgeClass = isPendingReceipt
                       ? (isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100')
                       : (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100');

                     const textClass = isPendingReceipt
                       ? (isDark ? 'text-amber-400' : 'text-amber-700')
                       : (isDark ? 'text-emerald-400' : 'text-emerald-700');

                     return (
                       <div className={`text-center p-3 rounded-xl border ${badgeClass}`}>
                         <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${textClass}`}>
                           {isPendingReceipt ? (
                             <><Clock size={14} strokeWidth={2.5} /> Pending</>
                           ) : (
                             <><CheckCircle size={14} strokeWidth={2.5} /> Paid via {viewingReceipt.paymentMethod || 'Cash'}</>
                           )}
                         </span>
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

export default MerchantCalendar;