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
            <div className="bg-[#0b0c10] border-b border-[#1b1e24] px-4 py-3 flex items-center justify-between text-[12px] font-medium text-neutral-400">
              <div className="flex items-center gap-3">
                 <span className="text-white font-black text-sm bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                  {row.round}회
                </span>
                <span className="text-amber-500 font-bold tracking-wide">
                  {row.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-300 font-bold bg-neutral-950/80 px-3 py-1 rounded border border-neutral-850/60 max-w-[150px] truncate">
                  {row.marketName}
                </span>
                {isClosed && (
                  <span className="text-[10px] bg-red-950/20 text-red-500 border border-red-900/40 px-2 py-0.5 rounded font-black select-none">
                    마감
                  </span>
                )}
              </div>
            </div>

            {/* Row Content: Sports Match Winner Layout style */}
            <div className="flex w-full h-[56px] items-stretch bg-[#16181d]/10">
              {/* Column 1: Left Win Button */}
              <button
                disabled={isClosed}
                onClick={isClosed ? undefined : () => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
                className={`flex-[2] min-w-0 h-full flex items-center justify-between px-4 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800/10 text-gray-700 cursor-not-allowed'
                    : isLeftSelected
                    ? 'bg-amber-600 text-white font-black shadow-inner'
                    : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950 border-r border-[#1b1e24]/60'
                }`}
              >
                <span className={`truncate text-left max-w-[60%] flex-1 min-w-0 mr-1 font-bold text-[12px] ${
                  isClosed ? 'text-neutral-600' : isLeftSelected ? 'text-white' : 'text-neutral-100'
                }`}>
                  {row.left.label}{row.left.suffix || ''}
                </span>
                <span className={`font-mono text-xs font-black shrink-0 ${
                  isClosed ? 'text-neutral-600' : isLeftSelected ? 'text-white' : 'text-amber-500'
                }`}>
                  {row.left.dividend.toFixed(2)}
                </span>
              </button>

              {/* Column 2: Center Dividor Block (VS) */}
              <div className="w-12 items-center justify-center text-center shrink-0 bg-[#07080b]/80 flex z-10 px-1 border-l border-r border-[#1b1e24]/60">
                <span className={`font-mono font-bold select-none uppercase ${
                  row.middle !== 'VS' ? 'text-amber-400 text-[11px]' : 'text-neutral-500 text-[9px]'
                }`}>
                  {row.middle || 'vs'}
                </span>
              </div>

              {/* Column 3: Right Win Button */}
              <button
                disabled={isClosed}
                onClick={isClosed ? undefined : () => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
                className={`flex-[2] min-w-0 h-full flex items-center justify-between px-4 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800/10 text-gray-700 cursor-not-allowed'
                    : isRightSelected
                    ? 'bg-amber-600 text-white font-black shadow-inner'
                    : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950 border-l border-[#1b1e24]/60'
                }`}
              >
                <span className={`font-mono text-xs font-black shrink-0 mr-1 ${
                  isClosed ? 'text-neutral-600' : isRightSelected ? 'text-white' : 'text-amber-500'
                }`}>
                  {row.right.dividend.toFixed(2)}
                </span>
                <span className={`truncate text-right max-w-[60%] flex-1 min-w-0 ml-1 font-bold text-[12px] ${
                  isClosed ? 'text-neutral-600' : isRightSelected ? 'text-white' : 'text-neutral-100'
                }`}>
                  {row.right.label}{row.right.suffix || ''}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

