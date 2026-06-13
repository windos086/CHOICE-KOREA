import React from 'react';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';

// Mobile layout version (for mobile drawers)
export const TelegramBanner: React.FC = () => {
  return (
    <a
      href="https://t.me/LMT_Main"
      target="_blank"
      rel="noopener noreferrer"
      className="block relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-black via-[#1c1200] to-black border border-[#ffd700]/30 hover:border-[#ffd700]/80 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.15)] group select-none"
      style={{
         backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(200, 150, 0, 0.2), transparent 60%)'
      }}
    >
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      
      <div className="flex items-center justify-between p-3.5 z-10 relative">
        <div className="flex flex-col gap-0.5 items-start">
           <div className="relative">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-[#ffd700] via-[#ffcc00] to-[#b38000] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight">
                텔레그램 고객센터
              </span>
           </div>
           <div className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              Telegram Customer Center
           </div>
           
           <div className="mt-1 bg-gradient-to-r from-black via-neutral-900 to-black px-4 py-1 rounded-sm border border-neutral-800 shadow-inner flex items-center gap-2 group-hover:bg-neutral-900 transition-colors">
              <span className="text-amber-500 font-black text-[10px] tracking-widest">⋙</span>
              <span className="text-white font-extrabold text-[11px]">바로가기 CLICK</span>
           </div>
        </div>

        <div className="flex flex-col items-center justify-center mr-1">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-[#ffd700] to-[#b38000] p-0.5 shadow-[0_0_15px_rgba(255,215,0,0.6)] group-hover:shadow-[0_0_25px_rgba(255,215,0,0.9)] transition-all">
             <div className="absolute inset-0 bg-black rounded-full m-0.5"></div>
             <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-[#0088cc] via-[#00aaff] to-[#005580] rounded-full flex items-center justify-center shadow-inner border border-sky-400/50">
               <Send className="w-6 h-6 text-white transform -rotate-12 translate-x-[1px] translate-y-[1px] drop-shadow-md" />
             </div>
          </div>
          <div className="text-white font-black text-xs font-mono tracking-tight mt-1 bg-black/50 px-1 rounded drop-shadow">
             @LMT_Main
          </div>
        </div>
      </div>
      
      {/* Sparkle effect */}
      <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-ping"></div>
      <div className="absolute bottom-2 left-1/2 w-1 h-1 bg-amber-200 rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.5s'}}></div>
      <div className="absolute top-4 right-1/4 w-2 h-2 bg-amber-400 rounded-full opacity-50 shadow-[0_0_8px_4px_rgba(251,191,36,0.8)] animate-pulse"></div>
    </a>
  );
};

// State-of-the-art, high-resolution premium wide desktop banner component
export const DesktopTelegramBanner: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden md:block w-full max-w-[1100px] mx-auto select-none p-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_15px_rgba(251,191,36,0.25)] relative overflow-hidden group"
    >
      {/* Shimmer line sweep */}
      <motion.div
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-20 pointer-events-none"
      />

      <a
        href="https://t.me/LMT_Main"
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full h-[155px] bg-gradient-to-r from-black via-[#141006] to-black rounded-[14px] overflow-hidden cursor-pointer"
        style={{
          backgroundImage: 'radial-gradient(circle at 85% 50%, rgba(245, 158, 11, 0.22) 0%, transparent 60%)'
        }}
      >
        {/* Particle spark vectors overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(239,68,68,0.05),transparent_40%)]"></div>
        <div className="absolute inset-0 z-0 opacity-15" style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>

        <div className="absolute inset-0 flex items-center justify-between px-10 py-4 z-10">
          
          {/* LEFT SIDE: Extremely Luxury 3D Typography */}
          <div className="flex flex-col gap-1 items-start">
            <div className="relative">
              {/* Gold stroke/reflection styling */}
              <h1 className="text-3xl lg:text-[38px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] via-[#fed7aa] to-[#f59e0b] filter drop-shadow-[0_5px_4px_rgba(0,0,0,0.95)] select-none italic uppercase leading-none">
                텔레그램 고객센터
              </h1>
              {/* Luxury backing glow */}
              <div className="absolute -inset-1 bg-yellow-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>

            <div className="text-[12px] font-black text-amber-500 uppercase tracking-[0.25em] drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] font-mono flex items-center gap-2">
              <span>★</span>
              <span>Telegram Customer Center</span>
              <span>★</span>
            </div>

            {/* Angular 3D click strap - matches the image precisely */}
            <div className="mt-3 flex items-center bg-gradient-to-r from-[#17150e] via-[#2d2209] to-[#17150e] border border-amber-500/35 px-8 py-2 rounded-lg shadow-[inset_0_1px_3px_rgba(251,191,36,0.1),0_4px_10px_rgba(0,0,0,0.5)] transition-all group-hover:border-amber-400 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              {/* Pulsing arrows */}
              <div className="flex gap-1.5 items-center justify-center">
                <motion.span 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.3, 1] }}
                  className="text-amber-500 font-extrabold text-sm"
                >
                  ≫
                </motion.span>
                <motion.span 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, times: [0, 0.3, 1] }}
                  className="text-amber-455 font-extrabold text-sm"
                >
                  ≫
                </motion.span>
                <motion.span 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, times: [0, 0.3, 1] }}
                  className="text-amber-400 font-extrabold text-sm mr-2"
                >
                  ≫
                </motion.span>
              </div>

              <span className="text-white font-extrabold text-[13px] tracking-wide uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                바로가기 <span className="text-amber-400 font-black ml-1">CLICK</span>
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Gorgeous Gold Framed Coin with 3D Telegram Shield */}
          <div className="flex items-center gap-6">
            {/* Real-time active sparkle effects */}
            <div className="relative flex flex-col items-center justify-center">
              
              {/* Outer Golden Luxury Radiance Ring */}
              <div className="relative flex items-center justify-center w-[100px] h-[100px] rounded-full bg-gradient-to-b from-[#fff2a3] via-[#e5b83b] to-[#875b11] p-[3px] shadow-[0_0_30px_rgba(229,184,59,0.45)] group-hover:shadow-[0_0_45px_rgba(229,184,59,0.7)] group-hover:rotate-[360deg] transition-all duration-[3000ms] ease-out">
                {/* Embedded shiny bezel segments */}
                <div className="absolute inset-0 rounded-full border border-white/20 m-[1px]"></div>
                
                {/* Shiny metallic gap */}
                <div className="absolute inset-[3px] bg-neutral-950 rounded-full flex items-center justify-center">
                  
                  {/* Innermost glossy sphere with gradients */}
                  <div className="relative w-full h-full bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#0369a1] rounded-full p-[2px] overflow-hidden shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)]">
                    
                    {/* Gloss glass sweep glare */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-full pointer-events-none"></div>
                    
                    {/* SVG sharp precision paper plane */}
                    <div className="w-full h-full flex items-center justify-center bg-transparent relative z-10">
                      <Send className="w-11 h-11 text-white transform -rotate-12 translate-x-[2px] translate-y-[2px] filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Telegram ID Display tag - styled matching reference image */}
              <div className="mt-2.5 bg-black/80 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-wide px-4 py-1.5 rounded-full font-mono shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-20 hover:border-amber-450 hover:text-white transition-colors">
                @LMT_Main
              </div>
            </div>
          </div>

        </div>

        {/* Decorative corner visual accents */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-ping"></div>
        <div className="absolute bottom-3 left-1/3 w-1 h-1 bg-amber-400 rounded-full opacity-80 animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3 right-1/3 w-2 h-2 bg-yellow-300 rounded-full opacity-40 shadow-[0_0_12px_4px_rgba(251,191,36,0.6)] animate-pulse"></div>

        {/* Diagonal border cuts for exotics luxury club styling */}
        <div className="absolute top-0 right-0 w-24 h-[3px] bg-gradient-to-r from-transparent to-amber-400"></div>
        <div className="absolute bottom-0 left-0 w-24 h-[3px] bg-gradient-to-r from-amber-400 to-transparent"></div>
      </a>
    </motion.div>
  );
};

