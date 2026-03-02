// import React from 'react';

// const BenefitCard = ({ icon, gradient, shadow, title, subtitle }) => (
//   <div className="glass rounded-3xl p-8 border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
//     <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${shadow} mb-6`}>
//       <i className={`fas ${icon}`}></i>
//     </div>
//     <h3 className="text-3xl font-extrabold stat-number mb-2">{title}</h3>
//     <p className="text-slate-600 font-medium">{subtitle}</p>
//   </div>
// );

// const Benefits = () => (
//   <section id="benefits" className="py-20 relative">
//     <div className="max-w-7xl mx-auto px-6 sm:px-8">
//       <div className="grid md:grid-cols-3 gap-8">
//         <BenefitCard 
//   icon="fa-layer-group"
//   gradient="from-emerald-400 to-teal-500"
//   shadow="shadow-emerald-500/30"
//   title="1 app"
//   subtitle="Every receipt from every shop"
// />

// <BenefitCard 
//   icon="fa-mobile-alt"
//   gradient="from-blue-400 to-indigo-500"
//   shadow="shadow-blue-500/30"
//   title="0 installs"
//   subtitle="Scan & done for customers"
// />

// <BenefitCard 
//   icon="fa-receipt"
//   gradient="from-purple-400 to-pink-500"
//   shadow="shadow-purple-500/30"
//   title="Forever saved"
//   subtitle="No fading, no lost bills"
// />
// <BenefitCard 
//   icon="fa-receipt"
//   gradient="from-purple-400 to-pink-500"
//   shadow="shadow-purple-500/30"
//   title="Forever saved"
//   subtitle="No fading, no lost bills"
// />

//       </div>
//     </div>
//   </section>
// );

// export default Benefits;


// import React from 'react';
// import { 
//   ScanLine, 
//   Smartphone, 
//   History, 
//   PieChart, 
//   Store, 
//   Wallet 
// } from 'lucide-react';
// import CTA from './CTA';

// const benefitsData = [
//   {
//     icon: <History className="w-6 h-6 text-emerald-600" />,
//     title: "All Bills. One Place.",
//     desc: "Every receipt from every shop, unified automatically."
//   },
//   {
//     icon: <ScanLine className="w-6 h-6 text-emerald-600" />,
//     title: "0 Installs Needed",
//     desc: "Scan once. Nothing to download. Just works."
//   },
//   {
//     icon: <Wallet className="w-6 h-6 text-emerald-600" />,
//     title: "Never Lose a Bill",
//     desc: "No fading paper. No missing receipts. Forever safe."
//   },
//   {
//     icon: <PieChart className="w-6 h-6 text-emerald-600" />,
//     title: "Auto Expense Tracking",
//     desc: "Spending sorted by shop, instantly categorized."
//   },
//   {
//     icon: <Store className="w-6 h-6 text-emerald-600" />,
//     title: "Works Everywhere",
//     desc: "Kirana, food stalls, sweets & general stores."
//   },
//   {
//     icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
//     title: "₹0 Setup",
//     desc: "Merchants use the phone they already own."
//   }
// ];

// const BenefitsSection = () => {
//   return (
//     <section className="relative py-20 bg-slate-50 overflow-hidden">
//       {/* Background Decor (Subtle Gradients) */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
//         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
//         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
//       </div>

//       <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        
//         {/* Section Header */}
//         <div className="text-center mb-16 max-w-2xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
//             All bills. One place. <span className="text-emerald-600">Zero effort.</span>
//           </h2>
//           <p className="text-slate-600 text-lg">
//             The modern way to manage expenses for shops and customers alike.
//           </p>
//         </div>

//         {/* 🧩 The Grid (Bento Style) */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
//           {benefitsData.map((benefit, index) => (
//             <div 
//               key={index} 
//               className="group bg-white bg-opacity-60 backdrop-blur-lg border border-white/50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
//             >
//               <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                 {benefit.icon}
//               </div>
//               <h3 className="text-xl font-bold text-slate-900 mb-2">
//                 {benefit.title}
//               </h3>
//               <p className="text-slate-500 font-medium leading-relaxed">
//                 {benefit.desc}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* 🔥 CTA Section */}
//         <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-center py-16 px-6 shadow-2xl">
//           {/* CTA Background Gradient */}
//           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 z-0"></div>
//           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
          
//           <div className="relative z-10 max-w-3xl mx-auto">
//             <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
//               Stop losing bills. <span className="text-emerald-400">Start saving them.</span>
//             </h2>
//             <p className="text-slate-300 text-lg mb-10">
//               Free for customers. Simple for merchants.
//             </p>
            
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <button className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105">
//                 Try GreenReceipt
//               </button>
//               <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg backdrop-blur-sm transition-all">
//                 See how it works
//               </button>
//             </div>
//           </div>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default BenefitsSection;

// import React from 'react';
// import { 
//   ScanLine, 
//   Smartphone, 
//   History, 
//   PieChart, 
//   Store, 
//   Wallet 
// } from 'lucide-react';
// import CTA from './CTA'; // Ensure CTA.jsx is in the same folder

