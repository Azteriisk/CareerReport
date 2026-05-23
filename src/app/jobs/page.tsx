"use client";
import Link from 'next/link';
import { Search, MapPin, Building, BadgeCheck, Filter, Loader2, Sparkles, Briefcase, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return 'just now';
}

export default function JobsBoardPage() {
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const { data: dbJobs, error } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            salary_min,
            salary_max,
            is_remote,
            location,
            created_at,
            status,
            business_profiles (
              name,
              logo_url,
              slug
            )
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbJobs) {
          const formatted = dbJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.business_profiles?.name || 'Unknown Company',
            verified: true,
            location: j.location || (j.is_remote ? 'Remote' : 'On-site'),
            salary: j.salary_min || j.salary_max
              ? `${j.salary_min ? `$${(j.salary_min / 1000).toFixed(0)}k` : ''} - ${j.salary_max ? `$${(j.salary_max / 1000).toFixed(0)}k` : ''}`
              : 'Competitive',
            type: j.is_remote ? 'Remote' : 'Full-time',
            posted: formatTimeAgo(new Date(j.created_at)),
            logo: j.business_profiles?.name?.charAt(0) || 'J',
            logoUrl: j.business_profiles?.logo_url,
            isReal: true
          }));
          setJobs(formatted);
        }
      } catch (err) {
        console.error("Error loading real jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, []);

  return (
    <div className="landing-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Discover Opportunities</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Apply with your CareerReport profile in one click.</p>
        </div>

        <div className="jobs-search-row" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <Search size={20} color="var(--text-secondary)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search by job title, company, or keywords..." 
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '1rem', color: 'var(--text-primary)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
            <Filter size={18} /> Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex-center" style={{ padding: '3rem 0' }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : jobs.length === 0 ? (
          /* Premium Empty State Card */
          <div style={{ 
            background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
            borderRadius: '20px', 
            border: '1px solid var(--glass-border)', 
            padding: '3.5rem 2rem', 
            textAlign: 'center',
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
            maxWidth: '650px',
            margin: '2rem auto 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'rgba(250, 189, 47, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(250, 189, 47, 0.25)',
              boxShadow: '0 0 30px rgba(250, 189, 47, 0.15)',
              color: 'var(--primary)'
            }}>
              <Sparkles size={36} />
            </div>

            <div>
              <span style={{ 
                background: 'rgba(250, 189, 47, 0.1)', 
                color: 'var(--primary)', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                display: 'inline-block'
              }}>
                Early Adopter Phase
              </span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.75rem 0', letterSpacing: '-0.5px' }}>
                Welcome, Early Adopter!
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '500px' }}>
                Thank you for being part of CareerReport at this early stage. We are currently building partnerships with top employers to populate this board with exclusive opportunities.
              </p>
            </div>

            <div style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '12px', 
              border: '1px solid var(--glass-border)', 
              padding: '1.5rem', 
              width: '100%', 
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{ background: 'var(--surface-highlight)', padding: '0.75rem', borderRadius: '8px', color: 'var(--primary)', display: 'flex' }}>
                <Briefcase size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Are you hiring?</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Help us shape the future of recruiting. Set up a company profile today to list your open roles completely free! Candidates apply instantly using their verified, ATS-optimized profiles.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '1rem', marginTop: '0.5rem' }}>
              <Link href="/business/create" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  Post a Job (Free) <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/business/advertise" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
                <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  Explore Recruiter Benefits
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())).map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="job-card job-card-hover" style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '1.5rem', alignItems: 'center', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{job.logo}</span>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{job.title}</h3>
                    <div className="job-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                        <Building size={16} /> {job.company}
                        {job.verified && <span title="Verified Business Account" style={{ display: 'flex', marginLeft: '2px' }}><BadgeCheck size={16} color="var(--primary)" /></span>}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> {job.location}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={{ background: 'var(--surface-highlight)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{job.type}</span>
                      <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>{job.salary}</span>
                    </div>
                  </div>

                  <div className="job-card-action" style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{job.posted}</div>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Easy Apply</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .job-card-hover:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}
