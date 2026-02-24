import React, { useState, useEffect } from 'react';
import { 
  User, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  LogOut, 
  Edit2, 
  Save, 
  X,
  Receipt,
  ShieldCheck,
  Leaf,
  Trophy
} from 'lucide-react';

const MerchantProfile = () => {
  // 🟢 STATE: Load from LocalStorage OR use Default Mock Data
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('merchantProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      shopName: "College Canteen",
      ownerName: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh.canteen@gmail.com",
      address: "Block A, City Engineering College, Ludhiana",
      receiptFooter: "Thank you! Visit again.",
      merchantId: "GR-8829-XJ",
      joinedDate: "Aug 15, 2024",
      currency: "INR (₹)"
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });

  // 💾 EFFECT: Auto-save to LocalStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem('merchantProfile', JSON.stringify(profile));
  }, [profile]);

  // ⚡ HANDLERS
  const handleEdit = () => {
    setTempProfile({ ...profile }); 
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({ ...tempProfile }); 
    setIsEditing(false);
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token'); 
        localStorage.removeItem('role');
        window.location.href = '/merchant-login';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      
      {/* 1️⃣ BUSINESS IDENTITY HEADER */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            {/* Avatar / Logo Placeholder */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white/20 text-emerald-600 font-bold text-3xl shrink-0 uppercase">
                {profile.shopName.charAt(0)}
            </div>
            
            <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{profile.shopName}</h1>
                <p className="text-emerald-100 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
                    <Store size={16} /> Food & Beverage • Merchant
                </p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10">
                        {profile.merchantId}
                    </span>
                    <span className="px-3 py-1 bg-emerald-800/30 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10 flex items-center gap-1">
                        <ShieldCheck size={12} /> Verified
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2️⃣ BASIC DETAILS FORM (Editable) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="font-bold text-slate-800 text-lg">Business Details</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Contact info & location</p>
                </div>
                {!isEditing ? (
                    <button 
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <Save size={14} /> Save
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-5">
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Shop Name */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Shop Name</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                disabled={!isEditing}
                                type="text" 
                                value={isEditing ? tempProfile.shopName : profile.shopName}
                                onChange={(e) => setTempProfile({...tempProfile, shopName: e.target.value})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-medium transition-all ${isEditing ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                        </div>
                    </div>

                    {/* Owner Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Owner Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                disabled={!isEditing}
                                type="text" 
                                value={isEditing ? tempProfile.ownerName : profile.ownerName}
                                onChange={(e) => setTempProfile({...tempProfile, ownerName: e.target.value})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-medium transition-all ${isEditing ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                disabled={!isEditing}
                                type="text" 
                                value={isEditing ? tempProfile.phone : profile.phone}
                                onChange={(e) => setTempProfile({...tempProfile, phone: e.target.value})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-medium transition-all ${isEditing ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                disabled={!isEditing}
                                type="email" 
                                value={isEditing ? tempProfile.email : profile.email}
                                onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-medium transition-all ${isEditing ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                        </div>
                    </div>

                     {/* Address */}
                     <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Shop Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                            <textarea 
                                disabled={!isEditing}
                                rows="2"
                                value={isEditing ? tempProfile.address : profile.address}
                                onChange={(e) => setTempProfile({...tempProfile, address: e.target.value})}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-medium transition-all resize-none ${isEditing ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
            
            {/* 3️⃣ RECEIPT PREVIEW */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-emerald-600"/> Receipt Branding
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Footer Message</label>
                        <input 
                             disabled={!isEditing}
                             type="text"
                             value={isEditing ? tempProfile.receiptFooter : profile.receiptFooter}
                             onChange={(e) => setTempProfile({...tempProfile, receiptFooter: e.target.value})}
                             placeholder="e.g. Thank you, visit again!"
                             className={`w-full px-4 py-2 text-sm rounded-lg border outline-none transition-all ${isEditing ? 'border-emerald-500' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>

                    {/* LIVE PREVIEW BOX */}
                    <div className="mt-4 bg-slate-100 p-4 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-2">Live Customer Preview</p>
                        <div className="bg-white p-4 shadow-sm border border-slate-200 mx-auto max-w-[200px] text-center font-mono text-[10px] leading-tight relative">
                            <div className="absolute -top-1 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:8px_8px] rotate-180"></div>
                            <div className="font-bold text-xs mb-1 text-slate-800">{isEditing ? tempProfile.shopName : profile.shopName}</div>
                            <div className="text-slate-400 text-[8px] mb-3">{isEditing ? tempProfile.address : profile.address}</div>
                            <div className="border-b border-dashed border-slate-300 my-2"></div>
                            <div className="flex justify-between my-1"><span>Masala Chai</span><span>15.00</span></div>
                            <div className="flex justify-between my-1"><span>Sandwich</span><span>45.00</span></div>
                            <div className="border-b border-dashed border-slate-300 my-2"></div>
                            <div className="flex justify-between font-bold text-slate-800"><span>TOTAL</span><span>₹60.00</span></div>
                            <div className="mt-4 text-slate-500 italic">"{isEditing ? tempProfile.receiptFooter : profile.receiptFooter}"</div>
                            <div className="absolute -bottom-1 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:8px_8px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4️⃣ 🌱 IMPACT CARD (NEW! Replaces Account Info) */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
                        <Leaf size={18} className="text-emerald-600" /> Your Green Impact
                    </h3>
                    <p className="text-xs text-emerald-700 mb-6">Since joining, you have saved:</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50">
                            <p className="text-2xl font-bold text-emerald-800">12.5 <span className="text-xs font-normal text-emerald-600">kg</span></p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Paper Saved</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50">
                            <p className="text-2xl font-bold text-emerald-800">1.4k</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Digital Bills</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100/50 p-2 rounded-lg">
                        <Trophy size={14} className="text-amber-500" />
                        <span>You are in the top <strong>5%</strong> of eco-friendly shops in your city!</span>
                    </div>
                </div>
                {/* Background Decor */}
                <Leaf className="absolute -right-6 -bottom-6 text-emerald-200/50 rotate-[-15deg]" size={140} />
            </div>

            {/* 5️⃣ LOGOUT BUTTON (Moved to Bottom) */}
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100"
            >
                <LogOut size={16} /> Logout Account
            </button>

        </div>
      </div>
    </div>
  );
};

export default MerchantProfile;