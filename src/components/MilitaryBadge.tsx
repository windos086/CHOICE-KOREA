import React from 'react';

export interface MilitaryBadgeData {
  id: string;
  name: string;
  price: number;
  icon: string; // Fallback symbol
  color: string; // Text color
  bgGrad: string; // Shop card background gradient
  borderClass: string; // Shop card border
  description: string;
  category: 'soldier' | 'nco' | 'officer' | 'field_officer' | 'general';
}

// All 17 military ranks
export const MILITARY_BADGES: MilitaryBadgeData[] = [
  { id: 'm_pvt', name: '이등병', price: 5000, icon: '➖', color: 'text-stone-300', bgGrad: 'from-stone-900/40 to-stone-950/20', borderClass: 'border-stone-800/40', description: '예측 시장에 갓 전입한 패기와 의욕이 넘치는 이병 분석자', category: 'soldier' },
  { id: 'm_pfc', name: '일병', price: 10000, icon: '双', color: 'text-stone-300', bgGrad: 'from-stone-900/45 to-stone-950/25', borderClass: 'border-stone-800/50', description: '예측 리듬에 성실히 적응하며 적중을 일구는 일병 승부사', category: 'soldier' },
  { id: 'm_cpl', name: '상병', price: 20000, icon: '参', color: 'text-stone-300', bgGrad: 'from-stone-900/50 to-stone-950/30', borderClass: 'border-stone-800/60', description: '체계적인 분석 전술을 구사하는 노련함의 뼈대 상병 계급', category: 'soldier' },
  { id: 'm_sgt', name: '병장', price: 30000, icon: '肆', color: 'text-stone-200', bgGrad: 'from-stone-800/40 to-stone-900/20', borderClass: 'border-stone-700/50', description: '내공이 가득해 정산의 맥을 뚫어내는 전투 프로 병장 계급', category: 'soldier' },
  
  { id: 'm_ssg', name: '하사', price: 50000, icon: '🔰', color: 'text-amber-500', bgGrad: 'from-amber-950/20 to-amber-900/5', borderClass: 'border-amber-800/30', description: '커뮤니티의 든든한 등뼈가 되는 프로페셔널 하사 간부 계급', category: 'nco' },
  { id: 'm_sfc', name: '중사', price: 60000, icon: '🎗️', color: 'text-amber-500', bgGrad: 'from-amber-950/25 to-amber-905/5', borderClass: 'border-amber-800/40', description: '부대 정예 전력을 가늠하는 노련한 승률의 베테랑 중사 계급', category: 'nco' },
  { id: 'm_msg', name: '상사', price: 65000, icon: '⚜️', color: 'text-amber-400', bgGrad: 'from-amber-900/30 to-amber-950/10', borderClass: 'border-amber-700/40', description: '예측 명가다운 철통 노하우를 계승한 행보관급 상사 계급', category: 'nco' },
  
  { id: 'm_2lt', name: '소위', price: 60000, icon: '♦', color: 'text-cyan-300', bgGrad: 'from-cyan-950/20 to-cyan-900/5', borderClass: 'border-cyan-800/30', description: '다각적 정보를 군사하여 새로운 시각의 카드를 여는 초임 소위', category: 'officer' },
  { id: 'm_1lt', name: '중위', price: 80000, icon: '♦️♦️', color: 'text-cyan-300', bgGrad: 'from-cyan-950/25 to-cyan-900/10', borderClass: 'border-cyan-750/35', description: '검증된 포트폴리오를 앞세워 중원을 책임지는 위엄의 중위', category: 'officer' },
  { id: 'm_capt', name: '대위', price: 100000, icon: '♦️♦️♦️', color: 'text-cyan-400', bgGrad: 'from-cyan-950/30 to-cyan-900/15', borderClass: 'border-cyan-700/40', description: '개인 분석 중대를 솔선하여 승리로 지휘하는 강인한 대위', category: 'officer' },
  
  { id: 'm_maj', name: '소령', price: 150000, icon: '🌸', color: 'text-purple-400', bgGrad: 'from-purple-950/25 to-[#120024]', borderClass: 'border-purple-800/40', description: '고밀도 첩보 분석과 작전 참모를 수행하는 전략가 소령 계급', category: 'field_officer' },
  { id: 'm_ltc', name: '중령', price: 200000, icon: '🍀', color: 'text-purple-400', bgGrad: 'from-purple-950/30 to-[#120024]', borderClass: 'border-purple-750/40', description: '예측 여론 대대를 선봉 지수 지휘하는 맹장 중령 계급', category: 'field_officer' },
  { id: 'm_col', name: '대령', price: 300000, icon: '🏵️', color: 'text-[#d946ef]', bgGrad: 'from-purple-950/35 to-purple-900/15', borderClass: 'border-purple-600/40', description: '삼엄한 통찰력으로 백발백중 연승 행보를 걷는 필승의 대령', category: 'field_officer' },
  
  { id: 'm_bgen', name: '준장', price: 500000, icon: '⭐', color: 'text-[#ffd700]', bgGrad: 'from-[#1a1403] to-[#0a0802]', borderClass: 'border-[#ffd700]/30', description: '장군의 광휘와 함께 승부처를 직접 점철하는 별 한 개 준장', category: 'general' },
  { id: 'm_mgen', name: '소장', price: 600000, icon: '⭐⭐', color: 'text-[#ffd700]', bgGrad: 'from-[#241c04] to-[#0d0a02]', borderClass: 'border-[#ffd700]/40', description: '명예 예측 전선을 광범위하게 진두 지휘하는 별 두 개 소장', category: 'general' },
  { id: 'm_lgen', name: '중장', price: 800000, icon: '⭐⭐⭐', color: 'text-[#ffd700]', bgGrad: 'from-[#2d2305] to-[#120e03]', borderClass: 'border-[#ffd700]/55', description: '독보적인 부와 안목으로 전체 시장을 쥐락팎락하는 쓰리스타 중장', category: 'general' },
  { id: 'm_gen', name: '대장', price: 1000000, icon: '⭐⭐⭐⭐', color: 'text-[#ffd700] animate-pulse', bgGrad: 'from-[#3a2e06] via-[#1a1403] to-[#11011c]', borderClass: 'border-[#ffd700]/70', description: '초이스 코리아 최고존엄이자 전설적인 사령관의 정점 대장', category: 'general' }
];

