import React from 'react';
// Import your video file here if using bundler, or use public URL
// import demoVideo from '../../assets/Animated_Explainer_Video_for_GreenReceipt.mp4';

const Hero = () => {
  return (
    <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-40">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-20 items-center">
          
          <div className="lg:col-span-6 text-center lg:text-left mb-16 lg:mb-0">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-emerald-200/50 shadow-lg shadow-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-8 hover:scale-105 transition-transform">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live: Smart Budgeting
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-slate-900">
              Paperless Receipts. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent animate-gradient">
                Effortless Insights.
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              Stop hoarding thermal paper. Scan QR receipts instantly, store them securely in the cloud, and track your spending beautifully.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <a href="/customer-login" className="group relative px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold text-lg shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-1 transition-all duration-300 text-center flex items-center justify-center gap-3 overflow-hidden">
                <span className="relative z-10">Start for Free</span>
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-2 transition-transform relative z-10"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a href="/merchant-login" className="px-8 py-5 glass border border-slate-200/50 rounded-full text-slate-900 font-bold text-lg shadow-lg hover:border-emerald-300 hover:text-emerald-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
                For Merchants
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
               {/* ... (Social proof code same as HTML but JSX) ... */}
            </div>
          </div>

          <div className="lg:col-span-6 relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/50 via-blue-200/50 to-purple-200/50 rounded-[3rem] blur-3xl"></div>
            <div className="relative w-full aspect-[4/3] glass rounded-[2.5rem] border border-white/20 shadow-2xl shadow-slate-900/10 overflow-hidden group hover:scale-[1.02] transition-all duration-500">
               <video 
                 autoPlay loop muted playsInline 
                 className="w-full h-full object-cover"
               >
                 <source src="/Animated_Explainer_Video_for_GreenReceipt.mp4" type="video/mp4" />
               </video>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;