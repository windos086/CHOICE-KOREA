import React, { useState, useEffect } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';
import MainPage from './MainPage';
import { BGMProvider } from './components/BGMProvider';
import BGMPlayer from './components/BGMPlayer';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'main'>(() => {
    return localStorage.getItem('currentUser') ? 'main' : 'login';
  });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        // Update lastActive
        const updateActive = () => {
          updateDoc(doc(db, 'users', user.id), { lastActive: Date.now() });
        };
        const interval = setInterval(updateActive, 60000); // Every minute
        updateActive(); // Initial update

        const unsub = onSnapshot(doc(db, 'users', user.id), (doc) => {
          const userData = doc.data();
          if (userData && userData.sessionId && userData.sessionId !== user.sessionId) {
            alert('다른 기기에서 로그인되었습니다. 로그아웃합니다.');
            localStorage.removeItem('currentUser');
            window.location.reload();
          }
        });
        return () => { unsub(); clearInterval(interval); };
      }
    }
  }, [currentScreen]);

  // 실존 사용자 환경에서만 동적으로 타이틀을 설정하여, 봇 크롤러(텔레그램, 카카오톡 등)의 수집 과정에서는 빈 값으로 남겨두고 미리보기가 발생하지 않도록 함
  useEffect(() => {
    document.title = '록히드마틴';
  }, []);

  return (
    <>
      {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'main' && (
        <BGMProvider>
          <BGMPlayer />
          <MainPage onLogout={() => { localStorage.removeItem('currentUser'); setCurrentScreen('login'); }} />
        </BGMProvider>
      )}
    </>
  );
}
