import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gamepad2, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Edit, Sparkles } from 'lucide-react';

interface AdminMinigameManagementProps {
  gameResults: any[];
  onResultsUpdated: () => void;
  currentUserData?: any;
  setCurrentUserData?: (user: any) => void;
}

export default function AdminMinigameManagement({
  gameResults,
  onResultsUpdated,
  currentUserData,
  setCurrentUserData
}: AdminMinigameManagementProps) {
  // 1. Core game variables
  const [selectedGameKey, setSelectedGameKey] = useState('speedladder1');
  const [roundNum, setRoundNum] = useState<number | ''>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minigame mode states (api, rng, manual)
  const [minigameModes, setMinigameModes] = useState<Record<string, 'api' | 'rng' | 'manual'>>({
    powerball5: 'api',
    powerladder5: 'api',
    ladder5: 'manual',
    speedladder1: 'manual',
    daridari3: 'manual',
    powerball3: 'manual'
  });
  const [isSavingModes, setIsSavingModes] = useState(false);
  const [isLoadingModes, setIsLoadingModes] = useState(false);

  // 2. Ladder form states
  const [ladderStart, setLadderStart] = useState<'좌' | '우'>('좌');
  const [ladderLines, setLadderLines] = useState<'3줄' | '4줄'>('3줄');
  const [ladderOutcome, setLadderOutcome] = useState<'홀' | '짝'>('짝');

  // 3. Powerball form states
  const [pbOddEven, setPbOddEven] = useState<'홀' | '짝'>('홀');
  const [pbUnderOver, setPbUnderOver] = useState<'언더' | '오버'>('언더');
  const [pbSize, setPbSize] = useState<'대' | '중' | '소'>('중');
  const [powerBallOe, setPowerBallOe] = useState<'홀' | '짝'>('홀');
  const [powerBallUnOver, setPowerBallUnOver] = useState<'언더' | '오버'>('언더');

  const gamesConfig = [
    { key: 'speedladder1', name: '스피드사다리(1분)', type: 'ladder' },
    { key: 'ladder5', name: '사다리(5분)', type: 'ladder' },
    { key: 'daridari3', name: '다리다리(3분)', type: 'daridari' },
    { key: 'powerladder5', name: 'N파워사다리(5분)', type: 'ladder' },
    { key: 'powerladder3min', name: 'N파워사다리(3분)', type: 'ladder' },
    { key: 'redpowerladder5', name: '레드파워사다리(5분)', type: 'ladder' },
    { key: 'powerball5', name: 'N파워볼(5분)', type: 'powerball' },
    { key: 'powerball3', name: 'N파워볼(3분)', type: 'powerball' }
  ];

  const currentGame = gamesConfig.find(g => g.key === selectedGameKey) || gamesConfig[0];

  // Auto calculate outcome for standard ladder-type games on start/line toggle
  useEffect(() => {
    if (currentGame.type === 'ladder') {
      if (ladderStart === '좌') {
        setLadderOutcome(ladderLines === '3줄' ? '짝' : '홀');
      } else {
        setLadderOutcome(ladderLines === '3줄' ? '홀' : '짝');
      }
    }
  }, [ladderStart, ladderLines, selectedGameKey]);

  // Load and Save settings for Minigame Operations Modes
  useEffect(() => {
    const loadModes = async () => {
      setIsLoadingModes(true);
      try {
        const docSnap = await getDoc(doc(db, 'appSettings', 'general'));
        if (docSnap.exists() && docSnap.data().minigameModes) {
          setMinigameModes(prev => ({
            ...prev,
            ...docSnap.data().minigameModes
          }));
        }
      } catch (e) {
        console.error("Error loading minigame modes in admin:", e);
      } finally {
        setIsLoadingModes(false);
      }
    };
    loadModes();
  }, []);

  const saveMinigameModes = async (newModes: Record<string, 'api' | 'rng' | 'manual'>) => {
    setIsSavingModes(true);
    setActionStatus({ type: '', message: '' });
    try {
      const docRef = doc(db, 'appSettings', 'general');
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      await setDoc(docRef, {
        ...existingData,
        minigameModes: newModes
      });
      setMinigameModes(newModes);
      setActionStatus({ type: 'success', message: '🎉 미니게임 운영 방식 설정이 성공적으로 저장되었습니다!' });
      onResultsUpdated();
    } catch (e: any) {
      console.error("Error saving minigame modes:", e);
      setActionStatus({ type: 'error', message: `설정 저장에 실패했습니다: ${e.message}` });
    } finally {
      setIsSavingModes(false);
    }
  };

  // Load registered minigame outcomes list from Firestore
  const loadMinigameHistory = async () => {
    setIsLoadingHistory(true);
    setActionStatus({ type: '', message: '' });
    try {
      const snap = await getDocs(collection(db, 'gameResultsTTL'));
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((res: any) => res.gameName === currentGame.name);
      
      list.sort((a, b) => b.round - a.round);
      // Keep recent 15 rounds
      setHistoryList(list.slice(0, 15));
    } catch (e: any) {
      console.error("Error loading minigame history:", e);
      setActionStatus({ type: 'error', message: `최근 회차 정보를 가져오는 데 실패했습니다: ${e.message}` });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadMinigameHistory();
  }, [selectedGameKey]);

  // Copy specific round data to the edit console
  const handleEditHistoryItem = (item: any) => {
    setRoundNum(item.round);
    if (currentGame.type === 'ladder' || currentGame.type === 'daridari') {
      setLadderStart(item.details?.start || '좌');
      setLadderLines(item.details?.lines || '3줄');
      setLadderOutcome(item.details?.outcome || '짝');
    } else if (currentGame.type === 'powerball') {
      setPbOddEven(item.details?.rolledOddEven || '홀');
      setPbUnderOver(item.details?.rolledUnderOver || '언더');
      setPbSize(item.details?.size || '중');
      setPowerBallOe(item.details?.pbOddEven || '홀');
      setPowerBallUnOver(item.details?.pbUnderOver || '언더');
    }
    
    // Smooth scroll page to form
    const formElement = document.getElementById('minigame-admin-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper evaluator used for re-settling member bets
  const evaluateSingleFolderOutcome = (folder: any, details: any) => {
    let isWinFolder = false;
    let folderOutcome = '';

    const gType = folder.gameType || '';
    if (gType === 'powerball5' || gType === 'powerball3') {
      const grp = (folder.group || '').trim();
      const opt = (folder.option || '').trim();

      if (grp === '일반볼' || grp === '일반볼홀짝' || grp === '일반볼언오버') {
        if (opt === '홀' || opt === '짝') {
          const rolled = (details.rolledOddEven || '').trim();
          isWinFolder = opt === rolled;
          folderOutcome = rolled || '대기 중';
        } else {
          const rolled = (details.rolledUnderOver || '').trim();
          isWinFolder = opt === rolled;
          folderOutcome = rolled || '대기 중';
        }
      } else if (grp === '일반볼 대중소') {
        const rolled = (details.size || '').trim();
        isWinFolder = opt === rolled;
        folderOutcome = rolled || '대기 중';
      } else if (grp === '파워볼' || grp === '파워볼홀짝' || grp === '파워볼언오버') {
        if (opt === '홀' || opt === '짝') {
          const rolled = (details.pbOddEven || '').trim();
          isWinFolder = opt === rolled;
          folderOutcome = rolled || '대기 중';
        } else {
          const rolled = (details.pbUnderOver || '').trim();
          isWinFolder = opt === rolled;
          folderOutcome = rolled || '대기 중';
        }
      }
    } else {
      const grp = (folder.group || '').trim();
      const opt = (folder.option || '').trim();

      if (grp === '출발지') {
        const rolled = (details.start || '').trim();
        isWinFolder = opt === rolled;
        folderOutcome = rolled || '대기 중';
      } else if (grp === '줄개수') {
        const rolled = (details.lines || '').trim();
        isWinFolder = opt === rolled;
        folderOutcome = rolled || '대기 중';
      } else if (grp === '최종결과') {
        const rolled = (details.outcome || '').trim();
        isWinFolder = opt === rolled;
        folderOutcome = rolled || '대기 중';
      }
    }
    return { isWinFolder, folderOutcome };
  };

  // Save the result and run real-time retro-balance re-settlement on all Users
  const handleSaveResultAndResettle = async () => {
    if (roundNum === '' || isNaN(Number(roundNum))) {
      setActionStatus({ type: 'error', message: '대상 회차 번호를 입력해 주세요.' });
      return;
    }
    const targetRound = Number(roundNum);

    setIsSubmitting(true);
    setActionStatus({ type: '', message: '' });

    try {
      // 1. Build details & result string
      let resultStr = '';
      let details: any = {};

      if (currentGame.type === 'ladder') {
        resultStr = `[출발] ${ladderStart} · [줄개수] ${ladderLines} · [결과] ${ladderOutcome}`;
        details = { start: ladderStart, lines: ladderLines, outcome: ladderOutcome };
      } else if (currentGame.type === 'daridari') {
        resultStr = `[출발] ${ladderStart} · [줄개수] ${ladderLines} · [결과] ${ladderOutcome}`;
        details = { start: ladderStart, lines: ladderLines, outcome: ladderOutcome };
      } else {
        resultStr = `[일반볼] ${pbOddEven} · ${pbUnderOver}(${pbSize}) | [파워볼] ${powerBallOe} · ${powerBallUnOver}`;
        details = {
          rolledOddEven: pbOddEven,
          rolledUnderOver: pbUnderOver,
          size: pbSize,
          pbOddEven: powerBallOe,
          pbUnderOver: powerBallUnOver
        };
      }

      // 2. Set precise target historic creation date
      const secureNow = Date.now();
      const intervalMin = selectedGameKey === 'speedladder1' ? 1 : selectedGameKey.includes('5') ? 5 : 3;
      const targetTime = new Date(secureNow);

      const docId = `${selectedGameKey}_${targetRound}`;
      const docRef = doc(db, 'gameResultsTTL', docId);

      // Save to Firebase gameResultsTTL
      await setDoc(docRef, {
        gameName: currentGame.name,
        round: targetRound,
        result: resultStr,
        details,
        createdAt: Timestamp.fromDate(targetTime)
      });

      // 3. Scan & adjust user bet folders in Firebase
      const usersSnap = await getDocs(collection(db, 'users'));
      let modifiedUsersCount = 0;
      let recalcedBetsCount = 0;

      const batch = writeBatch(db);

      for (const uDoc of usersSnap.docs) {
        const uData = uDoc.data();
        if (!uData.bets || uData.bets.length === 0) continue;

        let userBalance = Number(uData.balance || 0);
        let userPoints = Number(uData.points || 0);
        let updatedBets = [...uData.bets];
        let userModified = false;

        for (let i = 0; i < updatedBets.length; i++) {
          const bet = { ...updatedBets[i] };
          
          let targetsThisRound = false;
          if (bet.folders && bet.folders.length > 0) {
            targetsThisRound = bet.folders.some((f: any) => f.gameType === selectedGameKey && f.round === targetRound);
          } else {
            targetsThisRound = bet.gameType === selectedGameKey && bet.round === targetRound;
          }

          if (!targetsThisRound) continue;

          // Re-grade this bet!
          let newStatus = 'pending';
          let newOutcomeStr = '';

          if (bet.folders && bet.folders.length > 0) {
            const updatedFolders = bet.folders.map((f: any) => {
              if (f.gameType === selectedGameKey && f.round === targetRound) {
                const { isWinFolder, folderOutcome } = evaluateSingleFolderOutcome(f, details);
                return {
                  ...f,
                  status: isWinFolder ? 'win' : 'lose',
                  rollResult: folderOutcome
                };
              }
              return f;
            });
            const hasLose = updatedFolders.some((f: any) => f.status === 'lose'); const allWin = updatedFolders.every((f: any) => f.status === 'win'); if (hasLose) { newStatus = 'lose'; } else if (allWin) { newStatus = 'win'; } else { newStatus = 'pending'; }
            newOutcomeStr = updatedFolders.map((f: any) => `${f.option}➔[${f.rollResult}]`).join(', ');
            bet.folders = updatedFolders;
          } else {
            const { isWinFolder, folderOutcome } = evaluateSingleFolderOutcome({
              gameType: bet.gameType,
              group: bet.group,
              option: bet.option
            }, details);
            newStatus = isWinFolder ? 'win' : 'lose';
            newOutcomeStr = `${bet.group} [${folderOutcome}]`;
          }

          
          const oldStatus = bet.status;

          if (oldStatus === newStatus) {
            // Already matches, just update metadata if empty
            if (!bet.rollResult || bet.rollResult !== newOutcomeStr) {
              bet.rollResult = newOutcomeStr;
              updatedBets[i] = bet;
              userModified = true;
            }
            continue;
          }

          bet.status = newStatus;
          bet.rollResult = newOutcomeStr;
          updatedBets[i] = bet;

          const oldPayout = oldStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;
          const oldPointsReward = oldStatus === 'win' ? Math.floor(bet.amount * 0.01) : 0;
          
          const newPayout = newStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;
          const newPointsReward = newStatus === 'win' ? Math.floor(bet.amount * 0.01) : 0;

          // Backtrack balance & points differences securely
          const balanceDiff = newPayout - oldPayout;
          const pointsDiff = newPointsReward - oldPointsReward;

          userBalance += balanceDiff;
          userPoints += pointsDiff;

          userModified = true;
          recalcedBetsCount++;
        }

        if (userModified) {
          const userRef = doc(db, 'users', uDoc.id);
          batch.update(userRef, {
            balance: userBalance,
            points: userPoints,
            bets: updatedBets
          });
          modifiedUsersCount++;

          // If this is the currently logged-in user, refresh their local state too
          if (currentUserData && uDoc.id === currentUserData.id) {
            const nextLocalUserObj = {
              ...currentUserData,
              balance: userBalance,
              points: userPoints,
              bets: updatedBets
            };
            if (setCurrentUserData) {
              setCurrentUserData(nextLocalUserObj);
            }
            localStorage.setItem('currentUser', JSON.stringify(nextLocalUserObj));
          }
        }
      }

      // Execute batch updates
      if (modifiedUsersCount > 0) {
        await batch.commit();
      }

      // 4. Update parent states and show success report
      onResultsUpdated();
      await loadMinigameHistory();
      setActionStatus({
        type: 'success',
        message: `🎉 성공! ${currentGame.name} ${targetRound}회차가 완료되었습니다.\n• 결과: ${resultStr}\n• 정산된 배팅 내역: 총 ${recalcedBetsCount}건\n• 영향 받은 회원 수: 총 ${modifiedUsersCount}명 (보유머니가 실시간 재조정되었습니다.)`
      });

      // Clear round form
      setRoundNum('');
    } catch (e: any) {
      console.error("Error setting result/settling users:", e);
      setActionStatus({ type: 'error', message: `결과 등록 중 예외가 발생했습니다: ${e.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-300">
      {/* 1. Header with details alert */}
      <div className="bg-[#141822] border border-amber-500/20 rounded-lg p-5 flex items-start gap-4 shadow-lg">
        <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1.5 text-xs">
          <span className="text-[13px] font-black text-amber-500 block">실시간 미니게임 결과 제어 및 재정산 콘솔</span>
          <p className="text-gray-400 font-medium leading-relaxed">
            기존 미니게임 결과는 원격 서버 통신 불가 시 백필 방식(클라이언트 PRNG)으로 자동 생성됩니다.
            따라서 실제 미니게임 화면(iframe)의 결과와 대시보드의 경기결과가 다를 때, <strong>여기서 즉시 수동 수정</strong>할 수 있습니다.
          </p>
          <p className="text-[11px] text-red-400 font-extrabold leading-relaxed">
            ※ 수동 결과 저장 시, 해당 미니게임의 과거 모든 회원 배팅을 역추적하여 <strong>"적중 / 미적중 상태" 및 "보유 금액"을 완전히 실시간 재연산하여 재정산</strong>하므로 매우 안전하고 일관적입니다.
          </p>
        </div>
      </div>

      {/* 2. Minigame Operation Modes Config Grid */}
      <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-red-650 rounded-full"></span>
            <span className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 미니게임 운영 방식 최적화 제어판 (RNG / 수동 / API)
            </span>
          </div>
          <button
            onClick={() => saveMinigameModes(minigameModes)}
            disabled={isSavingModes}
            className="bg-red-700 hover:bg-red-600 active:bg-red-800 text-white px-4 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-55"
          >
            {isSavingModes ? <RefreshCw className="w-3" /> : <Save className="w-3.5 h-3.5" />}
            설정 저장하기
          </button>
        </div>

        <p className="text-[11px] text-gray-400 pl-0.5 leading-relaxed">
          각 미니게임의 정산 결과 생성 방식을 실시간 제어합니다.<br />
          <strong className="text-amber-500">※ 수동 결과등록</strong>으로 지정 시, 불일치나 오차가 근본적으로 차단되며, 관리자가 경기 결과를 수동으로 정산하기 전까지 회원들의 해당 회차 베팅은 <strong className="text-amber-500">"결과 대기"</strong>로 안전하게 보호됩니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {gamesConfig.map((game) => {
            const currentMode = minigameModes[game.key] || (game.key === 'powerball5' || game.key === 'powerladder5' || game.key === 'powerball3' ? 'api' : 'manual');
            const hasLiveApi = game.key === 'powerball5' || game.key === 'powerladder5' || game.key === 'powerball3';
            
            return (
              <div key={game.key} className="bg-[#12141c] border border-neutral-850 rounded-lg p-3.5 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white tracking-tight flex items-center gap-1">
                    <span className="w-1 h-3 bg-neutral-600 rounded"></span> {game.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider border ${
                    currentMode === 'api' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/40' : 
                    currentMode === 'rng' ? 'bg-blue-950/80 text-blue-400 border-blue-900/40' : 
                    'bg-amber-950/80 text-amber-500 border-amber-900/40'
                  }`}>
                    {currentMode === 'api' ? '실시간 API' : currentMode === 'rng' ? '자체 RNG' : '수동 결과등록'}
                  </span>
                </div>

                <div className="flex bg-[#0b0c10] p-1 rounded border border-neutral-800 gap-1">
                  <button
                    type="button"
                    disabled={!hasLiveApi}
                    onClick={() => setMinigameModes(prev => ({ ...prev, [game.key]: 'api' }))}
                    className={`flex-1 py-1 text-center text-[10px] rounded transition cursor-pointer font-bold ${
                      currentMode === 'api' 
                        ? 'bg-emerald-700 text-white font-extrabold shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300 disabled:opacity-20'
                    }`}
                    title={!hasLiveApi ? "이 게임은 실시간 API 결과 자동정산을 지원하지 않습니다." : "실시간 API 자동정산"}
                  >
                    실시간 API
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinigameModes(prev => ({ ...prev, [game.key]: 'rng' }))}
                    className={`flex-1 py-1 text-center text-[10px] rounded transition cursor-pointer font-bold ${
                      currentMode === 'rng' 
                        ? 'bg-blue-800/80 text-white font-extrabold shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    자체 RNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinigameModes(prev => ({ ...prev, [game.key]: 'manual' }))}
                    className={`flex-1 py-1 text-center text-[10px] rounded transition cursor-pointer font-bold ${
                      currentMode === 'manual' 
                        ? 'bg-amber-700 text-white font-extrabold shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    수동 등록
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Top Game Selection Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {gamesConfig.map((game) => (
          <button
            key={game.key}
            onClick={() => setSelectedGameKey(game.key)}
            className={`px-3 py-3 rounded-lg text-[11px] transition cursor-pointer font-bold flex flex-col items-center justify-center gap-1.5 border ${
              selectedGameKey === game.key
                ? 'bg-red-800 text-white border-red-650 shadow-[0_0_12px_rgba(185,28,28,0.2)]'
                : 'bg-neutral-950 border-neutral-800 text-gray-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-amber-500" />
            <span>{game.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="minigame-admin-form">
        {/* 3. Outcome Input Form (Form - 5 cols) */}
        <div className="lg:col-span-5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-850 pb-3">
            <span className="w-1.5 h-3.5 bg-red-600 rounded-full"></span>
            <span className="text-xs font-black text-white tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {currentGame.name} 결과 등록 및 재정산
            </span>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* Target Round Input */}
            <div className="space-y-1.5">
              <label className="text-gray-400 font-semibold block">대상 회차 번호</label>
              <div className="relative">
                <input
                  type="number"
                  value={roundNum}
                  onChange={(e) => setRoundNum(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="예: 1378"
                  className="w-full bg-[#111217] border border-neutral-800 hover:border-neutral-700 focus:border-red-600 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Configured Form Fields depending on game type */}
            {(currentGame.type === 'ladder' || currentGame.type === 'daridari') && (
              <div className="space-y-4 p-3.5 bg-neutral-900 border border-neutral-850 rounded-lg">
                <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest pl-0.5">사다리 결과 디테일 세팅</div>
                
                {/* 출발지 */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-semibold block">출발지 (Start)</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setLadderStart('좌')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderStart === '좌' ? 'bg-red-800/80 text-white border border-red-700/50' : 'text-gray-450 hover:text-white'}`}
                    >
                      좌 (Left)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLadderStart('우')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderStart === '우' ? 'bg-red-800/80 text-white border border-red-700/50' : 'text-gray-450 hover:text-white'}`}
                    >
                      우 (Right)
                    </button>
                  </div>
                </div>

                {/* 줄개수 */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-semibold block">줄 개수 (Lines)</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setLadderLines('3줄')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderLines === '3줄' ? 'bg-red-800/80 text-white border border-red-700/50' : 'text-gray-450 hover:text-white'}`}
                    >
                      3줄 (3 Lines)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLadderLines('4줄')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderLines === '4줄' ? 'bg-red-800/80 text-white border border-red-700/50' : 'text-gray-450 hover:text-white'}`}
                    >
                      4줄 (4 Lines)
                    </button>
                  </div>
                </div>

                {/* 최종 결과 */}
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-semibold block">최종 결과 (Outcome)</label>
                  {currentGame.type === 'ladder' ? (
                    <div className="w-full bg-[#111217] border border-neutral-800 rounded-lg p-2 px-3 text-white flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-semibold">자동 계산 결과:</span>
                      <span className={`text-[13px] font-black font-mono px-3 py-1 rounded bg-[#161a22] border border-neutral-800 ${ladderOutcome === '홀' ? 'text-rose-500' : 'text-sky-500'}`}>
                        {ladderOutcome}
                      </span>
                    </div>
                  ) : (
                    <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setLadderOutcome('홀')}
                        className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderOutcome === '홀' ? 'bg-rose-950 border border-rose-800 text-rose-450' : 'text-gray-450 hover:text-white'}`}
                      >
                        홀 (Odd)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLadderOutcome('짝')}
                        className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${ladderOutcome === '짝' ? 'bg-sky-950 border border-sky-800 text-sky-450' : 'text-gray-450 hover:text-white'}`}
                      >
                        짝 (Even)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentGame.type === 'powerball' && (
              <div className="space-y-4 p-3.5 bg-neutral-900 border border-neutral-850 rounded-lg">
                <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest pl-0.5">파워볼 결과 디테일 세팅</div>
                
                {/* 일반볼 홀짝 */}
                <div className="space-y-1.5">
                  <label className="text-gray-404 font-semibold block">일반볼 홀/짝</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPbOddEven('홀')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${pbOddEven === '홀' ? 'bg-rose-950/70 border border-rose-800 text-rose-400' : 'text-gray-450 hover:text-white'}`}
                    >
                      홀
                    </button>
                    <button
                      type="button"
                      onClick={() => setPbOddEven('짝')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${pbOddEven === '짝' ? 'bg-sky-950/70 border border-sky-800 text-sky-400' : 'text-gray-450 hover:text-white'}`}
                    >
                      짝
                    </button>
                  </div>
                </div>

                {/* 일반볼 언오버 */}
                <div className="space-y-1.5">
                  <label className="text-gray-404 font-semibold block">일반볼 언더/오버</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPbUnderOver('언더')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${pbUnderOver === '언더' ? 'bg-emerald-950 border border-emerald-800 text-emerald-450' : 'text-gray-450 hover:text-white'}`}
                    >
                      언더
                    </button>
                    <button
                      type="button"
                      onClick={() => setPbUnderOver('오버')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${pbUnderOver === '오버' ? 'bg-amber-955 border border-amber-800 text-amber-400' : 'text-gray-455 hover:text-white'}`}
                    >
                      오버
                    </button>
                  </div>
                </div>

                {/* 일반볼 대중소 */}
                <div className="space-y-1.5">
                  <label className="text-gray-404 font-semibold block">일반볼 대/중/소</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    {['대', '중', '소'].map((size: any) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPbSize(size)}
                        className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${pbSize === size ? 'bg-indigo-950 border border-indigo-800 text-indigo-400' : 'text-gray-455 hover:text-white'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 파워볼 홀짝 */}
                <div className="space-y-1.5">
                  <label className="text-gray-404 font-semibold block">파워볼 홀/짝</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPowerBallOe('홀')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${powerBallOe === '홀' ? 'bg-rose-950/70 border border-rose-800 text-rose-400' : 'text-gray-450 hover:text-white'}`}
                    >
                      홀
                    </button>
                    <button
                      type="button"
                      onClick={() => setPowerBallOe('짝')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${powerBallOe === '짝' ? 'bg-sky-950/70 border border-sky-800 text-sky-400' : 'text-gray-450 hover:text-white'}`}
                    >
                      짝
                    </button>
                  </div>
                </div>

                {/* 파워볼 언오버 */}
                <div className="space-y-1.5">
                  <label className="text-gray-404 font-semibold block">파워볼 언더/오버</label>
                  <div className="flex bg-[#111217] p-1 rounded-md border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPowerBallUnOver('언더')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${powerBallUnOver === '언더' ? 'bg-emerald-950 border border-emerald-800 text-emerald-455' : 'text-gray-450 hover:text-white'}`}
                    >
                      언더
                    </button>
                    <button
                      type="button"
                      onClick={() => setPowerBallUnOver('오버')}
                      className={`flex-1 py-1.5 text-center text-[11px] rounded transition cursor-pointer font-bold ${powerBallUnOver === '오버' ? 'bg-amber-955 border border-amber-800 text-amber-400' : 'text-gray-455 hover:text-white'}`}
                    >
                      오버
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Notifications */}
            {actionStatus.message && (
              <div className={`p-4 rounded-lg text-xs leading-relaxed border ${
                actionStatus.type === 'success'
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                  : 'bg-red-950/50 text-red-450 border-red-900'
              } whitespace-pre-wrap`}>
                <div className="flex gap-2">
                  {actionStatus.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                  <span>{actionStatus.message}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSaveResultAndResettle}
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-lg text-xs font-black select-none tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting
                  ? 'bg-neutral-800 text-gray-500 border border-neutral-700 pointer-events-none'
                  : 'bg-red-700 hover:bg-red-650 text-white shadow-xl hover:shadow-red-900/10'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>회원 배팅 역추적 정산 가동 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>저장 및 회원 배팅 재정산 실행</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Mini Game History Table (History - 7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
            <span className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-red-500" /> 최근 등록된 {currentGame.name} 목록
            </span>
            <button
              onClick={loadMinigameHistory}
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-xs text-gray-500">불러오는 중...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-24 border border-dashed border-neutral-850 rounded-lg">
              최근에 수동 혹은 자동으로 생성 완료 처리된 결과 목록이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-850 rounded-lg bg-black/30">
              <table className="w-full text-center text-xs text-gray-300">
                <thead className="bg-[#0b0e14] border-b border-neutral-850/80 text-gray-400 text-[10px] sm:text-[11px] font-bold">
                  <tr>
                    <th className="p-3 w-16 text-center">회차</th>
                    <th className="p-3 text-left">종합 결과 내용 (Outcome)</th>
                    <th className="p-3 w-28 text-center font-semibold">설명</th>
                    <th className="p-3 w-16 text-center">조정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850/40 font-mono text-[11px]">
                  {historyList.map((item) => {
                    const desc = item.result || '';
                    return (
                      <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                        {/* 회차 */}
                        <td className="p-3 text-center text-amber-500 font-extrabold">{item.round}회</td>
                        
                        {/* 결과 */}
                        <td className="p-3 text-left font-sans text-gray-150 font-bold">{desc}</td>
                        
                        {/* 가시적인 텍스트 뱃지 */}
                        <td className="p-3 text-center font-sans">
                          {currentGame.type === 'ladder' || currentGame.type === 'daridari' ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.details?.outcome === '홀' ? 'bg-rose-950/70 text-rose-400' : 'bg-sky-950/70 text-sky-400'}`}>
                              {item.details?.outcome} ({item.details?.start}/{item.details?.lines})
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5 max-w-[80px] mx-auto">
                              <span className="bg-neutral-800 text-gray-200 px-1 py-0.5 rounded text-[9px] font-bold">
                                일: {item.details?.rolledOddEven} · ${item.details?.rolledUnderOver}
                              </span>
                              <span className="bg-red-956 text-amber-500 px-1 py-0.5 rounded text-[9px] font-bold">
                                파: {item.details?.pbOddEven}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 수정 버튼 */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleEditHistoryItem(item)}
                            className="bg-neutral-850 hover:bg-neutral-700 text-gray-300 p-1 rounded-md transition cursor-pointer flex items-center justify-center mx-auto"
                            title="콘솔에 적용하여 수정"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
