import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, 
  Coins, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  Search,
  BookOpen,
  Plus,
  Trash2,
  Link,
  Check
} from 'lucide-react';

interface PartnerMenuViewProps {
  currentUserData: any;
  isAdmin: boolean;
  onClose: () => void;
  refreshUser: () => void;
}

export default function PartnerMenuView({ 
  currentUserData, 
  isAdmin, 
  onClose,
  refreshUser 
}: PartnerMenuViewProps) {
  const [loading, setLoading] = useState(false);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [partnerSummary, setPartnerSummary] = useState({
    totalBetAmount: 0,
    totalLossAmount: 0,
    potentialPoints: 0,
    claimedPoints: 0,
    claimablePoints: 0,
    totalReferrals: 0
  });

  // Operator (Admin) specific states
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin Recommendation Code Management
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'codes'>('stats');
  const [referralCodes, setReferralCodes] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);

  useEffect(() => {
    loadPartnerData();
    if (isAdmin) {
      loadReferralCodes();
    }
  }, [currentUserData?.referrerCode, isAdmin]);

  // Synchronize custom code if exists
  useEffect(() => {
    if (!isAdmin && currentUserData && referralCodes.length > 0) {
      const activeCustomCodeObj = referralCodes.find(c => c.partnerId === currentUserData.id && c.status === 'active');
      if (activeCustomCodeObj && activeCustomCodeObj.code !== currentUserData.referrerCode) {
        updateDoc(doc(db, 'users', currentUserData.id), { referrerCode: activeCustomCodeObj.code })
          .then(() => {
             console.log('Referrer code synchronized');
             refreshUser();
          })
          .catch(console.error);
      }
    }
  }, [referralCodes, currentUserData, isAdmin]);

  const loadReferralCodes = async () => {
    try {
      const snap = await getDocs(collection(db, 'referralCodes'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReferralCodes(list);
    } catch (e) {
      console.error('Error fetching referral codes:', e);
    }
  };

  const handleCreateReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('추천코드를 입력해 주세요.');
      return;
    }
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      alert('추천코드는 3~20자 사이여야 합니다.');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      alert('추천코드에는 영문 대문자, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.');
      return;
    }

    setSubmittingCode(true);
    try {
      const docRef = doc(db, 'referralCodes', cleanCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert('이미 존재하는 추천코드입니다. 다른 코드를 사용해 주세요.');
        setSubmittingCode(false);
        return;
      }

      const targetPartner = allPartners.find(p => p.id === selectedPartnerId);

      await setDoc(docRef, {
        code: cleanCode,
        partnerId: selectedPartnerId || '',
        partnerCode: targetPartner ? (targetPartner.referrerCode || '') : '',
        partnerNickname: targetPartner ? (targetPartner.nickname || targetPartner.username) : '',
        memo: newMemo.trim(),
        createdAt: Date.now(),
        status: 'active'
      });

      alert(`추천코드 [${cleanCode}]가 성공적으로 생성 및 등록되었습니다!`);
      setNewCode('');
      setNewMemo('');
      setSelectedPartnerId('');
      await loadReferralCodes();
    } catch (e) {
      alert('추천코드 생성 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleDeleteReferralCode = async (codeId: string) => {
    if (!window.confirm(`정말로 추천코드 [${codeId}]를 영구 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'referralCodes', codeId));
      alert('추천코드가 삭제되었습니다.');
      await loadReferralCodes();
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleToggleCodeStatus = async (codeId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'referralCodes', codeId), {
        status: nextStatus
      });
      await loadReferralCodes();
    } catch (e) {
      alert('상태 변경 중 오류: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      // Load all custom/promotional recommendation codes regardless of role, to compile statistics
      const codesSnap = await getDocs(collection(db, 'referralCodes'));
      const activeCodesList: any[] = [];
      codesSnap.forEach((docSnap) => {
        activeCodesList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReferralCodes(activeCodesList);

      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsersList: any[] = [];
      usersSnap.forEach((docSnap) => {
        allUsersList.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (isAdmin) {
        // Filter out partners
        const partners = allUsersList.filter(u => u.isPartner === true);

        // Precompute statistics for each partner
        const compiledPartners = partners.map(partner => {
          // Collect all referral codes (original + active custom ones assigned to this partner)
          const partnerCodesSet = new Set<string>();
          if (partner.referrerCode) {
            partnerCodesSet.add(partner.referrerCode.toUpperCase());
          }
          activeCodesList.forEach((codeObj) => {
            if (codeObj.partnerId === partner.id && codeObj.status === 'active') {
              partnerCodesSet.add(codeObj.code.toUpperCase());
            }
          });

          const referrals = allUsersList.filter(u => {
            const cleanAppRef = (u.appliedReferrerCode || '').trim().toUpperCase();
            return cleanAppRef && partnerCodesSet.has(cleanAppRef);
          });
          
          let totalBet = 0;
          let totalLoss = 0;

          referrals.forEach(refUser => {
            const bets = refUser.bets || [];
            bets.forEach((bet: any) => {
              const betAmt = Number(bet.amount) || 0;
              totalBet += betAmt;
              if (bet.status === 'lose') {
                totalLoss += betAmt;
              }
            });
          });

          const currentClaimed = Number(partner.claimedPartnerPoints) || 0;
          const calculatedPotential = Math.floor(totalLoss * 0.4);
          const currentClaimable = Math.max(0, calculatedPotential - currentClaimed);

          return {
            ...partner,
            referralsCount: referrals.length,
            totalBet,
            totalLoss,
            potentialPoints: calculatedPotential,
            claimedPoints: currentClaimed,
            claimablePoints: currentClaimable
          };
        });

        setAllPartners(compiledPartners);
      } else if (currentUserData?.id) {
        // Collect all referral codes for current partner (original + active custom ones)
        const partnerCodesSet = new Set<string>();
        if (currentUserData.referrerCode) {
          partnerCodesSet.add(currentUserData.referrerCode.toUpperCase());
        }
        activeCodesList.forEach((codeObj) => {
          if (codeObj.partnerId === currentUserData.id && codeObj.status === 'active') {
            partnerCodesSet.add(codeObj.code.toUpperCase());
          }
        });

        // Filter refers
        const list = allUsersList.filter(u => {
          const cleanAppRef = (u.appliedReferrerCode || '').trim().toUpperCase();
          return cleanAppRef && partnerCodesSet.has(cleanAppRef);
        });
        
        let totalBet = 0;
        let totalLoss = 0;

        list.forEach((refUser) => {
          const bets = refUser.bets || [];
          bets.forEach((bet: any) => {
            const betAmt = Number(bet.amount) || 0;
            totalBet += betAmt;
            if (bet.status === 'lose') {
              totalLoss += betAmt;
            }
          });
        });

        setReferredUsers(list);

        const currentClaimed = Number(currentUserData.claimedPartnerPoints) || 0;
        const calculatedPotential = Math.floor(totalLoss * 0.4);
        const currentClaimable = Math.max(0, calculatedPotential - currentClaimed);

        setPartnerSummary({
          totalBetAmount: totalBet,
          totalLossAmount: totalLoss,
          potentialPoints: calculatedPotential,
          claimedPoints: currentClaimed,
          claimablePoints: currentClaimable,
          totalReferrals: list.length
        });
      }
    } catch (e) {
      console.error('Error fetching partner system data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPoints = async () => {
    const { claimablePoints } = partnerSummary;
    if (claimablePoints <= 0) {
      alert('적립 가능한 정산 포인트가 없습니다. 하위 회원의 낙첨 정산 내역을 먼저 동기화해 주세요.');
      return;
    }

    if (!window.confirm(`정말로 하위 추천회원 낙첨금 정산보약 ${claimablePoints.toLocaleString()}P를 적립하시겠습니까?\n즉시 포인트 지갑에 합산 반영됩니다.`)) {
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUserData.id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('회원 정보를 데이터베이스에서 발견할 수 없습니다.');
      }

      const freshData = userDoc.data();
      const currentPoints = freshData.points !== undefined ? Number(freshData.points) : 50000;
      const currentClaimed = freshData.claimedPartnerPoints !== undefined ? Number(freshData.claimedPartnerPoints) : 0;

      const nextPoints = currentPoints + claimablePoints;
      const nextClaimed = currentClaimed + claimablePoints;

      const partnerPointHistoryItem = {
        createdAt: Date.now(),
        type: 'partner_dividend',
        description: `하위 추천회원 낙첨금 40% 총판수수료 포인트 정산 완료`,
        amount: claimablePoints,
        balanceAfter: nextPoints
      };

      const updatedHistory = [partnerPointHistoryItem, ...(freshData.pointsHistory || [])].slice(0, 200);

      await updateDoc(userRef, {
        points: nextPoints,
        claimedPartnerPoints: nextClaimed,
        pointsHistory: updatedHistory
      });

      alert(`🎉 성공적으로 포인트 적립이 완료되었습니다!\n\n- 적립 금액: +${claimablePoints.toLocaleString()}P\n\n지급된 포인트는 사이트에서 동일하게 시뮬레이션 참여가 가능합니다.`);
      
      // Update local summaries and trigger parent refetch
      refreshUser();
      await loadPartnerData();
    } catch (e) {
      alert('포인트 적립 처리 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b0e14] border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-scale-up max-h-screen">
        
        {/* Modal Header */}
        <div className="bg-neutral-950 p-5 px-6 border-b border-amber-955 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-500 font-black tracking-wider text-sm md:text-base">
            <Award className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-sans uppercase">CHOICE PARTNER SYSTEM — 총판/파트너 관리 플랫폼</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-neutral-900"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner Alert */}
        <div className="bg-amber-950/20 border-b border-amber-900/30 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-gray-300 font-bold">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>※ 총판계정 회원은 낙첨금액의 <strong className="text-amber-400 text-sm">40%</strong>를 수수료로 즉시 적립하며, 이벤트 보너스 등 일반 혜택 및 출석보상은 제한됩니다.</span>
          </div>
          <button 
            onClick={loadPartnerData}
            className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-2.5 py-1 rounded transition text-[11px] cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> 데이터 정밀 갱신
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {isAdmin ? (
            /* ========================================================
               OPERATOR / ADMIN VIEW (ALL DISTRIBUTORS)
               ======================================================== */
            <div className="space-y-4 font-sans">
              {/* Admin Subtabs */}
              <div className="flex border-b border-neutral-800 gap-1 pb-px">
                <button
                  type="button"
                  onClick={() => setAdminSubTab('stats')}
                  className={`px-4 py-2 text-xs font-black rounded-t-lg transition flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'stats'
                      ? 'bg-[#18130c] border border-amber-500/30 border-b-transparent text-amber-500'
                      : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  총판별 실적 통계
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab('codes')}
                  className={`px-4 py-2 text-xs font-black rounded-t-lg transition flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'codes'
                      ? 'bg-[#18130c] border border-amber-500/30 border-b-transparent text-amber-500'
                      : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  추천가입코드 발급 및 관리
                </button>
              </div>

              {adminSubTab === 'stats' ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
                    <div>
                      <h3 className="text-white font-black text-sm">전체 총판 협력자 계정 목록</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">시스템 내부의 모든 파트너 인공지능/실시간 실적 통계 리스트입니다.</p>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="총판 닉네임 또는 코드 검색..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-amber-550 text-xs"
                      />
                    </div>
                  </div>

                  {loading && allPartners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                      <p className="text-gray-400 text-xs">최신 파트너 실적 데이터를 실시간 합산 연산하는 중입니다...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-800/80 rounded-xl bg-black/30">
                      <table className="w-full text-center text-xs text-gray-300">
                        <thead className="bg-neutral-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-800 font-bold">
                          <tr>
                            <th className="p-3 text-left pl-5">회원정보 (아이디/닉네임)</th>
                            <th className="p-3 text-center">나의 추천코드</th>
                            <th className="p-3 text-center font-mono">가입한 추천 회원</th>
                            <th className="p-3 text-right">추천인 총 베팅액</th>
                            <th className="p-3 text-right">추천인 총 낙첨액</th>
                            <th className="p-3 text-right text-amber-400">정산배분율</th>
                            <th className="p-3 text-right text-emerald-400">기수령 정산금</th>
                            <th className="p-3 text-right text-amber-400">적립 대기 수수료</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60 font-mono text-xs">
                          {allPartners
                            .filter(p => {
                              const qStr = searchQuery.toLowerCase();
                              return (p.username || '').toLowerCase().includes(qStr) || 
                                     (p.nickname || '').toLowerCase().includes(qStr) ||
                                     (p.referrerCode || '').toLowerCase().includes(qStr);
                            })
                            .map((partner) => (
                              <tr key={partner.id} className="hover:bg-neutral-900/25 transition">
                                <td className="p-3 text-left pl-5 font-sans">
                                  <span className="text-white font-extrabold block">{partner.username}</span>
                                  <span className="text-amber-500 font-medium text-[10px] block">{partner.nickname || '-'}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-amber-950/60 border border-amber-900/40 text-amber-440 px-2 py-0.5 rounded text-[10px] font-black">
                                    {partner.referrerCode || '-'}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-extrabold text-blue-400 font-sans">
                                  {partner.referralsCount}명
                                </td>
                                <td className="p-3 text-right text-gray-300">
                                  {(partner.totalBet || 0).toLocaleString()}원
                                </td>
                                <td className="p-3 text-right text-rose-500 font-extrabold">
                                  {(partner.totalLoss || 0).toLocaleString()}원
                                </td>
                                <td className="p-3 text-right text-amber-400 font-extrabold">
                                  40%
                                </td>
                                <td className="p-3 text-right text-emerald-400 font-bold">
                                  {(partner.claimedPoints || 0).toLocaleString()}P
                                </td>
                                <td className="p-3 text-right font-black text-amber-400 text-[13px]">
                                  {(partner.claimablePoints || 0).toLocaleString()}P
                                </td>
                              </tr>
                            ))}
                          {allPartners.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-16 text-center text-gray-500 font-bold">
                                현재 데이터베이스 상에 총판계정으로 등록된 회원이 존재하지 않습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in text-gray-300">
                  {/* Create Referral Code Form */}
                  <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 space-y-4">
                    <h4 className="text-amber-400 font-extrabold text-sm flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-amber-400" /> 신규 가입 추천코드 발급
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Code Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-400 font-bold block">추천인 가입코드 (영대문자, 숫자, 3~20자)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="예: BEST365, PLATFORM"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            className="w-full bg-black border border-neutral-800 text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
                              setNewCode(rand);
                            }}
                            className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-gray-200 px-3 py-2 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer hover:border-neutral-700"
                          >
                            랜덤 생성
                          </button>
                        </div>
                      </div>

                      {/* Partner Select Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-400 font-bold block">수수료 연동 총판계정 선택 (선택)</label>
                        <select
                          value={selectedPartnerId}
                          onChange={(e) => setSelectedPartnerId(e.target.value)}
                          className="w-full bg-black border border-neutral-800 text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-550 font-sans"
                        >
                          <option value="">-- 총판 미연동 (일반 홍보 코드) --</option>
                          {allPartners.map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.nickname || partner.username} ({partner.referrerCode || '코드 없음'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Memo Field */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-gray-400 font-bold block">관리자 식별용 설명/메모</label>
                        <input
                          type="text"
                          placeholder="예: 구글 광고 홍보용 전용 가입코드"
                          value={newMemo}
                          onChange={(e) => setNewMemo(e.target.value)}
                          className="w-full bg-black border border-neutral-800 text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-550"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleCreateReferralCode}
                        disabled={submittingCode}
                        className="bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-black font-black text-xs px-5 py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3px]" /> 공식 추천코드 생성 및 즉시 활성화
                      </button>
                    </div>
                  </div>

                  {/* Registered Recommendation Codes Table */}
                  <div className="space-y-3 font-sans">
                    <h4 className="text-white font-bold text-xs flex items-center gap-1.5 pl-1">
                      <Link className="w-3.5 h-3.5 text-amber-500" /> 운영진 발급 추천코드 관리 데이터베이스 ({referralCodes.length}건)
                    </h4>

                    <div className="overflow-x-auto border border-neutral-800/85 rounded-xl bg-black/30">
                      <table className="w-full text-center text-xs text-gray-300">
                        <thead className="bg-[#0e1117] text-gray-400 uppercase text-[10px] tracking-wider border-b border-neutral-850 font-bold">
                          <tr>
                            <th className="p-3 text-left pl-6">구분 (가입코드)</th>
                            <th className="p-3 text-center">수혜 지정 총판</th>
                            <th className="p-3 text-center">총판 고유코드</th>
                            <th className="p-3 text-left font-sans">비고 및 설명</th>
                            <th className="p-3 text-center">발급 시간</th>
                            <th className="p-3 text-center">현재 가동 상태</th>
                            <th className="p-3 text-center pr-6">행동</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60 text-xs">
                          {referralCodes.map((codeItem) => (
                            <tr key={codeItem.id} className="hover:bg-neutral-900/20 transition font-mono leading-normal text-gray-300">
                              <td className="p-3 text-left pl-6 text-amber-400 font-extrabold tracking-wider text-sm flex items-center gap-1.5">
                                <span className="bg-amber-950/40 text-amber-440 px-2 py-0.5 rounded text-[11px] border border-amber-900/40">{codeItem.code}</span>
                              </td>
                              <td className="p-3 text-center text-white font-black font-sans">
                                {codeItem.partnerNickname ? (
                                  <span className="text-sky-400">{codeItem.partnerNickname}</span>
                                ) : (
                                  <span className="text-gray-500 font-medium font-sans">본사 일반코드</span>
                                )}
                              </td>
                              <td className="p-3 text-center text-emerald-400 font-extrabold">
                                {codeItem.partnerCode || <span className="text-gray-600">-</span>}
                              </td>
                              <td className="p-3 text-left text-gray-400 font-sans max-w-sm truncate" title={codeItem.memo}>
                                {codeItem.memo || <span className="text-gray-600 font-medium">-</span>}
                              </td>
                              <td className="p-3 text-center text-gray-500 text-[10px] font-sans">
                                {codeItem.createdAt ? new Date(codeItem.createdAt).toLocaleString() : '-'}
                              </td>
                              <td className="p-3 text-center font-sans">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCodeStatus(codeItem.id, codeItem.status)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer select-none ${
                                    codeItem.status === 'active'
                                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/40 font-bold'
                                      : 'bg-red-950/40 text-red-405 border-red-900/40 hover:bg-red-900/40 font-bold'
                                  }`}
                                >
                                  {codeItem.status === 'active' ? '사용 중 (Active)' : '일시정지 (Disabled)'}
                                </button>
                              </td>
                              <td className="p-3 text-center font-sans pr-6">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReferralCode(codeItem.id)}
                                  className="text-red-400 hover:text-white p-1.5 rounded bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 transition cursor-pointer"
                                  title="코드 폐기 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-400" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {referralCodes.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-16 text-center text-gray-500 font-bold font-sans">
                                현재 본사에서 직접 발급한 파트너용 추천가입코드가 존재하지 않습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================
               REGULAR PARTNER / DISTRIBUTOR VIEW
               ======================================================== */
            <div className="space-y-6">
              
              {/* Partner Dashboard Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: My referral code */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">나의 고유 추천코드</span>
                    <strong className="text-lg sm:text-xl font-mono text-amber-400 font-black tracking-wider block truncate">
                      {currentUserData?.referrerCode || '미발급'}
                    </strong>
                    {referralCodes.filter(c => c.partnerId === currentUserData?.id && c.status === 'active').length > 0 && (
                      <div className="text-[9px] text-gray-400 font-bold mt-1.5 bg-black/40 border border-neutral-850 px-2 py-1 rounded inline-block max-w-full truncate">
                        연동: <span className="text-amber-400 font-extrabold truncate">{referralCodes.filter(c => c.partnerId === currentUserData?.id && c.status === 'active').map(c => c.code).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 self-center">
                    <Award className="w-5 h-5 flex-shrink-0" />
                  </div>
                </div>

                {/* Card 2: Referrals Count */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">가입 추천 회원</span>
                    <strong className="text-lg sm:text-xl font-mono text-sky-400 font-black tracking-wide block truncate">
                      {partnerSummary.totalReferrals}명
                    </strong>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0 text-sky-450">
                    <Users className="w-5 h-5 flex-shrink-0" />
                  </div>
                </div>

                {/* Card 3: Total betting & loss amounts */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">추천 회원 총 낙첨금</span>
                    <strong className="text-lg sm:text-xl font-mono text-rose-500 font-black block truncate">
                      {(partnerSummary.totalLossAmount / 10000).toFixed(1)}만원
                    </strong>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-450">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                  </div>
                </div>

                {/* Card 4: Claimed points */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">기수령 정산 수수료</span>
                    <strong className="text-lg sm:text-xl font-mono text-emerald-400 font-black block truncate">
                      {(partnerSummary.claimedPoints / 10000).toFixed(1)}만P
                    </strong>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-450">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  </div>
                </div>

              </div>

              {/* Commission Accumulation Container Box */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-neutral-950 via-[#18130c] to-neutral-950 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-550/10 border border-amber-500/30 text-amber-400 text-[10px] font-black">
                    <Coins className="w-3 h-3 text-amber-500" />
                    REAL-TIME INCOME SETTLEMENT
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white">
                    현재 실시간 수령 대기 수수료: <span className="text-amber-400 text-xl md:text-2xl font-mono font-black">{(partnerSummary.claimablePoints).toLocaleString()}P</span>
                  </h3>
                  <p className="text-xs text-gray-400 leading-normal max-w-xl">
                    하위 등록 회원들의 실시간 베팅 낙첨 손실금액 40%를 합산 전산화하여 산출한 배당수수료입니다. 아래의 버튼을 누르시면 즉시 포인트 지갑에 누적 적립됩니다.
                  </p>
                </div>
                <button
                  onClick={handleClaimPoints}
                  disabled={partnerSummary.claimablePoints <= 0 || loading}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-black font-extrabold text-sm rounded-xl shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:scale-[1.03] active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:hover:from-amber-500 transition cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
                >
                  <Coins className="w-4 h-4 text-black animate-bounce" /> 포인트 지갑으로 즉시 적립받기
                </button>
              </div>

              {/* Referred Members Detailed Stats */}
              <div className="space-y-3 font-sans">
                <h4 className="text-white font-bold text-sm">내 추천코드로 가입한 하위 회원 리스트 ({partnerSummary.totalReferrals}명)</h4>
                
                {referredUsers.length === 0 ? (
                  <div className="w-full text-center text-gray-500 py-20 border border-dashed border-neutral-800 rounded-2xl">
                    가입한 하위 회원이 없습니다. 나의 추천코드를 홍보하여 파트너 수익을 실현하세요!
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-neutral-850 rounded-xl bg-black/40">
                    <table className="w-full text-center text-xs text-gray-300">
                      <thead className="bg-[#0b0e14] border-b border-neutral-850 text-gray-400 text-[10px] tracking-wider uppercase font-extrabold whitespace-nowrap">
                        <tr>
                          <th className="p-3 text-left pl-4">아이디</th>
                          <th className="p-3 text-center">닉네임</th>
                          <th className="p-3 text-center">배팅액</th>
                          <th className="p-3 text-center text-rose-500">낙첨액</th>
                          <th className="p-3 text-right text-amber-400 pr-4">수수료(40%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/40 whitespace-nowrap">
                        {referredUsers.map((user) => {
                          const bets = user.bets || [];
                          let uTotalLoss = 0;
                          let uTotalBet = 0;

                          bets.forEach((bet: any) => {
                            const amt = Number(bet.amount) || 0;
                            uTotalBet += amt;
                            if (bet.status === 'lose') {
                              uTotalLoss += amt;
                            }
                          });

                          return (
                            <tr key={user.id} className="hover:bg-neutral-905/30 transition text-[11px] font-mono leading-normal">
                              <td className="p-3 text-left pl-4 font-sans text-white font-bold truncate max-w-[80px]">{user.username}</td>
                              <td className="p-3 text-center font-sans text-sky-400 font-semibold truncate max-w-[80px]">{user.nickname || '-'}</td>
                              <td className="p-3 text-center text-emerald-450 font-bold">
                                {(uTotalBet / 10000).toFixed(1)}만
                              </td>
                              <td className="p-3 text-center text-rose-500 font-extrabold">
                                {(uTotalLoss / 10000).toFixed(1)}만
                              </td>
                              <td className="p-3 text-right text-amber-400 font-black pr-4 text-xs">
                                {(Math.floor(uTotalLoss * 0.4) / 10000).toFixed(1)}만P
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-950 p-4 px-6 border-t border-amber-955 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            CHOICE SECURITY & PARTNERSHIP
          </span>
          <button 
            onClick={onClose}
            className="bg-neutral-800 hover:bg-[#1a1c22] border border-neutral-700/60 hover:text-white text-gray-300 font-bold px-5 py-2.5 rounded-lg cursor-pointer transition text-xs"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
