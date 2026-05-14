"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, MapPin, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateJobPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [location, setLocation] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBusinesses() {
      if (!isSignedIn || !user) return;
      
      try {
        const token = await getToken({ template: 'supabase' });
        

        const { data, error } = await supabase
          .from('business_profiles')
          .select('id, name')
          .eq('owner_id', user.id);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setBusinesses(data);
          setSelectedBusinessId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load businesses", err);
      } finally {
        setIsLoadingBusinesses(false);
      }
    }

    if (isLoaded && isSignedIn) {
      loadBusinesses();
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingBusinesses(false);
    }
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  if (!isLoaded || isLoadingBusinesses) {
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
        <p style={{ color: 'var(--text-secondary)' }}>You must be signed in to post a job.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
        <Building2 size={48} color="var(--primary)" />
        <h1 style={{ color: 'var(--text-primary)' }}>Create a Business First</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          You must have a registered business profile on CareerReport before you can post job listings.
        </p>
        <Link href="/business/create" className="btn btn-primary">Create Business Profile</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = await getToken({ template: 'supabase' });
      

      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          business_id: selectedBusinessId,
          title,
          description,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          is_remote: isRemote,
          location,
          status: 'open'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const businessSlug = businesses.find(b => b.id === selectedBusinessId)?.slug;
      router.push(`/jobs/${data.id}`); // Or to the company profile
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to post job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100dvh - 82px)', background: 'var(--bg-color)', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(169, 182, 101, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={32} color="var(--success)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Post a New Job</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Reach thousands of top-tier professionals instantly.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Posting on behalf of</label>
            <select 
              className="input-field" 
              value={selectedBusinessId} 
              onChange={(e) => setSelectedBusinessId(e.target.value)}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Job Title</label>
            <input 
              type="text" 
              required 
              className="input-field" 
              placeholder="e.g. Senior Frontend Engineer" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="e.g. San Francisco, CA" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Work Arrangement</label>
              <div style={{ display: 'flex', alignItems: 'center', height: '46px', gap: '0.75rem', padding: '0 1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <input 
                  type="checkbox" 
                  id="is-remote" 
                  checked={isRemote} 
                  onChange={(e) => setIsRemote(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is-remote" style={{ color: 'var(--text-primary)', cursor: 'pointer', margin: 0, fontWeight: 500 }}>Fully Remote</label>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Minimum Salary (USD)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="120000" 
                  value={salaryMin} 
                  onChange={(e) => setSalaryMin(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Maximum Salary (USD)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ paddingLeft: '2.75rem' }} 
                  placeholder="180000" 
                  value={salaryMax} 
                  onChange={(e) => setSalaryMax(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Job Description & Requirements</label>
            <textarea 
              required 
              className="input-field" 
              style={{ minHeight: '200px', resize: 'vertical' }} 
              placeholder="Describe the role, responsibilities, and ideal candidate..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <div style={{ background: 'var(--surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Standard Job Listing</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Free for early adopters. Lasts 30 days.</p>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>$0.00</span>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}>
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Post Job Now'}
          </button>
        </form>
      </div>
    </main>
  );
}
