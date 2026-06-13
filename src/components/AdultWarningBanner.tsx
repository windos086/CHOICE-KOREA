import React from 'react';

export default function AdultWarningBanner() {
  return (
    <div 
      id="adult-warning-lmt-banner"
      onClick={() => window.open('https://www.youtube.com/watch?v=TxBhQ17JeyE', '_blank')}
      className="relative overflow-hidden w-full max-w-[130px] sm:max-w-[260px] bg-transparent border-[2px] border-red-600/70 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-[0_0_25px_rgba(220,38,38,0.2)] flex flex-col items-center justify-center gap-1.5 sm:gap-3 select-none transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      {/* 1. Tactical HUD Grid Lining Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40"></div>

      {/* Red Ambient Glows */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Lockheed Martin Brand Logo centered */}
      <div className="flex items-center justify-center relative z-10 w-full px-1 sm:px-2">
        <img 
          src="/lockheed_logo.png" 
          alt="Lockheed Martin" 
          referrerPolicy="no-referrer"
          className="h-5 sm:h-8 md:h-10 w-auto object-contain filter brightness-200 contrast-150 saturate-120 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all duration-300 group-hover:scale-105"
        />
        {/* Diagnostic floating red indicator */}
        <div className="absolute top-0 right-1 sm:right-3 flex gap-1">
          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-ping"></span>
        </div>
      </div>

      {/* Title under the logo */}
      <div className="text-center relative z-10 w-full mt-0.5 sm:mt-1">
        <h2 className="text-[10px] sm:text-sm md:text-base font-black tracking-tight leading-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-200 to-red-400 select-none drop-shadow-[0_2px_5px_rgba(220,38,38,0.3)] animate-fast-pulse whitespace-nowrap">
          테더 이용방법 안내
        </h2>
      </div>
    </div>
  );
}
