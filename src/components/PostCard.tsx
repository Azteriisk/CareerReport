"use client";
import React from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, Repeat2, MoreHorizontal, Trash2, Loader2, X as CloseIcon } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { RepostModal } from './RepostModal';
import { CommentSection } from './CommentSection';
import { createNotification } from '@/lib/notifications';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  repost_of?: string | null;
  original_post?: Post | null;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function EmbeddedPost({ post }: { post: Post }) {
  const profile = post.profiles;
  return (
    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.85rem', background: 'var(--bg-color)', marginBottom: '0.75rem' }}>
      <Link href={`/u/${profile?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', marginBottom: '0.4rem' }}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontWeight: 'bold', fontSize: '0.75rem' }}>
            {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
          </div>
        )}
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{profile?.full_name || profile?.username}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{profile?.username}</span>
      </Link>
      {post.content && (
        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</p>
      )}
      {post.image_url && (
        <img src={post.image_url} alt="Attached" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
      )}
    </div>
  );
}

export function PostCard({ post, onDelete, onRepost, isLikedByUser = false }: {
  post: Post;
  onDelete?: (id: string) => void;
  onRepost?: () => void;
  isLikedByUser?: boolean;
}) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const profile = post.profiles;
  const isOwner = user?.id === post.user_id;
  const isRepost = !!post.repost_of;

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [repostModalOpen, setRepostModalOpen] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [liked, setLiked] = React.useState(isLikedByUser);
  const [likeCount, setLikeCount] = React.useState(post.likes_count || 0);
  const [likeLoading, setLikeLoading] = React.useState(false);

  const [commentsCount, setCommentsCount] = React.useState(0);
  const [repostsCount, setRepostsCount] = React.useState(0);
  const [previewComments, setPreviewComments] = React.useState<any[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        // 1. Fetch comments count
        const { count: commCount, error: commError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (!commError && commCount !== null && isMounted) {
          setCommentsCount(commCount);
        }

        // 2. Fetch reposts count
        const { count: repCount, error: repError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('repost_of', post.id);

        if (!repError && repCount !== null && isMounted) {
          setRepostsCount(repCount);
        }
      } catch (err) {
        console.error('Error fetching post counts:', err);
      }
    }
    loadMetrics();
    return () => { isMounted = false; };
  }, [post.id]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      try {
        const { data: prevComments, error: prevError } = await supabase
          .from('comments')
          .select('id, user_id, content, created_at')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (!prevError && prevComments && isMounted) {
          const userIds = [...new Set(prevComments.map((c: any) => c.user_id))];
          let profileMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .in('id', userIds);
            (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
          }
          const formatted = prevComments.map((c: any) => ({
            ...c,
            profiles: profileMap[c.user_id] || null
          })).reverse();
          setPreviewComments(formatted);
        }
      } catch (err) {
        console.error('Error fetching previews:', err);
      }
    }
    loadPreviews();
    return () => { isMounted = false; };
  }, [post.id, commentsCount]);

  const handleDelete = async () => {
    if (!confirmDelete) {
      // First click: arm the button
      setConfirmDelete(true);
      // Auto-disarm after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    // Second click: actually delete
    setIsDeleting(true);
    setConfirmDelete(false);
    try {
      const token = await getToken({ template: 'supabase' });
      

      if (post.image_url) {
        const fileName = post.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('post-images').remove([`public/${fileName}`]);
        }
      }
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) {
        console.error('Delete failed:', error.message);
        alert(`Failed to delete: ${error.message}`);
        setIsDeleting(false);
        return;
      }
      if (onDelete) onDelete(post.id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!isSignedIn || isOwner || likeLoading) return;
    setLikeLoading(true);

    const token = await getToken({ template: 'supabase' });
    

    if (liked) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user!.id);

      if (!error) {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        // Sync the count column
        await supabase.from('posts').update({ likes_count: Math.max(0, likeCount - 1) }).eq('id', post.id);
      }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: post.id, user_id: user!.id }]);

      if (!error) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
        await supabase.from('posts').update({ likes_count: likeCount + 1 }).eq('id', post.id);
        createNotification(post.user_id, user!.id, 'like', post.id);
      } else {
        console.error('Like failed:', error.message);
      }
    }
    setLikeLoading(false);
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && post.image_url && (
        <div onClick={() => setLightboxOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <button onClick={() => setLightboxOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <CloseIcon size={22} />
          </button>
          <img src={post.image_url} alt="Full view" onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'default' }} />
        </div>
      )}

      {/* Repost Modal */}
      {repostModalOpen && (
        <RepostModal post={post} onClose={() => setRepostModalOpen(false)} onReposted={() => { if (onRepost) onRepost(); }} />
      )}

      {/* Post Card */}
      <div className="post-card-container" style={{ background: 'var(--surface-color)', borderRadius: '16px', marginBottom: '1rem', border: '1px solid var(--glass-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>

        {/* Repost attribution */}
        {isRepost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem', paddingLeft: '4px' }}>
            <Repeat2 size={14} />
            <span>{profile?.full_name || profile?.username} reposted</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href={`/u/${profile?.username}`} style={{ display: 'flex', gap: '0.75rem', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontWeight: 'bold', flexShrink: 0 }}>
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.full_name || profile?.username}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{profile?.username}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>·</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{timeAgo(post.created_at)}</span>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-icon"
                style={{
                  color: (confirmDelete || isDeleting) ? 'var(--error)' : 'var(--text-secondary)',
                  opacity: isDeleting ? 0.5 : 1,
                  background: confirmDelete ? 'rgba(251, 73, 52, 0.15)' : 'transparent',
                  outline: confirmDelete ? '1px solid var(--error)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete Post'}
              >
                {isDeleting
                  ? <Loader2 size={18} className="animate-spin" />
                  : confirmDelete
                    ? <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--error)', whiteSpace: 'nowrap' }}>Delete?</span>
                    : <Trash2 size={18} />}
              </button>
            )}
            <button className="btn-icon"><MoreHorizontal size={18} /></button>
          </div>
        </div>

        {/* Content */}
        <div style={{ paddingLeft: '56px', marginTop: '0.35rem' }}>
          {post.content && (
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 0.75rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.content}
            </p>
          )}

          {post.image_url && !isRepost && (
            <div onClick={() => setLightboxOpen(true)} style={{ marginBottom: '0.75rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', cursor: 'zoom-in' }}>
              <img src={post.image_url} alt="Post attachment" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block', transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
            </div>
          )}

          {isRepost && post.original_post && <EmbeddedPost post={post.original_post} />}

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
            {/* Comments */}
            <button
              className="btn-icon"
              onClick={() => setShowComments(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: showComments ? 'var(--primary)' : 'var(--text-secondary)' }}
            >
              <MessageSquare size={18} />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>

            {/* Likes — disabled for own posts */}
            <button
              className="btn-icon"
              onClick={handleLike}
              disabled={likeLoading || isOwner || !isSignedIn}
              title={isOwner ? "You can't like your own post" : liked ? "Unlike" : "Like"}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                color: liked ? '#e0245e' : 'var(--text-secondary)',
                opacity: (isOwner || !isSignedIn) ? 0.4 : 1,
                cursor: (isOwner || !isSignedIn) ? 'not-allowed' : 'pointer'
              }}
            >
              <Heart size={18} fill={liked ? '#e0245e' : 'none'} stroke={liked ? '#e0245e' : 'currentColor'} />
              <span>{likeCount}</span>
            </button>

            {/* Repost */}
            <button
              className="btn-icon"
              onClick={() => isSignedIn && setRepostModalOpen(true)}
              title={isSignedIn ? 'Repost' : 'Sign in to repost'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                opacity: !isSignedIn ? 0.4 : 1,
                color: repostsCount > 0 ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              <Repeat2 size={18} />
              {repostsCount > 0 && <span>{repostsCount}</span>}
            </button>
          </div>

          {/* Thread Preview (when showComments is false) */}
          {!showComments && previewComments.length > 0 && (
            <div style={{
              marginTop: '0.85rem',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              opacity: 0.9,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                  Recent Activity ({commentsCount})
                </span>
                <button
                  onClick={() => setShowComments(true)}
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  View All
                </button>
              </div>
              {previewComments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Link href={`/u/${comment.profiles?.username}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontWeight: 'bold', fontSize: '0.65rem' }}>
                        {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '?'}
                      </div>
                    )}
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comment.profiles?.full_name || comment.profiles?.username}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                        @{comment.profiles?.username}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Section (toggles in/out) */}
          {showComments && (
            <CommentSection 
              postId={post.id} 
              postAuthorId={post.user_id} 
              onCommentCountChange={(count) => setCommentsCount(count)}
            />
          )}
        </div>
      </div>
    </>
  );
}
