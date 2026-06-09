import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log('Found user document, data:', userData);
          if (userData.password === password) {
            loginSuccess = true;
            loggedInUser = { id: doc.id, ...userData };
          }
        });
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
        className="absolute inset-0 z-0 bg-gray-900"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=2670&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 z-10 bg-black/50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-md p-8 flex flex-col items-center bg-black/40 border border-red-600/30 rounded-lg shadow-2xl backdrop-blur-sm"
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-6xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            초이스
          </h1>
          <h2 className="text-xl font-bold text-white tracking-widest mt-1 uppercase">
            Private Club
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-4">
            Exclusive access only
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="아이디" 
              value={username}
              onChange={(e) => handleInputChange(e.target.value, setUsername)}
              className="w-full bg-black/50 border border-gray-700 text-gray-200 rounded px-10 py-3 focus:outline-none focus:border-red-600 placeholder-gray-600 transition"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => handleInputChange(e.target.value, setPassword)}
              className="w-full bg-black/50 border border-gray-700 text-gray-200 rounded px-10 py-3 focus:outline-none focus:border-red-600 placeholder-gray-600 transition"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-black text-red-500 font-mono text-2xl flex items-center justify-center rounded border border-gray-700 tracking-widest shadow-inner select-none">
              {securityCode}
            </div>
            <div className="flex-[2]">
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="보안코드" 
                  value={inputSecurityCode}
                  onChange={(e) => handleInputChange(e.target.value, setInputSecurityCode)}
                  className="w-full bg-black/50 border border-gray-700 text-gray-200 rounded px-10 py-3 focus:outline-none focus:border-red-600 placeholder-gray-600 transition"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 font-medium text-center bg-red-950/20 border border-red-900/40 py-1.5 rounded"
            >
              ⚠️ {errorMessage}
            </motion.p>
          )}

          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full border border-red-800 bg-red-950/50 text-red-400 font-bold py-3 rounded hover:bg-red-900 transition-colors uppercase tracking-widest font-sans shadow-lg disabled:opacity-50"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          
          <button 
            onClick={() => onNavigate('register')}
            className="w-full bg-transparent border border-gray-800 text-gray-500 font-bold py-3 rounded hover:bg-gray-900 transition-colors uppercase tracking-widest text-xs font-sans"
          >
            회원가입
          </button>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-[10px] text-gray-700 uppercase tracking-widest ml-0 mr-0 -mb-[26px]">
          Copyright 초이스 Management. Confidential.
        </p>
      </motion.div>
    </div>
  );
}
