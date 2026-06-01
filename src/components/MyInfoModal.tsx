import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  ShieldAlert, 
  Trash2, 
  Mail, 
  KeyRound, 
  Coins, 
  Activity 
} from 'lucide-react';
import { UserProfile } from '../types';

interface MyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onDeleteAccount: (uid: string) => Promise<void>;
  theme: 'dark' | 'light';
}

export default function MyInfoModal({
  isOpen,
  onClose,
  userProfile,
  onDeleteAccount,
  theme
}: MyInfoModalProps) {
  const [agreeToTerm, setAgreeToTerm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAgreeToTerm(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !userProfile) return null;

  // Format creation date beautifully
  const formatRegDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '확인되지 않음';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      
      return `${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}:${ss}`;
    } catch {
      return dateStr;
    }
  };

  // Determine provider/signup platform
  const getSignUpMethod = (): string => {
    const uid = userProfile.uid || '';
    if (uid.startsWith('kakao_')) return '카카오톡 로그인 연동';
    if (uid.startsWith('google_') || userProfile.loginId?.includes('@gmail.com')) return '구글 로그인 연동';
    if (userProfile.password === 'social_secure_bypass') return '소셜 미디어 간편 로그인';
    return '기본 회원가입 계정';
  };

  const handleDeleteClick = async () => {
    if (!agreeToTerm) {
      alert('⚠️ 개인정보 및 데이터 영구 가기 삭제 동의 사항에 체크해 주세요.');
      return;
    }

    const doubleCheck = window.confirm(
      '⚠️ 정말로 즉시 회원탈퇴를 진행하시겠습니까?\n\n탈퇴 시 소유하고 계신 포인트, 예측 기록, 회원 정보 등 모든 서비스 데이터가 Firestore 클라우드에서 영구 파기되며 복구가 불가능합니다.'
    );

    if (!doubleCheck) return;

    const finalConfirm = window.confirm('⚠️ 정말 탈퇴하시겠습니까?');
    if (!finalConfirm) return;

    try {
      setIsDeleting(true);
      await onDeleteAccount(userProfile.uid);
      alert('🎉 회원탈퇴 및 개인정보 데이터의 영구 파기 조치가 성공적으로 완료되었습니다. 그동안 서비스를 이용해 주셔서 진심으로 감사합니다.');
      onClose();
    } catch (err: any) {
      console.error('Error during account deletion:', err);
      alert('❌ 회원탈퇴 중 기술적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" id="my-info-modal-backdrop">
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 transform scale-100 ${
          isDark 
            ? 'bg-[#141414] border-neutral-800 text-gray-200' 
            : 'bg-white border-gray-100 text-neutral-800'
        }`}
        id="my-info-modal-container"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-2 text-red-500">
            <User className="w-5 h-5" />
            <h2 className="text-base font-extrabold tracking-tight">내 정보 및 가입 상세내역</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-450 hover:text-white' : 'hover:bg-gray-100 text-neutral-500 hover:text-black'}`}
            title="닫기"
            id="my-info-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto" id="my-info-modal-content">
          {/* User Basic Info Showcase */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800/80' : 'bg-gray-55 border-gray-100'}`}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center font-black select-none shrink-0 border border-neutral-650">
                {userProfile.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt="profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-white text-lg">{userProfile.nickname?.substring(0, 1) || 'U'}</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <span className={`${isDark ? 'text-white' : 'text-neutral-900'}`}>{userProfile.nickname}</span>
                  <span className="px-2 py-0.5 text-[9px] bg-red-500/10 text-red-400 border border-red-500/25 rounded-md font-extrabold">일반회원</span>
                </div>
                <div className="text-[11px] text-neutral-450 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{userProfile.loginId || '소셜 가입 완료'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            <h3 className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>가입 상세정보</h3>
            <div className={`overflow-hidden rounded-xl border divide-y ${isDark ? 'border-neutral-800 divide-neutral-800/60 bg-neutral-900/30' : 'border-gray-100 divide-gray-105 bg-gray-50/30'}`}>
              
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-neutral-450 font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  회원가입 일시
                </span>
                <span className={`font-mono font-semibold ${isDark ? 'text-gray-300' : 'text-neutral-700'}`}>
                  {formatRegDate(userProfile.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-neutral-450 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-neutral-400" />
                  로그인 인증 연동
                </span>
                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-neutral-700'}`}>
                  {getSignUpMethod()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-neutral-450 font-bold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-neutral-400" />
                  보유 포인트
                </span>
                <span className="font-extrabold text-blue-400">
                  {userProfile.points?.toLocaleString() || 0} P
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-neutral-450 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-neutral-400" />
                  예측 적중률
                </span>
                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-neutral-700'}`}>
                  {userProfile.successCount || 0}회 적중 / {userProfile.predictsCount || 0}회 참여 ({userProfile.predictsCount > 0 ? Math.round((userProfile.successCount / userProfile.predictsCount) * 100) : 0}%)
                </span>
              </div>

            </div>
          </div>

          {/* Secure delete account announcement (Google Play Data Safety) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-500 tracking-tight flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              구글 플레이 데이터 보호 고지 (Data Safety & Privacy)
            </h3>
            <div className={`p-4 rounded-xl border text-[11px] leading-relaxed space-y-2.5 ${isDark ? 'bg-amber-500/5 border-amber-500/20 text-neutral-300' : 'bg-amber-50/40 border-amber-500/10 text-neutral-700'}`}>
              <p className="font-semibold">
                본 웹앱은 Google Play의 개인정보 데이터 삭제 정책을 완벽하게 준수합니다.
              </p>
              <p className="opacity-80">
                회원탈퇴 진행 시, 귀하의 로그인 정보(ID, 패스워드 포함), 이메일, 닉네임, 아바타, 적립 포인트 정보 및 과거 예측 배팅 결과와 대화 알림 기록 등 <strong>수집된 보편적인 인적/전산 상의 일체 정보</strong>가 Firestore 데이터베이스 서버 및 로컬 캐시(localStorage)에서 <strong>영구적으로 즉각 삭제(Erase/Purge)</strong> 처리됩니다.
              </p>
              <p className="opacity-85 text-amber-500/90 font-bold">
                ※ 탈퇴 처리가 완료된 이후에는 어떠한 경로로도 데이터를 복구할 수 없으며 계정 접근이 완전히 금지됩니다.
              </p>
            </div>
          </div>

          {/* Agree on permanent delete of standard dataset checkbox */}
          <div className="flex items-start gap-2.5 pt-2 select-none">
            <input 
              type="checkbox" 
              id="agree-data-deletion" 
              checked={agreeToTerm}
              onChange={(e) => setAgreeToTerm(e.target.checked)}
              className="mt-0.5 rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-red-500 h-4 w-4 shrink-0 transition-all cursor-pointer"
            />
            <label 
              htmlFor="agree-data-deletion" 
              className={`text-[11.5px] cursor-pointer leading-relaxed ${agreeToTerm ? 'font-bold text-red-400' : 'text-neutral-450'}`}
            >
              상기 개인정보 데이터 영구 파기 정책을 충분히 이해하였으며 소유 자원 소멸을 동의하고 탈퇴를 진행합니다.
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-neutral-800'}`}
            id="my-info-cancel-btn"
          >
            취소
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={!agreeToTerm || isDeleting}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              agreeToTerm 
                ? 'bg-red-650 hover:bg-red-700 text-white border-transparent' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
            id="my-info-delete-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? '탈퇴 전산 처리 중...' : '회원탈퇴 실행'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