// Ultra-premium Vertical aspect-[3/4] Telegram Customer Center for Casino grid
export const VerticalTelegramBanner: React.FC = () => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="hidden md:flex relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-amber-500/25 bg-gradient-to-b from-black via-[#161208] to-black shadow-[0_20px_40px_rgba(0,0,0,0.95)] cursor-pointer group flex-col justify-between p-5 select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)'
      }}
    >
      {/* Luxury Golden Light sweep */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent skew-x-12 z-20 pointer-events-none"
      />

      {/* Decorative stars / dust / high resolution layout */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.02),transparent_50%)]"></div>
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      <a
        href="https://t.me/LMT_Main"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 flex flex-col justify-between p-5"
      >
        {/* TOP STATUS TAG */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-lg">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="text-amber-400 text-[9px] font-black tracking-widest uppercase">CUSTOMER CENTER</span>
          </div>
          
          <div className="text-amber-500/40 text-xs font-black">★ ★ ★</div>
        </div>

        {/* MIDDLE: 3D GLOWING ROTATING TELEGRAM COIN & HANDLE */}
        <div className="flex flex-col items-center justify-center my-auto gap-4">
          
          {/* Stunning Luxury gold coin frame */}
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-[#fff2a3] via-[#e5b83b] to-[#875b11] p-[3px] shadow-[0_0_35px_rgba(229,184,59,0.55)] group-hover:shadow-[0_0_50px_rgba(229,184,59,0.8)] transition-all duration-700">
            <div className="absolute inset-0 rounded-full border border-white/20 m-[1px]"></div>
            
            {/* Dark shiny gap */}
            <div className="absolute inset-[3px] bg-neutral-950 rounded-full flex items-center justify-center">
              
              {/* Inner shiny blue space */}
              <div className="relative w-full h-full bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#0369a1] rounded-full p-[2px] overflow-hidden shadow-[inset_0_4px_12px_rgba(255,255,255,0.45)]">
                
                {/* Gloss flare overlay */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>
                
                {/* Vector paper plane */}
                <div className="w-full h-full flex items-center justify-center bg-transparent relative z-10 pb-0.5">
                  <Send className="w-12 h-12 text-white transform -rotate-12 translate-x-[2px] translate-y-[2px] filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-350" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {/* Elegant 3D Title */}
            <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] via-[#fed7aa] to-[#f59e0b] filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] italic uppercase tracking-tight text-center leading-none pr-2">
              텔레그램 고객센터&nbsp;
            </h2>
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] font-mono text-center uppercase leading-none">
              Telegram Official Customer Support
            </p>
          </div>

          {/* Plaque wrapped Username Handle */}
          <div className="bg-black/95 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-wider px-5 py-2 rounded-full font-mono shadow-[0_4px_12px_rgba(0,0,0,0.7)] group-hover:border-amber-400 group-hover:text-white transition-all transform group-hover:scale-105">
            @LMT_Main
          </div>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="w-full bg-gradient-to-r from-[#17150e] via-[#2d2209] to-[#17150e] border border-amber-500/35 py-2.5 px-4 rounded-xl shadow-[inset_0_1px_3px_rgba(251,191,36,0.1),0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 group-hover:border-amber-400 group-hover:bg-[#342403] transition-all duration-300">
          <div className="flex gap-1 items-center">
            <motion.span 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.3, 1] }}
              className="text-amber-500 font-black text-xs"
            >
              ≫
            </motion.span>
            <motion.span 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3, times: [0, 0.3, 1] }}
              className="text-amber-400 font-black text-xs"
            >
              ≫
            </motion.span>
          </div>
          
          <span className="text-white font-black text-xs tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            바로가기 <span className="text-amber-450 font-black ml-1">CLICK</span>
          </span>
          
          <div className="flex gap-1 items-center">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3, times: [0, 0.3, 1] }}
              className="text-amber-400 font-black text-xs"
            >
              ≪
            </motion.span>
            <motion.span 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.3, 1] }}
              className="text-amber-500 font-black text-xs"
            >
              ≪
            </motion.span>
          </div>
        </div>
      </a>

      {/* Exquisite corner sparkles */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-ping"></div>
      <div className="absolute bottom-2 right-2 w-1 h-1 bg-amber-400 rounded-full opacity-80 animate-pulse"></div>
    </motion.div>
  );
};

