// import React, { useState } from 'react';
// import { QrCode, Image, X, Calendar, Receipt, Trash2, CreditCard, Smartphone, EyeOff, CheckCircle, Check, Banknote, Loader2, ChevronRight, Clock, Store, ShoppingBag, MapPin, Phone } from 'lucide-react';
// import { deleteReceipt as deleteReceiptApi } from '../../services/api';
// import { useTheme } from '../../contexts/ThemeContext';

// const ReceiptCard = ({ data, onDelete, onUpdate, isDark: propIsDark }) => {
//   const { isDark: themeIsDark } = useTheme();
//   const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
//   const [isOpen, setIsOpen] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   // Customer's selected intent (informational only - does NOT update database)
//   const [customerIntent, setCustomerIntent] = useState(null);

//   const isQR = data.type === 'qr';
//   // Payment status comes from database (merchant-controlled)
//   const isPaid = data.status === 'completed';
  
//   // Get merchant branding from snapshot
//   const branding = data.merchantSnapshot || {};
//   const brandColor = branding.brandColor || '#10b981';

//   // Customer payment intent selection - INFORMATIONAL ONLY
//   // This does NOT update the database - only the merchant can finalize payment
//   const handlePaymentIntent = (method) => {
//     setCustomerIntent(method);
//     // Show confirmation that intent was recorded
//     // The actual payment confirmation must come from merchant
//   };

//   // Delete receipt from backend
//   const handleDelete = async () => {
//     if (!window.confirm("Are you sure you want to delete this receipt?")) return;
    
//     setIsProcessing(true);
//     try {
//       await deleteReceiptApi(data.id);
//       onDelete(data.id);
//       setIsOpen(false);
//     } catch (error) {
//       console.error('Delete failed:', error);
//       alert('Failed to delete receipt. Please try again.');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Get payment method display info
//   const getPaymentInfo = () => {
//     const method = data.paymentMethod?.toLowerCase();
//     if (method === 'upi') return { label: 'UPI', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50' };
//     if (method === 'cash') return { label: 'Cash', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' };
//     if (method === 'card') return { label: 'Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' };
//     return { label: 'Pending', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' };
//   };

//   const paymentInfo = getPaymentInfo();

//   return (
//     <>
//       {/* ========== CARD VIEW ========== */}
//       <div 
//         onClick={() => setIsOpen(true)}
//         className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]
//           ${data.excludeFromStats ? isDark ? 'border-slate-600 opacity-70' : 'border-slate-200 opacity-70' : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}
//         `}
//       >
//         <div className="flex items-center gap-3">
//           {/* Icon */}
//           <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${
//             isQR 
//               ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
//               : isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
//           }`}>
//             {isQR ? <QrCode size={18} className="md:w-5 md:h-5" /> : <Image size={18} className="md:w-5 md:h-5" />}
//           </div>
          
//           {/* Content */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2">
//               <h3 className={`font-bold text-sm md:text-base truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.merchant}</h3>
//               {data.excludeFromStats && <EyeOff size={12} className={isDark ? 'text-slate-500 shrink-0' : 'text-slate-400 shrink-0'} />}
//             </div>
//             <div className="flex items-center gap-2 mt-0.5">
//               <p className={`text-[10px] md:text-xs flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
//                 <Calendar size={10} className="md:w-3 md:h-3" />
//                 {data.date} • {data.time}
//               </p>
//               {/* Show payment info even if pending, but mark as pending if not paid */}
//               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${isDark ? 'bg-opacity-30' : ''} ${paymentInfo.bg} ${paymentInfo.color}`}>
//                 <paymentInfo.icon size={10} />
//                 {paymentInfo.label}
//                 {!isPaid && data.paymentMethod && ' (Pending)'}
//               </span>
//             </div>
//           </div>
          
