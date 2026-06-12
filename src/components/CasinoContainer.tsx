import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trophy, FileText, Info, RefreshCw, Clock, AlertCircle, Coins, Flame } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface TGameStatistics {
  total_round_number: number;
}

// Removed TResultItem

interface CasinoContainerProps {
  currentUserData: any;
  userBalance: number;
  setUserBalance: React.Dispatch<React.SetStateAction<number>>;
  setUserPoints?: React.Dispatch<React.SetStateAction<number>>;
  betCloseOffsets: Record<string, number>;
  updateBetCloseOffset: (gameKey: string, newValue: number) => Promise<void>;
  isAdmin: boolean;
}

const BACCARAT_OPTIONS = [
];

export default function CasinoContainer({
  currentUserData,
  userBalance,
  setUserBalance,
  setUserPoints,
  betCloseOffsets,
  updateBetCloseOffset,
  isAdmin
}: CasinoContainerProps) {
  // Real-time API States
  // Removed baccarat
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Video feed latency compensation state
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Keep nowTime updated with clock precision
  useEffect(() => {
    const t = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Betting States
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10000);
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'table' | 'grid'>('table');

  // In-session settled bets memory cache to guarantee no duplicative settling 
  const settledRoundsRef = useRef<Set<string>>(new Set());

  // Handle betting action
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

  // Calculate dynamic live win percentages for visual baccarat felt overlay
  const { pWinPct, bWinPct, tWinPct } = React.useMemo(() => {
    return { pWinPct: 45, bWinPct: 45, tWinPct: 10 };
  }, []);

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
    </div>
  );
}
