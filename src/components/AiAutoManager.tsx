import React from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Settings, 
  Layers, 
  Check, 
  X,
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
  Users,
  Search,
  Lock,
  Unlock,
  Ban,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import AdminPredictionsTab from './AdminPredictionsTab';
import { DynamicMenuItem, DynamicSubmenu, getApiUrl } from '../types';
import { DEFAULT_DYNAMIC_MENUS } from '../constants';

// Match Header icon maps for rendering preview badges in Admin
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
  FileText
};

interface AiAutoManagerProps {
  predictionCards: any[];
  onAddPrediction: any;
  onResolvePrediction: any;
  dynamicMenus: DynamicMenuItem[];
  onUpdateMenus: (menus: DynamicMenuItem[]) => void;
  globalSubcategories?: Record<string, { label: string; count?: string; key: string, children?: any[] }[]>;
  setGlobalSubcategories?: React.Dispatch<React.SetStateAction<Record<string, { label: string; count?: string; key: string, children?: any[] }[]>>>;
  allUsers?: any[];
  onUpdateUser?: (uid: string, fields: any) => Promise<void>;
  onDeleteUser?: (uid: string) => Promise<void>;
  firebaseAvailable?: boolean;
  db?: any;
  subcategoryLogos?: Record<string, string>;
  setCurrentTab?: (tab: string) => void;
}

