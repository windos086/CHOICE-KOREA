import React from 'react';
import { ShieldCheck, ArrowLeft, Home } from 'lucide-react';
import PrivacyPolicyContent from './PrivacyPolicyContent';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070a13] text-gray-205 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full bg-[#0d111e] border border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 border-b border-neutral-800/80 pb-6">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">개인정보처리방침</h1>
          <p className="text-xs text-neutral-400">초이스 코리아(CHOICE KOREA) 통합 개인정보 보호 가이드라인</p>
        </div>

        {/* Content Section */}
        <div className="max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
          <PrivacyPolicyContent />
        </div>

        {/* Back Actions */}
        <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-neutral-550">
          <div>
            개인정보 보호 문의: <a href="mailto:sinpotnf@gmail.com" className="text-blue-400 font-bold hover:underline">sinpotnf@gmail.com</a>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-gray-300 transition-all font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>이전으로</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all font-bold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>메인 홈으로</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
