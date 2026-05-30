import React from 'react';
import { Search, SlidersHorizontal, Bookmark, Gift, TrendingUp, HelpCircle, ChevronRight, Share2, Award, Landmark, Eye, Trash2, Trophy } from 'lucide-react';
import { PredictionCard, UserProfile } from '../types';

interface PoliticsPortalProps {
  category?: string;
  predictions: PredictionCard[];
  allBets?: any[];
  globalSubcategories?: Record<string, { label: string; count?: string; key: string, children?: any[] }[]>;
  setGlobalSubcategories?: any;
  onSelectCardForBet: (card: PredictionCard, option: string) => void;
  onOpenComments?: (card: PredictionCard) => void;
  userProfile: UserProfile | null;
  participantCounts?: Record<string, number>;
  onOpenLoginModal?: () => void;
  onDeletePrediction?: (cardId: string) => void;
  subcategoryLogos?: Record<string, string>;
  predictionCommentCounts?: Record<string, number>;
  addToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function PoliticsPortal({
  category = 'politics',
  predictions,
  allBets = [],
  globalSubcategories = {},
  setGlobalSubcategories,
  onSelectCardForBet,
  onOpenComments,
  userProfile,
  participantCounts = {},
  onOpenLoginModal,
  onDeletePrediction,
  subcategoryLogos = {},
  predictionCommentCounts = {},
  addToast
}: PoliticsPortalProps) {
  const isAdmin = userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자';

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
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('CHOICE_KOREA_BOOKMARKS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mainViewFilter, setMainViewFilter] = React.useState<'ongoing' | 'closed' | 'bookmarked'>('ongoing');

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

  const handleLike = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile && onOpenLoginModal) {
      onOpenLoginModal();
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

  // Reset filter when category changes
  React.useEffect(() => {
    setActiveCategory('all');
  }, [category]);

  // Toggle bookmark function
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('CHOICE_KOREA_BOOKMARKS', JSON.stringify(updated));
      return updated;
    });
  };

  const getInitialSubcategories = (cat: string) => {
    return [
      { label: '전체', count: '0', key: 'all' },
    ];
  };

  const baseSubcategories = globalSubcategories?.[category] && globalSubcategories[category].length > 0 ? globalSubcategories[category] : getInitialSubcategories(category);
  const subcategories = [{ label: '전체', key: 'all' }, ...baseSubcategories.filter(s => s.key !== 'all')];

  // We no longer manage local subcategories directly via prompt. 
  // It is done entirely in AiAutoManager.
  const handleDeleteCategory = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    // Admin operation moved to manager tab.
  };

  const handleEditCategory = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    // Admin operation moved to manager tab.
  };


  // Helper: retrieve a PredictionCard's live pool / totalPool by ID, or fall back to mock numbers
  const getCardDetails = (id: string, defaultTitle: string, defaultPercentage1: number, defaultPercentage2?: number) => {
    const card = predictions.find(p => p.id === id);

    // Calculate probabilities dynamically from actual participant votes
    const cardBets = allBets.filter(b => b.predictionId === id);
    const totalBets = cardBets.length;

    let prob1 = 0;
    let prob2 = 0;

    // Use options from card or default ['예', '아니오']
    const options = card ? card.options : ['예', '아니오'];

    if (totalBets > 0) {
      const opt1Count = cardBets.filter(b => b.option === options[0]).length;
      const opt2Count = cardBets.filter(b => b.option === options[1]).length;
      prob1 = Math.round((opt1Count / totalBets) * 100);
      prob2 = Math.round((opt2Count / totalBets) * 100);
    } else {
      // Safely default to 0% when absolute participation is 0
      prob1 = 0;
      prob2 = 0;
    }

    if (!card) {
      return {
        id,
        title: defaultTitle,
        category: category as any,
        options,
        pool: { '예': 0, '아니오': 0 },
        totalPool: 0,
        status: 'open',
        endAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        prob1,
        prob2,
        description: defaultTitle + ' 예측 이벤트입니다.',
        rawCard: null as any
      };
    }

    return {
      ...card,
      prob1,
      prob2,
      rawCard: card
    };
  };

  // 1. Group individual sub-markets (PredictionCards) into the visual grid composite cards shown in screenshot
  const compositeCards = React.useMemo(() => {
    let baseList: any[] = [];

    // Scan for dynamic entries created in this category
    const categoryPredictions = predictions.filter(p => p.category === category && p.status !== 'resolved' && !p.id.toUpperCase().startsWith('CHILD_'));
    const usedMarketIds = new Set<string>();
    
    baseList.forEach(c => {
      if (c.marketId) usedMarketIds.add(c.marketId);
      if (c.subMarkets) {
        c.subMarkets.forEach((sub: any) => usedMarketIds.add(sub.marketId));
      }
    });

    const extraCompositeCards = categoryPredictions
      .filter(p => !usedMarketIds.has(p.id))
      .map(p => {
        const optYes = p.options[0] || '예';
        const optNo = p.options[1] || '아니오';
        
        // Calculate dynamic real-time ratio from actual user votes
        const cardBets = allBets.filter(b => b.predictionId === p.id);
        const totalBets = cardBets.length;
        const optYesCount = cardBets.filter(b => b.option === optYes).length;
        const calcProb = totalBets > 0 ? Math.round((optYesCount / totalBets) * 100) : 0;

        return {
          id: `dynamic_group_${p.id}`,
          type: 'composite' as const,
          title: p.title,
          categoryKey: p.subCategory || 'all',
          subCategory: p.subCategory,
          tradeVolume: `$${Math.round((p.totalPool || 1000) / 1000 * 1.5)}K`,
          endAt: p.endAt,
          createdAt: p.createdAt,
          tradeCount: participantCounts[p.id] || 0,
          badgeType: 'default',
          subMarkets: [
            { 
              label: p.title.length > 35 ? `${p.title.substring(0, 35)}...` : p.title, 
              marketId: p.id, 
              defaultProb: calcProb, 
              labelYes: optYes,
              labelNo: optNo,
            }
          ]
        };
      });

    return [...baseList, ...extraCompositeCards].sort((a, b) => {
      const likesA = likes?.[a.id] || 0;
      const likesB = likes?.[b.id] || 0;
      return likesB - likesA;
    });
  }, [category, predictions, allBets, likes]);

  // Helper to render circle badge depending on design category in screenshot
  const renderCircleBadge = (type: string) => {
    switch (type) {
      case 'capitol':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 shadow-md transform overflow-hidden relative border border-white/20">
            <div className="absolute inset-0 bg-black/10"></div>
            <span className="text-white text-xs font-black select-none z-10 leading-tight">🏛️</span>
          </div>
        );
      case 'peace':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🕊️</span>
            <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 opacity-60 rounded-full filter blur-[1px]"></div>
          </div>
        );
      case 'iran':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 via-white to-red-500 shadow-md overflow-hidden relative border border-gray-100">
            <span className="text-[10px] text-emerald-950 font-black z-10">🟢</span>
          </div>
        );
      case 'president':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 via-yellow-600 to-stone-800 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🦅</span>
          </div>
        );
      case 'iran_hands':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-green-600 to-red-500 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🤝</span>
          </div>
        );
      case 'plane':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">✈️</span>
          </div>
        );
      case 'elephant':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-900 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🐘</span>
          </div>
        );
      case 'elon':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1d9bf0] to-[#04090e] shadow-md relative overflow-hidden border border-white/10">
            <span className="text-white text-[10px] font-black z-10">𝕏</span>
          </div>
        );
      case 'baseball':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-700 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">⚾</span>
          </div>
        );
      case 'basketball':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-600 to-red-600 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🏀</span>
          </div>
        );
      case 'trophy':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-600 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🏆</span>
          </div>
        );
      case 'vct':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-800 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🎮</span>
          </div>
        );
      case 'crypto':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🪙</span>
          </div>
        );
      case 'movie':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-700 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🎬</span>
          </div>
        );
      case 'space':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-950 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🚀</span>
          </div>
        );
      case 'ai':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">🤖</span>
          </div>
        );
      case 'stats':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md relative overflow-hidden border border-white/20">
            <span className="text-white text-xs font-black select-none z-10">📈</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-neutral-800 shadow-inner">
            <span className="text-neutral-400 text-xs">🔮</span>
          </div>
        );
    }
  };

  // 2. Filter list of composite cards based on search and selected left category
  const activeCategoryLabel = React.useMemo(() => {
    if (activeCategory === 'all') return '전체';
    for (const sub of subcategories) {
      if (sub.key === activeCategory) return sub.label;
      if ((sub as any).children) {
        for (const child of (sub as any).children) {
          if (child.key === activeCategory) return child.label;
        }
      }
    }
    return activeCategory;
  }, [activeCategory, subcategories]);

  const activeSubcategoryObj = React.useMemo(() => {
    return subcategories.find(s => s.key === activeCategory) as any;
  }, [activeCategory, subcategories]);

  const baseFilteredComposites = compositeCards.filter(card => {
    if (activeCategory !== 'all') {
      let isMatch = card.categoryKey === activeCategory;
      if (!isMatch && activeSubcategoryObj && activeSubcategoryObj.children) {
        isMatch = activeSubcategoryObj.children.some((c: any) => c.key === card.categoryKey);
      }
      if (!isMatch) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(query);
      const matchSubtitle = card.subtitle ? card.subtitle.toLowerCase().includes(query) : false;
      const matchSubs = card.subMarkets ? card.subMarkets.some((sub: any) => sub.label.toLowerCase().includes(query)) : false;
      
      if (!matchTitle && !matchSubtitle && matchSubs === false) return false;
    }

    return true;
  });

  const getIsClosed = (card: any) => {
    let isClosed = false;
    if (card.type === 'hero') {
      const details = getCardDetails(card.marketId, card.title, card.defaultProb);
      isClosed = details.status === 'closed' || new Date(details.endAt) <= new Date();
    } else {
      const isAllClosed = card.subMarkets.every((s:any) => {
         const d = getCardDetails(s.marketId, s.label, s.defaultProb);
         return d.status === 'closed' || new Date(d.endAt) <= new Date();
      });
      isClosed = isAllClosed || new Date(card.endAt) <= new Date();
    }
    return isClosed;
  };

  const ongoingCount = baseFilteredComposites.filter(c => !getIsClosed(c)).length;
  const closedCount = baseFilteredComposites.filter(c => getIsClosed(c)).length;
  const bookmarkedCount = bookmarkedIds.length;

  const filteredComposites = baseFilteredComposites.filter(card => {
    const isClosed = getIsClosed(card);
    if (mainViewFilter === 'ongoing' && isClosed) return false;
    if (mainViewFilter === 'closed' && !isClosed) return false;
    if (mainViewFilter === 'bookmarked' && !bookmarkedIds.includes(card.id)) return false;

    return true;
  });

  // Infinite Scroll Logic
  const [displayedCount, setDisplayedCount] = React.useState(20);
  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    setDisplayedCount(20);
  }, [mainViewFilter, activeCategory, searchQuery]);

  // Reset to 20 when scrolling back to the top
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setDisplayedCount(20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayedCount < filteredComposites.length) {
          setDisplayedCount(prev => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayedCount, filteredComposites.length]);

  // Handler for option click (Yes/No buttons) - maps to standard points betting flow
  const handleBetClick = (marketId: string, isYes: boolean, optionName: string, eventTitle: string) => {
    if (!userProfile) {
      alert("⚠️ 회원 전용 서비스입니다. 먼저 우측 상단이나 사이드바에서 [초이스 코리아 로그인] 또는 회원가입을 완료한 후 예측 베팅에 참여해 주세요!");
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }

    let card = predictions.find(p => p.id === marketId);
    if (card) {
      const hasAlreadyPredicted = allBets.some(
        b => b.userId === userProfile.uid && b.predictionId === card.id
      );
      if (hasAlreadyPredicted) {
        addToast("이미 예측을 참여하였습니다", 'info');
        return;
      }
    } else {
      card = {
        id: marketId,
        title: eventTitle,
        description: `[공식 실시간 연동] ${eventTitle} 예측 마켓에 참여 및 베팅합니다.`,
        category: category as any,
        options: isYes ? [optionName, '아니오'] : ['예', optionName],
        pool: { '예': 1000, '아니오': 1000 },
        totalPool: 2000,
        creator: 'ai',
        status: 'open',
        winningOption: null,
        resolutionMethod: 'ai_automatic',
        endAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        createdAt: new Date().toISOString(),
        sourceUrl: '실시간 카테고리별 공인 통계'
      };
    }

    const finalOption = card.options.includes(optionName) ? optionName : (isYes ? card.options[0] : card.options[1]);
    onSelectCardForBet(card, finalOption);
  };

  const getCategoryHeroGraphic = () => {
    switch (category) {
      case 'sports':
        return (
          <div className="w-56 h-36 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden group-hover:border-neutral-700 transition-all select-none">
            <span className="absolute text-5xl opacity-10">⚽</span>
            <span className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono">LIVE MATCH ODDS</span>
            <span className="text-white text-xs font-black">EPL STADIUM BATTLE</span>
            <span className="text-emerald-400 text-[10px] font-black mt-1 font-mono">100% RELTIME STATUPS</span>
            <span className="absolute bottom-2 right-3 text-[10px] text-neutral-500 font-mono">EST. 2026</span>
          </div>
        );
      case 'esports':
        return (
          <div className="w-56 h-36 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden group-hover:border-neutral-700 transition-all select-none">
            <span className="absolute text-5xl opacity-10">🎮</span>
            <span className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono">OP.GG LIVE SDK</span>
            <span className="text-white text-xs font-black">LCK CHAMPION STAGE</span>
            <span className="text-teal-400 text-[10px] font-black mt-1 font-mono">T1 x GEN.G MATCH DEEP</span>
            <span className="absolute bottom-2 right-3 text-[10px] text-neutral-500 font-mono">GAMING ARENA</span>
          </div>
        );
      case 'economy':
        return (
          <div className="w-56 h-36 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden group-hover:border-neutral-700 transition-all select-none">
            <span className="absolute text-5xl opacity-10">📈</span>
            <span className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono">KRX KOSPI INDEX</span>
            <span className="text-white text-xs font-black">STOCKS & KRW VALUE</span>
            <span className="text-red-500 text-[10px] font-black mt-1 font-mono">MARKET PRICE INDEX</span>
            <span className="absolute bottom-2 right-3 text-[10px] text-neutral-500 font-mono">REALTIME ORACLE</span>
          </div>
        );
      case 'entertainment':
        return (
          <div className="w-56 h-36 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden group-hover:border-neutral-700 transition-all select-none">
            <span className="absolute text-5xl opacity-10">🎬</span>
            <span className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono">VOTE INDEX FLOW</span>
            <span className="text-white text-xs font-black">BTS & IDOL COMBACKS</span>
            <span className="text-pink-400 text-[10px] font-black mt-1 font-mono">ORICON CHART DATA</span>
            <span className="absolute bottom-2 right-3 text-[10px] text-neutral-500 font-mono">SPOTLIGHT BROAD</span>
          </div>
        );
      case 'news':
        return (
          <svg viewBox="0 0 400 240" className="w-56 h-auto drop-shadow-xl filter">
            <path d="M10,40 L30,20 L60,18 L90,25 L120,40 L160,35 L190,45 L220,38 L250,20 L270,18 L310,25 Q340,15 370,40 L390,70 L380,100 L350,110 L310,130 L280,140 L260,150 L220,185 L180,195 L140,210 L100,190 L80,180 L50,150 L30,120 L12,90 Z" fill="#1b1c1e" stroke="#333336" strokeWidth="1" />
            <path d="M10,40 L30,20 L60,18 L90,25 L85,60 L50,80 L20,95 Z" fill="#1e3a8a" opacity="0.75" />
            <path d="M270,18 L310,25 Q340,15 370,40 L390,70 L340,85 L300,70 Z" fill="#1e3a8a" opacity="0.75" />
            <path d="M350,110 L310,130 L280,140 L300,100 L340,90 Z" fill="#1e3a8a" opacity="0.75" />
            <path d="M120,40 L160,35 L190,45 L180,90 L130,85 L95,80 Z" fill="#991b1b" opacity="0.75" />
            <path d="M220,38 L250,20 L270,18 L300,70 L260,100 L210,95 Z" fill="#991b1b" opacity="0.75" />
            <path d="M180,95 L223,103 L233,140 L190,145 L150,140 Z" fill="#991b1b" opacity="0.75" />
            <path d="M250,120 L280,140 L260,150 L220,185 L180,195 L185,150 Z" fill="#991b1b" opacity="0.75" />
            <text x="50" y="55" fill="#3b82f6" fontSize="10" fontWeight="900" fontFamily="sans-serif">D</text>
            <text x="140" y="65" fill="#ef4444" fontSize="10" fontWeight="900" fontFamily="sans-serif">R</text>
            <text x="250" y="55" fill="#ef4444" fontSize="10" fontWeight="900" fontFamily="sans-serif">R</text>
            <text x="350" y="55" fill="#3b82f6" fontSize="10" fontWeight="900" fontFamily="sans-serif">D</text>
            <text x="210" y="145" fill="#ef4444" fontSize="10" fontWeight="900" fontFamily="sans-serif">R</text>
          </svg>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black text-[#f1f3f5] p-4 md:p-8 rounded-2xl shadow-2xl animate-fade-in font-sans">
      
      {/* LEFT SIDEBAR PANEL: Politics Subcategories (Screenshot Replicated) */}
      <div className="lg:col-span-3 space-y-2">
      {(() => {
        return null;
      })()}
        <div className="bg-[#111111] rounded-xl border border-neutral-800 p-3 shadow-sm">
          <div className="px-2 py-1 bg-neutral-900 rounded-lg flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-[#868e96] truncate">
              {category === 'politics' && '⚖️ 정치'}
              {category === 'sports' && '🏆 스포츠'}
              {category === 'esports' && '🎮 E스포츠'}
              {category === 'economy' && '📊 경제'}
              {category === 'entertainment' && '🎬 연예'}
              {category === 'news' && '📰 뉴스'}
              {category === 'broadcast' && '📺 방송'} 카테고리
            </span>
            <span className="text-[10px] bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded font-black tracking-tighter">PREDICT</span>
          </div>
          
          <div className="space-y-0.5 max-h-[580px] overflow-y-auto pr-1">
            {subcategories.map((sub: any) => {
              const isActive = activeCategory === sub.key;
              const hasChildren = sub.children && sub.children.length > 0;
              const isChildActive = hasChildren && sub.children.some((c: any) => c.key === activeCategory);
              
              const catPreds = predictions.filter(p => (p.category || '').toLowerCase() === (category || '').toLowerCase() || (category === 'all' || !category));
              let subCount = 0;
              if (sub.key === 'all') {
                subCount = catPreds.filter(p => p.status !== 'closed' && new Date(p.endAt) > new Date()).length;
              } else {
                subCount = catPreds.filter(p => {
                  const match = ((p.subCategory || '').toLowerCase() === (sub.key || '').toLowerCase() || (sub.children && sub.children.some((c:any) => (c.key || '').toLowerCase() === (p.subCategory || '').toLowerCase())));
                  return match && p.status !== 'closed' && new Date(p.endAt) > new Date();
                }).length;
              }

              return (
                <div key={sub.key || sub.label} className="w-full">
                  <div
                    onClick={() => {
                      setActiveCategory(sub.key);
                      setMainViewFilter('ongoing');
                    }}
                    className={`w-full text-left py-2.5 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all select-none cursor-pointer ${
                      isActive || isChildActive
                        ? 'bg-neutral-800 text-white font-black shadow-inner border border-neutral-700/50'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/70'
                    }`}
                  >
                    <span className="tracking-tight">{sub.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${subCount > 0 ? 'text-indigo-400 font-extrabold' : 'text-neutral-600 font-normal'}`}>
                        {subCount}
                      </span>
                    </div>
                  </div>
                  
                  {hasChildren && (isActive || isChildActive) && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-neutral-800 pl-2">
                      {sub.children.map((child: any) => {
                        const childCount = catPreds.filter(p => p.subCategory === child.key && p.status !== 'closed' && new Date(p.endAt) > new Date()).length;
                        return (
                        <div
                          key={child.key}
                          onClick={() => {
                            setActiveCategory(child.key);
                            setMainViewFilter('ongoing');
                          }}
                          className={`w-full text-left py-2 px-3 rounded-md text-[11px] font-semibold flex items-center justify-between transition-all select-none cursor-pointer ${
                            activeCategory === child.key
                              ? 'bg-[#181d2a] text-blue-400 font-bold border border-blue-900/30'
                              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                          }`}
                        >
                          <span className="tracking-tight">ㄴ {child.label}</span>
                          <span className={`text-[9px] ${childCount > 0 ? 'text-indigo-400 font-bold' : 'text-neutral-600'}`}>{childCount}</span>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT MAIN PANEL: Title Bar, Search, and 3x3 Cards Grid */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Title row with action tools matching Screenshot exactly */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3 text-left">
            <span className="text-2xl font-black text-white font-sans tracking-tight">
              {category === 'politics' && '⚖️ 정치'}
              {category === 'sports' && '🏆 스포츠'}
              {category === 'esports' && '🎮 E스포츠'}
              {category === 'economy' && '📊 실물경제'}
              {category === 'entertainment' && '🎬 연예/스타'}
              {category === 'news' && '📰 종합뉴스'}
              {category === 'broadcast' && '📺 방송/영상'}
            </span>
            <span className="text-neutral-400 font-bold text-xs bg-[#111111] border border-neutral-800 px-2.5 py-1 rounded-full">{activeCategoryLabel} 필터 적용됨</span>
          </div>

          {/* Search Bar & Auxiliary Buttons from Screenshot */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Elegant Search Container */}
            <div className="relative flex-1 sm:w-64 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder={
                  category === 'politics' ? "관심 정치 선거 및 쟁점 검색..." :
                  category === 'sports' ? "스포츠 경기 혹은 구단, 선수 검색..." :
                  category === 'esports' ? "LCK 클럽 및 발로란트 대회 검색..." :
                  category === 'economy' ? "KOSPI 지수 혹은 금리, 코인 검색..." :
                  category === 'entertainment' ? "가요 차트, 음원, 스타 랭킹 검색..." :
                  category === 'news' ? "일요일 핫 키워드 혹은 속보 검색..." :
                  "인기 플랫폼 치지직, SOOP 등 검색..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 font-medium transition shadow-sm"
              />
            </div>

            {/* Quick Tools Buttons with identical borders */}
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('전체');
                setMainViewFilter('ongoing');
              }}
              title="검색 초기화"
              className="p-2 bg-[#111111] border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-400 transition shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            <button
              onClick={() => setMainViewFilter(prev => prev === 'bookmarked' ? 'ongoing' : 'bookmarked')}
              title="북마크 목록 보기"
              className={`p-2 border rounded-lg transition shadow-sm cursor-pointer ${
                mainViewFilter === 'bookmarked' ? 'bg-amber-950/40 border-amber-500/50 text-amber-400' : 'bg-[#111111] border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
              }`}
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setMainViewFilter('ongoing')} className={`flex-1 py-3 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'ongoing' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>진행중 ({ongoingCount})</button>
          <button onClick={() => setMainViewFilter('closed')} className={`flex-1 py-3 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'closed' ? 'bg-blue-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>예측마감 ({closedCount})</button>
          <button onClick={() => setMainViewFilter('bookmarked')} className={`flex-1 py-3 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all ${mainViewFilter === 'bookmarked' ? 'bg-amber-600 text-white shadow-sm' : 'bg-neutral-800 text-gray-400 hover:text-white'}`}>관심예측 ({bookmarkedCount})</button>
        </div>

        {/* 3x3 Politics Markets Responsive Layout Grid */}
        {filteredComposites.length === 0 ? (
          <div className="bg-[#111111] rounded-2xl border border-neutral-800 p-12 text-center shadow-sm font-sans space-y-3">
            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto text-neutral-500">🗳️</div>
            <p className="text-neutral-300 text-sm font-semibold">입력한 조건에 해당하는 활성화된 예측 마켓이 아직 없습니다.</p>
            <p className="text-neutral-500 text-xs">상단의 검색 초기화 단추를 눌러 주십시오.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            
            {filteredComposites.slice(0, displayedCount).map((card) => {
              if (card.type === 'hero') {
                const details = getCardDetails(card.marketId, card.title, card.defaultProb);
                const isClosed = details.status === 'closed' || new Date(details.endAt) <= new Date();
                
                return (
                  <div
                    key={card.id}
                    className={`col-span-1 md:col-span-2 bg-[#111111] rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between relative transition-all self-stretch border-l-4 border-l-red-600 group ${
                      !isClosed && card.tradeCount === 0 
                        ? 'border-y-amber-500/50 border-r-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                        : 'border-y-neutral-800 border-r-neutral-800 shadow-sm hover:shadow-md'
                    } ${isClosed ? 'bg-[#141414] border-neutral-900' : ''}`}
                  >
                    {/* 예측마감 Stamp */}
                    {isClosed && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
                        <div className="border-[6px] border-red-600 text-red-600 text-4xl font-black px-6 py-2 rounded-xl rotate-[-15deg] shadow-2xl backdrop-blur-sm tracking-widest pointer-events-none drop-shadow-[0_0_15px_rgba(220,38,38,0.3)] inline-block bg-black/60">
                          예측마감
                        </div>
                      </div>
                    )}

                    <div className={`flex flex-col md:flex-row items-center justify-between w-full ${isClosed ? 'opacity-50 grayscale pointer-events-none' : ''}`}>

                    <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
                       {isAdmin && onDeletePrediction && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePrediction(card.marketId);
                            }}
                            className="p-1.5 text-neutral-600 hover:text-red-500 hover:bg-neutral-800 rounded-lg transition"
                            title="관리자 권한 - 마켓 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      <button
                        onClick={(e) => toggleBookmark(card.id, e)}
                        className="text-neutral-600 hover:text-amber-500 transition cursor-pointer"
                      >
                        <Bookmark className={`h-4.5 w-4.5 ${bookmarkedIds.includes(card.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-4 md:space-y-6 flex-1 text-left relative z-20">
                      <div>
                        <div className="flex items-center space-x-1.5 mb-1 bg-red-950/40 text-red-400 w-fit px-2.5 py-0.5 rounded text-[10px] font-black">
                          <Award className="h-3.5 w-3.5 animate-pulse" />
                          <span>HIT PREDICTION</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight font-sans leading-tight">
                          {card.title}
                        </h2>
                      </div>

                      <div className="space-y-1 bg-neutral-900 p-3 rounded-lg border border-neutral-800 max-w-[280px]">
                        <span className="text-neutral-400 text-[10.5px] font-bold block">{isClosed ? '마감됨' : card.subtitle}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => !isClosed && handleBetClick(card.marketId, true, '예', card.title)}
                          disabled={isClosed}
                          className={`bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-between min-w-[120px] shadow-sm transition-transform ${isClosed ? 'cursor-not-allowed opacity-80' : 'hover:bg-red-700 active:scale-[0.97] hover:scale-[1.02]'}`}
                        >
                          <span>예</span>
                          <span className="font-mono">{details.prob1}%</span>
                        </button>
                        <button
                          onClick={() => !isClosed && handleBetClick(card.marketId, false, '아니오', card.title)}
                          disabled={isClosed}
                          className={`bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-between min-w-[130px] shadow-sm transition-transform ${isClosed ? 'cursor-not-allowed opacity-80' : 'hover:bg-blue-700 active:scale-[0.97] hover:scale-[1.02]'}`}
                        >
                          <span>아니오</span>
                          <span className="font-mono">{details.prob2}%</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-neutral-400 flex items-center font-semibold italic text-left">
                        <Landmark className="h-3.5 w-3.5 mr-1 text-neutral-500" />
                        <span>누적거래량 {card.tradeVolume} 달러 돌파 정합판정 보증</span>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 max-w-[250px] flex-shrink-0 select-none opacity-90 transition-transform group-hover:scale-105 duration-500 relative z-20">
                      {getCategoryHeroGraphic()}
                    </div>
                    </div>
                  </div>
                );
              }

              const isAllClosed = card.subMarkets.every((s:any) => {
                 const d = getCardDetails(s.marketId, s.label, s.defaultProb);
                 return d.status === 'closed' || new Date(d.endAt) <= new Date();
              });
              const isClosed = isAllClosed || new Date(card.endAt) <= new Date();

              return (
                <div key={card.id} className={`bg-[#1a1a1a] border rounded-2xl p-5 relative transition-all duration-300 ${
                  !isClosed && card.tradeCount === 0
                    ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                    : 'border-[#2b2b2b] shadow-lg'
                } ${isClosed ? 'bg-[#141414] border-neutral-900' : ''}`}>
                  
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
                    {isAdmin && onDeletePrediction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          card.subMarkets.forEach((s: any) => {
                            onDeletePrediction(s.marketId);
                          });
                        }}
                        className="p-1 hover:bg-neutral-800 rounded"
                        title="관리자 권한 - 마켓 삭제"
                      >
                        <span className="text-[14px]">🗑️</span>
                      </button>
                    )}
                    <button onClick={(e) => toggleBookmark(card.id, e)} className="p-1 hover:bg-neutral-800 rounded">
                      <span className={`text-[14px] ${bookmarkedIds.includes(card.id) ? 'grayscale-0' : 'grayscale opacity-50'}`}>🔔</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#1e202b] border border-neutral-700/50 flex items-center justify-center overflow-hidden shrink-0">
                          {subcategoryLogos[card.subCategory || ''] ? (
                            <img src={subcategoryLogos[card.subCategory || '']} alt={getSubcategoryName(card.subCategory, category)} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                          ) : (
                            <Trophy className="w-6 h-6 text-yellow-500" />
                          )}
                        </div>
                        <div>
                           <div className="text-[12px] text-blue-400 font-extrabold uppercase tracking-wide leading-tight">{getSubcategoryName(card.subCategory, category)}</div>
                           <div className="text-[12px] text-neutral-400 font-medium font-sans mt-0.5">{formatGameStartOption(card.endAt || card.createdAt)}</div>
                        </div>
                     </div>
                  </div>

                  <h2 className="text-sm font-bold text-white mb-2 leading-snug relative z-20">
                    {card.title}
                  </h2>

                  <div className="flex items-center gap-3 text-neutral-500 mb-4 relative z-20">
                      <div className="flex items-center gap-1">
                          <span className="text-[10px]">⏰ {isClosed ? '마감됨' : getRemainingTimeMsg(card.endAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-[10px]">👥 참여: {card.tradeCount}</span>
                      </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-4 relative z-20">
                    {card.subMarkets.map((sub: any, sIdx: number) => {
                      const details = getCardDetails(sub.marketId, sub.label, sub.defaultProb);
                      const isSubClosed = details.status === 'closed' || new Date(details.endAt) <= new Date();
                      const isDisabled = isClosed || isSubClosed;

                      return (
                        <div key={sIdx} className="space-y-1">
                          {card.subMarkets.length > 1 && (
                            <div className="text-xs text-neutral-300 font-bold ml-1">{sub.label}</div>
                          )}
                          {details.rawCard?.options && details.rawCard.options.length > 2 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full relative z-20">
                                {details.rawCard.options.map((opt: string, i: number) => {
                                  const realTotalCount = allBets.filter(b => b.predictionId === sub.marketId).length;
                                  const realOptCount = allBets.filter(b => b.predictionId === sub.marketId && b.option === opt).length;
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
                                      onClick={() => !isDisabled && handleBetClick(sub.marketId, i === 0, opt, `${card.title} [${opt}]`)}
                                      disabled={isDisabled}
                                      className={`bg-gradient-to-b ${color} border-b-[4px] transition-all flex-1 text-white py-3 rounded-xl text-xs font-bold flex flex-col justify-center items-center gap-1 ${
                                      isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-[4px]'
                                    }`}
                                    >
                                      <span className="drop-shadow-md text-center">{opt}</span>
                                      <span className="drop-shadow-md">{pOpt}%</span>
                                    </button>
                                  );
                                })}
                              </div>
                          ) : (
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => !isDisabled && handleBetClick(sub.marketId, true, sub.labelYes, `${card.title} [${sub.label}]`)}
                                  disabled={isDisabled}
                                  className={`bg-gradient-to-b from-red-500 to-red-700 border-b-[4px] border-red-900 transition-all flex-1 text-white py-3 rounded-xl text-xs font-bold flex justify-between px-4 shadow-[0_4px_10px_rgba(220,38,38,0.3)] ${
                                  isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-[4px] hover:shadow-[0_6px_15px_rgba(220,38,38,0.4)]'
                                }`}
                                >
                                  <span className="drop-shadow-md">{sub.labelYes}</span>
                                  <span className="drop-shadow-md">{details.prob1}%</span>
                                </button>
                                <button
                                  onClick={() => !isDisabled && handleBetClick(sub.marketId, false, sub.labelNo, `${card.title} [${sub.label}]`)}
                                  disabled={isDisabled}
                                  className={`bg-gradient-to-b from-blue-600 to-blue-800 border-b-[4px] border-blue-950 transition-all flex-1 text-white py-3 rounded-xl text-xs font-bold flex justify-between px-4 shadow-[0_4px_10px_rgba(37,99,235,0.3)] ${
                                  isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] active:border-b-0 active:translate-y-[4px] hover:shadow-[0_6px_15px_rgba(37,99,235,0.4)]'
                                }`}
                                >
                                  <span className="drop-shadow-md">{sub.labelNo}</span>
                                  <span className="drop-shadow-md">{details.prob2}%</span>
                                </button>
                              </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center text-neutral-500 border-t border-neutral-800 pt-3">
                       <div className="flex items-center gap-3">
                           <button onClick={(e) => handleLike(card.id, e)} className={`flex items-center gap-1 transition ${likedByUser[card.id] ? 'text-red-500' : 'hover:text-white'}`}>
                             <span className="text-[12px]">{likedByUser[card.id] ? '❤️' : '🤍'} {likes[card.id] || 0}</span>
                           </button>
                           <button onClick={() => onOpenComments && onOpenComments(card)} className="flex items-center gap-1 hover:text-white transition">
                             <span className="text-[12px]">💬 댓글 {predictionCommentCounts[card.id] || 0}</span>
                           </button>
                       </div>
                  </div>
                  </div>
                </div>
              );
            })}
            <div ref={observerTarget} />
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR PANEL: AD Banner */}
      <div className="hidden lg:block lg:col-span-2">
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
    </div>
  );
}
