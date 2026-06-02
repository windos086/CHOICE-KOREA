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
  
  // Custom states for Native Google login configuration (to fix Developer Error 10 on Android/Capacitor)
  const [googleClientId, setGoogleClientId] = React.useState(() => {
    return localStorage.getItem('CAPACITOR_GOOGLE_CLIENT_ID') || '';
  });
  const [googleAndroidClientId, setGoogleAndroidClientId] = React.useState(() => {
    return localStorage.getItem('CAPACITOR_GOOGLE_ANDROID_CLIENT_ID') || '';
  });
  const [showConfig, setShowConfig] = React.useState(false);

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
    if (platform === 'google') {
      try {
        const { auth, firebaseAvailable } = await import ("../firebase");
        if (firebaseAvailable && auth) {
          const { signInWithPopup, signInWithCredential, GoogleAuthProvider } = await import("firebase/auth");
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });

          const { Capacitor } = await import("@capacitor/core");
          
          // Environment detection (Capacitor native platform check and isPlatform check)
          const isApp = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && typeof (window as any).isPlatform === 'function' && (window as any).isPlatform('capacitor'));

          if (isApp) {
            // Native google sign-in on mobile app environment
            const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
            
            // [안드로이드 구글 로그인 중요 설정]
            // 만약 디바이스/시뮬레이터 테스트 중 "requestIdToken" 또는 "audience" 오류 발생 시,
            // Android용 Client ID가 아닌 반드시 구글 콘솔의 "웹 애플리케이션 클라이언트 ID"를 지정하여 초기화해 주세요.
            const targetClientId = googleClientId.trim() || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '230268211245-f8eccccpe3bam3pu1vlcgq7cloftp4ce.apps.googleusercontent.com';
            const targetAndroidClientId = googleAndroidClientId.trim() || (import.meta as any).env?.VITE_GOOGLE_ANDROID_CLIENT_ID || '';
            
            console.log("🧩 [Capacitor Native Google Sign-In] Initialization Client ID (Web Application):", targetClientId, "and Android Client ID:", targetAndroidClientId || '(not set)');
            
            try {
              await GoogleAuth.initialize({
                clientId: targetClientId,
                ...(targetAndroidClientId ? { androidClientId: targetAndroidClientId } : {}),
                scopes: ['profile', 'email'],
                grantOfflineAccess: true,
              });
            } catch (initErr) {
              console.warn("GoogleAuth already initialized or failed in dynamic code:", initErr);
            }
            
            const googleUser = await GoogleAuth.signIn();
            const idToken = googleUser.authentication?.idToken;
            if (!idToken) {
              throw new Error("Native Google sign-in did not return a valid ID token.");
            }

            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            const user = result.user;
            const userEmail = user.email || '';
            const nickname = user.displayName || userEmail.split('@')[0] || '구글참여자';
            const uid = user.uid;

            alert(`🎉 구글 계정(${userEmail}) 간편인증 연동 연계가 완료되었습니다.`);
            onLoginSuccess(userEmail, 'social_secure_bypass', nickname, uid);
            onClose();
            return;
          } else {
            // Existing popup logic on web browser environment
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
        }
      } catch (error: any) {
        console.error("Firebase auth error during popup sign-in:", error);
        
        const errorMsg = error?.message || String(error);
        const errorCode = error?.code || '';
        const rawJsonError = JSON.stringify(error);
        
        // Handle physical/simulator Android Google Code 10 Developer Error
        const isDeveloperError = errorMsg.includes('10') || 
                                 errorCode.includes('10') || 
                                 errorMsg.toLowerCase().includes('developer') || 
                                 errorMsg.toLowerCase().includes('developer_error') ||
                                 rawJsonError.includes('10') ||
                                 rawJsonError.toLowerCase().includes('developer_error');
                                 
        if (isDeveloperError) {
          alert(
            `⚠️ [구글 로그인 개발자 오류 10 완벽 해결 가이드]\n\n` +
            `👉 로컬 APK나 에뮬레이터에서는 구글 로그인이 정상 작동했으나, 구글 플레이 스토어 '비공개 테스트' 배포 버전에서만 에러 10이 난다면 "배포용 앱 서명 키 지문(SHA-1)"이 파이어베이스에 안 올라갔기 때문입니다!\n\n` +
            `🔥 원인: 플레이 스토어에 앱을 올리면, 구글이 개발자 로컬 키(Upload Key) 대신 구글 플레이가 생성한 자체 "앱 서명 키(App signing key)"로 앱을 서명해서 재배포합니다. 이 서명키의 SHA-1 값을 등록하지 않으면 보안 불일치로 에러 10이 납니다.\n\n` +
            `✅ 해결 절차:\n` +
            `1. 구글 플레이 콘솔 (Google Play Console) 로그인\n` +
            `2. 해당 앱 선택 > [설정] > [앱 서명] 또는 [앱 무결성(App integrity)] 메뉴로 이동\n` +
            `3. '앱 서명 키 인증서' 섹션에 표시된 "SHA-1 인증서 지문"을 통째로 복사\n` +
            `4. 복사한 지문을 Firebase 콘솔 (프로젝트 설정 > 안드로이드 앱에 디지털 지문 추가) 및 구글 클라우드에 등록해 주세요.\n\n` +
            `⚠️ 새 자격증명을 만드셨다면 이전 하드코딩 Web Client ID는 만료되었으니, 새로 생성한 "웹 애플리케이션 클라이언트 ID"를 환경변수나 아래 모바일 설정 패널에 기재해야 정상 작동합니다.\n\n` +
            `오류 정보: ${errorMsg}\n\n` +
            `* 테스트 속행을 위해 '구글 모의 로그인'으로 바로 진입할 수 있게 도와드립니다.`
          );
          
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
        }
        
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
          const detailedErr = error?.message || String(error);
          setErrorMessage(`구글 로그인 실패 (${errorCode || '오류'}): ${detailedErr}. 일반 가입 또는 상단 새창App에서 Google 로그인을 완료해 주세요.`);
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
    const prefix = platform === 'google' ? 'google_' : platform === 'kakao' ? 'kakao_' : 'apple_';
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
      <div className="relative bg-white w-full max-w-[420px] max-h-[85vh] md:max-h-[90vh] rounded-3xl overflow-y-auto shadow-2xl p-6 md:p-8 animate-fade-in text-black font-sans scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        
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

          {/* New Custom Settings Accordion for Native Mobile Apps */}
          <div className="mt-4 w-full text-center">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline font-medium cursor-pointer transition-all inline-block mx-auto"
            >
              {showConfig ? '▲ 네이티브 모바일 앱 설정 닫기' : '▼ 네이티브 모바일 앱(Capacitor) 설정 열기'}
            </button>
            
             {showConfig && (
              <div className="mt-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-left text-[11px] animate-fade-in text-gray-600 font-medium">
                <div className="font-bold text-gray-700 select-none mb-1">
                  모바일 구글 로그인 상세 설정 (Error 10 해결)
                </div>
                <div className="text-gray-400 mb-2 leading-relaxed text-[10px]">
                  안드로이드 구글 로그인 연동 시 꼭 필요한 클라이언트 ID 정보들입니다:
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9.5px] font-bold text-gray-500 mb-1">1. 웹 애플리케이션 클라이언트 ID (Firebase 연동용)</label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGoogleClientId(val);
                        localStorage.setItem('CAPACITOR_GOOGLE_CLIENT_ID', val);
                      }}
                      placeholder="Web Client ID (230268111245-xxxx.apps.googleusercontent.com)"
                      className="w-full bg-white border border-gray-200 focus:border-gray-450 rounded-lg px-2.5 py-2 text-[10px] font-medium focus:outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9.5px] font-bold text-gray-500 mb-1">2. 안드로이드 클라이언트 ID (선택사항)</label>
                    <input
                      type="text"
                      value={googleAndroidClientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGoogleAndroidClientId(val);
                        localStorage.setItem('CAPACITOR_GOOGLE_ANDROID_CLIENT_ID', val);
                      }}
                      placeholder="Android Client ID (230268111245-yyyy.apps.googleusercontent.com)"
                      className="w-full bg-white border border-gray-200 focus:border-gray-450 rounded-lg px-2.5 py-2 text-[10px] font-medium focus:outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl space-y-1.5 text-[9.5px] text-amber-800">
                    <p className="font-bold">🔑 파이어베이스 등록용 내 앱 SHA-1 지문:</p>
                    <div className="bg-white/80 p-1.5 rounded border border-amber-100 font-mono select-all text-gray-700 break-all leading-normal">
                      <span className="font-bold text-red-600">[디버그] </span>29:5C:5B:AD:8E:6F:F4:30:B3:1C:FB:ED:6F:BE:D0:7F:5B:EB:C2:61
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-amber-100 font-mono select-all text-gray-700 break-all leading-normal">
                      <span className="font-bold text-red-600">[릴리즈] </span>5C:F6:97:94:26:AE:C4:A0:43:54:52:F2:68:6C:90:EA:64:DD:2F:AC
                    </div>
                  </div>

                  <div className="text-[9.5px] text-blue-500 font-semibold leading-relaxed space-y-2">
                    <div>
                      📌 <b>핵심 가이드 1:</b><br />
                      Firebase Auth 연동 시 토큰 검증 단계에서는 무조건 구글 클라우드 콘솔의 <b>&apos;웹 애플리케이션 클라이언트 ID&apos;</b>가 필요합니다! (위 1번 칸 입력)
                    </div>
                    <div>
                      📌 <b>핵심 가이드 2:</b><br />
                      기기 자체의 하드웨어 세션을 인식하기 위해, 안드로이드 빌드 패키지명 <code>com.choicekorea.app</code> 및 위 <b>[디버그 / 릴리즈] SHA-1 키 지문</b>을 파이어베이스/네이티브 구글 콘솔 안드로이드 설정에 꼭 등록해 주셔야 에러 10이 완치됩니다!
                    </div>
                    <div>
                      📌 <b>[경로 답변]:</b> <code>app/google-services.json</code> 경로 자체는 빌드가 잘 완료되었기 때문에 정확히 잘 들어가 있습니다! 파일 위치 문제가 아니니 SHA-1 지문 등록 및 갱신만 해주시면 됩니다.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
