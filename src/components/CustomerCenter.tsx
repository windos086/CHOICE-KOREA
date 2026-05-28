import React from 'react';
import { Headphones, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface CustomerCenterProps {
  userProfile: UserProfile | null;
  onOpenLoginModal?: () => void;
}

export default function CustomerCenter({ userProfile, onOpenLoginModal }: CustomerCenterProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans text-neutral-200">
      
      {/* Support Banner Card */}
      <div className="mb-1 bg-gradient-to-r from-[#171717] to-[#1f1f1f] p-6 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center space-x-4">
          <div className="bg-[#d11822]/10 p-3 rounded-lg border border-[#d11822]/20">
            <Headphones className="h-6 w-6 text-[#d11822]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center space-x-2">
              <span className="text-[#d11822]">CHOICE</span>
              <span>1:1 고객 기술지원 센터</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              초이스 코리아 커뮤니티 24시간 인텔리전트 전산 고객지원실입니다. 이용 관련 불편 사항 및 비지니스 문의: windos086@naver.com
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-[11px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-[#d11822] animate-pulse" />
          <span>업무 연중무휴 24HR 원스톱 승인</span>
        </div>
      </div>

    </div>
  );
}
