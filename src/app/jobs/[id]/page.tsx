"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, MapPin, Globe, DollarSign, Calendar, Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function JobViewPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function loadJob() {
      setIsLoading(true);
      try {
        const { data: jobData, error: jobErr } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', params.id)
          .single();

        if (jobErr) throw jobErr;
        setJob(jobData);

        if (jobData?.business_id) {
          const { data: compData } = await supabase
            .from('business_profiles')
            .select('name, slug, logo_url')
            .eq('id', jobData.business_id)
            .single();
          if (compData) setCompany(compData);
        }
      } catch (err) {
        console.error("Error loading job:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <Briefcase size={48} color="var(--text-secondary)" opacity={0.5} />
        <h1 style={{ color: 'var(--text-primary)' }}>Job not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This listing may have been removed or closed.</p>
        <Link href="/" className="btn btn-secondary">Return Home</Link>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)', padding: '3rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <Link href={company ? `/co/${company.slug}` : '/'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to {company ? company.name : 'Listings'}
          </Link>
          
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem', color: 'var(--text-primary)' }}>{job.title}</h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {company && (
              <Link href={`/co/${company.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                ) : (
                  <Building2 size={18} color="var(--primary)" />
                )}
                {company.name}
              </Link>
            )}
            
            {job.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <MapPin size={16} /> {job.location}
              </span>
            )}
            
            {job.is_remote && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.95rem' }}>
                <Globe size={16} /> Remote
              </span>
            )}
            
            {(job.salary_min || job.salary_max) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.95rem', fontWeight: 600 }}>
                <DollarSign size={16} /> 
                {job.salary_min ? `$${(job.salary_min/1000).toFixed(0)}k` : ''} 
                {job.salary_min && job.salary_max ? ' - ' : ''} 
                {job.salary_max ? `$${(job.salary_max/1000).toFixed(0)}k` : ''}
              </span>
            )}
            
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <Calendar size={16} /> Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${hasApplied ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600 }}
              onClick={() => {
                setHasApplied(true);
                alert("Application functionality coming soon! This would send your CareerReport PDF directly to the employer.");
              }}
              disabled={hasApplied}
            >
              {hasApplied ? <><CheckCircle size={18} /> Applied</> : 'Apply with CareerReport'}
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Save Job
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: '0 0 1.5rem 0' }}>Job Description</h2>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {job.description}
        </div>
        
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Interested in this role?</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Apply instantly with your CareerReport profile.</p>
          </div>
          <button 
            className={`btn ${hasApplied ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => {
              setHasApplied(true);
              alert("Application functionality coming soon!");
            }}
            disabled={hasApplied}
          >
            {hasApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    </main>
  );
}
