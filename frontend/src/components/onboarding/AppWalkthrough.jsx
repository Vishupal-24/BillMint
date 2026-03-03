import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

// 👇 YOUR SCREENSHOTS
import slide1Img from '../../assets/walkthrough/slide1.png'; 
import slide2Img from '../../assets/walkthrough/slide2.png'; 
import slide3Img from '../../assets/walkthrough/slide3.png'; 
import slide4Img from '../../assets/walkthrough/slide4.png'; 

const walkthroughData = [
  {
   id: 1,
    image: slide1Img,
    title: "Dominate the Rush Hour",
    description: "Stop writing. Start tapping. Clear lines faster and never lose a customer to a slow queue again.",
  },
  {
    id: 2,
    image: slide2Img,
    title: "Zero Paper. Zero Waste.",
    description: "Look like a premium brand. Your customers scan, save, and leave happy. No printers, no ink costs.",
  },
  {
    id: 3,
    image: slide3Img,
    title: "Total Control in Your Pocket",
    description: "You are the boss. Change prices, hide items, or update your menu instantly—anytime, anywhere.",
  },
  {
    id: 4,
    image: slide4Img,
    title: "Unleash Your Profits",
    description: "Don't guess—know. Track every rupee. See exactly what sells and watch your empire grow daily.",
  },
];

const AppWalkthrough = ({ onFinish }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const handleNext = () => {
    if (activeIndex === walkthroughData.length - 1) {
      finishTour();
    } else {
      swiperRef.current?.slideNext();
    }
  };

  const finishTour = () => {
    if (onFinish) onFinish();
    else alert("Redirecting to Dashboard...");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      
      {/* 1. TOP BAR: SKIP BUTTON */}
      <div className="w-full flex justify-end px-6 pt-6 pb-2 z-30 h-14">
        {activeIndex < walkthroughData.length - 1 && (
          <button 
            onClick={finishTour}
            className="text-slate-500 font-semibold text-sm hover:text-emerald-600 transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-6">
        
        {/* 2. PHONE CONTAINER */}
        <div className="relative mb-6 shrink-0 transform transition-transform duration-500 hover:scale-[1.01]">
          
          {/* A. The Main Phone Body (Z-20: Sits on TOP of buttons) */}
          <div className="relative w-[220px] h-[460px] bg-gray-900 rounded-[2.5rem] shadow-2xl border-[4px] border-gray-800 z-20">
            
            {/* Screen Inner Bezel */}
            <div className="absolute inset-[2px] bg-black rounded-[2.3rem] border-[5px] border-black overflow-hidden">
              {/* Screen Content */}
              <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden relative">
                 <Swiper
                  onBeforeInit={(swiper) => (swiperRef.current = swiper)}
                  onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                  modules={[Pagination]}
                  className="w-full h-full"
                  allowTouchMove={true}
                >
                  {walkthroughData.map((slide) => (
                    <SwiperSlide key={slide.id} className="w-full h-full">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-fill" 
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
            
          {/* B. The Buttons (Z-0: Sit BEHIND the phone body) */}
          {/* Left Buttons (Volume) */}
          <div className="absolute top-16 -left-[4px] w-[6px] h-6 bg-gray-800 rounded-l-md z-0"></div>
          {/* <div className="absolute top-26 -left-[4px] w-[6px] h-10 bg-gray-800 rounded-l-md z-0"></div> */}
          
          {/* Right Button (Power) */}
          <div className="absolute top-24 -right-[4px] w-[6px] h-12 bg-gray-800 rounded-r-md z-0"></div>

        </div>

        {/* 3. TEXT & ACTION AREA */}
        <div className="w-full max-w-[280px] flex flex-col items-center text-center space-y-4 z-20">
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {walkthroughData[activeIndex].title}
            </h2>
            <p className="text-slate-600 text-xs font-medium leading-relaxed px-2">
              {walkthroughData[activeIndex].description}
            </p>
          </div>

          <div className="flex gap-2 py-1">
            {walkthroughData.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out
                  ${idx === activeIndex ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-300'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-all duration-300 active:scale-95
              ${activeIndex === walkthroughData.length - 1 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/40' 
                : 'bg-gray-900 hover:bg-gray-800'}`}
          >
            {activeIndex === walkthroughData.length - 1 ? "Start Earning" : "Next"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AppWalkthrough;