import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PointHistoryViewProps {
  currentUserData: any;
}

export default function PointHistoryView({ currentUserData }: PointHistoryViewProps) {
  const pointsHistory = currentUserData?.pointsHistory || [];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalItems = pointsHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Handle page boundaries automatically if items disappear/update
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = pointsHistory.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate pagination buttons
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, activePage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
            activePage === i
              ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20'
              : 'bg-neutral-850 hover:bg-neutral-800 text-gray-400 hover:text-white border border-neutral-800'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex-1 p-4 md:p-8 w-full mx-auto max-w-[1550px]" id="point-history-view-id">
      <div className="mb-4 text-sm text-gray-400 font-sans" id="point-history-breadcrumb">
        <span className="text-gray-500">홈</span> &gt; 포인트 내역
      </div>

      <div className="bg-[#0e111a] border border-neutral-800/80 rounded-xl p-5 md:p-7 shadow-2xl animate-fade-in" id="point-history-card-panel">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center font-sans animate-slide-in" id="point-history-title">
            포인트 내역 <span className="text-amber-500 text-[10px] font-black tracking-wider uppercase bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 ml-2">POINT HISTORY</span>
          </h2>
          {totalItems > 0 && (
            <span className="text-xs font-semibold text-gray-400 font-mono">
              전체 {totalItems.toLocaleString()}건 중 {startIndex + 1}~{Math.min(endIndex, totalItems)}건 표시 (페이지 {activePage}/{totalPages})
            </span>
          )}
        </div>

        {(!pointsHistory || pointsHistory.length === 0) ? (
          <div className="w-full text-center text-gray-500 py-24 border border-dashed border-neutral-800 rounded-lg" id="no-points-placeholder">
            표시할 포인트 적립/교환 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40">
              {currentItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-neutral-900/40 last:border-0 hover:bg-neutral-900/10 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="text-[11px] text-gray-500 font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                    <div className="flex items-center gap-2">
                       {item.type === 'exchange' ? (
                          <span className="w-10 flex-shrink-0 text-center text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold">교환</span>
                        ) : (
                          <span className="w-10 flex-shrink-0 text-center text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold">적립</span>
                        )}
                        <span className="text-xs text-gray-200 truncate">{item.description}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-bold font-mono ${item.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.amount >= 0 ? '+' : ''}{item.amount.toLocaleString()}P
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-neutral-900">
                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(activePage - 1)}
                  disabled={activePage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-850 bg-neutral-950 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition cursor-pointer"
                  title="이전 페이지"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {renderPageNumbers()}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(activePage + 1)}
                  disabled={activePage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-850 bg-neutral-950 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition cursor-pointer"
                  title="다음 페이지"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
