import React from 'react';
import { motion } from 'motion/react';
import { db, auth, firebaseAvailable, handleFirestoreError, OperationType } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, getDoc, updateDoc, getDocs, addDoc, deleteDoc, query, orderBy, limit, increment, where } from "firebase/firestore";
import { UserProfile, PredictionCard, BetRecord, ChatMessage, DynamicMenuItem, CommunityPost, getApiUrl } from './types';
import { DEFAULT_DYNAMIC_MENUS } from './constants';
import { stripChildTag } from './utils';
import Header from './components/Header';
import LiveChat from './components/LiveChat';
import Dashboard from './components/Dashboard';
import GiftconShop from './components/GiftconShop';
import AiAutoManager from './components/AiAutoManager';
import RegisterForm from './components/RegisterForm';
import CommunityBoard from './components/CommunityBoard';
import CustomerCenter from './components/CustomerCenter';
import PoliticsPortal from './components/PoliticsPortal';
import PredictionResults from './components/PredictionResults';
import UserRanking from './components/UserRanking';
import ChoiceRanking from './components/ChoiceRanking';
import LoginModal from './components/LoginModal';
import PredictionCommentsModal from './components/PredictionCommentsModal';
import { ChoiceKoreaIcon, ChoiceKoreaDarkLogo } from './components/ChoiceKoreaLogo';
import { Gamepad2, Hourglass, Landmark, Trophy, ArrowRight, UserCheck, Flame, CircleDollarSign, ShieldCheck, Power, KeyRound, LogIn, Gift, X, CalendarCheck, SquarePen, MessageSquare, Target, ArrowUp, Lightbulb, Store } from 'lucide-react';

// Prepopulated Default Prediction Cards representing a lively market (Fail-safe initial data)
const MOCK_INITIAL_PREDICTIONS: PredictionCard[] = [];

function KakaoCallbackHandler() {
  const [status, setStatus] = React.useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  React.useEffect(() => {
    const handleExchange = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          throw new Error("Authorization code is missing.");
        }

        const callbackUrl = getApiUrl(`/api/auth/kakao/callback?code=${encodeURIComponent(code)}` + (state ? `&state=${encodeURIComponent(state)}` : ''));

        console.log("🔗 Trading Kakao OAuth code with backend:", callbackUrl);
        const res = await fetch(callbackUrl);
        const htmlText = await res.text();

        document.open();
        document.write(htmlText);
        document.close();
        setStatus('success');
      } catch (err: any) {
        console.error("Kakao Callback error:", err);
        setStatus('error');
        setErrorMsg(err?.message || String(err));
      }
    };

    handleExchange();
  }, []);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121620] text-white p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
        <h2 className="text-lg font-bold">카카오 간편 로그인 처리 중...</h2>
        <p className="text-gray-400 text-xs mt-2">안전한 세션 연결 및 소셜 정보를 확인하는 중입니다.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121620] text-white p-6 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-red-400">카카오 로그인 연동 실패</h2>
        <p className="text-gray-350 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded mt-3 max-w-md break-all font-mono">
          {errorMsg}
        </p>
        <button
          onClick={() => window.close()}
          className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold text-xs px-4 py-2 rounded shadow transition-all cursor-pointer"
        >
          창 닫기
        </button>
      </div>
    );
  }

  return null;
}

