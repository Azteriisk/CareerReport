"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { supabase, setSupabaseToken } from '@/lib/supabase';
import { useUser, useAuth } from '@clerk/nextjs';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface ChatPartner {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

function MessagesContent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ChatPartner[]>([]);
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function loadConversations() {
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('receiver_id, profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)')
        .eq('sender_id', user!.id);

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('sender_id, profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)')
        .eq('receiver_id', user!.id);

      const partnerMap = new Map<string, ChatPartner>();

      (sentMessages || []).forEach(msg => {
        if (msg.profiles && !Array.isArray(msg.profiles)) {
          partnerMap.set(msg.receiver_id, msg.profiles as unknown as ChatPartner);
        }
      });

      (receivedMessages || []).forEach(msg => {
        if (msg.profiles && !Array.isArray(msg.profiles)) {
          partnerMap.set(msg.sender_id, msg.profiles as unknown as ChatPartner);
        }
      });

      setConversations(Array.from(partnerMap.values()));

      // Check if we need to load a specific new partner from query params
      const toUsername = searchParams.get('to');
      if (toUsername) {
        const existing = Array.from(partnerMap.values()).find(p => p.username === toUsername);
        if (existing) {
          setActivePartner(existing);
        } else {
          // Fetch the user to start a new conversation
          const { data: newUser } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('username', toUsername)
            .single();

          if (newUser) {
            const newPartner = newUser as ChatPartner;
            setConversations(prev => [newPartner, ...prev]);
            setActivePartner(newPartner);
          }
        }
      }

      setLoadingPartners(false);
    }

    loadConversations();
  }, [user?.id, searchParams]);

  useEffect(() => {
    if (!activePartner || !user?.id) return;

    async function loadMessages() {
      setLoadingMessages(true);

      // Load message history
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${activePartner!.id}),and(sender_id.eq.${activePartner!.id},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
      }

      // Mark received messages from this partner as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user!.id)
        .eq('sender_id', activePartner!.id)
        .eq('read', false);

      setLoadingMessages(false);
      scrollToBottom();
    }

    loadMessages();

    // Subscribe to new incoming messages from this partner
    const channel = supabase.channel(`messages-${activePartner.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, payload => {
        if (payload.new.sender_id === activePartner.id) {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();

          // Mark as read instantly
          supabase.from('messages')
            .update({ read: true })
            .eq('id', payload.new.id)
            .then();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePartner, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner || !user?.id) return;

    setSending(true);
    try {
      const token = await getToken({ template: 'supabase' });
      setSupabaseToken(token);

      const payload = {
        sender_id: user.id,
        receiver_id: activePartner.id,
        content: newMessage.trim(),
      };

      const { data, error } = await supabase.from('messages').insert([payload]).select().single();

      if (!error && data) {
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded || loadingPartners) {
    return (
      <div className="flex-center" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex-center" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <MessageSquare size={48} color="var(--text-secondary)" />
        <h1 style={{ color: 'var(--text-primary)' }}>Sign In Required</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You must be signed in to view your messages.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <main style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} /> Messages
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No active conversations. Visit a user's profile to send them a message!
              </p>
            ) : (
              conversations.map(partner => (
                <div
                  key={partner.id}
                  onClick={() => setActivePartner(partner)}
                  style={{
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    background: activePartner?.id === partner.id ? 'var(--surface-highlight)' : 'transparent',
                    borderBottom: '1px solid var(--glass-border)',
                    transition: 'background 0.2s ease'
                  }}
                  className="hover-bg"
                >
                  <img
                    src={partner.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${partner.username}`}
                    alt={partner.username}
                    style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{partner.full_name || partner.username}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{partner.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
          {!activePartner ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
              <MessageSquare size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-color)' }}>
                <Link href={`/${activePartner.username}`}>
                  <img
                    src={activePartner.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${activePartner.username}`}
                    alt={activePartner.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                </Link>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{activePartner.full_name || activePartner.username}</h3>
                  <Link href={`/${activePartner.username}`} style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Messages Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 'auto', marginBottom: 'auto' }}>
                    This is the beginning of your direct message history with {activePartner.username}.
                  </p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        background: isMine ? 'var(--primary)' : 'var(--surface-highlight)',
                        color: isMine ? 'var(--bg-color)' : 'var(--text-primary)',
                        padding: '0.75rem 1rem',
                        borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                      }}>
                        <p style={{ margin: 0, lineHeight: 1.4, fontSize: '0.95rem' }}>{msg.content}</p>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', marginTop: '0.25rem', textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--surface-color)' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message @${activePartner.username}...`}
                    className="input-field"
                    style={{ flex: 1, borderRadius: '999px', paddingLeft: '1.5rem' }}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn btn-primary"
                    style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)' }}><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