// Map old ranks to new ranks for backward compatibility
export function normalizeBadgeId(badgeId: string | null | undefined): string | null {
  if (!badgeId) return null;
  
  const mapping: Record<string, string> = {
    'b_bronze': 'm_pvt',
    'b_silver': 'm_pfc',
    'b_gold': 'm_cpl',
    'b_star1': 'm_sgt',
    'b_star2': 'm_ssg',
    'b_star3': 'm_sfc',
    'b_emperor': 'm_maj',
    'b_prophet': 'm_col',
    'b_god': 'm_gen'
  };
  
  return mapping[badgeId] || badgeId;
}

// Helper to render high quality visual vector military rank insignia
const render3DStar = (cx: number, cy: number, r_out: number, r_in: number, isGold: boolean = false) => {
  const points: {x: number, y: number}[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? r_out : r_in;
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  const light = isGold ? '#fff9c4' : '#f8fafc';
  const mid = isGold ? '#d4af37' : '#e2e8f0';
  const dark = isGold ? '#aa7c11' : '#94a3b8';
  const shadow = isGold ? '#684b05' : '#475569';
  const colors = [light, mid, dark, shadow, shadow, light, mid, dark, shadow, shadow];
  return (
    <g>
      {Array.from({ length: 10 }).map((_, i) => {
        const p1 = points[i];
        const p2 = points[(i + 1) % 10];
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`}
            fill={colors[i]}
            stroke={mid}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

const renderLaurelCradle = (cx: number, cy: number, w: number, isSilver: boolean) => {
  const col1 = isSilver ? '#f1f5f9' : '#fff9c4';
  const col2 = isSilver ? '#cbd5e1' : '#d4af37';
  const col3 = isSilver ? '#475569' : '#855800';
  return (
    <g>
      {/* Branch curve */}
      <path 
        d={`M ${cx - w} ${cy - 8} Q ${cx - w * 0.9} ${cy + 11} ${cx} ${cy + 11} Q ${cx + w * 0.9} ${cy + 11} ${cx + w} ${cy - 8}`} 
        fill="none" 
        stroke={col2} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      {/* Symmetrical Leaves */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`scale(${s}, 1) translate(${-cx * (s - 1)}, 0)`}>
          <path d={`M ${cx - w * 0.9} ${cy} Q ${cx - w - 4} ${cy - 6} ${cx - w * 0.8} ${cy - 8}`} fill={col1} stroke={col3} strokeWidth="0.5" />
          <path d={`M ${cx - w * 0.7} ${cy + 4} Q ${cx - w - 2} ${cy - 1} ${cx - w * 0.6} ${cy - 4}`} fill={col2} stroke={col3} strokeWidth="0.5" />
          <path d={`M ${cx - w * 0.4} ${cy + 8} Q ${cx - w * 0.7} ${cy + 6} ${cx - w * 0.3} ${cy + 1}`} fill={col1} stroke={col3} strokeWidth="0.5" />
        </g>
      ))}
      {/* Symmetrical Rose core at the bottom */}
      <circle cx={cx} cy={cy + 11} r="4.2" fill={col1} stroke={col3} strokeWidth="1" />
      <circle cx={cx} cy={cy + 11} r="2" fill={col3} />
    </g>
  );
};

const render3DDiamond = (cx: number, cy: number, w: number, h: number) => {
  return (
    <g>
      <path d={`M ${cx} ${cy} L ${cx - w} ${cy} L ${cx} ${cy - h} Z`} fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
      <path d={`M ${cx} ${cy} L ${cx} ${cy - h} L ${cx + w} ${cy} Z`} fill="#cbd5e1" stroke="#e2e8f0" strokeWidth="0.5" />
      <path d={`M ${cx} ${cy} L ${cx - w} ${cy} L ${cx} ${cy + h} Z`} fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.5" />
      <path d={`M ${cx} ${cy} L ${cx} ${cy + h} L ${cx + w} ${cy} Z`} fill="#475569" stroke="#cbd5e1" strokeWidth="0.5" />
    </g>
  );
};

const renderSharonRose = (cx: number, cy: number, r: number) => {
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / 9 - Math.PI / 2;
        const leafW = (1.1 * Math.PI) / 9;
        const tx = cx + r * Math.cos(angle);
        const ty = cy + r * Math.sin(angle);
        const lx = cx + (r * 0.7) * Math.cos(angle - leafW);
        const ly = cy + (r * 0.7) * Math.sin(angle - leafW);
        const rx = cx + (r * 0.7) * Math.cos(angle + leafW);
        const ry = cy + (r * 0.7) * Math.sin(angle + leafW);
        return (
          <g key={i}>
            <path d={`M ${cx} ${cy} Q ${lx.toFixed(1)} ${ly.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Z`} fill={i % 2 === 0 ? '#f8fafc' : '#cbd5e1'} stroke="#cbd5e1" strokeWidth="0.5" />
            <path d={`M ${cx} ${cy} Q ${rx.toFixed(1)} ${ry.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Z`} fill={i % 2 === 0 ? '#94a3b8' : '#475569'} stroke="#cbd5e1" strokeWidth="0.5" />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#475569" stroke="#cbd5e1" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#e2e8f0" />
      <circle cx={cx} cy={cy} r={r * 0.08} fill="#ffffff" />
    </g>
  );
};

export function MilitaryInsignia({ badgeId, className = "h-4 w-4" }: { badgeId: string; className?: string }) {
  const normId = normalizeBadgeId(badgeId) || '';
  const isHighRank = ['m_maj', 'm_ltc', 'm_col', 'm_bgen', 'm_mgen', 'm_lgen', 'm_gen'].includes(normId);

  return (
    <svg 
      viewBox="0 0 64 64" 
      className={`${className} ${isHighRank ? 'animate-glow-heavy' : ''}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="army-green" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3f4c38" />
          <stop offset="100%" stopColor="#222b1c" />
        </radialGradient>
        <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="50%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#ff8f00" />
        </linearGradient>
        <linearGradient id="shimmer-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <style>{`
          @keyframes sparkle-rotate-1 {
            0%, 100% { transform: translate(11px, 12px) scale(0) rotate(0deg); opacity: 0; }
            50% { transform: translate(11px, 12px) scale(1) rotate(180deg); opacity: 1; }
          }
          @keyframes sparkle-rotate-2 {
            0%, 100% { transform: translate(52px, 15px) scale(0.9) rotate(45deg); opacity: 0.95; }
            50% { transform: translate(52px, 15px) scale(0) rotate(-135deg); opacity: 0; }
          }
          @keyframes sparkle-rotate-3 {
            0%, 100% { transform: translate(32px, 53px) scale(0) rotate(0deg); opacity: 0; }
            65% { transform: translate(32px, 53px) scale(0.8) rotate(90deg); opacity: 0.9; }
          }
          @keyframes glow-pulse-heavy {
            0%, 100% { filter: drop-shadow(0 0 1px rgba(255,255,255,0.25)) drop-shadow(0 0 3px rgba(234,179,8,0.2)); }
            50% { filter: drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 0 9px rgba(234,179,8,0.55)); }
          }
          @keyframes shine-sweep-diagonal {
            0% { transform: translateX(-35px); }
            35% { transform: translateX(35px); }
            100% { transform: translateX(35px); }
          }
          .animate-sparkle-1 { transform-origin: 0px 0px; animation: sparkle-rotate-1 2.5s infinite ease-in-out; }
          .animate-sparkle-2 { transform-origin: 0px 0px; animation: sparkle-rotate-2 3s infinite ease-in-out; }
          .animate-sparkle-3 { transform-origin: 0px 0px; animation: sparkle-rotate-3 2.8s infinite ease-in-out; }
          .animate-glow-heavy { animation: glow-pulse-heavy 2.5s infinite ease-in-out; }
          .animate-shine-sweep { animation: shine-sweep-diagonal 4.5s infinite ease-in-out; }
        `}</style>
      </defs>

      {/* Rendering different types of insignias */}
      {(() => {
        switch (normId) {
          // --- 1. SOLDIER BARS (Olive green patches with realistic white/silver horizontal stripes) ---
          case 'm_pvt': // 이등병
            return (
              <g>
                <rect x="14" y="6" width="36" height="52" rx="3" fill="url(#army-green)" stroke="#6B7A5C" strokeWidth="2.5" />
                <rect x="18" y="10" width="28" height="44" rx="1.5" fill="#131711" />
                <rect x="21" y="29" width="22" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            );
          case 'm_pfc': // 일병
            return (
              <g>
                <rect x="14" y="6" width="36" height="52" rx="3" fill="url(#army-green)" stroke="#6B7A5C" strokeWidth="2.5" />
                <rect x="18" y="10" width="28" height="44" rx="1.5" fill="#131711" />
                <rect x="21" y="22" width="22" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="21" y="36" width="22" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            );
          case 'm_cpl': // 상병
            return (
              <g>
                <rect x="14" y="6" width="36" height="52" rx="3" fill="url(#army-green)" stroke="#6B7A5C" strokeWidth="2.5" />
                <rect x="18" y="10" width="28" height="44" rx="1.5" fill="#131711" />
                <rect x="21" y="16" width="22" height="5.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="21" y="29" width="22" height="5.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="21" y="42" width="22" height="5.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            );
          case 'm_sgt': // 병장
            return (
              <g>
                <rect x="14" y="6" width="36" height="52" rx="3" fill="url(#army-green)" stroke="#6B7A5C" strokeWidth="2.5" />
                <rect x="18" y="10" width="28" height="44" rx="1.5" fill="#131711" />
                <rect x="21" y="14" width="22" height="4.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
                <rect x="21" y="24.5" width="22" height="4.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
                <rect x="21" y="35" width="22" height="4.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
                <rect x="21" y="45.5" width="22" height="4.5" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
              </g>
            );

          // --- 2. NCO GOLD CHEVRONS (Gold V nested, supported by gold Sharon Rose leaf cradles) ---
          case 'm_ssg': // 하사
            return (
              <g>
                {renderLaurelCradle(32, 40, 18, false)}
                <path d="M 17 25 L 32 33 L 47 25" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          case 'm_sfc': // 중사
            return (
              <g>
                {renderLaurelCradle(32, 40, 18, false)}
                <path d="M 17 19 L 32 27 L 47 19" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 17 25 L 32 33 L 47 25" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          case 'm_msg': // 상사
            return (
              <g>
                {renderLaurelCradle(32, 40, 18, false)}
                <path d="M 17 15 L 32 23 L 47 15" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 17 21 L 32 29 L 47 21" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 17 27 L 32 35 L 47 27" fill="none" stroke="url(#gold-metallic)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );

          // --- 3. COMPANY OFFICERS DIAMONDS (Reflective faceted crystal diamonds in silver cradles) ---
          case 'm_2lt': // 소위
            return (
              <g>
                {renderLaurelCradle(32, 42, 18, true)}
                {render3DDiamond(32, 26, 8, 13)}
              </g>
            );
          case 'm_1lt': // 중위
            return (
              <g>
                {renderLaurelCradle(32, 42, 20, true)}
                {render3DDiamond(21, 26, 7, 11)}
                {render3DDiamond(43, 26, 7, 11)}
              </g>
            );
          case 'm_capt': // 대위
            return (
              <g>
                {renderLaurelCradle(32, 42, 21, true)}
                {render3DDiamond(16, 26, 6, 10)}
                {render3DDiamond(32, 26, 6, 10)}
                {render3DDiamond(48, 26, 6, 10)}
              </g>
            );

          // --- 4. FIELD OFFICERS SHARON ROSES (Advanced, sparkle-ready silver blossom roses) ---
          case 'm_maj': // 소령
            return (
              <g>
                {renderLaurelCradle(32, 42, 18, true)}
                {renderSharonRose(32, 25, 12)}
              </g>
            );
          case 'm_ltc': // 중령
            return (
              <g>
                {renderLaurelCradle(32, 42, 20, true)}
                {renderSharonRose(21, 25, 9.5)}
                {renderSharonRose(43, 25, 9.5)}
              </g>
            );
          case 'm_col': // 대령
            return (
              <g>
                {renderLaurelCradle(32, 42, 21, true)}
                {renderSharonRose(16, 25, 8)}
                {renderSharonRose(32, 25, 8)}
                {renderSharonRose(48, 25, 8)}
              </g>
            );

          // --- 5. GENERAL STARS (Bevelled 3D shiny golden general stars with golden cradles & heavy sparkles) ---
          case 'm_bgen': // 준장
            return (
              <g>
                {renderLaurelCradle(32, 42, 18, false)}
                {render3DStar(32, 24, 14, 6.2, true)}
              </g>
            );
          case 'm_mgen': // 소장
            return (
              <g>
                {renderLaurelCradle(32, 42, 20, false)}
                {render3DStar(21, 25, 11, 4.8, true)}
                {render3DStar(43, 25, 11, 4.8, true)}
              </g>
            );
          case 'm_lgen': // 중장
            return (
              <g>
                {renderLaurelCradle(32, 42, 21, false)}
                {render3DStar(16, 26, 9, 3.8, true)}
                {render3DStar(32, 22, 10, 4.2, true)}
                {render3DStar(48, 26, 9, 3.8, true)}
              </g>
            );
          case 'm_gen': // 대장
            return (
              <g>
                {renderLaurelCradle(32, 42, 22, false)}
                {render3DStar(13, 26, 8, 3.5, true)}
                {render3DStar(25.5, 22, 8.5, 3.8, true)}
                {render3DStar(38.5, 22, 8.5, 3.8, true)}
                {render3DStar(51, 26, 8, 3.5, true)}
              </g>
            );

          default:
            return <text x="32" y="36" fill="#cbd5e1" fontSize="24" textAnchor="middle" dominantBaseline="middle">🎖️</text>;
        }
      })()}

      {/* --- SWEEPING SHIMMER REFLCTION OVERLAY --- */}
      <g style={{ mixBlendMode: 'overlay', pointerEvents: 'none' }}>
        <line x1="-20" y1="0" x2="40" y2="60" stroke="url(#shimmer-highlight)" strokeWidth="12" opacity="0.6" className="animate-shine-sweep" />
      </g>

      {/* --- TWINKLE SPARKLING STARS FOR MAJOR AND ABOVE --- */}
      {isHighRank && (
        <g style={{ pointerEvents: 'none' }}>
          {/* Sparkle 1 */}
          <path d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z" fill="#ffffff" stroke="#fff9c4" strokeWidth="0.5" className="animate-sparkle-1" />
          {/* Sparkle 2 */}
          <path d="M 0 -4 Q 0 0 4 0 Q 0 0 0 4 Q 0 0 -4 0 Q 0 0 0 -4 Z" fill="#ffffff" stroke="#ffe082" strokeWidth="0.5" className="animate-sparkle-2" />
          {/* Sparkle 3 */}
          <path d="M 0 -3 Q 0 0 3 0 Q 0 0 0 3 Q 0 0 -3 0 Q 0 0 0 -3 Z" fill="#ffffff" stroke="#e0f7fa" strokeWidth="0.5" className="animate-sparkle-3" />
        </g>
      )}
    </svg>
  );
}

// Master component to render standard badges in headers / feeds / cards nicely
export function renderMilitaryBadge(activeBadgeId: string | null | undefined, customClassName?: string) {
  if (!activeBadgeId) return null;
  
  const normId = normalizeBadgeId(activeBadgeId);
  const badge = MILITARY_BADGES.find(b => b.id === normId);
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${customClassName !== undefined ? customClassName : 'mr-1.5'}`} title={`${badge.name} 계급`}>
      <MilitaryInsignia badgeId={badge.id} className="h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0" />
    </span>
  );
}
