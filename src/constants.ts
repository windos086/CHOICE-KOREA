import { DynamicMenuItem } from './types';

export const DEFAULT_DYNAMIC_MENUS: DynamicMenuItem[] = [
  {
    id: 'politics',
    label: '정치',
    iconName: 'Scale',
    tab: 'predict',
    category: 'politics',
    className: 'text-blue-505', // original blue-500
    submenus: []
  },
  {
    id: 'sports',
    label: '스포츠',
    iconName: 'Trophy',
    tab: 'predict',
    category: 'sports',
    className: 'text-amber-500',
    submenus: []
  },
  {
    id: 'esports',
    label: 'E스포츠',
    iconName: 'Gamepad2',
    tab: 'predict',
    category: 'esports',
    className: 'text-purple-500',
    submenus: []
  },
  {
    id: 'economy',
    label: '경제',
    iconName: 'TrendingUp',
    tab: 'predict',
    category: 'economy',
    className: 'text-emerald-500',
    submenus: []
  },
  {
    id: 'entertainment',
    label: '연예',
    iconName: 'Sparkles',
    tab: 'predict',
    category: 'entertainment',
    className: 'text-pink-500',
    submenus: []
  },
  {
    id: 'news',
    label: '뉴스',
    iconName: 'Newspaper',
    tab: 'predict',
    category: 'news',
    className: 'text-cyan-500',
    submenus: []
  },
  {
    id: 'broadcast',
    label: '방송',
    iconName: 'Play',
    tab: 'predict',
    category: 'broadcast',
    className: 'text-red-500',
    submenus: []
  },
  {
    id: 'results',
    label: '예측결과',
    iconName: 'CheckCircle',
    tab: 'results',
    className: 'text-green-500',
    submenus: []
  },
  {
    id: 'community',
    label: '커뮤니티',
    iconName: 'MessageSquare',
    tab: 'community',
    className: 'text-green-500',
    submenus: [
      { id: 'comm_free', label: '자유게시판', tab: 'community' },
      { id: 'comm_humor', label: '유머게시판', tab: 'community_humor' },
      { id: 'comm_notice', label: '공지사항', tab: 'community_notice' },
      { id: 'comm_ranking', label: '초이스랭킹', tab: 'community_ranking' },
      { id: 'comm_shop', label: '포인트샵', tab: 'shop' }
    ]
  },
  {
    id: 'cs',
    label: '고객센터',
    iconName: 'Headphones',
    tab: 'customer-center',
    className: 'text-[#d11822]',
    submenus: []
  },
  {
    id: 'suggestion',
    label: '제안하기',
    iconName: 'MessageSquare',
    tab: 'suggestion',
    className: 'text-indigo-500',
    submenus: []
  }
];
