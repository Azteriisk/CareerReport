"use client";
import Link from 'next/link';
import { FileText, MapPin, Building, BadgeCheck, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Mock fetching job by ID
  const job = {
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    verified: true,
    location: 'San Francisco, CA (or Remote)',
    salary: '$160,000 - $200,000',
    type: 'Full-time',
    description: "We are looking for an experienced Frontend Engineer to help build the future of the web. You will be working directly on our core platform, improving the dashboard experience for millions of developers worldwide. The ideal candidate has deep expertise in React, Next.js, and modern web architecture.",
    requirements: [
      "5+ years of experience with React and modern JavaScript.",
      "Deep understanding of web performance and rendering strategies (SSR, SSG, RSC).",
      "Experience building complex, data-heavy dashboards.",
      "A keen eye for design and UX details."
    ],
    logo: 'V'
  };

  const handleApply = () => {
    setIsApplying(true);
    // Mock network request
    setTimeout(() => {
      setIsApplying(false);
      setHasApplied(true);
    }, 1500);
  };

  return (
    <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem', width: '100%' }}>
        <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          <div className="job-details-header" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--surface-highlight)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, border: '1px solid var(--glass-border)' }}>
              {job.logo}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>{job.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <Building size={18} /> {job.company}
                  {job.verified && <BadgeCheck size={18} color="var(--primary)" title="Verified Business Account" />}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={18} /> {job.location}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ background: 'var(--surface-highlight)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{job.type}</span>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{job.salary}</span>
              </div>
            </div>
          </div>

          <div className="job-apply-box" style={{ padding: '2rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Apply with CareerReport</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your verified resume and profile will be sent directly to {job.company}.</p>
            </div>
            
            {hasApplied ? (
              <button disabled className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'default', padding: '0.75rem 1.5rem', borderRadius: '6px', fontSize: '1.05rem', fontWeight: 600 }}>
                <CheckCircle size={20} /> Applied
              </button>
            ) : isApplying ? (
              <button disabled className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.75rem 1.5rem', opacity: 0.8, cursor: 'not-allowed' }}>
                <Loader2 size={20} className="spinner" /> Sending...
              </button>
            ) : (
              <button onClick={handleApply} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.75rem 1.5rem', boxShadow: '0 4px 14px 0 rgba(250, 189, 47, 0.39)' }}>
                <Zap size={20} /> Easy Apply Now
              </button>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>About the Role</h2>
            <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>{job.description}</p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Requirements</h2>
            <ul style={{ lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
              {job.requirements.map((req, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
