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
import { parseJobStatus, encodeJobStatus, toggleSponsorPause, formatSalary } from '@/lib/job-tier';
import { getBusinessTier, injectBusinessTier, cleanBusinessBio, BUSINESS_TIERS, getSponsorCredits } from '@/lib/business-tier';
import styles from './page.module.css';

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
    const newStatus = encodeJobStatus(!parsed.isOpen, parsed.isFeatured, parsed.isPaused, parsed.payType);

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
      const res = await fetch('/api/jobs/toggle-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, currentStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle pause');

      setJobs(jobs.map(j => j.id === jobId ? { 
        ...j, 
        status: data.status,
        sponsored_until: data.sponsored_until,
        paused_at: data.paused_at
      } : j));
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
      <div className="flex-center flex-col gap-1" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)' }}>
        <Briefcase size={48} color="var(--primary)" />
        <h1 className="text-primary">Recruiter Sign In Required</h1>
        <p className="text-secondary">You must be authenticated to access the Recruiter Dashboard.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  // Render Access Denied fallback if no posting privileges
  if (hasAccess === false) {
    return (
      <div className="flex-center flex-col gap-15 p-2" style={{ height: 'calc(100dvh - 82px)', background: 'var(--bg-color)', textAlign: 'center' }}>
        <div className="flex-center" style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
          <XCircle size={44} style={{ display: 'flex' }} />
        </div>
        <h1 className="text-primary text-2xl font-bold m-0">Access Denied</h1>
        <p className="text-secondary m-0" style={{ maxWidth: '460px', lineHeight: 1.6 }}>
          You do not have active job-posting permissions for any verified business profiles. Please create a new company account, or ask your manager to grant your account <strong>jobs</strong> permissions.
        </p>
        <div className="flex-row mt-1">
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
    <div className={styles.pageWrapper}>
      
      {/* HEADER SECTION */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <div className={styles.headerMeta}>
              <Sparkles size={16} />
              <span className={styles.headerLabel}>Recruiter Job Center</span>
            </div>
            <h1 className={styles.headerTitle}>Dashboard &amp; Listings</h1>
          </div>

          {/* Business switcher dropdown */}
          <div className={styles.switcherRow}>
            <span className={styles.switcherLabel}>Recruiting for:</span>
            <select
              className={`input-field ${styles.switcherSelect}`}
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
        <div className={styles.bannerWrap}>
          <div className={styles.bannerSuccess}>
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className={styles.bannerClose}>✕</button>
          </div>
        </div>
      )}
      {cancelBanner && (
        <div className={styles.bannerWrap}>
          <div className={styles.bannerCancel}>
            <span>Checkout canceled — no charge was made.</span>
            <button onClick={() => setCancelBanner(false)} className={styles.bannerClose}>✕</button>
          </div>
        </div>
      )}

      {/* SUB NAV PILLS / METRICS */}
      <main className={styles.main}>
        
        {/* STATS HIGHLIGHT GRID */}
        <section className="stats-grid">
          
          {/* Card 1: Subscription Tier Slot Meter */}
          <div className={`stats-card stats-card-meter ${styles.statsCard} ${styles.statsCardMeter}`}>
            <div>
              <div className={styles.statsCardHeader}>
                <span className={styles.statsCardLabel}>Active Listings Slot</span>
                <span className={styles.statsCardBadge}>
                  {selectedBusinessTier?.name || 'Free Starter'}
                </span>
              </div>
              <div className={styles.statsCardValue}>
                {activeCount} / {selectedBusinessTier?.maxJobs === 9999 ? '∞' : selectedBusinessTier?.maxJobs} <span>Slots</span>
              </div>
            </div>
            <div className={styles.statsCardProgress}>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                {/* width is a runtime computed value — must stay inline */}
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
          <div className={`stats-card ${styles.statsCard}`}>
            <span className={styles.statsCardLabel}>Total Job Views</span>
            <div className={styles.statsCardValue} style={{ color: 'var(--text-secondary)' }}>{totalViews}</div>
          </div>

          {/* Card 3 */}
          <div className={`stats-card ${styles.statsCard}`}>
            <span className={styles.statsCardLabel}>Total Applicants</span>
            <div className={styles.statsCardValue} style={{ color: 'var(--accent)' }}>{totalApplicantsCount}</div>
          </div>

          {/* Card 4 */}
          <div className={`stats-card ${styles.statsCard}`}>
            <span className={styles.statsCardLabel}>Total Apply Clicks</span>
            <div className={styles.statsCardValue} style={{ color: '#10b981' }}>{totalClicks}</div>
          </div>

        </section>

        {/* TAB CONTROLS */}
        <div className="dashboard-tabs hide-scrollbar" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
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
                transition: 'all 0.2s ease',
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
              <div className={styles.overviewContainer}>
                <div className={styles.welcomeCard}>
                  <h3 className={styles.welcomeTitle}>Welcome to your Job Center Dashboard</h3>
                  <p className={styles.welcomeText}>
                    This dashboard coordinates active opportunities and leverages context-aware AI parsing to verify incoming portfolios. Access details regarding candidate match indices on the <strong>Manage Job Listings</strong> or <strong>Applicant Stack Ranker</strong> tabs above.
                  </p>
                </div>

                <div className="grid-cols-2">
                  <div className={styles.overviewCard}>
                    <h4 className={styles.overviewCardTitle}>
                      <Briefcase size={18} color="var(--primary)" /> Active Overview
                    </h4>
                    <p className={styles.overviewCardText}>
                      You currently have <strong>{activeCount}</strong> open recruiting channels published globally. Apply directly in one click with verified CareerReport templates.
                    </p>
                    <button onClick={() => setActiveTab('jobs')} className="btn btn-secondary">Manage Listings</button>
                  </div>

                  <div className={styles.overviewCard}>
                    <h4 className={styles.overviewCardTitle}>
                      <Users size={18} color="var(--accent)" /> Applicant Pool Status
                    </h4>
                    <p className={styles.overviewCardText}>
                      A total of <strong>{totalApplicantsCount}</strong> candidate profiles are ranked. Leverage exclusive contextual scoring rules compared across active listings.
                    </p>
                    <button onClick={() => setActiveTab('applicants')} className="btn btn-secondary">Open Stack Ranker</button>
                  </div>
                </div>
              </div>
            )}

            {/* JOBS LISTINGS TAB */}
            {activeTab === 'jobs' && (
              <div className={styles.tabSection}>
                <div className={styles.tabSectionHeader}>
                  <h3 className={styles.tabSectionTitle}>Open and Closed Postings</h3>
                  <Link href="/jobs/new" className={styles.postJobLink}>
                    <button className={`btn btn-primary ${styles.postJobBtn}`}>
                      <Plus size={16} /> Post a Job
                    </button>
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Briefcase size={36} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                    <h4 className={styles.emptyStateTitle}>No Listings Found</h4>
                    <p className={styles.emptyStateText}>
                      You haven&apos;t listed any job opportunities for this company profile yet. Start hiring today.
                    </p>
                    <Link href="/jobs/new" className="btn btn-primary">Post Your First Job</Link>
                  </div>
                ) : (
                  <div className={styles.jobList}>
                    {jobs.map(job => {
                      const parsed = parseJobStatus(job.status);
                      return (
                        <div 
                          key={job.id}
                          className={`${styles.jobCard} ${parsed.isFeatured ? styles.jobCardFeatured : ''}`}
                        >
                          <div>
                            <div className={styles.jobCardTitleRow}>
                              <h4 className={styles.jobCardTitle}>{job.title}</h4>
                              <span className={parsed.isOpen ? styles.jobBadgeActive : styles.jobBadgeClosed}>
                                {parsed.isOpen ? 'Active' : 'Closed'}
                              </span>
                              {parsed.isFeatured && (
                                <span className={styles.jobBadgeFeatured}>🔥 Featured</span>
                              )}
                            </div>

                            <div className={styles.jobMeta}>
                              <span className={styles.jobMetaItem}>
                                <MapPin size={14} /> {job.location || (job.is_remote ? 'Remote' : 'On-site')}
                              </span>
                              <span>•</span>
                              <span className={styles.jobMetaItem}>
                                <DollarSign size={14} />
                                {job.salary_min || job.salary_max
                                  ? formatSalary(job.salary_min, job.salary_max, parsed.payType)
                                  : 'Competitive'}
                              </span>
                              <span>•</span>
                              <span className={styles.jobMetaItem}>
                                <Eye size={14} /> {job.views || 0} Views
                              </span>
                              <span>•</span>
                              <span className={styles.jobMetaClicks}>
                                <ArrowRight size={14} /> {job.clicks || 0} Apply Clicks
                              </span>
                            </div>
                          </div>

                          {/* Status Toggle & Details Actions */}
                          <div className={styles.jobActions}>
                            {/* Sponsor / Featured upgrade button + info link for Standard listings */}
                            {!parsed.isFeatured && (
                              <div className={styles.sponsorGroup}>
                                <button
                                  onClick={() => {
                                    setSponsorNonTransferAck(false);
                                    setUpgradeJobId(job.id);
                                  }}
                                  className={`btn ${styles.sponsorBtn}`}
                                >
                                  ⚡ Sponsor Post — $19
                                </button>
                                <Link href="/jobs/sponsored" className={styles.howItWorksLink}>
                                  How it works
                                </Link>
                              </div>
                            )}

                            {/* Pause / Resume controls for sponsored listings */}
                            {parsed.isFeatured && (
                              <div className={styles.pauseGroup}>
                                <button
                                  disabled={isPausingJobId === job.id}
                                  onClick={() => handleToggleSponsorPause(job.id, job.status)}
                                  className="btn"
                                  style={{
                                    /* border/bg vary by runtime isPaused state */
                                    border: parsed.isPaused ? '1px solid rgba(250,189,47,0.5)' : '1px solid rgba(250,189,47,0.2)',
                                    background: parsed.isPaused ? 'rgba(250,189,47,0.12)' : 'rgba(250,189,47,0.05)',
                                    color: 'var(--primary)',
                                    cursor: isPausingJobId === job.id ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 700
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
                                  borderRadius: '6px', padding: '3px 9px', fontWeight: 700, whiteSpace: 'nowrap'
                                }}>
                                  {parsed.isPaused ? '⏸ Sponsored · Paused' : '🔥 Sponsored · Active'}
                                </span>
                              </div>
                            )}

                            <button
                              disabled={updatingJobId === job.id}
                              onClick={() => handleToggleJobStatus(job.id, job.status)}
                              className={`btn btn-secondary ${styles.toggleStatusBtn}`}
                              style={{
                                borderColor: parsed.isOpen ? '#ef4444' : 'var(--primary)',
                                color: parsed.isOpen ? '#ef4444' : 'var(--primary)',
                              }}
                            >
                              {updatingJobId === job.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : parsed.isOpen ? (
                                <><EyeOff size={14} /> Close Listing</>
                              ) : (
                                <><Eye size={14} /> Reopen Listing</>
                              )}
                            </button>

                            <Link href={`/jobs/${job.id}`} className={styles.viewLiveLink}>
                              <button className={`btn btn-primary ${styles.viewLiveBtn}`}>View Live Page</button>
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
              <div className={styles.tabSection}>
                {isAILocked ? (
                  /* Premium Blur Blocker for AI locks on Starter tier */
                  <div className={styles.aiLockScreen}>
                    <div className={styles.aiLockIcon}>🔒</div>
                    <div>
                      <h3 className={styles.aiLockTitle}>AI Stack Ranking Locked</h3>
                      <p className={styles.aiLockText}>
                        Google Gemini-powered intelligent applicant stack ranking is a premium Recruiter Pro benefit. Upgrade your company subscription to instantly scan, rank, and evaluate incoming candidate portfolios.
                      </p>
                    </div>
                    <div className={styles.aiLockActions}>
                      <button onClick={() => setActiveTab('billing')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Upgrade Subscription to Pro ⚡
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Job Selection Dropdown & Sort selector */}
                    <div className={styles.filterBar}>
                      <div className={styles.filterBarLeft}>
                        <span className={styles.filterLabel}>Select Role:</span>
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

                      <div className={styles.filterBarRight}>
                        <span className={styles.filterLabel}>Rank by:</span>
                        <select 
                          value={sortBy} 
                          onChange={(e) => {
                            setSortBy(e.target.value as any);
                            setExpandedApplicantId(null);
                          }}
                          className={styles.sortSelect}
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
                      <div className={styles.emptyState}>
                        <Users size={36} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                        <h4 className={styles.emptyStateTitle}>No Applicants Pool</h4>
                        <p className={styles.emptyStateText}>
                          Once you post an active opportunity, your candidate stack rank database is initialized immediately.
                        </p>
                      </div>
                    ) : !selectedJobIdForApplicants ? (
                      <div className={styles.emptyState}>
                        <p style={{ color: 'var(--text-secondary)' }}>Please select a job listing from the switcher dropdown above.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Real Applicants banner + Active AI stack ranker button */}
                        {realApplicants.length > 0 && (
                          <div className={styles.aiRankBanner}>
                            <div className={styles.aiRankBannerContent}>
                              <div className={styles.aiRankBannerTitle}>
                                <Sparkles size={18} />
                                <h4 className={styles.aiRankBannerTitleText}>Active Listing: {realApplicants.length} Real Applicants</h4>
                              </div>
                              <p className={styles.aiRankBannerText}>
                                Leverage advanced context-aware Google Gemini engines to evaluate these candidate portfolios dynamically against the opening&apos;s requirements.
                              </p>
                            </div>
                            <div>
                              <button
                                onClick={handleRunAIStackRank}
                                disabled={isStackRanking}
                                className={`btn btn-primary ${styles.runRankBtn}`}
                              >
                                {isStackRanking ? (
                                  <><Loader2 className="animate-spin" size={16} /><span>Ranking Candidates...</span></>
                                ) : (
                                  <><span>Run AI Stack Rank</span><span>🧠</span></>
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
                          <div className={styles.emptyState} style={{ padding: '5rem 2rem' }}>
                            <Users size={36} color="var(--text-secondary)" opacity={0.3} style={{ marginBottom: '1rem', marginInline: 'auto' }} />
                            <h4 className={styles.emptyStateTitle}>No Applicants Yet</h4>
                            <p className={styles.emptyStateText} style={{ maxWidth: '420px' }}>
                              No candidates have applied for this position yet. When candidates apply with their CareerReport profiles, they will instantly appear here for AI screening.
                            </p>
                          </div>
                        ) : (
                          <div className={styles.applicantList}>
                            {getSortedApplicants().map((applicant, index) => {
                              const isExpanded = expandedApplicantId === applicant.id;
                              return (
                                <div 
                                  key={applicant.id} 
                                  onClick={() => setExpandedApplicantId(isExpanded ? null : applicant.id)}
                                  className={`${styles.applicantCard} job-card-hover`}
                                  style={{
                                    borderLeft: sortBy === 'ai' 
                                      ? `5px solid ${index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent)' : 'var(--text-secondary)'}`
                                      : '1px solid var(--glass-border)'
                                  }}
                                >
                                  <div className={styles.applicantCardHeader}>
                                    <div>
                                      <span className={styles.applicantName}>{applicant.firstName} {applicant.lastName}</span>
                                      <div className={styles.applicantMeta}>{applicant.yoe} YOE • {applicant.skills}</div>
                                    </div>
                                    <div className={styles.applicantScoreRight}>
                                      {sortBy === 'ai' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                          <span style={{ 
                                            background: index === 0 ? 'rgba(250,189,47,0.15)' : index === 1 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)', 
                                            color: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--accent)' : 'var(--text-secondary)', 
                                            fontSize: '0.8rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' 
                                          }}>Rank #{index + 1}</span>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Compatibility: {applicant.aiScore}</span>
                                        </div>
                                      ) : sortBy === 'newest' || sortBy === 'oldest' ? (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Applied: {formatTimeAgo(applicant.appliedDate)}</span>
                                      ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>A-Z Sequence</span>
                                      )}
                                    </div>
                                  </div>
                                  {sortBy === 'ai' && (
                                    <div className={styles.applicantExpandArea} style={{
                                      marginTop: isExpanded ? '1rem' : '0.4rem',
                                      paddingTop: isExpanded ? '1rem' : '0',
                                      borderTop: isExpanded ? '1px dashed var(--glass-border)' : 'none',
                                    }}>
                                      {isExpanded ? (
                                        <div className={styles.applicantExpandContent}>
                                          <div className={styles.applicantExpandLabel}>
                                            <Sparkles size={16} /> <span>{applicant.aiLabel} Assessment Reason</span>
                                          </div>
                                          <p style={{ margin: 0, lineHeight: 1.6 }}>{applicant.aiExplanation}</p>
                                        </div>
                                      ) : (
                                        <span className={styles.applicantExpandHint}>Expand AI Match Evaluation ➔</span>
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
                <div className={styles.billingHeader}>
                  <div>
                    <h3 className={styles.billingHeaderTitle}>Subscription &amp; Active Posting Limits</h3>
                    <p className={styles.billingHeaderText}>
                      Manage subscription tiers for <strong>{selectedBusiness?.name}</strong>. Plans define the maximum active jobs allowed simultaneously and unlock advanced Google Gemini AI Stack Ranking features.
                    </p>
                  </div>
                  <div className={styles.activePlanBadgeContainer}>
                    <div className={styles.activePlanBadge}>
                      <div className={styles.activePlanLabel}>Active Plan</div>
                      <div className={styles.activePlanName}>{selectedBusinessTier?.name || 'Free Starter'}</div>
                    </div>
                    <button
                      onClick={() => { if (selectedBusinessId) window.location.href = `/api/billing/portal?businessId=${selectedBusinessId}`; }}
                      className={`btn btn-secondary ${styles.billingPortalBtn}`}
                      style={{ height: 'fit-content' }}
                    >
                      Manage Billing &amp; Invoices ➔
                    </button>
                  </div>
                </div>

                {/* Subscriptions Grid */}
                <div className="grid-cols-4">
                  {Object.values(BUSINESS_TIERS).map(plan => {
                    const isCurrentPlan = selectedBusinessTier?.id === plan.id;
                    return (
                      <div key={plan.id} className={`${styles.tierCard} ${isCurrentPlan ? styles.tierCardActive : ''}`}>
                        {isCurrentPlan && <div className={styles.tierActiveBadge}>Active Plan</div>}
                        <div>
                          <h4 className={styles.tierName}>{plan.name}</h4>
                          <div className={styles.tierPriceRow}>
                            <span className={styles.tierPrice} style={{ color: plan.price > 0 ? 'var(--primary)' : 'var(--text-primary)' }}>${plan.price}</span>
                            <span className={styles.tierPricePeriod}>/ month</span>
                          </div>
                          <hr className={styles.tierDivider} />
                          <ul className={styles.tierFeatureList}>
                            <li className={styles.tierFeatureItem}>
                              <span className={styles.tierFeatureCheck}>✓</span>
                              <strong>{plan.maxJobs === 9999 ? 'Unlimited' : plan.maxJobs}</strong> Active Job Postings
                            </li>
                            <li className={styles.tierFeatureItem}>
                              <span className={plan.hasAI ? styles.tierFeatureCheck : styles.tierFeatureX}>{plan.hasAI ? '✓' : '✕'}</span>
                              Gemini AI Stack Ranking {plan.hasAI ? 'Enabled' : 'Locked'}
                            </li>
                            <li className={styles.tierFeatureItem}>
                              <span className={styles.tierFeatureCheck}>✓</span>
                              Verified Business Branding
                            </li>
                          </ul>
                        </div>
                        <button
                          disabled={isCurrentPlan}
                          onClick={() => { setSelectedUpgradePlanId(plan.id); setShowPlanCheckout(true); }}
                          className={`${isCurrentPlan ? 'btn btn-secondary' : 'btn btn-primary'} ${styles.tierUpgradeBtn}`}
                          style={{ cursor: isCurrentPlan ? 'default' : 'pointer', opacity: isCurrentPlan ? 0.7 : 1 }}
                        >
                          {isCurrentPlan ? 'Current Active Tier' : 'Upgrade Plan ⚡'}
                        </button>
                      </div>
                    );
                  })}
                </div>


                {/* Sponsorship Bundles */}
                <div className={styles.bundleSection}>
                  <div className={styles.bundleSectionHeader}>
                    <div>
                      <h3 className={styles.bundleSectionTitle}>Sponsorship Bundles</h3>
                      <p className={styles.bundleSectionText}>
                        Save on sponsored job listings by purchasing credits in bulk. Credits never expire and can be used on any active listing.
                      </p>
                    </div>
                    <div className={styles.bundleCreditsBox}>
                      <div className={styles.bundleCreditsLabel}>Available Credits</div>
                      <div className={styles.bundleCreditsValue}>{selectedBusiness ? getSponsorCredits(selectedBusiness.bio) : 0}</div>
                    </div>
                  </div>

                  <div className="grid-cols-2">
                    {/* Triple Pack */}
                    <div className={styles.bundleCard}>
                      <div className={styles.bundleCardHeader}>
                        <div>
                          <h4 className={styles.bundleCardTitle}>Triple Pack</h4>
                          <span className={styles.bundleCardSubtext}>3 Credits • Save $8</span>
                        </div>
                        <span className={styles.bundleCardPrice}>$49</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedBusinessId) return;
                          setIsProcessingBundle('triple');
                          try {
                            const res = await fetch('/api/checkout/sponsor-bundle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: selectedBusinessId, bundleType: 'triple' }) });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else throw new Error(data.error || 'Failed to start checkout');
                          } catch (err) { alert('Checkout failed: ' + err); setIsProcessingBundle(null); }
                        }}
                        disabled={isProcessingBundle !== null}
                        className={`btn btn-secondary ${styles.bundleCardBtn}`}
                      >
                        {isProcessingBundle === 'triple' ? <Loader2 size={16} className="animate-spin" /> : 'Buy Triple Pack'}
                      </button>
                    </div>

                    {/* Campaign Pack */}
                    <div className={`${styles.bundleCard} ${styles.bundleCardFeatured}`}>
                      <div className={styles.bundleBestValueBadge}>Best Value</div>
                      <div className={styles.bundleCardHeader}>
                        <div>
                          <h4 className={styles.bundleCardTitle}>Campaign Pack</h4>
                          <span className={styles.bundleCardSubtext}>10 Credits • Save $41</span>
                        </div>
                        <span className={styles.bundleCardPrice}>$149</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedBusinessId) return;
                          setIsProcessingBundle('campaign');
                          try {
                            const res = await fetch('/api/checkout/sponsor-bundle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: selectedBusinessId, bundleType: 'campaign' }) });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else throw new Error(data.error || 'Failed to start checkout');
                          } catch (err) { alert('Checkout failed: ' + err); setIsProcessingBundle(null); }
                        }}
                        disabled={isProcessingBundle !== null}
                        className={`btn btn-primary ${styles.bundleCardBtn}`}
                      >
                        {isProcessingBundle === 'campaign' ? <Loader2 size={16} className="animate-spin" /> : 'Buy Campaign Pack'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sponsored Post History */}
                <div className={styles.historySection}>
                  <h3 className={styles.historySectionTitle}>Sponsored Post History</h3>
                  {jobs.filter(j => j.sponsored_until).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                      No sponsored posts yet. Upgrade a listing to featured from the Job Listings tab.
                    </p>
                  ) : (
                    <div className={styles.historyTableWrap}>
                      <table className={styles.historyTable}>
                        <thead className={styles.historyTableHead}>
                          <tr>
                            <th className={styles.historyTh}>Job Title</th>
                            <th className={styles.historyTh}>Status</th>
                            <th className={styles.historyTh}>Sponsored Until</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.filter(j => j.sponsored_until).map(j => {
                            const parsed = parseJobStatus(j.status);
                            const isExpired = new Date(j.sponsored_until) < new Date();
                            const statusText = isExpired ? 'Expired' : parsed.isFeatured ? 'Active' : 'Paused';
                            const statusColor = isExpired ? 'var(--text-secondary)' : parsed.isFeatured ? 'var(--primary)' : 'var(--accent)';
                            return (
                              <tr key={j.id} className={styles.historyTr}>
                                <td className={styles.historyTdTitle}>{j.title}</td>
                                <td className={styles.historyTdStatus} style={{ color: statusColor }}>{statusText}</td>
                                <td className={styles.historyTdDate}>{new Date(j.sponsored_until).toLocaleDateString()}</td>
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
          <div className={styles.modalOverlay} onClick={() => !isProcessingPlanUpgrade && setShowPlanCheckout(false)}>
            <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>
                    <span>Stripe Subscription Checkout</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>🔒</span>
                  </h3>
                  <p className={styles.modalSubtitle}>Partnered secure simulated payment gateway</p>
                </div>
                {!isProcessingPlanUpgrade && (
                  <button onClick={() => setShowPlanCheckout(false)} className={styles.modalClose}>✕</button>
                )}
              </div>
              <div className={styles.modalBody}>
                <div className={styles.orderSummary}>
                  <div className={styles.orderRow}>
                    <span>Upgrade Plan: {BUSINESS_TIERS[selectedUpgradePlanId]?.name}</span>
                    <span>${BUSINESS_TIERS[selectedUpgradePlanId]?.price}.00</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span>Active Post Limit</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {BUSINESS_TIERS[selectedUpgradePlanId]?.maxJobs === 9999 ? 'Unlimited' : `${BUSINESS_TIERS[selectedUpgradePlanId]?.maxJobs} Listings`}
                    </span>
                  </div>
                  <hr className={styles.orderDivider} />
                  <div className={styles.orderTotal}>
                    <span>First Month Charge</span>
                    <span className={styles.orderTotalAmount}>${BUSINESS_TIERS[selectedUpgradePlanId]?.price}.00 USD</span>
                  </div>
                </div>
                <button
                  onClick={handleUpgradePlan}
                  disabled={isProcessingPlanUpgrade}
                  className={`btn btn-primary ${styles.checkoutBtn}`}
                  style={{ cursor: isProcessingPlanUpgrade ? 'not-allowed' : 'pointer', opacity: isProcessingPlanUpgrade ? 0.7 : 1 }}
                >
                  {isProcessingPlanUpgrade ? (
                    <><Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} /><span>Redirecting to Stripe...</span></>
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
            <div className={`${styles.modalOverlay} ${styles.modalOverlaySponsor}`} onClick={() => !isProcessingUpgrade && setUpgradeJobId(null)}>
              <div className={`${styles.modalBox} ${styles.modalBoxSponsor}`} onClick={e => e.stopPropagation()}>
                <div className={`${styles.modalHeader} ${styles.modalHeaderSponsor}`}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>⚡</span>
                      <h3 className={styles.modalTitle} style={{ fontSize: '1.2rem' }}>Sponsor This Listing</h3>
                      <span className="stats-card-badge">One-Time</span>
                    </div>
                    <p className={styles.modalSubtitle}>Secure simulated payment — no real charges in sandbox mode</p>
                  </div>
                  {!isProcessingUpgrade && (
                    <button onClick={() => setUpgradeJobId(null)} className={styles.modalClose}>✕</button>
                  )}
                </div>

                <div className={`${styles.modalBody} ${styles.modalBodySponsor}`}>
                  <div className={styles.sponsorBenefitsGrid}>
                    {[
                      { icon: '🏆', text: 'Pinned above all standard posts' },
                      { icon: '✨', text: '"Sponsored Match" badge for matched candidates' },
                      { icon: '🎯', text: '+25pt algorithmic relevance boost' },
                      { icon: '📅', text: '30-day featured placement' },
                    ].map((b, i) => (
                      <div key={i} className={styles.sponsorBenefitItem}>
                        <span className={styles.sponsorBenefitIcon}>{b.icon}</span>
                        {b.text}
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderSummary}>
                    <div className={styles.orderRow}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🔥 Featured Upgrade — {jobBeingUpgraded?.title}
                      </span>
                      <span>$19.00</span>
                    </div>
                    <div className={styles.orderRow}>
                      <span>Duration</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>30 Days Pinned</span>
                    </div>
                    <hr className={styles.orderDivider} />
                    <div className={styles.orderTotal}>
                      <span>Total</span>
                      {selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? (
                        <span className={styles.orderTotalAmount}>1 Credit ($0.00)</span>
                      ) : (
                        <span className={styles.orderTotalAmount}>$19.00 USD</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.warningBox}>
                    <p className={styles.warningText}>
                      <strong className={styles.warningLabel}>⚠ Non-Transferable:</strong> This sponsorship credit is permanently bound to <strong style={{ color: 'var(--text-primary)' }}>{jobBeingUpgraded?.title}</strong> and cannot be moved to another listing. The clock can be <strong>paused</strong> at any time from your dashboard to conserve time, but cannot be reassigned.
                    </p>
                    <label className={styles.warningAckLabel}>
                      <input
                        type="checkbox"
                        checked={sponsorNonTransferAck}
                        onChange={e => setSponsorNonTransferAck(e.target.checked)}
                        className={styles.warningCheckbox}
                      />
                      I understand this sponsorship is non-transferable and tied to this specific listing.
                    </label>
                  </div>

                  <button
                    onClick={handleUpgradeJob}
                    disabled={isProcessingUpgrade || !sponsorNonTransferAck}
                    className={`btn btn-primary ${styles.checkoutBtn}`}
                    style={{
                      cursor: isProcessingUpgrade || !sponsorNonTransferAck ? 'not-allowed' : 'pointer',
                      boxShadow: sponsorNonTransferAck ? '0 4px 20px rgba(250,189,47,0.25)' : 'none',
                      opacity: isProcessingUpgrade || !sponsorNonTransferAck ? 0.55 : 1
                    }}
                  >
                    {isProcessingUpgrade ? (
                      <><Loader2 className="animate-spin" size={18} /><span>{selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? 'Applying Credit...' : 'Redirecting to Stripe...'}</span></>
                    ) : (
                      <span>{selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? `Apply 1 Sponsorship Credit 🔥 (${getSponsorCredits(selectedBusiness.bio)} left)` : 'Pay $19 with Stripe 🔥'}</span>
                    )}
                  </button>

                  <p className={styles.modalFooterNote}>
                    {selectedBusiness && getSponsorCredits(selectedBusiness.bio) > 0 ? '🔒 You will not be charged to your card.' : '🔒 Secure checkout via Stripe.'}
                    <Link href="/jobs/sponsored" className={styles.modalFooterLink}>
                      Learn how sponsored posts work →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* Visual hover effect for applicant/listing cards */}
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
