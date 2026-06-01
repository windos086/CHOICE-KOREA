import React from 'react';
import { X, Check } from 'lucide-react';
import { getApiUrl } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (id: string, password?: string, customNickname?: string, customUid?: string) => Promise<boolean> | void | any;
  onRegisterClick: () => void;
  theme?: string;
  addToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onRegisterClick, theme = 'dark', addToast }: LoginModalProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [autoLogin, setAutoLogin] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow local development, standard preview hosts, and custom domains (e.g., choicekr.co.kr)
      const origin = event.origin;
      const currentOrigin = window.location.origin;
      
      const isAllowed = 
        origin === currentOrigin ||
        origin.endsWith('.run.app') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('choicekr.co.kr');

      if (!isAllowed) {
        return;
      }
      
      if (event.data?.type === 'KAKAO_OAUTH_SUCCESS') {
        const { email, nickname, id } = event.data;
        console.log("🧩 [Kakao OAuth Success Payload Ingested]:", event.data);
        alert(`🎉 카카오 실제 연동 로그인 성공!\n\n닉네임: ${nickname}\n계정: ${email}`);
        onLoginSuccess(email, 'social_secure_bypass', nickname, `kakao_${id}`);
        onClose();
      }

      if (event.data?.type === 'KAKAO_OAUTH_FAILURE') {
        const errorMsg = event.data.error || '알 수 없는 카카오 로그인 오류가 발생했습니다.';
        console.error("🧩 [Kakao OAuth Failure Payload Ingested]:", event.data);
        alert(`❌ 카카오 실제인증 연동 실패\n\n상세 정보: ${errorMsg}\n\n카카오 디벨로퍼스 앱 설정(리다이렉트 URI, 플랫폼 허용 도메인) 및 환경 구성품을 체크해 주세요.`);
        setErrorMessage(`카카오 로그인 실패: ${errorMsg}`);
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { email, nickname, id } = event.data;
        console.log("🧩 [Google OAuth Success Payload Ingested]:", event.data);
        alert(`🎉 구글 실제 연동 로그인 성공!\n\n닉네임: ${nickname}\n계정: ${email}`);
        onLoginSuccess(email, 'social_secure_bypass', nickname, `google_${id}`);
        onClose();
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const cleanPw = password.trim();

    if (!cleanEmail) {
      setErrorMessage('아이디를 입력해 주세요.');
      return;
    }

    if (!cleanPw) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    // Submit using clean helper and only close modal if successful
    try {
      const outcome = onLoginSuccess(cleanEmail, cleanPw);
      const isSuccess = outcome instanceof Promise ? await outcome : outcome;
      if (isSuccess) {
        onClose();
      } else {
        setErrorMessage('로그인 정보가 없거나 패스워드가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  // Social log-in automatic simulation handlers
  const handleSocialLogin = async (platform: string) => {
    setErrorMessage('');
    
    // WebView / In-app Browser environment checker (Storage-partition safe)
    const isWebView = () => {
      if (typeof window === 'undefined') return false;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      return (
        ua.includes('wv') ||
        ua.includes('WebView') ||
        (ua.includes('Android') && ua.includes('Version/')) || // Android WebView
        ua.includes('KAKAOTALK') || // KakaoTalk in-app WebView
        ua.includes('Line') ||
        ua.includes('Instagram') ||
        ua.includes('FBAN') || ua.includes('FBAV') || // Facebook App
        (ua.includes('iPhone') && !ua.includes('Safari')) // iOS Custom WebView
      );
    };

    if (platform === 'google') {
      // WebView/In-app Browser env logic: Force top-level redirect immediately
      const originUrl = window.location.origin;
      const apiTarget = getApiUrl(`/api/auth/google/url?origin=${encodeURIComponent(originUrl)}`);
      
      try {
        const response = await fetch(apiTarget);
        console.log("🔍 [Debug] Google fetch target:", apiTarget, "Status:", response.status);

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.url) {
            console.log("🚀 [Google OAuth] Opening in new window:", resData.url);
            window.open(resData.url, '_blank');
            return;
          } else {
            console.error("Google Auth API Error:", resData.error);
            setErrorMessage(`로그인 설정 오류: ${resData.error || '연결에 실패했습니다.'}`);
          }
        } else {
          console.error("Google Auth API unreachable:", response.status);
          setErrorMessage("로그인 서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        }
      } catch (err: any) {
        console.error("Google Auth Exception:", err);
        setErrorMessage(`로그인 처리 중 오류가 발생했습니다: ${err.message || '네트워크 오류'}`);
      }
      return;
    }

    if (platform === 'kakao') {
      // WebView/In-app Browser env logic: Force top-level redirect immediately
      const originUrl = window.location.origin;
      const apiTarget = getApiUrl(`/api/auth/kakao/url?origin=${encodeURIComponent(originUrl)}`);
      
      try {
        const response = await fetch(apiTarget);
        console.log("🔍 [Debug] Kakao fetch target:", apiTarget, "Status:", response.status);

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.url) {
            console.log("🚀 [Kakao OAuth] Opening in new window:", resData.url);
            window.open(resData.url, '_blank');
            return;
          } else {
            console.error("Kakao Auth API Error:", resData.error);
            setErrorMessage(`로그인 설정 오류: ${resData.error || '연결에 실패했습니다.'}`);
          }
        } else {
          console.error("Kakao Auth API unreachable:", response.status);
          setErrorMessage("로그인 서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        }
      } catch (err: any) {
        console.error("Kakao Auth Exception:", err);
        setErrorMessage(`로그인 처리 중 오류가 발생했습니다: ${err.message || '네트워크 오류'}`);
      }
      return;
    }

    // Generate simulated premium user profile matching the chosen platform
    const prefix = platform === 'google' ? 'google_' : platform === 'naver' ? 'naver_' : platform === 'kakao' ? 'kakao_' : 'apple_';
    const randId = prefix + Math.floor(1000 + Math.random() * 9000);
    const mockEmail = `${randId}@choice-korea.com`;
    const mockNickname = `${platform.toUpperCase()}_${randId.split('_')[1]}`;
    
    alert(`🎉 ${platform.toUpperCase()} 간편 로그인 정보 안전연동 성공!\n계정 가명(${randId})으로 자동 접속 및 포인트가 동기화됩니다.`);
    onLoginSuccess(mockEmail, 'social_secure_bypass', mockNickname, randId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Main card matching client's second screenshot (Classic high-contrast clean design) */}
      <div className="relative bg-white w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl p-7 md:p-8 animate-fade-in text-black font-sans">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition cursor-pointer p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-8 mt-1 text-left">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight select-none">
            로그인
          </h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <div>
            <input 
              type="text"
              placeholder="아이디"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 rounded-xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 font-medium focus:outline-none transition-all"
            />
          </div>

          {/* Password input field */}
          <div>
            <input 
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 rounded-xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 font-medium focus:outline-none transition-all"
            />
          </div>

          {/* Auto login checkbox */}
          <div className="flex items-center justify-between pt-1 select-none">
            <label className="flex items-center space-x-2 text-gray-500 font-semibold text-xs cursor-pointer">
              <button
                type="button"
                onClick={() => setAutoLogin(!autoLogin)}
                className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border transition-all ${
                  autoLogin 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-200 text-transparent'
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>
              <span className="text-[11.5px] text-gray-400 font-medium">자동 로그인</span>
            </label>
          </div>

          {/* Validation Alert */}
          {errorMessage && (
            <p className="text-red-500 text-[11px] font-bold text-center mt-1">
              ⚠️ {errorMessage}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-[#dde2eb] hover:bg-[#cfd5df] active:scale-[0.99] text-gray-600 font-black text-xs rounded-xl mt-4 transition shadow-sm cursor-pointer select-none text-center"
          >
            로그인하기
          </button>
        </form>

        {/* Action Utility Links */}
        <div className="flex items-center justify-center space-x-4 my-7 text-[11.5px] font-medium text-gray-400">
          <button 
            type="button"
            className="hover:text-gray-700 hover:underline transition bg-transparent p-0 border-none cursor-pointer"
            onClick={() => {
              if (addToast) {
                addToast('운영진에 문의해주세요', 'info');
              } else {
                alert('운영진에 문의해주세요');
              }
            }}
          >
            비밀번호 찾기
          </button>
          <span className="text-gray-200">|</span>
          <button 
            type="button"
            className="text-gray-500 hover:text-gray-800 hover:underline font-bold transition bg-transparent p-0 border-none cursor-pointer"
            onClick={() => {
              onRegisterClick();
              onClose();
            }}
          >
            회원가입
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-150"></div>
          <span className="flex-shrink mx-4 text-gray-405 text-[10.5px] font-bold tracking-widest select-none bg-white px-2">또는</span>
          <div className="flex-grow border-t border-gray-150"></div>
        </div>

        {/* Social Buttons matching the gorgeous rounded graphics exactly */}
        <div className="flex flex-col items-center pt-5 pb-2">
          <p className="text-[10px] text-gray-400 font-bold mb-3">
            구글 및 카카오 간편 원클릭 계정 연동 활성화 중
          </p>
          <div className="flex items-center justify-center gap-4.5">
            
            {/* Kakao (Active!) */}
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="w-13 h-13 rounded-full bg-[#FEE500] hover:scale-105 hover:brightness-110 active:scale-95 transition flex items-center justify-center shadow-md cursor-pointer relative select-none ring-2 ring-yellow-400/40 ring-offset-2 animate-pulse"
              title="카카오 로그인 (연동 즉시 시작)"
            >
              <svg className="w-6 h-6 text-[#191919]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-5.523 0-10 3.535-10 7.9c0 2.825 1.848 5.295 4.633 6.64-.176.65-.635 2.34-.726 2.705-.11.455.168.448.354.323.146-.097 2.337-1.587 3.282-2.228.795.11 1.62.16 2.457.16 5.523 0 10-3.535 10-7.9s-4.477-7.9-10-7.9z" />
              </svg>
            </button>

            {/* Google (Highly Active & Accessible!) */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-13 h-13 rounded-full bg-[#ea4335] hover:scale-105 hover:brightness-110 active:scale-95 transition flex items-center justify-center shadow-md cursor-pointer font-black text-xl text-white relative select-none ring-2 ring-rose-500/40 ring-offset-2 animate-pulse"
              title="구글 로그인 (연동 즉시 시작)"
            >
              G
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
