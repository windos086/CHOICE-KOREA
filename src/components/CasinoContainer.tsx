import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trophy, FileText, Info, RefreshCw, Clock, AlertCircle, Coins, Flame } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface TGameStatistics {
  total_round_number: number;
  player_wins: number;
  banker_wins: number;
  tie_wins: number;
  banker_pair_wins: number;
  player_pair_wins: number;
}

interface TResultItem {
  round_number: number;
  outcome: string;
  win_value: number;
  player: Record<string, any>;
  banker: Record<string, any>;
  player_pair: boolean;
  banker_pair: boolean;
  create_date_time: string | null;
}

interface CasinoContainerProps {
  currentUserData: any;
  userBalance: number;
  setUserBalance: React.Dispatch<React.SetStateAction<number>>;
  setUserPoints?: React.Dispatch<React.SetStateAction<number>>;
  betCloseOffsets: Record<string, number>;
  updateBetCloseOffset: (gameKey: string, newValue: number) => Promise<void>;
  betIntervals: Record<string, number>;
  updateBetInterval: (gameKey: string, newValue: number) => Promise<void>;
  isAdmin: boolean;
}

const BACCARAT_OPTIONS = [
  { id: 'PLAYER', label: 'PLAYER (플레이어)', dividend: 2.00, desc: '플레이어 승리', colorClass: 'border-blue-900/60 text-blue-400 hover:border-blue-500/80 hover:bg-blue-950/20 bg-blue-950/10' },
  { id: 'TIE', label: 'TIE (무승부)', dividend: 8.00, desc: '양측 무승부 합산', colorClass: 'border-emerald-900/60 text-emerald-400 hover:border-emerald-500/80 hover:bg-emerald-950/20 bg-emerald-950/10' },
  { id: 'BANKER', label: 'BANKER (뱅커)', dividend: 1.95, desc: '뱅커 승리 세금 5% 제', colorClass: 'border-red-900/60 text-red-400 hover:border-red-500/80 hover:bg-red-950/20 bg-red-950/10' }
];

