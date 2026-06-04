import React, { useState } from 'react';
import { Trophy, Target, Circle, DollarSign, Zap } from 'lucide-react';

export default function SportsContainer() {
  return (
    <div className="flex-1 p-6 w-full mx-auto max-w-6xl text-white">
      {/* Category Selection */}
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
        <h2 className="text-xl font-bold mb-2">실시간 축구 경기 배팅</h2>
        <p className="text-gray-400">현재 진행 중인 경기의 배당을 확인하고 바로 배팅하세요.</p>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {/* Match Row Example */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
          <div className="text-sm">06-05 09:00 | 잉글랜드 프리미어리그</div>
          <div className="flex items-center gap-4">
            <span className="font-bold">팀 A</span>
            <span className="text-amber-500 font-bold">1.50</span>
            <span className="text-gray-500">VS</span>
            <span className="text-amber-500 font-bold">2.50</span>
            <span className="font-bold">팀 B</span>
          </div>
          <button className="bg-amber-600 px-4 py-2 rounded-lg text-sm">배팅</button>
        </div>
      </div>
    </div>
  );
}
