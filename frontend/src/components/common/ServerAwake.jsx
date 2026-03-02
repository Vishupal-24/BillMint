import React, { useState, useEffect } from 'react';
import { Loader2, Server, ShieldCheck, Wifi } from 'lucide-react';
import api from '../../services/api'; // Ensure this points to your axios instance

const ServerAwake = ({ onReady }) => {
  const [longWait, setLongWait] = useState(false);

  // 1. The Ping Logic
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Ping the health route
        await api.get('/health'); 
        
        // If successful, finish!
        onReady(); 
      } catch (error) {
        // If it fails (server sleeping), retry in 2 seconds
        console.log('Server sleeping... waking up...');
        setTimeout(checkServer, 2000);
      }
    };

    checkServer();
  }, [onReady]);

  // 2. UX Timer: If it takes >3 seconds, tell the user why
  useEffect(() => {
    const timer = setTimeout(() => setLongWait(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      
      {/* Icon Animation */}
      <div className="relative mb-8">
        {/* Glowing Pulse Effect */}
        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-emerald-500/10 flex items-center justify-center relative z-10 border border-slate-100">
          {longWait ? (
            <Server className="text-emerald-600 animate-bounce" size={40} />
          ) : (
            <ShieldCheck className="text-emerald-600" size={40} />
          )}
        </div>
        
        {/* Status Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
             {longWait ? "Waking Up" : "Secure"}
           </span>
        </div>
      </div>

      {/* Main Text */}
      <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
        {longWait ? "Initializing Cloud Server..." : "GreenReceipt"}
      </h2>

      {/* Subtext (Changes based on wait time) */}
      <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed font-medium">
        {longWait 
          ? "The server is waking up from sleep mode. This usually takes about 30 seconds. Thanks for your patience!" 
          : "Establishing a secure connection..."}
      </p>

      {/* Loading Spinner */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={24} />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {longWait ? "Starting Services" : "Connecting"}
        </span>
      </div>

    </div>
  );
};

export default ServerAwake;