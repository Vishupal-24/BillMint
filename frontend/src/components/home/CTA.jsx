// import React from 'react';
// import { Link } from 'react-router-dom';

// const CTA = () => {
//   return (
//     <section className="py-24 relative overflow-hidden">
//       <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 animate-gradient"></div>

//       {/* Background Blobs */}
//       <div className="absolute inset-0 opacity-10 pointer-events-none">
//         <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
//         <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
//       </div>

//       <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10">
//         <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to go green?</h2>
//         <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
//           Join thousands of users who've already made the switch to paperless receipts.
//         </p>
//         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//           <Link to="/customer-login" className="group px-10 py-5 bg-white text-emerald-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/40 hover:scale-105 transition-all duration-300 text-center flex items-center justify-center gap-3">
//             Get Started Free
//             <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
//           </Link>
//           <Link to="/merchant-login" className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-emerald-600 hover:scale-105 transition-all duration-300 text-center">
//             Merchant Sign Up
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CTA;

// import React from 'react';
// import {
//   Calculator,
//   QrCode,
//   CheckCircle2,
//   ArrowRight
// } from 'lucide-react';
// import InteractivePhoneDemo from './InteractivePhoneDemo';

// const steps = [
//   {
//     icon: <Calculator className="w-8 h-8 text-emerald-600" />,
//     title: "1. Shopkeeper Enters Bill",
//     desc: "Merchant types the amount or items on their phone. No fancy machine needed."
//   },
//   {
//     icon: <QrCode className="w-8 h-8 text-emerald-600" />,
//     title: "2. Customer Scans QR",
//     desc: "Customer scans the code to pay & get the bill instantly. No app install required."
//   },
//   {
//     icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
//     title: "3. Saved Forever",
//     desc: "The digital receipt is saved to the customer's history and merchant's dashboard."
//   }
// ];

// const CTA = () => {
//   return (
//     <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-center py-16 px-6 shadow-2xl mt-20">

//       {/* Background Ambience */}
//       <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 z-0"></div>
//       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>

//       <div className="relative z-10 max-w-5xl mx-auto">

//         {/* Header */}
//         <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">
//           How it works: <span className="text-emerald-400">Simple as 1-2-3</span>
//         </h2>

//         {/* 🔄 The Flow Diagram */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mb-16">

//           {/* Connecting Line (Desktop Only) */}
//           <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-700 via-emerald-900 to-slate-700 z-0"></div>

//           {steps.map((step, index) => (
//             <div key={index} className="relative z-10 flex flex-col items-center group">

//               {/* Step Number Badge */}
//               <div className="absolute -top-3 bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-full border border-slate-700">
//                 Step 0{index + 1}
//               </div>

//               {/* Icon Circle */}
//               <div className="w-24 h-24 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-xl group-hover:border-emerald-500/50 group-hover:bg-slate-800/80 transition-all duration-300">
//                 {step.icon}
//               </div>

//               {/* Text */}
//               <h3 className="text-xl font-bold text-white mb-3">
//                 {step.title}
//               </h3>
//               <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
//                 {step.desc}
//               </p>

//               {/* Mobile Arrow (Visual Only) */}
//               {index < 2 && (
//                 <div className="md:hidden mt-8 text-slate-700">
//                   <ArrowRight className="w-6 h-6 rotate-90" />
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Final Action Button */}
//         <div className="inline-block relative group">
//           <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
//           <button className="relative px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xl shadow-lg transition-all flex items-center gap-3">
//             Get Started Now
//             <ArrowRight className="w-5 h-5" />
//           </button>
//         </div>

//         <p className="mt-6 text-slate-500 text-sm">
//           No credit card required • Free for customers
//         </p>

//       </div>
//     </div>
//   );
// };

// export default CTA;

import React from "react";
import { Calculator, QrCode, CheckCircle2, ArrowRight } from "lucide-react";
import InteractivePhoneDemo from "./InteractivePhoneDemo";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: <Calculator className="w-8 h-8 text-emerald-600" />,
    title: "1. Shopkeeper Enters Bill",
    desc: "Merchant types the amount or items on their phone. No fancy machine needed.",
  },
  {
    icon: <QrCode className="w-8 h-8 text-emerald-600" />,
    title: "2. Customer Scans QR",
    desc: "Customer scans the code to pay & get the bill instantly. No app install required.",
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
    title: "3. Saved Forever",
    desc: "The digital receipt is saved to the customer's history and merchant's dashboard.",
  },
];

const CTA = () => {
  const navigate = useNavigate();
  return (
    // 👇 ADDED id="how-it-works" and scroll-mt-24 here
    <div 
      id="how-it-works"
      className="relative rounded-3xl overflow-hidden bg-slate-900 text-center py-16 px-6 shadow-2xl mt-20 scroll-mt-24"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">
          How it works:{" "}
          <span className="text-emerald-400">Simple as 1-2-3</span>
        </h2>

        {/* 📱 MOBILE ONLY: The Interactive Phone Demo */}
        <div className="md:hidden mb-12">
          <InteractivePhoneDemo />
        </div>

        {/* 💻 DESKTOP ONLY: The Static Flow Diagram */}
        <div className="hidden md:grid grid-cols-3 gap-8 relative mb-16">
          {/* Connecting Line */}
          <div className="absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-700 via-emerald-900 to-slate-700 z-0"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center group"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-3 bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-full border border-slate-700">
                Step 0{index + 1}
              </div>

              {/* Icon Circle */}
              <div className="w-24 h-24 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-xl group-hover:border-emerald-500/50 group-hover:bg-slate-800/80 transition-all duration-300">
                {step.icon}
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Final Action Button */}
        <div className="inline-block relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <button
            onClick={() => navigate("/login")}
            className="relative px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xl shadow-lg transition-all flex items-center gap-3"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-6 text-slate-500 text-sm">
          No credit card required • Free for customers
        </p>
      </div>
    </div>
  );
};

export default CTA;