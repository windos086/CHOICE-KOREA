import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

// Ultra-premium Vertical aspect-[3/4] Withdrawal Request Banner for Casino grid
export const VerticalWithdrawalBanner: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
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

      <div
        className="absolute inset-0 z-10 flex flex-col justify-between p-5"
      >
        {/* TOP STATUS TAG */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-lg">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="text-amber-400 text-[9px] font-black tracking-widest uppercase">WITHDRAW</span>
          </div>
          
          <div className="text-amber-500/40 text-xs font-black">★ ★ ★</div>
        </div>

        {/* MIDDLE: 3D GLOWING ROTATING COIN & HANDLE */}
        <div className="flex flex-col items-center justify-center my-auto gap-4">
          
          {/* Stunning Luxury gold coin frame */}
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-b from-[#fff2a3] via-[#e5b83b] to-[#875b11] p-[3px] shadow-[0_0_35px_rgba(229,184,59,0.55)] group-hover:shadow-[0_0_50px_rgba(229,184,59,0.8)] transition-all duration-700">
            <div className="absolute inset-0 rounded-full border border-white/20 m-[1px]"></div>
            
            {/* Dark shiny gap */}
            <div className="absolute inset-[3px] bg-neutral-950 rounded-full flex items-center justify-center">
              
              {/* Inner shiny gold space */}
              <div className="relative w-full h-full bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] rounded-full p-[2px] overflow-hidden shadow-[inset_0_4px_12px_rgba(255,255,255,0.4)]">
                
                {/* Gloss flare overlay */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>
                
                {/* Vector icon */}
                <div className="w-full h-full flex items-center justify-center bg-transparent relative z-10 pb-0.5">
                  <ArrowLeftRight className="w-12 h-12 text-white transform -rotate-12 translate-x-[2px] translate-y-[2px] filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-350" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {/* Elegant 3D Title */}
            <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] via-[#fed7aa] to-[#f59e0b] filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] italic uppercase tracking-tight text-center leading-none pr-2">
              환전 신청&nbsp;
            </h2>
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] font-mono text-center uppercase leading-none">
              WITHDRAWAL REQUEST
            </p>
          </div>

          {/* Plaque wrapped status */}
          <div className="bg-black/95 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-wider px-5 py-2 rounded-full font-mono shadow-[0_4px_12px_rgba(0,0,0,0.7)] group-hover:border-amber-400 group-hover:text-white transition-all transform group-hover:scale-105">
            IMMEDIATE PROC
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
            신청하기 <span className="text-amber-450 font-black ml-1">CLICK</span>
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
      </div>

      {/* Exquisite corner sparkles */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-ping"></div>
      <div className="absolute bottom-2 right-2 w-1 h-1 bg-amber-400 rounded-full opacity-80 animate-pulse"></div>
    </motion.div>
  );
};
