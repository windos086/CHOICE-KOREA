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
      <div className="mb-1 bg-gradient-to-b md:bg-gradient-to-r from-[#18181b] to-[#121214] p-6 md:p-8 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start space-x-4 w-full md:w-auto">
          <div className="bg-[#d11822]/10 p-3.5 rounded-xl border border-[#d11822]/20 shrink-0 self-center md:self-start">
            <Headphones className="h-6 w-6 text-[#d11822]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-black text-white leading-normal break-keep flex flex-wrap items-center gap-2">
              <span className="text-[#d11822] inline-flex items-center font-extrabold uppercase tracking-wide text-[11px] md:text-xs border border-[#d11822]/30 px-2 py-0.5 rounded-md bg-[#d11822]/10 select-none">
                CHOICE
              </span>
              <span className="text-white font-extrabold tracking-tight">1:1 고객 기술지원 센터</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed break-keep">
              초이스 코리아 커뮤니티 24시간 인텔리전트 전산 고객지원실입니다. 
              <br className="hidden md:inline" />
              <span className="block md:inline md:mt-0 mt-1">
                이용 관련 불편 사항 및 비지니스 문의: <span className="text-neutral-200 hover:text-white transition font-mono underline underline-offset-2 select-all">windos086@naver.com</span>
              </span>
            </p>
          </div>
        </div>
        <div className="w-fit shrink-0 flex items-center space-x-2 text-[11px] font-black tracking-tight text-neutral-300 bg-[#161618] border border-neutral-800 px-3.5 py-2 rounded-xl shadow-inner">
          <Clock className="h-3.5 w-3.5 text-[#d11822] animate-pulse shrink-0" />
          <span>업무 연중무휴 24HR 원스톱 승인</span>
        </div>
      </div>

    </div>
  );
}
