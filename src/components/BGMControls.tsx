import React from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useBGM } from './BGMProvider';

export default function BGMControls({ className }: { className?: string }) {
  const { isPlaying, isMuted, togglePlayPause, toggleMute } = useBGM();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button onClick={togglePlayPause} className="text-white hover:text-amber-400 p-1">
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button onClick={toggleMute} className="text-white hover:text-amber-400 p-1">
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
