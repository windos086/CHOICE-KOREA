import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegistrationScreen from './RegistrationScreen';
import MainPage from './MainPage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'main'>(() => {
    return localStorage.getItem('currentUser') ? 'main' : 'login';
  });

  return (
    <>
      {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'main' && <MainPage onLogout={() => setCurrentScreen('login')} />}
    </>
  );
}
