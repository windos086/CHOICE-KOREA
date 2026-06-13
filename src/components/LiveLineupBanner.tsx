import React from 'react';

export default function LiveLineupBanner() {
  const handleClick = () => {
    window.open('https://www.rotowire.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      id="live-lineup-rotowire-banner"
      className="relative overflow-hidden w-full max-w-[130px] sm:max-w-[260px] bg-transparent border-[2px] border-cyan-500/80 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex flex-col items-center justify-center gap-1.5 sm:gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group select-none animate-cyan-flash"
    >
      {/* 1. Tactical HUD Grid Lining Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40"></div>

      {/* Glow Rings background */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

      {/* Lockheed Martin Brand Logo centered */}
      <div className="flex items-center justify-center relative z-10 w-full px-1 sm:px-2">
        <img 
          src="/public/lockheed_logo.png" 
          alt="Lockheed Martin" 
          referrerPolicy="no-referrer"
          className="h-5 sm:h-8 md:h-10 w-auto object-contain filter brightness-200 contrast-150 saturate-120 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)] transition-all duration-300 group-hover:scale-105"
        />
        {/* Diagnostic micro indicator floating beside the logo */}
        <div className="absolute top-0 right-1 sm:right-3 flex gap-1">
          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gradient-to-r from-cyan-400 to-sky-400 rounded-full animate-ping"></span>
        </div>
      </div>

      {/* Title under the logo */}
      <div className="text-center relative z-10 w-full mt-0.5 sm:mt-1">
        <h2 className="text-[10px] sm:text-sm md:text-base font-black tracking-tight leading-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-amber-200 select-none drop-shadow-[0_2px_5px_rgba(6,182,212,0.4)] animate-fast-pulse whitespace-nowrap">
          실시간 라인업 확인
        </h2>
      </div>
    </div>
  );
}
