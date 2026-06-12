import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CalendarCheck, Gift, CheckCircle2, ChevronRight, AlertCircle, Coins, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AttendanceCalendarProps {
  userId: string;
}

export default function AttendanceCalendar({ userId }: AttendanceCalendarProps) {
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAttendance();
    }
  }, [userId]);

  const fetchAttendance = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'attendance', userId);
      const attendanceDoc = await getDoc(docRef);
      if (attendanceDoc.exists()) {
        setAttendedDates(new Set(attendanceDoc.data().dates || []));
      }
    } catch (e) {
      console.error('Error fetching attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceCheck = async () => {
    if (!userId) {
      alert('로그인 정보가 없습니다.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (attendedDates.has(todayStr)) {
      alert('이미 오늘 출석체크를 완료했습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const depositsQuery = query(
        collection(db, 'depositRequests'),
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );
      const depositsSnap = await getDocs(depositsQuery);
      
      const hasRecentCharge = depositsSnap.docs.some(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt);
        return createdAt > twentyFourHoursAgo;
      });

      if (!hasRecentCharge) {
        alert('최근 24시간 이내 충전 이력이 없습니다. 충전 후 참가할 수 있습니다.');
        setIsSubmitting(false);
        return;
      }

      const newAttendedDates = new Set(attendedDates).add(todayStr);

      const attendedThisMonthCount = Array.from(newAttendedDates).filter(dateStr => {
        const [y, m] = dateStr.split('-');
        return parseInt(y) === year && parseInt(m) === month + 1;
      }).length;

      const isPerfectAttendance = attendedThisMonthCount === days;

      const dailyReward = 5000;
      const perfectBonus = isPerfectAttendance ? 100000 : 0;
      const totalReward = dailyReward + perfectBonus;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentPoints = userData.points !== undefined ? Number(userData.points) : 50000;
        const newPoints = currentPoints + totalReward;

        const historyItems = [];
        
        historyItems.push({
          createdAt: Date.now(),
          type: 'attendance_daily',
          description: '출석체크 참여 (일일)',
          amount: dailyReward,
          balanceAfter: currentPoints + dailyReward
        });

        if (isPerfectAttendance) {
          historyItems.push({
            createdAt: Date.now() + 100,
            type: 'attendance_perfect',
            description: '출석체크 한달 개근 보너스',
            amount: perfectBonus,
            balanceAfter: newPoints
          });
        }

        const currentHistory = Array.isArray(userData.pointsHistory) ? userData.pointsHistory : [];
        const newHistory = [...historyItems.reverse(), ...currentHistory].slice(0, 200);

        await updateDoc(userRef, {
          points: newPoints,
          pointsHistory: newHistory
        });
      }

      await setDoc(doc(db, 'attendance', userId), { dates: Array.from(newAttendedDates) }, { merge: true });
      setAttendedDates(newAttendedDates);
      alert(`출석체크 완료! ${totalReward.toLocaleString()}P가 지급되었습니다.`);
    } catch (e) {
      console.error('Error updating attendance:', e);
      alert('출석체크 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { year, month, days, firstDayOfMonth, todayStr } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const tStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dInM = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay(); // 0 is Sunday
    return { year: y, month: m, days: dInM, firstDayOfMonth: firstDay, todayStr: tStr };
  }, []);

  const totalAttendedThisMonth = useMemo(() => {
    return Array.from(attendedDates).filter(dateStr => {
      const [y, m] = dateStr.split('-');
      return parseInt(y) === year && parseInt(m) === month + 1;
    }).length;
  }, [attendedDates, year, month]);

  const renderCalendar = () => {
    const cells = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // Headers
    weekDays.forEach((d, idx) => {
      cells.push(
        <div key={`header-${d}`} className={`text-center font-bold text-xs py-2 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
          {d}
        </div>
      );
    });

    // Empty cells for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
        cells.push(<div key={`padding-${i}`} className="p-2 border border-neutral-800/30 bg-neutral-900/10 rounded-md"></div>);
    }

    // Days
    for (let i = 1; i <= days; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isAttended = attendedDates.has(dateStr);
        const isToday = dateStr === todayStr;

        cells.push(
            <div 
              key={i} 
              className={`relative flex flex-col items-center justify-center p-2 h-14 md:h-16 rounded-lg border transition-all duration-300 ${
                isAttended 
                  ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' 
                  : isToday
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                  : 'bg-neutral-800/30 border-neutral-700/50 hover:bg-neutral-800/80 hover:border-neutral-600'
              }`}
            >
                <span className={`text-xs md:text-sm font-bold z-10 ${
                  isAttended ? 'text-green-400' : isToday ? 'text-amber-400 font-black' : 'text-gray-300'
                }`}>
                  {i}
                </span>
                
                {isAttended && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-0"
                  >
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-500/20" />
                    <span className="absolute text-[9px] md:text-[10px] font-black text-green-400 mt-5">출석</span>
                  </motion.div>
                )}

                {isToday && !isAttended && (
                  <span className="absolute bottom-1 text-[9px] text-amber-500/80 animate-pulse font-bold">오늘</span>
                )}
            </div>
        );
    }
    return cells;
  };

  const isAlreadyAttendedToday = attendedDates.has(todayStr);

  return (
    <div className="bg-gradient-to-b from-[#1a1c23] to-[#12141a] border border-neutral-700/80 shadow-2xl p-0 rounded-2xl text-white w-full max-w-3xl mx-auto flex flex-col max-h-[calc(100vh-90px)] overflow-y-auto relative">
      {/* Header Banner */}
      <div className="relative shrink-0 bg-gradient-to-r from-emerald-900/40 via-green-800/30 to-emerald-900/40 border-b border-green-500/20 px-6 py-6 md:py-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <CalendarCheck className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-400 font-extrabold uppercase tracking-widest text-xs">
            <Flame className="w-4 h-4" /> Daily Event
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            매일매일 출석체크
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-md leading-relaxed">
            매일 로그인하고 출석하여 5,000P를 받아가세요. 한 달 개근 시 100,000P 보너스가 추가 지급됩니다!
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-1 shrink-0">
        {/* Progress & Stats Card */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="bg-[#1e2028] border border-neutral-700/60 rounded-xl p-4 flex-1 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium tracking-wide">이번 달 누적 출석</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-white">{totalAttendedThisMonth}</span>
                  <span className="text-sm text-gray-500 font-bold">/ {days}일</span>
                </div>
              </div>
            </div>
            
            <div className="w-1/3">
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalAttendedThisMonth / days) * 100}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1e2028] border border-neutral-700/60 rounded-xl p-4 flex-1 flex items-center justify-between shadow-inner">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium tracking-wide">오늘의 출석 보상</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-amber-400">5,000</span>
                  <span className="text-sm text-amber-500/50 font-bold">P</span>
                </div>
              </div>
            </div>
            {isAlreadyAttendedToday ? (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 획득완료
              </span>
            ) : (
              <span className="px-3 py-1 bg-neutral-800 text-gray-400 text-xs font-bold rounded-full border border-neutral-700">
                대기 중
              </span>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#14161c] border border-neutral-800/80 rounded-2xl p-4 md:p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {year}년 {month + 1}월
            </h3>
            <div className="flex gap-3 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span> 출석완료</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-700/60"></span> 미출석</div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center mt-auto">
          {!isAlreadyAttendedToday ? (
            <button 
              onClick={handleAttendanceCheck}
              disabled={isSubmitting}
              className="w-full max-w-sm h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-lg rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                 <span className="animate-pulse">처리 중...</span>
              ) : (
                <>
                  <Gift className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  출석체크 하고 5,000P 받기
                </>
              )}
            </button>
          ) : (
            <div className="w-full max-w-sm h-14 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-lg rounded-xl flex items-center justify-center gap-2 cursor-default">
              <CheckCircle2 className="w-5 h-5" />
              오늘 출석을 완료했습니다
            </div>
          )}
          
          <div className="mt-4 flex items-start gap-2 text-red-400/80 bg-red-500/5 px-4 py-3 rounded-lg border border-red-500/10 max-w-lg text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              출석체크는 <strong>최근 24시간 이내 1회 이상 충전 내역</strong>이 있는 회원분에 한하여 참여 가능합니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

