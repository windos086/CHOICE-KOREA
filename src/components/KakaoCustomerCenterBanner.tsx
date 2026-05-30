import React from 'react';
import { motion } from 'motion/react';

export default function KakaoCustomerCenterBanner() {
  const kakaoLink = "https://open.kakao.com/o/s9a4Pgxi"; 

  return (
    <>
      <style>{`
        @keyframes shine-sweep {
          0% {
            left: -100%;
          }
          12%, 100% {
            left: 200%;
          }
        }
        .animate-shine-sweep {
          animation: shine-sweep 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <a 
        href={kakaoLink}
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-[306px] max-w-full mx-auto bg-[#FAE100] rounded-xl p-3.5 shadow-md hover:bg-[#FDD800] transition-all group relative overflow-hidden active:scale-95"
      >
        {/* 번쩍이는 sweep 라이트 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
          <div className="absolute top-0 w-[40%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] animate-shine-sweep" />
        </div>

        <div className="flex items-center relative z-10 select-none">
          {/* 귀엽게 움직이는 카카오톡 로고 */}
          <div className="mr-3 shrink-0">
            <motion.img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" 
              alt="KakaoTalk" 
              className="h-10 w-10 object-contain cursor-pointer"
              animate={{
                y: [0, -3, 0, -1, 0],
                rotate: [0, -4, 4, -2, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                scale: 1.15,
                rotate: [0, -12, 12, -12, 6, -3, 0],
                transition: { duration: 0.6 }
              }}
            />
          </div>
          <div className="flex-grow">
            <h3 className="text-[#3c1e1e] font-bold text-base tracking-tight leading-tight">카카오톡 고객센터</h3>
            <p className="text-[#3c1e1e]/70 text-[10px] font-semibold tracking-tight mt-0.5 uppercase">KAKAOTALK CUSTOMER CENTER</p>
          </div>
        </div>
      </a>
    </>
  );
}

