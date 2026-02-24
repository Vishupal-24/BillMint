import React from 'react';

const Logo = () => (
  <a href="#" className="flex items-center gap-2.5 group">
    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:shadow-emerald-500/50 transition-all duration-300">
      <i className="fas fa-receipt text-base"></i>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl font-extrabold tracking-tight text-emerald-500 ">
        Green<span className="text-slate-900">Receipt</span>
      </span>
    </div>
  </a>
);

export default Logo;