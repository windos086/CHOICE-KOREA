import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Hash, Wallet } from 'lucide-react';
import { collection, setDoc, doc, serverTimestamp, query, where, getDocs, getDoc } from 'firebase/firestore';
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
    const enteredCode = formData.joinCode.trim().toUpperCase();
    if (!enteredCode) {
      alert('가입 마스터 코드를 입력해 주세요.');
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
      // 1. 가입 추천코드 유효성 검증
      let resolvedReferrerCode = enteredCode;
      let isCodeValid = false;

      // Special exemption for the legacy/general recruitment code '5882'
      if (enteredCode === '5882') {
        isCodeValid = true;
        resolvedReferrerCode = '5882';
      } else {
        try {
          const codeRef = doc(db, 'referralCodes', enteredCode);
          const codeDoc = await getDoc(codeRef);
          if (codeDoc.exists()) {
            const codeData = codeDoc.data();
            if (codeData.status === 'active') {
              isCodeValid = true;
              resolvedReferrerCode = enteredCode;
            } else {
              alert('비활성화되었거나 정지된 가입코드입니다. 올바른 최신 코드를 사용해 주세요.');
              return;
            }
          } else {
            alert('존재하지 않거나 발급되지 않은 정식 가입코드입니다. 임의의 가입코드로는 가입하실 수 없으며, 반드시 공식적으로 발급받으신 코드만 사용 가능합니다.');
            return;
          }
        } catch (checkErr) {
          console.warn('Code verification failed', checkErr);
          alert('가입코드 검증 중 알 수 없는 데이터베이스 오류가 발생했습니다.');
          return;
        }
      }

      if (!isCodeValid) {
        alert('유효하지 않은 가입코드입니다.');
        return;
      }

      // 아이디 중복 체크
      const q = query(collection(db, 'users'), where('username', '==', formData.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('이미 사용 중인 아이디입니다.');
        return;
      }

      const newUser = {
        id: formData.username,
        joinCode: enteredCode,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        tetherWalletAddress: formData.tetherWalletAddress,
        balance: 0,
        points: 0,
        appliedReferrerCode: resolvedReferrerCode,
        createdAt: new Date().toISOString()
      };

      // Real Firestore write
      await setDoc(doc(db, 'users', formData.username), {
        joinCode: enteredCode,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        tetherWalletAddress: formData.tetherWalletAddress,
        balance: 0,
        points: 0,
        appliedReferrerCode: resolvedReferrerCode,
        createdAt: serverTimestamp()
      });

      // Send a welcome personal note / message (신규 쪽지) to the user
      await setDoc(doc(db, 'notes', `${formData.username}_welcome`), {
        receiverId: formData.username,
        sender: 'LMT 통제소',
        title: '🚀 Lockheed Martin (LMT) 전술 노드 개설을 환영합니다!',
        content: `안녕하세요, ${formData.nickname} 사령원님!\n\n최상의 시뮬레이터 환경과 신뢰를 지향하는 전술 플랫폼 록히드마틴(LMT, Lockheed Martin)을 선택해주셔서 진심으로 감사드립니다.\n\n사령원님께서 시스템을 안정적으로 탐색하실 수 있도록, 시스템 시작에 앞서 상단 메뉴의 [공지사항] 탭 내에 명시되어 있는 '전술 가이드라인 및 운용 수칙'을 반드시 필독하시어 뜻밖의 보안 격리 조치나 수칙 미숙지로 인한 제한을 사전 파악하시기 바랍니다.\n\n더불어 LMT에서는 핵심 오퍼레이터분들을 위해 실시간 패시브 롤링 리턴 등 압도적인 혜택을 다각도로 영구 지원해 드리고 있습니다!\n\n🎁 [LMT 오퍼레이터 특전 리포트]\n\n1. 무한 매 입금 10% 지원금\n- 매번 충전 승인이 될 때마다, 전송액 기준 가치의 10%를 원화 정산 비율로 사령원님의 포인트 지갑에 무제한 신속 가산 정산 처리해 드립니다!\n\n2. 무한 베팅 페이백 (Tactical Rebate)\n- 스포츠 및 시뮬레이터 게임 참여 완료 시, 승패 결과와 무관하게 즉각 페이백 포인트(스포츠 5% / 실시간게임 3%)가 실시간 반환 적립됩니다!\n\n해당 사항의 상세 내용은 상단 [이벤트] 탭에서 상시 정교하게 대조 확인하실 수 있습니다.\n\nLMT 시뮬레이션 시스템과 기품 있고 품행 넘치는 안전한 전술 여정이 되시기를 지원하며, 의문점이나 승인 정밀 조율 문의는 고객문의(1:1 메시지 통신) 채널로 소통하는 즉시 24시간 당직 중인 군용 오퍼레이터 분들이 완벽하게 서포트해 드립니다.\n\n감사합니다.\n- 록히드마틴 전술 작전 통제본부 드림`,
        read: false,
        createdAt: Date.now()
      });

      // Synchronize to localStorage fallback cache
      const localUsersStr = localStorage.getItem('localUsersFallback');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
      localUsers.push(newUser);
      localStorage.setItem('localUsersFallback', JSON.stringify(localUsers));

      // Safe auto log in
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('myAppliedReferrer', enteredCode);

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
          <div className="bg-[#09111e] border border-sky-500 p-8 rounded-xl text-center text-white tracking-wide">
            <h2 className="text-2xl font-black text-sky-400 mb-4 uppercase">Node Registered Successfully</h2>
            <p className="text-sm text-gray-300">신규 통제 소드가 무사히 개설되었습니다.</p>
            <p className="text-[10px] text-gray-500 mt-2">Redirecting to terminal...</p>
          </div>
        </motion.div>
      )}
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-lg p-8 flex flex-col items-center bg-[#070c14]/90 border border-sky-500/30 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in"
      >
        <h1 className="text-3xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(56,189,248,0.45)] mb-1">
          신규 전술노드 등록
        </h1>
        <h2 className="text-[10px] font-black text-sky-400 tracking-[0.3em] uppercase mb-6">
          CREATE LMT SECURE ACCOUNT
        </h2>
        
        <p className="text-sky-400 text-xs font-bold mb-6 tracking-wide border-b border-sky-500/20 pb-1.5 w-full text-center">필수 입력사항 (Security Guidelines)</p>

        <div className="w-full space-y-4">
          {[
            { icon: Hash, placeholder: '가입 마스터 코드 (Master Join Code)', field: 'joinCode', type: 'text', label: 'LMT 승인 전술가 코드를 기입하십시오.' },
            { icon: User, placeholder: '전술 아이디', field: 'username', type: 'text', label: '영문, 숫자 포함 3~30자 구성' },
            { icon: Lock, placeholder: '시스템 비밀번호', field: 'password', type: 'password', label: '영문, 숫자를 1자 이상 포함한 4~16자 구성' },
            { icon: User, placeholder: '전술가 닉네임', field: 'nickname', type: 'text', label: '한글 전용 3~6자 구성' },
            { icon: Wallet, placeholder: 'USDT 테더지갑 주소 (Tether Wallet Address)', field: 'tetherWalletAddress', type: 'text', label: '네트워크 프로토콜: TRC-20 (TRON)' },
          ].map((field, idx) => (
            <div key={idx} className="space-y-1">
              <div className="relative">
                <field.icon className="absolute left-3 top-3.5 h-4 w-4 text-sky-500" />
                <input 
                  type={field.type} 
                  placeholder={field.placeholder} 
                  value={formData[field.field as keyof typeof formData]}
                  onChange={(e) => handleInputChange(e, field.field)}
                  className="w-full bg-black/60 border border-neutral-800 text-gray-200 rounded-lg px-10 py-3 focus:outline-none focus:border-sky-500 placeholder-gray-600 transition text-sm"
                />
              </div>
              {field.label && <p className="text-[10px] text-gray-400 pl-1 leading-normal">{field.label}</p>}
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleRegister}
              className="flex-1 border border-sky-700 bg-sky-950/40 text-sky-300 font-extrabold py-3 rounded-lg hover:bg-sky-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-sans shadow-lg"
            >
              성공적 개설
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="flex-1 bg-transparent border border-neutral-800 text-gray-400 font-bold py-3 rounded-lg hover:bg-[#0d1421] transition-colors uppercase tracking-widest text-xs font-sans shadow-lg"
            >
              등록 취소
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
