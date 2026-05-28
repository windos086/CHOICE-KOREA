import React from 'react';
import { UserProfile } from '../types';
import { Trophy, Medal, Award } from 'lucide-react';
import { renderMilitaryBadge } from './MilitaryBadge';

interface ChoiceRankingProps {
  allUsers: UserProfile[];
}

export default function ChoiceRanking({ allUsers }: ChoiceRankingProps) {
  const sortedUsers = [...allUsers]
    .filter(u => u.nickname !== '최고관리자')
    .sort((a, b) => {
      const aSuccess = a.successCount || 0;
      const bSuccess = b.successCount || 0;
      if (bSuccess !== aSuccess) return bSuccess - aSuccess;
      return (b.predictsCount || 0) - (a.predictsCount || 0);
    })
    .slice(0, 100);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-[#050608] min-h-screen text-gray-200">
      <div className="bg-[#111111] border border-[#2b2b2b] rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-white text-xl font-black mb-1">초이스 랭킹 TOP 100</h2>
        <p className="text-neutral-400 text-sm">회원들의 예측 적중 랭킹을 확인하세요.</p>
      </div>

      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const isTop3 = index < 3;
          return (
            <div 
              key={user.uid}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                isTop3 ? 'bg-[#1a1c24] border-neutral-700' : 'bg-[#111111] border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black shrink-0 ${
                  index === 0 ? 'bg-amber-500 text-black' :
                  index === 1 ? 'bg-gray-300 text-black' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'text-neutral-500 bg-neutral-800'
                }`}>
                  {index < 3 ? <Trophy className="w-4 h-4" /> : index + 1}
                </div>
                
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-neutral-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-neutral-800 text-xs flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                )}
                
                <div className="font-bold text-white tracking-wide flex items-center gap-1.5">
                  {renderMilitaryBadge(user.activeBadge, "shrink-0 mr-0.5")}
                  <span>{user.nickname}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 font-mono text-sm min-w-[140px]">
                <div className="text-center">
                  <span className="text-neutral-400 block text-[10px]">적중</span>
                  <span className="text-green-500 font-black text-lg">{user.successCount || 0}건</span>
                </div>
                <div className="text-center">
                  <span className="text-neutral-400 block text-[10px]">참여</span>
                  <span className="text-blue-500 font-black text-lg">{user.predictsCount || 0}건</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
