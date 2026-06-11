
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Card = { suit: '♠' | '♥' | '♦' | '♣'; value: string; color: string };

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getRandomCard = (): Card => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  return { suit, value, color: (suit === '♥' || suit === '♦') ? 'text-red-600' : 'text-neutral-900' };
};

const CardView = ({ card, label }: { card: Card, label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-[10px] text-zinc-400 mb-1">{label}</span>
    <motion.div 
      initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      className="w-14 h-20 bg-white rounded-md shadow-2xl flex flex-col items-center justify-between p-1 border border-zinc-200"
    >
      <div className={`text-sm font-bold ${card.color}`}>{card.value}</div>
      <div className={`text-lg ${card.color}`}>{card.suit}</div>
    </motion.div>
  </div>
);

export default function BaccaratGame() {
  const [balance, setBalance] = useState(1000000);
  const [bet, setBet] = useState(10000);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [message, setMessage] = useState('배팅을 선택하세요!');
  const [isDealing, setIsDealing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isBettingOpen, setIsBettingOpen] = useState(true);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (isBettingOpen) {
            setIsBettingOpen(false);
            runGameLogic();
            return 10;
          } else {
            setIsBettingOpen(true);
            setPlayerCards([]);
            setBankerCards([]);
            setMessage('새 게임이 시작되었습니다. 배팅하세요!');
            return 20;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBettingOpen]);

  const runGameLogic = () => {
    setIsDealing(true);
    setMessage('배팅 마감! 결과 처리 중...');
    setTimeout(() => {
      const p1 = getRandomCard();
      const p2 = getRandomCard();
      const b1 = getRandomCard();
      const b2 = getRandomCard();
      setPlayerCards([p1, p2]);
      setBankerCards([b1, b2]);
      const pScore = ((p1.value === 'A' ? 1 : parseInt(p1.value) || 0) + (p2.value === 'A' ? 1 : parseInt(p2.value) || 0)) % 10;
      const bScore = ((b1.value === 'A' ? 1 : parseInt(b1.value) || 0) + (b2.value === 'A' ? 1 : parseInt(b2.value) || 0)) % 10;
      setMessage(`결과: Player ${pScore} vs Banker ${bScore}`);
      setIsDealing(false);
    }, 2000);
  };

  const handleBet = (type: 'player' | 'banker' | 'tie') => {
    if (!isBettingOpen) { setMessage('배팅 시간이 마감되었습니다.'); return; }
    if (bet > balance) { setMessage('잔액이 부족합니다.'); return; }
    
    // Simple state update for bet (in a real app, this would be a server-side bet)
    setBalance(prev => prev - bet);
    setMessage(`${type.toUpperCase()} 배팅 완료.`);
  };

  return (
    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 text-zinc-100 w-full max-w-4xl mx-auto flex flex-col gap-6 shadow-2xl">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent underline decoration-yellow-600">Evolution Professional Baccarat</h2>
        <div className="text-xl font-mono text-zinc-300 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-3">
            <span>보유머니: <span className="text-yellow-500 font-bold">{balance.toLocaleString()}원</span></span>
            <span className={`text-xl font-black ${isBettingOpen ? 'text-emerald-400' : 'text-red-500'}`}>
                {isBettingOpen ? `배팅 마감 ${timeLeft}초 전` : `결과 확인 ${timeLeft}초`}
            </span>
        </div>
      </div>
      
      {/* Table Area */}
      <div className="w-full h-72 bg-[#004d26] rounded-2xl border-4 border-yellow-700/50 flex flex-col justify-center items-center p-4 relative shadow-inner">
        <div className="absolute top-4 left-4 text-yellow-600 font-black text-xl uppercase tracking-widest bg-black/40 px-3 py-1 rounded">Dealer</div>
        <div className="flex gap-4 justify-center items-center h-full">
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-yellow-600 uppercase tracking-widest">Banker</span>
                <div className="flex gap-1 justify-center min-h-[90px]">
                    <AnimatePresence>
                        {bankerCards.map((c, i) => <CardView key={i} card={c} label={`B${i+1}`} />)}
                    </AnimatePresence>
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-yellow-600 uppercase tracking-widest">Player</span>
                <div className="flex gap-1 justify-center min-h-[90px]">
                    <AnimatePresence>
                        {playerCards.map((c, i) => <CardView key={i} card={c} label={`P${i+1}`} />)}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <div className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Select Bet Amount</div>
            <div className="flex gap-2">
                {[10000, 50000, 100000].map(amt => (
                    <button key={amt} onClick={() => setBet(amt)} className={`px-5 py-2 rounded-lg font-bold transition ${bet === amt ? 'bg-yellow-600 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{amt.toLocaleString()}</button>
                ))}
            </div>
        </div>
        
        <div className="flex gap-4">
            <button disabled={isDealing} onClick={() => handleBet('player')} className="flex-1 py-5 bg-blue-700 rounded-xl hover:bg-blue-600 font-black text-lg transition active:scale-95 disabled:opacity-50 border-b-4 border-blue-900">PLAYER</button>
            <button disabled={isDealing} onClick={() => handleBet('banker')} className="flex-1 py-5 bg-red-700 rounded-xl hover:bg-red-600 font-black text-lg transition active:scale-95 disabled:opacity-50 border-b-4 border-red-900">BANKER</button>
            <button disabled={isDealing} onClick={() => handleBet('tie')} className="flex-1 py-5 bg-emerald-700 rounded-xl hover:bg-emerald-600 font-black text-lg transition active:scale-95 disabled:opacity-50 border-b-4 border-emerald-900">TIE</button>
        </div>
      </div>
      
      <div className="text-lg font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 p-4 rounded-xl w-full text-center tracking-wide">
        {message}
      </div>
    </div>
  );
}
