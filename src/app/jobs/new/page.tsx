"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, MapPin, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getBusinessTier } from '@/lib/business-tier';
import { encodeJobStatus } from '@/lib/job-tier';

export default function CreateJobPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [payType, setPayType] = useState<'salary' | 'hourly' | 'contract'>('salary');
  const [jobType, setJobType] = useState('Full-time');
  const [workArrangement, setWorkArrangement] = useState('On-site');
  const [location, setLocation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [error, setError] = useState('');

  // Pay Structure & Payment states
  const [tier, setTier] = useState<'standard' | 'featured'>('standard');
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Active listings capacity checks
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [selectedBusinessTier, setSelectedBusinessTier] = useState<any>(null);
  const [isCapped, setIsCapped] = useState(false);
  const [checkingCap, setCheckingCap] = useState(false);

  useEffect(() => {
    async function loadBusinesses() {
      if (!isSignedIn || !user) return;

      try {
        const token = await getToken({ template: 'supabase' });

        // 1. Fetch businesses owned by user (with bio column for plan tiers)
        const { data: owned, error: ownedErr } = await supabase
          .from('business_profiles')
          .select('id, name, slug, bio')
          .eq('owner_id', user.id);

        if (ownedErr) throw ownedErr;

        // 2. Fetch employee businesses with jobs permission
        const { data: employeeData, error: empErr } = await supabase
          .from('company_employees')
          .select(`
            business_id,
            status,
            business_profiles:business_id (
              id,
              name,
              slug,
              bio
            )
          `)
          .eq('user_id', user.id)
          .like('status', 'approved%');

        if (empErr) {
          console.error("Employee fetch error:", empErr);
        }

        // Combine unique business listings
        const combinedMap = new Map<string, { id: string; name: string; slug: string; bio: string | null }>();

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
        }
      } catch (err) {
        console.error("Failed to load businesses", err);
      } finally {
        setIsLoadingBusinesses(false);
      }
    }

    if (isLoaded && isSignedIn) {
      loadBusinesses();
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingBusinesses(false);
    }
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  // Monitor active postings counts and trigger capacity caps on change
  useEffect(() => {
    async function checkPlanCap() {
      if (!selectedBusinessId || businesses.length === 0) return;
      setCheckingCap(true);

      try {
        const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
        if (!selectedBusiness) return;

        const parsedTier = getBusinessTier(selectedBusiness.bio);
        setSelectedBusinessTier(parsedTier);

        // Query current active job listings
        const { count, error } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', selectedBusinessId)
          .like('status', 'open%');

        if (error) throw error;

        const activeCount = count || 0;
        setActiveJobsCount(activeCount);
        setIsCapped(activeCount >= parsedTier.maxJobs);
      } catch (err) {
        console.error("Failed to check active jobs cap:", err);
      } finally {
        setCheckingCap(false);
      }
    }

    checkPlanCap();
  }, [selectedBusinessId, businesses]);

  if (!isLoaded || isLoadingBusinesses) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Sign In Required</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You must be signed in to post a job.</p>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex-center" style={{ height: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
        <Building2 size={48} color="var(--primary)" />
        <h1 style={{ color: 'var(--text-primary)' }}>Create a Business First</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          You must have a registered business profile on CareerReport before you can post job listings.
        </p>
        <Link href="/business/create" className="btn btn-primary">Create Business Profile</Link>
      </div>
    );
  }

  // Triggered when completing checkout for a featured job post
  const handleCompleteFeaturedPost = async () => {
    setIsProcessingPayment(true);
    setError('');

    try {
      // Simulate Stripe/gateway handshake
      await new Promise(resolve => setTimeout(resolve, 2000));

      const token = await getToken({ template: 'supabase' });

      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          business_id: selectedBusinessId,
          title,
          description,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          is_remote: workArrangement === 'Remote',
          location: location ? `${location} • ${workArrangement} • ${jobType}` : `${workArrangement} • ${jobType}`,
          status: encodeJobStatus(true, true, false, payType) // active, featured, not paused, dynamic payType
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setShowCheckout(false);
      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment accepted but listing creation failed. Please contact support.');
      setShowCheckout(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If Featured is selected, interrupt and trigger the secure checkout modal
    if (tier === 'featured') {
      setShowCheckout(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken({ template: 'supabase' });

      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          business_id: selectedBusinessId,
          title,
          description,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          is_remote: workArrangement === 'Remote',
          location: location ? `${location} • ${workArrangement} • ${jobType}` : `${workArrangement} • ${jobType}`,
          status: encodeJobStatus(true, false, false, payType) // active, standard, not paused, dynamic payType
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to post job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100dvh - 82px)', background: 'var(--bg-color)', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(169, 182, 101, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={32} color="var(--success)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Post a New Job</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Reach thousands of top-tier professionals instantly.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Posting on behalf of</label>
            <select
              className="input-field"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {isCapped ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 189, 47, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(250, 189, 47, 0.35)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              marginTop: '0.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(250, 189, 47, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid rgba(250, 189, 47, 0.3)',
                boxShadow: '0 0 25px rgba(250, 189, 47, 0.15)',
                fontSize: '1.75rem',
                fontWeight: 'bold'
              }}>
                ⚡
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
                  Plan Active Posting Limit Reached
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, maxWidth: '480px' }}>
                  Your business <strong>{businesses.find(b => b.id === selectedBusinessId)?.name}</strong> is currently on the <strong>{selectedBusinessTier?.name}</strong> plan, which permits a maximum of <strong>{selectedBusinessTier?.maxJobs}</strong> active job listing{selectedBusinessTier?.maxJobs > 1 ? 's' : ''}.
                </p>
              </div>

              {/* Limit progress indicator bar */}
              <div style={{ width: '100%', maxWidth: '380px', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 700 }}>
                  <span>Listing Slots Used</span>
                  <span>{activeJobsCount} / {selectedBusinessTier?.maxJobs} Active Posts</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #fbbf24 100%)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '420px', marginTop: '0.75rem' }}>
                <Link href="/jobs/dashboard?tab=billing" style={{ textDecoration: 'none', flex: 1 }}>
                  <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', justifyContent: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Upgrade Subscription Plan ⚡
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Job Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder="e.g. San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Work Arrangement</label>
                  <select
                    className="input-field"
                    value={workArrangement}
                    onChange={(e) => setWorkArrangement(e.target.value)}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Job Type</label>
                  <select
                    className="input-field"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Seasonal">Seasonal</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Pay Type</label>
                  <select
                    className="input-field"
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
                  >
                    <option value="salary">Salary</option>
                    <option value="hourly">Hourly Pay</option>
                    <option value="contract">Contract Amount</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">{payType === 'hourly' ? 'Min Hourly (USD)' : payType === 'contract' ? 'Min Contract (USD)' : 'Minimum Salary (USD)'}</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder={payType === 'hourly' ? "30" : payType === 'contract' ? "5000" : "120000"}
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">{payType === 'hourly' ? 'Max Hourly (USD)' : payType === 'contract' ? 'Max Contract (USD)' : 'Maximum Salary (USD)'}</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      placeholder={payType === 'hourly' ? "50" : payType === 'contract' ? "10000" : "180000"}
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Job Description & Requirements</label>
                <textarea
                  required
                  className="input-field"
                  style={{ minHeight: '200px', resize: 'vertical' }}
                  placeholder="Describe the role, responsibilities, and ideal candidate..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Pricing Plan Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <label className="label">Select Listing Plan</label>
                <div className="grid-cols-2">

                  {/* Standard Tier Card */}
                  <div
                    onClick={() => setTier('standard')}
                    style={{
                      background: 'var(--surface-highlight)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: `2px solid ${tier === 'standard' ? 'var(--primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <input type="radio" checked={tier === 'standard'} readOnly style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Standard Listing</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Standard exposure. Active for 30 days. Perfect for basic or entry-level positions.
                    </p>
                    <div style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>$0.00</div>
                  </div>

                  {/* Featured Tier Card */}
                  <div
                    onClick={() => setTier('featured')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(250, 189, 47, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: `2px solid ${tier === 'featured' ? 'var(--primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: tier === 'featured' ? '0 8px 25px rgba(250,189,47,0.15)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', right: '-30px', top: '20px', background: 'var(--primary)', color: 'var(--bg-color)', fontSize: '0.65rem', fontWeight: 800, padding: '5px 40px', transform: 'rotate(45deg)', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 0, textAlign: 'center' }}>
                      Urgent
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <input type="radio" checked={tier === 'featured'} readOnly style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', zIndex: 1 }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        Featured Listing
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Golden highlighted styling, pinned to top of search, priority tags, and dynamic AI screening. Includes 24 hours of active boosted time (can be paused, but is non-transferable to other posts).
                    </p>
                    <div style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>$19.00 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ post</span></div>
                  </div>

                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center', marginTop: '1.5rem', cursor: 'pointer' }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : tier === 'featured' ? 'Proceed to Secure Checkout ➔' : 'Post Standard Job Now'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stripe Sandbox Secure Checkout Modal */}
      {showCheckout && (
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
        }} onClick={() => !isProcessingPayment && setShowCheckout(false)}>
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
            <div style={{ background: 'var(--surface-highlight)', padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Stripe Secure Checkout</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>🔒</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>CareerReport Business Portal Partner</p>
              </div>
              {!isProcessingPayment && (
                <button onClick={() => setShowCheckout(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}>✕</button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Order summary */}
              <div style={{ background: 'rgba(250, 189, 47, 0.05)', border: '1px dashed rgba(250, 189, 47, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Featured Posting Plan</span>
                  <span>$19.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Secured AI Integration</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Included</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  <span>Total Bill Due</span>
                  <span style={{ color: 'var(--primary)' }}>$19.00 USD</span>
                </div>
              </div>

              {/* Card inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alec Brandt"
                    className="input-field"
                    style={{ marginBottom: 0 }}
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4000 1234 5678 9010"
                    className="input-field"
                    style={{ marginBottom: 0 }}
                    value={cardNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Expiration (MM/YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="12/29"
                      className="input-field"
                      style={{ marginBottom: 0 }}
                      value={cardExpiry}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCardExpiry(val.length > 2 ? `${val.slice(0, 2)}/${val.slice(2, 4)}` : val);
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>CVC / CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="•••"
                      className="input-field"
                      style={{ marginBottom: 0 }}
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompleteFeaturedPost}
                disabled={isProcessingPayment || !cardName || cardNumber.length < 15}
                className="btn btn-primary"
                style={{
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(250, 189, 47, 0.25)'
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} />
                    <span>Processing Payment Securely...</span>
                  </>
                ) : (
                  <span>Pay $19.00 & List Position</span>
                )}
              </button>

              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem', opacity: 0.6 }}>
                By finalizing payment, you authorize Stripe to debit this card. Listed standard jobs can be upgraded at any time.
              </div>

            </div>

          </div>
        </div>
      )}
    </main>
  );
}
