import React from 'react';

const FeatureCard = ({ icon, colorClass, title, description, delay }) => (
  <div className={`feature-card group glass rounded-3xl p-10 hover:shadow-2xl ${colorClass} transition-all duration-500 border border-white/20 hover:-translate-y-2`}>
    <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-4 transition-colors">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-lg">{description}</p>
  </div>
);

const Features = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/30 to-white"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-200/50 text-emerald-600 font-bold tracking-wider uppercase text-xs mb-6">
            <i className="fas fa-sparkles"></i>
            Why GreenReceipt?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Everything you need to go <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">paperless</span>
          </h2>
          <p className="text-slate-600 text-xl leading-relaxed">
            We've streamlined the receipt process for both shoppers and businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Instant Scan */}
          <div className="feature-card group glass rounded-3xl p-10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 border border-white/20 hover:border-emerald-200/50 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <i className="fas fa-qrcode"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">Instant Scan</h3>
            <p className="text-slate-600 leading-relaxed text-lg">Simply point your camera at the merchant's QR code. No emails, no paper, instant digital transfer.</p>
          </div>

          {/* Card 2: Analytics */}
          <div className="feature-card group glass rounded-3xl p-10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 border border-white/20 hover:border-blue-200/50 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-500/30 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <i className="fas fa-chart-pie"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">Smart Analytics</h3>
            <p className="text-slate-600 leading-relaxed text-lg">Visualize where your money goes. Auto-categorization of groceries, dining, and travel expenses.</p>
          </div>

          {/* Card 3: Security */}
          <div className="feature-card group glass rounded-3xl p-10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 border border-white/20 hover:border-purple-200/50 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-purple-500/30 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-purple-600 transition-colors">Bank-Grade Security</h3>
            <p className="text-slate-600 leading-relaxed text-lg">Your financial data is encrypted with AES-256 bit standards. Safe, private, and yours.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;