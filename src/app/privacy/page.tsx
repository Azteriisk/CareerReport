import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Calendar, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CareerReport',
  description: 'Understand how CareerReport collects, uses, and secures your personal and professional resume data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      padding: '4rem 1.5rem',
      backgroundImage: 'radial-gradient(circle at top right, rgba(250, 189, 47, 0.08), transparent 40%)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 600,
          marginBottom: '2rem',
          transition: 'color 0.2s',
        }} className="hover-opacity">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <header style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            background: 'rgba(250, 189, 47, 0.1)',
            borderRadius: '12px',
            color: 'var(--primary)',
            marginBottom: '1.25rem',
          }}>
            <Shield size={24} />
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
            fontWeight: 800,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}>
            Privacy Policy
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} /> Last Updated: May 17, 2026
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={14} /> Version 1.0
            </span>
          </div>
        </header>

        {/* Legal Content Card */}
        <div 
          className="glass-panel" 
          style={{
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            lineHeight: '1.7',
          }}
        >
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>1. Introduction</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Welcome to <strong>CareerReport</strong> ("we", "our", or "us"), operated by <strong>Azterisk</strong>. CareerReport is a modern, high-fidelity resume building and professional networking platform accessible via <code>https://careerreport.azterisk.net</code>.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              We respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, process, and secure your information when you create an account, build resumes, publish public profiles, or use our messaging and job boards.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>2. Information We Collect</h2>
            <p style={{ marginBottom: '1rem' }}>
              To provide the services on CareerReport, we collect information from you in the following ways:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Account & Identity Information:</strong> When you sign up using our identity provider, <strong>Clerk</strong>, we receive your email address, full name, profile photo, and unique account ID.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Resume & Professional Data:</strong> Any information you type into the resume builder, including contact information (phone, address, website), education history, employment details, skill lists, certifications, and portfolio details.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Social & Communication Data:</strong> Public posts, comments, follower connections, and direct messages sent between users on the CareerReport networking feed.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Technical Analytics:</strong> We use <strong>Vercel Analytics</strong> and <strong>Vercel Speed Insights</strong> to collect anonymized usage details, including page load latency, browser type, device type, and visited links, to keep our systems fast and stable.
              </li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '1rem' }}>
              We process your data strictly to deliver a premium user experience. Specifically, we use it to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Generate, host, and render your public professional resume and profile pages under your unique username.</li>
              <li>Authenticate your account safely and manage sessions securely via Clerk.</li>
              <li>Store your persistent data securely inside our relational database hosted by Supabase.</li>
              <li>Deliver instant messaging, real-time feed updates, comments, and job application features.</li>
              <li>Analyze performance metrics to fix site bugs and maintain 100% page-load uptime.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>4. Third-Party Service Providers</h2>
            <p style={{ marginBottom: '1rem' }}>
              We do not sell, rent, or trade your personal data. We partner with secure, world-class infrastructure services to run CareerReport:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Clerk:</strong> Manages authentication, identity validation, secure tokens, and login portals. Under Clerk's privacy policy, your credentials remain fully protected.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Supabase:</strong> Serves as our secure cloud database, storing profiles, resumes, and platform activities behind strict Row-Level Security (RLS) policies.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Vercel:</strong> Hosts our global edge serverless network, speed trackers, and analytics.
              </li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>5. Data Control & Deletion</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              You retain absolute ownership and control over your data:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>You can edit or delete any resume fields directly in the resume builder sidebar.</li>
              <li>You can update your profile photo, name, and email within the Account Settings popup.</li>
              <li>If you wish to permanently delete your entire profile and all associated data, you can request an absolute deletion by emailing our support desk, and all records will be purged from our database within 30 days.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>6. Contact Information</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact the Azterisk CareerReport Team at:
            </p>
            <div style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--glass-border)',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              marginTop: '1rem',
              display: 'inline-block',
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Email Support:</strong>{' '}
              <a href="mailto:support@azterisk.net" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                support@azterisk.net
              </a>
            </div>
          </section>
        </div>
        
        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} CareerReport by Azterisk. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
