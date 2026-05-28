import React from 'react';
import { UserProfile } from '../types';
import { Trophy } from 'lucide-react';
import { renderMilitaryBadge } from './MilitaryBadge';

interface UserRankingProps {
  allUsers: UserProfile[];
}

export default function UserRanking({ allUsers }: UserRankingProps) {
  // Sort users by successCount first, then predictsCount
  const sortedUsers = [...allUsers]
    .filter(u => u.nickname !== '최고관리자') // optional: exclude admin
    .sort((a, b) => {
      const aSuccess = a.successCount || 0;
      const bSuccess = b.successCount || 0;
      if (bSuccess !== aSuccess) {
        return bSuccess - aSuccess;
      }
      const aPredicts = a.predictsCount || 0;
      const bPredicts = b.predictsCount || 0;
      return bPredicts - aPredicts;
    })
    .slice(0, 10);

  return (
    <div className="bg-[#111111] border border-[#2b2b2b] rounded-2xl p-4 shadow-lg flex flex-col h-auto mt-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-white font-bold text-sm tracking-wide">누적 회원 랭킹 TOP 10</h3>
      </div>
      
      <div className="space-y-2">
        {sortedUsers.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-4">랭킹 데이터가 없습니다.</div>
        ) : (
          sortedUsers.map((user, index) => {
            const isTop3 = index < 3;
            return (
              <div 
                key={user.uid} 
                className={`flex items-center justify-between p-2 rounded-lg ${
                  index === 0 ? 'bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border border-gray-400/20' :
                  index === 2 ? 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30' :
                  'hover:bg-neutral-800/50'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shrink-0 ${
                    index === 0 ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'text-gray-500 bg-neutral-800'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                  )}
                  
                  <div className="flex items-center gap-1 truncate max-w-[110px] md:max-w-[135px]">
                    {renderMilitaryBadge(user.activeBadge, "mr-1 shrink-0")}
                    <span className={`font-semibold text-sm truncate ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                      {user.nickname}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[9px] text-gray-500 font-semibold tracking-tight">참여횟수 / 적중횟수</span>
                  <div className="text-xs bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-gray-400 font-mono flex items-center justify-center min-w-[60px] gap-1.5" title="참여횟수 / 예측적중">
                    <span className="text-blue-400 font-bold">{user.predictsCount || 0}</span>
                    <span className="text-gray-600 text-[10px]">/</span>
                    <span className="text-green-500 font-bold">{user.successCount || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
