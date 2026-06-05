import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';
import MainPage from './MainPage';
import { AlertCircle, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'main'>(() => {
    return localStorage.getItem('currentUser') ? 'main' : 'login';
  });

  const [isQuotaExceeded, setIsQuotaExceeded] = useState(() => {
    return localStorage.getItem('db_use_sandbox') === 'true';
  });

  // Helper to detect if an error message pertains to Firebase Firestore Quota limits
  const isQuotaError = (errorMsg: string): boolean => {
    if (!errorMsg) return false;
    const lower = errorMsg.toLowerCase();
    return (
      lower.includes('quota') ||
      lower.includes('limit exceeded') ||
      lower.includes('resource exhausted') ||
      lower.includes('firestore.googleapis.com')
    );
  };

  useEffect(() => {
    // Intercept global unhandled promise rejections (highly accurate for async Firestore reads)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason instanceof Error ? event.reason.message : String(event.reason);
      if (isQuotaError(msg)) {
        setIsQuotaExceeded(true);
      }
    };

    // Intercept standard global errors
    const handleError = (event: ErrorEvent) => {
      const msg = event.error instanceof Error ? event.error.message : event.message;
      if (isQuotaError(msg)) {
        setIsQuotaExceeded(true);
      }
    };

    // Monkey-patch console.error to proactively listen for caught Firebase SDK errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(arg => String(arg)).join(' ');
      if (isQuotaError(msg)) {
        setIsQuotaExceeded(true);
      }
      originalConsoleError.apply(console, args);
    };

    // Monkey-patch console.warn as well
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const msg = args.map(arg => String(arg)).join(' ');
      if (isQuotaError(msg)) {
        setIsQuotaExceeded(true);
      }
      originalConsoleWarn.apply(console, args);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Provide a developer window trigger fallback
    (window as any).__setQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Quick helper to enable virtual offline sandbox / local demo fallback
  const handleEnableDemoMode = () => {
    const demoAdminUser = {
      id: "demo_admin_user_086",
      username: "windo086",
      nickname: "임시어드민",
      tetherWalletAddress: "TR7NHqfe61L19u7C6s3gKvPP659a4B36D8",
      balance: 154000000,
      points: 750000,
      createdAt: new Date().toISOString(),
      bets: [
        {
          id: "demo_bet_1",
          game: "스피드사다리(1분)",
          gameType: "speedladder1",
          round: 403,
          amount: 2000000,
          dividend: 1.95,
          group: "최종결과",
          option: "홀",
          status: "pending",
          rollResult: "대기중",
          createdAt: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem('db_use_sandbox', 'true');
    localStorage.setItem('currentUser', JSON.stringify(demoAdminUser));
    setCurrentScreen('main');
    window.location.reload();
  };

  const handleDisableDemoMode = () => {
    localStorage.removeItem('db_use_sandbox');
    localStorage.removeItem('currentUser');
    setIsQuotaExceeded(false);
    setCurrentScreen('login');
    window.location.reload();
  };

  const isCurrentlySandbox = localStorage.getItem('db_use_sandbox') === 'true';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white font-sans">
      {/* Real-time Dynamic Google Firestore Quota Exceeded Notification Banner */}
      {isQuotaExceeded && (
        <div className={`w-full ${isCurrentlySandbox ? 'bg-[#0a2015] border-emerald-900/80' : 'bg-[#1e0a0a] border-rose-900/80'} border-b px-4 py-3 sm:px-6 relative shadow-2xl z-50`}>
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 ${isCurrentlySandbox ? 'text-emerald-400' : 'text-red-400'} mt-0.5 flex-shrink-0 animate-pulse`} />
              <div>
                <h4 className={`text-sm font-black ${isCurrentlySandbox ? 'text-emerald-300' : 'text-rose-300'} tracking-tight flex items-center gap-2`}>
                  {isCurrentlySandbox 
                    ? '[⚡ 안내] 임시 로컬 데모 샌드박스 모드 활성화 중' 
                    : '[⚠️ 중요 안내] 데이터베이스 일일 무료 할당량(Quota Limit) 초과 감지'
                  }
                </h4>
                <p className="text-[12px] text-gray-300 mt-1 leading-5">
                  {isCurrentlySandbox 
                    ? '현재 Firestore 서버 연결 제한으로 인해 웹 브라우저 로컬 저장소(LocalStorage Sandbox Engine)를 활용하여 오프라인으로 자동 구동 중입니다. 모든 가상 입출업무, 출석 체크, 게임 내 베팅, 회차 관리 및 어드민 재정산 결과 기능이 브라우저에서 안전하게 영구 보호 및 독립 보장되고 있습니다.'
                    : '본 모의 예측 플랫폼에서 연동 중인 Google Firebase Firestore 데이터베이스의 일일 무료 읽기/쓰기 한도(Spark 프리 플랜 기준)가 현재 초과되어 Firestore API가 일시적으로 거부 처리되고 있습니다. 지속적인 서비스 제공을 위해 데이터베이스를 업그레이드(Pay-as-you-go 정량제 전환)하여 조치하실 수 있으며, 바로 원활히 기능을 로컬 환경에서 테스트하고 싶으신 경우 아래 임시 데모 모드 버튼을 사용하여 즉시 우회 진입할 수 있습니다.'
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              {!isCurrentlySandbox ? (
                <>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0846967003/firestore/databases/ai-studio-b5236bbb-f6e1-4e44-90d0-27290bc07c2e/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-red-700 hover:bg-red-650 text-white text-[11px] font-black px-4 py-2 rounded shadow transition flex items-center gap-1.5 focus:ring-2 focus:ring-red-450 uppercase"
                  >
                    <span>Firebase 콘솔에서 한도 업그레이드하기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleEnableDemoMode}
                    className="bg-neutral-800 hover:bg-neutral-750 text-emerald-450 border border-neutral-700 text-[11px] font-black px-4 py-2 rounded shadow transition flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-450"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>임시 로컬 데모 모드로 접속</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDisableDemoMode}
                  className="bg-neutral-800 hover:bg-neutral-700 text-rose-450 border border-neutral-700 text-[11px] font-black px-4 py-2 rounded shadow transition flex items-center gap-1.5 focus:ring-2 focus:ring-rose-450"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>실제 데이터베이스(Firestore) 재연동 시도</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Router layout content wrapper */}
      <div className="flex-1 flex flex-col relative">
        {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
        {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
        {currentScreen === 'main' && <MainPage onLogout={() => setCurrentScreen('login')} />}
      </div>
    </div>
  );
}

