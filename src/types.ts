export interface UserProfile {
  uid: string;
  nickname: string;
  points: number;
  predictsCount: number;
  successCount: number;
  exchangeCount: number;
  createdAt: string;
  loginId?: string;
  password?: string;
  isBanned?: boolean;
  banReason?: string;
  dailyPredictions?: { predictionId: string; timestamp: number }[];
  lastNicknameChangeAt?: string;
  profileImageUrl?: string;
  chatMutedUntil?: string;
  activeBadge?: string;
  purchasedBadges?: string[];
  dailyQuest?: {
    date: string;
    attendance: boolean;
    posts: number;
    comments: number;
    predictions: number;
    completed: boolean;
  };
}

export interface PredictionCard {
  id: string;
  title: string;
  description: string;
  category: 'sports' | 'esports' | 'politics' | 'economy' | 'news' | 'entertainment' | 'broadcast';
  subCategory?: string;
  options: string[];
  pool: { [option: string]: number };
  totalPool: number;
  creator: 'admin' | 'ai';
  status: 'open' | 'closed' | 'resolved';
  winningOption: string | null;
  resolutionMethod: 'ai_automatic' | 'manual';
  endAt: string;
  createdAt: string;
  sourceUrl: string;
  proposerUid?: string;
}

export interface BetRecord {
  id: string;
  userId: string;
  userNickname: string;
  predictionId: string;
  option: string;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  payout: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userNickname: string;
  userColor: string;
  message: string;
  type: 'chat' | 'system' | 'bot_announcement';
  createdAt: string;
}

export interface GiftconItem {
  id: string;
  name: string;
  price: number;
  image: string;
  provider: string;
}

export interface CommunityPost {
  id: string;
  number: number;
  title: string;
  content: string;
  tag?: string;
  author: string;
  createdAt: string; // Keep as string for display
  timestamp?: number; // Add timestamp for precise time formatting
  views: number;
  likes: number;
  likedBy?: string[]; // Track who liked the post to restrict limits
  isNotice: boolean;
  isRecommended: boolean;
  commentCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
  likes: number;
  likedBy: string[];
}

export interface DynamicSubmenu {
  id?: string;
  label: string;
  tab: string;
  category?: string;
}

export interface DynamicMenuItem {
  id: string;
  label: string;
  iconName: string;
  tab: string;
  category?: string;
  className?: string;
  submenus: DynamicSubmenu[];
}

export interface PredictionComment {
  id: string;
  predictionId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
  likes?: number;
  likedBy?: string[];
}

export interface PredictionReply {
  id: string;
  commentId: string;
  predictionId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
}


/**
 * Firebase Hosting is static, which means direct requests to /api/... will return 404 (or index.html).
 * This helper automatically redirects API requests to the compiled Cloud Run full-stack URL
 * if the user is running the app on their production Firebase custom domain or static hosting environments.
 */
export function getApiUrl(path: string): string {
  // If explicitly configured via VITE environment variables, respect it
  const env = (import.meta as any).env || {};
  if (env.VITE_API_BASE_URL) {
    return `${env.VITE_API_BASE_URL}${path}`;
  }

  const host = window.location.hostname;
  const isCustomDomain = host === 'choicekr.co.kr' || host === 'www.choicekr.co.kr';
  const isFirebaseHosting = host.endsWith('.web.app') || host.endsWith('.firebaseapp.com');

  if (isCustomDomain || isFirebaseHosting) {
    // Under Firebase Hosting static domains or custom domains, make request directly to the serverless Cloud Run full-stack service
    const productionBackend = 'https://ais-pre-nx3fiijcdcr5adljkbq6v6-509029500969.asia-northeast1.run.app';
    return `${productionBackend}${path}`;
  }

  // Otherwise fallback to local/relative path
  return path;
}
