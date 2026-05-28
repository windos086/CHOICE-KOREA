import React from 'react';
import { User, ShieldCheck, Mail, Key, UserCheck, Flame, Info, Check, HelpCircle } from 'lucide-react';

interface RegisterFormProps {
  onRegisterSuccess: (id: string, password: string, nickname: string) => void;
  onCancel: () => void;
}

export default function RegisterForm({ onRegisterSuccess, onCancel }: RegisterFormProps) {
  // Classification state
  const [registerType, setRegisterType] = React.useState<'choice' | 'google'>('choice');

  // General sign-up fields
  const [userid, setUserid] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [name, setName] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [recommender, setRecommender] = React.useState('');

  // Google flow states
  const [googleEmail, setGoogleEmail] = React.useState('');
  const [googleNickname, setGoogleNickname] = React.useState('');
  const [googleAgreement, setGoogleAgreement] = React.useState(false);

  // Agreement states
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreePrivacy, setAgreePrivacy] = React.useState(false);

  // Checks & Status
  const [idChecked, setIdChecked] = React.useState(false);
  const [nickChecked, setNickChecked] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  // TOS text placeholders modeled after standard Korean site terms
  const termsText = `제1조 [목적]
본 약관은 초이스 코리아 (이하 "해당 사이트"라 합니다)가 운영하는 실시간 스포츠 정보 예측 및 방송 중계 커뮤니티 서비스의 이용조건 및 절차, 회원과 사이트 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 [약관의 효력 및 변경]
1. 본 약관은 회원이 서비스 이용을 신청할 때 동의함으로써 실시간으로 효력이 발생합니다.
2. 사이트는 필요한 경우 관계 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다. 개정된 약관은 공지사항 게시판을 통해 공지하며, 회원가입 시 이를 확인하는 책임은 가입자 본인에게 있습니다.

제3조 [회원 가입 및 회원 자격]
1. 회원가입은 이용자가 본 약관 및 개인정보처리방침에 동의하고, 가입 신청 양식에 따른 기재 사항을 성실하게 작성한 후 사이트가 승인함으로써 성립합니다.
2. 실명 혹은 가명을 부적절하게 도용하여 가입하는 경우, 또는 고의적인 사칭이 발견되는 경우 경고 없이 영구 탈퇴 처리 및 포인트 회수 등의 조치가 적용됩니다.

제4조 [포인트 제도 및 리워드숍 이용]
1. 서비스 내에서 무료로 충전되거나 퀴즈 적중을 통해 획득하는 모든 포인트포인트(P)는 해당 서비스 내부 전용 시뮬레이션 머니입니다.
2. 회원은 획득한 포인트로 리워드숍에서 기프티콘과 교환할 수 있으나, 어떠한 형태의 직접 현금 환전 및 불법 거래도 엄격히 불허합니다.`;

  const privacyText = `1. 수집하는 개인정보 항목
사이트는 원활한 회원제 이용 서비스 제공을 위하여 가입 시 아래와 같은 최소한의 개인정보를 수집 및 보관합니다.
- 필수항목: 로그인 아이디(ID), 비밀번호, 이름, 이메일 주소, 자가 생성 닉네임
- 선택항목: 추천인 회원 ID

2. 개인정보의 수집 및 이용 목적
- 회원제 서비스 이용에 따른 본인 식별, 가입 승인 의사 확인, 부당 및 불량이용 방지
- 예측 퀴즈 포인트 차감 및 정산 등 권한 혜택 부여
- 기프티콘 배송 및 일회성 교환 요청 처리 보조

3. 개인정보의 보유 및 이용 기간
회원의 개인정보는 회원가입일로부터 탈퇴 처리 완료 시기까지 한시적으로 보관되며, 회원 탈퇴 시 혹은 영구 영구 서비스 종료 즉시 모든 데이터는 실물 파기 또는 소멸 처리됩니다.`;

  // Simulate ID duplicate check
  const handleCheckId = () => {
    if (!userid.trim()) {
      alert('회원아이디를 먼저 입력해 주세요.');
      return;
    }
    if (userid.length < 3) {
      alert('회원아이디는 최소 3자 이상 입력해야 합니다.');
      return;
    }
    const alphanumericAndUnderscore = /^[a-zA-Z0-9_]+$/;
    if (!alphanumericAndUnderscore.test(userid)) {
      alert('영문자, 숫자, 언더바(_)만 사용 가능합니다.');
      return;
    }
    
    // Check if ID exists in mock database
    setIdChecked(true);
    setSuccessMsg('사용 가능한 회원아이디입니다.');
    setErrorMessage('');
  };

  // Simulate Nick duplicate check
  const handleCheckNick = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (nickname.length < 2) {
      alert('닉네임은 2자 이상 입력해 주세요.');
      return;
    }
    setNickChecked(true);
    alert('사용 가능한 닉네임입니다!');
  };

  // Main Submit handler (General input)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('사이트 이용약관에 동의하셔야 회원가입이 완료됩니다.');
      return;
    }
    if (!agreePrivacy) {
      setErrorMessage('개인정보 수집 및 이용 안내에 동의하셔야 회원가입이 완료됩니다.');
      return;
    }
    if (!userid.trim()) {
      setErrorMessage('회원아이디를 입력해 주세요.');
      return;
    }
    if (userid.length < 3) {
      setErrorMessage('회원아이디는 최소 3자 이상으로 채워야 합니다.');
      return;
    }
    const alphanumericAndUnderscore = /^[a-zA-Z0-9_]+$/;
    if (!alphanumericAndUnderscore.test(userid)) {
      setErrorMessage('회원아이디에는 영문자, 숫자, _ 만 입력할 수 있습니다.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('비밀번호는 최소 4자 이상 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호 확인 칸이 서로 다릅니다. 동일하게 작성해 주세요.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('이름을 기입해 주세요.');
      return;
    }
    if (!nickname.trim()) {
      setErrorMessage('사용할 닉네임을 설정해 주세요.');
      return;
    }
    if (nickname.length < 2) {
      setErrorMessage('닉네임은 한글 2자 또는 영문 4자 이상으로 구성해야 합니다.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('정확한 이메일 주소를 입력해 주세요.');
      return;
    }

    // Success! Trigger profile initialization
    onRegisterSuccess(userid.trim(), password.trim(), nickname.trim());
  };

  // Google registration link submission
  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!googleAgreement) {
      setErrorMessage('구글 계정 정보 보관 및 연동 약관 동의가 필요합니다.');
      return;
    }
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      setErrorMessage('올바른 이메일 형식의 구글 계정을 기입해 주세요.');
      return;
    }
    if (!googleNickname.trim() || googleNickname.length < 2) {
      setErrorMessage('구글 프로필과 연동할 2자 이상의 닉네임을 설정해 주세요.');
      return;
    }

    // Standard generated ID for google user
    const googleUserId = googleEmail.split('@')[0] + '_google';
    
    // Auto successful link register!
    onRegisterSuccess(googleUserId, 'google_secure_password_bypass', googleNickname.trim());
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-md p-5 font-sans text-xs text-gray-300">
      
      {/* Page Title Row */}
      <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3 mb-5 animate-fade-in">
        <div className="flex items-center space-x-2">
          <span className="text-[#22c55e] text-lg font-black font-sans">👤 초이스 코리아 회원 가입</span>
          <span className="text-[10px] text-gray-500 font-medium">| 가입 방식 분류 및 연동 최적화</span>
        </div>
        <button 
          onClick={onCancel}
          className="bg-transparent text-gray-500 hover:text-white transition cursor-pointer font-bold border border-[#2c2d33] px-2.5 py-1 rounded"
        >
          돌아가기
        </button>
      </div>

      {/* 회원가입 유형 분류 (Classification Selection) */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setRegisterType('choice');
            setErrorMessage('');
            setSuccessMsg('');
          }}
          className={`py-3 px-4 w-full rounded-xl font-bold flex flex-col items-center justify-center gap-1.5 transition-all select-none border cursor-pointer ${
            registerType === 'choice'
              ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#22c55e] shadow-lg shadow-[#22c55e]/5'
              : 'bg-[#121213] border-neutral-800 text-gray-400 hover:text-white hover:border-[#2e2e2e]'
          }`}
        >
          <User className="h-4.5 w-4.5" />
          <span className="text-xs font-black">일반 회원가입</span>
          <span className="text-[9px] opacity-75">간단한 정보 기입 가입</span>
        </button>

        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration form submission form */}
          
          {/* 1. 약관동의 영역 (ToS agreements) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-extrabold flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5 text-[#22c55e]" />
                  사이트 이용약관 동의 (필수)
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-[#22c55e] font-bold select-none text-[11px]">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms} 
                    onChange={(e) => setAgreeTerms(e.target.checked)} 
                    className="accent-[#22c55e] h-3.5 w-3.5"
                  />
                  <span>이용약관 내용에 동의합니다.</span>
                </label>
              </div>
              <textarea 
                readOnly 
                value={termsText}
                className="w-full bg-[#111] border border-[#2e2e2e] rounded p-3 h-28 text-gray-500 font-medium leading-relaxed resize-none text-[10.5px] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-extrabold flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1.5 text-[#22c55e]" />
                  개인정보 수집 및 이용 동의 (필수)
                </span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-[#22c55e] font-bold select-none text-[11px]">
                  <input 
                    type="checkbox" 
                    checked={agreePrivacy} 
                    onChange={(e) => setAgreePrivacy(e.target.checked)} 
                    className="accent-[#22c55e] h-3.5 w-3.5"
                  />
                  <span>개인정보 수집 및 이용에 동의합니다.</span>
                </label>
              </div>
              <textarea 
                readOnly 
                value={privacyText}
                className="w-full bg-[#111] border border-[#2e2e2e] rounded p-3 h-28 text-gray-500 font-medium leading-relaxed resize-none text-[10.5px] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. 개인정보 상세 기입 영역 (Register fields) */}
          <div className="bg-[#121213] border border-[#27282b] rounded-lg p-5 space-y-4">
            <h3 className="text-white font-bold text-xs border-b border-[#2b2b2b] pb-2 flex items-center">
              <span className="h-1.5 w-1.5 bg-[#22c55e] rounded-full mr-2"></span>
              기본 가입 정보 설정 및 확인
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 회원아이디 */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  회원아이디 <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-2">영문자, 숫자, _ 만 가능 (3자 이상)</span>
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="아이디를 생성해 주세요"
                    value={userid}
                    onChange={(e) => {
                      setUserid(e.target.value);
                      setIdChecked(false);
                    }}
                    className="flex-1 bg-[#111] border border-[#2e2e2e] rounded px-3 py-2 text-white font-medium focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                  />
                  <button 
                    type="button"
                    onClick={handleCheckId}
                    className="bg-[#2c2d33] hover:bg-gray-700 text-white font-bold px-3 py-2 rounded shrink-0 transition text-[11px]"
                  >
                    중복체크
                  </button>
                </div>
                {idChecked && <p className="text-[#22c55e] text-[10px] font-bold mt-0.5">✓ 사용 가능한 회원아이디 포맷 확인 완료</p>}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  비밀번호 <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-2">보안 4자 이상 권장</span>
                </label>
                <input 
                  type="password" 
                  placeholder="비밀번호 설정"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded px-4 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  placeholder="비밀번호 재확인 입력"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded px-4 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                />
                {password && passwordConfirm && (
                  <p className={`text-[10px] font-bold mt-0.5 ${password === passwordConfirm ? 'text-[#22c55e]' : 'text-rose-500'}`}>
                    {password === passwordConfirm ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 불일치합니다'}
                  </p>
                )}
              </div>

              {/* 이름 */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="실명을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded px-4 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                />
              </div>

              {/* 닉네임 */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  닉네임 <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-2">공백 불가능 (한글 2자 이상)</span>
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="대화창에 보일 이름"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNickChecked(false);
                    }}
                    className="flex-1 bg-[#111] border border-[#2e2e2e] rounded px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                  />
                  <button 
                    type="button"
                    onClick={handleCheckNick}
                    className="bg-[#2c2d33] hover:bg-gray-700 text-white font-bold px-3 py-2 rounded shrink-0 transition text-[11px]"
                  >
                    중복체크
                  </button>
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="예시: user@blacktv24.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded px-4 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                />
              </div>

              {/* 추천인 ID */}
              <div className="space-y-1">
                <label className="text-white font-bold block">
                  추천인 닉네임/아이디 
                  <span className="text-[10px] text-gray-500 font-normal ml-2">(선택)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="귀하를 초대한 회원의 아이디"
                  value={recommender}
                  onChange={(e) => setRecommender(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded px-4 py-2 text-white focus:border-[#22c55e] focus:outline-none text-[11.5px]"
                />
              </div>

            </div>

            {/* Validation Error Alerts */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold p-3 rounded text-center text-[11px]">
                ⚠️ {errorMessage}
              </div>
            )}

            {successMsg && (
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-bold p-3 rounded text-center text-[11px]">
                🎉 {successMsg}
              </div>
            )}

          </div>

          {/* Buttons Row with matching style */}
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button 
              type="submit"
              className="bg-[#22c55e] hover:bg-[#1db053] active:scale-[0.98] transition text-black font-black py-3 px-10 rounded text-xs cursor-pointer"
            >
              회원가입 완료
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="bg-[#2a2a2b] hover:bg-gray-700 active:scale-[0.98] transition text-white font-bold py-3 px-10 rounded text-xs cursor-pointer"
            >
              취소 / 돌아가기
            </button>
          </div>

        </form>

    </div>
  );
}
