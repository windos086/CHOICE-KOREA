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
    <div className="flex-1 p-6 w-full mx-auto max-w-7xl">
      <div className="text-white text-xl font-bold mb-6 tracking-tight">배팅내역</div>
      
      <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40">
        {/* Desktop View: Table */}
        <table className="hidden md:table w-full text-center text-xs text-gray-300">
          <thead className="bg-[#0b0e14] border-b border-neutral-800/80 text-gray-400 text-[11px] font-bold tracking-wider">
            <tr>
              <th className="p-3 text-left pl-6">배팅일시</th>
              <th className="p-3 text-left">리그 (구분)</th>
              <th className="p-3 text-center">선택 정보</th>
              <th className="p-3 text-center">배팅 머니</th>
              <th className="p-3 text-center">적중 머니</th>
              <th className="p-3 text-center">예상 배당</th>
              <th className="p-3 text-center">스코어</th>
              <th className="p-3 text-right pr-6">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40">
        {currentBets.length > 0 ? (
          currentBets.map((bet: any) => {
            const betDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[0] : bet.betTime);
            const betTime = bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[1] : bet.betTime);
            const winAmount = bet.status === 'win' ? Math.floor(bet.amount * bet.dividend) : (bet.status === 'lose' ? bet.amount : 0);
            const amountColor = bet.status === 'win' ? 'text-emerald-400' : (bet.status === 'lose' ? 'text-red-500' : 'text-gray-300');
            const displaySign = bet.status === 'win' ? '+' : (bet.status === 'lose' ? '-' : '');

            return (
              <tr key={bet.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-3 text-left pl-6 font-mono text-[11px] text-gray-500 whitespace-nowrap align-middle">
                    <span className="block">{betDate}</span>
                    <span className="text-amber-500 font-bold block">{betTime}</span>
                </td>
                <td className="p-3 text-left font-black text-white">{bet.game}</td>
                <td className="p-3 text-center">
                    {bet.folders && bet.folders.length > 0 ? (
                        bet.folders.map((f: any, fIdx: number) => (
                            <div key={fIdx} className="text-white text-xs">{f.option}</div>
                        ))
                    ) : (
                        <div className="text-white text-xs">{bet.option}</div>
                    )}
                </td>
                <td className="p-3 text-center text-gray-300 font-mono">{bet.amount.toLocaleString()}원</td>
                <td className={`p-3 text-center ${amountColor} font-mono font-bold`}>{bet.status !== 'pending' ? `${displaySign}${winAmount.toLocaleString()}원` : '-'}</td>
                <td className="p-3 text-center text-amber-500 font-bold font-mono">{bet.dividend}</td>
                <td className="p-3 text-center text-gray-400">
                      {bet.status === 'win' || bet.status === 'lose' ? (
                        bet.rollResult ? bet.rollResult.split('➔').pop()?.replace(/[\[\]]/g, '') || '-' : '-'
                      ) : (
                        <span className="text-[10px] text-amber-500/90 tracking-tighter">대기 중</span>
                      )}
                </td>
                <td className="p-3 text-right pr-6">
                    <span className={`px-3 py-1 rounded text-[10px] font-black border ${
                        bet.status === 'win' ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' :
                        bet.status === 'lose' ? 'border-red-900 bg-red-950/40 text-red-500' :
                        'border-neutral-800 bg-neutral-900 text-gray-500'
                    }`}>
                        {bet.status === 'win' ? '적중' : bet.status === 'lose' ? '미적중' : '대기중'}
                    </span>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={8} className="text-center py-12 text-gray-500">배팅 내역이 없습니다.</td>
          </tr>
        )}
          </tbody>
        </table>

        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col gap-3 p-4">
          {currentBets.length > 0 ? (
            currentBets.map((bet: any) => {
              const betDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[0] : bet.betTime);
              const betTime = bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[1] : bet.betTime);
              const winAmount = bet.status === 'win' ? Math.floor(bet.amount * bet.dividend) : (bet.status === 'lose' ? bet.amount : 0);
              const amountColor = bet.status === 'win' ? 'text-emerald-400' : (bet.status === 'lose' ? 'text-red-500' : 'text-gray-300');
              const displaySign = bet.status === 'win' ? '+' : (bet.status === 'lose' ? '-' : '');

              return (
                <div key={bet.id} className="bg-[#0b0c10] border border-neutral-800 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs text-neutral-400">
                        <span className="font-mono">{betDate} {betTime}</span>
                        <span className={`px-2 py-0.5 rounded font-black border ${
                            bet.status === 'win' ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' :
                            bet.status === 'lose' ? 'border-red-900 bg-red-950/40 text-red-500' :
                            'border-neutral-800 bg-neutral-900 text-gray-500'
                        }`}>
                            {bet.status === 'win' ? '적중' : bet.status === 'lose' ? '미적중' : '대기중'}
                        </span>
                    </div>

                    <div className="text-white font-bold text-sm tracking-tight">{bet.game}</div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-neutral-500">배팅금</div>
                        <div className="text-right text-gray-200">{bet.amount.toLocaleString()}원</div>
                        
                        <div className="text-neutral-500">예상배당</div>
                        <div className="text-right text-amber-500 font-bold">{bet.dividend}</div>
                        
                        <div className="text-neutral-500">적중금</div>
                        <div className={`text-right font-bold ${amountColor}`}>{bet.status !== 'pending' ? `${displaySign}${winAmount.toLocaleString()}원` : '-'}</div>

                        <div className="text-neutral-500">선택</div>
                        <div className="text-right text-white break-all">
                            {bet.folders && bet.folders.length > 0 ? (
                                bet.folders.map((f: any, fIdx: number) => <span key={fIdx}>{f.option} </span>)
                            ) : (
                                <span>{bet.option}</span>
                            )}
                        </div>
                    </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">배팅 내역이 없습니다.</div>
          )}
        </div>
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
