import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc, getDoc, setDoc, onSnapshot, Timestamp, limit, orderBy } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import PointHistoryView from './components/PointHistoryView';
import BetHistoryView from './components/BetHistoryView';
import AttendanceChecker from './components/AttendanceChecker';

import PartnerMenuView from './components/PartnerMenuView';
import { TelegramBanner, VerticalTelegramBanner } from './components/TelegramBanner';
import { VerticalDepositBanner } from './components/DepositBanner';
import { VerticalWithdrawalBanner } from './components/WithdrawalBanner';
import SportsContainer from './components/SportsContainer';
import CasinoContainer from './components/CasinoContainer';
import AdminMatchRegistration from './components/AdminMatchRegistration';
import LiveLineupBanner from './components/LiveLineupBanner';
import AdultWarningBanner from './components/AdultWarningBanner';
import { MobileBettingList } from './components/MobileBettingList';
import BGMControls from './components/BGMControls';
import { getSportCategory, isMatchActive } from './lib/matchUtils';
import { Shield, ShieldCheck, Users, Database, X, RefreshCw, Edit, Save, Trash2, Search, Check, AlertCircle, Copy, Coins, History, Lock, Settings, Gamepad2, Vote, Receipt, Home, Menu, RotateCw, Send, Mail, ShoppingCart, Zap, Gift, Sparkles, TrendingUp, Info, Layout, Dribbble, Workflow, Play, Tv, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

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
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  console.warn('Firestore operation handled gracefully:', error);
}

const defaultSportsHighlights = [
  {
    id: "choice_special_user",
    title: "EPL 최고 클래스 경기력 & 환상적인 원더골 모음 하이라이트 스페셜",
    embedId: "3y3NV_3Bkz8",
    category: "축구",
    duration: "13:42",
    views: "1.8M",
    tags: ["EPL 스페셜", "명경기"]
  },
  {
    id: "user_video_2",
    title: "손흥민 분노 폭발! 토트넘 역사에 길이 남을 미친 활약상 스페셜",
    embedId: "a_z8KwYrY8s",
    category: "축구",
    duration: "11:20",
    views: "2.1M",
    tags: ["EPL", "손흥민"]
  },
  {
    id: "user_video_3",
    title: "세계 축구사를 바꾼 역사상 가장 짜릿했던 역전승 명경기 한눈에 보기",
    embedId: "VaPfGMFe_4I",
    category: "축구",
    duration: "09:45",
    views: "1.5M",
    tags: ["명경기", "레전드"]
  },
  {
    id: "user_video_4",
    title: "예측불가 각본 없는 드라마! 역대급 짜릿한 버저비터 & 슈퍼 플레이",
    embedId: "uGwqKZ7jJnU",
    category: "스포츠",
    duration: "12:15",
    views: "980K",
    tags: ["최고의순간", "슈퍼플레이"]
  },
  {
    id: "user_video_5",
    title: "관중 전원 기립! 야구 역사상 가장 환상적인 수비 & 홈런 스페셜",
    embedId: "pxOYNRudATU",
    category: "야구",
    duration: "10:30",
    views: "850K",
    tags: ["야구", "홈런", "호수비"]
  }
];

