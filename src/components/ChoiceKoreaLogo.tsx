import React from 'react';

// Choice Korea Vector Icon (Circle "C" with custom styled red checkmark)
export function ChoiceKoreaIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="-8 -4 116 108" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} overflow-visible`}
    >
      {/* C-Circle Arc (Deep Navy Blue) */}
      <path 
        d="M 53.5 25.5 
           A 29 29 0 1 0 60.5 42" 
        stroke="#0d2b5c" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* End tip of open C */}
      <path 
        d="M 60.5 42 L 57.5 42" 
        stroke="#0d2b5c" 
        strokeWidth="11" 
        strokeLinecap="round"
      />

      {/* Red Checkmark Arc */}
      <path 
        d="M 45.5 42.5 L 51.5 49 L 77 26.5" 
        stroke="#d11822" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Choice Korea horizontal logo used primarily in Header / Navigation bars
export function ChoiceKoreaHeaderLogo() {
  return (
    <div className="flex items-center space-x-0 select-none group translate-y-[2px] shrink-0">
      {/* Vector Icon */}
      <ChoiceKoreaIcon className="h-11 w-11 transition-transform group-hover:scale-105 duration-300 shrink-0 hidden lg:block lg:ml-[-103px]" />
      
      {/* Typographic elements */}
      <div className="flex flex-col justify-center lg:-ml-2.5 ml-0 pt-1 shrink-0">
        <div className="flex items-baseline leading-none">
          <span className="text-[#ffffff] font-sans font-black text-[19px] sm:text-2xl tracking-tighter">
            CHOICE
          </span>
          <span className="text-[#d11822] font-sans font-black text-[19px] sm:text-2xl tracking-tighter ml-1">
            KOREA
          </span>
        </div>
        <span className="text-[#a0a0a0] text-[8.5px] sm:text-[9.5px] font-sans tracking-tight font-bold mt-1 block">
          국내 공식 유저참여형 예측시장 커뮤니티
        </span>
      </div>
    </div>
  );
}

// Choice Korea Stacked Full Logo matching the source brand template perfectly
export function ChoiceKoreaFullLogo({ className = "max-w-[200px]" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-2xl shadow-xl border border-gray-100 ${className} select-none`}>
      {/* Large Icon */}
      <ChoiceKoreaIcon className="h-24 w-24" />

      {/* Primary Brand Text */}
      <div className="text-[#0d2b5c] font-sans text-[28px] font-black tracking-[0.14em] text-center mt-3 leading-none select-all">
        CHOICE
      </div>

      {/* Subtitle brand accent (— K O R E A —) */}
      <div className="flex items-center justify-center w-full mt-2.5 space-x-3">
        <div className="h-[1.5px] bg-[#0d2b5c] flex-1"></div>
        <span className="text-[#d11822] text-[13px] font-black tracking-[0.4em] translate-x-[0.2em] font-sans">
          KOREA
        </span>
        <div className="h-[1.5px] bg-[#0d2b5c] flex-1"></div>
      </div>
    </div>
  );
}

// Dark theme customized version of Choice Korea stacked Logo
export function ChoiceKoreaDarkLogo({ className = "max-w-[260px]" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center py-5 px-6 bg-[#161618] border border-[#2d2f36] rounded-2xl shadow-lg ${className} select-none`}>
      {/* Icon */}
      <ChoiceKoreaIcon className="h-16 w-16" />

      {/* Brand Text */}
      <div className="text-white font-sans text-2xl font-black tracking-widest text-center mt-3.5 leading-none">
        CHOICE
      </div>

      {/* Subtitle */}
      <div className="flex items-center justify-center w-full mt-2 space-x-2">
        <div className="h-[1px] bg-gray-700 flex-1"></div>
        <span className="text-[#d11822] text-[11px] font-black tracking-[0.35em] translate-x-[0.18em]">
          KOREA
        </span>
        <div className="h-[1px] bg-gray-700 flex-1"></div>
      </div>
      
      <span className="text-gray-500 text-[9.5px] font-bold tracking-tight text-center mt-2.5">
        국내 공식 유저참여형 예측시장 커뮤니티
      </span>
    </div>
  );
}
