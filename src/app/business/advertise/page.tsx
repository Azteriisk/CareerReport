"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle, 
  Briefcase, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Building, 
  ArrowLeft, 
  Users, 
  BarChart2 
} from 'lucide-react';

export default function BusinessAdvertisePage() {
  const [sortBy, setSortBy] = useState<'ai' | 'newest' | 'oldest' | 'first_name' | 'last_name'>('ai');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mockApplicants = [
    { 
      id: '1', 
      firstName: 'Alex', 
      lastName: 'Rivera', 
      yoe: 5, 
      skills: 'React / Next.js Specialist', 
      appliedDate: new Date('2026-05-22T10:30:00Z'),
      aiScore: 9.8,
      aiLabel: 'AI: Outstanding',
      aiExplanation: 'Highest framework mastery; built compliant digital asset links, TWA bridges, and client-side payment requests.',
      badgeColor: 'rgba(16, 185, 129, 0.1)',
      badgeTextColor: 'var(--accent)'
    },
    { 
      id: '2', 
      firstName: 'Sarah', 
      lastName: 'Chen', 
      yoe: 8, 
      skills: 'Tech Lead • System Architect', 
      appliedDate: new Date('2026-05-22T08:15:00Z'),
      aiScore: 9.4,
      aiLabel: 'AI: Highly Qualified',
      aiExplanation: 'Outstanding architecture and scaling credentials, but slightly less focused on dynamic client-side SSR rendering.',
      badgeColor: 'rgba(56, 189, 248, 0.1)',
      badgeTextColor: 'var(--primary)'
    },
    { 
      id: '3', 
      firstName: 'Michael', 
      lastName: 'Foster', 
      yoe: 3, 
      skills: 'Fullstack Developer • Node.js', 
      appliedDate: new Date('2026-05-22T14:45:00Z'),
      aiScore: 8.2,
      aiLabel: 'AI: Good Match',
      aiExplanation: 'Versatile generalist; holds strong portfolio but requires some onboarding for advanced pagination layouts.',
      badgeColor: 'rgba(250, 189, 47, 0.1)',
      badgeTextColor: 'var(--primary)'
    }
  ];

  const sortedApplicants = [...mockApplicants].sort((a, b) => {
    if (sortBy === 'ai') return b.aiScore - a.aiScore;
    if (sortBy === 'newest') return b.appliedDate.getTime() - a.appliedDate.getTime();
    if (sortBy === 'oldest') return a.appliedDate.getTime() - b.appliedDate.getTime();
    if (sortBy === 'first_name') return a.firstName.localeCompare(b.firstName);
    if (sortBy === 'last_name') return a.lastName.localeCompare(b.lastName);
    return 0;
  });

  const formatTimeAgo = (date: Date) => {
    const diffMs = new Date('2026-05-22T21:42:00Z').getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `${diffHours}h ago`;
  };

  return (
    <div className="landing-container" style={{ minHeight: '100dvh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      
      {/* Upper Navigation/Back Prompt */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 0 2rem' }}>
        <Link href="/jobs" style={{ 
          textDecoration: 'none', 
          color: 'var(--text-secondary)', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.95rem',
          fontWeight: 500,
          transition: 'color 0.2s ease'
        }} className="hover-opacity">
          <ArrowLeft size={16} /> Back to Job Board
        </Link>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem 5rem 2rem' }}>
        
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', marginBottom: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ 
            background: 'linear-gradient(135deg, rgba(250, 189, 47, 0.15) 0%, rgba(253, 186, 116, 0.15) 100%)', 
            color: 'var(--primary)', 
            padding: '6px 16px', 
            borderRadius: '30px', 
            fontSize: '0.85rem', 
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid rgba(250, 189, 47, 0.2)'
          }}>
            Recruiting Reinvented
          </span>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 900, 
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            maxWidth: '800px',
            margin: 0,
            background: 'linear-gradient(to right, var(--text-primary) 30%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}>
            Hire Elite Talent with CareerReport Easy Apply
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6, 
            maxWidth: '650px',
            margin: 0
          }}>
            Receive standardized, ATS-optimized, and verified candidate profiles directly. Eliminate resume parsing failures, formatting inconsistencies, and recruiting friction.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
            <Link href="/business/create" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ padding: '1.1rem 2.25rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <Building size={20} /> Create Company Account (Free)
              </button>
            </Link>
          </div>
        </section>

        {/* 3-COLUMN CORE ADVANTAGES */}
        <section style={{ marginBottom: '6rem' }}>
          <div className="grid-cols-3">
            
            {/* Feature 1 */}
            <div style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-border)', 
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'rgba(250, 189, 47, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid rgba(250, 189, 47, 0.2)'
              }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>1-Click Easy Apply</h3>
              <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Candidates apply instantly using their pre-formatted, multipage-pagination tested portfolios. No long forms to re-enter, ensuring maximum conversion rates for top passive candidates.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-border)', 
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'rgba(56, 189, 248, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI-Assisted Screening</h3>
              <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Our integrated Google Gemini models analyze candidate summaries and skills against your job requirements, instantly identifying strong matches and highlighting potential skill gaps.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-border)', 
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Verified Candidates</h3>
              <p style={{ fontSize: '0.975rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Our social network verification engines authenticate work history, credentials, and achievements. Hire with confidence knowing credentials have social proof.
              </p>
            </div>

          </div>
        </section>

        {/* RECRUITER MOCKUP METRICS PANEL */}
        <section style={{ 
          background: 'var(--surface-color)', 
          borderRadius: '24px', 
          border: '1px solid var(--glass-border)', 
          padding: '3rem', 
          marginBottom: '6rem',
          boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'row',
          gap: '3rem',
          alignItems: 'center'
        }} className="responsive-flex">
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Recruiter Dashboard Preview</span>
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.75px' }}>
              Say Goodbye to ATS Black Holes
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Legacy systems rely on bad keyword parsing that misses incredible talent. CareerReport parses and scores resumes natively on the database layer using invisible structural payloads.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {[
                "100% accurate resume parsing without data loss",
                "Advanced candidate filtering by location, salary, or skill sets",
                "Direct private DM portal to talk to candidates immediately",
                "Completely free to list and manage your applicants"
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* InteractiveRecruiterMockup */}
          <div style={{ 
            flex: 1, 
            width: '100%',
            background: 'var(--surface-highlight)', 
            borderRadius: '16px', 
            border: '1px solid var(--glass-border)', 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Applicants (Senior Frontend)</span>
                <span style={{ background: 'var(--primary)', color: 'var(--bg-color)', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', marginLeft: '0.5rem' }}>3 Active</span>
              </div>
              
              {/* Sort Control Selector */}
              <div className="flex-row">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rank by:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setExpandedId(null);
                  }}
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    padding: '3px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <option value="ai">🧠 AI Stack Rank</option>
                  <option value="newest">⏰ Most Recent</option>
                  <option value="oldest">⏳ Oldest Applied</option>
                  <option value="first_name">🔤 Alphabetical (First Name)</option>
                  <option value="last_name">🔤 Alphabetical (Last Name)</option>
                </select>
              </div>
            </div>

            {/* Sorted Applicants List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedApplicants.map((applicant, index) => {
                const isExpanded = expandedId === applicant.id;
                
                return (
                  <div 
                    key={applicant.id} 
                    onClick={() => setExpandedId(isExpanded ? null : applicant.id)}
                    style={{ 
                      background: 'var(--surface-color)', 
                      padding: '1rem', 
                      borderRadius: '10px', 
                      border: '1px solid var(--glass-border)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: sortBy === 'ai' 
                        ? `4px solid ${index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent)' : 'var(--text-secondary)'}`
                        : '1px solid var(--glass-border)'
                    }}
                    className="job-card-hover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="flex-row">
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {applicant.firstName} {applicant.lastName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {applicant.yoe} YOE • {applicant.skills}
                        </div>
                      </div>

                      {/* Score Indicator Badges */}
                      <div style={{ textAlign: 'right' }}>
                        {sortBy === 'ai' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <span style={{ 
                              background: index === 0 
                                ? 'rgba(250, 189, 47, 0.15)' 
                                : index === 1 
                                ? 'rgba(56, 189, 248, 0.15)' 
                                : 'rgba(255, 255, 255, 0.05)', 
                              color: index === 0 
                                ? 'var(--primary)' 
                                : index === 1 
                                ? 'var(--accent)' 
                                : 'var(--text-secondary)', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              padding: '2px 8px', 
                              borderRadius: '20px' 
                            }}>
                              Rank #{index + 1}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Score: {applicant.aiScore}
                            </span>
                          </div>
                        ) : sortBy === 'newest' || sortBy === 'oldest' ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                            Applied: {formatTimeAgo(applicant.appliedDate)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                            A-Z Order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable AI Relevance Reasoning */}
                    {sortBy === 'ai' && (
                      <div style={{ 
                        marginTop: isExpanded ? '0.75rem' : '0.25rem',
                        paddingTop: isExpanded ? '0.75rem' : '0',
                        borderTop: isExpanded ? '1px dashed var(--glass-border)' : 'none',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                      }}>
                        {isExpanded ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 600 }}>
                              <Sparkles size={14} /> <span>{applicant.aiLabel} Assessment</span>
                            </div>
                            <p style={{ margin: 0, lineHeight: 1.5 }}>
                              {applicant.aiExplanation}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.6, textDecoration: 'underline' }}>
                            View AI Stack Rank Analysis ➔
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>🧠 AI Stacked</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exclusive Contextual Analysis</div>
              </div>
              <div style={{ background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>100%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ATS Compatibility</div>
              </div>
            </div>

          </div>
        </section>

        {/* BOTTOM FINAL CALL TO ACTION */}
        <section style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
          borderRadius: '24px', 
          border: '1px solid var(--glass-border)', 
          padding: '4rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.75px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Build Your Dream Team Today
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '550px', margin: 0 }}>
            List your open roles completely free and experience recruiting with zero noise and 100% verified portfolios.
          </p>
          <Link href="/business/create" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
              Create Your Company Profile
            </button>
          </Link>
        </section>

      </main>

      {/* Styled Responsive layout classes for easy scaling */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .responsive-flex {
            flex-direction: column !important;
            padding: 2rem !important;
          }
        }
      `}} />

    </div>
  );
}
