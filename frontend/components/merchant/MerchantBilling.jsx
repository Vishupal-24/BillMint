// import React, { useState, useMemo } from 'react';
// import { ShoppingBag, QrCode, X, Plus, Minus, Trash2, Search, Zap, ChevronUp, ChevronDown } from 'lucide-react';

// const MerchantBilling = ({ inventory }) => {
//   // 🛒 Cart State
//   const [cart, setCart] = useState([]);
//   const [showQr, setShowQr] = useState(false);
  
//   // 📱 Mobile UI State
//   const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

//   // 🔍 Search & Filter State
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");

//   // ⚡ Manual Item State
//   const [manualName, setManualName] = useState("");
//   const [manualPrice, setManualPrice] = useState("");
//   const [manualQty, setManualQty] = useState(1);

//   // Calculations
//   const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
//   const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
//   const categories = ["All", ...new Set(inventory.map(i => i.category || "General"))];

//   // Search Logic
//   const filteredItems = useMemo(() => {
//     return inventory.filter(item => {
//       const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesCategory = selectedCategory === "All" || (item.category || "General") === selectedCategory;
//       return matchesSearch && matchesCategory;
//     });
//   }, [inventory, searchQuery, selectedCategory]);

//   // ——— ACTIONS ———

//   const addToCart = (item) => {
//     setCart(prev => {
//       const exists = prev.find(i => i.id === item.id);
//       if (exists) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
//       return [...prev, { ...item, quantity: 1 }];
//     });
//     // Optional: Auto-open cart or show toast could go here
//   };

//   const addManualItem = (e) => {
//     e.preventDefault();
//     if (!manualName || !manualPrice) return;

//     const newItem = {
//       id: `manual-${Date.now()}`,
//       name: manualName,
//       price: parseFloat(manualPrice),
//       quantity: parseInt(manualQty) > 0 ? parseInt(manualQty) : 1,
//       isManual: true
//     };

//     setCart(prev => [...prev, newItem]);
//     setManualName("");
//     setManualPrice("");
//     setManualQty(1);
//   };

//   const updateQuantity = (itemId, delta) => {
//     setCart(prev => prev.map(item => {
//       if (item.id === itemId) return { ...item, quantity: Math.max(1, item.quantity + delta) };
//       return item;
//     }));
//   };

//   const removeFromCart = (itemId) => setCart(prev => prev.filter(item => item.id !== itemId));


//   return (
//     <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in relative">
      
//       {/* 🔹 LEFT: ITEMS GRID (Always Visible) */}
//       <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
        
//         {/* Search Header */}
//         <div className="p-4 border-b border-slate-100 bg-white z-10 space-y-4">
//             <div className="relative">
//                 <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
//                 <input 
//                     type="text" 
//                     placeholder="Search menu items..." 
//                     className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//             </div>
//             <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
//                 {categories.map(cat => (
//                     <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
//                         {cat}
//                     </button>
//                 ))}
//             </div>
//         </div>

//         {/* Grid (With EXTRA Padding at bottom for Mobile) */}
//         <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4"> {/* 👈 FIXED: pb-32 prevents items hiding behind bar */}
//             {filteredItems.length === 0 ? (
//                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
//                     <Search size={32} className="mb-2"/>
//                     <p>No items found.</p>
//                 </div>
//             ) : (
//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//                     {filteredItems.map(item => (
//                         <button key={item.id} onClick={() => addToCart(item)} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all text-left group active:scale-95 flex flex-col justify-between h-24">
//                             <div>
//                                 <div className="font-bold text-slate-700 group-hover:text-emerald-700 leading-tight line-clamp-2">{item.name}</div>
//                                 <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">{item.category}</div>
//                             </div>
//                             <div className="text-sm font-bold text-emerald-600">₹{item.price}</div>
//                         </button>
//                     ))}
//                 </div>
//             )}
//         </div>
//       </div>

//       {/* 🔹 MOBILE FLOATING BAR (Only Visible on Mobile) */}
//       {!isMobileCartOpen && (
//         <div 
//             className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-40 flex items-center justify-between"
//             onClick={() => setIsMobileCartOpen(true)}
//         >
//            <div>
//                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total ({totalItems} items)</p>
//                <p className="text-2xl font-bold text-slate-800">₹{cartTotal}</p>
//            </div>
//            <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
//                View Bill <ChevronUp size={18} />
//            </button>
//         </div>
//       )}

//       {/* 🔹 RIGHT: CART PANEL (Responsive Slide-Up) */}
//       <div className={`
//             fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 ease-out
//             md:static md:w-96 md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-xl md:translate-y-0
//             ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
//       `}>
        
//         {/* Mobile Header (Close Button) */}
//         <div className="md:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
//             <h2 className="font-bold text-lg text-slate-800">Current Bill</h2>
//             <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-white rounded-full border border-slate-200 text-slate-500">
//                 <ChevronDown size={20} />
//             </button>
//         </div>
        
