import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Shield, Users, Database, X, RefreshCw, Edit, Save, Trash2, Search } from 'lucide-react';

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
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [showMiniGameSubmenu, setShowMiniGameSubmenu] = useState(false);
  const miniGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeMiniGameTab, setActiveMiniGameTab] = useState<'powerball5' | 'powerball3' | 'ladder5' | 'daridari3'>('powerball5');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    const iframeOffset = tab.includes('5') ? 25 : 15;
    const adjustedSeconds = secondsInDay + iframeOffset;
    
    const interval = tab.includes('5') ? 5 : 3;
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

  // Timer Effect for Live Draw Simulation
  useEffect(() => {
    let interval: any = null;
    if (isDrawing && drawingTimer > 0) {
      interval = setInterval(() => {
        setDrawingTimer(prev => prev - 1);
      }, 1000);
    } else if (isDrawing && drawingTimer === 0) {
      resolveBets();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDrawing, drawingTimer]);

  const resolveBets = async () => {
    setIsDrawing(false);
    if (!currentUserData) return;

    const currentBets = [...(currentUserData.bets || [])];
    const pendingIndex = currentBets.findIndex(b => b.status === 'pending');
    if (pendingIndex === -1) return;

    const activeBet = currentBets[pendingIndex];
    let isWin = false;
    let winningOutcome = '';

    const rollSingleFolder = (folder: any) => {
      let isWinFolder = false;
      let folderOutcome = '';

      if (folder.gameType === 'powerball5' || folder.gameType === 'powerball3') {
        if (folder.group === '일반볼') {
          const rolledOddEven = Math.random() < 0.5 ? '홀' : '짝';
          const rolledUnderOver = Math.random() < 0.5 ? '언더' : '오버';
          if (folder.option === '홀' || folder.option === '짝') {
            isWinFolder = folder.option === rolledOddEven;
            folderOutcome = `${rolledOddEven}`;
          } else {
            isWinFolder = folder.option === rolledUnderOver;
            folderOutcome = `${rolledUnderOver}`;
          }
        } else if (folder.group === '일반볼 대중소') {
          const roll = Math.random();
          const rolledSize = roll < 0.3 ? '소' : roll < 0.7 ? '중' : '대';
          isWinFolder = folder.option === rolledSize;
          folderOutcome = `${rolledSize}`;
        } else if (folder.group === '파워볼') {
          const rolledOddEven = Math.random() < 0.5 ? '홀' : '짝';
          const rolledUnderOver = Math.random() < 0.5 ? '언더' : '오버';
          if (folder.option === '홀' || folder.option === '짝') {
            isWinFolder = folder.option === rolledOddEven;
            folderOutcome = `${rolledOddEven}`;
          } else {
            isWinFolder = folder.option === rolledUnderOver;
            folderOutcome = `${rolledUnderOver}`;
          }
        }
      } else {
        const outcomesLeftRight = Math.random() < 0.5 ? '좌' : '우';
        const outcomesLines = Math.random() < 0.5 ? '3줄' : '4줄';
        const outcomesOddEven = Math.random() < 0.5 ? '홀' : '짝';

        if (folder.group === '출발지') {
          isWinFolder = folder.option === outcomesLeftRight;
          folderOutcome = `${outcomesLeftRight}`;
        } else if (folder.group === '줄개수') {
          isWinFolder = folder.option === outcomesLines;
          folderOutcome = `${outcomesLines}`;
        } else if (folder.group === '최종결과') {
          isWinFolder = folder.option === outcomesOddEven;
          folderOutcome = `${outcomesOddEven}`;
        }
      }
      return { isWinFolder, folderOutcome };
    };

    if (activeBet.folders && activeBet.folders.length > 0) {
      // It is a combined parlay bet
      const updatedFolders = activeBet.folders.map((f: any) => {
        const { isWinFolder, folderOutcome } = rollSingleFolder(f);
        return {
          ...f,
          status: isWinFolder ? 'win' : 'lose',
          rollResult: folderOutcome
        };
      });

      isWin = updatedFolders.every((f: any) => f.status === 'win');
      winningOutcome = updatedFolders.map((f: any) => `${f.option}➔[${f.rollResult}]`).join(', ');
      activeBet.folders = updatedFolders;
    } else {
      // Legacy single folder bet
      const { isWinFolder, folderOutcome } = rollSingleFolder({
        gameType: activeBet.gameType,
        group: activeBet.group,
        option: activeBet.option
      });
      isWin = isWinFolder;
      winningOutcome = `${activeBet.group} [${folderOutcome}]`;
    }

    activeBet.status = isWin ? 'win' : 'lose';
    activeBet.rollResult = winningOutcome;

    let finalBalance = userBalance;
    let finalPoints = userPoints;
    let AlertMessage = '';

    if (isWin) {
      const payout = Math.floor(activeBet.amount * activeBet.dividend);
      finalBalance = userBalance + payout;
      const ptsReward = Math.floor(activeBet.amount * 0.01);
      finalPoints = userPoints + ptsReward;

      AlertMessage = `🎉 [배팅 적중] 축하합니다!\n\n결과: ${winningOutcome}\n배팅 정보: ${activeBet.game}\n당첨 금액: +${payout.toLocaleString()}원\n포인트 적립: +${ptsReward.toLocaleString()}P`;
    } else {
      AlertMessage = `😢 [배팅 낙첨] 아쉽게도 낙첨되었습니다.\n\n결과: ${winningOutcome}\n배팅 정보: ${activeBet.game}\n배팅 금액 ${activeBet.amount.toLocaleString()}원이 차감되었습니다.`;
    }

    setUserBalance(finalBalance);
    setUserPoints(finalPoints);

    const updatedBets = [...currentBets];
    updatedBets[pendingIndex] = activeBet;

    setCurrentUserData(prev => ({
      ...prev,
      balance: finalBalance,
      points: finalPoints,
      bets: updatedBets
    }));

    try {
      await updateDoc(doc(db, 'users', currentUserData.id), {
        balance: finalBalance,
        points: finalPoints,
        bets: updatedBets
      });
    } catch (e) {
      console.error("Failed to resolve bet on database: ", e);
    }

    alert(AlertMessage);
  };

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
    if (isDrawing) {
      alert('이미 추첨 중인 배팅이 있습니다. 결과 처리를 기다리세요.');
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

    try {
      await updateDoc(doc(db, 'users', currentUserData.id), {
        balance: nextBalance,
        bets: updatedBets
      });
    } catch (e) {
      console.error("Failed to place bet on Firestore: ", e);
    }

    setSelectedOptions([]); // Clear selected options list
    setIsDrawing(true);
    setDrawingTimer(6); // 6 seconds live draw count down!
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
        setCurrentUser(userObj);
        if (userObj.nickname) {
          setNickname(userObj.nickname);
        }
        // Designate windo086 or windos086 as admin/operator
        if (userObj.username === 'windo086' || userObj.username === 'windos086') {
          setIsAdmin(true);
        }

        // Synchronize dynamic balances on boot
        const fetchUserMainDoc = async () => {
          try {
            const q = query(collection(db, 'users'), where('username', '==', userObj.username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              const data = docSnap.data();
              const bal = data.balance !== undefined ? data.balance : 5000000;
              const pts = data.points !== undefined ? data.points : 50000;
              
              if (data.balance === undefined || data.points === undefined) {
                await updateDoc(doc(db, 'users', docSnap.id), {
                  balance: bal,
                  points: pts
                });
              }
              setUserBalance(bal);
              setUserPoints(pts);
              setCurrentUserData({ id: docSnap.id, ...data, balance: bal, points: pts });
            }
          } catch (e) {
            console.error("Error matching profile info: ", e);
          }
        };
        fetchUserMainDoc();
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Fetch updated user data when opening My Page or syncing stats
  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        try {
          const q = query(collection(db, 'users'), where('username', '==', currentUser.username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            const bal = data.balance !== undefined ? data.balance : 5000000;
            const pts = data.points !== undefined ? data.points : 50000;
            
            setUserBalance(bal);
            setUserPoints(pts);
            setCurrentUserData({ id: docSnap.id, ...data, balance: bal, points: pts });
          }
        } catch (e) {
          console.error("Error fetching user data:", e);
        }
      };
      fetchUserData();
    }
  }, [showMyPage, showMiniGame, currentUser]);

  // Fetch registered users for administrative action
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminUsers(list);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAdminPanel) {
      loadAllUsers();
    }
  }, [showAdminPanel]);

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
      
      await updateDoc(doc(db, 'users', userId), {
        nickname: editingNickname,
        tetherWalletAddress: editingWallet,
        password: editingPassword,
        withdrawalPassword: editingWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      });
      
      setAdminUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        nickname: editingNickname, 
        tetherWalletAddress: editingWallet,
        password: editingPassword,
        withdrawalPassword: editingWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      } : u));

      // Sync local profile state if editing self
      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        setUserPoints(nextPts);
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

  const handleLogoutClick = () => {
    localStorage.removeItem('currentUser');
    onLogout();
  };

  const sportsRows = getSportsTableRows();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Top GNB Bar */}
      <header className="bg-neutral-900 border-b border-gray-800 px-6 py-4 flex flex-col items-center gap-4 relative">
        {/* Admin Menu Switch for Operators (Top Right on desktop) */}
        {isAdmin && (
          <div className="sm:absolute sm:top-5 sm:right-6 mt-1 sm:mt-0 z-30">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold px-3.5 py-2 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/30 text-xs transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 animate-pulse text-red-150" />
              어드민 관리자 메뉴
            </button>
          </div>
        )}

        {/* Logo */}
        <button 
          onClick={() => {
            setShowMyPage(false);
            setShowMiniGame(false);
          }}
          className="text-3xl font-extrabold text-red-600 tracking-tighter italic cursor-pointer relative pt-3 pb-1"
        >
          <span className="inline-flex items-center">
            <span className="relative inline-block mr-0.5">
              {/* Redesigned brilliant gold crown scaled perfectly above slanted 'C' */}
              <svg 
                className="absolute -top-[15px] left-1/2 -translate-x-[35%] w-5.5 h-4.5 text-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.6)] mt-[5px] mr-0 mb-0" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 5l3.5 6 5.5-4-2.5 10H5.5L3 7l5.5 4z" />
                <circle cx="12" cy="4" r="1.2" fill="#fef08a" />
                <circle cx="3" cy="6" r="1.2" fill="#fef08a" />
                <circle cx="21" cy="6" r="1.2" fill="#fef08a" />
              </svg>
              <span>C</span>
            </span>
            <span>HOICE</span>
            <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-3 border-l border-neutral-700/60 pl-3">Sports & Casino</span>
          </span>
        </button>

        {/* Navigation Menus (Centered) */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-300">
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
                    onClick={() => setShowMiniGameSubmenu(prev => !prev)}
                    className="hover:text-amber-400 transition-colors"
                  >
                    미니게임
                  </button>
                  {showMiniGameSubmenu && (
                    <div 
                      className="absolute top-full left-0 w-32 bg-neutral-800 border border-neutral-700 rounded shadow-xl mt-1 z-[999] overflow-hidden p-1 space-y-1"
                      onMouseEnter={openMiniGameSubmenu}
                      onMouseLeave={closeMiniGameSubmenu}
                    >
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball5'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        N파워볼 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball3'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        N파워볼 (3분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('ladder5'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        사다리 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('daridari3'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        다리다리 (3분)
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button 
                key={item} 
                onClick={() => {
                  alert(`${item} 기능은 준비 중입니다.`);
                }}
                className="hover:text-amber-400 transition-colors"
              >
                {item}
              </button>
            );
          })}
        </nav>

        {/* User Stats and Actions (Centered with individual pill styling from the screenshot) */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs w-full max-w-full my-1 select-none">
          {/* Level & Nickname Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-extrabold">Lv17</span>
            <span className="text-white font-bold">{nickname}님</span>
          </div>

          {/* Holdings Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">보유금액</span>
            <span className="text-white font-bold">{userBalance.toLocaleString()} 원</span>
          </div>

          {/* Points Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">포인트</span>
            <span className="text-white font-bold">{userPoints.toLocaleString()} P</span>
          </div>

          {/* Messages Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">받은 쪽지</span>
            <span className="text-white font-bold">0 개</span>
          </div>

          {/* My Page Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => setShowMyPage(true)}
          >
            My Page
          </button>

          {/* Attendance Calendar Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => alert('출석달력 준비 중입니다.')}
          >
            출석달력
          </button>

          {/* Customer Center Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => alert('고객센터 준비 중입니다.')}
          >
            고객센터
          </button>

          {/* Logout Button */}
          <button 
            type="button"
            onClick={handleLogoutClick}
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#3a1a1a] hover:to-[#1c0b0b] hover:border-[#5c2a2a] hover:text-red-400 text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
          >
            로그아웃
          </button>

          {/* Secure KST Electronic Digital Clock */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-[#2d4766]/50 shadow-md font-mono text-xs select-none">
            <span className="text-emerald-400 font-extrabold animate-pulse text-[10px]">●</span>
            <span className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider">KST 한국시간:</span>
            <span className="text-amber-400 font-black tracking-wide glow-text drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]">{kstClock || '동기화 중...'}</span>
          </div>
        </div>
      </header>

      {/* Conditional Rendering: My Page vs Mini Game vs Dashboard */}
      {showMyPage ? (
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
                <label className="w-24 text-gray-400">비밀번호</label>
                <div className="flex-1">
                  <span className="text-gray-400 p-2">비밀번호 변경은 운영자에게 문의해주십시오.</span>
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
                        placeholder="최초 1회 설정"
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
                {currentUserData && !currentUserData.withdrawalPassword && (
                  <button 
                    onClick={async () => {
                      console.log("Save button clicked, currentUserData:", currentUserData, "password:", withdrawalPassword);
                      if (withdrawalPassword.length < 4) {
                        alert('출금 비밀번호는 4자리 이상이어야 합니다.');
                        return;
                      }

                      try {
                        await updateDoc(doc(db, 'users', currentUserData.id), {
                          withdrawalPassword: withdrawalPassword
                        });
                        alert('출금 비밀번호가 저장되었습니다.');
                        setCurrentUserData(prev => ({...prev, withdrawalPassword}));
                        setWithdrawalPassword('');
                      } catch (e) {
                        console.error("Save failed:", e);
                        alert('저장 실패: ' + (e instanceof Error ? e.message : String(e)));
                      }
                    }}
                    className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-12 rounded cursor-pointer"
                  >
                    비밀번호 저장
                  </button>
                )}
                <button 
                  onClick={() => alert('문의하기 기능은 준비 중입니다.')}
                  className="bg-lime-700 hover:bg-lime-600 text-white font-bold py-2 px-12 rounded cursor-pointer"
                >
                  문의하기
                </button>
              </div>
          </div>
        </div>
      ) : showMiniGame ? (
        <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]">
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowMiniGame(false)} className="hover:text-white">홈</button> &gt; 미니게임
          </div>
          <div className="flex flex-col xl:flex-row gap-6 items-start relative w-full">
            
            {/* 왼쪽 영역: 영상 및 배팅 판넬 (빨간색 테두리와 검정색 배경의 프레임) */}
            <div className="flex-1 min-w-0 bg-black border border-red-600/50 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-neutral-950 p-4 border-b border-red-950/80 flex items-center justify-between">
                <span className="text-white font-black tracking-wider">
                  {activeMiniGameTab === 'powerball5' ? '실시간 N파워볼 (5분)' : 
                   activeMiniGameTab === 'powerball3' ? '실시간 N파워볼 (3분)' :
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
                      src="https://xn--950bo4em5v.co/minigame/nball/powerball5/pc" 
                      width="830" 
                      height="630" 
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'powerball3' ? (
                    <iframe 
                      key="pb3"
                      src="https://xn--950bo4em5v.co/minigame/nball/powerball3/pc" 
                      width="830" 
                      height="630" 
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : activeMiniGameTab === 'ladder5' ? (
                    <iframe 
                      key="ladder5"
                      src="https://xn--950bo4em5v.co/minigame/ladder/ladder/pc" 
                      width="830" 
                      height="630" 
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800"
                    />
                  ) : (
                    <iframe 
                      key="daridari3"
                      src="https://xn--950bo4em5v.co/minigame/ladder/daridari/pc" 
                      width="830" 
                      height="630" 
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
                  <div className="overflow-x-auto w-full border border-neutral-900 rounded-xl shadow-2xl">
                    <table className="w-full text-center border-collapse text-xs min-w-[750px]">
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

                {/* 최근 배팅 역사 테이블 */}
                <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-300 border-b border-neutral-800/40 pb-2 flex items-center justify-between">
                    <span>나의 최근 배팅 내역 (실시간 리셋 저장)</span>
                    <span className="text-[10px] text-gray-500">클라우드 데이터베이스 적용</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] text-gray-400">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[10px] uppercase text-gray-500">
                          <th className="py-2 px-1">배팅시각</th>
                          <th className="py-2 px-1">게임 분류</th>
                          <th className="py-2 px-1">선택 옵션</th>
                          <th className="py-2 px-1">소형 배당</th>
                          <th className="py-2 px-1 text-right">배팅액</th>
                          <th className="py-2 px-1 text-right">적중 결과</th>
                          <th className="py-2 px-1 text-center font-bold">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/30">
                        {currentUserData?.bets && currentUserData.bets.length > 0 ? (
                          currentUserData.bets.map((bet: any) => (
                            <tr key={bet.id} className="hover:bg-neutral-850/20">
                              <td className="py-2.5 px-1 font-mono text-[10px] text-gray-500">{bet.betTime}</td>
                              <td className="py-2.5 px-1 font-bold text-gray-300">{bet.game}</td>
                              <td className="py-2.5 px-1">
                                {bet.folders && bet.folders.length > 0 ? (
                                  <div className="space-y-1 my-0.5">
                                    {bet.folders.map((f: any, fIdx: number) => (
                                      <div key={fIdx} className="text-[10px] leading-tight border-b border-neutral-800/20 pb-1 last:border-0 last:pb-0">
                                        <div className="text-[9px] text-gray-500 font-semibold">{f.game}</div>
                                        <div>
                                          <span className="text-gray-400">[{f.group}]</span>{' '}
                                          <span className="font-extrabold text-amber-400">{f.option}</span>{' '}
                                          <span className="text-amber-500 font-bold text-[9px] font-mono">({f.dividend}배)</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-gray-500">[{bet.group}]</span>{' '}
                                    <span className="font-extrabold text-amber-400">{bet.option}</span>
                                  </>
                                )}
                              </td>
                              <td className="py-2.5 px-1 font-bold font-mono text-amber-500">{bet.dividend}배</td>
                              <td className="py-2.5 px-1 text-right font-mono text-white font-bold">{bet.amount.toLocaleString()}원</td>
                              <td className="py-2.5 px-1 text-right font-mono font-bold">
                                {bet.status === 'win' ? (
                                  <span className="text-green-400 font-bold">+{Math.floor(bet.amount * bet.dividend).toLocaleString()}원</span>
                                ) : bet.status === 'lose' ? (
                                  <span className="text-gray-600">-</span>
                                ) : (
                                  <span className="text-yellow-500 animate-pulse font-medium">결과 대기 중</span>
                                )}
                              </td>
                              <td className="py-2.5 px-1 text-center">
                                {bet.status === 'win' ? (
                                  <span className="bg-green-950/60 text-green-400 border border-green-800/20 px-1.5 py-0.5 rounded text-[9px] font-black">적중</span>
                                ) : bet.status === 'lose' ? (
                                  <span className="bg-neutral-800 text-gray-500 px-1.5 py-0.5 rounded text-[9px]">미적중</span>
                                ) : (
                                  <span className="bg-yellow-950/60 text-yellow-400 border border-yellow-800/20 px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">추첨 중</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-600 text-xs">
                              진행된 배팅 내역이 존재하지 않습니다. 원하는 보드 옵션을 눌러 배팅을 시작하세요!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* 오른쪽 영역: 배팅 슬립 및 전광판 정보 - 빨간 테두리 박스 완전히 외부로 옆으로 빠짐 */}
            <div className="w-full xl:w-80 bg-neutral-900/80 border border-neutral-800/60 rounded-xl p-4 flex flex-col justify-between space-y-4 xl:sticky xl:top-6 z-20">
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
                          {Math.floor((secondsLeft - 10) / 60)}분 {((secondsLeft - 10) % 60)}초
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

                {/* 선택된 옵션 정보 (다폴더/묶음 조합 리스트) */}
                {selectedOptions.length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    <div className="text-[10px] text-gray-500 font-bold mb-1 flex justify-between">
                      <span>선택된 폴더 개수: {selectedOptions.length} / 10</span>
                      <span className="text-amber-400 font-bold font-mono">
                        총 배당: {(Math.round(selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1) * 100) / 100).toFixed(2)}배
                      </span>
                    </div>
                    {selectedOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg space-y-1 text-xs relative group/item">
                        <button 
                          onClick={() => {
                            setSelectedOptions(prev => prev.filter((_, i) => i !== oIdx));
                          }}
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition cursor-pointer font-bold text-[10px] w-4 h-4 flex items-center justify-center bg-neutral-950 rounded border border-neutral-800"
                        >
                          ✕
                        </button>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-semibold uppercase text-[9px] bg-red-950 px-1 py-0.5 rounded border border-red-900/30">
                            {opt.game === 'powerball5' ? '파워볼(5분)' : opt.game === 'powerball3' ? '파워볼(3분)' : opt.game}
                          </span>
                          <span className="text-red-400 font-black font-mono mr-5">{opt.dividend}배</span>
                        </div>
                        <div className="text-white flex justify-between items-center text-[11px] font-bold">
                          <span>[{opt.round}회차] {opt.group}</span>
                          <span className="text-amber-400 text-xs font-black">[{opt.name}]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center border border-dashed border-neutral-800 rounded-lg text-[11px] text-gray-500 text-center leading-relaxed p-2">
                    배팅할 옵션을 왼쪽 판에서 선택해 주세요.<br />
                    (최대 10폴더까지 조합 기능 지원)
                  </div>
                )}

                {/* 금액 설정 및 슬립 간편 증가 버튼 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 block">배팅 금액 입력 (₩)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={betAmount.toLocaleString()}
                      onChange={(e) => {
                        const val = Number(e.target.value.replace(/[^0-9]/g, ''));
                        setBetAmount(val);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-right text-sm font-black text-green-400 focus:outline-none focus:border-red-500"
                    />
                    <span className="absolute left-3 top-2 text-gray-500 font-mono">₩</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '+1만', val: 1000 },
                      { label: '+5만', val: 50000 },
                      { label: '+10만', val: 100000 },
                      { label: '+50만', val: 500000 },
                      { label: '+100만', val: 1000000 },
                      { label: '최대', val: 'max' },
                      { label: '초기화', val: 'reset' }
                    ].map((btn, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (btn.val === 'reset') setBetAmount(0);
                          else if (btn.val === 'max') setBetAmount(userBalance);
                          else {
                            // Explicitly match client custom multiplier to add +10k for +1만 label due to code typo prevention
                            const addAmount = btn.label === '+1만' ? 10000 : (btn.val as number);
                            setBetAmount(prev => prev + addAmount);
                          }
                        }}
                        className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/30 py-1 rounded text-[10px] text-gray-300 font-bold transition cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>예상 당첨머니</span>
                  <span className="text-green-400 font-black text-sm">
                    {selectedOptions.length > 0 ? Math.floor(betAmount * (Math.round(selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1) * 100) / 100)).toLocaleString() : 0}원
                  </span>
                </div>

                {isDrawing ? (
                  <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-center space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-xs font-black text-white tracking-wider uppercase">실시간 추첨 대기 중</span>
                    </div>
                    <div className="text-[10px] text-red-300 font-semibold font-mono">
                      공식 결과값을 기다리는 중 ({drawingTimer}초)
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-1000"
                        style={{ width: `${(6 - drawingTimer) * 16.6}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePlaceBet}
                    disabled={isDrawing || selectedOptions.length === 0 || betAmount <= 0}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-850 hover:from-red-500 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold tracking-widest text-xs rounded-lg shadow-lg border border-red-500/20 transition cursor-pointer"
                  >
                    배팅하기 (PLACE BET)
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Main Feature Banner */}
          <div 
            className="h-80 relative flex items-center justify-center text-center overflow-hidden border-b border-red-600/20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2670&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <div className="relative z-10 space-y-3">
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl md:text-6xl font-black text-amber-400 tracking-widest drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] uppercase italic"
              >
                🎰 SLOT GAME 🎰
              </motion.h1>
              <p className="text-gray-300 tracking-[0.2em] text-sm uppercase">Exclusive High-stakes Experience</p>
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
                  { label: '스포츠', img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500' },
                  { label: '카지노', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500' },
                  { label: '슬롯게임', img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=500' },
                  { label: '미니게임', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=500' },
                  { label: '경기결과', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500' },
                  { label: '공지사항', img: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=500' }
                ].map((cat, idx) => (
                  <motion.div 
                    whileHover={{ y: -6, scale: 1.02 }}
                    key={idx} 
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
            <div className="bg-red-950/10 border-b border-red-900/20 px-6 py-3 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-red-400 animate-pulse" /> 실시간 Firestore 연동됨</span>
                <span>총 회원 수: <strong className="text-red-400">{adminUsers.length}명</strong></span>
              </div>
              <button 
                onClick={loadAllUsers} 
                className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-white px-2.5 py-1 rounded border border-neutral-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} /> 새로고침
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="아이디 또는 닉네임으로 회원 검색..." 
                  value={searchQuery}
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
                                    value={editingPassword}
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
                                    value={editingNickname}
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
                                    value={editingWallet}
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
                                    value={editingBalance}
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
                                    value={editingPoints}
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
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            가입된 회원이 존재하지 않습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
    </div>
  );
}
