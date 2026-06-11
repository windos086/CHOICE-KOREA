import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';
import MainPage from './MainPage';
import { BGMProvider } from './components/BGMProvider';
import BGMPlayer from './components/BGMPlayer';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'main'>(() => {
    return localStorage.getItem('currentUser') ? 'main' : 'login';
  });

  // 실존 사용자 환경에서만 동적으로 타이틀을 설정하여, 봇 크롤러(텔레그램, 카카오톡 등)의 수집 과정에서는 빈 값으로 남겨두고 미리보기가 발생하지 않도록 함
  useEffect(() => {
    document.title = '초이스';
  }, []);

  return (
    <BGMProvider>
      <BGMPlayer />
      {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'main' && <MainPage onLogout={() => setCurrentScreen('login')} />}
    </BGMProvider>
  );
}
