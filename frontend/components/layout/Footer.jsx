import React from 'react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 to-slate-800 pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <i className="fas fa-receipt"></i>
            </div>
            <span className="text-2xl font-bold text-white">Green<span className="text-emerald-400">Receipt</span></span>
          </div>
          <div className="flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-emerald-400 transition-colors"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
        <div className="text-center text-sm text-slate-500 border-t border-slate-700/50 pt-8">
          &copy; 2025 GreenReceipt Inc. All rights reserved. Made with <span className="text-emerald-400">♥</span> for the planet.
        </div>
      </div>
    </footer>
  );
};

export default Footer;