//         {/* Quick Add Form */}
//         <div className="p-4 bg-slate-50 border-b border-slate-100 shrink-0">
//             <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
//                 <Zap size={12} className="text-amber-500"/> Quick Add (Manual)
//             </h3>
//             <form onSubmit={addManualItem} className="flex gap-2">
//                 <input 
//                     className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 w-full"
//                     placeholder="Item Name"
//                     value={manualName}
//                     onChange={(e) => setManualName(e.target.value)}
//                 />
//                 <input 
//                     className="w-16 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500"
//                     type="number"
//                     placeholder="₹"
//                     value={manualPrice}
//                     onChange={(e) => setManualPrice(e.target.value)}
//                 />
//                 <input 
//                     className="w-12 px-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 text-center"
//                     type="number"
//                     placeholder="Qty"
//                     value={manualQty}
//                     onChange={(e) => setManualQty(e.target.value)}
//                 />
//                 <button type="submit" className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors">
//                     <Plus size={16} />
//                 </button>
//             </form>
//         </div>

//         {/* Cart Items List */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
//           {cart.length === 0 ? (
//              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
//                  <ShoppingBag size={32} className="mb-2" />
//                  <p className="text-sm">Cart is empty.</p>
//                  <button onClick={() => setIsMobileCartOpen(false)} className="mt-4 text-emerald-600 font-bold text-xs md:hidden">
//                     Close & Add Items
//                  </button>
//              </div>
//           ) : (
//             cart.map(item => (
//               <div key={item.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${item.isManual ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
//                 <div className="flex justify-between items-start">
//                     <div>
//                         <div className="font-bold text-slate-700 text-sm">{item.name}</div>
//                         {item.isManual && <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-1 rounded">Manual</span>}
//                     </div>
//                     <div className="font-bold text-slate-800">₹{item.price * item.quantity}</div>
//                 </div>
                
//                 <div className="flex justify-between items-center">
//                   <div className="text-xs text-slate-400 font-medium">₹{item.price}/unit</div>
//                   <div className="flex items-center gap-3">
//                     <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
//                         <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-l-lg"><Minus size={14} /></button>
//                         <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
//                         <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-r-lg"><Plus size={14} /></button>
//                     </div>
//                     <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Footer */}
//         <div className="border-t border-slate-100 p-4 bg-slate-50 shrink-0">
//           <div className="flex justify-between items-end mb-4"><span className="text-slate-500 font-bold text-sm">Total Amount</span><span className="text-3xl font-bold text-slate-900">₹{cartTotal}</span></div>
//           <button onClick={() => setShowQr(true)} disabled={cart.length === 0} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"><QrCode size={18} /> Generate QR</button>
//         </div>
//       </div>

//       {/* QR Modal */}
//       {showQr && (
//         <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
//           <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-[popIn_0.2s_ease-out]">
//             <div className="flex justify-end"><button onClick={() => setShowQr(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button></div>
//             <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan to Pay</h2>
//             <div className="bg-slate-900 p-4 rounded-xl inline-block my-4 shadow-xl">
//                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
//                     <span className="font-mono text-xs text-slate-300">QR CODE HERE</span>
//                  </div>
//             </div>
//             <div className="text-3xl font-bold text-emerald-600 mb-6">₹{cartTotal}</div>
//             <button onClick={() => { setShowQr(false); setCart([]); setIsMobileCartOpen(false); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Payment Received</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MerchantBilling;


import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, QrCode, X, Plus, Minus, Trash2, Search, Zap } from 'lucide-react';

