import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const BGM_URL = '/bgm.mp3';

export default function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Lower volume by default
      // Attempt to play on mount to support auto-playback
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn("Autoplay was blocked by browser policy, user interaction required:", e);
      });
    }
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(e => console.error("Play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-[9999] flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-neutral-700">
      <audio ref={audioRef} src={BGM_URL} loop />
      <button 
        onClick={togglePlayPause}
        className="text-white hover:text-amber-400 p-1"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button 
        onClick={toggleMute}
        className="text-white hover:text-amber-400 p-1"
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
