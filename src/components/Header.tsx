import React from 'react';
import { 
  Scale, 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  Sparkles, 
  Newspaper, 
  Play, 
  MessageSquare,
  Settings,
  Headphones,
  ChevronDown,
  Flame,
  ShieldCheck,
  Hourglass,
  Landmark,
  KeyRound,
  Coins,
  Activity,
  List,
  Clipboard,
  HelpCircle,
  FileText,
  Bell,
  User,
  Moon,
  Sun,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { UserProfile, DynamicMenuItem } from '../types';
import { ChoiceKoreaHeaderLogo } from './ChoiceKoreaLogo';
import { renderMilitaryBadge } from './MilitaryBadge';

const IconMap: Record<string, any> = {
  Scale,
  Trophy,
  Gamepad2,
  TrendingUp,
  Sparkles,
  Newspaper,
  Play,
  MessageSquare,
  Headphones,
  Flame,
  ShieldCheck,
  Hourglass,
  Landmark,
  KeyRound,
  Coins,
  Activity,
  List,
  Clipboard,
  HelpCircle,
  FileText,
  Bell,
  Moon,
  Sun,
  CheckCircle
};

interface HeaderProps {
  userProfile: UserProfile | null;
  onSetNickname: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  dynamicMenus: DynamicMenuItem[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export default function Header({ 
  userProfile, 
  onSetNickname, 
  currentTab, 
  setCurrentTab,
  selectedCategory,
  setSelectedCategory,
  dynamicMenus,
  theme,
  onToggleTheme,
  onLogout,
  onOpenLoginModal
}: HeaderProps) {
  // Track currently hovered/clicked dropdown menu id
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const timeoutRef = React.useRef<any>(null);

  // Notification lists backed with interactive actions
  const [notifications, setNotifications] = React.useState([
    { id: 4, title: '🎉 일일 보장 보급 완료', text: '회원 연동 감사 일일 출석 1,000 P가 보너스로 자동 승인 처리되었습니다.', time: '어제', unread: false }
  ]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMouseEnter = (menuId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(menuId);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 280); // Provide 280ms buffer window so transition feels extremely solid and natural
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDynamicClick = (tab: string, category?: string) => {
    setCurrentTab(tab);
    if (tab === 'predict') {
      setSelectedCategory(category || 'all');
      setTimeout(() => {
        const target = document.getElementById('active-betting-lists');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  return (
    <header className={`${theme === 'light' ? 'bg-white border-b border-gray-200 text-neutral-800' : 'bg-[#111111] border-b border-[#222222] text-gray-300'} sticky top-0 z-40 select-none font-sans shadow-md transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO AREA */}
        <div 
          className="cursor-pointer group animate-fadeIn ml-0 lg:-ml-2 shrink-0"
          onClick={() => {
            setCurrentTab('predict');
            setSelectedCategory('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <ChoiceKoreaHeaderLogo />
        </div>

        {/* HEADER MENU NAVIGATION - AUTO DROP DOWN WITH EXACT CHEVRON TRIGGER ACTION */}
        <nav className="hidden lg:flex items-center space-x-1.5 text-[13px] font-bold">
          {dynamicMenus.map((item) => {
            const hasSubmenus = item.submenus && item.submenus.length > 0;
            const isOpen = activeDropdown === item.id;
            const isActive = item.tab === 'predict' 
              ? (currentTab === 'predict' && selectedCategory === (item.category || 'all'))
              : (currentTab === item.tab);
            
            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  if (hasSubmenus) handleMouseEnter(item.id);
                }}
                onMouseLeave={() => {
                  if (hasSubmenus) handleMouseLeave();
                }}
                className="relative flex items-center bg-transparent rounded-md transition-all"
              >
                {/* Main Menu Label / Action Button */}
                <button
                  onClick={() => handleDynamicClick(item.tab, item.category)}
                  className={`flex items-center space-x-1 py-1.5 px-2.5 transition-all text-left ${
                    hasSubmenus ? 'rounded-l-md pr-1.5' : 'rounded-md'
                  } ${
                    isActive 
                      ? theme === 'light'
                        ? 'text-black bg-gray-100 border-b-2 border-[#d11822]'
                        : 'text-white bg-neutral-900 border-b-2 border-[#d11822]'
                      : theme === 'light'
                        ? 'text-neutral-700 hover:text-black hover:bg-gray-100'
                        : 'text-gray-300 hover:text-white hover:bg-neutral-900'
                  } ${item.id === 'suggestion' ? 'relative overflow-hidden' : ''}`}
                >
                  {item.id === 'suggestion' && (
                    <div className="absolute inset-0 bg-white/10 animate-shimmer -skew-x-12 pointer-events-none rounded-md"></div>
                  )}
                  <span className="whitespace-nowrap z-10">{item.label}</span>
                </button>

                {/* Small indicator button trigger - styled exactly like the provided screenshot 'v' */}
                {hasSubmenus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(isOpen ? null : item.id);
                    }}
                    className={`py-[8.5px] px-1 rounded-r-md transition-all relative ${
                      isOpen 
                        ? theme === 'light'
                          ? 'text-black bg-gray-100'
                          : 'text-white bg-neutral-900'
                        : theme === 'light'
                          ? 'text-neutral-400 hover:text-black hover:bg-gray-100'
                          : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                    }`}
                    aria-label={`${item.label} 하위메뉴 열기`}
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : 'text-neutral-500'}`} />
                  </button>
                )}

                {/* SUBMENU PANEL: Exposes sub-items perfectly when hovered/clicked. DISMISSES on mouse leave! */}
                {isOpen && item.submenus && item.submenus.length > 0 && (
                  <div 
                    className={`absolute top-full left-0 mt-1 min-w-[150px] rounded-lg shadow-2xl py-1 z-50 animate-fadeIn border ${
                      theme === 'light'
                        ? 'bg-white border-gray-200 text-neutral-800'
                        : 'bg-[#141414] border-neutral-800 text-gray-200'
                    }`}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className={`absolute -top-1 left-4 w-2 h-2 rotate-45 border-t border-l ${
                      theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#141414] border-neutral-800'
                    }`}></div>
                    {item.submenus.map((sub, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          handleDynamicClick(sub.tab, sub.category);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-[11.5px] font-black border-l-2 border-l-transparent hover:border-l-[#d11822] transition-all whitespace-nowrap block ${
                          theme === 'light'
                            ? 'text-neutral-600 hover:text-black hover:bg-gray-50'
                            : 'text-neutral-400 hover:text-white hover:bg-[#d11822]/10'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* USER PROFILE & INTEGRATED TOOLBAR AREA (Dark/Light mode, Notification, Profile, Config) */}
        <div className="flex items-center space-x-3 text-xs">
          
          {/* CUSTOM THEME CONTROLLER - Bell, Moon / Sun aligned perfectly */}
          <div className="flex items-center space-x-2 border-r border-[#2d2d2d]/20 pr-1 mr-1">
            
            {/* 1. Theme Switch Button */}
            {/* Theme switch button removed as requested */}

            {/* 2. Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-all duration-300 relative focus:outline-none ${
                  theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-neutral-800'
                    : 'bg-[#1b1b1b] hover:bg-[#252525] text-gray-200'
                } ${showNotifications ? 'ring-2 ring-[#d11822]/60' : ''}`}
                title="알림 확인"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#d11822] text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse border border-[#111]">
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Added User Profile info button */}
              <button
                onClick={() => {
                  if (userProfile) {
                    setShowProfileMenu(!showProfileMenu);
                  } else {
                    onOpenLoginModal();
                  }
                }}
                className={`p-2 rounded-full transition-all duration-300 relative focus:outline-none ${
                    theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200 text-neutral-800'
                      : 'bg-[#1b1b1b] hover:bg-[#252525] text-gray-200'
                  } ${showProfileMenu ? 'ring-2 ring-[#d11822]/60' : ''}`}
                title={userProfile ? "내 정보" : "로그인"}
              >
                <User className="h-4.5 w-4.5" />
              </button>

              {/* User Profile Menu Panel */}
              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden animate-fadeIn ${
                  theme === 'light'
                    ? 'bg-white border-gray-200 text-neutral-800'
                    : 'bg-[#141414] border-neutral-800 text-gray-200'
                }`}>
                  <div className="p-4 border-b border-neutral-800">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center shrink-0 font-black">
                        {userProfile?.profileImageUrl ? (
                          <img
                            src={userProfile.profileImageUrl}
                            alt="profile"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-white">{userProfile?.nickname?.substring(0, 1) || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-white flex items-center">
                          {renderMilitaryBadge(userProfile?.activeBadge)}
                          <span>{userProfile?.nickname || '사용자'}</span>
                        </div>
                        <div className="text-xs text-neutral-400">{userProfile?.loginId || 'guest@example.com'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <button 
                      onClick={() => {
                        onLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Overlay Panel */}
              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden animate-fadeIn ${
                  theme === 'light'
                    ? 'bg-white border-gray-200 text-neutral-800'
                    : 'bg-[#141414] border-neutral-800 text-gray-200'
                }`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${
                    theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-neutral-900/80 border-neutral-800'
                  }`}>
                    <span className="font-extrabold text-[12px]">알림 센터 ({unreadCount}건)</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, unread: false })));
                        }}
                        className="text-[10px] text-[#d11822] hover:underline font-bold"
                      >
                        모두 읽음
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/10 dark:divide-neutral-850/30">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                          }}
                          className={`p-3.5 transition-all text-left text-xs cursor-pointer relative hover:bg-neutral-500/5 ${
                            notif.unread 
                              ? theme === 'light' ? 'bg-indigo-50/30' : 'bg-neutral-900/60' 
                              : ''
                          }`}
                        >
                          {notif.unread && (
                            <span className="absolute top-4 left-2.5 w-1.5 h-1.5 rounded-full bg-[#d11822]" />
                          )}
                          <div className="pl-2">
                            <div className="flex items-center justify-between">
                              <span className={`font-black text-[11.5px] ${theme === 'light' ? 'text-neutral-800' : 'text-gray-100'}`}>{notif.title}</span>
                              <span className="text-[9.5px] text-neutral-500 font-medium">{notif.time}</span>
                            </div>
                            <p className={`text-[11px] mt-1 leading-relaxed ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-405'}`}>{notif.text}</p>
                            <div className="flex justify-end mt-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotifications(notifications.filter(n => n.id !== notif.id));
                                }}
                                className="text-[9.5px] text-neutral-500 hover:text-[#d11822] font-semibold transition-all"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-[11px] text-neutral-500">
                        신규 알림 내역이 비어 있습니다.
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className={`p-2 border-t text-center ${
                      theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-neutral-900/80 border-neutral-800'
                    }`}>
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10.5px] font-bold text-neutral-500 hover:text-[#d11822] transition-colors"
                      >
                        알림 전체 지우기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {userProfile && (
            <div className={`hidden sm:flex items-center space-x-2 border px-3.5 py-1.5 rounded transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-200 text-neutral-700'
                : 'bg-[#1b1b1b] border-[#2e2e2e] text-gray-205'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse shrink-0"></span>
              <span className="font-bold cursor-pointer hover:underline flex items-center" onClick={onSetNickname}>
                {renderMilitaryBadge(userProfile.activeBadge)}
                <span>{userProfile.nickname}</span>
              </span>
            </div>
          )}

          {userProfile && (
            (() => {
              const profile = userProfile;
              const loginLower = (profile.loginId || '').toLowerCase().trim();
              const nickLower = (profile.nickname || '').toLowerCase().trim();
              const isAdmin = loginLower === 'sinpotnf@gmail.com' || nickLower === 'sinpotnf@gmail.com' || loginLower === 'admin' || nickLower === 'admin';
              
              if (!isAdmin) return null;

              return (
                <button 
                  onClick={() => {
                    setCurrentTab('ai-manager');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#d11822] hover:bg-[#b0141c] text-white font-black px-4 py-2.5 rounded transition-all shadow flex items-center space-x-2 shrink-0 group border border-transparent hover:border-red-500/30"
                >
                  <Settings className="h-4 w-4 animate-spin-slow group-hover:rotate-45 transition-transform duration-500" />
                  <span>관리자메뉴</span>
                </button>
              );
            })()
          )}

          {/* MOBILE BURGER BUTTON */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg transition-all duration-300 focus:outline-none lg:hidden flex items-center justify-center shrink-0 ${
              theme === 'light'
                ? 'bg-gray-100 hover:bg-gray-200 text-neutral-800'
                : 'bg-[#1b1b1b] hover:bg-[#252525] text-gray-200'
            }`}
            title="모바일 메뉴"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-red-500" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE DROP-DOWN DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden border-t shadow-xl overflow-y-auto max-h-[85vh] animate-slide-down ${
          theme === 'light'
            ? 'bg-white border-gray-200 text-neutral-800'
            : 'bg-[#141414] border-neutral-800 text-gray-205'
        }`}>
          <div className="p-4">
            {(() => {
              // Reorder dynamicMenus to place 'community' (커뮤니티) at the very top for mobile
              const mobileMenus = [...dynamicMenus];
              const communityIdx = mobileMenus.findIndex(m => m.id === 'community');
              if (communityIdx > -1) {
                const [communityItem] = mobileMenus.splice(communityIdx, 1);
                mobileMenus.unshift(communityItem);
              }

              // Detect which compiled item has submenus and is active
              const activeItemWithSubmenus = mobileMenus.find(item => {
                const hasSubmenus = item.submenus && item.submenus.length > 0;
                if (!hasSubmenus) return false;
                return item.tab === currentTab || item.submenus?.some(sub => sub.tab === currentTab);
              });

              return (
                <div className="space-y-4">
                  {/* Grid layout of 3 items per row */}
                  <div className="grid grid-cols-3 gap-2">
                    {mobileMenus.map((item) => {
                      const hasSubmenus = item.submenus && item.submenus.length > 0;
                      // Determine active state for parent button
                      const isActive = item.tab === 'predict' 
                        ? (currentTab === 'predict' && selectedCategory === (item.category || 'all'))
                        : (currentTab === item.tab || (hasSubmenus && item.submenus?.some(sub => sub.tab === currentTab)));

                      const IconComponent = IconMap[item.iconName || 'List'] || List;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleDynamicClick(item.tab, item.category);
                            if (!hasSubmenus) {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`relative flex flex-col items-center justify-center py-3.5 px-1.5 rounded-xl border text-center transition-all ${
                            isActive
                              ? theme === 'light'
                                ? 'bg-red-50/70 border-red-500/30 text-[#d11822] shadow-sm font-black scale-[0.98]'
                                : 'bg-[#d11822]/15 border-[#d11822]/40 text-red-400 font-black shadow-sm scale-[0.98]'
                              : theme === 'light'
                                ? 'bg-gray-50/80 border-gray-200/50 hover:bg-gray-100 text-neutral-700 font-bold'
                                : 'bg-[#1b1b1b] border-neutral-800/80 hover:bg-neutral-900 text-gray-300 font-bold'
                          }`}
                        >
                          {/* Premium Icon Badge style */}
                          <div className={`p-2 rounded-xl mb-1.5 flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? theme === 'light' ? 'bg-red-100/80 text-[#d11822]' : 'bg-[#d11822]/25 text-red-400'
                              : theme === 'light' ? 'bg-gray-100 text-neutral-500' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            <IconComponent className="h-4.5 w-4.5" />
                          </div>

                          {/* Label Text */}
                          <p className="text-[11px] tracking-tighter truncate max-w-full font-extrabold">
                            {item.label}
                          </p>

                          {/* Submenu Indicator Dot */}
                          {hasSubmenus && (
                            <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-[#d11822] dark:bg-red-400' : 'bg-neutral-450 dark:bg-neutral-600'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Neatly structured detailed Submenus Container underneath if any */}
                  {activeItemWithSubmenus && activeItemWithSubmenus.submenus && (
                    <div className={`p-3 rounded-2xl border ${
                      theme === 'light'
                        ? 'bg-gray-50/60 border-gray-200/50'
                        : 'bg-[#1a1a1a]/40 border-neutral-800/60'
                    }`}>
                      <div className="flex items-center space-x-1.5 mb-2.5 px-1">
                        <div className="w-1 h-3.5 bg-[#d11822] rounded-full" />
                        <span className="text-[11.5px] font-black tracking-tight opacity-80">
                          {activeItemWithSubmenus.label} 상세 메뉴
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {activeItemWithSubmenus.submenus.map((sub, sIdx) => {
                          const isSubActive = sub.tab === 'predict'
                            ? (currentTab === 'predict' && selectedCategory === (sub.category || 'all'))
                            : (currentTab === sub.tab);

                          return (
                            <button
                              key={sIdx}
                              onClick={() => {
                                handleDynamicClick(sub.tab, sub.category);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`text-left px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all border ${
                                isSubActive
                                  ? theme === 'light'
                                    ? 'bg-red-50/80 border-[#d11822]/30 text-[#d11822] font-black'
                                    : 'bg-[#d11822]/10 border-[#d11822]/40 text-red-400 font-black'
                                  : theme === 'light' 
                                    ? 'bg-gray-50/40 border-gray-200/50 text-neutral-600 hover:bg-gray-100 hover:text-black' 
                                    : 'bg-[#1b1b1b] border-neutral-800 text-neutral-400 hover:bg-[#d11822]/15 hover:text-white'
                              }`}
                            >
                              <span className="mr-1 opacity-40">•</span>{sub.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quick Link to Admin Panel for Admin if logged in */}
            {userProfile && (() => {
              const profile = userProfile;
              const loginLower = (profile.loginId || '').toLowerCase().trim();
              const nickLower = (profile.nickname || '').toLowerCase().trim();
              const isAdmin = loginLower === 'sinpotnf@gmail.com' || nickLower === 'sinpotnf@gmail.com' || loginLower === 'admin' || nickLower === 'admin';
              
              if (!isAdmin) return null;

              return (
                <button
                  onClick={() => {
                    setCurrentTab('ai-manager');
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-[#d11822] hover:bg-[#b0141c] text-white font-black py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 mt-4"
                >
                  <Settings className="h-4 w-4 animate-spin-slow" />
                  <span>관리자메뉴 바로가기</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </header>
  );
}
