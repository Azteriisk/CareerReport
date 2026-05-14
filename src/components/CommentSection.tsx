"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string; full_name: string; avatar_url: string };
}

export function CommentSection({ postId, postAuthorId }: { postId: string, postAuthorId: string }) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function fetchComments() {
    const { data: commentRows, error } = await supabase
      .from('comments')
      .select('id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !commentRows) { setLoading(false); return; }
    if (commentRows.length === 0) { setComments([]); setLoading(false); return; }

    // Batch-fetch profiles for all commenters
    const userIds = [...new Set(commentRows.map((c: any) => c.user_id))];
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    (profileRows || []).forEach((p: any) => { profileMap[p.id] = p; });

    setComments(commentRows.map((c: any) => ({
      ...c,
      profiles: profileMap[c.user_id] || null,
    })));
    setLoading(false);
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !isSignedIn || !user) return;
    setSubmitting(true);

    const token = await getToken({ template: 'supabase' });
    

    const { error } = await supabase.from('comments').insert([{
      post_id: postId,
      user_id: user.id,
      content: newComment.trim()
    }]);

    if (!error) {
      setNewComment('');
      createNotification(postAuthorId, user.id, 'comment', postId);
      await fetchComments();
    } else {
      console.error('Comment failed:', error.message, error.code);
      alert(`Failed to post comment: ${error.message}`);
    }
    setSubmitting(false);
  }


  async function handleDeleteComment(commentId: string) {
    const token = await getToken({ template: 'supabase' });
    
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  }

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
          <Loader2 size={18} className="animate-spin" color="var(--primary)" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Link href={`/u/${comment.profiles?.username}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '?'}
                  </div>
                )}
              </Link>
              <div style={{ flex: 1, background: 'var(--bg-color)', borderRadius: '12px', padding: '0.4rem 0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {comment.profiles?.full_name || comment.profiles?.username}
                  </span>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn-icon"
                      style={{ color: 'var(--error)', opacity: 0.6, padding: '0.1rem' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              No comments yet. Be the first!
            </p>
          )}

          {isSignedIn ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
                disabled={submitting}
                style={{
                  flex: 1, background: 'var(--bg-color)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '999px', padding: '0.45rem 1rem',
                  color: 'var(--text-primary)', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn btn-primary"
                style={{ borderRadius: '50%', width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              <Link href="/sign-in" style={{ color: 'var(--primary)' }}>Sign in</Link> to comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
