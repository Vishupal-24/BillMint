// import React, { useState } from 'react';
// import Logo from '../common/Logo';

// const Navbar = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-lg shadow-slate-200/50">
//       <div className="max-w-7xl mx-auto px-6 sm:px-8">
//         <div className="flex justify-between h-20 items-center">
//           <Logo />
          
//           {/* Desktop Menu */}
//           <div className="hidden md:flex items-center space-x-8">
//             {/* <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-all duration-300 hover:scale-105">Features</a>
//             <a href="#benefits" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-all duration-300 hover:scale-105">Benefits</a> */}
//             <div className="h-5 w-px bg-slate-200"></div>
//             <a href="/merchant-login" className="text-sm font-bold text-slate-900 hover:text-emerald-500 transition-all duration-300">Merchant Login</a>
//             <a href="/customer-login" className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
//               <span className="relative z-10">Customer Login</span>
//               <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             </a>
//           </div>

//           {/* Mobile Button */}
//           {/* <button 
//             onClick={() => setIsOpen(!isOpen)} 
//             className="md:hidden text-slate-900 text-2xl p-2 focus:outline-none hover:scale-110 transition-transform"
//           >
//             <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
//           </button> */}
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       <div className={`md:hidden glass border-b border-white/20 shadow-xl overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
//         <div className="px-6 py-4 space-y-3">
//           <a href="/customer-login" className="block w-full text-center py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">Customer Login</a>
//           <a href="/merchant-login" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all">Merchant Dashboard</a>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

// import React, { useState } from 'react';
// import Logo from '../common/Logo';

// const Navbar = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-lg shadow-slate-200/50">
//       <div className="max-w-7xl mx-auto px-6 sm:px-8">
//         {/* 👇 CHANGED: justify-center (for mobile) | md:justify-between (for desktop) */}
//         <div className="flex justify-center md:justify-between h-20 items-center">
          
//           <Logo />
          
//           {/* Desktop Menu */}
//           <div className="hidden md:flex items-center space-x-8">
//             {/* <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-all duration-300 hover:scale-105">Features</a>
//             <a href="#benefits" className="text-sm font-semibold text-slate-600 hover:text-emerald-500 transition-all duration-300 hover:scale-105">Benefits</a> */}
//             <div className="h-5 w-px bg-slate-200"></div>
//             <a href="/merchant-login" className="text-sm font-bold text-slate-900 hover:text-emerald-500 transition-all duration-300">Merchant Login</a>
//             <a href="/customer-login" className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
//               <span className="relative z-10">Customer Login</span>
//               <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             </a>
//           </div>

//           {/* Mobile Button (Currently Commented Out) */}
//           {/* If you enable this later, the logo will stay centered if it is the only visible item. 
//               If you want button + centered logo, you will need absolute positioning. */}
//           {/* <button 
//             onClick={() => setIsOpen(!isOpen)} 
//             className="md:hidden absolute right-0 text-slate-900 text-2xl p-2 focus:outline-none hover:scale-110 transition-transform"
//           >
//             <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
//           </button> */}
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       <div className={`md:hidden glass border-b border-white/20 shadow-xl overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
//         <div className="px-6 py-4 space-y-3">
//           <a href="/customer-login" className="block w-full text-center py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">Customer Login</a>
//           <a href="/merchant-login" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all">Merchant Dashboard</a>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

// import React, { useState } from 'react';
// import Logo from '../common/Logo';

// const Navbar = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-lg shadow-slate-200/50">
//       <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
//         {/* Mobile: Centered Logo | Desktop: Spread Layout */}
//         <div className="flex justify-center md:justify-between h-20 items-center">
          
//           <Logo />
          
//           {/* Desktop Menu */}
//           <div className="hidden md:flex items-center space-x-8">
            
//             {/* 👇 NEW LINK ADDED HERE */}
//             <a 
//               href="/#how-it-works" 
//               className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors duration-300"
//             >
//               How it Works
//             </a>

//             <div className="h-5 w-px bg-slate-200"></div>
            
//             <a href="/merchant-login" className="text-sm font-bold text-slate-900 hover:text-emerald-500 transition-all duration-300">
//               Merchant Login
//             </a>
            
//             <a href="/customer-login" className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
//               <span className="relative z-10">Customer Login</span>
//               <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             </a>
//           </div>

//         </div>
//       </div>

//       {/* Mobile Menu */}
//       <div className={`md:hidden glass border-b border-white/20 shadow-xl overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
//         <div className="px-6 py-4 space-y-3">
//           <a href="/#how-it-works" className="block w-full text-center py-3 text-slate-600 font-bold hover:text-emerald-600">How it Works</a>
//           <a href="/customer-login" className="block w-full text-center py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">Customer Login</a>
//           <a href="/merchant-login" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all">Merchant Dashboard</a>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // 👈 1. Import this
import Logo from '../common/Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-lg shadow-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-center md:justify-between h-20 items-center">
          
          <Logo />
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {/* 👇 2. Change 'a href' to 'Link to' */}
            <a 
              href="/#how-it-works" 
              className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors duration-300"
            >
              How it Works
            </a>

            <div className="h-5 w-px bg-slate-200"></div>
            
            {/* 👇 3. THIS ONE WAS LIKELY CAUSING THE ISSUE */}
            <Link 
              to="/merchant-login" 
              className="text-sm font-bold text-slate-900 hover:text-emerald-500 transition-all duration-300"
            >
              Merchant Login
            </Link>
            
            <Link 
              to="/customer-login" 
              className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Customer Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden glass border-b border-white/20 shadow-xl overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-4 space-y-3">
          <a href="/#how-it-works" className="block w-full text-center py-3 text-slate-600 font-bold hover:text-emerald-600">How it Works</a>
          
          {/* 👇 Update Mobile Links too */}
          <Link to="/customer-login" className="block w-full text-center py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">
            Customer Login
          </Link>
          <Link to="/merchant-login" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all">
            Merchant Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;