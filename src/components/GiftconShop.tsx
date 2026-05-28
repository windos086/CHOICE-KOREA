import React from 'react';
import { 
  Gift, 
  Check, 
  AlertCircle, 
  ShoppingBag, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';
import { GiftconItem, UserProfile } from '../types';
import { MILITARY_BADGES, MilitaryInsignia, normalizeBadgeId, MilitaryBadgeData } from './MilitaryBadge';

interface GiftconShopProps {
  userProfile: UserProfile | null;
  onExchange: (price: number, itemName: string) => void;
  onOpenLoginModal?: () => void;
  onPurchaseBadge?: (price: number, badgeId: string, badgeName: string) => Promise<boolean>;
  onEquipBadge?: (badgeId: string | null) => Promise<boolean>;
}

const CONST_GIFTCONS: GiftconItem[] = [
  { id: 'g1', name: '스타벅스 아이스 아메리카노 T', price: 4500, provider: '스타벅스', image: '☕' },
  { id: 'g2', name: 'GS25 모바일 상품권 5천원권', price: 5000, provider: 'GS25', image: '🏪' },
  { id: 'g3', name: 'BHC 뿌링클 + 콜라 1.25L', price: 21000, provider: 'BHC 치킨', image: '🍗' },
  { id: 'g4', name: '신세계 모바일상품권 1만원권', price: 10000, provider: '신세계백화점', image: '🎫' },
  { id: 'g5', name: '배스킨라빈스 싱글킹 아이스크림', price: 4700, provider: '배스킨라빈스', image: '🍦' },
  { id: 'g6', name: '네이버페이 포인트 1만원 쿠폰', price: 10000, provider: '네이버페이', image: '🟩' },
];

export default function GiftconShop({ 
  userProfile, 
  onExchange, 
  onOpenLoginModal,
  onPurchaseBadge,
  onEquipBadge
}: GiftconShopProps) {
  const [shopMode, setShopMode] = React.useState<'giftcon' | 'badge'>('badge');
  const [successExchange, setSuccessExchange] = React.useState<string | null>(null);
  const [couponCode, setCouponCode] = React.useState<string | null>(null);
  const [badgeMessage, setBadgeMessage] = React.useState<{ text: string; isError: boolean } | null>(null);

  const points = userProfile?.points || 0;
  const purchasedBadges = (userProfile?.purchasedBadges || []).map(b => normalizeBadgeId(b) || b);
  const activeBadge = normalizeBadgeId(userProfile?.activeBadge) || null;

  const handlePurchaseGiftcon = (item: GiftconItem) => {
    if (!userProfile) {
      alert("⚠️ 회원 전용 서비스입니다. 먼저 우측 상단이나 사이드바에서 [초이스 코리아 로그인] 또는 회원가입을 완료한 후 기프티콘 교환 서비스를 이용해 주세요!");
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }

    if (points < item.price) {
      alert("보유한 참여 포인트가 부족합니다. 예측 카드에 참여하여 포인트를 획득하세요!");
      return;
    }

    onExchange(item.price, item.name);
    
    // Generate random pin code
    const randomPin = Array.from({ length: 4 }, () => 
      Math.floor(1000 + Math.random() * 9000)
    ).join('-');
    
    setCouponCode(randomPin);
    setSuccessExchange(item.name);
  };

  const handleBuyBadge = async (badge: MilitaryBadgeData) => {
    if (!userProfile) {
      alert("⚠️ 회원 전용 서비스입니다. 로그인 후 명예 계급장을 획득해 영광을 함께 하세요!");
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    if (points < badge.price) {
      setBadgeMessage({ text: "💳 보유 포인트가 부족하여 계급장을 구매하실 수 없습니다.", isError: true });
      setTimeout(() => setBadgeMessage(null), 4000);
      return;
    }

    if (onPurchaseBadge) {
      const success = await onPurchaseBadge(badge.price, badge.id, badge.name);
      if (success) {
        setBadgeMessage({ text: `🎉 [${badge.name}] 계급장을 성공적으로 구매 및 자동 장착 완료했습니다!`, isError: false });
        setTimeout(() => setBadgeMessage(null), 4000);
      }
    }
  };

  const handleToggleEquip = async (badgeId: string) => {
    if (!userProfile || !onEquipBadge) return;
    
    if (activeBadge === badgeId) {
      // Unequip
      const success = await onEquipBadge(null);
      if (success) {
        setBadgeMessage({ text: "🔓 계급지위를 장착 해제하여 기본 등급으로 돌아왔습니다.", isError: false });
        setTimeout(() => setBadgeMessage(null), 3000);
      }
    } else {
      // Equip
      const success = await onEquipBadge(badgeId);
      if (success) {
        const badgeName = MILITARY_BADGES.find(b => b.id === badgeId)?.name || '선택한 계급장';
        setBadgeMessage({ text: `✨ [${badgeName}] 훈장을 당당히 장착 완료했습니다!`, isError: false });
        setTimeout(() => setBadgeMessage(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 보유 포인트 잔고 안내판 */}
      <div className="bg-gradient-to-r from-[#1a2130] to-[#121620] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white text-lg font-bold flex items-center">
            {shopMode === 'giftcon' ? (
              <>
                <Gift className="h-5 w-5 mr-2 text-[#ff4e4e]" />
                초이스 코리아 포인트샵 (기프티콘 몰)
              </>
            ) : (
              <>
                <Award className="h-5 w-5 mr-2 text-yellow-450" />
                특별 명예 품위 계급장 몰
              </>
            )}
          </h3>
          <p className="text-gray-450 text-xs mt-1">
            {shopMode === 'giftcon' 
              ? '예측 참여와 정산 성취로 획득한 참여 포인트를 다양하고 맛있는 실물 기프티콘과 교환하세요!'
              : '포인트를 영광스럽게 소비하여 커뮤니티 전역(채팅방, 게시판 등)에 고유 등극할 수 있는 훈장식 특수 계급장을 임명받으세요.'}
          </p>
        </div>
        <div className="bg-[#0f131a] px-5 py-3 rounded-lg border border-[#ff4e4e]/20 text-right shrink-0">
          <span className="text-gray-450 text-[10.5px] font-bold block">나의 활성 가용 포인트</span>
          <span className="text-2xl font-black text-[#ff4e4e] font-mono tracking-wide">
            {points.toLocaleString()} <span className="text-sm text-gray-300 font-normal">P</span>
          </span>
        </div>
      </div>

      {/* Mode navigation segment button */}
      <div className="flex border-b border-gray-800 gap-2">
        <button
          onClick={() => setShopMode('giftcon')}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            shopMode === 'giftcon'
              ? 'border-[#ff4e4e] text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>🎁 실물 기프티콘 교환소</span>
        </button>
        <button
          onClick={() => setShopMode('badge')}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            shopMode === 'badge'
              ? 'border-yellow-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>🏅 명예 품위 계급장 샵</span>
        </button>
      </div>

      {/* Alert or notification popups */}
      {badgeMessage && (
        <div className={`p-4 rounded-lg text-xs font-bold border flex items-center gap-2 animate-fadeIn ${
          badgeMessage.isError 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {badgeMessage.isError ? (
            <ShieldAlert className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
          )}
          <span>{badgeMessage.text}</span>
        </div>
      )}

      {/* 성공 팡파레 팝업 (Giftcon) */}
      {successExchange && shopMode === 'giftcon' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center relative overflow-hidden animate-fade-in">
          <span className="absolute -top-6 -right-6 text-6xl opacity-10">🎉</span>
          <h4 className="text-emerald-400 font-bold text-lg mb-1">🎉 쿠폰 오프라인 제휴 발급이 완료되었습니다!</h4>
          <p className="text-gray-300 text-sm mb-4">
            <strong>[{successExchange}]</strong> 기프티콘 바코드 교환 핀 번호가 발송 준비 완료 되었습니다.
          </p>
          <div className="inline-block bg-[#0f131a] border border-emerald-500/30 px-6 py-2.5 rounded-lg text-emerald-400 text-lg font-mono font-bold tracking-widest select-all mb-2">
            {couponCode}
          </div>
          <p className="text-gray-500 text-xs text-center">해당 PIN 번호는 마이페이지 및 가입하신 카카오 알림톡 서비스로 안전하게 즉시 연계 전송됩니다.</p>
          <button 
            onClick={() => setSuccessExchange(null)}
            className="mt-4 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors"
          >
            확인 및 보관함 가기
          </button>
        </div>
      )}

      {/* 기프티콘 몰 리스트 */}
      {shopMode === 'giftcon' && (
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="bg-[#1c1f2e] p-4 rounded-full border border-yellow-500/30 text-yellow-500 animate-pulse">
            <Gift className="h-10 w-10" />
          </div>
          <div className="max-w-md space-y-2 animate-fadeIn">
            <h4 className="text-white text-lg font-bold">기프트콘 교환소 서비스 준비 중</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              현재 기프티콘 오프라인 실시간 제휴 단말 시스템 점검 및 업데이트 진행 중입니다. 
              더 다양한 제휴 쿠폰과 안전한 실시간 전송 환경으로 곧 복귀하겠습니다. 불편을 드려 대단히 죄송합니다.
            </p>
          </div>
          <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black rounded">
            준비중 (서비스 일시 중단)
          </div>
        </div>
      )}

      {/* 명예 계급장 몰 리스트 */}
      {shopMode === 'badge' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MILITARY_BADGES.map((item) => {
              const hasBadge = purchasedBadges.includes(item.id);
              const isEquipped = activeBadge === item.id;
              const isAffordable = points >= item.price;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-gradient-to-br ${item.bgGrad} border ${item.borderClass} transition-all rounded-xl p-5 flex flex-col justify-between group overflow-hidden relative ${
                    isEquipped ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                >
                  {/* Decorative badge graphic in backdrop */}
                  <div className="absolute -right-2 -top-2 select-none opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                    <MilitaryInsignia badgeId={item.id} className="w-24 h-24" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 px-1.5 rounded bg-neutral-950/80 border border-neutral-800/80">
                          <MilitaryInsignia badgeId={item.id} className="w-8 h-8" />
                        </div>
                      </div>
                      {hasBadge ? (
                        <div className="flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-0.5 rounded-full">
                          <Sparkles className="h-3 w-3 text-emerald-400 animate-spin-slow" />
                          <span className="text-emerald-400 text-[10px] font-extrabold">품위 임명됨</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[9px] font-black px-2 py-0.5 rounded bg-neutral-950 border border-neutral-900 select-none">미임명 계급</span>
                      )}
                    </div>
                    
                    <h4 className="text-white font-black text-base flex items-center gap-1.5">
                      <span className={item.color}>{item.name}</span>
                    </h4>
                    
                    <div className="flex items-baseline space-x-1 mt-4">
                      <span className="text-lg font-black text-emerald-400 font-mono">{item.price.toLocaleString()}</span>
                      <span className="text-neutral-400 text-[10px] font-bold">포인트 (P)</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-900 flex items-center gap-2 z-10">
                    {hasBadge ? (
                      <button
                        onClick={() => handleToggleEquip(item.id)}
                        className={`w-full py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                          isEquipped
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        <span>{isEquipped ? '계급 해제하기' : '이 군사계급 장착'}</span>
                      </button>
                    ) : (
                      <button
                        disabled={!isAffordable}
                        onClick={() => handleBuyBadge(item)}
                        className={`w-full py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                          isAffordable 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/10' 
                            : 'bg-neutral-900 text-neutral-600 border border-neutral-850 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        <span>{isAffordable ? '계급 등극하기' : '획득포인트 부족'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 명예 계급 수령 안내 가이드라인 */}
          <div className="bg-[#181f2d]/40 rounded-lg p-5 border border-gray-800 text-gray-400 text-xs space-y-2">
            <h5 className="text-yellow-505 font-extrabold text-sm flex items-center mb-1">
              <Check className="h-4 w-4 mr-1.5 text-yellow-500" />
              특별 위엄 계급장 훈장 혜택 안내
            </h5>
            <p>• 획득하신 계급장은 구매와 동시에 사용자 등원 및 **소유권이 평생 영구적으로 양도** 및 기록됩니다.</p>
            <p>• 계급장을 장착하면 **실시간 분석 채팅방, 커뮤니티 전 게시판 게시글, 댓글란 이름** 옆에 화려한 표식 훈장이 즉시 적용되어 우아하게 고휘도 출력됩니다.</p>
            <p>• 장교 이상 최고 존엄 명예 훈장은 향후 AI 제안 분석 및 특정 여론 조사 카드 개설 권한과 가중 지분을 부여받게 됩니다.</p>
          </div>
        </>
      )}
    </div>
  );
}
