"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';
import Link from 'next/link';

interface FollowUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export function FollowListModal({ isOpen, onClose, userId, type }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchUsers() {
      setLoading(true);
      try {
        if (type === 'followers') {
          // Get people who follow this user
          const { data, error } = await supabase
            .from('followers')
            .select('follower_id, profiles!followers_follower_id_fkey(id, username, full_name, avatar_url)')
            .eq('following_id', userId);
            
          if (!error && data) {
            setUsers(data.map((d: any) => d.profiles));
          }
        } else {
          // Get people this user is following
          const { data, error } = await supabase
            .from('followers')
            .select('following_id, profiles!followers_following_id_fkey(id, username, full_name, avatar_url)')
            .eq('follower_id', userId);
            
          if (!error && data) {
            setUsers(data.map((d: any) => d.profiles));
          }
        }
      } catch (err) {
        console.error("Error fetching follow list:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--surface-color)',
        borderRadius: '16px',
        width: '100%', maxWidth: '400px',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {type}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--primary)' }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem' }}>
              <p>No {type} found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {users.map((u, i) => {
                if (!u) return null; // Defensive check in case relation was null
                return (
                  <Link href={`/u/${u.username}`} key={u.id || i} style={{ textDecoration: 'none', color: 'inherit' }} onClick={onClose}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} className="hover-surface">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {u.full_name?.charAt(0) || u.username?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name || `@${u.username}`}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
