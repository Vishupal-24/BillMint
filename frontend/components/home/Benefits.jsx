import React from 'react';

const BenefitCard = ({ icon, gradient, shadow, title, subtitle }) => (
  <div className="glass rounded-3xl p-8 border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg ${shadow} mb-6`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="text-3xl font-extrabold stat-number mb-2">{title}</h3>
    <p className="text-slate-600 font-medium">{subtitle}</p>
  </div>
);

const Benefits = () => (
  <section id="benefits" className="py-20 relative">
    <div className="max-w-7xl mx-auto px-6 sm:px-8">
      <div className="grid md:grid-cols-3 gap-8">
        <BenefitCard 
          icon="fa-bolt" 
          gradient="from-emerald-400 to-teal-500" 
          shadow="shadow-emerald-500/30" 
          title="2 sec" 
          subtitle="Average scan time" 
        />
        <BenefitCard 
          icon="fa-leaf" 
          gradient="from-blue-400 to-indigo-500" 
          shadow="shadow-blue-500/30" 
          title="100%" 
          subtitle="Paperless guarantee" 
        />
        <BenefitCard 
          icon="fa-lock" 
          gradient="from-purple-400 to-pink-500" 
          shadow="shadow-purple-500/30" 
          title="256-bit" 
          subtitle="AES encryption" 
        />
      </div>
    </div>
  </section>
);

export default Benefits;