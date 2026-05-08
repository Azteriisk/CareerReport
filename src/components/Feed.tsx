"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, setSupabaseToken } from '@/lib/supabase';
import { useAuth, useUser } from '@clerk/nextjs';
import { PostCard, Post } from './PostCard';
import { PostCreator } from './PostCreator';
import { Loader2 } from 'lucide-react';

export function Feed({ targetUserId }: { targetUserId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = React.useState<Set<string>>(new Set());
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const fetchPosts = useCallback(async () => {
    try {
      // Refresh or clear the Supabase token before each fetch.
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' });
        setSupabaseToken(token);
      } else {
        setSupabaseToken(null);
      }

      let query = supabase
        .from('posts')
        .select(`
          id, content, image_url, created_at, likes_count, user_id, repost_of,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error.message, error.code, error.details);
        return;
      }

      if (!data) return;

      // Step 2: For any reposts, fetch the original post data separately
      const repostIds = data
        .filter((p: any) => p.repost_of)
        .map((p: any) => p.repost_of as string);

      let originalPostsMap: Record<string, any> = {};

      if (repostIds.length > 0) {
        const { data: originals, error: origError } = await supabase
          .from('posts')
          .select('id, content, image_url, created_at, user_id, profiles:user_id (username, full_name, avatar_url)')
          .in('id', repostIds);

        if (origError) {
          console.error("Error fetching original posts:", origError.message);
        } else if (originals) {
          originals.forEach((op: any) => {
            originalPostsMap[op.id] = {
              ...op,
              profiles: Array.isArray(op.profiles) ? op.profiles[0] : op.profiles,
            };
          });
        }
      }

      const formattedPosts: Post[] = data.map((item: any) => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        original_post: item.repost_of ? (originalPostsMap[item.repost_of] ?? null) : null,
      }));

      setPosts(formattedPosts);

      // Fetch which posts the current user has liked (for heart fill state)
      if (isSignedIn && user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        if (likes) {
          setLikedPostIds(new Set(likes.map((l: any) => l.post_id)));
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchPosts:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isSignedIn, getToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
      {!targetUserId && <PostCreator onPostCreated={fetchPosts} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--primary)' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <p>{targetUserId ? "This user hasn't posted anything yet." : "No posts yet. Be the first to share something!"}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} onRepost={fetchPosts} isLikedByUser={likedPostIds.has(post.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
