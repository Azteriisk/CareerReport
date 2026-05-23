"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Zap, Star, TrendingUp, Target, CheckCircle, PauseCircle,
  ArrowRight, Sparkles, Building2, ChevronDown, Clock, BadgeCheck,
  Rocket, Eye, Filter, Lock, PlayCircle
} from 'lucide-react';

// Simple animated counter hook
function useCounter(target: number, duration: number = 1800, start: boolean = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const PRICING_TIERS = [
  {
    id: 'single',
    name: 'Single Boost',
    price: '$19',
    period: '1 month per listing',
    description: 'Perfect for individual positions or testing the feature.',
    features: [
      '30-day featured clock (pauseable)',
      'Gold-highlighted card in job board',
      'Candidate relevance matching badge',
      'Priority in intelligent feed algorithm',
      'Pinned above standard listings',
      'Non-transferable · bound to this listing',
    ],
    cta: 'Sponsor a Listing',
    highlight: false,
  },
  {
    id: 'bundle3',
    name: 'Triple Pack',
    price: '$49',
    period: '3 featured posts',
    description: 'Ideal for active hiring campaigns across multiple roles.',
    features: [
      'Everything in Single Boost',
      'Save $8 vs. individual pricing',
      'Use across any 3 listings',
      'Mix active & scheduled posts',
      'Priority email support',
    ],
    cta: 'Get Triple Pack',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'bundle10',
    name: 'Campaign Pack',
    price: '$149',
    period: '10 featured posts',
    description: 'Built for enterprise talent teams running multi-role campaigns.',
    features: [
      'Everything in Triple Pack',
      'Save $41 vs. individual pricing',
      'Dedicated account manager',
      'Priority placement guarantee',
      'Campaign performance report',
    ],
    cta: 'Launch Campaign',
    highlight: false,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    icon: <Zap size={22} />,
    number: '01',
    title: 'Sponsor any active listing',
    description:
      'In your Recruiter Dashboard, click "⚡ Sponsor Post — $19" next to any standard job post, or pre-purchase a Sponsorship Bundle pack at a discount. Acknowledge the non-transferable terms, and complete checkout — no subscription required.',
  },
  {
    icon: <Target size={22} />,
    number: '02',
    title: 'Instantly featured across the board',
    description:
      'Your listing is immediately promoted to featured status and rendered with a gold-highlighted border visible to every candidate browsing the job board.',
  },
  {
    icon: <Sparkles size={22} />,
    number: '03',
    title: 'Intelligent candidate matching',
    description:
      'Our relevance engine cross-references featured posts against each candidate\'s public resume, skills, and career context. Matching candidates see a "✨ Sponsored Match for You" badge.',
  },
  {
    icon: <TrendingUp size={22} />,
    number: '04',
    title: 'Pinned at the top of the feed',
    description:
      'Featured posts that match a candidate\'s profile are pinned above all standard listings in their personalized feed — maximizing visibility with the right talent.',
  },
  {
    icon: <PauseCircle size={22} />,
    number: '05',
    title: 'Pause & resume your clock anytime',
    description:
      'Need to slow spend? Hit ⏸ Pause Sponsorship from the dashboard to freeze the 30-day clock. Your listing reverts to standard placement while paused. Hit ▶ Resume to instantly re-activate featured status. Attentive admins can pause overnight and only run the clock during peak hiring hours.',
  },
];

const BENEFITS = [
  {
    icon: <Eye size={20} />,
    title: 'Maximum Visibility',
    desc: 'Your post appears above all standard listings in the candidate job feed, every time your sponsorship clock is running.',
  },
  {
    icon: <Target size={20} />,
    title: 'Precision Matching',
    desc: 'Sponsored posts get a +25-point boost in our AI relevance scoring engine, surfacing you to candidates whose resumes match your role.',
  },
  {
    icon: <BadgeCheck size={20} />,
    title: 'Trust Signal',
    desc: 'The gold "🔥 Featured" badge communicates urgency and employer investment to serious candidates.',
  },
  {
    icon: <Rocket size={20} />,
    title: 'Instant Activation',
    desc: 'No delays. The moment checkout completes, your listing is promoted across the entire platform in real time.',
  },
  {
    icon: <Filter size={20} />,
    title: 'Resume-Level Targeting',
    desc: 'Candidates with skills and titles matching your job description see your post first, highlighted with a "Sponsored Match for You" badge.',
  },
  {
    icon: <Clock size={20} />,
    title: '30-Day Pauseable Clock',
    desc: 'Each sponsorship runs for up to 30 cumulative days. Pause the clock overnight or on weekends to conserve budget — resume with one click to restore full featured placement.',
  },
  {
    icon: <DollarSign size={20} />,
    title: 'Bundle Discounts',
    desc: 'Purchase Triple Pack or Campaign Pack bundles from your Billing dashboard to save money on bulk credits. Credits never expire and can be applied instantly without entering payment details.',
  },
  {
    icon: <PauseCircle size={20} />,
    title: 'Full Pause / Resume Control',
    desc: 'Attentive recruiting admins can pause the sponsorship clock at any time. While paused, the listing reverts to standard placement. Resume instantly when you\'re ready to attract candidates again.',
  },
  {
    icon: <Lock size={20} />,
    title: 'Listing-Bound Sponsorship',
    desc: 'Each sponsorship credit is permanently tied to one specific listing and cannot be transferred. This guarantees genuine employer commitment and prevents gaming the featured system.',
  },
];

const FAQS = [
  {
    q: 'How is a sponsored post different from a standard listing?',
    a: 'Standard listings appear in chronological order by default. Sponsored (Featured) posts receive a gold highlighted card, a +25 point algorithmic boost, and are pinned above all standard listings for candidates whose resumes match your role. If a candidate\'s public resume matches your job title or required skills, they\'ll see a "✨ Sponsored Match for You" badge on your post.',
  },
  {
    q: 'Do I need a paid subscription to sponsor a post?',
    a: 'No. Sponsored job posts are a one-time, per-listing purchase — completely separate from your Recruiter Pro subscription. Any plan, including the free Starter tier, can sponsor individual listings.',
  },
  {
    q: 'How long does a sponsored post stay featured?',
    a: 'Each sponsorship runs for up to 30 cumulative calendar days. The clock only counts time while the sponsorship is actively running. Pausing the clock stops the countdown entirely, so you can stretch your budget across peak hiring windows.',
  },
  {
    q: 'Can I pause and resume my sponsorship?',
    a: 'Yes — this is a first-class feature. From the Manage Listings tab in your Recruiter Dashboard, click "⏸ Pause Sponsorship" on any active featured listing. While paused, the listing drops to standard placement and the 30-day clock freezes. Click "▶ Resume Sponsorship" at any time to instantly restore full featured status. Attentive admins can save budget by pausing overnight and resuming during peak candidate browsing hours.',
  },
  {
    q: 'Can I transfer my sponsorship to a different listing?',
    a: 'No. Sponsorship credits are permanently bound to the specific listing they were purchased for and cannot be reassigned, moved, or refunded. You must acknowledge this in the checkout modal before completing a purchase. This policy prevents gaming the featured system and ensures genuine employer commitment to every sponsored role.',
  },
  {
    q: 'Can I sponsor a job that\'s currently closed?',
    a: 'Yes. If you sponsor a closed listing, it will hold featured status. The highlighted placement will be visible immediately when you reopen the listing — and the clock will only count time while the listing is active and the sponsorship is unpaused. This is ideal for preparing for upcoming hiring cycles.',
  },
  {
    q: 'Is there a limit to how many posts I can sponsor?',
    a: 'There is no cap. You can sponsor as many active listings as you\'d like simultaneously. Bundle packs offer cost-effective credits for multiple sponsorships.',
  },
];

export default function SponsoredJobsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // Trigger counter animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const stat1 = useCounter(4, 1600, statsVisible);
  const stat2 = useCounter(89, 1800, statsVisible);
  const stat3 = useCounter(30, 1400, statsVisible);

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100dvh', color: 'var(--text-primary)' }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        {/* Decorative radial glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 70% 50% at 50% 0%, rgba(250,189,47,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 20% 80%, rgba(184,187,38,0.07) 0%, transparent 60%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(250,189,47,0.12)', color: 'var(--primary)',
            border: '1px solid rgba(250,189,47,0.3)', borderRadius: '20px',
            padding: '5px 14px', fontSize: '0.8rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.75rem',
          }}>
            <Zap size={13} fill="currentColor" /> Recruiter Growth Tool
          </span>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 3.75rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            marginBottom: '1.25rem',
            color: 'var(--text-primary)',
          }}>
            Reach the{' '}
            <span style={{
              background: 'linear-gradient(135deg, #fabd2f 0%, #fbbf24 50%, #b8bb26 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              right candidates
            </span>
            <br />before your competition does.
          </h1>

          <p style={{
            fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: '580px', margin: '0 auto 2.5rem',
          }}>
            Sponsored job posts on CareerReport are intelligently matched to candidates whose
            public resumes align with your role — pinned prominently above the fold, with
            a gold highlighted border that signals opportunity.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/jobs/dashboard?tab=jobs" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" id="hero-sponsor-cta" style={{
                padding: '0.9rem 2rem', fontSize: '1.05rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 0 25px rgba(250,189,47,0.3)',
              }}>
                Sponsor a Listing Now <ArrowRight size={18} />
              </button>
            </Link>
            <a href="#how-it-works" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" id="hero-learn-more" style={{
                padding: '0.9rem 2rem', fontSize: '1.05rem',
              }}>
                See How It Works
              </button>
            </a>
          </div>
        </div>

        {/* Live preview mockup strip */}
        <div style={{
          marginTop: '3.5rem', maxWidth: '760px', margin: '3.5rem auto 0',
          background: 'var(--surface-color)', borderRadius: '16px',
          border: '1px solid var(--glass-border)', padding: '1.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '0.75rem', paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fabd2f' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              careerreport.io/jobs
            </span>
          </div>

          {/* Featured Job Card Preview */}
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '10px',
            border: '2px solid rgba(250,189,47,0.55)',
            background: 'linear-gradient(135deg, rgba(250,189,47,0.06) 0%, rgba(251,191,36,0.01) 100%)',
            display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap',
            boxShadow: '0 6px 25px rgba(250,189,47,0.08)',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px',
              background: 'rgba(250,189,47,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={24} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Senior Product Engineer
                </span>
                <span style={{
                  background: 'rgba(250,189,47,0.18)', color: 'var(--primary)',
                  padding: '2px 9px', borderRadius: '20px', fontSize: '0.65rem',
                  fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em',
                  border: '1px solid rgba(250,189,47,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  boxShadow: '0 0 10px rgba(250,189,47,0.1)',
                }}>
                  ✨ Sponsored Match for You
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Acme Corp · San Francisco, CA · $130k – $165k
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
              Easy Apply
            </button>
          </div>

          {/* Standard card preview (muted) */}
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'var(--surface-color)',
            display: 'flex', gap: '1rem', alignItems: 'center',
            opacity: 0.5,
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px',
              background: 'var(--surface-highlight)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={22} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Frontend Developer</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                StartupXYZ · Remote · Competitive
              </div>
            </div>
          </div>

          <p style={{
            textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)',
            marginTop: '0.75rem', fontStyle: 'italic',
          }}>
            Sponsored posts appear prominently above standard listings in every candidate's personalized feed.
          </p>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section
        ref={statsRef}
        style={{
          borderBottom: '1px solid var(--glass-border)',
          padding: '3rem 1.5rem',
          background: 'var(--surface-color)',
        }}
      >
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem', textAlign: 'center',
        }}>
          {[
            { value: `${stat1}×`, label: 'More views vs. standard listings', sub: 'Average across sponsored posts' },
            { value: `${stat2}%`, label: 'Candidate relevance match rate', sub: 'When resume matches role' },
            { value: `${stat3}`, label: 'Days of featured placement', sub: 'Per sponsored listing' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: '3rem', fontWeight: 900, letterSpacing: '-2px',
                background: 'linear-gradient(135deg, #fabd2f 0%, #b8bb26 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {s.value}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(250,189,47,0.1)',
              color: 'var(--primary)', padding: '4px 14px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '1rem',
            }}>How It Works</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.75px' }}>
              From standard to featured in seconds
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              Sponsoring a job post requires no technical setup. The entire flow runs inside your
              existing Recruiter Dashboard.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={i} style={{
                background: 'var(--surface-color)', borderRadius: '16px',
                border: '1px solid var(--glass-border)', padding: '1.75rem',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250,189,47,0.4)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(235,219,178,0.1)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  fontSize: '2.25rem', fontWeight: 900, color: 'rgba(250,189,47,0.08)',
                  lineHeight: 1,
                }}>
                  {step.number}
                </div>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'rgba(250,189,47,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', marginBottom: '1.25rem',
                  border: '1px solid rgba(250,189,47,0.2)',
                }}>
                  {step.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS GRID ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(142,192,124,0.1)',
              color: 'var(--accent)', padding: '4px 14px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '1rem',
            }}>Why Sponsor</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.75px' }}>
              Every advantage, engineered into one post
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{
                background: 'var(--bg-color)', borderRadius: '12px',
                border: '1px solid var(--glass-border)', padding: '1.5rem',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: 'rgba(250,189,47,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', flexShrink: 0,
                  border: '1px solid rgba(250,189,47,0.15)',
                }}>
                  {b.icon}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                    {b.title}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(250,189,47,0.1)',
              color: 'var(--primary)', padding: '4px 14px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '1rem',
            }}>Pricing</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.75px' }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem' }}>
              No subscriptions required. One-time purchases, instant activation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {PRICING_TIERS.map(tier => (
              <div key={tier.id} style={{
                background: tier.highlight
                  ? 'linear-gradient(160deg, rgba(250,189,47,0.08) 0%, var(--surface-color) 60%)'
                  : 'var(--surface-color)',
                borderRadius: '20px',
                border: tier.highlight
                  ? '2px solid rgba(250,189,47,0.45)'
                  : '1px solid var(--glass-border)',
                padding: '2rem',
                position: 'relative',
                boxShadow: tier.highlight ? '0 20px 50px rgba(250,189,47,0.08)' : 'none',
              }}>
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #fabd2f 0%, #b8bb26 100%)',
                    color: '#282828', fontWeight: 800, fontSize: '0.7rem',
                    padding: '4px 14px', borderRadius: '20px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {tier.badge}
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                    {tier.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {tier.description}
                  </p>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <span style={{
                    fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-1.5px',
                    color: tier.highlight ? 'var(--primary)' : 'var(--text-primary)',
                  }}>
                    {tier.price}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: '6px' }}>
                    {tier.period}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem' }}>
                      <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/jobs/dashboard?tab=jobs" style={{ textDecoration: 'none' }}>
                  <button
                    id={`pricing-cta-${tier.id}`}
                    className={tier.highlight ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{
                      width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem',
                      justifyContent: 'center', cursor: 'pointer',
                      ...(tier.highlight
                        ? { boxShadow: '0 0 20px rgba(250,189,47,0.25)' }
                        : {}),
                    }}
                  >
                    {tier.cta} <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
            Bundle credits are applied per-listing from your dashboard. All purchases include immediate activation and a pauseable 30-day clock.
          </p>
        </div>
      </section>

      {/* ── SPONSOR CONTROLS CALLOUT ── */}
      <section style={{ padding: '4rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(250,189,47,0.07) 0%, var(--surface-color) 60%)',
            border: '1px solid rgba(250,189,47,0.25)',
            borderRadius: '20px',
            padding: '2.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(250,189,47,0.1)', color: 'var(--primary)',
                border: '1px solid rgba(250,189,47,0.2)', borderRadius: '20px',
                padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem',
              }}>
                <PauseCircle size={13} /> Sponsorship Controls
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.75rem' }}>
                Your clock,<br />your schedule.
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Savvy recruiting admins can stretch a $19 sponsorship across peak hiring windows by pausing
                the 30-day clock at night or on weekends — then resuming when candidates are most active.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 0 }}>
                <strong style={{ color: '#fb4934' }}>⚠ Non-Transferable:</strong> Each credit is permanently
                bound to the listing it was purchased for. It cannot be reassigned to another role.
                You'll confirm this before checkout.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  icon: <PlayCircle size={18} />,
                  state: 'Active',
                  color: 'var(--primary)',
                  bg: 'rgba(250,189,47,0.08)',
                  border: 'rgba(250,189,47,0.25)',
                  desc: 'Clock running · Gold card visible to candidates · +25pt relevance boost · Pinned above standard listings',
                },
                {
                  icon: <PauseCircle size={18} />,
                  state: 'Paused',
                  color: 'var(--text-secondary)',
                  bg: 'rgba(255,255,255,0.03)',
                  border: 'rgba(255,255,255,0.08)',
                  desc: 'Clock frozen · Listing shows as standard · No boost · Resume anytime to instantly restore featured status',
                },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: '12px',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    color: s.color, flexShrink: 0, marginTop: '1px',
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: `${s.bg}`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${s.border}`,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: s.color, marginBottom: '0.3rem' }}>
                      {s.state}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.75px' }}>
              Frequently asked questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-color)', borderRadius: '12px',
                  border: openFaq === i ? '1px solid rgba(250,189,47,0.35)' : '1px solid var(--glass-border)',
                  overflow: 'hidden', transition: 'border-color 0.2s',
                }}
              >
                <button
                  id={`faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    color: 'var(--text-primary)', padding: '1.2rem 1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '1rem', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700,
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    color="var(--primary)"
                    style={{
                      flexShrink: 0,
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                </button>

                {openFaq === i && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7,
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(250,189,47,0.08) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(250,189,47,0.1)', border: '1px solid rgba(250,189,47,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', margin: '0 auto 1.75rem', boxShadow: '0 0 35px rgba(250,189,47,0.12)',
          }}>
            <Star size={28} fill="currentColor" />
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '1rem' }}>
            Ready to be seen first?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Sponsor a job listing directly from your dashboard in under 60 seconds.
            No contracts, no subscriptions — just instant, targeted visibility.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/jobs/dashboard?tab=jobs" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" id="footer-sponsor-cta" style={{
                padding: '1rem 2.25rem', fontSize: '1.05rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 0 30px rgba(250,189,47,0.3)',
              }}>
                Go to My Dashboard <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/jobs" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" id="footer-view-board" style={{
                padding: '1rem 2rem', fontSize: '1.05rem',
              }}>
                View the Job Board
              </button>
            </Link>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .landing-container { min-height: 100dvh; }
        @media (max-width: 600px) {
          section { padding-left: 1rem !important; padding-right: 1rem !important; }
        }
      `}} />
    </div>
  );
}
