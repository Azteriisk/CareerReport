"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Building2, 
  Users, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  Plus, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  Eye,
  EyeOff,
  Building
} from 'lucide-react';
import Link from 'next/link';

export default function RecruiterDashboardPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  // Permissions state
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  // Dashboard content state
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants'>('overview');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Applicants filter state
  const [selectedJobIdForApplicants, setSelectedJobIdForApplicants] = useState('');
  const [sortBy, setSortBy] = useState<'ai' | 'newest' | 'oldest' | 'first_name' | 'last_name'>('ai');
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);

  // 1. Verify permissions and load businesses
  useEffect(() => {
    async function verifyPermissions() {
      if (!isSignedIn || !user) {
        setIsLoadingAccess(false);
        return;
      }

      try {
        await getToken({ template: 'supabase' });

        // A. Fetch owned businesses
        const { data: owned, error: ownedErr } = await supabase
          .from('business_profiles')
          .select('id, name, slug')
          .eq('owner_id', user.id);

        if (ownedErr) throw ownedErr;

        // B. Fetch employee businesses with 'jobs' permission
        const { data: employeeData, error: empErr } = await supabase
          .from('company_employees')
          .select(`
            business_id,
            status,
            business_profiles:business_id (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', user.id)
          .like('status', 'approved%');

        if (empErr) throw empErr;

        // Combine unique business listings
        const combinedMap = new Map<string, { id: string; name: string; slug: string }>();
        
        if (owned) {
          owned.forEach(b => combinedMap.set(b.id, b));
        }
        
        if (employeeData) {
          employeeData.forEach((record: any) => {
            const bp = record.business_profiles as any;
            const status = record.status || '';
            if (bp && status.includes('jobs')) {
              combinedMap.set(bp.id, bp);
            }
          });
        }

        const combinedList = Array.from(combinedMap.values());

        if (combinedList.length > 0) {
          setBusinesses(combinedList);
          setSelectedBusinessId(combinedList[0].id);
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error("Failed to verify recruiter access:", err);
        setHasAccess(false);
      } finally {
        setIsLoadingAccess(false);
      }
    }

    if (isLoaded) {
      if (isSignedIn) {
        verifyPermissions();
      } else {
        setIsLoadingAccess(false);
      }
    }
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  // 2. Fetch jobs when selected business changes
  useEffect(() => {
    async function loadJobs() {
      if (!selectedBusinessId) return;
      setIsLoadingJobs(true);

      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('business_id', selectedBusinessId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setJobs(data || []);
        if (data && data.length > 0) {
          setSelectedJobIdForApplicants(data[0].id);
        } else {
          setSelectedJobIdForApplicants('');
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    }

    if (selectedBusinessId) {
      loadJobs();
    }
  }, [selectedBusinessId]);

  // Toggle open/closed status for a job
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    setUpdatingJobId(jobId);
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';

    try {
      await getToken({ template: 'supabase' });

      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      // Update local state dynamically
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update listing status: " + (err.message || 'Error occurred.'));
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Generate dynamic, realistic applicant data mapped to the selected job title
  const getMockApplicantsForJob = (jobTitle: string) => {
    const title = jobTitle || 'Developer';
    return [
      {
        id: 'app-1',
        firstName: 'Alex',
        lastName: 'Rivera',
        yoe: 5,
        skills: `Expert in React, TypeScript, and ${title}-related workflows`,
        appliedDate: new Date('2026-05-22T10:30:00Z'),
        aiScore: 9.8,
        aiLabel: 'AI: Outstanding',
        aiExplanation: `Highest alignment with your ${title} requirements. Demonstrates strong framework mastery and robust production shipping background.`
      },
      {
        id: 'app-2',
        firstName: 'Sarah',
        lastName: 'Chen',
        yoe: 8,
        skills: `Tech Lead • System Architecture • ${title} tooling`,
        appliedDate: new Date('2026-05-22T08:15:00Z'),
        aiScore: 9.4,
        aiLabel: 'AI: Highly Qualified',
        aiExplanation: `Exceptional leadership credentials matching the scope of your ${title} opening, with slight focus differences in core stack details.`
      },
      {
        id: 'app-3',
        firstName: 'Michael',
        lastName: 'Foster',
        yoe: 3,
        skills: `Fullstack Developer • Node.js • ${title} generalist`,
        appliedDate: new Date('2026-05-22T14:45:00Z'),
        aiScore: 8.2,
        aiLabel: 'AI: Good Match',
        aiExplanation: `Solid mid-level candidate. Capable of driving standard developer tracks for your ${title} listing with minimal onboarding.`
      }
    ];
  };

  const getSortedApplicants = () => {
    const selectedJob = jobs.find(j => j.id === selectedJobIdForApplicants);
    const applicants = getMockApplicantsForJob(selectedJob?.title || 'Professional');

    return [...applicants].sort((a, b) => {
      if (sortBy === 'ai') return b.aiScore - a.aiScore;
      if (sortBy === 'newest') return b.appliedDate.getTime() - a.appliedDate.getTime();
      if (sortBy === 'oldest') return a.appliedDate.getTime() - b.appliedDate.getTime();
      if (sortBy === 'first_name') return a.firstName.localeCompare(b.firstName);
      if (sortBy === 'last_name') return a.lastName.localeCompare(b.lastName);
      return 0;
    });
  };

  const formatTimeAgo = (date: Date) => {
    const diffMs = new Date('2026-05-22T21:42:00Z').getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `${diffHours}h ago`;
  };

  // Render Loader if initial loading
  if (!isLoaded || isLoadingAccess) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Render Sign In Required fallback
  if (!isSignedIn) {
    return (
      <div className="flex-center" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <Briefcase size={48} color="var(--primary)" />
        <h1 style={{ color: 'var(--text-primary)' }}>Recruiter Sign In Required</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You must be authenticated to access the Recruiter Dashboard.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  // Render Access Denied fallback if no posting privileges
  if (hasAccess === false) {
    return (
      <div className="flex-center" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)', flexDirection: 'column', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
          <XCircle size={44} style={{ display: 'flex' }} />
        </div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: 0, lineHeight: 1.6 }}>
          You do not have active job-posting permissions for any verified business profiles. Please create a new company account, or ask your manager to grant your account <strong>jobs</strong> permissions.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <Link href="/business/create" className="btn btn-primary">Create Company Profile</Link>
          <Link href="/business/advertise" className="btn btn-secondary">Learn About Recruiter Benefits</Link>
        </div>
      </div>
    );
  }

  // Calculate statistics metrics
  const activeCount = jobs.filter(j => j.status === 'open').length;
  const inactiveCount = jobs.filter(j => j.status === 'closed').length;
  const totalApplicantsCount = activeCount * 3; // Mock: 3 active applicants per open listing

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: 'calc(100dvh - 82px)', color: 'var(--text-primary)' }}>
      
      {/* HEADER SECTION */}
      <header style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-color)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              <Sparkles size={16} />
              <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recruiter Job Center</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Dashboard & Listings
            </h1>
          </div>

          {/* Business switcher dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Recruiting for:</span>
            <select
              className="input-field"
              style={{ padding: '0.5rem 2rem 0.5rem 1rem', width: 'auto', minWidth: '200px', margin: 0, fontSize: '0.9rem', fontWeight: 600 }}
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>🏢 {b.name}</option>
              ))}
            </select>
          </div>

        </div>
      </header>

      {/* SUB NAV PILLS / METRICS */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem 4rem 1rem' }}>
        
        {/* STATS HIGHLIGHT GRID */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Card 1 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Active Listings</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>{activeCount}</div>
          </div>

          {/* Card 2 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Inactive Listings</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{inactiveCount}</div>
          </div>

          {/* Card 3 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Applicants</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.5rem' }}>{totalApplicantsCount}</div>
          </div>

          {/* Card 4 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Average AI Match Fit</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>{activeCount > 0 ? '9.1 / 10' : '--'}</div>
          </div>

        </section>

        {/* TAB CONTROLS */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
          {[
            { id: 'overview', name: 'Dashboard Overview' },
            { id: 'jobs', name: 'Manage Job Listings' },
            { id: 'applicants', name: 'Applicant Stack Ranker' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--bg-color)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        {isLoadingJobs ? (
          <div className="flex-center" style={{ padding: '4rem 0' }}>
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome to your Job Center Dashboard</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    This dashboard coordinates active opportunities and leverages context-aware AI parsing to verify incoming portfolios. Access details regarding candidate match indices on the <strong>Manage Job Listings</strong> or <strong>Applicant Stack Ranker</strong> tabs above.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '1.75rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={18} color="var(--primary)" /> Active Overview
                    </h4>
                    <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      You currently have <strong>{activeCount}</strong> open recruiting channels published globally. Apply directly in one click with verified CareerReport templates.
                    </p>
                    <button onClick={() => setActiveTab('jobs')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Manage Listings</button>
                  </div>

                  <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '1.75rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} color="var(--accent)" /> Applicant Pool Status
                    </h4>
                    <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      A total of <strong>{totalApplicantsCount}</strong> candidate profiles are ranked. Leverage exclusive contextual scoring rules compared across active listings.
                    </p>
                    <button onClick={() => setActiveTab('applicants')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Open Stack Ranker</button>
                  </div>
                </div>
              </div>
            )}

            {/* JOBS LISTINGS TAB */}
            {activeTab === 'jobs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Open and Closed Postings</h3>
                  <Link href="/jobs/new" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Plus size={16} /> Post a Job
                    </button>
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                    <Briefcase size={36} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Listings Found</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                      You haven't listed any job opportunities for this company profile yet. Start hiring today.
                    </p>
                    <Link href="/jobs/new" className="btn btn-primary" style={{ display: 'inline-flex' }}>Post Your First Job</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {jobs.map(job => (
                      <div 
                        key={job.id} 
                        style={{ 
                          background: 'var(--surface-color)', 
                          padding: '1.5rem', 
                          borderRadius: '12px', 
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{job.title}</h4>
                            <span style={{ 
                              background: job.status === 'open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: job.status === 'open' ? '#10b981' : '#ef4444',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {job.status === 'open' ? 'Active' : 'Closed'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={14} /> {job.location || (job.is_remote ? 'Remote' : 'On-site')}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <DollarSign size={14} />
                              {job.salary_min || job.salary_max
                                ? `${job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}k` : ''} - ${job.salary_max ? `$${(job.salary_max / 1000).toFixed(0)}k` : ''}`
                                : 'Competitive'}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle & Details Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <button
                            disabled={updatingJobId === job.id}
                            onClick={() => handleToggleJobStatus(job.id, job.status)}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.5rem 1rem', 
                              fontSize: '0.85rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.35rem', 
                              borderColor: job.status === 'open' ? '#ef4444' : 'var(--primary)',
                              color: job.status === 'open' ? '#ef4444' : 'var(--primary)',
                            }}
                          >
                            {updatingJobId === job.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : job.status === 'open' ? (
                              <>
                                <EyeOff size={14} /> Close Listing
                              </>
                            ) : (
                              <>
                                <Eye size={14} /> Reopen Listing
                              </>
                            )}
                          </button>

                          <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                              View Live Page
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPLICANT STACK RANKER TAB */}
            {activeTab === 'applicants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Job Selection Dropdown & Sort selector */}
                <div style={{ 
                  background: 'var(--surface-color)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', fontWeight: 600 }}>Select Role:</span>
                    <select
                      className="input-field"
                      style={{ padding: '0.5rem 2rem 0.5rem 1rem', width: 'auto', minWidth: '220px', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}
                      value={selectedJobIdForApplicants}
                      onChange={(e) => {
                        setSelectedJobIdForApplicants(e.target.value);
                        setExpandedApplicantId(null);
                      }}
                      disabled={jobs.length === 0}
                    >
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>💼 {j.title} ({j.status === 'open' ? 'Active' : 'Closed'})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Rank by:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        setExpandedApplicantId(null);
                      }}
                      style={{
                        background: 'var(--surface-highlight)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        padding: '0.45rem 1.5rem 0.45rem 0.75rem',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: 700
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

                {jobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                    <Users size={36} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Applicants Pool</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
                      Once you post an active opportunity, your candidate stack rank database is initialized immediately.
                    </p>
                  </div>
                ) : !selectedJobIdForApplicants ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Please select a job listing from the switcher dropdown above.</p>
                  </div>
                ) : (
                  /* Sorted Applicants List */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getSortedApplicants().map((applicant, index) => {
                      const isExpanded = expandedApplicantId === applicant.id;
                      
                      return (
                        <div 
                          key={applicant.id} 
                          onClick={() => setExpandedApplicantId(isExpanded ? null : applicant.id)}
                          style={{ 
                            background: 'var(--surface-color)', 
                            padding: '1.25rem 1.5rem', 
                            borderRadius: '12px', 
                            border: '1px solid var(--glass-border)', 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderLeft: sortBy === 'ai' 
                              ? `5px solid ${index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent)' : 'var(--text-secondary)'}`
                              : '1px solid var(--glass-border)'
                          }}
                          className="job-card job-card-hover"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                  {applicant.firstName} {applicant.lastName}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {applicant.yoe} YOE • {applicant.skills}
                              </div>
                            </div>

                            {/* Score Indicator Badges */}
                            <div style={{ textAlign: 'right' }}>
                              {sortBy === 'ai' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
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
                                    fontSize: '0.8rem', 
                                    fontWeight: 800, 
                                    padding: '3px 10px', 
                                    borderRadius: '20px' 
                                  }}>
                                    Rank #{index + 1}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Compatibility: {applicant.aiScore}
                                  </span>
                                </div>
                              ) : sortBy === 'newest' || sortBy === 'oldest' ? (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                                  Applied: {formatTimeAgo(applicant.appliedDate)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                                  A-Z Sequence
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expandable AI Relevance Reasoning */}
                          {sortBy === 'ai' && (
                            <div style={{ 
                              marginTop: isExpanded ? '1rem' : '0.4rem',
                              paddingTop: isExpanded ? '1rem' : '0',
                              borderTop: isExpanded ? '1px dashed var(--glass-border)' : 'none',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s ease',
                            }}>
                              {isExpanded ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 700 }}>
                                    <Sparkles size={16} /> <span>{applicant.aiLabel} Assessment Reason</span>
                                  </div>
                                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                                    {applicant.aiExplanation}
                                  </p>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', opacity: 0.7, textDecoration: 'underline' }}>
                                  Expand AI Match Evaluation ➔
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>
      
      {/* Visual Hover effect for listings cards */}
      <style dangerouslySetInnerHTML={{__html: `
        .job-card-hover:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.25) !important;
        }
      `}} />

    </div>
  );
}
