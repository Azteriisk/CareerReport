"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkFollowStatus() {
      if (!isLoaded || !isSignedIn || !user) return;
      if (user.id === targetUserId) return; // Can't follow yourself
      
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
        
      setIsFollowing(!!data);
    }
    
    checkFollowStatus();
  }, [user?.id, targetUserId, isLoaded, isSignedIn]);

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      alert("Please sign in to follow users.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
          
        if (!error) {
          setIsFollowing(false);
          if (onFollowChange) onFollowChange(false);
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert([{ follower_id: user.id, following_id: targetUserId }]);
          
        if (!error) {
          setIsFollowing(true);
          if (onFollowChange) onFollowChange(true);
        } else {
            console.error(error);
        }
      }
    } catch (err) {
      console.error("Failed to toggle follow status", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if it's the user's own profile or if still checking initial state
  if (!isLoaded || user?.id === targetUserId) return null;
  
  if (isFollowing === null) {
    return (
      <button className="btn" disabled style={{ padding: '0.5rem 1rem', opacity: 0.7, background: 'var(--surface-color)', color: 'var(--text-secondary)' }}>
        <Loader2 size={16} className="animate-spin" />
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
      style={{ 
        padding: '0.5rem 1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        opacity: isLoading ? 0.7 : 1
      }}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isFollowing ? (
        <><UserMinus size={16} /> Unfollow</>
      ) : (
        <><UserPlus size={16} /> Follow</>
      )}
    </button>
  );
}