export default function CasinoContainer({
  currentUserData,
  userBalance,
  setUserBalance,
  setUserPoints,
  betCloseOffsets,
  updateBetCloseOffset,
  betIntervals,
  updateBetInterval,
  isAdmin
}: CasinoContainerProps) {
  // Real-time API States
  const [baccaratStats, setBaccaratStats] = useState<TGameStatistics | null>(null);
  const [baccaratResults, setBaccaratResults] = useState<TResultItem[]>([]);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Video feed latency compensation state
  const [syncDelaySeconds, setSyncDelaySeconds] = useState<number>(30); // Default 30s stream delay filter
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Keep nowTime updated with clock precision
  useEffect(() => {
    const t = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Filter baccarat results dynamically so they only "reveal" after the delay passes
  const delayedResults = React.useMemo(() => {
    return baccaratResults.filter((round) => {
      if (!round.create_date_time) return true; // Show offline fallback template immediately
      const roundTime = new Date(round.create_date_time).getTime();
      const elapsedSeconds = (nowTime - roundTime) / 1000;
      return elapsedSeconds >= syncDelaySeconds;
    });
  }, [baccaratResults, nowTime, syncDelaySeconds]);

  // Dynamically compute stats from visible delayedResults to maintain complete credibility
  const delayedStats = React.useMemo(() => {
    if (delayedResults.length === 0) return baccaratStats;
    
    let player_wins = 0;
    let banker_wins = 0;
    let tie_wins = 0;
    let player_pair_wins = 0;
    let banker_pair_wins = 0;
    
    delayedResults.forEach(r => {
      if (r.outcome === 'PLAYER') player_wins++;
      else if (r.outcome === 'BANKER') banker_wins++;
      else if (r.outcome === 'TIE') tie_wins++;
      
      if (r.player_pair) player_pair_wins++;
      if (r.banker_pair) banker_pair_wins++;
    });

    const total_round_number = delayedResults[0]?.round_number || 142;

    return {
      total_round_number,
      player_wins,
      banker_wins,
      tie_wins,
      player_pair_wins,
      banker_pair_wins
    };
  }, [delayedResults, baccaratStats]);

  // Compute if a round is currently wait-delayed to present as custom UI alert
  const pendingNotification = React.useMemo(() => {
    if (baccaratResults.length === 0 || delayedResults.length === 0) return null;
    const rawLatest = baccaratResults[0];
    const delayedLatest = delayedResults[0];
    
    if (rawLatest.round_number > delayedLatest.round_number) {
      const waitTimeSec = Math.max(0, Math.round((new Date(rawLatest.create_date_time || '').getTime() + (syncDelaySeconds * 1000) - nowTime) / 1000));
      return {
        roundNumber: rawLatest.round_number,
        outcome: rawLatest.outcome,
        waitTimeSec
      };
    }
    return null;
  }, [baccaratResults, delayedResults, syncDelaySeconds, nowTime]);

  // Betting States
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10000);
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');

  // In-session settled bets memory cache to guarantee no duplicative settling 
  const settledRoundsRef = useRef<Set<string>>(new Set());

  const fetchLiveBaccaratData = async () => {
    setIsFetchingStats(true);
    try {
      const response = await fetch('/api/game-result/baccarat');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Baccarat API Data:', data);
      if (data && data.success) {
        setBaccaratStats(data.statistics);
        if (Array.isArray(data.result)) {
          setBaccaratResults(data.result);
        }
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.warn('Gracefully handled live baccarat fetch issue, using offline sync fallback:', error);
      // Ensure the UI has fallback data so it doesn't stay empty or stuck loading
      setBaccaratStats(prev => prev || {
        total_round_number: 142,
        player_wins: 65,
        banker_wins: 68,
        tie_wins: 9,
        banker_pair_wins: 8,
        player_pair_wins: 7
      });
      setBaccaratResults(prev => prev.length > 0 ? prev : [
        {
          round_number: 142,
          outcome: 'BANKER',
          win_value: 6,
          player: {},
          banker: {},
          player_pair: false,
          banker_pair: true,
          create_date_time: new Date().toISOString()
        }
      ]);
      setLastUpdated(prev => prev || new Date());
    } finally {
      setIsFetchingStats(false);
    }
  };

  useEffect(() => {
    fetchLiveBaccaratData();
    const interval = setInterval(fetchLiveBaccaratData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Auto-settlement effect matching the delayedResults latency
  useEffect(() => {
    if (!currentUserData || !currentUserData.bets || currentUserData.bets.length === 0 || delayedResults.length === 0) return;

    const autoResolveBaccaratBets = async () => {
      let nowBalance = Number(currentUserData.balance || 0);
      let updatedBets = [...currentUserData.bets];
      let didChange = false;
      let winningAlerts: string[] = [];

      for (let i = 0; i < updatedBets.length; i++) {
        const bet = { ...updatedBets[i] };
        
        if (bet.gameType !== 'baccarat' || bet.status !== 'pending') continue;

        const sessionKey = `${bet.id}_${bet.round}`;
        if (settledRoundsRef.current.has(sessionKey)) continue;

        // Find match in delayed results (so it only settles when the round becomes visible!)
        const matchingResult = delayedResults.find(r => r.round_number === bet.round);
        if (!matchingResult) continue;

        // Match found! Settle now
        settledRoundsRef.current.add(sessionKey);
        didChange = true;

        const outcome = matchingResult.outcome; // 'PLAYER', 'BANKER', 'TIE'
        const isPlayerPair = matchingResult.player_pair;
        const isBankerPair = matchingResult.banker_pair;

        let status: 'win' | 'lose' = 'lose';
        let settleDividend = parseFloat(bet.dividend);
        let rollResultText = '';

        if (bet.optionId === 'PLAYER') {
          rollResultText = `플레이어 승리 [점수: ${matchingResult.win_value || 'N/A'}]`;
          if (outcome === 'PLAYER') {
            status = 'win';
          } else if (outcome === 'TIE') {
            status = 'win';
            settleDividend = 1.0;
            rollResultText = '타이 발생 (적특 반환됨)';
          }
        } else if (bet.optionId === 'BANKER') {
          rollResultText = `뱅커 승리 [점수: ${matchingResult.win_value || 'N/A'}]`;
          if (outcome === 'BANKER') {
            status = 'win';
          } else if (outcome === 'TIE') {
            status = 'win';
            settleDividend = 1.0;
            rollResultText = '타이 발생 (적특 반환됨)';
          }
        } else if (bet.optionId === 'TIE') {
          rollResultText = outcome === 'TIE' ? '타이 무승부' : '타이 미출현';
          if (outcome === 'TIE') {
            status = 'win';
          }
        } else if (bet.optionId === 'PLAYER_PAIR') {
          rollResultText = isPlayerPair ? '플레이어 페어 출현' : '플레이어 페어 미출현';
          if (isPlayerPair) {
            status = 'win';
          }
        } else if (bet.optionId === 'BANKER_PAIR') {
          rollResultText = isBankerPair ? '뱅커 페어 출현' : '뱅커 페어 미출현';
          if (isBankerPair) {
            status = 'win';
          }
        }

        const payout = status === 'win' ? Math.floor(bet.amount * settleDividend) : 0;
        
        updatedBets[i] = {
          ...bet,
          status: status,
          rollResult: rollResultText,
          payout: payout,
          settledAt: Date.now()
        };

        if (status === 'win') {
          nowBalance += payout;
          if (settleDividend > 1.0) {
            winningAlerts.push(`🎉 [실시간 바카라 #${bet.round}회차] ${bet.option} 적중! +${payout.toLocaleString()}원 당첨금이 지급되었습니다.`);
          } else {
            winningAlerts.push(`ℹ️ [실시간 바카라 #${bet.round}회차] ${bet.option} 타이 적특 무효! 배팅 원금 ${payout.toLocaleString()}원이 반환되었습니다.`);
          }
        }
      }

      if (didChange) {
        setUserBalance(nowBalance);
        
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ 
              ...curObj, 
              balance: nowBalance,
              bets: updatedBets
            }));
          } catch (err) {
            console.error(err);
          }
        }

        try {
          const userDocId = currentUserData?.id || currentUserData?.username;
          if (userDocId) {
            await updateDoc(doc(db, 'users', userDocId), {
              balance: nowBalance,
              bets: updatedBets
            });
          }
        } catch (e) {
          console.error("Failed to commit settled baccarat bet: ", e);
        }

        winningAlerts.forEach(msg => {
          alert(msg);
        });
      }
    };

    autoResolveBaccaratBets();
  }, [delayedResults, currentUserData, setUserBalance]);

  // Handle betting action
  const getBaccaratSecondsRemaining = () => {
    const intervalInSeconds = betIntervals['baccaratA'] || 30;
    const elapsed = nowTime % (intervalInSeconds * 1000);
    const secondsElapsed = Math.floor(elapsed / 1000);
    const rawSecondsRemaining = intervalInSeconds - secondsElapsed;
    const betCloseOffset = betCloseOffsets['baccaratA'] || 0;
    return rawSecondsRemaining - 5 + betCloseOffset;
  };
  
  const baccaratSecondsLeft = getBaccaratSecondsRemaining();

  const handlePlaceBaccaratBet = async () => {
    if (getBaccaratSecondsRemaining() <= 0) {
      alert('배팅이 마감되었습니다.');
      return;
    }
    if (!currentUserData) {
      alert('로그인 정보가 올바르지 않습니다.');
      return;
    }
    if (!selectedOptionId) {
      alert('배팅할 옵션을 선택해주세요.');
      return;
    }
    if (betAmount < 5000) {
      alert('최소 배팅 금액은 5,000원입니다.');
      return;
    }
    if (betAmount > userBalance) {
      alert('보유머니가 부족합니다. 충전 후 이용해 주세요.');
      return;
    }
    if (betAmount > 2000000) {
      alert('최대 배팅 가능 금액은 2,000,000원입니다.');
      return;
    }

    // Try to get the latest round number from stats, fall back to results, then hardcoded default.
    const latestFinishedRound = (delayedResults[0]?.round_number || baccaratStats?.total_round_number || 142);
    const activeRound = latestFinishedRound + 1;

    const optionObj = BACCARAT_OPTIONS.find(o => o.id === selectedOptionId);
    if (!optionObj) return;

    if (!confirm(`정말 바카라 [${activeRound}회차]에 배팅을 진행하시겠습니까?\n\n선택옵션: ${optionObj.label}\n배당률: x${optionObj.dividend}\n배팅금액: ${betAmount.toLocaleString()}원\n\n확정 시 취소가 불가합니다.`)) {
      return;
    }

    setIsSubmittingBet(true);
    try {
      const nextBalance = userBalance - betAmount;
      const pointsToAward = currentUserData?.isPartner ? 0 : Math.floor(betAmount * 0.03); // 3% points cashback

      setUserBalance(nextBalance);
      if (setUserPoints) {
        setUserPoints(prev => prev + pointsToAward);
      }

      // Record points reward
      let updatedPointsHistory = [...(currentUserData.pointsHistory || [])];
      if (pointsToAward > 0) {
        const rewardItem = {
          createdAt: Date.now(),
          type: 'bet_reward_baccarat',
          description: `실시간 바카라 배팅 적립 [${activeRound}회차]`,
          amount: pointsToAward,
          balanceAfter: (currentUserData.points || 0) + pointsToAward
        };
        updatedPointsHistory = [rewardItem, ...updatedPointsHistory].slice(0, 200);
      }

      const newBet = {
        id: 'bet_baccarat_' + Date.now(),
        game: `실시간 바카라 [${activeRound}회차]`,
        gameType: 'baccarat',
        group: '바카라',
        optionId: selectedOptionId,
        option: optionObj.label,
        dividend: optionObj.dividend.toFixed(2),
        amount: betAmount,
        betTime: new Date().toLocaleTimeString(),
        status: 'pending',
        rollResult: '대기 중',
        round: activeRound,
        createdAt: Date.now()
      };

      const updatedBets = [newBet, ...(currentUserData.bets || [])].slice(0, 50);

      const userDocId = currentUserData?.id || currentUserData?.username;
      if (!userDocId) {
        throw new Error("User ID mapping failed");
      }

      await updateDoc(doc(db, 'users', userDocId), {
        balance: nextBalance,
        points: (currentUserData.points || 0) + pointsToAward,
        pointsHistory: updatedPointsHistory,
        bets: updatedBets
      });

      setSelectedOptionId(null);
      alert('배팅성공 - 라이브 바카라 배팅이 정상 접수되었습니다! 게임 경기 결과 발표 후 자동 적중 정산됩니다.');
    } catch (e) {
      console.error("Failed to place baccarat bet: ", e);
      alert('배팅 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingBet(false);
    }
  };

  const handleQuickAmount = (amountToAdd: number) => {
    setBetAmount(prev => {
      const target = prev + amountToAdd;
      if (target > userBalance) return userBalance;
      return target;
    });
  };

  const handleMaxAmount = () => {
    if (userBalance > 2000000) {
      setBetAmount(2000000);
    } else {
      setBetAmount(userBalance);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  // Helper component to render a beautiful, highly realistic playing card back
  const PlayingCard = () => {
    return (
      <div className="w-9 h-13 bg-red-800 rounded-md border border-white shadow-md flex items-center justify-center shrink-0 animate-fade-in relative overflow-hidden">
        {/* Elegant pattern for card back to resemble the red design */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1px)] bg-[length:8px_8px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-red-900/30" />
      </div>
    );
  };

  // Helper component to render a luxurious casino chip
  const CasinoChip = () => (
    <div className="w-6 h-6 rounded-full border-2 border-white/20 bg-amber-500 flex items-center justify-center shadow-inner">
      <div className="w-4 h-4 rounded-full border border-amber-300 border-dashed"></div>
    </div>
  );

  // Generates 2 realistic card values matching the baccarat outcome with score verification
  const getCardsForPlayerOrBanker = (round: TResultItem | undefined, side: 'player' | 'banker') => {
    if (!round) return [];
    
    // Parse if there are real cards inside player or banker objects
    const sideData = side === 'player' ? round.player : round.banker;
    if (sideData && Array.isArray(sideData.cards)) {
      return sideData.cards.map((c: any) => ({
        val: c.value || c.val || 'A',
        suit: c.suit || '♥'
      }));
    }

    const val = round.win_value || 0;
    const suitPool: ('♥' | '♦' | '♣' | '♠')[] = ['♥', '♦', '♣', '♠'];
    const pSuit1 = suitPool[round.round_number % 4];
    const pSuit2 = suitPool[(round.round_number + 1) % 4];

    if (side === 'player') {
      if (round.outcome === 'PLAYER') {
        const firstVal = val > 4 ? 4 : Math.max(1, Math.floor(val / 2));
        const secondVal = val - firstVal;
        return [
          { val: firstVal === 0 ? '10' : firstVal.toString(), suit: pSuit1 },
          { val: secondVal === 0 ? '10' : secondVal.toString(), suit: pSuit2 }
        ];
      } else if (round.outcome === 'TIE') {
        const firstVal = val === 0 ? 10 : Math.max(1, Math.floor(val / 2));
        const secondVal = (val - firstVal + 10) % 10;
        return [
          { val: firstVal === 10 ? '10' : firstVal.toString(), suit: pSuit1 },
          { val: secondVal === 0 ? '10' : secondVal.toString(), suit: pSuit2 }
        ];
      } else {
        // PLAYER lost, give them a small/different set of cards
        const randomPoints = (val + 3) % 10;
        const firstVal = Math.max(1, Math.floor(randomPoints / 2));
        const secondVal = (randomPoints - firstVal + 10) % 10;
        return [
          { val: firstVal === 10 ? 'J' : firstVal.toString(), suit: pSuit1 },
          { val: secondVal === 0 ? 'Q' : secondVal.toString(), suit: pSuit2 }
        ];
      }
    } else {
      if (round.outcome === 'BANKER') {
        const firstVal = val > 4 ? 4 : Math.max(1, Math.floor(val / 2));
        const secondVal = val - firstVal;
        return [
          { val: firstVal === 0 ? '10' : firstVal.toString(), suit: pSuit2 },
          { val: secondVal === 0 ? '10' : secondVal.toString(), suit: pSuit1 }
        ];
      } else if (round.outcome === 'TIE') {
        const firstVal = val === 0 ? 10 : Math.max(1, Math.floor(val / 2));
        const secondVal = (val - firstVal + 10) % 10;
        return [
          { val: firstVal === 10 ? '10' : firstVal.toString(), suit: pSuit2 },
          { val: secondVal === 0 ? '10' : secondVal.toString(), suit: pSuit1 }
        ];
      } else {
        // BANKER lost
        const randomPoints = (val + 2) % 10;
        const firstVal = Math.max(1, Math.floor(randomPoints / 2));
        const secondVal = (randomPoints - firstVal + 10) % 10;
        return [
          { val: firstVal === 10 ? 'K' : firstVal.toString(), suit: pSuit2 },
          { val: secondVal === 0 ? '10' : secondVal.toString(), suit: pSuit1 }
        ];
      }
    }
  };

  const latestFinishedRound = delayedResults[0]?.round_number || 142;
  const activeRound = latestFinishedRound + 1;

  // Calculate dynamic live win percentages for visual baccarat felt overlay
  const { pWinPct, bWinPct, tWinPct } = React.useMemo(() => {
    if (!delayedStats) return { pWinPct: 45, bWinPct: 45, tWinPct: 10 };
    const totalWins = delayedStats.player_wins + delayedStats.banker_wins + delayedStats.tie_wins || 1;
    const pPct = Math.round((delayedStats.player_wins / totalWins) * 100);
    const bPct = Math.round((delayedStats.banker_wins / totalWins) * 100);
    const tPct = Math.max(0, 100 - pPct - bPct);
    return { pWinPct: pPct, bWinPct: bPct, tWinPct: tPct };
  }, [delayedStats]);

  return (
    <div className="w-full max-w-[1500px] mx-auto p-4 md:p-8 space-y-6" id="casino-lobby">
      
      {/* Premium Casino Banner */}
      <div className="bg-gradient-to-r from-red-950 via-neutral-950 to-neutral-900 border border-red-950/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl relative overflow-hidden" id="casino-header">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-650/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider flex items-center gap-3">
            <span className="w-2 h-7 bg-red-650 rounded"></span>
            CHOICE LUXURY CASINO
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium leading-relaxed">
            해외 정식 카지노 스튜디오 연동 실시간 해외식 카지노 경기를 송출합니다. 공정한 진행과 실시간 데이터 통계를 제공하며, 미니게임 스타일의 간편 퀵배팅 서비스가 지원됩니다.
          </p>
        </div>

        {/* Level Controls / Visual Tones */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
            SECURE MODULE VERSION 3.2
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="space-y-6">
          
          {/* Live Baccarat Video and Information Dashboard Content */}
          <div className="space-y-5">
              
              {/* Visual Label */}
              <div className="flex items-center justify-between bg-neutral-950 px-4 py-3 rounded-xl border border-neutral-800/80" id="live-stream-title">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-white tracking-widest uppercase">Evol Game Live Studio (실시간 바카라 A)</span>
                  {isAdmin && (
                    <div className="flex flex-col gap-1 items-center bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-neutral-500">마감 offset:</span>
                        <button onClick={() => updateBetCloseOffset('baccaratA', (betCloseOffsets['baccaratA'] || 0) - 1)} className="px-1 text-neutral-400 hover:text-white cursor-pointer">-</button>
                        <span className="font-mono text-amber-500">{betCloseOffsets['baccaratA'] || 0}초</span>
                        <button onClick={() => updateBetCloseOffset('baccaratA', (betCloseOffsets['baccaratA'] || 0) + 1)} className="px-1 text-neutral-400 hover:text-white cursor-pointer">+</button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-neutral-500">배팅 간격:</span>
                        <button onClick={() => updateBetInterval('baccaratA', Math.max(10, (betIntervals['baccaratA'] || 30) - 1))} className="px-1 text-neutral-400 hover:text-white cursor-pointer">-</button>
                        <span className="font-mono text-emerald-500">{betIntervals['baccaratA'] || 30}초</span>
                        <button onClick={() => updateBetInterval('baccaratA', (betIntervals['baccaratA'] || 30) + 1)} className="px-1 text-neutral-400 hover:text-white cursor-pointer">+</button>
                      </div>
                    </div>
                  )}
                  <span className={`text-[10px] ${baccaratSecondsLeft <= 0 ? 'bg-red-950 border-red-800 text-red-400' : 'bg-emerald-950 border-emerald-800 text-emerald-400'} border px-1.5 py-0.5 rounded font-bold animate-pulse`}>
                    {baccaratSecondsLeft <= 0 ? '배팅 마감' : `배팅 마감 ${baccaratSecondsLeft}초전`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  {lastUpdated ? `조회: ${lastUpdated.toLocaleTimeString('ko-KR')}` : '조회 대기...'}
                  <button 
                    onClick={fetchLiveBaccaratData} 
                    disabled={isFetchingStats}
                    className="p-1 hover:bg-neutral-800 rounded transition flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isFetchingStats ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Secure Player Frame wrapper */}
              <div className="w-full bg-black/40 p-3 md:p-5 rounded-2xl border border-neutral-800/80 shadow-inner" id="live-baccarat-player">
                <div className="w-[962px] h-[541.333px] mx-auto rounded-xl bg-black border border-neutral-900 shadow-2xl relative overflow-hidden">
                  <iframe 
                    src="https://minigame.evolgame.net/?gameId=oytmvb9m1zysmc44" 
                    width="100%" 
                    height="100%" 
                    scrolling="no" 
                    frameBorder="0"
                    className="border-none w-full h-full shadow-2xl block"
                    title="실시간 바카라 A 라이브"
                  />
                </div>
              </div>



              {/* Beautiful Luxury Baccarat Mini-Game Betting Panel */}
              <div className="bg-[#0b0c10] border-2 border-amber-500/20 rounded-2xl p-4 md:p-6 space-y-6 shadow-2xl relative overflow-hidden" id="baccarat-betting-console">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-505/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header of Bet board */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-905 pb-4 gap-3">
                  <div>
                    <h3 className="text-base font-black text-amber-400 tracking-wide flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                      실시간 바카라 배팅 콘솔
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                      진행 중인 경기에 베팅을 실행합니다. 아래 화면의 베팅판 영역을 직접 선택하여 신속하게 배팅할 수 있습니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2.5 bg-neutral-950 px-3.5 py-1.5 rounded-xl border border-neutral-800">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-neutral-400">보유 머니:</span>
                      <span className="text-xs font-mono font-black text-white">{userBalance.toLocaleString()}원</span>
                    </div>

                    {/* Round Sync Button Removed by User Request */}
                  </div>
                </div>

                {false ? (
                  /* Awesome 3D Virtual Casino Baccarat Felt Replica Layout (Click map) */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* 1. PLAYER ZONE - Blue */}
                      <button
                        type="button"
                        onClick={() => setSelectedOptionId('PLAYER')}
                        className={`rounded-xl p-4 transition-all duration-200 text-center flex flex-col justify-center items-center min-h-[140px] cursor-pointer w-full ${
                          selectedOptionId === 'PLAYER'
                            ? 'bg-blue-600 border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white'
                            : 'bg-blue-600 border-2 border-transparent text-white hover:bg-blue-500'
                        }`}
                      >
                        <span className="text-xl font-black italic tracking-tighter drop-shadow-lg">PLAYER (플레이어)</span>
                        <div className="mt-2 text-xs font-bold uppercase tracking-wider">배당률: x2.00</div>
                      </button>

                      {/* 2. TIE ZONE - Emerald */}
                      <button
                        type="button"
                        onClick={() => setSelectedOptionId('TIE')}
                        className={`rounded-xl p-4 transition-all duration-200 text-center flex flex-col justify-center items-center min-h-[140px] cursor-pointer w-full ${
                          selectedOptionId === 'TIE'
                            ? 'bg-emerald-600 border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.6)] text-white'
                            : 'bg-emerald-600 border-2 border-transparent text-white hover:bg-emerald-500'
                        }`}
                      >
                        <span className="text-xl font-black italic tracking-tighter drop-shadow-lg">TIE (무승부)</span>
                        <div className="mt-2 text-xs font-bold uppercase tracking-wider">배당률: x8.00</div>
                      </button>

                      {/* 3. BANKER ZONE - Red */}
                      <button
                        type="button"
                        onClick={() => setSelectedOptionId('BANKER')}
                        className={`rounded-xl p-4 transition-all duration-200 text-center flex flex-col justify-center items-center min-h-[140px] cursor-pointer w-full ${
                          selectedOptionId === 'BANKER'
                            ? 'bg-red-600 border-2 border-white shadow-[0_0_20px_rgba(239,68,68,0.6)] text-white'
                            : 'bg-red-600 border-2 border-transparent text-white hover:bg-red-500'
                        }`}
                      >
                        <span className="text-xl font-black italic tracking-tighter drop-shadow-lg">BANKER (뱅커)</span>
                        <div className="mt-2 text-xs font-bold uppercase tracking-wider">배당률: x1.95</div>
                      </button>

                    </div>
                ) : (
                  /* Original legacy options list with 5 separate options */
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {BACCARAT_OPTIONS.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (baccaratSecondsLeft > 0) setSelectedOptionId(opt.id);
                          }}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between text-left h-28 cursor-pointer transition-all duration-200 select-none ${opt.colorClass} ${
                            isSelected ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : ''
                          } ${baccaratSecondsLeft <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">BACCARAT</span>
                            <h4 className="text-xs font-black text-white">{opt.label}</h4>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] text-neutral-400 font-medium leading-none">{opt.desc}</span>
                            <span className="text-sm font-mono font-black text-amber-400 font-black">x{opt.dividend.toFixed(2)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Amount calculator and form submission */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 space-y-4">
                  
                  {/* Majestic physical casino chips selector */}
                  <div className="pt-1 pb-2 border-b border-neutral-900/60">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">
                        실시간 3D 카지노 배팅 칩 (원클릭 스마트 조절)
                      </span>
                      <span className="text-[9px] text-neutral-500">칩을 누르면 배팅금이 누적 합산됩니다</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-3">
                      {[
                        { label: '5천', value: 5000, color: 'bg-gradient-to-b from-neutral-600 to-neutral-800 border-neutral-500 shadow-neutral-900/50' },
                        { label: '1만', value: 10000, color: 'bg-gradient-to-b from-blue-700 to-blue-900 border-blue-500 shadow-blue-900/50' },
                        { label: '5만', value: 50000, color: 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-500 shadow-emerald-900/50' },
                        { label: '10만', value: 100000, color: 'bg-gradient-to-b from-red-700 to-red-900 border-red-500 shadow-red-900/50' },
                        { label: '50만', value: 500000, color: 'bg-gradient-to-b from-purple-700 to-purple-900 border-purple-500 shadow-purple-950/50' },
                        { label: '100만', value: 1000000, color: 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-500 shadow-amber-955/50' },
                        { label: '올인', value: 'max', color: 'bg-gradient-to-b from-rose-600 to-rose-800 border-rose-500 shadow-rose-950/40' }
                      ].map((chip) => {
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              if (chip.value === 'max') {
                                handleMaxAmount();
                              } else {
                                handleQuickAmount(chip.value as number);
                              }
                            }}
                            className="flex flex-col items-center group cursor-pointer"
                          >
                            <div className={`w-11 h-11 rounded-full border-4 border-dashed ${chip.color} flex items-center justify-center text-[10px] text-white font-mono font-black shadow-lg transition transform hover:-translate-y-1 hover:scale-110 active:scale-95 select-none relative`}>
                              <div className="absolute inset-1 rounded-full border border-white/5 bg-transparent" />
                              {chip.label}
                            </div>
                          </button>
                        );
                      })}
                      
                      <button
                        type="button"
                        onClick={() => setBetAmount(5000)}
                        className="py-1 px-2.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400 hover:border-rose-900/50 transition text-[10px] font-bold cursor-pointer select-none ml-2"
                      >
                        배팅금 초기화
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center animate-fade-in">
                    
                    {/* Amount Entry Input */}
                    <div className="lg:col-span-5 space-y-1.5">
                      <label className="text-[11px] text-neutral-400 font-bold block">배팅 금액 입력 (최소 5,000원)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5000"
                          step="1000"
                          value={betAmount || ''}
                          onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-neutral-905 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-black placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-bold text-left"
                          placeholder="금액을 입력하세요"
                        />
                      <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500 font-bold">KRW</span>
                    </div>
                  </div>

                  {/* Quick Addition Controls */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <label className="text-[11px] text-neutral-400 font-bold block">금액 빠른 조절</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(10000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
                      >
                        +1만
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(50000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
                      >
                        +5만
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(100000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
                      >
                        +10만
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(500000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
                      >
                        +50만
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(1000000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-white transition cursor-pointer col-span-2"
                      >
                        +100만
                      </button>
                      <button
                        type="button"
                        onClick={handleMaxAmount}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-amber-400 transition cursor-pointer"
                      >
                        최대
                      </button>
                      <button
                        type="button"
                        onClick={() => setBetAmount(5000)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 hover:bg-neutral-850 px-1.5 py-2 rounded-lg text-[10px] font-bold text-rose-450/90 transition cursor-pointer"
                      >
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* Submission triggers */}
                  <div className="lg:col-span-3 h-full flex flex-col justify-end pt-5 lg:pt-0">
                    {selectedOptionId ? (
                      <div className="mb-2 text-right">
                        <span className="text-[10px] text-zinc-400 font-bold block">배팅 예상 당첨금</span>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          {Math.floor(betAmount * (BACCARAT_OPTIONS.find(o => o.id === selectedOptionId)?.dividend || 1)).toLocaleString()}원
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2 text-right">
                        <span className="text-[10px] text-neutral-500 font-bold block">대기 중</span>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      disabled={isSubmittingBet || !selectedOptionId || baccaratSecondsLeft <= 0}
                      onClick={handlePlaceBaccaratBet}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-505 hover:to-amber-455 text-black font-black text-xs py-3 rounded-xl transition duration-200 shadow-lg cursor-pointer transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none flex items-center justify-center gap-2"
                    >
                      {isSubmittingBet ? '배팅 승인 처리 중...' : '배팅 확정하기'}
                    </button>
                  </div>

                </div>

              </div>

            </div>

              {/* Description Guidelines Accordion */}
              <div className="bg-gradient-to-b from-[#0b0c10] to-[#050608] border border-neutral-850 rounded-2xl p-5 space-y-4" id="baccarat-guide">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  바카라 A 공식 규칙 가이드
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-400 leading-relaxed font-sans">
                  <div className="space-y-2">
                    <p className="flex gap-2">
                      <span className="text-amber-500 font-bold min-w-[20px] shrink-0">1.</span>
                      <span><strong>게임 목표:</strong> 누가 9에 가장 가까운 패를 가질지를 예측하는 것입니다. 딜러에 의해 진행되며 8개 덱(총 416장)으로 실시간 발매됩니다.</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="text-amber-500 font-bold min-w-[20px] shrink-0">2.</span>
                      <span><strong>카드 가치 계산법:</strong> 에이스는 1점, 2~9는 숫자 그대로, 10과 그림 카드(J, Q, K)는 각각 0점입니다.</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="text-amber-500 font-bold min-w-[20px] shrink-0">3.</span>
                      <span><strong>합의 산정 규칙:</strong> 합산 수치가 10 이상일 시 십의 자리를 버립니다. (예: 7 과 9 = 16 이지만 바카라 점수는 6점)</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="flex gap-2">
                      <span className="text-amber-500 font-bold min-w-[20px] shrink-0">4.</span>
                      <span><strong>드로우 규칙 (내추럴):</strong> 플레이어나 뱅커가 첫 두 장에서 8 또는 9점을 받으면 추가 카드 없이 결과 처리됩니다.</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="text-amber-500 font-bold min-w-[20px] shrink-0">5.</span>
                      <span><strong>세 번째 카드 드로우:</strong> 플레이어가 6 또는 7로 스탠드하면, 뱅커는 3, 4, 5일 경우 카드를 더 받고, 6일 경우 스탠드합니다.</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="text-amber-505 font-bold min-w-[20px] shrink-0">6.</span>
                      <span><strong>무승부 처리:</strong> 플레이어와 뱅커의 점수가 완전히 같으면 무승부(TIE) 처리를 성립하며, TIE에 건 베터는 상금을 받고 일반 베팅금은 반환됩니다.</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

  );
}
