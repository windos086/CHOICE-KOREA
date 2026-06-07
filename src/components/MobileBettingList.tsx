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
    <div className="flex flex-col gap-2 p-2 bg-[#0c0e15]/90">
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
        const isClosed = row.round === currentRound && secondsLeft <= 10;
        
        return (
          <div key={`${row.round}-${idx}`} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">{row.time}</span>
              <span className="text-amber-500/85 font-black">[{row.round}회차] {row.marketName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={isClosed ? undefined : () => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
                disabled={isClosed}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-between transition ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800 text-gray-700 cursor-not-allowed'
                    : isLeftSelected
                    ? 'bg-amber-600/90 text-white shadow-lg border border-amber-500'
                    : 'bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700 text-gray-300'
                }`}
              >
                <span className="font-bold text-xs">{row.left.label}</span>
                <span className={`font-black tracking-tighter ${isLeftSelected ? 'text-white' : 'text-amber-400'}`}>{row.left.dividend.toFixed(2)}</span>
              </button>
              <button
                onClick={isClosed ? undefined : () => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
                disabled={isClosed}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-between transition ${
                  isClosed
                    ? 'bg-neutral-950 border border-neutral-800 text-gray-700 cursor-not-allowed'
                    : isRightSelected
                    ? 'bg-amber-600/90 text-white shadow-lg border border-amber-500'
                    : 'bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700 text-gray-300'
                }`}
              >
                <span className="font-bold text-xs">{row.right.label}</span>
                <span className={`font-black tracking-tighter ${isRightSelected ? 'text-white' : 'text-amber-400'}`}>{row.right.dividend.toFixed(2)}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
