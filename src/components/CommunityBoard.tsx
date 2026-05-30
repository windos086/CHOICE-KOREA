import React, { useEffect } from 'react';
import { 
  Pencil, 
  Search, 
  ChevronDown, 
  User, 
  Eye, 
  ThumbsUp, 
  Calendar, 
  ArrowLeft, 
  Megaphone,
  Sparkles,
  FileText,
  Youtube,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  MoreHorizontal,
  Bell
} from 'lucide-react';
import { CommunityPost, UserProfile, Comment } from '../types';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { renderMilitaryBadge } from './MilitaryBadge';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface CommunityBoardProps {
  userProfile: UserProfile | null;
  onOpenLoginModal?: () => void;
  title?: string;
  boardType?: string;
  onQuestProgress?: (type: 'post' | 'comment') => void;
  allUsers?: UserProfile[];
  initialSelectedPostId?: string | null;
  onClearInitialSelectedPostId?: () => void;
}

// Utility to format dates: "X hours ago" or "YYYY/MM/DD"
const formatDisplayDate = (post: CommunityPost) => {
  const postDate = new Date(post.timestamp || post.createdAt);
  const now = new Date();
  
  // Check if it's today
  if (postDate.toDateString() === now.toDateString()) {
    const diffHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    return `${diffHours}시간 전`;
  }
  
  // Otherwise format YYYY/MM/DD
  return postDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '/').replace(/\/$/, '');
};

import ReactMarkdown from 'react-markdown';

const ContentRenderer = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm md:prose-base max-w-none text-neutral-300 whitespace-pre-wrap">
      <ReactMarkdown
        components={{
          img: ({ node, ...props }) => (
            <img {...props} className="max-w-full my-2 rounded-lg" alt="Uploaded" />
          ),
          iframe: ({ node, ...props }) => (
            <iframe {...props} className="max-w-full my-2 rounded-lg" />
          ),
          p: ({ node, ...props }) => {
            const children = props.children;
            if (typeof children === 'string') {
              const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+))/;
              const match = children.match(ytRegex);
              if (match) {
                const videoId = match[2];
                // Only embed if it's the *only* thing in the paragraph, or replace the text
                return (
                    <div className="my-4 max-w-[560px]">
                        <div className="relative w-full pb-[56.25%]">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                );
              }
            }
            return <p {...props} className="whitespace-pre-wrap mb-4" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Default initial posts so the board is active and lively, but fully supports CRUD in state
const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    number: 104,
    title: "📢 [공지] 초이스 코리아 공식 텔레그램 채널 외 사칭 채널 주의 안내",
    content: "안녕하세요. 초이스 코리아 마켓 운영진입니다. 최근 카카오톡 오픈채팅방 및 기타 비공식 SNS를 통해 저희 브랜드를 사칭하며 오라클 배팅 포인트 대리 충전 및 불법 가입을 유도하는 사기가 기승을 부리고 있습니다. 초이스 코리아는 절대 카카오톡 1:1 채팅이나 개별 메시지를 투입하지 않습니다. 모든 오피셜 진행은 이곳 공식 홈페이지 및 검증 텔레그램 공론장 채널을 통해서만 전개되오니 특별히 유념해 주시길 바랍니다. 불법 사칭 피해 복구 지원은 불가능하니 유의 부탁드립니다.",
    author: "최고관리자",
    createdAt: "2026-05-25",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    views: 1420,
    likes: 89,
    likedBy: [],
    isNotice: true,
    isRecommended: true
  },
  {
    id: "post-2",
    number: 103,
    title: "🔥 금일 LCK 결승 T1 vs Gen.G 세트 3 라운드 첫 용 킬 예측 팁 공유해봄",
    content: "최근 다섯 경기 분석해 보니까 Gen.G가 초반 드래곤 오브젝트 컨트롤 점유율이 68%에 육박함. T1은 탑 동선 유기하고 바텀 서포트 강화하는 추세 같은데, Gen.G 정글러 캐니언 선수가 초반 용 둥지 기습 동선 많이 타는 편이라 이번 세트 3 라운드 첫 용은 Gen.G의 극초반 이니시에 한 표 겁니다. 다들 보상 포인트 달달하게 챙기시길!",
    author: "예측마스터",
    createdAt: "2026-05-24",
    timestamp: new Date("2026-05-24").getTime(),
    views: 489,
    likes: 35,
    likedBy: [],
    isNotice: false,
    isRecommended: true
  },
  {
    id: "post-3",
    number: 102,
    title: "코스피 지수 2,750 넘을까? 경제 지표 업데이트해 드려요",
    content: "이번 금요일 한국은행 금통위 뉴스레터 보니까 경기 부양을 위한 한시적 연동 완화 제스처가 보이네요. 외국인 자본 순유입 기조도 저번 주에 비해 상당히 안착된 구간이라 무난히 KOSPI 2,750은 돌파해 안착 마감할 것이라는 관망세가 우세합니다. 소폭 배팅 충전하신 분들은 YES 쪽으로 승부 보셔도 합리적일 것 같습니다.",
    author: "주식왕김경제",
    createdAt: "2026-05-23",
    timestamp: new Date("2026-05-23").getTime(),
    views: 312,
    likes: 12,
    likedBy: [],
    isNotice: false,
    isRecommended: false
  },
  {
    id: "post-4",
    number: 101,
    title: "🎁 기프트콘 샵 GS25 금액권 교환 인증합니다 (존맛탱)",
    content: "하루종일 무료 예측 퀴즈 골라서 배팅 돌리다 보니까 포인트 금방 쌓이네요ㅋㅋㅋㅋㅋ 반신반의하면서 GS 편의점 만원 상품권 신청했는데 승인 떨어지자마자 문자로 정교한 바코드 기프티콘 바로 발송됨 ㄷㄷㄷ 진짜 혜자 사이트 인정합니다. 다들 빡공해서 공짜 편의점 털러 가시죠!",
    author: "편의점VIP",
    createdAt: "2026-05-22",
    timestamp: new Date("2026-05-22").getTime(),
    views: 560,
    likes: 42,
    likedBy: [],
    isNotice: false,
    isRecommended: true
  }
];

