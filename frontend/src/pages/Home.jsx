import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import Benefits from '../components/home/Benefits';
import Features from '../components/home/Features';
import CTA from '../components/home/CTA';
import Footer from '../components/layout/Footer';
// import Blob from '../components/common/Blob';

const Home = () => {
  // Force light mode on Home page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }
    };
  }, []);

  return (
    <div className="relative font-sans text-slate-900 antialiased overflow-x-hidden bg-white selection:bg-emerald-100 selection:text-emerald-600">
      
      {/* OPTIMIZED BACKGROUND: Fixed SVG blobs instead of animated CSS filters */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <svg className="absolute top-0 left-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
           <defs>
             <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
             </filter>
           </defs>
           <circle cx="20" cy="20" r="20" fill="#6ee7b7" filter="url(#blur)" />
           <circle cx="80" cy="30" r="15" fill="#93c5fd" filter="url(#blur)" />
           <circle cx="40" cy="80" r="20" fill="#e9d5ff" filter="url(#blur)" />
         </svg>
      </div>

      {/* Content wrapper with z-index to sit above background */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Benefits />
        {/* <Features /> */}
        {/* <CTA /> */}
        <Footer />
      </div>

    </div>
  );
};

export default Home;