// const benefitsData = [
//   {
//     icon: <History className="w-6 h-6 text-emerald-600" />,
//     title: "All Bills. One Place.",
//     desc: "Every receipt from every shop, unified automatically."
//   },
//   {
//     icon: <ScanLine className="w-6 h-6 text-emerald-600" />,
//     title: "0 Installs Needed",
//     desc: "Scan once. Nothing to download. Just works."
//   },
//   {
//     icon: <Wallet className="w-6 h-6 text-emerald-600" />,
//     title: "Never Lose a Bill",
//     desc: "No fading paper. No missing receipts. Forever safe."
//   },
//   {
//     icon: <PieChart className="w-6 h-6 text-emerald-600" />,
//     title: "Auto Expense Tracking",
//     desc: "Spending sorted by shop, instantly categorized."
//   },
//   {
//     icon: <Store className="w-6 h-6 text-emerald-600" />,
//     title: "Works Everywhere",
//     desc: "Kirana, food stalls, sweets & general stores."
//   },
//   {
//     icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
//     title: "₹0 Setup",
//     desc: "Merchants use the phone they already own."
//   }
// ];

// const BenefitsSection = () => {
//   return (
//     <section className="relative py-20 bg-slate-50 overflow-hidden">
//       {/* Background Decor (Subtle Gradients) */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
//         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
//         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
//       </div>

//       <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        
//         {/* Section Header */}
//         <div className="text-center mb-16 max-w-2xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
//             All bills. One place. <span className="text-emerald-600">Zero effort.</span>
//           </h2>
//           <p className="text-slate-600 text-lg">
//             The modern way to manage expenses for shops and customers alike.
//           </p>
//         </div>

//         {/* 🧩 The Grid (Bento Style) */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
//           {benefitsData.map((benefit, index) => (
//             <div 
//               key={index} 
//               className="group bg-white bg-opacity-60 backdrop-blur-lg border border-white/50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
//             >
//               <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                 {benefit.icon}
//               </div>
//               <h3 className="text-xl font-bold text-slate-900 mb-2">
//                 {benefit.title}
//               </h3>
//               <p className="text-slate-500 font-medium leading-relaxed">
//                 {benefit.desc}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* 🔥 CTA Section (Now using your new Component) */}
//         <CTA />

//       </div>
//     </section>
//   );
// };

// export default BenefitsSection;


import React from 'react';
import { 
  ScanLine, 
  Smartphone, 
  History, 
  PieChart, 
  Store, 
  Wallet 
} from 'lucide-react';
import CTA from './CTA';

const benefitsData = [
  {
    icon: <History className="w-6 h-6 text-emerald-600" />,
    title: "All Bills. One Place.",
    desc: "Every receipt from every shop, unified automatically."
  },
  {
    icon: <ScanLine className="w-6 h-6 text-emerald-600" />,
    title: "0 Installs Needed",
    desc: "Scan once. Nothing to download. Just works."
  },
  {
    icon: <Wallet className="w-6 h-6 text-emerald-600" />,
    title: "Never Lose a Bill",
    desc: "No fading paper. No missing receipts. Forever safe."
  },
  {
    icon: <PieChart className="w-6 h-6 text-emerald-600" />,
    title: "Auto Expense Tracking",
    desc: "Spending sorted by shop, instantly categorized."
  },
  {
    icon: <Store className="w-6 h-6 text-emerald-600" />,
    title: "Works Everywhere",
    desc: "Kirana, food stalls, sweets & general stores."
  },
  {
    icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
    title: "₹0 Setup",
    desc: "Merchants use the phone they already own."
  }
];

// 1️⃣ Duplicate data to create the illusion of infinite scroll
const duplicatedBenefits = [...benefitsData, ...benefitsData];

const BenefitCard = ({ benefit }) => (
   <div 
      className="group bg-white bg-opacity-60 backdrop-blur-lg border border-white/50 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full"
    >
      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {benefit.icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {benefit.title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
        {benefit.desc}
      </p>
    </div>
);


const BenefitsSection = () => {
  return (
    <section className="relative py-16 md:py-20 bg-slate-50 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            All bills. One place. <span className="text-emerald-600">Zero effort.</span>
          </h2>
          <p className="text-slate-600 text-lg">
            The modern way to manage expenses for shops and customers alike.
          </p>
        </div>


        {/* 📱 MOBILE LAYOUT: Infinite Auto-Scroll Carousel (Hidden on desktop) */}
        <div className="md:hidden relative w-full overflow-hidden -mx-4 mb-16">
           {/* Optional: Gradients on edges to smooth the entry/exit */}
           <div className="absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none"></div>
           <div className="absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
           
           {/* The moving track container */}
           {/* Add 'hover:pause' to the className if you want it to stop when the user touches it */}
           <div className="flex w-max animate-scroll gap-4 px-4">
              {duplicatedBenefits.map((benefit, index) => (
                 // Set a fixed width for mobile cards so they look uniform
                 <div key={index} className="w-[280px] flex-shrink-0"> 
                    <BenefitCard benefit={benefit} />
                 </div>
              ))}
           </div>
        </div>


        {/* 🖥️ DESKTOP LAYOUT: Static Grid (Hidden on mobile) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {benefitsData.map((benefit, index) => (
             <BenefitCard key={index} benefit={benefit} />
          ))}
        </div>

        {/* 🔥 CTA Section */}
        <CTA />

      </div>
    </section>
  );
};

export default BenefitsSection;