const MerchantBilling = ({ inventory }) => {
  // 🛒 Cart & UI State
  const [cart, setCart] = useState([]);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(""); // Stores the QR Image URL
  const [generatedBill, setGeneratedBill] = useState(null); // Stores the bill data for display

  // 🔍 Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // ⚡ Manual Item State
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Load Merchant Profile for the Receipt Header
  const merchantProfile = JSON.parse(localStorage.getItem('merchantProfile')) || { 
    shopName: "GreenReceipt Shop", 
    merchantId: "GR-DEMO" 
  };

  // Calculations
  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const categories = ["All", ...new Set(inventory.map(i => i.category || "General"))];

  // Search Logic
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || (item.category || "General") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, selectedCategory]);

  // ——— ACTIONS ———

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const addManualItem = (e) => {
    e.preventDefault();
    if (!manualName || !manualPrice) return;
    const newItem = {
      id: `manual-${Date.now()}`,
      name: manualName,
      price: parseFloat(manualPrice),
      quantity: parseInt(manualQty) > 0 ? parseInt(manualQty) : 1,
      isManual: true
    };
    setCart(prev => [...prev, newItem]);
    setManualName("");
    setManualPrice("");
    setManualQty(1);
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(item => item.id !== itemId));

  // 🚀 CORE LOGIC: GENERATE REAL QR DATA
  const handleGenerateQR = () => {
    // 1. Create the Bill Payload
    const billData = {
      id: `GR-${Date.now().toString().slice(-6)}`, // Unique ID
      merchant: merchantProfile.shopName,
      mid: merchantProfile.merchantId,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      total: cartTotal,
      items: cart.map(item => ({
        n: item.name, // Short key 'n' to save space in QR
        q: item.quantity,
        p: item.price
      })),
      footer: merchantProfile.receiptFooter || "Thank you!"
    };

    setGeneratedBill(billData);

    // 2. Convert to JSON String
    const jsonString = JSON.stringify(billData);

    // 3. Generate QR Image URL using a free API (No npm install needed!)
    // We encode the JSON string to make it URL-safe
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(jsonString)}`;
    
    setQrDataUrl(apiUrl);
    setShowQr(true);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in relative">
      
      {/* 🔹 LEFT: ITEMS GRID */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-white z-10 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input type="text" placeholder="Search menu items..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
            {filteredItems.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><Search size={32} className="mb-2"/><p>No items found.</p></div> : 
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {filteredItems.map(item => (
                        <button key={item.id} onClick={() => addToCart(item)} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all text-left group active:scale-95 flex flex-col justify-between h-24">
                            <div><div className="font-bold text-slate-700 group-hover:text-emerald-700 leading-tight line-clamp-2">{item.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">{item.category}</div></div>
                            <div className="text-sm font-bold text-emerald-600">₹{item.price}</div>
                        </button>
                    ))}
                </div>
            }
        </div>
      </div>

      {/* 🔹 MOBILE FLOATING BAR */}
      {!isMobileCartOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-xl z-40 flex items-center justify-between" onClick={() => setIsMobileCartOpen(true)}>
           <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total ({totalItems} items)</p><p className="text-2xl font-bold text-slate-800">₹{cartTotal}</p></div>
           <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">View Bill</button>
        </div>
      )}

      {/* 🔹 RIGHT: CART PANEL */}
      <div className={`fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 ease-out md:static md:w-96 md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-xl md:translate-y-0 ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
        <div className="md:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h2 className="font-bold text-lg text-slate-800">Current Bill</h2><button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-white rounded-full border border-slate-200 text-slate-500"><X size={20} /></button></div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100 shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Zap size={12} className="text-amber-500"/> Quick Add (Manual)</h3>
            <form onSubmit={addManualItem} className="flex gap-2"><input className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 w-full" placeholder="Item Name" value={manualName} onChange={(e) => setManualName(e.target.value)} /><input className="w-16 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500" type="number" placeholder="₹" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} /><input className="w-12 px-2 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 text-center" type="number" placeholder="Qty" value={manualQty} onChange={(e) => setManualQty(e.target.value)} /><button type="submit" className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors"><Plus size={16} /></button></form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60"><ShoppingBag size={32} className="mb-2" /><p className="text-sm">Cart is empty.</p></div> : 
            cart.map(item => (
              <div key={item.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${item.isManual ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start"><div><div className="font-bold text-slate-700 text-sm">{item.name}</div>{item.isManual && <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-1 rounded">Manual</span>}</div><div className="font-bold text-slate-800">₹{item.price * item.quantity}</div></div>
                <div className="flex justify-between items-center"><div className="text-xs text-slate-400 font-medium">₹{item.price}/unit</div><div className="flex items-center gap-3"><div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm"><button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-l-lg"><Minus size={14} /></button><span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-r-lg"><Plus size={14} /></button></div><button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></div>
              </div>
            ))
          }
        </div>

        <div className="border-t border-slate-100 p-4 bg-slate-50 shrink-0">
          <div className="flex justify-between items-end mb-4"><span className="text-slate-500 font-bold text-sm">Total Amount</span><span className="text-3xl font-bold text-slate-900">₹{cartTotal}</span></div>
          {/* 👇 THIS BUTTON TRIGGERS THE REAL QR */}
          <button onClick={handleGenerateQR} disabled={cart.length === 0} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"><QrCode size={18} /> Generate QR</button>
        </div>
      </div>

      {/* 📸 QR MODAL (Now shows Real QR) */}
      {showQr && (
        <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-[popIn_0.2s_ease-out]">
            <div className="flex justify-end"><button onClick={() => setShowQr(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button></div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan to Save Bill</h2>
            <p className="text-xs text-slate-500 mb-4">Customer can scan this to get the receipt instantly.</p>
            
            <div className="bg-white p-2 rounded-xl inline-block mb-4 border border-slate-200 shadow-xl">
                 {/* 👇 REAL QR CODE IMAGE FROM API */}
                 {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Receipt QR" className="w-56 h-56 rounded-lg" />
                 ) : (
                    <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400">Loading QR...</div>
                 )}
            </div>

            <div className="text-3xl font-bold text-emerald-600 mb-2">₹{cartTotal}</div>
            <div className="text-xs text-slate-400 font-mono mb-6 bg-slate-50 p-2 rounded truncate max-w-[250px] mx-auto">
               ID: {generatedBill?.id}
            </div>

            <button onClick={() => { setShowQr(false); setCart([]); setIsMobileCartOpen(false); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Payment Received</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantBilling;