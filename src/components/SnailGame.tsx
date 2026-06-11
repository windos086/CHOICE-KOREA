import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

const snails = ['달팽이1', '달팽이2', '달팽이3', '달팽이4'];

export default function SnailGame() {
  const [positions, setPositions] = useState([0, 0, 0, 0]);
  const [raceActive, setRaceActive] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const startRace = () => {
    setRaceActive(true);
    setPositions([0, 0, 0, 0]);
    setWinner(null);
    
    let timer = setInterval(() => {
      setPositions(prev => {
        const next = prev.map(p => p + Math.random() * 5);
        if (next.some(p => p >= 100)) {
          clearInterval(timer);
          setRaceActive(false);
          setWinner(snails[next.findIndex(p => p >= 100)]);
        }
        return next;
      });
    }, 50);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 text-white w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold text-amber-500">네임드 달팽이 레이싱</h2>
      <div className="w-full h-64 bg-emerald-800 rounded-lg relative overflow-hidden p-2">
        {positions.map((pos, i) => (
          <motion.div 
            key={i}
            className="absolute left-0 text-3xl"
            style={{ top: `${i * 25}%`, left: `${pos}%` }}
            animate={{ left: `${Math.min(pos, 100)}%` }}
          >
            🐌
          </motion.div>
        ))}
      </div>
      <button 
        disabled={raceActive}
        onClick={startRace}
        className="px-8 py-3 bg-amber-600 rounded-lg font-bold hover:bg-amber-500 disabled:opacity-50"
      >
        {raceActive ? '레이싱 중...' : '레이스 시작'}
      </button>
      {winner && <div className="text-xl font-bold">우승자: {winner}</div>}
    </div>
  );
}
