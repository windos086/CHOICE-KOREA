import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Award, Activity, CheckCircle2, RefreshCw } from 'lucide-react';
import { BetRecord, PredictionCard } from '../types';
import { stripChildTag } from '../utils';

interface DashboardProps {
  points: number;
  betRecords: BetRecord[];
  predictionCards: PredictionCard[];
}

export default function Dashboard({ points, betRecords, predictionCards }: DashboardProps) {
  // Calculate stats
  const totalBets = betRecords.length;
  const wonBets = betRecords.filter(b => b.status === 'won');
  const winRate = totalBets > 0 ? Math.round((wonBets.length / totalBets) * 100) : 0;
  const totalStaked = betRecords.reduce((sum, b) => sum + b.amount, 0);
  const totalPayout = betRecords.reduce((sum, b) => sum + b.payout, 0);
  const netProfit = totalPayout - totalStaked;

  // Generate charts data representing historic point balance history
  const chartData = React.useMemo(() => {
    let currentBalance = 1000; // Start point
    const data = [{ name: '가입', 포인트: currentBalance }];
    
    // Sort bets chronologically to reconstruct point history
    const sortedBets = [...betRecords].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedBets.forEach((bet, idx) => {
      if (bet.status === 'won') {
        currentBalance += (bet.payout - bet.amount);
      } else if (bet.status === 'lost') {
        currentBalance -= bet.amount;
      }
      data.push({
        name: `베팅 ${idx + 1}`,
        포인트: currentBalance < 0 ? 0 : currentBalance,
      });
    });

    // If no bets, fill with dummy points progression
    if (data.length <= 1) {
      return [
        { name: '1일차', 포인트: 1000 },
        { name: '2일차', 포인트: 1250 },
        { name: '3일차', 포인트: 1100 },
        { name: '4일차', 포인트: 1800 },
        { name: '5일차', 포인트: points }
      ];
    }

    return data;
  }, [betRecords, points]);

  return (
    <div className="space-y-6">
      {/* 1. 핵심 성과 요약 (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 잔여 포인트 */}
        <div className="bg-[#121620] border border-[#ff4e4e]/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#ff4e4e]/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff4e4e]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">보유 참여 포인트</span>
            <span className="bg-[#ff4e4e]/20 text-[#ff4e4e] text-xs px-2 py-0.5 rounded-full font-mono font-semibold">LIVE</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span id="dashboard-points" className="text-3xl font-extrabold text-[#ff4e4e] font-mono tracking-wider">
              {points.toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm">P</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">추후 기프티콘 교환 가능</p>
        </div>

        {/* 예측 참여도 */}
        <div className="bg-[#121620] border border-gray-800/80 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">누적 예측 참여율</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {totalBets}
            </span>
            <span className="text-gray-400 text-sm">회</span>
          </div>
        </div>

        {/* 예측 성공률 */}
        <div className="bg-[#121620] border border-gray-800/80 rounded-xl p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-medium">예측 성공 적중률</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {winRate}
            </span>
            <span className="text-gray-400 text-sm">%</span>
          </div>
        </div>

        {/* 예측 데이터 그래프 제거 */}
      </div>

      {/* 나의 최근 참여 기록 데이터 */}
      <div className="bg-[#121620] border border-gray-800/80 rounded-xl p-5 overflow-hidden">
        <h3 className="text-white font-bold text-base mb-3 flex items-center">
          <Activity className="h-4 w-4 mr-2 text-[#ff4e4e]" />
          나의 최근 참여 내역 목록
        </h3>
        
        {betRecords.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-800 rounded-lg text-gray-500 text-sm">
            아직 예측에 참여한 이력이 없습니다. 메인 경기 카드를 누르고 첫 배팅을 개시해보세요!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-[#181f2d] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">에측 이벤트명</th>
                  <th className="px-4 py-3">선택한 예측 옵션</th>
                  <th className="px-4 py-3 text-center">결과 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {betRecords.slice().reverse().map((record) => {
                  const card = predictionCards.find(c => c.id === record.predictionId);
                  return (
                    <tr key={record.id} className="hover:bg-[#161c28]/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium max-w-xs truncate">
                        {card ? stripChildTag(card.title) : '삭제되거나 찾을 수 없는 게임'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#1e273a] text-xs text-gray-300 font-mono">
                          {record.option}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs">판정 대기중</span>
                        )}
                        {record.status === 'won' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-semibold">예측 적중</span>
                        )}
                        {record.status === 'lost' && (
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-500 text-xs">불적중</span>
                        )}
                        {record.status === 'refunded' && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 text-xs font-semibold">경기취소/적중특례 반환</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
