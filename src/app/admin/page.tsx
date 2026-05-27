'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, XCircle, Loader2, Building2, Zap, Users, BarChart3, Download, Clock, MessageSquare } from 'lucide-react';
import { BUSINESS_TIERS } from '@/lib/business-tier';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionResult { success?: boolean; error?: string; }

// ── Shared admin fetch helper ─────────────────────────────────────────────────

async function adminPost(endpoint: string, body: Record<string, unknown>): Promise<ActionResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Subcomponent: Result Banner ───────────────────────────────────────────────

function ResultBanner({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  const ok = result.success;
  return (
    <div style={{
      marginTop: '0.75rem',
      padding: '0.65rem 1rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      background: ok ? 'rgba(142,192,124,0.1)' : 'rgba(251,73,52,0.1)',
      border: `1px solid ${ok ? 'rgba(142,192,124,0.3)' : 'rgba(251,73,52,0.3)'}`,
      color: ok ? '#8ec07c' : '#fb4934',
    }}>
      {ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
      {ok ? 'Done!' : result.error ?? 'An error occurred.'}
    </div>
  );
}

// ── Panel: Business Tier Manager ──────────────────────────────────────────────

function TierPanel() {
  const [businessId, setBusinessId] = useState('');
  const [tierId, setTierId] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    const r = await adminPost('/api/admin/set-tier', { businessId: businessId.trim(), tierId });
    setResult(r);
    setLoading(false);
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <Building2 size={18} color="var(--primary)" />
        <h2 style={panelTitleStyle}>Business Tier Manager</h2>
      </div>
      <p style={descStyle}>Manually set the recruiter subscription tier for any business profile.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Business Profile ID</label>
          <input
            style={inputStyle}
            placeholder="uuid from business_profiles table"
            value={businessId}
            onChange={e => setBusinessId(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Target Tier</label>
          <select style={inputStyle} value={tierId} onChange={e => setTierId(e.target.value)}>
            {Object.values(BUSINESS_TIERS).map(t => (
              <option key={t.id} value={t.id}>{t.name} (${t.price}/mo)</option>
            ))}
          </select>
        </div>
        <button onClick={handle} disabled={!businessId || loading} style={btnStyle}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
          Apply Tier
        </button>
        <ResultBanner result={result} />
      </div>
    </section>
  );
}

// ── Panel: Sponsored Post Manager ─────────────────────────────────────────────

function SponsorPanel() {
  const [jobId, setJobId] = useState('');
  const [days, setDays] = useState('30');
  const [sponsored, setSponsored] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    const r = await adminPost('/api/admin/set-sponsored', {
      jobId: jobId.trim(),
      sponsored,
      daysFromNow: parseInt(days) || 30,
    });
    setResult(r);
    setLoading(false);
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <Zap size={18} color="var(--primary)" />
        <h2 style={panelTitleStyle}>Sponsored Post Manager</h2>
      </div>
      <p style={descStyle}>Manually activate or deactivate featured status on any job listing.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Job ID</label>
          <input
            style={inputStyle}
            placeholder="uuid from jobs table"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Action</label>
            <select style={inputStyle} value={sponsored ? 'activate' : 'deactivate'} onChange={e => setSponsored(e.target.value === 'activate')}>
              <option value="activate">Activate Sponsorship</option>
              <option value="deactivate">Deactivate Sponsorship</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Days from Now</label>
            <input
              style={inputStyle}
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={e => setDays(e.target.value)}
              disabled={!sponsored}
            />
          </div>
        </div>
        <button onClick={handle} disabled={!jobId || loading} style={btnStyle}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
          {sponsored ? 'Activate Featured' : 'Remove Featured'}
        </button>
        <ResultBanner result={result} />
      </div>
    </section>
  );
}

// ── Panel: User Pro Manager ───────────────────────────────────────────────────

function ProPanel() {
  const [targetUserId, setTargetUserId] = useState('');
  const [isPro, setIsPro] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    const r = await adminPost('/api/admin/set-pro', { targetUserId: targetUserId.trim(), isPro });
    setResult(r);
    setLoading(false);
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <Users size={18} color="var(--primary)" />
        <h2 style={panelTitleStyle}>User Pro Manager</h2>
      </div>
      <p style={descStyle}>Manually grant or revoke consumer Pro status for any user profile.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>User ID (Clerk / Supabase profiles.id)</label>
          <input
            style={inputStyle}
            placeholder="user_2abc... or uuid"
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Action</label>
          <select style={inputStyle} value={isPro ? 'grant' : 'revoke'} onChange={e => setIsPro(e.target.value === 'grant')}>
            <option value="grant">Grant Pro</option>
            <option value="revoke">Revoke Pro</option>
          </select>
        </div>
        <button onClick={handle} disabled={!targetUserId || loading} style={btnStyle}>
          {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
          {isPro ? 'Grant Pro Access' : 'Revoke Pro Access'}
        </button>
        <ResultBanner result={result} />
      </div>
    </section>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: 'var(--surface-color)',
  border: '1px solid var(--glass-border)',
  borderRadius: '16px',
  padding: '1.75rem',
};
const panelHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem',
};
const panelTitleStyle: React.CSSProperties = {
  margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)',
};
const descStyle: React.CSSProperties = {
  fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
  border: '1px solid var(--glass-border)', background: 'var(--bg-color)',
  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box',
  fontFamily: 'inherit',
};
const btnStyle: React.CSSProperties = {
  padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none',
  background: 'var(--primary)', color: 'var(--bg-color)', fontWeight: 700,
  fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
  gap: '0.5rem', width: 'fit-content',
};

// ── Panel: System Analytics Dashboard ──────────────────────────────────────────

function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    metrics: {
      directMessagesSent: number;
      uniqueGuestExports: number;
      signedInExports: number;
      totalExports: number;
    };
    recentEvents: Array<{ id: string; event_type: string; created_at: string }>;
  } | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch analytics.');
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <BarChart3 size={18} color="var(--primary)" />
        <h2 style={panelTitleStyle}>System Analytics Dashboard</h2>
      </div>
      <p style={descStyle}>Anonymized real-time operational insights, messaging activity, and resume export distributions.</p>
      
      {loading ? (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : error ? (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(251,73,52,0.1)',
          border: '1px solid rgba(251,73,52,0.3)',
          color: '#fb4934',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ Error: {error}</span>
          <button onClick={fetchAnalytics} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Retry</button>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            {/* Direct Messages */}
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Messages Sent</span>
                <MessageSquare size={16} color="var(--primary)" />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{data.metrics.directMessagesSent}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Anonymized deliveries</span>
            </div>

            {/* Guest Exports */}
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guest Exports</span>
                <Users size={16} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{data.metrics.uniqueGuestExports}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Unique non-account exports</span>
            </div>

            {/* Signed-in Exports */}
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>User Exports</span>
                <Download size={16} color="#10b981" />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{data.metrics.signedInExports}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cloud account exports</span>
            </div>

            {/* Total Exports */}
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Exports</span>
                <Download size={16} color="var(--text-primary)" />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{data.metrics.totalExports}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All time exports count</span>
            </div>
          </div>

          {/* Recent Event Log */}
          <div>
            <h4 style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Clock size={12} /> Live Event Activity Log
            </h4>
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              {data.recentEvents.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  No system events recorded yet.
                </div>
              ) : (
                data.recentEvents.map((evt, idx) => (
                  <div key={evt.id} style={{
                    padding: '0.75rem 1rem',
                    borderBottom: idx === data.recentEvents.length - 1 ? 'none' : '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    transition: 'background 0.2s'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: evt.event_type === 'direct_message_sent' ? 'var(--primary)' : evt.event_type === 'resume_export_guest' ? 'var(--accent)' : '#10b981'
                      }} />
                      {evt.event_type === 'direct_message_sent' && 'Direct Message Transmitted'}
                      {evt.event_type === 'resume_export_guest' && 'Guest PDF Resume Exported'}
                      {evt.event_type === 'resume_export_signed_in' && 'User PDF Resume Exported'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-color)',
      color: 'var(--text-primary)',
      padding: '3rem 1.5rem',
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(251,73,52,0.1)', border: '1px solid rgba(251,73,52,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={22} color="#fb4934" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              CareerReport internal management tools — restricted access
            </p>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          background: 'rgba(251,73,52,0.05)',
          border: '1px solid rgba(251,73,52,0.2)',
          borderRadius: '10px',
          padding: '0.85rem 1.1rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
          lineHeight: 1.55,
        }}>
          <strong style={{ color: '#fb4934' }}>⚠ Internal Tool.</strong> All actions here directly modify
          the production database. Changes are irreversible without a manual rollback.
          Use with care and verify job/business IDs before applying.
        </div>

        {/* Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnalyticsPanel />
          <TierPanel />
          <SponsorPanel />
          <ProPanel />
        </div>

        {/* SQL Hint */}
        <details style={{ marginTop: '2rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            📋 Supabase SQL — find business/job/user IDs
          </summary>
          <pre style={{
            marginTop: '0.75rem', padding: '1rem', borderRadius: '8px',
            background: 'var(--surface-color)', border: '1px solid var(--glass-border)',
            fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'auto', lineHeight: 1.6,
          }}>{`-- Find a business by name
SELECT id, name, bio FROM business_profiles WHERE name ILIKE '%acme%';

-- Find a job by title
SELECT id, title, status, sponsored_until FROM jobs WHERE title ILIKE '%engineer%';

-- Find a user by username
SELECT id, username, is_pro FROM profiles WHERE username ILIKE '%alex%';`}</pre>
        </details>

      </div>
    </div>
  );
}
