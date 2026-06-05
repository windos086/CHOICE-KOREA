import React, { useState, useEffect } from 'react';
import { Trophy, Target, Circle, DollarSign, Zap } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SportsContainer() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedMatches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(fetchedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="flex-1 p-6 w-full mx-auto max-w-6xl text-white">
      {/* Category Selection removed as requested */}

      {/* Banner */}
      <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 p-6 rounded-lg mb-6 border border-neutral-700">
        <h2 className="text-xl font-bold mb-2">실시간 경기 배팅</h2>
        <p className="text-gray-400">현재 진행 중인 경기의 배당을 확인하고 바로 배팅하세요.</p>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">데이터를 불러오는 중입니다...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10 text-gray-400">등록된 경기가 없습니다.</div>
        ) : (
          matches.map((match) => (
                <div key={match.id} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden my-4">
                  <div className="p-3 bg-neutral-800/50 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{match.league}</span>
                  </div>
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-4 p-4 items-center">
                    <div className="text-right font-bold">{match.homeTeam}</div>
                    <div className="text-xs text-gray-500">{match.dateTime}</div>
                    <div className="font-bold">{match.awayTeam}</div>
                  </div>
                  
                  {/* Markets */}
                  <div className="text-white text-sm divide-y divide-neutral-800">
                    <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 p-3 text-center">
                      <div className="font-bold text-amber-500">{(match.markets?.matchWinner?.home || 0).toFixed(2)}</div>
                      <div className="font-bold text-amber-500">{(match.markets?.matchWinner?.draw || 0).toFixed(2)}</div>
                      <div className="font-bold text-amber-500">{(match.markets?.matchWinner?.away || 0).toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 p-3 items-center">
                      <div className="text-center font-bold text-amber-500">H {(match.markets?.handicap?.oddsHome || 0).toFixed(2)}</div>
                      <div className="text-center text-red-500 font-bold">{match.markets?.handicap?.value || '-'}</div>
                      <div className="text-center font-bold text-amber-500">H {(match.markets?.handicap?.oddsAway || 0).toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 p-3 items-center">
                      <div className="text-center font-bold text-amber-500">O {(match.markets?.overUnder?.oddsOver || 0).toFixed(2)}</div>
                      <div className="text-center text-amber-500 font-bold">{match.markets?.overUnder?.value || '-'}</div>
                      <div className="text-center font-bold text-amber-500">U {(match.markets?.overUnder?.oddsUnder || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
          ))
        )}
      </div>
    </div>
  );
}
