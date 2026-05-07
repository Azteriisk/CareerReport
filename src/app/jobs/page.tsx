"use client";
import Link from 'next/link';
import { FileText, Search, MapPin, Building, BadgeCheck, Filter } from 'lucide-react';
import { useState } from 'react';

const MOCK_JOBS = [
  { id: '1', title: 'Senior Frontend Engineer', company: 'Vercel', verified: true, location: 'Remote', salary: '$160k - $200k', type: 'Full-time', posted: '2h ago', logo: 'V' },
  { id: '2', title: 'Product Designer', company: 'Stripe', verified: true, location: 'San Francisco, CA', salary: '$140k - $180k', type: 'Full-time', posted: '5h ago', logo: 'S' },
  { id: '3', title: 'Backend Developer', company: 'TechStartup Inc', verified: false, location: 'New York, NY', salary: '$120k - $150k', type: 'Full-time', posted: '1d ago', logo: 'T' },
  { id: '4', title: 'Developer Advocate', company: 'Supabase', verified: true, location: 'Remote', salary: '$130k - $170k', type: 'Full-time', posted: '2d ago', logo: 'S' },
];

export default function JobsBoardPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOCK_JOBS.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())).map(job => (
            <Link href={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="job-card" style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '1.5rem', alignItems: 'center', transition: 'all 0.2s ease', cursor: 'pointer' }} className="job-card-hover">
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
                  {job.logo}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{job.title}</h3>
                  <div className="job-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                      <Building size={16} /> {job.company}
                      {job.verified && <BadgeCheck size={16} color="var(--primary)" style={{ marginLeft: '2px' }} title="Verified Business Account" />}
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
