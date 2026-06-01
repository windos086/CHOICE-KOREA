import React from 'react';
import { X, ShieldAlert, BookOpen, Building, MailWarning } from 'lucide-react';

export type InfoTermType = 'about' | 'terms' | 'youth' | 'email-blocks';

interface InfoTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InfoTermType | null;
  theme: 'dark' | 'light';
}

export default function InfoTermModal({ isOpen, onClose, type, theme }: InfoTermModalProps) {
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

  if (!isOpen || !type) return null;

  const isDark = theme === 'dark';

  const getContent = () => {
    switch (type) {
      case 'about':
        return {
          title: '회사소개 (CHOICE KOREA)',
          icon: <Building className="w-5 h-5 text-red-500" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <p className="font-extrabold text-white text-base">종합 라이프-스포츠 통합 예측 플랫폼의 선두주자, 초이스 코리아</p>
              <p>
                <strong>초이스 코리아(CHOICE KOREA)</strong>는 유저 참여형 오피니언 데이터를 바탕으로 더 공정하고 혁신적인 지적 가치 창출을 지향하는 대한민국 최고의 통계 예측 크라우드소싱 전산 기지입니다. 단순한 스포츠 결과를 넘어 <strong>시사 뉴스, 글로벌 경제 지표, 국내외 대중 연예/방송 트렌드, 최신 기술 및 일상 라이프스타일 전반</strong>에 걸친 모든 테마의 향방을 직접 분석하고 주도적으로 예측에 참여할 수 있는 다이내믹 플랫폼입니다.
              </p>
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80 space-y-2 text-[11px] sm:text-xs">
                <p><strong>• 서비스명:</strong> 초이스 코리아 (CHOICE KOREA) 종합 오피니언 & 예측 트렌드 센터</p>
                <p><strong>• 주요 제공 서비스:</strong> 전세계 프로 스포츠 분석, 경제 현황 및 최신 뉴스 흐름, 엔터테인먼트 실적 투표, 그리고 다변화된 일상 주제별 예측 챌린지 및 통계 데이터 인프라</p>
                <p><strong>• 비전:</strong> "집단지성을 정량화하여 편향되지 않는 세상 모든 트렌드의 실시간 이정표 제시"</p>
              </div>
            </div>
          )
        };
      case 'terms':
        return {
          title: '이용약관 (Terms of Service)',
          icon: <BookOpen className="w-5 h-5 text-red-400" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <p className="font-bold text-white text-base">제 1 조 (목적 및 효력)</p>
              <p>
                본 약관은 초이스 코리아(이하 "회사")가 운영하는 웹 및 모바일 앱 서비스의 제반 예측 분석 서비스 이용 조건, 권리 및 책임 범위를 명확히 규정함을 목적으로 합니다. 가입과 동시에 본 규정에 동의한 것으로 처리됩니다.
              </p>
              <p className="font-bold text-white text-base">제 2 조 (포인트 제도 및 금지사항)</p>
              <p>
                1. 서비스 내에서 무료 제공되거나 퀘스트 완료로 적립된 <strong>포인트(P)</strong>는 모의 예측 데이터 참여를 위한 범용 수치이며, 어떠한 경우에도 외부 현금 결제나 불법 환전 요소로 변질되어 매매될 수 없습니다.<br />
                2. 이를 위반하는 행위 검출 시 해당 이용자는 사전 고지 없이 계정 이용 금지(영구 영구 제재)가 즉각 발효됩니다.
              </p>
              <p className="font-bold text-white text-base">제 3 조 (이용자의 권리 및 의무)</p>
              <p>
                이용자는 건전한 스포츠 분석 생태계를 저해하는 불법 해킹 프로그램 사용, 타인의 개인정보 도용, 비하적 발언, 부적절한 게시글 작성을 삼가야 하며, 회사는 관계 법령에 의거하여 부적합 회원의 제재 및 법적 통보 권한을 행사할 수 있습니다.
              </p>
            </div>
          )
        };
      case 'youth':
        return {
          title: '청소년 보호정책',
          icon: <ShieldAlert className="w-5 h-5 text-amber-500" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <p className="font-extrabold text-[#f59e0b] text-base">유해 정보로부터 청소년을 안전하게 보호합니다.</p>
              <p>
                초이스 코리아는 정보통신윤리위원회 규정 및 청소년보호법에 근거하여, 청소년들이 건전하고 유익한 환경에서 지식 정보를 탐색할 수 있도록 특화된 의사결정 보호 조치를 엄정 수립·운영하고 있습니다.
              </p>
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80 space-y-2 text-[11px] sm:text-xs">
                <p><strong>1. 유해 게시물 자율 검열 처리:</strong> 선정성, 도박 유도, 과격한 욕설 글은 AI 전산망 및 자율 정화 모니터링 시스템을 통해 즉각 차단 및 블라인드 조치됩니다.</p>
                <p><strong>2. 피해 예방 부서 지정:</strong> 청소년 보호 관련 전담 인력이 상시 가동되어, 문제 해결 및 접수를 지원합니다.</p>
              </div>
            </div>
          )
        };
      case 'email-blocks':
        return {
          title: '이메일 무단수집거부',
          icon: <MailWarning className="w-5 h-5 text-red-400" />,
          body: (
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <p className="font-extrabold text-white text-base">이메일 주소 무단 수집의 전면 거부를 명시합니다.</p>
              <p>
                본 웹사이트에 명시되어 게시된 각종 사용자 이메일 주소 및 관리자 정보가 <strong>이메일 수집 웹 크롤러 프로그램</strong>이나 기타 기술적 전산 모듈을 활용하여 무단으로 추출되거나 영리 목적 광고물 전송에 조작·활용되는 것을 전면 엄격 거부합니다.
              </p>
              <p className="text-red-400 font-bold text-xs">
                ※ 이를 위반할 경우 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제50조의 2항에 따라 전산 형사 처벌 및 고액의 과태료가 부과될 수 있음을 고지합니다.
              </p>
            </div>
          )
        };
    }
  };

  const currentContent = getContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" id="info-term-modal-backdrop">
      <div 
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[80vh] transition-all duration-300 transform scale-100 ${
          isDark 
            ? 'bg-[#0d10d1] bg-neutral-950 border-neutral-800 text-gray-200' 
            : 'bg-white border-gray-200 text-neutral-800'
        }`}
        id="info-term-modal-container"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-neutral-800/80' : 'border-gray-150'}`}>
          <div className="flex items-center space-x-2">
            {currentContent.icon}
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight">{currentContent.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-neutral-500 hover:text-black'}`}
            title="닫기"
            id="info-term-close-top-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar" id="info-term-modal-body">
          {currentContent.body}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end shrink-0 ${isDark ? 'border-neutral-800/80 bg-black/20' : 'border-gray-150 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-all"
            id="info-term-close-btn"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