export default function AiAutoManager({ 
  predictionCards, 
  onAddPrediction, 
  onResolvePrediction, 
  dynamicMenus, 
  onUpdateMenus,
  globalSubcategories = {},
  setGlobalSubcategories,
  allUsers = [],
  onUpdateUser,
  onDeleteUser,
  firebaseAvailable = false,
  db,
  subcategoryLogos = {},
  setCurrentTab
}: AiAutoManagerProps) {
  React.useEffect(() => {
      console.log("AiAutoManager: allUsers prop updated, count:", allUsers.length);
  }, [allUsers]);
  
  // Selected main menu to manage submenus
  const [selectedMenuId, setSelectedMenuId] = React.useState<string | null>(() => {
    return dynamicMenus.length > 0 ? dynamicMenus[0].id : null;
  });

  // Admin Module Tab Selection ('menus' | 'members' | 'predictions' | 'logos' | 'resolve')
  const [adminTab, setAdminTab] = React.useState<'menus' | 'members' | 'predictions' | 'logos' | 'resolve'>('menus');

  // Member Management States
  const [memberSearchQuery, setMemberSearchQuery] = React.useState<string>('');
  const [memberStatusFilter, setMemberStatusFilter] = React.useState<'all' | 'normal' | 'banned'>('all');
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);

  // Individual Member Edit States
  const [editingPointsDelta, setEditingPointsDelta] = React.useState<string>('');
  const [editingPointsDeltaType, setEditingPointsDeltaType] = React.useState<'add' | 'subtract'>('add');
  const [editingPassword, setEditingPassword] = React.useState<string>('');
  const [editingBanReason, setEditingBanReason] = React.useState<string>('운영 방침 불응 및 부적절한 행위');

  // Action flow states (replaces standard alert/confirm blocked inside sandboxed iframe previews)
  const [pendingDeleteMenuId, setPendingDeleteMenuId] = React.useState<string | null>(null);
  const [pendingDeleteSubIndex, setPendingDeleteSubIndex] = React.useState<number | null>(null);
  const [pendingRestore, setPendingRestore] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Helper for displaying transient error banners
  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // Main Menu Form States
  const [isEditingMenu, setIsEditingMenu] = React.useState<boolean>(false);
  const [editMenuId, setEditMenuId] = React.useState<string | null>(null);
  
  const [menuLabel, setMenuLabel] = React.useState<string>('');
  const [menuIcon, setMenuIcon] = React.useState<string>('Scale');
  const [menuTab, setMenuTab] = React.useState<string>('predict');
  const [menuCategory, setMenuCategory] = React.useState<string>('');
  const [menuColorClass, setMenuColorClass] = React.useState<string>('text-gray-300');

  // Submenu Form States
  const [isEditingSub, setIsEditingSub] = React.useState<boolean>(false);
  const [editSubIndex, setEditSubIndex] = React.useState<number | null>(null);
  
  const [subLabel, setSubLabel] = React.useState<string>('');
  const [subTab, setSubTab] = React.useState<string>('predict');
  const [subCategory, setSubCategory] = React.useState<string>('');

  // Logo registered state variables
  const [logoSubCategory, setLogoSubCategory] = React.useState<string>('');
  const [logoInputType, setLogoInputType] = React.useState<'file' | 'url'>('file');
  const [logoFileBase64, setLogoFileBase64] = React.useState<string>('');
  const [logoUrlInput, setLogoUrlInput] = React.useState<string>('');

  // Result determination state variables
  const [resolveSearch, setResolveSearch] = React.useState('');
  const [resolveCategory, setResolveCategory] = React.useState('all');
  const [resolveSubTab, setResolveSubTab] = React.useState<'pending' | 'resolved'>('pending');
  const [selectedPredToResolve, setSelectedPredToResolve] = React.useState<any | null>(null);
  const [resolveWinningOption, setResolveWinningOption] = React.useState('');
  const [resolveEvidence, setResolveEvidence] = React.useState('공식 협회 데이터 및 경기 결과 기준 판정 완료.');
  const [isConfirmingResolve, setIsConfirmingResolve] = React.useState<boolean>(false);
  const [isBatchResolving, setIsBatchResolving] = React.useState<boolean>(false);

  const formatCompactDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[date.getDay()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}. ${month}. ${day}. (${weekday}) ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Memoized subcategories and action handlers
  const allSubcategories = React.useMemo(() => {
    // Collect active category keys from dynamicMenus
    const activeCategories = new Set(
      dynamicMenus
        .map(m => m.category || m.id)
        .filter(Boolean)
    );

    const list: { key: string; label: string; parent: string }[] = [];
    Object.entries(globalSubcategories || {}).forEach(([parentKey, items]) => {
      // Only show subcategories of categories that are active in the registered menu
      if (!activeCategories.has(parentKey)) {
        return;
      }
      if (Array.isArray(items)) {
        items.forEach(item => {
          list.push({ key: item.key, label: item.label, parent: parentKey });
          if (item.children && Array.isArray(item.children)) {
            item.children.forEach((child: any) => {
              list.push({ key: child.key, label: `${item.label} > ${child.label}`, parent: parentKey });
            });
          }
        });
      }
    });
    return list;
  }, [globalSubcategories, dynamicMenus]);

  const handleLogoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSub = logoSubCategory.trim();
    if (!finalSub) {
      alert("⚠️ 로고를 지정할 카테고리/리그의 키 값을 선택하거나 정밀 기입해 주세요!");
      return;
    }

    const finalUrl = logoInputType === 'file' ? logoFileBase64 : logoUrlInput.trim();
    if (!finalUrl) {
      alert("⚠️ 로고로 등록할 이미지 파일 이미지 업로드 혹은 URL 링크를 기입해 주세요!");
      return;
    }

    try {
      if (firebaseAvailable && db) {
        await setDoc(doc(db, "subcategory_logos", finalSub), {
          subCategory: finalSub,
          imageUrl: finalUrl,
          createdAt: new Date().toISOString()
        });
        alert(`🎉 [${finalSub}] 카테고리/리그의 로고 연동용 데이터가 Firestore에 영구 고착 처리되었습니다.`);
      } else {
        const localLogos = JSON.parse(localStorage.getItem('CHOICE_KOREA_SUBCATEGORY_LOGOS') || '{}');
        localLogos[finalSub] = finalUrl;
        localStorage.setItem('CHOICE_KOREA_SUBCATEGORY_LOGOS', JSON.stringify(localLogos));
        alert(`🎉 [${finalSub}] 카테고리/리그의 로고 연동용 데이터가 로컬 스토리지에 백업 완료되었습니다.`);
        window.location.reload();
      }
      setLogoFileBase64('');
      setLogoUrlInput('');
    } catch (err: any) {
      console.error("Error saving logo:", err);
      showError(`로고 이미지 등록 실패: ${err.message}`);
    }
  };

  const handleLogoDelete = async (sub: string) => {
    console.log("handleLogoDelete called with sub:", sub);
    if (!sub) {
      console.log("handleLogoDelete: sub is empty, returning.");
      return;
    }

    try {
      console.log("Attempting to delete logo for:", sub);
      if (firebaseAvailable && db) {
        await deleteDoc(doc(db, "subcategory_logos", sub));
        console.log("Delete successful");
        alert(`🗑️ [${sub}] 카테고리의 로고 삭제가 완료되었습니다.`);
        window.location.reload();
      } else {
        console.log("Using localStorage fallback");
        const localLogos = JSON.parse(localStorage.getItem('CHOICE_KOREA_SUBCATEGORY_LOGOS') || '{}');
        delete localLogos[sub];
        localStorage.setItem('CHOICE_KOREA_SUBCATEGORY_LOGOS', JSON.stringify(localLogos));
        alert(`🗑️ [${sub}] 카테고리의 로고 삭제가 로컬에서 완료되었습니다.`);
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Error deleting logo:", err);
      showError(`로고 삭제 중 치명적 오류: ${err.message}`);
    }
  };

  // 1. Reset forms
  const resetMenuForm = () => {
    setIsEditingMenu(false);
    setEditMenuId(null);
    setMenuLabel('');
    setMenuIcon('Scale');
    setMenuTab('predict');
    setMenuCategory('');
    setMenuColorClass('text-gray-300');
  };

  const resetSubForm = () => {
    setIsEditingSub(false);
    setEditSubIndex(null);
    setSubLabel('');
    setSubTab('predict');
    setSubCategory('');
  };

  // 2. Main menu triggers
  const triggerAddMenu = () => {
    resetMenuForm();
    setIsEditingMenu(true);
  };

  const triggerEditMenu = (menu: DynamicMenuItem) => {
    setIsEditingMenu(true);
    setEditMenuId(menu.id);
    setMenuLabel(menu.label);
    setMenuIcon(menu.iconName);
    setMenuTab(menu.tab);
    setMenuCategory(menu.category || '');
    setMenuColorClass(menu.className || 'text-gray-300');
  };

  // 3. Submenu triggers
  const triggerAddSub = () => {
    resetSubForm();
    setIsEditingSub(true);
  };

  const triggerEditSub = (sub: DynamicSubmenu, index: number) => {
    setIsEditingSub(true);
    setEditSubIndex(index);
    setSubLabel(sub.label);
    setSubTab(sub.tab);
    setSubCategory(sub.category || '');
  };

  // 4. Save Main Menu
  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuLabel.trim()) {
      showError('메뉴 이름을 입력해 주세요.');
      return;
    }

    if (editMenuId) {
      // Modify existing menu item
      const updated = dynamicMenus.map(menu => {
        if (menu.id === editMenuId) {
          return {
            ...menu,
            label: menuLabel.trim(),
            iconName: menuIcon,
            tab: menuTab,
            category: menuTab === 'predict' ? (menuCategory.trim() || 'all') : undefined,
            className: menuColorClass
          };
        }
        return menu;
      });
      onUpdateMenus(updated);
    } else {
      // Add new menu item
      const newId = 'menu_' + Math.random().toString(36).substring(2, 9);
      const newMenuItem: DynamicMenuItem = {
        id: newId,
        label: menuLabel.trim(),
        iconName: menuIcon,
        tab: menuTab,
        category: menuTab === 'predict' ? (menuCategory.trim() || undefined) : undefined,
        className: menuColorClass,
        submenus: []
      };
      onUpdateMenus([...dynamicMenus, newMenuItem]);
      setSelectedMenuId(newId);
    }
    resetMenuForm();
  };

  // 5. Delete Main Menu
  const handleDeleteMenu = (menuId: string, force: boolean = false) => {
    if (!force) {
      setPendingDeleteMenuId(menuId);
      // Auto dismiss after 6 seconds if not confirmed
      setTimeout(() => {
        setPendingDeleteMenuId(prev => prev === menuId ? null : prev);
      }, 6000);
      return;
    }
    
    const filtered = dynamicMenus.filter(m => m.id !== menuId);
    onUpdateMenus(filtered);
    if (selectedMenuId === menuId) {
      setSelectedMenuId(filtered.length > 0 ? filtered[0].id : null);
    }
    setPendingDeleteMenuId(null);
  };

  // 6. Save Submenu
  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId) {
      showError('먼저 관리 및 배치할 상단 부모 메뉴를 선택해 주세요.');
      return;
    }
    if (!subLabel.trim()) {
      showError('서브메뉴 이름을 입력해 주세요.');
      return;
    }

    const newSub: DynamicSubmenu = {
      label: subLabel.trim(),
      tab: subTab,
      category: subTab === 'predict' ? (subCategory.trim() || undefined) : undefined
    };

    const updated = dynamicMenus.map(menu => {
      if (menu.id === selectedMenuId) {
        let subs = [...(menu.submenus || [])];
        if (editSubIndex !== null) {
          subs[editSubIndex] = newSub;
        } else {
          subs.push(newSub);
        }
        return { ...menu, submenus: subs };
      }
      return menu;
    });

    onUpdateMenus(updated);
    resetSubForm();
  };

  // 7. Delete Submenu
  const handleDeleteSub = (index: number, force: boolean = false) => {
    if (!force) {
      setPendingDeleteSubIndex(index);
      setTimeout(() => {
        setPendingDeleteSubIndex(prev => prev === index ? null : prev);
      }, 6000);
      return;
    }

    const updated = dynamicMenus.map(menu => {
      if (menu.id === selectedMenuId) {
        const subs = (menu.submenus || []).filter((_, i) => i !== index);
        return { ...menu, submenus: subs };
      }
      return menu;
    });
    onUpdateMenus(updated);
    setPendingDeleteSubIndex(null);
  };

  // 8. Reorder main menus (Up / Down)
  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dynamicMenus.length) return;

    const copy = [...dynamicMenus];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onUpdateMenus(copy);
  };

  // 9. Reorder submenus (Up / Down)
  const moveSubmenu = (index: number, direction: 'up' | 'down') => {
    if (!selectedMenuId) return;
    const menu = dynamicMenus.find(m => m.id === selectedMenuId);
    if (!menu || !menu.submenus) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menu.submenus.length) return;

    const copySubs = [...menu.submenus];
    const [moved] = copySubs.splice(index, 1);
    copySubs.splice(targetIndex, 0, moved);

    const updated = dynamicMenus.map(m => {
      if (m.id === selectedMenuId) {
        return { ...m, submenus: copySubs };
      }
      return m;
    });
    onUpdateMenus(updated);
  };

  // 10. Restore defaults
  const handleRestoreDefaults = (force: boolean = false) => {
    if (!force) {
      setPendingRestore(true);
      return;
    }
    onUpdateMenus(DEFAULT_DYNAMIC_MENUS);
    setSelectedMenuId(DEFAULT_DYNAMIC_MENUS[0].id);
    resetMenuForm();
    resetSubForm();
    setPendingRestore(false);
  };

  const activeMenu = dynamicMenus.find(m => m.id === selectedMenuId);

  // Dynamic filter lists for users
  const filteredUsers = allUsers.filter(user => {
    const sQuery = memberSearchQuery.trim().toLowerCase();
    
    // 1. Search filter matches (loginId, nickname, uid)
    const matchesSearch = !sQuery || 
      (user.loginId && user.loginId.toLowerCase().includes(sQuery)) ||
      (user.nickname && user.nickname.toLowerCase().includes(sQuery)) ||
      (user.uid && user.uid.toLowerCase().includes(sQuery));
    
    // 2. Status filters
    if (memberStatusFilter === 'normal') {
      return matchesSearch && !user.isBanned;
    }
    if (memberStatusFilter === 'banned') {
      return matchesSearch && user.isBanned;
    }
    return matchesSearch;
  });

  const selectedMember = allUsers.find(u => u.uid === selectedMemberId);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 0. Admin Category Switcher Tab-bar */}
      <div className="bg-[#121620] border border-gray-800 p-1.5 rounded-xl flex flex-col sm:flex-row items-center gap-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => setAdminTab('menus')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-xs font-black transition-all cursor-pointer ${
            adminTab === 'menus'
              ? 'bg-gradient-to-r from-red-650 to-red-750 text-white shadow-md border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>상단 네비게이션 메뉴 관리 시스템</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAdminTab('members');
            if (!selectedMemberId && allUsers.length > 0) {
              setSelectedMemberId(allUsers[0].uid);
              setEditingPassword(allUsers[0].password || '');
              setEditingBanReason(allUsers[0].banReason || '운영 방침 불응 및 부적절한 행위');
              setEditingPointsDelta('');
            }
          }}
          className={`w-full sm:flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-xs font-black transition-all cursor-pointer ${
            adminTab === 'members'
              ? 'bg-gradient-to-r from-[#22c55e]/80 to-[#1b9e4b]/80 text-white shadow-md border-b-2 border-[#22c55e]'
              : 'text-gray-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>통합 회원 정보 및 계정 권한 통제</span>
          <span className="bg-[#1b1c24] text-[10px] text-[#22c55e] border border-neutral-800 px-1.5 py-0.5 rounded-full font-bold ml-1.5 shadow-inner">
            {allUsers?.length || 0}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('predictions')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-xs font-black transition-all cursor-pointer ${
            adminTab === 'predictions'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
          <span>예측 마켓 시스템 관리</span>
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('resolve')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-xs font-black transition-all cursor-pointer ${
            adminTab === 'resolve'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border-b-2 border-emerald-505'
              : 'text-gray-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>게임 결과 확정</span>
          <span className="bg-[#1b1c24] text-[10px] text-emerald-400 border border-neutral-800 px-1.5 py-0.5 rounded-full font-bold ml-1.5 shadow-inner">
            {predictionCards.filter(p => p.status !== 'resolved').length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('logos')}
          className={`w-full sm:flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-xs font-black transition-all cursor-pointer ${
            adminTab === 'logos'
              ? 'bg-gradient-to-r from-amber-500 to-amber-650 text-white shadow-md border-b-2 border-amber-500'
              : 'text-gray-400 hover:text-white hover:bg-neutral-850'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>리그/카테고리 로고 관리</span>
        </button>
      </div>

      {/* Dynamic Transient Error Notification Banner */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center justify-between shadow-lg animate-pulse">
          <span className="font-extrabold flex items-center gap-1.5">
            <X className="h-4 w-4 text-red-550" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage(null)} className="text-gray-500 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {adminTab === 'menus' ? (
        <>
          {/* 1. Header Information Panel */}
      <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-red-600/10 text-red-500 rounded-lg border border-red-500/20">
            <Settings className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">상단 네비게이션 메뉴 관리 전산망</h3>
            <p className="text-gray-400 text-xs mt-0.5">상단 메뉴바와 마우스 오버 시 출력되는 서브메뉴 리스트를 실시간으로 조율하고 구조를 편집합니다.</p>
          </div>
        </div>

        {pendingRestore ? (
          <div className="bg-red-950/40 border border-red-900/40 p-2.5 rounded-lg flex items-center space-x-3">
            <span className="text-xs text-red-400 font-extrabold whitespace-nowrap">정말 전산망을 전면 초기화할까요?</span>
            <button
              onClick={() => handleRestoreDefaults(true)}
              className="bg-red-650 hover:bg-red-700 text-white text-[11px] font-black px-2.5 py-1.5 rounded transition-all"
            >
              예, 초기화
            </button>
            <button
              onClick={() => setPendingRestore(false)}
              className="bg-neutral-800 hover:bg-neutral-750 text-gray-300 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleRestoreDefaults(false)}
            className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-gray-300 hover:text-white px-3.5 py-2 rounded-lg text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>공장초기 상태 복구</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================
            LEFT AREA: MAIN MENUS MANAGEMENT (col-span-7)
           ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5">
            
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h4 className="text-white font-bold text-sm flex items-center">
                <Layers className="h-4 w-4 mr-2 text-rose-500" />
                상단 메뉴 관리 목록 ({dynamicMenus.length}개 배치됨)
              </h4>
              {!isEditingMenu && (
                <button
                  onClick={triggerAddMenu}
                  className="bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white pb-1.5 pt-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>새 상단 메뉴 추가</span>
                </button>
              )}
            </div>

            {/* Editing / Adding Form container */}
            {isEditingMenu && (
              <form onSubmit={handleSaveMenu} className="bg-[#0f131a] border border-rose-500/30 rounded-xl p-4 mb-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-rose-400 text-xs font-extrabold flex items-center gap-1">
                    <Edit3 className="h-3.5 w-3.5" />
                    {editMenuId ? '메뉴 세부 설정 수정' : '신규 상단 메뉴 생성 양식'}
                  </span>
                  <button type="button" onClick={resetMenuForm} className="text-gray-500 hover:text-gray-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">메뉴명 (Label)</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 자유게시판, 스포츠뉴스"
                      value={menuLabel}
                      onChange={(e) => setMenuLabel(e.target.value)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">아이콘 선택 (Lucide Icon)</label>
                    <select
                      value={menuIcon}
                      onChange={(e) => setMenuIcon(e.target.value)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-rose-500 font-bold"
                    >
                      {Object.keys(IconMap).map((key) => (
                        <option key={key} value={key}>
                          {key === 'Scale' ? 'Scale (정치/법칭)' : 
                           key === 'Trophy' ? 'Trophy (스포츠/대회)' : 
                           key === 'Gamepad2' ? 'Gamepad2 (E스포츠/게임)' : 
                           key === 'TrendingUp' ? 'TrendingUp (경제/등락)' : 
                           key === 'Sparkles' ? 'Sparkles (연예/스타)' : 
                           key === 'Newspaper' ? 'Newspaper (속보/뉴스)' : 
                           key === 'Play' ? 'Play (방송/비디오)' : 
                           key === 'MessageSquare' ? 'MessageSquare (소통/글)' : 
                           key === 'Headphones' ? 'Headphones (고객지원)' : 
                           key === 'Flame' ? 'Flame (인기/핫이슈)' : 
                           key === 'ShieldCheck' ? 'ShieldCheck (보증안전)' : 
                           key === 'Hourglass' ? 'Hourglass (시간제한)' : 
                           key === 'Landmark' ? 'Landmark (정산/금전)' : 
                           key === 'Coins' ? 'Coins (포인트교환)' : 
                           key === 'Activity' ? 'Activity (라이브차트)' : 
                           key === 'Clipboard' ? 'Clipboard (기안지)' : 
                           key === 'HelpCircle' ? 'HelpCircle (자주묻는FAQ)' : 
                           key === 'FileText' ? 'FileText (약관)' : key}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">클릭 시 이동할 본문 탭 (Tab Target)</label>
                    <select
                      value={menuTab}
                      onChange={(e) => setMenuTab(e.target.value as any)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="predict">예측 마켓 보드 (predict)</option>
                      <option value="community">자유 소망게시판 (community)</option>
                      <option value="customer-center">고객센터 전산망 (customer-center)</option>
                      <option value="dashboard">마이 배팅 장부 (dashboard)</option>
                      <option value="shop">기프티콘 교환숍 (shop)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      예측 분류 필터 (Category - 'predict'인 경우만 활성)
                    </label>
                    <input
                      type="text"
                      disabled={menuTab !== 'predict'}
                      placeholder="예: sports, esports, politics, news, entertainment"
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className="w-full bg-[#161b26] disabled:opacity-40 border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-400 font-bold mb-1">아이콘 색상 클래스 (Color Class)</label>
                    <select
                      value={menuColorClass}
                      onChange={(e) => setMenuColorClass(e.target.value)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="text-blue-500">파랑색 (text-blue-500)</option>
                      <option value="text-amber-500">주황색 (text-amber-500)</option>
                      <option value="text-purple-500">보라색 (text-purple-500)</option>
                      <option value="text-emerald-500">녹색 (text-emerald-500)</option>
                      <option value="text-pink-500">분홍색 (text-pink-500)</option>
                      <option value="text-cyan-500">청록색 (text-cyan-500)</option>
                      <option value="text-red-500">빨간색 (text-red-500)</option>
                      <option value="text-green-500">초록색 (text-green-500)</option>
                      <option value="text-[#d11822]">로고강렬레드 (text-[#d11822])</option>
                      <option value="text-gray-300">기본 연그레이 (text-gray-300)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={resetMenuForm}
                    className="bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white px-4 py-2 rounded text-xs font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded text-xs font-bold"
                  >
                    {editMenuId ? '변경 완료' : '메뉴 추가 등록'}
                  </button>
                </div>
              </form>
            )}

            {/* Menu List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {dynamicMenus.map((item, index) => {
                const IconComponent = IconMap[item.iconName] || Scale;
                const isSelected = item.id === selectedMenuId;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMenuId(item.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181d2a] border-rose-500/40 shadow-md shadow-rose-500/5' 
                        : 'bg-[#0f121a] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`p-2 bg-[#1b2230] rounded-lg border border-gray-800 shrink-0`}>
                        <IconComponent className={`h-4.5 w-4.5 ${item.className || 'text-gray-300'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-white font-bold text-xs">{item.label}</span>
                          <span className="text-gray-500 font-mono text-[9px] shrink-0">[{item.id}]</span>
                        </div>
                        <p className="text-gray-400 text-[10px] truncate mt-0.5 font-semibold">
                          이동: <strong className="text-rose-400">{item.tab}</strong>
                          {item.category && <span> &bull; 필터: <strong className="text-blue-400">{item.category}</strong></span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Submenu count badge */}
                      <span className="bg-neutral-800 text-[10px] text-gray-400 font-semibold px-2 py-0.5 rounded-full border border-gray-700 whitespace-nowrap">
                        서브 {item.submenus ? item.submenus.length : 0}개
                      </span>

                      {/* Direction controls */}
                      <div className="flex items-center bg-neutral-900 border border-gray-800 rounded">
                        <button
                          disabled={index === 0}
                          onClick={() => moveMenu(index, 'up')}
                          className="p-1 hover:bg-neutral-800 text-gray-500 hover:text-white disabled:opacity-30"
                          title="위로 이동"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          disabled={index === dynamicMenus.length - 1}
                          onClick={() => moveMenu(index, 'down')}
                          className="p-1 hover:bg-neutral-800 text-gray-500 hover:text-white disabled:opacity-30"
                          title="아래로 이동"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Edit control */}
                      <button
                        onClick={() => triggerEditMenu(item)}
                        className="p-1.5 bg-neutral-900 border border-gray-800 text-gray-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                        title="수정"
                      >
                        <Edit3 className="h-3 w-3.5" />
                      </button>

                      {/* Delete control */}
                      {pendingDeleteMenuId === item.id ? (
                        <div className="flex items-center space-x-1 bg-red-950/50 border border-red-900/40 p-1 rounded animate-pulse select-none" onClick={e => e.stopPropagation()}>
                          <span className="text-[10px] text-red-400 font-extrabold px-1 whitespace-nowrap">삭제할까요?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMenu(item.id, true);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-black transition-all"
                          >
                            확인
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDeleteMenuId(null);
                            }}
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-750 text-gray-300 rounded text-[10px] font-medium"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMenu(item.id, false);
                          }}
                          className="p-1.5 bg-red-950/20 border border-red-900/30 text-red-500 hover:text-white hover:bg-red-600 rounded transition-all"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {dynamicMenus.length === 0 && (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs">
                  현재 등록된 상단 메뉴가 존재하지 않습니다. 우측 최상단 새 상단 메뉴 추가 단추를 이용하여 새 메뉴를 구축하세요.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================
            RIGHT AREA: SUBMENUS OF SELECTED MENU (col-span-5)
           ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5">
            
            <div className="mb-4 border-b border-gray-800 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 font-mono block">
                Submenus Center
              </span>
              <div className="flex items-center justify-between mt-1">
                <h4 className="text-white font-bold text-sm truncate max-w-[200px]">
                  {activeMenu ? `'${activeMenu.label}'의 서브메뉴 관리` : '상단 메뉴를 선택주장'}
                </h4>
                {activeMenu && !isEditingSub && (
                  <button
                    onClick={triggerAddSub}
                    className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white pb-1.5 pt-1 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>서브 추가</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submenu form */}
            {activeMenu && isEditingSub && (
              <form onSubmit={handleSaveSub} className="bg-[#0f131a] border border-blue-500/30 rounded-xl p-4 mb-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-blue-400 text-xs font-extrabold">
                    {editSubIndex !== null ? '서브메뉴 수정 양식' : '새 서브메뉴 기재 양식'}
                  </span>
                  <button type="button" onClick={resetSubForm} className="text-gray-500 hover:text-gray-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">서브메뉴명</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 프리미어리그, 1:1 맞춤상담"
                      value={subLabel}
                      onChange={(e) => setSubLabel(e.target.value)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">클릭 이동 탭 (Tab Target)</label>
                    <select
                      value={subTab}
                      onChange={(e) => setSubTab(e.target.value as any)}
                      className="w-full bg-[#161b26] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="predict">예측 마켓 보드 (predict)</option>
                      <option value="community">자유 소망게시판 (community)</option>
                      <option value="customer-center">고객센터 전산망 (customer-center)</option>
                      <option value="dashboard">마이 배팅 장부 (dashboard)</option>
                      <option value="shop">기프티콘 교환숍 (shop)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      분류 필터 (Category - 'predict'인 경우만 활성)
                    </label>
                    <input
                      type="text"
                      disabled={subTab !== 'predict'}
                      placeholder="예: sports, esports, politics, news, entertainment"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full bg-[#161b26] disabled:opacity-40 border border-[#2b2b2b] text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={resetSubForm}
                    className="bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white px-4 py-2 rounded text-xs font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold"
                  >
                    {editSubIndex !== null ? '수정 적용' : '즉시 서브 추가'}
                  </button>
                </div>
              </form>
            )}

            {/* Submenu lists */}
            {activeMenu ? (
              <div className="space-y-2">
                {activeMenu.submenus && activeMenu.submenus.length > 0 ? (
                  activeMenu.submenus.map((sub, sIdx) => {
                    return (
                      <div 
                        key={sIdx}
                        className="bg-[#0f121a] border border-gray-810 hover:border-gray-800 p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-extrabold truncate">{sub.label}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">
                            목적: <strong className="text-rose-400">{sub.tab}</strong>
                            {sub.category && <span> &bull; 필터: <strong className="text-blue-400">{sub.category}</strong></span>}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {/* Sub Direction controls */}
                          <div className="flex items-center bg-neutral-900 border border-gray-850 rounded">
                            <button
                              disabled={sIdx === 0}
                              onClick={() => moveSubmenu(sIdx, 'up')}
                              className="p-0.5 hover:bg-neutral-850 text-gray-500 hover:text-white disabled:opacity-20"
                            >
                              <ArrowUp className="h-2.5 w-2.5" />
                            </button>
                            <button
                              disabled={sIdx === activeMenu.submenus.length - 1}
                              onClick={() => moveSubmenu(sIdx, 'down')}
                              className="p-0.5 hover:bg-neutral-850 text-gray-500 hover:text-white disabled:opacity-20"
                            >
                              <ArrowDown className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => triggerEditSub(sub, sIdx)}
                            className="p-1 bg-[#1a1c24] border border-gray-800 text-gray-400 hover:text-white rounded"
                            title="수정"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>

                          {pendingDeleteSubIndex === sIdx ? (
                            <div className="flex items-center space-x-1 bg-red-950/50 border border-red-900/40 p-0.5 rounded animate-pulse select-none">
                              <span className="text-[10px] text-red-400 font-extrabold px-1 whitespace-nowrap">삭제?</span>
                              <button
                                onClick={() => handleDeleteSub(sIdx, true)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-black"
                              >
                                예
                              </button>
                              <button
                                onClick={() => setPendingDeleteSubIndex(null)}
                                className="px-1.5 py-0.5 bg-[#1b2230] hover:bg-[#252f44] text-gray-400 rounded text-[10px]"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteSub(sIdx, false)}
                              className="p-1 bg-red-950/10 border border-red-950 text-red-500 hover:text-white hover:bg-red-650 rounded"
                              title="삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs">
                    이 메뉴에 종속된 서브메뉴(하위메뉴)가 없습니다. 서브 추가 단추를 이용하여 서브 리스트를 작성해 보세요!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-gray-850 rounded-xl text-gray-600 text-xs">
                왼쪽 상단 메뉴 중 하나를 클릭하시면 여기에 서브메뉴들이 정렬 수배됩니다.
              </div>
            )}

          </div>

          {/* Guidelines info */}
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-gray-400">
            <HelpCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">안내 및 사용 규칙</p>
              <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                <li>상단 메뉴와 하위 서브메뉴는 실시간으로 연동되어 사이트 전체 네비게이션을 즉시 교체합니다.</li>
                <li><strong>예측 마켓 보드(predict)</strong>로 설정된 탭은 필터 카테고리(정치, 경제 등)를 기입하여 클릭 시 특정 종목만을 분리하여 보이게 제어할 수 있습니다.</li>
                <li>언제든지 <span className="text-rose-400 font-bold">오른쪽 위 초기화 단추</span>를 누르시면 처음 출고 당시의 순정 메뉴 세트로 마술처럼 귀환됩니다.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
        </>
      ) : adminTab === 'members' ? (
        /* Member Management View Content */
        <div className="space-y-6 animate-fade-in text-gray-200">
          
          {/* Member Search & Filters bar */}
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="검색할 회원 아이디, 닉네임, UID 기입..."
                className="w-full bg-[#181d2a] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-[#22c55e]/40 focus:outline-none"
              />
              {memberSearchQuery && (
                <button
                  onClick={() => setMemberSearchQuery('')}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-white text-xs font-bold"
                >
                  지우기
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] text-gray-505 font-bold">회원 필터:</span>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('all')}
                className={`px-3 py-1.5 rounded text-[11px] font-black tracking-wider transition cursor-pointer ${
                  memberStatusFilter === 'all'
                    ? 'bg-neutral-800 text-white border border-neutral-750'
                    : 'text-gray-400 hover:text-white hover:bg-neutral-850'
                }`}
              >
                전체 회원
              </button>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('normal')}
                className={`px-3 py-1.5 rounded text-[11px] font-black tracking-wider transition cursor-pointer ${
                  memberStatusFilter === 'normal'
                    ? 'bg-[#22c55e]/15 text-[#22c55e]'
                    : 'text-gray-400 hover:text-white hover:bg-[#22c55e]/5'
                }`}
              >
                정상 이용자
              </button>
              <button
                type="button"
                onClick={() => setMemberStatusFilter('banned')}
                className={`px-3 py-1.5 rounded text-[11px] font-black tracking-wider transition cursor-pointer ${
                  memberStatusFilter === 'banned'
                    ? 'bg-red-950/40 text-[#f43f5e] border border-red-900/40'
                    : 'text-gray-400 hover:text-white hover:bg-red-950/10'
                }`}
              >
                제재된 회원 (활동정지)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Box: Users list table */}
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-805 pb-3">
                <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-ping" />
                  가입 회원 실시간 대장부 ({filteredUsers.length}명 검색됨)
                </span>
                <span className="text-[10px] text-gray-550 mr-1 font-mono">Real-time sync</span>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-505 font-bold uppercase text-[10px] tracking-wide">
                        <th className="pb-3 pl-2">UID / 가입일</th>
                        <th className="pb-3">회원 아이디</th>
                        <th className="pb-3">활동 닉네임</th>
                        <th className="pb-3 text-right">보유 포인트</th>
                        <th className="pb-3 text-center">전적 (참가/적중)</th>
                        <th className="pb-3 text-center">제재</th>
                        <th className="pb-3 pr-2 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {filteredUsers.map((user) => {
                        const isBanned = user.isBanned === true;
                        const isSelected = selectedMemberId === user.uid;
                        
                        return (
                          <tr
                            key={user.uid}
                            onClick={() => {
                              setSelectedMemberId(user.uid);
                              setEditingPassword(user.password || '');
                              setEditingBanReason(user.banReason || '운영 방침 불응 및 부적절한 행위');
                              setEditingPointsDelta('');
                            }}
                            className={`hover:bg-[#181d2a]/50 transition-all cursor-pointer ${
                              isSelected ? 'bg-neutral-800/35 text-white font-extrabold' : ''
                            }`}
                          >
                            <td className="py-3 pl-2">
                              <div className="font-mono text-[9px] text-gray-500 leading-none">{user.uid}</div>
                              <div className="text-[10px] text-gray-450 mt-1">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 font-mono text-[10px] px-2 py-0.5 rounded text-gray-300 select-all">
                                {user.loginId || '가명계정'}
                              </span>
                            </td>
                            <td className="py-3 font-bold">
                              <span className="flex items-center space-x-1 font-bold">
                                <span className={`h-1.5 w-1.5 rounded-full ${isBanned ? 'bg-rose-500 animate-pulse' : 'bg-[#22c55e]'}`} />
                                <span className="truncate max-w-[120px]" title={user.nickname}>
                                  {user.nickname}
                                </span>
                              </span>
                            </td>
                            <td className="py-3 text-right font-black text-[#22c55e] text-sm">
                              {user.points?.toLocaleString()} <span className="text-[10px] text-gray-450 font-normal">P</span>
                            </td>
                            <td className="py-3 text-center text-gray-450 font-semibold text-[11px]">
                              {user.predictsCount || 0}회 / {user.successCount || 0}적중
                            </td>
                            <td className="py-3 text-center">
                              {isBanned ? (
                                <span className="bg-rose-500/15 border border-rose-550/30 text-rose-450 px-2 py-0.5 rounded text-[9.5px] font-black whitespace-nowrap">
                                  활동 정지
                                </span>
                              ) : (
                                <span className="bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] px-2 py-0.5 rounded text-[9.5px] font-black whitespace-nowrap">
                                  정상
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isSelected ? 'bg-[#22c55e] text-black' : 'bg-neutral-850 text-gray-400'}`}>
                                {isSelected ? '관리중' : '선택'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gray-805 rounded-xl text-gray-500">
                  <Users className="h-8 w-8 text-gray-650 mx-auto mb-2.5 animate-bounce" />
                  <p className="text-xs">조건에 해당되는 가입 회원 레코드가 매칭되지 않았습니다.</p>
                </div>
              )}
            </div>

            {/* Box: Member Detail & Power Admin Editor Panel */}
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 space-y-5 shadow-xl">
              <div className="border-b border-gray-805 pb-3 flex items-center justify-between">
                <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-[#22c55e]" />
                  회원 정보 감시 및 원격 관리 조치
                </span>
                <span className="bg-red-950/20 border border-red-500/30 text-rose-400 text-[10px] uppercase font-black px-1.5 py-0.5 rounded">
                  Control Deck
                </span>
              </div>

              {selectedMember ? (
                <div className="space-y-5">
                  
                  {/* Selected User Summary Card */}
                  <div className="bg-[#181d2a] border border-gray-800 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-1">
                      <div>
                        <span className="text-[10px] text-gray-500 font-mono">UID: {selectedMember.uid}</span>
                        <div className="text-white text-base font-black tracking-wide mt-0.5">
                          {selectedMember.nickname} <span className="text-gray-405 text-xs font-normal">({selectedMember.loginId || '임시'})</span>
                        </div>
                      </div>
                      <div>
                        {selectedMember.isBanned ? (
                          <div className="bg-red-950 border border-red-505/30 px-3 py-1 rounded-full text-[10px] text-red-400 font-extrabold flex items-center space-x-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            <span>접속 차단됨</span>
                          </div>
                        ) : (
                          <div className="bg-[#22c55e]/15 border border-[#22c55e]/30 px-3 py-1 rounded-full text-[10px] text-[#22c55e] font-extrabold flex items-center space-x-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                            <span>상태 정상</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#10131d] border border-gray-850 p-2.5 rounded-lg text-center">
                        <div className="text-gray-500 text-[11px] font-bold">계정 자산</div>
                        <div className="text-[#22c55e] text-sm font-black mt-1">
                          {selectedMember.points?.toLocaleString()} P
                        </div>
                      </div>
                      <div className="bg-[#10131d] border border-gray-855 p-2.5 rounded-lg text-center">
                        <div className="text-gray-550 text-[11px] font-bold">배팅 및 적중 전적</div>
                        <div className="text-white text-sm font-black mt-1">
                          {selectedMember.predictsCount || 0}참 참여 ({selectedMember.successCount || 0}적)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-850">
                      <span>가입일자 {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleString() : '-'}</span>
                      <span>기프트콘 배송 {selectedMember.exchangeCount || 0}회</span>
                    </div>
                  </div>

                  {/* Operational 1: Reset Password or Customize */}
                  <div className="bg-[#10131d] border border-gray-850 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-extrabold text-xs flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-amber-500" />
                        계정 비밀번호 변경 및 강제 초기화
                      </h4>
                      <span className="text-[9.5px] text-amber-500 font-bold bg-amber-500/10 px-1.5 rounded border border-amber-500/20">보안 재정비</span>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editingPassword}
                        onChange={(e) => setEditingPassword(e.target.value)}
                        placeholder="새 비밀번호 직접 입력"
                        className="flex-1 bg-[#181d2a] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingPassword.trim()) {
                            alert('임의의 새 비밀번호를 먼저 텍스트창에 기입해 주세요!');
                            return;
                          }
                          if (onUpdateUser) {
                            await onUpdateUser(selectedMember.uid, { password: editingPassword.trim() });
                            alert(`🔑 ${selectedMember.nickname} 회원의 비밀번호를 [${editingPassword.trim()}]으로 무사히 원격 조정하였습니다.`);
                          }
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3.5 py-1.5 rounded text-xs transition cursor-pointer"
                      >
                        지정 초기화
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onUpdateUser) {
                            await onUpdateUser(selectedMember.uid, { password: '1234' });
                            setEditingPassword('1234');
                            alert(`🔑 ${selectedMember.nickname} 회원의 비밀번호를 기본 임시번호 '1234'로 신속히 복귀 완료하였습니다.`);
                          }
                        }}
                        className="w-full bg-[#1e2330] hover:bg-neutral-800 text-gray-300 font-semibold border border-gray-805 py-2 rounded text-[10.5px] transition cursor-pointer"
                      >
                        순정 공장 기본 비밀번호("1234")로 긴급 복원
                      </button>
                    </div>
                  </div>

                  {/* Operational 2: Update Point Level manually */}
                  <div className="bg-[#10131d] border border-gray-850 p-4 rounded-xl space-y-3">
                    <h4 className="text-white font-extrabold text-xs flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-emerald-500" />
                      자산 포인트 강제 수동 가감 (이벤트 지급/오정산)
                    </h4>

                    <div className="flex items-center space-x-2.5 bg-[#181d2a] p-1 border border-gray-850 rounded">
                      <button
                        type="button"
                        onClick={() => setEditingPointsDeltaType('add')}
                        className={`flex-1 py-1 text-[11px] font-black rounded transition select-none cursor-pointer ${
                          editingPointsDeltaType === 'add'
                            ? 'bg-[#22c55e]/15 text-[#22c55e]'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        포인트 지급 (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPointsDeltaType('subtract')}
                        className={`flex-1 py-1 text-[11px] font-black rounded transition select-none cursor-pointer ${
                          editingPointsDeltaType === 'subtract'
                            ? 'bg-rose-500/15 text-rose-450'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        포인트 회수 (-)
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={editingPointsDelta}
                        onChange={(e) => setEditingPointsDelta(e.target.value)}
                        placeholder="가감 포인트를 입력하세요 (예: 1000)"
                        className="flex-1 bg-[#181d2a] border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const deltaNum = parseInt(editingPointsDelta);
                          if (isNaN(deltaNum) || deltaNum <= 0) {
                            alert('0보다 큰 포인트 보정 정수를 기입해 주세요!');
                            return;
                          }
                          
                          const divisor = editingPointsDeltaType === 'add' ? 1 : -1;
                          const finalDiff = deltaNum * divisor;
                          const newPointsValue = Math.max(0, (selectedMember.points || 0) + finalDiff);

                          if (onUpdateUser) {
                            await onUpdateUser(selectedMember.uid, { points: newPointsValue });
                            setEditingPointsDelta('');
                            alert(`💰 ${selectedMember.nickname} 회원의 보유 자산을 조정 완료하였습니다.\n(보정액: ${finalDiff.toLocaleString()} P → 현재액: ${newPointsValue.toLocaleString()} P)`);
                          }
                        }}
                        className="bg-[#22c55e] hover:bg-[#1db053] text-black font-extrabold px-4 py-1.5 rounded text-xs transition shrink-0 cursor-pointer"
                      >
                        포인트 가감적용
                      </button>
                    </div>
                  </div>

                  {/* Operational 3: Imposing Sanctions / Banner reason */}
                  <div className="bg-[#10131d] border border-gray-855 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-extrabold text-xs flex items-center gap-1.5">
                        <Ban className="h-4 w-4 text-rose-500" />
                        계정 이용제재 부과 및 불법 계정 차단부
                      </h4>
                      <span className="text-[10px] text-rose-500 font-bold bg-rose-950/10 border border-rose-500/20 px-1.5 rounded select-none">계정 동결</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-1">제재 적용 근거 및 상세 사유</label>
                        <textarea
                          rows={2}
                          value={editingBanReason}
                          onChange={(e) => setEditingBanReason(e.target.value)}
                          placeholder="활동 규제 사유를 기입하세요. (예: 다중 기기 포인트 어뷰징 적발)"
                          className="w-full bg-[#181d2a] border border-gray-800 rounded p-2 text-xs text-white placeholder-gray-500 focus:outline-none resize-none leading-normal font-sans"
                        />
                      </div>

                      <div className="flex space-x-2.5">
                        {selectedMember.isBanned ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (onUpdateUser) {
                                  await onUpdateUser(selectedMember.uid, { isBanned: false, banReason: '' });
                                  alert(`🔓 해제성공! ${selectedMember.nickname} 회원의 모든 행정 정지 제한을 성실하게 해방(정상화) 처리하였습니다.`);
                              }
                            }}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-2.5 rounded text-xs transition cursor-pointer"
                          >
                            제재 강제 해동 (정상 회원 환원)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editingBanReason.trim()) {
                                alert('이용제재 정지를 집행하실 경우, 부과 사유를 명시해 주셔야 합니다!');
                                return;
                              }
                              if (onUpdateUser) {
                                await onUpdateUser(selectedMember.uid, { isBanned: true, banReason: editingBanReason.trim() });
                                alert(`🔒 제재집행 성공! ${selectedMember.nickname} 회원의 스포츠 퀴즈 및 채팅 전면 금지(차단)를 격발하였습니다.`);
                              }
                            }}
                            className="flex-1 bg-red-650 hover:bg-red-700 text-white font-black py-2.5 rounded text-xs transition cursor-pointer"
                          >
                            이용제재 (활동제한 정지) 적용
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            console.log("Delete attempt for:", selectedMember.uid);
                            console.log("AiAutoManager: onDeleteUser is:", typeof onDeleteUser);
                            if (window.confirm(`⚠️ 경고!\n[${selectedMember.nickname}] 회원의 계정을 데이터베이스에서 완전히 삭제(탈퇴) 파쇄할까요?\n이 동작은 영구적이며 절대 번복할 수 없습니다.`)) {
                              if (onDeleteUser) {
                                console.log("onDeleteUser defined, calling it...");
                                const originalButtonText = "강제탈퇴";
                                const button = document.getElementById("delete-user-btn");
                                if (button) {
                                  button.innerText = "삭제중...";
                                  button.style.opacity = "0.5";
                                }
                                await onDeleteUser(selectedMember.uid);
                                setSelectedMemberId(null);
                                alert('💨 해당 회원의 개인정보 파쇄 및 Firestore 구좌 말소 처리가 즉각 격발 완료되었습니다.');
                              } else {
                                console.error("onDeleteUser is missing!");
                              }
                            }
                          }}
                          id="delete-user-btn"
                          className="bg-transparent hover:bg-red-950/20 text-red-500 hover:text-red-400 font-black border border-red-900/40 px-3.5 py-2.5 rounded text-xs transition shrink-0 cursor-pointer"
                          title="영구 삭제"
                        >
                          강제탈퇴
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-gray-800 rounded-xl text-gray-500">
                  <ShieldAlert className="h-10 w-10 text-gray-650 mx-auto mb-3 animate-pulse" />
                  <p className="text-xs leading-relaxed font-semibold">
                    가입회원 대장부 테이블에서 가입자를 선택 시<br />모든 계정 패스워드와 자산 통제 옵션이 연동 점화됩니다.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : adminTab === 'predictions' ? (
        <AdminPredictionsTab 
          globalSubcategories={globalSubcategories}
          setGlobalSubcategories={setGlobalSubcategories}
          onAddPrediction={onAddPrediction}
          predictionCards={predictionCards}
          firebaseAvailable={firebaseAvailable}
          db={db}
        />
      ) : adminTab === 'resolve' ? (
        <div className="space-y-6 animate-fade-in text-xs max-w-7xl mx-auto">
          {/* HEADER INFO BANNER */}
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-lg">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">예측 마켓 결과 판정 및 최종 정산 통제</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                  예측 마감이 된 질문들을 모니터링하고 결과를 확정합니다. 경기취소 및 적중특례 옵션을 지정하여 전체 배트금을 100% 반환 처리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: UNRESOLVED LIST */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 shadow-lg min-h-[500px] flex flex-col">
                {/* SUB-TAB TOGGLE */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#181d2a] rounded-lg border border-gray-800 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResolveSubTab('pending');
                      setSelectedPredToResolve(null);
                    }}
                    className={`py-1.5 text-center text-[10px] font-extrabold rounded transition-all cursor-pointer ${
                      resolveSubTab === 'pending'
                        ? 'bg-emerald-600 text-white shadow-inner'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚖️ 판정 대기 ({predictionCards.filter(p => p.status !== 'resolved').length}개)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResolveSubTab('resolved');
                      setSelectedPredToResolve(null);
                    }}
                    className={`py-1.5 text-center text-[10px] font-extrabold rounded transition-all cursor-pointer ${
                      resolveSubTab === 'resolved'
                        ? 'bg-emerald-600 text-white shadow-inner'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ✏️ 판정 완료 수정 ({predictionCards.filter(p => p.status === 'resolved').length}개)
                  </button>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-bold text-xs flex items-center">
                    <List className="h-4 w-4 mr-1.5 text-emerald-400" />
                    {resolveSubTab === 'pending' ? '판정 대기 게임 리스트' : '판정 완료 게임 리스트'}
                  </h4>
                  {resolveSubTab === 'pending' && (
                    <button
                      disabled={isBatchResolving}
                      className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm ${isBatchResolving ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                      onClick={async () => {
                        console.log("DEBUG: 버튼 클릭됨");
                        setIsBatchResolving(true);
                        console.log("DEBUG: setIsBatchResolving(true) 호출됨");
                        try {
                          console.log("DEBUG: Batch reconcile logic started");
                          const now = new Date();
                          const expired = predictionCards.filter(p => {
                            const endDate = new Date(p.endAt);
                            return p.status !== 'resolved' && endDate <= now;
                          });

                          console.log("DEBUG: Expired games count:", expired.length);
                          
                          if (expired.length === 0) {
                            alert("확정할 게임이 없습니다.");
                            return;
                          }

                          let confirmedCount = 0;
                          console.log("DEBUG: Loop start, expired list:", expired);
                          for (let i = 0; i < expired.length; i++) {
                            const p = expired[i];
                            console.log(`DEBUG: [${i+1}/${expired.length}] Processing game ${p.id}...`);
                            try {
                              const res = await fetch(getApiUrl('/api/ai/resolve-prediction'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: p.title,
                                  description: p.description,
                                  options: p.options,
                                  sourceUrl: p.sourceUrl
                                })
                              });
                              const data = await res.json();
                              console.log(`DEBUG: [${i+1}/${expired.length}] Result for ${p.id}:`, data);
                              if (data.success && data.data && data.data.winningOption) {
                                await onResolvePrediction(p.id, data.data.winningOption, data.data.evidence);
                                confirmedCount++;
                              } else {
                                console.log(`DEBUG: [${i+1}/${expired.length}] Game ${p.id} result not available yet, skipping.`);
                              }
                            } catch (err: any) {
                              console.error(`Error resolving ${p.id}:`, err);
                              const apiEndpoint = getApiUrl('/api/ai/resolve-prediction');
                              if (err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.toString()?.includes('fetch')) {
                                alert(`❌ [일괄 처리 오류]\n\n호스트: ${window.location.hostname}\n대상: ${apiEndpoint}\n\n도메인 정책(CORS) 또는 서버 실행 문제로 연결에 실패했습니다. 백엔드가 최신 서버 사양으로 안전하게 배포 완료되었는지 확인해 주세요.`);
                              }
                            }
                          }
                          console.log("DEBUG: Loop finished, count:", confirmedCount);
                          alert(`${confirmedCount}개의 게임 검토 완료.`);
                        } finally {
                          setIsBatchResolving(false);
                          console.log("DEBUG: setIsBatchResolving(false) 호출됨");
                        }
                      }}
                    >
                      {isBatchResolving ? 'AI 분석 및 확정 작업 중...' : 'AI 전체 결과 일괄 확정 🤖'}
                    </button>
                  )}
                </div>

                {/* SEARCH & FILTER */}
                <div className="space-y-2 mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-[#181d2a] text-xs text-white border border-gray-800 pl-8 pr-3 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none font-semibold"
                      placeholder="예측 질문 명칭 검색..."
                      value={resolveSearch}
                      onChange={(e) => setResolveSearch(e.target.value)}
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setResolveCategory('all')}
                      className={`px-3 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                        resolveCategory === 'all'
                          ? 'bg-emerald-600 text-white shadow-inner'
                          : 'bg-[#181d2a] text-gray-400 hover:text-white'
                      }`}
                    >
                      전체 카테고리
                    </button>
                    {[
                      { id: 'politics', label: '⚖️ 정치' },
                      { id: 'sports', label: '🏆 스포츠' },
                      { id: 'esports', label: '🎮 E스포츠' },
                      { id: 'economy', label: '📊 경제' },
                      { id: 'entertainment', label: '🎬 연예' },
                      { id: 'news', label: '📰 뉴스' },
                      { id: 'broadcast', label: '📺 방송' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setResolveCategory(cat.id)}
                        className={`px-3 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                          resolveCategory === cat.id
                            ? 'bg-emerald-600 text-white shadow-inner'
                            : 'bg-[#181d2a] text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LIST OF PREDICTIONS */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[480px] pr-1">
                  {predictionCards.filter(p => resolveSubTab === 'pending' ? p.status !== 'resolved' : p.status === 'resolved').filter((p) => {
                    const matchesSearch = p.title.toLowerCase().includes(resolveSearch.toLowerCase());
                    const matchesCategory = resolveCategory === 'all' || p.category === resolveCategory;
                    return matchesSearch && matchesCategory;
                  }).length === 0 ? (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center">
                      <ShieldCheck className="h-10 w-10 text-gray-600 mb-2 opacity-30" />
                      <p className="font-bold text-xs">
                        {resolveSubTab === 'pending' ? '확정 대기 중인 예측 게임이 없습니다.' : '판정된 예측 게임이 없습니다.'}
                      </p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {resolveSubTab === 'pending' ? '새로운 마켓이 마감되면 이곳에 표시됩니다.' : '결과를 확정한 게임들이 여기에 표시되며 수정할 수 있습니다.'}
                      </p>
                    </div>
                  ) : (
                    predictionCards.filter(p => resolveSubTab === 'pending' ? p.status !== 'resolved' : p.status === 'resolved').filter((p) => {
                      const matchesSearch = p.title.toLowerCase().includes(resolveSearch.toLowerCase());
                      const matchesCategory = resolveCategory === 'all' || p.category === resolveCategory;
                      return matchesSearch && matchesCategory;
                    }).map((p) => {
                      const isExpired = new Date(p.endAt) <= new Date() || p.status === 'closed' || p.status === 'resolved';
                      const isSelected = selectedPredToResolve?.id === p.id;
                      const categoryLabels: Record<string, string> = {
                        politics: '정치', sports: '스포츠', esports: 'Esports',
                        economy: '경제', entertainment: '연예', news: '뉴스', broadcast: '방송'
                      };

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPredToResolve(p);
                            setResolveWinningOption(resolveSubTab === 'resolved' ? (p.winningOption || '') : '');
                            setIsConfirmingResolve(false);
                          }}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#162a22] border-emerald-500 shadow-md'
                              : 'bg-[#181c26] border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-[#22c55e]/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded">
                                {categoryLabels[p.category] || p.category}
                              </span>
                              {p.endAt && (
                                <span className="text-[9px] text-gray-400 font-medium font-sans">
                                  📅 경기: {formatCompactDate(p.endAt)}
                                </span>
                              )}
                            </div>
                            {p.status === 'resolved' ? (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-300 font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                🏆 결과 확정됨 ({p.winningOption})
                              </span>
                            ) : isExpired ? (
                              <span className="text-[9px] bg-red-500/10 text-red-400 font-black px-1.5 py-0.5 rounded">
                                🔴 예측 마감
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 font-black px-1.5 py-0.5 rounded">
                                🟢 예측 진행 중
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-black text-white line-clamp-2 leading-snug mb-2">{p.title}</h5>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                            <span>선택옵션: {p.options?.length || 0}개</span>
                            {resolveSubTab === 'pending' && isExpired && (
                                <button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] px-2 py-1 rounded"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        // Trigger AI call
                                        setSelectedPredToResolve(p);
                                        try {
                                            const res = await fetch(getApiUrl('/api/ai/resolve-prediction'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    title: p.title,
                                                    description: p.description,
                                                    options: p.options,
                                                    sourceUrl: p.sourceUrl
                                                })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                setResolveWinningOption(data.data.winningOption);
                                                setResolveEvidence(data.data.evidence);
                                                alert(`AI 판단 결과:\n${data.data.winningOption}\n\n${data.data.evidence}`);
                                            } else {
                                                alert(`AI 판단 실패: ${data.error}`);
                                            }
                                        } catch (err: any) {
                                            console.error("Single game AI resolve error:", err);
                                            const apiEndpoint = getApiUrl('/api/ai/resolve-prediction');
                                            if (err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.toString()?.includes('fetch')) {
                                                alert(`❌ [API 연결 오류 - CORS/네트워크 제한]\n\n- 접속 도메인: ${window.location.hostname}\n- 백엔드 대상 주소: ${apiEndpoint}\n\n인증 기관(SSL), CORS 도메인 정책 또는 임시 백엔드 인스턴스 지연으로 인해 API 서버와 실시간 통신할 수 없습니다.\n\n백엔드 서버가 활성화되었는지(AIS 배포 완료) 확인하시고 새로고침 후 시도해 주시기 바랍니다.`);
                                            } else {
                                                alert(`AI 호출 오류: ${err.message || err}`);
                                            }
                                        }
                                    }}
                                >
                                    🤖 AI 검토
                                </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTION AND CONFIRMATION FORM */}
            <div className="lg:col-span-7 space-y-4">
              {selectedPredToResolve ? (
                <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 shadow-lg space-y-5 animate-fade-in">
                  <div>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-black px-2 py-1 rounded">
                      {resolveSubTab === 'pending' ? 'STEP 2: 결과 확정 전산 폼' : 'STEP 2: 결과 수정 및 소급 교정 전산 폼'}
                    </span>
                    <h4 className="text-white font-bold text-sm mt-3 line-clamp-2 leading-relaxed">
                      {selectedPredToResolve.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1">
                      본 게임의 식별코드: <span className="font-mono text-emerald-400 font-bold">{selectedPredToResolve.id}</span>
                      {selectedPredToResolve.status === 'resolved' && (
                        <span className="ml-2 text-amber-400 font-extrabold font-mono">
                          (현재 판정값: {selectedPredToResolve.winningOption})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* PROPERTIES SUMMARY */}
                  <div className="grid grid-cols-2 gap-2.5 bg-[#181d2a] p-3 rounded-lg border border-gray-800/80">
                    <div>
                      <span className="text-gray-550 text-[10px] block font-semibold">소속 카테고리</span>
                      <span className="text-white font-mono text-xs font-black uppercase">
                        {selectedPredToResolve.category === 'politics' && '⚖️ 정치'}
                        {selectedPredToResolve.category === 'sports' && '🏆 스포츠'}
                        {selectedPredToResolve.category === 'esports' && '🎮 E스포츠'}
                        {selectedPredToResolve.category === 'economy' && '📊 경제'}
                        {selectedPredToResolve.category === 'entertainment' && '🎬 연예'}
                        {selectedPredToResolve.category === 'news' && '📰 뉴스'}
                        {selectedPredToResolve.category === 'broadcast' && '📺 방송'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-550 text-[10px] block font-semibold">선택 옵션 수</span>
                      <span className="text-white font-mono text-sm font-black">{selectedPredToResolve.options?.length || 0}개</span>
                    </div>
                  </div>

                  {/* WINNING OPTION SELECTOR */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-gray-300 font-bold block">
                      {resolveSubTab === 'pending' ? '정확한 결과(당첨 옵션) 또는 특별 처리 옵션 선택' : '정정하고자 하는 새로운 결과(당첨 옵션) 또는 전산 취소 옵션 선택'}
                    </label>

                    {/* Basic options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedPredToResolve.options.map((opt: string) => {
                        const isChosen = resolveWinningOption === opt;
                        const isOriginalWinner = selectedPredToResolve.winningOption === opt;

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setResolveWinningOption(opt);
                              setIsConfirmingResolve(false);
                            }}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isChosen
                                ? 'bg-emerald-650/20 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-white'
                                : 'bg-[#181c25] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span className="flex items-center gap-1.5">
                                {opt}
                                {isOriginalWinner && <span className="text-[9px] text-[#22c55e] border border-[#22c55e]/30 px-1 rounded">기존당첨</span>}
                              </span>
                              {isChosen && <span className="text-xs bg-emerald-500 text-black px-1.5 py-0.5 rounded font-black">판정선택</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* SPECIAL REFUND AND PUSH OPTIONS */}
                    <div className="pt-3 border-t border-gray-800">
                      <span className="text-[10px] text-gray-400 font-bold block mb-2">관리자 구휼 전산 옵션 (경기 취소 / 적중 특례)</span>
                      <div className="grid grid-cols-2 gap-2">
                        {/* 경기취소 */}
                        <button
                          type="button"
                          onClick={() => {
                            setResolveWinningOption('경기취소');
                            setIsConfirmingResolve(false);
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            resolveWinningOption === '경기취소'
                              ? 'bg-purple-650/30 border-purple-500 text-purple-300 font-bold shadow-md'
                              : 'bg-[#181c25] border-gray-800 text-purple-400/80 hover:border-purple-900/40'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span className="flex items-center gap-1.5">
                              경기 취소
                              {selectedPredToResolve.winningOption === '경기취소' && <span className="text-[9px] text-purple-400 border border-purple-500/30 px-1 rounded">기존</span>}
                            </span>
                            {resolveWinningOption === '경기취소' && (
                              <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.5 rounded">지정됨</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-550 mt-1 font-medium">예측 이벤트를 경기 취소 처리 및 종료합니다.</p>
                        </button>

                        {/* 적중특례 */}
                        <button
                          type="button"
                          onClick={() => {
                            setResolveWinningOption('적중특례');
                            setIsConfirmingResolve(false);
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            resolveWinningOption === '적중특례'
                              ? 'bg-pink-650/30 border-pink-500 text-pink-300 font-bold shadow-md'
                              : 'bg-[#181c25] border-gray-800 text-pink-400/80 hover:border-pink-900/40'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span className="flex items-center gap-1.5">
                              적중 특례
                              {selectedPredToResolve.winningOption === '적중특례' && <span className="text-[9px] text-pink-400 border border-pink-500/30 px-1 rounded">기존</span>}
                            </span>
                            {resolveWinningOption === '적중특례' && (
                              <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.5 rounded">지정됨</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-550 mt-1 font-medium">예측 이벤트를 적중 특례 처리 및 종료합니다.</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EVIDENCE INPUT */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-gray-300 font-bold flex justify-between">
                      <span>결과 분석 및 판정 고시 내용</span>
                      <span className="text-[9px] text-gray-500 font-mono">종료 고시글 작성</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#181d2a] text-xs text-white border border-gray-800 p-2.5 rounded focus:border-[#22c55e] focus:outline-none"
                      placeholder={resolveSubTab === 'pending' ? "예시: 경기결과 2-1로 XX팀 승리가 확정되어 규정에 따라 판정을 결정합니다." : "예시: 판정 결과 정정 고시. 기존 분석 오류를 교하고 정정에 의거 당첨 포인트 지급을 소급 적용합니다."}
                      value={resolveEvidence}
                      onChange={(e) => setResolveEvidence(e.target.value)}
                    />
                  </div>

                  {/* EXECUTE ACTION */}
                  <div className="pt-3 border-t border-gray-800 text-right space-y-2">
                    {isConfirmingResolve ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-400 text-left flex items-start gap-2 mb-2 animate-pulse">
                        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs">
                            {resolveSubTab === 'pending' ? '확정 판정 최종 동의 고시' : '판정 결과 정정 및 자금 소급수합 최종 동의'}
                          </p>
                          <p className="mt-0.5 opacity-90 leading-relaxed text-[10px] text-amber-200">
                            {resolveSubTab === 'pending' ? (
                              <>본 게임의 결과를 <strong>[{resolveWinningOption}]</strong>(으)로 확정하시겠습니까?<br />실행 시 베팅 내역 보관소에 기록되며 되돌릴 수 없습니다. 확인 후 한번 더 클릭하세요.</>
                            ) : (
                              <>기존 결과를 취소하고 신규 결과를 <strong>[{resolveWinningOption}]</strong>(으)로 전면 수정하시겠습니까?<br />실행 즉시 이미 지급되었던 배당금이 무효가 되고 올바른 당첨 유저들에게 소급 환수/지급 정산 처리가 동시 실행됩니다. 확인 후 한번 더 클릭하세요.</>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      {isConfirmingResolve && (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingResolve(false)}
                          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-lg transition-all"
                        >
                          취소
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!resolveWinningOption) {
                            try {
                              alert("정답 옵션 또는 경기취소/적중특례 중 하나를 반드시 선택해야 결과 확정이 완료됩니다.");
                            } catch (e) {
                              showError("정답 옵션 또는 경기취소/적중특례 중 하나를 선택해 주십시오.");
                            }
                            return;
                          }

                          if (resolveSubTab === 'resolved' && resolveWinningOption === selectedPredToResolve.winningOption) {
                            alert("기존에 적용된 판정 결과 옵션과 동일합니다. 다른 정답 결과를 선택해 정정을 진행해 주세요.");
                            return;
                          }

                          if (!isConfirmingResolve) {
                            setIsConfirmingResolve(true);
                            return;
                          }

                          try {
                            await onResolvePrediction(selectedPredToResolve.id, resolveWinningOption, resolveEvidence);
                            try {
                              if (resolveSubTab === 'pending') {
                                alert(`[결과 확정 완료] [${selectedPredToResolve.title.substring(0, 10)}] 예측에 대한 결과 확정이 최종 완료되었습니다.`);
                              } else {
                                alert(`[판정 결과 소급 정정 완료] [${selectedPredToResolve.title.substring(0, 10)}] 예측 결과가 성공적으로 긴급 정정되었으며, 참가자들의 포인트 지급 잔고가 실시간 소급 정산 완료되었습니다.`);
                              }
                            } catch (alertErr) {
                              // alert might be blocked
                            }
                            
                            // Reset state
                            setSelectedPredToResolve(null);
                            setResolveWinningOption('');
                            setResolveEvidence('공식 협회 데이터 및 경기 결과 기준 판정 완료.');
                            setIsConfirmingResolve(false);

                            // Redirect to prediction results checking tab!
                            if (setCurrentTab) {
                              setCurrentTab('results');
                            }
                          } catch (e: any) {
                            try {
                              alert("판정 발포 진행 시 시스템 에러가 관측되었습니다: " + e.message);
                            } catch (alertErr) {
                              showError("오류: " + e.message);
                            }
                          }
                        }}
                        className={`w-full py-3 text-white font-black text-xs rounded-lg transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                          isConfirmingResolve
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          {resolveSubTab === 'pending' ? (
                            isConfirmingResolve ? '⚠️ 결과 최종 확정 동의 (다시 클릭하여 무조건 완료)' : '결과 최종 확정 및 즉시 마감 ⚡'
                          ) : (
                            isConfirmingResolve ? '⚠️ 결과 긴급 정정 적용 (다시 클릭하여 즉시 소급 교정)' : '결과 긴급 정정 및 소급 교정 발포 ⚡'
                          )}
                        </span>
                      </button>
                    </div>

                    <p className="text-[9px] text-gray-400 text-center mt-2 font-semibold font-sans">
                      {resolveSubTab === 'pending' ? (
                        '확정과 동시에 당첨 예측 결과 보관소에 기록되며, 전체 판정 속보가 공개 로비 챗방으로 자동 보도됩니다.'
                      ) : (
                        '판정 수정 즉시 전체 예측 당첨자 보관소가 전면 재정산 업데이트되며, 로비 챗방으로 수정정정 성명문이 즉시 보도 고시됩니다.'
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#121620] border border-gray-800 text-gray-500 rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
                  <HelpCircle className="h-12 w-12 text-gray-700 mb-3" />
                  <h4 className="text-white font-bold text-xs">확정할 게임 사건을 먼저 택해주십시오</h4>
                  <p className="text-[10px] mt-2 max-w-sm leading-relaxed text-gray-450 font-semibold">
                    왼쪽의 미해결 예측 리스트 패널에서 마감 완료되었거나 판정하고자 하는 질문을 선택해 주십시오.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : adminTab === 'logos' ? (
        <div className="space-y-6 animate-fade-in text-xs">
          {/* HEADER INFO PANEL */}
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shrink-0">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">리그 및 예측 카테고리 로고 이미지 관리기</h3>
                <p className="text-[11px] text-gray-450 font-semibold mt-0.5">
                  각 예측 카테고리/리그(LCK, KBO, 대선, 지방선거 등)에 매칭되는 고유 엠블럼 이미지를 지정하고 교정합니다.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-md">
              SYSTEM ONLINE
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT / CENTER COLUMN: REGISTRATION FORM */}
            <div className="lg:col-span-1 bg-[#121620] border border-gray-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-amber-400 border-b border-gray-850 pb-2.5 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                신규 로고 이미지 업로드 및 교체
              </h4>

              <form onSubmit={handleLogoSave} className="space-y-4 font-sans">
                {/* SUBCATEGORY SELECTION */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400">대상 지정 리그/카테고리</label>
                  <select
                    value={logoSubCategory}
                    onChange={(e) => setLogoSubCategory(e.target.value)}
                    className="w-full bg-[#1b1c24] border border-gray-800 rounded px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- 대상을 선택해 주세요 --</option>
                    {allSubcategories.map((sub) => (
                      <option key={sub.key} value={sub.key}>
                        [{sub.parent.toUpperCase()}] {sub.label} ({sub.key})
                      </option>
                    ))}
                  </select>
                </div>


                {/* UPLOAD METHOD TABS */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400">업로드 미디어 채널</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1b1c24] rounded border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setLogoInputType('file')}
                      className={`py-1.5 text-[11px] font-black rounded transition-all cursor-pointer ${
                        logoInputType === 'file'
                          ? 'bg-amber-500 text-black shadow-inner'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      이미지 파일 업로드 (스토리지)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('url')}
                      className={`py-1.5 text-[11px] font-black rounded transition-all cursor-pointer ${
                        logoInputType === 'url'
                          ? 'bg-amber-500 text-black shadow-inner'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      고정 파일 URL 직접 연동
                    </button>
                  </div>
                </div>

                {/* FILE INPUT OR TEXT PLAIN URL INPUT */}
                {logoInputType === 'file' ? (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400">이미지 파일 배포</label>
                    <div className="flex flex-col gap-2 p-3 bg-[#171b26] border border-dashed border-gray-850 rounded-lg text-center cursor-pointer hover:bg-neutral-800 relative group transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 256;
                                const MAX_HEIGHT = 256;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height = Math.round(height * (MAX_WIDTH / width));
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width = Math.round(width * (MAX_HEIGHT / height));
                                    height = MAX_HEIGHT;
                                  }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  // Downscaled high-quality PNG
                                  const dataUrl = canvas.toDataURL('image/png');
                                  setLogoFileBase64(dataUrl);
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <ImageIcon className="h-6 w-6 text-gray-500 group-hover:text-amber-400 mx-auto transition" />
                      <span className="text-[10px] text-gray-450 font-bold leading-normal">
                        클릭해서 이미지 수동 선택 혹은 이 구역으로 파일 드롭<br />
                        <span className="text-[#f59e0b] font-mono text-[9px]">(256x256 규격 자동 고성능 압축 최적화 적용됨)</span>
                      </span>
                    </div>

                    {logoFileBase64 && (
                      <div className="pt-2">
                        <span className="text-[10px] block text-gray-500 font-bold mb-1">인코딩 미리보기</span>
                        <div className="w-16 h-16 rounded-xl border border-amber-500/40 bg-[#1e202b] flex items-center justify-center overflow-hidden">
                          <img src={logoFileBase64} alt="Preview" className="w-full h-full object-contain p-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400">이미지 소스 URL 링크</label>
                    <input
                      type="url"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-[#1b1c24] border border-gray-800 rounded px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    {logoUrlInput && (
                      <div className="pt-2">
                        <span className="text-[10px] block text-gray-500 font-bold mb-1">URL 원격 미리보기</span>
                        <div className="w-16 h-16 rounded-xl border border-amber-500/40 bg-[#1e202b] flex items-center justify-center overflow-hidden">
                          <img src={logoUrlInput} alt="Preview" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as any).src = 'https://placehold.co/100x100?text=Invalid+URL' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTION TRIGGER BUTTON */}
                <button
                  type="submit"
                  disabled={!logoSubCategory}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-405 hover:to-amber-550 font-black rounded text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>공식 연동 로고로 영구 저장 등록</span>
                </button>
              </form>
            </div>

            {/* RIGHT SIDE: CURRENTLY REGISTERED LOGOS GRID */}
            <div className="lg:col-span-2 bg-[#121620] border border-gray-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-amber-400 border-b border-gray-850 pb-2.5 flex items-center justify-between">
                <span>현재 실시간 등록 완료된 수록 리그 로고 대장 ({Object.keys(subcategoryLogos).length}개)</span>
                <span className="text-[9px] font-mono text-gray-500">Live Sync</span>
              </h4>

              {Object.keys(subcategoryLogos).length === 0 ? (
                <div className="text-center py-24 border border-dashed border-gray-850 rounded-lg text-gray-550 space-y-2">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-35" />
                  <p className="text-[11px] font-semibold leading-relaxed">
                    등록되어 사용 중인 기호 로고가 전무합니다.<br />
                    카테고리/리그에 고유 엠블럼을 적합하게 최초 배정해 보십시오.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {Object.entries(subcategoryLogos).map(([subKey, imgUrl]) => {
                    const matchedSub = allSubcategories.find(s => s.key === subKey);
                    const subLabelResolved = matchedSub ? `${matchedSub.label} (${subKey})` : subKey;
                    const parentCategory = matchedSub ? matchedSub.parent.toUpperCase() : 'CUSTOM';

                    return (
                      <div key={subKey} className="bg-[#1b1c24] border border-gray-850 rounded-xl p-3 flex items-center justify-between gap-3.5 hover:border-amber-500/25 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-gray-800 bg-[#1e202b] flex items-center justify-center overflow-hidden shrink-0">
                            <img src={imgUrl} alt={subKey} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider bg-amber-500/10 border border-amber-500/20 px-1 rounded-sm">
                              {parentCategory}
                            </span>
                            <div className="text-[11px] font-black text-white truncate max-w-[130px] mt-1">
                              {subLabelResolved}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Button verification: Clicked!");
                            handleLogoDelete(subKey);
                          }}
                          className="p-1.5 hover:bg-red-950/20 border border-gray-850 hover:border-red-900/40 text-red-400 hover:text-red-300 rounded-md transition cursor-pointer"
                          title="로고 이미지 기기 환원"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