export default function CommunityBoard({ 
  userProfile, 
  onOpenLoginModal, 
  title = "자유게시판", 
  boardType = "free", 
  onQuestProgress, 
  allUsers = [],
  initialSelectedPostId,
  onClearInitialSelectedPostId
}: CommunityBoardProps) {
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);

  const loginLower = (userProfile?.loginId || '').toLowerCase().trim();
  const nickLower = (userProfile?.nickname || '').toLowerCase().trim();
  const isAdmin = loginLower === 'sinpotnf@gmail.com' || nickLower === 'sinpotnf@gmail.com' || loginLower === 'admin' || nickLower === 'admin' || userProfile?.nickname === '최고관리자';

  
  const getUserProfileByNickname = (nickname: string) => {
    if (!allUsers) return null;
    return allUsers.find(u => u.nickname === nickname);
  };

  const getUserProfileByUid = (uid: string) => {
    if (!allUsers) return null;
    return allUsers.find(u => u.uid === uid);
  };
  
  const collectionName = boardType === 'free' ? 'posts' : `posts_${boardType}`;

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ ...doc.data() as CommunityPost, id: doc.id }));
      setPosts(postsData);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = React.useState<'all' | 'recommended' | 'notice'>('all');
  const [isManagementMode, setIsManagementMode] = React.useState<boolean>(false);
  const [selectedPostIds, setSelectedPostIds] = React.useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = React.useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = React.useState<number>(30);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [searchType, setSearchType] = React.useState<'titleContext' | 'title' | 'author'>('titleContext');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [appliedSearchQuery, setAppliedSearchQuery] = React.useState<string>('');
  
  // Create / View Post States
  const [selectedPost, setSelectedPost] = React.useState<CommunityPost | null>(null);
  const [editingPost, setEditingPost] = React.useState<CommunityPost | null>(null);
  const [isWriting, setIsWriting] = React.useState<boolean>(false);
  const [newTitle, setNewTitle] = React.useState<string>('');
  const [newTag, setNewTag] = React.useState<string>('');
  const [newContent, setNewContent] = React.useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>('');
  const [media, setMedia] = React.useState<{type: 'image' | 'youtube', url: string}[]>([]);
  const [newIsNotice, setNewIsNotice] = React.useState<boolean>(false);
  const [newIsEvent, setNewIsEvent] = React.useState<boolean>(false);
  const [newIsRecommended, setNewIsRecommended] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleEditClick = (post: CommunityPost) => {
    try {
      console.log("DEBUG: handleEditClick called with:", post);
      setEditingPost(post);
      setNewTitle(post.title || '');
      setNewTag(post.tag || '');
      
      const content = post.content || '';
      const contentParts = content.split('\n![Image]');
      setNewContent(contentParts[0] || '');
      
      setNewIsNotice(!!post.isNotice);
      setNewIsEvent(!!post.isEvent);
      setNewIsRecommended(!!post.isRecommended);
      
      // Extract existing images/media block
      const scannedMedia: {type: 'image' | 'youtube', url: string}[] = [];
      const imageRegex = /!\[Image\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        if (match[1]) {
          scannedMedia.push({ type: 'image', url: match[1] });
        }
      }
      setMedia(scannedMedia);
      setIsWriting(true);
    } catch (err) {
      console.error("Error in handleEditClick:", err);
      alert("글 수정 양식을 불러오는 데 실패했습니다: " + (err as Error).message);
    }
  };

  const handleCancelWrite = () => {
    setIsWriting(false);
    setEditingPost(null);
    setNewTitle('');
    setNewTag('');
    setNewContent('');
    setNewIsNotice(false);
    setNewIsEvent(false);
    setNewIsRecommended(false);
    setMedia([]);
  };

  useEffect(() => {
    console.log("DEBUG: CommunityBoard userProfile:", userProfile);
  }, [userProfile]);

  const handleInsertImage = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && storage) {
          try {
              const storageRef = ref(storage, `community/${Date.now()}_${file.name}`);
              console.log("Uploading file to:", storageRef.fullPath);
              await uploadBytes(storageRef, file);
              const imageUrl = await getDownloadURL(storageRef);
              console.log("Image URL:", imageUrl);
              setMedia(prev => [...prev, { type: 'image', url: imageUrl }]);
          } catch (error) {
              console.error("Error uploading image:", error);
              alert("이미지 업로드에 실패했습니다. " + (error as Error).message);
          }
      } else {
          alert("Firebase Storage가 준비되지 않았거나 파일을 선택하지 않았습니다.");
      }
  };

  // Comment States
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = React.useState('');
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = React.useState('');

  useEffect(() => {
    if (selectedPost) {
      const q = query(collection(db, collectionName, selectedPost.id, 'comments'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() as Comment, id: doc.id }));
        setComments(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'comments');
      });
      return () => unsubscribe();
    } else {
        setComments([]);
    }
  }, [selectedPost]);

  // Filter posts based on active Tab and applied search
  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    // Tab filter
    if (boardType === 'notice') {
      if (activeTab === 'recommended') {
        // 공지사항 (only notices, not events)
        result = result.filter(p => p.isNotice && !p.isEvent && p.tag !== '#이벤트' && !(p.tag || '').includes('이벤트') && !p.title.includes('이벤트'));
      } else if (activeTab === 'notice') {
        // 이벤트 (isEvent, #이벤트, or post containing '이벤트' tag/title)
        result = result.filter(p => p.isEvent || p.tag === '#이벤트' || (p.tag || '').includes('이벤트') || p.title.includes('이벤트'));
      }
    } else {
      if (activeTab === 'recommended') {
        result = result.filter(p => p.isRecommended);
      } else if (activeTab === 'notice') {
        result = result.filter(p => p.isNotice);
      }
    }

    // Search filter
    if (appliedSearchQuery.trim()) {
      const q = appliedSearchQuery.toLowerCase().trim();
      if (searchType === 'titleContext') {
        result = result.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
      } else if (searchType === 'title') {
        result = result.filter(p => p.title.toLowerCase().includes(q));
      } else if (searchType === 'author') {
        result = result.filter(p => p.author.toLowerCase().includes(q));
      }
    }

    // Sort: Notices always go on top! Then by Number DESC
    return result.sort((a, b) => {
      if (a.isNotice && !b.isNotice) return -1;
      if (!a.isNotice && b.isNotice) return 1;
      return b.number - a.number;
    });
  }, [posts, activeTab, appliedSearchQuery, searchType]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const indexOfLastPost = currentPage * pageSize;
  const indexOfFirstPost = indexOfLastPost - pageSize;
  const currentPagedPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Set page back to 1 if tab or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, pageSize, appliedSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearchQuery(searchQuery);
  };

  const handleWriteClick = () => {
    if (!userProfile) {
      alert("⚠️ 회원 전용 서비스입니다. 먼저 우측 상단이나 사이드바에서 [초이스 코리아 로그인] 또는 회원가입을 완료한 후 이용해 주세요!");
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }
    if (boardType === 'notice' && !isAdmin) {
      alert("⚠️ 공지사항 및 이벤트 게시판은 관리자만 글을 등록할 수 있습니다.");
      return;
    }
    setEditingPost(null);
    setNewTitle('');
    setNewTag('');
    setNewContent('');
    setNewIsNotice(false);
    setNewIsEvent(false);
    setNewIsRecommended(false);
    setMedia([]);
    setIsWriting(true);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    if (!newTitle.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }
    if (!newContent.trim()) {
      alert('내용을 입력해 주세요.');
      return;
    }

    const finalContent = newContent + '\n' + media.map(m => m.type === 'image' ? `![Image](${m.url})` : `${m.url}`).join('\n');

    try {
      if (editingPost) {
         await updateDoc(doc(db, collectionName, editingPost.id), {
           title: newTitle,
           content: finalContent,
           tag: newTag,
           isNotice: newIsNotice,
           isRecommended: newIsRecommended,
           isEvent: newIsEvent
         });
         alert("게시글이 수정되었습니다.");
         setSelectedPost({ ...editingPost, title: newTitle, content: finalContent, tag: newTag, isNotice: newIsNotice, isRecommended: newIsRecommended, isEvent: newIsEvent });
      } else {
        const nextNumber = posts.length > 0 ? Math.max(...posts.map(p => p.number)) + 1 : 1;
        const newPostData = {
          number: nextNumber,
          title: newTitle,
          content: finalContent,
          tag: newTag,
          author: userProfile?.nickname || '익명게스트',
          createdAt: new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          views: 1,
          likes: 0,
          likedBy: [],
          isNotice: newIsNotice,
          isRecommended: newIsRecommended,
          isEvent: newIsEvent
        };
        await addDoc(collection(db, collectionName), newPostData);
        if (onQuestProgress) onQuestProgress('post');
      }

        setNewTitle('');
        setNewTag('');
        setNewContent('');
        setMedia([]); // Clear media
        setNewIsNotice(false);
        setNewIsEvent(false);
        setNewIsRecommended(false);
        setIsWriting(false);
        setEditingPost(null);
        
        // Switch to appropriate tab
        if (newIsNotice) {
          setActiveTab('notice');
        } else {
          setActiveTab('all');
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!userProfile) {
      alert("⚠️ 회원 전용 서비스입니다. 먼저 로그인 또는 회원가입을 완료한 후 추천해 주세요!");
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.likedBy?.includes(userProfile.uid)) {
      alert("이미 추천한 게시물입니다.");
      return;
    }
    
    const newLikes = post.likes + 1;
    const newLikedBy = [...(post.likedBy || []), userProfile.uid];

    try {
        await updateDoc(doc(db, collectionName, postId), {
          likes: newLikes,
          likedBy: newLikedBy,
          isRecommended: newLikes >= 10 ? true : post.isRecommended
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    // User validation - improved to directly check loginId
    console.log("DEBUG: handleDeletePost userProfile:", userProfile);
    const isOwner = userProfile?.loginId === 'sinpotnf@gmail.com';
    const isManager = userProfile?.nickname === '최고관리자';
    
    console.log("DEBUG: isOwner:", isOwner, "isManager:", isManager);
    
    if (!isOwner && !isManager) {
      alert("권한이 없습니다.");
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
        // Parse content for images
        const regex = /!\[Image\]\((https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\?]+)\)/g;
        let match;
        const imageUrls = [];
        while ((match = regex.exec(post.content)) !== null) {
            imageUrls.push(match[1]);
        }
        
        // Delete images
        for (const url of imageUrls) {
            try {
                const storageRef = ref(storage, url);
                await deleteObject(storageRef);
            } catch (e) {
                console.error("Error deleting image:", e);
            }
        }

        await deleteDoc(doc(db, collectionName, postId));
        setSelectedPost(null);
        alert("게시글이 삭제되었습니다.");
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {                
        onOpenLoginModal?.();
        return;
    }                
    if (!newCommentContent.trim()) return;

    try {
        await addDoc(collection(db, collectionName, selectedPost!.id, 'comments'), {
            postId: selectedPost!.id,
            author: userProfile.nickname,
            authorId: userProfile.uid,
            content: newCommentContent,
            createdAt: Date.now(),
            likes: 0,
            likedBy: []
        });
        if (onQuestProgress) onQuestProgress('comment');
        await updateDoc(doc(db, collectionName, selectedPost!.id), {
          commentCount: increment(1)
        });
        setNewCommentContent('');
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!userProfile) {
        onOpenLoginModal?.();
        return;
    }
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (comment.likedBy.includes(userProfile.uid)) return;

    try {
        await updateDoc(doc(db, collectionName, selectedPost!.id, 'comments', commentId), {
            likes: comment.likes + 1,
            likedBy: [...comment.likedBy, userProfile.uid]
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'comments');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    if (comment.authorId !== userProfile?.uid && userProfile?.nickname !== '최고관리자') {                
        alert("본인의 댓글만 삭제할 수 있습니다.");
        return;
    }                
    
    try {
        await deleteDoc(doc(db, collectionName, selectedPost!.id, 'comments', commentId));
        await updateDoc(doc(db, collectionName, selectedPost!.id), {
          commentCount: increment(-1)
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'comments');
    }
  }

  const handleEditComment = async (commentId: string, newContent: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    if (comment.authorId !== userProfile?.uid) {
        alert("본인의 댓글만 수정할 수 있습니다.");
        return;
    }
    
    try {
        await updateDoc(doc(db, collectionName, selectedPost!.id, 'comments', commentId), {
            content: newContent
        });
        setEditingCommentId(null);
        setEditingCommentContent('');
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'comments');
    }
  };

  const handleViewPost = async (post: CommunityPost) => {
    // Increment views
    try {
        await updateDoc(doc(db, collectionName, post.id), {
          views: post.views + 1
        });
        setSelectedPost({ ...post, views: post.views + 1 });
        window.scrollTo({ top: 350, behavior: 'smooth' });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  useEffect(() => {
    if (initialSelectedPostId && posts.length > 0) {
      const found = posts.find(p => p.id === initialSelectedPostId);
      if (found) {
        handleViewPost(found);
        if (onClearInitialSelectedPostId) {
          onClearInitialSelectedPostId();
        }
      }
    }
  }, [initialSelectedPostId, posts, onClearInitialSelectedPostId]);

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-8 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      {/* Board Title Header (Highly visible on both mobile and desktop) */}
      <div className="mx-2 md:mx-0 px-4 py-3.5 mb-4 bg-gradient-to-r from-[#141417] to-[#1a1a20] rounded-xl border border-neutral-900 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-1.5 h-4.5 bg-[#d11822] rounded-full"></div>
          <h2 className="text-sm md:text-base font-black text-white tracking-tight">
            {title === '공지사항' || boardType === 'notice' ? '공지사항' : 
             title === '유머게시판' || boardType === 'humor' ? '커뮤니티 - 유머게시판' : 
             '커뮤니티 - 자유게시판'}
          </h2>
        </div>
        <span className="text-[10px] font-black italic tracking-wide text-rose-500 bg-rose-950/25 border border-rose-900/30 px-2 py-0.5 rounded-full select-none">
          CHOICE KOREA
        </span>
      </div>
      
      {/* Intro banner styling */}
      <div className="hidden md:flex mb-6 bg-gradient-to-r from-[#171717] to-[#1d1d1d] p-6 rounded-lg border border-[#2b2b2b] shadow-xl flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <span className="text-[#d11822]">CHOICE</span>
            <span className="text-white">COMMUNITY</span>
          </h1>
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="inline-flex items-center justify-center shrink-0 w-fit px-2.5 py-1 rounded text-xs font-black bg-[#d11822]/15 text-[#d11822] border border-[#d11822]/30 uppercase tracking-wider select-none">
              {title}
            </span>
            <p className="text-xs text-gray-400 leading-relaxed">
              초이스 코리아 커뮤니티 공간에 오신것을 환영합니다. 자유로운 오라클 분석, 예측 팁 공유 및 사이다 후기를 함께 나누세요.
            </p>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="hidden md:flex mb-6 p-4 bg-[#141414] border border-dashed border-neutral-700 rounded-lg items-center justify-center">
        <span className="text-xs text-neutral-500 font-bold">AD 광고 영역</span>
      </div>

      {/* DETAILED POST READING VIEW */}
      {selectedPost && !isWriting ? (
        <div className="bg-[#141414] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden text-neutral-200 transition-all duration-300">
          
          {/* Post Header */}
          <div className="bg-[#1a1a1a] border-b border-neutral-800 px-6 py-6 md:px-8">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 mb-2">
              {selectedPost.isNotice && (
                <span className="bg-[#d11822] text-white px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap">{boardType === 'notice' ? '이벤트' : '공지'}</span>
              )}
              {selectedPost.isRecommended && (
                <span className="bg-amber-600/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap">추천</span>
              )}
              <span>No. {selectedPost.number}</span>
              <span className="text-neutral-700">|</span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDisplayDate(selectedPost)}</span>
              </span>
            </div>
            
            <h2 className="text-lg md:text-2xl font-black text-white leading-snug">
              {selectedPost.tag && <span className="text-[#0ea5e9] mr-2">{selectedPost.tag}</span>}
              {selectedPost.title}
            </h2>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-850">
              <div className="flex items-center space-x-2">
                {getUserProfileByNickname(selectedPost.author)?.profileImageUrl ? (
                  <img 
                    src={getUserProfileByNickname(selectedPost.author)!.profileImageUrl} 
                    alt="avatar" 
                    className="h-9 w-9 rounded-full object-cover border border-[#2b2b2b] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-bold text-xs uppercase shrink-0">
                    {selectedPost.author.substring(0, 2)}
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-neutral-200 flex items-center">
                    {renderMilitaryBadge(getUserProfileByNickname(selectedPost.author)?.activeBadge)}
                    <span>{selectedPost.author}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-bold">작성자 레벨인증완료</div>
                </div>
              </div>
              <div className="flex items-center space-y-0 space-x-4 text-xs font-bold text-neutral-400">
                <span className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>조회 {selectedPost.views}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4 text-rose-500" />
                  <span>추천 {selectedPost.likes}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Post Content Body */}
          <div className="px-6 py-8 md:px-8 md:py-10 text-neutral-300 text-sm md:text-base leading-relaxed whitespace-normal font-sans min-h-[250px] bg-[#111111]">
            <ContentRenderer content={selectedPost.content} />
          </div>

          {/* Comments Section */}
          <div className="bg-[#181818] border-t border-neutral-800 px-6 py-6 space-y-4">
            <h3 className="text-sm font-black text-white">댓글 {comments.length}</h3>
            
            {/* Comments List */}
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-[#1d1d1d] p-4 rounded-lg border border-neutral-700 space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 pb-1">
                      {getUserProfileByUid(comment.authorId)?.profileImageUrl ? (
                        <img 
                          src={getUserProfileByUid(comment.authorId)!.profileImageUrl} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : getUserProfileByNickname(comment.author)?.profileImageUrl ? (
                        <img 
                          src={getUserProfileByNickname(comment.author)!.profileImageUrl} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-neutral-800 text-xs flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                      )}
                      {renderMilitaryBadge(getUserProfileByUid(comment.authorId)?.activeBadge || getUserProfileByNickname(comment.author)?.activeBadge)}
                      <span className="font-bold text-neutral-200">{comment.author}</span>
                    </div>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea 
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        className="w-full bg-[#1c1c1e] text-neutral-200 text-xs p-2 rounded border border-neutral-600"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleEditComment(comment.id, editingCommentContent)} className="text-xs bg-[#22c55e] text-white px-2 py-1 rounded">저장</button>
                        <button onClick={() => setEditingCommentId(null)} className="text-xs bg-neutral-600 text-white px-2 py-1 rounded">취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-200">{comment.content}</div>
                  )}
                  <div className="flex gap-3 text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                    <button onClick={() => handleLikeComment(comment.id)} className={`hover:text-rose-500 flex items-center gap-1 ${comment.likedBy?.includes(userProfile?.uid || '') ? 'text-rose-500' : ''}`}>
                      <ThumbsUp className="h-3 w-3" /> {comment.likes}
                    </button>
                    {comment.authorId === userProfile?.uid && (
                       <>
                           <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); }} className="hover:text-white">수정</button>
                           <button onClick={() => handleDeleteComment(comment.id)} className="hover:text-rose-500">삭제</button>
                       </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-4">
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="댓글을 남겨주세요..."
                className="flex-1 bg-[#1c1c1e] border border-neutral-700 text-white text-xs p-3 rounded-lg outline-none focus:border-[#d11822]"
                rows={2}
              />
              <button type="submit" className="bg-[#d11822] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#b0141c]">등록</button>
            </form>
          </div>

          {/* Post Footer Actions */}
          <div className="bg-[#161616] border-t border-neutral-800 px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 border border-neutral-800 rounded-md text-xs font-bold text-neutral-300 bg-[#222222] hover:bg-[#2e2e2e] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>목록으로 돌아가기</span>
            </button>

            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() => handleLikePost(selectedPost.id)}
                className="flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-black shadow-md shadow-rose-600/10 transition"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>추천하기</span>
              </button>
              {(userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자' || userProfile?.nickname === selectedPost.author) && (
                <button
                  onClick={() => handleEditClick(selectedPost)}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md text-xs font-black shadow-md transition"
                >
                  <span>수정하기</span>
                </button>
              )}
              {(userProfile?.loginId === 'sinpotnf@gmail.com' || userProfile?.nickname === '최고관리자') && (
                <button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md text-xs font-black shadow-md transition"
                >
                  <span>삭제하기</span>
                </button>
              )}
            </div>
          </div>

        </div>
      ) : isWriting ? (
        /* WRITE NEW POST LAYOUT */
        <div className="bg-[#141414] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden text-neutral-200">
          <div className="bg-[#1a1a1a] border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center space-x-2">
              <Pencil className="h-4 w-4 text-[#d11822]" />
              <span>{editingPost ? '게시글 수정' : (boardType === 'notice' ? '공지사항 새 글 작성' : '커뮤니티 새 글 작성')}</span>
            </h2>
            <button 
              onClick={handleCancelWrite}
              className="text-neutral-400 hover:text-white text-xs font-bold transition"
            >
              취소하기
            </button>
          </div>

          <form onSubmit={handleSubmitPost} className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400">태그</label>
              <div className="flex flex-wrap gap-1.5">
                {['#코인', '#잡담', '#주식', '#해외주식'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewTag(newTag === tag ? '' : tag)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                      newTag === tag 
                        ? 'bg-[#d11822] text-white border-[#d11822]' 
                        : 'bg-[#1c1c1e] text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                <div className="flex items-center bg-[#1c1c1e] border border-neutral-600 rounded px-2 py-1.5 w-full sm:w-32 focus-within:border-[#d11822]">
                  <span className="text-white text-[11px] mr-1">#</span>
                  <input
                    type="text"
                    placeholder="태그"
                    value={newTag.startsWith('#') ? newTag.substring(1) : newTag}
                    onChange={(e) => {
                      setNewTag('#' + e.target.value.replace(/#/g, ''));
                    }}
                    className="bg-transparent text-[11px] text-white outline-none w-full placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400">제목</label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#1c1c1e] border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400">내용</label>
              <textarea
                placeholder="내용을 입력하세요."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                className="w-full bg-[#1c1c1e] border border-neutral-800 rounded-lg px-3 py-3 text-sm text-white outline-none resize-none"
                required
              />
              
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                {media.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {media.map((item, idx) => (
                      <div key={idx} className="relative group bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 flex items-center space-x-2">
                        {item.type === 'image' ? (
                          <span className="text-[10px] text-neutral-300 flex items-center gap-1">
                            <span className="text-emerald-500">🖼️</span> 이미지 첨부됨
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-300 flex items-center gap-1">
                            <span className="text-red-500">📺</span> 유튜브 링크됨
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setMedia(prev => prev.filter((_, i) => i !== idx))}
                          className="text-neutral-500 hover:text-rose-500 transition-colors text-xs font-black px-1"
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                 <button type="button" onClick={handleInsertImage} className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-neutral-300 py-2.5 rounded-lg text-[11px] font-bold border border-neutral-700 hover:border-neutral-500 transition-colors">
                  <ImageIcon className="h-4 w-4" /> 이미지 첨부
                </button>
                
                <div className="flex gap-2">
                   <input
                      placeholder="유튜브 링크 입력"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1 bg-[#1c1c1e] border border-neutral-800 rounded-lg px-3 py-2.5 text-[11px] text-white outline-none"
                   />
                   <button type="button" onClick={() => {
                       if (youtubeUrl) {
                          setMedia(prev => [...prev, { type: 'youtube', url: youtubeUrl }]);
                          setYoutubeUrl('');
                       }
                   }} className="bg-[#1a1a1a] text-neutral-300 px-3 py-2.5 rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors flex items-center justify-center">
                     <Youtube className="h-5 w-5 text-red-500" />
                   </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelWrite}
                className="flex-1 px-4 py-3 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-400 bg-[#222222]"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-[2] px-4 py-3 bg-[#d11822] text-white rounded-lg text-xs font-black shadow-md"
              >
                등록
              </button>
            </div>
            
            {(() => {
              const loginLower = (userProfile?.loginId || '').toLowerCase().trim();
              const nickLower = (userProfile?.nickname || '').toLowerCase().trim();
              const isAdmin = loginLower === 'sinpotnf@gmail.com' || nickLower === 'sinpotnf@gmail.com' || loginLower === 'admin' || nickLower === 'admin';
              return isAdmin && (
              <div className="flex flex-wrap items-center gap-4 bg-[#181818] p-3 rounded-lg border border-neutral-800 my-2">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newIsNotice}
                    onChange={(e) => setNewIsNotice(e.target.checked)}
                    className="rounded text-[#d11822] focus:ring-[#d11822] bg-neutral-900 border-neutral-800 h-4 w-4"
                  />
                  <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5 text-[#d11822]" />
                    공지글 지정
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newIsEvent}
                    onChange={(e) => setNewIsEvent(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 bg-neutral-900 border-neutral-800 h-4 w-4"
                  />
                  <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5 text-orange-500" />
                    이벤트 지정
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newIsRecommended}
                    onChange={(e) => setNewIsRecommended(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-800 h-4 w-4"
                  />
                  <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    추천글 지정
                  </span>
                </label>
              </div>
            );
            })()}
          </form>
        </div>
      ) : (
        /* STANDARD COMMUNITY BOARD LIST (MATCHING THE SCREENSHOT EXACTLY WITH STRIKING DARK THEME) */
        <div className="bg-[#141414] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden text-neutral-200">
          
          {/* Top Panel: Simplified for better mobile visibility */}
          <div className="hidden md:block bg-[#141414] px-4 py-3 border-b border-neutral-800">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Tabs */}
               <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'all' 
                      ? 'bg-[#d11822] text-white' 
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  전체글
                </button>
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'recommended' 
                      ? 'bg-[#d11822] text-white' 
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {boardType === 'notice' ? '공지사항' : '추천글'}
                </button>
                <button
                  onClick={() => setActiveTab('notice')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'notice' 
                      ? 'bg-[#d11822] text-white' 
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {boardType === 'notice' ? '이벤트' : '공지'}
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-1.5">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="bg-[#1c1c1e] border border-neutral-700 rounded-lg py-2 pl-2 pr-6 text-[10px] font-bold text-neutral-300 outline-none"
                  >
                    <option value="titleContext">제목+내용</option>
                    <option value="title">제목</option>
                    <option value="author">글쓴이</option>
                  </select>
                  <input
                    type="text"
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-[#1c1c1e] border border-neutral-700 rounded-lg px-2 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="bg-[#d11822] text-white p-2 rounded-lg"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
                
                {!(boardType === 'notice' && !isAdmin) && (
                  <button
                    onClick={handleWriteClick}
                    className="flex items-center justify-center p-2.5 bg-[#d11822] text-white rounded-lg shadow-md"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto hidden md:block">

            {/* Desktop Table View (Only visible on md screens and up) */}
            <table className="w-full text-left border-collapse min-w-[700px]">
              
              {/* Header Columns */}
              <thead>
                <tr className="bg-[#1a1a1a] text-neutral-300 border-b border-neutral-800 text-xs font-black">
                  {isManagementMode && <th className="py-3 px-2 w-10">선택</th>}
                  <th className="py-3 px-2 text-center w-16">번호</th>
                  <th className="py-3 px-2 text-center w-20">태그</th>
                  <th className="py-3 px-5">제목</th>
                  <th className="py-3 px-5 text-center w-32">글쓴이</th>
                  <th className="py-3 px-5 text-center w-28">작성일</th>
                  <th className="py-3 px-5 text-center w-16">조회</th>
                  <th className="py-3 px-5 text-center w-16">추천</th>
                </tr>
              </thead>

              {/* List Body */}
              <tbody className="divide-y divide-neutral-900 text-xs text-neutral-300 font-medium bg-[#121212]">
                {currentPagedPosts.length > 0 ? (
                  currentPagedPosts.map((post) => (
                    <tr 
                      key={post.id}
                      onClick={(e) => {
                        if (isManagementMode) return;
                        handleViewPost(post);
                      }}
                      className={`hover:bg-neutral-800/40 cursor-pointer transition-all ${
                        post.isNotice 
                          ? 'bg-[#261517] hover:bg-[#321a1d] font-bold border-l-4 border-l-[#d11822]' 
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      {isManagementMode && (
                        <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPostIds.includes(post.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPostIds(prev => [...prev, post.id]);
                              } else {
                                setSelectedPostIds(prev => prev.filter(id => id !== post.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-[#d11822]"
                          />
                        </td>
                      )}
                      {/* 번호 (With absolute horizontal priority constraint to guarantee alignment) */}
                      <td className="py-2.5 px-2 text-center font-bold w-16">
                        <div className="flex items-center justify-center h-5">
                          {post.isNotice ? (
                            <span 
                              id="notice-badge"
                              className="inline-flex items-center justify-center bg-[#d11822] text-white px-2.5 py-0.5 rounded text-[9.5px] font-black tracking-wider whitespace-nowrap uppercase shadow-sm shadow-[#d11822]/20"
                            >
                              {boardType === 'notice' ? '이벤트' : '공지'}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-mono">{post.number}</span>
                          )}
                        </div>
                      </td>

                      {/* 태그 */}
                      <td className="py-2.5 px-2 text-center font-bold w-20">
                        <span className="text-[#0ea5e9] text-xs font-bold whitespace-nowrap">{post.tag || '-'}</span>
                      </td>

                      {/* 제목 */}
                      <td className="py-2.5 px-5 max-w-md">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {post.isRecommended && !post.isNotice && (
                            <span className="text-amber-500 font-extrabold hover:scale-105 shrink-0">✨</span>
                          )}
                          {post.content.includes('![Image](') && (
                            <ImageIcon className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          )}
                          <span className={`hover:underline hover:text-white transition truncate ${
                            post.isNotice ? 'text-white font-extrabold' : 'text-neutral-250'
                          }`}>
                            {post.title}
                          </span>
                          <span className="text-[10px] text-[#ff7135] font-black shrink-0">
                            ({post.commentCount || 0})
                          </span>
                        </div>
                      </td>

                      {/* 글쓴이 */}
                      <td className="py-2.5 px-5 text-center font-extrabold text-neutral-200 truncate">
                        <span className="flex items-center justify-center space-x-1.5">
                          {getUserProfileByNickname(post.author)?.profileImageUrl ? (
                            <img 
                              src={getUserProfileByNickname(post.author)!.profileImageUrl} 
                              alt="avatar" 
                              className="w-6 h-6 rounded-full object-cover border border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                          )}
                          {renderMilitaryBadge(getUserProfileByNickname(post.author)?.activeBadge)}
                          <span>{post.author}</span>
                        </span>
                      </td>

                      {/* 작성일 */}
                      <td className="py-1 px-2 text-center text-neutral-450 font-bold font-mono whitespace-nowrap">
                        {formatDisplayDate(post)}
                      </td>

                      {/* 조회 */}
                      <td className="py-2.5 px-5 text-center font-bold font-mono text-neutral-350">
                        {post.views.toLocaleString()}
                      </td>

                      {/* 추천 */}
                      <td className="py-2.5 px-5 text-center font-black font-mono text-rose-500">
                        {post.likes > 0 ? `+${post.likes.toLocaleString()}` : '0'}
                      </td>
                    </tr>
                  ))
                ) : (
                  /* EMPTY STATE */
                  <tr>
                    <td colSpan={isManagementMode ? 8 : 7} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3.5">
                        <FileText className="h-10 w-10 text-neutral-600" />
                        <p className="text-neutral-500 font-black text-[13.5px]">
                          이 탭 혹은 검색 조건에 부합하는 등록된 게시글이 없습니다.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Toss Community Mobile Style Feed List View (Only visible on mobile) */}
          <div className="block md:hidden bg-black min-h-[500px] flex flex-col justify-between pb-3" id="toss-mobile-empty-redesign">
            
            {/* Feed list matching user screenshot 3 */}
            <div className="flex-1 space-y-3 p-4 pb-24 bg-black overflow-y-auto max-h-[75vh]">
              {currentPagedPosts.length > 0 ? (
                currentPagedPosts.map((post) => {
                  const isFollowed = followedUsers[post.author] || false;
                  return (
                    <div
                      key={post.id}
                      className="bg-[#16161a] border border-neutral-900 rounded-2xl p-4 flex flex-col space-y-3 transition hover:bg-[#1a1a20]"
                    >
                      {/* Top Row: Author profile info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="relative">
                            {getUserProfileByNickname(post.author)?.profileImageUrl ? (
                              <img 
                                src={getUserProfileByNickname(post.author)!.profileImageUrl} 
                                alt="avatar" 
                                className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-400 text-lg flex items-center justify-center border border-neutral-750 font-bold select-none">
                                👽
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[15px] text-neutral-100 leading-tight">
                              {post.author}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-bold mt-0.5">
                              {formatDisplayDate(post)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Block: Title & Content body */}
                      <div 
                        onClick={() => {
                          if (isManagementMode) return;
                          handleViewPost(post);
                        }}
                        className="cursor-pointer space-y-2 pt-0.5"
                      >
                        <h3 className="text-[15.5px] text-neutral-100 font-bold leading-relaxed break-all">
                          {post.title}
                        </h3>
                        
                        {(() => {
                          const cleanText = post.content.replace(/!\[Image\]\((https?:\/\/[^\)]+)\)/g, '').trim();
                          if (cleanText) {
                            return (
                              <p className="text-[14px] text-neutral-300 font-medium whitespace-pre-wrap leading-relaxed break-all">
                                {cleanText.length > 200 ? `${cleanText.substring(0, 200)}...` : cleanText}
                              </p>
                            );
                          }
                          return null;
                        })()}

                        {/* Inline Images Extraction and Display */}
                        {(() => {
                          const imgRegex = /!\[Image\]\((https?:\/\/[^\)]+)\)/g;
                          const images: string[] = [];
                          let match;
                          while ((match = imgRegex.exec(post.content)) !== null) {
                            images.push(match[1]);
                          }
                          
                          if (images.length > 0) {
                            return (
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {images.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="attachment"
                                    className="w-full max-h-[350px] object-cover rounded-xl border border-neutral-800"
                                    referrerPolicy="no-referrer"
                                  />
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Bottom Line: Social Action Bar */}
                      <div className="flex items-center justify-between pt-2.5 text-xs text-neutral-500 select-none border-t border-neutral-900">
                        <div className="flex items-center space-x-6">
                          {/* Like/Heart */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikePost(post.id).catch(console.error);
                            }}
                            className="flex items-center space-x-1.5 hover:text-rose-500 transition duration-150 py-1"
                          >
                            <Heart className={`h-[18px] w-[18px] ${post.likes > 0 ? 'text-rose-500 fill-rose-500' : 'opacity-75'}`} />
                            <span className={`text-[12px] font-bold ${post.likes > 0 ? 'text-rose-500' : ''}`}>
                              {post.likes || 0}
                            </span>
                          </button>

                          {/* Comment/Chatbubble */}
                          <button 
                            type="button"
                            onClick={() => {
                              if (isManagementMode) return;
                              handleViewPost(post);
                            }}
                            className="flex items-center space-x-1.5 hover:text-neutral-300 transition duration-150 py-1"
                          >
                            <MessageCircle className="h-[18px] w-[18px] opacity-75" />
                            <span className="text-[12px] font-bold">
                              {post.commentCount || 0}
                            </span>
                          </button>
                        </div>

                        {/* More Menu */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPost(post);
                          }}
                          className="hover:text-neutral-300 transition duration-150 py-1"
                        >
                          <MoreHorizontal className="h-4 w-4 opacity-75" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-24 text-center">
                  <span className="text-neutral-500 text-[14px] font-bold">
                    등록된 게시글이 없습니다. 첫 글을 작성해 보세요!
                  </span>
                </div>
              )}
            </div>

            {/* Dark & Fully Grounded Floating / Fixed Bottom Writer pill */}
            {!(boardType === 'notice' && !isAdmin) && (
              <div className="fixed bottom-0 left-0 right-0 z-40 pb-5 pt-3 px-4 bg-[#121212] border-t border-neutral-800 shadow-[0_-4px_24px_rgba(0,0,0,0.8)] flex items-center space-x-3 select-none">
                {userProfile?.profileImageUrl ? (
                  <img 
                    src={userProfile.profileImageUrl} 
                    alt="avatar" 
                    className="w-9 h-9 rounded-full object-cover border border-neutral-850 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-750 shadow-sm select-none shrink-0 text-md">
                    👽
                  </div>
                )}
                <div 
                  onClick={handleWriteClick}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 border border-neutral-800 text-[13.5px] py-2 px-4 rounded-full cursor-pointer transition duration-150 font-bold"
                  id="toss-mobile-composer-pill"
                >
                  무슨 생각을 하고 있나요?
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Area: Tab-controls + Search Bar + Write button & Pagination */}
          <div className="hidden md:block bg-[#161616] px-5 py-5 border-t border-neutral-800">
            
            {/* Top row: Tab indicators and Dark Write Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              
              {/* Bottom Left Tabs */}
              <div className="flex bg-[#1e1e1e] p-1 rounded-md border border-neutral-800 space-x-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 text-xs font-black rounded ${
                    activeTab === 'all' 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  전체글
                </button>
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`px-3 py-1 text-xs font-black rounded ${
                    activeTab === 'recommended' 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {boardType === 'notice' ? '공지사항' : '추천글'}
                </button>
                <button
                  onClick={() => setActiveTab('notice')}
                  className={`px-3 py-1 text-xs font-black rounded ${
                    activeTab === 'notice' 
                      ? 'bg-neutral-800 text-white border border-neutral-700' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {boardType === 'notice' ? '이벤트' : '공지'}
                </button>
              </div>

              {/* Bottom Right writer button (matching screenshot layout) */}
              {!(boardType === 'notice' && !isAdmin) && (
                <button
                  onClick={handleWriteClick}
                  className="flex items-center space-x-1 px-5 py-2.5 bg-[#d11822] hover:bg-[#b0141c] text-white rounded-md text-xs font-black shadow-md transition w-full sm:w-auto justify-center"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#ff7135] fill-[#ff7135]" />
                  <span>글쓰기</span>
                </button>
              )}

            </div>

            {/* Bottom Row: Selected Dropdown Search Box + Pagination Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3.5 border-t border-neutral-850">
              
              {/* Search Form Panel - Exact match layout */}
              <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1 w-full md:w-auto max-w-md">
                
                {/* Search Type Select dropdown */}
                <div className="relative">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="appearance-none bg-[#1c1c1e] border border-neutral-800 rounded-lg py-2.5 pl-3.5 pr-8 text-xs font-extrabold text-neutral-300 outline-none hover:border-neutral-700 focus:border-[#d11822] focus:ring-1 focus:ring-[#d11822]/20 transition cursor-pointer"
                  >
                    <option value="titleContext">제목+내용</option>
                    <option value="title">제목</option>
                    <option value="author">글쓴이</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-neutral-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                {/* Input Search text */}
                <input
                  type="text"
                  placeholder="게시판에서 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 md:w-56 bg-[#1c1c1e] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none hover:border-neutral-700 focus:border-[#d11822] focus:ring-1 focus:ring-[#d11822]/20 transition"
                />

                {/* Submit button magnifying glass */}
                <button
                  type="submit"
                  className="bg-[#d11822] hover:bg-[#b0141c] text-white px-3 py-2.5 rounded-lg border border-[#d11822] transition"
                >
                  <Search className="h-4 w-4" />
                </button>

              </form>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-3 self-center text-xs font-bold text-neutral-400">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 border border-neutral-800 rounded-lg bg-[#1a1a1a] text-neutral-400 hover:text-white disabled:opacity-30 disabled:bg-neutral-900/45 disabled:text-neutral-600 transition"
                >
                  이전
                </button>
                <div className="font-mono text-white font-extrabold px-1">
                  <span>{currentPage}</span>
                  <span className="text-neutral-600 mx-2">/</span>
                  <span>{totalPages}</span>
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-2 border border-neutral-800 rounded-lg bg-[#1a1a1a] text-neutral-400 hover:text-white disabled:opacity-30 disabled:bg-neutral-900/45 disabled:text-neutral-600 transition"
                >
                  다음
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
