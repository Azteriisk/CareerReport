"use client";
import React, { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useUser, useAuth } from '@clerk/nextjs';
import { Repeat2, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Post } from './PostCard';
import { createNotification } from '@/lib/notifications';

export function RepostModal({ post, onClose, onReposted }: { post: Post; onClose: () => void; onReposted: () => void }) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_CHARS = 500;
  const profile = post.profiles;

  const handleRepost = async () => {
    if (!isSignedIn || !user) return;
    setIsSubmitting(true);
    try {
      const token = await getToken({ template: 'supabase' });
      

      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        content: comment.trim(),
        image_url: null,
        repost_of: post.id,
      }]);

      if (error) {
        console.error('Repost failed:', error.message);
        alert(`Failed to repost: ${error.message}`);
        return;
      }

      createNotification(post.user_id, user.id, 'repost', post.id);

      onReposted();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-color)',
          borderRadius: '20px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '540px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Repost</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        {/* Optional comment */}
        <textarea
          placeholder="Add a comment... (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={MAX_CHARS}
          disabled={isSubmitting}
          style={{
            width: '100%', minHeight: '80px', background: 'transparent',
            border: 'none', resize: 'none', color: 'var(--text-primary)',
            fontSize: '1rem', outline: 'none', fontFamily: 'inherit',
            lineHeight: 1.5, marginBottom: '0.75rem'
          }}
        />

        {/* Embedded original post preview */}
        <div style={{
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          padding: '1rem', background: 'var(--bg-color)', marginBottom: '1.25rem'
        }}>
          <Link href={`/u/${profile?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', marginBottom: '0.5rem' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
              </div>
            )}
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{profile?.full_name || profile?.username}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{profile?.username}</span>
          </Link>
          <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
          {post.image_url && (
            <img src={post.image_url} alt="" style={{ marginTop: '0.75rem', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: comment.length > MAX_CHARS - 20 ? 'var(--error)' : 'var(--text-secondary)' }}>
            {MAX_CHARS - comment.length} chars left
          </span>
          <button
            onClick={handleRepost}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', borderRadius: '999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Repeat2 size={16} />}
            Repost
          </button>
        </div>
      </div>
    </div>
  );
}
