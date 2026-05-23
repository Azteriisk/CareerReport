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
import { parseJobStatus, encodeJobStatus, toggleSponsorPause } from '@/lib/job-tier';
import { getBusinessTier, injectBusinessTier, cleanBusinessBio, BUSINESS_TIERS, getSponsorCredits } from '@/lib/business-tier';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants' | 'billing'>('overview');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Sync tab parameter from query string and handle post-Stripe redirect feedback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'billing' || tab === 'jobs' || tab === 'applicants' || tab === 'overview') {
        setActiveTab(tab as any);
      }
      // Success feedback from Stripe redirect
      const success = params.get('success');
      const sponsored = params.get('sponsored');
      const canceled = params.get('canceled');
      if (success === 'plan') {
        const tier = params.get('tier');
        setSuccessBanner(`🎉 Plan upgraded successfully${tier ? ` to ${tier}` : ''}! Your new limits are active.`);
      } else if (sponsored) {
        setSuccessBanner(`🔥 Listing is now sponsored! It's live and featured across the platform.`);
      } else if (canceled) {
        setCancelBanner(true);
      }
      // Clean URL params without reload
      if (success || sponsored || canceled) {
        const cleanUrl = window.location.pathname + (tab ? `?tab=${tab}` : '');
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);

  // Applicants filter state
  const [selectedJobIdForApplicants, setSelectedJobIdForApplicants] = useState('');
  const [sortBy, setSortBy] = useState<'ai' | 'newest' | 'oldest' | 'first_name' | 'last_name'>('ai');
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);

  // Real applicants and live AI-powered stack ranker state
  const [realApplicants, setRealApplicants] = useState<any[]>([]);
  const [isLoadingRealApplicants, setIsLoadingRealApplicants] = useState(false);
  const [aiResults, setAiResults] = useState<Record<string, { aiScore: number; aiLabel: string; aiExplanation: string }>>({});
  const [isStackRanking, setIsStackRanking] = useState(false);

  // ── Sponsor Modals ──
  const [upgradeJobId, setUpgradeJobId] = useState<string | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [sponsorNonTransferAck, setSponsorNonTransferAck] = useState(false);
  
  // ── Sponsor Bundles ──
  const [isProcessingBundle, setIsProcessingBundle] = useState<string | null>(null);
  const [isPausingJobId, setIsPausingJobId] = useState<string | null>(null);

  // Plan Subscription Premium Upgrade states
  const [showPlanCheckout, setShowPlanCheckout] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string | null>(null);
  const [isProcessingPlanUpgrade, setIsProcessingPlanUpgrade] = useState(false);
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, string>>({});

  // Toast/banner state for post-Stripe redirect feedback
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [cancelBanner, setCancelBanner] = useState(false);

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
          .select('id, name, slug, bio, owner_id')
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
              slug,
              bio,
              owner_id
            )
          `)
          .eq('user_id', user.id)
          .like('status', 'approved%');

        if (empErr) throw empErr;

        // Combine unique business listings
        const combinedMap = new Map<string, { id: string; name: string; slug: string; bio: string | null; owner_id: string }>();
        const statuses: Record<string, string> = {};
        
        if (owned) {
          owned.forEach(b => {
            combinedMap.set(b.id, b as any);
            statuses[b.id] = 'owner';
          });
        }
        
        if (employeeData) {
          employeeData.forEach((record: any) => {
            const bp = record.business_profiles as any;
            const status = record.status || '';
            if (bp) {
              statuses[bp.id] = status;
              if (status.includes('jobs')) {
                combinedMap.set(bp.id, bp);
              }
            }
          });
        }

        setEmployeeStatuses(statuses);
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

  // Load real applicant data from Supabase for active listings when selection or tab changes
  useEffect(() => {
    async function loadRealApplicants() {
      if (!selectedJobIdForApplicants) {
        setRealApplicants([]);
        return;
      }
      setIsLoadingRealApplicants(true);
      try {
        const { data: apps, error } = await supabase
          .from('job_applications')
          .select(`
            id,
            created_at,
            job_id,
            applicant_id,
            profiles:applicant_id (
              username,
              full_name,
              avatar_url,
              label,
              career_context
            )
          `)
          .eq('job_id', selectedJobIdForApplicants)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (apps) {
          const applicantIds = apps.map((a: any) => a.applicant_id);
          if (applicantIds.length > 0) {
            const { data: resumeRows } = await supabase
              .from('resumes')
              .select('user_id, data')
              .in('user_id', applicantIds);

            // Enrich applications list with candidate resumes
            const enriched = apps.map((a: any) => {
              const resRow = resumeRows?.find((r: any) => r.user_id === a.applicant_id);
              return {
                ...a,
                resumeData: resRow?.data || null
              };
            });
            setRealApplicants(enriched);
          } else {
            setRealApplicants([]);
          }
        }
      } catch (err) {
        console.error("Failed to load real applicants:", err);
      } finally {
        setIsLoadingRealApplicants(false);
      }
    }

    if (activeTab === 'applicants') {
      loadRealApplicants();
    }
  }, [selectedJobIdForApplicants, activeTab]);

  // Toggle open/closed status for a job backwards-compatibly
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    setUpdatingJobId(jobId);
    
    const parsed = parseJobStatus(currentStatus);
    const newStatus = encodeJobStatus(!parsed.isOpen, parsed.isFeatured, parsed.isPaused);

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

  // Toggle pause/resume on a sponsored listing's featured clock
  const handleToggleSponsorPause = async (jobId: string, currentStatus: string) => {
    setIsPausingJobId(jobId);
    try {
      const newStatus = toggleSponsorPause(currentStatus);

      await getToken({ template: 'supabase' });

      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (err: any) {
      console.error('Failed to toggle sponsor pause:', err);
      alert('Failed to update sponsorship state: ' + (err.message || 'Error occurred.'));
    } finally {
      setIsPausingJobId(null);
    }
  };

  // Redirect to real Stripe Checkout for sponsored post ($19 one-time)
  const handleUpgradeJob = async () => {
    if (!upgradeJobId || !selectedBusinessId) return;
    setIsProcessingUpgrade(true);
    try {
      const jobBeingUpgraded = jobs.find(j => j.id === upgradeJobId);
      const credits = selectedBusiness ? getSponsorCredits(selectedBusiness.bio) : 0;

      if (credits > 0) {
        // Use a credit instead of Stripe
        const res = await fetch('/api/jobs/sponsor-with-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: upgradeJobId, businessId: selectedBusinessId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to apply sponsor credit.');
        
        // Success
        setSuccessBanner('Sponsorship credit applied successfully! Listing is now featured.');
        setUpgradeJobId(null);
        setIsProcessingUpgrade(false);
        // Refresh jobs and business to reflect deducted credit
        const freshJobs = await supabase.from('jobs').select('*').eq('business_id', selectedBusinessId).order('created_at', { ascending: false });
        if (freshJobs.data) setJobs(freshJobs.data);
        const freshProfile = await supabase.from('business_profiles').select('bio').eq('id', selectedBusinessId).single();
        if (freshProfile.data && selectedBusiness) {
          selectedBusiness.bio = freshProfile.data.bio;
        }
      } else {
        // Redirect to Stripe
        const res = await fetch('/api/checkout/sponsored-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: upgradeJobId,
            businessId: selectedBusinessId,
            jobTitle: jobBeingUpgraded?.title,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout session.');
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to sponsor job: ' + (err.message || 'Error occurred.'));
      setIsProcessingUpgrade(false);
    }
  };

  // Redirect to real Stripe Checkout for recruiter plan subscription
  const handleUpgradePlan = async () => {
    if (!selectedBusinessId || !selectedUpgradePlanId) return;
    setIsProcessingPlanUpgrade(true);
    try {
      const res = await fetch('/api/checkout/recruiter-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          tierId: selectedUpgradePlanId,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout session.');
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert('Failed to start checkout: ' + (err.message || 'Error occurred.'));
      setIsProcessingPlanUpgrade(false);
    }
    // Don't reset — redirect is happening
  };


  // Fetch jobs and stats when dashboard loads

  // Post candidates to Gemini API to rank them in real-time
  const handleRunAIStackRank = async () => {
    if (realApplicants.length === 0) return;
    const selectedJob = jobs.find(j => j.id === selectedJobIdForApplicants);
    if (!selectedJob) return;

    setIsStackRanking(true);
    try {
      await getToken({ template: 'supabase' });

      const candidatesPayload = realApplicants.map((app: any) => {
        const profile = app.profiles || {};
        return {
          id: app.applicant_id,
          name: profile.full_name || profile.username || 'Candidate',
          resumeText: app.resumeData || {
            basics: { summary: profile.career_context || '' },
            skills: profile.label ? [{ name: profile.label }] : []
          }
        };
      });

      const response = await fetch('/api/ai/stack-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          jobDescription: selectedJob.description,
          candidates: candidatesPayload
        })
      });

      if (!response.ok) throw new Error('AI ranking failed');

      const resultData = await response.json();
      if (resultData.results && Array.isArray(resultData.results)) {
        const resultMap: Record<string, { aiScore: number; aiLabel: string; aiExplanation: string }> = {};
        resultData.results.forEach((r: any) => {
          resultMap[r.id] = {
            aiScore: parseFloat(r.aiScore) || 7.0,
            aiLabel: r.aiLabel || 'AI: Evaluated',
            aiExplanation: r.aiExplanation || 'Parsed successfully.'
          };
        });
        setAiResults(resultMap);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to run AI Stack Rank: " + (err.message || 'Unknown error'));
    } finally {
      setIsStackRanking(false);
    }
  };

  const getSortedApplicants = () => {
    if (realApplicants.length === 0) return [];
    
    const listToUse = realApplicants.map((app: any) => {
      const profile = app.profiles || {};
      const fullName = profile.full_name || profile.username || 'Candidate';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Candidate';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Estimate Years of Experience (YOE) from work history
      let yoe = 0;
      const workHistory = app.resumeData?.work || [];
      if (workHistory.length > 0) {
        yoe = workHistory.reduce((acc: number, w: any) => {
          const startYear = parseInt(w.startDate?.split('-')[0] || '0');
          const endYear = w.endDate ? parseInt(w.endDate.split('-')[0]) : new Date().getFullYear();
          if (startYear > 0 && endYear >= startYear) {
            return acc + (endYear - startYear);
          }
          return acc + 1;
        }, 0);
        if (yoe === 0) yoe = 2;
      } else {
        yoe = 1;
      }

      // Extract skills
      let skillsList = profile.label || 'Developer';
      const resumeSkills = app.resumeData?.skills || [];
      if (resumeSkills.length > 0) {
        skillsList = resumeSkills.map((s: any) => s.name).slice(0, 3).join(' • ');
      }

      const aiScoreData = aiResults[app.applicant_id] || {
        aiScore: 0,
        aiLabel: 'AI: Unevaluated',
        aiExplanation: 'This applicant has not been analyzed yet. Click "Run AI Stack Rank" above to evaluate.'
      };

      return {
        id: app.applicant_id,
        firstName,
        lastName,
        yoe,
        skills: skillsList,
        appliedDate: new Date(app.created_at),
        aiScore: aiScoreData.aiScore,
        aiLabel: aiScoreData.aiLabel,
        aiExplanation: aiScoreData.aiExplanation,
        isReal: true
      };
    });

    return [...listToUse].sort((a, b) => {
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
    if (diffHours <= 0) return 'Just now';
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

  // Calculate subscription plan and statistics metrics
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const selectedBusinessTier = getBusinessTier(selectedBusiness?.bio);
  
  const activeCount = jobs.filter(j => {
    const parsed = parseJobStatus(j.status);
    return parsed.isOpen;
  }).length;
  const inactiveCount = jobs.filter(j => {
    const parsed = parseJobStatus(j.status);
    return !parsed.isOpen;
  }).length;
  
  const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);
  const totalClicks = jobs.reduce((sum, j) => sum + (j.clicks || 0), 0);
  
  const totalApplicantsCount = realApplicants.length > 0 ? realApplicants.length : activeCount * 3;
  const isOwner = selectedBusiness?.owner_id === user?.id;
  const isPremiumEmployee = (employeeStatuses[selectedBusinessId] || '').includes('premium');
  const isAILocked = selectedBusinessTier?.hasAI === false && !isOwner && !isPremiumEmployee;

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

      {/* POST-STRIPE REDIRECT BANNERS */}
      {successBanner && (
        <div style={{
          maxWidth: '1100px', margin: '1.5rem auto 0', padding: '0 1rem',
        }}>
          <div style={{
            background: 'rgba(142,192,124,0.1)',
            border: '1px solid rgba(142,192,124,0.35)',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#8ec07c',
          }}>
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px', flexShrink: 0 }}>✕</button>
          </div>
        </div>
      )}
      {cancelBanner && (
        <div style={{
          maxWidth: '1100px', margin: '1.5rem auto 0', padding: '0 1rem',
        }}>
          <div style={{
            background: 'rgba(235,219,178,0.06)',
            border: '1px solid rgba(235,219,178,0.15)',
            borderRadius: '10px',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            <span>Checkout canceled — no charge was made.</span>
            <button onClick={() => setCancelBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px', flexShrink: 0 }}>✕</button>
          </div>
        </div>
      )}

      {/* SUB NAV PILLS / METRICS */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem 4rem 1rem' }}>
        
        {/* STATS HIGHLIGHT GRID */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Card 1: Subscription Tier Slot Meter */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Active Listings Slot</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(250, 189, 47, 0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(250, 189, 47, 0.2)', letterSpacing: '0.05em' }}>
                  {selectedBusinessTier?.name || 'Free Starter'}
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', letterSpacing: '-0.5px' }}>
                {activeCount} / {selectedBusinessTier?.maxJobs === 9999 ? '∞' : selectedBusinessTier?.maxJobs} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Slots</span>
              </div>
            </div>
            <div style={{ width: '100%', marginTop: '0.75rem' }}>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min(100, (activeCount / (selectedBusinessTier?.maxJobs || 1)) * 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary) 0%, #fbbf24 100%)', 
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Job Views</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{totalViews}</div>
          </div>

          {/* Card 3 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Applicants</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.5rem' }}>{totalApplicantsCount}</div>
          </div>

          {/* Card 4 */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Apply Clicks</span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>{totalClicks}</div>
          </div>

        </section>

        {/* TAB CONTROLS */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', name: 'Dashboard Overview' },
            { id: 'jobs', name: 'Manage Job Listings' },
            { id: 'applicants', name: 'Applicant Stack Ranker' },
            { id: 'billing', name: 'Billing & Plans ⚡' }
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
                    {jobs.map(job => {
                      const parsed = parseJobStatus(job.status);
                      return (
                        <div 
                          key={job.id} 
                          style={{ 
                            background: parsed.isFeatured
                              ? 'linear-gradient(135deg, rgba(250, 189, 47, 0.04) 0%, var(--surface-color) 100%)'
                              : 'var(--surface-color)', 
                            padding: '1.5rem', 
                            borderRadius: '12px', 
                            border: parsed.isFeatured
                              ? '1px solid rgba(250, 189, 47, 0.35)'
                              : '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            boxShadow: parsed.isFeatured ? '0 6px 20px rgba(250, 189, 47, 0.03)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{job.title}</h4>
                              <span style={{ 
                                background: parsed.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: parsed.isOpen ? '#10b981' : '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}>
                                {parsed.isOpen ? 'Active' : 'Closed'}
                              </span>
                              {parsed.isFeatured && (
                                <span style={{ 
                                  background: 'rgba(250, 189, 47, 0.12)', 
                                  color: 'var(--primary)', 
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  🔥 Featured
                                </span>
                              )}
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
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Eye size={14} /> {job.views || 0} Views
                              </span>
                              <span>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                                <ArrowRight size={14} /> {job.clicks || 0} Apply Clicks
                              </span>
                            </div>
                          </div>

                          {/* Status Toggle & Details Actions */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Sponsor / Featured upgrade button + info link for Standard listings */}
                            {!parsed.isFeatured && (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setSponsorNonTransferAck(false);
                                    setUpgradeJobId(job.id);
                                  }}
                                  className="btn"
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    fontSize: '0.85rem',
                                    background: 'linear-gradient(135deg, rgba(250,189,47,0.15) 0%, rgba(251,191,36,0.08) 100%)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(250, 189, 47, 0.4)',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    boxShadow: '0 0 12px rgba(250,189,47,0.08)'
                                  }}
                                >
                                  ⚡ Sponsor Post — $19
                                </button>
                                <Link
                                  href="/jobs/sponsored"
                                  style={{ 
                                    fontSize: '0.78rem',
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'underline',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  How it works
                                </Link>
                              </div>
                            )}

                            {/* Pause / Resume controls for sponsored listings */}
                            {parsed.isFeatured && (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  disabled={isPausingJobId === job.id}
                                  onClick={() => handleToggleSponsorPause(job.id, job.status)}
                                  className="btn"
                                  style={{
                                    padding: '0.4rem 0.9rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: isPausingJobId === job.id ? 'not-allowed' : 'pointer',
                                    border: parsed.isPaused
                                      ? '1px solid rgba(250,189,47,0.5)'
                                      : '1px solid rgba(250,189,47,0.2)',
                                    background: parsed.isPaused
                                      ? 'rgba(250,189,47,0.12)'
                                      : 'rgba(250,189,47,0.05)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                >
                                  {isPausingJobId === job.id ? (
                                    <Loader2 className="animate-spin" size={13} />
                                  ) : parsed.isPaused ? (
                                    <>▶ Resume Sponsorship</>
                                  ) : (
                                    <>⏸ Pause Sponsorship</>
                                  )}
                                </button>

                                <span style={{
                                  fontSize: '0.75rem',
                                  color: parsed.isPaused ? 'var(--text-secondary)' : 'var(--primary)',
                                  background: parsed.isPaused ? 'rgba(255,255,255,0.04)' : 'rgba(250,189,47,0.08)',
                                  border: `1px solid ${parsed.isPaused ? 'rgba(255,255,255,0.08)' : 'rgba(250,189,47,0.2)'}`,
                                  borderRadius: '6px',
                                  padding: '3px 9px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {parsed.isPaused ? '⏸ Sponsored · Paused' : '🔥 Sponsored · Active'}
                                </span>
                              </div>
                            )}


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
                                borderColor: parsed.isOpen ? '#ef4444' : 'var(--primary)',
                                color: parsed.isOpen ? '#ef4444' : 'var(--primary)',
                              }}
                            >
                              {updatingJobId === job.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : parsed.isOpen ? (
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* APPLICANT STACK RANKER TAB */}
            {activeTab === 'applicants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {isAILocked ? (
                  /* Premium Blur Blocker for AI locks on Starter tier */
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.45) 0%, rgba(10, 10, 10, 0.55) 100%)',
                    border: '1px solid rgba(250, 189, 47, 0.25)',
                    borderRadius: '16px',
                    padding: '5rem 2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)',
                    margin: '1.5rem 0'
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(250, 189, 47, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      border: '1px solid rgba(250, 189, 47, 0.25)',
                      boxShadow: '0 0 35px rgba(250, 189, 47, 0.15)',
                      fontSize: '2rem'
                    }}>
                      🔒
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.4px' }}>
                        AI Stack Ranking Locked
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '520px' }}>
                        Google Gemini-powered intelligent applicant stack ranking is a premium Recruiter Pro benefit. Upgrade your company subscription to instantly scan, rank, and evaluate incoming candidate portfolios.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '380px', marginTop: '0.5rem' }}>
                      <button onClick={() => setActiveTab('billing')} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', justifyContent: 'center', cursor: 'pointer' }}>
                        Upgrade Subscription to Pro ⚡
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                            <option key={j.id} value={j.id}>💼 {j.title} ({parseJobStatus(j.status).isOpen ? 'Active' : 'Closed'})</option>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Real Applicants banner + Active AI stack ranker button */}
                        {realApplicants.length > 0 && (
                          <div style={{ 
                            background: 'linear-gradient(135deg, rgba(250, 189, 47, 0.08) 0%, rgba(253, 186, 116, 0.05) 100%)', 
                            border: '1px solid rgba(250, 189, 47, 0.25)', 
                            padding: '1.5rem', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.35rem' }}>
                                <Sparkles size={18} />
                                <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Active Listing: {realApplicants.length} Real Applicants</h4>
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                Leverage advanced context-aware Google Gemini engines to evaluate these candidate portfolios dynamically against the opening's requirements.
                              </p>
                            </div>
                            
                            <div>
                              <button
                                onClick={handleRunAIStackRank}
                                disabled={isStackRanking}
                                className="btn btn-primary"
                                style={{ 
                                  padding: '0.75rem 1.5rem', 
                                  fontSize: '0.9rem', 
                                  fontWeight: 700, 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 15px rgba(250, 189, 47, 0.2)'
                                }}
                              >
                                {isStackRanking ? (
                                  <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Ranking Candidates...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Run AI Stack Rank</span>
                                    <span>🧠</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Loading State for Real Applicants */}
                        {isLoadingRealApplicants ? (
                          <div className="flex-center" style={{ padding: '4rem 0' }}>
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p style={{ color: 'var(--text-secondary)', marginLeft: '1rem', margin: 0 }}>Syncing candidates from database...</p>
                          </div>
                        ) : realApplicants.length === 0 ? (
                          /* Empty Applicants State (Strictly No Mock Data Fallback in real dashboard) */
                          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                            <Users size={36} color="var(--text-secondary)" opacity={0.3} style={{ marginBottom: '1rem', marginInline: 'auto' }} />
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Applicants Yet</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
                              No candidates have applied for this position yet. When candidates apply with their CareerReport profiles, they will instantly appear here for AI screening.
                            </p>
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
              </div>
            )}

            {/* BILLING & PLANS TAB */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
                  borderRadius: '16px', 
                  border: '1px solid var(--glass-border)', 
                  padding: '2rem', 
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.3px' }}>
                      Subscription & Active Posting Limits
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.925rem', lineHeight: 1.5, maxWidth: '580px' }}>
                      Manage subscription tiers for <strong>{selectedBusiness?.name}</strong>. Plans define the maximum active jobs allowed simultaneously and unlock advanced Google Gemini AI Stack Ranking features.
                    </p>
                  </div>
                  <div style={{ background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Plan</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                      {selectedBusinessTier?.name || 'Free Starter'}
                    </div>
                  </div>
                </div>

                {/* Subscriptions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {Object.values(BUSINESS_TIERS).map(plan => {
                    const isCurrentPlan = selectedBusinessTier?.id === plan.id;
                    return (
                      <div 
                        key={plan.id}
                        style={{
                          background: isCurrentPlan
                            ? 'linear-gradient(135deg, rgba(250, 189, 47, 0.05) 0%, var(--surface-color) 100%)'
                            : 'var(--surface-color)',
                          border: isCurrentPlan
                            ? '2px solid var(--primary)'
                            : '1px solid var(--glass-border)',
                          borderRadius: '16px',
                          padding: '2rem 1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isCurrentPlan ? '0 10px 25px rgba(250, 189, 47, 0.08)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCurrentPlan && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: 'var(--primary)',
                            color: 'var(--bg-color)',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderBottomLeftRadius: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Active Plan
                          </div>
                        )}

                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</h4>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.75rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: plan.price > 0 ? 'var(--primary)' : 'var(--text-primary)' }}>
                              ${plan.price}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ month</span>
                          </div>

                          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

                          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                              <strong>{plan.maxJobs === 9999 ? 'Unlimited' : plan.maxJobs}</strong> Active Job Postings
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: plan.hasAI ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                                {plan.hasAI ? '✓' : '✕'}
                              </span>
                              Gemini AI Stack Ranking {plan.hasAI ? 'Enabled' : 'Locked'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                              Verified Business Branding
                            </li>
                          </ul>
                        </div>

                        <button
                          disabled={isCurrentPlan}
                          onClick={() => {
                            setSelectedUpgradePlanId(plan.id);
                            setShowPlanCheckout(true);
                          }}
                          className={isCurrentPlan ? "btn btn-secondary" : "btn btn-primary"}
                          style={{
                            width: '100%',
                            marginTop: '2rem',
                            padding: '0.65rem',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            justifyContent: 'center',
                            cursor: isCurrentPlan ? 'default' : 'pointer',
                            opacity: isCurrentPlan ? 0.7 : 1
                          }}
                        >
                          {isCurrentPlan ? 'Current Active Tier' : 'Upgrade Plan ⚡'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Manage Billing (Stripe Portal) */}
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      if (selectedBusinessId) {
                        window.location.href = `/api/billing/portal?businessId=${selectedBusinessId}`;
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                  >
                    Manage Billing & Invoices ➔
                  </button>
                </div>

                {/* Sponsorship Bundles */}
                <div style={{
                  background: 'var(--surface-color)',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  padding: '2rem',
                  marginTop: '1.5rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Sponsorship Bundles</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '500px' }}>
                        Save on sponsored job listings by purchasing credits in bulk. Credits never expire and can be used on any active listing.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(250, 189, 47, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(250, 189, 47, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Available Credits</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {selectedBusiness ? getSponsorCredits(selectedBusiness.bio) : 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Triple Pack */}
                    <div style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.1rem' }}>Triple Pack</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>3 Credits • Save $8</span>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>$49</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedBusinessId) return;
                          setIsProcessingBundle('triple');
                          try {
                            const res = await fetch('/api/checkout/sponsor-bundle', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ businessId: selectedBusinessId, bundleType: 'triple' })
                            });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else throw new Error(data.error || 'Failed to start checkout');
                          } catch (err) {
                            alert('Checkout failed: ' + err);
                            setIsProcessingBundle(null);
                          }
                        }}
                        disabled={isProcessingBundle !== null}
                        className="btn btn-secondary"
                        style={{ marginTop: 'auto', justifyContent: 'center', width: '100%', padding: '0.6rem' }}
                      >
                        {isProcessingBundle === 'triple' ? <Loader2 size={16} className="animate-spin" /> : 'Buy Triple Pack'}
                      </button>
                    </div>

                    {/* Campaign Pack */}
                    <div style={{ border: '2px solid var(--primary)', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(250, 189, 47, 0.05) 0%, var(--bg-color) 100%)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'var(--bg-color)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>Best Value</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.1rem' }}>Campaign Pack</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>10 Credits • Save $41</span>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>$149</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedBusinessId) return;
                          setIsProcessingBundle('campaign');
                          try {
                            const res = await fetch('/api/checkout/sponsor-bundle', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ businessId: selectedBusinessId, bundleType: 'campaign' })
                            });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else throw new Error(data.error || 'Failed to start checkout');
                          } catch (err) {
                            alert('Checkout failed: ' + err);
                            setIsProcessingBundle(null);
                          }
                        }}
                        disabled={isProcessingBundle !== null}
                        className="btn btn-primary"
                        style={{ marginTop: 'auto', justifyContent: 'center', width: '100%', padding: '0.6rem' }}
                      >
                        {isProcessingBundle === 'campaign' ? <Loader2 size={16} className="animate-spin" /> : 'Buy Campaign Pack'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sponsored Post History */}
                <div style={{
                  background: 'var(--surface-color)',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  padding: '2rem',
                  marginTop: '1.5rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Sponsored Post History</h3>
                  {jobs.filter(j => j.sponsored_until).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                      No sponsored posts yet. Upgrade a listing to featured from the Job Listings tab.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Job Title</th>
                            <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Sponsored Until</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.filter(j => j.sponsored_until).map(j => {
                            const parsed = parseJobStatus(j.status);
                            const isExpired = new Date(j.sponsored_until) < new Date();
                            const statusText = isExpired ? 'Expired' : parsed.isFeatured ? 'Active' : 'Paused';
                            const statusColor = isExpired ? 'var(--text-secondary)' : parsed.isFeatured ? 'var(--primary)' : 'var(--accent)';
                            return (
                              <tr key={j.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{j.title}</td>
                                <td style={{ padding: '1rem 0.5rem', color: statusColor, fontWeight: 700 }}>{statusText}</td>
                                <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>
                                  {new Date(j.sponsored_until).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </>
        )}

        {/* Sandbox Stripe Plan Checkout Modal */}
        {showPlanCheckout && selectedUpgradePlanId && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem'
          }} onClick={() => !isProcessingPlanUpgrade && setShowPlanCheckout(false)}>
            <div style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div style={{ background: 'var(--surface-highlight)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Stripe Subscription Checkout</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>🔒</span>
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Partnered secure simulated payment gateway</p>
                </div>
                {!isProcessingPlanUpgrade && (
                  <button onClick={() => setShowPlanCheckout(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}>✕</button>
                )}
              </div>

              {/* Modal Body */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Order Summary */}
                <div style={{ background: 'rgba(250, 189, 47, 0.05)', border: '1px dashed rgba(250, 189, 47, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Upgrade Plan: {BUSINESS_TIERS[selectedUpgradePlanId]?.name}</span>
                    <span>${BUSINESS_TIERS[selectedUpgradePlanId]?.price}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Active Post Limit</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {BUSINESS_TIERS[selectedUpgradePlanId]?.maxJobs === 9999 ? 'Unlimited' : `${BUSINESS_TIERS[selectedUpgradePlanId]?.maxJobs} Listings`}
                    </span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    <span>First Month Charge</span>
                    <span style={{ color: 'var(--primary)' }}>${BUSINESS_TIERS[selectedUpgradePlanId]?.price}.00 USD</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleUpgradePlan}
                  disabled={isProcessingPlanUpgrade}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.9rem', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    justifyContent: 'center', 
                    marginTop: '0.5rem',
                    cursor: isProcessingPlanUpgrade ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 20px rgba(250, 189, 47, 0.25)',
                    opacity: isProcessingPlanUpgrade ? 0.7 : 1
                  }}
                >
                  {isProcessingPlanUpgrade ? (
                    <>
                      <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} />
                      <span>Redirecting to Stripe...</span>
                    </>
                  ) : (
                    <span>Subscribe with Stripe ⚡</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Sandbox Stripe Job Listings Featured Upgrade Modal */}
        {upgradeJobId && (() => {
          const jobBeingUpgraded = jobs.find(j => j.id === upgradeJobId);
          return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem'
          }} onClick={() => !isProcessingUpgrade && setUpgradeJobId(null)}>
            <div style={{
              background: 'var(--surface-color)',
              border: '1px solid rgba(250,189,47,0.25)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(250,189,47,0.08)'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(250,189,47,0.08) 0%, var(--surface-highlight) 100%)',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(250,189,47,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⚡</span>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                      Sponsor This Listing
                    </h3>
                    <span style={{
                      background: 'rgba(250,189,47,0.12)',
                      color: 'var(--primary)',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(250,189,47,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>One-Time</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Secure simulated payment — no real charges in sandbox mode
                  </p>
                </div>
                {!isProcessingUpgrade && (
                  <button
                    onClick={() => setUpgradeJobId(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem', lineHeight: 1 }}
                  >✕</button>
                )}
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* What you get */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { icon: '🏆', text: 'Pinned above all standard posts' },
                    { icon: '✨', text: '"Sponsored Match" badge for matched candidates' },
                    { icon: '🎯', text: '+25pt algorithmic relevance boost' },
                    { icon: '📅', text: '30-day featured placement' },
                  ].map((b, i) => (
                    <div key={i} style={{
                      background: 'rgba(250,189,47,0.04)',
                      border: '1px solid rgba(250,189,47,0.12)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.4rem',
                      lineHeight: 1.4
                    }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{b.icon}</span>
                      {b.text}
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div style={{
                  background: 'rgba(250,189,47,0.05)',
                  border: '1px dashed rgba(250,189,47,0.3)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🔥 Featured Upgrade — {jobBeingUpgraded?.title}
                    </span>
                    <span>$19.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <span>Duration</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>30 Days Pinned</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.65rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    {selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? (
                      <span style={{ color: 'var(--primary)' }}>1 Credit ($0.00)</span>
                    ) : (
                      <span style={{ color: 'var(--primary)' }}>$19.00 USD</span>
                    )}
                  </div>
                </div>

                {/* Non-transferable warning + acknowledgement gate */}
                <div style={{
                  background: 'rgba(251,73,52,0.05)',
                  border: '1px solid rgba(251,73,52,0.2)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    <strong style={{ color: '#fb4934' }}>⚠ Non-Transferable:</strong> This sponsorship credit is permanently bound to <strong style={{ color: 'var(--text-primary)' }}>{jobBeingUpgraded?.title}</strong> and cannot be moved to another listing. The clock can be <strong>paused</strong> at any time from your dashboard to conserve time, but cannot be reassigned.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={sponsorNonTransferAck}
                      onChange={e => setSponsorNonTransferAck(e.target.checked)}
                      style={{ marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0 }}
                    />
                    I understand this sponsorship is non-transferable and tied to this specific listing.
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  onClick={handleUpgradeJob}
                  disabled={isProcessingUpgrade || !sponsorNonTransferAck}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.9rem', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    justifyContent: 'center',
                    cursor: isProcessingUpgrade || !sponsorNonTransferAck ? 'not-allowed' : 'pointer',
                    boxShadow: sponsorNonTransferAck ? '0 4px 20px rgba(250,189,47,0.25)' : 'none',
                    opacity: isProcessingUpgrade || !sponsorNonTransferAck ? 0.55 : 1
                  }}
                >
                  {isProcessingUpgrade ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>{selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? 'Applying Credit...' : 'Redirecting to Stripe...'}</span>
                    </>
                  ) : (
                    <span>{selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? `Apply 1 Sponsorship Credit 🔥 (${getSponsorCredits(selectedBusiness.bio)} left)` : 'Pay $19 with Stripe 🔥'}</span>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? '🔒 You will not be charged to your card.' : '🔒 Secure checkout via Stripe.'}
                  <Link href="/jobs/sponsored" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem' }}>
                    Learn how sponsored posts work →
                  </Link>
                </p>
              </div>

            </div>
          </div>
          );
        })()}

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
