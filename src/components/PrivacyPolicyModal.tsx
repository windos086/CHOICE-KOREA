import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import PrivacyPolicyContent from './PrivacyPolicyContent';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function PrivacyPolicyModal({ isOpen, onClose, theme }: PrivacyPolicyModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" id="privacy-policy-modal-backdrop">
      <div 
        className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] transition-all duration-300 transform scale-100 ${
          isDark 
            ? 'bg-[#0d101d] border-neutral-800 text-gray-200' 
            : 'bg-white border-gray-200 text-neutral-800'
        }`}
        id="privacy-policy-modal-container"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-neutral-800/80' : 'border-gray-150'}`}>
          <div className="flex items-center space-x-2 text-blue-500">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-extrabold tracking-tight">개인정보처리방침 (Privacy Policy)</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-neutral-500 hover:text-black'}`}
            title="닫기"
            id="privacy-close-top-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar" id="privacy-policy-modal-scrollable-body">
          <PrivacyPolicyContent />
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end shrink-0 ${isDark ? 'border-neutral-800/80 bg-black/20' : 'border-gray-150 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
            id="privacy-close-btn"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
