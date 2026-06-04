import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import BetHistoryView from './components/BetHistoryView';
import AttendanceChecker from './components/AttendanceChecker';
import SportsContainer from './components/SportsContainer';
import AdminMatchRegistration from './components/AdminMatchRegistration';
import { MobileBettingList } from './components/MobileBettingList';
import { Shield, Users, Database, X, RefreshCw, Edit, Save, Trash2, Search, Check, AlertCircle, Copy, Coins, History, Lock, Settings } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface MainPageProps {
  onLogout: () => void;
}

export default function MainPage({ onLogout }: MainPageProps) {
  const [nickname, setNickname] = useState('회원');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // State for user editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingWallet, setEditingWallet] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingWithdrawalPassword, setEditingWithdrawalPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for My Page
  const [showMyPage, setShowMyPage] = useState(false);
  const [showAttendanceChecker, setShowAttendanceChecker] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [showSports, setShowSports] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [showMiniGameSubmenu, setShowMiniGameSubmenu] = useState(false);
  const miniGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resolvingBetsRef = useRef<boolean>(false);
  const [activeMiniGameTab, setActiveMiniGameTab] = useState<'powerball5' | 'powerball3' | 'ladder5' | 'daridari3' | 'powerladder5' | 'speedladder1'>('powerball5');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // States for Deposit Screen & Tether Management
  const [showDepositScreen, setShowDepositScreen] = useState(false);
  const [depositAmountUsdt, setDepositAmountUsdt] = useState('');
  const [depositWalletAddressInput, setDepositWalletAddressInput] = useState('');
  const [isSubmitDeposit, setIsSubmitDeposit] = useState(false);
  const [userDepositHistory, setUserDepositHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // States for Withdrawal (Money Exchange) Screen
  const [showWithdrawalScreen, setShowWithdrawalScreen] = useState(false);
  const [withdrawalAmountUsdt, setWithdrawalAmountUsdt] = useState('');
  const [withdrawalPasswordInput, setWithdrawalPasswordInput] = useState('');
  const [isSubmitWithdrawal, setIsSubmitWithdrawal] = useState(false);
  const [userWithdrawalHistory, setUserWithdrawalHistory] = useState<any[]>([]);
  const [isLoadingWithdrawalHistory, setIsLoadingWithdrawalHistory] = useState(false);

  // States for Game Result Screen
  const [showGameResultScreen, setShowGameResultScreen] = useState(false);
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [isLoadingGameResults, setIsLoadingGameResults] = useState(false);
  const [gameResultFilter, setGameResultFilter] = useState('전체');
  const [gameResultPage, setGameResultPage] = useState(1);

  // State for Admin Deposit & Withdrawal Requests panel
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings' | 'inquiries' | 'matches'>('users');
  const [adminDepositRequests, setAdminDepositRequests] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1537); // Default
  const [newExchangeRate, setNewExchangeRate] = useState(''); // New state
  const [isLoadingAdminDeposits, setIsLoadingAdminDeposits] = useState(false);
  const [adminWithdrawalRequests, setAdminWithdrawalRequests] = useState<any[]>([]);
  const [isLoadingAdminWithdrawals, setIsLoadingAdminWithdrawals] = useState(false);

  // States for 1:1 Support System
  const [showSupportScreen, setShowSupportScreen] = useState(false);
  const [userInquiries, setUserInquiries] = useState<any[]>([]);
  const [adminInquiries, setAdminInquiries] = useState<any[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiryType, setInquiryType] = useState<'normal' | 'account'>('normal');
  const [showCreateInquiryModal, setShowCreateInquiryModal] = useState(false);
  const [selectedInquiryDetail, setSelectedInquiryDetail] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Populate sending wallet address input from registered user data
  useEffect(() => {
    if (currentUserData?.tetherWalletAddress) {
      setDepositWalletAddressInput(currentUserData.tetherWalletAddress);
    } else if (currentUser?.tetherWalletAddress) {
      setDepositWalletAddressInput(currentUser.tetherWalletAddress);
    }
  }, [currentUserData, currentUser]);

  const openMiniGameSubmenu = () => {
    if (miniGameTimeoutRef.current) clearTimeout(miniGameTimeoutRef.current);
    setShowMiniGameSubmenu(true);
  };

  const closeMiniGameSubmenu = () => {
    miniGameTimeoutRef.current = setTimeout(() => {
      setShowMiniGameSubmenu(false);
    }, 400); 
  };

  // Dynamic user wallet balances connected to Firestore DB
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // States for Real-Time Betting System
  const [selectedOptions, setSelectedOptions] = useState<{ group: string; name: string; dividend: number; round: number; game: string; gameType: string }[]>([]);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | 'all'>('all');
  const [betAmount, setBetAmount] = useState<number>(10000);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawingTimer, setDrawingTimer] = useState<number>(0);

  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [kstClock, setKstClock] = useState<string>('');

  // Synchronize clock with secure node server on mount
  useEffect(() => {
    fetch('/api/time')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.serverTime === 'number') {
          // Difference between authoritative server milliseconds and client local millisecond clock
          const offset = data.serverTime - Date.now();
          console.log(`[Timer Sync] Clock synchronized. Server-to-Client Offset: ${offset}ms`);
          setServerTimeOffset(offset);
        }
      })
      .catch(err => {
        console.error('Failed to synchronize clock with server:', err);
      });
  }, []);

  // Update secure KST clock string every second
  useEffect(() => {
    const updateClock = () => {
      const secureNow = new Date(Date.now() + serverTimeOffset);
      const kstTime = new Date(secureNow.getTime() + (9 * 60 * 60 * 1000));
      
      const year = kstTime.getUTCFullYear();
      const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(kstTime.getUTCDate()).padStart(2, '0');
      const hours = String(kstTime.getUTCHours()).padStart(2, '0');
      const minutes = String(kstTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(kstTime.getUTCSeconds()).padStart(2, '0');
      
      setKstClock(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const clockToken = setInterval(updateClock, 1000);
    return () => clearInterval(clockToken);
  }, [serverTimeOffset]);

  const getRoundAndSecondsRemaining = (tab: string) => {
    // secureNow uses client's clock adjusted with authoritative server differential offset
    const secureNow = new Date(Date.now() + serverTimeOffset);
    
    // Convert to KST (UTC+9) in a client-timezone independent way
    const kstTimestamp = secureNow.getTime() + (9 * 60 * 60 * 1000);
    const totalSeconds = Math.floor(kstTimestamp / 1000);
    
    // Total elapsed seconds of the day in KST
    const secondsInDay = totalSeconds % 86400;
    
    // We adjust the boundaries so they match the actual iframe streams:
    // 5-minute games end exactly 25 seconds before the 5-minute mark on the iframe.
    // 3-minute games end exactly 15 seconds before the 3-minute mark on the iframe.
    // This shifts the calculation forward, decreasing the remaining time.
    const iframeOffset = tab === 'speedladder1' ? 23 : tab.includes('5') ? 25 : tab.includes('3') ? 15 : 5;
    const adjustedSeconds = secondsInDay + iframeOffset;
    
    const interval = tab.includes('5') ? 5 : tab.includes('3') ? 3 : 1;
    const intervalInSeconds = interval * 60;
    
    const currentRound = Math.floor(adjustedSeconds / intervalInSeconds) + 1;
    const secondsElapsed = adjustedSeconds % intervalInSeconds;
    const secondsRemaining = intervalInSeconds - secondsElapsed;
    
    return { currentRound, secondsRemaining };
  };

  const getSecondsRemaining = (tab: string) => {
    return getRoundAndSecondsRemaining(tab).secondsRemaining;
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return getRoundAndSecondsRemaining('powerball5').secondsRemaining;
  });

  // Ticking effect to keep secondsLeft updated every second
  useEffect(() => {
    setSecondsLeft(getSecondsRemaining(activeMiniGameTab));
    const token = setInterval(() => {
      setSecondsLeft(getSecondsRemaining(activeMiniGameTab));
    }, 1000);
    return () => clearInterval(token);
  }, [activeMiniGameTab, serverTimeOffset]);

  // Dynamic background pending-bets auto-resolver based on current game round clock
  useEffect(() => {
    if (!currentUserData || !currentUserData.bets) return;

    const pendingBets = currentUserData.bets.filter((b: any) => b.status === 'pending');
    if (pendingBets.length === 0) return;

    if (resolvingBetsRef.current) return;

    let hasAnyResolvable = false;
    for (const bet of pendingBets) {
      if (bet.folders && bet.folders.length > 0) {
        const allCompleted = bet.folders.every((f: any) => {
          const { currentRound } = getRoundAndSecondsRemaining(f.gameType);
          return f.round < currentRound;
        });
        if (allCompleted) {
          hasAnyResolvable = true;
          break;
        }
      } else {
        const { currentRound } = getRoundAndSecondsRemaining(bet.gameType);
        if (bet.round && bet.round < currentRound) {
          hasAnyResolvable = true;
          break;
        }
      }
    }

    if (!hasAnyResolvable) return;

    const runResolution = async () => {
      resolvingBetsRef.current = true;
      try {
        let nowBalance = Number(currentUserData.balance || 0);
        let nowPoints = Number(currentUserData.points || 0);
        let updatedBets = [...currentUserData.bets];
        let didChange = false;
        let winningAlerts: string[] = [];

        const rollSingleFolderUsingDetails = (folder: any, details: any) => {
          let isWinFolder = false;
          let folderOutcome = '';

          if (folder.gameType === 'powerball5' || folder.gameType === 'powerball3') {
            if (folder.group === '일반볼') {
              if (folder.option === '홀' || folder.option === '짝') {
                isWinFolder = folder.option === details.rolledOddEven;
                folderOutcome = `${details.rolledOddEven}`;
              } else {
                isWinFolder = folder.option === details.rolledUnderOver;
                folderOutcome = `${details.rolledUnderOver}`;
              }
            } else if (folder.group === '일반볼 대중소') {
              isWinFolder = folder.option === details.size;
              folderOutcome = `${details.size}`;
            } else if (folder.group === '파워볼') {
              if (folder.option === '홀' || folder.option === '짝') {
                isWinFolder = folder.option === details.pbOddEven;
                folderOutcome = `${details.pbOddEven}`;
              } else {
                isWinFolder = folder.option === details.pbUnderOver;
                folderOutcome = `${details.pbUnderOver}`;
              }
            }
          } else {
            if (folder.group === '출발지') {
              isWinFolder = folder.option === details.start;
              folderOutcome = `${details.start}`;
            } else if (folder.group === '줄개수') {
              isWinFolder = folder.option === details.lines;
              folderOutcome = `${details.lines}`;
            } else if (folder.group === '최종결과') {
              isWinFolder = folder.option === details.outcome;
              folderOutcome = `${details.outcome}`;
            }
          }
          return { isWinFolder, folderOutcome };
        };

        for (let i = 0; i < updatedBets.length; i++) {
          const bet = { ...updatedBets[i] };
          if (bet.status !== 'pending') continue;

          let isResolvable = false;
          if (bet.folders && bet.folders.length > 0) {
            isResolvable = bet.folders.every((f: any) => {
              const { currentRound } = getRoundAndSecondsRemaining(f.gameType);
              return f.round < currentRound;
            });
          } else {
            const { currentRound } = getRoundAndSecondsRemaining(bet.gameType);
            isResolvable = bet.round && bet.round < currentRound;
          }

          if (!isResolvable) continue;

          console.log("Resolving background-style:", bet.id);
          let isWin = false;
          let winningOutcome = '';

          if (bet.folders && bet.folders.length > 0) {
            const updatedFolders = [];
            for (const f of bet.folders) {
              const gameRes = await getOrInsertAuthoritativeRoundResult(f.gameType, f.round);
              const { isWinFolder, folderOutcome } = rollSingleFolderUsingDetails(f, gameRes.details || {});
              updatedFolders.push({
                ...f,
                status: isWinFolder ? 'win' : 'lose',
                rollResult: folderOutcome
              });
            }
            isWin = updatedFolders.every((f: any) => f.status === 'win');
            winningOutcome = updatedFolders.map((f: any) => `${f.option}➔[${f.rollResult}]`).join(', ');
            bet.folders = updatedFolders;
          } else {
            const gameRes = await getOrInsertAuthoritativeRoundResult(bet.gameType, bet.round || 0);
            const { isWinFolder, folderOutcome } = rollSingleFolderUsingDetails({
              gameType: bet.gameType,
              group: bet.group,
              option: bet.option
            }, gameRes.details || {});
            isWin = isWinFolder;
            winningOutcome = `${bet.group} [${folderOutcome}]`;
          }

          bet.status = isWin ? 'win' : 'lose';
          bet.rollResult = winningOutcome;
          updatedBets[i] = bet;
          didChange = true;

          if (isWin) {
            const payout = Math.floor(bet.amount * bet.dividend);
            nowBalance = nowBalance + payout;
            const ptsReward = Math.floor(bet.amount * 0.01);
            nowPoints = nowPoints + ptsReward;

            winningAlerts.push(`🎉 [배팅 적중] 축하합니다!\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n당첨 금액: +${payout.toLocaleString()}원\n포인트 적립: +${ptsReward.toLocaleString()}P`);
          } else {
            winningAlerts.push(`😢 [배팅 낙첨] 아쉽게도 낙첨되었습니다.\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n배팅 금액 ${bet.amount.toLocaleString()}원이 차감되었습니다.`);
          }
        }

        if (didChange) {
          setUserBalance(nowBalance);
          setUserPoints(nowPoints);

          const updatedUser = {
            ...currentUserData,
            balance: nowBalance,
            points: nowPoints,
            bets: updatedBets
          };
          setCurrentUserData(updatedUser);

          const savedUserStr = localStorage.getItem('currentUser');
          if (savedUserStr) {
            try {
              const curObj = JSON.parse(savedUserStr);
              localStorage.setItem('currentUser', JSON.stringify({ 
                ...curObj, 
                balance: nowBalance,
                points: nowPoints,
                bets: updatedBets
              }));
            } catch (err) {
              console.error(err);
            }
          }

          try {
            await updateDoc(doc(db, 'users', currentUserData.id), {
              balance: nowBalance,
              points: nowPoints,
              bets: updatedBets
            });
          } catch (e) {
            console.error("Failed to resolve pending bets on database: ", e);
          }

          if (winningAlerts.length > 0) {
            alert(winningAlerts.join('\n\n--------------------------\n\n'));
          }
        }
      } catch (err) {
        console.error("Error in runResolution:", err);
      } finally {
        resolvingBetsRef.current = false;
      }
    };

    runResolution();

  }, [currentUserData?.bets, secondsLeft]);

  useEffect(() => {
    if (currentUserData?.id) {
       console.log("Loading history for userId:", currentUserData.id);
       loadUserDepositHistory();
    }
  }, [currentUserData?.id]);

  const handlePlaceBet = async () => {
    if (!currentUserData) {
      alert('로그인 정보가 올바르지 않습니다.');
      return;
    }
    if (selectedOptions.length === 0) {
      alert('배팅할 옵션을 선택해주세요.');
      return;
    }
    if (betAmount <= 0) {
      alert('배팅 금액을 0원보다 크게 입력해주세요.');
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

    const totalDividendForCheck = selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1);
    const formattedTotalDividendForCheck = Math.round(totalDividendForCheck * 100) / 100;

    if (betAmount * formattedTotalDividendForCheck > 4000000) {
      alert('최대 당첨 가능 금액은 4,000,000원입니다.');
      return;
    }

    // Validate if any parlayed option is in a closed round
    for (const opt of selectedOptions) {
      const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);

      if (opt.round === currentRound && secondsRemaining <= 10) {
        alert(`선택된 [${opt.game} ${opt.round}회차]는 마감 10초 전(남은 시간: ${secondsRemaining}초)에 진입하여 배팅이 제한됩니다. 해당 폴더의 선택을 무효하고 다른 판을 선택해 주세요.`);
        return;
      }
    }

    const nextBalance = userBalance - betAmount;
    setUserBalance(nextBalance);

    const totalDividend = selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1);
    const formattedTotalDividend = Math.round(totalDividend * 100) / 100;

    const folders = selectedOptions.map(opt => {
      const gameLabel = opt.gameType === 'powerball5' ? 'N파워볼(5분)' :
                        opt.gameType === 'powerball3' ? 'N파워볼(3분)' :
                        opt.gameType === 'powerladder5' ? 'N파워사다리(5분)' :
                        opt.gameType === 'speedladder1' ? '스피드사다리(1분)' :
                        opt.gameType === 'ladder5' ? '사다리(5분)' : '다리다리(3분)';
      return {
        game: `${gameLabel} [${opt.round}회차]`,
        gameType: opt.gameType,
        group: opt.group,
        option: opt.name,
        dividend: opt.dividend,
        round: opt.round,
        status: 'pending',
        rollResult: '대기 중'
      };
    });

    const isSingle = folders.length === 1;
    const gameLabelString = isSingle ? folders[0].game : `조합배팅 (${folders.length}폴더)`;

    const newBet = {
      id: 'bet_' + Date.now(),
      game: gameLabelString,
      gameType: isSingle ? folders[0].gameType : 'combination',
      group: isSingle ? folders[0].group : '조합배팅',
      option: isSingle ? folders[0].option : folders.map(f => `${f.option}(${f.dividend})`).join(' x '),
      dividend: formattedTotalDividend,
      amount: betAmount,
      betTime: new Date().toLocaleTimeString(),
      status: 'pending',
      rollResult: '대기 중',
      round: isSingle ? folders[0].round : 0,
      folders: folders,
      createdAt: Date.now()
    };

    const updatedBets = [newBet, ...(currentUserData.bets || [])].slice(0, 50);

    setCurrentUserData(prev => ({
      ...prev,
      balance: nextBalance,
      bets: updatedBets
    }));

    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
      try {
        const curObj = JSON.parse(savedUserStr);
        localStorage.setItem('currentUser', JSON.stringify({ 
          ...curObj, 
          balance: nextBalance 
        }));
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await updateDoc(doc(db, 'users', currentUserData.id), {
        balance: nextBalance,
        bets: updatedBets
      });
    } catch (e) {
      console.error("Failed to place bet on Firestore: ", e);
    }

    setSelectedOptions([]); // Clear selected options list
    setBetAmount(10000); // Reset bet amount to default 10k
    alert('배팅성공 - 배팅이 정상 완료되었습니다. 경기 결과 추첨 후 자동 적중 처리됩니다.');
  };

  // Generate current + 5 upcoming rounds dynamically based on clock
  const getUpcomingRounds = (type: string) => {
    const { currentRound } = getRoundAndSecondsRemaining(type);
    const interval = type.includes('5') ? 5 : 3;
    
    const list = [];
    for (let i = 0; i <= 5; i++) {
      const rNum = currentRound + i;
      // Round 'rNum' drawn/ends at exactly rNum * interval minutes of the day.
      // Match Time (경기일시) represents this absolute closing limit of the round (e.g., Round 88 is 07:20 KST).
      const totalMins = rNum * interval;
      const hour = Math.floor(totalMins / 60) % 24;
      const minute = totalMins % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      list.push({
        round: rNum,
        time: timeStr,
        label: i === 0 ? `${rNum}회차 (현재)` : `${rNum}회차`
      });
    }
    return list;
  };

  const getSportsTableRows = () => {
    interface OptionItem {
      label: string;
      dividend: number;
      value: string;
      group: string;
      suffix?: string;
    }
    interface RowData {
      time: string;
      round: number;
      label: string;
      league: string;
      marketName: string;
      left: OptionItem;
      right: OptionItem;
      middle?: OptionItem | string;
    }

    const upcomingRounds = getUpcomingRounds(activeMiniGameTab);
    const rows: RowData[] = [];
    const isPowerball = activeMiniGameTab === 'powerball5' || activeMiniGameTab === 'powerball3';
    const gameLabel = activeMiniGameTab === 'powerball5' ? 'N파워볼(5분)' :
                      activeMiniGameTab === 'powerball3' ? 'N파워볼(3분)' :
                      activeMiniGameTab === 'powerladder5' ? 'N파워사다리(5분)' :
                      activeMiniGameTab === 'speedladder1' ? '스피드사다리(1분)' :
                      activeMiniGameTab === 'ladder5' ? '사다리(5분)' : '다리다리(3분)';

    upcomingRounds.forEach((rObj) => {
      // Filter by selectedRoundFilter
      if (selectedRoundFilter !== 'all' && selectedRoundFilter !== rObj.round) {
        return;
      }

      if (isPowerball) {
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '일반볼 [홀짝]',
          left: { label: '홀', dividend: 1.95, value: '홀', group: '일반볼' },
          right: { label: '짝', dividend: 1.95, value: '짝', group: '일반볼' },
          middle: 'VS'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '일반볼 [언더오버]',
          left: { label: '언더', dividend: 1.95, value: '언더', group: '일반볼', suffix: ' [72.5]' },
          right: { label: '오버', dividend: 1.95, value: '오버', group: '일반볼', suffix: ' [72.5]' },
          middle: '72.5'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '파워볼 [홀짝]',
          left: { label: '홀', dividend: 1.95, value: '홀', group: '파워볼' },
          right: { label: '짝', dividend: 1.95, value: '짝', group: '파워볼' },
          middle: 'VS'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '파워볼 [언더오버]',
          left: { label: '언더', dividend: 1.95, value: '언더', group: '파워볼', suffix: ' [4.5]' },
          right: { label: '오버', dividend: 1.95, value: '오버', group: '파워볼', suffix: ' [4.5]' },
          middle: '4.5'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '일반볼 [대/중/소]',
          left: { label: '대', dividend: 2.90, value: '대', group: '일반볼 대중소', suffix: ' [대]' },
          right: { label: '소', dividend: 2.90, value: '소', group: '일반볼 대중소', suffix: ' [소]' },
          middle: { label: '중', dividend: 2.40, value: '중', group: '일반볼 대중소', suffix: ' [중]' }
        });
      } else {
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '출발지 [좌우]',
          left: { label: '좌', dividend: 1.95, value: '좌', group: '출발지' },
          right: { label: '우', dividend: 1.95, value: '우', group: '출발지' },
          middle: 'VS'
        });
         rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '사다리 [줄개수]',
          left: { label: '3줄', dividend: 1.95, value: '3줄', group: '줄개수' },
          right: { label: '4줄', dividend: 1.95, value: '4줄', group: '줄개수' },
          middle: 'VS'
        });
         rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '최종결과 [홀짝]',
          left: { label: '홀', dividend: 1.95, value: '홀', group: '최종결과' },
          right: { label: '짝', dividend: 1.95, value: '짝', group: '최종결과' },
          middle: 'VS'
        });
      }
    });

    return rows;
  };

  const handleToggleOption = (group: string, name: string, dividend: number, round: number, game: string) => {
    const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(activeMiniGameTab);

    if (round === currentRound && secondsRemaining <= 10) {
      alert(`해당 ${round}회차는 마감 10초 전(남은 시간: ${secondsRemaining}초)이므로 배팅 선택이 불가능합니다. 다음 회차를 선택하여 배팅해 주세요.`);
      return;
    }

    // Check if exact option is already selected
    const exactExists = selectedOptions.find(opt =>
      opt.round === round &&
      opt.group === group &&
      opt.name === name &&
      opt.game === game &&
      opt.gameType === activeMiniGameTab
    );

    if (exactExists) {
      // Remove it
      setSelectedOptions(prev => prev.filter(opt =>
        !(opt.round === round &&
          opt.group === group &&
          opt.name === name &&
          opt.game === game &&
          opt.gameType === activeMiniGameTab)
      ));
    } else {
      // Check if we are selecting a different option in the same market group for the same round of the same game
      const groupExists = selectedOptions.find(opt =>
        opt.round === round &&
        opt.group === group &&
        opt.game === game &&
        opt.gameType === activeMiniGameTab
      );

      if (groupExists) {
        // Replace it
        setSelectedOptions(prev => prev.map(opt => {
          if (opt.round === round && opt.group === group && opt.game === game && opt.gameType === activeMiniGameTab) {
            return { group, name, dividend, round, game, gameType: activeMiniGameTab };
          }
          return opt;
        }));
      } else {
        // Enforce the 10-folder limit
        if (selectedOptions.length >= 10) {
          alert('배팅은 최대 10폴더까지만 조합해서 배팅할 수 있습니다.');
          return;
        }
        // Add new selection
        setSelectedOptions(prev => [...prev, { group, name, dividend, round, game, gameType: activeMiniGameTab }]);
      }
    }
  };

  // States for administrative editing
  const [editingBalance, setEditingBalance] = useState<number>(5000000);
  const [editingPoints, setEditingPoints] = useState<number>(50000);

  useEffect(() => {
    // Check currently logged in user details
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        console.log("DEBUG: Initializing with userObj:", userObj);
        setCurrentUser(userObj);
        
        // Instant sync from local storage cache for ultra-fast initial UI load!
        if (userObj.balance !== undefined) {
          setUserBalance(userObj.balance);
        } else {
          setUserBalance(5000000);
        }
        if (userObj.points !== undefined) {
          setUserPoints(userObj.points);
        } else {
          setUserPoints(50000);
        }
        if (userObj.nickname) {
          setNickname(userObj.nickname);
        }
        
        // Designate windo086 and windos086 as admin/operator
        if (userObj.username === 'windo086' || userObj.username === 'windos086') {
          setIsAdmin(true);
        }

        // Highly resilient dual-layered real-time listener.
        // First, we prioritize the unique document ID if present, falling back to username.
        const docId = userObj.id || userObj.username;
        console.log("DEBUG: Connecting to Firestore with docId:", docId);
        const userDocRef = doc(db, 'users', docId);

        let unsubscribeQuery: (() => void) | null = null;
        let isQueryListenerActive = false;

        const syncToLocalStorageAndState = (docIdToUse: string, data: any) => {
          const bal = data.balance !== undefined ? Number(data.balance) : 5000000;
          const pts = data.points !== undefined ? Number(data.points) : 50000;
          
          setUserBalance(bal);
          setUserPoints(pts);
          
          const expandedData = { id: docIdToUse, ...data, balance: bal, points: pts };
          setCurrentUserData(expandedData);
          
          const latestUserLoc = localStorage.getItem('currentUser');
          if (latestUserLoc) {
            try {
              const curParsed = JSON.parse(latestUserLoc);
              localStorage.setItem('currentUser', JSON.stringify({
                ...curParsed,
                id: docIdToUse,
                ...data,
                balance: bal,
                points: pts
              }));
            } catch (jsonErr) {
              console.error("Failed to update cache JSON:", jsonErr);
            }
          }
          
          if (data.nickname) {
            setNickname(data.nickname);
          }
          if (data.username === 'windo086' || data.username === 'windos086') {
            setIsAdmin(true);
          }
        };

        const setupQueryListener = () => {
          if (isQueryListenerActive) return;
          isQueryListenerActive = true;
          console.log("Setting up resilient query-based listener for username:", userObj.username);
          const q = query(collection(db, 'users'), where('username', '==', userObj.username));
          unsubscribeQuery = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              console.log("Query listener matched document:", docSnap.id, docSnap.data());
              syncToLocalStorageAndState(docSnap.id, docSnap.data());
            } else {
              console.warn("Resilient query listener querySnapshot is EMPTY for username:", userObj.username);
            }
          }, (queryError) => {
            console.error("Resilient query listener failed, using single fetch fallback:", queryError);
            getDoc(userDocRef).then((docSnap) => {
              if (docSnap.exists()) {
                console.log("Single fetch fallback succeeded:", docSnap.id, docSnap.data());
                syncToLocalStorageAndState(docSnap.id, docSnap.data());
              }
            }).catch(err => console.error("Single fetch fallback failed:", err));
          });
        };

        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("Direct document listener matched:", docSnap.id, docSnap.data());
            syncToLocalStorageAndState(docSnap.id, docSnap.data());
          } else {
            console.warn("User document not found directly at docId:", docId, "trying query fallback and auto-ensuring");
            setupQueryListener();
            
            // Auto-heal: Ensure user document exists in Firestore so they are registered/trackable
            console.log("Auto-ensuring user document in Firestore for:", userObj.username);
            setDoc(userDocRef, {
              joinCode: userObj.joinCode || '5882',
              username: userObj.username,
              password: userObj.password || '1234',
              nickname: userObj.nickname || '운영자',
              tetherWalletAddress: userObj.tetherWalletAddress || '',
              balance: userObj.balance !== undefined ? userObj.balance : 5000000,
              points: userObj.points !== undefined ? userObj.points : 50000,
              createdAt: new Date().toISOString()
            }).catch(err => console.error("Auto-ensuring user creation failed:", err));
          }
        }, (docError) => {
          console.warn("Direct document listener failed, trying resilient query listener:", docError);
          setupQueryListener();
        });

        return () => {
          if (typeof unsubscribeDoc === 'function') {
            unsubscribeDoc();
          }
          if (unsubscribeQuery && typeof unsubscribeQuery === 'function') {
            unsubscribeQuery();
          }
        };
      } catch (err) {
        console.error("Error setting up user listener:", err);
      }
    }
  }, []);

  // Synchronize 1:1 inquiries in real-time
  useEffect(() => {
    if (!currentUser) return;
    
    setIsLoadingInquiries(true);
    let q;
    if (isAdmin) {
      // Admin sees ALL inquiries
      q = collection(db, 'inquiries');
    } else {
      // Normal user only sees their own inquiries
      const uid = auth.currentUser?.uid || 'unknown';
      q = query(collection(db, 'inquiries'), where('userId', '==', uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort list by createdAt descending (newest first)
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      if (isAdmin) {
        setAdminInquiries(list);
      } else {
        setUserInquiries(list);
      }
      setIsLoadingInquiries(false);
    }, (error) => {
      console.error("Inquiries sync failed. Reverting to empty list: ", error);
      setIsLoadingInquiries(false);
      handleFirestoreError(error, OperationType.GET, 'inquiries');
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid, isAdmin]);

  const handleSubmitInquiry = async () => {
    if (!inquiryTitle.trim() || !inquiryContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    try {
      const uid = auth.currentUser?.uid || 'unknown';
      const uName = currentUserData?.username || currentUser?.username || 'unknown';
      const nick = currentUserData?.nickname || nickname || '회원';
      
      const payload = {
        userId: uid,
        username: uName,
        nickname: nick,
        type: inquiryType, // 'normal' (일반) or 'account' (계좌)
        title: inquiryTitle,
        content: inquiryContent,
        status: 'pending', // 'pending' (답변대기) or 'answered' (답변완료)
        createdAt: new Date().toISOString(),
        reply: '',
        repliedAt: ''
      };
      
      await addDoc(collection(db, 'inquiries'), payload);
      alert('1:1 문의가 성공적으로 등록되었습니다.');
      setInquiryTitle('');
      setInquiryContent('');
      setShowCreateInquiryModal(false);
    } catch (error) {
      console.error("Failed to submit inquiry: ", error);
      alert('문의 등록 중 오류가 발생했습니다.');
      handleFirestoreError(error, OperationType.CREATE, 'inquiries');
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!window.confirm('정말로 이 문의내역을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      alert('삭제 완료되었습니다.');
      if (selectedInquiryDetail?.id === inquiryId) {
        setSelectedInquiryDetail(null);
      }
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
      alert('삭제 중 오류가 발생했습니다.');
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${inquiryId}`);
    }
  };

  const handleDeleteAllUserInquiries = async () => {
    if (userInquiries.length === 0) {
      alert('삭제할 문의 내역이 없습니다.');
      return;
    }
    if (!window.confirm('정말로 본인의 모든 문의 내역을 삭제하시겠습니까?')) return;
    try {
      for (const item of userInquiries) {
        await deleteDoc(doc(db, 'inquiries', item.id));
      }
      alert('모두 삭제 완료되었습니다.');
      setSelectedInquiryDetail(null);
    } catch (error) {
      console.error("Failed to delete all inquiries:", error);
      alert('삭제 중 오류가 발생했습니다.');
      handleFirestoreError(error, OperationType.DELETE, 'inquiries');
    }
  };

  const handleAnswerInquiry = async (inquiryId: string, replyTextToSave: string) => {
    if (!replyTextToSave.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: 'answered',
        reply: replyTextToSave,
        repliedAt: new Date().toISOString()
      });
      alert('답변 등록이 완료되었습니다.');
      setAdminReplyText('');
      // Update local state if currently viewing detail
      if (selectedInquiryDetail && selectedInquiryDetail.id === inquiryId) {
        setSelectedInquiryDetail(prev => prev ? { ...prev, status: 'answered', reply: replyTextToSave } : null);
      }
    } catch (error) {
      console.error("Failed to save answer:", error);
      alert('답변 저장 중 오류가 발생했습니다.');
    }
  };

  // Fetch registered users for administrative action
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      console.log("DEBUG: Loaded users:", list.slice(0, 5));
      setAdminUsers(list);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load current user's deposit request history
  const loadUserDepositHistory = async () => {
    if (!currentUserData?.id) return;
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'depositRequests'),
        where('userId', '==', currentUserData.id)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setUserDepositHistory(list);
    } catch (e) {
      console.error("Error loading deposit history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load all deposit requests for Admin Management
  const loadAllDepositRequests = async () => {
    setIsLoadingAdminDeposits(true);
    try {
      const snap = await getDocs(collection(db, 'depositRequests'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort in memory by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setAdminDepositRequests(list);
    } catch (e) {
      console.error("Error fetching all deposit requests:", e);
    } finally {
      setIsLoadingAdminDeposits(false);
    }
  };

  // Load current user's withdrawal request history
  const loadUserWithdrawalHistory = async () => {
    if (!currentUserData?.id) return;
    setIsLoadingWithdrawalHistory(true);
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        where('userId', '==', currentUserData.id)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setUserWithdrawalHistory(list);
    } catch (e) {
      console.error("Error loading withdrawal history:", e);
    } finally {
      setIsLoadingWithdrawalHistory(false);
    }
  };

  // Load all withdrawal requests for Admin Management
  const loadAllWithdrawalRequests = async () => {
    setIsLoadingAdminWithdrawals(true);
    try {
      const snap = await getDocs(collection(db, 'withdrawalRequests'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort in memory by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setAdminWithdrawalRequests(list);
    } catch (e) {
      console.error("Error fetching all withdrawal requests:", e);
    } finally {
      setIsLoadingAdminWithdrawals(false);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const docRef = doc(db, 'appSettings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExchangeRate(docSnap.data().usdtToKrwRate);
      }
    } catch (e) {
      console.error("Error loading exchange rate:", e);
    }
  };

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const getOrInsertAuthoritativeRoundResult = async (gameType: string, roundNum: number) => {
    const docId = `${gameType}_${roundNum}`;
    const docRef = doc(db, 'gameResults', docId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.error("Error reading doc in getOrInsertAuthoritativeRoundResult:", err);
    }
    
    const gamesMap: Record<string, string> = {
      'powerball5': 'N파워볼(5분)',
      'powerball3': 'N파워볼(3분)',
      'powerladder5': 'N파워사다리(5분)',
      'speedladder1': '스피드사다리(1분)',
      'ladder5': '사다리(5분)',
      'daridari3': '다리다리(3분)'
    };
    const name = gamesMap[gameType] || gameType;
    
    let resultStr = '';
    let details: any = {};
    
    if (gameType === 'powerball5' || gameType === 'powerball3') {
      const rolledOddEven = Math.random() < 0.5 ? '홀' : '짝';
      const rolledUnderOver = Math.random() < 0.5 ? '언더' : '오버';
      const size = Math.random() < 0.3 ? '소' : Math.random() < 0.7 ? '중' : '대';
      
      const pbOddEven = Math.random() < 0.5 ? '홀' : '짝';
      const pbUnderOver = Math.random() < 0.5 ? '언더' : '오버';
      
      resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
      details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
    } else {
      const start = Math.random() < 0.5 ? '좌' : '우';
      const lines = Math.random() < 0.5 ? '3줄' : '4줄';
      const outcome = (start === '좌' && lines === '3줄') || (start === '우' && lines === '4줄') ? '짝' : '홀';
      
      resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
      details = { start, lines, outcome };
    }
    
    const docData = {
      gameName: name,
      round: roundNum,
      result: resultStr,
      details,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(docRef, docData);
    } catch (err) {
      console.error("Error setting doc in getOrInsertAuthoritativeRoundResult:", err);
    }
    return docData;
  };

  const autoInsertRecentGameResults = async () => {
    try {
      const snap = await getDocs(collection(db, 'gameResults'));
      const existingIds = new Set(snap.docs.map(d => d.id));

      const games = [
        { key: 'powerball5', name: 'N파워볼(5분)' },
        { key: 'powerball3', name: 'N파워볼(3분)' },
        { key: 'powerladder5', name: 'N파워사다리(5분)' },
        { key: 'ladder5', name: '사다리(5분)' },
        { key: 'daridari3', name: '다리다리(3분)' }
      ];

      let didAdd = false;

      // 1. Backfill Minigame Rounds (past 25 rounds)
      for (const g of games) {
        const { currentRound } = getRoundAndSecondsRemaining(g.key);
        const startRound = Math.max(1, currentRound - 25);
        const endRound = currentRound - 1;

        for (let r = startRound; r <= endRound; r++) {
          const docId = `${g.key}_${r}`;
          if (!existingIds.has(docId)) {
            let resultStr = '';
            let details: any = {};
            if (g.key === 'powerball5' || g.key === 'powerball3') {
              const rolledOddEven = Math.random() < 0.5 ? '홀' : '짝';
              const rolledUnderOver = Math.random() < 0.5 ? '언더' : '오버';
              const size = Math.random() < 0.3 ? '소' : Math.random() < 0.7 ? '중' : '대';
              
              const pbOddEven = Math.random() < 0.5 ? '홀' : '짝';
              const pbUnderOver = Math.random() < 0.5 ? '언더' : '오버';
              
              resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
              details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
            } else {
              const start = Math.random() < 0.5 ? '좌' : '우';
              const lines = Math.random() < 0.5 ? '3줄' : '4줄';
              const outcome = (start === '좌' && lines === '3줄') || (start === '우' && lines === '4줄') ? '짝' : '홀';
              
              resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
              details = { start, lines, outcome };
            }

            const intervalMin = g.key.includes('5') ? 5 : 3;
            // Approximate date
            const now = new Date();
            const roundTime = new Date(now.getTime() - (currentRound - r) * intervalMin * 60 * 1000);

            const docRef = doc(db, 'gameResults', docId);
            await setDoc(docRef, {
              gameName: g.name,
              round: r,
              result: resultStr,
              details,
              createdAt: roundTime.toISOString()
            });
            didAdd = true;
          }
        }
      }

      if (didAdd) {
        await loadGameResults();
      }
    } catch (e) {
      console.error("Error auto-inserting recent game results:", e);
    }
  };

  useEffect(() => {
    autoInsertRecentGameResults();
    const interval = setInterval(() => {
      autoInsertRecentGameResults();
    }, 25000);
    return () => clearInterval(interval);
  }, [serverTimeOffset]);

  const loadGameResults = async () => {
    setIsLoadingGameResults(true);
    try {
      const snap = await getDocs(collection(db, 'gameResults'));
      const minigameNames = ['N파워볼(5분)', 'N파워볼(3분)', '사다리(5분)', '다리다리(3분)', 'N파워사다리(5분)'];
      const results = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((res: any) => minigameNames.includes(res.gameName));
      results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log("Loaded game results:", results);
      setGameResults(results);
    } catch (e) {
      console.error("Error loading game results:", e);
    } finally {
      setIsLoadingGameResults(false);
    }
  };

  useEffect(() => {
    if (showGameResultScreen) {
      autoInsertRecentGameResults();
      loadGameResults();
    }
  }, [showGameResultScreen]);

  useEffect(() => {
    if (showWithdrawalScreen && currentUserData?.id) {
      loadUserWithdrawalHistory();
    }
  }, [showWithdrawalScreen, currentUserData?.id]);

  useEffect(() => {
    if (showAdminPanel) {
      loadAllUsers();
      loadAllDepositRequests();
      loadAllWithdrawalRequests();
    }
  }, [showAdminPanel]);

  const formatDateStr = (val: any) => {
    if (!val) return '-';
    let date: Date;
    if (val.toDate && typeof val.toDate === 'function') {
      date = val.toDate();
    } else if (val.seconds) {
      date = new Date(val.seconds * 1000);
    } else {
      date = new Date(val);
    }
    
    if (isNaN(date.getTime())) return '-';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleDepositSubmit = async () => {
    if (!currentUserData) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    const usdtAmt = Number(depositAmountUsdt) || 0;
    if (usdtAmt <= 0) {
      alert("신청할 테더(USDT) 금액을 입력해주세요.");
      return;
    }
    const finalAddress = (depositWalletAddressInput || currentUserData?.tetherWalletAddress || currentUser?.tetherWalletAddress || '').trim();
    if (!finalAddress) {
      alert("회원 정보에 지갑 주소가 등록되어 있지 않습니다. 고객센터에 문의하시거나 새 계정으로 가입해 주세요.");
      return;
    }

    setIsSubmitDeposit(true);
    try {
      // Use component exchangeRate state instead of hardcoded 1531
      const amountKrw = Math.floor(usdtAmt * exchangeRate);
      
      const payload = {
        userId: currentUserData.id,
        username: currentUserData.username,
        nickname: currentUserData.nickname || nickname,
        amountUsdt: usdtAmt,
        exchangeRate: exchangeRate,
        amountKrw: amountKrw,
        tetherWalletAddress: finalAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
        processedAt: null
      };

      await addDoc(collection(db, 'depositRequests'), payload);

      // Save user profile wallet automatically if not registered yet
      if (finalAddress !== (currentUserData.tetherWalletAddress || '')) {
        await updateDoc(doc(db, 'users', currentUserData.id), {
          tetherWalletAddress: finalAddress
        });
        setCurrentUserData(prev => prev ? { ...prev, tetherWalletAddress: finalAddress } : prev);
      }

      alert("테더 입금 신청이 정상적으로 접수되었습니다.\n운영자 확인 즉시 신속하게 처리됩니다.");
      setDepositAmountUsdt('');
      await loadUserDepositHistory();
    } catch (e) {
      console.error("Deposit submission failed:", e);
      alert("입금 신청에 실패하였습니다: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSubmitDeposit(false);
    }
  };

  const handleStartEdit = (user: any) => {
    setEditingUserId(user.id);
    setEditingNickname(user.nickname || '');
    setEditingWallet(user.tetherWalletAddress || '');
    setEditingPassword(user.password || '');
    setEditingWithdrawalPassword(user.withdrawalPassword || '');
    setEditingBalance(user.balance !== undefined ? user.balance : 5000000);
    setEditingPoints(user.points !== undefined ? user.points : 50000);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      const nextBal = Number(editingBalance) || 0;
      const nextPts = Number(editingPoints) || 0;
      
      const targetUser = adminUsers.find(u => u.id === userId);
      const finalPassword = editingPassword || (targetUser?.password || '');
      const finalWithdrawalPassword = editingWithdrawalPassword || (targetUser?.withdrawalPassword || '');

      await updateDoc(doc(db, 'users', userId), {
        nickname: editingNickname,
        tetherWalletAddress: editingWallet,
        password: finalPassword,
        withdrawalPassword: finalWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      });
      
      setAdminUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        nickname: editingNickname, 
        tetherWalletAddress: editingWallet,
        password: finalPassword,
        withdrawalPassword: finalWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      } : u));

      // Sync local profile state if editing self
      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        setUserPoints(nextPts);
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ 
              ...curObj, 
              balance: nextBal, 
              points: nextPts 
            }));
          } catch (err) {
            console.error(err);
          }
        }
      }
      
      setEditingUserId(null);
      alert('회원 정보가 성공적으로 수정되었습니다.');
    } catch (e) {
      alert('수정 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`정말로 회원 ID [${userId}]를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      setAdminUsers(prev => prev.filter(u => u.id !== userId));
      alert('회원이 영구 삭제되었습니다.');
    } catch (e) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleAcceptDeposit = async (requestId: string, userId: string, amountKrw: number) => {
    if (!window.confirm("정말로 해당 입금 신청을 승인처리하시겠습니까?\n회원의 보유금액이 즉시 충전 처리됩니다.")) {
      return;
    }
    try {
      // Fetch fresh balance from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const currentBal = userData?.balance !== undefined ? userData.balance : 5000000;
      const nextBal = currentBal + (amountKrw || 0);

      await updateDoc(userDocRef, {
        balance: nextBal
      });

      await updateDoc(doc(db, 'depositRequests', requestId), {
        status: 'approved',
        processedAt: new Date().toISOString()
      });
      
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: nextBal } : u));
      setAdminDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', processedAt: new Date().toISOString() } : r));

      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ ...curObj, balance: nextBal }));
          } catch (err) {
            console.error(err);
          }
        }
      }

      alert("입금 신청 승인이 성공적으로 처리되었습니다.\n회원의 시뮬레이터 잔액이 정산 처리되었습니다.");
    } catch (e) {
      console.error("Failed to approve deposit:", e);
      alert("입금 승인 처리 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleRejectDeposit = async (requestId: string) => {
    if (!window.confirm("해당 입금 신청을 거절/취소 처리하시겠습니까?")) {
      return;
    }
    try {
      await updateDoc(doc(db, 'depositRequests', requestId), {
        status: 'rejected',
        processedAt: new Date().toISOString()
      });
      setAdminDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected', processedAt: new Date().toISOString() } : r));
      alert("입금 신청이 성공적으로 거절 처리되었습니다.");
    } catch (e) {
      console.error("Failed to reject deposit:", e);
      alert("입금 거절 처리 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleWithdrawalSubmit = async () => {
    if (!currentUserData) {
      alert("로그인 세션 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }
    const usdtAmt = Number(withdrawalAmountUsdt);
    if (!withdrawalAmountUsdt || isNaN(usdtAmt) || usdtAmt <= 0) {
      alert("환전신청할 테더(USDT) 수량을 입력해주세요.");
      return;
    }
    const amountKrw = Math.floor(usdtAmt * exchangeRate);

    if (amountKrw > userBalance) {
      alert(`보유금액이 부족합니다. (신청 금액: ${amountKrw.toLocaleString()}원, 보유 금액: ${userBalance.toLocaleString()}원)`);
      return;
    }

    const walletAddress = (currentUserData.tetherWalletAddress || currentUser?.tetherWalletAddress || '').trim();
    if (!walletAddress) {
      alert("등록된 지갑 주소가 없습니다. 회원정보 수정에서 가입지갑 주소를 등록해주십시오.");
      return;
    }

    const savedPassword = String(currentUserData.withdrawalPassword || '');
    if (!withdrawalPasswordInput || String(withdrawalPasswordInput) !== savedPassword) {
      alert("출금 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!window.confirm(`입력하신 테더 수량: ${usdtAmt.toLocaleString()} USDT\n환산 금액: ${amountKrw.toLocaleString()}원\n\n지갑 주소: ${walletAddress}\n\n위 정보로 보유머니 환전신청(출금)을 진행하시겠습니까?\n신청금액은 즉시 차감 정산됩니다.`)) {
      return;
    }

    setIsSubmitWithdrawal(true);
    try {
      // 1. Deduct user's balance in DB immediately
      const nextBal = userBalance - amountKrw;
      await updateDoc(doc(db, 'users', currentUserData.id), {
        balance: nextBal
      });

      // 2. Add withdrawal request doc to DB
      const payload = {
        userId: currentUserData.id,
        username: currentUserData.username,
        nickname: currentUserData.nickname || nickname,
        amountUsdt: usdtAmt,
        exchangeRate: exchangeRate,
        amountKrw: amountKrw,
        tetherWalletAddress: walletAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
        processedAt: null
      };
      await addDoc(collection(db, 'withdrawalRequests'), payload);

      // 3. Update local states
      setUserBalance(nextBal);
      setCurrentUserData(prev => prev ? { ...prev, balance: nextBal } : prev);
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        try {
          const curObj = JSON.parse(savedUserStr);
          localStorage.setItem('currentUser', JSON.stringify({ ...curObj, balance: nextBal }));
        } catch (err) {
          console.error(err);
        }
      }
      setWithdrawalAmountUsdt('');
      setWithdrawalPasswordInput('');
      
      alert("테더 환전(출금) 신청이 정상적으로 접수되었습니다.\n운영자 확인 즉시 신속하게 처리됩니다.");
      await loadUserWithdrawalHistory();
    } catch (e) {
      console.error("Failed to submit withdrawal request:", e);
      setWithdrawalPasswordInput('');
      alert("환전 신청 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSubmitWithdrawal(false);
    }
  };

  const handleAcceptWithdrawal = async (requestId: string) => {
    if (!window.confirm("정말로 해당 출금 신청을 승인처리하시겠습니까?\n이미 회원의 보유금액은 신청 시점에 차감 처리되었습니다.")) {
      return;
    }
    try {
      await updateDoc(doc(db, 'withdrawalRequests', requestId), {
        status: 'approved',
        processedAt: new Date().toISOString()
      });

      setAdminWithdrawalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', processedAt: new Date().toISOString() } : r));

      alert("출금 신청 승인이 성공적으로 처리되었습니다.");
    } catch (e) {
      console.error("Failed to approve withdrawal:", e);
      alert("출금 승인 처리 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleRejectWithdrawal = async (requestId: string, userId: string, amountKrw: number) => {
    if (!window.confirm("해당 출금 신청을 거절/취소 처리하시겠습니까?\n거절 시 회원의 차감된 보유금액이 즉시 환불 처리됩니다.")) {
      return;
    }
    try {
      // 1. Refund
      const docRef = doc(db, 'users', userId);
      let userDocSnap = adminUsers.find(u => u.id === userId);
      let currentBal = userDocSnap?.balance !== undefined ? userDocSnap.balance : 5000000;
      let nextBal = currentBal + amountKrw;

      await updateDoc(docRef, {
        balance: nextBal
      });

      // 2. Status Update
      await updateDoc(doc(db, 'withdrawalRequests', requestId), {
        status: 'rejected',
        processedAt: new Date().toISOString()
      });

      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: nextBal } : u));
      setAdminWithdrawalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected', processedAt: new Date().toISOString() } : r));

      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ ...curObj, balance: nextBal }));
          } catch (err) {
            console.error(err);
          }
        }
      }

      alert("출금 신청이 거절 처리되었습니다.\n회원의 시뮬레이터 잔액이 즉시 복구(환불) 정산되었습니다.");
    } catch (e) {
      console.error("Failed to reject withdrawal:", e);
      alert("출금 거절 처리 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('currentUser');
    onLogout();
  };

  const sportsRows = getSportsTableRows();

  return (
    <div className="min-h-screen bg-[#030304] text-white font-sans flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-950/10 rounded-full blur-[150px] pointer-events-none z-0"></div>



      {/* Top GNB Bar */}
      <header className="bg-gradient-to-b from-[#111215] via-[#090a0c] to-[#040405] border-b border-rose-950/40 px-6 py-5 flex flex-col items-center gap-5 relative z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        {/* Decorative corner light bands */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40"></div>

        {/* Admin Menu Switch for Operators (Top Right on desktop) */}
        {isAdmin && (
          <div className="sm:absolute sm:top-6 sm:right-6 mt-1 sm:mt-0 z-30">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:to-red-700 text-white font-extrabold px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] border border-red-500/40 text-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Shield className="w-4 h-4 animate-pulse text-red-100" />
              어드민 관리자 메뉴
            </button>
          </div>
        )}

        {/* Logo */}
        <button 
          onClick={() => {
            setShowMyPage(false);
            setShowMiniGame(false);
            setShowDepositScreen(false);
            setShowWithdrawalScreen(false);
            setShowGameResultScreen(false);
            setShowBetHistory(false);
          }}
          className="text-4xl font-extrabold tracking-normal cursor-pointer relative py-2.5 px-6 group select-none transition-all duration-300"
        >
          <span className="inline-flex items-center font-sans">
            <span className="relative inline-block mr-1">
              {/* Dynamic 3D Sparkling Floating Crown */}
              <motion.div 
                animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0], scale: [1, 1.05, 0.95, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[32px] left-1/2 -ml-4 w-8 h-8 text-amber-400 group-hover:text-yellow-300 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.95)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: '16px', paddingBottom: '0px', paddingRight: '0px', paddingLeft: '0px', marginRight: '0px', marginLeft: '0px' }}>
                  {/* Highly polished crown silhouette */}
                  <path d="M5 16l1-7 3 2 3-5 3 5 3-2 1 7H5z" />
                  <circle cx="5" cy="9" r="1" className="fill-white animate-pulse" />
                  <circle cx="12" cy="4" r="1.2" className="fill-white animate-pulse" />
                  <circle cx="19" cy="9" r="1" className="fill-white animate-pulse" />
                </svg>
              </motion.div>
              {/* Luxury Deep Gothic Bold C with premium gradient & intense shadow */}
              <span className="relative font-black bg-clip-text text-transparent bg-gradient-to-b from-rose-200 via-red-500 to-red-950 filter drop-shadow-[0_5px_4px_rgba(0,0,0,0.95)] text-5xl tracking-tight transition-transform group-hover:scale-105 block">
                C
              </span>
            </span>
            <span className="font-black bg-clip-text text-transparent bg-gradient-to-b from-rose-200 via-red-500 to-red-950 filter drop-shadow-[0_5px_4px_rgba(0,0,0,0.95)] text-5xl tracking-wide transition-all group-hover:text-red-400">
              HOICE
            </span>
            <span className="text-[10px] font-black text-amber-400/90 not-italic uppercase ml-5 border-l border-neutral-800 pl-5 tracking-[0.25em] self-center flex flex-col items-start gap-0.5 leading-none">
              <span>SPORTS</span>
              <span className="text-gray-400 text-[8px] tracking-[0.3em] font-normal">& CASINO</span>
            </span>
          </span>
          {/* Neon shimmer underline on hover */}
          <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-500 to-red-600 group-hover:w-full transition-all duration-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
        </button>

        {/* Navigation Menus (Centered) */}
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-extrabold text-gray-300">
          {['테더가이드', '스포츠', '미니게임', '인플레이', '경기결과', '베팅내역', '입금신청', '출금신청', '공지사항'].map((item) => {
            if (item === '미니게임') {
              return (
                <div 
                  key={item}
                  className="relative"
                  onMouseEnter={openMiniGameSubmenu}
                  onMouseLeave={closeMiniGameSubmenu}
                >
                  <button 
                    onClick={() => { setActiveMiniGameTab('powerball5'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                    className={`hover:text-amber-400 transition-colors uppercase tracking-tight relative pb-1 ${showMiniGame ? 'text-amber-400 font-extrabold border-b-2 border-amber-400' : 'hover:border-b-2 hover:border-amber-500'}`}
                  >
                    미니게임
                  </button>
                  {showMiniGameSubmenu && (
                    <div 
                      className="absolute top-full left-0 w-[140px] bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl mt-1.5 z-[999] overflow-hidden p-1 space-y-1 backdrop-blur-lg"

                      onMouseEnter={openMiniGameSubmenu}
                      onMouseLeave={closeMiniGameSubmenu}
                    >
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball5'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        N파워볼 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball3'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        N파워볼 (3분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerladder5'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        N파워사다리 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('ladder5'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        사다리 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('daridari3'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        다리다리 (3분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('speedladder1'); setShowMiniGame(true); setShowMyPage(false); setShowBetHistory(false); setShowDepositScreen(false); setShowWithdrawalScreen(false); setShowMiniGameSubmenu(false); setShowSupportScreen(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap"
                      >
                        스피드사다리 (1분)
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            
            if (item === '입금신청') {
              return (
                <button 
                  key={item} 
                  onClick={() => {
                    setShowDepositScreen(true);
                    setShowWithdrawalScreen(false);
                    setShowMyPage(false);
                    setShowMiniGame(false);
                    setShowBetHistory(false);
                    setShowGameResultScreen(false);
                    setShowSupportScreen(false);
                  }}
                  className={`transition-colors cursor-pointer uppercase tracking-tight ${showDepositScreen ? 'text-amber-400 font-bold border-b border-amber-400 pb-0.5' : 'hover:text-amber-400'}`}
                >
                  입금신청
                </button>
              );
            }

            if (item === '출금신청') {
              return (
                <button 
                  key={item} 
                  onClick={() => {
                    setShowWithdrawalScreen(true);
                    setShowDepositScreen(false);
                    setShowGameResultScreen(false);
                    setShowMyPage(false);
                    setShowMiniGame(false);
                    setShowBetHistory(false);
                    setShowSupportScreen(false);
                  }}
                  className={`transition-colors cursor-pointer uppercase tracking-tight ${showWithdrawalScreen ? 'text-amber-400 font-bold border-b border-amber-400 pb-0.5' : 'hover:text-amber-400'}`}
                >
                  출금신청
                </button>
              );
            }

            if (item === '경기결과') {
              return (
                <button 
                  key={item} 
                  onClick={() => {
                    setShowGameResultScreen(true);
                    setShowWithdrawalScreen(false);
                    setShowDepositScreen(false);
                    setShowMyPage(false);
                    setShowMiniGame(false);
                    setShowBetHistory(false);
                    setShowSupportScreen(false);
                  }}
                  className={`transition-colors cursor-pointer uppercase tracking-tight ${showGameResultScreen ? 'text-amber-400 font-bold border-b border-amber-400 pb-0.5' : 'hover:text-amber-400'}`}
                >
                  경기결과
                </button>
              );
            }

            if (item === '베팅내역') {
              return (
                <button 
                  key={item} 
                  onClick={() => {
                    setShowBetHistory(true);
                    setShowMyPage(false);
                    setShowGameResultScreen(false);
                    setShowWithdrawalScreen(false);
                    setShowDepositScreen(false);
                    setShowMiniGame(false);
                    setShowSupportScreen(false);
                  }}
                  className={`transition-colors cursor-pointer uppercase tracking-tight ${showBetHistory ? 'text-amber-400 font-bold border-b border-amber-400 pb-0.5' : 'hover:text-amber-400'}`}
                >
                  베팅내역
                </button>
              );
            }

            return (
              <button 
                key={item} 
                onClick={() => {
                  alert(`${item} 기능은 준비 중입니다.`);
                }}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                {item}
              </button>
            );
          })}
        </nav>

        {/* User Stats and Actions (VIP Polished Tones & High-contrast Luxury Cards) */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs w-full max-w-full my-1.5 select-none font-sans">
          {/* Level & Nickname Box */}
          <div className="flex items-center gap-2 bg-neutral-950/90 px-4 py-2 rounded-lg border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-transform hover:scale-105 duration-250">
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold px-1.5 py-0.5 rounded text-[10px] tracking-tight uppercase shadow-inner">
              VIP 등급
            </span>
            <span className="text-gray-150 font-black tracking-tight">{nickname} <span className="text-gray-400 font-normal">님</span></span>
          </div>

          {/* Holdings Box (Emerald Glow) */}
          <div className="flex items-center gap-2.5 bg-neutral-950/90 px-4 py-2 rounded-lg border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-transform hover:scale-105 duration-250">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-emerald-400 font-black">보유머니</span>
            <span className="text-white font-extrabold tracking-wide text-sm font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {userBalance.toLocaleString()} <span className="text-[10px] text-gray-400 font-sans">원</span>
            </span>
          </div>

          {/* Points Box (Gold Glow) */}
          <div className="flex items-center gap-2.5 bg-neutral-950/90 px-4 py-2 rounded-lg border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.1)] transition-transform hover:scale-105 duration-250">
            <span className="text-amber-400 font-black">포인트</span>
            <span className="text-white font-extrabold tracking-wide font-mono text-sm">
              {userPoints.toLocaleString()} <span className="text-[10px] text-gray-400 font-sans">P</span>
            </span>
          </div>

          {/* Messages Box (Crimson Flame Glow) */}
          <div className="flex items-center gap-2.5 bg-neutral-950/90 px-4 py-2 rounded-lg border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-transform hover:scale-105 duration-250">
            <span className="text-rose-450 font-black">신규쪽지</span>
            <span className="bg-rose-950 border border-rose-800 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              0
            </span>
          </div>

          {/* Sports Menu Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
            onClick={() => {
              setShowSports(true);
              setShowMyPage(false);
              setShowMiniGame(false);
              setShowDepositScreen(false);
              setShowWithdrawalScreen(false);
              setShowGameResultScreen(false);
              setShowBetHistory(false);
              setShowSupportScreen(false);
              setShowAttendanceChecker(false);
            }}
          >
            스포츠
          </button>

          {/* My Page Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
            onClick={() => {
              setShowMyPage(true);
              setShowMiniGame(false);
              setShowDepositScreen(false);
              setShowWithdrawalScreen(false);
              setShowGameResultScreen(false);
              setShowBetHistory(false);
              setShowSupportScreen(false);
            }}
          >
            My Page
          </button>

          {/* Attendance Calendar Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
            onClick={() => setShowAttendanceChecker(true)}
          >
            출석체크
          </button>

          {/* Customer Center Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
            onClick={() => {
              setShowSupportScreen(true);
              setShowMyPage(false);
              setShowMiniGame(false);
              setShowDepositScreen(false);
              setShowWithdrawalScreen(false);
              setShowGameResultScreen(false);
              setShowBetHistory(false);
            }}
          >
            고객센터
          </button>

          {/* Logout Button */}
          <button 
            type="button"
            onClick={handleLogoutClick}
            className="bg-gradient-to-b from-[#1e1f24] via-[#1c1212] to-[#120707] border border-zinc-800/80 hover:border-red-650 hover:text-red-400 text-gray-300 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
          >
            로그아웃
          </button>

          {/* Secure KST Electronic Digital Clock */}
          <div className="flex items-center gap-2 bg-neutral-950/90 px-3.5 py-2 rounded-lg border border-rose-950 shadow-md font-mono text-xs select-none shadow-[inset_0_0_8px_rgba(239,68,68,0.05)]">
            <span className="text-red-500 font-extrabold animate-pulse text-[10px]">●</span>
            <span className="text-red-400/80 font-bold text-[9px] uppercase tracking-wider">KST:</span>
            <span className="text-rose-400 font-black tracking-wide drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]">{kstClock || '동기화 중...'}</span>
          </div>
        </div>
      </header>

      {/* Conditional Rendering: My Page vs Betting History vs Mini Game vs Dashboard */}
      {showSports ? (
        <SportsContainer />
      ) : showBetHistory ? (
        <BetHistoryView currentUserData={currentUserData} />
      ) : showSupportScreen ? (
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowSupportScreen(false)} className="hover:text-white">홈</button> &gt; 고객센터 &gt; 1:1 문의사항
          </div>

          {/* Title Banner */}
          <div className="mb-6 border-b border-neutral-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-500" />
                1:1 문의사항 <span className="text-amber-500 text-xs font-black tracking-wider uppercase">1:1 Customer Support</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">문의하신 질문은 성심성의껏 세심하고 빠르게 답변 드리겠습니다.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateInquiryModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Edit className="w-3.5 h-3.5" /> 1:1 문의등록
              </button>
              <button
                onClick={handleDeleteAllUserInquiries}
                className="bg-neutral-800 hover:bg-neutral-750 text-rose-400 border border-neutral-700/60 font-bold text-xs px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> 내역 전체삭제
              </button>
            </div>
          </div>

          {/* Table / List Container */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            {isLoadingInquiries ? (
              <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span>문의사항을 불러오는 중입니다...</span>
              </div>
            ) : userInquiries.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
                <div className="bg-neutral-800/50 p-4 rounded-full border border-neutral-800">
                  <Shield className="w-8 h-8 text-neutral-600" />
                </div>
                <div>
                  <p className="text-gray-400">등록된 1:1 문의사항이 없습니다.</p>
                  <p className="text-xs text-gray-500 mt-1">도움이 필요하시면 문의등록 버튼을 눌러 접수해주세요.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-950 text-gray-300 font-black border-b border-neutral-800 uppercase tracking-wider">
                      <th className="p-4 w-12 text-center">번호</th>
                      <th className="p-4">제목</th>
                      <th className="p-4 w-28 text-center">작성자</th>
                      <th className="p-4 w-32 text-center">작성일시</th>
                      <th className="p-4 w-24 text-center">처리상태</th>
                      <th className="p-4 w-16 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {userInquiries.map((inq, index) => {
                      const isExpanded = selectedInquiryDetail?.id === inq.id;
                      return (
                        <tr key={inq.id} className="hover:bg-neutral-850/40 transition">
                          <td className="p-4 text-center text-gray-500 font-mono">{userInquiries.length - index}</td>
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedInquiryDetail(isExpanded ? null : inq)}
                              className="text-left font-bold text-gray-200 hover:text-amber-400 block w-full focus:outline-none focus:text-amber-400 transition cursor-pointer"
                            >
                              {inq.title}
                            </button>
                            
                            {/* Expandable Box inside title row */}
                            {isExpanded && (
                              <div className="mt-4 bg-neutral-950 border border-neutral-850 rounded-lg p-5 space-y-4 my-2 text-gray-300">
                                <div className="border-b border-neutral-800 pb-3">
                                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 font-mono">
                                    <span>작성자: <strong className="text-amber-500">{inq.nickname}</strong> ({inq.username})</span>
                                    <span>접수일: {new Date(inq.createdAt).toLocaleString('ko-KR')}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap leading-relaxed text-xs text-gray-200 font-sans mt-2">{inq.content}</p>
                                </div>
                                
                                {/* Reply Section */}
                                <div>
                                  <h4 className="text-[11px] font-black text-amber-500 flex items-center gap-1 mb-2">
                                    <Shield className="w-3.5 h-3.5" /> 고객센터 답변 (Answer)
                                  </h4>
                                  {inq.status === 'answered' ? (
                                    <div className="bg-emerald-950/25 border border-emerald-900/30 rounded p-4 text-emerald-200 space-y-2">
                                      <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs">{inq.reply}</p>
                                      <p className="text-[10px] text-emerald-500 font-mono text-right font-black">답변일시: {new Date(inq.repliedAt).toLocaleString('ko-KR')}</p>
                                    </div>
                                  ) : (
                                    <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded text-gray-500 font-bold text-center italic">
                                      고객센터 담당자의 확인을 대기 중입니다. 최대한 신속하게 성심껏 안내해 드리겠습니다.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center text-gray-300 font-bold">{inq.nickname}</td>
                          <td className="p-4 text-center text-gray-500 font-mono text-[10px]">{new Date(inq.createdAt).toLocaleString('ko-KR')}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight flex items-center justify-center gap-1 w-20 mx-auto ${inq.status === 'answered' ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' : 'bg-amber-955 border border-amber-905 text-amber-400 animate-pulse'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${inq.status === 'answered' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {inq.status === 'answered' ? '답변완료' : '답변대기'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-950/20 cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* New Inquiry Create Modal */}
          {showCreateInquiryModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-[#0b0c10] border border-neutral-800 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative">
                <button
                  onClick={() => setShowCreateInquiryModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="p-6 border-b border-neutral-800/60 bg-neutral-950/60">
                  <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                    <Shield className="w-5 h-5 text-amber-500" />
                    1:1 고객문의 작성
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">궁금하신 사항 혹은 변경/처리를 원하시는 내용을 작성하여 주세요.</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Title input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400">문의 제목</label>
                    <input
                      type="text"
                      className="w-full bg-[#111217] border border-neutral-850 hover:border-neutral-750 focus:border-amber-500/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-bold"
                      placeholder="제목을 입력해주세요."
                      value={inquiryTitle}
                      onChange={(e) => setInquiryTitle(e.target.value)}
                    />
                  </div>

                  {/* Description input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400">문의 내용</label>
                    <textarea
                      rows={5}
                      className="w-full bg-[#111217] border border-neutral-850 hover:border-neutral-750 focus:border-amber-500/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-medium leading-relaxed resize-none"
                      placeholder="문의 내용을 명확하고 자세하게 작성해주시면 가장 빠른 처리가 가능합니다."
                      value={inquiryContent}
                      onChange={(e) => setInquiryContent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-neutral-800/60 bg-neutral-950/40 flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => setShowCreateInquiryModal(false)}
                    className="bg-neutral-800 hover:bg-neutral-750 text-gray-300 font-bold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer border border-neutral-700/30"
                  >
                    작성취소
                  </button>
                  <button
                    onClick={handleSubmitInquiry}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-black font-black px-5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    등록제출
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showMyPage ? (
        <div className="flex-1 p-8 max-w-2xl w-full mx-auto">
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowMyPage(false)} className="hover:text-white">마이페이지</button> &gt; 회원정보수정
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-center mb-8">회원정보 수정</h2>
            <div className="bg-neutral-800 p-4 rounded text-center text-sm text-gray-300 mb-8">
              {currentUser?.username}님의 회원정보 수정입니다. 아이디와 비밀번호 보안에 신경써주십시오.
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">아이디</label>
                <span className="text-amber-400 font-bold">{currentUser?.username}</span>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">새 로그인 비밀번호</label>
                <div className="flex-1">
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="새로운 로그인 비밀번호 입력 (4~16자)"
                    className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-white" 
                  />
                  <p className="text-xs text-gray-500 mt-1">변경을 원하시는 경우에만 새 로그인 비밀번호를 입력해주세요.</p>
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">출금 비밀번호</label>
                <div className="flex-1">
                  {currentUserData?.withdrawalPassword ? (
                    <div className="text-gray-400 p-2">이미 설정되었습니다.</div>
                  ) : (
                    <>
                      <input 
                        type="password" 
                        value={withdrawalPassword} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 6) setWithdrawalPassword(val);
                        }}
                        placeholder="출금 비밀번호 설정"
                        className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-white" 
                      />
                      <p className="text-xs text-gray-500 mt-1">최초 1회 설정: 숫자 4~6자리로 입력해주세요.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">닉네임</label>
                <div className="flex-1">
                  <input type="text" disabled value={nickname} className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">닉네임은 변경이 불가능합니다.</p>
                </div>
              </div>
            </div>

              <div className="mt-12 text-center flex justify-center gap-4">
                {currentUserData && (
                  <button 
                    onClick={async () => {
                      const updates: any = {};
                      const infoMessages: string[] = [];

                      // 1. Password edit check
                      if (loginPassword) {
                        if (loginPassword.length < 4 || loginPassword.length > 16) {
                          alert('로그인 비밀번호는 4~16자여야 합니다.');
                          return;
                        }
                        updates.password = loginPassword;
                        infoMessages.push('로그인 비밀번호');
                      }

                      // 2. Withdrawal Password edit check
                      if (withdrawalPassword) {
                        if (withdrawalPassword.length < 4 || withdrawalPassword.length > 6) {
                          alert('출금 비밀번호는 4~6자리 숫자여야 합니다.');
                          return;
                        }
                        updates.withdrawalPassword = withdrawalPassword;
                        infoMessages.push('출금 비밀번호');
                      }

                      if (Object.keys(updates).length === 0) {
                        alert('변경하거나 설정할 비밀번호 정보를 입력해주세요.');
                        return;
                      }

                      try {
                        await updateDoc(doc(db, 'users', currentUserData.id), {
                          ...updates
                        });
                        alert(`${infoMessages.join(', ')}가 성공적으로 변경/저장되었습니다.`);
                        
                        // Sync UI states
                        setCurrentUserData(prev => ({
                          ...prev,
                          ...updates
                        }));

                        // Sync local fallback cache
                        const localUsersStr = localStorage.getItem('localUsersFallback');
                        if (localUsersStr) {
                          const localUsers = JSON.parse(localUsersStr);
                          const updatedLocal = localUsers.map((u: any) => 
                            u.username === currentUserData.username ? { ...u, ...updates } : u
                          );
                          localStorage.setItem('localUsersFallback', JSON.stringify(updatedLocal));
                        }

                        // Update current storage user details
                        const savedUser = localStorage.getItem('currentUser');
                        if (savedUser) {
                          const userObj = JSON.parse(savedUser);
                          localStorage.setItem('currentUser', JSON.stringify({ ...userObj, ...updates }));
                        }

                        setLoginPassword('');
                        setWithdrawalPassword('');
                      } catch (e) {
                        console.error("Save failed:", e);
                        alert('정보 저장 실패: ' + (e instanceof Error ? e.message : String(e)));
                      }
                    }}
                    className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-12 rounded cursor-pointer transition-all"
                  >
                    회원정보 저장
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowSupportScreen(true);
                    setShowMyPage(false);
                  }}
                  className="bg-lime-700 hover:bg-lime-600 text-white font-bold py-2 px-12 rounded cursor-pointer transition-all active:scale-95 duration-200"
                >
                  문의하기 (고객센터)
                </button>
              </div>
          </div>
        </div>
      ) : showDepositScreen ? (
        <div className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
          {/* Breadcrumb path */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowDepositScreen(false)} className="hover:text-white">홈</button> &gt; 충전/환전 &gt; 보유머니 충전신청
          </div>

          {/* Title box */}
          <div className="mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              보유머니 충전 <span className="text-amber-500 text-xs font-black tracking-wider uppercase">Money Charge Apply</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Col: Important guidelines and Wallet Rate/Info (Spans 2 cols on wide screen) */}
            <div className="md:col-span-2 space-y-6">
              {/* Must-read guidelines */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-amber-500">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>필독사항 (Important Notice)</span>
                </div>
                <ul className="space-y-2 text-xs text-gray-300 list-disc pl-5 leading-normal">
                  <li>지정된 아래 전송 주소로 <span className="text-amber-400 font-extrabold">USDT (TRC-20)</span>를 정확히 전송해주셔야 처리됩니다.</li>
                  <li>입금 신청 금액은 1테더 기준 고정 환율 <span className="text-emerald-400 font-bold">1USD = 1,531원</span>으로 자동 정산되어 충전됩니다.</li>
                  <li>거래소 전송 비용이나 패널티, 가스머니는 본인 부담이며, 수수료를 제외한 실입금액 기준으로 입금 신청해주십시오.</li>
                  <li>등록된 본인의 테더 지갑 주소에서 발신한 트랜잭션만 자동 매칭됩니다. 발신 주소가 일치하지 않을 시 처리가 지연될 수 있습니다.</li>
                  <li>USDT 및 코인 시세는 실시간 미국 대표 코인거래소 시세를 기준으로 고정 반영된 고유 안전 환율입니다.</li>
                </ul>
              </div>

              {/* Wallet instructions and address visualizer */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
                <div className="text-xs text-gray-400">
                  아래의 공식 테더(USDT) 입금 주소로 회원님의 자산을 임금해 주시기 바랍니다. 전송 완료 후 아래 신청 폼을 작성해 주세요.
                </div>
                
                <div className="bg-black/60 border border-neutral-850 rounded p-4 space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-semibold font-mono">NETWORK</span>
                    <span className="text-amber-500 font-extrabold font-mono">Tether TRC-20 (TRON)</span>
                  </div>
                  
                  <div className="border-t border-neutral-800/60 my-2"></div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-500 font-semibold">TETHER DEPOSIT ADDRESS (테더 입금 전용 주소)</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 bg-neutral-950 border border-neutral-800 text-amber-400 font-mono text-[11px] font-extrabold p-3 rounded select-all break-all flex items-center justify-center sm:justify-start">
                        TW9YSdPN5qhTE15RxFi4Jyg9Z2ynyv7KsA
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("TW9YSdPN5qhTE15RxFi4Jyg9Z2ynyv7KsA");
                          alert("Tether 공식 주소가 클립보드에 복사되었습니다.\n\nTW9YSdPN5qhTE15RxFi4Jyg9Z2ynyv7KsA");
                        }}
                        className="px-4 bg-emerald-700 hover:bg-emerald-600 font-bold text-xs rounded text-white cursor-pointer transition flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[40px]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        주소 복사
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enter Amount section */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-tight">충전 정보 입력 (Money Charge Sheet)</span>
                </div>

                <div className="space-y-4">
                  {/* Current Balance Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-3 gap-1">
                    <span className="text-xs text-gray-400 font-semibold">현재 보유잔액</span>
                    <span className="text-sm font-black text-rose-400 font-mono">
                      {userBalance.toLocaleString()} 원
                    </span>
                  </div>

                  {/* Quantity Input Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-4 gap-2">
                    <span className="text-xs text-gray-400 font-semibold">충전 신청 수량</span>
                    <div className="flex-1 flex items-center justify-end gap-2 max-w-sm w-full">
                      <input
                        type="text"
                        value={depositAmountUsdt || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setDepositAmountUsdt(val);
                        }}
                        placeholder="전송하신 USDT 수량을 입력하세요."
                        className="w-full bg-neutral-950 border border-neutral-800 text-right text-gray-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold font-mono"
                      />
                      <span className="text-xs font-bold text-gray-400 min-w-[40px] text-left">USDT</span>
                    </div>
                  </div>

                  {/* Realtime conversion values row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-4 gap-2">
                    <span className="text-xs text-gray-400 font-semibold">보유머니 원화 지급 전환액</span>
                    <div className="flex-1 flex items-center justify-end gap-2 max-w-sm w-full font-mono">
                      <span className="text-base font-black text-amber-400">
                        {(Number(depositAmountUsdt || 0) * exchangeRate).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-gray-400 min-w-[40px] text-left">원</span>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {[1, 5, 10, 50, 100, 500, 1000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setDepositAmountUsdt((prev) => String(Number(prev || 0) + amt));
                        }}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-850 text-[11px] font-bold text-[#b5cb85] border border-[#a1b476]/30 hover:border-[#a1b476]/65 rounded transition cursor-pointer"
                      >
                        +{amt.toLocaleString()}테더
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDepositAmountUsdt('')}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-[11px] font-extrabold text-red-400 border border-red-900/40 rounded transition cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>

                  {/* Sending wallet address input */}
                  <div className="flex flex-col gap-2.5 pt-3">
                    <div className="space-y-0.5">
                      <span className="text-xs text-gray-400 font-semibold block">송금하시는 본인 지갑 주소</span>
                      <span className="text-[10px] text-gray-500 block">이 주소에서 입금 주소로 실송금 트랜잭션이 발생해야 합니다.</span>
                    </div>
                    <div className="w-full">
                      <div className="relative">
                        <input
                          type="text"
                          value={depositWalletAddressInput || currentUserData?.tetherWalletAddress || currentUser?.tetherWalletAddress || ''}
                          readOnly
                          placeholder="회원가입시 입력한 지갑 주소가 표시됩니다."
                          className="w-full bg-neutral-900 border border-neutral-800 text-amber-500 font-mono text-left break-all font-bold rounded pl-3.5 pr-24 py-3 text-xs select-all cursor-not-allowed"
                        />
                        <div className="absolute right-2.5 top-2 flex items-center gap-1 bg-red-950 border border-red-900/40 text-[10px] text-red-400 font-bold px-2.5 py-1 rounded select-none">
                          <Lock className="w-3 h-3 text-red-400" />
                          <span>수정 불가</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit application */}
                <div className="mt-8 border-t border-neutral-800/80 pt-6 flex justify-center">
                  <button
                    onClick={handleDepositSubmit}
                    disabled={isSubmitDeposit}
                    className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-900/30 disabled:text-gray-500 text-white font-extrabold text-sm rounded shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitDeposit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    테더 입금 신청하기
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Standard fixed exchange box rate and QR scanning */}
            <div className="space-y-6">
              {/* FIXED RATE BOX */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">1테더 환전율 (TRC-20 Rate)</div>
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400">CHOICE 입금 고정 환율</div>
                  <div className="text-xl font-black text-amber-400 tracking-wide font-mono">
                    1 USDT <span className="text-xs text-gray-500 font-normal">➔</span> {exchangeRate.toLocaleString()} 원
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    * 테더(USDT)는 미국 달러(USD)에 1:1 패깅된 유력 연계 통화로, 초이스 플랫폼은 안전 고정 환율을 채택하여 송금 시 시세 손해 없이 고액의 금액이라도 전액 안심 보장됩니다.
                  </p>
                </div>
              </div>

              {/* QR Scan box */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-300 mb-1">테더 주소 QR 코드</span>
                <span className="text-[10px] text-gray-500 text-center mb-4 leading-normal">스마트폰 지갑 앱을 열고 QR 코드를 스캔하여 간편하게 전송하세요.</span>
                <div className="p-3 bg-white rounded-lg select-none border border-neutral-800">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&amp;data=TW9YSdPN5qhTE15RxFi4Jyg9Z2ynyv7KsA"
                    alt="USDT Address QR Code"
                    className="w-32 h-32"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] mt-2 text-amber-500/80 font-mono font-bold uppercase tracking-wider">Tether Core Network TRC-20</span>
              </div>
            </div>
          </div>

          {/* Bottom Table Section: USER MONEY CHARGE HISTORY */}
          <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-tight">보유머니 충전 내역 (MONEY CHARGE HISTORY)</span>
              </div>
              <span className="text-[10px] text-red-500 font-semibold">※ 개인정보 보호ವನ್ನು 위하여 최근 신청한 데이터 내역이 표기됩니다.</span>
            </div>

            <div className="overflow-x-auto rounded border border-neutral-800/60 bg-black/20">
              <table className="w-full text-center text-xs text-gray-300">
                <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800/80">
                  <tr>
                    <th className="p-3 font-semibold text-center w-40">신청일시</th>
                    <th className="p-3 font-semibold text-center">선택 충전 수량</th>
                    <th className="p-3 font-semibold text-center">환산 KRW 머니</th>
                    <th className="p-3 font-semibold text-center w-40">처리일시</th>
                    <th className="p-3 font-semibold text-center w-28">처리상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-600" />
                        자료를 로딩하는 중입니다...
                      </td>
                    </tr>
                  ) : userDepositHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold bg-black/10">
                        충전 내역이 존재하지 않습니다.
                      </td>
                    </tr>
                  ) : (
                    userDepositHistory.map((req) => (
                      <tr key={req.id} className="hover:bg-neutral-850/40 transition">
                        <td className="p-3 text-gray-400 font-mono text-[11px]">{formatDateStr(req.createdAt)}</td>
                        <td className="p-3 text-amber-400 font-extrabold font-mono text-center text-[11px]">{req.amountUsdt} USDT</td>
                        <td className="p-3 text-emerald-400 font-extrabold font-mono text-center">{(req.amountKrw || 0).toLocaleString()}원</td>
                        <td className="p-3 text-gray-400 font-mono text-[11px]">{req.processedAt ? formatDateStr(req.processedAt) : '-'}</td>
                        <td className="p-3 text-center">
                          {req.status === 'pending' && (
                            <span className="inline-block bg-amber-950/70 text-amber-400 border border-amber-800/50 px-2.5 py-0.5 rounded text-[10px] font-black animate-pulse">
                              대기중
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="inline-block bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 rounded text-[10px] font-black">
                              승인완료
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-block bg-red-950/70 text-red-400 border border-red-800/50 px-2.5 py-0.5 rounded text-[10px] font-black">
                              취소/거절
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : showWithdrawalScreen ? (
        <div className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
          {/* Breadcrumb path */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowWithdrawalScreen(false)} className="hover:text-white">홈</button> &gt; 충전/환전 &gt; 보유머니 환전신청
          </div>

          {/* Title box */}
          <div className="mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              보유머니 환전 <span className="text-amber-500 text-xs font-black tracking-wider uppercase">Money Exchange Apply</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Col: Important guidelines and Exchange Sheet (Spans 2 cols on wide screen) */}
            <div className="md:col-span-2 space-y-6">
              {/* Must-read guidelines */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-amber-500">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>필독사항 (Important Notice)</span>
                </div>
                <ul className="space-y-2 text-xs text-gray-300 list-disc pl-5 leading-normal">
                  <li>등록된 개인 지갑 주소로 <span className="text-amber-400 font-extrabold">USDT</span>가 전송 됩니다.</li>
                  <li>출금 신청 기준 1테더 기준 환율 금액이 처리됩니다.</li>
                  <li>등록한 지갑 주소에서만 입금 출금 가능합니다, 변경시 문의 부탁드립니다.</li>
                  <li>자세한 문의는 고객센터를 이용해 주세요. * (실시간 코인 시세는 <span className="text-red-500 font-bold">[코인베이스]</span> 기준으로 적용됩니다)</li>
                </ul>
              </div>

              {/* Enter Amount section */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-tight">환전 정보 입력 (Money Exchange Sheet)</span>
                </div>

                <div className="space-y-4">
                  {/* Current Balance Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-3 gap-1">
                    <span className="text-xs text-gray-400 font-semibold">보유금액</span>
                    <span className="text-sm font-black text-amber-500 font-mono">
                      {userBalance.toLocaleString()} 원
                    </span>
                  </div>

                  {/* Quantity Input Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-4 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-gray-400 font-semibold block">금액입력 (Tether Amount)</span>
                      <span className="text-[10px] text-gray-500 block">원화 환산 전 순수 신청 테더(USDT) 수량입니다.</span>
                    </div>
                    <div className="relative w-full sm:max-w-[240px]">
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={withdrawalAmountUsdt || ''}
                        onChange={(e) => setWithdrawalAmountUsdt(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-amber-500 font-mono text-right font-bold rounded pr-12 pl-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/80 transition-all select-all"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-bold select-none">테더</span>
                    </div>
                  </div>

                  {/* Converted KRW Output Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-gray-400 font-semibold block">처리 금액 (Converted Money)</span>
                      <span className="text-[10px] text-gray-500 block">현재 1테더 출금 환전 환산율(1,537원)을 적용한 최종 원화입니다.</span>
                    </div>
                    <div className="relative w-full sm:max-w-[240px]">
                      <div className="w-full bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono text-right font-black rounded pr-12 pl-3 py-2.5 text-sm select-none">
                        {(Number(withdrawalAmountUsdt || 0) * exchangeRate).toLocaleString()}
                      </div>
                      <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-bold select-none">원</span>
                    </div>
                  </div>

                  {/* Quick incremental buttons */}
                <div className="w-full mb-2">
                    <label className="text-xs text-gray-400 font-semibold block mb-1">출금 비밀번호</label>
                    <input
                      type="password"
                      placeholder="출금 비밀번호 입력"
                      value={withdrawalPasswordInput}
                      onChange={(e) => setWithdrawalPasswordInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-amber-500 font-mono text-sm font-bold rounded px-3 py-2.5 focus:outline-none focus:border-amber-500/80 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                    {[1, 5, 10, 50, 100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawalAmountUsdt(prev => String((Number(prev) || 0) + amt))}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-850 text-[11px] font-bold text-amber-400 border border-amber-500/15 hover:border-amber-500/40 rounded transition cursor-pointer"
                      >
                        +{amt.toLocaleString()}테더
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawalAmountUsdt('')}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-[11px] font-extrabold text-red-400 border border-red-900/40 rounded transition cursor-pointer"
                    >
                      정정
                    </button>
                  </div>

                  {/* Registered receiving wallet address display */}
                  <div className="flex flex-col gap-2.5 pt-3">
                    <div className="space-y-0.5">
                      <span className="text-xs text-gray-400 font-semibold block">받을주소 (Tether Destination Address)</span>
                      <span className="text-[10px] text-gray-500 block">회원 정보에 등록된 지갑 주소로 자동 송금됩니다.</span>
                    </div>
                    <div className="w-full">
                      <div className="relative">
                        <input
                          type="text"
                          value={currentUserData?.tetherWalletAddress || currentUser?.tetherWalletAddress || ''}
                          readOnly
                          placeholder="받을 주소를 정확하게 입력하세요"
                          className="w-full bg-neutral-900 border border-neutral-800 text-amber-550 font-mono text-left break-all font-bold rounded pl-3.5 pr-24 py-3 text-xs select-all cursor-not-allowed"
                        />
                        <div className="absolute right-2.5 top-2 flex items-center gap-1 bg-neutral-950 border border-neutral-800 text-[10px] text-[#b5cb85] font-bold px-2.5 py-1 rounded select-none">
                          <Lock className="w-3 h-3 text-[#b5cb85]" />
                          <span>등록 주소</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit application */}
                <div className="mt-8 border-t border-neutral-800/80 pt-6 flex justify-center">
                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={isSubmitWithdrawal}
                    className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-900/30 disabled:text-gray-500 text-white font-extrabold text-sm rounded shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitWithdrawal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    보유머니 환전 신청하기
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Standard fixed exchange box rate */}
            <div className="space-y-6">
              {/* FIXED RATE BOX */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">1테더 환전율 (TRC-20 Rate)</div>
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400">CHOICE 환전 고정 환율</div>
                  <div className="text-xl font-black text-amber-400 tracking-wide font-mono">
                    1 USDT <span className="text-xs text-gray-500 font-normal">➔</span> {exchangeRate.toLocaleString()} 원
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    * 테더(USDT)는 미국 달러(USD)에 1:1 패깅된 유력 연계 통화로, 초이스 플랫폼은 안전 고정 환율을 채택하여 송금 시 시세 손해 없이 고액의 금액이라도 전액 안심 보장됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table Section: USER MONEY EXCHANGE HISTORY */}
          <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-tight">보유머니 환전 내역 (MONEY EXCHANGE HISTORY)</span>
              </div>
              <span className="text-[10px] text-red-500 font-semibold">※ 최근 7일내역만 표기됩니다.</span>
            </div>

            <div className="overflow-x-auto rounded border border-neutral-800/60 bg-black/20">
              <table className="w-full text-center text-xs text-gray-300">
                <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800/80">
                  <tr>
                    <th className="p-3 font-semibold text-center w-40">신청일시</th>
                    <th className="p-3 font-semibold text-center">선택 환전 수량</th>
                    <th className="p-3 font-semibold text-center">환산 KRW 머니</th>
                    <th className="p-3 font-semibold text-center w-40">처리일시</th>
                    <th className="p-3 font-semibold text-center w-28">처리상태</th>
                    <th className="p-3 font-semibold text-center">받은주소(선택)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {isLoadingWithdrawalHistory ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-600" />
                        자료를 로딩하는 중입니다...
                      </td>
                    </tr>
                  ) : userWithdrawalHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-500 font-medium">
                        환전 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    userWithdrawalHistory.map((req) => (
                      <tr key={req.id} className="hover:bg-neutral-900/30 transition">
                        <td className="p-3 text-gray-400 text-[11px] font-semibold text-center">{formatDateStr(req.createdAt)}</td>
                        <td className="p-3 text-amber-400 font-bold text-center font-mono">{(req.amountUsdt || 0).toLocaleString()} USDT</td>
                        <td className="p-3 text-emerald-400 font-bold text-center font-mono">{(req.amountKrw || 0).toLocaleString()} 원</td>
                        <td className="p-3 text-gray-400 text-[11px] text-center">{req.processedAt ? formatDateStr(req.processedAt) : '-'}</td>
                        <td className="p-3 text-center">
                          {req.status === 'pending' && (
                            <span className="inline-block bg-amber-950/70 text-amber-400 border border-amber-800/50 px-2.5 py-0.5 rounded text-[10px] font-extrabold animate-pulse">
                              대기중
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="inline-block bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 rounded text-[10px] font-black">
                              승인완료
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="inline-block bg-red-950/70 text-red-400 border border-red-800/50 px-2.5 py-0.5 rounded text-[10px] font-black">
                              취소/거절
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-left font-mono text-[10px] text-gray-500 truncate max-w-[140px] select-all" title={req.tetherWalletAddress}>
                          {req.tetherWalletAddress || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : showGameResultScreen ? (
        <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]">
          {/* Breadcrumb path */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowGameResultScreen(false)} className="hover:text-white">홈</button> &gt; 경기결과
          </div>

          <div className="bg-[#0e111a] border border-neutral-800/80 rounded-xl p-5 md:p-7 shadow-2xl">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-6 font-sans">
              경기 결과 <span className="text-amber-500 text-[10px] font-black tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">GAME RESULT</span>
            </h2>

            {/* Game Result Categories */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-800/80 pb-6">
              {['전체', 'N파워볼(5분)', 'N파워볼(3분)', 'N파워사다리(5분)', '사다리(5분)', '다리다리(3분)'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => {
                    setGameResultFilter(cat);
                    setGameResultPage(1);
                  }}
                  className={`px-4 py-2 rounded text-xs font-bold transition cursor-pointer border ${
                    gameResultFilter === cat 
                      ? 'bg-amber-500 text-black border-amber-500 shadow font-black' 
                      : 'bg-neutral-900 hover:bg-neutral-800 text-gray-400 border-neutral-800/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isLoadingGameResults ? (
              <div className="text-center py-24 text-gray-500 font-medium">로딩 중...</div>
            ) : (() => {
              const expandGameResultToRows = (res: any) => {
                const rows: any[] = [];
                const dt = new Date(res.createdAt);
                const dateStr = dt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
                const timeStr = dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                
                const isPowerball = res.gameName === 'N파워볼(5분)' || res.gameName === 'N파워볼(3분)';
                const isLadder = res.gameName === '사다리(5분)' || res.gameName === '다리다리(3분)' || res.gameName === 'N파워사다리(5분)';
                
                if (isPowerball) {
                  const details = res.details || {};
                  
                  // 1. 일반볼 [홀짝]
                  rows.push({
                    id: `${res.id}_oe`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 일반볼 [홀짝]`,
                    homeName: '홀',
                    homeOdds: '1.95',
                    awayName: '짝',
                    awayOdds: '1.95',
                    midStandard: 'VS',
                    winner: details.rolledOddEven === '홀' ? 'home' : details.rolledOddEven === '짝' ? 'away' : 'none',
                    score: details.rolledOddEven ? `${details.rolledOddEven}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 2. 일반볼 [언더오버]
                  rows.push({
                    id: `${res.id}_uo`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 일반볼 [언더오버]`,
                    homeName: '언더 [72.5]',
                    homeOdds: '1.95',
                    awayName: '오버 [72.5]',
                    awayOdds: '1.95',
                    midStandard: '72.5',
                    winner: details.rolledUnderOver === '언더' ? 'home' : details.rolledUnderOver === '오버' ? 'away' : 'none',
                    score: details.rolledUnderOver ? `${details.rolledUnderOver}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 3. 파워볼 [홀짝]
                  rows.push({
                    id: `${res.id}_pboe`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 파워볼 [홀짝]`,
                    homeName: '홀',
                    homeOdds: '1.95',
                    awayName: '짝',
                    awayOdds: '1.95',
                    midStandard: 'VS',
                    winner: details.pbOddEven === '홀' ? 'home' : details.pbOddEven === '짝' ? 'away' : 'none',
                    score: details.pbOddEven ? `${details.pbOddEven}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 4. 파워볼 [언더오버]
                  rows.push({
                    id: `${res.id}_pbuo`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 파워볼 [언더오버]`,
                    homeName: '언더 [4.5]',
                    homeOdds: '1.95',
                    awayName: '오버 [4.5]',
                    awayOdds: '1.95',
                    midStandard: '4.5',
                    winner: details.pbUnderOver === '언더' ? 'home' : details.pbUnderOver === '오버' ? 'away' : 'none',
                    score: details.pbUnderOver ? `${details.pbUnderOver}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 5. 일반볼 [대/중/소]
                  rows.push({
                    id: `${res.id}_size`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 일반볼 [대/중/소]`,
                    homeName: '대 [대]',
                    homeOdds: '2.90',
                    awayName: '소 [소]',
                    awayOdds: '2.90',
                    midStandard: `중 ${details.size === '중' ? '●' : ''}`,
                    winner: details.size === '대' ? 'home' : details.size === '소' ? 'away' : details.size === '중' ? 'draw' : 'none',
                    score: details.size ? `${details.size}` : '대기 중',
                    statusText: '결과완료'
                  });
                } else if (isLadder) {
                  const details = res.details || {};
                  
                  // 1. 사다리 [출발지]
                  rows.push({
                    id: `${res.id}_start`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 출발지선택_좌우`,
                    homeName: '좌',
                    homeOdds: '1.95',
                    awayName: '우',
                    awayOdds: '1.95',
                    midStandard: 'VS',
                    winner: details.start === '좌' ? 'home' : details.start === '우' ? 'away' : 'none',
                    score: details.start ? `${details.start}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 2. 사다리 [줄개수]
                  rows.push({
                    id: `${res.id}_lines`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 줄개수_3/4`,
                    homeName: '3줄',
                    homeOdds: '1.95',
                    awayName: '4줄',
                    awayOdds: '1.95',
                    midStandard: 'VS',
                    winner: details.lines === '3줄' ? 'home' : details.lines === '4줄' ? 'away' : 'none',
                    score: details.lines ? `${details.lines}` : '대기 중',
                    statusText: '결과완료'
                  });
                  
                  // 3. 사다리 [결과]
                  rows.push({
                    id: `${res.id}_outcome`,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[${res.round}회차] 최종결과_홀짝`,
                    homeName: '홀',
                    homeOdds: '1.95',
                    awayName: '짝',
                    awayOdds: '1.95',
                    midStandard: 'VS',
                    winner: details.outcome === '홀' ? 'home' : details.outcome === '짝' ? 'away' : 'none',
                    score: details.outcome ? `${details.outcome}` : '대기 중',
                    statusText: '결과완료'
                  });
                } else {
                  // Sports (e.g. 축구, 야구 등)
                  const matchStr = res.result || '';
                  const parts = matchStr.split(/\[(.*?)\]/);
                  let home = '';
                  let score = '';
                  let away = '';
                  if (parts.length >= 3) {
                    home = parts[0].trim();
                    score = parts[1].trim();
                    away = parts[2].trim();
                  } else {
                    home = '홈팀';
                    away = '원정팀';
                    score = matchStr;
                  }
                  
                  let winner = 'none';
                  if (score) {
                    const scoreParts = score.split('-').map((s: string) => parseInt(s.trim()));
                    if (scoreParts.length === 2) {
                      if (scoreParts[0] > scoreParts[1]) {
                        winner = 'home';
                      } else if (scoreParts[0] < scoreParts[1]) {
                        winner = 'away';
                      } else {
                        winner = 'draw';
                      }
                    }
                  }
                  
                  rows.push({
                    id: res.id,
                    dateStr,
                    timeStr,
                    gameName: res.gameName,
                    league: `[리그 매치] ${res.gameName}`,
                    homeName: home,
                    homeOdds: '1.90',
                    awayName: away,
                    awayOdds: '1.90',
                    midStandard: 'VS',
                    winner,
                    score: score || '경기종료',
                    statusText: '경기완료'
                  });
                }
                
                return rows;
              };

              const allExpandedRows = gameResults
                .filter((res: any) => gameResultFilter === '전체' ? true : res.gameName === gameResultFilter)
                .flatMap(res => expandGameResultToRows(res));

              if (allExpandedRows.length === 0) {
                return (
                  <div className="w-full text-center text-gray-500 py-24 border border-dashed border-neutral-800 rounded-lg">
                    현재 등록된 {gameResultFilter === '전체' ? '' : `[${gameResultFilter}]`} 경기 결과가 없습니다.
                  </div>
                );
              }

              const itemsPerPage = 30;
              const totalPages = Math.ceil(allExpandedRows.length / itemsPerPage);
              const maxPage = totalPages > 0 ? totalPages : 1;
              const currentPage = Math.min(gameResultPage, maxPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedRows = allExpandedRows.slice(startIndex, startIndex + itemsPerPage);

              return (
                <>
                  <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40">
                    <table className="w-full text-center text-xs text-gray-300">
                      <thead className="bg-[#0b0e14] border-b border-neutral-800/80 text-gray-400 text-[11px] font-bold tracking-wider">
                        <tr>
                          <th className="p-3 text-left pl-6 min-w-[100px]">경기일시</th>
                          <th className="p-3 text-left">리그 (구분)</th>
                          <th className="p-3 text-center min-w-[170px]">승 (홈)</th>
                          <th className="p-3 text-center min-w-[90px]">무 / 기준값</th>
                          <th className="p-3 text-center min-w-[170px]">패 (원정)</th>
                          <th className="p-3 text-center min-w-[100px]">스코어</th>
                          <th className="p-3 text-center pr-6 min-w-[90px]">결과</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/40">
                        {paginatedRows.map((row: any) => (
                          <tr key={row.id} className="hover:bg-neutral-900/30 transition-colors">
                            {/* 경기일시 */}
                            <td className="p-3 text-left pl-6 font-mono text-[11px] text-gray-500 whitespace-nowrap leading-relaxed py-4 align-middle">
                              <span className="block">{row.dateStr}</span>
                              <span className="text-amber-500 font-bold mt-0.5 block">{row.timeStr}</span>
                            </td>

                            {/* 리그(구분) */}
                            <td className="p-3 text-left align-middle py-4">
                              <div className="flex items-center gap-3">
                                {/* Live Square Indicator */}
                                <div className="flex flex-col items-center justify-center bg-[#1d0e11] border border-red-950/60 rounded px-1.5 py-1 min-w-[36px] min-h-[36px] h-9 w-9">
                                  <span className="block w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]"></span>
                                  <span className="text-[9px] font-black text-red-500 mt-1 scale-90 tracking-tighter">LIVE</span>
                                </div>
                                <span className="text-white text-xs font-bold font-sans tracking-tight">
                                  {row.league}
                                </span>
                              </div>
                            </td>

                            {/* 승(홈) */}
                            <td className="p-3 text-center align-middle py-4">
                              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs h-9 font-medium transition duration-200 select-none ${
                                row.winner === 'home' 
                                  ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                  : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90'
                              }`}>
                                <span className={`font-bold ${row.winner === 'home' ? 'text-amber-400' : 'text-gray-300'}`}>
                                  {row.homeName}
                                </span>
                                <span className="text-amber-500 font-bold font-mono tracking-wider ml-auto text-[11px]">
                                  {row.homeOdds}
                                </span>
                              </div>
                            </td>

                            {/* 무 / 기준값 */}
                            <td className="p-3 text-center align-middle py-4">
                              <div className="inline-flex items-center justify-center bg-[#07090d] border border-neutral-800/90 text-gray-400 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md min-w-[44px] h-7">
                                {row.midStandard}
                              </div>
                            </td>

                            {/* 패(원정) */}
                            <td className="p-3 text-center align-middle py-4">
                              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs h-9 font-medium transition duration-200 select-none ${
                                row.winner === 'away' 
                                  ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                  : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90'
                              }`}>
                                <span className={`font-bold ${row.winner === 'away' ? 'text-amber-400' : 'text-gray-300'}`}>
                                  {row.awayName}
                                </span>
                                <span className="text-amber-500 font-bold font-mono tracking-wider ml-auto text-[11px]">
                                  {row.awayOdds}
                                </span>
                              </div>
                            </td>

                            {/* 스코어 */}
                            <td className="p-3 text-center align-middle py-4 font-bold text-xs">
                              {row.winner === 'home' ? (
                                <span className="text-amber-500 font-black">{row.score} [승]</span>
                              ) : row.winner === 'away' ? (
                                <span className="text-amber-500 font-black">{row.score} [승]</span>
                              ) : row.winner === 'draw' ? (
                                <span className="text-gray-300 font-bold">{row.score} [무]</span>
                              ) : (
                                <span className="text-gray-400">{row.score}</span>
                              )}
                            </td>

                            {/* 결과 */}
                            <td className="p-3 text-center align-middle pr-6 py-4">
                              <div className="inline-block border border-emerald-900/60 text-emerald-400 bg-emerald-950/30 px-3 py-1 text-[11px] rounded font-bold tracking-tight shadow-[0_2px_4px_rgba(16,185,129,0.05)] select-none">
                                {row.statusText}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Beautiful Pagination Control */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 bg-neutral-950/20 py-4 rounded-xl border border-neutral-800/40">
                    <span className="text-[11px] font-mono text-gray-400">
                      전체 {allExpandedRows.length}개 중 {startIndex + 1}~{Math.min(startIndex + itemsPerPage, allExpandedRows.length)}개 표시 (페이지 {currentPage} / {maxPage})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Previous Button */}
                      <button
                        onClick={() => setGameResultPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-800 bg-neutral-900 text-gray-400 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap"
                      >
                        이전
                      </button>

                      {/* Numeric page buttons */}
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(maxPage, startPage + 4);
                        const adjustedStartPage = Math.max(1, endPage - 4);
                        
                        for (let i = adjustedStartPage; i <= endPage; i++) {
                          if (i >= 1 && i <= maxPage) {
                            pages.push(i);
                          }
                        }
                        
                        return pages.map(p => (
                          <button
                            key={p}
                            onClick={() => setGameResultPage(p)}
                            className={`w-8 h-8 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer border ${
                              currentPage === p
                                ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black'
                                : 'bg-neutral-900 text-gray-400 border-neutral-800/80 hover:bg-neutral-800'
                            }`}
                          >
                            {p
                          }</button>
                        ));
                      })()}

                      {/* Next Button */}
                      <button
                        onClick={() => setGameResultPage(p => Math.min(maxPage, p + 1))}
                        disabled={currentPage === maxPage}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-800 bg-neutral-900 text-gray-400 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : showMiniGame ? (
        <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]">
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowMiniGame(false)} className="hover:text-white">홈</button> &gt; 미니게임
          </div>
          <div className="flex flex-col xl:flex-row gap-6 items-start relative w-full">
            
            {/* 왼쪽 영역: 영상 및 배팅 판넬 (빨간색 테두리와 검정색 배경의 프레임) */}
            <div className="flex-[3] min-w-0 bg-black border border-red-600/50 rounded-xl shadow-2xl flex flex-col overflow-hidden xl:mr-[350px]">
              <div className="bg-neutral-950 p-4 border-b border-red-950/80 flex items-center justify-between">
                <span className="text-white font-black tracking-wider">
                  {activeMiniGameTab === 'powerball5' ? '실시간 N파워볼 (5분)' : 
                   activeMiniGameTab === 'powerball3' ? '실시간 N파워볼 (3분)' :
                   activeMiniGameTab === 'powerladder5' ? '실시간 N파워사다리 (5분)' :
                   activeMiniGameTab === 'speedladder1' ? '실시간 스피드사다리 (1분)' :
                   activeMiniGameTab === 'ladder5' ? '실시간 사다리 (5분)' : '실시간 다리다리 (3분)'}
                </span>
                <button 
                  onClick={() => setShowMiniGame(false)} 
                  className="text-gray-400 hover:text-white text-xs bg-neutral-900 px-3 py-1 rounded border border-neutral-800 transition"
                >
                  나가기
                </button>
              </div>
              
              <div className="p-2 md:p-4 bg-[#0a0e17] flex justify-center items-center overflow-auto">
                <div className="w-full max-w-[830px] overflow-x-auto overflow-y-hidden flex justify-center">
                  {activeMiniGameTab === 'powerball5' ? (
                    <iframe 
                      key="pb5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball5/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'powerball3' ? (
                    <iframe 
                      key="pb3"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball3/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball3/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'powerladder5' ? (
                    <iframe 
                      key="powerladder5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerladder5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerladder5/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'speedladder1' ? (
                    <iframe 
                      key="speedladder1"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/ladder/speedladder/mobile" : "https://xn--950bo4em5v.co/minigame/ladder/speedladder/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'ladder5' ? (
                    <iframe 
                      key="ladder5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/ladder/ladder/mobile" : "https://xn--950bo4em5v.co/minigame/ladder/ladder/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : (
                    <iframe 
                      key="daridari3"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/ladder/daridari/mobile" : "https://xn--950bo4em5v.co/minigame/ladder/daridari/pc"}
                      width={isMobile ? "360" : "830"}
                      height={isMobile ? "390" : "630"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  )}
                </div>
              </div>

              {/* 실시간 배팅 판넬 */}
              <div className="bg-[#04060b] border-t border-neutral-900 p-4 md:p-6 space-y-6">
                
                {/* 스포츠 경기 리스트 스타일의 배팅 옵션 셀렉터 - 가로 폭 전체 사용 */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-3 gap-2">
                    <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-red-600 rounded"></span>
                      실시간 회차별 배팅 보드
                    </h3>
                    <span className="text-[11px] text-amber-500 font-semibold animate-pulse">
                      * 현재 회차 + 5회차까지 실시간 배팅 메뉴가 활성화됩니다.
                    </span>
                  </div>

                  {/* 회차 빠른 필터 단축 탭 */}
                  <div className="flex flex-wrap gap-1.5 bg-[#0f1118]/80 p-2.5 rounded-lg border border-neutral-850">
                    <button
                      onClick={() => setSelectedRoundFilter('all')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                        selectedRoundFilter === 'all'
                          ? 'bg-[#d97706] text-white shadow-md'
                          : 'bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      전체보기
                    </button>
                    {getUpcomingRounds(activeMiniGameTab).map((rObj) => {
                      const isFiltered = selectedRoundFilter === rObj.round;
                      return (
                        <button
                          key={rObj.round}
                          onClick={() => setSelectedRoundFilter(rObj.round)}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                            isFiltered
                              ? 'bg-[#d97706] text-white shadow-md'
                              : 'bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {rObj.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 스포츠 배팅식 컴팩트 보드 테이블 */}
                  <div className="w-full">
                    {/* 모바일 전용 카드 리스트 */}
                    <div className="md:hidden">
                      <MobileBettingList 
                        sportsRows={sportsRows}
                        handleToggleOption={handleToggleOption}
                        activeMiniGameTab={activeMiniGameTab}
                        selectedOptions={selectedOptions}
                        secondsLeft={secondsLeft}
                        getRoundAndSecondsRemaining={getRoundAndSecondsRemaining}
                      />
                    </div>
                    {/* 데스크톱 전용 테이블 */}
                    <div className="hidden md:block overflow-x-auto w-full border border-neutral-900 rounded-xl shadow-2xl">
                      <table className="w-full text-center border-collapse text-sm min-w-[750px]">
                        <thead>
                          <tr className="bg-[#181a21] text-gray-400 font-bold border-b border-neutral-900">
                            <th className="py-2.5 px-3 text-left w-24">경기일시</th>
                            <th className="py-2.5 px-3 text-left w-48">리그 (구분)</th>
                            <th className="py-2.5 px-3 text-right">승 (홈)</th>
                            <th className="py-2.5 px-2 w-20 text-center">무 / 기준값</th>
                            <th className="py-2.5 px-3 text-left">패 (원정)</th>
                            <th className="py-2.5 px-3 w-20 text-center">스코어</th>
                            <th className="py-2.5 px-3 w-24 text-center">결과</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 bg-[#0c0e15]/90">
                          {sportsRows.map((row, idx) => {
                            const isLeftSelected = selectedOptions.some(opt =>
                              opt.round === row.round &&
                              opt.group === row.left.group &&
                              opt.name === row.left.value &&
                              opt.game === row.league &&
                              opt.gameType === activeMiniGameTab
                            );

                            const isRightSelected = selectedOptions.some(opt =>
                              opt.round === row.round &&
                              opt.group === row.right.group &&
                              opt.name === row.right.value &&
                              opt.game === row.league &&
                              opt.gameType === activeMiniGameTab
                            );

                            const isMiddleSelected =
                              row.middle &&
                              typeof row.middle === 'object' &&
                              selectedOptions.some(opt =>
                                opt.round === row.round &&
                                opt.group === (row.middle as any).group &&
                                opt.name === (row.middle as any).value &&
                                opt.game === row.league &&
                                opt.gameType === activeMiniGameTab
                              );

                            const { currentRound } = getRoundAndSecondsRemaining(activeMiniGameTab);
                            const isCurrentRound = row.round === currentRound;
                            const isClosed = isCurrentRound && secondsLeft <= 10;

                            return (
                              <tr key={`${row.round}-${idx}`} className="hover:bg-neutral-900/40 transition-colors">
                                {/* 경기일시 */}
                                <td className="py-2.5 px-3 text-left font-mono text-[11px] text-gray-400">
                                  <div className="font-semibold text-gray-500">2026-06-03</div>
                                  <div className="text-amber-500/85 font-black">{row.time}</div>
                                </td>

                                {/* 리그 (구분) */}
                                <td className="py-2.5 px-3 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-red-950 border border-red-900 text-red-400 font-extrabold px-1 py-0.5 rounded">
                                      🔴 LIVE
                                    </span>
                                    <span className="font-black text-gray-200">
                                      [{row.round}회차] {row.marketName}
                                    </span>
                                  </div>
                                </td>

                                {/* 승 (왼쪽 베팅 피스) */}
                                <td className="py-2 px-1">
                                  <button
                                    onClick={() => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
                                    className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs group ${
                                      isClosed
                                        ? 'bg-neutral-950/80 border border-neutral-900 text-gray-600 cursor-not-allowed opacity-40'
                                        : isLeftSelected
                                        ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold border border-amber-500 shadow-md shadow-amber-900/40 cursor-pointer'
                                        : 'bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 text-gray-300 cursor-pointer'
                                    }`}
                                  >
                                    <span className="font-semibold">{row.left.label}{row.left.suffix || ''}</span>
                                    <span className={`font-black ${isLeftSelected ? 'text-white' : 'text-amber-500 group-hover:text-amber-400'}`}>{row.left.dividend}</span>
                                  </button>
                                </td>

                                {/* 무 / 중간 구분값 */}
                                <td className="py-2 px-1 align-middle">
                                  {row.middle && typeof row.middle === 'object' ? (
                                    <button
                                      onClick={() => handleToggleOption((row.middle as any).group, (row.middle as any).value, (row.middle as any).dividend, row.round, row.league)}
                                      className={`w-full py-2 px-2 rounded flex items-center justify-between transition text-xs group ${
                                        isClosed
                                          ? 'bg-neutral-950/80 border border-neutral-900 text-gray-600 cursor-not-allowed opacity-40'
                                          : isMiddleSelected
                                          ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold border border-amber-500 shadow-md shadow-amber-900/40 cursor-pointer'
                                          : 'bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 text-gray-300 cursor-pointer'
                                      }`}
                                    >
                                      <span className="font-semibold">{(row.middle as any).label}</span>
                                      <span className={`font-black ${isMiddleSelected ? 'text-white' : 'text-amber-500 group-hover:text-amber-400'}`}>{(row.middle as any).dividend}</span>
                                    </button>
                                  ) : (
                                    <div className="bg-neutral-950 border border-neutral-900 py-1.5 px-2 rounded font-black text-gray-500 text-[10px] text-center select-none font-mono">
                                      {row.middle as string}
                                    </div>
                                  )}
                                </td>

                                {/* 패 (오른쪽 베팅 피스) */}
                                <td className="py-2 px-1">
                                  <button
                                    onClick={() => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
                                    className={`w-full py-2 px-3 rounded flex items-center justify-between transition text-xs group ${
                                      isClosed
                                        ? 'bg-neutral-950/80 border border-neutral-900 text-gray-600 cursor-not-allowed opacity-40'
                                        : isRightSelected
                                        ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold border border-amber-500 shadow-md shadow-amber-900/40 cursor-pointer'
                                        : 'bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 text-gray-300 cursor-pointer'
                                    }`}
                                  >
                                    <span className="font-semibold">{row.right.label}{row.right.suffix || ''}</span>
                                    <span className={`font-black ${isRightSelected ? 'text-white' : 'text-amber-500 group-hover:text-amber-400'}`}>{row.right.dividend}</span>
                                  </button>
                                </td>

                                {/* 스코어 */}
                                <td className="py-2.5 px-2 text-center text-gray-500 font-semibold font-mono text-[11px]">
                                  대기 중
                                </td>

                                {/* 결과 및 모션 상태 */}
                                <td className="py-2 px-2 text-center">
                                  {isClosed ? (
                                    <div className="bg-[#450a0a]/80 border border-red-950 text-red-500 font-extrabold text-[10px] px-2.5 py-1 rounded inline-block select-none font-mono animate-pulse">
                                      배팅마감
                                    </div>
                                  ) : (
                                    <div className="bg-[#064e3b]/80 border border-emerald-900 text-emerald-400 font-extrabold text-[10px] px-2 py-1 rounded inline-block select-none animate-pulse">
                                      배팅가능
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* 오른쪽 영역: 배팅 슬립 및 전광판 정보 - 빨간 테두리 박스 완전히 외부로 옆으로 빠짐 */}
            <div className="w-full xl:w-80 bg-neutral-900/80 border border-neutral-800/60 rounded-xl p-4 flex flex-col justify-between space-y-4 xl:fixed xl:right-6 xl:top-24 z-30 py-4 mr-[70px]">
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-400 border-b border-neutral-800/60 pb-2 flex items-center justify-between">
                  <span>나의 배팅 슬립 (Bet Slip)</span>
                  <button className="text-red-500 hover:text-red-400 font-bold transition rounded px-1 cursor-pointer text-xs" onClick={() => setSelectedOptions([])}>전체 비우기</button>
                </div>

                {/* 실시간 마감 시간 타이머 */}
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60 font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">배팅 마감시간</span>
                    <span className={`text-xs font-black flex items-center gap-1.5 ${secondsLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                      {secondsLeft <= 10 ? (
                        <span className="bg-red-950 border border-red-800 text-red-400 px-1.5 py-0.5 rounded text-[9px] font-black mr-1 animate-pulse">
                          배팅 마감
                        </span>
                      ) : (
                        <span>
                          {Math.floor(secondsLeft / 60)}분 {(secondsLeft % 60)}초
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 보유 머니 */}
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60 flex items-center justify-between">
                  <span className="text-xs text-gray-400">보유 머니</span>
                  <span className="text-sm font-black text-amber-400">
                    {userBalance.toLocaleString()}원
                  </span>
                </div>

                {/* 선택된 옵션 리스트 */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedOptions.length > 0 ? (
                    selectedOptions.map((opt, idx) => (
                      <div key={idx} className="bg-neutral-950/70 border border-neutral-800/60 p-2.5 rounded-lg flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-500 font-semibold truncate">[{opt.round}회차] {opt.game}</div>
                          <div className="font-extrabold text-white truncate">[{opt.group}] <span className="text-amber-400">{opt.name}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-500 font-mono">{opt.dividend.toFixed(2)}배</span>
                          <button 
                            onClick={() => setSelectedOptions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-gray-500 hover:text-red-500 cursor-pointer font-bold p-0.5"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-600 text-[11px] border border-dashed border-neutral-800 rounded-lg">
                      선택된 배팅 옵션이 없습니다.
                    </div>
                  )}
                </div>

                {/* 배팅 계산 및 충전 연동 */}
                {selectedOptions.length > 0 && (() => {
                  const totalDiv = parseFloat(selectedOptions.reduce((acc, current) => acc * current.dividend, 1).toFixed(2));
                  const estimatedPay = Math.floor(betAmount * totalDiv);
                  return (
                    <div className="space-y-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800/60 text-xs">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>선택 폴더</span>
                        <span className="font-bold text-white">{selectedOptions.length} 폴더</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400">
                        <span>총 배당률</span>
                        <span className="font-black text-amber-500 font-mono">{totalDiv.toFixed(2)} 배</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-400 border-t border-neutral-900 pt-2">
                        <span>예상 적중머니</span>
                        <span className="font-black text-emerald-400 font-mono">{estimatedPay.toLocaleString()} 원</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 배팅 금액 설정 인풋 */}
                <div className="space-y-2">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">배팅 금액 입력</div>
                  <div className="relative">
                    <input 
                      type="number"
                      value={betAmount || ''}
                      onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#07090e] border border-neutral-850 px-3 py-2.5 rounded-lg text-white font-mono font-black text-xs focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-right pr-8"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">원</span>
                  </div>

                  {/* 금액 빠른 설정 버튼군 */}
                  <div className="grid grid-cols-4 gap-1">
                    {[5000, 10000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setBetAmount(prev => (prev || 0) + amt)}
                        className="py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 text-[10px] text-gray-400 hover:text-white font-semibold transition cursor-pointer"
                      >
                        +{amt >= 10000 ? `${amt / 10000}만` : '5천'}
                      </button>
                    ))}
                    <button
                      onClick={() => setBetAmount(5000)}
                      className="py-1.5 rounded bg-[#450a0a]/30 hover:bg-[#450a0a]/50 border border-red-950/80 text-[10px] text-red-400 font-semibold transition cursor-pointer"
                    >
                      최소
                    </button>
                    <button
                      onClick={() => setBetAmount(Math.min(userBalance, 2000000))}
                      className="py-1.5 rounded bg-[#450a0a]/30 hover:bg-[#450a0a]/50 border border-red-950/80 text-[10px] text-red-400 font-semibold transition cursor-pointer"
                    >
                      최대
                    </button>
                    <button
                      onClick={() => setBetAmount(0)}
                      className="py-1.5 col-span-2 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-[10px] text-gray-500 font-semibold transition cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>
                </div>

                {/* 최종 배팅 제출 버튼 */}
                <button
                  disabled={selectedOptions.length === 0 || !betAmount || betAmount > userBalance}
                  onClick={handlePlaceBet}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center gap-1.5 border ${
                    selectedOptions.length === 0 || !betAmount
                      ? 'bg-neutral-900/60 border-neutral-800 text-gray-600 cursor-not-allowed'
                      : betAmount > userBalance
                      ? 'bg-red-950/80 border-red-800 text-red-400 cursor-pointer animate-pulse'
                      : 'bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 border-amber-500/50 hover:border-amber-400 text-white shadow-xl shadow-red-950/30 cursor-pointer'
                  }`}
                >
                  {betAmount > userBalance ? '잔액이 부족합니다' : '배팅하기 (PLACE BET)'}
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Main Feature Banner - High-End Luxury Cohesive VIP Cockpit Board */}
          <div className="relative max-w-[1550px] mx-auto w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 select-none">
            {/* Integrated Glow Backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-gradient-to-tr from-red-950/10 via-amber-950/10 to-transparent rounded-[100px] blur-[140px] pointer-events-none z-0"></div>

            {/* Premium Gold/Red Dual Slotted Dashboard Panel */}
            <div className="relative z-10 w-full rounded-3xl bg-gradient-to-b from-[#0c0d12]/95 via-[#06070a]/98 to-[#030304]/100 border border-red-500/15 p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* Subtle tech grid motif lines */}
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
              
              {/* Corner decorative golden metal brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/20 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/20 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/20 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/20 rounded-br-xl pointer-events-none"></div>

              <div className="flex flex-col xl:flex-row items-center justify-between gap-10 relative z-10">
                
                {/* Left Content Column - Embossed & Elegantly Spaced */}
                <div className="flex-1 space-y-6 text-center xl:text-left max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-950/80 via-black to-red-950/40 border border-red-500/30 px-3.5 py-1.5 rounded-xl text-[10px] font-black text-rose-300 tracking-wider uppercase animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    CHOICE EXOTICS CLUB
                  </div>
                  
                  <div className="space-y-3">
                    <motion.h1 
                      initial={{ x: -25, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      className="text-4xl md:text-5xl lg:text-[54px] font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-rose-100 to-amber-200 tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] leading-[1.1] italic uppercase"
                    >
                      CHOICE VIP
                    </motion.h1>
                    <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2.5 text-xs font-black tracking-widest text-amber-400">
                      <span>HIGH-STAKES SPORTS & CASINO</span>
                      <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full hidden sm:inline-block"></span>
                      <span className="text-gray-400 font-sans tracking-normal font-semibold bg-black/40 px-2 py-0.5 rounded border border-neutral-900">SEASON V</span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs md:text-[13px] leading-relaxed font-sans font-medium xl:pr-4">
                    CHOICE 는 회원님들과 클럽의 안전을 최우선으로 USDT 테더 충전방식을 도입하고있습니다. 회원님들께서는 안심하시고 이용해주시면 감사하겠습니다.<br/><br/>
                    CHOICE 는 VIP 회원들을 엄선하여 초청하며 문제가될만한 부분과 회원에 대해서는 엄격하게 통제하고있습니다.
                  </p>

                  {/* Horizontal dividers & micro badges */}
                  <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-neutral-900/80">
                    <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 backdrop-blur-sm transition-transform hover:scale-105 duration-200">
                      <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider">FERRARI REBATE</div>
                      <div className="text-xs font-black text-red-500 font-mono mt-0.5">COMBO +5%</div>
                    </div>
                    <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 backdrop-blur-sm transition-transform hover:scale-105 duration-200">
                      <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider">DAILY CASHBACK</div>
                      <div className="text-xs font-black text-amber-400 font-mono mt-0.5">UNLIMITED</div>
                    </div>
                    <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3 backdrop-blur-sm transition-transform hover:scale-105 duration-200">
                      <div className="text-[9px] text-gray-400 uppercase font-black tracking-wider">WITHDRAW SPEED</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">⚡ RAPID 1M</div>
                    </div>
                  </div>
                </div>

                {/* Laser separation Line for Desktop layout */}
                <div className="hidden xl:block w-[1px] h-64 bg-gradient-to-b from-transparent via-red-950/60 to-transparent relative self-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></div>
                </div>

                {/* Right Side - Immersive Integrated Casino & Sports Premium Tri-Showcase */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full xl:max-w-[850px]">
                  
                  {/* 1. Golden Luxury Roulette Frame */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-amber-500/25 bg-neutral-950 shadow-[0_20px_40px_rgba(0,0,0,0.9)] cursor-pointer group"
                  >
                    {/* Golden Sweep light */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent skew-x-12 z-20 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
                    
                    {/* Roulette Picture */}
                    <img
                      src="https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=800"
                      alt="Choice Premium Roulette"
                      className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stamp */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-lg">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                      <span className="text-amber-400 text-[9px] font-black tracking-widest uppercase">LUXURY ROULETTE</span>
                    </div>

                    {/* Bottom glass panel */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex flex-col gap-0.5 bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-amber-500/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                      <span className="text-[10px] font-black text-amber-300 tracking-wider uppercase">REALTIME ROYAL CASINO</span>
                      <span className="text-[8.5px] font-bold font-mono text-gray-400">OPTIMAL PLATFORM 🌐</span>
                    </div>
                  </motion.div>

                  {/* 2. High-Stakes Flying Dice Frame */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-red-500/25 bg-neutral-950 shadow-[0_20px_40px_rgba(0,0,0,0.9)] cursor-pointer group"
                  >
                    {/* Red Sweep light */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/25 to-transparent skew-x-12 z-20 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />

                    {/* Dice Picture */}
                    <img
                      src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800"
                      alt="Choice Premium Vegas Dice"
                      className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stamp */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-500/30 shadow-lg">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                      <span className="text-rose-450 text-[9px] font-black tracking-widest uppercase">HIGH-STAKES DICE</span>
                    </div>

                    {/* Bottom glass panel */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex flex-col gap-0.5 bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-red-500/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                      <span className="text-[10px] font-black text-red-450 tracking-wider uppercase">ULTIMATE WINNER CRAFT</span>
                      <span className="text-[8.5px] font-bold font-mono text-gray-400 font-black text-rose-300">JACKPOT ENABLED ✨</span>
                    </div>
                  </motion.div>

                  {/* 3. Live NBA Sports Frame */}
                  <motion.div
                    whileHover={{ y: -8, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-emerald-500/25 bg-neutral-950 shadow-[0_20px_40px_rgba(0,0,0,0.9)] cursor-pointer group"
                  >
                    {/* Emerald sweep light */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent skew-x-12 z-20 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />

                    {/* NBA Basketball Player Action */}
                    <img
                      src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800"
                      alt="Choice Live Sports NBA Basketball"
                      className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stamp */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-lg">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400 text-[9px] font-black tracking-widest uppercase">NBA & LIVE SPORTS</span>
                    </div>

                    {/* Bottom glass panel */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex flex-col gap-0.5 bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-emerald-500/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                      <span className="text-[10px] font-black text-emerald-450 tracking-wider uppercase">GLOBAL REALTIME MATCH</span>
                      <span className="text-[8.5px] font-black font-mono text-emerald-300">LIVE INDOOR COURT 🏀</span>
                    </div>
                  </motion.div>
                  
                </div>

              </div>
            </div>
          </div>

          {/* Main Categories Section */}
          <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-red-500 rounded"></span>
                <h2 className="text-2xl font-black text-white tracking-wider">주요 게임 장르</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: '스포츠', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=500' },
                  { label: '카지노', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500' },
                  { label: '슬롯게임', img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=500' },
                  { label: '미니게임', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=500' },
                  { label: '경기결과', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500' },
                  { label: '공지사항', img: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=500' }
                ].map((cat, idx) => (
                  <motion.div 
                    whileHover={{ y: -6, scale: 1.02 }}
                    key={idx} 
                    onClick={() => {
                      if (cat.label === '미니게임') {
                        setActiveMiniGameTab('powerball3');
                        setShowMiniGame(true);
                        setShowMyPage(false);
                        setShowBetHistory(false);
                        setShowDepositScreen(false);
                        setShowWithdrawalScreen(false);
                        setShowSupportScreen(false);
                        setShowGameResultScreen(false);
                      } else if (cat.label === '경기결과') {
                        setShowGameResultScreen(true);
                        setShowWithdrawalScreen(false);
                        setShowDepositScreen(false);
                        setShowMyPage(false);
                        setShowMiniGame(false);
                        setShowBetHistory(false);
                        setShowSupportScreen(false);
                      } else {
                        alert(`${cat.label} 기능은 준비 중입니다.`);
                      }
                    }}
                    className="relative h-40 bg-gray-900 border border-gray-800 rounded overflow-hidden shadow-lg group cursor-pointer"
                  >
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-cover bg-center"
                      style={{ backgroundImage: `url(${cat.img})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-10">
                      <p className="text-lg font-black tracking-wide text-white group-hover:text-amber-400 transition-colors">{cat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Brand Logos */}
            <div className="pt-6 border-t border-gray-800/60">
              <h3 className="text-gray-500 text-xs font-bold tracking-[0.3em] uppercase mb-4">Official Partners</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center place-items-center opacity-45">
                {['Evolution Gaming', 'Microgaming', 'Pragmatic Play', 'Dream Gaming', 'Asia Gaming', 'BOTA Casino'].map((partner, idx) => (
                  <span key={idx} className="text-sm font-bold text-gray-400 tracking-tight italic select-none">{partner}</span>
                ))}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-black/80 py-8 border-t border-gray-900 text-center text-xs text-gray-600">
            <p className="tracking-wide">초이스 상담을 원하시는 회원님은 고객문의를 통해 문의해주세요.</p>
            <p className="mt-2 text-[10px] text-gray-700">Copyright 2017 © CHOICE Corp. All Rights Reserved.</p>
          </footer>
        </>
      )}

      {/* Admin Panel Modal Overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-red-600/50 rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden max-h-screen"
          >
            {/* Modal Header */}
            <div className="bg-neutral-950 p-4 border-b border-red-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 font-extrabold tracking-wider">
                <Shield className="w-5 h-5 animate-pulse" />
                <span>CHOICE - 운영진 어드민 패널 (Admin Control Console)</span>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Info Stats Alert Bar */}
            <div className="bg-red-950/10 border-b border-red-900/20 px-6 py-3 flex items-center justify-between text-xs text-gray-400 font-bold">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-red-450 animate-pulse" /> 실시간 Firestore 연동</span>
                <div className="flex bg-neutral-900 rounded-md p-1 border border-neutral-800">
                  <button
                    onClick={() => setAdminActiveTab('users')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'users' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Users className="w-3 h-3" /> 회원정보 관리 ({adminUsers.length}명)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('deposits');
                      loadAllDepositRequests();
                    }}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'deposits' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Coins className="w-3 h-3" /> 입금신청 승인대기 ({adminDepositRequests.filter(r => r.status === 'pending').length}건)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('withdrawals');
                      loadAllWithdrawalRequests();
                    }}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'withdrawals' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Coins className="w-3 h-3 rotate-180 text-amber-500" /> 출금신청 승인대기 ({adminWithdrawalRequests.filter(r => r.status === 'pending').length}건)
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('settings')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'settings' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Settings className="w-3 h-3 text-amber-500" /> 환율 설정
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('inquiries')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'inquiries' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Shield className="w-3 h-3 text-red-400" /> 1:1 문의관리 ({adminInquiries.length}건)
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('matches')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'matches' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Edit className="w-3 h-3 text-white" /> 경기 등록
                  </button>
                </div>
              </div>
              <button 
                onClick={() => {
                  loadAllUsers();
                  loadAllDepositRequests();
                  loadAllWithdrawalRequests();
                }} 
                className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-white px-2.5 py-1 rounded border border-neutral-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${(isLoadingUsers || isLoadingAdminDeposits || isLoadingAdminWithdrawals) ? 'animate-spin' : ''}`} /> 전체 새로고침
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {adminActiveTab === 'deposits' ? (
                <div className="space-y-4">
                  {/* Deposit Header Stats */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-black/60 p-4 rounded border border-neutral-800 gap-2">
                    <span className="text-xs font-bold text-gray-400">전체 입금 실시간 대기 건수: <strong className="text-amber-400 font-mono">{adminDepositRequests.filter(r => r.status === 'pending').length}건</strong></span>
                    <span className="text-[10px] text-gray-500 font-semibold">※ 승인 시 회원의 시뮬레이터 원화 보유금액이 즉시 충전 처리됩니다.</span>
                  </div>

                  {isLoadingAdminDeposits ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                      <p className="text-gray-405 text-sm">입금 내역을 동기화하는 중입니다...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-800 rounded bg-black/30">
                      <table className="w-full text-center text-xs text-gray-300">
                        <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-3 text-center w-36">신청시간</th>
                            <th className="p-3 text-left">회원정보 (ID/닉네임)</th>
                            <th className="p-3 text-left">발신 테더 지갑 주소</th>
                            <th className="p-3 text-center">신청수량 (USDT)</th>
                            <th className="p-3 text-center">전환금액 (KRW)</th>
                            <th className="p-3 text-center w-36">처리시간</th>
                            <th className="p-3 text-center w-24">처리상태</th>
                            <th className="p-3 text-center w-32">승인제어</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono">
                          {adminDepositRequests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-12 text-center text-gray-500">
                                접수된 테더 입금 신청 건이 존재하지 않습니다.
                              </td>
                            </tr>
                          ) : (
                            adminDepositRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-neutral-850/30 transition text-xs">
                                <td className="p-3 text-gray-400 text-[11px] font-semibold text-center">{formatDateStr(req.createdAt)}</td>
                                <td className="p-3 text-left font-sans">
                                  <span className="text-white font-bold block">{req.username}</span>
                                  <span className="text-amber-500 font-semibold text-[10px] block">{req.nickname || '-'}</span>
                                </td>
                                <td className="p-3 text-left max-w-[150px] truncate font-mono text-gray-400 font-semibold" title={req.tetherWalletAddress}>
                                  {req.tetherWalletAddress || '-'}
                                </td>
                                <td className="p-3 text-amber-400 font-black text-center text-[11px]">{req.amountUsdt} USDT</td>
                                <td className="p-3 text-emerald-400 font-black text-center text-[11px]">{(req.amountKrw || 0).toLocaleString()}원</td>
                                <td className="p-3 text-gray-400 text-[11px] text-center">{req.processedAt ? formatDateStr(req.processedAt) : '-'}</td>
                                <td className="p-3 text-center font-sans">
                                  {req.status === 'pending' && <span className="bg-amber-950/70 text-amber-400 border border-amber-805 px-2 py-0.5 rounded text-[10px] font-extrabold animate-pulse">대기중</span>}
                                  {req.status === 'approved' && <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-805 px-2 py-0.5 rounded text-[10px] font-extrabold">승인완료</span>}
                                  {req.status === 'rejected' && <span className="bg-red-950/70 text-red-400 border border-red-805 px-2 py-0.5 rounded text-[10px] font-extrabold">취소/거절</span>}
                                </td>
                                <td className="p-3 text-center font-sans">
                                  {req.status === 'pending' ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          console.log("Deposit button clicked:", { id: req.id, userId: req.userId, amountKrw: req.amountKrw });
                                          handleAcceptDeposit(req.id, req.userId, req.amountKrw);
                                        }}
                                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded text-[10px] cursor-pointer transition shadow border border-emerald-700/40 text-nowrap"
                                      >
                                        승인
                                      </button>
                                      <button
                                        onClick={() => handleRejectDeposit(req.id)}
                                        className="bg-red-950 hover:bg-red-900 text-red-200 px-2 py-1 rounded text-[10px] cursor-pointer border border-red-900/40 text-nowrap"
                                      >
                                        거절
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 font-extrabold text-[10px] uppercase">완료됨</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : adminActiveTab === 'withdrawals' ? (
                <div className="space-y-4">
                  {/* Withdrawal Header Stats */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-black/60 p-4 rounded border border-neutral-800 gap-2">
                    <span className="text-xs font-bold text-gray-400">전체 출금(환전) 실시간 대기 건수: <strong className="text-amber-400 font-mono">{adminWithdrawalRequests.filter(r => r.status === 'pending').length}건</strong></span>
                    <span className="text-[10px] text-gray-500 font-semibold">※ 거절 시 회원의 차감된 보유머니가 원화로 자동 환불 처리됩니다.</span>
                  </div>

                  {isLoadingAdminWithdrawals ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                      <p className="text-gray-405 text-sm">출금 내역을 동기화하는 중입니다...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-800 rounded bg-black/30">
                      <table className="w-full text-center text-xs text-gray-300">
                        <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-3 text-center w-36">신청시간</th>
                            <th className="p-3 text-left">회원정보 (ID/닉네임)</th>
                            <th className="p-3 text-left">수신 테더 지갑 주소</th>
                            <th className="p-3 text-center">신청수량 (USDT)</th>
                            <th className="p-3 text-center">전환금액 (KRW)</th>
                            <th className="p-3 text-center w-36">처리시간</th>
                            <th className="p-3 text-center w-24">처리상태</th>
                            <th className="p-3 text-center w-32">승인제어</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono">
                          {adminWithdrawalRequests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-12 text-center text-gray-500 font-bold">
                                접수된 테더 출금(환전) 신청 건이 존재하지 않습니다.
                              </td>
                            </tr>
                          ) : (
                            adminWithdrawalRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-neutral-850/30 transition text-xs">
                                <td className="p-3 text-gray-400 text-[11px] font-semibold text-center">{formatDateStr(req.createdAt)}</td>
                                <td className="p-3 text-left font-sans">
                                  <span className="text-white font-bold block">{req.username}</span>
                                  <span className="text-amber-500 font-semibold text-[10px] block">{req.nickname || '-'}</span>
                                </td>
                                <td className="p-3 text-left max-w-[150px] truncate font-mono text-gray-400 font-semibold" title={req.tetherWalletAddress}>
                                  {req.tetherWalletAddress || '-'}
                                </td>
                                <td className="p-3 text-amber-400 font-black text-center text-[11px]">{req.amountUsdt} USDT</td>
                                <td className="p-3 text-emerald-400 font-black text-center text-[11px]">{(req.amountKrw || 0).toLocaleString()}원</td>
                                <td className="p-3 text-gray-400 text-[11px] text-center">{req.processedAt ? formatDateStr(req.processedAt) : '-'}</td>
                                <td className="p-3 text-center font-sans">
                                  {req.status === 'pending' && <span className="bg-amber-950/70 text-amber-400 border border-amber-805 px-2 py-0.5 rounded text-[10px] font-extrabold animate-pulse">대기중</span>}
                                  {req.status === 'approved' && <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-805 px-2 py-0.5 rounded text-[10px] font-extrabold">승인완료</span>}
                                  {req.status === 'rejected' && <span className="bg-red-950/70 text-red-400 border border-red-805 px-2 py-0.5 rounded text-[10px] font-extrabold">취소/거절</span>}
                                </td>
                                <td className="p-3 text-center font-sans">
                                  {req.status === 'pending' ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleAcceptWithdrawal(req.id)}
                                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded text-[10px] cursor-pointer transition shadow border border-emerald-700/40 text-nowrap"
                                      >
                                        승인
                                      </button>
                                      <button
                                        onClick={() => handleRejectWithdrawal(req.id, req.userId, req.amountKrw)}
                                        className="bg-red-950 hover:bg-red-900 text-red-200 px-2 py-1 rounded text-[10px] cursor-pointer border border-red-900/40 text-nowrap"
                                      >
                                        거절
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 font-extrabold text-[10px] uppercase">완료됨</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : adminActiveTab === 'matches' ? (
                <AdminMatchRegistration />
              ) : adminActiveTab === 'inquiries' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/60 p-4 rounded border border-neutral-800">
                    <span className="text-xs font-bold text-gray-400">전체 문의 건수: <strong className="text-amber-400 font-mono">{adminInquiries.length}건</strong> (대기중: <strong className="text-rose-500 font-mono">{adminInquiries.filter(i => i.status === 'pending').length}건</strong>)</span>
                    <span className="text-[10px] text-gray-500 font-semibold">※ 회원의 1:1 Q&A 문의 리스트입니다. 각 문의를 클릭하여 실시간 답변을 등록할 수 있습니다.</span>
                  </div>

                  <div className="overflow-x-auto border border-neutral-800 rounded bg-black/30">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800 font-black">
                        <tr>
                          <th className="p-3 text-center w-12">번호</th>
                          <th className="p-3 text-gray-300">제목</th>
                          <th className="p-3 w-32 text-gray-300">작성자(닉네임/ID)</th>
                          <th className="p-3 w-36 text-center text-gray-300">신청시간</th>
                          <th className="p-3 w-20 text-center text-gray-300">처리상태</th>
                          <th className="p-3 w-16 text-center text-gray-300">동작</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-xs">
                        {adminInquiries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-500 font-bold">
                              접수된 1:1 문의사항이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          adminInquiries.map((req, index) => {
                            const isExpanded = selectedInquiryDetail?.id === req.id;
                            return (
                              <React.Fragment key={req.id}>
                                <tr className="hover:bg-neutral-850/20 transition cursor-pointer">
                                  <td className="p-3 text-center text-gray-500 font-mono">{adminInquiries.length - index}</td>
                                  <td className="p-3">
                                    <button
                                      onClick={() => {
                                        setSelectedInquiryDetail(isExpanded ? null : req);
                                        setAdminReplyText(req.reply || '');
                                      }}
                                      className="text-left font-bold text-gray-200 hover:text-amber-400 block w-full focus:outline-none transition cursor-pointer"
                                    >
                                      {req.title}
                                    </button>
                                  </td>
                                  <td className="p-3 font-semibold text-gray-200">
                                    <span className="block font-bold text-gray-150">{req.nickname}</span>
                                    <span className="block text-[10px] text-gray-400 font-mono">({req.username})</span>
                                  </td>
                                  <td className="p-3 text-center text-gray-400 font-mono text-[11px]">{new Date(req.createdAt).toLocaleString('ko-KR')}</td>
                                  <td className="p-3 text-center font-sans">
                                    {req.status === 'pending' ? (
                                      <span className="bg-amber-955 border border-amber-900 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold animate-pulse">답변대기</span>
                                    ) : (
                                      <span className="bg-emerald-955 border border-emerald-900 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">답변완료</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteInquiry(req.id);
                                      }}
                                      className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-955/25 cursor-pointer"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                                
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={6} className="p-0 bg-neutral-950/90">
                                      <div className="p-5 border border-neutral-850 m-2 rounded-lg space-y-4 text-xs text-gray-300">
                                        <div className="border-b border-neutral-800 pb-3">
                                          <div className="text-[10px] text-amber-500 font-black tracking-wider uppercase">Inquiry Message from user (회원 질문 내용):</div>
                                          <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs text-gray-100 mt-2 bg-neutral-900 p-4 rounded border border-neutral-850">{req.content}</p>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="text-[10px] text-red-500 font-black tracking-wider uppercase flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" /> Write operator response (운영자 답변 메시지 등록):
                                          </div>
                                          <textarea
                                            rows={4}
                                            value={adminReplyText}
                                            onChange={(e) => setAdminReplyText(e.target.value)}
                                            placeholder="회원에게 전송할 성실한 답변 메시지를 기재해 주세요."
                                            className="w-full bg-[#111217] border border-neutral-800 hover:border-neutral-750 focus:border-red-650 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none font-medium leading-relaxed resize-none font-sans"
                                          />
                                          <div className="flex justify-end gap-2 text-xs">
                                            <button
                                              onClick={() => setSelectedInquiryDetail(null)}
                                              className="bg-neutral-850 hover:bg-neutral-800 text-gray-300 px-3 py-1.5 rounded font-bold border border-neutral-700 transition cursor-pointer active:scale-95 text-[11px]"
                                            >
                                              닫기
                                            </button>
                                            <button
                                              onClick={() => handleAnswerInquiry(req.id, adminReplyText)}
                                              className="bg-red-700 hover:bg-red-600 border border-red-650 text-white px-4 py-1.5 rounded font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 text-[11px]"
                                            >
                                              <Save className="w-3.5 h-3.5" /> 답변 등록/수정
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : adminActiveTab === 'settings' ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white mb-4">환율 설정</h3>
                  <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      value={newExchangeRate || ''}
                      onChange={(e) => setNewExchangeRate(e.target.value)}
                      placeholder={String(exchangeRate)}
                      className="bg-black border border-neutral-700 text-white px-3 py-2 rounded text-sm w-40"
                    />
                    <button
                      onClick={async () => {
                         const rate = Number(newExchangeRate);
                         if(rate <= 0) { alert("올바른 환율을 입력하세요."); return; }
                         await setDoc(doc(db, 'appSettings', 'general'), { usdtToKrwRate: rate });
                         setExchangeRate(rate);
                         alert("환율이 업데이트되었습니다.");
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="아이디 또는 닉네임으로 회원 검색..." 
                      value={searchQuery || ''}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-red-600 text-sm"
                    />
                  </div>

                  {/* Loader */}
                  {isLoadingUsers ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                      <p className="text-gray-400 text-sm">Firestore에서 회원 정보를 읽어오는 중입니다...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-800 rounded bg-black/30">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-3">가입코드</th>
                            <th className="p-3">아이디</th>
                            <th className="p-3">비밀번호</th>
                            <th className="p-3">닉네임</th>
                            <th className="p-3">테더 지갑 주소</th>
                            <th className="p-3">출금비밀번호</th>
                            <th className="p-3">보유금액</th>
                            <th className="p-3">포인트</th>
                            <th className="p-3 text-center">동작</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                          {adminUsers
                            .filter(u => {
                              const qStr = searchQuery.toLowerCase();
                              return (u.username || '').toLowerCase().includes(qStr) || 
                                     (u.nickname || '').toLowerCase().includes(qStr);
                            })
                            .map((user) => {
                              const isEditing = editingUserId === user.id;
                              return (
                                <tr key={user.id} className="hover:bg-neutral-850/40 transition">
                                  <td className="p-3 font-mono text-amber-500 font-bold">{user.joinCode || '5882'}</td>
                                  <td className="p-3 font-bold text-white">{user.username}</td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <input 
                                        type="text" 
                                        value={editingPassword || ''}
                                        onChange={(e) => setEditingPassword(e.target.value)}
                                        className="bg-black border border-red-500/40 rounded px-2 py-1 text-white font-mono w-28 text-xs focus:outline-none"
                                      />
                                    ) : (
                                      <span className="font-mono text-red-400/85">{user.password}</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold">
                                    {isEditing ? (
                                      <input 
                                        type="text" 
                                        value={editingNickname || ''}
                                        onChange={(e) => setEditingNickname(e.target.value)}
                                        className="bg-black border border-red-500/40 rounded px-2 py-1 text-white w-24 text-xs focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-sky-400">{user.nickname || '-'}</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {isEditing ? (
                                      <input 
                                        type="text" 
                                        value={editingWallet || ''}
                                        onChange={(e) => setEditingWallet(e.target.value)}
                                        className="bg-black border border-red-500/40 rounded px-2 py-1 text-white w-full max-w-sm text-xs focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-gray-400 text-[11px] truncate max-w-[250px] inline-block" title={user.tetherWalletAddress}>
                                        {user.tetherWalletAddress || '-'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-amber-500/80 text-xs">
                                    {user.withdrawalPassword || '-'}
                                  </td>
                                  <td className="p-3 font-bold font-mono text-emerald-400 text-xs">
                                    {isEditing ? (
                                      <input 
                                        type="number" 
                                        value={editingBalance ?? 0}
                                        onChange={(e) => setEditingBalance(Number(e.target.value) || 0)}
                                        className="bg-black border border-red-500/40 rounded px-2 py-0.5 text-white font-mono w-24 text-xs focus:outline-none"
                                      />
                                    ) : (
                                      `${(user.balance !== undefined ? user.balance : 5000000).toLocaleString()}원`
                                    )}
                                  </td>
                                  <td className="p-3 font-bold font-mono text-cyan-400 text-xs">
                                    {isEditing ? (
                                      <input 
                                        type="number" 
                                        value={editingPoints ?? 0}
                                        onChange={(e) => setEditingPoints(Number(e.target.value) || 0)}
                                        className="bg-black border border-red-500/40 rounded px-2 py-0.5 text-white font-mono w-24 text-xs focus:outline-none"
                                      />
                                    ) : (
                                      `${(user.points !== undefined ? user.points : 50000).toLocaleString()}P`
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isEditing ? (
                                        <>
                                          <button 
                                            onClick={() => handleSaveEdit(user.id)}
                                            className="bg-green-950 hover:bg-green-900 border border-green-800 text-green-400 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                          >
                                            저장
                                          </button>
                                          <button 
                                            onClick={() => setEditingUserId(null)}
                                            className="bg-neutral-850 hover:bg-neutral-800 text-gray-300 px-2.5 py-1 rounded text-[11px] cursor-pointer"
                                          >
                                            취소
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => handleStartEdit(user)}
                                            className="bg-blue-950 hover:bg-blue-900/60 border border-blue-900/50 text-blue-400 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                          >
                                            수정
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-red-950/60 hover:bg-red-900/60 border border-red-900/50 text-red-400 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                          >
                                            삭제
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {adminUsers.length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-gray-500">
                                가입된 회원이 존재하지 않습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-neutral-950 p-4 border-t border-red-950/80 flex justify-between items-center text-xs text-gray-500">
              <p>어드민 가이드: 비밀번호, 닉네임, 지갑 주소를 실시간 수동 관리할 수 있습니다.</p>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-white font-bold px-4 py-2 border border-neutral-700 rounded cursor-pointer text-xs"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showAttendanceChecker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-2xl bg-black border border-amber-500 rounded-xl p-6">
            <button 
              onClick={() => {console.log("Closing modal; userId passed was:", currentUserData?.id); setShowAttendanceChecker(false);}}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X />
            </button>
            <AttendanceChecker userId={currentUserData?.id || ''} />
          </div>
        </div>
      )}
    </div>
  );
}
