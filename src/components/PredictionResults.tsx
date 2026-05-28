import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PredictionCard } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Users, 
  Search, 
  Calendar, 
  Award, 
  ChevronRight, 
  Filter, 
  Sparkles 
} from 'lucide-react';
import { stripChildTag } from '../utils';

interface PredictionResultsProps {
  predictions: PredictionCard[];
  allBets?: any[];
  userProfile?: any;
  bets?: any[];
  globalSubcategories?: Record<string, { label: string; count?: string; key: string, children?: any[] }[]>;
}

export default function PredictionResults({ predictions, allBets = [], userProfile, bets = [], globalSubcategories = {} }: PredictionResultsProps) {
  // Filter for resolved predictions
  const resolvedPredictions = useMemo(() => {
    return predictions.filter(p => p.status === 'resolved' && !p.id.toUpperCase().startsWith('CHILD_') && !p.title.toUpperCase().startsWith('CHILD_'));
  }, [predictions]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [historyFilter, setHistoryFilter] = useState<'none' | 'my-all' | 'my-won'>('none');
  
  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(10);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Categories definition
  const categories = [
    { id: 'all', label: '전체', emoji: '✨' },
    { id: 'politics', label: '정치', emoji: '⚖️' },
    { id: 'sports', label: '스포츠', emoji: '🏆' },
    { id: 'esports', label: 'E스포츠', emoji: '🎮' },
    { id: 'economy', label: '경제', emoji: '📊' },
    { id: 'entertainment', label: '연예', emoji: '🎬' },
    { id: 'news', label: '뉴스', emoji: '📰' },
    { id: 'broadcast', label: '방송', emoji: '📺' },
    { id: 'soccer', label: '축구', emoji: '⚽' },
    { id: 'baseball', label: '야구', emoji: '⚾' },
    { id: 'basketball', label: '농구', emoji: '🏀' },
    { id: 'fifa', label: 'FIFA', emoji: '⚽' }
  ];

  // Colors based on categories
  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'politics':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'sports':
      case 'soccer':
      case 'baseball':
      case 'basketball':
      case 'fifa':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'esports':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'economy':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'entertainment':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'news':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'broadcast':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        // Try looking up in subcategories for badge style if not found in main
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };
  
 

  const getCategoryLabel = (cat: string) => {
    const item = categories.find(c => c.id.toLowerCase() === cat.toLowerCase());
    if (item) return `${item.emoji} ${item.label}`;
    
    // Look in subcategories
    for (const list of Object.values(globalSubcategories || {})) {
      for (const item of list) {
        if (item.key === cat) return item.label;
        if (item.children) {
          for (const child of item.children) {
            if (child.key === cat) return child.label;
          }
        }
      }
    }
    
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Filtered list
  const filteredPredictions = useMemo(() => {
    let baseList = resolvedPredictions;
    
    if (historyFilter === 'my-all') {
      baseList = predictions.filter(p => bets.some(b => b.predictionId === p.id));
    } else if (historyFilter === 'my-won') {
      baseList = predictions.filter(p => bets.some(b => b.predictionId === p.id && b.status === 'won'));
    }

    return baseList.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resolvedPredictions, predictions, bets, searchQuery, selectedCategory, historyFilter]);

  // Reset count on filter change
  useEffect(() => {
    setDisplayCount(10);
  }, [filteredPredictions]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && displayCount < filteredPredictions.length) {
        setDisplayCount(prev => prev + 10);
      }
    });

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }
    return () => observer.disconnect();
  }, [filteredPredictions, displayCount]);

  const displayedPredictions = useMemo(() => {
    return filteredPredictions.slice(0, displayCount);
  }, [filteredPredictions, displayCount]);

  // Global aggregate stats
  const aggregateStats = useMemo(() => {
    const totalCount = resolvedPredictions.length;
    const totalVolume = resolvedPredictions.reduce((sum, p) => sum + (p.totalPool || 0), 0);
    const totalParticipants = resolvedPredictions.reduce((sum, p) => {
      const cardBets = allBets.filter(b => b.predictionId === p.id);
      return sum + cardBets.length;
    }, 0);

    return { totalCount, totalVolume, totalParticipants };
  }, [resolvedPredictions, allBets]);

  return (
    <div className="space-y-6 animate-fade-in text-white font-sans">
      
      {/* ELEVATED HERO PANEL WITH DYNAMIC REAL-TIME COUNTERS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#121620] via-[#141a27] to-[#1a1c24] border border-[#2c2d33] rounded-2xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 p-3 rounded-2xl border border-emerald-500/30 shadow-inner flex items-center justify-center shrink-0">
              <Award className="h-7 w-7 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                  History Archive
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">예측 결과</h2>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">최종 판정이 온전하게 마감되어 결과가 확정된 예측 보관소입니다.</p>
            </div>
          </div>

          {/* Aggregate metrics inside header */}
          <div className="flex items-center gap-4 border-t border-gray-800/80 md:border-t-0 pt-4 md:pt-0 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-4 text-left bg-black/20 p-2 rounded-xl border border-gray-800/40 w-full">
              <button
                type="button"
                onClick={() => setHistoryFilter(prev => prev === 'my-all' ? 'none' : 'my-all')}
                className={`flex flex-col px-4 py-2 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  historyFilter === 'my-all'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                    : 'bg-transparent border-transparent hover:border-gray-750 hover:bg-[#1c2232]/50 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-extrabold block uppercase tracking-wider">내 예측내역</span>
                  {historyFilter === 'my-all' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <span className={`font-mono text-lg font-black transition-colors ${historyFilter === 'my-all' ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                  {userProfile ? (userProfile.predictsCount || bets.length || 0) : bets.length} <span className="text-[10px] text-gray-500 font-normal">건</span>
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setHistoryFilter(prev => prev === 'my-won' ? 'none' : 'my-won')}
                className={`flex flex-col px-4 py-2 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  historyFilter === 'my-won'
                    ? 'bg-emerald-500/15 border-emerald-500/75 text-white shadow-[0_0_15px_rgba(16,185,129,0.18)]'
                    : 'bg-transparent border-transparent hover:border-gray-755 hover:bg-[#1c2232]/50 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-emerald-500/90 font-extrabold block uppercase tracking-wider">적중 내역</span>
                  {historyFilter === 'my-won' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <span className="font-mono text-lg font-black text-emerald-400">
                  {userProfile ? (userProfile.successCount || bets.filter((b: any) => b.status === 'won').length || 0) : bets.filter((b: any) => b.status === 'won').length} <span className="text-[10px] text-emerald-500/70 font-normal">건</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-[#121620] border border-[#2c2d33] p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category selector */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="h-4 w-4 text-gray-500 shrink-0 ml-1" />
          <div className="flex gap-1.5 pl-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              
              const baseListForCount = historyFilter === 'my-all' 
                ? predictions.filter(p => bets.some(b => b.predictionId === p.id))
                : historyFilter === 'my-won'
                ? predictions.filter(p => bets.some(b => b.predictionId === p.id && b.status === 'won'))
                : resolvedPredictions;

              const count = cat.id === 'all' 
                ? baseListForCount.length 
                : baseListForCount.filter(p => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'bg-[#181d2a] text-gray-400 border border-neutral-800 hover:text-white hover:bg-neutral-850'
                  }`}
                >
                  <span>{cat.emoji} {cat.label}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-emerald-800 text-white' : 'bg-black/30 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search input style */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            className="w-full bg-[#181d2a] text-xs text-white border border-[#2c2d33] pl-9 pr-4 py-2.5 rounded-lg focus:border-emerald-500 focus:outline-none font-semibold shadow-inner"
            placeholder="결과 마켓 제목이나 판정 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* ACTIVE FILTER BANNER */}
      {historyFilter !== 'none' && (
        <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
            <span>
              현재{' '}
              <strong className="text-white font-extrabold text-[12px]">
                {historyFilter === 'my-all' ? '내 예측 내역' : '적중 내역'}
              </strong>{' '}
              필터링이 무사히 활성화되었습니다. (옵션 선택 시 베팅 세부사항이 카드 내에 표시됩니다)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHistoryFilter('none')}
            className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/25 transition-all text-white font-bold cursor-pointer"
          >
            필터 해제 ✕
          </button>
        </div>
      )}

      {/* HISTORICAL RESULTS GRID */}
      {filteredPredictions.length === 0 ? (
        <div className="bg-[#121620] border border-[#2c2d33] rounded-2xl flex flex-col items-center justify-center py-24 text-gray-400 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gray-800/40 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-gray-650" />
          </div>
          <p className="text-sm font-semibold text-gray-200">일치하는 확정 예측 결과가 없습니다.</p>
          <p className="text-xs mt-2 opacity-60 max-w-xs leading-relaxed">선택하신 카테고리에 판정이 끝난 마켓이 없거나 검색 결과가 존재하지 않습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedPredictions.map(card => {
            const cardBets = allBets.filter(b => b.predictionId === card.id);
            const totalBetsCount = cardBets.length;
            const totalPool = card.totalPool || 0;

            const isRefund = card.winningOption === '경기취소' || card.winningOption === '적중특례' || card.winningOption === 'CANCELED' || card.winningOption === 'SPECIAL_PUSH';
            
            // Find current user's bet for this card
            const myBet = bets.find(b => b.predictionId === card.id);

            return (
              <div 
                key={card.id} 
                className={`bg-[#121620] border rounded-2xl p-5 hover:border-gray-700/80 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group shadow-lg ${
                  myBet ? 'border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.03)]' : 'border-[#2c2d33]'
                }`}
              >
                {/* Background decorative shine */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Category info and Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getCategoryBadgeStyle(card.category)}`}>
                      {stripChildTag(getCategoryLabel(card.category))}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {myBet && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                          참여 완료
                        </span>
                      )}
                      {isRefund ? (
                        <span className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> 반환 특례
                        </span>
                      ) : (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {card.status === 'resolved' ? '판정 완료' : '진행 중'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Title of the prediction */}
                  <h3 className="font-extrabold text-white text-sm leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2 mb-3">
                    {stripChildTag(card.title)}
                  </h3>

                  {/* Event End Date Info block */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 bg-[#161a24] px-3.5 py-2.5 rounded-xl border border-gray-800/60 mb-4 font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      마감일자
                    </span>
                    <span className="text-white font-extrabold">
                      {card.endAt ? card.endAt.substring(0, 16).replace('T', ' ') : '-'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {card.options.map(option => {
                      const isOptionWinner = card.winningOption === option;
                      const isUserOption = myBet?.option === option;
                      
                      return (
                        <div 
                          key={option} 
                          className={`relative rounded-xl p-3 border text-xs font-bold transition-all overflow-hidden ${
                            isOptionWinner && !isRefund
                              ? 'bg-gradient-to-r from-emerald-950/40 to-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.08)]' 
                              : isUserOption
                              ? 'bg-blue-950/20 border-blue-500/30 text-blue-300'
                              : 'bg-black/15 border-gray-800/60 text-gray-400'
                          }`}
                        >
                          <div className="flex-1 flex items-center justify-between relative z-10 font-black">
                            <div className="flex items-center gap-1.5">
                              {isOptionWinner && !isRefund && (
                                <span className="text-[10px] bg-emerald-500 text-black px-1 py-0.2 rounded-md font-black flex items-center gap-0.5">
                                  👑 HIT
                                </span>
                              )}
                              {isUserOption && (
                                <span className="text-[10px] bg-blue-500 text-white px-1 py-0.2 rounded-md font-black">
                                  내 선택
                                </span>
                              )}
                              <span className={isOptionWinner && !isRefund ? 'text-emerald-300 font-extrabold' : 'text-gray-300'}>
                                {option}
                              </span>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              {isOptionWinner && !isRefund && (
                                <span className="text-emerald-400 text-[10px] font-black mr-1">당첨 결과</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* USER PERSONAL BET INFO BLOCK */}
                  {myBet && (
                    <div className="mt-4 bg-[#141822]/90 border border-emerald-500/10 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                      <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-gray-800/40">
                        <span className="text-gray-300 flex items-center gap-1.5 font-bold">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          내 예측 참여 정보
                        </span>
                        {myBet.status === 'won' && (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/20">
                            적중 성공 👑
                          </span>
                        )}
                        {myBet.status === 'lost' && (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px] border border-rose-500/20">
                            낙첨 ❌
                          </span>
                        )}
                        {myBet.status === 'pending' && (
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/20">
                            결과 대기 중 ⏳
                          </span>
                        )}
                        {myBet.status === 'refunded' && (
                          <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-[10px] border border-purple-500/20">
                            베팅 반환 🔄
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono leading-relaxed pt-1">
                        <div>
                          <span className="text-gray-500 block text-[9px] uppercase tracking-wider">투표한 선택지</span>
                          <span className="text-emerald-300 font-extrabold">{myBet.option}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SPECIAL REFUND INFO ALERT OVERLAY */}
                {isRefund && (
                  <div className="mt-3.5 bg-purple-500/10 border border-purple-550/20 rounded-lg p-3 text-[10px] text-purple-300 leading-normal flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">[무효 및 취소 처리 고시]</p>
                      <p className="mt-0.5 opacity-80 leading-relaxed text-[10px]">
                        본 경기는 최고관리자의 <strong>[{card.winningOption}]</strong> 판정에 따라 무효 및 취소 고시되었습니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
