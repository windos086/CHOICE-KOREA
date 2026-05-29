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

      <div className="space-y-2.5">
        {sortedUsers.map((user, index) => {
          const isTop3 = index < 3;
          return (
            <div 
              key={user.uid}
              className={`flex items-center justify-between p-3.5 md:p-4 rounded-xl border transition-all ${
                isTop3 ? 'bg-[#161822] border-neutral-800' : 'bg-[#0f1014] border-neutral-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 md:gap-4 min-w-0 flex-1">
                <div className={`w-7.5 h-7.5 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs md:text-sm font-black shrink-0 ${
                  index === 0 ? 'bg-amber-500 text-black shadow-md' :
                  index === 1 ? 'bg-gray-300 text-black shadow-md' :
                  index === 2 ? 'bg-amber-700 text-white shadow-md' :
                  'text-neutral-500 bg-neutral-900'
                }`}>
                  {index < 3 ? <Trophy className="w-3.5 h-3.5" /> : index + 1}
                </div>
                
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-neutral-900 text-xs flex items-center justify-center border border-neutral-800 shrink-0 select-none">👤</span>
                )}
                
                <div className="font-extrabold text-[14.5px] md:text-[15.5px] text-white tracking-tight flex items-center gap-1.5 min-w-0">
                  {renderMilitaryBadge(user.activeBadge, "shrink-0")}
                  <span className="truncate whitespace-nowrap" title={user.nickname}>
                    {user.nickname}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 md:gap-4 font-mono text-xs md:text-sm shrink-0 pl-2 select-none">
                <div className="text-center min-w-[50px] md:min-w-[65px]">
                  <span className="text-neutral-500 block text-[9px] md:text-[10px] font-bold">적중</span>
                  <span className="text-emerald-500 font-extrabold text-[15px] md:text-[17px]">{user.successCount || 0}건</span>
                </div>
                <div className="text-center min-w-[50px] md:min-w-[65px]">
                  <span className="text-neutral-500 block text-[9px] md:text-[10px] font-bold">참여</span>
                  <span className="text-sky-500 font-extrabold text-[15px] md:text-[17px]">{user.predictsCount || 0}건</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
