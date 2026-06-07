import React from 'react';

export const MobileBettingList = ({
  sportsRows,
  handleToggleOption,
  activeMiniGameTab,
  selectedOptions,
  secondsLeft,
  getRoundAndSecondsRemaining
}: any) => {
  return (
    <div className="flex flex-col gap-3 p-2 bg-[#0c0e15]/90">
      {sportsRows.map((row: any, idx: number) => {
        const isLeftSelected = selectedOptions.some((opt: any) =>
          opt.round === row.round &&
          opt.group === row.left.group &&
          opt.name === row.left.value &&
          opt.game === row.league &&
          opt.gameType === activeMiniGameTab
        );
        const isRightSelected = selectedOptions.some((opt: any) =>
          opt.round === row.round &&
          opt.group === row.right.group &&
          opt.name === row.right.value &&
          opt.game === row.league &&
          opt.gameType === activeMiniGameTab
        );
        const { currentRound } = getRoundAndSecondsRemaining(activeMiniGameTab);
        const isClosed = row.round < currentRound || (row.round === currentRound && secondsLeft <= 10);
        
        return (
          <div 
            key={`${row.round}-${idx}`} 
            className="bg-neutral-900 border border-neutral-850 rounded-xl overflow-hidden shadow-lg hover:border-neutral-800 transition-all self-stretch"
          >
            {/* Match Header Bar */}
            <div className="bg-[#0b0c10] border-b border-[#1b1e24] px-3.5 py-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-extrabold tracking-wider">
                  {row.time}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-300 font-bold bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-850/60 max-w-[180px] truncate">
                  [{row.round}회] {row.marketName}
                </span>
                {isClosed && (
                  <span className="text-[9px] bg-red-950/20 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded font-black select-none shrink-0">
                    마감
                  </span>
                )}
              </div>
            </div>

            {/* Row Content: Sports Match Winner Layout style */}
            <div className="flex w-full h-[44px] items-stretch bg-[#16181d]/10">
              {/* Column 1: Left Win Button */}
              <button
                disabled={isClosed}
                onClick={isClosed ? undefined : () => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
                className={`flex-1 min-w-0 h-full flex items-center justify-between px-3.5 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800/10 text-gray-700 cursor-not-allowed'
                    : isLeftSelected
                    ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                    : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                }`}
              >
                <span className={`truncate text-left flex-1 min-w-0 mr-1.5 font-black text-[12px] tracking-tight ${
                  isClosed ? 'text-neutral-600' : isLeftSelected ? 'text-black' : 'text-neutral-200'
                }`}>
                  {row.left.label}
                </span>
                <span className={`font-mono text-xs font-black shrink-0 ml-1.5 ${
                  isClosed ? 'text-neutral-600' : isLeftSelected ? 'text-black' : 'text-amber-550 text-amber-500'
                }`}>
                  {row.left.dividend.toFixed(2)}
                </span>
              </button>

              {/* Column 2: Center Dividor Block (VS) */}
              <div className="w-12 items-center justify-center text-center shrink-0 border-l border-r border-[#1b1e24]/60 bg-[#07080b] flex z-10">
                <span className="font-mono text-[10px] font-black text-neutral-600 select-none uppercase">
                  VS
                </span>
              </div>

              {/* Column 3: Right Win Button */}
              <button
                disabled={isClosed}
                onClick={isClosed ? undefined : () => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
                className={`flex-1 min-w-0 h-full flex items-center justify-between px-3.5 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800/10 text-gray-700 cursor-not-allowed'
                    : isRightSelected
                    ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                    : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                }`}
              >
                <span className={`font-mono text-xs font-black shrink-0 mr-1.5 ${
                  isClosed ? 'text-neutral-600' : isRightSelected ? 'text-black' : 'text-amber-550 text-amber-500'
                }`}>
                  {row.right.dividend.toFixed(2)}
                </span>
                <span className={`truncate text-right flex-1 min-w-0 ml-1.5 font-black text-[12px] tracking-tight ${
                  isClosed ? 'text-neutral-600' : isRightSelected ? 'text-black' : 'text-neutral-200'
                }`}>
                  {row.right.label}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