//           {/* Amount & Type */}
//           <div className="text-right shrink-0">
//             <p className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{data.amount}</p>
//             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
//               isQR 
//                 ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
//                 : isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
//             }`}>
//               {isQR ? 'Digital' : 'Upload'}
//             </span>
//           </div>
          
//           {/* Arrow */}
//           <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors hidden md:block" />
//         </div>
//       </div>

//       {/* ========== DETAIL MODAL ========== */}
//       {isOpen && (
//         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
//           <div 
//             className={`w-full md:w-[420px] md:max-w-[90vw] rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up md:animate-pop-in flex flex-col max-h-[90vh] ${isDark ? 'bg-dark-card' : 'bg-white'}`}
//             onClick={(e) => e.stopPropagation()}
//           >
            
//             {/* Modal Header - Uses Brand Color */}
//             <div 
//               className="p-4 md:p-5 flex justify-between items-center shrink-0 rounded-t-3xl text-white relative overflow-hidden"
//               style={{ 
//                 background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
//               }}
//             >
//               {/* Brand Color Overlay Pattern */}
//               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
//               <div className="flex items-center gap-3 relative z-10">
//                 {/* Logo or Icon */}
//                 {branding.logoUrl ? (
//                   <div className="w-12 h-12 bg-white rounded-xl p-1.5 shadow-lg">
//                     <img 
//                       src={branding.logoUrl} 
//                       alt="Logo" 
//                       className="w-full h-full object-contain"
//                       onError={(e) => {
//                         e.target.style.display = 'none';
//                         e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>`;
//                       }}
//                     />
//                   </div>
//                 ) : (
//                   <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
//                     {isQR ? <QrCode size={20} /> : <Image size={20} />}
//                   </div>
//                 )}
//                 <div>
//                   {branding.receiptHeader && (
//                     <span className="text-[10px] font-bold opacity-90 uppercase tracking-wide">{branding.receiptHeader}</span>
//                   )}
//                   <h3 className="font-bold text-lg leading-tight">{data.merchant}</h3>
//                   <span className="text-xs font-medium opacity-80">{isQR ? 'Digital Receipt' : 'Uploaded Receipt'}</span>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setIsOpen(false)} 
//                 className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors relative z-10"
//               >
//                 <X size={18}/>
//               </button>
//             </div>

//             {/* Merchant Info Bar */}
//             {(branding.address || branding.phone) && (
//               <div className={`px-4 py-2.5 border-b flex flex-wrap gap-x-4 gap-y-1 text-xs ${isDark ? 'bg-dark-surface border-dark-border text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
//                 {branding.address && (
//                   <span className="flex items-center gap-1">
//                     <MapPin size={12} style={{ color: brandColor }} />
//                     {branding.address}
//                   </span>
//                 )}
//                 {branding.phone && (
//                   <span className="flex items-center gap-1">
//                     <Phone size={12} style={{ color: brandColor }} />
//                     {branding.phone}
//                   </span>
//                 )}
//               </div>
//             )}

//             {/* Content */}
//             <div className="p-4 md:p-6 overflow-y-auto flex-1">
              
//               {/* Date & Status */}
//               <div className={`flex items-center justify-between mb-4 pb-4 border-b border-dashed ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
//                 <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
//                   <Calendar size={16} />
//                   <span className="text-sm font-medium">{data.date} at {data.time}</span>
//                 </div>
//                 {isQR && (
//                   <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
//                     <CheckCircle size={10} /> Verified
//                   </span>
//                 )}
//               </div>

