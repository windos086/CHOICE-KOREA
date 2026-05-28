import React from 'react';
import { Send, Users, Trophy, MessageSquare, Bell, Settings, BarChart2, ShieldAlert } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { renderMilitaryBadge } from './MilitaryBadge';

interface LiveChatProps {
  chatMessages: ChatMessage[];
  userProfile: UserProfile | null;
  onSendMessage: (text: string) => void;
  allUsers: UserProfile[];
  onUpdateUserProfile: (uid: string, updatedFields: Partial<UserProfile>) => Promise<void> | void;
  onSendSystemMessage: (text: string, type?: 'chat' | 'system' | 'bot_announcement') => Promise<void> | void;
  activeUserCount?: number;
}

export default function LiveChat({ 
  chatMessages, 
  userProfile, 
  onSendMessage, 
  allUsers,
  onUpdateUserProfile,
  onSendSystemMessage,
  activeUserCount
}: LiveChatProps) {
  const [inputText, setInputText] = React.useState('');
  const [showDomainNotice, setShowDomainNotice] = React.useState(true);
  const [selectedUserForModeration, setSelectedUserForModeration] = React.useState<{ uid: string; nickname: string } | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const sentMessageTimestampsRef = React.useRef<number[]>([]);

  // Auto Scroll to bottom (Temporarily disabled to prevent annoyance)
  React.useEffect(() => {
    // if (chatEndRef.current) {
    //   chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    // }
  }, []);

  const isAdmin = userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자' || userProfile?.nickname === '운영자';

  const formatRemainingMuteTime = (mutedUntilTimestamp: number) => {
    const ms = mutedUntilTimestamp - Date.now();
    if (ms <= 0) return "곧 해제됨";
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `${hours}시간`;
    const days = Math.ceil(hours / 24);
    return `${days}일`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!userProfile) {
      alert("로그인 후 채팅에 참여하실 수 있습니다. 좌측 상단의 로그인 박스에서 회원가입 및 로그인을 진행해주세요!");
      return;
    }

    // Check if user is muted/restricted from chat
    if (userProfile.chatMutedUntil) {
      const mutedUntil = new Date(userProfile.chatMutedUntil).getTime();
      if (mutedUntil > Date.now()) {
        const diffText = formatRemainingMuteTime(mutedUntil);
        alert(`❌ 귀하는 현재 실시간 채팅 금지 상태입니다.\n해제까지 남은 시간: ${diffText}`);
        return;
      }
    }

    // Rate Limiting Filter: Check for spamming (5 messages in 4 seconds)
    const now = Date.now();
    const recent = sentMessageTimestampsRef.current.filter(t => now - t < 4000);
    recent.push(now);
    sentMessageTimestampsRef.current = recent;

    if (recent.length >= 5) {
      const fiveMinsLater = new Date(now + 5 * 60 * 1000).toISOString();
      onUpdateUserProfile(userProfile.uid, { chatMutedUntil: fiveMinsLater });
      onSendSystemMessage(`🚨 시스템 알림: [${userProfile.nickname}] 회원이 과도한 도배 행위로 인해 5분간 채팅 제한 조치 되었습니다.`, 'bot_announcement');
      alert("⚠️ 과도한 도배 행위가 감지되어 5분간 실시간 채팅 이용이 강제 제한됩니다.");
      return;
    }

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getNicknameColor = (nickname: string) => {
    const colors = [
      'text-emerald-400',
      'text-blue-400',
      'text-orange-400',
      'text-purple-400',
      'text-pink-400',
      'text-cyan-400',
    ];
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
      hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getUserAvatar = (userId: string, nickname: string) => {
    let match = allUsers.find(u => u.uid === userId);
    if (!match) {
      match = allUsers.find(u => u.nickname === nickname);
    }
    return match ? match.profileImageUrl : null;
  };

  const getUserBadge = (userId: string, nickname: string) => {
    let match = allUsers.find(u => u.uid === userId);
    if (!match) {
      match = allUsers.find(u => u.nickname === nickname);
    }
    return match ? match.activeBadge : null;
  };

  const handleUserClick = (userId: string, nickname: string) => {
    if (!isAdmin) return; // Only operators can manage chat mutes
    if (nickname === '최고관리자' || nickname === '운영자') return; // Cannot block admins
    setSelectedUserForModeration({ uid: userId, nickname });
  };

  const handleBlockOption = async (days: number) => {
    if (!selectedUserForModeration) return;
    const { uid, nickname } = selectedUserForModeration;
    
    let durationMs = 0;
    let durationText = "";
    if (days === 1) {
      durationMs = 24 * 60 * 60 * 1000;
      durationText = "1일 차단";
    } else if (days === 7) {
      durationMs = 7 * 24 * 60 * 60 * 1000;
      durationText = "1주일 차단";
    } else if (days === 30) {
      durationMs = 30 * 24 * 60 * 60 * 1000;
      durationText = "30일 차단";
    } else if (days === 999) {
      durationMs = 99 * 365 * 24 * 60 * 60 * 1000;
      durationText = "영구 차단";
    } else if (days === 0) {
      durationMs = 0;
      durationText = "해제";
    }

    const mutedUntilTime = durationMs > 0 ? new Date(Date.now() + durationMs).toISOString() : "";

    try {
      await onUpdateUserProfile(uid, { chatMutedUntil: mutedUntilTime });
      
      const alertMessage = durationMs > 0
        ? `🚨 [운영자 조치] '${nickname}' 회원이 [${durationText}] 처리되어 채팅 작성이 제한되었습니다.`
        : `🚨 [운영자 조치] '${nickname}' 회원의 채팅 제한 조치가 해제되었습니다.`;

      await onSendSystemMessage(alertMessage, 'bot_announcement');
      setSelectedUserForModeration(null);
    } catch (err) {
      console.error("Failed to update chat restriction", err);
    }
  };

  const filteredMessages = React.useMemo(() => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    return chatMessages.filter(m => {
      if (m.message.includes('💡 판정 근거 :')) return false;
      if (m.type === 'system' && (m.message.includes('기획 배달') || m.message.includes('AI 기획'))) return false;
      if (new Date(m.createdAt).getTime() < thirtyMinutesAgo) return false;
      return true;
    });
  }, [chatMessages]);

  return (
    <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-md h-[480px] flex flex-col overflow-hidden relative shadow-lg font-sans">
      
      {/* CHAT HEADER */}
      <div className="flex items-center justify-between bg-[#111111] px-4 py-3 border-b border-[#2b2b2b]">
        <div className="flex items-center space-x-2">
          <span className="text-white text-xs font-bold leading-none">초이스 코리아 채팅방</span>
          <span className="flex items-center bg-green-500/10 text-[#22c55e] border border-green-500/30 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold select-none relative" title="실시간 동시 접속자 수">
            <span className="h-1.5 w-1.5 bg-[#22c55e] rounded-full mr-1.5 relative inline-block">
              <span className="absolute inset-0 bg-[#22c55e] rounded-full animate-ping opacity-75"></span>
            </span>
            {activeUserCount ? activeUserCount.toLocaleString() : "1"}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <BarChart2 className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
          <Settings className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      {/* DOMAIN RED ALIGNMENT NOTICE */}
      {showDomainNotice && (
        <div className="bg-[#5c0b11] text-white text-[11px] font-semibold px-4 py-2 flex items-center justify-between border-b border-[#7d141e]/50 relative animate-fade-in select-none">
          <p className="pr-4 leading-normal">
            초이스 코리아 대표 도메인 변경 되었습니다. <span className="underline font-bold text-yellow-300">choicekr.co.kr</span> 꼭! 확인해 주세요!
          </p>
          <button 
            type="button"
            onClick={() => setShowDomainNotice(false)}
            className="text-white hover:text-gray-300 font-bold text-xs cursor-pointer ml-1 block shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* MESSAGE CONTEXT CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#161616]">
        {filteredMessages.map((msg) => {
          if (msg.type === 'bot_announcement' || msg.message.startsWith('🚨') || msg.message.startsWith('📢')) {
            return (
              <div key={msg.id} className="bg-[#241c1c] border border-red-900/40 py-1.5 px-3 rounded text-[11px] text-red-300 font-bold leading-relaxed shadow-sm">
                {msg.message}
              </div>
            );
          }

          const avatar = getUserAvatar(msg.userId, msg.userNickname);
          const isMsgAuthorAdmin = msg.userNickname === '최고관리자' || msg.userNickname === '운영자' || msg.userId === 'admin';

          return (
            <div key={msg.id} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed animate-fade-in py-0.5">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-[#2b2b2b] shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {renderMilitaryBadge(getUserBadge(msg.userId, msg.userNickname), "-mr-1")}
                  <span 
                    onClick={() => handleUserClick(msg.userId, msg.userNickname)}
                    className={`font-semibold cursor-pointer hover:underline ${getNicknameColor(msg.userNickname)} ${isAdmin && !isMsgAuthorAdmin ? 'decoration-red-400 decoration-dotted' : ''}`}
                    title={isAdmin && !isMsgAuthorAdmin ? "클릭 시 실시간 채팅 제재 메뉴가 열립니다." : undefined}
                  >
                    {msg.userNickname}
                  </span>
                  {isMsgAuthorAdmin && (
                    <span className="bg-[#5c0b11] text-red-200 text-[9px] font-black px-1.5 py-0.2 rounded font-sans scale-90 select-none shrink-0 border border-red-900/50">ADMIN</span>
                  )}
                </div>
                <p className="text-gray-300 mt-0.5 break-all whitespace-pre-wrap font-medium">
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* ADMIN MODERATION OVERLAY */}
      {selectedUserForModeration && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-[#1e1e20] border border-[#3a3b42] rounded-xl p-5 w-full max-w-[260px] text-center space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h4 className="text-red-400 font-extrabold text-sm flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>채팅 제한 제재 설정</span>
              </h4>
              <p className="text-white font-black text-sm pt-1 truncate">
                {selectedUserForModeration.nickname}
              </p>
              <p className="text-neutral-400 text-[10px] tracking-tight leading-normal">
                해당 회원의 실시간 채팅 작성 권한을 즉시 제한하거나 복구하실 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleBlockOption(1)}
                className="bg-[#2a2a2d] hover:bg-[#3d3d42] border border-neutral-700 text-white font-extrabold py-1.5 rounded transition-transform active:scale-95 cursor-pointer"
              >
                1일 차단
              </button>
              <button
                type="button"
                onClick={() => handleBlockOption(7)}
                className="bg-[#2a2a2d] hover:bg-[#3d3d42] border border-neutral-700 text-white font-extrabold py-1.5 rounded transition-transform active:scale-95 cursor-pointer"
              >
                1주일 차단
              </button>
              <button
                type="button"
                onClick={() => handleBlockOption(30)}
                className="bg-[#2a2a2d] hover:bg-[#3d3d42] border border-neutral-700 text-white font-extrabold py-1.5 rounded transition-transform active:scale-95 cursor-pointer"
              >
                30일 차단
              </button>
              <button
                type="button"
                onClick={() => handleBlockOption(999)}
                className="bg-red-950/40 hover:bg-red-900/50 border border-red-900 text-red-300 font-extrabold py-1.5 rounded transition-transform active:scale-95 cursor-pointer"
              >
                영구 차단
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-850 flex gap-2">
              <button
                type="button"
                onClick={() => handleBlockOption(0)}
                className="flex-1 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900 text-emerald-400 text-[11px] font-extrabold py-1.5 rounded transition-transform active:scale-95 cursor-pointer"
              >
                제재 해제
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserForModeration(null)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold py-1.5 rounded cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT INPUT CONTAINER */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#2b2b2b] bg-[#111111] flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={userProfile ? "채팅 메시지를 입력하세요..." : "닉네임을 설정한 후에 채팅 가능합니다."}
          disabled={!userProfile}
          className="flex-1 bg-[#1c1c1c] text-xs font-medium text-white rounded px-3 py-2 border border-[#333333] focus:border-[#22c55e] focus:outline-none placeholder-gray-600 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !userProfile}
          className="bg-[#22c55e] hover:bg-[#1db053] disabled:opacity-40 text-black px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          전송
        </button>
      </form>

    </div>
  );
}
