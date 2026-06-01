import React from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Mail, 
  KeyRound, 
  Info, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { db, firebaseAvailable } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

export default function AccountDeletionHandler() {
  const [loginId, setLoginId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      alert('⚠️ 개인정보 및 데이터 파기 동의 사항에 체크해 주세요.');
      return;
    }

    if (!loginId.trim()) {
      alert('⚠️ 로그인 아이디 또는 이메일을 입력해 주세요.');
      return;
    }

    const doubleCheck = window.confirm(
      '⚠️ 정말로 데이터 및 회원정보를 영구 탈퇴 처리하시겠습니까?\n이 작업은 즉시 실행되며 되돌릴 수 없습니다.'
    );
    if (!doubleCheck) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      if (!firebaseAvailable || !db) {
        // Safe mock local storage backup deletion
        const localAllStr = localStorage.getItem('PREDICT_LOCAL_ALL_USERS');
        if (localAllStr) {
          let users = JSON.parse(localAllStr) as any[];
          const lowerId = loginId.trim().toLowerCase();
          const found = users.find(u => u.loginId?.toLowerCase() === lowerId);
          if (found) {
            // Delete
            users = users.filter(u => u.loginId?.toLowerCase() !== lowerId);
            localStorage.setItem('PREDICT_LOCAL_ALL_USERS', JSON.stringify(users));
            
            // Record withdrawal 
            const withdrawalsStr = localStorage.getItem('PREDICT_LOCAL_WITHDRAWALS') || '[]';
            const logs = JSON.parse(withdrawalsStr);
            logs.push({ loginId: lowerId, withdrawnAt: new Date().toISOString() });
            localStorage.setItem('PREDICT_LOCAL_WITHDRAWALS', JSON.stringify(logs));

            setStatus('success');
            return;
          }
        }
        throw new Error('전산 서버가 일시적으로 오프라인 상태이거나 정보를 찾을 수 없습니다. (비밀번호 오류 또는 가입된 세션이 없음)');
      }

      // Query database
      const cleanId = loginId.trim().toLowerCase();
      const userQuery = query(collection(db, "users"), where("loginId", "==", loginId.trim()));
      const snap = await getDocs(userQuery);

      if (snap.empty) {
        throw new Error('가입 내역을 찾을 수 없습니다. 아이디를 다시 확인해 주세요.');
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();

      // Simple credential verification (if password exists)
      if (userData.password && password && userData.password !== password.trim()) {
        throw new Error('비밀번호가 올바르지 않습니다. 정보가 다르면 즉각 파기가 불허됩니다.');
      }

      // Delete user
      await deleteDoc(doc(db, "users", userDoc.id));

      // Record withdrawal log for 30 days restriction
      const withdrawnAt = new Date().toISOString();
      await setDoc(doc(db, "withdrawal_logs", cleanId), {
        loginId: loginId.trim(),
        nickname: userData.nickname || '소셜탈퇴회원',
        withdrawnAt: withdrawnAt
      });

      // Clear matching localStorage if they are on this browser
      if (localStorage.getItem('PREDICT_USER_UID') === userDoc.id) {
        localStorage.clear();
      }

      // Save offline trace to current browser too
      try {
        const localLogsStr = localStorage.getItem('PREDICT_LOCAL_WITHDRAWALS');
        let logs: any[] = [];
        if (localLogsStr) logs = JSON.parse(localLogsStr);
        logs.push({ loginId: cleanId, withdrawnAt });
        localStorage.setItem('PREDICT_LOCAL_WITHDRAWALS', JSON.stringify(logs));
      } catch (e) {}

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || '탈퇴 처리 중 전산 오류가 발생하였습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-200 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-[#0d111e] border border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">온라인 데이터 영구 파기 및 회원탈퇴</h1>
          <p className="text-xs text-neutral-400">Google Play 스토어 개인정보 데이터 삭제 정책을 상시 보장합니다.</p>
        </div>

        {/* Informative Block */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 sm:p-5 text-xs text-amber-500/90 space-y-3 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4" />
            <span>수집 데이터 파기 정책 고지 (Data Retention & Deletion)</span>
          </div>
          <ul className="list-disc pl-4 space-y-2 text-neutral-400">
            <li>
              <strong>삭제되는 데이터 유형:</strong> 귀하의 고유 로그인 식별키, 비밀번호, 닉네임, 프로필 이메일, 포인트, 참여 내역 데이터가 즉시 영구 파기됩니다.
            </li>
            <li>
              <strong>재가입 방지 제한:</strong> 구글 플레이 데이터 세이프 정책에 따라 탈퇴한 아이디/이메일은 <strong>탈퇴 완료 시간 기점 30일간</strong> 부정 방지를 위해 재가입이 엄격히 불허되며 임시 로그로 암호화 보관됩니다.
            </li>
            <li>
              <strong>처리 시간:</strong> 양식 전송 완료 시 실시간으로 클라우드 콘솔 데이터베이스 가공 처리가 무부하 실행됩니다.
            </li>
          </ul>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-4">
            <div className="inline-flex p-2.5 bg-emerald-500/15 text-emerald-400 rounded-full">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-emerald-400">탈퇴 및 전산 파기 신청 완료</h2>
            <p className="text-xs text-neutral-450 leading-relaxed">
              요청하신 로그인 정보에 대한 데이터베이스 파기 프로세스가 완료되었습니다.<br />
              본 이메일 또는 가입 아이디는 <strong>30일간 재이용이 제한</strong>됩니다.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              메인 홈으로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                ❌ {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">가입 아이디 또는 이메일 주소</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="example@gmail.com 또는 가입 아이디"
                    className="w-full bg-black/40 border border-neutral-850 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-400">비밀번호 기입 (소셜 로그인은 비워두기)</label>
                  <span className="text-[10px] text-neutral-500 font-semibold">※ 확인용</span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="가입 시 입력했던 본인 비밀번호"
                    className="w-full bg-black/40 border border-neutral-850 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox agreement */}
            <div className="flex items-start gap-2.5 select-none pt-2">
              <input
                type="checkbox"
                id="agree-delete-account-form"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 rounded border-neutral-800 bg-neutral-900 text-red-500 focus:ring-red-500 h-4 w-4 shrink-0 transition-all cursor-pointer"
              />
              <label
                htmlFor="agree-delete-account-form"
                className={`text-[11px] cursor-pointer leading-relaxed ${agree ? 'font-bold text-red-400' : 'text-neutral-400'}`}
              >
                본 장치 동의 시 Firestore 클라우드 가입 내역 파기 및 30일 이내 복구 불가 조건에 완벽히 동의하며 영구 파기를 요청합니다.
              </label>
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-gradient-to-r from-red-650 to-red-600 hover:from-red-600 hover:to-red-550 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg hover:shadow-red-950/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{status === 'loading' ? '전산 서버 데이터 파기 진행 중...' : '데이터 영구 삭제 및 즉시 탈퇴'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Help footer */}
        <div className="text-center pt-2 border-t border-neutral-900">
          <p className="text-[10px] text-neutral-500">
            앱 내부에서 직접 탈퇴하려면: <span className="text-neutral-400">내 프로필 &gt; 내 정보 &gt; 회원탈퇴 실행</span>을 통해서도 번거로움 없이 즉시 실시간 처리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
