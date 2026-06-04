import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AttendanceCalendarProps {
  userId: string;
}

export default function AttendanceCalendar({ userId }: AttendanceCalendarProps) {
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("AttendanceChecker mounted with userId:", userId);
    if (userId) {
      fetchAttendance();
    }
  }, [userId]);

  const fetchAttendance = async () => {
    if (!userId) {
      console.log("No userId, skipping fetchAttendance");
      return;
    }
    setLoading(true);
    console.log("Fetching attendance for userId:", userId);
    try {
      const docRef = doc(db, 'attendance', userId);
      console.log("Checking doc reference:", docRef.path);
      const attendanceDoc = await getDoc(docRef);
      if (attendanceDoc.exists()) {
        console.log("Document exists:", attendanceDoc.data());
        setAttendedDates(new Set(attendanceDoc.data().dates || []));
      } else {
        console.log("Document does not exist for:", userId);
      }
    } catch (e) {
      console.error('Error fetching attendance:', e);
      alert('출석체크 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceCheck = async () => {
    if (!userId) {
      alert('로그인 정보가 없습니다.');
      return;
    }
    // Check for charge history in last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Assuming we have a 'depositRequests' collection where we can check for approved deposits
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
      alert('최근 24시간 이내 충전 이력이 없습니다. 충전 후 다시 시도해주세요.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (attendedDates.has(todayStr)) {
      alert('이미 오늘 출석체크를 완료했습니다.');
      return;
    }

    // Mark attendance
    const newAttendedDates = new Set(attendedDates).add(todayStr);
    try {
      await setDoc(doc(db, 'attendance', userId), { dates: Array.from(newAttendedDates) }, { merge: true });
      setAttendedDates(newAttendedDates);
      alert('출석체크가 완료되었습니다!');
    } catch (e) {
      console.error('Error updating attendance:', e);
      alert('출석체크에 실패했습니다.');
    }
  };

  const renderCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    const days = [];

    // Add empty cells for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`padding-${i}`} className="p-2 border border-neutral-800 bg-neutral-950"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push(
            <div key={i} className={`p-2 border border-neutral-800 ${attendedDates.has(dateStr) ? 'bg-amber-900/50' : 'bg-neutral-900'}`}>
                {i}
                {attendedDates.has(dateStr) && <div className="text-amber-400 text-xs mt-1">출석</div>}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="bg-black border border-red-600/50 p-6 rounded-xl text-white">
      <h2 className="text-xl font-black mb-4">출석체크</h2>
      <button 
        onClick={handleAttendanceCheck}
        className="bg-amber-600 hover:bg-amber-500 text-black font-black px-4 py-2 rounded-lg mb-6"
      >
        오늘 출석하기
      </button>

      <div className="grid grid-cols-7 gap-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="text-center text-gray-500">{d}</div>)}
        {renderCalendar()}
      </div>
    </div>
  );
}