export default function App() {
  if (window.location.pathname === '/api/auth/kakao/callback') {
    return <KakaoCallbackHandler />;
  }

  const [currentTab, setCurrentTab] = React.useState<string>('predict');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const kstDate = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // App state backed by LocalStorage and/or Firestore
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [predictions, setPredictions] = React.useState<PredictionCard[]>(MOCK_INITIAL_PREDICTIONS);

  const [bets, setBets] = React.useState<BetRecord[]>([]);
  const [allBets, setAllBets] = React.useState<BetRecord[]>([]);
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [postsHumor, setPostsHumor] = React.useState<CommunityPost[]>([]);
  const [postsNotice, setPostsNotice] = React.useState<CommunityPost[]>([]);
  const [selectedCommunityPostId, setSelectedCommunityPostId] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [activeUserCount, setActiveUserCount] = React.useState<number>(1);
  const [participantCounts, setParticipantCounts] = React.useState<Record<string, number>>({});
  const [mainViewFilter, setMainViewFilter] = React.useState<'ongoing' | 'closed' | 'bookmarked'>('ongoing');
  const [homeBookmarkedIds, setHomeBookmarkedIds] = React.useState<string[]>([]);
  const [isMobileGameListVisible, setIsMobileGameListVisible] = React.useState(false);


  const [toasts, setToasts] = React.useState<{id: string; message: string; type: 'success' | 'info' | 'error'}[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const compressProfileImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context is not available"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!userProfile) {
      addToast("로그인이 필요합니다.", "error");
      return;
    }
    try {
      addToast("이미지 압축 및 등록 중...", "info");
      const compressedBase64 = await compressProfileImage(file);
      await handleUpdateUserProfile(userProfile.uid, { profileImageUrl: compressedBase64 });
      addToast("프로필 이미지가 변경되었습니다.", "success");
    } catch (err) {
      console.error("Profile image upload failed", err);
      addToast("이미지 변환 중 오류가 발생했습니다.", "error");
    }
  };

  const toggleHomeBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHomeBookmarkedIds(prev => {
      const isBookmarked = prev.includes(id);
      let updated;
      if (isBookmarked) {
        updated = prev.filter(bId => bId !== id);
        addToast("북마크가 해제되었습니다", 'info');
      } else {
        updated = [...prev, id];
        addToast("북마크에 등록되었습니다", 'success');
      }
      return updated;
    });
  };

  const speakText = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Asynchronously fetch and map Korean translation voice
        const voices = window.speechSynthesis.getVoices();
        const koVoice = voices.find(v => v.lang.includes('ko') || v.lang.includes('KO'));
        if (koVoice) {
          utterance.voice = koVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };
  
  const [globalSubcategories, setGlobalSubcategories] = React.useState<Record<string, { label: string; count?: string; key: string; children?: any[] }[]>>(() => {
    const saved = localStorage.getItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing subcategories from localStorage:", e);
      }
    }
    return {
      politics: [],
      sports: [],
      esports: [],
      economy: [],
      entertainment: [],
      news: [],
      broadcast: []
    };
  });

  const [dynamicMenus, setDynamicMenus] = React.useState<DynamicMenuItem[]>(() => {
    let menus = DEFAULT_DYNAMIC_MENUS;
    const saved = localStorage.getItem('CHOICE_KOREA_DYNAMIC_MENUS');
    if (saved) {
      try {
        menus = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Automatically inject 'comm_shop' under 'community' submenus if missing
    return menus.map((item) => {
      if (item.id === 'community') {
        const hasShop = item.submenus?.some((sub) => sub.tab === 'shop' || sub.id === 'comm_shop');
        if (!hasShop) {
          return {
            ...item,
            submenus: [
              ...(item.submenus || []),
              { id: 'comm_shop', label: '포인트샵', tab: 'shop' }
            ]
          };
        }
      }
      return item;
    });
  });
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);

  // Firestore synchronization effect
  React.useEffect(() => {
    if (!firebaseAvailable || !db) return;

    // Load initial data - use try-catch to handle permission issues
    const unsubSub = onSnapshot(doc(db, "app_config", "subcategories"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data().list;
        // Only update if data is actually received and not effectively empty (if we assume at least one category might exist)
        // Or if we want to honor Firestore even if empty, remove this check.
        // Actually, let's just make sure it's valid data.
        if (data && Object.keys(data).length > 0) {
          setGlobalSubcategories(data);
          localStorage.setItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES', JSON.stringify(data));
        }
      }
      setIsDataLoaded(true);
    }, (error) => {
      console.warn("Soft warning - error streaming subcategories (likely permissions):", error);
      setIsDataLoaded(true);
    });

    const unsubMenus = onSnapshot(doc(db, "app_config", "dynamicMenus"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data().menus;
        if (data && data.length > 0) {
          // Automatically inject 'comm_shop' under 'community' submenus if missing
          const migratedData = data.map((item: any) => {
            if (item.id === 'community' && item.submenus) {
              const hasShop = item.submenus.some((sub: any) => sub.tab === 'shop' || sub.id === 'comm_shop');
              if (!hasShop) {
                return {
                  ...item,
                  submenus: [
                    ...item.submenus,
                    { id: 'comm_shop', label: '포인트샵', tab: 'shop' }
                  ]
                };
              }
            }
            return item;
          });
          setDynamicMenus(migratedData);
          localStorage.setItem('CHOICE_KOREA_DYNAMIC_MENUS', JSON.stringify(migratedData));
        }
      }
    }, (error) => {
      console.warn("Soft warning - error streaming dynamicMenus (likely permissions):", error);
    });

    return () => {
      unsubSub();
      unsubMenus();
    };
  }, [firebaseAvailable, db]);

  // Automatic syncing useEffect removed to prevent race conditions & data loss during login/logout/refresh.
  // We will now save explicitly when subcategories or dynamic menus are created/edited.

  
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('CHOICE_KOREA_THEME') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('CHOICE_KOREA_THEME', next);
      return next;
    });
  };


  
  const [subcategoryLogos, setSubcategoryLogos] = React.useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('CHOICE_KOREA_SUBCATEGORY_LOGOS');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [predictionCommentCounts, setPredictionCommentCounts] = React.useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('CHOICE_KOREA_COMMENT_COUNTS');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [commentCounts, setCommentCounts] = React.useState<Record<string, number>>({});
  const [replyCounts, setReplyCounts] = React.useState<Record<string, number>>({});

  // Combine comments and nested replies count
  React.useEffect(() => {
    const combined: Record<string, number> = {};
    const keys = new Set([...Object.keys(commentCounts), ...Object.keys(replyCounts)]);
    keys.forEach((key) => {
      combined[key] = (commentCounts[key] || 0) + (replyCounts[key] || 0);
    });
    if (keys.size > 0) {
      setPredictionCommentCounts(combined);
      localStorage.setItem('CHOICE_KOREA_COMMENT_COUNTS', JSON.stringify(combined));
    }
  }, [commentCounts, replyCounts]);

  // Betting interaction states
  const [selectedCardForBet, setSelectedCardForBet] = React.useState<PredictionCard | null>(null);
  const [selectedCommentCard, setSelectedCommentCard] = React.useState<PredictionCard | null>(null);
  const [betOption, setBetOption] = React.useState<string>('');
  const [betAmount, setBetAmount] = React.useState<number>(100);
  const [showNicknameModal, setShowNicknameModal] = React.useState<boolean>(false);
  const [inputNickname, setInputNickname] = React.useState<string>('');
  const [nicknameCheckStatus, setNicknameCheckStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  const [showScrollTop, setShowScrollTop] = React.useState<boolean>(false);
  const [homeDisplayedCount, setHomeDisplayedCount] = React.useState(20);
  const homeObserverTarget = React.useRef(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      if (window.scrollY < 100) {
        setHomeDisplayedCount(20);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  React.useEffect(() => {
    setHomeDisplayedCount(20);
  }, [mainViewFilter, selectedCategory]);

  const getSubcategoryName = (subCatVal?: string, fallbackCat?: string) => {
    if (!subCatVal) {
      if (!fallbackCat || fallbackCat === 'all') return '전체';
      const map: Record<string, string> = {
        politics: '정치',
        sports: '스포츠',
        esports: 'E스포츠',
        economy: '경제',
        entertainment: '연예',
        news: '뉴스',
        broadcast: '방송'
      };
      return map[fallbackCat] || fallbackCat.toUpperCase();
    }
    for (const list of Object.values(globalSubcategories || {})) {
      for (const item of list) {
        if (item.key === subCatVal) {
          return item.label;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.key === subCatVal) {
              return child.label;
            }
          }
        }
      }
    }
    return subCatVal;
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const formatGameStartOption = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}. ${month}. ${day}. (${weekday})`;
  };

  // Custom Authentic Sidebar Login and Board states
  const [loginId, setLoginId] = React.useState<string>('');
  const [loginPw, setLoginPw] = React.useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState<boolean>(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = React.useState<boolean>(false);
  const [rightBoardTab, setRightBoardTab] = React.useState<'sports_analysis' | 'notice' | 'event' | 'free_board' | 'humor_board'>('notice');
  const isAdmin = userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자';
  const [suggestionTitle, setSuggestionTitle] = React.useState<string>('');
  const [suggestionEndAt, setSuggestionEndAt] = React.useState<string>('');
  const [suggestionOptions, setSuggestionOptions] = React.useState<string[]>(['']);
  const [suggestedPredictions, setSuggestedPredictions] = React.useState<PredictionCard[]>([]);
  const [likes, setLikes] = React.useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('CHOICE_KOREA_LIKES_MAP');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [likedByUser, setLikedByUser] = React.useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('CHOICE_KOREA_USER_LIKES');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const popularPredictionGames = React.useMemo(() => {
    return [...predictions]
      .filter(p => p.status === 'open')
      .sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0))
      .slice(0, 5);
  }, [predictions, likes]);

  const duplicatedPopularGames = React.useMemo(() => {
    if (popularPredictionGames.length === 0) return [];
    // Repeat several times to ensure smooth marquee loop
    const list = [];
    for (let i = 0; i < 4; i++) {
      list.push(...popularPredictionGames);
    }
    return list;
  }, [popularPredictionGames]);

  React.useEffect(() => {
    if (selectedCardForBet) {
      if (!betOption || !selectedCardForBet.options.includes(betOption)) {
        setBetOption(selectedCardForBet.options[0] || '');
      }
    }
  }, [selectedCardForBet, betOption]);

  const handleLike = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile) {
      setIsLoginModalOpen(true);
      return;
    }
    
    const isLiked = likedByUser[cardId];
    let newLiked: Record<string, boolean>;
    let newLikes: Record<string, number>;
    if (isLiked) {
      newLiked = { ...likedByUser, [cardId]: false };
      newLikes = { ...likes, [cardId]: Math.max(0, (likes[cardId] || 0) - 1) };
    } else {
      newLiked = { ...likedByUser, [cardId]: true };
      newLikes = { ...likes, [cardId]: (likes[cardId] || 0) + 1 };
    }
    setLikedByUser(newLiked);
    setLikes(newLikes);
    localStorage.setItem('CHOICE_KOREA_USER_LIKES', JSON.stringify(newLiked));
    localStorage.setItem('CHOICE_KOREA_LIKES_MAP', JSON.stringify(newLikes));
  };

  const getRemainingTimeMsg = (endAt?: string) => {
    if (!endAt) return '마감: 일정 미정';
    const endDate = new Date(endAt);
    const now = new Date();
    const diffTime = Math.max(0, endDate.getTime() - now.getTime());
    
    if (diffTime === 0) return '마감됨';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffTime / 1000 / 60) % 60);

    if (diffDays > 0) return `마감: ${diffDays}일 ${diffHours}시간 남음`;
    if (diffHours > 0) return `마감: ${diffHours}시간 ${diffMinutes}분 남음`;
    return `마감: ${diffMinutes}분 남음`;
  };

  // WebSocket support
  const wsRef = React.useRef<WebSocket | null>(null);

  // Initialize socket connections and read events
  React.useEffect(() => {
    let socket: WebSocket | null = null;
    let timerId: any = null;

    const connect = () => {
      const host = window.location.hostname;
      const isFirebaseHosting = host.endsWith('.web.app') || host.endsWith('.firebaseapp.com');
      const isGithubPages = host.endsWith('.github.io');
      
      let wsUrl = '';
      if (isFirebaseHosting || isGithubPages) {
        // Point WebSocket directly to the persistent Cloud Run custom domain backend
        wsUrl = `wss://choicekr.co.kr`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}`;
      }
      
      console.log("🌐 [Real-Time WebSocket] Connecting to:", wsUrl);
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CHAT_MESSAGE') {
            setChats(prev => {
              if (prev.some(c => c.id === data.payload.id)) return prev;
              return [...prev, data.payload];
            });
          } else if (data.type === 'SYSTEM_UPDATE_PREDICTION') {
            // Sync live modifications
            setPredictions(prev => prev.map(p => p.id === data.payload.id ? data.payload : p));
          } else if (data.type === 'SYSTEM_NEW_PREDICTION') {
            // Sync newly added cards
            setPredictions(prev => {
              if (prev.some(p => p.id === data.payload.id)) return prev;
              return [...prev, data.payload];
            });
          } else if (data.type === 'SYSTEM_ONLINE_COUNT') {
            if (data.payload && typeof data.payload.count === 'number') {
              setActiveUserCount(data.payload.count);
            }
          }
        } catch (err) {
          console.warn("Error parsing websocket packet", err);
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket closed. Reconnecting in 3 seconds...");
        timerId = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket encountered error:", err);
        socket?.close();
      };
    };

    connect();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, []);

  // 1. Dual-Engine Firebase listener and fail-safe local fallback
  React.useEffect(() => {
    // Check local storage for initial user session or prompt creation
    let currentUid = localStorage.getItem('PREDICT_USER_UID');
    let currentNickname = localStorage.getItem('PREDICT_USER_NICKNAME');
    
    if (currentUid && currentNickname) {
      const mockProfile: UserProfile = {
        uid: currentUid,
        nickname: currentNickname,
        points: Number(localStorage.getItem('PREDICT_USER_POINTS') || '1000'),
        predictsCount: Number(localStorage.getItem('PREDICT_USER_PREDICTS') || '0'),
        successCount: Number(localStorage.getItem('PREDICT_USER_SUCCESS') || '0'),
        exchangeCount: Number(localStorage.getItem('PREDICT_USER_EXCHANGE') || '0'),
        profileImageUrl: localStorage.getItem('PREDICT_USER_PROFILE_IMAGE') || undefined,
        createdAt: new Date().toISOString(),
        activeBadge: localStorage.getItem('PREDICT_USER_ACTIVE_BADGE') || undefined,
        purchasedBadges: localStorage.getItem('PREDICT_USER_PURCHASED_BADGES') ? JSON.parse(localStorage.getItem('PREDICT_USER_PURCHASED_BADGES')!) : undefined
      };
      setUserProfile(mockProfile);
      try {
        const storedUsers = JSON.parse(localStorage.getItem('PREDICT_LOCAL_ALL_USERS') || '[]');
        let finalUsers = [...storedUsers];
        if (!finalUsers.some(u => u.uid === currentUid)) {
          finalUsers.push(mockProfile);
        } else {
          finalUsers = finalUsers.map(u => u.uid === currentUid ? { ...u, ...mockProfile } : u);
        }
        setAllUsers(finalUsers);
        localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(finalUsers));
      } catch {
        setAllUsers([mockProfile]);
      }
    } else {
      // First boot: Allow non-members/guests to view the screens freely
      setShowNicknameModal(false);
    }

    if (firebaseAvailable && db) {
      // Stream predictions from Firestore
      const unsubPredictions = onSnapshot(collection(db, "predictions"), (snapshot) => {
        const list: PredictionCard[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PredictionCard);
        });
        if (list.length > 0) {
          setPredictions(list);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "predictions");
      });

      // Stream chats
      const unsubChats = onSnapshot(collection(db, "chats"), (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        const sorted = list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setChats(sorted);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "chats");
      });

      // Stream users for leaderboards
      const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as UserProfile;
          const uid = data.uid || doc.id; // Safe fallback if document uid field is missing
          const normalizedUser = { ...data, uid };
          if (!pendingDeletionsRef.current.has(uid)) {
            list.push(normalizedUser);
          }
        });
        setAllUsers(list);

        // Update current authenticated user context if existing in list
        if (currentUid) {
          const match = list.find(u => u.uid === currentUid);
          if (match) {
            setUserProfile(match);
            localStorage.setItem('PREDICT_USER_POINTS', String(match.points));
            localStorage.setItem('PREDICT_USER_PREDICTS', String(match.predictsCount));
            localStorage.setItem('PREDICT_USER_SUCCESS', String(match.successCount));
            localStorage.setItem('PREDICT_USER_NICKNAME', match.nickname);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      });

      // Stream bets
      const unsubBets = onSnapshot(collection(db, "bets"), (snapshot) => {
        const list: BetRecord[] = [];
        const betUserSet: Record<string, Set<string>> = {};
        
        snapshot.forEach((doc) => {
          const docData = doc.data() as BetRecord;
          list.push({ id: doc.id, ...docData });
          
          if (!betUserSet[docData.predictionId]) {
            betUserSet[docData.predictionId] = new Set<string>();
          }
          if (docData.userId) {
            betUserSet[docData.predictionId].add(docData.userId);
          }
        });
        
        const counts: Record<string, number> = {};
        for (const [pId, users] of Object.entries(betUserSet)) {
          counts[pId] = users.size;
        }
        setParticipantCounts(counts);

        // Filter bets for current session
        if (currentUid) {
          const myBets = list.filter(b => b.userId === currentUid);
          setBets(myBets);
        }
        setAllBets(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "bets");
      });

      // Stream posts
      const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snapshot) => {
        const list: CommunityPost[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CommunityPost);
        });
        setPosts(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "posts");
      });

      // Stream posts humor
      const unsubPostsHumor = onSnapshot(query(collection(db, "posts_humor"), orderBy("timestamp", "desc")), (snapshot) => {
        const list: CommunityPost[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CommunityPost);
        });
        setPostsHumor(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "posts_humor");
      });

      // Stream posts notice
      const unsubPostsNotice = onSnapshot(query(collection(db, "posts_notice"), orderBy("timestamp", "desc")), (snapshot) => {
        const list: CommunityPost[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CommunityPost);
        });
        setPostsNotice(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "posts_notice");
      });

      // Stream subcategory logos
      const unsubLogos = onSnapshot(collection(db, "subcategory_logos"), (snapshot) => {
        const logoMap: Record<string, string> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subCategory && data.imageUrl) {
            logoMap[data.subCategory] = data.imageUrl;
          }
        });
        setSubcategoryLogos(logoMap);
        localStorage.setItem('CHOICE_KOREA_SUBCATEGORY_LOGOS', JSON.stringify(logoMap));
      }, (error) => {
        console.warn("Soft warning - streaming subcategory logos (re-evaluation underway):", error);
        try {
          const savedLogos = localStorage.getItem('CHOICE_KOREA_SUBCATEGORY_LOGOS');
          if (savedLogos) {
            setSubcategoryLogos(JSON.parse(savedLogos));
          }
        } catch (e) {
          console.error("Error parsing local logos fallback:", e);
        }
      });

      // Stream dynamic subcategories from Firestore in real-time has been cleaned up and replaced by document listening on app_config/subcategories.


      // Stream prediction comments for counting
      const unsubComments = onSnapshot(collection(db, "prediction_comments"), (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.predictionId) {
            counts[data.predictionId] = (counts[data.predictionId] || 0) + 1;
          }
        });
        setCommentCounts(counts);
      }, (error) => {
        console.warn("Soft warning - streaming comments fallback:", error);
      });

      // Stream prediction replies for counting
      const unsubReplies = onSnapshot(collection(db, "prediction_replies"), (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.predictionId) {
            counts[data.predictionId] = (counts[data.predictionId] || 0) + 1;
          }
        });
        setReplyCounts(counts);
      }, (error) => {
        console.warn("Soft warning - streaming prediction replies fallback:", error);
      });

      // Stream suggested predictions
      const unsubSuggestions = onSnapshot(collection(db, "suggestions"), (snapshot) => {
        console.log("DEBUG: suggestions snapshot, doc count:", snapshot.size);
        const list: PredictionCard[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PredictionCard);
        });
        setSuggestedPredictions(list);
      }, (error) => {
        console.warn("Soft warning - streaming suggestions:", error);
      });

      return () => {
        unsubPredictions();
        unsubChats();
        unsubUsers();
        unsubBets();
        unsubPosts();
        unsubPostsHumor();
        unsubPostsNotice();
        unsubLogos();
        unsubComments();
        unsubReplies();
        unsubSuggestions();
      };
    } else {
      // Local fallback setup for Chat and leaderboard
      const localBets = JSON.parse(localStorage.getItem('PREDICT_LOCAL_BETS') || '[]');
      setBets(localBets);
      setAllBets(localBets);

      try {
        const savedLogos = localStorage.getItem('CHOICE_KOREA_SUBCATEGORY_LOGOS');
        if (savedLogos) {
          setSubcategoryLogos(JSON.parse(savedLogos));
        }
      } catch (e) {
        console.error("Error parsing local subcategory logos:", e);
      }

      try {
        const allComments: any[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const allReplies: any[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_REPLIES') || '[]');
        const counts: Record<string, number> = {};
        
        allComments.forEach(c => {
          if (c.predictionId) {
            counts[c.predictionId] = (counts[c.predictionId] || 0) + 1;
          }
        });
        
        allReplies.forEach(r => {
          if (r.predictionId) {
            counts[r.predictionId] = (counts[r.predictionId] || 0) + 1;
          }
        });
        
        setPredictionCommentCounts(counts);
      } catch (e) {
        console.error("Error loading offline comment counts:", e);
      }

      const systemWelcome: ChatMessage = {
        id: "sys-welcome",
        userId: "system",
        userNickname: "시스템봇",
        userColor: "text-red-500",
        message: "CHOICE KOREA에 참여하신 것을 환영합니다! 초이스 코리아 실시간 투표 및 하이브리드 인텔리전스 시스템이 정상 작동 중입니다.",
        type: "system",
        createdAt: new Date().toISOString()
      };
      setChats([systemWelcome]);
    }
  }, [firebaseAvailable]);

  const handleCheckNickname = () => {
    if (!inputNickname.trim()) return;
    const cleanNick = inputNickname.trim().substring(0, 10);
    const isTaken = allUsers.some(u => u.nickname === cleanNick && (!userProfile || u.uid !== userProfile.uid));
    if (isTaken) {
      setNicknameCheckStatus('taken');
    } else {
      setNicknameCheckStatus('available');
    }
  };

  // Handle Nickname Login Setup
  const handleSaveNickname = async () => {
    if (!inputNickname.trim()) return;
    if (nicknameCheckStatus !== 'available') {
      alert("먼저 중복확인을 진행해주세요.");
      return;
    }
    const cleanNick = inputNickname.trim().substring(0, 10);
    
    // Check if nickname is taken (excluding current user)
    const isTaken = allUsers.some(u => u.nickname === cleanNick && (!userProfile || u.uid !== userProfile.uid));
    if (isTaken) {
      alert("이미 사용중인 닉네임입니다.");
      return;
    }

    if (userProfile) {
      // Update existing nickname
      const now = new Date().toISOString();
      const updatedProfile = { ...userProfile, nickname: cleanNick, lastNicknameChangeAt: now };
      localStorage.setItem('PREDICT_USER_NICKNAME', cleanNick);
      setUserProfile(updatedProfile);
      setAllUsers(prev => {
        const next = prev.map(u => u.uid === userProfile.uid ? updatedProfile : u);
        localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(next));
        return next;
      });
      
      // Persist to Firestore (always merge uid as well to keep data fully integral)
      if (firebaseAvailable && db) {
        try {
          await setDoc(doc(db, "users", userProfile.uid), { uid: userProfile.uid, nickname: cleanNick, lastNicknameChangeAt: now }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}`);
        }
      }
      
      alert("닉네임이 변경되었습니다.");
    } else {
      // Create new user profile
      const generatedUid = 'usr_' + Math.random().toString(36).substring(2, 11);
      const initialProfile: UserProfile = {
        uid: generatedUid,
        nickname: cleanNick,
        points: 1000,
        predictsCount: 0,
        successCount: 0,
        exchangeCount: 0,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('PREDICT_USER_UID', generatedUid);
      localStorage.setItem('PREDICT_USER_NICKNAME', cleanNick);
      localStorage.setItem('PREDICT_USER_POINTS', '1000');
      
      setUserProfile(initialProfile);
      setAllUsers(prev => {
        const next = prev.some(u => u.uid === initialProfile.uid) ? prev : [...prev, initialProfile];
        localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(next));
        return next;
      });
      
      // Save newly created user to Firestore if connected
      if (firebaseAvailable && db) {
        try {
          await setDoc(doc(db, "users", generatedUid), initialProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${generatedUid}`);
        }
      }
      
      alert("🎉 가입 기념 보너스 1,000P 가 지급되었습니다!");
      
      // System announce chat login
      sendChatMessage(`${cleanNick}님이 포인트를 충전하고 예측 공론장에 입장하셨습니다! 👋`, 'system');
    }
    
    setShowNicknameModal(false);
  };

  const handleLogout = async () => {
    if (firebaseAvailable && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error", err);
      }
    }
    const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('PREDICT_'));
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setUserProfile(null);
    window.location.reload();
  };

  const handleUpdateQuest = async (type: 'attendance' | 'post' | 'comment' | 'prediction', currentProfile?: UserProfile) => {
    const userToUse = currentProfile || userProfile;
    if (!userToUse) return;
    const today = kstDate;
    let q = userToUse.dailyQuest;
    if (!q || q.date !== today) {
      q = { date: today, attendance: false, posts: 0, comments: 0, predictions: 0, completed: false };
    } else {
      q = { ...q };
    }

    if (q.completed && type !== 'attendance') return;

    let pointsToAdd = 0;
    let message = '';

    if (type === 'attendance') {
      if (q.attendance) {
        alert('이미 오늘은 출석체크를 완료하셨습니다.');
        return;
      }
      q.attendance = true;
      pointsToAdd = 1000;
      message = '출석체크 완료! 1,000P 가 지급되었습니다.';
    } else if (type === 'post') {
      if (q.posts < 3) q.posts++;
    } else if (type === 'comment') {
      if (q.comments < 5) q.comments++;
    } else if (type === 'prediction') {
      if (q.predictions < 10) q.predictions++;
    }

    if (!q.completed && q.attendance && q.posts >= 3 && q.comments >= 5 && q.predictions >= 10) {
      q.completed = true;
      pointsToAdd += 4000;
      message = '🎉 일일 퀘스트를 모두 달성하여 추가 4,000P 가 지급되었습니다!';
    }

    const newProfile = { ...userToUse, dailyQuest: q, points: userToUse.points + pointsToAdd };
    setUserProfile(newProfile);

    if (pointsToAdd > 0) {
      localStorage.setItem('PREDICT_USER_POINTS', String(newProfile.points));
    }

    if (message) {
      alert(message);
    }

    if (firebaseAvailable && db) {
      updateDoc(doc(db, "users", userToUse.uid), { 
        dailyQuest: q,
        points: increment(pointsToAdd)
      }).catch(e => {
        console.error("Quest update error", e);
      });
    }
  };

  // Helper function to dispatch ChatMessages locally and globally (WebSocket)
  const sendChatMessage = async (text: string, type: 'chat' | 'system' | 'bot_announcement' = 'chat') => {
    if (userProfile?.isBanned && type === 'chat') {
      alert(`❌ 귀하의 계정은 현재 이용이제제(활동정지) 상태입니다.\n사유: ${userProfile.banReason || '운영제한'}`);
      return;
    }

    if (userProfile?.chatMutedUntil && type === 'chat') {
      const mutedUntil = new Date(userProfile.chatMutedUntil).getTime();
      if (mutedUntil > Date.now()) {
        const ms = mutedUntil - Date.now();
        const seconds = Math.ceil(ms / 1000);
        let diffText = `${seconds}초`;
        if (seconds >= 60) {
          const minutes = Math.ceil(seconds / 60);
          diffText = `${minutes}분`;
          if (minutes >= 60) {
            const hours = Math.ceil(minutes / 60);
            diffText = `${hours}시간`;
          }
        }
        alert(`❌ 귀하는 현재 실시간 채팅 금지 상태입니다.\n해제까지 남은 시간: ${diffText}`);
        return;
      }
    }

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      userId: userProfile?.uid || 'guest',
      userNickname: userProfile?.nickname || '방문자',
      userColor: 'text-gray-400',
      message: text,
      type: type,
      createdAt: new Date().toISOString()
    };

    // Broadcast websocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        payload: newMessage
      }));
    } else {
      // Local addition
      setChats(prev => [...prev, newMessage]);
    }

    // Capture to Firestore DB
    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "chats", newMessage.id), newMessage);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `chats/${newMessage.id}`);
      }
    }
  };

  // Handle Placing Bets
  const handlePlacePrediction = async () => {
    if (!userProfile) {
      setIsLoginModalOpen(true);
      return;
    }

    if (userProfile.isBanned) {
      alert(`❌ 귀하의 계정은 현재 이용이제제(활동정지) 상태입니다. 예측 참여가 차단됩니다.\n사유: ${userProfile.banReason || '운영제한'}`);
      return;
    }

    // Daily limit check (max 10)
    const now = new Date();
    const todayPredictions = (userProfile.dailyPredictions || []).filter(p => new Date(p.timestamp).toDateString() === now.toDateString());
    if (todayPredictions.length >= 10) {
      alert("하루 예측한도를 모두 소진하였습니다");
      return;
    }

    if (!selectedCardForBet || !betOption) return;

    // Check duplicate participation (only allow 1 participation per prediction game)
    const hasAlreadyPredicted = allBets.some(
      b => b.userId === userProfile.uid && b.predictionId === selectedCardForBet.id
    );
    if (hasAlreadyPredicted) {
      alert("이미 예측을 참여하였습니다");
      return;
    }

    // Record Prediction Choice
    const updatedProfile: UserProfile = {
      ...userProfile,
      predictsCount: (userProfile.predictsCount || 0) + 1,
      dailyPredictions: [...(userProfile.dailyPredictions || []), { predictionId: selectedCardForBet.id, timestamp: now.getTime() }]
    };

    setUserProfile(updatedProfile);
    localStorage.setItem('PREDICT_USER_PREDICTS', String(updatedProfile.predictsCount));

    // Save updated user profile to Firebase users collection if active
    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", updatedProfile.uid), updatedProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${updatedProfile.uid}`);
      }
    } else {
      // Local state fallback list update
      setAllUsers(prev => {
        const next = prev.map(u => u.uid === updatedProfile.uid ? updatedProfile : u);
        localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(next));
        return next;
      });
    }

    // Update Card Participation count
    const updatedPool = { ...selectedCardForBet.pool };
    updatedPool[betOption] = (updatedPool[betOption] || 0) + 1; // Increment participation counter
    
    const updatedCard: PredictionCard = {
      ...selectedCardForBet,
      pool: updatedPool,
      totalPool: selectedCardForBet.totalPool + 1
    };

    setPredictions(prev => prev.map(p => p.id === updatedCard.id ? updatedCard : p));

    // Update card on Firestore if available
    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "predictions", updatedCard.id), updatedCard);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `predictions/${updatedCard.id}`);
      }
    }

    // Record Prediction Entry (Simplified participation record)
    const newRecord: BetRecord = {
      id: 'pred_' + Math.random().toString(36).substring(2, 11),
      userId: userProfile.uid,
      userNickname: userProfile.nickname,
      predictionId: selectedCardForBet.id,
      option: betOption,
      amount: 100,
      status: 'pending',
      payout: 0,
      createdAt: new Date().toISOString()
    };

    // Save prediction record to Firestore DB if available
    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "bets", newRecord.id), newRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `bets/${newRecord.id}`);
      }
    } else {
      // Local state fallback for non-Firebase environment
      setAllBets(prev => {
        const next = [...prev, newRecord];
        localStorage.setItem('PREDICT_LOCAL_BETS', JSON.stringify(next));
        return next;
      });
      setParticipantCounts(prev => {
        const currentCount = prev[selectedCardForBet.id] || 0;
        return {
          ...prev,
          [selectedCardForBet.id]: currentCount + 1
        };
      });
    }

    // Broadcast prediction changes on WebSockets
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SYSTEM_UPDATE_PREDICTION',
        payload: updatedCard
      }));
    }

    handleUpdateQuest('prediction', updatedProfile);

    // Trigger on-screen toast and text-to-speech voice
    addToast(`참여 완료: [${selectedCardForBet.title.substring(0, 15)}...] (${betOption})`, 'success');
    speakText("예측 참여를 완료했습니다");

    setSelectedCardForBet(null);
  };

  // AI 오라클 확정에 의한 마켓 최종 정산 & 이자 배드 분률 분배 알고리즘
  // AI 오라클 확정에 의한 마켓 최종 정산 & 이자 배드 분률 분배 알고리즘 및 결과 수정(교정) 로직 통합
  const handleResolvePrediction = async (predictionId: string, winningOption: string, evidence: string) => {
    // 1. Find matching prediction
    const predictionTarget = predictions.find(p => p.id === predictionId);
    if (!predictionTarget) return;

    const isAlreadyResolved = predictionTarget.status === 'resolved';
    const oldWinningOption = predictionTarget.winningOption;

    // Transition prediction stat to resolved
    const updatedCard: PredictionCard = {
      ...predictionTarget,
      status: 'resolved',
      winningOption: winningOption
    };

    // Calculate payouts safely with fallbacks
    const totalPrizePool = updatedCard.totalPool || 0;
    const currentPool = updatedCard.pool || {};
    const winningPoolAmount = currentPool[winningOption] || 0;
    
    // Calculate odds for reward allocation - safely guard against division by zero
    const winningOdds = (totalPrizePool > 0 && winningPoolAmount > 0) ? (totalPrizePool / winningPoolAmount) : 1;

    // Safe-clean any undefined properties to prevent Firestore crash on setDoc
    const sanitizedCard = JSON.parse(JSON.stringify(updatedCard));

    setPredictions(prev => prev.map(p => p.id === predictionId ? sanitizedCard : p));

    // Broadcast market update via socket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SYSTEM_UPDATE_PREDICTION',
        payload: sanitizedCard
      }));
    }

    // Load entire bets for payout settlement
    // Connect to Firestore or check local storage
    let associatedBets: BetRecord[] = [];
    if (firebaseAvailable && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "bets"));
        querySnapshot.forEach((doc) => {
          const data = doc.data() as BetRecord;
          if (data.predictionId === predictionId) {
            associatedBets.push({ id: doc.id, ...data });
          }
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "bets");
      }
    } else {
      associatedBets = JSON.parse(localStorage.getItem('PREDICT_LOCAL_BETS') || '[]').filter((b: any) => b.predictionId === predictionId);
    }

    const isRefund = winningOption === 'CANCELED' || winningOption === 'SPECIAL_PUSH' || winningOption === '경기취소' || winningOption === '적중특례';

    if (isAlreadyResolved) {
      // ⚠️ ADM 결과 수정 & 정산 소급 교정 특례
      console.log(`[retroactive correction] Resolving predictionId ${predictionId} from ${oldWinningOption} to ${winningOption}`);
      
      for (const bet of associatedBets) {
        // Find previous state
        const oldStatus = bet.status; // 'won' | 'lost' | 'refunded'
        const oldPayout = bet.payout || 0;

        let newStatus: 'won' | 'lost' | 'refunded' = 'lost';
        let newPayout = 0;

        if (isRefund) {
          newStatus = 'refunded';
          newPayout = bet.amount;
        } else {
          const isWinner = bet.option === winningOption;
          newStatus = isWinner ? 'won' : 'lost';
          newPayout = isWinner ? Math.round(bet.amount * winningOdds) : 0;
        }

        // Compute adjustment differentials
        const pointsAdjustment = newPayout - oldPayout;
        let successAdjustment = 0;
        if (oldStatus === 'won' && newStatus !== 'won') {
          successAdjustment = -1;
        } else if (oldStatus !== 'won' && newStatus === 'won') {
          successAdjustment = 1;
        }

        // Update local bet state
        setBets(prev => prev.map(b => b.id === bet.id ? { ...b, status: newStatus as any, payout: newPayout } : b));

        // Sync user profile points and success status
        const targetUserLocal = allUsers.find(u => u.uid === bet.userId);
        let userCurrentPoints = 0;
        let userCurrentSuccess = 0;

        if (targetUserLocal) {
          userCurrentPoints = targetUserLocal.points || 0;
          userCurrentSuccess = targetUserLocal.successCount || 0;
        } else if (bet.userId === (userProfile?.uid || '')) {
          userCurrentPoints = userProfile?.points || 0;
          userCurrentSuccess = userProfile?.successCount || 0;
        } else {
          // Sync directly from database
          if (firebaseAvailable && db) {
            try {
              const userDocRef = doc(db, "users", bet.userId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const uData = userDocSnap.data();
                userCurrentPoints = uData.points || 0;
                userCurrentSuccess = uData.successCount || 0;
              }
            } catch (err) {
              console.error("Error fetching target user data from Firestore:", err);
            }
          }
        }

        const nextPoints = Math.max(0, userCurrentPoints + pointsAdjustment);
        const nextSuccess = Math.max(0, userCurrentSuccess + successAdjustment);

        // Update currently logged-in user
        if (bet.userId === (userProfile?.uid || '')) {
          const nextProfile = {
            ...userProfile,
            points: nextPoints,
            successCount: nextSuccess
          };
          setUserProfile(nextProfile as any);
          localStorage.setItem('PREDICT_USER_POINTS', String(nextPoints));
          localStorage.setItem('PREDICT_USER_SUCCESS', String(nextSuccess));
        }

        // Update local list
        setAllUsers(prev => prev.map(u => u.uid === bet.userId ? { ...u, points: nextPoints, successCount: nextSuccess } : u));

        // Sync user in database
        if (firebaseAvailable && db) {
          try {
            await setDoc(doc(db, "users", bet.userId), {
              points: nextPoints,
              successCount: nextSuccess
            }, { merge: true });
          } catch (e) {
            console.error(`Error updating user points for userId ${bet.userId}:`, e);
          }
        }

        // Sync changed bet
        if (firebaseAvailable && db) {
          try {
            await updateDoc(doc(db, "bets", bet.id), {
              status: newStatus,
              payout: newPayout
            });
          } catch (err) {
            console.error(`Error updating bet status for betId ${bet.id}:`, err);
          }
        }
      }
    } else {
      // 🟢 최초 신규 결과 확정
      for (const bet of associatedBets) {
        let betStatus: 'won' | 'lost' | 'refunded' = 'lost';
        let prizeValue = 0;

        if (isRefund) {
          betStatus = 'refunded';
          prizeValue = bet.amount;
        } else {
          const isWinner = bet.option === winningOption;
          betStatus = isWinner ? 'won' : 'lost';
          prizeValue = isWinner ? Math.round(bet.amount * winningOdds) : 0;
        }

        // Update local bet state
        setBets(prev => prev.map(b => b.id === bet.id ? { ...b, status: betStatus as any, payout: prizeValue } : b));

        // Realize payout to user's wallet
        if (bet.userId === (userProfile?.uid || '')) {
          const currentPoints = userProfile?.points || 0;
          const currentSuccess = userProfile?.successCount || 0;
          const addedPoints = currentPoints + prizeValue;
          const addedSuccess = betStatus === 'won' ? currentSuccess + 1 : currentSuccess;
          
          const nextProfile = {
            ...userProfile,
            points: addedPoints,
            successCount: addedSuccess
          };
          setUserProfile(nextProfile as any);
          localStorage.setItem('PREDICT_USER_POINTS', String(addedPoints));
          localStorage.setItem('PREDICT_USER_SUCCESS', String(addedSuccess));

          if (firebaseAvailable && db && userProfile?.uid) {
            try {
              await setDoc(doc(db, "users", userProfile.uid), {
                points: addedPoints,
                successCount: addedSuccess
              }, { merge: true });
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, `users/${userProfile.uid}`);
            }
          }
        }

        // Sync specific bet changes to db
        if (firebaseAvailable && db) {
          try {
            await updateDoc(doc(db, "bets", bet.id), {
              status: betStatus,
              payout: prizeValue
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `bets/${bet.id}`);
          }
        }
      }
    }

    // Save final state of prediction card to DB
    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "predictions", predictionId), sanitizedCard);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `predictions/${predictionId}`);
      }
    }

    // Dispatch chat news
    if (isAlreadyResolved) {
      const oldWinningLabel = (oldWinningOption === 'CANCELED' || oldWinningOption === '경기취소') ? '경기취소/반환' : oldWinningOption;
      const newWinningLabel = isRefund ? '경기취소/반환' : winningOption;
      sendChatMessage(`📢 [최고관리자 판정 결과 긴급수정 고시] : "${predictionTarget.title.substring(0, 20)}..." 예측 마켓의 결과가 [${oldWinningLabel}]에서 [${newWinningLabel}]으로 정정되었습니다. 모든 관련 참가자 베팅 포인트 지급 상태가 소급 조율 완료되었습니다!`, 'system');
    } else if (isRefund) {
      const refundTypeLabel = (winningOption === 'CANCELED' || winningOption === '경기취소') ? '경기 취소/정산 반환' : '적중 특례/정산 반환';
      sendChatMessage(`📢 [최고관리자 판정 결과] : "${predictionTarget.title.substring(0, 20)}..." 예측 이벤트가 [${refundTypeLabel}] 처리되었습니다. 본 예측 마켓의 모든 오리진 베팅금(100%)이 실시간 즉시 일괄 반환(환불) 처리되었습니다!`, 'system');
    } else {
      sendChatMessage(`📢 [AI 오라클 판정 결과] : "${predictionTarget.title.substring(0, 20)}..." 예측 이벤트가 최종 판정되었습니다. 당첨 옵션은 [${winningOption}]입니다.`, 'system');
    }
    sendChatMessage(`💡 판정 근거 : ${evidence}`, 'bot_announcement');
  };

  // AI 오토 매니저가 기획한 카드를 마켓에 추가 업로드
  const handleAddPrediction = async (newCardData: any, alertOnDuplicate = false) => {
    const cleanString = (s: string) => {
      if (!s) return "";
      return s.replace(/[\[\]\s\(\)\-\_\,\.\:\'\"]/g, '').toLowerCase();
    };

    const newCleanTitle = cleanString(newCardData.title);
    const newCleanOptions = (newCardData.options || []).map((o: string) => cleanString(o)).sort().join(',');

    // Check for duplicates in open/ongoing games
    const isDuplicate = predictions.some(p => {
      if (p.status !== 'open') return false;

      const pCleanTitle = cleanString(p.title);
      const pCleanOptions = (p.options || []).map((o: string) => cleanString(o)).sort().join(',');

      // 1. Same game title (normalized)
      if (pCleanTitle && pCleanTitle === newCleanTitle) {
        return true;
      }

      // 2. Exact same options list (normalized) - represents same match/game
      if (pCleanOptions && pCleanOptions === newCleanOptions) {
        return true;
      }

      return false;
    });

    if (isDuplicate) {
      if (alertOnDuplicate) {
        alert("이미 등록된 경기입니다.");
      }
      return null;
    }

    const cardId = 'pred_' + Math.random().toString(36).substring(2, 11);
    
    // Mock user options mapped
    const initialPool: { [key: string]: number } = {};
    newCardData.options.forEach((opt: string) => {
      initialPool[opt] = 0; // Pure starting pool for accurate percentage calculation
    });
    const subPoolTotal = 0;

    const completeCard: PredictionCard = {
      id: cardId,
      title: newCardData.title,
      description: newCardData.description || '',
      category: newCardData.category || 'all',
      subCategory: newCardData.subCategory || '',
      options: newCardData.options,
      pool: initialPool,
      totalPool: subPoolTotal,
      creator: newCardData.creator || '관리자',
      status: 'open',
      winningOption: null,
      resolutionMethod: newCardData.resolutionMethod || '관리자 판정',
      endAt: newCardData.endAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sourceUrl: newCardData.sourceUrl || ''
    };

    setPredictions(prev => [completeCard, ...prev]);

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "predictions", cardId), completeCard);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `predictions/${cardId}`);
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SYSTEM_NEW_PREDICTION',
        payload: completeCard
      }));
    }

    return completeCard;
  };

  const handleDeletePrediction = async (cardId: string) => {
    setPredictions(prev => prev.filter(p => p.id !== cardId));
    if (firebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, "predictions", cardId));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `predictions/${cardId} (delete)`);
      }
    }
  };

  // Exchange Giftcon
  const handleExchangeGiftcon = async (price: number, itemName: string) => {
    if (!userProfile) return;

    if (userProfile.isBanned) {
      alert(`❌ 귀하의 계정은 현재 이용이제제(활동정지) 상태입니다. 기프티콘 리워드 교환 신청이 차단됩니다.\n사유: ${userProfile.banReason || '운영제한'}`);
      return;
    }

    const modified: UserProfile = {
      ...userProfile,
      points: userProfile.points - price,
      exchangeCount: userProfile.exchangeCount + 1
    };

    setUserProfile(modified);
    localStorage.setItem('PREDICT_USER_POINTS', String(modified.points));
    localStorage.setItem('PREDICT_USER_EXCHANGE', String(modified.exchangeCount));

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", userProfile.uid), {
          points: modified.points,
          exchangeCount: modified.exchangeCount
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}`);
      }
    }

    sendChatMessage(`🎁 [리워드 달성] : ${userProfile.nickname}님께서 열심히 모은 포인트를 사용하여 [${itemName}] 실물 기프트콘 모바일 쿠폰 교환 신청을 성공해 발권받으셨습니다! 축하드립니다!`, 'bot_announcement');
  };

  const handlePurchaseBadge = async (price: number, badgeId: string, badgeName: string): Promise<boolean> => {
    if (!userProfile) return false;
    if (userProfile.isBanned) {
      alert(`❌ 귀하의 계정은 현재 이용제제 상태입니다. 계급장 구매가 불가능합니다.`);
      return false;
    }
    if (userProfile.points < price) {
      alert("보유한 가용 포인트가 부족합니다.");
      return false;
    }

    const currentPurchased = userProfile.purchasedBadges || [];
    if (currentPurchased.includes(badgeId)) {
      alert("이미 구매 완료한 계급장입니다.");
      return false;
    }

    const newPurchased = [...currentPurchased, badgeId];
    const modified: UserProfile = {
      ...userProfile,
      points: userProfile.points - price,
      purchasedBadges: newPurchased,
      activeBadge: badgeId
    };

    setUserProfile(modified);
    localStorage.setItem('PREDICT_USER_POINTS', String(modified.points));
    localStorage.setItem('PREDICT_USER_PURCHASED_BADGES', JSON.stringify(newPurchased));
    localStorage.setItem('PREDICT_USER_ACTIVE_BADGE', badgeId);

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", userProfile.uid), {
          points: modified.points,
          purchasedBadges: newPurchased,
          activeBadge: badgeId
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}`);
      }
    }

    sendChatMessage(`🏅 [명예 계급] : ${userProfile.nickname}님께서 열심히 모은 포인트를 사용하여 [${badgeName}] 계급장 훈장을 성공적으로 영구 등극하셨습니다! 축하드립니다!`, 'bot_announcement');
    return true;
  };

  const handleEquipBadge = async (badgeId: string | null): Promise<boolean> => {
    if (!userProfile) return false;

    const modified: UserProfile = {
      ...userProfile,
      activeBadge: badgeId || undefined
    };

    setUserProfile(modified);
    if (badgeId) {
      localStorage.setItem('PREDICT_USER_ACTIVE_BADGE', badgeId);
    } else {
      localStorage.removeItem('PREDICT_USER_ACTIVE_BADGE');
    }

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", userProfile.uid), {
          activeBadge: badgeId
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.uid}`);
      }
    }
    return true;
  };

  // Set Profile or rename nick
  const handleTriggerRename = () => {
    // Check limit first
    const isAdmin = userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자';
    if (!isAdmin && userProfile?.lastNicknameChangeAt) {
      const lastChange = new Date(userProfile.lastNicknameChangeAt);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (lastChange > oneMonthAgo) {
        addToast("닉네임변경은 1달에 한번만 가능합니다", "error");
        return;
      }
    }
    
    setInputNickname(userProfile?.nickname || '');
    setNicknameCheckStatus('idle');
    setShowNicknameModal(true);
  };

  // 회원 정보 원격 전산 관리용 함수들
  const handleUpdateUserProfile = async (uid: string, updatedFields: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updatedFields } : u));
    
    if (userProfile && userProfile.uid === uid) {
      setUserProfile(prev => prev ? { ...prev, ...updatedFields } : null);
      if (updatedFields.points !== undefined) {
        localStorage.setItem('PREDICT_USER_POINTS', String(updatedFields.points));
      }
      if (updatedFields.profileImageUrl !== undefined) {
        localStorage.setItem('PREDICT_USER_PROFILE_IMAGE', updatedFields.profileImageUrl);
      }
    }

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", uid), updatedFields, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
  };

  // 모달 연동 통합 세션 로그인 처리 함수
  const pendingDeletionsRef = React.useRef(new Set<string>());
  const [pendingDeletions, setPendingDeletions] = React.useState<Set<string>>(new Set());
  
  const updatePendingDeletions = (uid: string, operation: 'add' | 'delete') => {
    if (operation === 'add') {
      pendingDeletionsRef.current.add(uid);
      setPendingDeletions(prev => new Set(prev).add(uid));
    } else {
      pendingDeletionsRef.current.delete(uid);
      setPendingDeletions(prev => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }
  };

  const handleDeleteUserProfile = async (uid: string) => {
    console.log("handleDeleteUserProfile called for:", uid);
    
    // Check if the user exists
    const userToDelete = allUsers.find(u => u.uid === uid);
    console.log("Found user to delete:", userToDelete);

    // Mark as pending deletion to filter out of list even if onSnapshot returns it
    updatePendingDeletions(uid, 'add');
    setAllUsers(prev => prev.filter(u => u.uid !== uid));
    
    if (userProfile && userProfile.uid === uid) {
        const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('PREDICT_'));
        keysToRemove.forEach(key => localStorage.removeItem(key));
        setUserProfile(null);
        window.location.reload();
    }

    if (firebaseAvailable && db) {
      try {
        console.log("Attempting to delete Firestore doc for:", uid);
        await deleteDoc(doc(db, "users", uid));
        console.log("Firestore delete successful for:", uid);
      } catch (err) {
        console.error("Firestore delete failed for:", uid, err);
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
      } finally {
        // Clear pending status after a delay
        setTimeout(() => {
          updatePendingDeletions(uid, 'delete');
        }, 5000);
      }
    } else {
      console.warn("Firebase not available for deletion");
    }
  };


  // 모달 연동 통합 세션 로그인 처리 함수
  const handleModalLoginSuccess = async (emailOrId: string, password?: string, customNickname?: string, customUid?: string) => {
    const cleanId = emailOrId.trim();
    const cleanPw = password ? password.trim() : '1234';

    if (!cleanId) return;

    // Search matches in allUsers first
    const searchUid = customUid || cleanId;
    let matchedUser = allUsers.find(u => 
      u.uid === searchUid ||
      u.loginId === cleanId || 
      u.nickname === cleanId
    );

    // If still not matched, perform a direct Firestore query to prevent overwrite race conditions
    if (!matchedUser && firebaseAvailable && db) {
      try {
        const userDoc = await getDoc(doc(db, "users", searchUid));
        if (userDoc.exists()) {
          matchedUser = userDoc.data() as UserProfile;
        } else {
          // Check by loginId field to find existing linked accounts
          const q = query(collection(db, "users"), where("loginId", "==", cleanId));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            matchedUser = querySnap.docs[0].data() as UserProfile;
          }
        }
      } catch (err) {
        console.error("Error direct query user info on handleModalLoginSuccess:", err);
      }
    }
    
    if (matchedUser) {
      // Normalize uid property on matchedUser
      const finalUid = matchedUser.uid || searchUid;
      const normalizedUser = { ...matchedUser, uid: finalUid };

      if (normalizedUser.isBanned) {
        alert(`❌ 해당 계정은 이용이제제(비활성화) 처리된 상태입니다.\n사유: ${normalizedUser.banReason || '운영규칙 위반'}`);
        return;
      }
      if (cleanPw && cleanPw !== 'social_secure_bypass' && normalizedUser.password && normalizedUser.password !== cleanPw) {
        alert("❌ 기입한 비밀번호가 올바르지 않습니다.");
        return;
      }

      // Successful matching!
      // If user exists, trust their existing nickname in DB, do not override with social provider nickname
      const finalNickname = normalizedUser.nickname;
      
      let updatedUser = { ...normalizedUser };
      // Keep existing nickname, no update needed here unless explicitly requested (which it isn't here)

      localStorage.setItem('PREDICT_USER_UID', updatedUser.uid);
      localStorage.setItem('PREDICT_USER_NICKNAME', updatedUser.nickname);
      localStorage.setItem('PREDICT_USER_POINTS', String(updatedUser.points));
      localStorage.setItem('PREDICT_USER_PREDICTS', String(updatedUser.predictsCount));
      localStorage.setItem('PREDICT_USER_SUCCESS', String(updatedUser.successCount));
      localStorage.setItem('PREDICT_USER_EXCHANGE', String(updatedUser.exchangeCount));

      setUserProfile(updatedUser);
      alert(`🎉 웰컴백! [${updatedUser.nickname}]님, 원격 보안 로그인 연동이 완료되었습니다.`);
    } else {
      // Create guest-like credentialed account for backward compatibility
      const generatedUid = customUid || 'usr_' + Math.random().toString(36).substring(2, 11);
      const tempNickname = customNickname || (cleanId.includes('@') ? cleanId.split('@')[0] : cleanId);
      const initialProfile: UserProfile = {
        uid: generatedUid,
        loginId: cleanId,
        password: cleanPw,
        nickname: tempNickname.substring(0, 15),
        points: 2000, // Google login / special connect promo bonus
        predictsCount: 0,
        successCount: 0,
        exchangeCount: 0,
        isBanned: false,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('PREDICT_USER_UID', generatedUid);
      localStorage.setItem('PREDICT_USER_NICKNAME', initialProfile.nickname);
      localStorage.setItem('PREDICT_USER_POINTS', '2000');
      localStorage.setItem('PREDICT_USER_PREDICTS', '0');
      localStorage.setItem('PREDICT_USER_SUCCESS', '0');
      localStorage.setItem('PREDICT_USER_EXCHANGE', '0');

      setUserProfile(initialProfile);
      setAllUsers(prev => [...prev, initialProfile]);

      if (firebaseAvailable && db) {
        try {
          await setDoc(doc(db, "users", generatedUid), initialProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${generatedUid}`);
        }
      }
      alert(`👤 신규 계정 [${initialProfile.nickname}]이 성공적으로 생성 및 구글 계정과 안전 연동되었습니다!\n(기존 회원 혜택 2,000 P가 즉시 지급되었습니다.)`);
    }
  };

  // 실시간 기밀 보안 로그인 인증 전산 함수
  const handleRealLogin = async () => {
    const cleanId = loginId.trim();
    const cleanPw = loginPw.trim();

    if (!cleanId) {
      alert("로그인하실 회원아이디를 먼저 텍스트창에 기입해주세요!");
      return;
    }

    // Try finding in allUsers
    let matchedUser = allUsers.find(u => u.loginId === cleanId || u.nickname === cleanId);

    // Dynamic direct Firestore check as a reliable fallback to prevent asynchronous loading races
    if (!matchedUser && firebaseAvailable && db) {
      try {
        const userDoc = await getDoc(doc(db, "users", cleanId));
        if (userDoc.exists()) {
          matchedUser = userDoc.data() as UserProfile;
        } else {
          // Query by loginId to find correct profile
          const q = query(collection(db, "users"), where("loginId", "==", cleanId));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            matchedUser = querySnap.docs[0].data() as UserProfile;
          } else {
            // Check by nickname as login identifier
            const qNick = query(collection(db, "users"), where("nickname", "==", cleanId));
            const querySnapNick = await getDocs(qNick);
            if (!querySnapNick.empty) {
              matchedUser = querySnapNick.docs[0].data() as UserProfile;
            }
          }
        }
      } catch (err) {
        console.error("Error verifying credentials in handleRealLogin:", err);
      }
    }
    
    if (matchedUser) {
      const normalizedUser = { ...matchedUser, uid: matchedUser.uid || cleanId };
      if (normalizedUser.isBanned) {
        alert(`❌ 해당 계정은 이용이제제(비활성화) 처리된 상태입니다.\n사유: ${normalizedUser.banReason || '운영규칙 위반'}`);
        return;
      }
      if (cleanPw && normalizedUser.password && normalizedUser.password !== cleanPw) {
        alert("❌ 기입한 비밀번호가 올바르지 않습니다.");
        return;
      }

      // Successful matching!
      localStorage.setItem('PREDICT_USER_UID', normalizedUser.uid);
      localStorage.setItem('PREDICT_USER_NICKNAME', normalizedUser.nickname);
      localStorage.setItem('PREDICT_USER_POINTS', String(normalizedUser.points));
      localStorage.setItem('PREDICT_USER_PREDICTS', String(normalizedUser.predictsCount));
      localStorage.setItem('PREDICT_USER_SUCCESS', String(normalizedUser.successCount));
      localStorage.setItem('PREDICT_USER_EXCHANGE', String(normalizedUser.exchangeCount));

      setUserProfile(normalizedUser);
      setLoginId('');
      setLoginPw('');
      alert(`🎉 웰컴백! [${normalizedUser.nickname}]님, 원격 보안 로그인 연동이 완료되었습니다.`);
    } else {
      // Create guest-like credentialed account for backward compatibility if password exists or no conflict
      const generatedUid = 'usr_' + Math.random().toString(36).substring(2, 11);
      const initialProfile: UserProfile = {
        uid: generatedUid,
        loginId: cleanId,
        password: cleanPw || '1234', // default password if empty
        nickname: cleanId.substring(0, 10),
        points: 1000,
        predictsCount: 0,
        successCount: 0,
        exchangeCount: 0,
        isBanned: false,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('PREDICT_USER_UID', generatedUid);
      localStorage.setItem('PREDICT_USER_NICKNAME', initialProfile.nickname);
      localStorage.setItem('PREDICT_USER_POINTS', '1000');
      localStorage.setItem('PREDICT_USER_PREDICTS', '0');
      localStorage.setItem('PREDICT_USER_SUCCESS', '0');
      localStorage.setItem('PREDICT_USER_EXCHANGE', '0');

      setUserProfile(initialProfile);
      setAllUsers(prev => {
        const next = prev.some(u => u.uid === initialProfile.uid) ? prev : [...prev, initialProfile];
        localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(next));
        return next;
      });

      if (firebaseAvailable && db) {
        try {
          await setDoc(doc(db, "users", generatedUid), initialProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${generatedUid}`);
        }
      }
      setLoginId('');
      setLoginPw('');
      alert(`👤 신규 가명 계정 [${initialProfile.nickname}]이 생성 및 자동 로그인되었습니다!\n가입 기념 보너스 1,000P 가 지급되었습니다.\n(초기 비밀번호: ${cleanPw || '1234'})`);
    }
  };

  React.useEffect(() => {
    // Direct redirect OAuth login callback helper (e.g. for mobile)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('kakao_login_success') === 'true') {
      const email = searchParams.get('email') || '';
      const nickname = searchParams.get('nickname') || '';
      const id = searchParams.get('id') || '';
      const profileImage = searchParams.get('profileImage') || '';
      
      if (email && id) {
        console.log("🧩 Direct redirection Kakao authentication parsed:", { email, nickname, id });
        
        // Handle login success directly
        handleModalLoginSuccess(email, 'social_secure_bypass', nickname, `kakao_${id}`);
        
        // Clean URL parameters cleanly without refreshing the page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [allUsers]);

  // 회원가입 성공 처리 함수
  const handleRegisterSuccess = async (id: string, password: string, nickname: string) => {
    const generatedUid = 'usr_' + Math.random().toString(36).substring(2, 11);

    const initialProfile: UserProfile = {
      uid: generatedUid,
      loginId: id,
      password: password,
      nickname: nickname,
      points: 1000,
      predictsCount: 0,
      successCount: 0,
      exchangeCount: 0,
      isBanned: false,
      banReason: '',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('PREDICT_USER_UID', generatedUid);
    localStorage.setItem('PREDICT_USER_NICKNAME', nickname);
    localStorage.setItem('PREDICT_USER_POINTS', '1000');
    localStorage.setItem('PREDICT_USER_PREDICTS', '0');
    localStorage.setItem('PREDICT_USER_SUCCESS', '0');
    localStorage.setItem('PREDICT_USER_EXCHANGE', '0');

    setUserProfile(initialProfile);
    setAllUsers(prev => {
      if (prev.some(u => u.uid === generatedUid)) return prev;
      const next = [...prev, initialProfile];
      localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(next));
      return next;
    });

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "users", generatedUid), initialProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${generatedUid}`);
      }
    }

    sendChatMessage(`🎉 신규회원 [${nickname}](아이디: ${id})님이 회원가입을 무사히 마치고 가입 보너스 1,000 P가 즉시 적립되어 입장하셨습니다! 🥳`, 'system');
    alert(`회원가입이 완료되었습니다!\n방금 생성하신 ${nickname} 계정으로 자동 연동 로그인이 완료되었으며, 신규 보상 1,000 P가 성공적으로 발급되었습니다.`);
    setCurrentTab('predict');
  };

  // Filter Prediction lists
  const now = new Date();
  
  // Define Filter Prediction lists
  const filteredPredictions = predictions.filter(card => {
    if (selectedCategory === 'all') return true;
    return card.category === selectedCategory || card.subCategory === selectedCategory;
  });

  const displayPredictions = filteredPredictions.filter(card => {
    if (card.status === 'resolved') return false;
    if (card.id.toUpperCase().startsWith('CHILD_') || card.title.toUpperCase().startsWith('CHILD_')) return false;
    const isClosed = new Date(card.endAt) <= now || card.status === 'closed';
    if (mainViewFilter === 'ongoing') return !isClosed;
    if (mainViewFilter === 'closed') return isClosed;
    if (mainViewFilter === 'bookmarked') return homeBookmarkedIds.includes(card.id);
    return true;
  }).sort((a, b) => {
    const likesA = likes[a.id] || 0;
    const likesB = likes[b.id] || 0;
    return likesB - likesA;
  });

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && homeDisplayedCount < displayPredictions.length) {
          setHomeDisplayedCount(prev => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    if (homeObserverTarget.current) {
      observer.observe(homeObserverTarget.current);
    }

    return () => {
      if (homeObserverTarget.current) {
        observer.unobserve(homeObserverTarget.current);
      }
    };
  }, [homeDisplayedCount, displayPredictions.length]);

  const ongoingCount = filteredPredictions.filter(c => c.status !== 'resolved' && new Date(c.endAt) > now && c.status !== 'closed').length;
  const closedCount = filteredPredictions.filter(c => c.status !== 'resolved' && (new Date(c.endAt) <= now || c.status === 'closed')).length;
  const bookmarkedCount = homeBookmarkedIds.filter(id => {
    const card = predictions.find(p => p.id === id);
    return card && card.status !== 'resolved';
  }).length;

  const renderDesktopLoginOrProfileBox = () => {
    return (
      <div className="bg-[#1c1c1e] border border-[#2c2d33] rounded-xl p-4 text-xs font-sans shadow-lg">
        {userProfile ? (
          // 로그인 완료 시 정보 카드
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
              <span className="text-[#22c55e] font-bold">🟢 연동중인 회원 정보</span>
              {userProfile.loginId === 'sinpotnf@gmail.com' || userProfile.nickname === '최고관리자' || userProfile.nickname === '운영자' ? (
                <span className="bg-red-500/10 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans border border-red-900/30">
                  운영자
                </span>
              ) : (
                <span className="bg-neutral-800 text-neutral-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans border border-neutral-700/30">
                  일반회원
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-3 bg-[#111112] rounded-xl border border-neutral-800/40 space-y-2">
              <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center hover:border-amber-400 transition-colors cursor-pointer shadow-lg animate-fade-in">
                {userProfile.profileImageUrl ? (
                  <img 
                    src={userProfile.profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl select-none">👤</span>
                )}
                
                {/* Hover Overlay */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200">
                  <span className="text-[10px] text-white font-extrabold text-center leading-tight">변경 📷</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProfileImageUpload(file);
                      }
                    }}
                  />
                </label>
              </div>
              <label className="text-[10px] text-neutral-400 hover:text-amber-400 font-medium cursor-pointer transition-colors flex items-center gap-1">
                <span>프로필 사진 변경</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleProfileImageUpload(file);
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">아이디/닉네임:</span>
                <span className="text-white font-extrabold hover:underline cursor-pointer" onClick={handleTriggerRename}>
                  {userProfile.nickname} (수정 ⚙️)
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">현재 보유 포인트:</span>
                <span className="text-amber-400 font-extrabold">
                  {userProfile.points?.toLocaleString() || 0} P
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => setIsQuestModalOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] hover:scale-[1.02] text-black py-2 rounded text-xs font-extrabold transition-all duration-200 cursor-pointer text-center block shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              >
                일일퀘스트 / 포인트샵
              </button>
              <button
                onClick={() => {
                  const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('PREDICT_'));
                  keysToRemove.forEach(key => localStorage.removeItem(key));
                  window.location.reload();
                }}
                className="w-full bg-[#cc2929] hover:bg-[#b82222] active:scale-[0.98] hover:scale-[1.02] text-white py-2 rounded text-xs font-extrabold transition-all duration-200 cursor-pointer text-center block"
              >
                로그아웃 (계정 연결 해제)
              </button>
            </div>
          </div>
        ) : (
          // 로그 아웃 상태
          <div className="flex flex-col space-y-3.5">
            <p className="text-gray-400 text-xs leading-relaxed font-semibold">
              초이스 코리아에 안전하게 로그인하여 실시간 예측과 커뮤니티 활동을 마음껏 즐겨보세요!
            </p>
            
            {/* 로그인 파워버튼 - 모달 팝업 트리거 */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-gradient-to-r from-[#e11d48] to-[#b91c1c] hover:brightness-110 active:scale-[0.99] text-white font-bold py-3.5 flex items-center justify-center space-x-2 shadow-sm transition-all text-[14px] cursor-pointer rounded-2xl"
            >
              <Power className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
              <span>초이스 코리아 로그인</span>
            </button>

            {/* 하단 유틸 링크 */}
            <div className="flex items-center justify-between px-2 pt-2 text-[13px] text-white font-bold font-sans">
              <button 
                type="button" 
                onClick={() => setIsLoginModalOpen(true)} 
                className="flex items-center space-x-2 hover:text-gray-300 hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <KeyRound className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                <span>비밀번호찾기</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setCurrentTab('register');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="flex items-center space-x-2 hover:text-gray-300 hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <LogIn className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                <span>회원가입</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileLoginOrProfileBox = () => {
    return (
      <div className="bg-[#1c1c1e] border border-[#2c2d33] rounded-2xl p-4.5 text-xs font-sans shadow-lg">
        {userProfile ? (
          // 로그인 완료 시 정보 카드
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#2b2b2b]/60 pb-2.5">
              <span className="text-[#22c55e] text-[12px] font-extrabold flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                연동중인 회원 정보
              </span>
              {userProfile.loginId === 'sinpotnf@gmail.com' || userProfile.nickname === '최고관리자' || userProfile.nickname === '운영자' ? (
                <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase font-sans border border-red-900/30">
                  운영자
                </span>
              ) : (
                <span className="bg-neutral-800 text-neutral-400 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase font-sans border border-neutral-700/30">
                  일반회원
                </span>
              )}
            </div>

            <div className="grid grid-cols-12 gap-4 items-center bg-[#111112]/90 p-4 rounded-2xl border border-neutral-800/60 shadow-inner">
              <div className="col-span-4 flex flex-col items-center justify-center space-y-2">
                <div className="relative group w-18 h-18 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center hover:border-amber-400 transition-colors cursor-pointer shadow-lg">
                  {userProfile.profileImageUrl ? (
                    <img 
                      src={userProfile.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl select-none">👤</span>
                  )}
                  
                  {/* Hover Overlay */}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200">
                    <span className="text-[10px] text-white font-extrabold text-center leading-tight">변경 📷</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProfileImageUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <label className="text-[10px] text-neutral-400 hover:text-amber-400 font-bold cursor-pointer transition-colors flex items-center gap-1">
                  <span>프로필 사진 변경</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProfileImageUpload(file);
                      }
                    }}
                  />
                </label>
              </div>
              
              <div className="col-span-8 space-y-2 text-left px-2">
                <div className="flex justify-between items-center text-[12px] gap-2">
                  <span className="text-gray-400 font-medium shrink-0">닉네임</span>
                  <button 
                    className="text-white font-black hover:underline cursor-pointer flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 truncate max-w-[120px]" 
                    onClick={handleTriggerRename}
                  >
                    <span className="truncate">{userProfile.nickname}</span> 
                    <span className="text-neutral-400 text-[10px] shrink-0">⚙️</span>
                  </button>
                </div>
                <div className="flex justify-between items-center text-[12px] gap-2">
                  <span className="text-gray-400 font-medium shrink-0">포인트</span>
                  <span className="text-amber-400 font-extrabold bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-450/10 whitespace-nowrap">
                    {userProfile.points?.toLocaleString() || 0} P
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setIsQuestModalOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] hover:scale-[1.02] text-black py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center block shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              >
                🏆 일일퀘스트 / 포인트샵
              </button>
              <button
                onClick={() => {
                  const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('PREDICT_'));
                  keysToRemove.forEach(key => localStorage.removeItem(key));
                  window.location.reload();
                }}
                className="w-full bg-[#cc2929] hover:bg-[#b82222] active:scale-[0.98] hover:scale-[1.02] text-white py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center block"
              >
                🔑 로그아웃 (연결해제)
              </button>
            </div>
          </div>
        ) : (
          // 로그 아웃 상태
          <div className="flex flex-col space-y-3.5">
            <p className="text-gray-400 text-xs leading-relaxed font-bold">
              초이스 코리아에 안전하게 로그인하여 실시간 예측과 커뮤니티 활동을 마음껏 즐겨보세요!
            </p>
            
            {/* 로그인 파워버튼 - 모달 팝업 트리거 */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-gradient-to-r from-[#e11d48] to-[#b91c1c] hover:brightness-110 active:scale-[0.99] text-white font-extrabold py-3.5 flex items-center justify-center space-x-2 shadow-sm transition-all text-[14px] cursor-pointer rounded-2xl"
            >
              <Power className="h-4.5 w-4.5 text-white animate-pulse" strokeWidth={2.5} />
              <span>초이스 코리아 로그인</span>
            </button>

            {/* 하단 유틸 링크 (비밀번호찾기, 회원가입) */}
            <div className="flex items-center justify-between px-2 pt-1 text-[13px] text-neutral-350 font-extrabold font-sans">
              <button 
                type="button" 
                onClick={() => setIsLoginModalOpen(true)} 
                className="flex items-center space-x-1.5 hover:text-white hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <KeyRound className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>비밀번호찾기</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setCurrentTab('register');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="flex items-center space-x-1.5 hover:text-white hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>회원가입</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light-theme bg-[#f8f9fa] text-neutral-800' : 'bg-[#050608] text-gray-200'} font-sans selection:bg-rose-600 selection:text-white transition-all duration-300`}>
      
      {/* 글로벌 내비게이션 바 */}
      <Header 
        userProfile={userProfile} 
        onSetNickname={handleTriggerRename}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        dynamicMenus={dynamicMenus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />



      {/* 메인 레이아웃 본문 (그리드 분할: 좌측 사이드바 / 중앙 메인 / 우측 AD) */}
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {/* 모바일 환경에서만 최상단에 노출되는 회원정보/로그인 영역 */}
        {!currentTab.startsWith('community') && (
          <div className="block lg:hidden mb-4">
            {renderMobileLoginOrProfileBox()}
          </div>
        )}

        {currentTab === 'predict' && selectedCategory !== 'all' ? (
          <PoliticsPortal 
            category={selectedCategory}
            predictions={predictions}
            allBets={allBets}
            globalSubcategories={globalSubcategories}
            setGlobalSubcategories={setGlobalSubcategories}
            addToast={addToast}
            onSelectCardForBet={(card, option) => {
              const hasAlreadyPredicted = allBets.some(
                b => b.userId === userProfile?.uid && b.predictionId === card.id
              );
              if (hasAlreadyPredicted) {
                addToast("이미 예측을 참여하였습니다", 'info');
                return;
              }
              setSelectedCardForBet(card);
              setBetOption(option);
            }}
            onOpenComments={(card) => setSelectedCommentCard(card)}
            userProfile={userProfile}
            participantCounts={participantCounts}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onDeletePrediction={handleDeletePrediction}
            subcategoryLogos={subcategoryLogos}
            predictionCommentCounts={predictionCommentCounts}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          
          {/* [좌측 사이드바] - 로그인 창, 광고배너, 실시간 채팅방 */}
          <div className={`col-span-1 space-y-4 order-2 lg:order-none ${currentTab.startsWith('community') ? 'hidden lg:block' : ''}`}>
            
            {/* 1. 로그인 박스 (로그인 폼 / 연동 프로필) - 데스크톱에서만 노출 */}
            <div className="hidden lg:block">
              {renderDesktopLoginOrProfileBox()}
            </div>

            {/* 2. AD 광고 제휴 문의 배너 */}
            <div className={`border border-dashed rounded-md p-5 text-center flex flex-col items-center justify-center min-h-[110px] transition-all duration-300 relative select-none ${
              theme === 'light' 
                ? 'bg-gray-50/50 border-gray-300 hover:bg-gray-50' 
                : 'bg-[#0f0f11] border-neutral-800 hover:bg-[#131317]'
            }`}>
              <div className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded mb-2 ${
                theme === 'light' ? 'bg-gray-200/60 text-gray-400' : 'bg-neutral-900 text-neutral-500'
              }`}>
                AD
              </div>
              <span className={`font-black text-xs block tracking-tight ${theme === 'light' ? 'text-gray-500' : 'text-neutral-400'}`}>
                AD 광고 제휴 문의
              </span>
              <p className={`text-[10px] mt-1 font-medium ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                windos086@naver.com
              </p>
            </div>

            {/* 3. 라이브 채팅 위젯 - 모바일 환경에서는 숨김 */}
            <div id="live-chat-section" className="hidden lg:block">
              <LiveChat 
                chatMessages={chats}
                userProfile={userProfile}
                onSendMessage={(text) => sendChatMessage(text, 'chat')}
                allUsers={allUsers}
                onUpdateUserProfile={handleUpdateUserProfile}
                onSendSystemMessage={sendChatMessage}
                activeUserCount={activeUserCount}
              />
            </div>
            
            {/* 4. 회원 랭킹 TOP 10 */}
            <div className={currentTab.startsWith('community') ? 'hidden lg:block' : ''}>
              <UserRanking allUsers={allUsers} />
            </div>



          </div>

          {/* [우측 콘텐츠 영역] - 대형 축구 슬로건 배너, 게시판 요약, 스포츠 하이라이트, 배팅 목록 */}
          <div className="col-span-1 lg:col-span-3 space-y-4 order-1 lg:order-none">
            
            {currentTab === 'predict' && (
              <div className="space-y-4">
                
                {/* 1. Choice Korea slogan banner with Waving Taegeukgi Background */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden group select-none shadow-sm flex flex-col justify-between min-h-[225px]">
                  
                  {/* Waving High-Definition Taegeukgi Background */}
                  <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.25] flex items-center justify-center md:justify-end ml-[10%] md:ml-0 md:pr-[5%]">
                    <div 
                      className="w-[150%] md:w-[65%] h-[150%] bg-[url('https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_South_Korea.svg')] bg-contain bg-center bg-no-repeat opacity-100"
                      style={{
                        animation: 'wave-flag 5s ease-in-out infinite alternate',
                        transformOrigin: 'center center',
                        filter: 'brightness(1.1) contrast(1.2) saturate(2.0)'
                      }}
                    />
                    <div 
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.0) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'wave-shadows 5s ease-in-out infinite alternate',
                      }}
                    />
                  </div>

                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes wave-flag {
                      0% { transform: perspective(800px) rotateY(-12deg) rotateX(3deg) scale(1.0) skewY(2deg); }
                      100% { transform: perspective(800px) rotateY(12deg) rotateX(-3deg) scale(1.1) skewY(-2deg); }
                    }
                    @keyframes wave-shadows {
                      0% { background-position: 0% 0%; }
                      100% { background-position: 100% 0%; }
                    }
                    @keyframes marquee-up {
                      0% { transform: translateY(0); }
                      100% { transform: translateY(-50%); }
                    }
                    .mask-fade-vertical {
                      mask-image: linear-gradient(to bottom, transparent, white 15%, white 85%, transparent);
                      -webkit-mask-image: linear-gradient(to bottom, transparent, white 15%, white 85%, transparent);
                    }
                  `}} />
                  
                  {/* Glowing brand-colored background decor */}
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#d11822]/5 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none z-0" />
                  
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 text-center md:text-left z-10 p-2">
                    <ChoiceKoreaIcon className="h-14 w-14 transition-transform group-hover:scale-105 duration-500 shrink-0 filter drop-shadow-[0_2px_15px_rgba(255,255,255,0.8)]" />
                    <div className="space-y-1 -ml-1 md:-ml-2">
                      <div className="flex items-baseline justify-center md:justify-start">
                        <span className="text-gray-900 font-sans font-black text-3xl tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">CHOICE</span>
                        <span className="text-[#d11822] font-sans font-black text-3xl tracking-tight ml-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">KOREA</span>
                      </div>
                      <span className="text-gray-700 text-[10.5px] font-bold tracking-wider block mt-1 drop-shadow-[0_0_5px_rgba(255,255,255,1)]">국내 공식 유저참여형 예측시장 커뮤니티</span>
                    </div>
                  </div>

                  {/* Real-time popular predictions sliding marquee underneath logo */}
                  <div className="w-full overflow-hidden mt-2 pt-1 z-10 select-none">
                    <div className="flex items-center space-x-1.5 mb-2 px-1 text-[11px] font-extrabold text-gray-500">
                      <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-red-600"></span>
                      <span>실시간 인기 예측 라이브</span>
                    </div>

                    {duplicatedPopularGames.length > 0 ? (
                      <div className="relative w-full h-[96px] overflow-hidden mask-fade-vertical">
                        <div 
                          className="flex flex-col gap-2 w-full py-1"
                          style={{
                            animation: 'marquee-up 20s linear infinite',
                          }}
                        >
                          {duplicatedPopularGames.map((card, idx) => {
                            const logo = subcategoryLogos[card.subCategory || ''];
                            const itemLikes = likes[card.id] || 0;
                            return (
                              <div
                                key={`${card.id}-marquee-${idx}`}
                                onClick={() => setSelectedCardForBet(card)}
                                className="flex items-center space-x-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 hover:border-red-400 rounded-lg px-4 py-1.5 cursor-pointer transition-all duration-300 w-full shadow-sm select-none shrink-0 h-[42px]"
                              >
                                {/* Thumbnail Logo */}
                                <div className="w-7 h-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                                  {logo ? (
                                    <img 
                                      src={logo} 
                                      alt={card.subCategory} 
                                      className="w-full h-full object-contain p-0.5" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span className="text-xs">🏆</span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                  <div className="flex items-center space-x-2 truncate">
                                    <span className="text-[9.5px] text-[#0ea5e9] font-black uppercase tracking-wide px-1.5 py-0.5 bg-sky-50 rounded shrink-0">
                                      {stripChildTag(getSubcategoryName(card.subCategory, card.category))}
                                    </span>
                                    <span className="text-[11.5px] text-gray-700 font-bold tracking-tight truncate">
                                      {stripChildTag(card.title)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                                    ❤️ {itemLikes}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-gray-400">
                        현재 활성화된 실시간 예측 게임이 없습니다.
                      </div>
                    )}
                  </div>

                </div>

                {/* 2. Double Column Bullet Boards (최근 등록글 + 탭 게시판) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                  
                  {/* Left Column: 최근 등록글 */}
                  <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-md p-4">
                    <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2 mb-3">
                      <span className="text-white font-extrabold">최근 등록글</span>
                      <span className="text-gray-500 text-[10px] cursor-pointer hover:text-white select-none" onClick={() => setCurrentTab('community')}>더보기 +</span>
                    </div>

                    <div className="space-y-2.5">
                      {posts.slice(0, 4).map((post) => (
                        <div 
                          key={post.id} 
                          className="flex items-center justify-between hover:text-white cursor-pointer transition-colors group"
                          onClick={() => {
                            setSelectedCommunityPostId(post.id);
                            setCurrentTab('community');
                          }}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                            {post.tag && <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag}</span>}
                            <span className="text-gray-300 group-hover:underline truncate">{post.title}</span>
                          </div>
                          <span className="text-[#ff9033] font-mono shrink-0">{new Date(post.timestamp || post.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Tabbed Summary Board */}
                  <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-md p-4 flex flex-col justify-between">
                    
                    {/* Tabs row matching screenshot exactly */}
                    <div className="flex items-center justify-between border-b border-[#2b2b2b] text-[12.5px] md:text-[14px] font-extrabold text-gray-400">
                      
                      <button 
                        onClick={() => setRightBoardTab('notice')} 
                        className={`pb-1.5 px-1.5 md:px-2.5 select-none whitespace-nowrap transition-all ${rightBoardTab === 'notice' ? 'text-white border-b-2 border-[#22c55e]' : 'hover:text-gray-300'}`}
                      >
                        공지사항
                      </button>
                      
                      <span className="mx-0.5 text-gray-800 font-normal select-none">|</span>
                      
                      <button 
                        onClick={() => setRightBoardTab('event')} 
                        className={`pb-1.5 px-1.5 md:px-2.5 select-none whitespace-nowrap transition-all ${rightBoardTab === 'event' ? 'text-white border-b-2 border-[#22c55e]' : 'hover:text-gray-300'}`}
                      >
                        이벤트
                      </button>
                      
                      <span className="mx-0.5 text-gray-800 font-normal select-none">|</span>
                      
                      <button 
                        onClick={() => setRightBoardTab('free_board')} 
                        className={`pb-1.5 px-1.5 md:px-2.5 select-none whitespace-nowrap transition-all ${rightBoardTab === 'free_board' ? 'text-white border-b-2 border-[#22c55e]' : 'hover:text-gray-300'}`}
                      >
                        자유게시판
                      </button>
                      
                      <span className="mx-0.5 text-gray-800 font-normal select-none">|</span>
                      
                      <button 
                        onClick={() => setRightBoardTab('humor_board')} 
                        className={`pb-1.5 px-1.5 md:px-2.5 select-none whitespace-nowrap transition-all ${rightBoardTab === 'humor_board' ? 'text-[#22c55e] border-b-2 border-[#22c55e]' : 'hover:text-white'}`}
                      >
                        유머게시판
                      </button>

                    </div>

                    {/* Tab values listing */}
                    <div className="space-y-2.5 mt-3 flex-1 pt-5 pb-5 font-medium">
                      {rightBoardTab === 'notice' ? (
                        <>
                          {postsNotice.filter(p => p.isRecommended).slice(0, 4).map((post, index) => (
                            <div 
                              key={post.id} 
                              className="flex items-center justify-between hover:text-white cursor-pointer transition-colors group"
                              style={index === 0 ? { paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px', marginLeft: '0px', marginRight: '0px', marginTop: '-25px' } : undefined}
                              onClick={() => {
                                setSelectedCommunityPostId(post.id);
                                setCurrentTab('community_notice');
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                {post.tag && <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag}</span>}
                                <span className="text-gray-300 group-hover:underline truncate">{post.title}</span>
                              </div>
                              <span className="text-[#ff9033] font-mono shrink-0 font-bold">{new Date(post.timestamp || post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '-').replace('.', '')}</span>
                            </div>
                          ))}
                          {postsNotice.filter(p => p.isRecommended).length === 0 && (
                             <div className="text-gray-500 text-sm text-center pt-4">등록된 공지사항이 없습니다.</div>
                          )}
                        </>
                      ) : rightBoardTab === 'event' ? (
                        <>
                          {postsNotice.filter(p => p.isNotice).slice(0, 4).map((post, index) => (
                            <div 
                              key={post.id} 
                              className="flex items-center justify-between hover:text-white cursor-pointer transition-colors group"
                              style={index === 0 ? { paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px', marginLeft: '0px', marginRight: '0px', marginTop: '-25px' } : undefined}
                              onClick={() => {
                                setSelectedCommunityPostId(post.id);
                                setCurrentTab('community_notice');
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                {post.tag && <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag}</span>}
                                <span className="text-gray-300 group-hover:underline truncate">{post.title}</span>
                              </div>
                              <span className="text-[#ff9033] font-mono shrink-0 font-bold">{new Date(post.timestamp || post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '-').replace('.', '')}</span>
                            </div>
                          ))}
                          {postsNotice.filter(p => p.isNotice).length === 0 && (
                             <div className="text-gray-500 text-sm text-center pt-4">등록된 이벤트가 없습니다.</div>
                          )}
                        </>
                      ) : rightBoardTab === 'free_board' ? (
                        <>
                          {posts.slice(0, 4).map((post, index) => (
                            <div 
                              key={post.id} 
                              className="flex items-center justify-between hover:text-white cursor-pointer transition-colors group"
                              style={index === 0 ? { paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px', marginLeft: '0px', marginRight: '0px', marginTop: '-25px' } : undefined}
                              onClick={() => {
                                setSelectedCommunityPostId(post.id);
                                setCurrentTab('community');
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                {post.tag && <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag}</span>}
                                <span className="text-gray-300 group-hover:underline truncate">{post.title}</span>
                              </div>
                              <span className="text-[#ff9033] font-mono shrink-0 font-bold">{new Date(post.timestamp || post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '-').replace('.', '')}</span>
                            </div>
                          ))}
                          {posts.length === 0 && (
                             <div className="text-gray-500 text-sm text-center pt-4">등록된 게시물이 없습니다.</div>
                          )}
                        </>
                      ) : rightBoardTab === 'humor_board' ? (
                        <>
                          {postsHumor.slice(0, 4).map((post, index) => (
                            <div 
                              key={post.id} 
                              className="flex items-center justify-between hover:text-white cursor-pointer transition-colors group"
                              style={index === 0 ? { paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px', marginLeft: '0px', marginRight: '0px', marginTop: '-25px' } : undefined}
                              onClick={() => {
                                setSelectedCommunityPostId(post.id);
                                setCurrentTab('community_humor');
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                                {post.tag && <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag}</span>}
                                <span className="text-gray-300 group-hover:underline truncate">{post.title}</span>
                              </div>
                              <span className="text-[#ff9033] font-mono shrink-0 font-bold">{new Date(post.timestamp || post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '-').replace('.', '')}</span>
                            </div>
                          ))}
                          {postsHumor.length === 0 && (
                             <div className="text-gray-500 text-sm text-center pt-4">등록된 게시물이 없습니다.</div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 3. AD 광고 제휴 문의 메인 배너 */}
                <div id="choice-korea-ad-banner" className={`border border-dashed rounded-xl overflow-hidden p-6 md:p-8 mb-4 text-center flex flex-col items-center justify-center min-h-[140px] transition-all duration-300 relative ${
                  theme === 'light'
                    ? 'bg-gray-50/50 border-gray-300 hover:bg-gray-50 text-neutral-800'
                    : 'bg-[#0b0c0e] border-[#222222] hover:bg-[#0f1013] text-gray-400'
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-2.5 ${
                    theme === 'light'
                      ? 'bg-gray-200/60 text-gray-500 border border-gray-300/40'
                      : 'bg-neutral-900 text-neutral-500 border border-[#2e2e2e]/30'
                  }`}>
                    AD SPONSORSHIP
                  </span>
                  
                  <h3 className={`text-sm md:text-base font-black tracking-tight select-none ${
                    theme === 'light' ? 'text-neutral-600' : 'text-gray-300'
                  }`}>
                    AD 광고 제휴 문의
                  </h3>
                  <p className={`text-xs mt-1.5 font-semibold ${theme === 'light' ? 'text-neutral-400' : 'text-neutral-605'}`}>
                    배너 광고 및 파트너 제휴 입점 문의: <span className="text-[#d11822] font-black">windos086@naver.com</span>
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={() => { setMainViewFilter('ongoing'); setIsMobileGameListVisible(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'ongoing' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>진행중 ({ongoingCount})</button>
                  <button onClick={() => { setMainViewFilter('closed'); setIsMobileGameListVisible(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'closed' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>예측마감 ({closedCount})</button>
                  <button onClick={() => { setMainViewFilter('bookmarked'); setIsMobileGameListVisible(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'bookmarked' ? 'bg-amber-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>관심예측 ({bookmarkedCount})</button>
                </div>
                
                {/* 모바일 화면에서 게임 리스트 숨김/보기 토글 */}
                <div className="md:hidden flex justify-center mb-4 w-full px-2">
                   <motion.button 
                       onClick={() => setIsMobileGameListVisible(!isMobileGameListVisible)} 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       animate={{ opacity: [1, 0.6, 1] }}
                       transition={{ repeat: Infinity, duration: 2 }}
                       className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[17.5px] font-black flex items-center justify-center gap-2.5 shadow-xl ring-2 ring-orange-400 ring-offset-2 ring-offset-neutral-900 tracking-wide transition-all"
                   >
                       {isMobileGameListVisible ? '▲ 예측 접기' : '▼ 예측참여하기'}
                   </motion.button>
                </div>

                <div className={`grid grid-cols-1 gap-4 ${!isMobileGameListVisible ? 'hidden md:grid' : ''}`}>
                  <div className={`grid grid-cols-1 gap-4`}>
                  {displayPredictions.slice(0, homeDisplayedCount).map((card) => {
                          const realTotal = card.options.reduce((sum, opt) => sum + (card.pool[opt] || 0), 0);
                          const isClosed = card.status === 'closed' || new Date(card.endAt) <= new Date();
                          
                          return (
                     <div key={card.id} className={`bg-[#1a1a1a] border rounded-2xl p-5 relative transition-all duration-300 ${
                      !isClosed && (participantCounts[card.id] || 0) === 0
                        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                        : 'border-[#2b2b2b] shadow-lg'
                    } ${isClosed ? 'bg-[#141414] border-[#1f1f1f]' : ''}`}>
                      
                      {/* 예측마감 Stamp */}
                      {isClosed && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
                          <div className="border-[6px] border-red-600 text-red-600 text-4xl font-black px-6 py-2 rounded-xl rotate-[-15deg] shadow-2xl backdrop-blur-sm tracking-widest pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] inline-block bg-black/60">
                            예측마감
                          </div>
                        </div>
                      )}

                      <div className={isClosed ? "opacity-50 grayscale pointer-events-none" : ""}>

                      <div className="absolute top-4 right-4 flex gap-2 z-20">
                        {userProfile?.nickname === '최고관리자' || userProfile?.loginId === 'sinpotnf@gmail.com' ? (
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePrediction(card.id); }} className="p-1 hover:bg-neutral-800 rounded">
                            <span className="text-[14px]">🗑️</span>
                          </button>
                        ) : null}
                        <button onClick={(e) => toggleHomeBookmark(card.id, e)} className="p-1 hover:bg-neutral-800 rounded">
                          <span className={`text-[14px] ${homeBookmarkedIds.includes(card.id) ? 'grayscale-0' : 'grayscale opacity-50'}`}>🔔</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-xl bg-[#1e202b] border border-neutral-700/50 flex items-center justify-center overflow-hidden shrink-0">
                             {subcategoryLogos[card.subCategory || ''] ? (
                               <img src={subcategoryLogos[card.subCategory || '']} alt={getSubcategoryName(card.subCategory, card.category)} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                             ) : (
                               <Trophy className="w-6 h-6 text-yellow-500" />
                             )}
                           </div>
                           <div>
                              <div className="text-[12px] text-blue-400 font-extrabold uppercase tracking-wide leading-tight">{stripChildTag(getSubcategoryName(card.subCategory, card.category))}</div>
                              <div className="text-[12px] text-neutral-400 font-medium font-sans mt-0.5">{formatGameStartOption(card.endAt)}</div>
                           </div>
                         </div>
                      </div>
                      <h2 className="text-sm font-bold text-white mb-2 leading-snug">
                          {stripChildTag(card.title)}
                      </h2>
                      <div className="flex items-center gap-3 text-neutral-500 mb-4">
                          <div className="flex items-center gap-1">
                              <span className="text-[10px]">⏰ {isClosed ? '마감됨' : getRemainingTimeMsg(card.endAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <span className="text-[10px]">👥 참여: {participantCounts[card.id] || 0}</span>
                          </div>
                      </div>
                      <div className={`grid gap-2 mb-4 relative z-20 ${card.options.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                          {card.options.map((opt, i) => {
                             const realTotalCount = allBets.filter(b => b.predictionId === card.id).length;
                             const realOptCount = allBets.filter(b => b.predictionId === card.id && b.option === opt).length;
                             const pOpt = realTotalCount > 0 ? Math.round((realOptCount / realTotalCount) * 100) : 0;
                             const colors = [
                               'from-red-500 to-red-700 border-red-900 shadow-[0_4px_10px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_15px_rgba(220,38,38,0.4)]',
                               'from-blue-600 to-blue-800 border-blue-950 shadow-[0_4px_10px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_15px_rgba(37,99,235,0.4)]',
                               'from-green-500 to-green-700 border-green-900 shadow-[0_4px_10px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_15px_rgba(34,197,94,0.4)]',
                               'from-purple-500 to-purple-700 border-purple-900 shadow-[0_4px_10px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_15px_rgba(168,85,247,0.4)]',
                               'from-amber-500 to-amber-700 border-amber-900 shadow-[0_4px_10px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_15px_rgba(245,158,11,0.4)]',
                               'from-pink-500 to-pink-700 border-pink-900 shadow-[0_4px_10px_rgba(236,72,153,0.3)] hover:shadow-[0_6px_15px_rgba(236,72,153,0.4)]'
                             ];
                             const color = colors[i % colors.length];

                             return (
                               <button 
                                 key={i}
                                 onClick={() => {
                                   if (!isClosed) {
                                     if (!userProfile) {
                                       setIsLoginModalOpen(true);
                                       return;
                                     }
                                     const hasAlreadyPredicted = allBets.some(
                                       b => b.userId === userProfile.uid && b.predictionId === card.id
                                     );
                                     if (hasAlreadyPredicted) {
                                       alert("이미 예측에 참여하였습니다.");
                                       return;
                                     }
                                     setSelectedCardForBet(card);
                                     setBetOption(opt);
                                     setBetAmount(100);
                                   }
                                 }}
                                 disabled={isClosed}
                                 className={`bg-gradient-to-b ${color} border-b-[4px] transition-all flex-1 text-white py-3 rounded-xl text-xs font-bold flex flex-col justify-center items-center gap-1 ${
                                 isClosed ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-[4px]'
                               }`}>
                                   <span className="drop-shadow-md text-center whitespace-normal break-words">{opt}</span>
                                   <span className="drop-shadow-md">{pOpt}%</span>
                               </button>
                             );
                          })}
                      </div>
                      <div className="flex items-center text-neutral-500 border-t border-neutral-800 pt-3">
                           <div className="flex items-center gap-3">
                               <button onClick={(e) => handleLike(card.id, e)} className={`flex items-center gap-1 transition ${likedByUser[card.id] ? 'text-red-500' : 'hover:text-white'}`}>
                                 <span className="text-[12px]">{likedByUser[card.id] ? '❤️' : '🤍'} {likes[card.id] || 0}</span>
                               </button>
                               <button onClick={() => setSelectedCommentCard(card)} className="flex items-center gap-1 hover:text-white transition">
                                 <span className="text-[12px]">💬 댓글 {predictionCommentCounts[card.id] || 0}</span>
                               </button>
                           </div>
                      </div>
                    </div>
                    </div>
                  );})}
                  <div ref={homeObserverTarget} />
                </div>
              </div>
            </div>
            )}

            {currentTab === 'register' && (
              <RegisterForm 
                onRegisterSuccess={handleRegisterSuccess}
                onCancel={() => {
                  setCurrentTab('predict');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'dashboard' && (
              <Dashboard 
                points={userProfile?.points || 0}
                betRecords={bets}
                predictionCards={predictions}
              />
            )}

            {currentTab === 'shop' && (
              <GiftconShop 
                userProfile={userProfile}
                onExchange={handleExchangeGiftcon}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onPurchaseBadge={handlePurchaseBadge}
                onEquipBadge={handleEquipBadge}
              />
            )}

            {currentTab === 'results' && (
              <PredictionResults predictions={predictions} allBets={allBets} userProfile={userProfile} bets={bets} globalSubcategories={globalSubcategories} />
            )}

            {currentTab === 'ai-manager' && (
              <AiAutoManager 
                predictionCards={predictions}
                onAddPrediction={handleAddPrediction}
                onResolvePrediction={handleResolvePrediction}
                setCurrentTab={setCurrentTab}
                dynamicMenus={dynamicMenus}
                onUpdateMenus={async (newMenus: DynamicMenuItem[]) => {
                  setDynamicMenus(newMenus);
                  localStorage.setItem('CHOICE_KOREA_DYNAMIC_MENUS', JSON.stringify(newMenus));
                  if (firebaseAvailable && db) {
                    try {
                      await setDoc(doc(db, "app_config", "dynamicMenus"), { menus: newMenus }, { merge: true });
                    } catch (e) {
                      console.error("Firestore sync error for dynamicMenus: ", e);
                    }
                  }
                }}
                globalSubcategories={globalSubcategories}
                setGlobalSubcategories={setGlobalSubcategories}
                allUsers={(() => {
                  const filtered = allUsers.filter(u => !pendingDeletions.has(u.uid));
                  console.log("Filtered users for AiAutoManager:", filtered.length, "Total:", allUsers.length, "Pending deletions:", Array.from(pendingDeletions));
                  return filtered;
                })()}
                onUpdateUser={handleUpdateUserProfile}
                onDeleteUser={handleDeleteUserProfile}
                firebaseAvailable={firebaseAvailable}
                db={db}
                subcategoryLogos={subcategoryLogos}
              />
            )}

            {currentTab === 'community' && (
              <CommunityBoard 
                userProfile={userProfile}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onQuestProgress={handleUpdateQuest}
                title="자유게시판"
                boardType="free"
                allUsers={allUsers}
                initialSelectedPostId={selectedCommunityPostId}
                onClearInitialSelectedPostId={() => setSelectedCommunityPostId(null)}
              />
            )}
            
            {currentTab === 'community_humor' && (
              <CommunityBoard 
                userProfile={userProfile}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onQuestProgress={handleUpdateQuest}
                title="유머게시판"
                boardType="humor"
                allUsers={allUsers}
                initialSelectedPostId={selectedCommunityPostId}
                onClearInitialSelectedPostId={() => setSelectedCommunityPostId(null)}
              />
            )}

            {currentTab === 'community_notice' && (
              <CommunityBoard 
                userProfile={userProfile}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onQuestProgress={handleUpdateQuest}
                title="공지사항"
                boardType="notice"
                allUsers={allUsers}
                initialSelectedPostId={selectedCommunityPostId}
                onClearInitialSelectedPostId={() => setSelectedCommunityPostId(null)}
              />
            )}

            {currentTab === 'community_ranking' && (
              <ChoiceRanking allUsers={allUsers} />
            )}

            {currentTab === 'customer-center' && (
              <CustomerCenter 
                userProfile={userProfile}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}
            {currentTab === 'suggestion' && (
              <div className="w-full max-w-5xl mx-auto px-4 pt-2 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#111111] overflow-hidden border border-[#2b2b2b] rounded-3xl shadow-2xl h-fit">
                    <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                            <Lightbulb className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">아이디어 제안하기</h2>
                            <p className="text-xs text-neutral-400 mt-1">사용자님의 아이디어가 예측게임이 됩니다.</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500 font-bold ml-1">게임 제목</label>
                        <input 
                          type="text" 
                          placeholder="어떤 게임을 만드시겠어요?" 
                          className="w-full bg-[#1b1b1b] border border-neutral-800 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-neutral-600"
                          value={suggestionTitle}
                          onChange={(e) => setSuggestionTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500 font-bold ml-1">마감 시간</label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-[#1b1b1b] border border-neutral-800 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none"
                          value={suggestionEndAt}
                          onChange={(e) => setSuggestionEndAt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500 font-bold ml-1">선택지 옵션</label>
                        {suggestionOptions.map((option, index) => (
                           <input 
                             key={index}
                             type="text" 
                             placeholder={`옵션 ${index + 1}`} 
                             className="w-full bg-[#1b1b1b] border border-neutral-800 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-neutral-600 mb-2"
                             value={option}
                             onChange={(e) => {
                               const newOptions = [...suggestionOptions];
                               newOptions[index] = e.target.value;
                               setSuggestionOptions(newOptions);
                             }}
                           />
                        ))}
                        <button 
                          onClick={() => setSuggestionOptions([...suggestionOptions, ''])}
                          className="text-xs text-blue-400 font-bold ml-1 hover:text-blue-300"
                        >+ 옵션 추가</button>
                      </div>
                      <button 
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 mt-4 active:scale-95"
                        onClick={() => {
                          if (!suggestionTitle || !suggestionEndAt || suggestionOptions.filter(o => o.trim() !== '').length < 2) return;
                          const newSuggestion = {
                            title: suggestionTitle,
                            description: '사용자 제안 게임',
                            category: 'sports',
                            options: suggestionOptions.filter(o => o.trim() !== ''),
                            pool: {},
                            totalPool: 0,
                            creator: 'admin',
                            status: 'open',
                            winningOption: null,
                            resolutionMethod: 'manual',
                            endAt: suggestionEndAt,
                            createdAt: new Date().toISOString(),
                            sourceUrl: '',
                            proposerUid: userProfile?.uid
                          };
                          
                          if (firebaseAvailable && db) {
                             addDoc(collection(db, "suggestions"), newSuggestion).catch(err => handleFirestoreError(err, OperationType.WRITE, "suggestions"));
                          } else {
                             // Fallback
                             setSuggestedPredictions([newSuggestion as PredictionCard, ...suggestedPredictions]);
                          }

                          setSuggestionTitle('');
                          setSuggestionEndAt('');
                          setSuggestionOptions(['']);
                          addToast('등록이 완료되었습니다', 'success');
                        }}
                      >
                        등록하기
                      </button>
                    </div>
                </div>

                {/* 현재까지 제안된 게임 */}
                {isAdmin ? (
                    <div className="bg-[#111111] border border-[#2b2b2b] p-8 rounded-3xl h-fit">
                        <h4 className="text-neutral-100 font-bold mb-4">운영자 전용 - 제안 게임 관리 ({suggestedPredictions.length})</h4>
                        <div className="space-y-3">
                        {suggestedPredictions.map(p => (
                            <div key={p.id} className="border border-[#2b2b2b] p-4 rounded-xl hover:border-blue-800 transition flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-100">{p.title}</h3>
                                    <p className="text-[10px] text-neutral-500 mt-1">마감: {new Date(p.endAt).toLocaleString()} | 제안자: {allUsers.find(u => u.uid === p.proposerUid)?.nickname || '알 수 없음'}</p>
                                    <p className="text-[10px] text-neutral-400 mt-1">옵션: {p.options.join(', ')}</p>
                                </div>
                                <button 
                                    onClick={async () => {
                                        // Adopt
                                        if (firebaseAvailable && db) {
                                            await addDoc(collection(db, "predictions"), { ...p, status: 'open' });
                                            await deleteDoc(doc(db, "suggestions", p.id));
                                        } else {
                                            setPredictions([...predictions, { ...p, status: 'open' }]);
                                            setSuggestedPredictions(suggestedPredictions.filter(s => s.id !== p.id));
                                        }

                                        // Award points
                                        if (p.proposerUid) {
                                            const proposer = allUsers.find(u => u.uid === p.proposerUid);
                                            if (proposer) {
                                                const updated = { ...proposer, points: (proposer.points || 0) + 10000 };
                                                setAllUsers(prev => prev.map(u => u.uid === proposer.uid ? updated : u));
                                                
                                                if (firebaseAvailable && db) {
                                                    await updateDoc(doc(db, "users", proposer.uid), { points: increment(10000) });
                                                } else {
                                                    localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(allUsers.map(u => u.uid === proposer.uid ? updated : u)));
                                                }
                                                addToast(`🎉 제안하신 게임이 채택되었습니다! 10,000P 지급 완료.`);
                                            }
                                        }
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                                >
                                    채택
                                </button>
                            </div>
                        ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#111111] border border-[#2b2b2b] p-8 rounded-3xl h-fit">
                         <h3 className="text-lg font-bold text-white mb-6">💡 아이디어 제안 가이드</h3>
                         <ul className="space-y-4 text-sm text-neutral-400">
                             <li className="flex gap-3">
                                 <span className="text-blue-500 font-bold">01.</span>
                                 제안해주신 게임은 관리자 검토를 거칩니다.
                             </li>
                             <li className="flex gap-3">
                                 <span className="text-blue-500 font-bold">02.</span>
                                 채택된 게임은 실제 예측 시장에 상장됩니다.
                             </li>
                             <li className="flex gap-3">
                                 <span className="text-blue-500 font-bold">03.</span>
                                 많은 참여가 예상되는 게임일수록 채택률이 높습니다.
                             </li>
                             <li className="flex gap-3">
                                 <span className="text-blue-500 font-bold">04.</span>
                                 채택시 10,000P 를 지급합니다!
                             </li>
                         </ul>
                    </div>
                )}
              </div>
            )}
            
          </div>

          {/* [우측 사이드바 AD 배너 영역] */}
          {(currentTab === 'predict' || currentTab === 'results') && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* AD Banner 1 */}
                <div className="ml-0 mr-auto w-[160px] bg-[#111111] border border-[#2b2b2b] rounded-2xl flex flex-col items-center h-[350px] shadow-lg overflow-hidden group hover:border-[#444] transition-colors">
                   <div className="w-full flex-1 flex flex-col justify-center items-center py-4 px-2">
                      <span className="text-[10px] text-neutral-500 font-bold border border-neutral-700 px-2 py-0.5 rounded uppercase tracking-wider mb-2">ADVERTISEMENT</span>
                      <p className="text-sm font-semibold text-neutral-400">광고 문의</p>
                   </div>
                   
                   {/* Decorative elements */}
                   <div className="w-full bg-gradient-to-b from-[#1a1a1a] to-[#111111] border-t border-neutral-800 flex flex-col items-center justify-center py-8">
                      <div className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-3">
                        <span className="text-neutral-600 font-black text-sm">AD</span>
                      </div>
                      <p className="text-center text-xs text-neutral-500 font-medium">프리미엄 후원사<br/>배너 영역</p>
                   </div>
                </div>

                {/* AD Banner 2 */}
                <div className="ml-0 mr-auto w-[160px] bg-[#111111] border border-[#2b2b2b] rounded-2xl flex flex-col items-center h-[350px] shadow-lg overflow-hidden group hover:border-[#444] transition-colors">
                   <div className="w-full flex-1 flex flex-col justify-center items-center py-4 px-2">
                      <span className="text-[10px] text-neutral-500 font-bold border border-neutral-700 px-2 py-0.5 rounded uppercase tracking-wider mb-2">ADVERTISEMENT</span>
                      <p className="text-sm font-semibold text-neutral-400">광고 문의</p>
                   </div>
                   
                   {/* Decorative elements */}
                   <div className="w-full bg-gradient-to-b from-[#1a1a1a] to-[#111111] border-t border-neutral-800 flex flex-col items-center justify-center py-8">
                      <div className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-3">
                        <span className="text-neutral-600 font-black text-sm">AD</span>
                      </div>
                      <p className="text-center text-xs text-neutral-500 font-medium">프리미엄 후원사<br/>배너 영역</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </main>

      {/* 모달 1. 드가기 위한 닉네임 기입 창 */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#121620] border border-gray-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-700" />
            <button 
              onClick={() => setShowNicknameModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-all p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-white font-extrabold text-lg mb-1">닉네임 설정</h4>
            <p className="text-gray-400 text-xs mb-4">원하시는 닉네임을 설정해주세요.</p>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputNickname}
                onChange={(e) => {
                  setInputNickname(e.target.value);
                  setNicknameCheckStatus('idle');
                }}
                placeholder="예: 홍길동"
                maxLength={10}
                className="flex-1 bg-[#171e2b] text-sm text-white rounded-lg px-4 py-3 border border-gray-800 focus:border-[#ff4e4e]/40 focus:outline-none font-bold tracking-wide transition-all"
              />
              <button
                onClick={handleCheckNickname}
                disabled={!inputNickname.trim() || nicknameCheckStatus === 'available'}
                className="bg-[#2b2b2b] hover:bg-[#333] disabled:opacity-50 text-white text-xs font-bold px-3 rounded-lg flex items-center justify-center border border-gray-700 whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
            {nicknameCheckStatus === 'taken' && (
              <p className="text-red-500 text-xs text-left mb-3 font-bold px-1">이미 사용중인 닉네임입니다.</p>
            )}
            {nicknameCheckStatus === 'available' && (
              <p className="text-green-500 text-xs text-left mb-3 font-bold px-1">사용 가능한 닉네임입니다.</p>
            )}
            {!['taken', 'available'].includes(nicknameCheckStatus) && (
              <div className="mb-3 h-4"></div>
            )}

            <button
              disabled={!inputNickname.trim() || nicknameCheckStatus !== 'available'}
              onClick={handleSaveNickname}
              className="w-full bg-gradient-to-r from-[#ff4e4e] to-[#d32f2f] hover:from-[#ff6060] hover:to-[#ff4e4e] disabled:opacity-45 text-white font-black text-sm py-2.5 rounded-lg transition-transform flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>닉네임 변경</span>
            </button>
          </div>
        </div>
      )}

      {/* 모달 2. 구체적 배팅 대화상자 */}
      {selectedCardForBet && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#141822] to-[#0b0d14] border border-[#ff4e4e]/15 rounded-2xl max-w-md w-full p-6 md:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(255,78,78,0.08)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ff4e4e] via-[#e53e3e] to-[#b71c1c]" />
            
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4e4e] animate-ping" />
              <h4 className="text-[#ff5e5e] font-black text-xs uppercase tracking-widest">CHOICE KOREA 예측 마켓</h4>
            </div>
            
            <h3 className="text-white font-black text-lg md:text-xl leading-snug mb-3 drop-shadow-md">
              {selectedCardForBet.title}
            </h3>
            
            <div className="bg-[#0f121a]/95 px-4 py-3 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed mb-6 font-medium">
              {selectedCardForBet.description}
            </div>

            <div className="space-y-4 mb-6">
              <div className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#ff4e4e] rounded-full inline-block animate-pulse"></span>
                선택한 예측 항목 (CHOOSE YOUR DECISION)
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {selectedCardForBet.options.map((opt) => {
                  const isSelected = betOption === opt;
                  const isYes = opt === '예' || opt?.toLowerCase() === 'yes';
                  const isNo = opt === '아니오' || opt?.toLowerCase() === 'no';
                  
                  // Style dynamically based on option semantic meaning and selected status
                  let activeClass = "border-[#22c55e]/50 bg-[#22c55e]/15 text-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:brightness-110";
                  if (!isSelected) {
                    activeClass = "border-neutral-800 bg-[#0e111a] hover:border-neutral-600 hover:bg-[#121622] text-gray-400";
                  } else {
                    if (isNo) {
                      activeClass = "border-[#ef4444]/50 bg-[#ef4444]/15 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:brightness-110";
                    } else if (!isYes && !isNo) {
                      activeClass = "border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:brightness-110";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBetOption(opt)}
                      className={`py-3.5 px-3 border rounded-xl text-center font-black transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1 select-none ${activeClass}`}
                    >
                      <span className={`text-[8.5px] uppercase font-mono font-medium tracking-wide ${isSelected ? 'text-inherit opacity-90' : 'text-gray-500'}`}>
                        {isSelected ? '● SELECTED' : 'SELECT OPTION'}
                      </span>
                      <span className="truncate max-w-full text-[13px] leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-gray-400 text-center font-medium">
                원하는 예측 항목 단추를 클릭하여 실시간으로 선택을 변경하실 수 있습니다.
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSelectedCardForBet(null)}
                className="flex-1 py-3 bg-gradient-to-b from-[#2e3444] to-[#1c202b] active:from-[#1c202b] active:to-[#12141c] border-b-[4px] border-[#101319] active:border-b-0 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all duration-75 select-none text-center cursor-pointer active:translate-y-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={handlePlacePrediction}
                className="flex-1 py-3 bg-gradient-to-b from-[#ff5e5e] to-[#e12e2e] active:from-[#e12e2e] active:to-[#c22525] border-b-[4px] border-[#921414] active:border-b-0 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-75 flex items-center justify-center space-x-1 hover:brightness-110 active:translate-y-[4px] shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                <CircleDollarSign className="h-4 w-4 text-amber-200" />
                <span>예측 제출하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 푸터 바 */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500 mt-12 bg-[#0a0d13]">
        <p>© 2026 CHOICE KOREA. All Rights Reserved.</p>
        <p className="mt-1">초이스 코리아 실시간 집계 및 예측 분석 플랫폼 정상 작동 중.</p>
      </footer>

      {isQuestModalOpen && userProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#1c1c1e] to-[#0f0f11] w-full max-w-sm rounded-[24px] shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden border border-[#2c2d33] animate-in fade-in zoom-in-95 duration-300">
            <div className="relative p-6 border-b border-[#2c2d33]/50 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/40 via-transparent to-transparent opacity-50"></div>
              <h3 className="relative z-10 text-white font-black text-xl flex items-center gap-2 drop-shadow-md">
                <Gift className="h-6 w-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> MISSION LOG
              </h3>
              <button onClick={() => setIsQuestModalOpen(false)} className="relative z-10 text-gray-500 hover:text-white bg-black/20 hover:bg-black/50 p-1.5 rounded-full backdrop-blur-sm transition-all focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 포인트샵 바로가기 메뉴 */}
              <button
                onClick={() => {
                  setCurrentTab('shop');
                  setIsQuestModalOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full bg-gradient-to-r from-red-600/25 via-rose-600/10 to-transparent hover:from-red-600/35 hover:via-rose-600/20 border border-red-500/30 hover:border-red-500/50 rounded-2xl p-4 flex items-center justify-between text-left transition-all duration-300 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute -right-3 -top-3 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition-all"></div>
                
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="p-2.5 bg-red-500/10 text-red-400 group-hover:text-red-300 rounded-xl border border-red-500/20 group-hover:scale-105 transition-transform">
                    <Store className="h-5 w-5 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-black text-white flex items-center gap-1.5 leading-none">
                      포인트샵 바로가기
                      <span className="text-[9px] bg-red-500/25 text-red-200 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse">GO SHOP</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-none">보유 포인트로 상품권 및 네임 배지 교환</p>
                  </div>
                </div>
                
                <div className="p-1.5 bg-white/5 group-hover:bg-red-500/20 border border-white/5 group-hover:border-red-500/30 rounded-lg text-gray-400 group-hover:text-white transition-all">
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* 출석체크 섹션 */}
              <div className="bg-gradient-to-br from-[#23242a] to-[#1c1d22] rounded-2xl p-5 border border-[#3f4048] shadow-inner relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-amber-500/10"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <span className="text-[15px] font-black text-gray-100 flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg"><CalendarCheck className="h-4 w-4" /></div> 데일리 출석
                  </span>
                  <span className="text-amber-400 text-sm font-black drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]">+1,000P</span>
                </div>
                <button
                  onClick={() => handleUpdateQuest('attendance')}
                  disabled={!!(userProfile.dailyQuest?.attendance && userProfile.dailyQuest?.date === kstDate)}
                  className={`w-full py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all shadow-lg relative z-10 overflow-hidden ${userProfile.dailyQuest?.attendance && userProfile.dailyQuest?.date === kstDate ? 'bg-black/40 text-[#22c55e] border border-[#22c55e]/30 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {userProfile.dailyQuest?.attendance && userProfile.dailyQuest?.date === kstDate ? '출석이 완료되었습니다' : '지금 출석체크 하기'}
                </button>
              </div>

              {/* 추가 미션 섹션 */}
              <div className="space-y-5 px-1 relative">
                <h4 className="text-sm font-black text-gray-300 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" /> 일일퀘스트 <span className="text-xs text-orange-400/80 font-semibold ml-auto">(추가 4,000P 획득)</span>
                </h4>
                
                <div className="flex items-center justify-between text-[13px] group">
                  <span className="text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-2">
                    <SquarePen className="h-4 w-4 text-orange-400" /> 게시글 작성
                    <span className="text-xs font-mono bg-black/30 px-1.5 rounded text-gray-400">{(userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.posts : 0) || 0}/3</span>
                  </span>
                  <div className="w-28 h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden border border-white/5 drop-shadow-sm">
                    <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, ((userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.posts : 0) || 0) / 3 * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] group">
                  <span className="text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-400" /> 커뮤니티 댓글
                    <span className="text-xs font-mono bg-black/30 px-1.5 rounded text-gray-400">{(userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.comments : 0) || 0}/5</span>
                  </span>
                  <div className="w-28 h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden border border-white/5 drop-shadow-sm">
                    <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, ((userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.comments : 0) || 0) / 5 * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] group">
                  <span className="text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-400" /> 예측게임참여
                    <span className="text-xs font-mono bg-black/30 px-1.5 rounded text-gray-400">{(userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.predictions : 0) || 0}/10</span>
                  </span>
                  <div className="w-28 h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden border border-white/5 drop-shadow-sm">
                    <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, ((userProfile.dailyQuest?.date === kstDate ? userProfile.dailyQuest?.predictions : 0) || 0) / 10 * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {userProfile.dailyQuest?.completed && userProfile.dailyQuest?.date === kstDate && (
                <div className="mt-8 bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/20 border border-[#22c55e]/30 rounded-xl p-4 text-center shadow-[0_0_20px_rgba(34,197,94,0.15)] transform hover:scale-[1.02] transition-transform">
                  <p className="text-[#4ade80] text-[13px] font-black tracking-wide drop-shadow-sm flex justify-center items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" /> 오늘의 퀘스트 마스터 달성!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleModalLoginSuccess}
        onRegisterClick={() => {
          setCurrentTab('register');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
        addToast={addToast}
      />

      <PredictionCommentsModal
        isOpen={selectedCommentCard !== null}
        onClose={() => setSelectedCommentCard(null)}
        predictionCard={selectedCommentCard}
        userProfile={userProfile}
        firebaseAvailable={firebaseAvailable}
        db={db}
        onQuestProgress={handleUpdateQuest}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        allBets={allBets}
        allUsers={allUsers}
      />

      {/* 실시간 알림 토스트 메시지 컨테이너 */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#0a0d15]/95 border border-red-500/30 border-l-[5px] border-l-red-500 rounded-xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.85)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-250 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <p className="text-white text-xs font-black tracking-wide leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider select-none shrink-0 cursor-pointer"
            >
              닫기
            </button>
          </div>
        ))}
      </div>

      {/* 맨 위로 스크롤 버튼 (Scroll to Top) */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[90] pt-[14px] pb-3.5 px-3.5 ml-0 mr-[145px] rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_20px_rgba(225,29,72,0.4)] border border-rose-500/20 transition-all duration-300 transform flex items-center justify-center cursor-pointer group hover:scale-110 active:scale-95 ${
          showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-16 opacity-0 scale-75 pointer-events-none'
        }`}
        title="맨 위로 이동"
        id="scroll-to-top-button"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      </button>

    </div>
  );
}
