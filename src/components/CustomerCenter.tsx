import React from 'react';
import { Headphones, Clock, Building, BookOpen, FileText, ShieldAlert, MailWarning } from 'lucide-react';
import { UserProfile } from '../types';
import PrivacyPolicyContent from './PrivacyPolicyContent';

interface CustomerCenterProps {
  userProfile: UserProfile | null;
  onOpenLoginModal?: () => void;
}

type TabType = 'about' | 'terms' | 'privacy' | 'youth' | 'email-blocks';

export default function CustomerCenter({ userProfile, onOpenLoginModal }: CustomerCenterProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('about');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans text-neutral-200" id="customer-center-container">
      
      {/* Support Banner Card */}
      <div className="mb-8 bg-gradient-to-b md:bg-gradient-to-r from-[#18181b] to-[#121214] p-6 md:p-8 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="support-banner">
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

      {/* Information & Policies Tab Container */}
      <div className="bg-[#141416]/90 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]" id="info-tab-container">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-[#0e0e10] border-b md:border-b-0 md:border-r border-neutral-800/80 p-4 flex flex-col gap-1 shrink-0">
          <div className="px-3.5 py-2 mb-3">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">이용 편의 지침 및 정책</p>
            <h2 className="text-xs font-extrabold text-neutral-300 mt-0.5">초이스 코리아 법령 및 비전</h2>
          </div>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'about'
                ? 'bg-neutral-800/80 text-white border-l-4 border-red-500 pl-3'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            id="tab-btn-about"
          >
            <Building className={`w-4 h-4 shrink-0 ${activeTab === 'about' ? 'text-red-500' : 'text-neutral-500'}`} />
            <span>회사소개</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'terms'
                ? 'bg-neutral-800/80 text-white border-l-4 border-red-500 pl-3'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            id="tab-btn-terms"
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'terms' ? 'text-red-400' : 'text-neutral-500'}`} />
            <span>이용약관</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-neutral-800/80 text-white border-l-4 border-red-500 pl-3'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            id="tab-btn-privacy"
          >
            <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'privacy' ? 'text-[#38bdf8]' : 'text-neutral-500'}`} />
            <span>개인정보처리방침</span>
          </button>

          <button
            onClick={() => setActiveTab('youth')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'youth'
                ? 'bg-neutral-800/80 text-white border-l-4 border-red-500 pl-3'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            id="tab-btn-youth"
          >
            <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'youth' ? 'text-amber-500' : 'text-neutral-500'}`} />
            <span>청소년보호정책</span>
          </button>

          <button
            onClick={() => setActiveTab('email-blocks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'email-blocks'
                ? 'bg-neutral-800/80 text-white border-l-4 border-red-500 pl-3'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            id="tab-btn-email-blocks"
          >
            <MailWarning className={`w-4 h-4 shrink-0 ${activeTab === 'email-blocks' ? 'text-rose-450' : 'text-neutral-500'}`} />
            <span>이메일 무단수집거부</span>
          </button>
        </div>

        {/* Tab Detail Pane */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[600px] custom-scrollbar bg-neutral-950/40" id="tab-detail-pane">
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-250" id="pane-about">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">About Us</span>
                <h2 className="text-lg md:text-xl font-extrabold text-white mt-2">초이스 코리아 회사소개</h2>
                <p className="text-xs text-neutral-400 mt-1">유저 참여형 종합 라이프-스포츠 통합 예측 플랫폼</p>
              </div>
              
              <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <p className="font-extrabold text-white text-base">
                  종합 라이프-스포츠 통합 예측 플랫폼의 선두주자, 초이스 코리아
                </p>
                <p>
                  <strong>초이스 코리아(CHOICE KOREA)</strong>는 유저 참여형 오피니언 데이터를 바탕으로 더 공정하고 혁신적인 지적 가치 창출을 지향하는 대한민국 최고의 통계 예측 크라우드소싱 전산 기지입니다. 
                </p>
                <p>
                  단순한 스포츠 결과를 넘어 <strong>시사 뉴스, 글로벌 경제 지표, 국내외 대중 연예/방송 트렌드, 최신 기술 및 일상 라이프스타일 전반</strong>에 걸친 모든 테마의 향방을 직접 분석하고 주도적으로 예측에 참여할 수 있는 다이내믹 플랫폼입니다.
                </p>

                <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800/80 space-y-4 shadow-inner mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500 font-bold block">서비스 공식 타이틀</span>
                      <p className="text-sm text-white font-extrabold">초이스 코리아 (CHOICE KOREA)</p>
                      <p className="text-xs text-neutral-400">종합 오피니언 & 예측 트렌드 센터</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-500 font-bold block">서비스 비전 및 핵심 가치</span>
                      <p className="text-sm text-white font-extrabold">집단지성의 정량화</p>
                      <p className="text-xs text-neutral-400">"편향되지 않는 세상 모든 트렌드의 실시간 이정표 제시"</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800/80 pt-4 space-y-1.5 text-xs">
                    <p className="font-bold text-neutral-300">• 주요 제공 서비스:</p>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-400 text-[11px] sm:text-xs">
                      <li>전세계 프로 스포츠 분석, 구글플레이 가이드 정책 준수 일관 데이터 수집</li>
                      <li>국가 주요 정치, 연예 트렌드, 실적 투표 데이터 마운팅 및 크라우드 분석</li>
                      <li>다변화된 일상 주제별 예측 챌린지 및 통계 데이터 인프라</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-250" id="pane-terms">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] bg-red-500/10 text-red-450 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Terms</span>
                <h2 className="text-lg md:text-xl font-extrabold text-white mt-2">초이스 코리아 이용약관</h2>
                <p className="text-xs text-neutral-400 mt-1">최종 개정일자: 2026년 6월 1일</p>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="space-y-1.5">
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-red-500 rounded-sm"></span>
                    제 1 조 (목적 및 효력)
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm pl-2.5">
                    본 약관은 초이스 코리아(이하 "회사")가 운영하는 웹 및 모바일 앱 서비스의 제반 예측 분석 서비스 이용 조건, 권리 및 책임 범위를 명확히 규정함을 목적으로 합니다. 가입과 동시에 본 규정에 동의한 것으로 처리됩니다.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-red-500 rounded-sm"></span>
                    제 2 조 (포인트 제도 및 금지사항)
                  </h3>
                  <div className="text-neutral-400 text-xs sm:text-sm pl-2.5 space-y-1">
                    <p>1. 서비스 내에서 무료 제공되거나 퀘스트 완료로 적립된 <strong>포인트(P)</strong>는 모의 예측 데이터 참여를 위한 범용 수치이며, 어떠한 경우에도 외부 현금 결제나 불법 환전 요소로 변질되어 매매될 수 없습니다.</p>
                    <p>2. 이를 위반하는 행위 검출 시 해당 이용자는 사전 고지 없이 계정 이용 금지(영구 제재)가 즉각 발효됩니다.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-red-500 rounded-sm"></span>
                    제 3 조 (이용자의 권리 및 의무)
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm pl-2.5">
                    이용자는 건전한 오피니언 분석 생태계를 저해하는 불법 해킹 프로그램 사용, 타인의 개인정보 도용, 비하적 발언, 부적절한 게시글 작성을 삼가야 하며, 회사는 관계 법령에 의거하여 부적합 회원의 제재 및 법적 통보 권한을 행사할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-red-500 rounded-sm"></span>
                    제 4 조 (이용제한 및 법적책임)
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm pl-2.5">
                    회사는 서비스의 안정적 운영을 해치는 부정 행위자에 대하여 임시 이용 정지, 영구 정지, 탈퇴 처리 등의 자체 징계 수위를 행사할 수 있으며 부정이용자는 그로 인한 민형사상 법적 책임을 단독 부담합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="animate-in fade-in duration-250" id="pane-privacy">
              <PrivacyPolicyContent />
            </div>
          )}

          {activeTab === 'youth' && (
            <div className="space-y-6 animate-in fade-in duration-250" id="pane-youth">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Youth Protect</span>
                <h2 className="text-lg md:text-xl font-extrabold text-white mt-2">초이스 코리아 청소년보호정책</h2>
                <p className="text-xs text-neutral-400 mt-1">건전하고 무해한 건전 분석 커뮤니티 공간 조성 약속</p>
              </div>

              <div className="space-y-5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <p className="font-extrabold text-amber-400 text-base leading-snug">
                  유해 정보로부터 청소년을 안전하게 보호합니다.
                </p>
                
                <p>
                  <strong>초이스 코리아</strong>는 정보통신윤리위원회 규정 및 대한민국의 청소년보호법에 근거하여, 미래 세대인 청소년들이 건전하고 유익한 상호 정보 의견 교류 환경에서 공정한 지식을 탐색할 수 있도록 특화된 청소년 보호 조치를 엄정하게 수립·실천하고 있습니다.
                </p>

                <div className="bg-neutral-900/60 p-4 border border-neutral-800/80 rounded-xl space-y-4 mt-3">
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-xs sm:text-sm">1. 청소년 유해 정보의 규제 및 자율 차단 전산화</h4>
                    <p className="text-neutral-400 text-[11px] sm:text-xs">
                      선정성, 사행성 유도, 도박, 불법 도메인 광고, 과격한 욕설 글은 실시간 AI 전산 감지 모듈 및 자율 모니터링 시스템을 통해 즉각 검출되어 표시 차단 및 영구 격리 처리가 적용됩니다.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-neutral-800/60 pt-3">
                    <h4 className="font-bold text-white text-xs sm:text-sm">2. 예방 교육 및 고충 상담 상시 접수</h4>
                    <p className="text-neutral-400 text-[11px] sm:text-xs">
                      청소년 일상 지침 권리 보호 및 유해 정보 피해 예방을 위하여 원스톱 카카오톡 상담 채널 및 이메일 전산 지원팀을 구성하여, 유해 게시물 피해 확인 시 즉각 검토 후 조치합니다.
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 space-y-2 text-[11px] sm:text-xs text-neutral-350">
                  <p className="font-bold text-white mb-1">■ 청소년보호 책임관 지정 연락처</p>
                  <p><strong>• 담당 고충처리 부서:</strong> 초이스 코리아 유해 정보 민원 대응반</p>
                  <p><strong>• 대표 접수 이메일:</strong> <a href="mailto:sinpotnf@gmail.com" className="text-blue-400 underline">sinpotnf@gmail.com</a></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email-blocks' && (
            <div className="space-y-6 animate-in fade-in duration-250" id="pane-email-blocks">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Email Rejection</span>
                <h2 className="text-lg md:text-xl font-extrabold text-white mt-2">이메일 무단수집거부 방침</h2>
                <p className="text-xs text-neutral-400 mt-1">개인정보보호 및 영리성 광고 전자우편 송신 금지 공시</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <p className="font-extrabold text-white text-base">
                  이메일 주소 무단 수집의 전면 거부를 명시합니다.
                </p>
                <p>
                  본 웹사이트 및 애플리케이션 플랫폼 상에 게시되거나 기재되어 있는 사용자 이메일, 관리자 연락처 정보를 <strong>이메일 주소 추출 자동 수집기(크롤러, 봇)</strong>나 그 밖의 기술적 가동 전산 장치들을 이용하여 무단 취득하는 정황을 전면 금지합니다.
                </p>
                <p>
                  만일 이를 위반하여 자동 프로그램으로 이메일을 분석해 무차별 영리 광고성 정보를 송신하는 사태가 포착될 경우, 관련 법령에 의하여 사전 경고 없이 즉각 고발 조치될 수 있습니다.
                </p>

                <div className="bg-neutral-900/60 p-4 border border-red-500/10 rounded-xl text-neutral-400 text-[11px] sm:text-xs">
                  <p className="font-bold text-red-400 mb-1">※ 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제50조의 2항 규제 공시</p>
                  <ul className="list-decimal pl-5 space-y-1.5 mt-2">
                    <li>누구든지 인터넷 홈페이지 운영자 또는 관리자의 사전 동의 없이 인터넷 홈페이지에서 자동으로 이메일 주소를 수집하는 기술적 장치 그 밖의 기술적 전산 장치들을 이용하여 이메일 주소를 수집하여서는 아니 된다.</li>
                    <li>누구든지 제1항의 규정을 위반하여 수집된 이메일 주소임을 알면서 이를 판매·유통하여서는 아니 된다.</li>
                    <li>누구든지 제1항 및 제2항의 규정에 의하여 수집·판매 및 유통이 금지된 이메일 주소임을 알면서 이를 영리목적의 정보 전송에 이용하여서는 아니 된다.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