//               {/* Items or Image */}
//               {isQR && data.items?.length > 0 ? (
//                 <div className="mb-4">
//                   <h4 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
//                     <ShoppingBag size={14} /> Items
//                   </h4>
//                   <div className={`rounded-xl p-3 space-y-2 ${isDark ? 'bg-dark-surface' : 'bg-slate-50'}`}>
//                     {data.items.map((item, i) => {
//                       const qty = item.qty || item.quantity || 1;
//                       const price = item.price || item.unitPrice || 0;
//                       return (
//                         <div key={i} className="flex justify-between items-center text-sm">
//                           <div className="flex items-center gap-2">
//                             <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${isDark ? 'bg-dark-card text-slate-400' : 'bg-white text-slate-500'}`}>{qty}x</span>
//                             <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.name}</span>
//                           </div>
//                           <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{price * qty}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               ) : data.image && (
//                 <div className="mb-4">
//                   <h4 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
//                     <Image size={14} /> Receipt Image
//                   </h4>
//                   <div className={`aspect-[4/3] rounded-xl overflow-hidden border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-slate-100 border-slate-200'}`}>
//                     <img src={data.image} alt="Receipt" className="w-full h-full object-cover" />
//                   </div>
//                 </div>
//               )}

//               {/* Excluded Notice */}
//               {data.excludeFromStats && (
//                 <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-dark-surface text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
//                   <EyeOff size={16} />
//                   <span className="text-xs font-medium">Excluded from analytics</span>
//                 </div>
//               )}

//               {/* Amount */}
//               <div 
//                 className="rounded-xl p-4 mb-4 relative overflow-hidden"
//                 style={{ background: isDark ? `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}10 100%)` : `linear-gradient(135deg, ${brandColor}10 0%, ${brandColor}05 100%)` }}
//               >
//                 <div 
//                   className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
//                   style={{ backgroundColor: brandColor }}
//                 />
//                 <div className="flex justify-between items-center">
//                   <span className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Amount</span>
//                   <span className="text-3xl font-bold" style={{ color: brandColor }}>₹{data.amount}</span>
//                 </div>
//                 {isPaid && (
//                   <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${isDark ? 'border-dark-border' : 'border-slate-200'} ${paymentInfo.color}`}>
//                     <paymentInfo.icon size={16} />
//                     <span className="text-sm font-bold">Paid via {paymentInfo.label}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Receipt Footer Message */}
//               {(branding.receiptFooter || data.footer) && (
//                 <div 
//                   className="text-center py-3 px-4 rounded-xl border border-dashed mb-4"
//                   style={{ borderColor: `${brandColor}40`, backgroundColor: isDark ? `${brandColor}15` : `${brandColor}05` }}
//                 >
//                   <p className={`text-sm italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
//                     "{branding.receiptFooter || data.footer}"
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Actions Footer */}
//             <div className={`p-4 border-t flex justify-between items-center gap-3 rounded-b-3xl md:rounded-b-3xl ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-slate-50 border-slate-100'}`}>
//               <button 
//                 onClick={handleDelete} 
//                 disabled={isProcessing}
//                 className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm ${isDark ? 'bg-dark-card border-red-500/30 text-red-400 hover:bg-red-500/10' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}
//               >
//                 {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
//                 <span className="hidden sm:inline">Delete</span>
//               </button>
              
//               {isPaid ? (
//                 <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${paymentInfo.bg} ${paymentInfo.color}`}>
//                   <Check size={16} /> Paid via {paymentInfo.label}
//                 </div>
//               ) : customerIntent ? (
//                 // Customer has indicated payment intent - waiting for merchant confirmation
//                 <div className="flex flex-col items-center gap-2">
//                   <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${customerIntent === 'UPI' 
//                     ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700' 
//                     : isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
//                     {customerIntent === 'UPI' ? <Smartphone size={16} /> : <Banknote size={16} />}
//                     <span>Selected: {customerIntent}</span>
//                   </div>
//                   <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Waiting for merchant to confirm payment</p>
//                   <button 
//                     onClick={() => setCustomerIntent(null)}
//                     className={`text-xs underline ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
//                   >
//                     Change selection
//                   </button>
//                 </div>
//               ) : (
//                 // Show payment intent options - does NOT update database
//                 <div className="flex flex-col gap-2">
//                   <p className={`text-xs text-center mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select payment method:</p>
//                   <div className="flex gap-2">
//                     <button 
//                       onClick={() => handlePaymentIntent('UPI')} 
//                       className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
//                     >
//                       <Smartphone size={16} /> 
//                       <span>UPI</span>
//                     </button>
//                     <button 
//                       onClick={() => handlePaymentIntent('Cash')} 
//                       className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25"
//                     >
//                       <Banknote size={16} /> 
//                       <span>Cash</span>
//                     </button>
//                   </div>
//                   <p className={`text-[10px] text-center mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Merchant will confirm your payment</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Animations */}
//       <style>{`
//         @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
//         @keyframes slide-up { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
//         @keyframes pop-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
//         .animate-fade-in { animation: fade-in 0.2s ease-out; }
//         .animate-slide-up { animation: slide-up 0.3s ease-out; }
//         .animate-pop-in { animation: pop-in 0.2s ease-out; }
//       `}</style>
//     </>
//   );
// };

