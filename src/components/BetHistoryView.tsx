import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BetHistoryViewProps {
  currentUserData: any;
}

export default function BetHistoryView({ currentUserData }: BetHistoryViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const bets = currentUserData?.bets || [];
  const totalPages = Math.ceil(bets.length / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBets = bets.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-6 w-full mx-auto max-w-6xl">
      <div className="text-white text-xl font-bold mb-6 tracking-tight">배팅내역</div>
      
      <div className="space-y-3">
        {currentBets.length > 0 ? (
          currentBets.map((bet: any) => {
            const betDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[0] : bet.betTime);
            const betTime = bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[1] : bet.betTime);

            return (
              <div key={bet.id} className="bg-gradient-to-r from-[#0d0e12] via-[#07080a] to-[#0d0e12] border border-neutral-800/80 hover:border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center gap-4 transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group">
                {/* Date/Time */}
                <div className="flex flex-col items-center justify-center min-w-[90px] text-xs font-mono bg-black/40 py-2 px-3 rounded-lg border border-neutral-850/60 shadow-inner">
                  <span className="text-gray-500">{betDate}</span>
                  <span className="text-amber-400 font-extrabold text-[13px] tracking-wide mt-0.5">{betTime}</span>
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-black text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                    <span>{bet.game}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1 bg-black/25 p-2 px-3 rounded-md border border-neutral-900 shadow-inner">
                     {bet.folders && bet.folders.length > 0 ? (
                        bet.folders.map((f: any, fIdx: number) => (
                           <div key={fIdx} className="mb-1 flex items-center justify-between">
                             <span>[{f.game}] {f.option}</span>
                             <span className="text-amber-500 font-bold font-mono">({f.dividend}배)</span>
                           </div>
                        ))
                     ) : (
                        <div className="flex items-center justify-between">
                          <span>[{bet.group}] {bet.option}</span>
                          <span className="text-amber-500 font-bold font-mono">({bet.dividend}배)</span>
                        </div>
                     )}
                  </div>
                </div>

                {/* Outcome Display */}
                <div className="w-full md:w-[280px] flex items-center gap-2">
                  <div className="flex-1 bg-[#1a0f0f]/30 border border-red-950/60 rounded-lg px-4 py-2 text-center text-amber-500 font-black text-xs shadow-inner">
                    <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5 font-sans">선택 옵션</div>
                    {bet.option}
                  </div>
                  <div className="text-[10px] text-gray-600 font-black tracking-tighter select-none font-mono">VS</div>
                  <div className={`flex-1 bg-neutral-900/60 border ${
                    bet.status === 'win' ? 'border-emerald-900/50 hover:border-emerald-500/20' : 
                    bet.status === 'lose' ? 'border-red-950 bg-red-950/15' : 
                    'border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]'
                  } rounded-lg px-4 py-2 text-center ${
                    bet.status === 'win' ? 'text-emerald-400' : 
                    bet.status === 'lose' ? 'text-red-400' : 
                    'text-amber-500'
                  } font-bold text-xs shadow-inner`}>
                     <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5 font-sans">최종 결과</div>
                     {bet.status === 'win' || bet.status === 'lose' ? (
                       bet.rollResult ? bet.rollResult.split('➔').pop()?.replace(/[\[\]]/g, '') || '-' : '-'
                     ) : (
                       <span className="text-[10px] font-medium leading-tight text-amber-500/90 animate-pulse tracking-tighter">결과를 정산중입니다..</span>
                     )}
                  </div>
                </div>

                {/* Amount */}
                <div className="w-[110px] text-right font-bold font-mono text-gray-200">
                  <div className="text-[9px] tracking-wider text-gray-650 font-sans font-semibold mb-0.5 uppercase">배팅 머니</div>
                  {bet.amount.toLocaleString()}원
                </div>

                {/* Result/Payout */}
                <div className={`w-[120px] text-right font-extrabold ${bet.status === 'win' ? 'text-emerald-400' : (bet.status === 'lose' ? 'text-red-500/80' : 'text-amber-500/80')}`}>
                  <div className="text-[9px] tracking-wider text-gray-650 font-sans font-semibold mb-0.5 uppercase">예상/정산 결과</div>
                  {bet.status === 'win' ? `+${Math.floor(bet.amount * bet.dividend).toLocaleString()}원` : (bet.status === 'lose' ? '미적중' : '-')}
                </div>

                {/* Status */}
                <div className="w-[80px] text-center shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-black border tracking-wider shadow-sm block ${
                    bet.status === 'win' ? 'border-emerald-900 bg-emerald-950/40 text-emerald-450 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                    bet.status === 'lose' ? 'border-red-900 bg-red-950/40 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                    'border-amber-900/60 bg-amber-950/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.08)] animate-pulse'
                  }`}>
                    {bet.status === 'win' ? '적중' : bet.status === 'lose' ? '미적중' : '대기중'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 border border-neutral-800 rounded-xl bg-[#0b0c10]">
            배팅 내역이 없습니다.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-400 disabled:opacity-50 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-400 disabled:opacity-50 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
