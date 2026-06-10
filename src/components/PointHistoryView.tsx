import React from 'react';

interface PointHistoryViewProps {
  currentUserData: any;
}

export default function PointHistoryView({ currentUserData }: PointHistoryViewProps) {
  const pointsHistory = currentUserData?.pointsHistory || [];

  return (
    <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]" id="point-history-view-id">
      <div className="mb-4 text-sm text-gray-400 font-sans" id="point-history-breadcrumb">
        <span className="text-gray-500">홈</span> &gt; 포인트 내역
      </div>

      <div className="bg-[#0e111a] border border-neutral-800/80 rounded-xl p-5 md:p-7 shadow-2xl" id="point-history-card-panel">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center mb-6 font-sans" id="point-history-title">
          포인트 내역 <span className="text-amber-500 text-[10px] font-black tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 ml-2">POINT HISTORY</span>
        </h2>

        {(!pointsHistory || pointsHistory.length === 0) ? (
          <div className="w-full text-center text-gray-500 py-24 border border-dashed border-neutral-800 rounded-lg animate-fade-in" id="no-points-placeholder">
            표시할 포인트 적립/교환 내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40">
            <table className="w-full text-center text-xs text-gray-300">
              <thead className="bg-[#0b0e14] border-b border-neutral-800/80 text-gray-400 text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="p-3 text-left pl-6">일시</th>
                  <th className="p-3 text-center">유형</th>
                  <th className="p-3 text-center">상세 내용</th>
                  <th className="p-3 text-right pr-6">포인트 변동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/40">
                {pointsHistory.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-900/10 transition-colors">
                    <td className="p-3 text-left pl-6 font-mono text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                    <td className="p-3 text-center font-bold">{item.type === 'exchange' ? <span className="text-emerald-400">교환</span> : <span className="text-amber-400">적립</span>}</td>
                    <td className="p-3 text-center">{item.description}</td>
                    <td className={`p-3 text-right pr-6 font-bold font-mono ${item.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}P</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
