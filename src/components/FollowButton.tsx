"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { createNotification } from '@/lib/notifications';
import { UpgradeModal } from '@/components/UpgradeModal';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    async function checkFollowStatus() {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        setIsFollowing(false);
        return;
      }

      if (user.id === targetUserId) return;

      const { data, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Failed to check follow status:', error);
        setIsFollowing(false);
        return;
      }

      setIsFollowing(!!data);
    }

    checkFollowStatus();
  }, [user?.id, targetUserId, isLoaded, isSignedIn]);

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
  };

  const handleToggleFollow = async () => {
    if (!isSignedIn || !user) return;

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
          createNotification(targetUserId, user.id, 'follow');
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

  if (!isLoaded || user?.id === targetUserId) return null;

  if (!isSignedIn) {
    return (
      <>
        <button
          type="button"
          className="btn btn-primary"
          style={buttonStyle}
          onClick={() => setAuthModalOpen(true)}
        >
          <UserPlus size={16} /> Follow
        </button>
        <UpgradeModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          featureName="follow people, message professionals, and build your network"
          guestBenefits={[
            'Follow professionals and stay updated on their careers',
            'Send direct messages through CareerReport',
            'Create a free public resume profile',
          ]}
        />
      </>
    );
  }

  // Brief spinner only while resolving follow state for a signed-in viewer
  if (isFollowing === null) {
    return (
      <button
        className="btn"
        disabled
        aria-label="Loading follow status"
        style={{
          padding: '0.5rem 1rem',
          opacity: 0.7,
          background: 'var(--surface-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <Loader2 size={16} className="animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
      style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
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
