"use client";
import React, { useState, useEffect } from 'react';
import { X, User, Trash2, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClerk } from '@clerk/nextjs';

interface SettingsModalProps {
  user: any;
  profileData: any;
  onClose: () => void;
  onUpdate: (newData: any) => void;
}

export function SettingsModal({ user, profileData, onClose, onUpdate }: SettingsModalProps) {
  const { signOut } = useClerk();
  const [newUsername, setNewUsername] = useState(profileData?.username || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep input synced with profile data if it loads late or updates
  useEffect(() => {
    if (profileData?.username) {
      setNewUsername(profileData.username);
    }
  }, [profileData?.username]);

  const hasCustomUsername = profileData?.username_changed || (profileData?.username && !profileData.username.startsWith('user_'));

  // Debounced username check
  useEffect(() => {
    if (!newUsername || newUsername === profileData?.username) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Validate format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
        setIsAvailable(false);
        setError('3-20 characters, letters, numbers, and underscores only.');
        return;
      }

      setIsChecking(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .maybeSingle();

      setIsChecking(false);
      if (error) {
        console.error(error);
        return;
      }
      setIsAvailable(!data);
      if (data) setError('This username is already taken.');
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, profileData?.username]);

  const handleUpdateUsername = async () => {
    if (!isAvailable || isSaving) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: newUsername,
        username_changed: true
      })
      .eq('id', user.id);

    setIsSaving(false);
    if (error) {
      setError(error.message);
    } else {
      onUpdate({ ...profileData, username: newUsername, username_changed: true });
      alert('Username updated successfully!');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your resume and professional profile. This action cannot be undone. Are you sure?')) {
      return;
    }

    setIsDeleting(true);
    // 1. Delete from Supabase (resumes will cascade delete if foreign key set)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) {
      alert('Error deleting account: ' + error.message);
      setIsDeleting(false);
      return;
    }

    // 2. Sign out of Clerk
    await signOut();
    window.location.href = '/';
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 2000, 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      background: 'rgba(0,0,0,0.8)', 
      backdropFilter: 'blur(8px)',
      padding: '3rem 1rem',
      overflowY: 'auto'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        background: 'var(--surface-color)', 
        borderRadius: '20px', 
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={22} className="text-primary" /> Account Settings
          </h2>
          <button onClick={onClose} className="btn-icon"><X size={24} /></button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Username Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <User size={18} /> Profile Link Username
            </label>
            
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', flex: 1 }}>
                  <span style={{ padding: '0.75rem 0.5rem 0.75rem 1rem', opacity: 0.7, whiteSpace: 'nowrap', borderRight: '1px solid var(--glass-border)', background: 'var(--surface-color)', fontSize: '0.9rem' }}>
                    careerreport.com/u/
                  </span>
                  <input 
                    type="text" 
                    style={{ flex: 1, padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', width: '100%' }} 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                    disabled={hasCustomUsername || isSaving}
                    placeholder="your-name"
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isChecking && <><Loader2 size={14} className="animate-spin" /> Checking availability...</>}
                {isAvailable === true && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Username is available!</span>}
                {error && <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {error}</span>}
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.5 }}>
              {hasCustomUsername 
                ? "You have already claimed your username. Contact support for further changes." 
                : "Choose wisely! You can only change your profile username once."}
            </p>

            {!hasCustomUsername && (
              <button 
                onClick={handleUpdateUsername}
                disabled={!isAvailable || isSaving}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Claim Username"}
              </button>
            )}
          </div>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          {/* Danger Zone */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--error)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Permanently delete your account and all associated resumes. Your username will be released for anyone else to claim.
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="btn"
              style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Delete My Account</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
