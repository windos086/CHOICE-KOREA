import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Target, Zap, Clock, Trash2, ArrowRight, 
  Check, AlertTriangle, AlertCircle, ShoppingCart, Bell, Info,
  Search, SlidersHorizontal, Star
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COUNTRY_FLAGS, findTeamLogo, findCountryFlag, findCountryFlagUrl, findLeagueLogo } from '../lib/teamLogos';
import { getSportCategory } from '../lib/matchUtils';

interface SportsContainerProps {
  currentUserData?: any;
  userBalance?: number;
  setUserBalance?: (val: number) => void;
  setUserPoints?: (val: number) => void;
  setMobileBetSlipOpen?: (val: boolean) => void;
  mobileBetSlipOpen?: boolean;
}

function renderSelectedOverlay(isActive: boolean) {
  if (!isActive) return null;
  return (
    <span className="absolute inset-0 rounded-none overflow-hidden pointer-events-none z-0">
      {/* Golden metallic base glow */}
      <span className="absolute inset-0 bg-gradient-to-r from-amber-600/25 via-amber-400/15 to-amber-500/25 animate-pulse duration-1000" />
      {/* 45-degree angle hyper-shining high-speed light bar */}
      <span className="absolute inset-0 w-[300%] -left-[100%] bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-[25deg] animate-gold-shine" />
    </span>
  );
}

function getTeamBadge(teamName: string) {
  const name = teamName.trim();
  const logoUrl = findTeamLogo(name);
  
  if (logoUrl) {
    return (
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-5 h-5 mr-1.5 object-contain shrink-0" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
    );
  }

  // Find country flag image URL first (high-quality PNG rendered consistently across OS)
  const flagUrl = findCountryFlagUrl(name);
  if (flagUrl) {
    return (
        <img 
          src={flagUrl} 
          alt={name} 
          className="w-[19px] h-[13px] mr-1.5 object-cover rounded-[1px] border border-neutral-700/50 shrink-0 select-none" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
    );
  }

  // Fallback to searching country emoji flags if country code is not mapped
  const flag = COUNTRY_FLAGS[name] || findCountryFlag(name);
  if (flag) {
    return (
        <span className="w-5 h-5 mr-1.5 flex items-center justify-center text-[15px] shrink-0 select-none">
            {flag}
        </span>
    );
  }

  return null;
}

export function deduplicateLeagueName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  if (cleaned.includes('<')) {
    cleaned = cleaned.split('<')[0].trim();
  }
  cleaned = cleaned.replace(/[<>]/g, '').trim();

  // Try checking exact half match (no spaces)
  const noSpaces = cleaned.replace(/\s+/g, '');
  if (noSpaces.length > 0 && noSpaces.length % 2 === 0) {
    const halfLen = noSpaces.length / 2;
    const firstHalf = noSpaces.substring(0, halfLen);
    const secondHalf = noSpaces.substring(halfLen);
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      if (cleaned.length % 2 === 0) {
        const h = cleaned.length / 2;
        if (cleaned.substring(0, h).replace(/\s+/g, '').toLowerCase() === cleaned.substring(h).replace(/\s+/g, '').toLowerCase()) {
          return cleaned.substring(0, h).trim();
        }
      }
      const origHalf = Math.floor(cleaned.length / 2);
      for (let offset = -2; offset <= 2; offset++) {
        const splitIdx = origHalf + offset;
        if (splitIdx > 0 && splitIdx < cleaned.length) {
          const part1 = cleaned.substring(0, splitIdx).trim();
          const part2 = cleaned.substring(splitIdx).trim();
          if (part1.replace(/\s+/g, '').toLowerCase() === part2.replace(/\s+/g, '').toLowerCase()) {
            return part1;
          }
        }
      }
      const words = cleaned.split(/\s+/);
      if (words.length > 0 && words.length % 2 === 0) {
        const halfWords = words.length / 2;
        const w1 = words.slice(0, halfWords).join(' ');
        const w2 = words.slice(halfWords).join(' ');
        if (w1.toLowerCase() === w2.toLowerCase()) {
          return w1;
        }
      }
      return firstHalf;
    }
  }
  return cleaned;
}

export function cleanTeamName(name: string): string {
  if (!name) return '';
  return name.replace(/\[[^\]]*\]/g, '').trim();
}

function getLeagueHeaderLabel(leagueName: string, sampleMatch?: any) {
  const name = deduplicateLeagueName(leagueName || '');
  const leagueLogo = findLeagueLogo(name);
  
  let emoji = '⚽';
  let sport = '축구';
  if (sampleMatch) {
    sport = getSportCategory(sampleMatch);
  } else {
    const n = name.toLowerCase();
    if (n.includes('농구') || n.includes('nba') || n.includes('kbl') || n.includes('wkbl') || n.includes('basketball')) {
      sport = '농구';
    } else if (n.includes('야구') || n.includes('mlb') || n.includes('kbo') || n.includes('npb') || n.includes('baseball')) {
      sport = '야구';
    } else if (n.includes('배구') || n.includes('kovo') || n.includes('volleyball')) {
      sport = '배구';
    } else if (n.includes('하키') || n.includes('아이스하키') || n.includes('nhl') || n.includes('hockey')) {
      sport = '아이스하키';
    }
  }

  if (sport === '농구') {
    emoji = '🏀';
  } else if (sport === '야구') {
    emoji = '⚾';
  } else if (sport === '배구') {
    emoji = '🏐';
  } else if (sport === '아이스하키') {
    emoji = '🏒';
  } else {
    if (name.includes('독일')) emoji = '🇩🇪';
    else if (name.includes('스페인') || name.includes('라리가')) emoji = '🇪🇸';
    else if (name.includes('영국') || name.includes('프리미어') || name.includes('잉글랜드')) emoji = '🇬🇧';
    else if (name.includes('이탈리아') || name.includes('세리에')) emoji = '🇮🇹';
    else if (name.includes('프랑스') || name.includes('리그1')) emoji = '🇫🇷';
    else if (name.includes('대한민국') || name.includes('한국') || name.includes('K리그')) emoji = '🇰🇷';
    else if (name.includes('일본') || name.includes('J리그')) emoji = '🇯🇵';
    else if (name.includes('리투아니아')) emoji = '🇱🇹';
    else if (name.includes('네덜란드')) emoji = '🇳🇱';
  }
  
  return (
    <span className="flex items-center gap-2 font-sans text-white">
      {leagueLogo ? (
        <img 
          src={leagueLogo} 
          alt={name} 
          className="w-5 h-5 md:w-[22px] md:h-[22px] object-contain shrink-0 select-none bg-neutral-800/40 rounded-full p-0.5 border border-white/5"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallbackSpan = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallbackSpan) {
              fallbackSpan.style.display = 'inline';
            }
          }}
        />
      ) : null}
      <span 
        className="text-[14px] md:text-[16px] select-none"
        style={{ display: leagueLogo ? 'none' : 'inline' }}
      >
        {emoji}
      </span>
      <span>{name}</span>
    </span>
  );
}

