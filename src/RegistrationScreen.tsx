import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Hash, Wallet } from 'lucide-react';
import { collection, setDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './lib/firebase';

interface RegistrationScreenProps {
  onNavigate: (screen: 'login' | 'register' | 'main') => void;
}

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

export default function RegistrationScreen({ onNavigate }: RegistrationScreenProps) {
  const [formData, setFormData] = useState({
    joinCode: '',
    username: '',
    password: '',
    nickname: '',
    tetherWalletAddress: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegister = async () => {
    if (formData.joinCode !== '5882') {
      alert('올바른 가입 코드를 입력해주세요.');
      return;
    }
    if (formData.username.length < 3 || formData.username.length > 30 || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
      alert('아이디는 영문, 숫자 포함 3~30자여야 합니다.');
      return;
    }
    // 비밀번호 정규식: 4~16자
    if (formData.password.length < 4 || formData.password.length > 16) {
      alert('비밀번호는 4~16자여야 합니다.');
      return;
    }
    if (formData.nickname.length < 3 || formData.nickname.length > 6 || !/^[가-힣]+$/.test(formData.nickname)) {
      alert('닉네임은 한글 3~6자여야 합니다.');
      return;
    }
    if (formData.tetherWalletAddress.length === 0) {
      alert('테더지갑 주소를 입력해주세요.');
      return;
    }

    try {
      // 아이디 중복 체크
      const q = query(collection(db, 'users'), where('username', '==', formData.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('이미 사용 중인 아이디입니다.');
        return;
      }

      const newUser = {
        joinCode: formData.joinCode,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        tetherWalletAddress: formData.tetherWalletAddress,
        balance: 5000000,
        points: 50000,
        createdAt: new Date().toISOString()
      };

      // Real Firestore write
      await setDoc(doc(db, 'users', formData.username), {
        joinCode: formData.joinCode,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        tetherWalletAddress: formData.tetherWalletAddress,
        balance: 5000000,
        points: 50000,
        createdAt: serverTimestamp()
      });

      // Synchronize to localStorage fallback cache
      const localUsersStr = localStorage.getItem('localUsersFallback');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
      localUsers.push(newUser);
      localStorage.setItem('localUsersFallback', JSON.stringify(localUsers));

      // Safe auto log in
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      setShowSuccess(true);
      setTimeout(() => {
        onNavigate('main');
      }, 2000);
    } catch (error) {
      alert(`회원가입 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans bg-gray-950">
      {showSuccess && (
        <motion.div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-gray-900 border border-red-600 p-8 rounded-lg text-center text-white">
            <h2 className="text-2xl font-bold text-red-500 mb-4">회원가입 완료</h2>
            <p>환영합니다! 메인 페이지로 이동합니다.</p>
          </div>
        </motion.div>
      )}
      <div 
        className="absolute inset-0 z-0 bg-gray-900"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=2670&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 z-10 bg-black/60" />
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-lg p-8 flex flex-col items-center bg-black/50 border border-red-600/30 rounded-lg shadow-2xl backdrop-blur-md"
      >
        <h1 className="text-4xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] mb-2">
          회원가입
        </h1>
        <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6">
          Create Account
        </h2>
        
        <p className="text-red-400 text-sm mb-6 underline">필수 입력사항</p>

        <div className="w-full space-y-5">
          {[
            { icon: Hash, placeholder: '가입 코드', field: 'joinCode', type: 'text', label: '' },
            { icon: User, placeholder: '아이디', field: 'username', type: 'text', label: '영문, 숫자만 입력 가능. 최소 3자이상' },
            { icon: Lock, placeholder: '비밀번호', field: 'password', type: 'password', label: '영문, 숫자를 한자 이상 반드시 포함한 4~16자' },
            { icon: User, placeholder: '닉네임', field: 'nickname', type: 'text', label: '한글만 사용가능 3~6자' },
            { icon: Wallet, placeholder: '테더지갑 주소 입력', field: 'tetherWalletAddress', type: 'text', label: '' },
          ].map((field, idx) => (
            <div key={idx} className="space-y-1">
              <div className="relative">
                <field.icon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input 
                  type={field.type} 
                  placeholder={field.placeholder} 
                  value={formData[field.field as keyof typeof formData]}
                  onChange={(e) => handleInputChange(e, field.field)}
                  className="w-full bg-black/40 border border-gray-700 text-gray-200 rounded px-10 py-3 focus:outline-none focus:border-red-600 placeholder-gray-600 transition"
                />
              </div>
              {field.label && <p className="text-xs text-gray-400 pl-1">{field.label}</p>}
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleRegister}
              className="flex-1 border border-red-800 bg-red-950/50 text-red-400 font-bold py-3 rounded hover:bg-red-900 transition-colors uppercase tracking-widest font-sans shadow-lg"
            >
              가입
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="flex-1 bg-transparent border border-gray-700 text-gray-400 font-bold py-3 rounded hover:bg-gray-800 transition-colors uppercase tracking-widest font-sans shadow-lg"
            >
              취소
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
