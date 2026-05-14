"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search as SearchIcon, Users, Building2, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'companies' | 'jobs' | 'posts'>('users');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, label, verified')
          .ilike('full_name', `%${query}%`)
          .limit(20);
        setResults(data || []);
      } else if (activeTab === 'companies') {
        const { data } = await supabase
          .from('business_profiles')
          .select('id, name, slug, logo_url, bio')
          .ilike('name', `%${query}%`)
          .limit(20);
        setResults(data || []);
      } else if (activeTab === 'jobs') {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, location, is_remote, salary_min, salary_max, business_profiles(name, logo_url, slug)')
          .ilike('title', `%${query}%`)
          .eq('status', 'open')
          .limit(20);
        setResults(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-color)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SearchIcon size={28} color="var(--primary)" /> Global Search
        </h1>

        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <SearchIcon size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '3rem', fontSize: '1.1rem', height: '60px', borderRadius: '12px' }}
            placeholder={`Search for ${activeTab}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '100px', padding: '0.5rem 1.25rem' }}>
            <Users size={16} /> Professionals
          </button>
          <button onClick={() => setActiveTab('companies')} className={`btn ${activeTab === 'companies' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '100px', padding: '0.5rem 1.25rem' }}>
            <Building2 size={16} /> Companies
          </button>
          <button onClick={() => setActiveTab('jobs')} className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '100px', padding: '0.5rem 1.25rem' }}>
            <Briefcase size={16} /> Jobs
          </button>
        </div>

        <div>
          {isSearching ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Searching...</p>
          ) : results.length === 0 && query.trim() !== '' ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No results found for "{query}".</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTab === 'users' && results.map(user => (
                <Link key={user.id} href={`/${user.username}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.username} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{user.full_name || user.username}</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.label || 'Member'}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {activeTab === 'companies' && results.map(comp => (
                <Link key={comp.id} href={`/co/${comp.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    {comp.logo_url ? (
                      <img src={comp.logo_url} alt={comp.name} style={{ width: '56px', height: '56px', borderRadius: '12px' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', background: 'var(--surface-highlight)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={24} color="var(--primary)" />
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{comp.name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{comp.bio}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {activeTab === 'jobs' && results.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{job.title}</h3>
                      {(job.salary_min || job.salary_max) && (
                        <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                          ${(job.salary_min/1000).toFixed(0)}k - ${(job.salary_max/1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', fontWeight: 500 }}><Building2 size={14} /> {job.business_profiles?.name}</span>
                      {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {job.location}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