function parseDateTimeToComparableNum(dateTimeStr: string): number {
  if (!dateTimeStr) return 9999999999;
  try {
    const cleaned = dateTimeStr.trim();
    const match = cleaned.match(/^(\d{2})[\.\-](\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      const month = parseInt(match[1], 10);
      const day = parseInt(match[2], 10);
      const hour = parseInt(match[3], 10);
      const minute = parseInt(match[4], 10);
      return month * 1000000 + day * 10000 + hour * 100 + minute;
    }
  } catch (e) {
    console.error("Failed to parse dateTime comparison:", e);
  }
  return 9999999999;
}

export default function SportsContainer({
  currentUserData,
  userBalance = 0,
  setUserBalance,
  setUserPoints,
  setMobileBetSlipOpen,
  mobileBetSlipOpen,
  initialSportTab = '전체'
}: SportsContainerProps & { initialSportTab?: '전체' | '축구' | '농구' | '야구' | '배구' | '아이스하키' }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeagueTab, setActiveLeagueTab] = useState<string>('전체');
  const [activeSportTab, setActiveSportTab] = useState<'전체' | '축구' | '농구' | '야구' | '배구' | '아이스하키'>(initialSportTab);
  const [leagueSearch, setLeagueSearch] = useState<string>('');
  const [isLeaguesExpanded, setIsLeaguesExpanded] = useState<boolean>(false);
  
  const betSlipRef = useRef<HTMLDivElement>(null);
  
  // Selections state: Array of selected folders
  // Each folder: { matchIdMatchOutcome: string, match: any, type: 'home' | 'draw' | 'away', odds: number, label: string }
  const [selectedFolders, setSelectedFolders] = useState<any[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10000);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  
  const [visibleCount, setVisibleCount] = useState<number>(30);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const isAdmin = currentUserData?.username === 'windo086' || currentUserData?.username === 'windos086' || currentUserData?.isAdmin || currentUserData?.role === 'admin';
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteGames');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favoriteGames', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (matchId: string) => {
    setFavorites(prev => 
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteLeagues');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favoriteLeagues', JSON.stringify(favoriteLeagues));
  }, [favoriteLeagues]);

  const toggleFavoriteLeague = (leagueName: string) => {
    setFavoriteLeagues(prev =>
      prev.includes(leagueName) ? prev.filter(name => name !== leagueName) : [...prev, leagueName]
    );
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isResolvingRef = useRef(false);

  // Reset visibleCount when active categories change
  useEffect(() => {
    setVisibleCount(30);
  }, [activeSportTab, activeLeagueTab]);

  // Fetch matches from Firestore matches collection
  const fetchMatches = async () => {
    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedMatches = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          homeTeam: cleanTeamName(data.homeTeam || ''),
          awayTeam: cleanTeamName(data.awayTeam || ''),
          league: data.league ? deduplicateLeagueName(data.league) : ''
        };
      });
      
      // Sort matches chronologically (earliest start time first)
      fetchedMatches.sort((a, b) => {
        const timeA = parseDateTimeToComparableNum(a.dateTime);
        const timeB = parseDateTimeToComparableNum(b.dateTime);
        return timeA - timeB;
      });

      setMatches(fetchedMatches);
    } catch (error) {
      console.warn('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // AUTOMATED SPORTS BET RESOLVER
  // Runs whenever matches are fetched or user's data updates to settle any pending sports bets in real-time
  useEffect(() => {
    if (!currentUserData || !currentUserData.id || matches.length === 0 || isResolvingRef.current) return;

    const pendingSportsBets = (currentUserData.bets || []).filter(
      (b: any) => b.status === 'pending' && (b.gameType === 'sports' || (b.folders && b.folders.some((f: any) => f.gameType === 'sports')))
    );

    if (pendingSportsBets.length === 0) return;

    const runSportsResolution = async () => {
      isResolvingRef.current = true;
      try {
        const matchMap = new Map<string, any>(matches.map(m => [m.id || m.dateTime + '_' + m.homeTeam, m]));
        let currentWallet = Number(userBalance);
        let currentPoints = Number(currentUserData.points || 0);
        let updatedBetsList = [...currentUserData.bets];
        let didMakeChanges = false;
        let announcementLogs: string[] = [];

        for (let i = 0; i < updatedBetsList.length; i++) {
          const bet = { ...updatedBetsList[i] };
          if (bet.status !== 'pending') continue;

          // Only process sports-typed bets
          const isSports = bet.gameType === 'sports' || (bet.folders && bet.folders.some((f: any) => f.gameType === 'sports'));
          if (!isSports) continue;

          let allFoldersCompleted = true;
          let hasAnyFailed = false;
          let foldersUpdated = [];

          if (bet.folders && bet.folders.length > 0) {
            foldersUpdated = [];
            for (const f of bet.folders) {
              if (f.marketType === 'bonus') {
                foldersUpdated.push({
                  ...f,
                  status: 'win',
                  rollResult: '보너스 배당 적용'
                });
                continue;
              }
              // Match can be tracked by matchId or a composite key
              const matchIdToLookup = f.matchId;
              const dbMatch = matchMap.get(matchIdToLookup);

              if (!dbMatch || dbMatch.status === 'pending') {
                allFoldersCompleted = false;
                foldersUpdated.push(f);
              } else {
                if (dbMatch.status === 'void') {
                   foldersUpdated.push({
                     ...f,
                     status: 'void',
                     rollResult: '적중특례'
                   });
                   continue;
                }
                const homeScore = dbMatch.homeScore !== undefined ? Number(dbMatch.homeScore) : (dbMatch.status === 'home' ? 1 : 0);
                const awayScore = dbMatch.awayScore !== undefined ? Number(dbMatch.awayScore) : (dbMatch.status === 'away' ? 1 : 0);
                
                let isWinFolder = false;
                let rollResultLabel = '';

                const mkt = f.marketType || 'matchWinner';

                if (mkt === 'matchWinner') {
                  const matchOutcome = dbMatch.status === 'completed' ? dbMatch.outcome : dbMatch.status; // 'home', 'draw', 'away'
                  isWinFolder = f.type === matchOutcome;
                  rollResultLabel = isWinFolder ? '승무패 적중' : '승무패 낙첨';
                } else if (mkt === 'handicap') {
                  const hVal = parseHandicapValue(f.lineValue);
                  if (f.type === 'home') {
                    const homeFinal = homeScore + hVal;
                    if (Math.abs(homeFinal - awayScore) < 0.001) {
                      // VOID when handicap tie
                      foldersUpdated.push({
                        ...f,
                        status: 'void',
                        rollResult: '적중특례'
                      });
                      continue;
                    }
                    isWinFolder = homeFinal > awayScore;
                  } else {
                    const awayFinal = awayScore + hVal;
                    if (Math.abs(awayFinal - homeScore) < 0.001) {
                      // VOID when handicap tie
                      foldersUpdated.push({
                        ...f,
                        status: 'void',
                        rollResult: '적중특례'
                      });
                      continue;
                    }
                    isWinFolder = awayFinal > homeScore;
                  }
                  rollResultLabel = isWinFolder ? '핸디캡 적중' : '핸디캡 낙첨';
                } else if (mkt === 'overUnder') {
                  const ouVal = parseFloat(f.lineValue) || 0;
                  const totalScore = homeScore + awayScore;
                  
                  if (Math.abs(totalScore - ouVal) < 0.001) {
                    // VOID when over/under tie
                    foldersUpdated.push({
                      ...f,
                      status: 'void',
                      rollResult: '적중특례'
                    });
                    continue;
                  }

                  if (f.type === 'over') {
                    isWinFolder = totalScore > ouVal;
                  } else {
                    isWinFolder = totalScore < ouVal;
                  }
                  rollResultLabel = isWinFolder ? '언오버 적중' : '언오버 낙첨';
                }

                if (!isWinFolder) {
                  hasAnyFailed = true;
                }

                foldersUpdated.push({
                  ...f,
                  status: isWinFolder ? 'win' : 'lose',
                  rollResult: rollResultLabel,
                  score: `${homeScore}:${awayScore}`
                });
              }
            }
          } else {
            // Deprecated older style fallback single-folder
            allFoldersCompleted = false;
          }

          if (allFoldersCompleted && foldersUpdated.length > 0) {
            bet.folders = foldersUpdated;
            const isWinner = !hasAnyFailed;
            bet.status = isWinner ? 'win' : 'lose';
            
            // Recalculate dividend, excluding voided matches (odds 1.0)
            const newDividend = foldersUpdated.reduce((acc, f) => {
              if (f.status === 'void') return acc;
              return acc * (Number(f.odds) || 1.0);
            }, 1.0);
            bet.dividend = newDividend;
            
            const outcomesSummary = foldersUpdated.map((f: any) => 
               `[${f.game}] 예견: ${f.option} ➔ 결과: ${f.status === 'win' ? '적중' : f.status === 'void' ? '적중특례' : '낙첨'}`
            ).join('\n');

            if (isWinner) {
              const winnings = Math.floor(bet.amount * bet.dividend);
              currentWallet += winnings;

              announcementLogs.push(`🎉 [스포츠 배팅 적중] 축하합니다!\n\n${outcomesSummary}\n\n당첨 배당률: ${bet.dividend}배\n당첨금 수령: +${winnings.toLocaleString()}원`);
            } else {
              announcementLogs.push(`😢 [스포츠 배팅 낙첨] 아쉽게도 낙첨되었습니다.\n\n${outcomesSummary}\n\n투자 금액 ${bet.amount.toLocaleString()}원이 차단 소멸 처리되었습니다.`);
            }

            bet.rollResult = isWinner ? '적중 완료' : '미적중';
            updatedBetsList[i] = bet;
            didMakeChanges = true;
          }
        }

        if (didMakeChanges) {
          // Commit to parent states
          if (setUserBalance) setUserBalance(currentWallet);
          if (setUserPoints) setUserPoints(currentPoints);

          // LocalStorage caching
          const savedUserStr = localStorage.getItem('currentUser');
          if (savedUserStr) {
            try {
              const curObj = JSON.parse(savedUserStr);
              localStorage.setItem('currentUser', JSON.stringify({ 
                ...curObj, 
                balance: currentWallet,
                points: currentPoints,
                bets: updatedBetsList
              }));
            } catch (err) {
              console.warn(err);
            }
          }

          // Write to Firestore DB users/{uid}
          await updateDoc(doc(db, 'users', currentUserData.id), {
            balance: currentWallet,
            points: currentPoints,
            bets: updatedBetsList
          });

          if (announcementLogs.length > 0) {
            alert(announcementLogs.join('\n\n---------------------------------------\n\n'));
          }
        }
      } catch (err) {
        console.warn("Error evaluating sports resolutions: ", err);
      } finally {
        isResolvingRef.current = false;
      }
    };

    runSportsResolution();
  }, [matches, currentUserData?.bets, userBalance]);

function isMatchActive(dateTimeStr: string): boolean {
  if (!dateTimeStr) return true;
  const now = new Date();
  const match = dateTimeStr.trim().match(/^(\d{2})[\.\-](\d{2})\s+(\d{2}):(\d{2})/);
  if (!match) return true;
  const month = parseInt(match[1], 10) - 1;
  const day = parseInt(match[2], 10);
  const hour = parseInt(match[3], 10);
  const minute = parseInt(match[4], 10);
  const matchDate = new Date(now.getFullYear(), month, day, hour, minute);
  return matchDate > now;
}

// 1. Filter matches based on the selected major sport tab, and sort favorites first
  const sortedMatches = [...matches].filter(m => isMatchActive(m.dateTime)).sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const sportFilteredMatches = activeSportTab === '전체'
    ? sortedMatches
    : sortedMatches.filter(m => getSportCategory(m) === activeSportTab);

  // 2. Extract unique leagues under the current selected sport category
  const leagues = ['전체', ...Array.from(new Set(sportFilteredMatches.map(m => deduplicateLeagueName(m.league)).filter(Boolean)))];

  const filteredLeaguesBySearch = leagues.filter(lg => {
    if (lg === '전체') return true;
    return lg.toLowerCase().includes(leagueSearch.trim().toLowerCase());
  });

  // 3. Filter matches based on both sport, selected league tab AND search term (League Name or Team Name)
  const filteredMatches = sportFilteredMatches.filter(m => {
    const leagueMatch = activeLeagueTab === '전체' || deduplicateLeagueName(m.league) === activeLeagueTab;
    if (!leagueMatch) return false;
    
    if (leagueSearch.trim() === '') return true;
    
    const search = leagueSearch.trim().toLowerCase();
    const cleanLg = deduplicateLeagueName(m.league || '');
    return (
      (cleanLg && cleanLg.toLowerCase().includes(search)) ||
      (m.homeTeam && m.homeTeam.toLowerCase().includes(search)) ||
      (m.awayTeam && m.awayTeam.toLowerCase().includes(search))
    );
  });

  // Infinite scroll listener with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 30, filteredMatches.length));
        }
      },
      { threshold: 0.1 }
    );

    const trigger = document.getElementById('infinite-scroll-trigger');
    if (trigger) {
      observer.observe(trigger);
    }

    return () => observer.disconnect();
  }, [filteredMatches.length, visibleCount]);

  // Toggle selection of a folder bonus
  const handleSelectBonusFolder = (bonus: { id: string, name: string, odds: number, label: string }) => {
    const isSelected = selectedFolders.some(f => f.marketType === 'bonus' && f.type === bonus.id);

    if (isSelected) {
      setSelectedFolders(prev => prev.filter(f => f.type !== bonus.id));
    } else {
      const bonusFolderObj = {
        matchId: bonus.id,
        match: {
          homeTeam: '다폴더 보너스',
          awayTeam: bonus.name,
          league: '보너스'
        },
        marketType: 'bonus',
        type: bonus.id,
        lineValue: bonus.name,
        odds: bonus.odds,
        label: `보너스 배당 [${bonus.name}]`
      };

      setSelectedFolders(prev => {
        const withoutBonus = prev.filter(f => f.marketType !== 'bonus');
        if (withoutBonus.length >= 10) {
          alert('배팅은 최대 10폴더까지만 조합해서 배팅할 수 있습니다.');
          return prev;
        }
        return [...withoutBonus, bonusFolderObj];
      });
    }
  };

  // Toggle selection of a specific bet option
  const handleSelectOption = (match: any, type: 'home' | 'draw' | 'away', odds: number) => {
    if (!odds || odds <= 0) return;

    // Find existing selection with same matchId AND same marketType
    const existingSameMatchIndex = selectedFolders.findIndex(f => f.matchId === match.id && f.marketType === 'matchWinner');

    const isExactDeselect = existingSameMatchIndex > -1 && 
      selectedFolders[existingSameMatchIndex].type === type;

    if (!isExactDeselect) {
      // Check if handicap exists FOR THIS MATCH
      const hasHandicapInSameMatch = selectedFolders.some(f => f.matchId === match.id && f.marketType === 'handicap');
      if (hasHandicapInSameMatch) {
        alert('동일 경기 내에서 승무패와 핸디캡을 함께 조합할 수 없습니다.');
        return;
      }
    }

    const newFolderObj = {
      matchId: match.id,
      match: match,
      marketType: 'matchWinner',
      type: type,
      lineValue: '',
      odds: parseFloat(odds.toFixed(2)),
      label: type === 'home' ? '홈 승' : type === 'draw' ? '무승부' : '원정 승'
    };

    if (existingSameMatchIndex > -1) {
      const existingSelection = selectedFolders[existingSameMatchIndex];
      // If user clicks the exact same option again, we deselect it
      if (existingSelection.type === type) {
        setSelectedFolders(prev => prev.filter(f => !(f.matchId === match.id && f.marketType === 'matchWinner')));
      } else {
        // Replace with the new chosen option for the same match AND same marketType
        setSelectedFolders(prev => prev.map(f => (f.matchId === match.id && f.marketType === 'matchWinner') ? newFolderObj : f));
      }
    } else {
      // Add as a new parlay leg (max 10 folds limit)
      if (selectedFolders.length >= 10) {
        alert('배팅은 최대 10폴더까지만 조합해서 배팅할 수 있습니다.');
        return;
      }
      setSelectedFolders(prev => [...prev, newFolderObj]);
      if (isMobile && setMobileBetSlipOpen) setMobileBetSlipOpen(true);
    }
  };

  const isSelected = (matchId: string, type: 'home' | 'draw' | 'away') => {
    return selectedFolders.some(f => f.matchId === matchId && f.marketType === 'matchWinner' && f.type === type);
  };

  const cleanLineValue = (valStr: string): string => {
    if (!valStr) return '';
    const trimmed = valStr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      return parts[parts.length - 1].trim();
    }
    return trimmed;
  };

  const formatHandicapDisplay = (valStr: string, homeOdds?: number, awayOdds?: number): string => {
    if (!valStr) return '0';
    const cleaned = cleanLineValue(valStr);
    const num = parseFloat(cleaned);
    if (isNaN(num) || num === 0) return '0';
    
    if (cleaned.startsWith('+') || cleaned.startsWith('-')) {
      return cleaned;
    }
    
    const withoutSign = cleaned.replace(/[+-]/g, '').trim();
    if (homeOdds !== undefined && awayOdds !== undefined && homeOdds !== 0 && awayOdds !== 0) {
      if (homeOdds < awayOdds) {
        return `-${withoutSign}`;
      } else {
        return `+${withoutSign}`;
      }
    }

    const isNegative = cleaned.startsWith('-');
    if (isNegative) {
      return `-${withoutSign}`;
    } else {
      return `+${withoutSign}`;
    }
  };

  const getOppositeHandicap = (valStr: string): string => {
    if (!valStr || valStr === '0') return '0';
    const trimmed = valStr.trim();
    if (trimmed.startsWith('+')) {
      return `-${trimmed.slice(1)}`;
    } else if (trimmed.startsWith('-')) {
      return `+${trimmed.slice(1)}`;
    } else {
      const num = parseFloat(trimmed);
      if (isNaN(num) || num === 0) return '0';
      if (num > 0) {
        return `-${trimmed}`;
      } else {
        return `+${Math.abs(num)}`;
      }
    }
  };

  const parseHandicapValue = (valStr: string): number => {
    if (!valStr) return 0;
    valStr = valStr.trim();
    if (valStr.includes('/')) {
      const parts = valStr.split('/');
      const p1 = parseFloat(parts[0]) || 0;
      const p2 = parseFloat(parts[1]) || 0;
      return (p1 + p2) / 2;
    }
    return parseFloat(valStr) || 0;
  };

  const handleSelectHandicap = (match: any, handi: any, type: 'home' | 'away') => {
    // Find existing selection with same matchId AND same marketType
    const existingSameMatchIndex = selectedFolders.findIndex(f => f.matchId === match.id && f.marketType === 'handicap');
    const baseLineValue = formatHandicapDisplay(
      handi.value, 
      match.markets?.matchWinner?.home, 
      match.markets?.matchWinner?.away
    );
    const displayLineValue = type === 'home' ? baseLineValue : getOppositeHandicap(baseLineValue);

    const isExactDeselect = existingSameMatchIndex > -1 && 
      selectedFolders[existingSameMatchIndex].lineValue === displayLineValue && 
      selectedFolders[existingSameMatchIndex].type === type;

    if (!isExactDeselect) {
      // Check if match winner exists FOR THIS MATCH
      const hasMatchWinnerInSameMatch = selectedFolders.some(f => f.matchId === match.id && f.marketType === 'matchWinner');
      if (hasMatchWinnerInSameMatch) {
        alert('동일 경기 내에서 승무패와 핸디캡을 함께 조합할 수 없습니다.');
        return;
      }
    }

    const newFolderObj = {
      matchId: match.id,
      match: match,
      marketType: 'handicap',
      type: type,
      lineValue: displayLineValue,
      odds: parseFloat(type === 'home' ? handi.home : handi.away),
      label: type === 'home' ? `홈 핸디캡 [${displayLineValue}]` : `원정 핸디캡 [${displayLineValue}]`
    };

    if (existingSameMatchIndex > -1) {
      const existingSelection = selectedFolders[existingSameMatchIndex];
      // If user clicks exact same option again, deselect it
      if (existingSelection.lineValue === displayLineValue && existingSelection.type === type) {
        setSelectedFolders(prev => prev.filter(f => !(f.matchId === match.id && f.marketType === 'handicap')));
      } else {
        // Replace selection for this match AND this marketType
        setSelectedFolders(prev => prev.map(f => (f.matchId === match.id && f.marketType === 'handicap') ? newFolderObj : f));
      }
    } else {
      if (selectedFolders.length >= 10) {
        alert('배팅은 최대 10폴더까지만 조합해서 배팅할 수 있습니다.');
        return;
      }
      setSelectedFolders(prev => [...prev, newFolderObj]);
      if (isMobile && setMobileBetSlipOpen) setMobileBetSlipOpen(true);
      if (!isMobile) betSlipRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectOverUnder = (match: any, ou: any, type: 'over' | 'under') => {
    const existingSameMatchIndex = selectedFolders.findIndex(f => f.matchId === match.id && f.marketType === 'overUnder');
    const cleanedLineValue = cleanLineValue(ou.value || '2.5');

    const newFolderObj = {
      matchId: match.id,
      match: match,
      marketType: 'overUnder',
      type: type,
      lineValue: cleanedLineValue,
      odds: parseFloat(type === 'over' ? ou.over : ou.under),
      label: type === 'over' ? `오버 [${cleanedLineValue}▲]` : `언더 [${cleanedLineValue}▼]`
    };

    if (existingSameMatchIndex > -1) {
      const existingSelection = selectedFolders[existingSameMatchIndex];
      // If user clicks exact same option again, deselect it
      if (existingSelection.lineValue === cleanedLineValue && existingSelection.type === type) {
        setSelectedFolders(prev => prev.filter(f => !(f.matchId === match.id && f.marketType === 'overUnder')));
      } else {
        // Replace selection for this match AND this marketType
        setSelectedFolders(prev => prev.map(f => (f.matchId === match.id && f.marketType === 'overUnder') ? newFolderObj : f));
      }
    } else {
      if (selectedFolders.length >= 10) {
        alert('배팅은 최대 10폴더까지만 조합해서 배팅할 수 있습니다.');
        return;
      }
      setSelectedFolders(prev => [...prev, newFolderObj]);
      if (isMobile && setMobileBetSlipOpen) setMobileBetSlipOpen(true);
    }
  };

  const isSelectedHandicap = (matchId: string, value: string, type: 'home' | 'away') => {
    const match = matches.find(m => m.id === matchId);
    const homeOdds = match?.markets?.matchWinner?.home;
    const awayOdds = match?.markets?.matchWinner?.away;
    const formattedVal = formatHandicapDisplay(value, homeOdds, awayOdds);
    const expectedVal = type === 'home' ? formattedVal : getOppositeHandicap(formattedVal);
    
    return selectedFolders.some(f => 
      f.matchId === matchId && 
      f.marketType === 'handicap' && 
      f.lineValue === expectedVal && 
      f.type === type
    );
  };

  const isSelectedOverUnder = (matchId: string, value: string, type: 'over' | 'under') => {
    return selectedFolders.some(f => f.matchId === matchId && f.marketType === 'overUnder' && f.lineValue === cleanLineValue(value) && f.type === type);
  };

  // Arithmetic multiplication of parlay stakes
  const totalOdds = selectedFolders.reduce((acc, f) => acc * f.odds, 1);
  const formattedTotalOdds = selectedFolders.length > 0 ? parseFloat(totalOdds.toFixed(2)) : 0.00;
  const estimatedPayout = Math.floor(betAmount * formattedTotalOdds);

  const globalMaxPayoutLimit = 10000000;

  const handleClearCart = () => {
    setSelectedFolders([]);
  };

  const handleQuickAmount = (amount: number) => {
    setBetAmount(prev => prev + amount);
  };

  const handleSetMaxAmount = () => {
    if (userBalance > 0) {
      setBetAmount(userBalance);
    }
  };

  const handlePlaceSportsBet = async () => {
    if (!currentUserData) {
      alert('로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.');
      return;
    }
    if (selectedFolders.length === 0) {
      alert('배팅 카트에 선택된 경기가 없습니다.');
      return;
    }

    const bonusFolder = selectedFolders.find(f => f.marketType === 'bonus');
    const normalFoldersCount = selectedFolders.filter(f => f.marketType !== 'bonus').length;

    if (normalFoldersCount === 0) {
      alert('최소 1개 이상의 일반 스포츠 경기를 조합하셔야 배팅이 가능합니다.');
      return;
    }

    if (bonusFolder) {
      if (bonusFolder.type === 'bonus_3' && normalFoldersCount < 3) {
        alert('3폴더 보너스 배당을 적용하려면 최소 3개 이상의 일반 스포츠 경기를 조합해야 합니다.');
        return;
      }
      if (bonusFolder.type === 'bonus_5' && normalFoldersCount < 5) {
        alert('5폴더 보너스 배당을 적용하려면 최소 5개 이상의 일반 스포츠 경기를 조합해야 합니다.');
        return;
      }
      if (bonusFolder.type === 'bonus_7' && normalFoldersCount < 7) {
        alert('7폴더 보너스 배당을 적용하려면 최소 7개 이상의 일반 스포츠 경기를 조합해야 합니다.');
        return;
      }
    }

    // Check for same-match forbidden combinations (matchWinner + handicap)
    for (const folder of selectedFolders) {
        const correspondingWinner = selectedFolders.find(f => f.matchId === folder.matchId && f.marketType === 'matchWinner');
        const correspondingHandicap = selectedFolders.find(f => f.matchId === folder.matchId && f.marketType === 'handicap');
        if (correspondingWinner && correspondingHandicap) {
            alert('동일 경기 내에서 승무패와 핸디캡을 함께 조합할 수 없습니다.');
            return;
        }
    }

    if (betAmount < 10000) {
      alert('최소 배팅금액은 10,000원입니다.');
      return;
    }
    if (betAmount > userBalance) {
      alert('보유머니가 부족합니다. 충전 후 다시 시도해 주세요.');
      return;
    }

    if (estimatedPayout > globalMaxPayoutLimit && !isAdmin) {
      alert(`최대 당첨 가능 금액은 ${globalMaxPayoutLimit.toLocaleString()}원입니다.\n배팅 금액을 조절해주세요.`);
      return;
    }

    if (!confirm('정말 배팅하시겠습니까?\n한번 배팅을 확정하면 취소가 어렵습니다.')) {
      return;
    }

    setIsPlacingBet(true);
    try {
      const nextBalance = userBalance - betAmount;
      if (setUserBalance) {
        setUserBalance(nextBalance);
      }

      const isSingle = selectedFolders.length === 1;
      const sportName = isSingle ? getSportCategory(selectedFolders[0].match) : '스포츠';
      const gameLabelString = isSingle
        ? `[${sportName}] ${selectedFolders[0].match.homeTeam} VS ${selectedFolders[0].match.awayTeam}`
        : `[${sportName}] 조합배팅 (${selectedFolders.length}폴더)`;

       const foldersForSave = selectedFolders.map(sf => {
        let optionStr = '';
        if (sf.marketType === 'handicap') {
          optionStr = sf.type === 'home' ? `홈[H]: ${sf.match.homeTeam} (${sf.lineValue})` : `원정[H]: ${sf.match.awayTeam} (${sf.lineValue})`;
        } else if (sf.marketType === 'overUnder') {
          optionStr = sf.type === 'over' ? `오버 ▲ (${sf.lineValue})` : `언더 ▼ (${sf.lineValue})`;
        } else if (sf.marketType === 'bonus') {
          optionStr = `보너스 배당 추가 (${sf.odds})`;
        } else {
          optionStr = sf.type === 'home' ? `홈(승): ${sf.match.homeTeam}` : sf.type === 'draw' ? '무승부' : `원정(패): ${sf.match.awayTeam}`;
        }

        let hOdds = '';
        let aOdds = '';
        if (sf.marketType === 'handicap') {
          hOdds = sf.match?.markets?.handicap?.home ? String(sf.match.markets.handicap.home) : '';
          aOdds = sf.match?.markets?.handicap?.away ? String(sf.match.markets.handicap.away) : '';
        } else if (sf.marketType === 'overUnder' || sf.marketType === 'underOver') {
          hOdds = sf.match?.markets?.overUnder?.over ? String(sf.match.markets.overUnder.over) : '';
          aOdds = sf.match?.markets?.overUnder?.under ? String(sf.match.markets.overUnder.under) : '';
        } else if (sf.marketType === 'matchWinner') {
          hOdds = sf.match?.markets?.matchWinner?.home ? String(sf.match.markets.matchWinner.home) : '';
          aOdds = sf.match?.markets?.matchWinner?.away ? String(sf.match.markets.matchWinner.away) : '';
        }

        return {
          game: sf.marketType === 'bonus' ? '다폴더 보너스 추가 배당' : `${sf.match.homeTeam} VS ${sf.match.awayTeam}`,
          gameType: sf.marketType === 'bonus' ? 'bonus' : 'sports',
          group: sf.marketType === 'bonus' ? '보너스' : (sf.marketType === 'handicap' ? '핸디캡' : sf.marketType === 'overUnder' ? '언더오버' : '승무패'),
          sport: sf.marketType === 'bonus' ? 'bonus' : getSportCategory(sf.match),
          league: sf.marketType === 'bonus' ? '보너스' : (sf.match?.league || ''),
          matchTime: sf.match?.dateTime || sf.match?.matchTime || sf.matchTime || sf.dateTime || '',
          dateTime: sf.match?.dateTime || sf.match?.matchTime || sf.matchTime || sf.dateTime || '',
          option: optionStr,
          dividend: sf.odds,
          homeOdds: hOdds,
          awayOdds: aOdds,
          matchId: sf.matchId,
          marketType: sf.marketType || 'matchWinner',
          type: sf.type,
          lineValue: sf.lineValue || '',
          status: sf.marketType === 'bonus' ? 'win' : 'pending',
          rollResult: sf.marketType === 'bonus' ? '보너스 적용' : '대기 중'
        };
      });

      const newBet = {
        id: 'bet_sports_' + Date.now(),
        game: gameLabelString,
        gameType: 'sports',
        sport: isSingle ? sportName : '스포츠',
        group: isSingle ? (foldersForSave[0].group) : '조합배팅',
        option: isSingle 
          ? `${foldersForSave[0].option} (${foldersForSave[0].dividend})` 
          : foldersForSave.map((f: any) => `${f.option}(${f.dividend})`).join(' x '),
        dividend: formattedTotalOdds,
        amount: betAmount,
        betTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'pending',
        rollResult: '대기 중',
        folders: foldersForSave,
        createdAt: Date.now()
      };

      const updatedBets = [newBet, ...(currentUserData.bets || [])].slice(0, 50);
      const pointsToAward = currentUserData?.isPartner ? 0 : Math.floor(betAmount * 0.05);
      const newPoints = (currentUserData.points || 0) + pointsToAward;

      let updatedPointsHistory = [...(currentUserData?.pointsHistory || [])];
      if (pointsToAward > 0) {
        const sportsPointRewardItem = {
          createdAt: Date.now(),
          type: 'bet_reward_sports',
          description: `스포츠 배팅 적립 (${gameLabelString})`,
          amount: pointsToAward,
          balanceAfter: newPoints
        };
        updatedPointsHistory = [sportsPointRewardItem, ...updatedPointsHistory].slice(0, 200);
      }

      if (setUserPoints) {
        setUserPoints(newPoints);
      }

      // Save user record inside Firestore
      const userDocId = currentUserData?.id || currentUserData?.username || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').username) || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').id);
      if (!userDocId) {
        throw new Error("User ID is missing or unregistered in state and cache");
      }
      await updateDoc(doc(db, 'users', userDocId), {
        balance: nextBalance,
        points: newPoints,
        pointsHistory: updatedPointsHistory,
        bets: updatedBets
      });

      // Synchronize back to local storage cache
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        try {
          const curObj = JSON.parse(savedUserStr);
          localStorage.setItem('currentUser', JSON.stringify({ 
            ...curObj, 
            balance: nextBalance,
            points: newPoints,
            pointsHistory: updatedPointsHistory,
            bets: updatedBets
          }));
        } catch (err) {
          console.error(err);
        }
      }

      alert('👍 스포츠 배팅이 정상적으로 승인 처리되었습니다. 대기 매칭 정산은 경기 완료 시 즉시 갱신됩니다.');
      setSelectedFolders([]); // Clear cart
      setBetAmount(10000); // Reset stake
    } catch (error) {
      console.error("Failed to process sports bet:", error);
      alert('배팅 처리 중 예기치 못한 에러가 발생했습니다.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 w-full mx-auto max-w-[1550px] text-white">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-neutral-850 via-neutral-900 to-neutral-850 p-5 rounded-2xl mb-6 border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg animate-pulse">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white whitespace-nowrap truncate">실시간 스포츠 승무패 정규 리그</h2>
          </div>
          <p className="text-xs text-neutral-400">등록된 매치 배당을 확인하고 원클릭 스포츠 배팅 카트를 통해 손쉽게 단폴 및 다폴더 파레이 조합 배팅을 완료하세요.</p>
        </div>
      </div>

      {/* Major Sports Category Selector */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap items-center justify-center sm:gap-4 md:gap-5 mb-6">
        {[
          { id: '전체', name: '전체', emoji: '🏆' },
          { id: '축구', name: '축구', emoji: '⚽' },
          { id: '농구', name: '농구', emoji: '🏀' },
          { id: '야구', name: '야구', emoji: '⚾' },
          { id: '배구', name: '배구', emoji: '🏐' },
          { id: '아이스하키', name: '아이스하키', emoji: '🏒' }
        ].map((sport) => {
          const count = sport.id === '전체'
            ? matches.filter(m => m.status === 'pending' && isMatchActive(m.dateTime)).length
            : matches.filter(m => m.status === 'pending' && getSportCategory(m) === sport.id && isMatchActive(m.dateTime)).length;

          const isActive = activeSportTab === sport.id;
          const isBall = ['⚽', '🏀', '⚾', '🏐'].includes(sport.emoji);

          return (
            <button
              key={sport.id}
              onClick={() => {
                setActiveSportTab(sport.id as any);
                setActiveLeagueTab('전체');
              }}
              className={`relative flex flex-col items-center justify-center p-2.5 w-full sm:w-28 h-20 md:w-32 md:h-24 rounded-2xl transition-all cursor-pointer border select-none group overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-b from-amber-500/10 via-neutral-950 to-neutral-950 border-amber-400 border-2 shadow-[0_0_20px_rgba(245,158,11,0.45)] animate-gold-glow'
                  : 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 hover:border-neutral-750'
              }`}
            >
              {/* Golden sparkling shimmer beam effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-transparent via-amber-200/35 to-transparent -skew-x-[25deg] animate-gold-shine" />
                </div>
              )}

              {/* Count Badge */}
              <span className={`absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] md:text-[9px] font-black font-mono shadow transition-colors border ${
                isActive 
                  ? 'bg-amber-400 text-black border-amber-400 font-extrabold'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 group-hover:text-white group-hover:border-neutral-750'
              }`}>
                {count}
              </span>

              {/* Emoji Sphere Container */}
              <div className={`text-2xl md:text-3xl mb-1 transition-transform duration-300 group-hover:scale-110 select-none ${
                isActive ? 'scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'opacity-85'
              }`}>
                <span className={`inline-block ${
                  isBall ? 'animate-[spin_6s_linear_infinite]' : isActive ? 'animate-bounce-short' : ''
                }`}>
                  {sport.emoji}
                </span>
              </div>

              {/* Text Label */}
              <span className={`text-[10px] md:text-xs font-black tracking-wider transition-colors ${
                isActive ? 'text-amber-400 font-extrabold drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]' : 'text-neutral-400 group-hover:text-neutral-200'
              }`}>
                {sport.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Leagues Navigation Row */}
      <div className="bg-[#0b0c10]/90 border border-neutral-800/80 rounded-2xl p-4 mb-4 select-none shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] md:text-xs font-black tracking-widest text-neutral-300">LEAGUES FILTER</span>
            {activeLeagueTab !== '전체' && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold shadow-sm">
                {activeLeagueTab}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search inputs */}
            <div className="relative w-full sm:w-48 md:w-56">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search size={13} />
              </span>
              <input
                type="text"
                value={leagueSearch}
                onChange={(e) => setLeagueSearch(e.target.value)}
                placeholder="리그명/팀명 검색..."
                className="w-full pl-8 pr-7 py-1 bg-black/40 border border-neutral-800 focus:border-amber-500/60 rounded-lg text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all font-medium"
              />
              {leagueSearch && (
                <button 
                  onClick={() => setLeagueSearch('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-500 hover:text-white text-[11px] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Style Toggle */}
            <button
              onClick={() => setIsLeaguesExpanded(!isLeaguesExpanded)}
              className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 rounded-lg text-[10px] md:text-[11px] text-neutral-450 hover:text-white transition-all cursor-pointer font-bold select-none"
            >
              <SlidersHorizontal size={11} className="text-amber-500" />
              <span>{isLeaguesExpanded ? '간편히 보기 (한줄)' : '리그 전체보기'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Leagues Display Area */}
        <div className={
          isLeaguesExpanded 
            ? "flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1" 
            : "flex flex-row items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap"
        }>
          {filteredLeaguesBySearch.map((lg) => {
            const isSelected = activeLeagueTab === lg;
            return (
              <button
                key={lg}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveLeagueTab(lg)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  isSelected 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-[0_4px_10px_rgba(245,158,11,0.2)] font-black' 
                    : 'bg-neutral-950/70 hover:bg-neutral-850/80 border-neutral-850 hover:border-neutral-750 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {lg}
              </button>
            );
          })}
          {filteredLeaguesBySearch.length === 0 && (
            <div className="py-4 text-center text-xs text-neutral-500 w-full font-bold">
              검색 조건에 맞는 리그가 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        
        {/* Left Column: Matches List */}
        <div className="space-y-3 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-3">
          
          {/* Bonus Folders (서비스 폴더, 다폴더 보너스 배당) Container */}
          <div className="mb-4 bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2.5 select-none">
              <span className="text-amber-500 font-bold text-[10px]">★</span>
              <span className="text-[11px] font-black tracking-wider text-neutral-300">다폴더 보너스</span>
              <span className="text-[9px] text-neutral-500 font-medium truncate">(정규 폴더수 배당 자동 증가)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bonus_3', name: '3폴 이상', odds: 1.03, label: '3폴 이상 1.03' },
                { id: 'bonus_5', name: '5폴 이상', odds: 1.05, label: '5폴 이상 1.05' },
                { id: 'bonus_7', name: '7폴 이상', odds: 1.07, label: '7폴 이상 1.07' }
              ].map((bonus) => {
                const isSelected = selectedFolders.some(f => f.marketType === 'bonus' && f.type === bonus.id);
                return (
                  <button
                    key={bonus.id}
                    onClick={() => handleSelectBonusFolder(bonus)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all cursor-pointer select-none group min-h-[36px] ${
                      isSelected
                        ? 'bg-neutral-950 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-750'
                    }`}
                  >
                    <span className={`text-[10px] font-black tracking-wide ${
                      isSelected ? 'text-amber-500' : 'text-neutral-300'
                    }`}>
                      {bonus.name.replace('이상', '')}
                    </span>

                    <span className={`flex items-center justify-center font-mono text-[9px] font-black w-8 h-5 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-500 font-extrabold'
                        : 'bg-neutral-950 text-amber-500 border-neutral-800'
                    }`}>
                      {bonus.odds}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800/60 p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto mb-3"></div>
              <div className="text-sm text-neutral-400 font-black">실시간 경기 현황을 수신하고 있습니다...</div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-16 bg-neutral-950 rounded-2xl border border-neutral-805/40 text-neutral-400 p-4">
              <div className="text-sm font-black mt-2">현재 베팅 진행 중인 스포츠 경기가 없습니다.</div>
              <div className="text-xs text-gray-500 mt-1">곧 새로운 경기가 관리자에 의해 보충됩니다.</div>
            </div>
          ) : (
            (() => {
              const displayedMatches = filteredMatches.slice(0, visibleCount);
              const groups: Record<string, any[]> = {};
              displayedMatches.forEach(m => {
                const lg = deduplicateLeagueName(m.league || '기타 리그');
                if (!groups[lg]) groups[lg] = [];
                groups[lg].push(m);
              });
              const sortedGroups = Object.entries(groups).sort((a, b) => {
                const aFav = favoriteLeagues.includes(a[0]);
                const bFav = favoriteLeagues.includes(b[0]);
                if (aFav && !bFav) return -1;
                if (!aFav && bFav) return 1;

                const earliestA = a[1][0]?.dateTime || '';
                const earliestB = b[1][0]?.dateTime || '';
                return parseDateTimeToComparableNum(earliestA) - parseDateTimeToComparableNum(earliestB);
              });
              return (
                <>
                  {sortedGroups.map(([leagueName, leagueMatches]) => (
                    <div key={leagueName} className="space-y-3 mb-6">
                      <div className="bg-gradient-to-r from-sky-950 via-[#0e1726] to-sky-900/70 border border-sky-500/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs md:text-sm shadow-[0_0_15px_rgba(14,165,233,0.12)]">
                        <span className="font-extrabold tracking-tight text-white flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteLeague(leagueName);
                            }}
                            className="mr-1 hover:scale-110 active:scale-95 transition-transform duration-150 p-0.5 rounded flex items-center justify-center focus:outline-none"
                            title="리그 즐겨찾기"
                          >
                            <Star 
                              className={`w-4 h-4 transition-all duration-200 ${
                                favoriteLeagues.includes(leagueName) 
                                  ? 'text-amber-300 fill-amber-300 drop-shadow-[0_1px_3px_rgba(251,191,36,0.5)]' 
                                  : 'text-white/40 hover:text-white/80'
                              }`} 
                            />
                          </button>
                          {getLeagueHeaderLabel(leagueName, leagueMatches[0])}
                        </span>
                        <span className="text-[10px] font-bold text-white font-mono tracking-wider bg-black/30 border border-white/5 px-2 py-0.5 rounded-md">
                          {leagueMatches.length}경기 진행 중
                        </span>
                      </div>
                      <div className="space-y-3">
                        {leagueMatches.map((match) => (
                           <div key={match.id} className="bg-neutral-900 border border-neutral-850 rounded-xl overflow-hidden shadow-lg hover:border-neutral-800 transition-all self-stretch">
                             
                             {isMobile ? (
                               /* --- GORGEOUS MOBILE UI MODE --- */
                               <>
                                 {/* Match Header Bar */}
                                 <div className="bg-[#0b0c10] border-b border-[#1b1e24] px-3.5 py-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                                   <div className="flex items-center gap-1.5">
                                     <span className="text-amber-500 font-extrabold tracking-wider">
                                       <button
                                          onClick={() => toggleFavorite(match.id)}
                                          className={`p-1 ${favorites.includes(match.id) ? 'text-amber-500' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                          <Bell className="w-3.5 h-3.5" />
                                        </button>
                                        {match.dateTime || '06-07 00:00'}
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                     {match.status === 'pending' ? (
                                       <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black tracking-tight uppercase select-none">
                                         베팅 가능
                                       </span>
                                     ) : (
                                       <span className="text-[9px] bg-red-950/20 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-black select-none">
                                         경기 종료
                                       </span>
                                     )}
                                   </div>
                                 </div>

                                 {/* Row 1: 승무패 (Match Winner) - 3 Columns */}
                                 <div className="flex w-full min-h-[44px] items-stretch border-b border-[#1b1e24]/60 bg-[#16181d]/10">
                                    {/* Column 1: Home Win Button */}
                                    <button
                                      disabled={match.status !== 'pending'}
                                      onClick={() => handleSelectOption(match, 'home', match.markets?.matchWinner?.home)}
                                      className={`flex-1 min-w-0 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                        isSelected(match.id, 'home')
                                          ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                          : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        {!(match.sport === 'soccer' || match.sport === '축구') && getTeamBadge(match.homeTeam)}
                                        <span className={`truncate text-left flex-1 min-w-0 font-bold text-[10px] tracking-tighter ${
                                          isSelected(match.id, 'home') ? 'text-black' : 'text-neutral-200'
                                        }`}>
                                          {match.homeTeam}
                                        </span>
                                      </div>
                                      <span className={`font-mono text-xs font-black shrink-0 ml-1.5 ${
                                        isSelected(match.id, 'home') ? 'text-black' : 'text-amber-550 text-amber-500'
                                      }`}>
                                        {match.markets?.matchWinner?.home?.toFixed(2) || '1.00'}
                                      </span>
                                    </button>

                                    {/* Column 2: Center (Draw/VS) */}
                                    <div className="w-14 items-center justify-center text-center shrink-0 border-l border-r border-[#1b1e24]/60 bg-[#07080b] flex z-10">
                                      {match.status !== 'pending' ? (
                                        <div className="flex flex-col items-center justify-center select-none py-1">
                                          <span className="font-mono text-xs font-black text-amber-500 whitespace-nowrap">
                                            {match.homeScore !== undefined ? match.homeScore : '?'} : {match.awayScore !== undefined ? match.awayScore : '?'}
                                          </span>
                                        </div>
                                      ) : match.markets?.matchWinner?.draw && match.markets.matchWinner.draw > 0 ? (
                                        <button
                                          disabled={match.status !== 'pending'}
                                          onClick={() => handleSelectOption(match, 'draw', match.markets.matchWinner.draw)}
                                          className={`w-full h-full flex flex-col items-center justify-center text-center py-1 transition-all cursor-pointer border-0 select-none ${
                                            isSelected(match.id, 'draw')
                                              ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                              : 'text-neutral-400 hover:bg-[#1f222a]/50 bg-neutral-950/70'
                                          }`}
                                        >
                                          <span className="text-[8px] font-black opacity-80 leading-none">무</span>
                                          <span className="font-mono text-xs font-black mt-0.5">
                                            {match.markets.matchWinner.draw.toFixed(2)}
                                          </span>
                                        </button>
                                      ) : (
                                        <span className="font-mono text-[10px] font-black text-neutral-600 select-none uppercase">
                                          VS
                                        </span>
                                      )}
                                    </div>

                                    {/* Column 3: Away Win Button */}
                                    <button
                                      disabled={match.status !== 'pending'}
                                      onClick={() => handleSelectOption(match, 'away', match.markets?.matchWinner?.away)}
                                      className={`flex-1 min-w-0 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                                        isSelected(match.id, 'away')
                                          ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                          : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                                      }`}
                                    >
                                      <span className={`font-mono text-xs font-black shrink-0 mr-1.5 ${
                                        isSelected(match.id, 'away') ? 'text-black' : 'text-amber-500'
                                      }`}>
                                        {match.markets?.matchWinner?.away?.toFixed(2) || '1.00'}
                                      </span>
                                    <div className="flex items-center gap-1.5 justify-end min-w-0 flex-1">
                                        <span className={`truncate text-right flex-1 min-w-0 font-bold text-[10px] tracking-tighter ${
                                          isSelected(match.id, 'away') ? 'text-black' : 'text-neutral-200'
                                        }`}>
                                          {match.awayTeam}
                                        </span>
                                        {!(match.sport === 'soccer' || match.sport === '축구') && getTeamBadge(match.awayTeam)}
                                      </div>
                                    </button>
                                  </div>

                                 {/* Row 2: Handicaps (3 Columns) */}
                                 {match.markets?.handicaps?.slice(0, 1).map((handi: any, hIdx: number) => (
                                   <div key={`handi-mob-${hIdx}`} className="flex w-full min-h-[44px] items-stretch border-b border-[#1b1e24]/60 last:border-b-0 bg-[#16181d]/5">
                                     {/* Home Handicap Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectHandicap(match, handi, 'home')}
                                       className={`flex-1 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedHandicap(match.id, handi.value, 'home')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/40'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1 select-none relative z-10">
                                         <span className="text-[9px] font-sans font-black text-emerald-400 border border-emerald-900/40 bg-emerald-950/60 px-1 py-0.2 rounded-sm shrink-0 leading-tight">
                                           H
                                         </span>
                                         <span className={`font-bold text-[11px] tracking-tight ${
                                           isSelectedHandicap(match.id, handi.value, 'home') ? 'text-black font-black' : 'text-neutral-400'
                                         }`}>
                                           홈
                                         </span>
                                       </div>
                                       <span className={`font-mono text-xs font-black shrink-0 ml-1.5 relative z-10 ${
                                         isSelectedHandicap(match.id, handi.value, 'home') ? 'text-black' : 'text-neutral-200'
                                       }`}>
                                         {handi.home?.toFixed(2) || '1.00'}
                                       </span>
                                       {renderSelectedOverlay(isSelectedHandicap(match.id, handi.value, 'home'))}
                                     </button>

                                     {/* Line Value Center Pin */}
                                     <div className="w-14 items-center justify-center text-center shrink-0 border-l border-r border-[#1b1e24]/60 bg-[#07080b] flex z-10 font-mono text-[11px] font-black text-amber-500 select-none leading-none">
                                       {formatHandicapDisplay(handi.value, match.markets?.matchWinner?.home, match.markets?.matchWinner?.away)}
                                     </div>

                                     {/* Away Handicap Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectHandicap(match, handi, 'away')}
                                       className={`flex-1 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedHandicap(match.id, handi.value, 'away')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/40'
                                       }`}
                                     >
                                       <span className={`font-mono text-xs font-black shrink-0 mr-1.5 relative z-10 ${
                                         isSelectedHandicap(match.id, handi.value, 'away') ? 'text-black' : 'text-neutral-200'
                                       }`}>
                                         {handi.away?.toFixed(2) || '1.00'}
                                       </span>
                                       <div className="flex items-center gap-1 justify-end select-none relative z-10">
                                         <span className={`font-bold text-[11px] tracking-tight ${
                                           isSelectedHandicap(match.id, handi.value, 'away') ? 'text-black font-black' : 'text-neutral-400'
                                         }`}>
                                           원정
                                         </span>
                                         <span className="text-[9px] font-sans font-black text-emerald-400 border border-emerald-900/40 bg-emerald-950/60 px-1 py-0.2 rounded-sm shrink-0 leading-tight">
                                           H
                                         </span>
                                       </div>
                                       {renderSelectedOverlay(isSelectedHandicap(match.id, handi.value, 'away'))}
                                     </button>
                                   </div>
                                 ))}

                                 {/* Row 3: OverUnders (3 Columns) */}
                                 {match.markets?.overUnders?.slice(0, 1).map((ou: any, ouIdx: number) => (
                                   <div key={`ou-mob-${ouIdx}`} className="flex w-full min-h-[44px] items-stretch border-b border-[#1b1e24]/60 last:border-b-0 bg-[#16181d]/5">
                                     {/* Over Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectOverUnder(match, ou, 'over')}
                                       className={`flex-1 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedOverUnder(match.id, ou.value, 'over')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/40'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1 select-none relative z-10">
                                         <span className={`text-[11px] font-bold ${
                                           isSelectedOverUnder(match.id, ou.value, 'over') ? 'text-black font-black' : 'text-neutral-400'
                                         }`}>오버</span>
                                         <span className="text-rose-500 font-black text-[9px]">▲</span>
                                       </div>
                                       <span className={`font-mono text-xs font-black shrink-0 ml-1.5 relative z-10 ${
                                         isSelectedOverUnder(match.id, ou.value, 'over') ? 'text-black' : 'text-rose-450 text-rose-400'
                                       }`}>
                                         {ou.over?.toFixed(2) || '1.00'}
                                       </span>
                                       {renderSelectedOverlay(isSelectedOverUnder(match.id, ou.value, 'over'))}
                                     </button>

                                     {/* OverUnder line value Center Pin */}
                                     <div className="w-14 items-center justify-center text-center shrink-0 border-l border-r border-[#1b1e24]/60 bg-[#07080b] flex z-10 font-mono text-[11px] font-black text-amber-500 select-none leading-none">
                                       {cleanLineValue(ou.value) || '2.5'}
                                     </div>

                                     {/* Under Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectOverUnder(match, ou, 'under')}
                                       className={`flex-1 flex items-center justify-between px-3 py-2 transition-all cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedOverUnder(match.id, ou.value, 'under')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/40'
                                       }`}
                                     >
                                       <span className={`font-mono text-xs font-black shrink-0 mr-1.5 relative z-10 ${
                                         isSelectedOverUnder(match.id, ou.value, 'under') ? 'text-black' : 'text-sky-450'
                                       }`}>
                                         {ou.under?.toFixed(2) || '1.00'}
                                       </span>
                                       <div className="flex items-center gap-1 justify-end select-none relative z-10">
                                         <span className="text-sky-400 font-black text-[9px]">▼</span>
                                         <span className={`text-[11px] font-bold ${
                                           isSelectedOverUnder(match.id, ou.value, 'under') ? 'text-black font-black' : 'text-neutral-400'
                                         }`}>언더</span>
                                       </div>
                                       {renderSelectedOverlay(isSelectedOverUnder(match.id, ou.value, 'under'))}
                                     </button>
                                   </div>
                                 ))}
                               </>
                             ) : (
                               /* --- HIGH PERFORMANCE DESKTOP UI MODE --- */
                               <>
                                 {/* Row 1: 승무패 (Match Winner) */}
                                 <div className="flex w-full min-h-[44px] md:min-h-[48px] items-stretch border-b border-[#1b1e24] last:border-b-0 bg-[#16181d]/20">
                                   {/* Column 1: DateTime */}
                                   <div className="w-[85px] md:w-[110px] bg-[#0c0e11] border-r border-[#1b1e24] flex flex-col items-center justify-center p-2 text-center shrink-0">
                                     <span className="text-amber-500 font-mono font-bold text-[10px] md:text-[11px] leading-tight select-none">
                                       {match.dateTime || '06-07 00:00'}
                                     </span>
                                   </div>

                                   {/* Column 2: Home Team Win Button */}
                                   <button
                                     disabled={match.status !== 'pending'}
                                     onClick={() => handleSelectOption(match, 'home', match.markets?.matchWinner?.home)}
                                     className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-left group cursor-pointer border-0 select-none disabled:cursor-not-allowed ${
                                       isSelected(match.id, 'home')
                                         ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                         : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                                     }`}
                                   >
                                     <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 flex-1">
                                       {getTeamBadge(match.homeTeam)}
                                       <span className={`truncate font-black text-[11px] md:text-[13px] tracking-tight ${
                                         isSelected(match.id, 'home') ? 'text-black' : 'text-neutral-200'
                                       }`}>
                                         {match.homeTeam}
                                       </span>
                                     </div>
                                     <span className={`font-mono text-xs md:text-[14px] font-black shrink-0 ${
                                       isSelected(match.id, 'home') ? 'text-black' : 'text-amber-500'
                                     }`}>
                                       {match.markets?.matchWinner?.home?.toFixed(2) || '1.00'}
                                     </span>
                                   </button>

                                   {/* Column 3: Draw Column */}
                                   <div className="w-[75px] md:w-[90px] border-l border-r border-[#1b1e24] bg-[#0c0e11]/40 flex items-center justify-center text-center shrink-0">
                                     {match.status !== 'pending' ? (
                                       <div className="flex flex-col items-center justify-center select-none">
                                         <span className="text-[9px] font-bold text-neutral-505 leading-none mb-0.5">SCORE</span>
                                         <span className="font-mono text-xs md:text-sm font-black text-amber-500 whitespace-nowrap">
                                           {match.homeScore !== undefined ? match.homeScore : '?'} : {match.awayScore !== undefined ? match.awayScore : '?'}
                                         </span>
                                       </div>
                                     ) : match.markets?.matchWinner?.draw && match.markets.matchWinner.draw > 0 ? (
                                       <button
                                         disabled={match.status !== 'pending'}
                                         onClick={() => handleSelectOption(match, 'draw', match.markets.matchWinner.draw)}
                                         className={`w-full h-full flex items-center justify-center font-mono text-[11px] md:text-[13px] font-bold transition-all cursor-pointer border-0 select-none relative overflow-hidden ${
                                           isSelected(match.id, 'draw')
                                             ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                             : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-950/70'
                                         }`}
                                       >
                                         <span className="relative z-10">{match.markets.matchWinner.draw.toFixed(2)}</span>
                                         {renderSelectedOverlay(isSelected(match.id, 'draw'))}
                                       </button>
                                     ) : (
                                       <span className="font-mono text-[11px] md:text-[13px] font-extrabold text-neutral-600 uppercase select-none">
                                         VS
                                       </span>
                                     )}
                                   </div>

                                   {/* Column 4: Away Team Win Button */}
                                   <button
                                     disabled={match.status !== 'pending'}
                                     onClick={() => handleSelectOption(match, 'away', match.markets?.matchWinner?.away)}
                                     className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-right group cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                       isSelected(match.id, 'away')
                                         ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                         : 'text-neutral-200 hover:bg-[#1f222a]/50 bg-gradient-to-b from-neutral-900 to-neutral-950'
                                     }`}
                                   >
                                     <span className={`font-mono text-xs md:text-[14px] font-black shrink-0 relative z-10 ${
                                       isSelected(match.id, 'away') ? 'text-black' : 'text-amber-500'
                                     }`}>
                                       {match.markets?.matchWinner?.away?.toFixed(2) || '1.00'}
                                     </span>
                                     <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 justify-end relative z-10">
                                       <span className={`truncate font-black text-[11px] md:text-[13px] tracking-tight ${
                                         isSelected(match.id, 'away') ? 'text-black' : 'text-neutral-200'
                                       }`}>
                                         {match.awayTeam}
                                       </span>
                                       {getTeamBadge(match.awayTeam)}
                                     </div>
                                     {renderSelectedOverlay(isSelected(match.id, 'away'))}
                                   </button>
                                 </div>

                                 {/* Handicaps Row(s) */}
                                 {match.markets?.handicaps?.slice(0, 1).map((handi: any, hIdx: number) => (
                                   <div key={`handi-${hIdx}`} className="flex w-full min-h-[44px] md:min-h-[48px] items-stretch border-b border-[#1b1e24] last:border-b-0 bg-[#16181d]/10">
                                     {/* Column 1: Handicap Label */}
                                     <div className="w-[85px] md:w-[110px] bg-[#0c0e11] border-r border-[#1b1e24] flex items-center justify-center p-2 text-center shrink-0 select-none">
                                       <span className="text-amber-500 font-black text-[10px] md:text-[11px] tracking-tight">
                                         핸디캡
                                       </span>
                                     </div>

                                     {/* Column 2: Home Handicap Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectHandicap(match, handi, 'home')}
                                       className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-left cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedHandicap(match.id, handi.value, 'home')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/60'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 relative z-10">
                                         <span className={`truncate font-bold text-[11px] md:text-xs ${
                                           isSelectedHandicap(match.id, handi.value, 'home') ? 'text-black' : 'text-neutral-300'
                                         }`}>
                                           {match.homeTeam}
                                         </span>
                                       </div>
                                       <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                                         <span className="text-[9px] font-sans font-black text-emerald-450 border border-emerald-900/80 bg-emerald-950/40 px-1 py-0.5 rounded leading-none shrink-0 select-none">
                                           H
                                         </span>
                                         <span className={`font-mono text-xs md:text-[13px] font-extrabold ${
                                           isSelectedHandicap(match.id, handi.value, 'home') ? 'text-black' : 'text-neutral-200'
                                         }`}>
                                           {handi.home?.toFixed(2) || '1.00'}
                                         </span>
                                       </div>
                                       {renderSelectedOverlay(isSelectedHandicap(match.id, handi.value, 'home'))}
                                     </button>

                                     {/* Column 3: Handicap line value */}
                                     <div className="w-[75px] md:w-[90px] border-l border-r border-[#1b1e24] bg-[#0c0e11]/20 flex items-center justify-center text-center shrink-0 font-bold select-none">
                                       <span className="font-mono text-[11px] md:text-[13px] font-extrabold text-amber-500">
                                         {formatHandicapDisplay(handi.value, match.markets?.matchWinner?.home, match.markets?.matchWinner?.away)}
                                       </span>
                                     </div>

                                     {/* Column 4: Away Handicap Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectHandicap(match, handi, 'away')}
                                       className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-right cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedHandicap(match.id, handi.value, 'away')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/60'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                                         <span className={`font-mono text-xs md:text-[13px] font-extrabold mr-1.5 ${
                                           isSelectedHandicap(match.id, handi.value, 'away') ? 'text-black' : 'text-neutral-200'
                                         }`}>
                                           {handi.away?.toFixed(2) || '1.00'}
                                         </span>
                                         <span className="text-[9px] font-sans font-black text-emerald-450 border border-emerald-900/80 bg-emerald-950/40 px-1 py-0.5 rounded leading-none shrink-0 select-none">
                                           H
                                         </span>
                                       </div>
                                       <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 justify-end relative z-10">
                                         <span className={`truncate font-bold text-[11px] md:text-xs ${
                                           isSelectedHandicap(match.id, handi.value, 'away') ? 'text-black' : 'text-neutral-300'
                                         }`}>
                                           {match.awayTeam}
                                         </span>
                                       </div>
                                       {renderSelectedOverlay(isSelectedHandicap(match.id, handi.value, 'away'))}
                                     </button>
                                   </div>
                                 ))}

                                 {/* OverUnders Row(s) */}
                                 {match.markets?.overUnders?.slice(0, 1).map((ou: any, ouIdx: number) => (
                                   <div key={`ou-${ouIdx}`} className="flex w-full min-h-[44px] md:min-h-[48px] items-stretch border-b border-[#1b1e24] last:border-b-0 bg-[#16181d]/10">
                                     {/* Column 1: OverUnder Label */}
                                     <div className="w-[85px] md:w-[110px] bg-[#0c0e11] border-r border-[#1b1e24] flex items-center justify-center p-2 text-center shrink-0 select-none">
                                       <span className="text-amber-500 font-black text-[10px] md:text-[11px] tracking-tight">
                                         오버언더
                                       </span>
                                     </div>

                                     {/* Column 2: Over Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectOverUnder(match, ou, 'over')}
                                       className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-left cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedOverUnder(match.id, ou.value, 'over')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/60'
                                       }`}
                                     >
                                       <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 relative z-10">
                                         <div className="flex items-center gap-1 shrink-0">
                                           <span className={`text-[11px] md:text-xs font-bold ${
                                             isSelectedOverUnder(match.id, ou.value, 'over') ? 'text-black' : 'text-neutral-300'
                                           }`}>오버</span>
                                           <span className="text-rose-500 font-sans font-black text-[9px] md:text-xs select-none">▲</span>
                                         </div>
                                       </div>
                                       <span className={`font-mono text-xs md:text-[13px] font-extrabold shrink-0 relative z-10 ${
                                         isSelectedOverUnder(match.id, ou.value, 'over') ? 'text-black' : 'text-rose-455 text-rose-400'
                                       }`}>
                                         {ou.over?.toFixed(2) || '1.00'}
                                       </span>
                                       {renderSelectedOverlay(isSelectedOverUnder(match.id, ou.value, 'over'))}
                                     </button>

                                     {/* Column 3: Line value */}
                                     <div className="w-[75px] md:w-[90px] border-l border-r border-[#1b1e24] bg-[#0c0e11]/20 flex items-center justify-center text-center shrink-0 font-bold select-none">
                                       <span className="font-mono text-[11px] md:text-[13px] font-extrabold text-amber-500">
                                         {cleanLineValue(ou.value) || '2.5'}
                                       </span>
                                     </div>

                                     {/* Column 4: Under Button */}
                                     <button
                                       disabled={match.status !== 'pending'}
                                       onClick={() => handleSelectOverUnder(match, ou, 'under')}
                                       className={`flex-1 flex items-center justify-between px-3 md:px-5 py-2.5 transition-all text-right cursor-pointer border-0 select-none disabled:cursor-not-allowed relative overflow-hidden ${
                                         isSelectedOverUnder(match.id, ou.value, 'under')
                                           ? 'bg-amber-500 text-black hover:bg-amber-400 font-black shadow-inner'
                                           : 'text-neutral-300 hover:bg-[#1f222a]/50 bg-neutral-900/60'
                                       }`}
                                     >
                                       <span className={`font-mono text-xs md:text-[13px] font-extrabold shrink-0 relative z-10 ${
                                         isSelectedOverUnder(match.id, ou.value, 'under') ? 'text-black' : 'text-sky-450'
                                       }`}>
                                         {ou.under?.toFixed(2) || '1.00'}
                                       </span>
                                       <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0 justify-end relative z-10">
                                         <div className="flex items-center gap-1 shrink-0">
                                           <span className="text-sky-450 font-sans font-black text-[9px] md:text-xs select-none">▼</span>
                                           <span className={`text-[11px] md:text-xs font-bold ${
                                             isSelectedOverUnder(match.id, ou.value, 'under') ? 'text-black' : 'text-neutral-300'
                                           }`}>언더</span>
                                         </div>
                                        </div>
                                        {renderSelectedOverlay(isSelectedOverUnder(match.id, ou.value, 'under'))}
                                      </button>
                                    </div>
                                  ))}
                                </>
                              )}

                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                  {filteredMatches.length > 30 && (
                    <div id="infinite-scroll-trigger" className="mt-2 mb-6 p-4 bg-[#0a0c10] border border-neutral-850/80 rounded-2xl text-center space-y-1.5 shadow-xl">
                      <div className="text-xs text-neutral-350 font-black">
                        전체 {filteredMatches.length}경기 중 {Math.min(visibleCount, filteredMatches.length)}개의 경기 표시 중
                      </div>
                      <div className="text-[10px] text-neutral-520 font-bold">
                        {visibleCount < filteredMatches.length ? (
                          <span className="animate-pulse text-amber-500 flex items-center justify-center gap-1">
                            <span>⬇️</span> 스크롤을 아래로 내리면 자동으로 추가 경기가 로드됩니다
                          </span>
                        ) : (
                          <span className="text-emerald-450 flex items-center justify-center gap-1">
                            <span>✨</span> 모든 매치를 원활하게 가져왔습니다. 위로 올리면 다시 컴팩트하게 접힙니다
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>

        {/* Right Column: Betting Cart Sidebar */}
        <div 
          ref={betSlipRef}
          className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 ${
            isMobile 
              ? `fixed bottom-[54px] left-2 right-2 z-40 max-h-[72vh] overflow-hidden flex flex-col transition-transform duration-300 ${mobileBetSlipOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}` 
              : `lg:sticky lg:top-6`
          }`}>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              <h3 className="text-md font-black tracking-tight text-white">스포츠 배팅 카트</h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedFolders.length > 0 && (
                <button 
                  onClick={handleClearCart}
                  className="text-[10px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 text-neutral-450 hover:text-white px-2 py-1 rounded transition"
                >
                  비우기
                </button>
              )}
              {isMobile && (
                <button 
                  onClick={() => setMobileBetSlipOpen && setMobileBetSlipOpen(false)} 
                  className="text-amber-500 text-xs font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg active:scale-95 transition flex items-center gap-1 shrink-0"
                >
                  접기 ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-1 flex flex-col">
            {/* Selections Section */}
            <div className="space-y-2 shrink-0">
              {selectedFolders.length === 0 ? (
                <div className="py-10 text-center text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-black">선택된 경기 폴더가 없습니다.</p>
                <p className="text-[10px] text-gray-500 leading-tight">경기 배당 버튼을 클릭하여<br />정지/조합 배팅에 추가하십시오.</p>
              </div>
            ) : (
              selectedFolders.map((item, index) => (
                <div key={`${item.matchId}-${item.marketType}-${item.type}-${item.lineValue}`} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex flex-col gap-1.5 relative shadow-inner shrink-0">
                  <button
                    onClick={() => setSelectedFolders(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 font-bold transition text-xs px-2 py-1"
                    title="제거"
                  >
                    &times;
                  </button>
                  <div className="flex items-center gap-1 pr-6">
                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase leading-none border border-amber-500/20">
                      {item.marketType === 'bonus' ? '서비스' : deduplicateLeagueName(item.match.league)}
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-neutral-250 pr-5 truncate">
                    {item.marketType === 'bonus' ? '다폴더 보너스 추가 배당' : `${item.match.homeTeam} vs ${item.match.awayTeam}`}
                  </div>
                  <div className="flex items-center justify-between text-xs bg-neutral-900 border border-neutral-850/40 p-2 rounded-lg mt-0.5">
                    <span className="font-extrabold text-amber-500 flex items-center gap-1">
                      선택: <span className="text-white underline decoration-amber-500">{item.label}</span>
                    </span>
                    <span className="font-mono font-black text-neutral-200">{item.odds} 배당</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Parlay Multiplier Summary */}
          {selectedFolders.length > 0 && (
            <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-850 space-y-2 border-l-2 border-l-amber-500 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-extrabold">선택 총 폴더 카운터</span>
                <span className="font-mono font-black bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-amber-500">{selectedFolders.length}폴더</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-extrabold">합계 총 배당률</span>
                <span className="font-mono font-black text-amber-500 text-md">{formattedTotalOdds}배</span>
              </div>
            </div>
          )}

          {/* Betting Amount Entry */}
          <div className="space-y-2.5 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-black">배팅금액 (원)</span>
              <span className="text-[10px] text-amber-500 font-bold font-mono">
                보유머니: {userBalance?.toLocaleString() || '0'}원
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={betAmount === 0 ? '' : betAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setBetAmount(val);
                }}
                disabled={isPlacingBet}
                placeholder="배팅액 입력"
                className="w-full bg-neutral-950 border border-neutral-800/80 focus:border-amber-500/55 text-white p-3 rounded-xl font-black font-mono text-sm shadow-inner transition outline-none"
              />
              <span className="absolute right-3.5 top-3 text-[10px] font-black text-neutral-500 select-none">KRW</span>
            </div>

            {/* Quick Multipliers Buttons Grid */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[10000, 30000, 50000, 100000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isPlacingBet}
                  onClick={() => handleQuickAmount(amt)}
                  className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 py-2.5 px-1 rounded-lg text-[10px] font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none"
                >
                  +{amt >= 1000000 ? `${amt / 1000000}M` : amt >= 10000 ? `${amt / 10000}만` : amt}
                </button>
              ))}
              <button
                type="button"
                disabled={isPlacingBet}
                onClick={handleSetMaxAmount}
                className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 py-2.5 px-1 rounded-lg text-[10px] font-bold text-amber-500 hover:text-white transition cursor-pointer select-none"
              >
                최대
              </button>
              <button
                type="button"
                disabled={isPlacingBet}
                onClick={() => setBetAmount(0)}
                className="bg-neutral-950 hover:bg-[#0c1322] border border-[#1e293b] hover:border-sky-600 py-2.5 px-1 rounded-lg text-[10px] font-bold text-gray-400 hover:text-sky-400 transition cursor-pointer select-none"
              >
                초기화
              </button>
            </div>
          </div>

          {/* Expected Revenue Summary Block */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 shadow-inner space-y-1.5 shrink-0">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-500 font-extrabold">최종 수렴 배당</span>
              <span className="text-zinc-200 font-black font-mono">{formattedTotalOdds} 배</span>
            </div>
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-neutral-900">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-300 font-black flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> 예상 적중금액
                </span>
                <span className={`text-sm font-black font-sans tracking-tight ${(estimatedPayout > globalMaxPayoutLimit && !isAdmin) ? 'text-red-400' : 'text-emerald-400'}`}>
                  {estimatedPayout.toLocaleString()}원
                </span>
              </div>
              {(estimatedPayout > globalMaxPayoutLimit && !isAdmin) && (
                <div className="text-right text-[10px] text-red-500/90 font-bold bg-red-950/30 p-1.5 rounded border border-red-900/50">
                  최대 적중 상한금액 ({globalMaxPayoutLimit.toLocaleString()}원) 초과
                </div>
              )}
            </div>
          </div>

          {/* Core Submission Trigger */}
          <button
            onClick={handlePlaceSportsBet}
            disabled={isPlacingBet || selectedFolders.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 hover:from-amber-400 to-amber-600 hover:to-amber-500 disabled:opacity-20 disabled:pointer-events-none text-black font-black text-sm p-4 rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 select-none shrink-0"
          >
            {isPlacingBet ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                배팅 승인 중...
              </>
            ) : (
              <>
                배팅하기 (Place Stake)
              </>
            )}
          </button>
          </div>
        </div>

        {isMobile && selectedFolders.length > 0 && !mobileBetSlipOpen && (
          <div className="fixed bottom-[54px] left-0 right-0 z-50 px-3.5 py-2.5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-between border-t border-amber-500/30 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]">
            <button
              onClick={() => setMobileBetSlipOpen && setMobileBetSlipOpen(!mobileBetSlipOpen)}
              className="w-full flex items-center justify-between font-black text-xs text-white uppercase tracking-wider py-3 bg-gradient-to-r from-amber-500 to-amber-650 hover:from-amber-450 hover:to-amber-550 active:scale-95 transition-all rounded-xl px-5 shadow-[0_4px_12px_rgba(245,158,11,0.3)] cursor-pointer border-0"
            >
              <span className="flex items-center gap-2">
                🎰 배팅 슬립 열기 ▼
              </span>
              <span className="bg-white text-amber-950 px-2.5 py-0.5 rounded-full font-black text-[11px] font-mono shrink-0 select-none">
                {selectedFolders.length}개 선택됨
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertSquareIcon() {
  return (
    <div className="p-3 bg-neutral-950/60 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 border border-neutral-800">
      <AlertCircle className="w-6 h-6 text-neutral-600" />
    </div>
  );
}
