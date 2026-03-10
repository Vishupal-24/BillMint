import React, { useState, useEffect } from 'react';
import { 
  ScanLine, 
  Receipt, 
  CheckCircle2, 
  Smartphone,
  ArrowRight
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Merchant Types",
    sub: "₹150 entered",
    color: "bg-blue-500",
    icon: <Receipt className="w-8 h-8 text-white" />
  },
  {
    id: 2,
    title: "Customer Scans",
    sub: "Camera active",
    color: "bg-emerald-500",
    icon: <ScanLine className="w-8 h-8 text-white" />
  },
  {
    id: 3,
    title: "Bill Saved!",
    sub: "Instant Digital Copy",
    color: "bg-slate-900",
    icon: <CheckCircle2 className="w-8 h-8 text-green-400" />
  }
];

const InteractivePhoneDemo = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-cycle through steps every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-10 md:hidden flex flex-col items-center justify-center">
      <h3 className="text-2xl font-bold text-white mb-8 text-center">
        See it in action
      </h3>

      {/* 📱 THE PHONE FRAME */}
      <div className="relative w-[280px] h-[500px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden ring-4 ring-slate-900/50">
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>

        {/* 📺 SCREEN CONTENT */}
        <div className="w-full h-full bg-slate-100 relative overflow-hidden flex flex-col">
          
          {/* Header Bar */}
          <div className="h-14 bg-white border-b flex items-center justify-center pt-4 shadow-sm z-10">
            <span className="font-bold text-emerald-600 tracking-tight">GreenReceipt</span>
          </div>

          {/* DYNAMIC SCENE CONTAINER */}
          <div className="flex-1 relative p-6 flex flex-col items-center justify-center transition-all duration-500">
            
            {/* STEP 1: BILLING UI */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 transform ${activeStep === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
               <div className="w-48 bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-4">
                  <div className="h-2 w-12 bg-slate-200 rounded mb-4 mx-auto"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400"><span>Item</span><span>Price</span></div>
                    <div className="flex justify-between font-bold text-slate-700"><span>Samosa x2</span><span>₹40</span></div>
                    <div className="flex justify-between font-bold text-slate-700"><span>Tea x4</span><span>₹40</span></div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between font-bold text-xl text-emerald-600"><span>Total</span><span>₹80</span></div>
                  </div>
               </div>
               <div className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium animate-pulse">
                  Generating QR...
               </div>
            </div>

            {/* STEP 2: SCANNING UI */}
            <div className={`absolute inset-0 bg-slate-900 flex flex-col items-center justify-center transition-all duration-500 transform ${activeStep === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
               <div className="relative w-48 h-48 border-2 border-white/30 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/20"></div>
                  {/* Laser Scanner Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[bounce_2s_infinite]"></div>
                  <ScanLine className="w-16 h-16 text-white/80" />
               </div>
               <p className="text-white mt-6 font-medium animate-pulse">Scanning Code...</p>
            </div>

            {/* STEP 3: SUCCESS UI */}
            <div className={`absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center transition-all duration-500 transform ${activeStep === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
               <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 drop-shadow-lg" />
               </div>
               <h4 className="text-2xl font-bold text-emerald-900 mb-2">Paid & Saved!</h4>
               <p className="text-emerald-700 text-sm">Receipt #88291 added to your history.</p>
               
               {/* Digital Receipt Card appearing */}
               <div className="mt-8 bg-white p-3 rounded shadow-md w-40 transform rotate-[-3deg] border border-emerald-100">
                  <div className="h-1.5 w-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-1.5 w-full bg-slate-100 rounded mb-1"></div>
                  <div className="h-1.5 w-2/3 bg-slate-100 rounded"></div>
               </div>
            </div>

          </div>

          {/* 🔘 PROGRESS INDICATORS (Bottom of Phone) */}
          <div className="h-20 bg-white border-t flex flex-col items-center justify-center space-y-3 z-10">
            <div className="flex gap-2">
              {steps.map((step, idx) => (
                <div 
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeStep === idx ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'}`}
                ></div>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {steps[activeStep].title}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractivePhoneDemo;