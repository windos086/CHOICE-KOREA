import React from 'react';
import BGMControls from './BGMControls';

export default function BGMPlayer() {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] hidden md:flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-neutral-700">
      <BGMControls />
    </div>
  );
}
