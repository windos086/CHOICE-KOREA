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
      {/* Category Selection (Static for now) */}
      <div className="flex gap-4 mb-6">
        {[
          { icon: Trophy, name: '축구' },
          { icon: Target, name: '농구' },
          { icon: Circle, name: '야구' },
          { icon: Circle, name: '배구' },
        ].map((sport, idx) => (
          <button key={idx} className="flex flex-col items-center gap-2 p-4 bg-neutral-900 border border-neutral-800 rounded-lg w-24 hover:border-amber-500">
            <sport.icon className="w-8 h-8 text-amber-500" />
            <span className="text-sm">{sport.name}</span>
          </button>
        ))}
      </div>

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
            <div key={match.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
              <div className="text-xs text-gray-400">
                <div>{match.dateTime}</div>
                <div className="text-amber-500">{match.league}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">{match.homeTeam}</span>
                <span className="text-amber-500 font-bold">{match.homeDividend.toFixed(2)}</span>
                <span className="text-gray-500">VS</span>
                <span className="text-amber-500 font-bold">{match.awayDividend.toFixed(2)}</span>
                <span className="font-bold">{match.awayTeam}</span>
              </div>
              <button className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg text-sm text-white font-bold transition">배팅</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
