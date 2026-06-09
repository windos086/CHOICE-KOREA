import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BetHistoryViewProps {
  currentUserData: any;
}

export default function BetHistoryView({ currentUserData }: BetHistoryViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const itemsPerPage = 20;

  const allBets = currentUserData?.bets || [];
  
  const filteredBets = allBets.filter((bet: any) => {
    if (selectedCategory === '전체') return true;
    return bet.game.includes(selectedCategory);
  });

  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBets = filteredBets.slice(indexOfFirstItem, indexOfLastItem);

  const handleDeleteBet = async (bet: any) => {
    if (bet.status === 'pending') {
      alert('대기 중인 배팅 내역은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm('정말로 이 배팅 내역을 삭제하시겠습니까?')) return;
    try {
        const userDocId = currentUserData?.id || currentUserData?.username || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').username) || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').id);
        if (!userDocId) {
          throw new Error("User ID is missing or unregistered");
        }
        const userRef = doc(db, 'users', userDocId);
        await updateDoc(userRef, {
            bets: arrayRemove(bet)
        });
        alert('삭제되었습니다.');
    } catch (e: any) {
        alert('삭제 실패: ' + e.message);
    }
  };

  const handleDeleteAllBets = async () => {
    const resultedBets = allBets.filter((b: any) => b.status !== 'pending');
    
    if (resultedBets.length === 0) {
        alert('삭제할 수 있는 결과가 나온 배팅 내역이 없습니다.');
        return;
    }

    if (!confirm('결과가 나온 내역만 전체 삭제하시겠습니까? (대기 중인 내역은 삭제되지 않습니다.)')) return;
    try {
        const userDocId = currentUserData?.id || currentUserData?.username || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').username) || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').id);
        if (!userDocId) {
          throw new Error("User ID is missing or unregistered");
        }
        const userRef = doc(db, 'users', userDocId);
        await updateDoc(userRef, {
            bets: resultedBets
        });
        alert('결과가 나온 배팅 내역이 삭제되었습니다.');
    } catch (e: any) {
        alert('삭제 실패: ' + e.message);
    }
  };

  const categories = [
    '전체',
    '축구',
    '농구',
    '야구',
    '배구',
    'N파워볼(5분)', 
    'N파워볼(3분)', 
    'N파워사다리(5분)', 
    'N파워사다리(3분)', 
    '레드파워사다리(5분)'
  ];

  // Helper to map option choices to Home (Left) vs Away (Right) column
  function getBetSelectionLayout(bet: any) {
    let homeName = '';
    let homeOdds = '';
    let midStandard = 'VS';
    let awayName = '';
    let awayOdds = '';
    let selectedSide: 'home' | 'away' | null = null;

    // Determine option layout for Sports
    if (bet.gameType === 'sports') {
      const parts = bet.game ? bet.game.split(/ vs /i) : [];
      const homeTeam = parts[0] ? parts[0].trim() : '홈';
      const awayTeam = parts[1] ? parts[1].trim() : '원정';
      let mkt = bet.marketType;
      // Fallback detection if marketType is missing
      if (!mkt) {
        if (bet.type === 'under' || bet.type === 'over') {
          mkt = 'underOver';
        } else if (bet.lineValue && (bet.type === 'home' || bet.type === 'away')) {
          mkt = 'handicap';
        } else {
          mkt = 'matchWinner';
        }
      }


      homeOdds = String(bet.dividend || '1.95');
      awayOdds = String(bet.dividend || '1.95');

      if (mkt === 'underOver' || mkt === 'overUnder') {
        const threshold = bet.lineValue || '2.5';
        homeName = `${homeTeam} (오버)`;
        awayName = `${awayTeam} (언더)`;
        selectedSide = bet.type === 'over' ? 'home' : 'away';
        midStandard = threshold;
      } else if (mkt === 'handicap') {
        const hVal = bet.lineValue || '0';
        homeName = homeTeam;
        awayName = awayTeam;
        selectedSide = bet.type === 'home' ? 'home' : 'away';
        midStandard = hVal;
      } else {
        // matchWinner
        homeName = homeTeam;
        awayName = awayTeam;
        if (bet.type === 'home') {
          selectedSide = 'home';
        } else if (bet.type === 'away') {
          selectedSide = 'away';
        } else if (bet.type === 'draw') {
          midStandard = '무승부';
        }
      }
      return { homeName, homeOdds, midStandard, awayName, awayOdds, selectedSide };
    }

    // Resolve chosen option string for Minigames
    const optionStr = (bet.folders && bet.folders.length === 1) ? bet.folders[0].option : (bet.option || '');
    const dividend = bet.dividend || '1.95';

    if (optionStr.includes('홀') || optionStr.includes('짝')) {
      homeName = '홀';
      homeOdds = String(dividend);
      midStandard = 'VS';
      awayName = '짝';
      awayOdds = String(dividend);
      selectedSide = optionStr.includes('홀') ? 'home' : 'away';
    } else if (optionStr.includes('언더') || optionStr.includes('오버')) {
      const bracketMatch = optionStr.match(/\[([\d.]+)\]/);
      const threshold = bracketMatch ? bracketMatch[1] : 'VS';
      
      homeName = `언더 [${threshold}]`;
      homeOdds = String(dividend);
      midStandard = threshold;
      awayName = `오버 [${threshold}]`;
      awayOdds = String(dividend);
      selectedSide = optionStr.includes('언더') ? 'home' : 'away';
    } else if (optionStr.includes('좌') || optionStr.includes('우')) {
      homeName = '좌';
      homeOdds = String(dividend);
      midStandard = 'VS';
      awayName = '우';
      awayOdds = String(dividend);
      selectedSide = optionStr.includes('좌') ? 'home' : 'away';
    } else if (optionStr.includes('3줄') || optionStr.includes('4줄')) {
      homeName = '3줄';
      homeOdds = String(dividend);
      midStandard = 'VS';
      awayName = '4줄';
      awayOdds = String(dividend);
      selectedSide = optionStr.includes('3줄') ? 'home' : 'away';
    } else {
      homeName = optionStr;
      homeOdds = String(dividend);
      midStandard = 'VS';
      awayName = '';
      awayOdds = '';
      selectedSide = 'home';
    }

    return { homeName, homeOdds, midStandard, awayName, awayOdds, selectedSide };
  }

  function renderFormattedScore(bet: any) {
    if (bet.status === 'pending') {
      return <span className="text-gray-500 font-bold">대기 중</span>;
    }

    const isSports = bet.gameType === 'sports' || (bet.folders && bet.folders.some((f: any) => f.gameType === 'sports'));
    
    if (isSports) {
      if (bet.folders && bet.folders.length > 0) {
        return (
          <span className="text-amber-500 font-mono font-black flex flex-col gap-1 items-center">
            {bet.folders.map((f: any, idx: number) => {
              const raw = f.rollResult || '';
              const statusSuffix = f.status === 'win' ? ' [승]' : f.status === 'lose' ? ' [패]' : '';
              return <div key={idx}>{raw}{statusSuffix}</div>;
            })}
          </span>
        );
      }
      
      const raw = bet.rollResult ? bet.rollResult.replace(/[\[\]]/g, '') : '-';
      return <span className="text-amber-500 font-mono font-black">{raw}</span>;
    }

    const folders = bet.folders && bet.folders.length > 0 ? bet.folders : [bet];

    return (
      <span className="text-amber-500 font-black flex flex-col gap-0.5 items-center">
        {folders.map((f: any, idx: number) => {
          let rawResult = f.rollResult || '';
          
          const bracketMatch = rawResult.match(/\[(.*?)\]/);
          if (bracketMatch) {
            rawResult = bracketMatch[1];
          }

          if (rawResult.includes('➔')) {
            const parts = rawResult.split('➔');
            rawResult = parts[parts.length - 1].replace(/[\[\]]/g, '').trim();
          }

          if (!rawResult || rawResult === '대기 중') {
            return <div key={idx} className="text-gray-500 font-bold">대기 중</div>;
          }

          let suffix = ' [승]';
          if (rawResult === '중') {
            suffix = ' [무]';
          }

          if (rawResult.includes('[승]') || rawResult.includes('[무]')) {
            suffix = '';
          }

          return <div key={idx}>{rawResult}{suffix}</div>;
        })}
      </span>
    );
  }

  function renderSingleFolderScore(folder: any, parentPending: boolean) {
    if (parentPending || folder.status === 'pending') {
      return <span className="text-gray-500 font-bold text-xs">대기 중</span>;
    }

    const folderGameType = folder.gameType || 'sports';
    const isSports = folderGameType === 'sports';

    if (isSports) {
      const raw = folder.rollResult || '';
      const statusSuffix = folder.status === 'win' ? ' [승]' : folder.status === 'lose' ? ' [패]' : '';
      return (
        <span className="text-amber-500 font-mono font-black text-xs">
          {raw}{statusSuffix}
        </span>
      );
    }

    let rawResult = folder.rollResult || '';
    
    const bracketMatch = rawResult.match(/\[(.*?)\]/);
    if (bracketMatch) {
      rawResult = bracketMatch[1];
    }

    if (rawResult.includes('➔')) {
      const parts = rawResult.split('➔');
      rawResult = parts[parts.length - 1].replace(/[\[\]]/g, '').trim();
    }

    if (!rawResult || rawResult === '대기 중') {
      return <span className="text-gray-500 font-bold text-xs">대기 중</span>;
    }

    let suffix = ' [승]';
    if (rawResult === '중') {
      suffix = ' [무]';
    }

    if (rawResult.includes('[승]') || rawResult.includes('[무]')) {
      suffix = '';
    }

    return (
      <span className="text-amber-500 font-bold text-xs">
        {rawResult}{suffix}
      </span>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]" id="bet-history-view-id">
      {/* Breadcrumb Path */}
      <div className="mb-4 text-sm text-gray-400 font-sans" id="bet-history-breadcrumb">
        <span className="text-gray-500">홈</span> &gt; 배팅내역
      </div>

      <div className="bg-[#0e111a] border border-neutral-800/80 rounded-xl p-5 md:p-7 shadow-2xl" id="bet-history-card-panel">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-between mb-6 font-sans" id="bet-history-title">
          <div className="flex items-center gap-2">
            배팅 내역 <span className="text-amber-500 text-[10px] font-black tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">BET HISTORY</span>
          </div>
          {allBets.length > 0 && (
            <button 
              onClick={handleDeleteAllBets}
              className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900 border border-red-900/40 text-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              id="bet-history-delete-all-btn"
            >
              <Trash2 className="w-3.5 h-3.5" /> 전체 삭제
            </button>
          )}
        </h2>

        {/* Game Result Categories */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-800/80 pb-6" id="bet-history-categories-container">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer border ${
                selectedCategory === cat 
                  ? 'bg-amber-500 text-black border-amber-500 shadow font-black' 
                  : 'bg-[#0a0c10] hover:bg-neutral-800 text-gray-400 border-neutral-800/80'
              }`}
              id={`category-btn-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredBets.length === 0 ? (
          <div className="w-full text-center text-gray-500 py-24 border border-dashed border-neutral-800 rounded-lg animate-fade-in" id="no-bets-placeholder">
            현재 등록된 {selectedCategory === '전체' ? '' : `[${selectedCategory}]`} 배팅 내역이 없습니다.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40" id="desktop-bets-table-wrapper">
              <table className="w-full text-center text-xs text-gray-300">
                <thead className="bg-[#0b0e14] border-b border-neutral-800/80 text-gray-400 text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3 text-left pl-6 min-w-[100px]">배팅일시</th>
                    <th className="p-3 text-left">리그 (구분)</th>
                    <th className="p-3 text-center min-w-[170px]">승 (홈)</th>
                    <th className="p-3 text-center min-w-[90px]">무 / 기준값</th>
                    <th className="p-3 text-center min-w-[170px]">패 (원정)</th>
                    <th className="p-3 text-center min-w-[100px]">스코어</th>
                    <th className="p-3 text-center pr-6 min-w-[125px]">결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {currentBets.map((bet: any) => {
                    const betDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[0] : bet.betTime || '');
                    const betTime = bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[1] : bet.betTime || '');
                    const winAmount = bet.status === 'win' ? Math.floor(bet.amount * bet.dividend) : (bet.status === 'lose' ? bet.amount : 0);
                    const amountColor = bet.status === 'win' ? 'text-emerald-400' : (bet.status === 'lose' ? 'text-red-500' : 'text-gray-300');
                    const displaySign = bet.status === 'win' ? '+' : (bet.status === 'lose' ? '-' : '');
                    
                    const hasFolders = bet.folders && bet.folders.length > 0;
                    const items = hasFolders 
                      ? [...bet.folders].sort((a: any, b: any) => {
                          const getPriority = (x: any) => {
                            const m = x.marketType || '';
                            if (m === 'handicap') return 1;
                            if (m === 'overUnder' || m === 'underOver') return 3;
                            return 2;
                          };
                          return getPriority(a) - getPriority(b);
                        })
                      : [bet];

                    return (
                      <React.Fragment key={bet.id}>
                        {items.map((f: any, idx: number) => {
                          const layout = getBetSelectionLayout(f);
                          const isFirst = idx === 0;

                          return (
                            <tr key={`${bet.id}_f_${idx}`} className="hover:bg-neutral-900/10 transition-colors">
                              {/* 배팅일시 (Spans across all folder rows) */}
                              {isFirst && (
                                <td 
                                  rowSpan={items.length} 
                                  className="p-3 text-left pl-6 font-mono text-[11px] text-gray-500 whitespace-nowrap leading-relaxed py-4 align-middle border-r border-neutral-800/20"
                                >
                                  <span className="block">{betDate}</span>
                                  <span className="text-amber-500 font-bold mt-0.5 block">{betTime}</span>
                                </td>
                              )}

                              {/* 리그 (구분) */}
                              <td className="p-3 text-left align-middle py-4">
                                <div className="flex items-center gap-3">
                                  {/* Live Red Glow Indicator - Matches Game Result screen */}
                                  <div className="flex flex-col items-center justify-center bg-[#1d0e11] border border-red-950/60 rounded px-1.5 py-1 min-w-[36px] min-h-[36px] h-9 w-9">
                                    <span className="block w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]"></span>
                                    <span className="text-[9px] font-black text-red-500 mt-1 scale-90 tracking-tighter">LIVE</span>
                                  </div>
                                  <span className="text-white text-xs font-bold font-sans tracking-tight">
                                    {f.game}
                                  </span>
                                </div>
                              </td>

                              {/* 승 (홈) */}
                              <td className="p-3 text-center align-middle py-4">
                                <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs h-9 font-medium transition duration-200 select-none ${
                                  layout.selectedSide === 'home' 
                                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)] font-bold' 
                                    : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90 text-gray-400'
                                }`}>
                                  <span className={layout.selectedSide === 'home' ? 'text-amber-400' : 'text-gray-300'}>
                                    {layout.homeName}
                                  </span>
                                  {layout.homeOdds && (
                                    <span className="text-amber-500 font-bold font-mono tracking-wider ml-auto text-[11px]">
                                      {layout.homeOdds}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 무 / 기준값 */}
                              <td className="p-3 text-center align-middle py-4">
                                <div className="inline-flex items-center justify-center bg-[#07090d] border border-neutral-800/90 text-gray-400 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md min-w-[44px] h-7">
                                  {layout.midStandard}
                                </div>
                              </td>

                              {/* 패 (원정) */}
                              <td className="p-3 text-center align-middle py-4">
                                {layout.awayName ? (
                                  <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs h-9 font-medium transition duration-200 select-none ${
                                    layout.selectedSide === 'away' 
                                      ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)] font-bold' 
                                      : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90 text-gray-400'
                                  }`}>
                                    <span className={layout.selectedSide === 'away' ? 'text-amber-400' : 'text-gray-300'}>
                                      {layout.awayName}
                                    </span>
                                    {layout.awayOdds && (
                                      <span className="text-amber-500 font-bold font-mono tracking-wider ml-auto text-[11px]">
                                        {layout.awayOdds}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-neutral-700">-</span>
                                )}
                              </td>

                              {/* 스코어 */}
                              <td className="p-3 text-center align-middle py-4 font-bold text-xs">
                                {renderSingleFolderScore(f, bet.status === 'pending')}
                              </td>

                              {/* 결과 / 삭제 (Spans across all folder rows) */}
                              {isFirst && (
                                <td 
                                  rowSpan={items.length} 
                                  className="p-3 text-center align-middle pr-6 py-4 border-l border-neutral-800/20"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={`inline-block border px-3 py-1 text-[11px] rounded font-bold tracking-tight shadow-md select-none ${
                                      bet.status === 'win' ? 'border-emerald-900 bg-emerald-950/30 text-emerald-400' :
                                      bet.status === 'lose' ? 'border-red-900 bg-red-950/30 text-red-500' :
                                      'border-neutral-800 bg-neutral-900 text-gray-500'
                                    }`}>
                                      {bet.status === 'win' ? '적중' : bet.status === 'lose' ? '미적중' : '대기중'}
                                    </span>
                                    <button 
                                      onClick={() => handleDeleteBet(bet)} 
                                      className="text-neutral-500 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-neutral-900/60 cursor-pointer"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {/* Combined Information Sub-Row: Bet Amount, Dividend, Calculated Win Amount */}
                        <tr className="bg-neutral-950/30 text-[11px] text-gray-400">
                          <td colSpan={7} className="px-6 py-3 text-right font-sans border-b border-neutral-900/60">
                            <div className="flex justify-end gap-6 items-center">
                              <div>
                                <span className="text-neutral-500 font-medium">배팅금:</span>{' '}
                                <span className="text-gray-300 font-mono font-black text-xs">{bet.amount.toLocaleString()}원</span>
                              </div>
                              <div>
                                <span className="text-neutral-500 font-medium">배당률:</span>{' '}
                                <span className="text-amber-500 font-mono font-black text-xs">x{parseFloat(bet.dividend).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-neutral-500 font-medium">
                                  {bet.status === 'win' ? '적중금:' : bet.status === 'lose' ? '손실금:' : '예상적중금:'}
                                </span>{' '}
                                <span className={`font-mono font-black text-xs ${amountColor}`}>
                                  {bet.status !== 'pending' ? `${displaySign}${winAmount.toLocaleString()}원` : `${Math.floor(bet.amount * bet.dividend).toLocaleString()}원`}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Beautiful physical spacer row to clearly separate each independent bet */}
                        <tr className="h-4 bg-[#030304] pointer-events-none" key={`${bet.id}_spacer`}>
                          <td colSpan={7} className="p-0 h-4 bg-[#030304] border-t border-b border-[#030304]"></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Dynamic Cards styled as Game Result row */}
            <div className="md:hidden flex flex-col gap-4" id="mobile-bets-cards-list">
              {currentBets.map((bet: any) => {
                const betDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[0] : bet.betTime || '');
                const betTime = bet.createdAt ? new Date(bet.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (bet.betTime?.includes(' ') ? bet.betTime.split(' ')[1] : bet.betTime || '');
                const winAmount = bet.status === 'win' ? Math.floor(bet.amount * bet.dividend) : (bet.status === 'lose' ? bet.amount : 0);
                const amountColor = bet.status === 'win' ? 'text-emerald-400' : (bet.status === 'lose' ? 'text-red-500' : 'text-gray-300');
                const displaySign = bet.status === 'win' ? '+' : (bet.status === 'lose' ? '-' : '');
                
                const hasFolders = bet.folders && bet.folders.length > 0;
                const items = hasFolders 
                  ? [...bet.folders].sort((a: any, b: any) => {
                      const getPriority = (x: any) => {
                        const m = x.marketType || '';
                        if (m === 'handicap') return 1;
                        if (m === 'overUnder' || m === 'underOver') return 3;
                        return 2;
                      };
                      return getPriority(a) - getPriority(b);
                    })
                  : [bet];

                return (
                  <div key={bet.id} className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-4 text-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-mono text-[11px]">{betDate} {betTime}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded font-black border text-[10px] ${
                          bet.status === 'win' ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' :
                          bet.status === 'lose' ? 'border-red-900 bg-red-950/40 text-red-500' :
                          'border-neutral-800 bg-neutral-900 text-gray-500'
                        }`}>
                          {bet.status === 'win' ? '적중' : bet.status === 'lose' ? '미적중' : '대기중'}
                        </span>
                        <button 
                          onClick={() => handleDeleteBet(bet)} 
                          className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 mt-1">
                      {items.map((f: any, idx: number) => {
                        const layout = getBetSelectionLayout(f);
                        return (
                          <div key={idx} className="border-b border-neutral-800/20 last:border-0 pb-3.5 last:pb-0 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white text-[13px]">{f.game}</span>
                              <span className="text-amber-500 font-black text-xs text-right">
                                {renderSingleFolderScore(f, bet.status === 'pending')}
                              </span>
                            </div>

                            <div className="flex justify-between items-center bg-[#0b0c10] p-1 rounded border border-neutral-800/60 gap-0.5">
                              <div className={`flex flex-col p-1 rounded border transition w-[40%] text-[10px] items-center truncate ${
                                layout.selectedSide === 'home' 
                                  ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                  : 'bg-transparent border-transparent'
                              }`}>
                                <span className={`font-bold truncate w-full text-center ${layout.selectedSide === 'home' ? 'text-amber-400' : 'text-gray-400'}`}>{layout.homeName}</span>
                                <span className="text-amber-500 font-bold text-[9px]">{layout.homeOdds}</span>
                              </div>

                              <span className="text-gray-500 font-bold text-[9px] uppercase tracking-tighter whitespace-nowrap px-0.5">{layout.midStandard}</span>

                              <div className={`flex flex-col p-1 rounded border transition w-[40%] items-center text-[10px] truncate ${
                                layout.selectedSide === 'away' 
                                  ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                  : 'bg-transparent border-transparent'
                              }`}>
                                <span className={`font-bold truncate w-full text-center ${layout.selectedSide === 'away' ? 'text-amber-400' : 'text-gray-400'}`}>{layout.awayName}</span>
                                <span className="text-amber-500 font-bold text-[9px]">{layout.awayOdds}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Consolidated mobile row details */}
                    <div className="mt-1 pt-2 border-t border-neutral-800/40 text-neutral-400 grid grid-cols-3 text-center text-[10px]">
                      <div>배팅금: <span className="text-gray-200 font-bold font-mono">{bet.amount.toLocaleString()}원</span></div>
                      <div>배당률: <span className="text-amber-500 font-bold font-mono">x{parseFloat(bet.dividend).toFixed(2)}</span></div>
                      <div className={amountColor}>
                        {bet.status === 'win' ? '적중금:' : bet.status === 'lose' ? '손실금:' : '예상적중금:'}{' '}
                        <span className="font-bold font-mono">
                          {bet.status !== 'pending' ? `${displaySign}${winAmount.toLocaleString()}원` : `${Math.floor(bet.amount * bet.dividend).toLocaleString()}원`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Beautiful Pagination Control matching Game Result */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 bg-neutral-950/20 py-4 rounded-xl border border-neutral-800/40" id="bet-history-pagination">
                <span className="text-[11px] font-mono text-gray-400">
                  전체 {filteredBets.length}개 중 {indexOfFirstItem + 1}~{Math.min(indexOfLastItem, filteredBets.length)}개 표시 (페이지 {currentPage} / {totalPages})
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-800 bg-neutral-900 text-gray-400 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap"
                  >
                    이전
                  </button>

                  {/* Numeric page buttons */}
                  {(() => {
                    const pages = [];
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    const adjustedStartPage = Math.max(1, endPage - 4);
                    
                    for (let i = adjustedStartPage; i <= endPage; i++) {
                      if (i >= 1 && i <= totalPages) {
                        pages.push(i);
                      }
                    }
                    
                    return pages.map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer border ${
                          currentPage === p
                            ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black'
                            : 'bg-neutral-900 text-gray-400 border-neutral-800/80 hover:bg-neutral-800'
                        }`}
                      >
                        {p}
                      </button>
                    ));
                  })()}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-800 bg-[#0a0c10] text-gray-400 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
