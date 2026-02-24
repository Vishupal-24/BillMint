import React, { useState } from 'react';
import { QrCode, Image, X, Calendar, Receipt, Trash2, Edit2, Save, EyeOff, CheckCircle } from 'lucide-react';

const ReceiptCard = ({ data, onDelete, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editMerchant, setEditMerchant] = useState(data.merchant);
  const [editAmount, setEditAmount] = useState(data.amount);
  const [editDate, setEditDate] = useState(data.date);
  const [editExclude, setEditExclude] = useState(data.excludeFromStats);

  const isQR = data.type === 'qr';

  // Save Edits
  const handleSaveEdit = () => {
    const updated = {
        ...data,
        merchant: editMerchant,
        amount: parseFloat(editAmount),
        date: editDate,
        excludeFromStats: editExclude
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  return (
    <>
      {/* 🔹 THE CARD (Timeline View) */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]
            ${data.excludeFromStats ? 'border-slate-200 opacity-75 grayscale-[0.5]' : 'border-slate-100'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isQR ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
               {isQR ? <QrCode size={18}/> : <Image size={18}/>}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 line-clamp-1">{data.merchant}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                {data.date} • {data.time}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">₹{data.amount}</p>
            <div className="flex justify-end gap-1 mt-1">
                {data.excludeFromStats && <EyeOff size={12} className="text-slate-400" />}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isQR ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                {isQR ? 'Digital' : 'Upload'}
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 THE DETAIL MODAL (Popup) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-50 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-[popIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold flex items-center gap-2"><Receipt size={16}/> {isEditing ? 'Edit Receipt' : 'Receipt Detail'}</span>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsEditing(false); }} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20"><X size={16}/></button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto bg-white m-4 rounded-xl shadow-sm border border-slate-200">
               
               {/* 1. Editable Header Info */}
               <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
                  {isEditing ? (
                      <div className="space-y-2">
                          <input className="w-full text-center font-bold text-xl border-b border-slate-300 outline-none pb-1" value={editMerchant} onChange={e => setEditMerchant(e.target.value)} placeholder="Merchant Name" />
                          <div className="flex justify-center items-center gap-2">
                              <Calendar size={14} className="text-slate-400"/>
                              <input type="date" className="text-xs text-slate-500 border rounded px-2 py-1" value={editDate} onChange={e => setEditDate(e.target.value)} />
                          </div>
                      </div>
                  ) : (
                      <>
                        <h2 className="text-xl font-bold text-slate-800">{data.merchant}</h2>
                        <p className="text-xs text-slate-400 mt-1">{data.date} at {data.time}</p>
                      </>
                  )}
                  
                  {isQR && <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Verified GreenReceipt</p>}
                  
                  {!isEditing && data.excludeFromStats && (
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 bg-slate-100 inline-block px-2 py-1 rounded flex items-center gap-1 mx-auto w-fit"><EyeOff size={10}/> Excluded from Stats</p>
                  )}
               </div>

               {/* 2. Items or Image */}
               {isQR ? (
                 <div className="space-y-3 mb-4">
                   {data.items && data.items.map((item, i) => (
                     <div key={i} className="flex justify-between text-sm">
                       <span className="text-slate-600">{item.qty} x {item.name}</span>
                       <span className="font-bold text-slate-800">₹{item.price}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="mb-4">
                    <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                        {data.image ? <img src={data.image} alt="Receipt" className="w-full h-full object-cover" /> : <p className="text-xs text-slate-400">No image preview</p>}
                    </div>
                 </div>
               )}

               {/* 3. Editable Total */}
               <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center mb-6">
                 <span className="font-bold text-slate-500">TOTAL PAID</span>
                 {isEditing ? (
                     <div className="flex items-center gap-1">
                         <span className="font-bold text-slate-400">₹</span>
                         <input type="number" className="w-24 text-right font-bold text-2xl border-b border-slate-300 outline-none" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                     </div>
                 ) : (
                     <span className="text-2xl font-bold text-slate-800">₹{data.amount}</span>
                 )}
               </div>
               
               {/* 4. Edit Toggle: Exclude from Stats */}
               {isEditing && (
                   <div onClick={() => setEditExclude(!editExclude)} className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer mb-4 ${!editExclude ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${!editExclude ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                            {!editExclude && <CheckCircle size={10} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700">Include in Analytics</span>
                   </div>
               )}

               <div className="text-center space-y-2">
                 <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Stored in GreenReceipt Vault</p>
               </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
                {!isEditing ? (
                    <>
                        <button onClick={() => onDelete(data.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                            <Trash2 size={16} /> Delete
                        </button>
                        <button onClick={() => { setIsEditing(true); setEditMerchant(data.merchant); setEditAmount(data.amount); setEditDate(data.date); setEditExclude(data.excludeFromStats || false); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                            <Edit2 size={16} /> Edit Details
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={() => setIsEditing(false)} className="text-slate-400 text-xs font-bold hover:text-slate-600">Cancel</button>
                         <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                            <Save size={16} /> Save Changes
                        </button>
                    </>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptCard;