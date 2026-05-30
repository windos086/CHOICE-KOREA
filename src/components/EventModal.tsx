import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy } from 'lucide-react';
import { ChoiceKoreaIcon } from './ChoiceKoreaLogo';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallenge: () => void;
}

export default function EventModal({ isOpen, onClose, onChallenge }: EventModalProps) {
  const [dontShowToday, setDontShowToday] = React.useState(false);

  React.useEffect(() => {
    // Check if the User previously selected "Don't show today"
    const hideUntil = localStorage.getItem('choice_korea_event_hide_until');
    if (hideUntil) {
      const now = new Date().getTime();
      if (now < parseInt(hideUntil, 10)) {
        // If it should remain hidden, trigger onClose right away to suppress display
        onClose();
      }
    }
  }, [onClose]);

  const handleClose = () => {
    if (dontShowToday) {
      const targetTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
      localStorage.setItem('choice_korea_event_hide_until', targetTime.toString());
    }
    onClose();
  };

  const handleChallengeClick = () => {
    if (dontShowToday) {
      const targetTime = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem('choice_korea_event_hide_until', targetTime.toString());
    }
    onChallenge();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-[340px] bg-gradient-to-b from-[#1c0404] via-[#0f0202] to-[#170505] border border-red-900/40 rounded-2xl overflow-hidden shadow-2xl shadow-red-900/20"
        >
          {/* Custom style for light animations and neon effect */}
          <style>{`
            @keyframes pulse-gold {
              0%, 100% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4)); }
              50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)); }
            }
            @keyframes soft-pulse-red {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
            .glowing-gold-text {
              text-shadow: 0 0 10px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 191, 36, 0.2);
            }
            .glowing-red-btn {
              box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
              animation: soft-pulse-red 2s infinite ease-in-out;
            }
            .animate-gold-glow {
              animation: pulse-gold 3s infinite;
            }
          `}</style>

          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/60 border-b border-red-950/40 relative z-10 select-none">
            <label className="flex items-center space-x-1.5 text-[11px] text-stone-300 font-semibold cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-700 bg-stone-900 text-red-600 focus:ring-red-500 focus:ring-offset-stone-950 cursor-pointer"
              />
              <span>오늘 하루 보지 않기 (그만보기)</span>
            </label>
            <button
              onClick={handleClose}
              className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-stone-800/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Banner Graphic Background details */}
          <div className="absolute top-[40px] inset-x-0 bottom-0 pointer-events-none overflow-hidden opacity-30 select-none">
            {/* Radial glow background sources */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[240px] rounded-full bg-red-600/10 blur-[60px]" />
            <div className="absolute bottom-10 left-1/4 w-[120px] h-[120px] rounded-full bg-amber-500/5 blur-[40px]" />
            
            {/* Elegant laser red streaks */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_30%,rgba(0,0,0,0.85))] z-1" />
            <div className="absolute left-[10%] top-[-10%] w-[1px] h-[120%] bg-gradient-to-b from-red-500/0 via-red-500/30 to-red-500/0 rotate-12" />
            <div className="absolute right-[15%] top-[-10%] w-[1px] h-[120%] bg-gradient-to-b from-red-500/0 via-red-500/30 to-red-500/0 -rotate-12" />
          </div>

          {/* Main Frame content */}
          <div className="relative px-5 pt-5 pb-3.5 flex flex-col items-center text-center">
            
            {/* Brand Logo Header: Choice Korea Logo with official graphic styling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center select-none"
            >
              <div className="flex items-center space-x-1">
                <ChoiceKoreaIcon className="h-7 w-7 shrink-0 drop-shadow-[0_2px_8px_rgba(209,24,34,0.3)] animate-pulse" />
                <div className="flex items-baseline leading-none pt-0.5">
                  <span className="text-white font-sans font-black text-lg tracking-tighter">CHOICE</span>
                  <span className="text-[#d11822] font-sans font-black text-lg tracking-tighter ml-0.5">KOREA</span>
                </div>
              </div>
              <span className="text-[#a0a0a0] text-[8px] font-bold tracking-tight mt-[-4px] opacity-90">
                국내 공식 유저참여형 예측시장 커뮤니티
              </span>
            </motion.div>

            {/* Sub header statement: "당일예측 10회 연속 적중시" */}
            <h2 className="text-white text-lg font-extrabold tracking-tight mt-2 text-shadow-md select-none flex items-center justify-center gap-0.5">
              <span className="text-2xl text-amber-300 font-extrabold">당일</span>예측 10회 연속 적중 시
            </h2>

            {/* Glowing Main Statement gold: "치킨 1마리 즉시 지급!" */}
            <div className="mt-0.5">
              <h1 className="text-2xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 glowing-gold-text select-none">
                치킨 1마리 즉시 지급!
              </h1>
            </div>

            {/* Core Visual Box: Delicious crispy chicken + "10x" Gold text */}
            <div className="relative my-3 w-full h-[115px] flex items-center justify-center select-none">
              {/* Outer light glow frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[120px] h-[120px] rounded-full bg-amber-500/10 blur-[20px] animate-gold-glow" />
              </div>

              {/* Box holding the Chicken and 10x Overlay */}
              <div className="relative w-[160px] h-[100px] bg-[#1a0808]/80 border border-amber-900/30 rounded-xl p-1 shadow-inner overflow-hidden flex items-center justify-center z-10">
                {/* Visual Representation of BBQ chicken */}
                <img
                  src="https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300&auto=format&fit=crop&q=80"
                  alt="Delicious Chicken"
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                
                {/* Elegant 10X Gold Overlay badge */}
                <div className="absolute right-1.5 bottom-1.5 bg-black/85 border border-amber-400 px-2.5 py-0.5 rounded-lg flex items-center space-x-0.5 shadow-lg shadow-black/80 animate-bounce transition-all duration-1000">
                  <span className="text-amber-400 font-black text-xs tracking-tighter glowing-gold-text italic">10연승</span>
                </div>
              </div>
            </div>

            {/* Secondary Header Label */}
            <div className="inline-flex items-center space-x-1 bg-red-950/70 border border-red-500/20 px-2 py-0.5 rounded-full text-red-400 font-extrabold text-[11px] tracking-tight mb-2.5 relative select-none">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>최초의 10연승 챌린지!</span>
            </div>

            {/* Participation Text Info */}
            <div className="text-zinc-300 font-medium text-[11.5px] mb-3 select-none leading-relaxed space-y-0.5">
              <p>참여 방법 : <span className="text-white font-bold">커뮤니티 예측 게임 참여</span> (매일 갱신)</p>
              <p>참여 조건 : <span className="text-white font-bold">일일퀘스트 클리어</span></p>
            </div>

            {/* Main CTA Call-To-Action glowing-red-btn */}
            <button
              onClick={handleChallengeClick}
              className="glowing-red-btn w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 text-white font-black text-sm py-2 px-4 rounded-lg shadow-lg shadow-red-900/40 relative group overflow-hidden active:scale-95 transition-all text-center select-none cursor-pointer"
            >
              {/* Sliding shiny gold beam overlay */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
              <span className="relative z-10">지금 바로 도전하기</span>
            </button>

            {/* Event Time Period & Banner Footer warning */}
            <div className="mt-2.5 text-[9.5px] text-stone-500 select-none">
              이벤트 기간 : <span className="text-stone-400 font-semibold">상시 운영 (공지 시 까지)</span>
            </div>
          </div>

          {/* Red Strip Highlight Footer */}
          <div className="bg-[#EF4444] text-[#7F1D1D] text-center py-1.5 text-[9px] font-black tracking-tight select-none border-t border-red-600/30 select-none">
            ※ 자세한 내용은 이벤트란 참고 부탁드립니다
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
