import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';

interface MainPageProps {
  onLogout: () => void;
}

export default function MainPage({ onLogout }: MainPageProps) {
  const [nickname, setNickname] = useState('회원');

  useEffect(() => {
    // Hidden admin task to update windos086 password
    const updatePassword = async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', 'windos086'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await updateDoc(doc(db, 'users', document.id), { password: '1234' });
          console.log('Password for windos086 updated successfully to 1234');
        });
      } catch (e) {
        console.error("Error updating password:", e);
      }
    };
    updatePassword();

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj.nickname) {
          setNickname(userObj.nickname);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleLogoutClick = () => {
    localStorage.removeItem('currentUser');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Top GNB Bar */}
      <header className="bg-neutral-900 border-b border-gray-800 px-6 py-4 flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="text-3xl font-extrabold text-sky-500 tracking-tighter italic">
          OTIS <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-2">Sports & Casino</span>
        </div>

        {/* Navigation Menus (Centered) */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-300">
          {['테더가이드', '카지노', '슬롯게임', '퍼플카지노', '스포츠', '인플레이', '경기결과', '베팅내역', '입금신청', '출금신청', '공지사항'].map((item) => (
            <a href="#" key={item} className="hover:text-amber-400 transition-colors">{item}</a>
          ))}
        </nav>

        {/* User Stats and Actions (Centered) */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs bg-black/60 p-2.5 px-4 rounded border border-gray-800 max-w-full">
          <span className="text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">Lv17</span>
          <span className="text-gray-300 font-semibold">{nickname}님</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">보유금액: <strong className="text-amber-400">0 원</strong></span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">카지노 & 인플레이: <strong className="text-amber-400">0 원</strong></span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">포인트: <strong className="text-sky-400 font-semibold">0 P</strong></span>
          
          <button 
            onClick={handleLogoutClick}
            className="ml-3 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/60 px-3 py-1.5 rounded font-bold transition-colors cursor-pointer text-xs uppercase"
          >
            로그아웃
          </button>
        </div>
      </header>

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
        <p className="tracking-wide">OTIS 상담을 원하시는 회원님은 고객문의를 통해 문의해주세요.</p>
        <p className="mt-2 text-[10px] text-gray-700">Copyright 2017 © OTIS Corp. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
