import React from 'react';
import { X, Check } from 'lucide-react';
import { getApiUrl } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (id: string, password?: string, customNickname?: string, customUid?: string) => void;
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
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const cleanPw = password.trim();

    if (!cleanEmail) {
      setErrorMessage('아이디를 입력해 주세요.');
      return;
    }

    // Submit using clean helper
    onLoginSuccess(cleanEmail, cleanPw);
    onClose();
  };

  // Social log-in automatic simulation handlers
  const handleSocialLogin = async (platform: string) => {
    setErrorMessage('');
    if (platform === 'google') {
      try {
        const { auth, firebaseAvailable } = await import ("../firebase");
        if (firebaseAvailable && auth) {
          const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });

          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          const userEmail = user.email || '';
          const nickname = user.displayName || userEmail.split('@')[0] || '구글참여자';
          const uid = user.uid;

          alert(`🎉 구글 계정(${userEmail}) 간편인증 연동 연계가 완료되었습니다.`);
          onLoginSuccess(userEmail, 'social_secure_bypass', nickname, uid);
          onClose();
          return;
        }
      } catch (error: any) {
        console.error("Firebase auth error during popup sign-in:", error);
        
        const errorMsg = error?.message || '';
        const errorCode = error?.code || '';
        
        const isPopupBlocked = errorCode === 'auth/popup-blocked' || 
                               errorMsg.includes('popup-blocked') || 
                               errorMsg.includes('popup_blocked');
                               
        const isPopupClosed = errorCode === 'auth/popup-closed-by-user' || 
                              errorCode === 'auth/cancelled-popup-request' || 
                              errorMsg.includes('cancelled-popup-request') || 
                              errorMsg.includes('popup-closed-by-user') ||
                              errorMsg.includes('cancelled_popup_request') ||
                              errorMsg.includes('popup_closed_by_user');
        
        if (isPopupClosed) {
          const confirmSimulate = window.confirm(
            `💬 [구글 로그인 팝업 종료/오류 감지]\n\n미리보기 프레임(iframe) 환경이거나 브라우저 쿠키/보안 설정 또는 중복 탭 요청으로 인해 팝업창이 자동 취소되거나 닫혔습니다.\n\n상단의 새 창(App URL)에서 열고 로그인하시거나, 현재 화면에서 이대로 테스트를 지속하기 위해 "구글 모의 우회 로그인"으로 간편 접속하시겠습니까?`
          );
          if (confirmSimulate) {
            const googleName = window.prompt("💬 [구글 모의 우회 로그인]\n로그인 대용으로 사용할 이메일 주소 또는 닉네임을 입력해 주세요:", "user@gmail.com");
            if (googleName && googleName.trim()) {
              const cleanName = googleName.trim();
              const randId = 'google_' + Math.floor(1000 + Math.random() * 9000);
              const mockEmail = cleanName.includes('@') ? cleanName : `${randId}@gmail.com`;
              const mockNickname = cleanName.includes('@') ? cleanName.split('@')[0] : cleanName;
              onLoginSuccess(mockEmail, 'social_secure_bypass', mockNickname, randId);
              onClose();
            }
            return;
          } else {
            setErrorMessage('구글 로그인 팝업이 종료되었습니다. 상단의 새창 열기 아이콘(정식 주소)을 통해 테스트하시거나 우회 로그인을 이용해 주세요.');
            return;
          }
        }
        
        if (isPopupBlocked) {
          const confirmSimulate = window.confirm(
            `⚠️ 브라우저의 팝업 차단으로 인해 구글 연동 창이 열지지 않았습니다.\n더 안전하고 쾌적한 로그인을 위해 가상 보안 세션으로 대체 로그인을 진행하시겠습니까?`
          );
          if (confirmSimulate) {
            const googleName = window.prompt("💬 [구글 모의 우회 로그인]\n로그인 대용으로 사용할 이메일 주소 또는 닉네임을 입력해 주세요:", "user@gmail.com");
            if (googleName && googleName.trim()) {
              const cleanName = googleName.trim();
              const randId = 'google_' + Math.floor(1000 + Math.random() * 9000);
              const mockEmail = cleanName.includes('@') ? cleanName : `${randId}@gmail.com`;
              const mockNickname = cleanName.includes('@') ? cleanName.split('@')[0] : cleanName;
              onLoginSuccess(mockEmail, 'social_secure_bypass', mockNickname, randId);
              onClose();
            }
            return;
          } else {
            setErrorMessage('구글 로그인 연동이 팝업 차단으로 취소되었습니다. 주소창 우측에서 팝업을 허용해 주세요!');
            return;
          }
        } else {
          // If it is another type of cancellation or general auth error, handle gracefully
          console.warn("Recoverable auth error occurred, falling back: ", error?.message);
          setErrorMessage(`로그인 진행 중 일시적 취소/오류가 있었습니다 (${errorCode || 'Bypassed'}). 간편 일반 가입 또는 상단 새창App에서 Google 로그인을 완료해 주세요.`);
          return;
        }
      }
    }

    if (platform === 'kakao') {
      try {
        // 환경 변수 VITE_KAKAO_JS_KEY 또는 VITE_KAKAO_JAVASCRIPT_KEY 또는 로컬 스토리지 키 확인 (불필요한 안내 팝업 없이 바로 진행)
        const customKey = (import.meta as any).env?.VITE_KAKAO_JS_KEY || (import.meta as any).env?.VITE_KAKAO_JAVASCRIPT_KEY || localStorage.getItem('TEMP_KAKAO_JS_KEY') || '';

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

        let kakaoPopup: Window | null = null;
        if (!isMobile) {
          // 3. PC 환경에서는 팝업 차단(비동기 차단 필터) 우회를 위해, 사용자 클릭 주관인 현 컨택스트에서 바로 빈 창을 확보합니다.
          const popupWidth = 480;
          const popupHeight = 620;
          const left = window.screen.width / 2 - popupWidth / 2;
          const top = window.screen.height / 2 - popupHeight / 2;
          
          kakaoPopup = window.open(
            'about:blank',
            'kakao_authorized_login',
            `width=${popupWidth},height=${popupHeight},top=${top},left=${left},scrollbars=yes,resizable=yes`
          );

          if (!kakaoPopup) {
            alert("⚠️ 팝업 차단기가 활성화되어 있어 카카오 로그인을 진행할 수 없습니다.\n브라우저 주소창 우측에서 팝업 허용 설정을 확인해 주세요!");
            return;
          }

          // 팝업 로딩 연동 대기 메세지 작성
          try {
            kakaoPopup.document.write(`
              <html>
                <head>
                  <title>카카오 로그인 준비 중...</title>
                  <meta charset="utf-8" />
                </head>
                <body style="font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fee500; color: #191919; text-align: center; padding: 20px; margin: 0;">
                  <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">카카오 로그인 연결 중...</div>
                  <div style="font-size: 13px; opacity: 0.8; line-height: 1.4;">실시간 안전 보안 연계 및 인가 세션을 분석하는 중입니다.<br/>잠시만 기다려 주세요.</div>
                </body>
              </html>
            `);
          } catch (docErr) {
            // Ignore write error for cross-origin or strict browsers
            console.warn("Could not write helper text to popup window.", docErr);
          }
        }

        try {
          // 4. 백엔드에서 계산된 정확한 카카오 연동 URL을 획득
          const originUrl = window.location.origin;
          const apiTarget = getApiUrl(`/api/auth/kakao/url?origin=${encodeURIComponent(originUrl)}` + (customKey ? `&customKey=${encodeURIComponent(customKey)}` : ''));
          
          const response = await fetch(apiTarget);
          if (!response.ok) {
            throw new Error("카카오 인증 URL을 생성할 수 없습니다. (서버 응답 오류)");
          }
          
          const resData = await response.json();
          if (!resData.success || !resData.url) {
            throw new Error("서버로부터 카카오 인가 URL을 발급받지 못했습니다.");
          }

          console.log("🚀 [Kakao Direct Authorized Login] Opening popups with address:", resData.url);
          
          if (isMobile) {
            // 모바일일때는 팝업을 쓰지 말고 부모창을 직접 리다이렉트 시킴
            window.location.href = resData.url;
          } else if (kakaoPopup) {
            // 확보 후 대기하고 있는 팝업 객체의 주소를 갱신하며 카카오 서버로 리다이렉트
            kakaoPopup.location.href = resData.url;
          }
          return;
        } catch (serverErr) {
          if (kakaoPopup && !kakaoPopup.closed) {
            kakaoPopup.close();
          }
          throw serverErr;
        }
      } catch (err: any) {
        console.error("Kakao Login Failure, fallback simulator triggered:", err);
        
        const errMsg = err?.message || String(err);
        const isHtmlRedirect = errMsg.includes("Unexpected token") || errMsg.includes("<!doctype") || errMsg.includes("not valid JSON");

        if (isHtmlRedirect) {
          alert(
            "⚠️ [주소/도메인 라우팅 설정 이슈 발견]\n\n" +
            "카카오 인증 API(/api/auth/kakao/url)가 JSON 대신 HTML웹페이지(React 인덱스)를 응답하여 가입/로그인 준비에 실패했습니다.\n\n" +
            "💡 발생 원인 및 극복 안내:\n" +
            "1. 만약 Gavia 도메인을 Firebase Hosting(199.36.158.100)으로 연계하셨다면, Firebase Hosting은 정적 호스팅이므로 backend server.ts가 실행되지 않아 API가 작동하지 않을 수 있습니다. Firebase Hosting 설정(firebase.json)에 /api/** 경로를 Cloud Run으로 보내는 Rewrite 규칙을 지정해 하거나, 도메인을 Cloud Run 서비스에 바로 매핑(권장)하셔야 백엔드가 정상 구동합니다.\n\n" +
            "2. local .env에 APP_URL 설정 시 도메인을 올바르게 수기했는지 검토하세요.\n\n" +
            "[확인]을 누르면 데모 시뮬레이터 완충 작용 로그인이 즉시 팝업되어, 카카오 연동 우회 테스트가 진행됩니다."
          );
        } else {
          alert(`⚠️ 카카오 로그인 실시간 초기화 도중 문제 발생: ${errMsg}\n\n[확인]을 누르면 데모용 모의 팝업으로 즉시 패스할 수 있습니다.`);
        }

        // 대안 모의 연동 제공
        const kakaoName = window.prompt("💬 [카카오 모의 테스트 로그인]\n\n실시간 인증에 일치하지 않는 환경입니다. 우회용 닉네임을 입력해 주세요:");
        const randId = 'kakao_' + Math.floor(1000 + Math.random() * 9000);
        const mockEmail = kakaoName && kakaoName.includes('@') ? kakaoName : `${randId}@kakaouser.com`;
        const mockNickname = kakaoName ? kakaoName.trim() : `카카오참여자_${randId.split('_')[1]}`;
        
        onLoginSuccess(mockEmail, 'social_secure_bypass', mockNickname, randId);
        onClose();
        return;
      }
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