function SportsHighlightsSection({ videos }: { videos: any[] }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      const scrollTo = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="-mt-[30px] block w-full bg-gradient-to-b from-[#0c0d12] to-[#06070a] border-2 border-sky-600/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl shadow-sky-950/10 space-y-4 md:space-y-5 relative">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <Tv className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wider flex items-center gap-2">
              스포츠 하이라이트
            </h3>
          </div>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-8 h-8 bg-[#12141c] hover:bg-neutral-800 border border-neutral-800 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-95 group/btn cursor-pointer"
            title="이전 영상"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-[1px]" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-8 h-8 bg-[#12141c] hover:bg-neutral-800 border border-neutral-800 text-gray-400 hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-95 group/btn cursor-pointer"
            title="다음 영상"
          >
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-[1px]" />
          </button>
        </div>
      </div>

      {/* Slide Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {videos.map((v, idx) => {
          const isPlaying = activeVideoId === v.id;
          return (
            <div
              key={v.id}
              className="min-w-[280px] sm:min-w-[340px] md:min-w-[420px] lg:min-w-[460px] flex-shrink-0 bg-[#12141c] border border-neutral-800 hover:border-red-500/65 rounded-xl overflow-hidden shadow-xl transition-all duration-350 hover:scale-[1.02] hover:shadow-red-500/10 group snap-start"
            >
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                {isPlaying ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${v.embedId}?autoplay=1`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div
                    className="absolute inset-0 cursor-pointer group flex items-center justify-center"
                    onClick={() => setActiveVideoId(v.id)}
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={`https://img.youtube.com/vi/${v.embedId}/hqdefault.jpg`}
                      alt={v.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />
                    
                    {/* Golden shimmer/sparkle overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.2),transparent_60%)] pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-in-out pointer-events-none z-10" />
                    <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(251,191,36,0.15)] group-hover:shadow-[inset_0_0_30px_rgba(251,191,36,0.4)] transition-all duration-500 pointer-events-none" />

                    {/* Play Button */}
                    <div className="relative z-10 w-11 h-11 rounded-full bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 group-hover:scale-110 group-hover:bg-sky-400 transition-all duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 bg-black/85 text-[10px] font-mono font-bold text-gray-200 px-1.5 py-0.5 rounded">
                      {v.duration}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MainPageProps {
  onLogout: () => void;
}

export default function MainPage({ onLogout }: MainPageProps) {
  // Focus Mode style application
  useEffect(() => {
    const element = document.querySelector('div#root:nth-of-type(1) > div:nth-of-type(2) > header:nth-of-type(1) > div:nth-of-type(4)') as HTMLElement;
    if (element) {
      element.style.marginLeft = '-130px';
    }
  }, []);

  const [nickname, setNickname] = useState('회원');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // State for user editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingWallet, setEditingWallet] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingWithdrawalPassword, setEditingWithdrawalPassword] = useState('');
  const [editingIsPartner, setEditingIsPartner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for My Page
  const [showMyPage, setShowMyPage] = useState(false);
  const [showAttendanceChecker, setShowAttendanceChecker] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showSports, setShowSports] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'전체' | '축구' | '농구' | '야구' | '배구' | '아이스하키'>('전체');
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [showMiniGameSubmenu, setShowMiniGameSubmenu] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [mobileBetSlipOpen, setMobileBetSlipOpen] = useState(false);
  const miniGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resolvingBetsRef = useRef<boolean>(false);
  const [activeMiniGameTab, setActiveMiniGameTab] = useState<string>('powerladder5');

  // Multi-game manual deadline adjustments managed by administrators (in 1-second intervals, default is 0)
  const [betCloseOffsets, setBetCloseOffsets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('betCloseOffsets');
    const defaults = {
      powerball5: 0,
      powerball3: 0,
      powerladder5: 0,
      powerladder3min: 0,
      redpowerladder5: 0,
      kenoladder5: 0,
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  // Real-time Firestore synchronization for betCloseOffsets
  useEffect(() => {
    const docRef = doc(db, 'settings', 'betCloseOffsets');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBetCloseOffsets(prev => ({
          ...prev,
          ...data,
        }));
      }
    }, (err) => {
      console.warn("Error listening to betCloseOffsets from Firestore:", err);
    });
    return () => unsubscribe();
  }, []);

  const updateBetCloseOffset = async (gameKey: string, newValue: number) => {
    // 1. Update local state
    setBetCloseOffsets(prev => {
      const updated = { ...prev, [gameKey]: newValue };
      localStorage.setItem('betCloseOffsets', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist to Firestore
    try {
      const docRef = doc(db, 'settings', 'betCloseOffsets');
      await setDoc(docRef, { [gameKey]: newValue }, { merge: true });
    } catch (err) {
      console.error("Failed to update betCloseOffset in Firestore:", err);
    }
  };
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
  const [sportsResults, setSportsResults] = useState<any[]>([]);
  const [isLoadingGameResults, setIsLoadingGameResults] = useState(false);
  const [gameResultFilter, setGameResultFilter] = useState('전체');
  const [gameResultPage, setGameResultPage] = useState(1);
  const [gameResultSearch, setGameResultSearch] = useState('');

  // State for Admin Deposit & Withdrawal Requests panel
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings' | 'inquiries' | 'matches' | 'minigames' | 'videos' | 'activeUsers'>('users');
  const [adminVideos, setAdminVideos] = useState<any[]>(defaultSportsHighlights);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [adminDepositRequests, setAdminDepositRequests] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1537); // Default
  const [newExchangeRate, setNewExchangeRate] = useState(''); // New state
  const [isLoadingAdminDeposits, setIsLoadingAdminDeposits] = useState(false);
  const [adminWithdrawalRequests, setAdminWithdrawalRequests] = useState<any[]>([]);
  const [isLoadingAdminWithdrawals, setIsLoadingAdminWithdrawals] = useState(false);

  // States for 1:1 Support System
  const [showSupportScreen, setShowSupportScreen] = useState(false);
  const [showEventScreen, setShowEventScreen] = useState(false);
  const [showNoticeScreen, setShowNoticeScreen] = useState(false);
  const [showTetherGuide, setShowTetherGuide] = useState(false);
  const [userInquiries, setUserInquiries] = useState<any[]>([]);
  const [adminInquiries, setAdminInquiries] = useState<any[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);

  // States for Notes / Mailbox System
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const notifiedNotesRef = useRef<Record<string, boolean>>({});
  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState(false);
  const [adminNoteTargetUsername, setAdminNoteTargetUsername] = useState('');
  const [adminNoteTargetNickname, setAdminNoteTargetNickname] = useState('');
  const [adminSelectedUserForBets, setAdminSelectedUserForBets] = useState<any | null>(null);
  const [isAdminBetsModalOpen, setIsAdminBetsModalOpen] = useState(false);
  const [adminNoteTitle, setAdminNoteTitle] = useState('');
  const [adminNoteContent, setAdminNoteContent] = useState('');
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiryType, setInquiryType] = useState<'normal' | 'account'>('normal');
  const [showCreateInquiryModal, setShowCreateInquiryModal] = useState(false);
  const [selectedInquiryDetail, setSelectedInquiryDetail] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Layout Management State for Minigames (Fully customizable by administrator via Drag & Drop or Position toggle buttons)
  const [minigameLayout, setMinigameLayout] = useState<{
    leftColumn: string[];
    rightColumn: string[];
    flexDirection: string;
  }>({
    leftColumn: ['video', 'board'],
    rightColumn: ['cart'],
    flexDirection: 'lg:flex-row'
  });

  const [allMatches, setAllMatches] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(fetchedMatches);
    });
    return () => unsubscribe();
  }, []);

  const handleLayoutDragStart = (e: React.DragEvent, item: string, sourceCol: 'left' | 'right', index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, sourceCol, index }));
  };

  const handleLayoutDrop = (e: React.DragEvent, targetCol: 'left' | 'right') => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { item, sourceCol, index } = JSON.parse(dataStr);
      
      if (sourceCol === targetCol) {
        return;
      }

      const sourceList = [...(sourceCol === 'left' ? minigameLayout.leftColumn : minigameLayout.rightColumn)];
      const targetList = [...(targetCol === 'left' ? minigameLayout.leftColumn : minigameLayout.rightColumn)];

      const itemIndex = sourceList.indexOf(item);
      if (itemIndex > -1) {
        sourceList.splice(itemIndex, 1);
        targetList.push(item);
      }

      setMinigameLayout({
        ...minigameLayout,
        leftColumn: sourceCol === 'left' ? sourceList : targetList,
        rightColumn: sourceCol === 'right' ? sourceList : targetList
      });
    } catch (err) {
      console.error("Error dropping layout widget:", err);
    }
  };

  const handleMoveColumn = (item: string, sourceCol: 'left' | 'right', targetCol: 'left' | 'right') => {
    const sourceList = [...(sourceCol === 'left' ? minigameLayout.leftColumn : minigameLayout.rightColumn)];
    const targetList = [...(targetCol === 'left' ? minigameLayout.leftColumn : minigameLayout.rightColumn)];

    const idx = sourceList.indexOf(item);
    if (idx > -1) {
      sourceList.splice(idx, 1);
      targetList.push(item);
    }

    setMinigameLayout({
      ...minigameLayout,
      leftColumn: sourceCol === 'left' ? sourceList : targetList,
      rightColumn: sourceCol === 'right' ? sourceList : targetList
    });
  };

  const handleMoveItem = (column: 'left' | 'right', index: number, direction: 'up' | 'down') => {
    const list = [...(column === 'left' ? minigameLayout.leftColumn : minigameLayout.rightColumn)];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }

    setMinigameLayout({
      ...minigameLayout,
      leftColumn: column === 'left' ? list : minigameLayout.leftColumn,
      rightColumn: column === 'right' ? list : minigameLayout.rightColumn
    });
  };

  // States for Referrer System
  const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
  const [userReferrerCode, setUserReferrerCode] = useState<string>(() => {
    let code = localStorage.getItem('userReferrerCode') || '13788';
    if (code.startsWith('REF-')) {
      code = code.replace('REF-', '');
      localStorage.setItem('userReferrerCode', code);
    }
    return code;
  });
  const [myAppliedReferrer, setMyAppliedReferrer] = useState<string>(() => localStorage.getItem('myAppliedReferrer') || '');
  const [referrerInputTemp, setReferrerInputTemp] = useState('13788');
  const [rollingPoints, setRollingPoints] = useState<number>(() => {
    const saved = localStorage.getItem('rollingPoints');
    return saved !== null ? Number(saved) : 0;
  });
  const [referredUsersCount, setReferredUsersCount] = useState<number>(() => {
    const saved = localStorage.getItem('referredUsersCount');
    return saved !== null ? Number(saved) : 0;
  });
  const [referredTotalBet, setReferredTotalBet] = useState<number>(() => {
    const saved = localStorage.getItem('referredTotalBet');
    return saved !== null ? Number(saved) : 0;
  });

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

  const handleExchangePoints = async () => {
    if (userPoints <= 0) {
      alert('교환할 포인트가 없습니다.');
      return;
    }
    
    const newBalance = userBalance + userPoints;
    const newPoints = 0;
    
    // 로그 기록
    const pointHistoryItem = {
        createdAt: Date.now(),
        type: 'exchange',
        description: '포인트 보유머니 교환',
        amount: -userPoints,
        balanceAfter: newBalance
    };
    const updatedHistory = [pointHistoryItem, ...(currentUserData.pointsHistory || [])];

    setUserBalance(newBalance);
    setUserPoints(newPoints);
    
    try {
        await updateDoc(doc(db, 'users', currentUserData.id), {
            balance: newBalance,
            points: newPoints,
            pointsHistory: updatedHistory
        });
        
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ 
                ...curObj, 
                balance: newBalance,
                points: newPoints,
                pointsHistory: updatedHistory
            }));
        }
        
        // 로컬 상태 강제 업데이트
        setCurrentUserData(prev => ({
            ...prev,
            balance: newBalance,
            points: newPoints,
            pointsHistory: updatedHistory
        }));
        
        alert(`포인트 ${userPoints.toLocaleString()}P가 보유머니로 교환되었습니다.`);
    } catch (e) {
        // ... (error handling)
    }
  };

  const closeMiniGameSubmenu = () => {
    miniGameTimeoutRef.current = setTimeout(() => {
      setShowMiniGameSubmenu(false);
    }, 400); 
  };

  // Dynamic user wallet balances connected to Firestore DB
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);
  const unreadCount = userNotes.filter(n => !n.read).length;

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Keno Ladder mobile view state & ref
  const [kenoLadderScale, setKenoLadderScale] = useState(1);
  const kenoContainerRef = useRef<HTMLDivElement>(null);

  const navigateTo = (target: 'home' | 'sports' | 'minigame' | 'deposit' | 'withdrawal' | 'gameresult' | 'bethistory' | 'pointshistory' | 'support' | 'mypage' | 'event' | 'notice' | 'tetherguide' | 'casino') => {
    setShowSports(false);
    setSelectedSport('전체');
    setShowBetHistory(false);
    setShowPointsHistory(false);
    setShowSupportScreen(false);
    setShowEventScreen(false);
    setShowNoticeScreen(false);
    setShowTetherGuide(false);
    setShowMyPage(false);
    setShowDepositScreen(false);
    setShowWithdrawalScreen(false);
    setShowGameResultScreen(false);
    setShowMiniGame(false);
    setShowAdminPanel(false);
    setShowAttendanceChecker(false);
    setShowCasino(false);

    if (target === 'sports') {
      setShowSports(true);
    } else if (target === 'minigame') {
      setShowMiniGame(true);
    } else if (target === 'deposit') {
      setShowDepositScreen(true);
    } else if (target === 'withdrawal') {
      setShowWithdrawalScreen(true);
    } else if (target === 'gameresult') {
      setShowGameResultScreen(true);
    } else if (target === 'bethistory') {
      setShowBetHistory(true);
    } else if (target === 'pointshistory') {
      setShowPointsHistory(true);
    } else if (target === 'support') {
      setShowSupportScreen(true);
    } else if (target === 'mypage') {
      setShowMyPage(true);
    } else if (target === 'event') {
      setShowEventScreen(true);
    } else if (target === 'notice') {
      setShowNoticeScreen(true);
    } else if (target === 'tetherguide') {
      setShowTetherGuide(true);
    } else if (target === 'casino') {
      alert('카지노 게임은 현재 서비스 준비중입니다.');
      return;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (kenoContainerRef.current) {
        setKenoLadderScale(kenoContainerRef.current.clientWidth / 830);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeMiniGameTab === 'kenoladder5') {
      const timer = setTimeout(() => {
        if (kenoContainerRef.current) {
          setKenoLadderScale(kenoContainerRef.current.clientWidth / 830);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeMiniGameTab, showMiniGame]);

  // States for Real-Time Betting System
  const [selectedOptions, setSelectedOptions] = useState<{ group: string; name: string; dividend: number; round: number; game: string; gameType: string }[]>([]);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | 'all'>('all');
  const [betAmount, setBetAmount] = useState<number>(10000);

  useEffect(() => {
    if (isMobile && selectedOptions.length > 0) {
      setMobileBetSlipOpen(true);
    } else if (selectedOptions.length === 0) {
      setMobileBetSlipOpen(false);
    }
  }, [selectedOptions, isMobile]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawingTimer, setDrawingTimer] = useState<number>(0);

  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [kstClock, setKstClock] = useState<string>('');

  // Minigame operation modes state (api = real-time API, rng = server pseudo-RNG, manual = admin manual input)
  const [minigameModes, setMinigameModes] = useState<Record<string, 'api' | 'rng' | 'manual'>>({
    powerball5: 'api',
    powerball3: 'api',
    powerladder5: 'api',
    powerladder3min: 'api',
    redpowerladder5: 'api',
    kenoladder5: 'api'
  });

  const minigameModesRef = useRef(minigameModes);
  useEffect(() => {
    minigameModesRef.current = minigameModes;
  }, [minigameModes]);

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
    
    // Standard stream offsets to align rounds layout with live broadcasts reliably:
    let iframeOffset = tab.includes('5') ? 25 : tab.includes('3') ? 20 : 5;
    if (tab === 'redpowerladder5') {
      iframeOffset = 178;
    }
    if (tab === 'kenoladder5') {
      iframeOffset = 171;
    }
    
    const adjustedSeconds = secondsInDay + iframeOffset;
    
    const interval = tab.includes('5') ? 5 : tab.includes('3') ? 3 : 1;
    const intervalInSeconds = interval * 60;
    
    const currentRound = Math.floor(adjustedSeconds / intervalInSeconds) + 1;
    const secondsElapsed = adjustedSeconds % intervalInSeconds;
    
    // Raw seconds remaining to the physical draw event
    const rawSecondsRemaining = intervalInSeconds - secondsElapsed;
    
    // Direct manual countdown adjustment seconds set by administrator (default is 0)
    const betCloseOffset = betCloseOffsets[tab] !== undefined ? betCloseOffsets[tab] : 0;
    
    // The actual displayed betting deadline countdown.
    // It hits 0 at the lock-out (10 seconds before draw plus the administrator's offset).
    const secondsRemaining = rawSecondsRemaining - 10 + betCloseOffset;
    
    return { currentRound, secondsRemaining, secondsElapsed, rawSecondsRemaining };
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
  }, [activeMiniGameTab, serverTimeOffset, betCloseOffsets]);

  // Dynamic background pending-bets auto-resolver & self-healing precision settlement synchronizer
  // [사용자 요구사항 반영] 배팅 자동정산은 "경기결과" 메뉴(gameResultsTTL 컬렉션)에 해당 회차가 업데이트로 등록된 직후에만 진행됩니다.
  useEffect(() => {
    if (!currentUserData || !currentUserData.bets || currentUserData.bets.length === 0) return;

    const checkAndResolveAndSync = async () => {
      if (resolvingBetsRef.current) return;
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

          const gType = folder.gameType || '';
          
          // [추가] 데이터 완결성 체크: 모든 필드가 존재해야 정산 진행
          if (gType === 'powerball5' || gType === 'powerball3') {
            if (!details.rolledOddEven || !details.rolledUnderOver || !details.size || !details.pbOddEven || !details.pbUnderOver) {
              return { isWinFolder: false, folderOutcome: '대기 중' };
            }
          }

          if (['powerladder5', 'redpowerladder5', 'powerladder3min'].includes(gType)) {
            if (!details.start || !details.lines || !details.outcome) {
              return { isWinFolder: false, folderOutcome: '대기 중' };
            }
          }

          if (gType === 'powerball5' || gType === 'powerball3') {
            const grp = (folder.group || '').trim();
            const opt = (folder.option || '').trim();

            if (grp === '일반볼' || grp === '일반볼홀짝' || grp === '일반볼언오버') {
              if (opt === '홀' || opt === '짝') {
                const rolled = (details.rolledOddEven || '').trim();
                if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
                isWinFolder = opt === rolled;
                folderOutcome = rolled;
              } else {
                const rolled = (details.rolledUnderOver || '').trim();
                if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
                isWinFolder = opt === rolled;
                folderOutcome = rolled;
              }
            } else if (grp === '일반볼 대중소') {
              const rolled = (details.size || '').trim();
              if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
              isWinFolder = opt === rolled;
              folderOutcome = rolled;
            } else if (grp === '파워볼' || grp === '파워볼홀짝' || grp === '파워볼언오버') {
              if (opt === '홀' || opt === '짝') {
                const rolled = (details.pbOddEven || '').trim();
                if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
                isWinFolder = opt === rolled;
                folderOutcome = rolled;
              } else {
                const rolled = (details.pbUnderOver || '').trim();
                if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
                isWinFolder = opt === rolled;
                folderOutcome = rolled;
              }
            }
          } else {
            const grp = (folder.group || '').trim();
            const opt = (folder.option || '').trim();

            if (grp === '출발지') {
              const rolled = (details.start || '').trim();
              if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
              isWinFolder = opt === rolled;
              folderOutcome = rolled;
            } else if (grp === '줄개수') {
              const rolled = (details.lines || '').trim();
              if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
              isWinFolder = opt === rolled;
              folderOutcome = rolled;
            } else if (grp === '최종결과' || grp === '홀짝') {
              const rolled = (details.outcome || '').trim();
              if (!rolled) return { isWinFolder: false, folderOutcome: '대기 중' };
              isWinFolder = opt === rolled;
              folderOutcome = rolled;
            }
          }
          return { isWinFolder, folderOutcome };
        };

        for (let i = 0; i < updatedBets.length; i++) {
          const bet = { ...updatedBets[i] };
          
          const isSettled = bet.status === 'win' || bet.status === 'lose';
          const isRecentBet = bet.createdAt && (Date.now() - (typeof bet.createdAt.toDate === 'function' ? bet.createdAt.toDate() : new Date(bet.createdAt)).getTime() < 2 * 24 * 60 * 60 * 1000);
          if (isSettled && !isRecentBet) continue;
          
          // Only check minigame bets to avoid touching sports bets accidentally
          const isMinigame = bet.gameType && [
            'powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'
          ].includes(bet.gameType);

          const hasMinigameFolders = bet.folders && bet.folders.length > 0 && bet.folders.every((f: any) => [
            'powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'
          ].includes(f.gameType));

          if (!isMinigame && !hasMinigameFolders) continue;

          let isResolvable = false;
          if (bet.folders && bet.folders.length > 0) {
            isResolvable = bet.folders.every((f: any) => {
              const { currentRound, secondsElapsed } = getRoundAndSecondsRemaining(f.gameType);
              if (f.round < currentRound - 1) return true;
              if (f.round === currentRound - 1) return secondsElapsed > 10;
              return false;
            });
          } else {
            const { currentRound, secondsElapsed } = getRoundAndSecondsRemaining(bet.gameType);
            if (bet.round < currentRound - 1) isResolvable = true;
            else if (bet.round === currentRound - 1) isResolvable = secondsElapsed > 10;
            else isResolvable = false;
          }

          if (!isResolvable) continue;

          let isWin = false;
          let winningOutcome = '';
          let someNotReady = false;
          const verifiedFolders: any[] = [];

          if (bet.folders && bet.folders.length > 0) {
            for (const f of bet.folders) {
              // Get official results representing the "Game Results" (경기결과) screen database
              const gameRes = await getOfficialRoundResultOnly(f.gameType, f.round, bet.createdAt);
              if (!gameRes) {
                // "경기결과" 메뉴에 활성화 회차가 아직 업데이트되지 않았으므로 정산을 보류하고 대기합니다.
                console.log(`[정산 대기] ${f.gameType} ${f.round}회차가 경기결과 메뉴에 업데이트되지 않았습니다. 업데이트를 대기 중입니다.`);
                someNotReady = true;
                break;
              }
              const { isWinFolder, folderOutcome } = rollSingleFolderUsingDetails(f, gameRes.details || {});
              if (folderOutcome === '대기 중') {
                someNotReady = true;
                break;
              }
              verifiedFolders.push({
                ...f,
                status: isWinFolder ? 'win' : 'lose',
                rollResult: folderOutcome
              });
            }
            if (someNotReady) continue;
            isWin = verifiedFolders.every((f: any) => f.status === 'win');
            winningOutcome = verifiedFolders.map((f: any) => `${f.option}➔[${f.rollResult}]`).join(', ');
          } else {
            // Get official results representing the "Game Results" (경기결과) screen database
            const gameRes = await getOfficialRoundResultOnly(bet.gameType, bet.round || 0, bet.createdAt);
            if (!gameRes) {
              // "경기결과" 메뉴에 활성화 회차가 아직 업데이트되지 않았으므로 정산을 보류하고 대기합니다.
              console.log(`[정산 대기] ${bet.gameType} ${bet.round}회차가 경기결과 메뉴에 업데이트되지 않았습니다. 업데이트를 대기 중입니다.`);
              continue;
            }

            const { isWinFolder, folderOutcome } = rollSingleFolderUsingDetails({
              gameType: bet.gameType,
              group: bet.group,
              option: bet.option
            }, gameRes.details || {});                

            console.log('[DEBUG] Verifying bet:', bet.gameType, bet.round, 'details:', gameRes.details, 'option:', bet.option, 'group:', bet.group, 'isWinFolder:', isWinFolder, 'folderOutcome:', folderOutcome);

            if (folderOutcome === '대기 중') {
              continue;
            }

            isWin = isWinFolder;
            winningOutcome = `${bet.group} [${folderOutcome}]`;
          }

          const verifiedStatus = isWin ? 'win' : 'lose';
          const originalStatus = bet.status;

          const originalRollResult = bet.rollResult || '';
          const outcomeDiffers = originalRollResult !== winningOutcome;

          // If the bet already has the correct verified status
          if (originalStatus === verifiedStatus) {
            if (outcomeDiffers) {
              bet.rollResult = winningOutcome;
              if (bet.folders && bet.folders.length > 0) {
                bet.folders = verifiedFolders;
              }
              updatedBets[i] = bet;
              didChange = true;
            }
            continue;
          }

          // Dynamic correction self-healing triggered!
          console.log(`[Self-Healing] Bet ${bet.id} corrected from '${originalStatus}' to '${verifiedStatus}'. Outcome: ${winningOutcome}`);
          bet.status = verifiedStatus;
          bet.rollResult = winningOutcome;
          if (bet.folders && bet.folders.length > 0) {
            bet.folders = verifiedFolders;
          }
          updatedBets[i] = bet;
          didChange = true;

          // Backtrack financial balances
          const originalPayout = originalStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;

          const correctedPayout = verifiedStatus === 'win' ? Math.floor(bet.amount * bet.dividend) : 0;

          const balanceOffset = correctedPayout - originalPayout;

          nowBalance += balanceOffset;

          if (originalStatus === 'pending') {
            if (verifiedStatus === 'win') {
              winningAlerts.push(`🎉 [배팅 적중] 축하합니다!\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n당첨 금액: +${correctedPayout.toLocaleString()}원`);
            } else {
              winningAlerts.push(`😢 [배팅 낙첨] 아쉽게도 낙첨되었습니다.\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n배팅 금액 ${bet.amount.toLocaleString()}원이 차감되었습니다.`);
            }
          } else {
            if (verifiedStatus === 'win') {
              winningAlerts.push(`🔄 [정산 결과 보정] 이전 낙첨 처리되었던 배팅 내역이 정밀 동기화 후 '적중'으로 자동 보정되었습니다.\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n지급 금액: +${correctedPayout.toLocaleString()}원`);
            } else {
              winningAlerts.push(`🔄 [정산 결과 보정] 이전 적중 처리되었던 배팅 내역이 정밀 동기화 후 '낙첨'으로 자동 보정되었습니다.\n\n결과: ${winningOutcome}\n배팅 정보: ${bet.game}\n회수 금액: -${originalPayout.toLocaleString()}원`);
            }
          }
        }

        if (didChange) {
          setUserBalance(nowBalance);

          const updatedUser = {
            ...currentUserData,
            balance: nowBalance,
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
            } catch (e) {
              console.error(e);
            }
          }

          try {
            await updateDoc(doc(db, 'users', currentUserData.id), {
              balance: nowBalance,
              bets: updatedBets
            });
          } catch (e) {
            console.error("Failed to update user in Firebase during self-healing: ", e);
          }

          if (winningAlerts.length > 0) {
            alert(winningAlerts.join('\n\n--------------------------\n\n'));
          }
        }
      } catch (err) {
        console.error("Error in checkAndResolveAndSync:", err);
      } finally {
        resolvingBetsRef.current = false;
      }
    };

    // Run once immediately on mount or user bets update
    checkAndResolveAndSync();

    // Check periodically on a relaxed 60-second interval
    const interval = setInterval(() => {
      checkAndResolveAndSync();
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUserData, gameResults]);


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
    if (betAmount < 5000) {
      alert('최소 배팅 금액은 5,000원입니다.');
      return;
    }
    if (betAmount > userBalance) {
      alert('보유머니가 부족합니다. 충전 후 이용해 주세요.');
      return;
    }

    if (betAmount > 2000000 && !isAdmin) {
      alert('최대 배팅 가능 금액은 2,000,000원입니다.');
      return;
    }

    const totalDividendForCheck = selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1);
    const formattedTotalDividendForCheck = Math.round(totalDividendForCheck * 100) / 100;

    if (betAmount * formattedTotalDividendForCheck > 4000000 && !isAdmin) {
      alert('최대 당첨 가능 금액은 4,000,000원입니다.');
      return;
    }

    // Validate if any parlayed option is in a closed round
    for (const opt of selectedOptions) {
      const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);

      if (opt.round < currentRound || (opt.round === currentRound && secondsRemaining <= 0)) {
        alert(`선택된 [${opt.game} ${opt.round}회차]는 이미 마감되었습니다 (남은 배팅 시간: ${secondsRemaining}초). 해당 폴더의 선택을 무효하고 다른 회차를 선택해 주세요.`);
        return;
      }
    }

    if (!confirm('정말 배팅하시겠습니까?\n한번 배팅을 확정하면 취소가 어렵습니다.')) {
      return;
    }

    const nextBalance = userBalance - betAmount;
    const pointsToAward = currentUserData?.isPartner ? 0 : Math.floor(betAmount * 0.03);

    setUserBalance(nextBalance);
    setUserPoints(prev => prev + pointsToAward);

    const totalDividend = selectedOptions.reduce((acc, opt) => acc * opt.dividend, 1);
    const formattedTotalDividend = Math.round(totalDividend * 100) / 100;

    const folders = selectedOptions.map(opt => {
      const gameLabel = opt.gameType === 'powerladder5' ? 'N파워사다리(5분)' : opt.gameType === 'powerladder3min' ? 'N파워사다리(3분)' : opt.gameType === 'redpowerladder5' ? '레드파워사다리(5분)' : opt.gameType === 'powerball5' ? 'N파워볼(5분)' : opt.gameType === 'powerball3' ? 'N파워볼(3분)' : opt.gameType === 'kenoladder5' ? '엔트리 키노사다리' : '알 수 없음';
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

    let updatedPointsHistory = [...(currentUserData.pointsHistory || [])];
    if (pointsToAward > 0) {
      const minigamePointRewardItem = {
        createdAt: Date.now(),
        type: 'bet_reward_minigame',
        description: `미니게임 배팅 적립 (${gameLabelString})`,
        amount: pointsToAward,
        balanceAfter: (currentUserData.points || 0) + pointsToAward
      };
      updatedPointsHistory = [minigamePointRewardItem, ...updatedPointsHistory].slice(0, 200);
    }

    setCurrentUserData(prev => ({
      ...prev,
      balance: nextBalance,
      points: (prev.points || 0) + pointsToAward,
      pointsHistory: updatedPointsHistory,
      bets: updatedBets
    }));

    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
      try {
        const curObj = JSON.parse(savedUserStr);
        localStorage.setItem('currentUser', JSON.stringify({ 
          ...curObj, 
          balance: nextBalance,
          points: (curObj.points || 0) + pointsToAward,
          pointsHistory: updatedPointsHistory,
          bets: updatedBets
        }));
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const userDocId = currentUserData?.id || currentUserData?.username || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').username) || (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('currentUser') || '{}').id);
      if (!userDocId) {
        throw new Error("User ID is missing or unregistered in state and cache");
      }
      await updateDoc(doc(db, 'users', userDocId), {
        balance: nextBalance,
        points: (currentUserData.points || 0) + pointsToAward,
        pointsHistory: updatedPointsHistory,
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
    const interval = type.includes('3') ? 3 : 5;
    
    const list = [];
    for (let i = 0; i < 1; i++) {
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
    const gamesMap: Record<string, string> = {
      'powerball5': 'N파워볼(5분)',
      'powerball3': 'N파워볼(3분)',
      'powerladder5': 'N파워사다리(5분)',
      'powerladder3min': 'N파워사다리(3분)',
      'redpowerladder5': '레드파워사다리(5분)',
      'kenoladder5': '엔트리 키노사다리'
    };

    const gameLabel = gamesMap[activeMiniGameTab] || '게임';

    upcomingRounds.forEach((rObj) => {
      // Filter by selectedRoundFilter
      if (selectedRoundFilter !== 'all' && selectedRoundFilter !== rObj.round) {
        return;
      }

      const isLadderGame = ['powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(activeMiniGameTab);
      const isPowerballGame = ['powerball5', 'powerball3'].includes(activeMiniGameTab);

      if (isLadderGame) {
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
      } else if (isPowerballGame) {
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '일반볼 [홀짝]',
          left: { label: '홀', dividend: 1.95, value: '홀', group: '일반볼홀짝' },
          right: { label: '짝', dividend: 1.95, value: '짝', group: '일반볼홀짝' },
          middle: 'VS'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '일반볼 [언더오버]',
          left: { label: '언더', dividend: 1.95, value: '언더', group: '일반볼언오버', suffix: ' [72.5]' },
          right: { label: '오버', dividend: 1.95, value: '오버', group: '일반볼언오버', suffix: ' [72.5]' },
          middle: '72.5'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '파워볼 [홀짝]',
          left: { label: '홀', dividend: 1.95, value: '홀', group: '파워볼홀짝' },
          right: { label: '짝', dividend: 1.95, value: '짝', group: '파워볼홀짝' },
          middle: 'VS'
        });
        rows.push({
          time: rObj.time,
          round: rObj.round,
          label: rObj.label,
          league: gameLabel,
          marketName: '파워볼 [언더오버]',
          left: { label: '언더', dividend: 1.95, value: '언더', group: '파워볼언오버', suffix: ' [4.5]' },
          right: { label: '오버', dividend: 1.95, value: '오버', group: '파워볼언오버', suffix: ' [4.5]' },
          middle: '4.5'
        });
      }
    });

    return rows;
  };

  const handleToggleOption = (group: string, name: string, dividend: number, round: number, game: string) => {
    const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(activeMiniGameTab);

    if (round < currentRound || (round === currentRound && secondsRemaining <= 0)) {
      alert(`해당 ${round}회차는 마감되었습니다 (남은 배팅 시간: ${secondsRemaining}초). 다음 회차가 시작되면 선택해 주세요.`);
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
        const b = userObj.balance !== undefined ? userObj.balance : 5000000;
        const p = userObj.points !== undefined ? userObj.points : 50000;
        setUserBalance(b);
        setUserPoints(p);
        
        if (userObj.nickname) {
          setNickname(userObj.nickname);
        }
        
        // Ensure currentUserData is initialized immediately with ID fallback to prevent any null or missing ID issues
        const initialUserData = {
          id: userObj.id || userObj.username,
          ...userObj,
          balance: b,
          points: p
        };
        setCurrentUserData(initialUserData);
        
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

          if (data.appliedReferrerCode) {
            let cleanApplied = data.appliedReferrerCode;
            if (cleanApplied.startsWith('REF-')) {
              cleanApplied = cleanApplied.replace('REF-', '');
            }
            setMyAppliedReferrer(cleanApplied);
            localStorage.setItem('myAppliedReferrer', cleanApplied);
          }
          if (data.referrerCode) {
            let cleanRef = data.referrerCode;
            if (cleanRef.startsWith('REF-')) {
              cleanRef = cleanRef.replace('REF-', '');
            }
            setUserReferrerCode(cleanRef);
            localStorage.setItem('userReferrerCode', cleanRef);
          }
          
          // Use Firestore lists if available, otherwise fall back to cached local lists to prevent loss on refresh
          const finalBets = data.bets !== undefined ? data.bets : (userObj?.bets || []);
          const finalPointsHistory = data.pointsHistory !== undefined ? data.pointsHistory : (userObj?.pointsHistory || []);

          const expandedData = { 
            id: docIdToUse, 
            ...data, 
            balance: bal, 
            points: pts,
            bets: finalBets,
            pointsHistory: finalPointsHistory
          };
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
                points: pts,
                bets: finalBets,
                pointsHistory: finalPointsHistory
              }));
            } catch (jsonErr) {
              console.warn("Failed to update cache JSON:", jsonErr);
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
            console.warn("Resilient query listener failed, using single fetch fallback:", queryError);
            getDoc(userDocRef).then((docSnap) => {
              if (docSnap.exists()) {
                console.log("Single fetch fallback succeeded:", docSnap.id, docSnap.data());
                syncToLocalStorageAndState(docSnap.id, docSnap.data());
              }
            }).catch(err => console.warn("Single fetch fallback failed:", err));
          });
        };

        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("Direct document listener matched:", docSnap.id, docSnap.data());
            syncToLocalStorageAndState(docSnap.id, docSnap.data());
          } else {
            console.warn("User document not found directly at docId:", docId, "trying query fallback and auto-ensuring");
            setupQueryListener();
            
            // Auto-heal: Ensure user document exists in Firestore and persist all existing histories (to prevent lost data on database redeployments or namespace change)
            console.log("Auto-ensuring user document in Firestore for:", userObj.username);
            setDoc(userDocRef, {
              joinCode: userObj.joinCode || '5882',
              username: userObj.username,
              password: userObj.password || '1234',
              nickname: userObj.nickname || '운영자',
              tetherWalletAddress: userObj.tetherWalletAddress || '',
              balance: userObj.balance !== undefined ? userObj.balance : 5000000,
              points: userObj.points !== undefined ? userObj.points : 50000,
              bets: userObj.bets || [],
              pointsHistory: userObj.pointsHistory || [],
              createdAt: new Date().toISOString()
            }).catch(err => console.warn("Auto-ensuring user creation failed:", err));
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
        console.warn("Error setting up user listener:", err);
      }
    }
  }, []);

  // Synchronize gameResultsTTL in real-time to allow immediate minigame settlement
  useEffect(() => {
    console.log("Setting up real-time listener for gameResultsTTL...");
    const q = query(
      collection(db, 'gameResultsTTL'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const minigameNames = ['N파워볼(5분)', 'N파워볼(3분)', 'N파워사다리(5분)', 'N파워사다리(3분)', '레드파워사다리(5분)', '엔트리 키노사다리'];
      const latestByGame: Record<string, any[]> = {};
      minigameNames.forEach(name => {
        latestByGame[name] = [];
      });

      snapshot.forEach(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() } as any;
        const gName = (data.gameName || '').trim();
        if (minigameNames.includes(gName)) {
          if (latestByGame[gName].length < 30) {
            latestByGame[gName].push(data);
          }
        }
      });

      const results = Object.values(latestByGame).flat();

      results.sort((a: any, b: any) => {
        const timeA = (a.createdAt && typeof a.createdAt.toMillis === 'function') ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = (b.createdAt && typeof b.createdAt.toMillis === 'function') ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      console.log("Real-time game results synced (latest 30 per game):", results);
      setGameResults(results);
    }, (error) => {
      console.warn("Real-time gameResultsTTL sync failed:", error);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize 1:1 inquiries in real-time
  useEffect(() => {
    const activeUsername = currentUserData?.username || currentUser?.username;
    if (!activeUsername) return;
    
    setIsLoadingInquiries(true);
    let q;
    if (isAdmin) {
      // Admin sees ALL inquiries
      q = collection(db, 'inquiries');
    } else {
      // Normal user only sees their own inquiries (using username to be resilient to fallback and legacy empty userId values)
      q = query(collection(db, 'inquiries'), where('username', '==', activeUsername));
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
        // Also populate userInquiries with inquiries written by this admin so they can see/test their own on the user support tab
        const myInquiries = list.filter(i => i.username === activeUsername);
        setUserInquiries(myInquiries);
      } else {
        setUserInquiries(list);
      }
      setIsLoadingInquiries(false);
    }, (error) => {
      console.warn("Inquiries sync failed. Reverting to empty list: ", error);
      setIsLoadingInquiries(false);
      handleFirestoreError(error, OperationType.GET, 'inquiries');
    });

    return () => unsubscribe();
  }, [currentUserData?.username, currentUser?.username, isAdmin]);

  // Synchronize user notes (쪽지) in real-time
  useEffect(() => {
    const activeUsername = currentUserData?.username || currentUser?.username;
    if (!activeUsername) return;

    console.log("Setting up real-time listener for notes of receiver:", activeUsername);
    const q = query(collection(db, 'notes'), where('receiverId', '==', activeUsername));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt ? Number(a.createdAt) : 0;
        const timeB = b.createdAt ? Number(b.createdAt) : 0;
        return timeB - timeA;
      });

      setUserNotes(list);
    }, (error) => {
      console.warn("Notes sync failed:", error);
    });

    return () => unsubscribe();
  }, [currentUserData?.username, currentUser?.username]);

  // Periodic Sound Alerter for unread notes (쪽지) - repeats every 1 minute if there are any unread messages
  const unreadNotesKey = userNotes.filter(n => !n.read).map(n => n.id).join(',');

  useEffect(() => {
    if (!unreadNotesKey) return;

    const playNotificationSound = () => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("쪽지가 도착했습니다, 빨리 확인해주세요.");
          utterance.lang = "ko-KR";
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
          console.log("[Notes Sound Alerter] Announcement played for unread notes list: ", unreadNotesKey);
        } catch (e) {
          console.error("[Notes Sound Alerter] SpeechSynthesis failed:", e);
        }
      }
    };

    // Play immediately on mount or when the set of unread notes changes
    playNotificationSound();

    // Repeat once every 1 minute (60,000 milliseconds)
    const intervalId = setInterval(() => {
      playNotificationSound();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [unreadNotesKey]);

  // Mobile/iOS Safari/Android Autoplay SpeechSynthesis Unlocker
  useEffect(() => {
    const unlockSpeech = () => {
      if ('speechSynthesis' in window) {
        try {
          const emptyUtterance = new SpeechSynthesisUtterance("");
          emptyUtterance.volume = 0;
          window.speechSynthesis.speak(emptyUtterance);
          console.log("SpeechSynthesis successfully primed/unlocked for mobile environment.");
          
          // Remove listener upon first interaction unlock
          window.removeEventListener('click', unlockSpeech);
          window.removeEventListener('touchstart', unlockSpeech);
        } catch (e) {
          console.warn("SpeechSynthesis autoplay unlock failed: ", e);
        }
      }
    };

    window.addEventListener('click', unlockSpeech, { passive: true });
    window.addEventListener('touchstart', unlockSpeech, { passive: true });

    return () => {
      window.removeEventListener('click', unlockSpeech);
      window.removeEventListener('touchstart', unlockSpeech);
    };
  }, []);

  const handleReadNote = async (note: any) => {
    setSelectedNote(note);
    if (!note.read) {
      try {
        await updateDoc(doc(db, 'notes', note.id), { read: true });
      } catch (err) {
        console.warn("Failed to mark note as read:", err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 쪽지를 정말로 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } catch (err) {
        console.warn("Failed to delete note:", err);
      }
    }
  };

  const handleSendAdminNote = async () => {
    if (!adminNoteTitle.trim() || !adminNoteContent.trim()) {
      alert('쪽지 제목과 내용을 모두 입력해주십시오.');
      return;
    }

    try {
      if (adminNoteTargetUsername === 'ALL_USERS') {
        if (adminUsers.length === 0) {
          alert('등록된 회원 목록이 비어있어 발송할 수 없습니다.');
          return;
        }
        
        let sentCount = 0;
        for (const user of adminUsers) {
          if (user.username) {
            await addDoc(collection(db, 'notes'), {
              receiverId: user.username,
              sender: '운영자',
              title: adminNoteTitle.trim(),
              content: adminNoteContent.trim(),
              read: false,
              createdAt: Date.now()
            });
            sentCount++;
          }
        }
        alert(`전체 발송 성공: 총 ${sentCount}명의 회원 전원에게 일괄 쪽지를 발송 완료하였습니다!`);
      } else {
        if (!adminNoteTargetUsername) {
          alert('수신 회원 정보가 올바르지 않습니다.');
          return;
        }
        await addDoc(collection(db, 'notes'), {
          receiverId: adminNoteTargetUsername,
          sender: '운영자',
          title: adminNoteTitle.trim(),
          content: adminNoteContent.trim(),
          read: false,
          createdAt: Date.now()
        });
        alert(`[${adminNoteTargetNickname || adminNoteTargetUsername}] 회원에게 개별 쪽지를 성공적으로 발송하였습니다!`);
      }

      setAdminNoteTitle('');
      setAdminNoteContent('');
      setIsAdminNoteModalOpen(false);
    } catch (err) {
      console.error("Failed to send admin note:", err);
      alert('쪽지 전송 처리 도중 데이터베이스 서버 통신 오류가 발생했습니다.');
    }
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryTitle.trim() || !inquiryContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    try {
      const uid = currentUserData?.id || currentUser?.id || 'unknown';
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
        const data = docSnap.data();
        if (data.usdtToKrwRate !== undefined) {
          setExchangeRate(data.usdtToKrwRate);
        }
        if (data.videos && Array.isArray(data.videos)) {
          setAdminVideos(data.videos);
        }
        if (data.minigameLayout) {
          setMinigameLayout({
            leftColumn: data.minigameLayout.leftColumn || ['video', 'board'],
            rightColumn: data.minigameLayout.rightColumn || ['cart'],
            flexDirection: data.minigameLayout.flexDirection || 'lg:flex-row'
          });
        }
        if (data.minigameModes) {
          const loadedModes = { ...data.minigameModes };
          // Enforce that only authorized real-time games can ever be set to 'api' mode
          Object.keys(loadedModes).forEach(key => {
            const apiSupportedGames = ['powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'];
            if (!apiSupportedGames.includes(key) && loadedModes[key] === 'api') {
              loadedModes[key] = 'manual';
            }
          });
          setMinigameModes(prev => ({
            ...prev,
            ...loadedModes
          }));
        }
      }
    } catch (e) {
      console.warn("Error loading exchange rate and minigame modes:", e);
    }
  };

  const getKstDateCompact = (timestampInput?: any) => {
    let dateObjObj = new Date();
    if (timestampInput) {
      if (typeof timestampInput.toDate === 'function') {
        dateObjObj = timestampInput.toDate();
      } else {
        dateObjObj = new Date(timestampInput);
      }
    }
    const kstTime = new Date(dateObjObj.getTime() + (9 * 60 * 60 * 1000));
    const year = kstTime.getUTCFullYear();
    const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const getDeterministicResult = (gameType: string, roundNum: number, dateString: string) => {
    // A stable, completely localized PRNG seeded by the unique combination of game, date, and round.
    // This guarantees that any client or backend container computes the EXACT same results, preventing race conditions or browser mismatches.
    const seed = `${gameType}_${dateString}_${roundNum}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rnd = () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };

    let resultStr = '';
    let details: any = {};
    
    if (gameType === 'powerball5' || gameType === 'powerball3') {
      const rolledOddEven = rnd() < 0.5 ? '홀' : '짝';
      const rolledUnderOver = rnd() < 0.5 ? '언더' : '오버';
      const sizeSeed = rnd();
      const size = sizeSeed < 0.3 ? '소' : sizeSeed < 0.7 ? '중' : '대';
      
      const pbOddEven = rnd() < 0.5 ? '홀' : '짝';
      const pbUnderOver = rnd() < 0.5 ? '언더' : '오버';
      
      resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
      details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
    } else {
      const start = rnd() < 0.5 ? '좌' : '우';
      const lines = rnd() < 0.5 ? '3줄' : '4줄';
      const outcome = (start === '좌' && lines === '3줄') || (start === '우' && lines === '4줄') ? '짝' : '홀';
      
      resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
      details = { start, lines, outcome };
    }

    return { resultStr, details };
  };

  const getOfficialRoundResultOnly = async (gameType: string, roundNum: number, betCreatedAt?: any) => {
    const dateCompact = getKstDateCompact(betCreatedAt);
    const docId = `${gameType}_${dateCompact}_${roundNum}`;

    const cachedResult = gameResults.find(r => 
      r.id === docId || 
      (r.gameType === gameType && r.round === roundNum && getKstDateCompact(r.createdAt) === dateCompact)
    );
    if (cachedResult) {
      return cachedResult;
    }

    // Try segment ID first
    let docRef = doc(db, 'gameResultsTTL', docId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.error("Error reading doc in getOfficialRoundResultOnly:", err);
    }

    // Dynamically retrieve results and insert them to Firestore automatically
    try {
      const dbResult = await getOrInsertAuthoritativeRoundResult(gameType, roundNum, betCreatedAt);
      if (dbResult) {
        return dbResult;
      }
    } catch (err) {
      console.error("Error dynamically retrieving/inserting result in getOfficialRoundResultOnly:", err);
    }

    return null;
  };

  const isItemDateAndRoundMatch = (item: any, r: number, dateString: string) => {
    if (!item) return false;

    // 1. Verify round matches r (daily round 1-288) or full round matching
    const itemRound = parseInt(item.round, 10);
    const itemDateRound = parseInt(item.date_round, 10);
    const itemFixedDateRound = item.fixed_date_round ? parseInt(item.fixed_date_round, 10) : NaN;

    const roundMatches = 
      itemRound === r || 
      itemDateRound === r || 
      (!isNaN(itemFixedDateRound) && (itemFixedDateRound % 1000 === r || itemFixedDateRound % 100 === r || itemFixedDateRound === r));

    if (!roundMatches) return false;

    // 2. Safely verify KST date of draw to prevent matching yesterday's same-round results
    const targetDateCompact = dateString.replace(/-/g, ''); // e.g. "20260608"
    
    // Check if fixed_date_round explicitly matches or starts with today's compact date
    if (item.fixed_date_round && item.fixed_date_round.toString().includes(targetDateCompact)) {
      return true;
    }

    // Secondary scan across dates/timestamps keys inside item
    let hasDateMatch = false;
    const dateKeys = Object.keys(item).filter(k => 
      k.toLowerCase().includes('date') || 
      k.toLowerCase().includes('time') || 
      k.toLowerCase().includes('created')
    );

    for (const key of dateKeys) {
      const val = String(item[key] || '');
      if (val.includes(dateString) || val.includes(targetDateCompact) || val.includes(dateString.replace(/-/g, '/'))) {
        hasDateMatch = true;
        break;
      }
    }

    // If date-related fields exist, enforce they match our target KST date
    if (dateKeys.length > 0 && !hasDateMatch) {
      return false;
    }

    return true;
  };

  const getOrInsertAuthoritativeRoundResult = async (gameType: string, roundNum: number, betCreatedAt?: any) => {
    const dateCompact = getKstDateCompact(betCreatedAt);
    const docId = `${gameType}_${dateCompact}_${roundNum}`;
    
    let docRef = doc(db, 'gameResultsTTL', docId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.error("Error reading doc in getOrInsertAuthoritativeRoundResult:", err);
    }

    // Determine active game operation mode
    const activeMode = minigameModesRef.current[gameType] || 
      (['powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(gameType) ? 'api' : 'manual');

    // If manual mode is active, prevent any automatic result generation to keep the round pending
    if (activeMode === 'manual') {
      console.log(`[Minigame Manual Mode] Round ${roundNum} for ${gameType} is waiting for explicit admin results registration.`);
      return null;
    }

    const gamesMap: Record<string, string> = {
      'powerball5': 'N파워볼(5분)',
      'powerball3': 'N파워볼(3분)',
      'powerladder5': 'N파워사다리(5분)',
      'powerladder3min': 'N파워사다리(3분)',
      'redpowerladder5': '레드파워사다리(5분)',
      'kenoladder5': '엔트리 키노사다리'
    };
    const name = gamesMap[gameType] || gameType;
    
    // Construct exact dateString matching target dateCompact "YYYYMMDD" to "YYYY-MM-DD"
    const dateString = `${dateCompact.slice(0, 4)}-${dateCompact.slice(4, 6)}-${dateCompact.slice(6, 8)}`;

    let resultStr = '';
    let details: any = {};
    
    // Fill resultStr using the designated source
    if (activeMode === 'api') {
      // 1. Handle powerball5 / powerball3 (N파워볼 5분 / 3분)
      if (gameType === 'powerball5' || gameType === 'powerball3') {
        try {
          // A. Try the RECENT historical results array first for maximum coverage
          const recentUrl = gameType === 'powerball5' ? '/api/game-result/powerball/recent' : '/api/game-result/powerball3/recent';
          const recentRes = await fetch(recentUrl);
          if (recentRes.ok) {
            const recentList = await recentRes.json();
            if (Array.isArray(recentList)) {
              const matchedItem = recentList.find(item => {
                return isItemDateAndRoundMatch(item, roundNum, dateString);
              });
              
              if (matchedItem && matchedItem.sum_odd_even && matchedItem.sum_unover && matchedItem.sum_size && matchedItem.powerball_odd_even && matchedItem.powerball_unover) {
                // Ensure data correctness
                const isValidOddEven = ['ODD', 'EVEN'].includes(matchedItem.sum_odd_even);
                const isValidUnover = ['UNDER', 'OVER'].includes(matchedItem.sum_unover);
                const isValidSize = ['S', 'M', 'L'].includes(matchedItem.sum_size);
                const isValidPbOddEven = ['ODD', 'EVEN'].includes(matchedItem.powerball_odd_even);
                const isValidPbUnover = ['UNDER', 'OVER'].includes(matchedItem.powerball_unover);

                if (!isValidOddEven || !isValidUnover || !isValidSize || !isValidPbOddEven || !isValidPbUnover) {
                  console.error(`[Data Error] Invalid data received for ${gameType} Round ${roundNum}:`, matchedItem);
                  return null;
                }

                const rolledOddEven = matchedItem.sum_odd_even === 'EVEN' ? '짝' : '홀';
                const rolledUnderOver = matchedItem.sum_unover === 'UNDER' ? '언더' : '오버';
                const size = matchedItem.sum_size === 'S' ? '소' : matchedItem.sum_size === 'L' ? '대' : '중';
                const pbOddEven = matchedItem.powerball_odd_even === 'EVEN' ? '짝' : '홀';
                const pbUnderOver = matchedItem.powerball_unover === 'UNDER' ? '언더' : '오버';

                resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
                details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
                console.log(`Matched real-world recent list results for ${gameType} Round ${roundNum}!`);
              }
            }
          }
        } catch (err) {
          console.warn(`Error fetching live powerball results for ${gameType}:`, err);
        }
      }

      // 2. Handle powerladder5 (N파워사다리 5분)
      if (gameType === 'powerladder5') {
        try {
          // A. Try the RECENT historical results array first
          const recentRes = await fetch('/api/game-result/powerladder/recent');
          if (recentRes.ok) {
            const recentList = await recentRes.json();
            if (Array.isArray(recentList)) {
              const matchedItem = recentList.find(item => {
                return isItemDateAndRoundMatch(item, roundNum, dateString);
              });

              if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                const isValidStart = ['LEFT', 'RIGHT'].includes(matchedItem.start_point);
                const isValidLines = ['3', '4', 3, 4].includes(matchedItem.line_count);
                const isValidOddEven = ['ODD', 'EVEN'].includes(matchedItem.odd_even);

                if (!isValidStart || !isValidLines || !isValidOddEven) {
                  console.error(`[Data Error] Invalid data received for powerladder5 Round ${roundNum}:`, matchedItem);
                  return null;
                }

                const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                details = { start, lines, outcome };
                console.log(`Matched real-world recent list results for powerladder5 Round ${roundNum}!`);
              }
            }
          }
        } catch (err) {
          console.warn("Error fetching live powerladder results:", err);
        }
      }

      // 4. Handle redpowerladder5 (레드파워사다리 5분)
      if (gameType === 'redpowerladder5') {
        try {
          const recentRes = await fetch('/api/game-result/redpowerladder/recent');
          if (recentRes.ok) {
            const recentList = await recentRes.json();
            if (Array.isArray(recentList)) {
              const matchedItem = recentList.find(item => {
                return isItemDateAndRoundMatch(item, roundNum, dateString);
              });

              if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                const isValidStart = ['LEFT', 'RIGHT'].includes(matchedItem.start_point);
                const isValidLines = ['3', '4', 3, 4].includes(matchedItem.line_count);
                const isValidOddEven = ['ODD', 'EVEN'].includes(matchedItem.odd_even);

                if (!isValidStart || !isValidLines || !isValidOddEven) {
                  console.error(`[Data Error] Invalid data received for redpowerladder5 Round ${roundNum}:`, matchedItem);
                  return null;
                }

                const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                details = { start, lines, outcome };
                console.log(`Matched real-world recent list results for redpowerladder5 Round ${roundNum}!`);
              }
            }
          }
        } catch (err) {
          console.warn("Error fetching live redpowerladder results:", err);
        }
      }

      // 5. Handle powerladder3min (N파워사다리 3분)
      if (gameType === 'powerladder3min') {
        try {
          const recentRes = await fetch('/api/game-result/powerladder3min/recent');
          if (recentRes.ok) {
            const recentList = await recentRes.json();
            if (Array.isArray(recentList)) {
              const matchedItem = recentList.find(item => {
                return isItemDateAndRoundMatch(item, roundNum, dateString);
              });

              if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                // [검증 강화] 잘못된 데이터가 정산에 사용되는 것을 방지합니다.
                const isValidStart = ['LEFT', 'RIGHT'].includes(matchedItem.start_point);
                const isValidLines = ['3', '4', 3, 4].includes(matchedItem.line_count);
                const isValidOddEven = ['ODD', 'EVEN'].includes(matchedItem.odd_even);
                
                if (!isValidStart || !isValidLines || !isValidOddEven) {
                  console.error(`[Data Error] Invalid data received for powerladder3min Round ${roundNum}:`, matchedItem);
                  return null; // 데이터가 유효하지 않으면 정산 진행 안 함
                }

                const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                details = { start, lines, outcome };
                console.log(`Matched real-world recent list results for powerladder3min Round ${roundNum}!`);
              }
            }
          }
        } catch (err) {
          console.warn("Error fetching live powerladder3min results:", err);
        }
      }

      // 6. Handle kenoladder5 (엔트리 키노사다리 5분)
      if (gameType === 'kenoladder5') {
        try {
          const recentRes = await fetch('/api/game-result/kenoladder/recent');
          if (recentRes.ok) {
            const recentList = await recentRes.json();
            if (Array.isArray(recentList)) {
              const matchedItem = recentList.find(item => {
                return isItemDateAndRoundMatch(item, roundNum, dateString);
              });

              if (matchedItem) {
                // If fields are missing, try mapping from Bepick structure (fd1, fd2, fd3)
                const startPoint = matchedItem.start_point || (matchedItem.fd1 == 1 ? 'LEFT' : 'RIGHT');
                const lineCount = matchedItem.line_count || (matchedItem.fd2 == 1 ? '3' : '4');
                const oddEven = matchedItem.odd_even || (matchedItem.fd3 == 1 ? 'ODD' : 'EVEN');

                const isValidStart = ['LEFT', 'RIGHT'].includes(startPoint);
                const isValidLines = ['3', '4', 3, 4].includes(lineCount);
                const isValidOddEven = ['ODD', 'EVEN'].includes(oddEven);
                
                if (!isValidStart || !isValidLines || !isValidOddEven) {
                  console.error(`[Data Error] Invalid data received for kenoladder5 Round ${roundNum}:`, matchedItem);
                  return null;
                }

                const start = startPoint === 'LEFT' ? '좌' : '우';
                const lines = lineCount === '3' || lineCount == 3 ? '3줄' : '4줄';
                const outcome = oddEven === 'EVEN' ? '짝' : '홀';

                resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                details = { start, lines, outcome };
                console.log(`Matched real-world recent list results for kenoladder5 Round ${roundNum}!`);
              }
            }
          }
        } catch (err) {
          console.warn("Error fetching live kenoladder5 results:", err);
        }
      }
    }

    if (!resultStr) {
      // [수학공식 자동생성 임시 차단] 실제 경기정보가 동기화되기 전까지 임시값으로 채워지는 것을 차단합니다.
      console.log(`[Auto-Result Blocked] Result for ${gameType} Round ${roundNum} is empty. Blocking mathematical formula fallback to keep round pending.`);
      return null;
    }
    
    const docData = {
      gameName: name,
      round: roundNum,
      result: resultStr,
      details,
      createdAt: Timestamp.fromDate(new Date())
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
      if (typeof document !== 'undefined' && document.hidden) {
        console.log("[Optimize Check] Tab is hidden/in-background. Skipping autoInsertRecentGameResults to save Firestore read quota.");
        return;
      }
      // Only fetch the last 30 minutes of game results to check which ones exist, preventing scaling bottlenecks and optimizing performance
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const snap = await getDocs(query(collection(db, 'gameResultsTTL'), where('createdAt', '>=', Timestamp.fromDate(thirtyMinutesAgo))));
      const existingIds = new Set(snap.docs.map(d => d.id));

      const games = [
        { key: 'powerball5', name: 'N파워볼(5분)' },
        { key: 'powerball3', name: 'N파워볼(3분)' },
        { key: 'powerladder5', name: 'N파워사다리(5분)' },
        { key: 'powerladder3min', name: 'N파워사다리(3분)' },
        { key: 'redpowerladder5', name: '레드파워사다리(5분)' },
        { key: 'kenoladder5', name: '엔트리 키노사다리' }
      ];

      let didAdd = false;

      // Pull multi-game live results in parallel to boost match rate and execution speed
      let livePowerballData: any = null;
      let livePowerballRecent: any[] = [];
      let livePowerball3Data: any = null;
      let livePowerball3Recent: any[] = [];
      let livePowerladderData: any = null;
      let livePowerladderRecent: any[] = [];
      let liveRedPowerladderData: any = null;
      let liveRedPowerladderRecent: any[] = [];
      let livePowerladder3Data: any = null;
      let livePowerladder3Recent: any[] = [];
      let liveKenoladderRecent: any[] = [];
      const liveDaridari3Data = null;
      const liveDaridari3Recent: any[] = [];

      try {
        const [pbRes, pbRecRes, pb3Res, pb3RecRes, plRes, plRecRes, rplRes, rplRecRes, pl3Res, pl3RecRes, klRecRes] = await Promise.all([
          fetch('/api/game-result/powerball').catch(() => null),
          fetch('/api/game-result/powerball/recent').catch(() => null),
          fetch('/api/game-result/powerball3').catch(() => null),
          fetch('/api/game-result/powerball3/recent').catch(() => null),
          fetch('/api/game-result/powerladder').catch(() => null),
          fetch('/api/game-result/powerladder/recent').catch(() => null),
          fetch('/api/game-result/redpowerladder').catch(() => null),
          fetch('/api/game-result/redpowerladder/recent').catch(() => null),
          fetch('/api/game-result/powerladder3min').catch(() => null),
          fetch('/api/game-result/powerladder3min/recent').catch(() => null),
          fetch('/api/game-result/kenoladder/recent').catch(() => null)
        ]);

        if (pbRes && pbRes.ok) livePowerballData = await pbRes.json().catch(() => null);
        if (pbRecRes && pbRecRes.ok) livePowerballRecent = await pbRecRes.json().catch(() => []);
        if (pb3Res && pb3Res.ok) livePowerball3Data = await pb3Res.json().catch(() => null);
        if (pb3RecRes && pb3RecRes.ok) livePowerball3Recent = await pb3RecRes.json().catch(() => []);
        if (plRes && plRes.ok) livePowerladderData = await plRes.json().catch(() => null);
        if (plRecRes && plRecRes.ok) livePowerladderRecent = await plRecRes.json().catch(() => []);
        if (rplRes && rplRes.ok) liveRedPowerladderData = await rplRes.json().catch(() => null);
        if (rplRecRes && rplRecRes.ok) liveRedPowerladderRecent = await rplRecRes.json().catch(() => []);
        if (pl3Res && pl3Res.ok) livePowerladder3Data = await pl3Res.json().catch(() => null);
        if (pl3RecRes && pl3RecRes.ok) livePowerladder3Recent = await pl3RecRes.json().catch(() => []);
        if (klRecRes && klRecRes.ok) liveKenoladderRecent = await klRecRes.json().catch(() => []);
      } catch (err) {
        console.error("Error pre-fetching live results during backfill:", err);
      }

      // Convert current time to KST in a client-timezone independent way
      const secureNow = new Date(Date.now() + serverTimeOffset);

      // Backfill Minigame Rounds (past 25 rounds)
      for (const g of games) {
        const mode = minigameModesRef.current[g.key] || 
      (['powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(g.key) ? 'api' : 'manual');
        
        // If manual mode is active, strictly skip automatic backfill to keep these rounds waiting for manual registration
        if (mode === 'manual') {
          continue;
        }

        const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(g.key);
        const startRound = Math.max(1, currentRound - 25);
        const endRound = currentRound - 1;

        for (let r = startRound; r <= endRound; r++) {
          // Calculate precise target stable date in KST for this specific historical round
          const intervalMin = g.key.includes('5') ? 5 : g.key.includes('3') ? 3 : 5;
          const roundTime = new Date(secureNow.getTime() - (currentRound - r) * intervalMin * 60 * 1000);
          const roundKst = new Date(roundTime.getTime() + (9 * 60 * 60 * 1000));
          const dateString = roundKst.toISOString().split('T')[0];
          const dateCompact = dateString.replace(/-/g, '');
          const docId = `${g.key}_${dateCompact}_${r}`;

          if (!existingIds.has(docId)) {
            let resultStr = '';
            let details: any = {};

            if (mode === 'api') {
              // powerball5
              if (g.key === 'powerball5') {
                const matchedItem = Array.isArray(livePowerballRecent) ? livePowerballRecent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.sum_odd_even && matchedItem.sum_unover && matchedItem.sum_size && matchedItem.powerball_odd_even && matchedItem.powerball_unover) {
                  const rolledOddEven = matchedItem.sum_odd_even === 'EVEN' ? '짝' : '홀';
                  const rolledUnderOver = matchedItem.sum_unover === 'UNDER' ? '언더' : '오버';
                  const size = matchedItem.sum_size === 'S' ? '소' : matchedItem.sum_size === 'L' ? '대' : '중';
                  const pbOddEven = matchedItem.powerball_odd_even === 'EVEN' ? '짝' : '홀';
                  const pbUnderOver = matchedItem.powerball_unover === 'UNDER' ? '언더' : '오버';

                  resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
                  details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
                }
              }

              // powerball3
              if (g.key === 'powerball3') {
                const matchedItem = Array.isArray(livePowerball3Recent) ? livePowerball3Recent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.sum_odd_even && matchedItem.sum_unover && matchedItem.sum_size && matchedItem.powerball_odd_even && matchedItem.powerball_unover) {
                  const rolledOddEven = matchedItem.sum_odd_even === 'EVEN' ? '짝' : '홀';
                  const rolledUnderOver = matchedItem.sum_unover === 'UNDER' ? '언더' : '오버';
                  const size = matchedItem.sum_size === 'S' ? '소' : matchedItem.sum_size === 'L' ? '대' : '중';
                  const pbOddEven = matchedItem.powerball_odd_even === 'EVEN' ? '짝' : '홀';
                  const pbUnderOver = matchedItem.powerball_unover === 'UNDER' ? '언더' : '오버';

                  resultStr = `[일반볼] ${rolledOddEven} · ${rolledUnderOver}(${size}) | [파워볼] ${pbOddEven} · ${pbUnderOver}`;
                  details = { rolledOddEven, rolledUnderOver, size, pbOddEven, pbUnderOver };
                }
              }

              // powerladder5
              if (g.key === 'powerladder5') {
                const matchedItem = Array.isArray(livePowerladderRecent) ? livePowerladderRecent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                  const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                  const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                  const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                  resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                  details = { start, lines, outcome };
                }
              }

              // redpowerladder5
              if (g.key === 'redpowerladder5') {
                const matchedItem = Array.isArray(liveRedPowerladderRecent) ? liveRedPowerladderRecent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                  const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                  const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                  const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                  resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                  details = { start, lines, outcome };
                }
              }

              // powerladder3min
              if (g.key === 'powerladder3min') {
                const matchedItem = Array.isArray(livePowerladder3Recent) ? livePowerladder3Recent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                  const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                  const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                  const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                  resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                  details = { start, lines, outcome };
                }
              }

              // kenoladder5
              if (g.key === 'kenoladder5') {
                const matchedItem = Array.isArray(liveKenoladderRecent) ? liveKenoladderRecent.find(item => {
                  return isItemDateAndRoundMatch(item, r, dateString);
                }) : null;

                if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {
                  const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';
                  const lines = matchedItem.line_count === '3' || matchedItem.line_count == 3 ? '3줄' : '4줄';
                  const outcome = matchedItem.odd_even === 'EVEN' ? '짝' : '홀';

                  resultStr = `[출발] ${start} · [줄] ${lines} · [결과] ${outcome}`;
                  details = { start, lines, outcome };
                }
              }
            }

            if (!resultStr) {
               // [수학공식 자동생성 임시 차단] 실제 경기정보가 동기화되기 전까지는 수학공식이나 임시값으로 채워지는 것을 차단합니다.
               // 오직 실제 API의 경기 결과가 성공적으로 동기화되거나 관리자가 수동으로 결과를 입력해야만 결과가 등록됩니다.
               console.log(`[Auto-Result Blocked] Result for ${g.key} Round ${r} is not synchronized yet. Blocking mathematical formula fallback.`);
               continue;
            }

            // Validate result data
            const isValidLadder = (currentGameType: string) => {
              if (['powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(currentGameType)) {
                 return ['좌', '우'].includes(details.start) && ['3줄', '4줄'].includes(details.lines) && ['홀', '짝'].includes(details.outcome);
              }
              return true;
            };

            if (!isValidLadder(g.key)) {
               console.error(`[Data Error] Invalid auto-generated result for ${g.key} Round ${r}:`, details);
               continue;
            }

            const docRef = doc(db, 'gameResultsTTL', docId);
            await setDoc(docRef, {
              gameName: g.name,
              round: r,
              result: resultStr,
              details,
              createdAt: Timestamp.fromDate(roundTime)
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
    if (!isAdmin) return;

    autoInsertRecentGameResults();
    // Fetch every 1 minute instead of 30 seconds to further conserve Firestore read quota
    const interval = setInterval(() => {
      autoInsertRecentGameResults();
    }, 60000);
    return () => clearInterval(interval);
  }, [serverTimeOffset, isAdmin]);

  const loadGameResults = async () => {
    setIsLoadingGameResults(true);
    try {
      // Fetch the latest 200 results to get enough historical data while protecting read quota
      const snap = await getDocs(query(
        collection(db, 'gameResultsTTL'),
        orderBy('createdAt', 'desc'),
        limit(600)
      ));
      const minigameNames = ['N파워볼(5분)', 'N파워볼(3분)', 'N파워사다리(5분)', 'N파워사다리(3분)', '레드파워사다리(5분)', '엔트리 키노사다리'];
      
      // Group by gameName and keep up to 30 records for each gameName to maintain proper history
      const latestByGame: Record<string, any[]> = {};
      minigameNames.forEach(name => {
        latestByGame[name] = [];
      });

      snap.docs.forEach(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() } as any;
        const gName = (data.gameName || '').trim();
        if (minigameNames.includes(gName)) {
          if (latestByGame[gName].length < 30) {
            latestByGame[gName].push(data);
          }
        }
      });

      const results = Object.values(latestByGame).flat();

      results.sort((a: any, b: any) => {
        const timeA = (a.createdAt && typeof a.createdAt.toMillis === 'function') ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = (b.createdAt && typeof b.createdAt.toMillis === 'function') ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      console.log("Loaded game results (latest 30 per game):", results);
      setGameResults(results);

      // Fetch sports matches
      const sportsSnap = await getDocs(collection(db, 'matches'));
      const fetchedSports = sportsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setSportsResults(fetchedSports);
    } catch (e) {
      console.error("Error loading game results:", e);
    } finally {
      setIsLoadingGameResults(false);
    }
  };

  const handleDeleteGameResult = async (matchId: string) => {
    if (!window.confirm('이 경기를 완전히 삭제하시겠습니까? 데이터가 복구되지 않으며 관련 배팅 내역의 불일치가 발생할 수 있으니 주의하세요.')) {
      return;
    }
    try {
      setIsLoadingGameResults(true);
      await deleteDoc(doc(db, 'matches', matchId));
      alert('경기가 정상적으로 삭제되었습니다.');
      await loadGameResults();
    } catch (e: any) {
      alert('경기 삭제 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setIsLoadingGameResults(false);
    }
  };

  useEffect(() => {
    if (showGameResultScreen || showBetHistory) {
      autoInsertRecentGameResults();
      loadGameResults();
    }
  }, [showGameResultScreen, showBetHistory]);

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
    if (usdtAmt < 20) {
      alert("최소 충전금액은 20 USDT 입니다.");
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
    setEditingIsPartner(user.isPartner || false);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      const nextBal = Number(editingBalance) || 0;
      const nextPts = Number(editingPoints) || 0;
      
      const targetUser = adminUsers.find(u => u.id === userId);
      const finalPassword = editingPassword || (targetUser?.password || '');
      const finalWithdrawalPassword = editingWithdrawalPassword || (targetUser?.withdrawalPassword || '');

      const prevPts = targetUser && targetUser.points !== undefined ? Number(targetUser.points) : 50000;
      const diffPts = nextPts - prevPts;
      let newPointsHistory = targetUser?.pointsHistory || [];
      if (diffPts !== 0) {
        const item = {
          createdAt: Date.now(),
          type: 'admin_adjust',
          description: diffPts > 0 ? `관리자 포인트 지급 (${diffPts.toLocaleString()}P)` : `관리자 포인트 차감 (${Math.abs(diffPts).toLocaleString()}P)`,
          amount: diffPts,
          balanceAfter: nextPts
        };
        newPointsHistory = [item, ...newPointsHistory].slice(0, 200);
      }

      await updateDoc(doc(db, 'users', userId), {
        nickname: editingNickname,
        tetherWalletAddress: editingWallet,
        password: finalPassword,
        withdrawalPassword: finalWithdrawalPassword,
        balance: nextBal,
        points: nextPts,
        pointsHistory: newPointsHistory,
        isPartner: editingIsPartner
      });
      
      setAdminUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        nickname: editingNickname, 
        tetherWalletAddress: editingWallet,
        password: finalPassword,
        withdrawalPassword: finalWithdrawalPassword,
        balance: nextBal,
        points: nextPts,
        pointsHistory: newPointsHistory,
        isPartner: editingIsPartner
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
              points: nextPts,
              pointsHistory: newPointsHistory,
              isPartner: editingIsPartner
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

      // Calculate 10% charge bonus points
      const depositBonusPoints = userData?.isPartner ? 0 : Math.floor((amountKrw || 0) * 0.1);
      let runningPoints = userData?.points !== undefined ? Number(userData.points) : 50000;
      let updatedPointsHistory = [...(userData?.pointsHistory || [])];

      // Let's add the 10% deposit bonus inside runningPoints and points history
      if (depositBonusPoints > 0) {
        runningPoints += depositBonusPoints;
        const depositBonusHistoryItem = {
          createdAt: Date.now(),
          type: 'deposit_bonus',
          description: `무한 매충전 10% 보너스 지급`,
          amount: depositBonusPoints,
          balanceAfter: runningPoints
        };
        updatedPointsHistory.unshift(depositBonusHistoryItem);
      }

      // Check for Qualified Bettor referral reward
      // Trigger: Single deposit transaction >= 200,000 KRW + registered referrer + not yet rewarded
      let referralUpdateObj: any = {};
      const hadReferralBonus = (!userData?.isPartner && amountKrw >= 200000 && userData?.appliedReferrerCode && !userData?.isQualifiedBettor);
      
      if (hadReferralBonus) {
        runningPoints += 50000;
        
        const depositorHistoryItem = {
          createdAt: Date.now(),
          type: 'referral_bonus_depositor',
          description: '추천인 코드 등록 첫 충전(20만원 이상) 포인트 지급',
          amount: 50000,
          balanceAfter: runningPoints
        };
        updatedPointsHistory.push(depositorHistoryItem); // keep order or unshift: let's unshift for timeline view, and slice next
        updatedPointsHistory = [depositorHistoryItem, ...updatedPointsHistory.filter(h => h !== depositorHistoryItem)];

        referralUpdateObj = {
          isQualifiedBettor: true
        };
        
        try {
          // Award points to the referrer
          let rDocRef: any = null;
          let rData: any = null;
          let rDocId = '';

          const cleanAppRef = (userData.appliedReferrerCode || '').trim().toUpperCase();
          if (cleanAppRef) {
            const customCodeDoc = await getDoc(doc(db, 'referralCodes', cleanAppRef));
            if (customCodeDoc.exists()) {
              const codeData = customCodeDoc.data();
              if (codeData.status === 'active' && codeData.partnerId) {
                const partnerDocRef = doc(db, 'users', codeData.partnerId);
                const partnerSnap = await getDoc(partnerDocRef);
                if (partnerSnap.exists()) {
                  rDocRef = partnerDocRef;
                  rData = partnerSnap.data();
                  rDocId = partnerSnap.id;
                }
              }
            }
          }

          if (!rDocRef) {
            const referrerQuery = query(collection(db, 'users'), where('referrerCode', '==', userData.appliedReferrerCode));
            const referrerSnapshot = await getDocs(referrerQuery);
            if (!referrerSnapshot.empty) {
              const referrerDocDoc = referrerSnapshot.docs[0];
              rDocRef = doc(db, 'users', referrerDocDoc.id);
              rData = referrerDocDoc.data();
              rDocId = referrerDocDoc.id;
            }
          }
          
          if (rDocRef && rData) {
            const referrerCurrentPoints = rData.points !== undefined ? Number(rData.points) : 50000;
            const referrerNewPoints = referrerCurrentPoints + 50000;

            const referrerHistoryItem = {
              createdAt: Date.now(),
              type: 'referral_bonus_referrer',
              description: `지인 추천 보너스 지급 (${userData.nickname || userData.username})`,
              amount: 50000,
              balanceAfter: referrerNewPoints
            };
            const updatedReferrerHistory = [referrerHistoryItem, ...(rData.pointsHistory || [])].slice(0, 200);

            await updateDoc(rDocRef, {
              points: referrerNewPoints,
              pointsHistory: updatedReferrerHistory
            });
            console.log(`Successfully awarded 50,000P to referrer: ${rDocId}`);
          }
        } catch (referrerErr) {
          console.error("Failed to update referrer points, but proceeding with depositor's balance/upgrade:", referrerErr);
        }
      }

      updatedPointsHistory = updatedPointsHistory.slice(0, 200);

      const depositorFinalUpdate = {
        balance: nextBal,
        points: runningPoints,
        pointsHistory: updatedPointsHistory,
        ...referralUpdateObj
      };

      // Award points in real-time if this depositor is current user
      if (currentUserData && currentUserData.id === userId) {
        setUserPoints(runningPoints);
      }

      await updateDoc(userDocRef, depositorFinalUpdate);

      await updateDoc(doc(db, 'depositRequests', requestId), {
        status: 'approved',
        processedAt: new Date().toISOString()
      });
      
      setAdminUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { 
            ...u, 
            balance: nextBal,
            points: runningPoints,
            pointsHistory: updatedPointsHistory,
            ...(hadReferralBonus ? { isQualifiedBettor: true } : {})
          };
        }
        return u;
      }));
      setAdminDepositRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved', processedAt: new Date().toISOString() } : r));

      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const curObj = JSON.parse(savedUserStr);
            localStorage.setItem('currentUser', JSON.stringify({ 
              ...curObj, 
              balance: nextBal,
              points: runningPoints,
              pointsHistory: updatedPointsHistory,
              ...(hadReferralBonus ? { isQualifiedBettor: true } : {})
            }));
          } catch (err) {
            console.error(err);
          }
        }
      }

      alert(`입금 신청 승인이 성공적으로 처리되었습니다.\n회원의 시뮬레이터 잔액이 정산 처리되었습니다.\n\n🎉 [보너스 포인트 지급 완료]\n- 무한 매충전 10% 보너스: +${depositBonusPoints.toLocaleString()}P가 자동 지급되었습니다.${hadReferralBonus ? '\n\n🎉 [적격실배터 추천보상 완료]\n해당 회원과 추천인에게 규정에 따라 각각 50,000P가 보너스로 자동 지급되었습니다!' : ''}`);
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

  const getGameResultRows = () => {
    const expandGameResultToRows = (res: any) => {
      const rows: any[] = [];
      let dt: Date;
      if (!res.createdAt) {
        dt = new Date();
      } else if (typeof res.createdAt.toDate === 'function') {
        dt = res.createdAt.toDate();
      } else if (typeof res.createdAt.toMillis === 'function') {
        dt = new Date(res.createdAt.toMillis());
      } else if (typeof res.createdAt === 'object' && typeof res.createdAt.seconds === 'number') {
        dt = new Date(res.createdAt.seconds * 1000);
      } else if (typeof res.createdAt === 'object' && typeof res.createdAt._seconds === 'number') {
        dt = new Date(res.createdAt._seconds * 1000);
      } else {
        const parsed = new Date(res.createdAt);
        if (isNaN(parsed.getTime())) {
          const num = Number(res.createdAt);
          if (!isNaN(num) && num > 0) {
            dt = new Date(num);
          } else {
            dt = new Date();
          }
        } else {
          dt = parsed;
        }
      }
      const dateStr = dt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
      const timeStr = dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const isPowerball = res.gameName === 'N파워볼(5분)' || res.gameName === 'N파워볼(3분)';
      const isLadder = res.gameName === 'N파워사다리(5분)' || res.gameName === 'N파워사다리(3분)' || res.gameName === '레드파워사다리(5분)' || res.gameName === '엔트리 키노사다리';
      
      if (isPowerball) {
        const details = res.details || {};
        
        // 1. 일반볼 [홀짝]
        rows.push({
          id: `${res.id}_oe`,
          dateStr,
          timeStr,
          gameName: res.gameName,
          league: `[${res.round}회차] ${res.gameName}`,
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
          league: `[${res.round}회차] ${res.gameName}`,
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
          league: `[${res.round}회차] ${res.gameName}`,
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
          league: `[${res.round}회차] ${res.gameName}`,
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
          league: `[${res.round}회차] ${res.gameName}`,
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
        
        // 1. [시작]
        rows.push({
          id: `${res.id}_start`,
          dateStr,
          timeStr,
          gameName: res.gameName,
          league: `[${res.round}회차] ${res.gameName}`,
          homeName: '좌',
          homeOdds: '1.95',
          awayName: '우',
          awayOdds: '1.95',
          midStandard: 'VS',
          winner: details.start === '좌' ? 'home' : details.start === '우' ? 'away' : 'none',
          score: details.start ? `${details.start}` : '대기 중',
          statusText: '결과완료'
        });
        
        // 2. [줄수]
        rows.push({
          id: `${res.id}_lines`,
          dateStr,
          timeStr,
          gameName: res.gameName,
          league: `[${res.round}회차] ${res.gameName}`,
          homeName: '3줄',
          homeOdds: '1.95',
          awayName: '4줄',
          awayOdds: '1.95',
          midStandard: 'VS',
          winner: details.lines === '3줄' ? 'home' : details.lines === '4줄' ? 'away' : 'none',
          score: details.lines ? `${details.lines}` : '대기 중',
          statusText: '결과완료'
        });

        // 3. [홀짝] (최종결과)
        rows.push({
          id: `${res.id}_oe`,
          dateStr,
          timeStr,
          gameName: res.gameName,
          league: `[${res.round}회차] ${res.gameName}`,
          homeName: '홀',
          homeOdds: '1.95',
          awayName: '짝',
          awayOdds: '1.95',
          midStandard: 'VS',
          winner: details.outcome === '홀' ? 'home' : details.outcome === '짝' ? 'away' : 'none',
          score: details.outcome ? `${details.outcome}` : '대기 중',
          statusText: '결과완료'
        });
      }
      return rows;
    };

    const getSportCategoryMain = (match: any): '축구' | '농구' | '야구' | '배구' => {
      if (match.sport === 'soccer' || match.sport === '축구') return '축구';
      if (match.sport === 'basketball' || match.sport === '농구') return '농구';
      if (match.sport === 'baseball' || match.sport === '야구') return '야구';
      if (match.sport === 'volleyball' || match.sport === '배구') return '배구';

      const name = ((match.league || '') + ' ' + (match.homeTeam || '') + ' ' + (match.awayTeam || '') + ' ' + (match.sport || '')).toLowerCase();
      if (name.includes('농구') || name.includes('nba') || name.includes('kbl') || name.includes('wkbl') || name.includes('basketball')) {
        return '농구';
      }
      if (name.includes('야구') || name.includes('mlb') || name.includes('kbo') || name.includes('npb') || name.includes('baseball')) {
        return '야구';
      }
      if (name.includes('배구') || name.includes('kovo') || name.includes('volleyball')) {
        return '배구';
      }
      return '축구';
    };

    const minigameRows = gameResults
      .filter((res: any) => gameResultFilter === '전체' ? true : res.gameName.trim() === gameResultFilter)
      .flatMap(res => expandGameResultToRows(res));

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

    const sportsRowsList: any[] = [];
    sportsResults.forEach((match: any) => {
      const sportName = getSportCategoryMain(match);
      if (gameResultFilter !== '전체' && sportName !== gameResultFilter) return;

      // Check if start time has passed
      let elapsed = false;
      let dateVal = '';
      let timeVal = '';
      const now = new Date();
      if (match.dateTime) {
        const parts = match.dateTime.trim().match(/^(\d{2})[\.\-](\d{2})\s+(\d{2}):(\d{2})/);
        if (parts) {
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const h = parseInt(parts[3], 10);
          const min = parseInt(parts[4], 10);
          const matchDate = new Date(now.getFullYear(), m, d, h, min);
          elapsed = now >= matchDate;
          dateVal = `${parts[1]}-${parts[2]}`;
          timeVal = `${parts[3]}:${parts[4]}`;
        }
      }
      
      // We only show sports matches on results page AFTER their start time has passed
      if (!elapsed) return;

      const curYear = new Date().getFullYear();
      const fullDateStr = dateVal ? `${curYear}-${dateVal}` : `${curYear}-06-07`;

      const isPending = match.status === 'pending';
      const score = isPending ? '대기 중' : `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`;
      const statusText = isPending ? '결과대기' : '결과완료';

      const rawStatus = match.status;

      // 1. [승무패] (Match Winner)
      const ml = match.markets?.matchWinner || {};
      const homeOdds = ml.home || '0.00';
      const awayOdds = ml.away || '0.00';
      const drawOdds = ml.draw;
      const midStandard = (drawOdds && Number(drawOdds) > 1.01) ? `${drawOdds}` : 'VS';
      const winner = rawStatus === 'completed' ? match.outcome : (rawStatus === 'pending' ? 'none' : rawStatus);

      sportsRowsList.push({
        id: `${match.id || match.homeTeam + '_' + match.awayTeam + '_' + match.dateTime}_matchWinner`,
        matchId: match.id,
        dateStr: fullDateStr,
        timeStr: timeVal || '00:00',
        gameName: sportName,
        league: match.league || sportName,
        homeName: match.homeTeam || 'Home',
        homeOdds: typeof homeOdds === 'number' ? homeOdds.toFixed(2) : homeOdds,
        awayName: match.awayTeam || 'Away',
        awayOdds: typeof awayOdds === 'number' ? awayOdds.toFixed(2) : awayOdds,
        midStandard: midStandard,
        winner: winner,
        score: score,
        statusText: statusText,
        marketType: 'matchWinner'
      });

      // 2. [핸디캡] (Handicap) - 만약 핸디캡 데이터가 있다면 (배구는 제외)
      const handicap = match.markets?.handicap || {};
      if (sportName !== '배구' && handicap && (handicap.home || handicap.away || handicap.value)) {
        const baseLineValue = formatHandicapDisplay(
          handicap.value, 
          match.markets?.matchWinner?.home, 
          match.markets?.matchWinner?.away
        );

        // 핸디캡 결과 판정
        let handiWinner = 'none';
        if (rawStatus !== 'pending') {
          const homeScoreVal = Number(match.homeScore ?? 0);
          const awayScoreVal = Number(match.awayScore ?? 0);
          const hVal = parseHandicapValue(baseLineValue);
          const homeFinal = homeScoreVal + hVal;
          if (homeFinal > awayScoreVal) {
            handiWinner = 'home';
          } else if (homeFinal < awayScoreVal) {
            handiWinner = 'away';
          } else {
            handiWinner = 'draw';
          }
        }

        sportsRowsList.push({
          id: `${match.id || match.homeTeam + '_' + match.awayTeam + '_' + match.dateTime}_handicap`,
          matchId: match.id,
          dateStr: fullDateStr,
          timeStr: timeVal || '00:00',
          gameName: sportName,
          league: match.league || sportName,
          homeName: `${match.homeTeam || 'Home'}`,
          homeOdds: handicap.home ? (typeof handicap.home === 'number' ? handicap.home.toFixed(2) : handicap.home) : '0.00',
          awayName: `${match.awayTeam || 'Away'}`,
          awayOdds: handicap.away ? (typeof handicap.away === 'number' ? handicap.away.toFixed(2) : handicap.away) : '0.00',
          midStandard: baseLineValue || '0',
          winner: handiWinner,
          score: score,
          statusText: statusText,
          marketType: 'handicap'
        });
      }

      // 3. [언더오버] (Over Under) - 만약 언더오버 데이터가 있다면 (배구는 제외)
      const overUnder = match.markets?.overUnder || {};
      if (sportName !== '배구' && overUnder && (overUnder.over || overUnder.under || overUnder.value)) {
        // 언오버 결과 판정
        let ouWinner = 'none';
        if (rawStatus !== 'pending') {
          const homeScoreVal = Number(match.homeScore ?? 0);
          const awayScoreVal = Number(match.awayScore ?? 0);
          const totalScore = homeScoreVal + awayScoreVal;
          const ouVal = parseFloat(cleanLineValue(overUnder.value)) || 0;
          if (totalScore > ouVal) {
            ouWinner = 'home'; // 오버가 home에 지정됨
          } else if (totalScore < ouVal) {
            ouWinner = 'away'; // 언더가 away에 지정됨
          } else {
            ouWinner = 'draw';
          }
        }

        sportsRowsList.push({
          id: `${match.id || match.homeTeam + '_' + match.awayTeam + '_' + match.dateTime}_overUnder`,
          matchId: match.id,
          dateStr: fullDateStr,
          timeStr: timeVal || '00:00',
          gameName: sportName,
          league: match.league || sportName,
          homeName: `오버 ▲ (${match.homeTeam || 'Home'})`,
          homeOdds: overUnder.over ? (typeof overUnder.over === 'number' ? overUnder.over.toFixed(2) : overUnder.over) : '0.00',
          awayName: `언더 ▼ (${match.awayTeam || 'Away'})`,
          awayOdds: overUnder.under ? (typeof overUnder.under === 'number' ? overUnder.under.toFixed(2) : overUnder.under) : '0.00',
          midStandard: cleanLineValue(overUnder.value) || '2.5',
          winner: ouWinner,
          score: score,
          statusText: statusText,
          marketType: 'overUnder'
        });
      }
    });

    const combined = [...minigameRows, ...sportsRowsList];
    combined.sort((a, b) => {
      const timeStrA = `${a.dateStr} ${a.timeStr}`;
      const timeStrB = `${b.dateStr} ${b.timeStr}`;
      return timeStrB.localeCompare(timeStrA);
    });

    return combined;
  };

  const allExpandedRowsRaw = getGameResultRows();
  const allExpandedRows = allExpandedRowsRaw.filter(row => {
    if (!gameResultSearch.trim()) return true;
    
    // Normalize and lower case for search term for better Hangul matching
    const search = gameResultSearch.trim().toLowerCase().normalize('NFC');
    
    // Helper to normalize and lowercase values
    const normalizeValue = (val: string | undefined | null) => 
      val ? val.toLowerCase().normalize('NFC') : '';

    return (
      normalizeValue(row.league).includes(search) ||
      normalizeValue(row.homeTeam).includes(search) ||
      normalizeValue(row.awayTeam).includes(search)
    );
  });
  const itemsPerPage = 30;
  const totalPages = Math.ceil(allExpandedRows.length / itemsPerPage);
  const maxPage = totalPages > 0 ? totalPages : 1;
  const currentPage = Math.min(gameResultPage, maxPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = allExpandedRows.slice(startIndex, startIndex + itemsPerPage);

  // Modular widgets for customizable minigame layout
  const renderMinigameVideo = () => (
    <div key="video-widget" className="w-full bg-black border border-red-600/50 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-neutral-950 px-3 py-2.5 md:p-4 border-b border-red-950/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
          <span className="text-white font-black text-xs md:text-base tracking-wider truncate">
            {activeMiniGameTab === 'powerball5' ? '실시간 N파워볼 (5분)' : 
             activeMiniGameTab === 'powerball3' ? '실시간 N파워볼 (3분)' :
             activeMiniGameTab === 'powerladder5' ? '실시간 N파워사다리 (5분)' :
             activeMiniGameTab === 'powerladder3min' ? '실시간 N파워사다리 (3분)' :
             activeMiniGameTab === 'redpowerladder5' ? '실시간 레드파워사다리 (5분)' :
             activeMiniGameTab === 'kenoladder5' ? '실시간 엔트리 키노사다리' : ''}
          </span>
          {(() => {
            const mode = minigameModes[activeMiniGameTab] || 
              (['powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(activeMiniGameTab) ? 'api' : 'manual');
            return (
              <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide border whitespace-nowrap ${
                mode === 'api' ? 'bg-emerald-950/70 text-emerald-400 border-emerald-900/40' : 
                mode === 'rng' ? 'bg-blue-950/70 text-blue-400 border-blue-900/40' : 
                'bg-amber-950/70 text-amber-500 border-amber-900/40'
              }`}>
                {mode === 'api' ? '● API정산' : 
                 mode === 'rng' ? '● RNG독립' : 
                 '● 자체정산'}
              </span>
            );
          })()}
        </div>
        <button 
          onClick={() => setShowMiniGame(false)} 
          className="text-gray-400 hover:text-white text-[10px] md:text-xs bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 transition shrink-0"
        >
          나가기
        </button>
      </div>

      {/* 모바일 전용 게임 선택기 */}
      {isMobile && (
        <div className="flex overflow-x-auto gap-2 pb-2 mb-2 bg-[#0c0e15]/80 p-2">
          {[
            { key: 'powerball5', name: 'N파워볼(5분)' },
            { key: 'powerball3', name: 'N파워볼(3분)' },
            { key: 'powerladder5', name: 'N파워사다리(5분)' },
            { key: 'powerladder3min', name: 'N파워사다리(3분)' },
            { key: 'redpowerladder5', name: '레드파워사다리(5분)' },
            { key: 'kenoladder5', name: '엔트리 키노사다리' }
          ].map(game => (
            <button 
              key={game.key}
              onClick={() => setActiveMiniGameTab(game.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${activeMiniGameTab === game.key ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-gray-400'}`}
            >
              {game.name}
            </button>
          ))}
        </div>
      )}

      <div className="p-0.5 md:p-4 bg-[#0a0e17] flex flex-col justify-center items-center overflow-hidden w-full max-w-full">
        <div className="w-full max-w-full overflow-hidden flex justify-center items-center">
          {activeMiniGameTab === 'powerball5' ? (
            <iframe 
              key="pb5"
              src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball5/pc"}
              width="100%"
              height={isMobile ? "360" : "640"}
              scrolling="no" 
              frameBorder="0"
              className="rounded-lg shadow-lg border border-neutral-800 w-full max-w-full aspect-[830/640] h-auto min-h-[320px]"
            />
          ) : activeMiniGameTab === 'powerball3' ? (
            <iframe 
              key="pb3"
              src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball3/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball3/pc"}
              width="100%"
              height={isMobile ? "420" : "640"}
              scrolling="no" 
              frameBorder="0"
              className="rounded-lg shadow-lg border border-neutral-800 w-full max-w-full aspect-[830/640] h-auto min-h-[320px]"
            />
          ) : activeMiniGameTab === 'powerladder5' ? (
            <iframe 
              key="powerladder5"
              src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerladder5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerladder5/pc"}
              width="100%"
              scrolling="no" 
              frameBorder="0"
              className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[420px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
            />
          ) : activeMiniGameTab === 'redpowerladder5' ? (
            <iframe 
              key="redpowerladder5"
              src={isMobile ? "https://xn--950bo4em5v.co/minigame/redball/powerladder/mobile" : "https://xn--950bo4em5v.co/minigame/redball/powerladder/pc"}
              width="100%"
              scrolling="no" 
              frameBorder="0"
              className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[460px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
            />
          ) : activeMiniGameTab === 'powerladder3min' ? (
            <iframe 
              key="powerladder3min"
              src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerladder3/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerladder3/pc"}
              width="100%"
              scrolling="no" 
              frameBorder="0"
              className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[460px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
            />
          ) : activeMiniGameTab === 'kenoladder5' ? (
            renderKenoLadderIframe()
          ) : (
            <div className="text-gray-400 p-4">게임을 선택해주세요.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderKenoLadderIframe = () => {
    return (
      <div 
        ref={kenoContainerRef}
        className="rounded-lg shadow-lg border border-neutral-800 w-full overflow-hidden relative bg-[#04060b]"
        style={{ height: isMobile ? `${640 * kenoLadderScale}px` : 'auto', aspectRatio: isMobile ? undefined : '830/640' }}
      >
        <iframe 
          key="kenoladder5_video"
          src="https://bepick.net/live/ntry_keladder"
          scrolling="no" 
          frameBorder="0"
          style={isMobile ? {
            width: '830px',
            height: '640px',
            transform: `scale(${kenoLadderScale})`,
            transformOrigin: 'top left',
            border: '0',
            position: 'absolute',
            top: '0',
            left: '0'
          } : {
            width: '100%',
            height: '100%',
            border: '0'
          }}
          className={isMobile ? "" : "w-full aspect-[830/640] h-auto"}
        />
      </div>
    );
  };

  const renderMinigameBoard = () => (
    <div key="board-widget" className="w-full bg-[#04060b] border border-sky-500/25 p-2 md:p-6 space-y-4 md:space-y-6 rounded-2xl shadow-2xl relative">
      {/* 스포츠 경기 리스트 스타일의 배팅 옵션 셀렉터 - 가로 폭 전체 사용 */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-2 md:pb-3 gap-1 px-1">
          <h3 className="text-xs md:text-sm font-bold text-gray-200 flex items-center gap-1.5">
            <span className="w-1 h-3.5 bg-sky-500 rounded"></span>
            실시간 회차별 배팅 보드
          </h3>
          <span className="text-[10px] md:text-[11px] text-amber-500 font-semibold animate-pulse">
            * 현재 회차 + 5회차까지 실시간 배팅 보드가 활성화됩니다.
          </span>
        </div>
      </div>

      {/* 회차 빠른 필터 단축 탭 */}
      <div className="flex overflow-x-auto gap-1.5 bg-[#0f1118]/80 p-2 rounded-lg border border-neutral-850 scrollbar-none whitespace-nowrap w-full">
        <button
          onClick={() => setSelectedRoundFilter('all')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer shrink-0 ${
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
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer shrink-0 ${
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
                const isClosed = row.round < currentRound || (row.round === currentRound && secondsLeft <= 0);

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
                        disabled={isClosed}
                        onClick={isClosed ? undefined : () => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
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
                          disabled={isClosed}
                          onClick={isClosed ? undefined : () => handleToggleOption((row.middle as any).group, (row.middle as any).value, (row.middle as any).dividend, row.round, row.league)}
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
                        <div className={`bg-neutral-950 border border-neutral-900 py-1.5 px-2 rounded font-black text-center select-none font-mono ${
                          row.middle !== 'VS' ? 'text-amber-400 bg-amber-950/30 text-xs border-amber-900/30' : 'text-gray-500 text-[10px]'
                        }`}>
                          {row.middle as string}
                        </div>
                      )}
                    </td>

                    {/* 패 (오른쪽 베팅 피스) */}
                    <td className="py-2 px-1">
                      <button
                        disabled={isClosed}
                        onClick={isClosed ? undefined : () => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
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
  );

  const renderMinigameCart = (forceMobile: boolean = false) => {
    const isMobileCtx = forceMobile || isMobile;
    return (
      <div 
        key="cart-widget"
        style={{
          paddingBottom: isMobileCtx ? '48px' : '20px',
          marginBottom: '0px'
        }}
        className={isMobileCtx 
          ? `fixed bottom-[56px] left-2 right-2 z-50 max-h-[78vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl py-4 pb-12 flex flex-col transition-all duration-300 ${mobileBetSlipOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`
          : 'xl:w-[325px] w-full shrink-0 xl:sticky lg:sticky top-6 order-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-5 shadow-2xl z-30 py-4 flex flex-col h-auto max-h-[80vh] lg:max-h-[694px] xl:h-[694px] lg:overflow-y-auto'
        }
      >
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              <h3 className="text-md font-black tracking-tight text-white">미니게임 배팅 카트</h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <button 
                  onClick={() => setSelectedOptions([])}
                  className="text-[10px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 text-neutral-450 hover:text-white px-2 py-1 rounded transition whitespace-nowrap cursor-pointer"
                >
                  비우기
                </button>
              )}
              {isMobileCtx && (
                <button 
                  onClick={() => setMobileBetSlipOpen(false)} 
                  className="text-amber-500 text-xs font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg active:scale-95 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  접기 ✕
                </button>
              )}
            </div>
          </div>

          {/* 실시간 마감 시간 타이머부터 배팅버튼까지 전체 스크롤 가능한 영역 적용 */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 no-scrollbar pb-1">
            {/* 실시간 마감 시간 타이머 */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">배팅 마감시간</span>
              <span className={`text-xs font-black flex items-center gap-1.5 ${secondsLeft <= 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {secondsLeft <= 0 ? (
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

          {/* Selections Section */}
          <div className="space-y-2 pr-1 no-scrollbar flex-1 overflow-y-auto max-h-[240px] md:max-h-none min-h-[100px]">
            {selectedOptions.length === 0 ? (
              <div className="py-10 text-center text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-xl shrink-0">
                <ShoppingCart className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-black">선택된 배팅 옵션이 없습니다.</p>
                <p className="text-[10px] text-gray-500 leading-tight">게임 배당 버튼을 클릭하여<br />배팅 카트에 추가하십시오.</p>
              </div>
            ) : (
              selectedOptions.map((opt, idx) => {
                const friendlyGroup = opt.group === '일반볼홀짝' ? '일반볼 홀짝' :
                                      opt.group === '파워볼홀짝' ? '파워볼 홀짝' :
                                      opt.group === '일반볼언오버' ? '일반볼 언더오버' :
                                      opt.group === '파워볼언오버' ? '파워볼 언더오버' : opt.group;
                return (
                  <div key={idx} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex flex-col gap-1.5 relative shadow-inner shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedOptions(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 font-bold cursor-pointer transition text-xs px-2 py-1"
                      title="제거"
                    >
                      &times;
                    </button>
                    <div className="flex items-center gap-1 pr-6">
                      <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase leading-none border border-amber-500/20">
                        [{opt.round}회차] {opt.game}
                      </span>
                    </div>
                    <div className="text-[11px] font-black text-neutral-250 pr-5 truncate">
                      구분: {friendlyGroup}
                    </div>
                    <div className="flex items-center justify-between text-xs bg-neutral-900 border border-neutral-850/40 p-2 rounded-lg mt-0.5">
                      <span className="font-extrabold text-amber-500 flex items-center gap-1 max-w-[150px] truncate">
                        선택: <span className="text-white underline decoration-amber-500">{opt.name}</span>
                      </span>
                      <span className="font-mono font-black text-neutral-200">{(opt.dividend || 0).toFixed(2)} 배당</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Fixed Footer Content (Multiplier + Amount + Submit) */}
          <div className="flex-shrink-0 space-y-4 pt-4 border-t border-neutral-800">
            {selectedOptions.length > 0 && (() => {
              const totalDiv = parseFloat(selectedOptions.reduce((acc, current) => acc * (current.dividend || 1), 1).toFixed(2));
              return (
                <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-850 space-y-2.5 border-l-2 border-l-amber-500">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-neutral-400 font-extrabold text-[11px]">선택된 옵션 상세</span>
                    <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto no-scrollbar pr-0.5">
                      {selectedOptions.map((opt, i) => {
                        const groupPrefix = opt.group === '일반볼홀짝' || opt.group === '일반볼언오버' || opt.group === '일반볼' ? '[일반볼] ' :
                                            opt.group === '파워볼홀짝' || opt.group === '파워볼언오버' || opt.group === '파워볼' ? '[파워볼] ' : '';
                        return (
                          <div key={i} className="flex justify-between items-center text-[10px] bg-neutral-900 px-2 py-1.5 rounded border border-neutral-850/60 gap-1.5 shrink-0">
                            <span className="text-neutral-250 font-bold truncate max-w-[170px]" title={`${opt.game} - ${groupPrefix}${opt.name}`}>
                              [{opt.round}회] {opt.game} - {groupPrefix}{opt.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-amber-500 font-black font-mono">{(opt.dividend || 0).toFixed(2)}배</span>
                              <button
                                onClick={() => setSelectedOptions(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-neutral-500 hover:text-red-400 font-bold cursor-pointer transition text-xs px-1"
                                title="삭제"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-neutral-900">
                    <span className="text-neutral-400 font-extrabold">합계 총 배당률 ({selectedOptions.length}폴더)</span>
                    <span className="font-mono font-black text-amber-500 text-sm">{(totalDiv || 0).toFixed(2)}배</span>
                  </div>
                </div>
              );
            })()}

            {/* Betting Amount Entry */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-black">배팅금액 (원)</span>
                <span className="text-[10px] text-amber-500 font-bold font-mono">
                  보유머니: {userBalance.toLocaleString()}원
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
                  placeholder="배팅액 입력"
                  className="w-full bg-neutral-950 border border-neutral-800/80 focus:border-amber-500/55 text-white p-3 rounded-xl font-black font-mono text-sm shadow-inner transition outline-none"
                />
                <span className="absolute right-3.5 top-3 text-[10px] font-black text-neutral-500 select-none">KRW</span>
              </div>

              {/* Quick Multipliers Buttons Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {[10000, 30000, 50000, 100000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(prev => (prev || 0) + amt)}
                    className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 p-2 rounded-lg text-[10px] font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}M` : amt >= 10000 ? `${amt / 10000}만` : amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBetAmount(userBalance)}
                  className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 p-2 rounded-lg text-[10px] font-bold text-amber-500 hover:text-white transition cursor-pointer select-none"
                >
                  최대
                </button>
                <button
                  type="button"
                  onClick={() => { setBetAmount(0); setSelectedOptions([]); }}
                  className="bg-neutral-950 hover:bg-[#201010] border border-red-950 hover:border-red-900 p-2 rounded-lg text-[10px] font-bold text-red-400 transition cursor-pointer select-none"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* Expected Revenue Summary Block */}
            {selectedOptions.length > 0 && (() => {
              const totalDiv = parseFloat(selectedOptions.reduce((acc, current) => acc * (current.dividend || 1), 1).toFixed(2));
              const estimatedPay = Math.floor(betAmount * totalDiv);
              return (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 shadow-inner space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500 font-extrabold">최종 수렴 배당</span>
                    <span className="text-zinc-200 font-black font-mono">{totalDiv.toFixed(2)} 배</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-neutral-900">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300 font-black flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> 예상 적중금액
                      </span>
                      <span className={`text-sm font-black font-sans tracking-tight ${(estimatedPay > 4000000 && !isAdmin) ? 'text-red-400' : 'text-emerald-400'}`}>
                        {estimatedPay.toLocaleString()}원
                      </span>
                    </div>
                    {(estimatedPay > 4000000 && !isAdmin) && (
                      <div className="text-right text-[10px] text-red-500/90 font-bold bg-red-950/30 p-1.5 rounded border border-red-900/50">
                        미니게임 최대 적중 상한금액 (4,000,000원) 초과
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Core Submission Trigger */}
            <button
              onClick={handlePlaceBet}
              disabled={selectedOptions.length === 0 || !betAmount || selectedOptions.some(opt => {
                const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);
                return opt.round < currentRound || (opt.round === currentRound && secondsRemaining <= 0);
              })}
              className="w-full bg-gradient-to-r from-amber-500 hover:from-amber-400 to-amber-600 hover:to-amber-500 disabled:opacity-20 disabled:pointer-events-none text-black font-black text-sm p-4 rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 select-none"
            >
              {betAmount > userBalance ? (
                '잔액이 부족합니다'
              ) : selectedOptions.some(opt => {
                const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);
                return opt.round < currentRound || (opt.round === currentRound && secondsRemaining <= 0);
              }) ? (
                '배팅 마감'
              ) : (
                '배팅하기 (Place Stake)'
              )}
            </button>
          </div>

          {/* Admin offset micro-adjuster panel rendered right inside the cart column if the user is an admin */}
          {isAdmin && renderAdminTimeAdjuster()}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminTimeAdjuster = () => {
    const gamesList = [
      { key: 'powerball5', name: 'N파워볼(5분)', default: 25 },
      { key: 'powerball3', name: 'N파워볼(3분)', default: 20 },
      { key: 'powerladder5', name: 'N파워사다리(5분)', default: 25 },
      { key: 'powerladder3min', name: 'N파워사다리(3분)', default: 20 },
      { key: 'redpowerladder5', name: '레드사다리(5분)', default: 178 },
      { key: 'kenoladder5', name: '키노사다리(5분)', default: 171 },
    ];

    return (
      <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 pb-1 select-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <h4 className="text-xs font-extrabold text-rose-500 flex items-center gap-1">
            관리자 마감 시간 조율 (1초 단위)
          </h4>
        </div>
        
        <p className="text-[10px] text-gray-400 leading-normal select-none">
          실시간 영상 및 중계 지연 현상 조정용입니다. 값이 클수록 마감 시간이 뒤로 늘어나거나 회차 전환 타이밍이 조정됩니다.
        </p>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
          {gamesList.map((g) => {
            const current = betCloseOffsets[g.key] !== undefined ? betCloseOffsets[g.key] : g.default;
            return (
              <div key={g.key} className="bg-neutral-950 p-2 rounded-lg border border-neutral-850 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] select-none">
                  <span className="font-extrabold text-neutral-300">{g.name}</span>
                  <span className="font-mono font-black text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/30">
                    오프셋: {current}초
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 select-none">
                  <button
                    onClick={() => updateBetCloseOffset(g.key, current - 1)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-black py-1 rounded border border-neutral-800 transition active:scale-95 cursor-pointer"
                    title="-1초 조율"
                  >
                    -1초
                  </button>
                  <button
                    onClick={() => updateBetCloseOffset(g.key, current + 1)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-black py-1 rounded border border-neutral-800 transition active:scale-95 cursor-pointer"
                    title="+1초"
                  >
                    +1초
                  </button>
                  <button
                    onClick={() => updateBetCloseOffset(g.key, g.default)}
                    className="bg-neutral-950 hover:bg-neutral-900 text-neutral-500 text-[9px] font-bold py-1 rounded border border-neutral-900/50 transition active:scale-95 cursor-pointer"
                    title="기본값 초기화"
                  >
                    초기화
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMinigameWidget = (item: string, overrideMobile: boolean = false) => {
    if (item === 'video') return renderMinigameVideo();
    if (item === 'board') return renderMinigameBoard();
    if (item === 'cart') {
      if (isMobile && !overrideMobile) return null;
      return renderMinigameCart(overrideMobile);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white font-sans flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-black pb-20 md:pb-0">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-950/10 rounded-full blur-[150px] pointer-events-none z-0"></div>



      {/* Top GNB Bar */}
      <header className="bg-gradient-to-b from-[#111215] via-[#090a0c] to-[#040405] border-b border-rose-950/40 px-6 pt-5 pb-[1px] flex flex-col items-center gap-5 relative z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        {/* Decorative corner light bands */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40"></div>

        {isMobile ? (
          /* ========================================================
             MOBILE OVERVIEW HEADER
             ======================================================== */
          <div className="flex flex-col gap-4 w-full select-none">
            {/* Top row: Menu, Reload, Centered Logo, Telegram/Admin */}
            <div className="flex items-center justify-between w-full relative">
              
              {/* Left Side: Hamburger & Refresh */}
              <div className="flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="bg-[#121620] hover:bg-neutral-850 border border-neutral-800 text-white p-2 text-sans rounded-lg active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
                  aria-label="메뉴 열기"
                >
                  <Menu className="w-5 h-5 text-emerald-400 hover:text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-[#121620] hover:bg-neutral-850 border border-neutral-800 text-white p-2 text-sans rounded-lg active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center font-bold"
                  aria-label="새로고침"
                >
                  <RotateCw className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {/* Centered Logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <button 
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="pointer-events-auto flex items-center font-sans select-none active:scale-95 transition-all"
                >
                  <span className="relative inline-flex items-center pb-0.5">
                    {/* Small aerospace star icon for mobile */}
                    <motion.div 
                      animate={{ y: [0, -2, 0], rotate: [0, -3, 3, 0], scale: [1, 1.02, 0.98, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-[12px] left-1/2 -ml-2 w-4 h-4 text-sky-400 filter drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z" />
                      </svg>
                    </motion.div>
                    <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-sky-100 via-sky-400 to-sky-900 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] text-lg tracking-wider font-sans">
                      LMT 록히드마틴
                    </span>
                  </span>
                  <span className="text-[6px] font-black text-sky-450 not-italic uppercase ml-2 border-l border-neutral-800 pl-2 tracking-[0.15em] self-center flex flex-col items-start gap-0 leading-none opacity-80">
                    <span>TACTICAL</span>
                    <span className="text-gray-500 text-[5px] tracking-[0.2em] font-normal">& DEFENSE</span>
                  </span>
                </button>
              </div>

              {/* Right Side: Admin, Partner or Telegram */}
              <div className="flex items-center gap-1.5 z-20">
                {(currentUserData?.isPartner || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setShowPartnerPanel(true)}
                    className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/30 text-black p-2 rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="파트너 메뉴"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center justify-center bg-gradient-to-r from-sky-600 to-sky-850 border border-sky-500/40 text-white p-2 rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-sky-200" />
                  </button>
                )}
                <a
                  href="https://t.me/LMT_Main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#121620] hover:bg-neutral-850 border border-neutral-800 text-white p-2 rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer animate-telegram-glow"
                >
                  <Send className="w-4 h-4 text-sky-450 transform -rotate-12" />
                </a>
              </div>
            </div>

            <div className="border-t border-sky-950/60 my-1"></div>

            {/* Bottom info bar for mobile: simple tier & wallet holdings */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans pt-1 px-0 pb-1 mx-0 -mt-[15px]">
              {/* Balance Box */}
              <div 
                onClick={() => navigateTo('deposit')}
                className="flex items-center justify-between bg-neutral-950/85 px-2 py-2 rounded-lg border border-emerald-500/30 shadow-inner hover:border-emerald-500/50 cursor-pointer transition-all whitespace-nowrap overflow-hidden"
              >
                <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-emerald-400 font-bold whitespace-nowrap">보유머니</span>
                </div>
                <span className="text-white font-extrabold tracking-wide font-mono text-[10.5px] truncate select-all">
                  {userBalance.toLocaleString()}<span className="text-[8.5px] text-gray-400 font-sans ml-0.5">원</span>
                </span>
              </div>

              {/* Points Box */}
              <div 
                className="flex items-center justify-between bg-neutral-950/85 px-2 py-2 rounded-lg border border-amber-400/25 shadow-inner cursor-pointer transition-all whitespace-nowrap overflow-hidden"
              >
                <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                  <span className="text-amber-400 font-bold whitespace-nowrap">포인트</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold tracking-wide font-mono text-[10.5px] truncate select-all">
                    {userPoints.toLocaleString()}P
                  </span>
                  <button 
                    onClick={handleExchangePoints}
                    className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black px-2 py-1 rounded shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    교환
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             DESKTOP ORIGINAL HEADER (Untouched!)
             ======================================================== */
          <>
            {/* Sports & Ladder Premium Specialist Logo/Badge (Top Left on Desktop) */}


            {/* Admin & Partner Menu Switches (Top Right on desktop) */}
            <div className="sm:absolute sm:top-6 sm:right-6 mt-1 sm:mt-0 z-30 flex items-center gap-2">
              {(currentUserData?.isPartner || isAdmin) && (
                <button
                  onClick={() => setShowPartnerPanel(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/40 text-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95 animate-fade-in"
                >
                  <Users className="w-4 h-4 text-amber-950" />
                  파트너 메뉴
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-sky-600 via-sky-700 to-sky-900 hover:from-sky-500 hover:to-sky-700 text-white font-extrabold px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-sky-500/40 text-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <Shield className="w-4 h-4 animate-pulse text-sky-100" />
                  어드민 관리자 메뉴
                </button>
              )}
            </div>

            
            {/* Navigation Menus (Centered) */}
            <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-3 px-4 text-sm font-extrabold text-gray-300 pt-0 mt-0 -mb-10 w-full">
              {/* Logo */}
              <button 
                onClick={() => navigateTo('home')}
                className="text-4xl font-extrabold tracking-normal cursor-pointer relative py-2.5 px-6 group select-none transition-all duration-300 hover:scale-105 active:scale-95 hidden md:block"
              >
                {/* Left-to-right sweeping light shimmer */}
                <motion.div 
                  initial={{ x: "-180%" }}
                  animate={{ x: "250%" }}
                  transition={{ 
                    duration: 3.0, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatDelay: 1.8
                  }}
                  className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-[-20deg] pointer-events-none mix-blend-overlay z-10"
                />
                <span className="inline-flex items-center font-sans ml-[-325px]">
                  <span className="relative inline-block mr-1">
                    {/* Floating aerospace LMT fighter jet or starburst logo */}
                    <motion.div 
                      key="logo-star-shooting"
                      animate={{ 
                        x: [350, 0, 0, 0, -50, 350],
                        y: [-80, 0, 0, 0, 15, -80],
                        scale: [0, 1.3, 1, 1.15, 0, 0],
                        opacity: [0, 1, 1, 1, 0, 0],
                        rotate: [135, 0, 0, 12, -45, 135],
                      }}
                      transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        times: [0, 0.25, 0.7, 0.85, 0.95, 1] 
                      }}
                      className="absolute -top-[32.5px] left-1/2 -ml-4 w-8 h-8 text-sky-400 group-hover:text-sky-300 filter drop-shadow-[0_0_18px_rgba(56,189,248,0.95)] animate-pulse"
                    >
                      {/* Meteor/Shooting star tail */}
                      <span className="absolute top-[28px] left-[16px] w-24 h-[3px] bg-gradient-to-r from-sky-400 via-sky-500/50 to-transparent blur-[1px] rounded-full origin-left -rotate-[165deg] opacity-80 pointer-events-none" />
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{ marginTop: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z" />
                      </svg>
                    </motion.div>
                    <span className="relative font-black bg-clip-text text-transparent bg-gradient-to-b from-sky-100 via-sky-400 to-sky-950 filter drop-shadow-[0_3px_6px_rgba(14,165,233,0.3)] text-3xl tracking-tight block uppercase">
                      LMT
                    </span>
                  </span>
                  <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-450 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xl tracking-tight uppercase ml-2 select-none group-hover:text-sky-300">
                    LOCKHEED MARTIN
                  </span>
                  <span className="text-[10px] font-bold text-sky-450 not-italic uppercase ml-4 border-l border-neutral-800 pl-4 tracking-[0.25em] self-center flex flex-col items-start gap-0.5 leading-none">
                    <span>TACTICAL</span>
                    <span className="text-gray-400 text-[8px] tracking-[0.3em] font-light">SIMULATION</span>
                  </span>
                </span>
              </button>
              {['스포츠', '미니게임', '카지노게임', '경기결과', '베팅내역', '포인트내역', '입금신청', '출금신청', '이벤트', '공지사항'].map((item) => {
                if (item === '스포츠') {
                  return (
                      <button 
                        key={item}
                        onClick={() => navigateTo('sports')}
                        className={`hover:text-sky-400 transition-colors uppercase tracking-tight relative pb-1 ${showSports ? 'text-sky-400 font-extrabold border-b-2 border-sky-400' : 'hover:border-b-2 hover:border-sky-500'}`}
                      >
                        스포츠
                      </button>
                  );
                }
                if (item === '카지노게임') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('casino')}
                      className={`hover:text-sky-400 transition-colors uppercase tracking-tight relative pb-1 ${showCasino ? 'text-sky-400 font-extrabold border-b-2 border-sky-400' : 'hover:border-b-2 hover:border-sky-500'}`}
                    >
                      카지노게임
                    </button>
                  );
                }
                if (item === '미니게임') {
                  return (
                    <div 
                      key={item}
                      className="relative"
                      onMouseEnter={openMiniGameSubmenu}
                      onMouseLeave={closeMiniGameSubmenu}
                    >
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball5'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                        className={`hover:text-sky-400 transition-colors uppercase tracking-tight relative pb-1 ${showMiniGame ? 'text-sky-400 font-extrabold border-b-2 border-sky-400' : 'hover:border-b-2 hover:border-sky-500'}`}
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
                            onClick={() => { setActiveMiniGameTab('powerball5'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-sky-400 font-extrabold animate-pulse"
                          >
                            N파워볼 (5분)
                          </button>
                          <button 
                            onClick={() => { setActiveMiniGameTab('powerball3'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-sky-400 font-extrabold animate-pulse"
                          >
                            N파워볼 (3분)
                          </button>
                          <button 
                            onClick={() => { setActiveMiniGameTab('powerladder5'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-neutral-450 hover:text-white"
                          >
                            N파워사다리 (5분)
                          </button>
                          <button 
                            onClick={() => { setActiveMiniGameTab('powerladder3min'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-neutral-450 hover:text-white"
                          >
                            N파워사다리 (3분)
                          </button>
                          <button 
                            onClick={() => { setActiveMiniGameTab('redpowerladder5'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-neutral-450 hover:text-white"
                          >
                            레드파워사다리 (5분)
                          </button>
                          <button 
                            onClick={() => { setActiveMiniGameTab('kenoladder5'); navigateTo('minigame'); setShowMiniGameSubmenu(false); }}
                            className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded whitespace-nowrap text-neutral-450 hover:text-white"
                          >
                            엔트리 키노사다리
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
                      onClick={() => navigateTo('deposit')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showDepositScreen ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      입금신청
                    </button>
                  );
                }

                if (item === '출금신청') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('withdrawal')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showWithdrawalScreen ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      출금신청
                    </button>
                  );
                }

                if (item === '경기결과') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('gameresult')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showGameResultScreen ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      경기결과
                    </button>
                  );
                }

                if (item === '베팅내역') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('bethistory')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showBetHistory ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      베팅내역
                    </button>
                  );
                }

                if (item === '포인트내역') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('pointshistory')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showPointsHistory ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      포인트내역
                    </button>
                  );
                }

                if (item === '이벤트') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('event')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showEventScreen ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      이벤트
                    </button>
                  );
                }

                if (item === '공지사항') {
                  return (
                    <button 
                      key={item} 
                      onClick={() => navigateTo('notice')}
                      className={`transition-colors cursor-pointer uppercase tracking-tight ${showNoticeScreen ? 'text-sky-400 font-bold border-b border-sky-400 pb-0.5' : 'hover:text-sky-400'}`}
                    >
                      공지사항
                    </button>
                  );
                }

                if (item === '텔레그램') {
                  return (
                    <a 
                      key={item} 
                      href="https://telegram.me/LMT_Main"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sky-400 font-bold hover:text-sky-300 transition-colors uppercase tracking-tight relative pb-1 hover:border-b-2 hover:border-sky-400 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-sky-400 transform -rotate-12 translate-x-[0.5px] translate-y-[0.5px]" />
                      <span>텔레그램</span>
                    </a>
                  );
                }

                return (
                  <button 
                    key={item} 
                    onClick={() => {
                      alert(`${item} 기능은 준비 중입니다.`);
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer uppercase tracking-tight"
                  >
                    {item}
                  </button>
                );
              })}
            </nav>

            {/* User Stats and Actions (VIP Polished Tones & High-contrast Luxury Cards) */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs w-full max-w-full my-4 select-none font-sans border-t-2 border-red-900/50 pt-4">
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
                <div className="flex items-center gap-3">
                  <span className="text-white font-extrabold tracking-wide font-mono text-sm">
                    {userPoints.toLocaleString()} <span className="text-[10px] text-gray-400 font-sans">P</span>
                  </span>
                  <button 
                    onClick={handleExchangePoints}
                    className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black px-2 py-1 rounded shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    교환
                  </button>
                </div>
              </div>

              {/* Messages Box (Crimson Flame Glow) */}
              <button 
                onClick={() => setShowMailboxModal(true)}
                className="flex items-center gap-2.5 bg-neutral-950/90 px-4 py-2 rounded-lg border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-transform hover:scale-105 duration-250 cursor-pointer text-left"
              >
                <span className="text-rose-450 font-black">신규쪽지</span>
                <span className={`bg-rose-950 border border-rose-800 text-rose-450 text-[10px] font-black px-2 py-0.5 rounded-full ${unreadCount > 0 ? 'animate-bounce text-rose-400 bg-rose-950 border-rose-700' : 'opacity-80'}`}>
                  {unreadCount}
                </span>
              </button>

              {/* My Page Button */}
              <button 
                type="button"
                className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
                onClick={() => navigateTo('mypage')}
              >
                My Page
              </button>

              {/* Referrer Button */}
              {!currentUserData?.isPartner && (
                <button 
                  type="button"
                  className="bg-gradient-to-b from-[#1e1f24] via-[#111215] to-[#0a0b0d] border border-neutral-800 hover:border-amber-500/50 hover:text-amber-400 text-gray-200 px-4 py-2 rounded-lg font-black transition-all shadow-md active:scale-95 cursor-pointer text-xs"
                  onClick={() => setIsReferrerModalOpen(true)}
                >
                  👥 추천인
                </button>
              )}

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
                onClick={() => navigateTo('support')}
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
          </>
        )}
      </header>

      {/* Mobile Left Navigation Side-Drawer (Slide-out) */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] flex select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-[300px] max-w-[85%] h-full bg-[#0b0c10] border-r border-[#15231e]/50 shadow-2xl flex flex-col justify-between overflow-y-auto z-50 text-sans"
          >
            {/* Drawer Header & Profile */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold px-1.5 py-0.5 rounded text-[9px] tracking-tight uppercase shadow-inner">
                    VIP 등급
                  </span>
                  <span className="text-gray-100 font-extrabold text-sm">{nickname} <span className="text-gray-400 font-normal">님</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowMailboxModal(true); setIsMobileMenuOpen(false); }}
                    className="text-gray-400 hover:text-white p-1 rounded-lg relative"
                    aria-label="쪽지"
                  >
                    <Mail className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Wallet Holdings (Teal / Gold Premium Box) */}
              <div className="bg-[#050608] rounded-xl p-3 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    보유머니
                  </span>
                  <span className="text-white font-extrabold text-sm font-mono">
                    {userBalance.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-neutral-900 pt-2">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    포인트 P
                  </span>
                  <span className="text-amber-300 font-extrabold font-mono">
                    {userPoints.toLocaleString()} P
                  </span>
                </div>
              </div>

              {/* Action Buttons: 충전, 환전, 고객센터 (matching the colored boxes up top) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { navigateTo('deposit'); setIsMobileMenuOpen(false); }}
                  className="bg-[#0f4c3a] hover:bg-[#165a46] border border-emerald-500/30 text-white font-black text-xs py-3 rounded-lg flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95 transition"
                >
                  <span>+ 충전</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigateTo('withdrawal'); setIsMobileMenuOpen(false); }}
                  className="bg-[#1b3b55] hover:bg-[#234c6c] border border-sky-500/20 text-white font-black text-xs py-3 rounded-lg flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95 transition"
                >
                  <span>- 환전</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigateTo('support'); setIsMobileMenuOpen(false); }}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-white font-black text-xs py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95 transition"
                >
                  <span className="text-[10px] text-gray-400 font-normal">1:1문의</span>
                  <span>고객센터</span>
                </button>
              </div>

              {/* Grid Menu of Categories - styled exactly as the screenshot! */}
              <div className="pt-2">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  GAME TYPE & COMMUNITY
                </div>
                <div className="grid grid-cols-4 gap-1 bg-[#101216] p-1 rounded-xl border border-red-900">
                  


                  {/* 미니게임 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('minigame'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-3 text-center rounded-lg border border-red-900 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition ring-1 ring-amber-500/25"
                  >
                    <span className="text-xs font-bold text-amber-400">미니게임</span>
                    <span className="text-[7.5px] text-amber-500 uppercase font-bold tracking-tight">Mini Game</span>
                  </button>

                  {/* 스포츠+ */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('sports'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-3 text-center rounded-lg border border-red-900 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-sm font-bold text-amber-500 font-extrabold flex flex-col items-center leading-tight">
                      <span>스포츠+</span>
                    </span>
                    <span className="text-[7.5px] text-amber-500 uppercase font-bold tracking-tight">Sports+</span>
                  </button>

                  {/* 카지노게임 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('casino'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-3 text-center rounded-lg border border-red-900 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs md:text-sm font-bold text-amber-500 font-extrabold flex flex-col items-center leading-tight whitespace-nowrap">
                      <span>카지노게임</span>
                    </span>
                    <span className="text-[7.5px] text-amber-500 uppercase font-bold tracking-tight">Cazino</span>
                  </button>


                    {/* 포인트내역 */}
                    <button
                      type="button"
                      onClick={() => { navigateTo('pointshistory'); setIsMobileMenuOpen(false); }}
                      className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition"
                    >
                      <span className="text-xs font-bold text-gray-200 block">포인트내역</span>
                      <span className="text-[7.5px] text-gray-400">Points</span>
                    </button>

                  {/* 이벤트 (Event) */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('event'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-emerald-400 block animate-pulse">이벤트</span>
                    <span className="text-[7.5px] text-emerald-500">Event</span>
                  </button>

                  {/* 페이백 */}
                  <button
                    type="button"
                    onClick={() => { alert('페이백 이벤트가 진행 예정입니다!'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition hidden md:flex flex-col items-center justify-center"
                  >
                    <span className="text-xs font-bold text-gray-200 block">페이백</span>
                    <span className="text-[7.5px] text-gray-400">Payback</span>
                  </button>

                  {/* 지인리스트 */}
                  <button
                    type="button"
                    onClick={() => { alert('지인 추천 내역이 존재하지 않습니다.'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition hidden md:flex flex-col items-center justify-center"
                  >
                    <span className="text-xs font-bold text-gray-200 block">지인리스트</span>
                    <span className="text-[7px] text-gray-500">Friends</span>
                  </button>

                  {/* 지인페이백 */}
                  <button
                    type="button"
                    onClick={() => { alert('지인추천 페이백 정산 시스템이 로딩 중입니다.'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition hidden md:flex flex-col items-center justify-center"
                  >
                    <span className="text-[11px] font-bold text-gray-300 block">지인페이백</span>
                    <span className="text-[7px] text-gray-500">Friend Pb</span>
                  </button>

                  {/* 지인롤링페이백 */}
                  <button
                    type="button"
                    onClick={() => { alert('지인 롤링 적립금 정산 시스템이 로딩 중입니다.'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition hidden md:flex flex-col items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-gray-300 block leading-tight">지인롤링</span>
                    <span className="text-[6.5px] text-gray-500 block leading-none">Rolling Pb</span>
                  </button>

                  {/* 마이페이지 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('mypage'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-gray-200 block">마이페이지</span>
                    <span className="text-[7.5px] text-gray-400">My Page</span>
                  </button>

                  {/* 추천인 */}
                  {!currentUserData?.isPartner && (
                    <button
                      type="button"
                      onClick={() => { setIsReferrerModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition flex flex-col items-center justify-center"
                    >
                      <span className="text-xs font-bold text-gray-200 block">추천인</span>
                      <span className="text-[7.5px] text-gray-400">Referrer</span>
                    </button>
                  )}



                  {/* 베팅내역 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('bethistory'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-red-900 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-amber-400 block">베팅내역</span>
                    <span className="text-[7.5px] text-amber-500">Bet Hist</span>
                  </button>

                  {/* 공지사항 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('notice'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-sky-950 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-teal-400 block animate-pulse">공지사항</span>
                    <span className="text-[7.5px] text-teal-500">Notice</span>
                  </button>

                  {/* 경기결과 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('gameresult'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-sky-950 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-amber-400 block">경기결과</span>
                    <span className="text-[7.5px] text-amber-500">Results</span>
                  </button>

                  {/* 출석체크 */}
                  <button
                    type="button"
                    onClick={() => { setShowAttendanceChecker(true); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-sky-950 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-xs font-bold text-green-400 block">출석체크</span>
                    <span className="text-[7.5px] text-green-500">Attendance</span>
                  </button>

                  {/* 스포츠 */}
                  <button
                    type="button"
                    onClick={() => { navigateTo('sports'); setIsMobileMenuOpen(false); }}
                    className="bg-[#141720]/85 hover:bg-neutral-800 py-2.5 text-center rounded-lg border border-sky-950 cursor-pointer active:scale-95 transition hidden md:flex flex-col items-center justify-center"
                  >
                    <span className="text-xs font-bold text-gray-200 block">스포츠</span>
                    <span className="text-[7.5px] text-gray-400">Sports</span>
                  </button>

                </div>
              </div>
            </div>

            {/* Bottom Section of drawer / logout */}
            <div className="p-4 border-t border-neutral-900 bg-[#050608] space-y-3">
              {/* KST Clock */}
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-850">
                <span className="text-[9px] text-gray-400 flex items-center gap-1 uppercase">
                  <span className="w-1 h-1 bg-sky-400 rounded-full animate-ping"></span>
                  KST Clock
                </span>
                <span className="font-bold">{kstClock || '동기화 중...'}</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}
                className="w-full bg-[#0c121d] border border-sky-950 hover:bg-sky-900 hover:text-white text-sky-300 font-extrabold text-xs py-2.5 rounded-lg transition active:scale-95 text-center cursor-pointer"
              >
                안전 로그아웃 (Secure Logout)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Conditional Rendering: My Page vs Betting History vs Mini Game vs Dashboard */}
      {showTetherGuide ? (
        <div id="tether_guide_container" className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto font-sans text-gray-100 space-y-8 animate-in fade-in duration-200">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowTetherGuide(false)} className="hover:text-white transition-colors cursor-pointer">홈</button> 
              <span>&gt;</span> 
              <span className="text-emerald-400 font-extrabold">테더(USDT) 사용 가이드</span>
            </div>
            <button 
              onClick={() => navigateTo('home')} 
              className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-gray-300 font-bold px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer text-[11px]"
            >
              메인 대시보드로 이동
            </button>
          </div>

          {/* Title Banner */}
          <div className="border-b border-neutral-850 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  CHOICE 테더(USDT) 초심자 가이드 <span className="text-emerald-400 text-xs font-black tracking-wider uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">USDT PROTOCOL GUIDE</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">인증받은 글로벌 거래소를 통해 빠르고 안전하게 가상자산 테더(USDT)를 거래 및 입출금하는 공식 프로토콜 가이드입니다.</p>
              </div>
            </div>
          </div>

          {/* Special Notice for Binance & Personal Wallets */}
          <div className="bg-sky-950/20 border border-sky-800/40 rounded-xl p-4 flex items-start gap-3 shadow-md">
            <span className="text-sky-400 text-base flex-shrink-0">📢</span>
            <div className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-sky-400 font-bold block mb-1">바이낸스 / 개인지갑 사용자 안내</strong>
              바이낸스나, 개인지갑을 사용하고 계신 회원님들은 굳이 바이비트를 사용하지 않아도 지갑을 통해 입금 진행해 주시면 되겠습니다. (실시간 공식 입금 신청 메뉴에서 개방된 TRC-20 체인을 통해 안전 발송이 가능합니다.)
            </div>
          </div>

          {/* Top Primary Rule: Secure USDT TETHER (Luxury Emerald/Slate Box) */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-neutral-950 via-[#061510] to-[#122e23]/30 p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.06)]">
            <div className="absolute top-1/2 right-[10%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                  <h3 className="text-base font-black text-emerald-400 tracking-tight flex items-center gap-1.5">
                    🚨 안전하고 신속한 CHOICE 자산 전송 프로토콜
                  </h3>
                </div>
              </div>
              <p className="text-xs text-gray-450 leading-relaxed">
                가장 강력한 보안성과 신뢰성을 자랑하는 가상화폐 <strong className="text-emerald-400">테더 (USDT - TRC20)</strong> 체인을 통해 즉각적인 대조 및 완벽한 입출금 처리가 작동합니다. 가상자산을 활용한 거래는 별도의 금융기관 점검시간의 제약을 일절 받지 않으며, 실효 추적이 불가능해 프라이버시가 안전하게 절대 보호됩니다.
              </p>
            </div>
          </div>

          {/* Steps Container */}
          <div className="space-y-8">

            {/* Step 1 Card with Visual Bybit Signup Mockup App */}
            <div className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden shadow-lg p-5 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold text-xs flex items-center justify-center font-mono">01</span>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  글로벌 거래소 'Bybit(바이비트)' 제휴 초간편 회원가입
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4 text-xs text-gray-400 leading-relaxed">
                  <p className="text-gray-300">
                    세계 최대 규모의 메이저 거래소 <strong className="text-amber-400">Bybit(바이비트)</strong>를 통해 복잡한 시세 추적이나 환전 필요 없이 가장 빠른 원화 간편 테더(USDT) 구매 및 거래를 이용하실 수 있습니다.
                  </p>
                  <p className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-amber-300 text-[11px] leading-relaxed">
                    ⚠️ <strong className="font-bold">평생 수수료 20% 특별 우대 및 최대 신규 리워드 혜택을 수령하기 위해</strong> 반드시 아래의 <strong className="text-white">공식 제휴 파트너 초대 주소</strong>로 가입을 승인하셔야 거래 등급 패널티 없이 정상 혜택이 즉각 가동됩니다.
                  </p>
                  
                  <div className="space-y-2">
                    <span className="font-extrabold text-neutral-200 block text-xs">🚀 간편 3단계 가입 절차 안내:</span>
                    <ul className="list-decimal list-inside space-y-2 pl-1">
                      <li>오른쪽의 <strong className="text-white">우대 가입</strong> 단추를 클릭해 바이비트 회원 등록 페이지로 전이합니다.</li>
                      <li>휴대폰 번호(Mobile) 혹은 이메일(Email) 중 원하시는 로그인 수단을 지정합니다.</li>
                      <li>비밀번호와 보낸 번호 인증 코드(6자리)를 입력하신 뒤, 가입 양식을 전송하여 주시면 회원가입이 즉시 체결됩니다.</li>
                      <li>가입 페이지 내부 <span className="bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">Promo Code: 137881</span>이 올바르게 박혀있는지 필히 한 번 확인해 주세요!</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <a 
                      href="https://partner.bybit.com/b/137881" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-black font-black py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.15)] transition duration-200 active:scale-95 cursor-pointer text-xs"
                    >
                      <span>바이비트 공식 20% 혜택가입 가기 ➔</span>
                    </a>
                  </div>
                </div>
                
                {/* Visual Mockup 1: Bybit Signup Screen */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[320px] bg-[#0c0d12] border-4 border-neutral-800 rounded-[32px] p-4 p-y-5 shadow-[0_0_35px_rgba(0,0,0,0.6)] font-sans relative overflow-hidden select-none">
                    {/* Mock Status Bar */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-4 px-2">
                      <span>BYBIT SIGNUP</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px]">LTE</span>
                      </div>
                    </div>

                    {/* App Window Inside */}
                    <div className="space-y-4">
                      {/* Logo and Partner Tag */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center font-black text-black text-xs font-serif">B</div>
                          <span className="text-xs font-black text-white tracking-widest font-mono">BYBIT</span>
                        </div>
                        <span className="text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          PARTNER: 137881
                        </span>
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white">Create Account</h4>
                        <p className="text-[9px] text-gray-500">Welcome! Special 20% discount on trade fees is applied.</p>
                      </div>

                      {/* Mock Form */}
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold">Email or Mobile Number</label>
                          <div className="bg-[#14161f] border border-red-500/50 rounded px-2.5 py-1.5 text-xs text-red-500 font-extrabold text-center animate-pulse">
                            ID로 사용하실 이메일
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold">Password</label>
                          <div className="bg-[#14161f] border border-red-500/50 rounded px-2.5 py-1.5 text-xs text-red-500 font-extrabold text-center animate-pulse">
                            패스워드
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-amber-400 font-bold flex justify-between items-center">
                            <span>Referral / Promo Code (Optional)</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded">Applied</span>
                          </label>
                          <div className="bg-[#14161f] border border-amber-500/30 rounded px-2.5 py-1.5 text-xs text-amber-400 font-bold font-mono">
                            137881
                          </div>
                        </div>
                      </div>

                      {/* Mock Submit Button */}
                      <button type="button" className="w-full bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black py-2 rounded-lg transition-colors mt-2">
                        Get My Welcoming Benefits
                      </button>

                      {/* Footer Info */}
                      <div className="text-[8px] text-center text-gray-500">
                        Securely encrypted by Bybit Global Security Framework.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 Card with Visual KYC Verification Page Mockup */}
            <div className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden shadow-lg p-5 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center font-mono">02</span>
                <h3 className="text-lg font-black text-white">
                  실명인증(KYC Level 1) 필수 및 본인인증 전 과정 가이드
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 text-xs text-gray-400 leading-relaxed space-y-4">
                  <p className="text-gray-350">
                    오남용 및 안전 보안 금융 이전을 대조하고 트래블룰을 수렴하기 위하여, Bybit 거래 가동 전 <span className="text-emerald-400 font-bold">1단계 KYC(본인 실명 인증)</span>를 단 1차례 이행해 주셔야 합니다.
                  </p>
                  
                  <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <span className="text-gray-300 font-bold block text-xs uppercase tracking-wider text-amber-500">📁인증 준비물:</span>
                      <p className="text-[11px] leading-relaxed text-gray-400">
                        본인 명의의 실물 신분증 1선 (주민등록증, 운전면허증, 여권 택일)
                      </p>
                    </div>

                    <div className="space-y-1 border-t border-neutral-800 pt-2.5">
                      <span className="text-gray-300 font-bold block text-xs uppercase tracking-wider text-emerald-400">⚡ 실속 모바일 간편 인증 방법:</span>
                      <ul className="list-decimal pl-4 text-[11px] space-y-2 text-gray-400 mt-1">
                        <li>휴대폰 스토어(업스토어/구글플레이)에서 <strong className="text-white">Bybit 공식 앱</strong>을 찾고 설치합니다.</li>
                        <li>생성한 제휴 계정으로 모바일 앱 상에 정상적으로 입력 후 로그인합니다.</li>
                        <li>좌측 메인 홈화면의 우측 상단 혹은 좌측 상단 <strong className="text-white">프로필(사람 모양)</strong>을 눌러 준 뒤 대시 메뉴 중 <strong className="text-emerald-400 font-bold">Identity Verification</strong> 에 접속합니다.</li>
                        <li>국가를 <strong className="text-white">Republic of Korea(대한민국)</strong>로 바르게 지정하시고 확보해 둔 신분증 규격을 설정합니다.</li>
                        <li>제시되는 조도 원형 및 눈금 프레임에 입각하여 본인의 앞면/뒷면 실물 신분증을 촬영하고, 정면 셀프 성명 인식을 통과시켜 줍니다.</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-neutral-400 text-[11px] leading-relaxed italic bg-[#110d0d] p-3 rounded-lg border border-red-950/20">
                    ℹ️ 평균 소요 시간은 약 1분에서 3분 가량이며, 거래소 AI 검토 후 즉시 영구 해제가 실행되어 입출금이 완전 가동됩니다.
                  </p>
                </div>
                
                {/* Visual Mockup 2: Bybit KYC Page */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[320px] bg-[#0c0d12] border-4 border-neutral-800 rounded-[32px] p-4 py-5 shadow-[0_0_35px_rgba(16,185,129,0.04)] font-sans relative overflow-hidden select-none">
                    {/* Mock Status Bar */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-4 px-2">
                      <span>IDENTITY VERIFICATION</span>
                      <span className="text-emerald-400 text-[9px] font-bold">● LIVE VERIFY</span>
                    </div>

                    <div className="space-y-4">
                      {/* Card layout header */}
                      <div className="bg-[#14161f] border border-neutral-800 rounded-xl p-3.5 space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 font-bold">Korea, Rep. of</span>
                          <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                            ✓ Auto Verified
                          </span>
                        </div>

                        {/* Title inside card */}
                        <div className="space-y-1">
                          <span className="text-xs font-black text-white block">Identity Verification Level 1</span>
                          <span className="text-[9px] text-gray-550 block">Enjoy full trading limits and deposit accessibility instantly.</span>
                        </div>

                        {/* ID Type selected */}
                        <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🪪</span>
                            <div className="leading-none">
                              <span className="text-[10px] font-bold text-gray-300 block">ID Card / Driver License</span>
                              <span className="text-[8px] text-gray-500 block">Korean Resident Registration Card</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">Confirmed</span>
                        </div>
                      </div>

                      {/* Scan Graphic Animation replica */}
                      <div className="border border-dashed border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 relative bg-[#101217]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
                        
                        <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-900 text-gray-400 relative">
                          <span className="text-xl">👤</span>
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-black font-extrabold font-mono">✓</span>
                        </div>
                        <div className="text-center space-y-0.5">
                          <span className="text-[9px] font-bold text-gray-300 block">Facial Recognition Verified</span>
                          <span className="text-[8px] text-gray-500 block">Biometric scan matches registration data perfectly.</span>
                        </div>
                      </div>

                      {/* Confirm Info Block */}
                      <div className="bg-[#122e23]/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between text-[9px]">
                        <span className="text-emerald-400 font-bold">✓ Daily Outflow Cap:</span>
                        <span className="text-white font-mono font-bold">$1,000,000 USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 Card: DIRECT USDT Purchase Guide without TRX Conversion + Mobile Mockup UI */}
            <div className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden shadow-lg p-5 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
                <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-xs flex items-center justify-center font-mono">03</span>
                <h3 className="text-lg font-black text-white">
                  테더(USDT) 다이렉트 구매 및 CHOICE 자금 전송 프로토콜
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">
                <div className="lg:col-span-7 text-xs text-gray-400 leading-relaxed space-y-4">
                  <p className="text-gray-350 leading-relaxed">
                    복잡하게 다른 알트코인(TRX/XRP 등)을 산 뒤 수수료 부담과 시세 손해를 보며 환전하는 절차는 이제 무필요합니다! 곧바로 **테더(USDT) 자체를 다이렉트로 안전하게 구매 및 연계 이체**할 수 있습니다.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Direct Method A */}
                    <div className="bg-[#111217] border border-neutral-850 p-4.5 rounded-xl space-y-2">
                      <span className="text-[10px] uppercase font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">방법 A: 원화 마켓 구매 후 해외지갑 활용</span>
                      <h4 className="text-xs font-bold text-white">국내 거래소 구매 후 '명확하게' 개인/해외 지갑 거쳐 전송</h4>
                      <p className="text-[11px] leading-relaxed text-gray-405">
                        국내 공식 거래소(빗썸, 코인원, 코빗 등)에서 원화로 USDT(테더)를 직접 구매할 수 있습니다. 단, <strong className="text-rose-450">트래블룰 규정으로 인해 본인 명의가 아닌 외부 주소(저희 CHOICE 지갑)로 바로 직접 출금하는 것은 원천 불가</strong>합니다. 따라서, <strong className="text-white font-bold">본인 명의의 해외거래소 지갑(Bybit/Binance 등)이나 개인 지갑으로 1차 전송을 무조건 완료하신 후, 해당 지갑에서 저희 사이트의 지갑(TRC-20)으로 전송</strong>해야 안전하고 빠르게 영구 반영됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#122e23]/5 border border-emerald-500/10 p-5 rounded-xl space-y-2.5 text-[11px]">
                    <p className="font-extrabold text-white text-xs text-emerald-400 mb-1">💳 확보된 바이비트 테더(USDT)로 CHOICE 입금 신청 마무리 방법:</p>
                    <ol className="list-decimal pl-4 space-y-2 text-gray-400">
                      <li>CHOICE 상단 네비게이션 바에서 <strong className="text-amber-400 font-bold">입금신청</strong> 페이지로 이동하여 안전 지정 입금용 주소를 획득 및 눈으로 식별 확인합니다.</li>
                      <li>바이비트 앱 ➔ <strong className="text-white">Assets</strong> ➔ <strong className="text-white">Withdraw</strong> ➔ <strong className="text-emerald-300 font-bold">USDT</strong>를 기체하여 출금 진행 창을 개방합니다.</li>
                      <li>확인하신 CHOICE 공식 고유 충전 전용 지갑 주소를 정확하게 붙여넣습니다.</li>
                      <li>⚠️ **[가장 중요]** 네트워크 형식은 필히 <strong className="text-rose-400 font-black">TRC-20 (TRON 기축 네트워크)</strong> 으로 유일 선택하셔야 전송 유실 위험 없이 1분 내로 극속 신호 대조 대입이 작동 성립됩니다.</li>
                      <li>송금이 전산 출금 완료되면, 본사 입금 신청서 폼 안에 이체 처리한 수량을 입력하신 후 전송 신청하기 버튼을 넣어 주시면 즉각 전산 대조 승인이 격추됩니다.</li>
                    </ol>
                  </div>
                </div>
                
                {/* Visual Mockup 3: Bybit Wallet & CHOICE Transfer configuration screen */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-full max-w-[320px] bg-[#0c0d12] border-4 border-neutral-800 rounded-[32px] p-4 py-5 shadow-[0_0_35px_rgba(56,189,248,0.06)] font-sans relative overflow-hidden select-none">
                    {/* Mock Status Bar */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-4 px-2">
                      <span>WITHDRAWAL CONSOLE</span>
                      <span className="text-sky-400 font-mono text-[9px] font-black">TRC-20 TETHER</span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Currency badge */}
                      <div className="flex items-center gap-2 bg-[#14161f] p-2.5 rounded-lg border border-neutral-800">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs font-mono">T</div>
                        <div>
                          <span className="text-[10px] font-bold text-white block">Tether (USDT)</span>
                          <span className="text-[8px] text-gray-500 block">Stablecoin pegged 1:1 USD</span>
                        </div>
                      </div>

                      {/* Mock input 1: Address */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-gray-400">Recipient Address (수신 지갑 주소)</span>
                          <span className="text-emerald-450 italic">CHOICE Secure Address Verified</span>
                        </div>
                        <div className="bg-[#14161f] border border-red-500/50 rounded-lg px-2.5 py-1.5 text-center text-red-500 font-extrabold text-[11px] animate-pulse">
                          여기에 사이트의 지갑주소를 입력하세요.
                        </div>
                      </div>

                      {/* Mock input 2: Network selection */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-gray-400">Withdrawal Network (네트워크 체인)</span>
                          <span className="text-rose-400 font-black animate-pulse">Required: TRC-20</span>
                        </div>
                        <div className="bg-[#14161f] border border-[#ff4e4e]/20 rounded-lg px-2.5 py-1.5 flex justify-between items-center text-xs font-black text-rose-300">
                          <span className="font-mono text-[10px]">TRC-20 (Tron Network)</span>
                          <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/10">Fixed</span>
                        </div>
                      </div>

                      {/* Mock input 3: Amount selector */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                          <span>Withdrawal Amount (이체 수량)</span>
                          <span>Fee: 1.00 USDT</span>
                        </div>
                        <div className="bg-[#14161f] border border-neutral-800 rounded-lg px-2.5 py-1.5 flex justify-between items-center text-xs text-white font-mono">
                          <span className="font-bold">1,500.00</span>
                          <span className="text-[8.5px] text-gray-500">USDT</span>
                        </div>
                      </div>

                      {/* Shiny Neon glowing transaction button */}
                      <div className="pt-1.5">
                        <button type="button" className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 text-black text-[11px] font-black py-2.5 rounded-lg active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5">
                          <span>Confirm Web-3 Withdrawal</span>
                          <span>➔</span>
                        </button>
                      </div>

                      <div className="text-[8px] text-center text-gray-500">
                        Blockchain transfers are instant and secured via TRON Smart Contract.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Help block */}
          <div className="bg-[#110d0d] border border-rose-950 rounded-xl p-5 text-center space-y-1.5 max-w-2xl mx-auto">
            <p className="text-xs font-black text-rose-300 tracking-tight">상세한 절차 설명에 어려움이 있을 시 24시간 실시간 고객센터 1:1 고객지원을 접수하시면 운영진이 가장 친절히 보조해 드립니다.</p>
            <p className="text-[10px] text-gray-500 font-medium">CHOICE SPORTS & CASINO GLOBAL SECURE SYSTEM</p>
          </div>
        </div>
      ) : showNoticeScreen ? (
        <div id="notice_section_container" className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto font-sans text-gray-100 space-y-8">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowNoticeScreen(false)} className="hover:text-white transition-colors cursor-pointer">홈</button> 
              <span>&gt;</span> 
              <span className="text-amber-400 font-extrabold">공지사항 및 이용규정</span>
            </div>
            <button 
              onClick={() => navigateTo('home')} 
              className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-gray-300 font-bold px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer text-[11px]"
            >
              메인 대시보드로 이동
            </button>
          </div>

          {/* Title Banner */}
          <div className="border-b border-neutral-850 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
                  CHOICE 공지사항 <span className="text-amber-400 text-xs font-black tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">OFFICIAL NOTICES & RULES</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">회원님들의 소중한 자산 보호와 투명하고 안전한 시뮬레이션 베팅을 위한 필독 이용 안내입니다.</p>
              </div>
            </div>
          </div>

          {/* Top Primary Rule: Secure USDT TETHER (Luxury Emerald/Slate Box) */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-neutral-950 via-[#0a1410] to-neutral-950 p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.06)]">
            <div className="absolute top-1/2 right-[10%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                  <h3 className="text-base font-black text-emerald-400 tracking-tight flex items-center gap-1.5">
                    🚨 [첫째도 안전, 둘째도 안전] LMT 보안 안심 거래 시스템 안내
                  </h3>
                </div>
                <span className="text-[10px] font-black text-rose-455 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 animate-pulse tracking-wide">보안 안전 최우선 필독</span>
              </div>
              
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                록히드마틴(Lockheed Martin)은 회원님들의 신뢰와 개인정보, 자금 보안을 세계 최고 수준으로 유지하기 위해 <strong className="text-emerald-400 font-extrabold underline decoration-emerald-500">USDT 테더(TRC-20) 시스템</strong>만을 전격 채택하여 운영하고 있습니다. 
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-850 space-y-2">
                  <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 자금사고 원천 차단
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    추적이 불가능한 악성 자금(보이스피싱, 금융사기 보상금 등) 및 금융권 통장 협박 유입을 실시간으로 차단하여 선량한 회원님들이 불필요한 계좌 정지 위협 없이 안심하고 이용하실 수 있는 가장 깨끗한 가상 거래 환경을 제공합니다.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-neutral-850 space-y-2">
                  <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 다소 번거로운 가이드라인 이용 당부
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    해외 가상자산 전송 방식이 처음에는 생소하고 번거롭게 느껴지실 수 있으나, 록히드마틴(LMT)은 익명성과 거래 무결성을 동시에 잡는 가장 완벽한 VIP 전용 플랫폼이므로 양해와 지속적인 테더 지갑 활용을 진심으로 당부드립니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Rule 1: Deposit & MyPage Rules (Amber Theme) */}
            <div className="bg-neutral-900 border border-amber-500/20 rounded-xl p-5 md:p-6 space-y-4 shadow-lg hover:border-amber-500/35 transition-all">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">충전 및 지갑·보안 설정</h4>
              </div>
              
              <ul className="space-y-3.5 text-[11.5px] text-gray-300 leading-normal list-inside list-decimal pl-1">
                <li className="list-item">
                  <span className="font-extrabold text-amber-400">출금 비밀번호 초기 필수 설정</span>: 가입 후 마이페이지 내에서 본인만 알 수 있는 출금 고유 비밀번호를 우선적으로 입력 및 설정해주셔야 출금 신청 진행이 승인됩니다.
                </li>
                <li className="list-item">
                  <span className="font-extrabold text-amber-500">최소 충전 한도 20 USDT</span>: 충전 전송 시 20 USDT 이상의 금액으로만 매칭 심사가 정상 진행됩니다. (<strong className="text-rose-400">20 USDT 미만</strong>은 소멸/반려 처리)
                </li>
                <li className="list-item">
                  <span className="font-extrabold text-rose-455">지갑주소 오 입력 경고</span>: 지갑 주소 오기재 내지 네트워크 불일치로 발생한 잘못된 매체 전송으로 인한 분실 건은 LMT측에서 기술적으로 책임지지 않으니 발송 전 최종 검증을 기하셔야 합니다.
                </li>
              </ul>
            </div>

            {/* Rule 2: Rolling Requirements (Emerald Theme) */}
            <div className="bg-neutral-900 border border-emerald-500/20 rounded-xl p-5 md:p-6 space-y-4 shadow-lg hover:border-emerald-500/35 transition-all">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">투명한 롤링 (Rolling) 수칙</h4>
              </div>

              <div className="bg-black/35 rounded-lg p-3 space-y-2 border border-neutral-850">
                <span className="text-[10px] text-gray-500 font-bold block">환전 정산 충족 조건 (지급 보너스 포함)</span>
                <div className="flex justify-between items-center bg-teal-950/20 border border-teal-500/10 p-2 rounded">
                  <span className="text-xs font-bold text-gray-300">스포츠</span>
                  <span className="text-xs font-black text-emerald-400">롤링 100%</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-500/10 p-2 rounded">
                  <span className="text-xs font-bold text-gray-300">미니게임</span>
                  <span className="text-xs font-black text-emerald-400">롤링 300%</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850">
                <p className="text-[10px] text-gray-400 leading-normal">
                  * 롤링 계산 시, 지급받은 충전 보너스를 모두 포함하여 롤링 제한 요율이 충족되어야 정상 정산됩니다. 단, 무한 페이백 포인트(스포츠 5% / 미니게임 3%) 환급건은 롤링 요율 제한에서 우대 제외 처리 완료됩니다.
                </p>
              </div>
            </div>

            {/* Rule 3: Win Upper Limits (Red Theme) */}
            <div className="bg-neutral-900 border border-rose-500/20 rounded-xl p-5 md:p-6 space-y-4 shadow-lg hover:border-rose-500/35 transition-all">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <div className="w-7 h-7 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450">
                  <Gamepad2 className="w-4 h-4 text-rose-500" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">베팅 폴더 및 당첨 상한금 한도</h4>
              </div>

              <ul className="space-y-3 text-[11.5px] text-gray-300 ml-1">
                <li className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">스포츠 최대 베팅 폴더 수</span>
                  <span className="font-extrabold text-white text-xs bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">최대 10 폴더</span>
                </li>
                <li className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">스포츠 [단폴더] 적중 상한</span>
                  <span className="font-black text-rose-400 text-xs">최대 2,000,000 원</span>
                </li>
                <li className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">스포츠 [다폴더] 적중 상한</span>
                  <span className="font-black text-rose-400 text-xs text-right">최대 10,000,000 원</span>
                </li>
                <li className="flex items-center justify-between pb-1">
                  <span className="text-gray-400 font-medium">미니게임 회차별 당첨 한도</span>
                  <span className="font-black text-amber-400 text-xs">최대 4,000,000 원</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Sports specific Rules */}
          <div className="bg-neutral-900 border border-sky-500/20 rounded-xl p-5 md:p-6 space-y-4 shadow-lg hover:border-sky-500/35 transition-all">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">종목별 스포츠 규정</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Soccer */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-850 space-y-2">
                <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                  ⚽ 스포츠 축구 규정
                </div>
                <p className="text-[11px] text-gray-400 leading-normal font-medium">
                  90분 정규이닝 경기의 대한 결과를 적용합니다.<br/>
                  <span className="text-rose-400 font-bold mt-1 inline-block">(연장전 미적용)</span>
                </p>
              </div>

              {/* Baseball */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-850 space-y-2">
                <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                  ⚾ 스포츠 야구 규정
                </div>
                <p className="text-[11px] text-gray-400 leading-normal font-medium">
                  정규이닝 연장이 포함된 결과를 적용합니다.<br/>
                  <span className="text-emerald-400 font-bold mt-1 inline-block">핸디 / 언오버 연장포함</span>
                </p>
              </div>

              {/* Volleyball */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-850 space-y-2">
                <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                  🏐 스포츠 배구 규정
                </div>
                <p className="text-[11px] text-gray-400 leading-normal font-medium">
                  정규이닝의 대한 결과를 적용합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback & Error Report Program (Deep Purple/Sunset Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feedback Part */}
            <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-neutral-950 to-neutral-900 p-5 space-y-3 shadow">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black w-fit uppercase">
                <Zap className="w-3.5 h-3.5" /> ERROR REPORT BONUS
              </div>
              <h4 className="text-sm font-black text-white">오류 제보 시 10,000P 즉시 지급</h4>
              <p className="text-xs text-gray-450 leading-relaxed">
                시뮬레이터 진행 도중 이상이나 결함, 오표기를 발견하여 고객센터 1:1 문의 채널을 통해 성실히 제보해 주시는 회원께는 관리자가 검토 후 감사의 선물로 **10,000 P**의 고유 보너스 포인트를 자동 즉시 무제한 지급해 드립니다.
              </p>
            </div>

            {/* Custom Features and Feedback Proposal */}
            <div className="rounded-xl border border-pink-500/20 bg-gradient-to-r from-neutral-950 to-neutral-900 p-5 space-y-3 shadow">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black w-fit uppercase">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> CUSTOM SUGGESTIONS
              </div>
              <h4 className="text-sm font-black text-white">다양하고 풍부한 건의사항 접수</h4>
              <p className="text-xs text-gray-450 leading-relaxed">
                록히드마틴(LMT)은 회원님들과 늘 실시간 호흡하는 글로벌 모의 스포츠 솔루션을 꿈꿉니다. 스포츠 통계, 베팅 연출, 편리한 마이페이지 기능 제안 등 어떠한 건의사항이라도 편하게 제안해주시면 적극적으로 개발에 반영해 드립니다.
              </p>
            </div>

          </div>

          {/* Footer Warm Message */}
          <div className="bg-[#0b101d] border border-sky-950 rounded-xl p-5 text-center space-y-1.5 max-w-2xl mx-auto">
            <p className="text-xs font-black text-sky-300 tracking-tight">전세계 베터들의 자수정처럼 단단한 동반자 LMT TACTICAL & DEFENSE SYSTEMS</p>
            <p className="text-[11px] text-gray-500 font-medium">회원 성원을 바탕으로 항상 전진하겠습니다. 회원님들의 큰 행운과 건승을 기원합니다. 진심으로 감사드립니다.</p>
          </div>
        </div>
      ) : showSports ? (
        <SportsContainer 
          key={selectedSport}
          initialSportTab={selectedSport}
          currentUserData={currentUserData} 
          userBalance={userBalance} 
          setUserBalance={setUserBalance} 
          setUserPoints={setUserPoints}
          setMobileBetSlipOpen={setMobileBetSlipOpen}
          mobileBetSlipOpen={mobileBetSlipOpen}
        />
      ) : showBetHistory ? (
        <BetHistoryView currentUserData={currentUserData} sportsResults={sportsResults} />
      ) : showEventScreen ? (
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto font-sans">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowEventScreen(false)} className="hover:text-white">홈</button> &gt; 이벤트 &gt; 무한 매충전 10%
          </div>

          {/* Title Banner */}
          <div className="mb-6 border-b border-neutral-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Gift className="w-6 h-6 text-sky-400" />
                LMT 특별 혜택 <span className="text-sky-400 text-xs font-black tracking-wider uppercase bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">LMT PREMIUM BENEFITS</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">록히드마틴(LMT)에서 선사하는 압도적인 혜택과 다채로운 지원을 만나보세요.</p>
            </div>
          </div>

          {/* Luxury Event Banner Panel (Custom Golden Shimmer Graphic Card) */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-neutral-950 via-[#0d1526] to-neutral-950 p-6 md:p-10 shadow-[0_0_50px_rgba(14,165,233,0.08)] mb-8">
            {/* Ambient gold glow beam */}
            <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2"></div>
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Text column */}
              <div className="md:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black tracking-wider uppercase animate-pulse">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  LMT INFINITE BONUS
                </div>

                <div className="space-y-4">
                  <span className="block text-gray-300 text-sm font-bold tracking-tight">회원 특별 혜택 업그레이드</span>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-sky-400 to-sky-600 tracking-tight leading-tight">
                    록히드마틴 특별 혜택<br />더블 무한 보너스!
                  </h1>
                </div>

                <div className="text-xs text-gray-300 leading-relaxed max-w-md space-y-2 bg-neutral-950/40 p-3.5 rounded-lg border border-neutral-800/60">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">①</span>
                    <div>
                      <strong className="text-white">무한 매충전 10% 보너스:</strong> 매 입금/충전 승인 시 원화 정산액의 <strong className="text-amber-400">10% 포인트</strong> 즉시 자동 적립
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 border-t border-neutral-900 pt-2 mt-2">
                    <span className="text-amber-400 font-bold">②</span>
                    <div>
                      <strong className="text-white">무한 베팅 페이백:</strong> 모든 스포츠 베팅 참여 시 <strong className="text-amber-400">무한 +5% 페이백</strong>, 미니게임 베팅 시 <strong className="text-amber-400">무한 +3% 페이백</strong> 포인트 자동 지급!
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigateTo('deposit')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-[0_10px_20px_rgba(245,158,11,0.2)] transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" /> 지금 충전하고 10% 받기
                  </button>
                  <button
                    onClick={() => navigateTo('home')}
                    className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-neutral-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    게임 둘러보기
                  </button>
                </div>
              </div>

              {/* Graphical Luxury Visual Card (Simulates Sophisticated Banner Asset perfectly as requested!) */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-2xl bg-gradient-to-tr from-amber-500/20 to-neutral-900 border-2 border-amber-500/40 p-1 flex items-center justify-center overflow-hidden group shadow-[0_0_35px_rgba(245,158,11,0.15)]">
                  {/* Subtle dynamic grid backgrounds */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                  
                  {/* Metallic Glossy Visual Face */}
                  <div className="w-full h-full bg-slate-950/90 rounded-xl relative flex flex-col items-center justify-between p-6 overflow-hidden">
                    {/* Ring glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-red-500/20 rounded-full blur-2xl"></div>

                    {/* Banner Headline */}
                    <div className="text-center space-y-1">
                      <span className="text-[9px] font-black tracking-[0.2em] text-amber-500/80 uppercase">CHOICE SPECIAL BONUS</span>
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto"></div>
                    </div>

                    {/* Massive Graphic Element */}
                    <div className="text-center relative py-4">
                      <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 tracking-tight drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                        10%
                      </div>
                      <div className="text-[10px] text-amber-400 font-black tracking-widest uppercase mt-1">
                        UNLIMITED BONUS
                      </div>
                      <span className="absolute -top-1 -right-3 text-[10px] text-red-500 font-black px-1.5 py-0.5 bg-red-955/20 border border-red-500/30 rounded skew-x-12 animate-bounce">
                        무한
                      </span>
                    </div>

                    {/* Golden Coins/Dust representation */}
                    <div className="flex gap-1.5 justify-center items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                    </div>

                    {/* Brand Signature */}
                    <div className="text-center">
                      <span className="text-[8px] tracking-[0.3em] font-bold text-gray-500 uppercase">CHOICE SIMULATOR PLATFORM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Info Cards & Grid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Box 1: Event Details */}
            <div className="bg-[#0e111a] border border-neutral-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 border-b border-neutral-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                이벤트 상세 정보 (Details)
              </h3>
              
              <div className="space-y-3.5 text-xs text-gray-300">
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">대상 회원</span>
                  <span className="font-bold text-gray-100">록히드마틴 모든 실배터 회원</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">매 충전 보너스</span>
                  <span className="font-extrabold text-amber-400">승인 원화금액의 10% 즉시 포인트 지급</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">베팅 페이백</span>
                  <span className="font-extrabold text-emerald-400 text-right">스포츠 5% / 미니게임 3% 즉시 지급</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-gray-400 font-medium">이벤트 기한</span>
                  <span className="font-bold text-rose-400">연중 무휴 24시간 특별 자동 정산</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400 font-medium">참여 횟수 제한</span>
                  <span className="font-black text-amber-400">제한 없음 (모든 충전 및 베팅 시 무한 적용)</span>
                </div>
              </div>
            </div>

            {/* Box 2: Points Conversion Guide (No Balance - Just variable details!) */}
            <div className="bg-[#0e111a] border border-neutral-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 border-b border-neutral-800 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                충전금액별 지급 포인트 예시 (Example Chart)
              </h3>

              <div className="space-y-2.5">
                {[
                  { deposit: 100000, points: 10000 },
                  { deposit: 300000, points: 30000 },
                  { deposit: 500000, points: 50000 },
                  { deposit: 1000000, points: 100000 },
                  { deposit: 2000000, points: 200000 },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-neutral-950/60 p-2.5 rounded border border-neutral-850 hover:border-amber-500/25 transition-all">
                    <span className="text-gray-300 font-mono font-bold">{item.deposit.toLocaleString()} 원 충전 시</span>
                    <span className="text-gray-400">➔</span>
                    <span className="font-extrabold text-[#b5cb85] font-mono">+{item.points.toLocaleString()} P 무상 지급!</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 추천인 연동 파트너십 제휴 이벤트 (Referral Special Event) */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-neutral-950 via-[#180f10] to-neutral-950 p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.06)] mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Ambient hot aura */}
            <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-rose-500/5 rounded-full blur-[130px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
                    <Users className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                      🍀 실배터 추천인 연동 특별 프로모션 <span className="text-rose-400 text-[9px] font-black tracking-widest uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">LIFETIME PARTNER EVENT</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">지인 추천 및 파트너 관계 형성을 통해 한 차원 높은 특별 우대 보상을 영구적으로 획득하세요.</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold border border-neutral-800 rounded px-2.5 py-1 bg-black/40 w-fit">Realtime Partnership</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 혜택 1: 즉시 포인트 지급 */}
                <div className="bg-neutral-950/80 border border-rose-950/40 rounded-xl p-5 space-y-4 hover:border-rose-500/20 transition-all">
                  <div className="flex items-center gap-2 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-1.5 w-fit">
                    <span className="text-[10px] font-extrabold text-rose-400 uppercase">BENEFIT 01</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-rose-105">신규 가입자 연동 & 실배터 충전 보상</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      나를 초청해 준 추천인의 가입코드를 기입하고 가입한 회원이 총 충전금액 <strong className="text-amber-400">200,000원 이상 충전</strong> 후, 적격 실배터 심사(실제 베팅 검증) 완료 시 추천인과 가입자 모두에게 압도적인 가입/초대 축하 기프트를 즉각 지급해 드립니다.
                    </p>
                  </div>

                  <div className="bg-rose-500/5 rounded-lg border border-rose-500/10 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">추천인 및 가입자 동시 지급</span>
                      <span className="text-xs md:text-sm font-black text-white">각각 <strong className="text-rose-400">50,000 P</strong> 즉시 자동 수령 (<strong className="text-amber-400">총 100,000P</strong>)</span>
                    </div>
                    <Gift className="w-8 h-8 text-rose-400/30" />
                  </div>
                </div>

                {/* 혜택 2: 롤링 커미션 */}
                <div className="bg-neutral-950/80 border border-emerald-950/40 rounded-xl p-5 space-y-4 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5 w-fit">
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase">BENEFIT 02</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-emerald-105">평생 베팅 롤링 적립 서비스 (Lifetime Commission)</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      추천 연동되어 가입한 파트너가 LMT에서 제공하는 모든 스포츠 매치 및 실시간 미니게임 등의 시뮬레이터 베팅(롤링)에 참여할 때마다, <strong className="text-emerald-400 font-extrabold">승패 결과와 완전히 무관하게</strong> 실시간 베팅액 기준의 패시브 포인트가 영구적으로 평생 무료 적립됩니다.
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/10 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">평생 영구 지속 패시브 보너스</span>
                      <span className="text-xs md:text-sm font-black text-white">가입자 실시간 베팅 총액의 <strong className="text-emerald-400">0.5% 평생 무제한 롤링 적립</strong></span>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-400/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-tight">
              <Info className="w-4 h-4" />
              신청 규정 및 어뷰징 금지 조항
            </h4>
            <ul className="list-disc pl-5 text-xs text-gray-400 leading-relaxed space-y-1.5">
                  <li>충전 신청 승인이 완료되면 별도의 신청 접수 없이 <strong className="text-gray-350">10% 충전 보너스 포인트가 완전 자동 계산</strong>되어 즉시 합산 처리됩니다.</li>
                  <li>모든 베팅 참여 시 <strong className="text-gray-350">무한 페이백 포인트(스포츠 5% / 미니게임 3%)</strong> 조항에 따라 당첨/낙첨 결과에 무관하게 베팅 마감 후 즉시 페이백이 정산됩니다.</li>
                  <li>지급된 모든 보너스 및 페이백 포인트는 CHOICE에서 제공하는 모든 시뮬레이터 미니게임 및 스포츠 베팅에 100% 동일하게 사용될 수 있습니다.</li>
              <li>동일인 다중 IP 접속 및 의도적인 중복 가입을 통해 보너스 포인트를 편취하려는 시도나 매칭 어뷰징 행위 발생 시, 시스템 적발 프로그램을 통해 불이익(계정 영구 제한 및 자산 몰수 처리)이 부여되므로 정직한 베팅 스포츠 매칭을 즐겨주시길 당부 드립니다.</li>
            </ul>
          </div>
        </div>
      ) : showSupportScreen ? (
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowSupportScreen(false)} className="hover:text-white">홈</button> &gt; 고객센터 &gt; 1:1 문의사항
          </div>

          {/* Title Banner */}
          <div className="mb-6 border-b border-neutral-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 overflow-hidden">
                <Shield className="w-6 h-6 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">1:1 문의사항</span>
                <span className="text-amber-500 text-[10px] sm:text-xs font-black tracking-wider uppercase shrink-0 truncate">1:1 Customer Support</span>
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



          {/* List Container */}
          <div className="space-y-3">
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
              userInquiries.map((inq, index) => {
                const isExpanded = selectedInquiryDetail?.id === inq.id;
                return (
                  <div key={inq.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                          <span className="font-mono">#{userInquiries.length - index}</span>
                          <span>|</span>
                          <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => setSelectedInquiryDetail(isExpanded ? null : inq)}
                          className="text-left font-bold text-gray-200 hover:text-amber-400 block w-full focus:outline-none transition cursor-pointer text-sm"
                        >
                          {inq.title}
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tight ${inq.status === 'answered' ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' : 'bg-amber-955 border border-amber-905 text-amber-400'}`}>
                          {inq.status === 'answered' ? '답변완료' : '답변대기'}
                        </span>
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-950/20 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Expandable Box */}
                    {isExpanded && (
                      <div className="mt-4 bg-neutral-950 border border-neutral-850 rounded-lg p-4 space-y-4 text-gray-300">
                        <p className="whitespace-pre-wrap leading-relaxed text-xs text-gray-200 font-sans">{inq.content}</p>
                        
                        {/* Reply Section */}
                        <div className="border-t border-neutral-800 pt-3">
                          <h4 className="text-[10px] font-black text-amber-500 flex items-center gap-1 mb-2">
                            <Shield className="w-3 h-3" /> 고객센터 답변
                          </h4>
                          {inq.status === 'answered' ? (
                            <div className="bg-emerald-950/25 border border-emerald-900/30 rounded p-3 text-emerald-200 text-xs">
                              <p className="whitespace-pre-wrap leading-relaxed font-sans">{inq.reply}</p>
                            </div>
                          ) : (
                            <div className="bg-neutral-900/50 border border-neutral-800 p-3 rounded text-gray-500 font-bold text-[10px] text-center italic">
                              확인 대기 중입니다. 신속하게 안내해 드리겠습니다.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                <label className="w-full sm:w-24 text-gray-400 text-sm">아이디</label>
                <span className="text-amber-400 font-bold text-sm">{currentUser?.username}</span>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm">새 로그인 비밀번호</label>
                <div className="flex-1">
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="새 비밀번호 (4~16자)"
                    className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-white text-sm" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">변경을 원하시는 경우에만 입력해주세요.</p>
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm">출금 비밀번호</label>
                <div className="flex-1">
                  {currentUserData?.withdrawalPassword ? (
                    <div className="text-gray-400 p-2 text-sm bg-neutral-800 rounded">이미 설정되었습니다.</div>
                  ) : (
                    <>
                      <input 
                        type="password" 
                        value={withdrawalPassword} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 6) setWithdrawalPassword(val);
                        }}
                        placeholder="숫자 4~6자리 입력"
                        className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-white text-sm" 
                      />
                      <p className="text-[10px] text-gray-500 mt-1">최초 1회 설정: 숫자 4~6자리로 입력해주세요.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm">닉네임</label>
                <div className="flex-1">
                  <input type="text" disabled value={nickname} className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-gray-500 text-sm" />
                  <p className="text-[10px] text-gray-500 mt-1">닉네임은 변경이 불가능합니다.</p>
                </div>
              </div>
            </div>

              <div className="mt-8 text-center flex justify-center gap-4">
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
                    className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded cursor-pointer transition-all text-sm sm:px-12 whitespace-nowrap"
                  >
                    회원정보 저장
                  </button>
                )}
                <button 
                  onClick={() => navigateTo('support')}
                  className="bg-lime-700 hover:bg-lime-600 text-white font-bold py-2 px-6 rounded cursor-pointer transition-all active:scale-95 duration-200 text-sm sm:px-12 whitespace-nowrap"
                >
                  문의하기
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
                  <li>최소 충전 신청 금액은 <span className="text-amber-400 font-extrabold">20 USDT</span> 입니다. (20 USDT 미만 신청 건은 즉시 반려 및 소멸 처리됩니다)</li>
                  <li>입금 신청 금액은 1테더 기준 고정 환율 <span className="text-emerald-400 font-bold">1USD = {exchangeRate.toLocaleString()}원</span>으로 자동 정산되어 충전됩니다.</li>
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
                        placeholder="전송하신 USDT 수량을 입력하세요. (최소 20)"
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
                  <div className="text-[11px] text-gray-400">LMT 입금 고정 환율</div>
                  <div className="text-xl font-black text-amber-400 tracking-wide font-mono">
                    1 USDT <span className="text-xs text-gray-500 font-normal">➔</span> {exchangeRate.toLocaleString()} 원
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    * 테더(USDT)는 미국 달러(USD)에 1:1 패깅된 유력 연계 통화로, 록히드마틴 플랫폼은 안전 고정 환율을 채택하여 송금 시 시세 손해 없이 고액의 금액이라도 전액 안심 보장됩니다.
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
                <div className="mt-8 border-t border-neutral-800/80 pt-6 flex flex-col items-center gap-6">
                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={isSubmitWithdrawal}
                    className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-900/30 disabled:text-gray-500 text-white font-extrabold text-sm rounded shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitWithdrawal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    보유머니 환전 신청하기
                  </button>
                  <div className="max-w-lg text-center px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-500 font-bold text-xs sm:text-sm leading-relaxed tracking-wide break-keep">
                      ⚠️ 주의사항<br/>대한민국 트레블룰 진행으로 받을 지갑의주소는 "꼭" 해외거래소지갑 또는 개입지갑이여야합니다. 회원님들께선 이점 유의하시어 환전 신청하시기바랍니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Standard fixed exchange box rate */}
            <div className="space-y-6">
              {/* FIXED RATE BOX */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">1테더 환전율 (TRC-20 Rate)</div>
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400">LMT 환전 고정 환율</div>
                  <div className="text-xl font-black text-amber-400 tracking-wide font-mono">
                    1 USDT <span className="text-xs text-gray-500 font-normal">➔</span> {exchangeRate.toLocaleString()} 원
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    * 테더(USDT)는 미국 달러(USD)에 1:1 패깅된 유력 연계 통화로, 록히드마틴 플랫폼은 안전 고정 환율을 채택하여 송금 시 시세 손해 없이 고액의 금액이라도 전액 안심 보장됩니다.
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

            {/* Game Result Search */}
            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={gameResultSearch}
                onChange={(e) => setGameResultSearch(e.target.value)}
                placeholder="리그명/팀명 검색..."
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-black/40 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-500/60 placeholder-neutral-500"
              />
            </div>

            {/* Game Result Categories */}
            <div 
              className="flex overflow-x-auto md:flex-wrap items-center gap-1.5 mb-6 border-b border-neutral-800/80 pb-4 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 whitespace-nowrap scroll-smooth" 
              id="game-result-categories-container"
            >
              {['전체', '축구', '농구', '야구', '배구', 'N파워볼(5분)', 'N파워볼(3분)', 'N파워사다리(5분)', 'N파워사다리(3분)', '레드파워사다리(5분)', '엔트리 키노사다리'].map(cat => {
                const mapping: Record<string, { label: string; emoji: string }> = {
                  '전체': { label: '전체', emoji: '✨' },
                  '축구': { label: '축구', emoji: '⚽' },
                  '농구': { label: '농구', emoji: '🏀' },
                  '야구': { label: '야구', emoji: '⚾' },
                  '배구': { label: '배구', emoji: '🏐' },
                  'N파워볼(5분)': { label: '파워볼 5분', emoji: '🟢' },
                  'N파워볼(3분)': { label: '파워볼 3분', emoji: '🔵' },
                  'N파워사다리(5분)': { label: '사다리 5분', emoji: '🪜' },
                  'N파워사다리(3분)': { label: '사다리 3분', emoji: '🪜' },
                  '레드파워사다리(5분)': { label: '레드사다리', emoji: '🔴' },
                  '엔트리 키노사다리': { label: '키노사다리', emoji: '🎰' }
                };
                const info = mapping[cat] || { label: cat, emoji: '🎮' };
                const isActive = gameResultFilter === cat;
                return (
                  <button 
                    key={cat} 
                    onClick={() => {
                      setGameResultFilter(cat);
                      setGameResultPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-xs font-bold transition cursor-pointer border shrink-0 ${
                      isActive 
                        ? 'bg-amber-500 text-black border-amber-500 shadow-md font-extrabold shadow-amber-500/10' 
                        : 'bg-[#10121a]/80 hover:bg-neutral-800 text-gray-400 border-neutral-800/80 hover:text-white'
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>



            {isLoadingGameResults ? (
              <div className="text-center py-24 text-gray-500 font-medium">로딩 중...</div>
            ) : allExpandedRows.length === 0 ? (
              <div className="w-full text-center text-gray-500 py-24 border border-dashed border-neutral-800 rounded-lg">
                현재 등록된 {gameResultFilter === '전체' ? '' : `[${gameResultFilter}]`} 경기 결과가 없습니다.
              </div>
            ) : (
              <>
                {isMobile ? (
                  <div className="space-y-3 pb-4">
                    {paginatedRows.map((row: any) => (
                      <div key={row.id} className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-4 text-xs">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-400 font-mono text-[11px]">{row.dateStr} {row.timeStr}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                              row.statusText === '결과대기'
                                ? 'text-amber-500 bg-amber-950/30 border-amber-900/60 animate-pulse'
                                : 'text-emerald-400 bg-emerald-950/30 border-emerald-900/60'
                            }`}>
                              {row.statusText}
                            </span>
                            {isAdmin && row.matchId && (
                              <button
                                onClick={() => handleDeleteGameResult(row.matchId)}
                                className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 rounded text-red-500 hover:text-red-400 transition"
                                title="경기 직접 삭제"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white text-sm">{row.league}</span>
                          <span className="text-amber-500 font-black text-sm">{row.score}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#0b0c10] p-2 rounded border border-neutral-800/60">
                          <motion.div 
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col p-1.5 rounded border transition w-[45%] ${
                              row.winner === 'home' 
                                ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                : 'bg-transparent border-transparent'
                            }`}
                          >
                            <span className={`font-bold ${row.winner === 'home' ? 'text-amber-400' : 'text-gray-200'}`}>{row.homeName}</span>
                            <span className="text-amber-500 font-bold text-[10px]">{row.homeOdds}</span>
                          </motion.div>

                          <span className="text-gray-500 font-bold">VS</span>

                          <motion.div 
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col p-1.5 rounded border transition w-[45%] items-end ${
                              row.winner === 'away' 
                                ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.25)]' 
                                : 'bg-transparent border-transparent'
                            }`}
                          >
                            <span className={`font-bold ${row.winner === 'away' ? 'text-amber-400' : 'text-gray-200'}`}>{row.awayName}</span>
                            <span className="text-amber-500 font-bold text-[10px]">{row.awayOdds}</span>
                          </motion.div>
                        </div>
                        <div className="mt-2 text-center text-[10px] text-gray-500">
                          기준값: {row.midStandard}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40">
                    <table className="w-full text-center text-xs text-gray-300">
                      <thead className="bg-[#0b0e14] border-b border-neutral-800/80 text-gray-400 text-[11px] font-bold tracking-wider">
                        <tr>
                          <th className="p-3 text-left pl-6 min-w-[100px]">경기일시</th>
                          <th className="p-3 text-left">리그 (구분)</th>
                          <th className="p-3 text-center min-w-[170px]">승 (홈) / 오버</th>
                          <th className="p-3 text-center min-w-[90px]">무 / 기준값</th>
                          <th className="p-3 text-center min-w-[170px]">패 (원정) / 언더</th>
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
                                  ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black' 
                                  : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90'
                              }`}>
                                <span className={`font-bold ${row.winner === 'home' ? 'text-black' : 'text-gray-300'}`}>
                                  {row.homeName}
                                </span>
                                <span className={`font-bold font-mono tracking-wider ml-auto text-[11px] ${row.winner === 'home' ? 'text-black' : 'text-amber-500'}`}>
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
                                  ? 'bg-amber-500 text-black border-amber-500 shadow-md font-black' 
                                  : 'bg-neutral-900/60 border-neutral-800/60 hover:bg-neutral-900/90'
                              }`}>
                                <span className={`font-bold ${row.winner === 'away' ? 'text-black' : 'text-gray-300'}`}>
                                  {row.awayName}
                                </span>
                                <span className={`font-bold font-mono tracking-wider ml-auto text-[11px] ${row.winner === 'away' ? 'text-black' : 'text-amber-500'}`}>
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
                                <span className="text-gray-300 font-bold">
                                  {row.score} {row.marketType === 'handicap' || row.marketType === 'overUnder' || row.id?.endsWith('_handicap') || row.id?.endsWith('_overUnder') ? '[적특]' : '[무]'}
                                </span>
                              ) : (
                                <span className="text-gray-400">{row.score}</span>
                              )}
                            </td>

                            {/* 결과 */}
                            <td className="p-3 text-center align-middle pr-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className={`inline-block border px-3 py-1 text-[11px] rounded font-bold tracking-tight select-none shadow-[0_2px_4px_rgba(245,158,11,0.05)] ${
                                  row.statusText === '결과대기'
                                    ? 'text-amber-500 bg-amber-950/30 border-amber-900/60 animate-pulse'
                                    : 'text-emerald-400 bg-emerald-950/30 border-emerald-900/60'
                                }`}>
                                  {row.statusText}
                                </div>
                                {isAdmin && row.matchId && (
                                  <button
                                    onClick={() => handleDeleteGameResult(row.matchId)}
                                    className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-900/40 rounded text-red-500 hover:text-red-400 transition cursor-pointer"
                                    title="경기 직접 삭제"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Beautiful Pagination Control */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 bg-neutral-950/20 py-4 rounded-xl border border-neutral-800/40">
                  <div className="text-[11px] font-mono text-gray-400 whitespace-nowrap shrink-0">
                    전체 {allExpandedRows.length.toLocaleString()}개 중 {(startIndex + 1).toLocaleString()}~{Math.min(startIndex + itemsPerPage, allExpandedRows.length).toLocaleString()}개 표시 (페이지 {currentPage} / {maxPage})
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {/* Previous Button */}
                    <button
                      onClick={() => setGameResultPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-800 bg-neutral-900 text-gray-400 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap"
                    >
                      이전
                    </button>

                    {/* Numeric page buttons with sliding window */}
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
                          {p}
                        </button>
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
            )}
          </div>
        </div>
      ) : showMiniGame ? (
        <div className="flex-1 px-1 py-3 md:p-6 w-full mx-auto max-w-[1500px] overflow-hidden">
          <div className="mb-3 text-xs md:text-sm text-gray-400 px-1 flex justify-between items-center">
            <div>
              <button onClick={() => setShowMiniGame(false)} className="hover:text-white">홈</button> &gt; 미니게임
            </div>
            
          </div>

          {/* New Admin-Customizable Dynamic Layout */}
          {true ? (
            <div className={`flex flex-col ${minigameLayout.flexDirection || 'lg:flex-row'} items-start justify-center gap-4 lg:gap-6 relative w-full max-w-full overflow-hidden`}>
              
              {/* Left Column Stack */}
              <div className="flex-1 min-w-0 w-full flex flex-col gap-4 lg:gap-6 order-1">
                {minigameLayout.leftColumn.map(item => (
                  <div key={item}>
                    {renderMinigameWidget(item, false)}
                  </div>
                ))}
              </div>

              {/* Right Column Stack */}
              {!isMobile && minigameLayout.rightColumn.length > 0 && (
                <div className="xl:w-[325px] w-full shrink-0 xl:sticky lg:sticky top-6 flex flex-col gap-4 lg:gap-6 order-2">
                  {minigameLayout.rightColumn.map(item => (
                    <div key={item}>
                      {renderMinigameWidget(item, false)}
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile-only Floating Bet Slip drawer rendering (rendered explicitly for mobile) */}
              {isMobile && renderMinigameCart(true)}

              {/* Mobile Bottom Float Trigger button */}
              {isMobile && !mobileBetSlipOpen && (
                <div className="fixed bottom-16 left-4 right-4 z-40">
                  <button
                    onClick={() => setMobileBetSlipOpen(!mobileBetSlipOpen)}
                    className="w-full flex items-center justify-between font-black text-xs text-white uppercase tracking-wider py-3 bg-gradient-to-r from-amber-500 to-amber-650 hover:from-amber-455 hover:to-amber-555 active:scale-95 transition-all rounded-xl px-5 shadow-[0_4px_12px_rgba(245,158,11,0.3)] cursor-pointer border-0"
                  >
                    <span className="flex items-center gap-2">
                      🎰 배팅 슬립 열기 ▼
                    </span>
                    <span className="bg-white text-amber-950 px-2.5 py-0.5 rounded-full font-black text-[11px] font-mono shrink-0 select-none">
                      {selectedOptions.length}개 선택됨
                    </span>
                  </button>
                </div>
              )}

            </div>
          ) : null}
          {false && (
            <>
            <div className="flex flex-col xl:flex-row items-start justify-center gap-4 lg:gap-6 relative w-full max-w-full overflow-hidden">
            
            {/* 왼쪽 영역: 영상 프레임 및 배팅 영역 통합 감싸개 (데스크톱에서 좌측 칼럼 정렬) */}
            <div className="flex-1 min-w-0 xl:max-w-[830px] w-full flex flex-col gap-4 lg:gap-6 order-1">
              
              {/* 왼쪽 영역: 영상 프레임 (빨간색 테두리와 검정색 배경의 프레임) */}
              <div className="w-full bg-black border border-sky-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-neutral-950 px-3 py-2.5 md:p-4 border-b border-sky-950/80 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                  <span className="text-white font-black text-xs md:text-base tracking-wider truncate">
                    {activeMiniGameTab === 'powerball5' ? '실시간 N파워볼 (5분)' : 
                     activeMiniGameTab === 'powerball3' ? '실시간 N파워볼 (3분)' :
                     activeMiniGameTab === 'powerladder5' ? '실시간 N파워사다리 (5분)' :
                     activeMiniGameTab === 'powerladder3min' ? '실시간 N파워사다리 (3분)' :
                     activeMiniGameTab === 'redpowerladder5' ? '실시간 레드파워사다리 (5분)' :
                     activeMiniGameTab === 'kenoladder5' ? '실시간 엔트리 키노사다리' : ''}
                  </span>
                  {(() => {
                    const mode = minigameModes[activeMiniGameTab] || 
                      (['powerball5', 'powerball3', 'powerladder5', 'redpowerladder5', 'powerladder3min', 'kenoladder5'].includes(activeMiniGameTab) ? 'api' : 'manual');
                    return (
                      <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide border whitespace-nowrap ${
                        mode === 'api' ? 'bg-emerald-950/70 text-emerald-400 border-emerald-900/40' : 
                        mode === 'rng' ? 'bg-blue-950/70 text-blue-400 border-blue-900/40' : 
                        'bg-amber-950/70 text-amber-500 border-amber-900/40'
                      }`}>
                        {mode === 'api' ? '● API정산' : 
                         mode === 'rng' ? '● RNG독립' : 
                         '● 자체정산'}
                      </span>
                    );
                  })()}
                </div>
                <button 
                  onClick={() => setShowMiniGame(false)} 
                  className="text-gray-400 hover:text-white text-[10px] md:text-xs bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 transition shrink-0"
                >
                  나가기
                </button>
              </div>
              

                  {/* 모바일 전용 게임 선택기 */}
                  {isMobile && (
                      <div className="flex overflow-x-auto gap-2 pb-2 mb-2 bg-[#0c0e15]/80 p-2">
                          {[
                              { key: 'powerball5', name: 'N파워볼(5분)' },
                              { key: 'powerball3', name: 'N파워볼(3분)' },
                              { key: 'powerladder5', name: 'N파워사다리(5분)' },
                              { key: 'powerladder3min', name: 'N파워사다리(3분)' },
                              { key: 'redpowerladder5', name: '레드파워사다리(5분)' },
                              { key: 'kenoladder5', name: '엔트리 키노사다리' }
                          ].map(game => (
                              <button 
                                  key={game.key}
                                  onClick={() => setActiveMiniGameTab(game.key)}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${activeMiniGameTab === game.key ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-gray-400'}`}
                              >
                                  {game.name}
                              </button>
                          ))}
                      </div>
                  )}

              <div className="p-0.5 md:p-4 bg-[#0a0e17] flex flex-col justify-center items-center overflow-hidden w-full max-w-full">
                <div className="w-full max-w-full overflow-hidden flex justify-center items-center">
                  {activeMiniGameTab === 'powerball5' ? (
                    <iframe 
                      key="pb5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball5/pc"}
                      width="100%"
                      height={isMobile ? "360" : "640"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800 w-full max-w-full aspect-[830/640] h-auto min-h-[320px]"
                    />
                  ) : activeMiniGameTab === 'powerball3' ? (
                    <iframe 
                      key="pb3"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerball3/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerball3/pc"}
                      width="100%"
                      height={isMobile ? "360" : "640"}
                      scrolling="no" 
                      frameBorder="0"
                      className="rounded-lg shadow-lg border border-neutral-800 w-full max-w-full aspect-[830/640] h-auto min-h-[320px]"
                    />
                  ) : activeMiniGameTab === 'powerladder5' ? (
                    <iframe 
                      key="powerladder5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerladder5/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerladder5/pc"}
                      width="100%"
                      scrolling="no" 
                      frameBorder="0"
                      className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[460px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
                    />
                  ) : activeMiniGameTab === 'redpowerladder5' ? (
                    <iframe 
                      key="redpowerladder5"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/redball/powerladder/mobile" : "https://xn--950bo4em5v.co/minigame/redball/powerladder/pc"}
                      width="100%"
                      scrolling="no" 
                      frameBorder="0"
                      className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[420px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
                    />
                  ) : activeMiniGameTab === 'powerladder3min' ? (
                    <iframe 
                      key="powerladder3min"
                      src={isMobile ? "https://xn--950bo4em5v.co/minigame/nball/powerladder3/mobile" : "https://xn--950bo4em5v.co/minigame/nball/powerladder3/pc"}
                      width="100%"
                      scrolling="no" 
                      frameBorder="0"
                      className={`rounded-lg shadow-lg border border-neutral-800 w-full max-w-full ${isMobile ? 'h-[420px]' : 'aspect-[830/640] h-auto'} min-h-[320px]`}
                    />
                  ) : activeMiniGameTab === 'kenoladder5' ? (
                    renderKenoLadderIframe()
                  ) : (
                    <div className="text-gray-400 p-4">게임을 선택해주세요.</div>
                  )}
                </div>
              </div>
            </div> {/* 영상 프레임 닫기 */}

            {/* 실시간 배팅 판넬 */}
            <div className="w-full bg-[#04060b] border border-sky-500/25 p-2 md:p-6 space-y-4 md:space-y-6 rounded-2xl shadow-2xl relative">
                
                {/* 스포츠 경기 리스트 스타일의 배팅 옵션 셀렉터 - 가로 폭 전체 사용 */}
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-2 md:pb-3 gap-1 px-1">
                    <h3 className="text-xs md:text-sm font-bold text-gray-200 flex items-center gap-1.5">
                      <span className="w-1 h-3.5 bg-sky-500 rounded"></span>
                      실시간 회차별 배팅 보드
                    </h3>
                    <span className="text-[10px] md:text-[11px] text-amber-500 font-semibold animate-pulse">
                      * 현재 회차 + 5회차까지 실시간 배팅 보드가 활성화됩니다.
                    </span>
                  </div>
                </div>


                  {/* 회차 빠른 필터 단축 탭 */}
                  <div className="flex overflow-x-auto gap-1.5 bg-[#0f1118]/80 p-2 rounded-lg border border-neutral-850 scrollbar-none whitespace-nowrap w-full">
                    <button
                      onClick={() => setSelectedRoundFilter('all')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer shrink-0 ${
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
                          className={`px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer shrink-0 ${
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
                            const isClosed = row.round < currentRound || (row.round === currentRound && secondsLeft <= 0);

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
                                    disabled={isClosed}
                                    onClick={isClosed ? undefined : () => handleToggleOption(row.left.group, row.left.value, row.left.dividend, row.round, row.league)}
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
                                      disabled={isClosed}
                                      onClick={isClosed ? undefined : () => handleToggleOption((row.middle as any).group, (row.middle as any).value, (row.middle as any).dividend, row.round, row.league)}
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
                                    <div className={`bg-neutral-950 border border-neutral-900 py-1.5 px-2 rounded font-black text-center select-none font-mono ${
                                      row.middle !== 'VS' ? 'text-amber-400 bg-amber-950/30 text-xs border-amber-900/30' : 'text-gray-500 text-[10px]'
                                    }`}>
                                      {row.middle as string}
                                    </div>
                                  )}
                                </td>

                                {/* 패 (오른쪽 베팅 피스) */}
                                <td className="py-2 px-1">
                                  <button
                                    disabled={isClosed}
                                    onClick={isClosed ? undefined : () => handleToggleOption(row.right.group, row.right.value, row.right.dividend, row.round, row.league)}
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

              </div> {/* 실시간 배팅 판넬 div 닫기 */}
            </div> {/* 왼쪽 칼럼 통합 감싸개 닫기 */}

            {/* 오른쪽 영역: 배팅 슬립 및 전광판 정보 - 모바일 플로팅 슬라이딩 드로어 및 데스크톱 우측 고정 사이드바 적용 */}
            <div 
              style={{
                paddingBottom: isMobile ? '48px' : '20px',
                marginBottom: '0px'
              }}
              className={isMobile 
                ? `fixed bottom-[56px] left-2 right-2 z-50 max-h-[78vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl py-4 pb-12 flex flex-col transition-all duration-300 ${mobileBetSlipOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`
                : 'xl:w-[325px] w-full shrink-0 xl:sticky top-6 order-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-5 shadow-2xl z-30 py-4 flex flex-col h-auto max-h-[80vh] lg:max-h-[694px] xl:h-[694px] lg:overflow-y-auto'
              }>
              <div className="space-y-4 flex flex-col flex-1">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    <h3 className="text-md font-black tracking-tight text-white">미니게임 배팅 카트</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedOptions.length > 0 && (
                      <button 
                        onClick={() => setSelectedOptions([])}
                        className="text-[10px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 text-neutral-450 hover:text-white px-2 py-1 rounded transition"
                      >
                        비우기
                      </button>
                    )}
                    {isMobile && (
                      <button 
                        onClick={() => setMobileBetSlipOpen(false)} 
                        className="text-amber-500 text-xs font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg active:scale-95 transition flex items-center gap-1 shrink-0"
                      >
                        접기 ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 실시간 마감 시간 타이머부터 배팅버튼까지 전체 스크롤 가능한 영역 적용 */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 no-scrollbar pb-1">
                  {/* 실시간 마감 시간 타이머 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">배팅 마감시간</span>
                    <span className={`text-xs font-black flex items-center gap-1.5 ${secondsLeft <= 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                      {secondsLeft <= 0 ? (
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

                {/* Selections Section */}
                <div className="space-y-2 pr-1 no-scrollbar flex-1 overflow-y-auto max-h-[160px] md:max-h-none min-h-[100px]">
                  {selectedOptions.length === 0 ? (
                    <div className="py-10 text-center text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-xl shrink-0">
                      <ShoppingCart className="w-8 h-8 text-neutral-600 mx-auto" />
                      <p className="text-xs font-black">선택된 배팅 옵션이 없습니다.</p>
                      <p className="text-[10px] text-gray-500 leading-tight">게임 배당 버튼을 클릭하여<br />배팅 카트에 추가하십시오.</p>
                    </div>
                  ) : (
                    selectedOptions.map((opt, idx) => {
                      const friendlyGroup = opt.group === '일반볼홀짝' ? '일반볼 홀짝' :
                                            opt.group === '파워볼홀짝' ? '파워볼 홀짝' :
                                            opt.group === '일반볼언오버' ? '일반볼 언더오버' :
                                            opt.group === '파워볼언오버' ? '파워볼 언더오버' : opt.group;
                      return (
                        <div key={idx} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex flex-col gap-1.5 relative shadow-inner shrink-0">
                          <button
                            onClick={() => setSelectedOptions(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 font-bold transition text-xs px-2 py-1"
                            title="제거"
                          >
                            &times;
                          </button>
                          <div className="flex items-center gap-1 pr-6">
                            <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase leading-none border border-amber-500/20">
                              [{opt.round}회차] {opt.game}
                            </span>
                          </div>
                          <div className="text-[11px] font-black text-neutral-250 pr-5 truncate">
                            구분: {friendlyGroup}
                          </div>
                          <div className="flex items-center justify-between text-xs bg-neutral-900 border border-neutral-850/40 p-2 rounded-lg mt-0.5">
                            <span className="font-extrabold text-amber-500 flex items-center gap-1">
                              선택: <span className="text-white underline decoration-amber-500">{opt.name}</span>
                            </span>
                            <span className="font-mono font-black text-neutral-200">{(opt.dividend || 0).toFixed(2)} 배당</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Fixed Footer Content (Multiplier + Amount + Submit) */}
                <div className="flex-shrink-0 space-y-4 pt-4 border-t border-neutral-800">
                  {/* Parlay Multiplier Summary */}
                  {selectedOptions.length > 0 && (() => {
                    const totalDiv = parseFloat(selectedOptions.reduce((acc, current) => acc * (current.dividend || 1), 1).toFixed(2));
                    return (
                      <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-850 space-y-2.5 border-l-2 border-l-amber-500">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-neutral-400 font-extrabold text-[11px]">선택된 옵션 상세</span>
                          <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto no-scrollbar pr-0.5">
                            {selectedOptions.map((opt, i) => {
                              const groupPrefix = opt.group === '일반볼홀짝' || opt.group === '일반볼언오버' || opt.group === '일반볼' ? '[일반볼] ' :
                                                  opt.group === '파워볼홀짝' || opt.group === '파워볼언오버' || opt.group === '파워볼' ? '[파워볼] ' : '';
                              return (
                                <div key={i} className="flex justify-between items-center text-[10px] bg-neutral-900 px-2 py-1 rounded border border-neutral-850/60 shrink-0">
                                  <span className="text-neutral-200 font-bold truncate max-w-[125px] md:max-w-[150px]">
                                    [{opt.round}회] {groupPrefix}{opt.name}
                                  </span>
                                  <span className="text-amber-500 font-black font-mono">{(opt.dividend || 0).toFixed(2)}배</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-neutral-900">
                          <span className="text-neutral-400 font-extrabold">합계 총 배당률 ({selectedOptions.length}폴더)</span>
                          <span className="font-mono font-black text-amber-500 text-sm">{(totalDiv || 0).toFixed(2)}배</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Betting Amount Entry */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-black">배팅금액 (원)</span>
                      <span className="text-[10px] text-amber-500 font-bold font-mono">
                        보유머니: {userBalance.toLocaleString()}원
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
                        placeholder="배팅액 입력"
                        className="w-full bg-neutral-950 border border-neutral-800/80 focus:border-amber-500/55 text-white p-3 rounded-xl font-black font-mono text-sm shadow-inner transition outline-none"
                      />
                      <span className="absolute right-3.5 top-3 text-[10px] font-black text-neutral-500 select-none">KRW</span>
                    </div>

                    {/* Quick Multipliers Buttons Grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[10000, 30000, 50000, 100000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setBetAmount(prev => (prev || 0) + amt)}
                          className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 p-2 rounded-lg text-[10px] font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none"
                        >
                          +{amt >= 1000000 ? `${amt / 1000000}M` : amt >= 10000 ? `${amt / 10000}만` : amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBetAmount(userBalance)}
                        className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700 p-2 rounded-lg text-[10px] font-bold text-amber-500 hover:text-white transition cursor-pointer select-none"
                      >
                        최대
                      </button>
                      <button
                        type="button"
                        onClick={() => setBetAmount(0)}
                        className="bg-neutral-950 hover:bg-[#201010] border border-red-950 hover:border-red-900 p-2 rounded-lg text-[10px] font-bold text-red-400 transition cursor-pointer select-none"
                      >
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* Expected Revenue Summary Block */}
                  {selectedOptions.length > 0 && (() => {
                    const totalDiv = parseFloat(selectedOptions.reduce((acc, current) => acc * (current.dividend || 1), 1).toFixed(2));
                    const estimatedPay = Math.floor(betAmount * totalDiv);
                    return (
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 shadow-inner space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500 font-extrabold">최종 수렴 배당</span>
                          <span className="text-zinc-200 font-black font-mono">{totalDiv.toFixed(2)} 배</span>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-neutral-900">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-300 font-black flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-amber-500" /> 예상 적중금액
                            </span>
                            <span className={`text-sm font-black font-sans tracking-tight ${(estimatedPay > 4000000 && !isAdmin) ? 'text-red-400' : 'text-emerald-400'}`}>
                              {estimatedPay.toLocaleString()}원
                            </span>
                          </div>
                          {(estimatedPay > 4000000 && !isAdmin) && (
                            <div className="text-right text-[10px] text-red-500/90 font-bold bg-red-950/30 p-1.5 rounded border border-red-900/50">
                              미니게임 최대 적중 상한금액 (4,000,000원) 초과
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Core Submission Trigger */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={selectedOptions.length === 0 || !betAmount || selectedOptions.some(opt => {
                      const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);
                      return opt.round < currentRound || (opt.round === currentRound && secondsRemaining <= 0);
                    })}
                    className="w-full bg-gradient-to-r from-amber-500 hover:from-amber-400 to-amber-600 hover:to-amber-500 disabled:opacity-20 disabled:pointer-events-none text-black font-black text-sm p-4 rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 select-none"
                  >
                    {betAmount > userBalance ? (
                      '잔액이 부족합니다'
                    ) : selectedOptions.some(opt => {
                      const { currentRound, secondsRemaining } = getRoundAndSecondsRemaining(opt.gameType);
                      return opt.round < currentRound || (opt.round === currentRound && secondsRemaining <= 0);
                    }) ? (
                      '배팅 마감'
                    ) : (
                      '배팅하기 (Place Stake)'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {isMobile && selectedOptions.length > 0 && !mobileBetSlipOpen && (
              <div className="fixed bottom-[54px] left-0 right-0 z-50 px-3.5 py-2.5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-between border-t border-sky-500/30 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]">
                <button
                  onClick={() => setMobileBetSlipOpen(!mobileBetSlipOpen)}
                  className="w-full flex items-center justify-between font-black text-xs text-white uppercase tracking-wider py-3 bg-gradient-to-r from-sky-650 to-sky-750 hover:from-sky-550 hover:to-sky-650 active:scale-95 transition-all rounded-xl px-5 shadow-[0_4px_12px_rgba(14,165,233,0.3)] cursor-pointer border-0"
                >
                  <span className="flex items-center gap-2">
                    🎰 배팅 슬립 열기 ▼
                  </span>
                  <span className="bg-white text-sky-950 px-2.5 py-0.5 rounded-full font-black text-[11px] font-mono shrink-0 select-none">
                    {selectedOptions.length}개 선택됨
                  </span>
                </button>
              </div>
            )}

          </div>
            </>
          )}
        </div>
      ) : showCasino ? (
        <CasinoContainer 
          currentUserData={currentUserData}
          userBalance={userBalance}
          setUserBalance={setUserBalance}
          setUserPoints={setUserPoints}
          betCloseOffsets={betCloseOffsets}
          updateBetCloseOffset={updateBetCloseOffset}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          {/* Main Feature Banner - High-End Luxury Cohesive VIP Cockpit Board */}
          <div className="relative max-w-[1550px] mx-auto w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 select-none">
            {/* Integrated Glow Backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-gradient-to-tr from-red-950/10 via-amber-950/10 to-transparent rounded-[100px] blur-[140px] pointer-events-none z-0"></div>

            {/* Premium Lockheed Tactical Aerospace Panel */}
            <div 
              className="relative z-10 w-full rounded-3xl border border-sky-500/20 p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
              style={{
                backgroundImage: "linear-gradient(to bottom, rgba(12, 13, 18, 0.5), rgba(6, 7, 10, 0.5), rgba(3, 3, 4, 0.7)), url('/고화질.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'saturate(1.2) brightness(1.15) drop-shadow(0 0 12px rgba(14, 165, 233, 0.25))',
              }}
            >
              {/* Subtle tech grid motif lines */}
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
              
              {/* Sky Blue Shimmer Overlay */}
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-sky-305/10 to-transparent skew-x-[-25deg] animate-gold-shine" />
              
              {/* Corner decorative tactical sky brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sky-500/30 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sky-500/30 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sky-500/30 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sky-500/30 rounded-br-xl pointer-events-none"></div>

              <div className="flex flex-col xl:flex-row items-center justify-between gap-10 relative z-10">
                
                {/* Left Content Column - Embossed & Elegantly Spaced */}
                <div className="flex-1 space-y-6 text-center xl:text-left max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-950/80 via-black to-sky-950/40 border border-sky-500/30 px-3.5 py-1.5 rounded-xl text-[10px] font-black text-sky-400 tracking-wider uppercase animate-pulse shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
                    LOCKHEED MARTIN TACTICAL SYSTEMS
                  </div>
                  
                  <div className="space-y-3">
                    <motion.h1 
                      initial={{ x: -25, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      className="text-4xl md:text-5xl lg:text-[54px] font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-105 to-sky-450 tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] leading-[1.1] italic uppercase"
                    >
                      LMT TACTICAL VIP
                    </motion.h1>
                    <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2.5 text-xs font-black tracking-widest text-sky-400">
                      <span>HIGH-STAKES SPORTS & MULTI-DOMAIN SIMULATIONS</span>
                    </div>
                  </div>

                  {/* Horizontal dividers & micro badges */}
                  <div className="grid grid-cols-4 gap-2 pt-3.5 border-t border-neutral-900/80">
                    {[
                      { name: '축구', count: allMatches.filter(m => m.status === 'pending' && getSportCategory(m) === '축구' && isMatchActive(m.dateTime)).length, emoji: '⚽', route: 'soccer' },
                      { name: '농구', count: allMatches.filter(m => m.status === 'pending' && getSportCategory(m) === '농구' && isMatchActive(m.dateTime)).length, emoji: '🏀', route: 'basketball' },
                      { name: '야구', count: allMatches.filter(m => m.status === 'pending' && getSportCategory(m) === '야구' && isMatchActive(m.dateTime)).length, emoji: '⚾', route: 'baseball' },
                      { name: '배구', count: allMatches.filter(m => m.status === 'pending' && getSportCategory(m) === '배구' && isMatchActive(m.dateTime)).length, emoji: '🏐', route: 'volleyball' },
                    ].map((item, index) => (
                      <div 
                        key={index} 
                        onClick={() => {
                          setSelectedSport(item.name as any);
                          navigateTo('sports');
                        }}
                        className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.1] duration-200 cursor-pointer"
                      >
                        <div className="relative w-10 h-10 flex items-center justify-center text-3xl">
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }} 
                            className="w-full h-full flex items-center justify-center"
                          >
                            {item.emoji}
                          </motion.div>
                          <div className="absolute -top-1 -right-1 bg-neutral-800 text-[8px] text-white px-1 rounded-sm border border-neutral-700">{item.count}</div>
                        </div>
                        <div className="text-[9px] text-gray-300 font-bold">{item.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* High-Tech Tactical Widget Banners - Perfectly structured directly below categories */}
                  <div className="flex flex-row items-center justify-center xl:justify-start gap-4 pt-4 border-t border-neutral-900/50 w-full">
                    <LiveLineupBanner />
                    <AdultWarningBanner />
                  </div>
                </div>
                {/* Laser separation Line for Desktop layout */}
                <div className="hidden xl:block w-[1px] h-64 bg-gradient-to-b from-transparent via-sky-950/60 to-transparent relative self-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)] animate-pulse"></div>
                </div>

                {/* Right Side - Immersive Integrated Casino & Sports Premium Tri-Showcase */}
                <div className="hidden md:grid md:grid-cols-3 gap-5 w-full xl:max-w-[850px]">
                  
                  {/* 3. Luxury Telegram Customer Center Card */}
                  <div>
                    <VerticalTelegramBanner />
                  </div>

                  {/* 4. Luxury Deposit Request Card */}
                  <div>
                    <VerticalDepositBanner onClick={() => setShowDepositScreen(true)} />
                  </div>

                  {/* 5. Luxury Withdrawal Request Card */}
                  <div>
                    <VerticalWithdrawalBanner onClick={() => setShowWithdrawalScreen(true)} />
                  </div>
                  
                </div>



              </div>
            </div>
          </div>

          {/* Main Categories Section */}
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-[1550px] w-full mx-auto space-y-10">
            <SportsHighlightsSection videos={adminVideos} />
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-sky-500 rounded"></span>
                  <h2 className="text-2xl font-black text-white tracking-wider">주요 게임 장르</h2>
                </div>
                <div className="flex md:hidden items-center gap-2 text-white">
                  <span className="text-sm">BGM</span>
                  <BGMControls />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: '스포츠', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=500' },
                  { label: '카지노게임', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500' },
                  { label: '슬롯게임', img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=500' },
                  { label: '미니게임', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=500' },
                  { label: '경기결과', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500' },
                  { label: '공지사항', img: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=500' }
                ].map((cat, idx) => {
                  const isDisabled = cat.label === '슬롯게임' || cat.label === '카지노게임';
                  return (
                    <motion.div 
                      whileHover={!isDisabled ? { y: -6, scale: 1.02 } : {}}
                      key={idx} 
                      onClick={() => {
                        if (isDisabled) return;
                        if (cat.label === '스포츠') {
                          navigateTo('sports');
                        } else if (cat.label === '카지노게임') {
                          navigateTo('casino');
                        } else if (cat.label === '미니게임') {
                          setActiveMiniGameTab('powerball5');
                          navigateTo('minigame');
                        } else if (cat.label === '경기결과') {
                          navigateTo('gameresult');
                        } else {
                          alert(`${cat.label} 기능은 준비 중입니다.`);
                        }
                      }}
                      className={`relative h-40 bg-gray-900 border rounded overflow-hidden shadow-lg group ${
                        isDisabled 
                          ? 'cursor-default opacity-50 grayscale border-gray-800' 
                          : 'cursor-pointer border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.25)]'
                      }`}
                    >
                      {!isDisabled && (
                        <div className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-sky-300/20 to-transparent skew-x-[-25deg] animate-gold-shine" />
                      )}
                      <div 
                        className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-cover bg-center"
                        style={{ backgroundImage: `url(${cat.img})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 z-10">
                        <p className={`text-lg font-black tracking-wide text-white transition-colors ${!isDisabled ? 'group-hover:text-sky-400 font-extrabold' : ''}`}>{cat.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
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
            <p className="tracking-wide">록히드마틴 상담을 원하시는 회원님은 고객문의를 통해 문의해주세요.</p>
            <p className="mt-2 text-[10px] text-gray-700">Copyright 2026 © Lockheed Martin Corp. (LMT) Tactical Systems. All Rights Reserved.</p>
          </footer>
        </>
      )}

      {/* Partner System Modal Overlay */}
      {showPartnerPanel && (
        <PartnerMenuView 
          currentUserData={currentUserData}
          isAdmin={isAdmin}
          onClose={() => setShowPartnerPanel(false)}
          refreshUser={() => {
            loadAllUsers();
          }}
        />
      )}

      {/* Admin Panel Modal Overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-sky-500/50 rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden max-h-screen"
          >
            {/* Modal Header */}
            <div className="bg-neutral-950 p-4 border-b border-sky-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-extrabold tracking-wider">
                <Shield className="w-5 h-5 animate-pulse text-sky-400" />
                <span>LMT - 운영진 어드민 패널 (Admin Control Console)</span>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Info Stats Alert Bar */}
            <div className="bg-sky-950/10 border-b border-sky-900/20 px-6 py-3 flex items-center justify-between text-xs text-gray-400 font-bold">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> 실시간 Firestore 연동</span>
                <div className="flex bg-neutral-900 rounded-md p-1 border border-neutral-800">
                  <button
                    onClick={() => setAdminActiveTab('users')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'users' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Users className="w-3 h-3" /> 회원정보 관리 ({adminUsers.length}명)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('deposits');
                      loadAllDepositRequests();
                    }}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'deposits' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Coins className="w-3 h-3" /> 입금신청 승인대기 ({adminDepositRequests.filter(r => r.status === 'pending').length}건)
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveTab('withdrawals');
                      loadAllWithdrawalRequests();
                    }}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'withdrawals' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Coins className="w-3 h-3 rotate-180 text-amber-500" /> 출금신청 승인대기 ({adminWithdrawalRequests.filter(r => r.status === 'pending').length}건)
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('activeUsers')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'activeUsers' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Activity className="w-3 h-3" /> 실시간 접속자 ({adminUsers.filter(u => u.lastActive > Date.now() - 300000).length}명)
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('settings')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'settings' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Settings className="w-3 h-3 text-amber-500" /> 환율 설정
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('videos')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'videos' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Tv className="w-3 h-3 text-sky-400" /> 하이라이트 영상
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('inquiries')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'inquiries' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Shield className="w-3 h-3 text-red-400" /> 1:1 문의관리 ({adminInquiries.length}건)
                  </button>
                  <button
                    onClick={() => setAdminActiveTab('matches')}
                    className={`px-3 py-1 rounded text-[11px] transition cursor-pointer font-bold flex items-center gap-1 ${adminActiveTab === 'matches' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Edit className="w-3 h-3 text-white" /> 경기 등록 / 정산
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
              ) : adminActiveTab === 'activeUsers' ? (
                <div className="space-y-4">
                  <div className="bg-neutral-800 p-4 rounded text-xs text-gray-300">
                    최근 5분 이내에 활동한 회원 목록입니다.
                  </div>
                  <div className="overflow-x-auto border border-neutral-800 rounded bg-black/30">
                    <table className="w-full text-center text-xs text-gray-300">
                       <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                         <tr>
                           <th className="p-3">닉네임</th>
                           <th className="p-3">아이디</th>
                           <th className="p-3">마지막 활동</th>
                           <th className="p-3">IP 주소</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-neutral-800/60 font-mono">
                         {adminUsers.filter(u => u.lastActive > Date.now() - 300000).map(u => (
                           <tr key={u.id} className="hover:bg-neutral-850/30 transition text-xs">
                             <td className="p-3">{u.nickname}</td>
                             <td className="p-3">{u.username}</td>
                             <td className="p-3">
                               {new Date(u.lastActive).toLocaleTimeString()}
                             </td>
                             <td className="p-3">{u.lastIp || '정보없음'}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
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
              ) : adminActiveTab === 'videos' ? (
                <div className="space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-black text-white mb-2 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                      <Tv className="w-4 h-4 text-sky-400" />
                      유튜브 하이라이트 영상 관리 (최대 10개)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-gray-400 font-bold block">유튜브 영상 URL (필수)</label>
                        <input
                          type="text"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="bg-black border border-neutral-700 text-white px-3 py-2 rounded text-sm w-full"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-gray-400 font-bold block">영상 제목 (선택)</label>
                        <input
                          type="text"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          placeholder="입력 안할시 '스포츠 하이라이트'로 처리"
                          className="bg-black border border-neutral-700 text-white px-3 py-2 rounded text-sm w-full"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
                          const match = newVideoUrl.match(regExp);
                          const embedId = (match && match[7].length === 11) ? match[7] : false;
                          
                          if (!embedId) {
                            alert("올바른 유튜브 URL을 입력해주세요.");
                            return;
                          }
                          
                          const newVideo = {
                            id: `vid_${Date.now()}`,
                            title: newVideoTitle || "스포츠 하이라이트",
                            embedId: embedId,
                            category: "스포츠",
                            duration: "",
                            views: "",
                            tags: []
                          };
                          
                          const updatedVideos = [newVideo, ...adminVideos].slice(0, 10);
                          
                          await setDoc(doc(db, 'appSettings', 'general'), { videos: updatedVideos }, { merge: true });
                          setAdminVideos(updatedVideos);
                          setNewVideoUrl('');
                          setNewVideoTitle('');
                          alert("새 영상이 등록되었습니다.");
                        }}
                        className="bg-red-650 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold transition whitespace-nowrap cursor-pointer h-[38px] flex items-center justify-center gap-1.5"
                      >
                        등록하기
                      </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-800">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                          <thead>
                            <tr className="bg-neutral-800 text-gray-400">
                              <th className="p-3 whitespace-nowrap w-[20%]">썸네일</th>
                              <th className="p-3 whitespace-nowrap w-[50%]">제목 / 링크</th>
                              <th className="p-3 whitespace-nowrap w-[20%] text-center">아이디 (Embed)</th>
                              <th className="p-3 whitespace-nowrap w-[10%] text-center">관리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminVideos.map((vid, idx) => (
                              <tr key={vid.id || idx} className="border-b border-neutral-800/50 hover:bg-neutral-850 transition">
                                <td className="p-2 pl-3">
                                  <img src={`https://img.youtube.com/vi/${vid.embedId}/mqdefault.jpg`} className="w-24 h-auto rounded" alt="thumb"/>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-gray-200 line-clamp-2 leading-relaxed">{vid.title}</div>
                                  <a href={`https://youtube.com/watch?v=${vid.embedId}`} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline mt-1 block">
                                    https://youtube.com/watch?v={vid.embedId}
                                  </a>
                                </td>
                                <td className="p-3 text-center font-mono text-gray-500">{vid.embedId}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={async () => {
                                      if(!confirm('이 영상을 목록에서 삭제하시겠습니까?')) return;
                                      const updatedVideos = adminVideos.filter((v) => v.id !== vid.id);
                                      await setDoc(doc(db, 'appSettings', 'general'), { videos: updatedVideos }, { merge: true });
                                      setAdminVideos(updatedVideos);
                                    }}
                                    className="px-2.5 py-1.5 bg-neutral-800 hover:bg-red-900/30 text-rose-500 rounded font-bold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> 삭제
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {adminVideos.length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-6 text-center text-neutral-500">
                                  등록된 영상이 없습니다.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : adminActiveTab === 'settings' ? (
                <div className="space-y-6">
                  {/* 환율 설정 블록 */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-black text-white mb-2 flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                      <Coins className="w-4 h-4 text-rose-500" />
                      USDT / KRW 환율 설정
                    </h3>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={newExchangeRate || ''}
                        onChange={(e) => setNewExchangeRate(e.target.value)}
                        placeholder={String(exchangeRate)}
                        className="bg-black border border-neutral-700 text-white px-3 py-2 rounded text-sm w-44"
                      />
                      <button
                        onClick={async () => {
                           const rate = Number(newExchangeRate);
                           if(rate <= 0) { alert("올바른 환율을 입력하세요."); return; }
                           await setDoc(doc(db, 'appSettings', 'general'), { usdtToKrwRate: rate }, { merge: true });
                           setExchangeRate(rate);
                           alert("환율 수치정보가 온전하게 업데이트되었습니다.");
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 rounded text-sm font-bold transition whitespace-nowrap cursor-pointer"
                      >
                        저장하기
                      </button>
                    </div>
                  </div>

                  {/* 미니게임 레이아웃 설정 블록 */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
                    <div className="border-b border-neutral-800 pb-3">
                      <h3 className="text-sm font-black text-rose-500 flex items-center gap-1.5">
                        <Layout className="w-4 h-4 text-rose-500" />
                        미니게임 화면 레이아웃 및 배치 설정
                      </h3>
                      <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                        미니게임 상세 화면에서 영상 중계, 배팅 보드, 배팅 카트 위젯의 배치와 기기 해상도별 한 줄/두 줄 줄바꿈 기준을 정합니다.
                        아래 위젯들을 마우스로 드래그하여 원하는 칼럼영역에 떨어뜨리거나(Drag & Drop), 좌측/우측 정치 버튼을 이용해 간편하게 칼럼 간 분할 구성을 정의하십시오.
                      </p>
                    </div>

                    {/* 레이아웃 구성 미리보기 및 상호작용 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* 1. Left Column Layout Area */}
                      <div 
                        className="bg-black/50 border-2 border-dashed border-neutral-700/60 p-4 rounded-xl space-y-3"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleLayoutDrop(e, 'left')}
                      >
                        <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                            왼쪽 칼럼 영역 (메인 영역)
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">Drag here</span>
                        </div>
                        <div className="space-y-2 min-h-[160px] flex flex-col justify-start">
                          {minigameLayout.leftColumn.length === 0 ? (
                            <div className="text-xs text-neutral-600 text-center py-12">비어 있음 (위젯을 드래그하세요)</div>
                          ) : (
                            minigameLayout.leftColumn.map((item, idx) => (
                              <div 
                                key={item}
                                draggable
                                onDragStart={(e) => handleLayoutDragStart(e, item, 'left', idx)}
                                className="bg-[#121420] border border-neutral-800 rounded-lg p-3.5 flex items-center justify-between shadow cursor-move hover:border-neutral-600 hover:bg-[#161a2c] transition active:scale-[0.99] select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-grab" />
                                  <span className="text-xs font-black text-white">
                                    {item === 'video' ? '📺 게임 중계 영상 프레임' : 
                                     item === 'board' ? '📋 실시간 회차별 배팅 보드' : 
                                     item === 'cart' ? '🛒 미니게임 배팅 카트' : item}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* 정렬 버튼 */}
                                  {idx > 0 && (
                                    <button 
                                      onClick={() => handleMoveItem('left', idx, 'up')}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition text-xs font-bold"
                                      title="위로 이동"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < minigameLayout.leftColumn.length - 1 && (
                                    <button 
                                      onClick={() => handleMoveItem('left', idx, 'down')}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition text-xs font-bold"
                                      title="아래로 이동"
                                    >
                                      ▼
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleMoveColumn(item, 'left', 'right')}
                                    className="ml-2 bg-neutral-900 border border-neutral-800 text-[10px] text-amber-500 font-bold px-2 py-1 rounded hover:bg-neutral-800 transition whitespace-nowrap cursor-pointer"
                                  >
                                    우측으로 이동 ➔
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 2. Right Column Layout Area */}
                      <div 
                        className="bg-black/50 border-2 border-dashed border-neutral-700/60 p-4 rounded-xl space-y-3"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleLayoutDrop(e, 'right')}
                      >
                        <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                            오른쪽 칼럼 영역 (사이드바)
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">Drag here</span>
                        </div>
                        <div className="space-y-2 min-h-[160px] flex flex-col justify-start">
                          {minigameLayout.rightColumn.length === 0 ? (
                            <div className="text-xs text-neutral-600 text-center py-12">비어 있음 (1열 레이아웃으로 동작)</div>
                          ) : (
                            minigameLayout.rightColumn.map((item, idx) => (
                              <div 
                                key={item}
                                draggable
                                onDragStart={(e) => handleLayoutDragStart(e, item, 'right', idx)}
                                className="bg-[#121420] border border-neutral-800 rounded-lg p-3.5 flex items-center justify-between shadow cursor-move hover:border-neutral-600 hover:bg-[#161a2c] transition active:scale-[0.99] select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <Menu className="w-3.5 h-3.5 text-neutral-500 cursor-grab" />
                                  <span className="text-xs font-black text-white">
                                    {item === 'video' ? '📺 게임 중계 영상 프레임' : 
                                     item === 'board' ? '📋 실시간 회차별 배팅 보드' : 
                                     item === 'cart' ? '🛒 미니게임 배팅 카트' : item}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* 정렬 버튼 */}
                                  {idx > 0 && (
                                    <button 
                                      onClick={() => handleMoveItem('right', idx, 'up')}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition text-xs font-bold"
                                      title="위로 이동"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < minigameLayout.rightColumn.length - 1 && (
                                    <button 
                                      onClick={() => handleMoveItem('right', idx, 'down')}
                                      className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded transition text-xs font-bold"
                                      title="아래로 이동"
                                    >
                                      ▼
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleMoveColumn(item, 'right', 'left')}
                                    className="ml-2 bg-neutral-900 border border-neutral-800 text-[10px] text-amber-500 font-bold px-2 py-1 rounded hover:bg-neutral-800 transition whitespace-nowrap cursor-pointer"
                                  >
                                    ← 좌측으로 이동
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 해상도 가로 나란히 여부 선택 기준 */}
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                        사이드바와 메인보드가 좌우 나란히 배치될 해상도 기준 (Responsive Breakpoint)
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        설정된 디스플레이 해상도보다 가로폭이 넓으면 구성된 2열 형태가 나란히 제공되며, 작을 경우 기본 수직 단일 열 형태로 스택됩니다. (※ 모바일에서는 항상 최적의 1열 세로형 스태킹이 고수됩니다.)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                        {[
                          { key: 'md:flex-row', label: '768px 이상 (md)', desc: '태블릿부터 항상 좌우 배치' },
                          { key: 'lg:flex-row', label: '1024px 이상 (lg)', desc: '일반 랩톱부터 좌우 배치' },
                          { key: 'xl:flex-row', label: '1280px 이상 (xl)', desc: '큰 데스크톱부터 좌우 배치' },
                          { key: 'flex-col', label: '수평 배치 안 함 (flex-col)', desc: '언제나 1줄 수직 정렬' }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setMinigameLayout(prev => ({ ...prev, flexDirection: opt.key }))}
                            className={`p-3 rounded-xl border text-left transition text-xs flex flex-col gap-1 cursor-pointer select-none ${
                              minigameLayout.flexDirection === opt.key
                                ? 'bg-amber-950/40 border-amber-500 text-amber-400 font-extrabold shadow-md'
                                : 'bg-neutral-950 border-neutral-850 text-gray-400 hover:border-neutral-700'
                            }`}
                          >
                            <span className="font-bold">{opt.label}</span>
                            <span className="text-[10px] text-neutral-500 font-medium">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 제어 버튼 */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                      <button
                        onClick={() => {
                          setMinigameLayout({
                            leftColumn: ['video', 'board'],
                            rightColumn: ['cart'],
                            flexDirection: 'lg:flex-row'
                          });
                          alert("레이아웃이 기본 초기 배치값(왼쪽:영상+보드, 오른쪽:카트)으로 재설정되었습니다. 저장 버튼을 클릭하면 반영됩니다.");
                        }}
                        className="bg-neutral-850 hover:bg-neutral-800 text-gray-400 font-bold text-xs px-4 py-2.5 rounded-lg border border-neutral-800 transition cursor-pointer select-none"
                      >
                        기본값으로 복원
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'appSettings', 'general'), {
                              minigameLayout: minigameLayout
                            }, { merge: true });
                            alert("미니게임 화면 배치 설정이 성공적으로 저장되었습니다!");
                          } catch (error) {
                            alert("설정 저장 중 에러가 발생했습니다: " + error);
                          }
                        }}
                        className="bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-lg border border-rose-650 shadow-lg tracking-wide transition cursor-pointer select-none"
                      >
                        💾 레이아웃 설정 영구 저장하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Bar & Global Message Trigger */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="아이디 또는 닉네임으로 회원 검색..." 
                        value={searchQuery || ''}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-red-600 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setAdminNoteTargetUsername('ALL_USERS');
                        setAdminNoteTargetNickname('전체 회원');
                        setAdminNoteTitle('');
                        setAdminNoteContent('');
                        setIsAdminNoteModalOpen(true);
                      }}
                      className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-650 hover:to-red-750 text-white font-black text-xs rounded-lg shadow-md border border-red-650/30 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                    >
                      <Mail className="w-3.5 h-3.5 text-white animate-pulse" /> 전체 회원 쪽지 전송
                    </button>
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
                            <th className="px-3 py-2 whitespace-nowrap w-20 text-center">가입코드</th>
                            <th className="px-3 py-2 whitespace-nowrap w-[220px]">회원 정보 (ID/PW/닉네임)</th>
                            <th className="px-3 py-2 whitespace-nowrap w-[240px]">테더 지갑 / 출금비번</th>
                            <th className="px-3 py-2 whitespace-nowrap min-w-[140px]">보유 자산</th>
                            <th className="px-3 py-2 whitespace-nowrap w-[150px]">추천 정보</th>
                            <th className="px-3 py-2 text-center whitespace-nowrap w-[190px]">관리 동작</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/10">
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
                                  <td className="px-3 py-2 text-center align-top pt-3 font-mono text-amber-500 font-bold whitespace-nowrap text-xs">{user.joinCode || '5882'}</td>
                                  
                                  {/* 회원 정보 수직 그룹 */}
                                  <td className="px-3 py-2 align-top">
                                    <div className="flex flex-col gap-1.5 text-[11px]">
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-neutral-500 font-bold">ID</span>
                                        <span className="font-bold text-white tracking-wide">{user.username}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-neutral-500 font-bold">PW</span>
                                        {isEditing ? (
                                          <input 
                                            type="text" 
                                            value={editingPassword || ''}
                                            onChange={(e) => setEditingPassword(e.target.value)}
                                            className="bg-black border border-red-500/40 rounded px-1.5 py-0.5 text-white font-mono w-24 focus:outline-none"
                                          />
                                        ) : (
                                          <span className="font-mono text-red-400/85">{user.password}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-8 text-neutral-500 font-bold">닉네임</span>
                                        {isEditing ? (
                                          <input 
                                            type="text" 
                                            value={editingNickname || ''}
                                            onChange={(e) => setEditingNickname(e.target.value)}
                                            className="bg-black border border-red-500/40 rounded px-1.5 py-0.5 text-white w-24 focus:outline-none"
                                          />
                                        ) : (
                                          <span className="text-sky-400 font-bold">{user.nickname || '-'}</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 지갑/보안 그룹 */}
                                  <td className="px-3 py-2 align-top">
                                    <div className="flex flex-col gap-2 text-[11px]">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-neutral-500 font-bold">테더 지갑 주소</span>
                                        {isEditing ? (
                                          <input 
                                            type="text" 
                                            value={editingWallet || ''}
                                            onChange={(e) => setEditingWallet(e.target.value)}
                                            className="bg-black border border-red-500/40 rounded px-1.5 py-0.5 text-white w-full max-w-[200px] focus:outline-none font-mono"
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span className="text-gray-300 font-mono font-semibold select-all truncate w-[160px]">
                                              {user.tetherWalletAddress || '-'}
                                            </span>
                                            {user.tetherWalletAddress && (
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(user.tetherWalletAddress);
                                                  alert('지갑 주소가 복사되었습니다.');
                                                }}
                                                className="text-gray-500 hover:text-amber-400 p-0.5 rounded cursor-pointer"
                                                title="복사"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 pt-0.5 border-t border-neutral-800">
                                        <span className="text-neutral-500 font-bold">출금비번</span>
                                        <span className="font-mono text-amber-500/80">{user.withdrawalPassword || '-'}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 보유 자산 그룹 */}
                                  <td className="px-3 py-2 align-top">
                                    <div className="flex flex-col gap-2 text-[11px]">
                                      <div className="flex justify-between items-center bg-neutral-900 px-2 py-1.5 rounded border border-neutral-800">
                                        <span className="text-neutral-500 font-bold text-[10px]">보유금</span>
                                        {isEditing ? (
                                          <input 
                                            type="number" 
                                            value={editingBalance ?? 0}
                                            onChange={(e) => setEditingBalance(Number(e.target.value) || 0)}
                                            className="bg-black border border-red-500/40 rounded px-1.5 py-0.5 text-white font-mono w-20 text-right focus:outline-none"
                                          />
                                        ) : (
                                          <span className="text-emerald-400 font-mono font-bold tracking-tight">{(user.balance ?? 5000000).toLocaleString()}<span className="text-[10px] text-emerald-500/50 font-sans ml-0.5">원</span></span>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-center bg-neutral-900 px-2 py-1.5 rounded border border-neutral-800">
                                        <span className="text-neutral-500 font-bold text-[10px]">포인트</span>
                                        {isEditing ? (
                                          <input 
                                            type="number" 
                                            value={editingPoints ?? 0}
                                            onChange={(e) => setEditingPoints(Number(e.target.value) || 0)}
                                            className="bg-black border border-red-500/40 rounded px-1.5 py-0.5 text-white font-mono w-20 text-right focus:outline-none"
                                          />
                                        ) : (
                                          <span className="text-cyan-400 font-mono font-bold tracking-tight">{(user.points ?? 50000).toLocaleString()}<span className="text-[10px] text-cyan-500/50 font-sans ml-0.5">P</span></span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 추천 정보 그룹 */}
                                  <td className="px-3 py-2 align-top border-r border-neutral-800/10">
                                    <div className="flex flex-col gap-1 text-[10px] leading-tight mt-1">
                                      <div className="text-gray-400 font-medium whitespace-nowrap">내코드 <span className="font-bold text-amber-500 font-sans ml-1 text-[11px]">{user.referrerCode || '-'}</span></div>
                                      <div className="text-gray-500 font-medium whitespace-nowrap mt-0.5">상위 <span className="font-bold text-cyan-500 font-sans ml-1">{user.appliedReferrerCode || '없음'}</span></div>
                                      <div className="text-gray-500 font-medium whitespace-nowrap mt-0.5">추천수 <span className="font-bold text-emerald-500 font-sans ml-1">{adminUsers.filter(u => u.appliedReferrerCode === user.referrerCode).length}명</span></div>
                                      <div className="mt-1.5">
                                        {isEditing ? (
                                          <label className="inline-flex items-center justify-center gap-1.5 bg-neutral-900 border border-neutral-700/80 rounded px-1.5 py-1 text-[9px] text-amber-400 font-extrabold cursor-pointer select-none">
                                            <input 
                                              type="checkbox" 
                                              checked={editingIsPartner}
                                              onChange={(e) => setEditingIsPartner(e.target.checked)}
                                              className="accent-amber-550 cursor-pointer h-3 w-3"
                                            />
                                            총판파트너
                                          </label>
                                        ) : (
                                          user.isPartner ? (
                                            <span className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black tracking-wider px-2 py-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse truncate max-w-[80px]">
                                              총판 지정
                                            </span>
                                          ) : (
                                            <span className="inline-block bg-neutral-800 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                              일반
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 동작 (관리) */}
                                  <td className="px-3 py-2 align-top text-center">
                                    <div className="grid grid-cols-2 gap-1.5 max-w-[160px] mx-auto mt-0.5">
                                      {isEditing ? (
                                        <>
                                          <button 
                                            onClick={() => handleSaveEdit(user.id)}
                                            className="h-8 bg-green-950/80 hover:bg-green-900 border border-green-800/80 text-green-400 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                          >
                                            <Save className="w-3 h-3 mb-0.5 text-green-400" />
                                            저장
                                          </button>
                                          <button 
                                            onClick={() => setEditingUserId(null)}
                                            className="h-8 bg-neutral-850 hover:bg-neutral-800 text-gray-400 border border-neutral-700 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                          >
                                            <X className="w-3 h-3 mb-0.5 text-gray-400" />
                                            취소
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => {
                                              setAdminSelectedUserForBets(user);
                                              setIsAdminBetsModalOpen(true);
                                            }}
                                            className="h-8 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/30 text-emerald-400 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                            title="배팅로그 확인"
                                          >
                                            <History className="w-3 h-3 mb-0.5 opacity-80" />
                                            내역
                                          </button>
                                          <button 
                                            onClick={() => {
                                              setAdminNoteTargetUsername(user.username || user.id);
                                              setAdminNoteTargetNickname(user.nickname || user.username || '회원');
                                              setAdminNoteTitle('');
                                              setAdminNoteContent('');
                                              setIsAdminNoteModalOpen(true);
                                            }}
                                            className="h-8 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-900/30 text-amber-400 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                            title="쪽지 보내기"
                                          >
                                            <Mail className="w-3 h-3 mb-0.5 opacity-80" />
                                            쪽지
                                          </button>
                                          <button 
                                            onClick={() => handleStartEdit(user)}
                                            className="h-8 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/30 text-blue-400 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                            title="수정하기"
                                          >
                                            <Edit className="w-3 h-3 mb-0.5 opacity-80" />
                                            수정
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="h-8 bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 text-red-500/80 hover:text-red-400 rounded text-[10px] font-bold cursor-pointer transition flex flex-col items-center justify-center"
                                            title="유저 삭제"
                                          >
                                            <Trash2 className="w-3 h-3 mb-0.5 opacity-80" />
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
                              <td colSpan={6} className="p-12 text-center text-gray-500 font-semibold items-center justify-center">
                                가입된 회원이 없습니다.
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
                className="bg-neutral-800 hover:bg-[#1f2229] hover:text-white text-gray-400 font-bold px-4 py-2 border border-neutral-700/50 rounded cursor-pointer text-xs"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showAttendanceChecker && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 px-2 py-4 md:p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl flex flex-col items-end mb-2">
            <button 
              onClick={() => {console.log("Closing modal; userId passed was:", currentUserData?.id); setShowAttendanceChecker(false);}}
              className="text-white/70 hover:text-white flex items-center gap-1.5 font-bold tracking-wide active:scale-95 transition-all bg-black/40 px-3 py-1.5 rounded-full"
            >
              닫기 <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <div className="relative w-full max-w-3xl border-t-0 rounded-2xl overflow-hidden">
            <AttendanceChecker userId={currentUserData?.id || ''} />
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0e11]/95 backdrop-blur-md border-t border-neutral-800/80 px-2 py-1.5 flex items-center justify-around pb-safe-bottom shadow-[0_-5px_22px_rgba(0,0,0,0.9)] md:hidden">
          {/* 1. 스포츠 */}
          <button
            onClick={() => {
              navigateTo('sports');
            }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-1 text-[#a0a5b1] hover:text-sky-400 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-neutral-800 transition-colors">
              <Dribbble className="w-5 h-5 text-gray-400 group-hover:text-sky-400" />
            </div>
            <span className="text-[10px] font-black tracking-tight shrink-0 select-none">
              스포츠
            </span>
          </button>

          {/* 2. 미니게임 */}
          <button
            onClick={() => {
              navigateTo('minigame');
            }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-1 text-[#a0a5b1] hover:text-sky-400 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-neutral-800 transition-colors">
              <Workflow className="w-5 h-5 text-gray-400 group-hover:text-sky-400" />
            </div>
            <span className="text-[10px] font-black tracking-tight shrink-0 select-none">
              미니게임
            </span>
          </button>

          {/* 3. Central Home Button with custom glowing container */}
          <div className="flex-1 relative flex justify-center -mt-6">
            <button
              onClick={() => {
                navigateTo('home');
              }}
              className="w-13 h-13 bg-neutral-950 border-4 border-sky-500 rounded-full flex items-center justify-center shadow-[0_4px_18px_rgba(14,165,233,0.65)] cursor-pointer group transition-transform active:scale-90 animate-gold-flash"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#111215] to-[#040405] flex items-center justify-center relative overflow-hidden">
                <Home className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-all duration-300 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-gold-shine pointer-events-none" />
              </div>
            </button>
          </div>

          {/* 4. 베팅내역 */}
          <button
            onClick={() => {
              navigateTo('bethistory');
            }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-1 text-[#a0a5b1] hover:text-sky-400 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-neutral-800 transition-colors">
              <Receipt className="w-5 h-5 text-gray-400 group-hover:text-sky-400" />
            </div>
            <span className="text-[10px] font-black tracking-tight shrink-0 select-none">
              베팅내역
            </span>
          </button>

          {/* 5. 포인트내역 */}
          <button
            onClick={() => {
              navigateTo('pointshistory');
            }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-1 text-[#a0a5b1] hover:text-sky-400 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-neutral-800 transition-colors">
              <Coins className="w-5 h-5 text-gray-400 group-hover:text-sky-400" />
            </div>
            <span className="text-[10px] font-black tracking-tight shrink-0 select-none">
              포인트내역
            </span>
          </button>
        </div>
      )}

      {showPointsHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 md:p-6">
          <div className="relative w-full h-full md:h-auto md:max-w-5xl bg-[#090b10] md:border md:border-neutral-800 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <button 
              onClick={() => setShowPointsHistory(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <PointHistoryView currentUserData={currentUserData} />
          </div>
        </div>
      )}
      {isReferrerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-white">
          <div className="bg-[#0b0c10] border border-red-900 max-w-xl w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsReferrerModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 hover:bg-neutral-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* 상단 헤더 */}
            <div className="p-6 border-b border-neutral-800 bg-neutral-950/60 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-red-950/50 rounded-xl border border-red-900/60 flex items-center justify-center text-red-500 shadow-inner">
                <Users className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  👥 VIP 파트너 추천인 시스템
                </h3>
                <p className="text-xs text-gray-400">지인을 초대하고 든든하고 강력한 평생 베팅 롤링 보상을 획득하세요.</p>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto font-sans">
              
              {/* 제도 소개 배너 */}
              <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2.5 font-sans">
                <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900 px-2 py-0.5 rounded font-black tracking-wider uppercase">HOW IT WORKS</span>
                <h4 className="text-xs font-black text-amber-500">가장 쉽고 강력한 하부 롤링(Rolling) 및 가상 정산 프로토콜</h4>
                <ul className="text-[11px] text-gray-300 space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold">✓</span>
                    <span><strong>VIP 추천인 코드 수동 심사제:</strong> 무분별한 어뷰징 계정을 걸러내고 가깝고 확실한 유저 유입에 집중하여 1:1 고객센터 상담 검증 후 발급합니다.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold">✓</span>
                    <span><strong>실시간 0.5% 평생 베팅 롤링 적립:</strong> 내 코드로 가입한 지인이 스포츠/미니게임 무엇이든 배팅하면 적중 결과 무관하게 <strong>배팅액의 0.5%</strong>가 롤링금으로 계속 적립됩니다!</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold">✓</span>
                    <span><strong>실배터 충전 보너스 혜택:</strong> 내 코드로 가입한 신규 회원이 <strong>누적 20만원 이상 충전(입금)</strong> 시 정식 <strong className="text-amber-450 font-extrabold">‘적격실배터’</strong>로 자동 인정되며, <strong>가입자와 추천인 모두에게 각각 50,000P</strong>를 전산 지급합니다.</span>
                  </li>
                </ul>
              </div>

              {/* 2단 그리드 layout (본인의 코드 정보 vs 피추천인 상제 정산) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 내 추천인 코드 및 적립 상태 */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850/75 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block">MY PARTNER CODE</span>
                    <div className="flex items-center gap-2">
                      {userReferrerCode ? (
                        <div className="bg-[#111217] border border-neutral-800 px-3.5 py-1.5 rounded-lg flex items-center justify-between w-full">
                          <span className="font-mono font-black text-sm text-amber-450 tracking-wide">{userReferrerCode}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(userReferrerCode);
                              alert('추천인 파트너 코드가 클립보드에 복사되었습니다!');
                            }}
                            className="text-[10px] text-gray-400 hover:text-white bg-neutral-800 px-2.5 py-1 rounded transition border border-neutral-700/50 cursor-pointer"
                          >
                            복사
                          </button>
                        </div>
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="bg-[#111217] border border-dashed border-red-900/60 p-3 rounded-lg text-center">
                            <span className="text-[11px] text-red-500 font-bold block">⚠️ 코드 미발급 상태</span>
                            <span className="text-[9px] text-gray-500 block">고객센터에 발급 심사 요청이 필요합니다.</span>
                          </div>
                          <button 
                            onClick={() => {
                              setIsReferrerModalOpen(false);
                              setShowCreateInquiryModal(true);
                              setInquiryTitle('VIP 추천인 파트너 코드 발급을 신청합니다.');
                              setInquiryContent(`안녕하십니까. VIP 추천인 파트너 코드를 정식 신청하고자 합니다.\n\n[예상 지인 유입수]: 10명 내외\n[주요 홍보 방식/도메인]: 단체 텔레그램방 및 지인 입소문 홍보\n\n확인 후 코드 심사 승인 및 신속 발급 부탁드리겠습니다.`);
                              navigateTo('support');
                            }}
                            className="w-full bg-gradient-to-r from-sky-950 to-sky-900 hover:from-sky-900 hover:to-sky-850 text-sky-200 font-black text-xs py-2 rounded-lg transition active:scale-95 cursor-pointer shadow-md border border-sky-900/50"
                          >
                            💬 1:1 고객센터 발급신청
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 테스트용 가상 어드민 치트 */}
                  {!userReferrerCode && (
                    <div className="border-t border-neutral-900 pt-2.5">
                      <button
                        onClick={() => {
                          const randomCode = Math.floor(1000 + Math.random() * 9005).toString();
                          setUserReferrerCode(randomCode);
                          localStorage.setItem('userReferrerCode', randomCode);
                          alert(`[테스트용 임시 코드 승인] 관리자 심사가 승인되어 코드 [ ${randomCode} ] 를 성공적으로 발급 완료하였습니다!`);
                        }}
                        className="w-full bg-[#111217] hover:bg-neutral-800 border border-neutral-800 text-[9.5px] text-amber-500 hover:text-amber-400 font-bold py-1.5 rounded-md transition cursor-pointer"
                      >
                        ⚙️ [개발자 테스트] 즉시 파트너 코드 승인받기
                      </button>
                    </div>
                  )}

                  {/* 수익 전환 정산 판 */}
                  {userReferrerCode && (
                    <div className="border-t border-neutral-900 pt-2.5 space-y-2">
                      <div className="flex justify-between items-center text-xs font-sans">
                        <span className="text-gray-400">현재 누적 추천인</span>
                        <span className="font-extrabold text-white">{referredUsersCount} 명</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-sans">
                        <span className="text-gray-400">하부 총 베팅액</span>
                        <span className="font-bold text-gray-500 font-mono">{referredTotalBet.toLocaleString()} 원</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#111c14] p-2.5 rounded-lg border border-emerald-950 text-xs font-sans">
                        <span className="text-emerald-400 font-bold">롤링 적립금</span>
                        <span className="font-mono text-emerald-400 font-black">{rollingPoints.toLocaleString()} 원</span>
                      </div>
                      <button 
                        disabled={rollingPoints <= 0}
                        onClick={() => {
                          setUserBalance(prev => {
                            const nextBal = prev + rollingPoints;
                            localStorage.setItem('walletBalance', String(nextBal));
                            return nextBal;
                          });
                          alert(`🎉 성공적으로 롤링 적립금 ${rollingPoints.toLocaleString()}원이 보유머니로 100% 정산 전환되었습니다!`);
                          setRollingPoints(0);
                          localStorage.setItem('rollingPoints', '0');
                        }}
                        className={`w-full font-black text-xs py-2 rounded-lg transition active:scale-95 ${rollingPoints > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-neutral-950 cursor-pointer shadow-md' : 'bg-neutral-850 text-neutral-600 cursor-not-allowed opacity-50'}`}
                      >
                        💰 롤링 적립금 보유머니로 전환
                      </button>
                    </div>
                  )}
                </div>

                {/* 내가 상부 추천인 코드를 등록하는 기능 */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850/75 space-y-3 flex flex-col justify-between font-sans">
                  <div>
                    <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase block mb-1">ENTER UPPER CODE</span>
                    <p className="text-[11px] text-gray-405 mb-2.5 leading-relaxed font-sans">
                      회원가입 시 입력하신 가입 코드를 기반으로 상부 파트너 추천인과의 매칭 연동이 <strong>자동으로 완료</strong>되었습니다. 20만원 이상 충전 발생 시 본인 및 추천인에게 <strong>각각 50,000P</strong>가 시스템 전산으로 자동 추가 적립됩니다.
                    </p>
                    
                    {myAppliedReferrer ? (
                      <div className="bg-[#111217] border border-neutral-800 p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center">
                        <span className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> 추천인 연동 완료 👤
                        </span>
                        <span className="font-mono font-black text-xs text-gray-200">{myAppliedReferrer}</span>
                        {currentUserData?.isQualifiedBettor ? (
                          <span className="text-[9.5px] bg-amber-950/40 border border-amber-900/50 rounded px-2 py-0.5 mt-1 text-amber-500 font-bold">
                            👑 적격실배터 인증 완료 (50,000P 완료)
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-500 text-center leading-normal mt-0.5">
                            (미인증 상태 - 누적 20만원 이상 입금 시 <br />본인/추천인 각각 50,000P 자동 실시간 생성)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#111217] border border-dashed border-neutral-800 p-3 rounded-lg text-center">
                        <span className="text-[11.5px] text-gray-400 font-bold block">⚠️ 연동 추천인 없음</span>
                        <span className="text-[9px] text-gray-500 block">회원 가입 당시 가입 코드 없이 가입된 임시 회원입니다.</span>
                      </div>
                    )}
                  </div>

                  {/* 홍보 문구 복사 배너 */}
                  <div className="border-t border-neutral-900 pt-2 text-[10px] text-gray-505 space-y-1">
                    <span className="text-[9px] text-amber-550 font-black block">📢 추천 활동 길잡이</span>
                    <p className="leading-snug">가이드 커뮤니티, 블로그, 단톡방 등에서 본인의 정식 파트너 코드를 홍보하시면 평생 정산되는 영구적 롤링 수익 기여가 생성됩니다.</p>
                  </div>

                </div>

              </div>

              {/* 하부 피추천 회원 리스트 */}
              {userReferrerCode && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850/75 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5 font-sans">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">나의 추천 가입자 목록</span>
                    <span className="text-[9px] text-emerald-500 font-black font-mono tracking-tight">LIVE REVENUE</span>
                  </div>
                  <div className="overflow-x-auto text-[11px] font-sans">
                    <table className="w-full text-left text-gray-300">
                      <thead>
                        <tr className="text-[9.5px] text-gray-500 border-b border-neutral-900/60 font-bold whitespace-nowrap">
                          <th className="py-1">가입 일자</th>
                          <th className="py-1">회원 아이디</th>
                          <th className="py-1">VIP 등급</th>
                          <th className="py-1 text-right">총 배팅 모두</th>
                          <th className="py-1 text-right text-emerald-500">기여 롤링 포인트 (0.5%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/40 text-gray-300 font-mono">
                        {referredUsersCount === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500 font-sans text-xs">
                              추천 가입자가 존재하지 않습니다.
                            </td>
                          </tr>
                        ) : (
                          <>
                            <tr className="hover:bg-neutral-900/20 transition-colors">
                              <td className="py-1.5 text-gray-500">2026.06.08</td>
                              <td className="py-1.5 font-bold text-gray-200">user7***</td>
                              <td className="py-1.5 text-amber-500 text-[9px] font-black">VIP 1</td>
                              <td className="py-1.5 text-right font-semibold">15,000,000 원</td>
                              <td className="py-1.5 text-right text-emerald-450 font-extrabold">75,000 원</td>
                            </tr>
                            <tr className="hover:bg-neutral-900/20 transition-colors">
                              <td className="py-1.5 text-gray-500">2026.06.09</td>
                              <td className="py-1.5 font-bold text-gray-200">sports_***</td>
                              <td className="py-1.5 text-amber-500 text-[9px] font-black">VIP 1</td>
                              <td className="py-1.5 text-right font-semibold">9,000,000 원</td>
                              <td className="py-1.5 text-right text-emerald-450 font-extrabold">45,000 원</td>
                            </tr>
                            <tr className="hover:bg-neutral-900/20 transition-colors">
                              <td className="py-1.5 text-gray-500">2026.06.10</td>
                              <td className="py-1.5 font-bold text-gray-200">bet_pro***</td>
                              <td className="py-1.5 text-amber-500 text-[9px] font-black">VIP 1</td>
                              <td className="py-1.5 text-right font-semibold">5,000,000 원</td>
                              <td className="py-1.5 text-right text-emerald-450 font-extrabold">25,000 원</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* 하단 푸터 */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-between items-center whitespace-normal">
              <span className="text-[9.5px] text-gray-500 flex items-center gap-1.5 font-semibold text-left">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                안전하고 믿을 수 있는 베팅 플랫폼 지향, 셀프 롤링 어뷰징 적발 시 전환 취소됩니다.
              </span>
              <button
                onClick={() => setIsReferrerModalOpen(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-gray-200 text-xs font-bold px-4.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer border border-neutral-700/40 shrink-0"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 쪽지함 (Mailbox) Modal - Luxury Zero-Trust Design */}
      {showMailboxModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-2 md:p-4 text-white font-sans animate-in fade-in duration-200">
          <div className="bg-[#0b0c10] border border-amber-500/30 max-w-4xl w-full h-[85vh] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)] flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-neutral-800 bg-neutral-950/75 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-450 shadow-inner">
                  <Mail className="w-5 h-5 animate-pulse text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2 whitespace-nowrap">
                    📥 LMT 개인 쪽지함 <span className="text-sky-400 font-mono text-xs px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">{unreadCount} 미확인</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">록히드마틴 운영진이 발송한 중요 공지 및 개별 혜택 소식을 실시간 확인하세요.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowMailboxModal(false); setSelectedNote(null); }}
                className="text-gray-400 hover:text-white transition p-2 hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout content area */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-neutral-950/30">
              
              {/* LIST PANE (Visible on desktop always; visible on mobile when no note is selected) */}
              <div className={`w-full md:w-5/12 border-r border-[#1c1d22] flex flex-col min-h-0 ${selectedNote && isMobile ? 'hidden' : 'flex'}`}>
                <div className="p-3 border-b border-neutral-900 bg-neutral-900/30 flex justify-between items-center text-xs text-gray-400">
                  <span>총 {userNotes.length}개의 메시지</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/60 p-2 space-y-1.5 custom-scrollbar">
                  {userNotes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-gray-600 bg-neutral-950">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500">도착한 쪽지가 없습니다.</p>
                    </div>
                  ) : (
                    userNotes.map((note) => {
                      const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '';
                      return (
                        <div
                          key={note.id}
                          onClick={() => handleReadNote(note)}
                          className={`group relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                            selectedNote?.id === note.id
                              ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/40 shadow-md'
                              : 'bg-[#0f1118]/80 border-neutral-850 hover:border-neutral-750 hover:bg-[#121520]'
                          }`}
                        >
                          {/* Unread indicator dot */}
                          {!note.read && (
                            <span className="absolute top-4.5 left-2 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}

                          <div className="pl-2 space-y-1">
                            <div className="flex items-center justify-between gap-2.5">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                note.sender === '운영자' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-neutral-800 text-gray-300'
                              }`}>
                                {note.sender}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">{dateStr}</span>
                            </div>

                            <h4 className={`text-xs mt-1 truncate ${!note.read ? 'text-white font-extrabold' : 'text-gray-300 font-medium'}`}>
                              {note.title}
                            </h4>

                            <div className="flex justify-between items-center text-[11px] text-gray-400 font-light pt-1">
                              <p className="truncate max-w-[150px] md:max-w-[170px]">{note.content}</p>
                              <button
                                onClick={(e) => handleDeleteNote(note.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-450 rounded transition duration-150 relative z-10"
                                title="쪽지 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-rose-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* READ PANE (Visible on desktop always; visible on mobile when a note is selected) */}
              <div className={`flex-1 flex flex-col min-h-0 ${!selectedNote && isMobile ? 'hidden' : 'flex'}`}>
                {selectedNote ? (
                  <div className="flex-1 flex flex-col min-h-0 bg-neutral-950/60 p-5 md:p-6 select-text overflow-hidden">
                    
                    {/* Header Controls for Mobile Back Navigation & Delete */}
                    <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4 font-sans">
                      {isMobile && (
                        <button
                          onClick={() => setSelectedNote(null)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-gray-300 text-[11px] font-bold rounded-lg flex items-center gap-1 border border-neutral-805 transition cursor-pointer"
                        >
                          ← 목록으로
                        </button>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium font-mono">발송일: {selectedNote.createdAt ? new Date(selectedNote.createdAt).toLocaleString('ko-KR') : ''}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          handleDeleteNote(selectedNote.id, e);
                        }}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-450 hover:text-rose-300 text-[11px] font-black rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 삭제하기
                      </button>
                    </div>

                    {/* Content view box */}
                    <div className="flex-1 overflow-y-auto pr-1 select-text custom-scrollbar">
                      <div className="space-y-4 max-w-2xl">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-black tracking-wider px-2 py-0.5 rounded uppercase">
                              FROM: {selectedNote.sender}
                            </span>
                          </div>
                          <h2 className="text-sm md:text-base font-extrabold text-white leading-snug">
                            {selectedNote.title}
                          </h2>
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-neutral-800 via-neutral-900 to-transparent"></div>

                        <p className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap break-all select-text pb-4 selection:bg-amber-500/30 selection:text-white">
                          {selectedNote.content}
                        </p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 font-sans">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-850 flex items-center justify-center text-neutral-700 shadow-inner mb-3">
                      <Mail className="w-6 h-6 text-gray-600" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-400">선택된 쪽지가 없습니다</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-xs">왼쪽 목록에서 확인하실 쪽지를 선택하시면 세부 내용을 실시간으로 읽으실 수 있습니다.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Bottom Banner */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 text-center text-[10.5px] text-gray-500">
              록히드마틴은 투명하고 믿을 수 있는 양질의 시뮬레이터 이용을 위해 24시간 실시간 고객지원 및 쪽지 문의 서비스를 제공합니다.
            </div>

          </div>
        </div>
      )}

      {/* 어드민 쪽지 발송 모달 (Admin Send Note Modal) */}
      {isAdminNoteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4 text-white font-sans animate-in fade-in duration-200">
          <div className="bg-[#0b0c10] border-2 border-sky-500/20 max-w-lg w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.15)] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-650/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
                  <Send className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-black text-white">
                    ✉️ [운영진] 쪽지 발송 시스템
                  </h3>
                  <p className="text-[10px] text-gray-400">회원 또는 전체 회원에게 맞춤 안내 및 공지 쪽지를 즉각 발송합니다.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminNoteModalOpen(false)}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-neutral-800 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Form */}
            <div className="p-5 space-y-4 bg-neutral-950/40">
              {/* Target display */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-red-500 mb-1.5">
                  수신 대상 (Receiver Information)
                </label>
                <div className="bg-[#111217] border border-neutral-805 rounded-lg px-3 py-2 text-xs font-mono text-white flex items-center justify-between">
                  <span>
                    {adminNoteTargetUsername === 'ALL_USERS' ? (
                      <strong className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                        ★ 전체 회원 일괄 발송 (CHOICE ALL USERS)
                      </strong>
                    ) : (
                      <>
                        수신 아이디: <strong className="text-sky-450 mr-2">{adminNoteTargetUsername}</strong>
                        닉네임: <strong className="text-amber-500">{adminNoteTargetNickname}</strong>
                      </>
                    )}
                  </span>
                  <span className="text-[9px] text-gray-400 font-sans uppercase">수정 불가</span>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-red-500 mb-1.5">
                  쪽지 제목 (Message Title)
                </label>
                <input
                  type="text"
                  placeholder="쪽지의 용건 및 핵심 헤드라인을 입력해주세요."
                  value={adminNoteTitle}
                  onChange={(e) => setAdminNoteTitle(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 hover:border-neutral-750 focus:border-red-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-gray-500"
                />
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-red-500 mb-1.5">
                  쪽지 본문 내용 (Detailed content)
                </label>
                <textarea
                  rows={8}
                  placeholder={`회원에게 직접 노출될 쪽지 내용을 구체적으로 상세히 작성해주세요.\n지원 항목: 행바꿈 줄개행, 줄간격 지원.`}
                  value={adminNoteContent}
                  onChange={(e) => setAdminNoteContent(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 hover:border-neutral-750 focus:border-red-600 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none placeholder-gray-500 resize-none leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 border-t border-neutral-850 bg-neutral-950 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setIsAdminNoteModalOpen(false)}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-gray-300 rounded-lg border border-neutral-750 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSendAdminNote}
                className="px-5 py-2 bg-gradient-to-r from-sky-700 to-sky-650 hover:from-sky-600 hover:to-sky-550 text-white rounded-lg transition shadow-lg shadow-sky-950/40 cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> 쪽지 발송하기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 어드민 배팅 내역 조회 모달 (Admin View Member Bets Modal) */}
      {isAdminBetsModalOpen && adminSelectedUserForBets && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4 text-white font-sans animate-in fade-in duration-200">
          <div className="bg-[#0b0c10] border-2 border-emerald-500/20 max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <History className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-black text-white">
                    🎯 [운영진 전용] <span className="text-amber-400">{adminSelectedUserForBets.nickname}</span> 회원 배팅내역 조회
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">회원 아이디: <strong className="text-sky-400 mr-2">{adminSelectedUserForBets.username}</strong> | 닉네임: <strong className="text-amber-500">{adminSelectedUserForBets.nickname}</strong></p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdminBetsModalOpen(false);
                  setAdminSelectedUserForBets(null);
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-neutral-850 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Scrollable List of Bets */}
            <div className="p-5 overflow-y-auto space-y-4 bg-neutral-950/40 flex-1">
              {!adminSelectedUserForBets.bets || adminSelectedUserForBets.bets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                  <History className="w-12 h-12 text-neutral-800" />
                  <p className="text-xs font-bold">최근 배팅 내역이 존재하지 않습니다.</p>
                  <p className="text-[10px] text-gray-500">해당 회원의 실제 배팅 참여 이력이 존재하지 않습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...adminSelectedUserForBets.bets]
                    .sort((a, b) => {
                      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return timeB - timeA;
                    })
                    .map((bet, idx) => {
                      const betTimeStr = bet.createdAt ? new Date(bet.createdAt).toLocaleString('ko-KR') : '-';
                      const statusColor = 
                        bet.status === 'win' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                        bet.status === 'lose' ? 'border-red-500 bg-red-500/10 text-red-400' :
                        bet.status === 'cancel' ? 'border-gray-500 bg-gray-500/10 text-gray-400' :
                        'border-amber-500 bg-amber-500/10 text-amber-400 animate-pulse';
                      const statusText = 
                        bet.status === 'win' ? '적중' :
                        bet.status === 'lose' ? '미적중' :
                        bet.status === 'cancel' ? '취소됨' : '대기중';

                      return (
                        <div key={idx} className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden shadow-md">
                          {/* Upper stripe with date and overall result */}
                          <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-850 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="bg-neutral-800 text-gray-300 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">
                                {bet.gameType === 'sports' ? '스포츠' : '미니게임'}
                              </span>
                              <span>{betTimeStr}</span>
                            </div>
                            <span className={`px-2 py-0.5 border text-[10px] font-black rounded-md ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>

                          {/* Inner betting detail listing */}
                          <div className="p-4 space-y-3">
                            {bet.folders && bet.folders.length > 0 ? (
                              <div className="space-y-2.5">
                                {bet.folders.map((f: any, fIdx: number) => {
                                  const singleStatusColor = 
                                    f.status === 'win' ? 'text-emerald-400 font-bold' :
                                    f.status === 'lose' ? 'text-red-400 font-bold' :
                                    'text-amber-500';
                                  const singleStatusText = 
                                    f.status === 'win' ? '[적중]' :
                                    f.status === 'lose' ? '[미적중]' : '[대기]';
                                  return (
                                    <div key={fIdx} className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/40 text-xs">
                                      <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1 font-mono">
                                        <span>스포츠 {f.sport || '기타'}</span>
                                        <span className={singleStatusColor}>{singleStatusText}</span>
                                      </div>
                                      <div className="font-bold text-white text-xs mb-1.5">{f.game || '경기 명칭 미지정'}</div>
                                      <div className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded text-[11px] border border-neutral-850/50">
                                        <span className="text-gray-355">선택 마켓: <span className="text-amber-400 font-semibold">{f.marketType === 'underOver' ? '언더오버' : f.marketType === 'handicap' ? '핸디캡' : '승무패'}</span></span>
                                        <span className="text-gray-355">선택 옵션: <span className="text-sky-400 font-bold">{f.option || f.type}</span> <span className="text-neutral-500">@{f.dividend || '1.95'}</span></span>
                                      </div>
                                      {f.rollResult && (
                                        <div className="text-[10px] text-amber-500/95 font-medium mt-1">결과 스코어: {f.rollResult}</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-850/40 text-xs">
                                <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1 font-mono">
                                  <span>{bet.sport || '게임'}</span>
                                  {bet.status === 'win' && <span className="text-emerald-400 font-bold">[적중]</span>}
                                  {bet.status === 'lose' && <span className="text-red-400 font-bold">[미적중]</span>}
                                  {bet.status === 'pending' && <span className="text-amber-500 font-bold">[대기]</span>}
                                </div>
                                <div className="font-bold text-white text-xs mb-1.5">{bet.game || '단폴더 게임'}</div>
                                <div className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded text-[11px] border border-neutral-850/50">
                                  <span className="text-gray-355">구분: <span className="text-amber-400 font-semibold">{bet.marketType || '일반베팅'}</span></span>
                                  <span className="text-gray-355">베팅내용: <span className="text-sky-400 font-bold">{bet.option || bet.type}</span> <span className="text-neutral-500">@{bet.dividend || '1.95'}</span></span>
                                </div>
                                {bet.rollResult && (
                                  <div className="text-[10px] text-amber-500/95 font-medium mt-1">결과 스코어: {bet.rollResult}</div>
                                )}
                              </div>
                            )}

                            {/* Summary footer for the bet slip */}
                            <div className="grid grid-cols-3 gap-2 border-t border-neutral-900 pt-3 text-center text-xs">
                              <div className="bg-[#111217] p-2 rounded-lg border border-neutral-850/30">
                                <span className="block text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">배팅 금액</span>
                                <strong className="font-mono text-white text-[11px] font-black">{Number(bet.amount).toLocaleString()}원</strong>
                              </div>
                              <div className="bg-[#111217] p-2 rounded-lg border border-neutral-850/30">
                                <span className="block text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">합산 배당</span>
                                <strong className="font-mono text-amber-400 text-[11px] font-black">{bet.dividend}倍</strong>
                              </div>
                              <div className="bg-[#111217] p-2 rounded-lg border border-neutral-850/30">
                                <span className="block text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">예상 / 정산 금액</span>
                                <strong className={`font-mono text-[11px] font-black ${bet.status === 'win' ? 'text-emerald-400' : bet.status === 'lose' ? 'text-red-400 line-through' : 'text-cyan-400'}`}>
                                  {bet.payout ? Number(bet.payout).toLocaleString() : Math.floor(bet.amount * bet.dividend).toLocaleString()}원
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-neutral-850 bg-neutral-950 flex justify-end">
              <button
                onClick={() => {
                  setIsAdminBetsModalOpen(false);
                  setAdminSelectedUserForBets(null);
                }}
                className="px-5 py-2 bg-neutral-850 hover:bg-neutral-800 text-gray-300 rounded-lg border border-neutral-750 transition cursor-pointer text-xs font-bold"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
