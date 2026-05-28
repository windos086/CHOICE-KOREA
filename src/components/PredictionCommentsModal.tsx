import React from 'react';
import { X, Send, Trash2, MessageSquare, Loader, Heart, Edit2, Check, RotateCcw, CornerDownRight } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { UserProfile, PredictionCard, PredictionComment, PredictionReply, BetRecord } from '../types';
import { renderMilitaryBadge } from './MilitaryBadge';

interface PredictionCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionCard: PredictionCard | null;
  userProfile: UserProfile | null;
  firebaseAvailable: boolean;
  db: any;
  onQuestProgress: (type: 'attendance' | 'post' | 'comment' | 'prediction') => Promise<void> | void;
  onOpenLoginModal?: () => void;
  allBets?: BetRecord[];
  allUsers?: UserProfile[];
}

export default function PredictionCommentsModal({
  isOpen,
  onClose,
  predictionCard,
  userProfile,
  firebaseAvailable,
  db,
  onQuestProgress,
  onOpenLoginModal,
  allBets = [],
  allUsers = []
}: PredictionCommentsModalProps) {
  const [comments, setComments] = React.useState<PredictionComment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = React.useState<string | null>(null);

  // Nested replies states
  const [replies, setReplies] = React.useState<PredictionReply[]>([]);
  const [replyInputByCommentId, setReplyInputByCommentId] = React.useState<Record<string, string>>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = React.useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = React.useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = React.useState('');
  const [deleteConfirmReplyId, setDeleteConfirmReplyId] = React.useState<string | null>(null);
  const [expandedCommentReplies, setExpandedCommentReplies] = React.useState<Record<string, boolean>>({});

  const getUserBetOption = (userId: string) => {
    if (!allBets || !predictionCard) return null;
    const found = allBets.find(b => b.userId === userId && b.predictionId === predictionCard.id);
    return found ? found.option : null;
  };

  const getUserAvatar = (userId: string) => {
    if (!allUsers) return null;
    const match = allUsers.find(u => u.uid === userId);
    return match ? match.profileImageUrl : null;
  };

  const getUserBadge = (userId: string) => {
    if (!allUsers) return null;
    const match = allUsers.find(u => u.uid === userId);
    return match ? match.activeBadge : null;
  };

  // Sort comments by hearts (likes) descending, then by createdAt ascending
  const sortedComments = React.useMemo(() => {
    return [...comments].sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      if (likesA !== likesB) {
        return likesB - likesA;
      }
      return a.createdAt - b.createdAt;
    });
  }, [comments]);

  // Load comments & replies
  React.useEffect(() => {
    if (!isOpen || !predictionCard) return;

    setLoading(true);
    let unsubscribeComments: (() => void) | null = null;
    let unsubscribeReplies: (() => void) | null = null;

    if (firebaseAvailable && db) {
      // 1. Comments listener
      const qComments = query(
        collection(db, "prediction_comments"),
        where("predictionId", "==", predictionCard.id),
        orderBy("createdAt", "asc")
      );

      unsubscribeComments = onSnapshot(qComments, (snapshot) => {
        const list: PredictionComment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PredictionComment);
        });
        setComments(list);
        setLoading(false);
      }, (error) => {
        console.error("Error loading prediction comments:", error);
        setLoading(false);
      });

      // 2. Replies listener
      const qReplies = query(
        collection(db, "prediction_replies"),
        where("predictionId", "==", predictionCard.id),
        orderBy("createdAt", "asc")
      );

      unsubscribeReplies = onSnapshot(qReplies, (snapshot) => {
        const list: PredictionReply[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as PredictionReply);
        });
        setReplies(list);
      }, (error) => {
        console.warn("Soft warning - error loading prediction replies:", error);
      });

    } else {
      // Offline / Local storage fallback for comments
      try {
        const allLocalComments: PredictionComment[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const filteredComments = allLocalComments.filter(c => c.predictionId === predictionCard.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        setComments(filteredComments);
      } catch (err) {
        console.error("Local comments parse error:", err);
      }

      // Offline / Local storage fallback for replies
      try {
        const allLocalReplies: PredictionReply[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_REPLIES') || '[]');
        const filteredReplies = allLocalReplies.filter(r => r.predictionId === predictionCard.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        setReplies(filteredReplies);
      } catch (err) {
        console.error("Local replies parse error:", err);
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeReplies) unsubscribeReplies();
    };
  }, [isOpen, predictionCard, firebaseAvailable, db]);

  if (!isOpen || !predictionCard) return null;

  const getCategoryKoreanName = (cat: string) => {
    const map: Record<string, string> = {
      politics: '정치',
      sports: '스포츠',
      esports: 'E스포츠',
      economy: '경제',
      entertainment: '연예',
      news: '뉴스',
      broadcast: '방송'
    };
    return map[cat] || cat;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      alert("로그인이 필요한 서비스입니다.");
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) return;

    const newComment = {
      predictionId: predictionCard.id,
      author: userProfile.nickname,
      authorId: userProfile.uid,
      content: trimmed,
      createdAt: Date.now(),
      likes: 0,
      likedBy: []
    };

    try {
      if (firebaseAvailable && db) {
        await addDoc(collection(db, "prediction_comments"), newComment);
      } else {
        // Local state fallback
        const allLocalComments: PredictionComment[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const createdComment: PredictionComment = {
          id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          ...newComment
        };
        const updated = [...allLocalComments, createdComment];
        localStorage.setItem('PREDICT_LOCAL_PRED_COMMENTS', JSON.stringify(updated));
        
        // Immediate UI refresh for local state
        setComments(prev => [...prev, createdComment]);
      }

      setCommentText('');
      // Trigger daily quest progress for comments
      onQuestProgress('comment');
    } catch (err) {
      console.error("Failed to add prediction comment:", err);
      alert("댓글 작성에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleUpdate = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    try {
      if (firebaseAvailable && db) {
        await updateDoc(doc(db, "prediction_comments", commentId), {
          content: trimmed
        });
      } else {
        const allLocalComments: PredictionComment[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const updated = allLocalComments.map(c => {
          if (c.id === commentId) {
            return { ...c, content: trimmed };
          }
          return c;
        });
        localStorage.setItem('PREDICT_LOCAL_PRED_COMMENTS', JSON.stringify(updated));
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: trimmed } : c));
      }
      setEditingCommentId(null);
      setEditingText('');
    } catch (err) {
      console.error("Failed to update prediction comment:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleLikeComment = async (comment: PredictionComment) => {
    if (!userProfile) {
      alert("로그인이 필요한 서비스입니다.");
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    const myUid = userProfile.uid;
    const currentLikedBy = comment.likedBy || [];
    const isLiked = currentLikedBy.includes(myUid);
    
    let nextLikedBy: string[];
    let nextLikes: number;

    if (isLiked) {
      nextLikedBy = currentLikedBy.filter(uid => uid !== myUid);
      nextLikes = Math.max(0, (comment.likes || 1) - 1);
    } else {
      nextLikedBy = [...currentLikedBy, myUid];
      nextLikes = (comment.likes || 0) + 1;
    }

    try {
      if (firebaseAvailable && db) {
        await updateDoc(doc(db, "prediction_comments", comment.id), {
          likes: nextLikes,
          likedBy: nextLikedBy
        });
      } else {
        const allLocalComments: PredictionComment[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const updated = allLocalComments.map(c => {
          if (c.id === comment.id) {
            return { ...c, likes: nextLikes, likedBy: nextLikedBy };
          }
          return c;
        });
        localStorage.setItem('PREDICT_LOCAL_PRED_COMMENTS', JSON.stringify(updated));
        
        // Immediate UI refresh for local state
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes: nextLikes, likedBy: nextLikedBy } : c));
      }
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
      alert("좋아요 반영 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      if (firebaseAvailable && db) {
        await deleteDoc(doc(db, "prediction_comments", commentId));
      } else {
        const allLocalComments: PredictionComment[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_COMMENTS') || '[]');
        const updated = allLocalComments.filter(c => c.id !== commentId);
        localStorage.setItem('PREDICT_LOCAL_PRED_COMMENTS', JSON.stringify(updated));
        
        // Immediate UI refresh for local state
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
      setDeleteConfirmCommentId(null);
    } catch (err) {
      console.error("Failed to delete prediction comment:", err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  // Submit new reply
  const handleSubmitReply = async (commentId: string) => {
    if (!userProfile) {
      alert("로그인이 필요한 서비스입니다.");
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    const text = replyInputByCommentId[commentId] || '';
    const trimmed = text.trim();
    if (!trimmed) return;

    const newReply = {
      commentId,
      predictionId: predictionCard.id,
      author: userProfile.nickname,
      authorId: userProfile.uid,
      content: trimmed,
      createdAt: Date.now()
    };

    try {
      if (firebaseAvailable && db) {
        await addDoc(collection(db, "prediction_replies"), newReply);
      } else {
        const allLocalReplies: PredictionReply[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_REPLIES') || '[]');
        const createdReply: PredictionReply = {
          id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          ...newReply
        };
        const updated = [...allLocalReplies, createdReply];
        localStorage.setItem('PREDICT_LOCAL_PRED_REPLIES', JSON.stringify(updated));
        setReplies(prev => [...prev, createdReply]);
      }

      setReplyInputByCommentId(prev => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId(null);
      onQuestProgress('comment');
    } catch (err) {
      console.error("Failed to add prediction reply:", err);
      alert("답글 작성에 실패했습니다.");
    }
  };

  // Update reply
  const handleUpdateReply = async (replyId: string) => {
    const trimmed = editingReplyText.trim();
    if (!trimmed) return;

    try {
      if (firebaseAvailable && db) {
        await updateDoc(doc(db, "prediction_replies", replyId), {
          content: trimmed
        });
      } else {
        const allLocalReplies: PredictionReply[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_REPLIES') || '[]');
        const updated = allLocalReplies.map(r => {
          if (r.id === replyId) {
            return { ...r, content: trimmed };
          }
          return r;
        });
        localStorage.setItem('PREDICT_LOCAL_PRED_REPLIES', JSON.stringify(updated));
        setReplies(prev => prev.map(r => r.id === replyId ? { ...r, content: trimmed } : r));
      }
      setEditingReplyId(null);
      setEditingReplyText('');
    } catch (err) {
      console.error("Failed to update prediction reply:", err);
      alert("답글 수정 중 오류가 발생했습니다.");
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId: string) => {
    try {
      if (firebaseAvailable && db) {
        await deleteDoc(doc(db, "prediction_replies", replyId));
      } else {
        const allLocalReplies: PredictionReply[] = JSON.parse(localStorage.getItem('PREDICT_LOCAL_PRED_REPLIES') || '[]');
        const updated = allLocalReplies.filter(r => r.id !== replyId);
        localStorage.setItem('PREDICT_LOCAL_PRED_REPLIES', JSON.stringify(updated));
        setReplies(prev => prev.filter(r => r.id !== replyId));
      }
      setDeleteConfirmReplyId(null);
    } catch (err) {
      console.error("Failed to delete prediction reply:", err);
      alert("답글 삭제 중 오류가 발생했습니다.");
    }
  };

  const isAdmin = userProfile?.nickname === '최고관리자' || userProfile?.loginId === 'sinpotnf@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181c] border border-neutral-800 rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start p-5 border-b border-neutral-800 bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-orange-400 font-bold uppercase tracking-wider">PREDICTION DISCUSSION</div>
              <h3 className="text-sm md:text-base font-extrabold text-white line-clamp-1">
                {predictionCard.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Info Row */}
        <div className="bg-neutral-900/60 px-5 py-2.5 text-xs text-neutral-400 border-b border-neutral-850 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>참여 카테고리: <strong className="text-neutral-200">{getCategoryKoreanName(predictionCard.category)}</strong></span>
            <span className="text-neutral-700 font-normal">|</span>
            <span>작성 시간: <strong className="text-neutral-200">{new Date(predictionCard.createdAt).toLocaleDateString()}</strong></span>
          </div>
          <span className="text-orange-400 font-bold">댓글 {comments.length}개</span>
        </div>

        {/* Comments Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px] bg-[#141416]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-3">
              <Loader className="w-7 h-7 animate-spin text-orange-500" />
              <span className="text-xs">댓글을 읽어오는 중입니다...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-neutral-500 gap-2">
              <MessageSquare className="w-10 h-10 stroke-[1.5] text-neutral-600 mb-1" />
              <p className="text-xs font-semibold">아직 작성된 댓글이 없습니다.</p>
              <p className="text-[11px] text-neutral-600">첫 번째 의견을 아래에 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedComments.map((comment) => {
                const isAuthor = userProfile && userProfile.uid === comment.authorId;
                const canDelete = isAuthor || isAdmin;
                const isEditing = editingCommentId === comment.id;
                const hasLiked = userProfile && (comment.likedBy || []).includes(userProfile.uid);
                const commentReplies = replies.filter(r => r.commentId === comment.id);
                const isRepliesExpanded = !!expandedCommentReplies[comment.id];
                const visibleReplies = isRepliesExpanded ? commentReplies : commentReplies.slice(0, 2);

                return (
                  <div 
                    key={comment.id} 
                    className="p-4 bg-[#1e1e24] border border-neutral-800/80 rounded-xl space-y-2.5 hover:border-neutral-700/60 transition-colors"
                  >
                    <div className="flex justify-between items-center bg-transparent">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getUserAvatar(comment.authorId) ? (
                          <img 
                            src={getUserAvatar(comment.authorId) || undefined} 
                            alt="avatar" 
                            className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-neutral-800 text-sm flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                        )}
                        {renderMilitaryBadge(getUserBadge(comment.authorId), "shrink-0")}
                        <span className="text-xs font-extrabold text-neutral-200">
                          {comment.author}
                        </span>
                        {comment.author === '최고관리자' && (
                          <span className="bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            ADMIN
                          </span>
                        )}
                        {getUserBetOption(comment.authorId) && (
                          <span className="bg-orange-500/15 text-orange-400 font-bold px-1.5 py-0.5 rounded text-[9px] border border-orange-500/30">
                            {getUserBetOption(comment.authorId)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        
                        {/* 수정 버튼 */}
                        {isAuthor && !isEditing && (
                          <button 
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingText(comment.content);
                            }}
                            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-orange-500 transition cursor-pointer flex items-center justify-center"
                            title="댓글 수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 삭제 버튼 */}
                        {canDelete && !isEditing && (
                          <button 
                            onClick={() => setDeleteConfirmCommentId(comment.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-neutral-500 hover:text-red-500 transition cursor-pointer flex items-center justify-center"
                            title="댓글 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-[#141416] border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                          rows={2}
                          maxLength={300}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingText('');
                            }}
                            className="px-2.5 py-1 text-[11px] bg-neutral-800 text-neutral-400 rounded hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> 취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(comment.id)}
                            className="px-2.5 py-1 text-[11px] bg-orange-500 text-black hover:bg-orange-600 font-bold rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> 저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-left">
                        <p className="text-xs text-neutral-300 leading-relaxed break-keep break-all whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        
                        {/* Action buttons (likes + replies) */}
                        <div className="flex items-center gap-4 mt-2 bg-transparent text-neutral-500">
                          {deleteConfirmCommentId === comment.id ? (
                            <div className="bg-red-950/20 border border-red-900/35 rounded-lg p-2.5 flex items-center justify-between gap-2 animate-fade-in font-sans w-full">
                              <span className="text-[11px] text-red-400 font-semibold">❓ 정말 이 댓글을 삭제하시겠습니까?</span>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCommentId(null)}
                                  className="px-2 py-0.5 text-[10px] bg-neutral-800 text-neutral-400 rounded hover:text-white cursor-pointer"
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(comment.id)}
                                  className="px-2 py-0.5 text-[10px] bg-red-650 hover:bg-red-550 text-white font-bold rounded cursor-pointer"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* 하트(좋아요) 버튼 */}
                              <button
                                type="button"
                                onClick={() => handleLikeComment(comment)}
                                className={`flex items-center gap-1.5 text-[11px] transition duration-200 cursor-pointer ${
                                  hasLiked 
                                    ? 'text-rose-500 font-bold hover:brightness-110' 
                                    : 'text-neutral-500 hover:text-rose-400'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                <span>{comment.likes || 0}</span>
                              </button>

                              {/* 답글 버튼 */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeReplyCommentId === comment.id) {
                                    setActiveReplyCommentId(null);
                                  } else {
                                    setActiveReplyCommentId(comment.id);
                                    setReplyInputByCommentId(prev => ({ ...prev, [comment.id]: '' }));
                                  }
                                }}
                                className={`flex items-center gap-1.5 text-[11px] transition duration-200 cursor-pointer ${
                                  activeReplyCommentId === comment.id
                                    ? 'text-orange-400 font-bold'
                                    : 'text-neutral-500 hover:text-orange-400'
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>답글 {commentReplies.length}</span>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Active Reply Writing Box */}
                        {activeReplyCommentId === comment.id && (
                          <div className="mt-3 pl-4 border-l-2 border-orange-500/40 space-y-2 animate-fade-in bg-transparent text-left">
                            <div className="flex items-start gap-1.5">
                              <CornerDownRight className="w-4 h-4 text-orange-500/60 mt-2.5 shrink-0" />
                              <div className="flex-1 space-y-2">
                                <textarea
                                  value={replyInputByCommentId[comment.id] || ''}
                                  onChange={(e) => setReplyInputByCommentId(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  placeholder={userProfile ? "답글을 작성해 주세요..." : "답글 작성을 위해 먼저 로그인을 해주세요."}
                                  disabled={!userProfile}
                                  className="w-full bg-[#141416] border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-neutral-500 font-sans"
                                  rows={2}
                                  maxLength={300}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveReplyCommentId(null)}
                                    className="px-2.5 py-1 text-[10px] bg-neutral-800 text-neutral-400 rounded hover:text-white cursor-pointer"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyInputByCommentId[comment.id]?.trim()}
                                    className="px-2.5 py-1 text-[10px] bg-orange-500 text-black font-extrabold hover:bg-orange-600 disabled:bg-[#1a1a22] disabled:text-neutral-600 rounded cursor-pointer transition-all"
                                  >
                                    답글 등록
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Existing Replies Threads */}
                        {commentReplies.length > 0 && (
                          <div className="mt-3 pl-4 border-l border-neutral-800/85 space-y-2 bg-transparent text-left flex flex-col">
                            {visibleReplies.map((reply) => {
                              const isReplyAuthor = userProfile && userProfile.uid === reply.authorId;
                              const canDeleteReply = isReplyAuthor || isAdmin;
                              const isEditingReply = editingReplyId === reply.id;

                              return (
                                <div 
                                  key={reply.id} 
                                  className="p-3 bg-neutral-900/40 rounded-lg space-y-2 border border-neutral-850/45 hover:border-neutral-850/80 transition-colors text-left"
                                >
                                  <div className="flex justify-between items-center bg-transparent">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <CornerDownRight className="w-3 h-3 text-neutral-650 shrink-0" />
                                      {getUserAvatar(reply.authorId) ? (
                                        <img 
                                          src={getUserAvatar(reply.authorId) || undefined} 
                                          alt="avatar" 
                                          className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className="w-7 h-7 rounded-full bg-neutral-800 text-xs flex items-center justify-center border border-neutral-700 shrink-0 select-none">👤</span>
                                      )}
                                      {renderMilitaryBadge(getUserBadge(reply.authorId), "shrink-0")}
                                      <span className="text-[11px] font-bold text-neutral-300">
                                        {reply.author}
                                      </span>
                                      {reply.author === '최고관리자' && (
                                        <span className="bg-red-500/10 text-red-400 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wide">
                                          ADMIN
                                        </span>
                                      )}
                                      {getUserBetOption(reply.authorId) && (
                                        <span className="bg-orange-500/15 text-orange-400 font-bold px-1.5 py-0.2 rounded text-[8px] border border-orange-500/30">
                                          {getUserBetOption(reply.authorId)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-neutral-500">
                                        {new Date(reply.createdAt).toLocaleString()}
                                      </span>

                                      {/* Edit Reply */}
                                      {isReplyAuthor && !isEditingReply && (
                                        <button 
                                          onClick={() => {
                                            setEditingReplyId(reply.id);
                                            setEditingReplyText(reply.content);
                                          }}
                                          className="p-0.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-orange-500 transition cursor-pointer flex items-center justify-center"
                                          title="답글 수정"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                      )}

                                      {/* Delete Reply */}
                                      {canDeleteReply && !isEditingReply && (
                                        <button 
                                          onClick={() => setDeleteConfirmReplyId(reply.id)}
                                          className="p-0.5 hover:bg-red-500/10 rounded text-neutral-500 hover:text-red-500 transition cursor-pointer flex items-center justify-center"
                                          title="답글 삭제"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {isEditingReply ? (
                                    <div className="space-y-1.5 mt-1">
                                      <textarea
                                        value={editingReplyText}
                                        onChange={(e) => setEditingReplyText(e.target.value)}
                                        className="w-full bg-[#141416] border border-neutral-800 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-orange-500 font-sans"
                                        rows={2}
                                        maxLength={300}
                                      />
                                      <div className="flex justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingReplyId(null);
                                            setEditingReplyText('');
                                          }}
                                          className="px-2 py-0.5 text-[9px] bg-neutral-800 text-neutral-400 rounded hover:text-white flex items-center gap-0.5 cursor-pointer"
                                        >
                                          취소
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateReply(reply.id)}
                                          className="px-2 py-0.5 text-[9px] bg-orange-500 text-black hover:bg-orange-600 font-bold rounded flex items-center gap-0.5 cursor-pointer"
                                        >
                                          저장
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap break-all pl-3 text-left">
                                        {reply.content}
                                      </p>

                                      {deleteConfirmReplyId === reply.id && (
                                        <div className="bg-red-950/20 border border-red-900/35 rounded-lg p-2 flex items-center justify-between gap-1.5 animate-fade-in mt-1 font-sans">
                                          <span className="text-[10px] text-red-400 font-semibold pl-3">❓ 정말 이 답글을 삭제하시겠습니까?</span>
                                          <div className="flex gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setDeleteConfirmReplyId(null)}
                                              className="px-1.5 py-0.5 text-[9px] bg-neutral-800 text-neutral-400 rounded hover:text-white cursor-pointer"
                                            >
                                              취소
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteReply(reply.id)}
                                              className="px-2 py-0.5 text-[9px] bg-red-650 hover:bg-red-550 text-white font-bold rounded cursor-pointer"
                                            >
                                              삭제
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {commentReplies.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedCommentReplies(prev => ({
                                    ...prev,
                                    [comment.id]: !prev[comment.id]
                                  }));
                                }}
                                className="text-[10px] text-orange-400 font-extrabold hover:text-orange-500 cursor-pointer flex items-center gap-1 mt-1 pb-1 self-start transition-colors"
                              >
                                {isRepliesExpanded ? (
                                  <span>답글 접기 ▲</span>
                                ) : (
                                  <span>답글 {commentReplies.length - 2}개 더보기 ▼</span>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-[#121214] flex gap-2 items-center">
          <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={userProfile ? "여기에 의견을 작성해 주세요..." : "댓글 작성을 위해 먼저 로그인을 해주세요."}
            disabled={!userProfile}
            className="flex-1 bg-[#1a1a1f] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-all font-sans"
            maxLength={300}
          />
          <button 
            type="submit" 
            disabled={!userProfile || !commentText.trim()}
            className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 rounded-xl text-black font-bold transition-all shrink-0 active:scale-95 hover:scale-[1.03] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>

      </div>
    </div>
  );
}
