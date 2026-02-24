import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 animate-gradient"></div>
      
      {/* Background Blobs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to go green?</h2>
        <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
          Join thousands of users who've already made the switch to paperless receipts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/customer-login" className="group px-10 py-5 bg-white text-emerald-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/40 hover:scale-105 transition-all duration-300 text-center flex items-center justify-center gap-3">
            Get Started Free
            <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
          </Link>
          <Link to="/merchant-login" className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-emerald-600 hover:scale-105 transition-all duration-300 text-center">
            Merchant Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;