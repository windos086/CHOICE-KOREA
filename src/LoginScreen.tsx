import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  console.warn('Firestore operation handled gracefully:', error);
}

export default function LoginScreen({ onNavigate }: { onNavigate: (screen: 'login' | 'register' | 'main') => void }) {
  const [securityCode, setSecurityCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inputSecurityCode, setInputSecurityCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSecurityCode(code);
  }, []);

  const handleInputChange = (value: string, setter: (val: string) => void) => {
    setter(value);
    setErrorMessage(""); // typing clears previous error message
  };

  const handleLogin = async () => {
    setErrorMessage("");
    if (!username || !password) {
      setErrorMessage("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (inputSecurityCode !== securityCode) {
      setErrorMessage("보안코드가 일치하지 않습니다.");
      // Refresh security code on failure
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setSecurityCode(code);
      setInputSecurityCode("");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Try Firestore database
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      let loginSuccess = false;
      let loggedInUser = null;

      if (!querySnapshot.empty) {
        for (const docSnapshot of querySnapshot.docs) {
          const userData = docSnapshot.data();
          console.log('Found user document, data:', userData);
          if (userData.password === password) {
            loginSuccess = true;
            loggedInUser = { id: docSnapshot.id, ...userData };
            // Set session ID
            const sessionId = Math.random().toString(36).substring(2, 15);
            await updateDoc(doc(db, 'users', docSnapshot.id), { 
              sessionId,
              lastActive: Date.now(),
              lastIp: 'unknown' // IP recording would require server-side proxy
            });
            loggedInUser.sessionId = sessionId;
          }
        }
      }

      // 2. Local fallback check in case of slow replication or local registration
      if (!loginSuccess) {
        const localUsersStr = localStorage.getItem('localUsersFallback');
        if (localUsersStr) {
          const localUsers = JSON.parse(localUsersStr);
          const foundLocal = localUsers.find((u: any) => u.username === username);
          if (foundLocal) {
            if (foundLocal.password === password) {
              loginSuccess = true;
              loggedInUser = foundLocal;
            } else {
              setErrorMessage("비밀번호가 일치하지 않습니다.");
              setIsLoading(false);
              return;
            }
          }
        }
      }

      if (loginSuccess && loggedInUser) {
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        onNavigate('main');
      } else {
        // Find if user exists on Firestore or local to specify error
        if (querySnapshot.empty) {
          setErrorMessage("존재하지 않는 아이디입니다.");
        } else {
          setErrorMessage("비밀번호가 일치하지 않습니다.");
        }
      }
    } catch (error) {
      console.error("Firestore query failed, searching local fallback storage:", error);
      // Fallback only if Firestore fails
      const localUsersStr = localStorage.getItem('localUsersFallback');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const found = localUsers.find((u: any) => u.username === username);
        if (found) {
          if (found.password === password) {
            localStorage.setItem('currentUser', JSON.stringify(found));
            onNavigate('main');
            setIsLoading(false);
            return;
          } else {
            setErrorMessage("비밀번호가 일치하지 않습니다.");
            setIsLoading(false);
            return;
          }
        }
      }
      setErrorMessage("존재하지 않는 아이디입니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans">
      <div 
        className="absolute inset-0 z-0 bg-[#090e17]"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 z-10 bg-black/60" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-md p-8 flex flex-col items-center bg-[#070c14]/90 border border-sky-500/30 rounded-2xl shadow-2xl backdrop-blur-md"
      >
        {/* Lockheed Martin Logo */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 mb-2 flex items-center justify-center relative">
            <svg className="w-10 h-10 text-sky-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L15 9H22L17 14L19 21L12 17L5 21L7 14L2 9H9L12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
            록히드마틴
          </h1>
          <h2 className="text-[10px] font-black text-sky-400 tracking-[0.3em] uppercase mt-1">
            LMT TACTICAL PORTAL
          </h2>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-3">
            Exclusive Multi-Domain Access
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="아이디" 
              value={username}
              onChange={(e) => handleInputChange(e.target.value, setUsername)}
              className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded-lg px-10 py-3 focus:outline-none focus:border-sky-500 placeholder-gray-600 transition"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => handleInputChange(e.target.value, setPassword)}
              className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded-lg px-10 py-3 focus:outline-none focus:border-sky-500 placeholder-gray-600 transition"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-black text-sky-450 font-mono text-2xl flex items-center justify-center rounded-lg border border-neutral-800 tracking-widest shadow-inner select-none font-bold">
              {securityCode}
            </div>
            <div className="flex-[2]">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="보안코드" 
                  value={inputSecurityCode}
                  onChange={(e) => handleInputChange(e.target.value, setInputSecurityCode)}
                  className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded-lg px-10 py-3 focus:outline-none focus:border-sky-500 placeholder-gray-600 transition"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-rose-500 font-medium text-center bg-rose-950/20 border border-rose-900/40 py-1.5 rounded-lg"
            >
              ⚠️ {errorMessage}
            </motion.p>
          )}

          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full border border-sky-700 bg-sky-950/40 text-sky-300 font-black py-3 rounded-lg hover:bg-sky-900 hover:text-white transition-colors uppercase tracking-widest font-sans shadow-lg disabled:opacity-50"
          >
            {isLoading ? '인증 진행 중...' : '시스템 로그인'}
          </button>
          
          <button 
            onClick={() => onNavigate('register')}
            className="w-full bg-transparent border border-neutral-800 hover:border-neutral-700 text-gray-400 hover:text-white font-bold py-3 rounded-lg hover:bg-neutral-900 transition-colors uppercase tracking-widest text-xs font-sans"
          >
            기본 가입 등록 (Deploy Node)
          </button>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-[9px] text-gray-600 uppercase tracking-widest ml-0 mr-0 -mb-[26px] whitespace-nowrap">
          Copyright 2026 © Lockheed Martin (LMT) Operations. Confidential.
        </p>
      </motion.div>
    </div>
  );
}
