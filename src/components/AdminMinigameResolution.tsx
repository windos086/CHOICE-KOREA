import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, db } from '../lib/firebase';
import { Save, AlertCircle, RefreshCw, Check, CheckCircle2, Gamepad2, Info } from 'lucide-react';

interface RecalcLog {
  userId: string;
  username: string;
  nickname: string;
  betId: string;
  gameName: string;
  oldStatus: string;
  newStatus: string;
  balDiff: number;
}

export default function AdminMinigameResolution() {
  const [gameType, setGameType] = useState<string>('speedladder1');
  const [round, setRound] = useState<number>(403);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [docExists, setDocExists] = useState<boolean>(false);
  
  // Details form states - Ladder
  const [ladderStart, setLadderStart] = useState<'좌' | '우'>('좌');
  const [ladderLines, setLadderLines] = useState<'3줄' | '4줄'>('4줄');
  
  // Details form states - Powerball
  const [pbGeneralOddEven, setPbGeneralOddEven] = useState<'홀' | '짝'>('홀');
  const [pbGeneralUnderOver, setPbGeneralUnderOver] = useState<'언더' | '오버'>('언더');
  const [pbGeneralSize, setPbGeneralSize] = useState<'소' | '중' | '대'>('중');
  const [pbPowerballOddEven, setPbPowerballOddEven] = useState<'홀' | '짝'>('홀');
  const [pbPowerballUnderOver, setPbPowerballUnderOver] = useState<'언더' | '오버'>('언더');

  const [logs, setLogs] = useState<RecalcLog[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const isLadder = gameType.includes('ladder') || gameType === 'daridari3';

  // Live Auto-calculated result strings
  const getCalculatedOutcome = () => {
    return (ladderStart === '좌' && ladderLines === '3줄') || (ladderStart === '우' && ladderLines === '4줄') ? '짝' : '홀';
  };

  const getLiveResultString = () => {
    if (isLadder) {
      return `[출발] ${ladderStart} · [줄] ${ladderLines} · [결과] ${getCalculatedOutcome()}`;
    } else {
      return `[일반볼] ${pbGeneralOddEven} · ${pbGeneralUnderOver}(${pbGeneralSize}) | [파워볼] ${pbPowerballOddEven} · ${pbPowerballUnderOver}`;
    }
  };

  const loadRoundResult = async () => {
    setIsLoading(true);
    setSuccessMsg('');
    setLogs([]);
    const docId = `${gameType}_${round}`;
    try {
      const docRef = doc(db, 'gameResults', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setDocExists(true);
        const data = snap.data();
        const details = data.details || {};
        if (isLadder) {
          setLadderStart(details.start || '좌');
          setLadderLines(details.lines || '4줄');
        } else {
          setPbGeneralOddEven(details.rolledOddEven || '홀');
          setPbGeneralUnderOver(details.rolledUnderOver || '언더');
          setPbGeneralSize(details.size || '중');
          setPbPowerballOddEven(details.pbOddEven || '홀');
          setPbPowerballUnderOver(details.pbUnderOver || '언더');
        }
      } else {
        setDocExists(false);
        // Default values for new round insert
        if (isLadder) {
          setLadderStart('좌');
          setLadderLines('4줄');
        } else {
          setPbGeneralOddEven('홀');
          setPbGeneralUnderOver('언더');
          setPbGeneralSize('중');
          setPbPowerballOddEven('홀');
          setPbPowerballUnderOver('언더');
        }
      }
    } catch (e) {
      console.error(e);
      alert('데이터베이스를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoundResult();
  }, [gameType, round]);

  const handleUpdateAndResettle = async () => {
    if (!window.confirm(`[${getGameLabel()}] ${round}회차 결과를 아래와 같이 정산하시겠습니까?\n\n결과: ${getLiveResultString()}\n\n※ 해당 회차에 배팅한 모든 사용자의 잔고와 포인트가 실시간 재정산(경우에 따라 복구 혹은 차감)됩니다.`)) {
      return;
    }

    setIsLoading(true);
    setLogs([]);
    setSuccessMsg('');

    const calculatedDetails = isLadder ? {
      start: ladderStart,
      lines: ladderLines,
      outcome: getCalculatedOutcome()
    } : {
      rolledOddEven: pbGeneralOddEven,
      rolledUnderOver: pbGeneralUnderOver,
      size: pbGeneralSize,
      pbOddEven: pbPowerballOddEven,
      pbUnderOver: pbPowerballUnderOver
    };

    const resultStr = getLiveResultString();
    const docId = `${gameType}_${round}`;

    try {
      // 1. Update/Write gameResults doc
      const docRef = doc(db, 'gameResults', docId);
      await setDoc(docRef, {
        gameName: getGameLabel(),
        round: round,
        result: resultStr,
        details: calculatedDetails,
        createdAt: new Date().toISOString()
      });

      // 2. Fetch all users for manual bet resettlement
      const usersSnap = await getDocs(collection(db, 'users'));
      const activeLogs: RecalcLog[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        let balance = Number(userData.balance || 0);
        let points = Number(userData.points || 0);
        let bets = userData.bets ? [...userData.bets] : [];
        let userModified = false;

        for (let i = 0; i < bets.length; i++) {
          const bet = { ...bets[i] };
          let isTargetBet = false;

          // Check if it matches this gameType and round.
          if (bet.folders && bet.folders.length > 0) {
            isTargetBet = bet.folders.some((f: any) => f.gameType === gameType && f.round === round);
          } else {
            isTargetBet = bet.gameType === gameType && bet.round === round;
          }

          if (!isTargetBet) continue;

          // Save old values to find diff
          const oldStatus = bet.status || 'pending';
          const oldPayout = oldStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;
          const oldPointsReward = oldStatus === 'win' ? Math.floor(bet.amount * 0.01) : 0;

          // Re-evaluate folders / bet outcome
          let isBetWin = false;
          let betResultStr = '';

          if (bet.folders && bet.folders.length > 0) {
            const updatedFolders = bet.folders.map((f: any) => {
              if (f.gameType === gameType && f.round === round) {
                let isWinFolder = false;
                let folderOutcome = '';

                if (isLadder) {
                  if (f.group === '출발지') {
                    isWinFolder = f.option === calculatedDetails.start;
                    folderOutcome = calculatedDetails.start;
                  } else if (f.group === '줄개수') {
                    isWinFolder = f.option === calculatedDetails.lines;
                    folderOutcome = calculatedDetails.lines;
                  } else if (f.group === '최종결과') {
                    isWinFolder = f.option === calculatedDetails.outcome;
                    folderOutcome = calculatedDetails.outcome;
                  }
                } else {
                  // Powerball
                  if (f.group === '일반볼') {
                    if (f.option === '홀' || f.option === '짝') {
                      isWinFolder = f.option === calculatedDetails.rolledOddEven;
                      folderOutcome = calculatedDetails.rolledOddEven;
                    } else {
                      isWinFolder = f.option === calculatedDetails.rolledUnderOver;
                      folderOutcome = calculatedDetails.rolledUnderOver;
                    }
                  } else if (f.group === '일반볼 대중소') {
                    isWinFolder = f.option === calculatedDetails.size;
                    folderOutcome = calculatedDetails.size;
                  } else if (f.group === '파워볼') {
                    if (f.option === '홀' || f.option === '짝') {
                      isWinFolder = f.option === calculatedDetails.pbOddEven;
                      folderOutcome = calculatedDetails.pbOddEven;
                    } else {
                      isWinFolder = f.option === calculatedDetails.pbUnderOver;
                      folderOutcome = calculatedDetails.pbUnderOver;
                    }
                  }
                }

                return {
                  ...f,
                  status: isWinFolder ? 'win' : 'lose',
                  rollResult: folderOutcome
                };
              }
              return f;
            });

            isBetWin = updatedFolders.every((f: any) => f.status === 'win');
            betResultStr = updatedFolders.map((f: any) => `${f.option}➔[${f.rollResult}]`).join(', ');
            bet.folders = updatedFolders;
          } else {
            // Legacy / Single bet fallback
            let isWin = false;
            let outcomeLabel = '';

            if (isLadder) {
              if (bet.group === '출발지') {
                isWin = bet.option === calculatedDetails.start;
                outcomeLabel = calculatedDetails.start;
              } else if (bet.group === '줄개수') {
                isWin = bet.option === calculatedDetails.lines;
                outcomeLabel = calculatedDetails.lines;
              } else if (bet.group === '최종결과') {
                isWin = bet.option === calculatedDetails.outcome;
                outcomeLabel = calculatedDetails.outcome;
              }
            } else {
              if (bet.group === '일반볼') {
                if (bet.option === '홀' || bet.option === '짝') {
                  isWin = bet.option === calculatedDetails.rolledOddEven;
                  outcomeLabel = calculatedDetails.rolledOddEven;
                } else {
                  isWin = bet.option === calculatedDetails.rolledUnderOver;
                  outcomeLabel = calculatedDetails.rolledUnderOver;
                }
              } else if (bet.group === '일반볼 대중소') {
                isWin = bet.option === calculatedDetails.size;
                outcomeLabel = calculatedDetails.size;
              } else if (bet.group === '파워볼') {
                if (bet.option === '홀' || bet.option === '짝') {
                  isWin = bet.option === calculatedDetails.pbOddEven;
                  outcomeLabel = calculatedDetails.pbOddEven;
                } else {
                  isWin = bet.option === calculatedDetails.pbUnderOver;
                  outcomeLabel = calculatedDetails.pbUnderOver;
                }
              }
            }

            isBetWin = isWin;
            betResultStr = `${bet.group} [${outcomeLabel}]`;
          }

          const newStatus = isBetWin ? 'win' : 'lose';
          const newPayout = newStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;
          const newPointsReward = newStatus === 'win' ? Math.floor(bet.amount * 0.01) : 0;

          // Apply balance adjustments
          const balDiff = newPayout - oldPayout;
          const ptsDiff = newPointsReward - oldPointsReward;

          balance += balDiff;
          points += ptsDiff;

          bet.status = newStatus;
          bet.rollResult = betResultStr;
          bets[i] = bet;
          userModified = true;

          // Add to log
          if (oldStatus !== newStatus || balDiff !== 0) {
            activeLogs.push({
              userId: userDoc.id,
              username: userData.username || 'unknown',
              nickname: userData.nickname || 'unknown',
              betId: bet.id,
              gameName: bet.game,
              oldStatus,
              newStatus,
              balDiff
            });
          }
        }

        if (userModified) {
          await updateDoc(doc(db, 'users', userDoc.id), {
            balance,
            points,
            bets
          });

          // Symlink to LocalStorage if the modified user is currently logged in
          const localCurStr = localStorage.getItem('currentUser');
          if (localCurStr) {
            try {
              const localUserObj = JSON.parse(localCurStr);
              if (localUserObj.id === userDoc.id) {
                localStorage.setItem('currentUser', JSON.stringify({
                  ...localUserObj,
                  balance,
                  points,
                  bets
                }));
                // Force dispatch custom event to sync MainPage navbar in real-time
                window.dispatchEvent(new Event('storage'));
              }
            } catch (err) {
              console.error('LocalStorage sync error:', err);
            }
          }
        }
      }

      setLogs(activeLogs);
      setSuccessMsg(`성공적으로 [${getGameLabel()}] ${round}회차 결과를 정산 수정 완료하였습니다!\n해당 회차와 연관된 총 ${activeLogs.length}건의 사용자 배팅 내역이 실시간으로 재정계 및 정산 전환되었습니다.`);
      setDocExists(true);
    } catch (e) {
      console.error(e);
      alert('정산 수정 처리 중 오류가 발생했습니다: ' + String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const getGameLabel = () => {
    const games: Record<string, string> = {
      'powerball5': 'N파워볼(5분)',
      'powerball3': 'N파워볼(3분)',
      'powerladder5': 'N파워사다리(5분)',
      'speedladder1': '스피드사다리(1분)',
      'ladder5': '사다리(5분)',
      'daridari3': '다리다리(3분)'
    };
    return games[gameType] || gameType;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/60 p-4 rounded border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-rose-500 uppercase flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4" /> 실시간 미니게임 수동 정산 및 결과 수정 관리기
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">
            특정 미니게임 회차의 결과를 수정하면, 해당 회차에 배팅한 모든 가입 회원의 <strong>보유 잔고와 포인트가 실시간 재추정 및 정합성 자동 조율 처리</strong>됩니다. (적중 시 차액 지급, 오지급 금액 자동 소급 차감)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRoundResult}
            className="flex items-center gap-1.5 bg-neutral-905 hover:bg-neutral-805 text-gray-300 border border-neutral-800 px-3 py-1 rounded text-xs leading-5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> 새로고침
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-black text-white border-b border-neutral-800 pb-2 mb-3">회차 지정</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-400 mb-1">미니게임 종류</label>
              <select
                className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-rose-600"
                value={gameType}
                onChange={(e) => {
                  setGameType(e.target.value);
                  setSuccessMsg('');
                  setLogs([]);
                }}
              >
                <option value="speedladder1">스피드사다리 (1분)</option>
                <option value="ladder5">사다리 (5분)</option>
                <option value="powerladder5">N파워사다리 (5분)</option>
                <option value="daridari3">다리다리 (3분)</option>
                <option value="powerball5">N파워볼 (5분)</option>
                <option value="powerball3">N파워볼 (3분)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-400 mb-1">회차 번호 (숫자만 입력)</label>
              <input
                type="number"
                className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-rose-600"
                value={round}
                onChange={(e) => {
                  setRound(Number(e.target.value));
                  setSuccessMsg('');
                  setLogs([]);
                }}
                min={1}
                max={1500}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/60 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-black text-gray-400">데이터베이스 존재 스택:</span>
              {docExists ? (
                <span className="text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-black">
                  이미 결과 존재 (수정 정산 모드)
                </span>
              ) : (
                <span className="text-[10px] bg-amber-955/70 text-amber-400 border border-amber-805 px-2 py-0.5 rounded font-black">
                  아직 결과 미생성 (신규 생성 모드)
                </span>
              )}
            </div>

            <h3 className="text-xs font-black text-white border-b border-neutral-800 pb-2 mb-3 mt-4">결과상세 세부 값 설정</h3>

            {isLadder ? (
              // Ladder Form details
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 mb-1">출발지</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLadderStart('좌')}
                        className={`flex-1 py-1.5 rounded text-xs font-black border transition cursor-pointer ${
                          ladderStart === '좌'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                            : 'bg-black text-gray-400 border-neutral-850 hover:text-white'
                        }`}
                      >
                        좌 (Left)
                      </button>
                      <button
                        onClick={() => setLadderStart('우')}
                        className={`flex-1 py-1.5 rounded text-xs font-black border transition cursor-pointer ${
                          ladderStart === '우'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                            : 'bg-black text-gray-400 border-neutral-850 hover:text-white'
                        }`}
                      >
                        우 (Right)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 mb-1">줄 개수</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLadderLines('3줄')}
                        className={`flex-1 py-1.5 rounded text-xs font-black border transition cursor-pointer ${
                          ladderLines === '3줄'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                            : 'bg-black text-gray-400 border-neutral-850 hover:text-white'
                        }`}
                      >
                        3줄
                      </button>
                      <button
                        onClick={() => setLadderLines('4줄')}
                        className={`flex-1 py-1.5 rounded text-xs font-black border transition cursor-pointer ${
                          ladderLines === '4줄'
                            ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                            : 'bg-black text-gray-400 border-neutral-850 hover:text-white'
                        }`}
                      >
                        4줄
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black border border-neutral-805 rounded mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold">자동 유도 획득 결과:</span>
                    <span className="text-rose-500 font-extrabold text-sm">{getCalculatedOutcome()}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    ※ 좌+3줄=짝 | 좌+4줄=홀 | 우+3줄=홀 | 우+4줄=짝
                  </p>
                </div>
              </div>
            ) : (
              // Powerball Form details
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 mb-1">일반볼 홀/짝</label>
                    <select
                      className="w-full bg-black border border-neutral-700 text-white rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                      value={pbGeneralOddEven}
                      onChange={(e) => setPbGeneralOddEven(e.target.value as any)}
                    >
                      <option value="홀">홀</option>
                      <option value="짝">짝</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 mb-1">일반볼 언/오버</label>
                    <select
                      className="w-full bg-black border border-neutral-700 text-white rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                      value={pbGeneralUnderOver}
                      onChange={(e) => setPbGeneralUnderOver(e.target.value as any)}
                    >
                      <option value="언더">언더</option>
                      <option value="오버">오버</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">일반볼 대중소</label>
                    <select
                      className="w-full bg-black border border-neutral-700 text-white rounded px-2 py-1.5 text-xs font-bold focus:outline-none"
                      value={pbGeneralSize}
                      onChange={(e) => setPbGeneralSize(e.target.value as any)}
                    >
                      <option value="소">소</option>
                      <option value="중">중</option>
                      <option value="대">대</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">파워볼 홀/짝</label>
                    <select
                      className="w-full bg-black border border-neutral-700 text-white rounded px-2 py-1.5 text-xs font-bold focus:outline-none"
                      value={pbPowerballOddEven}
                      onChange={(e) => setPbPowerballOddEven(e.target.value as any)}
                    >
                      <option value="홀">홀</option>
                      <option value="짝">짝</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">파워볼 언/오버</label>
                    <select
                      className="w-full bg-black border border-neutral-700 text-white rounded px-2 py-1.5 text-xs font-bold focus:outline-none"
                      value={pbPowerballUnderOver}
                      onChange={(e) => setPbPowerballUnderOver(e.target.value as any)}
                    >
                      <option value="언더">언더</option>
                      <option value="오버">오버</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="mt-5 pt-3 border-t border-neutral-800">
              <button
                onClick={handleUpdateAndResettle}
                disabled={isLoading}
                className={`w-full font-black text-xs py-2.5 rounded shadow cursor-pointer text-white flex items-center justify-center gap-1.5 transition ${
                  isLoading 
                    ? 'bg-neutral-800 border border-neutral-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-700 hover:bg-red-650 active:scale-98 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> 수집 및 재배분 정산 처리 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> 결과 수정 & 회원 일괄 재정산 처리 진행
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview and Execution Results Logs */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Visual Highlight card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-xs font-black text-white mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-rose-500" /> 실시간 추첨 결과 요약 레코드 프리뷰
            </h3>
            
            <div className="bg-black/80 rounded border border-neutral-800 p-4 font-mono text-xs space-y-2 mt-3">
              <div className="flex justify-between text-neutral-400 border-b border-neutral-850 pb-1.5">
                <span>게임종류 (Game ID)</span>
                <strong className="text-white">{getGameLabel()} ({gameType})</strong>
              </div>
              <div className="flex justify-between text-neutral-400 border-b border-neutral-850 pb-1.5">
                <span>대상 회차 (Round Number)</span>
                <strong className="text-yellow-400">{round} 회차</strong>
              </div>
              <div className="flex justify-between text-neutral-400 border-b border-neutral-850 pb-1.5">
                <span>추첨 결과 텍스트 (Output String)</span>
                <strong className="text-emerald-400 text-right">{getLiveResultString()}</strong>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>정산 대상 컬렉션 (Target Path)</span>
                <span className="text-pink-500">gameResults/{gameType}_{round}</span>
              </div>
            </div>
          </div>

          {/* Success notifications and execution details */}
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-850 rounded-lg p-4 flex gap-3 text-xs text-emerald-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <div>
                <h4 className="font-black mb-1">성공적으로 조치 완료되었습니다!</h4>
                <p className="leading-5 whitespace-pre-line">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Recalculation detailed table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex-1 flex flex-col min-h-[250px]">
            <h3 className="text-xs font-black text-white border-b border-neutral-800 pb-2 mb-3">
              실시간 회차 정산 전환 및 차액 조율 진행로그 ({logs.length}건 변경)
            </h3>

            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center">
                  <AlertCircle className="w-8 h-8 text-neutral-700 mb-2" />
                  <p className="text-xs text-gray-500 font-bold">
                    {successMsg 
                      ? '수정 완료되었으나 해당 회차에 배팅한 회원이 없거나, 변경 전후의 적중 상태 결과가 동일하여 잔액 변동이 일어난 회원이 없습니다.' 
                      : '회차 설정 후 결과를 수정하시면 차액 재정산 로그가 실시간 이곳에 보고됩니다.'}
                  </p>
                </div>
              ) : (
                <div className="border border-neutral-800 rounded bg-black/40 overflow-x-auto text-[11px]">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-neutral-950 text-gray-400 font-black border-b border-neutral-800">
                      <tr>
                        <th className="p-2 text-center">아이디/닉네임</th>
                        <th className="p-2">배팅종류</th>
                        <th className="p-2 text-center">기존결과</th>
                        <th className="p-2 text-center">변경된결과</th>
                        <th className="p-2 text-right">잔고조율금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50 text-gray-300">
                      {logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-neutral-850/40">
                          <td className="p-2">
                            <div>{log.username}</div>
                            <div className="text-[10px] text-gray-500">({log.nickname})</div>
                          </td>
                          <td className="p-2 text-[10px] text-gray-400">
                            {log.gameName}
                          </td>
                          <td className="p-2 text-center font-bold">
                            <span className={log.oldStatus === 'win' ? 'text-emerald-500' : log.oldStatus === 'lose' ? 'text-rose-500' : 'text-amber-500'}>
                              {log.oldStatus === 'win' ? '적중' : log.oldStatus === 'lose' ? '낙첨' : '대기'}
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold">
                            <span className={log.newStatus === 'win' ? 'text-emerald-400' : 'text-rose-400'}>
                              {log.newStatus === 'win' ? '적중' : '낙첨'}
                            </span>
                          </td>
                          <td className={`p-2 text-right font-bold ${log.balDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {log.balDiff >= 0 ? `+${log.balDiff.toLocaleString()}원` : `${log.balDiff.toLocaleString()}원`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
