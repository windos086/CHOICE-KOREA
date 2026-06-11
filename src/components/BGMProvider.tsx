import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const BGMContext = createContext<any>(null);

export const BGMProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => {
            const startAudio = () => {
              audioRef.current?.play().then(() => setIsPlaying(true));
              document.removeEventListener('click', startAudio);
            };
            document.addEventListener('click', startAudio);
        });
      }
    }
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play().catch(console.error);
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <BGMContext.Provider value={{ isPlaying, isMuted, togglePlayPause, toggleMute }}>
      <audio ref={audioRef} src="/bgm.mp3" loop />
      {children}
    </BGMContext.Provider>
  );
};

export const useBGM = () => useContext(BGMContext);
