import React from 'react';

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-4xl mx-auto font-sans" id="privacy-policy-content-body">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-lg font-black text-white">초이스 코리아(CHOICE KOREA) 개인정보처리방침</h2>
        <p className="text-[11px] text-neutral-400 mt-1">최종 시행일자: 2026년 6월 1일</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 1 조 (목적)
        </h3>
        <p className="text-neutral-400">
          초이스 코리아(이하 "회사"라 합니다)는 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 대한민국 개인정보 보호법 및 관계 법령에 따라 본 개인정보처리방침을 수립·공개합니다. 본 방침은 회사가 제공하는 웹 및 앱 서비스 서비스 전반에 일관되게 적용됩니다.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 2 조 (수집하는 개인정보의 항목 및 수집 방법)
        </h3>
        <p className="text-neutral-400">
          회사는 회원가입, 효율적 고객 상담, 본인 확인 및 각종 서비스 제공을 위하여 최초 가입 시 아래와 같은 최소한의 필수 개인정보를 수집하고 있습니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-[11px] sm:text-xs text-neutral-350">
          <p><strong>1. 회원가입 및 관리:</strong> 회원 로그인 ID, 비밀번호, 닉네임, 아바타 이미지 정보 및 가입 일시</p>
          <p><strong>2. 소셜 연동 간편 로그인 시:</strong> 간편 로그인 제공사(카카오, 구글 등)로부터 제공받는 고유 식별값(UID), 닉네임, 프로필 이메일 주소</p>
          <p><strong>3. 서비스 이용 과정에서 자동으로 생성되어 수집될 수 있는 항목:</strong> IP 주소, 웹 브라우저 정보, 쿠키, 서비스 이용 기록, 부정 이용 방지 로그</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 3 조 (개인정보의 처리 목표 및 이용 목적)
        </h3>
        <p className="text-neutral-400">
          회사는 수집한 개인정보를 다음의 목적들을 위해서만 제한적으로 활용합니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1.5 text-[11px] sm:text-xs text-neutral-350">
          <p>• 이용자 식별 및 회원가입 의사 확인, 본인 여부 검증</p>
          <p>• 스포츠, 뉴스, 경제, 연예, 디지털, 라이프 등 일상 및 전문 분야 전반의 크라우드소싱 예측 결과 집계, 보유 포인트 부여, 상품권 교환 등의 코어 서비스 운영</p>
          <p>• 부정 사용(다중 계정 생성, 비정상적 포인트 획득, 도배 행위 등) 방지 및 제재</p>
          <p>• 카카오톡 고객센터를 통한 원활한 민원 처리 및 서비스 장애 대응</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 4 조 (개인정보의 보유 및 이용기간)
        </h3>
        <p className="text-neutral-400">
          이용자의 개인정보는 원칙적으로 회원탈퇴 시 지체 없이 파기하며 복구 불가능한 상태로 소멸 처리합니다. 다만, 다음의 사유에 해당하는 경우에는 명시한 기간 동안 보존합니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-[11px] sm:text-xs text-neutral-350">
          <p><strong>1. 부정 재가입 및 어뷰징 방지 목적 (회사 내부 방침):</strong></p>
          <p className="pl-3 text-red-400">
            • 탈퇴 신청한 회원의 식별키 및 로그인 ID 정보는 탈퇴한 시점으로부터 <strong>30일간</strong> 임시 암호화 상태로 격리 보관되며, 해당 기간 동안에는 동일한 정보로의 회원 재가입이 전면 불허됩니다. (구글 플레이 개인정보 및 오용 보호 규칙 준수)
          </p>
          <p><strong>2. 관계 법령에 따른 보존:</strong></p>
          <p className="pl-3">• 통신비밀보호법에 따른 웹서버 접속 로그 기록: 3개월</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 5 조 (개인정보의 파기절차 및 방법)
        </h3>
        <p className="text-neutral-400">
          본 플랫폼은 원활한 데이터 통제를 위해 실시간 즉시 삭제 방식을 채택하고 있습니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1.5 text-[11px] sm:text-xs text-neutral-350">
          <p><strong>1. 파기절차:</strong> 사용자가 탈퇴 처리를 요청하거나 동의한 경우, 해당 수집 범위의 데이터는 회사 클라우드 콘솔(Firestore)에서 즉시 논리적/물리적으로 딜리트(Delete) 쿼리가 수행되어 완전 격리 파기됩니다.</p>
          <p><strong>2. 파기방법:</strong> 전자적 파일 형태로 저장된 데이터는 복구 및 재생할 수 없는 기술적 방법을 사용하여 영구 삭제합니다.</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 6 조 (이용자 및 법정대리인의 권리와 그 행사방법)
        </h3>
        <p className="text-neutral-400">
          이용자는 언제든지 회사에 자신 또는 만 14세 미만 아동의 개인정보에 대해 다음 각 호의 권리를 행사할 수 있습니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1 text-[11px] sm:text-xs text-neutral-350">
          <p>1. 개인정보 열람 및 정정 요구</p>
          <p>2. 삭제 요구 (회원탈퇴 제반 프로세스 실행)</p>
          <p>3. 처리정지 요구</p>
          <p className="pt-2 text-neutral-400 leading-relaxed">
            ※ 원격 데이터 삭제 절차는 앱 로그인 후 <strong>[내 프로필 &gt; 내 정보 &gt; 회원탈퇴 실행]</strong>을 통해 사용자가 직접 즉시 행정 처리할 수 있으며, 비로그인 상태이거나 웹 외부 경로는 별도 마련된 <a href="/delete-account" className="text-red-400 underline font-semibold hover:text-red-300">"온라인 계정 삭제 전산 신청 페이지"(/delete-account)</a>를 통해 자율적으로 처리 신청할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-red-500 rounded-sm inline-block"></span>
          제 7 조 (개인정보 보호책임자 및 고충 처리 연락처)
        </h3>
        <p className="text-neutral-400">
          이용자의 개인정보를 보호하고 관련 불만을 해결하기 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 text-[11px] sm:text-xs text-neutral-350 leading-relaxed">
          <p><strong>• 개인정보 보호 서비스 관리팀</strong></p>
          <p>• 이메일 문의처: <a href="mailto:sinpotnf@gmail.com" className="text-blue-400 underline hover:text-blue-300">sinpotnf@gmail.com</a></p>
          <p>• 소셜 연동 상담: 카카오톡 채널 '초이스 코리아 고객센터'를 통해 일대일 온라인 전산 접수가 가능합니다.</p>
        </div>
      </section>

      <div className="text-center pt-4 text-neutral-500 text-[10px]">
        본 개정 개인정보처리방침은 2026년 6월 1일부터 효력을 발생합니다.
      </div>
    </div>
  );
}