// export default ReceiptCard;

import React, { useState } from 'react';
import { QrCode, Image, X, Calendar, Trash2, CreditCard, Smartphone, EyeOff, CheckCircle, Check, Banknote, Loader2, ChevronRight, Clock, ShoppingBag, MapPin, Phone, Wallet } from 'lucide-react';
import { deleteReceipt as deleteReceiptApi } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { createPortal } from 'react-dom';

const ReceiptCard = ({ data, onDelete, isDark: propIsDark }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const [isOpen, setIsOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerIntent, setCustomerIntent] = useState(null);
  const [isMerchantLogoBroken, setIsMerchantLogoBroken] = useState(false);

  const isQR = data.type === 'qr';
  const pendingAmount = Number(data.pendingAmount ?? 0);
  const method = data.paymentMethod?.toLowerCase();
  const isPending = data.status === 'pending'
    || pendingAmount > 0
    || ((method === 'pending' || method === 'khata') && data.status !== 'completed');
  const isPaid = data.status === 'completed' && !isPending;
  const branding = data.merchantSnapshot || {};
  const brandColor = branding.brandColor || '#10b981';
  const merchantLogoUrl = branding.logoUrl || branding.logoURL || branding.logo || null;
  const merchantInitials = (data.merchant || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase())
    .join('') || 'MR';

  const handlePaymentIntent = (method) => {
    setCustomerIntent(method);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;
    setIsProcessing(true);
    try {
      await deleteReceiptApi(data.id);
      onDelete(data.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete receipt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentInfo = () => {
    // For pending khata payments, show special label
    if (isPending) {
      if (method === 'khata' || method === 'pending') {
        return { label: 'Pending Payment', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' };
      }
      return { label: 'Payment Pending', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' };
    }

    if (!isPaid) return { label: 'Payment Pending', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' };
    if (method === 'upi') return { label: 'UPI', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (method === 'cash') return { label: 'Cash', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' };
    if (method === 'card') return { label: 'Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' };
    if (method === 'khata' || method === 'pending') return { label: 'Khata', icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' };
    if (method === 'other') return { label: 'Other', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' };
    return { label: 'Paid', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const paymentInfo = getPaymentInfo();

  return (
    <>
      {/* ========== CARD VIEW (Unchanged) ========== */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]
          ${data.excludeFromStats ? isDark ? 'border-slate-600 opacity-70' : 'border-slate-200 opacity-70' : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'}
        `}
      >
        <div className="flex items-center gap-3">
          {merchantLogoUrl && !isMerchantLogoBroken ? (
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden shrink-0 p-1 border ${isDark ? 'bg-white border-dark-border' : 'bg-white border-slate-200'}`}>
              <img
                src={merchantLogoUrl}
                alt={`${data.merchant || 'Merchant'} logo`}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setIsMerchantLogoBroken(true)}
              />
            </div>
          ) : (
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${
              isQR 
                ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                : isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <span className="text-xs md:text-sm font-black leading-none select-none">{merchantInitials}</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm md:text-base truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.merchant}</h3>
              {data.excludeFromStats && <EyeOff size={12} className={isDark ? 'text-slate-500 shrink-0' : 'text-slate-400 shrink-0'} />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-[10px] md:text-xs flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Calendar size={10} className="md:w-3 md:h-3" />
                {data.date} • {data.time}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${isDark ? 'bg-opacity-30' : ''} ${paymentInfo.bg} ${paymentInfo.color}`}>
                <paymentInfo.icon size={10} />
                {paymentInfo.label}
              </span>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <p className={`font-bold text-base md:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>₹{data.amount}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
              isQR 
                ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                : isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              {isQR ? 'Digital' : 'Upload'}
            </span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors hidden md:block" />
        </div>
      </div>

      {/* ========== PROFESSIONAL RECEIPT MODAL ========== */}
      {isOpen && createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setIsOpen(false)}
        >
          <div 
            className={`w-full md:w-[420px] md:max-w-[90vw] rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up md:animate-scale-up flex flex-col max-h-[90vh] mb-0 md:mb-0 overflow-hidden ${isDark ? 'bg-dark-card ring-1 ring-white/10' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* 1. BRANDED HEADER */}
            <div 
              className="p-5 flex justify-between items-center shrink-0 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)` }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              
              <div className="flex items-center gap-3 relative z-10">
                {merchantLogoUrl && !isMerchantLogoBroken ? (
                  <div className="w-11 h-11 bg-white rounded-xl p-1 shadow-md shrink-0 overflow-hidden">
                    <img src={merchantLogoUrl} alt="Logo" className="w-full h-full object-contain" onError={() => setIsMerchantLogoBroken(true)} />
                  </div>
                ) : (
                  <div className="w-11 h-11 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-lg">{merchantInitials}</span>
                  </div>
                )}
                <div className="text-white min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">{data.merchant}</h3>
                  <div className="flex items-center gap-2 opacity-90 text-xs font-medium">
                    <span>{isQR ? 'Digital Receipt' : 'Uploaded Receipt'}</span>
                    <span>•</span>
                    <span>{data.date}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 relative z-10">
                <button 
                    onClick={handleDelete} 
                    disabled={isProcessing}
                    className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full hover:bg-red-500 text-white transition-colors"
                    title="Delete Receipt"
                >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 text-white transition-colors"
                >
                    <X size={18}/>
                </button>
              </div>
            </div>

            {/* 2. SCROLLABLE RECEIPT CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 pb-8">
              
              {/* SECTION A: RECEIPT ITEMS (The Bill) */}
              <div className={`rounded-2xl border mb-5 overflow-hidden ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-slate-50 border-slate-200'}`}>
                
                {/* Header Row */}
                <div className={`px-4 py-3 border-b flex justify-between items-center text-xs font-bold uppercase tracking-wider ${isDark ? 'border-dark-border text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                    <span>Item Details</span>
                    <span>Amount</span>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                    {isQR && data.items?.length > 0 ? (
                        data.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start text-sm group">
                                <div className="flex gap-3">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mt-0.5 ${isDark ? 'bg-dark-card text-slate-400' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                        {item.qty || item.quantity || 1}
                                    </div>
                                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {item.name}
                                    </span>
                                </div>
                                <span className={`font-bold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    ₹{(item.price || item.unitPrice || 0) * (item.qty || item.quantity || 1)}
                                </span>
                            </div>
                        ))
                    ) : !isQR && data.image ? (
                        <button 
                            onClick={() => setIsImageOpen(true)}
                            className="w-full aspect-video rounded-lg overflow-hidden relative group"
                        >
                            <img src={data.image} alt="Receipt" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold flex items-center gap-1"><Image size={12}/> View Image</span>
                            </div>
                        </button>
                    ) : (
                        <p className="text-center text-xs opacity-50 italic">No item details available</p>
                    )}
                </div>

                {/* Divider */}
                <div className={`border-t border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'}`}></div>

                {/* Totals Section */}
                <div className={`p-4 ${isDark ? 'bg-black/10' : 'bg-slate-100/50'}`}>
                    {/* Subtotal & Discount (Only if applicable) */}
                    {(data.discount > 0 || data.subtotal) && (
                        <div className="space-y-1 mb-3 text-xs">
                            <div className="flex justify-between items-center">
                                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Subtotal</span>
                                <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    ₹{data.subtotal || (data.amount + data.discount)}
                                </span>
                            </div>
                            {data.discount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Discount</span>
                                    <span className="font-bold text-red-500">- ₹{data.discount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Final Total */}
                    <div className="flex justify-between items-end">
                        <span className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Payable</span>
                        <span className="text-2xl font-black tabular-nums leading-none" style={{ color: brandColor }}>
                            ₹{data.amount}
                        </span>
                    </div>
                </div>
              </div>

              {/* SECTION B: STATUS & FOOTER */}
              <div className="space-y-4">
                  
                  {/* Payment Status Badge */}
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    isPaid 
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                  }`}>
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isPaid 
                                ? isDark ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                                : isDark ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
                          }`}>
                              {isPaid ? <Check size={16} strokeWidth={3} /> : <Clock size={16} strokeWidth={3} />}
                          </div>
                          <div>
                              <p className={`text-xs font-bold uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {isPaid ? 'Payment Successful' : 'Payment Pending'}
                              </p>
                              {isPaid && (
                                <p className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    Paid via {paymentInfo.label}
                                </p>
                              )}
                          </div>
                      </div>
                      
                      {/* Only show 'Verify' check if QR */}
                      {isQR && (
                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                            isDark ? 'border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                        }`}>
                            <CheckCircle size={10} /> Verified
                        </div>
                      )}
                  </div>

                  {/* Merchant Footer Msg */}
                  {(branding.receiptFooter || data.footer) && (
                    <div className="text-center px-4">
                      <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        "{branding.receiptFooter || data.footer}"
                      </p>
                    </div>
                  )}

                  {/* Merchant Contact Info (Bottom) */}
                  {(branding.address || branding.phone) && (
                    <div className={`flex justify-center gap-3 text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        {branding.phone && <span className="flex items-center gap-1"><Phone size={10} /> {branding.phone}</span>}
                        {branding.address && <span>•</span>}
                        {branding.address && <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin size={10} /> {branding.address}</span>}
                    </div>
                  )}

                  {/* ACTION REQUIRED: Payment Selector (If Pending) */}
                  {!isPaid && (
                      <div className="pt-2">
                        <p className={`text-xs font-bold text-center mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {customerIntent ? "Confirming with merchant..." : "Mark payment method:"}
                        </p>
                        
                        {customerIntent ? (
                             <button onClick={() => setCustomerIntent(null)} className="block mx-auto text-xs font-medium text-blue-500 hover:underline">
                                Change Selection
                             </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handlePaymentIntent('UPI')} className={`py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                                }`}>
                                    UPI
                                </button>
                                <button onClick={() => handlePaymentIntent('Cash')} className={`py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
                                }`}>
                                    Cash
                                </button>
                            </div>
                        )}
                      </div>
                  )}
              </div>
            </div>
            
            {/* 3. Animation Styles */}
            <style>{`
                @keyframes scale-up {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>

          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen image viewer (in-app) */}
      {isOpen && isImageOpen && !isQR && data.image && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onClick={() => setIsImageOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsImageOpen(false)}
              className="absolute top-3 right-3 md:top-5 md:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close image"
              title="Close"
            >
              <X size={20} />
            </button>
            <img
              src={data.image}
              alt="Receipt full view"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-pop-in { animation: pop-in 0.2s ease-out; }
      `}</style>
    </>
  );
};

export default ReceiptCard;