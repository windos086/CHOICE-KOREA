import React, { useState } from 'react';
import BaccaratGame from './BaccaratGame';
import SnailGame from './SnailGame';

export default function CasinoContainer() {
  const [activeTab, setActiveTab] = useState<'baccarat' | 'snail'>('baccarat');

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('baccarat')}
          className={`text-lg font-bold px-4 py-2 ${activeTab === 'baccarat' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          바카라
        </button>
        <button
          onClick={() => setActiveTab('snail')}
          className={`text-lg font-bold px-4 py-2 ${activeTab === 'snail' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          달팽이 레이싱
        </button>
      </div>
      
      <div className="mt-6">
        {activeTab === 'baccarat' ? <BaccaratGame /> : <SnailGame />}
      </div>
    </div>
  );
}
