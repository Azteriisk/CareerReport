import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { Bell, Heart, MessageSquare, Repeat2, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function NotificationsDropdown() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select(`
          id, type, read, created_at, post_id,
          actor_id,
          profiles!notifications_actor_id_fkey ( username, full_name, avatar_url )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
    }

    fetchNotifications();

    // Optionally set up real-time subscription here
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user!.id}` }, payload => {
        // Optimistically update
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0 && user?.id) {
      // Mark all as read when opening
      setUnreadCount(0);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart size={16} color="var(--danger)" fill="var(--danger)" />;
      case 'comment': return <MessageSquare size={16} color="var(--primary)" />;
      case 'repost': return <Repeat2 size={16} color="var(--success)" />;
      case 'follow': return <UserPlus size={16} color="var(--text-primary)" />;
      default: return <Bell size={16} color="var(--text-secondary)" />;
    }
  };

  const getMessage = (type: string, name: string) => {
    switch(type) {
      case 'like': return <span><b>{name}</b> liked your post</span>;
      case 'comment': return <span><b>{name}</b> commented on your post</span>;
      case 'repost': return <span><b>{name}</b> reposted your update</span>;
      case 'follow': return <span><b>{name}</b> started following you</span>;
      default: return <span><b>{name}</b> interacted with you</span>;
    }
  };

  const clearAll = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          position: 'relative'
        }}
        title="Notifications"
      >
        <Bell size={22} color={isOpen ? 'var(--primary)' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '4px', 
            right: '4px', 
            background: 'var(--danger)', 
            color: 'white', 
            fontSize: '0.65rem', 
            fontWeight: 'bold', 
            width: '16px', 
            height: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderRadius: '50%' 
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '120%', 
          right: 0, 
          width: '350px', 
          maxHeight: '400px', 
          overflowY: 'auto', 
          background: 'var(--surface-color)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '12px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 2 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={clearAll} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>You're all caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map(notif => {
                const profile = notif.profiles || {};
                const name = profile.full_name || profile.username || 'Someone';
                return (
                  <Link 
                    key={notif.id} 
                    href={notif.type === 'follow' ? `/${profile.username}` : (notif.post_id ? `/#${notif.post_id}` : '/')}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="hover-bg" style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'flex-start',
                      borderBottom: '1px solid var(--glass-border)',
                      background: notif.read ? 'transparent' : 'rgba(250, 189, 47, 0.05)',
                      transition: 'background 0.2s ease'
                    }}>
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`} 
                          alt={name} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--surface-color)', borderRadius: '50%', padding: '2px' }}>
                          {getIcon(notif.type)}
                        </div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                          {getMessage(notif.type, name)}
                        </p>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
