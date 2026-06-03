import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Shield, Users, Database, X, RefreshCw, Edit, Save, Trash2, Search } from 'lucide-react';

interface MainPageProps {
  onLogout: () => void;
}

export default function MainPage({ onLogout }: MainPageProps) {
  const [nickname, setNickname] = useState('회원');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // State for user editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingWallet, setEditingWallet] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingWithdrawalPassword, setEditingWithdrawalPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for My Page
  const [showMyPage, setShowMyPage] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [showMiniGameSubmenu, setShowMiniGameSubmenu] = useState(false);
  const miniGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeMiniGameTab, setActiveMiniGameTab] = useState<'powerball5' | 'powerball3' | 'ladder5' | 'daridari3'>('powerball5');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const openMiniGameSubmenu = () => {
    if (miniGameTimeoutRef.current) clearTimeout(miniGameTimeoutRef.current);
    setShowMiniGameSubmenu(true);
  };

  const closeMiniGameSubmenu = () => {
    miniGameTimeoutRef.current = setTimeout(() => {
      setShowMiniGameSubmenu(false);
    }, 400); 
  };

  // Dynamic user wallet balances connected to Firestore DB
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userPoints, setUserPoints] = useState<number>(0);

  // States for administrative editing
  const [editingBalance, setEditingBalance] = useState<number>(5000000);
  const [editingPoints, setEditingPoints] = useState<number>(50000);

  useEffect(() => {
    // Check currently logged in user details
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setCurrentUser(userObj);
        if (userObj.nickname) {
          setNickname(userObj.nickname);
        }
        // Designate windo086 or windos086 as admin/operator
        if (userObj.username === 'windo086' || userObj.username === 'windos086') {
          setIsAdmin(true);
        }

        // Synchronize dynamic balances on boot
        const fetchUserMainDoc = async () => {
          try {
            const q = query(collection(db, 'users'), where('username', '==', userObj.username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              const data = docSnap.data();
              const bal = data.balance !== undefined ? data.balance : 5000000;
              const pts = data.points !== undefined ? data.points : 50000;
              
              if (data.balance === undefined || data.points === undefined) {
                await updateDoc(doc(db, 'users', docSnap.id), {
                  balance: bal,
                  points: pts
                });
              }
              setUserBalance(bal);
              setUserPoints(pts);
              setCurrentUserData({ id: docSnap.id, ...data, balance: bal, points: pts });
            }
          } catch (e) {
            console.error("Error matching profile info: ", e);
          }
        };
        fetchUserMainDoc();
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Fetch updated user data when opening My Page or syncing stats
  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        try {
          const q = query(collection(db, 'users'), where('username', '==', currentUser.username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            const bal = data.balance !== undefined ? data.balance : 5000000;
            const pts = data.points !== undefined ? data.points : 50000;
            
            setUserBalance(bal);
            setUserPoints(pts);
            setCurrentUserData({ id: docSnap.id, ...data, balance: bal, points: pts });
          }
        } catch (e) {
          console.error("Error fetching user data:", e);
        }
      };
      fetchUserData();
    }
  }, [showMyPage, showMiniGame, currentUser]);

  // Fetch registered users for administrative action
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminUsers(list);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAdminPanel) {
      loadAllUsers();
    }
  }, [showAdminPanel]);

  const handleStartEdit = (user: any) => {
    setEditingUserId(user.id);
    setEditingNickname(user.nickname || '');
    setEditingWallet(user.tetherWalletAddress || '');
    setEditingPassword(user.password || '');
    setEditingWithdrawalPassword(user.withdrawalPassword || '');
    setEditingBalance(user.balance !== undefined ? user.balance : 5000000);
    setEditingPoints(user.points !== undefined ? user.points : 50000);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      const nextBal = Number(editingBalance) || 0;
      const nextPts = Number(editingPoints) || 0;
      
      await updateDoc(doc(db, 'users', userId), {
        nickname: editingNickname,
        tetherWalletAddress: editingWallet,
        password: editingPassword,
        withdrawalPassword: editingWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      });
      
      setAdminUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        nickname: editingNickname, 
        tetherWalletAddress: editingWallet,
        password: editingPassword,
        withdrawalPassword: editingWithdrawalPassword,
        balance: nextBal,
        points: nextPts
      } : u));

      // Sync local profile state if editing self
      if (currentUserData && currentUserData.id === userId) {
        setUserBalance(nextBal);
        setUserPoints(nextPts);
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

  const handleLogoutClick = () => {
    localStorage.removeItem('currentUser');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Top GNB Bar */}
      <header className="bg-neutral-900 border-b border-gray-800 px-6 py-4 flex flex-col items-center gap-4 relative">
        {/* Admin Menu Switch for Operators (Top Right on desktop) */}
        {isAdmin && (
          <div className="sm:absolute sm:top-5 sm:right-6 mt-1 sm:mt-0 z-30">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold px-3.5 py-2 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/30 text-xs transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 animate-pulse text-red-150" />
              어드민 관리자 메뉴
            </button>
          </div>
        )}

        {/* Logo */}
        <button 
          onClick={() => {
            setShowMyPage(false);
            setShowMiniGame(false);
          }}
          className="text-3xl font-extrabold text-red-600 tracking-tighter italic cursor-pointer relative pt-3 pb-1"
        >
          <span className="inline-flex items-center">
            <span className="relative inline-block mr-0.5">
              {/* Redesigned brilliant gold crown scaled perfectly above slanted 'C' */}
              <svg 
                className="absolute -top-[15px] left-1/2 -translate-x-[35%] w-5.5 h-4.5 text-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.6)] mt-[5px] mr-0 mb-0" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 5l3.5 6 5.5-4-2.5 10H5.5L3 7l5.5 4z" />
                <circle cx="12" cy="4" r="1.2" fill="#fef08a" />
                <circle cx="3" cy="6" r="1.2" fill="#fef08a" />
                <circle cx="21" cy="6" r="1.2" fill="#fef08a" />
              </svg>
              <span>C</span>
            </span>
            <span>HOICE</span>
            <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-3 border-l border-neutral-700/60 pl-3">Sports & Casino</span>
          </span>
        </button>

        {/* Navigation Menus (Centered) */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-300">
          {['테더가이드', '스포츠', '미니게임', '인플레이', '경기결과', '베팅내역', '입금신청', '출금신청', '공지사항'].map((item) => {
            if (item === '미니게임') {
              return (
                <div 
                  key={item}
                  className="relative"
                  onMouseEnter={openMiniGameSubmenu}
                  onMouseLeave={closeMiniGameSubmenu}
                >
                  <button 
                    onClick={() => setShowMiniGameSubmenu(prev => !prev)}
                    className="hover:text-amber-400 transition-colors"
                  >
                    미니게임
                  </button>
                  {showMiniGameSubmenu && (
                    <div 
                      className="absolute top-full left-0 w-32 bg-neutral-800 border border-neutral-700 rounded shadow-xl mt-1 z-[999] overflow-hidden p-1 space-y-1"
                      onMouseEnter={openMiniGameSubmenu}
                      onMouseLeave={closeMiniGameSubmenu}
                    >
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball5'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        N파워볼 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('powerball3'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        N파워볼 (3분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('ladder5'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        사다리 (5분)
                      </button>
                      <button 
                        onClick={() => { setActiveMiniGameTab('daridari3'); setShowMiniGame(true); setShowMiniGameSubmenu(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs transition rounded"
                      >
                        다리다리 (3분)
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button 
                key={item} 
                onClick={() => {
                  alert(`${item} 기능은 준비 중입니다.`);
                }}
                className="hover:text-amber-400 transition-colors"
              >
                {item}
              </button>
            );
          })}
        </nav>

        {/* User Stats and Actions (Centered with individual pill styling from the screenshot) */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs w-full max-w-full my-1 select-none">
          {/* Level & Nickname Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-extrabold">Lv17</span>
            <span className="text-white font-bold">{nickname}님</span>
          </div>

          {/* Holdings Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">보유금액</span>
            <span className="text-white font-bold">{userBalance.toLocaleString()} 원</span>
          </div>

          {/* Points Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">포인트</span>
            <span className="text-white font-bold">{userPoints.toLocaleString()} P</span>
          </div>

          {/* Messages Box */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3.5 py-1.5 rounded border border-neutral-800 shadow-md">
            <span className="text-amber-400 font-bold">받은 쪽지</span>
            <span className="text-white font-bold">0 개</span>
          </div>

          {/* My Page Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => setShowMyPage(true)}
          >
            My Page
          </button>

          {/* Attendance Calendar Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => alert('출석달력 준비 중입니다.')}
          >
            출석달력
          </button>

          {/* Customer Center Button */}
          <button 
            type="button"
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#263e5e] hover:to-[#132030] text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
            onClick={() => alert('고객센터 준비 중입니다.')}
          >
            고객센터
          </button>

          {/* Logout Button */}
          <button 
            type="button"
            onClick={handleLogoutClick}
            className="bg-gradient-to-b from-[#1c2e46] to-[#0b131d] border border-[#2d4766] hover:from-[#3a1a1a] hover:to-[#1c0b0b] hover:border-[#5c2a2a] hover:text-red-400 text-[#cfdbe9] px-4 py-1.5 rounded font-bold transition-all shadow-md cursor-pointer text-xs"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Conditional Rendering: My Page vs Mini Game vs Dashboard */}
      {showMyPage ? (
        <div className="flex-1 p-8 max-w-2xl w-full mx-auto">
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowMyPage(false)} className="hover:text-white">마이페이지</button> &gt; 회원정보수정
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-center mb-8">회원정보 수정</h2>
            <div className="bg-neutral-800 p-4 rounded text-center text-sm text-gray-300 mb-8">
              {currentUser?.username}님의 회원정보 수정입니다. 아이디와 비밀번호 보안에 신경써주십시오.
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">아이디</label>
                <span className="text-amber-400 font-bold">{currentUser?.username}</span>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">비밀번호</label>
                <div className="flex-1">
                  <span className="text-gray-400 p-2">비밀번호 변경은 운영자에게 문의해주십시오.</span>
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">출금 비밀번호</label>
                <div className="flex-1">
                  {currentUserData?.withdrawalPassword ? (
                    <div className="text-gray-400 p-2">이미 설정되었습니다.</div>
                  ) : (
                    <>
                      <input 
                        type="password" 
                        value={withdrawalPassword} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 6) setWithdrawalPassword(val);
                        }}
                        placeholder="최초 1회 설정"
                        className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-white" 
                      />
                      <p className="text-xs text-gray-500 mt-1">최초 1회 설정: 숫자 4~6자리로 입력해주세요.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="border-b border-gray-700" />
              
              <div className="flex items-center gap-8">
                <label className="w-24 text-gray-400">닉네임</label>
                <div className="flex-1">
                  <input type="text" disabled value={nickname} className="w-full bg-neutral-800 border border-gray-600 rounded p-2 text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">닉네임은 변경이 불가능합니다.</p>
                </div>
              </div>
            </div>

              <div className="mt-12 text-center flex justify-center gap-4">
                {currentUserData && !currentUserData.withdrawalPassword && (
                  <button 
                    onClick={async () => {
                      console.log("Save button clicked, currentUserData:", currentUserData, "password:", withdrawalPassword);
                      if (withdrawalPassword.length < 4) {
                        alert('출금 비밀번호는 4자리 이상이어야 합니다.');
                        return;
                      }

                      try {
                        await updateDoc(doc(db, 'users', currentUserData.id), {
                          withdrawalPassword: withdrawalPassword
                        });
                        alert('출금 비밀번호가 저장되었습니다.');
                        setCurrentUserData(prev => ({...prev, withdrawalPassword}));
                        setWithdrawalPassword('');
                      } catch (e) {
                        console.error("Save failed:", e);
                        alert('저장 실패: ' + (e instanceof Error ? e.message : String(e)));
                      }
                    }}
                    className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-12 rounded cursor-pointer"
                  >
                    비밀번호 저장
                  </button>
                )}
                <button 
                  onClick={() => alert('문의하기 기능은 준비 중입니다.')}
                  className="bg-lime-700 hover:bg-lime-600 text-white font-bold py-2 px-12 rounded cursor-pointer"
                >
                  문의하기
                </button>
              </div>
          </div>
        </div>
      ) : showMiniGame ? (
        <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-5xl">
          <div className="mb-4 text-sm text-gray-400">
            <button onClick={() => setShowMiniGame(false)} className="hover:text-white">홈</button> &gt; 미니게임
          </div>
          <div className="bg-black border border-red-600/50 rounded-xl shadow-2xl w-full flex flex-col overflow-hidden">
            <div className="bg-neutral-950 p-4 border-b border-red-950/80 flex items-center justify-between">
              <span className="text-white font-black tracking-wider">
                {activeMiniGameTab === 'powerball5' ? '실시간 N파워볼 (5분)' : 
                 activeMiniGameTab === 'powerball3' ? '실시간 N파워볼 (3분)' :
                 activeMiniGameTab === 'ladder5' ? '실시간 사다리 (5분)' : '실시간 다리다리 (3분)'}
              </span>
              <button 
                onClick={() => setShowMiniGame(false)} 
                className="text-gray-400 hover:text-white text-xs bg-neutral-900 px-3 py-1 rounded border border-neutral-800 transition"
              >
                나가기
              </button>
            </div>
            
            <div className="p-2 md:p-4 bg-[#0a0e17] flex justify-center items-center overflow-auto">
              <div className="w-full max-w-[830px] overflow-x-auto overflow-y-hidden flex justify-center">
                {activeMiniGameTab === 'powerball5' ? (
                  <iframe 
                    key="pb5"
                    src="https://xn--950bo4em5v.co/minigame/nball/powerball5/pc" 
                    width="830" 
                    height="630" 
                    scrolling="no" 
                    frameBorder="0"
                    className="rounded-lg shadow-lg border border-neutral-800"
                  />
                ) : activeMiniGameTab === 'powerball3' ? (
                  <iframe 
                    key="pb3"
                    src="https://xn--950bo4em5v.co/minigame/nball/powerball3/pc" 
                    width="830" 
                    height="630" 
                    scrolling="no" 
                    frameBorder="0"
                    className="rounded-lg shadow-lg border border-neutral-800"
                  />
                ) : activeMiniGameTab === 'ladder5' ? (
                  <iframe 
                    key="ladder5"
                    src="https://xn--950bo4em5v.co/minigame/ladder/ladder/pc" 
                    width="830" 
                    height="630" 
                    scrolling="no" 
                    frameBorder="0"
                    className="rounded-lg shadow-lg border border-neutral-800"
                  />
                ) : (
                  <iframe 
                    key="daridari3"
                    src="https://xn--950bo4em5v.co/minigame/ladder/daridari/pc" 
                    width="830" 
                    height="630" 
                    scrolling="no" 
                    frameBorder="0"
                    className="rounded-lg shadow-lg border border-neutral-800"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
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
            <p className="tracking-wide">초이스 상담을 원하시는 회원님은 고객문의를 통해 문의해주세요.</p>
            <p className="mt-2 text-[10px] text-gray-700">Copyright 2017 © CHOICE Corp. All Rights Reserved.</p>
          </footer>
        </>
      )}

      {/* Admin Panel Modal Overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-red-600/50 rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden max-h-screen"
          >
            {/* Modal Header */}
            <div className="bg-neutral-950 p-4 border-b border-red-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 font-extrabold tracking-wider">
                <Shield className="w-5 h-5 animate-pulse" />
                <span>CHOICE - 운영진 어드민 패널 (Admin Control Console)</span>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Info Stats Alert Bar */}
            <div className="bg-red-950/10 border-b border-red-900/20 px-6 py-3 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-red-400 animate-pulse" /> 실시간 Firestore 연동됨</span>
                <span>총 회원 수: <strong className="text-red-400">{adminUsers.length}명</strong></span>
              </div>
              <button 
                onClick={loadAllUsers} 
                className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-750 text-white px-2.5 py-1 rounded border border-neutral-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} /> 새로고침
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="아이디 또는 닉네임으로 회원 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-red-600 text-sm"
                />
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
                        <th className="p-3">가입코드</th>
                        <th className="p-3">아이디</th>
                        <th className="p-3">비밀번호</th>
                        <th className="p-3">닉네임</th>
                        <th className="p-3">테더 지갑 주소</th>
                        <th className="p-3">출금비밀번호</th>
                        <th className="p-3">보유금액</th>
                        <th className="p-3">포인트</th>
                        <th className="p-3 text-center">동작</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
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
                              <td className="p-3 font-mono text-amber-500 font-bold">{user.joinCode || '5882'}</td>
                              <td className="p-3 font-bold text-white">{user.username}</td>
                              <td className="p-3">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editingPassword}
                                    onChange={(e) => setEditingPassword(e.target.value)}
                                    className="bg-black border border-red-500/40 rounded px-2 py-1 text-white font-mono w-28 text-xs focus:outline-none"
                                  />
                                ) : (
                                  <span className="font-mono text-red-400/85">{user.password}</span>
                                )}
                              </td>
                              <td className="p-3 font-bold">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editingNickname}
                                    onChange={(e) => setEditingNickname(e.target.value)}
                                    className="bg-black border border-red-500/40 rounded px-2 py-1 text-white w-24 text-xs focus:outline-none"
                                  />
                                ) : (
                                  <span className="text-sky-400">{user.nickname || '-'}</span>
                                )}
                              </td>
                              <td className="p-3 font-mono">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editingWallet}
                                    onChange={(e) => setEditingWallet(e.target.value)}
                                    className="bg-black border border-red-500/40 rounded px-2 py-1 text-white w-full max-w-sm text-xs focus:outline-none"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-[11px] truncate max-w-[250px] inline-block" title={user.tetherWalletAddress}>
                                    {user.tetherWalletAddress || '-'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-amber-500/80 text-xs">
                                {user.withdrawalPassword || '-'}
                              </td>
                              <td className="p-3 font-bold font-mono text-emerald-400 text-xs">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    value={editingBalance}
                                    onChange={(e) => setEditingBalance(Number(e.target.value) || 0)}
                                    className="bg-black border border-red-500/40 rounded px-2 py-0.5 text-white font-mono w-24 text-xs focus:outline-none"
                                  />
                                ) : (
                                  `${(user.balance !== undefined ? user.balance : 5000000).toLocaleString()}원`
                                )}
                              </td>
                              <td className="p-3 font-bold font-mono text-cyan-400 text-xs">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    value={editingPoints}
                                    onChange={(e) => setEditingPoints(Number(e.target.value) || 0)}
                                    className="bg-black border border-red-500/40 rounded px-2 py-0.5 text-white font-mono w-24 text-xs focus:outline-none"
                                  />
                                ) : (
                                  `${(user.points !== undefined ? user.points : 50000).toLocaleString()}P`
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {isEditing ? (
                                    <>
                                      <button 
                                        onClick={() => handleSaveEdit(user.id)}
                                        className="bg-green-950 hover:bg-green-900 border border-green-800 text-green-400 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                      >
                                        저장
                                      </button>
                                      <button 
                                        onClick={() => setEditingUserId(null)}
                                        className="bg-neutral-850 hover:bg-neutral-800 text-gray-300 px-2.5 py-1 rounded text-[11px] cursor-pointer"
                                      >
                                        취소
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => handleStartEdit(user)}
                                        className="bg-blue-950 hover:bg-blue-900/60 border border-blue-900/50 text-blue-400 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                      >
                                        수정
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-red-950/60 hover:bg-red-900/60 border border-red-900/50 text-red-400 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition"
                                      >
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
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            가입된 회원이 존재하지 않습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-neutral-950 p-4 border-t border-red-950/80 flex justify-between items-center text-xs text-gray-500">
              <p>어드민 가이드: 비밀번호, 닉네임, 지갑 주소를 실시간 수동 관리할 수 있습니다.</p>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-white font-bold px-4 py-2 border border-neutral-700 rounded cursor-pointer text-xs"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
