"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Globe, MapPin, Users, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      setIsLoading(true);
      try {
        // Fetch company profile
        const { data: comp, error: compErr } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('slug', params.slug)
          .single();

        if (compErr) throw compErr;
        setCompany(comp);

        // Fetch active jobs
        const { data: jobList } = await supabase
          .from('jobs')
          .select('*')
          .eq('business_id', comp.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false });
          
        if (jobList) setJobs(jobList);

        // Fetch employees
        const { data: empList } = await supabase
          .from('company_employees')
          .select('user_id, profiles(username, full_name, avatar_url, label)')
          .eq('business_id', comp.id)
          .eq('status', 'approved');
          
        if (empList) setEmployees(empList);

        // Check if current user has already requested
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: existingReq } = await supabase
            .from('company_employees')
            .select('status')
            .eq('business_id', comp.id)
            .eq('user_id', session.user.id)
            .single();
          if (existingReq) setHasRequested(true);
        }

      } catch (err) {
        console.error("Error loading company:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompany();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading company profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <Building2 size={48} color="var(--text-secondary)" opacity={0.5} />
        <h1 style={{ color: 'var(--text-primary)' }}>Company not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This business profile does not exist.</p>
        <Link href="/" className="btn btn-secondary">Return Home</Link>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
      {/* Hero Header */}
      <div style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)', padding: '4rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Building2 size={48} color="var(--primary)" />
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', color: 'var(--text-primary)' }}>{company.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 1.5rem 0', maxWidth: '600px', lineHeight: 1.6 }}>{company.bio}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
                  <Globe size={16} /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Users size={16} /> {employees.length} Employees
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> Joined {new Date(company.created_at).getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Jobs Section */}
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={24} color="var(--primary)" /> Open Positions
          </h2>
          
          {jobs.length === 0 ? (
            <div style={{ background: 'var(--surface-color)', border: '1px dashed var(--glass-border)', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>There are no open positions at {company.name} right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg" style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>{job.title}</h3>
                      {job.salary_min && job.salary_max && (
                        <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', background: 'rgba(169, 182, 101, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                          ${(job.salary_min/1000).toFixed(0)}k - ${(job.salary_max/1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 1.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {job.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <MapPin size={14} /> {job.location}
                        </span>
                      )}
                      {job.is_remote && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                          <Globe size={14} /> Remote
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Calendar size={14} /> Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Employees Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={20} color="var(--primary)" /> Team
            </h2>
            <button 
              onClick={async () => {
                if (hasRequested) return;
                setIsRequesting(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                  alert("Please sign in to claim your employee profile.");
                  setIsRequesting(false);
                  return;
                }
                const { error } = await supabase.from('company_employees').insert({
                  business_id: company.id,
                  user_id: session.user.id
                });
                if (!error) setHasRequested(true);
                setIsRequesting(false);
              }}
              disabled={isRequesting || hasRequested}
              className={`btn ${hasRequested ? 'btn-secondary' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              {hasRequested ? 'Request Pending' : 'I work here'}
            </button>
          </div>
          
          {employees.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No public employees listed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {employees.map(emp => (
                <Link key={emp.user_id} href={`/${emp.profiles.username}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-bg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <img 
                      src={emp.profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.profiles.username}`} 
                      alt={emp.profiles.username}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--glass-border)' }}
                    />
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{emp.profiles.full_name || emp.profiles.username}</h4>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{emp.profiles.label || 'Team Member'}</p>
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
