import React from 'react';
import { User, Mail, Leaf, ShieldCheck } from 'lucide-react';
import { USER_PROFILE } from './customerData';

const CustomerProfile = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="text-center py-8">
         <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300 mb-4">
            <User size={48} />
         </div>
         <h2 className="text-2xl font-bold text-slate-800">{USER_PROFILE.name}</h2>
         <p className="text-slate-400 text-sm">Personal Archive</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
         <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Mail className="text-slate-400" size={18} />
               <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                  <p className="font-medium text-slate-700">{USER_PROFILE.email}</p>
               </div>
            </div>
         </div>
         <div className="p-4 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center gap-3">
               <Leaf className="text-emerald-500" size={18} />
               <div>
                  <p className="text-xs text-emerald-600 font-bold uppercase">Green Impact</p>
                  <p className="font-bold text-emerald-800">{USER_PROFILE.totalSaved} Saved</p>
               </div>
            </div>
         </div>
      </div>

      <div className="text-center">
         <p className="text-xs text-slate-300 flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Securely stored in GreenReceipt Vault
         </p>
      </div>
    </div>
  );
};

export default CustomerProfile;