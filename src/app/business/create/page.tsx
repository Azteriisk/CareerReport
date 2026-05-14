"use client";

import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { Building2, Briefcase, Globe, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateBusinessPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isLoaded) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Sign In Required</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You must have a personal account to create a business profile.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = await getToken({ template: 'supabase' });
      

      const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      const { data, error: insertError } = await supabase
        .from('business_profiles')
        .insert({
          owner_id: user.id,
          name,
          slug: formattedSlug,
          bio,
          website
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('This company handle is already taken.');
        }
        throw new Error(insertError.message);
      }

      router.push(`/co/${formattedSlug}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create business profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100dvh - 82px)', background: 'var(--bg-color)', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--surface-highlight)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Create a Business Profile</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Post jobs, build your employer brand, and scout talent.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Company Name</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                required 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="Acme Corp" 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Company Handle (URL)</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-highlight)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderRight: '1px solid var(--glass-border)' }}>careerreport.com/co/</span>
              <input 
                type="text" 
                required 
                className="input-field" 
                style={{ border: 'none', borderRadius: 0, flex: 1, background: 'transparent' }} 
                placeholder="acme-corp" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Website</label>
            <div style={{ position: 'relative' }}>
              <Globe size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="url" 
                className="input-field" 
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="https://acmecorp.com" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">About the Company</label>
            <textarea 
              required 
              className="input-field" 
              style={{ minHeight: '120px', resize: 'vertical' }} 
              placeholder="What does your company do?" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem', justifyContent: 'center' }}>
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Business Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
